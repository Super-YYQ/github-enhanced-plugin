# GitHub Native Markdown Enhance

为 GitHub 原生 Markdown 编辑器添加一个图标菜单，选择格式后将 Markdown 插入当前编辑器。扩展保留 GitHub 自带的 Write / Preview、文件预览、撤销与提交操作，不替换编辑器。

当前版本为 `0.2.0`，以 Chrome / Edge 的本地加载扩展形式提供，尚未发布到浏览器应用商店。

## 功能

- 在 GitHub Issue 的 Markdown 正文栏添加入口；Issue Form 有多个正文栏时，每栏各有一个入口，命令只作用于所选栏。
- 在 GitHub 的 `.md` / `.markdown` 文件编辑页添加入口，包括 README 编辑和新建 Markdown 文件。
- 提供五种 GitHub Alert（Note、Tip、Important、Warning、Caution），以及 Details 折叠块、Keyboard 按键标签和 Diff 代码块。
- 增强菜单只显示图标与短名称；五种 Alert 收在二级菜单中，自定义命令也有独立的二级菜单。
- 在扩展选项页隐藏、排序内置命令，创建和管理自定义 Markdown 模板，并调整扩展界面字号。
- 可导出配置为 JSON；导入时先预览影响，再确认整体替换当前配置。
- 支持选中文字后插入或包裹内容；菜单支持方向键、Home / End、Enter 和 Escape。

例如选择 **Note** 会在当前光标处插入：

```markdown
> [!NOTE]
> 在这里输入内容
```

## 安装

使用 Node.js 24 构建（当前已验证版本：24.14.0）：

```powershell
npm ci
npm run build
```

构建结果位于 `dist/`。打开 Chrome 的 `chrome://extensions` 或 Edge 的 `edge://extensions`，启用开发者模式，选择“加载已解压的扩展程序”，然后选择 `dist/` 目录。修改源码后重新构建，并在扩展管理页重新加载。

## 使用

在 Issue 正文栏或 Markdown 文件编辑器中放置光标，也可以先选中文字。点击对应的魔杖及下拉箭头图标（悬停提示为 **Markdown enhancements** 或 **Markdown 增强**），再选择命令。无选区时，部分命令会选中占位文字，便于直接输入替换。插入后仍可使用 GitHub 原生预览和撤销。

点击浏览器扩展图标可打开选项页；也可从扩展管理页进入“选项”。GitHub 页面内的增强菜单只负责插入。设置对当前浏览器配置文件中的所有 GitHub 仓库生效；全部命令隐藏时，网页增强按钮不显示，仍可从扩展图标重新打开设置。

自定义命令支持 `{{selection}}`（选中文字）和最多一个 `{{cursor}}`（插入后光标位置）。例如模板 `**{{selection}}{{cursor}}**` 会包裹选区，并把光标留在闭合星号前。未写 `{{selection}}` 时，模板直接替换选区。最多保存 50 条自定义命令，名称最多 40 字符、模板最多 10 KB；图标从扩展自带列表选择，模板不会执行脚本。内置命令可隐藏与排序，但不能删除或修改其 Markdown 模板。

扩展菜单和选项页字号可在 12–20 px 调整，默认 14 px；GitHub 原生编辑器字号不受影响。“恢复内置默认”会恢复内置显示状态、顺序和字号，保留自定义命令。配置保存在浏览器本地，不跨设备同步；卸载扩展前可导出 JSON 备份。

块级命令需要在顶层段落使用；若光标位于引用、列表或代码围栏内，扩展会提示更换插入位置。

## 支持范围与验证

扩展只在 `https://github.com/*` 运行。首版针对 Issue Markdown 正文栏和 GitHub 文件编辑页；PR、Discussion、Wiki、github.dev、GitHub Enterprise 与移动端不在当前适配范围。

`0.1.0` 曾在 Chrome 的真实 GitHub Issue Form 与 README 草稿验证插入、预览和撤销。本版 `0.2.0` 已在 Chromium 加载完整 Manifest V3 扩展，验证设置页和 Issue 夹具中的菜单、插入与配置变化；本版真实 GitHub 页面因测试浏览器网络错误尚未重新验收，Edge 实页也未验证。具体证据及限制见[首版验收记录](docs/project/acceptance.md)和[本版验收记录](docs/project/acceptance-0.2.0.md)。

## 开发

```powershell
npm run typecheck
npm test
npm run build
npm run fixture
```

`npm run fixture` 在 `http://127.0.0.1:8765/owner/repo/edit/main/README.md` 提供 CodeMirror 测试页，并在 `/owner/repo/issues/new` 提供多输入框测试页。夹具不能代替 GitHub 实页验证。

扩展仅申请 `storage` 权限保存本地设置，不需要 GitHub Token。内容脚本仅匹配 `github.com`，不会将编辑内容上传到扩展自建服务。

项目文档：[首版 Spec](docs/project/spec.md) · [可配置菜单设计](docs/project/configurable-menu-design.md) · [调研](docs/project/research.md) · [本版验收记录](docs/project/acceptance-0.2.0.md) · [术语](CONTEXT.md)。首版 Spec 与设计记录当时的目标；当前实际支持范围以上文和验收记录为准。

## 许可证

当前仓库尚未提供许可证文件。
