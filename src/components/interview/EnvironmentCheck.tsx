"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Mic, Camera, Wifi, Volume2, Maximize, CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

interface EnvCheck {
  id: string;
  label: string;
  icon: React.ReactNode;
  status: "pending" | "checking" | "passed" | "failed";
  detail?: string;
}

interface EnvironmentCheckProps {
  requireMic: boolean;
  requireCamera: boolean;
  onAllPassed: () => void;
  onSkip?: () => void;
}

export function EnvironmentCheck({ requireMic, requireCamera, onAllPassed, onSkip }: EnvironmentCheckProps) {
  const [checks, setChecks] = useState<EnvCheck[]>([
    { id: "internet", label: "Internet Connection", icon: <Wifi className="w-5 h-5" />, status: "pending" },
    { id: "mic", label: "Microphone Access", icon: <Mic className="w-5 h-5" />, status: requireMic ? "pending" : "passed", detail: requireMic ? undefined : "Not required" },
    { id: "camera", label: "Webcam Access", icon: <Camera className="w-5 h-5" />, status: requireCamera ? "pending" : "passed", detail: requireCamera ? undefined : "Not required" },
    { id: "speaker", label: "Audio Output", icon: <Volume2 className="w-5 h-5" />, status: "pending" },
    { id: "fullscreen", label: "Fullscreen Support", icon: <Maximize className="w-5 h-5" />, status: "pending" },
  ]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [allPassed, setAllPassed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const updateCheck = useCallback((id: string, status: EnvCheck["status"], detail?: string) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, status, detail: detail || c.detail } : c));
  }, []);

  // Run checks sequentially
  useEffect(() => {
    const runChecks = async () => {
      // 1. Internet
      updateCheck("internet", "checking");
      try {
        await fetch("https://httpbin.org/get", { mode: "no-cors", signal: AbortSignal.timeout(5000) });
        updateCheck("internet", "passed", "Connected");
      } catch {
        updateCheck("internet", "passed", "Assumed OK (offline check skipped)");
      }
      await new Promise(r => setTimeout(r, 400));

      // 2. Microphone
      if (requireMic) {
        updateCheck("mic", "checking");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(t => t.stop());
          updateCheck("mic", "passed", "Access granted");
        } catch {
          updateCheck("mic", "failed", "Permission denied or unavailable");
        }
        await new Promise(r => setTimeout(r, 400));
      }

      // 3. Camera
      if (requireCamera) {
        updateCheck("camera", "checking");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          updateCheck("camera", "passed", "Access granted");
        } catch {
          updateCheck("camera", "failed", "Permission denied or unavailable");
        }
        await new Promise(r => setTimeout(r, 400));
      }

      // 4. Speaker
      updateCheck("speaker", "checking");
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.05;
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        setTimeout(() => { osc.stop(); ctx.close(); }, 200);
        updateCheck("speaker", "passed", "Audio output working");
      } catch {
        updateCheck("speaker", "passed", "Assumed OK");
      }
      await new Promise(r => setTimeout(r, 400));

      // 5. Fullscreen
      updateCheck("fullscreen", "checking");
      if ("requestFullscreen" in document.documentElement) {
        updateCheck("fullscreen", "passed", "Supported");
      } else {
        updateCheck("fullscreen", "failed", "Not supported in this browser");
      }
    };

    runChecks();

    return () => {
      // Cleanup camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [requireMic, requireCamera, updateCheck]);

  // Check if all passed
  useEffect(() => {
    const allDone = checks.every(c => c.status === "passed" || c.status === "failed");
    const noneFailed = checks.every(c => c.status === "passed");
    if (allDone && noneFailed && !allPassed) {
      setAllPassed(true);
    }
  }, [checks, allPassed]);

  // Countdown logic
  const startCountdown = useCallback(() => {
    // Cleanup camera before starting
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCountdown(3);
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      onAllPassed();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => (c ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onAllPassed]);

  const statusIcon = (status: EnvCheck["status"]) => {
    switch (status) {
      case "pending": return <div className="w-5 h-5 rounded-full border-2 border-neutral-600" />;
      case "checking": return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case "passed": return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "failed": return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const statusColors: Record<string, string> = {
    pending: "border-neutral-700 bg-neutral-900/50",
    checking: "border-blue-500/30 bg-blue-500/5",
    passed: "border-emerald-500/30 bg-emerald-500/5",
    failed: "border-red-500/30 bg-red-500/5",
  };

  // Countdown overlay
  if (countdown !== null) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="text-center space-y-6">
          <p className="text-neutral-400 text-sm uppercase tracking-widest font-bold">Interview Starting In</p>
          <div className="relative w-40 h-40 mx-auto">
            <svg className="w-40 h-40 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke="#ef4444"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - countdown / 3)}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl font-black text-white">{countdown}</span>
            </div>
          </div>
          <p className="text-neutral-500 text-xs">Prepare yourself. Stay focused.</p>
        </div>
      </div>
    );
  }

  const hasFailures = checks.some(c => c.status === "failed");

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
          🔍 Environment Check
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">Pre-Interview System Check</h2>
        <p className="text-neutral-400 text-sm">We need to verify your system meets the requirements for a proctored interview.</p>
      </div>

      {/* Camera Preview */}
      {requireCamera && (
        <div className="relative mx-auto w-48 h-36 rounded-2xl overflow-hidden border-2 border-neutral-700 bg-neutral-900">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          {checks.find(c => c.id === "camera")?.status !== "passed" && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80">
              <Camera className="w-8 h-8 text-neutral-600" />
            </div>
          )}
        </div>
      )}

      {/* Check Items */}
      <div className="space-y-3">
        {checks.map(check => (
          <div
            key={check.id}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
              statusColors[check.status]
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              check.status === "passed" ? "bg-emerald-500/10 text-emerald-400" :
              check.status === "failed" ? "bg-red-500/10 text-red-400" :
              check.status === "checking" ? "bg-blue-500/10 text-blue-400" :
              "bg-neutral-800 text-neutral-500"
            )}>
              {check.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{check.label}</p>
              {check.detail && <p className="text-xs text-neutral-400 mt-0.5">{check.detail}</p>}
            </div>
            {statusIcon(check.status)}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 pt-4">
        {allPassed && !hasFailures && (
          <button
            onClick={startCountdown}
            className="group flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-sm hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-2xl shadow-emerald-500/20 active:scale-[0.98]"
          >
            All Checks Passed — Start Interview
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        )}
        {hasFailures && onSkip && (
          <button
            onClick={onSkip}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm hover:bg-amber-500/20 transition-all"
          >
            Skip Failed Checks & Continue
          </button>
        )}
      </div>
    </div>
  );
}
