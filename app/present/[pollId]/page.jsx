"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { usePollStore } from "@/lib/store/usePollStore";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { parseTheme } from "@/lib/themeHelper";

import StandardPresent from "@/components/Themes/StandardPresent";
import SynergySpherePresent from "@/components/Themes/SynergySpherePresent";
import MasterclassPresent from "@/components/Themes/MasterclassPresent";

export default function PresentationMode() {
  const { pollId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTheme = searchParams.get("theme") || "";
  const { user } = useAuth();
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
  } = usePollStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [subscribedId, setSubscribedId] = useState(null);

  // ── Theme-aware toast helper (works even before poll loads) ──
  const rawTheme = urlTheme || "";
  const isSynergyTheme = rawTheme === "synergy_sphere";
  const isMasterclassTheme = rawTheme === "masterclass";

  const toastStyle = isSynergyTheme
    ? {
        background: "#1c0a0a",
        color: "#fda4af",
        border: "1px solid rgba(244,63,94,0.25)",
        borderRadius: "12px",
        fontSize: "13px",
        fontWeight: "500",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        padding: "10px 14px",
      }
    : isMasterclassTheme
    ? {
        background: "#051a10",
        color: "#6ee7b7",
        border: "1px solid rgba(16,185,129,0.25)",
        borderRadius: "12px",
        fontSize: "13px",
        fontWeight: "500",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        padding: "10px 14px",
      }
    : undefined; // use global default

  const toastSuccess = (msg) => toast.success(msg, toastStyle ? { style: toastStyle, iconTheme: { primary: isSynergyTheme ? "#f43f5e" : "#10b981", secondary: isSynergyTheme ? "#1c0a0a" : "#051a10" } } : undefined);
  const toastError   = (msg) => toast.error(msg,   toastStyle ? { style: toastStyle, iconTheme: { primary: "#ef4444", secondary: isSynergyTheme ? "#1c0a0a" : "#051a10" } } : undefined);

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
      toastSuccess("Next question started!");
    } catch (err) {
      toastError("Failed to go to next question");
    }
  };

  const handlePrevQuestion = async () => {
    const isIu = theme === "iu";
    if (isTransitioning || (isIu ? currentQuestionIndex < 0 : currentQuestionIndex <= 0)) return;
    try {
      await prevQuestion(pollId, currentQuestionIndex, isIu);
      toastSuccess("Previous question started!");
    } catch (err) {
      toastError("Failed to go to previous question");
    }
  };

  const handleEndPoll = async () => {
    if (
      confirm("End this poll? Participants will no longer be able to vote.")
    ) {
      try {
        await endPoll(pollId);
        toastSuccess("Poll ended");
        router.push("/dashboard");
      } catch (err) {
        toastError("Failed to end poll");
      }
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
            onClick={() => router.push("/dashboard")}
            className="text-[var(--color-primary)] hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  const pollUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/poll/${pollId}`
      : "";

  // Parse title and theme from title suffix
  const { theme, cleanTitle } = parseTheme(poll.title, urlTheme, poll.theme);

  // Render correct theme layout
  if (theme === "synergy_sphere") {
    return (
      <ProtectedRoute>
        <div ref={containerRef} className="w-full h-full relative">
          <SynergySpherePresent
            key={currentQuestionIndex}
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

        </div>
      </ProtectedRoute>
    );
  }

  if (theme === "masterclass") {
    return (
      <ProtectedRoute>
        <div ref={containerRef} className="w-full h-full relative">
          <MasterclassPresent
            key={currentQuestionIndex}
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

        </div>
      </ProtectedRoute>
    );
  }

  // Default Standard Present
  return (
    <ProtectedRoute>
      <div ref={containerRef} className="w-full h-full relative">
        <StandardPresent
          key={currentQuestionIndex}
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
          theme={theme}
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

      </div>
    </ProtectedRoute>
  );
}
