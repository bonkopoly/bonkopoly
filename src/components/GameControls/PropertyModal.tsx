import React from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { Property } from '@/types';
import { Building2, Home, User, Star, X } from 'lucide-react';

interface PropertyModalProps {
  property: Property;
  onClose: () => void;
}

const PropertyModal: React.FC<PropertyModalProps> = ({ property, onClose }) => {
  const { 
    players,
    getPropertyRent,
    hasMonopoly 
  } = useGameStore();

  console.log('PropertyModal render with property:', property);
  
  const owner = property.owner !== null ? players[property.owner] : null;
  const currentRent = getPropertyRent(property.id);
  const playerHasMonopoly = property.owner !== null ? hasMonopoly(property.owner, property.group) : false;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl border-2 border-blue-500/30 shadow-2xl max-w-md w-full mx-4">
        
        {/* Кнопка закрытия */}
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-slate-800 hover:bg-red-600 p-2 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Заголовок с цветной полосой */}
        <div className="mb-6">
          {property.type === 'property' && (
            <div 
              className="w-full h-2 rounded-t-lg mb-3"
              style={{ backgroundColor: property.color }}
            />
          )}
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{property.name}</h2>
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 capitalize">{property.type}</span>
                {property.type === 'property' && (
                  <span className="text-gray-400">• {property.group}</span>
                )}
              </div>
            </div>
            
            {/* Статус владения */}
            {owner ? (
              <div className="text-right">
                <div className="flex items-center text-yellow-400 text-sm mb-1">
                  <User className="w-4 h-4 mr-1" />
                  Owned
                </div>
                <div 
                  className="px-2 py-1 rounded text-xs font-bold"
                  style={{ backgroundColor: owner.color, color: '#fff' }}
                >
                  {owner.name}
                </div>
              </div>
            ) : (
              <div className="text-green-400 text-sm font-bold">
                Available
              </div>
            )}
          </div>
        </div>

        {/* Текущее состояние (дома/отели) */}
        {property.type === 'property' && property.houses > 0 && (
          <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {property.houses === 5 ? (
                  <>
                    <Building2 className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-red-400 font-bold">Hotel Built</span>
                  </>
                ) : (
                  <>
                    <Home className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-green-400 font-bold">
                      {property.houses} House{property.houses > 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
              {playerHasMonopoly && (
                <div className="flex items-center text-purple-400 text-sm">
                  <Star className="w-4 h-4 mr-1" />
                  Monopoly
                </div>
              )}
            </div>
          </div>
        )}

        {/* Основная информация */}
        <div className="space-y-4">
          
          {/* Цена покупки */}
          <div className="flex justify-between items-center p-3 bg-slate-800/30 rounded-lg">
            <span className="text-gray-400">Purchase Price:</span>
            <span className="text-white font-bold text-lg">${property.price}</span>
          </div>

          {/* Текущая рента */}
          {property.owner !== null && (
            <div className="flex justify-between items-center p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <span className="text-green-300">Current Rent:</span>
              <span className="text-green-400 font-bold text-lg">${currentRent}</span>
            </div>
          )}

          {/* Таблица рент для свойств */}
          {property.type === 'property' && (
            <div className="space-y-2">
              <div className="text-gray-300 font-semibold">Rent Schedule:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 rounded ${property.houses === 0 && !playerHasMonopoly ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-slate-800'}`}>
                  <div className="text-gray-400">Base Rent</div>
                  <div className="text-white font-bold">${property.rent[0]}</div>
                </div>
                <div className={`p-2 rounded ${property.houses === 0 && playerHasMonopoly ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-slate-800'}`}>
                  <div className="text-gray-400">With Monopoly</div>
                  <div className="text-white font-bold">${property.rent[1]}</div>
                </div>
                <div className={`p-2 rounded ${property.houses === 1 ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-slate-800'}`}>
                  <div className="text-gray-400">1 House</div>
                  <div className="text-white font-bold">${property.rent[2]}</div>
                </div>
                <div className={`p-2 rounded ${property.houses === 2 ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-slate-800'}`}>
                  <div className="text-gray-400">2 Houses</div>
                  <div className="text-white font-bold">${property.rent[3]}</div>
                </div>
                <div className={`p-2 rounded ${property.houses === 3 ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-slate-800'}`}>
                  <div className="text-gray-400">3 Houses</div>
                  <div className="text-white font-bold">${property.rent[4]}</div>
                </div>
                <div className={`p-2 rounded ${property.houses === 4 ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-slate-800'}`}>
                  <div className="text-gray-400">4 Houses</div>
                  <div className="text-white font-bold">${property.rent[5]}</div>
                </div>
                <div className={`p-2 rounded col-span-2 ${property.houses === 5 ? 'bg-blue-600/20 border border-blue-500/50' : 'bg-slate-800'}`}>
                  <div className="text-gray-400">Hotel</div>
                  <div className="text-white font-bold">${property.rent[5] || property.rent[property.rent.length - 1]}</div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <span className="text-orange-300">House/Hotel Cost:</span>
                <span className="text-orange-400 font-bold">${property.housePrice}</span>
              </div>
            </div>
          )}

          {/* Таблица рент для железных дорог */}
          {property.type === 'railroad' && (
            <div className="space-y-2">
              <div className="text-gray-300 font-semibold">Rent Schedule:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800 p-2 rounded">
                  <div className="text-gray-400">1 Railroad</div>
                  <div className="text-white font-bold">${property.rent[0]}</div>
                </div>
                <div className="bg-slate-800 p-2 rounded">
                  <div className="text-gray-400">2 Railroads</div>
                  <div className="text-white font-bold">${property.rent[1]}</div>
                </div>
                <div className="bg-slate-800 p-2 rounded">
                  <div className="text-gray-400">3 Railroads</div>
                  <div className="text-white font-bold">${property.rent[2]}</div>
                </div>
                <div className="bg-slate-800 p-2 rounded">
                  <div className="text-gray-400">4 Railroads</div>
                  <div className="text-white font-bold">${property.rent[3]}</div>
                </div>
              </div>
            </div>
          )}

          {/* Информация о коммунальных услугах */}
          {property.type === 'utility' && (
            <div className="space-y-2">
              <div className="text-gray-300 font-semibold">Rent Schedule:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800 p-2 rounded">
                  <div className="text-gray-400">1 Utility</div>
                  <div className="text-white font-bold">4 × Dice Roll</div>
                </div>
                <div className="bg-slate-800 p-2 rounded">
                  <div className="text-gray-400">2 Utilities</div>
                  <div className="text-white font-bold">10 × Dice Roll</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Только кнопка закрытия */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyModal;