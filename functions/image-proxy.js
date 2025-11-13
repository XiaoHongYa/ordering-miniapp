// Cloudflare Pages Function: 代理飞书附件图片下载
// 路径: /image-proxy?file_token=xxx

// Token 缓存（Worker 实例复用时可以共享）
let cachedToken = null
let tokenExpireTime = 0

// 请求队列控制 - 严格限制并发,避免触发频率限制
let activeRequests = 0
const MAX_CONCURRENT_REQUESTS = 1  // 只允许1个并发请求(串行处理)
const requestQueue = []

// 请求间延迟(毫秒) - 每个请求执行前都要等待,确保不会触发频率限制
const REQUEST_DELAY = 1000  // 每个请求开始前等待1秒

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

// Cloudflare Pages Function 导出
export async function onRequest(context) {
  const { request, env } = context

  // 调试：记录请求开始
  console.log('=== Image Proxy Request Started ===')
  console.log('URL:', request.url)
  console.log('Method:', request.method)

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

  console.log('File Token:', fileToken)

  if (!fileToken) {
    return new Response(
      JSON.stringify({ error: 'Missing file_token parameter' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // 调试：检查环境变量
  const debugInfo = {
    hasAppId: !!env.VITE_FEISHU_APP_ID,
    hasAppSecret: !!env.VITE_FEISHU_APP_SECRET,
    appIdLength: env.VITE_FEISHU_APP_ID?.length || 0,
    appSecretLength: env.VITE_FEISHU_APP_SECRET?.length || 0,
    allEnvKeys: Object.keys(env || {})
  }
  console.log('Environment Debug:', JSON.stringify(debugInfo, null, 2))

  try {
    // 等待队列空位 - 确保串行处理
    await waitForSlot()
    console.log('Queue slot acquired, active requests:', activeRequests)

    // 添加延迟避免频率限制
    await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY))

    console.log('Step 1: Getting tenant access token...')

    // 使用缓存的 token
    const token = await getTenantAccessToken(env)
    console.log('Step 2: Got token (preview):', token.substring(0, 20) + '...')
    console.log('Step 2: Downloading image with file_token:', fileToken)

    // 尝试使用飞书附件下载 API
    const downloadUrl = `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`
    console.log('Step 2: Download URL:', downloadUrl)

    // 下载附件
    const imageResponse = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('Step 2: Image response status:', imageResponse.status)
    console.log('Step 2: Image response headers:', JSON.stringify(Object.fromEntries(imageResponse.headers.entries()), null, 2))

    if (!imageResponse.ok) {
      // 如果下载失败,尝试读取错误响应内容
      let errorDetail = imageResponse.statusText
      try {
        const errorBody = await imageResponse.text()
        console.log('Step 2: Error response body:', errorBody)
        errorDetail = errorBody || errorDetail
      } catch (e) {
        console.log('Step 2: Could not read error body')
      }
      throw new Error(`HTTP ${imageResponse.status}: ${errorDetail}`)
    }

    // 获取图片的内容类型
    const originalContentType = imageResponse.headers.get('content-type') || 'image/jpeg'
    console.log('Step 3: Got image, content-type:', originalContentType)

    // 创建新的响应头
    const responseHeaders = new Headers({
      'Cache-Control': 'public, max-age=2592000, immutable', // 缓存30天
      'Access-Control-Allow-Origin': '*'
    })

    // 对于 HEIC 格式，返回原始图片数据，让前端使用 heic2any 转换
    if (originalContentType.includes('heic') || originalContentType.includes('heif')) {
      console.log('HEIC format detected - returning raw data for frontend conversion')

      responseHeaders.set('Content-Type', 'image/heic')
      responseHeaders.set('X-Image-Format', 'heic')
      responseHeaders.set('Access-Control-Expose-Headers', 'X-Image-Format')
    } else {
      responseHeaders.set('Content-Type', originalContentType)
    }

    console.log('Step 4: Returning image successfully')
    console.log('=== Image Proxy Request Completed ===')

    // 释放队列空位
    releaseSlot()

    // 返回图片（直接传递响应）
    return new Response(imageResponse.body, {
      status: 200,
      headers: responseHeaders
    })

  } catch (error) {
    // 释放队列空位
    releaseSlot()
    console.error('=== Error in image-proxy ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)

    // 返回详细的错误信息（包含环境变量状态）
    const errorResponse = {
      error: 'Failed to proxy image',
      message: error.message,
      stack: error.stack,
      fileToken: fileToken,
      debug: {
        hasEnv: !!env,
        hasAppId: !!env?.VITE_FEISHU_APP_ID,
        hasAppSecret: !!env?.VITE_FEISHU_APP_SECRET,
        appIdPreview: env?.VITE_FEISHU_APP_ID?.substring(0, 8) + '...',
        envKeys: Object.keys(env || {})
      }
    }

    console.error('Error response:', JSON.stringify(errorResponse, null, 2))

    return new Response(
      JSON.stringify(errorResponse),
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
