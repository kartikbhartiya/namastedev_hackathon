"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, ShieldCheck, FileCheck, CheckCircle2, XCircle, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { generateAIResponse } from "@/lib/groq";
import { addGlobalMemory } from "@/lib/aiMemory";
import { EclixLogo } from "@/components/EclixLogo";

type Question = {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
};

const QUESTION_TOPICS = [
  "JavaScript closures, event loop, and prototypes",
  "React hooks, lifecycle, and state management",
  "Data structures: trees, graphs, and dynamic programming",
  "System design: caching, load balancing, databases",
  "CSS: flexbox, grid, animations, and specificity",
  "TypeScript: generics, utility types, and type inference",
  "REST APIs, HTTP methods, and authentication",
  "Operating systems: processes, memory, and concurrency",
  "Algorithms: sorting, searching, and time complexity",
  "Web security: XSS, CSRF, and secure coding practices",
];

const QUESTION_GEN_PROMPT = `You are an expert software engineering exam creator. Generate exactly 5 unique, challenging multiple-choice questions for a timed exam.
Pick from different topics: ${QUESTION_TOPICS.join(", ")}.
Each question must have exactly 4 options. Make all options plausible and tricky.

Respond ONLY with valid JSON — no markdown, no explanation:
[
  {
    "id": 1,
    "text": "Question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctIndex": 0
  }
]

Rules:
- correctIndex is 0-3 (zero-based index of the correct option)
- Questions must be DIFFERENT every call — use randomness
- All 5 questions must cover DIFFERENT topics
- Difficulty: intermediate to advanced`;

const GRADING_PROMPT = `You are an AI Exam Proctor evaluating a student's submitted test.
You will receive the questions, correct answers, and the student's answers.
Be brutally honest but constructive.

Respond ONLY with valid JSON — no markdown:
{
  "score": "N/5",
  "confidenceScore": 85,
  "timeAnalysis": "Brief comment on their speed and exam strategy",
  "feedback": [
    {
      "questionId": 1,
      "isCorrect": true,
      "explanation": "Brief explanation of why the answer is correct/incorrect and what concept this tests"
    }
  ]
}`;

export default function ExamHall() {
  const router = useRouter();

  // Generation state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Exam state
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(360); // 6 mins for 5 questions
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (examStarted && timeLeft > 0 && !results && !isSubmitting) {
      timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (examStarted && timeLeft === 0 && !results && !isSubmitting) {
      submitExam();
    }
    return () => clearTimeout(timer);
  }, [examStarted, timeLeft, results, isSubmitting]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Generate fresh AI questions
  const generateQuestions = async () => {
    setIsGenerating(true);
    setGenError(null);
    try {
      const seed = `seed-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const raw = await generateAIResponse(
        QUESTION_GEN_PROMPT,
        `Generate 5 unique exam questions. Session: ${seed}`,
        1.0 // high temperature for variety
      );

      let json = raw;
      if (raw.includes("```json")) {
        json = raw.split("```json")[1].split("```")[0].trim();
      } else if (raw.includes("```")) {
        json = raw.split("```")[1].split("```")[0].trim();
      }

      const parsed: Question[] = JSON.parse(json);
      if (!Array.isArray(parsed) || parsed.length < 3) {
        throw new Error("Invalid question format");
      }

      setQuestions(parsed);
      setAnswers({});
      setResults(null);
      setTimeLeft(360);
      setExamStarted(true);
    } catch (e) {
      console.error(e);
      setGenError("Failed to generate questions. Check your API key or try again.");
    }
    setIsGenerating(false);
  };

  const handleSelect = (qId: number, option: string) => {
    if (results || isSubmitting) return;
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const submitExam = async () => {
    setIsSubmitting(true);
    try {
      const payload = questions.map(q => ({
        questionId: q.id,
        question: q.text,
        options: q.options,
        correctAnswer: q.options[q.correctIndex],
        userAnswer: answers[q.id] || "No answer provided",
      }));

      const raw = await generateAIResponse(
        GRADING_PROMPT,
        JSON.stringify({ timeRemainingSeconds: timeLeft, answers: payload }),
        0.1
      );

      let cleanJson = raw;
      if (raw.includes("```json")) {
        cleanJson = raw.split("```json")[1].split("```")[0].trim();
      } else if (raw.includes("```")) {
        cleanJson = raw.split("```")[1].split("```")[0].trim();
      }

      const parsed = JSON.parse(cleanJson);
      setResults(parsed);
      
      addGlobalMemory(
        "Exam", 
        `Completed timed engineering exam. Score: ${parsed.score}. Feedback summary: ${parsed.timeAnalysis || "Good effort."}`
      );
    } catch (e) {
      console.error(e);
      alert("Failed to grade exam. Check API keys.");
    }
    setIsSubmitting(false);
  };

  // Landing screen
  if (!examStarted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full border-border bg-card/50 shadow-2xl backdrop-blur-xl rounded-[2rem]">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-2 border border-destructive/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-extrabold">Proctored AI Exam Hall</CardTitle>
            <CardDescription>
              Strict testing environment. 6 minutes on the clock. No hints, no leaving the tab.
              AI generates <strong className="text-foreground">fresh unique questions</strong> every session — the AI proctor grades each answer on submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-3">
            {genError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {genError}
              </div>
            )}
            <Button
              onClick={generateQuestions}
              disabled={isGenerating}
              className="w-full font-bold h-12 text-md rounded-xl gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Exam Questions...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate &amp; Start Exam
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={() => router.push("/")} className="w-full text-muted-foreground" disabled={isGenerating}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              title="Go to Previous Page"
              className="text-neutral-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div
              onClick={() => router.push("/")}
              className="flex items-center gap-2 cursor-pointer group px-2 py-1 rounded-xl hover:bg-white/5 transition-all"
              title="Go to Dashboard"
            >
              <EclixLogo className="h-5 w-5 text-white transition-transform group-hover:scale-110" />
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h1 className="font-bold text-sm sm:text-base text-white">Exam Session Active</h1>
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-2 font-mono text-base sm:text-lg font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border ${timeLeft < 60 ? "bg-destructive/10 text-destructive border-destructive/30 animate-pulse" : "bg-secondary text-foreground border-border"}`}>
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-3xl space-y-10 sm:space-y-12">
        {!results && questions.map((q, idx) => (
          <div key={q.id} className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold flex items-start gap-3">
              <span className="text-muted-foreground font-mono text-xs sm:text-sm mt-0.5 shrink-0">
                {String(idx + 1).padStart(2, "0")}.
              </span>
              {q.text}
            </h3>
            <div className="grid gap-2 sm:gap-3 pl-6 sm:pl-8">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(q.id, opt)}
                  className={`text-left px-4 sm:px-5 py-3 sm:py-4 rounded-xl border transition-all text-sm ${
                    answers[q.id] === opt
                      ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.15)] font-medium"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <span className="font-mono text-muted-foreground mr-2 text-xs">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        {isSubmitting && (
          <div className="py-20 text-center space-y-6 animate-pulse">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <h2 className="text-xl font-bold">AI is grading your submission...</h2>
            <p className="text-muted-foreground">Analyzing mistakes and calculating confidence vectors.</p>
          </div>
        )}

        {results && (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Card className="bg-card/40 border-border">
                <CardContent className="p-5 sm:p-6 text-center space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase">Final Score</p>
                  <p className="text-3xl sm:text-4xl font-black text-foreground">{results.score}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border">
                <CardContent className="p-5 sm:p-6 text-center space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase">Confidence</p>
                  <p className="text-3xl sm:text-4xl font-black text-primary">{results.confidenceScore}%</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border">
                <CardContent className="p-5 sm:p-6 text-center space-y-2">
                  <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase">Time Analysis</p>
                  <p className="text-xs sm:text-sm font-medium text-foreground leading-tight pt-1 sm:pt-2">{results.timeAnalysis}</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 pt-4">
              <h2 className="text-xl sm:text-2xl font-bold border-b border-border pb-4">Detailed Answer Review</h2>
              {results.feedback?.map((f: any, idx: number) => {
                const q = questions.find(x => x.id === f.questionId);
                return (
                  <div key={idx} className="p-4 sm:p-6 rounded-2xl border border-border bg-card/30 space-y-3 sm:space-y-4">
                    <div className="flex gap-3">
                      {f.isCorrect ? (
                        <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base leading-snug">{q?.text}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Your answer: <span className={f.isCorrect ? "text-green-400" : "text-destructive"}>{answers[f.questionId] || "None"}</span>
                        </p>
                        {!f.isCorrect && q && (
                          <p className="text-xs sm:text-sm text-green-400 mt-0.5">
                            Correct: {q.options[q.correctIndex]}
                          </p>
                        )}
                      </div>
                    </div>
                    {!f.isCorrect && (
                      <div className="bg-destructive/10 border border-destructive/20 p-3 sm:p-4 rounded-xl">
                        <p className="text-xs sm:text-sm text-destructive font-medium flex gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          {f.explanation}
                        </p>
                      </div>
                    )}
                    {f.isCorrect && (
                      <div className="bg-green-500/10 border border-green-500/20 p-3 sm:p-4 rounded-xl">
                        <p className="text-xs sm:text-sm text-green-400 flex gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                          {f.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row gap-3">
              <Button onClick={generateQuestions} disabled={isGenerating} className="flex-1 h-12 rounded-xl gap-2">
                {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Take New Exam</>}
              </Button>
              <Button variant="outline" onClick={() => router.push("/")} className="flex-1 h-12 rounded-xl">
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

        {!results && !isSubmitting && (
          <div className="pt-8 border-t border-border flex justify-end">
            <Button onClick={submitExam} size="lg" className="h-12 px-8 rounded-xl font-bold">
              <FileCheck className="w-5 h-5 mr-2" />
              Submit Exam
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
