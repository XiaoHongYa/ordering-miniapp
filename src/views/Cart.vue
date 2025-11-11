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
            <img :src="item.image_url || '/default-dish.png'" :alt="item.name" />
          </div>

          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-price">¥{{ item.price.toFixed(2) }}</div>
          </div>

          <div class="item-actions">
            <van-stepper
              v-model="item.quantity"
              min="0"
              @change="handleQuantityChange(item)"
            />
          </div>

          <div class="item-total">
            ¥{{ (item.price * item.quantity).toFixed(2) }}
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
import { createOrder } from '@/api/feishu'
import { showToast, showConfirmDialog } from 'vant'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const submitting = ref(false)

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
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }))
    }

    // 提交订单
    const result = await createOrder(orderData)

    if (result.success) {
      showToast({
        message: '下单成功',
        position: 'top'
      })

      // 清空购物车
      cartStore.clearCart()

      // 跳转到订单成功页
      setTimeout(() => {
        router.push({
          name: 'OrderSuccess',
          query: {
            orderNo: orderData.order_no,
            amount: orderData.total_amount
          }
        })
      }, 500)
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
  align-items: center;
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
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  font-size: 14px;
  color: #ff6b6b;
}

.item-actions {
  flex-shrink: 0;
}

.item-total {
  width: 80px;
  text-align: right;
  font-size: 16px;
  font-weight: bold;
  color: #ff6b6b;
  flex-shrink: 0;
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
