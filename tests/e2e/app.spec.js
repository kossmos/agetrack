import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
    await request.post('/__release?value=one');
});

test('start, reload, pause, resume and confirmed reset', async ({ page }) => {
    await page.goto('/');
    await page
        .getByRole('button', { name: 'Начать игру', exact: true })
        .click();
    await expect(page.locator('#timeDisplay')).not.toHaveText('00:00:00');
    await page.reload();
    await expect(page.getByRole('status')).toContainText('Игра идёт');
    await page.getByRole('button', { name: 'Пауза', exact: true }).click();
    const paused = await page.locator('#timeDisplay').textContent();
    await page.reload();
    await expect(page.locator('#timeDisplay')).toHaveText(paused);
    await expect(page.locator('#startAge')).toBeDisabled();
    await page.getByRole('button', { name: 'Продолжить', exact: true }).click();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Сбросить', exact: true }).click();
    await expect(page.locator('#timeDisplay')).toHaveText('00:00:00');
    await expect(page.locator('#startAge')).toBeEnabled();
});

test('expired saved game completes at final age', async ({ page }) => {
    await page.addInitScript(() =>
        localStorage.setItem(
            'agetrack-session-v1',
            JSON.stringify({
                settings: { startAge: 20, yearsPerHour: 15, gameHours: 0.25 },
                elapsed: 0,
                startedAt: Date.now() - 3600000,
            }),
        ),
    );
    await page.goto('/');
    await expect(page.locator('#currentAge')).toHaveText('23 года 9 месяцев');
    await expect(page.locator('#timeDisplay')).toHaveText('00:15:00');
    await expect(page.locator('#startButton')).toBeDisabled();
});

test('mobile layout, fractional setting and theme persistence', async ({
    page,
}) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.locator('#gameHours').fill('0.25');
    await page.locator('#gameHours').press('Tab');
    await expect(page.locator('#remainingTime')).toHaveText('00:15:00');
    await page.getByLabel('Тёмная тема').check();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(
        await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
        ),
    ).toBe(true);
});

test('offline reload uses cached HTML and module graph', async ({
    page,
    context,
}) => {
    await page.goto('/');
    await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
    });
    await page.reload();
    await context.setOffline(true);
    await page.reload();
    await page
        .getByRole('button', { name: 'Начать игру', exact: true })
        .click();
    await expect(page.getByRole('status')).toContainText('Игра идёт');
});

test('new release waits until old clients close; no mixed HTML and scripts', async ({
    page,
    context,
    request,
}) => {
    await page.goto('/');
    await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-release', 'one');
    await expect(page.locator('html')).toHaveAttribute(
        'data-script-release',
        'one',
    );
    await request.post('/__release?value=two');
    await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
    });
    await expect
        .poll(() =>
            page.evaluate(async () =>
                Boolean(
                    (await navigator.serviceWorker.getRegistration()).waiting,
                ),
            ),
        )
        .toBe(true);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-release', 'one');
    await expect(page.locator('html')).toHaveAttribute(
        'data-script-release',
        'one',
    );
    await page.close();
    const next = await context.newPage();
    await next.goto('/');
    await expect(next.locator('html')).toHaveAttribute('data-release', 'two');
    await expect(next.locator('html')).toHaveAttribute(
        'data-script-release',
        'two',
    );
    await expect(next.locator('#currentAge')).toHaveText('20 лет');
});
