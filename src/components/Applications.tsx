import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Application } from '../types';
import { Trash2, ExternalLink, Calendar, Briefcase, FileText, CheckCircle, Clock, AlertCircle, Search as FileSearch } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { motion } from 'motion/react';
import { cn, formatDate } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export default function Applications() {
  const [user] = useAuthState(auth);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  const filteredApps = applications.filter(app => {
    if (filter === 'success') return app.status === 'Applied' || app.status === 'Interviewing';
    if (filter === 'failed') return app.status === 'Failed';
    return true;
  });

  const fetchApplications = async () => {
    if (!user) return;
    const appsPath = `users/${user.uid}/applications`;
    try {
      const q = query(collection(db, 'users', user.uid, 'applications'), orderBy('appliedAt', 'desc'));
      const snapshot = await getDocs(q);
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application)));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, appsPath);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !window.confirm('Remove this application record?')) return;
    const appPath = `users/${user.uid}/applications/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'applications', id));
      fetchApplications();
      if (selectedApp?.id === id) setSelectedApp(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, appPath);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center italic text-zinc-400">Loading career history...</div>;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between bg-white border-2 border-dark p-6 rounded-xl shadow-bento">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Transmission Log</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Audit trail of automated interactions.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex border-2 border-dark rounded overflow-hidden">
            <button onClick={() => setFilter('all')} className={cn("px-3 py-1 text-[9px] font-black uppercase tracking-widest transition-colors", filter === 'all' ? "bg-dark text-white" : "bg-white text-dark hover:bg-slate-50")}>All</button>
            <button onClick={() => setFilter('success')} className={cn("px-3 py-1 text-[9px] font-black uppercase tracking-widest border-l-2 border-dark transition-colors", filter === 'success' ? "bg-accent text-white" : "bg-white text-dark hover:bg-slate-50")}>Success</button>
            <button onClick={() => setFilter('failed')} className={cn("px-3 py-1 text-[9px] font-black uppercase tracking-widest border-l-2 border-dark transition-colors", filter === 'failed' ? "bg-red-500 text-white" : "bg-white text-dark hover:bg-slate-50")}>Errors</button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Application List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">
            <span>Logged Interactions</span>
            <span>{applications.length} TOTAL</span>
          </div>
          
          <div className="space-y-3">
            {filteredApps.length > 0 ? (
              filteredApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={cn(
                    "w-full text-left rounded-xl border-2 p-5 transition-all",
                    selectedApp?.id === app.id 
                      ? "bg-dark border-dark text-white shadow-bento-indigo translate-x-1" 
                      : "bg-white border-dark text-dark shadow-bento hover:translate-x-1"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-black italic uppercase tracking-tighter text-sm mb-1 line-clamp-1 truncate">ID: {app.jobId.split('-')[0]}...</h3>
                      <div className="flex items-center gap-3 opacity-60 text-[9px] font-black uppercase tracking-widest">
                        <Calendar className="h-3 w-3" />
                        {app.appliedAt ? formatDate(app.appliedAt) : 'N/A'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "rounded border-2 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest",
                        app.status === 'Failed' ? "bg-red-50 border-red-200 text-red-500" :
                        selectedApp?.id === app.id ? "bg-slate-800 border-slate-700" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                      )}>
                        {app.status}
                      </div>
                      <button 
                        onClick={(e) => app.id && handleDelete(app.id, e)}
                        className="p-1 hover:text-red-500 transition-all opacity-40 group-hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-dark bg-white/50 p-12 text-center text-slate-400 grayscale">
                <Clock className="mb-4 h-12 w-12 opacity-10" />
                <p className="font-black uppercase tracking-widest">No Transmissions</p>
              </div>
            )}
          </div>
        </div>

        {/* Content Viewer */}
        <div className="lg:col-span-7">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-2">Document Audit</div>
          
          {selectedApp ? (
            <motion.div
              layoutId={selectedApp.id}
              className="bento-card bg-white p-8"
            >
              <div className="flex justify-between items-start mb-8 border-b-2 border-dark pb-6">
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter mb-1">ASSET_TRACE</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">UUID: {selectedApp.id}</p>
                </div>
                <div className={cn(
                  "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border-2 px-3 py-1 rounded",
                  selectedApp.status === 'Failed' ? "bg-red-50 border-red-200 text-red-500" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                )}>
                  {selectedApp.status === 'Failed' ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                  {selectedApp.status === 'Failed' ? 'DISRUPTED' : 'VERIFIED'}: {selectedApp.status}
                </div>
              </div>

              <div className="space-y-8 text-dark">
                {selectedApp.status === 'Failed' && (
                  <section className="p-4 bg-red-50 border-2 border-red-200 rounded-lg text-[11px] font-bold text-red-700 font-mono">
                    <p className="uppercase mb-1">{'>'} CRITICAL_ERROR_TRACE:</p>
                    <p>{selectedApp.error || 'The remote site rejected the synthesis data or session timed out during submission.'}</p>
                  </section>
                )}
                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Optimised Resume
                  </h3>
                  <div className="p-6 bg-slate-900 text-white rounded-lg border-2 border-dark font-mono text-[11px] leading-relaxed shadow-bento-indigo max-h-80 overflow-y-auto custom-scrollbar">
                    <ReactMarkdown>{selectedApp.tailoredResume || 'No resume content stored.'}</ReactMarkdown>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Cover Letter
                  </h3>
                  <div className="p-6 bg-slate-50 border-2 border-dark rounded-lg font-serif italic text-sm leading-relaxed text-dark max-h-60 overflow-y-auto custom-scrollbar">
                    <ReactMarkdown>{selectedApp.coverLetter || 'No cover letter content stored.'}</ReactMarkdown>
                  </div>
                </section>

                <button className="bento-button w-full flex items-center justify-center gap-2 py-4 text-xs">
                  GENERATE EXPORT BUNDLE
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-dark bg-white/30 p-8 text-center grayscale">
              <FileSearch className="mb-4 h-12 w-12 opacity-10" />
              <p className="font-black uppercase tracking-widest text-slate-400">Select log entry to review artifacts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
