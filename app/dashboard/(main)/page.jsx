"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { 
  Plus, 
  BarChart3, 
  Loader2, 
  X,
  Copy,
  Check,
  Download,
  List,
  RefreshCw,
  FolderOpen
} from "lucide-react";

// New Components
import StatsCard from "@/components/Dashboard/StatsCard";
import PollCard from "@/components/Dashboard/PollCard";

// Share Modal Component (Existing)
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
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Share Poll</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <QRCodeSVG value={pollUrl} size={180} />
          </div>
        </div>

        {/* Poll Code */}
        <div className="text-center mb-6">
          <p className="text-slate-500 text-sm mb-2">Poll Code</p>
          <p className="text-3xl font-bold text-[var(--color-primary)] font-mono">{poll.id}</p>
        </div>

        {/* Link */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={pollUrl}
            readOnly
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
          <button 
            onClick={copyLink}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] flex items-center gap-2 transition-colors"
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
  const { user } = useAuth();
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

  // Calculate Stats
  const totalPolls = polls.length;
  const totalVotesAll = polls.reduce((sum, poll) => {
     return sum + (poll.voteCounts ? Object.values(poll.voteCounts).reduce((a, b) => a + b, 0) : 0);
  }, 0);

  // Dummy stat for engagement
  const avgEngagement = totalPolls > 0 ? Math.round(totalVotesAll / totalPolls) : 0; 


  return (
    <>
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
          
          {/* Navbar */}
          <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm z-10">
              <div>
                 <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                 <p className="text-sm text-slate-500 mt-1">Manage your live polls and view real-time results</p>
              </div>
              <div className="flex items-center gap-4">
                  <button 
                     onClick={fetchPolls}
                     className="p-2 text-slate-400 hover:text-[var(--color-primary)] transition-colors"
                     title="Refresh Data"
                  >
                       <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <button 
                      onClick={() => router.push("/dashboard/create")}
                      className="bg-[var(--color-primary)] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[var(--color-primary)]/20 hover:bg-[var(--color-primary-hover)] transition-all flex items-center gap-2"
                  >
                      <Plus className="w-5 h-5" />
                      Create Poll
                  </button>
              </div>
          </header>

          {/* Scrollable Content Area */}
          <main className="flex-1 overflow-auto p-8">
              
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                   <StatsCard 
                      label="Total Polls" 
                      value={totalPolls}
                      icon={FolderOpen}
                      subtext="Total created polls"
                   />
                   <StatsCard 
                      label="Total Votes" 
                      value={totalVotesAll} 
                      icon={BarChart3}
                      subtext="Across all sessions"
                   />

                   <StatsCard 
                      label="Avg. Engagement" 
                      value={avgEngagement} 
                      icon={List}
                      subtext="Votes per poll"
                   />
              </div>

              {/* Polls Grid */}
              <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Your Polls</h2>
              </div>

              {loading ? (
                  <div className="flex justify-center py-20">
                  <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
                  </div>
              ) : polls.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                      <FolderOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700">No polls yet</h3>
                      <p className="text-slate-500 mb-6">Create your first poll to get started</p>
                      <button
                        onClick={() => router.push("/dashboard/create")}
                        className="text-[var(--color-primary)] font-bold hover:underline"
                      >
                        Create New Poll
                      </button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                  {polls.map(poll => (
                      <PollCard 
                          key={poll.id} 
                          poll={poll} 
                          onDelete={deletePoll} 
                          onRestart={restartPoll} 
                          onShare={(p) => setShareModal(p)}
                      />
                  ))}
                  </div>
              )}

          </main>
      </div>

      {/* Share Modal */}
      {shareModal && <ShareModal poll={shareModal} onClose={() => setShareModal(null)} />}
    </>
  );
}
