// src/components/AuctionTimer.tsx - ЧИСТАЯ ВЕРСИЯ БЕЗ ОШИБОК
import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import {
    Gavel,
    Clock,
    Users,
    Crown,
    Plus,
    XCircle
} from 'lucide-react';

const AuctionTimer: React.FC = () => {
    const {
        currentAuction,
        endAuction,
        players,
        properties,
        getCurrentPlayer,
        increaseBid,
        declineAuction
    } = useGameStore();

    const [timeLeft, setTimeLeft] = useState(0);

    // ✅ ТАЙМЕР АУКЦИОНА
    useEffect(() => {
        if (!currentAuction) {
            console.log('⏰ No auction - timer stopped');
            return;
        }

        console.log('⏰ Starting auction timer');

        const interval = setInterval(() => {
            const currentTime = Date.now();
            const auctionStartTime = currentAuction.timestamp;
            const elapsedTime = currentTime - auctionStartTime;
            const remaining = Math.max(0, 30000 - elapsedTime);

            setTimeLeft(remaining);

            if (remaining <= 0) {
                console.log('⏰ Time up! Ending auction');
                endAuction();
                clearInterval(interval);
            }
        }, 1000);

        return () => {
            console.log('⏰ Cleaning up auction timer');
            clearInterval(interval);
        };
    }, [currentAuction?.timestamp, endAuction]);

    // ✅ ПРОВЕРКИ РЕНДЕРА
    if (!currentAuction) {
        console.log('🚫 AuctionTimer: No auction, not rendering');
        return null;
    }

    if (typeof currentAuction !== 'object' || currentAuction === null) {
        console.log('🚫 AuctionTimer: Invalid auction object');
        return null;
    }

    if (currentAuction.propertyId === null || currentAuction.propertyId === undefined) {
        console.log('🚫 AuctionTimer: PropertyId is null/undefined');
        return null;
    }

    const property = properties[currentAuction.propertyId];
    if (!property) {
        console.log('🚫 AuctionTimer: Property not found');
        return null;
    }

    // ✅ ВРЕМЕННОЕ РЕШЕНИЕ: ПОКАЗЫВАЕМ АУКЦИОН ВСЕМ, ОПРЕДЕЛЯЕМ УЧАСТНИКА ПО АКТИВНЫМ УЧАСТНИКАМ
    const auctionCreatorIndex = currentAuction.auctionCreator ?? 0;
    const auctionCreatorPlayer = players[auctionCreatorIndex];

    const gameCurrentPlayer = getCurrentPlayer();
    const gameCurrentPlayerIndex = players.findIndex(p => p.userId === gameCurrentPlayer.userId);

    // АКТИВНЫЕ УЧАСТНИКИ АУКЦИОНА
    const activeParticipants = currentAuction.activeParticipants || currentAuction.participants || [];

    console.log('🎯 AUCTION LOGIC:', {
        auctionCreatorIndex,
        auctionCreatorName: auctionCreatorPlayer?.name,
        gameCurrentPlayerIndex,
        gameCurrentPlayerName: gameCurrentPlayer.name,
        activeParticipants,
        activeParticipantsDetailed: activeParticipants.map(id => ({
            id,
            player: players[id],
            name: players[id]?.name
        })),
        allPlayers: players.map((p, idx) => ({
            idx,
            name: p.name,
            userId: p.userId,
            isCurrentGamePlayer: p.userId === gameCurrentPlayer.userId
        }))
    });

    // ✅ ВРЕМЕННО ПОКАЗЫВАЕМ ВСЕМ ДЛЯ ОТЛАДКИ
    console.log('🔧 TEMPORARILY SHOWING AUCTION TO EVERYONE FOR DEBUG');

    // ЗАКОММЕНТИРУЕМ ПРОВЕРКУ НА АКТИВНОГО УЧАСТНИКА
    // const isActiveParticipant = activeParticipants.includes(gameCurrentPlayerIndex);
    // if (!isActiveParticipant) {
    //     console.log('🚫 Player is not an active participant, hiding auction');
    //     return null;
    // }
    // ✅ ПОКАЗЫВАЕМ ВСЕМ ДЛЯ ОТЛАДКИ
    const playerData = players[gameCurrentPlayerIndex];
    const canParticipate = activeParticipants.includes(gameCurrentPlayerIndex);

    const timeInSeconds = Math.ceil(timeLeft / 1000);
    const isUrgent = timeInSeconds <= 10;
    const nextBid = currentAuction.currentBid + 20;
    const canAffordBid = playerData && playerData.money >= nextBid;
    const canBid = canParticipate && canAffordBid && timeInSeconds > 0;
    const canDecline = canParticipate && timeInSeconds > 0;

    const currentBidder = currentAuction.currentBidder !== null ? players[currentAuction.currentBidder] : null;

    console.log('🎯 PERMISSIONS:', {
        gameCurrentPlayerName: gameCurrentPlayer.name,
        gameCurrentPlayerIndex,
        activeParticipants,
        includesPlayer: activeParticipants.includes(gameCurrentPlayerIndex),
        canParticipate,
        canBid,
        canDecline,
        playerMoney: playerData?.money,
        nextBidCost: nextBid,
        playerDataExists: !!playerData
    });

    const handleIncreaseBid = () => {
        if (canBid && gameCurrentPlayerIndex >= 0) {
            console.log('💰 Increasing bid from', gameCurrentPlayerIndex);
            increaseBid(gameCurrentPlayerIndex);
        }
    };

    const handleDecline = () => {
        if (canDecline && gameCurrentPlayerIndex >= 0) {
            console.log('❌ Declining auction from', gameCurrentPlayerIndex);
            declineAuction(gameCurrentPlayerIndex);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className={`bg-gradient-to-r ${isUrgent ? 'from-red-600 to-red-700' : 'from-orange-600 to-amber-600'} text-white rounded-2xl shadow-2xl border-2 ${isUrgent ? 'border-red-400' : 'border-orange-400'} backdrop-blur-sm w-full max-w-2xl ${isUrgent ? 'animate-pulse' : ''}`}>

                {/* Заголовок */}
                <div className="flex items-center justify-between p-6 border-b border-white/20">
                    <div className="flex items-center">
                        <div className="bg-white/20 p-3 rounded-xl mr-4">
                            <Gavel className="w-8 h-8" />
                        </div>
                        <div>
                            <div className="font-bold text-2xl">Property Auction</div>
                            <div className="text-lg opacity-90">{property.name}</div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className={`bg-white/20 px-4 py-2 rounded-full flex items-center ${isUrgent ? 'bg-red-500/30' : ''}`}>
                            <Clock className="w-5 h-5 mr-2" />
                            <span className="font-mono font-bold text-2xl">
                                {timeInSeconds}s
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {/* Информация о ставке */}
                    <div className="bg-white/10 rounded-xl p-6 mb-6">
                        <div className="grid grid-cols-2 gap-6 text-center">
                            <div>
                                <div className="text-sm opacity-75 mb-1">Current Bid</div>
                                <div className="text-4xl font-bold text-yellow-300">
                                    ${currentAuction.currentBid.toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm opacity-75 mb-1">Next Bid (+$20)</div>
                                <div className="text-3xl font-bold text-green-300">
                                    ${nextBid.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Статус игрока */}
                    <div className="text-center mb-6">
                        <div className="text-xs text-gray-400 mb-2">
                            DEBUG: You={gameCurrentPlayer.name}(idx:{gameCurrentPlayerIndex}) | Creator={auctionCreatorPlayer?.name}(idx:{auctionCreatorIndex}) | CanParticipate={canParticipate.toString()}
                        </div>

                        <div className="text-white text-lg">
                            {canParticipate ? (
                                <>🎯 Your turn to bid or decline! (Started by {auctionCreatorPlayer?.name})</>
                            ) : (
                                <>🕹️ You are not participating in this auction (Started by {auctionCreatorPlayer?.name})</>
                            )}
                        </div>
                    </div>

                    {/* Текущий лидер */}
                    {currentBidder ? (
                        <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-center text-yellow-200">
                                <Crown className="w-6 h-6 mr-3" />
                                <span className="text-lg">
                                    <span className="font-bold">{currentBidder.name}</span> is winning with ${currentAuction.currentBid.toLocaleString()}!
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-500/20 border border-gray-400/30 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-center text-gray-300">
                                <Users className="w-6 h-6 mr-3" />
                                <span className="text-lg">No bids yet! Starting at ${property.price.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    {/* Кнопки действий */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <button
                            onClick={handleIncreaseBid}
                            disabled={!canBid}
                            className={`py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center ${canBid
                                    ? 'bg-green-600 hover:bg-green-700 text-white transform hover:scale-105'
                                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <Plus className="w-6 h-6 mr-2" />
                            Bid ${nextBid.toLocaleString()}
                        </button>

                        <button
                            onClick={handleDecline}
                            disabled={!canDecline}
                            className={`py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center ${canDecline
                                    ? 'bg-red-600 hover:bg-red-700 text-white transform hover:scale-105'
                                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <XCircle className="w-6 h-6 mr-2" />
                            Decline
                        </button>
                    </div>

                    {/* Информация о деньгах */}
                    <div className="text-center mb-6">
                        <span className="text-white/75">
                            Your cash: ${playerData?.money?.toLocaleString() || '0'}
                            {!canAffordBid && (
                                <span className="text-red-300 ml-2">(Cannot afford ${nextBid.toLocaleString()})</span>
                            )}
                        </span>
                    </div>

                    {/* Участники */}
                    <div className="pt-6 border-t border-white/20">
                        <div className="text-center text-white/75 mb-4">
                            <span className="text-lg">
                                Active: {activeParticipants.length} |
                                Declined: {(currentAuction.declinedParticipants || []).length}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Активные участники */}
                            <div>
                                <div className="text-center text-green-300 font-bold mb-2">Active Bidders</div>
                                <div className="space-y-2">
                                    {activeParticipants.map(participantId => {
                                        const participant = players[participantId];
                                        const isCurrentBidder = currentAuction.currentBidder === participantId;

                                        return (
                                            <div
                                                key={participantId}
                                                className={`px-3 py-2 rounded-lg text-sm text-center ${isCurrentBidder
                                                        ? 'bg-yellow-500/30 text-yellow-200 border border-yellow-400'
                                                        : 'bg-green-500/20 text-green-200'
                                                    }`}
                                            >
                                                {participant?.name || 'Unknown'}
                                                {isCurrentBidder && ' 👑'}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Отказавшиеся + Создатель */}
                            <div>
                                <div className="text-center text-red-300 font-bold mb-2">Not Participating</div>
                                <div className="space-y-2">
                                    {/* Создатель аукциона */}
                                    <div className="px-3 py-2 rounded-lg text-sm text-center bg-blue-500/20 text-blue-200">
                                        {auctionCreatorPlayer?.name || 'Unknown'} (Creator)
                                    </div>

                                    {/* Отказавшиеся */}
                                    {(currentAuction.declinedParticipants || []).map(participantId => {
                                        const participant = players[participantId];

                                        return (
                                            <div
                                                key={participantId}
                                                className="px-3 py-2 rounded-lg text-sm text-center bg-red-500/20 text-red-200"
                                            >
                                                {participant?.name || 'Unknown'} ❌
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuctionTimer;