import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import { Users, Home, DollarSign, X, Send, ArrowLeftRight, Clock, Check, XCircle, AlertCircle, Coins, Star } from 'lucide-react';

interface TradeModalProps {
    onClose: () => void;
    currentUserId?: string | null;
}

const TradeModal: React.FC<TradeModalProps> = ({ onClose, currentUserId }) => {
    const {
        players,
        properties,
        currentPlayer,
        activeTradeOffers,
        tradeSessions,
        createTradeSession,
        createTradeOffer,
        updateTradeOffer,
        acceptTradeOffer,
        rejectTradeOffer,
        cancelTradeSession,
        cleanupExpiredOffers
    } = useGameStore();

    // ИСПРАВЛЕНО: Используем правильные типы для ID
    const [selectedPartnerIndex, setSelectedPartnerIndex] = useState<number | null>(null);
    const [offeredProperties, setOfferedProperties] = useState<number[]>([]);
    const [requestedProperties, setRequestedProperties] = useState<number[]>([]);
    const [offeredMoney, setOfferedMoney] = useState<number>(0);
    const [requestedMoney, setRequestedMoney] = useState<number>(0);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [currentStep, setCurrentStep] = useState<'partner' | 'offer' | 'summary'>('partner');

    const currentPlayerId = currentPlayer;
    const currentPlayerData = players[currentPlayerId];

    // Очистка истекших предложений
    useEffect(() => {
        const interval = setInterval(() => {
            cleanupExpiredOffers();
        }, 30000);
        return () => clearInterval(interval);
    }, [cleanupExpiredOffers]);

    // ИСПРАВЛЕНО: Получаем доступных партнеров
    const getAvailablePartners = () => {
        return players.filter((player, index) => 
            index !== currentPlayerId // Сравниваем индексы, а не userId
        );
    };

    // ИСПРАВЛЕНО: Получаем мои доступные свойства
    const getMyAvailableProperties = () => {
        console.log('🔍 getMyAvailableProperties DEBUG:', {
            currentPlayerData,
            currentPlayerId,
            playerProperties: currentPlayerData?.properties
        });

        if (!currentPlayerData?.properties) {
            console.log('❌ No properties found for current player');
            return [];
        }

        const result = currentPlayerData.properties
            .map(propId => properties[propId])
            .filter(prop => {
                if (!prop) return false;
                // Можно торговать только свойствами без построек и не заложенными
                return !prop.mortgage && prop.houses === 0;
            });

        console.log('✅ Available properties for trade:', result);
        return result;
    };

    // ИСПРАВЛЕНО: Получаем свойства партнера по индексу
    const getPartnerAvailableProperties = (partnerIndex: number) => {
        const partner = players[partnerIndex];
        
        console.log('🔍 getPartnerAvailableProperties DEBUG:', {
            partnerIndex,
            partner,
            partnerName: partner?.name,
            partnerProperties: partner?.properties
        });

        if (!partner?.properties) {
            console.log('❌ No properties found for partner');
            return [];
        }

        const result = partner.properties
            .map(propId => properties[propId])
            .filter(prop => {
                if (!prop) return false;
                // Можно торговать только свойствами без построек и не заложенными
                return !prop.mortgage && prop.houses === 0;
            });

        console.log('✅ Partner available properties:', result);
        return result;
    };

    // Получаем токен игрока
    const getPlayerToken = (playerId: string | number): string => {
        const player = typeof playerId === 'number' ? 
            players[playerId] : 
            players.find(p => p.userId === String(playerId));
            
        if (!player) return '/images/tokens/default.png';

        const tokens = [
            'boot', 'car', 'cat', 'dog', 'hat', 'iron',
            'ship', 'thimble', 'wheelbarrow', 'horse'
        ];

        const tokenIndex = player.id % tokens.length;
        return `/images/tokens/${tokens[tokenIndex]}.png`;
    };

    // ИСПРАВЛЕНО: Получаем выбранного партнера
    const getSelectedPartner = () => {
        if (selectedPartnerIndex === null) return null;
        return players[selectedPartnerIndex];
    };

    // ИСПРАВЛЕНО: Создает новую торговую сессию
    const startTradeSession = (partnerIndex: number) => {
        console.log('🎯 Starting trade session:', {
            currentPlayerId,
            partnerIndex,
            participantIds: [currentPlayerId, partnerIndex]
        });

        const sessionId = createTradeSession([currentPlayerId, partnerIndex]);
        setActiveSessionId(sessionId);
        setSelectedPartnerIndex(partnerIndex);
        setCurrentStep('offer');
    };

    // ИСПРАВЛЕНО: Отправляет/обновляет предложение
    const submitOffer = () => {
        if (selectedPartnerIndex === null || !activeSessionId) {
            console.error('❌ Cannot submit offer: missing partner or session');
            return;
        }

        console.log('📝 Submitting trade offer:', {
            fromPlayerId: currentPlayerId,
            toPlayerId: selectedPartnerIndex,
            offeredProperties,
            offeredMoney,
            requestedProperties,
            requestedMoney
        });

        const offerData = {
            fromPlayerId: currentPlayerId,
            toPlayerId: selectedPartnerIndex, // Используем индекс напрямую
            offeredProperties,
            offeredMoney,
            requestedProperties,
            requestedMoney
        };

        try {
            const session = tradeSessions.find(s => s.id === activeSessionId);
            if (session?.currentOffer) {
                updateTradeOffer(activeSessionId, offerData);
            } else {
                createTradeOffer(activeSessionId, offerData);
            }
            setCurrentStep('summary');
        } catch (error) {
            console.error('❌ Error submitting offer:', error);
            // Показываем ошибку пользователю
            alert('Failed to send trade offer. Please try again.');
        }
    };

    // Принимает предложение
    const handleAcceptOffer = (sessionId: string, offerId: string) => {
        console.log('✅ Accepting offer:', { sessionId, offerId });
        acceptTradeOffer(sessionId, offerId);
        onClose();
    };

    // Отклоняет предложение
    const handleRejectOffer = (sessionId: string, offerId: string) => {
        console.log('❌ Rejecting offer:', { sessionId, offerId });
        rejectTradeOffer(sessionId, offerId);
    };

    // ИСПРАВЛЕНО: Сбрасывает форму
    const resetForm = () => {
        setSelectedPartnerIndex(null);
        setOfferedProperties([]);
        setRequestedProperties([]);
        setOfferedMoney(0);
        setRequestedMoney(0);
        setActiveSessionId(null);
        setCurrentStep('partner');
    };

    // ИСПРАВЛЕНО: Получаем входящие предложения
    const getIncomingOffers = () => {
        return activeTradeOffers.filter(offer => {
            const isForMe = offer.toPlayerId === currentPlayerId;
            const isPending = offer.status === 'pending';
            const notExpired = offer.expiresAt > Date.now();
            
            console.log('🔍 Checking incoming offer:', {
                offerId: offer.id,
                toPlayerId: offer.toPlayerId,
                currentPlayerId,
                isForMe,
                isPending,
                notExpired
            });
            
            return isForMe && isPending && notExpired;
        });
    };

    // ИСПРАВЛЕНО: Получаем исходящие предложения
    const getOutgoingOffers = () => {
        return activeTradeOffers.filter(offer => {
            const isFromMe = offer.fromPlayerId === currentPlayerId;
            const isPending = offer.status === 'pending';
            const notExpired = offer.expiresAt > Date.now();
            
            return isFromMe && isPending && notExpired;
        });
    };

    // Форматирует время до истечения
    const formatTimeLeft = (expiresAt: number) => {
        const timeLeft = Math.max(0, expiresAt - Date.now());
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // ОТЛАДОЧНАЯ ИНФОРМАЦИЯ
    console.log('🔍 TradeModal DEBUG:', {
        currentPlayerId,
        currentPlayerData: currentPlayerData?.name,
        selectedPartnerIndex,
        selectedPartner: getSelectedPartner()?.name,
        activeSessionId,
        currentStep,
        activeTradeOffers: activeTradeOffers.length,
        tradeSessions: tradeSessions.length
    });

    const availablePartners = getAvailablePartners();
    const myAvailableProperties = getMyAvailableProperties();
    const partnerAvailableProperties = selectedPartnerIndex !== null ? getPartnerAvailableProperties(selectedPartnerIndex) : [];
    const incomingOffers = getIncomingOffers();
    const outgoingOffers = getOutgoingOffers();

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-gradient-to-r from-pink-500 to-purple-600 shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">

                {/* Заголовок с градиентом */}
                <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-white/20 p-3 rounded-xl mr-4">
                                <ArrowLeftRight className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Property Trading</h2>
                                <div className="flex items-center mt-1">
                                    <img
                                        src={getPlayerToken(currentPlayerId)}
                                        alt="Your Token"
                                        className="w-6 h-6 mr-2"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    <p className="text-pink-100">{currentPlayerData?.name} • </p>
                                    <Coins className="w-4 h-4 ml-2 mr-1 text-yellow-300" />
                                    <span className="text-yellow-300 font-bold">${currentPlayerData?.money?.toLocaleString()}</span>
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

                <div className="p-6">
                    {/* Входящие предложения */}
                    {incomingOffers.length > 0 && (
                        <div className="mb-8 p-6 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/40 rounded-xl backdrop-blur-sm">
                            <h3 className="text-yellow-400 font-bold mb-4 flex items-center text-lg">
                                <div className="bg-yellow-500/20 p-2 rounded-lg mr-3">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                Incoming Trade Offers ({incomingOffers.length})
                            </h3>
                            <div className="space-y-4">
                                {incomingOffers.map(offer => {
                                    const fromPlayer = players[offer.fromPlayerId];
                                    const session = tradeSessions.find(s => s.currentOffer?.id === offer.id);
                                    
                                    if (!fromPlayer) {
                                        console.warn('❌ From player not found for offer:', offer.id);
                                        return null;
                                    }
                                    
                                    return (
                                        <div key={offer.id} className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-5 border-2 border-yellow-500/30 hover:border-yellow-400/50 transition-all">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center">
                                                    <img
                                                        src={getPlayerToken(offer.fromPlayerId)}
                                                        alt={`${fromPlayer.name} Token`}
                                                        className="w-8 h-8 mr-3"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                    <div>
                                                        <span className="text-white font-bold text-lg">{fromPlayer.name}</span>
                                                        <div className="text-yellow-400 text-sm">wants to trade with you</div>
                                                    </div>
                                                </div>
                                                <div className="bg-yellow-500/20 px-3 py-2 rounded-lg flex items-center">
                                                    <Clock className="w-4 h-4 mr-2 text-yellow-400" />
                                                    <span className="text-yellow-400 font-mono font-bold">
                                                        {formatTimeLeft(offer.expiresAt)}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 mb-5">
                                                <div className="bg-green-900/20 rounded-lg p-4 border border-green-500/30">
                                                    <h4 className="text-green-400 font-bold mb-3 flex items-center">
                                                        <Star className="w-4 h-4 mr-2" />
                                                        They Offer You:
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {offer.offeredProperties.map(propId => {
                                                            const property = properties[propId];
                                                            if (!property) return null;
                                                            
                                                            return (
                                                                <div key={propId} className="flex items-center bg-slate-700/30 rounded-lg p-2">
                                                                    <Home className="w-4 h-4 mr-2 text-green-400" />
                                                                    <div
                                                                        className="w-3 h-3 rounded mr-2"
                                                                        style={{ backgroundColor: property.color }}
                                                                    />
                                                                    <span className="text-white text-sm font-medium">{property.name}</span>
                                                                </div>
                                                            );
                                                        })}
                                                        {offer.offeredMoney > 0 && (
                                                            <div className="flex items-center bg-slate-700/30 rounded-lg p-2">
                                                                <Coins className="w-4 h-4 mr-2 text-yellow-400" />
                                                                <span className="text-yellow-400 font-bold">${offer.offeredMoney.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="bg-red-900/20 rounded-lg p-4 border border-red-500/30">
                                                    <h4 className="text-red-400 font-bold mb-3 flex items-center">
                                                        <ArrowLeftRight className="w-4 h-4 mr-2" />
                                                        They Want From You:
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {offer.requestedProperties.map(propId => {
                                                            const property = properties[propId];
                                                            if (!property) return null;
                                                            
                                                            return (
                                                                <div key={propId} className="flex items-center bg-slate-700/30 rounded-lg p-2">
                                                                    <Home className="w-4 h-4 mr-2 text-red-400" />
                                                                    <div
                                                                        className="w-3 h-3 rounded mr-2"
                                                                        style={{ backgroundColor: property.color }}
                                                                    />
                                                                    <span className="text-white text-sm font-medium">{property.name}</span>
                                                                </div>
                                                            );
                                                        })}
                                                        {offer.requestedMoney > 0 && (
                                                            <div className="flex items-center bg-slate-700/30 rounded-lg p-2">
                                                                <Coins className="w-4 h-4 mr-2 text-yellow-400" />
                                                                <span className="text-yellow-400 font-bold">${offer.requestedMoney.toLocaleString()}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex space-x-3">
                                                <button
                                                    onClick={() => session && handleAcceptOffer(session.id, offer.id)}
                                                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center shadow-lg"
                                                >
                                                    <Check className="w-5 h-5 mr-2" />
                                                    Accept Trade
                                                </button>
                                                <button
                                                    onClick={() => session && handleRejectOffer(session.id, offer.id)}
                                                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-3 rounded-xl font-bold transition-all duration-200 flex items-center justify-center shadow-lg"
                                                >
                                                    <XCircle className="w-5 h-5 mr-2" />
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Исходящие предложения */}
                    {outgoingOffers.length > 0 && (
                        <div className="mb-8 p-6 bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-2 border-blue-500/40 rounded-xl backdrop-blur-sm">
                            <h3 className="text-blue-400 font-bold mb-4 flex items-center text-lg">
                                <div className="bg-blue-500/20 p-2 rounded-lg mr-3">
                                    <Send className="w-5 h-5" />
                                </div>
                                Your Pending Offers ({outgoingOffers.length})
                            </h3>
                            <div className="space-y-3">
                                {outgoingOffers.map(offer => {
                                    const toPlayer = players[offer.toPlayerId];
                                    if (!toPlayer) return null;
                                    
                                    return (
                                        <div key={offer.id} className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-blue-500/30">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <span className="text-blue-300 mr-2">Offer sent to:</span>
                                                    <img
                                                        src={getPlayerToken(offer.toPlayerId)}
                                                        alt={`${toPlayer.name} Token`}
                                                        className="w-6 h-6 mr-2"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                    <span className="text-white font-bold">{toPlayer.name}</span>
                                                </div>
                                                <div className="flex items-center text-blue-400">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    <span className="font-mono">{formatTimeLeft(offer.expiresAt)}</span>
                                                </div>
                                            </div>
                                            <div className="text-blue-300 text-sm mt-2">
                                                ⏳ Waiting for {toPlayer.name} to respond...
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Основная форма создания предложения */}
                    {currentStep === 'partner' && (
                        <div>
                            <h3 className="text-white font-bold mb-6 text-2xl flex items-center">
                                <Users className="w-7 h-7 mr-3 text-orange-400" />
                                Select Trading Partner
                            </h3>
                            {availablePartners.length === 0 ? (
                                <div className="text-center py-12 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl border-2 border-dashed border-gray-600">
                                    <Users className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-white mb-3">No Partners Available</h3>
                                    <p className="text-gray-400">
                                        All other players need to own properties to trade
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {availablePartners.map((partner, index) => {
                                        // Найдем правильный индекс в массиве players
                                        const partnerIndex = players.findIndex(p => p.id === partner.id);
                                        
                                        return (
                                            <button
                                                key={partner.id}
                                                onClick={() => startTradeSession(partnerIndex)}
                                                className="p-6 bg-gradient-to-br from-slate-800/60 to-slate-900/60 hover:from-slate-700/60 hover:to-slate-800/60 border-2 border-white/10 hover:border-orange-500/50 rounded-xl transition-all duration-300 text-left group backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                                            >
                                                <div className="flex items-center mb-4">
                                                    <img
                                                        src={getPlayerToken(partnerIndex)}
                                                        alt={`${partner.name} Token`}
                                                        className="w-12 h-12 mr-4"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                    <div>
                                                        <span className="text-white font-bold text-xl">{partner.name}</span>
                                                        <div className="text-pink-400 text-sm">Click to trade</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center text-amber-400">
                                                        <Coins className="w-4 h-4 mr-2" />
                                                        <span className="font-bold">${partner.money.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex items-center text-blue-400">
                                                        <Home className="w-4 h-4 mr-2" />
                                                        <span>{partner.properties.length} properties</span>
                                                    </div>
                                                    <div className="text-pink-400 group-hover:text-pink-300 text-sm font-medium">
                                                        → Start Trading
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Форма создания предложения */}
                    {currentStep === 'offer' && selectedPartnerIndex !== null && (
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-white font-bold text-2xl flex items-center">
                                    <div className="bg-orange-500/20 p-3 rounded-xl mr-4">
                                        <ArrowLeftRight className="w-6 h-6 text-pink-400" />
                                    </div>
                                    Trading with{' '}
                                    <img
                                        src={getPlayerToken(selectedPartnerIndex)}
                                        alt="Partner Token"
                                        className="w-8 h-8 mx-3"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    {getSelectedPartner()?.name}
                                </h3>
                                <button
                                    onClick={resetForm}
                                    className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all"
                                >
                                    Cancel Trade
                                </button>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                {/* Мое предложение */}
                                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-6 border-2 border-green-500/30 backdrop-blur-sm">
                                    <h4 className="text-green-400 font-bold mb-6 flex items-center text-xl">
                                        <div className="bg-green-500/20 p-2 rounded-lg mr-3">
                                            <Send className="w-5 h-5" />
                                        </div>
                                        Your Offer
                                    </h4>

                                    {/* Мои свойства */}
                                    <div className="mb-6">
                                        <label className="text-white font-bold mb-4 block flex items-center">
                                            <Home className="w-4 h-4 mr-2" />
                                            Properties to Offer:
                                        </label>
                                        {myAvailableProperties.length === 0 ? (
                                            <div className="text-center py-6 bg-slate-800/30 rounded-lg border border-dashed border-gray-600">
                                                <Home className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                                <p className="text-gray-400 text-sm">No properties available to trade</p>
                                                <p className="text-gray-500 text-xs mt-1">Properties with buildings cannot be traded</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {myAvailableProperties.map(property => (
                                                    <label key={property.id} className="flex items-center p-3 hover:bg-slate-700/30 rounded-lg cursor-pointer transition-colors border hover:border-green-500/30">
                                                        <input
                                                            type="checkbox"
                                                            checked={offeredProperties.includes(property.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setOfferedProperties([...offeredProperties, property.id]);
                                                                } else {
                                                                    setOfferedProperties(offeredProperties.filter(id => id !== property.id));
                                                                }
                                                            }}
                                                            className="mr-4 w-4 h-4 text-green-500"
                                                        />
                                                        <div
                                                            className="w-4 h-4 rounded mr-3 border-2 border-white/20"
                                                            style={{ backgroundColor: property.color }}
                                                        />
                                                        <div className="flex-1">
                                                            <span className="text-white font-medium">{property.name}</span>
                                                            <div className="text-green-400 text-sm font-bold">${property.price?.toLocaleString()}</div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Деньги к предложению */}
                                    <div>
                                        <label className="text-white font-bold mb-3 block flex items-center">
                                            <Coins className="w-4 h-4 mr-2" />
                                            Money to Offer:
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={currentPlayerData?.money || 0}
                                            value={offeredMoney}
                                            onChange={(e) => setOfferedMoney(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border-2 border-green-500/30 focus:border-green-400 focus:outline-none transition-colors font-mono text-lg"
                                            placeholder="0"
                                        />
                                        <p className="text-green-300 text-sm mt-2 flex items-center">
                                            <Coins className="w-3 h-3 mr-1" />
                                            Available: ${currentPlayerData?.money?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Мои требования */}
                                <div className="bg-gradient-to-br from-red-900/30 to-rose-900/30 rounded-xl p-6 border-2 border-red-500/30 backdrop-blur-sm">
                                    <h4 className="text-red-400 font-bold mb-6 flex items-center text-xl">
                                        <div className="bg-red-500/20 p-2 rounded-lg mr-3">
                                            <ArrowLeftRight className="w-5 h-5" />
                                        </div>
                                        Your Request
                                    </h4>

                                    {/* Свойства партнера */}
                                    <div className="mb-6">
                                        <label className="text-white font-bold mb-4 block flex items-center">
                                            <Home className="w-4 h-4 mr-2" />
                                            Properties to Request:
                                        </label>
                                        {partnerAvailableProperties.length === 0 ? (
                                            <div className="text-center py-6 bg-slate-800/30 rounded-lg border border-dashed border-gray-600">
                                                <Home className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                                <p className="text-gray-400 text-sm">No properties available from partner</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {partnerAvailableProperties.map(property => (
                                                    <label key={property.id} className="flex items-center p-3 hover:bg-slate-700/30 rounded-lg cursor-pointer transition-colors border hover:border-red-500/30">
                                                        <input
                                                            type="checkbox"
                                                            checked={requestedProperties.includes(property.id)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setRequestedProperties([...requestedProperties, property.id]);
                                                                } else {
                                                                    setRequestedProperties(requestedProperties.filter(id => id !== property.id));
                                                                }
                                                            }}
                                                            className="mr-4 w-4 h-4 text-red-500"
                                                        />
                                                        <div
                                                            className="w-4 h-4 rounded mr-3 border-2 border-white/20"
                                                            style={{ backgroundColor: property.color }}
                                                        />
                                                        <div className="flex-1">
                                                            <span className="text-white font-medium">{property.name}</span>
                                                            <div className="text-red-400 text-sm font-bold">${property.price?.toLocaleString()}</div>
                                                            {property.mortgage && (
                                                                <div className="text-yellow-400 text-xs">⚠️ Mortgaged</div>
                                                            )}
                                                            {property.houses > 0 && (
                                                                <div className="text-orange-400 text-xs">🏠 {property.houses} houses</div>
                                                            )}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Деньги к запросу */}
                                    <div>
                                        <label className="text-white font-bold mb-3 block flex items-center">
                                            <Coins className="w-4 h-4 mr-2" />
                                            Money to Request:
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={getSelectedPartner()?.money || 0}
                                            value={requestedMoney}
                                            onChange={(e) => setRequestedMoney(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border-2 border-red-500/30 focus:border-red-400 focus:outline-none transition-colors font-mono text-lg"
                                            placeholder="0"
                                        />
                                        <p className="text-red-300 text-sm mt-2 flex items-center">
                                            <Coins className="w-3 h-3 mr-1" />
                                            Partner has: ${getSelectedPartner()?.money?.toLocaleString() || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Кнопки действий */}
                            <div className="flex space-x-4 mt-8">
                                <button
                                    onClick={submitOffer}
                                    disabled={
                                        offeredProperties.length === 0 &&
                                        requestedProperties.length === 0 &&
                                        offeredMoney === 0 &&
                                        requestedMoney === 0
                                    }
                                    className={`flex-1 py-4 px-6 rounded-xl font-bold transition-all duration-200 flex items-center justify-center text-lg shadow-lg ${offeredProperties.length > 0 || requestedProperties.length > 0 || offeredMoney > 0 || requestedMoney > 0
                                        ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white transform hover:-translate-y-1'
                                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    <Send className="w-5 h-5 mr-3" />
                                    Send Trade Offer
                                </button>
                                <button
                                    onClick={() => {
                                        setOfferedProperties([]);
                                        setRequestedProperties([]);
                                        setOfferedMoney(0);
                                        setRequestedMoney(0);
                                    }}
                                    className="px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-bold transition-all duration-200 shadow-lg"
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Подтверждение отправки */}
                    {currentStep === 'summary' && selectedPartnerIndex !== null && (
                        <div className="text-center py-12">
                            <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6 border-2 border-green-500/30">
                                <Send className="w-16 h-16 text-green-400" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">Trade Offer Sent!</h3>
                            <div className="max-w-md mx-auto mb-8">
                                <p className="text-gray-300 mb-4">
                                    Your trade offer has been sent to
                                </p>
                                <div className="flex items-center justify-center mb-4">
                                    <img
                                        src={getPlayerToken(selectedPartnerIndex)}
                                        alt="Partner Token"
                                        className="w-8 h-8 mr-3"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    <span className="text-white font-bold text-xl">{getSelectedPartner()?.name}</span>
                                </div>
                                <p className="text-yellow-400 font-medium">
                                    ⏱️ They have 2 minutes to respond
                                </p>
                            </div>
                            <div className="flex space-x-4 justify-center">
                                <button
                                    onClick={resetForm}
                                    className="px-8 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg transform hover:-translate-y-1"
                                >
                                    Make Another Offer
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-bold transition-all duration-200 shadow-lg"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Кнопка закрытия */}
                <div className="p-6 border-t border-white/10 bg-slate-900/50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-all duration-200 font-medium"
                    >
                        Close Trade Window
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TradeModal;