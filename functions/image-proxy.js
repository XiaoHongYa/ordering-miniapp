// Cloudflare Pages Function: 代理飞书附件图片下载
// 路径: /image-proxy?file_token=xxx
// 支持所有图片格式（JPEG/PNG/HEIC 等），保持原始格式不转换
// Safari 浏览器原生支持 HEIC，Chrome/Firefox 会显示占位符

// Token 缓存（Worker 实例复用时可以共享）
let cachedToken = null
let tokenExpireTime = 0

// 请求队列管理 - 严格串行化处理
let processingQueue = Promise.resolve()
const REQUEST_INTERVAL = 600  // 每个请求间隔 600ms

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

// 串行化请求处理 - 确保请求按顺序执行，且有固定间隔
function enqueueRequest(handler) {
  const currentQueue = processingQueue

  processingQueue = currentQueue.then(async () => {
    // 执行实际的请求处理
    const result = await handler()

    // 处理完成后等待固定间隔，再允许下一个请求开始
    await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL))

    return result
  })

  return processingQueue
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

  // 将 GET 请求加入队列，串行化处理
  return enqueueRequest(async () => {
    try {
      // 使用缓存的 token
      const token = await getTenantAccessToken(env)

      // 下载附件
      const downloadUrl = `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`
      const imageResponse = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!imageResponse.ok) {
        throw new Error(`HTTP ${imageResponse.status}: ${imageResponse.statusText}`)
      }

      // 读取图片数据
      const imageBuffer = await imageResponse.arrayBuffer()

      // 创建响应头 - 使用飞书返回的 Content-Type
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
      const responseHeaders = new Headers({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, immutable', // 缓存30天
        'Access-Control-Allow-Origin': '*'
      })

      // 返回图片
      return new Response(imageBuffer, {
        status: 200,
        headers: responseHeaders
      })

    } catch (error) {
      console.error('Image proxy error:', error.message)

      return new Response(
        JSON.stringify({
          error: 'Failed to proxy image',
          message: error.message,
          fileToken: fileToken
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
  })
}
