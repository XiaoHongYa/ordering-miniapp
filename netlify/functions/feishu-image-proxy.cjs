// Netlify Function: 代理飞书附件图片下载
const axios = require('axios')

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

    // 获取 tenant_access_token
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

    const token = tokenResponse.data.tenant_access_token

    // 下载附件
    const imageResponse = await axios.get(
      `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'arraybuffer'
      }
    )

    // 获取图片的内容类型
    const contentType = imageResponse.headers['content-type'] || 'image/jpeg'

    // 返回图片
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 缓存24小时
        'Access-Control-Allow-Origin': '*'
      },
      body: imageResponse.data.toString('base64'),
      isBase64Encoded: true
    }
  } catch (error) {
    console.error('Error proxying image:', error.message)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Failed to proxy image',
        message: error.message
      })
    }
  }
}
