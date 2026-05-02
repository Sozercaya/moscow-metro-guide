# update_db_with_categories.py
import csv
import psycopg2

PASSWORD = "1993500"  # ← Ваш пароль

print("🔌 Подключаемся к PostgreSQL...")
conn = psycopg2.connect(
    dbname="moscow_metro",
    user="postgres",
    password=PASSWORD,
    host="localhost",
    port="5432"
)
conn.autocommit = True  # Включаем автокоммит, чтобы избежать проблем с транзакциями
cursor = conn.cursor()
print("✅ Подключено!")

# ============================================================
# ДОБАВЛЯЕМ НОВЫЕ КОЛОНКИ (ЕСЛИ ИХ ЕЩЁ НЕТ)
# ============================================================
print("\n📦 Проверяем и добавляем новые колонки...")

# Проверяем наличие колонок и добавляем по отдельности
cursor.execute("""
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'places'
""")
existing_columns = [row[0] for row in cursor.fetchall()]

if 'activity_category' not in existing_columns:
    cursor.execute("ALTER TABLE places ADD COLUMN activity_category VARCHAR(50)")
    print("   + Добавлена колонка activity_category")
else:
    print("   Колонка activity_category уже существует")

if 'budget_category' not in existing_columns:
    cursor.execute("ALTER TABLE places ADD COLUMN budget_category VARCHAR(50)")
    print("   + Добавлена колонка budget_category")
else:
    print("   Колонка budget_category уже существует")

conn.commit()

# ============================================================
# ЗАГРУЖАЕМ СТАНЦИИ В КЭШ
# ============================================================
print("\n📂 Загружаем данные из stations_with_categories.csv...")

cursor.execute("SELECT id, name FROM stations")
stations_cache = {name.strip(): id for id, name in cursor.fetchall()}

updated_count = 0
not_found_count = 0
error_count = 0

with open('stations_with_categories.csv', 'r', encoding='utf-8') as file:
    reader = csv.DictReader(file)
    
    for row in reader:
        station_name = row.get('station_name', '').strip()
        place_name = row.get('place_name', '').strip()
        activity = row.get('activity_category', '').strip()
        budget = row.get('budget_category', '').strip()
        
        if not place_name:
            continue
        
        station_id = stations_cache.get(station_name)
        if not station_id:
            not_found_count += 1
            continue
        
        try:
            cursor.execute("""
                UPDATE places 
                SET activity_category = %s, budget_category = %s
                WHERE station_id = %s AND name = %s
            """, (activity if activity else None, budget if budget else None, station_id, place_name))
            updated_count += 1
        except Exception as e:
            error_count += 1
            continue
        
        if updated_count % 100 == 0:
            print(f"   ... обновлено {updated_count} мест")

conn.commit()

# ============================================================
# СТАТИСТИКА
# ============================================================
print("\n" + "=" * 50)
print("📊 СТАТИСТИКА ОБНОВЛЕНИЯ:")
print("=" * 50)
print(f"   • Обновлено мест: {updated_count}")
print(f"   • Не найдено станций: {not_found_count}")
print(f"   • Ошибок: {error_count}")
print("=" * 50)

# ============================================================
# ПРОВЕРКА
# ============================================================
print("\n🔍 ПРИМЕР ДАННЫХ С КАТЕГОРИЯМИ:")

cursor.execute("""
    SELECT s.name, p.name, p.activity_category, p.budget_category
    FROM places p
    JOIN stations s ON p.station_id = s.id
    WHERE p.activity_category IS NOT NULL
    LIMIT 10
""")

for row in cursor.fetchall():
    print(f"   🚇 {row[0]} → {row[1]}")
    print(f"      Активность: {row[2]}, Бюджет: {row[3]}")

cursor.close()
conn.close()

print("\n✅ ГОТОВО!")