import React from "react";
import { Leaf } from "lucide-react";
import { WelcomeBackdrop } from "./WelcomeBackdrop";

export const SplashScreen: React.FC = () => {
  return (
    <WelcomeBackdrop contentClassName="flex min-h-dvh items-end justify-center px-5 pb-8 sm:pb-10">
      <section className="w-full max-w-sm text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)]">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-white/85 text-garden-800 shadow-xl">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight">
              Lovely Garden
            </h1>
            <p className="text-xs font-bold text-white/85">
              Preparing your garden
            </p>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/35 shadow-inner">
          <div className="welcome-progress h-full w-full rounded-full bg-white" />
        </div>
      </section>
    </WelcomeBackdrop>
  );
};
