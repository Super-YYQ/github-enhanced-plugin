# 原生编辑器接入能力与限制

Type: research
Label: wayfinder:research
Status: resolved
Assignee: research-editor-integration
Parent: ../map.md
Blocked by: none

## Question

根据一手来源，GitHub Markdown toolbar、Issue Forms 多输入框、README 文件编辑器、浏览器扩展隔离环境分别允许怎样的最小侵入增强？哪些插入、撤销和运行时访问能力必须在真实登录页面验证，不能由库文档推导？

## Comments

2026-09-24：由研究子代理认领。证据和设计建议分开记录于 ../research.md；不实现扩展，不切换共享工作树分支。

## Answer

2026-09-24：官方来源研究完成，详见 [接入证据与限制](../research.md)。Issue 工具栏可按明确的 textarea 关联建立实例，但 `data-md-button` 不是任意模板插入 API；Issue Form 的代码渲染字段应排除。GitHub 文件编辑使用 CodeMirror，具体版本和真实实例访问尚未实测。textarea 写入、框架同步、原生历史需要分别验证；文件编辑必须通过原生事务，不能修改视口 DOM。

已据此形成 [详细设计](../design.md)和[首版开发 Spec](../spec.md)，将真实接入验证作为首个实施门槛。此票解决文档能力边界，未宣称验证 GitHub 运行时；后续实验由 [Issue 与 README 原生插入验证](03-native-insertion-prototype.md) 跟踪。
