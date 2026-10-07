#!/usr/bin/env node
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { validateReport, scoreSummary, DIMENSIONS } from './report-data.mjs';

const hash = b => createHash('sha256').update(b).digest('base64');
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export async function renderReport(inputPath, outputPath, { force = false } = {}) {
  if (resolve(inputPath) === resolve(outputPath)) throw Error('输出不能覆盖输入数据');
  const skillDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const raw = await readFile(resolve(inputPath), 'utf8');
  const data = validateReport(JSON.parse(raw));
  const manifest = JSON.parse(await readFile(join(skillDir, 'core-manifest.json'), 'utf8'));
  const proVersion = (await readFile(join(skillDir, 'SKILL.md'), 'utf8')).match(/^  version: "([^"\n]+)"$/m)?.[1];
  if (data.versions.core !== manifest.coreVersion || data.versions.skill !== proVersion) throw Error('报告 Pro/core 版本与安装包不一致；不要伪造版本。历史口径记录在 rubric 与 notes。');
  for (const [relative, expected] of Object.entries(manifest.files)) {
    const bytes = await readFile(join(skillDir, relative));
    if (createHash('sha256').update(bytes).digest('hex') !== expected) throw Error(`安装的共享规则损坏：${relative}`);
  }
  const fingerprint = createHash('sha256').update(raw);
  const screenshots = { before: [], after: [] };
  for (const phase of ['before', 'after']) for (const shot of data.screenshots[phase]) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(shot.path) && !/^[a-z]:[\\/]/i.test(shot.path)) throw Error('截图必须为本地 PNG 路径，不能联网或嵌入外部资源');
    const bytes = await readFile(resolve(dirname(resolve(inputPath)), shot.path));
    if (bytes.length < 24 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) || bytes.toString('ascii', 12, 16) !== 'IHDR') throw Error(`不是合法 PNG：${shot.path}`);
    const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
    if (!width || !height) throw Error(`PNG 尺寸无效：${shot.path}`);
    fingerprint.update(bytes);
    screenshots[phase].push({ ...shot, image: `data:image/png;base64,${bytes.toString('base64')}`, width, height });
  }
  const model = { ...data, screenshots, dimensions: DIMENSIONS, scoreDisplay: { before: scoreSummary(data.scores.before), after: data.kind === 'comparison' ? scoreSummary(data.scores.after) : null }, fingerprint: fingerprint.digest('hex').slice(0, 20) };
  const css = await readFile(join(skillDir, 'assets/report.css'), 'utf8');
  const js = await readFile(join(skillDir, 'assets/report.js'), 'utf8');
  const template = await readFile(join(skillDir, 'assets/report.html'), 'utf8');
  const json = JSON.stringify(model).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const replacements = { TITLE: escape(`${data.subject.name} · UEDJudge Pro`), STYLE: css, SCRIPT: js, SCRIPT_HASH: hash(js), DATA: json, FULL_REPORT: escape(data.fullReport), SUMMARY: escape(data.summary) };
  const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => replacements[key]);
  await mkdir(dirname(resolve(outputPath)), { recursive: true });
  await writeFile(resolve(outputPath), html, { flag: force ? 'w' : 'wx' });
  return { path: resolve(outputPath), kind: data.kind, runId: data.runId, fingerprint: model.fingerprint, bytes: Buffer.byteLength(html) };
}

const invokedPath = process.argv[1] ? await realpath(resolve(process.argv[1])).catch(() => '') : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length < 2 || args.length > 3 || args.length === 3 && args[2] !== '--force' || !args[1].endsWith('.html')) {
    console.error('用法：node render-report.mjs <report.json> <report.html> [--force]'); process.exit(1);
  }
  try { console.log(JSON.stringify(await renderReport(args[0], args[1], { force: args[2] === '--force' }), null, 2)); }
  catch (error) { console.error(`未生成报告：${error.code === 'EEXIST' ? '输出已存在；确认保留历史后用 --force' : error.message}`); process.exit(1); }
}
