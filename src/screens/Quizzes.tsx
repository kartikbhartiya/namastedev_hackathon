"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { generateQuiz, generateFollowUpQuestions, detectWeaknesses, DEFAULT_TUTOR_PROFILE } from "@/lib/aiTutor";
import { cn } from "@/lib/utils";

// UI Components
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Icons
import {
  Brain, Trophy, ArrowLeft, Play, CheckCircle2, XCircle,
  Timer, Target, Award, LayoutDashboard, ChevronRight, Clock,
  Sparkles, Loader2, Zap, Activity, BookOpen, AlertCircle,
  Heart, Star
} from "lucide-react";

/* ================= TYPES ================= */

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  incorrectReasoning?: string[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  createdAt: any;
  playlistId?: string;
  timeLimitMinutes?: number;
  difficulty?: "easy" | "medium" | "hard";
  mode?: "practice" | "exam";
  source_material?: string | null;
}

interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeTaken: number;
  completedAt: any;
}

export function Quizzes() {
  const { user, profile } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDark = theme === "dark";

  // Data State
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Generation State
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [aiCourse, setAiCourse] = useState<string>("General");
  const [aiMode, setAiMode] = useState<"practice" | "exam">("practice");
  const [aiSourceType, setAiSourceType] = useState<"topic" | "source">("topic");
  const [aiSourceText, setAiSourceText] = useState("");
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);

  // Quiz Taking State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Post-Quiz Analytics State
  const [xpEarned, setXpEarned] = useState(0);
  const [isAnalyzingWeaknesses, setIsAnalyzingWeaknesses] = useState(false);
  const [weaknessReport, setWeaknessReport] = useState<{ weakTopics: string[]; remediationPlan: string } | null>(null);

  // Fetch Data Helper
  const fetchData = async () => {
    if (!user) return;
    try {
      const { data: quizzesData, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && quizzesData) {
        setQuizzes(quizzesData.map((q: any) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          questions: q.questions || [],
          createdAt: q.created_at,
          playlistId: "generated",
          timeLimitMinutes: q.timeLimitMinutes || q.time_limit_minutes || 10,
          difficulty: q.difficulty || "medium",
          mode: q.mode || "practice"
        })));
      }

      const { data: attemptsData } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (attemptsData) {
        setAttempts(attemptsData.map((a: any) => ({
          id: a.id,
          quizId: a.quiz_id,
          quizTitle: a.quiz_title,
          score: a.score,
          totalQuestions: a.total_questions,
          percentage: a.percentage,
          timeTaken: a.time_taken,
          completedAt: a.completed_at
        })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (searchParams.get('action') === 'generate') {
      const topic = searchParams.get('topic');
      if (topic) {
        setAiTopic(decodeURIComponent(topic));
      }
      setIsAiDialogOpen(true);
    }
  }, [searchParams]);

  // Timer Effect
  useEffect(() => {
    if (activeQuiz && quizStartTime && activeQuiz.timeLimitMinutes && !showResults) {
      const totalSeconds = activeQuiz.timeLimitMinutes * 60;
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
        const remaining = totalSeconds - elapsed;
        setTimeLeft(Math.max(0, remaining));

        if (remaining <= 0) {
          finishQuiz();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeQuiz, quizStartTime, showResults]);

  const stats = useMemo(() => {
    const totalAttempts = attempts.length;
    const avgScore = totalAttempts > 0
      ? Math.round(attempts.reduce((acc, a) => acc + a.percentage, 0) / totalAttempts)
      : 0;
    const perfectScores = attempts.filter(a => a.percentage === 100).length;

    return { totalAttempts, avgScore, perfectScores };
  }, [attempts]);

  const generateAIQuiz = async () => {
    if (!user) return;
    if (aiSourceType === "topic" && !aiTopic.trim()) return;
    if (aiSourceType === "source" && !aiSourceText.trim()) return;

    setGeneratingQuiz(true);
    try {
      const studentContext = {
        name: profile?.name?.split(" ")[0] || "Student",
        streak: profile?.study_streak || 0,
        weeklyStudyHours: `${((profile?.total_uptime || 0) / 60).toFixed(1)}h`,
      };

      const questionsData = await generateQuiz(
        aiSourceType === 'topic' ? `${aiTopic} (Target Course: ${aiCourse})` : `Extract questions from the provided source material`,
        aiDifficulty.toLowerCase() as "easy" | "medium" | "hard",
        5, // 5 questions to keep it quick and reliable
        DEFAULT_TUTOR_PROFILE,
        studentContext,
        aiSourceType === 'source' ? aiSourceText : undefined
      );

      if (!questionsData || questionsData.length === 0) {
        throw new Error("AI returned no questions. Please try again.");
      }

      const formattedQuestions: QuizQuestion[] = questionsData.map((q, i) => ({
        id: String(i + 1),
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        incorrectReasoning: q.incorrectReasoning || []
      }));

      const generatedTitle = aiSourceType === 'topic'
        ? `${aiTopic} Quiz`
        : `Source Material Quiz`;

      const quizData = {
        id: "q-" + Math.random().toString(36).substring(2, 9),
        title: generatedTitle,
        description: `AI-generated quiz on ${aiSourceType === 'topic' ? aiTopic : 'provided source material'}`,
        questions: formattedQuestions,
        timeLimitMinutes: 10,
        difficulty: aiDifficulty.toLowerCase() as any,
        mode: aiMode,
        created_at: new Date().toISOString()
      };

      await supabase.from('quizzes').insert(quizData);
      toast.success(`Generated ${quizData.questions.length} questions for "${aiSourceType === 'topic' ? aiTopic : 'Source'}"! 🎉`);
      setIsAiDialogOpen(false);
      setAiTopic("");
      setAiSourceText("");
      fetchData();
    } catch (e: any) {
      console.error("Quiz Gen Error", e);
      toast.error(e.message || "Failed to generate quiz. Try again.");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleGenerateFollowUp = async (concept: string) => {
    if (!user || !activeQuiz) return;
    setIsGeneratingFollowUp(true);
    try {
      const studentContext = {
        name: profile?.name?.split(" ")[0] || "Student",
        streak: profile?.study_streak || 0,
      };

      const newQuestions = await generateFollowUpQuestions(concept, DEFAULT_TUTOR_PROFILE, studentContext);

      if (!newQuestions || newQuestions.length === 0) {
        throw new Error("Could not generate questions.");
      }

      const questionsWithIds = newQuestions.map((q, i) => ({
        ...q,
        id: `followup-${Date.now()}-${i}`
      }));

      setActiveQuiz(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: [...prev.questions, ...questionsWithIds]
        };
      });

      setSelectedAnswers(prev => [...prev, ...new Array(newQuestions.length).fill(null)]);
      toast.success("Added 2 targeted follow-up questions to the end of this quiz!");
    } catch (e) {
      toast.error("Failed to generate follow-up questions.");
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(null));
    setQuizStartTime(Date.now());
    setShowResults(false);
    if (quiz.timeLimitMinutes) {
      setTimeLeft(quiz.timeLimitMinutes * 60);
    }
  };

  const selectAnswer = (answerIndex: number) => {
    const isPracticeMode = activeQuiz?.mode === 'practice' || !activeQuiz?.mode;
    if (isPracticeMode && selectedAnswers[currentQuestionIndex] !== null) return;

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < (activeQuiz?.questions.length || 1) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const finishQuiz = async () => {
    if (!activeQuiz || !user || !quizStartTime) return;

    const timeTaken = Math.floor((Date.now() - quizStartTime) / 1000);
    let correctCount = 0;

    activeQuiz.questions.forEach((q, i) => {
      if (selectedAnswers[i] === q.correctIndex) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / activeQuiz.questions.length) * 100);

    const attempt = {
      id: "attempt-" + Math.random().toString(36).substring(2, 9),
      user_id: user.id,
      quiz_id: activeQuiz.id,
      quiz_title: activeQuiz.title,
      score: correctCount,
      total_questions: activeQuiz.questions.length,
      percentage,
      time_taken: timeTaken,
      completed_at: new Date().toISOString()
    };

    await supabase.from('quiz_attempts').insert(attempt);

    const xp = correctCount * 15 + (percentage === 100 ? 50 : 0);
    setXpEarned(xp);

    const incorrectQs = activeQuiz.questions
      .map((q, i) => {
        if (selectedAnswers[i] !== q.correctIndex) {
          return {
            question: q.question,
            userAnswer: q.options[selectedAnswers[i] ?? -1] || "Skipped"
          };
        }
        return null;
      })
      .filter((q): q is { question: string; userAnswer: string } => q !== null);

    if (incorrectQs.length > 0) {
      setIsAnalyzingWeaknesses(true);
      const studentContext = {
        name: profile?.name?.split(" ")[0] || "Student",
      };
      detectWeaknesses(activeQuiz.title, incorrectQs, DEFAULT_TUTOR_PROFILE, studentContext)
        .then(report => setWeaknessReport({
          weakTopics: report.weakChapters,
          remediationPlan: report.plan
        }))
        .catch(e => console.error(e))
        .finally(() => setIsAnalyzingWeaknesses(false));
    } else {
      setWeaknessReport({
        weakTopics: [],
        remediationPlan: "Perfect score! You've mastered all the concepts covered in this quiz."
      });
    }

    toast.success("Quiz Complete!", {
      description: `Scored: ${percentage}% | +${xp} XP`
    });

    setShowResults(true);
    fetchData();
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setQuizStartTime(null);
    setShowResults(false);
    setTimeLeft(null);
    setWeaknessReport(null);
    setIsAnalyzingWeaknesses(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pt-14 md:pt-16">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">Gathering practice cards...</p>
        </div>
      </div>
    );
  }

  // Quiz Taking View
  if (activeQuiz && !showResults) {
    const currentQuestion = activeQuiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100;

    return (
      <div className={cn("min-h-screen transition-all duration-500 pt-14 md:pt-16 bg-[#020617] text-slate-50")}>
        <header className={cn("sticky top-14 md:top-16 z-50 border-b backdrop-blur-md p-4 bg-background/40 border-white/5")}>
          <div className="container mx-auto flex justify-between items-center">
            <Button variant="ghost" onClick={resetQuiz} className="rounded-xl gap-2 hover:bg-white/5 text-neutral-300">
              <ArrowLeft className="h-4 w-4" /> Exit Quiz
            </Button>
            <div className="flex items-center gap-4">
              {timeLeft !== null && (
                <Badge variant="outline" className={cn("text-lg font-mono", timeLeft < 60 ? "text-red-500 animate-pulse border-red-500/20" : "border-white/10")}>
                  <Timer className="h-4 w-4 mr-2" /> {formatTime(timeLeft)}
                </Badge>
              )}
              <span className="font-bold">{currentQuestionIndex + 1}/{activeQuiz.questions.length}</span>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8 max-w-3xl relative z-10">
          <Progress value={progress} className="h-2 mb-8 rounded-full bg-white/5" />

          <Card className="rounded-[2rem] border border-white/[0.06] shadow-2xl bg-card/50 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold leading-relaxed">{currentQuestion?.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(() => {
                const isPracticeMode = activeQuiz.mode === 'practice' || !activeQuiz.mode;
                const hasAnswered = selectedAnswers[currentQuestionIndex] !== null;
                return (
                  <>
                    {currentQuestion?.options.map((option, i) => {
                      const isSelected = selectedAnswers[currentQuestionIndex] === i;
                      const isCorrect = i === currentQuestion.correctIndex;

                      let btnStyle = "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] text-neutral-300";
                      let iconStyle = "bg-white/10 text-white";

                      if (isSelected) {
                        btnStyle = "bg-white text-black border-white shadow-lg";
                        iconStyle = "bg-black/20 text-black";
                      }

                      if (isPracticeMode && hasAnswered) {
                        if (isCorrect) {
                          btnStyle = "bg-green-500/10 border-green-500/30 text-green-400";
                          iconStyle = "bg-green-500 text-white";
                        } else if (isSelected && !isCorrect) {
                          btnStyle = "bg-rose-500/10 border-rose-500/30 text-rose-400 opacity-80";
                          iconStyle = "bg-rose-500 text-white";
                        } else {
                          btnStyle = "opacity-40 grayscale cursor-not-allowed hidden md:flex";
                        }
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => selectAnswer(i)}
                          disabled={isPracticeMode && hasAnswered}
                          className={cn(
                            "w-full p-4 rounded-xl text-left transition-all duration-200 border text-sm font-medium flex items-center gap-3",
                            btnStyle
                          )}
                        >
                          <span className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                            iconStyle
                          )}>
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1">{option}</span>
                          {isPracticeMode && hasAnswered && isCorrect && <CheckCircle2 className="h-4 w-4 ml-auto text-green-400 shrink-0" />}
                          {isPracticeMode && hasAnswered && isSelected && !isCorrect && <XCircle className="h-4 w-4 ml-auto text-rose-400 shrink-0" />}
                        </button>
                      );
                    })}

                    {isPracticeMode && hasAnswered && currentQuestion?.explanation && (
                      <div className="mt-4 p-5 rounded-xl bg-white/[0.01] border border-white/[0.06] animate-in fade-in duration-300">
                        <h4 className="font-bold text-neutral-300 text-xs mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                          <Sparkles className="h-3.5 w-3.5 text-neutral-400" /> Explanation
                        </h4>
                        <p className="text-xs text-neutral-400 leading-relaxed mb-3">
                          {currentQuestion.explanation}
                        </p>

                        {currentQuestion.incorrectReasoning && currentQuestion.incorrectReasoning.length > 0 && selectedAnswers[currentQuestionIndex] !== currentQuestion.correctIndex && (
                          <div className="space-y-2 pt-3 border-t border-white/[0.06]">
                            <h5 className="font-semibold text-[10px] text-neutral-500 uppercase tracking-wider">Incorrect Option Analysis</h5>
                            {currentQuestion.options.map((opt, idx) => {
                              if (idx === currentQuestion.correctIndex) return null;
                              const reasoning = currentQuestion.incorrectReasoning?.[idx];
                              if (!reasoning) return null;

                              return (
                                <div key={idx} className="flex gap-2 text-xs text-neutral-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                                  <span className="font-bold text-neutral-500">{String.fromCharCode(65 + idx)}:</span>
                                  <p className="leading-normal">{reasoning}</p>
                                </div>
                              );
                            })}

                            <div className="pt-3 flex justify-end">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="rounded-lg font-bold text-xs bg-white/[0.05] hover:bg-white/[0.1] text-white border border-white/10"
                                onClick={() => handleGenerateFollowUp(currentQuestion.question)}
                                disabled={isGeneratingFollowUp}
                              >
                                {isGeneratingFollowUp ? (
                                  <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Adding Questions...</>
                                ) : (
                                  <><Brain className="h-3.5 w-3.5 mr-1.5" /> Request Follow-up Concepts</>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={prevQuestion}
              disabled={currentQuestionIndex === 0}
              className="rounded-xl border-white/10 text-neutral-300 hover:bg-white/5"
            >
              Previous
            </Button>
            {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
              <Button onClick={nextQuestion} className="rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold gap-1">
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={finishQuiz}
                className="rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold gap-1.5"
                disabled={selectedAnswers.some(a => a === null)}
              >
                <CheckCircle2 className="h-4 w-4" /> Finish Assessment
              </Button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Results View
  if (showResults && activeQuiz) {
    const correctCount = activeQuiz.questions.reduce((acc, q, i) =>
      acc + (selectedAnswers[i] === q.correctIndex ? 1 : 0), 0
    );
    const percentage = Math.round((correctCount / activeQuiz.questions.length) * 100);
    const timeTaken = quizStartTime ? Math.floor((Date.now() - quizStartTime) / 1000) : 0;

    return (
      <div className={cn("min-h-screen transition-all duration-500 pt-14 md:pt-16 bg-[#020617] text-slate-50")}>
        <div className="container mx-auto px-6 py-12 max-w-2xl">
          <Card className="rounded-[2rem] border border-white/[0.06] shadow-2xl text-center overflow-hidden bg-card/50 backdrop-blur-xl">
            <div className={cn("p-8", percentage >= 85 ? "bg-green-500/10 border-b border-green-500/20" : percentage >= 60 ? "bg-amber-500/10 border-b border-amber-500/20" : "bg-rose-500/10 border-b border-rose-500/20")}>
              <Trophy className={cn("h-14 w-14 mx-auto mb-3", percentage >= 85 ? "text-green-400" : percentage >= 60 ? "text-amber-400" : "text-rose-400")} />
              <h1 className="text-2xl font-bold text-white mb-1">Assessment Complete</h1>
              <p className="text-neutral-400 text-sm">{activeQuiz.title}</p>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="text-5xl font-extrabold text-white">
                {percentage}%
              </div>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="text-xl font-bold text-green-400">{correctCount}</div>
                  <div className="text-[10px] text-neutral-400">Correct</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <div className="text-xl font-bold text-rose-400">{activeQuiz.questions.length - correctCount}</div>
                  <div className="text-[10px] text-neutral-400">Incorrect</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <div className="text-xl font-bold text-neutral-300">{formatTime(timeTaken)}</div>
                  <div className="text-[10px] text-neutral-400">Duration</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-xl font-bold text-amber-400 flex items-center justify-center gap-1">
                    <Zap className="h-4 w-4" /> {xpEarned}
                  </div>
                  <div className="text-[10px] text-neutral-400">XP Gained</div>
                </div>
              </div>

              {/* Weakness Detection AI Report */}
              <div className="mt-6 mb-4 text-left">
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-neutral-400" /> Performance Analytics
                </h3>

                {isAnalyzingWeaknesses ? (
                  <div className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
                    <Loader2 className="h-6 w-6 text-neutral-400 animate-spin mb-2" />
                    <p className="text-neutral-400 text-xs text-center animate-pulse">
                      Analyzing mistake patterns...
                    </p>
                  </div>
                ) : weaknessReport ? (
                  <div className={cn("rounded-xl p-5 border border-white/[0.06] bg-white/[0.01]")}>
                    {weaknessReport.weakTopics.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-bold text-amber-400 flex items-center gap-2 text-xs uppercase tracking-wider mb-2">
                          <AlertCircle className="h-3.5 w-3.5" /> Weak Topics Detected
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {weaknessReport.weakTopics.map((topic, i) => (
                            <Badge key={i} variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className={cn("font-bold flex items-center gap-2 text-xs uppercase tracking-wider mb-2", weaknessReport.weakTopics.length > 0 ? "text-amber-400" : "text-green-400")}>
                        <Brain className="h-3.5 w-3.5" /> AI Study Strategy
                      </h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        {weaknessReport.remediationPlan}
                      </p>
                    </div>

                    {weaknessReport.weakTopics.length > 0 && (
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" className="rounded-lg border-white/10 text-xs hover:bg-white/5" onClick={() => router.push('/ai-tutor')}>
                          <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Discuss with Aria
                        </Button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Answer Review Section */}
              <div className="text-left mt-6">
                <h3 className="text-sm font-bold mb-3">Review Questions</h3>
                <ScrollArea className="h-56 rounded-xl border border-white/[0.06] bg-black/20 p-2">
                  <div className="space-y-2 text-left">
                    {activeQuiz.questions.map((q, i) => (
                      <div key={q.id} className={cn("p-3 rounded-lg border text-xs", selectedAnswers[i] === q.correctIndex ? "border-green-500/20 bg-green-500/[0.02]" : "border-rose-500/20 bg-rose-500/[0.02]")}>
                        <div className="flex items-start gap-2">
                          {selectedAnswers[i] === q.correctIndex
                            ? <CheckCircle2 className="h-4.5 w-4.5 text-green-500 shrink-0 mt-0.5" />
                            : <XCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                          }
                          <div>
                            <p className="font-semibold text-neutral-200 leading-normal">{q.question}</p>
                            <p className="text-[10px] mt-1 text-neutral-500">
                              Selected: <span className={selectedAnswers[i] === q.correctIndex ? "text-green-400" : "text-rose-400"}>{q.options[selectedAnswers[i] ?? -1] || "Skipped"}</span>
                              {selectedAnswers[i] !== q.correctIndex && (
                                <span className="text-green-400 ml-2">• Correct: {q.options[q.correctIndex]}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Hackathon Support Banner */}
              <div className="mt-6 p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] text-left relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                  <Heart className="h-20 w-20 fill-white" />
                </div>
                <div className="relative z-10">
                  <h4 className="font-bold text-neutral-300 text-xs mb-1 flex items-center gap-1">
                    Enjoying the Eclix Demo? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  </h4>
                  <p className="text-[11px] text-neutral-500 leading-relaxed mb-3">
                    Eclix features a complete, zero-setup developer ecosystem. Try generating new topics dynamically or asking AI questions!
                  </p>
                  <Button
                    size="sm"
                    className="rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-xs px-3 h-8"
                    onClick={() => {
                      toast.success("Thank you for reviewing Eclix! Premium donation flow mock successfully unlocked.");
                    }}
                  >
                    Unlock Premium Support
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={resetQuiz} className="flex-1 rounded-xl border-white/10 text-neutral-300 hover:bg-white/5">Back to Board</Button>
                <Button onClick={() => startQuiz(activeQuiz)} className="flex-1 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold gap-1.5">
                  <Play className="h-4 w-4" /> Retry Test
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen transition-all duration-500 pt-14 md:pt-16 bg-[#020617] text-slate-50")}>
      <header className={cn("sticky top-14 md:top-16 z-50 border-b backdrop-blur-md bg-background/40 border-white/5 shadow-sm")}>
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push("/")}>
            <div className={cn("p-2.5 rounded-xl transition-all duration-300 group-hover:rotate-12 bg-white/5 text-white")}>
              <Brain className="h-5 w-5" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-white">Quizzes</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push("/")} className="rounded-xl gap-1.5 hover:bg-white/5 text-neutral-300 text-xs sm:text-sm px-2 sm:px-3">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-4 sm:space-y-6 relative z-10 max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Brain, label: "Available Assessments", value: quizzes.length, color: "from-neutral-800 to-neutral-900 border border-border" },
            { icon: Target, label: "Total Submissions", value: stats.totalAttempts, color: "from-neutral-800 to-neutral-900 border border-border" },
            { icon: Trophy, label: "Average Accuracy", value: `${stats.avgScore}%`, color: "from-neutral-800 to-neutral-900 border border-border" },
            { icon: Award, label: "Perfect Scores", value: stats.perfectScores, color: "from-neutral-800 to-neutral-900 border border-border" },
          ].map((stat, i) => (
            <Card key={i} className="rounded-xl border border-white/[0.06] bg-card/40 shadow-lg">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-2.5 rounded-xl bg-white/5 text-white")}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="available-quizzes" className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-transparent gap-2 h-auto p-0 border-b border-white/[0.06] pb-3">
            <TabsTrigger value="available-quizzes" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black text-xs font-semibold px-4 py-2 text-neutral-400">Available Quizzes</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black text-xs font-semibold px-4 py-2 text-neutral-400">Submission History</TabsTrigger>
          </TabsList>

          <TabsContent value="available-quizzes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-white">Select Practice Cards</h2>
              <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-lg font-semibold bg-white hover:bg-neutral-200 text-black text-xs h-9 px-3">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate AI Quiz
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0b0c10] border-white/10 text-white max-w-sm rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base font-bold">
                      <Sparkles className="h-4 w-4 text-neutral-400" />
                      Generate AI Quiz
                    </DialogTitle>
                    <DialogDescription className="text-xs text-neutral-500">
                      Configure details for your personalized exam.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-3">
                    <Tabs value={aiSourceType} onValueChange={(val: any) => setAiSourceType(val)} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-3 bg-white/5 p-0.5 rounded-lg">
                        <TabsTrigger value="topic" className="text-xs py-1 data-[state=active]:bg-white data-[state=active]:text-black">Topic-Based</TabsTrigger>
                        <TabsTrigger value="source" className="text-xs py-1 data-[state=active]:bg-white data-[state=active]:text-black">Source Material</TabsTrigger>
                      </TabsList>

                      <TabsContent value="topic" className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Concept Subject</label>
                          <Input
                            placeholder="e.g., Classical Mechanics, Gauss Law..."
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !generatingQuiz && generateAIQuiz()}
                            className="bg-white/[0.03] border-white/10 text-xs h-9"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Exam Board</label>
                            <select
                              value={aiCourse}
                              onChange={(e) => setAiCourse(e.target.value)}
                              className="w-full h-9 px-3 rounded-lg border border-white/10 text-xs bg-white/[0.03] text-white focus:ring-0 focus:outline-none"
                            >
                              <option value="General">General Basics</option>
                              <option value="JEE Mains">JEE / NEET Prep</option>
                              <option value="School finals">High School Physics</option>
                              <option value="University Course">B.Tech Engineering</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Difficulty</label>
                            <select
                              value={aiDifficulty}
                              onChange={(e) => setAiDifficulty(e.target.value as any)}
                              className="w-full h-9 px-3 rounded-lg border border-white/10 text-xs bg-white/[0.03] text-white focus:ring-0 focus:outline-none"
                            >
                              <option value="Easy">🟢 Easy</option>
                              <option value="Medium">🟡 Medium</option>
                              <option value="Hard">🔴 Hard</option>
                            </select>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="source" className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Source Excerpt</label>
                          <textarea
                            placeholder="Paste notes, textbook sections, or summaries..."
                            value={aiSourceText}
                            onChange={(e) => setAiSourceText(e.target.value)}
                            className="w-full h-24 px-3 py-2 rounded-lg border border-white/10 text-xs bg-white/[0.03] text-white resize-none outline-none focus:ring-0"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Difficulty</label>
                          <select
                            value={aiDifficulty}
                            onChange={(e) => setAiDifficulty(e.target.value as any)}
                            className="w-full h-9 px-3 rounded-lg border border-white/10 text-xs bg-white/[0.03] text-white focus:ring-0 focus:outline-none"
                          >
                            <option value="Easy">🟢 Easy</option>
                            <option value="Medium">🟡 Medium</option>
                            <option value="Hard">🔴 Hard</option>
                          </select>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="pt-2.5 border-t border-white/10">
                      <div className="space-y-1">
                        <label className="text-[10px] text-neutral-400 uppercase tracking-wider">Quiz Format</label>
                        <select
                          value={aiMode}
                          onChange={(e) => setAiMode(e.target.value as any)}
                          className="w-full h-9 px-3 rounded-lg border border-white/10 text-xs bg-white/[0.03] text-white focus:ring-0 focus:outline-none"
                        >
                          <option value="practice">📚 Practice Mode (Instant Explanations)</option>
                          <option value="exam">⏱️ Exam Mode (Timer enabled)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="flex justify-end gap-2 mt-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsAiDialogOpen(false)} className="text-xs text-neutral-400 hover:text-white">Cancel</Button>
                    <Button
                      onClick={generateAIQuiz}
                      disabled={generatingQuiz || (aiSourceType === 'topic' && !aiTopic.trim())}
                      className="bg-white hover:bg-neutral-200 text-black text-xs font-semibold h-8 rounded-lg"
                    >
                      {generatingQuiz ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Coding...</>
                      ) : (
                        <><Sparkles className="h-3.5 w-3.5 mr-1" /> Create Quiz</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {quizzes.length === 0 ? (
              <Card className="rounded-xl border border-white/[0.06] bg-card/40 shadow-xl text-center py-12">
                <Brain className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-semibold mb-1 text-white">No Quizzes Created</h3>
                <p className="text-xs text-muted-foreground mb-4">Generate your first quiz using the Sparkles button above</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map(quiz => {
                  const hasCompleted = attempts.some(a => a.quizId === quiz.id);
                  return (
                    <Card key={quiz.id} className="rounded-xl border border-white/[0.06] bg-card/40 shadow-xl hover:border-white/10 hover:shadow-2xl transition-all hover:-translate-y-0.5 group">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2.5 text-sm font-bold text-white">
                          <div className="p-2 rounded-lg bg-white/5 text-white">
                            <Brain className="h-4 w-4" />
                          </div>
                          <span className="truncate max-w-[170px]" title={quiz.title}>{quiz.title}</span>
                        </CardTitle>
                        <CardDescription className="text-[10px] text-neutral-500">{quiz.questions.length} questions • {quiz.difficulty || 'medium'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => startQuiz(quiz)}
                          className={cn(
                            "w-full rounded-lg font-semibold text-xs h-8 gap-1.5",
                            hasCompleted
                              ? "bg-white/5 text-neutral-400 border border-white/5 hover:bg-white/10"
                              : "bg-white hover:bg-neutral-200 text-black"
                          )}
                        >
                          {hasCompleted ? (
                            <><CheckCircle2 className="h-3.5 w-3.5 text-green-400" /> Retry Test</>
                          ) : (
                            <><Play className="h-3.5 w-3.5" /> Start Assessment</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            <h2 className="text-sm font-semibold text-white mb-4">Assessments History</h2>
            {attempts.length === 0 ? (
              <Card className="rounded-xl border border-white/[0.06] bg-card/40 shadow-xl text-center py-12">
                <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-semibold mb-1 text-white">No attempts recorded</h3>
                <p className="text-xs text-muted-foreground">Complete any quiz to populate this dashboard</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {attempts.map(attempt => (
                  <Card key={attempt.id} className="rounded-lg border border-white/[0.06] bg-card/40 shadow-md">
                    <CardContent className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm border",
                          attempt.percentage >= 80 ? "bg-green-500/10 border-green-500/20 text-green-400" :
                            attempt.percentage >= 50 ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                              "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        )}>
                          {attempt.percentage}%
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">{attempt.quizTitle}</p>
                          <p className="text-[10px] text-neutral-500">
                            {attempt.score}/{attempt.totalQuestions} correct • {formatTime(attempt.timeTaken)} elapsed
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-white/5 bg-white/[0.02] text-neutral-400">
                        {attempt.completedAt ? new Date(attempt.completedAt).toLocaleDateString() : "Just now"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
