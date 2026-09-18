import {readFile, readdir, access} from 'node:fs/promises';
import {resolve, dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
const site = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(join(site, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs');
async function check(ref, base) {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(ref)) return;
  if (ref.startsWith('#')) {
    if (ref.length > 1 && !ids.includes(ref.slice(1))) throw new Error(`Missing anchor: ${ref}`);
    return;
  }
  const path = decodeURIComponent(ref.split(/[?#]/)[0]);
  if (path) await access(path.startsWith('/') ? resolve(site, '.' + path) : resolve(base, path));
}
for (const m of html.matchAll(/\b(?:src|href)="([^"]+)"/g)) await check(m[1], site);
async function checkCss(dir) {
  for (const item of await readdir(dir, {withFileTypes: true})) {
    const path = join(dir, item.name);
    if (item.isDirectory()) await checkCss(path);
    else if (item.name.endsWith('.css')) {
      for (const m of (await readFile(path, 'utf8')).matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/g)) await check(m[1], dirname(path));
    }
  }
}
await checkCss(site);
console.log('Static website validated; dist requires no compilation.');
