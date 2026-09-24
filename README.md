# GitHub Native Markdown Enhance

为 GitHub 原生 Markdown 编辑器添加一个图标菜单，选择格式后将 Markdown 插入当前编辑器。扩展保留 GitHub 自带的 Write / Preview、文件预览、撤销与提交操作，不替换编辑器。

当前版本为 `0.1.0`，以 Chrome / Edge 的本地加载扩展形式提供，尚未发布到浏览器应用商店。

## 功能

- 在 GitHub Issue 的 Markdown 正文栏添加入口；Issue Form 有多个正文栏时，每栏各有一个入口，命令只作用于所选栏。
- 在 GitHub 的 `.md` / `.markdown` 文件编辑页添加入口，包括 README 编辑和新建 Markdown 文件。
- 提供五种 GitHub Alert（Note、Tip、Important、Warning、Caution），以及 Details 折叠块、Keyboard 按键标签和 Diff 代码块。
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

块级命令需要在顶层段落使用；若光标位于引用、列表或代码围栏内，扩展会提示更换插入位置。

## 支持范围与验证

扩展只在 `https://github.com/*` 运行。首版针对 Issue Markdown 正文栏和 GitHub 文件编辑页；PR、Discussion、Wiki、github.dev、GitHub Enterprise 与移动端不在当前适配范围。

Chrome 的真实 GitHub Issue Form 与 README 草稿已验证插入、预览和撤销。Edge 已在本地夹具验证，但 GitHub 实页未验证；Manifest V3 扩展包的实际加载也尚未验收。其他页面变体和已知限制见[验收记录](docs/project/acceptance.md)。

## 开发

```powershell
npm run typecheck
npm test
npm run build
npm run fixture
```

`npm run fixture` 在 `http://127.0.0.1:8765/owner/repo/edit/main/README.md` 提供 CodeMirror 测试页，并在 `/owner/repo/issues/new` 提供多输入框测试页。夹具不能代替 GitHub 实页验证。

扩展清单没有申请额外权限，不需要 GitHub Token 或后台服务。内容脚本仅匹配 `github.com`，不会将编辑内容上传到扩展自建服务。

项目文档：[开发 Spec](docs/project/spec.md) · [设计](docs/project/design.md) · [调研](docs/project/research.md) · [验收记录](docs/project/acceptance.md) · [术语](CONTEXT.md)。Spec 与设计记录的是开发目标；当前实际支持范围以上文和验收记录为准。

## 许可证

当前仓库尚未提供许可证文件。
