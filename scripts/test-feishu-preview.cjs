require('dotenv').config()
const axios = require('axios')

const APP_ID = process.env.VITE_FEISHU_APP_ID
const APP_SECRET = process.env.VITE_FEISHU_APP_SECRET

async function getTenantAccessToken() {
  const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: APP_ID,
    app_secret: APP_SECRET
  })
  return response.data.tenant_access_token
}

async function testPreview() {
  try {
    const token = await getTenantAccessToken()
    console.log('✅ Token:', token.substring(0, 20) + '...')

    // 测试 HEIC 图片
    const heicFileToken = 'BoCFbqWPbovEjUxXykwcQpcNnXb'

    // 方法1: 测试在 URL 中使用 access_token 参数
    console.log('\n📥 方法1: 在 URL 中使用 ?access_token=xxx')
    try {
      const urlTokenResponse = await axios.get(
        `https://open.feishu.cn/open-apis/drive/v1/medias/${heicFileToken}/download?access_token=${token}`,
        {
          responseType: 'arraybuffer',
          validateStatus: () => true
        }
      )
      console.log('Status:', urlTokenResponse.status)
      console.log('Content-Type:', urlTokenResponse.headers['content-type'])
      if (urlTokenResponse.data.byteLength) {
        console.log('文件大小:', urlTokenResponse.data.byteLength, 'bytes')
        // 检查是否是图片数据
        if (urlTokenResponse.status === 200 && urlTokenResponse.headers['content-type'].includes('image')) {
          console.log('✅ 成功！可以在 URL 中附加 token')
        } else {
          // 打印错误响应
          const errorData = Buffer.from(urlTokenResponse.data).toString('utf8')
          console.log('❌ 失败，错误响应:', errorData)
        }
      }
    } catch (error) {
      console.log('❌ 失败:', error.message)
    }

    // 方法2: 使用 Header Authorization（对照组）
    console.log('\n📥 方法2: 使用 Header Authorization（对照组）')
    const downloadResponse = await axios.get(
      `https://open.feishu.cn/open-apis/drive/v1/medias/${heicFileToken}/download`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'arraybuffer',
        maxRedirects: 0,
        validateStatus: () => true
      }
    )
    console.log('Status:', downloadResponse.status)
    console.log('Content-Type:', downloadResponse.headers['content-type'])
    if (downloadResponse.data.byteLength) {
      console.log('文件大小:', downloadResponse.data.byteLength, 'bytes')
    }

    // 方法3: 获取临时下载链接
    console.log('\n📥 方法3: 获取临时下载链接')
    const tmpUrlResponse = await axios.post(
      'https://open.feishu.cn/open-apis/drive/v1/medias/batch_get_tmp_download_url',
      {
        file_tokens: [heicFileToken]
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    console.log('临时链接响应:')
    console.log(JSON.stringify(tmpUrlResponse.data, null, 2))

    // 方法3: 测试临时链接是否可用
    if (tmpUrlResponse.data.code === 0 && tmpUrlResponse.data.data?.tmp_download_urls) {
      const tmpUrls = tmpUrlResponse.data.data.tmp_download_urls
      if (tmpUrls[heicFileToken]) {
        console.log('\n📥 方法3: 测试临时下载链接')
        const tmpUrl = tmpUrls[heicFileToken]
        console.log('临时URL:', tmpUrl)

        try {
          const tmpResponse = await axios.get(tmpUrl, {
            responseType: 'arraybuffer',
            maxRedirects: 5
          })
          console.log('✅ 临时链接可用!')
          console.log('Status:', tmpResponse.status)
          console.log('Content-Type:', tmpResponse.headers['content-type'])
          console.log('文件大小:', tmpResponse.data.byteLength, 'bytes')
        } catch (error) {
          console.log('❌ 临时链接不可用:', error.message)
        }
      }
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    if (error.response) {
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

testPreview()
