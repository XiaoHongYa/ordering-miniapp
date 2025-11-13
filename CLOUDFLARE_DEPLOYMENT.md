# Cloudflare Pages 部署指南

本指南将帮助你将项目部署到 Cloudflare Pages + Workers。

## 为什么选择 Cloudflare？

- ✅ **国内访问友好**: Cloudflare CDN 在中国可以正常访问
- ✅ **完全免费**: 免费套餐包含 100,000 次请求/天，足够个人项目使用
- ✅ **性能优越**: 全球 CDN 加速，响应速度快
- ✅ **易于部署**: 直接连接 GitHub，自动构建和部署

## 重要说明: HEIC 图片转换限制

⚠️ **Cloudflare Workers 不支持 HEIC 图片转换**

Cloudflare Workers 运行时不支持需要原生模块的库（如 `heic-convert`），因此无法在服务器端将 HEIC 图片转换为 JPEG。

### 解决方案选项:

**方案 1: 前端转换（推荐，免费）**
- 安装 `heic2any` 库在前端进行转换
- 优点: 完全免费，不依赖服务器
- 缺点: 首次加载时需要下载和转换，略慢

**方案 2: 使用 Cloudflare Images（付费）**
- 启用 Cloudflare Images 服务
- 自动转换和优化所有图片格式
- 费用: $5/月 + $1/100,000 次请求

**方案 3: 源头解决（推荐）**
- 在飞书多维表格中，直接上传 JPEG/PNG 格式图片
- 避免使用 HEIC 格式
- 优点: 最简单，无需额外处理

**当前实现**: 项目已配置为直接返回原始图片。对于 HEIC 格式:
- iOS 设备可以正常显示
- 部分浏览器可能无法显示
- 建议使用方案 1 或方案 3

## 部署步骤

### 1. 准备 GitHub 仓库

确保你的代码已推送到 GitHub:

```bash
git add .
git commit -m "准备部署到 Cloudflare Pages"
git push origin main
```

### 2. 创建 Cloudflare Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击左侧菜单 **Workers & Pages**
3. 点击 **Create application** > **Pages** > **Connect to Git**
4. 选择你的 GitHub 仓库
5. 配置构建设置:
   - **Project name**: `diancan-miniprogram`（或自定义）
   - **Production branch**: `main`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`（项目根目录）

### 3. 配置环境变量

在 Cloudflare Pages 项目设置中添加环境变量:

1. 进入项目 > **Settings** > **Environment variables**
2. 添加以下变量（**Production** 和 **Preview** 都要添加）:

```
VITE_FEISHU_APP_ID=cli_xxxxxxxxxxxxx
VITE_FEISHU_APP_SECRET=xxxxxxxxxxxxx
VITE_FEISHU_APP_TOKEN=xxxxxxxxxxxxx
VITE_FEISHU_USERS_TABLE_ID=xxxxxxxxxxxxx
VITE_FEISHU_ANNOUNCEMENTS_TABLE_ID=xxxxxxxxxxxxx
VITE_FEISHU_CATEGORIES_TABLE_ID=xxxxxxxxxxxxx
VITE_FEISHU_DISHES_TABLE_ID=xxxxxxxxxxxxx
VITE_FEISHU_ORDERS_TABLE_ID=xxxxxxxxxxxxx
VITE_FEISHU_ORDER_DETAILS_TABLE_ID=xxxxxxxxxxxxx
```

⚠️ **注意**: 不要把 `.env` 文件提交到 GitHub！使用 Cloudflare Dashboard 配置环境变量。

### 4. 部署

1. 点击 **Save and Deploy**
2. Cloudflare 会自动:
   - 拉取代码
   - 安装依赖（`npm install`）
   - 构建项目（`npm run build`）
   - 部署到全球 CDN

3. 部署完成后，你会得到一个 `.pages.dev` 域名，例如:
   ```
   https://diancan-miniprogram.pages.dev
   ```

### 5. 绑定自定义域名（可选）

1. 进入项目 > **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（需要域名已托管在 Cloudflare）
4. 按照提示配置 DNS

## API 路由说明

Cloudflare Pages 会自动将 `/functions` 目录下的文件作为 API 端点:

- `/api/*` → `functions/api/[[path]].js` (飞书 API 代理)
- `/image-proxy` → `functions/image-proxy.js` (图片下载代理)

## 验证部署

部署完成后，访问你的站点:

1. 检查登录功能是否正常
2. 检查菜品列表是否加载
3. 检查图片是否显示（HEIC 图片可能不显示）
4. 检查下单功能是否正常

## 常见问题

### Q1: 图片无法显示

**原因**: 可能是 HEIC 格式图片。

**解决**:
- 检查浏览器控制台错误
- 尝试在飞书中上传 JPEG/PNG 格式图片
- 或实现前端 HEIC 转换（使用 `heic2any`）

### Q2: API 请求失败

**原因**: 环境变量未配置或配置错误。

**解决**:
1. 检查 Cloudflare Pages > Settings > Environment variables
2. 确保所有 `VITE_FEISHU_*` 变量都已配置
3. 重新部署项目（Settings > Deployments > Retry deployment）

### Q3: 构建失败

**原因**: 依赖安装失败或构建命令错误。

**解决**:
1. 检查 `package.json` 中的依赖是否正确
2. 确保 `npm run build` 在本地可以成功运行
3. 查看 Cloudflare 构建日志，找到具体错误

### Q4: 国内访问慢

**解决**:
- Cloudflare 在国内访问速度已经很不错
- 如果还是慢，可以考虑:
  - 使用 Cloudflare 的 Argo Smart Routing（付费）
  - 或迁移到国内云服务商（阿里云、腾讯云等）

## 与 Netlify 的对比

| 特性 | Cloudflare Pages | Netlify |
|------|------------------|---------|
| 国内访问 | ✅ 良好 | ⚠️ 较慢 |
| 免费额度 | 100,000 次请求/天 | 300 积分/月 |
| HEIC 转换 | ❌ 不支持 | ✅ 支持 |
| 构建速度 | 快 | 快 |
| 自定义域名 | ✅ 免费 | ✅ 免费 |

## 后续优化建议

1. **图片格式**: 统一使用 JPEG/PNG，避免 HEIC
2. **CDN 缓存**: 已配置 30 天缓存，图片加载会很快
3. **监控**: 使用 Cloudflare Analytics 监控访问情况
4. **性能**: 考虑启用 Cloudflare 的 Auto Minify 功能

## 需要帮助？

- [Cloudflare Pages 官方文档](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [飞书开放平台文档](https://open.feishu.cn/document/)

---

**部署愉快！** 🚀
