import React from 'react';
import styles from './TokenIcon.module.css';

interface TokenIconProps {
    token: string;
    size?: 'small' | 'normal' | 'large';
}

export const TokenIcon: React.FC<TokenIconProps> = ({ token, size = 'normal' }) => {
    const tokenName = token.toLowerCase();
    
    return (
        <div className={`${styles.icon} ${styles[size]}`}>
            <img 
                src={`/images/tokens/${tokenName}.png`}
                alt={token}
                width="100%"
                height="100%"
                onError={(e) => {
                    // Если изображение не загрузилось, показываем текст
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.parentElement!.innerText = token;
                }}
            />
        </div>
    );
}; 