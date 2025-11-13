// Cloudflare Pages Function: 代理飞书附件图片下载
// 路径: /image-proxy?file_token=xxx

// Token 缓存（Worker 实例复用时可以共享）
let cachedToken = null
let tokenExpireTime = 0

// 请求队列控制 - 允许适度并发,平衡速度和频率限制
let activeRequests = 0
const MAX_CONCURRENT_REQUESTS = 3  // 允许3个并发请求
const requestQueue = []

// 请求间延迟(毫秒) - 每个请求执行前都要等待,确保不会触发频率限制
const REQUEST_DELAY = 400  // 每个请求开始前等待400ms

// 获取 tenant_access_token（带缓存）
async function getTenantAccessToken(env) {
  const now = Date.now()

  // 如果 token 还有效（提前 5 分钟过期），直接返回
  if (cachedToken && now < tokenExpireTime - 5 * 60 * 1000) {
    return cachedToken
  }

  // 获取新 token
  const tokenResponse = await fetch(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: env.VITE_FEISHU_APP_ID,
        app_secret: env.VITE_FEISHU_APP_SECRET
      })
    }
  )

  const data = await tokenResponse.json()

  if (data.code !== 0) {
    throw new Error('Failed to get tenant_access_token')
  }

  cachedToken = data.tenant_access_token
  // Token 有效期 2 小时
  tokenExpireTime = now + 2 * 60 * 60 * 1000

  return cachedToken
}

// 等待队列有空位
async function waitForSlot() {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++
    return
  }

  // 等待有空位
  return new Promise(resolve => {
    requestQueue.push(resolve)
  })
}

// 释放队列空位
function releaseSlot() {
  activeRequests--
  if (requestQueue.length > 0) {
    const next = requestQueue.shift()
    activeRequests++
    next()
  }
}

// HEIC 转 JPEG (使用 Cloudflare 的 Image Resizing)
// 注意: 需要在 Cloudflare 开启 Image Resizing 功能（付费功能）
// 免费替代方案: 直接返回原始 HEIC，让客户端处理（iOS支持，但Web浏览器不支持）
async function convertHeicToJpeg(imageBuffer) {
  // Cloudflare Workers 环境没有 heic-convert 库
  // 这里需要使用 Cloudflare 的 Image Resizing API
  // 或者返回原始图片，前端处理

  // 简化方案：直接返回原始图片，对于 HEIC 图片，提示用户
  // 如果需要转换，可以考虑：
  // 1. 使用 Cloudflare Image Resizing (需要付费)
  // 2. 使用第三方 API 转换
  // 3. 前端使用 heic2any 库转换

  console.log('HEIC format detected, returning original image')
  return { buffer: imageBuffer, contentType: 'image/jpeg' }
}

// 下载图片（带重试和队列控制）
async function downloadImage(fileToken, env, maxRetries = 3) {
  // 等待队列空位
  await waitForSlot()

  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 每个请求开始前都等待固定时间,避免频率限制
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY))

        const token = await getTenantAccessToken(env)

        const imageResponse = await fetch(
          `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )

        if (!imageResponse.ok) {
          throw new Error(`HTTP ${imageResponse.status}`)
        }

        return imageResponse

      } catch (error) {
        const isLastAttempt = attempt === maxRetries

        // 如果是最后一次尝试，抛出错误
        if (isLastAttempt) {
          throw error
        }

        // 指数退避
        const delay = attempt * 500
        console.log(`下载失败 (尝试 ${attempt}/${maxRetries}), ${delay}ms 后重试...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  } finally {
    // 无论成功失败，都要释放队列空位
    releaseSlot()
  }
}

// Cloudflare Pages Function 导出
export async function onRequest(context) {
  const { request, env } = context

  // 只允许 GET 请求
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method Not Allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // 从查询参数中获取 file_token
    const url = new URL(request.url)
    const fileToken = url.searchParams.get('file_token')

    if (!fileToken) {
      return new Response(
        JSON.stringify({ error: 'Missing file_token parameter' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 下载附件（带重试）
    const imageResponse = await downloadImage(fileToken, env)

    // 获取图片的内容类型
    const originalContentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // 对于 HEIC 格式，Cloudflare Workers 不支持转换
    // 检测到 HEIC 格式时，返回友好的错误提示
    if (originalContentType.includes('heic') || originalContentType.includes('heif')) {
      console.log('HEIC format detected - Cloudflare Workers cannot convert')

      return new Response(
        JSON.stringify({
          error: 'HEIC format not supported',
          message: 'Please upload JPEG/PNG format images in Feishu Bitable',
          file_token: fileToken
        }),
        {
          status: 415, // Unsupported Media Type
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    let contentType = originalContentType

    // 返回图片
    return new Response(imageResponse.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, immutable', // 缓存30天
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Error proxying image:', error.message)

    return new Response(
      JSON.stringify({
        error: 'Failed to proxy image',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
}
