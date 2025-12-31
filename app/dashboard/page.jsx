"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { 
  Plus, 
  Calendar, 
  Users, 
  BarChart3, 
  Play, 
  Eye, 
  EyeOff, 
  CheckCircle,
  Clock,
  Loader2,
  Copy,
  Trash2,
  User,
  LogOut,
  ChevronRight,
  Lock,
  LockOpen,
  AlertCircle,
  Check
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedPollId, setCopiedPollId] = useState(null);
  const [user, setUser] = useState(null);
  const [expandedPoll, setExpandedPoll] = useState(null);
  const [showResultsPoll, setShowResultsPoll] = useState({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchUserPolls(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserPolls = async (userId) => {
    if (!userId) return;

    try {
      const pollsRef = collection(db, "polls");
      const q = query(
        pollsRef,
        where("createdBy", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      const pollsData = [];
      
      querySnapshot.forEach((doc) => {
        pollsData.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        });
      });

      // Sort manually by createdAt (newest first)
      pollsData.sort((a, b) => b.createdAt - a.createdAt);
      
      setPolls(pollsData);
    } catch (error) {
      console.error("Error fetching polls:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPollStatus = (poll) => {
    if (poll.status === "ended") {
      return { label: "Ended", color: "bg-gray-500", icon: <CheckCircle className="w-3 h-3" /> };
    }
    if (poll.status === "live") {
      if (poll.currentQuestionActive === true) {
        return { label: "Live", color: "bg-green-500", icon: <Eye className="w-3 h-3" /> };
      }
      return { label: "Ready", color: "bg-yellow-500", icon: <EyeOff className="w-3 h-3" /> };
    }
    return { label: "Draft", color: "bg-gray-400", icon: <Clock className="w-3 h-3" /> };
  };

  const getTotalVotes = (poll) => {
    if (!poll.questions) return 0;
    return poll.questions.reduce((total, question) => {
      return total + question.options.reduce((sum, option) => sum + (option.votes || 0), 0);
    }, 0);
  };

  const getTotalQuestions = (poll) => {
    return poll.questions?.length || 0;
  };

  const getCurrentQuestion = (poll) => {
    if (poll.activeQuestionIndex >= 0 && poll.questions && poll.questions[poll.activeQuestionIndex]) {
      return poll.questions[poll.activeQuestionIndex];
    }
    return null;
  };

  const getTotalVotesForCurrentQuestion = (poll) => {
    const currentQuestion = getCurrentQuestion(poll);
    if (!currentQuestion) return 0;
    return currentQuestion.options.reduce((sum, option) => sum + (option.votes || 0), 0);
  };

  const calculatePercentage = (votes, total) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const copyPollId = (pollId) => {
    navigator.clipboard.writeText(pollId);
    setCopiedPollId(pollId);
    setTimeout(() => setCopiedPollId(null), 2000);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const deletePoll = async (pollId) => {
    if (!confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return;
    }

    try {
      setPolls(polls.filter(poll => poll.id !== pollId));
      alert("Poll deleted successfully");
    } catch (error) {
      console.error("Error deleting poll:", error);
      alert("Failed to delete poll");
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // ============= HOST CONTROL FUNCTIONS =============

  const startPoll = async (pollId) => {
    try {
      await updateDoc(doc(db, "polls", pollId), {
        status: "live",
        activeQuestionIndex: 0,
        currentQuestionActive: false,
      });
      
      // Refresh the poll data
      fetchUserPolls(user.uid);
    } catch (err) {
      console.error("Error starting poll:", err);
      alert("Failed to start poll");
    }
  };

  const activateCurrentQuestion = async (pollId) => {
    try {
      await updateDoc(doc(db, "polls", pollId), {
        currentQuestionActive: true,
      });
      
      fetchUserPolls(user.uid);
    } catch (err) {
      console.error("Error activating question:", err);
      alert("Failed to activate question");
    }
  };

  const deactivateCurrentQuestion = async (pollId) => {
    try {
      await updateDoc(doc(db, "polls", pollId), {
        currentQuestionActive: false,
      });
      
      fetchUserPolls(user.uid);
    } catch (err) {
      console.error("Error deactivating question:", err);
      alert("Failed to deactivate question");
    }
  };

  const nextQuestion = async (poll) => {
    if (!poll || poll.activeQuestionIndex === undefined) return;
    
    try {
      // Deactivate current question first
      await updateDoc(doc(db, "polls", poll.id), {
        currentQuestionActive: false,
      });
      
      // Wait a moment then activate next question
      setTimeout(async () => {
        await updateDoc(doc(db, "polls", poll.id), {
          activeQuestionIndex: poll.activeQuestionIndex + 1,
          currentQuestionActive: false, // Start inactive
        });
        
        fetchUserPolls(user.uid);
      }, 300);
      
    } catch (err) {
      console.error("Error moving to next question:", err);
      alert("Failed to move to next question");
    }
  };

  const endPoll = async (pollId) => {
    if (confirm("Are you sure you want to end the poll?")) {
      try {
        await updateDoc(doc(db, "polls", pollId), {
          status: "ended",
          activeQuestionIndex: -1,
          currentQuestionActive: false,
        });
        
        fetchUserPolls(user.uid);
        alert("Poll has ended!");
      } catch (err) {
        console.error("Error ending poll:", err);
        alert("Failed to end poll");
      }
    }
  };

  const toggleShowResults = (pollId) => {
    setShowResultsPoll(prev => ({
      ...prev,
      [pollId]: !prev[pollId]
    }));
  };

  const toggleExpandPoll = (pollId) => {
    setExpandedPoll(expandedPoll === pollId ? null : pollId);
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with User Info */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  Your Polls Dashboard
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <User className="w-4 h-4" />
                    <span>Logged in as: <span className="text-indigo-300">{user?.email}</span></span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {polls.length} poll{polls.length !== 1 ? 's' : ''} found
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-sm border border-gray-600 hover:border-gray-500 px-3 py-1 rounded-lg transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </div>
              </div>
              <button
                onClick={() => router.push("/dashboard/create")}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Create New Poll
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Polls</p>
                    <p className="text-3xl font-bold">{polls.length}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Live Polls</p>
                    <p className="text-3xl font-bold">
                      {polls.filter(p => p.status === "live").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-green-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Votes</p>
                    <p className="text-3xl font-bold">
                      {polls.reduce((sum, poll) => sum + getTotalVotes(poll), 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Drafts</p>
                    <p className="text-3xl font-bold">
                      {polls.filter(p => p.status === "draft").length}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Polls List */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold">Your Polls</h2>
              <p className="text-gray-400 text-sm mt-1">
                Showing {polls.length} poll{polls.length !== 1 ? 's' : ''} created by you
              </p>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading your polls...</p>
              </div>
            ) : polls.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-24 h-24 rounded-full bg-gray-800/50 flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-12 h-12 text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No polls yet</h3>
                <p className="text-gray-400 mb-6">
                  You haven't created any polls yet. Create your first one!
                </p>
                <button
                  onClick={() => router.push("/dashboard/create")}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-6 py-3 rounded-xl font-semibold mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Poll
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                {polls.map((poll) => {
                  const status = getPollStatus(poll);
                  const currentQuestion = getCurrentQuestion(poll);
                  const totalVotesCurrent = getTotalVotesForCurrentQuestion(poll);
                  const isExpanded = expandedPoll === poll.id;
                  const showResults = showResultsPoll[poll.id] || false;
                  const isLive = poll.status === "live";
                  const isDraft = poll.status === "draft";
                  const isEnded = poll.status === "ended";

                  return (
                    <div key={poll.id} className="bg-gray-800/30 rounded-xl border border-gray-700 overflow-hidden">
                      {/* Poll Header */}
                      <div className="p-4 border-b border-gray-700">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-lg">{poll.title}</h3>
                              <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${status.color} bg-opacity-20`}>
                                {status.icon}
                                {status.label}
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-purple-400" />
                                <span className="text-sm text-gray-400">{getTotalVotes(poll)} votes</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm text-gray-400">{getTotalQuestions(poll)} questions</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-500">{formatDate(poll.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                                ID: {poll.id}
                              </code>
                              <button
                                onClick={() => copyPollId(poll.id)}
                                className="text-gray-500 hover:text-gray-300 transition-colors"
                                title="Copy Poll ID"
                              >
                                {copiedPollId === poll.id ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleExpandPoll(poll.id)}
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                              title={isExpanded ? "Collapse" : "Expand"}
                            >
                              <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="p-4 bg-gray-900/50">
                          {/* Current Question Info (for live polls) */}
                          {isLive && currentQuestion && (
                            <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <h4 className="font-semibold text-lg">Current Question</h4>
                                  <p className="text-gray-400 text-sm">
                                    Question {poll.activeQuestionIndex + 1} of {poll.questions?.length}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`px-3 py-1 rounded-full text-sm ${poll.currentQuestionActive ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                    {poll.currentQuestionActive ? 'Voting Active' : 'Ready'}
                                  </span>
                                  <span className="text-sm text-gray-400">
                                    {totalVotesCurrent} votes
                                  </span>
                                </div>
                              </div>
                              
                              <p className="text-xl mb-4">{currentQuestion.text}</p>
                              
                              {/* Results (when shown) */}
                              {showResults && totalVotesCurrent > 0 && (
                                <div className="space-y-3 mt-4">
                                  {currentQuestion.options.map((option, index) => {
                                    const percentage = calculatePercentage(option.votes || 0, totalVotesCurrent);
                                    return (
                                      <div key={index} className="space-y-1">
                                        <div className="flex justify-between">
                                          <span className="text-sm">
                                            {String.fromCharCode(65 + index)}. {option.text}
                                          </span>
                                          <span className="text-sm font-semibold">
                                            {percentage}% ({option.votes || 0} votes)
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                          <div 
                                            className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
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

                          {/* Host Controls */}
                          <div className="space-y-4">
                            {/* Start Poll Button (for drafts) */}
                            {isDraft && (
                              <div className="flex gap-4">
                                <button
                                  onClick={() => startPoll(poll.id)}
                                  className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-4 py-2 rounded-lg font-semibold transition-all"
                                >
                                  <Play className="w-4 h-4" />
                                  Start Poll Session
                                </button>
                                <button
                                  onClick={() => router.push(`/share?pollId=${poll.id}`)}
                                  className="flex items-center gap-2 border border-gray-600 hover:border-gray-500 px-4 py-2 rounded-lg transition-colors"
                                >
                                  <Users className="w-4 h-4" />
                                  Share
                                </button>
                              </div>
                            )}

                            {/* Live Poll Controls */}
                            {isLive && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Question Activation */}
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm text-gray-400">Question Control</h5>
                                    {!poll.currentQuestionActive ? (
                                      <button
                                        onClick={() => activateCurrentQuestion(poll.id)}
                                        className="w-full flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-4 py-3 rounded-lg font-semibold transition-all"
                                      >
                                        <LockOpen className="w-4 h-4" />
                                        Activate Question for Voting
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => deactivateCurrentQuestion(poll.id)}
                                        className="w-full flex items-center gap-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 px-4 py-3 rounded-lg font-semibold transition-all"
                                      >
                                        <Lock className="w-4 h-4" />
                                        Deactivate Question
                                      </button>
                                    )}
                                    <p className="text-xs text-gray-500">
                                      {poll.currentQuestionActive 
                                        ? "Participants can vote now"
                                        : "Question is locked - participants waiting"
                                      }
                                    </p>
                                  </div>

                                  {/* Results Toggle */}
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm text-gray-400">Results</h5>
                                    <button
                                      onClick={() => toggleShowResults(poll.id)}
                                      className="w-full flex items-center gap-2 border border-gray-600 hover:border-gray-500 px-4 py-3 rounded-lg transition-colors"
                                    >
                                      <BarChart3 className="w-4 h-4" />
                                      {showResults ? 'Hide Results' : 'Show Results'}
                                    </button>
                                  </div>
                                </div>

                                {/* Navigation Controls */}
                                <div className="space-y-2">
                                  <h5 className="font-medium text-sm text-gray-400">Navigation</h5>
                                  <div className="flex gap-4">
                                    {poll.activeQuestionIndex < (poll.questions?.length || 0) - 1 ? (
                                      <button
                                        onClick={() => nextQuestion(poll)}
                                        className="flex-1 flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 px-4 py-3 rounded-lg font-semibold transition-all"
                                      >
                                        Next Question
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => endPoll(poll.id)}
                                        className="flex-1 flex items-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 px-4 py-3 rounded-lg font-semibold transition-all"
                                      >
                                        End Poll
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex gap-4 pt-4 border-t border-gray-700">
                                  <button
                                    onClick={() => router.push(`/poll/${poll.id}`)}
                                    className="flex items-center gap-2 border border-gray-600 hover:border-gray-500 px-4 py-2 rounded-lg transition-colors"
                                    title="View as Participant"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Participant Screen
                                  </button>
                                  <button
                                    onClick={() => router.push(`/share?pollId=${poll.id}`)}
                                    className="flex items-center gap-2 border border-gray-600 hover:border-gray-500 px-4 py-2 rounded-lg transition-colors"
                                  >
                                    <Users className="w-4 h-4" />
                                    Share Poll
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Ended Poll Actions */}
                            {isEnded && (
                              <div className="space-y-4">
                                <div className="p-4 bg-gray-800/30 rounded-xl">
                                  <h4 className="font-semibold mb-2">Poll Ended</h4>
                                  <p className="text-sm text-gray-400 mb-4">
                                    This poll has ended. Participants can no longer vote.
                                  </p>
                                  <div className="flex gap-4">
                                    <button
                                      onClick={() => {
                                        setShowResultsPoll(prev => ({ ...prev, [poll.id]: true }));
                                      }}
                                      className="flex items-center gap-2 border border-gray-600 hover:border-gray-500 px-4 py-2 rounded-lg transition-colors"
                                    >
                                      <BarChart3 className="w-4 h-4" />
                                      View Final Results
                                    </button>
                                    <button
                                      onClick={() => router.push(`/share?pollId=${poll.id}`)}
                                      className="flex items-center gap-2 border border-gray-600 hover:border-gray-500 px-4 py-2 rounded-lg transition-colors"
                                    >
                                      <Users className="w-4 h-4" />
                                      Share Results
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Footer Actions (when collapsed) */}
                      {!isExpanded && (
                        <div className="p-4 border-t border-gray-700">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => router.push(`/poll/${poll.id}`)}
                                className="flex items-center gap-2 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors text-sm"
                                title="View Poll"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button
                                onClick={() => router.push(`/share?pollId=${poll.id}`)}
                                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-sm"
                                title="Share Poll"
                              >
                                <Users className="w-4 h-4" />
                                Share
                              </button>
                              {isLive && (
                                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                                  {poll.currentQuestionActive ? 'Live' : 'Paused'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleExpandPoll(poll.id)}
                                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                Manage
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            {polls.length > 0 && (
              <div className="p-6 border-t border-gray-700">
                <h3 className="font-semibold mb-4">Quick Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={() => router.push("/dashboard/create")}
                    className="flex items-center gap-2 border border-gray-600 hover:border-gray-500 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Poll
                  </button>
                  <button
                    onClick={() => user && fetchUserPolls(user.uid)}
                    className="flex items-center gap-2 border border-gray-600 hover:border-gray-500 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Loader2 className="w-4 h-4" />
                    Refresh
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Info & Tips */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-400" />
                Host Instructions
              </h3>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li>• <span className="text-indigo-300">Start Poll</span>: Makes poll live and shows first question</li>
                <li>• <span className="text-green-300">Activate Question</span>: Allows participants to vote</li>
                <li>• <span className="text-yellow-300">Deactivate</span>: Stops voting for current question</li>
                <li>• <span className="text-purple-300">Next Question</span>: Shows next question (deactivates current)</li>
                <li>• <span className="text-red-300">End Poll</span>: Closes the poll session</li>
                <li>• Participants join at: <code className="bg-gray-800 px-1">/poll/[ID]</code></li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-green-400" />
                Live Poll Management Tips
              </h3>
              <ul className="text-gray-400 space-y-2 text-sm">
                <li>• Keep questions active only when you want voting</li>
                <li>• Use "Show Results" to display voting percentages</li>
                <li>• Share the poll ID with participants</li>
                <li>• Monitor vote counts in real-time</li>
                <li>• Use "View Participant Screen" to see what participants see</li>
                <li>• End poll when all questions are completed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}