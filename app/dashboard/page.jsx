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
  Check,
  ExternalLink,
  RefreshCw,
  Settings,
  Share2,
  FileText,
  Edit,
  MoreVertical,
  X
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
      return { label: "Ended", color: "bg-gray-500", textColor: "text-gray-100", icon: <CheckCircle className="w-3 h-3" /> };
    }
    if (poll.status === "live") {
      if (poll.currentQuestionActive === true) {
        return { label: "Live", color: "bg-green-500", textColor: "text-green-100", icon: <Eye className="w-3 h-3" /> };
      }
      return { label: "Ready", color: "bg-yellow-500", textColor: "text-yellow-100", icon: <EyeOff className="w-3 h-3" /> };
    }
    return { label: "Draft", color: "bg-gray-400", textColor: "text-gray-100", icon: <Clock className="w-3 h-3" /> };
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
      <div className="min-h-screen bg-eggshell text-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-light-taupe animate-spin mx-auto mb-4" />
          <p className="text-silver-pink">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-eggshell text-foreground p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with User Info */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="w-full md:w-auto">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-light-taupe to-silver-pink bg-clip-text text-transparent">
                  Polls Dashboard
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                  <div className="flex items-center gap-2 text-light-taupe">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <div className="text-sm text-silver-pink">
                    {polls.length} poll{polls.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-sm border border-light-taupe/30 hover:border-light-taupe px-3 py-2 rounded-lg transition-colors text-light-taupe hover:bg-light-taupe/5"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
                <button
                  onClick={() => router.push("/dashboard/create")}
                  className="flex items-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] px-4 py-3 md:px-6 md:py-3 rounded-xl font-semibold text-eggshell transition-all hover:scale-105 active:scale-95 whitespace-nowrap flex-1 md:flex-none justify-center"
                >
                  <Plus className="w-5 h-5" />
                  <span>New Poll</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-silver-pink/30 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-silver-pink text-xs md:text-sm">Total Polls</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-light-taupe">{polls.length}</p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-light-taupe/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-light-taupe" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-silver-pink/30 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-silver-pink text-xs md:text-sm">Live Polls</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-light-taupe">
                      {polls.filter(p => p.status === "live").length}
                    </p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Eye className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-silver-pink/30 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-silver-pink text-xs md:text-sm">Total Votes</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-light-taupe">
                      {polls.reduce((sum, poll) => sum + getTotalVotes(poll), 0)}
                    </p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-silver-pink/20 flex items-center justify-center">
                    <Users className="w-5 h-5 md:w-6 md:h-6 text-silver-pink" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 border border-silver-pink/30 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-silver-pink text-xs md:text-sm">Drafts</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-light-taupe">
                      {polls.filter(p => p.status === "draft").length}
                    </p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Polls List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl border border-silver-pink/30 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-silver-pink/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg md:text-xl font-semibold text-light-taupe">Your Polls</h2>
                  <p className="text-silver-pink text-sm mt-1">
                    {polls.length} poll{polls.length !== 1 ? 's' : ''} created by you
                  </p>
                </div>
                <button
                  onClick={() => user && fetchUserPolls(user.uid)}
                  className="flex items-center gap-2 text-sm border border-silver-pink/30 hover:border-silver-pink px-3 py-2 rounded-lg transition-colors text-light-taupe hover:bg-white/50 self-start sm:self-center"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-8 md:p-12 text-center">
                <Loader2 className="w-10 h-10 md:w-12 md:h-12 text-light-taupe animate-spin mx-auto mb-4" />
                <p className="text-silver-pink">Loading your polls...</p>
              </div>
            ) : polls.length === 0 ? (
              <div className="p-8 md:p-12 text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-light-taupe/10 flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-8 h-8 md:w-10 md:h-10 text-light-taupe/60" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold text-light-taupe mb-2">No polls yet</h3>
                <p className="text-silver-pink mb-6 max-w-md mx-auto">
                  Create your first poll to start engaging with your audience
                </p>
                <button
                  onClick={() => router.push("/dashboard/create")}
                  className="flex items-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] px-6 py-3 rounded-xl font-semibold text-eggshell mx-auto transition-all hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Poll
                </button>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4 p-3 md:p-4">
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
                    <div key={poll.id} className="bg-white/60 backdrop-blur-sm rounded-xl border border-silver-pink/20 overflow-hidden hover:border-silver-pink/40 transition-colors">
                      {/* Poll Header */}
                      <div className="p-4 border-b border-silver-pink/20">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="font-semibold text-light-taupe truncate">{poll.title}</h3>
                              <div className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${status.color} ${status.textColor} bg-opacity-20 whitespace-nowrap`}>
                                {status.icon}
                                {status.label}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 md:gap-4">
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-silver-pink" />
                                <span className="text-xs md:text-sm text-silver-pink">{getTotalVotes(poll)} votes</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4 text-light-taupe" />
                                <span className="text-xs md:text-sm text-silver-pink">{getTotalQuestions(poll)} questions</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-silver-pink" />
                                <span className="text-xs md:text-sm text-silver-pink">{formatDate(poll.createdAt)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                              <code className="text-xs bg-white/50 border border-silver-pink/20 px-2 py-1 rounded text-light-taupe truncate flex-1 max-w-[200px] md:max-w-[300px]">
                                ID: {poll.id}
                              </code>
                              <button
                                onClick={() => copyPollId(poll.id)}
                                className="text-silver-pink hover:text-light-taupe transition-colors flex-shrink-0"
                                title="Copy Poll ID"
                              >
                                {copiedPollId === poll.id ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleExpandPoll(poll.id)}
                              className="p-1.5 text-silver-pink hover:text-light-taupe transition-colors rounded-lg hover:bg-white/50"
                              title={isExpanded ? "Collapse" : "Expand"}
                            >
                              <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="p-4 bg-white/30">
                          {/* Current Question Info (for live polls) */}
                          {isLive && currentQuestion && (
                            <div className="mb-6 p-4 bg-white/50 rounded-xl border border-silver-pink/20">
                              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
                                <div>
                                  <h4 className="font-semibold text-light-taupe">Current Question</h4>
                                  <p className="text-silver-pink text-sm">
                                    Question {poll.activeQuestionIndex + 1} of {poll.questions?.length}
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-3 py-1 rounded-full text-xs ${poll.currentQuestionActive ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}`}>
                                    {poll.currentQuestionActive ? 'Voting Active' : 'Ready'}
                                  </span>
                                  <span className="text-sm text-silver-pink">
                                    {totalVotesCurrent} votes
                                  </span>
                                </div>
                              </div>
                              
                              <p className="text-lg md:text-xl text-light-taupe mb-4">{currentQuestion.text}</p>
                              
                              {/* Results (when shown) */}
                              {showResults && totalVotesCurrent > 0 && (
                                <div className="space-y-3 mt-4">
                                  {currentQuestion.options.map((option, index) => {
                                    const percentage = calculatePercentage(option.votes || 0, totalVotesCurrent);
                                    return (
                                      <div key={index} className="space-y-1.5">
                                        <div className="flex justify-between">
                                          <span className="text-sm text-light-taupe">
                                            {String.fromCharCode(65 + index)}. {option.text}
                                          </span>
                                          <span className="text-sm font-semibold text-light-taupe">
                                            {percentage}% ({option.votes || 0} votes)
                                          </span>
                                        </div>
                                        <div className="w-full bg-white/50 rounded-full h-2">
                                          <div 
                                            className="bg-gradient-to-r from-light-taupe to-silver-pink h-2 rounded-full transition-all duration-500"
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
                              <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                  onClick={() => startPoll(poll.id)}
                                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-4 py-3 rounded-lg font-semibold text-white transition-all"
                                >
                                  <Play className="w-4 h-4" />
                                  Start Poll Session
                                </button>
                                <button
                                  onClick={() => router.push(`/share?pollId=${poll.id}`)}
                                  className="flex-1 flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-4 py-3 rounded-lg text-light-taupe transition-colors hover:bg-white/50"
                                >
                                  <Share2 className="w-4 h-4" />
                                  Share Poll
                                </button>
                              </div>
                            )}

                            {/* Live Poll Controls */}
                            {isLive && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Question Activation */}
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm text-silver-pink">Question Control</h5>
                                    {!poll.currentQuestionActive ? (
                                      <button
                                        onClick={() => activateCurrentQuestion(poll.id)}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-4 py-3 rounded-lg font-semibold text-white transition-all"
                                      >
                                        <LockOpen className="w-4 h-4" />
                                        Activate Voting
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => deactivateCurrentQuestion(poll.id)}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 px-4 py-3 rounded-lg font-semibold text-white transition-all"
                                      >
                                        <Lock className="w-4 h-4" />
                                        Deactivate Voting
                                      </button>
                                    )}
                                    <p className="text-xs text-silver-pink">
                                      {poll.currentQuestionActive 
                                        ? "Participants can vote now"
                                        : "Question is locked - waiting"
                                      }
                                    </p>
                                  </div>

                                  {/* Results Toggle */}
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm text-silver-pink">Results</h5>
                                    <button
                                      onClick={() => toggleShowResults(poll.id)}
                                      className="w-full flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-4 py-3 rounded-lg text-light-taupe transition-colors hover:bg-white/50"
                                    >
                                      <BarChart3 className="w-4 h-4" />
                                      {showResults ? 'Hide Results' : 'Show Results'}
                                    </button>
                                  </div>
                                </div>

                                {/* Navigation Controls */}
                                <div className="space-y-2">
                                  <h5 className="font-medium text-sm text-silver-pink">Navigation</h5>
                                  <div className="flex gap-3">
                                    {poll.activeQuestionIndex < (poll.questions?.length || 0) - 1 ? (
                                      <button
                                        onClick={() => nextQuestion(poll)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] px-4 py-3 rounded-lg font-semibold text-eggshell transition-all"
                                      >
                                        Next Question
                                        <ChevronRight className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => endPoll(poll.id)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 px-4 py-3 rounded-lg font-semibold text-white transition-all"
                                      >
                                        End Poll
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-silver-pink/20">
                                  <button
                                    onClick={() => router.push(`/poll/${poll.id}`)}
                                    className="flex-1 flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-4 py-3 rounded-lg text-light-taupe transition-colors hover:bg-white/50"
                                    title="View as Participant"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Participant Screen
                                  </button>
                                  <button
                                    onClick={() => router.push(`/share?pollId=${poll.id}`)}
                                    className="flex-1 flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-4 py-3 rounded-lg text-light-taupe transition-colors hover:bg-white/50"
                                  >
                                    <Share2 className="w-4 h-4" />
                                    Share Poll
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Ended Poll Actions */}
                            {isEnded && (
                              <div className="space-y-4">
                                <div className="p-4 bg-white/50 rounded-xl border border-silver-pink/20">
                                  <h4 className="font-semibold text-light-taupe mb-2">Poll Ended</h4>
                                  <p className="text-sm text-silver-pink mb-4">
                                    This poll has ended. Participants can no longer vote.
                                  </p>
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                      onClick={() => {
                                        setShowResultsPoll(prev => ({ ...prev, [poll.id]: true }));
                                      }}
                                      className="flex-1 flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-4 py-3 rounded-lg text-light-taupe transition-colors hover:bg-white/50"
                                    >
                                      <BarChart3 className="w-4 h-4" />
                                      View Final Results
                                    </button>
                                    <button
                                      onClick={() => router.push(`/share?pollId=${poll.id}`)}
                                      className="flex-1 flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-4 py-3 rounded-lg text-light-taupe transition-colors hover:bg-white/50"
                                    >
                                      <Share2 className="w-4 h-4" />
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
                        <div className="p-3 border-t border-silver-pink/20">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => router.push(`/poll/${poll.id}`)}
                                className="flex items-center gap-2 px-3 py-2 bg-light-taupe/10 hover:bg-light-taupe/20 text-light-taupe hover:text-light-taupe rounded-lg transition-colors text-sm"
                                title="View Poll"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">View</span>
                              </button>
                              <button
                                onClick={() => router.push(`/share?pollId=${poll.id}`)}
                                className="flex items-center gap-2 px-3 py-2 bg-white/50 hover:bg-white/70 border border-silver-pink/30 hover:border-silver-pink rounded-lg transition-colors text-sm text-silver-pink"
                                title="Share Poll"
                              >
                                <Share2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Share</span>
                              </button>
                              {isLive && (
                                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-700">
                                  {poll.currentQuestionActive ? 'Live' : 'Paused'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleExpandPoll(poll.id)}
                                className="text-sm text-light-taupe hover:text-light-taupe/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/50"
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
          </div>

          {/* Help Sections */}
          <div className="mt-6 md:mt-8 grid lg:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-gradient-to-r from-light-taupe/10 to-silver-pink/10 border border-light-taupe/20 rounded-xl md:rounded-2xl p-4 md:p-6">
              <h3 className="font-semibold text-light-taupe mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Host Instructions
              </h3>
              <ul className="text-silver-pink space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-light-taupe font-medium">• Start Poll:</span>
                  <span>Makes poll live and shows first question</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-medium">• Activate Question:</span>
                  <span>Allows participants to vote</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-600 font-medium">• Deactivate:</span>
                  <span>Stops voting for current question</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-light-taupe font-medium">• Next Question:</span>
                  <span>Shows next question (deactivates current)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-medium">• End Poll:</span>
                  <span>Closes the poll session</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-light-taupe font-medium">• Join URL:</span>
                  <code className="bg-white/50 px-1.5 py-0.5 rounded text-xs">/poll/[ID]</code>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl md:rounded-2xl p-4 md:p-6">
              <h3 className="font-semibold text-light-taupe mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Tips & Best Practices
              </h3>
              <ul className="text-silver-pink space-y-2 text-sm">
                <li>• Keep questions active only when you want voting</li>
                <li>• Use "Show Results" to display voting percentages</li>
                <li>• Share the poll ID with participants</li>
                <li>• Monitor vote counts in real-time</li>
                <li>• Use "View Participant Screen" to see participant view</li>
                <li>• End poll when all questions are completed</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 md:mt-8 pt-4 border-t border-silver-pink/20 text-center">
            <p className="text-sm text-silver-pink">
              Need help? Visit our help center or contact support
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}