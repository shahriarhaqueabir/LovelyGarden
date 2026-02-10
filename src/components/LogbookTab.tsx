import React, { useState } from 'react';
import { ShoppingCart, Calendar, Tag, Plus, ScrollText, History, Package, Edit, Trash, X } from 'lucide-react';
import { logUserPurchase, updateLogbookEntry, deleteLogbookEntry } from '../db/queries';
import { useLogbook } from '../hooks/useLogbook';
import { showSuccess, showError, showInfo } from '../lib/toast';
import { format } from 'date-fns';
import type { LogbookDocument } from '../db/types';

interface LogbookFormState {
  name: string;
  category: string;
  date: string;
  notes: string;
}

const INITIAL_FORM_STATE: LogbookFormState = {
  name: '',
  category: 'supplies',
  date: format(new Date(), 'yyyy-MM-dd'),
  notes: ''
};

export const LogbookTab: React.FC = () => {
  const entries = useLogbook();
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LogbookFormState>(INITIAL_FORM_STATE);

  const resetForm = () => {
    setFormData(INITIAL_FORM_STATE);
    setEditingId(null);
    setModalMode('add');
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (entry: LogbookDocument) => {
    setFormData({
      name: entry.itemName,
      category: entry.category || 'supplies',
      date: format(entry.date, 'yyyy-MM-dd'),
      notes: entry.notes || ''
    });
    setEditingId(entry.id);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const timestamp = new Date(formData.date).getTime();
      
      if (modalMode === 'add') {
        await logUserPurchase(formData.name, formData.category, timestamp, formData.notes);
        showSuccess('Entry added to Logbook');
      } else if (modalMode === 'edit' && editingId) {
        await updateLogbookEntry(editingId, {
          itemName: formData.name,
          category: formData.category,
          date: timestamp,
          notes: formData.notes
        });
        showSuccess('Entry updated');
      }
      
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error(err);
      showError(`Failed to ${modalMode} entry`);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (globalThis.confirm(`Are you sure you want to delete the entry for "${name}"?`)) {
       try {
         await deleteLogbookEntry(id);
         showInfo('Entry deleted');
       } catch (err) {
         console.error(err);
         showError('Failed to delete entry');
       }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="flex flex-col h-full bg-stone-950/20 animate-in fade-in duration-500">
      <header className="p-8 border-b border-stone-800 bg-stone-900/30 backdrop-blur-md flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-stone-100 uppercase tracking-tighter flex items-center gap-3">
            <ScrollText className="w-8 h-8 text-garden-500" />
            Gardener's Logbook
          </h2>
          <p className="text-stone-500 text-sm mt-1 uppercase tracking-widest font-bold">Chronicle of Acquisitions & Investments</p>
        </div>
        <button 
          onClick={openAddModal}
          className="px-6 py-3 bg-garden-600 hover:bg-garden-500 text-stone-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Purchase
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-20">
              <History className="w-16 h-16 mb-4" />
              <p className="text-xl font-bold uppercase tracking-widest">No entries recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div 
                  key={entry.id}
                  className="glass-panel border border-stone-800 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between hover:border-stone-700 transition-all group gap-4 md:gap-0"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      entry.type === 'seed_purchase' ? 'bg-garden-500/10 text-garden-500' : 
                      entry.type === 'planting' ? 'bg-green-500/10 text-green-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {entry.type === 'seed_purchase' ? <Package className="w-6 h-6" /> : 
                       entry.type === 'planting' ? <Plus className="w-6 h-6" /> :
                       <ShoppingCart className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-stone-200">{entry.itemName}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-900 text-stone-500 border border-stone-800 uppercase font-black tracking-widest">
                          {entry.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <p className="text-xs text-stone-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-600" />
                          {format(entry.date, 'PPP')}
                        </p>
                        {entry.vendor && (
                          <p className="text-xs text-stone-500 flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-stone-600" />
                            {entry.vendor}
                          </p>
                        )}
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          entry.type === 'seed_purchase' ? 'border-garden-500/20 text-garden-400 bg-garden-500/5' : 
                          entry.type === 'planting' ? 'border-green-500/20 text-green-400 bg-green-500/5' :
                          'border-stone-700 text-stone-500 bg-stone-900/40'
                        }`}>
                          {entry.type === 'seed_purchase' ? 'Catalog Sync' : 
                           entry.type === 'planting' ? 'Activity' : 
                           'Manual Entry'}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-xs text-stone-400 mt-3 italic border-l-2 border-stone-800 pl-3">"{entry.notes}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                     <button 
                       onClick={() => openEditModal(entry)}
                       className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-stone-500 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                       title="Edit Entry"
                     >
                       <Edit className="w-4 h-4" />
                     </button>
                     <button 
                       onClick={() => handleDelete(entry.id, entry.itemName)}
                       className="p-2 bg-stone-900 border border-stone-800 rounded-lg text-stone-500 hover:text-red-400 hover:bg-stone-800 transition-colors"
                       title="Delete Entry"
                     >
                       <Trash className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit}>
              <div className="p-8 border-b border-stone-800 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-stone-100 uppercase tracking-tighter">
                    {modalMode === 'add' ? 'New Purchase' : 'Edit Entry'}
                  </h3>
                  <p className="text-stone-500 text-xs mt-1 uppercase tracking-widest font-bold">
                    {modalMode === 'add' ? 'Documenting external assets' : 'Updating log records'}
                  </p>
                </div>
                <button type="button" onClick={closeModal} className="text-stone-500 hover:text-stone-300" aria-label="Close modal">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label htmlFor="item-name" className="text-[10px] font-black uppercase tracking-widest text-stone-500">Item Name</label>
                  <input 
                    id="item-name"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Organic Fertilizer, Pruning Shears"
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-700 outline-none focus:border-garden-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="item-category" className="text-[10px] font-black uppercase tracking-widest text-stone-500">Category</label>
                    <select 
                      id="item-category"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-100 outline-none focus:border-garden-500 transition-colors appearance-none"
                    >
                      <option value="supplies">Supplies</option>
                      <option value="tools">Tools</option>
                      <option value="equipment">Equipment</option>
                      <option value="seeds">Seeds (Other)</option>
                      <option value="plants">Plants</option>
                      <option value="misc">Miscellaneous</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="item-date" className="text-[10px] font-black uppercase tracking-widest text-stone-500">Date</label>
                    <input 
                      id="item-date"
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-100 outline-none focus:border-garden-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="item-notes" className="text-[10px] font-black uppercase tracking-widest text-stone-500">Notes</label>
                  <textarea 
                    id="item-notes"
                    value={formData.notes}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    placeholder="Merchant info, price, or specific details..."
                    rows={3}
                    className="w-full bg-stone-950 border border-stone-800 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder:text-stone-700 outline-none focus:border-garden-500 transition-colors resize-none"
                  />
                </div>
              </div>

              <div className="p-8 bg-stone-900/50 border-t border-stone-800 flex gap-4">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 bg-stone-800 hover:bg-stone-700 text-stone-400 font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-garden-600 hover:bg-garden-500 text-stone-950 font-black rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-garden-500/20"
                >
                  {modalMode === 'add' ? 'Save Record' : 'Update Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
