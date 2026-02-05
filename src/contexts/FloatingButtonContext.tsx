import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FloatingButtonContextType {
  isFloatingBuyVisible: boolean;
  setIsFloatingBuyVisible: (visible: boolean) => void;
}

const FloatingButtonContext = createContext<FloatingButtonContextType | undefined>(undefined);

export function FloatingButtonProvider({ children }: { children: ReactNode }) {
  const [isFloatingBuyVisible, setIsFloatingBuyVisible] = useState(false);

  return (
    <FloatingButtonContext.Provider value={{ isFloatingBuyVisible, setIsFloatingBuyVisible }}>
      {children}
    </FloatingButtonContext.Provider>
  );
}

export function useFloatingButton() {
  const context = useContext(FloatingButtonContext);
  if (context === undefined) {
    throw new Error('useFloatingButton must be used within a FloatingButtonProvider');
  }
  return context;
}
