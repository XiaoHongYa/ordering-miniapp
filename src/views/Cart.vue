<template>
  <div class="cart-container">
    <!-- 顶部导航栏 -->
    <van-nav-bar
      title="购物车"
      left-arrow
      @click-left="goBack"
    />

    <!-- 购物车内容 -->
    <div class="cart-content">
      <div v-if="cartStore.items.length === 0" class="empty-cart">
        <van-empty description="购物车是空的">
          <van-button round type="primary" @click="goToMenu">
            去点餐
          </van-button>
        </van-empty>
      </div>

      <div v-else class="cart-list">
        <div
          v-for="item in cartStore.items"
          :key="item.id"
          class="cart-item"
        >
          <div class="item-image">
            <img
              :src="getItemImageUrl(item)"
              :alt="item.name"
              @error="handleImageError"
            />
            <div class="placeholder-image">
              <van-icon name="photo-o" size="32" color="#ccc" />
            </div>
          </div>

          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-footer">
              <div class="item-price">¥{{ item.price.toFixed(2) }}</div>
              <div class="item-controls">
                <van-stepper
                  v-model="item.quantity"
                  min="0"
                  @change="handleQuantityChange(item)"
                />
                <div class="item-total">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部结算栏 -->
    <div class="checkout-bar" v-if="cartStore.items.length > 0">
      <div class="total-info">
        <div class="total-label">总计:</div>
        <div class="total-amount">¥{{ cartStore.totalAmount.toFixed(2) }}</div>
      </div>

      <van-button
        type="primary"
        round
        size="large"
        :loading="submitting"
        @click="handleCheckout"
      >
        立即下单
      </van-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { createOrder, createOrderDetails } from '@/api/feishu'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const submitting = ref(false)
// 记录图片加载失败的商品
const failedImages = ref(new Set())

// 获取商品图片 URL（支持所有格式，包括 HEIC）
const getItemImageUrl = (item) => {
  // 优先使用 image_url，如果没有则使用 image_url_v2
  // image_url_v2 通过后端代理获取，支持 HEIC 等需要认证的附件格式
  return item.image_url || item.image_url_v2 || ''
}

// 处理图片加载错误（浏览器不支持的格式会显示占位符）
const handleImageError = (event) => {
  // 图片加载失败（如 Chrome/Firefox 不支持 HEIC），隐藏图片，显示占位符
  event.target.style.display = 'none'
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 去菜单页
const goToMenu = () => {
  router.push('/menu')
}

// 数量变化
const handleQuantityChange = (item) => {
  if (item.quantity === 0) {
    cartStore.removeItem(item.id)
  }
}

// 生成订单号
const generateOrderNo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const timestamp = String(now.getTime()).slice(-6)
  return `${year}${month}${day}${timestamp}`
}

// 结算下单
const handleCheckout = async () => {
  try {
    await showConfirmDialog({
      title: '确认下单',
      message: `共${cartStore.totalCount}件商品，合计¥${cartStore.totalAmount.toFixed(2)}`,
    })

    submitting.value = true

    // 准备订单数据
    const orderData = {
      order_no: generateOrderNo(),
      username: userStore.userInfo?.username || 'guest',
      total_amount: cartStore.totalAmount,
      total_quantity: cartStore.totalCount,
      dishes_detail: cartStore.items.map(item => ({
        菜品名称: item.name,
        单价: item.price,
        数量: item.quantity,
        小计: item.price * item.quantity
      }))
    }

    // 提交订单
    const result = await createOrder(orderData)

    if (result.success) {
      // 创建订单详情记录(异步执行,不阻塞主流程)
      createOrderDetails(orderData.order_no, orderData.dishes_detail).catch(error => {
        console.error('订单详情写入失败:', error)
        // 订单详情写入失败不影响主流程,仅记录日志
      })

      // 立即跳转到订单成功页，避免先显示空购物车
      await router.push({
        name: 'OrderSuccess',
        query: {
          orderNo: orderData.order_no,
          amount: orderData.total_amount
        }
      })

      // 跳转成功后再清空购物车
      cartStore.clearCart()

      showToast({
        message: '下单成功',
        position: 'top'
      })
    } else {
      showToast({
        message: result.message || '下单失败',
        position: 'top'
      })
    }
  } catch (error) {
    if (error !== 'cancel') {
      showToast({
        message: '下单失败,请稍后重试',
        position: 'top'
      })
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.cart-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.cart-content {
  flex: 1;
  overflow-y: auto;
}

.empty-cart {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-list {
  padding: 10px;
}

.cart-item {
  display: flex;
  gap: 12px;
  padding: 15px;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.item-image {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f5f5f5;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 2;
}

/* 图片加载失败时隐藏，显示占位符 */
.item-image img[style*="display: none"] {
  z-index: 0;
}

.placeholder-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-name {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  /* 允许换行显示完整名称 */
  word-wrap: break-word;
  word-break: break-all;
  line-height: 1.4;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.item-price {
  font-size: 14px;
  color: #ff6b6b;
  flex-shrink: 0;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.item-total {
  font-size: 16px;
  font-weight: bold;
  color: #ff6b6b;
  min-width: 60px;
  text-align: right;
}

.checkout-bar {
  padding: 15px 20px;
  background-color: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.total-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label {
  font-size: 14px;
  color: #666;
}

.total-amount {
  font-size: 24px;
  font-weight: bold;
  color: #ff6b6b;
}
</style>
