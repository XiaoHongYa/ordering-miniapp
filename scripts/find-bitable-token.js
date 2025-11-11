/**
 * 查找Wiki中多维表格的真实Bitable App Token
 *
 * 问题: Wiki Token ≠ Bitable App Token
 * Wiki URL中的token是Wiki知识库的token,不是多维表格的app_token
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  APP_ID: process.env.VITE_FEISHU_APP_ID,
  APP_SECRET: process.env.VITE_FEISHU_APP_SECRET,
  DOMAIN: 'https://open.feishu.cn'
};

const WIKI_TOKEN = 'Einjw3fPoiw0UKk4WVOcu6l6nLe';
const TABLE_ID = process.env.VITE_FEISHU_USERS_TABLE_ID;

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

/**
 * 方法1: 通过Wiki API获取子节点,找到多维表格
 */
async function findBitableInWiki() {
  console.log('========================================');
  console.log('方法1: 从Wiki中查找多维表格节点');
  console.log('========================================\n');

  try {
    const response = await axios.get(
      `${CONFIG.DOMAIN}/open-apis/wiki/v2/spaces/${WIKI_TOKEN}/nodes`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: {
          page_size: 50
        }
      }
    );

    if (response.data.code === 0) {
      const nodes = response.data.data.items || [];
      console.log(`找到 ${nodes.length} 个子节点\n`);

      const bitableNodes = nodes.filter(node => node.obj_type === 'bitable');

      if (bitableNodes.length > 0) {
        console.log(`✅ 找到 ${bitableNodes.length} 个多维表格:\n`);

        bitableNodes.forEach((node, index) => {
          console.log(`${index + 1}. ${node.title || '无标题'}`);
          console.log(`   Node Token: ${node.node_token}`);
          console.log(`   Obj Token: ${node.obj_token}`);
          console.log(`   ⭐ 这个 obj_token 就是 Bitable App Token!\n`);
        });

        return bitableNodes;
      } else {
        console.log('❌ 没有找到多维表格节点');
        console.log('可能原因:');
        console.log('1. Wiki中没有多维表格');
        console.log('2. 多维表格在其他Wiki页面中');
        console.log('3. 应用没有权限访问\n');
      }
    } else {
      console.log(`❌ 失败: ${response.data.msg} (code: ${response.data.code})\n`);
    }
  } catch (error) {
    console.log(`❌ 请求异常:`, error.response?.data || error.message);
    console.log('');
  }

  return [];
}

/**
 * 方法2: 尝试常见的Token格式
 */
async function tryCommonTokenFormats() {
  console.log('========================================');
  console.log('方法2: 尝试常见的Bitable Token格式');
  console.log('========================================\n');

  // 根据经验,Wiki中的Bitable通常有以下可能的token
  const possibleTokens = [
    'H6RubLi8aadl13sUFGscl8WKn2f', // 之前配置的token
    WIKI_TOKEN, // Wiki token
  ];

  console.log('尝试的Token列表:');
  possibleTokens.forEach((token, i) => {
    console.log(`${i + 1}. ${token}`);
  });
  console.log('');

  for (const token of possibleTokens) {
    console.log(`测试Token: ${token.substring(0, 20)}...`);

    try {
      const response = await axios.get(
        `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${token}/tables`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
          params: { page_size: 10 }
        }
      );

      if (response.data.code === 0) {
        const tables = response.data.data.items || [];
        console.log(`✅ 成功! 找到 ${tables.length} 个表:`);

        tables.forEach((table, index) => {
          console.log(`   ${index + 1}. ${table.name} (${table.table_id})`);
        });

        console.log(`\n⭐⭐⭐ 找到正确的 App Token: ${token} ⭐⭐⭐\n`);

        // 检查目标表是否存在
        const targetTable = tables.find(t => t.table_id === TABLE_ID);
        if (targetTable) {
          console.log(`✅ 确认: 目标表 "${targetTable.name}" (${TABLE_ID}) 存在!\n`);
        } else {
          console.log(`⚠️  目标表 ${TABLE_ID} 不在此App中\n`);
        }

        return { success: true, token, tables };
      }
    } catch (error) {
      console.log(`❌ 失败: ${error.response?.data?.msg || error.message}\n`);
    }
  }

  return { success: false };
}

/**
 * 方法3: 从表URL推断
 */
function analyzeTableURL() {
  console.log('========================================');
  console.log('方法3: 分析表格URL结构');
  console.log('========================================\n');

  const url = 'https://hx9pg0opel7.feishu.cn/wiki/Einjw3fPoiw0UKk4WVOcu6l6nLe?table=tblu886lTbkK6M9Y';

  console.log('URL结构分析:');
  console.log(`完整URL: ${url}`);
  console.log('');
  console.log('分解:');
  console.log(`  域名: hx9pg0opel7.feishu.cn`);
  console.log(`  路径: /wiki/Einjw3fPoiw0UKk4WVOcu6l6nLe`);
  console.log(`  参数: table=tblu886lTbkK6M9Y`);
  console.log('');
  console.log('结论:');
  console.log('  ❌ 这是Wiki URL,不是Bitable URL!');
  console.log('  ✅ Wiki中嵌入的多维表格有独立的Bitable App Token');
  console.log('  ✅ 需要找到多维表格自己的App Token');
  console.log('');
  console.log('标准的Bitable URL格式应该是:');
  console.log('  https://xxx.feishu.cn/base/APP_TOKEN?table=TABLE_ID');
  console.log('                          ^^^^');
  console.log('                          这里才是 Bitable App Token');
  console.log('');
}

async function main() {
  console.log('========================================');
  console.log('   查找正确的Bitable App Token');
  console.log('========================================\n');

  try {
    await getTenantAccessToken();

    // 方法3: 先分析URL
    analyzeTableURL();

    // 方法2: 尝试常见格式(最快)
    const result = await tryCommonTokenFormats();

    if (!result.success) {
      // 方法1: 从Wiki中查找(需要wiki:wiki权限)
      const bitables = await findBitableInWiki();

      if (bitables.length > 0) {
        console.log('========================================');
        console.log('   建议的配置');
        console.log('========================================\n');
        console.log('请将 .env 文件中的 VITE_FEISHU_APP_TOKEN 更新为:');
        console.log(`VITE_FEISHU_APP_TOKEN=${bitables[0].obj_token}`);
        console.log('');
      }
    }

    console.log('========================================');
    console.log('   如何手动获取Bitable App Token?');
    console.log('========================================\n');
    console.log('1. 在飞书中打开多维表格');
    console.log('2. 点击右上角"..."→"分享"');
    console.log('3. 复制分享链接');
    console.log('4. 如果链接是: https://xxx.feishu.cn/base/ABC123?table=tblXXX');
    console.log('   那么 ABC123 就是 Bitable App Token');
    console.log('5. 如果链接还是Wiki格式,说明这个表格无法独立访问');
    console.log('   需要在Wiki中直接打开表格,然后查看URL');
    console.log('');

  } catch (error) {
    console.error('❌ 执行失败:', error.message);
  }
}

main();
