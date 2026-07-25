"use client";

import { Cpu, ChevronDown, Check, Zap, Sparkles, Brain } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface AIModelOption {
  id: string;
  provider: "groq" | "openai";
  model: string;
  name: string;
  badge: string;
  icon: any;
  speed: string;
}

export const MODEL_OPTIONS: AIModelOption[] = [
  {
    id: "llama-3.3-70b",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    name: "LLaMA 3.3 70B",
    badge: "SMART",
    icon: Brain,
    speed: "High Intelligence",
  },
  {
    id: "llama-3.1-8b",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    name: "LLaMA 3.1 8B",
    badge: "FAST",
    icon: Zap,
    speed: "Ultra Fast",
  },
  {
    id: "gpt-4o-mini",
    provider: "openai",
    model: "gpt-4o-mini",
    name: "GPT-4o Mini",
    badge: "PRO",
    icon: Sparkles,
    speed: "OpenAI Core",
  },
];

interface ModelSelectorDropdownProps {
  selectedModelId: string;
  onSelectModel: (option: AIModelOption) => void;
}

export function ModelSelectorDropdown({
  selectedModelId,
  onSelectModel,
}: ModelSelectorDropdownProps) {
  const current = MODEL_OPTIONS.find((m) => m.id === selectedModelId) || MODEL_OPTIONS[0];
  const Icon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-xl hover:bg-neutral-800 transition-colors focus:outline-none text-xs font-semibold text-neutral-300">
        <Icon className="w-3.5 h-3.5 text-primary" />
        <span>{current.name}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
          {current.badge}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px] bg-neutral-950 border border-white/10 p-1.5 z-50">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
          Select AI Model
        </div>
        {MODEL_OPTIONS.map((opt) => {
          const OptIcon = opt.icon;
          const isSelected = opt.id === selectedModelId;

          return (
            <DropdownMenuItem
              key={opt.id}
              onClick={() => onSelectModel(opt)}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer text-xs mb-1 last:mb-0 transition-colors",
                isSelected
                  ? "bg-primary/15 text-primary font-semibold"
                  : "text-neutral-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-2.5">
                <OptIcon className={cn("w-4 h-4", isSelected ? "text-primary" : "text-neutral-500")} />
                <div>
                  <div className="font-semibold leading-none">{opt.name}</div>
                  <div className="text-[10px] text-neutral-500 mt-1">{opt.speed}</div>
                </div>
              </div>
              {isSelected && <Check className="w-4 h-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
