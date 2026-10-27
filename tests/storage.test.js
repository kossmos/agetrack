import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, toggle, elapsedAt } from '../src/timer.js';
import {
    createStorage,
    restoreSession,
    encodeSession,
} from '../src/storage.js';
test('versioned save roundtrip keeps running timestamp', () => {
    const state = toggle(createSession(), 1000);
    const restored = restoreSession(encodeSession(state));
    assert.deepEqual(restored, state);
    assert.equal(elapsedAt(restored, 61000), 60000);
});
test('legacy saves migrate without losing paused time or settings', () => {
    const legacy = { ...createSession(), elapsed: 12345 };
    legacy.settings.gameHours = 0.25;
    assert.deepEqual(restoreSession(JSON.stringify(legacy)), legacy);
    assert.equal(
        JSON.parse(encodeSession(restoreSession(JSON.stringify(legacy))))
            .version,
        1,
    );
});
test('unknown versions, malformed structures and invalid timestamps reset safely', () => {
    for (const raw of [
        null,
        '{broken',
        '[]',
        'null',
        '{"version":2}',
        JSON.stringify({ ...createSession(), startedAt: 'yesterday' }),
        JSON.stringify({ ...createSession(), elapsed: -1 }),
        JSON.stringify({ ...createSession(), settings: { startAge: 20 } }),
    ])
        assert.deepEqual(restoreSession(raw), createSession());
});
test('elapsed time in a save is capped to duration', () => {
    assert.equal(
        restoreSession(JSON.stringify({ ...createSession(), elapsed: 1e20 }))
            .elapsed,
        10800000,
    );
});
test('storage access exceptions do not prevent use of the app', () => {
    const storage = createStorage(() => {
        throw Error('denied');
    });
    assert.equal(storage.read('test'), null);
    storage.write('test', 'value');
    assert.equal(storage.available, false);
});
