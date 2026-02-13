"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BarChart3, 
  Loader2, 
  List,
  RefreshCw,
  FolderOpen,
  TrendingUp,
  Rocket,
  Megaphone,
  Target,
  Lightbulb,
  BarChart,
  HelpCircle
} from "lucide-react";

// Components
import StatsCard from "@/components/Dashboard/StatsCard";

export default function Dashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Calculate Stats
  const totalPolls = polls.length;
  const totalVotesAll = polls.reduce((sum, poll) => {
     return sum + (poll.voteCounts ? Object.values(poll.voteCounts).reduce((a, b) => a + b, 0) : 0);
  }, 0);

  const avgEngagement = totalPolls > 0 ? Math.round(totalVotesAll / totalPolls) : 0; 
  const activePolls = polls.filter(p => p.status === "active").length;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Navbar */}
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between shadow-sm z-10">
            <div>
               <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
               <p className="text-sm text-slate-500 mt-1">Real-time analytics and performance metrics</p>
            </div>
            <div className="flex items-center gap-4">
                <button 
                   onClick={fetchPolls}
                   className="p-2 text-slate-400 hover:text-[var(--color-primary)] transition-colors"
                   title="Refresh Data"
                >
                     <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-auto p-8 bg-slate-50">
            
            {/* 1. Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                 <StatsCard 
                    label="Total Polls" 
                    value={totalPolls}
                    icon={FolderOpen}
                    subtext="All time created"
                 />
                 <StatsCard 
                    label="Total Votes" 
                    value={totalVotesAll} 
                    icon={BarChart3}
                    subtext="Across all sessions"
                 />
                 <StatsCard 
                    label="Avg. Votes" 
                    value={avgEngagement} 
                    icon={TrendingUp}
                    subtext="Per poll average"
                 />
            </div>

            {/* Coming Soon Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                 <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-2xl flex items-center justify-center">
                       <Rocket className="w-8 h-8" />
                    </div>
                 </div>
                 
                 <h2 className="text-xl font-bold text-slate-900 mb-3">Enhanced Analytics Coming Soon</h2>
                 <p className="text-slate-500 max-w-lg mx-auto mb-8">
                     We're working on powerful new insights to help you analyze audience engagement, track participation trends, and maximize the impact of your live polls.
                 </p>
                 
                 <div className="flex items-center justify-center gap-6">
                     <div className="p-3 bg-slate-50 rounded-xl text-[var(--color-secondary)]">
                        <BarChart className="w-6 h-6" />
                     </div>
                     <div className="p-3 bg-slate-50 rounded-xl text-blue-500">
                        <List className="w-6 h-6" />
                     </div>
                     <div className="p-3 bg-slate-50 rounded-xl text-pink-500">
                        <Megaphone className="w-6 h-6" />
                     </div>
                     <div className="p-3 bg-slate-50 rounded-xl text-red-500">
                        <Target className="w-6 h-6" />
                     </div>
                     <div className="p-3 bg-slate-50 rounded-xl text-yellow-500">
                        <Lightbulb className="w-6 h-6" />
                     </div>
                 </div>
            </div>

            {loading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 text-[var(--color-primary)] animate-spin" />
                </div>
            )}
        </main>
    </div>
  );
}
