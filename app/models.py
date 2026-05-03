# app/models.py
# Работа с базой данных (Model в MVC)

import psycopg2
from psycopg2.extras import RealDictCursor
from .config import DB_CONFIG

def get_db_connection():
    """Подключается к PostgreSQL"""
    return psycopg2.connect(**DB_CONFIG)

def get_all_stations():
    """Все станции с информацией о линиях"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT s.id, s.name, s.fact, l.name as line_name
        FROM stations s
        JOIN lines l ON s.line_id = l.id
        ORDER BY s.name
    """)
    stations = cursor.fetchall()
    cursor.close()
    conn.close()
    return stations

def get_station_by_id(station_id):
    """Станция по ID"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT s.id, s.name, s.fact, l.name as line_name
        FROM stations s
        JOIN lines l ON s.line_id = l.id
        WHERE s.id = %s
    """, (station_id,))
    station = cursor.fetchone()
    cursor.close()
    conn.close()
    return station

def get_places_by_station(station_id, activity=None, budget=None):
    """Места у станции с фильтрацией"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    query = """
        SELECT name, place_type, walking_minutes, 
               activity_category, budget_category
        FROM places
        WHERE station_id = %s
    """
    params = [station_id]
    
    if activity and activity != 'all':
        query += " AND activity_category = %s"
        params.append(activity)
    
    if budget and budget != 'all':
        query += " AND budget_category = %s"
        params.append(budget)
    
    query += " ORDER BY walking_minutes LIMIT 30"
    
    cursor.execute(query, params)
    places = cursor.fetchall()
    cursor.close()
    conn.close()
    return places

def get_stats():
    """Общая статистика"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM stations")
    stations = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM places")
    places = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return stations, places