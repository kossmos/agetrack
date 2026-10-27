import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './tests/e2e',
    workers: 1,
    use: { baseURL: 'http://127.0.0.1:8091', trace: 'retain-on-failure' },
    webServer: {
        command: 'node tests/server.js',
        url: 'http://127.0.0.1:8091',
        reuseExistingServer: false,
    },
});
