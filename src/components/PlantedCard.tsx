import React from "react";
import { getStageColor } from "../utils/ui-helpers";

interface PlantedCardViewProps {
  catalogId: string;
  stage: string;
  onClick?: () => void;
  completedStages?: string[];
  daysElapsed?: number;
}

export const PlantedCardView: React.FC<PlantedCardViewProps> = React.memo(
  ({ catalogId, stage, onClick, completedStages = [], daysElapsed = 0 }) => {
    const colors = getStageColor(stage);

    return (
      <div
        onClick={onClick}
        className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer group/card relative"
      >
        {/* Growth Progress Dots */}
        <div className="absolute top-1 right-2 flex flex-col gap-0.5 pointer-events-none">
          {completedStages.map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm border border-green-600/50"
              title="Stage Completed"
            />
          ))}
        </div>

        <div
          className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center text-xl shadow-inner border ${colors.text.replace("text", "border")} group-hover/card:scale-110 transition-transform duration-300 relative`}
        >
          {stage.toLowerCase().includes("seed")
            ? "🌱"
            : stage.toLowerCase().includes("germ")
              ? "🧪"
              : stage.toLowerCase().includes("veg")
                ? "🌿"
                : stage.toLowerCase().includes("flower")
                  ? "🌸"
                  : stage.toLowerCase().includes("fruit")
                    ? "🍎"
                    : stage.toLowerCase().includes("harvest")
                      ? "🧺"
                      : "🌳"}

          {/* Active Stage Indicator */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-stone-900 rounded-full flex items-center justify-center border border-stone-700">
            <span className="text-[8px] text-white font-bold">
              {daysElapsed}d
            </span>
          </div>
        </div>
        <div
          className={`text-[9px] font-black uppercase leading-tight tracking-widest ${colors.text} group-hover/card:brightness-110 transition-colors`}
        >
          {stage}
        </div>
        <div
          className="text-[9px] text-stone-500 font-bold uppercase text-center px-0.5 leading-tight group-hover/card:text-stone-400 truncate w-full tracking-tighter"
          title={catalogId
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")}
        >
          {catalogId.replace(/-/g, " ")}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.catalogId === nextProps.catalogId &&
      prevProps.stage === nextProps.stage &&
      prevProps.daysElapsed === nextProps.daysElapsed &&
      prevProps.completedStages?.length === nextProps.completedStages?.length
    );
  },
);
