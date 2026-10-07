# UEDJudge Pro Implementation Plan

> 使用当前会话按任务实施。writing-plans 所提及的 superpowers:executing-plans 不在本环境可用，采用同等的逐项验证；按仓库约定不自动 commit / push，不另开用户任务。

**Goal:** 新增可独立安装的 UEDJudge Pro，只升级诊断与收尾报告，保留普通版运行体验。

**Architecture:** `skills/ued-judge/` 保持评审规范唯一维护源；同步脚本生成 Pro 的只读规则副本与 SHA-256 清单，检查模式防止漂移。Pro 将同一份评审数据渲染为本地离线 HTML，额外资产不进入普通版。

**Tech Stack:** Node.js 内置模块、原生 HTML/CSS/JavaScript；沿用现有 Playwright 截图能力，不增加前端依赖。

---

## 已确认设计与边界

- 独立入口 `skills/ued-judge-pro/SKILL.md`，显示名 UEDJudge Pro；Pro 初始版本 1.0.0，共享 core 版本 1.3.0，冻结口径仍为 v3.1 / v1。
- 原版 `skills/ued-judge/` 不修改；Pro 自动生成与原版相同的 references 与 capture.mjs，不依赖相邻安装目录或运行时联网。
- 唯一覆盖：生成报告文件＋对话摘要，文件限定报告资源；优化前的人工闸门、角色隔离与调用上限不变。
- 诊断报告使用原始截图，不提前生成改版草图。前后报告使用现有同参数截图，不加载目标网页或执行业务操作。
- 选择/备注生成指令，用户复制回对话才构成后续请求。页面不调用 Agent、修改目标或自动回退。
- 不更改评分或核验正文，不为报告增加评论员调用。阶段简报沿用普通版，收尾输出对照报告。

## Task 1: 先建立失败测试与计划

**Files:** `tests/pro-report.test.mjs`、本计划。

验证共享文件逐字节一致、报告输入缺失/无效时拒绝生成、派生分数正确、数据不执行脚本、PNG 内嵌、拒绝覆盖、仅复制反馈、脱离普通版仍能生成。

Run: `node --test tests/pro-report.test.mjs`

Expected: 新实现前缺模块而失败；实现后全部通过。

## Task 2: 规则复用与入口

**Files:** `scripts/sync-pro-core.mjs`、`skills/ued-judge-pro/SKILL.md`、`agents/openai.yaml`、`core-manifest.json`、自动生成的 references 和 capture.mjs。

Run: `node scripts/sync-pro-core.mjs --write`

Run: `node scripts/sync-pro-core.mjs --check`

检查脚本不得修改原版；记录源版本和文件哈希，发现漂移/陈旧文件时失败，不静默接受。

## Task 3: 报告协议与生成器

**Files:** Pro `references/report-delivery.md`、`references/report-data.md`、`scripts/report-data.mjs`、`scripts/render-report.mjs`。

输入为结构化投影＋完整文字报告；初评双样本、终评单样本、无法判定与原始输出照实保留。生成器验证并计算展示值，不重评分；读取本地 PNG、内嵌资源、计算内容指纹，以 CSP 和文本渲染隔离输入。

Run: `node skills/ued-judge-pro/scripts/render-report.mjs <report.json> <report.html>`

已有输出默认拒绝覆盖；显式 `--force` 才可覆盖。

## Task 4: 固定报告模板

**Files:** Pro `assets/report.html`、`assets/report.css`、`assets/report.js`。

诊断页：截图定位、严重度/置信度/阶段筛选、完整报告与原始评语、阶段/执行方式选择、备注、复制反馈与失败手工复制。

收尾页：截图配对、并排/单张/实际尺寸、核验状态、成对结果、完整结论和参考评分。未知/缺图必须明显标示，不自动推断位置与核验结果。

原生语义控件、键盘焦点、移动布局、打印与禁用脚本降级；图片不联网、备注不上传，缓存按报告内容指纹隔离。

## Task 5: 文档、回归与交付

**Files:** README、AGENTS、CONTRIBUTING、CHANGELOG、PROJECT_CONTEXT、docs/README。

Run: `node --test tests/pro-report.test.mjs`

Run: `node scripts/sync-pro-core.mjs --check`

Run: `python3 /Users/yangshuo/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/ued-judge-pro`

Run: `git diff --check`

使用 TC1 现有历史结果和截图验证两种报告的展示（明确历史口径，不能标成最新规则重新评审）。检查不同视口、筛选、定位、完整信息、草稿、反馈、实际尺寸和前后切换。将产物存 `_tests/`，不提交测试报告、不改 TC1，不安装全局 skill、不额外运行盲评。最终记录验证范围和限制。

## 完成记录（2026-10-07）

Task 1–5 已实施。6 组自动化测试、12 个共用文件一致性检查、skill 格式/JS 语法及 diff 检查通过；浏览器交互与视口检查范围已记入 `PROJECT_CONTEXT.md`。TC1 历史预览不代表最新规则实跑，合成定位框仅用于交互夹具。跨平台失败降级和真实 Agent 端到端诊断留待后续验证；未安装、打包、提交或推送。
