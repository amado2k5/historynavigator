import React, { createContext, useContext, ReactNode } from 'react';
import { translate } from '../services/i18n.ts';

interface I18nContextType {
  language: string;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

interface I18nProviderProps {
  language: string;
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ language, children }) => {
  const t = (key: string, replacements?: Record<string, string | number>) => {
    return translate(language, key, replacements);
  };

  const value = { language, t };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
