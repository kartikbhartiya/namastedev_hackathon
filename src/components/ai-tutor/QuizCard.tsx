"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CheckCircle2, XCircle, ChevronRight, Trophy, RotateCcw,
    Sparkles, Loader2, Brain,
} from "lucide-react";
import type { QuizQuestion, TutorProfile, StudentContext } from "@/lib/aiTutor";
import { generateQuiz } from "@/lib/aiTutor";

interface QuizCardProps {
    questions: QuizQuestion[];
    topic?: string;
    onGenerate?: (questions: QuizQuestion[]) => void;
    tutorProfile?: TutorProfile | null;
    studentContext?: StudentContext;
}

export function QuizCard({ questions, topic, onGenerate, tutorProfile, studentContext }: QuizCardProps) {
    const [quizTopic, setQuizTopic] = useState(topic || "");
    const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
    const [count, setCount] = useState("5");
    const [loading, setLoading] = useState(false);

    // Quiz state
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(false);

    const handleGenerate = async () => {
        if (!quizTopic.trim() || !tutorProfile || !studentContext) return;
        setLoading(true);
        try {
            const result = await generateQuiz(quizTopic, difficulty, Number(count), tutorProfile, studentContext);
            setCurrentQ(0);
            setSelectedAnswer(null);
            setShowExplanation(false);
            setScore(0);
            setCompleted(false);
            onGenerate?.(result);
        } catch (err) {
            console.error("Quiz generation error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!questions.length) {
        return (
            <div className="space-y-4">
                <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-foreground">AI Quiz Generator</h3>
                    <p className="text-xs text-muted-foreground">
                        Generate a personalized quiz to test your knowledge
                    </p>
                </div>

                <div className="space-y-3 p-4 bg-foreground/[0.02] border border-border rounded-xl">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Topic</label>
                        <Input
                            value={quizTopic}
                            onChange={(e) => setQuizTopic(e.target.value)}
                            placeholder="e.g. Classical Mechanics, Electrostatics, Calculus..."
                            className="bg-foreground/[0.03] border-border text-foreground text-sm placeholder:text-foreground/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Difficulty</label>
                            <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                                <SelectTrigger className="h-9 text-xs bg-foreground/[0.03] border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border z-50">
                                    <SelectItem value="easy" className="text-xs">🟢 Easy</SelectItem>
                                    <SelectItem value="medium" className="text-xs">🟡 Medium</SelectItem>
                                    <SelectItem value="hard" className="text-xs">🔴 Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Questions</label>
                            <Select value={count} onValueChange={setCount}>
                                <SelectTrigger className="h-9 text-xs bg-foreground/[0.03] border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border z-50">
                                    <SelectItem value="5" className="text-xs">5 questions</SelectItem>
                                    <SelectItem value="10" className="text-xs">10 questions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {tutorProfile && (
                        <div className="flex flex-wrap gap-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-500/10 border border-neutral-500/20 text-neutral-300">
                                <Brain className="w-2.5 h-2.5 inline mr-1" />
                                {tutorProfile.explanation_style}
                            </span>
                            <span className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full border",
                                difficulty === "easy" ? "bg-green-500/10 border-green-500/20 text-green-300" :
                                    difficulty === "medium" ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                                        "bg-red-500/10 border-red-500/20 text-red-300"
                             )}>
                                {difficulty} difficulty
                            </span>
                        </div>
                    )}

                    <Button
                        onClick={handleGenerate}
                        disabled={!quizTopic.trim() || loading || !tutorProfile}
                        className="w-full bg-white hover:bg-neutral-200 text-black h-10"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Quiz...</>
                        ) : (
                            <><Sparkles className="w-4 h-4 mr-2" /> Generate Quiz</>
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    const question = questions[currentQ];
    const isCorrect = selectedAnswer === question?.correctIndex;

    const handleAnswer = (index: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(index);
        setShowExplanation(true);
        if (index === question.correctIndex) setScore((s) => s + 1);
    };

    const handleNext = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ((q) => q + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
        } else {
            setCompleted(true);
        }
    };

    const handleRestart = () => {
        setCurrentQ(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setScore(0);
        setCompleted(false);
    };

    if (completed) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <div className="p-6 bg-foreground/[0.02] border border-border rounded-xl text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-neutral-800 border border-border flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-yellow-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Quiz Complete!</h3>
                    {quizTopic && <p className="text-xs text-muted-foreground">{quizTopic}</p>}
                </div>
                <div className="text-3xl font-bold text-foreground">
                    {score}/{questions.length}
                    <span className="text-sm text-muted-foreground ml-2">({percentage}%)</span>
                </div>
                <p className="text-sm text-muted-foreground">
                    {percentage >= 80 ? "🔥 Excellent!" : percentage >= 60 ? "👍 Good effort!" : "📚 Keep practicing!"}
                </p>
                <div className="flex gap-2 justify-center">
                    <Button onClick={handleRestart} variant="ghost" className="text-neutral-400 hover:text-neutral-300">
                        <RotateCcw className="w-4 h-4 mr-2" /> Try Again
                    </Button>
                    <Button onClick={() => onGenerate?.([])} variant="ghost" className="text-foreground/40 hover:text-foreground">
                        New Quiz
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Question {currentQ + 1} of {questions.length}</span>
                <div className="flex items-center gap-3">
                    <span>Score: {score}/{currentQ + (selectedAnswer !== null ? 1 : 0)}</span>
                    <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px]",
                        difficulty === "easy" ? "bg-green-500/10 text-green-300" :
                            difficulty === "medium" ? "bg-amber-500/10 text-amber-300" :
                                "bg-red-500/10 text-red-300"
                    )}>
                        {difficulty}
                    </span>
                </div>
            </div>
            <div className="w-full h-1 bg-foreground/[0.06] rounded-full overflow-hidden">
                <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${((currentQ + (selectedAnswer !== null ? 1 : 0)) / questions.length) * 100}%` }}
                />
            </div>

            <div className="p-4 bg-foreground/[0.03] border border-border rounded-xl">
                <p className="text-sm text-foreground font-medium leading-relaxed">{question.question}</p>
            </div>

            <div className="space-y-2">
                {question.options.map((option, i) => {
                    const isSelected = selectedAnswer === i;
                    const isCorrectOption = i === question.correctIndex;
                    const showResult = selectedAnswer !== null;

                    return (
                        <button
                            key={i}
                            onClick={() => handleAnswer(i)}
                            disabled={selectedAnswer !== null}
                            className={cn(
                                "w-full p-3 rounded-xl border text-left text-sm transition-all",
                                "flex items-center gap-3",
                                showResult && isCorrectOption
                                    ? "bg-green-500/15 border-green-500/40 text-green-300"
                                    : showResult && isSelected && !isCorrectOption
                                        ? "bg-red-500/15 border-red-500/40 text-red-300"
                                        : "bg-foreground/[0.02] border-border text-foreground/80 hover:bg-foreground/[0.05] hover:border-border"
                            )}
                        >
                            {showResult && isCorrectOption ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                            ) : showResult && isSelected ? (
                                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            ) : (
                                <div className="w-4 h-4 rounded-full border border-border flex-shrink-0" />
                            )}
                            {option}
                        </button>
                    );
                })}
            </div>

            {showExplanation && (
                <div className={cn(
                    "p-3 rounded-xl border text-xs",
                    isCorrect ? "bg-green-500/10 border-green-500/20 text-green-200" : "bg-amber-500/10 border-amber-500/20 text-amber-200"
                )}>
                    <p className="font-semibold mb-1">{isCorrect ? "✅ Correct!" : "❌ Incorrect"}</p>
                    <p className="text-foreground/70">{question.explanation}</p>
                </div>
            )}

            {selectedAnswer !== null && (
                <Button onClick={handleNext} className="w-full bg-white hover:bg-neutral-200 text-black">
                    {currentQ < questions.length - 1 ? (
                        <>Next Question <ChevronRight className="w-4 h-4 ml-1" /></>
                    ) : (
                        <>Finish Quiz <Trophy className="w-4 h-4 ml-1" /></>
                    )}
                </Button>
            )}
        </div>
    );
}
