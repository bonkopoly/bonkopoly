import { Property, Player } from '@/types';
import { PROPERTY_GROUPS } from './gameConstants';

export const calculateRent = (property: Property, owner: Player, dice: [number, number]): number => {
  if (property.type === 'railroad') {
    const railroadsOwned = owner.properties.filter(id => {
      // This would need access to all properties to check type
      return true; // Simplified for now
    }).length;
    return 25 * Math.pow(2, railroadsOwned - 1);
  }
  
  if (property.type === 'utility') {
    const utilitiesOwned = owner.properties.filter(id => {
      // This would need access to all properties to check type
      return true; // Simplified for now
    }).length;
    const multiplier = utilitiesOwned === 1 ? 4 : 10;
    return multiplier * (dice[0] + dice[1]);
  }
  
  // Исправляем ошибку - property.rent может быть number[] или undefined
  if (Array.isArray(property.rent)) {
    return property.rent[property.houses] || property.rent[0] || 0;
  }
  return typeof property.rent === 'number' ? property.rent : 0;
};

export const hasMonopoly = (player: Player, property: Property, allProperties: Property[]): boolean => {
  const groupProperties = allProperties.filter(p => p.group === property.group && p.type === 'property');
  return groupProperties.every(p => p.owner === player.id);
};

export const getPropertyGroup = (propertyName: string): string => {
  for (const [group, properties] of Object.entries(PROPERTY_GROUPS)) {
    // Исправляем ошибку - используем type assertion правильно
    if ((properties as readonly string[]).includes(propertyName)) {
      return group;
    }
  }
  return 'UNKNOWN';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
};

export const getPlayerColor = (playerId: number): string => {
  const colors = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981'];
  return colors[playerId] || '#6b7280';
};