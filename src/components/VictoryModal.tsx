import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Crown, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VictoryModalProps {
  isOpen: boolean;
  winner: {
    name: string;
    color: string;
    icon: string;
    money: number;
    properties: number;
  };
  roomId: string;
  onClose: () => void;
}

const VictoryModal: React.FC<VictoryModalProps> = ({ isOpen, winner, roomId, onClose }) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-gradient-to-br from-yellow-900/95 via-orange-900/95 to-red-900/95 backdrop-blur-xl rounded-2xl border-2 border-yellow-500/50 p-8 max-w-md w-full text-center shadow-2xl"
        >
          {/* Victory Animation */}
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="text-6xl mb-4"
          >
            🏆
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">
              VICTORY!
            </h1>
            <p className="text-yellow-200 text-lg">
              Congratulations to the winner!
            </p>
          </motion.div>

          {/* Winner Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 rounded-xl p-4 mb-6 border border-yellow-500/30"
          >
            <div className="flex items-center justify-center mb-3">
              <div
                className="text-4xl mr-3"
                style={{
                  color: winner.color,
                  filter: 'drop-shadow(0 0 10px currentColor)'
                }}
              >
                {winner.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{winner.name}</h2>
                <div className="text-yellow-300 text-sm">🏆 CHAMPION</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-yellow-600/20 rounded-lg p-2">
                <div className="text-yellow-300 font-bold">${winner.money.toLocaleString()}</div>
                <div className="text-yellow-200 text-xs">Final Money</div>
              </div>
              <div className="bg-orange-600/20 rounded-lg p-2">
                <div className="text-orange-300 font-bold">{winner.properties}</div>
                <div className="text-orange-200 text-xs">Properties</div>
              </div>
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <button
              onClick={handleGoHome}
              className="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Home className="w-5 h-5" />
              <span>Go Home</span>
            </button>
          </motion.div>

          {/* Confetti Effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -10,
                  opacity: 0
                }}
                animate={{
                  y: window.innerHeight + 10,
                  opacity: [0, 1, 0],
                  rotate: [0, 360]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: Math.random() * 2,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 3
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VictoryModal; 