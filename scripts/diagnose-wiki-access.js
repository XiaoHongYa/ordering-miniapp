/**
 * Wiki表格访问深度诊断脚本
 * 用于排查 code: 91402, msg: 'NOTEXIST' 错误的所有可能原因
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  APP_ID: process.env.VITE_FEISHU_APP_ID,
  APP_SECRET: process.env.VITE_FEISHU_APP_SECRET,
  APP_TOKEN: process.env.VITE_FEISHU_APP_TOKEN,
  DOMAIN: 'https://open.feishu.cn'
};

const WIKI_URL = 'https://hx9pg0opel7.feishu.cn/wiki/Einjw3fPoiw0UKk4WVOcu6l6nLe';
const TEST_TABLE_ID = process.env.VITE_FEISHU_USERS_TABLE_ID;

let accessToken = null;

async function getTenantAccessToken() {
  console.log('\n🔑 [步骤1] 获取 tenant_access_token...');

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
 * 尝试1: 使用Wiki API获取节点信息
 */
async function testWikiNodeAPI() {
  console.log('\n📋 [尝试1] 通过Wiki API获取节点信息...');
  console.log(`   Wiki Token: ${CONFIG.APP_TOKEN}`);

  try {
    const response = await axios.get(
      `${CONFIG.DOMAIN}/open-apis/wiki/v2/spaces/get_node`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: {
          token: CONFIG.APP_TOKEN,
          obj_type: 'bitable'
        }
      }
    );

    if (response.data.code === 0) {
      const node = response.data.data.node;
      console.log('   ✅ Wiki节点信息获取成功!');
      console.log(`      节点标题: ${node.title || 'N/A'}`);
      console.log(`      节点类型: ${node.obj_type || 'N/A'}`);
      console.log(`      Obj Token: ${node.obj_token || 'N/A'}`);
      console.log(`      Has Children: ${node.has_child || false}`);

      return { success: true, node };
    } else {
      console.log(`   ❌ 失败: ${response.data.msg} (code: ${response.data.code})`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log(`   ❌ 请求异常:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * 尝试2: 直接访问表格字段
 */
async function testDirectTableAccess() {
  console.log('\n📋 [尝试2] 直接访问表格字段...');
  console.log(`   App Token: ${CONFIG.APP_TOKEN}`);
  console.log(`   Table ID: ${TEST_TABLE_ID}`);

  try {
    const response = await axios.get(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${CONFIG.APP_TOKEN}/tables/${TEST_TABLE_ID}/fields`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      const fields = response.data.data.items || [];
      console.log(`   ✅ 成功! 获取到 ${fields.length} 个字段`);
      return { success: true, fields };
    } else {
      console.log(`   ❌ 失败: ${response.data.msg} (code: ${response.data.code})`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log(`   ❌ 请求异常:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * 尝试3: 获取App的所有表
 */
async function testListTables() {
  console.log('\n📋 [尝试3] 获取App下的所有表...');
  console.log(`   App Token: ${CONFIG.APP_TOKEN}`);

  try {
    const response = await axios.get(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${CONFIG.APP_TOKEN}/tables`,
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
      console.log(`   ✅ 成功! 找到 ${tables.length} 个表:`);

      if (tables.length > 0) {
        tables.forEach((table, index) => {
          console.log(`      ${index + 1}. ${table.name} (ID: ${table.table_id})`);
        });

        // 检查测试表ID是否在列表中
        const testTableExists = tables.some(t => t.table_id === TEST_TABLE_ID);
        if (testTableExists) {
          console.log(`\n   ✅ 测试表 ${TEST_TABLE_ID} 存在于列表中`);
        } else {
          console.log(`\n   ⚠️  测试表 ${TEST_TABLE_ID} 不在列表中!`);
          console.log(`   这可能是问题的原因!`);
        }
      }

      return { success: true, tables };
    } else {
      console.log(`   ❌ 失败: ${response.data.msg} (code: ${response.data.code})`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log(`   ❌ 请求异常:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * 尝试4: 检查应用权限范围
 */
async function testAppPermissions() {
  console.log('\n📋 [尝试4] 检查应用权限范围...');

  // 测试不同的权限范围
  const tests = [
    {
      name: 'Wiki节点访问',
      endpoint: `/open-apis/wiki/v2/spaces/get_node`,
      params: { token: CONFIG.APP_TOKEN, obj_type: 'bitable' }
    },
    {
      name: 'Bitable App信息',
      endpoint: `/open-apis/bitable/v1/apps/${CONFIG.APP_TOKEN}`
    }
  ];

  for (const test of tests) {
    console.log(`\n   测试: ${test.name}`);
    try {
      const response = await axios.get(
        `${CONFIG.DOMAIN}${test.endpoint}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          params: test.params
        }
      );

      if (response.data.code === 0) {
        console.log(`   ✅ 成功`);
      } else {
        console.log(`   ❌ 失败: ${response.data.msg} (code: ${response.data.code})`);
      }
    } catch (error) {
      console.log(`   ❌ 异常:`, error.response?.data?.msg || error.message);
    }
  }
}

/**
 * 尝试5: 使用obj_token访问(如果能获取到)
 */
async function testWithObjToken(objToken) {
  if (!objToken) return { success: false };

  console.log('\n📋 [尝试5] 使用obj_token访问表格...');
  console.log(`   Obj Token: ${objToken}`);
  console.log(`   Table ID: ${TEST_TABLE_ID}`);

  try {
    const response = await axios.get(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${objToken}/tables/${TEST_TABLE_ID}/fields`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      const fields = response.data.data.items || [];
      console.log(`   ✅ 成功! 使用obj_token获取到 ${fields.length} 个字段`);
      console.log(`   💡 建议: 使用obj_token而不是wiki_token`);
      return { success: true, fields, useObjToken: true };
    } else {
      console.log(`   ❌ 失败: ${response.data.msg} (code: ${response.data.code})`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log(`   ❌ 请求异常:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

async function main() {
  console.log('========================================');
  console.log('   Wiki表格访问深度诊断');
  console.log('========================================');

  console.log('\n📝 当前配置:');
  console.log(`   App ID: ${CONFIG.APP_ID}`);
  console.log(`   App Token (Wiki Token): ${CONFIG.APP_TOKEN}`);
  console.log(`   Wiki URL: ${WIKI_URL}`);
  console.log(`   测试表ID: ${TEST_TABLE_ID}`);

  try {
    // 获取访问令牌
    await getTenantAccessToken();

    // 尝试1: Wiki API
    const wikiResult = await testWikiNodeAPI();

    // 尝试2: 直接访问
    const directResult = await testDirectTableAccess();

    // 尝试3: 列出所有表
    const tablesResult = await testListTables();

    // 尝试4: 检查权限
    await testAppPermissions();

    // 尝试5: 如果获取到obj_token,尝试使用它
    if (wikiResult.success && wikiResult.node?.obj_token) {
      await testWithObjToken(wikiResult.node.obj_token);
    }

    // 总结分析
    console.log('\n========================================');
    console.log('   诊断结果分析');
    console.log('========================================');

    if (directResult.success) {
      console.log('\n✅ 配置正确! 可以正常访问表格');
    } else {
      console.log('\n❌ 存在问题,可能的原因:');

      if (!wikiResult.success) {
        console.log('\n1. ⚠️  Wiki API访问失败');
        console.log('   原因: 应用可能缺少 wiki:wiki 权限');
        console.log('   解决: 在飞书开放平台为应用开通 wiki:wiki 权限');
      }

      if (tablesResult.success && tablesResult.tables.length === 0) {
        console.log('\n2. ⚠️  App下没有任何表');
        console.log('   原因: Wiki Token可能不正确,或Wiki不是多维表格类型');
        console.log(`   解决: 确认Wiki URL是否正确: ${WIKI_URL}`);
      }

      if (tablesResult.success && tablesResult.tables.length > 0) {
        const testTableExists = tablesResult.tables.some(t => t.table_id === TEST_TABLE_ID);
        if (!testTableExists) {
          console.log('\n3. ⚠️  指定的Table ID不在App中');
          console.log(`   原因: Table ID ${TEST_TABLE_ID} 可能不属于这个Wiki`);
          console.log('   解决: 检查Table ID是否正确,或使用列出的表ID');
        }
      }

      if (!tablesResult.success && tablesResult.error?.code === 91402) {
        console.log('\n4. ⚠️  91402错误 - 应用没有访问权限');
        console.log('   可能原因:');
        console.log('   a) 应用未被添加为Wiki协作者 (最常见)');
        console.log('   b) 应用缺少 bitable:app 权限');
        console.log('   c) Wiki Token不正确');
        console.log('   d) Wiki的可见性设置不允许应用访问');
        console.log('\n   建议排查顺序:');
        console.log('   1. 确认应用已添加为Wiki协作者且权限为"可编辑"');
        console.log('   2. 检查应用是否有 bitable:app 和 wiki:wiki 权限');
        console.log('   3. 确认Wiki Token是否从正确的URL提取');
        console.log('   4. 检查Wiki的可见性设置(私密/组织可见/公开)');
      }
    }

    console.log('\n========================================');
    console.log('   需要更多帮助?');
    console.log('========================================');
    console.log('\n查看详细配置指南: ./飞书Wiki权限配置指南.md');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ 诊断失败:', error.message);
  }
}

main().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
