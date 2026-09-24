import { memo } from 'react';
import { buildings } from '@/data/campus';
import { motion } from 'framer-motion';

export default memo(function CampusStats() {
  const totalBuildings = buildings.length;
  const academicCount = buildings.filter(b => b.category === 'academic').length;
  const hostelCount = buildings.filter(b => b.category === 'hostel').length;
  const avgOccupancy = Math.round(buildings.reduce((s, b) => s + b.occupancyLevel, 0) / totalBuildings * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="absolute bottom-16 left-4 z-10"
    >
      <div className="flex items-center gap-3 bg-[#0a0e1a]/60 backdrop-blur-md rounded-xl border border-white/6 px-3 py-2">
        <div className="text-center px-2 border-r border-white/5">
          <div className="text-sm font-bold text-white/70">{totalBuildings}</div>
          <div className="text-[8px] text-white/20 uppercase">Buildings</div>
        </div>
        <div className="text-center px-2 border-r border-white/5">
          <div className="text-sm font-bold text-blue-400/70">{academicCount}</div>
          <div className="text-[8px] text-white/20 uppercase">Academic</div>
        </div>
        <div className="text-center px-2 border-r border-white/5">
          <div className="text-sm font-bold text-purple-400/70">{hostelCount}</div>
          <div className="text-[8px] text-white/20 uppercase">Hostels</div>
        </div>
        <div className="text-center px-2">
          <div className="text-sm font-bold text-amber-400/70">{avgOccupancy}%</div>
          <div className="text-[8px] text-white/20 uppercase">Avg. Load</div>
        </div>
      </div>
    </motion.div>
  );
});
