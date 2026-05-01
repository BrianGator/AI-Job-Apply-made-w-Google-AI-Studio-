import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { searchJobs, tailorResume, generateCoverLetter } from '../services/geminiService';
import { collection, addDoc, getDocs, doc, getDoc } from 'firebase/firestore';
import { Job, Resume, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { 
  Search, 
  MapPin, 
  Briefcase, 
  ExternalLink, 
  Sparkles, 
  RotateCw,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Loader2,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export default function JobSearch({ navigateTo }: { navigateTo: (tab: any) => void }) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [tailoring, setTailoring] = useState(false);
  const [tailoredContent, setTailoredContent] = useState<{ resume: string; coverLetter: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      const fetchInitial = async () => {
        const resumesPath = `users/${user.uid}/resumes`;
        try {
          const q = await getDocs(collection(db, 'users', user.uid, 'resumes'));
          setResumes(q.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resume)));
          
          const pDoc = await getDoc(doc(db, 'users', user.uid));
          if (pDoc.exists()) setProfile(pDoc.data() as UserProfile);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, resumesPath);
        }
      };
      fetchInitial();
    }
  }, [user]);

  const handleSearch = async () => {
    if (!profile?.jobTitles?.length) {
      alert('Please add job titles in your profile first.');
      return;
    }
    setSearching(true);
    try {
      const activeTitles = profile?.jobTitles || [];
      const activeLocations = profile?.preferredLocations || [];
      const results = await searchJobs(activeTitles, activeLocations);
      setJobs(results.map((j: any, i: number) => ({ ...j, id: `job-${i}-${Date.now()}` })));
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleTailor = async () => {
    if (!selectedJob || !selectedResumeId) return;
    const resume = resumes.find(r => r.id === selectedResumeId);
    if (!resume) return;

    setTailoring(true);
    try {
      const [newResume, newCoverLetter] = await Promise.all([
        tailorResume(resume.content, selectedJob.description),
        generateCoverLetter(resume.content, selectedJob.description)
      ]);
      setTailoredContent({ resume: newResume, coverLetter: newCoverLetter });
    } catch (err) {
      console.error(err);
    } finally {
      setTailoring(false);
    }
  };

  const finalizeApplication = async () => {
    if (!user || !selectedJob || !tailoredContent) return;
    const appsPath = `users/${user.uid}/applications`;
    try {
      await addDoc(collection(db, 'users', user.uid, 'applications'), {
        userId: user.uid,
        jobId: selectedJob.id,
        status: 'Applied',
        tailoredResume: tailoredContent.resume,
        coverLetter: tailoredContent.coverLetter,
        appliedAt: new Date().toISOString(),
      });
      alert('Operation Logged: Application tracking initialized.');
      setSelectedJob(null);
      setTailoredContent(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, appsPath);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-6 bg-white border-2 border-dark p-6 rounded-xl shadow-bento">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Active Search</h1>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Scanning global networks for matching opportunities.</p>
          </div>
          <button
            onClick={handleSearch}
            disabled={searching || !profile?.jobTitles?.length}
            className="flex items-center gap-2 rounded bg-dark px-6 py-2.5 text-xs font-black uppercase tracking-widest italic text-white transition-all shadow-bento-indigo active:translate-y-1"
          >
            {searching ? <RotateCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {searching ? 'Processing...' : 'Run Scraper Engine'}
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4 pt-4 border-t-2 border-slate-50 items-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Active Parameters:</span>
          <div className="flex gap-2">
            {profile?.jobTitles?.map(t => (
              <span key={t} className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded shadow-[1px_1px_0px_0px_white]">{t}</span>
            ))}
            {profile?.preferredLocations?.map(l => (
              <span key={l} className={cn(
                "px-3 py-1 text-[9px] font-black uppercase rounded border-2 border-dark shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]",
                l.toLowerCase().includes('remote') ? "bg-indigo-600 text-white" : "bg-white text-dark"
              )}>{l}</span>
            ))}
          </div>
          <button onClick={() => navigateTo('profile')} className="ml-auto text-[9px] font-black uppercase tracking-widest text-primary hover:underline italic underline-offset-2">Modify Search Target</button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Job Listings */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">
            <span>Discovered Opportunities</span>
            <span>{jobs.length} FOUND</span>
          </div>
          
          <div className="space-y-3">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => { setSelectedJob(job); setTailoredContent(null); }}
                  className={cn(
                    "w-full text-left rounded-xl border-2 p-5 transition-all",
                    selectedJob?.id === job.id 
                      ? "bg-dark border-dark text-white shadow-bento-indigo translate-x-1" 
                      : "bg-white border-dark text-dark shadow-bento hover:translate-x-1"
                  )}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-black italic uppercase tracking-tighter text-lg mb-1">{job.title}</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1 text-[9px] uppercase font-black tracking-widest opacity-80">
                          <Briefcase className="h-3 w-3" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] uppercase font-black tracking-widest opacity-80">
                          <MapPin className="h-3 w-3" />
                          {job.location}
                        </span>
                        {job.isRemote && (
                          <span className="px-2 py-0.5 bg-indigo-500 text-white text-[8px] font-black uppercase rounded">
                            Remote Only
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      "rounded border-2 px-2 py-1 text-[8px] font-black uppercase tracking-widest",
                      selectedJob?.id === job.id ? "border-slate-700 bg-slate-800" : "border-dark bg-slate-50"
                    )}>
                      {job.source}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-dark bg-white/50 p-12 text-center text-slate-400 grayscale">
                {searching ? (
                  <>
                    <Loader2 className="mb-4 h-12 w-12 animate-spin opacity-40 text-primary" />
                    <p className="font-black uppercase tracking-widest">Bypassing firewalls...</p>
                    <p className="text-[10px] mt-1 font-mono italic">Accessing grid nodes for matching datasets</p>
                  </>
                ) : (
                  <>
                    <Search className="mb-4 h-12 w-12 opacity-20" />
                    <p className="font-black uppercase tracking-widest">Engine Idle</p>
                    <p className="text-[10px] mt-1 font-mono">Scan for Remote or Tampa vacancies</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Automation Assistant */}
        <div className="lg:col-span-5 space-y-4 sticky top-8">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Automation Hub</div>
          
          <AnimatePresence mode="wait">
            {!selectedJob ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-dark bg-white/30 p-8 text-center"
              >
                <Sparkles className="mb-4 h-10 w-10 text-slate-300 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select target node to begin processing</p>
              </motion.div>
            ) : (
              <motion.div
                key={selectedJob.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bento-card p-6"
              >
                <div className="space-y-1 mb-6">
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">AI OPTIMIZER</h2>
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.1em]">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                    LOCK: {selectedJob.title}
                  </div>
                </div>

                {!tailoredContent ? (
                  <div className="space-y-6 flex flex-col">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Base Data Source</label>
                      <div className="grid gap-2">
                        {resumes.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => setSelectedResumeId(r.id!)}
                            className={cn(
                              "flex items-center justify-between rounded-lg border-2 p-3 font-black transition-all",
                              selectedResumeId === r.id 
                                ? "border-dark bg-indigo-50 text-dark shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]" 
                                : "border-slate-100 text-slate-400 hover:border-slate-300"
                            )}
                          >
                            <span className="text-[11px] uppercase italic">{r.jobType}</span>
                            {selectedResumeId === r.id && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleTailor}
                      disabled={!selectedResumeId || tailoring}
                      className="bento-button w-full flex items-center justify-center gap-3 py-4 text-base italic"
                    >
                      {tailoring ? <RotateCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                      {tailoring ? 'OPTIMIZING...' : 'INJECT & TAILOR'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="max-h-[400px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                      <div className="p-4 bg-slate-900 text-white rounded-lg border-2 border-dark font-mono text-[10px] leading-relaxed shadow-bento-indigo">
                        <h4 className="text-primary font-black uppercase tracking-widest mb-3 border-b border-slate-800 pb-2 flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          Tailored Resume Stream
                        </h4>
                        <ReactMarkdown>{tailoredContent.resume}</ReactMarkdown>
                      </div>
                      <div className="p-4 bg-white border-2 border-dark rounded-lg shadow-bento font-serif italic text-xs leading-relaxed text-dark grayscale opacity-80">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 grayscale-0">Synthesis output: Cover Letter</h4>
                        <ReactMarkdown>{tailoredContent.coverLetter}</ReactMarkdown>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => setTailoredContent(null)}
                        className="flex-1 rounded border-2 border-dark py-3 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors"
                      >
                        Reset
                      </button>
                      <button 
                        onClick={finalizeApplication}
                        className="bento-button flex-[2] flex items-center justify-center gap-2 py-3 text-[10px]"
                      >
                        <ArrowRight className="h-4 w-4" />
                        Log Application
                      </button>
                    </div>
                    
                    <a 
                      href={selectedJob.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-primary hover:underline italic"
                    >
                      OPEN EXTERNAL PORTAL <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
