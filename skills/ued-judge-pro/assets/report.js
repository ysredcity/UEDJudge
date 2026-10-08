(() => {
  'use strict';
  const data = JSON.parse(document.getElementById('report-data').textContent);
  const $ = id => document.getElementById(id);
  const node = (tag, text, cls) => {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = String(text);
    if (cls) el.className = cls;
    return el;
  };
  const comparison = data.kind === 'comparison';
  const verification = new Map((data.verification || []).map(v => [v.gapId, v]));
  const stages = new Map(data.stages.map(s => [s.id, s]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const key = `ued-judge-pro:${data.runId}:${data.fingerprint}`;
  let draft = { mode: 'report', stageIds: data.stages.map(s => s.id), notes: '' };
  let stored = true, selectedGap = null, actual = false, layout = 'paired', phase = 'before', toastTimer;
  const pairs = [];
  const afterByKey = new Map(data.screenshots.after.filter(s => s.pairKey).map(s => [s.pairKey, s]));
  const usedAfter = new Set();
  for (const before of data.screenshots.before) {
    const after = before.pairKey ? afterByKey.get(before.pairKey) : undefined;
    if (after) usedAfter.add(after.id);
    pairs.push({ before, after, label: before.label });
  }
  for (const after of data.screenshots.after) if (!usedAfter.has(after.id)) pairs.push({ after, label: `${after.label}（未配对）` });
  let pairIndex = 0;

  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (saved && typeof saved === 'object') {
      if (['report', 'staged', 'all'].includes(saved.mode)) draft.mode = saved.mode;
      if (Array.isArray(saved.stageIds)) draft.stageIds = saved.stageIds.filter(id => stages.has(id));
      if (typeof saved.notes === 'string') draft.notes = saved.notes;
    }
  } catch { stored = false; }
  if (!data.subject.canOptimize || !data.stages.length) draft.mode = 'report';
  function save() {
    if (!stored) return;
    try { localStorage.setItem(key, JSON.stringify(draft)); }
    catch { stored = false; }
  }
  function table(title, headers, rows, numeric = []) {
    const wrap = node('div', undefined, 'table-wrap'), el = node('table');
    el.append(node('caption', title));
    const head = node('thead'), tr = node('tr');
    headers.forEach((h, i) => { const th = node('th', h, numeric.includes(i) ? 'numeric' : ''); th.scope = 'col'; tr.append(th); });
    head.append(tr); el.append(head);
    const body = node('tbody');
    rows.forEach(row => {
      const line = node('tr');
      row.forEach((v, i) => line.append(node('td', v, numeric.includes(i) ? 'numeric' : '')));
      body.append(line);
    });
    el.append(body); wrap.append(el); return wrap;
  }
  function detail(label, content, open = false) {
    const el = node('details'); el.open = open;
    el.append(node('summary', label), content); return el;
  }
  const number = value => value === null ? '无法汇总' : String(value);
  const sample = value => value === null ? '无法判定' : String(value);
  function toast(message) {
    $('toast').textContent = message; $('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4200);
  }

  $('report-kind').textContent = comparison ? '优化前后对照报告' : '交互诊断报告';
  $('subject').textContent = data.subject.name;
  $('run-label').textContent = `${comparison ? 'COMPARISON' : 'DIAGNOSIS'} / ${data.runId}`;
  $('summary').textContent = data.summary;
  for (const text of [`Pro ${data.versions.skill}`, `核心 ${data.versions.core}`, `口径 ${data.versions.rubric}`, `评委：${data.versions.criticModel}`, data.createdAt]) $('metadata').append(node('span', text));
  $('context').textContent = `对象：${data.subject.target}\n输入：${data.subject.inputType}\n可执行优化：${data.subject.canOptimize ? '是' : `否：${data.subject.reason}`}\n\n${data.subject.usagePathway}`;
  $('capture-note').textContent = `评分视口 ${data.capture.viewport.width}×${data.capture.viewport.height} · ${data.capture.truncated ? '截图采样被截断；' : ''}${data.capture.coverageNote}`;
  $('layout-control').hidden = !comparison;
  $('verification-filter').hidden = !comparison;
  pairs.forEach((pair, i) => { const option = node('option', pair.label); option.value = String(i); $('shot-select').append(option); });
  for (const stage of data.stages) { const option = node('option', stage.title); option.value = stage.id; $('stage-filter').append(option); }

  function drawShot(side) {
    const shot = pairs[pairIndex][side], figure = node('div', undefined, 'shot');
    const heading = node('div', undefined, 'shot-heading');
    heading.append(node('span', comparison ? side === 'before' ? '优化前' : '优化后' : '原始页面'), node('span', shot ? `${shot.width}×${shot.height}` : '未提供对应截图'));
    figure.append(heading);
    const scroll = node('div', undefined, 'shot-scroll'); scroll.dataset.phase = side;
    scroll.tabIndex = 0; scroll.setAttribute('role', 'region'); scroll.setAttribute('aria-label', `${side === 'before' ? '原始' : '最终'}截图，可滚动查看`);
    if (!shot) scroll.append(node('p', '没有明确配对的截图。不能把不同状态或区域当作同一证据。', 'missing'));
    else {
      const canvas = node('div', undefined, 'shot-canvas'); canvas.style.setProperty('--shot-width', `${shot.width}px`);
      const image = node('img'); image.src = shot.image; image.alt = shot.label; image.width = shot.width; image.height = shot.height; image.draggable = false;
      canvas.append(image);
      const location = selectedGap?.locations?.[side];
      if (location?.shotId === shot.id && location.rect) {
        const [x, y, w, h] = location.rect, box = node('div', undefined, 'annotation');
        box.style.left = `${x * 100}%`; box.style.top = `${y * 100}%`; box.style.width = `${w * 100}%`; box.style.height = `${h * 100}%`;
        box.setAttribute('aria-hidden', 'true'); canvas.append(box);
        image.addEventListener('load', () => { scroll.scrollTop = Math.max(0, canvas.clientHeight * y - 40); scroll.scrollLeft = Math.max(0, canvas.clientWidth * x - 20); }, { once: true });
      }
      scroll.append(canvas);
    }
    figure.append(scroll); return figure;
  }
  function drawScreens() {
    const screens = $('screens'); screens.replaceChildren();
    screens.classList.toggle('paired', comparison && layout === 'paired'); screens.classList.toggle('actual', actual);
    if (comparison && layout === 'paired') screens.append(drawShot('before'), drawShot('after'));
    else screens.append(drawShot(comparison ? phase : 'before'));
    $('phase-control').hidden = !comparison || layout !== 'single';
    $('side-by-side').setAttribute('aria-pressed', String(layout === 'paired'));
    $('single').setAttribute('aria-pressed', String(layout === 'single'));
    $('zoom').setAttribute('aria-pressed', String(actual)); $('zoom').textContent = actual ? '适应宽度' : '实际尺寸';
    const locations = selectedGap?.locations || {};
    const pair = pairs[pairIndex];
    const shownLocations = ['before', 'after'].filter(s => locations[s] && pair[s]?.id === locations[s].shotId);
    $('location-note').textContent = selectedGap
      ? `差距 ${selectedGap.id}：${shownLocations.length ? shownLocations.some(s => locations[s].rect) ? '标注为已提供的截图证据位置。' : '仅定位到截图，未提供精确坐标。' : '本张截图没有已提供的定位，未推测位置。'} 截图不运行原页面，缩放不代表响应式验证。`
      : '选择问题可定位证据。截图不运行原页面，缩放不代表响应式验证。';
  }
  function chooseGap(gap) {
    selectedGap = gap;
    const location = gap.locations?.before || gap.locations?.after;
    if (location) {
      const index = pairs.findIndex(p => p.before?.id === location.shotId || p.after?.id === location.shotId);
      if (index >= 0) pairIndex = index;
      if (layout === 'single') { phase = gap.locations?.before ? 'before' : 'after'; $('phase-select').value = phase; }
    }
    $('shot-select').value = String(pairIndex); drawScreens();
    for (const button of $('issues').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.gap === gap.id));
    toast(`已选择差距 ${gap.id}${location ? '，查看对应截图' : '，未提供画面定位'}`);
    if (innerWidth < 1180) $('evidence').scrollIntoView({ block: 'start', behavior: reduced.matches ? 'auto' : 'smooth' });
  }
  function filterIssues() {
    const list = data.gaps.filter(g => ($('severity').value === 'all' || g.severity === $('severity').value)
      && ($('confidence').value === 'all' || g.confidence === $('confidence').value)
      && ($('stage-filter').value === 'all' || g.stageId === $('stage-filter').value)
      && (!comparison || $('verified').value === 'all' || verification.get(g.id)?.result === $('verified').value));
    $('issue-count').textContent = `${list.length} / ${data.gaps.length}`;
    $('issues').replaceChildren();
    for (const gap of list) {
      const button = node('button', undefined, 'issue'); button.type = 'button'; button.dataset.gap = gap.id;
      button.setAttribute('aria-pressed', String(selectedGap?.id === gap.id));
      const meta = node('span', undefined, 'issue-meta');
      meta.append(node('span', `差距 ${gap.id}`), node('span', gap.severity, `badge${['P0', 'P1'].includes(gap.severity) ? ' urgent' : ''}`), node('span', `${gap.confidence}置信 · ${gap.dimension}`));
      button.append(meta, node('span', gap.text, 'issue-text'));
      if (comparison) {
        const v = verification.get(gap.id);
        button.append(node('span', v.result, `badge${v.result === '已解决' ? ' solved' : ''}`), node('span', v.evidence, 'issue-evidence'));
      } else button.append(node('span', gap.stageId ? stages.get(gap.stageId).title : '未进入本轮阶段，查看改善边界', 'issue-evidence'));
      button.addEventListener('click', () => chooseGap(gap)); $('issues').append(button);
    }
    if (!list.length) $('issues').append(node('p', data.gaps.length ? '当前筛选没有匹配的问题；可显示全部。' : '本次没有合并差距，仍请阅读检查与改善边界。', 'missing'));
  }
  for (const id of ['severity', 'confidence', 'stage-filter', 'verified']) $(id).addEventListener('change', filterIssues);
  $('reset-filters').addEventListener('click', () => { for (const id of ['severity', 'confidence', 'stage-filter', 'verified']) $(id).value = 'all'; filterIssues(); });
  $('shot-select').addEventListener('change', () => { pairIndex = Number($('shot-select').value); drawScreens(); });
  $('side-by-side').addEventListener('click', () => { layout = 'paired'; drawScreens(); });
  $('single').addEventListener('click', () => { layout = 'single'; drawScreens(); });
  $('phase-select').addEventListener('change', () => { phase = $('phase-select').value; drawScreens(); });
  $('zoom').addEventListener('click', () => { actual = !actual; drawScreens(); });

  if (comparison) {
    const goalRows = conditions => conditions.map(c => [c.title, c.result, c.evidence]);
    const exceptions = data.goal.conditions.filter(c => c.result !== '通过');
    $('goal').append(node('p', `务实目标：${data.goal.result}`, 'goal-result'));
    if (exceptions.length) $('goal').append(table('未通过或无法判定的目标条件', ['条件', '结果', '证据'], goalRows(exceptions)));
    $('goal').append(detail('查看全部四项目标条件', table('务实目标逐条结果', ['条件', '结果', '证据'], goalRows(data.goal.conditions))));
    const solved = data.verification.filter(v => v.result === '已解决').length;
    const unknown = data.verification.filter(v => v.result === '无法判断').length;
    const denominator = data.verification.length - unknown;
    $('verification').append(node('p', `差距核验：已解决 ${solved} / 部分解决 ${data.verification.filter(v => v.result === '部分解决').length} / 未解决 ${data.verification.filter(v => v.result === '未解决').length} / 无法判断 ${unknown}；解决率 ${denominator ? `${Math.round(solved / denominator * 100)}%（按 ${denominator} 条可判定差距计算，不代表全部目标达成）` : '无法计算'}`, 'notice'));
    const pairTable = (title, results) => table(title, ['维度', '结果 / 把握', '指向本轮改动', '判定', '证据'], results.map(p => [data.dimensions[p.dimension], `${p.result} / ${p.confidence}`, p.attributed ? '是' : '否', p.judgment, p.evidence]));
    const judgments = [...new Set(data.pairResults.map(p => p.judgment))];
    $('pair-results').append(node('p', `成对比较：${judgments.map(j => `${j} ${data.pairResults.filter(p => p.judgment === j).length} 项`).join(' / ')}。`, 'notice'));
    const pairExceptions = data.pairResults.filter(p => p.result === '旧版更好' || p.result === '无效');
    if (pairExceptions.length) $('pair-results').append(pairTable('退步与无效比较（不计为改善）', pairExceptions));
    $('pair-results').append(detail('查看六维比较与归因证据', pairTable('成对比较与归因', data.pairResults)));
  }
  if (data.checks.length) {
    const checkTable = (title, checks) => table(title, ['检查', '结果', '证据'], checks.map(c => [`检查 ${c.id} · ${c.title}`, c.result, c.evidence]));
    const exceptions = data.checks.filter(c => !['通过', '不适用'].includes(c.result));
    $('checks').append(node('p', `主控检查 ${data.checks.length} 项：通过 ${data.checks.filter(c => c.result === '通过').length} / 不适用 ${data.checks.filter(c => c.result === '不适用').length} / 其余 ${exceptions.length}（如下逐条保留）。`, 'notice'));
    if (exceptions.length) $('checks').append(checkTable('未通过与无法判定检查', exceptions));
    $('checks').append(detail('查看完整主控检查', checkTable('主控检查（独立于评分）', data.checks)));
  }
  else $('checks').append(node('p', '结构化检查清单为空：检查汇总与无法判定原因见下方完整内容。', 'notice'));
  for (const section of data.sections) {
    const block = node('section', undefined, 'content-block'); block.append(node('h3', section.title));
    if (section.summary) block.append(node('p', section.summary));
    // 旧报告没有人工摘要时，展开原文，避免把风险或授权边界意外隐藏。
    block.append(detail('详细依据', node('pre', section.body), !section.summary)); $('sections').append(block);
  }
  for (const [index, stage] of data.stages.entries()) {
    const block = node('article', undefined, 'stage'), title = node('div', undefined, 'stage-title'), items = node('div');
    title.append(node('p', `STAGE ${String(index + 1).padStart(2, '0')}`, 'eyebrow'), node('h3', stage.title), node('p', stage.status));
    for (const item of stage.items) {
      const line = node('div', undefined, 'stage-item');
      line.append(node('span', `${({ gap: '差距', check: '检查', shortfall: '高置信缺口' })[item.source.type]} ${item.source.id}`), node('p', item.action), node('p', `目标：${item.target}`)); items.append(line);
    }
    block.append(title, items); $('stages').append(block);
  }
  if (!data.stages.length) $('stages').append(node('p', '本次没有可执行阶段；原因见能力边界和完整报告。', 'notice'));
  $('stage-details').open = !comparison;
  $('stage-summary').textContent = comparison ? `本轮 ${data.stages.length} 个阶段的动作、目标与状态` : '阶段动作与可观察目标（执行前阅读）';
  const before = data.scoreDisplay.before, after = data.scoreDisplay.after;
  const rows = Object.keys(data.dimensions).map(k => comparison
    ? [data.dimensions[k], data.scores.before[k].map(sample).join(' / '), number(before.means[k]), sample(data.scores.after[k][0])]
    : [data.dimensions[k], sample(data.scores.before[k][0]), sample(data.scores.before[k][1]), number(before.means[k])]);
  rows.push(comparison ? ['合计 / 24', before.totals.map(number).join(' / '), number(before.total), number(after.total)] : ['合计 / 24', number(before.totals[0]), number(before.totals[1]), number(before.total)]);
  $('scores').append(table('原始样本与参考换算', comparison ? ['维度', '初评双样本', '初评平均', '收尾单样本'] : ['维度', '样本 1', '样本 2', '平均'], rows, [1, 2, 3]));
  $('score-notes').append(node('p', `初评参考 ${number(before.ten)} / 10${comparison ? ` → 收尾参考 ${number(after.ten)} / 10（双样本平均与单样本，不直接定性）` : '（双样本平均）'}`));
  if (before.unstable.length) $('score-notes').append(node('p', `评分不稳定：${before.unstable.map(k => data.dimensions[k]).join('、')}（两样本维度差 ≥2）。`));
  const unknownScores = Object.keys(data.dimensions).filter(k => data.scores.before[k].includes(null) || (comparison && data.scores.after[k].includes(null)));
  if (unknownScores.length) $('score-notes').append(node('p', `存在无法判定的评分：${unknownScores.map(k => data.dimensions[k]).join('、')}；不以零分或通过代替。`));
  data.scores.notes.forEach(n => $('score-notes').append(node('p', n)));
  for (const review of data.rawReviews) {
    const details = node('details', undefined, 'review'); details.append(node('summary', review.label), node('pre', review.body)); $('reviews').append(details);
  }
  $('complete-report').querySelector('details').open = false;

  function feedbackText() {
    const lines = [`UEDJudge Pro 报告 ${data.runId}（内容指纹 ${data.fingerprint}）`, `评估对象：${data.subject.name}`, `目标：${data.subject.target}`];
    if (comparison) lines.push('这是对本次收尾报告的反馈，不自动开始新诊断或回退。');
    else if (draft.mode === 'report') lines.push('我的选择：只要报告，到此为止。');
    else {
      lines.push(`我的选择：${draft.mode === 'staged' ? '逐阶段执行' : '按顺序一次性执行'}。`);
      const chosen = data.stages.filter(s => draft.stageIds.includes(s.id));
      lines.push(`执行范围：${chosen.map(s => `${s.id} ${s.title}`).join('；') || '未选择阶段，请勿执行'}`);
      lines.push('沿用这份诊断的规则、阶段顺序和保真边界；先核对阶段依赖。不超出共用协议的评委调用上限，不新增确认闸门，不修改未授权功能或语义。');
    }
    if (draft.notes.trim()) lines.push(`我的备注：\n${draft.notes.trim()}`);
    return lines.join('\n');
  }
  function updateDecision() {
    document.querySelectorAll('input[name=mode]').forEach(input => { input.checked = input.value === draft.mode; });
    $('stage-options').hidden = comparison || draft.mode === 'report';
    $('stage-choices').querySelectorAll('input').forEach(input => { input.checked = draft.stageIds.includes(input.value); });
    const missing = !comparison && draft.mode !== 'report' && !draft.stageIds.length;
    $('copy-feedback').disabled = missing;
    $('feedback-preview').textContent = feedbackText();
    $('draft-state').textContent = missing ? '请选择至少一个阶段；当前不能复制执行指令。' : stored ? '选择尚未执行。草稿仅保存在当前浏览器，不会上传。' : '浏览器存储不可用：本页仍可使用，关闭后草稿不会保留。';
    $('copy-fallback').hidden = true;
  }
  if (comparison) {
    $('decision-title').textContent = '留下反馈'; $('decision-description').textContent = '复制备注回 Agent 对话，不会自动开始新诊断、应用改动或回退。';
    $('mode-options').hidden = true; $('decision-link').textContent = '留下反馈'; $('copy-feedback').textContent = '复制报告反馈';
  }
  const executable = !comparison && data.subject.canOptimize && data.stages.length > 0;
  if (executable) {
    const count = data.stages.length === 2 ? '两' : String(data.stages.length);
    $('all-mode-label').textContent = `推荐：一次性执行以上${count}${data.stages.length === 2 ? '' : '个'}阶段`;
    $('execution-recommendation').textContent = '推荐按顺序完成全部阶段：逐阶段自检，最后统一复评与核验。也可逐阶段确认或只要报告；推荐不等于选择或授权。若缩小执行范围，以待复制指令中的阶段清单为准。';
    $('execution-recommendation').hidden = false;
  }
  for (const stage of data.stages) {
    const label = node('label'), input = node('input'); input.type = 'checkbox'; input.value = stage.id;
    input.addEventListener('change', () => { draft.stageIds = data.stages.filter(s => s.id === stage.id ? input.checked : draft.stageIds.includes(s.id)).map(s => s.id); save(); updateDecision(); });
    label.append(input, node('span', stage.title)); $('stage-choices').append(label);
  }
  document.querySelectorAll('input[name=mode]').forEach(input => {
    input.disabled = input.value !== 'report' && (!data.subject.canOptimize || !data.stages.length);
    input.addEventListener('change', () => { draft.mode = input.value; save(); updateDecision(); });
  });
  if (!comparison && !data.subject.canOptimize) $('decision-description').textContent = `本次不能执行优化：${data.subject.reason}\n可复制报告选择与备注。`;
  else if (!comparison && !data.stages.length) $('decision-description').textContent = '本次没有可执行阶段；只可复制报告选择与备注。';
  $('notes').value = draft.notes;
  $('notes').addEventListener('input', () => { draft.notes = $('notes').value; save(); updateDecision(); });
  $('clear-draft').addEventListener('click', () => {
    draft = { mode: 'report', stageIds: data.stages.map(s => s.id), notes: '' }; $('notes').value = '';
    try { localStorage.removeItem(key); } catch { stored = false; }
    updateDecision(); toast('已清除本页选择与备注，其他报告草稿不受影响。');
  });
  $('copy-feedback').addEventListener('click', async () => {
    const text = feedbackText();
    try {
      if (!navigator.clipboard?.writeText) throw Error('clipboard unavailable');
      await navigator.clipboard.writeText(text); $('copy-fallback').hidden = true; toast('已复制。请粘贴回 Agent 对话，页面没有执行优化。');
    } catch {
      $('copy-fallback').hidden = false; $('manual-copy').value = text; $('manual-copy').focus(); $('manual-copy').select();
      toast('未复制成功，请手动复制下方文本。');
    }
  });
  filterIssues(); drawScreens(); updateDecision(); $('interactive').hidden = false;
})();
