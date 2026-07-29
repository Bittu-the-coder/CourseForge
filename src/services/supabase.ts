import { createClient, type SupabaseClient, type User, type Session } from '@supabase/supabase-js';

// Read from Astro env
const supabaseUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.PUBLIC_SUPABASE_URL) || '';
const supabaseAnonKey = (typeof import.meta !== 'undefined' && (import.meta as any).env?.PUBLIC_SUPABASE_ANON_KEY) || '';

// Singleton Supabase client
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase URL or anon key. Check .env');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return _supabase;
}

// ============================================================================
// Auth User type used in the app
// ============================================================================
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: 'google' | 'github' | 'email' | 'guest';
}

// Convert Supabase User to our AuthUser
function toAuthUser(user: User): AuthUser {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email || '',
    name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Learner',
    avatarUrl: meta.avatar_url || meta.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
    provider: (user.app_metadata?.provider as any) || 'email',
  };
}

// ============================================================================
// Auth Service
// ============================================================================
class SupabaseAuthService {
  private currentUser: AuthUser | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private async init() {
    if (this.initialized) return;
    this.initialized = true;

    try {
      const supabase = getSupabase();

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        this.currentUser = toAuthUser(session.user);
        this.notify();
      }

      // Listen for auth changes (login, logout, token refresh)
      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          this.currentUser = toAuthUser(session.user);
        } else {
          this.currentUser = null;
        }
        this.notify();
      });
    } catch (err) {
      console.warn('Supabase auth init failed:', err);
    }
  }

  public getUser(): AuthUser | null {
    return this.currentUser;
  }

  public subscribe(callback: (user: AuthUser | null) => void) {
    this.listeners.push(callback);
    // Immediately call with current state
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.currentUser));
  }

  // ---- Sign in with OAuth (Google / GitHub) ----
  public async loginWithProvider(provider: 'google' | 'github'): Promise<void> {
    const supabase = getSupabase();
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) throw error;
    // OAuth redirects — the onAuthStateChange listener handles the rest
  }

  // ---- Sign in with Email Magic Link ----
  public async loginWithEmail(email: string): Promise<{ message: string }> {
    const supabase = getSupabase();
    const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) throw error;
    return { message: `Magic link sent to ${email}. Check your inbox!` };
  }

  // ---- Sign up with Email + Password ----
  public async signUpWithEmail(email: string, password: string, name?: string): Promise<{ message: string }> {
    const supabase = getSupabase();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name || email.split('@')[0],
        },
      },
    });

    if (error) throw error;

    if (data.user && data.session) {
      // Auto-confirmed (development mode or if email confirmation is off)
      this.currentUser = toAuthUser(data.user);
      this.notify();
      return { message: 'Account created successfully!' };
    }

    return { message: `Confirmation email sent to ${email}. Please verify your account.` };
  }

  // ---- Sign in with Email + Password ----
  public async signInWithEmail(email: string, password: string): Promise<void> {
    const supabase = getSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      this.currentUser = toAuthUser(data.user);
      this.notify();
    }
  }

  // ---- Logout ----
  public async logout(): Promise<void> {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Logout error:', err);
    }
    this.currentUser = null;
    this.notify();
  }
}

export const authService = new SupabaseAuthService();
