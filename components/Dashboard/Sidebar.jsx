"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home as HomeIcon,
  Presentation,
  LogOut,
  LayoutTemplate,
} from "lucide-react";

export default function Sidebar({ user, logout }) {
  const pathname = usePathname();

  const menuItems = [
    { icon: HomeIcon, label: "Home", href: "/home" },
    { icon: Presentation, label: "Projects", href: "/home/presentations" },
    { icon: LayoutTemplate, label: "Templates", href: "/home/templates" },
  ];

  return (
    <aside className="w-[72px] bg-slate-950 border-r border-slate-800 flex flex-col items-center h-screen sticky top-0 shrink-0 z-20 py-4 text-white">

      {/* Navigation Icons */}
      <nav className="flex-1 flex flex-col items-center gap-2 w-full px-1 mt-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-md text-[10px] font-medium transition-all gap-1 ${
                isActive
                  ? "bg-white text-slate-950 font-bold shadow-md"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section - Only Logout */}
      <div className="flex flex-col items-center pb-2 w-full px-1">
        <button
          onClick={logout}
          title="Log out"
          className="flex flex-col items-center justify-center w-14 h-14 rounded-md text-red-400 hover:bg-red-500/15 hover:text-red-300 text-[10px] font-semibold transition-all gap-1 cursor-pointer active:scale-95"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <span className="leading-none">Logout</span>
        </button>
      </div>
    </aside>
  );
}
