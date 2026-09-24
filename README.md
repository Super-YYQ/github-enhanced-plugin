# GitHub Native Markdown Enhance

为 GitHub 原生 Markdown 编辑器添加“增强”菜单。选择命令后，Markdown 会插入当前编辑器；扩展不替换编辑器，也不接管 GitHub 的预览或提交。

首版提供 Note、Tip、Important、Warning、Caution、Details、Keyboard 和 Diff 八项命令。Issue 页按编辑器实例添加入口；Markdown 文件编辑页在文件编辑器上方添加入口。扩展只在 `github.com` 运行，不需要 GitHub Token、后台服务或额外权限。

## 本地安装

需要 Node.js 24 或兼容版本。运行：

```powershell
npm ci
npm run build
```

在 Chrome 或 Edge 的扩展管理页开启开发者模式，选择“加载已解压的扩展程序”，选中本仓库的 `dist` 目录。修改源码后重新运行 `npm run build`，并在扩展管理页重新加载。当前没有发布到浏览器应用商店。

## 使用

在 GitHub Issue 的 Markdown 正文框或 Markdown 文件编辑器中放置光标或选择文字，点击对应的 **增强 ▾**，再选择命令。菜单支持方向键、Home/End、Enter 和 Escape；插入后可以继续使用 GitHub 原有的 Write / Preview、编辑和撤销。多输入框页面中的按钮只作用于各自的输入框。

扩展目前仅针对 `github.com` 的 Issue 和 `.md` / `.markdown` 文件编辑路径；PR、Discussion、Wiki、github.dev 与 GitHub Enterprise 未做适配。GitHub 页面结构可能变化，若入口未出现或提示编辑器已变化，请保留原草稿并查看[验收记录](.scratch/native-markdown-enhancement/acceptance.md)。

## 开发与验证

```powershell
npm run typecheck
npm test
npm run build
npm run fixture
```

`fixture` 在 `http://127.0.0.1:8765/owner/repo/edit/main/README.md` 提供本地 CodeMirror 测试页，并在 `/owner/repo/issues/new` 提供多输入框测试页。它不代替真实 GitHub 验收；当前结果与未验证项见[验收记录](.scratch/native-markdown-enhancement/acceptance.md)。

[正式开发 Spec](.scratch/native-markdown-enhancement/spec.md) · [详细设计](.scratch/native-markdown-enhancement/design.md) · [官方来源研究](.scratch/native-markdown-enhancement/research.md) · [术语表](CONTEXT.md)
