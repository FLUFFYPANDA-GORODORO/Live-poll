"use client";

import Navbar from "@/components/Dashboard/Navbar";
import Sidebar from "@/components/Dashboard/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function HomeLayout({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const isEditorRoute = pathname?.startsWith("/home/create") || pathname?.startsWith("/home/edit");

  if (isEditorRoute) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50 w-full">
          {children}
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 flex flex-col w-full">
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <div className="flex flex-1 w-full">
          <Sidebar user={user} logout={logout} />
          <main className="flex-1 p-6 md:p-8 max-w-7xl overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
