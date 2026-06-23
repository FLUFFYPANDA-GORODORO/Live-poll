"use client";

import { useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePollStore } from "@/lib/store/usePollStore";
import { Loader2 } from "lucide-react";

import BiddingPresent from "@/components/Bidding/BiddingPresent";

// Generate a unique session ID
const getSessionId = () => {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem("sessionId", sessionId);
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
    bubbleCounts,
    committedCount,
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

  const cohortParam = searchParams.get("cohort");

  // Automatically start question for a cohort if specified in the URL query params
  useEffect(() => {
    if (poll && cohortParam && startQuestion) {
      const targetCohort = cohortParam.toUpperCase();
      // Start if in standby, OR if the active cohort on the poll doesn't match the URL parameter
      if (poll.activeQuestionIndex === -1 || (poll.currentCohort?.toUpperCase() !== targetCohort)) {
        startQuestion(pollId, Math.max(0, poll.activeQuestionIndex), targetCohort).catch((err) =>
          console.error("Auto start/switch cohort run failed:", err)
        );
      }
    }
  }, [poll, pollId, cohortParam, startQuestion]);

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
      bubbleCounts={bubbleCounts}
      committedCount={committedCount}
      theme={theme}
      cleanTitle={cleanTitle}
      pollId={pollId}
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
