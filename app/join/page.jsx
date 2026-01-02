"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen bg-eggshell text-foreground p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-light-taupe/20 to-silver-pink/20 mb-4">
            <Hash className="w-8 h-8 text-light-taupe" />
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
             <span className="bg-gradient-to-r from-light-taupe to-silver-pink bg-clip-text text-transparent">Join a Live Poll</span>
          </h1>
          <p className="text-silver-pink text-lg max-w-2xl mx-auto">
            Enter the poll ID provided by the host to participate in real-time voting
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* Left side - Join Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 md:p-6 lg:p-8 border border-silver-pink/30 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-light-taupe/20 flex items-center justify-center">
                <Hash className="w-5 h-5 text-light-taupe" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-bold text-light-taupe">Join with Poll ID</h2>
                <p className="text-sm text-silver-pink">Enter the 6-character code from the host</p>
              </div>
            </div>

            <form onSubmit={handleJoin} className="space-y-6">
              <div>
                <label className="block text-silver-pink mb-3">
                  Poll ID
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Hash className="w-5 h-5 text-silver-pink" />
                  </div>
                  <input
                    type="text"
                    value={pollId}
                    onChange={(e) => {
                      setPollId(e.target.value.toUpperCase());
                      setError("");
                    }}
                    placeholder="e.g. A1B2C3"
                    className="w-full bg-white/50 border border-silver-pink/30 rounded-xl pl-12 pr-4 py-3.5 md:py-4 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-light-taupe focus:border-transparent transition-all uppercase tracking-wider placeholder:text-silver-pink/50"
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
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-silver-pink hover:text-light-taupe transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {error && (
                  <p className="text-red-500 mt-2 text-sm flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !pollId.trim()}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed px-6 py-3.5 md:py-4 rounded-xl font-semibold text-lg text-eggshell transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-eggshell border-t-transparent rounded-full animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    <span>Join Poll</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-silver-pink/20">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-4 h-4 text-light-taupe" />
                <h3 className="font-semibold text-light-taupe">Alternative Options</h3>
              </div>
              <p className="text-silver-pink text-sm">
                You can also join by scanning a QR code or clicking a direct link shared by the host
              </p>
            </div>
          </div>

          {/* Right side - Instructions */}
          <div className="space-y-5 md:space-y-6">
            <div className="bg-gradient-to-r from-light-taupe/10 to-silver-pink/10 border border-light-taupe/20 rounded-xl md:rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-light-taupe/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-light-taupe" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-light-taupe">How it works</h3>
                  <p className="text-sm text-silver-pink">Join in 4 simple steps</p>
                </div>
              </div>
              <ul className="text-silver-pink space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-light-taupe">1</span>
                  </div>
                  <div>
                    <span className="font-medium text-light-taupe">Get the poll ID</span>
                    <p className="text-sm mt-0.5">Host shares the code via presentation, chat, or email</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-light-taupe">2</span>
                  </div>
                  <div>
                    <span className="font-medium text-light-taupe">Enter & join</span>
                    <p className="text-sm mt-0.5">Type the code above and click join</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-light-taupe">3</span>
                  </div>
                  <div>
                    <span className="font-medium text-light-taupe">Wait for start</span>
                    <p className="text-sm mt-0.5">The host will activate questions when ready</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-light-taupe/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-semibold text-light-taupe">4</span>
                  </div>
                  <div>
                    <span className="font-medium text-light-taupe">Vote in real-time</span>
                    <p className="text-sm mt-0.5">Answer questions as they appear live</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl md:rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Search className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-light-taupe">Where to find the ID?</h3>
                  <p className="text-sm text-silver-pink">Common places to look</p>
                </div>
              </div>
              <ul className="text-silver-pink space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Presentation slides from the host</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Meeting chat or collaboration tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Email invitation from the host</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>QR code displayed on screen</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Usually 6 uppercase letters/numbers</span>
                </li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-silver-pink">
                Need to create a poll instead?{" "}
                <button
                  onClick={() => router.push("/dashboard/create")}
                  className="text-light-taupe hover:text-light-taupe/80 font-medium underline transition-colors"
                >
                  Create a new poll
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Poll ID Examples */}
        <div className="mt-8 md:mt-12">
          <div className="text-center mb-6">
            <h3 className="text-lg md:text-xl font-semibold text-light-taupe mb-2">Example Poll IDs</h3>
            <p className="text-silver-pink text-sm">Try clicking or copying these examples</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {["A1B2C3", "X7Y8Z9", "M4N5P6", "R8S9T0"].map((example) => (
              <button
                key={example}
                onClick={() => copyExample(example)}
                className="group bg-white/80 border border-silver-pink/30 hover:border-light-taupe rounded-xl px-5 py-3 cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <code className="font-mono text-base md:text-lg tracking-wider text-light-taupe">
                    {example}
                  </code>
                  {copiedExample === example ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-silver-pink group-hover:text-light-taupe transition-colors" />
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-silver-pink">
              Click any example to copy and try it out
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30 text-center">
            <p className="text-sm text-silver-pink">No Sign-up</p>
            <p className="text-xl font-bold text-light-taupe">Required</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30 text-center">
            <p className="text-sm text-silver-pink">Join</p>
            <p className="text-xl font-bold text-light-taupe">Instantly</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30 text-center">
            <p className="text-sm text-silver-pink">Vote</p>
            <p className="text-xl font-bold text-light-taupe">Anonymously</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30 text-center">
            <p className="text-sm text-silver-pink">Real-time</p>
            <p className="text-xl font-bold text-light-taupe">Results</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-silver-pink/20 text-center">
          <p className="text-sm text-silver-pink">
            Having trouble joining? Ask the host to verify the poll ID is correct
          </p>
        </div>
      </div>
    </div>
  );
}