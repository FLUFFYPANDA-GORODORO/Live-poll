"use client";

import { useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { usePollStore } from "@/lib/store/usePollStore";
import { Loader2, AlertCircle } from "lucide-react";

import BiddingPoll from "@/components/Bidding/BiddingPoll";

// Generate a unique session ID
const getSessionId = () => {
  if (typeof window === "undefined") return "";
  let sessionId = sessionStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
};

export default function BiddingPollPage() {
  const { pollId } = useParams();
  const searchParams = useSearchParams();

  const {
    currentPoll: poll,
    loadingCurrent: loading,
    error: storeError,
    subscribeToPoll,
    skills,
    bubbleCounts,
    committedCount,
    sendSelectionChange,
    lockInBids,
  } = usePollStore();

  const sessionId = getSessionId();

  // Subscribe to poll updates
  useEffect(() => {
    if (!pollId) return;
    const unsubscribe = subscribeToPoll(pollId);
    return () => unsubscribe();
  }, [pollId, subscribeToPoll]);

  const theme = poll?.theme || searchParams.get("theme") || "synergy_sphere";

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  // Error state
  if (storeError || !poll) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2 font-[Epilogue]">
            Poll Not Available
          </h1>
          <p className="text-white/50 text-sm font-[Epilogue]">
            {storeError || "The bidding poll you're trying to access doesn't exist."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <BiddingPoll
      skills={poll?.skills || []}
      poll={poll}
      sessionId={sessionId}
      sendSelectionChange={sendSelectionChange}
      lockInBids={lockInBids}
      bubbleCounts={bubbleCounts}
      committedCount={committedCount}
      theme={theme}
    />
  );
}
