
const API_KEY = '4733eaf4-4488-484d-bab6-70863c53ffc9';
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';

let allCourses = [];
let filteredCourses = [];
let currentCoursePage = 1;
const COURSES_PER_PAGE = 5;

let allTutors = [];
let filteredTutors = [];
let currentTutorPage = 1;
const TUTORS_PER_PAGE = 5;
let selectedTutorId = null;

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

async function loadCourses() {
    try {
        const response = await fetch(`${API_BASE_URL}/courses?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки курсов');
        }
        allCourses = await response.json();
        filteredCourses = [...allCourses];
        currentCoursePage = 1;
        renderCourses();
        renderCoursesPagination();
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Не удалось загрузить курсы', 'danger');
    }
}

function renderCourses() {
    const container = document.getElementById('courses-list');
    if (!container) return;

    const startIndex = (currentCoursePage - 1) * COURSES_PER_PAGE;
    const endIndex = startIndex + COURSES_PER_PAGE;
    const coursesToShow = filteredCourses.slice(startIndex, endIndex);

    if (coursesToShow.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <p class="text-muted">курсы не найдены</p>
            </div>
        `;
        return;
    }

    container.innerHTML = coursesToShow.map(course => `
        <div class="course-item" data-course-id="${course.id}">
            <div class="course-info">
                <div class="course-header">
                    <h5 class="course-name">${course.name}</h5>
                    <span class="course-level">${course.level}</span>
                </div>
                <p class="course-description">${course.description}</p>
                <div class="course-meta">
                    <span><i class="bi bi-person"></i> ${course.teacher}</span>
                    <span><i class="bi bi-clock"></i> ${course.total_length} нед. / ${course.week_length} ч/нед</span>
                    <span><i class="bi bi-cash"></i> ${course.course_fee_per_hour} руб/час</span>
                </div>
            </div>
            <div class="course-actions">
                <button class="btn btn-accent btn-sm" onclick="openCourseModal(${course.id})">
                    записаться
                </button>
            </div>
        </div>
    `).join('');
}

function renderCoursesPagination() {
    const container = document.getElementById('courses-pagination');
    if (!container) return;

    const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHtml = `
        <button class="page-btn" onclick="changePage(${currentCoursePage - 1})" ${currentCoursePage === 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <button class="page-btn ${i === currentCoursePage ? 'active' : ''}" onclick="changePage(${i})">
                ${i}
            </button>
        `;
    }

    paginationHtml += `
        <button class="page-btn" onclick="changePage(${currentCoursePage + 1})" ${currentCoursePage === totalPages ? 'disabled' : ''}>
            <i class="bi bi-chevron-right"></i>
        </button>
    `;

    container.innerHTML = paginationHtml;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredCourses.length / COURSES_PER_PAGE);
    if (page < 1 || page > totalPages) return;

    currentCoursePage = page;
    renderCourses();
    renderCoursesPagination();

    document.getElementById('courses').scrollIntoView({ behavior: 'smooth' });
}

function searchCourses() {
    const searchInput = document.getElementById('course-search');
    const levelSelect = document.getElementById('course-level-filter');

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedLevel = levelSelect ? levelSelect.value : '';

    filteredCourses = allCourses.filter(course => {
        const matchesSearch = !searchTerm ||
            course.name.toLowerCase().includes(searchTerm) ||
            course.description.toLowerCase().includes(searchTerm) ||
            course.teacher.toLowerCase().includes(searchTerm);

        const matchesLevel = !selectedLevel || course.level === selectedLevel;

        return matchesSearch && matchesLevel;
    });

    currentCoursePage = 1;
    renderCourses();
    renderCoursesPagination();
}

// ==================== РЕПЕТИТОРЫ ====================

async function loadTutors() {
    try {
        const response = await fetch(`${API_BASE_URL}/tutors?api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error('Ошибка загрузки репетиторов');
        }
        allTutors = await response.json();
        filteredTutors = [...allTutors];
        currentTutorPage = 1;
        populateLanguageFilter();
        renderTutors();
        renderTutorsPagination();
    } catch (error) {
        console.error('Ошибка:', error);
        showNotification('Не удалось загрузить репетиторов', 'danger');
    }
}

function populateLanguageFilter() {
    const select = document.getElementById('tutor-language-filter');
    if (!select) return;

    // Собираем все уникальные языки из массивов languages_offered
    const allLanguages = allTutors.flatMap(t => t.languages_offered || []);
    const languages = [...new Set(allLanguages)].sort();

    languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = lang;
        select.appendChild(option);
    });
}

function getTutorLevel(tutor) {
    // Используем поле language_level из API
    const levelMap = {
        'Advanced': { key: 'advanced', text: 'продвинутый' },
        'Intermediate': { key: 'intermediate', text: 'средний' },
        'Beginner': { key: 'beginner', text: 'начальный' }
    };
    return levelMap[tutor.language_level] || { key: 'beginner', text: 'начальный' };
}

// Извлечение языка из названия курса и сопоставление с языками репетитора
function getCourseLanguage(course) {
    const courseName = (course.name || '').toLowerCase();

    // Маппинг ключевых слов в названии курса на языки репетитора (как в API)
    const languageMap = {
        // Русские названия
        'английск': 'English',
        'english': 'English',
        'немецк': 'German',
        'german': 'German',
        'французск': 'French',
        'french': 'French',
        'испанск': 'Spanish',
        'spanish': 'Spanish',
        'итальянск': 'Italian',
        'italian': 'Italian',
        'китайск': 'Chinese',
        'chinese': 'Chinese',
        'японск': 'Japanese',
        'japanese': 'Japanese',
        'корейск': 'Korean',
        'korean': 'Korean',
        'русск': 'Russian',
        'russian': 'Russian',
        'португальск': 'Portuguese',
        'portuguese': 'Portuguese',
        'арабск': 'Arabic',
        'arabic': 'Arabic'
    };

    for (const [keyword, language] of Object.entries(languageMap)) {
        if (courseName.includes(keyword)) {
            return language;
        }
    }

    return null; // Не удалось определить язык
}

// Проверяет, может ли репетитор преподавать курс
function canTutorTeachCourse(tutor, course) {
    if (!tutor) return true; // Если репетитор не выбран - проверка не нужна

    const courseLanguage = getCourseLanguage(course);
    if (!courseLanguage) return true; // Если язык не определён - разрешаем

    const tutorLanguages = tutor.languages_offered || [];
    return tutorLanguages.includes(courseLanguage);
}

function renderTutors() {
    const container = document.getElementById('tutors-list');
    if (!container) return;

    const startIndex = (currentTutorPage - 1) * TUTORS_PER_PAGE;
    const endIndex = startIndex + TUTORS_PER_PAGE;
    const tutorsToShow = filteredTutors.slice(startIndex, endIndex);

    if (tutorsToShow.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <p class="text-muted mb-0">репетиторы не найдены</p>
                </td>
            </tr>
        `;
        return;
    }

    container.innerHTML = tutorsToShow.map(tutor => {
        const level = getTutorLevel(tutor);
        const isSelected = selectedTutorId === tutor.id;

        return `
            <tr class="${isSelected ? 'selected' : ''}" onclick="selectTutor(${tutor.id})">
                <td>
                    <div class="tutor-photo">
                        <i class="bi bi-person-circle"></i>
                    </div>
                </td>
                <td>
                    <strong class="tutor-name">${tutor.name}</strong>
                </td>
                <td>
                    <span class="level-badge level-${level.key}">${level.text}</span>
                </td>
                <td>${(tutor.languages_offered || []).join(', ')}</td>
                <td>${tutor.work_experience} лет</td>
                <td>${tutor.price_per_hour} руб/час</td>
                <td>
                    <div class="tutor-table-actions">
                        <button class="btn btn-sm ${isSelected ? 'btn-accent' : 'btn-outline-accent'}"
                                onclick="event.stopPropagation(); selectTutor(${tutor.id})"
                                title="${isSelected ? 'выбран' : 'выбрать'}">
                            <i class="bi ${isSelected ? 'bi-check-lg' : 'bi-plus-lg'}"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary"
                                onclick="event.stopPropagation(); requestTutorSession(${tutor.id})"
                                title="запросить">
                            <i class="bi bi-envelope"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderTutorsPagination() {
    const container = document.getElementById('tutors-pagination');
    if (!container) return;

    const totalPages = Math.ceil(filteredTutors.length / TUTORS_PER_PAGE);

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHtml = `
        <button class="page-btn" onclick="changeTutorPage(${currentTutorPage - 1})" ${currentTutorPage === 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <button class="page-btn ${i === currentTutorPage ? 'active' : ''}" onclick="changeTutorPage(${i})">
                ${i}
            </button>
        `;
    }

    paginationHtml += `
        <button class="page-btn" onclick="changeTutorPage(${currentTutorPage + 1})" ${currentTutorPage === totalPages ? 'disabled' : ''}>
            <i class="bi bi-chevron-right"></i>
        </button>
    `;

    container.innerHTML = paginationHtml;
}

function changeTutorPage(page) {
    const totalPages = Math.ceil(filteredTutors.length / TUTORS_PER_PAGE);
    if (page < 1 || page > totalPages) return;

    currentTutorPage = page;
    renderTutors();
    renderTutorsPagination();

    document.getElementById('tutors').scrollIntoView({ behavior: 'smooth' });
}

function searchTutors() {
    const languageSelect = document.getElementById('tutor-language-filter');
    const levelSelect = document.getElementById('tutor-level-filter');

    const selectedLanguage = languageSelect ? languageSelect.value : '';
    const selectedLevel = levelSelect ? levelSelect.value : '';

    filteredTutors = allTutors.filter(tutor => {
        // Фильтр по языку (проверяем в массиве languages_offered)
        const matchesLanguage = !selectedLanguage ||
            (tutor.languages_offered || []).includes(selectedLanguage);

        // Фильтр по уровню
        let matchesLevel = true;
        if (selectedLevel) {
            const tutorLevel = getTutorLevel(tutor);
            matchesLevel = tutorLevel.key === selectedLevel;
        }

        return matchesLanguage && matchesLevel;
    });

    currentTutorPage = 1;
    renderTutors();
    renderTutorsPagination();
}

function selectTutor(tutorId) {
    const tutor = allTutors.find(t => t.id === tutorId);
    if (!tutor) return;

    if (selectedTutorId === tutorId) {
        selectedTutorId = null;
        showNotification('Выбор репетитора отменен', 'info');
    } else {
        selectedTutorId = tutorId;
        showNotification(`Выбран репетитор: ${tutor.name}`, 'success');
    }

    renderTutors();
}

function getSelectedTutor() {
    return allTutors.find(t => t.id === selectedTutorId) || null;
}

let tutorRequestModal = null;

function requestTutorSession(tutorId) {
    const tutor = allTutors.find(t => t.id === tutorId);
    if (!tutor) {
        showNotification('Репетитор не найден', 'danger');
        return;
    }

    // Заполняем данные в модальном окне
    document.getElementById('request-tutor-id').value = tutorId;
    const languages = (tutor.languages_offered || []).join(', ');
    document.getElementById('request-tutor-name').textContent = `Репетитор: ${tutor.name} (${languages})`;

    // Очищаем форму
    document.getElementById('request-name').value = '';
    document.getElementById('request-email').value = '';
    document.getElementById('request-message').value = '';

    // Открываем модальное окно
    if (!tutorRequestModal) {
        tutorRequestModal = new bootstrap.Modal(document.getElementById('tutorRequestModal'));
    }
    tutorRequestModal.show();
}

function submitTutorRequest() {
    const tutorId = document.getElementById('request-tutor-id').value;
    const name = document.getElementById('request-name').value.trim();
    const email = document.getElementById('request-email').value.trim();
    const message = document.getElementById('request-message').value.trim();

    // Валидация
    if (!name) {
        showNotification('Введите ваше имя', 'danger');
        return;
    }

    if (!email) {
        showNotification('Введите email', 'danger');
        return;
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Введите корректный email', 'danger');
        return;
    }

    const tutor = allTutors.find(t => t.id === parseInt(tutorId));

    // Имитируем отправку запроса (т.к. API не поддерживает такой эндпоинт)
    console.log('Запрос на репетиторство:', {
        tutor_id: tutorId,
        tutor_name: tutor ? tutor.name : 'Unknown',
        client_name: name,
        client_email: email,
        message: message
    });

    // Закрываем модальное окно и показываем уведомление
    tutorRequestModal.hide();
    showNotification(`Запрос отправлен репетитору ${tutor ? tutor.name : ''}! Мы свяжемся с вами по email.`, 'success');
}

// ==================== МОДАЛЬНОЕ ОКНО ЗАЯВКИ ====================

let selectedCourseId = null;
let orderModal = null;

function openCourseModal(courseId) {
    const course = allCourses.find(c => c.id === courseId);
    if (!course) {
        showNotification('Курс не найден', 'danger');
        return;
    }

    selectedCourseId = courseId;

    // Заполняем информацию о курсе
    const courseInfo = document.getElementById('modal-course-info');
    courseInfo.innerHTML = `
        <div class="selected-item">
            <strong>${course.name}</strong>
            <span class="badge">${course.level}</span>
        </div>
        <div class="selected-details">
            <span><i class="bi bi-person"></i> ${course.teacher}</span>
            <span><i class="bi bi-clock"></i> ${course.total_length} нед.</span>
            <span><i class="bi bi-cash"></i> ${course.course_fee_per_hour} руб/час</span>
        </div>
    `;

    // Заполняем информацию о репетиторе
    const tutorInfo = document.getElementById('modal-tutor-info');
    const tutor = getSelectedTutor();

    if (tutor) {
        tutorInfo.innerHTML = `
            <div class="selected-item">
                <strong>${tutor.name}</strong>
                <span class="badge">${(tutor.languages_offered || []).join(', ')}</span>
            </div>
            <div class="selected-details">
                <span><i class="bi bi-briefcase"></i> опыт: ${tutor.work_experience} лет</span>
                <span><i class="bi bi-cash"></i> ${tutor.price_per_hour} руб/час</span>
            </div>
        `;
    } else {
        tutorInfo.innerHTML = `<span class="text-muted">репетитор не выбран (опционально)</span>`;
    }

    // Заполняем выпадающий список дат из start_dates курса
    const dateSelect = document.getElementById('order-date');
    const timeSelect = document.getElementById('order-time');

    dateSelect.innerHTML = '<option value="">выберите дату</option>';
    timeSelect.innerHTML = '<option value="">сначала выберите дату</option>';
    timeSelect.disabled = true;

    // Парсим start_dates и извлекаем уникальные даты
    const startDates = course.start_dates || [];
    const uniqueDates = [...new Set(startDates.map(dt => dt.split('T')[0]))].sort();

    uniqueDates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        // Форматируем дату для отображения
        const dateObj = new Date(date);
        option.textContent = dateObj.toLocaleDateString('ru-RU', {
            weekday: 'short',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        dateSelect.appendChild(option);
    });

    // Сохраняем все start_dates для фильтрации времени
    dateSelect.dataset.startDates = JSON.stringify(startDates);

    // Сбрасываем форму
    document.getElementById('order-students').value = '1';

    // Сбрасываем все чекбоксы
    document.querySelectorAll('#order-form input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });

    // Обновляем отображение продолжительности
    updateDurationInfo(course, null);

    // Рассчитываем начальную стоимость
    calculatePrice();

    // Открываем модальное окно
    if (!orderModal) {
        orderModal = new bootstrap.Modal(document.getElementById('orderModal'));
    }
    orderModal.show();
}

// Обновление времени при выборе даты
function onDateChange() {
    const dateSelect = document.getElementById('order-date');
    const timeSelect = document.getElementById('order-time');
    const selectedDate = dateSelect.value;

    if (!selectedDate) {
        timeSelect.innerHTML = '<option value="">сначала выберите дату</option>';
        timeSelect.disabled = true;
        updateDurationInfo(null, null);
        return;
    }

    // Получаем все start_dates из data-атрибута
    const startDates = JSON.parse(dateSelect.dataset.startDates || '[]');

    // Фильтруем времена для выбранной даты
    const timesForDate = startDates
        .filter(dt => dt.startsWith(selectedDate))
        .map(dt => {
            const timePart = dt.split('T')[1];
            return timePart ? timePart.substring(0, 5) : '09:00';
        })
        .filter((v, i, a) => a.indexOf(v) === i) // уникальные
        .sort();

    timeSelect.innerHTML = '<option value="">выберите время</option>';

    timesForDate.forEach(time => {
        const option = document.createElement('option');
        option.value = time;
        option.textContent = time;
        timeSelect.appendChild(option);
    });

    timeSelect.disabled = false;

    // Обновляем продолжительность с выбранной датой
    const course = allCourses.find(c => c.id === selectedCourseId);
    updateDurationInfo(course, selectedDate);

    calculatePrice();
}

// Обновление информации о продолжительности курса
function updateDurationInfo(course, startDate) {
    const durationInfo = document.getElementById('order-duration-info');
    if (!durationInfo) return;

    if (!course) {
        durationInfo.innerHTML = '<span class="text-muted">выберите курс</span>';
        return;
    }

    const weeks = course.total_length || 0;

    if (!startDate) {
        durationInfo.innerHTML = `<strong>${weeks} недель</strong> <span class="text-muted">(выберите дату для расчёта окончания)</span>`;
        return;
    }

    // Вычисляем дату окончания: startDate + weeks недель
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + (weeks * 7));

    const startFormatted = start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
    const endFormatted = end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

    durationInfo.innerHTML = `
        <strong>${weeks} недель</strong>
        <div class="small text-muted mt-1">
            <i class="bi bi-calendar-range"></i> ${startFormatted} — ${endFormatted}
        </div>
    `;
}

function calculatePrice() {
    const course = allCourses.find(c => c.id === selectedCourseId);
    if (!course) return 0;

    const students = parseInt(document.getElementById('order-students').value) || 1;
    const time = document.getElementById('order-time').value;
    const dateValue = document.getElementById('order-date').value;

    // Базовые параметры курса
    const courseFeePerHour = course.course_fee_per_hour;
    const durationInHours = course.week_length * course.total_length;
    const weeks = course.total_length;

    // Определяем isWeekendOrHoliday (множитель за выходные)
    let isWeekendOrHoliday = 1;
    if (dateValue) {
        const selectedDate = new Date(dateValue);
        const dayOfWeek = selectedDate.getDay(); // 0 = воскресенье, 6 = суббота
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            isWeekendOrHoliday = 1.5;
        }
    }

    // Определяем доплаты за время
    let morningSurcharge = 0;
    let eveningSurcharge = 0;
    if (time) {
        const hour = parseInt(time.split(':')[0]);
        if (hour >= 9 && hour < 12) {
            morningSurcharge = 400;
        } else if (hour >= 18 && hour < 20) {
            eveningSurcharge = 1000;
        }
    }

    // Базовая формула согласно заданию:
    // Общая стоимость = ((courseFeePerHour × durationInHours × isWeekendOrHoliday) + morningSurcharge + eveningSurcharge) × studentsNumber
    let basePrice = (courseFeePerHour * durationInHours * isWeekendOrHoliday) + morningSurcharge + eveningSurcharge;
    let total = basePrice * students;

    // Автоматические опции (определяем и показываем)
    const autoOptions = [];

    // 1. earlyRegistration - за месяц вперёд → -10%
    let earlyRegistration = false;
    if (dateValue) {
        const orderDate = new Date(dateValue);
        const today = new Date();
        const diffDays = Math.ceil((orderDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays >= 30) {
            earlyRegistration = true;
            autoOptions.push({ name: 'раннее бронирование', desc: '-10%', type: 'discount' });
        }
    }

    // 2. groupEnrollment - от 5 человек → -15%
    let groupEnrollment = false;
    if (students >= 5) {
        groupEnrollment = true;
        autoOptions.push({ name: 'групповая запись', desc: '-15%', type: 'discount' });
    }

    // 3. intensiveCourse - 5+ часов в неделю → +20%
    let intensiveCourse = false;
    if (course.week_length >= 5) {
        intensiveCourse = true;
        autoOptions.push({ name: 'интенсивный курс', desc: '+20%', type: 'surcharge' });
    }

    // Применяем автоматические скидки/надбавки
    if (earlyRegistration) {
        total = total * 0.9; // -10%
    }
    if (groupEnrollment) {
        total = total * 0.85; // -15%
    }
    if (intensiveCourse) {
        total = total * 1.2; // +20%
    }

    // Пользовательские опции (чекбоксы)
    const optSupplementary = document.getElementById('opt-supplementary')?.checked || false;
    const optPersonalized = document.getElementById('opt-personalized')?.checked || false;
    const optExcursions = document.getElementById('opt-excursions')?.checked || false;
    const optAssessment = document.getElementById('opt-assessment')?.checked || false;
    const optInteractive = document.getElementById('opt-interactive')?.checked || false;

    // 4. supplementary - +2000 руб за каждого студента
    if (optSupplementary) {
        total += 2000 * students;
    }

    // 5. personalized - +1500 руб за каждую неделю курса
    if (optPersonalized) {
        total += 1500 * weeks;
    }

    // 6. excursions - +25%
    if (optExcursions) {
        total = total * 1.25;
    }

    // 7. assessment - +300 руб
    if (optAssessment) {
        total += 300;
    }

    // 8. interactive - +50%
    if (optInteractive) {
        total = total * 1.5;
    }

    // Отображаем автоматические опции
    const autoOptionsContainer = document.getElementById('auto-options-info');
    if (autoOptionsContainer) {
        if (autoOptions.length > 0) {
            autoOptionsContainer.innerHTML = autoOptions.map(opt => `
                <span class="auto-option-badge ${opt.type}">
                    <i class="bi ${opt.type === 'discount' ? 'bi-tag' : 'bi-plus-circle'}"></i>
                    ${opt.name}: ${opt.desc}
                </span>
            `).join('');
        } else {
            autoOptionsContainer.innerHTML = '<span class="text-muted small">нет автоматических скидок/надбавок</span>';
        }
    }

    // Обновляем UI
    const baseCoursePrice = courseFeePerHour * durationInHours;
    document.getElementById('price-base').textContent = `${baseCoursePrice.toLocaleString('ru-RU')} руб`;

    // Показываем множитель выходных если применён
    const weekendInfo = isWeekendOrHoliday > 1 ? ' (×1.5 выходной)' : '';
    const timeInfo = morningSurcharge > 0 ? ' (+400 утро)' : (eveningSurcharge > 0 ? ' (+1000 вечер)' : '');

    document.getElementById('price-tutor').textContent = `${weekendInfo}${timeInfo}`;

    const discountsRow = document.getElementById('price-discounts-row');
    const surchargesRow = document.getElementById('price-surcharges-row');

    // Считаем скидки
    let discountInfo = [];
    if (earlyRegistration) discountInfo.push('-10% ранняя');
    if (groupEnrollment) discountInfo.push('-15% группа');

    if (discountInfo.length > 0) {
        discountsRow.style.display = 'flex';
        document.getElementById('price-discounts').textContent = discountInfo.join(', ');
    } else {
        discountsRow.style.display = 'none';
    }

    // Считаем надбавки
    let surchargeInfo = [];
    if (intensiveCourse) surchargeInfo.push('+20% интенсив');
    if (optSupplementary) surchargeInfo.push(`+${(2000 * students).toLocaleString('ru-RU')} материалы`);
    if (optPersonalized) surchargeInfo.push(`+${(1500 * weeks).toLocaleString('ru-RU')} инд.занятия`);
    if (optExcursions) surchargeInfo.push('+25% экскурсии');
    if (optAssessment) surchargeInfo.push('+300 оценка');
    if (optInteractive) surchargeInfo.push('+50% платформа');

    if (surchargeInfo.length > 0) {
        surchargesRow.style.display = 'flex';
        document.getElementById('price-surcharges').textContent = surchargeInfo.join(', ');
    } else {
        surchargesRow.style.display = 'none';
    }

    document.getElementById('price-total').textContent = `${Math.round(total).toLocaleString('ru-RU')} руб`;

    return Math.round(total);
}

async function submitOrder() {
    const course = allCourses.find(c => c.id === selectedCourseId);
    if (!course) {
        showNotification('Выберите курс', 'danger');
        return;
    }

    const dateValue = document.getElementById('order-date').value;
    const timeValue = document.getElementById('order-time').value;
    const studentsValue = document.getElementById('order-students').value;

    // Валидация
    if (!dateValue) {
        showNotification('Укажите дату начала', 'danger');
        return;
    }

    if (!timeValue) {
        showNotification('Выберите время занятий', 'danger');
        return;
    }

    const tutor = getSelectedTutor();

    // Проверка: репетитор должен преподавать язык курса
    if (tutor && !canTutorTeachCourse(tutor, course)) {
        const courseLanguage = getCourseLanguage(course);
        const tutorLanguages = (tutor.languages_offered || []).join(', ');
        showNotification(
            `Репетитор ${tutor.name} не преподаёт ${courseLanguage}. Доступные языки: ${tutorLanguages}`,
            'danger'
        );
        return;
    }

    const totalPrice = calculatePrice();
    const students = parseInt(studentsValue) || 1;

    // Определяем автоматические опции
    // 1. early_registration - за месяц вперёд
    let earlyRegistration = false;
    if (dateValue) {
        const orderDate = new Date(dateValue);
        const today = new Date();
        const diffDays = Math.ceil((orderDate - today) / (1000 * 60 * 60 * 24));
        earlyRegistration = diffDays >= 30;
    }

    // 2. group_enrollment - от 5 человек
    const groupEnrollment = students >= 5;

    // 3. intensive_course - 5+ часов в неделю
    const intensiveCourse = course.week_length >= 5;

    // Пользовательские опции (чекбоксы)
    const supplementary = document.getElementById('opt-supplementary')?.checked || false;
    const personalized = document.getElementById('opt-personalized')?.checked || false;
    const excursions = document.getElementById('opt-excursions')?.checked || false;
    const assessment = document.getElementById('opt-assessment')?.checked || false;
    const interactive = document.getElementById('opt-interactive')?.checked || false;

    // Формируем данные для отправки (поля согласно API)
    const orderData = {
        course_id: parseInt(selectedCourseId),
        date_start: dateValue,
        time_start: timeValue,
        duration: parseInt(course.total_length) || 1,
        persons: students,
        price: Math.round(totalPrice),
        // 8 опций согласно API
        early_registration: earlyRegistration,
        group_enrollment: groupEnrollment,
        intensive_course: intensiveCourse,
        supplementary: supplementary,
        personalized: personalized,
        excursions: excursions,
        assessment: assessment,
        interactive: interactive
    };

    if (tutor) {
        orderData.tutor_id = parseInt(tutor.id);
    }

    // Логируем для отладки
    console.log('Отправка заказа:', orderData);

    try {
        const response = await fetch(`${API_BASE_URL}/orders?api_key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        const result = await response.json();
        console.log('Ответ API:', result);

        if (!response.ok) {
            // Собираем все ошибки валидации
            let errorMsg = result.error || result.message || 'Ошибка создания заявки';
            if (result.errors) {
                errorMsg = Object.values(result.errors).flat().join('; ');
            }
            throw new Error(errorMsg);
        }

        showNotification('Заявка успешно создана!', 'success');
        orderModal.hide();

        // Сбрасываем выбор
        selectedCourseId = null;
        selectedTutorId = null;
        renderTutors();

    } catch (error) {
        console.error('Ошибка:', error);
        showNotification(`Ошибка: ${error.message}`, 'danger');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Lingua загружен');

    if (document.getElementById('courses-list')) {
        loadCourses();
    }

    const searchInput = document.getElementById('course-search');
    const levelSelect = document.getElementById('course-level-filter');

    if (searchInput) {
        searchInput.addEventListener('input', searchCourses);
    }

    if (levelSelect) {
        levelSelect.addEventListener('change', searchCourses);
    }

    // Инициализация репетиторов
    if (document.getElementById('tutors-list')) {
        loadTutors();
    }

    const tutorLanguageSelect = document.getElementById('tutor-language-filter');
    const tutorLevelSelect = document.getElementById('tutor-level-filter');

    if (tutorLanguageSelect) {
        tutorLanguageSelect.addEventListener('change', searchTutors);
    }

    if (tutorLevelSelect) {
        tutorLevelSelect.addEventListener('change', searchTutors);
    }

    // Обработчики для модального окна заявки
    const orderForm = document.getElementById('order-form');
    if (orderForm) {
        // Пересчёт цены при изменении любого поля
        orderForm.addEventListener('change', calculatePrice);
        orderForm.addEventListener('input', calculatePrice);
    }

    // Обработчик изменения даты для обновления списка времени
    const orderDateSelect = document.getElementById('order-date');
    if (orderDateSelect) {
        orderDateSelect.addEventListener('change', onDateChange);
    }

    // Обработчик изменения времени для пересчёта цены
    const orderTimeSelect = document.getElementById('order-time');
    if (orderTimeSelect) {
        orderTimeSelect.addEventListener('change', calculatePrice);
    }

    // Инициализация карты учебных ресурсов
    if (document.getElementById('yandex-map')) {
        initResourcesMap();
    }
});

// ==================== КАРТА УЧЕБНЫХ РЕСУРСОВ ====================

let resourcesMap = null;
let resourcesPlacemarks = [];
let allResources = [];
let filteredResources = [];

// Данные о ресурсах для изучения языков в Москве
const languageResources = [
    {
        id: 1,
        name: 'Языковая школа "Полиглот"',
        type: 'school',
        typeName: 'языковая школа',
        coordinates: [55.7558, 37.6173],
        address: 'ул. Тверская, 12, Москва',
        hours: 'Пн-Пт: 9:00-21:00, Сб: 10:00-18:00',
        phone: '+7 (495) 123-45-67',
        description: 'Курсы английского, немецкого, французского языков. Подготовка к IELTS, TOEFL.'
    },
    {
        id: 2,
        name: 'Библиотека иностранной литературы',
        type: 'library',
        typeName: 'библиотека',
        coordinates: [55.7470, 37.6377],
        address: 'ул. Николоямская, 1, Москва',
        hours: 'Пн-Сб: 10:00-20:00, Вс: выходной',
        phone: '+7 (495) 915-36-36',
        description: 'Богатая коллекция книг на иностранных языках. Разговорные клубы.'
    },
    {
        id: 3,
        name: 'Language Cafe "Speak Up"',
        type: 'cafe',
        typeName: 'языковое кафе',
        coordinates: [55.7612, 37.6084],
        address: 'Камергерский пер., 5, Москва',
        hours: 'Ежедневно: 12:00-23:00',
        phone: '+7 (495) 987-65-43',
        description: 'Разговорная практика с носителями языка. Тематические вечера.'
    },
    {
        id: 4,
        name: 'Британский культурный центр',
        type: 'center',
        typeName: 'культурный центр',
        coordinates: [55.7539, 37.5978],
        address: 'Николоямская ул., 1, Москва',
        hours: 'Пн-Пт: 10:00-19:00',
        phone: '+7 (495) 782-02-00',
        description: 'Культурные мероприятия, лекции, выставки на английском языке.'
    },
    {
        id: 5,
        name: 'Клуб любителей немецкого языка',
        type: 'club',
        typeName: 'языковой клуб',
        coordinates: [55.7650, 37.6200],
        address: 'ул. Петровка, 25, Москва',
        hours: 'Ср, Пт: 18:00-21:00',
        phone: '+7 (495) 111-22-33',
        description: 'Разговорный клуб для изучающих немецкий. Встречи с носителями.'
    },
    {
        id: 6,
        name: 'Институт Сервантеса',
        type: 'center',
        typeName: 'культурный центр',
        coordinates: [55.7580, 37.6100],
        address: 'Новинский бульвар, 20А, Москва',
        hours: 'Пн-Пт: 9:00-20:00, Сб: 10:00-14:00',
        phone: '+7 (495) 937-34-40',
        description: 'Курсы испанского языка, культурные мероприятия, библиотека.'
    },
    {
        id: 7,
        name: 'Французский институт',
        type: 'center',
        typeName: 'культурный центр',
        coordinates: [55.7480, 37.5900],
        address: 'Милютинский пер., 7а, Москва',
        hours: 'Пн-Пт: 10:00-19:00',
        phone: '+7 (495) 937-34-00',
        description: 'Курсы французского, кинопоказы, выставки, медиатека.'
    },
    {
        id: 8,
        name: 'Библиотека им. Достоевского',
        type: 'library',
        typeName: 'библиотека',
        coordinates: [55.7700, 37.6350],
        address: 'Чистопрудный бульвар, 23, Москва',
        hours: 'Пн-Сб: 11:00-21:00',
        phone: '+7 (495) 621-53-01',
        description: 'Отдел иностранной литературы, языковые курсы для читателей.'
    },
    {
        id: 9,
        name: 'English First',
        type: 'school',
        typeName: 'языковая школа',
        coordinates: [55.7520, 37.6250],
        address: 'Покровский бульвар, 11, Москва',
        hours: 'Пн-Пт: 8:00-22:00, Сб-Вс: 9:00-18:00',
        phone: '+7 (495) 926-93-00',
        description: 'Международная сеть языковых школ. Все уровни английского.'
    },
    {
        id: 10,
        name: 'Итальянский культурный центр',
        type: 'center',
        typeName: 'культурный центр',
        coordinates: [55.7450, 37.6050],
        address: 'Малый Козихинский пер., 4, Москва',
        hours: 'Пн-Пт: 10:00-18:00',
        phone: '+7 (495) 916-54-91',
        description: 'Курсы итальянского языка, культурные мероприятия.'
    },
    {
        id: 11,
        name: 'Conversation Club Moscow',
        type: 'club',
        typeName: 'языковой клуб',
        coordinates: [55.7590, 37.5850],
        address: 'Арбат, 35, Москва',
        hours: 'Вт, Чт, Сб: 19:00-22:00',
        phone: '+7 (495) 222-33-44',
        description: 'Мультиязычный разговорный клуб. Английский, испанский, французский.'
    },
    {
        id: 12,
        name: 'Японский культурный центр',
        type: 'center',
        typeName: 'культурный центр',
        coordinates: [55.7400, 37.6150],
        address: 'Грохольский пер., 13, Москва',
        hours: 'Пн-Пт: 10:00-19:00',
        phone: '+7 (495) 626-55-83',
        description: 'Курсы японского языка, каллиграфия, чайные церемонии.'
    }
];

function initResourcesMap() {
    ymaps.ready(function() {
        // Создаём карту с центром в Москве
        resourcesMap = new ymaps.Map('yandex-map', {
            center: [55.7558, 37.6173],
            zoom: 12,
            controls: ['zoomControl', 'fullscreenControl', 'geolocationControl']
        });

        // Загружаем ресурсы
        allResources = [...languageResources];
        filteredResources = [...allResources];

        // Добавляем метки на карту
        addResourcesMarkers();

        // Отображаем список ресурсов
        renderResourcesList();

        console.log('Карта учебных ресурсов инициализирована');
    });
}

function addResourcesMarkers() {
    // Удаляем старые метки
    resourcesPlacemarks.forEach(placemark => {
        resourcesMap.geoObjects.remove(placemark);
    });
    resourcesPlacemarks = [];

    // Цвета для разных типов ресурсов
    const typeColors = {
        school: '#c8ff00',
        library: '#00d4ff',
        cafe: '#ff0066',
        center: '#9b59b6',
        club: '#f39c12'
    };

    // Добавляем новые метки
    filteredResources.forEach(resource => {
        const color = typeColors[resource.type] || '#c8ff00';

        const placemark = new ymaps.Placemark(
            resource.coordinates,
            {
                hintContent: resource.name,
                balloonContentHeader: `<strong>${resource.name}</strong>`,
                balloonContentBody: `
                    <div style="padding: 10px;">
                        <p><strong>Тип:</strong> ${resource.typeName}</p>
                        <p><strong>Адрес:</strong> ${resource.address}</p>
                        <p><strong>Часы работы:</strong> ${resource.hours}</p>
                        <p><strong>Телефон:</strong> ${resource.phone}</p>
                        <p>${resource.description}</p>
                    </div>
                `
            },
            {
                preset: 'islands#dotIcon',
                iconColor: color
            }
        );

        // Обработчик клика на метку
        placemark.events.add('click', function() {
            highlightResource(resource.id);
        });

        resourcesMap.geoObjects.add(placemark);
        resourcesPlacemarks.push(placemark);
    });
}

function renderResourcesList() {
    const container = document.getElementById('resources-list');
    if (!container) return;

    if (filteredResources.length === 0) {
        container.innerHTML = `
            <div class="no-resources">
                <i class="bi bi-geo-alt-fill"></i>
                <p>ресурсы не найдены</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredResources.map(resource => `
        <div class="resource-item" data-resource-id="${resource.id}" onclick="selectResource(${resource.id})">
            <div class="resource-name">${resource.name}</div>
            <span class="resource-type ${resource.type}">${resource.typeName}</span>
            <div class="resource-address">
                <i class="bi bi-geo-alt"></i>${resource.address}
            </div>
            <div class="resource-hours">
                <i class="bi bi-clock"></i>${resource.hours}
            </div>
            <div class="resource-description">${resource.description}</div>
        </div>
    `).join('');
}

function selectResource(resourceId) {
    const resource = allResources.find(r => r.id === resourceId);
    if (!resource || !resourcesMap) return;

    // Центрируем карту на выбранном ресурсе
    resourcesMap.setCenter(resource.coordinates, 15, {
        duration: 300
    });

    // Подсвечиваем элемент в списке
    highlightResource(resourceId);

    // Открываем балун на метке
    const index = filteredResources.findIndex(r => r.id === resourceId);
    if (index >= 0 && resourcesPlacemarks[index]) {
        resourcesPlacemarks[index].balloon.open();
    }
}

function highlightResource(resourceId) {
    // Убираем выделение со всех элементов
    document.querySelectorAll('.resource-item').forEach(item => {
        item.classList.remove('active');
    });

    // Выделяем выбранный элемент
    const selectedItem = document.querySelector(`.resource-item[data-resource-id="${resourceId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
        selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function filterResources() {
    const typeFilter = document.getElementById('resource-type-filter').value;
    const searchQuery = document.getElementById('resource-search').value.toLowerCase().trim();

    filteredResources = allResources.filter(resource => {
        // Фильтр по типу
        const matchesType = !typeFilter || resource.type === typeFilter;

        // Фильтр по поиску
        const matchesSearch = !searchQuery ||
            resource.name.toLowerCase().includes(searchQuery) ||
            resource.address.toLowerCase().includes(searchQuery) ||
            resource.description.toLowerCase().includes(searchQuery);

        return matchesType && matchesSearch;
    });

    // Обновляем метки на карте
    addResourcesMarkers();

    // Обновляем список
    renderResourcesList();

    // Подстраиваем масштаб карты под все метки
    if (filteredResources.length > 0 && resourcesMap) {
        const bounds = resourcesMap.geoObjects.getBounds();
        if (bounds) {
            resourcesMap.setBounds(bounds, {
                checkZoomRange: true,
                zoomMargin: 50
            });
        }
    }

    showNotification(`Найдено ресурсов: ${filteredResources.length}`, 'info');
}
