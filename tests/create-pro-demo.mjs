// 仅验证报告交付：使用现有 TC1 历史摘要/截图，不运行评委，不修改 TC1。
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderReport } from '../skills/ued-judge-pro/scripts/render-report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '_tests/outputs/tc1-test-daily-report/pro-demo');
const pro = join(root, 'skills/ued-judge-pro');
const manifest = JSON.parse(await readFile(join(pro, 'core-manifest.json'), 'utf8'));
const proVersion = (await readFile(join(pro, 'SKILL.md'), 'utf8')).match(/^  version: "([0-9]+\.[0-9]+\.[0-9]+)"$/m)?.[1];
if (!proVersion) throw Error('Pro 缺少合法 metadata.version');
const deliveryNote = `本次报告交付工具为 Pro ${proVersion} / core ${manifest.coreVersion}；这不是历史评审所用版本，不代表用新规则重评。`;
const original = await readFile(join(root, '_tests/outputs/tc1-test-daily-report/REPORT-v3run.md'), 'utf8');
const disclaimer = '历史 TC1 材料的报告展示测试（2026-10-05，评分口径 v3），未用最新规则重新诊断或优化；原始评委全文未保存，以下摘录来自试跑记录，不伪装为原始评语。';
const shotSet = (prefix, side) => Array.from({ length: 4 }, (_, i) => ({
  id: `${side}-${i}`, role: i ? 'slice' : 'overview', label: i ? `切片 ${i}` : '整页总览', pairKey: i ? `slice-${i}` : 'overview',
  path: join(root, `.ued-judge/run-v3/shots/${prefix}-${i}.png`),
}));
const beforeScores = { A: [3, 3], B: [3, 3], C: [3, 2], D: [2, 2], E: [2, 2], F: [4, 4] };
const diagnostic = {
  schemaVersion: 1, kind: 'diagnosis', runId: 'tc1-history-demo-20261007', createdAt: '2026-10-07T00:00:00Z',
  subject: { name: 'TC1 · 测试日报看板', target: '_tests/cases/tc1-test-daily-report/index.html（历史快照）', inputType: 'html', canOptimize: false, reason: '本页是历史报告展示测试，不是新一轮已授权优化。', usagePathway: '界面类型：任务型工具\n用户：测试负责人\n场景：日常核查和日报整理\n核心任务：查看未回归需求和风险、整理日报\n关键路径：配置 → 查看指标与清单 → 核查风险 → 整理日报\n（展示用描述；历史冻结使用途径全文未保存，不用于新评分）' },
  versions: { skill: proVersion, core: manifest.coreVersion, rubric: 'v3（历史试跑）', verifier: 'v1', criticModel: 'general-task-execution；历史模型未能显式锁定' },
  capture: { viewport: { width: 1440, height: 900 }, truncated: false, coverageNote: '现有历史总览及 3 张切片；此处不代替新诊断' },
  summary: `${disclaimer}\n原试跑初评平均 16.5/24（6.9/10），五条合并差距全部高置信。`,
  screenshots: { before: shotSet('shot-40', 'before'), after: [] },
  scores: { before: beforeScores, notes: [disclaimer, deliveryNote, '缺失原始逐项评语，不编造勾选表。总分不代表最新 skill 的效果。'] },
  gaps: [
    { id: 'G1', text: '凭证常驻展开', dimension: 'B · P1/P2', severity: 'P1', confidence: '高', stageId: 'stage-1', locations: { before: { shotId: 'before-1' } } },
    { id: 'G2', text: '配置标签语义不清', dimension: 'F · P1 / B · P2', severity: 'P1', confidence: '高', stageId: null, locations: { before: { shotId: 'before-1' } } },
    { id: 'G3', text: '六卡同权重多色、融回 0 用红', dimension: 'A/C · P2', severity: 'P2', confidence: '高', stageId: 'stage-1', locations: { before: { shotId: 'before-1' } } },
    { id: 'G4', text: '日报框固定高度截断', dimension: 'D · P2', severity: 'P2', confidence: '高', stageId: 'stage-2', locations: { before: { shotId: 'before-3' } } },
    { id: 'G5', text: '竖条 + emoji 混用 + 网格纹理', dimension: 'E · P3', severity: 'P3', confidence: '高', stageId: 'stage-2', locations: { before: { shotId: 'before-0' } } },
  ],
  checks: [
    { id: 'H1', title: '辅助文字对比度', result: '不通过', evidence: '历史记录：4.16:1。未在本轮重测。' },
    { id: 'H6', title: 'label 关联', result: '不通过', evidence: '历史记录：label 未关联。' },
    { id: 'H10', title: '移动端溢出', result: '不通过', evidence: '历史记录：375 视口溢出 17px。展示截图本身不能验证此项。' },
    { id: 'G1', title: '控件几何对齐', result: '不通过', evidence: '历史记录：375 视口相差 18px；与差距 G1 不同命名空间。' },
    { id: 'M', title: '动效', result: '无法判定', evidence: '该历史记录没有动效实测结果。' },
  ],
  stages: [
    { id: 'stage-1', title: '结构与任务焦点', status: '历史方案，展示用', items: [{ source: { type: 'gap', id: 'G1' }, action: '配置收为状态条，9 字段保留在展开区域。', target: '默认态突出核查任务，原配置仍可访问。' }, { source: { type: 'gap', id: 'G3' }, action: '核心指标唯一焦点，其他指标降低权重。', target: '指标主次可见，风险色不用于中性零值。' }] },
    { id: 'stage-2', title: '视觉系统与可读性', status: '历史方案，展示用', items: [{ source: { type: 'gap', id: 'G4' }, action: '取消日报框固定高度。', target: '正文不被固定高度截断。' }, { source: { type: 'gap', id: 'G5' }, action: '清理装饰，统一 UI 图标；保留日报正文符号。', target: '视觉一致，不改正文意图。' }, { source: { type: 'check', id: 'H1' }, action: '提高辅助文字对比度。', target: '辅助文字达到适用阈值。' }] },
    { id: 'stage-3', title: '合规与响应式', status: '历史方案，展示用', items: [{ source: { type: 'check', id: 'H6' }, action: '关联 label 与控件 id。', target: '输入框有明确可访问名。' }, { source: { type: 'check', id: 'H10' }, action: '表格局部横滚，窄屏单列。', target: '页面不产生整体横向溢出。' }] },
  ],
  sections: [
    { id: 'critic', title: '评论员结论与高置信缺口', body: '历史记录：A1 B3 C3 D2 D4 E2 E3。审美方向、顶尖设想的原始全文未保存，无法补写；合并差距摘录照实展示。' },
    { id: 'checks', title: '检查汇总与认知负荷', body: '历史记录：H1/H6/H7/H5/H8/H10、G1、A1/A6 不通过；L1/L2/L4/L5 高负荷。H9 复制无反馈因原页无脚本，列入需功能授权。W/M 未保存独立验证结果。' },
    { id: 'protection', title: '视觉保护清单', body: '原评委保护清单全文未保存，不虚构优点。' },
    { id: 'fidelity', title: '功能与文案保真', body: '历史执行保留 9 个配置字段、16 行及原文本。诊断时的完整保真清单未保存，核验范围见完整历史记录。' },
    { id: 'limits', title: '可改善边界', body: 'G2 业务含义无法确认，不猜改；复制功能属于另行授权。历史试跑曾将 G2 纳入成败核验，后续规则已修正，本展示不回填历史结论。' },
    { id: 'data', title: '数据核对提示 · 不计分', body: '该历史摘要未列独立数据核对提示；不从页面数据自行补评或扣分。' },
    { id: 'stages', title: '阶段说明', body: '三阶段取自现有试跑记录，属于历史方案展示，不授权任何新的页面修改。' },
  ],
  fullReport: `${disclaimer}\n\n${original}`,
  rawReviews: [
    { label: '初评样本 1 · 历史摘要，原始全文不可用', body: '试跑记录摘录：17/24（A3 B3 C3 D2 E2 F4）。原始逐项判定全文未保存，不能以摘要代替真实完整样本。' },
    { label: '初评样本 2 · 历史摘要，原始全文不可用', body: '试跑记录摘录：16/24（A3 B3 C2 D2 E2 F4）。原始逐项判定全文未保存，不能以摘要代替真实完整样本。' },
  ],
};
const comparison = structuredClone(diagnostic);
comparison.kind = 'comparison';
comparison.summary = `${disclaimer}\n历史结论：务实目标未达成（G2 无法判断）；4 条差距已解决，成对比较没有退步。`;
comparison.screenshots.after = shotSet('shot-41', 'after');
comparison.scores.after = { A: [4], B: [4], C: [3], D: [4], E: [4], F: [4] };
comparison.verification = comparison.gaps.map(g => ({ gapId: g.id, result: g.id === 'G2' ? '无法判断' : '已解决', evidence: g.id === 'G2' ? '历史核验：字段在折叠区，未提供展开态；不自动算作已解决。' : '历史核验摘要判定已解决；原始全文不可用。' }));
comparison.gaps.forEach(g => { g.locations.after = { shotId: g.id === 'G4' ? 'after-3' : g.id === 'G5' ? 'after-0' : 'after-1' }; });
comparison.goal = { result: '未达成', conditions: [
  { title: '初评 P0/P1 差距全部解决（历史口径）', result: '不通过', evidence: '历史结论：G2 无法判断；不按新规则回填。' },
  { title: '成对比较无维度真退步', result: '通过', evidence: '历史记录：没有维度退步；A/B 对调描述已按内容还原。' },
  { title: '收尾无 P0/P1，且各维度 ≥3', result: '通过', evidence: '历史收尾 23/24，六维均 ≥3。' },
  { title: '功能与文案保真', result: '通过', evidence: '历史回归：16 行与控件值不变，原文本缺失 0。' },
] };
comparison.pairResults = Object.entries({ A: ['新版更好', '高'], B: ['新版更好', '高'], C: ['新版更好', '低'], D: ['持平', '—'], E: ['新版更好', '低'], F: ['新版更好', '高'] }).map(([dimension, [result, confidence]]) => ({ dimension, result, confidence, attributed: result !== '持平', judgment: result === '持平' ? '持平' : confidence === '高' ? '真实改进' : '倾向改进', evidence: '历史试跑摘要：按方案描述还原标签；原始比较全文未保存，不补写细节。' }));
comparison.sections = [
  { id: 'goal', title: '务实目标与历史边界', body: '历史结论未达成，原记录待确认；G2 归属不按最新规则回填。Pro 只展示，不重新评分或验收。' },
  { id: 'verification', title: '核验与新问题', body: '4/5 已解决，1 条无法判断。历史新问题：指标条分隔线未到底，次级标签约 3px 偏差（P3）。' },
  { id: 'pair', title: '成对比较说明', body: '历史分配新=B，评论员描述对调；主控按描述内容还原。新版 A/B/F 更好（高），C/E 更好（低），D 持平。' },
  ...diagnostic.sections.filter(s => ['fidelity', 'protection', 'limits'].includes(s.id)),
  { id: 'checks', title: '检查前后变化', body: '历史回归：辅助文字 ≥5.7:1；label 全关联；1440/1024/768/375 无溢出；G1 0 偏差。上方检查表保留原始失败作为基线，不将历史证据伪装成本轮实测。' },
  { id: 'remaining', title: '剩余差距', body: 'G2 无法判断。收尾新差距：琥珀徽标铺满、空列与风险需自找、风险卡靠后、日报可编辑性不明显；这些不是初评 G 编号，未擅自加入原核验清单。' },
  { id: 'motion', title: 'Web 与动效验证', body: '该历史记录没有完整 W/M 实测记录，本轮无法判定。' },
  { id: 'changes', title: '阶段完成情况', body: '历史三阶段已执行，配置/指标结构、视觉可读性与合规响应式；本轮未再次执行。' },
  { id: 'scoreNotes', title: '评分轨迹 · 仅参考', body: '16.5/24 → 23/24（双样本平均与单样本）。高分仍列多个 P2，历史报告已记录口径偏宽松。不能据总分相减宣称改进。' },
];
comparison.stages.forEach(s => { s.status = '历史已完成，未再次执行'; });
comparison.rawReviews.push(
  { label: '核验 · 历史摘要，原始全文不可用', body: 'G1/G3/G4/G5 已解决；G2 无法判断。原始核验全文未保存，证据见完整历史记录。' },
  { label: '成对比较 · 历史摘要，原始全文不可用', body: '新=B；描述对调，主控按内容还原。A/B/F 高把握更好，C/E 低把握更好，D 持平。' },
  { label: '收尾绝对评分 · 历史摘要，原始全文不可用', body: '23/24（A4 B4 C3 D4 E4 F4），9.6/10；仍存在多个 P2。原始逐项全文未保存。' },
);
const interaction = structuredClone(diagnostic);
interaction.runId = 'ui-controls-fixture-20261007';
interaction.subject.name = 'Pro 交互测试夹具（非评审）';
interaction.subject.target = '报告控件测试，无被评估页面';
interaction.subject.canOptimize = true;
delete interaction.subject.reason;
interaction.summary = '仅用于验证阶段选择、备注和复制功能。截图与阶段是历史测试素材；控件可选不代表授权修改真实页面。没有运行评委。';
interaction.scores.before = Object.fromEntries('ABCDEF'.split('').map(d => [d, [null, null]]));
interaction.scores.notes = ['交互测试没有评分，空缺不补零。'];
interaction.fullReport = '非评审测试夹具：仅验证控件。没有分数、优化授权或新的评审结论。';
interaction.rawReviews = [{ label: '测试槽位 1 · 未运行评委', body: '无原始评语。' }, { label: '测试槽位 2 · 未运行评委', body: '无原始评语。' }];
interaction.gaps[0].text = '合成定位框（仅测试交互，不是评审证据）';
interaction.gaps[0].locations.before.rect = [0.04, 0.05, 0.7, 0.09];
await mkdir(out, { recursive: true });
for (const [name, report] of [['diagnosis', diagnostic], ['comparison', comparison], ['interaction', interaction]]) {
  const input = join(out, `${name}.json`), output = join(out, `${name}.html`);
  await writeFile(input, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(await renderReport(input, output, { force: process.argv.includes('--force') })));
}
