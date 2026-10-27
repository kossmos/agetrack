/** @typedef {{startAge: number, yearsPerHour: number, gameHours: number}} Settings */
/** @typedef {{settings: Settings, elapsed: number, startedAt: number | null}} Session */
/** @typedef {keyof Settings} SettingKey */
export const defaults = { startAge: 20, yearsPerHour: 15, gameHours: 3 };
/** @type {Record<SettingKey, [number, number]>} */
const limits = {
    startAge: [0, 120],
    yearsPerHour: [1, 100],
    gameHours: [0.25, 24],
};
/** @returns {Session} */
export function createSession() {
    return { settings: { ...defaults }, elapsed: 0, startedAt: null };
}
/** @param {SettingKey} id @param {unknown} value */
export function normalize(id, value) {
    const number = value === '' ? NaN : Number(value);
    const [min, max] = limits[id];
    const safe = Number.isFinite(number) ? number : defaults[id];
    const rounded =
        id === 'gameHours' ? Math.round(safe * 4) / 4 : Math.round(safe);
    return Math.min(max, Math.max(min, rounded));
}
/** @param {Session} state */
export function totalTime(state) {
    return state.settings.gameHours * 3600000;
}
/** @param {Session} state @param {number} now */
export function elapsedAt(state, now) {
    return Math.min(
        totalTime(state),
        Math.max(
            0,
            state.elapsed +
                (state.startedAt === null
                    ? 0
                    : Math.max(0, now - state.startedAt)),
        ),
    );
}
/** @param {number} number @param {string} one @param {string} few @param {string} many */
export function word(number, one, few, many) {
    return number % 100 >= 11 && number % 100 <= 14
        ? many
        : number % 10 === 1
          ? one
          : number % 10 >= 2 && number % 10 <= 4
            ? few
            : many;
}
/** @param {number} months */
export function ageString(months) {
    const years = Math.floor(months / 12);
    const remainder = months % 12;
    return (
        `${years} ${word(years, 'год', 'года', 'лет')}` +
        (remainder
            ? ` ${remainder} ${word(remainder, 'месяц', 'месяца', 'месяцев')}`
            : '')
    );
}
/** @param {number} milliseconds */
export function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    return [
        Math.floor(seconds / 3600),
        Math.floor(seconds / 60) % 60,
        seconds % 60,
    ]
        .map((value) => String(value).padStart(2, '0'))
        .join(':');
}

/** @param {Session} state @param {number} now @returns {Session} */
export function settle(state, now) {
    return elapsedAt(state, now) >= totalTime(state)
        ? { ...state, elapsed: totalTime(state), startedAt: null }
        : state;
}
/** @param {Session} state @param {number} now @returns {Session} */
export function toggle(state, now) {
    const current = settle(state, now);
    if (current.elapsed >= totalTime(current)) return current;
    return current.startedAt === null
        ? { ...current, startedAt: now }
        : { ...current, elapsed: elapsedAt(current, now), startedAt: null };
}
/** @param {Session} state @returns {Session} */
export function reset(state) {
    return { ...state, elapsed: 0, startedAt: null };
}

/** Derived display data; independent of the DOM and the system clock.
 * @param {Session} state @param {number} now
 */
export function snapshot(state, now) {
    const elapsed = elapsedAt(state, now);
    const duration = totalTime(state);
    const completed = elapsed >= duration;
    const running = !completed && state.startedAt !== null;
    return {
        elapsed,
        duration,
        completed,
        running,
        active: running || elapsed > 0,
        months:
            state.settings.startAge * 12 +
            Math.floor((elapsed / 3600000) * state.settings.yearsPerHour * 12),
        finalMonths: Math.round(
            (state.settings.startAge +
                state.settings.yearsPerHour * state.settings.gameHours) *
                12,
        ),
        remaining: Math.ceil((duration - elapsed) / 1000) * 1000,
        percent: (elapsed / duration) * 100,
        progress: completed
            ? 100
            : Math.min(99, Math.floor((elapsed / duration) * 100)),
    };
}
