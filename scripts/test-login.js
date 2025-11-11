/**
 * 测试登录功能和数据格式
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  APP_ID: process.env.VITE_FEISHU_APP_ID,
  APP_SECRET: process.env.VITE_FEISHU_APP_SECRET,
  APP_TOKEN: process.env.VITE_FEISHU_APP_TOKEN,
  USERS_TABLE_ID: process.env.VITE_FEISHU_USERS_TABLE_ID,
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

async function testLogin(username, password) {
  console.log(`\n🔐 测试登录: ${username} / ${password}\n`);

  try {
    const response = await axios.post(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${CONFIG.APP_TOKEN}/tables/${CONFIG.USERS_TABLE_ID}/records/search`,
      {
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
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ 响应状态:', response.data.code);

    if (response.data.code !== 0) {
      console.log('❌ 错误信息:', response.data.msg);
      console.log('完整响应:', JSON.stringify(response.data, null, 2));
      return response.data;
    }

    console.log('📊 找到记录数:', response.data.data?.items?.length || 0);

    if (response.data.data?.items?.length > 0) {
      const record = response.data.data.items[0];
      console.log('\n📋 原始记录格式:');
      console.log(JSON.stringify(record, null, 2));

      console.log('\n📋 字段详情:');
      for (const [key, value] of Object.entries(record.fields)) {
        console.log(`   ${key}:`, JSON.stringify(value));
        console.log(`   类型:`, typeof value, Array.isArray(value) ? '(array)' : '');
      }
    } else {
      console.log('❌ 未找到匹配的用户');
    }

    return response.data;

  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log('========================================');
  console.log('   测试登录功能');
  console.log('========================================');

  try {
    console.log('\n🔑 获取访问令牌...');
    await getTenantAccessToken();
    console.log('✅ Token获取成功');

    // 测试正确的账号密码
    await testLogin('test', '123456');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

main();
