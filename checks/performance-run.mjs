import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { OUTPUT, OLD_BASE, NEW_BASE, NEW_PAGES, writeResult } from './manifest.mjs';

fs.mkdirSync(OUTPUT, { recursive: true });
const chrome = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const executable = path.resolve('node_modules/.bin/lighthouse');
const version = spawnSync(executable, ['--version'], { encoding: 'utf8' });
if (version.status !== 0 || version.stdout.trim() !== '13.5.0') throw new Error(`Expected Lighthouse 13.5.0, got ${version.stdout.trim() || version.stderr}`);
const chromeVersion = spawnSync(chrome, ['--version'], { encoding: 'utf8' }).stdout.trim();
const targets = [
  { key: 'old-attractions', url: `${OLD_BASE}attractions.html`, gate: false },
  ...NEW_PAGES.map(page => ({ key: `new-${page}`, url: `${NEW_BASE}${page}.html`, gate: true }))
];
const measurements = [];
const startedAt = new Date().toISOString();
for (let round = 1; round <= 3; round++) {
  // Rotate the order to reduce a fixed warm-network order effect. Browser storage is reset per invocation.
  const shift = round - 1;
  const ordered = [...targets.slice(shift), ...targets.slice(0, shift)];
  for (const target of ordered) {
    const stem = `lighthouse-${target.key}-${round}`;
    const outputPath = path.resolve(OUTPUT, `${stem}.json`);
    const args = [target.url, '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage', '--only-categories=performance', '--form-factor=mobile', '--throttling-method=simulate', '--throttling.cpuSlowdownMultiplier=4', '--output=json', `--output-path=${outputPath}`, '--quiet'];
    const result = spawnSync(executable, args, { encoding: 'utf8', timeout: 180000, maxBuffer: 8 * 1024 * 1024, env: { ...process.env, CHROME_PATH: chrome } });
    fs.writeFileSync(path.join(OUTPUT, `${stem}.log`), `${result.stdout || ''}\n${result.stderr || ''}`);
    const record = { target: target.key, url: target.url, round, gated: target.gate, commandExit: result.status, cliError: result.error?.message || null, jsonFile: `${stem}.json` };
    try {
      const report = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      record.lighthouseVersion = report.lighthouseVersion;
      record.requestedUrl = report.requestedUrl;
      record.finalUrl = report.finalDisplayedUrl || report.finalUrl;
      record.lcpMs = report.audits['largest-contentful-paint'].numericValue;
      record.cls = report.audits['cumulative-layout-shift'].numericValue;
      record.performanceScore = report.categories.performance.score;
      record.totalBytes = report.audits['total-byte-weight']?.numericValue;
      record.config = report.configSettings;
      record.warnings = report.runWarnings || [];
      record.runtimeError = report.runtimeError || null;
      record.valid = result.status === 0 && !record.runtimeError && record.lighthouseVersion === '13.5.0' && Number.isFinite(record.lcpMs) && record.lcpMs > 0 && Number.isFinite(record.cls) && record.requestedUrl === target.url && record.finalUrl === target.url && record.config?.formFactor === 'mobile' && record.config?.throttlingMethod === 'simulate' && record.config?.throttling?.cpuSlowdownMultiplier === 4 && record.config?.disableStorageReset === false;
      record.withinThresholds = record.valid && record.lcpMs <= 2500 && record.cls <= 0.1;
    } catch (error) {
      record.valid = false;
      record.parseError = error.message;
    }
    measurements.push(record);
    console.log(JSON.stringify({ target: record.target, round, valid: record.valid, lcpMs: record.lcpMs, cls: record.cls, withinThresholds: record.withinThresholds }));
  }
}
const median = values => [...values].sort((a,b) => a-b)[1];
const summaries = targets.map(target => {
  const runs = measurements.filter(r => r.target === target.key);
  const valid = runs.length === 3 && runs.every(r => r.valid);
  const stats = valid ? { lcpMs: median(runs.map(r => r.lcpMs)), cls: median(runs.map(r => r.cls)), performanceScore: median(runs.map(r => r.performanceScore)), totalBytes: median(runs.map(r => r.totalBytes)) } : null;
  return { target: target.key, url: target.url, gated: target.gate, valid, status: valid && stats.lcpMs <= 2500 && stats.cls <= 0.1 ? 'PASS' : 'FAIL', median: stats, individualOutliers: runs.filter(r => !r.withinThresholds).map(r => ({ round: r.round, lcpMs: r.lcpMs, cls: r.cls, valid: r.valid })), runs };
});
const old = summaries.find(s => s.target === 'old-attractions');
const current = summaries.find(s => s.target === 'new-attractions');
const comparison = old.valid && current.valid ? { oldMedianLcpMs: old.median.lcpMs, newMedianLcpMs: current.median.lcpMs, deltaLcpMs: current.median.lcpMs - old.median.lcpMs, oldMedianCls: old.median.cls, newMedianCls: current.median.cls, statement: 'Same runner and mobile lab configuration; not a causal field-user or VPN result.' } : null;
const configurations = measurements.filter(r => r.valid).map(r => JSON.stringify({ formFactor: r.config.formFactor, throttling: r.config.throttling, throttlingMethod: r.config.throttlingMethod, screenEmulation: r.config.screenEmulation, disableStorageReset: r.config.disableStorageReset }));
const sameConfiguration = configurations.length === 15 && new Set(configurations).size === 1;
const validRunSet = summaries.every(s => s.valid) && sameConfiguration;
const status = validRunSet && summaries.filter(s => s.gated).every(s => s.status === 'PASS') ? 'PASS' : 'FAIL';
const report = { status, startedAt, finishedAt: new Date().toISOString(), lighthouseVersion: '13.5.0', chromeVersion, method: '15 sequential CLI launches in one runner: 3 per target; fresh Chrome/storage per launch; simulated mobile, CPU 4, Lighthouse 13.5 default network. Median of 3 for LCP and CLS gates; all raw runs and outliers retained.', threshold: { medianLcpMs: 2500, medianCls: 0.1 }, sameConfiguration, validRunSet, summaries, comparison };
writeResult('performance-summary.json', report);
if (status !== 'PASS') process.exitCode = 1;
