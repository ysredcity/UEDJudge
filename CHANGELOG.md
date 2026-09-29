# 变更日志（CHANGELOG）

本文件记录 `UEDJudge`（UED 评价师）的重要变更。格式参考 [Keep a Changelog](https://keepachangelog.com/)。

> **本文件写给 skill 使用者**，只写「这个版本多了什么能力、升级后有什么不一样」。过程、根因、验证记录在 `PROJECT_CONTEXT.md`。

---

## [Unreleased]

### Added

- 评审主流程：诊断 → 诊断报告 + 1–3 个改进阶段 → 用户选择（只要报告 / 逐阶段执行 / 一次性执行）→ 复评 → 收尾报告（`references/critic-protocol.md`）。
- 冻结的评论员 prompt：隔离上下文盲评，输出审美方向、顶尖水准设想、最多 5 条差距清单、10 分制评分（`references/critic-prompt.md`）。
- 硬性合规检查 H1–H12，与评论员结论并列呈现（`references/hard-checks.md`）。
- 问题标签与层级、常见 AI 感套路清单（`references/glossary.md`）。
- 诊断报告、阶段复评简报、收尾报告三种模板（`references/report-template.md`）。
- 评论员调用次数硬上限：最多 4 次。
- 仓库治理框架：README、CHANGELOG、CONTRIBUTING、PROJECT_CONTEXT、AGENTS、`.kiro` 上下文管理、`docs/`、`_tests/`。

### 计划中

- 用 `_tests/cases/tc1-test-daily-report` 跑通完整流程并校准报告模板。
- 补充更多测试案例（落地页、B 端表单、移动端页面）。
