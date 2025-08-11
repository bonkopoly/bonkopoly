import React from 'react';
import { useGameStore } from '@/hooks/useGameStore';

const Stats: React.FC = () => {
    const { players, properties } = useGameStore();

    // Подсчет общей статистики
    const totalMoney = players.reduce((sum, player) => sum + player.money, 0);
    const ownedProperties = properties.filter(prop => prop.owner !== null).length;
    const totalProperties = properties.filter(prop =>
        prop.type === 'property' || prop.type === 'railroad' || prop.type === 'utility'
    ).length;

    // Подсчет статистики по домам и отелям
    const totalHouses = properties.reduce((sum, prop) => sum + (prop.houses || 0), 0);
    const totalHotels = properties.reduce((sum, prop) => sum + (prop.hotels || 0), 0);

    // Самый богатый и самый бедный игрок
    const activePlayers = players.filter(p => !p.bankrupt);
    const bankruptPlayers = players.filter(p => p.bankrupt);
    
    const richestPlayer = activePlayers.length > 0 ? [...activePlayers].sort((a, b) => b.money - a.money)[0] : players[0];
    const poorestPlayer = activePlayers.length > 0 ? [...activePlayers].sort((a, b) => a.money - b.money)[0] : players[0];

    // Форматирование денег
    const formatMoney = (amount: number) => {
        if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(1)}k`;
        }
        return `$${amount}`;
    };

    // Компонент цветного маркера игрока
    const PlayerDot: React.FC<{ color: string }> = ({ color }) => (
        <div
            className="w-2.5 h-2.5 rounded-full border border-white/50"
            style={{ backgroundColor: color }}
        />
    );

    return (
        <div className="bg-gray-900/50 rounded-lg p-3 space-y-2">
            <div className="text-emerald-500 text-sm font-bold mb-2">📊 STATS</div>

            {/* Основная статистика */}
            <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                    <div className="text-gray-400">Properties</div>
                    <div className="font-mono text-white">
                        {ownedProperties}/{totalProperties}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="text-gray-400">Total Money</div>
                    <div className="font-mono text-white">{formatMoney(totalMoney)}</div>
                </div>
            </div>

            {/* Статистика строений */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-700">
                <div className="space-y-1">
                    <div className="text-gray-400">Houses</div>
                    <div className="font-mono text-white">🏠 {totalHouses}</div>
                </div>
                <div className="space-y-1">
                    <div className="text-gray-400">Hotels</div>
                    <div className="font-mono text-white">🏨 {totalHotels}</div>
                </div>
            </div>

            {/* Рекорды */}
            <div className="text-xs pt-2 border-t border-gray-700">
                <div className="space-y-2">
                    <div>
                        <div className="text-gray-400">Richest</div>
                        <div className="font-mono text-white flex items-center gap-2">
                            <PlayerDot color={richestPlayer.color} />
                            {richestPlayer.name}
                            <span className="text-emerald-500">{formatMoney(richestPlayer.money)}</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-400">Poorest</div>
                        <div className="font-mono text-white flex items-center gap-2">
                            <PlayerDot color={poorestPlayer.color} />
                            {poorestPlayer.name}
                            <span className="text-red-500">{formatMoney(poorestPlayer.money)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Банкроты */}
            {bankruptPlayers.length > 0 && (
                <div className="text-xs pt-2 border-t border-gray-700">
                    <div className="text-gray-400 mb-2">Bankrupt Players</div>
                    <div className="space-y-1">
                        {bankruptPlayers.map(player => (
                            <div key={player.id} className="font-mono text-red-400 flex items-center gap-2">
                                <PlayerDot color={player.color} />
                                {player.name}
                                <span className="text-red-600">💀 OUT</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stats; 