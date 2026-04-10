# v0.dev арқылы Админ Панель жасау нұсқаулығы

Сіз **v0.dev** қолданып заманауи және әдемі админ панельді жылдам жасай аласыз. Оны біздің дайын backend-пен байланыстыру үшін мына қадамдарды орындаңыз:

## 1. v0.dev үшін Промпт (Prompt) үлгісі

v0-ге не керек екенін түсінікті етіп айту үшін мына промптты қолданыңыз:

> "Create a modern admin dashboard for a food delivery app using Next.js, Tailwind CSS, and Lucide icons. It should include:
> 1. A sidebar with navigation: Dashboard, Restaurants, Menu Items, Orders, Users, Promotions.
> 2. A 'Restaurants' page with a table showing list of restaurants and an 'Add New' button.
> 3. An 'Add Restaurant' modal/form with fields: Name (EN/RU), Description (EN/RU), Address, Phone, Categories (tags), and Image Upload.
> 4. An 'Orders' page with real-time status badges (Pending, Preparing, Ready, Delivered).
> Use a clean, professional aesthetic with a soft light/dark mode support."

## 2. Backend-пен байланыстыру (API Integration)

v0 жасап берген кодты жобаға қосқан соң, деректерді алу үшін біздің дайын API-ді қолданыңыз. Барлық API мәліметтері [ADMIN_API.md](file:///home/bekbolat/Жүктемелер/food-app-build/ADMIN_API.md) файлында жазылған.

**Мысалы, мейрамханалар тізімін алу (Fetch):**
```typescript
const fetchRestaurants = async () => {
  const response = await fetch('/api/admin/restaurants');
  const data = await response.json();
  if (data.authorized) {
    setRestaurants(data.restaurants);
  }
};
```

## 3. Аутентификация (Authentication)

Админ панель тек админдерге қолжетімді болуы керек. 
- Жүйе **Supabase Auth** қолданады.
- Пайдаланушының **role** бағаны `admin` болуы тиіс.
- API-ге сұраныс жібергенде `lib/auth/admin.ts` файлындағы `verifyAdmin()` функциясы автоматты түрде тексереді.

## 4. Маңызды файлдар мен папкалар

v0-ден алған кодтарды мына жерлерге орналастырған дұрыс:
- **Беттер (Pages):** `app/admin/...` папкасына.
- **Компоненттер:** `components/admin/...` папкасына.
- **Функциялар:** API-лер `app/api/admin/...` ішінде дайын тұр.

## 5. Негізгі талаптар

1. **Екі тілділік (I18n):** Біздің `useI18n()` хугын қолданып, админ панельді де қазақ/орыс/ағылшын тілдерінде жасауға болады.
2. **Суреттерді жүктеу:** Суреттер үшін Cloudflare R2 дайын тұр. API: `/api/upload`.
3. **Real-time:** Тапсырыстарды бақылау үшін Supabase-тің real-time мүмкіндігін қосуға болады (мысалы, `orders` кестесін тыңдау).

Егер v0-ден нақты бір беттің кодын алсаңыз, маған жіберіңіз, мен оны backend-пен толық жалғап беремін!
