// app/static/script.js
// Все JavaScript функции для веб-сайта МосМетро-Гид
// Обрабатывает: загрузку данных, фильтрацию, открытие/закрытие карточек

// ============================================================
// КЭШИРОВАНИЕ ДАННЫХ (чтобы не загружать одно и то же дважды)
// ============================================================

// Кэш для хранения данных о местах каждой станции
// Структура: placesCache[ID_станции] = [массив_мест]
const placesCache = {};

// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

/**
 * Функция для безопасного экранирования HTML
 * Защита от XSS-атак (вредоносных вставок в текст)
 * Например: "<script>" превратится в "&lt;script&gt;"
 */
function escapeHtml(text) {
    if (!text) return '';              // Если текст пустой — возвращаем пустую строку
    return text
        .replace(/&/g, '&amp;')       // Заменяем & на &amp;
        .replace(/</g, '&lt;')        // Заменяем < на &lt;
        .replace(/>/g, '&gt;')        // Заменяем > на &gt;
        .replace(/"/g, '&quot;')      // Заменяем " на &quot;
        .replace(/'/g, '&#39;');      // Заменяем ' на &#39;
}

/**
 * Получение CSS-класса для бейджа бюджета
 * По названию категории бюджета возвращает класс для окрашивания
 */
function getBudgetClass(budget) {
    switch (budget) {
        case 'бесплатно': return 'badge-free';      // Зелёный
        case 'дёшево': return 'badge-cheap';        // Жёлтый
        case 'средний': return 'badge-medium';      // Синий
        case 'дорого': return 'badge-expensive';    // Красный
        default: return '';                         // Без класса
    }
}

/**
 * Получение CSS-класса для бейджа активности
 * По названию активности возвращает класс для окрашивания
 */
function getActivityClass(activity) {
    switch (activity) {
        case 'есть': return 'badge-eat';            // Персиковый
        case 'смотреть': return 'badge-see';        // Фиолетовый
        case 'гулять': return 'badge-walk';         // Голубой
        default: return '';                         // Без класса
    }
}

// ============================================================
// ФУНКЦИИ ДЛЯ ЗАГРУЗКИ ДАННЫХ С СЕРВЕРА
// ============================================================

/**
 * Загружает места для конкретной станции
 * @param {number} stationId - ID станции
 * @returns {Promise<Array>} - Promise с массивом мест
 */
async function loadPlaces(stationId) {
    // Если данные уже есть в кэше — возвращаем их без запроса к серверу
    if (placesCache[stationId]) {
        console.log(`📦 Загрузка из кэша для станции ${stationId}`);
        return placesCache[stationId];
    }
    
    try {
        console.log(`🌐 Запрос к серверу для станции ${stationId}`);
        // Отправляем запрос к API сервера
        const response = await fetch(`/api/places/${stationId}`);
        const data = await response.json();
        
        // Сохраняем в кэш
        placesCache[stationId] = data;
        console.log(`✅ Загружено ${data.length} мест для станции ${stationId}`);
        return data;
    } catch (error) {
        console.error('❌ Ошибка загрузки мест:', error);
        return [];  // Возвращаем пустой массив при ошибке
    }
}

/**
 * Загружает факт о станции и количество мест
 * @param {number} stationId - ID станции
 */
async function updateStationInfo(stationId) {
    try {
        // Загружаем данные о станции (факт)
        const stationResponse = await fetch(`/api/station/${stationId}`);
        const station = await stationResponse.json();
        
        // Обновляем блок с фактом
        const factElement = document.getElementById(`fact-${stationId}`);
        if (factElement && station.fact) {
            let factText = station.fact;
            // Обрезаем длинный факт до 120 символов
            if (factText.length > 120) {
                factText = factText.slice(0, 120) + '...';
            }
            factElement.innerHTML = `📖 ${escapeHtml(factText)}`;
        }
        
        // Загружаем места (для подсчёта количества)
        const places = await loadPlaces(stationId);
        
        // Обновляем блок с количеством мест
        const countElement = document.getElementById(`count-${stationId}`);
        if (countElement) {
            const count = places.length;
            let icon = '🏛️';
            if (count === 0) icon = '📍';
            countElement.innerHTML = `${icon} ${count} ${declension(count, 'место', 'места', 'мест')}`;
        }
    } catch (error) {
        console.error('❌ Ошибка загрузки информации о станции:', error);
    }
}

// ============================================================
// ФОРМАТИРОВАНИЕ СКЛОНЕНИЙ
// ============================================================

/**
 * Склонение слов в зависимости от числа
 * @param {number} number - число
 * @param {string} one - форма для 1 (например, "место")
 * @param {string} two - форма для 2-4 (например, "места")
 * @param {string} five - форма для 5+ (например, "мест")
 */
function declension(number, one, two, five) {
    const n = Math.abs(number) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
}

// ============================================================
// ФИЛЬТРАЦИЯ И ОТОБРАЖЕНИЕ МЕСТ
// ============================================================

/**
 * Применяет фильтры к списку мест и обновляет отображение
 * @param {number} stationId - ID станции
 * @param {Event} event - событие клика (чтобы определить, по какой кнопке кликнули)
 */
async function applyFilters(stationId, event) {
    // Предотвращаем всплытие события (чтобы клик по кнопке не открывал/закрывал карточку)
    if (event && event.stopPropagation) {
        event.stopPropagation();
    }
    
    // Находим блок с деталями станции
    const detailsDiv = document.getElementById(`details-${stationId}`);
    if (!detailsDiv) return;
    
    // Определяем текущие активные фильтры
    const activeActivityBtn = detailsDiv.querySelector('.filter-btn[data-activity].active');
    const activeBudgetBtn = detailsDiv.querySelector('.filter-btn[data-budget].active');
    
    let activity = 'all';
    let budget = 'all';
    
    if (activeActivityBtn) {
        activity = activeActivityBtn.getAttribute('data-activity');
    }
    if (activeBudgetBtn) {
        budget = activeBudgetBtn.getAttribute('data-budget');
    }
    
    // Если кликнули по кнопке — обновляем активные классы
    if (event && event.target && event.target.classList && event.target.classList.contains('filter-btn')) {
        const group = event.target.hasAttribute('data-activity') ? 'data-activity' : 'data-budget';
        const buttons = detailsDiv.querySelectorAll(`.filter-btn[${group}]`);
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Перечитываем обновлённые значения
        const newActivityBtn = detailsDiv.querySelector('.filter-btn[data-activity].active');
        const newBudgetBtn = detailsDiv.querySelector('.filter-btn[data-budget].active');
        if (newActivityBtn) activity = newActivityBtn.getAttribute('data-activity');
        if (newBudgetBtn) budget = newBudgetBtn.getAttribute('data-budget');
    }
    
    // Формируем URL для API-запроса с параметрами фильтрации
    let url = `/api/places/${stationId}`;
    const params = [];
    if (activity !== 'all') params.push(`activity=${encodeURIComponent(activity)}`);
    if (budget !== 'all') params.push(`budget=${encodeURIComponent(budget)}`);
    if (params.length > 0) {
        url += '?' + params.join('&');
    }
    
    try {
        console.log(`🔍 Фильтрация: активность=${activity}, бюджет=${budget}`);
        const response = await fetch(url);
        const places = await response.json();
        
        // Находим контейнер для списка мест
        const placesDiv = document.getElementById(`places-${stationId}`);
        if (!placesDiv) return;
        
        // Если мест нет — показываем сообщение
        if (places.length === 0) {
            placesDiv.innerHTML = '<div class="no-places">✨ Нет мест с выбранными фильтрами</div>';
            return;
        }
        
        // Строим HTML для каждого места
        let html = '';
        for (let i = 0; i < places.length; i++) {
            const place = places[i];
            
            // Получаем CSS-классы для окрашивания
            const budgetClass = getBudgetClass(place.budget_category);
            const activityClass = getActivityClass(place.activity_category);
            
            // Подготавливаем данные
            const placeType = place.place_type || 'место';
            const budgetText = place.budget_category || '';
            const activityText = place.activity_category || '';
            const minutes = place.walking_minutes || 0;
            const name = escapeHtml(place.name);
            const typeHtml = escapeHtml(placeType);
            
            // Иконка для времени пешком (человечек идёт)
            let walkIcon = '🚶';
            if (minutes === 0) walkIcon = '📍';
            else if (minutes <= 3) walkIcon = '🚶‍♂️';
            
            // Собираем HTML строку
            html += '<div class="place-item">';
            html += '<div class="place-name">';
            html += name;
            html += '<span class="place-type">(' + typeHtml + ')</span>';
            html += '</div>';
            html += '<div class="place-info">';
            html += '<span class="place-distance">' + walkIcon + ' ' + minutes + ' ' + declension(minutes, 'минута', 'минуты', 'минут') + '</span>';
            if (budgetText) {
                html += '<span class="badge ' + budgetClass + '">💰 ' + escapeHtml(budgetText) + '</span>';
            }
            if (activityText && activityText !== 'другое') {
                html += '<span class="badge ' + activityClass + '">🎯 ' + escapeHtml(activityText) + '</span>';
            }
            html += '</div>';
            html += '</div>';
        }
        placesDiv.innerHTML = html;
        
    } catch (error) {
        console.error('❌ Ошибка применения фильтров:', error);
        const placesDiv = document.getElementById(`places-${stationId}`);
        if (placesDiv) {
            placesDiv.innerHTML = '<div class="no-places">❌ Ошибка загрузки данных</div>';
        }
    }
}

// ============================================================
// ОТКРЫТИЕ/ЗАКРЫТИЕ КАРТОЧЕК
// ============================================================

/**
 * Переключает видимость карточки (открыть/закрыть)
 * @param {HTMLElement} element - DOM-элемент карточки
 * @param {number} stationId - ID станции
 */
async function toggleStation(element, stationId) {
    const details = document.getElementById(`details-${stationId}`);
    
    // Если карточка уже открыта — закрываем её
    if (details.classList.contains('show')) {
        details.classList.remove('show');
        element.classList.remove('active');
        console.log(`❌ Закрыта станция ${stationId}`);
        return;
    }
    
    // Закрываем все остальные открытые карточки
    const openDetails = document.querySelectorAll('.station-details.show');
    openDetails.forEach(detail => detail.classList.remove('show'));
    
    const openCards = document.querySelectorAll('.station-card.active');
    openCards.forEach(card => card.classList.remove('active'));
    
    // Открываем текущую карточку
    details.classList.add('show');
    element.classList.add('active');
    console.log(`✅ Открыта станция ${stationId}`);
    
    // Проверяем, нужно ли загрузить места (если ещё не загружены)
    const placesDiv = document.getElementById(`places-${stationId}`);
    if (placesDiv && placesDiv.innerHTML.includes('Загрузка')) {
        // Сбрасываем фильтры на значения по умолчанию
        const activityButtons = details.querySelectorAll('.filter-btn[data-activity]');
        const budgetButtons = details.querySelectorAll('.filter-btn[data-budget]');
        
        activityButtons.forEach(btn => btn.classList.remove('active'));
        budgetButtons.forEach(btn => btn.classList.remove('active'));
        
        const defaultActivityBtn = details.querySelector('.filter-btn[data-activity="all"]');
        const defaultBudgetBtn = details.querySelector('.filter-btn[data-budget="all"]');
        if (defaultActivityBtn) defaultActivityBtn.classList.add('active');
        if (defaultBudgetBtn) defaultBudgetBtn.classList.add('active');
        
        // Загружаем и отображаем места
        await applyFilters(stationId, null);
    }
}

// ============================================================
// ПОДГОТОВКА ИНТЕРАКТИВНЫХ ЭЛЕМЕНТОВ
// ============================================================

/**
 * Назначает обработчики событий для карточек
 * (альтернативный способ работе с onclick в HTML)
 */
function attachCardEvents() {
    const cards = document.querySelectorAll('.station-card');
    cards.forEach(card => {
        const stationId = card.getAttribute('data-id');
        if (stationId && !card.hasClickListener) {
            // Удаляем старый обработчик, если есть, чтобы не было дублей
            card.removeEventListener('click', card.clickHandler);
            // Создаём новый обработчик
            card.clickHandler = () => toggleStation(card, parseInt(stationId));
            card.addEventListener('click', card.clickHandler);
            card.hasClickListener = true;
        }
    });
}

/**
 * Назначает обработчики для кнопок фильтров
 * (для кнопок, которые могут быть добавлены динамически)
 */
function attachFilterEvents() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        if (!btn.hasFilterListener) {
            const stationCard = btn.closest('.station-card');
            if (stationCard) {
                const stationId = stationCard.getAttribute('data-id');
                if (stationId) {
                    btn.filterHandler = (event) => {
                        event.stopPropagation();
                        applyFilters(parseInt(stationId), event);
                    };
                    btn.addEventListener('click', btn.filterHandler);
                    btn.hasFilterListener = true;
                }
            }
        }
    });
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================================

/**
 * Главная функция инициализации
 * Загружает данные для всех станций и настраивает обработчики
 */
async function init() {
    console.log('🚀 Инициализация страницы...');
    
    // Находим все карточки станций
    const cards = document.querySelectorAll('.station-card');
    console.log(`📊 Найдено ${cards.length} станций`);
    
    // Загружаем данные для каждой станции
    for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const stationId = card.getAttribute('data-id');
        if (stationId) {
            const idNum = parseInt(stationId, 10);
            // Обновляем информацию о станции (факт, количество мест)
            await updateStationInfo(idNum);
            
            // Показываем прогресс каждые 20 станций
            if ((i + 1) % 20 === 0) {
                console.log(`📥 Загружено ${i + 1} из ${cards.length} станций`);
            }
        }
    }
    
    // Назначаем обработчики событий
    attachCardEvents();
    attachFilterEvents();
    
    console.log('✅ Страница готова!');
}

// Запускаем инициализацию после полной загрузки DOM
// DOMContentLoaded срабатывает, когда HTML полностью загружен и построен
document.addEventListener('DOMContentLoaded', init);

// Также обрабатываем динамически добавляемые элементы (для фильтров)
// MutationObserver следит за изменениями в DOM и переназначает обработчики
const observer = new MutationObserver(() => {
    attachFilterEvents();
});
observer.observe(document.body, { childList: true, subtree: true });