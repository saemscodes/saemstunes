// scripts/calc-bump.js
// Automatic version bump calculator based on SemVer rules
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' }).trim();
  } catch (e) {
    return '';
  }
}

function getLastTag() {
  try {
    return run('git describe --tags --abbrev=0');
  } catch (e) {
    return '';
  }
}

function getChangedNumstat(from) {
  const range = from ? `${from}..HEAD` : 'HEAD';
  const out = run(`git diff --numstat ${range} || true`);
  if (!out) return [];
  return out.split('\n').filter(Boolean).map(line => {
    const parts = line.split('\t');
    return {
      added: parseInt(parts[0] || '0', 10) || 0,
      removed: parseInt(parts[1] || '0', 10) || 0,
      path: parts[2]
    };
  });
}

function getAllFilesLines() {
  const files = run('git ls-files').split('\n').filter(Boolean);
  const results = [];
  for (const f of files) {
    try {
      const content = fs.readFileSync(f, 'utf8');
      results.push({ path: f, lines: content.split('\n').length });
    } catch (e) {
      try {
        const stat = fs.statSync(f);
        results.push({ path: f, lines: Math.max(1, Math.round(stat.size / 80)) });
      } catch {
        results.push({ path: f, lines: 1 });
      }
    }
  }
  return results;
}

function weightForPath(p) {
  if (/migrations|schema|openapi|db|supabase/.test(p)) return 2.0;
  if (/src\/server|server|api|routes/.test(p)) return 1.4;
  if (/\.(js|ts|jsx|tsx|py|go|rb)$/.test(p)) return 1.0;
  if (/\.(css|scss|sass)$/.test(p)) return 0.6;
  if (/package.json|yarn.lock|pnpm-lock.yaml|package-lock.json/.test(p)) return 1.5;
  if (/\.(md|rst)$/.test(p)) return 0.05;
  if (/\.(png|jpg|jpeg|svg|gif|mp3|wav|flac|ogg)$/.test(p)) return 0.1;
  return 0.8;
}

function computeWeightedPercent(changes, allFiles) {
  const fileMap = new Map();
  for (const f of allFiles) {
    fileMap.set(f.path, f.lines);
  }

  let changedWeighted = 0;
  for (const c of changes) {
    const weight = weightForPath(c.path);
    const lines = (c.added + c.removed) || (fileMap.get(c.path) || 1);
    changedWeighted += lines * weight;
  }

  let totalWeighted = 0;
  for (const f of allFiles) {
    totalWeighted += f.lines * weightForPath(f.path);
  }

  const percent = totalWeighted ? (changedWeighted / totalWeighted) * 100 : 100;
  return Number(percent.toFixed(4));
}

function detectBreakingChange(from) {
  const range = from ? `${from}..HEAD` : 'HEAD';
  const msgs = run(`git log --pretty=%B ${range}`).toLowerCase();
  if (msgs.includes('breaking change')) return true;
  
  const lines = run(`git log --pretty=%s ${range}`).split('\n');
  for (const l of lines) {
    if (/\w+!:/i.test(l) || /\w+!\s/.test(l)) return true;
  }
  return false;
}

function bumpVersion(old, kind) {
  const [maj, min, patch] = old.split('.').map(n => parseInt(n || '0', 10));
  if (kind === 'major') return `${maj + 1}.0.0`;
  if (kind === 'minor') return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${patch + 1}`;
}

function getCurrentVersion() {
  try {
    const pj = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return pj.version || '0.0.0';
  } catch (e) {
    return '0.0.0';
  }
}

function main() {
  const lastTag = getLastTag();
  console.log('lastTag:', lastTag || '<none>');

  const changes = getChangedNumstat(lastTag);
  const allFiles = getAllFilesLines();

  const percent = computeWeightedPercent(changes, allFiles);
  console.log('weighted change percent:', percent, '%');

  const breaking = detectBreakingChange(lastTag);
  console.log('breaking change detected:', breaking);

  // Apply decision rules
  let bumpKind = 'patch';
  if (breaking) bumpKind = 'major';
  else if (percent >= 25) bumpKind = 'major';
  else if (percent >= 5) bumpKind = 'minor';
  else bumpKind = 'patch';

  // Always bump at least patch if there are commits
  const changesCount = run(`git rev-list ${lastTag ? lastTag + '..HEAD' : 'HEAD'} --count`);
  if (parseInt(changesCount || '0', 10) === 0) {
    console.log('No commits since last tag — exiting.');
    process.exit(0);
  }

  const current = getCurrentVersion();
  const newVer = bumpVersion(current, bumpKind);

  console.log(JSON.stringify({ lastTag, current, newVer, bumpKind, percent, changesCount }, null, 2));
  console.log('OUTPUT::', newVer, bumpKind, percent);
}

main();
