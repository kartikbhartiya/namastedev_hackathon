"use client";

import { useState, useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Plus, Presentation, Target, Clock, Trash2, Search, Download, Loader2, BarChart2, Code2, Sparkles } from "lucide-react";
import { useRecentPitches, type SavedSIHPitch } from "@/lib/useRecentPitches";
import { SIH_COLOR_THEMES } from "@/lib/sihPptGenerator";
import { buildSIHPresentation } from "@/lib/sihPptBuilder";

interface SIHWorkspaceProps {
  onCreateNew: () => void;
  onOpenPitch: (pitch: SavedSIHPitch) => void;
}

// --------------------------------------------------------
// 3D Magnetic Pitch Card Component
// --------------------------------------------------------
function PitchCard({ 
  pitch, 
  onDelete, 
  onOpen, 
  onDownload 
}: { 
  pitch: SavedSIHPitch; 
  onDelete: (id: string) => void; 
  onOpen: (p: SavedSIHPitch) => void; 
  onDownload: (p: SavedSIHPitch) => Promise<void>;
}) {
  const themeDef = SIH_COLOR_THEMES.find(t => t.name === pitch.formData.theme) || SIH_COLOR_THEMES[0];
  const date = new Date(pitch.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const [isHovered, setIsHovered] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!pitch.generatedContent) return;
    setDownloading(true);
    try {
      await onDownload(pitch);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ perspective: "1000px" }} className="w-full">
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        onClick={() => onOpen(pitch)}
        className="group relative bg-[#0b0b0b] rounded-2xl border border-white/10 hover:border-white/20 transition-colors flex flex-col h-[280px] cursor-pointer"
      >
        {/* Glow effect behind the card content */}
        <div 
          className="absolute inset-0 z-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
          style={{ background: `radial-gradient(circle at 50% 50%, ${themeDef.preview}20 0%, transparent 60%)` }}
        />

        {/* Content Container (elevated for 3D effect) */}
        <div className="relative z-10 flex flex-col h-full bg-[#0a0a0a]/90 backdrop-blur-md rounded-2xl overflow-hidden" style={{ transform: "translateZ(30px)" }}>
          {/* Color Banner */}
          <div className="h-2 w-full transition-all duration-300 group-hover:h-3" style={{ backgroundColor: themeDef.preview }} />
          
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <Clock className="w-3 h-3" /> {date}
              </span>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this pitch?")) onDelete(pitch.id);
                }}
                className="text-neutral-600 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-white leading-tight mb-2 line-clamp-2">
              {pitch.formData.problemStatementTitle || "Untitled Pitch"}
            </h3>
            
            <p className="text-sm text-neutral-500 mb-4 line-clamp-1">
              PSID: {pitch.formData.problemStatementId || "N/A"}
            </p>

            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
              {pitch.gradeResult ? (
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-white">
                    {pitch.gradeResult.overallScore}<span className="text-neutral-500">/10</span>
                  </span>
                </div>
              ) : (
                <span className="text-xs text-neutral-600 font-medium italic">Not Graded</span>
              )}
              
              <div className="flex gap-2">
                {pitch.generatedContent && (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    title="Quick Download PPTX"
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button
                  className="px-4 py-1.5 rounded-lg bg-white/10 group-hover:bg-[#ff6c37] group-hover:text-black text-white text-xs font-bold transition-all"
                >
                  Open
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --------------------------------------------------------
// Main Dashboard Workspace
// --------------------------------------------------------
export function SIHWorkspace({ onCreateNew, onOpenPitch }: SIHWorkspaceProps) {
  const { pitches, isLoaded, deletePitch } = useRecentPitches();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPitches = useMemo(() => {
    if (!searchQuery.trim()) return pitches;
    const query = searchQuery.toLowerCase();
    return pitches.filter(p => 
      p.formData.problemStatementTitle.toLowerCase().includes(query) ||
      p.formData.problemStatementId.toLowerCase().includes(query) ||
      p.formData.techStack.some(t => t.toLowerCase().includes(query))
    );
  }, [pitches, searchQuery]);

  // Analytics Derivations
  const stats = useMemo(() => {
    let gradedCount = 0;
    let totalScore = 0;
    const techCount: Record<string, number> = {};

    pitches.forEach(p => {
      if (p.gradeResult) {
        gradedCount++;
        totalScore += p.gradeResult.overallScore;
      }
      p.formData.techStack.forEach(t => {
        techCount[t] = (techCount[t] || 0) + 1;
      });
    });

    const avgScore = gradedCount > 0 ? (totalScore / gradedCount).toFixed(1) : "N/A";
    let topTech = "None";
    let maxTechCount = 0;
    for (const [tech, count] of Object.entries(techCount)) {
      if (count > maxTechCount) {
        topTech = tech;
        maxTechCount = count;
      }
    }

    return { avgScore, topTech, totalGenerated: pitches.filter(p => !!p.generatedContent).length };
  }, [pitches]);

  const handleQuickDownload = async (pitch: SavedSIHPitch) => {
    if (!pitch.generatedContent) return;
    const themeDef = SIH_COLOR_THEMES.find(t => t.name === pitch.formData.theme) || SIH_COLOR_THEMES[0];
    await buildSIHPresentation(pitch.generatedContent, themeDef.name);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#040404] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#ff6c37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040404] text-white overflow-hidden relative">
      {/* Background Noise & Grid */}
      <div className="absolute inset-0 z-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-4 flex items-center gap-4">
              SIH <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff6c37] to-[#ffaa37]">Workspace</span>
            </h1>
            <p className="text-neutral-400 text-lg max-w-2xl font-medium">
              Your command center for orchestrating winning hackathon presentations.
            </p>
          </div>

          {/* Quick Stats Mini-Dashboard */}
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 backdrop-blur-sm">
              <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider mb-1 flex items-center gap-1.5"><Target className="w-3 h-3 text-indigo-400" /> Avg Score</p>
              <p className="text-2xl font-black text-white">{stats.avgScore}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 backdrop-blur-sm hidden sm:block">
              <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider mb-1 flex items-center gap-1.5"><Code2 className="w-3 h-3 text-emerald-400" /> Top Tech</p>
              <p className="text-2xl font-black text-white capitalize">{stats.topTech}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-3 backdrop-blur-sm">
              <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider mb-1 flex items-center gap-1.5"><Presentation className="w-3 h-3 text-[#ff6c37]" /> PPTs</p>
              <p className="text-2xl font-black text-white">{stats.totalGenerated}</p>
            </div>
          </div>
        </div>

        {/* Action Bar (Search & Create) */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <button
            onClick={onCreateNew}
            className="group relative h-14 px-8 rounded-xl bg-gradient-to-r from-[#ff6c37] to-[#ff8c5a] hover:from-[#ff8454] hover:to-[#ffa070] text-black font-bold text-base transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_-10px_#ff6c37] hover:shadow-[0_0_60px_-15px_#ff6c37] shrink-0"
          >
            <Sparkles className="w-5 h-5" />
            Create New Pitch
          </button>
          
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input 
              type="text"
              placeholder="Search by title, PS ID, or tech stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-xl bg-[#0b0b0b] border border-white/10 focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/20 outline-none text-white placeholder:text-neutral-600 transition-all backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Presentation className="w-5 h-5 text-neutral-400" />
            Recent Pitches
          </h2>
          
          {pitches.length === 0 ? (
            <div className="h-72 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-6 bg-white/[0.02]">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <Presentation className="w-10 h-10 text-neutral-600" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Workspace Empty</h3>
              <p className="text-neutral-400 text-base max-w-md">
                You haven't crafted any presentations yet. Start generating AI-powered pitches and they will appear here.
              </p>
            </div>
          ) : filteredPitches.length === 0 ? (
            <div className="py-20 text-center text-neutral-500">
              No pitches match your search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 perspective-[2000px]">
              {filteredPitches.map((pitch) => (
                <PitchCard 
                  key={pitch.id} 
                  pitch={pitch} 
                  onDelete={deletePitch} 
                  onOpen={onOpenPitch} 
                  onDownload={handleQuickDownload}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
