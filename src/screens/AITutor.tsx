"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";
import { generateAIResponseStream } from "@/lib/groq";
import {
    buildTutorSystemPrompt,
    generateStudyPlan,
    generateMindMapData,
    generateVideoScript,
    generateDynamicSimulation,
    DEFAULT_TUTOR_PROFILE,
} from "@/lib/aiTutor";
import type {
    TutorProfile,
    StudentContext,
    MindMapNode,
    StudyPlanDay,
    VideoScript,
    DynamicSimConfig,
} from "@/lib/aiTutor";
import { checkGlobalAIPaused } from "@/lib/aiUsageTracker";
import { detectSimulation } from "@/components/simulations/SimulationRegistry";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { extractTextFromFile, chunkText } from "@/lib/documentProcessor";
import { vectorStore } from "@/lib/vectorStore";

// Components
import { ChatMessage } from "@/components/ai-tutor/ChatMessage";
import { ChatInput } from "@/components/ai-tutor/ChatInput";
import { SessionSidebar } from "@/components/ai-tutor/SessionSidebar";
import { ModeSelector, type TutorMode } from "@/components/ai-tutor/ModeSelector";
import { SimulationEngine } from "@/components/simulations/SimulationEngine";
import { MindMapViewer } from "@/components/ai-tutor/MindMapViewer";
import { StudyPlanCard } from "@/components/ai-tutor/StudyPlanCard";
import { VideoScriptCard } from "@/components/ai-tutor/VideoScriptCard";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    PanelLeftClose,
    PanelLeft,
    Settings,
    Sparkles,
    Bot,
    Eye,
    GitBranch,
    Calendar,
    HelpCircle,
    Menu,
    Lightbulb,
    Play,
    Zap,
    Video,
} from "lucide-react";

interface Message {
    id?: string;
    role: "user" | "assistant" | "system";
    content: string;
    metadata?: Record<string, any>;
}

interface ActionCard {
    type: "simulation" | "mindmap" | "studyplan" | "quiz";
    topic: string;
    label: string;
}

interface Session {
    id: string;
    title: string;
    mode: string;
    updated_at: string;
}

function parseActionCards(text: string): { cleanText: string; actions: ActionCard[] } {
    const actions: ActionCard[] = [];
    const cleanText = text.replace(/\[ACTION:(simulation|mindmap|studyplan|quiz):([^\]]+)\]/g, (_, type, topic) => {
        const labels: Record<string, string> = {
            simulation: `🔬 Visualize: ${topic}`,
            mindmap: `🗺️ Mind Map: ${topic}`,
            studyplan: `📅 Study Plan: ${topic}`,
            quiz: `📝 Quiz: ${topic}`,
        };
        actions.push({ type, topic, label: labels[type] || topic });
        return "";
    }).trim();
    return { cleanText, actions };
}

function InlineActionCard({ action, onActivate }: { action: ActionCard; onActivate: (action: ActionCard) => void }) {
    const icons: Record<string, React.ReactNode> = {
        simulation: <Eye className="w-3.5 h-3.5" />,
        mindmap: <GitBranch className="w-3.5 h-3.5" />,
        studyplan: <Calendar className="w-3.5 h-3.5" />,
        quiz: <HelpCircle className="w-3.5 h-3.5" />,
    };

    return (
        <button
            onClick={() => onActivate(action)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-2 mr-2 rounded-lg bg-neutral-500/10 border border-neutral-500/20 text-neutral-300 text-xs hover:bg-neutral-500/20 hover:border-neutral-500/30 transition-all"
        >
            {icons[action.type]}
            {action.label}
        </button>
    );
}

interface SmartChip {
    id: string;
    label: string;
    icon: React.ReactNode;
    action: "explain-simpler" | "simulation" | "quiz" | "mindmap" | "video";
}

const PHYSICS_KEYWORDS = ["force", "velocity", "acceleration", "momentum", "energy", "electric", "magnetic", "wave", "gravity", "field", "circuit", "optics", "lens", "mirror", "pendulum", "oscillation", "thermodynamic", "pressure", "projectile", "torque", "friction", "newton"];
const MATH_KEYWORDS = ["equation", "function", "graph", "derivative", "integral", "matrix", "vector", "parabola", "sine", "cosine", "tangent", "polynomial", "logarithm", "trigonometry", "geometry", "calculus", "slope", "limit"];
const THEORY_KEYWORDS = ["definition", "theorem", "law", "principle", "concept", "theory", "classification", "types of", "difference between", "comparison", "properties", "characteristics", "history", "explain", "overview", "introduction", "summary"];
const COMPLEXITY_MARKERS = ["therefore", "hence", "consequently", "in other words", "mathematically", "derivation", "proof", "substituting", "integrating", "differentiating", "let us consider", "from the equation"];

function getSmartChips(content: string): SmartChip[] {
    const lower = content.toLowerCase();
    const chips: SmartChip[] = [];

    const hasPhysics = PHYSICS_KEYWORDS.some(kw => lower.includes(kw));
    const hasMath = MATH_KEYWORDS.some(kw => lower.includes(kw));
    const hasTheory = THEORY_KEYWORDS.some(kw => lower.includes(kw));
    const isComplex = COMPLEXITY_MARKERS.filter(m => lower.includes(m)).length >= 2 || content.length > 1200;

    if (isComplex) {
        chips.push({ id: "simpler", label: "Explain Simpler", icon: <Zap className="w-3.5 h-3.5" />, action: "explain-simpler" });
    }
    if (hasPhysics || hasMath) {
        chips.push({ id: "sim", label: "Run Simulation", icon: <Play className="w-3.5 h-3.5" />, action: "simulation" });
    }
    if (hasTheory || content.length > 500) {
        chips.push({ id: "quiz", label: "Generate Quiz", icon: <HelpCircle className="w-3.5 h-3.5" />, action: "quiz" });
        chips.push({ id: "mindmap", label: "Create Mind Map", icon: <GitBranch className="w-3.5 h-3.5" />, action: "mindmap" });
    }
    if (content.length > 800) {
        chips.push({ id: "video", label: "Generate Video Script", icon: <Video className="w-3.5 h-3.5" />, action: "video" });
    }
    if (chips.length === 0 && content.length > 100) {
        chips.push({ id: "simpler", label: "Explain Simpler", icon: <Zap className="w-3.5 h-3.5" />, action: "explain-simpler" });
    }

    return chips.slice(0, 4);
}

function SmartActionChips({
    content,
    userQuestion,
    onExplainSimpler,
    onSimulation,
    onQuiz,
    onMindMap,
    onVideo,
}: {
    content: string;
    userQuestion: string;
    onExplainSimpler: () => void;
    onSimulation: (topic: string) => void;
    onQuiz: (topic: string) => void;
    onMindMap: (topic: string) => void;
    onVideo: (topic: string) => void;
}) {
    const chips = getSmartChips(content);
    if (chips.length === 0) return null;

    const topic = userQuestion.slice(0, 120).trim() || content.slice(0, 80).replace(/[#*_\n]/g, "").trim();

    const handleClick = (chip: SmartChip) => {
        switch (chip.action) {
            case "explain-simpler": onExplainSimpler(); break;
            case "simulation": onSimulation(topic); break;
            case "quiz": onQuiz(topic); break;
            case "mindmap": onMindMap(topic); break;
            case "video": onVideo(topic); break;
        }
    };

    return (
        <div className="flex flex-wrap gap-1.5 px-4 sm:px-12 pb-1 animate-in fade-in duration-300">
            {chips.map((chip) => (
                <button
                    key={chip.id}
                    onClick={() => handleClick(chip)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground/[0.03] border border-border text-foreground/50 text-[11px] hover:bg-neutral-500/10 hover:border-neutral-500/25 hover:text-neutral-300 transition-all active:scale-[0.97]"
                >
                    {chip.icon}
                    {chip.label}
                </button>
            ))}
        </div>
    );
}

export function AITutor() {
    const { user, profile } = useAuth();
    const router = useRouter();

    const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [mode, setMode] = useState<TutorMode>("text");
    const [loading, setLoading] = useState(true);
    const [responding, setResponding] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
    const [mindMapLoading, setMindMapLoading] = useState(false);
    const [studyPlan, setStudyPlan] = useState<StudyPlanDay[]>([]);
    const [activeSimId, setActiveSimId] = useState<string | null>(null);
    const [dynamicSimConfig, setDynamicSimConfig] = useState<DynamicSimConfig | null>(null);
    const [simLoading, setSimLoading] = useState(false);
    const [videoScript, setVideoScript] = useState<VideoScript | null>(null);
    const [messageActions, setMessageActions] = useState<Map<number, ActionCard[]>>(new Map());

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isUserScrolledUp = useRef(false);

    const buildStudentContext = useCallback((): StudentContext => {
        return {
            name: profile?.name?.split(" ")[0] || "Student",
            streak: profile?.study_streak || 0,
            weeklyStudyHours: `${((profile?.total_uptime || 0) / 60).toFixed(1)}h`,
        };
    }, [profile]);

    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            try {
                if (user.id === "demo-judge") {
                    setTutorProfile({
                        user_id: "demo-judge",
                        tutor_name: "Orbit AI Coach",
                        tone: "supportive",
                        motivation_style: "direct",
                        learning_pace: "normal",
                        explanation_style: "conceptual",
                        interests: ["CS", "Coding"],
                        learning_challenges: ["Singly Linked Lists"],
                        education_domain: "Engineering",
                        target_exam: "BTech Exams"
                    });
                    const mockSessions = [
                        {
                            id: "demo-session-1",
                            user_id: "demo-judge",
                            title: "Singly LinkedList Stack Tracing",
                            mode: "text",
                            updated_at: new Date().toISOString(),
                            created_at: new Date().toISOString()
                        }
                    ];
                    setSessions(mockSessions);
                    setActiveSessionId("demo-session-1");
                    setMessages([
                        {
                            id: "m1",
                            role: "assistant",
                            content: "Hello! I am your visual algorithm stack tracing tutor. Let's walk through Singly LinkedLists stack operations. What algorithm would you like to trace first?"
                        }
                    ]);
                    setMode("text");
                    setLoading(false);
                    return;
                }

                const tp = await db.tutorProfiles.get(user.id);
                if (!tp) {
                    router.push("/ai-tutor/setup");
                    return;
                }
                setTutorProfile(tp);

                const sess = await db.aiSessions.getAll(user.id);
                setSessions(sess);

                if (sess.length > 0) {
                    setActiveSessionId(sess[0].id);
                    const msgs = await db.aiMessages.getBySession(sess[0].id);
                    setMessages(msgs);
                    setMode((sess[0].mode as TutorMode) || "text");
                }
            } catch (err) {
                console.error("Failed to load AI Tutor data:", err);
                setTutorProfile(DEFAULT_TUTOR_PROFILE);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user, router]);

    useEffect(() => {
        if (isUserScrolledUp.current) return;
        const timeout = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 100);
        return () => clearTimeout(timeout);
    }, [messages, responding]);

    const handleScrollAreaScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
        isUserScrolledUp.current = !isAtBottom;
    };

    const createNewSession = async () => {
        if (!user) return;
        try {
            const session = await db.aiSessions.create(user.id, "New Chat", mode);
            setSessions((prev) => [session, ...prev]);
            setActiveSessionId(session.id);
            setMessages([]);
            resetModeState();
        } catch (err) {
            console.error("Create session error:", err);
            toast.error("Failed to create new chat");
        }
    };

    const selectSession = async (sessionId: string) => {
        try {
            setActiveSessionId(sessionId);
            const msgs = await db.aiMessages.getBySession(sessionId);
            setMessages(msgs);
            const session = sessions.find((s) => s.id === sessionId);
            if (session) setMode((session.mode as TutorMode) || "text");
            resetModeState();
        } catch (err) {
            console.error("Select session error:", err);
        }
    };

    const deleteSession = async (sessionId: string) => {
        try {
            await db.aiMessages.deleteBySession(sessionId);
            await db.aiSessions.delete(sessionId);
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            if (activeSessionId === sessionId) {
                setActiveSessionId(null);
                setMessages([]);
            }
            toast.success("Chat deleted");
        } catch (err) {
            console.error("Delete session error:", err);
            toast.error("Failed to delete chat");
        }
    };

    const resetModeState = () => {
        setMindMapData(null);
        setStudyPlan([]);
        setActiveSimId(null);
        setDynamicSimConfig(null);
        setSimLoading(false);
        setMessageActions(new Map());
        vectorStore.clear();
    };

    const handleActionActivate = useCallback((action: ActionCard) => {
        switch (action.type) {
            case "simulation": {
                setMode("visualization");
                const sim = detectSimulation(action.topic);
                if (sim) {
                    setActiveSimId(sim.id);
                    setDynamicSimConfig(null);
                    setSimLoading(false);
                } else if (tutorProfile) {
                    const student = buildStudentContext();
                    setDynamicSimConfig(null);
                    setSimLoading(true);
                    generateDynamicSimulation(action.topic, tutorProfile, student)
                        .then((config) => { if (config) setDynamicSimConfig(config); })
                        .catch(console.error)
                        .finally(() => setSimLoading(false));
                }
                break;
            }
            case "mindmap":
                setMode("mindmap");
                if (tutorProfile) {
                    const student = buildStudentContext();
                    setMindMapLoading(true);
                    generateMindMapData(action.topic, tutorProfile, student)
                        .then((data) => setMindMapData(data))
                        .catch(console.error)
                        .finally(() => setMindMapLoading(false));
                }
                break;
            case "studyplan":
                setMode("studyplan");
                break;
            case "quiz":
                router.push(`/quizzes?action=generate&topic=${encodeURIComponent(action.topic)}`);
                return;
        }
        if (activeSessionId) {
            db.aiSessions.update(activeSessionId, { mode: action.type === "simulation" ? "visualization" : action.type }).catch(() => { });
        }
    }, [tutorProfile, buildStudentContext, activeSessionId, router]);

    const sendMessage = async (content: string, newFiles: File[] = []) => {
        if ((!content && newFiles.length === 0) || !user || !tutorProfile || responding) return;

        isUserScrolledUp.current = false;

        const isPaused = await checkGlobalAIPaused();
        if (isPaused) {
            toast.error("AI services are temporarily paused. Please try again later.");
            return;
        }

        let sessionId = activeSessionId;
        if (!sessionId) {
            try {
                const session = await db.aiSessions.create(user.id, content.slice(0, 50), mode);
                setSessions((prev) => [session, ...prev]);
                sessionId = session.id;
                setActiveSessionId(session.id);
            } catch (err) {
                console.error("Create session error:", err);
                toast.error("Failed to start chat");
                return;
            }
        }

        const userMessage: Message = { role: "user", content };
        setMessages((prev) => [...prev, userMessage]);
        setResponding(true);
        if (!sessionId) return;

        try {
            await db.aiMessages.send(sessionId, "user", content);

            const currentSession = sessions.find((s) => s.id === sessionId);
            if (currentSession?.title === "New Chat") {
                const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
                await db.aiSessions.update(sessionId, { title });
                setSessions((prev) =>
                    prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
                );
            }

            if (mode === "mindmap") {
                await handleMindMapRequest(content, sessionId);
                return;
            }
            if (mode === "studyplan") {
                await handleStudyPlanRequest(content, sessionId);
                return;
            }
            if (mode === "video") {
                await handleVideoRequest(content, sessionId);
                return;
            }
            if (mode === "visualization") {
                const sim = detectSimulation(content);
                if (sim) {
                    setActiveSimId(sim.id);
                    setDynamicSimConfig(null);
                    setSimLoading(false);
                    const msg: Message = { role: "assistant", content: `Opening the **${sim.title}** simulation for you! ${sim.emoji}\n\nAdjust the controls below to explore the concept.` };
                    setMessages((prev) => [...prev, msg]);
                    await db.aiMessages.send(sessionId, "assistant", msg.content);
                    setResponding(false);
                    return;
                }
                if (tutorProfile) {
                    try {
                        setSimLoading(true);
                        const student = buildStudentContext();
                        const dynConfig = await generateDynamicSimulation(content, tutorProfile, student);
                        setSimLoading(false);
                        if (dynConfig) {
                            setDynamicSimConfig(dynConfig);
                            setActiveSimId(null);
                            const msg: Message = { role: "assistant", content: `I've generated an interactive **${dynConfig.title}** simulation for you! ${dynConfig.emoji}\n\nUse the sliders below to explore the concept.` };
                            setMessages((prev) => [...prev, msg]);
                            await db.aiMessages.send(sessionId, "assistant", msg.content);
                            setResponding(false);
                            return;
                        }
                        toast.error("Failed to generate simulation.");
                    } catch (err) {
                        console.error("[sendMessage] dynamic sim generation error:", err);
                        setSimLoading(false);
                        toast.error("Simulation generation failed.");
                    }
                }
                setResponding(false);
                return;
            }

            if (mode === "text" || mode === "doubt-solver") {
                const lowerContent = content.toLowerCase();
                const vizKeywords = ["show me", "visualize", "simulate", "simulation", "demonstrate", "show how", "show the", "field lines", "visualise"];
                const wantsViz = vizKeywords.some((kw) => lowerContent.includes(kw));

                if (wantsViz) {
                    const sim = detectSimulation(content);
                    if (sim) {
                        setActiveSimId(sim.id);
                        setDynamicSimConfig(null);
                        setMode("visualization");
                        const msg: Message = { role: "assistant", content: `I detected you want a visualization! Opening the **${sim.title}** simulation. ${sim.emoji}\n\nAdjust the controls below to explore the concept.` };
                        setMessages((prev) => [...prev, msg]);
                        await db.aiMessages.send(sessionId, "assistant", msg.content);
                        setResponding(false);
                        return;
                    }
                    if (tutorProfile) {
                        const student = buildStudentContext();
                        const dynConfig = await generateDynamicSimulation(content, tutorProfile, student);
                        if (dynConfig) {
                            setDynamicSimConfig(dynConfig);
                            setActiveSimId(null);
                            setMode("visualization");
                            const msg: Message = { role: "assistant", content: `I've generated an interactive **${dynConfig.title}** simulation for you! ${dynConfig.emoji}\n\nUse the sliders below to explore the concept.` };
                            setMessages((prev) => [...prev, msg]);
                            await db.aiMessages.send(sessionId, "assistant", msg.content);
                            setResponding(false);
                            return;
                        }
                    }
                }
            }

            const student = buildStudentContext();
            let systemPrompt = buildTutorSystemPrompt(tutorProfile, student) +
                `\n\n## Cross-Mode Integration:\nWhen your explanation involves a concept that could be visualized, add action tags at the end:\n- [ACTION:simulation:topic] for physics/math visualizations\n- [ACTION:mindmap:topic] for concept maps\n- [ACTION:studyplan:topic] to suggest a study plan\n- [ACTION:quiz:topic] to offer a practice quiz\nOnly add these when genuinely relevant. Maximum 2 tags per response.`;

            if (mode === "doubt-solver") {
                systemPrompt += `\n\n## Doubt Solver Mode\nYou are an expert academic tutor. Solve the student's question step-by-step. You MUST format your response exactly with these numbered headings:\n1. Problem Understanding\nBriefly state what the problem is asking.\n2. Concepts Used\nIdentify the core concepts required to solve the problem.\n3. Step-by-Step Solution\nProvide a detailed, step-by-step breakdown of the solution.\n4. Final Answer\nClearly state the final answer.\n5. Concept Explanation\nProvide a deeper dive or intuition into the key concept.\n6. Practice Question\nProvide a similar practice question for the student.`;
            }

            let fileContextText = "";
            if (newFiles.length > 0) {
                const toastId = toast.loading("Processing attached files...");
                try {
                    const texts = await Promise.all(newFiles.map(f => extractTextFromFile(f)));
                    for (let i = 0; i < newFiles.length; i++) {
                        if (!texts[i].trim()) continue;
                        const chunks = chunkText(texts[i]);
                        await vectorStore.addDocuments(chunks, chunks.map((_, idx) => ({
                            fileName: newFiles[i].name,
                            fileType: newFiles[i].type,
                            chunkIndex: idx
                        })));
                    }
                    toast.success("Files processed successfully!", { id: toastId });
                } catch (err) {
                    console.error("File processing error:", err);
                    toast.error("Failed to process files: " + (err as Error).message, { id: toastId });
                }
            }

            const docs = vectorStore.getAllDocuments();
            if (docs.length > 0 && content.trim()) {
                const results = await vectorStore.search(content, 4);
                if (results.length > 0) {
                    fileContextText = `[CONTEXT FROM UPLOADED STUDY MATERIALS]\n` +
                        results.map(r => `Source: ${r.metadata.fileName}\nText: ${r.text}`).join('\n\n') +
                        `\n[END CONTEXT]\n\nPlease prioritize using the provided context when answering the user's question.\n\n`;
                }
            }

            const history = [...messages.slice(-10), userMessage].map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            }));

            const msgIndex = messages.length + 1;
            const assistantMessage: Message = { role: "assistant", content: "" };
            setMessages((prev) => [...prev, assistantMessage]);

            let fullContent = "";
            let firstChunkReceived = false;

            const stream = generateAIResponseStream(
                systemPrompt,
                history.map((h) => `${h.role}: ${h.content}`).join("\n") + "\nuser: " + fileContextText + content,
                0.7
            );

            for await (const chunk of stream) {
                if (!firstChunkReceived) {
                    firstChunkReceived = true;
                    setResponding(false);
                }
                fullContent += chunk;

                setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { ...assistantMessage, content: fullContent };
                    return newMessages;
                });
            }

            const { cleanText, actions } = parseActionCards(fullContent);

            if (actions.length > 0) {
                setMessageActions((prev) => new Map(prev).set(msgIndex, actions));
            }

            if (cleanText !== fullContent) {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { ...assistantMessage, content: cleanText };
                    return newMessages;
                });
            }

            await db.aiMessages.send(sessionId, "assistant", cleanText);
        } catch (err: any) {
            console.error("AI response error:", err);
            setMessages((prev) => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg && lastMsg.role === "assistant" && lastMsg.content === "") {
                    newMessages[newMessages.length - 1] = {
                        role: "assistant",
                        content: `Sorry, I encountered an error: ${err.message || "Unknown error"}. Please configure your API Key or try again.`,
                    };
                    return newMessages;
                }
                return [...prev, {
                    role: "assistant",
                    content: `Sorry, I encountered an error: ${err.message || "Unknown error"}. Please configure your API Key or try again.`,
                }];
            });
        } finally {
            setResponding(false);
        }
    };

    const handleMindMapRequest = async (topic: string, sessionId: string) => {
        setMindMapLoading(true);
        try {
            const student = buildStudentContext();
            const data = await generateMindMapData(topic, tutorProfile!, student);
            setMindMapData(data);

            const assistantMsg: Message = {
                role: "assistant",
                content: `Here's the mind map for **"${topic}"**. Hover over nodes to review their detailed concept cards!`,
            };
            setMessages((prev) => [...prev, assistantMsg]);
            await db.aiMessages.send(sessionId, "assistant", assistantMsg.content);
        } catch (err: any) {
            const errorMsg: Message = {
                role: "assistant",
                content: `Failed to generate mind map: ${err.message}`,
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setMindMapLoading(false);
            setResponding(false);
        }
    };

    const handleStudyPlanRequest = async (topic: string, sessionId: string) => {
        try {
            const student = buildStudentContext();
            const daysMatch = topic.match(/(\d+)\s*days?/i);
            const days = daysMatch ? parseInt(daysMatch[1]) : 5;

            const plan = await generateStudyPlan(topic, days, tutorProfile!, student);
            setStudyPlan(plan);

            const assistantMsg: Message = {
                role: "assistant",
                content: `I've created a **${days}-day study plan** for "${topic}". Check off tasks as you complete them!`,
            };
            setMessages((prev) => [...prev, assistantMsg]);
            await db.aiMessages.send(sessionId, "assistant", assistantMsg.content);
        } catch (err: any) {
            const errorMsg: Message = {
                role: "assistant",
                content: `Failed to generate study plan: ${err.message}`,
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setResponding(false);
        }
    };

    const handleVideoRequest = async (topic: string, sessionId: string) => {
        try {
            const student = buildStudentContext();
            const script = await generateVideoScript(topic, tutorProfile!, student);
            setVideoScript(script);

            const assistantMsg: Message = {
                role: "assistant",
                content: script
                    ? `Here's the educational video script for **"${topic}"**! 🎬 Review the scenes below.`
                    : `I couldn't generate a video script for that topic. Please try a different one.`,
            };
            setMessages((prev) => [...prev, assistantMsg]);
            await db.aiMessages.send(sessionId, "assistant", assistantMsg.content);
        } catch (err: any) {
            const errorMsg: Message = {
                role: "assistant",
                content: `Failed to generate video script: ${err.message}`,
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setResponding(false);
        }
    };

    const handleModeChange = async (newMode: TutorMode) => {
        if (newMode === "quiz") {
            router.push("/quizzes?action=generate");
            return;
        }
        if (mode !== newMode && (newMode === "doubt-solver" || mode === "doubt-solver")) {
            if (messages.length === 0 && activeSessionId) {
                setMode(newMode);
                if (user) {
                    try {
                        const title = newMode === "doubt-solver" ? "New Doubt Session" : "New Chat";
                        await db.aiSessions.update(activeSessionId, { mode: newMode, title });
                        setSessions(prev =>
                            prev.map(s => s.id === activeSessionId ? { ...s, mode: newMode, title } : s)
                        );
                    } catch { }
                }
            } else {
                resetModeState();
                setMode(newMode);

                if (user) {
                    try {
                        const title = newMode === "doubt-solver" ? "New Doubt Session" : "New Chat";
                        const session = await db.aiSessions.create(user.id, title, newMode);
                        setSessions((prev) => [session, ...prev]);
                        setActiveSessionId(session.id);
                        setMessages([]);
                    } catch (err) {
                        console.error("Failed to fork session on mode change", err);
                    }
                }
            }
        } else {
            setMode(newMode);
            if (activeSessionId) {
                try {
                    await db.aiSessions.update(activeSessionId, { mode: newMode });
                } catch { }
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background pt-14 md:pt-16">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-neutral-800 border border-border flex items-center justify-center animate-pulse">
                        <Bot className="w-8 h-8 text-white animate-bounce" />
                    </div>
                    <p className="text-sm text-muted-foreground font-medium animate-pulse">Engaging neural channels...</p>
                </div>
            </div>
        );
    }

    const renderModeContent = () => {
        switch (mode) {
            case "visualization":
                return (
                    <div className="px-4 py-4 max-w-3xl mx-auto">
                        {simLoading ? (
                            <div className="w-full aspect-[4/3] bg-black/40 rounded-xl border border-border flex items-center justify-center">
                                <div className="text-center space-y-3">
                                    <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin mx-auto" />
                                    <p className="text-xs text-muted-foreground animate-pulse">Generating simulation...</p>
                                </div>
                            </div>
                        ) : (
                            <SimulationEngine
                                activeSimId={activeSimId}
                                dynamicConfig={dynamicSimConfig}
                                onClearDynamic={() => setDynamicSimConfig(null)}
                                onClearActiveSimId={() => setActiveSimId(null)}
                            />
                        )}
                    </div>
                );
            case "mindmap":
                return (
                    <div className="px-4 py-4 max-w-4xl mx-auto">
                        <MindMapViewer data={mindMapData} loading={mindMapLoading} />
                    </div>
                );
            case "studyplan":
                return (
                    <div className="px-4 py-4 max-w-2xl mx-auto animate-in fade-in duration-200">
                        <StudyPlanCard
                            plan={studyPlan}
                            onGenerate={setStudyPlan}
                            tutorProfile={tutorProfile}
                            studentContext={buildStudentContext()}
                            title="AI Study Plan"
                        />
                    </div>
                );
            case "video":
                return videoScript ? (
                    <div className="px-4 py-4 max-w-2xl mx-auto animate-in fade-in duration-200">
                        <VideoScriptCard script={videoScript} />
                    </div>
                ) : (
                    <div className="px-4 py-8 text-center text-muted-foreground text-xs">
                        Ask Aria to generate a video script to visualize scenes
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-[100dvh] flex bg-background overflow-hidden relative pt-14 md:pt-16">
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                    <div className="absolute left-0 top-0 bottom-0 w-72 bg-background border-r border-border animate-in slide-in-from-left duration-300 flex flex-col">
                        <SessionSidebar
                            sessions={sessions}
                            activeSessionId={activeSessionId}
                            onSelectSession={selectSession}
                            onNewSession={createNewSession}
                            onDeleteSession={deleteSession}
                            tutorName={tutorProfile?.tutor_name || "AI Tutor"}
                            onClose={() => setMobileSidebarOpen(false)}
                        />
                    </div>
                </div>
            )}

            {sidebarOpen && (
                <div className="relative z-10 w-72 border-r border-border bg-background/85 backdrop-blur-md flex-shrink-0 hidden md:flex flex-col">
                    <SessionSidebar
                        sessions={sessions}
                        activeSessionId={activeSessionId}
                        onSelectSession={selectSession}
                        onNewSession={createNewSession}
                        onDeleteSession={deleteSession}
                        tutorName={tutorProfile?.tutor_name || "AI Tutor"}
                    />
                </div>
            )}

            <div className="relative z-10 flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 border-b border-border bg-background/80 backdrop-blur-xl gap-2 sticky top-14 md:top-16 z-50 shrink-0 shadow-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-10 h-10 md:w-11 md:h-11 text-foreground/60 hover:text-foreground hover:bg-foreground/10 flex-shrink-0 transition-all rounded-full"
                            onClick={() => router.push("/")}
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                        </Button>

                        <div className="w-px h-5 bg-foreground/10 mx-1 hidden sm:block"></div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-10 h-10 text-foreground/40 hover:text-foreground md:hidden flex-shrink-0"
                            onClick={() => setMobileSidebarOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-10 h-10 text-foreground/40 hover:text-foreground hidden md:flex flex-shrink-0"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                        </Button>
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-border flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-sm md:text-base font-semibold text-foreground truncate">
                                    {tutorProfile?.tutor_name || "AI Tutor"}
                                </h1>
                                <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">
                                    {tutorProfile?.tone} • {tutorProfile?.explanation_style}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <ModeSelector activeMode={mode} onModeChange={handleModeChange} />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-10 h-10 text-foreground/40 hover:text-foreground flex-shrink-0"
                            onClick={() => router.push("/ai-tutor/setup")}
                            title="Edit Tutor Settings"
                        >
                            <Settings className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
                    <div
                        className="flex-1 overflow-y-auto scrollbar-hide w-full h-full relative"
                        data-scroll-area
                        onScroll={handleScrollAreaScroll}
                    >
                        {mode === "text" || mode === "doubt-solver" ? (
                            messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center px-4 md:px-8">
                                    <div className="text-center space-y-4 sm:space-y-6 max-w-sm w-full">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-foreground/[0.02] border border-border flex items-center justify-center">
                                            {mode === "doubt-solver" ? (
                                                <Lightbulb className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-400" />
                                            ) : (
                                                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                                                {mode === "doubt-solver"
                                                    ? "Smart Doubt Solver"
                                                    : `Hi! I'm ${tutorProfile?.tutor_name || "your AI Tutor"} 👋`
                                                }
                                            </h2>
                                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                                {mode === "doubt-solver"
                                                    ? "Upload a document, image, or notes snippet, and I'll break down the solution step-by-step."
                                                    : "I'm your personal learning companion. Ask me anything!"
                                                }
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                                            {(() => {
                                                if (mode === "doubt-solver") {
                                                    const doubtActions = [
                                                        { label: "Solve a Math problem", emoji: "📐" },
                                                        { label: "Analyze Physics diagram", emoji: "⚡" },
                                                        { label: "Explain Chemistry reaction", emoji: "🧪" },
                                                        { label: "Debug a code snippet", emoji: "💻" },
                                                    ];
                                                    return doubtActions.map((item) => (
                                                        <button
                                                            key={item.label}
                                                            onClick={async () => {
                                                                const fileInput = document.getElementById("tutor-file-upload");
                                                                if (fileInput) (fileInput as HTMLElement).click();
                                                            }}
                                                            className="p-3 rounded-xl bg-foreground/[0.03] border border-border hover:bg-foreground/[0.06] hover:border-border transition-all text-left active:scale-[0.98]"
                                                        >
                                                            <span className="text-lg">{item.emoji}</span>
                                                            <p className="text-xs text-foreground/70 mt-1">{item.label}</p>
                                                        </button>
                                                    ));
                                                }

                                                const domain = tutorProfile?.education_domain;
                                                const exam = tutorProfile?.target_exam;
                                                let actions = [
                                                    { label: "Explain a complex topic", emoji: "⚡" },
                                                    { label: "Create a study plan", emoji: "📋" },
                                                    { label: "Generate a practice quiz", emoji: "🧠" },
                                                    { label: "Analyze my performance", emoji: "📊" },
                                                ];

                                                if (domain === 'Engineering Entrance' || domain === 'Medical Entrance') {
                                                    actions = [
                                                        { label: `Generate PYQs for ${exam || 'Physics'}`, emoji: "📝" },
                                                        { label: `Take a ${exam || 'Mock'} Test`, emoji: "🎯" },
                                                        { label: "Explain a difficult formula", emoji: "⚡" },
                                                        { label: "Create a 30-day revision plan", emoji: "📅" },
                                                    ];
                                                } else if (domain === 'Engineering Courses') {
                                                    actions = [
                                                        { label: "Explain Data Structures", emoji: "💻" },
                                                        { label: "Write a sorting algorithm", emoji: "⌨️" },
                                                        { label: "Create a project roadmap", emoji: "🗺️" },
                                                        { label: "Prepare for technical interviews", emoji: "👔" },
                                                    ];
                                                } else if (domain === 'School Education') {
                                                    actions = [
                                                        { label: "Explain Gauss Law", emoji: "⚡" },
                                                        { label: `Create a study plan for ${exam || 'Finals'}`, emoji: "📋" },
                                                        { label: "Generate a practice quiz", emoji: "🧠" },
                                                        { label: "Analyze my performance", emoji: "📊" },
                                                    ];
                                                }

                                                return actions.map((item) => (
                                                    <button
                                                        key={item.label}
                                                        onClick={() => sendMessage(item.label)}
                                                        className="p-3 rounded-xl bg-foreground/[0.03] border border-border hover:bg-foreground/[0.06] hover:border-border transition-all text-left active:scale-[0.98]"
                                                    >
                                                        <span className="text-lg">{item.emoji}</span>
                                                        <p className="text-xs text-foreground/70 mt-1">{item.label}</p>
                                                    </button>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-2 sm:py-4">
                                    <div className="max-w-4xl mx-auto">
                                        {messages.map((msg, i) => (
                                            <div key={i}>
                                                <ChatMessage
                                                    role={msg.role}
                                                    content={msg.content}
                                                    tutorName={tutorProfile?.tutor_name}
                                                />
                                                {messageActions.get(i)?.map((action, j) => (
                                                    <div key={j} className="px-4 sm:px-12">
                                                        <InlineActionCard action={action} onActivate={handleActionActivate} />
                                                    </div>
                                                ))}
                                                {msg.role === "assistant" && msg.content && !responding && (
                                                    <SmartActionChips
                                                        content={msg.content}
                                                        userQuestion={(() => {
                                                            for (let j = i - 1; j >= 0; j--) {
                                                                if (messages[j].role === "user") return messages[j].content;
                                                            }
                                                            return "";
                                                        })()}
                                                        onExplainSimpler={() => sendMessage("Explain this in simpler terms, as if teaching a beginner.")}
                                                        onSimulation={(topic) => handleActionActivate({ type: "simulation", topic, label: `Simulate: ${topic}` })}
                                                        onQuiz={(topic) => router.push(`/quizzes?action=generate&topic=${encodeURIComponent(topic)}`)}
                                                        onMindMap={(topic) => handleActionActivate({ type: "mindmap", topic, label: `Mind Map: ${topic}` })}
                                                        onVideo={(topic) => sendMessage(`Create a video lesson script about: ${topic}`)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        {responding && (
                                            <ChatMessage
                                                role="assistant"
                                                content=""
                                                tutorName={tutorProfile?.tutor_name}
                                                isLoading
                                            />
                                        )}
                                    </div>
                                    <div ref={messagesEndRef} />
                                </div>
                            )
                        ) : (
                            <div className="py-2 sm:py-4 h-full flex flex-col">
                                <div className="flex-1 overflow-y-auto scrollbar-hide">
                                    {renderModeContent()}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-3 sm:p-4 border-t border-border bg-background/80 backdrop-blur-xl shrink-0 sticky bottom-0 z-50 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                        <div className="max-w-3xl mx-auto">
                            {/* Hidden file upload button so doubt-solver cards can trigger it */}
                            <input
                                id="tutor-file-upload"
                                type="file"
                                className="hidden"
                                onChange={async (e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        await sendMessage("Solve my uploaded files", Array.from(e.target.files));
                                    }
                                }}
                            />
                            <ChatInput
                                onSend={sendMessage}
                                disabled={responding}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
