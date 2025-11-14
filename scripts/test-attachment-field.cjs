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

    console.log('\n📝 查询所有菜品数据...')

    const response = await axios.post(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${DISHES_TABLE_ID}/records/search`,
      {},  // 查询所有菜品，包括未上架的
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
      const allItems = response.data.data.items
      console.log(`\n总共 ${allItems.length} 条菜品`)

      // 找到有图片的菜品
      const itemsWithImages = allItems.filter(item => item.fields.image_url_v2)
      console.log(`有 image_url_v2 字段的菜品: ${itemsWithImages.length} 条`)

      if (itemsWithImages.length > 0) {
        // 统计图片类型
        const imageTypes = {}
        itemsWithImages.forEach(item => {
          const type = item.fields.image_url_v2[0]?.type || 'unknown'
          imageTypes[type] = (imageTypes[type] || 0) + 1
        })
        console.log('\n图片类型统计:')
        console.log(imageTypes)

        // 找 HEIC 图片
        const heicImages = itemsWithImages.filter(item => {
          const type = item.fields.image_url_v2[0]?.type || ''
          const name = item.fields.image_url_v2[0]?.name || ''
          return type.includes('heic') || type.includes('heif') || name.includes('.heic') || name.includes('.HEIC')
        })
        console.log(`\nHEIC 格式图片数量: ${heicImages.length}`)

        if (heicImages.length > 0) {
          console.log('\nHEIC 图片示例:')
          heicImages.slice(0, 2).forEach((item, index) => {
            console.log(`\n--- HEIC 图片 ${index + 1} ---`)
            console.log('菜品名:', item.fields.name)
            console.log('图片信息:', item.fields.image_url_v2[0])
          })
        }

        console.log('\n前3个有图片的菜品:')
        itemsWithImages.slice(0, 3).forEach((item, index) => {
          console.log(`\n--- 菜品 ${index + 1} ---`)
          console.log('菜品名:', item.fields.name)
          console.log('\nimage_url_v2 字段结构:')
          console.log(JSON.stringify(item.fields.image_url_v2, null, 2))
        })
      } else {
        console.log('\n⚠️ 没有菜品包含 image_url_v2 字段')
      }
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
