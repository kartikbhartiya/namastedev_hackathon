"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, Code2, Bot, LayoutTemplate, Activity, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateAIResponse } from "@/lib/groq";
import { cn } from "@/lib/utils";

type NodeItem = {
  id: string;
  val: string;
};

type LinkItem = {
  from: string;
  to: string;
  direction?: "forward" | "backward" | "both";
  type?: "left" | "right";
};

type PointerItem = {
  name: string;
  target?: string;
  index?: number;
};

type ExecutionState = {
  step: number;
  description: string;
  structureType?: "linked_list" | "binary_tree" | "array" | "graph" | "simple";
  activePointer?: string;
  variables: Record<string, string>;
  visualData?: {
    nodes?: NodeItem[];
    links?: LinkItem[];
    pointers?: PointerItem[];
    elements?: string[];
  };
};

type AIResponseData = {
  code: string;
  explanation: string;
  executionStates: ExecutionState[];
};

const SYSTEM_PROMPT = `You are an Agentic Code Execution environment. The user will ask you to write a common algorithm (e.g., Reverse Doubly Linked List, Binary Search, Tree Traversal).
You MUST respond with a perfectly formatted JSON object. DO NOT include markdown code blocks or any other text outside the JSON.
Keep your explanation short (1-2 sentences) and keep the code concise (under 15 lines if possible) to make the execution return instantly.
Restrict arrays to 4 elements maximum, trees to 4 nodes, and linked lists to 4 nodes.
You MUST generate exactly 8 to 12 execution states in the "executionStates" array to show the algorithm line-by-line.

Format:
{
  "code": "function algo() {\\n  ...\\n}",
  "explanation": "Brief explanation...",
  "executionStates": [
    {
      "step": 1,
      "description": "Step description",
      "structureType": "linked_list", // or "binary_tree", "array", "graph", "simple"
      "variables": {
        "curr": "2",
        "prev": "1"
      },
      "visualData": {
        "nodes": [ { "id": "1", "val": "10" }, { "id": "2", "val": "20" } ],
        "links": [ { "from": "1", "to": "2", "direction": "both" } ],
        "pointers": [ { "name": "curr", "target": "2" } ]
      }
    }
  ]
}

Structure definitions:
1. "linked_list" (Supports Singly & Doubly):
   - visualData.nodes: array of { "id": "...", "val": "..." }
   - visualData.links: array of { "from": "...", "to": "...", "direction": "forward" | "backward" | "both" }
   - visualData.pointers: array of { "name": "...", "target": "node_id" }
2. "binary_tree":
   - visualData.nodes: array of { "id": "...", "val": "..." }
   - visualData.links: array of { "from": "...", "to": "...", "type": "left" | "right" }
   - visualData.pointers: array of { "name": "...", "target": "node_id" }
3. "array":
   - visualData.elements: array of strings e.g. ["10", "20", "30"]
   - visualData.pointers: array of { "name": "...", "index": number_index }

Make the execution states highly accurate. If a linked list pointer is reversed in the code, reflect that by changing the 'direction' of the links in that step.`;

// SVG Marker definition helper
function SvgMarkers() {
  return (
    <svg className="absolute w-0 h-0">
      <defs>
        <marker id="arrow-forward" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#707070" />
        </marker>
        <marker id="arrow-forward-active" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#ff6c37" />
        </marker>
      </defs>
    </svg>
  );
}

// Custom code keyword highlighter with line numbering gutter
function HighlightedCode({ code }: { code: string }) {
  const lines = code.split("\n");
  
  const tokenizeLine = (line: string) => {
    // Check if whole line is comment
    if (line.trim().startsWith("//") || line.trim().startsWith("/*")) {
      return <span className="text-neutral-500 italic">{line}</span>;
    }

    // Split line by whitespaces and punctuation operators
    const tokens = line.split(/(\s+|=|;|\(|\)|\{|\}|\[|\]|\.|\+|-|\*|\/|,|<|>|!)/);
    
    return tokens.map((token, idx) => {
      const trimmed = token.trim();
      
      const keywords = [
        "function", "let", "const", "var", "if", "else", "for", 
        "while", "return", "class", "new", "this", "import", "export", "default"
      ];
      const builtins = [
        "null", "true", "false", "head", "curr", "prev", "next", "temp", "node"
      ];
      
      if (keywords.includes(trimmed)) {
        return <span key={idx} className="text-[#ff6c37] font-semibold">{token}</span>;
      }
      if (builtins.includes(trimmed)) {
        return <span key={idx} className="text-amber-500/90 font-semibold">{token}</span>;
      }
      if (/^\d+$/.test(trimmed)) {
        return <span key={idx} className="text-purple-400">{token}</span>;
      }
      if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return <span key={idx} className="text-emerald-500">{token}</span>;
      }
      
      return <span key={idx}>{token}</span>;
    });
  };

  return (
    <pre className="text-left font-mono text-xs md:text-sm leading-relaxed overflow-x-auto whitespace-pre text-neutral-200">
      <code>
        {lines.map((line, idx) => (
          <div key={idx} className="table-row">
            <span className="table-cell text-right pr-4 text-neutral-600 select-none text-[11px] w-6">{idx + 1}</span>
            <span className="table-cell">{tokenizeLine(line)}</span>
          </div>
        ))}
      </code>
    </pre>
  );
}

// 1. Fully Dynamic Linked List Visualizer
function LinkedListVisualizer({ nodes, links, pointers }: { nodes: NodeItem[]; links: LinkItem[]; pointers: PointerItem[] }) {
  if (!nodes || nodes.length === 0) return <div className="text-neutral-600 text-xs font-mono">No nodes</div>;

  const spacing = 75;
  const startX = 40;
  const y = 50;

  const coords = nodes.reduce((acc, node, idx) => {
    acc[node.id] = { x: startX + idx * spacing, y };
    return acc;
  }, {} as Record<string, { x: number; y: number }>);

  const pointersByTarget = (pointers || []).reduce((acc, ptr) => {
    if (ptr.target) {
      acc[ptr.target] = acc[ptr.target] || [];
      acc[ptr.target].push(ptr.name);
    }
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <div className="relative w-full overflow-x-auto flex justify-center py-6 select-none">
      <SvgMarkers />
      <svg className="w-[340px] h-[120px] overflow-visible text-white" viewBox="0 0 340 120">
        
        {links.map((link, idx) => {
          const fromCoord = coords[link.from];
          const toCoord = coords[link.to];
          if (!fromCoord || !toCoord) return null;

          const isDoubly = link.direction === "both";
          const isBackward = link.direction === "backward";
          const isForward = link.direction === "forward" || !link.direction;

          return (
            <g key={idx}>
              {/* Forward arrow */}
              {(isForward || isDoubly) && (
                <path
                  d={`M ${fromCoord.x} ${fromCoord.y - 2} L ${toCoord.x} ${toCoord.y - 2}`}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrow-forward)"
                />
              )}
              {/* Backward arrow */}
              {(isBackward || isDoubly) && (
                <path
                  d={`M ${toCoord.x} ${toCoord.y + 2} L ${fromCoord.x} ${fromCoord.y + 2}`}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrow-forward)"
                />
              )}
            </g>
          );
        })}

        {nodes.map((node) => {
          const coord = coords[node.id];
          if (!coord) return null;
          
          const nodePointers = pointersByTarget[node.id] || [];
          const hasActivePointer = nodePointers.length > 0;

          return (
            <g key={node.id}>
              <circle
                cx={coord.x}
                cy={coord.y}
                r="15"
                fill={hasActivePointer ? "rgba(255,108,55,0.1)" : "#101010"}
                stroke={hasActivePointer ? "#ff6c37" : "rgba(255,255,255,0.06)"}
                strokeWidth="2"
              />
              <text
                x={coord.x}
                y={coord.y + 4}
                textAnchor="middle"
                className={cn("font-mono text-[9px] font-bold fill-neutral-400", hasActivePointer && "fill-[#ff6c37]")}
              >
                {node.val}
              </text>

              {nodePointers.map((ptrName, pIdx) => (
                <text
                  key={ptrName}
                  x={coord.x}
                  y={coord.y + 28 + pIdx * 10}
                  textAnchor="middle"
                  className="font-mono text-[8px] font-black fill-[#ff6c37] uppercase tracking-wider"
                >
                  ↑ {ptrName}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// 2. Fully Dynamic Tree Visualizer
function BinaryTreeVisualizer({ nodes, links, pointers }: { nodes: NodeItem[]; links: LinkItem[]; pointers: PointerItem[] }) {
  if (!nodes || nodes.length === 0) return <div className="text-neutral-600 text-xs font-mono">No nodes</div>;

  const nodeCoords: Record<string, { x: number; y: number }> = {};
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

  const traverse = (nodeId: string, x: number, y: number, spread: number) => {
    nodeCoords[nodeId] = { x, y };

    const leftLink = (links || []).find(l => l.from === nodeId && l.type === "left");
    if (leftLink) {
      const nextX = x - spread;
      const nextY = y + 50;
      lines.push({ x1: x, y1: y, x2: nextX, y2: nextY });
      traverse(leftLink.to, nextX, nextY, spread * 0.5);
    }

    const rightLink = (links || []).find(l => l.from === nodeId && l.type === "right");
    if (rightLink) {
      const nextX = x + spread;
      const nextY = y + 50;
      lines.push({ x1: x, y1: y, x2: nextX, y2: nextY });
      traverse(rightLink.to, nextX, nextY, spread * 0.5);
    }
  };

  const rootNode = nodes.find(n => !(links || []).some(l => l.to === n.id)) || nodes[0];
  traverse(rootNode.id, 150, 25, 60);

  const pointersByTarget = (pointers || []).reduce((acc, ptr) => {
    if (ptr.target) {
      acc[ptr.target] = acc[ptr.target] || [];
      acc[ptr.target].push(ptr.name);
    }
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <svg className="w-80 h-52 mx-auto text-white overflow-visible select-none" viewBox="0 0 300 200">
      {lines.map((line, idx) => (
        <line
          key={idx}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1.5"
        />
      ))}

      {nodes.map((node) => {
        const coord = nodeCoords[node.id];
        if (!coord) return null;

        const nodePointers = pointersByTarget[node.id] || [];
        const hasActivePointer = nodePointers.length > 0;

        return (
          <g key={node.id}>
            <circle
              cx={coord.x}
              cy={coord.y}
              r="13"
              fill={hasActivePointer ? "rgba(255,108,55,0.1)" : "#101010"}
              stroke={hasActivePointer ? "#ff6c37" : "rgba(255,255,255,0.05)"}
              strokeWidth="2"
            />
            <text
              x={coord.x}
              y={coord.y + 4}
              textAnchor="middle"
              className={cn("font-mono text-[9px] font-bold fill-neutral-400", hasActivePointer && "fill-[#ff6c37]")}
            >
              {node.val}
            </text>

            {nodePointers.map((ptrName, pIdx) => (
              <text
                key={ptrName}
                x={coord.x}
                y={coord.y - 18 - pIdx * 10}
                textAnchor="middle"
                className="font-mono text-[8px] font-black fill-[#ff6c37] uppercase tracking-wider"
              >
                {ptrName}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// 3. Fully Dynamic Array Visualizer
function ArrayVisualizer({ elements, pointers }: { elements: string[]; pointers: PointerItem[] }) {
  if (!elements || elements.length === 0) return <div className="text-neutral-600 text-xs font-mono">No elements</div>;

  const pointersByIndex = (pointers || []).reduce((acc, ptr) => {
    if (ptr.index !== undefined) {
      acc[ptr.index] = acc[ptr.index] || [];
      acc[ptr.index].push(ptr.name);
    }
    return acc;
  }, {} as Record<number, string[]>);

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full select-none">
      <div className="flex items-center justify-center border border-white/5 rounded-lg overflow-hidden bg-[#101010] divide-x divide-white/5">
        {elements.map((val, idx) => {
          const idxPointers = pointersByIndex[idx] || [];
          const hasActivePointer = idxPointers.length > 0;
          return (
            <div
              key={idx}
              className={cn(
                "w-12 h-12 flex flex-col items-center justify-center relative font-mono transition-all duration-150 shrink-0",
                hasActivePointer ? "bg-[#ff6c37]/10 text-[#ff6c37] font-bold" : "text-white"
              )}
            >
              <span className="text-[9px] text-neutral-600 absolute top-1 left-1.5 select-none">{idx}</span>
              <span className="text-xs mt-1.5">{val}</span>
              
              {idxPointers.map((ptrName, pIdx) => (
                <span 
                  key={ptrName}
                  style={{ bottom: `-${24 + pIdx * 10}px` }}
                  className="absolute font-mono text-[8px] font-black text-[#ff6c37] uppercase tracking-wider whitespace-nowrap"
                >
                  ↑ {ptrName}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 4. Graph Visualizer Component
function GraphVisualizer({ nodes, edges, pointers }: { nodes: NodeItem[]; edges: [string, string][]; pointers: PointerItem[] }) {
  if (!nodes || nodes.length === 0) return <div className="text-neutral-600 text-xs font-mono">No nodes</div>;

  const radius = 55;
  const cx = 150;
  const cy = 90;
  const coords = nodes.reduce((acc, node, idx) => {
    const angle = (idx / nodes.length) * 2 * Math.PI - Math.PI / 2;
    acc[node.id] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
    return acc;
  }, {} as Record<string, { x: number; y: number }>);

  const pointersByTarget = (pointers || []).reduce((acc, ptr) => {
    if (ptr.target) {
      acc[ptr.target] = acc[ptr.target] || [];
      acc[ptr.target].push(ptr.name);
    }
    return acc;
  }, {} as Record<string, string[]>);

  return (
    <svg className="w-80 h-48 mx-auto text-white overflow-visible select-none" viewBox="0 0 300 180">
      {edges.map(([u, v], idx) => {
        const uCoord = coords[u];
        const vCoord = coords[v];
        if (!uCoord || !vCoord) return null;
        return (
          <line
            key={idx}
            x1={uCoord.x}
            y1={uCoord.y}
            x2={vCoord.x}
            y2={vCoord.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1.5"
          />
        );
      })}

      {nodes.map((node) => {
        const coord = coords[node.id];
        if (!coord) return null;

        const nodePointers = pointersByTarget[node.id] || [];
        const hasActivePointer = nodePointers.length > 0;

        return (
          <g key={node.id}>
            <circle
              cx={coord.x}
              cy={coord.y}
              r="13"
              fill={hasActivePointer ? "rgba(255,108,55,0.1)" : "#101010"}
              stroke={hasActivePointer ? "#ff6c37" : "rgba(255,255,255,0.05)"}
              strokeWidth="2"
            />
            <text
              x={coord.x}
              y={coord.y + 4}
              textAnchor="middle"
              className={cn("font-mono text-[9px] font-bold fill-neutral-400", hasActivePointer && "fill-[#ff6c37]")}
            >
              {node.val}
            </text>

            {nodePointers.map((ptrName, pIdx) => (
              <text
                key={ptrName}
                x={coord.x}
                y={coord.y - 18 - pIdx * 10}
                textAnchor="middle"
                className="font-mono text-[8px] font-black fill-[#ff6c37] uppercase tracking-wider"
              >
                {ptrName}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export default function CodeExecutionMode() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AIResponseData | null>(null);
  
  // Animation play states
  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && data && activeStep < data.executionStates.length - 1) {
      timer = setTimeout(() => {
        setActiveStep(prev => prev + 1);
      }, 1500);
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

  // Play controls
  const handlePlayToggle = () => {
    if (activeStep >= (data?.executionStates.length || 0) - 1) {
      setActiveStep(0); // restart
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handlePrevStep = () => {
    setIsPlaying(false);
    setActiveStep(prev => Math.max(0, prev - 1));
  };

  const handleNextStep = () => {
    setIsPlaying(false);
    if (data) {
      setActiveStep(prev => Math.min(data.executionStates.length - 1, prev + 1));
    }
  };

  // Helper variables setup
  const activeState = data ? data.executionStates[activeStep] : null;
  const structureType = activeState?.structureType || "simple";
  const visualData = activeState?.visualData || {};

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
        
        {/* Prominent Search Prompt Bar */}
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

        {data && activeState && (
          <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 w-full animate-fade-up">
            
            {/* AI Code Generator panel */}
            <div className="flex flex-col rounded-xl border border-white/5 overflow-hidden bg-[#0b0b0b]">
              <div className="bg-[#101010] px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-neutral-500" />
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">AI Generated Code</span>
              </div>
              
              <div className="flex-1 p-6 overflow-auto max-h-[500px]">
                <HighlightedCode code={data.code} />
              </div>
              
              <div className="bg-[#101010] p-5 border-t border-white/5">
                <div className="flex gap-3 text-sm">
                  <Bot className="w-5 h-5 text-[#ff6c37] shrink-0" />
                  <p className="text-neutral-400 leading-relaxed text-[13px]">{data.explanation}</p>
                </div>
              </div>
            </div>

            {/* Visualizer Panel with dynamic shapes */}
            <div className="flex flex-col rounded-xl border border-white/5 overflow-hidden bg-[#0b0b0b] relative">
              <div className="bg-[#101010] px-5 py-3.5 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-neutral-500" />
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Execution Visualizer</span>
                </div>

                {/* Slideshow Player Control Panel */}
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handlePrevStep}
                    disabled={activeStep <= 0}
                    className="h-8 w-8 text-neutral-400 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePlayToggle}
                    className="h-8 min-w-[70px] border-white/5 bg-transparent hover:bg-white/5 text-xs text-white flex items-center gap-1.5"
                  >
                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    {isPlaying ? "Pause" : "Play"}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleNextStep}
                    disabled={activeStep >= data.executionStates.length - 1}
                    className="h-8 w-8 text-neutral-400 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 p-6 flex flex-col justify-between min-h-[440px]">
                
                {/* Step Info */}
                <div className="text-center space-y-2 mt-2">
                  <span className="text-[10px] font-black text-[#ff6c37] uppercase tracking-widest">
                    Step {activeStep + 1} of {data.executionStates.length}
                  </span>
                  <h3 className="text-sm font-semibold text-white tracking-tight">{activeState.description}</h3>
                </div>

                {/* Dynamic visualizer shape canvas */}
                <div className="my-6 py-4 flex justify-center items-center min-h-[220px] border border-white/5 rounded-xl bg-black/20">
                  {structureType === "linked_list" && (
                    <LinkedListVisualizer 
                      nodes={visualData.nodes || []} 
                      links={visualData.links || []}
                      pointers={visualData.pointers || []} 
                    />
                  )}
                  {structureType === "binary_tree" && (
                    <BinaryTreeVisualizer 
                      nodes={visualData.nodes || []} 
                      links={visualData.links || []}
                      pointers={visualData.pointers || []}
                    />
                  )}
                  {structureType === "array" && (
                    <ArrayVisualizer 
                      elements={visualData.elements || []} 
                      pointers={visualData.pointers || []} 
                    />
                  )}
                  {structureType === "graph" && (
                    <GraphVisualizer 
                      nodes={visualData.nodes || []} 
                      edges={(visualData as any).edges || []}
                      pointers={visualData.pointers || []} 
                    />
                  )}
                  {structureType === "simple" && (
                    <div className="text-neutral-500 text-xs font-mono">Simple state variables representation.</div>
                  )}
                </div>

                {/* Pointer variables list */}
                <div className="space-y-3 w-full max-w-sm mx-auto">
                  {Object.entries(activeState.variables || {}).map(([key, value]) => {
                    const isPointer = (visualData.pointers || []).some(p => p.name.toLowerCase() === key.toLowerCase());
                    return (
                      <div 
                        key={key} 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-all duration-150",
                          isPointer 
                            ? "bg-[#ff6c37]/5 border-[#ff6c37]/20" 
                            : "bg-[#101010] border-white/5"
                        )}
                      >
                        <span className="font-mono text-xs text-neutral-400">{key}</span>
                        <span className={cn("font-mono text-xs font-bold", isPointer ? "text-[#ff6c37]" : "text-white")}>
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress bar tracker */}
                <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden mt-8 max-w-md mx-auto">
                  <div 
                    className="bg-[#ff6c37] h-full transition-all duration-300"
                    style={{ width: `${((activeStep + 1) / data.executionStates.length) * 100}%` }}
                  />
                </div>

              </div>
            </div>

          </main>
        )}
      </div>

    </div>
  );
}
