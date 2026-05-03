# app/routes.py
# URL-маршруты (Controller в MVC)

from flask import render_template, jsonify, request
from .models import get_all_stations, get_station_by_id, get_places_by_station, get_stats

def register_routes(app):
    """Регистрирует все маршруты приложения"""
    
    @app.route('/')
    def index():
        """Главная страница"""
        stations = get_all_stations()
        stations_count, places_count = get_stats()
        return render_template('index.html', 
                               stations=stations,
                               stations_count=stations_count,
                               places_count=places_count)
    
    @app.route('/api/station/<int:station_id>')
    def api_station(station_id):
        """API: данные о станции"""
        station = get_station_by_id(station_id)
        if station:
            return jsonify(station)
        return jsonify({"error": "Station not found"}), 404
    
    @app.route('/api/places/<int:station_id>')
    def api_places(station_id):
        """API: места у станции с фильтрацией"""
        activity = request.args.get('activity', 'all')
        budget = request.args.get('budget', 'all')
        
        activity_filter = None if activity == 'all' else activity
        budget_filter = None if budget == 'all' else budget
        
        places = get_places_by_station(station_id, activity_filter, budget_filter)
        return jsonify(places)