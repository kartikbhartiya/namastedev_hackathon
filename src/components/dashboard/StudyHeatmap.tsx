"use client";

import { useMemo } from "react";
import { Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyHeatmapProps {
  streak?: number;
}

export function StudyHeatmap({ streak = 5 }: StudyHeatmapProps) {
  // Generate 28 days (4 weeks x 7 days) of activity mock data with high activity on recent days
  const days = useMemo(() => {
    const result = [];
    const totalDays = 28;
    for (let i = 0; i < totalDays; i++) {
      // Simulate higher activity on recent days matching streak
      const isStreakDay = i >= totalDays - streak;
      const randomActivity = Math.floor(Math.random() * 4); // 0 = none, 1 = low, 2 = med, 3 = high
      const level = isStreakDay ? Math.max(1, randomActivity) : Math.random() > 0.4 ? randomActivity : 0;
      result.push({ day: i + 1, level });
    }
    return result;
  }, [streak]);

  const levelColors = [
    "bg-neutral-900 border-white/5", // 0: None
    "bg-orange-950/60 border-orange-500/20 text-orange-400", // 1: Low
    "bg-orange-600/40 border-orange-500/40 text-white", // 2: Med
    "bg-[#ff6c37] border-orange-400 shadow-[0_0_10px_rgba(255,108,55,0.4)] text-black", // 3: High
  ];

  return (
    <div className="p-6 rounded-xl bg-[#0b0b0b] border border-white/5 flex flex-col justify-between space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-[#ff6c37]" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
            Study Activity Heatmap
          </span>
        </div>
        <span className="text-[10px] font-bold text-[#ff6c37] bg-[#ff6c37]/10 px-2 py-0.5 rounded-full font-mono">
          {streak} DAY STREAK
        </span>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-7 gap-2 pt-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="text-[9px] font-bold text-neutral-600 text-center uppercase">
            {d}
          </span>
        ))}
        {days.map((item, idx) => (
          <div
            key={idx}
            title={`Day ${item.day}: Activity Level ${item.level}`}
            className={cn(
              "h-7 rounded-md border flex items-center justify-center text-[9px] font-bold transition-all hover:scale-110 cursor-pointer",
              levelColors[item.level]
            )}
          >
            {item.level > 0 && "•"}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-2 border-t border-white/5">
        <span>Less active</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-neutral-900 border border-white/5" />
          <div className="w-2.5 h-2.5 rounded-sm bg-orange-950/60 border border-orange-500/20" />
          <div className="w-2.5 h-2.5 rounded-sm bg-orange-600/40 border border-orange-500/40" />
          <div className="w-2.5 h-2.5 rounded-sm bg-[#ff6c37]" />
        </div>
        <span>More active</span>
      </div>
    </div>
  );
}
