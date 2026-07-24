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
import { generateQuiz, DEFAULT_TUTOR_PROFILE } from "@/lib/aiTutor";

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
        if (!quizTopic.trim()) return;
        setLoading(true);
        try {
            const result = await generateQuiz(quizTopic, difficulty, Number(count), tutorProfile || DEFAULT_TUTOR_PROFILE, studentContext || { name: "Student" });
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

    // Show config form if no questions
    if (!questions.length) {
        return (
            <div className="space-y-4 max-w-lg mx-auto p-6 bg-neutral-900/60 border border-white/10 rounded-2xl backdrop-blur-md">
                <div className="text-center space-y-1">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2">
                        <Brain className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white">AI Quiz Generator</h3>
                    <p className="text-xs text-neutral-400">
                        Generate a personalized interactive quiz to test your CS knowledge
                    </p>
                </div>

                <div className="space-y-3 pt-2">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Topic</label>
                        <Input
                            value={quizTopic}
                            onChange={(e) => setQuizTopic(e.target.value)}
                            placeholder="e.g. Data Structures, React Lifecycle, System Design..."
                            className="bg-neutral-950 border-white/10 text-white text-sm placeholder:text-neutral-600 rounded-xl"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Difficulty</label>
                            <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                                <SelectTrigger className="h-10 text-xs bg-neutral-950 border-white/10 text-white rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                    <SelectItem value="easy" className="text-xs">🟢 Easy</SelectItem>
                                    <SelectItem value="medium" className="text-xs">🟡 Medium</SelectItem>
                                    <SelectItem value="hard" className="text-xs">🔴 Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">Questions</label>
                            <Select value={count} onValueChange={setCount}>
                                <SelectTrigger className="h-10 text-xs bg-neutral-950 border-white/10 text-white rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-900 border-white/10 text-white">
                                    <SelectItem value="3" className="text-xs">3 Questions</SelectItem>
                                    <SelectItem value="5" className="text-xs">5 Questions</SelectItem>
                                    <SelectItem value="10" className="text-xs">10 Questions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={loading || !quizTopic.trim()}
                        className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/20 mt-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Quiz...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" /> Start AI Quiz
                            </>
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    const q = questions[currentQ];

    const handleSelectOption = (idx: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(idx);
        setShowExplanation(true);
        if (idx === q.correctIndex) {
            setScore((s) => s + 1);
        }
    };

    const handleNext = () => {
        if (currentQ < questions.length - 1) {
            setCurrentQ((c) => c + 1);
            setSelectedAnswer(null);
            setShowExplanation(false);
        } else {
            setCompleted(true);
        }
    };

    const handleReset = () => {
        setCurrentQ(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setScore(0);
        setCompleted(false);
    };

    // Quiz completed summary view
    if (completed) {
        const pct = Math.round((score / questions.length) * 100);
        return (
            <div className="p-6 bg-neutral-900/60 border border-white/10 rounded-2xl text-center space-y-4 max-w-md mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                    <Trophy className="w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-white">Quiz Completed!</h3>
                    <p className="text-xs text-neutral-400 mt-1">
                        You scored <span className="font-bold text-amber-400">{score}</span> out of <span className="font-bold text-white">{questions.length}</span> ({pct}%)
                    </p>
                </div>

                <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-purple-500 to-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                    />
                </div>

                <Button onClick={handleReset} variant="outline" className="w-full border-white/10 text-white hover:bg-white/10 rounded-xl">
                    <RotateCcw className="w-4 h-4 mr-2" /> Retry Quiz
                </Button>
            </div>
        );
    }

    return (
        <div className="p-5 bg-neutral-900/70 border border-white/10 rounded-2xl space-y-4 max-w-lg mx-auto">
            {/* Header progress */}
            <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-white/5 pb-3">
                <span className="font-bold text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Question {currentQ + 1} of {questions.length}
                </span>
                <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-[10px] text-neutral-300">
                    Score: {score}
                </span>
            </div>

            {/* Question prompt */}
            <p className="text-sm font-semibold text-white leading-relaxed">{q.question}</p>

            {/* Options */}
            <div className="space-y-2">
                {q.options.map((option, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === q.correctIndex;
                    let style = "bg-white/[0.03] border-white/10 text-neutral-200 hover:bg-white/[0.06]";

                    if (selectedAnswer !== null) {
                        if (isCorrect) {
                            style = "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold";
                        } else if (isSelected) {
                            style = "bg-red-500/20 border-red-500/40 text-red-300";
                        } else {
                            style = "bg-white/[0.01] border-white/5 text-neutral-500 opacity-60";
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleSelectOption(idx)}
                            disabled={selectedAnswer !== null}
                            className={cn("w-full p-3.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between", style)}
                        >
                            <span>{option}</span>
                            {selectedAnswer !== null && (
                                <>
                                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                                    {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                                </>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Explanation box */}
            {showExplanation && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 space-y-1 animate-in fade-in duration-200">
                    <p className="font-bold text-purple-400">Explanation:</p>
                    <p className="leading-relaxed">{q.explanation}</p>
                </div>
            )}

            {/* Next Question button */}
            {selectedAnswer !== null && (
                <Button onClick={handleNext} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl h-10">
                    {currentQ < questions.length - 1 ? "Next Question" : "See Final Score"} <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            )}
        </div>
    );
}
