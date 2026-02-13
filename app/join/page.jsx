"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase"; // Import db
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { Hash, Users, ArrowRight, Search, QrCode, Check, Info, X, Copy } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const [pollId, setPollId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedExample, setCopiedExample] = useState(null);

  const handleJoin = async (e) => {
    e.preventDefault();
    
    if (!pollId.trim()) {
      setError("Please enter a poll ID");
      return;
    }

    if (pollId.length < 6) {
      setError("Poll ID should be at least 6 characters");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Validate poll exists in Firestore
      const pollRef = doc(db, "polls", pollId);
      const pollSnap = await getDoc(pollRef);
      
      if (!pollSnap.exists()) {
        setError("Poll not found. Check the ID and try again.");
        setIsLoading(false);
        return;
      }

      const pollData = pollSnap.data();
      
      // Optional: Check if poll is active
      if (pollData.status === "ended") {
        setError("This poll has ended.");
        setIsLoading(false);
        return;
      }
      
      // Redirect to poll page
      router.push(`/poll/${pollId}`);
    } catch (err) {
      console.error("Error joining poll:", err);
      setError("Failed to join poll. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyExample = (example) => {
    navigator.clipboard.writeText(example);
    setCopiedExample(example);
    setPollId(example);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-[var(--color-primary)]">
             Join a Live Poll
          </h1>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            Enter the poll ID provided by the host to participate in real-time voting
          </p>
        </div>

        {/* Join Form */}
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
              <Hash className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-slate-800">Enter Poll ID</h2>
              <p className="text-sm text-slate-500">6-character code</p>
            </div>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Hash className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={pollId}
                  onChange={(e) => {
                    setPollId(e.target.value.toUpperCase());
                    setError("");
                  }}
                  placeholder="e.g. A1B2C3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-4 text-lg font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-all uppercase placeholder:text-slate-400"
                  maxLength={10}
                  disabled={isLoading}
                />
                {pollId && (
                  <button
                    type="button"
                    onClick={() => {
                      setPollId("");
                      setError("");
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {error && (
                <p className="text-red-500 mt-3 text-sm flex items-center justify-center gap-2 font-medium">
                  <Info className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !pollId.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] disabled:bg-slate-300 disabled:cursor-not-allowed px-6 py-4 rounded-xl font-bold text-lg text-white transition-all shadow-lg shadow-[var(--color-primary)]/20 hover:transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <span>Join Poll</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Example Poll IDs */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm mb-4">Or try these examples:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["A1B2C3", "X7Y8Z9", "M4N5P6"].map((example) => (
              <button
                key={example}
                onClick={() => copyExample(example)}
                className={`group px-4 py-2 rounded-lg border text-sm font-mono tracking-wider transition-all ${
                  copiedExample === example
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-white border-slate-200 text-slate-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{example}</span>
                  {copiedExample === example && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}