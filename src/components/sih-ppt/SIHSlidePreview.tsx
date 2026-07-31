"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SIHSlideContent, SIHColorTheme } from "@/lib/sihPptGenerator";

interface SIHSlidePreviewProps {
  content: SIHSlideContent;
  theme: SIHColorTheme;
  activeSlide: number;
  onSlideChange: (index: number) => void;
}

// Mini slide renderer that mimics the PPTX layout
function SlideRenderer({
  content,
  theme,
  slideIndex,
}: {
  content: SIHSlideContent;
  theme: SIHColorTheme;
  slideIndex: number;
}) {
  const slideData = getSlideData(content, slideIndex);

  if (slideIndex === 0) {
    return (
      <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
        {/* Accent right panel */}
        <div
          className="absolute right-0 top-0 w-[55%] h-full"
          style={{ backgroundColor: theme.preview }}
        />
        <div
          className="absolute right-[5%] top-[15%] w-[35%] h-[70%] rounded-md"
          style={{ backgroundColor: theme.preview, opacity: 0.15 }}
        />

        {/* SIH Logo placeholder */}
        <div
          className="absolute top-2 right-3 w-14 h-7 rounded border flex items-center justify-center text-[6px] font-bold"
          style={{ borderColor: theme.preview, color: theme.preview }}
        >
          SIH
        </div>

        {/* Title */}
        <div className="absolute top-[3%] left-[3%] w-[65%]">
          <h3
            className="text-[9px] font-bold tracking-tight"
            style={{ color: theme.preview }}
          >
            SMART INDIA HACKATHON 2026
          </h3>
        </div>

        {/* Title Page label */}
        <div className="absolute top-[14%] left-[8%]">
          <p className="text-[7px] font-bold text-black">TITLE PAGE</p>
        </div>

        {/* Details */}
        <div className="absolute top-[22%] left-[3%] w-[42%] space-y-[2px]">
          {[
            `PS ID – ${content.titleSlide.problemStatementId}`,
            `Title – ${content.titleSlide.problemStatementTitle}`,
            `Theme – ${content.titleSlide.theme}`,
            `Category – ${content.titleSlide.psCategory}`,
            `Team ID – ${content.titleSlide.teamId}`,
            `Team – ${content.titleSlide.teamName}`,
          ].map((item, i) => (
            <p key={i} className="text-[5px] text-black leading-tight flex items-start gap-1">
              <span className="mt-[1px]">•</span>
              <span className="font-semibold">{item}</span>
            </p>
          ))}
        </div>

        {/* Footer */}
        <div
          className="absolute bottom-0 left-0 w-full h-[7%] flex items-center justify-center"
          style={{ backgroundColor: theme.preview }}
        >
          <span className="text-[4px] text-white">@SIH Idea submission</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden">
      {/* Team badge */}
      <div
        className="absolute top-1.5 left-2 w-8 h-5 rounded-full border flex items-center justify-center text-[4px] bg-white z-10"
        style={{ borderColor: "#8064A2" }}
      >
        {content.titleSlide.teamName.substring(0, 6)}
      </div>

      {/* SIH Logo placeholder */}
      <div
        className="absolute top-1.5 right-2 w-12 h-6 rounded border flex items-center justify-center text-[5px] font-bold"
        style={{ borderColor: theme.preview, color: theme.preview }}
      >
        SIH
      </div>

      {/* Title */}
      <div className="px-3 pt-1">
        <h3 className="text-[8px] font-bold text-black tracking-tight mt-6">
          {slideData.title}
        </h3>
      </div>

      {/* Content */}
      <div className="px-3 mt-2 space-y-[2px]">
        {slideData.points.slice(0, 6).map((point, i) => (
          <p key={i} className="text-[5px] text-gray-800 leading-tight flex items-start gap-1">
            <span className="mt-[1px] text-gray-500">•</span>
            <span>{point}</span>
          </p>
        ))}
      </div>

      {/* Footer */}
      <div
        className="absolute bottom-0 left-0 w-full h-[7%] flex items-center justify-between px-3"
        style={{ backgroundColor: theme.preview }}
      >
        <span className="text-[4px] text-white/0">.</span>
        <span className="text-[4px] text-white">@SIH Idea submission</span>
        <span className="text-[4px] text-white font-bold">{slideIndex + 1}</span>
      </div>
    </div>
  );
}

function getSlideData(
  content: SIHSlideContent,
  index: number
): { title: string; points: string[] } {
  switch (index) {
    case 1:
      return {
        title: "IDEA TITLE",
        points: [
          ...content.ideaSlide.solutionPoints,
          ...content.ideaSlide.howItAddresses,
          ...content.ideaSlide.innovationPoints,
        ],
      };
    case 2:
      return {
        title: "TECHNICAL APPROACH",
        points: [
          `Technologies: ${content.technicalSlide.technologies.join(", ")}`,
          ...content.technicalSlide.methodology,
        ],
      };
    case 3:
      return {
        title: "FEASIBILITY AND VIABILITY",
        points: [
          ...content.feasibilitySlide.feasibilityPoints,
          ...content.feasibilitySlide.challenges,
          ...content.feasibilitySlide.strategies,
        ],
      };
    case 4:
      return {
        title: "IMPACT AND BENEFITS",
        points: [
          ...content.impactSlide.targetAudienceImpact,
          ...content.impactSlide.benefits,
        ],
      };
    case 5:
      return {
        title: "RESEARCH AND REFERENCES",
        points: content.referencesSlide.references.map(
          (r) => `[${r.year}] ${r.authors} - "${r.title}". ${r.link}`
        ),
      };
    default:
      return { title: "", points: [] };
  }
}

const SLIDE_LABELS = [
  "Title Page",
  "Idea Title",
  "Technical Approach",
  "Feasibility & Viability",
  "Impact & Benefits",
  "Research & References",
];

export function SIHSlidePreview({
  content,
  theme,
  activeSlide,
  onSlideChange,
}: SIHSlidePreviewProps) {
  return (
    <div className="space-y-4">
      {/* Main preview */}
      <div className="relative aspect-[16/9] w-full max-w-2xl mx-auto rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            <SlideRenderer
              content={content}
              theme={theme}
              slideIndex={activeSlide}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          onClick={() => onSlideChange(Math.max(0, activeSlide - 1))}
          disabled={activeSlide === 0}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors z-20"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSlideChange(Math.min(5, activeSlide + 1))}
          disabled={activeSlide === 5}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors z-20"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Slide label */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-3 py-1 rounded-full z-20">
          Slide {activeSlide + 1}/6 — {SLIDE_LABELS[activeSlide]}
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="flex gap-2 justify-center">
        {Array.from({ length: 6 }).map((_, i) => (
          <button
            key={i}
            onClick={() => onSlideChange(i)}
            className={`relative w-20 h-12 rounded-md overflow-hidden border-2 transition-all duration-200 hover:scale-105 ${
              activeSlide === i
                ? "border-[#ff6c37] shadow-lg shadow-[#ff6c37]/20"
                : "border-white/10 hover:border-white/30"
             }`}
          >
            <div className="transform scale-[0.14] origin-top-left w-[570px] h-[340px]">
              <SlideRenderer
                content={content}
                theme={theme}
                slideIndex={i}
              />
            </div>
            <div
              className={`absolute inset-0 transition-colors ${
                activeSlide === i ? "bg-transparent" : "bg-black/20"
              }`}
            />
            <span className="absolute bottom-0.5 right-1 text-[7px] font-bold text-white drop-shadow-md">
              {i + 1}
            </span>
          </button>
        ))}
      </div>

      {/* Speaker Notes / Pitch Script */}
      <div className="mt-6 p-5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-inner">
        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="text-xl">🎙️</span> Presenter Pitch Script
        </h4>
        <p className="text-sm text-neutral-300 leading-relaxed italic">
          "{
            activeSlide === 0 ? content.titleSlide.speakerNotes :
            activeSlide === 1 ? content.ideaSlide.speakerNotes :
            activeSlide === 2 ? content.technicalSlide.speakerNotes :
            activeSlide === 3 ? content.feasibilitySlide.speakerNotes :
            activeSlide === 4 ? content.impactSlide.speakerNotes :
            content.referencesSlide.speakerNotes
          }"
        </p>
      </div>
    </div>
  );
}
