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
      className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer group/card"
    >
      <div className="w-6 h-6 bg-garden-900/50 rounded-full flex items-center justify-center text-base shadow-inner border border-garden-500/20 group-hover/card:scale-110 transition-transform duration-300">
        {stage === 'germination' ? '🌱' : stage === 'seedling' ? '🌿' : '🌳'}
      </div>
      <div className="text-[10px] font-bold text-garden-400 uppercase leading-tight group-hover/card:text-garden-300 transition-colors">
        {stage}
      </div>
      <div 
        className="text-[10px] text-stone-500 font-medium text-center px-0.5 leading-tight group-hover/card:text-stone-400 truncate w-full"
        title={catalogId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      >
        {catalogId.replace(/-/g, ' ')}
      </div>
    </div>
  );
};
