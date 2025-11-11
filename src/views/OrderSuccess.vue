<template>
  <div class="order-success-container">
    <div class="success-content">
      <div class="success-icon">
        <van-icon name="checked" size="80" color="#07c160" />
      </div>

      <div class="success-title">下单成功!</div>

      <div class="order-info">
        <div class="info-item">
          <span class="label">订单号:</span>
          <span class="value">#{{ orderNo }}</span>
        </div>

        <div class="info-item">
          <span class="label">总金额:</span>
          <span class="value amount">¥{{ amount }}</span>
        </div>
      </div>

      <div class="actions">
        <van-button
          type="primary"
          round
          block
          @click="goToMenu"
        >
          返回首页
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const orderNo = ref('')
const amount = ref('0.00')

onMounted(() => {
  orderNo.value = route.query.orderNo || ''
  amount.value = route.query.amount || '0.00'
})

const goToMenu = () => {
  router.push('/menu')
}
</script>

<style scoped>
.order-success-container {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 20px;
}

.success-content {
  width: 100%;
  max-width: 400px;
  background-color: #fff;
  border-radius: 16px;
  padding: 50px 30px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.success-icon {
  margin-bottom: 20px;
}

.success-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 30px;
}

.order-info {
  background-color: #f7f8fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.info-item + .info-item {
  border-top: 1px solid #ebedf0;
}

.info-item .label {
  font-size: 14px;
  color: #666;
}

.info-item .value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.info-item .value.amount {
  font-size: 20px;
  color: #ff6b6b;
}

.actions {
  width: 100%;
}
</style>
