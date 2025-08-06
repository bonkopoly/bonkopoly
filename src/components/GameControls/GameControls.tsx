// GameControls.tsx - ПОЛНАЯ ВЕРСИЯ С КНОПКОЙ АУКЦИОНА

import React, { useState } from 'react';
import { Dice1, Dice2, Home, ArrowRight, Users, Building2, Clock, Settings, Gavel } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import DiceDisplay from './DiceDisplay';
import { realtimeGameService } from '@/lib/supabase';

interface GameControlsProps {
    currentUserId?: string | null;
    currentPlayer?: any;
    onOpenTradeModal: () => void;
    onOpenPropertyManagement?: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ 
    currentUserId, 
    currentPlayer, 
    onOpenTradeModal,
    onOpenPropertyManagement 
}) => {
    const {
        rollDice,
        buyProperty,
        endTurn,
        diceRolled,
        selectedProperty,
        addToLog,
        getCurrentPlayer,
        roomId,
        isBuildingControlsOpen,
        openBuildingControls,
        closeBuildingControls,
        players,
        startPropertyAuction,
        properties
    } = useGameStore();

    // ИСПРАВЛЯЕМ ПОРЯДОК: сначала вычисляем isMyTurn, потом используем
    const isMyTurn = useGameStore((state) => {
        const currentPlayer = state.getCurrentPlayer();

        if (!currentUserId || !currentPlayer?.userId || !state.players?.length) {
            return false;
        }

        return currentPlayer.userId === currentUserId;
    });

    // ТЕПЕРЬ canIPlay использует правильно объявленную isMyTurn
    const canIPlay = isMyTurn;

    // ИСПРАВЛЯЕМ: Проверяем недвижимость ТОЛЬКО текущего пользователя
    const myPlayerIndex = players.findIndex(p => p.userId === currentUserId);
    const myPlayer = myPlayerIndex >= 0 ? players[myPlayerIndex] : null;
    const hasMyProperties = (myPlayer?.properties?.length ?? 0) > 0;

    // Проверяем можно ли купить выбранное свойство
    const canBuySelectedProperty = selectedProperty !== null && 
                                  properties[selectedProperty]?.owner === null &&
                                  properties[selectedProperty]?.price > 0;

    // Проверяем можно ли выставить на аукцион
    const canStartAuction = selectedProperty !== null && 
                           properties[selectedProperty]?.owner === null &&
                           properties[selectedProperty]?.price > 0;

    const handleRollDice = async () => {
        if (!canIPlay) {
            addToLog(`⏳ Wait for your turn! It's ${currentPlayer.name}'s turn.`);
            return;
        }

        try {
            console.log('🎲 STARTING ROLL DICE ACTION for user:', currentUserId);
            rollDice();
            await new Promise(resolve => setTimeout(resolve, 200));

            const newState = useGameStore.getState();
            const metadata = {
                playerId: currentUserId,
                action: 'roll_dice',
                timestamp: Date.now()
            };

            await realtimeGameService.updateGameState(roomId!, newState, metadata);
            console.log('🎲 Successfully sent to realtime');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            console.error('🎲 ERROR in handleRollDice:', errorMessage);
            addToLog(`❌ Error rolling dice: ${errorMessage}`);
        }
    };

    const handleOpenTrade = () => {
        if (!canIPlay) {
            addToLog(`⏳ Wait for your turn! It's ${currentPlayer.name}'s turn.`);
            return;
        }
        console.log('🎯 Trade button clicked by:', currentUserId);
        onOpenTradeModal();
    };

    // ИСПРАВЛЯЕМ: Добавляем проверки безопасности
    const handleOpenPropertyManagement = () => {
        if (!canIPlay) {
            addToLog(`⏳ Wait for your turn! It's ${currentPlayer.name}'s turn.`);
            return;
        }
        
        if (!hasMyProperties) {
            addToLog(`❌ You don't own any properties yet!`);
            return;
        }

        console.log('🏠 Property management button clicked by:', currentUserId);
        if (onOpenPropertyManagement) {
            onOpenPropertyManagement();
        }
    };

    const handleBuyProperty = async () => {
        console.log('🛒 BUY PROPERTY DEBUG:', {
            currentUserId,
            currentPlayerFromStore: getCurrentPlayer(),
            currentPlayerFromProp: currentPlayer,
            canIPlay,
            selectedProperty
        });

        if (!canIPlay) {
            addToLog(`⏳ Wait for your turn! It's ${currentPlayer.name}'s turn.`);
            return;
        }

        if (selectedProperty === null) {
            addToLog('⚠️ Select a property first!');
            return;
        }

        try {
            const success = buyProperty(selectedProperty);
            if (!success) return;

            const newState = useGameStore.getState();
            const metadata = {
                playerId: currentUserId,
                action: 'buy_property',
                propertyId: selectedProperty,
                timestamp: Date.now()
            };

            await realtimeGameService.updateGameState(roomId!, newState, metadata);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            addToLog(`❌ Error buying property: ${errorMessage}`);
        }
    };

    // НОВАЯ ФУНКЦИЯ ДЛЯ АУКЦИОНА
    const handleStartAuction = async () => {
        if (!canIPlay) {
            addToLog(`⏳ Wait for your turn! It's ${currentPlayer.name}'s turn.`);
            return;
        }

        if (selectedProperty === null) {
            addToLog('⚠️ Select a property first!');
            return;
        }

        const property = properties[selectedProperty];
        if (!property || property.owner !== null) {
            addToLog(`❌ Property not available for auction`);
            return;
        }

        try {
            console.log('🏛️ Starting auction for property:', selectedProperty);
            startPropertyAuction(selectedProperty);

            const newState = useGameStore.getState();
            const metadata = {
                playerId: currentUserId,
                action: 'start_auction',
                propertyId: selectedProperty,
                propertyName: property.name,
                timestamp: Date.now()
            };

            await realtimeGameService.updateGameState(roomId!, newState, metadata);
            console.log('✅ Auction started and synced');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            addToLog(`❌ Error starting auction: ${errorMessage}`);
        }
    };

    const handleEndTurn = async () => {
        if (!canIPlay) {
            addToLog(`⏳ Wait for your turn! It's ${currentPlayer.name}'s turn.`);
            return;
        }

        try {
            endTurn();

            const newState = useGameStore.getState();
            const metadata = {
                playerId: currentUserId,
                action: 'end_turn',
                timestamp: Date.now()
            };

            await realtimeGameService.updateGameState(roomId!, newState, metadata);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            addToLog(`❌ Error ending turn: ${errorMessage}`);
        }
    };

    const handleOpenBuildingControls = () => {
        if (!canIPlay) {
            addToLog(`⏳ Wait for your turn! It's ${currentPlayer.name}'s turn.`);
            return;
        }

        console.log('🏗️ Opening building controls');
        openBuildingControls();
    };

    return (
        <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-red-500/20 to-pink-500/20 rounded-xl blur-xl"></div>
            <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 p-3 shadow-xl">
                <div className="text-center mb-3 p-2 rounded-lg bg-gradient-to-r from-slate-800/50 to-slate-700/50 border border-white/10">
                    <div className="flex items-center justify-center space-x-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-bold text-white">
                            {canIPlay ? (
                                <span className="text-green-400">🎯 Your Turn!</span>
                            ) : (
                                <span className="text-yellow-400">⏳ {currentPlayer?.name}'s Turn</span>
                            )}
                        </span>
                    </div>
                    {!canIPlay && (
                        <div className="text-xs text-gray-400 mt-1">
                            Wait for your turn to make moves
                        </div>
                    )}
                </div>
                <div className="text-center mb-3">
                    <h3 className="text-xs font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent mb-2">
                        🎲 ROLL THE DICE
                    </h3>
                    <div className="mb-2">
                        <DiceDisplay />
                    </div>
                    <button
                        onClick={handleRollDice}
                        disabled={diceRolled || !canIPlay}
                        className={`w-full font-bold py-2 px-3 rounded-lg transform transition-all duration-200 text-xs flex items-center justify-center space-x-1 ${canIPlay && !diceRolled
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white hover:scale-105'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                    >
                        <Dice1 className="w-3 h-3" />
                        <span>
                            {!canIPlay ? 'WAIT YOUR TURN' : diceRolled ? 'ROLLED!' : 'ROLL DICE'}
                        </span>
                        <Dice2 className="w-3 h-3" />
                    </button>
                </div>
                <div className="space-y-2">
                    <button
                        onClick={handleBuyProperty}
                        disabled={!canBuySelectedProperty || !canIPlay}
                        className={`w-full font-bold py-2 px-3 rounded-lg transform transition-all duration-200 text-xs flex items-center justify-center space-x-1 ${canIPlay && canBuySelectedProperty
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white hover:scale-105'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                    >
                        <Home className="w-3 h-3" />
                        <span>BUY PROPERTY</span>
                    </button>

                    {/* НОВАЯ КНОПКА АУКЦИОНА */}
                    <button
                        onClick={handleStartAuction}
                        disabled={!canStartAuction || !canIPlay}
                        className={`w-full font-bold py-2 px-3 rounded-lg transform transition-all duration-200 text-xs flex items-center justify-center space-x-1 ${canIPlay && canStartAuction
                            ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white hover:scale-105'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                    >
                        <Gavel className="w-3 h-3" />
                        <span>START AUCTION</span>
                    </button>

                    <button
                        onClick={handleOpenBuildingControls}
                        disabled={!canIPlay}
                        className={`w-full font-bold py-2 px-3 rounded-lg transform transition-all duration-200 text-xs flex items-center justify-center space-x-1 ${canIPlay
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white hover:scale-105'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                    >
                        <Building2 className="w-3 h-3" />
                        <span>BUILD HOUSES</span>
                    </button>

                    <button
                        onClick={handleOpenPropertyManagement}
                        disabled={!canIPlay || !hasMyProperties}
                        className={`w-full font-bold py-2 px-3 rounded-lg transform transition-all duration-200 text-xs flex items-center justify-center space-x-1 ${canIPlay && hasMyProperties
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white hover:scale-105'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                    >
                        <Settings className="w-3 h-3" />
                        <span>MANAGE PROPERTIES</span>
                    </button>

                    <button
                        onClick={handleEndTurn}
                        disabled={!diceRolled || !canIPlay}
                        className={`w-full font-bold py-2 px-3 rounded-lg transform transition-all duration-200 text-xs flex items-center justify-center space-x-1 ${canIPlay && diceRolled
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white hover:scale-105'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                    >
                        <ArrowRight className="w-3 h-3" />
                        <span>END TURN</span>
                    </button>

                    <button
                        onClick={handleOpenTrade}
                        disabled={!canIPlay}
                        className={`w-full font-bold py-2 px-3 rounded-lg transform transition-all duration-200 text-xs flex items-center justify-center space-x-1 ${canIPlay
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white hover:scale-105'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                            }`}
                    >
                        <Users className="w-3 h-3" />
                        <span>TRADE</span>
                    </button>
                </div>
                <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="text-xs text-gray-400">
                        {!canIPlay ? (
                            <div className="flex items-center">
                                <span className="w-1 h-1 bg-yellow-400 rounded-full mr-2 animate-pulse"></span>
                                Waiting for {currentPlayer?.name} to play
                            </div>
                        ) : !diceRolled ? (
                            <div className="flex items-center">
                                <span className="w-1 h-1 bg-orange-400 rounded-full mr-2"></span>
                                Roll dice to start your turn
                            </div>
                        ) : selectedProperty === null && diceRolled ? (
                            <div className="flex items-center">
                                <span className="w-1 h-1 bg-blue-400 rounded-full mr-2"></span>
                                Select property to buy or end turn
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <span className="w-1 h-1 bg-green-400 rounded-full mr-2"></span>
                                Complete your actions and end turn
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameControls;