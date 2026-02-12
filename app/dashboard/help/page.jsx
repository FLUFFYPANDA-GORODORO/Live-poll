"use client";

import Sidebar from "@/components/Dashboard/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export default function Help() {
  const { user, logout } = useAuth();
  
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar user={user} logout={logout} />
        <div className="flex-1 flex items-center justify-center h-screen">
          <h1 className="text-2xl font-bold text-slate-400">Help (Coming Soon)</h1>
        </div>
      </div>
    </ProtectedRoute>
  );
}
