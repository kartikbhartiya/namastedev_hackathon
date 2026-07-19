"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, User, Bot, AlertTriangle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateAIResponseStream } from "@/lib/groq";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are a strict, senior technical interviewer at a top-tier tech company. You are conducting a frontend engineering interview. 
Your goal is to deeply probe the candidate's knowledge.
Rules:
1. Start by asking a moderately difficult question (e.g., closures, event loop, React concurrency, CSS stacking contexts).
2. Wait for the user to answer.
3. Analyze their answer. If it is incomplete, vague, or incorrect, you MUST "interrupt" them. Use a tone like "Not quite." or "That's surface level. What about..."
4. Never just say "Correct!" and move on. Always dig one layer deeper until they hit their limit.
5. Do not be overly polite. Be clinical and professional.
6. Keep your responses concise (under 4 sentences).
7. If they completely fail a topic, give them a harsh but fair score out of 10 for that topic, and move to a new topic.`;

export default function InterviewMode() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize the interview
  useEffect(() => {
    if (messages.length === 0) {
      startInterview();
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startInterview = async () => {
    setIsLoading(true);
    try {
      const initPrompt = "Start the interview by asking the very first question.";
      const stream = generateAIResponseStream(SYSTEM_PROMPT, initPrompt, 0.7);
      
      let aiResponse = "";
      setMessages([{ role: "assistant", content: "" }]);
      
      for await (const chunk of stream) {
        aiResponse += chunk;
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: aiResponse },
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages([{ role: "assistant", content: "Error connecting to interview server. Please check your API keys." }]);
    }
    setIsLoading(false);
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
      // Build conversation history for context
      const conversationHistory = newMessages
        .filter(m => m.role !== "system")
        .map(m => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
        .join("\\n");
        
      const aiPrompt = `Conversation History:\\n${conversationHistory}\\n\\nAnalyze the candidate's last response. Reply as the strict interviewer following your system instructions.`;
      
      const stream = generateAIResponseStream(SYSTEM_PROMPT, aiPrompt, 0.7);
      
      let aiResponse = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      
      for await (const chunk of stream) {
        aiResponse += chunk;
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: aiResponse },
        ]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error processing response." }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-destructive" />
              Strict AI Interview Mode
            </h1>
            <p className="text-xs text-muted-foreground">The AI will interrupt you if you are wrong.</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 container mx-auto px-6 py-8 max-w-4xl flex flex-col h-[calc(100vh-140px)]">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-6 pr-4 mb-6 custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Connecting to Interviewer...
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 border border-destructive/20 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                msg.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-br-none" 
                  : "bg-card border border-border rounded-bl-none shadow-sm"
              }`}>
                {msg.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 text-primary">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 border border-destructive/20 text-destructive">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit} className="relative mt-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Answer the interviewer's question..."
            className="w-full pl-6 pr-14 py-6 rounded-2xl border-border bg-card/50 backdrop-blur-sm shadow-lg text-sm focus-visible:ring-1 focus-visible:ring-primary"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
          >
            <Send className="w-4 h-4 ml-1" />
          </Button>
        </form>
      </main>
    </div>
  );
}
