"use client";

import { HelpCircle, Loader2, BookOpen } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Help Center</h1>
          <p className="text-sm text-slate-500 mt-1">Guides, tutorials, and support resources</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8 bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-2xl w-full">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-3xl flex items-center justify-center">
              <BookOpen className="w-10 h-10" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Knowledge Base Coming Soon</h2>
          <p className="text-slate-500 mb-8 text-lg">
            We are building a comprehensive library of guides and video tutorials to help you make the most of your live polls.
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Content In Production
          </div>
        </div>
      </main>
    </div>
  );
}
