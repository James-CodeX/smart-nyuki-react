import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import logger from '@/utils/logger';


interface SidebarContextType {
  collapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Load persisted sidebar state from localStorage
const getPersistedSidebarState = (): boolean => {
  try {
    const persistedState = localStorage.getItem('sidebar-collapsed');
    if (persistedState !== null) {
      return JSON.parse(persistedState);
    }
  } catch (error) {
    logger.error('Error loading persisted sidebar state:', error);
  }
  return false; // Default to expanded
};

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(getPersistedSidebarState());

  const toggleSidebar = () => {
    setCollapsed(prev => !prev);
  };

  // Persist sidebar state to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
    } catch (error) {
      logger.error('Error saving sidebar state:', error);
    }
  }, [collapsed]);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
