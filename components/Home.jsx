"use client";

import Link from "next/link";
import { ArrowRight, Hash } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-2xl">
        {/* Logo */}
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Live Poll
        </h1>
        <p className="text-lg text-text-secondary mb-10">
          Create interactive polls and get real-time results
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="btn-primary flex items-center justify-center gap-2"
          >
            Create Poll
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/join"
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Hash className="w-5 h-5" />
            Join Poll
          </Link>
        </div>
      </div>
    </main>
  );
}