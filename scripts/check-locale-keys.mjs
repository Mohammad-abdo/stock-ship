/**
 * Ensures every static t('a.b.c') / t("a.b.c") used under src/ resolves to a string leaf in en.json.
 * Prevents raw keys like "mediation.employees.list" appearing in the UI.
 *
 * Run: node scripts/check-locale-keys.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const enPath = path.join(root, 'src', 'locales', 'en.json');

const T_CALL =
  /\bt\s*\(\s*['"]([a-zA-Z][a-zA-Z0-9_.]*)['"]\s*[,)]/g;

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith('.')) continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      walkFiles(p, out);
    } else if (/\.(jsx?|tsx?|mjs|cjs)$/.test(name.name)) {
      out.push(p);
    }
  }
  return out;
}

function getLeaf(obj, dotKey) {
  const parts = dotKey.split('.');
  let v = obj;
  for (const k of parts) {
    if (v === null || typeof v !== 'object' || !(k in v)) return undefined;
    v = v[k];
  }
  if (typeof v === 'string') return v;
  return undefined;
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const files = walkFiles(srcDir);
const used = new Set();

for (const fp of files) {
  const s = fs.readFileSync(fp, 'utf8');
  let m;
  T_CALL.lastIndex = 0;
  while ((m = T_CALL.exec(s)) !== null) {
    used.add(m[1]);
  }
}

const missing = [...used].filter((k) => getLeaf(en, k) === undefined).sort();

if (missing.length) {
  console.error('Missing string keys in src/locales/en.json (used in src/):\n');
  missing.forEach((k) => console.error(`  - ${k}`));
  console.error(`\nTotal: ${missing.length}`);
  process.exit(1);
}

console.log(`OK: ${used.size} distinct t() keys all present in en.json.`);
