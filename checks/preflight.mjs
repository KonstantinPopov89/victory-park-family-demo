import fs from 'node:fs';
import path from 'node:path';
import { CHECKS, validateInputs, writeResult } from './manifest.mjs';

try {
  const { old, current } = validateInputs();
  for (const script of ['independent-check.cjs', 'public-visual.mjs', 'performance-run.mjs', 'public-readback.mjs']) {
    const file = path.join(CHECKS, script);
    if (!fs.existsSync(file) || fs.statSync(file).size < 100) throw new Error(`Missing prepared check: ${script}`);
  }
  const report = { status: 'PASS', checkedAt: new Date().toISOString(), oldFiles: Object.keys(old).length, newFiles: Object.keys(current).length, scope: 'Check inputs exist; not a result of browser, publication or performance QA.' };
  writeResult('preflight.json', report);
  console.log(JSON.stringify(report));
} catch (error) {
  const report = { status: 'FAIL', checkedAt: new Date().toISOString(), error: error.message };
  writeResult('preflight.json', report);
  console.error(JSON.stringify(report));
  process.exitCode = 1;
}
