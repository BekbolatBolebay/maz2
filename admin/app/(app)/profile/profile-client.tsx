'use client'

import { useState, useEffect, useRef } from 'react'
import { t } from '@/lib/i18n'
import { useApp } from '@/lib/app-context'
import type { Restaurant, WorkingHour, UserProfile } from '@/lib/db'
import { updateCafeSettings, updateWorkingHours, sendTestEmailAction, sendTestPushAction, saveMerchantConfigAction, updateRestaurantStatusAction, signOutAction } from '@/lib/actions'
import { toast } from 'sonner'
import { 
  Save, 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Lock, 
  Unlock, 
  PauseCircle, 
  CheckCircle2, 
  Loader2,
  CalendarDays,
  Truck,
  Bell,
  ShieldCheck,
  Download,
  Smartphone,
  Share,
  MoreVertical,
  PlusSquare,
  Sparkles,
  LogOut,
  Hash
} from 'lucide-react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ImageUpload from '@/components/ui/image-upload'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const MapPicker = dynamic(() => import('@/components/restaurant/map-picker').then(mod => mod.MapPicker), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Карта жүктелуде...</div>
})

interface ProfileClientProps {
  settings: Restaurant | null
  workingHours: WorkingHour[]
  userProfile: UserProfile | null
}

const DAYS_KK = ['Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі', 'Жексенбі']
const DAYS_RU = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

export default function ProfileClient({ settings, workingHours, userProfile }: ProfileClientProps) {
  const { lang, isInstallable, installApp } = useApp()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isTestingEmail, setIsTestingEmail] = useState(false)
  const [isTestingPush, setIsTestingPush] = useState(false)
  const [showInstallGuide, setShowInstallGuide] = useState(false)
  
  // Local state for settings
  const [cafeStatus, setCafeStatus] = useState(settings?.status || 'open')
  const [name, setName] = useState(settings?.name_ru || '')
  const [address, setAddress] = useState(settings?.address || '')
  const [baseDeliveryFee, setBaseDeliveryFee] = useState<string | number>(settings?.base_delivery_fee || 0)
  const [deliveryFeePerKm, setDeliveryFeePerKm] = useState<string | number>(settings?.delivery_fee_per_km || 0)
  const [bookingFee, setBookingFee] = useState<string | number>(settings?.booking_fee || 0)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    settings?.latitude && settings?.longitude 
      ? { lat: settings.latitude, lng: settings.longitude } 
      : null
  )
  const [isMapOpen, setIsMapOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState(settings?.image_url || '')
  const [bannerUrl, setBannerUrl] = useState(settings?.banner_url || '')
  const [isUploading, setIsUploading] = useState(false)

  // Payment & Service settings
  const [acceptCash, setAcceptCash] = useState(settings?.accept_cash ?? true)
  const [acceptKaspi, setAcceptKaspi] = useState(settings?.accept_kaspi ?? true)
  const [acceptFreedom, setAcceptFreedom] = useState(settings?.accept_freedom ?? false)
  const [kaspiLink, setKaspiLink] = useState(settings?.kaspi_link || '')
  
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(settings?.is_delivery_enabled ?? true)
  const [isPickupEnabled, setIsPickupEnabled] = useState(settings?.is_pickup_enabled ?? true)
  const [isBookingEnabled, setIsBookingEnabled] = useState(settings?.is_booking_enabled ?? true)
  
  const [freedomMerchantId, setFreedomMerchantId] = useState(settings?.freedom_merchant_id || '')
  const [freedomSecretKey, setFreedomSecretKey] = useState(settings?.freedom_payment_secret_key || '')
  const [freedomReceiptSecretKey, setFreedomReceiptSecretKey] = useState(settings?.freedom_receipt_secret_key || '')
  const [freedomTestMode, setFreedomTestMode] = useState(settings?.freedom_test_mode ?? false)
  
  // Sync state when navigating back to the page and receiving fresh props
  useEffect(() => {
    if (settings) {
      setKaspiLink(settings.kaspi_link || '');
      setFreedomMerchantId(settings.freedom_merchant_id || '');
      setFreedomSecretKey(settings.freedom_payment_secret_key || '');
      setFreedomReceiptSecretKey(settings.freedom_receipt_secret_key || '');
      setFreedomTestMode(settings.freedom_test_mode ?? false);
      setAcceptFreedom(settings.accept_freedom ?? false);
      setAcceptKaspi(settings.accept_kaspi ?? true);
    }
  }, [settings]);

  // Local state for working hours
  // Ensure we have all 7 days represented
  const [localHours, setLocalHours] = useState<Partial<WorkingHour>[]>(() => {
    const hours = [...workingHours]
    const fullWeek: Partial<WorkingHour>[] = []
    
    for (let i = 0; i < 7; i++) {
        const day = hours.find(h => h.day_of_week === (i + 1) % 7) || {
            day_of_week: (i + 1) % 7,
            open_time: '09:00',
            close_time: '23:00',
            is_day_off: false
        }
        fullWeek.push(day)
    }
    return fullWeek.sort((a, b) => {
        const aVal = (a.day_of_week === 0 ? 7 : a.day_of_week) ?? 0
        const bVal = (b.day_of_week === 0 ? 7 : b.day_of_week) ?? 0
        return aVal - bVal
    })
  })
  
  // Sync state with props when they change (e.g. after server refresh)
  useEffect(() => {
    if (settings) {
      setCafeStatus(settings.status || 'open')
      setName(settings.name_ru || '')
      setAddress(settings.address || '')
      setBaseDeliveryFee(settings.base_delivery_fee || 0)
      setDeliveryFeePerKm(settings.delivery_fee_per_km || 0)
      setBookingFee(settings.booking_fee || 0)
      setAcceptCash(settings.accept_cash ?? true)
      setAcceptKaspi(settings.accept_kaspi ?? true)
      setAcceptFreedom(settings.accept_freedom ?? false)
      setIsDeliveryEnabled(settings.is_delivery_enabled ?? true)
      setIsPickupEnabled(settings.is_pickup_enabled ?? true)
      setIsBookingEnabled(settings.is_booking_enabled ?? true)
      setKaspiLink(settings.kaspi_link || '')
      setFreedomMerchantId(settings.freedom_merchant_id || '')
      setFreedomSecretKey(settings.freedom_payment_secret_key || '')
      setFreedomReceiptSecretKey(settings.freedom_receipt_secret_key || '')
      setFreedomTestMode(settings.freedom_test_mode ?? false)
      if (settings.latitude && settings.longitude) {
        setCoords({ lat: settings.latitude, lng: settings.longitude })
      }
      setImageUrl(settings.image_url || '')
      setBannerUrl(settings.banner_url || '')
    }
  }, [settings])
  
  // Auto-save logic for numeric fields with debounce
  const initialLoad = useRef(true)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Skip on first mount or if values are empty strings (user still typing)
    if (initialLoad.current) {
      initialLoad.current = false
      return
    }

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)

    autoSaveTimer.current = setTimeout(async () => {
      try {
        await updateCafeSettings({
          base_delivery_fee: Number(baseDeliveryFee) || 0,
          delivery_fee_per_km: Number(deliveryFeePerKm) || 0,
          booking_fee: Number(bookingFee) || 0,
        }, settings?.id)
        toast.success(lang === 'kk' ? 'Сақталды' : 'Сохранено', { duration: 1000 })
      } catch (err: any) {
        toast.error(err.message)
      }
    }, 1000)

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [baseDeliveryFee, deliveryFeePerKm, bookingFee])

  // Helper for numeric inputs to avoid persistent '0'
  const handleNumericChange = (value: string, setter: (v: string | number) => void) => {
    // If user deleted everything, allow empty string so they can type freely
    if (value === '') {
      setter('')
      return
    }
    
    // Remove leading zeros if there's more than one digit
    const cleaned = value.replace(/^0+(?=\d)/, '')
    const num = Number(cleaned)
    if (!isNaN(num)) setter(cleaned === '' ? 0 : cleaned)
  }

  async function handleToggle(field: string, value: boolean, setter: (v: boolean) => void) {
    const prevValue = value
    const newValue = !value
    // Optimistic update
    setter(newValue)
    
    // For settings that no longer exist in Supabase, only save to VPS
    // Previously VPS-only fields, now moved to Supabase for cost reduction (no VPS required)
    const isVpsOnly = false; // We want everything in Supabase now

    try {
      const updates: any = { [field]: newValue };
      
      // Auto-sync booking flags if it's a payment toggle
      if (field === 'accept_cash') updates.booking_accept_cash = newValue;
      if (field === 'accept_kaspi') updates.booking_accept_kaspi = newValue;
      if (field === 'accept_freedom') updates.booking_accept_freedom = newValue;

      if (updates) {
        const { error } = await updateCafeSettings(updates, settings?.id)
        if (error) throw error
      }

      toast.success(lang === 'kk' ? 'Сақталды' : 'Сохранено', { duration: 1000 })
    } catch (err: any) {
      // Revert on error
      setter(prevValue)
      toast.error(err.message)
    }
  }

  async function handleStatusChange(newStatus: 'open' | 'closed' | 'paused') {
    const prevStatus = cafeStatus
    setCafeStatus(newStatus)
    
    try {
      const { error } = await updateCafeSettings({ status: newStatus }, settings?.id)
      if (error) throw error

      toast.success(lang === 'kk' ? 'Мәртебе жаңартылды' : 'Статус обновлен', { duration: 1000 })
    } catch (err: any) {
      setCafeStatus(prevStatus)
      toast.error(err.message)
    }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      // 1. Update settings in Supabase (ALL info now in Supabase)
      const { error: settingsError } = await updateCafeSettings({
        status: cafeStatus,
        name_ru: name,
        address: address,
        base_delivery_fee: Number(baseDeliveryFee) || 0,
        delivery_fee_per_km: Number(deliveryFeePerKm) || 0,
        booking_fee: Number(bookingFee) || 0,
        latitude: coords?.lat,
        longitude: coords?.lng,
        accept_cash: acceptCash,
        accept_kaspi: acceptKaspi,
        accept_freedom: acceptFreedom,
        is_delivery_enabled: isDeliveryEnabled,
        is_pickup_enabled: isPickupEnabled,
        is_booking_enabled: isBookingEnabled,
        image_url: imageUrl,
        banner_url: bannerUrl,
        // New merchant fields in Supabase
        freedom_merchant_id: freedomMerchantId,
        freedom_payment_secret_key: freedomSecretKey,
        freedom_receipt_secret_key: freedomReceiptSecretKey,
        freedom_test_mode: freedomTestMode,
        kaspi_link: kaspiLink,
      }, settings?.id)
      if (settingsError) throw settingsError

      } catch (err: any) {
        toast.error(err.message)
      } finally {
      setIsSaving(false)
    }
  }

  const handleHourChange = (idx: number, field: keyof WorkingHour, value: any) => {
    const newHours = [...localHours]
    newHours[idx] = { ...newHours[idx], [field]: value }
    setLocalHours(newHours)
  }

  const subscribeToPush = async () => {
    // 1. Native Android Handling (Capacitor)
    let Capacitor: any;
    try {
      Capacitor = (await import('@capacitor/core')).Capacitor;
    } catch (e) {}

    if (Capacitor && Capacitor.isNativePlatform()) {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        let permStatus = await PushNotifications.checkPermissions();
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }
        
        if (permStatus.receive !== 'granted') {
          toast.error(lang === 'kk' ? 'Хабарламаларға рұқсат берілмеді' : 'Разрешение не получено');
          return;
        }

        await PushNotifications.register();
        toast.success(lang === 'kk' ? '🔔 Пуш хабарлама тіркелуде...' : '🔔 Регистрация пуш-уведомлений...');
        return;
      } catch (err: any) {
        console.error('[NativePush] Error:', err);
        toast.error('Native Push Error: ' + err.message);
        return;
      }
    }

    // 2. Web Handling (Standard PWA)
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error(lang === 'kk' ? 'Браузер хабарламаларды қолдамайды' : 'Браузер не поддерживает уведомления')
      return
    }

    try {
      const { toast } = await import('sonner')
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error(lang === 'kk' ? 'Хабарламаларға рұқсат берілмеді' : 'Разрешение на уведомления не получено')
        return
      }

      console.log('[AdminPush] Notification permission granted. Checking service worker...');

      // 1. Ensure service worker is registered and get registration object
      let registration: ServiceWorkerRegistration | undefined;
      
      const existingRegistrations = await navigator.serviceWorker.getRegistrations();
      if (existingRegistrations.length > 0) {
        registration = existingRegistrations[0];
        console.log('[AdminPush] Using existing registration');
      } else {
        console.log('[AdminPush] No registration found, registering /sw.js...');
        try {
          registration = await navigator.serviceWorker.register('/sw.js');
          await new Promise(r => setTimeout(r, 1000));
        } catch (regError) {
          console.error('[AdminPush] Registration failed:', regError);
        }
      }

      if (!registration) {
          // One last attempt
          registration = await navigator.serviceWorker.getRegistration('/');
      }

      if (!registration) {
          throw new Error('Service Worker registration failed or not found');
      }

      // 3. Obtain Native Web-Push Subscription
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        })
      }
      console.log('[AdminPush] Native subscription obtained');

      // 4. Obtain FCM Token
      let fcmToken = null;
      try {
          const { getFcmToken } = await import('@/lib/firebase');
          fcmToken = await getFcmToken(registration);
          console.log('[AdminPush] FCM Token obtained:', fcmToken ? 'Success' : 'Failed');
      } catch (fcmErr) {
          console.warn('[AdminPush] FCM specific retrieval error:', fcmErr);
      }

      // 5. Save to Database
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        console.log('[AdminPush] Saving subscription for admin:', user.id);
        const { error } = await supabase
          .from('staff_profiles')
          .update({ 
              push_subscription: subscription as any,
              push_token: JSON.stringify(subscription),
              fcm_token: fcmToken,
              updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (error) throw error
        
        if (subscription && !fcmToken) {
            console.log('[AdminPush] Registered with Native Push only (FCM skipped/failed)');
            toast.success(lang === 'kk' ? 'Хабарламалар қосылды (Native)' : 'Уведомления включены (Native)')
        } else {
            toast.success(lang === 'kk' ? 'Хабарламалар сәтті қосылды' : 'Уведомления успешно включены')
        }
      }
    } catch (error: any) {
      console.error('[AdminPush] Overall registration error:', error)
      toast.error(lang === 'kk' ? `Қате шықты: ${error.message}` : `Ошибка: ${error.message}`)
    }
  }

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    try {
        const result = await sendTestEmailAction();
        if (result.success) {
            toast.success(lang === 'kk' ? 'Тест хабарламасы поштаңызға жіберілді!' : 'Тестовое письмо отправлено на вашу почту!');
        } else {
            toast.error(result.error);
        }
    } finally {
        setIsTestingEmail(false);
    }
  };

  const handleTestPush = async () => {
    setIsTestingPush(true);
    try {
        let Capacitor: any;
        try {
          Capacitor = (await import('@capacitor/core')).Capacitor;
        } catch (e) {}
        
        if (Capacitor && Capacitor.isNativePlatform()) {
            // On native platforms, we don't use Service Workers for push
            // The server will use the stored fcm_token from staff_profiles
            result = await sendTestPushAction();
        } else {
            // Web Handling
            if (!('serviceWorker' in navigator)) {
                throw new Error('Service Worker not supported in this browser');
            }
            const registration = await navigator.serviceWorker.ready;
            const currentSub = await registration.pushManager.getSubscription();
            result = await sendTestPushAction(currentSub ? JSON.parse(JSON.stringify(currentSub)) : null);
        }

        if (result.success) {
            toast.success(lang === 'kk' ? 'Push-хабарлама жіберілді!' : 'Push-уведомление отправлено!');
        } else {
            toast.error(result.error);
        }
    } catch (err: any) {
        console.error('[TestPush] Error:', err);
        toast.error(err.message || 'Error testing push');
    } finally {
        setIsTestingPush(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm(lang === 'kk' ? 'Шығуды растайсыз ба?' : 'Вы уверены, что хотите выйти?')) {
      setIsLoggingOut(true)
      try {
        await signOutAction()
        router.refresh()
        router.push('/login')
      } catch (err) {
        toast.error('Error signing out')
      } finally {
        setIsLoggingOut(false)
      }
    }
  }

  return (
    <div className="container max-w-4xl py-4 sm:py-10 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t(lang, 'profile')}</h1>
          <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSignOut}
            disabled={isLoggingOut}
            className="inline-flex items-center justify-center rounded-xl text-sm font-black ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent text-muted-foreground hover:text-foreground h-12 sm:h-10 px-4 py-2 gap-2 active:scale-95"
          >
            {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            {t(lang, 'logout')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-xl text-sm font-black ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 sm:h-10 px-6 sm:px-4 py-2 gap-2 shadow-lg shadow-primary/20 active:scale-95"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t(lang, 'save')}
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Professional App Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
               <Sparkles className="w-4 h-4 text-primary" />
               {lang === 'kk' ? 'Қолданба мүмкіндіктері' : 'Возможности приложения'}
            </h3>
          </div>
          
          <Card className="bg-slate-950 border-none overflow-hidden text-white shadow-2xl shadow-black/40 group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-blue-600/10 opacity-50 group-hover:opacity-70 transition-opacity" />
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black tracking-tighter uppercase italic">Mazir Admin App</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest opacity-80">
                    {lang === 'kk' 
                       ? 'Мейрамхананы телефоннан басқару әлдеқайда ыңғайлы' 
                       : 'Управлять рестораном с телефона намного удобнее'}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                   <Button 
                     onClick={subscribeToPush}
                     variant="outline"
                     className="flex-1 md:flex-none h-12 px-6 rounded-2xl bg-white/10 border-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-[10px] backdrop-blur-md active:scale-95 transition-all"
                   >
                     <Bell className="w-4 h-4 mr-2" />
                     {lang === 'kk' ? 'Пуш қосу' : 'Включить пуш'}
                   </Button>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/10 pt-8">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Нақты уақыттағы тапсырыстар</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                       <Smartphone className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">PWA Технологиясы</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                       <Bell className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Жедел хабарламалар</span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Images Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">{lang === 'kk' ? 'Брендинг (Суреттер)' : 'Брендинг (Изображения)'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-lg border bg-card">
            <div className="space-y-4">
              <label className="text-sm font-medium leading-none">{lang === 'kk' ? 'Логотип (1:1)' : 'Логотип (1:1)'}</label>
              <ImageUpload
                value={imageUrl}
                onChange={setImageUrl}
                onUploadStart={() => setIsUploading(true)}
                onUploadEnd={() => setIsUploading(false)}
                aspectRatio="square"
                label={lang === 'kk' ? 'Логотипті жүктеу' : 'Загрузить логотип'}
              />
            </div>
            <div className="space-y-4">
              <label className="text-sm font-medium leading-none">{lang === 'kk' ? 'Баннер (16:9)' : 'Баннер (16:9)'}</label>
              <ImageUpload
                value={bannerUrl}
                onChange={setBannerUrl}
                onUploadStart={() => setIsUploading(true)}
                onUploadEnd={() => setIsUploading(false)}
                aspectRatio="video"
                label={lang === 'kk' ? 'Баннерді жүктеу' : 'Загрузить баннер'}
              />
            </div>
          </div>
        </section>

        {/* Status Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">{t(lang, 'cafeStatus')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'open', label: t(lang, 'open'), icon: Unlock },
              { id: 'closed', label: t(lang, 'closed'), icon: Lock },
              { id: 'paused', label: t(lang, 'paused'), icon: PauseCircle },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => handleStatusChange(s.id as any)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border transition-all",
                  cafeStatus === s.id 
                    ? "border-primary bg-primary/5 ring-1 ring-primary" 
                    : "bg-card hover:bg-accent"
                )}
              >
                <div className={cn(
                  "p-2 rounded-md",
                  cafeStatus === s.id ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Working Hours Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">{t(lang, 'workingHours')}</h3>
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-0">
              <div className="divide-y">
                {localHours.map((hour, idx) => (
                  <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center font-black text-[10px] uppercase tracking-widest shrink-0 border border-border/50">
                        {lang === 'kk' ? DAYS_KK[idx].slice(0, 2) : DAYS_RU[idx].slice(0, 3)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-xs uppercase tracking-wider">{lang === 'kk' ? DAYS_KK[idx] : DAYS_RU[idx]}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {hour.is_day_off ? t(lang, 'dayOff') : `${hour.open_time} - ${hour.close_time}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                      {!hour.is_day_off && (
                        <div className="flex items-center gap-2 flex-1 sm:flex-none">
                          <input 
                            type="time" 
                            value={hour.open_time || '09:00'} 
                            onChange={(e) => handleHourChange(idx, 'open_time', e.target.value)}
                            className="flex h-10 w-full sm:w-24 rounded-xl border border-input bg-muted/20 px-3 py-2 text-xs font-bold shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                          <span className="text-muted-foreground">—</span>
                          <input 
                            type="time" 
                            value={hour.close_time || '23:00'} 
                            onChange={(e) => handleHourChange(idx, 'close_time', e.target.value)}
                            className="flex h-10 w-full sm:w-24 rounded-xl border border-input bg-muted/20 px-3 py-2 text-xs font-bold shadow-sm transition-all focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleHourChange(idx, 'is_day_off', !hour.is_day_off)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          !hour.is_day_off ? "bg-primary" : "bg-input"
                        )}
                      >
                        <span className={cn(
                          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
                          !hour.is_day_off ? "translate-x-5" : "translate-x-0"
                        )} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Basic Info */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">{t(lang, 'basicInfo')}</h3>
          <div className="grid gap-4 p-6 rounded-lg border bg-card">
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t(lang, 'name')} (RU)
              </label>
              <input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Название вашего заведения"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                {t(lang, 'address')}
              </label>
              <div className="flex gap-2">
                <input 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Город, улица, дом"
                />
                <button
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2 shrink-0"
                  title={t(lang, 'selectOnMap')}
                >
                  <MapPin className="w-4 h-4" />
                </button>
              </div>
              {coords && (
                <p className="text-[10px] text-muted-foreground italic">
                  Координаты: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>
        </section>

        <MapPicker 
          open={isMapOpen}
          onOpenChange={setIsMapOpen}
          onSelect={(lat, lng, addr) => {
            setCoords({ lat, lng })
            if (addr) setAddress(addr)
          }}
          initialCoords={coords}
        />

        {/* Payment Methods */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">{t(lang, 'paymentMethods')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'accept_cash', label: t(lang, 'cash'), active: acceptCash, setter: setAcceptCash },
              { id: 'accept_kaspi', label: 'Kaspi QR', active: acceptKaspi, setter: setAcceptKaspi },
              { id: 'accept_freedom', label: 'Freedom Pay', active: acceptFreedom, setter: setAcceptFreedom },
            ].map((p) => (
              <div key={p.id} className="space-y-3">
                <button
                  onClick={() => handleToggle(p.id, p.active, p.setter)}
                  className={cn(
                    "flex items-center justify-between p-4 w-full rounded-lg border transition-all",
                    p.active 
                      ? "border-primary bg-primary/5 ring-1 ring-primary" 
                      : "bg-card hover:bg-accent"
                  )}
                >
                  <span className="font-medium">{p.label}</span>
                  <div className={cn(
                    "w-10 h-6 rounded-full relative transition-colors",
                    p.active ? "bg-primary" : "bg-muted"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                      p.active ? "left-5" : "left-1"
                    )} />
                  </div>
                </button>

                {p.id === 'accept_kaspi' && p.active && (
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">
                        {t(lang, 'kaspiLink')}
                      </label>
                      <input 
                        value={kaspiLink}
                        onChange={(e) => setKaspiLink(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="https://kaspi.kz/pay/..."
                      />
                    </div>
                  </div>
                )}

                {p.id === 'accept_freedom' && p.active && (
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">
                        Freedom Merchant ID
                      </label>
                      <input 
                        value={freedomMerchantId}
                        onChange={(e) => setFreedomMerchantId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="123456789"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">
                        Freedom Secret Key
                      </label>
                      <input 
                        type="password"
                        value={freedomSecretKey}
                        onChange={(e) => setFreedomSecretKey(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="••••••••••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">
                        Freedom Receipt Secret Key (optional)
                      </label>
                      <input 
                        type="password"
                        value={freedomReceiptSecretKey}
                        onChange={(e) => setFreedomReceiptSecretKey(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        placeholder="••••••••••••••••"
                      />
                    </div>
                    {/* Freedom Pay Test Mode Toggle Removed as requested by user */}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Services Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">{t(lang, 'services')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {[
                { id: 'is_delivery_enabled', label: t(lang, 'deliveryService'), active: isDeliveryEnabled, setter: setIsDeliveryEnabled },
                { id: 'is_pickup_enabled', label: t(lang, 'pickupService'), active: isPickupEnabled, setter: setIsPickupEnabled },
                { id: 'is_booking_enabled', label: t(lang, 'bookingService'), active: isBookingEnabled, setter: setIsBookingEnabled },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleToggle(s.id, s.active, s.setter)}
                  className={cn(
                    "flex items-center justify-between p-4 w-full rounded-lg border transition-all",
                    s.active 
                      ? "border-primary bg-primary/5 ring-1 ring-primary" 
                      : "bg-card hover:bg-accent"
                  )}
                >
                  <span className="font-medium">{s.label}</span>
                  <div className={cn(
                    "w-10 h-6 rounded-full relative transition-colors",
                    s.active ? "bg-primary" : "bg-muted"
                  )}>
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                      s.active ? "left-5" : "left-1"
                    )} />
                  </div>
                </button>
              ))}
            </div>

            {/* Courier & Delivery Fees */}
            <div className={cn(
              "p-6 rounded-lg border bg-card space-y-6 transition-all",
              !isDeliveryEnabled && "opacity-50 grayscale pointer-events-none"
            )}>
              <div className="flex items-center gap-3 text-primary">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Truck className="w-5 h-5" />
                </div>
                <h4 className="font-semibold">{t(lang, 'deliveryService')}</h4>
              </div>

              <div className="grid gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    {lang === 'kk' ? 'Базалық тариф' : 'Базовый тариф'}
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={baseDeliveryFee}
                      onChange={(e) => handleNumericChange(e.target.value, setBaseDeliveryFee)}
                      className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-lg font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="450"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₸</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    {lang === 'kk' ? '1 км үшін ақы' : 'Цена за 1 км'}
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={deliveryFeePerKm}
                      onChange={(e) => handleNumericChange(e.target.value, setDeliveryFeePerKm)}
                      className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-lg font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="100"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₸/км</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase">
                    {lang === 'kk' ? 'Орын брондау ақысы' : 'Плата за бронирование'}
                  </label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={bookingFee}
                      onChange={(e) => handleNumericChange(e.target.value, setBookingFee)}
                      className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-lg font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="0"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₸</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* App Settings */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">{t(lang, 'settings')}</h3>
          <div className="grid gap-6 p-6 rounded-lg border bg-card">
            <div className="grid gap-3">
              <p className="text-sm font-medium">{t(lang, 'appLanguage')}</p>
              <div className="flex gap-2">
                {[
                  { id: 'kk', label: 'Қазақша' },
                  { id: 'ru', label: 'Русский' }
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      localStorage.setItem('cafe_lang', l.id)
                      window.location.reload()
                    }}
                    className={cn(
                      "flex-1 h-10 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                      lang === l.id 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PWA Install Section */}
        {isInstallable && (
          <section className="space-y-4 animate-in fade-in slide-in-from-bottom-5 duration-700">
            <h3 className="text-lg font-medium">{lang === 'kk' ? 'Мобильді қосымша' : 'Мобильное приложение'}</h3>
            <div className="relative overflow-hidden p-6 rounded-[2rem] border-2 border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card shadow-xl shadow-primary/5 group transition-all hover:shadow-primary/10">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <Smartphone className="w-40 h-40 text-primary" />
              </div>
              
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="p-4 bg-primary rounded-2xl text-primary-foreground shadow-lg shadow-primary/30 group-hover:rotate-6 transition-transform">
                    <Download className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-black tracking-tight">{t(lang, 'downloadApp')}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-md italic">
                      {t(lang, 'installAppDesc')}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={installApp}
                  className="inline-flex items-center justify-center rounded-2xl text-sm font-black ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 gap-3 shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 whitespace-nowrap"
                >
                  <Smartphone className="w-5 h-5" />
                  {t(lang, 'installApp')}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Push Notifications Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-medium">{lang === 'kk' ? 'Хабарламалар' : 'Уведомления'}</h3>
          <div className="flex items-center justify-between p-6 rounded-lg border bg-card">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl text-primary">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold">{lang === 'kk' ? 'Push-хабарламалар' : 'Push-уведомления'}</p>
                <p className="text-sm text-muted-foreground max-w-[300px]">
                  {lang === 'kk' 
                    ? 'Жаңа тапсырыстар мен брондаулар туралы нақты уақыт режимінде біліп отырыңыз' 
                    : 'Узнавайте о новых заказах и бронированиях в реальном времени'}
                </p>
              </div>
            </div>
            <button
              onClick={subscribeToPush}
              className="inline-flex items-center justify-center rounded-full text-sm font-black ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              {lang === 'kk' ? 'Қосу' : 'Включить'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <button
                onClick={handleTestEmail}
                disabled={isTestingEmail}
                className="flex items-center justify-center gap-2 p-4 rounded-xl border bg-card hover:bg-accent transition-all disabled:opacity-50"
            >
                {isTestingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                <span className="text-sm font-bold">
                    {lang === 'kk' ? 'Email-ді тексеру' : 'Проверить Email'}
                </span>
            </button>
            <button
                onClick={handleTestPush}
                disabled={isTestingPush}
                className="flex items-center justify-center gap-2 p-4 rounded-xl border bg-card hover:bg-accent transition-all disabled:opacity-50"
            >
                {isTestingPush ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                <span className="text-sm font-bold">
                    {lang === 'kk' ? 'Push-ты тексеру' : 'Проверить Push'}
                </span>
            </button>
          </div>

          {/* Diagnostic Info */}
          <div className="mt-8 p-6 rounded-2xl border bg-slate-50/50 dark:bg-slate-900/50 space-y-4">
              <div className="flex items-center gap-2 text-slate-500">
                  <Hash className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Диагностика (Debug)</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border shadow-sm">
                      <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Platform</p>
                      <p className="text-sm font-bold">Web Browser (PWA)</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border shadow-sm">
                      <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">FCM Status</p>
                      <p className={cn(
                          "text-sm font-bold",
                          profile?.fcm_token ? "text-green-600" : "text-red-500"
                      )}>
                          {profile?.fcm_token ? 'Registered ✅' : 'Not Found ❌'}
                      </p>
                  </div>
              </div>

              {/* Native Push Debug Options removed to avoid sync Capacitor call */}
          </div>
        </section>

        {/* Install Guide Modal (iOS ONLY) */}
        <Dialog open={showInstallGuide} onOpenChange={setShowInstallGuide}>
          <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 mx-auto">
            <DialogHeader className="space-y-4 pt-4">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center shadow-inner">
                  <Smartphone className="w-10 h-10 text-primary" />
                </div>
              </div>
              <DialogTitle className="text-center text-2xl font-black tracking-tight uppercase italic">
                {lang === 'kk' ? 'Орнату нұсқаулығы' : 'Инструкция по установке'}
              </DialogTitle>
              <DialogDescription className="text-center font-black text-[10px] uppercase tracking-widest text-muted-foreground/60">
                {lang === 'kk' 
                  ? 'iPhone-ға қосымшаны қосу үшін мына қадамдарды орындаңыз:' 
                  : 'Для добавления приложения на iPhone выполните следующие действия:'}
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 flex flex-col gap-4">
               <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                    <Share className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-wide leading-snug">
                    {lang === 'kk' ? '1. Safari-де "Бөлісу" батырмасын басыңыз' : '1. Нажмите "Поделиться" в Safari'}
                  </p>
               </div>
               <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                    <PlusSquare className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-wide leading-snug">
                    {lang === 'kk' ? '2. "Бас экранға қосу" таңдаңыз' : '2. Выберите "На экран Домой"'}
                  </p>
               </div>
            </div>

            <div className="flex justify-center pb-6 px-6">
              <Button
                onClick={() => setShowInstallGuide(false)}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                ОК
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
