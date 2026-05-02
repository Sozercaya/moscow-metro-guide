# add_categories_to_csv.py
# Этот скрипт добавляет в CSV две новые колонки:
# - activity_category (чем заняться: гулять, смотреть, есть)
# - budget_category (уровень бюджета: бесплатно, дёшево, средний, дорого)

import csv

# ============================================================
# СЛОВАРИ ДЛЯ МАППИНГА (СООТВЕТСТВИЯ)
# ============================================================

# ---- 1. АКТИВНОСТЬ (чем заняться) ----
ACTIVITY_MAP = {
    'парк': 'гулять',
    'парк/улица': 'гулять',
    'улица': 'гулять',
    'улица/парк': 'гулять',
    'набережная': 'гулять',
    'сквер': 'гулять',
    'бульвар': 'гулять',
    'пруд': 'гулять',
    'лесопарк': 'гулять',
    'заказник': 'гулять',
    'пляж': 'гулять',
    'музей': 'смотреть',
    'музей/кафе': 'смотреть',
    'музей/культура': 'смотреть',
    'театр': 'смотреть',
    'памятник': 'смотреть',
    'фонтан': 'смотреть',
    'храм': 'смотреть',
    'усадьба': 'смотреть',
    'достопримечательность': 'смотреть',
    'панорама': 'смотреть',
    'смотровая площадка': 'смотреть',
    'мост': 'смотреть',
    'площадь': 'смотреть',
    'выставочный зал': 'смотреть',
    'зоопарк': 'смотреть',
    'океанариум': 'смотреть',
    'ботанический сад': 'смотреть',
    'планетарий': 'смотреть',
    'тц': 'смотреть',
    'торговый центр': 'смотреть',
    'стадион': 'смотреть',
    'кафе': 'есть',
    'кофейня': 'есть',
    'ресторан': 'есть',
    'бар': 'есть',
    'пекарня': 'есть',
    'столовая': 'есть',
    'рынок': 'есть',
    'транспортный узел': 'смотреть',
    'спорткомплекс': 'смотреть',
    'аквапарк': 'смотреть',
    'цирк': 'смотреть',
    'кинотеатр': 'смотреть',
    'учебное заведение': 'смотреть',
}

# ---- 2. УРОВЕНЬ БЮДЖЕТА ----
BUDGET_MAP = {
    'парк': 'бесплатно',
    'парк/улица': 'бесплатно',
    'улица': 'бесплатно',
    'набережная': 'бесплатно',
    'сквер': 'бесплатно',
    'бульвар': 'бесплатно',
    'пруд': 'бесплатно',
    'лесопарк': 'бесплатно',
    'заказник': 'бесплатно',
    'пляж': 'бесплатно',
    'памятник': 'бесплатно',
    'фонтан': 'бесплатно',
    'храм': 'бесплатно',
    'мост': 'бесплатно',
    'площадь': 'бесплатно',
    'смотровая площадка': 'бесплатно',
    'кафе': 'дёшево',
    'кофейня': 'дёшево',
    'пекарня': 'дёшево',
    'столовая': 'дёшево',
    'рынок (еда)': 'дёшево',
    'ресторан': 'средний',
    'бар': 'средний',
    'музей': 'средний',
    'театр': 'средний',
    'усадьба': 'средний',
    'выставочный зал': 'средний',
    'зоопарк': 'средний',
    'ботанический сад': 'средний',
    'планетарий': 'средний',
    'тц': 'средний',
    'торговый центр': 'средний',
    'стадион': 'средний',
    'аквапарк': 'средний',
    'цирк': 'средний',
    'кинотеатр': 'средний',
    'океанариум': 'дорого',
}

def get_activity_category(place_type):
    """Возвращает категорию активности по типу места"""
    if not place_type:
        return 'другое'
    key = place_type.lower().strip()
    return ACTIVITY_MAP.get(key, 'другое')

def get_budget_category(place_type):
    """Возвращает категорию бюджета по типу места"""
    if not place_type:
        return 'не указано'
    key = place_type.lower().strip()
    return BUDGET_MAP.get(key, 'средний')

def add_categories_to_csv(input_file, output_file):
    """Читает CSV, добавляет колонки, сохраняет в новый файл"""
    
    rows = []
    fieldnames = None
    
    with open(input_file, 'r', encoding='utf-8') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames
        
        # Создаём новый список полей (убираем None, если он есть)
        clean_fieldnames = [f for f in fieldnames if f is not None]
        new_fieldnames = clean_fieldnames + ['activity_category', 'budget_category']
        
        for row in reader:
            # Очищаем строку от None ключей
            clean_row = {}
            for key, value in row.items():
                if key is not None:
                    clean_row[key] = value
            
            place_type = clean_row.get('place_type', '')
            activity = get_activity_category(place_type)
            budget = get_budget_category(place_type)
            
            clean_row['activity_category'] = activity
            clean_row['budget_category'] = budget
            rows.append(clean_row)
    
    # Записываем в новый файл
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=new_fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"✅ Обработано {len(rows)} строк")
    print(f"   Сохранено в: {output_file}")
    
    # Статистика
    print("\n📊 СТАТИСТИКА ПО АКТИВНОСТИ:")
    activity_stats = {}
    budget_stats = {}
    
    for row in rows:
        activity = row['activity_category']
        budget = row['budget_category']
        activity_stats[activity] = activity_stats.get(activity, 0) + 1
        budget_stats[budget] = budget_stats.get(budget, 0) + 1
    
    for act, count in sorted(activity_stats.items()):
        print(f"   {act}: {count}")
    
    print("\n💰 СТАТИСТИКА ПО БЮДЖЕТУ:")
    for bud, count in sorted(budget_stats.items()):
        print(f"   {bud}: {count}")

if __name__ == "__main__":
    input_file = "stations.csv"
    output_file = "stations_with_categories.csv"
    add_categories_to_csv(input_file, output_file)
    print("\n🎉 Готово! Файл stations_with_categories.csv создан.")