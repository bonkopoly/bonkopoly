// src/hooks/useGameStore.ts - ВОССТАНАВЛИВАЕМ ВСЕ 40 ПОЛЕЙ
import { create } from 'zustand';
import type { Player, Property, PropertyGroup, MonopolyGroup, GameRules } from '@/types';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS } from '@/data/cards';
import type { Card } from '@/types/cards';
import { gameSessionService, realtimeGameService } from '../lib/supabase';

const GAME_RULES: GameRules = {
    maxHousesPerProperty: 4,
    maxHotelsPerProperty: 1,
    totalHousesInGame: 32,
    totalHotelsInGame: 12,
    mortgageInterestRate: 0.1,
    jailFine: 50,
    passingGoBonus: 200,
    landingOnGoBonus: 200
};

const MONOPOLY_GROUPS: MonopolyGroup[] = [
    { name: 'brown', color: '#8B4513', size: 2, properties: [1, 3], maxHouses: 4, housePrice: 50, hotelPrice: 50 },
    { name: 'lightblue', color: '#87CEEB', size: 3, properties: [6, 8, 9], maxHouses: 4, housePrice: 50, hotelPrice: 50 },
    { name: 'pink', color: '#FF69B4', size: 3, properties: [11, 13, 14], maxHouses: 4, housePrice: 100, hotelPrice: 100 },
    { name: 'orange', color: '#FFA500', size: 3, properties: [16, 18, 19], maxHouses: 4, housePrice: 100, hotelPrice: 100 },
    { name: 'red', color: '#FF0000', size: 3, properties: [21, 23, 24], maxHouses: 4, housePrice: 150, hotelPrice: 150 },
    { name: 'yellow', color: '#FFFF00', size: 3, properties: [26, 27, 29], maxHouses: 4, housePrice: 150, hotelPrice: 150 },
    { name: 'green', color: '#00FF00', size: 3, properties: [31, 32, 34], maxHouses: 4, housePrice: 200, hotelPrice: 200 },
    { name: 'darkblue', color: '#0000FF', size: 2, properties: [37, 39], maxHouses: 4, housePrice: 200, hotelPrice: 200 },
    { name: 'railroad', color: '#FFFFFF', size: 4, properties: [5, 15, 25, 35], maxHouses: 0, housePrice: 0, hotelPrice: 0 },
    { name: 'utility', color: '#FFFFFF', size: 2, properties: [12, 28], maxHouses: 0, housePrice: 0, hotelPrice: 0 }
];

interface TradeOffer {
    id: string;
    fromPlayerId: number;
    toPlayerId: number;
    offeredProperties: number[];
    offeredMoney: number;
    requestedProperties: number[];
    requestedMoney: number;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    timestamp: number;
    expiresAt: number;
}

interface TradeSession {
    id: string;
    participantIds: number[];
    createdBy: number;
    status: 'active' | 'completed' | 'cancelled';
    currentOffer?: TradeOffer;
    timestamp: number;
}

interface GameStore {
    gameStarted: boolean;
    players: Player[];
    properties: Property[];
    currentPlayer: number;
    selectedProperty: number | null;
    setSelectedProperty: (propertyId: number | null) => void;
    diceRolled: boolean;
    lastRoll: [number, number];
    gameLog: string[];
    doubleCount: number;
    chanceCards: Card[];
    communityChestCards: Card[];
    currentCard: Card | null;
    isBuildingControlsOpen: boolean;
    openBuildingControls: () => void;
    closeBuildingControls: () => void;
    validateTradeOffer: (offer: TradeOffer) => { valid: boolean; reason?: string };
    increaseBid: (playerId: number) => void;
    declineAuction: (playerId: number) => void;

    roomId: string | null;
    lastActionTimestamp?: number;
    hasBuiltThisTurn: boolean;

    // Game End State
    gameEnded: boolean;
    winner: Player | null;
    showVictoryModal: boolean;
    setShowVictoryModal: (show: boolean) => void;
    checkGameEnd: () => void;
    resetGame: () => void;

    setRoomId: (roomId: string) => void;
    saveGameState: () => Promise<void>;
    loadGameState: (roomId: string) => Promise<boolean>;
    syncGameState: (gameState: any, metadata?: any) => void;

    startGame: () => void;
    rollDice: () => void;
    buyProperty: (propertyId: number) => boolean;
    endTurn: () => void;
    selectProperty: (id: number) => void;
    getCurrentPlayer: () => Player;
    initializePlayersFromLobby: (lobbyPlayers: any[]) => void;
    getProperty: (id: number) => Property;
    addToLog: (message: string) => void;
    movePlayer: (playerId: number, spaces: number, rollInfo?: [number, number]) => void;
    payJailFine: (playerId: number) => void;
    attemptJailEscape: (playerId: number, dice1: number, dice2: number) => boolean;
    hasMonopoly: (playerId: number, group: string) => boolean;
    canBuildHouse: (propertyId: number) => boolean;
    buildHouse: (propertyId: number) => void;
    canBuildHotel: (propertyId: number) => boolean;
    buildHotel: (propertyId: number) => void;
    getPropertyRent: (propertyId: number) => number;
    drawCard: (type: 'chance' | 'community') => void;
    executeCardAction: (card: Card) => void;
    closeCardModal: () => void;

    // ДОБАВИТЬ ЭТУ ФУНКЦИЮ:
    declinePropertyPurchase: (propertyId: number) => void;

    mortgageProperty: (propertyId: number) => boolean;
    unmortgageProperty: (propertyId: number) => boolean;
    canMortgageProperty: (propertyId: number) => boolean;
    canUnmortgageProperty: (propertyId: number) => boolean;
    sellHouse: (propertyId: number) => boolean;
    canSellBuilding: (propertyId: number) => boolean;

    handleBankruptcy: (playerId: number) => void;
    calculatePlayerAssets: (playerId: number) => number;
    forceSellAssets: (playerId: number, amountNeeded: number) => boolean;

    startPropertyAuction: (propertyId: number) => void;
    placeBid: (playerId: number, amount: number) => void;
    endAuction: () => void;

    // ИСПРАВИТЬ ТИП currentAuction:
    currentAuction: {
        propertyId: number | null;
        currentBid: number;
        currentBidder: number | null;
        timeLeft: number;
        participants: number[];
        timestamp: number;
        auctionCreator: number; // КТО СОЗДАЛ АУКЦИОН (НЕ УЧАСТВУЕТ)
        activeParticipants: number[]; // КТО ЕЩЕ МОЖЕТ ДЕЛАТЬ СТАВКИ
        declinedParticipants: number[]; // КТО ОТКАЗАЛСЯ
    } | null;

    // Trade System
    activeTradeOffers: TradeOffer[];
    tradeSessions: TradeSession[];
    isTradeModalOpen: boolean;
    currentTradeSession: TradeSession | null;

    // Trade Actions
    openTradeModal: () => void;
    closeTradeModal: () => void;
    createTradeSession: (participantIds: number[]) => string;
    createTradeOffer: (sessionId: string, offer: Omit<TradeOffer, 'id' | 'timestamp' | 'status' | 'expiresAt'>) => void;
    updateTradeOffer: (sessionId: string, offer: Omit<TradeOffer, 'id' | 'timestamp' | 'status' | 'expiresAt'>) => void;
    acceptTradeOffer: (sessionId: string, offerId: string) => void;
    rejectTradeOffer: (sessionId: string, offerId: string) => void;
    cancelTradeSession: (sessionId: string) => void;
    executeTradeOffer: (offer: TradeOffer) => void;
    cleanupExpiredOffers: () => void;
    syncTradeData: (tradeData: { sessions: TradeSession[], offers: TradeOffer[] }) => void;
}



// ВСЕ 40 ПОЛЕЙ МОНОПОЛИИ
const createAllProperties = (): Property[] => [
    { id: 0, name: 'GO', type: 'special', price: 0, group: 'special', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 0, description: ' ', icon: '🏁', color: '#fff', rent: [0] },
    { id: 1, name: 'BONK', type: 'property', price: 60, color: '#8B4513', rent: [2, 10, 30, 90, 160, 250], group: 'brown', owner: null, houses: 0, housePrice: 50, mortgage: false, mortgageValue: 30 },
    { id: 2, name: 'Chest', type: 'community', price: 0, group: 'special', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 0, icon: '💰', color: '#fff', rent: [0] },
    { id: 3, name: 'DOGE', type: 'property', price: 60, color: '#8B4513', rent: [4, 20, 60, 180, 320, 450], group: 'brown', owner: null, houses: 0, housePrice: 50, mortgage: false, mortgageValue: 30 },
    { id: 4, name: 'Income Tax', type: 'tax', price: 0, group: 'special', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 0, tax: 200, icon: '💸', color: '#fff', rent: [0] },
    { id: 5, name: 'Reading Railroad', type: 'railroad', price: 200, group: 'railroad', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 100, icon: '🚂', color: '#fff', rent: [25, 50, 100, 200] },
    { id: 6, name: 'MATIC', type: 'property', price: 100, color: '#87CEEB', rent: [6, 30, 90, 270, 400, 550], group: 'lightblue', owner: null, houses: 0, housePrice: 50, mortgage: false, mortgageValue: 50 },
    { id: 7, name: 'Chance', type: 'chance', price: 0, group: 'special', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 0, icon: '❓', color: '#fff', rent: [0] },
    { id: 8, name: 'AVAX', type: 'property', price: 100, color: '#87CEEB', rent: [6, 30, 90, 270, 400, 550], group: 'lightblue', owner: null, houses: 0, housePrice: 50, mortgage: false, mortgageValue: 50 },
    { id: 9, name: 'FTM', type: 'property', price: 120, color: '#87CEEB', rent: [8, 40, 100, 300, 450, 600], group: 'lightblue', owner: null, houses: 0, housePrice: 50, mortgage: false, mortgageValue: 60 },

    { id: 10, name: 'JAIL', type: 'special', price: 0, group: 'special', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 0, description: ' ', icon: '🚔', color: '#fff', rent: [0] },
    { id: 11, name: 'UNI', type: 'property', price: 140, color: '#FF69B4', rent: [10, 50, 150, 450, 625, 750], group: 'pink', owner: null, houses: 0, housePrice: 70, mortgage: false, mortgageValue: 70 },
    { id: 12, name: 'Electric Company', type: 'utility', price: 150, group: 'utility', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 75, icon: '⚡', color: '#fff', rent: [4] },
    { id: 13, name: 'AAVE', type: 'property', price: 140, color: '#FF69B4', rent: [10, 50, 150, 450, 625, 750], group: 'pink', owner: null, houses: 0, housePrice: 70, mortgage: false, mortgageValue: 70 },
    { id: 14, name: 'CRV', type: 'property', price: 160, color: '#FF69B4', rent: [12, 60, 180, 500, 700, 900], group: 'pink', owner: null, houses: 0, housePrice: 70, mortgage: false, mortgageValue: 80 },
    { id: 15, name: 'Pennsylvania Railroad', type: 'railroad', price: 200, group: 'railroad', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 100, icon: '🚂', color: '#fff', rent: [25, 50, 100, 200] },
    { id: 16, name: 'LINK', type: 'property', price: 180, color: '#FFA500', rent: [14, 70, 200, 550, 750, 950], group: 'orange', owner: null, houses: 0, housePrice: 90, mortgage: false, mortgageValue: 90 },
    { id: 17, name: 'Chest', type: 'community', price: 0, group: 'special', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 0, icon: '💰', color: '#fff', rent: [0] },
    { id: 18, name: 'GRT', type: 'property', price: 180, color: '#FFA500', rent: [14, 70, 200, 550, 750, 950], group: 'orange', owner: null, houses: 0, housePrice: 90, mortgage: false, mortgageValue: 90 },
    { id: 19, name: 'ARB', type: 'property', price: 200, color: '#FFA500', rent: [16, 80, 220, 600, 800, 1000], group: 'orange', owner: null, houses: 0, housePrice: 90, mortgage: false, mortgageValue: 100 },

    { id: 20, name: 'FREE PARKING', type: 'special', price: 0, group: 'special', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 0, description: ' ', icon: '🅿️', color: '#fff', rent: [0] },
    { id: 21, name: 'OpenSea', type: 'property', price: 220, color: '#FF0000', rent: [18, 90, 250, 700, 875, 1050], group: 'red', owner: null, houses: 0, housePrice: 110, mortgage: false, mortgageValue: 110 },
    { id: 22, name: 'Chance', type: 'chance', price: 0, group: 'special', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 0, icon: '❓', color: '#fff', rent: [0] },
    { id: 23, name: 'Blur', type: 'property', price: 220, color: '#FF0000', rent: [18, 90, 250, 700, 875, 1050], group: 'red', owner: null, houses: 0, housePrice: 110, mortgage: false, mortgageValue: 110 },
    { id: 24, name: 'Rarible', type: 'property', price: 240, color: '#FF0000', rent: [20, 100, 300, 750, 925, 1100], group: 'red', owner: null, houses: 0, housePrice: 110, mortgage: false, mortgageValue: 120 },
    { id: 25, name: 'B. & O. Railroad', type: 'railroad', price: 200, group: 'railroad', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 100, icon: '🚂', color: '#fff', rent: [25, 50, 100, 200] },
    { id: 26, name: 'Binance', type: 'property', price: 260, color: '#FFFF00', rent: [22, 110, 330, 800, 975, 1150], group: 'yellow', owner: null, houses: 0, housePrice: 130, mortgage: false, mortgageValue: 130 },
    { id: 27, name: 'Coinbase', type: 'property', price: 260, color: '#FFFF00', rent: [22, 110, 330, 800, 975, 1150], group: 'yellow', owner: null, houses: 0, housePrice: 130, mortgage: false, mortgageValue: 130 },
    { id: 28, name: 'Water Works', type: 'utility', price: 150, group: 'utility', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 75, icon: '💧', color: '#fff', rent: [4] },
    { id: 29, name: 'Kraken', type: 'property', price: 280, color: '#FFFF00', rent: [24, 120, 360, 850, 1025, 1200], group: 'yellow', owner: null, houses: 0, housePrice: 130, mortgage: false, mortgageValue: 140 },

    { id: 30, name: 'GO TO JAIL', type: 'special', price: 0, group: 'special', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 0, description: ' ', icon: '👮', color: '#fff', rent: [0] },
    { id: 31, name: 'SOL', type: 'property', price: 300, color: '#00FF00', rent: [26, 130, 390, 900, 1100, 1275], group: 'green', owner: null, houses: 0, housePrice: 150, mortgage: false, mortgageValue: 150 },
    { id: 32, name: 'ADA', type: 'property', price: 300, color: '#00FF00', rent: [26, 130, 390, 900, 1100, 1275], group: 'green', owner: null, houses: 0, housePrice: 150, mortgage: false, mortgageValue: 150 },
    { id: 33, name: 'Chest', type: 'community', price: 0, group: 'special', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 0, icon: '💰', color: '#fff', rent: [0] },
    { id: 34, name: 'DOT', type: 'property', price: 320, color: '#00FF00', rent: [28, 150, 450, 1000, 1200, 1400], group: 'green', owner: null, houses: 0, housePrice: 150, mortgage: false, mortgageValue: 160 },
    { id: 35, name: 'Short Line', type: 'railroad', price: 200, group: 'railroad', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 100, icon: '🚂', color: '#fff', rent: [25, 50, 100, 200] },
    { id: 36, name: 'Chance', type: 'chance', price: 0, group: 'special', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 0, icon: '❓', color: '#fff', rent: [0] },
    { id: 37, name: 'BTC', type: 'property', price: 350, color: '#0000FF', rent: [35, 175, 500, 1100, 1300, 1500], group: 'darkblue', owner: null, houses: 0, housePrice: 175, mortgage: false, mortgageValue: 175 },
    { id: 38, name: 'Luxury Tax', type: 'tax', price: 0, group: 'special', owner: null, houses: 0, housePrice: 0, mortgage: false, mortgageValue: 0, tax: 100, icon: '💎', color: '#fff', rent: [0] },
    { id: 39, name: 'ETH', type: 'property', price: 400, color: '#0000FF', rent: [50, 200, 600, 1400, 1700, 2000], group: 'darkblue', owner: null, houses: 0, housePrice: 200, mortgage: false, mortgageValue: 200 },
];



const addImportantLog = (state: GameStore, message: string) => {
    state.gameLog.push(message);
    if (state.gameLog.length > 20) { // Ограничиваем количество сообщений
        state.gameLog.shift();
    }
};



export const useGameStore = create<GameStore>((set, get) => {
    // Вспомогательная функция для безопасного списания денег с проверкой банкротства
    const safeChargePlayer = (playerId: number, amount: number, reason: string): boolean => {
        const state = get();
        const player = state.players[playerId];
        
        if (player.money >= amount) {
            // Игрок может заплатить
            set(state => ({
                ...state,
                players: state.players.map(p =>
                    p.id === player.id ? { ...p, money: p.money - amount } : p
                )
            }));
            addImportantLog(state, `💸 ${player.name} paid $${amount} for ${reason}`);
            return true;
        } else {
            // Игрок не может заплатить - проверяем банкротство
            const totalAssets = get().calculatePlayerAssets(playerId);
            
            if (totalAssets >= amount) {
                // У игрока есть активы для продажи/залога
                addImportantLog(state, `⚠️ ${player.name} cannot pay $${amount} for ${reason}! Need to sell/mortgage assets.`);
                return false;
            } else {
                // Игрок банкрот
                addImportantLog(state, `💀 ${player.name} is bankrupt! Cannot pay $${amount} for ${reason}.`);
                get().handleBankruptcy(playerId);
                return false;
            }
        }
    };

    return {
        gameStarted: false,
        players: [],
        properties: createAllProperties(),
        currentPlayer: 0,
        selectedProperty: null,
        setSelectedProperty: (propertyId) => set({ selectedProperty: propertyId }),
        diceRolled: false,
        lastRoll: [1, 1],
        gameLog: [],
        doubleCount: 0,
        chanceCards: [...CHANCE_CARDS].sort(() => Math.random() - 0.5), // Перемешиваем карточки
        communityChestCards: [...COMMUNITY_CHEST_CARDS].sort(() => Math.random() - 0.5),
        currentCard: null,
        isBuildingControlsOpen: false,
        hasBuiltThisTurn: false,
        currentAuction: null,

        // Game End State
        gameEnded: false,
        winner: null,
        showVictoryModal: false,
        setShowVictoryModal: (show: boolean) => set({ showVictoryModal: show }),
        checkGameEnd: () => {
            const state = get();
            const activePlayers = state.players.filter(p => !p.bankrupt && p.money >= 0);
            
            if (activePlayers.length === 1 && state.players.length > 1) {
                const winner = activePlayers[0];
                const timestamp = Date.now();
                
                set({ 
                    gameEnded: true, 
                    winner,
                    showVictoryModal: true 
                });
                addImportantLog(state, `🏆 ${winner.name} wins the game!`);
                
                // Save to database
                get().saveGameState();
                
                // Immediately sync to all clients
                if (get().roomId) {
                    setTimeout(async () => {
                        try {
                            const newState = get();
                            const metadata = {
                                action: 'gameEnded',
                                winnerId: winner.userId,
                                winnerName: winner.name,
                                timestamp
                            };
                            await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                            console.log('✅ Synced game end state');
                        } catch (error) {
                            console.error('❌ Failed to sync game end state:', error);
                        }
                    }, 0);
                }
            }
        },
        resetGame: () => {
            set({
                gameEnded: false,
                winner: null,
                showVictoryModal: false,
                gameStarted: false,
                players: [],
                currentPlayer: 0,
                diceRolled: false,
                lastRoll: [1, 1],
                gameLog: [],
                doubleCount: 0,
                hasBuiltThisTurn: false,
                currentAuction: null,
                selectedProperty: null,
                currentCard: null,
                isBuildingControlsOpen: false,
                activeTradeOffers: [],
                tradeSessions: [],
                isTradeModalOpen: false,
                currentTradeSession: null
            });
        },

    roomId: null,
    setRoomId: (roomId: string) => {
        console.log('🆔 Setting roomId to:', roomId);
        set({ roomId });
        console.log('🆔 RoomId set, current state:', get().roomId);
    },

    // Trade System
    activeTradeOffers: [],
    tradeSessions: [],
    isTradeModalOpen: false,
    currentTradeSession: null,

    // Trade Actions
    openTradeModal: () => {
        const timestamp = Date.now();
        console.log('🔄 Opening trade modal...');
        set(state => ({
            ...state,
            isTradeModalOpen: true,
            lastActionTimestamp: timestamp
        }));
    },

    closeTradeModal: () => {
        const timestamp = Date.now();
        console.log('🔄 Closing trade modal...');
        set(state => ({
            ...state,
            isTradeModalOpen: false,
            currentTradeSession: null,
            lastActionTimestamp: timestamp
        }));
    },

    createTradeSession: (participantIds: number[]) => {
        const timestamp = Date.now();
        const sessionId = `trade_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
        const currentPlayerId = get().currentPlayer;

        const newSession: TradeSession = {
            id: sessionId,
            participantIds,
            createdBy: currentPlayerId,
            status: 'active',
            timestamp
        };

        console.log('🤝 Creating trade session:', sessionId, 'with participants:', participantIds);

        set(state => ({
            ...state,
            tradeSessions: [...state.tradeSessions, newSession],
            currentTradeSession: newSession,
            lastActionTimestamp: timestamp
        }));

        addImportantLog(get(), `🤝 ${get().getCurrentPlayer().name} started a trade session`);

        // Синхронизируем через realtime
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: newState.getCurrentPlayer().userId,
                        action: 'create_trade_session',
                        sessionId,
                        participantIds,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                } catch (error) {
                    console.error('❌ Failed to sync trade session creation:', error);
                }
            }, 0);
        }

        return sessionId;
    },

    createTradeOffer: (sessionId: string, offerData: Omit<TradeOffer, 'id' | 'timestamp' | 'status' | 'expiresAt'>) => {
        const timestamp = Date.now();
        const offerId = `offer_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;

        const newOffer: TradeOffer = {
            ...offerData,
            id: offerId,
            timestamp,
            status: 'pending',
            expiresAt: timestamp + (2 * 60 * 1000) // 2 минуты
        };

        console.log('📝 Creating trade offer:', offerId, 'in session:', sessionId);

        set(state => {
            const updatedSessions = state.tradeSessions.map(session =>
                session.id === sessionId
                    ? { ...session, currentOffer: newOffer }
                    : session
            );

            return {
                ...state,
                activeTradeOffers: [...state.activeTradeOffers, newOffer],
                tradeSessions: updatedSessions,
                lastActionTimestamp: timestamp
            };
        });

        const fromPlayer = get().players[offerData.fromPlayerId];
        const toPlayer = get().players[offerData.toPlayerId];
        addImportantLog(get(), `📝 ${fromPlayer.name} made a trade offer to ${toPlayer.name}`);

        // Синхронизируем через realtime
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: fromPlayer.userId,
                        action: 'create_trade_offer',
                        sessionId,
                        offerId,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                } catch (error) {
                    console.error('❌ Failed to sync trade offer creation:', error);
                }
            }, 0);
        }
    },

    updateTradeOffer: (sessionId: string, offerData: Omit<TradeOffer, 'id' | 'timestamp' | 'status' | 'expiresAt'>) => {
        const timestamp = Date.now();
        const state = get();
        const session = state.tradeSessions.find(s => s.id === sessionId);

        if (!session || !session.currentOffer) {
            console.warn('❌ Cannot update offer - session or offer not found');
            return;
        }

        const updatedOffer: TradeOffer = {
            ...session.currentOffer,
            ...offerData,
            timestamp,
            expiresAt: timestamp + (2 * 60 * 1000) // Обновляем время истечения
        };

        console.log('📝 Updating trade offer:', updatedOffer.id, 'in session:', sessionId);

        set(state => {
            const updatedSessions = state.tradeSessions.map(s =>
                s.id === sessionId
                    ? { ...s, currentOffer: updatedOffer }
                    : s
            );

            const updatedOffers = state.activeTradeOffers.map(offer =>
                offer.id === updatedOffer.id ? updatedOffer : offer
            );

            return {
                ...state,
                activeTradeOffers: updatedOffers,
                tradeSessions: updatedSessions,
                lastActionTimestamp: timestamp
            };
        });

        const fromPlayer = get().players[offerData.fromPlayerId];
        addImportantLog(get(), `📝 ${fromPlayer.name} updated their trade offer`);

        // Синхронизируем через realtime
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: fromPlayer.userId,
                        action: 'update_trade_offer',
                        sessionId,
                        offerId: updatedOffer.id,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                } catch (error) {
                    console.error('❌ Failed to sync trade offer update:', error);
                }
            }, 0);
        }
    },

    mortgageProperty: (propertyId: number) => {
        const timestamp = Date.now();
        const state = get();
        const property = state.properties[propertyId];

        // ДОБАВИТЬ ПРОВЕРКУ:
        if (!property || property.owner === null) {
            console.log('❌ Property has no owner');
            return false;
        }

        const owner = state.players[property.owner];

        console.log('🏦 Mortgaging property:', propertyId, property.name);

        if (!get().canMortgageProperty(propertyId)) {
            console.log('❌ Cannot mortgage property');
            return false;
        }

        const mortgageValue = property.mortgageValue;

        set(state => {
            const newProperties = [...state.properties];
            const newPlayers = [...state.players];

            // Устанавливаем залог
            newProperties[propertyId] = { ...property, mortgage: true };

            // Добавляем деньги игроку
            newPlayers[property.owner!] = {
                ...owner,
                money: owner.money + mortgageValue
            };

            addImportantLog(state, `🏦 ${owner.name} mortgaged ${property.name} for $${mortgageValue}`);

            return {
                ...state,
                properties: newProperties,
                players: newPlayers,
                lastActionTimestamp: timestamp
            };
        });

        // Синхронизируем залог
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: owner.userId,
                        action: 'mortgageProperty',
                        propertyId,
                        propertyName: property.name,
                        mortgageValue,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                    console.log('✅ Synced property mortgage');
                } catch (error) {
                    console.error('❌ Failed to sync property mortgage:', error);
                }
            }, 0);
        }

        return true;
    },

    // 2. ВЫКУП ИЗ ЗАЛОГА
    unmortgageProperty: (propertyId: number) => {
        const timestamp = Date.now();
        const state = get();
        const property = state.properties[propertyId];

        // ДОБАВИТЬ ПРОВЕРКУ:
        if (!property || property.owner === null) {
            console.log('❌ Property has no owner');
            return false;
        }

        const owner = state.players[property.owner];

        // Стоимость выкупа = залоговая стоимость + 10% процентов
        const unmortgageCost = Math.floor(property.mortgageValue * (1 + GAME_RULES.mortgageInterestRate));

        set(state => {
            const newProperties = [...state.properties];
            const newPlayers = [...state.players];

            // Снимаем залог
            newProperties[propertyId] = { ...property, mortgage: false };

            // Списываем деньги у игрока
            newPlayers[property.owner!] = {
                ...owner,
                money: owner.money - unmortgageCost
            };

            addImportantLog(state, `💰 ${owner.name} unmortgaged ${property.name} for $${unmortgageCost}`);

            return {
                ...state,
                properties: newProperties,
                players: newPlayers,
                lastActionTimestamp: timestamp
            };
        });

        // Синхронизируем выкуп
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: owner.userId,
                        action: 'unmortgageProperty',
                        propertyId,
                        propertyName: property.name,
                        unmortgageCost,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                    console.log('✅ Synced property unmortgage');
                } catch (error) {
                    console.error('❌ Failed to sync property unmortgage:', error);
                }
            }, 0);
        }

        return true;
    },

    // 3. ПРОВЕРКА ВОЗМОЖНОСТИ ЗАЛОГА
    canMortgageProperty: (propertyId: number) => {
        const { properties, players } = get();
        const property = properties[propertyId];

        if (!property || property.owner === null) return false;
        if (property.mortgage) return false; // Уже заложено
        if (property.houses > 0) return false; // Есть постройки
        if (property.type !== 'property' && property.type !== 'railroad' && property.type !== 'utility') return false;

        // Проверяем, что в группе нет построек
        if (property.type === 'property') {
            const monopolyGroup = MONOPOLY_GROUPS.find(g => g.name === property.group);
            if (monopolyGroup) {
                const groupProperties = monopolyGroup.properties.map(id => properties[id]);
                const hasBuildings = groupProperties.some(p => p.houses > 0);
                if (hasBuildings) return false;
            }
        }

        return true;
    },

    // 4. ПРОВЕРКА ВОЗМОЖНОСТИ ВЫКУПА
    canUnmortgageProperty: (propertyId: number) => {
        const { properties, players } = get();
        const property = properties[propertyId];

        if (!property || property.owner === null) return false;
        if (!property.mortgage) return false; // Не заложено

        const owner = players[property.owner];
        const unmortgageCost = Math.floor(property.mortgageValue * (1 + GAME_RULES.mortgageInterestRate));

        return owner.money >= unmortgageCost;
    },

    // 5. ПРОДАЖА ДОМА
    sellHouse: (propertyId: number) => {
        const timestamp = Date.now();
        const state = get();
        const property = state.properties[propertyId];

        // ДОБАВИТЬ ПРОВЕРКУ:
        if (!property || property.owner === null) {
            console.log('❌ Property has no owner');
            return false;
        }

        const owner = state.players[property.owner];

        // Продажа за половину стоимости
        const sellPrice = Math.floor(property.housePrice / 2);

        set(state => {
            const newProperties = [...state.properties];
            const newPlayers = [...state.players];

            if (property.houses === 5) {
                // Продаем отель, получаем 4 дома
                newProperties[propertyId] = { ...property, houses: 4 };
            } else {
                // Продаем один дом
                newProperties[propertyId] = { ...property, houses: property.houses - 1 };
            }

            // Добавляем деньги игроку
            newPlayers[property.owner!] = {
                ...owner,
                money: owner.money + sellPrice
            };

            const buildingType = property.houses === 5 ? 'hotel' : 'house';
            addImportantLog(state, `🏠💰 ${owner.name} sold a ${buildingType} on ${property.name} for $${sellPrice}`);

            return {
                ...state,
                properties: newProperties,
                players: newPlayers,
                lastActionTimestamp: timestamp
            };
        });

        // Синхронизируем продажу
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: owner.userId,
                        action: 'sellBuilding',
                        propertyId,
                        propertyName: property.name,
                        sellPrice,
                        newHouseCount: property.houses === 5 ? 4 : property.houses - 1,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                    console.log('✅ Synced building sale');
                } catch (error) {
                    console.error('❌ Failed to sync building sale:', error);
                }
            }, 0);
        }

        return true;
    },

    // 6. ПРОВЕРКА ВОЗМОЖНОСТИ ПРОДАЖИ ЗДАНИЙ
    canSellBuilding: (propertyId: number) => {
        const { properties } = get();
        const property = properties[propertyId];

        if (!property || property.owner === null) return false;
        if (property.houses === 0) return false; // Нет зданий
        if (property.type !== 'property') return false;

        // ПРАВИЛО: Равномерная продажа - можно продавать только если у этого свойства 
        // домов не меньше чем у других в группе
        const monopolyGroup = MONOPOLY_GROUPS.find(g => g.name === property.group);
        if (monopolyGroup) {
            const groupProperties = monopolyGroup.properties.map(id => properties[id]);
            const maxHouses = Math.max(...groupProperties.map(p => p.houses));

            // Можно продавать только если у этого свойства максимальное количество домов в группе
            return property.houses === maxHouses;
        }

        return true;
    },

    // 7. РАСЧЕТ ОБЩИХ АКТИВОВ ИГРОКА
    calculatePlayerAssets: (playerId: number) => {
        const { players, properties } = get();
        const player = players[playerId];

        let totalAssets = player.money;

        // Добавляем стоимость недвижимости
        player.properties.forEach(propId => {
            const property = properties[propId];
            if (property.mortgage) {
                // Заложенная недвижимость - учитываем только возможность выкупа
                totalAssets += 0; // Уже получили деньги при залоге
            } else {
                // Незаложенная недвижимость - можем заложить
                totalAssets += property.mortgageValue;
            }

            // Добавляем стоимость зданий (за половину цены)
            if (property.houses > 0 && property.houses < 5) {
                totalAssets += Math.floor(property.houses * property.housePrice / 2);
            } else if (property.houses === 5) {
                // Отель
                const monopolyGroup = MONOPOLY_GROUPS.find(g => g.name === property.group);
                if (monopolyGroup) {
                    totalAssets += Math.floor(monopolyGroup.hotelPrice / 2);
                }
            }
        });

        return totalAssets;
    },

    // 8. ПРИНУДИТЕЛЬНАЯ ПРОДАЖА АКТИВОВ (при банкротстве)
    forceSellAssets: (playerId: number, amountNeeded: number) => {
        const state = get();
        const player = state.players[playerId];
        let amountRaised = 0;

        console.log(`💸 Player ${player.name} needs $${amountNeeded}, forcing asset sales...`);

        // Сначала продаем все здания
        player.properties.forEach(propId => {
            const property = state.properties[propId];
            if (property.houses > 0) {
                while (property.houses > 0 && amountRaised < amountNeeded) {
                    if (get().canSellBuilding(propId)) {
                        const sellPrice = Math.floor(property.housePrice / 2);
                        get().sellHouse(propId);
                        amountRaised += sellPrice;
                        addImportantLog(state, `🏠💸 ${player.name} was forced to sell a building for $${sellPrice}`);
                    }
                }
            }
        });

        // Потом закладываем все незаложенные свойства
        if (amountRaised < amountNeeded) {
            player.properties.forEach(propId => {
                if (amountRaised >= amountNeeded) return;

                if (get().canMortgageProperty(propId)) {
                    const property = state.properties[propId];
                    get().mortgageProperty(propId);
                    amountRaised += property.mortgageValue;
                    addImportantLog(state, `🏦💸 ${player.name} was forced to mortgage ${property.name}`);
                }
            });
        }

        return amountRaised >= amountNeeded;
    },

    // 9. ОБРАБОТКА БАНКРОТСТВА
    handleBankruptcy: (playerId: number) => {
        const timestamp = Date.now();
        const state = get();
        const player = state.players[playerId];

        console.log(`💀 Handling bankruptcy for player: ${player.name}`);

        set(state => {
            const newPlayers = [...state.players];
            const newProperties = [...state.properties];

            // Передаем все свойства банку (снимаем владельца)
            player.properties.forEach(propId => {
                newProperties[propId] = {
                    ...newProperties[propId],
                    owner: null,
                    mortgage: false,
                    houses: 0
                };
            });

            // Помечаем игрока как банкрота
            newPlayers[playerId] = {
                ...player,
                money: 0,
                properties: [],
                bankrupt: true
            };

            addImportantLog(state, `💀 ${player.name} went bankrupt! All properties returned to the bank.`);

            return {
                ...state,
                players: newPlayers,
                properties: newProperties,
                lastActionTimestamp: timestamp
            };
        });

        // Проверяем, не закончилась ли игра
        setTimeout(() => {
            get().checkGameEnd();
        }, 100);

        // Синхронизируем банкротство
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: player.userId,
                        action: 'handleBankruptcy',
                        playerName: player.name,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                    console.log('✅ Synced bankruptcy');
                } catch (error) {
                    console.error('❌ Failed to sync bankruptcy:', error);
                }
            }, 0);
        }
    },

    // 10. ОТКЛОНЕНИЕ ПОКУПКИ И НАЧАЛО АУКЦИОНА
    declinePropertyPurchase: (propertyId: number) => {
        const timestamp = Date.now();
        const state = get();
        const property = state.properties[propertyId];
        const player = state.players[state.currentPlayer];

        console.log(`🏛️ ${player.name} declined to buy ${property.name}, starting auction...`);

        addImportantLog(state, `🏛️ ${player.name} declined to buy ${property.name}. Starting auction!`);

        // Начинаем аукцион
        get().startPropertyAuction(propertyId);
    },

    // 11. НАЧАЛО АУКЦИОНА
    startPropertyAuction: (propertyId: number) => {
        const timestamp = Date.now();
        const state = get();
        const property = state.properties[propertyId];
        const auctionCreator = state.currentPlayer;

        // Проверяем, что аукцион еще не запущен
        if (state.currentAuction) {
            console.log('🚫 Auction already in progress, cannot start new one');
            return;
        }

        const participants = state.players
            .map((_, index) => index)
            .filter(index =>
                !state.players[index].bankrupt &&
                index !== auctionCreator
            );

        console.log('🏛️ Starting auction with immediate sync:', {
            propertyId,
            propertyName: property.name,
            auctionCreator: state.players[auctionCreator].name,
            auctionCreatorUserId: state.players[auctionCreator].userId,
            participants: participants.map(id => ({
                index: id,
                name: state.players[id].name,
                userId: state.players[id].userId
            })),
            startingBid: property.price,
            participantCount: participants.length,
            timestamp
        });

        const auctionData = {
            propertyId,
            currentBid: property.price,
            currentBidder: null,
            timeLeft: 30000,
            participants,
            timestamp,
            auctionCreator,
            activeParticipants: [...participants],
            declinedParticipants: []
        };

        // ✅ ЛОКАЛЬНО ОБНОВЛЯЕМ СОСТОЯНИЕ СРАЗУ
        set(state => ({
            ...state,
            currentAuction: auctionData, // ТУТ УСТАНАВЛИВАЕМ ОБЪЕКТ, НЕ null
            selectedProperty: null,
            lastActionTimestamp: timestamp
        }));

        addImportantLog(state, `🏛️ ${state.players[auctionCreator].name} started auction for ${property.name}! Starting at $${property.price.toLocaleString()}`);

        // ПРИНУДИТЕЛЬНАЯ МОМЕНТАЛЬНАЯ СИНХРОНИЗАЦИЯ
        if (get().roomId) {
            console.log('📡 FORCING immediate auction sync to all players...');

            realtimeGameService.updateGameState(get().roomId!, get(), {
                playerId: state.players[auctionCreator].userId,
                action: 'startPropertyAuction',
                propertyId,
                propertyName: property.name,
                auctionCreator,
                auctionCreatorName: state.players[auctionCreator].name,
                auctionCreatorUserId: state.players[auctionCreator].userId,
                participantCount: participants.length,
                auctionData,
                timestamp,
                forceSync: true
            }).then(() => {
                console.log('✅ AUCTION SYNCED TO ALL PLAYERS IMMEDIATELY');
            }).catch(error => {
                console.error('❌ CRITICAL: Auction sync failed:', error);
                setTimeout(() => {
                    console.log('🔄 Retrying auction sync...');
                    realtimeGameService.updateGameState(get().roomId!, get(), {
                        playerId: state.players[auctionCreator].userId,
                        action: 'startPropertyAuction_retry',
                        auctionData,
                        timestamp
                    });
                }, 200);
            });
        }
    },


    // НОВАЯ ФУНКЦИЯ - УВЕЛИЧИТЬ СТАВКУ НА $20
    increaseBid: (playerId: number) => {
        const timestamp = Date.now();
        const state = get();
        const auction = state.currentAuction;
        const player = state.players[playerId];

        if (!auction || !player) return;

        const newBid = auction.currentBid + 20;

        console.log('💰 INCREASE BID:', {
            playerId,
            playerName: player.name,
            oldBid: auction.currentBid,
            newBid,
            playerMoney: player.money,
            canAfford: player.money >= newBid,
            activeParticipants: auction.activeParticipants?.length || 0
        });

        if (player.money < newBid) {
            addImportantLog(state, `❌ ${player.name} cannot afford $${newBid.toLocaleString()}!`);
            return;
        }

        set(state => ({
            ...state,
            currentAuction: {
                ...auction,
                currentBid: newBid,
                currentBidder: playerId,
                timeLeft: Math.max(auction.timeLeft, 10000) // Минимум 10 секунд остается
            },
            lastActionTimestamp: timestamp
        }));

        addImportantLog(state, `💰 ${player.name} raised bid to $${newBid.toLocaleString()}!`);

        // ПРОВЕРЯЕМ: если осталось 2 участника и один сделал ставку = он выигрывает
        const activeCount = auction.activeParticipants?.length || auction.participants.length;
        if (activeCount <= 2) {
            console.log('🏆 Only 2 participants left, immediate win!');
            setTimeout(() => {
                get().endAuction();
            }, 1000); // Через секунду завершаем
        }

        // Синхронизируем
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: player.userId,
                        action: 'increaseBid',
                        newBid,
                        playerName: player.name,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                } catch (error) {
                    console.error('❌ Failed to sync bid increase:', error);
                }
            }, 0);
        }
    },

    declineAuction: (playerId: number) => {
        const timestamp = Date.now();
        const state = get();
        const auction = state.currentAuction;
        const player = state.players[playerId];

        if (!auction || !player) return;

        console.log('❌ DECLINE AUCTION:', {
            playerId,
            playerName: player.name,
            activeParticipants: auction.activeParticipants
        });

        // Убираем игрока из активных участников
        const newActiveParticipants = (auction.activeParticipants || auction.participants)
            .filter(id => id !== playerId);

        const newDeclinedParticipants = [...(auction.declinedParticipants || []), playerId];

        set(state => ({
            ...state,
            currentAuction: {
                ...auction,
                activeParticipants: newActiveParticipants,
                declinedParticipants: newDeclinedParticipants
            },
            lastActionTimestamp: timestamp
        }));

        addImportantLog(state, `❌ ${player.name} declined to participate in auction`);

        // ПРОВЕРЯЕМ: если остался 1 активный участник = он выигрывает
        if (newActiveParticipants.length === 1) {
            const winner = state.players[newActiveParticipants[0]];
            addImportantLog(state, `🏆 ${winner.name} wins by default!`);
            setTimeout(() => {
                get().endAuction();
            }, 1000);
        }
        // Если никого не осталось = никто не получает
        else if (newActiveParticipants.length === 0) {
            addImportantLog(state, `🚫 All players declined - property remains unsold`);
            setTimeout(() => {
                get().endAuction();
            }, 1000);
        }

        // Синхронизируем
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: player.userId,
                        action: 'declineAuction',
                        playerName: player.name,
                        remainingParticipants: newActiveParticipants.length,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                } catch (error) {
                    console.error('❌ Failed to sync auction decline:', error);
                }
            }, 0);
        }
    },

    // 12. РАЗМЕЩЕНИЕ СТАВКИ
    placeBid: (playerId: number, amount: number) => {
        const timestamp = Date.now();
        const state = get();
        const player = state.players[playerId];
        const auction = state.currentAuction;

        // ДОБАВИТЬ ПРОВЕРКУ НА NULL:
        if (!auction || auction.propertyId === null || amount <= auction.currentBid || player.money < amount) {
            return;
        }

        set(state => ({
            ...state,
            currentAuction: {
                ...auction,
                currentBid: amount,
                currentBidder: playerId,
                timeLeft: Math.max(auction.timeLeft, 10000)
            },
            lastActionTimestamp: timestamp
        }));

        addImportantLog(state, `🏛️ ${player.name} bid $${amount}!`);

        // Синхронизируем ставку
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: player.userId,
                        action: 'placeBid',
                        amount,
                        playerName: player.name,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                    console.log('✅ Synced bid placement');
                } catch (error) {
                    console.error('❌ Failed to sync bid placement:', error);
                }
            }, 0);
        }
    },

    // 13. ЗАВЕРШЕНИЕ АУКЦИОНА
    endAuction: () => {
        const timestamp = Date.now();
        const state = get();
        const auction = state.currentAuction;

        if (!auction || auction.propertyId === null) {
            console.warn('❌ No active auction to end');
            return;
        }

        const property = state.properties[auction.propertyId];

        if (auction.currentBidder !== null) {
            const winner = state.players[auction.currentBidder];

            set(state => {
                const newPlayers = [...state.players];
                const newProperties = [...state.properties];

                newPlayers[auction.currentBidder!] = {
                    ...winner,
                    money: winner.money - auction.currentBid,
                    properties: [...winner.properties, auction.propertyId!]
                };

                newProperties[auction.propertyId!] = {
                    ...property,
                    owner: auction.currentBidder
                };

                return {
                    ...state,
                    players: newPlayers,
                    properties: newProperties,
                    currentAuction: null, // ✅ ПРАВИЛЬНО УСТАНАВЛИВАЕМ null
                    lastActionTimestamp: timestamp
                };
            });

            addImportantLog(state, `🏛️ ${winner.name} won the auction for ${property.name} with $${auction.currentBid}!`);
        } else {
            set(state => ({
                ...state,
                currentAuction: null, // ✅ ПРАВИЛЬНО УСТАНАВЛИВАЕМ null
                lastActionTimestamp: timestamp
            }));

            addImportantLog(state, `🏛️ No bids received. ${property.name} remains unsold.`);
        }

        // Синхронизируем окончание аукциона
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: state.getCurrentPlayer().userId,
                        action: 'endAuction',
                        propertyId: auction.propertyId,
                        winner: auction.currentBidder,
                        finalBid: auction.currentBid,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                    console.log('✅ Synced auction end');
                } catch (error) {
                    console.error('❌ Failed to sync auction end:', error);
                }
            }, 0);
        }
    },

    acceptTradeOffer: (sessionId: string, offerId: string) => {
        const timestamp = Date.now();
        const state = get();
        const offer = state.activeTradeOffers.find(o => o.id === offerId);

        if (!offer || offer.status !== 'pending') {
            console.warn('❌ Cannot accept offer - offer not found or not pending');
            return;
        }

        console.log('✅ Accepting trade offer:', offerId);

        // Выполняем обмен
        get().executeTradeOffer(offer);

        // Обновляем статус предложения и сессии
        set(state => {
            const updatedOffers = state.activeTradeOffers.map(o =>
                o.id === offerId ? { ...o, status: 'accepted' as const } : o
            );

            const updatedSessions = state.tradeSessions.map(s =>
                s.id === sessionId ? { ...s, status: 'completed' as const } : s
            );

            return {
                ...state,
                activeTradeOffers: updatedOffers,
                tradeSessions: updatedSessions,
                isTradeModalOpen: false,
                currentTradeSession: null,
                lastActionTimestamp: timestamp
            };
        });

        const fromPlayer = get().players[offer.fromPlayerId];
        const toPlayer = get().players[offer.toPlayerId];
        addImportantLog(get(), `✅ ${toPlayer.name} accepted ${fromPlayer.name}'s trade offer!`);

        // Синхронизируем через realtime
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: toPlayer.userId,
                        action: 'accept_trade_offer',
                        sessionId,
                        offerId,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                } catch (error) {
                    console.error('❌ Failed to sync trade offer acceptance:', error);
                }
            }, 0);
        }
    },

    rejectTradeOffer: (sessionId: string, offerId: string) => {
        const timestamp = Date.now();
        const state = get();
        const offer = state.activeTradeOffers.find(o => o.id === offerId);

        if (!offer) {
            console.warn('❌ Cannot reject offer - offer not found');
            return;
        }

        console.log('❌ Rejecting trade offer:', offerId);

        set(state => {
            const updatedOffers = state.activeTradeOffers.map(o =>
                o.id === offerId ? { ...o, status: 'rejected' as const } : o
            );

            const updatedSessions = state.tradeSessions.map(s =>
                s.id === sessionId ? { ...s, status: 'cancelled' as const } : s
            );

            return {
                ...state,
                activeTradeOffers: updatedOffers,
                tradeSessions: updatedSessions,
                lastActionTimestamp: timestamp
            };
        });

        const fromPlayer = get().players[offer.fromPlayerId];
        const toPlayer = get().players[offer.toPlayerId];
        addImportantLog(get(), `❌ ${toPlayer.name} rejected ${fromPlayer.name}'s trade offer`);

        // Синхронизируем через realtime
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: toPlayer.userId,
                        action: 'reject_trade_offer',
                        sessionId,
                        offerId,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                } catch (error) {
                    console.error('❌ Failed to sync trade offer rejection:', error);
                }
            }, 0);
        }
    },

    cancelTradeSession: (sessionId: string) => {
        const timestamp = Date.now();
        console.log('🚫 Cancelling trade session:', sessionId);

        set(state => {
            const updatedSessions = state.tradeSessions.map(s =>
                s.id === sessionId ? { ...s, status: 'cancelled' as const } : s
            );

            // Отменяем все активные предложения в этой сессии
            const updatedOffers = state.activeTradeOffers.map(offer => {
                const session = state.tradeSessions.find(s => s.currentOffer?.id === offer.id);
                if (session?.id === sessionId) {
                    return { ...offer, status: 'expired' as const };
                }
                return offer;
            });

            return {
                ...state,
                activeTradeOffers: updatedOffers,
                tradeSessions: updatedSessions,
                isTradeModalOpen: false,
                currentTradeSession: null,
                lastActionTimestamp: timestamp
            };
        });

        addImportantLog(get(), `🚫 Trade session was cancelled`);

        // Синхронизируем через realtime
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: newState.getCurrentPlayer().userId,
                        action: 'cancel_trade_session',
                        sessionId,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                } catch (error) {
                    console.error('❌ Failed to sync trade session cancellation:', error);
                }
            }, 0);
        }
    },

    executeTradeOffer: (offer: TradeOffer) => {
        const state = get();
        const fromPlayer = state.players[offer.fromPlayerId];
        const toPlayer = state.players[offer.toPlayerId];

        console.log('🔄 Executing trade offer:', {
            from: fromPlayer.name,
            to: toPlayer.name,
            offeredProperties: offer.offeredProperties,
            requestedProperties: offer.requestedProperties,
            offeredMoney: offer.offeredMoney,
            requestedMoney: offer.requestedMoney
        });

        // Проверяем валидность сделки
        const validation = get().validateTradeOffer(offer);
        if (!validation.valid) {
            addImportantLog(get(), `❌ Trade failed: ${validation.reason}`);
            return;
        }

        set(state => {
            const newPlayers = [...state.players];
            const newProperties = [...state.properties];

            // Обновляем деньги игроков
            newPlayers[offer.fromPlayerId] = {
                ...fromPlayer,
                money: fromPlayer.money - offer.offeredMoney + offer.requestedMoney,
                properties: [
                    ...fromPlayer.properties.filter(id => !offer.offeredProperties.includes(id)),
                    ...offer.requestedProperties
                ]
            };

            newPlayers[offer.toPlayerId] = {
                ...toPlayer,
                money: toPlayer.money + offer.offeredMoney - offer.requestedMoney,
                properties: [
                    ...toPlayer.properties.filter(id => !offer.requestedProperties.includes(id)),
                    ...offer.offeredProperties
                ]
            };

            // Обновляем владельцев свойств
            offer.offeredProperties.forEach(propId => {
                newProperties[propId] = { ...newProperties[propId], owner: offer.toPlayerId };
            });

            offer.requestedProperties.forEach(propId => {
                newProperties[propId] = { ...newProperties[propId], owner: offer.fromPlayerId };
            });

            return {
                ...state,
                players: newPlayers,
                properties: newProperties
            };
        });

        // Детальный лог обмена
        if (offer.offeredProperties.length > 0) {
            const offeredPropNames = offer.offeredProperties.map(id => state.properties[id].name).join(', ');
            addImportantLog(get(), `🏠 ${fromPlayer.name} traded: ${offeredPropNames}`);
        }
        if (offer.requestedProperties.length > 0) {
            const requestedPropNames = offer.requestedProperties.map(id => state.properties[id].name).join(', ');
            addImportantLog(get(), `🏠 ${toPlayer.name} traded: ${requestedPropNames}`);
        }
        if (offer.offeredMoney > 0) {
            addImportantLog(get(), `💰 ${fromPlayer.name} paid $${offer.offeredMoney}`);
        }
        if (offer.requestedMoney > 0) {
            addImportantLog(get(), `💰 ${toPlayer.name} paid $${offer.requestedMoney}`);
        }

        addImportantLog(get(), `🤝 Trade completed successfully!`);
    },

    validateTradeOffer: (offer: TradeOffer) => {
        const state = get();
        const fromPlayer = state.players[offer.fromPlayerId];
        const toPlayer = state.players[offer.toPlayerId];

        // Проверяем деньги
        if (fromPlayer.money < offer.offeredMoney) {
            return { valid: false, reason: `${fromPlayer.name} doesn't have enough money` };
        }
        if (toPlayer.money < offer.requestedMoney) {
            return { valid: false, reason: `${toPlayer.name} doesn't have enough money` };
        }

        // Проверяем владение свойствами
        for (const propId of offer.offeredProperties) {
            const property = state.properties[propId];
            if (property.owner !== offer.fromPlayerId) {
                return { valid: false, reason: `${fromPlayer.name} doesn't own ${property.name}` };
            }
            if (property.mortgage) {
                return { valid: false, reason: `${property.name} is mortgaged` };
            }
            if (property.houses > 0) {
                return { valid: false, reason: `${property.name} has buildings` };
            }
        }

        for (const propId of offer.requestedProperties) {
            const property = state.properties[propId];
            if (property.owner !== offer.toPlayerId) {
                return { valid: false, reason: `${toPlayer.name} doesn't own ${property.name}` };
            }
            if (property.mortgage) {
                return { valid: false, reason: `${property.name} is mortgaged` };
            }
            if (property.houses > 0) {
                return { valid: false, reason: `${property.name} has buildings` };
            }
        }

        return { valid: true };
    },

    cleanupExpiredOffers: () => {
        const now = Date.now();
        set(state => ({
            ...state,
            activeTradeOffers: state.activeTradeOffers.filter(offer =>
                offer.expiresAt > now || offer.status !== 'pending'
            )
        }));
    },

    syncTradeData: (tradeData: { sessions: TradeSession[], offers: TradeOffer[] }) => {
        console.log('🔄 Syncing trade data:', tradeData);
        set(state => ({
            ...state,
            tradeSessions: tradeData.sessions,
            activeTradeOffers: tradeData.offers
        }));
    },

    saveGameState: async () => {
        console.log('💾 STORE: saveGameState called');
        const state = get();
        if (!state.roomId) {
            console.warn('❌ Not saving - missing roomId');
            return;
        }

        const playersWithUserId = state.players.map(p => {
            if (!p.userId) {
                console.warn(`⚠️ Player ${p.name} is missing userId!`);
            }
            return p;
        });

        const gameState = {
            gameStarted: state.gameStarted,
            players: playersWithUserId,
            properties: state.properties,
            currentPlayer: state.currentPlayer,
            diceRolled: state.diceRolled,
            lastRoll: state.lastRoll,
            gameLog: state.gameLog,
            doubleCount: state.doubleCount,
            chanceCards: state.chanceCards,
            communityChestCards: state.communityChestCards,
            hasBuiltThisTurn: state.hasBuiltThisTurn,

            // Добавляем торговые данные
            activeTradeOffers: state.activeTradeOffers,
            tradeSessions: state.tradeSessions,
            isTradeModalOpen: state.isTradeModalOpen,
            currentTradeSession: state.currentTradeSession,

            // Game End State
            gameEnded: state.gameEnded,
            winner: state.winner,
            showVictoryModal: state.showVictoryModal
        };

        try {
            console.log('💾 Saving game state to database for room:', state.roomId);
            await gameSessionService.saveGameState(state.roomId, gameState);
            console.log('✅ Game state saved successfully');
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('❌ Failed to save game state:', errorMessage);
            addImportantLog(state, `❌ Failed to save game state: ${errorMessage}`);
        }
    },


    loadGameState: async (roomId: string) => {
        try {
            const gameState = await gameSessionService.loadGameState(roomId);
            if (gameState) {
                set({
                    ...gameState,
                    roomId,
                    selectedProperty: null,
                    currentCard: null,
                    isBuildingControlsOpen: false,

                    // Инициализируем торговые поля если их нет
                    activeTradeOffers: gameState.activeTradeOffers || [],
                    tradeSessions: gameState.tradeSessions || [],
                    isTradeModalOpen: gameState.isTradeModalOpen || false,
                    currentTradeSession: gameState.currentTradeSession || null,

                    // Game End State
                    gameEnded: gameState.gameEnded || false,
                    winner: gameState.winner || null,
                    showVictoryModal: gameState.showVictoryModal || false
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load game state:', error);
            return false;
        }
    },

    syncGameState: (gameState: any, metadata?: any) => {
        const currentState = get();

        console.log('🔄 SYNC: Received game state update:', {
            action: metadata?.action,
            fromPlayerId: metadata?.playerId,
            currentUserId: currentState.getCurrentPlayer()?.userId,
            timestamp: metadata?.timestamp,
            hasAuction: !!gameState.currentAuction, // ДОБАВИТЬ ЛОГИРОВАНИЕ АУКЦИОНА
            auctionPropertyId: gameState.currentAuction?.propertyId
        });

        // Проверка валидности данных
        if (!gameState || !gameState.players || gameState.players.length === 0) {
            console.warn('❌ Invalid sync data received');
            return;
        }

        // Проверяем timestamp чтобы избежать применения старых данных
        if (metadata?.timestamp && currentState.lastActionTimestamp &&
            metadata.timestamp < currentState.lastActionTimestamp) {
            console.log('⏰ Ignoring outdated sync data');
            return;
        }

        console.log('✅ Applying game state sync:', {
            currentPlayer: gameState.currentPlayer,
            currentPlayerName: gameState.players[gameState.currentPlayer]?.name,
            diceRolled: gameState.diceRolled,
            action: metadata?.action,
            auctionData: gameState.currentAuction // ДОБАВИТЬ ЛОГИРОВАНИЕ
        });

        // Применяем все изменения из входящего состояния
        set({
            gameStarted: gameState.gameStarted,
            players: gameState.players,
            properties: gameState.properties,
            currentPlayer: gameState.currentPlayer,
            diceRolled: gameState.diceRolled,
            lastRoll: gameState.lastRoll,
            gameLog: gameState.gameLog,
            doubleCount: gameState.doubleCount,
            chanceCards: gameState.chanceCards,
            communityChestCards: gameState.communityChestCards,
            hasBuiltThisTurn: gameState.hasBuiltThisTurn || false,
            selectedProperty: gameState.selectedProperty || null,

            // ✅ ДОБАВИТЬ СИНХРОНИЗАЦИЮ АУКЦИОНА:
            currentAuction: gameState.currentAuction || null,

            // Торговые данные
            activeTradeOffers: gameState.activeTradeOffers || [],
            tradeSessions: gameState.tradeSessions || [],
            currentTradeSession: gameState.currentTradeSession || null,

            // Game End State
            gameEnded: gameState.gameEnded || false,
            winner: gameState.winner || null,
            showVictoryModal: gameState.showVictoryModal || false,

            // Timestamp для отслеживания
            lastActionTimestamp: metadata?.timestamp || Date.now()
        });

        console.log('✅ Game state synchronized successfully');
    },

    openBuildingControls: () => {
        const timestamp = Date.now();
        console.log('🏗️ Opening building controls...');
        set(state => ({
            ...state,
            isBuildingControlsOpen: true,
            lastActionTimestamp: timestamp
        }));
    },

    closeBuildingControls: () => {
        const timestamp = Date.now();
        console.log('🏗️ Closing building controls...');
        set(state => ({
            ...state,
            isBuildingControlsOpen: false,
            lastActionTimestamp: timestamp
        }));
    },

    startGame: () => {
        set({
            gameStarted: true,
            doubleCount: 0
        });
        get().addToLog("🎮 BONKOPOLY STARTED! Time to go TO THE MOON! 🚀");

        get().saveGameState();
    },
    rollDice: () => {
        console.log('🎲 STORE: rollDice called');
        const timestamp = Date.now();
        const dice1 = Math.floor(Math.random() * 6) + 1;
        const dice2 = Math.floor(Math.random() * 6) + 1;
        const total = dice1 + dice2;
        const isDouble = dice1 === dice2;

        set((state) => {
            const player = state.players[state.currentPlayer];

            // Если игрок в тюрьме
            if (player.inJail) {
                const newPlayers = [...state.players];
                const updatedPlayer = { ...player };
                updatedPlayer.jailTurns++;

                if (isDouble) {
                    // Выход из тюрьмы по дублю
                    updatedPlayer.inJail = false;
                    updatedPlayer.jailTurns = 0;
                    newPlayers[state.currentPlayer] = updatedPlayer;

                    addImportantLog(state, `🎲 ${player.name} rolled (${dice1},${dice2}) - doubles! Got out of jail!`);

                    const newState = {
                        ...state,
                        players: newPlayers,
                        lastRoll: [dice1, dice2] as [number, number],
                        diceRolled: false,
                        doubleCount: 1,
                        lastActionTimestamp: timestamp
                    };

                    set(newState);

                    // Синхронизируем и двигаем
                    if (get().roomId) {
                        (async () => {
                            try {
                                const syncState = get();
                                const metadata = {
                                    playerId: syncState.getCurrentPlayer().userId,
                                    action: 'rollDice_jail_escape',
                                    dice1, dice2, isDouble: true, timestamp
                                };
                                await realtimeGameService.updateGameState(get().roomId!, syncState, metadata);
                                console.log('✅ Synced jail escape dice roll');

                                // Двигаем игрока после синхронизации
                                setTimeout(() => {
                                    get().movePlayer(state.currentPlayer, total, [dice1, dice2]);
                                }, 100);
                            } catch (error) {
                                console.error('❌ Failed to sync jail escape dice roll:', error);
                            }
                        })();
                    } else {
                        setTimeout(() => {
                            get().movePlayer(state.currentPlayer, total, [dice1, dice2]);
                        }, 100);
                    }

                    return newState;
                } else if (updatedPlayer.jailTurns === 3) {
                    // Принудительная оплата штрафа
                    updatedPlayer.inJail = false;
                    updatedPlayer.jailTurns = 0;
                    updatedPlayer.money -= 50;
                    newPlayers[state.currentPlayer] = updatedPlayer;

                    addImportantLog(state, `🎲 ${player.name} rolled (${dice1},${dice2}) - paid $50 fine after three failed attempts`);

                    const newState = {
                        ...state,
                        players: newPlayers,
                        lastRoll: [dice1, dice2] as [number, number],
                        diceRolled: true,
                        doubleCount: 0,
                        lastActionTimestamp: timestamp
                    };

                    set(newState);

                    if (get().roomId) {
                        (async () => {
                            try {
                                const syncState = get();
                                const metadata = {
                                    playerId: syncState.getCurrentPlayer().userId,
                                    action: 'rollDice_forced_jail_payment',
                                    dice1, dice2, timestamp
                                };
                                await realtimeGameService.updateGameState(get().roomId!, syncState, metadata);

                                setTimeout(() => {
                                    get().movePlayer(state.currentPlayer, total, [dice1, dice2]);
                                }, 100);
                            } catch (error) {
                                console.error('❌ Failed to sync forced jail payment:', error);
                            }
                        })();
                    } else {
                        setTimeout(() => {
                            get().movePlayer(state.currentPlayer, total, [dice1, dice2]);
                        }, 100);
                    }

                    return newState;
                } else {
                    // Неудачная попытка выбросить дубль
                    addImportantLog(state, `🎲 ${player.name} rolled (${dice1},${dice2}) - ${updatedPlayer.jailTurns === 2 ? 'last attempt next turn!' : 'still in jail'}`);
                    newPlayers[state.currentPlayer] = updatedPlayer;

                    const newState = {
                        ...state,
                        players: newPlayers,
                        lastRoll: [dice1, dice2] as [number, number],
                        diceRolled: true,
                        doubleCount: 0,
                        lastActionTimestamp: timestamp
                    };

                    if (get().roomId) {
                        (async () => {
                            try {
                                const syncState = get();
                                const metadata = {
                                    playerId: syncState.getCurrentPlayer().userId,
                                    action: 'rollDice_jail_failed',
                                    dice1, dice2, jailTurns: updatedPlayer.jailTurns, timestamp
                                };
                                await realtimeGameService.updateGameState(get().roomId!, syncState, metadata);
                            } catch (error) {
                                console.error('❌ Failed to sync failed jail escape:', error);
                            }
                        })();
                    }

                    return newState;
                }
            }

            // Обычный бросок (не в тюрьме)
            const newDoubleCount = isDouble ? state.doubleCount + 1 : 0;

            // Третий дубль подряд = тюрьма
            if (newDoubleCount === 3) {
                addImportantLog(state, `🎲 ${player.name} rolled (${dice1},${dice2}) - third doubles in a row! Go to jail!`);

                const newPlayers = [...state.players];
                const updatedPlayer = { ...player };
                updatedPlayer.position = 10;
                updatedPlayer.inJail = true;
                updatedPlayer.jailTurns = 0;
                newPlayers[state.currentPlayer] = updatedPlayer;

                const newState = {
                    ...state,
                    players: newPlayers,
                    lastRoll: [dice1, dice2] as [number, number],
                    diceRolled: true,
                    doubleCount: 0,
                    currentPlayer: (state.currentPlayer + 1) % state.players.length,
                    lastActionTimestamp: timestamp
                };

                if (get().roomId) {
                    (async () => {
                        try {
                            const syncState = get();
                            const metadata = {
                                playerId: player.userId,
                                action: 'rollDice_third_double_jail',
                                dice1, dice2, newCurrentPlayer: newState.currentPlayer, timestamp
                            };
                            await realtimeGameService.updateGameState(get().roomId!, syncState, metadata);
                        } catch (error) {
                            console.error('❌ Failed to sync third double jail:', error);
                        }
                    })();
                }

                return newState;
            }

            // Обычный бросок
            const newState = {
                ...state,
                lastRoll: [dice1, dice2] as [number, number],
                diceRolled: !isDouble,
                doubleCount: newDoubleCount,
                lastActionTimestamp: timestamp
            };

            set(newState);

            // Синхронизируем обычный бросок
            if (get().roomId) {
                (async () => {
                    try {
                        const syncState = get();
                        const metadata = {
                            playerId: syncState.getCurrentPlayer().userId,
                            action: 'rollDice_normal',
                            dice1, dice2, isDouble, doubleCount: newDoubleCount, timestamp
                        };
                        await realtimeGameService.updateGameState(get().roomId!, syncState, metadata);

                        // Двигаем игрока после синхронизации
                        setTimeout(() => {
                            get().movePlayer(state.currentPlayer, total, [dice1, dice2]);
                        }, 100);
                    } catch (error) {
                        console.error('❌ Failed to sync normal dice roll:', error);
                        // Двигаем игрока даже если синхронизация не удалась
                        setTimeout(() => {
                            get().movePlayer(state.currentPlayer, total, [dice1, dice2]);
                        }, 100);
                    }
                })();
            } else {
                // Если нет roomId, просто двигаем игрока
                setTimeout(() => {
                    get().movePlayer(state.currentPlayer, total, [dice1, dice2]);
                }, 100);
            }

            return newState;
        });

        console.log('🎲 STORE: rollDice completed, timestamp:', timestamp);
    },

    movePlayer: (playerId: number, spaces: number, rollInfo?: [number, number]) => {
        const timestamp = Date.now();

        set((state) => {
            const newPlayers = [...state.players];
            const player = { ...newPlayers[playerId] };
            const oldPosition = player.position;

            if (player.inJail) {
                return { players: newPlayers };
            }

            player.position = (player.position + spaces) % 40;
            const property = state.properties[player.position];

            // Go to Jail
            if (player.position === 30) {
                player.position = 10;
                player.inJail = true;
                player.jailTurns = 0;
                addImportantLog(state, `🎲 ${player.name} landed on GO TO JAIL - sent to Jail!`);
                newPlayers[playerId] = player;

                const newState = {
                    ...state,
                    players: newPlayers,
                    lastActionTimestamp: timestamp
                };

                // Синхронизируем сразу
                if (get().roomId) {
                    (async () => {
                        try {
                            const syncState = get();
                            const metadata = {
                                playerId: player.userId,
                                action: 'movePlayer_go_to_jail',
                                oldPosition, newPosition: 10, rollInfo, timestamp
                            };
                            await realtimeGameService.updateGameState(get().roomId!, syncState, metadata);
                        } catch (error) {
                            console.error('❌ Failed to sync Go to Jail movement:', error);
                        }
                    })();
                }

                return newState;
            }

            // Логируем движение
            if (rollInfo && spaces === rollInfo[0] + rollInfo[1]) {
                if (rollInfo[0] === rollInfo[1]) {
                    addImportantLog(state, `🎲 ${player.name} rolled (${rollInfo[0]},${rollInfo[1]}) and landed on ${property.name} - doubles! Roll again!`);
                } else {
                    addImportantLog(state, `🎲 ${player.name} rolled (${rollInfo[0]},${rollInfo[1]}) and landed on ${property.name}`);
                }
            }

            let passedStart = false;
            let landedOnGo = false;

            // Проверяем прохождение через START
            if (player.position < oldPosition || oldPosition + spaces >= 40) {
                player.money += 200;
                addImportantLog(state, `🚀 ${player.name} passed START! Collected $200 BONK!`);
                passedStart = true;
            }

            // Бонус за попадание на GO
            if (player.position === 0) {
                player.money += 200;
                addImportantLog(state, `🎯 ${player.name} landed exactly on GO! Bonus $200 BONK!`);
                landedOnGo = true;
            }

            // Налоги
            if (property.type === 'tax' && property.tax) {
                player.money -= property.tax;
                addImportantLog(state, `💸 ${player.name} paid $${property.tax} ${property.name}!`);
            }

            newPlayers[playerId] = player;

            let rentPaid = null;
            let selectedProperty = null;

            // Карточки
            if (property.type === 'chance' || property.type === 'community') {
                get().drawCard(property.type);
            }
            // Рента
            else if (property.owner !== null && property.owner !== playerId && !property.mortgage) {
                const owner = state.players[property.owner];
                const rent = get().getPropertyRent(player.position);

                // Проверяем, может ли игрок заплатить ренту
                if (player.money >= rent) {
                    player.money -= rent;
                    newPlayers[playerId] = player;

                    const updatedOwner = { ...owner, money: owner.money + rent };
                    newPlayers[property.owner] = updatedOwner;

                    addImportantLog(state, `💸 ${player.name} paid $${rent} rent to ${owner.name}!`);
                    rentPaid = { amount: rent, to: owner.name, toPlayerId: property.owner };
                } else {
                    // Игрок не может заплатить ренту - проверяем банкротство
                    const totalAssets = get().calculatePlayerAssets(playerId);
                    
                    if (totalAssets >= rent) {
                        // У игрока есть активы для продажи/залога
                        addImportantLog(state, `⚠️ ${player.name} cannot pay $${rent} rent! Need to sell/mortgage assets.`);
                        // Здесь можно добавить модальное окно для выбора активов для продажи
                    } else {
                        // Игрок банкрот
                        addImportantLog(state, `💀 ${player.name} is bankrupt! Cannot pay $${rent} rent.`);
                        get().handleBankruptcy(playerId);
                    }
                }
            }
            // Покупка
            else if (property.owner === null && property.price > 0 &&
                (property.type === 'property' || property.type === 'railroad' || property.type === 'utility')) {
                selectedProperty = player.position;
            }

            const newState = {
                ...state,
                players: newPlayers,
                selectedProperty,
                lastActionTimestamp: timestamp
            };

            // Синхронизируем движение
            if (get().roomId) {
                (async () => {
                    try {
                        const syncState = get();
                        const metadata = {
                            playerId: player.userId,
                            action: 'movePlayer',
                            oldPosition, newPosition: player.position, spaces, rollInfo,
                            passedStart, landedOnGo, rentPaid, selectedProperty,
                            propertyType: property.type, propertyName: property.name, timestamp
                        };
                        await realtimeGameService.updateGameState(get().roomId!, syncState, metadata);
                    } catch (error) {
                        console.error('❌ Failed to sync player movement:', error);
                    }
                })();
            }

            return newState;
        });
    },

    buyProperty: (propertyId: number) => {
        const timestamp = Date.now();
        const state = get();
        const property = state.properties[propertyId];
        const player = state.players[state.currentPlayer];

        console.log('💰 BUY PROPERTY DEBUG:', {
            propertyId,
            propertyName: property.name,
            propertyPrice: property.price,
            currentPlayerIndex: state.currentPlayer,
            currentPlayerData: player,
            currentPlayerName: player.name,
            currentPlayerMoney: player.money
        });

        // Все проверки валидности
        if (property.owner !== null) {
            addImportantLog(state, `❌ ${player.name} cannot buy ${property.name} - already owned!`);
            return false;
        }

        if (property.type === 'special' || property.type === 'chance' || property.type === 'community' || property.type === 'tax') {
            addImportantLog(state, `❌ ${player.name} cannot buy ${property.name} - not for sale!`);
            return false;
        }

        if (property.price > player.money) {
            addImportantLog(state, `❌ ${player.name} cannot afford ${property.name} (costs $${property.price})!`);
            return false;
        }

        // Обновляем состояние
        set(state => ({
            ...state,
            players: state.players.map(p =>
                p.id === player.id
                    ? { ...p, money: p.money - property.price, properties: [...p.properties, propertyId] }
                    : p
            ),
            properties: state.properties.map(p =>
                p.id === propertyId ? { ...p, owner: state.currentPlayer } : p
            ),
            selectedProperty: null, // Сбрасываем выбранное поле после покупки
            lastActionTimestamp: timestamp
        }));

        addImportantLog(state, `🏠 ${player.name} bought ${property.name} for $${property.price} BONK!`);

        // Синхронизируем покупку
        if (get().roomId) {
            setTimeout(async () => {
                try {
                    const newState = get();
                    const metadata = {
                        playerId: player.userId,
                        action: 'buyProperty',
                        propertyId,
                        propertyName: property.name,
                        propertyPrice: property.price,
                        newPlayerMoney: player.money - property.price,
                        timestamp
                    };
                    await realtimeGameService.updateGameState(get().roomId!, newState, metadata);
                    console.log('✅ Synced property purchase');
                } catch (error) {
                    console.error('❌ Failed to sync property purchase:', error);
                }
            }, 0);
        }

        return true;
    },

    endTurn: () => {
        const timestamp = Date.now();
        const currentState = get();

        console.log('🔄 END TURN - Before:', {
            currentPlayer: currentState.currentPlayer,
            currentPlayerName: currentState.players[currentState.currentPlayer]?.name,
            currentPlayerUserId: currentState.players[currentState.currentPlayer]?.userId,
            totalPlayers: currentState.players.length,
            diceRolled: currentState.diceRolled,
            hasBuiltThisTurn: currentState.hasBuiltThisTurn,
            roomId: currentState.roomId
        });

        if (!currentState.diceRolled) {
            console.error('❌ Cannot end turn - dice not rolled!');
            throw new Error("Must roll dice first");
        }

        const currentPlayer = currentState.getCurrentPlayer();
        const nextPlayerIndex = (currentState.currentPlayer + 1) % currentState.players.length;
        const nextPlayer = currentState.players[nextPlayerIndex];

        console.log('🔄 Calculating next turn:', {
            currentPlayerIndex: currentState.currentPlayer,
            nextPlayerIndex,
            nextPlayerName: nextPlayer.name,
            nextPlayerUserId: nextPlayer.userId
        });

        // Обновляем состояние ЛОКАЛЬНО
        set((state) => {
            const newState = {
                ...state,
                currentPlayer: nextPlayerIndex,
                diceRolled: false,
                doubleCount: 0,
                selectedProperty: null,
                hasBuiltThisTurn: false,
                lastActionTimestamp: timestamp
            };

            console.log('🔄 State updated locally:', {
                newCurrentPlayer: newState.currentPlayer,
                newCurrentPlayerName: newState.players[newState.currentPlayer]?.name
            });

            return newState;
        });

        // Получаем обновленное состояние
        const updatedState = get();
        const actualNextPlayer = updatedState.getCurrentPlayer();

        addImportantLog(updatedState, `🔄 ${actualNextPlayer.name}'s turn!`);

        console.log('🔄 END TURN - After local update:', {
            newCurrentPlayer: updatedState.currentPlayer,
            newCurrentPlayerName: actualNextPlayer.name,
            newCurrentPlayerUserId: actualNextPlayer.userId
        });

        // Принудительно синхронизируем СРАЗУ (убираем setTimeout)
        if (updatedState.roomId) {
            console.log('📡 Syncing turn end immediately...');

            // Сразу отправляем без задержки
            (async () => {
                try {
                    const metadata = {
                        playerId: currentPlayer.userId,
                        action: 'endTurn',
                        previousPlayer: currentPlayer.name,
                        previousPlayerUserId: currentPlayer.userId,
                        newCurrentPlayer: nextPlayerIndex,
                        newCurrentPlayerName: actualNextPlayer.name,
                        newCurrentPlayerUserId: actualNextPlayer.userId,
                        timestamp
                    };

                    console.log('📡 Sending sync metadata:', metadata);

                    await realtimeGameService.updateGameState(updatedState.roomId!, updatedState, metadata);
                    console.log('✅ Turn end synced successfully');
                } catch (error) {
                    console.error('❌ Failed to sync turn end:', error);
                }
            })();
        } else {
            console.warn('⚠️ No roomId found, cannot sync turn end');
        }
    },

    selectProperty: (id: number) => {
        set({ selectedProperty: id });
    },

    getCurrentPlayer: () => get().players[get().currentPlayer],

    initializePlayersFromLobby: (lobbyPlayers: any[]) => {
        console.log('Initializing players from lobby:', lobbyPlayers);

        const gameReadyPlayers = lobbyPlayers.map((lobbyPlayer, index) => ({
            id: index + 1,
            name: lobbyPlayer.name || `Player ${index + 1}`,
            userId: lobbyPlayer.userId || `player-${index}`, // 👈 ключевая строка
            money: 1500,
            position: 0,
            properties: [],
            color: lobbyPlayer.color || ["#00FF00", "#0000FF", "#FFFF00", "#FF0000"][index],
            inJail: false,
            jailTurns: 0,
            jailFreeCards: 0,
            icon: lobbyPlayer.icon || ["🎩", "🚗", "🐕", "⛵"][index]
        }));

        set({
            players: gameReadyPlayers,
            currentPlayer: 0,
            gameStarted: true
        });

        get().addToLog(`🎮 Game initialized with ${gameReadyPlayers.length} players from lobby!`);
        get().addToLog(`🚀 ${gameReadyPlayers[0].name}'s turn to start!`);
        get().saveGameState();
    },


    getProperty: (id: number) => {
        const property = get().properties.find(p => p.id === id);
        if (!property) throw new Error(`Property with id ${id} not found`);
        return property;
    },

    addToLog: (message: string) => {
        set(state => ({ gameLog: [...state.gameLog.slice(-19), message] }));
    },

    // Добавляем функцию для оплаты штрафа
    payJailFine: (playerId: number) => {
        set((state) => {
            const newPlayers = [...state.players];
            const player = { ...newPlayers[playerId] };

            if (!player.inJail) {
                return state;
            }

            // Проверяем, есть ли у игрока достаточно денег
            if (player.money < 50) {
                get().addToLog(`❌ ${player.name} doesn't have enough money to pay the jail fine!`);
                return state;
            }

            player.money -= 50;
            player.inJail = false;
            player.jailTurns = 0;
            newPlayers[playerId] = player;

            get().addToLog(`💰 ${player.name} paid $50 to get out of jail`);
            return { players: newPlayers };
        });
    },

    attemptJailEscape: (playerId: number, dice1: number, dice2: number) => {
        let escaped = false;
        set((state) => {
            const newPlayers = [...state.players];
            const player = { ...newPlayers[playerId] };

            if (!player.inJail) {
                return state;
            }

            // Проверяем на дубль
            if (dice1 === dice2) {
                player.inJail = false;
                player.jailTurns = 0;
                state.gameLog.push(`🎲 ${player.name} rolled doubles (${dice1},${dice2}) and got out of jail!`);
                escaped = true;
                // После выхода по дублю игрок двигается на количество выпавших очков
                get().movePlayer(playerId, dice1 + dice2, [dice1, dice2]);
            } else {
                state.gameLog.push(`🎲 ${player.name} rolled (${dice1},${dice2}) - not doubles, staying in jail.`);

                // Проверяем, не последний ли это ход
                if (player.jailTurns >= 3) {
                    player.inJail = false;
                    player.jailTurns = 0;
                    state.gameLog.push(`🔓 ${player.name} is released from jail after 3 turns!`);
                    escaped = true;
                    // После автоматического освобождения игрок двигается на количество выпавших очков
                    get().movePlayer(playerId, dice1 + dice2, [dice1, dice2]);
                }
            }

            newPlayers[playerId] = player;
            return { players: newPlayers, gameLog: [...state.gameLog] };
        });
        return escaped;
    },

    // Проверяет, владеет ли игрок всеми свойствами группы (монополия)
    hasMonopoly: (playerId: number, group: string) => {
        const monopolyGroup = MONOPOLY_GROUPS.find(g => g.name === group);
        if (!monopolyGroup) {
            console.log(`❌ Group ${group} not found in MONOPOLY_GROUPS`);
            return false;
        }

        const { properties } = get();
        const ownedCount = monopolyGroup.properties.filter(propId =>
            properties[propId].owner === playerId
        ).length;

        const hasMonopoly = ownedCount === monopolyGroup.size;

        console.log(`Monopoly check for ${group}:`, {
            playerId,
            ownedCount,
            requiredCount: monopolyGroup.size,
            hasMonopoly,
            properties: monopolyGroup.properties.map(id => ({
                id,
                name: properties[id].name,
                owner: properties[id].owner
            }))
        });

        return hasMonopoly;
    },

    // Проверяет, можно ли построить дом на свойстве
    canBuildHouse: (propertyId: number) => {
        const { properties, players } = get();
        const property = properties[propertyId];

        // Базовые проверки
        if (!property || property.owner === null || property.type !== 'property') {
            console.log('❌ Basic check failed:', { propertyExists: !!property, hasOwner: property?.owner !== null, isProperty: property?.type === 'property' });
            return false;
        }

        if (property.houses >= GAME_RULES.maxHousesPerProperty) {
            console.log('❌ Already has max houses:', property.houses);
            return false;
        }

        if (property.mortgage) {
            console.log('❌ Property is mortgaged');
            return false;
        }

        const player = players[property.owner];
        if (!player) {
            console.log('❌ Player not found');
            return false;
        }

        // Проверяем наличие монополии
        if (!get().hasMonopoly(property.owner, property.group)) {
            console.log('❌ No monopoly for group:', property.group);
            return false;
        }

        // КЛЮЧЕВОЕ ПРАВИЛО: Равномерная застройка
        const monopolyGroup = MONOPOLY_GROUPS.find(g => g.name === property.group);
        if (!monopolyGroup) {
            console.log('❌ Monopoly group not found:', property.group);
            return false;
        }

        // Получаем все свойства в группе
        const groupProperties = monopolyGroup.properties.map(id => properties[id]);

        // Находим минимальное количество домов в группе
        const minHouses = Math.min(...groupProperties.map(p => p.houses));

        // Можно строить только если на этом свойстве домов не больше чем минимум
        if (property.houses > minHouses) {
            console.log('❌ Even building rule violated:', {
                propertyName: property.name,
                propertyHouses: property.houses,
                minHousesInGroup: minHouses,
                groupProperties: groupProperties.map(p => ({ name: p.name, houses: p.houses }))
            });
            return false;
        }

        // Проверяем наличие денег у игрока
        if (player.money < property.housePrice) {
            console.log('❌ Not enough money:', { playerMoney: player.money, housePrice: property.housePrice });
            return false;
        }

        console.log('✅ Can build house on:', property.name, {
            currentHouses: property.houses,
            minInGroup: minHouses,
            playerMoney: player.money,
            housePrice: property.housePrice
        });

        return true;
    },

    // Строит дом на свойстве
    buildHouse: (propertyId: number) => {
        const timestamp = Date.now();
        const state = get();

        console.log('🏠 Building house on property:', propertyId);

        // НОВАЯ ПРОВЕРКА: уже строил в этом ходу?
        if (state.hasBuiltThisTurn) {
            console.log('❌ Already built this turn');
            addImportantLog(state, `❌ ${state.players[state.currentPlayer].name} can only build once per turn!`);
            return;
        }

        if (!get().canBuildHouse(propertyId)) {
            console.log('❌ Cannot build house');
            return;
        }

        set(state => {
            const newProperties = [...state.properties];
            const newPlayers = [...state.players];
            const property = newProperties[propertyId];
            const player = newPlayers[property.owner!];

            // Строим дом
            property.houses++;
            player.money -= property.housePrice;

            console.log(`🏠 Built house on ${property.name}. New house count: ${property.houses}`);
            addImportantLog(state, `🏠 ${player.name} built a house on ${property.name} for $${property.housePrice}`);

            return {
                ...state,
                properties: newProperties,
                players: newPlayers,
                hasBuiltThisTurn: true,  // ОТМЕЧАЕМ ЧТО УЖЕ СТРОИЛ
                lastActionTimestamp: timestamp
            };
        });
    },

    // Проверяет, можно ли построить отель на свойстве
    canBuildHotel: (propertyId: number) => {
        const { properties, players } = get();
        const property = properties[propertyId];

        // Базовые проверки
        if (!property || property.owner === null || property.type !== 'property') return false;
        if (property.houses !== GAME_RULES.maxHousesPerProperty) return false; // Должно быть ровно 4 дома
        if (property.mortgage) return false;

        const player = players[property.owner];
        if (!player) return false;

        // Проверяем наличие монополии
        if (!get().hasMonopoly(property.owner, property.group)) return false;

        // ИСПРАВЛЕНО: Для отеля все свойства в группе должны иметь 4+ домов
        const monopolyGroup = MONOPOLY_GROUPS.find(g => g.name === property.group);
        if (!monopolyGroup) return false;

        const groupProperties = monopolyGroup.properties.map(id => properties[id]);

        // ПРАВИЛЬНАЯ ЛОГИКА: все остальные свойства должны иметь 4+ домов (включая отели)
        const otherProperties = groupProperties.filter(p => p.id !== propertyId);
        const othersHaveEnoughHouses = otherProperties.every(p => p.houses >= 4);

        if (!othersHaveEnoughHouses) {
            console.log('❌ Cannot build hotel - other properties need at least 4 houses:', {
                groupProperties: groupProperties.map(p => ({ name: p.name, houses: p.houses }))
            });
            return false;
        }

        // Проверяем наличие денег
        const hotelPrice = monopolyGroup.hotelPrice;
        return player.money >= hotelPrice;
    },

    // Строит отель на свойстве
    buildHotel: (propertyId: number) => {
        const timestamp = Date.now();
        const state = get();

        console.log('🏨 Building hotel on property:', propertyId);

        // НОВАЯ ПРОВЕРКА: уже строил в этом ходу?
        if (state.hasBuiltThisTurn) {
            console.log('❌ Already built this turn');
            addImportantLog(state, `❌ ${state.players[state.currentPlayer].name} can only build once per turn!`);
            return;
        }

        if (!get().canBuildHotel(propertyId)) {
            console.log('❌ Cannot build hotel');
            return;
        }

        set(state => {
            const newProperties = [...state.properties];
            const newPlayers = [...state.players];
            const property = newProperties[propertyId];
            const player = newPlayers[property.owner!];
            const monopolyGroup = MONOPOLY_GROUPS.find(g => g.name === property.group)!;

            // Строим отель (заменяем 4 дома на отель)
            property.houses = 5; // 5 означает отель
            player.money -= monopolyGroup.hotelPrice;

            console.log(`🏨 Built hotel on ${property.name}`);
            addImportantLog(state, `🏨 ${player.name} built a hotel on ${property.name} for $${monopolyGroup.hotelPrice}`);

            return {
                ...state,
                properties: newProperties,
                players: newPlayers,
                hasBuiltThisTurn: true,  // ОТМЕЧАЕМ ЧТО УЖЕ СТРОИЛ
                lastActionTimestamp: timestamp
            };
        });
    },


    // Вычисляет текущую ренту для свойства
    getPropertyRent: (propertyId: number) => {
        const { properties } = get();
        const property = properties[propertyId];

        if (!property || property.owner === null) return 0;

        switch (property.type) {
            case 'property': {
                const hasMonopoly = get().hasMonopoly(property.owner, property.group);

                console.log(`Rent calculation for ${property.name}:`, {
                    houses: property.houses,
                    hasMonopoly,
                    rentArray: property.rent
                });

                if (property.houses === 0) {
                    // Без домов - базовая рента или удвоенная при монополии
                    return hasMonopoly ? property.rent[1] : property.rent[0];
                } else if (property.houses === 5) {
                    // Отель - максимальная рента
                    return property.rent[5] || property.rent[property.rent.length - 1];
                } else {
                    // Дома - рента зависит от количества домов
                    return property.rent[property.houses + 1] || property.rent[property.rent.length - 1];
                }
            }
            case 'railroad': {
                const railroadsOwned = properties
                    .filter(p => p.type === 'railroad' && p.owner === property.owner)
                    .length;
                return property.rent[railroadsOwned - 1] || 0;
            }
            case 'utility': {
                const utilitiesOwned = properties
                    .filter(p => p.type === 'utility' && p.owner === property.owner)
                    .length;
                const [dice1, dice2] = get().lastRoll;
                const multiplier = utilitiesOwned === 1 ? 4 : 10;
                return (dice1 + dice2) * multiplier;
            }
            default:
                return 0;
        }
    },

    drawCard: (type: 'chance' | 'community') => {
        const cards = type === 'chance' ? get().chanceCards : get().communityChestCards;
        const card = cards[0];

        // Перемещаем карту в конец колоды
        set(state => ({
            [type === 'chance' ? 'chanceCards' : 'communityChestCards']: [
                ...cards.slice(1),
                cards[0]
            ],
            currentCard: card
        }));

        addImportantLog(get(), `📜 ${get().getCurrentPlayer().name} drew a card: ${card.title}`);
    },

    closeCardModal: () => {
        const currentCard = get().currentCard;
        if (currentCard) {
            get().executeCardAction(currentCard);
            set({ currentCard: null });
        }
    },

    executeCardAction: (card: Card) => {
        const state = get();
        const currentPlayer = state.getCurrentPlayer();
        const newPlayers = [...state.players];
        const player = { ...currentPlayer };

        switch (card.action) {
            case 'move': {
                if (card.position !== undefined) {
                    const oldPosition = player.position;
                    const newPosition = card.position;

                    // Если новая позиция находится до текущей, значит мы проходим через GO
                    if (newPosition < oldPosition) {
                        player.money += 200;
                        addImportantLog(state, `🚀 ${player.name} passed START! Collected $200 BONK!`);
                    }

                    // Перемещаем игрока на новую позицию
                    const spacesToMove = (newPosition - oldPosition + 40) % 40;
                    get().movePlayer(state.currentPlayer, spacesToMove);
                }
                break;
            }

            case 'move_nearest': {
                if (card.nearestType) {
                    const currentPos = player.position;
                    let nearestPos = -1;
                    let minDistance = 40;

                    // Ищем ближайшую позицию нужного типа
                    state.properties.forEach((prop, index) => {
                        if (prop.type === card.nearestType) {
                            const distance = (index - currentPos + 40) % 40;
                            if (distance < minDistance && distance > 0) {
                                minDistance = distance;
                                nearestPos = index;
                            }
                        }
                    });

                    if (nearestPos !== -1) {
                        // Перемещаем игрока
                        const spacesToMove = (nearestPos - currentPos + 40) % 40;
                        get().movePlayer(state.currentPlayer, spacesToMove);

                        // Если поле принадлежит другому игроку, платим двойную ренту
                        const property = state.properties[nearestPos];
                        if (property.owner !== null && property.owner !== state.currentPlayer && !property.mortgage) {
                            const rent = state.getPropertyRent(nearestPos) * 2; // Двойная рента для карточек
                            player.money -= rent;
                            const owner = { ...newPlayers[property.owner], money: newPlayers[property.owner].money + rent };
                            newPlayers[property.owner] = owner;
                            newPlayers[state.currentPlayer] = player;
                            addImportantLog(state, `💸 ${player.name} paid $${rent} (double) rent to ${owner.name}!`);
                            set({ players: newPlayers });
                        }
                    }
                }
                break;
            }

            case 'pay': {
                if (card.amount) {
                    player.money -= card.amount;
                    addImportantLog(state, `💸 ${player.name} paid $${card.amount} to the bank`);
                    newPlayers[state.currentPlayer] = player;
                    set({ players: newPlayers });
                }
                break;
            }

            case 'collect': {
                if (card.amount) {
                    player.money += card.amount;
                    addImportantLog(state, `💰 ${player.name} collected $${card.amount} from the bank`);
                    newPlayers[state.currentPlayer] = player;
                    set({ players: newPlayers });
                }
                break;
            }

            case 'collect_from_players': {
                if (card.amount) {
                    let totalCollected = 0;
                    newPlayers.forEach((p, index) => {
                        if (index !== state.currentPlayer) {
                            const amount = card.amount || 0;
                            newPlayers[index] = { ...p, money: p.money - amount };
                            totalCollected += amount;
                        }
                    });
                    player.money += totalCollected;
                    addImportantLog(state, `💰 ${player.name} collected $${card.amount} from each player (total: $${totalCollected})`);
                    newPlayers[state.currentPlayer] = player;
                    set({ players: newPlayers });
                }
                break;
            }

            case 'repairs': {
                if (card.houseRepairCost && card.hotelRepairCost) {
                    let totalCost = 0;
                    player.properties.forEach(propId => {
                        const property = state.properties[propId];
                        if (property.houses === 5) { // Отель
                            totalCost += card.hotelRepairCost!;
                        } else {
                            totalCost += property.houses * card.houseRepairCost!;
                        }
                    });

                    if (totalCost > 0) {
                        player.money -= totalCost;
                        addImportantLog(state, `🏠 ${player.name} paid $${totalCost} for repairs`);
                        newPlayers[state.currentPlayer] = player;
                        set({ players: newPlayers });
                    }
                }
                break;
            }

            case 'jail': {
                player.position = 10;
                player.inJail = true;
                player.jailTurns = 0;
                addImportantLog(state, `👮 ${player.name} was sent to Jail!`);
                newPlayers[state.currentPlayer] = player;
                set({ players: newPlayers });
                break;
            }

            case 'jail_free': {
                player.jailFreeCards++;
                addImportantLog(state, `🎟️ ${player.name} received a Get Out of Jail Free card`);
                newPlayers[state.currentPlayer] = player;
                set({ players: newPlayers });
                break;
            }

            case 'move_back': {
                get().movePlayer(state.currentPlayer, 37); // 40 - 3 = 37 (движение на 3 поля назад)
                break;
            }
        }
        get().saveGameState();
    }
    }
});