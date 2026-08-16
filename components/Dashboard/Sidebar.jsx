"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Layers,
  Sparkles,
  LogOut,
} from "lucide-react";

export default function Sidebar({ user, logout }) {
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutGrid, label: "Home", href: "/home" },
    { icon: Layers, label: "Presentations", href: "/home/presentations" },
    { icon: Sparkles, label: "Templates", href: "/home/templates" },
  ];

  return (
    <aside className="w-[88px] bg-slate-950 border-r border-slate-800 flex flex-col items-center h-screen sticky top-0 shrink-0 z-20 py-4 text-white">

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col items-center gap-2.5 w-full px-1.5 mt-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const IconComp = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-[76px] h-14 rounded-lg text-[10px] font-medium transition-all gap-1.5 px-1 text-center group cursor-pointer ${
                isActive
                  ? "bg-white text-slate-950 font-bold shadow-lg shadow-white/5"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
              }`}
            >
              <IconComp className={`w-[18px] h-[18px] transition-transform group-hover:scale-110 ${isActive ? "text-slate-950" : "text-slate-400 group-hover:text-slate-200"}`} />
              <span className="leading-none text-[9.5px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - Only Logout */}
      <div className="flex flex-col items-center pb-2 w-full px-1.5">
        <button
          onClick={logout}
          title="Log out"
          className="flex flex-col items-center justify-center w-[76px] h-14 rounded-md text-red-400 hover:bg-red-500/15 hover:text-red-300 text-[10px] font-semibold transition-all gap-1 cursor-pointer active:scale-95"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <span className="leading-none">Logout</span>
        </button>
      </div>
    </aside>
  );
}
