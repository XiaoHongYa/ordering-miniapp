# 解决方案: Wiki多维表格读写问题

## 📋 问题描述

在测试飞书API时,所有表格操作都返回以下错误:

```
❌ 请求异常: { code: 91402, msg: 'NOTEXIST', data: {} }
```

这导致无法:
- ❌ 读取用户数据(登录功能失效)
- ❌ 读取菜品和分类(菜单页面无法显示)
- ❌ 写入订单数据(下单功能失效)

---

## ✅ 根本原因分析

根据参考文档《飞书多维表格读写完整指南-含Wiki表格.md》,问题有两个:

### 1. Wiki Token配置错误 ❌

**错误配置:**
```env
VITE_FEISHU_APP_TOKEN=H6RubLi8aadl13sUFGscl8WKn2f  # 这不是Wiki Token!
```

**正确配置:**
```env
# Wiki URL: https://hx9pg0opel7.feishu.cn/wiki/Einjw3fPoiw0UKk4WVOcu6l6nLe
#                                              ↑ 这才是Wiki Token
VITE_FEISHU_APP_TOKEN=Einjw3fPoiw0UKk4WVOcu6l6nLe
```

### 2. 应用未添加为Wiki协作者 ❌

即使Wiki Token正确,如果应用没有被添加为Wiki协作者,仍然会报错:
```
code: 91402, msg: 'NOTEXIST'
```

这是Wiki表格的**权限保护机制**。

---

## 🔧 已完成的修复

### ✅ 修复1: 更新Wiki Token

已更新 `.env` 文件:

```diff
# 飞书应用配置
VITE_FEISHU_APP_ID=cli_a9870d3a78b4d00c
VITE_FEISHU_APP_SECRET=ojOTmuycdC2NiCjCCGDechvcGU4PCtqB

# Wiki多维表格配置
-VITE_FEISHU_APP_TOKEN=H6RubLi8aadl13sUFGscl8WKn2f
+# Wiki URL: https://hx9pg0opel7.feishu.cn/wiki/Einjw3fPoiw0UKk4WVOcu6l6nLe
+# Wiki Token就是URL中 /wiki/ 后面的部分
+VITE_FEISHU_APP_TOKEN=Einjw3fPoiw0UKk4WVOcu6l6nLe
```

### ✅ 修复2: 创建测试脚本

创建了 `scripts/test-feishu-api.js` 用于诊断API访问问题。

当前测试结果:
- ✅ Token获取成功
- ❌ 所有表都返回 `code: 91402` (未添加为协作者)

### ✅ 修复3: 创建权限配置指南

创建了详细的配置指南: [飞书Wiki权限配置指南.md](./飞书Wiki权限配置指南.md)

---

## 🎯 待完成: 用户操作

**需要您完成最关键的一步: 将应用添加为Wiki协作者**

### 操作步骤:

1. 打开Wiki知识库:
   ```
   https://hx9pg0opel7.feishu.cn/wiki/Einjw3fPoiw0UKk4WVOcu6l6nLe
   ```

2. 点击页面右上角的 **"..."** → **"协作"**

3. 点击 **"添加协作者"**

4. 搜索应用:
   - 搜索应用名称
   - 或搜索 App ID: `cli_a9870d3a78b4d00c`

5. 设置权限为 **"可编辑"** (因为需要写入订单)

6. 保存设置

### 验证配置:

完成后运行测试脚本:

```bash
node scripts/test-feishu-api.js
```

**成功的输出应该是:**

```
✅ Token获取成功
✅ 成功获取 4 个字段:
   1. username (文本)
   2. password (文本)
   3. name (文本)
   4. status (单选)

✅ 成功查询到 X 条记录
✅ 成功创建记录 (订单表测试)
```

---

## 📊 配置前后对比

| 项目 | 配置前 | 配置后 |
|-----|-------|--------|
| Wiki Token | ❌ H6RubLi8aadl13sUFGscl8WKn2f | ✅ Einjw3fPoiw0UKk4WVOcu6l6nLe |
| 错误代码 | 1254041 (TableIdNotFound) | 91402 (NOTEXIST) |
| 登录功能 | ❌ 失败 | ⏳ 待协作者配置后可用 |
| 菜单显示 | ❌ 失败 | ⏳ 待协作者配置后可用 |
| 订单写入 | ❌ 失败 | ⏳ 待协作者配置后可用 |

---

## 🎉 配置完成后的效果

配置正确后,整个Demo将完全可用:

1. ✅ **用户登录** - 可以使用test/123456登录
2. ✅ **查看公告** - 首页显示商家公告
3. ✅ **浏览菜单** - 左侧分类,右侧菜品
4. ✅ **购物车** - 添加/删除商品,计算总价
5. ✅ **下单** - 提交订单到飞书多维表格
6. ✅ **订单成功页** - 显示订单号和金额

---

## 📚 相关文档

1. [飞书Wiki权限配置指南.md](./飞书Wiki权限配置指南.md) - 详细的权限配置步骤
2. [飞书多维表格读写完整指南-含Wiki表格.md](/users/anker/Documents/speckit/自动澄清系统/飞书多维表格读写完整指南-含Wiki表格.md) - 参考文档
3. [备注.md](./备注.md) - 所有配置信息汇总
4. `scripts/test-feishu-api.js` - API测试诊断脚本

---

## ⚠️ 重要提示

**为什么不能直接使用MCP工具添加数据?**

根据您之前的要求:
> "不要使用飞书mcp来添加数据,使用飞书应用的方式去添加数据"

所以我们使用的是:
- ✅ 飞书应用的 `tenant_access_token` 认证
- ✅ 直接调用飞书Open API
- ✅ 符合生产环境的最佳实践

但这需要正确的权限配置,所以必须将应用添加为Wiki协作者。

---

**下一步:** 请按照指南配置Wiki协作者权限,然后运行测试脚本验证! 🚀
