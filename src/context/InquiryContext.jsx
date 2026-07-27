import React, { createContext, useContext, useState, useEffect } from 'react';

const InquiryContext = createContext();

export function InquiryProvider({ children }) {
  const [inquiryList, setInquiryList] = useState(() => {
    try {
      const saved = localStorage.getItem('mtrans_inquiry_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [vinNumber, setVinNumber] = useState(() => {
    try {
      return localStorage.getItem('mtrans_vin_code') || '';
    } catch {
      return '';
    }
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeModalPart, setActiveModalPart] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('mtrans_inquiry_list', JSON.stringify(inquiryList));
    } catch (e) {
      console.error(e);
    }
  }, [inquiryList]);

  useEffect(() => {
    try {
      localStorage.setItem('mtrans_vin_code', vinNumber);
    } catch (e) {
      console.error(e);
    }
  }, [vinNumber]);

  const addToInquiry = (part, quantity = 1) => {
    setInquiryList(prev => {
      const existingIndex = prev.findIndex(item => item.id === part.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { ...part, quantity }];
    });
  };

  const removeFromInquiry = (partId) => {
    setInquiryList(prev => prev.filter(item => item.id !== partId));
  };

  const updateQuantity = (partId, quantity) => {
    if (quantity <= 0) {
      removeFromInquiry(partId);
      return;
    }
    setInquiryList(prev =>
      prev.map(item => (item.id === partId ? { ...item, quantity } : item))
    );
  };

  const clearInquiry = () => {
    setInquiryList([]);
  };

  const totalItemsCount = inquiryList.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <InquiryContext.Provider
      value={{
        inquiryList,
        addToInquiry,
        removeFromInquiry,
        updateQuantity,
        clearInquiry,
        totalItemsCount,
        vinNumber,
        setVinNumber,
        isDrawerOpen,
        setIsDrawerOpen,
        activeModalPart,
        setActiveModalPart
      }}
    >
      {children}
    </InquiryContext.Provider>
  );
}

export function useInquiry() {
  const context = useContext(InquiryContext);
  if (!context) {
    throw new Error('useInquiry must be used within an InquiryProvider');
  }
  return context;
}
