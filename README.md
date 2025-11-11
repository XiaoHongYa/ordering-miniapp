# 点餐小程序Demo

基于Vue 3 + Vite + Vant 4 + 飞书Wiki多维表格开发的点餐小程序。

## 项目特点

- ✅ 使用Vue 3 Composition API
- ✅ Vant 4移动端UI组件库
- ✅ Pinia状态管理
- ✅ 飞书Wiki多维表格作为后端数据源
- ✅ 完整的购物车功能
- ✅ 直接下单流程

## 技术栈

- **前端框架**: Vue 3
- **构建工具**: Vite 5
- **UI组件库**: Vant 4
- **状态管理**: Pinia
- **HTTP客户端**: Axios
- **路由**: Vue Router 4
- **数据源**: 飞书Wiki多维表格API

## 功能模块

### 1. 用户登录
- 账号密码登录
- 从飞书多维表格验证用户信息
- 登录状态持久化

### 2. 菜单浏览
- 商家公告展示
- 菜品分类导航
- 菜品列表展示
- 商品加入购物车

### 3. 购物车
- 查看已选商品
- 修改商品数量
- 计算总价
- 直接下单

### 4. 订单提交
- 生成订单号
- 订单数据写入飞书多维表格
- 订单成功页面展示

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化测试数据

有两种方式添加测试数据:

#### 方式1: 自动初始化脚本(推荐尝试)
```bash
npm run init-data
```

如果遇到权限问题,请使用方式2。

#### 方式2: 手动添加数据(推荐)
请参考 [手动添加测试数据指南.md](./手动添加测试数据指南.md) 直接在飞书多维表格中添加数据。

**必须添加的最少数据**:
- 用户表: 至少1个测试用户 (test/123456)
- 商家公告表: 至少1条公告
- 菜品分类表: 至少2个分类
- 菜品表: 至少5道菜品(需关联分类)

### 3. 配置环境变量

项目已包含 `.env` 文件,配置了以下信息:

```env
# 飞书应用配置
VITE_FEISHU_APP_ID=cli_a9870d3a78b4d00c
VITE_FEISHU_APP_SECRET=ojOTmuycdC2NiCjCCGDechvcGU4PCtqB

# Wiki多维表格配置
VITE_FEISHU_APP_TOKEN=H6RubLi8aadl13sUFGscl8WKn2f

# 各表Table ID
VITE_FEISHU_USERS_TABLE_ID=tblu886lTbkK6M9Y
VITE_FEISHU_ANNOUNCEMENTS_TABLE_ID=tblXlmOtsddXhZkg
VITE_FEISHU_CATEGORIES_TABLE_ID=tblsowH9WdUHkDwa
VITE_FEISHU_DISHES_TABLE_ID=tblu0rGzAh8vYd90
VITE_FEISHU_ORDERS_TABLE_ID=tblzlmAxzGG1Rxqb
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 5. 登录测试

使用测试账号登录:
- 用户名: test
- 密码: 123456

### 6. 构建生产版本

```bash
npm run build
```

## 飞书多维表格配置

### Wiki知识库
https://hx9pg0opel7.feishu.cn/wiki/Einjw3fPoiw0UKk4WVOcu6l6nLe

### 数据表结构

#### 用户表 (users)
- username: 文本 - 用户账号
- password: 文本 - 用户密码
- name: 文本 - 用户姓名
- status: 单选 - 用户状态（启用/禁用）

#### 商家公告表 (announcements)
- title: 文本 - 公告标题
- content: 多行文本 - 公告内容
- status: 单选 - 公告状态（启用/禁用）
- created_time: 创建时间 - 发布时间

#### 菜品分类表 (categories)
- name: 文本 - 分类名称
- sort_order: 数字 - 排序序号
- status: 单选 - 分类状态（启用/禁用）

#### 菜品表 (dishes)
- name: 文本 - 菜品名称
- description: 多行文本 - 菜品描述
- price: 数字 - 菜品价格
- image_url: 超链接 - 菜品图片链接
- category_id: 单向关联 - 关联分类表
- status: 单选 - 菜品状态（上架/下架）
- sort_order: 数字 - 排序序号

#### 订单表 (orders)
- order_no: 文本 - 订单号
- username: 文本 - 用户账号
- total_amount: 数字 - 订单总金额
- total_quantity: 数字 - 商品总数量
- dishes_detail: 多行文本 - 订单明细JSON
- status: 单选 - 订单状态（待处理/已完成/已取消）
- order_time: 创建时间 - 下单时间

## 项目结构

```
点餐小程序V2/
├── src/
│   ├── api/              # API接口
│   │   └── feishu.js     # 飞书API封装
│   ├── router/           # 路由配置
│   │   └── index.js
│   ├── stores/           # Pinia状态管理
│   │   ├── cart.js       # 购物车store
│   │   └── user.js       # 用户store
│   ├── styles/           # 全局样式
│   │   └── global.css
│   ├── utils/            # 工具函数
│   │   └── request.js    # axios封装
│   ├── views/            # 页面组件
│   │   ├── Login.vue     # 登录页
│   │   ├── Menu.vue      # 菜单页
│   │   ├── Cart.vue      # 购物车页
│   │   └── OrderSuccess.vue  # 订单成功页
│   ├── App.vue           # 根组件
│   └── main.js           # 入口文件
├── .env                  # 环境变量
├── index.html            # HTML模板
├── package.json          # 项目配置
├── vite.config.js        # Vite配置
├── 产品文档.md           # 产品文档
├── 备注.md               # 配置备注
└── README.md             # 项目说明

## 页面路由

- `/login` - 登录页面
- `/menu` - 菜单页面（首页）
- `/cart` - 购物车页面
- `/order-success` - 订单成功页面

## API接口说明

### 用户登录
```javascript
loginUser(username, password)
```

### 获取公告
```javascript
getAnnouncements()
```

### 获取分类
```javascript
getCategories()
```

### 获取菜品
```javascript
getDishes(categoryId)
```

### 创建订单
```javascript
createOrder(orderData)
```

## 注意事项

1. **跨域问题**: 项目使用Vite代理解决飞书API跨域问题
2. **认证方式**: 使用tenant_access_token认证
3. **数据格式**: 订单明细以JSON字符串存储
4. **状态管理**: 购物车数据仅保存在内存中,刷新页面会清空

## 开发建议

1. 在飞书多维表格中添加测试数据
2. 确保飞书应用有正确的API权限
3. 图片URL建议使用CDN地址
4. 建议添加图片占位符处理

## 许可证

MIT
