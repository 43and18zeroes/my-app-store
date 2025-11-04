import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const ROOT = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(ROOT, '..');

// Base folder: e.g. ...\public\img\applications\previews
const IMAGES_ROOT = path.join(PROJECT_ROOT, 'public', 'img', 'applications', 'previews');

// Optional: --watch --interval=1000
const argv = process.argv.slice(2);
const WATCH = argv.includes('--watch');
const INTERVAL_MS = parseInt(argv.find(a => a.startsWith('--interval='))?.split('=')[1] || '1500', 10);

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']);

console.log('===============================================');
console.log('build-gallery-manifests.mjs START');
console.log('[DEBUG] PROJECT_ROOT  =', PROJECT_ROOT);
console.log('[DEBUG] IMAGES_ROOT   =', IMAGES_ROOT);
console.log('[DEBUG] WATCH         =', WATCH, `(${INTERVAL_MS}ms)`);
console.log('===============================================');

async function writeManifestForDir(dir) {
  // ❌ Skip writing a manifest directly in the root "previews" directory
  if (dir === IMAGES_ROOT) {
    return;
  }

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.error('readdir failed:', dir, err.message);
    return;
  }

  const files = entries.filter(e => e.isFile()).map(e => e.name);
  const images = files
    .filter(name => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'de'));

  const manifestPath = path.join(dir, 'gallery.json');
  const rel = path.relative(PROJECT_ROOT, manifestPath);

  try {
    await fs.writeFile(manifestPath, JSON.stringify(images, null, 2), 'utf8');
    console.log(`${rel} written → [${images.length} image(s)]`);
  } catch (err) {
    console.error('Error writing', manifestPath, err.message);
  }
}

async function walk(dir) {
  // Write manifest only for subdirectories, not the root
  await writeManifestForDir(dir);

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.error('readdir failed in walk():', dir, err.message);
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      await walk(path.join(dir, entry.name));
    }
  }
}

async function scanOnce() {
  await fs.mkdir(IMAGES_ROOT, { recursive: true });
  await walk(IMAGES_ROOT);
}

async function watchLoop() {
  console.log(`Watching every ${INTERVAL_MS}ms...`);
  await scanOnce();
  setInterval(() => scanOnce().catch(err => console.error('Scan error:', err)), INTERVAL_MS);
}

(async () => {
  try {
    if (WATCH) {
      await watchLoop();
    } else {
      await scanOnce();
      console.log('\n✅ Gallery manifests built successfully (single run).');
      console.log('===============================================');
    }
  } catch (err) {
    console.error('\n❌ Manifest build failed:', err);
    console.log('===============================================');
    process.exit(1);
  }
})();
