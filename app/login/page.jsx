"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Login() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard/my-polls");
    }
  }, [user, loading, router]);

  const handleEmailLogin = (e) => {
    e.preventDefault();
    // Placeholder for future email/password login logic
    console.log("Email login attempted with:", email, password);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white font-sans text-slate-900">
      
      {/* Left Side - Branding & Aesthetics */}
      <div className="lg:w-1/2 bg-[var(--color-primary)] flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
             <div 
              className="absolute inset-0" 
              style={{
                backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
        </div>
        
        {/* Logo Area */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border border-white/20">
              D
            </div>
            <span className="font-bold text-xl tracking-tight text-white">DummyName</span>
          </Link>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 my-10 lg:my-0">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight">
            Engage your audience with <span className="text-[var(--color-secondary)]">real-time</span> polls.
          </h1>
          <p className="text-lg text-slate-300 max-w-md mb-8">
            Create interactive presentations, gather instant feedback, and make data-driven decisions in seconds.
          </p>
          
          <div className="space-y-4">
             <div className="flex items-center gap-3 text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-[var(--color-secondary)]" />
                <span>Unlimited polls and questions</span>
             </div>
             <div className="flex items-center gap-3 text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-[var(--color-secondary)]" />
                <span>Real-time analytics dashboard</span>
             </div>
             <div className="flex items-center gap-3 text-slate-200">
                <CheckCircle2 className="w-5 h-5 text-[var(--color-secondary)]" />
                <span>Seamless export options</span>
             </div>
          </div>
        </div>

        {/* Footer/Copyright */}
        <div className="relative z-10 text-sm text-slate-400">
          &copy; {new Date().getFullYear()} DummyName Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          


          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-2 text-slate-500">
              Please enter your details to sign in.
            </p>
          </div>

          <div className="space-y-6">
            
            {/* Email/Password Form (Placeholder) */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled // Disabled as per requirements "no feature for username, password login yet"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">Password</label>
                  <a href="#" className="text-sm font-medium text-[var(--color-primary)] hover:underline">Forgot password?</a>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all placeholder:text-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled // Disabled as per requirements
                />
              </div>
              
              <button
                type="submit"
                disabled // Disabled as per requirements
                className="w-full px-4 py-3.5 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm hover:bg-[var(--color-primary-hover)] transition-all shadow-lg shadow-[var(--color-primary)]/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Sign In
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            {/* Social Login */}
            <button
              onClick={login}
              className="w-full px-4 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>

            {/* Bottom Link */}
             <p className="text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link href="/join" className="font-bold text-[var(--color-primary)] hover:underline">
                Sign up for free
              </Link>
            </p>

            <div className="text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
               >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}