// src/components/GameBoard/PropertyCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Home, Train, Zap, HelpCircle, DollarSign } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import type { Property, Player } from '@/types';

interface PropertyCardProps {
    property: Property;
    position: 'corner' | 'top' | 'right' | 'bottom' | 'left';
    players?: Player[];
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, position, players = [] }) => {
    const { selectProperty } = useGameStore();

    const getPropertyIcon = (type: string) => {
        switch (type) {
            case 'property': return <Home className="w-4 h-4" />;
            case 'railroad': return <Train className="w-4 h-4" />;
            case 'utility': return <Zap className="w-4 h-4" />;
            case 'chance': return <HelpCircle className="w-4 h-4" />;
            case 'community': return <DollarSign className="w-4 h-4" />;
            default: return <Home className="w-4 h-4" />;
        }
    };

    const getSpecialIcon = (name: string) => {
        if (name.includes('START')) return '🏁';
        if (name.includes('JAIL')) return '🚔';
        if (name.includes('PARKING')) return '🅿️';
        if (name.includes('GO TO')) return '👮';
        return '🏢';
    };

    const handleClick = () => {
        selectProperty(property.id);
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full h-full rounded-lg flex flex-col items-center justify-center text-xs font-bold p-1 cursor-pointer transition-all duration-300 border-2 text-white relative"
            style={{ backgroundColor: property.color }}
            onClick={handleClick}
        >
            {/* Иконка */}
            <div className="text-lg mb-1">
                {property.type === 'special' ? getSpecialIcon(property.name) : getPropertyIcon(property.type)}
            </div>

            {/* Название */}
            <div className="text-center leading-tight">
                {property.name.split(' ').slice(0, 2).join(' ')}
            </div>

            {/* Цена */}
            {property.price > 0 && (
                <div className="text-green-300 text-xs mt-1">${property.price}</div>
            )}

            {/* Игроки */}
            {players.length > 0 && (
                <div className="absolute bottom-1 right-1 flex">
                    {players.slice(0, 2).map((player) => (
                        <span
                            key={player.id}
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: player.color }}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default PropertyCard;