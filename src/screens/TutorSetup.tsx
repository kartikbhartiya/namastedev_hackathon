"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    ArrowLeft,
    ArrowRight,
    Sparkles,
    Check,
    Bot,
    Palette,
    Brain,
    Heart,
    Zap,
    GraduationCap,
} from "lucide-react";
import {
    TutorProfile,
    DEFAULT_TUTOR_PROFILE,
    TONE_OPTIONS,
    MOTIVATION_OPTIONS,
    PACE_OPTIONS,
    STYLE_OPTIONS,
    INTEREST_OPTIONS,
    CHALLENGE_OPTIONS,
    DOMAIN_OPTIONS,
} from "@/lib/aiTutor";

// ——— Step Components ———

function StepName({
    tutorName,
    setTutorName,
}: {
    tutorName: string;
    setTutorName: (v: string) => void;
}) {
    return (
        <div className="space-y-8 text-center">
            <div className="relative mx-auto w-28 h-28 rounded-full bg-gradient-to-br from-neutral-600 via-neutral-500 to-neutral-700 flex items-center justify-center shadow-[0_0_60px_rgba(115,115,115,0.3)]">
                <Bot className="w-14 h-14 text-white" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-background">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Name Your AI Tutor
                </h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                    Give your personal AI tutor a name. This will be your learning companion throughout your journey.
                </p>
            </div>
            <div className="max-w-xs mx-auto">
                <Input
                    value={tutorName}
                    onChange={(e) => setTutorName(e.target.value)}
                    placeholder="e.g. Aria, Nova, Atlas..."
                    className="text-center text-lg h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-neutral-500 focus:ring-neutral-500/20"
                    maxLength={20}
                    autoFocus
                />
                <p className="text-xs text-muted-foreground mt-2">
                    {tutorName ? `"Hi, I'm ${tutorName}! Let's learn together."` : "Choose a name to get started"}
                </p>
            </div>
        </div>
    );
}

function OptionCard({
    selected,
    onClick,
    emoji,
    label,
    desc,
}: {
    selected: boolean;
    onClick: () => void;
    emoji: string;
    label: string;
    desc?: string;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "relative w-full p-4 rounded-xl border text-left transition-all duration-200",
                "hover:scale-[1.02] hover:shadow-lg",
                selected
                    ? "bg-neutral-500/15 border-neutral-500/50 shadow-[0_0_20px_rgba(115,115,115,0.15)]"
                    : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
            )}
        >
            {selected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-neutral-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                </div>
            )}
            <div className="flex items-start gap-3">
                <span className="text-2xl">{emoji}</span>
                <div>
                    <p className="font-semibold text-white text-sm">{label}</p>
                    {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
                </div>
            </div>
        </button>
    );
}

function StepToneMotivation({
    tone,
    setTone,
    motivation,
    setMotivation,
}: {
    tone: string;
    setTone: (v: string) => void;
    motivation: string;
    setMotivation: (v: string) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Personality & Motivation
                </h2>
                <p className="text-muted-foreground text-sm">How should your tutor talk to you?</p>
            </div>
            <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-3.5 h-3.5" /> Preferred Tone
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {TONE_OPTIONS.map((opt) => (
                        <OptionCard
                            key={opt.value}
                            selected={tone === opt.value}
                            onClick={() => setTone(opt.value)}
                            emoji={opt.emoji}
                            label={opt.label}
                            desc={opt.desc}
                        />
                    ))}
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5" /> Motivation Style
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {MOTIVATION_OPTIONS.map((opt) => (
                        <OptionCard
                            key={opt.value}
                            selected={motivation === opt.value}
                            onClick={() => setMotivation(opt.value)}
                            emoji={opt.emoji}
                            label={opt.label}
                            desc={opt.desc}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function StepPaceStyle({
    pace,
    setPace,
    style,
    setStyle,
}: {
    pace: string;
    setPace: (v: string) => void;
    style: string;
    setStyle: (v: string) => void;
}) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Learning Preferences
                </h2>
                <p className="text-muted-foreground text-sm">How do you learn best?</p>
            </div>
            <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" /> Learning Pace
                </h3>
                <div className="grid grid-cols-1 gap-2">
                    {PACE_OPTIONS.map((opt) => (
                        <OptionCard
                            key={opt.value}
                            selected={pace === opt.value}
                            onClick={() => setPace(opt.value)}
                            emoji={opt.emoji}
                            label={opt.label}
                            desc={opt.desc}
                        />
                    ))}
                </div>
            </div>
            <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5" /> Explanation Style
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    {STYLE_OPTIONS.map((opt) => (
                        <OptionCard
                            key={opt.value}
                            selected={style === opt.value}
                            onClick={() => setStyle(opt.value)}
                            emoji={opt.emoji}
                            label={opt.label}
                            desc={opt.desc}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function StepInterests({
    selected,
    setSelected,
}: {
    selected: string[];
    setSelected: (v: string[]) => void;
}) {
    const toggle = (val: string) => {
        setSelected(
            selected.includes(val)
                ? selected.filter((s) => s !== val)
                : [...selected, val]
        );
    };
    return (
        <div className="space-y-6">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Your Interests
                </h2>
                <p className="text-muted-foreground text-sm">
                    Select topics you enjoy — your tutor will use these for analogies and examples.
                </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {INTEREST_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => toggle(opt.value)}
                        className={cn(
                            "p-3 rounded-xl border transition-all duration-200 flex items-center gap-3",
                            "hover:scale-[1.02]",
                            selected.includes(opt.value)
                                ? "bg-neutral-500/15 border-neutral-500/50"
                                : "bg-white/[0.03] border-white/10 hover:border-white/20"
                        )}
                    >
                        {selected.includes(opt.value) && (
                            <div className="w-5 h-5 bg-neutral-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-white" />
                            </div>
                        )}
                        <span className="text-xl">{opt.emoji}</span>
                        <span className="text-sm font-medium text-white">{opt.value}</span>
                    </button>
                ))}
            </div>
            <p className="text-xs text-center text-muted-foreground">
                Select as many as you like • You can change these later
            </p>
        </div>
    );
}

function StepChallenges({
    selected,
    setSelected,
}: {
    selected: string[];
    setSelected: (v: string[]) => void;
}) {
    const toggle = (val: string) => {
        setSelected(
            selected.includes(val)
                ? selected.filter((s) => s !== val)
                : [...selected, val]
        );
    };
    return (
        <div className="space-y-6">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Learning Challenges
                </h2>
                <p className="text-muted-foreground text-sm">
                    Your tutor will adapt to help with these — no judgement, just support.
                </p>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-1">
                {CHALLENGE_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => toggle(opt.value)}
                        className={cn(
                            "p-3 rounded-xl border transition-all duration-200 flex items-center gap-3 text-left",
                            "hover:scale-[1.01]",
                            selected.includes(opt.value)
                                ? "bg-neutral-500/15 border-neutral-500/50"
                                : "bg-white/[0.03] border-white/10 hover:border-white/20"
                        )}
                    >
                        {selected.includes(opt.value) ? (
                            <div className="w-6 h-6 bg-neutral-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full border border-white/20 flex-shrink-0" />
                        )}
                        <span className="text-xl">{opt.emoji}</span>
                        <div>
                            <p className="text-sm font-medium text-white">{opt.value}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function StepDomain({
    domain,
    setDomain,
    exam,
    setExam,
}: {
    domain: string;
    setDomain: (v: string) => void;
    exam: string;
    setExam: (v: string) => void;
}) {
    const selectedDomainData = DOMAIN_OPTIONS.find((d) => d.value === domain);

    return (
        <div className="space-y-6">
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Target Exam & Course
                </h2>
                <p className="text-muted-foreground text-sm">
                    Select your education domain so your AI Tutor can adapt to its syllabus.
                </p>
            </div>

            <div className="space-y-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" /> Education Domain
                </h3>
                <div className="grid grid-cols-2 gap-2 h-36 overflow-y-auto pr-2 custom-scrollbar">
                    {DOMAIN_OPTIONS.map((opt) => (
                        <OptionCard
                            key={opt.value}
                            selected={domain === opt.value}
                            onClick={() => {
                                setDomain(opt.value);
                                setExam("");
                            }}
                            emoji={opt.emoji}
                            label={opt.label}
                        />
                    ))}
                </div>
            </div>

            {domain && selectedDomainData && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                >
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Check className="w-3.5 h-3.5" /> Select Class/Exam
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {selectedDomainData.exams.map((ex) => (
                            <button
                                key={ex}
                                onClick={() => setExam(ex)}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-sm transition-all duration-200 border",
                                    exam === ex
                                        ? "bg-neutral-500 text-white border-neutral-500 shadow-lg shadow-neutral-500/25"
                                        : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {ex}
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// ——— Main Page ———

const STEPS = [
    { icon: Bot, label: "Name" },
    { icon: GraduationCap, label: "Domain" },
    { icon: Palette, label: "Personality" },
    { icon: Brain, label: "Learning" },
    { icon: Heart, label: "Interests" },
    { icon: Zap, label: "Challenges" },
];

export default function TutorSetup() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Profile fields
    const [tutorName, setTutorName] = useState(DEFAULT_TUTOR_PROFILE.tutor_name);
    const [tone, setTone] = useState(DEFAULT_TUTOR_PROFILE.tone);
    const [motivation, setMotivation] = useState(DEFAULT_TUTOR_PROFILE.motivation_style);
    const [pace, setPace] = useState(DEFAULT_TUTOR_PROFILE.learning_pace);
    const [style, setStyle] = useState(DEFAULT_TUTOR_PROFILE.explanation_style);
    const [interests, setInterests] = useState<string[]>([]);
    const [challenges, setChallenges] = useState<string[]>([]);
    const [domain, setDomain] = useState<string>("School Education");
    const [exam, setExam] = useState<string>("");

    useEffect(() => {
        if (!user) return;
        db.tutorProfiles.get(user.id).then((profile) => {
            if (profile) {
                setTutorName(profile.tutor_name);
                setTone(profile.tone);
                setMotivation(profile.motivation_style);
                setPace(profile.learning_pace);
                setStyle(profile.explanation_style);
                setInterests(profile.interests || []);
                setChallenges(profile.learning_challenges || []);
                if (profile.education_domain) setDomain(profile.education_domain);
                if (profile.target_exam) setExam(profile.target_exam);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        if (!tutorName.trim()) {
            toast.error("Please give your tutor a name!");
            setStep(0);
            return;
        }

        setSaving(true);
        try {
            const profileData: Partial<TutorProfile> = {
                tutor_name: tutorName.trim(),
                tone,
                motivation_style: motivation,
                learning_pace: pace,
                explanation_style: style,
                interests,
                learning_challenges: challenges,
                education_domain: domain,
                target_exam: exam,
            };
            await db.tutorProfiles.upsert(user.id, profileData);
            toast.success(`${tutorName} is ready to teach! 🎉`);
            router.push("/ai-tutor");
        } catch (err: any) {
            console.error("Save tutor profile error:", err);
            toast.error(err.message || "Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const canProceed = step !== 1 || !!exam;

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-neutral-800 border-t-neutral-400 rounded-full animate-spin" />
                    <p className="text-muted-foreground text-sm">Synchronizing preferences...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden select-none">
            {/* Background noise and radial shadows */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/30 via-black to-black z-0 pointer-events-none" />
            
            {/* Header / Nav */}
            <div className="relative z-10 w-full max-w-md mx-auto pt-8 px-4 flex items-center justify-between">
                <button
                    onClick={() => router.push("/")}
                    className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-1.5">
                    {STEPS.map((s, idx) => (
                        <div
                            key={s.label}
                            className={cn(
                                "h-1 rounded-full transition-all duration-300",
                                idx === step
                                    ? "w-6 bg-white"
                                    : idx < step
                                    ? "w-2 bg-white/40"
                                    : "w-2 bg-white/10"
                            )}
                        />
                    ))}
                </div>
                <div className="text-xs text-muted-foreground w-16 text-right">
                    {step + 1}/{STEPS.length}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-24">
                <div className="w-full max-w-md">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            transition={{ duration: 0.25 }}
                        >
                            {step === 0 && (
                                <StepName tutorName={tutorName} setTutorName={setTutorName} />
                            )}
                            {step === 1 && (
                                <StepDomain
                                    domain={domain}
                                    setDomain={setDomain}
                                    exam={exam}
                                    setExam={setExam}
                                />
                            )}
                            {step === 2 && (
                                <StepToneMotivation
                                    tone={tone}
                                    setTone={setTone}
                                    motivation={motivation}
                                    setMotivation={setMotivation}
                                />
                            )}
                            {step === 3 && (
                                <StepPaceStyle
                                    pace={pace}
                                    setPace={setPace}
                                    style={style}
                                    setStyle={setStyle}
                                />
                            )}
                            {step === 4 && (
                                <StepInterests selected={interests} setSelected={setInterests} />
                            )}
                            {step === 5 && (
                                <StepChallenges selected={challenges} setSelected={setChallenges} />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                <div className="max-w-md mx-auto flex gap-3">
                    {step > 0 && (
                        <Button
                            variant="ghost"
                            onClick={() => setStep((s) => s - 1)}
                            className="text-white/60 hover:text-white hover:bg-white/10"
                        >
                            Back
                        </Button>
                    )}
                    {step < STEPS.length - 1 ? (
                        <Button
                            onClick={() => setStep((s) => s + 1)}
                            disabled={!canProceed}
                            className="flex-1 bg-white hover:bg-neutral-200 text-black shadow-lg h-11"
                        >
                            Continue <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSave}
                            disabled={saving || !canProceed}
                            className="flex-1 bg-white hover:bg-neutral-200 text-black shadow-lg h-11"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-neutral-800 border-t-white rounded-full animate-spin mr-2" />
                                    Setting Up...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" /> Launch {tutorName || "Tutor"}
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
