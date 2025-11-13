import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  // 购物车商品列表
  const items = ref([])

  // 购物车总数量
  const totalCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  // 购物车总金额
  const totalAmount = computed(() => {
    return items.value.reduce((total, item) => total + item.price * item.quantity, 0)
  })

  // 添加商品到购物车
  function addItem(dish) {
    const existingItem = items.value.find(item => item.id === dish.id)

    if (existingItem) {
      existingItem.quantity++
    } else {
      items.value.push({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        image_url: dish.image_url,
        image_url_v2: dish.image_url_v2, // 添加备用图片字段
        quantity: 1
      })
    }
  }

  // 减少商品数量
  function decreaseItem(dishId) {
    const item = items.value.find(item => item.id === dishId)

    if (item) {
      item.quantity--

      if (item.quantity <= 0) {
        removeItem(dishId)
      }
    }
  }

  // 增加商品数量
  function increaseItem(dishId) {
    const item = items.value.find(item => item.id === dishId)

    if (item) {
      item.quantity++
    }
  }

  // 移除商品
  function removeItem(dishId) {
    const index = items.value.findIndex(item => item.id === dishId)

    if (index > -1) {
      items.value.splice(index, 1)
    }
  }

  // 清空购物车
  function clearCart() {
    items.value = []
  }

  // 获取商品数量
  function getItemQuantity(dishId) {
    const item = items.value.find(item => item.id === dishId)
    return item ? item.quantity : 0
  }

  return {
    items,
    totalCount,
    totalAmount,
    addItem,
    decreaseItem,
    increaseItem,
    removeItem,
    clearCart,
    getItemQuantity
  }
})
