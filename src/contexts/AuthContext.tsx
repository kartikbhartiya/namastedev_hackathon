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
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, name?: string, metadata?: Record<string, any>) => Promise<any>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserStats: (stats: Partial<UserProfile>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  demoSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>("INITIALIZING");

  const refreshProfile = async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        
        // Fetch profile
        let { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentSession.user.id)
          .maybeSingle();

        // Automatic fallback profile creation if user exists in auth but not in users table
        if (!profileData) {
          const newProfile: UserProfile = {
            id: currentSession.user.id,
            email: currentSession.user.email ?? null,
            name: currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name || currentSession.user.email?.split("@")[0] || "Student Scholar",
            photo_url: currentSession.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentSession.user.email}`,
            role: "user",
            study_streak: 1,
            xp: 10,
            course: "btech",
            earned_badge_ids: [],
            has_seen_onboarding: false
          };
          const { data: createdProfile, error } = await supabase.from("users").upsert(newProfile).select().maybeSingle();
          if (!error && createdProfile) {
            profileData = createdProfile;
          } else {
            profileData = newProfile;
          }
        }
        
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
    refreshProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, currentSession: any) => {
      if (currentSession) {
        setUser(currentSession.user);
        setSession(currentSession);
        let { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentSession.user.id)
          .maybeSingle();

        if (!profileData) {
          const newProfile: UserProfile = {
            id: currentSession.user.id,
            email: currentSession.user.email ?? null,
            name: currentSession.user.user_metadata?.full_name || currentSession.user.user_metadata?.name || currentSession.user.email?.split("@")[0] || "Student Scholar",
            photo_url: currentSession.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentSession.user.email}`,
            role: "user",
            study_streak: 1,
            xp: 10,
            course: "btech",
            earned_badge_ids: [],
            has_seen_onboarding: false
          };
          await supabase.from("users").upsert(newProfile);
          profileData = newProfile;
        }

        setProfile(profileData);
        setAuthState("AUTHENTICATED_READY");
      } else {
        setUser(null);
        setSession(null);
        setProfile(null);
        setAuthState("UNAUTHENTICATED");
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Successfully logged in!");
      await refreshProfile();
      return data;
    } catch (err: any) {
      toast.error(err.message || "Sign in failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (email: string, password: string, name?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      });
      if (error) throw error;
      
      if (data.user) {
        const profileInfo: UserProfile = {
          id: data.user.id,
          email: data.user.email ?? null,
          name: name || email.split("@")[0],
          photo_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${email}`,
          role: "user",
          study_streak: 1,
          xp: 10,
          course: "btech",
          earned_badge_ids: [],
          has_seen_onboarding: false
        };
        await supabase.from("users").upsert(profileInfo);
      }
      
      toast.success("Account created successfully!");
      await refreshProfile();
      return data;
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

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

  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });
      if (error) throw error;
      toast.success("Password reset instructions sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    }
  };

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

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
      throw err;
    }
  };

  const updateUserStats = async (stats: Partial<UserProfile>) => {
    await updateProfile(stats);
  };

  const demoSignIn = async () => {
    setLoading(true);
    setUser({ id: "demo-judge", email: "judge@orbit.com" });
    setSession({ user: { id: "demo-judge" } });
    setProfile({
      id: "demo-judge",
      email: "judge@orbit.com",
      name: "Hackathon Judge",
      photo_url: "https://api.dicebear.com/7.x/bottts/svg?seed=OrbitJudge",
      role: "user",
      study_streak: 8,
      xp: 1280,
      course: "btech",
      earned_badge_ids: ["quiz-master", "stack-tracer", "interview-pro"],
      has_seen_onboarding: true,
      total_uptime: 745,
      college_name: "AKTU University",
      branch: "Computer Science",
      year: "3rd Year"
    });
    setAuthState("AUTHENTICATED_READY");
    setLoading(false);
    toast.success("Demo Mode Activated!");
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
        signIn: handleSignIn,
        signUp: handleSignUp,
        logout: handleLogout,
        resetPassword: handleResetPassword,
        refreshProfile,
        updateUserStats,
        updateProfile,
        updatePassword,
        demoSignIn
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
