# 项目上下文台账（PROJECT_CONTEXT）

> **这是本项目的单一事实源（Single Source of Truth）。** 每次新会话开始时先读它；完成里程碑、做出重要决策、或新增/移动文件后**及时更新它**。维护协议见文末「■ 更新协议」。最后更新：2026-09-29。

---

## 1. 项目是什么

`UEDJudge`（**UED 评价师**）：对**已开发完成**的 Web 系统、网页做体验诊断，并按用户选择分阶段优化的 skill。不用于从零生成界面。

核心流程：诊断（评论员盲评 + 主控硬性检查）→ 对话中输出诊断报告 + 1–3 个改进阶段 → **停下等用户选择**（只要报告 / 逐阶段执行 / 一次性执行）→ 复评 → 收尾报告。

## 2. 当前状态（Status）

- ✅ 仓库治理框架：README、CHANGELOG、CONTRIBUTING、PROJECT_CONTEXT、AGENTS、`.gitignore`、`.kiro/steering/context-management.md`、`docs/`、`_tests/`。
- ✅ skill 主体 v0：`skills/ued-judge/SKILL.md` + `references/`（critic-protocol / critic-prompt / hard-checks / glossary / report-template）。
- ✅ 测试案例 TC1：`_tests/cases/tc1-test-daily-report/index.html`（按截图还原的测试日报看板，深色）。
- ✅ 对照实验（与 skill 无关，仅作参考）：`_tests/outputs/tc1-test-daily-report/` 下有 ui-ux-pro-max 版（`optimized.html`）与 frontend-design 版（`optimized-frontend-design.html`）及各自说明。
- ⬜ 尚未用 skill 实跑过完整流程，截图命令与评论员调用均未实测。

## 3. 关键结论与决策（不要重复踩坑）

- **机制来源**：以用户提供的「评论员子智能体迭代」提示词为主干，但把「无限迭代直到 9 分」改为「一次诊断 + 1–3 阶段 + 人工确认」，原因是多轮迭代 token 成本过高，且这样同时覆盖「只要报告」和「要优化」两种诉求。
- **评论员 prompt 冻结**：保留原提示词全部约束（整体+细节、警惕 AI 感套路并扣分、简洁具体、大胆有主见），唯一改动是「1 个最大差距」→「最多 5 条排序差距清单」，为分阶段规划提供材料。改 prompt = 改评分口径，须记录原因。
- **隔离规则**：评论员每次全新上下文，只给截图路径 + 使用途径；不给代码、历史、改动、阈值。**9 分参考线只写在 protocol 里**，不进评论员 prompt。使用途径首轮写定后不改；截图固定 1440×900 整页、文件名中性。
- **成本硬上限**：评论员调用 只要报告 1 / 一次性 2 / 逐阶段 ≤4。逐阶段执行可动态调整后续阶段内容，但不能新增阶段、不能在同一流程内重新诊断（用户确认采纳此上限）。
- **报告只在对话中呈现**，用户决定是否保存（用户确认）。
- **废弃旧骨架**：dimensions / scoring / heuristics 已删除，评分完全来自评论员整体判断；新增 `hard-checks.md`（H1–H12）补足美学盲评容易漏的合规项，结果与评论员并列、不影响评分；`glossary.md` 只做问题标签统一，不参与打分。
- **临时文件**：截图、备份写在用户工作目录 `./.ued-judge/`，流程结束询问是否删除。
- **仅截图输入**只出报告、不执行优化。
- **`_tests/` 不入库**；❗不要替用户 `git commit` / `git push`。

## 4. 文件地图（File Map）

```
UEDJudge/
├── PROJECT_CONTEXT.md / README.md / CONTRIBUTING.md / CHANGELOG.md / AGENTS.md / .gitignore
├── .kiro/steering/context-management.md   # 自动注入本台账
├── docs/README.md
├── _tests/                                 # 不入 Git
│   ├── README.md
│   ├── cases/tc1-test-daily-report/        # index.html + README.md
│   └── outputs/tc1-test-daily-report/      # 两个对照实验产物 + 说明
└── skills/ued-judge/
    ├── SKILL.md                            # 三条铁律 + 流程速览 + 索引
    └── references/
        ├── README.md
        ├── critic-protocol.md              # 完整流程（唯一事实源）
        ├── critic-prompt.md                # 冻结评论员 prompt
        ├── hard-checks.md                  # H1–H12
        ├── glossary.md                     # 标签/层级/AI 感套路
        └── report-template.md              # 诊断报告 / 阶段复评简报 / 收尾报告
```

## 5. 待办 / 下一步（Next）

- [ ] 用 TC1 实跑完整流程：验证 Playwright 截图命令、`invoke_sub_agent` 能否读取截图、评论员输出是否稳定可用。
- [ ] 根据实跑结果校准 report-template 与阶段归纳规则。
- [ ] 评估同一截图多次盲评的分数波动幅度，决定是否需要在 protocol 里说明波动容忍度。
- [ ] 补充更多测试案例（落地页、B 端表单、移动端）。

---

## ■ 更新协议（How to update this file）

**何时更新**：完成里程碑；做出影响后续的决策；新增/移动/删除重要文件；明确新待办或放弃方向。

**更新哪里**：第 2、3、4、5 节 + 文末变更日志一行 + 顶部「最后更新」日期。

**风格**：精炼、只记对后续有用的信息。

---

## 变更日志（Changelog）

- 2026-09-29 建立台账 + `.kiro` 上下文管理；搭建目录结构与治理框架（参考 `pangea-design-skill`）。
- 2026-09-29 新增 TC1 测试案例（测试日报看板 HTML）；在 `_tests/outputs/` 做了 ui-ux-pro-max 与 frontend-design 两个对照实验（不影响 skill）。
- 2026-09-29 定稿并落地 skill v0：以评论员提示词为主干，改为「诊断 → 1–3 阶段 → 人工确认 → 执行 → 复评」；冻结评论员 prompt（差距改为 ≤5 条）；新增硬性检查 H1–H12、glossary、三种报告模板；设评论员调用上限 4 次；删除 dimensions/scoring/heuristics 旧骨架。
