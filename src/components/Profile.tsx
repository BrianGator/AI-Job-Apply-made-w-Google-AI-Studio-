import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';
import { Save, Plus, X, Globe, MapPin, Briefcase } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Profile() {
  const [user] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const docPath = `users/${user.uid}`;
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, docPath);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setSaving(true);
    const docPath = `users/${user.uid}`;
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, {
        ...profile,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    } finally {
      setSaving(false);
    }
  };

  const addTitle = () => {
    if (!newTitle.trim()) return;
    setProfile(p => p ? { ...p, jobTitles: [...(p.jobTitles || []), newTitle.trim()] } : null);
    setNewTitle('');
  };

  const removeTitle = (index: number) => {
    setProfile(p => p ? { ...p, jobTitles: (p.jobTitles || []).filter((_, i) => i !== index) } : null);
  };

  const addLocation = () => {
    if (!newLocation.trim()) return;
    setProfile(p => p ? { ...p, preferredLocations: [...(p.preferredLocations || []), newLocation.trim()] } : null);
    setNewLocation('');
  };

  const removeLocation = (index: number) => {
    setProfile(p => p ? { ...p, preferredLocations: (p.preferredLocations || []).filter((_, i) => i !== index) } : null);
  };

  if (loading) return <div className="h-64 flex items-center justify-center italic text-zinc-400">Loading profile data...</div>;

  return (
    <div className="max-w-3xl space-y-8">
      <header className="flex items-center justify-between bg-white border-2 border-dark p-6 rounded-xl shadow-bento">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Configuration</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Target parameters for the automation engine.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bento-button flex items-center gap-2"
        >
          {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
          {saving ? 'Syncing...' : 'Save Config'}
        </button>
      </header>

      <div className="grid gap-6">
        {/* Basic Info */}
        <div className="bento-card p-6">
          <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Basic Information</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500">Full Name</label>
              <input
                type="text"
                value={profile?.fullName || ''}
                onChange={e => setProfile(p => p ? { ...p, fullName: e.target.value } : null)}
                className="w-full rounded-lg border-2 border-dark bg-slate-50 px-4 py-2.5 font-bold outline-none transition-all focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500">Professional Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                onChange={e => setProfile(p => p ? { ...p, email: e.target.value } : null)}
                className="w-full rounded-lg border-2 border-dark bg-slate-50 px-4 py-2.5 font-bold outline-none transition-all focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Job Titles */}
        <div className="bento-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Job Titles</h3>
            <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase">{profile?.jobTitles?.length || 0} SECTORS ENABLED</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {profile?.jobTitles?.map((title, i) => (
              <span key={i} className="flex items-center gap-2 rounded border-2 border-dark bg-slate-900 text-white px-3 py-1.5 text-[10px] font-black uppercase italic tracking-wider shadow-[2px_2px_0px_0px_rgba(79,70,229,1)]">
                <Briefcase className="h-3 w-3" />
                {title}
                <button onClick={() => removeTitle(i)} className="ml-1 hover:text-red-400"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Senior Software Engineer"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTitle()}
              className="flex-1 rounded-lg border-2 border-dark bg-slate-50 px-4 py-2 text-sm font-bold outline-none"
            />
            <button onClick={addTitle} className="rounded border-2 border-dark bg-dark p-2 text-white hover:bg-slate-800 transition-colors">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Locations */}
        <div className="bento-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Target Locations</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {profile?.preferredLocations?.map((loc, i) => (
              <span key={i} className={cn(
                "flex items-center gap-2 rounded border-2 border-dark px-3 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]",
                loc.toLowerCase().includes('remote') ? "bg-indigo-600 text-white border-dark" : "bg-white text-dark border-dark"
              )}>
                {loc.toLowerCase().includes('remote') ? <Globe className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                {loc}
                <button onClick={() => removeLocation(i)} className="ml-1 hover:text-red-500"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Tampa, FL"
              value={newLocation}
              onChange={e => setNewLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addLocation()}
              className="flex-1 rounded-lg border-2 border-dark bg-slate-50 px-4 py-2 text-sm font-bold outline-none"
            />
            <button onClick={addLocation} className="rounded border-2 border-dark bg-slate-100 p-2 text-dark hover:bg-slate-200 transition-colors">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
