import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { validateInputs, writeResult, OLD_BASE, NEW_BASE, OUTPUT } from './manifest.mjs';

const phase = process.argv[2] || 'manual';
if (!/^[a-z0-9-]+$/.test(phase)) throw new Error('Phase must contain only a-z, 0-9 or hyphen');
const startedAt = new Date().toISOString();
try {
  const { old, current } = validateInputs();
  const tasks = [
    ...Object.entries(old).map(([file, sha256]) => ({ version: 'old', file, sha256, base: OLD_BASE })),
    ...Object.entries(current).map(([file, sha256]) => ({ version: 'new', file, sha256, base: NEW_BASE }))
  ];
  const results = [];
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const item = tasks[next++];
      const url = new URL(item.file.split('/').map(encodeURIComponent).join('/'), item.base).href;
      const record = { version: item.version, file: item.file, url, expectedSHA256: item.sha256 };
      try {
        const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache', 'User-Agent': 'VictoryParkPrototypeReadback/2' }, signal: AbortSignal.timeout(30000), redirect: 'error' });
        const body = Buffer.from(await response.arrayBuffer());
        record.httpStatus = response.status;
        record.bytes = body.length;
        record.actualSHA256 = createHash('sha256').update(body).digest('hex');
        record.status = response.status === 200 && record.actualSHA256 === item.sha256 ? 'PASS' : 'FAIL';
        if (item.version === 'new' && record.status === 'PASS') {
          const local = path.join(OUTPUT, 'public-site', item.file);
          fs.mkdirSync(path.dirname(local), { recursive: true });
          fs.writeFileSync(local, body);
          record.savedVerifiedPublicCopy = true;
        }
      } catch (error) {
        record.status = 'FAIL';
        record.error = error.message;
      }
      results.push(record);
    }
  }
  await Promise.all(Array.from({ length: 5 }, worker));
  results.sort((a,b) => `${a.version}/${a.file}`.localeCompare(`${b.version}/${b.file}`));
  const status = results.length === tasks.length && results.every(r => r.status === 'PASS') ? 'PASS' : 'FAIL';
  const report = { status, phase, startedAt, finishedAt: new Date().toISOString(), oldExpectedCount: Object.keys(old).length, newExpectedCount: Object.keys(current).length, checkedCount: results.length, resultScope: 'Exact bytes served by public HTTP for every manifest entry. Does not validate browser state, UX, operation or hidden/unlisted files.', results };
  writeResult(`public-readback-${phase}.json`, report);
  console.log(JSON.stringify({ status, phase, files: results.length, failures: results.filter(r => r.status !== 'PASS') }));
  if (status !== 'PASS') process.exitCode = 1;
} catch (error) {
  writeResult(`public-readback-${phase}.json`, { status: 'FAIL', phase, startedAt, error: error.message });
  console.error(error.message);
  process.exitCode = 1;
}
