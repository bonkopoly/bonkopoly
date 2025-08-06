import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import GameBoard from '../GameBoard/GameBoard';
import GameControls from '../GameControls/GameControls';
import PlayerList from '../PlayerList/PlayerList';
import GameLog from '../GameLog/GameLog';
import BuildingControls from '../BuildingControls/BuildingControls';
import { CardModal } from '../CardModal/CardModal';
import TradeModal from '../TradeModal/TradeModal';
import PropertyManagementPanel from '../PropertyManagementPanel'; // НОВЫЙ ИМПОРТ
import PropertyPurchaseModal from '../PropertyPurchaseModal'; // НОВЫЙ ИМПОРТ
import AuctionTimer from '../AuctionTimer'; // НОВЫЙ ИМПОРТ
import { Home, AlertTriangle, Gavel, TrendingDown } from 'lucide-react'; // НОВЫЕ ИКОНКИ
import styles from './Game.module.css';
import { useParams } from 'react-router-dom';

export const Game: React.FC = () => {
    console.log('🚀 Game component rendered');
    
    const { roomId } = useParams<{ roomId: string }>();
    
    // Локальное состояние для модальных окон
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [showPropertyPanel, setShowPropertyPanel] = useState(false); // НОВОЕ СОСТОЯНИЕ
    const [initialized, setInitialized] = useState(false);
    
    // Store state
    const gameStarted = useGameStore(state => state.gameStarted);
    const startGame = useGameStore(state => state.startGame);
    const currentCard = useGameStore(state => state.currentCard);
    const closeCardModal = useGameStore(state => state.closeCardModal);
    const isBuildingControlsOpen = useGameStore(state => state.isBuildingControlsOpen);
    const closeBuildingControls = useGameStore(state => state.closeBuildingControls);
    const addToLog = useGameStore(state => state.addToLog);
    const setRoomId = useGameStore(state => state.setRoomId);
    const loadGameState = useGameStore(state => state.loadGameState);
    const initializePlayersFromLobby = useGameStore(state => state.initializePlayersFromLobby);
    const getCurrentPlayer = useGameStore(state => state.getCurrentPlayer);
    
    // НОВЫЕ СЕЛЕКТОРЫ ДЛЯ СИСТЕМЫ ЗАЛОГА:
    const selectedProperty = useGameStore(state => state.selectedProperty);
    const currentAuction = useGameStore(state => state.currentAuction);
    const players = useGameStore(state => state.players);
    const currentPlayer = useGameStore(state => state.currentPlayer);
    const calculatePlayerAssets = useGameStore(state => state.calculatePlayerAssets);
    
    // Получаем текущего пользователя
    const currentUserId = getCurrentPlayer()?.userId || null;
    const currentPlayerData = players[currentPlayer];
    
    // НОВЫЕ ВЫЧИСЛЕНИЯ ДЛЯ UI:
    const myPropertiesCount = currentPlayerData?.properties?.length || 0;
    const totalAssets = calculatePlayerAssets ? calculatePlayerAssets(currentPlayer) : 0;
    const isLowOnCash = currentPlayerData?.money < 200;

    useEffect(() => {
        console.log('🔄 useEffect triggered. roomId:', roomId, 'initialized:', initialized);
        console.log('🔄 roomId type:', typeof roomId);
        console.log('🔄 Full URL:', window.location.href);

        // ВРЕМЕННО: если roomId undefined, извлекаем из URL вручную
        let actualRoomId = roomId;
        if (!actualRoomId) {
            const pathParts = window.location.pathname.split('/');
            actualRoomId = pathParts[pathParts.length - 1];
            console.log('🔧 Extracted roomId manually:', actualRoomId);
        }

        if (!actualRoomId || initialized) {
            console.log('🛑 useEffect early return. actualRoomId:', actualRoomId, 'initialized:', initialized);
            return;
        }

        const initializeGame = async () => {
            console.log('🎮 Initializing game for room:', actualRoomId);
            setRoomId(actualRoomId);
            console.log('🔍 Current roomId in store after setting:', useGameStore.getState().roomId);
            const stateLoaded = await loadGameState(actualRoomId);

            if (!stateLoaded) {
                console.log('🆕 No saved state found, initializing from URL');
                // Если состояния нет, инициализируем из URL параметров
                const urlParams = new URLSearchParams(window.location.search);
                const playersParam = urlParams.get('players');

                if (playersParam) {
                    try {
                        const playersData = JSON.parse(decodeURIComponent(playersParam));
                        console.log('👥 Initializing with players:', playersData);
                        initializePlayersFromLobby(playersData);
                    } catch (error) {
                        console.error('❌ Failed to parse players data:', error);
                    }
                }
            } else {
                console.log('💾 Game state loaded from database');
            }

            setInitialized(true);
        };

        initializeGame();
    }, [roomId]);

    useEffect(() => {
        console.log('isBuildingControlsOpen:', isBuildingControlsOpen);
    }, [isBuildingControlsOpen]);

    // Функции для управления Trade Modal
    const openTradeModal = () => {
        console.log('🟢 Opening trade modal for user:', currentUserId);
        setIsTradeModalOpen(true);
    };

    const closeTradeModal = () => {
        console.log('🔴 Closing trade modal for user:', currentUserId);
        setIsTradeModalOpen(false);
    };

    if (!gameStarted) {
        return (
            <div className={styles.startScreen}>
                <h1>Welcome to Bonkopoly!</h1>
                <button onClick={startGame}>Start Game</button>
            </div>
        );
    }

    return (
        <div className={styles.game}>
            <div className={styles.leftPanel}>
                <PlayerList />
                <GameLog />
            </div>
            <div className={styles.mainPanel}>
                <GameBoard />
                <GameControls
                    currentUserId={currentUserId}
                    currentPlayer={getCurrentPlayer()}
                    onOpenTradeModal={openTradeModal}
                />
                {isBuildingControlsOpen && <BuildingControls onClose={closeBuildingControls} />}
            </div>
            
            {/* ========== НОВЫЕ КОМПОНЕНТЫ ========== */}
            
            {/* Таймер аукциона - показывается всегда если аукцион активен */}
            <AuctionTimer />
            
            {/* Кнопка управления недвижимостью - только если есть свойства */}
            {myPropertiesCount > 0 && (
                <button
                    onClick={() => setShowPropertyPanel(true)}
                    className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-1 text-white border-2 ${
                        isLowOnCash 
                            ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 border-yellow-400 animate-pulse' 
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-blue-400'
                    }`}
                    style={{ zIndex: 1000 }}
                >
                    <div className="flex items-center">
                        {isLowOnCash ? (
                            <AlertTriangle className="w-6 h-6 mr-2" />
                        ) : (
                            <Home className="w-6 h-6 mr-2" />
                        )}
                        <div className="text-left">
                            <div className="font-bold">
                                {isLowOnCash ? 'Need Cash?' : 'Manage Properties'}
                            </div>
                            <div className="text-sm opacity-90">
                                {myPropertiesCount} properties • ${totalAssets?.toLocaleString()} assets
                            </div>
                        </div>
                    </div>
                </button>
            )}
            
            {/* Предупреждение о банкротстве */}
            {isLowOnCash && myPropertiesCount > 0 && (
                <div className="fixed bottom-24 right-4 bg-red-900/80 border-2 border-red-500 text-white p-3 rounded-xl backdrop-blur-sm" style={{ zIndex: 999 }}>
                    <div className="flex items-center text-red-200 mb-2">
                        <TrendingDown className="w-4 h-4 mr-2" />
                        <span className="font-bold text-sm">Low on Cash</span>
                    </div>
                    <div className="text-xs">
                        Consider mortgaging properties or selling buildings
                    </div>
                </div>
            )}
            
            {/* Статус банкротства */}
            {players.some(p => p.bankrupt) && (
                <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 border-2 border-gray-600 text-white p-3 rounded-xl shadow-lg" style={{ zIndex: 30 }}>
                    <div className="flex items-center text-gray-300">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        <span className="text-sm">
                            Bankrupt: {players.filter(p => p.bankrupt).map(p => p.name).join(', ')}
                        </span>
                    </div>
                </div>
            )}

            {/* ========== МОДАЛЬНЫЕ ОКНА ========== */}
            
            {/* Card Modal */}
            <CardModal card={currentCard} onClose={closeCardModal} />

            {/* Trade Modal - только у того игрока, который его открыл */}
            {isTradeModalOpen && (
                <TradeModal 
                    onClose={closeTradeModal}
                    currentUserId={currentUserId}
                />
            )}
            
            {/* НОВЫЕ МОДАЛЬНЫЕ ОКНА: */}
            
            {/* Property Purchase Modal - когда игрок приземляется на свободное поле */}
            {selectedProperty !== null && (
                <PropertyPurchaseModal
                    propertyId={selectedProperty}
                    onClose={() => {}} // закрытие обрабатывается внутри компонента
                />
            )}
            
            {/* Property Management Panel - управление недвижимостью */}
            {showPropertyPanel && (
                <PropertyManagementPanel
                    onClose={() => setShowPropertyPanel(false)}
                />
            )}
        </div>
    );
};