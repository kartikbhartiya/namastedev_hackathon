"use client";

import { useState } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";

interface SlideCopilotProps {
  activeSlideLabel: string;
  isEditing: boolean;
  onSendRequest: (request: string) => void;
}

export function SlideCopilot({ activeSlideLabel, isEditing, onSendRequest }: SlideCopilotProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || isEditing) return;
    onSendRequest(input.trim());
    setInput("");
  };

  return (
    <div className="bg-[#0b0b0b] rounded-xl border border-white/10 flex flex-col h-[500px]">
      <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between shrink-0">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#ff6c37]" />
          Slide Copilot
        </h4>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 bg-white/5 px-2 py-1 rounded">
          {activeSlideLabel}
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div className="flex gap-3 text-sm">
          <div className="w-8 h-8 rounded-full bg-[#ff6c37]/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#ff6c37]" />
          </div>
          <div className="pt-1.5 text-neutral-300 leading-relaxed">
            I'm your Slide Copilot! What would you like to change about the <strong className="text-white">{activeSlideLabel}</strong> slide?
            <div className="mt-3 space-y-2">
              <button 
                onClick={() => setInput("Make it sound more aggressive and ambitious")}
                className="block text-xs text-left w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-neutral-400"
              >
                "Make it sound more aggressive and ambitious"
              </button>
              <button 
                onClick={() => setInput("Translate the speaker notes to Hindi")}
                className="block text-xs text-left w-full px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-neutral-400"
              >
                "Translate the speaker notes to Hindi"
              </button>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-[#ff6c37]/20 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 text-[#ff6c37] animate-spin" />
            </div>
            <div className="pt-1.5 text-[#ff6c37] font-medium animate-pulse">
              Rewriting slide content...
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-white/10 bg-black/40 shrink-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            disabled={isEditing}
            placeholder="Type a command to edit this slide..."
            className="w-full h-11 pl-4 pr-12 rounded-lg bg-[#040404] border border-white/10 text-sm text-white placeholder:text-neutral-600 focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/20 outline-none transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isEditing}
            className="absolute right-1 top-1 w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-[#ff6c37] disabled:opacity-30 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
