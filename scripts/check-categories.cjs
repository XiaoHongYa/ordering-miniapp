require('dotenv').config()
const axios = require('axios')

const APP_TOKEN = process.env.VITE_FEISHU_APP_TOKEN
const APP_ID = process.env.VITE_FEISHU_APP_ID
const APP_SECRET = process.env.VITE_FEISHU_APP_SECRET
const CATEGORIES_TABLE_ID = process.env.VITE_FEISHU_CATEGORIES_TABLE_ID

async function getTenantAccessToken() {
  try {
    const response = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: APP_ID,
      app_secret: APP_SECRET
    })

    if (response.data.code === 0) {
      return response.data.tenant_access_token
    } else {
      throw new Error(response.data.msg || '获取访问令牌失败')
    }
  } catch (error) {
    console.error('获取tenant_access_token失败:', error.message)
    throw error
  }
}

async function getCategories() {
  try {
    const token = await getTenantAccessToken()
    console.log('✅ 成功获取 access token')

    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${CATEGORIES_TABLE_ID}/records/search`,
      {
        filter: {
          conjunction: 'and',
          conditions: [
            {
              field_name: 'status',
              operator: 'is',
              value: ['启用']
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

    if (response.data.code === 0) {
      console.log('\n📋 分类列表:\n')
      response.data.data.items.forEach(item => {
        console.log(`ID: ${item.record_id}`)
        console.log(`名称: ${item.fields.name?.[0]?.text || item.fields.name}`)
        console.log(`排序: ${item.fields.sort_order}`)
        console.log('---')
      })

      // 查找 recv2fdIeXTznn 对应的分类
      const targetCategory = response.data.data.items.find(item => item.record_id === 'recv2fdIeXTznn')
      if (targetCategory) {
        console.log('\n🎯 找到了！recv2fdIeXTznn 对应的分类是:')
        console.log(`名称: ${targetCategory.fields.name?.[0]?.text || targetCategory.fields.name}`)
      } else {
        console.log('\n❌ 未找到 recv2fdIeXTznn 对应的分类')
      }
    } else {
      console.error('查询失败:', response.data)
    }
  } catch (error) {
    console.error('错误:', error.message)
    if (error.response) {
      console.error('响应数据:', error.response.data)
    }
  }
}

getCategories()
