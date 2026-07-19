"use client";
import { cn } from "@/lib/utils";
import { Video, Film, Eye, MessageSquare, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface VideoScene {
    scene: number;
    title: string;
    narration: string;
    visual: string;
}

export interface VideoScript {
    title: string;
    duration: string;
    scenes: VideoScene[];
    takeaways: string[];
}

interface VideoScriptCardProps {
    script: VideoScript;
}

export function VideoScriptCard({ script }: VideoScriptCardProps) {
    const [expandedScene, setExpandedScene] = useState<number | null>(0);

    return (
        <div className="space-y-3">
            <div className="p-4 bg-foreground/[0.03] border border-border rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                    <Video className="w-5 h-5 text-neutral-400" />
                    <h3 className="text-sm font-bold text-foreground">{script.title}</h3>
                </div>
                <p className="text-[10px] text-muted-foreground">
                    Estimated duration: {script.duration} • {script.scenes.length} scenes
                </p>
            </div>

            <div className="space-y-2">
                {script.scenes.map((scene) => {
                    const isExpanded = expandedScene === scene.scene;
                    return (
                        <div
                            key={scene.scene}
                            className={cn(
                                "border rounded-xl overflow-hidden transition-all",
                                isExpanded
                                    ? "bg-foreground/[0.04] border-neutral-500/20"
                                    : "bg-foreground/[0.02] border-border hover:border-border"
                            )}
                        >
                            <button
                                onClick={() => setExpandedScene(isExpanded ? null : scene.scene)}
                                className="w-full flex items-center gap-3 p-3 text-left"
                            >
                                <div className="w-7 h-7 rounded-lg bg-neutral-500/15 flex items-center justify-center flex-shrink-0">
                                    <Film className="w-3.5 h-3.5 text-neutral-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-foreground">
                                        Scene {scene.scene}: {scene.title}
                                    </p>
                                </div>
                                {isExpanded ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-foreground/30 flex-shrink-0" />
                                ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-foreground/30 flex-shrink-0" />
                                )}
                            </button>

                            {isExpanded && (
                                <div className="px-3 pb-3 space-y-2 border-t border-border pt-2 ml-10">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <MessageSquare className="w-3 h-3 text-blue-400" />
                                            <span className="text-[10px] text-blue-300 uppercase tracking-wider font-medium">Narration</span>
                                        </div>
                                        <p className="text-xs text-foreground/70 leading-relaxed">{scene.narration}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Eye className="w-3 h-3 text-emerald-400" />
                                            <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-medium">Visual</span>
                                        </div>
                                        <p className="text-xs text-foreground/70 leading-relaxed">{scene.visual}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {script.takeaways.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold text-amber-300">Key Takeaways</span>
                    </div>
                    <ul className="space-y-1">
                        {script.takeaways.map((t, i) => (
                            <li key={i} className="text-xs text-foreground/70 flex items-start gap-2">
                                <span className="text-amber-400 mt-0.5">•</span>
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
