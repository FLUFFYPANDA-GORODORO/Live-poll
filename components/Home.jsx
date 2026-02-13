"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Users, Zap, BarChart3, Share2, ListChecks } from "lucide-react";

export default function Home() {
  return (
    <div className="bg-white relative overflow-hidden font-sans text-slate-900">
      {/* Hero Wrapper - Full Viewport Height */}
      <div className="relative min-h-screen flex flex-col">
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
        <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm">
              RP
            </div>
            <span className="font-bold text-xl tracking-tight text-[var(--color-primary)]">Rapid Polls</span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-all shadow-lg shadow-[var(--color-primary)]/20"
            >
              Log In
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="relative z-10 flex flex-col items-center justify-center flex-1 text-center max-w-5xl mx-auto px-4">
        
        {/* Floating Avatars - positioned on the full-height wrapper */}
        {/* Top Left */}
        <div className="absolute top-[15%] left-[1%] xl:left-[3%] hidden lg:block animate-bounce-slow" style={{ animationDuration: '3s' }}>
          <div className="relative group">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="User" className="w-20 h-20 rounded-full border-4 border-white shadow-xl object-cover" />
            <div className="absolute -bottom-6 -right-6 drop-shadow-md">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="white" strokeWidth="2" className="transform rotate-[180deg]">
                 <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
               </svg>
            </div>
          </div>
        </div>

        {/* Top Right */}
        <div className="absolute top-[15%] right-[1%] xl:right-[3%] hidden lg:block animate-bounce-slow" style={{ animationDuration: '4s' }}>
           <div className="relative group">
            <img src="/2.avif" alt="User" className="w-20 h-20 rounded-full border-4 border-white shadow-xl object-cover" />
             <div className="absolute -bottom-5 -left-8 drop-shadow-md">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="white" strokeWidth="2" className="transform rotate-[-90deg]">
                 <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
               </svg>
            </div>
          </div>
        </div>

         {/* Bottom Left */}
         <div className="absolute bottom-[15%] left-[5%] xl:left-[12%] hidden lg:block animate-bounce-slow" style={{ animationDuration: '3.5s' }}>
           <div className="relative group">
            <img src="/3.avif" alt="User" className="w-16 h-16 rounded-full border-4 border-white shadow-xl object-cover" />
             <div className="absolute -top-5 -right-8 drop-shadow-md">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="white" strokeWidth="2" className="transform rotate-[90deg]">
                 <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
               </svg>
            </div>
          </div>
        </div>
        
         {/* Bottom Right */}
         <div className="absolute bottom-[18%] right-[5%] xl:right-[12%] hidden lg:block animate-bounce-slow" style={{ animationDuration: '4.5s' }}>
           <div className="relative group">
            <img src="/4.avif" alt="User" className="w-16 h-16 rounded-full border-4 border-white shadow-xl object-cover" />
             <div className="absolute -top-5 -left-8 drop-shadow-md">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--color-primary)" stroke="white" strokeWidth="2" className="transform rotate-[0deg]">
                 <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
               </svg>
            </div>
          </div>
        </div>


        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
           <Zap className="w-3.5 h-3.5 text-[var(--color-primary)]" />
           <span className="text-xs font-bold tracking-wider uppercase text-slate-600">Real-Time Audience Engagement</span>
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
            className="px-8 py-4 rounded-xl bg-[var(--color-primary)] text-white font-bold text-lg hover:bg-[var(--color-primary-hover)] transition-all shadow-xl shadow-[var(--color-primary)]/20 hover:transform hover:-translate-y-1 flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Create
          </Link>
          <Link
            href="/join"
            className="px-8 py-4 rounded-xl bg-white text-slate-700 font-bold text-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Join
          </Link>
        </div>

        </main>
      </div>

      {/* Features Section */}
      <section className="relative z-10 bg-slate-50 border-t border-slate-200 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              A complete live polling platform built for presenters, educators, and teams who need instant audience feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Real-Time Voting</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Participants join with a simple poll ID and vote instantly. Results update live for everyone to see.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-5">
                <BarChart3 className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Instant Analytics</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Track total votes, engagement rates, and response breakdowns from your personal dashboard.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-5">
                <Share2 className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Easy Sharing</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Share a unique 6-character poll ID with your audience. No sign-up required for participants.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-5">
                <ListChecks className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Multi-Question Polls</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Create polls with multiple questions, each with customizable options. Present them one at a time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm">
              RP
            </div>
            <span className="font-bold text-lg tracking-tight">Rapid Polls</span>
          </div>
          <p className="text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} Rapid Polls. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}