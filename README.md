# UEDJudge —— UED 评价师

**UED 评价师（UEDJudge）** 是一个给 AI agent 消费的 skill：对**已开发完成**的 Web 系统、网页做用户体验诊断，并按需分阶段优化。

## 工作方式

```
诊断（评论员盲评 + 硬性检查） → 诊断报告 + 1–3 个改进阶段 → 你来选择
                                                        ├─ 只要报告
                                                        ├─ 逐阶段执行（每阶段后复评，动态调整）
                                                        └─ 一次性执行（最后统一复评）
```

- **评论员盲评**：在全新隔离上下文中唤起子智能体，只给它截图和一段中性的使用途径描述，输出审美方向、顶尖工作室水准设想、最多 5 条差距、优点和 6 个维度的 0–4 分锚定评分。评分规则完整写在冻结 prompt 中，每次逐字复用。
- **硬性检查**：主控独立检查合规项、控件几何对齐、可机检反模式与认知负荷，补足截图盲评容易漏掉的问题。
- **应对评分波动**：复评时逐维度对照分数与本轮改动做归因；总分只作参考，收尾用两次独立盲评定分。不同评分版本的历史分数不直接比较。
- **成本可预估**：评论员调用只要报告 1 次、一次性执行 3 次、逐阶段执行最多 5 次。
- **人工把关**：报告输出后停下等你选择，选择前不改任何文件。
- **保留功能与原意**：UI 优化最大程度保留原有功能和描述；文案仅在不改变原意时调整。优化前建立保真清单，优化后回归核验；功能删减或语义变化须单独授权。
- **区分数据与界面**：v2.2 将业务数据本身及归因不明的问题列为核对提示，不计分；界面文案、可读性与呈现缺陷仍评价。必要的摘要、详情与导出重复不一概扣分，不通过修改原始数据冲高分。
- **补足执行方法**：按需读取视觉、微动效与通用 Web 参考；主控建立视觉契约并验证交互时序、输入保护、恢复与布局韧性。运行规则在本地，无需安装外部 skill 或联网；W/M 结果不并入审美评分，执行参考不另行改变冻结评分口径。

## 目录结构

```
UEDJudge/
├── README.md / CHANGELOG.md / CONTRIBUTING.md
├── PROJECT_CONTEXT.md            # 跨会话上下文台账
├── AGENTS.md                     # 给不支持 skill 的工具的消费指引
├── .kiro/steering/context-management.md
├── docs/                         # 方案 / 决策记录
├── _tests/                       # 测试案例集（不入 Git）
│   ├── cases/                    # 待评估对象
│   └── outputs/                  # 评估与优化产出
└── skills/ued-judge/
    ├── SKILL.md                  # 入口：铁律 + 流程速览 + 索引
    └── references/
        ├── critic-protocol.md    # 完整流程（唯一事实源）
        ├── critic-prompt.md      # 冻结的评论员 prompt
        ├── hard-checks.md        # 硬性检查 H1–H12
        ├── glossary.md           # 问题标签与 AI 感套路
        ├── report-template.md    # 三种报告模板
        ├── visual-optimization.md # 视觉执行方法
        ├── motion-optimization.md # 微动效与 M 组验证
        └── web-interface-quality.md # 通用 Web 与 W 组检查
```

## 快速开始

把 `skills/ued-judge/SKILL.md` 交给支持 skill 的 agent，然后说「评估一下这个页面：<URL 或文件路径>」。

- 截图推荐用 Playwright（`npx playwright screenshot`），首次需安装 Chromium；没有截图能力时 agent 会请你手动提供截图。
- 评论员需要 agent 支持创建独立子智能体（Kiro 中为 `invoke_sub_agent`）。

## 相关文档

- [CONTRIBUTING.md](./CONTRIBUTING.md) · [CHANGELOG.md](./CHANGELOG.md) · [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)
- [SKILL.md](./skills/ued-judge/SKILL.md) · [critic-protocol.md](./skills/ued-judge/references/critic-protocol.md)
