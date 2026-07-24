"use client";

// Real Supabase Client
// Connected securely to the existing Eclix Database

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Please check your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const db = {
  users: {
    get: async (id: string) => {
      const { data } = await supabase.from("users").select("*").eq("id", id).single();
      return data;
    },
    update: async (id: string, updates: any) => {
      const { data } = await supabase.from("users").update(updates).eq("id", id).select().single();
      return data;
    }
  },
  tutorProfiles: {
    get: async (userId: string) => {
      const { data } = await supabase.from("tutor_profiles").select("*").eq("user_id", userId).single();
      return data;
    },
    upsert: async (userId: string, profile: any) => {
      const { data } = await supabase.from("tutor_profiles").upsert({ ...profile, id: userId, user_id: userId }).select().single();
      return data;
    }
  },
  aiSessions: {
    getAll: async (userId: string, limit = 50) => {
      const { data } = await supabase.from("ai_sessions").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(limit);
      return data || [];
    },
    create: async (userId: string, title = "New Chat", mode = "text") => {
      const { data } = await supabase.from("ai_sessions").insert({ user_id: userId, title, mode }).select().single();
      return data;
    },
    update: async (sessionId: string, updates: Record<string, any>) => {
      const { data } = await supabase.from("ai_sessions").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", sessionId).select().single();
      return data;
    },
    delete: async (sessionId: string) => {
      await supabase.from("ai_sessions").delete().eq("id", sessionId);
    }
  },
  aiMessages: {
    getBySession: async (sessionId: string) => {
      const { data } = await supabase.from("ai_messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true });
      return data || [];
    },
    send: async (sessionId: string, role: 'user' | 'assistant' | 'system', content: string, metadata: Record<string, any> = {}) => {
      const { data } = await supabase.from("ai_messages").insert({ session_id: sessionId, role, content, metadata }).select().single();
      return data;
    },
    deleteBySession: async (sessionId: string) => {
      await supabase.from("ai_messages").delete().eq("session_id", sessionId);
    }
  },
  interviews: {
    create: async (userId: string, roleTarget: string, seniority: string) => {
      const { data } = await supabase.from("interviews").insert({ user_id: userId, role_target: roleTarget, seniority }).select().single();
      return data;
    },
    saveEvaluation: async (interviewId: string, score: number, feedbackJson: any, transcript: any) => {
      const { data } = await supabase.from("interviews").update({ score, feedback_json: feedbackJson, transcript, completed_at: new Date().toISOString() }).eq("id", interviewId).select().single();
      return data;
    },
    getByUser: async (userId: string, limit = 20) => {
      const { data } = await supabase.from("interviews").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
      return data || [];
    }
  }
};
