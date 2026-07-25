"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type AuthState =
  | "INITIALIZING"
  | "UNAUTHENTICATED"
  | "AUTHENTICATED_READY";

interface UserProfile {
  id: string;
  email: string | null;
  name: string;
  photo_url: string | null;
  role: string;
  study_streak: number;
  xp: number;
  course: string;
  earned_badge_ids: string[];
  has_seen_onboarding: boolean;
  total_uptime?: number;
  college_name?: string;
  branch?: string;
  year?: string;
}

export interface AuthContextType {
  user: any;
  session: any;
  profile: UserProfile | null;
  loading: boolean;
  authState: AuthState;
  isAdmin: boolean;
  isCollegeVerified: boolean;
  sendAuthOtp: (email: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserStats: (stats: Partial<UserProfile>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<any>;
  resendOtp: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>("INITIALIZING");

  // Helper to build a default profile from an auth user object
  const buildDefaultProfile = (authUser: any): UserProfile => ({
    id: authUser.id,
    email: authUser.email ?? null,
    name:
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      authUser.email?.split("@")[0] ||
      "Student Scholar",
    photo_url:
      authUser.user_metadata?.avatar_url ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${authUser.email}`,
    role: "user",
    study_streak: 1,
    xp: 10,
    course: "btech",
    earned_badge_ids: [],
    has_seen_onboarding: false,
  });

  // Fetch or create profile for a given auth user with safety timeout
  const fetchOrCreateProfile = async (authUser: any): Promise<UserProfile | null> => {
    const fallback = buildDefaultProfile(authUser);
    try {
      const queryPromise = supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: any }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 2000)
      );

      const { data: profileData } = await Promise.race([queryPromise, timeoutPromise]);

      if (profileData) {
        return profileData;
      }
      return fallback;
    } catch (e) {
      console.error("Error fetching/creating profile:", e);
      return fallback;
    }
  };

  const refreshProfile = async () => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);

        const profileData = await fetchOrCreateProfile(currentSession.user);
        setProfile(profileData);
        setAuthState("AUTHENTICATED_READY");
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
        setAuthState("UNAUTHENTICATED");
      }
    } catch (e) {
      console.error("Error refreshing profile:", e);
      setAuthState("UNAUTHENTICATED");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Safety fallback timer to prevent infinite loading spinners on slow/hanging networks
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    try {
      refreshProfile();
    } catch (err) {
      console.error("Failed to refresh profile:", err);
      setLoading(false);
    }

    let subscription: any = null;
    try {
      const res = supabase.auth.onAuthStateChange(async (event: string, currentSession: any) => {
        try {
          if (currentSession) {
            setUser(currentSession.user);
            setSession(currentSession);

            const profileData = await fetchOrCreateProfile(currentSession.user);
            setProfile(profileData);
            setAuthState("AUTHENTICATED_READY");
          } else {
            setUser(null);
            setSession(null);
            setProfile(null);
            setAuthState("UNAUTHENTICATED");
          }
        } catch (innerErr) {
          console.error("Error in onAuthStateChange handler:", innerErr);
        } finally {
          setLoading(false);
        }
      });
      subscription = res?.data?.subscription;
    } catch (err) {
      console.error("Error setting up auth state listener:", err);
      setLoading(false);
    }

    return () => {
      clearTimeout(safetyTimer);
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // ── Send Auth OTP ──────────────────────────────────────────────
  const handleSendAuthOtp = async (email: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });
      if (error) throw error;

      toast.success("Verification code sent! Check your email.");
      return data;
    } catch (err: any) {
      toast.error(err.message || "Failed to send code");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Verify Email OTP ────────────────────────────────────
  const handleVerifyOtp = async (email: string, token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error) throw error;
      toast.success("Email verified! Welcome to Orbit.");
      await refreshProfile();
      return data;
    } catch (err: any) {
      toast.error(err.message || "Invalid verification code");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────
  const handleResendOtp = async (email: string) => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      toast.success("A new verification code has been sent!");
    } catch (err: any) {
      toast.error(err.message || "Could not resend code. Try again later.");
    }
  };

  // ── Logout ──────────────────────────────────────────────
  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setAuthState("UNAUTHENTICATED");
      toast.success("Logged out successfully");
    } catch (err: any) {
      toast.error("Logout failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Update Profile ─────────────────────────────────────
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile && !user) return;
    const userId = profile?.id || user?.id;
    try {
      const updated = { ...profile, ...updates, id: userId };
      const { data, error } = await supabase.from("users").upsert(updated).select().single();
      if (error) throw error;
      setProfile(data || updated);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
      throw err;
    }
  };



  // ── Update Stats ───────────────────────────────────────
  const updateUserStats = async (stats: Partial<UserProfile>) => {
    await updateProfile(stats);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        authState,
        isAdmin: profile?.role === "admin" || profile?.role === "super_admin",
        isCollegeVerified: true,
        sendAuthOtp: handleSendAuthOtp,
        logout: handleLogout,
        refreshProfile,
        updateUserStats,
        updateProfile,
        verifyOtp: handleVerifyOtp,
        resendOtp: handleResendOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
