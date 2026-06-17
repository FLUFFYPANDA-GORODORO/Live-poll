"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Restore session from localStorage
    const token = localStorage.getItem("authToken");
    const cachedUser = localStorage.getItem("authUser");
    if (token && cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.login({ email, password });
      localStorage.setItem("authToken", data.token);
      const userData = {
        uid: data.userId,
        email: data.email,
        displayName: data.name,
      };
      localStorage.setItem("authUser", JSON.stringify(userData));
      setUser(userData);
      router.push("/dashboard/my-polls");
      return { success: true };
    } catch (error) {
      return { success: false, error: error.data?.error || "Login failed" };
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await api.register({ name, email, password });
      localStorage.setItem("authToken", data.token);
      const userData = {
        uid: data.userId,
        email: data.email,
        displayName: data.name,
      };
      localStorage.setItem("authUser", JSON.stringify(userData));
      setUser(userData);
      router.push("/dashboard/my-polls");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.data?.error || "Registration failed",
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    localStorage.removeItem("votedPolls");
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
