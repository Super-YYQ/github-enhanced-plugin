# GitHub 原生 Markdown 增强设计地图

Label: wayfinder:map
Status: open

## Destination

形成可供开发评审的详细设计：保留 GitHub 原生编辑器，在对应按钮栏增加增强下拉菜单，向当前编辑器插入 Markdown；首要覆盖 README 和 Issue 多输入框。

## Notes

- 用户先要求详细设计，现进一步要求生成正式开发 Spec。原设计保存在 [详细设计](design.md)，实施范围保存在 [首版开发 Spec](spec.md)。
- 用户已选择首版 Chrome / Edge。详细设计已交付草案，地图继续保留待评审项及实施前接入验证项；不将调研完成视为功能完成。
- 用户已确认以真实 GitHub 页面的编辑结果为主要验收接缝，并辅以命令文本转换的少量单元测试。
- 使用 Wayfinder、Domain Modeling 和 Research；设计建议与用户已确认原则分别标记，不将未回应视为同意。
- 当前没有配置远端 issue tracker，使用技能规定的 local-markdown tracker。未来可运行 `/setup-matt-pocock-skills` 配置跟踪器，本轮不依赖该设置。
- 研究证据保存在 [接入能力研究](research.md)。空仓库尚无首个提交，研究使用本地文件，不为保存研究创建或切换临时分支。
- 研究由独立子代理处理；主代理整理交互、范围、验收和接口设计。只允许各自写入分配的文件。

## Decisions so far

- [原生编辑器接入能力与限制](issues/01-editor-integration.md)：Issue 与 README 分别适配；库 API 不等于网站扩展契约，原生状态与撤销必须实页验证。
## Not yet specified

后续产品扩展不影响本轮设计交付；现阶段可明确提问的未决事项由子票跟踪。

## Out of scope

本轮不实施功能、不发布远端 Issue、不提交或推送代码、不安装浏览器扩展。
