import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface GrowthTelemetryProps {
  data: { day: number; health: number; biomass: number }[];
}

/**
 * Growth Telemetry Component
 * Visualizes historical and projected health/biomass trends.
 */
export const GrowthTelemetry: React.FC<GrowthTelemetryProps> = ({ data }) => {
  return (
    <div className="w-full h-48 bg-stone-900/50 rounded-xl border border-stone-800 p-4">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-4">
        📈 Growth Telemetry
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBiomass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
          <XAxis 
            dataKey="day" 
            hide 
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fill: '#444', fontSize: 8 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1c1917', 
              border: '1px solid #444', 
              borderRadius: '8px',
              fontSize: '10px',
              color: '#fff'
            }}
            itemStyle={{ color: '#fff' }}
          />
          <Area 
            type="monotone" 
            dataKey="health" 
            stroke="#22c55e" 
            fillOpacity={1} 
            fill="url(#colorHealth)" 
            strokeWidth={2}
          />
          <Area 
            type="monotone" 
            dataKey="biomass" 
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorBiomass)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
