import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 用户信息
  const userInfo = ref(null)

  // 从localStorage恢复用户信息
  function loadUserInfo() {
    const stored = localStorage.getItem('userInfo')
    if (stored) {
      userInfo.value = JSON.parse(stored)
    }
  }

  // 设置用户信息
  function setUserInfo(info) {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  // 清除用户信息
  function clearUserInfo() {
    userInfo.value = null
    localStorage.removeItem('userInfo')
  }

  // 检查是否已登录
  function isLoggedIn() {
    return !!userInfo.value
  }

  // 初始化时加载用户信息
  loadUserInfo()

  return {
    userInfo,
    setUserInfo,
    clearUserInfo,
    isLoggedIn,
    loadUserInfo
  }
})
