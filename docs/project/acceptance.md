# 首版验收记录

日期：2026-09-24。测试范围限定在当前仓库 `Super-YYQ/github-enhanced-plugin`、用户授权的 `Super-YYQ/codex-Monitor` 与 `farion1231/cc-switch` 未提交草稿，以及本地夹具；验收过程没有提交 Issue 或文件。

| 环境 | 页面与操作 | 结果 |
| --- | --- | --- |
| Chrome 153.0.8010.53 | 当前仓库的 Issue 新建页：可见原生格式栏添加一个入口；Note 插入对应正文；GitHub Write/Preview 保留，Preview 渲染 Note；Ctrl+Z/Ctrl+Y 撤销、重做 | 通过 |
| Chrome 153.0.8010.53 | 当前仓库的 GitHub 新建 `README.md` 草稿：在两行原文之间插入 Note；GitHub 文件 Preview 渲染 Note；返回编辑后 Ctrl+Z/Ctrl+Y 保留原生历史；改名为 `app.ts` 后入口移除 | 通过 |
| Chrome 153.0.8010.53 | 经用户明确授权的 `Super-YYQ/codex-Monitor` 现有 README 编辑草稿：唯一增强入口、文末 Note 插入与正文占位选中；GitHub 原生 Preview 渲染；Ctrl+Z 移除、Ctrl+Y 恢复；随后取消草稿 | 通过 |
| Chrome 153.0.8010.53 | 经用户授权的 `farion1231/cc-switch` Bug Report Issue Form 草稿：四个 Markdown 正文框各有一个图标入口；第二框插入 Note，其他框未改；原生 Preview 渲染、Ctrl+Z 撤销；第四框菜单滚动后末项 Diff 可点击且仅写入第四框；Escape 还原焦点；打开菜单时页面无滚动，菜单留在弹窗内且未盖住 Create 栏；随后取消并丢弃草稿 | 通过 |
| Chrome 153.0.8010.53 | 本地 CodeMirror 6 夹具：插入 Note、原生撤销和重做 | 通过 |
| Chrome 153.0.8010.53 | 本地三正文框加一个代码框：每个正文框一个入口，仅第二框改变，代码框无入口，原生撤销和重做 | 通过 |
| Edge 153.0.4234.48 | 本地 CodeMirror 6 夹具：插入 Note、原生撤销；占位文字被选中并可直接输入替换，文档状态同步 | 通过 |
| Edge 153.0.4234.48 | 本地三正文框加一个代码框：三个入口，仅第二框改变，代码框无入口 | 通过 |

实页测试通过 Playwright 在已登录测试浏览器页面初始化时注入 `dist/content.js`，并加载 `dist/content.css` 验证最终视觉与交互。早先一次只注入 JavaScript 的截图出现了默认长文字按钮和页面跳动，不能作为 UI 验收；此后修正为图标按钮、弹窗内菜单，并以脚本和样式同时加载重新验收。测试没有通过扩展管理页加载 Manifest V3 包，因此这份记录证明页面 DOM、样式和原生编辑行为，但不证明 Chrome/Edge 扩展的隔离环境装载行为。

仍未验收：Edge 实际 GitHub 页、真实 Issue Form 的 `render` 代码字段、已有 Issue 描述和评论、Markdown 文件编辑/新建的其他页面变体、长文件视口外内容、中文输入法及高对比视觉模式。当前文件编辑器以可见 CodeMirror DOM 判断快照是否变化；视口外内容若在菜单打开期间变化，可能无法识别过期快照，这一点尚未达到 Spec 的长文件要求。只读检查现有 README 编辑页未发现承载完整正文的 `textarea` 或隐藏输入框，不能据此消除该风险。验收时当前仓库远端尚无 README/Issue；获授权的 `codex-Monitor` 仓库没有多字段 Issue Form，也没有现成 Issue。Edge 独立测试浏览器停在 GitHub 登录页，用户选择跳过 Edge 实页验收；该窗口已关闭。上述场景完成前，不应将本版标记为符合 Spec 的全部验收条件。真实持久化提交也未执行。

本地代码检查：`npm run typecheck`、`npm test`（3 个测试文件、20 个测试）及 `npm run build` 均通过。
