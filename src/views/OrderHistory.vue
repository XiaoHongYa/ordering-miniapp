<template>
  <div class="order-history-container">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="历史订单"
      left-arrow
      @click-left="goBack"
    />

    <!-- 订单列表 -->
    <div class="order-list">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div v-if="loading" class="loading-wrapper">
          <van-loading type="spinner" size="24px">加载中...</van-loading>
        </div>

        <div v-else-if="orders.length === 0" class="empty-wrapper">
          <van-empty description="暂无订单记录" />
        </div>

        <div v-else class="orders-wrapper">
          <div
            v-for="order in orders"
            :key="order.id"
            class="order-card"
          >
            <!-- 订单头部 -->
            <div class="order-header">
              <div class="order-no">订单号: {{ order.order_no }}</div>
              <div class="order-status" :class="getStatusClass(order.status)">
                {{ order.status }}
              </div>
            </div>

            <!-- 订单商品列表 -->
            <div class="order-items">
              <div
                v-for="(item, index) in parseOrderItems(order.dishes_detail)"
                :key="index"
                class="order-item"
              >
                <div class="item-info">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-price">¥{{ item.price.toFixed(2) }}</span>
                </div>
                <div class="item-quantity">x{{ item.quantity }}</div>
              </div>
            </div>

            <!-- 订单底部 -->
            <div class="order-footer">
              <div class="order-time">{{ formatTime(order.create_time) }}</div>
              <div class="order-total">
                <span class="label">合计:</span>
                <span class="amount">¥{{ order.total_amount.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getOrderHistory } from '@/api/feishu'
import { showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const orders = ref([])
const loading = ref(false)
const refreshing = ref(false)

// 返回上一页
const goBack = () => {
  router.back()
}

// 解析订单商品详情
const parseOrderItems = (dishesDetail) => {
  try {
    let items = []
    if (typeof dishesDetail === 'string') {
      items = JSON.parse(dishesDetail)
    } else {
      items = dishesDetail || []
    }

    // 统一字段格式，兼容中文和英文字段名
    return items.map(item => ({
      name: item.菜品名称 || item.name || '',
      price: item.单价 || item.price || 0,
      quantity: item.数量 || item.quantity || 0,
      subtotal: item.小计 || item.subtotal || 0
    }))
  } catch (error) {
    console.error('解析订单商品失败:', error)
    return []
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 获取订单状态样式
const getStatusClass = (status) => {
  const statusMap = {
    '待处理': 'status-pending',
    '处理中': 'status-processing',
    '已完成': 'status-completed',
    '已取消': 'status-cancelled'
  }
  return statusMap[status] || ''
}

// 加载订单数据
const loadOrders = async () => {
  loading.value = true

  try {
    if (!userStore.userInfo || !userStore.userInfo.username) {
      showToast({
        message: '请先登录',
        position: 'top'
      })
      router.push('/login')
      return
    }

    const data = await getOrderHistory(userStore.userInfo.username)
    orders.value = data
  } catch (error) {
    showToast({
      message: '加载订单失败',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  await loadOrders()
  refreshing.value = false
  showToast({
    message: '刷新成功',
    position: 'top'
  })
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-history-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.order-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.loading-wrapper,
.empty-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.orders-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 16px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.order-no {
  font-size: 14px;
  color: #666;
}

.order-status {
  font-size: 13px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 12px;
}

.status-pending {
  color: #ff9800;
  background-color: #fff3e0;
}

.status-processing {
  color: #2196f3;
  background-color: #e3f2fd;
}

.status-completed {
  color: #4caf50;
  background-color: #e8f5e9;
}

.status-cancelled {
  color: #999;
  background-color: #f5f5f5;
}

.order-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.item-name {
  font-size: 14px;
  color: #333;
}

.item-price {
  font-size: 13px;
  color: #999;
}

.item-quantity {
  font-size: 13px;
  color: #666;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.order-time {
  font-size: 12px;
  color: #999;
}

.order-total {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.order-total .label {
  font-size: 12px;
  color: #999;
}

.order-total .amount {
  font-size: 16px;
  font-weight: bold;
  color: #ff6b6b;
}
</style>
