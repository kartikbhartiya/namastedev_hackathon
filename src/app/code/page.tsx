"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Code2, Bot, LayoutTemplate, Activity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateAIResponse } from "@/lib/groq";
import { cn } from "@/lib/utils";

type ExecutionState = {
  step: number;
  description: string;
  variables: Record<string, string>;
};

type AIResponseData = {
  code: string;
  explanation: string;
  executionStates: ExecutionState[];
};

const SYSTEM_PROMPT = `You are an Agentic Code Execution environment. The user will ask you to write a common algorithm (e.g., Reverse Linked List, Binary Search). 
You MUST respond with a perfectly formatted JSON object. DO NOT include markdown code blocks or any other text outside the JSON.
Format:
{
  "code": "function algo() {\\n  // line 1\\n  // line 2\\n}",
  "explanation": "Brief explanation...",
  "executionStates": [
    { 
      "step": 1, 
      "description": "Initial state", 
      "variables": { 
        "head": "1 -> 2 -> 3 -> null",
        "curr": "1",
        "nums": "[1, 3, 5, 7, 9]",
        "low": "0",
        "high": "4",
        "mid": "2"
      } 
    }
  ]
}
Make the execution states detailed (at least 4-5 steps) simulating the loop or recursion. Make sure the code property contains actual newlines (\\n) for line breaks so it formats correctly.`;

export default function CodeExecutionMode() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AIResponseData | null>(null);
  
  // Animation state
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && data && activeStep < data.executionStates.length - 1) {
      timer = setTimeout(() => {
        setActiveStep(prev => prev + 1);
      }, 1500); // 1.5 seconds per step
    } else if (activeStep >= (data?.executionStates.length || 0) - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, activeStep, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setData(null);
    setActiveStep(-1);
    setIsPlaying(false);

    try {
      const raw = await generateAIResponse(SYSTEM_PROMPT, input.trim(), 0.1);
      
      // Clean potential markdown blocks
      let cleanJson = raw;
      if (raw.includes("```json")) {
        cleanJson = raw.split("```json")[1].split("```")[0].trim();
      } else if (raw.includes("```")) {
        cleanJson = raw.split("```")[1].split("```")[0].trim();
      }

      const parsed = JSON.parse(cleanJson) as AIResponseData;
      setData(parsed);
      setActiveStep(0);
    } catch (error) {
      console.error(error);
      alert("Failed to parse AI execution state. Please try another algorithm.");
    }
    setIsLoading(false);
  };

  const handlePlay = () => {
    if (activeStep >= (data?.executionStates.length || 0) - 1) {
      setActiveStep(0); // restart
    }
    setIsPlaying(true);
  };

  // Helper to render variables with custom visual markers
  const renderVariableValue = (key: string, value: string) => {
    const isPointer = ["curr", "current", "mid", "pivot", "temp", "node", "head"].includes(key.toLowerCase());
    
    // 1. Linked List notation
    if (typeof value === "string" && value.includes("->")) {
      const nodes = value.split("->").map(n => n.trim());
      return (
        <div className="flex items-center gap-1.5 flex-wrap">
          {nodes.map((node, idx) => {
            const isNull = node.toLowerCase() === "null";
            // Highlight node if it matches a pointer's value (e.g. if node === current pointer's value)
            const isHighlighted = isPointer || ["1", "2", "3", "curr", "head"].includes(node.toLowerCase());
            return (
              <div key={idx} className="flex items-center gap-1.5 shrink-0">
                <span
                  className={cn(
                    "font-mono text-xs px-2.5 py-1.5 rounded-lg border",
                    isNull
                      ? "bg-white/5 border-white/5 text-neutral-500"
                      : isPointer
                      ? "bg-[#ff6c37]/10 border-[#ff6c37]/20 text-[#ff6c37] font-semibold"
                      : "bg-[#101010] border-white/5 text-white"
                  )}
                >
                  {node}
                </span>
                {idx < nodes.length - 1 && <span className="text-neutral-600 text-xs">→</span>}
              </div>
            );
          })}
        </div>
      );
    }

    // 2. Array notation
    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      const items = value.slice(1, -1).split(",").map(i => i.trim());
      return (
        <div className="flex items-center gap-1 shrink-0">
          {items.map((item, idx) => (
            <span
              key={idx}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border font-mono text-xs",
                isPointer
                  ? "bg-[#ff6c37]/10 border-[#ff6c37]/20 text-[#ff6c37] font-bold"
                  : "bg-[#101010] border-white/5 text-white"
              )}
            >
              {item}
            </span>
          ))}
        </div>
      );
    }

    // Default variable box
    return (
      <span className={cn(
        "font-mono text-sm font-semibold",
        isPointer ? "text-[#ff6c37]" : "text-white"
      )}>
        {value}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#040404] text-white flex flex-col select-none">
      
      {/* Header bar */}
      <header className="border-b border-white/5 bg-[#090909] py-4">
        <div className="container mx-auto px-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-neutral-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Code2 className="w-5 h-5 text-[#ff6c37]" />
              Code Execution Tracer
            </h1>
            <p className="text-xs text-neutral-500">Trace Stack Frames & Variables.</p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 container mx-auto px-6 py-10 flex flex-col gap-10 max-w-6xl">
        
        {/* Prominent Search Prompt Bar (Central Focus) */}
        <section className={cn(
          "w-full transition-all duration-300 flex flex-col items-center justify-center",
          data ? "mb-0" : "my-20"
        )}>
          {!data && (
            <div className="text-center mb-6 space-y-2">
              <span className="text-[11px] font-bold tracking-widest text-[#ff6c37] uppercase flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI MEMORY STACK TRACER
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Visualize Stack Frames & Variables
              </h2>
              <p className="text-sm text-neutral-400 max-w-md mx-auto">
                Type any algorithm to generate code and visualize execution states step-by-step.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full max-w-2xl flex gap-3 p-2.5 rounded-xl bg-[#101010] border border-white/10 shadow-2xl">
            <Input 
              placeholder="e.g. Reverse a singly linked list" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] text-white placeholder:text-neutral-600 h-12 flex-1"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="h-12 px-6 rounded-lg bg-[#ff6c37] hover:bg-[#ff8454] text-black font-bold transition-colors duration-150 shrink-0"
            >
              {isLoading ? "Generating Trace..." : "Trace Algorithm"}
            </Button>
          </form>
        </section>

        {data && (
          <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full animate-fade-up">
            
            {/* AI Code Generator panel */}
            <div className="flex flex-col rounded-xl border border-white/5 overflow-hidden bg-[#0b0b0b]">
              <div className="bg-[#101010] px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-neutral-500" />
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">AI Generated Code</span>
              </div>
              
              {/* Formatted Code Block wrapper */}
              <div className="flex-1 p-6 overflow-auto max-h-[500px]">
                <pre className="text-left font-mono text-sm leading-relaxed overflow-x-auto whitespace-pre text-neutral-200">
                  <code>{data.code}</code>
                </pre>
              </div>
              
              <div className="bg-[#101010] p-5 border-t border-white/5">
                <div className="flex gap-3 text-sm">
                  <Bot className="w-5 h-5 text-[#ff6c37] shrink-0" />
                  <p className="text-neutral-400 leading-relaxed text-[13px]">{data.explanation}</p>
                </div>
              </div>
            </div>

            {/* Visualizer Panel */}
            <div className="flex flex-col rounded-xl border border-white/5 overflow-hidden bg-[#0b0b0b] relative">
              <div className="bg-[#101010] px-5 py-3.5 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-neutral-500" />
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Execution Visualizer</span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 gap-2 border-white/5 bg-transparent hover:bg-white/5 text-xs text-white"
                  onClick={handlePlay}
                  disabled={isPlaying}
                >
                  <Play className="w-3 h-3" /> {isPlaying ? "Simulating..." : activeStep === data.executionStates.length - 1 ? "Restart" : "Simulate Exec"}
                </Button>
              </div>
              
              <div className="flex-1 p-6 flex flex-col justify-center min-h-[400px]">
                <div className="w-full space-y-8 max-w-md mx-auto">
                  <div className="text-center space-y-2">
                    <span className="text-[10px] font-black text-[#ff6c37] uppercase tracking-widest">
                      Step {activeStep + 1} of {data.executionStates.length}
                    </span>
                    <h3 className="text-[16px] font-semibold text-white tracking-tight">{data.executionStates[activeStep]?.description}</h3>
                  </div>

                  {/* Dynamic Pointer variables view */}
                  <div className="space-y-4">
                    {Object.entries(data.executionStates[activeStep]?.variables || {}).map(([key, value]) => {
                      const isPointer = ["curr", "current", "mid", "pivot", "temp", "node", "head"].includes(key.toLowerCase());
                      return (
                        <div 
                          key={key} 
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-all duration-150",
                            isPointer 
                              ? "bg-[#ff6c37]/5 border-[#ff6c37]/20" 
                              : "bg-[#101010] border-white/5"
                          )}
                        >
                          <span className="font-mono text-xs text-neutral-400">{key}</span>
                          {renderVariableValue(key, value)}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Progress tracker line */}
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mt-8">
                    <div 
                      className="bg-[#ff6c37] h-full transition-all duration-300"
                      style={{ width: `${((activeStep + 1) / data.executionStates.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </main>
        )}
      </div>

    </div>
  );
}
