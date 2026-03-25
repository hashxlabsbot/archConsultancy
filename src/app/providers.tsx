'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#1a2332',
                        color: '#e2e8f0',
                        border: '1px solid #2d3748',
                        borderRadius: '12px',
                    },
                    success: {
                        iconTheme: { primary: '#10b981', secondary: '#e2e8f0' },
                    },
                    error: {
                        iconTheme: { primary: '#ef4444', secondary: '#e2e8f0' },
                    },
                }}
            />
        </SessionProvider>
    );
}
