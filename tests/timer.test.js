import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    createSession,
    normalize,
    elapsedAt,
    totalTime,
    toggle,
    settle,
    reset,
    ageString,
    formatTime,
} from '../src/timer.js';
test('pause and resume exclude paused time without mutating input', () => {
    const initial = createSession();
    const running = toggle(initial, 1000);
    const paused = toggle(running, 61000);
    assert.equal(elapsedAt(paused, 999000), 60000);
    const resumed = toggle(paused, 1000000);
    assert.equal(elapsedAt(resumed, 1060000), 120000);
    assert.equal(initial.startedAt, null);
});
test('completion is exact, idempotent and cannot restart without reset', () => {
    const initial = createSession();
    initial.settings.gameHours = 0.25;
    const running = toggle(initial, 1000);
    assert.equal(elapsedAt(running, 900999), 899999);
    const complete = settle(running, 901000);
    assert.equal(complete.elapsed, 900000);
    assert.equal(complete.startedAt, null);
    assert.deepEqual(toggle(complete, 99999999), complete);
    assert.equal(elapsedAt(running, 99999999), 900000);
    assert.deepEqual(reset(complete), initial);
});
test('backward wall clock changes cannot produce negative elapsed time', () => {
    assert.equal(elapsedAt(toggle(createSession(), 10000), 5000), 0);
});
test('settings normalize empty, nonfinite, fractional and out-of-range values', () => {
    for (const value of ['', 'abc', Infinity, NaN])
        assert.equal(normalize('gameHours', value), 3);
    assert.equal(normalize('gameHours', 0.3), 0.25);
    assert.equal(normalize('gameHours', 500), 24);
    assert.equal(normalize('startAge', -1), 0);
    assert.equal(normalize('yearsPerHour', 0), 1);
    assert.equal(totalTime(createSession()), 10800000);
});
test('Russian age forms and time beyond 24 hours', () => {
    for (const [years, expected] of [
        [1, '1 год'],
        [2, '2 года'],
        [11, '11 лет'],
        [21, '21 год'],
        [22, '22 года'],
        [111, '111 лет'],
    ])
        assert.equal(ageString(years * 12), expected);
    assert.equal(ageString(12 + 1), '1 год 1 месяц');
    assert.equal(ageString(12 + 2), '1 год 2 месяца');
    assert.equal(ageString(12 + 11), '1 год 11 месяцев');
    assert.equal(formatTime(90061000), '25:01:01');
});

test('snapshot age and progress agree at month and completion boundaries', async () => {
    const { snapshot } = await import('../src/timer.js');
    const state = toggle(createSession(), 1000);
    assert.equal(snapshot(state, 20999).months, 240);
    assert.equal(snapshot(state, 21000).months, 241);
    assert.equal(snapshot(state, 10800999).progress, 99);
    const finished = snapshot(state, 10801000);
    assert.equal(finished.months, finished.finalMonths);
    assert.equal(finished.progress, 100);
    assert.equal(finished.remaining, 0);
    assert.equal(finished.running, false);
});
