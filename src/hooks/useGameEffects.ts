// src/hooks/useGameEffects.ts - ИСПРАВЛЕННАЯ ВЕРСИЯ
import { useEffect } from 'react';
import { useGameStore } from './useGameStore';

export const useGameEffects = () => {
  const { gameLog, players, calculatePlayerAssets, handleBankruptcy, checkGameEnd } = useGameStore();

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
    // Check for bankruptcy conditions
    players.forEach((player, index) => {
      if (player.bankrupt) return; // Уже банкрот
      
      if (player.money < 0) {
        // Игрок имеет отрицательный баланс - проверяем активы
        const totalAssets = calculatePlayerAssets(index);
        
        if (totalAssets <= 0) {
          // Нет активов для продажи - банкротство
          console.log(`💀 Player ${player.name} is bankrupt - no money and no assets`);
          handleBankruptcy(index);
        } else {
          // Есть активы, но нужно продать/заложить
          console.log(`⚠️ Player ${player.name} needs to sell/mortgage assets to pay debts`);
        }
      }
    });

    // Check for game over conditions
    checkGameEnd();
  }, [players, calculatePlayerAssets, handleBankruptcy]);
};