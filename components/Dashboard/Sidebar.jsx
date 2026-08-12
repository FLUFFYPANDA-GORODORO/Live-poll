"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home as HomeIcon,
  Presentation,
  LogOut,
  LayoutTemplate,
  Bell,
} from "lucide-react";

export default function Sidebar({ user, logout }) {
  const pathname = usePathname();

  const menuItems = [
    { icon: HomeIcon, label: "Home", href: "/home" },
    { icon: Presentation, label: "Projects", href: "/home/presentations" },
    { icon: LayoutTemplate, label: "Templates", href: "/home/templates" },
  ];

  const getUserInitial = () => {
    if (user?.displayName) return user.displayName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

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

      {/* Bottom Section */}
      <div className="flex flex-col items-center gap-1.5 pb-2">
        {/* Bell */}
        <button className="flex flex-col items-center justify-center w-14 h-10 rounded-md text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-all cursor-pointer">
          <Bell className="w-5 h-5" />
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center w-14 h-10 rounded-md text-slate-400 hover:bg-red-950/60 hover:text-red-400 transition-all cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>

        {/* User Avatar */}
        <div
          className="w-9 h-9 rounded-md bg-white text-slate-950 flex items-center justify-center font-bold text-xs cursor-pointer shadow-md border border-slate-300 mt-1"
          title={user?.email || "User Profile"}
        >
          {getUserInitial()}
        </div>
      </div>
    </aside>
  );
}
