'use client'

import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { createClient } from '@/lib/supabase/client';
import { playImmediateBeep, resumeAudioContext } from '@/lib/sound-utils';
import { toast } from 'sonner';

export function NativePushHandler() {
  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    if (!isNative) return;

    const registerNativePush = async () => {
      try {
        console.log('[Native Push] Checking permissions...');
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          console.warn('[Native Push] Permission denied');
          return;
        }

        // --- ANDROID CHANNEL CREATION ---
        if (Capacitor.getPlatform() === 'android') {
          await PushNotifications.createChannel({
            id: 'fcm_default_channel',
            name: 'Orders',
            description: 'Notifications for new orders and reservations',
            importance: 5,
            visibility: 1,
            sound: 'default'
          });
        }

        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
          console.log('[Native Push] Token received:', token.value);
          
          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
              const { error } = await supabase
                .from('staff_profiles')
                .update({ fcm_token: token.value })
                .eq('id', user.id);
              
              if (!error) {
                toast.success('✅ Пуш хабарлама іске қосылды!', {
                    description: 'Енді жаңа тапсырыстар осы жерге келеді.'
                });
              }
            }
          } catch (e: any) {
              console.error('[Native Push] Token save error', e);
          }
        });

        PushNotifications.addListener('registrationError', (err: any) => {
          console.error('[Native Push] Registration error:', err);
        });

        // Foreground messages
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('[Native Push] Received:', notification);
          
          // Play sound
          resumeAudioContext();
          playImmediateBeep('order-alert');

          toast.success(notification.title || 'Жаңа хабарлама', {
              description: notification.body,
              duration: 10000,
              action: {
                  label: 'Көру',
                  onClick: () => window.location.href = '/orders'
              }
          });
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
            console.log('[Native Push] Action performed:', action);
            const data = action.notification.data;
            const url = data?.url || '/orders';
            window.location.href = url;
        });
      } catch (err: any) {
        console.error('[Native Push] Setup error:', err);
      }
    };

    registerNativePush();
  }, []);

  return null;
}
