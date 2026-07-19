"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, ShieldCheck, FileCheck, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { generateAIResponse } from "@/lib/groq";
import { Progress } from "@/components/ui/progress";

type Question = {
  id: number;
  text: string;
  options: string[];
};

const EXAM_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Which of the following correctly describes a 'Closure' in JavaScript?",
    options: [
      "A function that takes another function as an argument.",
      "A combination of a function bundled together with references to its surrounding state.",
      "A method used to securely hide variables from the global scope.",
      "An asynchronous callback executed after a promise resolves."
    ]
  },
  {
    id: 2,
    text: "In React, what happens if you call setState() synchronously inside the render method?",
    options: [
      "The component will batch the state updates and render once.",
      "It will trigger an infinite loop of re-renders.",
      "The state will update, but the UI won't reflect the change immediately.",
      "React will throw a strict mode warning but continue rendering."
    ]
  },
  {
    id: 3,
    text: "What is the primary purpose of the CSS property 'will-change'?",
    options: [
      "To automatically prefix vendor properties during compilation.",
      "To hint to the browser how an element is expected to change, allowing it to optimize ahead of time.",
      "To force a hardware-accelerated 3D transform on an element.",
      "To notify JavaScript event listeners that a style mutation is occurring."
    ]
  }
];

const GRADING_PROMPT = `You are an AI Exam Proctor. The student just submitted a test.
Evaluate their answers. Be brutally honest but constructive.
Respond ONLY in JSON format:
{
  "score": "N/3",
  "confidenceScore": 85,
  "timeAnalysis": "Brief comment on their speed",
  "feedback": [
    {
      "questionId": 1,
      "isCorrect": true,
      "explanation": "You probably chose this because... Remember that..."
    }
  ]
}`;

export default function ExamHall() {
  const router = useRouter();
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (examStarted && timeLeft > 0 && !results && !isSubmitting) {
      timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && !results && !isSubmitting) {
      submitExam();
    }
    return () => clearTimeout(timer);
  }, [examStarted, timeLeft, results, isSubmitting]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelect = (qId: number, option: string) => {
    if (results || isSubmitting) return;
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const submitExam = async () => {
    setIsSubmitting(true);
    try {
      const payload = EXAM_QUESTIONS.map(q => ({
        question: q.text,
        userAnswer: answers[q.id] || "No answer provided"
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
      
      setResults(JSON.parse(cleanJson));
    } catch (e) {
      console.error(e);
      alert("Failed to grade exam. Check API keys.");
    }
    setIsSubmitting(false);
  };

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
              Strict testing environment. 5 minutes on the clock. No hints, no leaving the tab.
              The AI will evaluate your logic behind every mistake upon submission.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button onClick={() => setExamStarted(true)} className="w-full font-bold h-12 text-md rounded-xl">
              Start Exam Now
            </Button>
            <Button variant="ghost" onClick={() => router.push("/")} className="w-full mt-4 text-muted-foreground">
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
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h1 className="font-bold">Exam Session Active</h1>
          </div>
          <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-1.5 rounded-full border ${timeLeft < 60 ? 'bg-destructive/10 text-destructive border-destructive/30 animate-pulse' : 'bg-secondary text-foreground border-border'}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12 max-w-3xl space-y-12">
        {!results && EXAM_QUESTIONS.map((q, idx) => (
          <div key={q.id} className="space-y-4">
            <h3 className="text-lg font-semibold flex items-start gap-3">
              <span className="text-muted-foreground font-mono text-sm mt-1">{String(idx + 1).padStart(2, '0')}.</span>
              {q.text}
            </h3>
            <div className="grid gap-3 pl-8">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(q.id, opt)}
                  className={`text-left px-5 py-4 rounded-xl border transition-all text-sm ${
                    answers[q.id] === opt 
                      ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.15)] font-medium" 
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card/40 border-border">
                <CardContent className="p-6 text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase">Final Score</p>
                  <p className="text-4xl font-black text-foreground">{results.score}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border">
                <CardContent className="p-6 text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase">Confidence</p>
                  <p className="text-4xl font-black text-primary">{results.confidenceScore}%</p>
                </CardContent>
              </Card>
              <Card className="bg-card/40 border-border">
                <CardContent className="p-6 text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase">Time Analysis</p>
                  <p className="text-sm font-medium text-foreground leading-tight pt-2">{results.timeAnalysis}</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6 pt-4">
              <h2 className="text-2xl font-bold border-b border-border pb-4">Detailed Mistake Analysis</h2>
              {results.feedback.map((f: any, idx: number) => {
                const q = EXAM_QUESTIONS.find(x => x.id === f.questionId);
                return (
                  <div key={idx} className="p-6 rounded-2xl border border-border bg-card/30 space-y-4">
                    <div className="flex gap-3">
                      {f.isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-good shrink-0" />
                      ) : (
                        <XCircle className="w-6 h-6 text-destructive shrink-0" />
                      )}
                      <div>
                        <h4 className="font-semibold">{q?.text}</h4>
                        <p className="text-sm text-muted-foreground mt-1">Your answer: {answers[f.questionId] || "None"}</p>
                      </div>
                    </div>
                    {!f.isCorrect && (
                      <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl mt-4">
                        <p className="text-sm text-destructive font-medium flex gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          {f.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="pt-8">
               <Button onClick={() => router.push("/")} className="w-full h-12 rounded-xl">Return to Dashboard</Button>
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
