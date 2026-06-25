"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function Providers({ children }: { children: React.ReactNode }) {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setIsOffline(!window.navigator.onLine);
        }

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    if (isOffline) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
                <div className="max-w-md text-center flex flex-col items-center">
                    <WifiOff className="w-16 h-16 text-slate-400 mb-6 animate-pulse" />
                    <h1 className="text-2xl font-bold mb-3">Connection Lost</h1>
                    <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                        Please check your internet connection. We will automatically reconnect you once you are back online.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <span>Waiting for connection...</span>
                    </div>
                </div>
            </div>
        );
    }

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
