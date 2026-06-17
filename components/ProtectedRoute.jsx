"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authError, setAuthError] = useState(null);

  useEffect(() => {

    const handleUnauthorized = (e) => {
      setAuthError(e.detail || new Error("Session expired"));
    };
    
    if (typeof window !== "undefined") {
      window.addEventListener("api-unauthorized", handleUnauthorized);
      return () => {
        window.removeEventListener("api-unauthorized", handleUnauthorized);
      };
    }
  }, []);

  if (authError) {
    throw authError;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-eggshell flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-light-taupe animate-spin mx-auto mb-4" />
          <p className="text-silver-pink">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const error = new Error("Unauthenticated");
    error.status = 401;
    throw error;
  }

  return children;
}

