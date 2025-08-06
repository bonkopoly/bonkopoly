import React, { useEffect, useRef } from 'react';
import { useGameStore } from '@/hooks/useGameStore';
import styles from './GameLog.module.css';

const GameLog: React.FC = () => {
    const gameLog = useGameStore(state => state.gameLog);
    const logRef = useRef<HTMLDivElement>(null);

    // Автоматическая прокрутка к последнему сообщению
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [gameLog]);

    return (
        <div className={styles.gameLog}>
            <h2>Game Log</h2>
            <div className={styles.log} ref={logRef}>
                {gameLog.map((message, index) => (
                    <div key={index} className={styles.logMessage}>
                        {message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GameLog;
