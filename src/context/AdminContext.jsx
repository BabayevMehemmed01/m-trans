// =================================================================
// FAYL: src/context/AdminContext.jsx
// TƏSVİR: Anbardar Paneli — Parts FULL CRUD + Promo CRUD
//         DEFAULT məhsullar QİYMƏTLƏ, edit/delete hər ikisi üçün
// =================================================================

import React, { createContext, useContext, useState, useCallback } from 'react';

const AdminContext = createContext(null);

// ── Default promokodlar ──────────────────────────────────────────
const DEFAULT_PROMOS = [
  { id: 'p1', code: 'MTRANS10', discount: 10, type: 'percent', active: true,  uses: 0 },
  { id: 'p2', code: 'SPARE20',  discount: 20, type: 'percent', active: true,  uses: 0 },
  { id: 'p3', code: 'VIP50',    discount: 50, type: 'fixed',   active: false, uses: 0 },
];

// ── DEFAULT MƏHSULLAR — QİYMƏTLƏRLƏ ────────────────────────────
// Bunlar hər zaman görünür; admin edit/delete edə bilir
export const DEFAULT_PARTS = [
  { id: 'def_1',  oemCode: 'K020345',  brand: 'Knorr-Bremse', nameKey: 'part1_name', catKey: 'parts_category_brakes',        descKey: 'part1_desc', img: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=600&q=80', compatibility: 'Volvo FH, Actros MP4, Scania R',  price: 285, currency: 'AZN', isDefault: true },
  { id: 'def_2',  oemCode: 'WB911504', brand: 'WABCO',         nameKey: 'part2_name', catKey: 'parts_category_pneumatics',   descKey: 'part2_desc', img: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&q=80', compatibility: 'MAN TGX, DAF XF, Actros',          price: 420, currency: 'AZN', isDefault: true },
  { id: 'def_3',  oemCode: 'E500KP02', brand: 'Hengst',        nameKey: 'part3_name', catKey: 'parts_category_filters',      descKey: 'part3_desc', img: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80', compatibility: 'Volvo FH16, Scania Streamline',    price: 120, currency: 'AZN', isDefault: true },
  { id: 'def_4',  oemCode: 'VL214589', brand: 'Volvo OEM',     nameKey: 'part4_name', catKey: 'parts_category_electronics',  descKey: 'part4_desc', img: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&q=80', compatibility: 'Volvo FH4, Volvo FM',              price: 890, currency: 'AZN', isDefault: true },
  { id: 'def_5',  oemCode: 'SA315480', brand: 'Sachs',         nameKey: 'part5_name', catKey: 'parts_category_suspension',   descKey: 'part5_desc', img: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80', compatibility: 'Mercedes Actros, DAF 105',        price: 350, currency: 'AZN', isDefault: true },
  { id: 'def_6',  oemCode: 'BS020147', brand: 'Bosch',         nameKey: 'part6_name', catKey: 'parts_category_transmission', descKey: 'part6_desc', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80', compatibility: 'MAN TGA, Scania P-series',        price: 560, currency: 'AZN', isDefault: true },
  { id: 'def_7',  oemCode: 'H300W01',  brand: 'Hengst',        nameKey: 'part7_name', catKey: 'parts_category_filters',      descKey: 'part7_desc', img: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&q=80', compatibility: 'Mercedes Actros MP5, DAF XF',     price: 155, currency: 'AZN', isDefault: true },
  { id: 'def_8',  oemCode: 'MB004541', brand: 'Mercedes OEM',  nameKey: 'part8_name', catKey: 'parts_category_electronics',  descKey: 'part8_desc', img: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=600&q=80', compatibility: 'Mercedes Actros MP4',              price: 1240, currency: 'AZN', isDefault: true },
  { id: 'def_9',  oemCode: 'K048122',  brand: 'Knorr-Bremse', nameKey: 'part1_name', catKey: 'parts_category_brakes',        descKey: 'part1_desc', img: 'https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=600&q=80', compatibility: 'MAN TGX, Volvo FM',               price: 310, currency: 'AZN', isDefault: true },
  { id: 'def_10', oemCode: 'WB472195', brand: 'WABCO',         nameKey: 'part2_name', catKey: 'parts_category_pneumatics',   descKey: 'part2_desc', img: 'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&q=80', compatibility: 'Scania R450, DAF XF106',          price: 380, currency: 'AZN', isDefault: true },
  { id: 'def_11', oemCode: 'SA290123', brand: 'Sachs',         nameKey: 'part5_name', catKey: 'parts_category_suspension',   descKey: 'part5_desc', img: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80', compatibility: 'Volvo FH13, Renault T-Range',     price: 290, currency: 'AZN', isDefault: true },
  { id: 'def_12', oemCode: 'CAT09845', brand: 'CAT OEM',       nameKey: 'part6_name', catKey: 'parts_category_engine',       descKey: 'part6_desc', img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&q=80', compatibility: 'Caterpillar Heavy Machinery',      price: 730, currency: 'AZN', isDefault: true },
];

// ── Storage helpers ──────────────────────────────────────────────
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ── Provider ─────────────────────────────────────────────────────
export function AdminProvider({ children }) {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    () => localStorage.getItem('mtrans_admin_auth') === 'true'
  );

  // Anbardarın sonradan əlavə etdiyi detallar (localStorage-da)
  const [adminParts, setAdminParts] = useState(
    () => loadFromStorage('mtrans_admin_parts', [])
  );

  // Default məhsullara admin düzəlişlər (override)
  const [defaultOverrides, setDefaultOverrides] = useState(
    () => loadFromStorage('mtrans_default_overrides', {})
  );

  // Silinmiş default ID-lər
  const [deletedDefaults, setDeletedDefaults] = useState(
    () => loadFromStorage('mtrans_deleted_defaults', [])
  );

  // Promo kodlar
  const [promos, setPromos] = useState(
    () => loadFromStorage('mtrans_promos', DEFAULT_PROMOS)
  );

  // Merge default + admin parts (deletedDefaults + overrides tətbiq edilmiş)
  const allParts = React.useMemo(() => {
    const defaults = DEFAULT_PARTS
      .filter(p => !deletedDefaults.includes(p.id))
      .map(p => ({
        ...p,
        ...(defaultOverrides[p.id] || {}),
      }));
    return [...adminParts, ...defaults];
  }, [adminParts, deletedDefaults, defaultOverrides]);

  // ── AUTH ───────────────────────────────────────────────────────
  const adminLogin = useCallback((password) => {
    const ok = password === 'admin1234';
    if (ok) {
      localStorage.setItem('mtrans_admin_auth', 'true');
      setIsAdminLoggedIn(true);
    }
    return ok;
  }, []);

  const adminLogout = useCallback(() => {
    localStorage.removeItem('mtrans_admin_auth');
    setIsAdminLoggedIn(false);
  }, []);

  // ── PARTS CRUD ────────────────────────────────────────────────
  const addPart = useCallback((part) => {
    const newPart = {
      ...part,
      id: `admin_${Date.now()}`,
      isAdminPart: true,
      createdAt: new Date().toISOString(),
    };
    setAdminParts(prev => {
      const updated = [newPart, ...prev];
      saveToStorage('mtrans_admin_parts', updated);
      return updated;
    });
    return newPart;
  }, []);

  const updatePart = useCallback((id, patch) => {
    // Admin tərəfindən əlavə edilmiş məhsul?
    const isAdmin = id.toString().startsWith('admin_');
    const isDef   = id.toString().startsWith('def_');

    if (isAdmin) {
      setAdminParts(prev => {
        const updated = prev.map(p => p.id === id ? { ...p, ...patch } : p);
        saveToStorage('mtrans_admin_parts', updated);
        return updated;
      });
    } else if (isDef) {
      setDefaultOverrides(prev => {
        const updated = { ...prev, [id]: { ...(prev[id] || {}), ...patch } };
        saveToStorage('mtrans_default_overrides', updated);
        return updated;
      });
    }
  }, []);

  const deletePart = useCallback((id) => {
    const isAdmin = id.toString().startsWith('admin_');
    const isDef   = id.toString().startsWith('def_');

    if (isAdmin) {
      setAdminParts(prev => {
        const updated = prev.filter(p => p.id !== id);
        saveToStorage('mtrans_admin_parts', updated);
        return updated;
      });
    } else if (isDef) {
      setDeletedDefaults(prev => {
        const updated = [...prev, id];
        saveToStorage('mtrans_deleted_defaults', updated);
        return updated;
      });
      // Override-ları da sil
      setDefaultOverrides(prev => {
        const { [id]: _, ...rest } = prev;
        saveToStorage('mtrans_default_overrides', rest);
        return rest;
      });
    }
  }, []);

  // Default məhsulu bərpa et
  const restoreDefault = useCallback((id) => {
    setDeletedDefaults(prev => {
      const updated = prev.filter(d => d !== id);
      saveToStorage('mtrans_deleted_defaults', updated);
      return updated;
    });
  }, []);

  // ── PROMO CRUD ────────────────────────────────────────────────
  const addPromo = useCallback((promo) => {
    const newPromo = { ...promo, id: `promo_${Date.now()}`, uses: 0 };
    setPromos(prev => {
      const updated = [newPromo, ...prev];
      saveToStorage('mtrans_promos', updated);
      return updated;
    });
  }, []);

  const updatePromo = useCallback((id, patch) => {
    setPromos(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...patch } : p);
      saveToStorage('mtrans_promos', updated);
      return updated;
    });
  }, []);

  const deletePromo = useCallback((id) => {
    setPromos(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveToStorage('mtrans_promos', updated);
      return updated;
    });
  }, []);

  const validatePromo = useCallback((code) => {
    const found = promos.find(p => p.code.toUpperCase() === code.toUpperCase().trim());
    if (!found) return { valid: false, reason: 'not_found' };
    if (!found.active) return { valid: false, reason: 'inactive' };
    return { valid: true, promo: found };
  }, [promos]);

  return (
    <AdminContext.Provider value={{
      isAdminLoggedIn, adminLogin, adminLogout,
      adminParts, allParts,
      addPart, updatePart, deletePart, restoreDefault,
      deletedDefaults,
      promos, addPromo, updatePromo, deletePromo, validatePromo,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be inside AdminProvider');
  return ctx;
}
