const defaults = { startAge: 20, yearsPerHour: 15, gameHours: 3 };
const limits = { startAge: [0, 120], yearsPerHour: [1, 100], gameHours: [0.25, 24] };
const $ = id => document.getElementById(id);
const fields = Object.keys(defaults);
let state = { settings: { ...defaults }, elapsed: 0, startedAt: null };
let storageAvailable = true;

function readStorage(key) {
    try { return localStorage.getItem(key); } catch { storageAvailable = false; return null; }
}
function writeStorage(key, value) {
    try { localStorage.setItem(key, value); } catch { storageAvailable = false; }
}
function normalize(id, value) {
    const number = value === '' ? NaN : Number(value);
    const [min, max] = limits[id];
    const safe = Number.isFinite(number) ? number : defaults[id];
    const rounded = id === 'gameHours' ? Math.round(safe * 4) / 4 : Math.round(safe);
    return Math.min(max, Math.max(min, rounded));
}
function save() { writeStorage('agetrack-session-v1', JSON.stringify(state)); }
function totalTime() { return state.settings.gameHours * 3600000; }
function elapsedAt(now = Date.now()) {
    return Math.min(totalTime(), Math.max(0, state.elapsed +
        (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt))));
}
function word(number, one, few, many) {
    return number % 100 >= 11 && number % 100 <= 14 ? many :
        number % 10 === 1 ? one : number % 10 >= 2 && number % 10 <= 4 ? few : many;
}
function ageString(months) {
    const years = Math.floor(months / 12);
    const remainder = months % 12;
    return `${years} ${word(years, 'год', 'года', 'лет')}` +
        (remainder ? ` ${remainder} ${word(remainder, 'месяц', 'месяца', 'месяцев')}` : '');
}
function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
        .map(value => String(value).padStart(2, '0')).join(':');
}
function render() {
    const elapsed = elapsedAt();
    const completed = elapsed >= totalTime();
    if (completed && state.startedAt !== null) {
        state.elapsed = totalTime();
        state.startedAt = null;
        save();
    }
    const running = state.startedAt !== null;
    const active = running || elapsed > 0;
    const months = state.settings.startAge * 12 + Math.floor(elapsed / 3600000 * state.settings.yearsPerHour * 12);
    const progress = completed ? 100 : Math.min(99, Math.floor(elapsed / totalTime() * 100));
    $('currentAge').textContent = ageString(months);
    $('ageEmoji').textContent = months < 360 ? '🧑🏻 👩🏻' : months < 720 ? '👨🏻 👩🏻' : '👴🏻 👵🏻';
    $('timeDisplay').textContent = formatTime(elapsed);
    $('remainingTime').textContent = formatTime(Math.ceil((totalTime() - elapsed) / 1000) * 1000);
    $('elapsedTime').textContent = formatTime(elapsed);
    $('finalAgeDisplay').textContent = ageString(Math.round((state.settings.startAge + state.settings.yearsPerHour * state.settings.gameHours) * 12));
    $('progressBar').style.width = `${elapsed / totalTime() * 100}%`;
    $('progressTrack').setAttribute('aria-valuenow', String(progress));
    $('progressText').textContent = `${progress}%`;
    $('startButton').textContent = completed ? 'Игра завершена' : running ? 'Пауза' : active ? 'Продолжить' : 'Начать игру';
    $('startButton').disabled = completed;
    $('resetButton').disabled = !active;
    const status = completed ? 'Игра завершена' : running ? 'Игра идёт' : active ? 'На паузе' : 'Готовы начать?';
    if ($('status').textContent !== status) $('status').textContent = status;
    $('status').dataset.state = completed ? 'complete' : running ? 'running' : 'idle';
    $('settingsHint').textContent = active ? 'Чтобы изменить параметры, сбросьте игру.' : 'Настройте темп вашей игры. 15 минут = 0,25 часа.';
    $('storageNotice').hidden = storageAvailable;
    fields.forEach(id => { $(id).disabled = active; });
    document.title = running ? `${ageString(months)} · Agetrack` : 'Agetrack — время вашей игры';
}

try {
    const saved = JSON.parse(readStorage('agetrack-session-v1'));
    if (saved && saved.settings && Number.isFinite(saved.elapsed) && saved.elapsed >= 0 &&
        (saved.startedAt === null || (Number.isFinite(saved.startedAt) && saved.startedAt >= 0))) {
        state.settings = Object.fromEntries(fields.map(id => [id, normalize(id, saved.settings[id])]));
        state.elapsed = Math.min(saved.elapsed, totalTime());
        state.startedAt = saved.startedAt;
    }
} catch { /* A damaged save must not prevent a new game. */ }
fields.forEach(id => {
    $(id).value = state.settings[id];
    $(id).addEventListener('change', () => {
        if (state.startedAt !== null || state.elapsed > 0) return;
        state.settings[id] = normalize(id, $(id).value);
        $(id).value = state.settings[id];
        save();
        render();
    });
});
$('startButton').addEventListener('click', () => {
    if (elapsedAt() >= totalTime()) return;
    if (state.startedAt === null) {
        state.startedAt = Date.now();
    } else {
        state.elapsed = elapsedAt();
        state.startedAt = null;
    }
    save();
    render();
});
$('resetButton').addEventListener('click', () => {
    if (!confirm('Сбросить текущую игру? Возраст и таймер вернутся к началу.')) return;
    state.elapsed = 0;
    state.startedAt = null;
    save();
    render();
});
const themeSwitch = $('checkbox');
const savedTheme = readStorage('theme');
themeSwitch.checked = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
function applyTheme() {
    document.documentElement.setAttribute('data-theme', themeSwitch.checked ? 'dark' : 'light');
}
applyTheme();
themeSwitch.addEventListener('change', () => {
    applyTheme();
    writeStorage('theme', themeSwitch.checked ? 'dark' : 'light');
    render();
});
render();
setInterval(render, 250);
document.addEventListener('visibilitychange', render);
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js').catch(error => console.warn('Service Worker:', error));
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
