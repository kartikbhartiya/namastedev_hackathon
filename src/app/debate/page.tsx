"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Swords, User, Bot, AlertOctagon, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateAIResponseStream } from "@/lib/groq";
import ReactMarkdown from "react-markdown";
import { addGlobalMemory } from "@/lib/aiMemory";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are Orbit Debate AI, a fierce, highly technical debate adversary. 
The user will present an argument or a stance on a tech topic. 
You must take the OPPOSITE stance and fiercely debate them. 
Rules:
1. Actively look for logical fallacies in the user's argument (e.g., Ad Hominem, Strawman, Appeal to Authority).
2. If you detect a fallacy, explicitly call it out using the format: **[FALLACY DETECTED: <Name>]** and explain why.
3. Keep your arguments concise, razor-sharp, and highly technical.
4. Do not concede unless the user makes a perfectly bulletproof point.
5. AT THE VERY END OF YOUR RESPONSE, INCLUDE A HIDDEN SCORE TAG representing the user's current stance strength from 0 (completely destroyed) to 100 (bulletproof point). Format: <SCORE>number</SCORE>`;

export default function DebateMode() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userScore, setUserScore] = useState(50); // 0-100 persuasion meter
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
        .map(m => `${m.role === "user" ? "User Argument" : "AI Rebuttal"}: ${m.content}`)
        .join("\n");
        
      const aiPrompt = `Conversation History:\n${conversationHistory}\n\nAnalyze the user's last argument. Formulate a fierce rebuttal. Call out fallacies if any. Include the <SCORE>x</SCORE> tag at the end.`;
      
      const stream = generateAIResponseStream(SYSTEM_PROMPT, aiPrompt, 0.8);
      
      let aiResponse = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      
      for await (const chunk of stream) {
        aiResponse += chunk;
        
        // Check for score tag dynamically
        const scoreMatch = aiResponse.match(/<SCORE>(\d+)<\/SCORE>/i);
        if (scoreMatch) {
          const parsed = parseInt(scoreMatch[1], 10);
          if (!isNaN(parsed)) setUserScore(parsed);
        }

        // Clean display content (strip score tag)
        const cleanDisplay = aiResponse.replace(/<SCORE>\d+<\/SCORE>/i, "").trim();

        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: cleanDisplay },
        ]);
      }

      // Add to global memory context
      addGlobalMemory(
        "Debate",
        `Debated argument: "${userMsg}". Current user persuasion score: ${userScore}/100.`
      );
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to Debate API." }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#040404] text-white flex flex-col select-none">
      {/* Header Bar */}
      <header className="border-b border-white/10 bg-[#090909] py-3.5 z-40 sticky top-0 backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-neutral-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-base md:text-lg font-extrabold flex items-center gap-2 tracking-tight">
                <Swords className="w-5 h-5 text-red-500" />
                Logical Debate Arena
              </h1>
              <p className="text-[10px] md:text-xs text-neutral-400 hidden sm:block">
                Challenge tech opinions against a fierce AI adversary that detects fallacies
              </p>
            </div>
          </div>

          {/* Persuasion Bar Header Widget */}
          <div className="flex items-center gap-3 bg-neutral-900 border border-white/10 px-4 py-2 rounded-xl">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="flex flex-col gap-1 w-32 md:w-48">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-blue-400">User: {userScore}%</span>
                <span className="text-red-400">AI: {100 - userScore}%</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${userScore}%` }} 
                />
                <div 
                  className="bg-red-500 h-full transition-all duration-500" 
                  style={{ width: `${100 - userScore}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 md:px-6 py-6 max-w-4xl flex flex-col h-[calc(100vh-100px)]">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-6 pr-2 mb-4 custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                <Swords className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-neutral-300">Enter the Debate Arena</h3>
                <p className="text-xs text-neutral-400 max-w-sm">
                  Type a controversial tech opinion to start (e.g., "Tailwind is better than CSS Modules" or "SQL is superior to NoSQL").
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            return (
              <div 
                key={idx} 
                className={cn(
                  "flex gap-3 max-w-[88%] p-4 rounded-2xl border transition-all",
                  isUser 
                    ? "ml-auto bg-blue-500/10 border-blue-500/20 text-white" 
                    : "mr-auto bg-neutral-900/60 border-white/10 text-neutral-200"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border text-xs font-bold shadow-md",
                  isUser ? "bg-blue-600 text-white border-blue-400" : "bg-neutral-950 text-red-400 border-white/10"
                )}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className="space-y-1 text-sm overflow-x-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider block text-neutral-400">
                    {isUser ? "YOUR ARGUMENT" : "ORBIT REBUTTAL"}
                  </span>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 bg-[#090909] p-3 border border-white/10 rounded-2xl">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your tech argument..."
            className="bg-neutral-950 border-white/10 focus-visible:ring-1 focus-visible:ring-red-500 text-sm h-12 flex-1 rounded-xl"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="h-12 w-12 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </main>
    </div>
  );
}
