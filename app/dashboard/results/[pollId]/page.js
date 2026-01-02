"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import AuthGuard from "@/components/AuthGuard"; // ADD THIS IMPORT
import {
  BarChart3,
  Download,
  Home,
  ArrowLeft,
  X,
  TrendingUp,
  Calendar,
  Users,
  Share2,
  Printer,
  FileText,
  Award,
  Target,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
  Zap,
  Eye,
} from "lucide-react";

export default function PollResults() {
  const { pollId } = useParams();
  const router = useRouter();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [detailedQuestions, setDetailedQuestions] = useState({});
  const [viewMode, setViewMode] = useState("detailed");

  useEffect(() => {
    const fetchPollData = async () => {
      console.log("pollId:", pollId);
      if (!pollId) {
        setError("No poll ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const currentUser = auth.currentUser;

        if (!currentUser) {
          console.log("No authenticated user found");
          setError("Please log in to view results");
          setLoading(false);
          return;
        }

        console.log("Current user UID:", currentUser.uid);

        const pollRef = doc(db, "polls", pollId);
        const pollSnap = await getDoc(pollRef);

        console.log("Poll exists:", pollSnap.exists());

        if (!pollSnap.exists()) {
          setError("Poll not found");
          setLoading(false);
          return;
        }

        const pollData = { id: pollSnap.id, ...pollSnap.data() };
        console.log("Poll data loaded:", {
          title: pollData.title,
          createdBy: pollData.createdBy,
          currentUser: currentUser.uid,
          match: pollData.createdBy === currentUser.uid,
        });

        // Check if user owns this poll
        if (pollData.createdBy !== currentUser.uid) {
          console.log("Permission denied!");
          setError("You don't have permission to view these results");
          setLoading(false);
          return;
        }

        setPoll(pollData);

        // Initialize detailed view for all questions
        const initialDetails = {};
        pollData.questions?.forEach((_, index) => {
          initialDetails[index] = true;
        });
        setDetailedQuestions(initialDetails);
        setError("");
      } catch (error) {
        console.error("Error fetching poll:", error);
        setError(`Failed to load poll results: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPollData();
  }, [pollId]);

  const calculateQuestionStats = (question) => {
    if (!question || !question.options) return null;

    const totalVotes = question.options.reduce(
      (sum, option) => sum + (option.votes || 0),
      0
    );
    const optionsWithPercentages = question.options.map((option) => ({
      ...option,
      percentage:
        totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0,
    }));

    const maxVotes = Math.max(...question.options.map((opt) => opt.votes || 0));
    const winningOptions = question.options.filter(
      (opt) => (opt.votes || 0) === maxVotes
    );

    const engagementRate =
      poll?.participantCount && totalVotes > 0
        ? Math.round((totalVotes / poll.participantCount) * 100)
        : null;

    return {
      totalVotes,
      optionsWithPercentages,
      maxVotes,
      winningOptions,
      engagementRate,
      hasData: totalVotes > 0,
      sortedOptions: [...optionsWithPercentages].sort(
        (a, b) => (b.votes || 0) - (a.votes || 0)
      ),
    };
  };

  const getPollStats = () => {
    if (!poll || !poll.questions) return null;

    const totalVotesAllQuestions = poll.questions.reduce((sum, q) => {
      return (
        sum + (q.options?.reduce((s, opt) => s + (opt.votes || 0), 0) || 0)
      );
    }, 0);

    let mostPopularQuestion = { index: -1, votes: 0, question: "" };
    let leastPopularQuestion = { index: -1, votes: Infinity, question: "" };

    poll.questions.forEach((q, index) => {
      const votes =
        q.options?.reduce((sum, opt) => sum + (opt.votes || 0), 0) || 0;

      if (votes > mostPopularQuestion.votes) {
        mostPopularQuestion = { index, votes, question: q.text };
      }

      if (votes < leastPopularQuestion.votes) {
        leastPopularQuestion = { index, votes, question: q.text };
      }
    });

    const avgParticipation = poll.participantCount
      ? Math.round(totalVotesAllQuestions / poll.participantCount)
      : 0;

    const totalPossibleVotes =
      poll.questions.length * (poll.participantCount || 0);
    const overallEngagement =
      totalPossibleVotes > 0
        ? Math.round((totalVotesAllQuestions / totalPossibleVotes) * 100)
        : 0;

    return {
      totalQuestions: poll.questions.length,
      totalVotesAllQuestions,
      mostPopularQuestion,
      leastPopularQuestion,
      averageParticipation: avgParticipation,
      overallEngagement,
      participantCount: poll.participantCount || 0,
    };
  };

  const toggleQuestionDetail = (questionIndex) => {
    setDetailedQuestions((prev) => ({
      ...prev,
      [questionIndex]: !prev[questionIndex],
    }));
  };

  const toggleAllDetails = () => {
    const allExpanded = Object.values(detailedQuestions).every(
      (val) => val === true
    );
    const newState = {};
    poll.questions?.forEach((_, index) => {
      newState[index] = !allExpanded;
    });
    setDetailedQuestions(newState);
  };

  const exportToCSV = () => {
    if (!poll) return;

    setExporting(true);

    try {
      let csvContent = "data:text/csv;charset=utf-8,";

      // Header
      csvContent += `"Poll Results - ${poll.title}"\n`;
      csvContent += `"Poll ID:,${pollId}"\n`;

      // Handle Firestore timestamp
      let createdAt = "Unknown";
      if (poll.createdAt) {
        if (typeof poll.createdAt.toDate === "function") {
          createdAt = poll.createdAt.toDate().toLocaleString();
        } else if (poll.createdAt instanceof Date) {
          createdAt = poll.createdAt.toLocaleString();
        } else if (poll.createdAt.seconds) {
          createdAt = new Date(poll.createdAt.seconds * 1000).toLocaleString();
        }
      }

      csvContent += `"Created:,${createdAt}"\n`;
      csvContent += `"Status:,${poll.status}"\n`;
      csvContent += `"Total Participants:,${poll.participantCount || 0}"\n`;
      csvContent += `"Total Votes:,${
        getPollStats()?.totalVotesAllQuestions || 0
      }"\n\n`;

      // Questions data
      poll.questions.forEach((question, qIndex) => {
        csvContent += `"Question ${qIndex + 1}: ${question.text}"\n`;
        csvContent += '"Option","Votes","Percentage","Rank"\n';

        const stats = calculateQuestionStats(question);
        if (stats) {
          stats.sortedOptions.forEach((option, rank) => {
            csvContent += `"${option.text}",${option.votes || 0},${
              option.percentage
            }%,${rank + 1}\n`;
          });
        }

        csvContent += `"Total Votes:,${stats?.totalVotes || 0}"\n`;
        if (stats?.engagementRate) {
          csvContent += `"Engagement:,${stats.engagementRate}%"\n`;
        }
        csvContent += "\n";
      });

      // Summary statistics
      const pollStats = getPollStats();
      csvContent += '"Summary Statistics"\n';
      csvContent += `"Total Questions:,${pollStats?.totalQuestions || 0}"\n`;
      csvContent += `"Total Votes:,${
        pollStats?.totalVotesAllQuestions || 0
      }"\n`;
      csvContent += `"Overall Engagement:,${
        pollStats?.overallEngagement || 0
      }%"\n`;
      csvContent += `"Most Popular Question:,${pollStats?.mostPopularQuestion.question}"\n`;
      csvContent += `"Votes on Most Popular:,${
        pollStats?.mostPopularQuestion.votes || 0
      }"\n`;

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `poll-results-${pollId}-${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export results");
    } finally {
      setExporting(false);
    }
  };

  const printResults = () => {
    window.print();
  };

  const shareResults = () => {
    const shareUrl = `${window.location.origin}/share?pollId=${pollId}&results=true`;
    navigator.clipboard.writeText(shareUrl);
    alert("Results link copied to clipboard!");
  };

  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-eggshell text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-light-taupe border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-silver-pink">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen bg-eggshell text-foreground flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-light-taupe">
            Unable to Load Results
          </h1>
          <p className="text-silver-pink mb-6">
            {error || "Poll data not available"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-light-taupe to-silver-pink hover:from-[#9A7B6A] hover:to-[#B8A190] px-6 py-3 rounded-xl font-semibold text-eggshell transition-all hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
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

  const pollStats = getPollStats();
  const currentQuestion = poll.questions[activeQuestionIndex];
  const questionStats = calculateQuestionStats(currentQuestion);

  return (
    <AuthGuard>
      {" "}
      {/* WRAP THE ENTIRE COMPONENT WITH AuthGuard */}
      <div className="min-h-screen bg-eggshell text-foreground p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="flex items-center gap-2 text-light-taupe hover:text-light-taupe/80 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Back to Dashboard</span>
                  </button>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-light-taupe">
                  {poll.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <code className="text-sm bg-white/50 border border-silver-pink/30 px-3 py-1 rounded-lg text-light-taupe">
                    ID: {pollId}
                  </code>
                  <span
                    className={`text-sm px-3 py-1 rounded-full ${
                      poll.status === "live"
                        ? "bg-green-500/20 text-green-700 border border-green-500/30"
                        : poll.status === "ended"
                        ? "bg-gray-500/20 text-gray-700 border border-gray-500/30"
                        : "bg-yellow-500/20 text-yellow-700 border border-yellow-500/30"
                    }`}
                  >
                    {poll.status === "live"
                      ? "Live"
                      : poll.status === "ended"
                      ? "Ended"
                      : "Draft"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    setViewMode(
                      viewMode === "detailed" ? "summary" : "detailed"
                    )
                  }
                  className="flex items-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-4 py-2.5 rounded-lg text-light-taupe transition-colors hover:bg-white/50"
                >
                  {viewMode === "detailed" ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                  <span>
                    {viewMode === "detailed" ? "Summary View" : "Detailed View"}
                  </span>
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={exporting}
                  className="flex items-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-4 py-2.5 rounded-lg text-light-taupe transition-colors hover:bg-white/50"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={printResults}
                  className="flex items-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-4 py-2.5 rounded-lg text-light-taupe transition-colors hover:bg-white/50"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Poll Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-silver-pink">Questions</p>
                    <p className="text-xl md:text-2xl font-bold text-light-taupe">
                      {pollStats?.totalQuestions || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-light-taupe/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-light-taupe" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-silver-pink">Total Votes</p>
                    <p className="text-xl md:text-2xl font-bold text-light-taupe">
                      {pollStats?.totalVotesAllQuestions || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-silver-pink/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-silver-pink" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-silver-pink">Participants</p>
                    <p className="text-xl md:text-2xl font-bold text-light-taupe">
                      {pollStats?.participantCount || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-silver-pink">Engagement</p>
                    <p className="text-xl md:text-2xl font-bold text-light-taupe">
                      {pollStats?.overallEngagement || 0}%
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-silver-pink">Avg. per Q</p>
                    <p className="text-xl md:text-2xl font-bold text-light-taupe">
                      {pollStats?.averageParticipation || 0}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-silver-pink/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-silver-pink">Created</p>
                    <p className="text-sm font-bold text-light-taupe">
                      {(() => {
                        if (!poll.createdAt) return "Unknown";
                        if (typeof poll.createdAt.toDate === "function") {
                          return poll.createdAt
                            .toDate()
                            .toLocaleDateString("short");
                        } else if (poll.createdAt.seconds) {
                          return new Date(
                            poll.createdAt.seconds * 1000
                          ).toLocaleDateString("short");
                        }
                        return new Date(poll.createdAt).toLocaleDateString(
                          "short"
                        );
                      })()}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {currentQuestion ? (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Questions Navigation */}
              <div className="lg:col-span-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-silver-pink/30 sticky top-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-light-taupe">
                      Questions
                    </h3>
                    <button
                      onClick={toggleAllDetails}
                      className="text-xs text-light-taupe hover:text-light-taupe/80 transition-colors"
                    >
                      {Object.values(detailedQuestions).every(
                        (val) => val === true
                      )
                        ? "Collapse All"
                        : "Expand All"}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {poll.questions.map((question, index) => {
                      const stats = calculateQuestionStats(question);
                      const isActive = activeQuestionIndex === index;

                      return (
                        <button
                          key={index}
                          onClick={() => setActiveQuestionIndex(index)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            isActive
                              ? "bg-gradient-to-r from-light-taupe/20 to-silver-pink/20 border border-light-taupe/30"
                              : "hover:bg-white/50 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isActive
                                    ? "bg-light-taupe text-eggshell"
                                    : "bg-white/50 text-light-taupe"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <span
                                className={`text-sm font-medium truncate max-w-[150px] ${
                                  isActive
                                    ? "text-light-taupe"
                                    : "text-silver-pink"
                                }`}
                              >
                                Q{index + 1}
                              </span>
                            </div>
                            {stats?.hasData && (
                              <div className="text-xs px-2 py-1 rounded-full bg-light-taupe/10 text-light-taupe">
                                {stats.totalVotes} votes
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-silver-pink truncate">
                            {question.text.length > 60
                              ? question.text.substring(0, 60) + "..."
                              : question.text}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-6 pt-5 border-t border-silver-pink/20">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={shareResults}
                        className="flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-3 py-2 rounded-lg text-light-taupe transition-colors hover:bg-white/50 text-sm"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      <button
                        onClick={() => router.push(`/poll/${pollId}`)}
                        className="flex items-center justify-center gap-2 border border-light-taupe/30 hover:border-light-taupe px-3 py-2 rounded-lg text-light-taupe transition-colors hover:bg-white/50 text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Live
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Analytics */}
              <div className="lg:col-span-2 space-y-6">
                {/* Current Question Header */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-silver-pink/30">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-light-taupe">
                        Question {activeQuestionIndex + 1}:{" "}
                        {currentQuestion.text}
                      </h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-silver-pink">
                          {questionStats?.totalVotes || 0} total votes
                        </span>
                        {questionStats?.engagementRate && (
                          <span className="text-sm px-2 py-1 rounded-full bg-green-500/20 text-green-700">
                            {questionStats.engagementRate}% engagement
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleQuestionDetail(activeQuestionIndex)}
                      className="flex items-center gap-2 text-light-taupe hover:text-light-taupe/80 transition-colors"
                    >
                      {detailedQuestions[activeQuestionIndex] ? (
                        <>
                          <Minimize2 className="w-4 h-4" />
                          <span className="text-sm">Collapse</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-4 h-4" />
                          <span className="text-sm">Expand</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Quick Stats */}
                  {questionStats?.hasData && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      <div className="bg-white/50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-light-taupe">
                          {questionStats.sortedOptions[0]?.percentage || 0}%
                        </div>
                        <div className="text-xs text-silver-pink">
                          Top Choice
                        </div>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-light-taupe">
                          {questionStats.winningOptions.length > 1
                            ? "Tie"
                            : "Clear Win"}
                        </div>
                        <div className="text-xs text-silver-pink">Result</div>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-light-taupe">
                          {questionStats.totalVotes}
                        </div>
                        <div className="text-xs text-silver-pink">
                          Total Votes
                        </div>
                      </div>
                      <div className="bg-white/50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-light-taupe">
                          {questionStats.optionsWithPercentages.length}
                        </div>
                        <div className="text-xs text-silver-pink">Options</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detailed Results */}
                {detailedQuestions[activeQuestionIndex] &&
                  questionStats?.hasData && (
                    <div className="space-y-4">
                      {/* Options Results */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-silver-pink/30">
                        <h3 className="text-lg font-semibold text-light-taupe mb-4 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Option Results
                        </h3>

                        <div className="space-y-4">
                          {questionStats.sortedOptions.map((option, index) => {
                            const isWinner =
                              (option.votes || 0) === questionStats.maxVotes;

                            return (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                        isWinner
                                          ? "bg-yellow-500/20 text-yellow-700 border border-yellow-500/30"
                                          : "bg-white/50 text-light-taupe border border-silver-pink/30"
                                      }`}
                                    >
                                      {String.fromCharCode(65 + index)}
                                      {isWinner && (
                                        <Award className="absolute -mt-6 -ml-6 w-4 h-4 text-yellow-500" />
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-medium text-light-taupe">
                                        {option.text}
                                      </div>
                                      <div className="text-xs text-silver-pink">
                                        Rank {index + 1} of{" "}
                                        {
                                          questionStats.optionsWithPercentages
                                            .length
                                        }
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-light-taupe">
                                      {option.percentage}%
                                    </div>
                                    <div className="text-sm text-silver-pink">
                                      {option.votes || 0} votes
                                    </div>
                                  </div>
                                </div>

                                <div className="w-full bg-white/30 rounded-full h-3">
                                  <div
                                    className={`h-3 rounded-full transition-all duration-500 ${
                                      index === 0
                                        ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                                        : index === 1
                                        ? "bg-gradient-to-r from-light-taupe to-silver-pink"
                                        : "bg-gradient-to-r from-light-taupe/70 to-silver-pink/70"
                                    }`}
                                    style={{ width: `${option.percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Insights & Analysis */}
                      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-5">
                        <h3 className="text-lg font-semibold text-light-taupe mb-3 flex items-center gap-2">
                          <Zap className="w-5 h-5" />
                          Insights
                        </h3>

                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <TrendingUp className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-light-taupe">
                                Top Performer
                              </div>
                              <div className="text-sm text-silver-pink">
                                "{questionStats.sortedOptions[0]?.text}"
                                received{" "}
                                {questionStats.sortedOptions[0]?.percentage}% of
                                votes
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <Target className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-light-taupe">
                                Engagement Level
                              </div>
                              <div className="text-sm text-silver-pink">
                                {questionStats.engagementRate}% of participants
                                voted on this question
                              </div>
                            </div>
                          </div>

                          {questionStats.winningOptions.length > 1 && (
                            <div className="flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-light-taupe">
                                  Close Race
                                </div>
                                <div className="text-sm text-silver-pink">
                                  {questionStats.winningOptions.length} options
                                  tied for first place
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {!questionStats?.hasData && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center border border-silver-pink/30">
                    <div className="w-16 h-16 rounded-full bg-light-taupe/10 flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-light-taupe/60" />
                    </div>
                    <h3 className="text-lg font-semibold text-light-taupe mb-2">
                      No Votes Recorded
                    </h3>
                    <p className="text-silver-pink">
                      This question has not received any votes yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-silver-pink">
                No questions available for this poll.
              </p>
            </div>
          )}

          {/* Summary View */}
          {viewMode === "summary" && poll.questions && (
            <div className="mt-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-silver-pink/30">
                <h3 className="text-lg font-semibold text-light-taupe mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Summary Report
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-light-taupe mb-3">
                      Key Statistics
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span className="text-silver-pink">
                          Total Questions
                        </span>
                        <span className="font-medium text-light-taupe">
                          {pollStats?.totalQuestions || 0}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-silver-pink">
                          Total Participants
                        </span>
                        <span className="font-medium text-light-taupe">
                          {pollStats?.participantCount || 0}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-silver-pink">Total Votes</span>
                        <span className="font-medium text-light-taupe">
                          {pollStats?.totalVotesAllQuestions || 0}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-silver-pink">
                          Overall Engagement
                        </span>
                        <span className="font-medium text-light-taupe">
                          {pollStats?.overallEngagement || 0}%
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-silver-pink">
                          Average per Question
                        </span>
                        <span className="font-medium text-light-taupe">
                          {pollStats?.averageParticipation || 0} votes
                        </span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-light-taupe mb-3">
                      Performance Highlights
                    </h4>
                    <ul className="space-y-2">
                      {pollStats?.mostPopularQuestion.index >= 0 && (
                        <li className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-silver-pink">
                            <span className="font-medium text-light-taupe">
                              Most Popular:
                            </span>{" "}
                            Question {pollStats.mostPopularQuestion.index + 1}{" "}
                            with {pollStats.mostPopularQuestion.votes} votes
                          </span>
                        </li>
                      )}
                      {pollStats?.leastPopularQuestion.index >= 0 &&
                        pollStats.leastPopularQuestion.votes < Infinity && (
                          <li className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <span className="text-silver-pink">
                              <span className="font-medium text-light-taupe">
                                Least Popular:
                              </span>{" "}
                              Question{" "}
                              {pollStats.leastPopularQuestion.index + 1} with{" "}
                              {pollStats.leastPopularQuestion.votes} votes
                            </span>
                          </li>
                        )}
                      <li className="flex items-start gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-silver-pink">
                          <span className="font-medium text-light-taupe">
                            Completion Rate:
                          </span>{" "}
                          {
                            poll.questions.filter((q) => {
                              const votes =
                                q.options?.reduce(
                                  (sum, opt) => sum + (opt.votes || 0),
                                  0
                                ) || 0;
                              return votes > 0;
                            }).length
                          }{" "}
                          of {poll.questions.length} questions received votes
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-silver-pink/20 text-center">
            <p className="text-sm text-silver-pink">
              Analytics generated on {new Date().toLocaleDateString()} at{" "}
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
