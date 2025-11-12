# Netlify 部署问题修复说明 🔧

## 🐛 遇到的问题

在 Netlify 部署后，登录时出现以下错误：
- **404 错误** - `tenant_access_token` 接口返回 404
- **飞书 API 请求失败** - 状态码 404，错误码 `ERR_BAD_REQUEST`

**问题截图显示：**
```
POST https://peppy-pie-20f782.netlify.app/api/open-apis/auth/v3/tenant_access_token/internal
404 (Not Found)
```

---

## 🔍 问题原因

Netlify 的简单 redirects 配置**无法正确代理飞书 API 请求**。

### 原来的配置（有问题）：
```toml
[[redirects]]
  from = "/api/*"
  to = "https://open.feishu.cn/:splat"
  status = 200
```

**为什么会失败？**
1. Netlify 的 redirects 只能做简单的 URL 重定向
2. 无法正确处理 POST 请求体
3. 无法设置正确的请求头
4. 跨域问题无法解决

---

## ✅ 解决方案

使用 **Netlify Serverless Functions** 创建一个服务端代理。

### 1. 修改了 `netlify.toml` 配置

```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"  # ← 新增

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/feishu-proxy"  # ← 修改
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]  # ← 新增 CORS 配置
  for = "/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type"
```

### 2. 创建了 Netlify Function

**文件位置：** `netlify/functions/feishu-proxy.js`

**功能：**
- 接收前端的 API 请求
- 转发到飞书 API (`https://open.feishu.cn`)
- 处理 CORS 跨域问题
- 返回响应给前端

**工作流程：**
```
前端请求: /api/open-apis/auth/v3/tenant_access_token/internal
    ↓
Netlify Function: /.netlify/functions/feishu-proxy
    ↓
飞书 API: https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal
    ↓
返回响应给前端
```

---

## 🚀 已完成的修复步骤

✅ **步骤 1:** 修改 `netlify.toml` 配置文件
✅ **步骤 2:** 创建 `netlify/functions/feishu-proxy.js`
✅ **步骤 3:** 提交代码到 Git
✅ **步骤 4:** 推送到 GitHub
✅ **步骤 5:** Netlify 会自动重新部署（需要等待 2-3 分钟）

---

## ⏳ 下一步操作

### 1. 等待 Netlify 重新部署

1. 访问 Netlify Dashboard: https://app.netlify.com
2. 找到你的项目 `ordering-miniapp`
3. 点击 "Deploys" 查看部署状态
4. 等待部署完成（通常 2-3 分钟）

### 2. 查看部署状态

部署完成后，你会看到：
- ✅ **Published** - 部署成功
- 🔄 **Building** - 正在构建
- ❌ **Failed** - 部署失败（查看日志）

### 3. 重新测试

部署完成后：
1. 刷新你的 Netlify 网站
2. 尝试登录
3. 使用测试账号：
   - 用户名: `admin`
   - 密码: `******`（你截图中的密码）

---

## 🔍 如何检查 Function 是否工作

### 方法 1: 查看 Netlify Function 日志

1. 进入 Netlify Dashboard
2. 点击你的项目
3. 点击 "Functions" 标签
4. 找到 `feishu-proxy` 函数
5. 点击查看日志

### 方法 2: 浏览器开发者工具

1. 打开网站并按 F12
2. 切换到 "Network" 标签
3. 尝试登录
4. 查看 API 请求：
   - 请求 URL 应该是: `/api/open-apis/auth/v3/tenant_access_token/internal`
   - 状态码应该是: `200` (而不是 404)
   - 响应应该包含 `tenant_access_token`

---

## 🛠️ 如果还是有问题

### 问题 1: 部署失败

**可能原因：**
- Node.js 版本不兼容
- 依赖安装失败

**解决方案：**
1. 在 Netlify 项目设置中指定 Node.js 版本
2. 在项目根目录创建 `.nvmrc` 文件：
   ```
   18
   ```

### 问题 2: Function 超时

**错误信息：** `Function execution timed out`

**解决方案：**
- Netlify 免费版 Function 超时时间是 10 秒
- 检查飞书 API 响应时间
- 考虑添加重试机制

### 问题 3: 环境变量未生效

**检查清单：**
- [ ] 是否在 Netlify Dashboard 添加了所有环境变量？
- [ ] 变量名是否正确（包括大小写）？
- [ ] 是否触发了重新部署？

**检查方法：**
在浏览器控制台输入：
```javascript
console.log(import.meta.env)
```

---

## 📋 完整的环境变量清单

确保在 Netlify Dashboard 中添加了这些变量：

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

---

## 🎯 测试步骤

部署完成后，按照以下步骤测试：

### 1. 测试首页加载
- [ ] 访问网站首页
- [ ] 检查是否正常显示登录页面
- [ ] 没有 JavaScript 错误

### 2. 测试登录功能
- [ ] 输入用户名和密码
- [ ] 点击登录按钮
- [ ] 检查 Network 中的 API 请求
- [ ] 应该返回 200 状态码

### 3. 测试菜单加载
- [ ] 登录成功后进入菜单页
- [ ] 检查是否能看到菜品列表
- [ ] 检查是否能看到公告

### 4. 测试下单功能
- [ ] 添加菜品到购物车
- [ ] 进入购物车页面
- [ ] 点击"立即下单"
- [ ] 检查订单是否创建成功

---

## 📞 需要帮助？

如果修复后还有问题，请提供以下信息：

1. **Netlify 部署日志**（在 Deploys 页面查看）
2. **浏览器控制台错误信息**（F12 → Console）
3. **Network 标签的 API 请求详情**
4. **Function 日志**（如果有）

---

## ✨ 预期结果

修复成功后，你应该看到：
- ✅ 登录成功，没有 404 错误
- ✅ 能够正常加载菜单和公告
- ✅ 能够添加菜品到购物车
- ✅ 能够成功下单

---

## 🎉 总结

**问题：** Netlify 简单 redirects 无法代理 POST 请求
**解决：** 使用 Netlify Serverless Functions 实现服务端代理
**状态：** 代码已推送，等待 Netlify 自动部署完成

大约 **2-3 分钟后**，刷新页面并重新测试登录功能！
