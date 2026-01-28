"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { 
  ChevronLeft, 
  BarChart3, 
  Loader2, 
  AlertCircle 
} from "lucide-react";

export default function PollResults() {
  const { pollId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPoll = async () => {
      if (!pollId) return;
      
      try {
        const pollDoc = await getDoc(doc(db, "polls", pollId));
        if (pollDoc.exists()) {
          setPoll({ id: pollDoc.id, ...pollDoc.data() });
        } else {
          setError("Poll not found");
        }
      } catch (err) {
        console.error("Error fetching poll:", err);
        setError("Failed to load poll");
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [pollId]);

  // Get votes for a specific question/option
  const getVoteCount = (questionIndex, optionIndex) => {
    if (!poll?.voteCounts) return 0;
    return poll.voteCounts[`${questionIndex}_${optionIndex}`] || 0;
  };

  // Get total votes for a question
  const getTotalVotesForQuestion = (questionIndex) => {
    if (!poll?.questions?.[questionIndex] || !poll.voteCounts) return 0;
    return poll.questions[questionIndex].options.reduce((sum, _, optIdx) => {
      return sum + (poll.voteCounts[`${questionIndex}_${optIdx}`] || 0);
    }, 0);
  };

  const calculatePercentage = (votes, total) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-eggshell flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-light-taupe animate-spin mx-auto mb-4" />
            <p className="text-silver-pink">Loading results...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !poll) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-eggshell flex flex-col items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4 text-light-taupe">Poll Not Found</h1>
            <p className="text-silver-pink mb-6">{error || "Unable to load poll results."}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-gradient-to-r from-light-taupe to-silver-pink text-eggshell px-6 py-3 rounded-xl font-semibold"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-eggshell p-4 md:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-light-taupe hover:text-light-taupe/80 transition-colors mb-4"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-light-taupe">{poll.title}</h1>
            <p className="text-silver-pink mt-2">Poll ID: {pollId}</p>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {poll.questions?.map((question, qIndex) => {
              const totalVotes = getTotalVotesForQuestion(qIndex);
              
              return (
                <div key={qIndex} className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-silver-pink/30">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-light-taupe/10 text-light-taupe font-semibold px-3 py-1 rounded-lg">
                      Q{qIndex + 1}
                    </span>
                    <span className="text-sm text-silver-pink">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-light-taupe mb-4">{question.text}</h3>
                  
                  <div className="space-y-3">
                    {question.options?.map((option, optIndex) => {
                      const votes = getVoteCount(qIndex, optIndex);
                      const percentage = calculatePercentage(votes, totalVotes);
                      
                      return (
                        <div key={optIndex} className="relative">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-light-taupe">{option.text}</span>
                            <span className="text-sm text-silver-pink">{votes} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-white/30 rounded-full h-3">
                            <div 
                              className="h-3 rounded-full bg-gradient-to-r from-light-taupe to-silver-pink transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
