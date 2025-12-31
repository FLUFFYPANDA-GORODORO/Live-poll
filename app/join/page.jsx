"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase"; // Import db
import { doc, getDoc } from "firebase/firestore"; // Import Firestore functions
import { Hash, Users, ArrowRight, Search } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const [pollId, setPollId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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

  // Rest of the component remains the same...
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Join a <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Live Poll</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Enter the poll ID provided by the host to participate in real-time voting
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left side - Join Form */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <Hash className="w-8 h-8 text-indigo-400" />
              <h2 className="text-2xl font-bold">Join with Poll ID</h2>
            </div>

            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <label className="block text-gray-400 mb-3">
                  Enter Poll ID
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Hash className="w-5 h-5 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={pollId}
                    onChange={(e) => {
                      setPollId(e.target.value.toUpperCase());
                      setError("");
                    }}
                    placeholder="e.g. TBO8FC"
                    className="w-full bg-gray-900 border border-gray-600 rounded-xl pl-12 pr-4 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all uppercase tracking-wider"
                    maxLength={10}
                    disabled={isLoading}
                  />
                </div>
                {error && (
                  <p className="text-red-400 mt-2 text-sm">{error}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/25"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-6 h-6" />
                    Join Poll
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="font-semibold mb-3">Don't have a poll ID?</h3>
              <p className="text-gray-400 text-sm">
                Ask the poll host for the 6-character code or scan the QR code they shared
              </p>
            </div>
          </div>

          {/* Right side - Instructions */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-6 h-6 text-indigo-400" />
                <h3 className="text-xl font-semibold">How it works</h3>
              </div>
              <ul className="text-gray-400 space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold">1</span>
                  </div>
                  <span>Get the poll ID from the host</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold">2</span>
                  </div>
                  <span>Enter the code above and join</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold">3</span>
                  </div>
                  <span>Wait for the host to start the poll</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold">4</span>
                  </div>
                  <span>Vote on questions in real-time</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Search className="w-6 h-6 text-emerald-400" />
                <h3 className="text-xl font-semibold">Where to find the ID?</h3>
              </div>
              <ul className="text-gray-400 space-y-2">
                <li>• The host can share it directly</li>
                <li>• Look for it in presentation slides</li>
                <li>• Check meeting chat or email</li>
                <li>• Scan the QR code if available</li>
                <li>• Usually 6 uppercase letters/numbers</li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-gray-500">
                Need to create a poll instead?{" "}
                <button
                  onClick={() => router.push("/create")}
                  className="text-indigo-400 hover:text-indigo-300 underline transition-colors"
                >
                  Create a new poll
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Poll ID Examples */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold mb-4">Example Poll IDs</h3>
          <div className="flex flex-wrap justify-center gap-4">
            {["A1B2C3", "X7Y8Z9", "M4N5P6", "R8S9T0"].map((example) => (
              <div
                key={example}
                onClick={() => setPollId(example)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-6 py-3 cursor-pointer hover:bg-gray-700 transition-colors"
              >
                <code className="font-mono text-lg tracking-wider">{example}</code>
              </div>
            ))}
          </div>
          <p className="text-gray-500 mt-4 text-sm">
            Click on any example to try it out
          </p>
        </div>
      </div>
    </div>
  );
}