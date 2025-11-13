const axios = require('axios')

exports.handler = async function(event, context) {
  // 处理 CORS 预检请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    }
  }

  try {
    // 从路径中提取飞书 API 路径
    const path = event.path.replace('/.netlify/functions/feishu-proxy', '')
    const apiPath = path.startsWith('/api') ? path.substring(4) : path

    // 飞书 API 基础 URL
    const feishuUrl = `https://open.feishu.cn${apiPath}`

    console.log('代理请求:', feishuUrl)
    console.log('请求方法:', event.httpMethod)
    console.log('请求体:', event.body)

    // 发起请求到飞书 API
    const response = await axios({
      method: event.httpMethod,
      url: feishuUrl,
      data: event.body ? JSON.parse(event.body) : undefined,
      headers: {
        'Content-Type': 'application/json',
        // 传递原始请求的 Authorization 头（如果有）
        ...(event.headers.authorization && {
          'Authorization': event.headers.authorization
        })
      }
    })

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(response.data)
    }
  } catch (error) {
    console.error('代理请求失败:', error.message)
    console.error('错误详情:', error.response?.data)

    return {
      statusCode: error.response?.status || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message,
        details: error.response?.data || '请求失败'
      })
    }
  }
}
