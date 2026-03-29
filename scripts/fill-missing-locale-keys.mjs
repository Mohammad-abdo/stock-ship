/**
 * Adds missing t() keys to en.json with readable English derived from the key path.
 * Run after check-locale-keys.mjs reports gaps. Arabic inherits via deepMergeI18n in LanguageContext.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcDir = path.join(root, 'src');
const enPath = path.join(root, 'src', 'locales', 'en.json');

const T_CALL = /\bt\s*\(\s*['"]([a-zA-Z][a-zA-Z0-9_.]*)['"]\s*[,)]/g;

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

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** last segment camelCase -> "Title Case" */
function humanizeSegment(seg) {
  const spaced = seg
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
  return spaced
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function labelForKey(dotKey) {
  const overrides = {
    allTime: 'All time',
    last3Months: 'Last 3 months',
    date: 'Date',
    language: 'Language',
    ascending: 'Ascending',
    descending: 'Descending',
    actions: 'Actions',
    viewDetails: 'View details',
  };
  if (overrides[dotKey]) return overrides[dotKey];
  const last = dotKey.split('.').pop();
  return humanizeSegment(last);
}

function ensureDeepString(root, dotKey, value) {
  const parts = dotKey.split('.');
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const next = cur[k];
    if (next === undefined) {
      cur[k] = {};
      cur = cur[k];
    } else if (typeof next === 'string') {
      throw new Error(`Cannot create path ${dotKey}: ${parts.slice(0, i + 1).join('.')} is a string`);
    } else {
      cur = next;
    }
  }
  const leaf = parts[parts.length - 1];
  if (cur[leaf] !== undefined && typeof cur[leaf] !== 'string') {
    throw new Error(`Cannot set ${dotKey}: existing value is not a string`);
  }
  if (cur[leaf] === undefined) {
    cur[leaf] = value;
    return true;
  }
  return false;
}

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const files = walkFiles(srcDir);
const used = new Set();
for (const fp of files) {
  const s = fs.readFileSync(fp, 'utf8');
  let m;
  T_CALL.lastIndex = 0;
  while ((m = T_CALL.exec(s)) !== null) used.add(m[1]);
}

const missing = [...used].filter((k) => getLeaf(en, k) === undefined).sort();
let added = 0;
for (const k of missing) {
  if (ensureDeepString(en, k, labelForKey(k))) added++;
}

fs.writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`);
console.log(`Added ${added} missing keys to en.json (${missing.length} were missing).`);
