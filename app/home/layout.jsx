"use client";

import Sidebar from "@/components/Dashboard/Sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

export default function HomeLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute>
      <HomeContent user={user} logout={logout}>
        {children}
      </HomeContent>
    </ProtectedRoute>
  );
}

function HomeContent({ user, logout, children }) {
  return (
    <div className="flex min-h-screen bg-slate-50 flex-col md:flex-row">
      <Sidebar user={user} logout={logout} />
      {children}
    </div>
  );
}
