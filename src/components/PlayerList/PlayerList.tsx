import React from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import styles from './PlayerList.module.css';

const PlayerList: React.FC = () => {
    const players = useGameStore(state => state.players);
    const currentPlayer = useGameStore(state => state.currentPlayer);

    return (
        <div className={styles.playerList}>
            <h2>Players</h2>
            <div className={styles.list}>
                {players.map(player => (
                    <div 
                        key={player.id} 
                        className={`${styles.player} ${player.id === currentPlayer ? styles.active : ''}`}
                        style={{ borderColor: player.color }}
                    >
                        <div className={styles.playerInfo}>
                            <span className={styles.playerName}>{player.name}</span>
                            <span className={styles.playerMoney}>${player.money}</span>
                        </div>
                        {player.inJail && (
                            <div className={styles.jailStatus}>
                                🚔 In Jail ({player.jailTurns}/3 turns)
                            </div>
                        )}
                        {player.jailFreeCards > 0 && (
                            <div className={styles.jailCards}>
                                🎟️ Get Out of Jail Free: {player.jailFreeCards}
                            </div>
                        )}
                        {player.properties.length > 0 && (
                            <div className={styles.properties}>
                                Properties: {player.properties.length}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlayerList; 