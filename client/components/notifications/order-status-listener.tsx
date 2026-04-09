'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useI18n } from '@/lib/i18n/i18n-context'
import { useAuth } from '@/lib/auth/auth-context'
import { playNotificationSound } from '@/lib/sound-utils'
import { showClientNotification } from '@/lib/client-notification-utils'

export function OrderStatusListener() {
  const { user } = useAuth()
  const { locale } = useI18n()
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const lastStatusRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (!user?.id) {
      console.log('[OrderStatusListener] No user logged in, skipping setup')
      return
    }

    console.log('[OrderStatusListener] Setting up real-time listener for user:', user.id)

    const supabase = createClient()

    const channel = supabase
      .channel(`order-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newOrder = payload.new as any
          const oldOrder = payload.old as any

          console.log('[OrderStatusListener] Order update received:', {
            orderId: newOrder.id,
            orderNumber: newOrder.order_number,
            oldStatus: oldOrder?.status,
            newStatus: newOrder.status,
            statusChanged: newOrder.status !== oldOrder?.status,
          })

          // Check if this is a real status change
          if (newOrder.status !== oldOrder?.status) {
            // Prevent duplicate notifications for the same order
            const lastStatus = lastStatusRef.current[newOrder.id]
            if (lastStatus === newOrder.status) {
              console.log('[OrderStatusListener] Duplicate status update ignored:', newOrder.status)
              return
            }
            lastStatusRef.current[newOrder.id] = newOrder.status

            showNotification(newOrder.status, newOrder.order_number, newOrder.id)
          }
        }
      )
      .subscribe((status) => {
        console.log('[OrderStatusListener] Channel subscription status:', status)
      })

    unsubscribeRef.current = () => {
      console.log('[OrderStatusListener] Unsubscribing from channel')
      supabase.removeChannel(channel).then(() => {
        console.log('[OrderStatusListener] Channel unsubscribed')
      })
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [user?.id])

  const showNotification = async (status: string, orderNum: string, orderId: string) => {
    const titles: Record<string, string> = {
      accepted: locale === 'kk' ? 'Тапсырыс қабылданды!' : 'Заказ принят!',
      preparing: locale === 'kk' ? 'Дайындалуда!' : 'Готовится!',
      ready: locale === 'kk' ? 'Тапсырыс дайын!' : 'Заказ готов!',
      on_the_way: locale === 'kk' ? 'Жолда!' : 'В пути!',
      completed: locale === 'kk' ? 'Аяқталды!' : 'Завершен!',
      cancelled: locale === 'kk' ? 'Бас тартылды' : 'Отменен',
    }

    const title = titles[status] || (locale === 'kk' ? 'Тапсырыс жаңартылды' : 'Заказ обновлен')
    const body = locale === 'kk'
      ? `#${orderNum} тапсырыс күйі: ${status}`
      : `Статус заказа #${orderNum}: ${status}`

    console.log('[OrderStatusListener] Showing notification:', { title, body, status })

    // Show toast notification
    toast.success(title, {
      description: body,
      duration: 5000,
    })

    // Show push notification with sound
    try {
      await showClientNotification({
        title,
        body,
        url: `/orders/${orderId}`,
        playSound: true,
        soundType: 'status-update',
        tag: `order-${orderId}`,
        requireInteraction: status === 'ready' || status === 'completed', // More attention for ready/completed
      })

      console.log('[OrderStatusListener] Notification sent successfully')
    } catch (error) {
      console.error('[OrderStatusListener] Error showing notification:', error)
    }
  }

  return null
}
