"use client";

import Link from "next/link";
import { ArrowRight, Hash } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-eggshell text-foreground">
      {/* Hero Section */}
      <section className="text-center py-24 px-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-light-taupe to-silver-pink bg-clip-text text-transparent">
          Live Polls that feel alive
        </h1>
        <p className="text-xl text-light-taupe mb-12 max-w-3xl mx-auto">
          Create interactive polls, engage your audience, and get real-time results instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] px-8 py-4 rounded-xl text-lg font-semibold text-eggshell transition-all hover:scale-105 active:scale-95"
          >
            Create Live Poll
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/join"
            className="flex items-center justify-center gap-3 border border-light-taupe hover:border-silver-pink px-8 py-4 rounded-xl text-lg font-semibold text-light-taupe hover:text-silver-pink transition-all hover:scale-105 active:scale-95"
          >
            <Hash className="w-5 h-5" />
            Join a Poll
          </Link>
        </div>
      </section>
    </main>
  );
}