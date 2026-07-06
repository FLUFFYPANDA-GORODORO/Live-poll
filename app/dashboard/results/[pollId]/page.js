"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePollStore } from "@/lib/store/usePollStore";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { 
  ChevronLeft, 
  BarChart3, 
  Loader2, 
  AlertCircle,
  Download
} from "lucide-react";

export default function PollResults() {
  const { pollId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const {
    fetchPollById,
    currentPoll: poll,
    loadingCurrent: loading,
    error: storeError
  } = usePollStore();

  const [error, setError] = useState("");

  useEffect(() => {
    if (pollId) {
      fetchPollById(pollId);
    }
  }, [pollId, fetchPollById]);

  useEffect(() => {
    if (storeError) {
      setError(storeError);
    }
  }, [storeError]);

  const handleExport = () => {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5065").replace(/\/$/, "");
    const link = document.createElement("a");
    link.href = `${apiBase}/api/polls/${pollId}/export`;
    link.setAttribute("download", `poll-${pollId}-export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isQuestionWordCloud = (question) => {
    if (!question) return false;
    return (
      question.type === "WordCloud" ||
      question.type === 1 ||
      String(question.type).toLowerCase() === "wordcloud" ||
      !question.options ||
      question.options.length === 0 ||
      question.options.every((opt) => {
        const txt = typeof opt === "string" ? opt : opt.text || "";
        return !txt.trim();
      })
    );
  };

  // Get votes for a specific question/option
  const getVoteCount = (questionIndex, optionIndex) => {
    if (!poll?.voteCounts) return 0;
    return poll.voteCounts[`${questionIndex}_${optionIndex}`] || 0;
  };

  // Get total votes for a question
  const getTotalVotesForQuestion = (questionIndex) => {
    const question = poll?.questions?.[questionIndex];
    if (!question) return 0;

    if (isQuestionWordCloud(question)) {
      const wordsData = poll.wordCloudCounts?.[questionIndex.toString()] || {};
      return Object.values(wordsData).reduce((sum, val) => sum + val, 0);
    }

    if (!poll.voteCounts) return 0;
    return question.options.reduce((sum, _, optIdx) => {
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
          <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
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
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:opacity-90 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200 self-start md:self-auto"
            >
              <Download className="w-5 h-5" />
              <span>Export to CSV</span>
            </button>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {poll.questions?.map((question, qIndex) => {
              const totalVotes = getTotalVotesForQuestion(qIndex);
              const isCloud = isQuestionWordCloud(question);
              
              return (
                <div key={qIndex} className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-silver-pink/30">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="bg-light-taupe/10 text-light-taupe font-semibold px-3 py-1 rounded-lg">
                      Q{qIndex + 1}
                    </span>
                    <span className="text-sm text-silver-pink">{totalVotes} response{totalVotes !== 1 ? 's' : ''}</span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-light-taupe mb-4">{question.text}</h3>
                  
                  <div className="space-y-3">
                    {!isCloud && question.options && question.options.length > 0 ? (
                      question.options.map((option, optIndex) => {
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
                      })
                    ) : (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {Object.entries(poll.wordCloudCounts?.[qIndex.toString()] || {}).length > 0 ? (
                          Object.entries(poll.wordCloudCounts?.[qIndex.toString()] || {}).map(([word, count]) => (
                            <span key={word} className="bg-light-taupe/10 text-light-taupe px-3 py-1.5 rounded-xl text-sm flex items-center gap-2 font-medium border border-light-taupe/10">
                              <span className="text-slate-800 font-bold">{word}</span>
                              <span className="bg-light-taupe text-white px-2 py-0.5 rounded-lg text-xs font-bold">{count}</span>
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-slate-400 italic">No responses received yet.</p>
                        )}
                      </div>
                    )}
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
