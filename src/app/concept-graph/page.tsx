"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Network, Send, Zap, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateAIResponse, generateAIResponseStream } from "@/lib/groq";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type ConceptNode = {
  name: string;
  description: string;
  children?: ConceptNode[];
};

const GENERATE_GRAPH_PROMPT = `You are a Concept Graph Generator. 
The user will give you a topic. You must break it down into a hierarchical curriculum map.
Respond ONLY in perfectly formatted JSON matching this schema:
{
  "name": "Topic Name",
  "description": "Short description",
  "children": [
    { "name": "Subtopic 1", "description": "..." },
    { "name": "Subtopic 2", "description": "...", "children": [...] }
  ]
}
Keep it to a maximum depth of 3 levels to avoid overcrowding.`;

const EXPLAIN_NODE_PROMPT = `You are an AI Tutor. The student just clicked on a concept node in their knowledge graph.
Explain this concept in exactly 2 short, punchy paragraphs. Use analogies if helpful. Do not use markdown headers.`;

export default function ConceptGraph() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [graphData, setGraphData] = useState<ConceptNode | null>(null);
  
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [nodeExplanation, setNodeExplanation] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isGenerating) return;

    setIsGenerating(true);
    setGraphData(null);
    setActiveNode(null);

    try {
      const raw = await generateAIResponse(GENERATE_GRAPH_PROMPT, topic, 0.2);
      let cleanJson = raw;
      if (raw.includes("```json")) cleanJson = raw.split("```json")[1].split("```")[0].trim();
      else if (raw.includes("```")) cleanJson = raw.split("```")[1].split("```")[0].trim();
      
      setGraphData(JSON.parse(cleanJson));
    } catch (err) {
      console.error(err);
      alert("Failed to generate concept graph. Check your API limits or keys.");
    }
    setIsGenerating(false);
  };

  const handleNodeClick = async (node: ConceptNode) => {
    setActiveNode(node.name);
    setNodeExplanation("");
    setIsExplaining(true);
    
    try {
      const prompt = `Explain the concept of '${node.name}' in the context of '${graphData?.name}'. Description: ${node.description}`;
      const stream = generateAIResponseStream(EXPLAIN_NODE_PROMPT, prompt, 0.7);
      
      let res = "";
      for await (const chunk of stream) {
        res += chunk;
        setNodeExplanation(res);
      }
    } catch (err) {
      console.error(err);
      setNodeExplanation("Failed to load explanation.");
    }
    setIsExplaining(false);
  };

  // Recursive tree renderer using clean boxes & lines
  const renderTree = (node: ConceptNode, depth = 0) => {
    return (
      <div key={node.name} className="flex flex-col items-center">
        <button
          onClick={() => handleNodeClick(node)}
          className={cn(
            "relative z-10 px-4 py-2.5 rounded-xl border transition-all duration-150 shrink-0",
            activeNode === node.name
              ? "bg-[#ff6c37]/10 text-[#ff6c37] border-[#ff6c37] shadow-[0_0_20px_rgba(255,108,55,0.15)] scale-105 font-bold"
              : "bg-[#0b0b0b] border-white/5 text-neutral-300 hover:border-white/10 hover:text-white"
          )}
        >
          <span className="text-xs tracking-wide uppercase font-semibold">{node.name}</span>
        </button>
        
        {node.children && node.children.length > 0 && (
          <>
            <div className="w-px h-6 bg-white/5" />
            <div className="flex gap-4 border-t border-white/5 pt-4 relative mt-[-1px]">
              {node.children.map((child) => renderTree(child, depth + 1))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#040404] text-white flex flex-col select-none">
      
      {/* Header */}
      <header className="border-b border-white/5 bg-[#090909] py-4 z-50">
        <div className="container mx-auto px-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-neutral-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Network className="w-5 h-5 text-[#ff6c37]" />
              AI Concept Graph
            </h1>
            <p className="text-xs text-neutral-500">Break down courses into dynamic learning pathways.</p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col gap-6 p-6 overflow-hidden">
        
        {/* Prominent Search Prompt Bar (Central Focus) */}
        <section className={cn(
          "w-full transition-all duration-300 flex flex-col items-center justify-center shrink-0",
          graphData ? "mb-4" : "my-24"
        )}>
          {!graphData && (
            <div className="text-center mb-6 space-y-2">
              <span className="text-[11px] font-bold tracking-widest text-[#ff6c37] uppercase flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI KNOWLEDGE GRAPH
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Map Any Syllabus Instantly
              </h2>
              <p className="text-sm text-neutral-400 max-w-md mx-auto">
                Type any curriculum topic to dynamically compile a visual concept map.
              </p>
            </div>
          )}

          <form onSubmit={handleGenerate} className="w-full max-w-2xl flex gap-3 p-2.5 rounded-xl bg-[#101010] border border-white/10 shadow-2xl">
            <Input 
              placeholder="Enter a topic (e.g. Calculus, Machine Learning, React Native)" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-[15px] text-white placeholder:text-neutral-600 h-12 flex-1"
              disabled={isGenerating}
            />
            <Button 
              type="submit" 
              disabled={isGenerating || !topic.trim()}
              className="h-12 px-6 rounded-lg bg-[#ff6c37] hover:bg-[#ff8454] text-black font-bold transition-colors duration-150 shrink-0"
            >
              {isGenerating ? "Compiling Node Graph..." : "Generate Graph"}
            </Button>
          </form>
        </section>

        {/* Graph Display and Explanation side sheet */}
        <div className="flex-1 flex overflow-hidden rounded-xl border border-white/5 bg-[#0b0b0b]">
          
          {/* Main Visualizer screen */}
          <div className="flex-1 overflow-auto p-12 relative flex items-center justify-center min-h-[400px]">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-400 animate-pulse">
                <Network className="w-12 h-12 mb-4 text-[#ff6c37] opacity-60 animate-spin" />
                <p className="text-sm font-semibold">Generating concept node branches...</p>
              </div>
            ) : !graphData ? (
              <div className="text-neutral-500 text-sm font-medium">
                Enter a topic above to visualize its knowledge graph hierarchy.
              </div>
            ) : (
              <div className="min-w-max flex justify-center py-10 scale-105">
                {renderTree(graphData)}
              </div>
            )}
          </div>

          {/* Explanation panel sheet */}
          {activeNode && (
            <div className="w-96 border-l border-white/5 bg-[#101010]/80 backdrop-blur-md p-6 flex flex-col animate-in slide-in-from-right-8 z-20 shrink-0">
              <div className="flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <Zap className="w-5 h-5 text-[#ff6c37]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">{activeNode}</h2>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isExplaining ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-white/5 rounded w-full"></div>
                    <div className="h-4 bg-white/5 rounded w-5/6"></div>
                    <div className="h-4 bg-white/5 rounded w-4/6"></div>
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm text-neutral-400 leading-relaxed font-normal text-sm">
                    <ReactMarkdown>{nodeExplanation}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
