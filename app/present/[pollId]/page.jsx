"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePollStore } from "@/lib/store/usePollStore";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { Loader2 } from "lucide-react";
import { parseTheme } from "@/lib/themeHelper";
import StandardPresent from "@/components/Themes/StandardPresent";

export default function PresentationMode() {
  const { pollId } = useParams();
  const router = useRouter();
  const containerRef = useRef(null);

  const {
    currentPoll: poll,
    loadingCurrent: loading,
    subscribeToPoll,
    startVoting,
    stopVoting,
    nextQuestion,
    prevQuestion,
    endPoll,
    subscribeToPresenter,
    simulateWordCloud,
    isTransitioning,
    deleteResponse,
  } = usePollStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [subscribedId, setSubscribedId] = useState(null);

  const toastSuccess = (msg) => toast.success(msg);
  const toastError = (msg) => toast.error(msg);

  const addReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setReactions((prev) => [
      ...prev,
      {
        id,
        emoji,
        left: Math.random() * 80 - 40,
        rotate: Math.random() * 30 - 15,
      },
    ]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2000);
  };

  // Get current question index
  const currentQuestionIndex = poll?.activeQuestionIndex ?? 0;
  const currentQuestion = poll?.questions?.[currentQuestionIndex];
  const totalQuestions = poll?.questions?.length || 0;
  const isVotingActive = poll?.currentQuestionActive ?? false;

  // Subscribe to poll updates
  useEffect(() => {
    if (!pollId) return;

    setSubscribedId(pollId);
    const unsubscribe = subscribeToPoll(pollId);
    return () => unsubscribe();
  }, [pollId, subscribeToPoll]);

  // Subscribe to presenter real-time emojis
  useEffect(() => {
    if (!pollId) return;
    const unsubscribe = subscribeToPresenter(pollId, (emoji) => {
      addReaction(emoji);
    });
    return () => unsubscribe();
  }, [pollId, subscribeToPresenter]);

  // Bind simulateWordCloud to window for console execution
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.simulateWordCloud = () => {
        simulateWordCloud(pollId, currentQuestionIndex);
        toast.success("Simulated 200 word cloud submissions!");
      };
    }
    return () => {
      if (typeof window !== "undefined") {
        delete window.simulateWordCloud;
      }
    };
  }, [pollId, currentQuestionIndex, simulateWordCloud]);

  // Fullscreen handlers
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  // Poll controls
  const handleStartVoting = async () => {
    try {
      await startVoting(pollId, currentQuestionIndex);
      toastSuccess("Voting started!");
    } catch (err) {
      toastError("Failed to start voting");
    }
  };

  const handleStopVoting = async () => {
    try {
      await stopVoting(pollId);
      toastSuccess("Voting stopped");
    } catch (err) {
      toastError("Failed to stop voting");
    }
  };

  const handleNextQuestion = async () => {
    if (isTransitioning || currentQuestionIndex >= totalQuestions) return;
    try {
      await nextQuestion(pollId, currentQuestionIndex, totalQuestions);
    } catch (err) {
      toastError("Failed to go to next question");
    }
  };

  const handlePrevQuestion = async () => {
    if (isTransitioning || currentQuestionIndex <= 0) return;
    try {
      await prevQuestion(pollId, currentQuestionIndex, false);
    } catch (err) {
      toastError("Failed to go to previous question");
    }
  };

  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const handleEndPoll = () => {
    setShowEndConfirm(true);
  };

  const confirmEndPoll = async () => {
    try {
      await endPoll(pollId);
      toastSuccess("Poll ended");
      router.push("/home");
    } catch (err) {
      toastError("Failed to end poll");
    }
  };

  // Get vote counts for current question
  const getVoteCount = (optionIndex) => {
    if (!poll?.voteCounts) return 0;
    return poll.voteCounts[`${currentQuestionIndex}_${optionIndex}`] || 0;
  };

  const isWordCloud =
    currentQuestion?.type === "WordCloud" ||
    currentQuestion?.type === 1 ||
    String(currentQuestion?.type).toLowerCase() === "wordcloud" ||
    !currentQuestion?.options ||
    currentQuestion.options.length === 0 ||
    currentQuestion.options.every((opt) => {
      const txt = typeof opt === "string" ? opt : opt.text || "";
      return !txt.trim();
    });

  const totalVotes = isWordCloud
    ? Object.values(poll?.wordCloudCounts?.[currentQuestionIndex.toString()] || {}).reduce(
      (sum, count) => sum + count,
      0
    )
    : currentQuestion?.options?.reduce(
      (sum, _, idx) => sum + getVoteCount(idx),
      0
    ) || 0;

  const maxVotes = Math.max(
    ...(currentQuestion?.options?.map((_, idx) => getVoteCount(idx)) || [1]),
    1
  );

  if (loading || subscribedId !== pollId) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!poll || poll.id !== pollId) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white flex flex-col items-center justify-center text-slate-900">
          <h1 className="text-2xl font-bold mb-4">Poll not found</h1>
          <button
            onClick={() => router.push("/home")}
            className="text-[var(--color-primary)] hover:underline"
          >
            Back to Home
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  const pollUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/poll/${pollId}`
      : "";

  const { cleanTitle } = parseTheme(poll.title);

  return (
    <ProtectedRoute>
      <div ref={containerRef} className="w-full h-full relative">
        <StandardPresent
          poll={poll}
          cleanTitle={cleanTitle}
          pollId={pollId}
          currentQuestionIndex={currentQuestionIndex}
          currentQuestion={currentQuestion}
          totalQuestions={totalQuestions}
          isVotingActive={isVotingActive}
          showQR={showQR}
          setShowQR={setShowQR}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          totalVotes={totalVotes}
          getVoteCount={getVoteCount}
          maxVotes={maxVotes}
          handlePrevQuestion={handlePrevQuestion}
          handleNextQuestion={handleNextQuestion}
          handleStartVoting={handleStartVoting}
          handleStopVoting={handleStopVoting}
          handleEndPoll={handleEndPoll}
          pollUrl={pollUrl}
          router={router}
          reactions={reactions}
          addReaction={addReaction}
          isTransitioning={isTransitioning}
          deleteResponse={deleteResponse}
        />
        {/* Floating Emojis Container */}
        <div className="fixed bottom-20 right-10 pointer-events-none z-50 w-36 h-72 overflow-hidden flex justify-center items-end">
          {reactions.map((r) => (
            <span
              key={r.id}
              className="absolute pointer-events-none animate-float-emoji text-3xl select-none"
              style={{
                left: `calc(50% + ${r.left}px)`,
                transform: `rotate(${r.rotate}deg)`,
              }}
            >
              {r.emoji}
            </span>
          ))}
        </div>
        <ConfirmModal
          isOpen={showEndConfirm}
          title="End Poll"
          message="Are you sure you want to end this poll? Participants will no longer be able to vote."
          confirmText="End Poll"
          isDanger={true}
          onConfirm={confirmEndPoll}
          onClose={() => setShowEndConfirm(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
