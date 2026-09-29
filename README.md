# UEDJudge —— UED 评价师

**UED 评价师（UEDJudge）** 是一个给 AI agent 消费的 skill：对**已开发完成**的 Web 系统、网页做用户体验诊断，并按需分阶段优化。

## 工作方式

```
诊断（评论员盲评 + 硬性检查） → 诊断报告 + 1–3 个改进阶段 → 你来选择
                                                        ├─ 只要报告
                                                        ├─ 逐阶段执行（每阶段后复评，动态调整）
                                                        └─ 一次性执行（最后统一复评）
```

- **评论员盲评**：在全新隔离上下文中唤起子智能体，只给它截图和一段中性的使用途径描述，输出审美方向、顶尖工作室水准设想、最多 5 条差距清单和 10 分制评分。每次使用逐字相同的冻结 prompt，保证评分口径一致。
- **硬性检查**：主控独立检查对比度、焦点、键盘、可访问名、敏感信息展示等 12 项可量化指标，补足美学盲评容易漏掉的合规项。
- **成本可预估**：评论员调用只要报告 1 次、一次性执行 2 次、逐阶段执行最多 4 次。
- **人工把关**：报告输出后停下等你选择，选择前不改任何文件。

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
        └── report-template.md    # 三种报告模板
```

## 快速开始

把 `skills/ued-judge/SKILL.md` 交给支持 skill 的 agent，然后说「评估一下这个页面：<URL 或文件路径>」。

- 截图推荐用 Playwright（`npx playwright screenshot`），首次需安装 Chromium；没有截图能力时 agent 会请你手动提供截图。
- 评论员需要 agent 支持创建独立子智能体（Kiro 中为 `invoke_sub_agent`）。

## 相关文档

- [CONTRIBUTING.md](./CONTRIBUTING.md) · [CHANGELOG.md](./CHANGELOG.md) · [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)
- [SKILL.md](./skills/ued-judge/SKILL.md) · [critic-protocol.md](./skills/ued-judge/references/critic-protocol.md)
