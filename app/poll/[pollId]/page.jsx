"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { 
  doc, 
  onSnapshot, 
  runTransaction, 
  serverTimestamp,
  getDoc,
  increment
} from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { 
  Loader2, 
  Home, 
  Check, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  Users, 
  Clock
} from "lucide-react";
import toast from "react-hot-toast";

// Chart colors
// Chart colors
const CHART_COLORS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-primary)",
  "var(--color-secondary)",
];

// Generate a unique session ID for vote tracking
const getSessionId = () => {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
};

// Vertical Bar Chart Component
function VerticalBarChart({ options, votes, totalVotes }) {
  const maxVotes = Math.max(...votes, 1);

  return (
    <div className="flex items-end justify-center gap-4 md:gap-6 h-48 md:h-56 px-4">
      {options.map((option, idx) => {
        const voteCount = votes[idx] || 0;
        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
        const height = maxVotes > 0 ? (voteCount / maxVotes) * 100 : 0;

        return (
          <div key={idx} className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
            {/* Vote count */}
            <div className="text-sm font-bold text-[#1E293B]">{voteCount}</div>
            
            {/* Bar */}
            <div className="relative h-32 md:h-40 w-full flex items-end justify-center">
              <div
                className="w-10 md:w-12 rounded-t-lg transition-all duration-700 ease-out"
                style={{
                  height: `${height}%`,
                  backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  minHeight: voteCount > 0 ? "8px" : "4px",
                }}
              />
            </div>
            
            {/* Label */}
            <div className="text-center">
              <div className="text-xs md:text-sm font-semibold text-[#1E293B] truncate max-w-[70px]">
                {option.text}
              </div>
              <div className="text-xs text-[#64748B]">{percentage}%</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function PollRoom() {
  const { pollId } = useParams();
  const router = useRouter();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [voting, setVoting] = useState(false);
  const sessionId = getSessionId();

  // Check if user already voted on current question
  const checkVoteStatus = useCallback(async () => {
    if (!pollId || !poll || poll.activeQuestionIndex < 0) return;
    
    try {
      const voteRef = doc(db, "polls", pollId, "votes", `${sessionId}_${poll.activeQuestionIndex}`);
      const voteDoc = await getDoc(voteRef);
      
      if (voteDoc.exists()) {
        setHasVoted(true);
        setSelectedOption(voteDoc.data().optionIndex);
      } else {
        setHasVoted(false);
        setSelectedOption(null);
      }
    } catch (err) {
      console.error("Error checking vote status:", err);
    }
  }, [pollId, poll?.activeQuestionIndex, sessionId]);

  useEffect(() => {
    checkVoteStatus();
  }, [checkVoteStatus]);

  // Subscribe to poll updates
  useEffect(() => {
    if (!pollId) {
      setError("No poll ID provided");
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "polls", pollId),
      (snap) => {
        if (!snap.exists()) {
          setError("Poll not found");
          setLoading(false);
          return;
        }
        
        const pollData = { id: snap.id, ...snap.data() };
        setPoll(pollData);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Error fetching poll:", err);
        setError("Failed to load poll");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [pollId]);

  // Get vote count for a specific option
  const getVoteCount = (questionIndex, optionIndex) => {
    if (!poll?.voteCounts) return 0;
    return poll.voteCounts[`${questionIndex}_${optionIndex}`] || 0;
  };

  // Get all votes for current question
  const getCurrentVotes = () => {
    if (!poll?.questions?.[poll.activeQuestionIndex]) return [];
    return poll.questions[poll.activeQuestionIndex].options.map((_, idx) => 
      getVoteCount(poll.activeQuestionIndex, idx)
    );
  };

  // Get total votes for current question
  const getTotalVotes = () => {
    return getCurrentVotes().reduce((a, b) => a + b, 0);
  };

  // Vote using atomic transaction
  const voteForOption = async (optionIndex) => {
    if (!poll?.currentQuestionActive || hasVoted || voting) {
      if (!poll?.currentQuestionActive) {
        toast.error("Voting is not active yet. Please wait for the host.");
      }
      return;
    }

    setVoting(true);
    const questionIndex = poll.activeQuestionIndex;
    const voteRef = doc(db, "polls", pollId, "votes", `${sessionId}_${questionIndex}`);
    const pollRef = doc(db, "polls", pollId);

    try {
      await runTransaction(db, async (transaction) => {
        const voteDoc = await transaction.get(voteRef);
        if (voteDoc.exists()) {
          throw new Error("You have already voted on this question");
        }

        transaction.set(voteRef, {
          sessionId,
          questionIndex,
          optionIndex,
          timestamp: serverTimestamp()
        });

        transaction.update(pollRef, {
          [`voteCounts.${questionIndex}_${optionIndex}`]: increment(1)
        });
      });

      setHasVoted(true);
      setSelectedOption(optionIndex);
      toast.success("Vote recorded!");
    } catch (err) {
      console.error("Error voting:", err);
      if (err.message.includes("already voted")) {
        toast.error("You have already voted on this question");
        setHasVoted(true);
      } else {
        toast.error("Failed to vote. Please try again.");
      }
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
          <h1 className="text-2xl font-bold mb-4 text-[#1E293B]">Poll Not Found</h1>
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

  // Poll not started
  const pollNotStarted = poll.activeQuestionIndex === -1 || poll.activeQuestionIndex === undefined;
  const activeQuestion = pollNotStarted ? null : poll.questions?.[poll.activeQuestionIndex];
  const totalVotes = getTotalVotes();
  const currentVotes = getCurrentVotes();

  if (pollNotStarted) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="max-w-lg text-center">
          <h1 className="text-3xl font-bold mb-3 text-[#1E293B]">{poll.title}</h1>
          <code className="text-sm bg-[#E2E8F0] px-3 py-1 rounded-lg text-[#64748B] mb-8 inline-block">
            {pollId}
          </code>
          
          <div className="bg-white rounded-2xl p-8 border border-[#E2E8F0] shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <h2 className="text-xl font-bold mb-3 text-[#1E293B]">Waiting for Host</h2>
            <p className="text-[#64748B] mb-6">The poll will begin shortly...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="w-2 h-2 bg-[var(--color-primary)] rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Poll ended
  if (!activeQuestion || poll.status === "ended") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-[#1E293B]">Poll Ended</h1>
          <p className="text-[#64748B] mb-6">Thank you for participating!</p>
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] px-6 py-3 rounded-xl font-semibold text-white mx-auto transition-colors"
          >
            <Home className="w-5 h-5" />
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Active voting
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-[#1E293B] mb-2">{poll.title}</h1>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-sm bg-[#E2E8F0] px-3 py-1 rounded-full text-[#64748B]">
              Q{poll.activeQuestionIndex + 1}/{poll.questions?.length}
            </span>
            <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1.5 ${
              poll.currentQuestionActive
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {poll.currentQuestionActive ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  Waiting
                </>
              )}
            </span>
            {hasVoted && (
              <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Voted
              </span>
            )}
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl md:text-2xl font-bold text-[#1E293B] text-center mb-2">
              {activeQuestion.text}
            </h2>
            {totalVotes > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-[#64748B]">
                <Users className="w-4 h-4" />
                {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Show results if voted */}
          {hasVoted && (
            <div className="px-4 pb-6">
              <VerticalBarChart
                options={activeQuestion.options}
                votes={currentVotes}
                totalVotes={totalVotes}
              />
            </div>
          )}

          {/* Voting options */}
          {!hasVoted && (
            <div className="p-4 space-y-3">
              {activeQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => voteForOption(idx)}
                  disabled={!poll.currentQuestionActive || voting}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-4 ${
                    poll.currentQuestionActive && !voting
                      ? "bg-[#F8FAFC] hover:bg-slate-100 border-2 border-transparent hover:border-[var(--color-primary)] cursor-pointer active:scale-[0.98]"
                      : "bg-[#F1F5F9] cursor-not-allowed opacity-60"
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="text-[#1E293B] font-medium">{option.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* Status bar */}
          <div className="px-4 pb-4">
            {voting ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Recording vote...</span>
              </div>
            ) : hasVoted ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-green-100 rounded-xl text-green-700">
                <Check className="w-5 h-5" />
                <span className="font-medium">Your vote is in! Results update live.</span>
              </div>
            ) : !poll.currentQuestionActive ? (
              <div className="flex items-center justify-center gap-2 p-4 bg-yellow-100 rounded-xl text-yellow-700">
                <Lock className="w-5 h-5" />
                <span className="font-medium">Voting locked. Wait for host.</span>
              </div>
            ) : (
              <div className="text-center p-4 bg-[var(--color-primary)]/10 rounded-xl text-[var(--color-primary)]">
                <span className="font-medium">Tap an option to vote</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
