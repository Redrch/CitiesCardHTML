<template>
  <div class="room-selection">
    <div class="room-container">
      <!-- 返回按钮 -->
      <button class="back-btn" @click="$emit('back')">
        <span class="back-icon">←</span>
        <span>返回主界面</span>
      </button>

      <!-- 标题 -->
      <div class="room-title">
        <h1 class="title-text">房间设置</h1>
        <p class="subtitle">Room Setup</p>
      </div>

      <!-- 使用说明 -->
      <div class="info-card">
        <div class="info-icon">💡</div>
        <div class="info-content">
          <div class="info-header">使用说明</div>
          <div class="info-text">创建房间后，分享房间号给其他玩家即可加入</div>
        </div>
      </div>

      <!-- 房间管理提示 -->
      <div class="tips-card">
        <div class="tips-header">
          <span class="tips-icon">📌</span>
          <span>房间管理提示</span>
        </div>
        <ul class="tips-list">
          <li>房间将在24小时无活动后自动清理</li>
          <li>支持断线重连，连接丢失时会自动尝试恢复</li>
          <li>创建房间后可以分享给其他玩家加入</li>
        </ul>
      </div>

      <!-- 游戏模式选择 -->
      <div class="mode-selector-card">
        <label class="mode-label">选择游戏模式</label>
        <div class="mode-buttons">
          <button
            class="mode-option-btn active"
            @click="selectedMode = '2P'"
          >
            <span class="mode-option-icon">👥</span>
            <span class="mode-option-name">2人对战 (1v1)</span>
          </button>
          <button
            class="mode-option-btn disabled"
            @click="showComingSoon"
          >
            <span class="mode-option-icon">👥👤</span>
            <span class="mode-option-name">3人混战</span>
            <span class="mode-option-tag">敬请期待</span>
          </button>
          <button
            class="mode-option-btn disabled"
            @click="showComingSoon"
          >
            <span class="mode-option-icon">👥⚔️👥</span>
            <span class="mode-option-name">2v2 团队战</span>
            <span class="mode-option-tag">敬请期待</span>
          </button>
        </div>
        <div class="mode-description">
          <span class="mode-desc-icon">ℹ️</span>
          <span>{{ getModeDescription() }}</span>
        </div>
      </div>

      <!-- 敬请期待提示 -->
      <Transition name="toast">
        <div v-if="showToast" class="toast-message">
          🚧 敬请期待，该模式正在开发中...
        </div>
      </Transition>

      <!-- 创建房间按钮 -->
      <button class="action-btn create-btn" @click="handleCreateRoom">
        <span class="btn-icon">➕</span>
        <span class="btn-text">创建房间</span>
      </button>

      <!-- 分隔线 -->
      <div class="divider">
        <span class="divider-text">或</span>
      </div>

      <!-- 加入房间区域 -->
      <div class="join-section">
        <label class="join-label">输入房间号加入</label>
        <input
          v-model="roomIdInput"
          type="text"
          class="room-input"
          placeholder="请输入9位房间号"
          maxlength="9"
          @keyup.enter="handleJoinRoom"
        />
        <button class="action-btn join-btn" @click="handleJoinRoom">
          <span class="btn-icon">🚪</span>
          <span class="btn-text">加入房间</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoom } from '../../composables/useRoom'
import { useNotification } from '../../composables/useNotification'

const emit = defineEmits(['room-created', 'room-joined', 'back'])

const { showNotification } = useNotification()
const { createRoom, joinRoom } = useRoom()

const roomIdInput = ref('')
const selectedMode = ref('2P')
const showToast = ref(false)
let toastTimer = null

function showComingSoon() {
  showToast.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, 2000)
}

/**
 * 获取模式描述
 */
function getModeDescription() {
  const descriptions = {
    '2P': '需要2名玩家，每人10座城市，选择1座中心城市',
    '3P': '需要3名玩家，每人10座城市（无中心城市）',
    '2v2': '需要4名玩家组成两队，2人一队，每人7座城市，选择1座中心城市'
  }
  return descriptions[selectedMode.value] || ''
}

/**
 * 创建房间
 */
async function handleCreateRoom() {
  const playerCountMap = {
    '2P': 2,
    '3P': 3,
    '2v2': 4
  }

  const result = await createRoom({
    mode: selectedMode.value,
    playerCount: playerCountMap[selectedMode.value],
    citiesPerPlayer: selectedMode.value === '2v2' ? 7 : 10
  })

  if (result.success) {
    showNotification(`房间创建成功！房间号：${result.roomId}`, 'success')
    emit('room-created', result.roomId)
  } else {
    showNotification('房间创建失败，请重试', 'error')
  }
}

/**
 * 加入房间
 */
async function handleJoinRoom() {
  if (!roomIdInput.value.trim()) {
    showNotification('请输入房间号！', 'warning')
    return
  }

  const result = await joinRoom(roomIdInput.value.trim())

  if (result.success) {
    showNotification('加入房间成功！', 'success')
    emit('room-joined', {
      roomId: roomIdInput.value.trim(),
      roomData: result.roomData,
      isRoomFull: result.isRoomFull
    })
  } else {
    showNotification(result.error || '加入房间失败', 'error')
  }
}
</script>

<style scoped>
.room-selection {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.room-selection::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  animation: rotate 30s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.room-container {
  position: relative;
  z-index: 1;
  max-width: 600px;
  width: 100%;
  animation: fadeIn 0.8s ease-out;
}

/* 返回按钮 */
.back-btn {
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(30, 41, 59, 0.8);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 12px 24px;
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.back-btn:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: rgba(148, 163, 184, 0.5);
  transform: translateX(-4px);
}

.back-icon {
  font-size: 20px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 标题 */
.room-title {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInDown 0.8s ease-out;
}

.title-text {
  font-size: 48px;
  font-weight: 900;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 0 40px rgba(59, 130, 246, 0.5);
  letter-spacing: 3px;
}

.subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 8px 0 0 0;
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 信息卡片 */
.info-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  backdrop-filter: blur(10px);
  animation: fadeInUp 0.8s ease-out 0.1s both;
}

.info-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.info-content {
  flex: 1;
}

.info-header {
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 8px;
}

.info-text {
  font-size: 14px;
  color: #cbd5e1;
  line-height: 1.6;
}

/* 提示卡片 */
.tips-card {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%);
  border: 2px solid rgba(16, 185, 129, 0.3);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 12px;
}

.tips-icon {
  font-size: 20px;
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tips-list li {
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.8;
  padding-left: 20px;
  position: relative;
}

.tips-list li::before {
  content: '•';
  position: absolute;
  left: 8px;
  color: #10b981;
  font-weight: bold;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 模式选择卡片 */
.mode-selector-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%);
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  animation: fadeInUp 0.8s ease-out 0.3s both;
}

.mode-selector-card:hover {
  border-color: rgba(59, 130, 246, 0.4);
}

.mode-label {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 12px;
}

.mode-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mode-option-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 18px;
  font-size: 15px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.8);
  color: #f1f5f9;
  border: 2px solid rgba(148, 163, 184, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  font-weight: 600;
  text-align: left;
}

.mode-option-btn.active {
  border-color: rgba(59, 130, 246, 0.6);
  background: rgba(59, 130, 246, 0.15);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.mode-option-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mode-option-btn.disabled:hover {
  opacity: 0.6;
}

.mode-option-icon {
  font-size: 18px;
}

.mode-option-name {
  flex: 1;
}

.mode-option-tag {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  background: rgba(100, 116, 139, 0.3);
  padding: 3px 10px;
  border-radius: 8px;
  letter-spacing: 0.5px;
}

/* Toast 提示 */
.toast-message {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
  border: 2px solid rgba(100, 116, 139, 0.5);
  border-radius: 16px;
  padding: 16px 32px;
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 600;
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  white-space: nowrap;
}

.toast-enter-active {
  animation: toastIn 0.3s ease-out;
}

.toast-leave-active {
  animation: toastOut 0.3s ease-in;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

@keyframes toastOut {
  from { opacity: 1; transform: translateX(-50%) translateY(0); }
  to { opacity: 0; transform: translateX(-50%) translateY(-20px); }
}

.mode-description {
  margin-top: 12px;
  padding: 12px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  border-left: 3px solid #3b82f6;
  font-size: 13px;
  color: #cbd5e1;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.6;
}

.mode-desc-icon {
  font-size: 16px;
  flex-shrink: 0;
}

/* 按钮 */
.action-btn {
  width: 100%;
  padding: 18px 24px;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.action-btn:hover::before {
  opacity: 1;
}

.create-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.create-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
}

.create-btn:active {
  transform: translateY(-2px);
}

.join-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

.join-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4);
}

.join-btn:active {
  transform: translateY(-2px);
}

.btn-icon {
  font-size: 22px;
}

.btn-text {
  font-size: 18px;
}

/* 分隔线 */
.divider {
  text-align: center;
  position: relative;
  margin: 32px 0;
  animation: fadeIn 0.8s ease-out 0.5s both;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 2px;
  background: linear-gradient(to right, transparent, rgba(148, 163, 184, 0.3), transparent);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider-text {
  color: #94a3b8;
  font-size: 14px;
  font-weight: 600;
  padding: 0 20px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  position: relative;
  z-index: 1;
}

/* 加入房间区域 */
.join-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  animation: fadeInUp 0.8s ease-out 0.6s both;
}

.join-label {
  font-size: 15px;
  font-weight: 700;
  color: #f1f5f9;
  text-align: center;
}

.room-input {
  width: 100%;
  padding: 18px;
  font-size: 28px;
  text-align: center;
  letter-spacing: 8px;
  font-family: 'Courier New', monospace;
  background: rgba(30, 41, 59, 0.8);
  color: #60a5fa;
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 700;
  backdrop-filter: blur(10px);
}

.room-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  background: rgba(30, 41, 59, 0.9);
}

.room-input::placeholder {
  color: #64748b;
  font-size: 14px;
  letter-spacing: normal;
  font-family: system-ui;
  font-weight: normal;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .title-text {
    font-size: 36px;
  }

  .subtitle {
    font-size: 12px;
  }

  .info-card,
  .tips-card,
  .mode-selector-card {
    padding: 16px;
  }

  .action-btn {
    padding: 16px 20px;
    font-size: 16px;
  }

  .room-input {
    font-size: 24px;
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .title-text {
    font-size: 28px;
    letter-spacing: 2px;
  }

  .subtitle {
    font-size: 11px;
  }

  .info-icon {
    font-size: 24px;
  }

  .info-header,
  .tips-header {
    font-size: 14px;
  }

  .info-text,
  .tips-list li {
    font-size: 12px;
  }

  .room-input {
    font-size: 20px;
    letter-spacing: 4px;
  }
}
</style>
