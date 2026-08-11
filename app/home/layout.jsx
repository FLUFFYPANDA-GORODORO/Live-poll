"use client";

import Sidebar from "@/components/Dashboard/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export default function HomeLayout({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

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
      <div className="min-h-screen bg-slate-50 flex w-full">
        <Sidebar user={user} logout={logout} />
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
