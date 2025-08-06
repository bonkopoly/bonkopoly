import React, { useState } from 'react';
import { useGameStore } from '../../hooks/useGameStore'
import type { Property, Player } from '@/types';
import PlayerMarker from './PlayerMarker';
import PropertyCell from '../PropertyCell/PropertyCell';

// Компонент для угловых полей
interface CornerFieldProps {
    property: Property;
    className?: string;
    getPlayersAtPosition: (position: number) => Player[];
    selectProperty: (propertyId: number) => void;
}

interface GameBoardProps {
    onPropertySelect?: (property: Property) => void;
}

const CornerField: React.FC<CornerFieldProps> = ({ property, className = '', getPlayersAtPosition, selectProperty }) => {
    const playersHere = getPlayersAtPosition(property.id);
    return (
        <div
            className={`aspect-square bg-gradient-to-br from-white to-gray-50 border-2 border-gray-800 cursor-pointer hover:shadow-lg transition-all duration-300 relative group ${className}`}
            onClick={() => selectProperty(property.id)}
        >
            <div className="w-full h-full flex flex-col justify-center items-center text-center text-gray-900 font-bold p-1">
                {/* Иконка */}
                <div className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-300">
                    {property.icon}
                </div>
                {/* Название */}
                <div className="text-xs leading-tight font-bold uppercase tracking-wide">
                    {property.name}
                </div>
                {/* Описание */}
                <div className="text-xs text-gray-600 mt-0.5 font-normal leading-tight">
                    {property.description}
                </div>
            </div>
            {/* Игроки на угловом поле */}
            {playersHere.length > 0 && (
                <div className="absolute bottom-1 right-1 flex gap-1">
                    {playersHere.map((player: Player) => (
                        <div
                            key={player.id}
                            className="w-3 h-3 rounded-full border-2 border-white shadow"
                            style={{ backgroundColor: player.color }}
                            title={player.name}
                        />
                    ))}
                </div>
            )}
            {/* Спец. цветные фоны для углов */}
            {property.id === 0 && (
                <div className="absolute inset-0 bg-green-200/20 pointer-events-none" />
            )}
            {property.id === 10 && (
                <div className="absolute inset-0 bg-orange-200/20 pointer-events-none" />
            )}
            {property.id === 20 && (
                <div className="absolute inset-0 bg-blue-200/20 pointer-events-none" />
            )}
            {property.id === 30 && (
                <div className="absolute inset-0 bg-red-200/20 pointer-events-none" />
            )}
            {/* Эффект наведения */}
            <div className="absolute inset-0 bg-yellow-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>
    );
};

const GameBoard: React.FC<GameBoardProps> = ({ onPropertySelect }) => {
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

    // Получаем данные из стора
    const { players, properties, selectProperty: storeSelectProperty } = useGameStore();

    const getPlayersAtPosition = (position: number): Player[] => {
        return players.filter(player => player.position === position);
    };

    const selectProperty = (propertyId: number) => {
        const property = properties.find(p => p.id === propertyId);
        if (property) {
            setSelectedProperty(property);
            storeSelectProperty(propertyId);
            if (onPropertySelect) {
                onPropertySelect(property);
            }
        }
    };

    return (
        <div className="w-full h-full max-w-none mx-auto">
            <div className="aspect-square w-full bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl border-4 border-gray-800 shadow-2xl relative overflow-visible">
                {/* Декоративный фон */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400 rounded-full animate-pulse" />
                    <div className="absolute top-20 right-20 w-16 h-16 bg-blue-400 rounded-full animate-bounce" />
                    <div className="absolute bottom-20 left-20 w-12 h-12 bg-red-400 rounded-full animate-spin" />
                    <div className="absolute bottom-10 right-10 w-24 h-24 bg-purple-400 rounded-full animate-ping" />
                </div>

                {/* Игровое поле - GRID */}
                <div className="grid grid-cols-11 grid-rows-11 w-full h-full relative p-1">
                    {/* УГЛОВЫЕ ПОЛЯ */}
                    <CornerField property={properties[20]} className="col-start-1 row-start-1 rounded-tl-xl" getPlayersAtPosition={getPlayersAtPosition} selectProperty={selectProperty} />
                    <CornerField property={properties[30]} className="col-start-11 row-start-1 rounded-tr-xl" getPlayersAtPosition={getPlayersAtPosition} selectProperty={selectProperty} />
                    <CornerField property={properties[10]} className="col-start-1 row-start-11 rounded-bl-xl" getPlayersAtPosition={getPlayersAtPosition} selectProperty={selectProperty} />
                    <CornerField property={properties[0]} className="col-start-11 row-start-11 rounded-br-xl" getPlayersAtPosition={getPlayersAtPosition} selectProperty={selectProperty} />

                    {/* ВЕРХНЯЯ СТОРОНА (21-29) */}
                    {properties.slice(21, 30).map((property, index) => (
                        <div key={property.id} className={`col-start-${index + 2} row-start-1`}>
                            <PropertyCell
                                property={property}
                                position="top"
                                players={players}
                                onClick={() => selectProperty(property.id)}
                            />
                        </div>
                    ))}

                    {/* ПРАВАЯ СТОРОНА (31-39) */}
                    {properties.slice(31, 40).map((property, index) => (
                        <div key={property.id} className={`col-start-11 row-start-${index + 2}`}>
                            <PropertyCell
                                property={property}
                                position="right"
                                players={players}
                                onClick={() => selectProperty(property.id)}
                            />
                        </div>
                    ))}

                    {/* НИЖНЯЯ СТОРОНА (1-9) */}
                    {properties.slice(1, 10).map((property, index) => (
                        <div key={property.id} className={`col-start-${10 - index} row-start-11`}>
                            <PropertyCell
                                property={property}
                                position="bottom"
                                players={players}
                                onClick={() => selectProperty(property.id)}
                            />
                        </div>
                    ))}

                    {/* ЛЕВАЯ СТОРОНА (11-19) */}
                    {properties.slice(11, 20).map((property, index) => (
                        <div key={property.id} className={`col-start-1 row-start-${10 - index}`}>
                            <PropertyCell
                                property={property}
                                position="left"
                                players={players}
                                onClick={() => selectProperty(property.id)}
                            />
                        </div>
                    ))}

                    {/* ЦЕНТР ДОСКИ */}
                    <div className="col-start-3 col-end-10 row-start-3 row-end-10 bg-gradient-to-br from-emerald-50 to-green-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <img
                                src="/images/bonkopoly.png"
                                alt="BONKOPOLY"
                                className="transform -rotate-45 shadow-2xl"
                                style={{
                                    width: '90%',
                                    height: 'auto',
                                    maxWidth: '500px',
                                    filter: 'drop-shadow(6px 6px 12px rgba(0,0,0,0.4))'
                                }}
                            />
                        </div>
                    </div>

                    {/* Маркеры игроков */}
                    {players.map((player) => (
                        <PlayerMarker key={player.id} player={player} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameBoard;