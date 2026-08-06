"use client";

import { Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function Navbar({ searchQuery, setSearchQuery }) {
  const { user } = useAuth();
  
  const getUserInitial = () => {
    if (user?.displayName) return user.displayName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 w-full">
      {/* Left: Brand Logo & Search Bar */}
      <div className="flex items-center gap-8 flex-1 max-w-2xl">
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight text-[#6366F1] font-sans">
            Rapid poll
          </span>
        </Link>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search presentations..."
            value={searchQuery || ""}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1] transition-all"
          />
        </div>
      </div>

      {/* Right: User Profile Circle */}
      <div className="flex items-center gap-4">
        <div 
          className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center font-semibold text-sm text-slate-700 shadow-sm border border-slate-200 cursor-pointer"
          title={user?.email || "User Profile"}
        >
          {getUserInitial()}
        </div>
      </div>
    </header>
  );
}
