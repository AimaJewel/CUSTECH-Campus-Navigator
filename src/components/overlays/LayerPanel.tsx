import { memo } from 'react';
import { useUIStore } from '@/store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

const layers = [
  { id: 'buildings', label: 'Buildings', icon: '🏢', color: 'text-blue-400' },
  { id: 'roads', label: 'Roads & Paths', icon: '🛤️', color: 'text-slate-400' },
  { id: 'vegetation', label: 'Vegetation', icon: '🌳', color: 'text-green-400' },
  { id: 'labels', label: 'Labels', icon: '🏷️', color: 'text-yellow-400' },
];

export default memo(function LayerPanel() {
  const { showLayers, activeLayer, setActiveLayer } = useUIStore();
  
  const toggleLayer = (id: string) => {
    if (activeLayer.includes(id)) {
      setActiveLayer(activeLayer.filter(l => l !== id));
    } else {
      setActiveLayer([...activeLayer, id]);
    }
  };
  
  return (
    <AnimatePresence>
      {showLayers && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20 }}
          className="absolute top-[180px] right-17 z-20 w-48 bg-[#0a0e1a]/95 backdrop-blur-xl rounded-xl border border-white/6 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-white/6">
            <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">Map Layers</span>
          </div>
          <div className="p-2 space-y-1">
            {layers.map(layer => (
              <button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all ${
                  activeLayer.includes(layer.id)
                    ? 'bg-white/5'
                    : 'opacity-40 hover:opacity-60'
                }`}
              >
                <span className="text-sm">{layer.icon}</span>
                <span className="text-xs text-white/70 flex-1 text-left">{layer.label}</span>
                <div className={`w-3 h-3 rounded-sm border transition-all ${
                  activeLayer.includes(layer.id)
                    ? 'bg-cyan-500 border-cyan-400'
                    : 'border-white/20'
                }`} />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
