import {
    defaults,
    normalize,
    snapshot,
    ageString,
    formatTime,
    toggle,
    reset,
    settle,
} from './src/timer.js';
import {
    createStorage,
    restoreSession,
    encodeSession,
    SESSION_KEY,
} from './src/storage.js';
import { setupInstall } from './src/install.js';
/** @param {string} id */
function $(id) {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Missing element: ${id}`);
    return element;
}
/** @param {string} id */
function input(id) {
    const element = $(id);
    if (!(element instanceof HTMLInputElement))
        throw new Error(`Expected input: ${id}`);
    return element;
}
/** @param {string} id */
function button(id) {
    const element = $(id);
    if (!(element instanceof HTMLButtonElement))
        throw new Error(`Expected button: ${id}`);
    return element;
}
const fields = /** @type {import('./src/timer.js').SettingKey[]} */ (
    Object.keys(defaults)
);
const storage = createStorage(() => window.localStorage);
let state = restoreSession(storage.read(SESSION_KEY));
function save() {
    storage.write(SESSION_KEY, encodeSession(state));
}
function render() {
    const now = Date.now();
    const view = snapshot(state, now);
    const { elapsed, completed, running, active, months, progress } = view;
    if (completed && state.startedAt !== null) {
        state = settle(state, now);
        save();
    }
    $('currentAge').textContent = ageString(months);
    $('ageEmoji').textContent =
        months < 360 ? '🧑🏻 👩🏻' : months < 720 ? '👨🏻 👩🏻' : '👴🏻 👵🏻';
    $('timeDisplay').textContent = formatTime(elapsed);
    $('remainingTime').textContent = formatTime(view.remaining);
    $('elapsedTime').textContent = formatTime(elapsed);
    $('finalAgeDisplay').textContent = ageString(view.finalMonths);
    $('progressBar').style.width = `${view.percent}%`;
    $('progressTrack').setAttribute('aria-valuenow', String(progress));
    $('progressText').textContent = `${progress}%`;
    $('startButton').textContent = completed
        ? 'Игра завершена'
        : running
          ? 'Пауза'
          : active
            ? 'Продолжить'
            : 'Начать игру';
    button('startButton').disabled = completed;
    button('resetButton').disabled = !active;
    const status = completed
        ? 'Игра завершена'
        : running
          ? 'Игра идёт'
          : active
            ? 'На паузе'
            : 'Готовы начать?';
    if ($('status').textContent !== status) $('status').textContent = status;
    $('status').dataset.state = completed
        ? 'complete'
        : running
          ? 'running'
          : 'idle';
    $('settingsHint').textContent = active
        ? 'Чтобы изменить параметры, сбросьте игру.'
        : 'Настройте темп вашей игры. 15 минут = 0,25 часа.';
    $('storageNotice').hidden = storage.available;
    fields.forEach((id) => {
        input(id).disabled = active;
    });
    document.title = running
        ? `${ageString(months)} · Agetrack`
        : 'Agetrack — время вашей игры';
}

fields.forEach((id) => {
    input(id).value = String(state.settings[id]);
    input(id).addEventListener('change', () => {
        if (state.startedAt !== null || state.elapsed > 0) return;
        state.settings[id] = normalize(id, input(id).value);
        input(id).value = String(state.settings[id]);
        save();
        render();
    });
});
$('startButton').addEventListener('click', () => {
    state = toggle(state, Date.now());
    save();
    render();
});
$('resetButton').addEventListener('click', () => {
    if (!confirm('Сбросить текущую игру? Возраст и таймер вернутся к началу.'))
        return;
    state = reset(state);
    save();
    render();
});
const themeSwitch = input('checkbox');
const savedTheme = storage.read('theme');
themeSwitch.checked = savedTheme
    ? savedTheme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches;
function applyTheme() {
    document.documentElement.setAttribute(
        'data-theme',
        themeSwitch.checked ? 'dark' : 'light',
    );
}
applyTheme();
themeSwitch.addEventListener('change', () => {
    applyTheme();
    storage.write('theme', themeSwitch.checked ? 'dark' : 'light');
    render();
});
render();
setInterval(render, 250);
document.addEventListener('visibilitychange', render);
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('./service-worker.js')
            .catch((error) => console.warn('Service Worker:', error));
    });
}

setupInstall(button('installPWA'));
