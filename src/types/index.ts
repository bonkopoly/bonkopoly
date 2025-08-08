export type PropertyGroup = 'brown' | 'lightblue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'darkblue' | 'railroad' | 'utility' | 'special';
export type PropertyType = 'property' | 'railroad' | 'utility' | 'special' | 'chance' | 'community' | 'tax';

export interface Player {
  id: number;
  name: string;
  money: number;
  position: number;
  properties: number[];
  icon: string;
  color: string;
  inJail: boolean;
  jailTurns: number;
  jailFreeCards: number;
  userId: string
  bankrupt?: boolean;
}

export interface Property {
  id: number;
  name: string;
  type: PropertyType;
  price: number;
  color: string;
  group: PropertyGroup;
  owner: number | null;
  houses: number;      // 0-4 дома или 5 для отеля
  housePrice: number;  // Цена одного дома/отеля
  rent: number[];      // [базовая, с монополией, 1 дом, 2 дома, 3 дома, отель]
  mortgage: boolean;   // Заложена ли собственность
  mortgageValue: number; // Стоимость заложения
  icon?: string;
  tax?: number;
  description?: string;
  hotels?: number;

}

export interface MonopolyGroup {
  name: PropertyGroup;
  color: string;
  size: number;        // Количество свойств в группе
  properties: number[]; // ID свойств в группе
  maxHouses: number;   // Максимальное количество домов на одном свойстве (обычно 4)
  housePrice: number;  // Цена дома для этой группы
  hotelPrice: number;  // Цена отеля для этой группы
}

export interface GameRules {
  maxHousesPerProperty: number;    // Обычно 4
  maxHotelsPerProperty: number;    // Обычно 1
  totalHousesInGame: number;       // Обычно 32
  totalHotelsInGame: number;       // Обычно 12
  mortgageInterestRate: number;    // Процент при выкупе заложенной собственности (обычно 10%)
  jailFine: number;                // Штраф за выход из тюрьмы (обычно $50)
  passingGoBonus: number;         // Бонус за прохождение через GO (обычно $200)
  landingOnGoBonus: number;       // Дополнительный бонус за точное попадание на GO (обычно $200)

}

// НОВЫЙ ИНТЕРФЕЙС для аукциона
export interface PropertyAuction {
  propertyId: number | null;
  currentBid: number;
  currentBidder: number | null;
  timeLeft: number;
  participants: number[];
}

export interface Debt {
  id: string;
  debtorId: number;
  creditorId: number | 'bank'; // может быть банк или другой игрок
  amount: number;
  reason: string;
  timestamp: number;
}


export interface GameState {
  players: Player[];
  properties: Property[];
  currentPlayer: number;
  gamePhase: GamePhase;
  diceRolled: boolean;
  lastRoll: [number, number];
  doubles: number;
  gameLog: GameLogEntry[];
  selectedProperty: number | null;
  gameStarted: boolean;
}

export type GameEvent =
  | 'property_purchased'
  | 'property_mortgaged'
  | 'property_unmortgaged'
  | 'building_built'
  | 'building_sold'
  | 'auction_started'
  | 'auction_bid_placed'
  | 'auction_ended'
  | 'player_bankrupt'
  | 'trade_completed'
  | 'rent_paid';

export interface GameEventLog {
  id: string;
  type: GameEvent;
  playerId: number;
  details: any;
  timestamp: number;
  message: string;
}

export type GamePhase =
  | 'setup'
  | 'rolling'
  | 'moving'
  | 'action'
  | 'trading'
  | 'ended';

export interface GameLogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  playerId?: number;
}

export interface Card {
  id: number;
  type: 'chance' | 'community';
  title: string;
  description: string;
  action: CardAction;
}

export interface CardAction {
  type: 'move' | 'money' | 'jail' | 'property' | 'special';
  value?: number;
  target?: number;
  description: string;
}