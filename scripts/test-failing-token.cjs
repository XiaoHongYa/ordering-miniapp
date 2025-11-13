require('dotenv').config()
const axios = require('axios')

const APP_ID = process.env.VITE_FEISHU_APP_ID
const APP_SECRET = process.env.VITE_FEISHU_APP_SECRET

// 测试失败的 file_token
const FAILING_TOKENS = [
  'TLrtb1xmdofOZbxqApicRthnnib',
  'SpXGbXa3VoC4p8xJb17cWHeRnwe',
  'PGPZbSbWLoGZMkxmEWAcWzL5nwd',
  'OSmibHpI9oAV3dxaiXfcRwPbnkc',
  'WP4SbBe6Oo3VHJxoUW9cv4eVnTc'
]

async function getTenantAccessToken() {
  const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: APP_ID,
    app_secret: APP_SECRET
  })

  if (response.data.code === 0) {
    return response.data.tenant_access_token
  } else {
    throw new Error(response.data.msg || '获取访问令牌失败')
  }
}

async function testFileToken(fileToken, token) {
  try {
    console.log(`\n测试 file_token: ${fileToken}`)

    const response = await axios.get(
      `https://open.feishu.cn/open-apis/drive/v1/medias/${fileToken}/download`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        responseType: 'arraybuffer'
      }
    )

    console.log(`✅ 成功! 状态码: ${response.status}, 大小: ${response.data.length} bytes`)
    console.log(`   Content-Type: ${response.headers['content-type']}`)

  } catch (error) {
    console.log(`❌ 失败! 状态码: ${error.response?.status}`)

    if (error.response) {
      // 尝试解析错误响应
      const errorText = error.response.data.toString('utf-8')
      console.log(`   错误响应:`, errorText)

      // 尝试解析为 JSON
      try {
        const errorJson = JSON.parse(errorText)
        console.log(`   解析后的错误:`, JSON.stringify(errorJson, null, 2))
      } catch (e) {
        // 不是 JSON,已经打印了原始文本
      }
    } else {
      console.log(`   错误信息: ${error.message}`)
    }
  }
}

async function main() {
  try {
    console.log('正在获取访问令牌...')
    const token = await getTenantAccessToken()
    console.log('✅ 访问令牌获取成功\n')

    // 测试所有失败的 token
    for (const fileToken of FAILING_TOKENS) {
      await testFileToken(fileToken, token)
      // 短暂延迟，避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('\n测试完成!')

  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    if (error.response) {
      console.error('错误响应:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

main()
