<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo-section">
        <h1>点餐小程序</h1>
        <p>欢迎登录</p>
      </div>

      <van-form @submit="handleLogin">
        <van-cell-group inset>
          <van-field
            v-model="formData.username"
            name="username"
            label="用户名"
            placeholder="请输入用户名"
            :rules="[{ required: true, message: '请输入用户名' }]"
          />
          <van-field
            v-model="formData.password"
            type="password"
            name="password"
            label="密码"
            placeholder="请输入密码"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>

        <div class="button-wrapper">
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
            loading-text="登录中..."
          >
            登录
          </van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { loginUser } from '@/api/feishu'
import { showToast } from 'vant'

const router = useRouter()
const userStore = useUserStore()

const formData = ref({
  username: '',
  password: ''
})

const loading = ref(false)

const handleLogin = async () => {
  loading.value = true

  try {
    const result = await loginUser(formData.value.username, formData.value.password)

    if (result.success) {
      // 保存用户信息
      userStore.setUserInfo(result.data)

      showToast({
        message: '登录成功',
        position: 'top'
      })

      // 跳转到菜单页面
      setTimeout(() => {
        router.push('/menu')
      }, 500)
    } else {
      showToast({
        message: result.message || '登录失败',
        position: 'top'
      })
    }
  } catch (error) {
    showToast({
      message: '登录失败,请稍后重试',
      position: 'top'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  padding: 40px 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-section h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
  font-weight: bold;
}

.logo-section p {
  font-size: 14px;
  color: #999;
}

.button-wrapper {
  margin-top: 30px;
  padding: 0 16px;
}

:deep(.van-cell-group) {
  margin-bottom: 0;
}

:deep(.van-field__label) {
  width: 80px;
}
</style>
