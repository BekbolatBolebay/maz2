import urllib.request, json

URL = "https://wuhefcbofaoqvsrejcjc.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aGVmY2JvZmFvcXZzcmVqY2pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxNDA1MSwiZXhwIjoyMDg2OTkwMDUxfQ.AZp4tZTkKE6_1nvZLmvq-yDF8vfyEtW0mXUB2zYDIqo"
CAFE = "668a3d32-4b3e-415c-a720-857748947f7e"

CAT = {
    "soup":       "da667537-b35e-461b-aee0-2ee01f07507a",
    "national":   "1a05048d-0ecf-4931-a7f9-b776fbd5fcec",
    "chef":       "85114f79-c0ed-47b9-a98d-019febd12be9",
    "main":       "583ead33-89a8-4db1-a627-67d5df6fd0d7",
    "central":    "d1c6550b-b35e-4717-a00e-e7d2281300a8",
}

items = [
    # СОРПАЛАР
    {"name_kk":"Борщ","name_ru":"Борщ","price":1890,"cat":"soup"},
    {"name_kk":"Нарын","name_ru":"Нарын","price":2290,"cat":"soup"},
    {"name_kk":"Қазақша сорпа","name_ru":"Сорпа по-казахски","price":2290,"cat":"soup"},
    {"name_kk":"Қой еті сорпасы","name_ru":"Шурпа из баранины","price":2990,"cat":"soup"},
    {"name_kk":"Үй түшпарасы","name_ru":"Пельмени по-домашнему","price":2190,"cat":"soup"},
    {"name_kk":"Фрикаделька қосылған сорпа","name_ru":"Суп с фрикадельками","price":1990,"cat":"soup"},
    {"name_kk":"Харчо","name_ru":"Харчо","price":1990,"cat":"soup"},
    {"name_kk":"Балық сорпасы","name_ru":"Суп из рыбы","price":2990,"cat":"soup"},
    {"name_kk":"Жасымық сорпасы","name_ru":"Крем-суп чечевичный","price":1990,"cat":"soup"},
    {"name_kk":"Солянка","name_ru":"Солянка","price":2390,"cat":"soup"},
    {"name_kk":"Сиыр еті қосылған кеспе","name_ru":"Говяжья лапша","price":1690,"cat":"soup"},
    {"name_kk":"Тауық еті қосылған кеспе","name_ru":"Куриная лапша","price":1890,"cat":"soup"},
    {"name_kk":"Асқабақ сорпасы","name_ru":"Тыквенный суп","price":1890,"cat":"soup"},
    {"name_kk":"Арафат көжесі","name_ru":"Коже Арафат","price":2990,"cat":"soup"},
    # ҰЛТТЫҚ ТАҒАМДАР
    {"name_kk":"Сиыр етінен әсіп","name_ru":"Асип говяжий","price":2890,"cat":"national"},
    {"name_kk":"Жылқы қабырғасынан қуырдақ","name_ru":"Куырдак из рёбер конины","price":3890,"cat":"national"},
    {"name_kk":"Қой еті қуырдағы","name_ru":"Куырдак из баранины","price":3990,"cat":"national"},
    {"name_kk":"Қазақы ет (ұлттық тағам)","name_ru":"Мясо по-казахски","price":3790,"cat":"national"},
    {"name_kk":"Сірне","name_ru":"Сірне","price":3890,"cat":"national"},
    {"name_kk":"Жілік майы","name_ru":"Жілік майы","price":3790,"cat":"national"},
    {"name_kk":"Жылқының қабырға еті","name_ru":"Ребро конины","price":5490,"cat":"national"},
    # БАС АСПАЗ ТАҒАМДАРЫ
    {"name_kk":"Барбекю тұздығындағы қуырылған түшпара","name_ru":"Жареные пельмени в барбекю соусе","price":2590,"cat":"chef"},
    {"name_kk":"Саңырауқұлақ тұздығындағы қуырылған түшпара","name_ru":"Жареные пельмени в грибном соусе","price":2590,"cat":"chef"},
    {"name_kk":"Бас аспаздан дәм","name_ru":"Блюдо от шефа","price":3790,"cat":"chef"},
    {"name_kk":"Жүльен","name_ru":"Жульен","price":3890,"cat":"chef"},
    {"name_kk":"Тауық етінен Пармиджано","name_ru":"Курица Пармиджано","price":4590,"cat":"chef"},
    {"name_kk":"Ет қосылған қуырылған күріш","name_ru":"Жареный рис с мясом","price":1690,"cat":"chef"},
    # НЕГІЗГІ ТАҒАМДАР
    {"name_kk":"Буда піскен нан мен сиыр еті","name_ru":"Говядина с лепёшками на пару","price":3590,"cat":"main"},
    {"name_kk":"Бефстроганов","name_ru":"Бефстроганов","price":3990,"cat":"main"},
    {"name_kk":"Кілегей тұздығындағы тауық етімен фрикасе","name_ru":"Фрикасе из курицы в сливочном соусе","price":3490,"cat":"main"},
    {"name_kk":"Терияки тұздығы қосылған тауық еті","name_ru":"Куриное филе с соусом терияки","price":3690,"cat":"main"},
    {"name_kk":"Ірімшік қосылған котлет","name_ru":"Котлеты с сыром","price":3490,"cat":"main"},
    {"name_kk":"Ірімшік қосылған тауық етінен котлет","name_ru":"Куриные котлеты с сыром","price":3190,"cat":"main"},
    {"name_kk":"Ащы асшаяндар","name_ru":"Острые креветки","price":3890,"cat":"main"},
    # ОРТАЛЫҚ АЗИЯ
    {"name_kk":"Асқабақ қосылған мәнті","name_ru":"Манты с тыквой","price":2390,"cat":"central"},
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
