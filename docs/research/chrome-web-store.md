# Chrome Web Store 发布调研

核查日期：2026-09-24。范围：`plugins/native-markdown-enhance/` 下的 **GitHub Native Markdown Enhance**（`manifest.json` 版本 `0.2.0`）。以下“官方要求”来自 Chrome/Google 一手文档；“仓库现状”来自本地源码与构建目录。尚未登录开发者后台、上传或提交审核；后台实际表单与审核结果仍需发布时核对。

## 结论

**可以申请发布为 Chrome Web Store 扩展，但当前构建不能直接视为商店就绪。** 它是可本地加载的 Manifest V3 扩展；商店需要一个以 `manifest.json` 为 ZIP 根目录的完整包、商店图文素材、准确的隐私申报，以及开发者账号与审核。上传成功只证明包格式有效，公开上架还取决于审核和发布设置。[清单格式](https://developer.chrome.com/docs/extensions/reference/manifest) · [准备扩展](https://developer.chrome.com/docs/webstore/prepare) · [首次发布](https://developer.chrome.com/docs/webstore/publish)

## 当前仓库与发布差距

| 项目 | 当前证据 | 发布含义 |
| --- | --- | --- |
| 扩展形态 | 插件目录的 `manifest.json` 为 MV3；有 `name`、`version`、`description`、`icons`、`content_scripts`、`background`、`options_ui`；构建输出在插件的 `dist/` | 满足制作商店上传包的基本结构；官方要求上传 **ZIP 文件内容根目录**直接是 `manifest.json`，不能把整个 `dist` 文件夹作为 ZIP 内部顶层目录。[清单格式](https://developer.chrome.com/docs/extensions/reference/manifest) · [准备扩展](https://developer.chrome.com/docs/webstore/prepare) |
| 版本与文案 | 清单版本 `0.2.0`，英文短描述；源码构建脚本复制清单 | 首次上传前核对商店名称、描述和版本；后续每次上传新包都要提高版本。清单元数据上传后不能在后台直接改。[准备扩展](https://developer.chrome.com/docs/webstore/prepare) · [更新扩展](https://developer.chrome.com/docs/webstore/update) |
| 图标 | 插件的 `assets/`、`dist/icons/` 和清单含 16、32、48、128 px | 已补 128×128 PNG 商店图标；上传前仍需检查最终构建包。[图标规范](https://developer.chrome.com/docs/extensions/reference/manifest/icons) · [商店图片](https://developer.chrome.com/docs/webstore/images) |
| 权限与范围 | `permissions` 只有 `storage`；内容脚本匹配 `https://github.com/*` | 在隐私页说明单一用途、为何存储设置、为何只访问 GitHub 页面。维持最小必要权限；不要为未来功能预申请更宽站点权限。[隐私字段](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) · [权限政策](https://developer.chrome.com/docs/webstore/program-policies/policies) |
| 数据处理 | 插件的 `src/settings.ts` 通过 `chrome.storage.local` 保存设置/自定义模板；编辑器代码在页面中处理当前选区并插入 Markdown。对 `src/` 和 `scripts/build.mjs` 的检索未发现应用级 `fetch`、XHR、WebSocket 或远程脚本加载；已写[隐私说明](../../plugins/native-markdown-enhance/PRIVACY.md) | 不能把“没有自建服务器上传”写成“完全不处理用户数据”：GitHub 页面内容、表单文本和用户输入即使只在本机处理也属于需披露范围。发布前应复核最终包，并使公开隐私政策 URL、数据使用声明和权限说明一致。[用户数据 FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) · [隐私字段](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) |
| 素材与包 | 已有 128 px 图标和真实选项页截图，其中一张为 1280×800；仍缺商店宣传图、GitHub 实页专用截图及上传 ZIP | 需制作真实扩展使用场景截图，准确呈现可用功能；不能把夹具画面冒充 GitHub 实页。至少准备 1 张 1280×800 或 640×400 截图（最多 5 张）和 440×280 PNG/JPEG 小宣传图。[商店图片](https://developer.chrome.com/docs/webstore/images) · [列表要求](https://developer.chrome.com/docs/webstore/program-policies/policies) |
| 实页验证 | [本版验收记录](../../plugins/native-markdown-enhance/docs/project/acceptance-0.2.0.md)记载真实 GitHub 页面尚未完整复验；后续菜单修复也需要重新确认 | 官方要求上传前本地测试全部功能，且不允许失效功能。建议在真实 Issue 多正文框、README 编辑及设置页复验后再提交，商店说明也应与实测范围一致。[准备扩展](https://developer.chrome.com/docs/webstore/prepare) · [最低功能政策](https://developer.chrome.com/docs/webstore/program-policies/minimum-functionality) |

源码检索只是本次快照，不等于安全或隐私审计；最终披露须以**实际上传的完整 ZIP**为准。

## 开发者账号、审核与发布流程

1. 使用 Google 账号在 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) 注册开发者并支付**一次性注册费**；官方注册页未固定给出本文可长期引用的金额，以结算页面为准。完成发布者名称与联系邮箱验证，给该 Google 账号启用两步验证。账号、付款、邮件验证与两步验证需要账号持有人操作。[注册](https://developer.chrome.com/docs/webstore/register) · [账号设置](https://developer.chrome.com/docs/webstore/set-up-account) · [两步验证政策](https://developer.chrome.com/docs/webstore/program-policies/policies)
2. 在真实 Chrome 中测试最终构建，检查清单文案、128 px 图标和打包内容；把插件 `dist/` **里面的文件**压为 ZIP，使 `manifest.json` 位于 ZIP 根目录。首次上传在后台选 **Add new item** 并提交 ZIP；官方上限为 2 GB。当前仓库尚未生成该 ZIP。[准备扩展](https://developer.chrome.com/docs/webstore/prepare) · [首次发布](https://developer.chrome.com/docs/webstore/publish)
3. 填写 Store listing 的完整描述、类别、语言、截图与宣传图；填写 Privacy practices 的单一用途、权限理由、远程代码与数据处理声明、隐私政策链接；选择地区与可见性，必要时填写测试说明。若未来同仓库有其他**功能目的不同**的插件，宜作为独立扩展条目和独立清单/包发布；当前这个商店条目应聚焦“增强 GitHub 原生 Markdown 编辑器”。[列表字段](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) · [隐私字段](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) · [单一用途政策](https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines)
4. 点击 **Submit for Review** 后进入自动与人工结合的审核，不能把“已提交”称为“已上架”。官方说明大部分扩展几天内审核完成，也可能持续数周；新开发者、新扩展、较宽权限或难以审查的代码可能更慢。审核通过后可自动发布，也可选择延迟发布并在 30 天内手动发布。[首次发布](https://developer.chrome.com/docs/webstore/publish) · [审核流程](https://developer.chrome.com/docs/webstore/review-process)

首次建立发布者时，官方目前将可发布扩展数限制为两个，达上限可在后台申请提高。这影响“仓库将来收纳多个插件”的商店规划，但**不限制 Git 仓库本身**收纳多个项目。[首次发布：item limits](https://developer.chrome.com/docs/webstore/publish)

### 图片文档的一处不一致

[专门的图片要求页](https://developer.chrome.com/docs/webstore/images)明确把 **128×128 图标、440×280 小宣传图、至少一张截图**列为必备，并把 1400×560 大宣传图列为可选；它允许截图为 1280×800 或 640×400。[Store listing 概述页](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)的“必备”列表又包含 YouTube 视频，且只写 1280×800 截图。两页表述不一致；准备上述三项确定素材，同时以届时开发者后台的必填校验为准，不将视频或大宣传图的要求说死。

## 发布前由账号持有人完成或确认

- 选择实际发布用的 Google 开发者账号、发布者名称和联系邮箱；完成注册费、邮件验证、两步验证。[注册](https://developer.chrome.com/docs/webstore/register) · [账号设置](https://developer.chrome.com/docs/webstore/set-up-account) · [两步验证政策](https://developer.chrome.com/docs/webstore/program-policies/policies)
- 确认公开的隐私政策地址及内容，与本地处理 GitHub 编辑文本、自定义模板存储、无自建服务器上传等实际行为和后台勾选一致。[用户数据 FAQ](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) · [隐私字段](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)
- 审核商店名称、描述、截图、可见性和发布地区；在真实页面完成最终体验验收，再上传并决定何时提交审核/公开发布。[列表字段](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) · [首次发布](https://developer.chrome.com/docs/webstore/publish)
