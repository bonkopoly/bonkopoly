// src/components/PlayerPanel/PlayerPanel.tsx - КОМПАКТНАЯ ВЕРСИЯ

import React from 'react';
import { Coins } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import Stats from '@/components/Stats/Stats';

const PlayerPanel: React.FC = () => {
  const { players, currentPlayer, properties } = useGameStore();

  const getPlayerProperties = (playerId: number) => {
    return properties.filter(prop => prop.owner === playerId);
  };

  const getNetWorth = (playerId: number) => {
    const player = players[playerId];
    const propertyValue = getPlayerProperties(playerId).reduce((total, prop) => total + prop.price, 0);
    return player.money + propertyValue;
  };

  return (
    <div className="space-y-2">
      {/* Players List */}
      <div className="space-y-1.5">
        {players
          .map((player, index) => ({ ...player, originalIndex: index, netWorth: getNetWorth(index) }))
          .sort((a, b) => b.netWorth - a.netWorth)
          .map((player) => {
            const isActive = player.originalIndex === currentPlayer;
            const playerProperties = getPlayerProperties(player.originalIndex);
            
            return (
              <div
                key={player.id}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  isActive 
                    ? 'border-orange-500/50 bg-orange-500/10 shadow-md shadow-orange-500/20' 
                    : 'border-white/10 bg-slate-800/30 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* Player Info */}
                  <div className="flex items-center space-x-2">
                    {/* Цветной маркер игрока */}
                    <div 
                      className={`w-3 h-3 rounded-full border transition-all duration-300 ${
                        isActive ? 'border-orange-400 shadow-lg shadow-orange-500/30' : 'border-white/50'
                      }`} 
                      style={{ 
                        backgroundColor: player.color,
                        transform: isActive ? 'scale(1.2)' : 'scale(1)'
                      }} 
                    />
                    
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-2">
                        {player.name}
                        {player.inJail && (
                          <span className="text-red-400 font-normal">
                            🚔 {player.jailTurns}/3
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <span>Position: {player.position}</span>
                        <span>•</span>
                        <span>Properties: {playerProperties.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Money */}
                  <div className="text-right">
                    <div className={`font-bold text-xs flex items-center justify-end ${
                      player.money < 500 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      <Coins className="w-3 h-3 mr-1" />
                      ${player.money.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Net: ${player.netWorth.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                {/* Properties */}
                {playerProperties.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/10">
                    <div className="flex flex-wrap gap-1">
                      {playerProperties.slice(0, 3).map((prop) => (
                        <div
                          key={prop.id}
                          className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
                          style={{ backgroundColor: prop.color }}
                          title={`${prop.name} - $${prop.price.toLocaleString()}`}
                        >
                          {prop.name.split(' ')[0]}
                        </div>
                      ))}
                      {playerProperties.length > 3 && (
                        <div className="px-1.5 py-0.5 rounded text-xs bg-slate-600 text-white">
                          +{playerProperties.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Progress Bar */}
                <div className="mt-1.5">
                  <div className="w-full bg-slate-700/50 rounded-full h-0.5">
                    <div
                      className="h-0.5 rounded-full bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-500"
                      style={{ width: `${Math.min((player.netWorth / 4000) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
      </div>
      
      {/* Статистика */}
      <Stats />
    </div>
  );
};

export default PlayerPanel;