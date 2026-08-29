import { createContext, useContext } from 'react';
import type { ApiClient } from '../api/client';

export const ApiContext = createContext<ApiClient | null>(null);

export function useApi(): ApiClient {
  const client = useContext(ApiContext);
  if (client === null) {
    throw new Error('useApi fuori da <ApiProvider>.');
  }
  return client;
}
