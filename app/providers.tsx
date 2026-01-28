"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            {children}
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#fff',
                        color: '#AB8B7A',
                        border: '1px solid #C9B2A0',
                    },
                    success: {
                        iconTheme: {
                            primary: '#22c55e',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
        </AuthProvider>
    );
}
