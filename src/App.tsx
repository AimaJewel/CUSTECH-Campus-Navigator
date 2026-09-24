import { Suspense, lazy, memo, useEffect, useState } from "react";
import { useUIStore } from "@/store/useStore";
import { AnimatePresence, motion } from "framer-motion";

// Lazy load heavy components
const CampusMap = lazy(() => import("@/components/map/CampusMap"));
const Campus3D = lazy(() => import("@/components/3d/Campus3D"));
const Sidebar = lazy(() => import("@/components/navigation/Sidebar"));
const Minimap = lazy(() => import("@/components/minimap/Minimap"));
const Toolbar = lazy(() => import("@/components/overlays/Toolbar"));
const EnvironmentControls = lazy(
  () => import("@/components/overlays/EnvironmentControls"),
);
const LayerPanel = lazy(() => import("@/components/overlays/LayerPanel"));
const StatusBar = lazy(() => import("@/components/overlays/StatusBar"));
const QuickSearch = lazy(() => import("@/components/overlays/QuickSearch"));
const CampusStats = lazy(() => import("@/components/overlays/CampusStats"));

// Loading screen
function LoadingScreen() {
  return (
    <div>
      <div className="fixed inset-0 bg-[#060a14] flex flex-col items-center justify-center z-50">
        <div className="relative">
          <img
            src="/icon/campnav.png"
            alt="Campus navigation"
            className="w-16 h-16 object-contain"
          />
          <div className="absolute -inset-4 rounded-3xl border border-cyan-500/20 animate-ping" />
        </div>
        <h2 className="text-white/80 text-lg font-semibold mt-6">
          CUSTECH Navigator
        </h2>
        <p className="text-white/20 text-xs mt-1 tracking-widest uppercase">
          Loading Campus Digital Twin
        </p>
        <div className="mt-6 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>
      </div>
    </div>
  );
}

// Splash screen on first load
function SplashOverlay({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed inset-0 z-50 bg-[#060a14] flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-center max-w-lg px-6"
      >
        <div className="w-30 h-30 rounded-2xl relative flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-300/20">
          <img
            src="/icon/campnav.png"
            alt="Campus navigation"
            className="w-16 h-16 object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white/90 mb-2">
          CUSTECH Navigator
        </h1>
        <p className="text-sm text-white/40 mb-1">
          Confluence University of Science and Technology
        </p>
        <p className="text-xs text-white/20 mb-8">Osara, Kogi State, Nigeria</p>

        <div className="grid grid-cols-3 gap-3 mb-8 text-center">
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
            <span className="text-xl">🗺️</span>
            <p className="text-[10px] text-white/30 mt-1">Interactive Map</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
            <span className="text-xl">🧭</span>
            <p className="text-[10px] text-white/30 mt-1">Smart Navigation</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
            <span className="text-xl">🏛️</span>
            <p className="text-[10px] text-white/30 mt-1">3D Campus View</p>
          </div>
        </div>

        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onDismiss}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white font-semibold text-sm hover:from-emerald-300 hover:via-blue-500 hover:to-violet-500 transition-all shadow-lg shadow-cyan-500/20"
          >
            Explore Campus →
          </motion.button>
          <p className="text-[10px] text-white/15">
            Use ⌘K or Ctrl+K for quick search • WASD to pan • Scroll to zoom
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// View mode toggle
const ViewModeToggle = memo(function ViewModeToggle() {
  const { viewMode, setViewMode, showSidebar } = useUIStore();

  return (
    <div
      className={`absolute top-4 z-20 transition-all duration-500 ${showSidebar ? "left-[380px]" : "left-4"}`}
    >
      <div className="flex bg-[#0a0e1a]/80 backdrop-blur-md rounded-xl border border-white/[0.06] p-1">
        <button
          onClick={() => setViewMode("2d")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === "2d"
              ? "bg-cyan-500/15 text-cyan-400"
              : "text-white/30 hover:text-white/50"
          }`}
        >
          2D Map
        </button>
        <button
          onClick={() => setViewMode("3d")}
          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === "3d"
              ? "bg-purple-500/15 text-purple-400"
              : "text-white/30 hover:text-white/50"
          }`}
        >
          3D View
        </button>
      </div>
    </div>
  );
});

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const { viewMode, showSidebar, colorTheme } = useUIStore();

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "2") useUIStore.setState({ viewMode: "2d" });
      if (e.key === "3") useUIStore.setState({ viewMode: "3d" });
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      className={`w-screen h-screen bg-[#060a14] overflow-hidden relative theme-${colorTheme}`}
    >
      {/* Splash screen */}
      <AnimatePresence>
        {showSplash && <SplashOverlay onDismiss={() => setShowSplash(false)} />}
      </AnimatePresence>

      {!showSplash && (
        <Suspense fallback={<LoadingScreen />}>
          {/* Main map area */}
          <div
            className={`absolute inset-0 transition-all duration-500 ${showSidebar ? "pl-[360px]" : "pl-0"}`}
          >
            <AnimatePresence mode="wait">
              {viewMode === "2d" ? (
                <motion.div
                  key="2d"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <CampusMap />
                </motion.div>
              ) : (
                <motion.div
                  key="3d"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full"
                >
                  <Campus3D />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <AnimatePresence>{showSidebar && <Sidebar />}</AnimatePresence>

          {/* Collapsed sidebar toggle */}
          {!showSidebar && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => useUIStore.getState().toggleSidebar()}
              className="absolute top-4 left-4 z-30 w-10 h-10 rounded-xl bg-[#0a0e1a]/90 backdrop-blur-md border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 transition-all"
              title="Open Sidebar"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </motion.button>
          )}

          {/* Overlays */}
          <div
            className={`${showSidebar ? "pl-[360px]" : "pl-0"} transition-all duration-500`}
          >
            <StatusBar />
            <ViewModeToggle />
            <Toolbar />
            <LayerPanel />
            {viewMode === "2d" && <Minimap />}
            <EnvironmentControls />
          </div>

          {/* Quick Search (modal) */}
          <QuickSearch />

          {/* Campus Stats */}
          {viewMode === "2d" && <CampusStats />}

          {/* Search hint */}
          <div className="absolute bottom-4 left-4 z-10">
            <button
              onClick={() => useUIStore.getState().toggleSearch()}
              className="flex items-center gap-2 bg-[#0a0e1a]/60 backdrop-blur-md rounded-lg border border-white/[0.06] px-3 py-1.5 hover:bg-[#0a0e1a]/80 transition-all"
            >
              <svg
                className="w-3.5 h-3.5 text-white/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="text-[10px] text-white/20">Quick Search</span>
              <span className="text-[9px] text-white/10 px-1 py-0.5 rounded border border-white/5 ml-2">
                ⌘K
              </span>
            </button>
          </div>
        </Suspense>
      )}
    </div>
  );
}
