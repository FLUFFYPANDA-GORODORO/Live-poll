"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { 
  Plus, 
  BarChart3, 
  Play,
  Users,
  Loader2,
  LogOut,
  Trash2,
  RotateCcw,
  Share2,
  Download,
  Copy,
  Check,
  X,
  Edit2
} from "lucide-react";

// Share Modal Component
function ShareModal({ poll, onClose }) {
  const [copied, setCopied] = useState(false);
  const pollUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/poll/${poll.id}` 
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(pollUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportResults = () => {
    if (!poll.questions || !poll.voteCounts) {
      toast.error("No results to export");
      return;
    }

    let csv = "Question,Option,Votes,Percentage\n";
    
    poll.questions.forEach((q, qIdx) => {
      const totalVotes = q.options.reduce((sum, _, optIdx) => 
        sum + (poll.voteCounts[`${qIdx}_${optIdx}`] || 0), 0
      );
      
      q.options.forEach((opt, optIdx) => {
        const votes = poll.voteCounts[`${qIdx}_${optIdx}`] || 0;
        const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
        csv += `"${q.text}","${opt.text}",${votes},${pct}%\n`;
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${poll.title || "poll"}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Results exported!");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-surface rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-text">Share Poll</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-hover rounded-lg">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-xl border border-border">
            <QRCodeSVG value={pollUrl} size={180} />
          </div>
        </div>

        {/* Poll Code */}
        <div className="text-center mb-6">
          <p className="text-text-secondary text-sm mb-2">Poll Code</p>
          <p className="text-3xl font-bold text-primary font-mono">{poll.id}</p>
        </div>

        {/* Link */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={pollUrl}
            readOnly
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-text"
          />
          <button 
            onClick={copyLink}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Export */}
        <button 
          onClick={exportResults}
          className="w-full btn-secondary flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Results (CSV)
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareModal, setShareModal] = useState(null);
  const [processingPoll, setProcessingPoll] = useState(null);

  useEffect(() => {
    if (user) fetchPolls();
  }, [user]);

  const fetchPolls = async () => {
    try {
      const q = query(collection(db, "polls"), where("createdBy", "==", user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date()
      }));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setPolls(data);
    } catch (err) {
      console.error("Error fetching polls:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalVotes = (poll) => {
    if (!poll.voteCounts) return 0;
    return Object.values(poll.voteCounts).reduce((a, b) => a + b, 0);
  };

  const getStatusBadge = (poll) => {
    if (poll.status === "ended") return { label: "Ended", className: "bg-text-muted/20 text-text-muted" };
    if (poll.status === "live") return { label: "Live", className: "bg-success/20 text-success" };
    return { label: "Draft", className: "bg-warning/20 text-warning" };
  };

  const deletePoll = async (pollId) => {
    if (!confirm("Delete this poll permanently?")) return;
    setProcessingPoll(pollId);
    try {
      // Delete votes subcollection
      const votesSnap = await getDocs(collection(db, "polls", pollId, "votes"));
      const batch = writeBatch(db);
      votesSnap.forEach(v => batch.delete(v.ref));
      await batch.commit();
      // Delete poll
      await deleteDoc(doc(db, "polls", pollId));
      setPolls(polls.filter(p => p.id !== pollId));
      toast.success("Poll deleted");
    } catch (err) {
      toast.error("Failed to delete");
    } finally {
      setProcessingPoll(null);
    }
  };

  const restartPoll = async (poll) => {
    if (!confirm("Restart poll? This clears all votes.")) return;
    setProcessingPoll(poll.id);
    try {
      const votesSnap = await getDocs(collection(db, "polls", poll.id, "votes"));
      const batch = writeBatch(db);
      votesSnap.forEach(v => batch.delete(v.ref));
      
      const resetCounts = {};
      poll.questions?.forEach((q, qIdx) => {
        q.options.forEach((_, optIdx) => {
          resetCounts[`${qIdx}_${optIdx}`] = 0;
        });
      });
      
      batch.update(doc(db, "polls", poll.id), {
        status: "draft",
        activeQuestionIndex: -1,
        currentQuestionActive: false,
        voteCounts: resetCounts,
      });
      
      await batch.commit();
      fetchPolls();
      toast.success("Poll restarted");
    } catch (err) {
      toast.error("Failed to restart");
    } finally {
      setProcessingPoll(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-surface border-b border-border px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Live Poll
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary hidden sm:block">{user?.email}</span>
              <button onClick={logout} className="p-2 text-text-secondary hover:text-error rounded-lg">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-4 md:p-6">
          {/* Create Button */}
          <div className="mb-6">
            <button
              onClick={() => router.push("/dashboard/create")}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Poll
            </button>
          </div>

          {/* Polls List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-text mb-2">No polls yet</h2>
              <p className="text-text-secondary">Create your first poll to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {polls.map(poll => {
                const status = getStatusBadge(poll);
                const votes = getTotalVotes(poll);
                const isProcessing = processingPoll === poll.id;
                const questionCount = poll.questions?.length || 0;
                const createdDate = poll.createdAt?.toLocaleDateString?.() || "—";

                return (
                  <div
                    key={poll.id}
                    className="bg-surface rounded-xl border border-border p-4 hover:border-primary/40 hover:shadow-lg transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Left - Title & Status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-text text-lg truncate">
                            {poll.title || "Untitled Poll"}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted">
                          Created {createdDate}
                        </p>
                      </div>

                      {/* Center - Stats */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <div className="text-xl font-bold text-primary">{questionCount}</div>
                          <div className="text-text-muted text-xs">Questions</div>
                        </div>
                        <div className="w-px h-8 bg-border" />
                        <div className="text-center">
                          <div className="text-xl font-bold text-secondary">{votes}</div>
                          <div className="text-text-muted text-xs">Votes</div>
                        </div>
                      </div>

                      {/* Right - Actions */}
                      <div className="flex items-center gap-2 md:ml-4">
                        <button
                          onClick={() => router.push(`/present/${poll.id}`)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover text-sm font-medium transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Present
                        </button>

                        <button
                          onClick={() => setShareModal(poll)}
                          className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        {poll.status === "draft" && (
                          <button
                            onClick={() => router.push(`/dashboard/edit/${poll.id}`)}
                            className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => restartPoll(poll)}
                          disabled={isProcessing}
                          className="p-2 text-text-secondary hover:text-warning hover:bg-warning/10 rounded-lg transition-colors"
                          title="Restart"
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => deletePoll(poll.id)}
                          disabled={isProcessing}
                          className="p-2 text-text-secondary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Share Modal */}
        {shareModal && <ShareModal poll={shareModal} onClose={() => setShareModal(null)} />}
      </div>
    </ProtectedRoute>
  );
}