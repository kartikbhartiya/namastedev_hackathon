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
    BookOpen, Target, Beaker, FileCheck, RotateCcw,
    Circle, CheckCircle2, Sparkles, Loader2, Clock,
} from "lucide-react";
import type { StudyPlanDay, TutorProfile, StudentContext } from "@/lib/aiTutor";
import { generateStudyPlan } from "@/lib/aiTutor";

interface StudyPlanCardProps {
    plan: StudyPlanDay[];
    onGenerate?: (plan: StudyPlanDay[]) => void;
    tutorProfile?: TutorProfile | null;
    studentContext?: StudentContext;
    title?: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    concept: { icon: <BookOpen className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    practice: { icon: <Target className="w-4 h-4" />, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    simulation: { icon: <Beaker className="w-4 h-4" />, color: "text-neutral-400", bg: "bg-neutral-500/10 border-neutral-500/20" },
    test: { icon: <FileCheck className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    revision: { icon: <RotateCcw className="w-4 h-4" />, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
};

export function StudyPlanCard({ plan, onGenerate, tutorProfile, studentContext, title }: StudyPlanCardProps) {
    const [topic, setTopic] = useState("");
    const [days, setDays] = useState("5");
    const [dailyHours, setDailyHours] = useState("2");
    const [loading, setLoading] = useState(false);
    const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());

    const handleGenerate = async () => {
        if (!topic.trim() || !tutorProfile || !studentContext) return;
        setLoading(true);
        try {
            const enrichedStudent: StudentContext = {
                ...studentContext,
                weeklyStudyHours: `${Number(dailyHours) * 7}h/week`,
            };
            const result = await generateStudyPlan(
                `${topic} (${dailyHours} hours/day available)`,
                Number(days),
                tutorProfile,
                enrichedStudent
            );
            setCheckedTasks(new Set());
            onGenerate?.(result);
        } catch (err) {
            console.error("Study plan generation error:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = (key: string) => {
        setCheckedTasks((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    if (!plan.length) {
        return (
            <div className="space-y-4">
                <div className="text-center space-y-1">
                    <h3 className="text-lg font-bold text-foreground">AI Study Plan Generator</h3>
                    <p className="text-xs text-muted-foreground">
                        Create a personalized study plan tailored to your learning style
                    </p>
                </div>

                <div className="space-y-3 p-4 bg-foreground/[0.02] border border-border rounded-xl">
                    <div className="space-y-1.5">
                        <label className="text-[10px] text-muted-foreground uppercase tracking-wider">What do you want to study?</label>
                        <Input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. Classical Physics, Integration, Algorithms..."
                            className="bg-foreground/[0.03] border-border text-foreground text-sm placeholder:text-foreground/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Duration
                            </label>
                            <Select value={days} onValueChange={setDays}>
                                <SelectTrigger className="h-9 text-xs bg-foreground/[0.03] border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border z-50">
                                    <SelectItem value="3" className="text-xs">3 days</SelectItem>
                                    <SelectItem value="5" className="text-xs">5 days</SelectItem>
                                    <SelectItem value="7" className="text-xs">7 days (1 week)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Daily hours
                            </label>
                            <Select value={dailyHours} onValueChange={setDailyHours}>
                                <SelectTrigger className="h-9 text-xs bg-foreground/[0.03] border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-background border border-border z-50">
                                    <SelectItem value="1" className="text-xs">1 hour/day</SelectItem>
                                    <SelectItem value="2" className="text-xs">2 hours/day</SelectItem>
                                    <SelectItem value="3" className="text-xs">3 hours/day</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {tutorProfile && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-500/10 border border-neutral-500/20 text-neutral-300">
                                {tutorProfile.learning_pace} pace
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-500/10 border border-neutral-500/20 text-neutral-300">
                                {tutorProfile.explanation_style}
                            </span>
                        </div>
                    )}

                    <Button
                        onClick={handleGenerate}
                        disabled={!topic.trim() || loading || !tutorProfile}
                        className="w-full bg-white hover:bg-neutral-200 text-black h-10"
                    >
                        {loading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Plan...</>
                        ) : (
                            <><Sparkles className="w-4 h-4 mr-2" /> Generate {days}-Day Plan</>
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    const totalTasks = plan.reduce((sum, d) => sum + d.tasks.length, 0);
    const completedTasks = checkedTasks.size;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-neutral-400" />
                    {title || "AI Study Plan"}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                        {completedTasks}/{totalTasks} tasks
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-neutral-400 hover:text-neutral-300 h-7 px-2"
                        onClick={() => onGenerate?.([])}
                    >
                        New Plan
                    </Button>
                </div>
            </div>

            <div className="w-full h-1.5 bg-foreground/[0.06] rounded-full overflow-hidden">
                <div
                    className="h-full bg-white transition-all duration-300"
                    style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }}
                />
            </div>

            <div className="space-y-2">
                {plan.map((day) => {
                    const config = TYPE_CONFIG[day.type] || TYPE_CONFIG.concept;
                    return (
                        <div
                            key={day.day}
                            className={cn("p-3 rounded-xl border transition-all hover:scale-[1.005]", config.bg)}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <div className={cn("flex-shrink-0", config.color)}>
                                    {config.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-foreground">Day {day.day}: {day.title}</p>
                                    <p className={cn("text-[10px] capitalize", config.color)}>{day.type}</p>
                                </div>
                            </div>
                            <ul className="space-y-1 ml-6">
                                {day.tasks.map((task, i) => {
                                    const taskKey = `${day.day}-${i}`;
                                    const checked = checkedTasks.has(taskKey);
                                    return (
                                        <li
                                            key={i}
                                            onClick={() => toggleTask(taskKey)}
                                            className={cn(
                                                "flex items-start gap-2 text-xs cursor-pointer transition-all select-none",
                                                checked ? "text-foreground/30 line-through" : "text-foreground/70 hover:text-foreground"
                                            )}
                                        >
                                            {checked ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-green-400" />
                                            ) : (
                                                <Circle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-foreground/20" />
                                            )}
                                            {task}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
