import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Crown, Send, Users, Settings, Play } from 'lucide-react';
import { authService, roomService, statsService, supabase, UserProfile, GameRoom, RoomParticipant } from '../lib/supabase';

const RoomLobby: React.FC = () => {
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    user: string;
    message: string;
    timestamp: string;
  }>>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }
    
    initializeLobby();
    
    const interval = setInterval(loadRoomData, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  const initializeLobby = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        navigate('/');
        return;
      }

      const profile = await authService.getUserProfile(currentUser.id);
      if (!profile) {
        navigate('/');
        return;
      }

      setUser(profile);
      await loadRoomData();
      await statsService.updateUserStatus('in_game', roomId);
    } catch (error) {
      console.error('Error initializing lobby:', error);
      navigate('/');
    }
  };

  const loadRoomData = async () => {
    if (!roomId) return;

    try {
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select(`
          *,
          host:profiles(username, id)
        `)
        .eq('id', roomId)
        .single();

      if (roomError || !roomData) {
        setError('Room not found');
        return;
      }

      setRoom(roomData);
      setIsHost(user?.id === roomData.host_id);

      const participantsData = await roomService.getRoomParticipants(roomId);
      setParticipants(participantsData);

      const currentParticipant = participantsData.find(p => p.user_id === user?.id);
      if (currentParticipant) {
        setIsReady(currentParticipant.is_ready);
      }

      if (roomData.status === 'in_progress') {
        navigate(`/game/${roomId}`);
      }

    } catch (error) {
      console.error('Error loading room data:', error);
      setError('Failed to load room data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadyToggle = async () => {
    if (!roomId || !user) return;

    try {
      const newReadyState = !isReady;
      await roomService.updatePlayerReady(roomId, newReadyState);
      setIsReady(newReadyState);
      
      setTimeout(loadRoomData, 500);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleStartGame = async () => {
    if (!roomId || !isHost) return;

    const allReady = participants.every(p => p.is_ready);
    if (!allReady) {
      setError('All players must be ready to start the game');
      return;
    }

    if (participants.length < 2) {
      setError('Need at least 2 players to start the game');
      return;
    }

    try {
      await roomService.startGame(roomId);
      
      const playersData = participants.map((p, index) => ({
        id: index + 1,
        name: p.user?.username || `Player ${index + 1}`,
        color: p.player_color,
        icon: p.player_icon,
        userId: p.user_id
      }));
      
      const encodedPlayers = encodeURIComponent(JSON.stringify(playersData));
      navigate(`/game/${roomId}?players=${encodedPlayers}`);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId) return;

    try {
      await roomService.leaveRoom(roomId);
      await statsService.updateUserStatus('online');
      navigate('/');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !user) return;

    const newMessage = {
      id: Date.now().toString(),
      user: user.username,
      message: chatMessage.trim(),
      timestamp: new Date().toLocaleTimeString()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setChatMessage('');
  };

  const getPlayerSlots = () => {
    const maxPlayers = room?.max_players || 4;
    const slots = [];

    for (let i = 0; i < maxPlayers; i++) {
      const participant = participants[i];
      slots.push(participant || null);
    }

    return slots;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading lobby...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Room not found</div>
      </div>
    );
  }

  const playerSlots = getPlayerSlots();
  const allReady = participants.length >= 2 && participants.every(p => p.is_ready);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleLeaveRoom}
            className="flex items-center text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 mr-2" />
            Back to Lobby
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">{room.name}</h1>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {participants.length}/{room.max_players} players
              </span>
              {room.game_settings?.fast_mode && (
                <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full">
                  ⚡ Fast Mode
                </span>
              )}
              {room.is_private && (
                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                  🔒 Private
                </span>
              )}
            </div>
          </div>

          <div className="w-24"></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Main Content - компактные окошки */}
        <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* Game Info */}
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg border border-white/10 p-4 h-fit">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center">
              <Settings className="mr-2 text-purple-400" />
              Game Settings
            </h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex justify-between">
                <span>Starting Money:</span>
                <span className="text-green-400">${room.game_settings?.starting_money?.toLocaleString() || '1,500'}</span>
              </div>
              <div className="flex justify-between">
                <span>Game Mode:</span>
                <span className="text-blue-400">
                  {room.game_settings?.fast_mode ? 'Fast' : 'Normal'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Max Players:</span>
                <span className="text-yellow-400">{room.max_players}</span>
              </div>
            </div>

            {/* Host Controls */}
            {isHost && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center">
                  <Crown className="mr-2 text-yellow-400" />
                  Host Controls
                </h4>
                <button
                  onClick={handleStartGame}
                  disabled={!allReady}
                  className={`w-full py-2 font-bold rounded-lg transition-all flex items-center justify-center text-sm ${
                    allReady
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {allReady ? 'Start Game' : 'Waiting for players'}
                </button>
                {!allReady && (
                  <p className="text-xs text-gray-400 mt-1 text-center">
                    All players must be ready
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Players Grid */}
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg border border-white/10 p-4">
            <h3 className="text-lg font-bold text-white mb-4 text-center">Players</h3>
            
            <div className={`grid gap-3 ${
              room.max_players <= 4 ? 'grid-cols-2' : 
              room.max_players <= 6 ? 'grid-cols-3' : 'grid-cols-4'
            }`}>
              {playerSlots.map((participant, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                    participant
                      ? participant.is_ready
                        ? 'border-green-400 bg-green-500/10'
                        : 'border-yellow-400 bg-yellow-500/10'
                      : 'border-gray-600 bg-gray-500/10 border-dashed'
                  }`}
                >
                  {participant ? (
                    <>
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg mb-2 ${
                        participant.is_ready ? 'bg-green-500' : 'bg-yellow-500'
                      }`}>
                        {participant.player_icon}
                      </div>
                      
                      <div className="text-white font-semibold text-sm text-center">
                        {participant.user?.username}
                        {participant.user_id === room.host_id && (
                          <Crown className="w-3 h-3 text-yellow-400 inline ml-1" />
                        )}
                      </div>
                      
                      <div className={`text-xs mt-1 ${
                        participant.is_ready ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {participant.is_ready ? '✓ Ready' : '? Waiting'}
                      </div>

                      {participant.user_id === user?.id && (
                        <button
                          onClick={handleReadyToggle}
                          className={`mt-2 px-3 py-1 rounded text-xs font-semibold transition-all ${
                            isReady
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {isReady ? 'Not Ready' : 'Ready'}
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-lg mb-2">
                        <Users className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="text-gray-400 text-xs">Empty slot</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg border border-white/10 p-4 flex flex-col h-fit max-h-96">
            <h3 className="text-lg font-bold text-white mb-3">Chat</h3>
            
            <div className="flex-1 bg-slate-800/30 rounded p-3 mb-3 overflow-y-auto max-h-48">
              {chatMessages.length === 0 ? (
                <div className="text-gray-400 text-sm text-center">
                  No messages yet 👋
                </div>
              ) : (
                <div className="space-y-2">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      <span className="text-purple-400 font-semibold">{msg.user}</span>
                      <span className="text-gray-500 text-xs ml-2">{msg.timestamp}</span>
                      <div className="text-white">{msg.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-slate-800/50 border border-white/10 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                maxLength={100}
              />
              <button
                type="submit"
                disabled={!chatMessage.trim()}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomLobby;