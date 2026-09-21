// Copies the MediaPipe wasm runtime out of node_modules into public/mediapipe so
// it is served from our own origin (same-origin, cacheable, no third-party hop).
// Runs automatically before `dev` and `build`.
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const from = resolve(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const to = resolve(root, 'public/mediapipe');

const files = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
];

if (!existsSync(from)) {
  console.warn('copy-mediapipe: @mediapipe/tasks-vision is not installed, skipping.');
  process.exit(0);
}

mkdirSync(to, { recursive: true });
for (const file of files) copyFileSync(resolve(from, file), resolve(to, file));
console.log(`copy-mediapipe: copied ${files.length} files to public/mediapipe`);
