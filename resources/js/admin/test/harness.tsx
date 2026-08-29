import type { ReactElement, ReactNode } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient } from '../lib/api/client';
import { ApiContext } from '../lib/hooks/useApi';
import { ConfigContext } from '../lib/hooks/useConfig';
import { ToastContext, type ToastEntry, type ToastPayload } from '../lib/hooks/useToast';
import type { AdminConfig } from '../config';

export const TEST_CONFIG: AdminConfig = {
  apiBase: '/api/routines/v1',
  csrfToken: 'test-token',
  appName: 'Routines',
  locale: 'it-IT',
  timezone: 'Europe/Rome',
  logoutUrl: null,
  can: ['routines.read', 'routines.write', 'routines.fire', 'routines.approve'],
};

export const pushed: ToastPayload[] = [];

interface HarnessOptions {
  config?: Partial<AdminConfig>;
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { config = {}, route = '/' }: HarnessOptions = {},
): RenderResult {
  pushed.length = 0;

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });

  const toasts: ToastEntry[] = [];
  const toastApi = {
    toasts,
    push: (toast: ToastPayload) => {
      pushed.push(toast);
    },
    dismiss: () => {},
  };

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ConfigContext.Provider value={{ ...TEST_CONFIG, ...config }}>
      <ApiContext.Provider
        value={new ApiClient({ baseUrl: TEST_CONFIG.apiBase, csrfToken: 'test-token' })}
      >
        <QueryClientProvider client={queryClient}>
          <ToastContext.Provider value={toastApi}>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </ToastContext.Provider>
        </QueryClientProvider>
      </ApiContext.Provider>
    </ConfigContext.Provider>
  );

  return render(ui, { wrapper });
}
