import React from "react";
import splashArtwork from "../../docs/splashscreen.png";

interface WelcomeBackdropProps {
  children: React.ReactNode;
  contentClassName?: string;
}

export const WelcomeBackdrop: React.FC<WelcomeBackdropProps> = ({
  children,
  contentClassName = "",
}) => {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-stone-950 text-stone-950">
      <img
        src={splashArtwork}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-[47%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-black/10 to-black/55" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
      <div className={`relative z-10 ${contentClassName}`}>{children}</div>
    </main>
  );
};
