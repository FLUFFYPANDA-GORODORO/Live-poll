"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, HelpCircle, LogOut } from "lucide-react";

export default function Sidebar({ user, logout }) {
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: HelpCircle, label: "Help", href: "/dashboard/help" },
  ];

  return (
    <aside className="group hidden md:flex flex-col w-20 hover:w-64 transition-all duration-300 bg-slate-900 h-screen text-white sticky top-0 left-0 z-50 overflow-hidden shadow-xl">
      {/* Logo Area */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-4 whitespace-nowrap h-[88px]">
        <div className="w-8 h-8 min-w-[32px] rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-bold text-lg">
          D
        </div>
        <span className="font-bold text-xl tracking-tight opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100 transform translate-x-[-10px] group-hover:translate-x-0">
          DummyName
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
  );
}
