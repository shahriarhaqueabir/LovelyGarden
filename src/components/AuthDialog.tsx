import React, { useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { Modal } from "./ui/Modal";
import {
  signInWithPassword,
  signUpWithPassword,
} from "../services/authService";
import { showError, showSuccess, showInfo } from "../lib/toast";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = "sign-in" | "sign-up";

export const AuthDialog: React.FC<AuthDialogProps> = ({ isOpen, onClose }) => {
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
        showSuccess("Cloud session connected.");
        onClose();
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "sign-in" ? "Cloud Sign In" : "Create Account"}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-garden-500/20 bg-garden-950/20 p-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-garden-400" />
            <div>
              <div className="text-xs font-black uppercase tracking-widest text-garden-400">
                Supabase Auth
              </div>
              <p className="mt-1 text-xs leading-relaxed text-stone-400">
                Signing in prepares cloud sync for your gardens, inventory, and
                logbook. Local data stays available while sync is wired in.
              </p>
            </div>
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
              className="w-full rounded-xl border border-stone-800 bg-stone-950 px-4 py-3 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-700 focus:border-garden-500"
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
              className="w-full rounded-xl border border-stone-800 bg-stone-950 px-4 py-3 text-sm text-stone-100 outline-none transition-colors placeholder:text-stone-700 focus:border-garden-500"
              placeholder="Minimum 6 characters"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
            className="text-left text-xs font-bold text-stone-500 transition-colors hover:text-garden-400"
          >
            {mode === "sign-in"
              ? "Need an account? Create one"
              : "Already have an account? Sign in"}
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-garden-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-stone-950 shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all hover:bg-garden-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {isSubmitting
              ? "Working..."
              : mode === "sign-in"
                ? "Sign In"
                : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
