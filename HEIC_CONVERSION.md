# 前端 HEIC 图片转换说明

本项目已实现前端 HEIC 图片自动转换功能,使用 `heic2any` 库在浏览器中将 HEIC 格式图片转换为 JPEG。

## 功能特点

✅ **自动检测**: 自动检测 HEIC 格式图片
✅ **智能转换**: 失败时自动触发 HEIC -> JPEG 转换
✅ **缓存机制**: 转换后的图片会被缓存,避免重复转换
✅ **降级处理**: 转换失败则尝试备用图片或隐藏

## 工作原理

### 1. 图片加载流程

```
加载图片
  ↓
图片加载失败? (onError)
  ↓
检测是否为 HEIC 格式
  ↓
是 HEIC → 下载原图 → 转换为 JPEG → 显示
  ↓
不是 HEIC → 尝试备用图片 → 隐藏
```

### 2. 核心文件

#### [src/utils/imageLoader.js](src/utils/imageLoader.js)
图片加载工具,提供以下功能:
- `loadImage(url)`: 智能加载图片,自动检测和转换 HEIC
- `clearImageCache()`: 清理缓存的 blob URL
- `preloadImages(urls)`: 预加载图片（可选）

#### [src/views/Menu.vue](src/views/Menu.vue#L236-L286)
菜单页面,集成了 HEIC 转换功能:
- `handleImageError()`: 图片加载失败时触发转换
- `getDishImageUrl()`: 获取图片 URL（优先使用转换后的）
- `convertedImageUrls`: 缓存转换后的 URL

## 使用示例

### 基本使用

```vue
<template>
  <img
    :src="imageUrl"
    @error="handleImageError($event, item)"
    alt="菜品图片"
  />
</template>

<script setup>
import { loadImage } from '@/utils/imageLoader'

const handleImageError = async (event, item) => {
  try {
    // 尝试 HEIC 转换
    const convertedUrl = await loadImage(event.target.src)
    if (convertedUrl) {
      event.target.src = convertedUrl
    }
  } catch (error) {
    console.error('图片加载失败:', error)
  }
}
</script>
```

### 预加载（可选）

```javascript
import { preloadImages } from '@/utils/imageLoader'

// 预加载多张图片
const imageUrls = dishes.map(dish => dish.image_url)
await preloadImages(imageUrls)
```

## 性能优化

### 1. 缓存机制
- 转换后的 blob URL 会被缓存在 Map 中
- 同一张图片只会转换一次
- 组件卸载时自动清理缓存

### 2. 懒加载
- HEIC 转换仅在图片加载失败时触发
- 不影响正常 JPEG/PNG 图片的加载速度

### 3. 降级处理
```
尝试加载原图
  ↓ 失败
尝试 HEIC 转换
  ↓ 失败
尝试备用图片
  ↓ 失败
隐藏图片元素
```

## 浏览器兼容性

`heic2any` 依赖以下浏览器特性:
- ✅ Chrome 76+
- ✅ Firefox 68+
- ✅ Safari 14+
- ✅ Edge 79+
- ❌ IE 11 (不支持)

## 注意事项

### 1. 转换耗时
- HEIC 转换需要 2-5 秒（取决于图片大小和设备性能）
- 首次加载会有延迟,但缓存后即时显示

### 2. 内存占用
- 每个转换后的 blob URL 会占用内存
- 组件卸载时会自动清理
- 对于大量图片,建议使用虚拟滚动

### 3. 网络流量
- HEIC 转换需要下载完整原图
- 建议在服务器端转换（如果可能）

## 与服务器端转换对比

| 特性 | 前端转换 (heic2any) | 服务器端转换 (heic-convert) |
|------|-------------------|---------------------------|
| 实现难度 | ⭐ 简单 | ⭐⭐⭐ 复杂 |
| 转换速度 | 🐢 慢 (2-5秒) | 🚀 快 (0.5-1秒) |
| 服务器成本 | ✅ 免费 | 💰 计算资源 |
| 用户体验 | ⚠️ 首次加载慢 | ✅ 即时显示 |
| Cloudflare 支持 | ✅ 支持 | ❌ 不支持 |
| Netlify 支持 | ✅ 支持 | ✅ 支持 |

## 最佳实践建议

### 方案选择

**推荐方案 1: 源头解决** ⭐⭐⭐⭐⭐
- 在飞书多维表格中直接上传 JPEG/PNG 格式
- 避免使用 HEIC 格式
- 优点: 最简单,性能最好

**方案 2: 前端转换（当前实现）** ⭐⭐⭐⭐
- 使用 heic2any 库
- 优点: 完全免费,适用于 Cloudflare
- 缺点: 首次加载略慢

**方案 3: 服务器端转换** ⭐⭐⭐
- 使用 heic-convert 库
- 优点: 转换快,用户体验好
- 缺点: Cloudflare 不支持,需要 Netlify

### 优化建议

1. **优先 JPEG/PNG**: 在飞书中上传时选择兼容格式
2. **压缩图片**: 上传前压缩图片,减少文件大小
3. **CDN 缓存**: 利用 CDN 缓存转换后的图片
4. **虚拟滚动**: 对于大量图片,使用虚拟滚动减少内存占用

## 故障排查

### 问题 1: 图片仍然无法显示

**原因**:
- 图片 URL 无效
- CORS 跨域限制
- 图片格式不支持

**解决**:
1. 检查浏览器控制台错误
2. 验证图片 URL 是否可访问
3. 检查服务器 CORS 配置

### 问题 2: 转换很慢

**原因**:
- 图片文件过大
- 设备性能较弱
- 并发转换过多

**解决**:
1. 压缩上传的图片
2. 限制并发转换数量
3. 使用预加载机制

### 问题 3: 内存占用过高

**原因**:
- 大量 blob URL 未释放
- 图片缓存过多

**解决**:
1. 定期调用 `clearImageCache()`
2. 使用虚拟滚动
3. 限制缓存数量

## 更多资源

- [heic2any 官方文档](https://github.com/alexcorvi/heic2any)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages/)
- [飞书开放平台文档](https://open.feishu.cn/document/)

---

**享受丝滑的图片加载体验!** 🚀
