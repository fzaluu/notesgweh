import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types'; 
import PencilLoader from '../../components/ui/PencilLoader'; // 👈 1. Impor komponen loader pensilnya

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Menyimpan id user yang profilnya sudah selesai dimuat / sedang dimuat,
  // supaya event auth berulang (INITIAL_SESSION, TOKEN_REFRESHED) tidak fetch ulang
  const loadedUserIdRef = useRef<string | null>(null);
  const inFlightUserIdRef = useRef<string | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error.message);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Satu pintu untuk semua perubahan sesi: session + profile selalu
    // di-set bersamaan sebelum `loading` dimatikan, sehingga route guard
    // tidak pernah melihat kondisi "ada session tapi profile belum ada".
    const applySession = async (newSession: Session | null) => {
      if (!mounted) return;

      if (!newSession?.user) {
        loadedUserIdRef.current = null;
        inFlightUserIdRef.current = null;
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const userId = newSession.user.id;

      // Token refresh / event ganda untuk user yang sama: cukup perbarui session
      if (loadedUserIdRef.current === userId) {
        setSession(newSession);
        setUser(newSession.user);
        setLoading(false);
        return;
      }

      // Profil user ini sedang dimuat oleh pemanggilan lain
      if (inFlightUserIdRef.current === userId) return;

      inFlightUserIdRef.current = userId;
      setLoading(true);
      setSession(newSession);
      setUser(newSession.user);

      await fetchProfile(userId);

      if (!mounted) return;
      loadedUserIdRef.current = userId;
      inFlightUserIdRef.current = null;
      setLoading(false);
    };

    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await applySession(session);
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Jangan `await` panggilan Supabase langsung di dalam callback ini
    // (bisa deadlock di supabase-js), jadi ditunda dengan setTimeout.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setTimeout(() => {
        applySession(newSession);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error signing out:', error.message);
    } catch (err) {
      console.error('Unexpected error signing out:', err);
    } finally {
      loadedUserIdRef.current = null;
      inFlightUserIdRef.current = null;
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0)', // Latar belakang transparan total
        backdropFilter: 'blur(6px)', // Efek blur kaca di belakang animasi pensil
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
      }}>
        <PencilLoader />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};