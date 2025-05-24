import logger from '@/utils/logger';

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string, userData?: { first_name?: string; last_name?: string }) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    error: Error | null;
    success: boolean;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Load any persisted session from localStorage on initial load
const getPersistedSession = (): { user: User | null, session: Session | null } => {
  try {
    const persistedSession = localStorage.getItem('supabase-session');
    if (persistedSession) {
      const { user, session } = JSON.parse(persistedSession);
      // Check if session is still valid (not expired)
      if (session && new Date(session.expires_at * 1000) > new Date()) {
        return { user, session };
      }
    }
  } catch (error) {
    logger.error('Error loading persisted session:', error);
  }
  return { user: null, session: null };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize with any persisted session data
  const persistedData = getPersistedSession();
  const [user, setUser] = useState<User | null>(persistedData.user);
  const [session, setSession] = useState<Session | null>(persistedData.session);
  const [isLoading, setIsLoading] = useState(!persistedData.user);
  const { toast } = useToast();

  useEffect(() => {
    // Check active session only if we don't have a persisted session
    if (!persistedData.user) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Persist session to localStorage
        if (session) {
          localStorage.setItem('supabase-session', JSON.stringify({
            user: session.user,
            session
          }));
        }
        
        setIsLoading(false);
      });
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Persist session to localStorage or remove if signed out
        if (session) {
          localStorage.setItem('supabase-session', JSON.stringify({
            user: session.user,
            session
          }));
        } else {
          localStorage.removeItem('supabase-session');
        }
        
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Memoize functions to prevent unnecessary re-renders
  const signUp = useCallback(async (email: string, password: string, userData?: { first_name?: string; last_name?: string }) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData ? {
            first_name: userData.first_name,
            last_name: userData.last_name
          } : undefined
        }
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: error.message,
        });
        return { error, success: false };
      }

      toast({
        title: "Verification email sent",
        description: "Please check your email to confirm your account",
      });
      
      return { error: null, success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: (error as Error).message,
      });
      return { error: error as Error, success: false };
    }
  }, [toast]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message,
        });
        return { error, success: false };
      }

      toast({
        title: "Signed in successfully",
        description: "Welcome back!",
      });
      
      return { error: null, success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: (error as Error).message,
      });
      return { error: error as Error, success: false };
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      // Clear persisted session
      localStorage.removeItem('supabase-session');
      toast({
        title: "Signed out successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: (error as Error).message,
      });
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Password reset failed",
          description: error.message,
        });
        return { error, success: false };
      }

      toast({
        title: "Password reset email sent",
        description: "Please check your email to reset your password",
      });
      
      return { error: null, success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Password reset failed",
        description: (error as Error).message,
      });
      return { error: error as Error, success: false };
    }
  }, [toast]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }), [user, session, isLoading, signUp, signIn, signOut, resetPassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 