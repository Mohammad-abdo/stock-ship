/**
 * Flags duplicate property names inside the same JSON object.
 * JSON.parse keeps only the last value — other translations are lost silently.
 *
 * Run: node scripts/check-locale-duplicates.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '..', 'src', 'locales');

function readString(source, startQuote) {
  let i = startQuote + 1;
  let out = '';
  while (i < source.length) {
    const c = source[i];
    if (c === '\\') {
      out += source[i + 1] ?? '';
      i += 2;
      continue;
    }
    if (c === '"') return { value: out, end: i + 1 };
    out += c;
    i++;
  }
  return { value: out, end: i };
}

function scan(source, filename) {
  const dupes = [];
  /** @type {Map<string, number>[]} */
  const stack = [];
  let i = 0;
  const pushObj = () => stack.push(new Map());
  const popObj = () => stack.pop();

  while (i < source.length) {
    const c = source[i];
    if (c === '{') {
      pushObj();
      i++;
      continue;
    }
    if (c === '}') {
      popObj();
      i++;
      continue;
    }
    if (c === '"') {
      const inObject = stack.length > 0;
      const keyRead = readString(source, i);
      const key = keyRead.value;
      i = keyRead.end;
      while (i < source.length && /\s/.test(source[i])) i++;
      if (source[i] === ':' && inObject) {
        const map = stack[stack.length - 1];
        const n = (map.get(key) || 0) + 1;
        map.set(key, n);
        if (n === 2) dupes.push(key);
        i++;
        // skip value (strings, numbers, true/false/null, nested {} [])
        while (i < source.length && /\s/.test(source[i])) i++;
        if (source[i] === '"') {
          const s = readString(source, i);
          i = s.end;
        } else if (source[i] === '{') {
          continue;
        } else if (source[i] === '[') {
          let depth = 1;
          i++;
          while (i < source.length && depth > 0) {
            if (source[i] === '[') depth++;
            else if (source[i] === ']') depth--;
            i++;
          }
        } else {
          while (i < source.length && source[i] !== ',' && source[i] !== '}') i++;
        }
        continue;
      }
      i = keyRead.end;
      continue;
    }
    i++;
  }
  return [...new Set(dupes)];
}

let code = 0;
for (const name of ['en.json', 'ar.json']) {
  const fp = path.join(localesDir, name);
  const s = fs.readFileSync(fp, 'utf8');
  const dupes = scan(s, name);
  if (dupes.length) {
    console.error(`\n${name}: duplicate keys in the same object (heuristic scan):`);
    dupes.sort().forEach((k) => console.error(`  - ${k}`));
    code = 1;
  } else {
    console.log(`${name}: OK (no duplicate keys detected).`);
  }
}
process.exit(code);
