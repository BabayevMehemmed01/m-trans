-- ============================================================
-- M-TRANS LOGISTICS — Database Migration 001
-- PostgreSQL cədvəlləri: products + tecdoc_cache
--
-- İcra etmək üçün:
--   psql -U postgres -d truck_parts_db -f server/db/migrations/001_init.sql
-- ============================================================

-- ── 1. products: 1C-dən sinxronlaşdırılan ehtiyat hissələri ─────
CREATE TABLE IF NOT EXISTS products (
  id             SERIAL          PRIMARY KEY,
  onec_id        VARCHAR(100)    UNIQUE NOT NULL,
  title          VARCHAR(500)    NOT NULL,
  brand_code     VARCHAR(100),
  oem_code       VARCHAR(100),
  price          NUMERIC(12, 2)  DEFAULT 0,
  stock_quantity INTEGER         DEFAULT 0,
  updated_at     TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_brand_code ON products(brand_code);
CREATE INDEX IF NOT EXISTS idx_products_oem_code   ON products(oem_code);

-- ── 2. tecdoc_cache: OEM → brend kodları cross-reference cache ──
CREATE TABLE IF NOT EXISTS tecdoc_cache (
  id              SERIAL       PRIMARY KEY,
  oem_code        VARCHAR(100) UNIQUE NOT NULL,
  brand_codes_json TEXT         NOT NULL,   -- JSON array sətri, e.g. '["K020345","WB123"]'
  created_at      TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tecdoc_oem ON tecdoc_cache(oem_code);

-- ── 3. Nümunə məlumatlar (optional) ─────────────────────────────
INSERT INTO products (onec_id, title, brand_code, oem_code, price, stock_quantity)
VALUES
  ('1C-0001', 'Knorr-Bremse Əyin Bloku K020345',           'K020345',  'K020345',  185.00, 24),
  ('1C-0002', 'WABCO Pnevmatik Valf WB911504',             'WB911504', 'WB911504', 320.50,  8),
  ('1C-0003', 'Hengst Mühərrik Filtri E500KP02',           'E500KP02', 'E500KP02',  45.00, 60),
  ('1C-0004', 'Volvo OEM Sensor VL214589',                 'VL214589', 'VL214589', 210.00, 12),
  ('1C-0005', 'Sachs Amortizator SA315480',                'SA315480', 'SA315480', 450.00,  6),
  ('1C-0006', 'Bosch Enjeksiya Pompası BS020147',          'BS020147', 'BS020147', 890.00,  3)
ON CONFLICT (onec_id) DO NOTHING;
