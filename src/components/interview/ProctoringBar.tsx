"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Shield, Camera, Mic, Maximize, AlertTriangle, Eye } from "lucide-react";

interface ProctoringBarProps {
  violationCount: number;
  isCameraOn: boolean;
  isMicOn: boolean;
  isFullscreen: boolean;
  isSpeaking: boolean; // AI is speaking via TTS
  elapsedSeconds: number;
}

export function ProctoringBar({
  violationCount,
  isCameraOn,
  isMicOn,
  isFullscreen,
  isSpeaking,
  elapsedSeconds,
}: ProctoringBarProps) {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const warningLevel = violationCount >= 3 ? "critical" : violationCount >= 1 ? "warning" : "ok";

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all duration-300",
      warningLevel === "critical"
        ? "bg-red-500/10 border-red-500/30 text-red-400"
        : warningLevel === "warning"
          ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
    )}>
      {/* Recording Indicator */}
      <div className="flex items-center gap-1">
        <div className={cn(
          "w-2 h-2 rounded-full",
          "bg-red-500 animate-pulse"
        )} />
        <span className="text-red-400">REC</span>
      </div>

      <span className="text-neutral-600 mx-0.5">|</span>

      {/* Camera */}
      <div className="flex items-center gap-0.5" title={isCameraOn ? "Camera active" : "Camera off"}>
        <Camera className={cn("w-3 h-3", isCameraOn ? "text-emerald-400" : "text-neutral-600")} />
      </div>

      {/* Mic */}
      <div className="flex items-center gap-0.5" title={isMicOn ? "Microphone active" : "Microphone off"}>
        <Mic className={cn("w-3 h-3", isMicOn ? "text-emerald-400" : "text-neutral-600")} />
      </div>

      {/* Fullscreen */}
      <div className="flex items-center gap-0.5" title={isFullscreen ? "Fullscreen" : "Not fullscreen"}>
        <Maximize className={cn("w-3 h-3", isFullscreen ? "text-emerald-400" : "text-amber-400")} />
      </div>

      <span className="text-neutral-600 mx-0.5">|</span>

      {/* AI Speaking */}
      {isSpeaking && (
        <>
          <div className="flex items-center gap-0.5">
            <div className="flex items-center gap-[2px]">
              <div className="w-[2px] h-2 bg-blue-400 rounded-full animate-pulse" />
              <div className="w-[2px] h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
              <div className="w-[2px] h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="w-[2px] h-3.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
              <div className="w-[2px] h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.15s" }} />
            </div>
          </div>
          <span className="text-neutral-600 mx-0.5">|</span>
        </>
      )}

      {/* Violations */}
      <div className={cn("flex items-center gap-0.5", violationCount > 0 ? "text-amber-400" : "text-neutral-500")}>
        <AlertTriangle className="w-3 h-3" />
        <span>{violationCount}</span>
      </div>

      <span className="text-neutral-600 mx-0.5">|</span>

      {/* Timer */}
      <span className="text-neutral-300 font-mono">{formatTime(elapsedSeconds)}</span>
    </div>
  );
}

// ——— Proctoring Warning Modal ———

interface ProctoringWarningProps {
  type: "tab-switch" | "fullscreen-exit" | "copy-paste";
  violationCount: number;
  maxViolations: number;
  onDismiss: () => void;
}

export function ProctoringWarning({ type, violationCount, maxViolations, onDismiss }: ProctoringWarningProps) {
  const messages: Record<string, { title: string; body: string }> = {
    "tab-switch": {
      title: "Tab Switch Detected",
      body: "Switching tabs during a proctored interview is flagged as suspicious activity.",
    },
    "fullscreen-exit": {
      title: "Fullscreen Exited",
      body: "Exiting fullscreen during the interview is not allowed. Please return to fullscreen mode.",
    },
    "copy-paste": {
      title: "Copy/Paste Blocked",
      body: "Copy and paste is disabled in the interview chat area to maintain integrity.",
    },
  };

  const msg = messages[type];
  const isFinal = violationCount >= maxViolations - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
      <div className="max-w-md w-full mx-4 bg-neutral-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl shadow-red-500/10 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{msg.title}</h3>
            <p className="text-xs text-red-400 font-semibold">Violation {violationCount} of {maxViolations}</p>
          </div>
        </div>

        <p className="text-sm text-neutral-300">{msg.body}</p>

        {isFinal && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-300 font-semibold">
              This is your final warning. One more violation will auto-terminate the interview.
            </p>
          </div>
        )}

        {/* Violation progress */}
        <div className="flex gap-1">
          {Array.from({ length: maxViolations }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                i < violationCount ? "bg-red-500" : "bg-neutral-700"
              )}
            />
          ))}
        </div>

        <button
          onClick={onDismiss}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
        >
          I Understand — Continue
        </button>
      </div>
    </div>
  );
}

// ——— Webcam PiP (Picture-in-Picture) ———

interface WebcamPipProps {
  stream: MediaStream | null;
  violationCount: number;
}

export function WebcamPip({ stream, violationCount }: WebcamPipProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;

  const borderColor = violationCount >= 3 ? "border-red-500" : violationCount >= 1 ? "border-amber-500" : "border-emerald-500";

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-30 w-32 h-24 rounded-2xl overflow-hidden border-2 shadow-2xl",
      borderColor,
      "bg-black transition-all duration-300"
    )}>
      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[8px] font-bold text-white">LIVE</span>
      </div>
    </div>
  );
}


