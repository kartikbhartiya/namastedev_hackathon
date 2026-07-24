"use client";

import { cn } from "@/lib/utils";
import { InterviewScoreBreakdown, InterviewConfig, ROLE_OPTIONS, ProctoringViolation, QuestionMeta } from "@/lib/aiInterview";
import { Award, AlertTriangle, TrendingUp, RotateCcw, Home, Sparkles, CheckCircle2, XCircle, Printer, Star, Shield } from "lucide-react";

interface InterviewScorecardProps {
  score: InterviewScoreBreakdown;
  config: InterviewConfig;
  onRetry: () => void;
  onHome: () => void;
  onClaimXP?: () => void;
  xpClaimed?: boolean;
  violations?: ProctoringViolation[];
  questionMetas?: QuestionMeta[];
}

function ScoreRing({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const percentage = Math.round((value / max) * 100);
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black text-white">{value}</span>
          <span className="text-[10px] text-neutral-400 mt-1">/{max}</span>
        </div>
      </div>
      <span className="text-[11px] font-semibold text-neutral-300 text-center">{label}</span>
    </div>
  );
}

function RadarChart({ score }: { score: InterviewScoreBreakdown }) {
  const size = 200;
  const center = size / 2;
  const radius = size / 2 - 20;

  // 4 axes: Technical (top), Communication (right), Problem Solving (bottom), Depth (left)
  const data = [
    { value: score.technicalAccuracy, max: 25 },
    { value: score.communication, max: 25 },
    { value: score.problemSolving, max: 25 },
    { value: score.depthOfKnowledge, max: 25 }
  ];

  const getPoint = (val: number, max: number, angle: number) => {
    const r = (val / max) * radius;
    const x = center + r * Math.cos(angle - Math.PI / 2);
    const y = center + r * Math.sin(angle - Math.PI / 2);
    return `${x},${y}`;
  };

  const points = data.map((d, i) => getPoint(d.value, d.max, (i * Math.PI) / 2)).join(" ");
  const maxPoints = data.map((_, i) => getPoint(25, 25, (i * Math.PI) / 2)).join(" ");

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Background Grid */}
        <polygon points={maxPoints} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <polygon points={data.map((_, i) => getPoint(12.5, 25, (i * Math.PI) / 2)).join(" ")} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        
        {/* Axes lines */}
        {data.map((_, i) => {
          const end = getPoint(25, 25, (i * Math.PI) / 2);
          return (
            <line key={i} x1={center} y1={center} x2={end.split(",")[0]} y2={end.split(",")[1]} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          );
        })}

        {/* Data Polygon */}
        <polygon points={points} fill="rgba(255,108,55,0.2)" stroke="#ff6c37" strokeWidth="2" className="transition-all duration-1000 ease-out" />
        
        {/* Data Points */}
        {data.map((d, i) => {
          const pt = getPoint(d.value, d.max, (i * Math.PI) / 2);
          return <circle key={i} cx={pt.split(",")[0]} cy={pt.split(",")[1]} r="4" fill="#ff6c37" className="transition-all duration-1000 ease-out" />;
        })}
      </svg>
      
      {/* Labels */}
      <span className="absolute top-[-10px] text-[10px] font-bold text-[#f43f5e] uppercase tracking-wider">Technical</span>
      <span className="absolute right-[-20px] top-[50%] -translate-y-1/2 text-[10px] font-bold text-[#3b82f6] uppercase tracking-wider">Comm</span>
      <span className="absolute bottom-[-10px] text-[10px] font-bold text-[#a855f7] uppercase tracking-wider">Logic</span>
      <span className="absolute left-[-20px] top-[50%] -translate-y-1/2 text-[10px] font-bold text-[#f59e0b] uppercase tracking-wider">Depth</span>
    </div>
  );
}

function GradeDisplay({ grade, recommendation }: { grade: string; recommendation: string }) {
  const gradeColors: Record<string, string> = {
    "A+": "from-emerald-400 to-green-500", "A": "from-emerald-400 to-green-500",
    "B+": "from-blue-400 to-cyan-500", "B": "from-blue-400 to-cyan-500",
    "C+": "from-amber-400 to-yellow-500", "C": "from-amber-400 to-yellow-500",
    "D": "from-orange-400 to-red-500", "F": "from-red-500 to-red-700",
  };

  const recColors: Record<string, string> = {
    "Hire": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    "Lean Hire": "text-blue-400 bg-blue-500/10 border-blue-500/20",
    "Lean No Hire": "text-amber-400 bg-amber-500/10 border-amber-500/20",
    "No Hire": "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={cn("w-28 h-28 rounded-3xl bg-gradient-to-br flex items-center justify-center shadow-2xl", gradeColors[grade] || gradeColors["C"])}>
        <span className="text-5xl font-black text-white drop-shadow-lg">{grade}</span>
      </div>
      <span className={cn("text-xs font-bold px-4 py-1.5 rounded-full border", recColors[recommendation] || recColors["Lean No Hire"])}>
        {recommendation}
      </span>
    </div>
  );
}

function IntegrityLog({ violations = [] }: { violations?: ProctoringViolation[] }) {
  const score = Math.max(0, 100 - violations.length * 20);
  const color = score >= 80 ? "stroke-emerald-400" : score >= 50 ? "stroke-amber-400" : "stroke-red-400";
  const textColor = score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const bgBadge = score >= 80 ? "bg-emerald-500/10 border-emerald-500/20" : score >= 50 ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";

  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-red-400" /> Integrity & Security Audit
        </span>
        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider", bgBadge, textColor)}>
          Score: {score}%
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center pt-2">
        {/* Integrity Gauge */}
        <div className="flex justify-center md:col-span-1">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444"}
                strokeWidth="5"
                strokeDasharray={2 * Math.PI * 34}
                strokeDashoffset={2 * Math.PI * 34 * (1 - score / 100)}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-black text-white">{score}%</span>
            </div>
          </div>
        </div>

        {/* Violations Timeline */}
        <div className="md:col-span-3 space-y-2">
          {violations.length === 0 ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Perfect Integrity Record. No violations detected during proctoring session.</span>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              {violations.map((v, i) => {
                const labelMap: Record<string, string> = {
                  "tab-switch": "Tab Switch Flagged",
                  "fullscreen-exit": "Exited Fullscreen Lock",
                  "copy-paste": "Blocked Clipboard Copy/Paste",
                };
                return (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-500/5 border border-red-500/10 text-neutral-300 text-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{labelMap[v.type] || v.type}</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PerformanceTimeline({ questionMetas }: { questionMetas?: QuestionMeta[] }) {
  if (!questionMetas || questionMetas.length === 0) return null;

  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
      <span className="text-xs font-bold uppercase tracking-widest text-neutral-400 block border-b border-white/5 pb-2">Question Pacing & Confidence Timeline</span>
      <div className="space-y-4">
        {questionMetas.map((q) => {
          const duration = q.answeredAt ? Math.round((q.answeredAt - q.startedAt) / 1000) : null;
          const formatDuration = (sec: number) => {
            if (sec < 60) return `${sec}s`;
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${m}m ${s}s`;
          };

          return (
            <div key={q.number} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/[0.01] border border-white/5 gap-3 hover:bg-white/[0.02] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center font-bold text-xs text-white border border-white/5">
                  Q{q.number}
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-white block capitalize">{q.topic || "General Discussion"}</span>
                  <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider">{q.type} Round</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Answer Duration */}
                {duration !== null && (
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 block uppercase tracking-wider">Answer Pace</span>
                    <span className="text-xs font-mono font-bold text-neutral-300">{formatDuration(duration)}</span>
                  </div>
                )}

                {/* Self-Rating */}
                {q.confidenceRating !== undefined && (
                  <div className="text-right">
                    <span className="text-[10px] text-neutral-500 block uppercase tracking-wider">Self-Confidence</span>
                    <div className="flex items-center gap-0.5 justify-end">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={cn(
                            "w-3 h-3",
                            idx < q.confidenceRating! ? "text-amber-400 fill-amber-400" : "text-neutral-700"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function InterviewScorecard({ score, config, onRetry, onHome, onClaimXP, xpClaimed, violations = [], questionMetas = [] }: InterviewScorecardProps) {
  const roleInfo = ROLE_OPTIONS.find(r => r.value === config.role);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
          <Award className="w-4 h-4" /> Interview Complete
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white">Performance Report</h1>
        <p className="text-neutral-400 text-sm">
          {roleInfo?.emoji} {roleInfo?.label} • {config.seniority.charAt(0).toUpperCase() + config.seniority.slice(1)} Level
        </p>
      </div>

      {/* Main Score Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-white/10 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <GradeDisplay grade={score.overallGrade} recommendation={score.recommendation} />

          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="text-5xl font-black text-white">
                {score.totalScore}<span className="text-xl text-neutral-400">/100</span>
              </div>
              <p className="text-sm text-neutral-400 mt-1">Overall Score</p>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed max-w-lg">{score.summary}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mt-8 pt-8 border-t border-white/10 items-center">
          <div className="md:col-span-2 flex justify-center border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0">
            <RadarChart score={score} />
          </div>
          <div className="md:col-span-3 grid grid-cols-2 gap-6">
            <ScoreRing value={score.technicalAccuracy} max={25} label="Technical Accuracy" color="#f43f5e" />
            <ScoreRing value={score.communication} max={25} label="Communication" color="#3b82f6" />
            <ScoreRing value={score.problemSolving} max={25} label="Problem Solving" color="#a855f7" />
            <ScoreRing value={score.depthOfKnowledge} max={25} label="Depth of Knowledge" color="#f59e0b" />
          </div>
        </div>
      </div>

      {/* Proctoring Integrity & Security Log */}
      {config.enableProctoring && (
        <IntegrityLog violations={violations} />
      )}

      {/* Strengths & Red Flags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Strengths</span>
          </div>
          <ul className="space-y-2">
            {score.strengths.map((s, i) => (
              <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-3">
          <div className="flex items-center gap-2 text-red-400">
            <XCircle className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Areas to Improve</span>
          </div>
          <ul className="space-y-2">
            {score.redFlags.map((f, i) => (
              <li key={i} className="text-sm text-neutral-300 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Performance Pace & Confidence Timeline */}
      <PerformanceTimeline questionMetas={questionMetas} />

      {/* Topic Breakdown */}
      {score.topicScores && score.topicScores.length > 0 && (
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Topic Breakdown</span>
          <div className="space-y-3">
            {score.topicScores.map((t, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">{t.topic}</span>
                  <span className="text-xs font-bold text-neutral-400">{t.score}/{t.maxScore}</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all duration-1000"
                    style={{ width: `${(t.score / t.maxScore) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-neutral-400">{t.feedback}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 print:hidden">
        {onClaimXP && !xpClaimed && (
          <button
            onClick={onClaimXP}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4" /> Claim {Math.round(score.totalScore / 2)} XP & Badge
          </button>
        )}
        {xpClaimed && (
          <span className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
            <CheckCircle2 className="w-4 h-4" /> XP & Badge Claimed!
          </span>
        )}

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          <Printer className="w-4 h-4" /> Export Report (PDF)
        </button>

        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Retry Interview
        </button>

        <button
          onClick={onHome}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-neutral-400 font-bold text-sm hover:bg-white/10 hover:text-white transition-all"
        >
          <Home className="w-4 h-4" /> Dashboard
        </button>
      </div>
    </div>
  );
}
