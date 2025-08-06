import React from 'react';
import { motion } from 'framer-motion';
import { GameLogEntry } from '@/types';

interface LogEntryProps {
  log: GameLogEntry;
}

const LogEntry: React.FC<LogEntryProps> = ({ log }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start space-x-2 p-2 rounded-lg hover:bg-white/5 transition-colors ${getTypeColor(log.type)}`}
    >
      <span className="text-xs">{getTypeIcon(log.type)}</span>
      <span className="text-gray-500 text-xs min-w-fit">
        [{log.timestamp.toLocaleTimeString()}]
      </span>
      <span className="flex-1">{log.message}</span>
    </motion.div>
  );
};

export default LogEntry;