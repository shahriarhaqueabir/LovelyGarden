import React, { useState } from "react";
import { Leaf, LogIn, ShieldCheck } from "lucide-react";
import {
  signInWithPassword,
  signUpWithPassword,
} from "../services/authService";
import { showError, showInfo, showSuccess } from "../lib/toast";
import { WelcomeBackdrop } from "./WelcomeBackdrop";

type AuthMode = "sign-in" | "sign-up";

export const AuthScreen: React.FC = () => {
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
    <WelcomeBackdrop contentClassName="flex min-h-dvh items-end justify-center px-4 py-5 sm:py-10">
      <section className="w-full max-w-md rounded-lg border border-white/70 bg-white/90 p-5 text-stone-950 shadow-2xl shadow-black/35 backdrop-blur-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-garden-700/20 bg-garden-100 text-garden-800">
            <Leaf className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black uppercase tracking-tight text-garden-900">
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
          className="rounded-lg border border-stone-200 bg-white/85 p-4 shadow-inner sm:p-5"
        >
          <div className="mb-5 rounded-lg border border-garden-700/15 bg-garden-50 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-garden-700" />
              <p className="text-xs font-semibold leading-5 text-stone-700">
                Your garden opens after authentication.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-stone-500">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="h-12 w-full rounded-lg border border-stone-300 bg-white px-4 text-sm text-stone-950 outline-none transition-colors placeholder:text-stone-400 focus:border-garden-600"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-stone-500">
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
                className="h-12 w-full rounded-lg border border-stone-300 bg-white px-4 text-sm text-stone-950 outline-none transition-colors placeholder:text-stone-400 focus:border-garden-600"
                placeholder="Minimum 6 characters"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-garden-700 px-5 text-xs font-black uppercase tracking-widest text-white shadow-[0_12px_30px_rgba(21,128,61,0.28)] transition-all hover:bg-garden-600 disabled:cursor-not-allowed disabled:opacity-60"
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
            onClick={() =>
              setMode((current) =>
                current === "sign-in" ? "sign-up" : "sign-in",
              )
            }
            className="mt-4 w-full text-center text-xs font-bold text-stone-600 transition-colors hover:text-garden-700"
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
