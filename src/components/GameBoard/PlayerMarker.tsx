import React from 'react';
import { motion } from 'framer-motion';
import type { Player } from '@/types';

const PlayerMarker: React.FC<{ player: Player }> = ({ player }) => {
  const getGridPosition = (position: number) => {
    // Convert board position to grid coordinates
    if (position === 0) return { gridColumn: 11, gridRow: 11 }; // START
    if (position <= 10) return { gridColumn: 11 - position, gridRow: 11 }; // Bottom
    if (position <= 20) return { gridColumn: 1, gridRow: 11 - (position - 10) }; // Left
    if (position <= 30) return { gridColumn: position - 20 + 1, gridRow: 1 }; // Top
    return { gridColumn: 11, gridRow: position - 30 + 1 }; // Right
  };

  const { gridColumn, gridRow } = getGridPosition(player.position);

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute z-10"
      style={{
        gridColumn,
        gridRow,
        filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))'
      }}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-5 h-5 rounded-full border-2 border-white"
        style={{ backgroundColor: player.color }}
      />
    </motion.div>
  );
};

export default PlayerMarker;