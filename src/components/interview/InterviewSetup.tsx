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
  Mic, MicOff, Code2, Minus, Plus, Rocket, Shield, Camera, Timer, Headphones, Radio,
  Upload, FileText, CheckCircle2, ChevronDown, ChevronUp
} from "lucide-react";
import { extractTextFromFile } from "@/lib/documentProcessor";

interface InterviewSetupProps {
  onStart: (config: InterviewConfig) => void;
}

export function InterviewSetup({ onStart }: InterviewSetupProps) {
  const [config, setConfig] = useState<InterviewConfig>(DEFAULT_INTERVIEW_CONFIG);
  const [uploadStatus, setUploadStatus] = useState("");
  const [showResumePaste, setShowResumePaste] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadStatus("Reading file...");
      const text = await extractTextFromFile(file, (status) => setUploadStatus(status));
      setConfig(prev => ({ ...prev, resumeText: text }));
      setUploadStatus("Uploaded: " + file.name);
    } catch (err: any) {
      setUploadStatus("Error: " + err.message);
    }
  };

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

      {/* Voice Mode Selection (Strictly Enforced Voice Only) */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          <Headphones className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Voice & Speech Mode
        </h3>
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-sm font-bold text-emerald-400 block">Continuous Speech Mode (Always-On Mic)</span>
              <p className="text-xs text-neutral-400">Typing is disabled. Speak freely to answer; auto-submits when quiet.</p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Strict Enforced
          </span>
        </div>
      </div>

      {/* FAANG Interview Round */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">FAANG Interview Round</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { value: "dsa", label: "DSA & Coding", emoji: "💻", desc: "Solve algorithmic problems using the scratchpad." },
            { value: "system-design", label: "System Design", emoji: "🏗️", desc: "Scale architecture, replication, and system trade-offs." },
            { value: "behavioral", label: "Behavioral & Leadership", emoji: "🤝", desc: "Amazon Leadership Principles & STAR stories." },
            { value: "resume-fit", label: "Resume & Role-Fit", emoji: "📄", desc: "Questions based on your resume & job details." },
            { value: "full-loop", label: "Full FAANG Loop", emoji: "🔄", desc: "Comprehensive mock round covering all aspects." },
          ].map((round) => (
            <button
              key={round.value}
              onClick={() => setConfig({ ...config, roundType: round.value as any })}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all duration-200",
                config.roundType === round.value
                  ? "bg-red-500/15 border-red-500/40 shadow-lg shadow-red-500/5"
                  : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{round.emoji}</span>
                <span className={cn(
                  "text-sm font-bold",
                  config.roundType === round.value ? "text-red-400" : "text-white"
                )}>{round.label}</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">{round.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Describe Target Role / Job Description */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Target Role / Job Description</h3>
        <textarea
          value={config.jobDescription}
          onChange={(e) => setConfig({ ...config, jobDescription: e.target.value })}
          placeholder="Describe the job role, required skills, or paste a job description here (e.g., 'React developer at Google building high-performance maps application')."
          className="w-full h-28 p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 focus:border-red-500/50 focus:outline-none text-sm text-neutral-200 resize-none transition-all placeholder:text-neutral-600"
        />
      </div>

      {/* Resume Upload & Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" /> Resume / Experience Profile
          </h3>
          <button
            type="button"
            onClick={() => setShowResumePaste(!showResumePaste)}
            className="text-xs text-neutral-400 hover:text-white transition-all flex items-center gap-1"
          >
            {showResumePaste ? "Hide Text Editor" : "Paste Text Directly"}
            {showResumePaste ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* File Uploader */}
        <div className="relative border-2 border-dashed border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all duration-200 flex flex-col items-center justify-center gap-2 group bg-white/[0.01]">
          <input
            type="file"
            accept=".txt,.md"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload className="w-8 h-8 text-neutral-500 group-hover:text-neutral-400 transition-colors" />
          <p className="text-sm font-bold text-neutral-300">Drag & drop your Resume</p>
          <p className="text-xs text-neutral-500">Supports text (.txt, .md). Fallback to copy-pasting for PDFs.</p>
          {uploadStatus && (
            <div className="mt-2 text-xs font-mono px-3 py-1 rounded bg-white/5 border border-white/10 text-neutral-300 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{uploadStatus}</span>
            </div>
          )}
        </div>

        {/* Pasting Fallback */}
        {showResumePaste && (
          <textarea
            value={config.resumeText}
            onChange={(e) => setConfig({ ...config, resumeText: e.target.value })}
            placeholder="Paste your plain-text resume or experience details here..."
            className="w-full h-40 p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 focus:border-red-500/50 focus:outline-none text-sm text-neutral-200 resize-none transition-all placeholder:text-neutral-600 font-mono"
          />
        )}
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

        {/* Proctoring Status (Enforced) */}
        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block mb-2">Proctoring</span>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-5 h-5 text-red-400" />
            <span className="text-sm font-bold text-red-400">Strict Proctoring</span>
          </div>
          <p className="text-[9px] text-neutral-400 leading-tight">Enforced: Tab tracking & fullscreen lock enabled.</p>
        </div>

        {/* Webcam Status (Enforced) */}
        <div className="p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 text-left">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block mb-2">Webcam Preview</span>
          <div className="flex items-center gap-3 mb-1">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold text-cyan-400">Always On Camera</span>
          </div>
          <p className="text-[9px] text-neutral-400 leading-tight">Enforced: PiP stream active during interview.</p>
        </div>
      </div>

      {/* Code Scratchpad (Locked to Enabled if Round is DSA/Full Loop) */}
      <div className="flex justify-center">
        <div
          className={cn(
            "p-4 rounded-2xl border text-left w-full sm:w-1/2",
            config.enableScratchpad
              ? "bg-violet-500/10 border-violet-500/30"
              : "bg-white/[0.02] border-white/10"
          )}
        >
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block mb-2">Code Scratchpad</span>
          <div className="flex items-center gap-3">
            <Code2 className="w-5 h-5 text-violet-400" />
            <span className="text-sm font-bold text-violet-400">Enabled (Interactive)</span>
          </div>
        </div>
      </div>

      {/* Start Button */}
      <div className="pt-4 flex justify-center">
        <button
          onClick={() => onStart(config)}
          className="group flex items-center gap-3 px-10 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-base hover:from-red-500 hover:to-red-400 transition-all shadow-2xl shadow-red-500/20 hover:shadow-red-500/30 active:scale-[0.98]"
        >
          <Rocket className="w-5 h-5 transition-transform group-hover:-translate-y-0.5" />
          Proceed to Environment Check
        </button>
      </div>
    </div>
  );
}
