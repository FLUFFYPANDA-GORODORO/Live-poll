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
  User,
  LogOut,
  ChevronRight,
  Lock,
  LockOpen,
  AlertCircle,
  Check,
  RefreshCw,
  Share2,
  FileText,
  TrendingUp,
  Target,
  Award,
  ChevronDown,
  Download,
  PieChart,
  Maximize2,
  ArrowRight,
  ExternalLink,
  X,
  BarChart
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedPollId, setCopiedPollId] = useState(null);
  const [user, setUser] = useState(null);
  const [expandedPoll, setExpandedPoll] = useState(null);
  const [showResultsPoll, setShowResultsPoll] = useState({});
  const [detailedResultsPoll, setDetailedResultsPoll] = useState({});
  const [processingQuestion, setProcessingQuestion] = useState(null);

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
      return { label: "Ended", color: "bg-gray-500", textColor: "text-gray-700", icon: <CheckCircle className="w-3 h-3" /> };
    }
    if (poll.status === "live") {
      if (poll.currentQuestionActive === true) {
        return { label: "Live", color: "bg-green-500", textColor: "text-green-700", icon: <Eye className="w-3 h-3" /> };
      }
      return { label: "Ready", color: "bg-yellow-500", textColor: "text-yellow-700", icon: <EyeOff className="w-3 h-3" /> };
    }
    return { label: "Draft", color: "bg-gray-400", textColor: "text-gray-700", icon: <Clock className="w-3 h-3" /> };
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

  const getQuestionStats = (poll, questionIndex) => {
    if (!poll || !poll.questions || !poll.questions[questionIndex]) return null;
    
    const question = poll.questions[questionIndex];
    const totalVotes = question.options.reduce((sum, option) => sum + (option.votes || 0), 0);
    
    const optionsWithPercentages = question.options.map(option => ({
      ...option,
      percentage: totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0
    }));
    
    const maxVotes = Math.max(...question.options.map(opt => opt.votes || 0));
    const winningOptions = question.options.filter(opt => (opt.votes || 0) === maxVotes);
    
    return {
      totalVotes,
      optionsWithPercentages,
      maxVotes,
      winningOptions,
      hasData: totalVotes > 0
    };
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

  const nextQuestionWithResults = async (poll) => {
    if (!poll || poll.activeQuestionIndex === undefined) return;
    
    try {
      setProcessingQuestion(poll.id);
      
      // Deactivate current question and show results
      await updateDoc(doc(db, "polls", poll.id), {
        currentQuestionActive: false,
      });
      
      // Show results for current question
      setShowResultsPoll(prev => ({ ...prev, [poll.id]: true }));
      
      // Wait 3 seconds to show results before moving on
      setTimeout(async () => {
        if (poll.activeQuestionIndex < (poll.questions?.length || 0) - 1) {
          await updateDoc(doc(db, "polls", poll.id), {
            activeQuestionIndex: poll.activeQuestionIndex + 1,
            currentQuestionActive: false,
          });
          
          // Hide results for new question
          setShowResultsPoll(prev => ({ ...prev, [poll.id]: false }));
        } else {
          // If it's the last question, end the poll
          await updateDoc(doc(db, "polls", poll.id), {
            status: "ended",
            activeQuestionIndex: -1,
            currentQuestionActive: false,
          });
        }
        
        fetchUserPolls(user.uid);
        setProcessingQuestion(null);
        
        // Show notification
        if (poll.activeQuestionIndex < (poll.questions?.length || 0) - 1) {
          alert(`Moved to question ${poll.activeQuestionIndex + 2}. Results for question ${poll.activeQuestionIndex + 1} are available below.`);
        } else {
          alert("Poll ended! All results are available.");
        }
      }, 3000);
      
    } catch (err) {
      console.error("Error moving to next question:", err);
      alert("Failed to move to next question");
      setProcessingQuestion(null);
    }
  };

  const endPollWithResults = async (pollId, poll) => {
    if (confirm("End poll and show comprehensive results?")) {
      try {
        // Show all results
        const allQuestionKeys = {};
        poll.questions?.forEach((_, index) => {
          allQuestionKeys[`${pollId}_${index}`] = true;
        });
        setDetailedResultsPoll(prev => ({ ...prev, ...allQuestionKeys }));
        setShowResultsPoll(prev => ({ ...prev, [pollId]: true }));
        
        await updateDoc(doc(db, "polls", pollId), {
          status: "ended",
          activeQuestionIndex: -1,
          currentQuestionActive: false,
        });
        
        fetchUserPolls(user.uid);
        
        alert(`Poll ended! Total votes: ${getTotalVotes(poll)}. View detailed results below.`);
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

  const toggleDetailedResults = (pollId, questionIndex) => {
    const key = `${pollId}_${questionIndex}`;
    setDetailedResultsPoll(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleExpandPoll = (pollId) => {
    setExpandedPoll(expandedPoll === pollId ? null : pollId);
  };

  const viewDetailedResults = (pollId) => {
    router.push(`/dashboard/results/${pollId}`);
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
                  className="flex items-center gap-2 text-sm border border-light-taupe/30 hover:border-light-taupe px-3 py-2 rounded-lg transition-colors text-light-taupe hover:bg-white/50"
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
                                <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-light-taupe" />
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
                              
                              {/* Live Results (when shown) */}
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* Question Activation */}
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm text-silver-pink">Voting Control</h5>
                                    {!poll.currentQuestionActive ? (
                                      <button
                                        onClick={() => activateCurrentQuestion(poll.id)}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-4 py-3 rounded-lg font-semibold text-white transition-all"
                                      >
                                        <LockOpen className="w-4 h-4" />
                                        Start Voting
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => deactivateCurrentQuestion(poll.id)}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 px-4 py-3 rounded-lg font-semibold text-white transition-all"
                                      >
                                        <Lock className="w-4 h-4" />
                                        Stop Voting
                                      </button>
                                    )}
                                    <p className="text-xs text-silver-pink">
                                      {poll.currentQuestionActive 
                                        ? "Participants are voting now"
                                        : "Ready to start voting"
                                      }
                                    </p>
                                  </div>

                                  {/* Results Display */}
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm text-silver-pink">Results</h5>
                                    <button
                                      onClick={() => toggleShowResults(poll.id)}
                                      className="w-full flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-4 py-3 rounded-lg text-light-taupe transition-colors hover:bg-white/50"
                                    >
                                      {showResults ? (
                                        <>
                                          <EyeOff className="w-4 h-4" />
                                          Hide Results
                                        </>
                                      ) : (
                                        <>
                                          <BarChart3 className="w-4 h-4" />
                                          Show Results
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {/* Navigation Control */}
                                  <div className="space-y-2">
                                    <h5 className="font-medium text-sm text-silver-pink">Progress</h5>
                                    {poll.activeQuestionIndex < (poll.questions?.length || 0) - 1 ? (
                                      <button
                                        onClick={() => nextQuestionWithResults(poll)}
                                        disabled={processingQuestion === poll.id}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg font-semibold text-eggshell transition-all"
                                      >
                                        {processingQuestion === poll.id ? (
                                          <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                          </>
                                        ) : (
                                          <>
                                            Next Question
                                            <ChevronRight className="w-4 h-4" />
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => endPollWithResults(poll.id, poll)}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 px-4 py-3 rounded-lg font-semibold text-white transition-all"
                                      >
                                        End Poll
                                      </button>
                                    )}
                                    <p className="text-xs text-silver-pink">
                                      Question {poll.activeQuestionIndex + 1} of {poll.questions?.length}
                                    </p>
                                  </div>
                                </div>

                                {/* Quick Stats Bar */}
                                <div className="grid grid-cols-3 gap-3 bg-white/30 rounded-xl p-3">
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-light-taupe">{getTotalVotes(poll)}</div>
                                    <div className="text-xs text-silver-pink">Total Votes</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-light-taupe">{totalVotesCurrent}</div>
                                    <div className="text-xs text-silver-pink">Current Q</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-light-taupe">
                                      {poll.questions?.length || 0}
                                    </div>
                                    <div className="text-xs text-silver-pink">Questions</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Ended Poll Actions */}
                            {isEnded && (
                              <div className="space-y-4">
                                <div className="p-4 bg-white/50 rounded-xl border border-silver-pink/20">
                                  <h4 className="font-semibold text-light-taupe mb-2">Poll Ended</h4>
                                  <p className="text-sm text-silver-pink mb-4">
                                    This poll has ended with {getTotalVotes(poll)} total votes.
                                  </p>
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                      onClick={() => viewDetailedResults(poll.id)}
                                      className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] px-4 py-3 rounded-lg font-semibold text-eggshell transition-all"
                                    >
                                      <BarChart className="w-4 h-4" />
                                      View Detailed Analytics
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

                          {/* Question-by-Question Results Section */}
                          {(isEnded || showResults) && poll.questions && (
                            <div className="mt-8 pt-6 border-t border-silver-pink/20">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-light-taupe flex items-center gap-2">
                                  <BarChart3 className="w-5 h-5" />
                                  {isEnded ? "Final Results" : "Question Results"}
                                </h4>
                                <div className="text-sm text-silver-pink">
                                  {getTotalVotes(poll)} total votes
                                </div>
                              </div>
                              
                              <div className="space-y-6">
                                {poll.questions.map((question, qIndex) => {
                                  const stats = getQuestionStats(poll, qIndex);
                                  const isDetailed = detailedResultsPoll[`${poll.id}_${qIndex}`];
                                  const isCurrentQuestion = isLive && qIndex === poll.activeQuestionIndex;
                                  
                                  return (
                                    <div key={qIndex} className="bg-white/50 rounded-xl border border-silver-pink/20 p-4">
                                      <div className="flex justify-between items-start mb-3">
                                        <div>
                                          <h5 className="font-medium text-light-taupe">
                                            Q{qIndex + 1}: {question.text}
                                          </h5>
                                          <div className="flex items-center gap-3 mt-1">
                                            <span className="text-xs text-silver-pink">
                                              {stats?.totalVotes || 0} votes
                                            </span>
                                            {isCurrentQuestion && (
                                              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-700 rounded-full">
                                                Current
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => toggleDetailedResults(poll.id, qIndex)}
                                          className="text-silver-pink hover:text-light-taupe transition-colors"
                                        >
                                          {isDetailed ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                      </div>
                                      
                                      {/* Summary Bar */}
                                      {stats && stats.hasData && (
                                        <div className="space-y-2 mb-3">
                                          {stats.optionsWithPercentages.slice(0, 1).map((option, oIndex) => (
                                            <div key={oIndex} className="space-y-1">
                                              <div className="flex justify-between text-sm">
                                                <span className="text-light-taupe">Top Choice: {option.text}</span>
                                                <span className="font-semibold text-light-taupe">{option.percentage}%</span>
                                              </div>
                                              <div className="w-full bg-white/30 rounded-full h-2">
                                                <div 
                                                  className="bg-gradient-to-r from-light-taupe to-silver-pink h-2 rounded-full transition-all duration-500"
                                                  style={{ width: `${option.percentage}%` }}
                                                />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* Detailed Results (when expanded) */}
                                      {isDetailed && stats && stats.hasData && (
                                        <div className="mt-4 pt-4 border-t border-silver-pink/10">
                                          <div className="space-y-3">
                                            {stats.optionsWithPercentages.map((option, oIndex) => {
                                              const isWinner = (option.votes || 0) === stats.maxVotes;
                                              return (
                                                <div key={oIndex} className="space-y-1.5">
                                                  <div className="flex justify-between">
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-sm font-medium text-light-taupe">
                                                        {String.fromCharCode(65 + oIndex)}. {option.text}
                                                      </span>
                                                      {isWinner && (
                                                        <Award className="w-3 h-3 text-yellow-500" />
                                                      )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      <span className="text-sm font-semibold text-light-taupe">
                                                        {option.percentage}%
                                                      </span>
                                                      <span className="text-xs text-silver-pink">
                                                        ({option.votes || 0})
                                                      </span>
                                                    </div>
                                                  </div>
                                                  <div className="w-full bg-white/30 rounded-full h-2">
                                                    <div 
                                                      className={`h-2 rounded-full transition-all duration-500 ${
                                                        isWinner 
                                                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500' 
                                                          : 'bg-gradient-to-r from-light-taupe/70 to-silver-pink/70'
                                                      }`}
                                                      style={{ width: `${option.percentage}%` }}
                                                    />
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                          
                                          {/* Summary Stats */}
                                          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-silver-pink/10">
                                            <div className="text-center">
                                              <div className="text-lg font-bold text-light-taupe">{stats.totalVotes}</div>
                                              <div className="text-xs text-silver-pink">Total Votes</div>
                                            </div>
                                            <div className="text-center">
                                              <div className="text-lg font-bold text-light-taupe">
                                                {stats.winningOptions.length > 1 ? 'Tie' : 'Clear'}
                                              </div>
                                              <div className="text-xs text-silver-pink">Result</div>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {(!stats || !stats.hasData) && (
                                        <div className="text-center py-4">
                                          <p className="text-silver-pink text-sm">No votes recorded yet</p>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
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
                              {isEnded && (
                                <button
                                  onClick={() => viewDetailedResults(poll.id)}
                                  className="flex items-center gap-2 px-3 py-2 bg-white/50 hover:bg-white/70 border border-silver-pink/30 hover:border-silver-pink rounded-lg transition-colors text-sm text-silver-pink"
                                >
                                  <BarChart className="w-4 h-4" />
                                  <span className="hidden sm:inline">Analytics</span>
                                </button>
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
                  <span>Shows results for 3s, then moves to next question</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-medium">• End Poll:</span>
                  <span>Shows comprehensive final results</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl md:rounded-2xl p-4 md:p-6">
              <h3 className="font-semibold text-light-taupe mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Results Flow
              </h3>
              <ul className="text-silver-pink space-y-2 text-sm">
                <li>• Results automatically show after each question</li>
                <li>• Participants see results after voting ends</li>
                <li>• Expand any question for detailed analytics</li>
                <li>• View comprehensive analytics on dedicated page</li>
                <li>• Export results as CSV for further analysis</li>
                <li>• All results are saved and accessible anytime</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 md:mt-8 pt-4 border-t border-silver-pink/20 text-center">
            <p className="text-sm text-silver-pink">
              Need help? Click "View Detailed Analytics" for comprehensive results
            </p>
          </div>
        </div>
      </div>  
    </AuthGuard>
  );
}