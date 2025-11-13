/**
 * 图片加载工具 - 支持 HEIC 格式自动转换
 *
 * 使用 heic2any 库在浏览器中将 HEIC 图片转换为 JPEG
 */

import heic2any from 'heic2any'

// 缓存转换后的 blob URL，避免重复转换
const convertedImageCache = new Map()

/**
 * 检测图片是否为 HEIC 格式
 * @param {string} url - 图片 URL
 * @returns {Promise<boolean>} - 是否为 HEIC 格式
 */
async function isHeicImage(url) {
  try {
    // 方法1: 通过 URL 判断（如果服务器返回了正确的 Content-Type）
    const response = await fetch(url, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')

    // 如果服务器明确返回了 image/jpeg 或 image/png，不是 HEIC
    if (contentType && (contentType.includes('jpeg') || contentType.includes('png'))) {
      return false
    }

    // 只有明确是 heic/heif 才返回 true
    if (contentType && (contentType.includes('heic') || contentType.includes('heif'))) {
      return true
    }

    // 方法2: 通过文件签名判断（下载前几个字节检查）
    // HEIC 文件通常以 'ftyp' 开头
    const partialResponse = await fetch(url, {
      headers: { 'Range': 'bytes=0-11' }
    })

    // 如果服务器不支持 Range 请求，直接返回 false
    if (partialResponse.status !== 206) {
      return false
    }

    const buffer = await partialResponse.arrayBuffer()
    const bytes = new Uint8Array(buffer)

    // HEIC/HEIF 文件的特征: 4-11 字节包含 "ftyp" + "heic"/"heix"/"hevc"/"hevx"
    const signature = String.fromCharCode(...bytes.slice(4, 12))
    return signature.includes('heic') ||
           signature.includes('heix') ||
           signature.includes('hevc') ||
           signature.includes('hevx')
  } catch (error) {
    console.warn('检测 HEIC 格式失败:', error)
    return false
  }
}

/**
 * 转换 HEIC 图片为 JPEG
 * @param {string} url - HEIC 图片 URL
 * @returns {Promise<string>} - 转换后的 blob URL
 */
async function convertHeicToJpeg(url) {
  // 检查缓存
  if (convertedImageCache.has(url)) {
    return convertedImageCache.get(url)
  }

  try {
    console.log('开始转换 HEIC 图片:', url)

    // 1. 下载 HEIC 图片
    const response = await fetch(url)
    const blob = await response.blob()

    // 2. 转换为 JPEG
    const convertedBlob = await heic2any({
      blob,
      toType: 'image/jpeg',
      quality: 0.85 // 85% 质量，平衡文件大小和画质
    })

    // heic2any 可能返回数组（如果图片包含多帧）或单个 blob
    const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob

    // 3. 创建 blob URL
    const blobUrl = URL.createObjectURL(finalBlob)

    // 4. 缓存结果
    convertedImageCache.set(url, blobUrl)

    console.log('✅ HEIC 转换成功:', url)
    return blobUrl

  } catch (error) {
    console.error('HEIC 转换失败:', error)
    throw error
  }
}

/**
 * 智能加载图片 - 自动检测和转换 HEIC 格式
 * @param {string} url - 图片 URL
 * @returns {Promise<string>} - 可用的图片 URL（原始或转换后）
 */
export async function loadImage(url) {
  if (!url) {
    return null
  }

  try {
    // 1. 检查是否为 HEIC 格式
    const isHeic = await isHeicImage(url)

    // 2. 如果是 HEIC，转换为 JPEG
    if (isHeic) {
      return await convertHeicToJpeg(url)
    }

    // 3. 如果不是 HEIC，直接返回原始 URL
    return url

  } catch (error) {
    console.error('图片加载失败:', error)
    throw error
  }
}

/**
 * 清理缓存的 blob URL（可选，用于内存管理）
 */
export function clearImageCache() {
  for (const blobUrl of convertedImageCache.values()) {
    URL.revokeObjectURL(blobUrl)
  }
  convertedImageCache.clear()
}

/**
 * 预加载图片（可选，用于提前转换）
 * @param {string[]} urls - 图片 URL 数组
 */
export async function preloadImages(urls) {
  const promises = urls.map(url => loadImage(url).catch(err => {
    console.warn('预加载图片失败:', url, err)
    return null
  }))

  await Promise.all(promises)
}
