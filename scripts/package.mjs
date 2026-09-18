import {cp, mkdir, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, '.azure-package');
await mkdir(out, {recursive: true});
if ((await readdir(out)).length) throw new Error('Use an empty .azure-package directory to avoid stale deployment files.');
for (const name of ['dist', 'server.mjs', 'package.json', 'package-lock.json', 'scripts', 'tests']) {
  await cp(join(root, name), join(out, name), {recursive: true});
}
console.log('Deployment ready in .azure-package with package.json at its root.');
