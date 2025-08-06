// PropertyManagementPanel.tsx - ИСПРАВЛЕННАЯ ВЕРСИЯ

import React, { useState } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { 
    Home, 
    DollarSign, 
    Building, 
    Hammer, 
    Landmark,  // Заменили Bank на Landmark
    ShieldCheck,
    AlertTriangle,
    Coins,
    TrendingUp,
    X,
    Gavel
} from 'lucide-react';

interface PropertyManagementPanelProps {
    onClose: () => void;
}

const PropertyManagementPanel: React.FC<PropertyManagementPanelProps> = ({ onClose }) => {
    const {
        players,
        properties,
        currentPlayer,
        getCurrentPlayer,  // ДОБАВЛЯЕМ ЭТОТ ИМПОРТ
        mortgageProperty,
        unmortgageProperty,
        canMortgageProperty,
        canUnmortgageProperty,
        sellHouse,
        canSellBuilding,
        calculatePlayerAssets,
        currentAuction,
        placeBid,
        endAuction
    } = useGameStore();

    const [selectedTab, setSelectedTab] = useState<'properties' | 'auction'>('properties');
    const [bidAmount, setBidAmount] = useState<number>(0);

    // ИСПРАВЛЕННАЯ ЛОГИКА: Находим игрока который открыл панель
    const currentUser = getCurrentPlayer();
    const myPlayerIndex = players.findIndex(p => p.userId === currentUser.userId);
    const myPlayerData = myPlayerIndex >= 0 ? players[myPlayerIndex] : null;
    
    // Безопасное получение свойств ТОЛЬКО этого игрока
    const myProperties = (myPlayerData?.properties ?? [])
        .map(propId => properties[propId])
        .filter(prop => prop && prop.owner === myPlayerIndex);

    const totalAssets = calculatePlayerAssets ? calculatePlayerAssets(myPlayerIndex) : 0;

    // Группируем свойства по типам
    const groupedProperties = {
        properties: myProperties.filter(p => p.type === 'property'),
        railroads: myProperties.filter(p => p.type === 'railroad'),
        utilities: myProperties.filter(p => p.type === 'utility')
    };

    const handleMortgage = (propertyId: number) => {
        if (canMortgageProperty && canMortgageProperty(propertyId)) {
            mortgageProperty(propertyId);
        }
    };

    const handleUnmortgage = (propertyId: number) => {
        if (canUnmortgageProperty && canUnmortgageProperty(propertyId)) {
            unmortgageProperty(propertyId);
        }
    };

    const handleSellBuilding = (propertyId: number) => {
        if (canSellBuilding && canSellBuilding(propertyId)) {
            sellHouse(propertyId);
        }
    };

    const handlePlaceBid = () => {
        if (currentAuction && bidAmount > currentAuction.currentBid && myPlayerData && bidAmount <= myPlayerData.money) {
            placeBid(myPlayerIndex, bidAmount);
            setBidAmount(0);
        }
    };

    // Проверяем что у нас есть данные игрока
    if (!myPlayerData) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-red-500/50 shadow-2xl max-w-md w-full p-6 text-center">
                    <h2 className="text-2xl font-bold text-red-400 mb-4">❌ Error</h2>
                    <p className="text-white mb-4">Cannot find your player data. Please refresh the page.</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

    const PropertyCard = ({ property }: { property: any }) => {
        const canMortgage = canMortgageProperty ? canMortgageProperty(property.id) : false;
        const canUnmortgage = canUnmortgageProperty ? canUnmortgageProperty(property.id) : false;
        const canSell = canSellBuilding ? canSellBuilding(property.id) : false;
        const mortgageInterest = Math.floor(property.mortgageValue * 0.1);

        return (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-5 border-2 border-white/10 hover:border-blue-500/30 transition-all backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div 
                            className="w-6 h-6 rounded mr-3 border-2 border-white/30"
                            style={{ backgroundColor: property.color }}
                        />
                        <div>
                            <h3 className="text-white font-bold text-lg">{property.name}</h3>
                            <div className="flex items-center text-sm">
                                <DollarSign className="w-3 h-3 mr-1 text-green-400" />
                                <span className="text-green-400 font-bold">${property.price?.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    {property.mortgage && (
                        <div className="bg-red-500/20 px-3 py-1 rounded-full">
                            <span className="text-red-400 text-xs font-bold">MORTGAGED</span>
                        </div>
                    )}
                </div>

                {/* Информация о зданиях */}
                {property.type === 'property' && (
                    <div className="mb-4">
                        <div className="flex items-center text-sm text-gray-300 mb-2">
                            <Building className="w-4 h-4 mr-2" />
                            Buildings: {property.houses === 5 ? '1 Hotel' : `${property.houses} Houses`}
                        </div>
                        {property.houses > 0 && (
                            <div className="flex items-center text-xs text-blue-300">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Rent: ${property.rent?.[property.houses === 5 ? 5 : property.houses + 1]?.toLocaleString()}
                            </div>
                        )}
                    </div>
                )}

                {/* Действия */}
                <div className="space-y-2">
                    {/* Залог/Выкуп */}
                    {!property.mortgage && canMortgage && (
                        <button
                            onClick={() => handleMortgage(property.id)}
                            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center"
                        >
                            <Landmark className="w-4 h-4 mr-2" />
                            Mortgage for ${property.mortgageValue?.toLocaleString()}
                        </button>
                    )}

                    {property.mortgage && canUnmortgage && (
                        <button
                            onClick={() => handleUnmortgage(property.id)}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center"
                        >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Unmortgage for ${Math.floor(property.mortgageValue * 1.1)?.toLocaleString()}
                        </button>
                    )}

                    {/* Продажа зданий */}
                    {property.houses > 0 && canSell && (
                        <button
                            onClick={() => handleSellBuilding(property.id)}
                            className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center"
                        >
                            <Hammer className="w-4 h-4 mr-2" />
                            Sell {property.houses === 5 ? 'Hotel' : 'House'} for ${Math.floor(property.housePrice / 2)?.toLocaleString()}
                        </button>
                    )}

                    {/* Информация о залоге */}
                    {property.mortgage && (
                        <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-3">
                            <div className="flex items-center text-yellow-400 text-xs mb-1">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Mortgage Details
                            </div>
                            <div className="text-yellow-300 text-xs">
                                Original value: ${property.mortgageValue?.toLocaleString()}
                            </div>
                            <div className="text-yellow-300 text-xs">
                                Interest (10%): ${mortgageInterest?.toLocaleString()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-blue-500/50 shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
                
                {/* Заголовок */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-white/20 p-3 rounded-xl mr-4">
                                <Home className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Property Management</h2>
                                <div className="flex items-center mt-1">
                                    <p className="text-blue-100">{myPlayerData.name} • </p>
                                    <Coins className="w-4 h-4 ml-2 mr-1 text-yellow-300" />
                                    <span className="text-yellow-300 font-bold">${myPlayerData.money?.toLocaleString()}</span>
                                    <span className="text-blue-200 ml-3">Total Assets: ${totalAssets?.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white hover:bg-red-500/30 p-3 rounded-xl transition-all duration-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Остальной код компонента остается тот же... */}
                {/* Но теперь все ссылки на currentPlayerData заменены на myPlayerData */}
                
                <div className="p-6 border-b border-white/10">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setSelectedTab('properties')}
                            className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                selectedTab === 'properties'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                                    : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                            }`}
                        >
                            <Home className="w-5 h-5 inline mr-2" />
                            My Properties ({myProperties.length})
                        </button>
                        {currentAuction && (
                            <button
                                onClick={() => setSelectedTab('auction')}
                                className={`px-6 py-3 rounded-xl font-bold transition-all ${
                                    selectedTab === 'auction'
                                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white'
                                        : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                                }`}
                            >
                                <Gavel className="w-5 h-5 inline mr-2" />
                                Active Auction
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {/* Вкладка свойств */}
                    {selectedTab === 'properties' && (
                        <div>
                            {myProperties.length === 0 ? (
                                <div className="text-center py-12 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border-2 border-dashed border-gray-600">
                                    <Home className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-3">No Properties Owned</h3>
                                    <p className="text-gray-400">
                                        Land on unowned properties to start building your empire!
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Недвижимость */}
                                    {groupedProperties.properties.length > 0 && (
                                        <div>
                                            <h3 className="text-white font-bold text-xl mb-4 flex items-center">
                                                <Building className="w-6 h-6 mr-3 text-blue-400" />
                                                Properties ({groupedProperties.properties.length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {groupedProperties.properties.map(property => (
                                                    <PropertyCard key={property.id} property={property} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Железные дороги */}
                                    {groupedProperties.railroads.length > 0 && (
                                        <div>
                                            <h3 className="text-white font-bold text-xl mb-4 flex items-center">
                                                <span className="text-2xl mr-3">🚂</span>
                                                Railroads ({groupedProperties.railroads.length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                {groupedProperties.railroads.map(property => (
                                                    <PropertyCard key={property.id} property={property} />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Коммунальные услуги */}
                                    {groupedProperties.utilities.length > 0 && (
                                        <div>
                                            <h3 className="text-white font-bold text-xl mb-4 flex items-center">
                                                <span className="text-2xl mr-3">⚡</span>
                                                Utilities ({groupedProperties.utilities.length})
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {groupedProperties.utilities.map(property => (
                                                    <PropertyCard key={property.id} property={property} />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Финансовая сводка */}
                            {myProperties.length > 0 && (
                                <div className="mt-8 p-6 bg-gradient-to-r from-green-900/30 to-blue-900/30 border-2 border-green-500/30 rounded-xl">
                                    <h3 className="text-green-400 font-bold text-xl mb-4 flex items-center">
                                        <TrendingUp className="w-6 h-6 mr-3" />
                                        Financial Summary
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                        <div className="bg-slate-800/50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-yellow-400">${myPlayerData.money?.toLocaleString()}</div>
                                            <div className="text-sm text-gray-300">Cash</div>
                                        </div>
                                        <div className="bg-slate-800/50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-blue-400">{myProperties.length}</div>
                                            <div className="text-sm text-gray-300">Properties</div>
                                        </div>
                                        <div className="bg-slate-800/50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-green-400">${totalAssets?.toLocaleString()}</div>
                                            <div className="text-sm text-gray-300">Total Assets</div>
                                        </div>
                                        <div className="bg-slate-800/50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-purple-400">
                                                {myProperties.filter(p => p.mortgage).length}
                                            </div>
                                            <div className="text-sm text-gray-300">Mortgaged</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Вкладка аукциона - код остается тот же */}
                </div>

                {/* Кнопка закрытия */}
                <div className="p-6 border-t border-white/10 bg-slate-900/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all duration-200 font-medium"
                    >
                        Close Property Management
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PropertyManagementPanel;