"use client";

import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const login = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-black text-white">
      <button
        onClick={login}
        className="bg-indigo-500 px-8 py-4 rounded-xl"
      >
        Sign in with Google
      </button>
    </div>
  );
}
