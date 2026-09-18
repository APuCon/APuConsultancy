import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join, relative} from 'node:path';
import {tmpdir} from 'node:os';

const root = fileURLToPath(new URL('../', import.meta.url));
test('Azure port, independent working directory, all static files and missing paths', {timeout: 30000}, async () => {
  const child = spawn(process.execPath, [join(root, 'server.mjs')], {
    cwd: tmpdir(), env: {...process.env, PORT: '0', HOST: '0.0.0.0'}, stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    const port = await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => reject(new Error('Server startup timed out')), 8000);
      child.stdout.on('data', chunk => {
        output += chunk;
        const match = output.match(/Listening on port (\d+)/);
        if (match) { clearTimeout(timeout); resolve(match[1]); }
      });
      child.on('error', e => {clearTimeout(timeout); reject(e);});
      child.on('exit', code => {clearTimeout(timeout); reject(new Error(`Server exited: ${code}`));});
    });
    const base = `http://127.0.0.1:${port}`;
    const home = await fetch(base);
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type'), /text\/html/);
    assert.equal(await home.text(), await readFile(join(root, 'dist/index.html'), 'utf8'));
    async function check(dir) {
      for (const item of await readdir(dir, {withFileTypes: true})) {
        const file = join(dir, item.name);
        if (item.isDirectory()) await check(file);
        else {
          const url = relative(join(root, 'dist'), file).split('\\').map(encodeURIComponent).join('/');
          const response = await fetch(`${base}/${url}`);
          assert.equal(response.status, 200, url);
          assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(file), url);
          if (url.endsWith('.png')) assert.equal(response.headers.get('content-type'), 'image/png');
          if (url.endsWith('.ttf')) assert.equal(response.headers.get('content-type'), 'font/ttf');
          if (url.endsWith('.svg')) assert.equal(response.headers.get('content-type'), 'image/svg+xml');
        }
      }
    }
    await check(join(root, 'dist'));
    assert.equal((await fetch(`${base}/not-a-file`)).status, 404);
    assert.equal((await fetch(`${base}/package.json`)).status, 404);
    assert.equal((await fetch(`${base}/server.mjs`)).status, 404);
    assert.equal((await fetch(`${base}/%2e%2e%2fpackage.json`)).status, 403);
  } finally { child.kill(); }
});
