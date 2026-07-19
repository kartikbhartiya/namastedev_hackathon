"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { loadProviderConfig, saveProviderConfig, type AIProviderSettings } from "@/lib/aiProvider";
import { getAIUsageStats } from "@/lib/aiUsageTracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain, Bot, Settings, Key, Sparkles, Zap, Award, BookOpen, Clock, Activity, Target, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

export default function JudgeDashboard() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("features");
  
  // API config states
  const [providerConfig, setProviderConfig] = useState<AIProviderSettings | null>(null);
  const [groqKey, setGroqKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [activeProvider, setActiveProvider] = useState<"groq" | "openai">("groq");
  
  // Usage tracking state
  const [usageStats, setUsageStats] = useState(getAIUsageStats());

  useEffect(() => {
    const loadConfig = async () => {
      const cfg = await loadProviderConfig();
      setProviderConfig(cfg);
      setGroqKey(cfg.providerConfigs.groq?.apiKey || "");
      setOpenaiKey(cfg.providerConfigs.openai?.apiKey || "");
      if (cfg.activeProvider === "groq" || cfg.activeProvider === "openai") {
        setActiveProvider(cfg.activeProvider);
      }
    };
    loadConfig();

    const interval = setInterval(() => {
      setUsageStats(getAIUsageStats());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveKeys = async () => {
    if (!providerConfig) return;
    const updated = {
      ...providerConfig,
      activeProvider,
      providerConfigs: {
        groq: {
          ...providerConfig.providerConfigs.groq,
          apiKey: groqKey,
        },
        openai: {
          ...providerConfig.providerConfigs.openai,
          apiKey: openaiKey,
        }
      }
    };
    await saveProviderConfig(updated);
    toast.success("AI configuration saved successfully!");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Initializing Eclix Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-50 relative pb-16">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-foreground/5 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[-15%] w-[450px] h-[450px] bg-foreground/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#020617]/70 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 text-white">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">Eclix</span>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">Hackathon Edition</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-green-500/20 bg-green-500/10 text-green-400 text-xs px-2.5 py-1">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Judge Sandbox Active
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-12 max-w-6xl relative z-10 space-y-8">
        {/* Welcome Banner */}
        <div className="p-8 rounded-[2rem] border border-white/[0.06] bg-gradient-to-br from-neutral-900 to-neutral-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-3 text-center md:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight text-white md:leading-tight">
              Welcome, <span className="underline decoration-neutral-500 decoration-wavy underline-offset-4">{profile?.name || "Judge"}</span>
            </h1>
            <p className="text-sm text-neutral-400 max-w-xl leading-relaxed">
              Experience the core of Eclix: our state-of-the-art **AI Study Companion** and **Adaptive Assessment Generator**. Designed with premium aesthetics, offline-ready simulations, and active LLM routing.
            </p>
            <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full text-xs text-neutral-400 border border-white/5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> {profile?.xp || 0} XP
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full text-xs text-neutral-400 border border-white/5">
                <Target className="w-3.5 h-3.5 text-emerald-400" /> {profile?.study_streak || 0} Day Streak
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full text-xs text-neutral-400 border border-white/5">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> 100% Offline Ready
              </div>
            </div>
          </div>

          <div className="flex gap-3 flex-col sm:flex-row w-full md:w-auto shrink-0">
            <Button
              onClick={() => router.push("/ai-tutor")}
              className="bg-white hover:bg-neutral-200 text-black font-bold h-11 px-6 rounded-xl flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" /> Start AI Tutor
            </Button>
            <Button
              onClick={() => router.push("/quizzes")}
              variant="outline"
              className="border-white/10 hover:bg-white/5 text-white font-bold h-11 px-6 rounded-xl flex items-center justify-center gap-2"
            >
              <Brain className="w-4 h-4" /> Open Assessments
            </Button>
          </div>
        </div>

        {/* Tab System */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-sm mb-6 bg-white/5 p-0.5 rounded-xl border border-white/[0.04]">
            <TabsTrigger value="features" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black text-xs font-semibold py-2">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Capabilities
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black text-xs font-semibold py-2">
              <Settings className="w-3.5 h-3.5 mr-1.5" /> Demo Control Center
            </TabsTrigger>
          </TabsList>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6 animate-in fade-in duration-200">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Feature 1: AI Tutor */}
              <Card className="rounded-[2rem] border border-white/[0.06] bg-card/45 backdrop-blur-xl hover:border-white/10 transition-all shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 text-base font-bold text-white">
                    <div className="p-2.5 rounded-xl bg-white/5 text-white shrink-0">
                      <Bot className="h-5 w-5" />
                    </div>
                    AI Study Tutor (Aria)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Multi-modal explanation interface featuring inline SVG simulations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2.5 text-xs text-neutral-400">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full shrink-0" />
                      <span><strong>Doubt Solver:</strong> Upload files (PDF/Images) to explain equations step-by-step.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full shrink-0" />
                      <span><strong>Mind Map:</strong> Renders visual hierarchical concept vectors on SVG canvases.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full shrink-0" />
                      <span><strong>SVG Simulators:</strong> 2D Pendulum, Projectile, Wave, Sorting, and Gauss Law nodes.</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push("/ai-tutor")}
                    className="w-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs h-9 rounded-lg"
                  >
                    Open AI Tutor Screen
                  </Button>
                </CardContent>
              </Card>

              {/* Feature 2: Assessments */}
              <Card className="rounded-[2rem] border border-white/[0.06] bg-card/45 backdrop-blur-xl hover:border-white/10 transition-all shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2.5 text-base font-bold text-white">
                    <div className="p-2.5 rounded-xl bg-white/5 text-white shrink-0">
                      <Brain className="h-5 w-5" />
                    </div>
                    Adaptive Assessments
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Test knowledge with instant feedback, time tracking, and analytics.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2.5 text-xs text-neutral-400">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full shrink-0" />
                      <span><strong>Practice & Exam Formats:</strong> Toggles explanations vs strict timer bounds.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full shrink-0" />
                      <span><strong>Mistake Remediator:</strong> Dynamic analysis generates strategies for weak concepts.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full shrink-0" />
                      <span><strong>Follow-up Vectors:</strong> Appends questions on incorrect options dynamically.</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push("/quizzes")}
                    className="w-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs h-9 rounded-lg"
                  >
                    Open Assessments Screen
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6 animate-in fade-in duration-200">
            <div className="grid md:grid-cols-3 gap-6">
              {/* LLM Key Setup */}
              <Card className="rounded-[2rem] border border-white/[0.06] bg-card/45 backdrop-blur-xl md:col-span-2 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
                    <Key className="w-4 h-4 text-neutral-400" /> API Keys Configuration
                  </CardTitle>
                  <CardDescription className="text-xs">
                    By default, Eclix runs on pre-baked offline mock templates. Paste your own Groq/OpenAI keys to see real-time generation!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Active LLM Router</label>
                      <select
                        value={activeProvider}
                        onChange={(e) => setActiveProvider(e.target.value as any)}
                        className="w-full h-9 px-3 rounded-lg border border-white/10 text-xs bg-[#0b0c10] text-white focus:ring-0 focus:outline-none"
                      >
                        <option value="groq">Groq (Ultra Fast - Llama-3)</option>
                        <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">Groq API Key</label>
                      <Input
                        type="password"
                        placeholder="gsk_..."
                        value={groqKey}
                        onChange={(e) => setGroqKey(e.target.value)}
                        className="bg-white/[0.03] border-white/10 text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">OpenAI API Key</label>
                      <Input
                        type="password"
                        placeholder="sk-proj-..."
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        className="bg-white/[0.03] border-white/10 text-xs h-9"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveKeys}
                    className="w-full bg-white hover:bg-neutral-200 text-black font-semibold text-xs h-9 rounded-lg"
                  >
                    Save Key Configuration
                  </Button>
                </CardContent>
              </Card>

              {/* Usage Stats (Telemetry) */}
              <Card className="rounded-[2rem] border border-white/[0.06] bg-card/45 backdrop-blur-xl shadow-xl flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-white">
                    <Activity className="w-4 h-4 text-neutral-400" /> Sandbox Telemetry
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Real-time token limits and response latency metrics tracking.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col justify-end">
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-white/[0.04] pb-2">
                      <span className="text-neutral-500 font-medium">Daily Limit:</span>
                      <span className="text-neutral-300 font-semibold">50,000 Tokens</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.04] pb-2">
                      <span className="text-neutral-500 font-medium">Tokens Used Today:</span>
                      <span className="text-neutral-300 font-semibold">{usageStats.tokensUsed.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.04] pb-2">
                      <span className="text-neutral-500 font-medium">Requests Logged:</span>
                      <span className="text-neutral-300 font-semibold">{usageStats.requestsToday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-medium">Avg LLM Latency:</span>
                      <span className="text-neutral-300 font-semibold">
                        {usageStats.requestsToday > 0 
                          ? `${Math.round(usageStats.avgResponseTime / 1000 * 10) / 10}s` 
                          : "0.0s"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-1.5">
                      <div 
                        className="h-full bg-white transition-all duration-500" 
                        style={{ width: `${Math.min(100, (usageStats.tokensUsed / 50000) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-neutral-500">
                      <span>Token Quota</span>
                      <span>{Math.round((usageStats.tokensUsed / 50000) * 100)}% Used</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
