// Loads test/check.html in headless Chrome and fails unless its title is PASS.
// Set CHROME to another Chromium-family binary to override.
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const page = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'test', 'check.html');

const dom = execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--virtual-time-budget=2000',
  '--dump-dom', pathToFileURL(page).href,
], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });

const title = (dom.match(/<title>(.*?)<\/title>/) || [])[1];
const out = (dom.match(/<pre id="out">(.*?)<\/pre>/s) || [])[1];
console.log(`title: ${title}\nchecks: ${out}`);
process.exit(title === 'PASS' ? 0 : 1);
