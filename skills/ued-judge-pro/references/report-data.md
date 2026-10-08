# 报告数据 v1

与共用报告模板一一核对后写 JSON；生成器不读取源码、不推断评审、不解析 Markdown。所有文字字段是纯文本。Node.js 用法：

```bash
node <skill>/scripts/render-report.mjs ./.ued-judge/reports/<run-id>/diagnosis.json ./.ued-judge/reports/<run-id>/diagnosis.html
```

## 公共字段（均必填，另注明的除外）

| 字段 | 内容 |
|---|---|
| schemaVersion / kind | `1` / `diagnosis` 或 `comparison` |
| runId / createdAt | 中性唯一运行 ID / ISO 时间 |
| subject | `name`、`target`、`inputType`（url/html/project/screenshot）、`canOptimize` 布尔、`usagePathway`（固定五项原样多行字符串）；不能优化时必填 `reason` |
| versions | `skill`（Pro）、`core`（manifest）、`rubric`、`verifier`、`criticModel`（不能锁定模型须如实说明） |
| capture | `viewport: {width:1440,height:900}`、`truncated` 布尔、`coverageNote`（未覆盖/无法判定说明，无则写「已覆盖本次采样」） |
| summary | 简短的本报告结论及影响结论的主要风险，不补评；不能用乐观结论掩盖未达成或无法判定 |
| screenshots | `before`、`after` 数组；诊断 after 必须为空，对照两侧至少一张；本地 PNG |
| scores | `before` 六维 A–F 各为两个原始值 `[0..4或null,0..4或null]`；对照 `after` 各为单值数组；`notes` 非空字符串数组记录参考限制 |
| gaps | 原始合并差距数组（可空），不能把数据核对项变成计分差距 |
| checks | 各检查 `{id,title,result,evidence}`；result 通过/不通过/无法判定/不适用；通过项可按共用模板汇总 |
| stages | 1–3 阶段（确无可执行优化时可空），结构见下；受依赖约束，不因 UI 筛选重排 |
| sections | 必需内容段落 `{id,title,summary?,body}`，见下。新报告应填非空短摘要 summary，body 保留完整依据；旧报告可不填 summary，界面默认展开原文。没有问题写「无」，无法验证写原因，不用空字段掩盖 |
| fullReport | 共用模板全部内容的完整文字报告；禁用脚本时也可阅读 |
| rawReviews | `{label,body}` 数组：诊断两个原始样本；对照包含相关核验、成对比较、收尾绝对样本；不改判定 |

`screenshots` 每张：`{id,role,label,path,top?,pairKey?}`，role 为 overview/slice/state，id 全报告唯一。path 相对 JSON 或绝对路径；不接受 URL / SVG。对照时尽量给两侧相同 `pairKey`，如 `overview`、`slice-1`；缺图保留缺图提示，不能把不同状态冒充一对。`top` 沿用 capture 输出，只用于说明。

## 差距与阶段

```json
{
  "id": "G1", "text": "评论员原话", "dimension": "A1",
  "severity": "P2", "confidence": "高", "stageId": "stage-1",
  "locations": { "before": { "shotId": "shot-0", "rect": [0.1, 0.2, 0.5, 0.1] } }
}
```

`locations` 可空，不知道位置就不填；可分别含 before/after。rect 可省略，含义为 **该 PNG 上归一化 x/y/宽/高**（0–1 且不越界），不是网页 DOM 坐标。只有已核对的位置才画框；没坐标显示「仅定位到截图」。`stageId` 可 null（例如依赖单独授权）。severity 为 P0–P3，confidence 为高/低。

```json
{
  "id": "stage-1", "title": "结构与层级", "status": "计划中",
  "items": [{
    "source": {"type": "gap", "id": "G1"},
    "action": "具体元素/数值/做法", "target": "可观察目标状态"
  }]
}
```

source.type 为 gap/check/shortfall；gap/check ID 必须存在各自数组中，shortfall ID 为正文中已记录的高置信勾选缺口项号。不在报告界面重新聚类阶段。

诊断 sections 必须含：`critic`（审美方向、顶尖设想、高置信勾选缺口与一致性异常）、`checks`（H/G/A 汇总、L 负荷和 W/M）、`protection`（视觉保护）、`fidelity`（功能/文案保真）、`limits`（改善上限）、`data`（独立不计分的数据提示）、`stages`（方案补充说明）。

`sections[].summary` 由主控依据完整记录整理，不由生成器截取首句或从正文推断。摘要省去已在问题、检查、阶段表中呈现的重复内容，但须逐条保留所在段落中的 P0/P1、阻断、退步、无效/异常样本、未达成原因、影响结论或执行的未知项、覆盖限制与授权例外。低优先级完整细节留在 body/fullReport；不能删除原始差距或核验记录。是否适合折叠以此逐条核对，不以摘要长度达标代替。

## 对照额外字段

- `verification: [{gapId,result,evidence}]`：覆盖所有原始 gaps；result 为已解决/部分解决/未解决/无法判断。无差距时空数组，不生成虚构解决率。
- `pairResults`：A–F 六条 `{dimension,result,confidence,attributed,judgment,evidence}`。result 为新版更好/旧版更好/持平/无效；confidence 高/低/—；attributed 布尔；judgment 为真实改进/倾向改进/真退步（建议回退）/噪声/持平/无效（仅参考）。按共用协议填，生成器检查组合，不能由绝对分推断。
- `goal: {result,conditions:[{title,result,evidence}]}`：result 达成/未达成/无法判定；conditions 按共用协议四条条件原样记录。
- sections 必须含：`goal`（务实目标与排除项）、`verification`（新问题与核验补充）、`pair`（标签错位、逐阶段判定链/成对结果）、`fidelity`、`protection`、`checks`、`remaining`（未解决/部分解决及收尾新差距）、`limits`、`motion`（W/M 实测）、`changes`（阶段完成/修改清单）、`scoreNotes`（仅参考轨迹与参考线）。

报告不隐式更新口径。历史实验用于模板验证时，versions.rubric/criticModel 写历史真实值，summary 与 scores.notes 明确「历史材料展示，未重跑最新规则」。
