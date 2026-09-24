import { memo, useCallback } from 'react';
import { buildings, pathEdges, pathNodes, CAMPUS_WIDTH, CAMPUS_HEIGHT } from '@/data/campus';
import { useCameraStore, useNavigationStore, useUIStore } from '@/store/useStore';

const MINIMAP_W = 180;
const MINIMAP_H = (CAMPUS_HEIGHT / CAMPUS_WIDTH) * MINIMAP_W;
const SCALE = MINIMAP_W / CAMPUS_WIDTH;

export default memo(function Minimap() {
  const { x: camX, y: camY, zoom } = useCameraStore();
  const routePath = useNavigationStore(s => s.routePath);
  const showMinimap = useUIStore(s => s.showMinimap);
  
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / SCALE;
    const my = (e.clientY - rect.top) / SCALE;
    useCameraStore.setState({ targetX: mx, targetY: my });
  }, []);
  
  if (!showMinimap) return null;
  
  // Camera viewport on minimap
  const vpW = (window.innerWidth / zoom) * SCALE;
  const vpH = (window.innerHeight / zoom) * SCALE;
  const vpX = camX * SCALE - vpW / 2;
  const vpY = camY * SCALE - vpH / 2;
  
  return (
    <div className="absolute bottom-4 right-4 z-20 rounded-xl overflow-hidden border border-white/10 bg-[#0a0e1a]/90 backdrop-blur-md shadow-2xl">
      <div className="px-2 py-1 border-b border-white/5 flex items-center justify-between">
        <span className="text-[9px] text-white/30 font-mono uppercase tracking-wider">Minimap</span>
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
      </div>
      <svg
        width={MINIMAP_W}
        height={MINIMAP_H}
        viewBox={`0 0 ${CAMPUS_WIDTH} ${CAMPUS_HEIGHT}`}
        className="cursor-pointer"
        onClick={handleClick}
      >
        {/* Background */}
        <rect width={CAMPUS_WIDTH} height={CAMPUS_HEIGHT} fill="#0f1a0f" rx="10" />
        
        {/* Roads */}
        {pathEdges.map((edge, i) => {
          const from = pathNodes.find(n => n.id === edge.from);
          const to = pathNodes.find(n => n.id === edge.to);
          if (!from || !to) return null;
          return (
            <line key={i}
              x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke="#334155" strokeWidth="4"
            />
          );
        })}
        
        {/* Buildings */}
        {buildings.map(b => (
          <rect key={b.id}
            x={b.x} y={b.y} width={b.width} height={b.height}
            fill={b.color} opacity="0.6" rx="2"
          />
        ))}
        
        {/* Route */}
        {routePath && routePath.length > 1 && (
          <polyline
            points={routePath.map(n => `${n.x},${n.y}`).join(' ')}
            fill="none" stroke="#22d3ee" strokeWidth="6" opacity="0.8"
          />
        )}
        
        {/* Camera viewport */}
        <rect
          x={vpX / SCALE} y={vpY / SCALE}
          width={vpW / SCALE} height={vpH / SCALE}
          fill="none" stroke="#22d3ee" strokeWidth="3"
          opacity="0.5" rx="2"
        />
      </svg>
    </div>
  );
});
