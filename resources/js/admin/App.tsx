import { useCallback, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiClient, ApiError, uuidV4 } from './lib/api/client';
import { ApiContext } from './lib/hooks/useApi';
import { ConfigContext } from './lib/hooks/useConfig';
import { ToastContext, type ToastEntry, type ToastPayload } from './lib/hooks/useToast';
import { Shell } from './layout/Shell';
import { OverviewScreen } from './features/overview/OverviewScreen';
import { RoutinesScreen } from './features/routines/RoutinesScreen';
import { RoutineDetailScreen } from './features/routines/RoutineDetailScreen';
import { WizardScreen } from './features/routines/WizardScreen';
import { AttentionScreen } from './features/attention/AttentionScreen';
import { RunsScreen } from './features/runs/RunsScreen';
import { HealthScreen } from './features/health/HealthScreen';
import type { AdminConfig } from './config';

interface AppProps {
  config: AdminConfig;
  /** Il router in memoria serve ai test: in produzione l'URL è la fonte dei filtri. */
  basename?: string;
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchIntervalInBackground: false,
        retry: (failureCount, error) => {
          // Un 4xx non migliora ritentando: 401 vuole una nuova sessione, 403 un permesso,
          // 422 una correzione. Ritentare aggiunge solo latenza prima di dire la stessa cosa.
          if (error instanceof ApiError && error.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
      },
    },
  });
}

export function App({ config, basename }: AppProps) {
  const [queryClient] = useState(makeQueryClient);
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const api = useMemo(
    () => new ApiClient({ baseUrl: config.apiBase, csrfToken: config.csrfToken }),
    [config.apiBase, config.csrfToken],
  );

  const push = useCallback((toast: ToastPayload) => {
    setToasts((current) => [...current, { ...toast, id: uuidV4() }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toastApi = useMemo(() => ({ push, dismiss, toasts }), [push, dismiss, toasts]);

  return (
    <ConfigContext.Provider value={config}>
      <ApiContext.Provider value={api}>
        <QueryClientProvider client={queryClient}>
          <ToastContext.Provider value={toastApi}>
            <BrowserRouter basename={basename}>
              <Routes>
                <Route element={<Shell />}>
                  <Route index element={<OverviewScreen />} />
                  <Route path="routines" element={<RoutinesScreen />} />
                  <Route path="routines/new" element={<WizardScreen />} />
                  <Route path="routines/:id" element={<RoutineDetailScreen />} />
                  <Route path="attention" element={<AttentionScreen />} />
                  <Route path="runs" element={<RunsScreen />} />
                  <Route path="health" element={<HealthScreen />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </ToastContext.Provider>
        </QueryClientProvider>
      </ApiContext.Provider>
    </ConfigContext.Provider>
  );
}
