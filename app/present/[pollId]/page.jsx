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
    endPoll
  } = usePollStore();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQR, setShowQR] = useState(true);

  // Get current question index
  const currentQuestionIndex = poll?.activeQuestionIndex ?? 0;
  const currentQuestion = poll?.questions?.[currentQuestionIndex];
  const totalQuestions = poll?.questions?.length || 0;
  const isVotingActive = poll?.currentQuestionActive ?? false;

  // Subscribe to poll updates
  useEffect(() => {
    if (!pollId) return;

    const unsubscribe = subscribeToPoll(pollId);
    return () => unsubscribe();
  }, [pollId, subscribeToPoll]);

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
      toast.success("Voting started!");
    } catch (err) {
      toast.error("Failed to start voting");
    }
  };

  const handleStopVoting = async () => {
    try {
      await stopVoting(pollId);
      toast.success("Voting stopped");
    } catch (err) {
      toast.error("Failed to stop voting");
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex >= totalQuestions - 1) return;
    try {
      await nextQuestion(pollId, currentQuestionIndex);
    } catch (err) {
      toast.error("Failed to go to next question");
    }
  };

  const handlePrevQuestion = async () => {
    if (currentQuestionIndex <= 0) return;
    try {
      await prevQuestion(pollId, currentQuestionIndex);
    } catch (err) {
      toast.error("Failed to go to previous question");
    }
  };

  const handleEndPoll = async () => {
    if (
      confirm("End this poll? Participants will no longer be able to vote.")
    ) {
      try {
        await endPoll(pollId);
        toast.success("Poll ended");
        router.push("/dashboard");
      } catch (err) {
        toast.error("Failed to end poll");
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!poll) {
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
        <div ref={containerRef} className="w-full h-full">
          <SynergySpherePresent
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
          />
        </div>
      </ProtectedRoute>
    );
  }

  if (theme === "masterclass") {
    return (
      <ProtectedRoute>
        <div ref={containerRef} className="w-full h-full">
          <MasterclassPresent
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
          />
        </div>
      </ProtectedRoute>
    );
  }

  // Default Standard Present
  return (
    <ProtectedRoute>
      <div ref={containerRef} className="w-full h-full">
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
        />
      </div>
    </ProtectedRoute>
  );
}
