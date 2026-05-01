import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { LogIn, LogOut, User } from 'lucide-react';
import { motion } from 'motion/react';

export default function Auth() {
  const [user, loading] = useAuthState(auth);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const logout = () => signOut(auth);

  if (loading) return <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />;

  if (user) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="h-10 w-10 rounded border-2 border-dark" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded border-2 border-dark bg-slate-100">
              <User className="h-5 w-5 text-dark" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Operator</span>
            <span className="text-xs font-black uppercase tracking-tighter truncate max-w-[120px]">{user.displayName}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 rounded border-2 border-dark bg-slate-50 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-dark transition-all hover:bg-red-50 hover:text-red-500 hover:-translate-y-0.5 active:translate-y-0 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
        >
          <LogOut className="h-3 w-3" />
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signIn}
      className="flex w-full items-center justify-center gap-3 bg-dark px-6 py-4 text-xs font-black uppercase tracking-widest italic text-white transition-all hover:bg-slate-800"
    >
      <LogIn className="h-5 w-5" />
      Initialize Interface
    </button>
  );
}
