import urllib.request, urllib.parse, json

URL = "https://wuhefcbofaoqvsrejcjc.supabase.co"
KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aGVmY2JvZmFvcXZzcmVqY2pjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQxNDA1MSwiZXhwIjoyMDg2OTkwMDUxfQ.AZp4tZTkKE6_1nvZLmvq-yDF8vfyEtW0mXUB2zYDIqo"
CAFE = "668a3d32-4b3e-415c-a720-857748947f7e"

CAT = {
    "banquet": "5a69a159-f00f-4c4f-bcbb-3db4930e20cb",
    "dessert": "81353da4-019d-43a3-bba0-77a7d3a76d32",
    "tea":     "e1ecaa0f-e6d1-48d7-8470-288230b64b3f",
    "coffee":  "e40a97e6-f3b0-4239-8f97-37eeb3a7f4ec",
    "milkshake":"9bbfab34-07bb-4521-b85d-04fa367f5bc9",
    "smoothie": "91f6412c-efb4-4243-9b1c-df4c314ff3b5",
    "lemonade":"9c53c1e9-a944-4eed-93e9-04998fa75c66",
}

items = [
    # БАНКЕТТІК ТАҒАМДАР (Page 50-51)
    {"name_kk":"Балық түржинағы","name_ru":"Фиш ассорти","price":20000,"cat":"banquet",
     "dkk":"мөңке, сазан, көксерке, картоп бөліктері, салат жапырағы, қызыл пияз, күріш, лимон, көктер","dru":"карась, сазан, судак, карт. дольки, лист салата, красный лук, рис гарнир, лимон, зелень"},
    {"name_kk":"Қазақ ет тамағы ұлттық тағам (6 адамға арналған)","name_ru":"Мясо по-казахски национальное блюдо (на 6 человек)","price":19000,"cat":"banquet",
     "dkk":"жылқы еті, қазы, картоп, сәбіз, қамыр, сорпа, құрт, көктер","dru":"мясо конины, казы, картофель, морковь, тесто, бульон, курт, зелень"},
    {"name_kk":"Қарын қалта (15 адамға арналған)","name_ru":"Қарын қалта на 15 человек","price":69000,"cat":"banquet",
     "dkk":"жылқы қабырға еті мен қарыны, сиыр еті мен қарыны, қой еті мен қарыны, қазы, көкөністер, BBQ тұздығы, тәтті бұрыш, домалақ картоптар","dru":"рёбра и требуха конины, мясо и требуха говядины, мясо и требуха баранины, казы, овощи, соус BBQ, светофор, картофельные шарики"},
    {"name_kk":"Хан палау (10 адамға арналған)","name_ru":"Хан плов на 10 человек","price":32000,"cat":"banquet",
     "dkk":"палау, қатпарлы қамыр, қияр, қызанақ, күнжіт, қара зере","dru":"плов, слоеное тесто, огурцы, помидор, кунжут, седана"},
    {"name_kk":"Қазан кебаб (10 адамға арналған)","name_ru":"Казан кебаб на 10 человек","price":35000,"cat":"banquet",
     "dkk":"қой еті, картоп, пияз","dru":"мясо баранины, картофель, лук"},
    {"name_kk":"Етжентегі түржинағы (8 адамға арналған)","name_ru":"Фаршированное ассорти (на 8 человек)","price":24000,"cat":"banquet",
     "dkk":"тефтели, сиыр етжентегі салынған бұрыш, котлеттер, тауық еті, фри","dru":"тефтели, фаршированный перец, котлеты, окорочка, фри"},
    {"name_kk":"Ет тағамдары (Мясной пир)","name_ru":"Мясной пир","price":38000,"cat":"banquet",
     "dkk":"қойдың қабырғасы 1, қой сирағы 2, жылқы қабырғасы 2, балапан еті 2, көкөніс грилі, картоп бөліктері","dru":"баран. ребрышки 1, баран. ножки 2, ребро конина 2, цыпленок 2, овощной гриль, дольки"},
    {"name_kk":"Балық түржинағы (8 адамға арналған)","name_ru":"Ассорти из рыб (на 8 человек)","price":23000,"cat":"banquet",
     "dkk":"ақсерке, дорадо, бақтақ, сибас, көксерке, брокколи, тәтті бұрыш, түрлі түсті орамжапырақ, тобико, қызанақ, көктер, күріш, картоп езбесі","dru":"сёмга, дорадо, форель, сибас, судак, светофор, брокколи, цв. капуста, тобико, помидоры, зелень, гарнир пюре, рис"},

    # ДЕСЕРТТЕР (Page 53)
    {"name_kk":"Сүтті қыз","name_ru":"Молочная девочка","price":2190,"cat":"dessert", "dkk":"","dru":""},
    {"name_kk":"Вупи-пай","name_ru":"Вупи-пай","price":2290,"cat":"dessert", "dkk":"","dru":""},
    {"name_kk":"Бал торты","name_ru":"Медовый торт","price":1890,"cat":"dessert", "dkk":"","dru":""},
    {"name_kk":"Напалеон","name_ru":"Напалеон","price":1890,"cat":"dessert", "dkk":"","dru":""},
    {"name_kk":"Пісте чизкейгі","name_ru":"Фисташковый чизкейк","price":1990,"cat":"dessert", "dkk":"","dru":""},
    {"name_kk":"Тары чизкейгі","name_ru":"Тары чизкейк","price":2190,"cat":"dessert", "dkk":"","dru":""},
    {"name_kk":"Испандық чизкейк","name_ru":"Испанский чизкейк","price":1990,"cat":"dessert", "dkk":"","dru":""},
    {"name_kk":"Балмұздақ","name_ru":"Мороженое в ассортименте","price":1590,"cat":"dessert",
     "dkk":"манго, қауын, банан, құлпынай, орманжаңғағы, вафли ұнтақтары","dru":"манго, дыня, банан, клубника, лесной орех, вафельные крошки"},

    # ШАЙЛАР (Page 54)
    {"name_kk":"Сүтпен шәй","name_ru":"Чай с молоком","price":990,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Қара шәй","name_ru":"Чай черный","price":790,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Көк шәй","name_ru":"Чай зеленый","price":790,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Көшпенді шәй","name_ru":"Чай кочевник","price":2990,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Ташкент шәйі","name_ru":"Чай Ташкентский","price":2090,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Түрік шәйі","name_ru":"Чай Турецкий","price":2090,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Жеміс шәйі","name_ru":"Фруктовый чай","price":2090,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Жидекті шәй","name_ru":"Ягодный чай","price":1890,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Зімбірлі-лимонды шәй","name_ru":"Имбирно-лимонный чай","price":1890,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Апельсинді шәй","name_ru":"Чай с апельсином","price":1790,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Мароккандық шәй","name_ru":"Марокканский чай","price":1890,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Таңқурай және жалбыз қосылған шәй","name_ru":"Чай с малиной и мятой","price":1890,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Құлпынай және жалбыз қосылған шәй","name_ru":"Чай с клубникой и мятой","price":1890,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Шырғанақ шәйі","name_ru":"Облепиховый чай","price":1890,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Шырғанақ пен апельсин қосылған шәй","name_ru":"Облепихово-апельсиновый чай","price":1990,"cat":"tea", "dkk":"","dru":""},

    # МАТЧА (Page 55)
    {"name_kk":"Манго қосылған матча","name_ru":"Матча с манго","price":2390,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Таңқурай қосылған матча","name_ru":"Матча с малиной","price":2390,"cat":"tea", "dkk":"","dru":""},
    {"name_kk":"Құлпынай қосылған матча","name_ru":"Матча с клубникой","price":2390,"cat":"tea", "dkk":"","dru":""},

    # КОФЕ (Page 56)
    {"name_kk":"Эспрессо (0,25л)","name_ru":"Эспрессо (0,25л)","price":990,"cat":"coffee", "dkk":"","dru":""},
    {"name_kk":"Американо (0,4л)","name_ru":"Американо (0,4л)","price":1090,"cat":"coffee", "dkk":"","dru":""},
    {"name_kk":"Капучино (0,4л)","name_ru":"Капучино (0,4л)","price":1590,"cat":"coffee", "dkk":"","dru":""},
    {"name_kk":"Латте (0,4л)","name_ru":"Латте (0,4л)","price":1290,"cat":"coffee", "dkk":"","dru":""},
    {"name_kk":"Гляссе (0,4л)","name_ru":"Гляссе (0,4л)","price":1790,"cat":"coffee", "dkk":"","dru":""},
    {"name_kk":"Айс кофе (0,4л)","name_ru":"Айс кофе (0,4л)","price":1590,"cat":"coffee", "dkk":"","dru":""},
    {"name_kk":"Фраппучино (0,4л)","name_ru":"Фраппучино (0,4л)","price":1890,"cat":"coffee", "dkk":"","dru":""},
    {"name_kk":"Флэт уайт (0,25л)","name_ru":"Флэт уайт (0,25л)","price":1890,"cat":"coffee", "dkk":"","dru":""},
    {"name_kk":"Раф (0,4л)","name_ru":"Раф (0,4л)","price":1590,"cat":"coffee", "dkk":"","dru":""},
    {"name_kk":"Айс латте (0,4л)","name_ru":"Айс латте (0,4л)","price":1790,"cat":"coffee", "dkk":"","dru":""},
    {"name_kk":"Горячий шоколад (0,4л)","name_ru":"Горячий шоколад (0,4л)","price":1190,"cat":"coffee", "dkk":"","dru":""},

    # МИЛКШЕЙКТЕР (Page 56)
    {"name_kk":"Сникерс сүт шәрбаты","name_ru":"Милкшейк Сникерс","price":1990,"cat":"milkshake", "dkk":"","dru":""},
    {"name_kk":"Баунти сүт шәрбаты","name_ru":"Милкшейк Баунти","price":1990,"cat":"milkshake", "dkk":"","dru":""},
    {"name_kk":"Орео шәрбаты","name_ru":"Орео шейк","price":1990,"cat":"milkshake", "dkk":"","dru":""},
    {"name_kk":"Сүтті коктейль","name_ru":"Молочный коктейль","price":1690,"cat":"milkshake", "dkk":"","dru":""},
    {"name_kk":"Шоколадты шәрбат","name_ru":"Шоколадный коктейль","price":1690,"cat":"milkshake", "dkk":"","dru":""},
    {"name_kk":"Құлпынайлы шәрбат","name_ru":"Клубничный коктейль","price":1690,"cat":"milkshake", "dkk":"","dru":""},
    {"name_kk":"Банан шәрбаты","name_ru":"Банановый коктейль","price":1890,"cat":"milkshake", "dkk":"","dru":""},

    # ФРЕШ (Page 57)
    {"name_kk":"Апельсин сығындысы","name_ru":"Апельсиновый фреш","price":1990,"cat":"smoothie", "dkk":"","dru":""},
    {"name_kk":"Алма сығындысы","name_ru":"Яблочный фреш","price":1990,"cat":"smoothie", "dkk":"","dru":""},
    {"name_kk":"Сәбіз сығындысы","name_ru":"Морковный фреш","price":1990,"cat":"smoothie", "dkk":"","dru":""},
    {"name_kk":"Алма және сәбіз сығындысы","name_ru":"Яблочно-морковный фреш","price":1990,"cat":"smoothie", "dkk":"","dru":""},
    {"name_kk":"Жемістер сығындысы","name_ru":"Фруктовый фреш","price":1990,"cat":"smoothie", "dkk":"","dru":""},
    {"name_kk":"Алмұрт фреші","name_ru":"Грушевый фреш","price":1990,"cat":"smoothie", "dkk":"","dru":""},
    {"name_kk":"Алма және апельсин сығындысы","name_ru":"Яблочно-апельсиновый фреш","price":1990,"cat":"smoothie", "dkk":"","dru":""},

    # СМУЗИ (Page 58)
    {"name_kk":"Алма балдыркөк езбесусыны","name_ru":"Смузи яблочно-сельдерей","price":1890,"cat":"smoothie", "dkk":"","dru":""},
    {"name_kk":"Жидек езбесусыны","name_ru":"Смузи ягодный","price":1890,"cat":"smoothie", "dkk":"","dru":""},
    {"name_kk":"Құлпынай-киви езбесусыны","name_ru":"Смузи клубника-киви","price":1890,"cat":"smoothie", "dkk":"","dru":""},
    {"name_kk":"Құлпынай езбесусыны","name_ru":"Смузи клубничный","price":1890,"cat":"smoothie", "dkk":"","dru":""},
    {"name_kk":"Киви-банан езбесусыны","name_ru":"Смузи киви-банан","price":1890,"cat":"smoothie", "dkk":"","dru":""},
    {"name_kk":"Таңқурай-алмұрт езбесусыны","name_ru":"Смузи малина-груша","price":1890,"cat":"smoothie", "dkk":"","dru":""},

    # ЛИМОНАДТАР (Page 59)
    {"name_kk":"Киви-лайм лимонады","name_ru":"Лимонад Киви-лайм","price":2890,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Тархун","name_ru":"Тархун","price":2890,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Морс лимонады","name_ru":"Морс лимонад","price":2890,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Цитрусты жаз лимонады","name_ru":"Цитрусовое лето","price":2890,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Қарбыз лимонады","name_ru":"Арбузный лимонад","price":2890,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Құлпынай лимонады","name_ru":"Клубничный лимонад","price":2890,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Анар балғындығы лимонады","name_ru":"Гранатовая свежесть","price":2890,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Манго-маракуйя лимонады","name_ru":"Лимонад Манго-маракуйя","price":2890,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Киви-маракуйя лимонады","name_ru":"Лимонад Киви-маракуйя","price":2890,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Ананас-маракуйя лимонады","name_ru":"Лимонад Ананас-маракуйя","price":2890,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Таңқурай-маракуйя","name_ru":"Малина-маракуйя","price":2890,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Қарбыз-маракуйя","name_ru":"Арбуз-маракуйя","price":2890,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Мохито","name_ru":"Мохито","price":3190,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Құлпынай мохитосы","name_ru":"Мохито клубничный","price":3190,"cat":"lemonade", "dkk":"","dru":""},

    # ЛИМОНАД ПЮРЕ (Page 59)
    {"name_kk":"Құлпынай езбесі қосылған лимонад","name_ru":"Лимонад с клубничным пюре","price":2090,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Киви езбесі қосылған лимонад","name_ru":"Лимонад с пюре киви","price":2090,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Манго-маракуйя езбесі қосылған лимонад","name_ru":"Лимонад с пюре манго-маракуйя","price":2090,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Таңқурай-маракуйя езбесі қосылған лимонад","name_ru":"Лимонад с пюре малина-маракуйя","price":2090,"cat":"lemonade", "dkk":"","dru":""},

    # СУСЫНДАР (Page 60)
    {"name_kk":"Кола, фанта, спрайт (1 л)","name_ru":"Кола, фанта, спрайт (1 л)","price":1350,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Шырын (1 л)","name_ru":"Сок (1 л)","price":1600,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Газдалмаған минералды су (1 л)","name_ru":"Минеральная вода без газа (1 л)","price":650,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Фьюс шәйі (1 л)","name_ru":"Фьюс чай (1 л)","price":1200,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Боржоми","name_ru":"Боржоми","price":1400,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Құтыдағы кола (0,33)","name_ru":"Кола баночный (0,33)","price":950,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Шыны ыдыстағы кола (0,25)","name_ru":"Кола стеклянный (0,25)","price":1000,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Кола (0,5)","name_ru":"Кола (0,5)","price":950,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Қымыз (0,5 л)","name_ru":"Кымыз (0,5 л)","price":1200,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Қымыз (1 л)","name_ru":"Кымыз (1 л)","price":1900,"cat":"lemonade", "dkk":"","dru":""},
    {"name_kk":"Шұбат (1 л)","name_ru":"Шубат (1 л)","price":1800,"cat":"lemonade", "dkk":"","dru":""},
]

headers = {
    "apikey": KEY,
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

ok = fail = 0
for i, item in enumerate(items):
    row = {
        "cafe_id": CAFE,
        "category_id": CAT[item["cat"]],
        "name_kk": item["name_kk"],
        "name_ru": item["name_ru"],
        "name_en": item["name_ru"],
        "description_kk": item.get("dkk", ""),
        "description_ru": item.get("dru", ""),
        "description_en": item.get("dru", ""),
        "price": item["price"],
        "is_available": True,
        "is_popular": False,
        "is_stop_list": False,
        "preparation_time": 15,
        "sort_order": i + 300,
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
