"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, User, AlertTriangle, ShieldAlert, Sparkles, Briefcase, BookOpen, Users, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateAIResponseStream } from "@/lib/groq";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type InterviewType = "technical" | "hr";

const PRESET_ROLES = [
  { label: "Frontend Engineer", icon: "⚛️", topics: "React, TypeScript, CSS, browser APIs, performance" },
  { label: "Backend Engineer", icon: "🔧", topics: "Node.js, REST APIs, databases, system design, caching" },
  { label: "Full Stack Developer", icon: "🚀", topics: "React, Node.js, databases, deployment, architecture" },
  { label: "Data Scientist", icon: "📊", topics: "Python, ML algorithms, statistics, pandas, model evaluation" },
  { label: "DevOps / SRE", icon: "⚙️", topics: "CI/CD, Docker, Kubernetes, monitoring, Linux, cloud" },
  { label: "iOS Developer", icon: "🍎", topics: "Swift, SwiftUI, UIKit, Xcode, App Store deployment" },
  { label: "Android Developer", icon: "🤖", topics: "Kotlin, Jetpack Compose, Android SDK, architecture" },
  { label: "Custom / Enter my own", icon: "✏️", topics: "" },
];

const HR_TOPICS = "behavioral questions, STAR method answers, cultural fit, motivation, strengths/weaknesses, conflict resolution, career goals, salary negotiation";

function buildSystemPrompt(role: string, topics: string, type: InterviewType): string {
  if (type === "hr") {
    return `You are a senior HR recruiter at a top tech company interviewing a candidate for the role of: ${role}.
You are conducting an HR / behavioral round.
Focus on: ${HR_TOPICS}.
Rules:
1. Start with a warm but professional greeting and your first behavioral question.
2. Use the STAR method to probe their answers (Situation, Task, Action, Result).
3. If an answer is vague or generic, follow up with "Can you give me a specific example?" or "What was YOUR specific contribution?"
4. Evaluate culture fit, communication, and self-awareness.
5. After 3-4 questions, give a short assessment of their communication and soft skills.
6. Keep responses concise — 2-3 sentences max per turn.`;
  }

  return `You are a strict, senior technical interviewer at a top-tier tech company. You are interviewing a candidate for the role of: ${role}.
Key topics to assess: ${topics}.
Rules:
1. Start by asking a moderately difficult technical question relevant to this role.
2. Wait for the user to answer.
3. Analyze their answer critically. If incomplete or vague, interrupt: "That's surface level. What about..." or "Not quite — explain why..."
4. Never just say "Correct!" — always dig one layer deeper or pivot to a related concept.
5. Be clinical and professional, not overly polite.
6. Keep responses under 4 sentences.
7. If they completely fail a topic, give a score out of 10 for that concept and move to the next topic.
8. After ~6 exchanges, give a brief hiring signal: Strong Yes / Yes / No with reasoning.`;
}

export default function InterviewMode() {
  const router = useRouter();

  // Setup state
  const [setupDone, setSetupDone] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [customRole, setCustomRole] = useState("");
  const [customTopics, setCustomTopics] = useState("");
  const [interviewType, setInterviewType] = useState<InterviewType>("technical");
  const [isCustom, setIsCustom] = useState(false);

  // Interview state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startInterview = async (role: string, topics: string, type: InterviewType) => {
    const prompt = buildSystemPrompt(role, topics, type);
    setSystemPrompt(prompt);
    setSetupDone(true);
    setMessages([]);
    setIsLoading(true);

    try {
      const initMsg = type === "hr"
        ? `Begin the HR behavioral interview for a ${role} candidate.`
        : `Begin the technical interview for a ${role} role. Ask the first question now.`;

      const stream = generateAIResponseStream(prompt, initMsg, 0.7);
      let aiResponse = "";
      setMessages([{ role: "assistant", content: "" }]);

      for await (const chunk of stream) {
        aiResponse += chunk;
        setMessages([{ role: "assistant", content: aiResponse }]);
      }
    } catch (error) {
      console.error(error);
      setMessages([{ role: "assistant", content: "Error connecting to interview server. Please check your API keys." }]);
    }
    setIsLoading(false);
  };

  const handleSetupSubmit = () => {
    const role = isCustom ? customRole.trim() : selectedRole;
    const topics = isCustom ? customTopics.trim() : (PRESET_ROLES.find(r => r.label === selectedRole)?.topics || "");
    if (!role) return;
    startInterview(role, topics, interviewType);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const conversationHistory = newMessages
        .filter(m => m.role !== "system")
        .map(m => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
        .join("\n");

      const aiPrompt = `Conversation so far:\n${conversationHistory}\n\nAnalyze the candidate's last response and reply as the interviewer.`;
      const stream = generateAIResponseStream(systemPrompt, aiPrompt, 0.7);

      let aiResponse = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      for await (const chunk of stream) {
        aiResponse += chunk;
        setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: aiResponse }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: "Error processing response." }]);
    }
    setIsLoading(false);
  };

  const resetInterview = () => {
    setSetupDone(false);
    setMessages([]);
    setInput("");
    setSelectedRole("");
    setCustomRole("");
    setCustomTopics("");
    setIsCustom(false);
  };

  // ─── SETUP SCREEN ───────────────────────────────────────────────────────────
  if (!setupDone) {
    const canProceed = isCustom ? customRole.trim().length > 0 : selectedRole.length > 0;

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-muted-foreground hover:text-foreground h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-destructive" />
                AI Interview Setup
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Configure your mock interview session</p>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 max-w-2xl space-y-8">

          {/* Interview Type */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Interview Type</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setInterviewType("technical")}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all duration-150",
                  interviewType === "technical"
                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                    : "border-border bg-card/40 hover:bg-card/80"
                )}
              >
                <div className="text-xl mb-2">💻</div>
                <p className="font-bold text-sm">Technical Round</p>
                <p className="text-xs text-muted-foreground mt-0.5">Deep dive into skills, code, and architecture</p>
              </button>
              <button
                onClick={() => setInterviewType("hr")}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all duration-150",
                  interviewType === "hr"
                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                    : "border-border bg-card/40 hover:bg-card/80"
                )}
              >
                <div className="text-xl mb-2">🤝</div>
                <p className="font-bold text-sm">HR Round</p>
                <p className="text-xs text-muted-foreground mt-0.5">Behavioral, culture fit, and soft skills</p>
              </button>
            </div>
          </section>

          {/* Role Selection */}
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {interviewType === "hr" ? "Role You're Applying For" : "Role & Topics"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_ROLES.map((role) => {
                const isSelected = !isCustom && selectedRole === role.label;
                const isCustomOption = role.label === "Custom / Enter my own";
                return (
                  <button
                    key={role.label}
                    onClick={() => {
                      if (isCustomOption) {
                        setIsCustom(true);
                        setSelectedRole("");
                      } else {
                        setIsCustom(false);
                        setSelectedRole(role.label);
                      }
                    }}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all duration-150 flex items-center gap-3",
                      (isSelected || (isCustomOption && isCustom))
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card/40 hover:bg-card/80"
                    )}
                  >
                    <span className="text-base shrink-0">{role.icon}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs">{role.label}</p>
                      {!isCustomOption && role.topics && (
                        <p className="text-[10px] text-muted-foreground truncate">{role.topics}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom inputs */}
            {isCustom && (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Role / Job Title *</label>
                  <Input
                    value={customRole}
                    onChange={e => setCustomRole(e.target.value)}
                    placeholder="e.g. Senior React Engineer at Stripe"
                    className="bg-card/50 border-border h-10 text-sm"
                    autoFocus
                  />
                </div>
                {interviewType === "technical" && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Specific Topics (optional)</label>
                    <Input
                      value={customTopics}
                      onChange={e => setCustomTopics(e.target.value)}
                      placeholder="e.g. React hooks, TypeScript generics, system design"
                      className="bg-card/50 border-border h-10 text-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Summary + Start */}
          {canProceed && (
            <div className="p-4 rounded-2xl border border-border bg-card/30 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Interview configured</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {interviewType === "hr" ? "🤝" : "💻"} {interviewType === "technical" ? "Technical" : "HR"} interview
                  {" — "}
                  <span className="text-primary">{isCustom ? customRole : selectedRole}</span>
                </p>
                {interviewType === "technical" && (
                  <p className="text-xs text-muted-foreground">
                    Topics: {isCustom
                      ? (customTopics || "General software engineering")
                      : PRESET_ROLES.find(r => r.label === selectedRole)?.topics}
                  </p>
                )}
              </div>
            </div>
          )}

          <Button
            onClick={handleSetupSubmit}
            disabled={!canProceed}
            className="w-full h-12 rounded-xl font-bold gap-2 text-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            Begin Interview Session
            <ChevronRight className="w-4 h-4" />
          </Button>
        </main>
      </div>
    );
  }

  // ─── INTERVIEW SCREEN ────────────────────────────────────────────────────────
  const roleLabel = isCustom ? customRole : selectedRole;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={resetInterview} className="text-muted-foreground hover:text-foreground h-8 w-8 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold flex items-center gap-1.5 truncate">
                <ShieldAlert className="w-3.5 h-3.5 text-destructive shrink-0" />
                {interviewType === "hr" ? "HR Round" : "Technical Round"}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{roleLabel}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetInterview}
            className="shrink-0 h-7 text-xs rounded-lg border-border gap-1 px-2"
          >
            <RotateCcw className="w-3 h-3" />
            New Session
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-3 sm:px-6 py-4 sm:py-6 max-w-3xl flex flex-col" style={{ height: "calc(100vh - 57px)" }}>
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pb-4"
        >
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Connecting to Interviewer...
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 border border-destructive/20 text-destructive mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              )}

              <div className={cn(
                "max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-none"
                  : "bg-card border border-border rounded-bl-none shadow-sm"
              )}>
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 text-primary mt-1">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-2 sm:gap-3 justify-start">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 border border-destructive/20 text-destructive">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-none px-4 sm:px-5 py-3 sm:py-4 shadow-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="relative mt-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={interviewType === "hr" ? "Give your behavioral answer..." : "Answer the interviewer's question..."}
            className="w-full pl-4 sm:pl-6 pr-12 sm:pr-14 py-5 sm:py-6 rounded-2xl border-border bg-card/50 backdrop-blur-sm text-sm focus-visible:ring-1 focus-visible:ring-primary"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1.5 sm:top-2 h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
          </Button>
        </form>
      </main>
    </div>
  );
}
