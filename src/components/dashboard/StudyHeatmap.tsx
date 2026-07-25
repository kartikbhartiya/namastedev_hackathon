"use client";

import { useMemo } from "react";
import { Flame, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyHeatmapProps {
  streak?: number;
  activityLevels?: number[]; // Array of 364 activity levels (0-3) for the last 364 days
}

export function StudyHeatmap({ streak = 0, activityLevels }: StudyHeatmapProps) {
  // Use real data if provided, otherwise fallback to empty/mock data
  const days = useMemo(() => {
    if (activityLevels && activityLevels.length === 364) {
      return activityLevels.map((level, i) => ({ day: i + 1, level }));
    }
    
    // Fallback if no data provided
    const result = [];
    const totalDays = 364;
    for (let i = 0; i < totalDays; i++) {
      // Simulate higher activity on recent days matching streak, or just 0 if no streak
      const isStreakDay = streak > 0 && i >= totalDays - streak;
      const level = isStreakDay ? 1 : 0;
      result.push({ day: i + 1, level });
    }
    return result;
  }, [streak, activityLevels]);

  const levelColors = [
    "bg-neutral-900 border-white/5", // 0: None
    "bg-orange-950/60 border-orange-500/20 text-orange-400", // 1: Low
    "bg-orange-600/40 border-orange-500/40 text-white", // 2: Med
    "bg-[#ff6c37] border-orange-400 shadow-[0_0_10px_rgba(255,108,55,0.4)] text-black", // 3: High
  ];

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-[#0b0b0b] border border-white/5 flex flex-col justify-between space-y-3 select-none">
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

      {/* Heatmap Grid (Leetcode style, side scrolling if needed) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 pt-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {/* Days of week Y-axis labels */}
        <div className="grid grid-rows-7 gap-1.5 text-[9px] font-bold text-neutral-600 uppercase pr-2 sticky left-0 bg-[#0b0b0b] z-10">
          <span className="h-3 flex items-center">M</span>
          <span className="h-3 flex items-center"></span>
          <span className="h-3 flex items-center">W</span>
          <span className="h-3 flex items-center"></span>
          <span className="h-3 flex items-center">F</span>
          <span className="h-3 flex items-center"></span>
          <span className="h-3 flex items-center">S</span>
        </div>
        
        {/* Activity Cells */}
        <div className="grid grid-rows-7 grid-flow-col gap-1.5">
          {days.map((item, idx) => (
            <div
              key={idx}
              title={`Day ${item.day}: Activity Level ${item.level}`}
              className={cn(
                "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] border transition-all hover:scale-125 cursor-pointer flex-shrink-0",
                levelColors[item.level]
              )}
            />
          ))}
        </div>
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
