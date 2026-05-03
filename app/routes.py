# app/routes.py
# Здесь определяются URL-адреса и API, которые обрабатывает ваш сайт

from flask import jsonify, request, render_template
from . import models

def register_routes(app):
    """Регистрирует все маршруты в Flask-приложении"""
    
    @app.route('/')
    def index():
        """
        HTML-шаблон со списком станций.
        """
        stations = models.get_all_stations()      # все станции из БД
        stations_count, places_count = models.get_stats()  # общая статистика
        return render_template(
            'index.html',
            stations=stations,
            stations_count=stations_count,
            places_count=places_count
        )
    
    @app.route('/api/station/<int:station_id>')
    def api_station(station_id):
        """
        Возвращаем данные о станции в формате JSON.
        """
        station = models.get_station_by_id(station_id)
        if station:
            return jsonify(station)
        return {"error": "Station not found"}, 404
    
    @app.route('/api/places/<int:station_id>')
    def api_places(station_id):
        """
        Возвращаем места у станции с фильтрацией.
        """
         
        activity = request.args.get('activity', 'all')
        budget = request.args.get('budget', 'all')
        
        activity_filter = None if activity == 'all' else activity
        budget_filter = None if budget == 'all' else budget
        
        places = models.get_places_by_station(
            station_id, 
            activity_filter, 
            budget_filter
        )
        return jsonify(places)