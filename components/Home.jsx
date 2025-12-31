"use client";

import Link from "next/link";
import { ArrowRight, Users, ShieldCheck, Zap, Hash } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="text-center py-24 px-4">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Live Polls that feel alive
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
          Create interactive polls, engage your audience, and get real-time results instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"  // Changed from /create to /login
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 active:scale-95"
          >
            Create Live Poll
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/join"
            className="flex items-center justify-center gap-3 border border-white/20 hover:border-white/40 px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <Hash className="w-5 h-5" />
            Join a Poll
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why choose Live Polls?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="border border-white/10 p-8 rounded-2xl hover:border-indigo-500/50 transition-all hover:scale-105">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Real-time Results</h3>
            <p className="text-white/70">
              Watch votes come in live as participants respond. Instant engagement and feedback.
            </p>
          </div>

          <div className="border border-white/10 p-8 rounded-2xl hover:border-purple-500/50 transition-all hover:scale-105">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Audience Engagement</h3>
            <p className="text-white/70">
              Keep your audience actively participating with interactive questions and polls.
            </p>
          </div>

          <div className="border border-white/10 p-8 rounded-2xl hover:border-emerald-500/50 transition-all hover:scale-105">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Simple & Secure</h3>
            <p className="text-white/70">
              Easy to set up, no accounts needed for participants. Secure and private by design.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mt-20">
          <h3 className="text-2xl font-bold text-center mb-8">How it works</h3>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Sign In", desc: "Host signs in with Google" },
              { step: "2", title: "Create", desc: "Create poll with questions" },
              { step: "3", title: "Share", desc: "Share ID or link with audience" },
              { step: "4", title: "Vote", desc: "Live voting with real-time results" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h4 className="font-semibold mb-2">{item.title}</h4>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Auth Info Section */}
        <div className="max-w-4xl mx-auto mt-20 p-8 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl">
          <h3 className="text-2xl font-bold mb-4 text-center">Authentication Flow</h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-indigo-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2">For Hosts</h4>
              <ul className="text-gray-400 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <span>Sign in with Google (one-time)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <span>Create unlimited polls</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <span>Manage live sessions</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <span>View detailed analytics</span>
                </li>
              </ul>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-green-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2">For Participants</h4>
              <ul className="text-gray-400 space-y-2 text-left">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>No sign-up required</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Just enter poll ID to join</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Vote anonymously</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>See real-time results</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}