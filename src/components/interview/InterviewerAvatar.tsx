"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Mic, Volume2, VolumeX, ShieldCheck, Zap, StopCircle, RefreshCw } from "lucide-react";
import { InterviewRole } from "@/lib/aiInterview";

export type AvatarState = "idle" | "speaking" | "listening" | "thinking";

interface InterviewerAvatarProps {
  role: InterviewRole;
  state: AvatarState;
  interviewerName?: string;
  voiceSpeed: number;
  onVoiceSpeedChange: (speed: number) => void;
  onInterrupt?: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  compact?: boolean;
}

export function InterviewerAvatar({
  role,
  state,
  interviewerName = "Alex (Senior AI Evaluator)",
  voiceSpeed,
  onVoiceSpeedChange,
  onInterrupt,
  isMuted = false,
  onToggleMute,
  compact = false,
}: InterviewerAvatarProps) {
  const roleAvatars: Record<InterviewRole, { bgGradient: string; glowColor: string; title: string }> = {
    frontend: { bgGradient: "from-rose-500/20 via-red-950 to-neutral-950", glowColor: "#f43f5e", title: "Principal Frontend Architect" },
    backend: { bgGradient: "from-amber-500/20 via-amber-950 to-neutral-950", glowColor: "#f59e0b", title: "VP of Systems Engineering" },
    fullstack: { bgGradient: "from-emerald-500/20 via-emerald-950 to-neutral-950", glowColor: "#10b981", title: "Staff Fullstack Lead" },
    systems: { bgGradient: "from-blue-500/20 via-blue-950 to-neutral-950", glowColor: "#3b82f6", title: "Distributed Systems Bar Raiser" },
    behavioral: { bgGradient: "from-violet-500/20 via-violet-950 to-neutral-950", glowColor: "#8b5cf6", title: "Director of Engineering" },
  };

  const currentTheme = roleAvatars[role] || roleAvatars.frontend;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
        <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/20 flex items-center justify-center overflow-hidden shrink-0">
          <Sparkles className={cn(
            "w-5 h-5 transition-all duration-300",
            state === "speaking" ? "text-red-400 animate-pulse scale-110" :
            state === "listening" ? "text-emerald-400 animate-bounce" :
            state === "thinking" ? "text-blue-400 animate-spin" :
            "text-neutral-400"
          )} />
          {state === "speaking" && (
            <div className="absolute inset-0 bg-red-500/20 animate-ping rounded-xl pointer-events-none" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white truncate">{interviewerName}</p>
          <p className="text-[10px] text-neutral-400 flex items-center gap-1">
            <span className={cn(
              "w-1.5 h-1.5 rounded-full inline-block",
              state === "speaking" ? "bg-red-400 animate-pulse" :
              state === "listening" ? "bg-emerald-400 animate-ping" :
              state === "thinking" ? "bg-blue-400 animate-spin" : "bg-neutral-500"
            )} />
            {state === "speaking" ? "Speaking..." :
             state === "listening" ? "Listening to you..." :
             state === "thinking" ? "Evaluating response..." : "Online"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl border transition-all duration-500 p-6 flex flex-col justify-between shadow-2xl",
      "bg-gradient-to-br border-white/10",
      currentTheme.bgGradient
    )}>
      {/* Outer Ambient Glow when Speaking or Listening */}
      {state === "speaking" && (
        <div
          className="absolute inset-0 opacity-25 blur-3xl pointer-events-none animate-pulse"
          style={{ backgroundColor: currentTheme.glowColor }}
        />
      )}
      {state === "listening" && (
        <div className="absolute inset-0 bg-emerald-500/15 blur-3xl pointer-events-none animate-pulse" />
      )}

      {/* Top Header Tag */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-neutral-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          AI Interviewer
        </div>

        {/* Voice Control Toolbar */}
        <div className="flex items-center gap-2">
          {/* Speed Toggle */}
          <button
            onClick={() => {
              const speeds = [1, 1.25, 1.5];
              const nextIdx = (speeds.indexOf(voiceSpeed) + 1) % speeds.length;
              onVoiceSpeedChange(speeds[nextIdx]);
            }}
            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-mono font-bold text-neutral-300 transition-all flex items-center gap-1"
            title="Adjust voice playback speed"
          >
            <Zap className="w-3 h-3 text-amber-400" /> {voiceSpeed}x
          </button>

          {/* Mute Toggle */}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              className={cn(
                "p-1.5 rounded-lg border text-[10px] transition-all",
                isMuted ? "bg-red-500/20 border-red-500/40 text-red-400" : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
              )}
              title={isMuted ? "Unmute AI" : "Mute AI"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Avatar Stage Visualizer */}
      <div className="relative z-10 my-8 flex flex-col items-center justify-center text-center">
        {/* Animated Avatar Circle */}
        <div className="relative flex items-center justify-center mb-4">
          {/* Audio Wave Ring (Speaking) */}
          {state === "speaking" && (
            <>
              <div className="absolute w-28 h-28 rounded-full border-2 border-red-500/40 animate-ping" />
              <div className="absolute w-36 h-36 rounded-full border border-red-500/20 animate-pulse" />
            </>
          )}

          {/* Listening Pulsing Ring */}
          {state === "listening" && (
            <div className="absolute w-32 h-32 rounded-full border-2 border-emerald-500/40 animate-pulse" />
          )}

          {/* Core Avatar Orb */}
          <div className={cn(
            "relative w-20 h-20 rounded-2xl bg-gradient-to-b from-neutral-800 to-neutral-900 border flex items-center justify-center transition-all duration-300 shadow-2xl",
            state === "speaking" ? "border-red-500/50 shadow-red-500/20 scale-105" :
            state === "listening" ? "border-emerald-500/50 shadow-emerald-500/20" :
            state === "thinking" ? "border-blue-500/50 shadow-blue-500/20" :
            "border-white/10"
          )}>
            <Sparkles className={cn(
              "w-9 h-9 transition-transform duration-500",
              state === "speaking" ? "text-red-400 scale-110" :
              state === "listening" ? "text-emerald-400" :
              state === "thinking" ? "text-blue-400 animate-spin" :
              "text-neutral-400"
            )} />
          </div>
        </div>

        {/* Interlocutor Info */}
        <h3 className="text-base font-black text-white tracking-tight">{interviewerName}</h3>
        <p className="text-xs text-neutral-400 mt-0.5">{currentTheme.title}</p>

        {/* Dynamic Status Pill */}
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10 text-xs font-semibold">
          {state === "speaking" && (
            <>
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-red-400 font-bold">Asking Question...</span>
              {onInterrupt && (
                <button
                  onClick={onInterrupt}
                  className="ml-2 px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-[10px] text-red-300 hover:bg-red-500/30 flex items-center gap-1"
                >
                  <StopCircle className="w-3 h-3" /> Skip Voice
                </button>
              )}
            </>
          )}

          {state === "listening" && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">Listening to candidate...</span>
            </>
          )}

          {state === "thinking" && (
            <>
              <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
              <span className="text-blue-400 font-bold">Analyzing your answer...</span>
            </>
          )}

          {state === "idle" && (
            <>
              <span className="w-2 h-2 rounded-full bg-neutral-500" />
              <span className="text-neutral-400">Ready</span>
            </>
          )}
        </div>
      </div>

      {/* Footer Instructions / Captions Prompt */}
      <div className="relative z-10 text-center">
        <p className="text-[11px] text-neutral-400 italic">
          {state === "speaking" ? "Listen closely to the question prompt" :
           state === "listening" ? "Speak clearly into your microphone" :
           "Answer concisely using technical specifics"}
        </p>
      </div>
    </div>
  );
}
