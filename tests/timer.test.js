const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('script.js', 'utf8');
function app(storage = new Map(), denied = false) {
    let now = 1000000;
    const elements = new Map();
    const get = id => {
        if (!elements.has(id)) elements.set(id, { style: {}, dataset: {}, listeners: {}, setAttribute() {},
            addEventListener(type, listener) { this.listeners[type] = listener; } });
        return elements.get(id);
    };
    const context = vm.createContext({
        document: { getElementById: get, documentElement: { setAttribute() {} }, addEventListener() {} },
        window: { matchMedia: () => ({ matches: false }), navigator: {}, addEventListener() {} },
        navigator: {}, localStorage: {
            getItem(key) { if (denied) throw Error('denied'); return storage.get(key) ?? null; },
            setItem(key, value) { if (denied) throw Error('denied'); storage.set(key, value); }
        }, Date: { now: () => now }, setInterval() {}, confirm: () => true, console
    });
    vm.runInContext(source, context);
    return { get, storage, click: id => get(id).listeners.click(),
        advance(ms) { now += ms; vm.runInContext('render()', context); },
        change(id, value) { get(id).value = value; get(id).listeners.change(); } };
}
test('initial age, duration and fractional game settings', () => {
    const a = app();
    assert.equal(a.get('currentAge').textContent, '20 лет');
    assert.equal(a.get('remainingTime').textContent, '03:00:00');
    a.change('gameHours', '0.25');
    assert.equal(a.get('remainingTime').textContent, '00:15:00');
    assert.equal(a.get('finalAgeDisplay').textContent, '23 года 9 месяцев');
});
test('pause excludes paused time; resume retains elapsed time', () => {
    const a = app(); a.click('startButton'); a.advance(60000); a.click('startButton');
    a.advance(300000);
    assert.equal(a.get('timeDisplay').textContent, '00:01:00');
    a.click('startButton'); a.advance(60000);
    assert.equal(a.get('timeDisplay').textContent, '00:02:00');
    assert.equal(a.get('startAge').disabled, true);
});
test('running session survives reload and counts time away', () => {
    const a = app(); a.click('startButton');
    const b = app(a.storage); b.advance(3600000);
    assert.equal(b.get('timeDisplay').textContent, '01:00:00');
    assert.equal(b.get('currentAge').textContent, '35 лет');
});
test('completion clamps time and age even after a long suspended tab', () => {
    const a = app(); a.change('gameHours', '0.25'); a.click('startButton'); a.advance(86400000);
    assert.equal(a.get('timeDisplay').textContent, '00:15:00');
    assert.equal(a.get('currentAge').textContent, '23 года 9 месяцев');
    assert.equal(a.get('remainingTime').textContent, '00:00:00');
    assert.equal(a.get('startButton').disabled, true);
    const b = app(a.storage);
    assert.equal(b.get('status').textContent, 'Игра завершена');
    b.click('resetButton');
    assert.equal(b.get('currentAge').textContent, '20 лет');
    assert.equal(b.get('startAge').disabled, false);
});
test('paused session survives reload', () => {
    const a = app(); a.click('startButton'); a.advance(10000); a.click('startButton');
    const b = app(a.storage); b.advance(100000);
    assert.equal(b.get('timeDisplay').textContent, '00:00:10');
    assert.equal(b.get('startButton').textContent, 'Продолжить');
});
test('invalid settings and damaged storage recover safely', () => {
    const a = app(new Map([['agetrack-session-v1', '{broken']]));
    a.change('gameHours', ''); assert.equal(a.get('gameHours').value, 3);
    a.change('startAge', -20); assert.equal(a.get('startAge').value, 0);
    a.change('yearsPerHour', 999999); assert.equal(a.get('yearsPerHour').value, 100);
    a.change('gameHours', .3); assert.equal(a.get('gameHours').value, .25);
});
test('blocked storage does not break timer', () => {
    const a = app(new Map(), true); a.click('startButton'); a.advance(1000);
    assert.equal(a.get('timeDisplay').textContent, '00:00:01');
    assert.equal(a.get('storageNotice').hidden, false);
});
