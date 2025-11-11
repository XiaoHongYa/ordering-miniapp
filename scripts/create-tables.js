/**
 * 在新的多维表格中创建所需的5个表
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CONFIG = {
  APP_ID: process.env.VITE_FEISHU_APP_ID,
  APP_SECRET: process.env.VITE_FEISHU_APP_SECRET,
  APP_TOKEN: 'WcmNbFvM5aRWdVsegQZcLa9gnme',
  DOMAIN: 'https://open.feishu.cn'
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

async function createTable(tableDefinition) {
  console.log(`\n📋 创建表: ${tableDefinition.name}...`);

  try {
    const response = await axios.post(
      `${CONFIG.DOMAIN}/open-apis/bitable/v1/apps/${CONFIG.APP_TOKEN}/tables`,
      {
        table: tableDefinition
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.code === 0) {
      const table = response.data.data;
      console.log(`✅ 创建成功!`);
      console.log(`   Table ID: ${table.table_id}`);
      console.log(`   字段数: ${tableDefinition.fields.length}`);
      return { success: true, table };
    } else {
      console.log(`❌ 失败: ${response.data.msg} (code: ${response.data.code})`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log(`❌ 请求异常:`, error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// 表定义
const TABLES = [
  {
    name: '用户表',
    default_view_name: '所有用户',
    fields: [
      {
        field_name: 'username',
        type: 1, // 文本
        ui_type: 'Text'
      },
      {
        field_name: 'password',
        type: 1, // 文本
        ui_type: 'Text'
      },
      {
        field_name: 'name',
        type: 1, // 文本
        ui_type: 'Text'
      },
      {
        field_name: 'status',
        type: 3, // 单选
        ui_type: 'SingleSelect',
        property: {
          options: [
            { name: '正常' },
            { name: '禁用' }
          ]
        }
      }
    ]
  },
  {
    name: '商家公告表',
    default_view_name: '所有公告',
    fields: [
      {
        field_name: 'title',
        type: 1, // 文本
        ui_type: 'Text'
      },
      {
        field_name: 'content',
        type: 1, // 文本
        ui_type: 'Text'
      },
      {
        field_name: 'status',
        type: 3, // 单选
        ui_type: 'SingleSelect',
        property: {
          options: [
            { name: '启用' },
            { name: '禁用' }
          ]
        }
      },
      {
        field_name: 'sort',
        type: 2, // 数字
        ui_type: 'Number'
      }
    ]
  },
  {
    name: '菜品分类表',
    default_view_name: '所有分类',
    fields: [
      {
        field_name: 'name',
        type: 1, // 文本
        ui_type: 'Text'
      },
      {
        field_name: 'sort',
        type: 2, // 数字
        ui_type: 'Number'
      },
      {
        field_name: 'status',
        type: 3, // 单选
        ui_type: 'SingleSelect',
        property: {
          options: [
            { name: '启用' },
            { name: '禁用' }
          ]
        }
      }
    ]
  },
  {
    name: '菜品表',
    default_view_name: '所有菜品',
    fields: [
      {
        field_name: 'name',
        type: 1, // 文本
        ui_type: 'Text'
      },
      {
        field_name: 'price',
        type: 2, // 数字
        ui_type: 'Number',
        property: {
          formatter: '0.00'
        }
      },
      {
        field_name: 'category',
        type: 1, // 文本(分类名)
        ui_type: 'Text'
      },
      {
        field_name: 'image',
        type: 1, // 文本(图片URL)
        ui_type: 'Text'
      },
      {
        field_name: 'description',
        type: 1, // 文本
        ui_type: 'Text'
      },
      {
        field_name: 'status',
        type: 3, // 单选
        ui_type: 'SingleSelect',
        property: {
          options: [
            { name: '上架' },
            { name: '下架' }
          ]
        }
      },
      {
        field_name: 'sort',
        type: 2, // 数字
        ui_type: 'Number'
      }
    ]
  },
  {
    name: '订单表',
    default_view_name: '所有订单',
    fields: [
      {
        field_name: 'order_no',
        type: 1, // 文本
        ui_type: 'Text'
      },
      {
        field_name: 'username',
        type: 1, // 文本
        ui_type: 'Text'
      },
      {
        field_name: 'total_amount',
        type: 2, // 数字
        ui_type: 'Number',
        property: {
          formatter: '0.00'
        }
      },
      {
        field_name: 'items',
        type: 1, // 文本(JSON字符串)
        ui_type: 'Text'
      },
      {
        field_name: 'status',
        type: 3, // 单选
        ui_type: 'SingleSelect',
        property: {
          options: [
            { name: '待支付' },
            { name: '已支付' },
            { name: '已完成' },
            { name: '已取消' }
          ]
        }
      },
      {
        field_name: 'remark',
        type: 1, // 文本
        ui_type: 'Text'
      },
      {
        field_name: 'create_time',
        type: 5, // 日期
        ui_type: 'DateTime',
        property: {
          date_formatter: 'yyyy/MM/dd HH:mm'
        }
      }
    ]
  }
];

async function main() {
  console.log('========================================');
  console.log('   创建所需的5个表');
  console.log('========================================');

  console.log('\n📝 配置信息:');
  console.log(`   App Token: ${CONFIG.APP_TOKEN}`);
  console.log(`   将创建 ${TABLES.length} 个表\n`);

  try {
    await getTenantAccessToken();

    const results = [];

    for (const tableDef of TABLES) {
      const result = await createTable(tableDef);
      results.push({
        name: tableDef.name,
        ...result
      });
    }

    // 总结
    console.log('\n========================================');
    console.log('   创建结果总结');
    console.log('========================================\n');

    const successTables = results.filter(r => r.success);
    const failedTables = results.filter(r => !r.success);

    console.log(`✅ 成功创建: ${successTables.length} 个表`);
    if (successTables.length > 0) {
      console.log('\n成功的表:');
      successTables.forEach(t => {
        console.log(`   ✅ ${t.name}`);
        console.log(`      Table ID: ${t.table?.table_id || 'N/A'}`);
      });
    }

    if (failedTables.length > 0) {
      console.log(`\n❌ 失败: ${failedTables.length} 个表`);
      failedTables.forEach(t => {
        console.log(`   ❌ ${t.name}`);
        console.log(`      原因: ${t.error?.msg || JSON.stringify(t.error)}`);
      });
    }

    if (successTables.length === TABLES.length) {
      console.log('\n🎉 所有表创建成功!');
      console.log('\n下一步:');
      console.log('1. 更新 .env 文件中的 Table ID');
      console.log('2. 运行初始化数据脚本');
      console.log('3. 测试应用功能\n');
    }

  } catch (error) {
    console.error('❌ 执行失败:', error.message);
  }
}

main();
