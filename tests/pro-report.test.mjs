import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { validateReport, scoreSummary } from '../skills/ued-judge-pro/scripts/report-data.mjs';
import { renderReport } from '../skills/ued-judge-pro/scripts/render-report.mjs';

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

function comparisonFixture() {
  const data = fixture();
  data.kind = 'comparison';
  data.screenshots.after = [{ id: 'after-0', role: 'overview', label: '最终总览', path: 'shot.png' }];
  data.scores.after = Object.fromEntries('ABCDEF'.split('').map(x => [x, [4]]));
  data.sections = ['goal', 'verification', 'pair', 'fidelity', 'protection', 'checks', 'remaining', 'limits', 'motion', 'changes', 'scoreNotes'].map(id => ({ id, title: id, body: '无 / 已记录' }));
  data.verification = [{ gapId: 'G1', result: '无法判断', evidence: '没有展开态截图' }];
  data.pairResults = 'ABCDEF'.split('').map(dimension => ({ dimension, result: '持平', confidence: '—', attributed: false, judgment: '持平', evidence: '原始比较证据' }));
  data.goal = { result: '未达成', conditions: Array.from({ length: 4 }, () => ({ title: '原始差距', result: '无法判定', evidence: '缺图' })) };
  data.rawReviews.push({ label: '核验测试样本', body: '原始核验测试全文' });
  return data;
}

test('对照报告必须有真实核验与成对结果，不从分数推断改善', () => {
  const missing = fixture(); missing.kind = 'comparison';
  assert.throws(() => validateReport(missing));
  const data = comparisonFixture();
  validateReport(data);
  assert.equal(data.verification[0].result, '无法判断');
  data.pairResults[0].judgment = '真实改进';
  assert.throws(() => validateReport(data));
});

test('短摘要可选且非空，不替换完整正文或原始记录', () => {
  const data = fixture(); validateReport(data); // schema v1 旧报告兼容。
  data.sections[0].summary = '存在未验证项，需阅读边界。';
  const original = JSON.stringify(data);
  validateReport(data); assert.equal(JSON.stringify(data), original);
  for (const summary of ['', '  ', null, 7]) {
    data.sections[0].summary = summary;
    assert.throws(() => validateReport(data));
  }
});

test('摘要报告浏览器交互与降级', { skip: !process.env.PLAYWRIGHT_PATH && '设置 PLAYWRIGHT_PATH 后运行浏览器验证' }, async t => {
  const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_PATH);
  const browser = await chromium.launch({ headless: true });
  const dir = await mkdtemp(join(tmpdir(), 'ued-pro-compact-'));
  let sequence = 0;
  const compact = data => {
    for (const section of data.sections) {
      section.summary = `${section.title}：未验证的范围与授权边界保持原样。`;
      section.body = `${section.title} 完整依据\n${'详细检查记录，不是新的评审结论。\n'.repeat(32)}`;
    }
    return data;
  };
  async function open(data, options = {}) {
    const name = `report-${++sequence}`, input = join(dir, `${name}.json`), output = join(dir, `${name}.html`);
    await writeFile(input, JSON.stringify(data));
    await renderReport(input, output);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...options });
    await page.goto(pathToFileURL(output).href);
    if (options.javaScriptEnabled !== false) await page.locator('#interactive').waitFor({ state: 'visible' });
    return { page, input, output };
  }
  try {
    await writeFile(join(dir, 'shot.png'), png);
    await t.test('摘要、完整依据、关键问题和未知检查同时保留', async () => {
      const data = compact(fixture()); data.gaps[0].severity = 'P1';
      data.checks.push({ id: 'H1', title: '通过的检查', result: '通过', evidence: '完整通过依据' });
      const { page } = await open(data);
      assert.equal(await page.locator('#sections details[open]').count(), 0);
      assert.equal(await page.locator('#reference-score details').evaluate(el => el.open), false);
      assert.equal(await page.locator('#issues .urgent').isVisible(), true);
      assert.equal(await page.locator('#checks').getByText('未实测', { exact: true }).first().isVisible(), true);
      assert.equal(await page.locator('#checks').getByText('完整通过依据', { exact: true }).isVisible(), false);
      await page.locator('#sections summary').first().focus(); await page.keyboard.press('Enter');
      assert.equal(await page.locator('#sections pre').first().isVisible(), true);
      assert.equal(await page.locator('#sections pre').first().textContent(), data.sections[0].body);
      await page.locator('#complete-report summary').click();
      assert.equal(await page.locator('#complete-report pre').textContent(), data.fullReport);
      await page.locator('#reviews summary').first().click();
      assert.equal(await page.locator('#reviews pre').first().textContent(), data.rawReviews[0].body);
      const embedded = await page.locator('#report-data').textContent();
      assert.deepEqual(JSON.parse(embedded).gaps, data.gaps);
      assert.deepEqual(JSON.parse(embedded).rawReviews, data.rawReviews);
      for (const width of [375, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      }
      await page.locator('#severity').selectOption('P0');
      assert.equal(await page.locator('#issues .issue').count(), 0);
      await page.locator('#reset-filters').click();
      assert.equal(await page.locator('#issues .issue').count(), 1);
      await page.close();
    });
    await t.test('1–3 阶段推荐动态展示，默认仍只要报告', async () => {
      for (const count of [1, 2, 3]) {
        const data = compact(fixture());
        data.stages = Array.from({ length: count }, (_, i) => ({ ...structuredClone(data.stages[0]), id: `stage-${i + 1}`, title: `阶段 ${i + 1}` }));
        const { page } = await open(data);
        const label = await page.locator('#all-mode-label').textContent();
        assert.equal(label, `推荐：一次性执行以上${count === 2 ? '两' : `${count}个`}阶段`);
        assert.equal(await page.locator('input[value=report]').isChecked(), true);
        assert.equal(await page.locator('input[value=all]').isChecked(), false);
        assert.equal(await page.locator('#stage-details').evaluate(el => el.open), true);
        if (count === 2) {
          await page.locator('input[value=all]').check();
          await page.locator('#stage-choices input').last().uncheck();
          let feedback = await page.locator('#feedback-preview').textContent();
          assert.ok(feedback.includes('stage-1 阶段 1'));
          assert.ok(!feedback.includes('stage-2 阶段 2'));
          await page.reload();
          assert.equal(await page.locator('input[value=all]').isChecked(), true);
          assert.ok((await page.locator('#draft-state').textContent()).includes('尚未执行'));
          await page.locator('#stage-choices input').first().uncheck();
          assert.equal(await page.locator('#copy-feedback').isDisabled(), true);
          await page.locator('#clear-draft').click();
          assert.equal(await page.locator('input[value=report]').isChecked(), true);
          assert.equal(await page.locator('#copy-feedback').isDisabled(), false);
          await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw Error('测试拒绝'); } }, configurable: true }));
          await page.locator('#copy-feedback').click();
          await page.locator('#manual-copy').waitFor({ state: 'visible' });
          assert.equal(await page.locator('#manual-copy').inputValue(), await page.locator('#feedback-preview').textContent());
        }
        await page.close();
      }
    });
    await t.test('截图或无阶段时不推荐执行；无摘要旧报告展开全文', async () => {
      for (const screenshot of [true, false]) {
        const data = fixture();
        if (screenshot) Object.assign(data.subject, { inputType: 'screenshot', canOptimize: false, reason: '仅截图，无可写源码' });
        else { data.stages = []; data.gaps[0].stageId = null; }
        const { page } = await open(data);
        assert.equal(await page.locator('#execution-recommendation').isVisible(), false);
        assert.equal(await page.locator('input[value=all]').isDisabled(), true);
        assert.equal(await page.locator('input[value=staged]').isDisabled(), true);
        assert.equal(await page.locator('#sections details[open]').count(), data.sections.length);
        assert.ok((await page.locator('#decision-description').textContent()).includes(screenshot ? data.subject.reason : '没有可执行阶段'));
        await page.close();
      }
    });
    await t.test('对照失败条件、退步、无效比较与未知核验默认可见', async () => {
      const data = compact(comparisonFixture());
      Object.assign(data.pairResults[0], { result: '旧版更好', confidence: '高', attributed: true, judgment: '真退步（建议回退）', evidence: '退步证据' });
      Object.assign(data.pairResults[1], { result: '无效', judgment: '无效（仅参考）', evidence: '无效证据' });
      data.scores.before.A = [1, 4]; data.scores.after.B = [null];
      const { page } = await open(data);
      for (const [selector, text] of [['#goal', '缺图'], ['#pair-results', '退步证据'], ['#pair-results', '无效证据'], ['#issues', '没有展开态截图']]) {
        assert.equal(await page.locator(selector).getByText(text, { exact: true }).first().isVisible(), true);
      }
      assert.equal(await page.locator('#stage-details').evaluate(el => el.open), false);
      assert.equal(await page.locator('#mode-options').isVisible(), false);
      assert.equal(await page.locator('#execution-recommendation').isVisible(), false);
      const notes = await page.locator('#score-notes').textContent();
      assert.ok(notes.includes('评分不稳定')); assert.ok(notes.includes('无法判定'));
      assert.ok((await page.locator('#verification').textContent()).includes('解决率 无法计算'));
      const embedded = JSON.parse(await page.locator('#report-data').textContent());
      assert.deepEqual(embedded.pairResults, data.pairResults);
      assert.deepEqual(embedded.verification, data.verification);
      await page.close();
    });
    await t.test('禁用脚本仍可直接阅读完整报告', async () => {
      const data = compact(fixture());
      const { page } = await open(data, { javaScriptEnabled: false });
      assert.equal(await page.locator('#complete-report pre').isVisible(), true);
      assert.equal(await page.locator('#complete-report pre').textContent(), data.fullReport);
      assert.equal(await page.locator('#interactive').isVisible(), false);
      await page.close();
    });
    if (process.env.UED_REPORT_BASELINE) await t.test('同一输入默认篇幅缩短，完整记录不变', async () => {
      for (const data of [compact(fixture()), compact(comparisonFixture())]) {
        const { page, input } = await open(data);
        const baselineOutput = join(dir, `baseline-${sequence}.html`);
        execFileSync(process.execPath, [join(process.env.UED_REPORT_BASELINE, 'scripts/render-report.mjs'), input, baselineOutput]);
        const oldPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        await oldPage.goto(pathToFileURL(baselineOutput).href);
        await oldPage.locator('#interactive').waitFor({ state: 'visible' });
        const oldHeight = await oldPage.evaluate(() => document.documentElement.scrollHeight);
        const newHeight = await page.evaluate(() => document.documentElement.scrollHeight);
        assert.ok(newHeight < oldHeight, `${data.kind}: ${newHeight} 应小于 ${oldHeight}`);
        for (const field of ['sections', 'fullReport', 'rawReviews', 'gaps', 'checks', 'stages', 'scores', 'goal', 'pairResults', 'verification']) {
          const values = await Promise.all([page, oldPage].map(p => p.locator('#report-data').textContent().then(text => JSON.parse(text)[field])));
          assert.deepEqual(values[0], values[1], field);
        }
        t.diagnostic(`${data.kind} 合成夹具默认高度 ${oldHeight} → ${newHeight}px；不是 TC1 实跑或优化效果评分。`);
        if (process.env.UED_REPORT_SCREENSHOT_DIR) await page.screenshot({ path: join(process.env.UED_REPORT_SCREENSHOT_DIR, `${data.kind}.png`), fullPage: true });
        await oldPage.close(); await page.close();
      }
    });
  } finally { await browser.close(); await rm(dir, { recursive: true, force: true }); }
});
