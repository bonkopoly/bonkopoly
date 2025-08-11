import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../hooks/useGameStore';
import { authService } from '../lib/supabase';

interface BankruptcyRedirectProps {
  roomId: string;
  currentUserId: string | null;
}

const BankruptcyRedirect: React.FC<BankruptcyRedirectProps> = ({ roomId, currentUserId }) => {
  const navigate = useNavigate();
  const { players, gameEnded } = useGameStore();

  useEffect(() => {
    if (!currentUserId || !players.length) return;

    // Find the current user's player index
    const myPlayerIndex = players.findIndex(p => p.userId === currentUserId);
    
    if (myPlayerIndex === -1) return;

    const myPlayer = players[myPlayerIndex];

    // If the current user is bankrupt and the game hasn't ended yet, redirect to home
    if (myPlayer.bankrupt && !gameEnded) {
      console.log('💀 Player is bankrupt, redirecting to home...');
      
      // Small delay to ensure the bankruptcy state is properly processed
      setTimeout(() => {
        navigate('/');
      }, 2000); // 2 second delay to show the bankruptcy message
    }
  }, [players, gameEnded, currentUserId, roomId, navigate]);

  return null; // This component doesn't render anything
};

export default BankruptcyRedirect; 