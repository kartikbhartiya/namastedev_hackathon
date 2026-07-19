"use client";
import { cn } from "@/lib/utils";
import { Plus, MessageSquare, Trash2, Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Session {
    id: string;
    title: string;
    mode: string;
    updated_at: string;
}

interface SessionSidebarProps {
    sessions: Session[];
    activeSessionId: string | null;
    onSelectSession: (id: string) => void;
    onNewSession: () => void;
    onDeleteSession: (id: string) => void;
    tutorName: string;
    onClose?: () => void;
}

function formatTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export function SessionSidebar({
    sessions,
    activeSessionId,
    onSelectSession,
    onNewSession,
    onDeleteSession,
    tutorName,
    onClose,
}: SessionSidebarProps) {
    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-border flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground text-sm">{tutorName}</h2>
                            <p className="text-[10px] text-green-400">● Online</p>
                        </div>
                    </div>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-foreground/40 hover:text-foreground md:hidden"
                            onClick={onClose}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
                <Button
                    onClick={() => { onNewSession(); onClose?.(); }}
                    className="w-full bg-foreground/[0.03] hover:bg-neutral-500/10 text-neutral-300 border border-border h-9 text-xs"
                    variant="ghost"
                >
                    <Plus className="w-3.5 h-3.5 mr-2" /> New Chat
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-0.5">
                {sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No conversations yet
                    </div>
                ) : (
                    sessions.map((session) => (
                        <div
                            key={session.id}
                            onClick={() => { onSelectSession(session.id); onClose?.(); }}
                            role="button"
                            tabIndex={0}
                            className={cn(
                                "group w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer",
                                activeSessionId === session.id
                                    ? "bg-neutral-500/15 text-foreground"
                                    : "text-foreground/60 hover:bg-foreground/[0.04] hover:text-foreground/80"
                            )}
                        >
                            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-50" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{session.title}</p>
                                <p className="text-[10px] text-muted-foreground">{formatTimeAgo(session.updated_at)}</p>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(session.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-all"
                                aria-label="Delete session"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
