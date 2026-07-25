"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { EclixLogo } from "@/components/EclixLogo";
import { cn } from "@/lib/utils";
import { Loader2, ArrowLeft, Eye, EyeOff, Check, X, ShieldCheck, Mail, KeyRound, Sparkles } from "lucide-react";

// ── Password Strength Rules ──────────────────────────────
const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p: string) => /\d/.test(p) },
  { id: "special", label: "One special character", test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(p) },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed <= 1) return { score: passed, label: "Weak", color: "bg-red-500" };
  if (passed <= 2) return { score: passed, label: "Fair", color: "bg-orange-500" };
  if (passed <= 3) return { score: passed, label: "Good", color: "bg-yellow-500" };
  if (passed <= 4) return { score: passed, label: "Strong", color: "bg-emerald-400" };
  return { score: passed, label: "Excellent", color: "bg-emerald-500" };
}

function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password));
}

// ── Clean Input ──────────────────────────────────────────
const CleanInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  showPasswordToggle,
  error,
  ...props
}: any) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{label}</label>
      <div className="relative">
        <input
          type={showPasswordToggle ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full h-12 px-4 rounded-xl text-sm font-medium transition-all duration-200",
            "bg-neutral-950 border text-white placeholder:text-neutral-600",
            "focus:ring-2 focus:ring-[#ff6c37]/30 focus:border-[#ff6c37]/60 outline-none",
            error ? "border-red-500/60" : "border-white/10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-[11px] text-red-400 font-medium">{error}</p>}
    </div>
  );
};

// ── Password Strength Indicator ──────────────────────────
function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;
  const strength = getPasswordStrength(password);

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Strength bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", strength.color)}
            style={{ width: `${(strength.score / PASSWORD_RULES.length) * 100}%` }}
          />
        </div>
        <span className={cn("text-[11px] font-bold uppercase tracking-wider", 
          strength.score <= 2 ? "text-red-400" : strength.score <= 3 ? "text-yellow-400" : "text-emerald-400"
        )}>
          {strength.label}
        </span>
      </div>

      {/* Individual rules */}
      <div className="grid grid-cols-1 gap-1">
        {PASSWORD_RULES.map((rule) => {
          const passed = rule.test(password);
          return (
            <div
              key={rule.id}
              className={cn(
                "flex items-center gap-2 text-[11px] font-medium transition-colors duration-200",
                passed ? "text-emerald-400" : "text-neutral-500"
              )}
            >
              {passed ? <Check className="h-3 w-3 shrink-0" /> : <X className="h-3 w-3 shrink-0" />}
              {rule.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── OTP Input ────────────────────────────────────────────
function OtpInput({ length = 6, onComplete, disabled }: { length?: number; onComplete: (code: string) => void; disabled?: boolean }) {
  const [values, setValues] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
    }
  }, [length]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newValues = [...values];
    newValues[index] = digit;
    setValues(newValues);

    if (digit && index < length - 1) {
      focusInput(index + 1);
    }

    // Check if complete
    const code = newValues.join("");
    if (code.length === length && newValues.every((v) => v !== "")) {
      onComplete(code);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !values[index] && index > 0) {
      focusInput(index - 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pastedData.length > 0) {
      const newValues = [...values];
      for (let i = 0; i < pastedData.length; i++) {
        newValues[i] = pastedData[i];
      }
      setValues(newValues);

      // Focus next empty or last
      const nextIndex = Math.min(pastedData.length, length - 1);
      focusInput(nextIndex);

      if (pastedData.length === length) {
        onComplete(pastedData);
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {values.map((val, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={val}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className={cn(
            "w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border transition-all duration-200 outline-none",
            "bg-neutral-950 text-white",
            val
              ? "border-[#ff6c37]/60 ring-2 ring-[#ff6c37]/20"
              : "border-white/10 focus:border-[#ff6c37]/60 focus:ring-2 focus:ring-[#ff6c37]/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}

// ── Feature Highlight Cards (Left Panel) ─────────────────
const FEATURES = [
  {
    icon: Sparkles,
    title: "AI-Powered Learning",
    description: "Personalized tutoring with contextual feedback",
  },
  {
    icon: ShieldCheck,
    title: "Proctored Assessments",
    description: "Graded exams with anti-cheat monitoring",
  },
  {
    icon: KeyRound,
    title: "Secure & Private",
    description: "End-to-end encrypted sessions and data",
  },
];

// ═══════════════════════════════════════════════════════════
// ── MAIN AUTH PAGE ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════
const Auth = () => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signup");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mounted, setMounted] = useState(false);

  // OTP verification state
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  const { user, profile, signIn, signUp, resetPassword, verifyOtp, resendOtp, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading) return;
    if (user && profile) {
      if (profile.role === "admin" || profile.role === "super_admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Handlers ──────────────────────────────────────────
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      // Errors are handled by AuthContext toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) return;
    setIsLoading(true);
    try {
      await signUp(email, password, name);
      setOtpEmail(email);
      setShowOtpScreen(true);
      setResendCooldown(60);
    } catch (error: any) {
      // Errors are handled by AuthContext toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setIsLoading(true);
    try {
      await verifyOtp(otpEmail, code);
      // AuthContext will refresh profile and trigger redirect
    } catch (error: any) {
      // Errors are handled by AuthContext toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      await resendOtp(otpEmail);
      setResendCooldown(60);
    } catch (error: any) {
      // Errors are handled by AuthContext toast
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return;
    setIsLoading(true);
    try {
      await resetPassword(email);
    } catch (error: any) {
      // Errors are handled by AuthContext toast
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#040404]">
        <Loader2 className="h-10 w-10 animate-spin text-[#ff6c37]" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ── OTP VERIFICATION SCREEN ──────────────────────────
  // ═══════════════════════════════════════════════════════
  if (showOtpScreen) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#040404] px-4 py-8">
        {/* Atmospheric glow */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#ff6c37]/[0.04] blur-[120px]" />
        </div>

        <div className="relative w-full max-w-md animate-in fade-in slide-in-from-bottom-6 duration-500">
          {/* Card */}
          <div className="rounded-2xl border border-white/10 bg-neutral-950/80 backdrop-blur-xl p-8 sm:p-10 space-y-8 shadow-2xl">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center bg-[#ff6c37]/10 border border-[#ff6c37]/20">
                <Mail className="h-10 w-10 text-[#ff6c37]" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Verify your email</h2>
              <p className="text-sm text-neutral-400 leading-relaxed">
                We sent a 6-digit verification code to{" "}
                <span className="text-white font-medium">{otpEmail}</span>
              </p>
            </div>

            {/* OTP Input */}
            <OtpInput onComplete={handleVerifyOtp} disabled={isLoading} />

            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#ff6c37]" />
              </div>
            )}

            {/* Resend */}
            <div className="text-center space-y-3">
              <p className="text-xs text-neutral-500">Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className={cn(
                  "text-sm font-semibold transition-colors",
                  resendCooldown > 0
                    ? "text-neutral-600 cursor-not-allowed"
                    : "text-[#ff6c37] hover:text-[#ff8454]"
                )}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>

            {/* Back */}
            <button
              type="button"
              onClick={() => {
                setShowOtpScreen(false);
                setActiveTab("signup");
              }}
              className="flex items-center justify-center gap-2 w-full text-sm text-neutral-400 hover:text-white transition-colors font-medium"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // ── MAIN AUTH FORM ───────────────────────────────────
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen w-full flex bg-[#040404]">
      {/* ── LEFT PANEL (Desktop only) ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff6c37]/20 via-[#0b0b0b] to-[#040404]" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#ff6c37]/10 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-[#ff6c37]/5 blur-[100px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          {/* Logo */}
          <button 
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
          >
            <EclixLogo className="h-8 w-8 text-white" />
            <span className="text-lg font-extrabold tracking-tight text-white">Orbit</span>
          </button>

          {/* Hero Text */}
          <div className="space-y-6 max-w-md">
            <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Your intelligent
              <br />
              <span className="text-[#ff6c37]">study companion</span>
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              AI-powered tutoring, proctored assessments, concept mapping, and code tracing — all in one premium workspace built for computer science students.
            </p>

            {/* Feature Cards */}
            <div className="space-y-3 pt-4">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex items-start gap-3.5 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] backdrop-blur-sm"
                  >
                    <div className="p-2 rounded-lg bg-[#ff6c37]/10 shrink-0">
                      <Icon className="h-4 w-4 text-[#ff6c37]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{feature.title}</h4>
                      <p className="text-xs text-neutral-500 mt-0.5">{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[11px] text-neutral-600 font-medium">
            © {new Date().getFullYear()} Orbit Study OS. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL (Form) ── */}
      <div className="flex-1 flex items-center justify-center px-5 py-8 sm:px-8 relative">
        {/* Atmospheric glow */}
        <div className="fixed inset-0 pointer-events-none lg:hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full bg-[#ff6c37]/[0.03] blur-[100px]" />
        </div>

        <div className="w-full max-w-sm relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Mobile Logo */}
          <button 
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center justify-center gap-2.5 mb-10 lg:hidden hover:opacity-80 transition-opacity cursor-pointer focus:outline-none w-full"
          >
            <EclixLogo className="h-7 w-7 text-white" />
            <span className="text-base font-extrabold tracking-tight text-white">Orbit</span>
          </button>

          {/* Tab Switcher */}
          <div className="flex items-center bg-neutral-900/80 rounded-xl p-1 mb-8 border border-white/5">
            <button
              type="button"
              onClick={() => setActiveTab("signup")}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                activeTab === "signup"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("signin")}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                activeTab === "signin"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300"
              )}
            >
              Sign In
            </button>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {activeTab === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-neutral-500 mt-1.5">
              {activeTab === "signin"
                ? "Sign in to continue your learning journey"
                : "Start your journey with Orbit's AI workspace"}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={activeTab === "signin" ? handleSignIn : handleSignUp}
            className="space-y-5"
          >
            {activeTab === "signup" && (
              <CleanInput
                label="Full Name"
                name="name"
                id="auth-name"
                autoComplete="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e: any) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            )}

            <CleanInput
              label="Email Address"
              type="email"
              name="email"
              id="auth-email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              disabled={isLoading}
              required
            />

            <CleanInput
              label="Password"
              name="password"
              id="auth-password"
              autoComplete={activeTab === "signin" ? "current-password" : "new-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              disabled={isLoading}
              showPasswordToggle
              required
              minLength={8}
            />

            {/* Password Strength - only on signup */}
            {activeTab === "signup" && <PasswordStrengthIndicator password={password} />}

            {/* Forgot Password - only on signin */}
            {activeTab === "signin" && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={!email || isLoading}
                  className="text-xs font-medium text-[#ff6c37] hover:text-[#ff8454] transition-colors disabled:text-neutral-600 disabled:cursor-not-allowed"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || (activeTab === "signup" && !isPasswordValid(password))}
              className={cn(
                "w-full h-12 rounded-xl font-semibold text-sm transition-all duration-200 mt-2",
                "bg-[#ff6c37] text-white",
                "hover:bg-[#ff8454] hover:shadow-lg hover:shadow-[#ff6c37]/20",
                "active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : activeTab === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Switch Tab */}
          <p className="text-center text-sm mt-8 text-neutral-500">
            {activeTab === "signin" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("signup")}
                  className="text-[#ff6c37] font-semibold hover:text-[#ff8454] transition-colors"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("signin")}
                  className="text-[#ff6c37] font-semibold hover:text-[#ff8454] transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
          </p>

          {/* Terms */}
          <p className="text-center text-[11px] text-neutral-600 mt-6 leading-relaxed">
            By continuing, you agree to Orbit's{" "}
            <span className="text-neutral-400 hover:text-white cursor-pointer transition-colors">Terms of Service</span>{" "}
            and{" "}
            <span className="text-neutral-400 hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
