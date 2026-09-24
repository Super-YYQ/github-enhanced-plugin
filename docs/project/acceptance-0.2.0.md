# 0.2.0 验收记录

日期：2026-09-24。本版实现可配置菜单与选项页；[0.1.0 的 GitHub 实页记录](acceptance.md)保留为历史证据，不能自动视为本版通过。

| 环境 | 已验证操作 | 结果 |
| --- | --- | --- |
| Playwright Chromium 151.0.7922.34，加载完整 Manifest V3 扩展包 | 扩展后台 worker、选项页、`storage` 权限和 GitHub 来源内容脚本；Issue 夹具的根菜单、Alert 二级菜单、自定义命令插入 | 通过 |
| Microsoft Edge 153.0.4234.48，加载完整 Manifest V3 扩展包 | 与上项相同的扩展包流程 | 通过 |
| 上述扩展环境 | 选项页新建自定义模板并显示示例；字号调整到 20 px 再改回；浅色、深色、390 px 窄屏布局；JSON 导出、非法导入拒绝、导入差异预览及确认替换、恢复默认保留自定义命令 | 通过 |
| 上述扩展环境 | 配置变化后已打开的 Issue 夹具立即更新；全部命令隐藏时网页入口消失，重新启用后恢复；长自定义菜单用方向键滚动时页面滚动位置不变 | 通过 |
| 本地单元与 DOM 夹具 | 模板标记校验及光标位置、配置导入校验、Issue 多实例隔离、README 文件编辑器中自定义 `{{cursor}}` 光标定位 | 通过 |

浏览器夹具在 `github.com` 来源下用本地 HTML 拦截响应，保证完整扩展包的内容脚本按真实匹配规则加载；它仍不能证明 GitHub 当前页面 DOM 与草稿状态的兼容性。本轮尝试使用之前登录的测试浏览器访问当前仓库 Issue 草稿页，先后遇到导航超时和 `net::ERR_NETWORK_CHANGED`，因此**本版真实 GitHub 页面尚未重新验收**。Chrome 稳定版的自动化侧载未启动扩展后台 worker；已用 Playwright Chromium 与 Edge 完整侧载作替代检查，不能把它写成 Chrome 稳定版通过。浏览器工具栏图标的人工点击也尚未验收，虽然后台 `action.onClicked → runtime.openOptionsPage()` 已按官方 API 实现。

本版没有提交 Issue、README 草稿或仓库文件。Edge 真实 GitHub 页面继续按用户先前选择记为未验证。已有 Issue 描述/评论、Issue Form 的代码字段、长文件视口外修改、中文输入法及高对比模式仍是独立验收缺口。

本地检查：`npm run typecheck`、`npm test`（5 个测试文件、29 个测试）及 `npm run build` 均通过。
