"use client";

import { LayoutTemplate, Loader2 } from "lucide-react";

export default function TemplatesPage() {
  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Poll Templates</h1>
          <p className="text-sm text-slate-500 mt-1">Pre-built templates for quick poll creation</p>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-8 bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center max-w-2xl w-full">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-3xl flex items-center justify-center">
              <LayoutTemplate className="w-10 h-10" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Templates Library Coming Soon</h2>
          <p className="text-slate-500 mb-8 text-lg">
            We are curating a collection of high-converting poll templates for various use cases like webinars, classrooms, and team meetings.
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-full text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Under Development
          </div>
        </div>
      </main>
    </div>
  );
}
