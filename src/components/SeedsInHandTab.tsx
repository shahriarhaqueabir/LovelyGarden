import React, { useState } from 'react';
import { Package, Search, Droplets, Sun, Leaf, Tag } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { PlantSpecies } from '../schema/knowledge-graph';

interface SeedsInHandTabProps {
  catalog: PlantSpecies[];
}

export const SeedsInHandTab: React.FC<SeedsInHandTabProps> = ({ catalog }) => {
  const inventory = useInventory();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  // Get full plant details for inventory items
  const inventoryWithDetails = inventory.map(invItem => {
    const catalogItem = catalog.find(c => c.id === invItem.catalogId);
    return {
      ...invItem,
      ...catalogItem
    };
  }).filter(item => item); // Remove items that don't have catalog details

  // Filter and search
  const filteredItems = inventoryWithDetails.filter(item => {
    const matchesSearch = (item.name || '').toLowerCase().includes(query.toLowerCase()) ||
                         (item.scientificName || '').toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'all' || (item.categories && item.categories.includes(filter as any));
    return matchesSearch && matchesFilter;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') {
      return (a.name || '').localeCompare(b.name || '');
    } else if (sortBy === 'type') {
      return (a.life_cycle || '').localeCompare(b.life_cycle || '');
    } else if (sortBy === 'date') {
      return b.acquiredDate - a.acquiredDate;
    }
    return 0;
  });

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set(catalog.flatMap(p => p.categories)));

  return (
    <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 p-6 overflow-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-6 h-6 text-garden-400" />
          <h1 className="text-xl font-bold text-stone-100">Bag</h1>
        </div>
        <p className="text-stone-400 text-sm">Your current collection of seeds ready for planting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-4 bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bag..."
                className="w-full pl-10 pr-4 py-2 bg-stone-900/50 border border-stone-800 rounded-lg text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-garden-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 bg-stone-900/50 border border-stone-800 rounded-lg text-sm text-stone-200 focus:outline-none focus:ring-1 focus:ring-garden-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-stone-900/50 border border-stone-800 rounded-lg text-sm text-stone-200 focus:outline-none focus:ring-1 focus:ring-garden-500"
              >
                <option value="name">Sort by Name</option>
                <option value="type">Sort by Type</option>
                <option value="date">Sort by Acquired</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedItems.map((item) => {
              const catalogItem = catalog.find(c => c.id === item.catalogId);
              return (
                <div key={item.id} className="p-4 bg-stone-800/20 rounded-xl border border-stone-700/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-stone-100">{item.name}</h3>
                      <p className="text-xs text-stone-500 italic">{item.scientificName}</p>
                    </div>
                    <div className="flex gap-1">
                      {catalogItem?.categories.map(cat => (
                        <span key={cat} className="text-[9px] px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/50 text-stone-400">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 text-xs text-stone-400">
                      <Sun className="w-3 h-3" />
                      <span>Full</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-400">
                      <Droplets className="w-3 h-3" />
                      <span>Moderate</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-stone-400">
                      <Leaf className="w-3 h-3" />
                      <span>{catalogItem?.life_cycle || 'Annual'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-stone-800">
                    <p className="text-xs text-stone-500">
                      Acquired: {new Date(item.acquiredDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-stone-500">
                      Ready to plant in your garden
                    </p>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 py-2 bg-garden-600 hover:bg-garden-500 text-stone-950 font-bold rounded-lg text-xs uppercase tracking-widest transition-all">
                      Plant Now
                    </button>
                    <button className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg transition-colors">
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {sortedItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-stone-700 mx-auto mb-4" />
              <p className="text-stone-500 text-lg">Bag is empty</p>
              <p className="text-stone-600 mt-2">Visit the seed store to acquire more seeds</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto text-xs text-stone-600 p-4 bg-stone-900/20 rounded-xl border border-stone-800">
        <p>These are the seeds you currently have available to plant in your garden.</p>
      </div>
    </div>
  );
};