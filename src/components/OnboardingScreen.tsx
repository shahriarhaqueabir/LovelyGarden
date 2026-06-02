import React from "react";
import { BookOpenCheck, Cloud, Leaf, Sprout, HelpCircle } from "lucide-react";

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
  const TASK_KEY = "onboarding-checklist-v1";
  const defaultTasks = [
    { id: "add-seeds", label: "Add seeds to your bag" },
    { id: "create-garden", label: "Create or open a garden" },
    { id: "plant-seed", label: "Place one seed in a bed" },
    { id: "log-water", label: "Log your next watering" },
  ];

  const [completed, setCompleted] = React.useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(TASK_KEY);
      if (!raw) return new Set();
      const arr = JSON.parse(raw) as string[];
      return new Set(arr);
    } catch {
      return new Set();
    }
  });

  const [showHelp, setShowHelp] = React.useState(false);

  const toggleTask = (id: string) => {
    const next = new Set(completed);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCompleted(next);
    try {
      localStorage.setItem(TASK_KEY, JSON.stringify(Array.from(next)));
    } catch {
      // ignore
    }
  };

  const completedCount = completed.size;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-app-background px-4 py-8 text-text-primary">
      <section className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="space-y-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-garden-500/30 bg-garden-950 text-garden-300 shadow-[0_0_40px_rgba(34,197,94,0.18)]">
            <Leaf className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-garden-500">
                Welcome
              </p>
              <button
                type="button"
                onClick={() => setShowHelp((s) => !s)}
                className="ml-2 inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-200"
                aria-expanded={showHelp}
              >
                <HelpCircle className="w-4 h-4" />
                <span className="text-xs font-semibold">Need help?</span>
              </button>
            </div>

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
            className="h-12 w-full rounded-xl btn-primary px-5 text-xs font-black uppercase tracking-widest transition-all disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
        <aside className="lg:col-span-1">
          <div className="rounded-2xl border border-stone-800 bg-stone-950/80 p-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-stone-200">
                Getting started
              </h3>
              <span className="text-xs text-stone-500">
                {completedCount}/{defaultTasks.length}
              </span>
            </div>
            <div className="space-y-2">
              {defaultTasks.map((t) => (
                <label key={t.id} className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={completed.has(t.id)}
                    onChange={() => toggleTask(t.id)}
                    className="h-4 w-4 rounded border-stone-700 bg-stone-900 text-garden-500"
                  />
                  <span className="text-stone-300">{t.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-4">
              <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-garden-500"
                  style={{
                    width: `${(completedCount / defaultTasks.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {showHelp && (
            <div className="mt-3 rounded-2xl border border-stone-800 bg-stone-900/80 p-3 text-sm text-stone-300">
              <h4 className="font-black uppercase tracking-widest text-stone-200 mb-2">
                Quick Tips
              </h4>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  Tap <strong>Add Seeds</strong> to build your bag.
                </li>
                <li>Create a garden then place a seed to see care hints.</li>
                <li>
                  Use the assistant (sparkles FAB) for quick planting advice.
                </li>
                <li>
                  Connect Gemini under Settings to enable AI coach (optional).
                </li>
              </ul>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
};
