import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CHECKS = path.dirname(fileURLToPath(import.meta.url));
export const OUTPUT = process.env.VP_QA_OUT || path.join(CHECKS, 'results');
export const OLD_BASE = process.env.VP_QA_OLD_BASE || 'https://konstantinpopov89.github.io/victory-park-family-demo/';
export const NEW_BASE = process.env.VP_QA_BASE || `${OLD_BASE}catalog-v2/`;
export const NEW_PAGES = ['index', 'attractions', 'tickets', 'demo-purchase'];

export function readManifest(name) {
  const manifest = JSON.parse(fs.readFileSync(path.join(CHECKS, name), 'utf8'));
  if (!manifest || Array.isArray(manifest) || typeof manifest !== 'object') throw new Error(`${name}: expected path-to-SHA256 object`);
  const entries = Object.entries(manifest);
  if (!entries.length) throw new Error(`${name}: empty manifest`);
  for (const [relative, sha] of entries) {
    if (relative.startsWith('/') || relative.includes('\\') || relative.split('/').some(p => !p || p === '..' || p === '.') || /[?#\x00-\x1f]/.test(relative)) throw new Error(`${name}: invalid public relative path`);
    if (!/^[0-9a-f]{64}$/.test(sha)) throw new Error(`${name}: invalid SHA256 for ${relative}`);
  }
  return manifest;
}

export function validateInputs() {
  const old = readManifest('old-public-sha256.json');
  const current = readManifest('new-public-sha256.json');
  if (Object.keys(old).length !== 53) throw new Error('Old baseline must contain exactly the 53 sealed public files');
  for (const page of NEW_PAGES) if (!current[`${page}.html`]) throw new Error(`Missing new page: ${page}.html`);
  const before = new URL(OLD_BASE), after = new URL(NEW_BASE);
  if (before.origin !== after.origin || after.pathname !== `${before.pathname}catalog-v2/`) throw new Error('Bases must be the old root and its separate catalog-v2 directory on the same origin');
  return { old, current };
}

export function writeResult(name, data) {
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT, name), `${JSON.stringify(data, null, 2)}\n`);
}
