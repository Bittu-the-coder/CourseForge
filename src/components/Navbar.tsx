import {
  BookOpen,
  Calendar,
  Compass,
  Flame,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  Moon,
  PlusCircle,
  RotateCcw,
  Search,
  Settings as SettingsIcon,
  Sun,
  User as UserIcon,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { authService, type AuthUser } from '../services/supabase';
import type { GamificationState, UserSettings } from '../types';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  gamification: GamificationState;
  settings: UserSettings;
  onToggleDarkMode: () => void;
  onOpenSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  gamification,
  settings,
  onToggleDarkMode,
  onOpenSearch,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'magiclink'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    return authService.subscribe(setUser);
  }, []);

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError('');
    try {
      await authService.loginWithProvider(provider);
      setShowAuthModal(false);
    } catch (err: any) {
      setError(err.message || 'OAuth authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authService.loginWithEmail(emailInput);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Magic link delivery failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) return;
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      await authService.signInWithEmail(emailInput, passwordInput);
      setShowAuthModal(false);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) return;
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await authService.signUpWithEmail(emailInput, passwordInput, nameInput);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    onNavigate('dashboard');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
    { id: 'builder', label: 'Course Builder', icon: PlusCircle },
    { id: 'roadmap', label: 'Visual Roadmap', icon: Compass },
    { id: 'revision', label: 'Revision', icon: RotateCcw },
    { id: 'planner', label: 'Study Planner', icon: Calendar },
    { id: 'community', label: 'Community', icon: Users },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-16 bg-canvas border-b border-hairline px-4 lg:px-8 flex items-center justify-between transition-colors">

        {/* Left Side: Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => {
              onNavigate('dashboard');
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <img src="/logo.png" alt="CourseForge Logo" className="w-8 h-8 object-contain rounded-md" />
            <span className="font-semibold text-base tracking-tight text-ink font-sans flex items-center gap-1.5">
              CourseForge
              <span className="text-[9px] font-semibold font-mono tracking-wider px-1.5 py-0.5 rounded-sm bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                PRO
              </span>
            </span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-brand-orange font-semibold'
                      : 'text-ink-body hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Tools & Profile */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenSearch}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-hairline bg-canvas-card text-ink-muted text-xs font-mono hover:border-hairline-strong transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="px-1.5 py-0.5 rounded bg-canvas-soft border border-hairline text-[9px] font-semibold">⌘K</kbd>
          </button>

          <div className="flex items-center gap-1 border border-hairline bg-canvas-soft rounded-md p-0.5">
            <button
              onClick={onToggleDarkMode}
              className="p-1.5 rounded hover:bg-canvas-card text-ink-body hover:text-ink transition-colors"
              title="Toggle theme"
            >
              {settings.darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => onNavigate('settings')}
              className={`p-1.5 rounded transition-colors ${
                currentTab === 'settings'
                  ? 'text-brand-orange bg-brand-orange/10 font-semibold'
                  : 'text-ink-body hover:bg-canvas-card hover:text-ink'
              }`}
              title="Settings"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('profile')}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
                title="View Profile"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full border border-hairline object-cover"
                />
                <span className="hidden lg:inline text-xs text-ink font-semibold">{user.name}</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-1.5 text-ink-muted hover:text-brand-orange transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowAuthModal(true);
                setAuthMode('signin');
                setError('');
                setMessage('');
              }}
              className="px-3.5 py-1.5 rounded-md bg-brand-orange text-white text-xs font-semibold hover:bg-brand-orange-active transition-colors"
            >
              Sign In
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md border border-hairline text-ink-body hover:text-ink bg-canvas-soft hover:bg-canvas-card transition-colors"
            title="Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-30 bg-canvas/98 backdrop-blur-md border-b border-hairline flex flex-col p-6 space-y-6 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-4">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left py-2 border-b border-hairline-soft text-base font-semibold ${
                    isActive ? 'text-brand-orange' : 'text-ink-body hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 pt-4 border-t border-hairline">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-semibold font-mono">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{gamification.streakDays}d Streak</span>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-orange/10 text-brand-orange border border-brand-orange/20 text-xs font-semibold font-mono">
              <span>Lvl {gamification.level} • {gamification.xp} XP</span>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-canvas-card border border-hairline rounded-xl p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-ink-muted hover:text-ink"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <img src="/logo.png" alt="CourseForge Logo" className="w-12 h-12 object-contain mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-ink">
                {authMode === 'signin' && 'Sign In to CourseForge'}
                {authMode === 'signup' && 'Create Account'}
                {authMode === 'magiclink' && 'Sign In via Link'}
              </h3>
              <p className="text-xs text-ink-muted mt-1">Sync your roadmap, modules, notes, and study stats instantly.</p>
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-500 font-mono">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 font-mono">
                {message}
              </div>
            )}

            {/* OAuth Buttons */}
            {authMode === 'signin' && (
              <div className="space-y-2.5 mb-4">
                <button
                  onClick={() => handleOAuthLogin('google')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-2 px-4 rounded-md border border-hairline hover:bg-canvas-soft text-sm font-medium text-ink transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            )}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-hairline"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-canvas-card px-2 text-ink-muted">Or email credentials</span></div>
            </div>

            {/* Email Forms */}
            {authMode === 'magiclink' ? (
              <form onSubmit={handleMagicLinkLogin} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 rounded-md bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-active transition-colors flex items-center justify-center gap-1.5"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />} Send Magic Link
                </button>
                <div className="text-center pt-2">
                  <button type="button" onClick={() => setAuthMode('signin')} className="text-xs text-brand-orange hover:underline">
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={authMode === 'signin' ? handlePasswordSignIn : handlePasswordSignUp} className="space-y-3">
                {authMode === 'signup' && (
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink"
                  />
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2 text-sm bg-canvas border border-hairline rounded-md focus:outline-none focus:border-brand-orange text-ink"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 rounded-md bg-brand-orange text-white text-sm font-semibold hover:bg-brand-orange-active transition-colors flex items-center justify-center gap-1.5"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>

                <div className="flex justify-between pt-3 text-xs">
                  {authMode === 'signin' ? (
                    <>
                      <button type="button" onClick={() => setAuthMode('signup')} className="text-brand-orange hover:underline font-semibold">
                        Create Account
                      </button>
                      <button type="button" onClick={() => setAuthMode('magiclink')} className="text-ink-muted hover:text-ink">
                        Sign In with Link
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setAuthMode('signin')} className="text-brand-orange hover:underline font-semibold mx-auto">
                      Already have an account? Sign In
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
