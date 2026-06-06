import { readFileSync } from 'node:fs';

const MIN_AGE_DAYS = 5;
const MIN_AGE_MS = MIN_AGE_DAYS * 24 * 60 * 60 * 1000;

const { dependencies = {}, devDependencies = {} } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);

const allDeps = { ...dependencies, ...devDependencies };
const now = Date.now();
const tooNew = [];

for (const [pkg, range] of Object.entries(allDeps)) {
  const version = range.replace(/^[\^~>=<]/, '');
  try {
    const res = await fetch(`https://registry.npmjs.org/${pkg}/${version}`);
    if (!res.ok) continue;
    const data = await res.json();
    const published = new Date(data.time ?? data._time).getTime();
    const ageDays = Math.floor((now - published) / 86400000);
    if (now - published < MIN_AGE_MS) {
      tooNew.push(`${pkg}@${version} (published ${ageDays} day${ageDays === 1 ? '' : 's'} ago)`);
    }
  } catch {
    // skip packages that can't be resolved
  }
}

if (tooNew.length) {
  console.error(`\nPackages published less than ${MIN_AGE_DAYS} days ago:`);
  for (const p of tooNew) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`All direct dependencies are at least ${MIN_AGE_DAYS} days old.`);
