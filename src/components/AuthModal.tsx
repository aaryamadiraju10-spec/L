import React, { useState } from 'react';
import { User, Lock, School, BookOpen, GraduationCap, X, Check, Database, Sparkles, Shield, AlertCircle, LogOut, Trophy, Flame, Award } from 'lucide-react';
import { UserAccount } from '../types';
import { getGamificationProfile } from '../utils/gamification';
import {
  auth,
  googleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  usernameToEmail,
  firestore,
} from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLoginSuccess: (user: UserAccount) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('Westwood Academy');
  const [grade, setGrade] = useState('Grade 11 (AP Calculus)');
  const [textbook, setTextbook] = useState('Stewart Calculus 9e');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Google Sign In via Firebase
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;

      const userAccount: UserAccount = {
        id: fbUser.uid,
        username: fbUser.email?.split('@')[0] || 'student',
        email: fbUser.email || undefined,
        fullName: fbUser.displayName || undefined,
        school: school || 'Standard Board',
        grade: grade || 'Grade 11',
        textbook: textbook || 'Standard Textbook',
      };

      // Store / sync to Firestore
      try {
        await setDoc(
          doc(firestore, 'users', fbUser.uid),
          {
            uid: fbUser.uid,
            email: fbUser.email || '',
            username: userAccount.username,
            fullName: userAccount.fullName || '',
            school: userAccount.school,
            grade: userAccount.grade,
            textbook: userAccount.textbook,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn('Firestore doc write warning:', fsErr);
      }

      // Sync with local backend SQLite
      try {
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: userAccount.username,
            password: 'firebase-google-auth-session',
            fullName: userAccount.fullName,
            school: userAccount.school,
            grade: userAccount.grade,
            textbook: userAccount.textbook,
          }),
        });
      } catch (e) {
        // Backend SQLite fallback
      }

      onLoginSuccess(userAccount);
      setSuccessMsg(`Signed in as ${fbUser.displayName || fbUser.email}!`);
      setTimeout(() => onClose(), 800);
    } catch (err: any) {
      console.error('Google Sign-in error:', err);
      setError(err.message || 'Google Sign-in was cancelled or failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Username and Password Sign In / Sign Up
  // Usernames are saved as an email in Firebase: usernameToEmail(username)
  const handleUsernamePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    const firebaseEmail = usernameToEmail(username);

    try {
      let fbUser: any = null;
      if (tab === 'register') {
        try {
          const cred = await createUserWithEmailAndPassword(auth, firebaseEmail, password);
          fbUser = cred.user;
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/email-already-in-use') {
            // If already exists, try signing in
            const cred = await signInWithEmailAndPassword(auth, firebaseEmail, password);
            fbUser = cred.user;
          } else {
            throw fbErr;
          }
        }
      } else {
        const cred = await signInWithEmailAndPassword(auth, firebaseEmail, password);
        fbUser = cred.user;
      }

      const userAccount: UserAccount = {
        id: fbUser?.uid || 'user_' + Date.now(),
        username: username.trim().toLowerCase(),
        email: firebaseEmail,
        fullName: fullName || username,
        school,
        grade,
        textbook,
      };

      // Save to Firestore
      try {
        await setDoc(
          doc(firestore, 'users', userAccount.id),
          {
            uid: userAccount.id,
            email: firebaseEmail,
            username: userAccount.username,
            fullName: userAccount.fullName,
            school: userAccount.school,
            grade: userAccount.grade,
            textbook: userAccount.textbook,
            createdAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn('Firestore doc write warning:', fsErr);
      }

      // Also persist to SQLite backend
      try {
        const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';
        const payload =
          tab === 'login'
            ? { username: userAccount.username, password }
            : { username: userAccount.username, password, fullName, school, grade, textbook };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (data.user) {
          userAccount.id = data.user.id || userAccount.id;
        }
      } catch (sqlErr) {
        // Safe fallback
      }

      onLoginSuccess(userAccount);
      setSuccessMsg(
        tab === 'login'
          ? `Welcome back, ${userAccount.username}!`
          : `Account created! Username saved as ${firebaseEmail} in Firebase.`
      );
      setTimeout(() => onClose(), 900);
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Incorrect password for this username. Please verify and try again.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      // Ignore
    }
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Student Account & Cloud Sync</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Firebase Auth • SQL Persistent Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {currentUser ? (
          /* User Profile View */
          <div className="py-5 space-y-4 text-xs">
            {/* Gamification Level, XP & Badges */}
            {(() => {
              const gamification = getGamificationProfile();
              const unlockedBadges = gamification.badges.filter((b) => b.unlocked);
              return (
                <div className="rounded-xl border border-amber-200/80 bg-gradient-to-r from-amber-50/70 to-orange-50/50 p-3.5 dark:border-amber-900/50 dark:from-zinc-900 dark:to-amber-950/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white font-black text-xs shadow-sm shadow-amber-500/30">
                        L{gamification.level}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                          Level {gamification.level}: {gamification.levelTitle}
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-400">
                          {gamification.totalXp} XP • {unlockedBadges.length}/{gamification.badges.length} Badges Unlocked
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      <Flame className="h-3 w-3 text-amber-500" />
                      <span>{gamification.streakDays}d Streak</span>
                    </div>
                  </div>

                  {/* Badges showcase pills */}
                  <div className="mt-3 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                    <div className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 flex justify-between">
                      <span>Digital Achievements</span>
                      <span className="text-amber-700 dark:text-amber-400 font-mono">Next: Level {gamification.level + 1} ({gamification.nextLevelXp} XP)</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {gamification.badges.map((b) => (
                        <span
                          key={b.id}
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium border ${
                            b.unlocked
                              ? 'border-amber-200 bg-white text-amber-900 shadow-xs dark:border-amber-900/60 dark:bg-zinc-900 dark:text-amber-200 font-semibold'
                              : 'border-zinc-200/60 bg-zinc-100/60 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/40'
                          }`}
                          title={b.unlocked ? `${b.title} (Unlocked): ${b.description}` : `Locked: ${b.description} (${b.progress}/${b.maxProgress} ${b.unit})`}
                        >
                          {b.unlocked ? '🏆' : '🔒'} {b.title}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-sm">
                  {currentUser.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    {currentUser.fullName || currentUser.username}
                  </div>
                  <div className="text-zinc-500 dark:text-zinc-400">
                    @{currentUser.username} • {currentUser.email || 'Firebase Cloud Synced'}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-blue-200/50 dark:border-blue-900/50 text-[11px]">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">School / Board:</span>
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">{currentUser.school || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400">Grade Level:</span>
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">{currentUser.grade || 'N/A'}</div>
                </div>
                <div className="col-span-2 mt-1">
                  <span className="text-zinc-500 dark:text-zinc-400">Curriculum Textbook:</span>
                  <div className="font-semibold text-zinc-800 dark:text-zinc-200">{currentUser.textbook || 'Standard'}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="h-3.5 w-3.5" />
                <span>AI Tools Unlocked: Curriculum OCR, Mini-Exams & AI Math Tutor</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSignOut}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-200 py-2.5 font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Login / Register Forms with Google & Username/Password */
          <div className="py-4 space-y-4">
            {/* Google Sign In Button */}
            <button
              id="btn-google-signin"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white py-2.5 px-4 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              <span className="absolute bg-white px-2 text-[10px] font-medium uppercase text-zinc-400 dark:bg-zinc-900">
                Or with Username &amp; Password
              </span>
            </div>

            {/* Tab switch */}
            <div className="grid grid-cols-2 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
              <button
                onClick={() => setTab('login')}
                className={`rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setTab('register')}
                className={`rounded-lg py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  tab === 'register'
                    ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Register
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Check className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleUsernamePasswordSubmit} className="space-y-3">
              {tab === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Student Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Henderson"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Username
                  </label>
                  <span className="text-[10px] text-zinc-400">Saved as email in Firebase</span>
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alex123 or student@school.edu"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 py-2 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-9 pr-3 py-2 text-xs text-zinc-900 outline-none focus:border-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
              </div>

              {tab === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        School / Board
                      </label>
                      <input
                        type="text"
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                        Grade Level
                      </label>
                      <input
                        type="text"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Curriculum Textbook
                    </label>
                    <input
                      type="text"
                      value={textbook}
                      onChange={(e) => setTextbook(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all cursor-pointer mt-2"
              >
                {isLoading
                  ? 'Authenticating...'
                  : tab === 'login'
                  ? 'Sign In'
                  : 'Register Account'}
              </button>
            </form>

            {/* Guest / No Login Option */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <button
                onClick={onClose}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Continue as Guest • <span className="underline">Calculator only (No login required)</span>
              </button>
              <p className="text-[10px] text-zinc-400 mt-1">
                Note: Without logging in, AI tools (Curriculum OCR, Mini-Exams, AI Tutor) will be locked.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
