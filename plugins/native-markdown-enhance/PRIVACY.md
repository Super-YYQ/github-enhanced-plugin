# 隐私说明：GitHub Native Markdown Enhance

更新日期：2026-09-24。适用于本仓库 `0.2.0` 版本的扩展代码；商店发布前应以最终上传包再次核对。

扩展仅在 `https://github.com/*` 注入内容脚本，以识别支持的 Markdown 编辑器。用户选择命令时，扩展在当前页面读取对应编辑框的选区与光标位置，在本机生成 Markdown 并写回该编辑框。编辑内容仍由 GitHub 页面按照 GitHub 自身的预览、草稿和提交机制处理。

扩展申请 `storage` 权限，将菜单显示状态、顺序、界面字号及用户创建的命令模板保存在 `chrome.storage.local`。这些配置在当前浏览器配置文件内共用；扩展不使用 `chrome.storage.sync`。用户主动选择导出时，浏览器下载一份 JSON 设置文件；主动导入时，扩展在本地解析该文件并在确认后替换设置。

当前版本没有开发者自建的账户、遥测、广告或服务器，也没有主动向开发者服务器发送 GitHub 编辑内容或扩展设置；不要求 GitHub Token。卸载扩展或清除浏览器扩展数据会移除其本地存储；导出的 JSON 文件由用户自行管理。

隐私问题可在[仓库 Issues](https://github.com/Super-YYQ/github-enhanced-plugin/issues)反馈。Chrome Web Store 上架前，发布者仍需核对最终扩展包并按后台实际问题填写数据与权限披露。
