/**
 * 检查用户表的实际数据
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

async function checkUsers() {
  console.log('\n📋 查询用户表所有记录...\n');

  try {
    const response = await axios.post(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${CONFIG.APP_TOKEN}/tables/${CONFIG.USERS_TABLE_ID}/records/search`,
      {
        page_size: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      const records = response.data.data.items || [];
      console.log(`✅ 找到 ${records.length} 条用户记录\n`);

      records.forEach((record, index) => {
        console.log(`\n--- 用户 ${index + 1} ---`);
        console.log('Record ID:', record.record_id);
        console.log('字段数据:');
        for (const [key, value] of Object.entries(record.fields)) {
          console.log(`  ${key}:`, JSON.stringify(value));
        }
      });
    } else {
      console.log('❌ 查询失败:', response.data.msg);
    }

  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
  }
}

async function getFieldInfo() {
  console.log('\n📋 获取用户表字段信息...\n');

  try {
    const response = await axios.get(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${CONFIG.APP_TOKEN}/tables/${CONFIG.USERS_TABLE_ID}/fields`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      const fields = response.data.data.items || [];
      console.log(`✅ 找到 ${fields.length} 个字段\n`);

      fields.forEach(field => {
        console.log(`\n字段: ${field.field_name}`);
        console.log(`  类型: ${field.type}`);
        if (field.property?.options) {
          console.log(`  选项:`);
          field.property.options.forEach(opt => {
            console.log(`    - ${opt.name} (id: ${opt.id})`);
          });
        }
      });
    } else {
      console.log('❌ 获取失败:', response.data.msg);
    }

  } catch (error) {
    console.error('❌ 请求失败:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('========================================');
  console.log('   检查用户表数据');
  console.log('========================================');

  try {
    console.log('\n🔑 获取访问令牌...');
    await getTenantAccessToken();
    console.log('✅ Token获取成功');

    await getFieldInfo();
    await checkUsers();

  } catch (error) {
    console.error('❌ 执行失败:', error.message);
  }
}

main();
