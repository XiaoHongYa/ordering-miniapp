import axios from 'axios'
import { showToast } from 'vant'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('响应错误:', error)

    let message = '网络请求失败'

    if (error.response) {
      message = error.response.data?.msg || error.response.data?.message || message
    } else if (error.request) {
      message = '服务器无响应'
    }

    showToast({
      message,
      position: 'top'
    })

    return Promise.reject(error)
  }
)

export default request
