import React from "react";
import { Leaf } from "lucide-react";

export const SplashScreen: React.FC = () => {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-app-background text-text-primary">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-garden-500/30 bg-garden-950 text-garden-300 shadow-[0_0_40px_rgba(34,197,94,0.18)]">
          <Leaf className="h-8 w-8" />
        </div>
        <div className="h-1 w-28 overflow-hidden rounded-full bg-stone-900">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-garden-500" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-stone-500">
          Lovely Garden
        </p>
      </div>
    </main>
  );
};
