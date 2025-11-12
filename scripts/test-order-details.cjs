require('dotenv').config()
const axios = require('axios')

const APP_TOKEN = process.env.VITE_FEISHU_APP_TOKEN
const APP_ID = process.env.VITE_FEISHU_APP_ID
const APP_SECRET = process.env.VITE_FEISHU_APP_SECRET
const ORDER_DETAILS_TABLE_ID = process.env.VITE_FEISHU_ORDER_DETAILS_TABLE_ID

console.log('🔍 检查配置...')
console.log('APP_TOKEN:', APP_TOKEN)
console.log('ORDER_DETAILS_TABLE_ID:', ORDER_DETAILS_TABLE_ID)

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

async function testCreateOrderDetail() {
  try {
    const token = await getTenantAccessToken()

    // 测试数据
    const testData = {
      order_no: 'TEST' + Date.now(),
      dishe_name: '测试菜品',
      dishe_price: 10.5,
      dishe_quantity: 2,
      dishe_subtotal: 21
    }

    console.log('\n📝 尝试创建订单详情记录...')
    console.log('测试数据:', testData)

    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${ORDER_DETAILS_TABLE_ID}/records`,
      { fields: testData },
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
      console.log('✅ 订单详情创建成功!')
      console.log('记录ID:', response.data.data.record.record_id)
    } else {
      console.log('❌ 创建失败!')
      console.log('完整响应:', JSON.stringify(response.data, null, 2))
    }
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    if (error.response) {
      console.error('错误响应:', JSON.stringify(error.response.data, null, 2))
    }
  }
}

testCreateOrderDetail()
