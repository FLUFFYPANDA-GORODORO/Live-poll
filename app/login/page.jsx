"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Login() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard/my-polls");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans text-slate-900 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        <div className="p-8 md:p-10 space-y-8">

          {/* Header */}
          <div className="text-center space-y-2">
            <Link href="/" className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-primary)] text-white font-bold text-lg mb-4 shadow-lg shadow-[var(--color-primary)]/30">
              RP
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Welcome back</h1>
            <p className="text-slate-500">
              Sign in to manage your polls and analytics
            </p>
          </div>

          {/* Google Login */}
          <div className="space-y-4">
            <button
              onClick={login}
              className="w-full px-6 py-4 rounded-xl bg-white border-2 border-slate-200 text-slate-700 font-bold text-base hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 group"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-center text-sm text-slate-400">
              Secure authentication powered by Google
            </p>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-100 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Home
            </Link>
          </div>
        </div>

        {/* Decorative Bottom Bar */}
        <div className="h-1.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]" />
      </div>
    </div>
  );
}