import { createContext, useContext } from 'react';
import type { AdminConfig } from '../../config';

export const ConfigContext = createContext<AdminConfig | null>(null);

export function useConfig(): AdminConfig {
  const config = useContext(ConfigContext);
  if (config === null) {
    throw new Error('useConfig fuori da <ConfigProvider>.');
  }
  return config;
}
