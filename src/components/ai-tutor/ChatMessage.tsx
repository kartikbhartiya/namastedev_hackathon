"use client";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";

interface ChatMessageProps {
    role: "user" | "assistant" | "system";
    content: string;
    tutorName?: string;
    isLoading?: boolean;
}

export function ChatMessage({ role, content, tutorName = "Aria", isLoading }: ChatMessageProps) {
    const isUser = role === "user";

    return (
        <div className={cn("flex gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 py-2 sm:py-3", isUser ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
                "flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-foreground",
                isUser
                    ? "bg-gradient-to-br from-neutral-600 to-neutral-700"
                    : "bg-gradient-to-br from-neutral-800 to-neutral-900 border border-border"
            )}>
                {isUser ? <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" /> : <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
            </div>

            <div className={cn("flex flex-col max-w-[88%] sm:max-w-[80%] lg:max-w-[75%] min-w-0", isUser ? "items-end" : "items-start")}>
                <span className="text-[10px] text-muted-foreground mb-1 px-1">
                    {isUser ? "You" : tutorName}
                </span>
                <div className={cn(
                    "rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm leading-relaxed overflow-x-auto max-w-full",
                    isUser
                        ? "bg-neutral-800 border border-border text-foreground rounded-br-md"
                        : "bg-foreground/[0.03] border border-border text-foreground/90 rounded-bl-md"
                )}>
                    {isLoading ? (
                        <div className="flex items-center gap-1.5 py-1">
                            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                    ) : isUser ? (
                        <p>{content}</p>
                    ) : (
                        <ChatMarkdown content={content} />
                    )}
                </div>
            </div>
        </div>
    );
}
