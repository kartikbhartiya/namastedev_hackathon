"use client";
import { cn } from "@/lib/utils";
import { MessageSquare, Eye, GitBranch, Calendar, HelpCircle, Video, ChevronDown, Lightbulb } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type TutorMode = "text" | "doubt-solver" | "visualization" | "mindmap" | "studyplan" | "quiz" | "video";

interface ModeSelectorProps {
    activeMode: TutorMode;
    onModeChange: (mode: TutorMode) => void;
}

const MODES = [
    { value: "text", label: "Chat", icon: MessageSquare, desc: "Text explanations" },
    { value: "doubt-solver", label: "Doubt Solver", icon: Lightbulb, desc: "Step-by-step solutions with files" },
    { value: "visualization", label: "Interactive Sim", icon: Eye, desc: "Interactive simulations" },
    { value: "mindmap", label: "Mind Map", icon: GitBranch, desc: "Concept maps" },
    { value: "studyplan", label: "Study Plan", icon: Calendar, desc: "AI study plans" },
    { value: "quiz", label: "Quiz", icon: HelpCircle, desc: "Practice quizzes" },
    { value: "video", label: "Video", icon: Video, desc: "Educational video scripts" },
] as const;

export function ModeSelector({ activeMode, onModeChange }: ModeSelectorProps) {
    const activeOption = MODES.find((m) => m.value === activeMode) || MODES[0];
    const ActiveIcon = activeOption.icon;

    return (
        <>
            {/* Desktop View */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-foreground/[0.03] border border-border rounded-xl flex-shrink-0">
                {MODES.map((mode) => {
                    const Icon = mode.icon;
                    return (
                        <button
                            key={mode.value}
                            onClick={() => onModeChange(mode.value as TutorMode)}
                            title={mode.desc}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0",
                                activeMode === mode.value
                                    ? "bg-neutral-500/20 text-neutral-300 shadow-sm"
                                    : "text-foreground/40 hover:text-foreground/60 hover:bg-foreground/[0.04]"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span>{mode.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Mobile View */}
            <div className="sm:hidden flex-shrink-0">
                <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2.5 bg-foreground/[0.03] border border-border rounded-xl hover:bg-foreground/[0.06] transition-colors focus:outline-none">
                        <ActiveIcon className="w-5 h-5 text-neutral-300" />
                        <span className="text-sm font-medium text-neutral-300">{activeOption.label}</span>
                        <ChevronDown className="w-4 h-4 text-foreground/40" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px] bg-background border border-border p-1.5 z-50">
                        {MODES.map((mode) => {
                            const Icon = mode.icon;
                            return (
                                <DropdownMenuItem
                                    key={mode.value}
                                    onClick={() => onModeChange(mode.value as TutorMode)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer text-sm mb-1 last:mb-0 transition-colors",
                                        activeMode === mode.value
                                            ? "bg-neutral-500/10 text-neutral-300"
                                            : "text-foreground/70 hover:bg-foreground/[0.06] hover:text-foreground"
                                    )}
                                >
                                    <Icon className={cn("w-5 h-5 flex-shrink-0", activeMode === mode.value ? "text-neutral-300" : "text-foreground/40")} />
                                    <div className="flex flex-col">
                                        <span className="font-medium">{mode.label}</span>
                                        <span className="text-[10px] text-foreground/40 leading-tight mt-0.5">{mode.desc}</span>
                                    </div>
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </>
    );
}
