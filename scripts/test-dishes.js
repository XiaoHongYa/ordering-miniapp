/**
 * 测试菜品数据获取
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  APP_ID: process.env.VITE_FEISHU_APP_ID,
  APP_SECRET: process.env.VITE_FEISHU_APP_SECRET,
  APP_TOKEN: process.env.VITE_FEISHU_APP_TOKEN,
  DISHES_TABLE_ID: process.env.VITE_FEISHU_DISHES_TABLE_ID,
  CATEGORIES_TABLE_ID: process.env.VITE_FEISHU_CATEGORIES_TABLE_ID,
  DOMAIN: 'https://open.feishu.cn'
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

async function getCategories() {
  console.log('\n📋 查询分类数据...\n');

  try {
    const response = await axios.post(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${CONFIG.APP_TOKEN}/tables/${CONFIG.CATEGORIES_TABLE_ID}/records/search`,
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
        },
        sort: [
          {
            field_name: 'sort_order',
            desc: false
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('响应状态:', response.data.code);

    if (response.data.code !== 0) {
      console.log('❌ 错误:', response.data.msg);
      console.log('完整响应:', JSON.stringify(response.data, null, 2));
      return [];
    }

    const categories = response.data.data?.items || [];
    console.log(`✅ 找到 ${categories.length} 个分类\n`);

    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ${JSON.stringify(cat.fields.name)} (status: ${cat.fields.status})`);
    });

    return categories;

  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
    return [];
  }
}

async function getDishes() {
  console.log('\n📋 查询菜品数据...\n');

  try {
    const response = await axios.post(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${CONFIG.APP_TOKEN}/tables/${CONFIG.DISHES_TABLE_ID}/records/search`,
      {
        filter: {
          conjunction: 'and',
          conditions: [
            {
              field_name: 'status',
              operator: 'is',
              value: ['上架']
            }
          ]
        },
        sort: [
          {
            field_name: 'sort_order',
            desc: false
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('响应状态:', response.data.code);

    if (response.data.code !== 0) {
      console.log('❌ 错误:', response.data.msg);
      console.log('完整响应:', JSON.stringify(response.data, null, 2));
      return [];
    }

    const dishes = response.data.data?.items || [];
    console.log(`✅ 找到 ${dishes.length} 个菜品\n`);

    if (dishes.length > 0) {
      console.log('前3个菜品详情:');
      dishes.slice(0, 3).forEach((dish, index) => {
        console.log(`\n${index + 1}. 菜品信息:`);
        console.log('   name:', JSON.stringify(dish.fields.name));
        console.log('   category_id:', JSON.stringify(dish.fields.category_id));
        console.log('   price:', dish.fields.price);
        console.log('   status:', dish.fields.status);
      });
    }

    return dishes;

  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
    return [];
  }
}

async function main() {
  console.log('========================================');
  console.log('   测试菜品数据获取');
  console.log('========================================');

  try {
    console.log('\n🔑 获取访问令牌...');
    await getTenantAccessToken();
    console.log('✅ Token获取成功');

    await getCategories();
    await getDishes();

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

main();
