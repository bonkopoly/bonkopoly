import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { 
    Home, 
    DollarSign, 
    X, 
    ShoppingCart, 
    XCircle,
    Gavel,
    Clock,
    AlertTriangle
} from 'lucide-react';

interface PropertyPurchaseModalProps {
    propertyId: number;
    onClose: () => void;
}

const PropertyPurchaseModal: React.FC<PropertyPurchaseModalProps> = ({ propertyId, onClose }) => {
    const {
        players,
        properties,
        currentPlayer,
        buyProperty,
        declinePropertyPurchase, // Новая функция
        selectedProperty,
        setSelectedProperty
    } = useGameStore();

    const property = properties[propertyId];
    const currentPlayerData = players[currentPlayer];
    const canAfford = currentPlayerData?.money >= property.price;

    const handleBuy = () => {
        const success = buyProperty(propertyId);
        if (success) {
            setSelectedProperty(null);
            onClose();
        }
    };

    const handleDecline = () => {
        // Отклоняем покупку и запускаем аукцион
        if (declinePropertyPurchase) {
            declinePropertyPurchase(propertyId);
        }
        setSelectedProperty(null);
        onClose();
    };

    const handleClose = () => {
        setSelectedProperty(null);
        onClose();
    };

    // Закрываем модал если свойство больше не выбрано
    useEffect(() => {
        if (selectedProperty !== propertyId) {
            onClose();
        }
    }, [selectedProperty, propertyId, onClose]);

    if (!property || property.owner !== null) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-green-500/50 shadow-2xl max-w-2xl w-full">
                
                {/* Заголовок */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-white/20 p-3 rounded-xl mr-4">
                                <Home className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Property Available</h2>
                                <p className="text-green-100">Would you like to purchase this property?</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-white/80 hover:text-white hover:bg-red-500/30 p-3 rounded-xl transition-all duration-200"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Информация о свойстве */}
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl p-6 border-2 border-green-500/30 mb-6">
                        <div className="flex items-center mb-4">
                            <div 
                                className="w-12 h-12 rounded-lg mr-4 border-3 border-white/30 flex items-center justify-center"
                                style={{ backgroundColor: property.color }}
                            >
                                {property.icon ? (
                                    <span className="text-2xl">{property.icon}</span>
                                ) : (
                                    <Home className="w-6 h-6 text-white" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-white mb-1">{property.name}</h3>
                                <div className="flex items-center">
                                    <span className="text-gray-300 capitalize mr-3">{property.type}</span>
                                    {property.group !== 'special' && (
                                        <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm">
                                            {property.group}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Цена и детали */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center mb-3">
                                    <DollarSign className="w-6 h-6 text-green-400 mr-2" />
                                    <div>
                                        <div className="text-3xl font-bold text-green-400">
                                            ${property.price?.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-400">Purchase Price</div>
                                    </div>
                                </div>
                                
                                {property.mortgageValue && (
                                    <div className="text-sm text-gray-300 mb-2">
                                        Mortgage Value: ${property.mortgageValue?.toLocaleString()}
                                    </div>
                                )}
                            </div>

                            <div>
                                {/* Информация об аренде */}
                                {property.rent && property.rent.length > 0 && (
                                    <div>
                                        <div className="text-sm text-gray-400 mb-2">Rent Information:</div>
                                        <div className="space-y-1 text-sm">
                                            <div className="text-blue-300">Base Rent: ${property.rent[0]}</div>
                                            {property.type === 'property' && (
                                                <>
                                                    <div className="text-purple-300">With Monopoly: ${property.rent[1]}</div>
                                                    {property.rent[2] && <div className="text-yellow-300">1 House: ${property.rent[2]}</div>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Информация о строительстве */}
                                {property.type === 'property' && property.housePrice && (
                                    <div className="mt-3">
                                        <div className="text-sm text-gray-400 mb-1">Building Cost:</div>
                                        <div className="text-sm text-orange-300">
                                            Houses/Hotels: ${property.housePrice?.toLocaleString()} each
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Финансовая информация игрока */}
                    <div className="bg-slate-800/40 rounded-xl p-4 border border-blue-500/30 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-white font-bold text-lg">{currentPlayerData?.name}</div>
                                <div className="text-blue-300">Your Cash</div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-yellow-400">
                                    ${currentPlayerData?.money?.toLocaleString()}
                                </div>
                                {!canAfford && (
                                    <div className="text-red-400 text-sm flex items-center">
                                        <AlertTriangle className="w-4 h-4 mr-1" />
                                        Insufficient funds
                                    </div>
                                )}
                            </div>
                        </div>

                        {canAfford && (
                            <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-300">After purchase:</span>
                                    <span className="text-green-400 font-bold">
                                        ${(currentPlayerData?.money - property.price)?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Предупреждение об аукционе */}
                    <div className="bg-orange-900/30 border border-orange-500/40 rounded-xl p-4 mb-6">
                        <div className="flex items-center text-orange-400 mb-2">
                            <Gavel className="w-5 h-5 mr-2" />
                            <span className="font-bold">Auction Notice</span>
                        </div>
                        <p className="text-orange-200 text-sm">
                            If you decline to purchase this property, it will be put up for auction. 
                            All players (including you) can then bid on it!
                        </p>
                    </div>

                    {/* Кнопки действий */}
                    <div className="flex space-x-4">
                        <button
                            onClick={handleBuy}
                            disabled={!canAfford}
                            className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center ${
                                canAfford
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg transform hover:-translate-y-1'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            <ShoppingCart className="w-6 h-6 mr-3" />
                            {canAfford ? `Buy for $${property.price?.toLocaleString()}` : 'Cannot Afford'}
                        </button>

                        <button
                            onClick={handleDecline}
                            className="flex-1 py-4 px-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center shadow-lg"
                        >
                            <Gavel className="w-6 h-6 mr-3" />
                            Decline & Auction
                        </button>
                    </div>

                    {/* Дополнительная информация */}
                    <div className="mt-4 text-center">
                        <p className="text-gray-400 text-sm">
                            You must make a decision to continue the game
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PropertyPurchaseModal;