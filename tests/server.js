// Isolated fixture server: release switching never modifies the working tree.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('.');
let release = 'one';
createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/__release' && req.method === 'POST') {
        release = url.searchParams.get('value') === 'two' ? 'two' : 'one';
        res.end('ok');
        return;
    }
    const path = resolve(
        root,
        '.' +
            (url.pathname === '/'
                ? '/index.html'
                : decodeURIComponent(url.pathname)),
    );
    if (!path.startsWith(root + sep)) {
        res.writeHead(403).end();
        return;
    }
    try {
        let body = await readFile(path);
        if (path === resolve(root, 'script.js'))
            body = Buffer.from(
                body.toString() +
                    `\ndocument.documentElement.dataset.scriptRelease = '${release}';\n`,
            );
        if (path.endsWith('index.html'))
            body = Buffer.from(
                body
                    .toString()
                    .replace(
                        '<html lang="ru">',
                        `<html lang="ru" data-release="${release}">`,
                    ),
            );
        if (path.endsWith('service-worker.js'))
            body = Buffer.from(
                body
                    .toString()
                    .replace(/agetrack-static-([\w-]+)/, `$&-${release}`),
            );
        const types = {
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.html': 'text/html',
            '.webmanifest': 'application/manifest+json',
            '.png': 'image/png',
            '.svg': 'image/svg+xml',
        };
        res.writeHead(200, {
            'Content-Type': types[extname(path)] || 'application/octet-stream',
            'Cache-Control': 'no-store',
        }).end(body);
    } catch {
        res.writeHead(404).end();
    }
}).listen(8091, '127.0.0.1');
