
const API_KEY = '4733eaf4-4488-484d-bab6-70863c53ffc9';
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';

let allOrders = [];
let allCourses = [];
let allTutors = [];
let currentOrderPage = 1;
const ORDERS_PER_PAGE = 5;

let viewModal = null;
let editModal = null;
let deleteModal = null;

let editingOrder = null;

// ==================== УВЕДОМЛЕНИЯ ====================

function showNotification(message, type = 'info') {
    const notificationArea = document.getElementById('notification-area');
    const alertId = 'alert-' + Date.now();

    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    notificationArea.insertAdjacentHTML('beforeend', alertHtml);

    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================

async function loadAllData() {
    try {
        // Загружаем курсы, репетиторов и заказы параллельно
        const [coursesRes, tutorsRes, ordersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/courses?api_key=${API_KEY}`),
            fetch(`${API_BASE_URL}/tutors?api_key=${API_KEY}`),
            fetch(`${API_BASE_URL}/orders?api_key=${API_KEY}`)
        ]);

        if (!coursesRes.ok || !tutorsRes.ok || !ordersRes.ok) {
            throw new Error('Ошибка загрузки данных');
        }

        allCourses = await coursesRes.json();
        allTutors = await tutorsRes.json();
        allOrders = await ordersRes.json();

        renderOrders();
        renderOrdersPagination();

    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Не удалось загрузить данные', 'danger');
    }
}

// ==================== ОТОБРАЖЕНИЕ ТАБЛИЦЫ ====================

function getCourseById(id) {
    return allCourses.find(c => c.id === id) || null;
}

function getTutorById(id) {
    return allTutors.find(t => t.id === id) || null;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
}

function formatTime(time) {
    const timeMap = {
        'morning': 'утро',
        'afternoon': 'день',
        'evening': 'вечер',
        '09:00': 'утро (9:00)',
        '14:00': 'день (14:00)',
        '18:00': 'вечер (18:00)'
    };
    return timeMap[time] || time || '—';
}

function getStatusBadge(status) {
    const statusMap = {
        'pending': { text: 'ожидает', class: 'status-pending' },
        'confirmed': { text: 'подтверждён', class: 'status-confirmed' },
        'completed': { text: 'завершён', class: 'status-completed' },
        'cancelled': { text: 'отменён', class: 'status-cancelled' }
    };
    const s = statusMap[status] || { text: status || 'новый', class: 'status-pending' };
    return `<span class="status-badge ${s.class}">${s.text}</span>`;
}

function renderOrders() {
    const tbody = document.getElementById('orders-table-body');
    if (!tbody) return;

    const startIndex = (currentOrderPage - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;
    const ordersToShow = allOrders.slice(startIndex, endIndex);

    if (ordersToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-5">
                    <p class="text-muted mb-0">заказов пока нет</p>
                    <a href="index.html#courses" class="btn btn-accent btn-sm mt-3">
                        выбрать курс
                    </a>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = ordersToShow.map((order, index) => {
        const course = getCourseById(order.course_id);
        const tutor = getTutorById(order.tutor_id);
        const globalIndex = startIndex + index + 1;

        return `
            <tr>
                <td>${globalIndex}</td>
                <td>${course ? course.name : `ID: ${order.course_id}`}</td>
                <td>${tutor ? tutor.name : '—'}</td>
                <td>${formatDate(order.date_start)}</td>
                <td>${formatTime(order.time_start || order.time_slot)}</td>
                <td>${(order.price || order.total_price) ? (order.price || order.total_price).toLocaleString('ru-RU') + ' руб' : '—'}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action btn-view" onclick="viewOrder(${order.id})" title="просмотр">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn-action btn-edit" onclick="editOrder(${order.id})" title="редактировать">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn-action btn-delete" onclick="deleteOrder(${order.id})" title="удалить">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderOrdersPagination() {
    const container = document.getElementById('orders-pagination');
    if (!container) return;

    const totalPages = Math.ceil(allOrders.length / ORDERS_PER_PAGE);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHtml = `
        <button class="page-btn" onclick="changeOrderPage(${currentOrderPage - 1})" ${currentOrderPage === 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <button class="page-btn ${i === currentOrderPage ? 'active' : ''}" onclick="changeOrderPage(${i})">
                ${i}
            </button>
        `;
    }

    paginationHtml += `
        <button class="page-btn" onclick="changeOrderPage(${currentOrderPage + 1})" ${currentOrderPage === totalPages ? 'disabled' : ''}>
            <i class="bi bi-chevron-right"></i>
        </button>
    `;

    container.innerHTML = paginationHtml;
}

function changeOrderPage(page) {
    const totalPages = Math.ceil(allOrders.length / ORDERS_PER_PAGE);
    if (page < 1 || page > totalPages) return;

    currentOrderPage = page;
    renderOrders();
    renderOrdersPagination();
}

// ==================== ПРОСМОТР ЗАКАЗА ====================

function viewOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        showNotification('Заказ не найден', 'danger');
        return;
    }

    const course = getCourseById(order.course_id);
    const tutor = getTutorById(order.tutor_id);

    const optionsArray = order.options ? order.options.split(',') : [];
    const optionNames = {
        'intensive': 'Интенсив',
        'group': 'Групповой',
        'early_booking': 'Раннее бронирование',
        'morning': 'Утренние занятия',
        'materials': 'Учебные материалы',
        'certificate': 'Сертификат',
        'individual_plan': 'Индивидуальный план',
        'weekend': 'Выходные дни'
    };

    const detailsHtml = `
        <div class="detail-row">
            <span class="detail-label">ID заказа:</span>
            <span class="detail-value">#${order.id}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Курс:</span>
            <span class="detail-value">${course ? course.name : 'Не найден'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Уровень:</span>
            <span class="detail-value">${course ? course.level : '—'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Репетитор:</span>
            <span class="detail-value">${tutor ? tutor.name : 'Не выбран'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Дата начала:</span>
            <span class="detail-value">${formatDate(order.date_start)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Время занятий:</span>
            <span class="detail-value">${formatTime(order.time_start || order.time_slot)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Кол-во студентов:</span>
            <span class="detail-value">${order.persons || order.students_count || 1}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Опции:</span>
            <span class="detail-value">${optionsArray.length > 0 ? optionsArray.map(o => optionNames[o] || o).join(', ') : 'Нет'}</span>
        </div>
        <div class="detail-row total">
            <span class="detail-label">Стоимость:</span>
            <span class="detail-value">${(order.price || order.total_price) ? (order.price || order.total_price).toLocaleString('ru-RU') + ' руб' : '—'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Статус:</span>
            <span class="detail-value">${getStatusBadge(order.status)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Создан:</span>
            <span class="detail-value">${formatDate(order.created_at)}</span>
        </div>
    `;

    document.getElementById('view-order-details').innerHTML = detailsHtml;

    if (!viewModal) {
        viewModal = new bootstrap.Modal(document.getElementById('viewOrderModal'));
    }
    viewModal.show();
}

// ==================== РЕДАКТИРОВАНИЕ ЗАКАЗА ====================

function editOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        showNotification('Заказ не найден', 'danger');
        return;
    }

    editingOrder = order;
    const course = getCourseById(order.course_id);
    const tutor = getTutorById(order.tutor_id);

    // Заполняем информацию о курсе
    document.getElementById('edit-course-info').innerHTML = course ? `
        <div class="selected-item">
            <strong>${course.name}</strong>
            <span class="badge">${course.level}</span>
        </div>
    ` : '<span class="text-muted">Курс не найден</span>';

    // Заполняем информацию о репетиторе
    document.getElementById('edit-tutor-info').innerHTML = tutor ? `
        <div class="selected-item">
            <strong>${tutor.name}</strong>
            <span class="badge">${(tutor.languages_offered || []).join(', ')}</span>
        </div>
    ` : '<span class="text-muted">Репетитор не выбран</span>';

    // Заполняем поля формы
    document.getElementById('edit-order-id').value = order.id;
    document.getElementById('edit-date').value = order.date_start || '';
    document.getElementById('edit-time').value = order.time_start || order.time_slot || '';
    document.getElementById('edit-students').value = order.persons || order.students_count || 1;

    // Устанавливаем минимальную дату
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('edit-date').min = today;

    // Заполняем опции
    const optionsArray = order.options ? order.options.split(',') : [];
    document.getElementById('edit-opt-intensive').checked = optionsArray.includes('intensive');
    document.getElementById('edit-opt-group').checked = optionsArray.includes('group');
    document.getElementById('edit-opt-early').checked = optionsArray.includes('early_booking');
    document.getElementById('edit-opt-morning').checked = optionsArray.includes('morning');
    document.getElementById('edit-opt-materials').checked = optionsArray.includes('materials');
    document.getElementById('edit-opt-certificate').checked = optionsArray.includes('certificate');
    document.getElementById('edit-opt-individual').checked = optionsArray.includes('individual_plan');
    document.getElementById('edit-opt-weekend').checked = optionsArray.includes('weekend');

    // Рассчитываем стоимость
    calculateEditPrice();

    if (!editModal) {
        editModal = new bootstrap.Modal(document.getElementById('editOrderModal'));
    }
    editModal.show();
}

function calculateEditPrice() {
    if (!editingOrder) return 0;

    const course = getCourseById(editingOrder.course_id);
    const tutor = getTutorById(editingOrder.tutor_id);

    if (!course) return 0;

    const students = parseInt(document.getElementById('edit-students').value) || 1;
    const time = document.getElementById('edit-time').value;
    const dateValue = document.getElementById('edit-date').value;

    // Базовая стоимость
    const totalHours = course.week_length * course.total_length;
    let basePrice = course.course_fee_per_hour * totalHours;

    // Стоимость репетитора
    let tutorPrice = 0;
    if (tutor) {
        tutorPrice = tutor.price_per_hour * totalHours;
    }

    let subtotal = basePrice + tutorPrice;

    // Опции
    const optIntensive = document.getElementById('edit-opt-intensive').checked;
    const optGroup = document.getElementById('edit-opt-group').checked;
    const optEarly = document.getElementById('edit-opt-early').checked;
    const optMorning = document.getElementById('edit-opt-morning').checked;
    const optMaterials = document.getElementById('edit-opt-materials').checked;
    const optCertificate = document.getElementById('edit-opt-certificate').checked;
    const optIndividual = document.getElementById('edit-opt-individual').checked;
    const optWeekend = document.getElementById('edit-opt-weekend').checked;

    // Скидки
    let discountPercent = 0;
    if (optIntensive) discountPercent += 10;
    if (optGroup && students >= 5) discountPercent += 15;
    if (optMorning && time === 'morning') discountPercent += 5;

    if (optEarly && dateValue) {
        const orderDate = new Date(dateValue);
        const today = new Date();
        const diffDays = Math.ceil((orderDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays >= 30) {
            discountPercent += 5;
        }
    }

    let discountAmount = subtotal * (discountPercent / 100);

    // Надбавки
    let surchargePercent = 0;
    let surchargeFixed = 0;

    if (optIndividual) surchargePercent += 20;
    if (optWeekend) surchargePercent += 15;
    if (optMaterials) surchargeFixed += 2000;
    if (optCertificate) surchargeFixed += 1500;

    let surchargeAmount = subtotal * (surchargePercent / 100) + surchargeFixed;

    // Итого
    let total = (subtotal - discountAmount + surchargeAmount) * students;

    document.getElementById('edit-price-total').textContent = `${total.toLocaleString('ru-RU')} руб`;

    return total;
}

async function saveOrderChanges() {
    if (!editingOrder) return;

    const dateValue = document.getElementById('edit-date').value;
    const timeValue = document.getElementById('edit-time').value;
    const studentsValue = document.getElementById('edit-students').value;

    // Валидация
    if (!dateValue) {
        showNotification('Укажите дату начала', 'danger');
        return;
    }

    if (!timeValue) {
        showNotification('Выберите время занятий', 'danger');
        return;
    }

    const totalPrice = calculateEditPrice();

    // Собираем опции
    const options = [];
    if (document.getElementById('edit-opt-intensive').checked) options.push('intensive');
    if (document.getElementById('edit-opt-group').checked) options.push('group');
    if (document.getElementById('edit-opt-early').checked) options.push('early_booking');
    if (document.getElementById('edit-opt-morning').checked) options.push('morning');
    if (document.getElementById('edit-opt-materials').checked) options.push('materials');
    if (document.getElementById('edit-opt-certificate').checked) options.push('certificate');
    if (document.getElementById('edit-opt-individual').checked) options.push('individual_plan');
    if (document.getElementById('edit-opt-weekend').checked) options.push('weekend');

    // Преобразуем время в формат для API
    const timeMap = {
        'morning': '09:00',
        'afternoon': '14:00',
        'evening': '18:00'
    };

    const course = getCourseById(editingOrder.course_id);

    // Формируем данные для отправки (поля согласно API)
    const updateData = {
        date_start: dateValue,
        time_start: timeMap[timeValue] || timeValue || '09:00',
        duration: course ? course.total_length : 1,
        persons: parseInt(studentsValue),
        price: totalPrice
    };

    if (options.length > 0) {
        updateData.options = options.join(',');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/orders/${editingOrder.id}?api_key=${API_KEY}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка обновления заказа');
        }

        showNotification('Заказ успешно обновлён!', 'success');
        editModal.hide();

        // Перезагружаем данные
        await loadAllData();

    } catch (error) {
        console.error('Ошибка:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }
}

// ==================== УДАЛЕНИЕ ЗАКАЗА ====================

function deleteOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        showNotification('Заказ не найден', 'danger');
        return;
    }

    const course = getCourseById(order.course_id);

    document.getElementById('delete-order-id').value = order.id;
    document.getElementById('delete-order-name').textContent =
        `#${order.id} - ${course ? course.name : 'Курс'}`;

    if (!deleteModal) {
        deleteModal = new bootstrap.Modal(document.getElementById('deleteOrderModal'));
    }
    deleteModal.show();
}

async function confirmDeleteOrder() {
    const orderId = document.getElementById('delete-order-id').value;

    if (!orderId) {
        showNotification('ID заказа не найден', 'danger');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}?api_key=${API_KEY}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка удаления заказа');
        }

        showNotification('Заказ успешно удалён!', 'success');
        deleteModal.hide();

        // Перезагружаем данные
        await loadAllData();

    } catch (error) {
        console.error('Ошибка:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Личный кабинет загружен');

    loadAllData();

    // Обработчики для пересчёта цены в форме редактирования
    const editForm = document.getElementById('edit-order-form');
    if (editForm) {
        editForm.addEventListener('change', calculateEditPrice);
        editForm.addEventListener('input', calculateEditPrice);
    }
});
