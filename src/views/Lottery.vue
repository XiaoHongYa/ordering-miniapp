<template>
  <div class="lottery-container">
    <!-- 顶部导航 -->
    <div class="lottery-header">
      <van-icon name="arrow-left" size="20" @click="goBack" />
      <span class="header-title">幸运抽奖</span>
      <div style="width: 20px"></div>
    </div>

    <!-- 抽奖转盘 -->
    <div class="lottery-content">
      <div class="wheel-container">
        <svg class="wheel" :style="{ transform: `rotate(${rotation}deg)` }" viewBox="0 0 400 400">
          <!-- 绘制扇形 -->
          <g v-for="(prize, index) in prizes" :key="index">
            <path
              :d="getArcPath(index)"
              :fill="getColor(index)"
              stroke="#fff"
              stroke-width="2"
            />
            <!-- 奖品名称 -->
            <text
              :x="getTextX(index)"
              :y="getTextY(index)"
              :transform="`rotate(${getTextRotation(index)} ${getTextX(index)} ${getTextY(index)})`"
              text-anchor="middle"
              fill="#333"
              :font-size="getPrizeTextSize()"
              font-weight="500"
            >
              {{ prize.name }}
            </text>
          </g>
        </svg>

        <!-- 奖品图标/图片叠加层 -->
        <div class="prize-icons-layer" :style="{ transform: `rotate(${rotation}deg)` }">
          <div
            v-for="(prize, index) in prizes"
            :key="`icon-${index}`"
            class="prize-icon-item"
            :style="getPrizeIconStyle(index)"
          >
            <!-- 优先显示 icon（emoji 或 URL） -->
            <template v-if="prize.icon">
              <!-- 如果是 URL（以 http 开头） -->
              <img
                v-if="isUrl(prize.icon)"
                :src="prize.icon"
                class="prize-img"
                :style="{ width: getPrizeImageSize() + 'px', height: getPrizeImageSize() + 'px' }"
                alt="prize"
              />
              <!-- 否则当作 emoji -->
              <span
                v-else
                class="prize-emoji"
                :style="{ fontSize: getPrizeEmojiSize() + 'px' }"
              >{{ prize.icon }}</span>
            </template>
            <!-- 如果没有 icon，显示 img（附件） -->
            <img
              v-else-if="prize.img"
              :src="prize.img"
              class="prize-img"
              :style="{ width: getPrizeImageSize() + 'px', height: getPrizeImageSize() + 'px' }"
              alt="prize"
            />
          </div>
        </div>

        <!-- 中心按钮 -->
        <div class="center-button" @click="startDraw" :class="{ spinning: isSpinning }">
          <div class="button-text">{{ isSpinning ? '抽奖中...' : '开始抽奖' }}</div>
        </div>

        <!-- 指针 -->
        <div class="pointer"></div>
      </div>

      <!-- 我的奖品按钮 -->
      <van-button
        type="primary"
        size="large"
        round
        class="my-prizes-btn"
        @click="showMyPrizes"
      >
        我的奖品
      </van-button>
    </div>

    <!-- 中奖弹窗 -->
    <van-dialog
      v-model:show="showPrizeDialog"
      title="恭喜中奖"
      :show-cancel-button="false"
      confirm-button-text="确定"
    >
      <div class="prize-result">
        <div class="prize-icon">
          <!-- 优先显示 icon（emoji 或 URL） -->
          <template v-if="currentPrize?.icon">
            <!-- 如果是 URL -->
            <img
              v-if="isUrl(currentPrize.icon)"
              :src="currentPrize.icon"
              class="prize-result-img"
              alt="prize"
            />
            <!-- 否则当作 emoji -->
            <span v-else>{{ currentPrize.icon }}</span>
          </template>
          <!-- 如果没有 icon，显示 img（附件） -->
          <img
            v-else-if="currentPrize?.img"
            :src="currentPrize.img"
            class="prize-result-img"
            alt="prize"
          />
        </div>
        <div class="prize-name">{{ currentPrize?.name }}</div>
        <div class="prize-message">{{ prizeMessage }}</div>
      </div>
    </van-dialog>

    <!-- 我的奖品列表弹窗 -->
    <van-popup
      v-model:show="showRecordPopup"
      position="bottom"
      :style="{ height: '70%' }"
      round
    >
      <div class="record-popup">
        <div class="popup-header">
          <span class="popup-title">我的奖品</span>
          <van-icon name="cross" @click="showRecordPopup = false" />
        </div>
        <div class="record-list">
          <div v-if="records.length === 0" class="empty-record">
            <van-empty description="暂无抽奖记录" />
          </div>
          <div v-else>
            <div v-for="record in records" :key="record.id" class="record-item">
              <div class="record-icon">
                <!-- 优先显示 prizeIcon（emoji 或 URL） -->
                <template v-if="record.prizeIcon">
                  <!-- 如果是 URL -->
                  <img
                    v-if="isUrl(record.prizeIcon)"
                    :src="record.prizeIcon"
                    class="record-icon-img"
                    alt="prize"
                  />
                  <!-- 否则当作 emoji -->
                  <span v-else class="record-icon-emoji">{{ record.prizeIcon }}</span>
                </template>
                <!-- 如果没有 prizeIcon，显示 prizeImg（附件） -->
                <img
                  v-else-if="record.prizeImg"
                  :src="record.prizeImg"
                  class="record-icon-img"
                  alt="prize"
                />
              </div>
              <div class="record-info">
                <div class="record-name">{{ record.prizeName }}</div>
                <div class="record-time">{{ formatTime(record.lotteryTime) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { showToast, showDialog } from 'vant'
import { getPrizes, drawLottery, getLotteryRecords } from '@/api/feishu'

const router = useRouter()
const userStore = useUserStore()

const prizes = ref([])
const isSpinning = ref(false)
const rotation = ref(0)
const showPrizeDialog = ref(false)
const currentPrize = ref(null)
const prizeMessage = ref('')
const showRecordPopup = ref(false)
const records = ref([])

// 颜色列表
const colors = ['#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#FECA57', '#DFE4EA']

// 获取奖品列表
const loadPrizes = async () => {
  const data = await getPrizes()
  prizes.value = data
}

// 获取扇形路径
const getArcPath = (index) => {
  const total = prizes.value.length
  const anglePerPrize = 360 / total
  const startAngle = index * anglePerPrize - 90
  const endAngle = startAngle + anglePerPrize

  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180

  const x1 = 200 + 180 * Math.cos(startRad)
  const y1 = 200 + 180 * Math.sin(startRad)
  const x2 = 200 + 180 * Math.cos(endRad)
  const y2 = 200 + 180 * Math.sin(endRad)

  const largeArc = anglePerPrize > 180 ? 1 : 0

  return `M 200 200 L ${x1} ${y1} A 180 180 0 ${largeArc} 1 ${x2} ${y2} Z`
}

// 获取颜色
const getColor = (index) => {
  return colors[index % colors.length]
}

// 获取文字X坐标
const getTextX = (index) => {
  const total = prizes.value.length
  const anglePerPrize = 360 / total
  const angle = index * anglePerPrize + anglePerPrize / 2 - 90
  const rad = (angle * Math.PI) / 180
  return 200 + 140 * Math.cos(rad) // 增加半径，让文字更靠外
}

// 获取文字Y坐标
const getTextY = (index) => {
  const total = prizes.value.length
  const anglePerPrize = 360 / total
  const angle = index * anglePerPrize + anglePerPrize / 2 - 90
  const rad = (angle * Math.PI) / 180
  return 200 + 140 * Math.sin(rad) // 增加半径，让文字更靠外
}

// 获取文字旋转角度
const getTextRotation = (index) => {
  const total = prizes.value.length
  const anglePerPrize = 360 / total
  return index * anglePerPrize + anglePerPrize / 2
}

// 判断是否为 URL
const isUrl = (str) => {
  if (!str) return false
  return str.startsWith('http://') || str.startsWith('https://')
}

// 获取奖品图标的绝对定位样式
const getPrizeIconStyle = (index) => {
  const total = prizes.value.length
  const anglePerPrize = 360 / total
  const angle = index * anglePerPrize + anglePerPrize / 2 - 90
  const rad = (angle * Math.PI) / 180

  // 计算图标位置（转换为像素坐标，相对于 320px 容器）
  // 图标位置稍微靠外一些，在半径的 65% 位置
  const radius = 100 * (320 / 400) // 调整半径让图标更靠近中心
  const centerX = 160 // 容器中心 X
  const centerY = 160 // 容器中心 Y

  const x = centerX + radius * Math.cos(rad)
  const y = centerY + radius * Math.sin(rad)

  const rotation = index * anglePerPrize + anglePerPrize / 2

  return {
    left: `${x}px`,
    top: `${y}px`,
    transform: `translate(-50%, -50%) rotate(${rotation}deg)`
  }
}

// 根据奖品数量计算图片大小
const getPrizeImageSize = () => {
  const total = prizes.value.length
  // 奖品数量越多，图片越小
  if (total <= 6) return 48
  if (total <= 8) return 40
  if (total <= 10) return 36
  if (total <= 12) return 32
  return 28 // 12个以上
}

// 根据奖品数量计算emoji大小
const getPrizeEmojiSize = () => {
  const total = prizes.value.length
  if (total <= 6) return 36
  if (total <= 8) return 32
  if (total <= 10) return 28
  if (total <= 12) return 26
  return 24
}

// 根据奖品数量计算文字大小
const getPrizeTextSize = () => {
  const total = prizes.value.length
  if (total <= 6) return 13
  if (total <= 8) return 12
  if (total <= 10) return 11
  if (total <= 12) return 10
  return 9
}

// 开始抽奖
const startDraw = async () => {
  if (isSpinning.value) return

  if (!userStore.userInfo?.username) {
    showToast('请先登录')
    router.push('/login')
    return
  }

  if (prizes.value.length === 0) {
    showToast('暂无可用奖品')
    return
  }

  isSpinning.value = true

  // 执行抽奖
  const result = await drawLottery(userStore.userInfo.username)

  if (!result.success) {
    showToast(result.message)
    isSpinning.value = false
    return
  }

  // 计算中奖奖品的索引
  const prizeIndex = prizes.value.findIndex(p => p.id === result.prize.id)
  if (prizeIndex === -1) {
    showToast('抽奖异常')
    isSpinning.value = false
    return
  }

  // 计算旋转角度
  const total = prizes.value.length
  const anglePerPrize = 360 / total
  const targetAngle = prizeIndex * anglePerPrize + anglePerPrize / 2

  // 转3圈 + 目标角度
  const spinAngle = 360 * 3 + (360 - targetAngle)
  rotation.value += spinAngle

  // 动画结束后显示结果
  setTimeout(() => {
    isSpinning.value = false
    currentPrize.value = result.prize
    prizeMessage.value = result.message
    showPrizeDialog.value = true
  }, 3000)
}

// 显示我的奖品
const showMyPrizes = async () => {
  if (!userStore.userInfo?.username) {
    showToast('请先登录')
    router.push('/login')
    return
  }

  const data = await getLotteryRecords(userStore.userInfo.username)
  records.value = data
  showRecordPopup.value = true
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 返回
const goBack = () => {
  router.push('/menu')
}

onMounted(() => {
  loadPrizes()
})
</script>

<style scoped>
.lottery-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-bottom: 20px;
}

.lottery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: #fff;
}

.header-title {
  font-size: 18px;
  font-weight: bold;
}

.lottery-content {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.wheel-container {
  position: relative;
  width: 320px;
  height: 320px;
  margin-bottom: 40px;
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  transition: transform 3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.prize-icons-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  transition: transform 3s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.prize-icon-item {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
}

.prize-emoji {
  font-size: 36px;
  line-height: 1;
}

.prize-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.9);
  padding: 4px;
}

.center-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s;
}

.center-button:active {
  transform: translate(-50%, -50%) scale(0.95);
}

.center-button.spinning {
  pointer-events: none;
  opacity: 0.8;
}

.button-text {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
}

.pointer {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 15px solid transparent;
  border-right: 15px solid transparent;
  border-top: 25px solid #ff4757;
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.3));
}

.my-prizes-btn {
  width: 200px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid #fff;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.prize-result {
  padding: 30px 20px;
  text-align: center;
}

.prize-icon {
  font-size: 60px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prize-result-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.prize-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.prize-message {
  font-size: 16px;
  color: #666;
}

.record-popup {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.popup-title {
  font-size: 18px;
  font-weight: bold;
}

.record-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.empty-record {
  padding: 50px 0;
}

.record-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f7f8fa;
  border-radius: 12px;
  margin-bottom: 10px;
}

.record-icon {
  font-size: 40px;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 50px;
}

.record-icon-emoji {
  font-size: 40px;
}

.record-icon-img {
  width: 50px;
  height: 50px;
  object-fit: contain;
  border-radius: 4px;
}

.record-info {
  flex: 1;
}

.record-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.record-time {
  font-size: 14px;
  color: #999;
}
</style>
