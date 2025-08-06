// GamePage.tsx - ПОЛНОЕ ИСПРАВЛЕНИЕ
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Users, Wifi, WifiOff } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import GameBoard from '../components/GameBoard/GameBoard';
import PlayerPanel from '../components/PlayerPanel/PlayerPanel';
import GameControls from '../components/GameControls/GameControls';
import { useGameStore } from '../hooks/useGameStore';
import GameLog from '../components/GameLog/GameLog';
import { realtimeGameService, authService, gameSessionService } from '../lib/supabase';
import type { Property } from '../types';
import BuildingModal from '../components/BuildingModal';
import PropertyModal from '../components/GameControls/PropertyModal';
import { supabase } from '../lib/supabase';
import TradeModal from '../components/TradeModal/TradeModal';
import PropertyManagementPanel from '../components/PropertyManagementPanel';
import PropertyPurchaseModal from '../components/PropertyPurchaseModal'; // ДОБАВЛЯЕМ
    import AuctionTimer from '../components/AuctionTimer'; // ДОБАВЛЯЕМ

const GamePage: React.FC = () => {
    const [showLeaderboard, setShowLeaderboard] = useState(true);
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedPlayers, setConnectedPlayers] = useState<string[]>([]);
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [isPropertyManagementOpen, setIsPropertyManagementOpen] = useState(false);

    const {
        getCurrentPlayer,
        initializePlayersFromLobby,
        setRoomId,
        loadGameState,
        syncGameState,
        gameStarted,
        players,
        isBuildingControlsOpen,
        closeBuildingControls,
        selectedProperty: storeSelectedProperty, // ДОБАВЛЯЕМ ИЗ STORE
        properties, // ДОБАВЛЯЕМ ИЗ STORE
    } = useGameStore();

    const { roomId } = useParams<{ roomId: string }>();
    const [searchParams] = useSearchParams();

    // ОТЛАДОЧНЫЕ ЛОГИ
    console.log('🔍 DEBUG PURCHASE MODAL:', {
        storeSelectedProperty,
        selectedPropertyFromState: selectedProperty,
        propertyExists: storeSelectedProperty !== null ? properties[storeSelectedProperty] : null,
        propertyOwner: storeSelectedProperty !== null ? properties[storeSelectedProperty]?.owner : null,
        propertyPrice: storeSelectedProperty !== null ? properties[storeSelectedProperty]?.price : null,
        shouldShowModal: storeSelectedProperty !== null && 
                        properties[storeSelectedProperty]?.owner === null &&
                        properties[storeSelectedProperty]?.price > 0
    });

    const getPlayersFromUrl = () => {
        const playersParam = searchParams.get('players');
        if (playersParam) {
            try {
                return JSON.parse(decodeURIComponent(playersParam));
            } catch (error) {
                console.error('Error parsing players data:', error);
            }
        }
        return null;
    };

    const urlPlayers = getPlayersFromUrl();

    useEffect(() => {
        if (!roomId) return;

        console.log('🎮 useEffect triggered ONCE for roomId:', roomId);

        let isInitialized = false;
        let cleanup: (() => void) | undefined;

        const initializeMultiplayerGame = async () => {
            if (isInitialized) {
                console.log('⏸️ Already initialized, skipping...');
                return;
            }

            try {
                console.log('🎮 Initializing multiplayer game for room:', roomId);

                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    console.log('❌ No valid session, redirecting to login');
                    window.location.href = '/login';
                    return;
                }

                isInitialized = true;

                const user = await authService.getCurrentUser();
                if (!user) {
                    console.error('❌ No authenticated user found');
                    setIsConnected(false);
                    return;
                }

                setCurrentUserId(user.id);
                setRoomId(roomId);

                const stateLoaded = await loadGameState(roomId);

                if (!stateLoaded && urlPlayers?.length > 0) {
                    console.log('🆕 No saved state, initializing from lobby data');
                    initializePlayersFromLobby(urlPlayers);

                    const currentState = useGameStore.getState();
                    await realtimeGameService.updateGameState(roomId, {
                        gameStarted: currentState.gameStarted,
                        players: currentState.players,
                        properties: currentState.properties,
                        currentPlayer: currentState.currentPlayer,
                        diceRolled: currentState.diceRolled,
                        lastRoll: currentState.lastRoll,
                        gameLog: currentState.gameLog,
                        doubleCount: currentState.doubleCount,
                        chanceCards: currentState.chanceCards,
                        communityChestCards: currentState.communityChestCards
                    }, {
                        playerId: user.id,
                        action: 'initialize_game',
                        timestamp: Date.now()
                    });
                }

                const subscription = realtimeGameService.subscribeToGameSession(
                    roomId,
                    (newGameState: any, metadata?: any) => {
                        console.log('🔄 RECEIVED UPDATE:', {
                            action: metadata?.action,
                            fromPlayerId: metadata?.playerId,
                            currentUserId: user.id,
                            isFromMe: metadata?.playerId === user.id
                        });

                        if (metadata?.playerId === user.id) {
                            console.log('⏸️ SKIPPING OWN UPDATE:', metadata?.action);
                            return;
                        }

                        console.log('✅ APPLYING EXTERNAL UPDATE from:', metadata?.playerId);
                        syncGameState(newGameState, metadata);
                        setConnectedPlayers(newGameState.players.map((p: any) => p.userId));
                    },
                    () => {
                        console.log('✅ Realtime connected');
                        setIsConnected(true);
                    },
                    (error: any) => {
                        console.error('❌ Realtime connection error:', error);
                        setIsConnected(false);

                        setTimeout(() => {
                            console.log('🔄 Reloading page due to connection failure...');
                            window.location.reload();
                        }, 3000);
                    }
                );

                cleanup = () => {
                    console.log('🔌 Unsubscribing from realtime updates');
                    subscription?.unsubscribe();
                    isInitialized = false;
                };

            } catch (error) {
                console.error('❌ Failed to initialize multiplayer game:', error);
                setIsConnected(false);
                isInitialized = false;
            }
        };

        initializeMultiplayerGame();

        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [roomId]);

    const currentPlayer = getCurrentPlayer();

    if (!gameStarted) {
        return (
            <div className="h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="text-center text-white space-y-4">
                    <div className="text-6xl mb-4">🎮</div>
                    <h1 className="text-3xl font-bold">Connecting to Multiplayer Game</h1>
                    <div className="flex items-center justify-center space-x-2">
                        {isConnected ? (
                            <>
                                <Wifi className="w-5 h-5 text-green-400" />
                                <span className="text-green-400">Connected</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-5 h-5 text-red-400" />
                                <span className="text-red-400">Connecting...</span>
                            </>
                        )}
                    </div>
                    <div className="text-gray-400 space-y-1">
                        <p>Room ID: {roomId}</p>
                        <p>Players: {players.length}</p>
                        {currentUserId && <p>Your ID: {currentUserId.slice(0, 8)}...</p>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 overflow-hidden">
            <div className="w-64 p-4 border-r border-white/10">
                <div className="h-full bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="p-3 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <span className="text-white font-medium text-sm">Multiplayer</span>
                            <div className="flex items-center space-x-1">
                                {isConnected ? (
                                    <Wifi className="w-4 h-4 text-green-400" />
                                ) : (
                                    <WifiOff className="w-4 h-4 text-red-400" />
                                )}
                                <Users className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-400 text-xs">{connectedPlayers.length}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-3 space-y-2">
                        <h4 className="text-gray-400 text-xs font-medium uppercase">Online Players</h4>
                        {players.map((player, index) => (
                            <div key={player.id} className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${connectedPlayers.includes(player.userId) ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                <span className="text-white text-sm">{player.name}</span>
                                {player.id === currentPlayer.id && (
                                    <span className="text-yellow-400 text-xs">(Your turn)</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="text-center text-gray-400">
                            <div className="text-4xl mb-2">💬</div>
                            <div className="text-sm font-medium">Chat Coming Soon</div>
                            <div className="text-xs">Real-time game chat</div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-6">
                <div className="relative flex items-start gap-6 w-full max-w-6xl">
                    <div className="aspect-square w-full max-w-4xl">
                        <GameBoard onPropertySelect={setSelectedProperty} />
                    </div>
                    <div className="w-80 flex-shrink-0">
                        {selectedProperty && (
                            <PropertyModal
                                property={selectedProperty}
                                onClose={() => setSelectedProperty(null)}
                            />
                        )}
                        {!selectedProperty && (
                            <div className="bg-gradient-to-br from-slate-900/50 via-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center">
                                <div className="text-gray-400 text-sm space-y-2">
                                    <div className="text-2xl mb-2">🏠</div>
                                    <p className="font-medium">Property Details</p>
                                    <p>Click on any property to see pricing and rental information</p>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="absolute right-0 bottom-0 w-80 z-10">
                        <GameLog />
                    </div>
                </div>
            </div>
            <div className="w-80 p-4 flex flex-col h-screen overflow-hidden border-l border-white/10">
                <div className="relative overflow-hidden mb-3 flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-500/20 rounded-xl blur-xl"></div>
                    <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 p-3 shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                                Current Turn
                            </h3>
                            <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                {isConnected && <span className="text-green-400 text-xs">Live</span>}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div
                                className="text-2xl"
                                style={{
                                    color: currentPlayer.color,
                                    filter: 'drop-shadow(0 0 8px currentColor)'
                                }}
                            >
                                {currentPlayer.icon}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-white text-xs">{currentPlayer.name}</div>
                                <div className="text-green-400 font-bold text-xs">
                                    ${currentPlayer.money.toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-400">
                                    Pos: {currentPlayer.position} • Props: {currentPlayer.properties.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mb-3 flex-shrink-0">
                    <GameControls
                        currentUserId={currentUserId}
                        currentPlayer={currentPlayer}
                        onOpenTradeModal={() => setIsTradeModalOpen(true)}
                        onOpenPropertyManagement={() => setIsPropertyManagementOpen(true)}
                    />
                </div>
                <div className="relative overflow-hidden flex-1 min-h-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-xl blur-xl"></div>
                    <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl h-full flex flex-col">
                        <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors rounded-t-xl flex-shrink-0"
                            onClick={() => setShowLeaderboard(!showLeaderboard)}
                        >
                            <h3 className="text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                                🏆 PLAYERS LEADERBOARD
                            </h3>
                            {showLeaderboard ? (
                                <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                        </div>
                        {showLeaderboard && (
                            <div className="px-3 pb-3 flex-1 overflow-y-auto">
                                <PlayerPanel />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* МОДАЛЫ И ПАНЕЛИ */}
            {isBuildingControlsOpen && (
                <BuildingModal
                    onClose={closeBuildingControls}
                    currentUserId={currentUserId}
                />
            )}

            {isTradeModalOpen && (
                <TradeModal
                    onClose={() => setIsTradeModalOpen(false)}
                    currentUserId={currentUserId}
                />
            )}

            {isPropertyManagementOpen && (
                <PropertyManagementPanel
                    onClose={() => setIsPropertyManagementOpen(false)}
                />
            )}

            {/* ДОБАВЛЯЕМ PropertyPurchaseModal */}
            {storeSelectedProperty !== null && 
             properties[storeSelectedProperty]?.owner === null &&
             properties[storeSelectedProperty]?.price > 0 && (
                <PropertyPurchaseModal
                    propertyId={storeSelectedProperty}
                    onClose={() => useGameStore.getState().setSelectedProperty(null)}
                />
            )}

            {/* ДОБАВЛЯЕМ AuctionTimer */}
         <AuctionTimer />
        </div>
    );
};

export default GamePage;