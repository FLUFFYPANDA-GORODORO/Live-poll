"use client";

import Sidebar from "@/components/Dashboard/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  
  if (!user) return null; // Let ProtectedRoute handle redirection

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar user={user} logout={logout} />
        {children}
      </div>
    </ProtectedRoute>
  );
}
