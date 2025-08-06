import { Card } from '@/types/cards';

export const CHANCE_CARDS: Card[] = [
    {
        id: 1,
        type: 'chance',
        title: 'Advance to GO',
        description: 'Advance to GO (Collect $200)',
        action: 'move',
        position: 0
    },
    {
        id: 2,
        type: 'chance',
        title: 'Advance to BTC',
        description: 'Advance to BTC. If you pass GO, collect $200',
        action: 'move',
        position: 37
    },
    {
        id: 3,
        type: 'chance',
        title: 'Advance to BONK',
        description: 'Advance to BONK. If you pass GO, collect $200',
        action: 'move',
        position: 1
    },
    {
        id: 4,
        type: 'chance',
        title: 'Advance to nearest Railroad',
        description: 'Advance to the nearest Railroad. If unowned, you may buy it. If owned, pay owner twice the rental.',
        action: 'move_nearest',
        nearestType: 'railroad'
    },
    {
        id: 5,
        type: 'chance',
        title: 'Advance to nearest Railroad',
        description: 'Advance to the nearest Railroad. If unowned, you may buy it. If owned, pay owner twice the rental.',
        action: 'move_nearest',
        nearestType: 'railroad'
    },
    {
        id: 6,
        type: 'chance',
        title: 'Advance to nearest Utility',
        description: 'Advance to the nearest Utility. If unowned, you may buy it. If owned, throw dice and pay owner 10 times the amount thrown.',
        action: 'move_nearest',
        nearestType: 'utility'
    },
    {
        id: 7,
        type: 'chance',
        title: 'Bank pays you dividend',
        description: 'Bank pays you dividend of $50',
        action: 'collect',
        amount: 50
    },
    {
        id: 8,
        type: 'chance',
        title: 'Get out of Jail Free',
        description: 'This card may be kept until needed or sold/traded',
        action: 'jail_free'
    },
    {
        id: 9,
        type: 'chance',
        title: 'Go Back 3 Spaces',
        description: 'Go Back Three Spaces',
        action: 'move_back'
    },
    {
        id: 10,
        type: 'chance',
        title: 'Go to Jail',
        description: 'Go directly to Jail. Do not pass GO, do not collect $200',
        action: 'jail'
    },
    {
        id: 11,
        type: 'chance',
        title: 'Make general repairs',
        description: 'Make general repairs on all your property. For each house pay $25. For each hotel pay $100',
        action: 'repairs',
        houseRepairCost: 25,
        hotelRepairCost: 100
    },
    {
        id: 12,
        type: 'chance',
        title: 'Speeding fine',
        description: 'Pay speeding fine of $15',
        action: 'pay',
        amount: 15
    },
    {
        id: 13,
        type: 'chance',
        title: 'Take a trip to Reading Railroad',
        description: 'Take a trip to Reading Railroad. If you pass GO, collect $200',
        action: 'move',
        position: 5
    },
    {
        id: 14,
        type: 'chance',
        title: 'Pay each player',
        description: 'You have been elected Chairman of the Board. Pay each player $50',
        action: 'pay',
        amount: 50
    },
    {
        id: 15,
        type: 'chance',
        title: 'Building loan matures',
        description: 'Your building loan matures. Collect $150',
        action: 'collect',
        amount: 150
    }
];

export const COMMUNITY_CHEST_CARDS: Card[] = [
    {
        id: 1,
        type: 'community',
        title: 'Advance to GO',
        description: 'Advance to GO (Collect $200)',
        action: 'move',
        position: 0
    },
    {
        id: 2,
        type: 'community',
        title: 'Bank error in your favor',
        description: 'Bank error in your favor. Collect $200',
        action: 'collect',
        amount: 200
    },
    {
        id: 3,
        type: 'community',
        title: 'Doctor\'s fee',
        description: 'Doctor\'s fee. Pay $50',
        action: 'pay',
        amount: 50
    },
    {
        id: 4,
        type: 'community',
        title: 'Get out of Jail Free',
        description: 'This card may be kept until needed or sold/traded',
        action: 'jail_free'
    },
    {
        id: 5,
        type: 'community',
        title: 'Go to Jail',
        description: 'Go directly to Jail. Do not pass GO, do not collect $200',
        action: 'jail'
    },
    {
        id: 6,
        type: 'community',
        title: 'Holiday fund matures',
        description: 'Holiday fund matures. Receive $100',
        action: 'collect',
        amount: 100
    },
    {
        id: 7,
        type: 'community',
        title: 'Income tax refund',
        description: 'Income tax refund. Collect $20',
        action: 'collect',
        amount: 20
    },
    {
        id: 8,
        type: 'community',
        title: 'Life insurance matures',
        description: 'Life insurance matures. Collect $100',
        action: 'collect',
        amount: 100
    },
    {
        id: 9,
        type: 'community',
        title: 'Pay hospital fees',
        description: 'Pay hospital fees of $100',
        action: 'pay',
        amount: 100
    },
    {
        id: 10,
        type: 'community',
        title: 'Pay school fees',
        description: 'Pay school fees of $50',
        action: 'pay',
        amount: 50
    },
    {
        id: 11,
        type: 'community',
        title: 'Receive consultancy fee',
        description: 'Receive $25 consultancy fee',
        action: 'collect',
        amount: 25
    },
    {
        id: 12,
        type: 'community',
        title: 'Street repairs',
        description: 'You are assessed for street repairs. $40 per house. $115 per hotel',
        action: 'repairs',
        houseRepairCost: 40,
        hotelRepairCost: 115
    },
    {
        id: 13,
        type: 'community',
        title: 'You won second prize',
        description: 'You have won second prize in a beauty contest. Collect $10',
        action: 'collect',
        amount: 10
    },
    {
        id: 14,
        type: 'community',
        title: 'You inherit',
        description: 'You inherit $100',
        action: 'collect',
        amount: 100
    },
    {
        id: 15,
        type: 'community',
        title: 'From sale of stock',
        description: 'From sale of stock you get $50',
        action: 'collect',
        amount: 50
    }
]; 