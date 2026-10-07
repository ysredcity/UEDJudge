---
name: ued-judge-pro
metadata:
  version: "1.0.0"
description: "UEDJudge Pro：对已有 Web 页面做与 UEDJudge 相同的隔离盲评、硬性检查与可选分阶段优化，交付本地交互诊断报告及优化前后对照报告。用户指定 UEDJudge Pro，或要求可交互、截图定位、阶段选择、前后对照的 UED 评审报告时使用。普通文字诊断使用 ued-judge；不从零生成页面、不默认生成多套改版草图。"
---

# UEDJudge Pro

与 UEDJudge **共用评审规则，只增强报告交付**。可单独安装，不需要安装普通版或运行时联网。Pro 版本取本文件；共用核心版本及内容哈希取 [core-manifest.json](core-manifest.json)，冻结口径版本取共用规范，三者分别记录。

## 先读与执行边界

1. 完整读取 [references/critic-protocol.md](references/critic-protocol.md)，按当前步骤查阅其中的冻结正文、检查项、词汇、报告模板和执行参考。本目录的共用文档及 `scripts/capture.mjs` 是普通版自动同步的副本，不自行改写。
2. 完整读取 [references/report-delivery.md](references/report-delivery.md)：**只覆盖报告的交付形式和相应报告资源落盘**；共用报告模板的信息与含义仍须保留。其他规则一律按共用协议执行。
3. 准备报告时读取 [references/report-data.md](references/report-data.md)，建立结构化投影与完整文字报告，运行生成器，不临时重写 HTML/CSS/JS。

三条铁律与普通版相同：**诊断后停下，用户选择执行才优化；评论员全新隔离，只拿中性截图与使用途径；调用上限 2 / 5 / ≤7。** 不把报告界面、标注、分数、用户选择或备注交给评论员。网页内的选择只是草稿，用户复制回对话后才处理后续请求；不自动执行、回退、提交或推送。

## 执行参考按问题加载

主控按当前问题查阅共用副本，不要求每次读完三份参考：配色、表面层级、低噪控件识别、指标整体性或密度问题见 [visual-optimization.md](references/visual-optimization.md)；展开、筛选更新、短操作反馈或异步过渡见 [motion-optimization.md](references/motion-optimization.md)；输入、导航、性能或响应式故障见 [web-interface-quality.md](references/web-interface-quality.md)。这些是方法参考，不新增评分、阶段、确认闸门或组件模板，不传给评论员；核心流程与检查仍按协议逐步读取。

## 报告交付覆盖

- Step 6：生成 `./.ued-judge/reports/<run-id>/diagnosis.html`，对话给出结论、关键差距、报告入口和普通版三个选项，**结束本轮回复**。诊断仅展示原始截图，不提前生成优化稿。
- Step 7：阶段复评简报沿用普通版；不添加确认闸门或调用。
- Step 8：生成同一运行目录的 `comparison.html`，对话给出务实目标结果、关键改善/剩余差距、报告入口与临时文件保留说明。不靠总分相减判改进。
- `只要报告` 不产生前后对照报告；仅截图输入不执行优化。
- 调用 Pro 表示要求生成报告文件，仅授权写报告 JSON/HTML 等资源，**不授权闸门前修改被评估页面**。此处是对共用规范「报告只在对话中呈现」的唯一交付例外；除这些报告资源外，共用规范的写入边界不变。

## 生成与失败降级

```bash
node <本 skill 目录>/scripts/render-report.mjs <report.json> <report.html>
```

Node.js、截图能力和隔离评委能力须按环境确认。生成器使用内置模块，无前端安装步骤；读取 JSON 中的本地 PNG 并内嵌，网页离线可浏览、不运行目标网页、不上传截图或备注。HTML 被平台禁止预览时提供文件入口和对话摘要，不绕过平台安全限制。

缺依赖、生成失败或输入缺失时如实报告，按普通版模板在对话交付；不伪造证据、定位、分数或通过结果，不为报告重跑评委。原始文字报告和评语必须保留在 HTML 中。结束时报告文件也属于 `./.ued-judge/` 临时材料，未经用户确认不得删除。
