import js from '@eslint/js';
import globals from 'globals';
export default [
    { ignores: ['node_modules/**', 'playwright-report/**', 'test-results/**'] },
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.serviceworker,
            },
        },
        rules: { 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
    },
];
