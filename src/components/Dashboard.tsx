import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp,
  Briefcase,
  MapPin,
  Search,
  FileText,
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';
import { Application } from '../types';
import { formatDate } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface DashboardProps {
  navigateTo: (tab: 'dashboard' | 'profile' | 'resumes' | 'search' | 'applications') => void;
}

export default function Dashboard({ navigateTo }: DashboardProps) {
  const [user] = useAuthState(auth);
  const [recentApps, setRecentApps] = useState<Application[]>([]);
  const [stats, setStats] = useState({ applied: 0, tailoring: 0, interviewing: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const appsPath = `users/${user.uid}/applications`;
        try {
          const appsRef = collection(db, 'users', user.uid, 'applications');
          const q = query(appsRef, orderBy('appliedAt', 'desc'), limit(5));
          const snapshot = await getDocs(q);
          const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
          setRecentApps(apps);

          // Calculate stats (simplified for now)
          const allSnapshot = await getDocs(appsRef);
          const allApps = allSnapshot.docs.map(doc => doc.data() as Application);
          setStats({
            applied: allApps.filter(a => a.status === 'Applied').length,
            tailoring: allApps.filter(a => a.status === 'Tailoring' || a.status === 'Draft').length,
            interviewing: allApps.filter(a => a.status === 'Interviewing').length,
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, appsPath);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center bg-white border-2 border-dark p-6 rounded-xl shadow-bento">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">System Overview</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Tracking your professional trajectory.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border-2 border-emerald-200">
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
          ENGINE ACTIVE
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Applications Sent', value: stats.applied, icon: Send, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
          { label: 'Tailoring Assets', value: stats.tailoring, icon: Clock, color: 'bg-slate-900 text-white border-slate-700 shadow-bento-indigo' },
          { label: 'Success Rate', value: stats.applied > 0 ? `${Math.round((stats.interviewing / stats.applied) * 100)}%` : '0%', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn("flex flex-col gap-4 rounded-xl border-2 border-dark p-6 shadow-bento group hover:-translate-y-1 transition-all", stat.color)}
          >
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 group-hover:opacity-100">{stat.label}</p>
              <stat.icon className="h-5 w-5 opacity-50" />
            </div>
            <p className="text-5xl font-black font-mono tracking-tighter">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Recent Applications (Live Engine Trace Style) */}
        <div className="lg:col-span-8 flex flex-col bento-card-dark p-6 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Live Engine Trace</h2>
            <div className="flex gap-2">
              <span className="text-[9px] font-mono border border-slate-700 rounded px-2 py-0.5 text-slate-500">v2.0.44-STABLE</span>
            </div>
          </div>
          
          <div className="flex-grow font-mono text-[11px] space-y-3 overflow-hidden">
            {recentApps.length > 0 ? (
              recentApps.map((app, i) => (
                <div key={app.id} className="flex gap-4 group">
                  <span className="text-slate-600">[{formatDate(app.appliedAt || new Date()).split(',')[0]}]</span>
                  <p className={cn(
                    "flex-1",
                    i === 0 ? "text-accent font-bold" : "text-slate-300"
                  )}>
                    {i === 0 ? "SUCCESS: " : "PROCESSED: "}
                    <span className="underline italic">Application submitted</span> to {app.jobId.split('-')[0]}... (Status: {app.status})
                  </p>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center italic text-slate-600">
                // ENGINE STANDBY... WAITING FOR JOBS
              </div>
            )}
            <p className="text-indigo-400 animate-pulse">_</p>
          </div>

          <div className="mt-6 p-4 bg-slate-800 rounded-lg border-2 border-dark flex justify-around items-center shadow-inner">
            <div className="text-center">
              <span className="block text-2xl font-black tracking-tighter">{stats.applied}</span>
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">Processed</span>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="text-center">
              <span className="block text-2xl font-black tracking-tighter text-indigo-400">{stats.tailoring}</span>
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">In Pipe</span>
            </div>
            <div className="h-8 w-px bg-slate-700"></div>
            <div className="text-center">
              <span className="block text-2xl font-black tracking-tighter text-emerald-400">{stats.interviewing}</span>
              <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">Wins</span>
            </div>
          </div>
        </div>

        {/* Quick Actions (Sidebar Cards Style) */}
        <div className="lg:col-span-4 grid gap-6 content-start">
          <section className="bento-card p-6 bg-white">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Execution Hub</h2>
            <div className="grid gap-3">
              <button 
                onClick={() => navigateTo('search')}
                className="w-full flex items-center justify-between bg-dark text-white p-4 rounded-lg font-black uppercase italic tracking-tighter text-sm hover:translate-x-1 hover:-translate-y-1 transition-all shadow-bento-indigo"
              >
                Find Jobs <ArrowUpRight className="h-4 w-4" />
              </button>
              <button 
                onClick={() => navigateTo('resumes')}
                className="w-full flex items-center justify-between border-2 border-dark p-4 rounded-lg font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
              >
                Resume Library <FileText className="h-4 w-4 opacity-30" />
              </button>
              <button 
                onClick={() => navigateTo('profile')}
                className="w-full flex items-center justify-between border-2 border-dark p-4 rounded-lg font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all"
              >
                Agent Config <Settings className="h-4 w-4 opacity-30" />
              </button>
            </div>
          </section>

          <section className="bento-card p-6 bg-indigo-600 text-white border-dark">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-4">Automation Rules</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white rounded flex items-center justify-center bg-white">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[11px] font-black uppercase italic">Auto-tailoring Enabled</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-white rounded flex items-center justify-center bg-white">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[11px] font-black uppercase italic">Remote-First Prioritized</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// Small helper for conditional classes imported from utils but repeated here for safety in this block
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
