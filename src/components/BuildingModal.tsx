import React from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { Home, Building2, X, DollarSign, Star } from 'lucide-react';

interface BuildingModalProps {
  onClose: () => void;
  currentUserId?: string | null;
}

const BuildingModal: React.FC<BuildingModalProps> = ({ onClose, currentUserId }) => {
  const { 
    properties, 
    players, 
    currentPlayer, 
    canBuildHouse, 
    canBuildHotel, 
    buildHouse, 
    buildHotel,
    hasBuiltThisTurn,
    getPropertyRent,
    saveGameState
  } = useGameStore();
  
  const player = players[currentPlayer];

  // Проверяем монополии игрока (упрощенная версия)
  const getPlayerMonopolies = () => {
    const monopolyGroups = [
      { name: 'brown', size: 2, properties: [1, 3] },
      { name: 'lightblue', size: 3, properties: [6, 8, 9] },
      { name: 'pink', size: 3, properties: [11, 13, 14] },
      { name: 'orange', size: 3, properties: [16, 18, 19] },
      { name: 'red', size: 3, properties: [21, 23, 24] },
      { name: 'yellow', size: 3, properties: [26, 27, 29] },
      { name: 'green', size: 3, properties: [31, 32, 34] },
      { name: 'darkblue', size: 2, properties: [37, 39] }
    ];
    
    const monopolies = [];
    
    for (const group of monopolyGroups) {
      const ownedInGroup = group.properties.filter(propId => 
        properties[propId].owner === currentPlayer
      );
      
      if (ownedInGroup.length === group.size) {
        const groupProperties = ownedInGroup.map(id => properties[id]);
        monopolies.push({
          groupName: group.name,
          properties: groupProperties
        });
      }
    }
    
    return monopolies;
  };

  const handleBuildHouse = async (propertyId: number, propertyName: string, price: number) => {
    if (player.money < price) {
      alert(`Not enough money! You need ${price} but only have ${player.money}`);
      return;
    }
    
    try {
      buildHouse(propertyId);
      setTimeout(() => saveGameState(), 100);
    } catch (error) {
      console.error('❌ Failed to build house:', error);
      alert('Failed to build house!');
    }
  };

  const handleBuildHotel = async (propertyId: number, propertyName: string, price: number) => {
    if (player.money < price) {
      alert(`Not enough money! You need ${price} but only have ${player.money}`);
      return;
    }
    
    try {
      buildHotel(propertyId);
      setTimeout(() => saveGameState(), 100);
    } catch (error) {
      console.error('❌ Failed to build hotel:', error);
      alert('Failed to build hotel!');
    }
  };

  const monopolies = getPlayerMonopolies();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl border-2 border-blue-500/30 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        
        {/* Компактный заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-blue-500/20">
          <div className="flex items-center">
            <Building2 className="w-6 h-6 text-blue-400 mr-3" />
            <div>
              <h2 className="text-lg font-bold text-white">Build Houses & Hotels</h2>
              <p className="text-blue-300 text-xs">{player?.name} • ${player?.money?.toLocaleString()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-red-600 p-1 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Предупреждение о строительстве */}
        {hasBuiltThisTurn && (
          <div className="m-4 p-3 bg-orange-900/30 border border-orange-500/30 rounded-lg">
            <p className="text-orange-300 text-sm font-medium">
              🚧 Already built this turn - End your turn to build again
            </p>
          </div>
        )}

        {/* Список монополий - компактный */}
        <div className="p-4">
          {monopolies.length === 0 ? (
            <div className="text-center py-8 bg-slate-800/30 rounded-lg border border-dashed border-gray-600">
              <Building2 className="w-8 h-8 text-gray-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">No Monopolies Yet</h3>
              <p className="text-gray-400 text-sm">
                Own all properties of the same color to build houses and hotels
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {monopolies.map(({ groupName, properties: groupProperties }) => (
                <div key={groupName} className="bg-slate-800/40 border border-white/10 rounded-lg p-4">
                  
                  {/* Компактный заголовок группы */}
                  <div className="flex items-center mb-3 pb-2 border-b border-white/10">
                    <div 
                      className="w-4 h-4 rounded mr-3 border border-white/50" 
                      style={{ backgroundColor: groupProperties[0].color }}
                    />
                    <h3 className="text-lg font-bold text-white capitalize flex-1">
                      {groupName} Properties
                    </h3>
                    <Star className="w-4 h-4 text-purple-400" />
                  </div>

                  {/* Компактный список свойств */}
                  <div className="space-y-3">
                    {groupProperties.map((property) => {
                      const canBuild = canBuildHouse(property.id);
                      const canHotel = canBuildHotel(property.id);
                      
                      return (
                        <div key={property.id} className="bg-slate-700/30 rounded-lg p-3">
                          
                          {/* Компактная информация о свойстве */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h4 className="text-sm font-bold text-white mr-2">{property.name}</h4>
                                {property.houses > 0 && (
                                  <span className="text-xs px-2 py-1 rounded font-bold">
                                    {property.houses === 5 ? (
                                      <span className="bg-red-600 text-white">🏨</span>
                                    ) : (
                                      <span className="bg-green-600 text-white">{property.houses}H</span>
                                    )}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-300">
                                Build: ${property.housePrice}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-400 font-bold text-sm">
                                ${getPropertyRent(property.id)}
                              </div>
                              <div className="text-xs text-gray-400">rent</div>
                            </div>
                          </div>

                          {/* Предупреждения */}
                          {!canBuild && property.houses < 4 && !hasBuiltThisTurn && (
                            <div className="mb-2 p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs">
                              <span className="text-yellow-300">⚠️ Build evenly across group first</span>
                            </div>
                          )}

                          {/* Компактные кнопки строительства */}
                          <div className="flex space-x-2">
                            {property.houses < 4 && (
                              <button
                                onClick={() => handleBuildHouse(property.id, property.name, property.housePrice)}
                                disabled={!canBuild || player.money < property.housePrice || hasBuiltThisTurn}
                                className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                                  canBuild && player.money >= property.housePrice && !hasBuiltThisTurn
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                              >
                                <Home className="w-4 h-4 mr-1" />
                                House
                              </button>
                            )}
                            
                            {property.houses === 4 && (
                              <button
                                onClick={() => handleBuildHotel(property.id, property.name, property.housePrice)}
                                disabled={!canHotel || player.money < property.housePrice || hasBuiltThisTurn}
                                className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                                  canHotel && player.money >= property.housePrice && !hasBuiltThisTurn
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                                }`}
                              >
                                <Building2 className="w-4 h-4 mr-1" />
                                Hotel
                              </button>
                            )}
                            
                            {property.houses === 5 && (
                              <div className="flex-1 flex items-center justify-center py-2 px-3 rounded-lg bg-yellow-600 text-white text-sm font-bold">
                                <Building2 className="w-4 h-4 mr-1" />
                                Complete
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Компактная кнопка закрытия */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuildingModal;