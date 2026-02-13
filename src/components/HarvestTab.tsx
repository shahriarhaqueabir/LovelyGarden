import React, { useMemo } from 'react';
import { ShoppingBasket, Skull, Calendar, ArrowUpRight, ArrowDownRight, History, Leaf, Trash2 } from 'lucide-react';
import { useLogbook } from '../hooks/useLogbook';
import { format } from 'date-fns';
import { showInfo } from '../lib/toast';
import { deleteLogbookEntry } from '../db/queries';
import type { LogbookDocument } from '../db/types';

interface HarvestCardProps {
  entry: LogbookDocument;
  status: 'success' | 'loss';
  onDelete: (id: string) => void;
}

const HarvestCard: React.FC<HarvestCardProps> = ({ entry, status, onDelete }) => (
  <div className={`glass-panel border p-4 rounded-2xl flex items-center justify-between group transition-all hover:translate-x-1 ${
    status === 'success' ? 'border-garden-500/20 hover:border-garden-500/40' : 'border-red-500/20 hover:border-red-500/40'
  }`}>
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        status === 'success' ? 'bg-garden-500/10 text-garden-500' : 'bg-red-500/10 text-red-500'
      }`}>
        {status === 'success' ? <ShoppingBasket className="w-5 h-5" /> : <Skull className="w-5 h-5" />}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-stone-200 uppercase tracking-tight">{entry.itemName}</h4>
          {status === 'success' ? (
            <span className="text-[8px] font-black bg-garden-500/20 text-garden-400 px-1 py-0.5 rounded border border-garden-500/30 uppercase">Yield +1</span>
          ) : (
            <span className="text-[8px] font-black bg-red-500/20 text-red-400 px-1 py-0.5 rounded border border-red-500/30 uppercase">Lost</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[10px] text-stone-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {format(entry.date, 'MMM d, yyyy')}
          </span>
          {entry.notes && (
            <span className="text-[10px] text-stone-600 italic">"{entry.notes}"</span>
          )}
        </div>
      </div>
    </div>
    <button 
      onClick={() => onDelete(entry.id)}
      title="Delete record"
      className="opacity-0 group-hover:opacity-100 p-2 text-stone-600 hover:text-red-400 transition-all rounded-lg hover:bg-stone-800"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

export const HarvestTab: React.FC = () => {
  const entries = useLogbook();

  const { harvests, losses } = useMemo(() => ({
    harvests: entries.filter(e => e.type === 'harvest'),
    losses: entries.filter(e => e.type === 'lost_harvest')
  }), [entries]);

  const handleDelete = async (id: string) => {
    if (globalThis.confirm('Delete this record?')) {
      await deleteLogbookEntry(id);
      showInfo('Record removed');
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-950/20 animate-in fade-in duration-500">
      <header className="p-8 border-b border-stone-800 bg-stone-900/30 backdrop-blur-md">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black text-stone-100 uppercase tracking-tighter flex items-center gap-3">
              <History className="w-8 h-8 text-amber-500" />
              Harvest Manifest
            </h2>
            <p className="text-stone-500 text-sm mt-1 uppercase tracking-widest font-bold">The Grimoire of Yields & Failures</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-stone-900/50 border border-stone-800 px-4 py-2 rounded-2xl flex flex-col items-center min-w-[100px]">
              <span className="text-[9px] font-black text-stone-600 uppercase tracking-wider">Total Yields</span>
              <span className="text-xl font-black text-garden-400">{harvests.length}</span>
            </div>
            <div className="bg-stone-900/50 border border-stone-800 px-4 py-2 rounded-2xl flex flex-col items-center min-w-[100px]">
              <span className="text-[9px] font-black text-stone-600 uppercase tracking-wider">Total Losses</span>
              <span className="text-xl font-black text-red-400">{losses.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* SUCCESSFUL HARVESTS */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b border-garden-500/20 pb-4">
              <ShoppingBasket className="w-5 h-5 text-garden-500" />
              <h3 className="text-lg font-black text-stone-100 uppercase tracking-tighter">Golden Harvests</h3>
              <ArrowUpRight className="w-4 h-4 text-garden-500 ml-auto opacity-30" />
            </div>
            
            <div className="space-y-3">
              {harvests.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center glass-panel border border-dashed border-stone-800 rounded-3xl opacity-20">
                  <Leaf className="w-12 h-12 mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest">The granary is empty</p>
                </div>
              ) : (
                harvests.map(h => <HarvestCard key={h.id} entry={h} status="success" onDelete={handleDelete} />)
              )}
            </div>
          </section>

          {/* LOST HARVESTS */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b border-red-500/20 pb-4">
              <Skull className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-black text-stone-100 uppercase tracking-tighter">Lost Harvests</h3>
              <ArrowDownRight className="w-4 h-4 text-red-500 ml-auto opacity-30" />
            </div>

            <div className="space-y-3">
              {losses.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center glass-panel border border-dashed border-stone-800 rounded-3xl opacity-20">
                  <History className="w-12 h-12 mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest">No casualties yet</p>
                </div>
              ) : (
                losses.map(l => <HarvestCard key={l.id} entry={l} status="loss" onDelete={handleDelete} />)
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
