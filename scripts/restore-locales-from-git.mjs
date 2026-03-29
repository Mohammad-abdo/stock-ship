/**
 * Restores en.json / ar.json from git HEAD and deep-merges the current files on top
 * (current leaves win; missing branches stay from git). Fixes accidental replacement
 * of whole objects (e.g. mediation.employees) with a tiny partial object.
 *
 * Run from repo root: node scripts/restore-locales-from-git.mjs
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const localesDir = path.join(root, 'src', 'locales');

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/** Git base first; current file overrides/adds leaves without dropping sibling keys. */
function deepMergePreferOverride(base, override) {
  if (override === undefined || override === null) return base;
  if (!isPlainObject(base)) return override;
  if (!isPlainObject(override)) return override;
  const keys = new Set([...Object.keys(base), ...Object.keys(override)]);
  const out = {};
  for (const k of keys) {
    const b = base[k];
    const o = override[k];
    if (o === undefined) {
      out[k] = b;
      continue;
    }
    if (b === undefined) {
      out[k] = o;
      continue;
    }
    if (isPlainObject(b) && isPlainObject(o)) {
      out[k] = deepMergePreferOverride(b, o);
    } else {
      out[k] = o;
    }
  }
  return out;
}

function readGitFile(gitPath) {
  const s = execSync(`git show HEAD:${gitPath}`, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  return JSON.parse(s);
}

for (const name of ['en.json', 'ar.json']) {
  const rel = `src/locales/${name}`;
  const fp = path.join(localesDir, name);
  const fromGit = readGitFile(rel);
  const current = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const merged = deepMergePreferOverride(fromGit, current);
  fs.writeFileSync(fp, `${JSON.stringify(merged, null, 2)}\n`);
  console.log('Wrote', fp);
}
