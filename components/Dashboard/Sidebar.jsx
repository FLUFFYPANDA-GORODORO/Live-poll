"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, HelpCircle, LogOut, List, LayoutTemplate, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Sidebar({ user, logout }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: List, label: "My Polls", href: "/dashboard/my-polls" },
    { icon: LayoutTemplate, label: "Templates", href: "/dashboard/templates" },
    { icon: HelpCircle, label: "Help", href: "/dashboard/help" },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm">
            RP
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">
            Rapid Polls
          </span>
        </Link>
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Spacer to prevent content overlap */}
      <div className="md:hidden h-16" />

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Drawer */}
          <div className="absolute top-0 bottom-0 left-0 w-3/4 max-w-xs bg-white shadow-2xl animate-slide-in-right flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-xl text-slate-900">Menu</span>
              <button 
                onClick={() => setIsMobileOpen(false)}
                className="p-2 -mr-2 text-slate-400 hover:bg-slate-100 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center gap-3 px-4 py-3 mb-2">
                 <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                    {user?.displayName?.[0] || user?.email?.[0] || "U"}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{user?.displayName || "User"}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                 </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-red-600 hover:bg-red-50 font-medium transition-all"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Unchanged logic, just keeping hidden md:flex) */}
      <aside className="group hidden md:flex flex-col w-20 hover:w-64 transition-all duration-300 bg-slate-900 h-screen text-white sticky top-0 left-0 z-50 overflow-hidden shadow-xl">
        {/* Logo Area */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-4 whitespace-nowrap h-[88px]">
          <div className="w-8 h-8 min-w-[32px] rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-sm">
            RP
          </div>
          <span className="font-bold text-xl tracking-tight opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100 transform translate-x-[-10px] group-hover:translate-x-0">
            Rapid Polls
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-4 px-3 py-3 rounded-xl transition-all whitespace-nowrap overflow-hidden ${
                  isActive
                    ? "bg-white text-slate-900 font-bold shadow-md"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className="w-6 h-6 min-w-[24px]" />
                <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100 transform translate-x-[-10px] group-hover:translate-x-0">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="p-4 border-t border-slate-800">
          <button
             onClick={logout}
             className="flex items-center gap-4 px-3 py-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all whitespace-nowrap overflow-hidden"
          >
            <LogOut className="w-6 h-6 min-w-[24px]" />
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100 transform translate-x-[-10px] group-hover:translate-x-0">
              Sign Out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
