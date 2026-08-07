// =================================================================
// FAYL: src/context/CartContext.jsx
// TƏSVİR: Alış-veriş Səbəti + Promokod sistemi
// =================================================================

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems]           = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [promoCode, setPromoCode]   = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, discount, type }
  const [promoError, setPromoError] = useState('');

  // ── CART ACTIONS ────────────────────────────────────────────────
  const addToCart = useCallback((part) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === part.id);
      if (existing) {
        return prev.map(i => i.id === part.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...part, qty: 1 }];
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((id) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const updateQty = useCallback((id, qty) => {
    if (qty < 1) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  }, []);

  // ── PROMO ────────────────────────────────────────────────────────
  const applyPromo = useCallback((validateFn, code) => {
    const result = validateFn(code);
    if (result.valid) {
      setAppliedPromo(result.promo);
      setPromoError('');
    } else {
      setAppliedPromo(null);
      setPromoError(result.reason); // 'not_found' | 'inactive'
    }
    return result;
  }, []);

  const removePromo = useCallback(() => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  }, []);

  // ── TOTALS ───────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => {
      const price = parseFloat(i.price) || 0;
      return sum + price * i.qty;
    }, 0);

    let discount = 0;
    if (appliedPromo) {
      if (appliedPromo.type === 'percent') {
        discount = (subtotal * appliedPromo.discount) / 100;
      } else {
        discount = Math.min(appliedPromo.discount, subtotal);
      }
    }

    return {
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
      itemCount: items.reduce((s, i) => s + i.qty, 0),
    };
  }, [items, appliedPromo]);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQty, clearCart,
      isCartOpen, setIsCartOpen,
      promoCode, setPromoCode,
      appliedPromo, promoError,
      applyPromo, removePromo,
      totals,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
