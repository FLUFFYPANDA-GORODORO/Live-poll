"use client";

import { useEffect, useState, useCallback } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { parseTheme } from "@/lib/themeHelper";

import PollScreen from "@/components/Themes/StandardPoll";

// Generate a unique session ID for vote tracking
const getSessionId = () => {
  if (typeof window === "undefined") return "";
  let sessionId = sessionStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
};

export default function PollRoom() {
  const { pollId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTheme = searchParams.get("theme") || "";

  const {
    currentPoll: poll,
    loadingCurrent: loading,
    error: storeError,
    subscribeToPoll,
    checkVoteStatus,
    voteForOption,
    sendEmoji
  } = usePollStore();

  const [error, setError] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [voting, setVoting] = useState(false);
  const sessionId = getSessionId();

  // Check if user already voted on current question
  const checkVote = useCallback(async () => {
    if (!pollId || !poll || poll.activeQuestionIndex < 0) return;

    try {
      const votedOptionIndex = await checkVoteStatus(
        pollId,
        poll.activeQuestionIndex,
        sessionId,
      );
      if (votedOptionIndex !== null) {
        setHasVoted(true);
        setSelectedOption(votedOptionIndex);
      } else {
        setHasVoted(false);
        setSelectedOption(null);
      }
    } catch (err) {
      console.error("Error checking vote status:", err);
    }
  }, [pollId, poll?.activeQuestionIndex, sessionId, checkVoteStatus]);

  useEffect(() => {
    checkVote();
  }, [checkVote]);

  // Subscribe to poll updates
  useEffect(() => {
    if (!pollId) {
      setError("No poll ID provided");
      return;
    }

    const unsubscribe = subscribeToPoll(pollId);
    return () => unsubscribe();
  }, [pollId, subscribeToPoll]);

  // Sync store errors to local error state
  useEffect(() => {
    if (storeError) {
      setError(storeError);
    }
  }, [storeError]);

  // Get vote count for a specific option
  const getVoteCount = (questionIndex, optionIndex) => {
    if (!poll?.voteCounts) return 0;
    return poll.voteCounts[`${questionIndex}_${optionIndex}`] || 0;
  };

  // Get all votes for current question
  const getCurrentVotes = () => {
    if (!poll?.questions?.[poll.activeQuestionIndex]) return [];
    return poll.questions[poll.activeQuestionIndex].options.map((_, idx) =>
      getVoteCount(poll.activeQuestionIndex, idx),
    );
  };

  // Get total votes for current question
  const getTotalVotes = () => {
    return getCurrentVotes().reduce((a, b) => a + b, 0);
  };

  // Vote using store action
  const voteForOptionHandler = async (voteData) => {
    if (!poll?.currentQuestionActive || hasVoted || voting) {
      if (!poll?.currentQuestionActive) {
        toast.error("Voting is not active yet. Please wait for the host.");
      }
      return;
    }

    setVoting(true);
    const questionIndex = poll.activeQuestionIndex;

    try {
      const payload = typeof voteData === "number"
        ? { type: "choice", optionIndex: voteData }
        : { type: "wordcloud", text: voteData };

      await voteForOption(pollId, questionIndex, payload, sessionId);
      setHasVoted(true);
      setSelectedOption(voteData);
      toast.success("Response recorded!");
    } catch (err) {
      console.error("Error voting:", err);
      if (err.message?.includes("already voted")) {
        toast.error("You have already voted on this question");
        setHasVoted(true);
      } else {
        toast.error("Failed to submit. Please try again.");
      }
      throw err; // rethrow to let UI components know it failed
    } finally {
      setVoting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin mx-auto mb-4" />
          <p className="text-[#64748B]">Loading poll...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !poll) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-[#1E293B]">
            Poll Not Found
          </h1>
          <p className="text-[#64748B] mb-6">
            {error || "The poll you're trying to access doesn't exist."}
          </p>
          <button
            onClick={() => router.push("/join")}
            className="flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] px-6 py-3 rounded-xl font-semibold text-white mx-auto transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
            Join Another Poll
          </button>
        </div>
      </div>
    );
  }

  // Determine theme from title suffix
  const { theme, cleanTitle } = parseTheme(poll.title, urlTheme, poll.theme);

  const pollNotStarted = poll.activeQuestionIndex === -1 || poll.activeQuestionIndex === undefined;
  const activeQuestion = pollNotStarted ? null : poll.questions?.[poll.activeQuestionIndex];
  const totalVotes = getTotalVotes();
  const currentVotes = getCurrentVotes();

  const handleSendEmoji = (emoji) => {
    sendEmoji(pollId, emoji);
  };

  // Render layout using the merged component
  return (
    <PollScreen
      poll={poll}
      cleanTitle={cleanTitle}
      pollId={pollId}
      hasVoted={hasVoted}
      voting={voting}
      voteForOptionHandler={voteForOptionHandler}
      totalVotes={totalVotes}
      currentVotes={currentVotes}
      pollNotStarted={pollNotStarted}
      activeQuestion={activeQuestion}
      router={router}
      handleSendEmoji={handleSendEmoji}
      theme={theme}
    />
  );
}
