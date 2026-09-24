# 首版验收记录

日期：2026-09-24。测试范围限定在当前仓库 `Super-YYQ/github-enhanced-plugin` 的未提交草稿，以及本地夹具；没有提交 Issue 或文件，没有推送代码。

| 环境 | 页面与操作 | 结果 |
| --- | --- | --- |
| Chrome 153.0.8010.53 | 当前仓库的 Issue 新建页：可见原生格式栏添加一个入口；Note 插入对应正文；GitHub Write/Preview 保留，Preview 渲染 Note；Ctrl+Z/Ctrl+Y 撤销、重做 | 通过 |
| Chrome 153.0.8010.53 | 当前仓库的 GitHub 新建 `README.md` 草稿：在两行原文之间插入 Note；GitHub 文件 Preview 渲染 Note；返回编辑后 Ctrl+Z/Ctrl+Y 保留原生历史；改名为 `app.ts` 后入口移除 | 通过 |
| Chrome 153.0.8010.53 | 本地 CodeMirror 6 夹具：插入 Note、原生撤销和重做 | 通过 |
| Chrome 153.0.8010.53 | 本地三正文框加一个代码框：每个正文框一个入口，仅第二框改变，代码框无入口，原生撤销和重做 | 通过 |
| Edge 153.0.4234.48 | 本地 CodeMirror 6 夹具：插入 Note、原生撤销；占位文字被选中并可直接输入替换，文档状态同步 | 通过 |
| Edge 153.0.4234.48 | 本地三正文框加一个代码框：三个入口，仅第二框改变，代码框无入口 | 通过 |

实页测试通过 Playwright 在已登录测试浏览器页面初始化时注入 `dist/content.js`，没有通过扩展管理页加载 Manifest V3 包。因此这份记录证明页面 DOM 和原生编辑行为，但不证明 Chrome/Edge 扩展的隔离环境装载行为。

仍未验收：已有 README 的编辑页、Edge 实际 GitHub 页、真实多字段 Issue Form、已有 Issue 描述和评论、Markdown 文件编辑/新建的其他页面变体、长文件视口外内容、中文输入法及高对比视觉模式。当前文件编辑器以可见 CodeMirror DOM 判断快照是否变化；视口外内容若在菜单打开期间变化，可能无法识别过期快照，这一点尚未达到 Spec 的长文件要求。当前远端仓库没有任何提交或已存在的 README/Issue，且自动审批拒绝访问另一仓库进行测试。上述场景完成前，不应将本版标记为符合 Spec 的全部验收条件。真实持久化提交也未执行。

本地代码检查：`npm run typecheck`、`npm test`（3 个测试文件、19 个测试）及 `npm run build` 均通过。
