"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ShieldAlert, RotateCcw, Home, LogIn } from "lucide-react";

export default function RootError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error("Application error boundary caught:", error);
  }, [error]);

  const isAuthError =
    error?.status === 401 ||
    error?.message?.toLowerCase().includes("unauthorized") ||
    error?.message?.toLowerCase().includes("unauthenticated") ||
    error?.message?.toLowerCase().includes("token") ||
    error?.message?.toLowerCase().includes("login");

  const handleLogoutAndLogin = () => {
    // Clear credentials
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    router.push("/login");
    // Force a reload to ensure all states are reset
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-900 p-4 relative overflow-hidden">
      {/* Decorative background grid and blurs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--color-secondary)]/10 rounded-full blur-3xl" />

      <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative z-10 animate-fade-in">
        <div className="p-8 md:p-10 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`p-4 rounded-2xl ${isAuthError ? "bg-amber-50 text-amber-500" : "bg-red-50 text-red-500"}`}>
              {isAuthError ? (
                <ShieldAlert className="w-12 h-12" />
              ) : (
                <AlertTriangle className="w-12 h-12" />
              )}
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
              {isAuthError ? "Session Expired" : "Oops! Something went wrong"}
            </h1>
            <p className="text-slate-500 text-base max-w-md mx-auto">
              {isAuthError
                ? "Your authentication token is invalid or your session has expired. Please log in again to continue."
                : error?.message || "An unexpected error occurred. Our team has been notified."}
            </p>
          </div>

          {/* Technical Details (Collapsible) */}
          {!isAuthError && error && (
            <div className="text-left bg-slate-50 border border-slate-150 rounded-xl p-4 max-h-36 overflow-auto">
              <span className="text-xs font-mono font-bold text-slate-400 block mb-1">ERROR DETAILS</span>
              <p className="font-mono text-xs text-slate-600 break-words">{error.stack || error.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {isAuthError ? (
              <>
                <button
                  onClick={handleLogoutAndLogin}
                  className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/10 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In Again
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => reset()}
                  className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/10 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              </>
            )}
          </div>
        </div>
        <div className="h-1.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]" />
      </div>
    </div>
  );
}
