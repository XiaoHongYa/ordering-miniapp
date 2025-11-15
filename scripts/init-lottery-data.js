// 初始化抽奖测试数据
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const APP_ID = process.env.VITE_FEISHU_APP_ID
const APP_SECRET = process.env.VITE_FEISHU_APP_SECRET
const APP_TOKEN = process.env.VITE_FEISHU_APP_TOKEN
const PRIZE_TABLE_ID = process.env.VITE_FEISHU_PRIZE_TABLE_ID

// 获取 tenant_access_token
async function getTenantAccessToken() {
  const response = await fetch(
    'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: APP_ID,
        app_secret: APP_SECRET
      })
    }
  )

  const data = await response.json()

  if (data.code !== 0) {
    throw new Error('获取 token 失败: ' + data.msg)
  }

  return data.tenant_access_token
}

// 批量创建奖品记录
async function createPrizes(token) {
  console.log('\n=== 开始创建奖品数据 ===\n')

  const prizes = [
    {
      prize_name: '5元券',
      prize_icon: '🎁',
      win_probability: 10,
      sort_order: 1,
      status: '启用'
    },
    {
      prize_name: '10元券',
      prize_icon: '💰',
      win_probability: 8,
      sort_order: 2,
      status: '启用'
    },
    {
      prize_name: '免费米饭',
      prize_icon: '🍚',
      win_probability: 12,
      sort_order: 3,
      status: '启用'
    },
    {
      prize_name: '免费饮料',
      prize_icon: '🥤',
      win_probability: 15,
      sort_order: 4,
      status: '启用'
    },
    {
      prize_name: '再接再厉',
      prize_icon: '💪',
      win_probability: 25,
      sort_order: 5,
      status: '启用'
    },
    {
      prize_name: '谢谢参与',
      prize_icon: '😊',
      win_probability: 30,
      sort_order: 6,
      status: '启用'
    }
  ]

  // 计算概率总和
  const totalProbability = prizes.reduce((sum, p) => sum + p.win_probability, 0)
  console.log(`✅ 概率总和: ${totalProbability}% ${totalProbability === 100 ? '(正确)' : '(错误！应该等于100)'}\n`)

  // 批量创建记录
  const records = prizes.map(prize => ({
    fields: prize
  }))

  const response = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${PRIZE_TABLE_ID}/records/batch_create`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        records: records
      })
    }
  )

  const result = await response.json()

  if (result.code !== 0) {
    throw new Error('创建奖品失败: ' + result.msg)
  }

  console.log('✅ 成功创建奖品数据:\n')
  prizes.forEach((prize, index) => {
    console.log(`${index + 1}. ${prize.prize_icon} ${prize.prize_name} - ${prize.win_probability}% 概率`)
  })

  return result.data.records
}

// 检查表中是否已有数据
async function checkExistingData(token) {
  const response = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${PRIZE_TABLE_ID}/records/search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 1
      })
    }
  )

  const result = await response.json()

  if (result.code !== 0) {
    throw new Error('查询数据失败: ' + result.msg)
  }

  return result.data?.items?.length > 0
}

// 主函数
async function main() {
  try {
    console.log('===========================================')
    console.log('    抽奖功能 - 初始化测试数据脚本')
    console.log('===========================================')

    // 1. 检查环境变量
    console.log('\n=== 检查环境变量 ===\n')
    console.log('APP_ID:', APP_ID ? '✅' : '❌')
    console.log('APP_SECRET:', APP_SECRET ? '✅' : '❌')
    console.log('APP_TOKEN:', APP_TOKEN ? '✅' : '❌')
    console.log('PRIZE_TABLE_ID:', PRIZE_TABLE_ID ? '✅' : '❌')

    if (!APP_ID || !APP_SECRET || !APP_TOKEN || !PRIZE_TABLE_ID) {
      throw new Error('环境变量配置不完整，请检查 .env 文件')
    }

    // 2. 获取 token
    console.log('\n=== 获取访问令牌 ===\n')
    const token = await getTenantAccessToken()
    console.log('✅ Token 获取成功')

    // 3. 检查是否已有数据
    console.log('\n=== 检查表中是否已有数据 ===\n')
    const hasData = await checkExistingData(token)

    if (hasData) {
      console.log('⚠️  警告: 表中已有数据')
      console.log('\n是否继续添加？这将会添加重复的奖品数据。')
      console.log('如果要清空后重新添加，请手动在飞书多维表格中删除现有数据。\n')

      // 在 Node.js 环境中，继续执行
      console.log('继续添加数据...\n')
    } else {
      console.log('✅ 表中暂无数据，可以安全添加')
    }

    // 4. 创建奖品数据
    const createdRecords = await createPrizes(token)

    // 5. 完成
    console.log('\n===========================================')
    console.log('✅ 初始化完成！')
    console.log('===========================================')
    console.log('\n📋 奖品表 URL:')
    console.log(`https://hx9pg0opel7.feishu.cn/base/${APP_TOKEN}?table=${PRIZE_TABLE_ID}`)
    console.log('\n💡 下一步:')
    console.log('1. 访问上面的链接查看创建的奖品')
    console.log('2. 运行 npm run dev 启动项目')
    console.log('3. 登录后点击菜单页面右下角的悬浮球进入抽奖页面')
    console.log('4. 点击"开始抽奖"测试功能\n')

  } catch (error) {
    console.error('\n❌ 错误:', error.message)
    console.error('\n可能的原因:')
    console.error('1. 网络连接问题')
    console.error('2. 飞书 APP_ID 或 APP_SECRET 不正确')
    console.error('3. 没有权限访问该多维表格')
    console.error('4. 表 ID 不正确\n')
    process.exit(1)
  }
}

main()
