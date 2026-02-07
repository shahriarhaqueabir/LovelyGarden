import React from 'react';

interface PlantedCardViewProps {
  catalogId: string;
  stage: string;
  onClick?: () => void;
}

export const PlantedCardView: React.FC<PlantedCardViewProps> = ({ catalogId, stage, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="w-full h-full p-2 flex flex-col items-center justify-center gap-2 animate-in fade-in zoom-in duration-500 cursor-pointer group/card"
    >
      <div className="w-16 h-16 bg-garden-900/50 rounded-full flex items-center justify-center text-3xl shadow-inner border border-garden-500/20 group-hover/card:scale-110 transition-transform duration-300">
        {stage === 'germination' ? '🌱' : stage === 'seedling' ? '🌿' : '🌳'}
      </div>
      <div className="text-[10px] font-bold text-garden-400 uppercase tracking-tighter group-hover/card:text-garden-300 transition-colors">
        {stage}
      </div>
      <div className="text-[9px] text-stone-500 font-medium text-center line-clamp-1 px-1 group-hover/card:text-stone-400">
        {catalogId.replace('-', ' ')}
      </div>
    </div>
  );
};
