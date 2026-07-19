"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bot, Send, Plus, Trash2, MessageSquare, Menu, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateAIResponseStream } from "@/lib/groq";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

const SYSTEM_PROMPT = `You are Orbit, an elite AI tutor designed to teach computer science, systems, and algorithms.
Your goal is to guide students to understanding rather than simply printing the raw answer.
- Keep your answers clean, structured, and easy to read.
- Use code blocks with line breaks when showing code.
- Be encouraging and concise.`;

export function AITutor() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("orbit_tutor_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ChatSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const welcomeSession: ChatSession = {
        id: "session-welcome",
        title: "Welcome Chat",
        messages: [
          {
            role: "assistant",
            content: "Hello! I am Orbit, your computer science tutor. Ask me about algorithms, data structures, systems, or logic challenges. What are we studying today?"
          }
        ],
        createdAt: new Date().toISOString()
      };
      setSessions([welcomeSession]);
      setActiveSessionId(welcomeSession.id);
      localStorage.setItem("orbit_tutor_sessions", JSON.stringify([welcomeSession]));
    }
  }, []);

  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    localStorage.setItem("orbit_tutor_sessions", JSON.stringify(updated));
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages, isResponding]);

  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: `Session ${sessions.length + 1}`,
      messages: [
        {
          role: "assistant",
          content: "Starting a new session. How can I help you master computer science today?"
        }
      ],
      createdAt: new Date().toISOString()
    };
    const updated = [newSession, ...sessions];
    saveSessions(updated);
    setActiveSessionId(newSession.id);
    setSidebarOpen(false); // Close sidebar on mobile
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    saveSessions(updated);
    if (activeSessionId === id) {
      if (updated.length > 0) {
        setActiveSessionId(updated[0].id);
      } else {
        setActiveSessionId(null);
      }
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isResponding || !activeSessionId || !activeSession) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const updatedMessages = [...activeSession.messages, userMessage];

    let newTitle = activeSession.title;
    if (activeSession.title.startsWith("Session ")) {
      newTitle = input.trim().slice(0, 24) + (input.trim().length > 24 ? "..." : "");
    }

    const updatedSession: ChatSession = {
      ...activeSession,
      title: newTitle,
      messages: updatedMessages
    };

    const updatedSessions = sessions.map(s => s.id === activeSessionId ? updatedSession : s);
    saveSessions(updatedSessions);
    setInput("");
    setIsResponding(true);

    try {
      const contextMessages = updatedMessages.slice(-8);
      const conversationPrompt = contextMessages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
      
      const stream = generateAIResponseStream(
        SYSTEM_PROMPT,
        `${conversationPrompt}\nASSISTANT:`,
        0.7
      );

      let assistantResponse = "";
      const templateSession: ChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, { role: "assistant", content: "" }]
      };
      setSessions(sessions.map(s => s.id === activeSessionId ? templateSession : s));

      for await (const chunk of stream) {
        assistantResponse += chunk;
        const liveSession: ChatSession = {
          ...updatedSession,
          messages: [...updatedMessages, { role: "assistant", content: assistantResponse }]
        };
        setSessions(sessions.map(s => s.id === activeSessionId ? liveSession : s));
      }

      const finalSession: ChatSession = {
        ...updatedSession,
        messages: [...updatedMessages, { role: "assistant", content: assistantResponse }]
      };
      saveSessions(sessions.map(s => s.id === activeSessionId ? finalSession : s));
    } catch (error) {
      console.error(error);
      const errorSession: ChatSession = {
        ...updatedSession,
        messages: [
          ...updatedMessages,
          {
            role: "assistant",
            content: "Failed to generate response. Please verify your API key configurations."
          }
        ]
      };
      saveSessions(sessions.map(s => s.id === activeSessionId ? errorSession : s));
    } finally {
      setIsResponding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040404] text-white flex flex-col select-none">
      
      {/* Header */}
      <header className="border-b border-white/5 bg-[#090909] py-4 z-50">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-neutral-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            {/* Sidebar toggle for mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-neutral-400 hover:text-white"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <div>
              <h1 className="text-base md:text-lg font-bold flex items-center gap-1.5 md:gap-2">
                <Bot className="w-4 h-4 md:w-5 md:h-5 text-[#ff6c37]" />
                Orbit AI Tutor
              </h1>
              <p className="text-[10px] md:text-xs text-neutral-500 hidden sm:block">Your interactive CS syllabus coach.</p>
            </div>
          </div>
          
          <Button 
            onClick={handleNewSession}
            size="sm"
            className="bg-[#ff6c37] hover:bg-[#ff8454] text-black font-bold flex items-center gap-1.5 text-xs md:text-sm px-3 md:px-4"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Session</span>
          </Button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden container mx-auto px-4 md:px-6 py-6 gap-6 max-w-6xl relative">
        
        {/* Left Sessions Sidebar - Slide in drawer on mobile, static on desktop */}
        <aside className={cn(
          "absolute md:static top-6 bottom-6 left-4 z-40 w-64 border border-white/5 rounded-xl bg-[#0b0b0b] overflow-hidden flex flex-col shrink-0 transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-[280px] md:translate-x-0"
        )}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest">Saved Chats</span>
            <span className="text-[10px] bg-white/5 border border-white/10 text-neutral-400 px-2 py-0.5 rounded-full font-mono">
              {sessions.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
            {sessions.map(s => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setSidebarOpen(false); // Close sidebar drawer on selection
                  }}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer group transition-all duration-150",
                    isActive
                      ? "bg-[#ff6c37]/10 text-[#ff6c37] border border-[#ff6c37]/20"
                      : "hover:bg-white/5 text-neutral-400 hover:text-white border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MessageSquare className="w-4 h-4 shrink-0 opacity-75" />
                    <span className="text-xs font-semibold truncate leading-none">{s.title}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right Active Chat Workspace */}
        <main className="flex-1 border border-white/5 rounded-xl bg-[#0b0b0b] overflow-hidden flex flex-col relative">
          
          {/* Chat Messages Frame */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
            {activeSession ? (
              activeSession.messages.map((m, idx) => {
                const isAssistant = m.role === "assistant";
                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-3 md:gap-4 p-3 md:p-4 rounded-xl border max-w-[90%] md:max-w-[85%] transition-all",
                      isAssistant
                        ? "bg-[#101010]/30 border-white/5 mr-auto"
                        : "bg-[#ff6c37]/5 border-[#ff6c37]/10 ml-auto"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center shrink-0 border text-xs md:text-sm",
                      isAssistant 
                        ? "bg-neutral-950 border-white/10 text-[#ff6c37]" 
                        : "bg-neutral-900 border-[#ff6c37]/20 text-white"
                    )}>
                      {isAssistant ? <Bot className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <User className="w-3.5 h-3.5 md:w-4 md:h-4" />}
                    </div>

                    <div className="space-y-1 overflow-x-auto w-full">
                      <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                        {isAssistant ? "ORBIT AI COACH" : "STUDENT"}
                      </span>
                      <div className="prose prose-invert prose-sm text-neutral-300 leading-relaxed font-normal text-xs md:text-sm">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
                Click "New Session" to start learning.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* User Chat Input Form */}
          <form onSubmit={handleSend} className="p-3 md:p-4 border-t border-white/5 bg-[#0e0e0e] flex gap-2 md:gap-3 z-10 shrink-0">
            <Input
              placeholder={isResponding ? "Orbit is analyzing..." : "Ask Orbit anything..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="bg-transparent border-white/5 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-neutral-600 text-xs md:text-sm h-11 md:h-12 flex-1"
              disabled={isResponding || !activeSessionId}
            />
            <Button
              type="submit"
              disabled={isResponding || !input.trim() || !activeSessionId}
              className="h-11 w-11 md:h-12 md:w-12 rounded-lg bg-[#ff6c37] hover:bg-[#ff8454] text-black flex items-center justify-center shrink-0 transition-colors"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>

        </main>

      </div>

    </div>
  );
}
