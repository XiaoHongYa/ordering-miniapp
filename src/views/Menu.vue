<template>
  <div class="menu-container">
    <!-- 顶部导航栏 -->
    <van-nav-bar title="点餐菜单" fixed>
      <template #right>
        <van-icon name="orders-o" size="18" @click="goToOrderHistory" />
      </template>
    </van-nav-bar>

    <!-- 顶部公告栏 -->
    <div class="announcement-bar" v-if="announcements.length > 0">
      <van-notice-bar
        :text="announcements[0].content"
        left-icon="volume-o"
        :scrollable="true"
      />
    </div>

    <!-- 主体内容区 -->
    <div class="menu-content">
      <!-- 左侧分类导航 -->
      <div class="category-sidebar">
        <van-sidebar v-model="activeCategory" @change="handleCategoryChange">
          <van-sidebar-item
            v-for="category in categories"
            :key="category.id"
            :title="category.name"
          />
        </van-sidebar>
      </div>

      <!-- 右侧菜品列表 -->
      <div class="dishes-list">
        <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
          <div v-if="loading" class="loading-wrapper">
            <van-loading type="spinner" size="24px">加载中...</van-loading>
          </div>

          <div v-else-if="currentDishes.length === 0" class="empty-wrapper">
            <van-empty description="暂无菜品" />
          </div>

          <div v-else class="dishes-grid">
            <div
              v-for="dish in currentDishes"
              :key="dish.id"
              class="dish-card"
            >
              <div class="dish-image">
                <img :src="dish.image_url || '/default-dish.png'" :alt="dish.name" />
              </div>
              <div class="dish-info">
                <div class="dish-name">{{ dish.name }}</div>
                <div class="dish-desc">{{ dish.description }}</div>
                <div class="dish-footer">
                  <div class="dish-price">¥{{ dish.price.toFixed(2) }}</div>
                  <div class="dish-actions">
                    <van-button
                      v-if="cartStore.getItemQuantity(dish.id) > 0"
                      icon="minus"
                      size="mini"
                      round
                      type="primary"
                      @click="handleDecrease(dish)"
                    />
                    <span v-if="cartStore.getItemQuantity(dish.id) > 0" class="quantity">
                      {{ cartStore.getItemQuantity(dish.id) }}
                    </span>
                    <van-button
                      icon="plus"
                      size="mini"
                      round
                      type="primary"
                      @click="handleAdd(dish)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </van-pull-refresh>
      </div>
    </div>

    <!-- 底部购物车栏 -->
    <div class="cart-bar" @click="goToCart">
      <div class="cart-info">
        <van-badge :content="cartStore.totalCount" max="99">
          <van-icon name="shopping-cart-o" size="24" />
        </van-badge>
        <div class="cart-amount">
          <span class="label">合计:</span>
          <span class="amount">¥{{ cartStore.totalAmount.toFixed(2) }}</span>
        </div>
      </div>
      <div class="cart-button">
        <van-button
          type="primary"
          round
          :disabled="cartStore.totalCount === 0"
        >
          去结算
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { getAnnouncements, getCategories, getDishes } from '@/api/feishu'
import { showToast } from 'vant'

const router = useRouter()
const cartStore = useCartStore()

const announcements = ref([])
const categories = ref([])
const allDishes = ref([])
const activeCategory = ref(0)
const loading = ref(false)
const refreshing = ref(false)

// 当前分类的菜品
const currentDishes = computed(() => {
  if (activeCategory.value === 0 || categories.value.length === 0) {
    return allDishes.value
  }

  // category_id 字段实际存储的是分类名称
  const categoryName = categories.value[activeCategory.value]?.name
  return allDishes.value.filter(dish => dish.category_id === categoryName)
})

// 加载数据
const loadData = async () => {
  loading.value = true

  try {
    // 并行加载公告、分类和菜品
    const [announcementsData, categoriesData, dishesData] = await Promise.all([
      getAnnouncements(),
      getCategories(),
      getDishes()
    ])

    announcements.value = announcementsData
    categories.value = categoriesData
    allDishes.value = dishesData
  } catch (error) {
    showToast({
      message: '加载数据失败',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}

// 下拉刷新
const onRefresh = async () => {
  await loadData()
  refreshing.value = false
  showToast({
    message: '刷新成功',
    position: 'top'
  })
}

// 切换分类
const handleCategoryChange = (index) => {
  activeCategory.value = index
}

// 添加商品
const handleAdd = (dish) => {
  cartStore.addItem(dish)
  showToast({
    message: '已添加',
    position: 'top',
    duration: 500
  })
}

// 减少商品
const handleDecrease = (dish) => {
  cartStore.decreaseItem(dish.id)
}

// 去购物车
const goToCart = () => {
  if (cartStore.totalCount > 0) {
    router.push('/cart')
  }
}

// 去历史订单
const goToOrderHistory = () => {
  router.push('/order-history')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.menu-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  padding-top: 46px;
}

.announcement-bar {
  flex-shrink: 0;
}

:deep(.van-nav-bar__right) {
  cursor: pointer;
}

.menu-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.category-sidebar {
  width: 100px;
  flex-shrink: 0;
  background-color: #fff;
  overflow-y: auto;
}

.dishes-list {
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

.dishes-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dish-card {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: row;
  padding: 12px;
  gap: 12px;
}

.dish-image {
  width: 120px;
  height: 120px;
  overflow: hidden;
  background-color: #f5f5f5;
  flex-shrink: 0;
  border-radius: 8px;
}

.dish-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-between;
}

.dish-name {
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.dish-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  line-height: 1.4;
}

.dish-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.dish-price {
  font-size: 16px;
  font-weight: bold;
  color: #ff6b6b;
  flex-shrink: 0;
}

.dish-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.dish-actions :deep(.van-button--mini) {
  width: 24px;
  height: 24px;
  padding: 0;
  min-width: 24px;
}

.quantity {
  font-size: 13px;
  font-weight: bold;
  color: #333;
  min-width: 20px;
  text-align: center;
}

.cart-bar {
  height: 60px;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
  cursor: pointer;
}

.cart-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.cart-amount {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.cart-amount .label {
  font-size: 12px;
  color: #999;
}

.cart-amount .amount {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b6b;
}

.cart-button {
  min-width: 100px;
}

@media screen and (max-width: 600px) {
  .dish-image {
    width: 100px;
    height: 100px;
  }
}
</style>
