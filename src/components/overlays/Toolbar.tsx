import { memo } from 'react';
import { useCameraStore, useUIStore } from '@/store/useStore';
import { motion } from 'framer-motion';

const ToolButton = memo(function ToolButton({
  icon, label, onClick, active, badge
}: {
  icon: string; label: string; onClick: () => void; active?: boolean; badge?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        active
          ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400'
          : 'bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
      }`}
      title={label}
    >
      <span className="text-base">{icon}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-500 text-[8px] text-white flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
      <span className="absolute left-full ml-2 px-2 py-1 text-[10px] text-white/70 bg-[#0a0e1a] border border-white/10 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
        {label}
      </span>
    </motion.button>
  );
});

export default memo(function Toolbar() {
  const { toggleSidebar, toggleMinimap, toggleLayers, toggleColorTheme, showSidebar, showMinimap, showLayers, colorTheme } = useUIStore();
  
  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
      {/* Zoom controls */}
      <div className="flex flex-col gap-1 bg-[#0a0e1a]/80 backdrop-blur-md rounded-xl border border-white/[0.06] p-1.5">
        <ToolButton icon="+" label="Zoom In" onClick={() => useCameraStore.setState(s => ({ targetZoom: Math.min(3, s.targetZoom * 1.2) }))} />
        <ToolButton icon="−" label="Zoom Out" onClick={() => useCameraStore.setState(s => ({ targetZoom: Math.max(0.3, s.targetZoom * 0.8) }))} />
        <ToolButton icon="⟐" label="Reset View" onClick={() => useCameraStore.setState({ targetX: 600, targetY: 450, targetZoom: 0.7 })} />
      </div>
      
      {/* Toggle controls */}
      <div className="flex flex-col gap-1 bg-[#0a0e1a]/80 backdrop-blur-md rounded-xl border border-white/[0.06] p-1.5">
        <ToolButton icon="☰" label="Toggle Sidebar" onClick={toggleSidebar} active={showSidebar} />
        <ToolButton icon="◻" label="Toggle Minimap" onClick={toggleMinimap} active={showMinimap} />
        <ToolButton icon="◈" label="Toggle Layers" onClick={toggleLayers} active={showLayers} />
        <ToolButton
          icon={colorTheme === 'dark' ? 'L' : 'D'}
          label={colorTheme === 'dark' ? 'Light Theme' : 'Dark Theme'}
          onClick={toggleColorTheme}
          active={colorTheme === 'light'}
        />
      </div>
    </div>
  );
});
