"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Swords, User, Bot, AlertOctagon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateAIResponseStream } from "@/lib/groq";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT = `You are a fierce Debate AI. 
The user will present an argument or a stance on a tech topic. 
You must take the OPPOSITE stance and fiercely debate them. 
Rules:
1. Actively look for logical fallacies in the user's argument (e.g., Ad Hominem, Strawman, Appeal to Authority).
2. If you detect a fallacy, explicitly call it out using the format: **[FALLACY DETECTED: <Name>]** and explain why they committed it.
3. Keep your arguments concise, razor-sharp, and highly technical.
4. Do not concede unless the user makes a perfectly bulletproof point.`;

export default function DebateMode() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
        .join("\\n");
        
      const aiPrompt = `Conversation History:\\n${conversationHistory}\\n\\nAnalyze the user's last argument. Formulate a fierce rebuttal. Call out fallacies if any.`;
      
      const stream = generateAIResponseStream(SYSTEM_PROMPT, aiPrompt, 0.8);
      
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
      setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to Debate API." }]);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Swords className="w-5 h-5 text-primary" />
              Logical Debate Mode
            </h1>
            <p className="text-xs text-muted-foreground">State a controversial tech opinion. The AI will challenge you.</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8 max-w-4xl flex flex-col h-[calc(100vh-140px)]">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto space-y-6 pr-4 mb-6 custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                <Swords className="w-8 h-8" />
              </div>
              <p>Type an argument to start the debate (e.g., "Tailwind is better than CSS modules")</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center shrink-0 border border-border">
                  <Bot className="w-4 h-4 text-primary" />
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
                  <div className="prose prose-invert prose-sm max-w-none prose-strong:text-destructive">
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
              <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center shrink-0 border border-border text-primary">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="relative mt-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="State your argument..."
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
