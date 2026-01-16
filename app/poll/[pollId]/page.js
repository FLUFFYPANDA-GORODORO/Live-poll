"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { 
  Loader2, 
  Home, 
  Check, 
  BarChart3, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  Users, 
  Eye, 
  EyeOff, 
  Clock, 
  RefreshCw, 
  ChevronRight, 
  TrendingUp, 
  Award, 
  Target,
  PieChart,
  ChevronLeft,
  X,
  Calendar
} from "lucide-react";

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
  const [userName, setUserName] = useState("Participant");
  const [previousQuestionResults, setPreviousQuestionResults] = useState(null);

  // Get user's voting status from localStorage
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

  // Get participant name from localStorage
  useEffect(() => {
    const storedName = localStorage.getItem("participantName");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

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

        // Store results of previous question when host moves to next question
        if (pollData.activeQuestionIndex > 0 && !pollData.currentQuestionActive) {
          const prevQuestionIndex = pollData.activeQuestionIndex - 1;
          const prevQuestion = pollData.questions[prevQuestionIndex];
          if (prevQuestion) {
            const prevVotes = prevQuestion.options.reduce((sum, option) => sum + (option.votes || 0), 0);
            setPreviousQuestionResults({
              questionIndex: prevQuestionIndex,
              questionText: prevQuestion.text,
              totalVotes: prevVotes,
              options: prevQuestion.options.map((opt, idx) => ({
                ...opt,
                percentage: prevVotes > 0 ? Math.round((opt.votes / prevVotes) * 100) : 0
              }))
            });
          }
        } else {
          setPreviousQuestionResults(null);
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

      // Save vote to localStorage
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
      <div className="min-h-screen bg-eggshell text-foreground flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-light-taupe border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-silver-pink">Loading poll...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !poll) {
    return (
      <div className="min-h-screen bg-eggshell text-foreground flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-light-taupe">Poll Not Found</h1>
          <p className="text-silver-pink mb-6">
            {error || "The poll you're trying to access doesn't exist or has been removed."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/join")}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] px-6 py-3 rounded-xl font-semibold text-eggshell transition-all hover:scale-105"
            >
              <ArrowRight className="w-5 h-5" />
              Join Another Poll
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-6 py-3 rounded-xl text-light-taupe transition-colors hover:bg-white/50"
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
      <div className="min-h-screen bg-eggshell text-foreground flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl text-center">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-light-taupe to-silver-pink bg-clip-text text-transparent">
              {poll.title}
            </h1>
            <div className="flex items-center justify-center gap-2 text-silver-pink">
              <span>Poll ID:</span>
              <code className="bg-white/50 border border-silver-pink/30 px-3 py-1 rounded-lg text-light-taupe font-mono">
                {pollId}
              </code>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-6 md:p-8 border border-silver-pink/30 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-light-taupe/20 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-light-taupe" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-4 text-light-taupe">Waiting for Host to Start</h2>
            <p className="text-silver-pink mb-6">
              The poll host will start the session soon. Please wait...
            </p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-light-taupe rounded-full animate-pulse" />
              <div className="w-3 h-3 bg-light-taupe rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="w-3 h-3 bg-light-taupe rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>

          <div className="mt-8">
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-6 py-3 rounded-xl text-light-taupe transition-colors hover:bg-white/50 mx-auto"
            >
              <Home className="w-5 h-5" />
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if activeQuestion is valid
  if (!activeQuestion) {
    return (
      <div className="min-h-screen bg-eggshell text-foreground flex flex-col items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-light-taupe">Poll Ended</h1>
          <p className="text-silver-pink mb-6">
            Thank you for participating! This poll has ended.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/")}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] px-6 py-3 rounded-xl font-semibold text-eggshell transition-all hover:scale-105"
            >
              <Home className="w-5 h-5" />
              Return Home
            </button>
            <button
              onClick={() => router.push("/join")}
              className="flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-6 py-3 rounded-xl text-light-taupe transition-colors hover:bg-white/50"
            >
              <ArrowRight className="w-5 h-5" />
              Join Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active poll with questions
  return (
    <div className="min-h-screen bg-eggshell text-foreground p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 md:p-6 border border-silver-pink/30 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-light-taupe mb-2">{poll.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs md:text-sm bg-white/50 border border-silver-pink/30 px-2.5 py-1 rounded-full text-light-taupe">
                  Question {poll.activeQuestionIndex + 1} of {poll.questions?.length || 0}
                </span>
                <span className={`text-xs md:text-sm px-2.5 py-1 rounded-full flex items-center gap-1 border ${
                  poll.status === "live" && poll.currentQuestionActive
                    ? "bg-green-500/20 text-green-700 border-green-500/30"
                    : poll.status === "live"
                    ? "bg-yellow-500/20 text-yellow-700 border-yellow-500/30"
                    : "bg-gray-500/20 text-gray-700 border-gray-500/30"
                }`}>
                  {poll.status === "live" && poll.currentQuestionActive ? (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Live Voting</span>
                    </>
                  ) : poll.status === "live" ? (
                    <>
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>Results Showing</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3" />
                      <span>Ended</span>
                    </>
                  )}
                </span>
                {hasVoted && (
                  <span className="text-xs md:text-sm px-2.5 py-1 bg-green-500/20 text-green-700 rounded-full flex items-center gap-1 border border-green-500/30">
                    <Check className="w-3 h-3" />
                    <span>Voted</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-silver-pink">Poll ID</p>
                <code className="font-mono font-bold text-sm md:text-base bg-white/50 border border-silver-pink/30 px-3 py-1.5 rounded-lg text-light-taupe">
                  {pollId}
                </code>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-silver-pink hover:text-light-taupe transition-colors hover:bg-white/50 rounded-lg"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Previous Question Results */}
        {previousQuestionResults && (
          <div className="mb-6 bg-gradient-to-r from-light-taupe/10 to-silver-pink/10 border border-light-taupe/20 rounded-xl p-4 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="w-5 h-5 text-light-taupe" />
              <h3 className="font-semibold text-light-taupe">Previous Question Results</h3>
            </div>
            <p className="text-sm text-silver-pink mb-3">
              Q{previousQuestionResults.questionIndex + 1}: {previousQuestionResults.questionText}
            </p>
            <div className="space-y-2">
              {previousQuestionResults.options
                .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                .slice(0, 3)
                .map((option, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm text-light-taupe truncate max-w-[70%]">
                      {String.fromCharCode(65 + idx)}. {option.text}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-light-taupe">
                        {option.percentage}%
                      </span>
                      <span className="text-xs text-silver-pink">
                        ({option.votes || 0})
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            <div className="text-center mt-3 pt-3 border-t border-light-taupe/20">
              <p className="text-xs text-silver-pink">
                Host is preparing next question...
              </p>
            </div>
          </div>
        )}

        {/* Question Status Banner */}
        {!poll.currentQuestionActive && poll.status === "live" && (
          <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-700">Question Locked</p>
                <p className="text-sm text-yellow-700/90">
                  {previousQuestionResults 
                    ? "Viewing previous question results. Next question starting soon..."
                    : "Waiting for host to activate this question for voting"
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-5 md:p-6 border border-silver-pink/30 shadow-sm mb-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-light-taupe font-semibold bg-light-taupe/10 px-3 py-1.5 rounded-lg">
                  Question {poll.activeQuestionIndex + 1}
                </span>
                {totalVotes > 0 && (
                  <div className="flex items-center gap-2 text-sm text-silver-pink">
                    <Users className="w-4 h-4" />
                    <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              {totalVotes > 0 && (
                <button
                  onClick={() => setShowResults(!showResults)}
                  className="flex items-center gap-2 text-light-taupe hover:text-light-taupe/80 bg-white/50 hover:bg-white px-3 py-2 rounded-lg transition-colors border border-silver-pink/30"
                >
                  {showResults ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showResults ? 'Hide Results' : 'Show Results'}
                </button>
              )}
            </div>
          </div>
          
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-6 md:mb-8 text-light-taupe leading-tight">
            {activeQuestion.text}
          </h2>

          {/* Options */}
          <div className="space-y-3 md:space-y-4">
            {activeQuestion.options?.map((option, index) => {
              const percentage = calculatePercentage(option.votes || 0);
              const isSelected = selectedOption === index;
              const isTopVote = totalVotes > 0 && (option.votes || 0) === Math.max(...activeQuestion.options.map(opt => opt.votes || 0));
              
              return (
                <button
                  key={index}
                  onClick={() => voteForOption(index)}
                  disabled={!poll.currentQuestionActive || hasVoted}
                  className={`w-full relative overflow-hidden rounded-xl p-4 md:p-5 text-left transition-all duration-200 ${
                    poll.currentQuestionActive && !hasVoted 
                      ? 'hover:scale-[1.01] active:scale-[0.99] cursor-pointer' 
                      : 'cursor-not-allowed'
                  } ${
                    isSelected 
                      ? 'border-2 border-green-500 bg-green-500/5 shadow-sm' 
                      : 'border border-silver-pink/30 bg-white/50'
                  } ${isTopVote && showResults ? 'ring-1 ring-yellow-500/30' : ''}`}
                >
                  {/* Voting progress bar (only when showResults is true) */}
                  {showResults && percentage > 0 && (
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-light-taupe/10 to-silver-pink/10 transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-lg transition-all flex-shrink-0 ${
                        isSelected 
                          ? 'border-green-500 bg-green-500/10 text-green-700' 
                          : 'border-silver-pink/50 bg-white text-light-taupe'
                      }`}>
                        {String.fromCharCode(65 + index)}
                        {isSelected && (
                          <Check className="absolute -top-1 -right-1 w-5 h-5 text-green-500 bg-white rounded-full p-0.5 border border-green-500" />
                        )}
                        {isTopVote && showResults && !isSelected && (
                          <Award className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500 bg-white rounded-full p-0.5 border border-yellow-500" />
                        )}
                      </div>
                      <span className="text-base md:text-lg font-medium text-light-taupe text-left">{option.text}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 md:gap-4 self-start sm:self-center">
                      {showResults && (
                        <>
                          <span className="text-base md:text-lg font-bold bg-white/80 px-3 py-1.5 rounded-lg min-w-[55px] md:min-w-[60px] text-center text-light-taupe border border-silver-pink/30">
                            {percentage}%
                          </span>
                          <span className="text-sm text-silver-pink min-w-[70px] md:min-w-[80px] text-right">
                            {option.votes || 0} vote{(option.votes || 0) !== 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                      {!showResults && (option.votes || 0) > 0 && (
                        <span className="text-sm text-silver-pink bg-white/50 px-2 py-1 rounded border border-silver-pink/30">
                          {option.votes || 0}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Vote button for participants */}
                  {!hasVoted && poll.currentQuestionActive && (
                    <div className="relative z-10 mt-3 sm:mt-4 text-right">
                      <span className="text-xs md:text-sm text-light-taupe bg-white/80 px-2 py-1 rounded border border-silver-pink/30 inline-block">
                        Click to vote
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Voting status */}
          <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-silver-pink/30">
            {hasVoted ? (
              <div className="flex items-center justify-center gap-3 text-green-700 bg-green-500/10 p-4 rounded-xl border border-green-500/20">
                <Check className="w-5 h-5" />
                <span className="font-medium">Your vote has been recorded! {poll.currentQuestionActive ? 'Waiting for voting to end...' : 'Results will show soon...'}</span>
              </div>
            ) : poll.currentQuestionActive ? (
              <div className="text-center p-4 bg-light-taupe/5 rounded-xl border border-light-taupe/20">
                <p className="text-light-taupe">
                  <span className="font-semibold">Select an option above to vote.</span> You can only vote once per question.
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 text-yellow-700 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                <Lock className="w-5 h-5" />
                <span className="font-medium">Voting is locked. {previousQuestionResults ? 'Viewing previous results...' : 'Please wait for the host to activate this question.'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Results Display for Participants */}
        {hasVoted && poll.currentQuestionActive && totalVotes > 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-light-taupe/5 to-silver-pink/5 rounded-xl border border-silver-pink/20">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-light-taupe flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Live Results
              </h4>
              <button
                onClick={() => setShowResults(!showResults)}
                className="text-xs text-light-taupe hover:text-light-taupe/80 transition-colors"
              >
                {showResults ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            {/* Selected Vote Summary */}
            {selectedOption !== null && activeQuestion.options[selectedOption] && (
              <div className="mb-4 p-3 bg-white/50 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-light-taupe">You voted for:</span>
                </div>
                <p className="text-light-taupe ml-6">
                  {String.fromCharCode(65 + selectedOption)}. {activeQuestion.options[selectedOption].text}
                </p>
              </div>
            )}
            
            {/* Quick Results Summary */}
            {showResults && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-silver-pink">Total votes on this question:</span>
                  <span className="font-semibold text-light-taupe">{totalVotes}</span>
                </div>
                
                {/* Top 3 options summary */}
                {activeQuestion.options
                  .map((opt, idx) => ({ ...opt, index: idx }))
                  .sort((a, b) => (b.votes || 0) - (a.votes || 0))
                  .slice(0, 3)
                  .map((option, idx) => {
                    const percentage = calculatePercentage(option.votes || 0);
                    const isUserVote = selectedOption === option.index;
                    return (
                      <div key={option.index} className="space-y-1">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-light-taupe">
                              {String.fromCharCode(65 + option.index)}. {option.text}
                            </span>
                            {isUserVote && (
                              <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-700 rounded">
                                You
                              </span>
                            )}
                            {idx === 0 && totalVotes > 0 && (
                              <TrendingUp className="w-3 h-3 text-yellow-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-light-taupe">
                              {percentage}%
                            </span>
                            <span className="text-xs text-silver-pink">
                              ({option.votes || 0})
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-white/30 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              idx === 0 
                                ? 'bg-gradient-to-r from-yellow-500 to-amber-500' 
                                : idx === 1
                                ? 'bg-gradient-to-r from-light-taupe to-silver-pink'
                                : 'bg-gradient-to-r from-light-taupe/70 to-silver-pink/70'
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Instructions & Tips */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gradient-to-r from-light-taupe/10 to-silver-pink/10 border border-light-taupe/20 rounded-xl p-4 md:p-5">
            <h4 className="font-semibold text-light-taupe mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              How it works
            </h4>
            <ul className="text-silver-pink space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-light-taupe flex-shrink-0 mt-0.5" />
                <span>Select your answer by clicking an option</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-light-taupe flex-shrink-0 mt-0.5" />
                <span>You can only vote once per question</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-light-taupe flex-shrink-0 mt-0.5" />
                <span>Results show automatically after voting ends</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-light-taupe flex-shrink-0 mt-0.5" />
                <span>Wait for host to activate/advance questions</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 md:p-5">
            <h4 className="font-semibold text-light-taupe mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Live Analytics
            </h4>
            <ul className="text-silver-pink space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>See real-time vote percentages</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Top choices highlighted automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Previous question results shown between questions</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>All results saved for host analytics</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-silver-pink/30 text-center">
          <p className="text-sm text-silver-pink">
            Participating as: <span className="font-medium text-light-taupe">{userName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

