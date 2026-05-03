# 🚇 MosMetro Guide

Путеводитель по Москве через станции метро.  
Проект для изучения Python, SQL и работы с данными.

## 📊 Данные

- **250 станций** московского метро
- **970 достопримечательностей** в шаговой доступности
- **15+ линий** метро (включая МЦК, БКЛ, МЦД)

## 🗂️ Структура проекта

\```
moscow-metro-guide/
├── app/                                 # 📦 Основное приложение Flask
│   ├── __init__.py                      # 🏭 Фабрика приложений (create_app)
│   ├── config.py.example                # ⚙️ Шаблон настроек (скопируйте в config.py)
│   ├── models.py                        # 🗄️ Работа с базой данных (SQLAlchemy модели)
│   ├── routes.py                        # 🚏 URL-маршруты и API эндпоинты
│   ├── templates/                       # 🎨 HTML-шаблоны
│   │   └── index.html                   # 🏠 Главная страница (список станций)
│   └── static/                          # 📁 Статические файлы
│       ├── style.css                    # 🎨 Стили и адаптивный дизайн
│       └── script.js                    # ⚡ Клиентская логика (фильтры, API)
│
├── run.py                               # 🚀 Точка входа (запуск сервера)
├── init_db.py                           # 💾 Загрузка данных в PostgreSQL
├── stations.csv                         # 📊 Исходные данные (станции, линии, места)
├── stations.json                        # 📄 Данные в JSON для веб-сайта
├── requirements.txt                     # 📦 Зависимости Python (Flask, psycopg2)
├── .gitignore                           # 🙈 Игнорируемые файлы (venv, config.py)
└── README.md                            # 📖 Документация проекта
\```

## 🗄️ База данных

Проект использует **PostgreSQL** с тремя таблицами:

| Таблица | Назначение |
|---------|------------|
| `lines` | Линии метро |
| `stations` | Станции метро (связь с lines) |
| `places` | Достопримечательности (связь со stations) |

## 🚀 Как запустить локально

### 1. Установка PostgreSQL

\```bash
# Linux (Ubuntu/Debian):
sudo apt update && sudo apt install postgresql postgresql-contrib

# MacOS:
brew install postgresql

# Windows:
# Скачайте установщик с postgresql.org и запустите его
\```

### 2. Клонирование репозитория

\```bash
git clone https://github.com/Sozercaya/moscow-metro-guide.git
cd moscow-metro-guide
\```

### 3. Виртуальное окружение

\```bash
python3 -m venv venv
source venv/bin/activate          # Linux/MacOS
# venv\Scripts\activate           # Windows
\```

### 4. Установка зависимостей

\```bash
pip install --upgrade pip
pip install -r requirements.txt
\```

### 5. Настройка конфигурации

\```bash
cp app/config.py.example app/config.py
# Откройте app/config.py и замените:
# PASSWORD = 'postgres' → PASSWORD = 'ваш_реальный_пароль'
\```

### 6. Создание БД и загрузка данных

\```bash
# Создаём базу данных:
psql -U postgres -c "CREATE DATABASE moscow_metro;"
# (введите пароль postgres, если спросит)

# Загружаем данные (250 станций + 970 мест):
python init_db.py

# Проверяем загрузку:
psql -U postgres -d moscow_metro -c "SELECT COUNT(*) FROM places;"
# Должно показать: 970
\```

### 7. Запуск веб-сайта

\```bash
python run.py

# Готово! Открывайте браузер: http://127.0.0.1:5000
# Для остановки сервера нажмите: Ctrl + C
\```

## 📈 Функционал

- Список всех станций метро с карточками (название, линия, интересный факт)
- Количество достопримечательностей у каждой станции
- Фильтрация по активности (\`есть\` / \`смотреть\` / \`гулять\`)
- Фильтрация по бюджету (\`бесплатно\` / \`дёшево\` / \`средний\` / \`дорого\`)
- Адаптивный дизайн (работает на телефонах)
- REST API для динамической загрузки данных

## 🔌 API

| Эндпоинт | Описание |
|----------|----------|
| `/api/station/<id>` | Данные о станции |
| `/api/places/<id>?activity=есть&budget=бесплатно` | Места с фильтрацией |

## 📊 Результаты

**Самая насыщенная станция — Краснопресненская (7 мест):**

| Место | Бюджет |
|-------|--------|
| Московский зоопарк | бесплатно |
| Планетарий | средний |
| Башня 2000 (Москва-Сити) | средний |
| Красная Пресня (музей революции) | бесплатно |
| Улица Большая Грузинская | бесплатно |
| Аквариум «Москвариум» | дорого |
| Кафе «АндерСон» | дёшево |

## 📈 Примеры SQL-запросов

\```sql
-- Топ-10 станций по количеству мест
SELECT s.name, COUNT(p.id) as places_count
FROM stations s
JOIN places p ON s.id = p.station_id
GROUP BY s.id
ORDER BY places_count DESC
LIMIT 10;

-- Все бесплатные места у станции "Краснопресненская"
SELECT p.name, p.place_type, p.budget_category
FROM places p
JOIN stations s ON p.station_id = s.id
WHERE s.name = 'Краснопресненская' AND p.budget_category = 'бесплатно';

-- Все места с фильтром "есть" (кафе, рестораны)
SELECT s.name as station, p.name as place, p.budget_category
FROM places p
JOIN stations s ON p.station_id = s.id
WHERE p.activity_category = 'есть'
ORDER BY s.name;

-- Среднее количество мест на станцию по линиям
SELECT l.name as line, AVG(station_count.places) as avg_places
FROM lines l
JOIN stations s ON l.id = s.line_id
JOIN (
    SELECT station_id, COUNT(*) as places
    FROM places
    GROUP BY station_id
) station_count ON s.id = station_count.station_id
GROUP BY l.id
ORDER BY avg_places DESC;
\```

## 👤 Автор

**Светлана Борисенкова**  
GitHub: [@Sozercaya](https://github.com/Sozercaya)

---

⭐ Если проект полезен — поставьте звезду на GitHub!