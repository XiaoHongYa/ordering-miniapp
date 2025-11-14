/**
 * 图片加载队列管理器 - 控制并发请求数量，避免触发 API 频率限制
 */

class ImageQueue {
  constructor(options = {}) {
    this.maxConcurrent = options.maxConcurrent || 3 // 最大并发数
    this.delayBetweenRequests = options.delayBetweenRequests || 500 // 每个请求之间的延迟（毫秒）
    this.queue = [] // 等待队列
    this.activeRequests = 0 // 当前活跃请求数
    this.loadedImages = new Map() // 已加载的图片缓存
  }

  /**
   * 添加图片加载任务到队列
   * @param {string} url - 图片 URL
   * @param {HTMLImageElement} imgElement - img 元素
   * @returns {Promise} - 加载完成的 Promise
   */
  async loadImage(url, imgElement) {
    // 如果已经加载过，直接返回缓存的 URL
    if (this.loadedImages.has(url)) {
      const cachedUrl = this.loadedImages.get(url)
      if (imgElement && cachedUrl) {
        imgElement.src = cachedUrl
      }
      return cachedUrl
    }

    // 如果达到并发限制，加入队列等待
    if (this.activeRequests >= this.maxConcurrent) {
      await new Promise(resolve => {
        this.queue.push(resolve)
      })
    }

    // 开始加载
    this.activeRequests++

    try {
      // 添加延迟，避免请求过于密集
      await this.delay(this.delayBetweenRequests)

      // 尝试加载图片
      const loadedUrl = await this.tryLoadImage(url)

      // 缓存加载成功的 URL
      this.loadedImages.set(url, loadedUrl)

      // 如果提供了 img 元素，更新 src
      if (imgElement && loadedUrl) {
        imgElement.src = loadedUrl
      }

      return loadedUrl
    } finally {
      // 完成加载，释放并发槽位
      this.activeRequests--

      // 处理队列中的下一个请求
      if (this.queue.length > 0) {
        const next = this.queue.shift()
        next()
      }
    }
  }

  /**
   * 尝试加载图片
   * @param {string} url - 图片 URL
   * @returns {Promise<string>} - 加载成功的 URL
   */
  async tryLoadImage(url) {
    try {
      // 优化：检查 URL 中的 format 参数，避免不必要的 HEAD 请求
      const urlObj = new URL(url, window.location.origin)
      const format = urlObj.searchParams.get('format')

      // 如果 URL 明确标记为 HEIC，直接转换
      if (format === 'heic') {
        console.log('检测到 HEIC 格式（通过 URL 参数），直接转换:', url)
        const { loadImage: convertHeic } = await import('@/utils/imageLoader')
        const convertedUrl = await convertHeic(url)
        return convertedUrl
      }

      // 如果 URL 标记为标准格式（JPEG/PNG），直接返回，不需要转换
      if (format === 'standard') {
        return url
      }

      // 没有 format 参数的情况（旧数据或外部 URL），正常加载
      return await new Promise((resolve, reject) => {
        const img = new Image()

        img.onload = () => {
          resolve(url)
        }

        img.onerror = async () => {
          // 降级方案：如果加载失败，尝试作为 HEIC 处理
          try {
            const { loadImage: convertHeic } = await import('@/utils/imageLoader')
            const convertedUrl = await convertHeic(url)
            resolve(convertedUrl)
          } catch (error) {
            console.warn('图片加载失败:', url, error)
            reject(error)
          }
        }

        img.src = url
      })
    } catch (error) {
      console.warn('图片加载失败:', url, error)
      throw error
    }
  }

  /**
   * 延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.loadedImages.clear()
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      activeRequests: this.activeRequests,
      queueLength: this.queue.length,
      cacheSize: this.loadedImages.size
    }
  }
}

// 创建全局单例
const imageQueue = new ImageQueue({
  maxConcurrent: 2, // 同时最多2个请求
  delayBetweenRequests: 800 // 每个请求间隔800ms
})

export default imageQueue
