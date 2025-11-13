// Cloudflare Pages Function: 代理飞书 API
// 路径: /api/* 会被路由到这个函数

// Token 缓存（Worker 实例复用时可以共享）
let cachedToken = null
let tokenExpireTime = 0

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

// 代理飞书 API 请求
async function proxyFeishuRequest(path, request, token) {
  const url = new URL(request.url)
  const feishuUrl = `https://open.feishu.cn${path}${url.search}`

  const headers = new Headers(request.headers)
  headers.set('Authorization', `Bearer ${token}`)
  headers.set('Content-Type', 'application/json')
  headers.delete('host')

  const options = {
    method: request.method,
    headers: headers
  }

  // 如果有请求体，传递给飞书 API
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    options.body = await request.text()
  }

  const response = await fetch(feishuUrl, options)

  // 创建新的响应，保留原始响应头
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  })

  // 添加 CORS 头
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return newResponse
}

// Cloudflare Pages Function 导出
export async function onRequest(context) {
  const { request, env } = context

  // 处理 CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    })
  }

  try {
    // 从 URL 中提取飞书 API 路径
    // 例如: /api/bitable/v1/apps/xxx -> /open-apis/bitable/v1/apps/xxx
    const url = new URL(request.url)
    const path = url.pathname.replace(/^\/api/, '/open-apis')

    // 获取 token
    const token = await getTenantAccessToken(env)

    // 代理请求到飞书 API
    return await proxyFeishuRequest(path, request, token)

  } catch (error) {
    console.error('Error proxying Feishu API:', error)

    return new Response(
      JSON.stringify({
        error: 'Failed to proxy Feishu API',
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
