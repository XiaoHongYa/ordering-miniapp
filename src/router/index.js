import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/menu',
    name: 'Menu',
    component: () => import('@/views/Menu.vue'),
    meta: { title: '菜单', requiresAuth: true }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('@/views/Cart.vue'),
    meta: { title: '购物车', requiresAuth: true }
  },
  {
    path: '/order-success',
    name: 'OrderSuccess',
    component: () => import('@/views/OrderSuccess.vue'),
    meta: { title: '下单成功', requiresAuth: true }
  },
  {
    path: '/order-history',
    name: 'OrderHistory',
    component: () => import('@/views/OrderHistory.vue'),
    meta: { title: '历史订单', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title || '点餐小程序'

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const userInfo = localStorage.getItem('userInfo')
    if (!userInfo) {
      next('/login')
      return
    }
  }

  next()
})

export default router
