import React from 'react';

export interface GrowthStage {
  id?: string;
  name?: string;
  durationDays?: number;
}

interface GrowthGraphProps {
  stages?: GrowthStage[];
}

export const getStageColor = (stageId: string) => {
  const sid = stageId.toLowerCase();
  if (sid.includes('seed')) return { bg: 'bg-stone-200', text: 'text-stone-700', bar: 'bg-stone-400' };
  if (sid.includes('germ')) return { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-400' };
  if (sid.includes('seedling') || sid.includes('sapling')) return { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-400' };
  if (sid.includes('veg')) return { bg: 'bg-lime-100', text: 'text-lime-700', bar: 'bg-lime-400' };
  if (sid.includes('flower')) return { bg: 'bg-pink-100', text: 'text-pink-700', bar: 'bg-pink-400' };
  if (sid.includes('fruit')) return { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-400' };
  if (sid.includes('harvest')) return { bg: 'bg-orange-100', text: 'text-orange-700', bar: 'bg-orange-400' };
  if (sid.includes('dormant')) return { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-400' };
  return { bg: 'bg-stone-800', text: 'text-stone-400', bar: 'bg-stone-600' };
};

export const GrowthGraph: React.FC<GrowthGraphProps> = ({ stages }) => {
  if (!stages || stages.length === 0) {
    return (
      <div className="text-center py-4 text-stone-600 text-sm italic">
        No growth stage data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {stages.map((stage, idx) => {
        const colors = getStageColor(stage.id || '');
        return (
          <div key={idx} className="flex items-center gap-3 p-2 bg-stone-950 border border-stone-800 rounded-lg group hover:border-stone-700 transition-colors">
            <div className={`w-8 h-8 rounded ${colors.bg} ${colors.text} flex items-center justify-center text-[10px] font-black group-hover:scale-105 transition-transform`}>
              {idx + 1}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-black uppercase tracking-wider ${colors.text}`}>{stage.id}</span>
                <span className="text-[10px] font-mono text-stone-600">{stage.durationDays}d</span>
              </div>
              <div className="h-1.5 w-full bg-stone-900 rounded-full mt-1 overflow-hidden border border-stone-800/50">
                <div 
                  className={`h-full ${colors.bar} rounded-full transition-all duration-500`} 
                  style={{ width: `${Math.min(100, ((stage.durationDays || 30) / 90) * 100)}%` }} 
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
