import React from "react";
import { Leaf } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  /** When true, centers the spinner in a full-screen layout */
  fullScreen?: boolean;
}

const sizeMap = {
  sm: { icon: "h-4 w-4", border: "h-4 w-4 border-2", text: "text-[10px]" },
  md: { icon: "h-6 w-6", border: "h-8 w-8 border-[3px]", text: "text-xs" },
  lg: {
    icon: "h-8 w-8",
    border: "h-12 w-12 border-4",
    text: "text-sm",
  },
};

const defaultLabels = {
  sm: "Loading",
  md: "Loading",
  lg: "Initializing",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  label,
  fullScreen = false,
}) => {
  const s = sizeMap[size];
  const displayLabel = label ?? defaultLabels[size];
  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative flex items-center justify-center">
        <div
          className={`${s.border} rounded-full border-garden-500/20 border-t-garden-500 animate-spin`}
        />
        <Leaf className={`${s.icon} absolute text-garden-400 animate-pulse`} />
      </div>
      <p
        className={`${s.text} font-black uppercase tracking-[0.3em] text-stone-500 animate-pulse`}
      >
        {displayLabel}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};
