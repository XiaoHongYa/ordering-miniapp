/**
 * 初始化测试数据到新创建的表中
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  APP_ID: process.env.VITE_FEISHU_APP_ID,
  APP_SECRET: process.env.VITE_FEISHU_APP_SECRET,
  APP_TOKEN: process.env.VITE_FEISHU_APP_TOKEN,
  DOMAIN: 'https://open.feishu.cn',
  TABLES: {
    USERS: process.env.VITE_FEISHU_USERS_TABLE_ID,
    ANNOUNCEMENTS: process.env.VITE_FEISHU_ANNOUNCEMENTS_TABLE_ID,
    CATEGORIES: process.env.VITE_FEISHU_CATEGORIES_TABLE_ID,
    DISHES: process.env.VITE_FEISHU_DISHES_TABLE_ID,
    ORDERS: process.env.VITE_FEISHU_ORDERS_TABLE_ID
  }
};

let accessToken = null;

async function getTenantAccessToken() {
  const response = await axios.post(
    `${CONFIG.DOMAIN}/open-apis/auth/v3/tenant_access_token/internal`,
    {
      app_id: CONFIG.APP_ID,
      app_secret: CONFIG.APP_SECRET
    }
  );

  if (response.data.code === 0) {
    accessToken = response.data.tenant_access_token;
    return accessToken;
  }

  throw new Error('Token获取失败');
}

async function createRecord(tableId, fields) {
  const response = await axios.post(
    `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${CONFIG.APP_TOKEN}/tables/${tableId}/records`,
    { fields },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (response.data.code === 0) {
    return { success: true, record: response.data.data.record };
  }

  throw new Error(`创建失败: ${response.data.msg}`);
}

// 初始化数据
const INIT_DATA = {
  users: [
    {
      username: 'test',
      password: '123456',
      name: '测试用户',
      status: '正常'
    },
    {
      username: 'admin',
      password: 'admin123',
      name: '管理员',
      status: '正常'
    }
  ],

  announcements: [
    {
      title: '欢迎光临',
      content: '本店提供各类美食,欢迎品尝!',
      status: '启用',
      sort: 1
    },
    {
      title: '营业时间',
      content: '每天10:00-22:00营业,欢迎光临!',
      status: '启用',
      sort: 2
    }
  ],

  categories: [
    { name: '热菜', sort: 1, status: '启用' },
    { name: '凉菜', sort: 2, status: '启用' },
    { name: '主食', sort: 3, status: '启用' },
    { name: '汤品', sort: 4, status: '启用' },
    { name: '饮品', sort: 5, status: '启用' }
  ],

  dishes: [
    // 热菜
    {
      name: '红烧肉',
      price: 38,
      category: '热菜',
      image: 'https://via.placeholder.com/200x200?text=红烧肉',
      description: '色泽红亮,肥而不腻',
      status: '上架',
      sort: 1
    },
    {
      name: '宫保鸡丁',
      price: 32,
      category: '热菜',
      image: 'https://via.placeholder.com/200x200?text=宫保鸡丁',
      description: '鲜嫩爽口,酸甜适中',
      status: '上架',
      sort: 2
    },
    {
      name: '鱼香肉丝',
      price: 28,
      category: '热菜',
      image: 'https://via.placeholder.com/200x200?text=鱼香肉丝',
      description: '咸鲜酸甜,葱姜蒜香',
      status: '上架',
      sort: 3
    },

    // 凉菜
    {
      name: '口水鸡',
      price: 26,
      category: '凉菜',
      image: 'https://via.placeholder.com/200x200?text=口水鸡',
      description: '麻辣鲜香,鸡肉嫩滑',
      status: '上架',
      sort: 4
    },
    {
      name: '拍黄瓜',
      price: 12,
      category: '凉菜',
      image: 'https://via.placeholder.com/200x200?text=拍黄瓜',
      description: '清爽开胃,蒜香浓郁',
      status: '上架',
      sort: 5
    },

    // 主食
    {
      name: '米饭',
      price: 2,
      category: '主食',
      image: 'https://via.placeholder.com/200x200?text=米饭',
      description: '香软可口',
      status: '上架',
      sort: 6
    },
    {
      name: '炒饭',
      price: 15,
      category: '主食',
      image: 'https://via.placeholder.com/200x200?text=炒饭',
      description: '粒粒分明,蛋香十足',
      status: '上架',
      sort: 7
    },

    // 汤品
    {
      name: '番茄蛋汤',
      price: 18,
      category: '汤品',
      image: 'https://via.placeholder.com/200x200?text=番茄蛋汤',
      description: '酸甜可口,营养丰富',
      status: '上架',
      sort: 8
    },

    // 饮品
    {
      name: '可乐',
      price: 5,
      category: '饮品',
      image: 'https://via.placeholder.com/200x200?text=可乐',
      description: '冰爽解渴',
      status: '上架',
      sort: 9
    },
    {
      name: '橙汁',
      price: 8,
      category: '饮品',
      image: 'https://via.placeholder.com/200x200?text=橙汁',
      description: '鲜榨橙汁,维C丰富',
      status: '上架',
      sort: 10
    }
  ]
};

async function initTable(tableName, tableId, data) {
  console.log(`\n📋 初始化${tableName}...`);
  console.log(`   将创建 ${data.length} 条记录`);

  let successCount = 0;
  let failCount = 0;

  for (const item of data) {
    try {
      await createRecord(tableId, item);
      successCount++;
      process.stdout.write('.');
    } catch (error) {
      failCount++;
      process.stdout.write('x');
    }
  }

  console.log(`\n   ✅ 成功: ${successCount} 条`);
  if (failCount > 0) {
    console.log(`   ❌ 失败: ${failCount} 条`);
  }

  return { successCount, failCount };
}

async function main() {
  console.log('========================================');
  console.log('   初始化测试数据');
  console.log('========================================\n');

  console.log('📝 配置信息:');
  console.log(`   App Token: ${CONFIG.APP_TOKEN}`);
  console.log(`   用户表: ${CONFIG.TABLES.USERS}`);
  console.log(`   公告表: ${CONFIG.TABLES.ANNOUNCEMENTS}`);
  console.log(`   分类表: ${CONFIG.TABLES.CATEGORIES}`);
  console.log(`   菜品表: ${CONFIG.TABLES.DISHES}`);
  console.log(`   订单表: ${CONFIG.TABLES.ORDERS}`);

  try {
    console.log('\n🔑 获取访问令牌...');
    await getTenantAccessToken();
    console.log('✅ Token获取成功');

    const results = {
      users: await initTable('用户表', CONFIG.TABLES.USERS, INIT_DATA.users),
      announcements: await initTable('商家公告表', CONFIG.TABLES.ANNOUNCEMENTS, INIT_DATA.announcements),
      categories: await initTable('菜品分类表', CONFIG.TABLES.CATEGORIES, INIT_DATA.categories),
      dishes: await initTable('菜品表', CONFIG.TABLES.DISHES, INIT_DATA.dishes)
    };

    console.log('\n========================================');
    console.log('   初始化结果总结');
    console.log('========================================\n');

    const totalSuccess = Object.values(results).reduce((sum, r) => sum + r.successCount, 0);
    const totalFail = Object.values(results).reduce((sum, r) => sum + r.failCount, 0);

    console.log(`✅ 总共成功: ${totalSuccess} 条记录`);
    console.log(`❌ 总共失败: ${totalFail} 条记录\n`);

    console.log('详细统计:');
    console.log(`   用户: ${results.users.successCount}/${INIT_DATA.users.length}`);
    console.log(`   公告: ${results.announcements.successCount}/${INIT_DATA.announcements.length}`);
    console.log(`   分类: ${results.categories.successCount}/${INIT_DATA.categories.length}`);
    console.log(`   菜品: ${results.dishes.successCount}/${INIT_DATA.dishes.length}`);

    if (totalFail === 0) {
      console.log('\n🎉 所有数据初始化成功!');
      console.log('\n测试账号:');
      console.log('   用户名: test');
      console.log('   密码: 123456\n');
      console.log('现在可以运行应用测试功能了!');
      console.log('   npm run dev\n');
    } else {
      console.log('\n⚠️  部分数据初始化失败,请检查错误信息');
    }

  } catch (error) {
    console.error('\n❌ 初始化失败:', error.message);
    console.error(error);
  }
}

main();
