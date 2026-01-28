"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Square,
  Users,
  Loader2,
  X,
} from "lucide-react";

// Chart colors
const CHART_COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#14B8A6",
];

export default function PresentationMode() {
  const { pollId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const containerRef = useRef(null);
  
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
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

    const unsubscribe = onSnapshot(
      doc(db, "polls", pollId),
      (docSnap) => {
        if (docSnap.exists()) {
          setPoll({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to poll:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [pollId]);

  // Fullscreen handlers
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  // Poll controls
  const startVoting = async () => {
    try {
      await updateDoc(doc(db, "polls", pollId), {
        status: "live",
        activeQuestionIndex: currentQuestionIndex >= 0 ? currentQuestionIndex : 0,
        currentQuestionActive: true,
      });
      toast.success("Voting started!");
    } catch (err) {
      toast.error("Failed to start voting");
    }
  };

  const stopVoting = async () => {
    try {
      await updateDoc(doc(db, "polls", pollId), {
        currentQuestionActive: false,
      });
      toast.success("Voting stopped");
    } catch (err) {
      toast.error("Failed to stop voting");
    }
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex >= totalQuestions - 1) return;
    try {
      await updateDoc(doc(db, "polls", pollId), {
        activeQuestionIndex: currentQuestionIndex + 1,
        currentQuestionActive: false,
      });
    } catch (err) {
      toast.error("Failed to go to next question");
    }
  };

  const prevQuestion = async () => {
    if (currentQuestionIndex <= 0) return;
    try {
      await updateDoc(doc(db, "polls", pollId), {
        activeQuestionIndex: currentQuestionIndex - 1,
        currentQuestionActive: false,
      });
    } catch (err) {
      toast.error("Failed to go to previous question");
    }
  };

  const endPoll = async () => {
    if (confirm("End this poll? Participants will no longer be able to vote.")) {
      try {
        await updateDoc(doc(db, "polls", pollId), {
          status: "ended",
          currentQuestionActive: false,
        });
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

  const totalVotes = currentQuestion?.options?.reduce(
    (sum, _, idx) => sum + getVoteCount(idx),
    0
  ) || 0;

  const maxVotes = Math.max(
    ...currentQuestion?.options?.map((_, idx) => getVoteCount(idx)) || [1],
    1
  );

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-[#6366F1] animate-spin" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!poll) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-white">
          <h1 className="text-2xl font-bold mb-4">Poll not found</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-[#6366F1] hover:underline"
          >
            Back to Dashboard
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  const pollUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/poll/${pollId}` 
    : "";

  return (
    <ProtectedRoute>
      <div
        ref={containerRef}
        className="min-h-screen bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#0F172A] flex flex-col"
      >
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-white">{poll.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-white text-sm">
              <Users className="w-4 h-4" />
              <span>{totalVotes} votes</span>
            </div>
            <button
              onClick={() => setShowQR(!showQR)}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20"
            >
              {showQR ? "Hide" : "Show"} QR
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-8 py-6 relative">
          {/* QR Code */}
          {showQR && (
            <div className="absolute top-4 right-8 bg-white p-3 rounded-xl shadow-2xl">
              <QRCodeSVG value={pollUrl} size={100} />
              <p className="text-[10px] text-center mt-1 text-[#64748B] font-mono">
                {pollId}
              </p>
            </div>
          )}

          <div className="w-full max-w-4xl">
            {/* Question */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                {currentQuestion?.text || "No question"}
              </h2>
              <div className="mt-4 text-white/60">
                Question {currentQuestionIndex + 1} of {totalQuestions}
                {isVotingActive && (
                  <span className="ml-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    Live
                  </span>
                )}
              </div>
            </div>

            {/* Vertical Bar Chart */}
            <div className="flex items-end justify-center gap-6 md:gap-10 h-64 md:h-80">
              {currentQuestion?.options?.map((option, idx) => {
                const votes = getVoteCount(idx);
                const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                const height = maxVotes > 0 ? (votes / maxVotes) * 100 : 0;

                return (
                  <div key={idx} className="flex flex-col items-center gap-3">
                    {/* Vote count */}
                    <div className="text-white font-bold text-lg">{votes}</div>
                    
                    {/* Bar */}
                    <div className="relative h-48 md:h-64 w-16 md:w-20 flex items-end">
                      <div
                        className="w-full rounded-t-xl transition-all duration-700 ease-out"
                        style={{
                          height: `${height}%`,
                          backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                          minHeight: votes > 0 ? "12px" : "4px",
                          boxShadow: `0 0 20px ${CHART_COLORS[idx % CHART_COLORS.length]}40`,
                        }}
                      />
                    </div>
                    
                    {/* Label */}
                    <div className="text-center">
                      <div className="text-white font-semibold text-sm md:text-base truncate max-w-[80px]">
                        {option.text}
                      </div>
                      <div className="text-white/60 text-sm">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Bottom Controls */}
        <footer className="px-8 py-6">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prevQuestion}
              disabled={currentQuestionIndex <= 0}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {isVotingActive ? (
              <button
                onClick={stopVoting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-yellow-500 text-white font-semibold hover:bg-yellow-600"
              >
                <Square className="w-5 h-5" />
                Stop Voting
              </button>
            ) : (
              <button
                onClick={startVoting}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white font-semibold hover:shadow-lg hover:shadow-[#6366F1]/30"
              >
                Start Voting
              </button>
            )}

            <button
              onClick={nextQuestion}
              disabled={currentQuestionIndex >= totalQuestions - 1}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="w-px h-8 bg-white/20 mx-2" />

            <button
              onClick={endPoll}
              className="px-5 py-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              End Poll
            </button>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
