/**
 * 检查所有表的字段信息
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
    'categories': process.env.VITE_FEISHU_CATEGORIES_TABLE_ID,
    'dishes': process.env.VITE_FEISHU_DISHES_TABLE_ID,
    'announcements': process.env.VITE_FEISHU_ANNOUNCEMENTS_TABLE_ID
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

async function getFieldInfo(tableName, tableId) {
  console.log(`\n========== ${tableName} 表 ==========`);
  console.log(`Table ID: ${tableId}\n`);

  try {
    const response = await axios.get(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${CONFIG.APP_TOKEN}/tables/${tableId}/fields`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      const fields = response.data.data.items || [];
      console.log(`✅ 找到 ${fields.length} 个字段:\n`);

      fields.forEach((field, index) => {
        console.log(`${index + 1}. ${field.field_name} (类型: ${field.type})`);
        if (field.property?.options) {
          console.log(`   选项:`);
          field.property.options.forEach(opt => {
            console.log(`     - ${opt.name}`);
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
  console.log('   检查所有表的字段');
  console.log('========================================');

  try {
    console.log('\n🔑 获取访问令牌...');
    await getTenantAccessToken();
    console.log('✅ Token获取成功');

    for (const [name, tableId] of Object.entries(CONFIG.TABLES)) {
      await getFieldInfo(name, tableId);
    }

  } catch (error) {
    console.error('❌ 执行失败:', error.message);
  }
}

main();
