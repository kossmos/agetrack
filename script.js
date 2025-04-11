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

// Функция для сброса таймера
function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    elapsedTime = 0;
    timeDisplay.textContent = '00:00:00';
    currentAgeDisplay.textContent = '-';
    ageEmoji.textContent = '👶';
    startButton.textContent = 'Старт';
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

function updateTime() {
    const now = new Date();
    const diff = now - startTime + elapsedTime;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    timeDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Обновляем возраст
    const startAge = parseInt(document.getElementById('startAge').value);
    const yearsPerHour = parseInt(document.getElementById('yearsPerHour').value);
    const gameHours = parseInt(document.getElementById('gameHours').value);

    const currentAge = startAge + (hours * yearsPerHour);
    const months = Math.floor((diff % 3600000) / (3600000 / 12) * yearsPerHour);

    currentAgeDisplay.textContent = getAgeString(currentAge, months);

    // Обновляем эмодзи в зависимости от возраста
    if (currentAge < 30) {
        ageEmoji.textContent = '👶';
    } else if (currentAge < 60) {
        ageEmoji.textContent = '👨';
    } else {
        ageEmoji.textContent = '👴';
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
        clearInterval(timer);
        elapsedTime += new Date() - startTime;
        isRunning = false;
        startButton.textContent = 'Старт';
    }
});

resetButton.addEventListener('click', resetTimer); 