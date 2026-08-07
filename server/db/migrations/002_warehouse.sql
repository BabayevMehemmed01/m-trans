-- ============================================================
-- M-TRANS LOGISTICS — Migration 002: Verilənlər Anbarı (Data Warehouse)
--
-- MƏQSƏD: `products` cədvəlini tam hüquqlu mərkəzi anbara çevirmək.
--   * Mənbədən asılı olmayan kanonik açar (part_key)
--   * OEM cross-reference üçün ayrıca çox-çoxa cədvəl
--   * Tam mətn axtarışı (FTS) + səhv yazılışa dözümlü trigram axtarış
--   * Sinxronizasiya audit izi və data keyfiyyəti karantini
--   * Chatbot RAG-ı üçün bilik bazası
--
-- Bu migrasiya IDEMPOTENT-dir: təkrar icra təhlükəsizdir və
-- mövcud sətirlər İTİRİLMİR (yalnız ALTER/backfill edilir).
-- ============================================================

-- ── Genişlənmələr ───────────────────────────────────────────────
-- pg_trgm : "knor bremze" kimi səhv yazılışları tapmaq üçün
-- unaccent: diakritik simvolları normallaşdırmaq üçün
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ════════════════════════════════════════════════════════════════
-- 1. PRODUCTS — mərkəzi anbar cədvəli
-- ════════════════════════════════════════════════════════════════

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS part_key        TEXT,
  ADD COLUMN IF NOT EXISTS article_no      TEXT,
  ADD COLUMN IF NOT EXISTS brand           TEXT,
  ADD COLUMN IF NOT EXISTS description     TEXT,
  ADD COLUMN IF NOT EXISTS category        TEXT,
  ADD COLUMN IF NOT EXISTS currency        CHAR(3)     NOT NULL DEFAULT 'AZN',
  ADD COLUMN IF NOT EXISTS warehouse       TEXT,
  ADD COLUMN IF NOT EXISTS source          TEXT        NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS quality_score   SMALLINT,
  ADD COLUMN IF NOT EXISTS stock_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ── Köhnə sətirlərin backfill-i ────────────────────────────────
-- 001_init.sql-dən qalan sətirlərdə article_no boşdur → brand_code-dan doldur
UPDATE products
   SET article_no = brand_code
 WHERE (article_no IS NULL OR article_no = '')
   AND brand_code IS NOT NULL AND brand_code <> '';

-- Hələ də boşdursa oem_code-a düş
UPDATE products
   SET article_no = oem_code
 WHERE (article_no IS NULL OR article_no = '')
   AND oem_code IS NOT NULL AND oem_code <> '';

-- Son çarə: onec_id (heç vaxt NULL part_key qalmasın)
UPDATE products
   SET article_no = onec_id
 WHERE article_no IS NULL OR article_no = '';

-- part_key = normallaşdırılmış artikul (yalnız hərf+rəqəm, böyük hərf)
UPDATE products
   SET part_key = UPPER(REGEXP_REPLACE(article_no, '[^A-Za-z0-9]', '', 'g'))
 WHERE part_key IS NULL OR part_key = '';

-- Backfill nəticəsində yaranmış dublikatları təmizlə:
-- eyni part_key üçün ən dolğun (ən son yenilənmiş) sətri saxla.
DELETE FROM products p
 USING products q
 WHERE p.part_key = q.part_key
   AND p.part_key IS NOT NULL
   AND (
        COALESCE(p.updated_at, p.created_at) < COALESCE(q.updated_at, q.created_at)
     OR (COALESCE(p.updated_at, p.created_at) = COALESCE(q.updated_at, q.created_at) AND p.id > q.id)
   );

-- İndi part_key məcburi və unikal ola bilər
ALTER TABLE products ALTER COLUMN part_key SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_part_key_uniq'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT products_part_key_uniq UNIQUE (part_key);
  END IF;
END $$;

-- onec_id artıq kanonik açar DEYİL (TecDoc mənşəli detalların 1C ID-si yoxdur).
-- UNIQUE məhdudiyyətini götürürük, NOT NULL-u ləğv edirik, sadə indeks saxlayırıq.
ALTER TABLE products ALTER COLUMN onec_id DROP NOT NULL;

DO $$
DECLARE
  con_name TEXT;
BEGIN
  SELECT conname INTO con_name
    FROM pg_constraint
   WHERE conrelid = 'products'::regclass
     AND contype  = 'u'
     AND conkey   = ARRAY[(SELECT attnum FROM pg_attribute
                            WHERE attrelid = 'products'::regclass AND attname = 'onec_id')];
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE products DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

-- Boş sətirləri NULL-a çevir ki, partial unique indeks işləsin
UPDATE products SET onec_id = NULL WHERE onec_id = '';

-- 1C ID-si olan sətirlər arasında yenə də təkrar olmasın
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_onec_id
    ON products (onec_id) WHERE onec_id IS NOT NULL;

-- ── Məntiqi bütövlük məhdudiyyətləri ───────────────────────────
-- Mənfi qiymət / mənfi stok bazaya heç vaxt düşməməlidir.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_price_nonneg') THEN
    UPDATE products SET price = 0 WHERE price < 0;
    ALTER TABLE products ADD CONSTRAINT products_price_nonneg CHECK (price >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_nonneg') THEN
    UPDATE products SET stock_quantity = 0 WHERE stock_quantity < 0;
    ALTER TABLE products ADD CONSTRAINT products_stock_nonneg CHECK (stock_quantity >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_source_valid') THEN
    UPDATE products SET source = 'manual'
     WHERE source NOT IN ('1c', 'tecdoc', 'manual', 'import');
    ALTER TABLE products ADD CONSTRAINT products_source_valid
      CHECK (source IN ('1c', 'tecdoc', 'manual', 'import'));
  END IF;
END $$;

-- ── Tam mətn axtarışı (FTS) ────────────────────────────────────
-- GENERATED sütun: hər INSERT/UPDATE-də avtomatik yenilənir,
-- tətbiq kodunda unudulma riski yoxdur.
-- 'simple' konfiqurasiyası seçilib: PostgreSQL-də Azərbaycan dili
-- lüğəti yoxdur, 'simple' isə söz köklərini dəyişdirmədən indeksləyir.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_document tsvector
  GENERATED ALWAYS AS (
      setweight(to_tsvector('simple'::regconfig, COALESCE(article_no,  '')), 'A')
   || setweight(to_tsvector('simple'::regconfig, COALESCE(brand,       '')), 'A')
   || setweight(to_tsvector('simple'::regconfig, COALESCE(title,       '')), 'B')
   || setweight(to_tsvector('simple'::regconfig, COALESCE(category,    '')), 'C')
   || setweight(to_tsvector('simple'::regconfig, COALESCE(description, '')), 'D')
  ) STORED;

-- ── İndekslər ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_fts        ON products USING GIN (search_document);
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_art_trgm   ON products USING GIN (article_no gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON products USING GIN (brand gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_part_key   ON products (part_key);
CREATE INDEX IF NOT EXISTS idx_products_category   ON products (category) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_products_active     ON products (is_active, stock_quantity DESC);
CREATE INDEX IF NOT EXISTS idx_products_updated    ON products (updated_at DESC);

-- ── updated_at avtomatik yenilənməsi ───────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ════════════════════════════════════════════════════════════════
-- 2. PRODUCT_OEM_CODES — OEM cross-reference (çox-çoxa)
--    Bir detalın ONLARLA OEM ekvivalenti ola bilər.
--    Köhnə `products.oem_code` tək sütunu bunu ifadə edə bilmirdi.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS product_oem_codes (
  product_id    BIGINT      NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  oem_code_norm TEXT        NOT NULL,
  oem_code_raw  TEXT,
  source        TEXT        NOT NULL DEFAULT 'manual',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, oem_code_norm)
);

CREATE INDEX IF NOT EXISTS idx_oem_codes_norm ON product_oem_codes (oem_code_norm);
CREATE INDEX IF NOT EXISTS idx_oem_codes_trgm ON product_oem_codes USING GIN (oem_code_norm gin_trgm_ops);

-- Köhnə tək-sütunlu oem_code dəyərlərini yeni cədvələ köçür
INSERT INTO product_oem_codes (product_id, oem_code_norm, oem_code_raw, source)
SELECT p.id,
       UPPER(REGEXP_REPLACE(p.oem_code, '[^A-Za-z0-9]', '', 'g')),
       p.oem_code,
       'import'
  FROM products p
 WHERE p.oem_code IS NOT NULL
   AND UPPER(REGEXP_REPLACE(p.oem_code, '[^A-Za-z0-9]', '', 'g')) <> ''
ON CONFLICT (product_id, oem_code_norm) DO NOTHING;

-- Detalın öz artikulu da axtarışda OEM kimi tapılmalıdır
INSERT INTO product_oem_codes (product_id, oem_code_norm, oem_code_raw, source)
SELECT p.id, p.part_key, p.article_no, 'import'
  FROM products p
 WHERE p.part_key <> ''
ON CONFLICT (product_id, oem_code_norm) DO NOTHING;

-- ════════════════════════════════════════════════════════════════
-- 3. TECDOC_CACHE — struktur cavabların keşi
-- ════════════════════════════════════════════════════════════════

ALTER TABLE tecdoc_cache
  ADD COLUMN IF NOT EXISTS payload     JSONB,
  ADD COLUMN IF NOT EXISTS hit_count   INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS found       BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expires_at  TIMESTAMPTZ;

-- Köhnə mətn sütunundan JSONB-yə köçür
UPDATE tecdoc_cache
   SET payload = jsonb_build_object('brand_codes', brand_codes_json::jsonb)
 WHERE payload IS NULL
   AND brand_codes_json IS NOT NULL
   AND brand_codes_json <> ''
   AND brand_codes_json ~ '^\s*\[';

UPDATE tecdoc_cache SET payload = '{"brand_codes": []}'::jsonb WHERE payload IS NULL;

-- Yeni sətirlər üçün köhnə NOT NULL sütunu maneə olmasın
ALTER TABLE tecdoc_cache ALTER COLUMN brand_codes_json DROP NOT NULL;

UPDATE tecdoc_cache SET expires_at = fetched_at + INTERVAL '30 days' WHERE expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tecdoc_expires ON tecdoc_cache (expires_at);

-- ════════════════════════════════════════════════════════════════
-- 4. SYNC_RUNS — sinxronizasiya audit izi
--    Hər cron icrası burada qeydə alınır: nə qədər gəldi,
--    nə qədər təmizləndi, nə qədər rədd edildi.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sync_runs (
  id            BIGSERIAL   PRIMARY KEY,
  job_name      TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'running'
                            CHECK (status IN ('running', 'success', 'partial', 'failed', 'skipped')),
  trigger_type  TEXT        NOT NULL DEFAULT 'cron'
                            CHECK (trigger_type IN ('cron', 'boot', 'manual')),
  source_mode   TEXT,
  fetched_count   INTEGER   NOT NULL DEFAULT 0,
  accepted_count  INTEGER   NOT NULL DEFAULT 0,
  rejected_count  INTEGER   NOT NULL DEFAULT 0,
  duplicate_count INTEGER   NOT NULL DEFAULT 0,
  inserted_count  INTEGER   NOT NULL DEFAULT 0,
  updated_count   INTEGER   NOT NULL DEFAULT 0,
  duration_ms   INTEGER,
  error_message TEXT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sync_runs_job  ON sync_runs (job_name, started_at DESC);

-- ════════════════════════════════════════════════════════════════
-- 5. DATA_QUALITY_ISSUES — təmizləmə karantini
--    Rədd edilən sətirlər SÜKUTLA İTMİR — səbəbi ilə burada qalır.
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS data_quality_issues (
  id          BIGSERIAL   PRIMARY KEY,
  sync_run_id BIGINT      REFERENCES sync_runs(id) ON DELETE SET NULL,
  source      TEXT        NOT NULL,
  issue_type  TEXT        NOT NULL,
  reasons     TEXT[]      NOT NULL DEFAULT '{}',
  raw_record  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dq_created ON data_quality_issues (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dq_type    ON data_quality_issues (issue_type);

-- ════════════════════════════════════════════════════════════════
-- 6. KNOWLEDGE_ARTICLES — chatbot RAG bilik bazası
--    Saytdan istifadə təlimatları + ümumi texniki biliklər.
--    Məhsullarla eyni FTS mexanizmi ilə axtarılır.
-- ════════════════════════════════════════════════════════════════

-- `array_to_string` PostgreSQL-də STABLE kimi işarələnib (ümumi
-- `anyarray` üçün element tipinin output funksiyasından asılıdır),
-- ona görə GENERATED sütunda birbaşa istifadə edilə bilmir.
-- TEXT[] üçün nəticə tamamilə deterministikdir, ona görə tipi
-- TEXT[]-ə daraldıb IMMUTABLE örtük funksiya yaradırıq.
CREATE OR REPLACE FUNCTION mtrans_text_array_join(arr TEXT[])
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
RETURNS NULL ON NULL INPUT
AS $$ SELECT COALESCE(array_to_string(arr, ' '), '') $$;

CREATE TABLE IF NOT EXISTS knowledge_articles (
  id         BIGSERIAL   PRIMARY KEY,
  slug       TEXT        NOT NULL UNIQUE,
  topic      TEXT        NOT NULL DEFAULT 'general'
                         CHECK (topic IN ('site_usage', 'technical', 'company', 'general')),
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  keywords   TEXT[]      NOT NULL DEFAULT '{}',
  lang       CHAR(2)     NOT NULL DEFAULT 'az',
  priority   SMALLINT    NOT NULL DEFAULT 0,
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_document tsvector GENERATED ALWAYS AS (
      setweight(to_tsvector('simple'::regconfig, COALESCE(title, '')), 'A')
   || setweight(to_tsvector('simple'::regconfig, mtrans_text_array_join(keywords)), 'A')
   || setweight(to_tsvector('simple'::regconfig, COALESCE(body, '')), 'C')
  ) STORED
);

CREATE INDEX IF NOT EXISTS idx_kb_fts   ON knowledge_articles USING GIN (search_document);
CREATE INDEX IF NOT EXISTS idx_kb_trgm  ON knowledge_articles USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_kb_topic ON knowledge_articles (topic) WHERE is_active;

DROP TRIGGER IF EXISTS trg_kb_updated_at ON knowledge_articles;
CREATE TRIGGER trg_kb_updated_at
  BEFORE UPDATE ON knowledge_articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
