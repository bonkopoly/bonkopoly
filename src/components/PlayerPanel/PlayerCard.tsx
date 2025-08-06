import React from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/types';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, isActive }) => {
  return (
    <motion.div
      layout
      animate={{
        borderColor: isActive ? '#ff6b35' : '#6b7280',
        backgroundColor: isActive ? 'rgba(255, 107, 53, 0.1)' : 'rgba(107, 114, 128, 0.1)'
      }}
      className={`p-3 rounded-lg border-2 transition-all duration-300 ${
        isActive ? 'border-bonk-orange bg-bonk-orange/10' : 'border-gray-600 bg-gray-800/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div 
            className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: player.color }}
          />
          <div>
            <div className="font-bold text-white text-xs">{player.name}</div>
            <div className="text-xs text-gray-400">
              Pos: {player.position} • Props: {player.properties.length}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold text-lg ${
            player.money < 500 ? 'text-red-400' : 'text-green-400'
          }`}>
            ${player.money}
          </div>
          {player.inJail && (
            <div className="text-xs text-red-400">🚔 IN JAIL</div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PlayerCard;