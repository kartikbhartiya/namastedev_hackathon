"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layers, ArrowRight, RotateCcw, Plus, Trash } from "lucide-react";
import { cn } from "@/lib/utils";

export function StackQueueSim() {
  const [structure, setStructure] = useState<"stack" | "queue">("stack");
  const [items, setItems] = useState<string[]>(["0x4F (main)", "0x2A (eval)", "0x91 (calc)"]);
  const [inputValue, setInputValue] = useState("");

  const handlePush = () => {
    if (!inputValue.trim()) return;
    if (structure === "stack") {
      setItems([inputValue.trim(), ...items]);
    } else {
      setItems([...items, inputValue.trim()]);
    }
    setInputValue("");
  };

  const handlePop = () => {
    if (items.length === 0) return;
    if (structure === "stack") {
      setItems(items.slice(1));
    } else {
      setItems(items.slice(1));
    }
  };

  const handleClear = () => {
    setItems([]);
  };

  return (
    <div className="p-5 bg-neutral-900/90 border border-white/10 rounded-2xl space-y-4 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" /> Stack (LIFO) & Queue (FIFO) Memory Simulator
          </h3>
          <p className="text-xs text-neutral-400">Visualize call stacks, recursion frames, and message queue buffer behavior</p>
        </div>
      </div>

      {/* Switcher */}
      <div className="flex items-center justify-between bg-neutral-950 p-2 rounded-xl border border-white/5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setStructure("stack"); setItems(["0x4F (main)", "0x2A (eval)", "0x91 (calc)"]); }}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              structure === "stack" ? "bg-purple-600 text-white shadow" : "bg-white/5 text-neutral-400 hover:text-white"
            )}
          >
            📚 Call Stack (LIFO)
          </button>
          <button
            onClick={() => { setStructure("queue"); setItems(["0x01 (Task A)", "0x02 (Task B)", "0x03 (Task C)"]); }}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
              structure === "queue" ? "bg-cyan-600 text-white shadow" : "bg-white/5 text-neutral-400 hover:text-white"
            )}
          >
            📥 Buffer Queue (FIFO)
          </button>
        </div>

        <span className="text-[10px] font-mono text-neutral-400 px-2 py-1 rounded bg-white/5">
          {structure === "stack" ? "Last-In, First-Out" : "First-In, First-Out"}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={structure === "stack" ? "Push element (e.g. 0xFE)..." : "Enqueue element..."}
          className="bg-neutral-950 border-white/10 text-white text-xs h-10 flex-1 rounded-xl"
        />
        <Button
          onClick={handlePush}
          disabled={!inputValue.trim()}
          className="h-10 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl px-4"
        >
          <Plus className="w-4 h-4 mr-1" /> {structure === "stack" ? "Push Top" : "Enqueue Tail"}
        </Button>
        <Button
          onClick={handlePop}
          disabled={items.length === 0}
          variant="outline"
          className="h-10 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold text-xs rounded-xl px-4"
        >
          <Trash className="w-4 h-4 mr-1" /> {structure === "stack" ? "Pop Top" : "Dequeue Head"}
        </Button>
      </div>

      {/* Dynamic Memory Display */}
      <div className="p-6 bg-neutral-950 rounded-xl border border-white/5 min-h-[160px] flex flex-col items-center justify-center relative">
        {structure === "stack" ? (
          /* Stack Vertical Representation */
          <div className="flex flex-col items-center space-y-2 w-full max-w-md">
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">▲ TOP (Stack Pointer SP)</span>
            {items.length === 0 ? (
              <span className="text-xs text-neutral-600 italic py-6">Stack Underflow — Empty</span>
            ) : (
              items.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-full py-2.5 px-4 rounded-xl border text-xs font-mono text-center transition-all duration-300 flex items-center justify-between",
                    idx === 0
                      ? "bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold shadow-lg shadow-purple-500/10"
                      : "bg-white/[0.03] border-white/10 text-neutral-300"
                  )}
                >
                  <span className="text-[10px] text-neutral-500">[{items.length - 1 - idx}]</span>
                  <span>{item}</span>
                  {idx === 0 && <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded font-sans">TOP</span>}
                </div>
              ))
            )}
            <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-widest">▼ BOTTOM (Base Pointer BP)</span>
          </div>
        ) : (
          /* Queue Horizontal Representation */
          <div className="flex flex-col items-center space-y-3 w-full">
            <div className="flex items-center justify-between w-full text-[10px] font-mono text-neutral-400">
              <span className="text-emerald-400 font-bold">◄ HEAD (Dequeue)</span>
              <span className="text-cyan-400 font-bold">TAIL (Enqueue) ►</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto w-full py-2 px-1">
              {items.length === 0 ? (
                <span className="text-xs text-neutral-600 italic mx-auto py-6">Queue Empty</span>
              ) : (
                items.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "min-w-[100px] py-3 px-4 rounded-xl border text-xs font-mono text-center transition-all shrink-0 flex flex-col items-center gap-1",
                      idx === 0
                        ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold"
                        : idx === items.length - 1
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold"
                          : "bg-white/[0.03] border-white/10 text-neutral-300"
                    )}
                  >
                    <span>{item}</span>
                    <span className="text-[9px] text-neutral-500">[{idx}]</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
