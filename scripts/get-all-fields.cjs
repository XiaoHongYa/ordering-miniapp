require('dotenv').config()
const axios = require('axios')

const APP_TOKEN = process.env.VITE_FEISHU_APP_TOKEN
const APP_ID = process.env.VITE_FEISHU_APP_ID
const APP_SECRET = process.env.VITE_FEISHU_APP_SECRET
const DISHES_TABLE_ID = process.env.VITE_FEISHU_DISHES_TABLE_ID

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

async function getAllFields() {
  try {
    const token = await getTenantAccessToken()

    console.log('📝 查询所有字段信息...\n')

    // 先获取字段列表
    const fieldsResponse = await axios.get(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${DISHES_TABLE_ID}/fields`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (fieldsResponse.data.code === 0) {
      console.log('✅ 字段列表:')
      fieldsResponse.data.data.items.forEach(field => {
        console.log(`  - ${field.field_name} (${field.type})`)
      })
    }

    console.log('\n📊 查询菜品数据...\n')

    // 查询菜品数据,不过滤字段
    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${DISHES_TABLE_ID}/records/search`,
      {
        page_size: 3
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (response.data.code === 0) {
      console.log('✅ 查询成功!\n')

      const items = response.data.data.items
      items.forEach((item, index) => {
        console.log(`--- 菜品 ${index + 1} ---`)
        console.log('ID:', item.record_id)
        console.log('字段:')
        Object.entries(item.fields).forEach(([key, value]) => {
          console.log(`  ${key}:`, JSON.stringify(value, null, 2))
        })
        console.log()
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

getAllFields()
