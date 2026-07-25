"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Key, LogOut, Award, Save, RefreshCw, Check, Sparkles, BookOpen, GraduationCap, ArrowLeft } from "lucide-react";
import { EclixLogo } from "@/components/EclixLogo";

export default function ProfileSettingsPage() {
  const { user, profile, updateProfile, logout, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [course, setCourse] = useState("");
  const [avatarSeed, setAvatarSeed] = useState("");
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "badges">("details");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setCollegeName(profile.college_name || "");
      setBranch(profile.branch || "");
      setYear(profile.year || "");
      setCourse(profile.course || "btech");
      setAvatarSeed(profile.email || profile.name || "scholar");
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile({
        name,
        college_name: collegeName,
        branch,
        year,
        course,
        photo_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(avatarSeed)}`,
      });
    } finally {
      setSavingProfile(false);
    }
  };


  const handleLogout = async () => {
    await logout();
    router.push("/auth");
  };

  const AVAILABLE_BADGES = [
    { id: "quiz-master", name: "Quiz Master", desc: "Completed 5+ assessments with 80%+ score", icon: "🏆" },
    { id: "stack-tracer", name: "Algorithm Tracer", desc: "Executed 10+ code trace visualizer steps", icon: "⚡" },
    { id: "interview-pro", name: "Interview Ace", desc: "Completed an AI mock interview session", icon: "🎯" },
    { id: "daily-scholar", name: "Daily Scholar", desc: "Maintained a 7-day study streak", icon: "🔥" },
    { id: "concept-explorer", name: "Concept Explorer", desc: "Mapped 20+ nodes in Concept Graph", icon: "🌌" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-28 md:pt-32 px-4 sm:px-6 pb-20 select-none">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            title="Go to Previous Page"
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div
            onClick={() => router.push("/")}
            className="flex items-center gap-3 cursor-pointer group px-2 py-1 rounded-xl hover:bg-white/5 transition-all"
            title="Go to Dashboard"
          >
            <EclixLogo className="h-6 w-6 text-white transition-transform group-hover:scale-110" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary mb-0.5 block">
                Orbit Scholar Workspace
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Account & Profile Settings
              </h1>
            </div>
          </div>
        </div>

        {!user ? (
          <button
            onClick={() => router.push("/auth")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Sign In / Register
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold hover:bg-red-500/20 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        )}
      </div>

      {/* Hero Profile Overview Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-white/10 p-6 sm:p-8">
        <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar className="h-20 w-20 border-2 border-primary/40 shadow-xl shadow-primary/10">
            <AvatarImage
              src={profile?.photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`}
              className="object-cover"
            />
            <AvatarFallback className="bg-neutral-800 text-white font-bold text-xl">
              {profile?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                {profile?.name || "Student Scholar"}
              </h2>
              <span className="text-[10px] font-bold text-primary bg-primary/15 border border-primary/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {profile?.role || "student"}
              </span>
            </div>

            <p className="text-neutral-400 text-sm font-medium">
              {user?.email || "Not signed in"}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-neutral-300">
              {profile?.college_name && (
                <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" /> {profile.college_name}
                </span>
              )}
              {profile?.branch && (
                <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                  <BookOpen className="h-3.5 w-3.5 text-accent" /> {profile.branch} ({profile.year || "3rd Year"})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-xs text-neutral-400 block font-medium">Study Streak</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 block mt-0.5">
              🔥 {profile?.study_streak || 1} Days
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-xs text-neutral-400 block font-medium">Total XP</span>
            <span className="text-xl sm:text-2xl font-black text-primary block mt-0.5">
              ⚡ {profile?.xp || 10} XP
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-white/5 border border-white/5">
            <span className="text-xs text-neutral-400 block font-medium">Badges Unlocked</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-0.5">
              🎖️ {(profile?.earned_badge_ids || []).length} / {AVAILABLE_BADGES.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("details")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "details"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <User className="h-4 w-4" /> Personal Details
        </button>


        <button
          onClick={() => setActiveTab("badges")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "badges"
              ? "bg-primary text-white shadow-md shadow-primary/20"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Award className="h-4 w-4" /> Achievements
        </button>
      </div>

      {/* Tab 1: Personal Details */}
      {activeTab === "details" && (
        <form onSubmit={handleSaveProfile} className="space-y-6 bg-neutral-900/60 p-6 sm:p-8 rounded-2xl border border-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                className="w-full h-11 px-4 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">College / University</label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. AKTU University / IIT"
                className="w-full h-11 px-4 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">Branch / Major</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Computer Science & Engg"
                className="w-full h-11 px-4 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-neutral-300">Year of Study</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white focus:outline-none focus:border-primary"
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                <span>Avatar Seed (Dicebear Bottts)</span>
                <button
                  type="button"
                  onClick={() => setAvatarSeed(`bot-${Math.floor(Math.random() * 10000)}`)}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" /> Randomize
                </button>
              </label>
              <input
                type="text"
                value={avatarSeed}
                onChange={(e) => setAvatarSeed(e.target.value)}
                placeholder="Enter seed string for avatar"
                className="w-full h-11 px-4 rounded-xl bg-neutral-950 border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Profile Changes
            </button>
          </div>
        </form>
      )}



      {/* Tab 3: Badges */}
      {activeTab === "badges" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AVAILABLE_BADGES.map((b) => {
            const isUnlocked = (profile?.earned_badge_ids || []).includes(b.id);

            return (
              <div
                key={b.id}
                className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                  isUnlocked
                    ? "bg-neutral-900/80 border-primary/40 shadow-lg shadow-primary/5"
                    : "bg-neutral-950/40 border-white/5 opacity-60"
                }`}
              >
                <div className="text-3xl p-3 rounded-xl bg-white/5 border border-white/10 shrink-0">
                  {b.icon}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{b.name}</h4>
                    {isUnlocked ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <Check className="h-3 w-3" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-neutral-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

