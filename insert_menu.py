import urllib.request, json

URL = "https://wuhefcbofaoqvsrejcjc.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aGVmY2JvZmFvcXZzcmVqY2pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxNDA1MSwiZXhwIjoyMDg2OTkwMDUxfQ.AZp4tZTkKE6_1nvZLmvq-yDF8vfyEtW0mXUB2zYDIqo"
CAFE = "668a3d32-4b3e-415c-a720-857748947f7e"

# Category IDs
CAT = {
    "breakfast": "bdf33b92-591e-41ff-b292-dfe53b608db4",
    "bread":     "5a6bb336-62b1-40d1-bedf-3444b5876b75",
    "sides":     "2f72c773-de7c-48d7-a11b-a8ab161497b1",
    "sauce":     "f46ef8ab-16fa-40a2-b8d0-04075fb5d3a6",
    "appetizer": "f9c74f41-452e-48ee-9711-01563135cfed",
    "chef_salad":"b5260bc5-a511-4f03-b5cc-7201ee7cdf94",
    "mayo_salad":"c987a65a-bf29-4b54-8007-a981119dab7a",
    "salad":     "d2eceb7b-e537-4516-ba48-fa64a674e342",
}

items = [
    # ТАҢҒЫ АС
    {"name_kk":"Ірімшік қосылған омлет","name_ru":"Омлет с сыром","price":1890,"cat":"breakfast"},
    {"name_kk":"Саңырауқұлақ қосылған омлет","name_ru":"Омлет с грибами","price":1890,"cat":"breakfast"},
    {"name_kk":"Көкөніс қосылған омлет","name_ru":"Омлет с овощами","price":1890,"cat":"breakfast"},
    {"name_kk":"Сүтке пісген күріш ботқасы","name_ru":"Каша рисовая на молоке","price":990,"cat":"breakfast"},
    {"name_kk":"Сұлы ботқасы","name_ru":"Каша овсяная","price":990,"cat":"breakfast"},
    {"name_kk":"Шакшука","name_ru":"Шакшука","price":2890,"cat":"breakfast"},
    {"name_kk":"Ауыл тағамы","name_ru":"Блюдо по-деревенски","price":1990,"cat":"breakfast"},
    {"name_kk":"Шпинат қосылған жұмыртқалы брускет","name_ru":"Брускетта с яйцом и шпинатом","price":2890,"cat":"breakfast"},
    {"name_kk":"Ертегідей құймақ","name_ru":"Блины из сказки","price":1990,"cat":"breakfast"},
    {"name_kk":"Скрэмбл саңырауқұлақ тұздығымен","name_ru":"Скрэмбл в грибном соусе","price":3290,"cat":"breakfast"},
    {"name_kk":"Жеңіл тұздалған албырт қосылған құймақтар","name_ru":"Блинчики с малосоленой семгой","price":4190,"cat":"breakfast"},
    {"name_kk":"Тауық етінен ысталған шұжықтар","name_ru":"Копченые куриные колбаски","price":3290,"cat":"breakfast"},
    {"name_kk":"Түріктерше пісірілген жұмыртқа","name_ru":"Яйцо по-турецки","price":2390,"cat":"breakfast"},
    {"name_kk":"Шеф ұсынған сиыр етінің деликатесі","name_ru":"Деликатесы из говядины от шефа","price":3690,"cat":"breakfast"},
    {"name_kk":"Американо таңғы асы","name_ru":"Завтрак Американо","price":4490,"cat":"breakfast"},
    {"name_kk":"Нью-Йорк жартылай ысталған жылқы еті","name_ru":"Нью-Йорк из конины","price":3990,"cat":"breakfast"},
    {"name_kk":"Жеңіл таңғы ас","name_ru":"Легкий завтрак","price":1890,"cat":"breakfast"},
    {"name_kk":"Сүзбелі құймақтар","name_ru":"Сырники","price":1990,"cat":"breakfast"},
    # НАН
    {"name_kk":"Шелпек","name_ru":"Лепешки","price":490,"cat":"bread"},
    {"name_kk":"Ақ тоқаш","name_ru":"Белые булочки","price":590,"cat":"bread"},
    {"name_kk":"Қара тоқаш","name_ru":"Черные булочки","price":590,"cat":"bread"},
    {"name_kk":"Гриссини","name_ru":"Гриссини","price":490,"cat":"bread"},
    {"name_kk":"Бауырсақ","name_ru":"Баурсаки","price":890,"cat":"bread"},
    {"name_kk":"Етпен самса 4 дана","name_ru":"Самса с мясом 4 шт","price":1990,"cat":"bread"},
    {"name_kk":"Шибөректер 7 дана","name_ru":"Мини чебуреки 7 шт","price":2290,"cat":"bread"},
    {"name_kk":"Нан түржинағы","name_ru":"Хлеб ассорти","price":2690,"cat":"bread"},
    {"name_kk":"Сарымсақ қосылған багет","name_ru":"Чесночный багет","price":1890,"cat":"bread"},
    {"name_kk":"Үлкен нан түржинағы","name_ru":"Большое хлебное ассорти","price":4590,"cat":"bread"},
    # АСҚОСПАЛАР
    {"name_kk":"Күріш","name_ru":"Рис припущенный","price":1190,"cat":"sides"},
    {"name_kk":"Көкөніс қосылған күріш","name_ru":"Рис с овощами","price":1290,"cat":"sides"},
    {"name_kk":"Картоп езбесі","name_ru":"Картофельное пюре","price":1190,"cat":"sides"},
    {"name_kk":"Фри","name_ru":"Фри","price":1190,"cat":"sides"},
    {"name_kk":"Отта піскен картоп","name_ru":"Картофель по-деревенски","price":1290,"cat":"sides"},
    {"name_kk":"Домалақ картоптар","name_ru":"Картофельные шарики","price":1290,"cat":"sides"},
    {"name_kk":"Пияз қосылған сақинашалар","name_ru":"Луковые кольца","price":1190,"cat":"sides"},
    {"name_kk":"Көкөніс грилі","name_ru":"Овощи гриль","price":2690,"cat":"sides"},
    {"name_kk":"Бұлғұр","name_ru":"Булгур","price":1190,"cat":"sides"},
    {"name_kk":"Арпа жармасы","name_ru":"Перловка","price":1190,"cat":"sides"},
    {"name_kk":"Қарақұмық","name_ru":"Гречка","price":1190,"cat":"sides"},
    # ТҰЗДЫҚ
    {"name_kk":"Сарымсақ тұздығы","name_ru":"Чесночный соус","price":690,"cat":"sauce"},
    {"name_kk":"Қызанақ тұздығы","name_ru":"Томатный соус","price":690,"cat":"sauce"},
    {"name_kk":"Саңырауқұлақ тұздығы","name_ru":"Грибной соус","price":690,"cat":"sauce"},
    {"name_kk":"Кілегей тұздығы","name_ru":"Сливочный соус","price":690,"cat":"sauce"},
    {"name_kk":"Ірімшік тұздығы","name_ru":"Сырный соус","price":690,"cat":"sauce"},
    {"name_kk":"Нью-Йорк соусы","name_ru":"Соус Нью-Йорк","price":690,"cat":"sauce"},
    {"name_kk":"Барбекю соусы","name_ru":"Соус Барбекю","price":690,"cat":"sauce"},
    {"name_kk":"Тар-тар соусы","name_ru":"Соус Тар-тар","price":690,"cat":"sauce"},
    {"name_kk":"Демиглас соусы","name_ru":"Соус Демиглас","price":690,"cat":"sauce"},
    # ТІСКЕБАСАРЛАР
    {"name_kk":"Қазақы ет түржинағы","name_ru":"Казахское плато","price":8990,"cat":"appetizer"},
    {"name_kk":"Тауық еті түржинағы","name_ru":"Куриное плато","price":6990,"cat":"appetizer"},
    {"name_kk":"Жеміс түржинағы","name_ru":"Фруктовое ассорти","price":7490,"cat":"appetizer"},
    # БАС АСПАЗ САЛАТТАРЫ
    {"name_kk":"Бас аспаз ұсынған авторлық салат","name_ru":"Авторский салат от шефа","price":3090,"cat":"chef_salad"},
    {"name_kk":"Бас аспаз ұсынған Цезарь салаты","name_ru":"Цезарь салат от шефа","price":3990,"cat":"chef_salad"},
    {"name_kk":"Жылқы етінен жылы салат","name_ru":"Тёплый салат из конины","price":3890,"cat":"chef_salad"},
    {"name_kk":"Фриден жасалған салат","name_ru":"Салат с фри","price":3290,"cat":"chef_salad"},
    # МАЙОНЕЗДЕГІ САЛАТТАР
    {"name_kk":"Майшабақ қосылған салат","name_ru":"Сельдь под шубой","price":2890,"cat":"mayo_salad"},
    {"name_kk":"Арафат салаты","name_ru":"Арафат салат","price":3890,"cat":"mayo_salad"},
    {"name_kk":"Малибу","name_ru":"Малибу","price":2990,"cat":"mayo_salad"},
    {"name_kk":"Оливье","name_ru":"Оливье","price":2990,"cat":"mayo_salad"},
    {"name_kk":"Тауық еті қосылған цезарь","name_ru":"Цезарь с курицей","price":3890,"cat":"mayo_salad"},
    {"name_kk":"Әйел назы салаты","name_ru":"Салат Дамский каприз","price":2990,"cat":"mayo_salad"},
    {"name_kk":"Ер мінезі","name_ru":"Мужской каприз","price":3290,"cat":"mayo_salad"},
    # САЛАТТАР
    {"name_kk":"Асшаяндары қосылған руккола","name_ru":"Руккола с креветками","price":3790,"cat":"salad"},
    {"name_kk":"Бұзау еті қосылған салат","name_ru":"Салат с телятиной","price":3890,"cat":"salad"},
    {"name_kk":"Махаббатпен жасалған салат","name_ru":"Салат с любовью","price":2990,"cat":"salad"},
    {"name_kk":"Баялды қосылған қытырлақ салат","name_ru":"Хрустящий салат с баклажаном","price":2590,"cat":"salad"},
    {"name_kk":"Грек салаты","name_ru":"Греческий салат","price":2990,"cat":"salad"},
    {"name_kk":"Дәмді салаты","name_ru":"Салат Пикантный","price":3190,"cat":"salad"},
    {"name_kk":"Қызылша салаты","name_ru":"Свекольный салат","price":2390,"cat":"salad"},
    {"name_kk":"Руккола мен ірімшік қосылып бұқтырылған қызылша","name_ru":"Запеченная свекла с рукколой и сыром","price":3290,"cat":"salad"},
    {"name_kk":"Кемпірқосақ түсті салат","name_ru":"Радуга цвета","price":2690,"cat":"salad"},
    {"name_kk":"Кавказдық кесінділер","name_ru":"Кавказская нарезка","price":3590,"cat":"salad"},
    {"name_kk":"Балғын салат","name_ru":"Свежий салат","price":1990,"cat":"salad"},
    {"name_kk":"Ачичук","name_ru":"Ачичук","price":1890,"cat":"salad"},
    {"name_kk":"Жеміс салаты","name_ru":"Фруктовый салат","price":2590,"cat":"salad"},
]

headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

ok = 0
fail = 0
for i, item in enumerate(items):
    row = {
        "cafe_id": CAFE,
        "category_id": CAT[item["cat"]],
        "name_kk": item["name_kk"],
        "name_ru": item["name_ru"],
        "name_en": item["name_ru"],
        "description_kk": "",
        "description_ru": "",
        "description_en": "",
        "price": item["price"],
        "is_available": True,
        "is_popular": False,
        "is_stop_list": False,
        "preparation_time": 15,
        "sort_order": i,
    }
    data = json.dumps(row).encode()
    req = urllib.request.Request(f"{URL}/rest/v1/menu_items", data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            ok += 1
            print(f"✅ {item['name_ru']}")
    except Exception as e:
        fail += 1
        print(f"❌ {item['name_ru']}: {e}")

print(f"\n✅ Қосылды: {ok} | ❌ Қате: {fail}")
