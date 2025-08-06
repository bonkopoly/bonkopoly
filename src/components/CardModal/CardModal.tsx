import React from 'react';
import { Card } from '@/types/cards';
import styles from './CardModal.module.css';

interface CardModalProps {
    card: Card | null;
    onClose: () => void;
}

export const CardModal: React.FC<CardModalProps> = ({ card, onClose }) => {
    if (!card) return null;

    const getCardIcon = (type: 'chance' | 'community') => {
        return type === 'chance' ? '❓' : '💰';
    };

    const getActionDescription = (card: Card) => {
        switch (card.action) {
            case 'move':
                return 'You will be moved to a new position';
            case 'move_nearest':
                return `You will be moved to the nearest ${card.nearestType}`;
            case 'pay':
                return `You will pay $${card.amount} to the bank`;
            case 'collect':
                return `You will collect $${card.amount} from the bank`;
            case 'collect_from_players':
                return `You will collect $${card.amount} from each player`;
            case 'repairs':
                return `You will pay $${card.houseRepairCost} per house and $${card.hotelRepairCost} per hotel`;
            case 'jail':
                return 'You will be sent to jail';
            case 'jail_free':
                return 'You can keep this card until needed';
            case 'move_back':
                return 'You will move back 3 spaces';
            default:
                return '';
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardType}>
                            {getCardIcon(card.type)} {card.type === 'chance' ? 'Chance' : ' Chest'}
                        </span>
                        <button className={styles.closeButton} onClick={onClose}>×</button>
                    </div>
                    <div className={styles.cardContent}>
                        <h2 className={styles.cardTitle}>{card.title}</h2>
                        <p className={styles.cardDescription}>{card.description}</p>
                        <p className={styles.actionDescription}>{getActionDescription(card)}</p>
                    </div>
                    <div className={styles.cardFooter}>
                        <button className={styles.okButton} onClick={onClose}>OK</button>
                    </div>
                </div>
            </div>
        </div>
    );
}; 