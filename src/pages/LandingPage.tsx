import React from "react";
import {
  CloudSun,
  Cpu,
  Database,
  Leaf,
  Sparkles,
  Sprout,
  Shield,
  BookOpen,
  ArrowRight,
  Github,
} from "lucide-react";

interface LandingPageProps {
  onGetStarted: () => void;
}

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="group rounded-2xl border border-stone-800 bg-stone-900/50 p-5 transition-all hover:border-garden-500/30 hover:bg-stone-900 hover:shadow-lg hover:shadow-garden-950/20">
    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-garden-500/20 bg-garden-950/40 text-garden-400 transition-transform group-hover:scale-110">
      {icon}
    </div>
    <h3 className="mb-1.5 text-sm font-black uppercase tracking-wider text-stone-200">
      {title}
    </h3>
    <p className="text-xs leading-6 text-stone-500">{description}</p>
  </div>
);

const StepCard: React.FC<{
  step: number;
  title: string;
  description: string;
}> = ({ step, title, description }) => (
  <div className="flex gap-4">
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-garden-500/30 bg-garden-950/50 text-xs font-black text-garden-400">
      {step}
    </span>
    <div>
      <h3 className="mb-1 text-sm font-black uppercase tracking-wider text-stone-200">
        {title}
      </h3>
      <p className="text-xs leading-6 text-stone-500">{description}</p>
    </div>
  </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-dvh bg-stone-950 text-stone-100">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-stone-800 bg-stone-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-garden-500/20">
              <Leaf className="h-4 w-4 text-garden-400" />
            </div>
            <span className="text-sm font-black uppercase tracking-tight text-garden-400">
              Lovely Garden
            </span>
          </div>
          <button
            onClick={onGetStarted}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg btn-primary px-4 text-[11px] font-black uppercase tracking-widest"
          >
            Sign In
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-garden-500/20 bg-garden-950/30 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-garden-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-garden-300">
              Local-first &bull; Private &bull; Offline-ready
            </span>
          </div>
          <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight sm:text-5xl sm:leading-tight">
            Your garden,{" "}
            <span className="text-garden-400">intelligently planned</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-base leading-7 text-stone-400">
            Plan garden beds, track plant growth, manage seed inventory, and get
            AI-powered gardening advice — all on your device, no account
            required.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={onGetStarted}
              className="inline-flex h-12 items-center gap-2 rounded-xl btn-primary px-8 text-sm font-black uppercase tracking-widest"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#features"
              className="inline-flex h-12 items-center rounded-xl border border-stone-700 bg-stone-900 px-8 text-sm font-black uppercase tracking-widest text-stone-300 transition-colors hover:border-stone-600 hover:text-stone-100"
            >
              Explore Features
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t border-stone-800/60 bg-stone-950 px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-black tracking-tight">
              Everything a gardener needs
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-6 text-stone-500">
              From planning to harvest — a unified workspace that works offline
              and respects your privacy.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Sprout className="h-5 w-5" />}
              title="Virtual Garden Grid"
              description="Drag and drop plants onto a grid-based bed. Visualize growth stages from seed to harvest."
            />
            <FeatureCard
              icon={<BookOpen className="h-5 w-5" />}
              title="Plant Knowledgebase"
              description="Browse hundreds of species with detailed growing info, companion planting data, and seasonal guidance."
            />
            <FeatureCard
              icon={<CloudSun className="h-5 w-5" />}
              title="Weather Integration"
              description="Real-time weather, frost alerts, watering scores, and heat-stress warnings tailored to your garden."
            />
            <FeatureCard
              icon={<Cpu className="h-5 w-5" />}
              title="AI Garden Coach"
              description="Optional on-device AI that answers planting questions, diagnoses issues, and suggests next steps — no data leaves your browser."
            />
            <FeatureCard
              icon={<Database className="h-5 w-5" />}
              title="Local-First Storage"
              description="All your garden data lives on your device. Sync to the cloud only if you choose to create an account."
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5" />}
              title="Privacy First"
              description="No tracking, no data mining. Your garden plans, plant selections, and observations stay yours."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-stone-800/60 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-black tracking-tight">
              How it works
            </h2>
            <p className="text-sm leading-6 text-stone-500">
              From seed to harvest in a few taps.
            </p>
          </div>
          <div className="space-y-8">
            <StepCard
              step={1}
              title="Browse or search the plant database"
              description="Explore hundreds of species in the knowledgebase. Filter by sunlight, water needs, soil type, or growing season."
            />
            <StepCard
              step={2}
              title="Add seeds to your inventory"
              description="Purchase seeds from the seed store — they appear in your inventory ready for planting."
            />
            <StepCard
              step={3}
              title="Plant in your garden grid"
              description="Drag seeds onto a grid bed. The plant lifecycle tracker follows each stage from germination to harvest."
            />
            <StepCard
              step={4}
              title="Get care guidance"
              description="Weather alerts, watering scores, companion planting insights, and an optional AI coach help you make decisions."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-800/60 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-black tracking-tight">
            Start growing today
          </h2>
          <p className="mb-8 text-sm leading-6 text-stone-500">
            No account needed. No data uploaded. Just you and your garden.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex h-12 items-center gap-2 rounded-xl btn-primary px-8 text-sm font-black uppercase tracking-widest"
          >
            Open Lovely Garden
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800/60 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <Leaf className="h-3.5 w-3.5 text-garden-500" />
            Lovely Garden &mdash; Open source
          </div>
          <a
            href="https://github.com/shahraizali/lovely-garden"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-stone-600 transition-colors hover:text-stone-400"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
};
