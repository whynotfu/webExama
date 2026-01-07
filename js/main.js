
const API_KEY = 'ВАШ_API_КЛЮЧ';
const API_BASE_URL = 'http://exam-api-courses.std-900.ist.mospolytech.ru/api';

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


document.addEventListener('DOMContentLoaded', function() {
    console.log('LinguaWorld загружен');
});
