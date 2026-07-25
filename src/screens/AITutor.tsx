"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Menu,
  X,
  User,
  Sparkles,
  Play,
  TerminalSquare,
  ExternalLink,
  Square,
  RotateCw,
  Copy,
  Check,
  Edit2,
  Compass,
  Loader2,
  CheckCircle2,
  Wand2,
  Volume2,
  VolumeX,
  GitFork,
  Download,
  Flame,
  GraduationCap,
  Smile,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAIResponseStream, enhanceUserPrompt } from "@/lib/groq";
import { type ChatMessage } from "@/lib/aiProvider";
import { runDeepResearchStream, type DeepResearchStep } from "@/lib/deepResearch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";
import { addGlobalMemory } from "@/lib/aiMemory";
import { EclixLogo } from "@/components/EclixLogo";
import { ModeSelector, TutorMode } from "@/components/ai-tutor/ModeSelector";
import { MindMapViewer } from "@/components/ai-tutor/MindMapViewer";
import { StudyPlanCard } from "@/components/ai-tutor/StudyPlanCard";
import { VideoScriptCard } from "@/components/ai-tutor/VideoScriptCard";
import { QuizCard } from "@/components/ai-tutor/QuizCard";
import { DynamicSimRenderer } from "@/components/simulations/DynamicSimRenderer";
import { SimulationEngine } from "@/components/simulations/SimulationEngine";
import { SIMULATION_REGISTRY } from "@/components/simulations/SimulationRegistry";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { FileAttachment, FilePillsList, AttachedFile } from "@/components/ai-tutor/FileAttachment";
import { ModelSelectorDropdown, MODEL_OPTIONS, AIModelOption } from "@/components/ai-tutor/ModelSelectorDropdown";
import { toast } from "sonner";
import {
  generateMindMapData,
  generateStudyPlan,
  generateDynamicSimulation,
  generateVideoScript,
  generateQuiz,
  DEFAULT_TUTOR_PROFILE,
  MindMapNode,
  StudyPlanDay,
  DynamicSimConfig,
  VideoScript,
  QuizQuestion,
} from "@/lib/aiTutor";

export type PersonaType = "socratic" | "eli5" | "architect" | "roaster";

interface PersonaOption {
  id: PersonaType;
  label: string;
  emoji: string;
  icon: any;
  promptPrefix: string;
}

const PERSONAS: PersonaOption[] = [
  {
    id: "socratic",
    label: "Socratic Professor",
    emoji: "🎓",
    icon: GraduationCap,
    promptPrefix: "Guide the student through Socratic questioning. Do not give direct answers immediately; ask guided questions.",
  },
  {
    id: "eli5",
    label: "ELI5 (Beginner)",
    emoji: "👶",
    icon: Smile,
    promptPrefix: "Explain everything like the user is 5 years old. Use simple real-world analogies, no complex jargon without immediate translation.",
  },
  {
    id: "architect",
    label: "Senior Architect",
    emoji: "💻",
    icon: Code2,
    promptPrefix: "Act as a Lead Systems Architect. Focus on production readiness, system design, O-notation scaling, and design patterns.",
  },
  {
    id: "roaster",
    label: "Code Roaster",
    emoji: "🔥",
    icon: Flame,
    promptPrefix: "Act as a brutally honest, witty code reviewer. Roast code flaws humorously before providing production solutions.",
  },
];

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: {
    mode?: TutorMode;
    mindMap?: MindMapNode;
    studyPlan?: StudyPlanDay[];
    simulation?: DynamicSimConfig;
    videoScript?: VideoScript;
    quiz?: QuizQuestion[];
    researchSteps?: DeepResearchStep[];
    attachedFiles?: { name: string; size: number }[];
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  text: `You are Orbit, an elite AI tutor designed to teach computer science, systems, software engineering, and mathematics.
Your goal is to guide students to deep conceptual understanding using clear breakdowns, intuitive mental models, and production-grade code examples.
- Use clean Markdown formatting.
- Include language-tagged code blocks for any code snippets.
- Be encouraging, precise, and structured.`,

  "doubt-solver": `You are Orbit Doubt Solver, an expert step-by-step academic doubt resolution engine.
When solving doubts:
1. Identify the core misconception or problem statement.
2. Break down the solution into clear, numbered logical steps.
3. Provide mathematical proofs, state transition diagrams, or code traces where applicable.
4. Conclude with a quick self-check question to ensure the student truly understands.`,

  debugger: `You are Orbit Code Debugger, an expert Socratic programming mentor.
Help the student find and fix bugs in their code:
1. Do NOT give the full corrected code solution immediately.
2. Point out the exact line or logic flow where the error occurs.
3. Ask a Socratic question to guide them to fix it themselves.
4. Explain the underlying computer science cause (e.g., off-by-one, null reference, memory leak, race condition).`,
};

export function AITutor() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<TutorMode>("text");
  const [activePersona, setActivePersona] = useState<PersonaType>("socratic");
  const [selectedModel, setSelectedModel] = useState<AIModelOption>(MODEL_OPTIONS[0]);
  const [isResponding, setIsResponding] = useState(false);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [simParams, setSimParams] = useState<Record<string, number>>({});
  const [selectedPresetSim, setSelectedPresetSim] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // File Attachment State
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // Text-To-Speech (TTS) State
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Deep Research progress state
  const [researchSteps, setResearchSteps] = useState<DeepResearchStep[]>([]);

  // UX State
  const [activeFeatureMsgId, setActiveFeatureMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Load sessions from Supabase if authenticated, else localStorage
  useEffect(() => {
    async function loadSessions() {
      if (user?.id) {
        try {
          const remoteSessions = await db.aiSessions.getAll(user.id);
          if (remoteSessions && remoteSessions.length > 0) {
            const formatted = await Promise.all(
              remoteSessions.map(async (s: any) => {
                const msgs = await db.aiMessages.getBySession(s.id);
                return {
                  id: s.id,
                  title: s.title || "Study Session",
                  messages: msgs.map(
                    (m: any, i: number): Message => ({
                      id: m.id || `msg-${Date.now()}-${i}`,
                      role: (m.role || "assistant") as "user" | "assistant" | "system",
                      content: m.content,
                      metadata: m.metadata,
                    })
                  ),
                  createdAt: s.created_at || new Date().toISOString(),
                };
              })
            );
            setSessions(formatted);
            setActiveSessionId(formatted[0].id);
            return;
          }
        } catch (err) {
          console.error("Supabase session load error:", err);
        }
      }

      // Fallback to localStorage
      const saved = localStorage.getItem("orbit_tutor_sessions");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as ChatSession[];
          const migrated = parsed.map((s) => ({
            ...s,
            messages: s.messages.map((m, i) => ({ ...m, id: m.id || `msg-${Date.now()}-${i}` })),
          }));
          setSessions(migrated);
          if (migrated.length > 0) setActiveSessionId(migrated[0].id);
        } catch (e) {
          console.error(e);
        }
      } else {
        const welcomeSession: ChatSession = {
          id: "session-welcome",
          title: "Welcome to Orbit AI",
          messages: [
            {
              id: "msg-welcome-1",
              role: "assistant",
              content:
                "Welcome! I am **Orbit**, your AI Computer Science & STEM Tutor. Select a mode above for **Deep Research**, **Code Attachments**, **Mind Maps**, **Interactive Simulations**, **Study Plans**, **AI Quizzes**, or ask any code & logic doubt!",
            },
          ],
          createdAt: new Date().toISOString(),
        };
        setSessions([welcomeSession]);
        setActiveSessionId(welcomeSession.id);
        localStorage.setItem("orbit_tutor_sessions", JSON.stringify([welcomeSession]));
      }
    }

    loadSessions();
  }, [user?.id]);

  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    localStorage.setItem("orbit_tutor_sessions", JSON.stringify(updated));
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isResponding, researchSteps]);

  useEffect(() => {
    if (activeSession && activeFeatureMsgId) {
      if (!activeSession.messages.find((m) => m.id === activeFeatureMsgId)) {
        setActiveFeatureMsgId(null);
      }
    }
  }, [activeSessionId]);

  const handleNewSession = async () => {
    let newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: `Session ${sessions.length + 1}`,
      messages: [
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: "Started a new study session. What topic, algorithm, or code file shall we analyze today?",
        },
      ],
      createdAt: new Date().toISOString(),
    };

    if (user?.id) {
      try {
        const created = await db.aiSessions.create(user.id, newSession.title, activeMode);
        if (created?.id) {
          newId = created.id;
          newSession.id = newId;
          await db.aiMessages.send(newId, "assistant", newSession.messages[0].content);
        }
      } catch (err) {
        console.error("Supabase create session error:", err);
      }
    }

    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newId);
    setSidebarOpen(false);
    setActiveFeatureMsgId(null);
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (user?.id) {
      try {
        await db.aiSessions.delete(id);
      } catch (err) {
        console.error("Supabase delete session error:", err);
      }
    }
    const updated = sessions.filter((s) => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
      setActiveFeatureMsgId(null);
    }
  };

  // Fork session at current message
  const handleForkSession = (messageId: string) => {
    if (!activeSession) return;
    const msgIndex = activeSession.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const forkedMessages = activeSession.messages.slice(0, msgIndex + 1);
    const newId = `session-fork-${Date.now()}`;
    const forkedSession: ChatSession = {
      id: newId,
      title: `Fork of ${activeSession.title}`,
      messages: forkedMessages,
      createdAt: new Date().toISOString(),
    };

    const updated = [forkedSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newId);
    toast.success(`Forked chat into "${forkedSession.title}"`);
  };

  // Export session to Markdown file
  const handleExportChat = () => {
    if (!activeSession) return;
    let mdContent = `# ${activeSession.title}\n*Exported from Orbit AI Tutor on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    activeSession.messages.forEach((m) => {
      const sender = m.role === "user" ? "👤 **Student**" : "🤖 **Orbit AI Tutor**";
      mdContent += `${sender}\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSession.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported conversation to Markdown file!");
  };

  // Prompt Enhancer ("Magic Wand")
  const handleEnhancePrompt = async () => {
    if (!input.trim() || isEnhancingPrompt) return;
    setIsEnhancingPrompt(true);
    try {
      const enhanced = await enhanceUserPrompt(input);
      setInput(enhanced);
      toast.success("Prompt optimized by Orbit Magic Wand!");
    } catch (e) {
      toast.error("Could not enhance prompt.");
    } finally {
      setIsEnhancingPrompt(false);
    }
  };

  // Text-To-Speech (TTS) Readout
  const handleSpeakMessage = (msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/```[\s\S]*?```/g, "Code block omitted.").replace(/[*_#`[\]()]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Stop current generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsResponding(false);
      toast.info("Generation stopped");
    }
  };

  // Copy message content
  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMsgId(msgId);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Edit user message
  const handleEditMessage = (msgId: string, oldContent: string) => {
    if (!activeSession) return;
    setInput(oldContent);
    const msgIndex = activeSession.messages.findIndex((m) => m.id === msgId);
    if (msgIndex !== -1) {
      const truncated = activeSession.messages.slice(0, msgIndex);
      const updatedSession = { ...activeSession, messages: truncated };
      setSessions(sessions.map((s) => (s.id === activeSessionId ? updatedSession : s)));
      saveSessions(sessions.map((s) => (s.id === activeSessionId ? updatedSession : s)));
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = async (msgId: string) => {
    if (!activeSession || isResponding) return;
    const msgIndex = activeSession.messages.findIndex((m) => m.id === msgId);
    if (msgIndex <= 0) return;

    const truncatedMessages = activeSession.messages.slice(0, msgIndex);
    const lastUserMsg = truncatedMessages.filter((m) => m.role === "user").slice(-1)[0];
    if (!lastUserMsg) return;

    const updatedSession = { ...activeSession, messages: truncatedMessages };
    setSessions(sessions.map((s) => (s.id === activeSessionId ? updatedSession : s)));

    executeAiRequest(lastUserMsg.content, truncatedMessages, updatedSession);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && attachedFiles.length === 0) || isResponding || !activeSessionId || !activeSession) return;

    let fullPromptText = input.trim();

    // Format attached files into context
    if (attachedFiles.length > 0) {
      const fileContext = attachedFiles
        .map((f) => `\n\n[ATTACHED FILE: ${f.name}]\n\`\`\`${f.type}\n${f.content}\n\`\`\``)
        .join("");
      fullPromptText = fullPromptText + fileContext;
    }

    const userMessage: Message = {
      id: `msg-u-${Date.now()}`,
      role: "user",
      content: fullPromptText,
      metadata: {
        mode: activeMode,
        attachedFiles: attachedFiles.map((f) => ({ name: f.name, size: f.size })),
      },
    };
    const updatedMessages = [...activeSession.messages, userMessage];

    let newTitle = activeSession.title;
    if (activeSession.title.startsWith("Session ") || activeSession.title === "Welcome to Orbit AI") {
      const rawText = input.trim() || attachedFiles[0]?.name || "Study Session";
      newTitle = rawText.slice(0, 24) + (rawText.length > 24 ? "..." : "");
    }

    const updatedSession: ChatSession = {
      ...activeSession,
      title: newTitle,
      messages: updatedMessages,
    };

    setSessions(sessions.map((s) => (s.id === activeSessionId ? updatedSession : s)));
    setInput("");
    setAttachedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    if (user?.id) {
      db.aiMessages.send(activeSessionId, "user", fullPromptText).catch(console.error);
    }

    addGlobalMemory("AITutor", `User asked: "${fullPromptText.slice(0, 100)}" in mode: ${activeMode}`);

    executeAiRequest(fullPromptText, updatedMessages, updatedSession, newTitle);
  };

  // Core execution engine supporting model override, persona prompts, ChatMessage[] context, and AbortSignal
  const executeAiRequest = async (
    queryText: string,
    historyMessages: Message[],
    currentSession: ChatSession,
    newTitle?: string
  ) => {
    setIsResponding(true);
    setResearchSteps([]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    const modelOverride = {
      provider: selectedModel.provider,
      model: selectedModel.model,
    };

    try {
      const assistantMsgId = `msg-a-${Date.now()}`;
      let assistantMsg: Message = { id: assistantMsgId, role: "assistant", content: "" };

      // Deep Research Mode
      if (activeMode === "deep-research") {
        let streamedContent = "";
        const templateSession: ChatSession = {
          ...currentSession,
          messages: [...historyMessages, { id: assistantMsgId, role: "assistant", content: "" }],
        };
        setSessions(sessions.map((s) => (s.id === activeSessionId ? templateSession : s)));

        const researchGenerator = runDeepResearchStream(
          queryText,
          (steps) => setResearchSteps(steps),
          signal
        );

        for await (const chunk of researchGenerator) {
          streamedContent += chunk;
          const liveSession: ChatSession = {
            ...currentSession,
            messages: [...historyMessages, { id: assistantMsgId, role: "assistant", content: streamedContent }],
          };
          setSessions(sessions.map((s) => (s.id === activeSessionId ? liveSession : s)));
        }
        assistantMsg = {
          id: assistantMsgId,
          role: "assistant",
          content: streamedContent,
          metadata: { mode: "deep-research" },
        };
      } else if (activeMode === "mindmap") {
        const mindMapData = await generateMindMapData(queryText, DEFAULT_TUTOR_PROFILE, { name: "Student" });
        assistantMsg = {
          id: assistantMsgId,
          role: "assistant",
          content: `Here is the visual concept mind map for **${queryText}**.`,
          metadata: { mode: "mindmap", mindMap: mindMapData || undefined },
        };
      } else if (activeMode === "studyplan") {
        const planData = await generateStudyPlan(queryText, 7, DEFAULT_TUTOR_PROFILE, { name: "Student" });
        assistantMsg = {
          id: assistantMsgId,
          role: "assistant",
          content: `Generated a structured **7-Day Mastery Roadmap** for **${queryText}**.`,
          metadata: { mode: "studyplan", studyPlan: planData },
        };
      } else if (activeMode === "quiz") {
        const quizData = await generateQuiz(queryText, "medium", 5, DEFAULT_TUTOR_PROFILE, { name: "Student" });
        assistantMsg = {
          id: assistantMsgId,
          role: "assistant",
          content: `Generated a custom 5-question quiz for **${queryText}**.`,
          metadata: { mode: "quiz", quiz: quizData },
        };
      } else if (activeMode === "visualization") {
        const simConfig = await generateDynamicSimulation(queryText, DEFAULT_TUTOR_PROFILE, { name: "Student" });
        if (simConfig?.parameters) {
          const defaults: Record<string, number> = {};
          simConfig.parameters.forEach((p) => {
            defaults[p.key] = p.default;
          });
          setSimParams(defaults);
        }
        assistantMsg = {
          id: assistantMsgId,
          role: "assistant",
          content: `Generated an interactive simulation model for **${queryText}**.`,
          metadata: { mode: "visualization", simulation: simConfig || undefined },
        };
      } else if (activeMode === "video") {
        const scriptData = await generateVideoScript(queryText, DEFAULT_TUTOR_PROFILE, { name: "Student" });
        assistantMsg = {
          id: assistantMsgId,
          role: "assistant",
          content: `Created an educational video script for **${queryText}**.`,
          metadata: { mode: "video", videoScript: scriptData || undefined },
        };
      } else {
        // Standard Streaming Modes (text, doubt-solver, debugger)
        const persona = PERSONAS.find((p) => p.id === activePersona) || PERSONAS[0];
        let systemContent = SYSTEM_PROMPTS[activeMode] || SYSTEM_PROMPTS.text;
        systemContent = `${persona.promptPrefix}\n\n${systemContent}`;

        // Build clean multi-turn ChatMessage[] conversation context (up to 30 messages)
        const formattedContextMessages: ChatMessage[] = historyMessages
          .slice(-30)
          .filter((m) => m.role === "user" || m.role === "assistant")
          .map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

        const chatMessages: ChatMessage[] = [
          { role: "system", content: systemContent },
          ...formattedContextMessages,
        ];

        const stream = generateAIResponseStream(chatMessages, 0.6, 0.6, signal, modelOverride);

        let streamedContent = "";
        const templateSession: ChatSession = {
          ...currentSession,
          messages: [...historyMessages, { id: assistantMsgId, role: "assistant", content: "" }],
        };
        setSessions(sessions.map((s) => (s.id === activeSessionId ? templateSession : s)));

        for await (const chunk of stream) {
          streamedContent += chunk;
          const liveSession: ChatSession = {
            ...currentSession,
            messages: [...historyMessages, { id: assistantMsgId, role: "assistant", content: streamedContent }],
          };
          setSessions(sessions.map((s) => (s.id === activeSessionId ? liveSession : s)));
        }
        assistantMsg = {
          id: assistantMsgId,
          role: "assistant",
          content: streamedContent,
          metadata: { mode: activeMode },
        };
      }

      // Finalize session state
      const finalMessages: Message[] = [...historyMessages, assistantMsg];
      const finalSession: ChatSession = {
        ...currentSession,
        title: newTitle || currentSession.title,
        messages: finalMessages,
      };
      const finalSessions: ChatSession[] = sessions.map((s) => (s.id === activeSessionId ? finalSession : s));
      saveSessions(finalSessions);

      if (assistantMsg.metadata && Object.keys(assistantMsg.metadata).length > 1) {
        setActiveFeatureMsgId(assistantMsg.id);
      }

      if (user?.id && activeSessionId) {
        db.aiMessages.send(activeSessionId, "assistant", assistantMsg.content, assistantMsg.metadata).catch(console.error);
        if (newTitle) db.aiSessions.update(activeSessionId, { title: newTitle }).catch(console.error);
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.log("AI generation stopped cleanly by user.");
      } else {
        console.error(error);
        toast.error("An error occurred generating response.");
      }
    } finally {
      setIsResponding(false);
      setResearchSteps([]);
      abortControllerRef.current = null;
    }
  };

  const activeFeatureMsg = activeSession?.messages.find((m) => m.id === activeFeatureMsgId);
  const showFeatureStage = activeFeatureMsg != null;

  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[#040404] text-white flex flex-col select-none">
      {/* Header Bar */}
      <header className="border-b border-white/10 bg-[#090909] py-3 z-40 sticky top-0 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/");
                }
              }}
              title="Go to Previous Page"
              className="text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-neutral-400 hover:text-white"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <div
              onClick={() => router.push("/")}
              className="flex items-center gap-2.5 cursor-pointer group px-2 py-1 rounded-xl hover:bg-white/5 transition-all"
              title="Go to Dashboard"
            >
              <EclixLogo className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
              <div>
                <h1 className="text-base md:text-lg font-extrabold flex items-center gap-2 tracking-tight text-white">
                  <Bot className="w-4 h-4 text-primary" />
                  Orbit AI Tutor
                </h1>
                <p className="text-[10px] md:text-xs text-neutral-400 hidden sm:block">
                  CS Coach, Deep Research, Code File Analysis & Simulations
                </p>
              </div>
            </div>
          </div>

          {/* Mode Selector & Model Switcher Toolbar */}
          <div className="flex items-center gap-3 min-w-0">
            <ModeSelector activeMode={activeMode} onModeChange={setActiveMode} />

            <ModelSelectorDropdown
              selectedModelId={selectedModel.id}
              onSelectModel={setSelectedModel}
            />

            <Button
              onClick={handleNewSession}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white font-bold flex items-center gap-1.5 text-xs px-3 shadow-md shadow-primary/20 shrink-0"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Session</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden container mx-auto px-4 md:px-6 py-4 gap-6 max-w-7xl relative">
        {/* Left Drawer / Sidebar */}
        <aside
          className={cn(
            "absolute md:static top-4 bottom-4 left-4 z-30 w-72 border border-white/10 rounded-2xl bg-[#0a0a0a] overflow-hidden flex flex-col shrink-0 transition-transform duration-200 shadow-2xl md:shadow-none",
            sidebarOpen ? "translate-x-0" : "-translate-x-[320px] md:translate-x-0"
          )}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" /> Saved Chats
            </span>
            <div className="flex items-center gap-2">
              {activeSession && (
                <button
                  onClick={handleExportChat}
                  className="text-neutral-400 hover:text-white p-1 rounded transition-colors"
                  title="Export session to Markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono font-bold">
                {sessions.length}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
            {sessions.map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer group transition-all duration-150 border",
                    isActive
                      ? "bg-primary/15 text-primary border-primary/30 font-semibold"
                      : "hover:bg-white/5 text-neutral-400 hover:text-white border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Sparkles className="w-4 h-4 shrink-0 opacity-70 text-primary" />
                    <span className="text-xs truncate leading-none">{s.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Chat Feed */}
        <main
          className={cn(
            "border border-white/10 rounded-2xl bg-[#0a0a0a] overflow-hidden flex flex-col relative transition-all duration-300",
            showFeatureStage ? "hidden md:flex flex-1 md:max-w-sm lg:max-w-md shrink-0" : "flex-1"
          )}
        >
          {/* Persona Switcher Bar */}
          <div className="px-4 py-2 border-b border-white/5 bg-neutral-950/60 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 shrink-0">Persona:</span>
            <div className="flex items-center gap-1.5">
              {PERSONAS.map((p) => {
                const Icon = p.icon;
                const isActive = activePersona === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePersona(p.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 shrink-0",
                      isActive
                        ? "bg-primary/20 text-primary border border-primary/30 font-bold"
                        : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
            {activeSession ? (
              activeSession.messages.map((m, idx) => {
                const isAssistant = m.role === "assistant";
                const isDebugger = m.metadata?.mode === "debugger";
                const isDeepResearch = m.metadata?.mode === "deep-research";
                const isLastAssistant = isAssistant && idx === activeSession.messages.length - 1;
                const hasFeature = m.metadata && Object.keys(m.metadata).length > 1;
                const isSpeaking = speakingMsgId === m.id;

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-3 sm:gap-4 p-4 rounded-2xl border transition-all w-full group relative",
                      isDebugger && isAssistant
                        ? "bg-black border-green-500/30 font-mono shadow-[0_0_15px_rgba(34,197,94,0.1)] rounded-md"
                        : isAssistant
                        ? "bg-neutral-900/50 border-white/10 mr-auto max-w-[95%] sm:max-w-[90%]"
                        : "bg-primary/10 border-primary/20 ml-auto max-w-[95%] sm:max-w-[85%]"
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs font-bold shadow-md",
                        isDebugger && isAssistant
                          ? "bg-green-500/10 border-green-500/30 text-green-400 rounded-md"
                          : isAssistant
                          ? "bg-neutral-950 border-white/15 text-primary"
                          : "bg-primary text-white border-primary/40"
                      )}
                    >
                      {isDebugger && isAssistant ? (
                        <TerminalSquare className="w-4 h-4" />
                      ) : isDeepResearch && isAssistant ? (
                        <Compass className="w-4 h-4 text-blue-400 animate-spin-slow" />
                      ) : isAssistant ? (
                        <Bot className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>

                    <div className={cn("space-y-3 overflow-x-auto w-full", isDebugger && isAssistant ? "text-green-400" : "")}>
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase tracking-wider block",
                            isDebugger && isAssistant
                              ? "text-green-600"
                              : isDeepResearch && isAssistant
                              ? "text-blue-400"
                              : "text-neutral-400"
                          )}
                        >
                          {isDebugger && isAssistant
                            ? "ORBIT DEBUG_TERM"
                            : isDeepResearch && isAssistant
                            ? "ORBIT DEEP RESEARCH ENGINE"
                            : isAssistant
                            ? "ORBIT AI TUTOR"
                            : "STUDENT"}
                        </span>

                        {/* Action Toolbar */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isAssistant && m.content && (
                            <>
                              <button
                                onClick={() => handleSpeakMessage(m.id, m.content)}
                                className={cn(
                                  "p-1 transition-colors rounded-md hover:bg-white/5",
                                  isSpeaking ? "text-primary animate-pulse" : "text-neutral-400 hover:text-white"
                                )}
                                title={isSpeaking ? "Stop Speaking" : "Read Aloud (Text-to-Speech)"}
                              >
                                {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={() => handleCopyMessage(m.id, m.content)}
                                className="p-1 text-neutral-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
                                title="Copy message"
                              >
                                {copiedMsgId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                onClick={() => handleForkSession(m.id)}
                                className="p-1 text-neutral-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
                                title="Fork chat from here"
                              >
                                <GitFork className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {!isAssistant && (
                            <>
                              <button
                                onClick={() => handleEditMessage(m.id, m.content)}
                                className="p-1 text-neutral-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
                                title="Edit message"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleForkSession(m.id)}
                                className="p-1 text-neutral-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
                                title="Fork chat from here"
                              >
                                <GitFork className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {isLastAssistant && !isResponding && (
                            <button
                              onClick={() => handleRegenerate(m.id)}
                              className="p-1 text-neutral-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
                              title="Regenerate response"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Render text response */}
                      {m.content ? (
                        <ChatMarkdown content={m.content} />
                      ) : (
                        <div className="flex items-center gap-2 text-neutral-400 text-xs py-1">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span>Orbit is thinking...</span>
                        </div>
                      )}

                      {/* Button to open feature in stage */}
                      {hasFeature && (
                        <Button
                          onClick={() => setActiveFeatureMsgId(m.id)}
                          variant="outline"
                          size="sm"
                          className={cn(
                            "mt-2 border-primary/30 text-primary hover:bg-primary/10 gap-2 w-full",
                            activeFeatureMsgId === m.id ? "bg-primary/20 border-primary" : ""
                          )}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View{" "}
                          {m.metadata?.mode === "mindmap"
                            ? "Mind Map"
                            : m.metadata?.mode === "quiz"
                            ? "Quiz"
                            : m.metadata?.mode === "studyplan"
                            ? "Study Plan"
                            : m.metadata?.mode === "visualization"
                            ? "Simulation"
                            : "Generated Asset"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-neutral-500 text-sm gap-2">
                <Bot className="w-10 h-10 opacity-30 text-primary animate-pulse" />
                <span>Click "New Session" to start learning with Orbit.</span>
              </div>
            )}

            {/* Live Deep Research Step Progress Display */}
            {researchSteps.length > 0 && (
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
                  <Compass className="w-4 h-4 animate-spin" /> Deep Research Execution Steps
                </div>
                <div className="space-y-2">
                  {researchSteps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-neutral-300">
                        {step.status === "running" && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />}
                        {step.status === "completed" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                        {step.status === "pending" && <div className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0" />}
                        <span>{step.title}</span>
                      </div>
                      {step.detail && <span className="text-[10px] text-neutral-500 font-mono">{step.detail}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Bar — File Upload, Prompt Magic Wand, Auto-resizing Textarea, Stop Generation */}
          <div className="p-3 sm:p-4 border-t border-white/10 bg-[#0c0c0c] flex flex-col gap-2 shrink-0">
            {/* File Pills List */}
            <FilePillsList
              attachedFiles={attachedFiles}
              onRemoveFile={(id) => setAttachedFiles(attachedFiles.filter((f) => f.id !== id))}
            />

            <form onSubmit={handleSend} className="flex gap-2 items-end">
              {/* File Upload Button */}
              <FileAttachment
                attachedFiles={attachedFiles}
                onAddFiles={(newFiles) => setAttachedFiles([...attachedFiles, ...newFiles])}
                onRemoveFile={(id) => setAttachedFiles(attachedFiles.filter((f) => f.id !== id))}
                disabled={isResponding || !activeSessionId}
              />

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder={
                  isResponding
                    ? "Orbit is generating response..."
                    : activeMode === "deep-research"
                    ? "Enter research topic or question for in-depth report..."
                    : "Ask Orbit anything, or attach code files... (Shift+Enter for newline)"
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                className="bg-neutral-950 border border-white/10 focus-visible:ring-1 focus-visible:ring-primary text-sm p-3 flex-1 rounded-xl outline-none resize-none min-h-[48px] text-white placeholder:text-neutral-500 custom-scrollbar"
                disabled={isResponding || !activeSessionId}
              />

              {/* Magic Wand Prompt Enhancer */}
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={!input.trim() || isResponding || isEnhancingPrompt}
                className={cn(
                  "h-12 w-12 rounded-xl bg-neutral-900 border border-white/10 hover:border-amber-500/40 hover:bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                  isEnhancingPrompt && "animate-pulse"
                )}
                title="Orbit Magic Wand: Expand draft into a structured high-yield prompt"
              >
                {isEnhancingPrompt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              </button>

              {/* Send or Stop */}
              {isResponding ? (
                <Button
                  type="button"
                  onClick={handleStopGeneration}
                  className="h-12 w-12 rounded-xl bg-red-500/20 border border-red-500/40 hover:bg-red-500/30 text-red-400 flex items-center justify-center shrink-0 transition-colors shadow-lg"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4 fill-current" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={(!input.trim() && attachedFiles.length === 0) || !activeSessionId}
                  className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center shrink-0 transition-colors shadow-lg shadow-primary/20"
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </form>
          </div>
        </main>

        {/* Right Active Feature Stage */}
        {showFeatureStage && (
          <section className="flex-1 border border-white/10 rounded-2xl bg-[#0c0c0c] overflow-hidden flex flex-col relative animate-in slide-in-from-right-4 duration-300">
            <div className="p-3 sm:p-4 border-b border-white/10 bg-neutral-900/50 flex justify-between items-center z-10 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-neutral-300 uppercase tracking-widest">
                  {activeFeatureMsg?.metadata?.mode === "mindmap"
                    ? "Concept Map Explorer"
                    : activeFeatureMsg?.metadata?.mode === "quiz"
                    ? "Knowledge Check"
                    : activeFeatureMsg?.metadata?.mode === "studyplan"
                    ? "Mastery Roadmap"
                    : activeFeatureMsg?.metadata?.mode === "visualization"
                    ? "Interactive Simulation"
                    : "Active Workspace"}
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setActiveFeatureMsgId(null)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              {/* Special Simulation Launcher Banner in Simulation Mode */}
              {activeFeatureMsg?.metadata?.mode === "visualization" && (
                <div className="p-4 border-b border-white/10 bg-neutral-900/80 backdrop-blur-md space-y-3 sticky top-0 z-20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-emerald-400" /> Pre-built Models
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SIMULATION_REGISTRY.map((sim) => (
                      <button
                        key={sim.id}
                        onClick={() => setSelectedPresetSim(selectedPresetSim === sim.id ? null : sim.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5",
                          selectedPresetSim === sim.id
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-md"
                            : "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10"
                        )}
                      >
                        <span>{sim.emoji}</span>
                        <span>{sim.title}</span>
                      </button>
                    ))}
                  </div>

                  {selectedPresetSim && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <SimulationEngine activeSimId={selectedPresetSim} onClearActiveSimId={() => setSelectedPresetSim(null)} />
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto h-full min-h-[500px]">
                {activeFeatureMsg?.metadata?.mindMap && <MindMapViewer data={activeFeatureMsg.metadata.mindMap} />}

                {activeFeatureMsg?.metadata?.studyPlan && <StudyPlanCard plan={activeFeatureMsg.metadata.studyPlan} />}

                {activeFeatureMsg?.metadata?.quiz && <QuizCard questions={activeFeatureMsg.metadata.quiz} />}

                {activeFeatureMsg?.metadata?.simulation && (
                  <DynamicSimRenderer config={activeFeatureMsg.metadata.simulation} paramValues={simParams} />
                )}

                {activeFeatureMsg?.metadata?.videoScript && <VideoScriptCard script={activeFeatureMsg.metadata.videoScript} />}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
