// Loads test/check.html in headless Chrome and fails unless its title is PASS.
// Set CHROME to another Chromium-family binary to override.
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const page = path.join(root, 'test', 'check.html');

// Vendored libraries must match the SHA-256 recorded in README.md.
const recorded = [...readFileSync(path.join(root, 'README.md'), 'utf8').matchAll(/^([0-9a-f]{64})  (extension\/vendor\/\S+)$/gm)];
if (recorded.length < 2) { console.log('hashes: none recorded in README.md'); process.exit(1); }
for (const [, want, file] of recorded) {
  const got = createHash('sha256').update(readFileSync(path.join(root, file))).digest('hex');
  if (got !== want) { console.log(`hashes: ${file} does not match README.md`); process.exit(1); }
}
console.log(`hashes: ${recorded.length} vendored files match`);

const profile = mkdtempSync(path.join(tmpdir(), 'mdv-test-'));

const dom = execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`, '--virtual-time-budget=2000',
  '--dump-dom', pathToFileURL(page).href,
], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
rmSync(profile, { recursive: true, force: true });

const title = (dom.match(/<title>(.*?)<\/title>/) || [])[1];
const out = (dom.match(/<pre id="out">(.*?)<\/pre>/s) || [])[1];
console.log(`title: ${title}\nchecks: ${out}`);
process.exit(title === 'PASS' ? 0 : 1);
