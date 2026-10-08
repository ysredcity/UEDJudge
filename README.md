# UEDJudge —— UED 评价师

**UED 评价师（UEDJudge）** 是一个给 AI agent 消费的 skill：对**已开发完成**的 Web 系统、网页做用户体验诊断，并按需分阶段优化。

普通版当前整体版本：`1.4.2`（以 [SKILL.md](./skills/ued-judge/SKILL.md) 的 `metadata.version` 为准）。

## 选择普通版或 Pro

| | UEDJudge | UEDJudge Pro |
|---|---|---|
| Skill | `ued-judge` | `ued-judge-pro` |
| 评审、优化与调用上限 | 同一套规则 | 同一套规则 |
| 诊断交付 | 对话文字报告 | 本地交互诊断报告＋对话摘要 |
| 优化收尾 | 对话文字报告 | 本地前后对照报告＋对话摘要 |

普通版保持轻量；Pro `1.0.2` 可单独安装，共用核心 `1.4.2` 与冻结评分口径 `v3.1`，不额外评分、不默认生成多套改版。两个 skill 独立版本，Pro 不代表评分标准更高。

Pro 报告支持截图定位、问题筛选、阶段选择、备注复制和前后对照。网页的选择只是草稿，需要粘贴回 Agent 才继续执行；依然先诊断、停下、再优化。HTML 离线可浏览，不上传截图/备注；报告可能包含业务信息，分享前请检查。平台不能预览时提供对话摘要和文件，不能安装或缺少隔离评委时仍须明确能力限制。

## 快速安装

### 方式一：让 AI 帮你安装（推荐新手）

复制下面的提示词，发送给 Codex、Manus 等具有联网和文件操作能力的智能体：

```text
请帮我安装 https://github.com/ysredcity/UEDJudge 中的 ued-judge skill。阅读 README，选择适合当前平台的安装方式，完成后验证并告诉我如何使用。如果平台不支持安装，请明确说明。
```

### 方式二：终端安装

先安装 Node.js（包含 npm / npx）和 Git，然后在终端执行：

```bash
npx skills add ysredcity/UEDJudge --skill ued-judge --global
```

需要 Pro 时，将上方提示词中的 skill 名称换为 `ued-judge-pro`，或执行：

```bash
npx skills add ysredcity/UEDJudge --skill ued-judge-pro --global
```

按提示选择你使用的 AI 工具与安装方式。`--global` 表示安装到用户目录，可跨项目使用；只想在当前项目使用时，在项目目录执行并去掉 `--global`。已安装同名 skill 且有本地修改时，先备份再确认替换。

也可以明确指定工具，例如：

```bash
# Kiro CLI
npx skills add ysredcity/UEDJudge --skill ued-judge --global --agent kiro-cli

# Qoder
npx skills add ysredcity/UEDJudge --skill ued-judge --global --agent qoder
```

安装后可用 `npx skills list --global` 查看安装结果；如当前会话尚未识别 skill，重新打开工具或新建会话。命令与工具标识见 [skills CLI 文档](https://github.com/vercel-labs/skills)。这些命令安装的是 GitHub 上的版本，不包含本地尚未推送的改动。

## 工作方式

```
诊断（双评论员盲评 + 硬性检查） → 诊断报告 + 1–3 个改进阶段 → 你来选择
                                                            ├─ 只要报告
                                                            ├─ 逐阶段执行（目标稿 → 改 → 自检 → 成对复评）
                                                            └─ 一次性执行（目标稿 → 全部改完 → 收尾复评）
收尾：核验员逐条核对初评差距 + 成对比较 + 一次绝对评分 → 按务实目标判定
```

- **评论员盲评**：在全新隔离上下文中唤起子智能体，只给截图和一段中性的使用途径描述。初评用两个评论员，输出审美方向、顶尖水准设想、最多 5 条差距、优点，以及由 24 条可观察勾选项计出的 6 维度 0–4 分。两样本取平均，两次都提到的差距标为高置信。
- **截图看得清**：自带脚本截取整页总览 + 1440×900 视口切片，避免长页面被模型压缩后细节看不清。
- **复评用成对比较**：把改前、改后两套截图随机标为 A/B 交给全新评论员逐维度比较，依据指向本轮改动才算真实变化。比两次绝对打分相减稳定。
- **收尾逐条验收**：独立核验员拿初评差距清单，逐条判定改版后「已解决 / 部分解决 / 未解决」。成败按务实目标判定：初评 P0/P1 全部解决、无维度退步、收尾无 P0/P1 且每维度 ≥3、保真核验通过。
- **先定目标再动手**：用户选择执行后，主控先写目标设计稿（目标状态、布局草图、视觉契约），每阶段完成后自己截图逐条自检，再交给评论员。
- **硬性检查**：主控独立检查合规项、控件几何对齐、可机检反模式与认知负荷，补足截图盲评容易漏掉的问题。
- **成本可预估**：子智能体调用只要报告 2 次、一次性执行 5 次、逐阶段执行最多 7 次。
- **人工把关**：报告输出后停下等你选择，选择前不改任何文件。
- **保留功能与原意**：UI 优化最大程度保留原有功能和描述；功能删减或语义变化须单独授权。
- **区分数据与界面**：业务数据本身及归因不明的问题列为核对提示，不计分；界面文案、可读性与呈现缺陷仍评价。报告会列出「可改善上限」，说明哪些问题靠 UI 改不了。
- **补足执行方法**：执行时只读执行约束表与目标稿，视觉、微动效与通用 Web 方法按需查阅。运行规则在本地，无需安装外部 skill 或联网。

## 目录结构

```
UEDJudge/
├── README.md / CHANGELOG.md / CONTRIBUTING.md
├── PROJECT_CONTEXT.md            # 跨会话上下文台账
├── AGENTS.md                     # 给不支持 skill 的工具的消费指引
├── .kiro/steering/context-management.md
├── docs/                         # 方案 / 决策记录
├── releases/                     # 本地版本 ZIP 包（不入 Git）
├── _tests/                       # 测试案例与校准实验（不入 Git）
├── skills/ued-judge/              # 普通版，共用规则维护源
│   ├── SKILL.md                  # 入口：铁律 + 流程速览 + 索引
│   ├── scripts/capture.mjs       # 固定参数截图：总览 + 视口切片
│   └── references/
│       ├── critic-protocol.md    # 完整流程（唯一事实源）
│       ├── critic-prompt.md      # 冻结评论员 prompt（绝对评分 / 成对比较）
│       ├── verifier-prompt.md    # 冻结核验员 prompt
│       ├── hard-checks.md        # 硬性检查 H / G / A / L
│       ├── glossary.md           # 问题标签与 AI 感套路
│       ├── report-template.md    # 三种报告模板
│       ├── execution-constraints.md # 执行约束 X1–X15
│       ├── visual-optimization.md # 视觉执行方法
│       ├── motion-optimization.md # 微动效与 M 组验证
│       └── web-interface-quality.md # 通用 Web 与 W 组检查
└── skills/ued-judge-pro/          # 独立 Pro 交付包
    ├── SKILL.md / core-manifest.json
    ├── agents/openai.yaml
    ├── references/              # 自动同步的共用规则＋Pro 报告协议/数据格式
    ├── scripts/                 # 共用 capture＋数据校验/报告生成器
    └── assets/                  # 固定离线 HTML/CSS/JS 模板
```

## 快速开始

安装后，在支持 skill 的 agent 中选择 `ued-judge`，然后说：

```text
使用 ued-judge 评估这个页面：<URL 或本地 HTML 的绝对路径>。
先输出诊断报告，等我选择后再执行优化。
```

未安装时，也可把本仓库的 `skills/ued-judge/SKILL.md` 及同目录的 `references/`、`scripts/` 一并交给 agent。不要只复制入口文件，否则会缺少评审规则和截图脚本。

使用 Pro：

```text
使用 ued-judge-pro 诊断这个页面：<URL 或本地 HTML 的绝对路径>。
生成交互诊断报告，等我选择后再优化；优化完成后生成前后对照报告。
```

未安装 Pro 时交付完整 `skills/ued-judge-pro/`，包含 assets 和 core-manifest.json；不需要普通版相邻目录。报告默认放在被评估项目的 `.ued-judge/reports/<run-id>/`，输出后会提供文件入口和对话摘要。

### 运行条件

- 评论员与核验员需要 agent 支持创建全新、隔离上下文的独立子智能体（Kiro 中为 `invoke_sub_agent`）。安装成功不代表工具一定具备完整执行能力。
- 自动截图需要 Playwright 包和 Chromium 浏览器；仅执行 `npx playwright install chromium` 不保证截图脚本能找到 Playwright 包。没有截图能力时 agent 会请你手动提供截图。

macOS / Linux 可将截图依赖安装在独立目录，不改被评估项目的依赖：

```bash
npm install --prefix "$HOME/.local/share/ued-judge" playwright
export PLAYWRIGHT_PATH="$HOME/.local/share/ued-judge/node_modules/playwright"
node "$PLAYWRIGHT_PATH/cli.js" install chromium
```

`export` 只对当前终端及从中启动的进程生效；桌面工具未继承此变量时，把 Playwright 包的绝对路径交给 agent，让其在运行截图脚本时设置 `PLAYWRIGHT_PATH`。Windows 用户同样需要安装包和浏览器，并使用对应的 Windows 路径设置环境变量。

## 版本规则

采用 `x.y.z`：`x` 为大版本，`y` 为优化迭代，`z` 为问题修复。例如：后续修复 `1.4.3`，下一次优化迭代 `1.5.0`，大版本 `2.0.0`；提升前一位时，后续位归零。

整体版本与冻结评分正文版本独立：当前整体版本为 `1.4.2`，评分口径仍为 `v3.1`。ZIP 按整体版本命名，例如 `releases/ued-judge-1.4.2.zip`，仅在本地管理；Pro 独立命名为 `releases/ued-judge-pro-1.0.2.zip`。

## 相关文档

- [CONTRIBUTING.md](./CONTRIBUTING.md) · [CHANGELOG.md](./CHANGELOG.md) · [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)
- [SKILL.md](./skills/ued-judge/SKILL.md) · [critic-protocol.md](./skills/ued-judge/references/critic-protocol.md)
