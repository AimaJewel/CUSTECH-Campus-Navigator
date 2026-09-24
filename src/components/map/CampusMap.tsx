import { useCallback, useEffect, useRef, useState, useMemo, memo } from 'react';
import {
  buildings, trees, pathNodes, pathEdges,
  CAMPUS_WIDTH, CAMPUS_HEIGHT,
  type BuildingMeta, type TreeData,
} from '@/data/campus';
import { useCameraStore, useNavigationStore, useUIStore } from '@/store/useStore';

// ---- Terrain Layer ----
const TerrainLayer = memo(function TerrainLayer({ timeOfDay }: { timeOfDay: string }) {
  const baseColor = timeOfDay === 'night' ? '#0a1a0d' : timeOfDay === 'dusk' ? '#1a2e15' : '#1a3a1a';
  const roadColor = timeOfDay === 'night' ? '#1a1a2a' : timeOfDay === 'dusk' ? '#2a2520' : '#3a3a3a';

  return (
    <g id="terrain">
      {/* Campus ground */}
      <rect x="0" y="0" width={CAMPUS_WIDTH} height={CAMPUS_HEIGHT} fill={baseColor} rx="10" />
      
      {/* Subtle terrain texture */}
      <defs>
        <pattern id="grass-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="0.5" fill="#2a5a2a" opacity="0.3" />
          <circle cx="25" cy="15" r="0.4" fill="#2a5a2a" opacity="0.2" />
          <circle cx="15" cy="30" r="0.6" fill="#2a5a2a" opacity="0.25" />
          <circle cx="35" cy="35" r="0.3" fill="#2a5a2a" opacity="0.2" />
        </pattern>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-strong">
          <feGaussianBlur stdDeviation="6" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="road-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={roadColor} />
          <stop offset="100%" stopColor={roadColor} stopOpacity="0.8" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={CAMPUS_WIDTH} height={CAMPUS_HEIGHT} fill="url(#grass-pattern)" rx="20" />
    </g>
  );
});

// ---- Roads Layer ----
const RoadsLayer = memo(function RoadsLayer({ timeOfDay }: { timeOfDay: string }) {
  const roadColor = timeOfDay === 'night' ? '#1e293b' : '#374151';
  const walkColor = timeOfDay === 'night' ? '#1e293b80' : '#4b556380';

  return (
    <g id="roads">
      {pathEdges.map((edge, i) => {
        const from = pathNodes.find(n => n.id === edge.from);
        const to = pathNodes.find(n => n.id === edge.to);
        if (!from || !to) return null;
        
        const isRoad = edge.type === 'road';
        const isShortcut = edge.type === 'shortcut';
        
        return (
          <line
            key={i}
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={isRoad ? roadColor : walkColor}
            strokeWidth={isRoad ? 6 : 3}
            strokeLinecap="round"
            strokeDasharray={isShortcut ? '4 4' : undefined}
            opacity={0.8}
          />
        );
      })}
    </g>
  );
});

// ---- Vegetation Layer ----
const TreeElement = memo(function TreeElement({ tree }: { tree: TreeData }) {
  if (tree.type === 'palm') {
    return (
      <g transform={`translate(${tree.x},${tree.y})`}>
        <line x1="0" y1="0" x2="0" y2={-tree.size * 0.6} stroke="#5c4033" strokeWidth="2" />
        <ellipse cx="0" cy={-tree.size * 0.6} rx={tree.size * 0.5} ry={tree.size * 0.35} fill="#228B22" opacity="0.7" />
        <ellipse cx={-tree.size * 0.2} cy={-tree.size * 0.5} rx={tree.size * 0.4} ry={tree.size * 0.25} fill="#2d9b2d" opacity="0.5" />
      </g>
    );
  }
  if (tree.type === 'bush') {
    return (
      <g transform={`translate(${tree.x},${tree.y})`}>
        <circle r={tree.size * 0.4} fill="#2d6b2d" opacity="0.6" />
        <circle cx={tree.size * 0.15} cy={-tree.size * 0.1} r={tree.size * 0.3} fill="#3a8a3a" opacity="0.5" />
      </g>
    );
  }
  return (
    <g transform={`translate(${tree.x},${tree.y})`}>
      <circle r={tree.size * 0.5} fill="#1a6b1a" opacity="0.6" />
      <circle cx={tree.size * 0.1} cy={-tree.size * 0.1} r={tree.size * 0.4} fill="#228B22" opacity="0.5" />
      <circle cx={-tree.size * 0.1} cy={tree.size * 0.1} r={tree.size * 0.35} fill="#2d8b2d" opacity="0.4" />
    </g>
  );
});

const VegetationLayer = memo(function VegetationLayer() {
  return (
    <g id="vegetation">
      {trees.map((tree, i) => <TreeElement key={i} tree={tree} />)}
    </g>
  );
});

// ---- Buildings Layer ----
interface BuildingElementProps {
  building: BuildingMeta;
  isHovered: boolean;
  isSelected: boolean;
  isOrigin: boolean;
  isDestination: boolean;
  timeOfDay: string;
  onHover: (id: string | null) => void;
  onClick: (building: BuildingMeta) => void;
}

const BuildingElement = memo(function BuildingElement({
  building, isHovered, isSelected, isOrigin, isDestination, timeOfDay, onHover, onClick
}: BuildingElementProps) {
  const isNight = timeOfDay === 'night';
  const glowIntensity = isSelected ? 1 : isHovered ? 0.7 : 0;
  const scale = isHovered ? 1.02 : 1;
  const yOffset = building.floors * 2;

  return (
    <g
      className="cursor-pointer transition-transform"
      onMouseEnter={() => onHover(building.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(building)}
      role="button"
      tabIndex={0}
      aria-label={building.name}
    >
      {/* 3D extrusion effect (isometric shadow) */}
      {building.floors > 0 && (
        <rect
          x={building.x + 3} y={building.y + 3 - yOffset}
          width={building.width} height={building.height}
          fill="#00000040" rx="4"
        />
      )}
      
      {/* Glow effect */}
      {glowIntensity > 0 && (
        <rect
          x={building.x - 4} y={building.y - 4 - yOffset}
          width={building.width + 8} height={building.height + 8}
          fill="none" stroke={building.color} strokeWidth="2"
          rx="8" opacity={glowIntensity * 0.6}
          filter="url(#glow)"
        >
          <animate attributeName="opacity" values={`${glowIntensity * 0.3};${glowIntensity * 0.7};${glowIntensity * 0.3}`} dur="2s" repeatCount="indefinite" />
        </rect>
      )}
      
      {/* Building body */}
      <rect
        x={building.x} y={building.y - yOffset}
        width={building.width} height={building.height}
        fill={building.color}
        fillOpacity={isNight ? 0.7 : 0.85}
        stroke={isSelected ? '#ffffff' : isOrigin ? '#22c55e' : isDestination ? '#ef4444' : `${building.color}cc`}
        strokeWidth={isSelected || isOrigin || isDestination ? 2.5 : 1.5}
        rx="4"
        transform={`scale(${scale})`}
        style={{ transformOrigin: `${building.x + building.width / 2}px ${building.y + building.height / 2 - yOffset}px` }}
      />
      
      {/* Night windows */}
      {isNight && building.floors > 0 && building.category !== 'sports' && (
        <g opacity="0.6">
          {Array.from({ length: Math.min(building.floors * 2, 6) }).map((_, i) => {
            const wx = building.x + 8 + (i % 3) * (building.width - 16) / 3;
            const wy = building.y + 8 - yOffset + Math.floor(i / 3) * 12;
            return (
              <rect key={i} x={wx} y={wy} width="6" height="4" fill="#fbbf24" rx="0.5" opacity={0.4 + Math.random() * 0.5}>
                <animate attributeName="opacity" values="0.4;0.8;0.4" dur={`${2 + Math.random() * 3}s`} repeatCount="indefinite" />
              </rect>
            );
          })}
        </g>
      )}
      
      {/* Building label */}
      <text
        x={building.x + building.width / 2}
        y={building.y + building.height / 2 - yOffset + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={building.width > 90 ? 9 : 7}
        fill="white"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
      >
        {building.shortName}
      </text>
      
      {/* Origin/Destination markers */}
      {(isOrigin || isDestination) && (
        <g>
          <circle
            cx={building.x + building.width / 2}
            cy={building.y - yOffset - 12}
            r="8"
            fill={isOrigin ? '#22c55e' : '#ef4444'}
            stroke="white" strokeWidth="2"
          >
            <animate attributeName="r" values="7;9;7" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <text
            x={building.x + building.width / 2}
            y={building.y - yOffset - 8}
            textAnchor="middle"
            fontSize="8" fill="white" fontWeight="bold"
          >
            {isOrigin ? 'A' : 'B'}
          </text>
        </g>
      )}
    </g>
  );
});

// ---- Route Layer ----
const RouteLayer = memo(function RouteLayer({ simulationProgress }: { simulationProgress: number }) {
  const routePath = useNavigationStore(s => s.routePath);
  
  if (!routePath || routePath.length < 2) return null;
  
  const pathD = routePath.map((n, i) => `${i === 0 ? 'M' : 'L'}${n.x},${n.y}`).join(' ');
  
  // Calculate total length for animation
  let totalLength = 0;
  for (let i = 1; i < routePath.length; i++) {
    const dx = routePath[i]!.x - routePath[i - 1]!.x;
    const dy = routePath[i]!.y - routePath[i - 1]!.y;
    totalLength += Math.sqrt(dx * dx + dy * dy);
  }
  
  // Find simulation position
  let simX = routePath[0]!.x;
  let simY = routePath[0]!.y;
  if (simulationProgress > 0) {
    const targetDist = totalLength * simulationProgress;
    let accum = 0;
    for (let i = 1; i < routePath.length; i++) {
      const dx = routePath[i]!.x - routePath[i - 1]!.x;
      const dy = routePath[i]!.y - routePath[i - 1]!.y;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      if (accum + segLen >= targetDist) {
        const t = (targetDist - accum) / segLen;
        simX = routePath[i - 1]!.x + dx * t;
        simY = routePath[i - 1]!.y + dy * t;
        break;
      }
      accum += segLen;
    }
  }
  
  return (
    <g id="route">
      {/* Route glow */}
      <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="10" opacity="0.15" filter="url(#glow-strong)" strokeLinejoin="round" strokeLinecap="round" />
      
      {/* Route base */}
      <path d={pathD} fill="none" stroke="#0891b2" strokeWidth="5" opacity="0.4" strokeLinejoin="round" strokeLinecap="round" />
      
      {/* Route main */}
      <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
      
      {/* Animated particles along route */}
      <circle r="4" fill="#22d3ee" filter="url(#glow)">
        <animateMotion dur="4s" repeatCount="indefinite" path={pathD} />
      </circle>
      <circle r="3" fill="#67e8f9">
        <animateMotion dur="4s" repeatCount="indefinite" path={pathD} begin="1s" />
      </circle>
      <circle r="3" fill="#67e8f9">
        <animateMotion dur="4s" repeatCount="indefinite" path={pathD} begin="2s" />
      </circle>
      <circle r="2.5" fill="#a5f3fc">
        <animateMotion dur="4s" repeatCount="indefinite" path={pathD} begin="3s" />
      </circle>
      
      {/* Direction arrows */}
      {routePath.filter((_, i) => i > 0 && i % 3 === 0).map((node, i) => {
        const prev = routePath[routePath.indexOf(node) - 1]!;
        const angle = Math.atan2(node.y - prev.y, node.x - prev.x) * 180 / Math.PI;
        return (
          <g key={i} transform={`translate(${node.x},${node.y}) rotate(${angle})`}>
            <polygon points="-4,-3 4,0 -4,3" fill="#22d3ee" opacity="0.7" />
          </g>
        );
      })}
      
      {/* Waypoint dots */}
      {routePath.map((node, i) => (
        <circle key={i} cx={node.x} cy={node.y} r={i === 0 || i === routePath.length - 1 ? 5 : 2.5}
          fill={i === 0 ? '#22c55e' : i === routePath.length - 1 ? '#ef4444' : '#22d3ee'}
          stroke="white" strokeWidth={i === 0 || i === routePath.length - 1 ? 2 : 0.5} opacity="0.9"
        />
      ))}
      
      {/* Simulation avatar */}
      {simulationProgress > 0 && (
        <g transform={`translate(${simX}, ${simY})`}>
          <circle r="8" fill="#3b82f6" stroke="white" strokeWidth="2.5">
            <animate attributeName="r" values="7;9;7" dur="1s" repeatCount="indefinite" />
          </circle>
          <circle r="3" fill="white" />
        </g>
      )}
    </g>
  );
});

// ---- Compass ----
const Compass = memo(function Compass() {
  return (
    <g transform="translate(50, 50)">
      <circle r="22" fill="#0f172a" stroke="#334155" strokeWidth="1.5" opacity="0.9" />
      <polygon points="0,-16 4,-4 -4,-4" fill="#ef4444" />
      <polygon points="0,16 4,4 -4,4" fill="#94a3b8" />
      <text y="-6" textAnchor="middle" fontSize="6" fill="#ef4444" fontWeight="bold">N</text>
      <text y="12" textAnchor="middle" fontSize="5" fill="#94a3b8">S</text>
      <text x="10" y="3" textAnchor="middle" fontSize="5" fill="#94a3b8">E</text>
      <text x="-10" y="3" textAnchor="middle" fontSize="5" fill="#94a3b8">W</text>
      <circle r="2" fill="#64748b" />
    </g>
  );
});

// ---- Scale Bar ----
const ScaleBar = memo(function ScaleBar() {
  return (
    <g transform={`translate(${CAMPUS_WIDTH - 150}, ${CAMPUS_HEIGHT - 30})`}>
      <line x1="0" y1="0" x2="100" y2="0" stroke="#94a3b8" strokeWidth="2" />
      <line x1="0" y1="-4" x2="0" y2="4" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="100" y1="-4" x2="100" y2="4" stroke="#94a3b8" strokeWidth="1.5" />
      <text x="50" y="-6" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="monospace">~200m</text>
    </g>
  );
});

// ---- Grid Overlay ----
const GridOverlay = memo(function GridOverlay() {
  const lines = [];
  for (let x = 0; x <= CAMPUS_WIDTH; x += 100) {
    lines.push(<line key={`v${x}`} x1={x} y1={0} x2={x} y2={CAMPUS_HEIGHT} stroke="#ffffff06" strokeWidth="0.5" />);
  }
  for (let y = 0; y <= CAMPUS_HEIGHT; y += 100) {
    lines.push(<line key={`h${y}`} x1={0} y1={y} x2={CAMPUS_WIDTH} y2={y} stroke="#ffffff06" strokeWidth="0.5" />);
  }
  return <g id="grid">{lines}</g>;
});

// ---- Campus Boundary & Title ----
const CampusBoundary = memo(function CampusBoundary() {
  return (
    <g id="campus-boundary">
      {/* Campus boundary path (organic shape) */}
      <path
        d={`M 30,40 Q 200,10 600,25 Q 1000,10 1170,40 Q 1195,200 1190,500 Q 1195,750 1170,860 Q 800,900 600,895 Q 400,900 30,860 Q 10,700 10,450 Q 10,200 30,40 Z`}
        fill="none"
        stroke="#22d3ee10"
        strokeWidth="2"
        strokeDasharray="12 6"
      />
      {/* University name */}
      <text x={CAMPUS_WIDTH / 2} y={25} textAnchor="middle" fontSize="11" fill="#22d3ee15" fontWeight="700" fontFamily="system-ui" letterSpacing="6">
        CONFLUENCE UNIVERSITY OF SCIENCE AND TECHNOLOGY
      </text>
      <text x={CAMPUS_WIDTH / 2} y={CAMPUS_HEIGHT - 10} textAnchor="middle" fontSize="8" fill="#ffffff08" fontFamily="monospace" letterSpacing="3">
        OSARA, KOGI STATE · 7.6°N 6.7°E · ELEVATION ~200m
      </text>
    </g>
  );
});

// ---- Night overlay ----
const NightOverlay = memo(function NightOverlay({ timeOfDay }: { timeOfDay: string }) {
  if (timeOfDay === 'day') return null;
  const opacity = timeOfDay === 'night' ? 0.5 : 0.2;
  return (
    <rect x="0" y="0" width={CAMPUS_WIDTH} height={CAMPUS_HEIGHT}
      fill={timeOfDay === 'night' ? '#000033' : '#1a0a00'}
      opacity={opacity} rx="20" style={{ pointerEvents: 'none' }}
    />
  );
});

// ---- Weather Effects ----
const WeatherOverlay = memo(function WeatherOverlay({ weather }: { weather: string }) {
  if (weather === 'clear') return null;
  
  if (weather === 'foggy') {
    return (
      <rect x="0" y="0" width={CAMPUS_WIDTH} height={CAMPUS_HEIGHT}
        fill="#94a3b8" opacity="0.15" rx="20" style={{ pointerEvents: 'none' }}
      />
    );
  }
  
  if (weather === 'rainy') {
    return (
      <g style={{ pointerEvents: 'none' }} opacity="0.3">
        {Array.from({ length: 40 }).map((_, i) => {
          const x = Math.random() * CAMPUS_WIDTH;
          const delay = Math.random() * 2;
          return (
            <line key={i} x1={x} y1={-20} x2={x - 5} y2={-10} stroke="#60a5fa" strokeWidth="1" opacity="0.5">
              <animateTransform attributeName="transform" type="translate" from="0 0" to="0 920" dur="1.5s" begin={`${delay}s`} repeatCount="indefinite" />
            </line>
          );
        })}
      </g>
    );
  }
  
  if (weather === 'cloudy') {
    return (
      <rect x="0" y="0" width={CAMPUS_WIDTH} height={CAMPUS_HEIGHT}
        fill="#475569" opacity="0.08" rx="20" style={{ pointerEvents: 'none' }}
      />
    );
  }
  
  return null;
});

// ---- Main Campus Map ----
export default function CampusMap() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { x: camX, y: camY, zoom, targetX, targetY, targetZoom } = useCameraStore();
  const { origin, destination, simulationProgress } = useNavigationStore();
  const {
    timeOfDay, weather, selectedBuilding, hoveredBuilding,
    setSelectedBuilding, setHoveredBuilding, activeLayer,
  } = useUIStore();
  
  // Smooth camera animation
  useEffect(() => {
    let animFrame: number;
    const animate = () => {
      useCameraStore.setState((s) => {
        const dx = s.targetX - s.x;
        const dy = s.targetY - s.y;
        const dz = s.targetZoom - s.zoom;
        const ease = 0.08;
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1 && Math.abs(dz) < 0.001) return s;
        return {
          x: s.x + dx * ease,
          y: s.y + dy * ease,
          zoom: s.zoom + dz * ease,
        };
      });
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, []);
  
  // Pan & zoom handling
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, camX: 0, camY: 0 });
  
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY, camX: targetX, camY: targetY });
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, [targetX, targetY]);
  
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning) return;
    const dx = (e.clientX - panStart.x) / zoom;
    const dy = (e.clientY - panStart.y) / zoom;
    useCameraStore.setState({
      targetX: panStart.camX - dx,
      targetY: panStart.camY - dy,
      x: panStart.camX - dx,
      y: panStart.camY - dy,
    });
  }, [isPanning, panStart, zoom]);
  
  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);
  
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3, targetZoom * delta));
    useCameraStore.setState({ targetZoom: newZoom });
  }, [targetZoom]);
  
  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const speed = 30 / zoom;
      switch (e.key) {
        case 'ArrowUp': case 'w': useCameraStore.setState(s => ({ targetY: s.targetY - speed })); break;
        case 'ArrowDown': case 's': useCameraStore.setState(s => ({ targetY: s.targetY + speed })); break;
        case 'ArrowLeft': case 'a': useCameraStore.setState(s => ({ targetX: s.targetX - speed })); break;
        case 'ArrowRight': case 'd': useCameraStore.setState(s => ({ targetX: s.targetX + speed })); break;
        case '+': case '=': useCameraStore.setState(s => ({ targetZoom: Math.min(3, s.targetZoom * 1.1) })); break;
        case '-': useCameraStore.setState(s => ({ targetZoom: Math.max(0.3, s.targetZoom * 0.9) })); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoom]);
  
  const handleBuildingClick = useCallback((building: BuildingMeta) => {
    setSelectedBuilding(building);
    useCameraStore.setState({
      targetX: building.x + building.width / 2,
      targetY: building.y + building.height / 2,
      targetZoom: 1.5,
    });
  }, [setSelectedBuilding]);
  
  const handleBuildingHover = useCallback((id: string | null) => {
    setHoveredBuilding(id);
  }, [setHoveredBuilding]);
  
  // Container dimensions
  const [containerSize, setContainerSize] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          w: containerRef.current.clientWidth,
          h: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  
  // Compute SVG viewBox
  const viewBox = useMemo(() => {
    const scaledW = containerSize.w / zoom;
    const scaledH = containerSize.h / zoom;
    return `${camX - scaledW / 2} ${camY - scaledH / 2} ${scaledW} ${scaledH}`;
  }, [camX, camY, zoom, containerSize]);
  
  const showVegetation = activeLayer.includes('vegetation');
  const showRoads = activeLayer.includes('roads');
  const showBuildings = activeLayer.includes('buildings');
  
  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="w-full h-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{ touchAction: 'none' }}
      >
        <TerrainLayer timeOfDay={timeOfDay} />
        <GridOverlay />
        <CampusBoundary />
        {showRoads && <RoadsLayer timeOfDay={timeOfDay} />}
        {showVegetation && <VegetationLayer />}
        
        {showBuildings && (
          <g id="buildings">
            {buildings.map(b => (
              <BuildingElement
                key={b.id}
                building={b}
                isHovered={hoveredBuilding === b.id}
                isSelected={selectedBuilding?.id === b.id}
                isOrigin={origin?.id === b.id}
                isDestination={destination?.id === b.id}
                timeOfDay={timeOfDay}
                onHover={handleBuildingHover}
                onClick={handleBuildingClick}
              />
            ))}
          </g>
        )}
        
        <RouteLayer simulationProgress={simulationProgress} />
        <NightOverlay timeOfDay={timeOfDay} />
        <WeatherOverlay weather={weather} />
        <Compass />
        <ScaleBar />
      </svg>
      
      {/* Hovered building tooltip */}
      {hoveredBuilding && (() => {
        const b = buildings.find(b => b.id === hoveredBuilding);
        if (!b) return null;
        // Convert building center to screen coords
        const bCenterX = b.x + b.width / 2;
        const bCenterY = b.y - b.floors * 2 - 20;
        const scaledW = containerSize.w / zoom;
        const scaledH = containerSize.h / zoom;
        const screenX = (bCenterX - (camX - scaledW / 2)) * zoom;
        const screenY = (bCenterY - (camY - scaledH / 2)) * zoom;
        
        return (
          <div
            className="absolute pointer-events-none z-10 transform -translate-x-1/2 -translate-y-full"
            style={{ left: screenX, top: screenY }}
          >
            <div className="bg-[#0c1020]/95 backdrop-blur-md rounded-lg border border-white/10 px-3 py-2 shadow-xl whitespace-nowrap">
              <div className="text-xs font-semibold text-white/90">{b.name}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{b.faculty} · {b.floors}F · {b.openingHours}</div>
            </div>
            <div className="w-2 h-2 bg-[#0c1020]/95 border-r border-b border-white/10 transform rotate-45 mx-auto -mt-1" />
          </div>
        );
      })()}
    </div>
  );
}
