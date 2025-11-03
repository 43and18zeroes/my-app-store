// scripts/build-gallery-manifests.mjs
import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

//
// === BASIS-PFAD-SETUP ===
//
const __filename = url.fileURLToPath(import.meta.url);
const ROOT = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(ROOT, '..');

// wichtig: Windows-kompatibler Pfad (z. B. H:\dev\apps\my-app-store\public\img\applications\previews)
const IMAGES_ROOT = path.join(PROJECT_ROOT, 'public', 'img', 'applications', 'previews');

console.log('===============================================');
console.log('🧭 build-gallery-manifests.mjs START');
console.log('[DEBUG] __filename   =', __filename);
console.log('[DEBUG] PROJECT_ROOT  =', PROJECT_ROOT);
console.log('[DEBUG] IMAGES_ROOT   =', IMAGES_ROOT);
console.log('===============================================');

// Welche Endungen als Bilder zählen
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.svg']);

//
// === Funktion: gallery.json in einem Verzeichnis schreiben ===
//
async function writeManifestForDir(dir) {
  console.log('\n📁 [DIR] Prüfe:', dir);

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.error('❌ [ERROR] Konnte Ordner nicht lesen:', dir, err.message);
    return;
  }

  const files = entries.filter(e => e.isFile()).map(e => e.name);
  const subdirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  console.log('   📄 Dateien  :', files.length ? files.join(', ') : '(keine)');
  console.log('   📂 Unterord.:', subdirs.length ? subdirs.join(', ') : '(keine)');

  const images = files
    .filter(name => IMAGE_EXT.has(path.extname(name).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'de'));

  if (images.length > 0) {
    const manifestPath = path.join(dir, 'gallery.json');
    try {
      await fs.writeFile(manifestPath, JSON.stringify(images, null, 2), 'utf8');
      const rel = path.relative(PROJECT_ROOT, manifestPath);
      console.log(`   ✅ Manifest geschrieben: ${rel} (${images.length} Bilder)`);
    } catch (err) {
      console.error('   ❌ Fehler beim Schreiben von', manifestPath, err.message);
    }
  } else {
    console.log('   ⚠️  Keine Bilder gefunden – kein Manifest erzeugt.');
  }
}

//
// === Funktion: rekursiv durchlaufen ===
//
async function walk(dir) {
  await writeManifestForDir(dir);

  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    console.error('❌ [ERROR] readdir fehlgeschlagen in walk() für', dir, err.message);
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      await walk(path.join(dir, entry.name));
    }
  }
}

//
// === Start ===
//
(async () => {
  try {
    console.log('\n🚀  Starte Durchlauf unter:', IMAGES_ROOT);
    await fs.mkdir(IMAGES_ROOT, { recursive: true });
    await walk(IMAGES_ROOT);
    console.log('\n✅ Gallery manifests built successfully.');
    console.log('===============================================');
  } catch (err) {
    console.error('\n❌ Manifest build failed:', err);
    console.log('===============================================');
    process.exit(1);
  }
})();
