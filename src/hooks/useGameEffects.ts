// src/hooks/useGameEffects.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useEffect } from 'react';
import { useGameStore } from './useGameStore';

export const useGameEffects = () => {
  const { gameLog, players } = useGameStore();

  useEffect(() => {
    // React to game log changes and trigger effects
    const latestLog = gameLog[gameLog.length - 1];
    if (!latestLog) return;

    // latestLog теперь просто строка, а не объект с message
    if (latestLog.includes('rolled')) {
      (window as any).createDiceExplosion?.(1, 1);
    }
    
    if (latestLog.includes('bought')) {
      (window as any).createPurchaseEffect?.();
    }
    
    if (latestLog.includes('passed GO')) {
      (window as any).createBonusEffect?.();
    }
  }, [gameLog]);

  useEffect(() => {
    // Check for game over conditions
    const activePlayers = players.filter(p => p.money > 0);
    if (activePlayers.length === 1 && players.length > 1) {
      // Game over logic
      console.log(`🏆 ${activePlayers[0].name} wins!`);
    }
  }, [players]);
};