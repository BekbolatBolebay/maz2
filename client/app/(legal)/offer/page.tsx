'use client'

import { Header } from '@/components/layout/header'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Card, CardContent } from '@/components/ui/card'

export default function OfferPage() {
  const { locale } = useI18n()
  
  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      <Header title={locale === 'kk' ? 'Жария оферта' : 'Публичная оферта'} backButton />
      <main className="max-w-3xl mx-auto p-4 space-y-6">
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6 prose prose-sm max-w-none">
            {locale === 'kk' ? (
              <div className="space-y-4">
                <h1 className="text-xl font-bold">Жария оферта шарты</h1>
                <p>Бұл құжат "Lunar Techonology" ЖШС (бұдан әрі — Сатушы) тарапынан тауарларды немесе қызметтерді сатып алуға ниет білдірген кез келген жеке немесе заңды тұлғаға (бұдан әрі — Сатып алушы) бағытталған ресми ұсыныс болып табылады.</p>
                <h2 className="text-lg font-bold">1. Жалпы ережелер</h2>
                <p>Сатып алушының сайтта тапсырыс беруі және төлем жасауы осы Оферта шарттарын толықтай қабылдағанын білдіреді (Акцепт).</p>
                <h2 className="text-lg font-bold">2. Тапсырыс беру тәртібі</h2>
                <p>Тапсырыс сайт арқылы жүзеге асырылады. Сатып алушы өзі туралы нақты мәліметтерді көрсетуге міндетті.</p>
                <h2 className="text-lg font-bold">3. Төлем шарттары</h2>
                <p>Тауарлар мен қызметтердің бағасы сайтта теңгемен көрсетілген. Төлем FreedomPay жүйесі арқылы банк карталарымен қабылданады.</p>
                <h2 className="text-lg font-bold">4. Тараптардың жауапкершілігі</h2>
                <p>Сатушы тауардың сапасына және уақытылы жеткізілуіне жауапты. Сатып алушы көрсетілген мәліметтердің дұрыстығына жауап береді.</p>
                <p className="mt-10 font-bold">Реквизиттер:</p>
                <p>"Lunar Techonology" ЖШС<br />БИН: 260240021120<br />Мекенжай: Қызылорда облысы, Абай ауылы, Жамбыл Жабаев к-сі, 21-үй</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h1 className="text-xl font-bold">Договор публичной оферты</h1>
                <p>Настоящий документ является официальным предложением "Lunar Techonology" ЖШС (далее — Продавец) в адрес любого физического или юридического лица (далее — Покупатель) о заключении договора купли-продажи товаров или услуг.</p>
                <h2 className="text-lg font-bold">1. Общие положения</h2>
                <p>Оформление заказа и оплата на сайте означают полное и безоговорочное принятие (Акцепт) условий настоящей Оферты.</p>
                <h2 className="text-lg font-bold">2. Порядок оформления заказа</h2>
                <p>Заказ осуществляется через сайт. Покупатель обязуется предоставить достоверную информацию о себе.</p>
                <h2 className="text-lg font-bold">3. Условия оплаты</h2>
                <p>Цены указаны в тенге. Оплата принимается банковскими картами через систему FreedomPay.</p>
                <h2 className="text-lg font-bold">4. Ответственность сторон</h2>
                <p>Продавец несет ответственность за качество и своевременность услуг. Покупатель отвечает за правильность предоставленных данных.</p>
                <p className="mt-10 font-bold">Реквизиты:</p>
                <p>ТOO "Lunar Techonology"<br />БИН: 260240021120<br />Адрес: Кызылординская обл., с. Абай, ул. Жамбыла Жабаева, д. 21</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
