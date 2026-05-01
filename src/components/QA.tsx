import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, getDocs, addDoc, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { Resume } from '../types';
import { answerJobQuestions } from '../services/geminiService';
import { Plus, Trash2, HelpCircle, Sparkles, MessageSquare, Save, RotateCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface QAItem {
  id?: string;
  question: string;
  answer: string;
}

export default function QA() {
  const [user] = useAuthState(auth);
  const [questions, setQuestions] = useState<QAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');

  const fetchQA = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'users', user.uid, 'qa'));
      const snapshot = await getDocs(q);
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QAItem)));
      
      const resQ = await getDocs(collection(db, 'users', user.uid, 'resumes'));
      const resData = resQ.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resume));
      setResumes(resData);
      if (resData.length > 0) setSelectedResumeId(resData[0].id!);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQA(); }, [user]);

  const generateAnswer = async () => {
    if (!newQuestion || !selectedResumeId || !user) return;
    setProcessing(true);
    try {
      const resume = resumes.find(r => r.id === selectedResumeId);
      const responses = await answerJobQuestions(resume?.content || '', [newQuestion]);
      const answer = responses[newQuestion] || 'Insufficient data in resume to answer.';
      
      await addDoc(collection(db, 'users', user.uid, 'qa'), {
        question: newQuestion,
        answer,
        createdAt: new Date().toISOString()
      });
      setNewQuestion('');
      fetchQA();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/qa`);
    } finally {
      setProcessing(false);
    }
  };

  const deleteQA = async (id: string) => {
    if (!user || !window.confirm('Erase this record?')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'qa', id));
      fetchQA();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center italic text-slate-400">Synchronizing intelligence database...</div>;

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between bg-white border-2 border-dark p-6 rounded-xl shadow-bento">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">AI Knowledge Base</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Pre-synthesis for common screening questions.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bento-card p-6 bg-indigo-50">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-6 flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Synthesis Engine
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 italic">Target Question</label>
                <textarea
                  placeholder="e.g. Why do you want to work at this company? or Tell me about a time you solved a complex problem."
                  rows={4}
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full rounded-lg border-2 border-dark bg-white px-4 py-3 text-sm font-bold shadow-inner outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 italic">Context Source (Resume)</label>
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full rounded-lg border-2 border-dark bg-white px-4 py-3 text-sm font-black uppercase tracking-widest outline-none appearance-none cursor-pointer"
                >
                  {resumes.map(r => <option key={r.id} value={r.id}>{r.jobType}</option>)}
                </select>
              </div>
              <button
                onClick={generateAnswer}
                disabled={processing || !newQuestion}
                className="bento-button w-full flex items-center justify-center gap-3 py-4 text-base italic mt-4"
              >
                {processing ? <RotateCw className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
                {processing ? 'Synthesizing...' : 'Generate Answer'}
              </button>
            </div>
          </section>
        </div>

        {/* Saved Q&A */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">
            <span>Verified Knowledge Nodes</span>
            <span>{questions.length} STORED</span>
          </div>
          
          <div className="space-y-4">
            {questions.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bento-card p-6 bg-white group"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-black italic text-dark uppercase text-sm tracking-tight pr-8">Q: {item.question}</h3>
                  <button onClick={() => deleteQA(item.id!)} className="text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-4 bg-slate-900 text-white rounded-lg border-2 border-dark font-mono text-[11px] leading-relaxed relative overflow-hidden group-hover:shadow-bento-indigo transition-all">
                   <div className="absolute top-0 right-0 p-2 opacity-10">
                     <HelpCircle className="h-12 w-12" />
                   </div>
                   <p className="relative z-10">{item.answer}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
