# GitHub 原生 Markdown 增强调研证据

调研日期：2026-09-24。用途：支撑设计方案；尚未实现插件，也未对登录后的 GitHub 编辑器执行现场插入、撤销或提交测试。以下区分官方事实与设计推论。引用的是调研日读取的官方文档／源码，`main` 地址随上游变化；实现前应再核对并记录实际浏览器、页面和依赖版本。

## 结论

“每个原生 Markdown 编辑器旁追加一个增强菜单，点击后写入对应编辑器”有合理技术基础，但 Issue 文本框与 README 文件编辑器必须分别适配。官方开源组件能力不能等同于 github.com 对浏览器扩展承诺的稳定接口。README 的实例访问、状态同步、撤销与提交一致性，是实现前必须在真实页面解决的不确定项。

## 1. 原生工具栏：可追加按钮，但不是网站插件 API

GitHub 的 `markdown-toolbar-element` README 给出 `markdown-toolbar for="textarea_id"`、对应 textarea 和自定义 `button data-md-button` 示例；`data-md-button` 让自定义按钮加入工具栏的焦点管理。[组件官方 README](https://github.com/github/markdown-toolbar-element)

源码中 `field` 通过 `for` 找同一 root 内的 textarea；对 `data-md-button` 的内置格式应用仅接受预定义样式。任意自定义模板仍需自己的文本命令逻辑。源码的插入路径使用 `execCommand('insertText')` 并提供赋值和 input 事件后备，这只是该库的实现，并不保证所有 GitHub 编辑页采用此版本或此组件。[官方源码](https://github.com/github/markdown-toolbar-element/blob/main/src/index.ts)

设计推论：发现真实 `markdown-toolbar[for]` 时优先使用明确关联；没有该组件时必须使用经现场验证的独立适配器。不把通用 `[role=toolbar]`、最近的 textarea 或页面第一个文本框当成可靠归属。原按钮、Write / Preview、编辑器节点均保留；追加按钮的 `type` 必须为 `button`。

## 2. Issue Form：多文本框成立，但不是所有 textarea 都接收 Markdown

Issue Form 的 `body` 为元素数组，官方示例包含多个 textarea，适合“一实例一按钮”。`markdown` 元素只是说明文本，不会作为用户输入提交。[Issue Form 官方语法与多框示例](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms)

textarea 的 `render` 属性会把提交内容格式化为代码块，并禁用该框的附件／Markdown 编辑扩展。这包括设置 `render: markdown` 的代码输入框；不能仅凭语言名认定其是 Markdown 正文编辑器。[官方表单 schema](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema)

设计推论：支持所有已识别、可编辑的 Markdown 正文框；排除标题、搜索、代码／日志框、隐藏框、只读框和禁用框。每个按钮必须持有自己的编辑器引用，不通过全局“最后聚焦编辑器”决定写入目标。Issue Form 的代码字段不支持增强属于正确识别，并非漏适配。

## 3. README：官方确认 CodeMirror，具体集成路径待实测

GitHub 官方编辑文件文档明确文件编辑器使用 CodeMirror，并区分 github.com 文件编辑器和可选的 github.dev 编辑器。该文档没有承诺 CodeMirror 主版本、页面导出的全局对象、扩展接口或工具栏 DOM 结构。[GitHub 编辑文件文档](https://docs.github.com/zh/repositories/working-with-files/managing-files/editing-files)

因此，不能把 README 当作 Issue textarea，也不能把“README 一定没有工具栏”写成当前事实。建议 README 支持范围明确为 github.com 上 Markdown 文件的原生编辑／创建流程；github.dev 另列为不在首版范围。按钮落在实际文件编辑操作栏的独立位置；若无法安全关联操作栏与编辑器，不修改页面结构来强行容纳按钮。

CodeMirror 6 官方 `EditorView` 源码公开 `dispatch` 和 `findFromDOM`；源码说明内容变更应使用事务，而非直接修改 `contentDOM`。它只渲染视口附近内容，故读取 `.cm-content.textContent` 也不能可靠取得整个文档。[CodeMirror 官方 EditorView 源码](https://github.com/codemirror/view/blob/main/src/editorview.ts)

CodeMirror 的 history 扩展公开 `isolateHistory` 事务注解；但这要求使用与页面编辑器兼容的同一套运行时对象，并经过真实历史行为验证。单次 `dispatch` 不自动证明一次原生撤销恰好撤销本次操作。[CodeMirror 官方 history 源码](https://github.com/codemirror/commands/blob/main/src/history.ts)

设计推论：必须先证明能够取得当前页面的真实实例，并沿其正常事务路径更新。`EditorView.findFromDOM` 的存在，不代表 GitHub 把该构造器公开；在扩展中另打包一份库，也不自动证明其能发现、驱动 GitHub 的实例。不得依赖 React Fiber、遍历私有对象、拦截 webpack 模块或重建编辑器来绕过验证。若必要路径无法满足稳定性要求，应明确 README 仍被阻塞，不把复制模板当作已完成的 README 自动插入支持。

## 4. textarea：文本替换、框架同步、原生撤销是三个检查点

HTML 标准规定 `selectionStart`／`selectionEnd` 和 `setRangeText` 的范围替换语义，偏移按 code units 计算；textarea 的 API 值会规范化换行。该算法没有赋予调用者“自动同步 React 状态并形成一个撤销单位”的保证。[HTML 标准：文本选择 API](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#dom-textarea/input-setrangetext-dev)

React 官方文档说明受控 textarea 的值由状态控制，`onChange` 未正确同步状态会导致值恢复。仅看到 DOM 值变化，不足以证明预览、提交和后续渲染保留了插入文本。[React textarea 官方文档](https://react.dev/reference/react-dom/components/textarea)

MDN 将 `execCommand` 标为废弃且非标准，但说明它仍有保留撤销历史的用途；事件触发存在浏览器差异，必须测试。GitHub 工具栏源码同样使用该路径，可作为原型候选，不能作为免验证理由。[MDN：execCommand](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand)

设计建议：

- 所有策略封装在 textarea adapter 内，命令生成器仅产出编辑计划。
- 优先验证真实浏览器中可保留原生撤销、同步宿主状态的插入路径；先在隔离 fixture 验证，再在无敏感内容的 GitHub 测试草稿验证。
- `setRangeText`、原生 value setter 加 input 事件都是候选手段，而非无条件可靠的通用后备。首版要求保留历史时，未通过历史验证的手段不能静默启用。
- 插入后验证值及原生 Preview 切换、继续输入和重渲染。提交一致性需要在专用测试仓库／明确授权场景覆盖，文档调研不能替代。
- 每次写入前确认实例仍连接、仍可编辑且内容／选区版本未失效。不能把旧 offset 应用到用户已经修改过的新文本。
- 失败或响应不明时不自动重试；否则首次实际成功但确认丢失会造成重复插入。不要通过全量旧文档回写做“回滚”，以免覆盖并发输入。

## 5. MV3：默认隔离，MAIN bridge 必须缩小能力

Chrome 官方文档说明 content script 默认运行于 isolated world，与页面共享 DOM，但 JavaScript 变量不可直接互访。这会影响获取页面编辑器实例；能查到 DOM 不等于能读到页面对象。[Chrome content scripts 官方文档](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)

Manifest 支持 `world: "ISOLATED" | "MAIN"`；MAIN 与页面脚本共享执行环境，宿主页面能够访问和干扰注入脚本。[Chrome manifest content scripts 官方文档](https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts)

设计推论：发现、菜单、模板生成默认放 isolated world；只有 README 事务验证证明必要时才引入最小 MAIN bridge。MAIN 不自动暴露闭包中的模块。桥接协议仅接收已绑定编辑器的结构化文本编辑计划，校验类型、范围、大小、实例有效性、请求去重及旧内容版本；禁止 eval、任意方法调用、任意 URL 请求或暴露扩展特权。随机请求标识用于关联与防重，不是对页面脚本的身份认证边界。原稿内容不写日志、不持久化、不上传。

## 6. 实现前的验证门槛

| 门槛 | 实验 | 通过条件 |
| --- | --- | --- |
| G1：实例识别 | 普通 Issue、至少三个 Markdown 字段的 Issue Form，混入一个 render 日志字段；动态展开／切页 | 每个支持框恰好一个按钮，代码字段无按钮；无重复注入、错绑和残留 |
| G2：textarea 写入 | 空框、选区、反向选区、中文／emoji、中文输入法、已有草稿 | 插入值、光标正确；框架重渲染及 Preview 来回切换后内容保留；其他框不变 |
| G3：原生历史 | 原先输入 A → 插入模板 B → 再输入 C；逐次 Undo / Redo | 本次插入可以整体撤销／重做，原有 A 的历史仍在，C 不被插件旧快照覆盖 |
| G4：README 事务 | github.com 编辑现有 README；创建 Markdown 文件；长文档视口外选区 | 获取真实编辑器；正常事务写入；整篇文档完整；预览、脏状态、后续输入和历史一致 |
| G5：原生功能保留 | 工具栏、Write / Preview、上传、提及、提交快捷键、取消编辑、SPA 导航 | 用户原有流程不被替换、吞键或破坏；取消后释放实例和监听器 |
| G6：失效恢复 | 操作过程中宿主重建编辑器、切 Preview、改变内容、超时／未知编辑器 | 停止本次写入并给出短提示；不改其他字段、不重试重复插入、不重写原稿 |

G1–G3 决定 Issue 首版是否可交付；G4 是满足用户 README 要求的必要门槛，不能改标为“未来计划”后宣称需求完成。设计阶段应明确风险和实验步骤，后续实现阶段通过这些门槛后再冻结具体选择器和 adapter 策略。

## 未确定事项

- 当前登录态 GitHub 各编辑页实际 DOM、组件版本和状态同步方式未现场读取。
- README 原生实例能否在扩展环境通过足够稳定的路径访问，仍待原型证明。
- Windows Chrome／Edge 中一次插入的撤销分组、React 同步和输入法行为尚未执行验证。
- 当前研究只提供官方约束和候选设计，不证明已支持任何页面；也未评价第三方插件的当前功能、维护状态或兼容性。
