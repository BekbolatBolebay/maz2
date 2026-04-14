'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getPII, subscribeToVPS } from '@/lib/vps'
import { Database } from '@/lib/supabase/types'
import { getFcmToken } from '@/lib/firebase'

type Profile = {
  id: string
  vps_id: string | null
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  is_anonymous: boolean
  role: 'admin' | 'manager' | 'staff' | 'user' | null
  updated_at: string | null
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  OBSOLETE_signInWithEmail: (email: string) => Promise<void>
  signInWithCustomOtp: (email: string, fullName?: string, phone?: string) => Promise<void>
  verifyCustomOtp: (email: string, code: string) => Promise<void>
  OBSOLETE_verifyEmailOtp: (email: string, token: string) => Promise<void>
  signInAnonymous: () => Promise<void>
  updateProfile: (data: { fullName: string, phone: string }) => Promise<void>
  signOut: () => Promise<void>
  subscribeToPush: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Real-time VPS Hydration
  useEffect(() => {
    if (!profile?.vps_id) return;
    
    const vpsId = profile.vps_id;
    console.log('[VPS] Subscribing to profile updates:', vpsId);
    
    const unsubscribe = subscribeToVPS('profiles', (e) => {
      if (e.action === 'update' && e.record.id === vpsId) {
        console.log('[VPS] Profile update received:', e.record);
        setProfile(prev => prev ? {
          ...prev,
          full_name: e.record.full_name,
          phone: e.record.phone
        } : null);
      }
    });
    
    return () => {
      console.log('[VPS] Unsubscribing from profile updates');
      unsubscribe();
    };
  }, [profile?.id, profile?.full_name, profile?.phone]);

  const fetchProfile = async (userId: string) => {
    const supabase = createClient()

    // Try clients table first (for app users)
    const { data: clientData, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', userId)
      .single()

    let mergedProfile: Profile | null = null

    if (!error && clientData) {
      mergedProfile = {
        id: clientData.id,
        vps_id: null,
        full_name: clientData.full_name || '',
        avatar_url: clientData.avatar_url,
        phone: clientData.phone || '',
        is_anonymous: clientData.is_anonymous || false,
        role: 'user',
        updated_at: clientData.updated_at
      }
    } else {
      // Fallback to staff_profiles table
      const { data: userData, error: userError } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!userError && userData) {
        mergedProfile = {
          id: userData.id,
          vps_id: null,
          full_name: userData.full_name || '',
          avatar_url: userData.avatar_url,
          phone: userData.phone || '',
          is_anonymous: (userData as any).is_anonymous || false,
          role: (userData.role as any) || 'user',
          updated_at: userData.updated_at
        }
      }
    }

    if (mergedProfile) {
      // Hydrate from VPS if Name/Phone is a PocketBase ID (15 chars, no spaces)
      const pbIdRegex = /^[a-z0-9]{15}$/;
      const potentialId = mergedProfile.full_name || mergedProfile.phone;

      if (potentialId && pbIdRegex.test(potentialId)) {
        mergedProfile.vps_id = potentialId;
        console.log(`[AuthContext] Hydrating PII for user ${userId} using VPS ID: ${potentialId}`);
        const pii = await getPII('profiles', potentialId)
        if (pii) {
          mergedProfile.full_name = pii.full_name
          mergedProfile.phone = pii.phone
        }
      }
      setProfile(mergedProfile)
      setLoading(false)
    } else {
      setProfile(null)
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    if (error) throw error
  }

  const OBSOLETE_signInWithEmail = async (email: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })
    if (error) throw error
  }

  const OBSOLETE_verifyEmailOtp = async (email: string, token: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    })
    if (error) throw error
    router.refresh()
  }

  const signInWithCustomOtp = async (email: string, fullName: string = '', phone: string = '') => {
    const { sendCustomOtp } = await import('./auth-actions')
    await sendCustomOtp(email, fullName, phone)
  }

  const verifyCustomOtp = async (email: string, code: string) => {
    const { verifyCustomOtp: verifyAction } = await import('./auth-actions')
    const { token_hash } = await verifyAction(email, code)

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email'
    })

    if (error) throw error
    router.refresh()
  }

  const signInAnonymous = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('Anonymous sign in error:', error)
      throw error
    }
    // For anonymous users, we might want to ensure a profile exists
    if (data.user) {
      await fetchProfile(data.user.id)
    }
  }

  const updateProfile = async (data: { fullName: string, phone: string }) => {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: data.fullName,
        phone: data.phone
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Қате орын алды')
    }

    if (user) {
      await fetchProfile(user.id)
    }
  }

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push messaging is not supported in this browser');
      const { toast } = await import('sonner');
      toast.error('Бұл браузер хабарламаларды қолдамайды');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        const { toast } = await import('sonner');
        toast.error('Хабарламаға рұқсат берілмеді');
        return;
      }

      console.log('[Push] Notification permission granted. Registering service workers...');

      // 1. Ensure service worker is registered and get registration object
      let registration: ServiceWorkerRegistration | undefined;
      
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      if (existingRegistrations.length > 0) {
        registration = existingRegistrations[0];
        console.log('[Push] Using existing registration');
      } else {
        console.log('[Push] No registration found, registering /sw.js...');
        try {
          registration = await navigator.serviceWorker.register('/sw.js');
          await new Promise(r => setTimeout(r, 1000));
        } catch (regError) {
          console.error('[Push] Registration failed:', regError);
        }
      }

      if (!registration) {
          // One last attempt
          registration = await navigator.serviceWorker.getRegistration('/');
      }

      if (!registration) throw new Error('Service Worker registration failed or not found');

      // 1. Web-Push Subscription (Native)
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });
      }
      console.log('[Push] Native subscription obtained');

      // 2. Firebase FCM Token
      let fcmToken = null;
      try {
        const { getFcmToken } = await import('@/lib/firebase');
        fcmToken = await getFcmToken();
        console.log('[Push] FCM Token obtained:', fcmToken ? 'Success' : 'Failed');
      } catch (fcmError) {
        console.error('[Push] FCM specific error:', fcmError);
      }

      // 3. Save to Database
      if (user) {
        const supabase = createClient();
        const subData = { 
          push_subscription: subscription as any,
          push_token: JSON.stringify(subscription),
          fcm_token: fcmToken,
          updated_at: new Date().toISOString()
        };

        console.log('[Push] Updating profile for user:', user.id);

        // Try clients first
        const { data: client, error: clientError } = await supabase
            .from('clients')
            .update(subData)
            .eq('id', user.id)
            .select()
            .single();

        if (clientError || !client) {
          // Fallback to staff_profiles
          console.log('[Push] User not in clients table, trying staff_profiles');
          const { error: staffError } = await supabase
              .from('staff_profiles')
              .update(subData)
              .eq('id', user.id);
          
          if (staffError) {
              console.error('[Push] DB Update Error (Staff):', staffError);
              throw new Error('Деректер базасын жаңарту мүмкін болмады');
          }
        }
      }

      const { toast } = await import('sonner');
      toast.success('Хабарламалар сәтті қосылды');
    } catch (error: any) {
      console.error('[Push] Overall subscription error:', error);
      const { toast } = await import('sonner');
      toast.error(error.message || 'Сәтсіз аяқталды');
    }
  }

  const signOut = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, signIn, signUp,
      OBSOLETE_signInWithEmail, signInWithCustomOtp, verifyCustomOtp, OBSOLETE_verifyEmailOtp, signInAnonymous, updateProfile, subscribeToPush, signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
