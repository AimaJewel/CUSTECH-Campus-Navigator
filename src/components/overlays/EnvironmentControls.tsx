import { memo } from 'react';
import { useUIStore, type TimeOfDay, type WeatherMode } from '@/store/useStore';
import { motion } from 'framer-motion';

const timeOptions: { value: TimeOfDay; icon: string; label: string }[] = [
  { value: 'day', icon: '☀️', label: 'Day' },
  { value: 'dusk', icon: '🌅', label: 'Dusk' },
  { value: 'night', icon: '🌙', label: 'Night' },
];

const weatherOptions: { value: WeatherMode; icon: string; label: string }[] = [
  { value: 'clear', icon: '🌤', label: 'Clear' },
  { value: 'cloudy', icon: '☁️', label: 'Cloudy' },
  { value: 'rainy', icon: '🌧', label: 'Rain' },
  { value: 'foggy', icon: '🌫', label: 'Fog' },
];

export default memo(function EnvironmentControls() {
  const { timeOfDay, setTimeOfDay, weather, setWeather } = useUIStore();
  
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center gap-3 bg-[#0a0e1a]/90 backdrop-blur-xl rounded-2xl border border-white/6 px-4 py-2"
      >
        {/* Time of day */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-white/20 mr-1 uppercase tracking-wider">Time</span>
          {timeOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setTimeOfDay(opt.value)}
              className={`px-2 py-1 rounded-lg text-xs transition-all ${
                timeOfDay === opt.value
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-white/30 hover:text-white/60'
              }`}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>
        
        <div className="w-px h-6 bg-white/10" />
        
        {/* Weather */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-white/20 mr-1 uppercase tracking-wider">Weather</span>
          {weatherOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setWeather(opt.value)}
              className={`px-2 py-1 rounded-lg text-xs transition-all ${
                weather === opt.value
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-white/30 hover:text-white/60'
              }`}
              title={opt.label}
            >
              {opt.icon}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
});
