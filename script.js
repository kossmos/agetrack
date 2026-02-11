let timer;
let startTime;
let isRunning = false;
let elapsedTime = 0;

const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const timeDisplay = document.querySelector('.time');
const currentAgeDisplay = document.getElementById('currentAge');
const ageEmoji = document.getElementById('ageEmoji');
const finalAgeDisplay = document.getElementById('finalAgeDisplay');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const elapsedTimeDisplay = document.getElementById('elapsedTime');
const remainingTimeDisplay = document.getElementById('remainingTime');
const themeSwitch = document.getElementById('checkbox');

// Функция для правильного склонения возраста
function getAgeString(years, months) {
    let yearWord = 'лет';
    if (years % 10 === 1 && years % 100 !== 11) {
        yearWord = 'год';
    } else if (years % 10 >= 2 && years % 10 <= 4 && (years % 100 < 10 || years % 100 >= 20)) {
        yearWord = 'года';
    }

    let monthWord = 'месяцев';
    if (months % 10 === 1 && months % 100 !== 11) {
        monthWord = 'месяц';
    } else if (months % 10 >= 2 && months % 10 <= 4 && (months % 100 < 10 || months % 100 >= 20)) {
        monthWord = 'месяца';
    }

    return `${years} ${yearWord} ${months} ${monthWord}`;
}

// Функция для форматирования времени
function formatTime(hours, minutes, seconds) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Функция для сброса таймера
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    elapsedTime = 0;
    timeDisplay.textContent = '00:00:00';
    currentAgeDisplay.textContent = '-';
    ageEmoji.textContent = '🧑🏻👩🏻';
    startButton.textContent = 'Старт';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    elapsedTimeDisplay.textContent = '00:00:00';
    remainingTimeDisplay.textContent = document.getElementById('gameHours').value.padStart(2, '0') + ':00:00';
}

// Функция для расчета финального возраста
function calculateFinalAge() {
    const startAge = parseInt(document.getElementById('startAge').value);
    const yearsPerHour = parseInt(document.getElementById('yearsPerHour').value);
    const gameHours = parseInt(document.getElementById('gameHours').value);
    
    const finalAge = startAge + (yearsPerHour * gameHours);
    finalAgeDisplay.textContent = getAgeString(finalAge, 0);
}

// Обновляем финальный возраст при изменении параметров
document.getElementById('startAge').addEventListener('input', calculateFinalAge);
document.getElementById('yearsPerHour').addEventListener('input', calculateFinalAge);
document.getElementById('gameHours').addEventListener('input', calculateFinalAge);

// Инициализируем финальный возраст при загрузке
calculateFinalAge();

// Функция для обновления прогресс-бара
function updateProgress(hours, minutes, seconds) {
    const gameHours = parseInt(document.getElementById('gameHours').value);
    const totalMilliseconds = gameHours * 3600000; // общее время в миллисекундах
    const currentMilliseconds = hours * 3600000 + minutes * 60000 + seconds * 1000; // текущее время в миллисекундах
    const progress = (currentMilliseconds / totalMilliseconds) * 100;
    
    // Обновляем прогресс-бар
    progressBar.style.width = `${Math.min(progress, 100)}%`;
    progressText.textContent = `${Math.round(Math.min(progress, 100))}%`;
    
    // Обновляем прошедшее время
    elapsedTimeDisplay.textContent = formatTime(hours, minutes, seconds);
    
    // Обновляем оставшееся время
    const remainingMilliseconds = Math.max(0, totalMilliseconds - currentMilliseconds);
    const remainingHours = Math.floor(remainingMilliseconds / 3600000);
    const remainingMinutes = Math.floor((remainingMilliseconds % 3600000) / 60000);
    const remainingSecs = Math.floor((remainingMilliseconds % 60000) / 1000);
    remainingTimeDisplay.textContent = formatTime(remainingHours, remainingMinutes, remainingSecs);
}

// Обработчик переключения темы
themeSwitch.addEventListener('change', function() {
    if (this.checked) {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
});

// Проверка сохранённой темы при загрузке
const currentTheme = localStorage.getItem('theme');
if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark') {
        themeSwitch.checked = true;
    }
}

function updateTime() {
    const now = new Date();
    const diff = now - startTime + elapsedTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    timeDisplay.textContent = formatTime(hours, minutes, seconds);

    // Обновляем прогресс
    updateProgress(hours, minutes, seconds);

    // Обновляем возраст
    const startAge = parseInt(document.getElementById('startAge').value);
    const yearsPerHour = parseInt(document.getElementById('yearsPerHour').value);
    const gameHours = parseInt(document.getElementById('gameHours').value);

    // Новый корректный расчёт возраста
    const totalGameYears = (diff / 3600000) * yearsPerHour;
    const totalYears = startAge + Math.floor(totalGameYears);
    const totalMonths = Math.floor((totalGameYears - Math.floor(totalGameYears)) * 12);

    currentAgeDisplay.textContent = getAgeString(totalYears, totalMonths);

    // Обновляем эмодзи в зависимости от возраста
    if (totalYears < 30) {
        ageEmoji.textContent = '🧑🏻👩🏻'; // Молодые люди
    } else if (totalYears < 60) {
        ageEmoji.textContent = '👨🏻👩🏻'; // Взрослые
    } else {
        ageEmoji.textContent = '👴🏻👵🏻'; // Пожилые
    }

    // Проверяем, не закончилось ли время
    if (hours >= gameHours) {
        clearInterval(timer);
        isRunning = false;
        startButton.textContent = 'Старт';
    }
}

startButton.addEventListener('click', () => {
    if (!isRunning) {
        startTime = new Date();
        timer = setInterval(updateTime, 1000);
        isRunning = true;
        startButton.textContent = 'Пауза';
    } else {
        if (confirm('Вы уверены, что хотите поставить таймер на паузу?')) {
            clearInterval(timer);
            elapsedTime += new Date() - startTime;
            isRunning = false;
            startButton.textContent = 'Старт';
        }
    }
});

resetButton.addEventListener('click', function() {
    if (confirm('Вы уверены, что хотите сбросить таймер? Это действие нельзя отменить.')) {
        resetTimer();
    }
});

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker зарегистрирован успешно:', registration.scope);
            })
            .catch(error => {
                console.log('Ошибка регистрации ServiceWorker:', error);
            });
    });
}

// Добавление функциональности установки PWA
let deferredPrompt;
const installButton = document.getElementById('installPWA');

// Скрываем кнопку, если приложение уже запущено как установленное PWA
const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
if (isStandalone) {
    installButton.style.display = 'none';
}

window.addEventListener('beforeinstallprompt', (e) => {
    // Предотвращаем стандартное всплывающее окно установки
    e.preventDefault();
    // Сохраняем событие для использования позже
    deferredPrompt = e;
});

// Обработчик события при успешной установке
window.addEventListener('appinstalled', (event) => {
    console.log('Приложение успешно установлено');
    installButton.style.display = 'none';
    // Можно показать сообщение о успешной установке
    alert('Приложение успешно установлено!');
});

// Обработчик клика по кнопке установки
installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
        // Показываем диалог установки
        deferredPrompt.prompt();
        // Ожидаем результат
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Результат установки: ${outcome}`);
        // Обнуляем сохраненное событие
        deferredPrompt = null;
        
        if (outcome === 'accepted') {
            installButton.style.display = 'none';
        }
    } else {
        // Если deferredPrompt не доступен, предлагаем инструкции по установке
        let message = '';
        
        // Определяем браузер и устройство
        const userAgent = navigator.userAgent.toLowerCase();
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        const isSafari = /safari/.test(userAgent);
        const isChrome = /chrome/.test(userAgent);
        
        if (isIOS && isSafari) {
            message = 'Для установки на iOS: нажмите кнопку "Поделиться" внизу экрана, затем "На экран «Домой»"';
        } else if (isAndroid && isChrome) {
            message = 'Для установки на Android: нажмите на три точки в правом верхнем углу, затем "Установить приложение"';
        } else {
            message = 'Для установки: откройте сайт в Chrome или Safari на мобильном устройстве';
        }
        
        alert(message);
    }
}); 
