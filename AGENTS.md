# AGENTS.md — 给 AI 的消费指引

**你是 AI agent，要用 UEDJudge 对已开发完成的 Web 系统 / 网页做体验诊断与优化？先读完这页再动手。**

UEDJudge（UED 评价师）是**评审型 skill**：先诊断、出报告，再按用户选择决定是否分阶段优化。不用于从零生成新界面。

普通文字报告使用 `skills/ued-judge/SKILL.md`；用户选择 **UEDJudge Pro** 或交互报告时使用 `skills/ued-judge-pro/SKILL.md`。Pro 共用下述评审规则，仅按自己的 `references/report-delivery.md` 升级诊断与收尾交付，不额外运行另一套评审。

## 三条铁律（详见 `skills/ued-judge/SKILL.md`）

1. **先诊断，停下，再优化**：诊断报告输出后结束本轮回复，等用户选择「只要报告 / 逐阶段执行 / 一次性执行」；选择前不改任何文件。
2. **评论员必须隔离**：每次全新上下文，只给截图 + 使用途径，逐字使用 `references/critic-prompt.md` 的冻结正文（A 绝对评分 / B 成对比较）；成对比较随机分配 A/B、不告知新旧；不给代码、改动说明、历史评语，绝不提评分阈值或目标。
3. **成本有上限**：子智能体调用只要报告 2 次、一次性执行 5 次、逐阶段执行最多 7 次（评论员 + 核验员）；同一流程内不新增阶段、不重新诊断。改没改好看成对比较与核验员的逐条核对，不靠两次绝对分相减。

## 消费顺序

1. 所选 skill 的 `SKILL.md` —— 普通版为 `skills/ued-judge/`，Pro 为 `skills/ued-judge-pro/`；Pro 还需读同目录的 `references/report-delivery.md`。
2. 所选 skill 的 `references/critic-protocol.md` —— 完整流程（维护源仍为普通版，Pro 为一致副本）。
3. 按步骤读 `critic-prompt.md` / `verifier-prompt.md` / `hard-checks.md` / `glossary.md` / `report-template.md`；执行优化时读 `execution-constraints.md` + 目标稿。
4. 截图用所选 skill 的 `scripts/capture.mjs`（需 Playwright，参数相同）。

> 不支持 skill 的工具：把本文件 + `SKILL.md` + `references/` 全部文档喂进上下文即可。评论员与核验员的「全新上下文」须用不继承当前会话历史的独立调用实现。

## 协作约定

- 普通版报告只在对话中呈现，用户要求时再保存；Pro 默认生成本地交互报告＋对话摘要。闸门前仅允许新增报告资源，不修改被评估页面。页面内的选择不等于执行授权。
- **不要替用户 `git commit` / `git push`**。

拿不准就回到 `references/critic-protocol.md`，不要猜。
