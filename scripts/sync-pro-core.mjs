#!/usr/bin/env node
// 仓库维护工具：唯一维护源仍为 skills/ued-judge；Pro 副本为自动生成产物。
import { readdir, readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'skills/ued-judge');
const target = join(root, 'skills/ued-judge-pro');
const mode = process.argv[2];
if (!['--write', '--check'].includes(mode) || process.argv.length !== 3) {
  console.error('用法：node scripts/sync-pro-core.mjs --write | --check'); process.exit(1);
}
const hash = b => createHash('sha256').update(b).digest('hex');
async function walk(dir, prefix = '') {
  const files = [];
  for (const name of (await readdir(dir)).sort()) {
    const relative = prefix ? `${prefix}/${name}` : name;
    const stat = await lstat(join(dir, name));
    if (stat.isSymbolicLink()) throw Error(`不接受共享源中的软链：${relative}`);
    if (stat.isDirectory()) files.push(...await walk(join(dir, name), relative));
    else if (stat.isFile() && name !== '.DS_Store') files.push(relative);
  }
  return files;
}
try {
  const skill = await readFile(join(source, 'SKILL.md'), 'utf8');
  const coreVersion = skill.match(/^  version: "([0-9]+\.[0-9]+\.[0-9]+)"$/m)?.[1];
  if (!coreVersion) throw Error('源 SKILL.md 缺少合法 metadata.version');
  const files = [...(await walk(join(source, 'references'))).map(p => `references/${p}`), 'scripts/capture.mjs'].sort();
  const manifest = { schemaVersion: 1, source: 'skills/ued-judge', coreVersion, files: {} };
  let previous;
  try { previous = JSON.parse(await readFile(join(target, 'core-manifest.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const stale = Object.keys(previous?.files || {}).filter(p => !files.includes(p));
  if (stale.length) throw Error(`共享源移除了文件，先人工处理 Pro 陈旧副本：${stale.join(', ')}`);
  const drift = [];
  for (const relative of files) {
    const bytes = await readFile(join(source, relative));
    manifest.files[relative] = hash(bytes);
    if (mode === '--write') {
      await mkdir(dirname(join(target, relative)), { recursive: true });
      try { if ((await lstat(join(target, relative))).isSymbolicLink()) throw Error(`目标不得为软链：${relative}`); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
      await writeFile(join(target, relative), bytes);
    } else {
      try { if (hash(await readFile(join(target, relative))) !== manifest.files[relative]) drift.push(relative); }
      catch (error) { if (error.code === 'ENOENT') drift.push(relative); else throw error; }
    }
  }
  const serialized = JSON.stringify(manifest, null, 2) + '\n';
  if (mode === '--write') await writeFile(join(target, 'core-manifest.json'), serialized);
  else if (JSON.stringify(previous) !== JSON.stringify(manifest)) drift.push('core-manifest.json');
  if (drift.length) throw Error(`Pro 共享规则不同步：${drift.join(', ')}；运行 --write 后复查。`);
  console.log(`${mode === '--write' ? '已同步' : '一致性通过'}：core ${coreVersion}，${files.length} 个共享文件。`);
} catch (error) { console.error(error.message); process.exit(1); }
