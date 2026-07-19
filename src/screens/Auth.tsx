"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { EclixLogo } from "@/components/EclixLogo";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2, ArrowLeft, Mail, Eye, EyeOff } from "lucide-react";

// --- CLEAN INPUT COMPONENT ---
const CleanInput = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled,
  showPasswordToggle,
  ...props
}: any) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        <input
          type={showPasswordToggle ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full h-12 px-4 rounded-2xl text-sm font-medium transition-all duration-200",
            "border outline-none bg-secondary/50 border-border text-foreground placeholder:text-muted-foreground",
            "focus:ring-2 focus:ring-primary/20 focus:border-primary",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          {...props}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
};

// --- MAIN AUTH PAGE ---
const Auth = () => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signup");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mounted, setMounted] = useState(false);

  const { user, profile, signIn, signUp, resetPassword, loading: authLoading, demoSignIn } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (authLoading) return;
    if (user && profile) {
      if (profile.role === 'admin' || profile.role === 'super_admin') {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      let message = "Sign in failed. Please try again.";
      const errorMsg = error?.message?.toLowerCase() || error?.code?.toLowerCase() || "";

      if (errorMsg.includes("invalid login") || errorMsg.includes("invalid_credentials") || errorMsg.includes("wrong password")) {
        message = "Incorrect email or password. Please try again.";
      } else if (errorMsg.includes("email not confirmed") || errorMsg.includes("not confirmed")) {
        message = "Please verify your email before signing in. Check your inbox.";
      } else if (errorMsg.includes("user not found") || errorMsg.includes("no user")) {
        message = "No account found with this email. Please sign up first.";
      } else if (errorMsg.includes("rate limit") || errorMsg.includes("too many")) {
        message = "Too many attempts. Please wait a moment and try again.";
      }

      toast({ title: "Couldn't sign in", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const metadata = { full_name: name, role: "user" };
      await signUp(email, password, name, metadata);
      setIsVerificationSent(true);
    } catch (error: any) {
      let message = "Sign up failed. Please try again.";
      const errorMsg = error?.message?.toLowerCase() || error?.code?.toLowerCase() || "";

      if (errorMsg.includes("already registered") || errorMsg.includes("already exists") || errorMsg.includes("user_already_exists")) {
        message = "An account with this email already exists. Please sign in instead.";
      } else if (errorMsg.includes("invalid email") || errorMsg.includes("invalid_email")) {
        message = "Please enter a valid email address.";
      } else if (errorMsg.includes("weak password") || errorMsg.includes("password")) {
        message = "Password must be at least 6 characters long.";
      }

      toast({ title: "Couldn't create account", description: message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: "Email required", description: "Enter your email to reset password.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email);
      toast({ title: "Sent!", description: "Check your inbox." });
    } catch (error: any) {
      toast({ title: "Error", description: "Could not send reset email.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col overflow-y-auto bg-background transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 relative z-10">
        <div
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => router.push("/")}
        >
          <EclixLogo className="h-7 w-7 text-foreground" />
          <span className="text-base font-extrabold tracking-tight">Orbit</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-4 sm:py-8">
        {/* Hero Illustration Area */}
        <div className="relative flex justify-center items-center mb-6 px-6">
          <div className="relative w-full max-w-xs aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-8 rounded-full blur-2xl opacity-60 bg-gradient-to-r from-primary/30 to-accent/30" />
                <div className="relative w-24 h-24 rounded-3xl flex items-center justify-center bg-gradient-to-br from-primary to-accent">
                  <div className="flex gap-3">
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse delay-150" />
                  </div>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1 h-4 rounded-full bg-primary" />
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-primary" />
                </div>
                <div className="absolute -right-8 top-2 origin-bottom-left animate-[wave_1.5s_ease-in-out_infinite] text-primary">
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7 11.5V14H4.5C3.12 14 2 12.88 2 11.5S3.12 9 4.5 9H7v2.5zM9 5.5V9h2.5C12.88 9 14 7.88 14 6.5S12.88 4 11.5 4H9v1.5zM16 11.5c0-1.38 1.12-2.5 2.5-2.5S21 10.12 21 11.5 19.88 14 18.5 14H16v-2.5zM12 19.5V16H9.5C8.12 16 7 17.12 7 18.5S8.12 21 9.5 21H12v-1.5z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 py-3 px-4 rounded-2xl text-center text-sm font-medium bg-card/90 text-foreground backdrop-blur-sm border border-border">
              Hi! Welcome to your<br />personal study companion
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-sm mx-auto px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {isVerificationSent ? (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-500/10 text-green-500">
                <Mail className="h-10 w-10" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Check your inbox</h2>
                <p className="mt-2 text-muted-foreground">
                  We sent a verification link to<br />
                  <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>
              <button
                onClick={() => setIsVerificationSent(false)}
                className="text-sm text-primary hover:text-primary/80 flex items-center justify-center gap-2 w-full font-medium"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Login
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight text-center mb-8 text-foreground">
                {activeTab === "signin" ? "Welcome Back" : "Create Account"}
              </h1>

              <form onSubmit={activeTab === "signin" ? handleSignIn : handleSignUp} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                {activeTab === "signup" && (
                  <CleanInput
                    label="Full Name"
                    name="name"
                    id="name"
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e: any) => setName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                )}

                <CleanInput
                  label="E-mail"
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />

                <CleanInput
                  label="Password"
                  name="password"
                  id="password"
                  autoComplete={activeTab === "signin" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  disabled={isLoading}
                  showPasswordToggle
                  required
                  minLength={6}
                />

                {activeTab === "signin" && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full h-14 rounded-2xl font-semibold text-white transition-all duration-300 mt-2",
                    "bg-gradient-to-r from-neutral-500 to-neutral-600",
                    "hover:from-neutral-600 hover:to-neutral-700 hover:shadow-lg hover:shadow-neutral-500/30",
                    "active:scale-[0.98]",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  ) : (
                    activeTab === "signin" ? "Sign In" : "Get started"
                  )}
                </button>
              </form>

              {/* Demo Login */}
              <div className="mt-6 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={demoSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all font-semibold"
                >
                  Judge Demo Sign-In
                </button>
              </div>

              <p className="text-center text-sm mt-8 text-muted-foreground">
                {activeTab === "signin" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setActiveTab("signup")}
                      className="text-primary font-semibold hover:text-primary/80"
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
                      className="text-primary font-semibold hover:text-primary/80"
                    >
                      Log In
                    </button>
                  </>
                )}
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(20deg); }
        }
      `}</style>
    </div>
  );
};

export default Auth;
