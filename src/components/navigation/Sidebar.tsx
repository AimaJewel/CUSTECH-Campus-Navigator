import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { buildings, buildingToNode, categoryInfo, type BuildingMeta } from '@/data/campus';
import { findPath, getRouteStats, type RoutePreference } from '@/engine/pathfinding';
import { generateTurnByTurnDirections, type NavigationInstruction, type NavigationInstructionType } from '@/utils/generateTurnByTurnDirections';
import FAQPanel from '@/components/navigation/FAQPanel';
import { useNavigationStore, useUIStore, useCameraStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

// Fuzzy search
function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

function BuildingCard({ building, onSelect, isSelected, role }: {
  building: BuildingMeta;
  onSelect: (b: BuildingMeta) => void;
  isSelected: boolean;
  role?: 'origin' | 'destination';
}) {
  const info = categoryInfo[building.category];
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(building)}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-200 ${
        isSelected
          ? 'border-cyan-500/50 bg-cyan-500/10'
          : 'border-white/5 bg-white/3 hover:bg-white/6 hover:border-white/10'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-lg mt-0.5">{info?.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white/90 truncate">{building.name}</span>
            {role && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                role === 'origin' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {role === 'origin' ? 'START' : 'END'}
              </span>
            )}
          </div>
          <p className="text-xs text-white/40 mt-0.5">{building.faculty}</p>
          {building.departments.length > 0 && (
            <p className="text-[10px] text-white/25 mt-1 truncate">
              {building.departments.slice(0, 3).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${building.color}30`, color: building.color }}>
            {info?.label}
          </span>
          <span className="text-[10px] text-white/30">{building.floors}F</span>
        </div>
      </div>
    </motion.button>
  );
}

function RouteStatsPanel({
  path,
  edges,
  totalDistance,
  estimatedWalkingTimeMinutes,
}: {
  path: import('@/data/campus').PathNode[];
  edges: import('@/data/campus').PathEdge[];
  totalDistance: number;
  estimatedWalkingTimeMinutes: number;
}) {
  const stats = useMemo(() => getRouteStats(path, edges), [path, edges]);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Distance" value={`${totalDistance}m`} icon="📏" />
        <StatBox label="Time" value={`${estimatedWalkingTimeMinutes} min`} icon="⏱️" />
        <StatBox label="Calories" value={`${stats.calories}`} icon="🔥" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Accessible" value={stats.isAccessible ? 'Yes' : 'No'} icon="♿" color={stats.isAccessible ? 'text-green-400' : 'text-red-400'} />
        <StatBox label="Shade" value={`${stats.shadedPercentage}%`} icon="🌳" />
        <StatBox label="Steps" value={`${stats.steps}`} icon="👣" />
      </div>
      
      {/* Route type breakdown */}
      <div className="flex gap-1.5 flex-wrap">
        {stats.edgeTypes.road > 0 && <Pill label={`${stats.edgeTypes.road} roads`} color="bg-slate-500/20 text-slate-400" />}
        {stats.edgeTypes.walkway > 0 && <Pill label={`${stats.edgeTypes.walkway} walkways`} color="bg-cyan-500/20 text-cyan-400" />}
        {stats.edgeTypes.shortcut > 0 && <Pill label={`${stats.edgeTypes.shortcut} shortcuts`} color="bg-amber-500/20 text-amber-400" />}
      </div>
    </motion.div>
  );
}

const directionIcons: Record<NavigationInstructionType, string> = {
  start: '●',
  straight: '↑',
  'slight-left': '↖',
  left: '←',
  'sharp-left': '↙',
  'slight-right': '↗',
  right: '→',
  'sharp-right': '↘',
  destination: '✓',
};

function TurnByTurnPanel({ instructions }: { instructions: NavigationInstruction[] }) {
  return (
    <div>
      <label className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Walking Directions</label>
      <ol className="mt-2 space-y-2">
        {instructions.map((step, index) => (
          <li key={`${step.nodeIndex}-${step.type}-${index}`} className="flex gap-2.5 rounded-lg border border-white/5 bg-white/25 p-2.5">
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              step.type === 'start' ? 'bg-green-500/15 text-green-400' :
              step.type === 'destination' ? 'bg-red-500/15 text-red-400' :
              'bg-cyan-500/15 text-cyan-400'
            }`}>
              {directionIcons[step.type]}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-5 text-white/70">{step.instruction}</p>
              {step.distance > 0 && <p className="text-[10px] text-white/30">{step.distance} m</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: string; icon: string; color?: string }) {
  return (
    <div className="bg-white/3 rounded-lg p-2.5 text-center border border-white/5">
      <span className="text-sm">{icon}</span>
      <div className={`text-sm font-bold mt-0.5 ${color || 'text-white/90'}`}>{value}</div>
      <div className="text-[10px] text-white/30 mt-0.5">{label}</div>
    </div>
  );
}

function Pill({ label, color }: { label: string; color: string }) {
  return <span className={`text-[10px] px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

const preferenceOptions: { value: RoutePreference; label: string; icon: string }[] = [
  { value: 'shortest', label: 'Shortest', icon: '📍' },
  { value: 'fastest', label: 'Fastest', icon: '⚡' },
  { value: 'accessible', label: 'Accessible', icon: '♿' },
  { value: 'shaded', label: 'Shaded', icon: '🌳' },
];

export default function Sidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'explore' | 'navigate' | 'faqs'>('explore');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  
  const {
    origin, destination, routePath, routePreference,
    setOrigin, setDestination, setRoutePath, setRoutePreference,
    isNavigating, setIsNavigating, simulationProgress, setSimulationProgress, clearRoute,
  } = useNavigationStore();
  
  const { selectedBuilding, setSelectedBuilding, toggleSidebar } = useUIStore();
  
  // Route edges for stats
  const [routeEdges, setRouteEdges] = useState<import('@/data/campus').PathEdge[]>([]);
  const directions = useMemo(() => routePath
    ? generateTurnByTurnDirections(routePath, { originName: origin?.name, destinationName: destination?.name })
    : null,
  [routePath, origin?.name, destination?.name]);
  
  // Compute route when origin/destination change
  useEffect(() => {
    if (origin && destination) {
      const fromNode = buildingToNode[origin.id];
      const toNode = buildingToNode[destination.id];
      if (fromNode && toNode) {
        const result = findPath(fromNode, toNode, routePreference);
        if (result) {
          setRoutePath(result.path);
          setRouteEdges(result.edges);
        } else {
          setRoutePath(null);
          setRouteEdges([]);
        }
      }
    }
  }, [origin, destination, routePreference, setRoutePath]);
  
  // Simulation timer
  useEffect(() => {
    if (!isNavigating) return;
    const interval = setInterval(() => {
      const next = simulationProgress + 0.005;
      if (next >= 1) {
        setSimulationProgress(1);
        setIsNavigating(false);
      } else {
        setSimulationProgress(next);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isNavigating, simulationProgress, setSimulationProgress, setIsNavigating]);
  
  const filteredBuildings = useMemo(() => {
    let result = buildings;
    if (searchQuery) {
      result = result.filter(b =>
        fuzzyMatch(searchQuery, b.name) ||
        fuzzyMatch(searchQuery, b.shortName) ||
        fuzzyMatch(searchQuery, b.faculty) ||
        b.departments.some(d => fuzzyMatch(searchQuery, d))
      );
    }
    if (categoryFilter) {
      result = result.filter(b => b.category === categoryFilter);
    }
    return result;
  }, [searchQuery, categoryFilter]);
  
  const handleSelectBuilding = useCallback((building: BuildingMeta) => {
    setSelectedBuilding(building);
    useCameraStore.setState({
      targetX: building.x + building.width / 2,
      targetY: building.y + building.height / 2,
      targetZoom: 1.5,
    });
  }, [setSelectedBuilding]);
  
  const handleSetAs = useCallback((building: BuildingMeta, role: 'origin' | 'destination') => {
    if (role === 'origin') setOrigin(building);
    else setDestination(building);
    setActiveTab('navigate');
  }, [setOrigin, setDestination]);
  
  const handleStartSimulation = useCallback(() => {
    setSimulationProgress(0);
    setIsNavigating(true);
  }, [setIsNavigating, setSimulationProgress]);
  
  return (
    <motion.aside
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute left-0 top-0 bottom-0 w-[360px] z-30 flex flex-col bg-[#0a0e1a]/95 backdrop-blur-xl border-r border-white/6"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center">
            <img
            src="/icon/campnav.png"
            alt="Campus navigation"
            className="w-16 h-16 object-contain"
          />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-white/90 tracking-wide">CUSTECH Navigator</h1>
            <p className="text-[10px] text-white/30 tracking-wider">DIGITAL CAMPUS TWIN</p>
          </div>
          <button
            onClick={toggleSidebar}
            className="w-7 h-7 rounded-lg bg-white/4 border border-white/6 flex items-center justify-center text-white/30 hover:text-white/60 transition-all"
            title="Hide Sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
        
        {/* Search */}
        <div className="mt-3 relative">
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search buildings, departments..."
            className="w-full bg-white/5 border border-white/8 rounded-lg px-3 py-2 pl-9 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.07] transition-all"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-white/30 hover:text-white/60 text-xs">✕</button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="flex mt-3 bg-white/3 rounded-lg p-0.5">
          {(['explore', 'navigate', 'faqs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-white/30 hover:text-white/50'
              }`}
            >
              {tab === 'explore' ? '🗺️ Explore' : tab === 'navigate' ? '🧭 Navigate' : 'FAQs'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        <AnimatePresence mode="wait">
          {activeTab === 'explore' ? (
            <motion.div key="explore" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Category filters */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                    !categoryFilter ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'border-white/10 text-white/30 hover:text-white/50'
                  }`}
                >
                  All
                </button>
                {Object.entries(categoryInfo).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => setCategoryFilter(categoryFilter === key ? null : key)}
                    className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                      categoryFilter === key ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'border-white/10 text-white/30 hover:text-white/50'
                    }`}
                  >
                    {info.icon} {info.label}
                  </button>
                ))}
              </div>
              
              {/* Quick suggestions when no search */}
              {!searchQuery && !categoryFilter && (
                <div className="mb-4">
                  <span className="text-[10px] text-white/20 uppercase tracking-wider font-semibold">Smart Suggestions</span>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {[
                      { label: '📚 Nearest Library', id: 'library' },
                      { label: '🍽️ Cafeteria', id: 'cafeteria' },
                      { label: '🏥 Health Center', id: 'clinic' },
                      { label: '💻 ICT Center', id: 'ict-center' },
                      { label: '🎓 Computer Science', id: 'comp-sci' },
                      { label: '⚽ Sports', id: 'sports-complex' },
                    ].map(s => {
                      const b = buildings.find(b => b.id === s.id);
                      return b ? (
                        <button
                          key={s.id}
                          onClick={() => handleSelectBuilding(b)}
                          className="text-left p-2 rounded-lg bg-white/2 border border-white/4 hover:bg-white/5 hover:border-white/8 transition-all"
                        >
                          <span className="text-[11px] text-white/50">{s.label}</span>
                        </button>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Building list */}
              <div className="space-y-2">
                <span className="text-[10px] text-white/20 uppercase tracking-wider font-semibold">
                  {searchQuery ? `Results (${filteredBuildings.length})` : `All Buildings (${filteredBuildings.length})`}
                </span>
                {filteredBuildings.map(b => (
                  <BuildingCard
                    key={b.id}
                    building={b}
                    onSelect={handleSelectBuilding}
                    isSelected={selectedBuilding?.id === b.id}
                  />
                ))}
                {filteredBuildings.length === 0 && (
                  <p className="text-center text-white/20 text-sm py-8">No buildings found</p>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'navigate' ? (
            <motion.div key="navigate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Origin / Destination selectors */}
              <div className="space-y-2">
                <label className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">From</label>
                <button
                  onClick={() => {
                    if (selectedBuilding) setOrigin(selectedBuilding);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                    origin
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  {origin ? (
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center text-[10px] text-green-400 font-bold">A</span>
                      <span className="text-sm text-white/80">{origin.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); setOrigin(null); }} className="ml-auto text-white/20 hover:text-white/50 text-xs">✕</button>
                    </div>
                  ) : (
                    <span className="text-xs text-white/20">
                      {selectedBuilding ? `Click to set "${selectedBuilding.shortName}" as start` : 'Select a building first'}
                    </span>
                  )}
                </button>
                
                <label className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">To</label>
                <button
                  onClick={() => {
                    if (selectedBuilding) setDestination(selectedBuilding);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                    destination
                      ? 'border-red-500/30 bg-red-500/5'
                      : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                  }`}
                >
                  {destination ? (
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] text-red-400 font-bold">B</span>
                      <span className="text-sm text-white/80">{destination.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); setDestination(null); }} className="ml-auto text-white/20 hover:text-white/50 text-xs">✕</button>
                    </div>
                  ) : (
                    <span className="text-xs text-white/20">
                      {selectedBuilding ? `Click to set "${selectedBuilding.shortName}" as end` : 'Select a building first'}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Route preference */}
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Route Type</label>
                <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                  {preferenceOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setRoutePreference(opt.value)}
                      className={`p-2 rounded-lg text-center border transition-all ${
                        routePreference === opt.value
                          ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                          : 'border-white/5 bg-white/[0.02] text-white/30 hover:text-white/50'
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <div className="text-[9px] mt-0.5">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Route stats */}
              {routePath && routeEdges.length > 0 && (
                <>
                  {directions && (
                    <>
                      <RouteStatsPanel
                        path={routePath}
                        edges={routeEdges}
                        totalDistance={directions.totalDistance}
                        estimatedWalkingTimeMinutes={directions.estimatedWalkingTimeMinutes}
                      />
                      <TurnByTurnPanel instructions={directions.instructions} />
                    </>
                  )}
                  
                  {/* Simulation controls */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={handleStartSimulation}
                        disabled={isNavigating}
                        className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition-all"
                      >
                        {isNavigating ? '⏳ Simulating...' : '▶ Simulate Walk'}
                      </button>
                      {isNavigating && (
                        <button
                          onClick={() => setIsNavigating(false)}
                          className="px-4 py-2.5 rounded-lg border border-white/10 text-white/50 text-sm hover:text-white/70"
                        >
                          ⏸
                        </button>
                      )}
                    </div>
                    
                    {/* Progress bar */}
                    {simulationProgress > 0 && (
                      <div className="w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                          style={{ width: `${simulationProgress * 100}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Route timeline */}
                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Route Path</label>
                    <div className="mt-2 space-y-0">
                      {routePath.filter(n => n.label).map((node, i, arr) => (
                        <div key={node.id} className="flex items-start gap-2.5">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full border-2 ${
                              i === 0 ? 'bg-green-500 border-green-400' :
                              i === arr.length - 1 ? 'bg-red-500 border-red-400' :
                              'bg-cyan-500/50 border-cyan-400/50'
                            }`} />
                            {i < arr.length - 1 && <div className="w-0.5 h-6 bg-white/10" />}
                          </div>
                          <span className="text-xs text-white/50 -mt-0.5">{node.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {origin && destination && !routePath && (
                <div className="text-center text-amber-400/60 text-xs py-4">
                  ⚠️ No route found between these locations
                </div>
              )}
              
              {(origin || destination) && (
                <button
                  onClick={clearRoute}
                  className="w-full py-2 rounded-lg border border-white/10 text-white/30 text-xs hover:text-white/50 hover:border-white/20 transition-all"
                >
                  Clear Route
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="faqs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <FAQPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Selected building detail panel */}
      <AnimatePresence>
        {selectedBuilding && activeTab === 'explore' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="border-t border-white/[0.06] p-4 bg-[#0c1020]/95 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white/90">{selectedBuilding.name}</h3>
                <p className="text-xs text-white/40">{selectedBuilding.faculty}</p>
              </div>

              <button
                onClick={() => setSelectedBuilding(null)}
                className="text-white/20 hover:text-white/50 text-xs p-1"
              >
                ✕
              </button>
            </div>
            
{selectedBuilding.image && (
  <div className="overflow-hidden rounded-xl border border-white/10">
    <img
      src={selectedBuilding.image}
      alt={selectedBuilding.name}
      className="w-full h-44 object-cover"
    />
  </div>
)}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/[0.03] rounded p-2">
                <span className="text-white/30">Hours</span>
                <p className="text-white/70 font-medium">{selectedBuilding.openingHours}</p>
              </div>
              <div className="bg-white/[0.03] rounded p-2">
                <span className="text-white/30">Floors</span>
                <p className="text-white/70 font-medium">{selectedBuilding.floors}</p>
              </div>
              <div className="bg-white/[0.03] rounded p-2">
                <span className="text-white/30">Accessible</span>
                <p className={`font-medium ${selectedBuilding.accessibility ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedBuilding.accessibility ? 'Yes ♿' : 'No'}
                </p>
              </div>
              <div className="bg-white/[0.03] rounded p-2">
                <span className="text-white/30">Occupancy</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="flex-1 bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${selectedBuilding.occupancyLevel * 100}%`,
                      backgroundColor: selectedBuilding.occupancyLevel > 0.8 ? '#ef4444' : selectedBuilding.occupancyLevel > 0.5 ? '#f59e0b' : '#22c55e',
                    }} />
                  </div>
                  <span className="text-white/50 text-[10px]">{Math.round(selectedBuilding.occupancyLevel * 100)}%</span>
                </div>
              </div>
            </div>
            
            {selectedBuilding.departments.length > 0 && (
              <div>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Departments</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedBuilding.departments.map(d => (
                    <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-white/40">{d}</span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={() => handleSetAs(selectedBuilding, 'origin')}
                className="flex-1 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium hover:bg-green-500/20 transition-all"
              >
                📍 Set as Start
              </button>
              <button
                onClick={() => handleSetAs(selectedBuilding, 'destination')}
                className="flex-1 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all"
              >
                🏁 Set as End
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}
