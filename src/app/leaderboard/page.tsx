"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Flame, Award, ArrowLeft, Sparkles, Medal, User, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { EclixLogo } from "@/components/EclixLogo";

interface LeaderboardEntry {
  id: string;
  name: string;
  course: string;
  xp: number;
  streak: number;
  badgesCount: number;
  rank: number;
  isCurrentUser?: boolean;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: "1", name: "Alex Rivera", course: "B.Tech CSE", xp: 2850, streak: 14, badgesCount: 6, rank: 1 },
  { id: "2", name: "Priya Sharma", course: "B.Tech AI & ML", xp: 2420, streak: 11, badgesCount: 5, rank: 2 },
  { id: "3", name: "Marcus Chen", course: "B.Tech Software Eng", xp: 2180, streak: 9, badgesCount: 4, rank: 3 },
  { id: "4", name: "Rohan Verma", course: "B.Tech CSE", xp: 1950, streak: 7, badgesCount: 4, rank: 4 },
  { id: "5", name: "Sofia Patel", course: "B.Tech IT", xp: 1720, streak: 6, badgesCount: 3, rank: 5 },
  { id: "6", name: "Daniel Kim", course: "B.Tech ECE", xp: 1540, streak: 5, badgesCount: 3, rank: 6 },
  { id: "7", name: "Ananya Gupta", course: "B.Tech Data Science", xp: 1390, streak: 4, badgesCount: 2, rank: 7 },
  { id: "8", name: "Vikram Singh", course: "B.Tech CSE", xp: 1210, streak: 3, badgesCount: 2, rank: 8 },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [board, setBoard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, course, xp, study_streak, earned_badge_ids")
          .order("xp", { ascending: false })
          .limit(20);

        if (!error && data && data.length > 0) {
          const formatted: LeaderboardEntry[] = data.map((item: any, idx: number) => ({
            id: item.id,
            name: item.name || "Anonymous Scholar",
            course: (item.course || "BTECH").toUpperCase(),
            xp: item.xp || 0,
            streak: item.study_streak || 0,
            badgesCount: item.earned_badge_ids?.length || 0,
            rank: idx + 1,
            isCurrentUser: item.id === user?.id,
          }));
          setBoard(formatted);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [user?.id]);

  const top3 = board.slice(0, 3);
  const rest = board.slice(3);

  return (
    <div className="min-h-screen bg-[#040404] text-white flex flex-col select-none pt-24 pb-16 vignette-bg">
      {/* Header Bar */}
      <header className="border-b border-white/10 bg-[#090909]/80 py-4 fixed top-0 inset-x-0 z-40 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              title="Go to Previous Page"
              className="text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {/* Clickable Logo & Brand -> Dashboard */}
            <div
              onClick={() => router.push("/")}
              className="flex items-center gap-2.5 cursor-pointer group px-2 py-1 rounded-xl hover:bg-white/5 transition-all"
              title="Go to Dashboard"
            >
              <EclixLogo className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
              <div>
                <h1 className="text-base md:text-lg font-extrabold flex items-center gap-2 tracking-tight text-white">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Global CS Cohort Leaderboard
                </h1>
                <p className="text-[10px] md:text-xs text-neutral-400">
                  Top Computer Science Scholars Ranked by Orbit XP & Study Streaks
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 max-w-4xl space-y-8 mt-6">
        {/* Podium Section (Top 3) */}
        <div className="grid grid-cols-3 gap-3 md:gap-6 items-end pt-6">
          {/* 2nd Place */}
          {top3[1] && (
            <div className="flex flex-col items-center gap-3 p-4 md:p-6 rounded-2xl bg-neutral-900/60 border border-slate-500/30 text-center relative overflow-hidden order-1 sm:order-none">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-400/10 border-2 border-slate-400 flex items-center justify-center text-slate-300 font-bold text-lg md:text-xl shadow-lg">
                2
              </div>
              <div>
                <h3 className="font-bold text-xs md:text-sm text-white truncate max-w-[100px] sm:max-w-none">{top3[1].name}</h3>
                <span className="text-[10px] text-neutral-400 block">{top3[1].course}</span>
                <span className="text-xs font-black text-amber-400 mt-1 block">{top3[1].xp} XP</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <div className="flex flex-col items-center gap-3 p-5 md:p-8 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 text-center relative overflow-hidden order-0 sm:order-none -translate-y-2 shadow-2xl shadow-amber-500/20">
              <div className="absolute top-2 right-2 text-amber-400">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 font-black text-2xl md:text-3xl shadow-xl">
                👑
              </div>
              <div>
                <h3 className="font-extrabold text-sm md:text-base text-white truncate max-w-[120px] sm:max-w-none">{top3[0].name}</h3>
                <span className="text-[10px] text-amber-300/70 block uppercase tracking-wider font-semibold">{top3[0].course}</span>
                <span className="text-sm md:text-lg font-black text-amber-400 mt-1 block">{top3[0].xp} XP</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <div className="flex flex-col items-center gap-3 p-4 md:p-6 rounded-2xl bg-neutral-900/60 border border-amber-700/30 text-center relative overflow-hidden order-2 sm:order-none">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-amber-700/10 border-2 border-amber-700 flex items-center justify-center text-amber-600 font-bold text-lg md:text-xl shadow-lg">
                3
              </div>
              <div>
                <h3 className="font-bold text-xs md:text-sm text-white truncate max-w-[100px] sm:max-w-none">{top3[2].name}</h3>
                <span className="text-[10px] text-neutral-400 block">{top3[2].course}</span>
                <span className="text-xs font-black text-amber-400 mt-1 block">{top3[2].xp} XP</span>
              </div>
            </div>
          )}
        </div>

        {/* Full Leaderboard Table */}
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Scholar Standings</span>
            <span className="text-[10px] text-neutral-500 font-mono">Updated in Real-Time</span>
          </div>

          <div className="divide-y divide-white/5">
            {board.map((student) => (
              <div
                key={student.id}
                className={cn(
                  "px-6 py-4 flex items-center justify-between gap-4 transition-colors",
                  student.isCurrentUser ? "bg-amber-500/10 border-l-4 border-amber-400 font-semibold" : "hover:bg-white/[0.02]"
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0",
                    student.rank === 1 ? "bg-amber-500 text-black" :
                    student.rank === 2 ? "bg-slate-300 text-black" :
                    student.rank === 3 ? "bg-amber-700 text-white" :
                    "bg-white/5 text-neutral-400"
                  )}>
                    #{student.rank}
                  </span>

                  <div className="min-w-0">
                    <span className="text-sm font-bold text-white block truncate">
                      {student.name} {student.isCurrentUser && <span className="text-[10px] text-amber-400 font-normal ml-1">(YOU)</span>}
                    </span>
                    <span className="text-[11px] text-neutral-500 uppercase tracking-wider block">{student.course}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs shrink-0">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{student.streak}d</span>
                  </div>

                  <div className="flex items-center gap-1 text-neutral-400">
                    <Award className="w-3.5 h-3.5" />
                    <span>{student.badgesCount}</span>
                  </div>

                  <div className="text-right min-w-[70px]">
                    <span className="font-extrabold text-white text-sm block">{student.xp}</span>
                    <span className="text-[9px] text-neutral-500 uppercase font-mono">ORBIT XP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
