// Builds dist/: an ES module, a CDN script (global HibiraPush) and the
// service worker.
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));
const banner = { js: `// @hibira-io/push-web v${version} (MIT; based on the Pusher Beams web SDK)` };
const common = { bundle: true, target: 'es2018', banner, logLevel: 'warning' };

await build({ ...common, entryPoints: ['src/push-notifications.js'], format: 'esm', outfile: 'dist/push-web.js' });
await build({ ...common, entryPoints: ['src/push-notifications.js'], format: 'iife', globalName: 'HibiraPush', minify: true, outfile: 'dist/push-web.min.js' });
await build({ ...common, entryPoints: ['src/service-worker.js'], format: 'iife', outfile: 'dist/service-worker.js' });
