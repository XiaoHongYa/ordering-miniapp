require('dotenv').config()
const axios = require('axios')

const APP_TOKEN = process.env.VITE_FEISHU_APP_TOKEN
const APP_ID = process.env.VITE_FEISHU_APP_ID
const APP_SECRET = process.env.VITE_FEISHU_APP_SECRET
const DISHES_TABLE_ID = process.env.VITE_FEISHU_DISHES_TABLE_ID

console.log('🔍 检查配置...')
console.log('APP_TOKEN:', APP_TOKEN)
console.log('DISHES_TABLE_ID:', DISHES_TABLE_ID)

async function getTenantAccessToken() {
  try {
    const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: APP_ID,
      app_secret: APP_SECRET
    })

    if (response.data.code === 0) {
      console.log('✅ 成功获取 access token')
      return response.data.tenant_access_token
    } else {
      throw new Error(response.data.msg || '获取访问令牌失败')
    }
  } catch (error) {
    console.error('❌ 获取 tenant_access_token 失败:', error.message)
    throw error
  }
}

async function testAttachmentField() {
  try {
    const token = await getTenantAccessToken()

    console.log('\n📝 查询菜品数据（前3条）...')

    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${DISHES_TABLE_ID}/records/search`,
      {
        // 不指定 field_names，返回所有字段
        filter: {
          conjunction: 'and',
          conditions: [
            {
              field_name: 'status',
              operator: 'is',
              value: ['上架']
            }
          ]
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('\n📊 响应结果:')
    console.log('状态码:', response.data.code)
    console.log('消息:', response.data.msg || 'success')

    if (response.data.code === 0) {
      console.log('✅ 查询成功!')
      console.log('\n前3条菜品数据:')

      const items = response.data.data.items.slice(0, 2)
      items.forEach((item, index) => {
        console.log(`\n--- 菜品 ${index + 1} ---`)
        console.log('ID:', item.record_id)
        console.log('\n所有字段:')
        console.log(JSON.stringify(item.fields, null, 2))
      })
    } else {
      console.log('❌ 查询失败!')
      console.log('完整响应:', JSON.stringify(response.data, null, 2))
    }
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    if (error.response) {
      console.error('错误响应:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

testAttachmentField()
