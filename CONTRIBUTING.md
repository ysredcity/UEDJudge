# 贡献与维护规则（CONTRIBUTING）

本文件约定 `UEDJudge`（UED 评价师）的协作治理：单一事实源、改动顺序、入库边界、分支与提交。

## 一、单一事实源（Single Source of Truth）

- **评估规范的事实源 = `skills/ued-judge/references/`**：评审流程（`critic-protocol.md`）、冻结评论员 prompt、硬性检查、问题标签、报告模板都以这里为准。修改 `critic-prompt.md` 会改变评分口径，须在 `PROJECT_CONTEXT.md` 记录原因。SKILL.md 是入口与铁律，不重复承载明细。
- **上下文事实源 = `PROJECT_CONTEXT.md`**：项目目标、当前状态、关键结论、文件地图、待办。写给维护者，过程 / 根因 / 踩坑越细越好。
- **对外说明事实源 = `README.md`**：仓库总览与用法，写给使用者。
- **整体版本事实源 = `skills/ued-judge/SKILL.md` 的 `metadata.version`**：用于对外版本展示、报告和 ZIP 命名；与冻结评分正文的版本独立。
- **Pro 的独立版本 = `skills/ued-judge-pro/SKILL.md` 的 `metadata.version`**；Pro 报告交付规则只维护在该目录的 `references/report-delivery.md` / `report-data.md`，不改评分、保真或调用边界。
- **共用规则不双份维护**：普通版 references 与 capture.mjs 仍是源；Pro 中对应文件是 `scripts/sync-pro-core.mjs` 自动生成副本，`core-manifest.json` 记录源版本与 SHA-256。不得手工改 Pro 共用副本，不依赖运行时相邻 skill 或软链。
- 以上分工不重复维护；冲突时以对应事实源为准。

## 二、改动顺序（先规范，后产物）

1. 先改 `references/`（流程 / prompt / 检查项 / 模板）——规范先行。
2. 再改 `SKILL.md` 的索引与铁律，使之指向最新规范。
3. 用 `_tests/` 的案例验证评估效果。改冻结 prompt 时必须先做「校准集验证」（见下）。
4. 更新 `PROJECT_CONTEXT.md`（状态 / 结论 / 文件地图 / 待办 + 变更日志一行）。
5. 面向使用者的能力变化，追加到 `CHANGELOG.md`。
6. 需要本机立即生效时，同步到安装目录（当前为 `~/.kiro/skills/ued-judge` → `~/.agents/skills/ued-judge`）：先备份到 `.ued-judge/backup/`，再 `rsync -a --delete --exclude .DS_Store skills/ued-judge/ <安装目录>/`，最后 `diff -rq` 确认一致。
7. 共用规则变化后运行 `node scripts/sync-pro-core.mjs --write`，再 `--check`；发现删除或漂移须处理，不允许带过期副本发布。Pro 仅改报告模板时不改普通版。运行 `node --test tests/pro-report.test.mjs` 验证数据、派生展示、安全、独立交付及一致性；浏览器交互须另行实测。

### 校准集验证（改 `critic-prompt.md` / `verifier-prompt.md` 前必做）

冻结正文决定评分口径，改动前先在测试案例上验证，不能只做静态检查：

1. 截图用 `skills/ued-judge/scripts/capture.mjs`，同一截图、同一使用途径、同一模型，候选正文至少评 3 次（条件允许时每个案例 5 次，覆盖至少 2 种界面类型）。
2. 记录：各维度分极差、换算总分极差、两次及以上样本都提到的差距主题比例、首要差距是否一致。
3. 现行参考目标：换算总分极差 ≤1.0（10 分制），各维度极差 ≤1。达不到时如实记录，由用户决定是否采用。
4. 材料放 `_tests/experiments/<日期>-<主题>/`，结论与数据写入 `PROJECT_CONTEXT.md`，面向使用者的变化写 `CHANGELOG.md`。

## 三、入库边界

- **随仓库提交**：`README.md`、`CHANGELOG.md`、`CONTRIBUTING.md`、`PROJECT_CONTEXT.md`、`AGENTS.md`、`.kiro/`、`docs/`、`skills/`、`scripts/`、`tests/`（测试代码，不含案例截图/报告）。
- **不入库**：`_tests/`（评测材料与产出物，属于验证材料，不是 skill 交付物；已在 `.gitignore` 排除）；`.ued-judge/`（运行时截图、目标稿与备份）；根目录 `releases/`（本地版本 ZIP 包，打包产物统一放这里管理）。

## 四、CHANGELOG 与工程台账的分工

- `CHANGELOG.md` 写给**使用者**：只写「这个版本多了什么能力、升级后有什么不一样」。
- `PROJECT_CONTEXT.md` 写给**维护者**：过程、根因、逐项验证、返工修正、仓库工具与测试材料的调整都往这里放。

## 五、协作约定（重要）

- **不要替用户自动 `git commit` / `git push`**：只修改文件，提交与推送由用户手动操作。需要时可列出改动文件与建议的 commit message 供参考。
- 台账及 `.kiro/` 属于项目配置，应随仓库提交，以保证跨机器同步与防丢失（由用户手动提交）。

## 六、分支与提交

- 功能改动走特性分支，不直接推 `main`（除非明确要求）。
- 提交信息简洁准确，一条提交聚焦一件事。

## 七、版本与打包

- 整体版本采用 `x.y.z`：`x` 大版本、`y` 优化迭代、`z` 问题修复；提升 `x` 时 `y/z` 归零，提升 `y` 时 `z` 归零。当前版本为 `1.4.2`（首次统一基线为 `1.3.0`），后续修复为 `1.4.3`，下一次优化为 `1.5.0`。
- 发布时先更新 `SKILL.md` 的 `metadata.version`，再同步 README 当前版本与 CHANGELOG 对应条目；后续新改动放在 Unreleased，不改写已发布版本的历史记录。
- 整体版本变更不自动重编号 critic / verifier 冻结正文，也不改变评分口径；确需修改冻结正文时仍执行校准协议。
- ZIP 放根目录 `releases/`，命名为 `ued-judge-<x.y.z>.zip`；同一版本多个快照可附日期或构建标识，不用评分正文版本替代整体版本。保留旧包，不静默覆盖。
- 包内顶层为 `ued-judge/`，包含完整 skill 目录；不含测试、依赖、仓库配置或系统缓存。打包前校验结构，打包后核对文件与内容；本地未提交改动须从当前文件打包，不能误用旧 HEAD。
- Pro 独立打包为 `ued-judge-pro-<Pro x.y.z>.zip`，顶层 `ued-judge-pro/` 包含完整规则副本、manifest、脚本与 assets。先检查共享规则一致性，再打包；普通版不携带 Pro 模板。记录 Pro/core/冻结正文版本，不把三者混为同一版本。
