"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Download,
  Sparkles,
  FileText,
  Code2,
  Shield,
  Target,
  BookOpen,
  Loader2,
  Check,
  X,
  RotateCcw,
  Lightbulb,
  AlertTriangle,
  Palette,
} from "lucide-react";
import {
  SIH_THEMES,
  SIH_COLOR_THEMES,
  TECH_STACK_OPTIONS,
  buildSIHPromptMessages,
  parseSIHResponse,
  buildGraderMessages,
  parseGraderResponse,
  buildEnhancerMessages,
  parseEnhancerResponse,
  buildCopilotMessages,
  parseCopilotResponse,
  type SIHUserInput,
  type SIHSlideContent,
  type SIHColorTheme,
  type SIHRubricGrade,
  type SIHEnhancedInput,
} from "@/lib/sihPptGenerator";
import { buildSIHPresentation } from "@/lib/sihPptBuilder";
import { SIHSlidePreview } from "@/components/sih-ppt/SIHSlidePreview";
import { SlideCopilot } from "@/components/sih-ppt/SlideCopilot";
import { getProvider, loadProviderConfig } from "@/lib/aiProvider";

import { useRecentPitches, type SavedSIHPitch } from "@/lib/useRecentPitches";

// ——— Step configuration ———

const STEPS = [
  { label: "Basic Details", icon: FileText, description: "Team & problem info" },
  { label: "Solution", icon: Lightbulb, description: "Describe your idea" },
  { label: "Tech Stack", icon: Code2, description: "Technical approach" },
  { label: "Feasibility", icon: Shield, description: "Challenges & impact" },
  { label: "Generate", icon: Sparkles, description: "Preview & download" },
];

// ——— Component ———

interface SIHPptMakerProps {
  initialData?: SavedSIHPitch | null;
  onBackToWorkspace?: () => void;
}

export function SIHPptMaker({ initialData, onBackToWorkspace }: SIHPptMakerProps) {
  const router = useRouter();
  const { savePitch } = useRecentPitches();
  
  const [pitchId, setPitchId] = useState<string | undefined>(initialData?.id);
  const [currentStep, setCurrentStep] = useState(initialData ? 4 : 0);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<SIHSlideContent | null>(initialData?.generatedContent || null);
  const [activePreviewSlide, setActivePreviewSlide] = useState(0);
  const [selectedTheme, setSelectedTheme] = useState<string>(initialData?.formData?.theme || "sih-blue");
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [grading, setGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<SIHRubricGrade | null>(initialData?.gradeResult || null);
  const [enhancing, setEnhancing] = useState(false);
  const [copilotEditing, setCopilotEditing] = useState(false);

  // Form state
  const [formData, setFormData] = useState<SIHUserInput>(
    initialData?.formData || {
      problemStatementId: "",
      problemStatementTitle: "",
      theme: "",
      psCategory: "Software",
      teamId: "",
      teamName: "",
      solutionDescription: "",
      howItAddressesProblem: "",
      whatMakesItInnovative: "",
      techStack: [],
      architectureDescription: "",
      hardwareComponents: "",
      challenges: "",
      strategies: "",
      targetAudience: "",
      benefits: "",
      references: "",
    }
  );

  // Helper for auto-saving state
  const triggerAutoSave = useCallback((
    newForm = formData,
    newContent = generatedContent,
    newGrade = gradeResult
  ) => {
    const id = savePitch({
      id: pitchId,
      formData: newForm,
      generatedContent: newContent,
      gradeResult: newGrade,
    });
    if (!pitchId) setPitchId(id);
  }, [formData, generatedContent, gradeResult, pitchId, savePitch]);


  const updateField = useCallback(
    (field: keyof SIHUserInput, value: string | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const toggleTechStack = useCallback((tech: string) => {
    setFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.includes(tech)
        ? prev.techStack.filter((t) => t !== tech)
        : [...prev.techStack, tech],
    }));
  }, []);

  // ——— Validation ———

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!(
          formData.problemStatementId.trim() &&
          formData.problemStatementTitle.trim() &&
          formData.theme &&
          formData.teamId.trim() &&
          formData.teamName.trim()
        );
      case 1:
        return !!(
          formData.solutionDescription.trim() &&
          formData.howItAddressesProblem.trim()
        );
      case 2:
        return formData.techStack.length >= 2;
      case 3:
        return !!(
          formData.targetAudience.trim() &&
          formData.benefits.trim()
        );
      default:
        return true;
    }
  };

  // ——— Rubric Grading & Enhancing ———

  const gradeProposal = async () => {
    setGrading(true);
    setError(null);
    try {
      const config = await loadProviderConfig();
      const providerName = config.activeProvider;
      const providerConfig = config.providerConfigs[providerName];
      const provider = getProvider(providerName);
      if (!provider || !providerConfig?.apiKey) throw new Error("AI provider not configured.");

      const messages = buildGraderMessages(formData);
      const result = await provider.generateCompletion(messages, providerConfig.model, 0.7, providerConfig.apiKey);
      const parsed = parseGraderResponse(result.content);
      if (!parsed) throw new Error("Failed to parse grading response.");
      setGradeResult(parsed);
      triggerAutoSave(formData, generatedContent, parsed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setGrading(false);
    }
  };

  const enhanceProposal = async () => {
    setEnhancing(true);
    setError(null);
    try {
      const config = await loadProviderConfig();
      const providerName = config.activeProvider;
      const providerConfig = config.providerConfigs[providerName];
      const provider = getProvider(providerName);
      if (!provider || !providerConfig?.apiKey) throw new Error("AI provider not configured.");

      const messages = buildEnhancerMessages(formData);
      const result = await provider.generateCompletion(messages, providerConfig.model, 0.7, providerConfig.apiKey);
      const parsed = parseEnhancerResponse(result.content);
      if (!parsed) throw new Error("Failed to parse enhancement response.");
      
      setFormData(prev => {
        const newForm = { ...prev, ...parsed };
        setGradeResult(null);
        triggerAutoSave(newForm, generatedContent, null);
        return newForm;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setEnhancing(false);
    }
  };

  // ——— Copilot Slide Editing ———

  const handleCopilotRequest = async (request: string) => {
    if (!generatedContent) return;
    setCopilotEditing(true);
    setError(null);
    try {
      const config = await loadProviderConfig();
      const providerName = config.activeProvider;
      const providerConfig = config.providerConfigs[providerName];
      const provider = getProvider(providerName);
      if (!provider || !providerConfig?.apiKey) throw new Error("AI provider not configured.");

      const slideKeys: (keyof SIHSlideContent)[] = [
        "titleSlide", "ideaSlide", "technicalSlide", "feasibilitySlide", "impactSlide", "referencesSlide"
      ];
      const activeKey = slideKeys[activePreviewSlide];
      const currentJson = generatedContent[activeKey];

      const messages = buildCopilotMessages(currentJson, request);
      const result = await provider.generateCompletion(messages, providerConfig.model, 0.7, providerConfig.apiKey);
      const parsed = parseCopilotResponse(result.content);
      
      if (!parsed) throw new Error("Failed to parse AI Copilot response.");

      const newContent = (prev: SIHSlideContent | null) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          [activeKey]: {
            ...prev[activeKey],
            ...parsed
          }
        };
        triggerAutoSave(formData, updated, gradeResult);
        return updated;
      };
      
      setGeneratedContent(newContent);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred during Copilot editing");
    } finally {
      setCopilotEditing(false);
    }
  };

  // ——— AI Generation ———

  const generatePresentation = async () => {
    setGenerating(true);
    setError(null);

    try {
      const config = await loadProviderConfig();
      const providerName = config.activeProvider;
      const providerConfig = config.providerConfigs[providerName];
      const provider = getProvider(providerName);

      if (!provider) {
        throw new Error(
          `AI provider "${providerName}" not found. Please configure it in settings.`
        );
      }

      if (!providerConfig?.apiKey) {
        throw new Error(
          `No API key configured for ${providerName}. Please add it in your .env file.`
        );
      }

      const messages = buildSIHPromptMessages(formData);

      const result = await provider.generateCompletion(
        messages,
        providerConfig.model,
        0.7,
        providerConfig.apiKey
      );

      const parsed = parseSIHResponse(result.content);

      if (!parsed) {
        throw new Error(
          "Failed to parse AI response. Please try again."
        );
      }

      setGeneratedContent(parsed);
      setActivePreviewSlide(0);
      triggerAutoSave(formData, parsed, gradeResult);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  // ——— Download ———

  const downloadPresentation = async () => {
    if (!generatedContent) return;
    setDownloading(true);
    try {
      await buildSIHPresentation(generatedContent, selectedTheme);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to generate PPTX file. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const currentTheme =
    SIH_COLOR_THEMES.find((t) => t.name === selectedTheme) ||
    SIH_COLOR_THEMES[0];

  // ——— Render ———

  return (
    <div className="min-h-screen bg-[#040404] text-white">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24">
        
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
          <button
            onClick={() => onBackToWorkspace ? onBackToWorkspace() : router.push("/")}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Workspace</span>
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#ff6c37]" />
            <span className="text-sm font-bold tracking-tight">
              SIH PPT Maker
            </span>
          </div>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>

        {/* SIH Guidelines Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-xl bg-[#ff6c37]/5 border border-[#ff6c37]/20"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#ff6c37] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-[#ff6c37] mb-1">
                SIH 2026 Official Guidelines
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Max <span className="text-white font-semibold">6 slides</span>{" "}
                (including title) • Use{" "}
                <span className="text-white font-semibold">
                  bullet points
                </span>
                , avoid paragraphs • Keep explanations{" "}
                <span className="text-white font-semibold">
                  precise & concise
                </span>{" "}
                • Idea must be{" "}
                <span className="text-white font-semibold">
                  unique and novel
                </span>{" "}
                • Save as PDF for portal upload
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Stepper */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-[2px] bg-white/5" />
            <div
              className="absolute top-5 left-0 h-[2px] bg-[#ff6c37] transition-all duration-500"
              style={{
                width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
              }}
            />

            {STEPS.map((step, i) => {
              const isCompleted = i < currentStep;
              const isActive = i === currentStep;
              const Icon = step.icon;

              return (
                <button
                  key={i}
                  onClick={() => {
                    if (i < currentStep || (i === currentStep + 1 && validateStep(currentStep))) {
                      setCurrentStep(i);
                    }
                  }}
                  className="relative z-10 flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-[#ff6c37] text-black"
                        : isActive
                          ? "bg-[#ff6c37]/20 text-[#ff6c37] ring-2 ring-[#ff6c37]/50"
                          : "bg-[#0b0b0b] text-neutral-500 border border-white/10"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-center">
                    <p
                      className={`text-[11px] font-semibold transition-colors ${
                        isActive
                          ? "text-white"
                          : isCompleted
                            ? "text-[#ff6c37]"
                            : "text-neutral-500"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[9px] text-neutral-600 hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === 0 && (
              <StepBasicDetails
                formData={formData}
                updateField={updateField}
              />
            )}
            {currentStep === 1 && (
              <StepSolution
                formData={formData}
                updateField={updateField}
              />
            )}
            {currentStep === 2 && (
              <StepTechStack
                formData={formData}
                updateField={updateField}
                toggleTechStack={toggleTechStack}
              />
            )}
            {currentStep === 3 && (
              <StepFeasibility
                formData={formData}
                updateField={updateField}
              />
            )}
            {currentStep === 4 && (
              <StepGenerate
                formData={formData}
                generating={generating}
                generatedContent={generatedContent}
                error={error}
                selectedTheme={selectedTheme}
                currentTheme={currentTheme}
                activePreviewSlide={activePreviewSlide}
                downloading={downloading}
                onGenerate={generatePresentation}
                onRegenerate={() => {
                  if (confirm("Are you sure you want to regenerate? Your current presentation will be overwritten.")) {
                    setGeneratedContent(null);
                    generatePresentation();
                  }
                }}
                onThemeChange={(theme) => {
                  setSelectedTheme(theme);
                  setFormData(prev => {
                    const newForm = { ...prev, theme };
                    triggerAutoSave(newForm, generatedContent, gradeResult);
                    return newForm;
                  });
                }}
                onSlideChange={setActivePreviewSlide}
                onDownload={downloadPresentation}
                grading={grading}
                gradeResult={gradeResult}
                enhancing={enhancing}
                onGrade={gradeProposal}
                onEnhance={enhanceProposal}
                copilotEditing={copilotEditing}
                onCopilotRequest={handleCopilotRequest}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-10">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="h-11 px-5 rounded-lg bg-[#0b0b0b] border border-white/10 text-sm font-medium text-neutral-300 hover:text-white hover:border-white/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button
              onClick={() => {
                if (validateStep(currentStep)) {
                  setCurrentStep(currentStep + 1);
                }
              }}
              disabled={!validateStep(currentStep)}
              className="h-11 px-6 rounded-lg bg-[#ff6c37] hover:bg-[#ff8454] text-black font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {currentStep === 3 ? "Review & Generate" : "Continue"}{" "}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

// ——— Step Components ———

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-[#ff6c37]">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-4 rounded-lg bg-[#0b0b0b] border border-white/10 text-white text-sm placeholder:text-neutral-600 focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/20 outline-none transition-all"
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  required,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  required?: boolean;
  rows?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-[#ff6c37]">*</span>}
      </label>
      {hint && (
        <p className="text-[10px] text-neutral-500">{hint}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 rounded-lg bg-[#0b0b0b] border border-white/10 text-white text-sm placeholder:text-neutral-600 focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/20 outline-none transition-all resize-none"
      />
    </div>
  );
}

// Step 1: Basic Details
function StepBasicDetails({
  formData,
  updateField,
}: {
  formData: SIHUserInput;
  updateField: (field: keyof SIHUserInput, value: string | string[]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Basic Details
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Enter your team and problem statement information
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <InputField
          label="Problem Statement ID"
          value={formData.problemStatementId}
          onChange={(v) => updateField("problemStatementId", v)}
          placeholder="e.g., SIH1234"
          required
        />
        <InputField
          label="Team ID"
          value={formData.teamId}
          onChange={(v) => updateField("teamId", v)}
          placeholder="e.g., TEAM001"
          required
        />
      </div>

      <InputField
        label="Problem Statement Title"
        value={formData.problemStatementTitle}
        onChange={(v) => updateField("problemStatementTitle", v)}
        placeholder="e.g., AI-based Traffic Management System"
        required
      />

      <InputField
        label="Team Name (as registered on portal)"
        value={formData.teamName}
        onChange={(v) => updateField("teamName", v)}
        placeholder="e.g., Team Phoenix"
        required
      />

      {/* Theme Dropdown */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Theme <span className="text-[#ff6c37]">*</span>
        </label>
        <select
          value={formData.theme}
          onChange={(e) => updateField("theme", e.target.value)}
          className="w-full h-11 px-4 rounded-lg bg-[#0b0b0b] border border-white/10 text-white text-sm focus:border-[#ff6c37]/50 focus:ring-1 focus:ring-[#ff6c37]/20 outline-none transition-all appearance-none cursor-pointer"
        >
          <option value="" className="bg-[#0b0b0b]">
            Select a theme...
          </option>
          {SIH_THEMES.map((theme) => (
            <option key={theme} value={theme} className="bg-[#0b0b0b]">
              {theme}
            </option>
          ))}
        </select>
      </div>

      {/* PS Category Toggle */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          PS Category
        </label>
        <div className="flex gap-3">
          {(["Software", "Hardware"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => updateField("psCategory", cat)}
              className={`h-10 px-6 rounded-lg text-sm font-semibold transition-all ${
                formData.psCategory === cat
                  ? "bg-[#ff6c37] text-black"
                  : "bg-[#0b0b0b] border border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 2: Solution
function StepSolution({
  formData,
  updateField,
}: {
  formData: SIHUserInput;
  updateField: (field: keyof SIHUserInput, value: string | string[]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Solution Description
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Describe your innovative solution — the AI will structure it
          professionally
        </p>
      </div>

      <TextareaField
        label="Describe your Idea / Solution / Prototype"
        value={formData.solutionDescription}
        onChange={(v) => updateField("solutionDescription", v)}
        placeholder="Explain your solution in detail. What does it do? How does it work? What are the key features?"
        required
        rows={5}
        hint="Be detailed — AI will extract and organize this into concise bullet points"
      />

      <TextareaField
        label="How does it address the problem?"
        value={formData.howItAddressesProblem}
        onChange={(v) => updateField("howItAddressesProblem", v)}
        placeholder="Explain the direct connection between your solution and the problem statement..."
        required
        rows={4}
      />

      <TextareaField
        label="What makes it innovative / unique?"
        value={formData.whatMakesItInnovative}
        onChange={(v) => updateField("whatMakesItInnovative", v)}
        placeholder="What differentiates your solution from existing ones? Any novel approaches?"
        rows={3}
      />
    </div>
  );
}

// Step 3: Tech Stack
function StepTechStack({
  formData,
  updateField,
  toggleTechStack,
}: {
  formData: SIHUserInput;
  updateField: (field: keyof SIHUserInput, value: string | string[]) => void;
  toggleTechStack: (tech: string) => void;
}) {
  const categories = [
    { label: "Frontend", techs: TECH_STACK_OPTIONS.slice(0, 8) },
    { label: "Backend", techs: TECH_STACK_OPTIONS.slice(8, 16) },
    { label: "AI / ML", techs: TECH_STACK_OPTIONS.slice(16, 23) },
    { label: "Database", techs: TECH_STACK_OPTIONS.slice(23, 30) },
    { label: "Cloud & DevOps", techs: TECH_STACK_OPTIONS.slice(30, 36) },
    { label: "Blockchain", techs: TECH_STACK_OPTIONS.slice(36, 40) },
    { label: "IoT / Hardware", techs: TECH_STACK_OPTIONS.slice(40, 45) },
    { label: "Languages & Other", techs: TECH_STACK_OPTIONS.slice(45) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Technical Stack
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Select technologies and describe your architecture (min 2
          technologies)
        </p>
      </div>

      {/* Selected count */}
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-bold ${
            formData.techStack.length >= 2
              ? "text-green-400"
              : "text-[#ff6c37]"
          }`}
        >
          {formData.techStack.length} selected
        </span>
        {formData.techStack.length < 2 && (
          <span className="text-xs text-neutral-500">
            (select at least 2)
          </span>
        )}
      </div>

      {/* Tech categories */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <div key={cat.label}>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">
              {cat.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {cat.techs.map((tech) => {
                const selected = formData.techStack.includes(tech);
                return (
                  <button
                    key={tech}
                    onClick={() => toggleTechStack(tech)}
                    className={`h-8 px-3 rounded-md text-xs font-medium transition-all ${
                      selected
                        ? "bg-[#ff6c37] text-black"
                        : "bg-[#0b0b0b] border border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 inline mr-1" />}
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <TextareaField
        label="Architecture / Methodology Description"
        value={formData.architectureDescription}
        onChange={(v) => updateField("architectureDescription", v)}
        placeholder="Describe your system architecture, data flow, or implementation methodology..."
        rows={4}
      />

      {formData.psCategory === "Hardware" && (
        <TextareaField
          label="Hardware Components"
          value={formData.hardwareComponents}
          onChange={(v) => updateField("hardwareComponents", v)}
          placeholder="List any hardware components (sensors, microcontrollers, etc.)..."
          rows={3}
        />
      )}
    </div>
  );
}

// Step 4: Feasibility & Impact
function StepFeasibility({
  formData,
  updateField,
}: {
  formData: SIHUserInput;
  updateField: (field: keyof SIHUserInput, value: string | string[]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Feasibility & Impact
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          Tell us about challenges, impact, and references
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TextareaField
          label="Key Challenges"
          value={formData.challenges}
          onChange={(v) => updateField("challenges", v)}
          placeholder="What challenges do you foresee in implementation?"
          rows={3}
        />
        <TextareaField
          label="Strategies to Overcome"
          value={formData.strategies}
          onChange={(v) => updateField("strategies", v)}
          placeholder="How will you address these challenges?"
          rows={3}
        />
      </div>

      <TextareaField
        label="Target Audience & Impact"
        value={formData.targetAudience}
        onChange={(v) => updateField("targetAudience", v)}
        placeholder="Who benefits from your solution and what's the expected impact?"
        required
        rows={3}
      />

      <TextareaField
        label="Benefits (Social, Economic, Environmental)"
        value={formData.benefits}
        onChange={(v) => updateField("benefits", v)}
        placeholder="Describe the broader benefits of your solution..."
        required
        rows={3}
      />

      <TextareaField
        label="Research References & Links"
        value={formData.references}
        onChange={(v) => updateField("references", v)}
        placeholder="Add research papers, articles, or links that support your idea..."
        rows={3}
        hint="Separate multiple references with new lines"
      />
    </div>
  );
}

// Step 5: Generate & Preview
function StepGenerate({
  formData,
  generating,
  generatedContent,
  error,
  selectedTheme,
  currentTheme,
  activePreviewSlide,
  downloading,
  onGenerate,
  onRegenerate,
  onThemeChange,
  onSlideChange,
  onDownload,
  grading,
  gradeResult,
  enhancing,
  onGrade,
  onEnhance,
  copilotEditing,
  onCopilotRequest,
}: {
  formData: SIHUserInput;
  generating: boolean;
  generatedContent: SIHSlideContent | null;
  error: string | null;
  selectedTheme: string;
  currentTheme: SIHColorTheme;
  activePreviewSlide: number;
  downloading: boolean;
  onGenerate: () => void;
  onRegenerate: () => void;
  onThemeChange: (theme: string) => void;
  onSlideChange: (index: number) => void;
  onDownload: () => void;
  grading: boolean;
  gradeResult: SIHRubricGrade | null;
  enhancing: boolean;
  onGrade: () => void;
  onEnhance: () => void;
  copilotEditing: boolean;
  onCopilotRequest: (request: string) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight">
          Generate & Preview
        </h2>
        <p className="text-sm text-neutral-400 mt-1">
          AI will create your SIH presentation based on your inputs
        </p>
      </div>

      {/* Theme Picker */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#ff6c37]" />
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            Color Theme
          </span>
        </div>
        <div className="flex gap-3">
          {SIH_COLOR_THEMES.map((theme) => (
            <button
              key={theme.name}
              onClick={() => onThemeChange(theme.name)}
              className={`flex items-center gap-2 h-10 px-4 rounded-lg text-xs font-medium transition-all ${
                selectedTheme === theme.name
                  ? "bg-white/10 border-2 border-white/30 text-white"
                  : "bg-[#0b0b0b] border border-white/10 text-neutral-400 hover:border-white/20"
              }`}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: theme.preview }}
              />
              {theme.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary of inputs */}
      {!generatedContent && !generating && (
        <div className="p-5 rounded-xl bg-[#0b0b0b] border border-white/10 space-y-3">
          <h3 className="text-sm font-bold text-neutral-300">
            Input Summary
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-neutral-500">PS ID:</span>{" "}
              <span className="text-white">
                {formData.problemStatementId}
              </span>
            </div>
            <div>
              <span className="text-neutral-500">Team:</span>{" "}
              <span className="text-white">{formData.teamName}</span>
            </div>
            <div>
              <span className="text-neutral-500">Theme:</span>{" "}
              <span className="text-white">{formData.theme}</span>
            </div>
            <div>
              <span className="text-neutral-500">Category:</span>{" "}
              <span className="text-white">
                {formData.psCategory}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-neutral-500">Tech Stack:</span>{" "}
              <span className="text-white">
                {formData.techStack.join(", ")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grading / Review Phase */}
      {!generatedContent && !generating && (
        <div className="space-y-4">
          {!gradeResult && !grading && !enhancing && (
            <button
              onClick={onGrade}
              className="w-full h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 font-bold transition-all flex items-center justify-center gap-2"
            >
              <Target className="w-5 h-5" /> Auto-Grade Pitch via SIH Rubric
            </button>
          )}
          
          {(grading || enhancing) && (
            <div className="p-8 rounded-xl bg-[#0b0b0b] border border-white/10 flex flex-col items-center justify-center gap-4 text-center">
              <Loader2 className="w-8 h-8 text-[#ff6c37] animate-spin" />
              <div>
                <h3 className="text-sm font-bold text-white mb-1">
                  {grading ? "AI is judging your proposal..." : "AI is enhancing your proposal..."}
                </h3>
                <p className="text-xs text-neutral-400">
                  {grading ? "Evaluating Innovation, Feasibility, and Impact." : "Deepening tech stack and strengthening architecture."}
                </p>
              </div>
            </div>
          )}

          {gradeResult && !grading && !enhancing && (
            <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-400" /> AI Judge Feedback
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-black/50 p-4 rounded-lg text-center border border-white/5">
                    <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider mb-1">Overall</p>
                    <p className="text-3xl font-black text-white">{gradeResult.overallScore}<span className="text-lg text-neutral-600">/10</span></p>
                  </div>
                  <div className="bg-black/50 p-4 rounded-lg text-center border border-white/5">
                    <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider mb-1">Innovation</p>
                    <p className="text-xl font-black text-indigo-400">{gradeResult.innovationScore}</p>
                  </div>
                  <div className="bg-black/50 p-4 rounded-lg text-center border border-white/5">
                    <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider mb-1">Feasibility</p>
                    <p className="text-xl font-black text-green-400">{gradeResult.feasibilityScore}</p>
                  </div>
                  <div className="bg-black/50 p-4 rounded-lg text-center border border-white/5">
                    <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-wider mb-1">Impact</p>
                    <p className="text-xl font-black text-amber-400">{gradeResult.impactScore}</p>
                  </div>
                </div>
              </div>

              <div className="bg-black/50 p-4 rounded-lg border border-white/5 text-sm text-neutral-300">
                <p className="font-semibold text-white mb-2">Judge's Notes:</p>
                {gradeResult.feedback}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-neutral-400 uppercase">Suggestions</p>
                {gradeResult.enhancementSuggestions.map((sug, i) => (
                  <div key={i} className="flex gap-3 text-sm text-neutral-300">
                    <span className="text-[#ff6c37] shrink-0 mt-0.5">•</span> {sug}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onEnhance}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" /> Auto-Enhance Pitch
                </button>
                <button
                  onClick={onGenerate}
                  className="flex-1 h-12 rounded-xl bg-[#ff6c37] text-black font-bold hover:bg-[#ff8454] transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" /> Generate PPT Now
                </button>
              </div>
            </div>
          )}

          {!gradeResult && !grading && !enhancing && (
            <button
              onClick={onGenerate}
              className="w-full h-12 rounded-xl bg-[#ff6c37] hover:bg-[#ff8454] text-black font-bold transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-5 h-5" /> Skip Grading & Generate Presentation
            </button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-400">
              Generation Failed
            </p>
            <p className="text-xs text-red-300/70 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Generate button */}
      {!generatedContent && (
        <button
          onClick={onGenerate}
          disabled={generating}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-[#ff6c37] to-[#ff8c5a] hover:from-[#ff8454] hover:to-[#ffa070] text-black font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-[#ff6c37]/20"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>AI is crafting your presentation...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate SIH Presentation</span>
            </>
          )}
        </button>
      )}

      {/* Live Preview */}
      {generatedContent && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              Presentation Ready!
            </h3>
            <button
              onClick={onRegenerate}
              className="h-9 px-4 rounded-lg bg-[#0b0b0b] border border-white/10 text-xs font-medium text-neutral-400 hover:text-white hover:border-white/20 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Regenerate
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
            <div className="min-w-0">
              <SIHSlidePreview
                content={generatedContent}
                theme={currentTheme}
                activeSlide={activePreviewSlide}
                onSlideChange={onSlideChange}
              />
            </div>
            <div className="w-full xl:sticky xl:top-6">
              <SlideCopilot
                activeSlideLabel={["Title Page", "Idea Title", "Technical Approach", "Feasibility", "Impact", "References"][activePreviewSlide]}
                isEditing={copilotEditing}
                onSendRequest={onCopilotRequest}
              />
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={onDownload}
            disabled={downloading}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-black font-bold text-base transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-lg shadow-green-500/20"
          >
            {downloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating PPTX file...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download PPTX</span>
              </>
            )}
          </button>

          <p className="text-center text-xs text-neutral-500">
            Opens in PowerPoint, Google Slides, or LibreOffice. Save as PDF
            before uploading to SIH portal.
          </p>
        </div>
      )}
    </div>
  );
}
