/**
 * 飞书多维表格API测试脚本
 * 用于诊断Wiki表格访问权限和配置问题
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// 从环境变量读取配置
const CONFIG = {
  APP_ID: process.env.VITE_FEISHU_APP_ID,
  APP_SECRET: process.env.VITE_FEISHU_APP_SECRET,
  APP_TOKEN: process.env.VITE_FEISHU_APP_TOKEN, // Wiki Token
  DOMAIN: 'https://open.feishu.cn'
};

// 测试用的表ID
const TEST_TABLES = {
  USERS: process.env.VITE_FEISHU_USERS_TABLE_ID,
  ANNOUNCEMENTS: process.env.VITE_FEISHU_ANNOUNCEMENTS_TABLE_ID,
  CATEGORIES: process.env.VITE_FEISHU_CATEGORIES_TABLE_ID,
  DISHES: process.env.VITE_FEISHU_DISHES_TABLE_ID,
  ORDERS: process.env.VITE_FEISHU_ORDERS_TABLE_ID
};

let accessToken = null;

/**
 * 获取tenant_access_token
 */
async function getTenantAccessToken() {
  console.log('\n🔑 [步骤1] 获取 tenant_access_token...');
  console.log(`   App ID: ${CONFIG.APP_ID}`);
  console.log(`   App Secret: ${CONFIG.APP_SECRET.substring(0, 10)}...`);

  try {
    const response = await axios.post(
      `${CONFIG.DOMAIN}/open-apis/auth/v3/tenant_access_token/internal`,
      {
        app_id: CONFIG.APP_ID,
        app_secret: CONFIG.APP_SECRET
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.data.code === 0) {
      accessToken = response.data.tenant_access_token;
      console.log('   ✅ Token获取成功');
      console.log(`   Token: ${accessToken.substring(0, 20)}...`);
      console.log(`   过期时间: ${response.data.expire}秒\n`);
      return accessToken;
    } else {
      console.error('   ❌ Token获取失败:', response.data.msg);
      throw new Error(response.data.msg);
    }
  } catch (error) {
    console.error('   ❌ 请求失败:', error.message);
    throw error;
  }
}

/**
 * 测试获取表格字段列表
 */
async function testListFields(tableName, tableId) {
  console.log(`\n📋 [测试] 获取${tableName}表的字段列表...`);
  console.log(`   App Token: ${CONFIG.APP_TOKEN}`);
  console.log(`   Table ID: ${tableId}`);

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
      console.log(`   ✅ 成功获取 ${fields.length} 个字段:`);
      fields.forEach((field, index) => {
        console.log(`      ${index + 1}. ${field.field_name} (${getFieldTypeName(field.type)})`);
      });
      return { success: true, fields };
    } else {
      console.error(`   ❌ 失败:`, response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error(`   ❌ 请求异常:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * 测试查询记录
 */
async function testSearchRecords(tableName, tableId) {
  console.log(`\n🔍 [测试] 查询${tableName}表的记录...`);

  try {
    const response = await axios.post(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${CONFIG.APP_TOKEN}/tables/${tableId}/records/search`,
      {
        automatic_fields: true,
        page_size: 5
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      const items = response.data.data?.items || [];
      console.log(`   ✅ 成功查询到 ${items.length} 条记录`);

      if (items.length > 0) {
        console.log(`   记录预览 (前3条):`);
        items.slice(0, 3).forEach((item, index) => {
          console.log(`      ${index + 1}. Record ID: ${item.record_id}`);
          const firstFields = Object.entries(item.fields).slice(0, 3);
          firstFields.forEach(([key, value]) => {
            console.log(`         ${key}: ${JSON.stringify(value).substring(0, 50)}...`);
          });
        });
      }
      return { success: true, records: items };
    } else {
      console.error(`   ❌ 失败:`, response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error(`   ❌ 请求异常:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * 测试创建记录
 */
async function testCreateRecord(tableName, tableId, fields) {
  console.log(`\n✍️  [测试] 在${tableName}表创建记录...`);

  try {
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
      const record = response.data.data.record;
      console.log(`   ✅ 成功创建记录`);
      console.log(`      Record ID: ${record.record_id}`);
      return { success: true, record };
    } else {
      console.error(`   ❌ 失败:`, response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.error(`   ❌ 请求异常:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * 字段类型名称映射
 */
function getFieldTypeName(type) {
  const types = {
    1: '文本', 2: '数字', 3: '单选', 4: '多选', 5: '日期',
    7: '复选框', 11: '人员', 13: '电话', 15: 'URL', 17: '附件',
    18: '单向关联', 20: '公式', 21: '双向关联', 22: '地理位置',
    1001: '创建时间', 1002: '最后更新时间',
    1003: '创建人', 1004: '修改人', 1005: '自动编号'
  };
  return types[type] || `未知(${type})`;
}

/**
 * 主测试流程
 */
async function main() {
  console.log('========================================');
  console.log('    飞书Wiki多维表格API诊断测试');
  console.log('========================================');

  // 检查配置
  console.log('\n📝 配置检查:');
  console.log(`   App ID: ${CONFIG.APP_ID}`);
  console.log(`   App Secret: ${CONFIG.APP_SECRET ? '已配置' : '❌ 未配置'}`);
  console.log(`   App Token (Wiki Token): ${CONFIG.APP_TOKEN}`);
  console.log(`   Domain: ${CONFIG.DOMAIN}`);

  if (!CONFIG.APP_ID || !CONFIG.APP_SECRET || !CONFIG.APP_TOKEN) {
    console.error('\n❌ 配置不完整,请检查 .env 文件');
    return;
  }

  try {
    // 1. 获取访问令牌
    await getTenantAccessToken();

    // 2. 测试用户表
    console.log('\n========================================');
    console.log('   测试1: 用户表 (USERS)');
    console.log('========================================');

    const fieldsResult1 = await testListFields('用户', TEST_TABLES.USERS);
    if (fieldsResult1.success) {
      await testSearchRecords('用户', TEST_TABLES.USERS);
    }

    // 3. 测试公告表
    console.log('\n========================================');
    console.log('   测试2: 商家公告表 (ANNOUNCEMENTS)');
    console.log('========================================');

    const fieldsResult2 = await testListFields('商家公告', TEST_TABLES.ANNOUNCEMENTS);
    if (fieldsResult2.success) {
      await testSearchRecords('商家公告', TEST_TABLES.ANNOUNCEMENTS);
    }

    // 4. 测试分类表
    console.log('\n========================================');
    console.log('   测试3: 菜品分类表 (CATEGORIES)');
    console.log('========================================');

    const fieldsResult3 = await testListFields('菜品分类', TEST_TABLES.CATEGORIES);
    if (fieldsResult3.success) {
      await testSearchRecords('菜品分类', TEST_TABLES.CATEGORIES);
    }

    // 5. 测试菜品表
    console.log('\n========================================');
    console.log('   测试4: 菜品表 (DISHES)');
    console.log('========================================');

    const fieldsResult4 = await testListFields('菜品', TEST_TABLES.DISHES);
    if (fieldsResult4.success) {
      await testSearchRecords('菜品', TEST_TABLES.DISHES);
    }

    // 6. 测试订单表 (读取 + 写入)
    console.log('\n========================================');
    console.log('   测试5: 订单表 (ORDERS) - 读取 + 写入测试');
    console.log('========================================');

    const fieldsResult5 = await testListFields('订单', TEST_TABLES.ORDERS);
    if (fieldsResult5.success) {
      // 先读取
      await testSearchRecords('订单', TEST_TABLES.ORDERS);

      // 再测试写入
      const testOrder = {
        order_no: `TEST_${Date.now()}`,
        username: 'test',
        total_amount: 66.00,
        total_quantity: 2,
        dishes_detail: JSON.stringify([
          { name: '测试菜品1', price: 38, quantity: 1 },
          { name: '测试菜品2', price: 28, quantity: 1 }
        ]),
        status: '待处理'
      };

      await testCreateRecord('订单', TEST_TABLES.ORDERS, testOrder);
    }

    // 总结
    console.log('\n========================================');
    console.log('   测试完成');
    console.log('========================================');
    console.log('\n✅ 如果所有测试通过,说明配置正确');
    console.log('❌ 如果出现错误,请检查:');
    console.log('   1. 飞书应用是否有 bitable:app 权限');
    console.log('   2. 飞书应用是否有 wiki:wiki 权限');
    console.log('   3. 应用是否被添加为Wiki协作者');
    console.log('   4. App Token (Wiki Token) 是否正确');
    console.log('   5. 各个 Table ID 是否正确\n');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

// 运行测试
main().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
