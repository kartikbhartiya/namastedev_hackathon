"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Send, BookOpen, Target, Brain, BarChart3,
    Loader2, Mic, MicOff, Paperclip, X, FileText, Image as ImageIcon,
    Wand2
} from "lucide-react";
import { extractTextFromFile } from "@/lib/documentProcessor";
import { toast } from "sonner";

export type InputMode = "text" | "visualize" | "video" | "mindmap";

interface ChatInputProps {
    onSend: (message: string, files?: File[]) => void;
    disabled?: boolean;
}

function useVoiceInput() {
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const recognitionRef = useRef<any>(null);

    const startListening = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
            let final = "";
            for (let i = 0; i < event.results.length; i++) {
                final += event.results[i][0].transcript;
            }
            setTranscript(final);
        };

        recognition.onend = () => setListening(false);
        recognition.onerror = () => setListening(false);

        recognitionRef.current = recognition;
        recognition.start();
        setListening(true);
    }, []);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setListening(false);
    }, []);

    const isSupported = typeof window !== "undefined" && (
        !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
    );

    return { listening, transcript, startListening, stopListening, isSupported, setTranscript };
}

const TOOL_CHIPS = [
    { label: "Explain Concept", icon: <BookOpen className="w-3 h-3" />, prompt: "Explain the concept of " },
    { label: "Create Study Plan", icon: <Target className="w-3 h-3" />, prompt: "Create a study plan for " },
    { label: "Generate Quiz", icon: <Brain className="w-3 h-3" />, prompt: "Generate a quiz about " },
    { label: "Analyze Performance", icon: <BarChart3 className="w-3 h-3" />, prompt: "Analyze my study performance and suggest improvements" },
];

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStatus, setProcessingStatus] = useState("");
    const [previewText, setPreviewText] = useState("");
    const [showPreview, setShowPreview] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { listening, transcript, startListening, stopListening, isSupported, setTranscript } = useVoiceInput();

    useEffect(() => {
        if (transcript) {
            setMessage((prev) => prev + transcript);
            setTranscript("");
        }
    }, [transcript, setTranscript]);

    useEffect(() => {
        const el = textareaRef.current;
        if (el) {
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
        }
    }, [message]);

    const handleSubmit = () => {
        if ((!message.trim() && attachedFiles.length === 0) || disabled) return;
        onSend(message.trim(), attachedFiles);
        setMessage("");
        setAttachedFiles([]);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleChipClick = (prompt: string) => {
        setMessage(prompt);
        textareaRef.current?.focus();
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setAttachedFiles(prev => [...prev, ...newFiles]);

            if (newFiles.some(f => f.type.startsWith('image/') || f.type === 'application/pdf' || f.name.endsWith('.pdf'))) {
                setIsProcessing(true);
                setShowPreview(true);
                setPreviewText("");

                let combinedText = "";
                try {
                    for (const file of newFiles) {
                        setProcessingStatus(`Reading ${file.name}...`);
                        const text = await extractTextFromFile(file, (status) => setProcessingStatus(status));
                        combinedText += (combinedText ? "\n\n" : "") + text;
                    }
                    setPreviewText(combinedText);
                } catch (err) {
                    toast.error((err as Error).message || "Failed to extract text");
                    setShowPreview(false);
                } finally {
                    setIsProcessing(false);
                    setProcessingStatus("");
                }
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSolveWithAI = () => {
        onSend(previewText || message, attachedFiles);
        setMessage("");
        setAttachedFiles([]);
        setPreviewText("");
        setShowPreview(false);
        if (textareaRef.current) textareaRef.current.style.height = "auto";
    };

    const handleCancelPreview = () => {
        setShowPreview(false);
        setPreviewText("");
        setAttachedFiles([]);
    };

    return (
        <div className="space-y-2">
            {message === "" && (
                <div className="flex gap-1.5 px-1 overflow-x-auto scrollbar-hide sm:flex-wrap sm:overflow-visible pb-1 sm:pb-0">
                    {TOOL_CHIPS.map((chip) => (
                        <button
                            key={chip.label}
                            onClick={() => handleChipClick(chip.prompt)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-foreground/50 bg-foreground/[0.03] border border-border rounded-full hover:bg-neutral-500/10 hover:border-neutral-500/20 hover:text-neutral-300 transition-all flex-shrink-0 sm:flex-shrink whitespace-nowrap sm:whitespace-normal"
                        >
                            {chip.icon}
                            {chip.label}
                        </button>
                    ))}
                </div>
            )}

            {attachedFiles.length > 0 && !showPreview && (
                <div className="flex flex-wrap gap-2 px-1 pb-2">
                    {attachedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-foreground/[0.05] border border-border rounded-lg px-2 py-1.5 text-xs">
                            {file.type.startsWith('image/') ? <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> : <FileText className="w-3.5 h-3.5 text-orange-400" />}
                            <span className="max-w-[120px] truncate text-foreground/80">{file.name}</span>
                            <button
                                onClick={() => removeFile(idx)}
                                className="text-foreground/40 hover:text-red-400 ml-1 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showPreview && (
                <div className="mx-1 mb-3 bg-foreground/[0.01] border border-border rounded-2xl overflow-hidden animate-in fade-in duration-300">
                    <div className="p-3 border-b border-border flex items-center justify-between bg-foreground/[0.03]">
                        <div className="flex items-center gap-2">
                            {isProcessing ? (
                                <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                            ) : (
                                <Wand2 className="w-4 h-4 text-neutral-400" />
                            )}
                            <span className="text-xs font-medium text-neutral-200">
                                {isProcessing ? processingStatus || "Reading your question..." : "Detected Question"}
                            </span>
                        </div>
                        {!isProcessing && (
                            <button
                                onClick={handleCancelPreview}
                                className="text-foreground/30 hover:text-foreground/60 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="p-3 space-y-3">
                        {isProcessing ? (
                            <div className="h-32 flex flex-col items-center justify-center gap-3 text-foreground/40">
                                <div className="w-48 h-1.5 bg-foreground/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-neutral-500 animate-progress-indeterminate"></div>
                                </div>
                                <p className="text-[11px] animate-pulse">Processing your document...</p>
                            </div>
                        ) : (
                            <>
                                <textarea
                                    value={previewText}
                                    onChange={(e) => setPreviewText(e.target.value)}
                                    className="w-full h-32 bg-transparent text-sm text-foreground/90 border-0 focus:ring-0 p-0 resize-none outline-none font-mono"
                                    placeholder="Empty question text..."
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        onClick={handleCancelPreview}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-xs text-foreground/60 hover:text-foreground hover:bg-neutral-500/10"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSolveWithAI}
                                        size="sm"
                                        className="h-8 text-xs bg-white text-black hover:bg-neutral-200"
                                    >
                                        Explain with AI
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="relative flex items-end gap-2 bg-foreground/[0.03] border border-border rounded-2xl px-3 py-2.5 focus-within:border-neutral-500/40 focus-within:shadow-[0_0_15px_rgba(255,255,255,0.02)] transition-all">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,application/pdf,.txt,.md"
                    multiple
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="p-1 text-foreground/40 hover:text-foreground rounded-lg transition-colors flex-shrink-0 mb-0.5"
                    title="Attach notes or screenshots"
                >
                    <Paperclip className="w-4.5 h-4.5" />
                </button>

                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask your tutor anything..."
                    className="flex-1 max-h-[120px] min-h-[22px] bg-transparent border-0 p-0 text-sm placeholder:text-foreground/30 focus:ring-0 resize-none outline-none font-sans text-foreground py-0.5 scrollbar-thin"
                    disabled={disabled}
                    rows={1}
                />

                {isSupported && (
                    <button
                        onClick={listening ? stopListening : startListening}
                        disabled={disabled}
                        className={cn(
                            "p-1 rounded-lg transition-colors flex-shrink-0 mb-0.5",
                            listening
                                ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
                                : "text-foreground/40 hover:text-foreground"
                        )}
                        title="Voice search"
                    >
                        {listening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
                    </button>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={(!message.trim() && attachedFiles.length === 0) || disabled}
                    className={cn(
                        "p-1.5 rounded-xl transition-all flex-shrink-0 mb-0.5",
                        (message.trim() || attachedFiles.length > 0) && !disabled
                            ? "bg-white text-black hover:bg-neutral-200"
                            : "text-foreground/20 cursor-not-allowed"
                    )}
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
