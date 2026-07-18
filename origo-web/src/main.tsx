import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import { initTelemetry, clearTelemetry } from './lib/telemetry';
import { useConsentStore } from './store/consentStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

// Telemetry is opt-in: it only sends with analytics consent. Start the flush
// loop, and wipe any buffered events the moment a user turns analytics off.
initTelemetry();
useConsentStore.subscribe((s) => { if (!s.analytics) clearTelemetry(); });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#1A1A2E', color: '#fff', border: '1px solid #2A2A45' },
            success: { iconTheme: { primary: '#6C3DFF', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
