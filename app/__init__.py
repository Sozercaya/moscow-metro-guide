# app/__init__.py
# Инициализация Flask-приложения

from flask import Flask
from .config import SECRET_KEY

def create_app():
    """Фабрика приложений (профессиональный способ создания Flask-приложения)"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = SECRET_KEY
    
    # Регистрируем маршруты
    from .routes import register_routes
    register_routes(app)
    
    return app