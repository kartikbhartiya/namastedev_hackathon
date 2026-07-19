"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";
import {
  Bot,
  Network,
  Code2,
  ShieldCheck,
  Swords,
  ShieldAlert,
  ArrowRight,
  Clock,
  Flame,
  Trophy,
  Award,
  Terminal,
  Activity,
  Cpu,
  ChevronRight,
  Zap,
  BookOpen,
  Sparkles
} from "lucide-react";

// Micro monochrome sparkline vector for clean trends
function MetricSparkline() {
  return (
    <svg className="w-12 h-6 text-neutral-600" viewBox="0 0 60 30" fill="none">
      <path
        d="M2 28 Q 15 24, 25 14 T 45 8 T 58 4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Quiet, elegant metric card
function MetricWidget({ label, value, trend, icon: Icon }: any) {
  return (
    <div className="w-[180px] p-[24px] rounded-xl bg-[#0b0b0b] border border-white/5 flex flex-col justify-between select-none">
      <div className="flex justify-between items-center text-[#707070] mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h4 className="text-[32px] font-bold text-white tracking-tight leading-none mb-2">
          {value}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-[#9B9B9B]">
          <span>{trend}</span>
          <MetricSparkline />
        </div>
      </div>
    </div>
  );
}

// Editorial Category Section Divider
function SectionHeader({ label, title, description }: { label: string; title: string; description: string }) {
  return (
    <div className="border-b border-white/5 pb-4 mb-6">
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#707070] block">
        {label}
      </span>
      <h3 className="text-[24px] font-semibold text-white tracking-tight mt-1">
        {title}
      </h3>
      <p className="text-[#9B9B9B] text-[13px] mt-1 font-normal">
        {description}
      </p>
    </div>
  );
}

// Handcrafted quiet item card
function EditorialCard({ item, onClick }: any) {
  const Icon = item.icon;
  return (
    <div
      onClick={onClick}
      className="p-[28px] rounded-xl bg-[#0b0b0b] border border-white/5 hover:bg-[#101010] hover:border-white/10 transition-colors duration-150 cursor-pointer flex flex-col justify-between h-[200px]"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <Icon className="h-5 w-5 text-[#707070]" />
          {item.badge && (
            <span className="text-[9px] font-bold tracking-widest text-[#ff6c37]">
              {item.badge}
            </span>
          )}
        </div>
        <h4 className="text-[15px] font-semibold text-white tracking-tight mb-2">
          {item.label}
        </h4>
        <p className="text-[13px] text-[#9B9B9B] leading-relaxed line-clamp-3">
          {item.description}
        </p>
      </div>
      <div className="flex items-center justify-between text-[11px] text-[#707070] font-medium border-t border-white/5 pt-3">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {item.estTime || "15 mins"}
        </span>
        <span>{item.difficulty || "medium"}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [latestSession, setLatestSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    setLogs([
      "INFERENCE: meta-llama/Llama-3.3-70B-Instruct active over Groq core.",
      "DATABASE: Connected to Supabase schemas.",
      "ENV CHECKS: Active session flags configured."
    ]);

    if (user?.id) {
      db.aiSessions.getAll(user.id, 1)
        .then((sessions) => {
          if (sessions && sessions.length > 0) {
            setLatestSession(sessions[0]);
          }
        })
        .catch((err) => console.error("Error loading latest session:", err))
        .finally(() => setSessionLoading(false));
    } else {
      setSessionLoading(false);
    }
  }, [user]);

  const learnModules = [
    { label: "AI Tutor", icon: Bot, href: "/ai-tutor", description: "Learn visual algorithm walkthroughs and tailored lessons.", estTime: "20 mins", difficulty: "beginner", badge: "ACTIVE" },
    { label: "Concept Graph", icon: Network, href: "/concept-graph", description: "Map out dynamic visual connections representing your study topics.", estTime: "15 mins", difficulty: "intermediate" },
    { label: "Debate Arena", icon: Swords, href: "/debate", description: "Challenge AI fallacies in timed logical argument modules.", estTime: "25 mins", difficulty: "advanced" },
  ];

  const practiceModules = [
    { label: "Code Tracer", icon: Code2, href: "/code", description: "Trace algorithm stack executions visually, showing memory steps.", estTime: "15 mins", difficulty: "intermediate" },
    { label: "DSA challenges", icon: Trophy, href: "/quizzes", description: "Complete data structure challenges mapped to your syllabus.", estTime: "30 mins", difficulty: "advanced" },
    { label: "Flashcards", icon: BookOpen, href: "/quizzes", description: "Recall key terms and formulas utilizing spacing logic.", estTime: "10 mins", difficulty: "beginner" },
  ];

  const assessmentModules = [
    { label: "AI Interview", icon: ShieldAlert, href: "/interview", description: "Timed mock behavioral and technical grading interviews.", estTime: "40 mins", difficulty: "advanced" },
    { label: "Exam Hall", icon: ShieldCheck, href: "/exam", description: "Simulate proctored examinations customized for logic check.", estTime: "60 mins", difficulty: "hard" },
    { label: "Mock Tests", icon: Zap, href: "/quizzes", description: "Take standard adaptive test wrappers built to assess speed.", estTime: "45 mins", difficulty: "hard", badge: "NEW" },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040404]">
        <div className="w-6 h-6 border-2 border-neutral-900 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const scholarName = profile?.name?.split(' ')[0] || user?.email?.split('@')[0] || "Scholar";
  const activeCourseLabel = profile?.course ? profile.course.toUpperCase() : "JEE";

  return (
    <div className="w-full max-w-5xl mx-auto space-y-24 py-16 vignette-bg select-none">
      
      {/* 1. HERO SPLIT SECTION - High contrast & catchy */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 items-stretch">
        
        {/* Left Editorial Text Column (2/3 width) */}
        <div className="md:col-span-2 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold tracking-widest text-[#ff6c37] bg-[#ff6c37]/10 px-2.5 py-1 rounded-md uppercase">
              ORBIT SYSTEM V3.0
            </span>
            <span className="text-[10px] font-medium tracking-wide text-neutral-500">
              Active Connection: meta-llama-3.3
            </span>
          </div>
          
          <h1 className="text-[38px] font-extrabold tracking-tight text-white leading-tight">
            An intelligent operating workspace for computer science.
          </h1>
          <p className="text-[14px] text-neutral-400 max-w-lg leading-relaxed">
            Orbit maps your syllabus, traces code executions in real-time, grades interactive mock exams, and tutors you with contextual feedback.
          </p>
        </div>

        {/* Right User Card Panel (1/3 width) - Eye-Catching Mini Box */}
        <div className="p-6 rounded-xl bg-[#0b0b0b] border border-white/5 flex flex-col justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-950 border border-white/10 flex items-center justify-center font-bold text-sm text-[#ff6c37] uppercase">
              {scholarName[0]}
            </div>
            <div>
              <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider block">Logged in as</span>
              <span className="text-white text-sm font-semibold block">{scholarName}</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-white/5 pt-4 text-xs text-neutral-400">
            <div className="flex justify-between">
              <span>Track Course:</span>
              <span className="text-white font-semibold uppercase">{activeCourseLabel}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Streak:</span>
              <span className="text-[#ff6c37] font-bold">{profile?.study_streak || 0} Days</span>
            </div>
          </div>
        </div>

      </section>

      {/* 2. TODAY'S FOCUS (Primary Action card) */}
      <section className="space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#707070] block">
          Today's Focus
        </span>
        
        {/* Large Continue learning card - Hooked to db */}
        <div className="p-[28px] rounded-xl bg-[#0b0b0b] border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-[#101010] transition-colors duration-150">
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#ff6c37]">
              {latestSession ? "Resume Active Session" : "Start Learning"}
            </span>
            <h3 className="text-[20px] font-semibold text-white tracking-tight">
              {latestSession ? latestSession.title : "Data Structures & Visual Pathfinding"}
            </h3>
            <div className="flex items-center gap-4 text-[13px] text-[#9B9B9B] font-medium">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" /> {latestSession ? "Session active" : "Syllabus ready"}
              </span>
              {latestSession && (
                <>
                  <span>•</span>
                  <span className="text-[#ff6c37] font-semibold uppercase tracking-wider text-[11px]">
                    Mode: {latestSession.mode}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push("/ai-tutor")}
            className="h-11 px-6 rounded-lg bg-[#ff6c37] hover:bg-[#ff8454] text-black font-semibold text-[14px] flex items-center gap-1.5 transition-colors duration-150 shrink-0"
          >
            {latestSession ? "Resume Learning" : "Launch AI Tutor"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* 3. QUICK ACTIONS HUB */}
      <section className="space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#707070] block">
          Quick Actions
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div
            onClick={() => router.push("/ai-tutor")}
            className="p-[28px] rounded-xl bg-[#0b0b0b] border border-white/5 hover:bg-[#101010] hover:border-white/10 transition-colors duration-150 cursor-pointer group flex justify-between items-center"
          >
            <div>
              <h4 className="text-[15px] font-semibold text-white">Resume Learning</h4>
              <p className="text-[12px] text-[#9B9B9B] mt-1">AI Tutor Coach</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#707070] group-hover:text-white transition-colors" />
          </div>

          <div
            onClick={() => router.push("/interview")}
            className="p-[28px] rounded-xl bg-[#0b0b0b] border border-white/5 hover:bg-[#101010] hover:border-white/10 transition-colors duration-150 cursor-pointer group flex justify-between items-center"
          >
            <div>
              <h4 className="text-[15px] font-semibold text-white">Start AI Interview</h4>
              <p className="text-[12px] text-[#9B9B9B] mt-1">Immersive Behavioral</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#707070] group-hover:text-white transition-colors" />
          </div>

          <div
            onClick={() => router.push("/quizzes")}
            className="p-[28px] rounded-xl bg-[#0b0b0b] border border-white/5 hover:bg-[#101010] hover:border-white/10 transition-colors duration-150 cursor-pointer group flex justify-between items-center"
          >
            <div>
              <h4 className="text-[15px] font-semibold text-white">Practice DSA</h4>
              <p className="text-[12px] text-[#9B9B9B] mt-1">Adaptive Quizzes</p>
            </div>
            <ChevronRight className="h-4 w-4 text-[#707070] group-hover:text-white transition-colors" />
          </div>

        </div>
      </section>

      {/* 4. PROGRESS OVERVIEW - Hooked to db */}
      <section className="space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#707070] block">
          Progress Overview
        </span>
        <div className="flex flex-wrap gap-6">
          <MetricWidget label="Streak" value={`${profile?.study_streak || 0} days`} trend="Active Streak" icon={Flame} />
          <MetricWidget label="Orbit XP" value={`${profile?.xp || 0}`} trend="Accumulated" icon={Trophy} />
          <MetricWidget label="Achievements" value={`${profile?.earned_badge_ids?.length || 0} unlocked`} trend="Milestones" icon={Award} />
          <MetricWidget label="Focus Time" value={`${((profile?.total_uptime || 0) / 60).toFixed(1)}h`} trend="Focus session" icon={Clock} />
        </div>
      </section>

      {/* 5. MODULAR SECTIONS */}
      <section className="space-y-24">
        
        {/* LEARN */}
        <div className="space-y-4">
          <SectionHeader label="LEARN" title="AI Study Suite" description="Interactive syllabus lessons, concept mind-maps, and logical debate wrappers." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {learnModules.map((item) => (
              <EditorialCard key={item.label} item={item} onClick={() => router.push(item.href)} />
            ))}
          </div>
        </div>

        {/* PRACTICE */}
        <div className="space-y-4">
          <SectionHeader label="PRACTICE" title="Active Skill Practice" description="Step trace execution stacks, algorithmic coding quizzes, and flashcard recall indexers." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {practiceModules.map((item) => (
              <EditorialCard key={item.label} item={item} onClick={() => router.push(item.href)} />
            ))}
          </div>
        </div>

        {/* ASSESS */}
        <div className="space-y-4">
          <SectionHeader label="ASSESS" title="Grading & Evaluation" description="Simulated behavior technical interviews, proctored mock exams, and speed test wrappers." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {assessmentModules.map((item) => (
              <EditorialCard key={item.label} item={item} onClick={() => router.push(item.href)} />
            ))}
          </div>
        </div>

      </section>

      {/* 6. TIMELINE ACTIVITY */}
      <section className="space-y-4">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#707070] block">
          Recent Activity Timeline
        </span>
        
        <div className="p-6 rounded-xl bg-[#0b0b0b] border border-white/5 space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-1.5 rounded-md bg-white/5 text-[#9B9B9B] mt-0.5 shrink-0">
              <Network className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[13px] font-semibold text-white block">Concept Graph Node Generated</span>
              <span className="text-[11px] text-[#707070]">2 hours ago • visualizer logic</span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-1.5 rounded-md bg-white/5 text-[#9B9B9B] mt-0.5 shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[13px] font-semibold text-white block">Behavioral Mock Interview Completed</span>
              <span className="text-[11px] text-[#707070]">Yesterday • grading engine</span>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-1.5 rounded-md bg-white/5 text-[#9B9B9B] mt-0.5 shrink-0">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[13px] font-semibold text-white block">Llama 3.3 Core Initialized</span>
              <span className="text-[11px] text-[#707070]">3 days ago • inference model</span>
            </div>
          </div>
        </div>

        {/* Collapsed Developer Console Logs */}
        <div className="border border-white/5 rounded-xl bg-[#0b0b0b]/30 overflow-hidden">
          <button
            onClick={() => setLogsExpanded(!logsExpanded)}
            className="w-full flex items-center justify-between px-6 py-4 text-[12px] font-mono text-[#707070] hover:text-[#9B9B9B] transition-colors focus:outline-none"
          >
            <span>CONSOLE TRACE LOGS</span>
            <span>{logsExpanded ? "[ collapse ]" : "[ expand ]"}</span>
          </button>
          
          {logsExpanded && (
            <div className="border-t border-white/5 p-6 bg-black/40 font-mono text-[12px] text-[#707070] space-y-2 select-none">
              {logs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span>{`>`}</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="text-center text-[12px] text-[#707070] pt-10 select-none">
        <p>© Orbit Study OS. Built for Hackathon Performance.</p>
      </footer>

    </div>
  );
}
