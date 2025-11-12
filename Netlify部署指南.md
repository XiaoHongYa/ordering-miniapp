# Netlify 部署指南 🚀

## 📋 已完成的准备工作 ✅

- ✅ Netlify CLI 已安装
- ✅ 项目已构建（dist 目录已生成）
- ✅ netlify.toml 配置文件已创建
- ✅ 代码已推送到 GitHub

---

## 🌐 方法一：通过 Netlify 网站部署（推荐，最简单）

### 步骤 1: 访问 Netlify 并登录

1. 打开浏览器，访问 [https://www.netlify.com](https://www.netlify.com)
2. 点击右上角 "Sign up"（注册）或 "Log in"（登录）
3. **选择 "Sign up with GitHub"**（使用 GitHub 登录）
4. 授权 Netlify 访问你的 GitHub 账号

### 步骤 2: 导入项目

1. 登录后，点击 **"Add new site"** → **"Import an existing project"**
2. 选择 **"Deploy with GitHub"**
3. 如果是第一次使用，需要授权 Netlify 访问 GitHub
4. 在仓库列表中找到 **`XiaoHongYa/ordering-miniapp`**
5. 点击仓库名称

### 步骤 3: 配置构建设置

Netlify 会自动检测到配置，显示：

```
Build command: npm run build
Publish directory: dist
```

**这些配置是自动读取的，不需要修改！** ✅

### 步骤 4: 添加环境变量 ⚠️ 重要

在 "Environment variables" 部分，点击 "Add environment variables"，添加以下变量：

| Key | Value |
|-----|-------|
| `VITE_FEISHU_APP_ID` | `cli_a9870d3a78b4d00c` |
| `VITE_FEISHU_APP_SECRET` | `ojOTmuycdC2NiCjCCGDechvcGU4PCtqB` |
| `VITE_FEISHU_APP_TOKEN` | `WcmNbFvM5aRWdVsegQZcLa9gnme` |
| `VITE_FEISHU_USERS_TABLE_ID` | `tblMcU3ARUym0D9r` |
| `VITE_FEISHU_ANNOUNCEMENTS_TABLE_ID` | `tbldDeIqvmMcSrk3` |
| `VITE_FEISHU_CATEGORIES_TABLE_ID` | `tblmLLQ8ABAtajyF` |
| `VITE_FEISHU_DISHES_TABLE_ID` | `tbld6sMF5ufDqh8Q` |
| `VITE_FEISHU_ORDERS_TABLE_ID` | `tblKtV1OA1MPVodf` |
| `VITE_API_BASE_URL` | `/api` |

**添加方式：**
1. 点击 "New variable" 按钮
2. 在 "Key" 输入变量名
3. 在 "Value" 输入对应的值
4. 点击 "Add" 或 "Save"
5. 重复以上步骤，添加所有 9 个环境变量

### 步骤 5: 部署

1. 确认所有配置正确
2. 点击 **"Deploy [项目名]"** 按钮
3. 等待部署完成（通常 1-3 分钟）

### 步骤 6: 获取访问地址

部署成功后，Netlify 会分配一个域名，格式如：

```
https://随机名称.netlify.app
```

例如：
```
https://magnificent-unicorn-abc123.netlify.app
```

点击这个链接即可访问你的点餐小程序！

---

## 💻 方法二：通过 CLI 部署

### 步骤 1: 登录 Netlify

在终端运行：

```bash
netlify login
```

这会打开浏览器，要求你授权。点击 "Authorize" 授权即可。

### 步骤 2: 初始化项目

```bash
netlify init
```

按照提示操作：

1. **What would you like to do?**
   - 选择：`Create & configure a new site`

2. **Team:**
   - 选择你的团队（通常是你的账户名）

3. **Site name (optional):**
   - 输入：`ordering-miniapp`（或留空使用随机名称）

4. **Your build command:**
   - 输入：`npm run build`（或直接回车，会自动读取 netlify.toml）

5. **Directory to deploy:**
   - 输入：`dist`（或直接回车）

### 步骤 3: 配置环境变量

有两种方式配置环境变量：

#### 方式 A：通过网站配置（推荐）

1. 部署后访问 Netlify Dashboard
2. 进入你的项目
3. 点击 "Site settings" → "Environment variables"
4. 点击 "Add a variable"
5. 添加所有 9 个环境变量（见上面的表格）

#### 方式 B：通过 CLI 配置

```bash
# 为了避免手动输入，我们可以使用 env:import 命令
netlify env:import .env
```

但这需要你先创建一个 `.env` 文件（不要提交到 Git）。

### 步骤 4: 部署

```bash
netlify deploy --prod
```

等待部署完成，会显示访问地址。

---

## 🔄 后续更新代码

每次修改代码后，有两种更新方式：

### 方式 1：自动部署（推荐）

只需推送到 GitHub，Netlify 会自动重新部署：

```bash
git add .
git commit -m "更新描述"
git push github feature/ordering-system:main
```

### 方式 2：手动部署

```bash
npm run build
netlify deploy --prod
```

---

## 🎨 自定义域名（可选）

如果你有自己的域名：

### 步骤：

1. 在 Netlify Dashboard 进入你的项目
2. 点击 "Domain settings"
3. 点击 "Add custom domain"
4. 输入你的域名（如：`order.yourdomain.com`）
5. 在你的域名服务商添加 DNS 记录：
   ```
   类型: CNAME
   主机记录: order
   记录值: [Netlify提供的地址]
   TTL: 600
   ```
6. 等待 DNS 生效（5-30 分钟）
7. Netlify 会自动配置免费 HTTPS 证书

---

## 🌐 测试网站访问

### 国内测试工具：

1. **拨测工具**
   - 访问 https://www.17ce.com
   - 输入你的 Netlify 网址
   - 查看全国访问情况

2. **本地测试**
   ```bash
   curl -I https://你的网站.netlify.app
   ```

---

## 🛠️ 常见问题

### Q1: 部署成功但页面空白

**原因：** 环境变量未配置或配置错误

**解决方案：**
1. 检查 Netlify Dashboard 中的环境变量
2. 确保所有 9 个变量都已添加
3. 变量名必须完全一致（包括大小写）
4. 触发重新部署：
   - 方式 1：推送新代码
   - 方式 2：在 Netlify Dashboard 点击 "Trigger deploy"

### Q2: API 请求失败

**原因：** netlify.toml 配置问题

**解决方案：**
- 确保 `netlify.toml` 文件已提交到 Git
- 检查文件内容是否正确
- 重新部署

### Q3: 访问速度慢

**原因：** Netlify 的 CDN 需要预热

**解决方案：**
- 第一次访问会慢一些，之后会快很多
- 多刷新几次页面
- 考虑使用国内平台（如腾讯云 Webify）

### Q4: 环境变量更新后未生效

**解决方案：**
1. 更新环境变量后需要重新部署
2. 在 Netlify Dashboard 点击 "Deploys" → "Trigger deploy" → "Deploy site"

---

## 📊 查看部署状态

### 在 Netlify Dashboard：

1. 访问 https://app.netlify.com
2. 选择你的项目
3. 可以查看：
   - 部署历史（Deploys）
   - 访问日志（Analytics）
   - 构建日志（Deploy logs）
   - 环境变量（Site settings → Environment variables）

---

## ✅ 部署检查清单

部署前确认：
- [ ] 已在 Netlify 注册并登录
- [ ] 已连接 GitHub 账号
- [ ] 已导入 `ordering-miniapp` 仓库
- [ ] 已添加所有 9 个环境变量
- [ ] 部署成功并能访问网站
- [ ] 测试登录功能
- [ ] 测试菜品加载
- [ ] 测试下单功能

---

## 🎯 Netlify vs Vercel 对比

| 特性 | Netlify | Vercel |
|------|---------|--------|
| 国内访问 | ⚠️ 部分地区可访问 | ❌ 不稳定 |
| 免费额度 | 100GB 带宽/月 | 无限 |
| 构建时间 | 300分钟/月 | 6000分钟/月 |
| 自动部署 | ✅ 支持 | ✅ 支持 |
| 自定义域名 | ✅ 免费 | ✅ 免费 |
| HTTPS | ✅ 自动配置 | ✅ 自动配置 |

---

## 🚀 快速命令参考

```bash
# 登录
netlify login

# 初始化项目
netlify init

# 本地预览
netlify dev

# 部署（测试）
netlify deploy

# 部署（生产）
netlify deploy --prod

# 查看站点信息
netlify status

# 打开站点
netlify open

# 查看部署日志
netlify logs
```

---

## 📚 相关资源

- [Netlify 官方文档](https://docs.netlify.com/)
- [Netlify CLI 文档](https://docs.netlify.com/cli/get-started/)
- [环境变量配置](https://docs.netlify.com/environment-variables/overview/)

---

## 🎉 完成！

现在你的点餐小程序已经部署到 Netlify，国内大部分地区都可以访问了！

**下一步：**
- 将 Netlify 网址分享给朋友体验
- 监控访问情况
- 如果需要更稳定的国内访问，考虑使用腾讯云 Webify

祝使用愉快！ 🚀
