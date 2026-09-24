import { memo, useEffect, useState } from 'react';
import { useCameraStore, useUIStore } from '@/store/useStore';

export default memo(function StatusBar() {
  const { x, y, zoom } = useCameraStore();
  const { timeOfDay, weather } = useUIStore();
  const [time, setTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-4 bg-[#0a0e1a]/80 backdrop-blur-xl rounded-xl border border-white/[0.06] px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-white/50 font-mono">CUSTECH NAV</span>
        </div>
        
        <div className="w-px h-4 bg-white/10" />
        
        <span className="text-[10px] text-white/30 font-mono">
          {Math.round(x)}, {Math.round(y)}
        </span>
        
        <div className="w-px h-4 bg-white/10" />
        
        <span className="text-[10px] text-white/30 font-mono">
          ×{zoom.toFixed(1)}
        </span>
        
        <div className="w-px h-4 bg-white/10" />
        
        <span className="text-[10px] text-white/30 font-mono">
          {timeOfDay.toUpperCase()} · {weather.toUpperCase()}
        </span>
        
        <div className="w-px h-4 bg-white/10" />
        
        <span className="text-[10px] text-cyan-400/60 font-mono">
          {time.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
});
