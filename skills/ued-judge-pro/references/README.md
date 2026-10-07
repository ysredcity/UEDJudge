# references —— UEDJudge 评审规范（单一事实源）

`SKILL.md` 只做入口与铁律，流程与规则以本目录为准。

| 文档 | 用途 |
|---|---|
| `critic-protocol.md` | 全流程（诊断 → 分阶段 → 人工确认 → 目标稿 → 执行与自检 → 成对复评 → 收尾核验）、角色、维度判定、务实目标、隔离规则、成本上限 |
| `critic-prompt.md` | 冻结评论员 prompt v3.1：正文 A 绝对评分（24 条可观察勾选项计出 6 维度 0–4 分）、正文 B 成对比较；改动即改变评分口径 |
| `verifier-prompt.md` | 冻结核验员 prompt：收尾时逐条核对初评差距是否解决，不打分 |
| `hard-checks.md` | 主控独立执行的硬性检查：H 组合规、G 组布局几何、A 组可机检反模式、L 组认知负荷 |
| `glossary.md` | 问题标签与层级、评论员维度对应、界面类型口径、AI 感套路与常见通病（仅主控使用） |
| `report-template.md` | 诊断报告、阶段复评简报、收尾报告模板 |
| `execution-constraints.md` | 执行约束 X1–X15、功能/文案保真细则、实测教训附录；执行时与目标稿一起读 |
| `visual-optimization.md` | 主控视觉设计契约与执行方法，视觉优化时按需读取 |
| `motion-optimization.md` | 主控微动效策略与 M1–M5 工程验证，含动效或反馈/过渡改动时读取 |
| `web-interface-quality.md` | 主控通用 Web 规则与 W1–W6 补充检查，检查关键路径及受影响区域 |

截图脚本在同级 `../scripts/capture.mjs`。

改动顺序与「校准集验证」见根目录 [CONTRIBUTING.md](../../../CONTRIBUTING.md)。修改 `critic-prompt.md` 或 `verifier-prompt.md` 属于重大决策，须先校准验证，再在 `PROJECT_CONTEXT.md` 记录原因。

评论员所需的评分规则均写在 `critic-prompt.md` 的冻结正文中；运行时无需外部地址或其他技能。来源说明见该文件。
