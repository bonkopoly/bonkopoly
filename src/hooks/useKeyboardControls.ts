// src/hooks/useKeyboardControls.ts - УПРОЩЕННАЯ ВЕРСИЯ
import { useEffect } from 'react';
import { useGameStore } from './useGameStore';

export const useKeyboardControls = () => {
  const { rollDice, buyProperty, endTurn, selectedProperty } = useGameStore();

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Пропускаем, если пользователь печатает в input или textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          rollDice();
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedProperty !== null) {
            buyProperty(selectedProperty);
          }
          break;
        case 'Tab':
          event.preventDefault();
          endTurn();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [rollDice, buyProperty, endTurn, selectedProperty]);
};