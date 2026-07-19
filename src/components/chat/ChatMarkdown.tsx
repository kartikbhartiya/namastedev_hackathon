"use client";
/**
 * ChatMarkdown — Professional markdown rendering for AI Tutor responses.
 * Light weight, fast, and optimized for hackathon.
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { cn } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";

interface ChatMarkdownProps {
    content: string;
    className?: string;
}

function CodeBlock({ language, value }: { language: string; value: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [value]);

    return (
        <div className="relative group my-3 rounded-xl overflow-hidden border border-border bg-foreground/[0.02]">
            <div className="flex items-center justify-between px-4 py-1.5 bg-foreground/[0.04] border-b border-border">
                <span className="text-[10px] text-muted-foreground font-mono uppercase">{language || "code"}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                >
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <pre className="p-4 bg-black/40 text-xs overflow-x-auto font-mono text-neutral-200 leading-relaxed scrollbar-thin">
                <code>{value}</code>
            </pre>
        </div>
    );
}

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
    return (
        <div
            className={cn(
                "prose prose-invert prose-sm max-w-none",
                "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
                "[&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2",
                "[&_h1]:text-base [&_h1]:font-bold [&_h1]:text-white [&_h1]:mt-4 [&_h1]:mb-2",
                "[&_h2]:text-sm [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mt-3 [&_h2]:mb-1.5",
                "[&_h3]:text-sm [&_h3]:font-medium [&_h3]:text-white/90 [&_h3]:mt-2 [&_h3]:mb-1",
                "[&_li]:text-white/80 [&_li]:my-0.5",
                "[&_ul]:list-disc [&_ul]:pl-4",
                "[&_ol]:list-decimal [&_ol]:pl-4",
                "[&_code]:text-neutral-300 [&_code]:bg-neutral-500/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-xs [&_code]:font-mono",
                "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit",
                "[&_a]:text-neutral-400 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-neutral-300",
                "[&_blockquote]:border-l-2 [&_blockquote]:border-neutral-500/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-white/60",
                "[&_table]:border-collapse [&_table]:w-full [&_table]:my-3",
                "[&_th]:bg-white/[0.05] [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-semibold [&_th]:border [&_th]:border-white/10",
                "[&_td]:px-3 [&_td]:py-1.5 [&_td]:text-xs [&_td]:border [&_td]:border-white/[0.06]",
                "[&_tr:nth-child(even)]:bg-white/[0.02]",
                "[&_hr]:border-white/[0.08] [&_hr]:my-4",
                "[&_strong]:text-white [&_strong]:font-semibold",
                "[&_em]:text-white/70",
                "[&_.katex]:text-neutral-200",
                "[&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-2",
                className
            )}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    code({ node, className: codeClassName, children, ...props }) {
                        const match = /language-(\w+)/.exec(codeClassName || "");
                        const value = String(children).replace(/\n$/, "");

                        if (match) {
                            return <CodeBlock language={match[1]} value={value} />;
                        }

                        return (
                            <code className={codeClassName} {...props}>
                                {children}
                            </code>
                        );
                    },
                    pre({ children }) {
                        return <>{children}</>;
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
