# Vercel 部署指南 🚀

本指南将帮助你将点餐小程序部署到 Vercel，让其他人可以通过公网访问。

## 📋 部署前准备

### 1. 确保代码已提交到 Git 仓库

```bash
# 查看当前状态
git status

# 添加所有文件（如果有未提交的更改）
git add .

# 提交更改
git commit -m "准备部署到 Vercel"
```

### 2. 推送到 GitHub（如果还没有）

```bash
# 如果还没有创建 GitHub 仓库，先在 GitHub 上创建一个新仓库
# 然后关联并推送

# 关联远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送代码
git push -u origin main
# 或者
git push -u origin master
```

## 🌐 方法一：通过 Vercel 网站部署（推荐，最简单）

### 步骤 1: 访问 Vercel

1. 打开 [https://vercel.com](https://vercel.com)
2. 点击 "Sign Up" 或 "Log In"
3. 使用 GitHub 账号登录（推荐）

### 步骤 2: 导入项目

1. 登录后，点击 "Add New..." → "Project"
2. 选择 "Import Git Repository"
3. 找到你的项目仓库并点击 "Import"

### 步骤 3: 配置项目

Vercel 会自动检测到这是一个 Vite 项目，默认配置如下：
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

**无需修改这些配置，直接进入下一步**

### 步骤 4: 配置环境变量 ⚠️ 重要

在 "Environment Variables" 部分，添加以下环境变量：

```
VITE_FEISHU_APP_ID=cli_a9870d3a78b4d00c
VITE_FEISHU_APP_SECRET=ojOTmuycdC2NiCjCCGDechvcGU4PCtqB
VITE_FEISHU_APP_TOKEN=WcmNbFvM5aRWdVsegQZcLa9gnme
VITE_FEISHU_USERS_TABLE_ID=tblMcU3ARUym0D9r
VITE_FEISHU_ANNOUNCEMENTS_TABLE_ID=tbldDeIqvmMcSrk3
VITE_FEISHU_CATEGORIES_TABLE_ID=tblmLLQ8ABAtajyF
VITE_FEISHU_DISHES_TABLE_ID=tbld6sMF5ufDqh8Q
VITE_FEISHU_ORDERS_TABLE_ID=tblKtV1OA1MPVodf
VITE_API_BASE_URL=/api
```

**添加方式：**
- 在 "Name" 输入框输入变量名（如 `VITE_FEISHU_APP_ID`）
- 在 "Value" 输入框输入对应的值
- 点击 "Add" 按钮
- 重复以上步骤，添加所有环境变量

### 步骤 5: 部署

1. 确认所有配置正确
2. 点击 "Deploy" 按钮
3. 等待部署完成（通常需要 1-2 分钟）

### 步骤 6: 访问你的网站

部署成功后，Vercel 会分配一个域名，格式如：
```
https://你的项目名.vercel.app
```

点击这个链接即可访问你的点餐小程序！

---

## 💻 方法二：通过 Vercel CLI 部署

### 步骤 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2: 登录 Vercel

```bash
vercel login
```

按照提示登录（会打开浏览器）

### 步骤 3: 部署项目

在项目根目录运行：

```bash
vercel
```

按照提示操作：
1. **Set up and deploy**: 选择 `Y`
2. **Which scope**: 选择你的账号
3. **Link to existing project**: 选择 `N`（首次部署）
4. **What's your project's name**: 输入项目名或直接回车使用默认名
5. **In which directory is your code located**: 直接回车（当前目录）
6. **Want to override the settings**: 选择 `N`

### 步骤 4: 配置环境变量

```bash
# 添加环境变量
vercel env add VITE_FEISHU_APP_ID
# 然后输入值: cli_a9870d3a78b4d00c

vercel env add VITE_FEISHU_APP_SECRET
# 输入值: ojOTmuycdC2NiCjCCGDechvcGU4PCtqB

vercel env add VITE_FEISHU_APP_TOKEN
# 输入值: WcmNbFvM5aRWdVsegQZcLa9gnme

vercel env add VITE_FEISHU_USERS_TABLE_ID
# 输入值: tblMcU3ARUym0D9r

vercel env add VITE_FEISHU_ANNOUNCEMENTS_TABLE_ID
# 输入值: tbldDeIqvmMcSrk3

vercel env add VITE_FEISHU_CATEGORIES_TABLE_ID
# 输入值: tblmLLQ8ABAtajyF

vercel env add VITE_FEISHU_DISHES_TABLE_ID
# 输入值: tbld6sMF5ufDqh8Q

vercel env add VITE_FEISHU_ORDERS_TABLE_ID
# 输入值: tblKtV1OA1MPVodf

vercel env add VITE_API_BASE_URL
# 输入值: /api
```

### 步骤 5: 重新部署以应用环境变量

```bash
vercel --prod
```

---

## 🔄 后续更新

每次代码更新后，只需：

### 方法一（自动部署）：
```bash
git add .
git commit -m "更新描述"
git push
```
推送到 GitHub 后，Vercel 会自动重新部署！

### 方法二（手动部署）：
```bash
vercel --prod
```

---

## 📱 分享给其他人

部署成功后，你可以将 Vercel 提供的网址分享给其他人：

```
https://你的项目名.vercel.app
```

**建议：**
- 在移动端浏览器中打开效果最佳
- 可以将网址生成二维码，方便手机扫码访问

---

## 🎨 自定义域名（可选）

如果你有自己的域名：

1. 在 Vercel 项目设置中找到 "Domains"
2. 点击 "Add" 添加你的域名
3. 按照提示配置 DNS 记录
4. 等待 DNS 生效（通常几分钟到几小时）

---

## 🛠️ 常见问题

### Q1: 部署后登录失败或菜品加载失败

**原因：** 环境变量配置错误或未配置

**解决方案：**
1. 在 Vercel 项目设置中检查环境变量
2. 确保所有环境变量都已正确添加
3. 重新部署项目

### Q2: API 请求失败（CORS 错误）

**原因：** 飞书 API 跨域问题

**解决方案：**
- `vercel.json` 文件已配置了代理
- 确保该文件已提交到 Git 仓库
- 检查浏览器控制台的具体错误信息

### Q3: 构建失败

**常见原因：**
1. `package.json` 中的依赖版本问题
2. Node.js 版本不兼容

**解决方案：**
```bash
# 本地测试构建
npm run build

# 如果本地构建成功但 Vercel 失败，可能是 Node.js 版本问题
# 在项目根目录创建 .node-version 文件
echo "18" > .node-version
```

### Q4: 环境变量更新后没有生效

**解决方案：**
1. 在 Vercel 中修改环境变量后
2. 需要触发重新部署：
   - 推送新的代码，或
   - 在 Vercel Deployments 页面点击 "Redeploy"

---

## 📊 查看部署状态

1. 访问 [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 可以查看：
   - 部署历史
   - 访问日志
   - 性能分析
   - 环境变量配置

---

## ✅ 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] 在 Vercel 中导入项目
- [ ] 配置了所有环境变量（9 个）
- [ ] 部署成功并能访问网站
- [ ] 测试登录功能
- [ ] 测试菜品加载
- [ ] 测试下单功能

---

## 🎉 完成！

现在你的点餐小程序已经部署到公网，任何人都可以通过 Vercel 提供的网址访问了！

**下一步：**
- 将网址分享给朋友体验
- 考虑自定义域名
- 监控访问数据

祝使用愉快！ 🚀
