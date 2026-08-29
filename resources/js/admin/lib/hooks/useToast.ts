import { createContext, useContext } from 'react';

export type ToastTone = 'ok' | 'danger' | 'accent' | 'attention' | 'idle';

export interface ToastPayload {
  title: string;
  detail?: string;
  tone?: ToastTone;
  action?: { label: string; onClick: () => void };
}

export interface ToastEntry extends ToastPayload {
  id: string;
}

export interface ToastApi {
  push: (toast: ToastPayload) => void;
  dismiss: (id: string) => void;
  toasts: ToastEntry[];
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (api === null) {
    throw new Error('useToast fuori da <ToastProvider>.');
  }
  return api;
}
