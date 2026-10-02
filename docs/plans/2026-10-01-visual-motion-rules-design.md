# 视觉、微动效与通用 Web 规则补充

2026-10-01，用户确认前轮建议，并要求纳入 Vercel 的通用规则。

采用三份本地参考：视觉设计契约、微动效执行/验证、通用 Web 质量。相比直接叠加外部 skill，规则可按场景加载且不要求安装；相比修改冻结评分，保留历史口径并补足主控执行方法。入口、协议、检查与报告同步路由，M/W 工程结果独立呈现，不改变评论员输入、六维度评分、调用上限或阶段闸门。

不迁移框架、不强制字体/色彩/弹性风格、不把全部 UI 状态放入 URL；不授权后端、功能删减或语义修改。运行参考无外部 URL。这里只记录方案与来源，不保存页面诊断报告，不提交 Git。

## 来源与维护

以下为 2026-10-01 查阅的来源；本地参考是选择性改写与项目适配，不是原文镜像，也不包含外部 skill 的完整正文。后续更新须核查来源变化，禁止自动拉取覆盖冻结规则。若未来直接复制代码或正文，应先核查对应许可与署名要求。

- [Vercel Web Interface Guidelines](https://vercel.com/design/guidelines)：通用交互、布局、内容、表单、性能及动效工程原则。
- [Atlassian Foundations](https://atlassian.design/foundations)、[Typography](https://atlassian.design/foundations/typography)、[Motion](https://atlassian.design/foundations/motion)：视觉角色与 token、动效分类；不采用其品牌字体或组件依赖。
- [IBM Carbon Motion](https://carbondesignsystem.com/elements/motion/overview/)：任务型/表达型区分与任务型缓动起点。
- [W3C SC 2.3.3 Understanding](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html)：交互动画的可关闭性，AAA 等级。
- [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)、[Impeccable](https://github.com/pbakaus/impeccable)、[Taste Skill](https://github.com/Leonxlnx/taste-skill)：设计契约与专项优化方法；未采纳品牌限定、强制装饰或绝对审美禁令。

## 验证边界

检查 frontmatter、本地引用可达性、路由、重复计数与权限边界；确认冻结 prompt 未变。行为核验用场景走查：工具类复制/展开反馈、品牌表达、无动画界面、仅截图输入、敏感状态与输入保护。不声称文档更新已证明优化效果；需要用户另行发起实跑。
