import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { validateReport, scoreSummary } from '../skills/ued-judge-pro/scripts/report-data.mjs';

const root = resolve(import.meta.dirname, '..');
const pro = join(root, 'skills/ued-judge-pro');
async function skillVersion(dir) {
  const skill = await readFile(join(dir, 'SKILL.md'), 'utf8');
  const version = skill.match(/^  version: "([0-9]+\.[0-9]+\.[0-9]+)"$/m)?.[1];
  assert.ok(version, `${dir} 须有合法 metadata.version`);
  return version;
}
const [coreVersion, proVersion] = await Promise.all([skillVersion(join(root, 'skills/ued-judge')), skillVersion(pro)]);
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jC6cAAAAASUVORK5CYII=', 'base64');
const sections = ['critic', 'checks', 'protection', 'fidelity', 'limits', 'data', 'stages'];
function fixture() {
  return {
    schemaVersion: 1, kind: 'diagnosis', runId: 'unit-01', createdAt: '2026-10-07T00:00:00Z',
    subject: { name: '测试页面', target: '本地测试', inputType: 'html', canOptimize: true, usagePathway: '界面类型：任务型工具\n用户：测试人员\n场景：日常\n核心任务：查看\n关键路径：阅读' },
    versions: { skill: proVersion, core: coreVersion, rubric: 'v3.1', verifier: 'v1', criticModel: '测试，不是实际评审' },
    capture: { viewport: { width: 1440, height: 900 }, truncated: false, coverageNote: '测试截图' },
    summary: '单元测试，不代表评审。',
    screenshots: { before: [{ id: 'before-0', role: 'overview', label: '原始总览', path: 'shot.png' }], after: [] },
    scores: { before: Object.fromEntries('ABCDEF'.split('').map(x => [x, [3, 4]])), notes: ['仅参考'] },
    gaps: [{ id: 'G1', text: '标题层级不清', dimension: 'A1', severity: 'P2', confidence: '高', stageId: 'stage-1', locations: { before: { shotId: 'before-0', rect: [0, 0, 1, 0.2] } } }],
    checks: [{ id: 'G1', title: '控件几何', result: '无法判定', evidence: '未实测' }],
    stages: [{ id: 'stage-1', title: '层级', status: '计划中', items: [{ source: { type: 'gap', id: 'G1' }, action: '调整层级', target: '标题清楚' }] }],
    sections: sections.map(id => ({ id, title: id, body: '无 / 已记录' })),
    fullReport: '完整文字报告\n分数与结论照实保留',
    rawReviews: [{ label: '初评样本 1', body: '原始测试评语 1' }, { label: '初评样本 2', body: '原始测试评语 2' }],
  };
}

test('输入校验与确定性换算，不修改评审输入', () => {
  const data = fixture(), original = JSON.stringify(data);
  validateReport(data);
  const score = scoreSummary(data.scores.before);
  assert.deepEqual(score.totals, [18, 24]);
  assert.equal(score.total, 21);
  assert.equal(score.ten, 8.8);
  assert.equal(JSON.stringify(data), original);
});

test('缺失值不默认为通过或零分，保留不稳定标记', () => {
  const data = fixture();
  data.scores.before.A = [null, 4];
  validateReport(data);
  assert.equal(scoreSummary(data.scores.before).total, null);
  assert.equal(scoreSummary(data.scores.before).means.A, null);
  data.scores.before.A = [1, 4];
  assert.deepEqual(scoreSummary(data.scores.before).unstable, ['A']);
});

test('拒绝失真输入、错误关系和诊断阶段的新截图', () => {
  for (const mutate of [
    d => { delete d.fullReport; },
    d => { d.sections = []; },
    d => { d.scores.before.A = [5, 1]; },
    d => { d.scores.before.A = [3]; },
    d => { d.gaps[0].stageId = 'missing'; },
    d => { d.gaps[0].locations.before.shotId = 'missing'; },
    d => { d.gaps[0].locations.before.rect = [-1, 0, 1, 1]; },
    d => { d.stages[0].items[0].source.id = 'missing'; },
    d => { d.screenshots.after = [{ ...d.screenshots.before[0], id: 'after-0' }]; },
    d => { d.subject.canOptimize = false; d.subject.reason = ''; },
  ]) {
    const data = fixture(); mutate(data);
    assert.throws(() => validateReport(data));
  }
});

test('共享副本与原版一致，普通版未嵌入 Pro 交互规则', async () => {
  execFileSync(process.execPath, ['scripts/sync-pro-core.mjs', '--check'], { cwd: root });
  const manifest = JSON.parse(await readFile(join(pro, 'core-manifest.json'), 'utf8'));
  assert.equal(manifest.coreVersion, coreVersion);
  for (const [file, digest] of Object.entries(manifest.files)) {
    const source = await readFile(join(root, 'skills/ued-judge', file));
    const copy = await readFile(join(pro, file));
    assert.deepEqual(copy, source);
    assert.equal(createHash('sha256').update(copy).digest('hex'), digest);
  }
  assert.match(await readFile(join(root, 'skills/ued-judge/SKILL.md'), 'utf8'), /报告\*\*只在对话中呈现/);
});

test('离线报告安全内嵌、拒绝覆盖、Pro 脱离普通版可生成', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ued-pro-test-'));
  try {
    const data = fixture();
    data.subject.name = '</script><script>globalThis.injected=true</script>';
    data.fullReport = '<img src=x onerror=alert(1)> 原始文字必须保留';
    await writeFile(join(dir, 'shot.png'), png);
    await writeFile(join(dir, 'report.json'), JSON.stringify(data));
    const isolated = join(dir, 'ued-judge-pro');
    await cp(pro, isolated, { recursive: true });
    const cmd = [join(isolated, 'scripts/render-report.mjs'), join(dir, 'report.json'), join(dir, 'report.html')];
    execFileSync(process.execPath, cmd);
    const html = await readFile(join(dir, 'report.html'), 'utf8');
    assert.match(html, /data:image\/png;base64/);
    assert.match(html, /connect-src 'none'/);
    assert.match(html, /script-src 'sha256-/);
    assert.doesNotMatch(html, /<script>globalThis\.injected/);
    assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.match(html, /\u003c|\\u003c/);
    assert.throws(() => execFileSync(process.execPath, cmd, { stdio: 'pipe' }));
    execFileSync(process.execPath, [...cmd, '--force']);
    const wrongVersion = structuredClone(data);
    wrongVersion.versions.core = '0.0.0';
    await writeFile(join(dir, 'wrong-version.json'), JSON.stringify(wrongVersion));
    assert.throws(() => execFileSync(process.execPath, [cmd[0], join(dir, 'wrong-version.json'), join(dir, 'wrong-version.html')], { stdio: 'pipe' }));
    data.screenshots.before[0].path = 'https://example.com/private.png';
    await writeFile(join(dir, 'remote.json'), JSON.stringify(data));
    assert.throws(() => execFileSync(process.execPath, [cmd[0], join(dir, 'remote.json'), join(dir, 'remote.html')], { stdio: 'pipe' }));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('对照报告必须有真实核验与成对结果，不从分数推断改善', () => {
  const data = fixture();
  data.kind = 'comparison';
  assert.throws(() => validateReport(data));
  data.screenshots.after = [{ id: 'after-0', role: 'overview', label: '最终总览', path: 'shot.png' }];
  data.scores.after = Object.fromEntries('ABCDEF'.split('').map(x => [x, [4]]));
  data.sections = ['goal', 'verification', 'pair', 'fidelity', 'protection', 'checks', 'remaining', 'limits', 'motion', 'changes', 'scoreNotes'].map(id => ({ id, title: id, body: '无 / 已记录' }));
  data.verification = [{ gapId: 'G1', result: '无法判断', evidence: '没有展开态截图' }];
  data.pairResults = 'ABCDEF'.split('').map(dimension => ({ dimension, result: '持平', confidence: '—', attributed: false, judgment: '持平', evidence: '原始比较证据' }));
  data.goal = { result: '未达成', conditions: Array.from({ length: 4 }, () => ({ title: '原始差距', result: '无法判定', evidence: '缺图' })) };
  data.rawReviews.push({ label: '核验测试样本', body: '原始核验测试全文' });
  validateReport(data);
  assert.equal(data.verification[0].result, '无法判断');
  data.pairResults[0].judgment = '真实改进';
  assert.throws(() => validateReport(data));
});
