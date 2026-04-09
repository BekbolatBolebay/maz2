export function getStatusNotificationDraft(status: string, orderNum: string, lang: 'kk' | 'ru') {
    const trackingUrl = `/orders` // Base URL for orders in client app

    if (lang === 'kk') {
        switch (status) {
            case 'accepted':
                return {
                    title: 'Тапсырыс қабылданды!',
                    body: `#${orderNum} тапсырысыңыз қабылданды. Дайындауды бастаймыз.`,
                    url: trackingUrl
                }
            case 'preparing':
                return {
                    title: 'Дайындалуда!',
                    body: `#${orderNum} тапсырысыңыз дайындалып жатыр.`,
                    url: trackingUrl
                }
            case 'ready':
                return {
                    title: 'Тапсырыс дайын!',
                    body: `#${orderNum} тапсырысыңыз дайын.`,
                    url: trackingUrl
                }
            case 'on_the_way':
                return {
                    title: 'Тапсырыс жолда!',
                    body: `#${orderNum} тапсырысыңызды курьер алып шықты.`,
                    url: trackingUrl
                }
            case 'completed':
                return {
                    title: 'Тапсырыс орындалды!',
                    body: `#${orderNum} тапсырысы сәтті аяқталды. Асыңыз дәмді болсын!`,
                    url: trackingUrl
                }
            default:
                return null
        }
    } else {
        switch (status) {
            case 'accepted':
                return {
                    title: 'Заказ принят!',
                    body: `Ваш заказ #${orderNum} принят. Скоро начнем готовить.`,
                    url: trackingUrl
                }
            case 'preparing':
                return {
                    title: 'Готовится!',
                    body: `Ваш заказ #${orderNum} уже готовится.`,
                    url: trackingUrl
                }
            case 'ready':
                return {
                    title: 'Заказ готов!',
                    body: `Ваш заказ #${orderNum} готов.`,
                    url: trackingUrl
                }
            case 'on_the_way':
                return {
                    title: 'Заказ в пути!',
                    body: `Курьер выехал с вашим заказом #${orderNum}.`,
                    url: trackingUrl
                }
            case 'completed':
                return {
                    title: 'Заказ выполнен!',
                    body: `Ваш заказ #${orderNum} выполнен. Приятного аппетита!`,
                    url: trackingUrl
                }
            default:
                return null
        }
    }
}

export function getReservationNotificationDraft(status: string, date: string, time: string, lang: 'kk' | 'ru') {
    const trackingUrl = `/orders?tab=bookings`

    if (lang === 'kk') {
        switch (status) {
            case 'confirmed':
                return {
                    title: 'Брондау расталды!',
                    body: `${date} күні сағат ${time} болатын брондау тексерілді және расталды.`,
                    url: trackingUrl
                }
            case 'cancelled':
                return {
                    title: 'Брондаудан бас тартылды',
                    body: `${date} күні сағат ${time} болатын брондау өкінішке орай жойылды.`,
                    url: trackingUrl
                }
            case 'awaiting_payment':
                return {
                    title: 'Төлем қажет',
                    body: `${date} күні сағат ${time} болатын брондауды растау үшін төлем жасаңыз.`,
                    url: trackingUrl
                }
            case 'completed':
                return {
                    title: 'Брондау аяқталды',
                    body: 'Бізге келіп кеткеніңізге рақмет! Сізді тағы да күтеміз.',
                    url: trackingUrl
                }
            default:
                return null
        }
    } else {
        switch (status) {
            case 'confirmed':
                return {
                    title: 'Бронирование подтверждено!',
                    body: `Ваша бронь на ${date} в ${time} успешно подтверждена.`,
                    url: trackingUrl
                }
            case 'cancelled':
                return {
                    title: 'Бронирование отменено',
                    body: `К сожалению, ваша бронь на ${date} в ${time} была отменена.`,
                    url: trackingUrl
                }
            case 'awaiting_payment':
                return {
                    title: 'Требуется оплата',
                    body: `Для подтверждения брони на ${date} в ${time} необходимо произвести оплату.`,
                    url: trackingUrl
                }
            case 'completed':
                return {
                    title: 'Бронирование завершено',
                    body: 'Спасибо, что посетили нас! Ждем вас снова.',
                    url: trackingUrl
                }
            default:
                return null
        }
    }
}
