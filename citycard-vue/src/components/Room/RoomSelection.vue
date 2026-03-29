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
import { useSession } from '../../composables/useSession'

const emit = defineEmits(['room-created', 'room-joined', 'back'])

const { showNotification } = useNotification()
const { createRoom, joinRoom } = useRoom()
const { loadSession } = useSession()

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

    // Check for saved session matching this room
    const savedSession = loadSession()
    let reconnectInfo = null
    if (savedSession && savedSession.roomId === roomIdInput.value.trim()) {
      // Verify player still exists in room data
      const playerExists = result.roomData?.players?.some(p => p.name === savedSession.playerName)
      if (playerExists) {
        reconnectInfo = {
          playerName: savedSession.playerName,
          savedStep: savedSession.currentStep,
          gameMode: savedSession.gameMode,
          centerCityName: savedSession.centerCityName
        }
      }
    }

    emit('room-joined', {
      roomId: roomIdInput.value.trim(),
      roomData: result.roomData,
      isRoomFull: result.isRoomFull,
      reconnectInfo
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
  background: linear-gradient(150deg, #2a2340 0%, #1e2a4a 30%, #2a3a5c 60%, #3a2a4a 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Map grid pattern + compass rose */
.room-selection::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800'%3E%3C!-- Grid lines like a map --%3E%3Cline x1='0' y1='100' x2='800' y2='100' stroke='rgba(212,160,23,0.04)' stroke-width='0.5'/%3E%3Cline x1='0' y1='200' x2='800' y2='200' stroke='rgba(212,160,23,0.04)' stroke-width='0.5'/%3E%3Cline x1='0' y1='300' x2='800' y2='300' stroke='rgba(212,160,23,0.04)' stroke-width='0.5'/%3E%3Cline x1='0' y1='400' x2='800' y2='400' stroke='rgba(212,160,23,0.05)' stroke-width='0.5'/%3E%3Cline x1='0' y1='500' x2='800' y2='500' stroke='rgba(212,160,23,0.04)' stroke-width='0.5'/%3E%3Cline x1='0' y1='600' x2='800' y2='600' stroke='rgba(212,160,23,0.04)' stroke-width='0.5'/%3E%3Cline x1='0' y1='700' x2='800' y2='700' stroke='rgba(212,160,23,0.04)' stroke-width='0.5'/%3E%3Cline x1='100' y1='0' x2='100' y2='800' stroke='rgba(212,160,23,0.04)' stroke-width='0.5'/%3E%3Cline x1='200' y1='0' x2='200' y2='800' stroke='rgba(212,160,23,0.04)' stroke-width='0.5'/%3E%3Cline x1='300' y1='0' x2='300' y2='800' stroke='rgba(212,160,23,0.04)' stroke-width='0.5'/%3E%3Cline x1='400' y1='0' x2='400' y2='800' stroke='rgba(212,160,23,0.05)' stroke-width='0.5'/%3E%3Cline x1='500' y1='0' x2='500' y2='800' stroke='rgba(212,160,23,0.04)' stroke-width='0.5'/%3E%3Cline x1='600' y1='0' x2='600' y2='800' stroke='rgba(212,160,23,0.04)' stroke-width='0.5'/%3E%3Cline x1='700' y1='0' x2='700' y2='800' stroke='rgba(212,160,23,0.04)' stroke-width='0.5'/%3E%3C!-- Compass rose --%3E%3Ccircle cx='650' cy='650' r='80' fill='none' stroke='rgba(212,160,23,0.08)' stroke-width='1.5'/%3E%3Ccircle cx='650' cy='650' r='55' fill='none' stroke='rgba(212,160,23,0.06)' stroke-width='1'/%3E%3Ccircle cx='650' cy='650' r='30' fill='none' stroke='rgba(139,92,246,0.06)' stroke-width='0.8'/%3E%3Cline x1='650' y1='560' x2='650' y2='740' stroke='rgba(212,160,23,0.1)' stroke-width='1.5'/%3E%3Cline x1='560' y1='650' x2='740' y2='650' stroke='rgba(212,160,23,0.1)' stroke-width='1.5'/%3E%3Cline x1='587' y1='587' x2='713' y2='713' stroke='rgba(139,92,246,0.06)' stroke-width='0.8'/%3E%3Cline x1='713' y1='587' x2='587' y2='713' stroke='rgba(139,92,246,0.06)' stroke-width='0.8'/%3E%3Ctext x='650' y='555' text-anchor='middle' fill='rgba(212,160,23,0.1)' font-size='14' font-weight='bold'%3EN%3C/text%3E%3Ctext x='650' y='755' text-anchor='middle' fill='rgba(212,160,23,0.08)' font-size='12'%3ES%3C/text%3E%3Ctext x='548' y='655' text-anchor='middle' fill='rgba(212,160,23,0.08)' font-size='12'%3EW%3C/text%3E%3Ctext x='752' y='655' text-anchor='middle' fill='rgba(212,160,23,0.08)' font-size='12'%3EE%3C/text%3E%3C!-- Map pin markers --%3E%3Ccircle cx='150' cy='200' r='5' fill='rgba(239,68,68,0.12)' stroke='rgba(239,68,68,0.15)' stroke-width='1'/%3E%3Ccircle cx='350' cy='350' r='5' fill='rgba(59,130,246,0.12)' stroke='rgba(59,130,246,0.15)' stroke-width='1'/%3E%3Ccircle cx='500' cy='180' r='5' fill='rgba(16,185,129,0.12)' stroke='rgba(16,185,129,0.15)' stroke-width='1'/%3E%3Ccircle cx='250' cy='550' r='5' fill='rgba(212,160,23,0.12)' stroke='rgba(212,160,23,0.15)' stroke-width='1'/%3E%3Ccircle cx='600' cy='400' r='5' fill='rgba(139,92,246,0.12)' stroke='rgba(139,92,246,0.15)' stroke-width='1'/%3E%3C!-- Dotted route lines between pins --%3E%3Cline x1='150' y1='200' x2='350' y2='350' stroke='rgba(212,160,23,0.06)' stroke-width='1' stroke-dasharray='4,6'/%3E%3Cline x1='350' y1='350' x2='500' y2='180' stroke='rgba(212,160,23,0.06)' stroke-width='1' stroke-dasharray='4,6'/%3E%3Cline x1='350' y1='350' x2='600' y2='400' stroke='rgba(139,92,246,0.05)' stroke-width='1' stroke-dasharray='4,6'/%3E%3Cline x1='250' y1='550' x2='350' y2='350' stroke='rgba(139,92,246,0.05)' stroke-width='1' stroke-dasharray='4,6'/%3E%3C/svg%3E");
  background-size: 100% 100%;
  pointer-events: none;
}

/* Ambient glow */
.room-selection::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 75% 75%, rgba(212, 160, 23, 0.08) 0%, transparent 50%),
    radial-gradient(ellipse at 25% 25%, rgba(59, 130, 246, 0.06) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.04) 0%, transparent 40%);
  pointer-events: none;
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
  z-index: 10;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 12px 24px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(12px);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.25);
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
  background: linear-gradient(135deg, #f0c850 0%, #d4a017 40%, #e8c24a 60%, #f5d76e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  filter: drop-shadow(0 0 20px rgba(212, 160, 23, 0.3));
  letter-spacing: 3px;
}

.subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.45);
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
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(212, 160, 23, 0.25);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  backdrop-filter: blur(12px);
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
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 8px;
}

.info-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}

/* 提示卡片 */
.tips-card {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(20, 184, 166, 0.25);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  backdrop-filter: blur(12px);
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.tips-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
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
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.8;
  padding-left: 20px;
  position: relative;
}

.tips-list li::before {
  content: '•';
  position: absolute;
  left: 8px;
  color: #14b8a6;
  font-weight: bold;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 模式选择卡片 */
.mode-selector-card {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(139, 92, 246, 0.25);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  backdrop-filter: blur(12px);
  transition: all 0.3s ease;
  animation: fadeInUp 0.8s ease-out 0.3s both;
}

.mode-selector-card:hover {
  border-color: rgba(139, 92, 246, 0.4);
}

.mode-label {
  display: block;
  font-size: 15px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.85);
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
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.85);
  border: 2px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(12px);
  font-weight: 600;
  text-align: left;
}

.mode-option-btn.active {
  border-color: rgba(139, 92, 246, 0.6);
  background: rgba(139, 92, 246, 0.15);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
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
  color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.1);
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
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 16px 32px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 16px;
  font-weight: 600;
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
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
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  border-left: 3px solid rgba(139, 92, 246, 0.5);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.action-btn:hover::before {
  opacity: 1;
}

.create-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.35);
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.create-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.5);
}

.create-btn:active {
  transform: translateY(-2px);
}

.join-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.35);
}

.join-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(16, 185, 129, 0.5);
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
  background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1), transparent);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider-text {
  color: rgba(255, 255, 255, 0.45);
  font-size: 14px;
  font-weight: 600;
  padding: 0 20px;
  background: linear-gradient(150deg, #2a2340 0%, #1e2a4a 30%, #2a3a5c 60%, #3a2a4a 100%);
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
  color: rgba(255, 255, 255, 0.85);
  text-align: center;
}

.room-input {
  width: 100%;
  padding: 18px;
  font-size: 28px;
  text-align: center;
  letter-spacing: 8px;
  font-family: 'Courier New', monospace;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  transition: all 0.3s ease;
  font-weight: 700;
  backdrop-filter: blur(12px);
}

.room-input:focus {
  outline: none;
  border-color: rgba(16, 185, 129, 0.6);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  background: rgba(255, 255, 255, 0.12);
}

.room-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
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
