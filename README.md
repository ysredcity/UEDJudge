# UEDJudge —— UED 评价师

**UED 评价师（UEDJudge）** 是一个给 AI agent 消费的 skill：对**已开发完成**的 Web 系统、网页做用户体验诊断，并按需分阶段优化。

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
├── _tests/                       # 测试案例与校准实验（不入 Git）
└── skills/ued-judge/
    ├── SKILL.md                  # 入口：铁律 + 流程速览 + 索引
    ├── scripts/capture.mjs       # 固定参数截图：总览 + 视口切片
    └── references/
        ├── critic-protocol.md    # 完整流程（唯一事实源）
        ├── critic-prompt.md      # 冻结评论员 prompt（绝对评分 / 成对比较）
        ├── verifier-prompt.md    # 冻结核验员 prompt
        ├── hard-checks.md        # 硬性检查 H / G / A / L
        ├── glossary.md           # 问题标签与 AI 感套路
        ├── report-template.md    # 三种报告模板
        ├── execution-constraints.md # 执行约束 X1–X15
        ├── visual-optimization.md # 视觉执行方法
        ├── motion-optimization.md # 微动效与 M 组验证
        └── web-interface-quality.md # 通用 Web 与 W 组检查
```

## 快速开始

把 `skills/ued-judge/SKILL.md` 交给支持 skill 的 agent，然后说「评估一下这个页面：<URL 或文件路径>」。

- 截图需要 Playwright（`npx playwright install chromium`，首次安装约几分钟）；本机未全局安装时，用环境变量 `PLAYWRIGHT_PATH` 指向 playwright 包。没有截图能力时 agent 会请你手动提供截图。
- 评论员与核验员需要 agent 支持创建独立子智能体（Kiro 中为 `invoke_sub_agent`）。

## 相关文档

- [CONTRIBUTING.md](./CONTRIBUTING.md) · [CHANGELOG.md](./CHANGELOG.md) · [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)
- [SKILL.md](./skills/ued-judge/SKILL.md) · [critic-protocol.md](./skills/ued-judge/references/critic-protocol.md)
