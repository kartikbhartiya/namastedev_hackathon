"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Send, User, AlertTriangle, ShieldAlert, Square,
  Mic, MicOff, Code2, X, Loader2, Star, Volume2, VolumeX, Maximize,
  Video, MessageSquare, Zap, Radio, Play, Pause, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateAIResponseStream } from "@/lib/groq";
import { ChatMarkdown } from "@/components/chat/ChatMarkdown";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/soundEffects";
import { addGlobalMemory } from "@/lib/aiMemory";

import { InterviewSetup } from "@/components/interview/InterviewSetup";
import { InterviewScorecard } from "@/components/interview/InterviewScorecard";
import { EnvironmentCheck } from "@/components/interview/EnvironmentCheck";
import { ProctoringBar, ProctoringWarning, WebcamPip } from "@/components/interview/ProctoringBar";
import { VoiceWaveform } from "@/components/interview/VoiceWaveform";
import { InterviewerAvatar, AvatarState } from "@/components/interview/InterviewerAvatar";

import {
  InterviewConfig,
  InterviewScoreBreakdown,
  QuestionMeta,
  ProctoringViolation,
  buildInterviewSystemPrompt,
  evaluateInterviewSession,
  parseQuestionTag,
  stripQuestionTag,
  ROLE_OPTIONS,
} from "@/lib/aiInterview";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

type InterviewPhase = "setup" | "env-check" | "live" | "evaluating" | "report";
type ViewMode = "stage" | "chat";

const MAX_VIOLATIONS = 5;

export default function InterviewMode() {
  const router = useRouter();
  const { user, profile, updateProfile } = useAuth();

  // ——— Phase & Config ———
  const [phase, setPhase] = useState<InterviewPhase>("setup");
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("stage");

  // ——— Live interview state ———
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ——— Question tracking ———
  const [questionMetas, setQuestionMetas] = useState<QuestionMeta[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionMeta | null>(null);
  const [questionTimerSec, setQuestionTimerSec] = useState(0);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showConfidenceRating, setShowConfidenceRating] = useState(false);
  const [pendingConfidence, setPendingConfidence] = useState(0);

  // ——— Exit block & Natural voices updates ———
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Sync state refs to prevent speech recognition from restarting on every message/loading change
  const phaseRef = useRef(phase);
  const messagesRef = useRef(messages);
  const systemPromptRef = useRef(systemPrompt);
  const isLoadingRef = useRef(isLoading);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { systemPromptRef.current = systemPrompt; }, [systemPrompt]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const handleVoicesChanged = () => setVoicesLoaded(prev => !prev);
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      return () => window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    }
  }, []);

  // Exit warning hook
  useEffect(() => {
    if (phase !== "live") return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Are you sure you want to exit the interview? Your progress will be lost.";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [phase]);

  // Regex-based Javascript syntax tokenizer
  const tokenise = (code: string) => {
    const rules = [
      { type: 'comment', regex: /^\/\/.*|^\/\*[\s\S]*?\*\// },
      { type: 'string', regex: /^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'|^`(?:\\.|[^`\\])*`/ },
      { type: 'number', regex: /^\b\d+(?:\.\d+)?\b/ },
      { type: 'keyword', regex: /^\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|export|import|from|new|this|typeof|instanceof|async|await|try|catch|finally|throw|default|null|undefined|true|false)\b/ },
      { type: 'builtin', regex: /^\b(console|log|error|warn|info|Math|JSON|Date|RegExp|Map|Set|Promise|Array|Object|String|Number|Boolean|window|document)\b/ },
      { type: 'function', regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()/ },
      { type: 'identifier', regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*/ },
      { type: 'whitespace', regex: /^\s+/ },
      { type: 'operator', regex: /^[\+\-\*\/%&\|\^!~=<>?:;.,{}()\[\]]/ },
      { type: 'text', regex: /^./ }
    ];

    let text = code;
    const tokens = [];
    while (text.length > 0) {
      let matched = false;
      for (const rule of rules) {
        const match = text.match(rule.regex);
        if (match) {
          tokens.push({ type: rule.type, value: match[0] });
          text = text.substring(match[0].length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        tokens.push({ type: 'text', value: text[0] });
        text = text.substring(1);
      }
    }
    return tokens;
  };

  // ——— Scratchpad ———
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [scratchpadCode, setScratchpadCode] = useState("// Write your code or notes here...\nconsole.log('Testing code execution...');\n");
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Submit code scratchpad to Groq for AI Interviewer review
  const handleSubmitCodeForReview = async () => {
    if (isLoadingRef.current || !config) return;
    setIsExecuting(true);
    setExecutionOutput("AI Interviewer is analyzing your code details...");
    stopSpeaking();
    sounds.playSubmitChime();

    const codeMessage = `Here is my code implementation for review:\n\`\`\`javascript\n${scratchpadCode}\n\`\`\``;
    const newMessages: Message[] = [...messagesRef.current, { role: "user", content: codeMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const conversationHistory = newMessages
        .filter(m => m.role !== "system")
        .map(m => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
        .join("\n");

      const aiPrompt = `Conversation History:\n${conversationHistory}\n\nReview the candidate's last submitted code. Explain details clearly: point out syntactical or logical bugs, runtime complexities, or edge-case failures. Provide strict feedback in 3-4 sentences.`;

      const stream = generateAIResponseStream(systemPromptRef.current, aiPrompt, 0.7);

      let aiResponse = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      for await (const chunk of stream) {
        aiResponse += chunk;
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: "assistant", content: aiResponse },
        ]);
      }

      const qMeta = parseQuestionTag(aiResponse);
      if (qMeta) {
        setQuestionMetas(prev => [...prev, qMeta]);
        setCurrentQuestion(qMeta);
      }

      speakText(aiResponse);
      const lower = aiResponse.toLowerCase();
      const isConclusion = lower.includes("concludes our interview") || 
                           lower.includes("concludes the interview") || 
                           lower.includes("conclusions of our interview") ||
                           lower.includes("that concludes");
      if (isConclusion) {
        setPendingAutoEnd(true);
      }
      setExecutionOutput(`Reviewed by Interviewer:\n\n${stripQuestionTag(aiResponse)}`);
    } catch (error) {
      console.error(error);
      setExecutionOutput("[Error]: Failed to retrieve AI Code Review. Please try again.");
    } finally {
      setIsLoading(false);
      setIsExecuting(false);
    }
  };

  // ——— Voice & TTS Tuning ———
  const [isListening, setIsListening] = useState(false);
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);
  const [ttsMuted, setTtsMuted] = useState(false);
  const [voiceSpeed, setVoiceSpeed] = useState(1);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ——— Proctoring ———
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [warningModal, setWarningModal] = useState<{ type: "tab-switch" | "fullscreen-exit" | "copy-paste" | "camera-blocked" } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  // ——— Report & Auto-End ———
  const [scorecard, setScorecard] = useState<InterviewScoreBreakdown | null>(null);
  const [xpClaimed, setXpClaimed] = useState(false);
  const [interviewDbId, setInterviewDbId] = useState<string | null>(null);
  const [pendingAutoEnd, setPendingAutoEnd] = useState(false);

  // ——— Avatar State Computation ———
  const avatarState: AvatarState = isLoading
    ? "thinking"
    : isTTSSpeaking
    ? "speaking"
    : isListening
    ? "listening"
    : "idle";

  // ——— Auto-scroll ———
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ——— Global timer ———
  useEffect(() => {
    if (phase === "live") {
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // ——— Per-question countdown timer ———
  useEffect(() => {
    if (phase === "live" && currentQuestion && config?.perQuestionTimeLimitSec && config.perQuestionTimeLimitSec > 0) {
      setQuestionTimerSec(config.perQuestionTimeLimitSec);
      questionTimerRef.current = setInterval(() => {
        setQuestionTimerSec(prev => {
          if (prev <= 30 && prev > 1) {
            sounds.playTimerTick();
          }
          if (prev <= 1) {
            if (questionTimerRef.current) clearInterval(questionTimerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (questionTimerRef.current) clearInterval(questionTimerRef.current); };
  }, [currentQuestion?.number, phase, config?.perQuestionTimeLimitSec]);

  // ——— Proctoring: Tab switch detection ———
  useEffect(() => {
    if (phase !== "live" || !config?.enableProctoring) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sounds.playWarningChime();
        const newViolation: ProctoringViolation = { type: "tab-switch", timestamp: Date.now() };
        setViolations(prev => {
          const updated = [...prev, newViolation];
          if (updated.length >= MAX_VIOLATIONS) {
            handleEndInterview();
          }
          return updated;
        });
        setWarningModal({ type: "tab-switch" });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [phase, config?.enableProctoring]);

  // ——— Proctoring: Fullscreen detection ———
  useEffect(() => {
    if (phase !== "live" || !config?.enableProctoring) return;

    const handleFullscreenChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull && phase === "live") {
        sounds.playWarningChime();
        const newViolation: ProctoringViolation = { type: "fullscreen-exit", timestamp: Date.now() };
        setViolations(prev => [...prev, newViolation]);
        setWarningModal({ type: "fullscreen-exit" });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [phase, config?.enableProctoring]);

  // ——— Proctoring: Copy-paste blocking ———
  useEffect(() => {
    if (phase !== "live" || !config?.enableProctoring) return;

    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-scratchpad]")) return;

      e.preventDefault();
      sounds.playWarningChime();
      const newViolation: ProctoringViolation = { type: "copy-paste", timestamp: Date.now() };
      setViolations(prev => [...prev, newViolation]);
      setWarningModal({ type: "copy-paste" });
    };

    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-scratchpad]")) return;
      e.preventDefault();
    };

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-scratchpad]")) return;
      e.preventDefault();
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("contextmenu", handleContextMenu);
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [phase, config?.enableProctoring]);

  // ——— Cleanup webcam on unmount ———
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [webcamStream]);

  const endInterviewRef = useRef<() => void>(() => {});

  // ——— Proctoring: Webcam Lens Block Detection ———
  useEffect(() => {
    if (phase !== "live" || !config?.enableProctoring || !webcamStream) return;

    const video = document.createElement("video");
    video.srcObject = webcamStream;
    video.muted = true;
    video.playsInline = true;
    video.play().catch(() => {});

    const canvas = document.createElement("canvas");
    canvas.width = 40;
    canvas.height = 30;
    const ctx = canvas.getContext("2d");

    const interval = setInterval(() => {
      if (!ctx) return;
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Check if camera is covered (almost entirely black/darkness)
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          // simple luminosity formula
          totalBrightness += (r * 0.299 + g * 0.587 + b * 0.114);
        }
        const avgBrightness = totalBrightness / (data.length / 4);

        if (avgBrightness < 12) { // lens covered/black
          sounds.playWarningChime();
          const newViolation: ProctoringViolation = { type: "camera-blocked", timestamp: Date.now() };
          setViolations(prev => {
            const updated = [...prev, newViolation];
            if (updated.length >= MAX_VIOLATIONS) {
              endInterviewRef.current();
            }
            return updated;
          });
          setWarningModal({ type: "camera-blocked" });
        }
      } catch (err) {
        console.error("Camera proctoring error:", err);
      }
    }, 4000); // check every 4s

    return () => {
      clearInterval(interval);
      video.srcObject = null;
    };
  }, [phase, webcamStream, config?.enableProctoring]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const pendingAutoEndRef = useRef(false);
  useEffect(() => {
    pendingAutoEndRef.current = pendingAutoEnd;
  }, [pendingAutoEnd]);

  // ——— TTS Voice Playback with Speed & Voice Tuning ———
  const speakText = useCallback((text: string) => {
    if (ttsMuted || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const cleaned = text.replace(/[*#_`\[\]]/g, "").replace(/\[QUESTION[^\]]*\]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleaned);

    utterance.rate = voiceSpeed;
    utterance.pitch = 1.0;

    // Pick best available voice (English US/UK natural)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.lang.startsWith("en") &&
      (
        v.name.includes("Natural") ||
        v.name.includes("Neural") ||
        v.name.includes("Google") ||
        v.name.includes("Premium") ||
        v.name.includes("Aria") ||
        v.name.includes("Guy") ||
        v.name.includes("Sonia") ||
        v.name.includes("Samantha") ||
        v.name.includes("Daniel")
      )
    ) || voices.find(v => v.lang.startsWith("en")) || voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsTTSSpeaking(true);
    utterance.onend = () => {
      setIsTTSSpeaking(false);
      if (pendingAutoEndRef.current) {
        endInterviewRef.current();
      }
    };
    utterance.onerror = () => {
      setIsTTSSpeaking(false);
      if (pendingAutoEndRef.current) {
        endInterviewRef.current();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [ttsMuted, voiceSpeed]);

  // Fallback auto-end check when TTS is muted or unsupported
  useEffect(() => {
    if (!pendingAutoEnd) return;

    if (ttsMuted || typeof window === "undefined" || !window.speechSynthesis) {
      const timer = setTimeout(() => {
        handleEndInterview();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [pendingAutoEnd, ttsMuted]);

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsTTSSpeaking(false);
    }
  };

  // ——— Phase: SETUP → ENV CHECK or LIVE ———
  const handleStartInterview = async (cfg: InterviewConfig) => {
    setConfig(cfg);
    const prompt = buildInterviewSystemPrompt(cfg);
    setSystemPrompt(prompt);

    if (cfg.enableProctoring) {
      setPhase("env-check");
    } else {
      await launchLiveInterview(cfg, prompt);
    }
  };

  // ——— ENV CHECK PASSED → LAUNCH LIVE ———
  const handleEnvCheckPassed = useCallback(async () => {
    if (!config) return;
    const prompt = buildInterviewSystemPrompt(config);

    if (config.enableProctoring) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch { /* ignore */ }
    }

    if (config.enableWebcam) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setWebcamStream(stream);
      } catch { /* ignore */ }
    }

    await launchLiveInterview(config, prompt);
  }, [config]);

  const launchLiveInterview = async (cfg: InterviewConfig, prompt: string) => {
    setPhase("live");
    setMessages([]);
    setQuestionMetas([]);
    setCurrentQuestion(null);
    setElapsedSeconds(0);
    setViolations([]);
    setXpClaimed(false);
    setScratchpadCode("// Write your code or notes here...\n");

    if (user?.id) {
      try {
        const record = await db.interviews.create(user.id, cfg.role, cfg.seniority);
        if (record?.id) setInterviewDbId(record.id);
      } catch (err) {
        console.error("Failed to create interview record:", err);
      }
    }

    setIsLoading(true);
    try {
      const initPrompt = "Start the interview. Greet the candidate briefly and ask your first question. Remember to include the [QUESTION:1|TYPE:...|TOPIC:...] tag.";
      const stream = generateAIResponseStream(prompt, initPrompt, 0.7);

      let aiResponse = "";
      setMessages([{ role: "assistant", content: "" }]);

      for await (const chunk of stream) {
        aiResponse += chunk;
        setMessages([{ role: "assistant", content: aiResponse }]);
      }

      const qMeta = parseQuestionTag(aiResponse);
      if (qMeta) {
        setQuestionMetas([qMeta]);
        setCurrentQuestion(qMeta);
      }

      speakText(aiResponse);
      const lower = aiResponse.toLowerCase();
      const isConclusion = lower.includes("concludes our interview") || 
                           lower.includes("concludes the interview") || 
                           lower.includes("conclusions of our interview") ||
                           lower.includes("that concludes");
      if (isConclusion) {
        setPendingAutoEnd(true);
      }
    } catch (error) {
      console.error(error);
      setMessages([{ role: "assistant", content: "Error connecting to the AI interviewer. Please check your API key configuration." }]);
    }
    setIsLoading(false);
  };

  // ——— SUBMIT ANSWER ———
  const submitSpeechAnswer = async (speechText: string) => {
    if (!speechText.trim() || isLoadingRef.current || !config) return;

    stopSpeaking();
    sounds.playSubmitChime();

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    const userMsg = speechText.trim();
    setInput("");
    const newMessages: Message[] = [...messagesRef.current, { role: "user", content: userMsg }];
    setMessages(newMessages);

    setShowConfidenceRating(true);
    setPendingConfidence(0);
    setIsLoading(true);

    try {
      const conversationHistory = newMessages
        .filter(m => m.role !== "system")
        .map(m => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
        .join("\n");

      const aiPrompt = `Conversation History:\n${conversationHistory}\n\nAnalyze the candidate's last response. Reply as the interviewer following your system instructions. If this is a new question, include the question tag.`;

      const stream = generateAIResponseStream(systemPromptRef.current, aiPrompt, 0.7);

      let aiResponse = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      for await (const chunk of stream) {
        aiResponse += chunk;
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: "assistant", content: aiResponse },
        ]);
      }

      const qMeta = parseQuestionTag(aiResponse);
      let nextQuestionCount = questionMetas.length;
      if (qMeta) {
        setQuestionMetas(prev => [...prev, qMeta]);
        setCurrentQuestion(qMeta);
        nextQuestionCount += 1;
      }

      speakText(aiResponse);
      const lower = aiResponse.toLowerCase();
      const isConclusion = lower.includes("concludes our interview") || 
                           lower.includes("concludes the interview") || 
                           lower.includes("conclusions of our interview") ||
                           lower.includes("that concludes") ||
                           (nextQuestionCount >= (config?.questionCount || 5) && lower.includes("conclude"));
      if (isConclusion) {
        setPendingAutoEnd(true);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "assistant", content: "Error processing response." }]);
    } finally {
      setIsLoading(false);
      setShowConfidenceRating(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    await submitSpeechAnswer(input);
  };

  // ——— CONFIDENCE RATING ———
  const handleConfidenceSelect = (rating: number) => {
    setPendingConfidence(rating);
    if (currentQuestion) {
      setQuestionMetas(prev =>
        prev.map(q => q.number === currentQuestion.number ? { ...q, confidenceRating: rating, answeredAt: Date.now() } : q)
      );
    }
    setTimeout(() => setShowConfidenceRating(false), 600);
  };

  // ——— VOICE (STT) ———
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);

      // Auto-submit after silence (3.5s)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        if (transcript.trim() && !isLoadingRef.current) {
          submitSpeechAnswer(transcript.trim());
        }
      }, 3500);
    };

    recognition.onerror = (err: any) => {
      console.error("Speech recognition error", err);
    };

    recognition.onend = () => {
      // Auto-restart if we are in live phase to keep mic always-on
      if (phaseRef.current === "live") {
        setTimeout(() => {
          try { recognition.start(); } catch { /* ignore */ }
        }, 300);
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      console.error("Failed to start speech recognition", e);
    }
  }, []);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      startListening();
    }
  }, [isListening, startListening]);

  // Auto-start listening on live phase
  useEffect(() => {
    if (phase === "live") {
      startListening();
    } else {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    }
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [phase, startListening]);

  // ——— END INTERVIEW ———
  const handleEndInterview = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    stopSpeaking();

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop());
      setWebcamStream(null);
    }
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* ignore */ }
    }

    setPhase("evaluating");
    if (!config) return;

    try {
      const evaluation = await evaluateInterviewSession(
        messages.filter(m => m.role !== "system"),
        config,
        violations,
        questionMetas
      );
      setScorecard(evaluation);

      if (interviewDbId && user?.id) {
        db.interviews.saveEvaluation(
          interviewDbId,
          evaluation.totalScore,
          evaluation,
          messages.filter(m => m.role !== "system")
        ).catch(console.error);
      }
      
      addGlobalMemory(
          "Interview", 
          `Completed ${config.seniority} level ${config.role} interview. Score: ${evaluation.totalScore}/100. Strengths: ${evaluation.strengths.join(", ")}. Red flags: ${evaluation.redFlags.join(", ")}.`
      );

      setPhase("report");
    } catch (err) {
      console.error("Evaluation failed:", err);
      setPhase("report");
    }
  };

  useEffect(() => {
    endInterviewRef.current = handleEndInterview;
  }, [handleEndInterview]);

  // ——— XP CLAIM ———
  const handleClaimXP = async () => {
    if (!scorecard || !profile || xpClaimed) return;
    const xpReward = Math.round(scorecard.totalScore / 2);
    const newBadges = [...(profile.earned_badge_ids || [])];
    if (!newBadges.includes("interview-pro")) {
      newBadges.push("interview-pro");
    }
    try {
      await updateProfile({
        xp: (profile.xp || 0) + xpReward,
        earned_badge_ids: newBadges,
      });
      setXpClaimed(true);
    } catch (err) {
      console.error("Failed to claim XP:", err);
    }
  };

  // ========== RENDER ==========

  // Phase: SETUP
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-[#040404] text-white flex flex-col">
        <header className="border-b border-white/10 bg-[#090909] py-4 sticky top-0 z-10">
          <div className="container mx-auto px-6 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-neutral-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                Proctored AI Interview
              </h1>
              <p className="text-xs text-neutral-400">Configure your session before starting.</p>
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-6 py-10">
          <InterviewSetup onStart={handleStartInterview} />
        </main>
      </div>
    );
  }

  // Phase: ENVIRONMENT CHECK
  if (phase === "env-check" && config) {
    return (
      <div className="min-h-screen bg-[#040404] text-white flex flex-col">
        <header className="border-b border-white/10 bg-[#090909] py-4 sticky top-0 z-10">
          <div className="container mx-auto px-6 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setPhase("setup")} className="text-neutral-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-blue-500" />
                System Check
              </h1>
              <p className="text-xs text-neutral-400">Verifying your environment for proctored mode.</p>
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-6 py-10">
          <EnvironmentCheck
            requireMic={config.voiceMode !== "off"}
            requireCamera={config.enableWebcam}
            onAllPassed={handleEnvCheckPassed}
            onSkip={handleEnvCheckPassed}
          />
        </main>
      </div>
    );
  }

  // Phase: EVALUATING
  if (phase === "evaluating") {
    return (
      <div className="min-h-screen bg-[#040404] text-white flex items-center justify-center">
        <div className="text-center space-y-6 animate-pulse">
          <Loader2 className="w-12 h-12 text-amber-500 mx-auto animate-spin" />
          <div>
            <h2 className="text-2xl font-bold text-white">Evaluating Your Performance...</h2>
            <p className="text-sm text-neutral-400 mt-2">Analyzing transcript, violations, and confidence data.</p>
          </div>
        </div>
      </div>
    );
  }

  // Phase: REPORT
  if (phase === "report" && scorecard && config) {
    return (
      <div className="min-h-screen bg-[#040404] text-white flex flex-col">
        <header className="border-b border-white/10 bg-[#090909] py-4 sticky top-0 z-10">
          <div className="container mx-auto px-6 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-neutral-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Interview Results
            </h1>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-6 py-10">
          <InterviewScorecard
            score={scorecard}
            config={config}
            onRetry={() => { setPhase("setup"); setMessages([]); setScorecard(null); }}
            onHome={() => router.push("/")}
            onClaimXP={handleClaimXP}
            xpClaimed={xpClaimed}
            violations={violations}
            questionMetas={questionMetas}
          />
        </main>
      </div>
    );
  }

  // Phase: LIVE INTERVIEW
  const roleInfo = config ? ROLE_OPTIONS.find(r => r.value === config.role) : null;
  const questionTimeWarning = config?.perQuestionTimeLimitSec ? questionTimerSec <= 30 && questionTimerSec > 0 : false;
  const lastAssistantMessage = messages.filter(m => m.role === "assistant").pop()?.content || "";

  return (
    <div className="min-h-screen bg-[#040404] text-white flex flex-col select-none">
      {/* Proctoring Warning Modal */}
      {warningModal && config?.enableProctoring && (
        <ProctoringWarning
          type={warningModal.type}
          violationCount={violations.length}
          maxViolations={MAX_VIOLATIONS}
          onDismiss={() => {
            setWarningModal(null);
            if (warningModal.type === "fullscreen-exit" && !document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            }
          }}
        />
      )}

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="max-w-md w-full mx-4 bg-neutral-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Exit Interview?</h3>
                <p className="text-xs text-red-400 font-semibold">Strict Proctored Session</p>
              </div>
            </div>
            <p className="text-sm text-neutral-300">
              Are you sure you want to exit? Leaving the page will terminate your active proctored interview, and you will receive a grade of F.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Enforce exit: stop all streams and tracks, leave fullscreen
                  if (webcamStream) {
                    webcamStream.getTracks().forEach(t => t.stop());
                  }
                  if (document.fullscreenElement) {
                    try { document.exitFullscreen(); } catch {}
                  }
                  router.push("/");
                }}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-all"
              >
                Yes, Quit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Webcam PiP */}
      {config?.enableWebcam && webcamStream && (
        <WebcamPip stream={webcamStream} violationCount={violations.length} />
      )}

      {/* Header */}
      <header className="border-b border-white/10 bg-[#090909] py-2.5 sticky top-0 z-20">
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { if (phase === "live") { setShowExitConfirm(true); } else { router.push("/"); } }} className="text-neutral-400 hover:text-white w-8 h-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                {roleInfo?.emoji} {roleInfo?.label}
              </h1>
              <p className="text-[10px] text-neutral-500">
                {config?.seniority.charAt(0).toUpperCase()}{config?.seniority.slice(1)} Level
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle Switch */}
            <div className="flex items-center bg-white/5 border border-white/10 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setViewMode("stage")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all",
                  viewMode === "stage" ? "bg-red-500 text-white shadow" : "text-neutral-400 hover:text-white"
                )}
              >
                <Video className="w-3.5 h-3.5" /> Stage Call
              </button>
              <button
                onClick={() => setViewMode("chat")}
                className={cn(
                  "flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all",
                  viewMode === "chat" ? "bg-red-500 text-white shadow" : "text-neutral-400 hover:text-white"
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Chat Feed
              </button>
            </div>

            {/* Proctoring Bar */}
            {config?.enableProctoring && (
              <ProctoringBar
                violationCount={violations.length}
                isCameraOn={!!webcamStream}
                isMicOn={isListening}
                isFullscreen={isFullscreen}
                isSpeaking={isTTSSpeaking}
                elapsedSeconds={elapsedSeconds}
              />
            )}

            {/* Non-proctored timer */}
            {!config?.enableProctoring && (
              <div className="text-xs font-mono text-neutral-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                ⏱ {formatTime(elapsedSeconds)}
              </div>
            )}

            {/* Scratchpad Toggle */}
            {config?.enableScratchpad && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setScratchpadOpen(!scratchpadOpen)}
                className={cn(
                  "text-xs gap-1 font-semibold h-8",
                  scratchpadOpen ? "text-violet-400" : "text-neutral-400 hover:text-white"
                )}
              >
                <Code2 className="w-3.5 h-3.5" /> Code
              </Button>
            )}

            {/* End Interview */}
            <Button
              onClick={handleEndInterview}
              size="sm"
              className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs gap-1.5 shadow-lg shadow-red-500/20 h-8"
            >
              <Square className="w-3 h-3" /> End
            </Button>
          </div>
        </div>
      </header>

      {/* Question Stepper Bar */}
      <div className="border-b border-white/5 bg-[#070707] px-4 md:px-6 py-2">
        <div className="container mx-auto flex items-center gap-2 overflow-x-auto custom-scrollbar">
          {config && Array.from({ length: config.questionCount }).map((_, i) => {
            const qMeta = questionMetas.find(q => q.number === i + 1);
            const isCurrent = currentQuestion?.number === i + 1;
            const isPast = qMeta && !isCurrent;
            const typeEmoji: Record<string, string> = {
              "conceptual": "🧠",
              "coding": "💻",
              "system-design": "🏗️",
              "behavioral": "🤝",
              "follow-up": "🔄",
            };

            return (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all",
                  isCurrent
                    ? "bg-red-500/15 border border-red-500/30 text-red-400"
                    : isPast
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "bg-white/[0.02] border border-white/5 text-neutral-600"
                )}>
                  <span>{qMeta ? typeEmoji[qMeta.type] || "📝" : `Q${i + 1}`}</span>
                  <span>Q{i + 1}</span>
                  {qMeta?.topic && isCurrent && (
                    <span className="text-[10px] font-normal text-neutral-400 ml-1 max-w-[100px] truncate">
                      {qMeta.topic}
                    </span>
                  )}
                  {isPast && <span className="text-emerald-400 text-[10px]">✓</span>}
                </div>
                {i < config.questionCount - 1 && (
                  <div className={cn("w-4 h-px", isPast ? "bg-emerald-500/30" : "bg-white/10")} />
                )}
              </div>
            );
          })}

          {/* Per-question timer */}
          {config?.perQuestionTimeLimitSec !== undefined && config.perQuestionTimeLimitSec > 0 && currentQuestion && (
            <div className={cn(
              "ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold shrink-0",
              questionTimeWarning
                ? "bg-amber-500/15 border border-amber-500/30 text-amber-400 animate-pulse"
                : "bg-white/[0.02] border border-white/5 text-neutral-400"
            )}>
              ⏱ {formatTime(questionTimerSec)}
            </div>
          )}
        </div>
      </div>

      {/* Main Interactive Stage Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Call View / Stage Focus */}
        {viewMode === "stage" ? (
          <main className={cn(
            "flex flex-col p-4 md:p-6 overflow-y-auto custom-scrollbar transition-all duration-200",
            scratchpadOpen ? "h-1/2 md:h-full md:w-1/2" : "h-full w-full flex-1"
          )}>
            <div className="max-w-4xl mx-auto w-full space-y-6 flex-1 flex flex-col justify-between">
              {/* Main Video Call Avatar Card */}
              {config && (
                <InterviewerAvatar
                  role={config.role}
                  state={avatarState}
                  voiceSpeed={voiceSpeed}
                  onVoiceSpeedChange={setVoiceSpeed}
                  onInterrupt={stopSpeaking}
                  isMuted={ttsMuted}
                  onToggleMute={() => {
                    setTtsMuted(!ttsMuted);
                    if (!ttsMuted) stopSpeaking();
                  }}
                />
              )}

              {/* Subtitles / Live Question Display Card */}
              <div className="p-6 rounded-3xl bg-neutral-900/80 border border-white/10 backdrop-blur-md shadow-2xl relative min-h-[120px] flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Live Interviewer Prompt
                  </span>
                  {isTTSSpeaking && (
                    <span className="text-[10px] text-blue-400 font-mono animate-pulse">● Speaking</span>
                  )}
                </div>

                <div className="text-sm md:text-base text-neutral-200 font-medium leading-relaxed">
                  {lastAssistantMessage ? (
                    <ChatMarkdown content={stripQuestionTag(lastAssistantMessage)} />
                  ) : (
                    <span className="text-neutral-500 italic">Interviewer is preparing the first question...</span>
                  )}
                </div>

                {/* Candidate Voice Captions Subtitle Overlay */}
                {isListening && input.trim() && (
                  <div className="mt-3 pt-3 border-t border-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                    <span className="font-bold text-emerald-400">Candidate (Live):</span>
                    <span className="truncate">"{input}"</span>
                  </div>
                )}
              </div>
            </div>
          </main>
        ) : (
          /* Classic Chat Feed View */
          <main className={cn(
            "flex flex-col transition-all duration-200",
            scratchpadOpen ? "h-1/2 md:h-full md:w-1/2" : "h-full w-full flex-1"
          )}>
            {/* Top Compact Avatar Pill */}
            <div className="px-4 md:px-8 pt-4">
              {config && (
                <InterviewerAvatar
                  role={config.role}
                  state={avatarState}
                  voiceSpeed={voiceSpeed}
                  onVoiceSpeedChange={setVoiceSpeed}
                  onInterrupt={stopSpeaking}
                  isMuted={ttsMuted}
                  onToggleMute={() => setTtsMuted(!ttsMuted)}
                  compact
                />
              )}
            </div>

            {/* Chat Feed */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-4 space-y-5 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" && (
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-md transition-all",
                      isTTSSpeaking && i === messages.length - 1
                        ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                        : "bg-red-500/10 border-red-500/20 text-red-400"
                    )}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  )}

                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-5 py-4",
                    msg.role === "user"
                      ? "bg-neutral-800 border border-white/10 text-white rounded-br-md"
                      : "bg-neutral-900/50 border border-white/10 text-neutral-200 rounded-bl-md"
                  )}>
                    {msg.role === "user" ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <ChatMarkdown content={stripQuestionTag(msg.content)} />
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0 border border-primary/30 text-primary shadow-md">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-3 justify-start">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="bg-neutral-900/50 border border-white/10 rounded-2xl rounded-bl-md px-5 py-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "0.15s" }} />
                    <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              )}
            </div>
          </main>
        )}

        {/* Code Scratchpad Panel */}
        {scratchpadOpen && (
          <aside className="h-1/2 md:h-full md:w-1/2 border-t md:border-t-0 md:border-l border-white/10 bg-[#0d0e15] flex flex-col" data-scratchpad>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-violet-400" /> Code Scratchpad
                </span>
                <button
                  onClick={handleSubmitCodeForReview}
                  disabled={isLoading || isExecuting}
                  className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-md shadow-violet-500/20 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Submit Code for Review
                </button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setScratchpadOpen(false)} className="text-neutral-400 hover:text-white w-7 h-7">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Editor Container with Syntax Highlighting Overlay */}
            <div className="flex-1 relative font-mono text-sm overflow-hidden bg-[#0a0a0f]">
              {/* Highlighted pre rendering beneath the textarea */}
              <pre className="absolute inset-0 p-4 pointer-events-none whitespace-pre-wrap break-all overflow-y-auto custom-scrollbar select-none z-0" aria-hidden="true">
                <code>
                  {tokenise(scratchpadCode).map((t, idx) => {
                    let className = "text-neutral-300";
                    if (t.type === "keyword") className = "text-pink-400 font-semibold";
                    else if (t.type === "builtin") className = "text-cyan-400";
                    else if (t.type === "string") className = "text-emerald-400 font-medium";
                    else if (t.type === "comment") className = "text-neutral-500 italic";
                    else if (t.type === "number") className = "text-amber-400";
                    else if (t.type === "function") className = "text-yellow-400";
                    else if (t.type === "operator") className = "text-indigo-400";
                    return <span key={idx} className={className}>{t.value}</span>;
                  })}
                </code>
              </pre>

              {/* Overlay textarea: transparent text, visible caret */}
              <textarea
                value={scratchpadCode}
                onChange={(e) => setScratchpadCode(e.target.value)}
                className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white font-mono p-4 resize-none focus:outline-none placeholder:text-neutral-700 custom-scrollbar z-10 whitespace-pre-wrap break-all"
                placeholder="// Write your solution here..."
                spellCheck={false}
                data-scratchpad
              />
            </div>

            {/* AI Code Review Panel (replaces normal execution output) */}
            {executionOutput !== null && (
              <div className="border-t border-white/10 bg-black/90 p-4 font-mono text-xs max-h-48 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between text-[10px] text-neutral-400 uppercase tracking-wider mb-2 font-bold border-b border-white/5 pb-1">
                  <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-violet-400" /> AI Review Feedback</span>
                  <button onClick={() => setExecutionOutput(null)} className="hover:text-white transition-colors">Clear</button>
                </div>
                <pre className="text-violet-300 whitespace-pre-wrap leading-relaxed font-sans text-xs">{executionOutput}</pre>
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Confidence Rating Overlay */}
      {showConfidenceRating && (
        <div className="px-4 md:px-8 py-3 border-t border-white/5 bg-[#070707] flex items-center justify-center gap-4 animate-in fade-in duration-200">
          <span className="text-xs text-neutral-400 font-semibold">How confident are you in this answer?</span>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                onClick={() => handleConfidenceSelect(star)}
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110",
                  pendingConfidence >= star ? "text-amber-400" : "text-neutral-600 hover:text-amber-300"
                )}
              >
                <Star className={cn("w-5 h-5", pendingConfidence >= star && "fill-current")} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice-Only Input Control Panel */}
      <div className="px-4 md:px-8 py-4 border-t border-white/10 bg-[#090909] flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
        {/* Left Status Indicator */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleVoice}
            className={cn(
              "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all hover:scale-105 active:scale-95",
              isListening
                ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                : "bg-red-500/20 border border-red-500/30 text-red-400"
            )}
            title={isListening ? "Pause microphone" : "Activate microphone"}
          >
            {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
          </button>
          <div className="text-left">
            <span className={cn(
              "text-xs font-bold block",
              isListening ? "text-emerald-400" : "text-red-400"
            )}>
              {isListening ? "Microphone Always Active & Listening" : "Microphone Paused / Inactive"}
            </span>
            <p className="text-[10px] text-neutral-400 leading-tight">
              {isListening ? "Start speaking your answer. It will auto-submit after 3.5s of silence." : "Please click mic icon to restart."}
            </p>
          </div>
        </div>

        {/* Center Scrolling Waveform or Live Transcribing Caption */}
        <div className="flex-1 max-w-xl w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/5 min-h-[44px] flex items-center gap-2">
          {isListening ? (
            input.trim() ? (
              <span className="text-xs font-mono text-emerald-300 animate-pulse line-clamp-1 italic">
                "{input}"
              </span>
            ) : (
              <div className="flex items-center gap-2 text-neutral-500 text-xs italic">
                <VoiceWaveform isActive={isListening} color="#10b981" className="w-6 h-4 shrink-0" />
                <span>Speak now... (Say your answer out loud)</span>
              </div>
            )
          ) : (
            <span className="text-neutral-500 text-xs italic">Microphone is offline. Click mic button to restart...</span>
          )}
        </div>

        {/* Right Action buttons (manual submit or restart mic) */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            onClick={() => submitSpeechAnswer(input)}
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs px-6 h-11 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> Submit Answer
          </Button>
        </div>
      </div>
    </div>
  );
}
