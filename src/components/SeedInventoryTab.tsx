import React, { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Package, Search, Droplets, Sun, Leaf, Info, Calendar, Wrench } from 'lucide-react';
import { useInventory } from '../hooks/useInventory';
import { PlantSpecies, Season, GrowthStageId } from '../schema/knowledge-graph';
import { DetailModal } from './SeedStore';

// Define the expanded plant knowledge base interface
interface ExpandedPlantKB {
  plant_id: string;
  common_name: string;
  scientific_name: string;
  type: string;
  family: string;
  growth_stage: string[];
  stages: Array<{
    id: string;
    name: string;
    durationDays: number;
    waterFrequencyDays: number;
    imageAssetId?: string;
  }>;
  seasonality?: {
    sowing?: { start_month: string; end_month: string };
    harvest?: { start_month: string; end_month: string };
  };
  sowingSeason: string[];
  sowingMethod: string;
  sunlight?: string;
  water_requirements?: string;
  soil_type?: string[];
  companion_plants?: string[];
  incompatible_plants?: string[];
  common_pests?: string[];
  common_diseases?: string[];
  nutrient_preferences?: string[];
  notes?: string;
  source_metadata?: Array<{
    source_name: string;
    url?: string;
    confidence_score?: number;
  }>;
}

interface SeedInventoryTabProps {
  catalog: PlantSpecies[];
}

export const SeedInventoryTab: React.FC<SeedInventoryTabProps> = ({ catalog }) => {
  const [expandedPlantKB, setExpandedPlantKB] = useState<Record<string, ExpandedPlantKB>>({});
  const inventory = useInventory();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [selectedPlant, setSelectedPlant] = useState<PlantSpecies | null>(null);

  // Load expanded plant knowledge base from plants-kb.json
  useEffect(() => {
    const loadExpandedPlantKB = async () => {
      try {
        const response = await fetch('/data/plants-kb.json');
        const data = await response.json();
        const plantsArray = Array.isArray(data) ? data : (data.plants || []);
        
        const kbMap: Record<string, ExpandedPlantKB> = {};
        plantsArray.forEach((plant: ExpandedPlantKB) => {
          kbMap[plant.plant_id] = plant;
        });
        
        setExpandedPlantKB(kbMap);
      } catch (error) {
        console.error('Failed to load expanded plant knowledge base:', error);
      }
    };

    loadExpandedPlantKB();
  }, []);

  // Get full plant details for inventory items (combining catalog and expanded KB)
  const inventoryWithDetails = inventory.map(invItem => {
    const catalogItem = catalog.find(c => c.id === invItem.catalogId);
    const expandedItem = expandedPlantKB[invItem.catalogId];
    
    return {
      ...invItem,
      ...catalogItem,
      ...expandedItem, // Add expanded knowledge base data
      // Override with expanded data where available
      name: expandedItem?.common_name || catalogItem?.name || invItem.catalogId,
      scientificName: expandedItem?.scientific_name || catalogItem?.scientificName || '',
      type: expandedItem?.type || catalogItem?.categories?.[0] || 'unknown',
      family: expandedItem?.family || catalogItem?.family || '',
      sunlight: expandedItem?.sunlight || catalogItem?.sunlight || 'unknown',
      water_requirements: expandedItem?.water_requirements || catalogItem?.water_requirements || 'unknown',
      soil_type: expandedItem?.soil_type || catalogItem?.soil_type || [],
      seasonality: expandedItem?.seasonality || catalogItem?.seasonality,
      sowingSeason: expandedItem?.sowingSeason || catalogItem?.sowingSeason || [],
      sowingMethod: expandedItem?.sowingMethod || catalogItem?.sowingMethod || 'Direct',
      companion_plants: expandedItem?.companion_plants || catalogItem?.companions || [],
      incompatible_plants: expandedItem?.incompatible_plants || catalogItem?.antagonists || [],
      common_pests: expandedItem?.common_pests || catalogItem?.common_pests || [],
      common_diseases: expandedItem?.common_diseases || catalogItem?.common_diseases || [],
      nutrient_preferences: expandedItem?.nutrient_preferences || catalogItem?.nutrient_preferences || [],
      notes: expandedItem?.notes || catalogItem?.description || '',
    };
  }).filter(item => item); // Remove items that don't have catalog details

  // Filter and search
  const filteredItems = inventoryWithDetails.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(query.toLowerCase()) ||
                         item.scientificName.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'all' ||
                         (item.categories && item.categories.some(cat => cat.includes(filter))) ||
                         item.type?.toLowerCase().includes(filter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'type') {
      return (a.type || '').localeCompare(b.type || '');
    } else if (sortBy === 'date') {
      return b.acquiredDate - a.acquiredDate;
    }
    return 0;
  });

  // Virtualization setup
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: sortedItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // Estimated height of each card
    overscan: 5,
  });

  // Get unique categories for filter dropdown
  const categories = Array.from(new Set([
    ...catalog.flatMap(p => p.categories),
    ...Object.values(expandedPlantKB).map(p => p.type)
  ].filter(Boolean)));

  // Helper function to get sunlight icon
  const getSunlightIcon = (sunlight: string) => {
    switch (sunlight) {
      case 'full_sun':
        return <Sun className="w-3 h-3 text-amber-400" />;
      case 'partial_sun':
      case 'partial_shade':
        return <Sun className="w-3 h-3 text-yellow-300" />;
      case 'full_shade':
        return <Sun className="w-3 h-3 text-stone-500" />;
      default:
        return <Sun className="w-3 h-3 text-stone-500" />;
    }
  };

  // Helper function to get water icon
  const getWaterIcon = (water: string) => {
    switch (water) {
      case 'high':
        return <Droplets className="w-3 h-3 text-blue-400" />;
      case 'moderate':
        return <Droplets className="w-3 h-3 text-blue-300" />;
      case 'low':
        return <Droplets className="w-3 h-3 text-blue-200" />;
      default:
        return <Droplets className="w-3 h-3 text-stone-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0c0a09] text-stone-100 p-6 overflow-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Package className="w-6 h-6 text-garden-400" />
          <h1 className="text-xl font-bold text-stone-100">Seed Vault</h1>
        </div>
        <p className="text-stone-400 text-sm">Your secure collection of acquired botanical assets</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-1 bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
          <h2 className="text-lg font-bold text-stone-100 mb-4">Current Collection</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-stone-800/30 rounded-lg">
              <span className="text-stone-300">Total Seeds</span>
              <span className="font-bold text-garden-400">{inventory.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-stone-800/30 rounded-lg">
              <span className="text-stone-300">Ready to Plant</span>
              <span className="font-bold text-garden-400">{inventory.length}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-stone-800/30 rounded-lg">
              <span className="text-stone-300">Vegetables</span>
              <span className="font-bold text-garden-400">
                {inventory.filter(i => {
                  const cat = catalog.find(c => c.id === i.catalogId);
                  return cat && cat.categories.includes('vegetable');
                }).length}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-stone-800/30 rounded-lg">
              <span className="text-stone-300">Herbs</span>
              <span className="font-bold text-garden-400">
                {inventory.filter(i => {
                  const cat = catalog.find(c => c.id === i.catalogId);
                  return cat && cat.categories.includes('herb');
                }).length}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-stone-900/30 rounded-2xl border border-stone-800 p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search seeds..."
                className="w-full pl-10 pr-4 py-2 bg-stone-900/50 border border-stone-800 rounded-lg text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-garden-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                title="Filter by category"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 bg-stone-900/50 border border-stone-800 rounded-lg text-sm text-stone-200 focus:outline-none focus:ring-1 focus:ring-garden-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat?.charAt(0).toUpperCase() + cat?.slice(1)}</option>
                ))}
              </select>

              <select
                title="Sort by"
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

          <div 
            ref={parentRef}
            className="overflow-auto max-h-[600px]"
          >
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const item = sortedItems[virtualItem.index];
                const catalogItem = catalog.find(c => c.id === item.catalogId);

                return (
                  <div
                    key={item.id}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="p-2"
                  >
                    <div
                      className="p-4 bg-stone-800/20 rounded-xl border border-stone-700/30 hover:border-garden-700/50 cursor-pointer transition-all group h-full"
                      onClick={() => {
                        if (catalogItem) {
                          const expanded = expandedPlantKB[item.catalogId];
                          setSelectedPlant({
                            ...catalogItem,
                            sowingSeason: (expanded?.sowingSeason as Season[]) || catalogItem.sowingSeason || [],
                            sowingMethod: (expanded?.sowingMethod as "Direct" | "Transplant") || catalogItem.sowingMethod || 'Direct',
                            stages: expanded?.stages?.map(stage => ({
                              id: stage.id as GrowthStageId,
                              name: stage.name,
                              durationDays: stage.durationDays,
                              waterFrequencyDays: stage.waterFrequencyDays,
                              imageAssetId: stage.imageAssetId || 'generic_image'
                            })) || catalogItem.stages || []
                          });
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-stone-100 group-hover:text-garden-400 transition-colors">{item.name}</h3>
                          <p className="text-xs text-stone-500 italic">{item.scientificName}</p>
                        </div>
                        <div className="flex gap-1">
                          <div className="p-1.5 bg-stone-900 border border-stone-800 rounded-lg text-stone-600 group-hover:text-garden-400 transition-colors">
                            <Info className="w-3.5 h-3.5" />
                          </div>
                          {((item.categories || []) as string[]).concat(item.type ? [item.type] : []).map((cat, index) => (
                            <span key={`${cat}-${index}`} className="text-[9px] px-1.5 py-0.5 rounded border border-stone-800 bg-stone-900/50 text-stone-400">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <div className="flex items-center gap-1 text-xs text-stone-400">
                          {getSunlightIcon(item.sunlight)}
                          <span className="capitalize">{item.sunlight?.replace('_', ' ') || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-stone-400">
                          {getWaterIcon(item.water_requirements)}
                          <span className="capitalize">{item.water_requirements || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-stone-400">
                          <Leaf className="w-3 h-3" />
                          <span>{item.life_cycle || 'Annual'}</span>
                        </div>
                      </div>

                      {/* Show sowing season if available */}
                      {item.seasonality?.sowing && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-stone-500">
                          <Calendar className="w-3 h-3" />
                          <span>Sow: {item.seasonality.sowing.start_month} - {item.seasonality.sowing.end_month}</span>
                        </div>
                      )}

                      {/* Show soil type if available */}
                      {item.soil_type && item.soil_type.length > 0 && (
                        <div className="mt-2 text-xs text-stone-500 truncate">
                          <span className="inline-flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            <span>Soil: {item.soil_type.slice(0, 2).join(', ')}</span>
                            {item.soil_type.length > 2 && <span>+{item.soil_type.length - 2}</span>}
                          </span>
                        </div>
                      )}

                      <div className="mt-3 pt-3 border-t border-stone-800">
                        <p className="text-xs text-stone-500">
                          Acquired: {new Date(item.acquiredDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {sortedItems.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-stone-700 mx-auto mb-4" />
              <p className="text-stone-500 text-lg">No seeds found</p>
              <p className="text-stone-600 mt-2">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto text-xs text-stone-600 p-4 bg-stone-900/20 rounded-xl border border-stone-800">
        <p>Your seed vault contains all the seeds you've acquired for planting in your garden.</p>
      </div>

      {selectedPlant && (
        <DetailModal
          plant={selectedPlant}
          isOpen={!!selectedPlant}
          onClose={() => setSelectedPlant(null)}
        />
      )}
    </div>
  );
};
