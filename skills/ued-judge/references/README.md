# references —— UEDJudge 评审规范（单一事实源）

`SKILL.md` 只做入口与铁律，流程与规则以本目录为准。

| 文档 | 用途 |
|---|---|
| `critic-protocol.md` | 全流程（诊断 → 分阶段 → 人工确认 → 执行 → 复评 → 收尾）、角色、分数变化判定、隔离规则、成本上限 |
| `critic-prompt.md` | 冻结的评论员 prompt（v2：6 维度 × 0–4 分锚定）、分数换算、来源说明；改动即改变评分口径 |
| `hard-checks.md` | 主控独立执行的硬性检查：H 组合规、A 组可机检反模式、L 组认知负荷计数 |
| `glossary.md` | 问题标签与层级、评论员维度对应、界面类型口径、AI 感套路与常见通病（仅主控使用，不给评论员） |
| `report-template.md` | 诊断报告、阶段复评简报、收尾报告模板 |

改动顺序见根目录 [CONTRIBUTING.md](../../../CONTRIBUTING.md)。修改 `critic-prompt.md` 属于重大决策，须在 `PROJECT_CONTEXT.md` 记录原因。

评论员所需的评分维度、分档锚定与界面类型口径均写在 `critic-prompt.md` 的冻结正文中；运行时无需外部地址或其他技能。来源说明见该文件。
