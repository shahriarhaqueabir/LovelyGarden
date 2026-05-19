import React from "react";
import { BookOpenCheck, Cloud, Leaf, Sprout } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: () => void;
  isSaving?: boolean;
}

const cards = [
  {
    title: "Plan",
    body: "Choose what to grow with seasonal guidance and plant relationships.",
    icon: BookOpenCheck,
  },
  {
    title: "Grow",
    body: "Place plants, watch hydration, and keep each garden bed organized.",
    icon: Sprout,
  },
  {
    title: "Sync",
    body: "Keep your garden available across phone, tablet, and desktop.",
    icon: Cloud,
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  isSaving = false,
}) => {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-app-background px-4 py-8 text-text-primary">
      <section className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-garden-500/30 bg-garden-950 text-garden-300 shadow-[0_0_40px_rgba(34,197,94,0.18)]">
            <Leaf className="h-8 w-8" />
          </div>
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-garden-500">
              Welcome
            </p>
            <h1 className="max-w-xl text-3xl font-black tracking-tight text-stone-100 sm:text-4xl lg:text-5xl">
              Your garden is ready.
            </h1>
            <p className="mt-4 max-w-lg text-sm font-semibold leading-6 text-stone-400 sm:text-base">
              Lovely Garden keeps the same workspace across mobile and desktop,
              with cloud sync tied to your account.
            </p>
          </div>
          <button
            type="button"
            onClick={onComplete}
            disabled={isSaving}
            className="h-12 w-full rounded-xl bg-garden-500 px-5 text-xs font-black uppercase tracking-widest text-stone-950 shadow-[0_0_20px_rgba(34,197,94,0.25)] transition-all hover:bg-garden-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? "Preparing..." : "Enter Garden"}
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="rounded-2xl border border-stone-800 bg-stone-950/80 p-4"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-garden-500/20 bg-garden-950/60 text-garden-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-black uppercase tracking-widest text-stone-200">
                  {card.title}
                </h2>
                <p className="mt-2 text-xs font-semibold leading-5 text-stone-500">
                  {card.body}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};
