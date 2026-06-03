import React, { useState } from "react";
import { ArrowLeft, Leaf, LogIn, ShieldCheck } from "lucide-react";
import {
  signInWithPassword,
  signUpWithPassword,
} from "../services/authService";
import { showError, showInfo, showSuccess } from "../lib/toast";
import { WelcomeBackdrop } from "./WelcomeBackdrop";

type AuthMode = "sign-in" | "sign-up";

interface AuthScreenProps {
  onBack?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onBack }) => {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const action =
        mode === "sign-in" ? signInWithPassword : signUpWithPassword;
      const { data, error } = await action(email.trim(), password);
      if (error) throw error;

      if (mode === "sign-up" && !data.session) {
        showInfo("Account created. Check your email to confirm sign-in.");
      } else {
        showSuccess("Welcome to your garden.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed.";
      showError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <WelcomeBackdrop contentClassName="flex min-h-dvh items-start justify-center px-4 pb-6 pt-[11vh] sm:pt-[14vh] lg:pt-[16vh]">
      <section className="w-full max-w-[21rem] rounded-lg border border-white/50 bg-white/55 p-4 text-stone-950 shadow-2xl shadow-black/30 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-300/60 bg-white/60 text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-800"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-garden-700/20 bg-garden-100/80 text-garden-800">
            <Leaf className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black uppercase tracking-tight text-garden-900">
              Lovely Garden
            </h1>
            <p className="text-xs font-bold text-stone-600">
              {mode === "sign-in"
                ? "Sign in to continue"
                : "Create your garden"}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-white/45 bg-white/50 p-3 shadow-inner shadow-white/20 backdrop-blur-sm"
        >
          <div className="mb-3 rounded-lg border border-garden-700/15 bg-garden-50/65 p-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-garden-700" />
              <p className="text-[11px] font-semibold leading-4 text-stone-700">
                Your garden opens after authentication.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-stone-500">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                data-testid="auth-email"
                className="h-10 w-full rounded-lg border border-stone-300 bg-white/80 px-3 text-sm text-stone-950 outline-none transition-colors placeholder:text-stone-400 focus:border-garden-600"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-stone-500">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  mode === "sign-in" ? "current-password" : "new-password"
                }
                minLength={6}
                required
                data-testid="auth-password"
                className="h-10 w-full rounded-lg border border-stone-300 bg-white/80 px-3 text-sm text-stone-950 outline-none transition-colors placeholder:text-stone-400 focus:border-garden-600"
                placeholder="Minimum 6 characters"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="auth-submit"
            className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg btn-primary px-4 text-xs font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {isSubmitting
              ? "Working..."
              : mode === "sign-in"
                ? "Sign In"
                : "Create Account"}
          </button>

          <button
            type="button"
            data-testid="auth-mode-toggle"
            onClick={() =>
              setMode((current) =>
                current === "sign-in" ? "sign-up" : "sign-in",
              )
            }
            className="mt-3 w-full text-center text-xs font-bold text-stone-600 transition-colors hover:text-garden-700"
          >
            {mode === "sign-in"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>
        </form>
      </section>
    </WelcomeBackdrop>
  );
};
