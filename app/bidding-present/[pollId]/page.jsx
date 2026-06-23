"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePollStore } from "@/lib/store/usePollStore";
import { Loader2 } from "lucide-react";

import BiddingPresent from "@/components/Bidding/BiddingPresent";

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

export default function BiddingPresentPage() {
  const { pollId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    currentBiddingPoll: poll,
    loadingBiddingCurrent: loading,
    subscribeToBiddingPoll,
    skills,
    bubbleCounts,
    committedCount,
    fetchSkills,
    startBidding,
    stopBidding,
    deleteBiddingPoll,
    restartBiddingPoll,
    subscribeToPresenter,
    startQuestion,
  } = usePollStore();

  const sessionId = getSessionId();

  // Subscribe to poll updates
  useEffect(() => {
    if (!pollId) return;
    const unsubscribe = subscribeToBiddingPoll(pollId);
    return () => unsubscribe();
  }, [pollId, subscribeToBiddingPoll]);

  // Fetch skills on mount
  useEffect(() => {
    fetchSkills?.();
  }, [fetchSkills]);

  // Automatically start bidding if not already active and not closed
  useEffect(() => {
    if (poll && !poll.isBiddingActive && !poll.biddingClosed && startBidding) {
      startBidding(pollId).catch((err) => console.error("Auto start bidding failed:", err));
    }
  }, [poll, pollId, startBidding]);

  const theme = poll?.theme || searchParams.get("theme") || "synergy_sphere";
  const cleanTitle = poll?.title?.replace(/ ~(SS|MC)$/, "") || "Skill Bidding";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white/50 font-[Epilogue]">Poll not found</p>
      </div>
    );
  }

  return (
    <BiddingPresent
      poll={poll}
      skills={poll?.skills || []}
      bubbleCounts={bubbleCounts}
      committedCount={committedCount}
      theme={theme}
      cleanTitle={cleanTitle}
      pollId={pollId}
      startBidding={startBidding}
      stopBidding={stopBidding}
      deleteBiddingPoll={deleteBiddingPoll}
      restartBiddingPoll={restartBiddingPoll}
      isBiddingActive={poll?.isBiddingActive}
      biddingClosed={poll?.biddingClosed}
      subscribeToPresenter={subscribeToPresenter}
      startQuestion={startQuestion}
    />
  );
}
