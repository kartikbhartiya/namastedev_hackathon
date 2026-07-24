"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Cpu, Play, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Process {
  id: string;
  name: string;
  burstTime: number;
  arrivalTime: number;
  color: string;
}

interface ScheduledBlock {
  processId: string;
  startTime: number;
  endTime: number;
  color: string;
}

export function CpuSchedulingSim() {
  const [algo, setAlgo] = useState<"FCFS" | "SJF" | "RR">("FCFS");
  const [timeQuantum, setTimeQuantum] = useState(2);
  const [processes, setProcesses] = useState<Process[]>([
    { id: "P1", name: "P1", burstTime: 6, arrivalTime: 0, color: "#3b82f6" },
    { id: "P2", name: "P2", burstTime: 3, arrivalTime: 1, color: "#10b981" },
    { id: "P3", name: "P3", burstTime: 8, arrivalTime: 2, color: "#f59e0b" },
    { id: "P4", name: "P4", burstTime: 4, arrivalTime: 3, color: "#a855f7" },
  ]);

  // Compute Gantt Chart & Metrics
  const { schedule, avgWaiting, avgTurnaround } = useMemo(() => {
    const blocks: ScheduledBlock[] = [];
    const procs = processes.map(p => ({ ...p, remainingTime: p.burstTime, completionTime: 0, waitingTime: 0 }));

    let currentTime = 0;

    if (algo === "FCFS") {
      procs.sort((a, b) => a.arrivalTime - b.arrivalTime);
      procs.forEach(p => {
        if (currentTime < p.arrivalTime) currentTime = p.arrivalTime;
        blocks.push({ processId: p.id, startTime: currentTime, endTime: currentTime + p.burstTime, color: p.color });
        currentTime += p.burstTime;
        p.completionTime = currentTime;
        p.waitingTime = p.completionTime - p.arrivalTime - p.burstTime;
      });
    } else if (algo === "SJF") {
      let completed = 0;
      const n = procs.length;

      while (completed < n) {
        const available = procs.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);
        if (available.length === 0) {
          currentTime++;
          continue;
        }
        available.sort((a, b) => a.burstTime - b.burstTime);
        const p = available[0];

        blocks.push({ processId: p.id, startTime: currentTime, endTime: currentTime + p.burstTime, color: p.color });
        currentTime += p.burstTime;
        p.remainingTime = 0;
        p.completionTime = currentTime;
        p.waitingTime = p.completionTime - p.arrivalTime - p.burstTime;
        completed++;
      }
    } else if (algo === "RR") {
      let queue: typeof procs = [];
      let completed = 0;
      const n = procs.length;
      let visited = new Set<string>();

      procs.sort((a, b) => a.arrivalTime - b.arrivalTime);

      while (completed < n) {
        procs.forEach(p => {
          if (p.arrivalTime <= currentTime && !visited.has(p.id)) {
            queue.push(p);
            visited.add(p.id);
          }
        });

        if (queue.length === 0) {
          currentTime++;
          continue;
        }

        const p = queue.shift()!;
        const execTime = Math.min(p.remainingTime, timeQuantum);
        blocks.push({ processId: p.id, startTime: currentTime, endTime: currentTime + execTime, color: p.color });
        currentTime += execTime;
        p.remainingTime -= execTime;

        // Check new arrivals during execution
        procs.forEach(np => {
          if (np.arrivalTime <= currentTime && !visited.has(np.id)) {
            queue.push(np);
            visited.add(np.id);
          }
        });

        if (p.remainingTime > 0) {
          queue.push(p);
        } else {
          p.completionTime = currentTime;
          p.waitingTime = p.completionTime - p.arrivalTime - p.burstTime;
          completed++;
        }
      }
    }

    const totalWait = procs.reduce((acc, p) => acc + p.waitingTime, 0);
    const totalTat = procs.reduce((acc, p) => acc + (p.completionTime - p.arrivalTime), 0);

    return {
      schedule: blocks,
      avgWaiting: (totalWait / procs.length).toFixed(2),
      avgTurnaround: (totalTat / procs.length).toFixed(2),
    };
  }, [processes, algo, timeQuantum]);

  const maxTime = schedule.length > 0 ? schedule[schedule.length - 1].endTime : 20;

  return (
    <div className="p-5 bg-neutral-900/90 border border-white/10 rounded-2xl space-y-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" /> CPU Scheduling Simulator (Gantt Chart)
          </h3>
          <p className="text-xs text-neutral-400">Simulate FCFS, Shortest Job First (SJF), and Round Robin (RR) with live Gantt timeline</p>
        </div>
      </div>

      {/* Algorithm Selector & Quantum Control */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-950 p-3 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          {(["FCFS", "SJF", "RR"] as const).map(a => (
            <button
              key={a}
              onClick={() => setAlgo(a)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                algo === a ? "bg-blue-500 text-white shadow" : "bg-white/5 text-neutral-400 hover:text-white"
              )}
            >
              {a === "FCFS" ? "First Come First Serve" : a === "SJF" ? "Shortest Job First" : "Round Robin"}
            </button>
          ))}
        </div>

        {algo === "RR" && (
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <span>Time Quantum: <strong>{timeQuantum}ms</strong></span>
            <Slider
              value={[timeQuantum]}
              min={1}
              max={5}
              step={1}
              onValueChange={([v]) => setTimeQuantum(v)}
              className="w-24"
            />
          </div>
        )}
      </div>

      {/* Process Table */}
      <div className="grid grid-cols-4 gap-2">
        {processes.map((p, i) => (
          <div key={p.id} className="p-2.5 rounded-xl border border-white/5 bg-neutral-950 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </span>
              <span className="text-[10px] text-neutral-500">Arrival: t={p.arrivalTime}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400">
              <span>Burst Time:</span>
              <input
                type="number"
                min={1}
                max={15}
                value={p.burstTime}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 1;
                  setProcesses(prev => prev.map((pr, idx) => idx === i ? { ...pr, burstTime: val } : pr));
                }}
                className="w-12 h-6 px-1 rounded bg-neutral-900 border border-white/10 text-white text-center font-bold"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Gantt Chart Timeline */}
      <div className="space-y-2 pt-2">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">Gantt Execution Chart</span>
        <div className="relative w-full h-12 bg-neutral-950 rounded-xl border border-white/10 p-1 flex overflow-hidden">
          {schedule.map((block, i) => {
            const widthPct = ((block.endTime - block.startTime) / maxTime) * 100;
            return (
              <div
                key={i}
                style={{ width: `${widthPct}%`, backgroundColor: block.color }}
                className="h-full flex items-center justify-center border-r border-neutral-950 text-white text-xs font-bold transition-all relative group"
                title={`${block.processId}: ${block.startTime}ms → ${block.endTime}ms`}
              >
                <span>{block.processId}</span>
                <span className="absolute bottom-0.5 right-1 text-[8px] opacity-75 font-mono">{block.endTime}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
          <span className="text-neutral-400 block text-[10px] uppercase font-bold">Average Waiting Time</span>
          <span className="text-lg font-black text-white">{avgWaiting} ms</span>
        </div>
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
          <span className="text-neutral-400 block text-[10px] uppercase font-bold">Average Turnaround Time</span>
          <span className="text-lg font-black text-white">{avgTurnaround} ms</span>
        </div>
      </div>
    </div>
  );
}
