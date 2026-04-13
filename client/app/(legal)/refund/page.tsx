'use client'

import { Header } from '@/components/layout/header'
import { useI18n } from '@/lib/i18n/i18n-context'
import { Card, CardContent } from '@/components/ui/card'

export default function RefundPage() {
  const { locale } = useI18n()
  
  return (
    <div className="min-h-screen bg-muted/30 pb-10">
      <Header title={locale === 'kk' ? 'Қайтару шарттары' : 'Условия возврата'} backButton />
      <main className="max-w-3xl mx-auto p-4 space-y-6">
        <Card className="border-none shadow-sm rounded-2xl">
          <CardContent className="p-6 prose prose-sm max-w-none">
            {locale === 'kk' ? (
              <div className="space-y-4">
                <h1 className="text-xl font-bold">Тауарды қайтару және жеткізу шарттары</h1>
                <h2 className="text-lg font-bold">1. Жеткізу шарттары</h2>
                <p>Тапсырыстар мейрамхана жұмыс уақытында қабылданады. Жеткізу уақыты арақашықтық пен мейрамхана жұмысына байланысты 30-дан 60 минутқа дейін созылуы мүмкін.</p>
                <h2 className="text-lg font-bold">2. Тапсырысты болдырмау</h2>
                <p>Клиент тапсырыс "Дайындалуда" статусына өткенге дейін оны болдырмауға құқылы.</p>
                <h2 className="text-lg font-bold">3. Ақшаны қайтару</h2>
                <p>Егер тағам сапасыз болса немесе тапсырыс қате жеткізілсе, ақша клиенттің картасына 1-3 жұмыс күні ішінде қайтарылады. Төлем FreedomPay жүйесі арқылы қайтарылады.</p>
                <p className="mt-6 font-bold">Байланыс деректері:</p>
                <p>"Lunar Techonology" ЖШС<br />БИН: 260240021120<br />Мекенжай: Қызылорда облысы, Абай ауылы, Жамбыл Жабаев к-сі, 21-үй</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h1 className="text-xl font-bold">Условия возврата и доставки</h1>
                <h2 className="text-lg font-bold">1. Условия доставки</h2>
                <p>Заказы принимаются в рабочее время ресторана. Время доставки может составлять от 30 до 60 минут в зависимости от удаленности.</p>
                <h2 className="text-lg font-bold">2. Отмена заказа</h2>
                <p>Клиент имеет право отменить заказ до того, как он перейдет в статус "Готовится".</p>
                <h2 className="text-lg font-bold">3. Возврат денежных средств</h2>
                <p>В случае некачественного товара или ошибки в заказе, денежные средства возвращаются на карту клиента в течение 1-3 рабочих дней через систему FreedomPay.</p>
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
