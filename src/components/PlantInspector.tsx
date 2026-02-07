import React, { useMemo, useState, useEffect } from 'react';
import {
  X,
  Droplets,
  Star,
  Info,
  ExternalLink,
  Calendar,
  Leaf,
  AlertCircle,
  FlaskConical,
  Users
} from 'lucide-react';
import { PlantSpecies, PlantStage, UserLocation } from '../schema/knowledge-graph';
import { calculateCurrentStage } from '../logic/lifecycle';
import { getConfidenceThreshold, isSowingSeason } from '../logic/reasoning';
import { getDatabase } from '../db';

interface PlantInspectorProps {
  plant: any; // The planted document
  catalogItem: PlantSpecies | undefined;
  companionScore: number;
  onClose: () => void;
  /**
   * If true, the inspector is rendered as a docked right-pane.
   * If false/omitted, it behaves like an overlay panel.
   */
  docked?: boolean;
}

export const PlantInspector: React.FC<PlantInspectorProps> = ({
  plant,
  catalogItem,
  companionScore,
  onClose,
  docked
}) => {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [sourcesById, setSourcesById] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchLocation = async () => {
      const db = await getDatabase();
      const settings = await db.settings.findOne('local-user').exec();
      if (settings) {
        const json = settings.toJSON();
        setUserLocation({
          id: 'user_location',
          hemisphere: json.hemisphere,
          frost_data: {} // Placeholder
        });
      }
    };
    fetchLocation();
  }, []);

  useEffect(() => {
    const loadSources = async () => {
      const db = await getDatabase();
      const docs = await db.sources.find().exec();
      const map: Record<string, any> = {};
      for (const d of docs) map[d.get('id')] = d.toJSON();
      setSourcesById(map);
    };
    loadSources();
  }, []);

  const containerClass = docked
    ? 'h-full w-full bg-stone-900/40 backdrop-blur-2xl border-l border-stone-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-300'
    : 'fixed inset-y-0 right-0 w-96 bg-stone-900/40 backdrop-blur-2xl border-l border-stone-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 animate-in slide-in-from-right duration-300';

  if (!catalogItem) return null;

  const currentStageId = calculateCurrentStage(plant.plantedDate, catalogItem.stages);
  const currentStage = catalogItem.stages.find(s => s.id === currentStageId) as PlantStage;
  const confidenceLevel = getConfidenceThreshold(catalogItem.confidence_score);

  const currentMonth = new Date().getMonth();
  const seasonalAdvice = userLocation ? isSowingSeason(catalogItem, userLocation, currentMonth) : null;

  const companions = useMemo(() => (catalogItem.companions || []).slice(), [catalogItem.companions]);
  const antagonists = useMemo(() => (catalogItem.antagonists || []).slice(), [catalogItem.antagonists]);

  const edibleParts = ((catalogItem as any).edible_parts || []) as string[];
  const toxicParts = ((catalogItem as any).toxic_parts || []) as string[];

  // Extended KB (pests/diseases/nutrients/seasonality windows)
  const [kb, setKb] = useState<any | null>(null);

  useEffect(() => {
    const loadKb = async () => {
      const db = await getDatabase();
      // heuristic mapping: try match by scientific name first, then by common name
      const sci = (catalogItem as any).scientificName;
      const common = (catalogItem as any).name;

      let doc = null;
      if (sci) {
        doc = await db.plant_kb.findOne({ selector: { scientific_name: sci } }).exec();
      }
      if (!doc && common) {
        doc = await db.plant_kb.findOne({ selector: { common_name: common } }).exec();
      }
      setKb(doc ? doc.toJSON() : null);
    };
    loadKb();
  }, [catalogItem]);

  return (
    <div className={containerClass}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-stone-800 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-stone-100 to-stone-400 bg-clip-text text-transparent">
              {catalogItem.name}
            </h2>
            <p className="text-stone-500 italic text-sm">{catalogItem.scientificName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-800 rounded-full transition-colors text-stone-400"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Sowing Season Advice */}
          {seasonalAdvice && (
            <div
              className={`p-4 rounded-2xl border flex gap-3 items-start animate-in fade-in slide-in-from-top duration-500 ${
                seasonalAdvice.eligible
                  ? 'bg-garden-900/20 border-garden-500/30 text-garden-200'
                  : 'bg-amber-900/10 border-amber-500/20 text-amber-200/80'
              }`}
            >
              <Calendar
                className={`w-5 h-5 shrink-0 ${seasonalAdvice.eligible ? 'text-garden-400' : 'text-amber-500'}`}
              />
              <div className="space-y-1">
                <h4 className="text-[10px] uppercase font-bold tracking-widest opacity-60">Seasonal Status</h4>
                <p className="text-xs leading-relaxed">{seasonalAdvice.reason}</p>
              </div>
            </div>
          )}

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-stone-800/40 rounded-2xl border border-stone-700/50">
              <div className="flex items-center gap-2 mb-2 text-garden-400">
                <Droplets className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Health</span>
              </div>
              <div className="text-xl font-semibold">{plant.healthStatus}</div>
            </div>
            <div className="p-4 bg-stone-800/40 rounded-2xl border border-stone-700/50">
              <div className="flex items-center gap-2 mb-2 text-amber-400">
                <Star className="w-4 h-4" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Harmony</span>
              </div>
              <div className="text-xl font-semibold">
                {companionScore > 0 ? `+${companionScore}` : companionScore}
              </div>
            </div>
          </div>

          {/* Lifecycle Progress */}
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-xs uppercase font-bold tracking-widest text-stone-500">Lifecycle: {currentStage.name}</h3>
              <span className="text-[10px] text-stone-600 font-mono">
                Stage {catalogItem.stages.indexOf(currentStage) + 1}/{catalogItem.stages.length}
              </span>
            </div>
            <div className="h-2 w-full bg-stone-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-garden-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-1000"
                style={{
                  width: `${((catalogItem.stages.indexOf(currentStage) + 1) / catalogItem.stages.length) * 100}%`
                }}
              />
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              Currently in the <span className="text-garden-400">{currentStage.name}</span> stage. Requires watering every{' '}
              <span className="text-garden-400">{currentStage.waterFrequencyDays} days</span>.
            </p>
          </section>

          {/* Knowledge Base (surfacing seed fields) */}
          <section className="p-4 bg-stone-900/30 rounded-2xl border border-stone-800 space-y-4">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-garden-400" />
              <h3 className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Knowledge Base</h3>
            </div>

            {catalogItem.description && (
              <p className="text-xs text-stone-300 leading-relaxed">{catalogItem.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/30">
                <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">Taxonomy</div>
                <div className="mt-2 text-[11px] text-stone-200 space-y-0.5">
                  <div><span className="text-stone-500">Family:</span> {(catalogItem as any).family || '—'}</div>
                  <div><span className="text-stone-500">Genus:</span> {(catalogItem as any).genus || '—'}</div>
                  <div><span className="text-stone-500">Species:</span> {(catalogItem as any).species || '—'}</div>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/30">
                <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">Biology</div>
                <div className="mt-2 text-[11px] text-stone-200 space-y-0.5">
                  <div><span className="text-stone-500">Life cycle:</span> {(catalogItem as any).life_cycle || '—'}</div>
                  <div><span className="text-stone-500">Habit:</span> {(((catalogItem as any).growth_habit || []) as string[]).join(', ') || '—'}</div>
                  <div><span className="text-stone-500">Photo:</span> {(catalogItem as any).photosynthesis_type || '—'}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/30">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-3.5 h-3.5 text-stone-500" />
                  <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">Sowing</div>
                </div>
                <div className="mt-2 text-[11px] text-stone-200 space-y-0.5">
                  <div><span className="text-stone-500">Method:</span> {(catalogItem as any).sowingMethod || '—'}</div>
                  <div><span className="text-stone-500">Seasons:</span> {(catalogItem.sowingSeason || []).join(', ') || '—'}</div>
                  <div><span className="text-stone-500">Pollination:</span> {(catalogItem as any).pollination_type || '—'}</div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/30">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-stone-500" />
                  <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">Edibility</div>
                </div>
                <div className="mt-2 text-[11px] text-stone-200 space-y-0.5">
                  <div><span className="text-stone-500">Edible:</span> {edibleParts.join(', ') || '—'}</div>
                  <div><span className="text-stone-500">Toxic:</span> {toxicParts.join(', ') || '—'}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/30">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-garden-400" />
                  <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">Companions</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {companions.length ? companions.map(id => (
                    <span
                      key={id}
                      className="text-[9px] px-1.5 py-0.5 rounded border border-garden-500/20 bg-garden-900/10 text-garden-200"
                    >
                      {id}
                    </span>
                  )) : <span className="text-[10px] text-stone-500">—</span>}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/30">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-red-400" />
                  <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">Antagonists</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {antagonists.length ? antagonists.map(id => (
                    <span
                      key={id}
                      className="text-[9px] px-1.5 py-0.5 rounded border border-red-500/20 bg-red-900/10 text-red-200"
                    >
                      {id}
                    </span>
                  )) : <span className="text-[10px] text-stone-500">—</span>}
                </div>
              </div>
            </div>
          </section>

          {/* Extended KB: pests / diseases / nutrients / seasonality windows */}
          {kb && (
            <section className="p-4 bg-stone-900/20 rounded-2xl border border-stone-800 space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Diagnostics Intel</h3>
              </div>

              {/* Seasonality windows */}
              {kb.seasonality && (
                <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/30">
                  <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">Seasonality</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-stone-200">
                    {Object.entries(kb.seasonality).map(([k, v]: any) => (
                      <div key={k} className="rounded-lg border border-stone-800 bg-stone-900/30 p-2">
                        <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">{k.replace('_', ' ')}</div>
                        <div className="mt-1">
                          <span className="text-stone-500">From:</span> {v?.start_month || '—'}
                          <span className="text-stone-500"> · To:</span> {v?.end_month || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/30">
                  <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">Pests</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(kb.common_pests || []).length ? (kb.common_pests || []).map((p: string) => (
                      <span key={p} className="text-[9px] px-1.5 py-0.5 rounded border border-amber-500/20 bg-amber-900/10 text-amber-200">
                        {p}
                      </span>
                    )) : <span className="text-[10px] text-stone-500">—</span>}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/30">
                  <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">Diseases</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(kb.common_diseases || []).length ? (kb.common_diseases || []).map((d: string) => (
                      <span key={d} className="text-[9px] px-1.5 py-0.5 rounded border border-red-500/20 bg-red-900/10 text-red-200">
                        {d}
                      </span>
                    )) : <span className="text-[10px] text-stone-500">—</span>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/30">
                  <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">Environment</div>
                  <div className="mt-2 text-[11px] text-stone-200 space-y-0.5">
                    <div><span className="text-stone-500">Sunlight:</span> {kb.sunlight || '—'}</div>
                    <div><span className="text-stone-500">Water:</span> {kb.water_requirements || '—'}</div>
                    <div><span className="text-stone-500">Soil:</span> {(kb.soil_type || []).join(', ') || '—'}</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/30">
                  <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">Nutrients</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(kb.nutrient_preferences || []).length ? (kb.nutrient_preferences || []).map((n: string) => (
                      <span key={n} className="text-[9px] px-1.5 py-0.5 rounded border border-purple-500/20 bg-purple-900/10 text-purple-200">
                        {n}
                      </span>
                    )) : <span className="text-[10px] text-stone-500">—</span>}
                  </div>
                </div>
              </div>

              {Array.isArray(kb.source_metadata) && kb.source_metadata.length > 0 && (
                <div className="p-3 rounded-xl border border-stone-800 bg-stone-950/30">
                  <div className="text-[9px] uppercase font-black tracking-widest text-stone-500">KB Sources</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {kb.source_metadata.map((s: any, idx: number) => (
                      <a
                        key={`${s.source_name || 'src'}-${idx}`}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[9px] text-stone-200 bg-stone-800/50 px-2 py-1 rounded-md border border-stone-700/50 hover:border-garden-500/40 hover:text-garden-200 transition-colors"
                        title={s.url}
                      >
                        {s.source_name || 'Source'} ({Math.round((s.confidence_score || 0) * 100)}%)
                        <ExternalLink className="w-2 h-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Governance / Explainability */}
          <section className="p-4 bg-garden-950/20 rounded-2xl border border-garden-900/30 space-y-3">
            <div className="flex items-center gap-2 text-garden-400 mb-1">
              <Info className="w-4 h-4" />
              <h3 className="text-[10px] uppercase font-bold tracking-widest text-garden-400">Horticultural Integrity</h3>
            </div>
            <div className="flex justify-between items-center bg-stone-900/40 p-2 rounded-lg border border-stone-800">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider">Confidence Level</span>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${
                  confidenceLevel === 'actionable'
                    ? 'bg-garden-500/20 text-garden-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {confidenceLevel}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider">Sources</span>
              <div className="flex flex-wrap gap-2">
                {catalogItem.sources.map(sourceId => {
                  const s = sourcesById[sourceId];
                  const label = s?.name || sourceId.replace('source_', '').split('_').join(' ');
                  const url = s?.url;

                  return url ? (
                    <a
                      key={sourceId}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[9px] text-stone-200 bg-stone-800/50 px-2 py-1 rounded-md border border-stone-700/50 hover:border-garden-500/40 hover:text-garden-200 transition-colors"
                      title={url}
                    >
                      {label}
                      <ExternalLink className="w-2 h-2" />
                    </a>
                  ) : (
                    <div
                      key={sourceId}
                      className="flex items-center gap-1 text-[9px] text-stone-400 bg-stone-800/50 px-2 py-1 rounded-md border border-stone-700/50"
                    >
                      {label}
                      <ExternalLink className="w-2 h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-stone-800 grid grid-cols-2 gap-3">
          <button className="py-3 bg-garden-600 hover:bg-garden-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-garden-900/20">
            Water Now
          </button>
          <button className="py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold transition-all border border-stone-700">
            Harvest
          </button>
        </div>
      </div>
    </div>
  );
};
