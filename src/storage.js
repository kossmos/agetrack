import { createSession, normalize, totalTime } from './timer.js';
export const SESSION_KEY = 'agetrack-session-v1';
const VERSION = 1;
/** @param {() => Pick<Storage, 'getItem' | 'setItem'>} getStorage */
export function createStorage(getStorage) {
    return {
        available: true,
        /** @param {string} key */
        read(key) {
            try {
                return getStorage().getItem(key);
            } catch {
                this.available = false;
                return null;
            }
        },
        /** @param {string} key @param {string} value */
        write(key, value) {
            try {
                getStorage().setItem(key, value);
            } catch {
                this.available = false;
            }
        },
    };
}
/** @param {unknown} value @returns {value is Record<string, unknown>} */
function record(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** @param {string | null} raw @returns {import('./timer.js').Session} */
export function restoreSession(raw) {
    try {
        const data = /** @type {unknown} */ (JSON.parse(raw ?? 'null'));
        if (!record(data)) return createSession();
        // Unversioned saves from the original app are migrated on the next write.
        const saved =
            'version' in data
                ? data.version === VERSION
                    ? data.state
                    : null
                : data;
        if (!record(saved) || !record(saved.settings)) return createSession();
        const settings = saved.settings;
        if (
            !['startAge', 'yearsPerHour', 'gameHours'].every(
                (key) =>
                    typeof settings[key] === 'number' &&
                    Number.isFinite(settings[key]),
            )
        )
            return createSession();
        if (
            typeof saved.elapsed !== 'number' ||
            !Number.isFinite(saved.elapsed) ||
            saved.elapsed < 0 ||
            !(
                saved.startedAt === null ||
                (typeof saved.startedAt === 'number' &&
                    Number.isFinite(saved.startedAt) &&
                    saved.startedAt >= 0)
            )
        )
            return createSession();
        const state = {
            settings: {
                startAge: normalize('startAge', settings.startAge),
                yearsPerHour: normalize('yearsPerHour', settings.yearsPerHour),
                gameHours: normalize('gameHours', settings.gameHours),
            },
            elapsed: saved.elapsed,
            startedAt: saved.startedAt,
        };
        state.elapsed = Math.min(state.elapsed, totalTime(state));
        return state;
    } catch {
        return createSession();
    }
}
/** @param {import('./timer.js').Session} state */
export function encodeSession(state) {
    return JSON.stringify({ version: VERSION, state });
}
