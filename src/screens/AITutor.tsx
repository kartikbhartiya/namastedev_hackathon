"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Send, Plus, Trash2, MessageSquare, Menu, X, User, Settings, Sparkles, Play, HelpCircle, Mic, TerminalSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateAIResponseStream } from "@/lib/groq";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";
import { addGlobalMemory } from "@/lib/aiMemory";
import { ModeSelector, TutorMode } from "@/components/ai-tutor/ModeSelector";
import { MindMapViewer } from "@/components/ai-tutor/MindMapViewer";
import { StudyPlanCard } from "@/components/ai-tutor/StudyPlanCard";
import { VideoScriptCard } from "@/components/ai-tutor/VideoScriptCard";
import { QuizCard } from "@/components/ai-tutor/QuizCard";
import { DynamicSimRenderer } from "@/components/simulations/DynamicSimRenderer";
import { SimulationEngine } from "@/components/simulations/SimulationEngine";
import { SIMULATION_REGISTRY } from "@/components/simulations/SimulationRegistry";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import {
  generateMindMapData,
  generateStudyPlan,
  generateDynamicSimulation,
  generateVideoScript,
  generateQuiz,
  DEFAULT_TUTOR_PROFILE,
  TutorProfile,
  MindMapNode,
  StudyPlanDay,
  DynamicSimConfig,
  VideoScript,
  QuizQuestion
} from "@/lib/aiTutor";

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
  };
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

const SYSTEM_PROMPT = `You are Orbit, an elite AI tutor designed to teach computer science, systems, and algorithms.
Your goal is to guide students to deep conceptual understanding using Socratic questioning, structured breakdowns, and clear code examples.
- Keep your answers clean, structured, and easy to read.
- Use code blocks with language identifiers when showing code.
- Be encouraging, precise, and concise.`;

export function AITutor() {
  const router = useRouter();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<TutorMode>("text");
  const [isResponding, setIsResponding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [simParams, setSimParams] = useState<Record<string, number>>({});
  const [selectedPresetSim, setSelectedPresetSim] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // UX State
  const [activeFeatureMsgId, setActiveFeatureMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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
                  messages: msgs.map((m: any, i: number): Message => ({ 
                    id: m.id || `msg-${Date.now()}-${i}`,
                    role: (m.role || "assistant") as "user" | "assistant" | "system", 
                    content: m.content, 
                    metadata: m.metadata 
                  })),
                  createdAt: s.created_at || new Date().toISOString()
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
          // ensure legacy messages have IDs
          const migrated = parsed.map(s => ({
              ...s,
              messages: s.messages.map((m, i) => ({ ...m, id: m.id || `msg-${Date.now()}-${i}` }))
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
              content: "Welcome! I am **Orbit**, your AI Computer Science & STEM Tutor. Select a mode above to generate **Mind Maps**, **Interactive Simulations**, **Study Plans**, **AI Quizzes**, or ask any code & logic doubt!"
            }
          ],
          createdAt: new Date().toISOString()
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

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isResponding]);

  // When session changes, clear active feature if it doesn't exist in new session
  useEffect(() => {
    if (activeSession && activeFeatureMsgId) {
      if (!activeSession.messages.find(m => m.id === activeFeatureMsgId)) {
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
          content: "Started a new study session. What topic, algorithm, or concept shall we master today?"
        }
      ],
      createdAt: new Date().toISOString()
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
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
      setActiveFeatureMsgId(null);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isResponding || !activeSessionId || !activeSession) return;

    const queryText = input.trim();
    const userMessage: Message = { id: `msg-u-${Date.now()}`, role: "user", content: queryText, metadata: { mode: activeMode } };
    const updatedMessages = [...activeSession.messages, userMessage];

    let newTitle = activeSession.title;
    if (activeSession.title.startsWith("Session ") || activeSession.title === "Welcome to Orbit AI") {
      newTitle = queryText.slice(0, 24) + (queryText.length > 24 ? "..." : "");
    }

    const updatedSession: ChatSession = {
      ...activeSession,
      title: newTitle,
      messages: updatedMessages
    };

    setSessions(sessions.map(s => s.id === activeSessionId ? updatedSession : s));
    setInput("");
    setIsResponding(true);

    if (user?.id) {
      db.aiMessages.send(activeSessionId, "user", queryText).catch(console.error);
    }

    // Add to global context memory
    addGlobalMemory("AITutor", `User asked: "${queryText}" in mode: ${activeMode}`);

    try {
      const assistantMsgId = `msg-a-${Date.now()}`;
      let assistantMsg: Message = { id: assistantMsgId, role: "assistant", content: "" };

      // Handle specialized tutor modes
      if (activeMode === "mindmap") {
        const mindMapData = await generateMindMapData(queryText, DEFAULT_TUTOR_PROFILE, { name: "Student" });
        assistantMsg = {
          id: assistantMsgId,
          role: "assistant",
          content: `Here is the visual concept mind map for **${queryText}**.`,
          metadata: { mode: "mindmap", mindMap: mindMapData || undefined }
        };
        addGlobalMemory("AITutor", `Generated a mind map for ${queryText}`);
      } else if (activeMode === "studyplan") {
        const planData = await generateStudyPlan(queryText, 7, DEFAULT_TUTOR_PROFILE, { name: "Student" });
        assistantMsg = {
          id: assistantMsgId,
          role: "assistant",
          content: `Generated a structured **7-Day Mastery Roadmap** for **${queryText}**.`,
          metadata: { mode: "studyplan", studyPlan: planData }
        };
        addGlobalMemory("AITutor", `Generated a study plan for ${queryText}`);
      } else if (activeMode === "quiz") {
        const quizData = await generateQuiz(queryText, "medium", 5, DEFAULT_TUTOR_PROFILE, { name: "Student" });
        assistantMsg = {
          id: assistantMsgId,
          role: "assistant",
          content: `Generated a custom 5-question quiz for **${queryText}**.`,
          metadata: { mode: "quiz", quiz: quizData }
        };
        addGlobalMemory("AITutor", `Generated a quiz for ${queryText}`);
      } else if (activeMode === "visualization") {
        const simConfig = await generateDynamicSimulation(queryText, DEFAULT_TUTOR_PROFILE, { name: "Student" });
        if (simConfig?.parameters) {
          const defaults: Record<string, number> = {};
          simConfig.parameters.forEach(p => { defaults[p.key] = p.default; });
          setSimParams(defaults);
        }
        assistantMsg = {
          id: assistantMsgId,
          role: "assistant",
          content: `Generated an interactive simulation model for **${queryText}**.`,
          metadata: { mode: "visualization", simulation: simConfig || undefined }
        };
        addGlobalMemory("AITutor", `Generated an interactive simulation for ${queryText}`);
      } else if (activeMode === "video") {
        const scriptData = await generateVideoScript(queryText, DEFAULT_TUTOR_PROFILE, { name: "Student" });
        assistantMsg = {
          id: assistantMsgId,
          role: "assistant",
          content: `Created an educational video script for **${queryText}**.`,
          metadata: { mode: "video", videoScript: scriptData || undefined }
        };
        addGlobalMemory("AITutor", `Generated a video script for ${queryText}`);
      } else if (activeMode === "debugger") {
        const DEBUGGER_PROMPT = `You are Orbit Code Debugger, an expert Socratic programming mentor.
Help the student find and fix bugs in their code.
1. Do NOT give the full corrected code solution immediately.
2. Point out the exact line or logic flow where the error occurs.
3. Ask a Socratic question to guide them to fix it themselves.
4. Explain the underlying computer science cause (e.g., off-by-one, null reference, memory leak, race condition).`;

        const contextMessages = updatedMessages.slice(-8);
        const conversationPrompt = contextMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
        const stream = generateAIResponseStream(DEBUGGER_PROMPT, `${conversationPrompt}\nDEBUGGER:`, 0.6);

        let streamedContent = "";
        const templateSession: ChatSession = {
          ...updatedSession,
          messages: [...updatedMessages, { id: assistantMsgId, role: "assistant", content: "" }]
        };
        setSessions(sessions.map(s => s.id === activeSessionId ? templateSession : s));

        for await (const chunk of stream) {
          streamedContent += chunk;
          const liveSession: ChatSession = {
            ...updatedSession,
            messages: [...updatedMessages, { id: assistantMsgId, role: "assistant", content: streamedContent }]
          };
          setSessions(sessions.map(s => s.id === activeSessionId ? liveSession : s));
        }
        assistantMsg = { id: assistantMsgId, role: "assistant", content: streamedContent, metadata: { mode: "debugger" } };
      } else {
        // Standard Text Streaming Mode
        const contextMessages = updatedMessages.slice(-8);
        const conversationPrompt = contextMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
        const stream = generateAIResponseStream(SYSTEM_PROMPT, `${conversationPrompt}\nASSISTANT:`, 0.7);

        let streamedContent = "";
        const templateSession: ChatSession = {
          ...updatedSession,
          messages: [...updatedMessages, { id: assistantMsgId, role: "assistant", content: "" }]
        };
        setSessions(sessions.map(s => s.id === activeSessionId ? templateSession : s));

        for await (const chunk of stream) {
          streamedContent += chunk;
          const liveSession: ChatSession = {
            ...updatedSession,
            messages: [...updatedMessages, { id: assistantMsgId, role: "assistant", content: streamedContent }]
          };
          setSessions(sessions.map(s => s.id === activeSessionId ? liveSession : s));
        }
        assistantMsg = { id: assistantMsgId, role: "assistant", content: streamedContent, metadata: { mode: "text" } };
      }

      // Finalize message state
      const finalMessages: Message[] = [...updatedMessages, assistantMsg];
      const finalSession: ChatSession = { ...updatedSession, title: newTitle, messages: finalMessages };
      const finalSessions: ChatSession[] = sessions.map(s => s.id === activeSessionId ? finalSession : s);
      saveSessions(finalSessions);
      
      // Auto-open feature stage if a feature was generated
      if (assistantMsg.metadata && Object.keys(assistantMsg.metadata).length > 1) {
          setActiveFeatureMsgId(assistantMsg.id);
      }

      if (user?.id) {
        db.aiMessages.send(activeSessionId, "assistant", assistantMsg.content, assistantMsg.metadata).catch(console.error);
        db.aiSessions.update(activeSessionId, { title: newTitle }).catch(console.error);
      }
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: `msg-err-${Date.now()}`,
        role: "assistant",
        content: "An error occurred while generating your tutor response. Please try again."
      };
      saveSessions(sessions.map(s => s.id === activeSessionId ? { ...updatedSession, messages: [...updatedMessages, errorMsg] } : s));
    } finally {
      setIsResponding(false);
    }
  };

  const activeFeatureMsg = activeSession?.messages.find(m => m.id === activeFeatureMsgId);
  const showFeatureStage = activeFeatureMsg != null;

  return (
    <div className="min-h-screen bg-[#040404] text-white flex flex-col select-none">
      {/* Header Bar */}
      <header className="border-b border-white/10 bg-[#090909] py-3.5 z-40 sticky top-0 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-neutral-400 hover:text-white">
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

            <div>
              <h1 className="text-base md:text-lg font-extrabold flex items-center gap-2 tracking-tight">
                <Bot className="w-5 h-5 text-primary" />
                Orbit AI Tutor
              </h1>
              <p className="text-[10px] md:text-xs text-neutral-400 hidden sm:block">
                Interactive Socratic CS Coach, Simulations & Assessment Suite
              </p>
            </div>
          </div>

          {/* Mode Selector Toolbar */}
          <div className="flex items-center gap-3">
            <ModeSelector activeMode={activeMode} onModeChange={setActiveMode} />

            <Button
              onClick={handleNewSession}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white font-bold flex items-center gap-1.5 text-xs px-3 shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Session</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden container mx-auto px-4 md:px-6 py-6 gap-6 max-w-7xl relative">

        {/* Left Drawer / Sidebar */}
        <aside className={cn(
          "absolute md:static top-6 bottom-6 left-4 z-30 w-72 border border-white/10 rounded-2xl bg-[#0a0a0a] overflow-hidden flex flex-col shrink-0 transition-transform duration-200 shadow-2xl md:shadow-none",
          sidebarOpen ? "translate-x-0" : "-translate-x-[320px] md:translate-x-0"
        )}>
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" /> Saved Chats
            </span>
            <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-mono font-bold">
              {sessions.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
            {sessions.map(s => {
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
        <main className={cn(
          "border border-white/10 rounded-2xl bg-[#0a0a0a] overflow-hidden flex flex-col relative transition-all duration-300",
          showFeatureStage ? "hidden md:flex flex-1 md:max-w-sm lg:max-w-md shrink-0" : "flex-1"
        )}>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
            {activeSession ? (
              activeSession.messages.map((m) => {
                const isAssistant = m.role === "assistant";
                const isDebugger = m.metadata?.mode === "debugger";
                
                const hasFeature = m.metadata && Object.keys(m.metadata).length > 1; // more than just 'mode'

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex gap-3 sm:gap-4 p-4 rounded-2xl border transition-all w-full",
                      isDebugger && isAssistant
                        ? "bg-black border-green-500/30 font-mono shadow-[0_0_15px_rgba(34,197,94,0.1)] rounded-md"
                        : isAssistant
                          ? "bg-neutral-900/50 border-white/10 mr-auto max-w-[95%] sm:max-w-[90%]"
                          : "bg-primary/10 border-primary/20 ml-auto max-w-[95%] sm:max-w-[85%]"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs font-bold shadow-md",
                      isDebugger && isAssistant
                        ? "bg-green-500/10 border-green-500/30 text-green-400 rounded-md"
                        : isAssistant
                          ? "bg-neutral-950 border-white/15 text-primary"
                          : "bg-primary text-white border-primary/40"
                    )}>
                      {isDebugger && isAssistant ? <TerminalSquare className="w-4 h-4" /> : isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div className={cn(
                      "space-y-3 overflow-x-auto w-full",
                      isDebugger && isAssistant ? "text-green-400" : ""
                    )}>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider block",
                        isDebugger && isAssistant ? "text-green-600" : "text-neutral-400"
                      )}>
                        {isDebugger && isAssistant ? "ORBIT DEBUG_TERM" : isAssistant ? "ORBIT AI TUTOR" : "STUDENT"}
                      </span>

                      {/* Render text response */}
                      {m.content && (
                        <ChatMarkdown content={m.content} />
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
                              View {m.metadata?.mode === 'mindmap' ? 'Mind Map' : 
                                    m.metadata?.mode === 'quiz' ? 'Quiz' : 
                                    m.metadata?.mode === 'studyplan' ? 'Study Plan' : 
                                    m.metadata?.mode === 'visualization' ? 'Simulation' : 'Generated Asset'}
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
            <div ref={messagesEndRef} />
          </div>

          {/* Form Input Bar */}
          <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-white/10 bg-[#0c0c0c] flex gap-3 z-10 shrink-0">
            <Input
              placeholder={
                isResponding
                  ? "Orbit is generating response..."
                  : "Ask Orbit anything..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-neutral-950 border-white/10 focus-visible:ring-1 focus-visible:ring-primary text-sm h-12 flex-1 rounded-xl"
              disabled={isResponding || !activeSessionId}
            />
            <Button
              type="button"
              onClick={() => setIsListening(!isListening)}
              className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all",
                isListening 
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                  : "bg-neutral-800 hover:bg-neutral-700 text-neutral-400"
              )}
            >
              <Mic className="w-4 h-4" />
            </Button>
            <Button
              type="submit"
              disabled={isResponding || !input.trim() || !activeSessionId}
              className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-white flex items-center justify-center shrink-0 transition-colors shadow-lg shadow-primary/20"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </main>
        
        {/* Right Active Feature Stage */}
        {showFeatureStage && (
          <section className="flex-1 border border-white/10 rounded-2xl bg-[#0c0c0c] overflow-hidden flex flex-col relative animate-in slide-in-from-right-4 duration-300">
             <div className="p-3 sm:p-4 border-b border-white/10 bg-neutral-900/50 flex justify-between items-center z-10 backdrop-blur-md">
                 <div className="flex items-center gap-2">
                     <Sparkles className="w-4 h-4 text-primary" />
                     <span className="text-sm font-bold text-neutral-300 uppercase tracking-widest">
                         {activeFeatureMsg?.metadata?.mode === 'mindmap' ? 'Concept Map Explorer' : 
                          activeFeatureMsg?.metadata?.mode === 'quiz' ? 'Knowledge Check' : 
                          activeFeatureMsg?.metadata?.mode === 'studyplan' ? 'Mastery Roadmap' : 
                          activeFeatureMsg?.metadata?.mode === 'visualization' ? 'Interactive Simulation' : 'Active Workspace'}
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
                      {SIMULATION_REGISTRY.map(sim => (
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
                        <SimulationEngine
                          activeSimId={selectedPresetSim}
                          onClearActiveSimId={() => setSelectedPresetSim(null)}
                        />
                      </div>
                    )}
                  </div>
                )}
                 
                <div className="p-4 sm:p-6 w-full max-w-4xl mx-auto h-full min-h-[500px]">
                    {activeFeatureMsg?.metadata?.mindMap && (
                      <MindMapViewer data={activeFeatureMsg.metadata.mindMap} />
                    )}

                    {activeFeatureMsg?.metadata?.studyPlan && (
                      <StudyPlanCard plan={activeFeatureMsg.metadata.studyPlan} />
                    )}

                    {activeFeatureMsg?.metadata?.quiz && (
                      <QuizCard questions={activeFeatureMsg.metadata.quiz} />
                    )}

                    {activeFeatureMsg?.metadata?.simulation && (
                      <DynamicSimRenderer config={activeFeatureMsg.metadata.simulation} paramValues={simParams} />
                    )}

                    {activeFeatureMsg?.metadata?.videoScript && (
                      <VideoScriptCard script={activeFeatureMsg.metadata.videoScript} />
                    )}
                </div>
             </div>
          </section>
        )}

      </div>
    </div>
  );
}
