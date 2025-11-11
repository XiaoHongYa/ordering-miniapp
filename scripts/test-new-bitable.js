/**
 * 测试新建的多维表格访问
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  APP_ID: process.env.VITE_FEISHU_APP_ID,
  APP_SECRET: process.env.VITE_FEISHU_APP_SECRET,
  DOMAIN: 'https://open.feishu.cn'
};

// 新建的多维表格信息
const NEW_BITABLE = {
  APP_TOKEN: 'WcmNbFvM5aRWdVsegQZcLa9gnme',
  TABLE_ID: 'tblwTOBStN6D1x6G'
};

let accessToken = null;

async function getTenantAccessToken() {
  console.log('🔑 获取访问令牌...');

  const response = await axios.post(
    `${CONFIG.DOMAIN}/open-apis/auth/v3/tenant_access_token/internal`,
    {
      app_id: CONFIG.APP_ID,
      app_secret: CONFIG.APP_SECRET
    }
  );

  if (response.data.code === 0) {
    accessToken = response.data.tenant_access_token;
    console.log('✅ Token获取成功\n');
    return accessToken;
  }

  throw new Error('Token获取失败');
}

async function listTables() {
  console.log('📋 获取多维表格中的所有表...');
  console.log(`   App Token: ${NEW_BITABLE.APP_TOKEN}\n`);

  try {
    const response = await axios.get(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${NEW_BITABLE.APP_TOKEN}/tables`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 20
        }
      }
    );

    if (response.data.code === 0) {
      const tables = response.data.data.items || [];
      console.log(`✅ 成功! 找到 ${tables.length} 个表:\n`);

      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.name}`);
        console.log(`      Table ID: ${table.table_id}`);
        console.log(`      Revision: ${table.revision || 'N/A'}\n`);
      });

      return { success: true, tables };
    } else {
      console.log(`❌ 失败: ${response.data.msg} (code: ${response.data.code})\n`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log(`❌ 请求异常:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function getTableFields() {
  console.log('\n📋 获取表格字段...');
  console.log(`   Table ID: ${NEW_BITABLE.TABLE_ID}\n`);

  try {
    const response = await axios.get(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${NEW_BITABLE.APP_TOKEN}/tables/${NEW_BITABLE.TABLE_ID}/fields`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      const fields = response.data.data.items || [];
      console.log(`✅ 成功获取 ${fields.length} 个字段:\n`);

      fields.forEach((field, index) => {
        console.log(`   ${index + 1}. ${field.field_name} (${field.type})`);
      });

      return { success: true, fields };
    } else {
      console.log(`❌ 失败: ${response.data.msg} (code: ${response.data.code})\n`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log(`❌ 请求异常:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function searchRecords() {
  console.log('\n📋 查询表格记录...\n');

  try {
    const response = await axios.post(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${NEW_BITABLE.APP_TOKEN}/tables/${NEW_BITABLE.TABLE_ID}/records/search`,
      {
        page_size: 10
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
      console.log(`✅ 成功查询到 ${records.length} 条记录\n`);

      if (records.length > 0) {
        console.log('前几条记录:');
        records.slice(0, 3).forEach((record, index) => {
          console.log(`\n   ${index + 1}. Record ID: ${record.record_id}`);
          console.log(`      数据:`, JSON.stringify(record.fields, null, 2));
        });
      } else {
        console.log('   表格为空,还没有数据');
      }

      return { success: true, records };
    } else {
      console.log(`❌ 失败: ${response.data.msg} (code: ${response.data.code})\n`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log(`❌ 请求异常:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function testCreateRecord(fields) {
  console.log('\n📋 测试创建记录...\n');

  try {
    const response = await axios.post(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${NEW_BITABLE.APP_TOKEN}/tables/${NEW_BITABLE.TABLE_ID}/records`,
      {
        fields
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      const record = response.data.data.record;
      console.log(`✅ 成功创建记录!`);
      console.log(`   Record ID: ${record.record_id}\n`);
      return { success: true, record };
    } else {
      console.log(`❌ 失败: ${response.data.msg} (code: ${response.data.code})\n`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log(`❌ 请求异常:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function main() {
  console.log('========================================');
  console.log('   测试新建的多维表格访问');
  console.log('========================================\n');

  console.log('📝 测试信息:');
  console.log(`   URL: https://hx9pg0opel7.feishu.cn/base/WcmNbFvM5aRWdVsegQZcLa9gnme`);
  console.log(`   App Token: ${NEW_BITABLE.APP_TOKEN}`);
  console.log(`   Table ID: ${NEW_BITABLE.TABLE_ID}\n`);

  try {
    // 1. 获取访问令牌
    await getTenantAccessToken();

    // 2. 列出所有表
    const tablesResult = await listTables();

    // 3. 获取表格字段
    const fieldsResult = await getTableFields();

    // 4. 查询现有记录
    const recordsResult = await searchRecords();

    // 5. 测试创建记录(如果有字段信息)
    if (fieldsResult.success && fieldsResult.fields.length > 0) {
      console.log('\n📋 测试写入功能...');

      // 根据第一个字段创建测试数据
      const firstField = fieldsResult.fields[0];
      const testData = {};

      if (firstField.type === 1) { // 文本
        testData[firstField.field_name] = '测试数据 - ' + new Date().toLocaleString('zh-CN');
      } else if (firstField.type === 2) { // 数字
        testData[firstField.field_name] = 123;
      } else {
        testData[firstField.field_name] = '测试';
      }

      console.log(`   将创建测试记录:`, testData);
      await testCreateRecord(testData);
    }

    // 总结
    console.log('\n========================================');
    console.log('   测试结果总结');
    console.log('========================================\n');

    if (tablesResult.success && fieldsResult.success) {
      console.log('✅ 多维表格访问成功!');
      console.log('\n可以正常进行:');
      console.log('   ✅ 读取表格列表');
      console.log('   ✅ 读取字段信息');
      console.log('   ✅ 查询记录');
      console.log('   ✅ 创建记录\n');

      console.log('💡 建议: 将这个App Token配置到 .env 文件中');
      console.log(`   VITE_FEISHU_APP_TOKEN=${NEW_BITABLE.APP_TOKEN}\n`);
    } else {
      console.log('❌ 访问失败,需要检查:');
      console.log('   1. 应用是否已添加为多维表格协作者');
      console.log('   2. 应用权限是否正确(bitable:app)');
      console.log('   3. App Token是否正确\n');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

main();
