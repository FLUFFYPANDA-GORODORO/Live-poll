"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans text-slate-900">
      {/* Background Grid with Fade Integration */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
            opacity: 0.5
          }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          {/* Dummy Logo Icon */}
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-lg">
            D
          </div>
          <span className="font-bold text-xl tracking-tight text-[var(--color-primary)]">DummyName</span>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <span className="cursor-default hover:text-slate-900">Solutions</span>
          <span className="cursor-default hover:text-slate-900">Customers</span>
          <span className="cursor-default hover:text-slate-900">Pricing</span>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <Link 
            href="/login"
            className="hidden md:block px-5 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-all shadow-lg shadow-[var(--color-primary)]/20"
          >
            Start Now
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-20 pb-32 text-center max-w-5xl mx-auto px-4">
        
        {/* Floating Avatars (Absolute Positioned relative to main container) */}
        {/* Top Left */}
        <div className="absolute top-20 left-4 md:left-20 hidden lg:block animate-bounce-slow" style={{ animationDuration: '3s' }}>
          <div className="relative group">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="User" className="w-20 h-20 rounded-full border-4 border-white shadow-xl" />
            <div className="absolute -bottom-6 -right-6 drop-shadow-md">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="white" strokeWidth="2" className="transform rotate-[180deg]">
                 <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
               </svg>
            </div>
          </div>
        </div>

        {/* Top Right */}
        <div className="absolute top-32 right-4 md:right-24 hidden lg:block animate-bounce-slow" style={{ animationDuration: '4s' }}>
           <div className="relative group">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User" className="w-20 h-20 rounded-full border-4 border-white shadow-xl" />
             <div className="absolute -bottom-5 -left-8 drop-shadow-md">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="white" strokeWidth="2" className="transform rotate-[-90deg]">
                 <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
               </svg>
            </div>
          </div>
        </div>

         {/* Bottom Left */}
         <div className="absolute bottom-10 left-10 md:left-32 hidden lg:block animate-bounce-slow" style={{ animationDuration: '3.5s' }}>
           <div className="relative group">
            <img src="https://i.pravatar.cc/150?u=a048581f4e29026704d" alt="User" className="w-16 h-16 rounded-full border-4 border-white shadow-xl" />
             <div className="absolute -top-5 -right-8 drop-shadow-md">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="white" strokeWidth="2" className="transform rotate-[90deg]">
                 <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
               </svg>
            </div>
          </div>
        </div>
        
         {/* Bottom Right */}
         <div className="absolute bottom-20 right-8 md:right-40 hidden lg:block animate-bounce-slow" style={{ animationDuration: '4.5s' }}>
           <div className="relative group">
            <img src="https://i.pravatar.cc/150?u=4" alt="User" className="w-16 h-16 rounded-full border-4 border-white shadow-xl" />
             <div className="absolute -top-5 -left-8 drop-shadow-md">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="white" strokeWidth="2" className="transform rotate-[0deg]">
                 <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
               </svg>
            </div>
          </div>
        </div>


        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
           <span className="flex h-2 w-2 rounded-full bg-[var(--color-primary)]"></span>
           <span className="text-xs font-bold tracking-wider uppercase text-slate-600">Create For Fast</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-[var(--color-primary)] mb-6 leading-[1.1]">
          One platform to <br className="hidden md:block" />
          <span className="relative inline-block">
             manage
             <svg className="absolute w-full h-3 -bottom-1 left-0 text-[var(--color-secondary)]" viewBox="0 0 100 10" preserveAspectRatio="none">
               <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
             </svg>
          </span>{' '}
          your live polls
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-slate-500 mb-10 leading-relaxed">
          Manage your polls faster, smarter and more efficiently, delivering visibility and data-driven insights to engage your audience.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/login"
            className="px-8 py-4 rounded-xl bg-[var(--color-primary)] text-white font-bold text-lg hover:bg-[var(--color-primary-hover)] transition-all shadow-xl shadow-[var(--color-primary)]/20 hover:transform hover:-translate-y-1"
          >
            Start for Free
          </Link>
          <Link
            href="/login" // Using same link as "Get a Demo" usually leads to contact/signup in these dummy templates
            className="px-8 py-4 rounded-xl bg-white text-slate-700 font-bold text-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
          >
            Get a Demo
          </Link>
        </div>

      </main>
    </div>
  );
}