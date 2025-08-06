export type CardActionType = 
  | 'move' // Move to specific position
  | 'move_nearest' // Move to nearest type (railroad/utility)
  | 'pay' // Pay money to bank
  | 'collect' // Collect money from bank
  | 'collect_from_players' // Collect money from each player
  | 'repairs' // Pay for repairs (per house/hotel)
  | 'jail' // Go to jail
  | 'jail_free' // Get out of jail free card
  | 'move_back'; // Move back 3 spaces

export interface Card {
  id: number;
  type: 'chance' | 'community';
  title: string;
  description: string;
  action: CardActionType;
  amount?: number; // Amount to pay/collect
  position?: number; // Position to move to
  nearestType?: 'railroad' | 'utility'; // Type of property to move to
  houseRepairCost?: number; // Cost per house
  hotelRepairCost?: number; // Cost per hotel
}

// Example card:
// {
//   id: 1,
//   type: 'chance',
//   title: 'Advance to GO',
//   description: 'Advance to GO (Collect $200)',
//   action: 'move',
//   position: 0
// } 