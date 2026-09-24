import { create } from 'zustand';
import type { BuildingMeta, PathNode } from '@/data/campus';
import type { RoutePreference } from '@/engine/pathfinding';

// Camera Store
interface CameraState {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  setCamera: (x: number, y: number, zoom?: number) => void;
  setTarget: (x: number, y: number, zoom?: number) => void;
  setZoom: (zoom: number) => void;
}

export const useCameraStore = create<CameraState>((set) => ({
  x: 600,
  y: 450,
  zoom: 0.7,
  targetX: 600,
  targetY: 450,
  targetZoom: 0.7,
  setCamera: (x, y, zoom) => set((s) => ({ x, y, zoom: zoom ?? s.zoom, targetX: x, targetY: y, targetZoom: zoom ?? s.targetZoom })),
  setTarget: (x, y, zoom) => set((s) => ({ targetX: x, targetY: y, targetZoom: zoom ?? s.targetZoom })),
  setZoom: (zoom) => set({ zoom, targetZoom: zoom }),
}));

// Navigation Store
interface NavigationState {
  origin: BuildingMeta | null;
  destination: BuildingMeta | null;
  routePath: PathNode[] | null;
  routePreference: RoutePreference;
  isNavigating: boolean;
  simulationProgress: number;
  setOrigin: (building: BuildingMeta | null) => void;
  setDestination: (building: BuildingMeta | null) => void;
  setRoutePath: (path: PathNode[] | null) => void;
  setRoutePreference: (pref: RoutePreference) => void;
  setIsNavigating: (nav: boolean) => void;
  setSimulationProgress: (p: number) => void;
  clearRoute: () => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  origin: null,
  destination: null,
  routePath: null,
  routePreference: 'shortest',
  isNavigating: false,
  simulationProgress: 0,
  setOrigin: (origin) => set({ origin }),
  setDestination: (destination) => set({ destination }),
  setRoutePath: (routePath) => set({ routePath }),
  setRoutePreference: (routePreference) => set({ routePreference }),
  setIsNavigating: (isNavigating) => set({ isNavigating }),
  setSimulationProgress: (simulationProgress) => set({ simulationProgress }),
  clearRoute: () => set({ origin: null, destination: null, routePath: null, isNavigating: false, simulationProgress: 0 }),
}));

// UI Store
export type ViewMode = '2d' | '3d';
export type TimeOfDay = 'day' | 'dusk' | 'night';
export type WeatherMode = 'clear' | 'cloudy' | 'rainy' | 'foggy';
export type ColorTheme = 'dark' | 'light';

interface UIState {
  viewMode: ViewMode;
  colorTheme: ColorTheme;
  timeOfDay: TimeOfDay;
  weather: WeatherMode;
  selectedBuilding: BuildingMeta | null;
  hoveredBuilding: string | null;
  showSidebar: boolean;
  showMinimap: boolean;
  showSearch: boolean;
  showLayers: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  activeLayer: string[];
  setViewMode: (mode: ViewMode) => void;
  setColorTheme: (theme: ColorTheme) => void;
  toggleColorTheme: () => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setWeather: (weather: WeatherMode) => void;
  setSelectedBuilding: (building: BuildingMeta | null) => void;
  setHoveredBuilding: (id: string | null) => void;
  toggleSidebar: () => void;
  toggleMinimap: () => void;
  toggleSearch: () => void;
  toggleLayers: () => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  setActiveLayer: (layers: string[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  viewMode: '2d',
  colorTheme: 'dark',
  timeOfDay: 'day',
  weather: 'clear',
  selectedBuilding: null,
  hoveredBuilding: null,
  showSidebar: true,
  showMinimap: true,
  showSearch: false,
  showLayers: false,
  highContrast: false,
  reducedMotion: false,
  activeLayer: ['buildings', 'roads', 'vegetation', 'labels'],
  setViewMode: (viewMode) => set({ viewMode }),
  setColorTheme: (colorTheme) => set({ colorTheme }),
  toggleColorTheme: () => set((s) => ({ colorTheme: s.colorTheme === 'dark' ? 'light' : 'dark' })),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setWeather: (weather) => set({ weather }),
  setSelectedBuilding: (selectedBuilding) => set({ selectedBuilding }),
  setHoveredBuilding: (hoveredBuilding) => set({ hoveredBuilding }),
  toggleSidebar: () => set((s) => ({ showSidebar: !s.showSidebar })),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  toggleSearch: () => set((s) => ({ showSearch: !s.showSearch })),
  toggleLayers: () => set((s) => ({ showLayers: !s.showLayers })),
  toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
  toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
  setActiveLayer: (activeLayer) => set({ activeLayer }),
}));
