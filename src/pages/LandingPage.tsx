import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Gamepad2, Users, Trophy, Star, Plus, X, Settings } from 'lucide-react';
import { authService, roomService, statsService, UserProfile, GameRoom, OnlineStats } from '../lib/supabase';
import StaticClouds from '../components/StaticClouds';

// Типы для формы
interface FormData {
    email: string;
    password: string;
    username: string;
    confirmPassword: string;
}

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState<boolean>(true);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [formData, setFormData] = useState<FormData>({
        email: '',
        password: '',
        username: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [user, setUser] = useState<UserProfile | null>(null);
    const [availableRooms, setAvailableRooms] = useState<GameRoom[]>([]);
    const [isLoadingRooms, setIsLoadingRooms] = useState(false);
    const [onlineStats, setOnlineStats] = useState<OnlineStats>({ total_online: 0, in_game: 0, open_lobbies: 0 });
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [createRoomData, setCreateRoomData] = useState({
        name: '',
        maxPlayers: 4,
        isPrivate: false,
        password: '',
        fastMode: false
    });

    // Проверка авторизации при загрузке
    useEffect(() => {
        checkAuth();
    }, []);

    // Загрузка комнат и статистики при входе пользователя
    useEffect(() => {
        if (user) {
            loadAvailableRooms();
            loadOnlineStats();
            statsService.updateUserStatus('online');

            // Обновляем данные каждые 10 секунд
            const interval = setInterval(() => {
                loadAvailableRooms();
                loadOnlineStats();
                statsService.updateActivity();
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [user]);

    // Обновление статуса при выходе из приложения
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (user) {
                statsService.updateUserStatus('offline');
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [user]);

    const checkAuth = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
                const profile = await authService.getUserProfile(currentUser.id);
                if (profile) {
                    setUser(profile);
                }
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    };

    const loadAvailableRooms = async () => {
        try {
            setIsLoadingRooms(true);
            const rooms = await roomService.getAvailableRooms();
            setAvailableRooms(rooms);
        } catch (error) {
            console.error('Error loading rooms:', error);
        } finally {
            setIsLoadingRooms(false);
        }
    };

    const loadOnlineStats = async () => {
        try {
            const stats = await statsService.getOnlineStats();
            setOnlineStats(stats);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleAuth = async (e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Валидация
            if (!formData.email || !formData.password) {
                throw new Error('Please fill in all required fields');
            }

            if (!isLogin && !formData.username) {
                throw new Error('Username is required');
            }

            if (!isLogin && formData.password !== formData.confirmPassword) {
                throw new Error('Passwords do not match');
            }

            if (formData.password.length < 6) {
                throw new Error('Password must be at least 6 characters');
            }

            if (isLogin) {
                // Вход
                const { user: authUser } = await authService.signIn(formData.email, formData.password);

                if (authUser) {
                    const profile = await authService.getUserProfile(authUser.id);
                    if (profile) {
                        setUser(profile);
                        // Остаёмся на главной странице, не перенаправляем
                    }
                }
            } else {
                // Регистрация
                await authService.signUp(formData.email, formData.password, formData.username);
                setError('Registration successful! Please check your email to verify your account, then sign in.');
                setIsLogin(true);
                setFormData({ email: formData.email, password: '', username: '', confirmPassword: '' });
            }
        } catch (error: any) {
            setError(error.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignOut = async () => {
        try {
            if (user) {
                await statsService.updateUserStatus('offline');
            }
            await authService.signOut();
            setUser(null);
            setFormData({ email: '', password: '', username: '', confirmPassword: '' });
            setOnlineStats({ total_online: 0, in_game: 0, open_lobbies: 0 });
        } catch (error: any) {
            setError(error.message);
        }
    };

    const createPrivateRoom = () => {
        if (!user) {
            setError('Please sign in to create a room');
            return;
        }
        setShowCreateRoomModal(true);
    };

    const handleCreateRoom = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            setError('');

            if (!createRoomData.name.trim()) {
                setError('Room name is required');
                return;
            }

            if (createRoomData.isPrivate && !createRoomData.password.trim()) {
                setError('Password is required for private rooms');
                return;
            }

            const newRoom = await roomService.createRoom({
                name: createRoomData.name.trim(),
                max_players: createRoomData.maxPlayers,
                is_private: createRoomData.isPrivate,
                password: createRoomData.isPrivate ? createRoomData.password : undefined,
                game_settings: {
                    starting_money: 1500,
                    fast_mode: createRoomData.fastMode
                }
            });

            setShowCreateRoomModal(false);
            setCreateRoomData({
                name: '',
                maxPlayers: 4,
                isPrivate: false,
                password: '',
                fastMode: false
            });

            navigate(`/room/${newRoom.id}`);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const joinSpecificRoom = async (roomId: string) => {
        if (!user) {
            setError('Please sign in to join a game');
            return;
        }

        try {
            await roomService.joinRoom(roomId, {
                player_color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
                player_icon: '🎩'
            });
            navigate(`/room/${roomId}`);
        } catch (error: any) {
            setError(error.message);
        }
    };

    const switchMode = () => {
        setIsLogin(!isLogin);
        setFormData({ email: '', password: '', username: '', confirmPassword: '' });
        setError('');
    };

    return (
        <div className="min-h-screen relative overflow-hidden" style={{
            background: 'linear-gradient(to bottom, #87CEEB 0%, #98D8E8 50%, #B0E0E6 100%)',
        }}>
            {/* Cloud Background */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute opacity-80"
                        style={{
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 120 - 10}%`,
                            animationDelay: `${Math.random() * 20}s`,
                            animationDuration: `${30 + Math.random() * 20}s`,
                        }}
                    >
                        <div
                            className="bg-white rounded-full shadow-sm animate-float"
                            style={{
                                width: `${60 + Math.random() * 80}px`,
                                height: `${30 + Math.random() * 40}px`,
                                position: 'relative',
                            }}
                        >
                            <div
                                className="absolute bg-white rounded-full"
                                style={{
                                    width: `${20 + Math.random() * 30}px`,
                                    height: `${20 + Math.random() * 30}px`,
                                    top: `-${10 + Math.random() * 15}px`,
                                    left: `${10 + Math.random() * 20}%`,
                                }}
                            />
                            <div
                                className="absolute bg-white rounded-full"
                                style={{
                                    width: `${25 + Math.random() * 35}px`,
                                    height: `${25 + Math.random() * 35}px`,
                                    top: `-${15 + Math.random() * 20}px`,
                                    right: `${10 + Math.random() * 20}%`,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/50 to-indigo-900/60"></div>

            <div className="relative z-10 container mx-auto px-4 mt-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <img
                        src="/images/bonkopoly.png"
                        alt="BONKOPOLY"
                        style={{ height: '200px' }}
                        className="w-auto object-contain drop-shadow-[0_0_15px_rgba(255,107,53,0.5)] mx-auto"
                    />
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto mt-4">
                        The ultimate online monopoly experience. Build your empire, bankrupt your friends, and become the property tycoon!
                    </p>
                </div>

                {/* User Info (if logged in) */}
                {user && (
                    <div className="mb-8 flex justify-center">
                        <div className="bg-gradient-to-br from-green-900/80 to-emerald-800/80 backdrop-blur-xl rounded-xl border border-green-400/30 p-4 flex items-center space-x-4">
                            <div className="text-2xl">
                                <img
                                    src="/images/bonk.png"
                                    alt="Bonk"
                                    className="w-12 h-12  object-contain inline"
                                />
                            </div>
                            <div>
                                <div className="font-bold text-white">Welcome, {user.username}!</div>
                                <div className="text-sm text-green-400">
                                    Games: {user.games_played} | Wins: {user.games_won}
                                </div>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="text-sm text-red-400 hover:text-red-300 transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                    {/* Left Column - Features */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                            <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                                <Gamepad2 className="mr-3 text-purple-400" />
                                Game Features
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center text-gray-300">
                                    <Users className="w-5 h-5 mr-3 text-blue-400" />
                                    <span>Up to 8 players online</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <Trophy className="w-5 h-5 mr-3 text-yellow-400" />
                                    <span>Ranked competitive play</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <Star className="w-5 h-5 mr-3 text-green-400" />
                                    <span>Custom game modes</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                            <h3 className="text-xl font-bold text-white mb-4">Live Stats</h3>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-green-400">{onlineStats.total_online}</div>
                                    <div className="text-sm text-gray-400">Players Online</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-yellow-400">{onlineStats.open_lobbies}</div>
                                    <div className="text-sm text-gray-400">Open Lobbies</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center Column - Auth Forms */}
                    {!user && (
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-500/20 rounded-2xl blur-xl"></div>
                            <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-white mb-2">
                                        {isLogin ? 'Welcome Back!' : 'Join the Game!'}
                                    </h2>
                                    <p className="text-gray-400">
                                        {isLogin ? 'Sign in to continue your monopoly journey' : 'Create your account and start playing'}
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {!isLogin && (
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="text"
                                                name="username"
                                                placeholder="Username"
                                                value={formData.username}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="Email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            required
                                        />
                                    </div>

                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="Password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className="w-full pl-12 pr-12 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    {!isLogin && (
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                placeholder="Confirm Password"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        onClick={handleAuth}
                                        disabled={isLoading}
                                        className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
                                    </button>
                                </div>

                                <div className="mt-6 text-center">
                                    <p className="text-gray-400">
                                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                                        <button
                                            onClick={switchMode}
                                            className="ml-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                                        >
                                            {isLogin ? 'Sign Up' : 'Sign In'}
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Start (for logged in users) */}
                    {user && (
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 via-emerald-600/20 to-teal-500/20 rounded-2xl blur-xl"></div>
                            <div className="relative bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
                                <h3 className="text-2xl font-bold text-white mb-6 text-center">Ready to Play?</h3>
                                <div className="space-y-4">
                                    <button
                                        onClick={createPrivateRoom}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 flex items-center justify-center"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Create New Room
                                    </button>
                                    <div className="text-center text-sm text-gray-400">
                                        Or join an existing room from the list →
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right Column - Available Lobbies */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                            <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                                <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                                Waiting for Players
                                {isLoadingRooms && (
                                    <div className="ml-auto text-sm text-gray-400">Loading...</div>
                                )}
                            </h3>

                            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
                                {availableRooms.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        <div className="text-4xl mb-2">🎮</div>
                                        <p className="font-medium">No active lobbies</p>
                                        <p className="text-sm">Create a room or join a random game!</p>
                                    </div>
                                ) : (
                                    availableRooms.map((room) => (
                                        <div
                                            key={room.id}
                                            className={`bg-slate-800/50 rounded-xl p-4 border border-white/5 transition-all ${user ? 'hover:border-green-400/30 cursor-pointer transform hover:scale-105' : 'opacity-50'
                                                }`}
                                            onClick={() => user && joinSpecificRoom(room.id)}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-white">{room.name}</h4>
                                                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-400/30">
                                                    Join
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm text-gray-400">
                                                <span>Host: {room.host?.username || 'Unknown'}</span>
                                                <span className="text-yellow-400 font-semibold">
                                                    {room.current_players}/{room.max_players}
                                                </span>
                                            </div>
                                            {room.game_settings?.fast_mode && (
                                                <div className="mt-1">
                                                    <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400">
                                                        ⚡ Fast Mode
                                                    </span>
                                                </div>
                                            )}
                                            {user ? (
                                                <div className="mt-2 text-xs text-green-400 flex items-center">
                                                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                                                    Click to join lobby
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-xs text-gray-500">
                                                    Sign in to join
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-16 text-gray-400">
                    <p>&copy; 2025 Bonkopoly. The most addictive property trading game online.</p>
                </div>
            </div>

            {/* Create Room Modal */}
            {showCreateRoomModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-white flex items-center">
                                <Settings className="mr-3 text-purple-400" />
                                Create Room
                            </h3>
                            <button
                                onClick={() => setShowCreateRoomModal(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Room Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Room Name</label>
                                <input
                                    type="text"
                                    value={createRoomData.name}
                                    onChange={(e) => setCreateRoomData({ ...createRoomData, name: e.target.value })}
                                    placeholder="Enter room name..."
                                    className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>

                            {/* Max Players */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Max Players</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[2, 4, 6, 8].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setCreateRoomData({ ...createRoomData, maxPlayers: num })}
                                            className={`py-2 px-3 rounded-lg font-semibold transition-all ${createRoomData.maxPlayers === num
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Private Room Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Room Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setCreateRoomData({ ...createRoomData, isPrivate: false, password: '' })}
                                        className={`py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center ${!createRoomData.isPrivate
                                            ? 'bg-green-600 text-white'
                                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                                            }`}
                                    >
                                        🌍 Public
                                    </button>
                                    <button
                                        onClick={() => setCreateRoomData({ ...createRoomData, isPrivate: true })}
                                        className={`py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center ${createRoomData.isPrivate
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                                            }`}
                                    >
                                        🔒 Private
                                    </button>
                                </div>
                            </div>

                            {/* Password (if private) */}
                            {createRoomData.isPrivate && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={createRoomData.password}
                                        onChange={(e) => setCreateRoomData({ ...createRoomData, password: e.target.value })}
                                        placeholder="Enter password..."
                                        className="w-full px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            )}

                            {/* Fast Mode Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Game Speed</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setCreateRoomData({ ...createRoomData, fastMode: false })}
                                        className={`py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center ${!createRoomData.fastMode
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                                            }`}
                                    >
                                        🐢 Normal
                                    </button>
                                    <button
                                        onClick={() => setCreateRoomData({ ...createRoomData, fastMode: true })}
                                        className={`py-3 px-4 rounded-lg font-semibold transition-all flex items-center justify-center ${createRoomData.fastMode
                                            ? 'bg-orange-600 text-white'
                                            : 'bg-slate-700/50 text-gray-300 hover:bg-slate-600/50'
                                            }`}
                                    >
                                        ⚡ Fast
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {createRoomData.fastMode
                                        ? 'Reduced timers for faster gameplay'
                                        : 'Standard game timers and pace'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Create Button */}
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowCreateRoomModal(false)}
                                className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateRoom}
                                disabled={isLoading}
                                className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all"
                            >
                                {isLoading ? 'Creating...' : 'Create Room'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;