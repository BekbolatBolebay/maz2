'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function NativePushHandler() {
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    if (!isNative) return;

    const registerNativePush = async () => {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        toast.error('Android жүйесінде хабарламаларға рұқсат берілмеді');
        return;
      }

      await PushNotifications.register();

      PushNotifications.addListener('registration', async (token) => {
        console.log('[Native Push] Token received:', token.value);
        
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            await supabase
              .from('staff_profiles')
              .update({ 
                // We save it to fcm_token as well so the backend script sends it via FCM logic
                fcm_token: token.value 
              })
              .eq('id', user.id);
            console.log('[Native Push] Token saved to Supabase');
          }
        } catch (e) {
            console.error('[Native Push] Error saving token', e);
        }
      });

      PushNotifications.addListener('registrationError', (err: any) => {
        console.error('[Native Push] Registration error:', err);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Native Push] Received notification:', notification);
        toast.success(notification.title || 'Жаңа хабарлама', {
            description: notification.body
        });
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
         console.log('[Native Push] Action performed:', action);
         // Redirect to orders page if clicked
         window.location.href = '/orders';
      });
    };

    registerNativePush();
  }, []);

  return null; // This is a background component
}
