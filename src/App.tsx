/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from './lib/firebase';
import Auth from './components/Auth';
import { 
  LayoutDashboard, 
  UserCircle, 
  FileText, 
  Search, 
  CheckCircle2, 
  Settings,
  ChevronRight,
  Briefcase,
  MessageSquare
} from 'lucide-react';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Resumes from './components/Resumes';
import JobSearch from './components/JobSearch';
import Applications from './components/Applications';
import QA from './components/QA';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'resumes' | 'search' | 'applications' | 'qa'>('dashboard');

  useEffect(() => {
    if (user) {
      // Check if user profile exists, if not create it
      const checkProfile = async () => {
        const userRef = doc(db, 'users', user.uid);
        try {
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              userId: user.uid,
              fullName: user.displayName || '',
              email: user.email || '',
              updatedAt: new Date().toISOString(),
              preferredLocations: ['Remote', 'Tampa, FL'],
              jobTitles: []
            });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
        }
      };
      checkProfile();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg">
        <div className="h-12 w-12 animate-spin rounded bg-primary shadow-bento rotate-45" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-8 font-sans text-dark">
        <div className="bento-card max-w-2xl bg-white p-12 text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary text-white font-black text-4xl shadow-bento-indigo rotate-3">
              A
            </div>
          </div>
          <h1 className="mb-6 text-6xl font-black uppercase tracking-tighter leading-none">
            ApplyFlow<span className="text-primary">.AI</span>
          </h1>
          <p className="mb-12 text-lg font-bold uppercase tracking-widest text-slate-400 italic">
            Automated Career Trajectory Optimization Engine v2.0
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12 text-left">
            <div className="p-4 border-2 border-slate-100 rounded-lg">
              <span className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Feature 01</span>
              <p className="text-sm font-bold">Neural Job Scraping</p>
            </div>
            <div className="p-4 border-2 border-slate-100 rounded-lg">
              <span className="text-[10px] font-black uppercase text-indigo-500 block mb-1">Feature 02</span>
              <p className="text-sm font-bold">Dynamic Asset Tailoring</p>
            </div>
          </div>

          <div className="inline-block w-full bento-button p-0 overflow-hidden">
            <Auth />
          </div>
          
          <p className="mt-8 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            // Secure OAuth 2.0 Authorization Required
          </p>
        </div>
      </div>
    );
  }

  const navigateTo = (tab: typeof activeTab) => setActiveTab(tab);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'search', label: 'Find Jobs', icon: Search },
    { id: 'applications', label: 'Tracking', icon: CheckCircle2 },
    { id: 'resumes', label: 'Resumes', icon: FileText },
    { id: 'qa', label: 'Intelligence', icon: MessageSquare },
    { id: 'profile', label: 'Config', icon: UserCircle },
  ] as const;

  return (
    <div className="flex h-screen w-full bg-bg font-sans text-dark">
      {/* Sidebar */}
      <aside className="w-64 flex-col border-r-2 border-dark bg-white p-6 md:flex">
        <div className="mb-12 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-primary text-white font-black text-xl shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
            A
          </div>
          <span className="text-2xl font-black uppercase tracking-tighter">ApplyFlow<span className="text-primary">.AI</span></span>
        </div>

        <nav className="flex-1 space-y-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigateTo(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-xs font-black uppercase tracking-widest transition-all group",
                activeTab === item.id 
                  ? "bg-dark text-white shadow-bento-indigo translate-x-1" 
                  : "text-slate-400 hover:text-dark hover:translate-x-1"
              )}
            >
              <item.icon className={cn("h-5 w-5", activeTab === item.id ? "text-primary" : "text-slate-300 group-hover:text-dark")} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t-2 border-slate-100">
          <Auth />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl p-8">
          {activeTab === 'dashboard' && <Dashboard navigateTo={navigateTo} />}
          {activeTab === 'profile' && <Profile />}
          {activeTab === 'resumes' && <Resumes />}
          {activeTab === 'search' && <JobSearch navigateTo={navigateTo} />}
          {activeTab === 'applications' && <Applications />}
          {activeTab === 'qa' && <QA />}
        </div>
      </main>
    </div>
  );
}
