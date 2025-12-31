"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Home, Check, BarChart3, Lock, AlertCircle, ArrowRight, Users } from "lucide-react";

export default function PollRoom() {
  const { pollId } = useParams();
  const router = useRouter();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  // Get user's voting status from localStorage - FIXED: Track by question index
  useEffect(() => {
    if (pollId && poll) {
      const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "{}");
      const pollKey = `${pollId}_${poll.activeQuestionIndex}`;
      if (votedPolls[pollKey]) {
        setHasVoted(true);
        setSelectedOption(votedPolls[pollKey].optionIndex);
      } else {
        setHasVoted(false);
        setSelectedOption(null);
      }
    }
  }, [pollId, poll?.activeQuestionIndex]);

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
        
        const pollData = snap.data();
        setPoll(pollData);
        setLoading(false);
        setError("");

        // Calculate total votes for current question
        if (pollData.activeQuestionIndex >= 0 && pollData.questions?.[pollData.activeQuestionIndex]) {
          const currentQuestion = pollData.questions[pollData.activeQuestionIndex];
          const votes = currentQuestion.options.reduce((sum, option) => sum + (option.votes || 0), 0);
          setTotalVotes(votes);
        }
      },
      (err) => {
        console.error("Error fetching poll:", err);
        setError("Failed to load poll");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [pollId]);

  const voteForOption = async (optionIndex) => {
    // Only allow voting if question is active AND user hasn't voted
    if (!poll?.currentQuestionActive || hasVoted || !poll || poll.activeQuestionIndex < 0) {
      if (!poll?.currentQuestionActive) {
        alert("Question is not active yet. Please wait for the host to activate it.");
      }
      return;
    }

    try {
      const pollRef = doc(db, "polls", pollId);
      const pollSnap = await getDoc(pollRef);
      
      if (!pollSnap.exists()) {
        alert("Poll not found");
        return;
      }

      const pollData = pollSnap.data();
      const currentQuestion = pollData.questions[poll.activeQuestionIndex];
      
      if (!currentQuestion || !currentQuestion.options[optionIndex]) {
        alert("Invalid option");
        return;
      }

      // Update the vote count
      const updatedOptions = [...currentQuestion.options];
      updatedOptions[optionIndex] = {
        ...updatedOptions[optionIndex],
        votes: (updatedOptions[optionIndex].votes || 0) + 1
      };

      // Update the poll in Firestore
      const updatedQuestions = [...pollData.questions];
      updatedQuestions[poll.activeQuestionIndex] = {
        ...currentQuestion,
        options: updatedOptions
      };

      await updateDoc(pollRef, {
        questions: updatedQuestions
      });

      // Update local state
      setHasVoted(true);
      setSelectedOption(optionIndex);
      setTotalVotes(totalVotes + 1);

      // Save vote to localStorage - FIXED: Track by question index
      const votedPolls = JSON.parse(localStorage.getItem("votedPolls") || "{}");
      const pollKey = `${pollId}_${poll.activeQuestionIndex}`;
      votedPolls[pollKey] = {
        optionIndex,
        timestamp: Date.now()
      };
      localStorage.setItem("votedPolls", JSON.stringify(votedPolls));

    } catch (err) {
      console.error("Error voting:", err);
      alert("Failed to vote. Please try again.");
    }
  };

  const calculatePercentage = (votes) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mb-4" />
        <p className="text-gray-400">Loading poll...</p>
      </div>
    );
  }

  // Error state
  if (error || !poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Poll Not Found</h1>
          <p className="text-gray-400 mb-6">
            {error || "The poll you're trying to access doesn't exist or has been removed."}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push("/join")}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <ArrowRight className="w-5 h-5" />
              Join Another Poll
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 border border-gray-600 hover:border-gray-500 px-6 py-3 rounded-xl font-semibold transition-all"
            >
              <Home className="w-5 h-5" />
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if poll hasn't started yet
  const pollNotStarted = poll.activeQuestionIndex === -1 || poll.activeQuestionIndex === undefined;
  const activeQuestion = pollNotStarted 
    ? null 
    : poll.questions?.[poll.activeQuestionIndex];

  // Poll hasn't started - waiting screen
  if (pollNotStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              {poll.title}
            </h1>
            <p className="text-gray-400">Poll ID: <code className="bg-gray-800 px-2 py-1 rounded text-indigo-300">{pollId}</code></p>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-600 shadow-xl">
            <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-12 h-12 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">Waiting for Host to Start</h2>
            <p className="text-gray-300 mb-6">
              The poll host will start the session soon. Please wait...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" />
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if activeQuestion is valid
  if (!activeQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Poll Ended</h1>
          <p className="text-gray-400 mb-6">
            This poll has ended. Thank you for participating!
          </p>
          <button
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
          >
            <Home className="w-5 h-5" />
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // Active poll with questions
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-600 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">{poll.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="text-sm bg-gray-700 px-3 py-1 rounded-full">
                  Question {poll.activeQuestionIndex + 1} of {poll.questions?.length || 0}
                </span>
                <span className={`text-sm px-3 py-1 rounded-full flex items-center gap-1 ${
                  poll.status === "live" && poll.currentQuestionActive
                    ? "bg-green-500/30 text-green-300 border border-green-500/50"
                    : poll.status === "live"
                    ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/50"
                    : "bg-gray-500/30 text-gray-300 border border-gray-500/50"
                }`}>
                  {poll.status === "live" && poll.currentQuestionActive ? (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Voting Active
                    </>
                  ) : poll.status === "live" ? (
                    <>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      Ready
                    </>
                  ) : (
                    "Ended"
                  )}
                </span>
                {hasVoted && (
                  <span className="text-sm px-3 py-1 bg-green-500/30 text-green-300 rounded-full flex items-center gap-1 border border-green-500/50">
                    <Check className="w-3 h-3" />
                    Voted
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Poll ID</p>
              <code className="font-mono font-bold text-lg bg-gray-800 px-3 py-1 rounded-lg border border-gray-700">
                {pollId}
              </code>
            </div>
          </div>
        </div>

        {/* Question Status Banner */}
        {!poll.currentQuestionActive && (
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl p-4 mb-6 shadow-lg">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="font-semibold text-yellow-300">Question Locked</p>
                <p className="text-sm text-yellow-300/90">
                  Waiting for host to activate this question for voting
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-gray-600 shadow-xl mb-8">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <span className="text-indigo-300 font-semibold bg-indigo-500/20 px-3 py-1 rounded-lg">
                Question {poll.activeQuestionIndex + 1}
              </span>
              {totalVotes > 0 && (
                <button
                  onClick={() => setShowResults(!showResults)}
                  className="flex items-center gap-2 text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-2 rounded-lg transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  {showResults ? 'Hide Results' : 'Show Results'}
                </button>
              )}
            </div>
            {totalVotes > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
                <Users className="w-4 h-4" />
                <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''} received</span>
              </div>
            )}
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-white">
            {activeQuestion.text}
          </h2>

          {/* Options */}
          <div className="space-y-4">
            {activeQuestion.options?.map((option, index) => {
              const percentage = calculatePercentage(option.votes || 0);
              const isSelected = selectedOption === index;
              
              return (
                <button
                  key={index}
                  onClick={() => voteForOption(index)}
                  disabled={!poll.currentQuestionActive || hasVoted}
                  className={`w-full relative overflow-hidden rounded-xl p-5 text-left transition-all duration-200 shadow-lg ${
                    poll.currentQuestionActive && !hasVoted 
                      ? 'hover:scale-[1.01] active:scale-[0.99] hover:shadow-indigo-500/20 cursor-pointer' 
                      : 'cursor-not-allowed'
                  } ${
                    isSelected 
                      ? 'border-2 border-green-500 bg-gradient-to-r from-green-500/10 to-emerald-500/10 shadow-green-500/20' 
                      : 'border border-gray-600 bg-gradient-to-r from-gray-800 to-gray-900'
                  }`}
                >
                  {/* Voting progress bar (only when showResults is true) */}
                  {showResults && percentage > 0 && (
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-all ${
                        isSelected 
                          ? 'border-green-500 bg-green-500/20 text-green-300 shadow-green-500/30' 
                          : 'border-gray-500 bg-gray-700 text-gray-300'
                      }`}>
                        {String.fromCharCode(65 + index)}
                        {isSelected && (
                          <Check className="absolute -top-1 -right-1 w-5 h-5 text-green-400 bg-green-500/30 rounded-full p-1" />
                        )}
                      </div>
                      <span className="text-lg font-medium">{option.text}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {showResults && (
                        <>
                          <span className="text-lg font-bold bg-gray-800/50 px-3 py-1 rounded-lg min-w-[60px] text-center">
                            {percentage}%
                          </span>
                          <span className="text-sm text-gray-300 min-w-[80px] text-right">
                            {option.votes || 0} vote{(option.votes || 0) !== 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                      {!showResults && (option.votes || 0) > 0 && (
                        <span className="text-sm text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                          {option.votes || 0} vote{(option.votes || 0) !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Vote button for participants */}
                  {!hasVoted && poll.currentQuestionActive && (
                    <div className="relative z-10 mt-4 text-right">
                      <span className="text-sm text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-lg inline-block">
                        Click to vote
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Voting status */}
          <div className="mt-8 pt-6 border-t border-gray-600">
            {hasVoted ? (
              <div className="flex items-center justify-center gap-3 text-green-300 bg-green-500/10 p-4 rounded-xl border border-green-500/30">
                <Check className="w-5 h-5" />
                <span className="font-medium">Your vote has been recorded! Waiting for next question...</span>
              </div>
            ) : poll.currentQuestionActive ? (
              <div className="text-center p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
                <p className="text-gray-300">
                  <span className="font-semibold text-indigo-300">Select an option above to vote.</span> You can only vote once per question.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 text-yellow-300 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/30">
                <Lock className="w-5 h-5" />
                <span className="font-medium">Voting is locked. Please wait for the host to activate this question.</span>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        {!hasVoted && poll.currentQuestionActive && (
          <div className="text-center p-4 bg-gray-800/50 rounded-xl border border-gray-600">
            <p className="text-gray-300">
              <span className="text-indigo-300 font-semibold">Tip:</span> You can click on "Show Results" to see live voting percentages
            </p>
          </div>
        )}
      </div>
    </div>
  );
}