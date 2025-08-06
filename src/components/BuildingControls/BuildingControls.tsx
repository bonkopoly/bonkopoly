// 1. В BuildingControls.tsx - исправить логику отображения
import React from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { Property } from '@/types';
import { Home, Building2, AlertCircle } from 'lucide-react';
import styles from './BuildingControls.module.css';

interface BuildingControlsProps {
  onClose: () => void;
}

const BuildingControls: React.FC<BuildingControlsProps> = ({ onClose }) => {
  const { 
    properties, 
    players, 
    currentPlayer, 
    hasMonopoly, 
    canBuildHouse, 
    canBuildHotel, 
    buildHouse, 
    buildHotel 
  } = useGameStore();
  
  const player = players[currentPlayer];

  console.log('🏗️ BuildingControls debug:', {
    currentPlayer,
    playerExists: !!player,
    totalProperties: properties.length,
    playerPropertiesCount: properties.filter(prop => prop.owner === currentPlayer).length
  });

  // Группируем свойства игрока по цветам
  const playerProperties = properties.filter(prop => {
    const isOwned = prop.owner === currentPlayer;
    const isBuildable = prop.type === 'property'; // Только обычные свойства, не железные дороги/коммунальные
    
    console.log(`Property ${prop.name}:`, { isOwned, isBuildable, type: prop.type });
    
    return isOwned && isBuildable;
  });

  console.log('🏗️ Player buildable properties:', playerProperties.map(p => p.name));

  const monopolyGroups = playerProperties.reduce((groups, property) => {
    const group = property.group;
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(property);
    return groups;
  }, {} as Record<string, Property[]>);

  console.log('🏗️ Monopoly groups:', Object.keys(monopolyGroups));

  // Проверяем, есть ли у игрока монополии
  const monopoliesWithStatus = Object.entries(monopolyGroups).map(([group, groupProperties]) => {
    const hasGroupMonopoly = hasMonopoly(currentPlayer, group as any);
    console.log(`Group ${group}:`, { 
      hasMonopoly: hasGroupMonopoly, 
      propertiesCount: groupProperties.length,
      properties: groupProperties.map(p => p.name)
    });
    return { group, properties: groupProperties, hasMonopoly: hasGroupMonopoly };
  });

  const actualMonopolies = monopoliesWithStatus.filter(item => item.hasMonopoly);
  
  console.log('🏗️ Actual monopolies:', actualMonopolies.map(m => m.group));

  if (actualMonopolies.length === 0) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <div className={styles.header}>
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold">No Monopolies Available</span>
          </div>
          <p className={styles.message}>
            You need to own all properties of the same color to start building houses and hotels.
          </p>
          <div className="mt-4">
            <p className="text-sm text-gray-400">Your properties:</p>
            <ul className="text-xs text-gray-300 mt-2">
              {playerProperties.map(prop => (
                <li key={prop.id}>• {prop.name} ({prop.group})</li>
              ))}
            </ul>
          </div>
          <button
            onClick={onClose}
            className={styles.closeButton}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className="text-lg font-bold text-white mb-4">🏗️ Build Houses & Hotels</h2>
        
        <div className="space-y-4">
          {actualMonopolies.map(({ group, properties: groupProperties }) => (
            <div key={group} className={styles.propertyGroup}>
              <div className={styles.groupHeader}>
                <div 
                  className={styles.colorDot}
                  style={{ backgroundColor: groupProperties[0].color }}
                />
                <span className={styles.groupName}>{group.toUpperCase()}</span>
              </div>

              <div className="space-y-2">
                {groupProperties.map((property) => (
                  <div key={property.id} className={styles.propertyCard}>
                    <div className={styles.propertyInfo}>
                      <div className={styles.propertyName}>{property.name}</div>
                      <div className={styles.propertyStatus}>
                        {property.houses === 5 ? 
                          '🏨 Hotel' : 
                          `🏠 ${property.houses} Houses`
                        }
                      </div>
                    </div>

                    <div className={styles.buildButtons}>
                      {property.houses < 4 && (
                        <button
                          onClick={() => {
                            console.log(`🏠 Building house on ${property.name}`);
                            buildHouse(property.id);
                          }}
                          disabled={!canBuildHouse(property.id)}
                          className={`${styles.buildButton} ${styles.buildHouseButton} ${
                            canBuildHouse(property.id) ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600'
                          }`}
                          title={`Build House ($${property.housePrice})`}
                        >
                          <Home className="w-4 h-4" />
                          ${property.housePrice}
                        </button>
                      )}
                      
                      {property.houses === 4 && (
                        <button
                          onClick={() => {
                            console.log(`🏨 Building hotel on ${property.name}`);
                            buildHotel(property.id);
                          }}
                          disabled={!canBuildHotel(property.id)}
                          className={`${styles.buildButton} ${styles.buildHotelButton} ${
                            canBuildHotel(property.id) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600'
                          }`}
                          title="Upgrade to Hotel"
                        >
                          <Building2 className="w-4 h-4" />
                          Hotel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.priceInfo}>
                💰 House: ${groupProperties[0].housePrice} • Hotel: ${groupProperties[0].housePrice}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default BuildingControls;