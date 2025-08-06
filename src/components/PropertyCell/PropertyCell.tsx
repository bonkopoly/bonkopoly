import React from 'react';
import styles from './PropertyCell.module.css';
import type { Property, Player } from '@/types';
import { useGameStore } from '@/hooks/useGameStore';

interface PropertyCellProps {
    property: Property;
    position: string;
    players: Player[];
    onClick: () => void;
}

// Компонент для отображения домов на свойстве
const PropertyHouses: React.FC<{ 
    houses: number; 
    position: string;
    isVertical: boolean;
}> = ({ houses, position, isVertical }) => {
    if (houses === 0) return null;
    
    // Определяем позицию индикатора
    const getPositionClasses = () => {
        switch (position) {
            case 'top':
                return 'top-0 right-0 rounded-bl-md';
            case 'right':
                return 'bottom-0 right-0 rounded-tl-md';
            case 'bottom':
                return 'bottom-0 left-0 rounded-tr-md';
            case 'left':
                return 'top-0 left-0 rounded-br-md';
            default:
                return 'top-0 right-0 rounded-bl-md';
        }
    };
    
    if (houses === 5) {
        // Отель
        return (
            <div className={`absolute bg-red-600 text-white text-[8px] px-1 py-0.5 font-bold z-20 ${getPositionClasses()}`}>
                🏨
            </div>
        );
    }
    
    // Дома (1-4) - используем звездочки
    const houseStars = '⭐'.repeat(Math.min(houses, 4));
    
    return (
        <div className={`absolute bg-green-600 text-white text-[7px] px-1 py-0.5 font-bold z-20 ${getPositionClasses()}`}>
            {houseStars}
        </div>
    );
};

const PropertyCell: React.FC<PropertyCellProps> = ({ property, position, players, onClick }) => {
    const isVertical = position === 'left' || position === 'right';
    const isProperty = property.type === 'property';
    const isUtilityOrRailroad = property.type === 'utility' || property.type === 'railroad';

    // Получаем функции из store для вычисления ренты
    const { getPropertyRent, hasMonopoly } = useGameStore();

    // Получаем цвет владельца, если есть
    const ownerColor = property.owner !== null ? players[property.owner]?.color : null;

    // Вычисляем текущую ренту или показываем цену покупки
    const getDisplayPrice = () => {
        // Если свойство никому не принадлежит - показываем цену покупки
        if (property.owner === null) {
            return `$${property.price}`;
        }
        
        // Если принадлежит кому-то - показываем текущую ренту
        const currentRent = getPropertyRent(property.id);
        return `$${currentRent}`;
    };

    // Определяем цвет ценника в зависимости от статуса
    const getPriceBackgroundColor = () => {
        // ВСЕГДА используем цвет группы свойства
        return property.color || '#666';
    };

    // Функция для получения имени файла изображения
    const getImageName = () => {
        if (isProperty || isUtilityOrRailroad) {
            return property.name.toLowerCase().replace(/\s+/g, '-');
        }
        return null;
    };

    // Цветная полоса группы
    const groupBar = property.type === 'property' && (
        <div
            className={`absolute ${isVertical ? 'h-full w-1' : 'w-full h-1'} ${
                position === 'left' ? 'left-0' :
                position === 'right' ? 'right-0' :
                position === 'top' ? 'top-0' :
                'bottom-0'
            }`}
            style={{ backgroundColor: property.color }}
        />
    );

    // Фон владельца
    const ownerBackground = ownerColor && (
        <div 
            className="absolute inset-0 opacity-75"
            style={{ 
                backgroundColor: ownerColor,
                zIndex: 1
            }} 
        />
    );

    return (
        <div className="w-full h-full p-px">
            <div
                className="w-full h-full relative bg-white border border-gray-400 flex flex-col items-center justify-center cursor-pointer hover:shadow-sm transition-shadow duration-200 overflow-visible"
                onClick={onClick}
            >
                {ownerBackground}
                {groupBar}
                
                {/* ДОБАВЛЯЕМ ИНДИКАТОР ДОМОВ */}
                {isProperty && property.houses > 0 && (
                    <PropertyHouses 
                        houses={property.houses} 
                        position={position}
                        isVertical={isVertical}
                    />
                )}
                
                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-2">
                    {isProperty || isUtilityOrRailroad ? (
                        <>
                            <div className={styles.propertyIcon}>
                                {getImageName() && (
                                    <img
                                        src={`/images/tokens/${getImageName()}.png`}
                                        alt={property.name}
                                        onError={(e) => {
                                            // Если изображение не загрузилось, показываем эмодзи
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.parentElement!.innerHTML = property.icon || '💰';
                                        }}
                                    />
                                )}
                            </div>
                            <div className="text-[8px] font-bold leading-tight text-center mt-1">
                                {property.name}
                            </div>
                            
                            {/* ДОБАВЛЯЕМ ТЕКСТОВЫЙ ИНДИКАТОР ДОМОВ ПОД НАЗВАНИЕМ */}
                            {isProperty && property.houses > 0 && (
                                <div className="text-[6px] font-bold text-center mt-0.5">
                                    {property.houses === 5 ? (
                                        <span className="text-red-600">🏨 Hotel</span>
                                    ) : (
                                        <span className="text-green-600">{property.houses}H</span>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="text-2xl mb-1">
                                {property.icon}
                            </div>
                            <div className="text-xs leading-tight font-bold text-center">
                                {property.name}
                            </div>
                            {property.description && (
                                <div className="text-[8px] text-gray-600 mt-0.5 text-center">
                                    {property.description}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Динамический ценник - показывает цену покупки или текущую ренту */}
                {property.price > 0 && (
                    <div
                        className="absolute z-30 flex items-center justify-center"
                        style={{
                            backgroundColor: getPriceBackgroundColor(),
                            width: isVertical ? '16px' : 'calc(100% - 2px)',
                            height: isVertical ? 'calc(100% - 2px)' : '16px',
                            top: position === 'top' ? '-16px' : 
                                position === 'left' || position === 'right' ? '1px' : 'auto',
                            bottom: position === 'bottom' ? '-16px' : 'auto',
                            left: position === 'left' ? '-16px' : 
                                position === 'right' ? 'auto' : '1px',
                            right: position === 'right' ? '-16px' : 'auto',
                            writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
                            transform: position === 'left' ? 'rotate(180deg)' : 'none',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}
                    >
                        <span 
                            className="text-white text-[10px] font-bold"
                            style={{
                                letterSpacing: '0.5px',
                                textShadow: '0 0 2px #000, 0 0 2px #000, 0 0 2px #000, 0 0 2px #000', // Черная обводка
                                WebkitTextStroke: '0.5px black' // Дополнительная обводка для лучшего эффекта
                            }}
                        >
                            {getDisplayPrice()}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PropertyCell;