# 知行工作室 · w3b.pub

> "知是行的主意，行是知的功夫；知是行之始，行是知之成。" — 王阳明《传习录》

知行工作室（w3b.pub）官方网站仓库。以 **"知行合一"** 为核心理念，将中国传统哲学思想与现代 Web 技术、AI 理念相融合的个人品牌展示站。

🌐 **在线访问：https://w3b.pub**

| 项目 | 值 |
|------|----|
| 站点地址 | https://w3b.pub |
| 内容版本 | **v3.2.0**（fact:version / 文档封面 / changelog） |
| 静态资源缓存版本 | **v3.3.2**（CSS / JS 引用的 `?v=x.y.z`，用于强制 CDN 刷新） |
| 最近更新 | **2026-08-27**（fact:updated_on / citation_publication_date / JSON-LD dateModified） |
| 部署方式 | GitHub Pages（`main` 分支）→ 自定义域名 w3b.pub · Cloudflare CDN 边缘缓存 5–10 分钟 |
| 构建 | **零构建纯静态站**（原生 HTML / CSS / JS，ES5 兼容） |
| 维护邮箱 | support@w3b.pub |
| 仓库地址 | https://github.com/x2it/w3b |

---

## 核心理念

网站围绕四条线索展开 **"理会 · 践行 · 知行合一 · AI 赋能"** 的三位一体呈现：

| 板块 | 核心思想 | 可视化形式 |
|------|----------|------------|
| **理会 · 洞察本质** | 朱熹"穷理以致知" | Canvas 粒子动画（四种思维状态：有序 / 发散 / 专注 / AI 神经网络） |
| **践行 · 当下行动** | 《尚书》知易行难 → 朱熹理会践行 → 王阳明知行合一 | 纵向历史时间线 |
| **知行合一 · 动态平衡** | 知与行根据情境的动态平衡 | 交互式天平（双滑块控制倾斜） |
| **AI 赋能 · 数字演进** | AI 是知行的数字映射：数据为知，决策为行 | 神经网络粒子 + 打字机金句轮播 + 卡片交互光效 |

---

## 功能亮点

### 🎨 主题系统
- **7 种主题 × 3 家族风格**（切主题不仅换色，还换布局 / 字体 / 装饰 / 时间线排布）：

| 家族 | 主题名 | 内部标识 | 亮暗 | 风格身份 |
|---|---|---|---|---|
| 📜 书卷（Classic） | 书卷·米白 | `light` | 亮 | 宋体衬线 · 900px 窄栏居中 · 细分割线 · 角落淡纹 |
| 🏢 工作室（Studio） | 工作室·靛蓝 | `blue` | 亮 | 无衬线粗体 · 1200px 宽屏 · 网格背景 · 卡片左侧色条 · 双栏时间线 |
|  | 工作室·紫罗兰 | `purple` | 亮 | 同上 |
|  | 工作室·青瓷 | `teal` | 亮 | 同上 |
| 🪷 哲学（Philosophic） | 哲学·深夜 | `dark` | 暗深 | 楷体混排 · 780px 阅读窄栏 · 首字下沉 · 左侧引用边条 · 墨滴晕染 · 粒子减弱 |
|  | 哲学·松绿 | `green` | 暗深暖绿 | 同上 |
|  | 哲学·琥珀 | `orange` | 暗深暖棕 | 同上 |
| 自动 | 跟随系统 | `system` | — | 系统浅 → 书卷·米白；系统暗 → 哲学·深夜 |

- 基于 **CSS 变量 + `body[data-theme-style]`** 双层切换，组件自动响应结构/排版差异
- 偏好通过 `localStorage` 持久化，刷新自动恢复
- 旧值兼容：`cyan→teal`、`default/serif_dark→light`，老用户缓存不崩溃

### 🌐 多语言（i18n）
- **3 种语言**：简体中文、繁体中文、English
- 自动检测浏览器语言，手动切换偏好本地保存
- 覆盖所有页面文案、SEO meta、aria 属性、JSON-LD 结构化数据

### 🧠 粒子系统（Canvas）
- **4 种思维模式** 一键切换
  - 有序思维：规则网格排列
  - 发散联想：自由运动 + 邻近连线
  - 专注凝聚：向中心聚拢
  - AI 思维：3 层神经网络结构 + 发光节点 + 信号流动
- `requestAnimationFrame` 驱动，60-120 粒子自适应
- 颜色跟随主题变量动态变化，支持 `prefers-reduced-motion`

### ⚖️ 知行平衡器
- 交互式天平可视化
- 双滑块独立控制"理的深度"与"行的力度"
- 横梁实时倾斜，状态文案反馈平衡/偏向

### 📜 知行节律（降级金句卡片）
- iframe 加载失败时自动显示，不空白
- **按时段自动切换主题**：
  - 晨间（6-12）理会、午后（12-18）践行
  - 晚间（18-24）合一、深夜（0-6）静思
- 每个时段 6 条金句，随机显示 3 条

### 🧩 嵌入内容（博文随笔 & 笃行成果）
- iframe 嵌入外部 Coze 站点，自动同步最新数据（博文 10 条列表 / 7喵仓库 3×4 成果网格）
- **v3.3.0 响应式高度体系**（`assets/js/extras-index.js` + `style.css` 双重兜底）：
  - `IntersectionObserver` 懒初始化：容器进入视口 200px 内才开始 20s 超时计时，避免首屏 race
  - 按 **3 档断点**（desktop > 768 / mobile ≤ 768 / small ≤ 480）分别配置 `{default, min, max}` 高度
  - postMessage 兼容 3 种上游格式：`{height}` / `{data:{height}}` / `{type:'height', value}`
  - 收到上游高度先写入 `_lastHeights{}` 再 **clamp(min/max)** 后赋值；桌面 7喵仓库被强制 ≤820px 消除底部大空白
  - `window.resize` 120ms debounce：当浏览器宽度跨越断点（S↔M↔D）时，拿最近一次收到的 raw 高度按新断点 re-clamp
  - CSS `min-height` / `max-height` 媒体查询兜底（`style.css` L517-547），JS 未执行时视觉也基本正确
  - **20000ms（20s）超时兜底**：若上游未发 postMessage，自动使用当前断点的 `default` 高度（博客 D=1100 / M=1250 / S=1300；7喵 D=780 / M=950 / S=980）
- iframe 加载失败时自动降级显示「知行节律」按时段（晨间理会/午后践行/晚间合一/深夜静思）× 6 条随机 3 金句卡片
- `?debug=1` 调试模式：控制台打印每次 postMessage 原始值、断点切换、clamp 结果
- 滚动联动粒子：到博文切换"有序"，到成果切换"专注"

### 🔤 AI 金句打字机
- Header 区域 15 条 AI × 知行合一 金句循环
- 逐字打字 / 退格效果，语言切换后重建

### 📱 响应式
- 三版本适配：PC（>768px）/ 平板（481-768px）/ 手机（≤480px）

### 🔍 SEO + GEO 完整
- `robots.txt`（含 13 种 AI 爬虫白名单）+ `sitemap.xml`（hreflang 三语）+ `feed.xml`（RSS 订阅）
- canonical URL、Open Graph、Twitter Card、JSON-LD（WebSite + TechArticle）
- 404 页面 `noindex`，避免错误索引
- **GEO（生成式引擎优化）**：`/ai.txt`（IAF 声明 + 事实锚点）+ `/ads.txt`（AI 引用条款）+ 15 项 `fact:` meta + hreflang 三语交替

---

## 技术栈

| 类别 | 选型 |
|------|------|
| 前端 | **原生 HTML / CSS / JavaScript**（零框架、零构建） |
| 字体 | Noto Sans SC（Google Fonts CDN） |
| 画布 | HTML5 Canvas API |
| 部署 | **GitHub Pages**（CNAME 自定义域名） |
| 外部嵌入 | Coze 站点 iframe（博文随笔 + 笃行成果） |

---

## 目录结构

```
w3b/
├── index.html              # 首页：粒子 / 时间线 / 平衡器 / 嵌入（博客+7喵仓库）/ 页脚
├── about.html              # 项目说明书（7 章完整文档 + 10 条事实 + changelog）
├── 404.html                # 404 错误页（noindex，3 页统一引用 ?v=x.y.z 资源版本）
├── assets/
│   ├── css/style.css       # 通用样式 + 主题变量体系 + 响应式 + v3.3.0 嵌入高度兜底（L517-547）
│   └── js/
│       ├── i18n.js         # 多语言翻译字典（zh-CN / zh-TW / en，3 语 key 对齐）
│       ├── i18n-init.js    # 首次访问语言检测 + <html lang/hreflang> 注入
│       ├── theme.js        # 主题 × 家族双层切换（7 主题 / 3 家族）+ localStorage 持久化
│       ├── particles.js    # Canvas 粒子系统（4 思维状态：有序 / 发散 / 专注 / AI 神经网络）
│       ├── balance.js      # 知行平衡器：双滑块 + 天平倾斜动画
│       ├── extras-index.js # 首页专属：IntersectionObserver 懒嵌入 + 3 档断点 clamp + resize debounce
│       └── extras-about.js # about.html 专属：锚点滚动、时间线展开、金句打字机
├── scripts/                # 提交 / 发布前校验脚本（node 运行）
│   ├── check_node_syntax.js    # 对所有 .js 做 node --check
│   ├── check_i18n_keys.js      # 三语 i18n key 集一致性 + HTML data-i18n 引用有效性
│   ├── check_jsonld.js         # about.html JSON-LD / fact meta 版本与缓存号一致性
│   └── check_sitemap.js        # sitemap.xml hreflang × 3 locale × URL 完整性
├── .github/
│   └── workflows/validate.yml  # CI：push / PR 时跑 scripts/* 四项校验
├── favicon.svg             # 站点图标
├── robots.txt              # 爬虫规则（含 13 种 AI 爬虫白名单）
├── sitemap.xml             # 站点地图（hreflang 三语交替）
├── feed.xml                # RSS 订阅源（更新日志）
├── ai.txt                  # GEO 生成式引擎声明（IAF 标准）
├── ads.txt                 # IAB 广告授权 + AI 引用条款
├── CNAME                   # GitHub Pages 自定义域名：w3b.pub
├── .gitignore              # Git 忽略规则
└── README.md               # 本文件
```

---

## 部署与维护

本项目为纯静态站点，**无需构建步骤**：

1. 代码推送到 `x2it/w3b` 仓库的 `main` 分支
2. `.github/workflows/validate.yml` 自动运行 4 项校验（JS 语法 / i18n key / JSON-LD / sitemap）
3. 通过后 GitHub Pages 自动构建并部署到 **https://w3b.pub**
4. Cloudflare CDN 缓存约 5-10 分钟刷新；修改 CSS / JS 后务必同步更新 `index.html` / `about.html` / `404.html` 中的 `?v=x.y.z` 版本号（三页保持一致，当前 `?v=3.3.3`）

### 维护小贴士

- **嵌入高度体系（v3.3.0 起）不使用固定像素常量了**；调高度直接改 2 处即可：
  1. JS 层：`assets/js/extras-index.js` 顶部的 `EMBED_CONFIGS` 字典（按 iframeId × desktop/mobile/small 三档分别改 `default / min / max`）
  2. CSS 层：`assets/css/style.css` 末尾 L517-547 的 `#blog-embed` / `#qmeow-embed` min/max-height 媒体查询，和 JS 保持一致
- **超时兜底已从 800ms 改为 20000ms（20s）**，并改为 IntersectionObserver 懒触发（元素进入 200px 根距才开始计时），不会在首屏空状态就提前超时；Coze 上游偶尔需要 5–12s 才发 `postMessage`
- 上游 `postMessage` 支持 3 种格式：`{height}` / `{data:{height}}` / `{type:'height', value}`，任何一种都会被存入 `_lastHeights[id]` 并 clamp 后应用
- iframe 加载失败（网络错误 / Content-Security-Policy 拒绝）→ 自动降级显示「知行节律」按时间段的 3 张金句卡片，不空白
- **每次修改 CSS / JS（哪怕 1 行）必须同步 bump 3 个页面的 `?v=` 查询参数**：
  - `<link rel="stylesheet" href="assets/css/style.css?v=...">`
  - 所有 `<script defer src="assets/js/*.js?v=...">`
  - 当前 3 页：`index.html` / `about.html` / `404.html` 必须完全一致（目前为 `?v=3.3.3`）
- 每次修改 `about.html` 里的版本 / changelog / 新增章节后，同步更新 **4 处叙事以保持一致**（本 README 顶部信息表、`about.html` 静态 fallback 文本、`assets/js/i18n.js` 三语 `about.*` 字典、`fact:*` meta / JSON-LD）
- 提交前本地运行：`node scripts/check_node_syntax.js` + `node scripts/check_i18n_keys.js` + `node scripts/check_jsonld.js` + `node scripts/check_sitemap.js`，全部通过再 push
- 金句字典 / i18n 文案集中在 `assets/js/i18n.js`，增删金句或翻译只需编辑这一个文件

---

## 联系交流

思以广之，行以践之。期待与你交流。

📧 **support@w3b.pub**（一般 1-2 天内回复）

---

© 2026 知行工作室 · 理会 · 践行
