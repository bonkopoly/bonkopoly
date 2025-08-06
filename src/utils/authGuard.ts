import { supabase } from '@/lib/supabase';

// Автоматическое обновление токена каждые 50 минут
export const startTokenRefresh = () => {
  setInterval(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      console.log('✅ Token refreshed automatically');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      // Перенаправляем на логин при ошибке
      window.location.href = '/login';
    }
  }, 50 * 60 * 1000); // 50 минут
};