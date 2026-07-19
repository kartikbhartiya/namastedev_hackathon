"use client";

// Hybrid Supabase Mock / Client
// If environment variables are available, it initializes a real Supabase client.
// Otherwise, it falls back to a complete LocalStorage-based Mock client so the hackathon project runs zero-setup.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isRealSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("placeholder"));

// Create mock database helper for local storage
const getLocalStorageItem = (key: string, fallback: any) => {
  if (typeof window === "undefined") return fallback;
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : fallback;
};

const setLocalStorageItem = (key: string, value: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Initial mock database setup
const initMockDB = () => {
  const defaultUser = {
    id: "hackathon-judge-user-id",
    email: "judge@hackathon.com",
    name: "Hackathon Judge",
    photo_url: "https://api.dicebear.com/7.x/bottts/svg?seed=Judge",
    role: "user",
    study_streak: 5,
    xp: 240,
    course: "aktu",
    earned_badge_ids: ["quiz-master", "ai-explorer"],
    has_seen_onboarding: true,
    college_name: "Hackathon Institute of Technology",
    branch: "Computer Science",
    year: "3rd Year"
  };

  const defaultQuizzes = [
    {
      id: "q-phys-1",
      title: "Introduction to Classical Mechanics",
      description: "Test your understanding of Newton's laws of motion, projectile dynamics, and energy conservation.",
      difficulty: "medium",
      mode: "practice",
      timeLimitMinutes: 10,
      questions: [
        {
          id: "q1",
          question: "What is the acceleration of a projectile at its highest point?",
          options: [
            "A) Zero",
            "B) Equal to g (downwards)",
            "C) Equal to g (upwards)",
            "D) Dependent on initial velocity"
          ],
          correctIndex: 1,
          explanation: "At the peak, vertical velocity is zero, but gravity continues to pull the object down at acceleration g.",
          incorrectReasoning: [
            "Zero velocity does not mean zero acceleration; gravity is still active.",
            "Gravity never acts upwards.",
            "The rate of gravitational acceleration g is constant near Earth's surface regardless of velocity."
          ]
        },
        {
          id: "q2",
          question: "Which coordinate system is best for analyzing a simple pendulum?",
          options: [
            "A) Cartesian coordinates",
            "B) Polar coordinates",
            "C) Spherical coordinates",
            "D) Cylindrical coordinates"
          ],
          correctIndex: 1,
          explanation: "Polar coordinates (r, θ) are best since the distance r is fixed at length L, simplifying the equations of motion to one variable θ.",
          incorrectReasoning: [
            "Cartesian requires managing both x and y constraints, making math complex.",
            "Spherical is for 3D rotations; pendulums rotate in a 2D plane.",
            "Cylindrical is redundant for 2D circular motion."
          ]
        }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  const defaultSessions = [
    {
      id: "sess-1",
      title: "Physics Mechanics Discussion",
      mode: "Visual",
      updated_at: new Date().toISOString()
    }
  ];

  if (!getLocalStorageItem("db_users", null)) {
    setLocalStorageItem("db_users", [defaultUser]);
  }
  if (!getLocalStorageItem("db_quizzes", null)) {
    setLocalStorageItem("db_quizzes", defaultQuizzes);
  }
  if (!getLocalStorageItem("db_tutor_sessions", null)) {
    setLocalStorageItem("db_tutor_sessions", defaultSessions);
  }
  if (!getLocalStorageItem("db_quiz_attempts", null)) {
    setLocalStorageItem("db_quiz_attempts", []);
  }
};

if (typeof window !== "undefined") {
  initMockDB();
}

// Mock Supabase Client implementation
const createMockSupabase = () => {
  const auth = {
    getSession: async () => {
      const user = getLocalStorageItem("db_users", [])[0] || null;
      if (user) {
        return { data: { session: { user, access_token: "mock-token" } }, error: null };
      }
      return { data: { session: null }, error: null };
    },
    getUser: async () => {
      const user = getLocalStorageItem("db_users", [])[0] || null;
      return { data: { user }, error: null };
    },
    onAuthStateChange: (callback: any) => {
      const user = getLocalStorageItem("db_users", [])[0] || null;
      const session = user ? { user, access_token: "mock-token" } : null;
      setTimeout(() => callback("SIGNED_IN", session), 50);
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    signUp: async ({ email, password, options }: any) => {
      const newUser = {
        id: "user-" + Math.random().toString(36).substr(2, 9),
        email,
        name: options?.data?.name || "New Student",
        photo_url: "https://api.dicebear.com/7.x/bottts/svg?seed=" + email,
        role: "user",
        study_streak: 1,
        xp: 10,
        course: "aktu",
        earned_badge_ids: [],
        has_seen_onboarding: false
      };
      const users = getLocalStorageItem("db_users", []);
      users.push(newUser);
      setLocalStorageItem("db_users", users);
      return { data: { user: newUser, session: { user: newUser, access_token: "mock-token" } }, error: null };
    },
    signInWithPassword: async ({ email }: any) => {
      const users = getLocalStorageItem("db_users", []);
      let user = users.find((u: any) => u.email === email);
      if (!user) {
        user = {
          id: "user-" + Math.random().toString(36).substr(2, 9),
          email,
          name: email.split("@")[0],
          photo_url: "https://api.dicebear.com/7.x/bottts/svg?seed=" + email,
          role: "user",
          study_streak: 1,
          xp: 10,
          course: "aktu",
          earned_badge_ids: [],
          has_seen_onboarding: false
        };
        users.push(user);
        setLocalStorageItem("db_users", users);
      }
      return { data: { user, session: { user, access_token: "mock-token" } }, error: null };
    },
    signOut: async () => {
      return { error: null };
    }
  };

  const from = (table: string) => {
    let storageKey = `db_${table}`;
    const dataList = getLocalStorageItem(storageKey, []);

    const queryBuilder = {
      data: dataList,
      error: null as any,
      filters: [] as { field: string; val: any; type: string }[],
      ordering: null as { field: string; ascending: boolean } | null,
      limiting: null as number | null,

      select: function(fields?: string) {
        return this;
      },
      eq: function(field: string, val: any) {
        this.filters.push({ field, val, type: "eq" });
        return this;
      },
      single: function() {
        let filtered = this.executeFilters();
        return Promise.resolve({ data: filtered[0] || null, error: null });
      },
      order: function(field: string, { ascending = true } = {}) {
        this.ordering = { field, ascending };
        return this;
      },
      limit: function(limit: number) {
        this.limiting = limit;
        return this;
      },
      insert: function(values: any) {
        const item = Array.isArray(values) ? values : [values];
        const updatedList = [...this.data, ...item];
        setLocalStorageItem(storageKey, updatedList);
        return Promise.resolve({ data: item, error: null });
      },
      upsert: function(values: any) {
        const items = Array.isArray(values) ? values : [values];
        let currentList = [...this.data];
        for (const item of items) {
          const idx = currentList.findIndex((x: any) => x.id === item.id);
          if (idx !== -1) {
            currentList[idx] = { ...currentList[idx], ...item };
          } else {
            currentList.push(item);
          }
        }
        setLocalStorageItem(storageKey, currentList);
        return Promise.resolve({ data: items, error: null });
      },
      update: function(updates: any) {
        let currentList = [...this.data];
        let affected: any[] = [];
        this.filters.forEach(filter => {
          if (filter.type === "eq") {
            currentList = currentList.map((x: any) => {
              if (x[filter.field] === filter.val) {
                const updated = { ...x, ...updates };
                affected.push(updated);
                return updated;
              }
              return x;
            });
          }
        });
        setLocalStorageItem(storageKey, currentList);
        return {
          select: () => ({
            single: () => Promise.resolve({ data: affected[0] || null, error: null })
          })
        };
      },
      delete: function() {
        let currentList = [...this.data];
        this.filters.forEach(filter => {
          if (filter.type === "eq") {
            currentList = currentList.filter((x: any) => x[filter.field] !== filter.val);
          }
        });
        setLocalStorageItem(storageKey, currentList);
        return Promise.resolve({ data: null, error: null });
      },
      executeFilters: function() {
        let resultList = [...this.data];
        this.filters.forEach(filter => {
          if (filter.type === "eq") {
            resultList = resultList.filter((x: any) => x[filter.field] === filter.val);
          }
        });
        if (this.ordering) {
          const { field, ascending } = this.ordering;
          resultList.sort((a: any, b: any) => {
            if (a[field] < b[field]) return ascending ? -1 : 1;
            if (a[field] > b[field]) return ascending ? 1 : -1;
            return 0;
          });
        }
        if (this.limiting !== null) {
          resultList = resultList.slice(0, this.limiting);
        }
        return resultList;
      },
      then: function(onfulfilled: any) {
        const finalData = this.executeFilters();
        return Promise.resolve(onfulfilled({ data: finalData, error: null }));
      }
    };
    return queryBuilder;
  };

  const channel = () => {
    return {
      on: () => channel(),
      subscribe: () => {}
    };
  };

  const removeChannel = () => {};

  return {
    auth,
    from,
    channel,
    removeChannel
  };
};

export const supabase = isRealSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (createMockSupabase() as any);

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
      await supabase.from("tutor_profiles").upsert({ ...profile, id: userId, user_id: userId });
    }
  },
  aiSessions: {
    getAll: async (userId: string, limit = 50) => {
      const { data } = await supabase.from("ai_sessions").select("*").eq("user_id", userId).order("updated_at", { ascending: false }).limit(limit);
      return data || [];
    },
    create: async (userId: string, title = "New Chat", mode = "text") => {
      const { data } = await supabase.from("ai_sessions").insert({ user_id: userId, title, mode }).single();
      return data;
    },
    update: async (sessionId: string, updates: Record<string, any>) => {
      const { data } = await supabase.from("ai_sessions").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", sessionId).single();
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
      const { data } = await supabase.from("ai_messages").insert({ session_id: sessionId, role, content, metadata }).single();
      return data;
    },
    deleteBySession: async (sessionId: string) => {
      await supabase.from("ai_messages").delete().eq("session_id", sessionId);
    }
  }
};

