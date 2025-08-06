import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';

const DiceDisplay: React.FC = () => {
  const { lastRoll } = useGameStore();

  const diceVariants = {
    rolling: {
      rotate: [0, 360, 720],
      scale: [1, 1.2, 1],
      transition: { duration: 0.5 }
    },
    idle: {
      rotate: 0,
      scale: 1
    }
  };

  return (
    <div className="flex justify-center space-x-4 mb-4">
      <motion.div
        variants={diceVariants}
        initial="idle"
        className="w-16 h-16 bg-gradient-to-br from-bonk-orange to-bonk-yellow rounded-xl flex items-center justify-center text-3xl font-black text-black shadow-lg"
        style={{ perspective: 1000 }}
      >
        {lastRoll[0]}
      </motion.div>
      <motion.div
        variants={diceVariants}
        initial="idle"
        className="w-16 h-16 bg-gradient-to-br from-bonk-orange to-bonk-yellow rounded-xl flex items-center justify-center text-3xl font-black text-black shadow-lg"
        style={{ perspective: 1000 }}
      >
        {lastRoll[1]}
      </motion.div>
    </div>
  );
};

export default DiceDisplay;