"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <Toaster
                position="bottom-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#1e293b',
                        color: '#cbd5e1',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '500',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        padding: '10px 14px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#22c55e',
                            secondary: '#1e293b',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#1e293b',
                        },
                    },
                }}
            />
        </AuthProvider>
    );
}
