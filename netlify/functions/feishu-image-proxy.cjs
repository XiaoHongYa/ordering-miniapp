// Netlify Function: 代理飞书附件图片下载
const axios = require('axios')
const convert = require('heic-convert')

// Token 缓存（Lambda 容器复用时可以共享）
let cachedToken = null
let tokenExpireTime = 0

// 请求队列控制 - 允许适度并发,平衡速度和频率限制
let activeRequests = 0
const MAX_CONCURRENT_REQUESTS = 3  // 允许3个并发请求
const requestQueue = []

// 请求间延迟(毫秒) - 每个请求执行前都要等待,确保不会触发频率限制
const REQUEST_DELAY = 400  // 每个请求开始前等待400ms

// 获取 tenant_access_token（带缓存）
async function getTenantAccessToken() {
  const now = Date.now()

  // 如果 token 还有效（提前 5 分钟过期），直接返回
  if (cachedToken && now < tokenExpireTime - 5 * 60 * 1000) {
    return cachedToken
  }

  // 获取新 token
  const tokenResponse = await axios.post(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    {
      app_id: process.env.VITE_FEISHU_APP_ID,
      app_secret: process.env.VITE_FEISHU_APP_SECRET
    }
  )

  if (tokenResponse.data.code !== 0) {
    throw new Error('Failed to get tenant_access_token')
  }

  cachedToken = tokenResponse.data.tenant_access_token
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

// 下载图片（带重试和队列控制）
async function downloadImage(fileToken, maxRetries = 3) {
  // 等待队列空位
  await waitForSlot()

  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 每个请求开始前都等待固定时间,避免频率限制
        // 这个延迟在队列控制的基础上额外添加,确保请求间隔足够大
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY))

        const token = await getTenantAccessToken()

        const imageResponse = await axios.get(
          `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            responseType: 'arraybuffer',
            timeout: 10000 // 10秒超时,避免单个请求卡太久
          }
        )

        return imageResponse

      } catch (error) {
        const isLastAttempt = attempt === maxRetries
        const status = error.response?.status
        const errorCode = error.response?.data ? JSON.parse(error.response.data.toString()).code : null

        // 频率限制错误(99991400),延长等待时间后重试
        if (errorCode === 99991400) {
          if (isLastAttempt) {
            throw error
          }
          // 频率限制:使用较短的退避延迟
          const delay = attempt * 1500  // 1.5秒,3秒,4.5秒
          console.log(`频率限制 (尝试 ${attempt}/${maxRetries}), ${delay}ms 后重试...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }

        // 如果是 401/403/404 错误，不重试（这些是永久错误）
        if (status === 401 || status === 403 || status === 404) {
          throw error
        }

        // 如果是最后一次尝试，抛出错误
        if (isLastAttempt) {
          throw error
        }

        // 其他错误:指数退避
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

exports.handler = async function(event, context) {
  // 只允许 GET 请求
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    }
  }

  try {
    // 从查询参数中获取 file_token
    const fileToken = event.queryStringParameters.file_token

    if (!fileToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing file_token parameter' })
      }
    }

    // 下载附件（带重试）
    const imageResponse = await downloadImage(fileToken)

    // 获取图片的内容类型
    const originalContentType = imageResponse.headers['content-type'] || 'image/jpeg'

    let imageBuffer = imageResponse.data
    let contentType = originalContentType

    // 如果是 HEIC/HEIF 格式,转换为 JPEG(浏览器不支持 HEIC)
    if (originalContentType.includes('heic') || originalContentType.includes('heif')) {
      console.log(`检测到 HEIC 格式,转换为 JPEG...`)
      try {
        // heic-convert 需要 Uint8Array 输入
        const outputBuffer = await convert({
          buffer: imageResponse.data,
          format: 'JPEG',
          quality: 0.85 // 85% 质量
        })
        imageBuffer = Buffer.from(outputBuffer)
        contentType = 'image/jpeg'
        console.log(`✅ HEIC 转 JPEG 成功`)
      } catch (convertError) {
        console.error('图片转换失败:', convertError.message)
        // 转换失败,返回原始数据
      }
    }

    // 返回图片
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 缓存24小时
        'Access-Control-Allow-Origin': '*'
      },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true
    }
  } catch (error) {
    console.error('Error proxying image:', error.message)

    // 记录更详细的错误信息
    if (error.response) {
      console.error('Feishu API Error:', {
        status: error.response.status,
        data: error.response.data,
        fileToken: event.queryStringParameters.file_token
      })
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to proxy image',
        message: error.message,
        details: error.response?.data || null
      })
    }
  }
}
