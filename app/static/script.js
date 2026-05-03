// app/static/script.js
// Клиентская логика: загрузка станций, фильтрация, отображение

const placesCache = {};

// Защита от XSS-атак
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// CSS-классы для бейджей
function getBudgetClass(budget) {
    switch (budget) {
        case 'бесплатно': return 'badge-free';
        case 'дёшево': return 'badge-cheap';
        case 'средний': return 'badge-medium';
        case 'дорого': return 'badge-expensive';
        default: return '';
    }
}

function getActivityClass(activity) {
    switch (activity) {
        case 'есть': return 'badge-eat';
        case 'смотреть': return 'badge-see';
        case 'гулять': return 'badge-walk';
        default: return '';
    }
}

// Загрузка мест (с кэшированием)
async function loadPlaces(stationId) {
    if (placesCache[stationId]) return placesCache[stationId];
    
    try {
        const response = await fetch(`/api/places/${stationId}`);
        const data = await response.json();
        placesCache[stationId] = data;
        return data;
    } catch (error) {
        console.error('Ошибка загрузки мест:', error);
        return [];
    }
}

// Обновление информации о станции (факт + количество мест)
async function updateStationInfo(stationId) {
    try {
        const stationResponse = await fetch(`/api/station/${stationId}`);
        const station = await stationResponse.json();
        
        const factElement = document.getElementById(`fact-${stationId}`);
        if (factElement && station.fact) {
            let factText = station.fact;
            if (factText.length > 120) factText = factText.slice(0, 120) + '...';
            factElement.innerHTML = `📖 ${escapeHtml(factText)}`;
        }
        
        const places = await loadPlaces(stationId);
        const countElement = document.getElementById(`count-${stationId}`);
        if (countElement) {
            countElement.innerHTML = `🏛️ ${places.length} ${declension(places.length, 'место', 'места', 'мест')}`;
        }
    } catch (error) {
        console.error('Ошибка загрузки информации о станции:', error);
    }
}

// Склонение слов
function declension(number, one, two, five) {
    const n = Math.abs(number) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
}

// Фильтрация и отображение мест
async function applyFilters(stationId, event) {
    if (event?.stopPropagation) event.stopPropagation();
    
    const detailsDiv = document.getElementById(`details-${stationId}`);
    if (!detailsDiv) return;
    
    let activity = detailsDiv.querySelector('.filter-btn[data-activity].active')?.getAttribute('data-activity') || 'all';
    let budget = detailsDiv.querySelector('.filter-btn[data-budget].active')?.getAttribute('data-budget') || 'all';
    
    // Обновление активных классов при клике
    if (event?.target?.classList?.contains('filter-btn')) {
        const group = event.target.hasAttribute('data-activity') ? 'data-activity' : 'data-budget';
        detailsDiv.querySelectorAll(`.filter-btn[${group}]`).forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        activity = detailsDiv.querySelector('.filter-btn[data-activity].active')?.getAttribute('data-activity') || 'all';
        budget = detailsDiv.querySelector('.filter-btn[data-budget].active')?.getAttribute('data-budget') || 'all';
    }
    
    // Формирование URL с параметрами
    let url = `/api/places/${stationId}`;
    const params = [];
    if (activity !== 'all') params.push(`activity=${encodeURIComponent(activity)}`);
    if (budget !== 'all') params.push(`budget=${encodeURIComponent(budget)}`);
    if (params.length) url += '?' + params.join('&');
    
    try {
        const response = await fetch(url);
        const places = await response.json();
        const placesDiv = document.getElementById(`places-${stationId}`);
        if (!placesDiv) return;
        
        if (!places.length) {
            placesDiv.innerHTML = '<div class="no-places">✨ Нет мест с выбранными фильтрами</div>';
            return;
        }
        
        let html = '';
        for (const place of places) {
            const budgetClass = getBudgetClass(place.budget_category);
            const activityClass = getActivityClass(place.activity_category);
            const minutes = place.walking_minutes || 0;
            
            let walkIcon = minutes === 0 ? '📍' : minutes <= 3 ? '🚶‍♂️' : '🚶';
            
            html += `
                <div class="place-item">
                    <div class="place-name">
                        ${escapeHtml(place.name)}
                        <span class="place-type">(${escapeHtml(place.place_type || 'место')})</span>
                    </div>
                    <div class="place-info">
                        <span class="place-distance">${walkIcon} ${minutes} ${declension(minutes, 'минута', 'минуты', 'минут')}</span>
                        ${place.budget_category ? `<span class="badge ${budgetClass}">💰 ${escapeHtml(place.budget_category)}</span>` : ''}
                        ${place.activity_category && place.activity_category !== 'другое' ? `<span class="badge ${activityClass}">🎯 ${escapeHtml(place.activity_category)}</span>` : ''}
                    </div>
                </div>
            `;
        }
        placesDiv.innerHTML = html;
    } catch (error) {
        console.error('Ошибка фильтрации:', error);
        const placesDiv = document.getElementById(`places-${stationId}`);
        if (placesDiv) placesDiv.innerHTML = '<div class="no-places">❌ Ошибка загрузки данных</div>';
    }
}

// Открытие/закрытие карточки
async function toggleStation(element, stationId) {
    const details = document.getElementById(`details-${stationId}`);
    
    if (details.classList.contains('show')) {
        details.classList.remove('show');
        element.classList.remove('active');
        return;
    }
    
    // Закрываем все другие карточки
    document.querySelectorAll('.station-details.show').forEach(d => d.classList.remove('show'));
    document.querySelectorAll('.station-card.active').forEach(c => c.classList.remove('active'));
    
    details.classList.add('show');
    element.classList.add('active');
    
    const placesDiv = document.getElementById(`places-${stationId}`);
    if (placesDiv?.innerHTML.includes('Загрузка')) {
        const container = details;
        container.querySelectorAll('.filter-btn[data-activity]').forEach(btn => btn.classList.remove('active'));
        container.querySelectorAll('.filter-btn[data-budget]').forEach(btn => btn.classList.remove('active'));
        container.querySelector('.filter-btn[data-activity="all"]')?.classList.add('active');
        container.querySelector('.filter-btn[data-budget="all"]')?.classList.add('active');
        await applyFilters(stationId);
    }
}

// Назначение обработчиков карточкам
function attachCardEvents() {
    document.querySelectorAll('.station-card').forEach(card => {
        const stationId = card.getAttribute('data-id');
        if (stationId && !card.hasClickListener) {
            const handler = () => toggleStation(card, parseInt(stationId));
            card.addEventListener('click', handler);
            card.clickHandler = handler;
            card.hasClickListener = true;
        }
    });
}

// Назначение обработчиков фильтрам
function attachFilterEvents() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (!btn.hasFilterListener) {
            const stationCard = btn.closest('.station-card');
            const stationId = stationCard?.getAttribute('data-id');
            if (stationId) {
                const handler = (event) => {
                    event.stopPropagation();
                    applyFilters(parseInt(stationId), event);
                };
                btn.addEventListener('click', handler);
                btn.filterHandler = handler;
                btn.hasFilterListener = true;
            }
        }
    });
}

// Инициализация страницы
async function init() {
    const cards = document.querySelectorAll('.station-card');
    
    for (let i = 0; i < cards.length; i++) {
        const stationId = cards[i].getAttribute('data-id');
        if (stationId) await updateStationInfo(parseInt(stationId));
    }
    
    attachCardEvents();
    attachFilterEvents();
}

document.addEventListener('DOMContentLoaded', init);

// Наблюдатель за новыми фильтрами
new MutationObserver(() => attachFilterEvents()).observe(document.body, { childList: true, subtree: true });