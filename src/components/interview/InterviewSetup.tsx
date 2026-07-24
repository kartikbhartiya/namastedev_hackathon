"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  InterviewConfig,
  VoiceMode,
  ROLE_OPTIONS,
  SENIORITY_OPTIONS,
  COMPANY_OPTIONS,
  DEFAULT_INTERVIEW_CONFIG
} from "@/lib/aiInterview";
import {
  Mic, MicOff, Code2, Minus, Plus, Rocket, Shield, Camera, Timer, Headphones, Radio
} from "lucide-react";

interface InterviewSetupProps {
  onStart: (config: InterviewConfig) => void;
}

export function InterviewSetup({ onStart }: InterviewSetupProps) {
  const [config, setConfig] = useState<InterviewConfig>(DEFAULT_INTERVIEW_CONFIG);

  const VOICE_MODES: { value: VoiceMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "off", label: "Off", icon: <MicOff className="w-4 h-4" />, desc: "Type your answers" },
    { value: "push-to-talk", label: "Push to Talk", icon: <Mic className="w-4 h-4" />, desc: "Hold button to speak" },
    { value: "continuous", label: "Continuous", icon: <Radio className="w-4 h-4" />, desc: "Always listening, auto-submit" },
  ];

  const TIMER_OPTIONS = [
    { value: 0, label: "No Limit" },
    { value: 180, label: "3 min" },
    { value: 300, label: "5 min" },
    { value: 600, label: "10 min" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
          <Shield className="w-3.5 h-3.5" /> Proctored AI Interview
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          Configure Your Mock Interview
        </h1>
        <p className="text-neutral-400 text-sm max-w-lg mx-auto">
          Set up your role, difficulty, proctoring level, and voice mode. The AI interviewer will adapt to your choices.
        </p>
      </div>

      {/* Role Selection */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Target Role</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ROLE_OPTIONS.map((role) => (
            <button
              key={role.value}
              onClick={() => setConfig({ ...config, role: role.value })}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all duration-200 group",
                config.role === role.value
                  ? "bg-red-500/15 border-red-500/40 shadow-lg shadow-red-500/5"
                  : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{role.emoji}</span>
                <span className={cn(
                  "text-sm font-bold",
                  config.role === role.value ? "text-red-400" : "text-white"
                )}>{role.label}</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">{role.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Seniority Level */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Seniority Level</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SENIORITY_OPTIONS.map((level) => (
            <button
              key={level.value}
              onClick={() => setConfig({ ...config, seniority: level.value })}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all duration-200",
                config.seniority === level.value
                  ? "bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/5"
                  : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{level.emoji}</span>
                <span className={cn(
                  "text-sm font-bold",
                  config.seniority === level.value ? "text-amber-400" : "text-white"
                )}>{level.label}</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">{level.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Company Style */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Company Style</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {COMPANY_OPTIONS.map((company) => (
            <button
              key={company.value}
              onClick={() => setConfig({ ...config, companyStyle: company.value })}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all duration-200",
                config.companyStyle === company.value
                  ? "bg-blue-500/15 border-blue-500/40 shadow-lg shadow-blue-500/5"
                  : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{company.emoji}</span>
                <span className={cn(
                  "text-sm font-bold",
                  config.companyStyle === company.value ? "text-blue-400" : "text-white"
                )}>{company.label}</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">{company.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Voice Mode Selection */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          <Headphones className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Voice & Speech Mode
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VOICE_MODES.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setConfig({ ...config, voiceMode: mode.value, enableVoice: mode.value !== "off" })}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all duration-200",
                config.voiceMode === mode.value
                  ? "bg-emerald-500/15 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                  : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  config.voiceMode === mode.value ? "bg-emerald-500/20 text-emerald-400" : "bg-neutral-800 text-neutral-500"
                )}>
                  {mode.icon}
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  config.voiceMode === mode.value ? "text-emerald-400" : "text-white"
                )}>{mode.label}</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Question Count */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Questions</span>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setConfig({ ...config, questionCount: Math.max(3, config.questionCount - 1) })}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-2xl font-black text-white">{config.questionCount}</span>
            <button
              onClick={() => setConfig({ ...config, questionCount: Math.min(10, config.questionCount + 1) })}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Per-Question Timer */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-amber-400" /> Time/Question
          </span>
          <div className="flex flex-wrap gap-1.5">
            {TIMER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setConfig({ ...config, perQuestionTimeLimitSec: opt.value })}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  config.perQuestionTimeLimitSec === opt.value
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-white/5 text-neutral-400 border border-white/5 hover:bg-white/10"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Proctoring Toggle */}
        <button
          onClick={() => setConfig({ ...config, enableProctoring: !config.enableProctoring })}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all duration-200",
            config.enableProctoring
              ? "bg-red-500/10 border-red-500/30"
              : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04]"
          )}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block mb-2">Proctoring</span>
          <div className="flex items-center gap-3">
            <Shield className={cn("w-5 h-5", config.enableProctoring ? "text-red-400" : "text-neutral-500")} />
            <span className={cn("text-sm font-bold", config.enableProctoring ? "text-red-400" : "text-neutral-500")}>
              {config.enableProctoring ? "Enabled" : "Disabled"}
            </span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1.5">Tab detection, fullscreen lock</p>
        </button>

        {/* Webcam Toggle */}
        <button
          onClick={() => setConfig({ ...config, enableWebcam: !config.enableWebcam })}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all duration-200",
            config.enableWebcam
              ? "bg-cyan-500/10 border-cyan-500/30"
              : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04]"
          )}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block mb-2">Webcam</span>
          <div className="flex items-center gap-3">
            <Camera className={cn("w-5 h-5", config.enableWebcam ? "text-cyan-400" : "text-neutral-500")} />
            <span className={cn("text-sm font-bold", config.enableWebcam ? "text-cyan-400" : "text-neutral-500")}>
              {config.enableWebcam ? "Enabled" : "Disabled"}
            </span>
          </div>
          <p className="text-[10px] text-neutral-500 mt-1.5">PiP camera preview during interview</p>
        </button>
      </div>

      {/* Scratchpad Toggle (separate row) */}
      <div className="flex justify-center">
        <button
          onClick={() => setConfig({ ...config, enableScratchpad: !config.enableScratchpad })}
          className={cn(
            "p-4 rounded-2xl border text-left transition-all duration-200 w-full sm:w-1/2",
            config.enableScratchpad
              ? "bg-violet-500/15 border-violet-500/40"
              : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04]"
          )}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block mb-2">Code Scratchpad</span>
          <div className="flex items-center gap-3">
            <Code2 className={cn("w-5 h-5", config.enableScratchpad ? "text-violet-400" : "text-neutral-500")} />
            <span className={cn("text-sm font-bold", config.enableScratchpad ? "text-violet-400" : "text-neutral-500")}>
              {config.enableScratchpad ? "Enabled" : "Disabled"}
            </span>
          </div>
        </button>
      </div>

      {/* Start Button */}
      <div className="pt-4 flex justify-center">
        <button
          onClick={() => onStart(config)}
          className="group flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-base hover:from-red-500 hover:to-red-400 transition-all shadow-2xl shadow-red-500/20 hover:shadow-red-500/30 active:scale-[0.98]"
        >
          <Rocket className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
          {config.enableProctoring ? "Proceed to Environment Check" : "Begin Interview"}
        </button>
      </div>
    </div>
  );
}
