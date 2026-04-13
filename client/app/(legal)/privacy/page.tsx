'use client'

import { Header } from '@/components/layout/header'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Card, CardContent } from '@/components/ui/card'

export default function PrivacyPage() {
  const { locale } = useI18n()
  
  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      <Header title={locale === 'kk' ? 'Құпиялылық саясаты' : 'Политика конфиденциальности'} backButton />
      <main className="max-w-3xl mx-auto p-4 space-y-6">
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6 prose prose-sm max-w-none">
            {locale === 'kk' ? (
              <div className="space-y-4">
                <h1 className="text-xl font-bold">Құпиялылық саясаты</h1>
                <p>Біз сіздің жеке деректеріңіздің қауіпсіздігіне жауапкершілікпен қараймыз.</p>
                <h2 className="text-lg font-bold">1. Қандай деректерді жинаймыз?</h2>
                <p>Тапсырыс беру кезінде біз сіздің аты-жөніңізді, телефон нөміріңізді және жеткізу мекенжайыңызды жинаймыз.</p>
                <h2 className="text-lg font-bold">2. Деректерді пайдалану мақсаты</h2>
                <p>Жиналған деректер тек тапсырысты орындау, жеткізу және сізбен байланыс орнату үшін пайдаланылады.</p>
                <h2 className="text-lg font-bold">3. Деректерді қорғау</h2>
                <p>Сіздің деректеріңіз үшінші тұлғаларға сатылмайды және заңсыз жарияланбайды. Төлем деректері FreedomPay қауіпсіз жүйесі арқылы өңделеді.</p>
                <p className="mt-6 font-bold">Байланыс деректері:</p>
                <p>"Lunar Techonology" ЖШС<br />БИН: 260240021120<br />Мекенжай: Қызылорда облысы, Абай ауылы, Жамбыл Жабаев к-сі, 21-үй</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h1 className="text-xl font-bold">Политика конфиденциальности</h1>
                <p>Мы серьезно относимся к защите ваших персональных данных.</p>
                <h2 className="text-lg font-bold">1. Какие данные мы собираем?</h2>
                <p>При оформлении заказа мы собираем ваше имя, номер телефона и адрес доставки.</p>
                <h2 className="text-lg font-bold">2. Цель использования данных</h2>
                <p>Собранные данные используются исключительно для обработки заказа, доставки и связи с вами.</p>
                <h2 className="text-lg font-bold">3. Защита данных</h2>
                <p>Ваши данные не передаются третьим лицам и не подлежат разглашению. Платежные данные обрабатываются через защищенную систему FreedomPay.</p>
                <p className="mt-6 font-bold">Контактные данные:</p>
                <p>ТOO "Lunar Techonology"<br />БИН: 260240021120<br />Адрес: Кызылординская обл., с. Абай, ул. Жамбыла Жабаева, д. 21</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
