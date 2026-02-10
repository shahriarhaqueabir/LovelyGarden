import { getStageColor } from './GrowthGraph';

interface PlantedCardViewProps {
  catalogId: string;
  stage: string;
  onClick?: () => void;
}

export const PlantedCardView: React.FC<PlantedCardViewProps> = ({ catalogId, stage, onClick }) => {
  const colors = getStageColor(stage);
  
  return (
    <div 
      onClick={onClick}
      className="w-full h-full flex flex-col items-center justify-center gap-1 cursor-pointer group/card"
    >
      <div className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center text-xl shadow-inner border ${colors.text.replace('text', 'border')} group-hover/card:scale-110 transition-transform duration-300`}>
        {stage.toLowerCase().includes('seed') ? '🌱' : 
         stage.toLowerCase().includes('germ') ? '🧪' : 
         stage.toLowerCase().includes('veg') ? '🌿' : 
         stage.toLowerCase().includes('flower') ? '🌸' : 
         stage.toLowerCase().includes('fruit') ? '🍎' : 
         stage.toLowerCase().includes('harvest') ? '🧺' : '🌳'}
      </div>
      <div className={`text-[9px] font-black uppercase leading-tight tracking-widest ${colors.text} group-hover/card:brightness-110 transition-colors`}>
        {stage}
      </div>
      <div 
        className="text-[9px] text-stone-500 font-bold uppercase text-center px-0.5 leading-tight group-hover/card:text-stone-400 truncate w-full tracking-tighter"
        title={catalogId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
      >
        {catalogId.replace(/-/g, ' ')}
      </div>
    </div>
  );
};
