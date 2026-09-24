import { memo, useState, useCallback, useEffect, useRef } from 'react';
import { buildings, categoryInfo, type BuildingMeta } from '@/data/campus';
import { useUIStore, useCameraStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

const quickActions = [
  { label: 'Nearest Cafeteria', icon: '🍽️', category: 'facility', buildingId: 'cafeteria' },
  { label: 'University Library', icon: '📚', category: 'admin', buildingId: 'library' },
  { label: 'Health Center', icon: '🏥', category: 'facility', buildingId: 'clinic' },
  { label: 'Sports Complex', icon: '⚽', category: 'sports', buildingId: 'sports-complex' },
  { label: 'ICT Center', icon: '💻', category: 'admin', buildingId: 'ict-center' },
  { label: 'Main Gate', icon: '🚪', category: 'gate', buildingId: 'main-gate' },
];

export default memo(function QuickSearch() {
  const { showSearch, toggleSearch, setSelectedBuilding } = useUIStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
      }
      if (e.key === 'Escape' && showSearch) toggleSearch();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSearch, toggleSearch]);
  
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [showSearch]);
  
  const results = query
    ? buildings.filter(b =>
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.shortName.toLowerCase().includes(query.toLowerCase()) ||
        b.faculty.toLowerCase().includes(query.toLowerCase()) ||
        b.departments.some(d => d.toLowerCase().includes(query.toLowerCase()))
      )
    : [];
  
  const handleSelect = useCallback((building: BuildingMeta) => {
    setSelectedBuilding(building);
    useCameraStore.setState({
      targetX: building.x + building.width / 2,
      targetY: building.y + building.height / 2,
      targetZoom: 1.5,
    });
    toggleSearch();
  }, [setSelectedBuilding, toggleSearch]);
  
  const handleQuickAction = useCallback((buildingId: string) => {
    const b = buildings.find(b => b.id === buildingId);
    if (b) handleSelect(b);
  }, [handleSelect]);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const items = query ? results : quickActions;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (query && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else if (!query && quickActions[selectedIndex]) {
        handleQuickAction(quickActions[selectedIndex].buildingId);
      }
    }
  }, [query, results, selectedIndex, handleSelect, handleQuickAction]);
  
  return (
    <AnimatePresence>
      {showSearch && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={toggleSearch}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-[500px] max-w-[90vw] z-50 bg-[#0c1020] border border-white/8 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6">
              <svg className="w-5 h-5 text-cyan-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search buildings, departments, facilities..."
                className="flex-1 bg-transparent text-sm text-white/80 placeholder:text-white/20 outline-none"
              />
              <span className="text-[9px] text-white/20 px-1.5 py-0.5 rounded border border-white/10">ESC</span>
            </div>
            
            {/* Results */}
            <div className="max-h-[400px] overflow-y-auto p-2">
              {query ? (
                results.length > 0 ? (
                  <div className="space-y-0.5">
                    {results.map((b, i) => {
                      const info = categoryInfo[b.category];
                      return (
                        <button
                          key={b.id}
                          onClick={() => handleSelect(b)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                            i === selectedIndex ? 'bg-cyan-500/10' : 'hover:bg-white/3'
                          }`}
                        >
                          <span className="text-lg">{info?.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-white/80">{b.name}</span>
                            <p className="text-[10px] text-white/30">{b.faculty}</p>
                          </div>
                          <span className="text-[10px] text-white/20">{b.shortName}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-white/20 text-sm py-6">No results found</p>
                )
              ) : (
                <div>
                  <span className="text-[10px] text-white/20 px-3 uppercase tracking-wider">Quick Actions</span>
                  <div className="mt-1.5 space-y-0.5">
                    {quickActions.map((action, i) => (
                      <button
                        key={action.buildingId}
                        onClick={() => handleQuickAction(action.buildingId)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                          i === selectedIndex ? 'bg-cyan-500/10' : 'hover:bg-white/3'
                        }`}
                      >
                        <span className="text-lg">{action.icon}</span>
                        <span className="text-sm text-white/60">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/6 flex items-center gap-4">
              <span className="text-[9px] text-white/15">↑↓ navigate</span>
              <span className="text-[9px] text-white/15">↵ select</span>
              <span className="text-[9px] text-white/15">⌘K open</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
