import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const workerPath = new URL('../service-worker.js', import.meta.url);
const worker = await readFile(workerPath, 'utf8');
const paths = [...worker.matchAll(/['"]\.\/([^'"]+)['"]/g)].map(
    (match) => match[1],
);
const hash = createHash('sha256');
hash.update(
    worker.replace(/agetrack-static-[\w-]+/, 'agetrack-static-VERSION'),
);
for (const path of [...new Set(paths)].sort()) {
    hash.update(path).update(
        await readFile(new URL(`../${path}`, import.meta.url)),
    );
}
const next = worker.replace(
    /agetrack-static-[\w-]+/,
    `agetrack-static-${hash.digest('hex').slice(0, 16)}`,
);
if (process.argv.includes('--check')) {
    if (worker !== next) {
        console.error('Cache version is stale. Run npm run cache:update.');
        process.exitCode = 1;
    }
} else await writeFile(workerPath, next);
