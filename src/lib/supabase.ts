// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типы для пользователя
export interface UserProfile {
    id: string
    username: string
    email: string
    avatar_url?: string
    games_played: number
    games_won: number
    created_at: string
}

// Типы для комнат
export interface GameRoom {
    id: string
    name: string
    host_id: string
    max_players: number
    current_players: number
    status: 'waiting' | 'in_progress' | 'finished'
    is_private: boolean
    password?: string
    game_settings: {
        starting_money: number
        fast_mode: boolean
    }
    created_at: string
    host?: UserProfile
}

export interface RoomParticipant {
    id: string
    room_id: string
    user_id: string
    player_color: string
    player_icon: string
    position: number
    money: number
    is_ready: boolean
    joined_at: string
    user?: UserProfile
}

export interface OnlineStats {
    total_online: number
    in_game: number
    open_lobbies: number
}

// В файле lib/supabase.ts добавить:

export interface GameSession {
    id: string;
    room_id: string;
    game_state: any;
    created_at: string;
    updated_at: string;
}

export const gameSessionService = {
    // Сохранить состояние игры
    async saveGameState(roomId: string, gameState: any): Promise<void> {
        const { error } = await supabase
            .from('game_sessions')
            .upsert({
                room_id: roomId,
                game_state: gameState
            }, {
                onConflict: 'room_id'
            });

        if (error) {
            throw new Error(`Failed to save game state: ${error.message}`);
        }
    },

    // Загрузить состояние игры
    async loadGameState(roomId: string): Promise<any | null> {
        const { data, error } = await supabase
            .from('game_sessions')
            .select('game_state')
            .eq('room_id', roomId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Сессия не найдена - это нормально для новой игры
                return null;
            }
            throw new Error(`Failed to load game state: ${error.message}`);
        }

        return data?.game_state || null;
    },

    // Удалить состояние игры
    async deleteGameState(roomId: string): Promise<void> {
        const { error } = await supabase
            .from('game_sessions')
            .delete()
            .eq('room_id', roomId);

        if (error) {
            throw new Error(`Failed to delete game state: ${error.message}`);
        }
    }
};

// Функции для онлайн статистики
export const statsService = {
    // Обновление статуса пользователя (онлайн/в игре)
    async updateUserStatus(status: 'online' | 'in_game' | 'offline', roomId?: string) {
        const user = await authService.getCurrentUser()
        if (!user) return

        const sessionToken = `${user.id}-${Date.now()}`

        const { error } = await supabase
            .from('user_sessions')
            .upsert({
                user_id: user.id,
                session_token: sessionToken,
                status,
                current_room_id: roomId || null,
                last_activity: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })

        if (error) console.error('Error updating user status:', error)
    },

    // Обновление активности (heartbeat)
    async updateActivity() {
        const user = await authService.getCurrentUser()
        if (!user) return

        const { error } = await supabase
            .from('user_sessions')
            .update({
                last_activity: new Date().toISOString()
            })
            .eq('user_id', user.id)

        if (error) console.error('Error updating activity:', error)
    },

    // Получение статистики онлайн
    async getOnlineStats(): Promise<OnlineStats> {
        const { data, error } = await supabase
            .rpc('get_online_stats')

        if (error) {
            console.error('Error fetching online stats:', error)
            return { total_online: 0, in_game: 0, open_lobbies: 0 }
        }

        return data?.[0] || { total_online: 0, in_game: 0, open_lobbies: 0 }
    }
}

// Функции для работы с комнатами
export const roomService = {
    // Получение списка доступных комнат
    async getAvailableRooms(): Promise<GameRoom[]> {
        const { data, error } = await supabase
            .from('game_rooms')
            .select(`
        *,
        host:profiles(username, id)
      `)
            .eq('status', 'waiting')
            .eq('is_private', false)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    },

    // Создание новой комнаты
    async createRoom(params: {
        name: string
        max_players: number
        is_private: boolean
        password?: string
        game_settings?: any
    }): Promise<GameRoom> {
        const user = await authService.getCurrentUser()
        if (!user) throw new Error('Must be authenticated')

        const { data, error } = await supabase
            .from('game_rooms')
            .insert({
                name: params.name,
                host_id: user.id,
                max_players: params.max_players,
                is_private: params.is_private,
                password: params.password,
                game_settings: params.game_settings || { starting_money: 1500, fast_mode: false }
            })
            .select()
            .single()

        if (error) throw error

        // Автоматически присоединяем создателя к комнате
        await this.joinRoom(data.id, {
            player_color: '#FF0000',
            player_icon: '🎩'
        })

        return data
    },

    // Присоединение к комнате
    async joinRoom(roomId: string, playerData: {
        player_color: string
        player_icon: string
    }): Promise<RoomParticipant> {
        const user = await authService.getCurrentUser()
        if (!user) throw new Error('Must be authenticated')

        // Проверяем, что комната существует и не полная
        const { data: room, error: roomError } = await supabase
            .from('game_rooms')
            .select('*')
            .eq('id', roomId)
            .eq('status', 'waiting')
            .single()

        if (roomError || !room) throw new Error('Room not found or not available')
        if (room.current_players >= room.max_players) throw new Error('Room is full')

        // Присоединяемся к комнате
        const { data, error } = await supabase
            .from('room_participants')
            .insert({
                room_id: roomId,
                user_id: user.id,
                player_color: playerData.player_color,
                player_icon: playerData.player_icon
            })
            .select()
            .single()

        if (error) throw error
        return data
    },

    // Покинуть комнату
    async leaveRoom(roomId: string): Promise<void> {
        const user = await authService.getCurrentUser()
        if (!user) throw new Error('Must be authenticated')

        const { error } = await supabase
            .from('room_participants')
            .delete()
            .eq('room_id', roomId)
            .eq('user_id', user.id)

        if (error) throw error
    },

    // Получение участников комнаты
    async getRoomParticipants(roomId: string): Promise<RoomParticipant[]> {
        const { data, error } = await supabase
            .from('room_participants')
            .select(`
        *,
        user:profiles(username, id)
      `)
            .eq('room_id', roomId)
            .order('joined_at')

        if (error) throw error
        return data || []
    },

    // Обновление готовности игрока
    async updatePlayerReady(roomId: string, isReady: boolean): Promise<void> {
        const user = await authService.getCurrentUser()
        if (!user) throw new Error('Must be authenticated')

        const { error } = await supabase
            .from('room_participants')
            .update({ is_ready: isReady })
            .eq('room_id', roomId)
            .eq('user_id', user.id)

        if (error) throw error
    },

    // Начало игры (только для хоста)
    async startGame(roomId: string): Promise<void> {
        const user = await authService.getCurrentUser()
        if (!user) throw new Error('Must be authenticated')

        const { error } = await supabase
            .from('game_rooms')
            .update({
                status: 'in_progress',
                started_at: new Date().toISOString()
            })
            .eq('id', roomId)
            .eq('host_id', user.id)

        if (error) throw error
    },

    // Поиск случайной комнаты для быстрой игры
    async findRandomRoom(): Promise<GameRoom | null> {
        const { data, error } = await supabase
            .from('game_rooms')
            .select('*')
            .eq('status', 'waiting')
            .eq('is_private', false)
            .filter('current_players', 'lt', 'max_players')
            .order('current_players', { ascending: false })
            .limit(1)

        if (error) throw error
        return data?.[0] || null
    }
}

// Функции аутентификации
export const authService = {
    // Регистрация
    async signUp(email: string, password: string, username: string) {
        // Сначала регистрируем пользователя
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        })

        if (error) throw error

        // Если пользователь создан, создаем профиль
        if (data.user) {
            // Небольшая задержка для завершения создания пользователя
            await new Promise(resolve => setTimeout(resolve, 1000))

            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: data.user.id,
                    username,
                    email: data.user.email,
                    games_played: 0,
                    games_won: 0
                })

            if (profileError) {
                console.error('Profile creation error:', profileError)
                // Не бросаем ошибку, так как основная регистрация прошла
            }
        }

        return data
    },

    // Вход
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) throw error
        return data
    },

    // Выход
    async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    },

    // Получение текущего пользователя
    async getCurrentUser() {
        const { data: { user } } = await supabase.auth.getUser()
        return user
    },

    // Получение профиля пользователя
    async getUserProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('Error fetching profile:', error)
            return null
        }

        return data
    },

    // Обновление статистики игр
    async updateGameStats(userId: string, won: boolean) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('games_played, games_won')
            .eq('id', userId)
            .single()

        if (profile) {
            const { error } = await supabase
                .from('profiles')
                .update({
                    games_played: profile.games_played + 1,
                    games_won: won ? profile.games_won + 1 : profile.games_won
                })
                .eq('id', userId)

            if (error) throw error
        }
    }

}
export const realtimeGameService = {
    subscribeToGameSession(
        roomId: string,
        callback: (gameState: any, metadata?: any) => void,
        onSuccess?: () => void,
        onError?: (error: any) => void
    ) {
        console.log('🔌 Subscribing to realtime updates for room:', roomId);

        let retryCount = 0;
        const maxRetries = 3;
        let currentChannel: any = null;

        const createSubscription = async () => {
            try {
                // Проверяем валидность сессии перед подключением
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    throw new Error('No valid session');
                }

                // Закрываем предыдущее подключение если есть
                if (currentChannel) {
                    currentChannel.unsubscribe();
                }

                currentChannel = supabase
                    .channel(`game:${roomId}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'game_sessions',
                            filter: `room_id=eq.${roomId}`
                        },
                        (payload) => {
                            console.log('🔄 POSTGRES RAW PAYLOAD:', {
                                new: payload.new,
                                last_action: payload.new?.last_action,
                                last_action_timestamp: payload.new?.last_action_timestamp
                            });

                            if (payload.new?.game_state) {
                                let metadata: any = {};

                                try {
                                    if (payload.new.last_action) {
                                        metadata = typeof payload.new.last_action === 'string' ?
                                            JSON.parse(payload.new.last_action) :
                                            payload.new.last_action;
                                    }
                                } catch (e) {
                                    console.warn('⚠️ Failed to parse last_action:', e);
                                    metadata = {};
                                }

                                if (payload.new.last_action_timestamp) {
                                    try {
                                        metadata.timestamp = new Date(payload.new.last_action_timestamp).getTime();
                                    } catch (e) {
                                        console.warn('⚠️ Failed to parse timestamp:', e);
                                        metadata.timestamp = Date.now();
                                    }
                                } else {
                                    metadata.timestamp = Date.now();
                                }

                                console.log('📤 SENDING TO CALLBACK:', {
                                    metadata: metadata,
                                    hasGameState: !!payload.new.game_state
                                });

                                callback(payload.new.game_state, metadata);
                            } else {
                                console.warn('⚠️ No game_state in payload:', payload);
                            }
                        }
                    )
                    .subscribe((status) => {
                        console.log('📡 Subscription status:', status, 'retry count:', retryCount);

                        if (status === 'SUBSCRIBED') {
                            console.log('✅ Successfully connected to realtime');
                            retryCount = 0; // Сбрасываем счетчик при успехе
                            onSuccess?.();
                        }

                        if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
                            console.error('❌ Realtime connection failed, status:', status);

                            if (retryCount < maxRetries) {
                                retryCount++;
                                const delay = 2000 * retryCount; // Увеличиваем задержку
                                console.log(`🔄 Reconnecting in ${delay}ms... attempt ${retryCount}/${maxRetries}`);
                                setTimeout(createSubscription, delay);
                            } else {
                                console.error('❌ Max retries reached, calling error handler');
                                onError?.(new Error('Max reconnection attempts reached'));
                            }
                        }
                    });

            } catch (error) {
                console.error('❌ Failed to create subscription:', error);

                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`🔄 Retrying subscription... attempt ${retryCount}/${maxRetries}`);
                    setTimeout(createSubscription, 2000 * retryCount);
                } else {
                    onError?.(error);
                }
            }
        };

        // Начинаем подключение
        createSubscription();

        // Возвращаем объект с методом unsubscribe
        return {
            unsubscribe: () => {
                if (currentChannel) {
                    currentChannel.unsubscribe();
                    currentChannel = null;
                }
            }
        };
    },

    // Обновить состояние игры для всех игроков
    async updateGameState(roomId: string, gameState: any, metadata?: any): Promise<void> {
        console.log('🔧 UPDATING GAME STATE:', {
            roomId: roomId,
            metadata: metadata,
            metadataStringified: JSON.stringify(metadata || {})
        });

        const updateData: any = {
            game_state: gameState,
            last_action_timestamp: new Date().toISOString()
        };

        if (metadata) {
            try {
                updateData.last_action = JSON.stringify(metadata);
                updateData.current_turn_player_id = metadata.playerId;
            } catch (e) {
                console.error('Failed to stringify metadata:', e);
                updateData.last_action = JSON.stringify({});
            }
        } else {
            updateData.last_action = JSON.stringify({});
        }

        console.log('💾 UPDATE DATA BEING SENT:', updateData);

        const { error } = await supabase
            .from('game_sessions')
            .update(updateData)
            .eq('room_id', roomId);

        if (error) {
            throw new Error(`Failed to update game state: ${error.message}`);
        }
    }
};

export default { authService, roomService, statsService, gameSessionService, realtimeGameService };