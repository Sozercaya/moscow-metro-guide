# app/models.py
# Работа с базой данных PostgreSQL

import psycopg2
from psycopg2.extras import RealDictCursor
from .config import DB_CONFIG


def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)


def get_all_stations():
    """
    Возвращает список всех станций метро.
    Нужно для отображения карточек на главной странице.
    """
    conn = get_db_connection()
    # RealDictCursor — чтобы результат был в виде словарей,
    # а не списков. Удобно: row['name'] вместо row[1]
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # JOIN — джойним станции и линии, чтобы получить название линии
    # ORDER BY name — сортируем по алфавиту (так удобнее пользователю)
    cur.execute("""
        SELECT s.id, s.name, s.fact, 
               l.id as line_id, l.name as line_name, l.color as line_color
        FROM stations s
        JOIN lines l ON s.line_id = l.id
        ORDER BY s.name
    """)
    stations = cur.fetchall()
    cur.close()
    conn.close()
    return stations


def get_station_by_id(station_id):
    """
    Возвращает данные одной станции по её ID.
    Используется в API: /api/station/4
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT s.id, s.name, s.fact, 
               l.name as line_name, l.color as line_color
        FROM stations s
        JOIN lines l ON s.line_id = l.id
        WHERE s.id = %s
    """, (station_id,))
    station = cur.fetchone()
    cur.close()
    conn.close()
    return station


def get_places_by_station(station_id, activity=None, budget=None, limit=30):
    """
    Возвращает места у станции.
    activity и budget — фильтры (или None), limit — максимум записей.
    """
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Базовый запрос
    query = """
        SELECT name, place_type, walking_minutes, 
               activity_category, budget_category
        FROM places
        WHERE station_id = %s
    """
    params = [station_id]
    
    if activity:
        query += " AND activity_category = %s"
        params.append(activity)
    
    if budget:
        query += " AND budget_category = %s"
        params.append(budget)
    
    query += " ORDER BY walking_minutes LIMIT %s"
    params.append(limit)
    
    cur.execute(query, params)
    places = cur.fetchall()
    cur.close()
    conn.close()
    return places


def get_stats():
    
    """Общее количество станций и мест"""    
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*) FROM stations")
    stations_count = cur.fetchone()[0]
    
    cur.execute("SELECT COUNT(*) FROM places")
    places_count = cur.fetchone()[0]
    
    cur.close()
    conn.close()
    return stations_count, places_count