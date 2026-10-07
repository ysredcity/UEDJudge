// 数据投影校验，不重评分、不自动修正评委判定。
export const DIMENSIONS = Object.freeze({ A: '构图与视觉层级', B: '信息组织与认知负荷', C: '色彩与语义', D: '字体与数据排版', E: '一致性与去模板化', F: '任务效率与状态可见性' });
const fail = message => { throw Error(`报告数据：${message}`); };
const object = (value, path) => { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${path} 应为对象`); };
const text = (value, path) => { if (typeof value !== 'string' || !value.trim()) fail(`${path} 必须有真实文字；无/无法判定也须说明`); };
const array = (value, path) => { if (!Array.isArray(value)) fail(`${path} 应为数组`); };
const enumeration = (value, options, path) => { if (!options.includes(value)) fail(`${path} 不合法：${value}`); };
const boolean = (value, path) => { if (typeof value !== 'boolean') fail(`${path} 应为布尔`); };
const unique = (values, path) => { if (new Set(values).size !== values.length) fail(`${path} 有重复 ID`); };
const id = (value, path) => { text(value, path); if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value)) fail(`${path} 只能使用中性字母、数字、点、下划线和连字符`); };

export function scoreSummary(scores) {
  const dimensions = Object.keys(DIMENSIONS);
  const samples = scores.A.length;
  const means = Object.fromEntries(dimensions.map(key => [key, scores[key].includes(null) ? null : scores[key].reduce((a, b) => a + b, 0) / samples]));
  const totals = Array.from({ length: samples }, (_, n) => dimensions.some(key => scores[key][n] === null) ? null : dimensions.reduce((sum, key) => sum + scores[key][n], 0));
  const total = totals.includes(null) ? null : totals.reduce((a, b) => a + b, 0) / samples;
  return { means, totals, total, ten: total === null ? null : Math.round(total / 24 * 100) / 10, unstable: dimensions.filter(key => samples === 2 && !scores[key].includes(null) && Math.abs(scores[key][0] - scores[key][1]) >= 2) };
}

export function validateReport(data) {
  object(data, '根');
  if (data.schemaVersion !== 1) fail('仅支持 schemaVersion 1');
  enumeration(data.kind, ['diagnosis', 'comparison'], 'kind');
  id(data.runId, 'runId'); text(data.createdAt, 'createdAt');
  if (!/^\d{4}-\d\d-\d\dT/.test(data.createdAt) || !Number.isFinite(Date.parse(data.createdAt))) fail('createdAt 应为 ISO 时间');
  object(data.subject, 'subject');
  for (const key of ['name', 'target', 'usagePathway']) text(data.subject[key], `subject.${key}`);
  enumeration(data.subject.inputType, ['url', 'html', 'project', 'screenshot'], 'subject.inputType');
  boolean(data.subject.canOptimize, 'subject.canOptimize');
  if (!data.subject.canOptimize) text(data.subject.reason, 'subject.reason');
  if (data.subject.inputType === 'screenshot' && data.subject.canOptimize) fail('仅截图不可执行优化');
  object(data.versions, 'versions');
  for (const key of ['skill', 'core', 'rubric', 'verifier', 'criticModel']) text(data.versions[key], `versions.${key}`);
  object(data.capture, 'capture'); object(data.capture.viewport, 'capture.viewport');
  if (data.capture.viewport.width !== 1440 || data.capture.viewport.height !== 900) fail('评分截图视口须沿用 1440×900');
  boolean(data.capture.truncated, 'capture.truncated'); text(data.capture.coverageNote, 'capture.coverageNote');
  text(data.summary, 'summary'); text(data.fullReport, 'fullReport');
  object(data.screenshots, 'screenshots');
  const shotIds = { before: new Set(), after: new Set() }, allIds = [];
  for (const phase of ['before', 'after']) {
    array(data.screenshots[phase], `screenshots.${phase}`);
    const pairKeys = [];
    for (const shot of data.screenshots[phase]) {
      object(shot, '截图'); id(shot.id, '截图 id'); text(shot.label, '截图 label'); text(shot.path, '截图 path');
      enumeration(shot.role, ['overview', 'slice', 'state'], '截图 role');
      if (shot.pairKey !== undefined) { id(shot.pairKey, '截图 pairKey'); pairKeys.push(shot.pairKey); }
      if (shot.top !== undefined && (!Number.isFinite(shot.top) || shot.top < 0)) fail('截图 top 应为非负数');
      shotIds[phase].add(shot.id); allIds.push(shot.id);
    }
    unique(pairKeys, `${phase} pairKey`);
  }
  unique(allIds, '截图');
  if (!shotIds.before.size) fail('缺少原始截图');
  if (data.kind === 'diagnosis' && shotIds.after.size) fail('诊断阶段不得提前加入改版截图');
  if (data.kind === 'comparison' && !shotIds.after.size) fail('对照缺少最终截图');
  object(data.scores, 'scores');
  for (const phase of data.kind === 'comparison' ? ['before', 'after'] : ['before']) {
    object(data.scores[phase], `scores.${phase}`);
    for (const key of Object.keys(DIMENSIONS)) {
      const scores = data.scores[phase][key]; array(scores, `scores.${phase}.${key}`);
      if (scores.length !== (phase === 'before' ? 2 : 1)) fail(`${phase} 样本数错误`);
      if (scores.some(n => n !== null && (!Number.isInteger(n) || n < 0 || n > 4))) fail(`${phase}.${key} 应为 0–4 整数或 null`);
    }
  }
  array(data.scores.notes, 'scores.notes');
  if (!data.scores.notes.length) fail('须声明评分仅参考');
  data.scores.notes.forEach(n => text(n, 'scores.notes'));
  array(data.gaps, 'gaps'); array(data.checks, 'checks'); array(data.stages, 'stages');
  if (data.stages.length > 3) fail('不得新增第 4 个阶段');
  const gapIds = new Set(data.gaps.map(g => g.id)), checkIds = new Set(data.checks.map(c => c.id)), stageIds = new Set(data.stages.map(s => s.id));
  unique(data.gaps.map(g => g.id), '差距'); unique(data.checks.map(c => c.id), '检查'); unique(data.stages.map(s => s.id), '阶段');
  for (const gap of data.gaps) {
    id(gap.id, 'gap.id'); text(gap.text, 'gap.text'); text(gap.dimension, 'gap.dimension');
    enumeration(gap.severity, ['P0', 'P1', 'P2', 'P3'], 'gap.severity'); enumeration(gap.confidence, ['高', '低'], 'gap.confidence');
    if (gap.stageId !== null && !stageIds.has(gap.stageId)) fail(`${gap.id} 阶段引用不存在`);
    if (gap.locations !== undefined) {
      object(gap.locations, 'gap.locations');
      for (const [phase, location] of Object.entries(gap.locations)) {
        enumeration(phase, ['before', 'after'], '定位侧'); object(location, 'location');
        if (!shotIds[phase].has(location.shotId)) fail(`${gap.id} 定位截图不存在`);
        if (location.rect !== undefined) {
          const r = location.rect; array(r, 'rect');
          if (r.length !== 4 || r.some(n => !Number.isFinite(n) || n < 0 || n > 1) || r[2] === 0 || r[3] === 0 || r[0] + r[2] > 1.000001 || r[1] + r[3] > 1.000001) fail('rect 超出 PNG 范围');
        }
      }
    }
  }
  for (const check of data.checks) {
    id(check.id, 'check.id'); text(check.title, 'check.title'); text(check.evidence, 'check.evidence');
    enumeration(check.result, ['通过', '不通过', '无法判定', '不适用'], 'check.result');
  }
  for (const stage of data.stages) {
    id(stage.id, 'stage.id'); text(stage.title, 'stage.title'); text(stage.status, 'stage.status'); array(stage.items, 'stage.items');
    if (!stage.items.length) fail(`${stage.id} 不得为空阶段`);
    for (const item of stage.items) {
      object(item.source, 'stage.source'); enumeration(item.source.type, ['gap', 'check', 'shortfall'], 'source.type'); id(item.source.id, 'source.id');
      if (item.source.type === 'gap' && !gapIds.has(item.source.id) || item.source.type === 'check' && !checkIds.has(item.source.id)) fail('阶段问题引用不存在');
      if (item.source.type === 'shortfall' && !/^[A-F][1-4]$/.test(item.source.id)) fail('高置信缺口项号应为 A1–F4');
      text(item.action, 'action'); text(item.target, 'target');
    }
  }
  array(data.sections, 'sections');
  const required = data.kind === 'diagnosis' ? ['critic', 'checks', 'protection', 'fidelity', 'limits', 'data', 'stages'] : ['goal', 'verification', 'pair', 'fidelity', 'protection', 'checks', 'remaining', 'limits', 'motion', 'changes', 'scoreNotes'];
  unique(data.sections.map(s => s.id), '内容段落');
  for (const section of data.sections) { id(section.id, 'section.id'); text(section.title, 'section.title'); text(section.body, 'section.body'); }
  for (const section of required) if (!data.sections.some(s => s.id === section)) fail(`缺少报告内容 ${section}`);
  array(data.rawReviews, 'rawReviews');
  if (data.rawReviews.length < (data.kind === 'diagnosis' ? 2 : 3)) fail('原始评语缺失（格式不完整样本也照实保留）');
  for (const review of data.rawReviews) { text(review.label, 'review.label'); text(review.body, 'review.body'); }
  if (data.kind === 'comparison') {
    array(data.verification, 'verification'); unique(data.verification.map(v => v.gapId), '核验');
    for (const item of data.verification) {
      if (!gapIds.has(item.gapId)) fail('核验引用不存在');
      enumeration(item.result, ['已解决', '部分解决', '未解决', '无法判断'], '核验结果'); text(item.evidence, '核验证据');
    }
    if (data.verification.length !== data.gaps.length) fail('核验须覆盖全部初评差距');
    array(data.pairResults, 'pairResults'); unique(data.pairResults.map(p => p.dimension), '成对维度');
    if (data.pairResults.length !== 6) fail('成对比较须保留六维结果');
    for (const pair of data.pairResults) {
      enumeration(pair.dimension, Object.keys(DIMENSIONS), '成对维度');
      enumeration(pair.result, ['新版更好', '旧版更好', '持平', '无效'], '成对结果');
      enumeration(pair.confidence, ['高', '低', '—'], '成对把握'); boolean(pair.attributed, '成对归因'); text(pair.evidence, '成对证据');
      const expected = pair.result === '无效' ? '无效（仅参考）' : pair.result === '持平' ? '持平' : !pair.attributed ? '噪声' : pair.result === '旧版更好' ? '真退步（建议回退）' : pair.confidence === '高' ? '真实改进' : '倾向改进';
      if (pair.judgment !== expected) fail(`${pair.dimension} 判定与共用成对规则不一致，不自动改判`);
      if (['新版更好', '旧版更好'].includes(pair.result) && pair.confidence === '—') fail('偏好结果须记录把握');
    }
    object(data.goal, 'goal'); enumeration(data.goal.result, ['达成', '未达成', '无法判定'], '务实目标'); array(data.goal.conditions, '目标条件');
    if (data.goal.conditions.length !== 4) fail('务实目标须逐条记录四个条件');
    for (const condition of data.goal.conditions) {
      text(condition.title, '条件'); enumeration(condition.result, ['通过', '不通过', '无法判定'], '条件结果'); text(condition.evidence, '条件证据');
    }
    if (data.goal.result === '达成' && data.goal.conditions.some(c => c.result !== '通过')) fail('目标达成与条件不一致，不自动改判');
  }
  return data;
}
