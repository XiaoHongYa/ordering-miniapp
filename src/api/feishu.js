import request from '@/utils/request'

const APP_TOKEN = import.meta.env.VITE_FEISHU_APP_TOKEN
const APP_ID = import.meta.env.VITE_FEISHU_APP_ID
const APP_SECRET = import.meta.env.VITE_FEISHU_APP_SECRET

// 表ID配置
const TABLES = {
  USERS: import.meta.env.VITE_FEISHU_USERS_TABLE_ID,
  ANNOUNCEMENTS: import.meta.env.VITE_FEISHU_ANNOUNCEMENTS_TABLE_ID,
  CATEGORIES: import.meta.env.VITE_FEISHU_CATEGORIES_TABLE_ID,
  DISHES: import.meta.env.VITE_FEISHU_DISHES_TABLE_ID,
  ORDERS: import.meta.env.VITE_FEISHU_ORDERS_TABLE_ID
}

// 获取tenant_access_token
let accessToken = null
let tokenExpireTime = 0

async function getTenantAccessToken() {
  // 如果token还未过期,直接返回
  if (accessToken && Date.now() < tokenExpireTime) {
    return accessToken
  }

  try {
    const response = await request.post('/open-apis/auth/v3/tenant_access_token/internal', {
      app_id: APP_ID,
      app_secret: APP_SECRET
    })

    if (response.code === 0) {
      accessToken = response.tenant_access_token
      // 提前5分钟过期
      tokenExpireTime = Date.now() + (response.expire - 300) * 1000
      return accessToken
    } else {
      throw new Error(response.msg || '获取访问令牌失败')
    }
  } catch (error) {
    console.error('获取tenant_access_token失败:', error)
    throw error
  }
}

// 解析飞书字段值
function parseFieldValue(value) {
  if (!value) return null

  // 单向关联/双向关联字段: {"link_record_ids": ["recXXX"]}
  if (typeof value === 'object' && value.link_record_ids) {
    return value.link_record_ids
  }

  // 如果是数组格式 [{"text":"xxx","type":"text"}]
  if (Array.isArray(value) && value.length > 0) {
    if (value[0].text !== undefined) {
      return value[0].text
    }
    return value[0]
  }

  // 如果是对象格式 {"text":"xxx","type":"text"}
  if (typeof value === 'object' && value.text !== undefined) {
    return value.text
  }

  // 其他情况直接返回
  return value
}

// 解析记录对象,将飞书格式转换为普通对象
function parseRecord(record) {
  const parsed = {
    id: record.record_id
  }

  for (const [key, value] of Object.entries(record.fields)) {
    parsed[key] = parseFieldValue(value)
  }

  return parsed
}

// 通用的查询记录方法
async function searchRecords(tableId, params = {}) {
  const token = await getTenantAccessToken()

  const response = await request.post(
    `/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records/search`,
    params,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  )

  return response
}

// 通用的创建记录方法
async function createRecord(tableId, fields) {
  const token = await getTenantAccessToken()

  const response = await request.post(
    `/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records`,
    { fields },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  )

  return response
}

// 用户登录验证
export async function loginUser(username, password) {
  try {
    const response = await searchRecords(TABLES.USERS, {
      filter: {
        conjunction: 'and',
        conditions: [
          {
            field_name: 'username',
            operator: 'is',
            value: [username]
          },
          {
            field_name: 'password',
            operator: 'is',
            value: [password]
          },
          {
            field_name: 'status',
            operator: 'is',
            value: ['启用']
          }
        ]
      }
    })

    if (response.code === 0 && response.data?.items?.length > 0) {
      const user = parseRecord(response.data.items[0])
      return {
        success: true,
        data: {
          username: user.username,
          name: user.name
        }
      }
    } else {
      return {
        success: false,
        message: '账号或密码错误'
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      message: '登录失败,请稍后重试'
    }
  }
}

// 获取商家公告
export async function getAnnouncements() {
  try {
    const response = await searchRecords(TABLES.ANNOUNCEMENTS, {
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
    })

    if (response.code === 0) {
      return response.data?.items?.map(item => parseRecord(item)) || []
    }
    return []
  } catch (error) {
    console.error('获取公告失败:', error)
    return []
  }
}

// 获取菜品分类
export async function getCategories() {
  try {
    const response = await searchRecords(TABLES.CATEGORIES, {
      filter: {
        conjunction: 'and',
        conditions: [
          {
            field_name: 'status',
            operator: 'is',
            value: ['启用']
          }
        ]
      },
      sort: [
        {
          field_name: 'sort_order',
          desc: false
        }
      ]
    })

    if (response.code === 0) {
      return response.data?.items?.map(item => {
        const parsed = parseRecord(item)
        return {
          id: parsed.id,
          name: parsed.name,
          sort_order: parsed.sort_order
        }
      }) || []
    }
    return []
  } catch (error) {
    console.error('获取分类失败:', error)
    return []
  }
}

// 获取菜品列表
export async function getDishes(categoryName) {
  try {
    // 如果指定了分类名称，需要先查找分类 ID
    let categoryRecordId = null
    if (categoryName) {
      const categoryResponse = await searchRecords(TABLES.CATEGORIES, {
        filter: {
          conjunction: 'and',
          conditions: [
            {
              field_name: 'name',
              operator: 'is',
              value: [categoryName]
            }
          ]
        }
      })

      if (categoryResponse.code === 0 && categoryResponse.data?.items?.length > 0) {
        categoryRecordId = categoryResponse.data.items[0].record_id
      }
    }

    const conditions = [
      {
        field_name: 'status',
        operator: 'is',
        value: ['上架']
      }
    ]

    // 如果找到了分类 ID，添加过滤条件
    // category_id 是单向关联字段，需要使用 contains 操作符
    if (categoryRecordId) {
      conditions.push({
        field_name: 'category_id',
        operator: 'contains',
        value: [categoryRecordId]
      })
    }

    const response = await searchRecords(TABLES.DISHES, {
      filter: {
        conjunction: 'and',
        conditions
      },
      sort: [
        {
          field_name: 'sort_order',
          desc: false
        }
      ]
    })

    if (response.code === 0) {
      return response.data?.items?.map(item => {
        const parsed = parseRecord(item)
        return {
          id: parsed.id,
          name: parsed.name,
          description: parsed.description,
          price: parsed.price,
          image_url: parsed.image_url,
          category_id: parsed.category_id // 现在是数组格式 ["recXXX"]
        }
      }) || []
    }
    return []
  } catch (error) {
    console.error('获取菜品失败:', error)
    return []
  }
}

// 创建订单
export async function createOrder(orderData) {
  try {
    const response = await createRecord(TABLES.ORDERS, {
      order_no: orderData.order_no,
      username: orderData.username,
      total_amount: orderData.total_amount,
      total_quantity: orderData.total_quantity,
      dishes_detail: JSON.stringify(orderData.dishes_detail),
      status: '待处理'
    })

    if (response.code === 0) {
      return {
        success: true,
        data: response.data
      }
    } else {
      return {
        success: false,
        message: response.msg || '创建订单失败'
      }
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    return {
      success: false,
      message: '创建订单失败,请稍后重试'
    }
  }
}

// 获取历史订单
export async function getOrderHistory(username) {
  try {
    const response = await searchRecords(TABLES.ORDERS, {
      filter: {
        conjunction: 'and',
        conditions: [
          {
            field_name: 'username',
            operator: 'is',
            value: [username]
          }
        ]
      },
      sort: [
        {
          field_name: 'create_time',
          desc: true
        }
      ]
    })

    if (response.code === 0) {
      return response.data?.items?.map(item => {
        const parsed = parseRecord(item)
        return {
          id: parsed.id,
          order_no: parsed.order_no,
          username: parsed.username,
          total_amount: parsed.total_amount,
          total_quantity: parsed.total_quantity,
          dishes_detail: parsed.dishes_detail,
          status: parsed.status,
          create_time: parsed.create_time
        }
      }) || []
    }
    return []
  } catch (error) {
    console.error('获取历史订单失败:', error)
    return []
  }
}
