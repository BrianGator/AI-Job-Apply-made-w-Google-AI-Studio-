import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Resume } from '../types';
import { Plus, Trash2, FileText, Briefcase, Calendar, Sparkles } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../lib/utils';

export default function Resumes() {
  const [user] = useAuthState(auth);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newResume, setNewResume] = useState({ jobType: '', content: '' });
  const [saving, setSaving] = useState(false);

  const fetchResumes = async () => {
    if (!user) return;
    const resumesPath = `users/${user.uid}/resumes`;
    try {
      const q = query(collection(db, 'users', user.uid, 'resumes'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setResumes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resume)));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, resumesPath);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [user]);

  const handleAdd = async () => {
    if (!user || !newResume.jobType || !newResume.content) return;
    setSaving(true);
    const resumesPath = `users/${user.uid}/resumes`;
    try {
      await addDoc(collection(db, 'users', user.uid, 'resumes'), {
        userId: user.uid,
        jobType: newResume.jobType,
        content: newResume.content,
        createdAt: new Date().toISOString(),
      });
      setNewResume({ jobType: '', content: '' });
      setShowAdd(false);
      fetchResumes();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, resumesPath);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this resume?')) return;
    const resumePath = `users/${user.uid}/resumes/${id}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'resumes', id));
      fetchResumes();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, resumePath);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center italic text-zinc-400">Inventorying resumes...</div>;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between bg-white border-2 border-dark p-6 rounded-xl shadow-bento">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Resume Library</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Central repository for tailored career documents.</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bento-button flex items-center gap-2"
        >
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAdd ? 'Cancel' : 'Construct New Version'}
        </button>
      </header>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bento-card bg-slate-50 p-6">
              <h3 className="mb-6 text-xs font-black uppercase tracking-[0.2em] text-slate-400 border-b-2 border-dark pb-2">Construct Data Stream</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 italic">Target Sector / Job Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Engineer, Product Manager"
                    value={newResume.jobType}
                    onChange={e => setNewResume(r => ({ ...r, jobType: e.target.value }))}
                    className="w-full rounded-lg border-2 border-dark bg-white px-4 py-3 text-sm font-bold shadow-inner outline-none focus:bg-indigo-50/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 italic">Raw Character Buffer (Resume Text)</label>
                  <textarea
                    placeholder="Paste your source text data here..."
                    rows={10}
                    value={newResume.content}
                    onChange={e => setNewResume(r => ({ ...r, content: e.target.value }))}
                    className="w-full rounded-lg border-2 border-dark bg-white px-4 py-4 text-xs font-mono shadow-inner outline-none focus:bg-indigo-50/30"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setShowAdd(false)}
                    className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-dark"
                  >
                    Discard
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={saving}
                    className="bento-button flex items-center gap-3 bg-indigo-600 shadow-bento shadow-indigo-900"
                  >
                    {saving ? 'Processing...' : 'Catalog Dataset'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {resumes.length > 0 ? (
          resumes.map((resume, i) => (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="bento-card p-6 flex flex-col group overflow-hidden"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded border-2 border-dark bg-slate-50 text-dark transition-all group-hover:bg-primary group-hover:text-white group-hover:shadow-bento">
                  <FileText className="h-6 w-6" />
                </div>
                <button
                  onClick={() => resume.id && handleDelete(resume.id)}
                  className="rounded border-2 border-transparent p-2 text-slate-300 hover:border-red-500 hover:text-red-500 transition-all active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-xl font-black italic tracking-tighter text-dark uppercase mb-1">{resume.jobType}</h3>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 mb-6">
                <Calendar className="h-3 w-3" />
                Sourced: {formatDate(resume.createdAt)}
              </div>
              
              <div className="flex-1 overflow-hidden relative">
                <p className="line-clamp-4 font-mono text-[10px] leading-relaxed text-slate-500 opacity-60">
                  {resume.content}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent"></div>
              </div>

              <div className="mt-8 pt-6 border-t-2 border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.2em] text-indigo-500">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  Neural-Ready
                </div>
                <button className="text-[10px] font-black uppercase tracking-widest text-dark hover:underline underline-offset-4 decoration-2">Edit Block</button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-dark bg-white/50 p-20 text-center text-slate-400 grayscale">
            <Briefcase className="mb-4 h-16 w-16 opacity-10" />
            <p className="font-black uppercase tracking-widest text-lg italic">Database Empty</p>
            <p className="text-[10px] font-mono mt-2">Required: Feed the engine with resume variations.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function X(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  );
}
