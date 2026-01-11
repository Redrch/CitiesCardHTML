<template>
  <div class="room-setup panel">
    <h2 class="room-title">房间设置</h2>

    <!-- 使用说明 -->
    <div class="info-box">
      <div class="info-header">📌 使用说明</div>
      <div class="info-content">
        创建房间后，分享房间号给其他玩家即可加入
      </div>
    </div>

    <!-- 房间管理提示 -->
    <div class="tips-box">
      <div class="tips-header">💡 房间管理提示：</div>
      <div class="tips-content">
        • 房间将在24小时无活动后自动清理<br/>
        • 支持断线重连，连接丢失时会自动尝试恢复<br/>
        • 创建房间后可以分享给其他玩家加入
      </div>
    </div>

    <!-- 游戏模式选择 -->
    <div class="mode-selector">
      <label class="mode-label">选择游戏模式：</label>
      <select v-model="selectedMode" class="mode-select">
        <option value="2P">2人对战 (1v1)</option>
        <option value="3P">3人混战</option>
        <option value="2v2">2v2 团队战</option>
      </select>
      <div class="mode-description">
        {{ getModeDescription() }}
      </div>
    </div>

    <!-- 操作按钮区 -->
    <div class="action-section">
      <button class="action-btn action-btn-create" @click="handleCreateRoom">
        <span class="btn-icon">➕</span>
        <span class="btn-text">创建房间</span>
      </button>

      <div class="divider">
        <span class="divider-text">或</span>
      </div>

      <div class="join-section">
        <label class="join-label">输入房间号加入：</label>
        <input
          v-model="roomIdInput"
          type="text"
          class="room-input"
          placeholder="请输入9位房间号"
          maxlength="9"
          @keyup.enter="handleJoinRoom"
        />
        <button class="action-btn action-btn-join" @click="handleJoinRoom">
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

const emit = defineEmits(['room-created', 'room-joined'])

const { showNotification } = useNotification()
const { createRoom, joinRoom } = useRoom()

const roomIdInput = ref('')
const selectedMode = ref('2P')

/**
 * 获取模式描述
 */
function getModeDescription() {
  const descriptions = {
    '2P': '需要2名玩家，每人10个城市，选择1个中心城市和5个预备城市',
    '3P': '需要3名玩家，每人10个城市，选择5个预备城市（无中心城市）',
    '2v2': '需要4名玩家组成两队，每人7个城市，选择1个中心城市和4个预备城市'
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
.room-setup {
  max-width: 650px;
  margin: 40px auto;
  padding: 30px;
}

.room-title {
  text-align: center;
  margin-bottom: 25px;
  font-size: 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 使用说明框 */
.info-box {
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  padding: 15px 20px;
  border-radius: 12px;
  margin-bottom: 15px;
  border: 1px solid #374151;
}

.info-header {
  color: #fbbf24;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-content {
  color: #d1d5db;
  font-size: 13px;
  line-height: 1.6;
}

/* 提示框 */
.tips-box {
  background: linear-gradient(135deg, #512da8 0%, #311b92 100%);
  padding: 15px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #673ab7;
}

.tips-header {
  color: #b39ddb;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 13px;
}

.tips-content {
  color: #d1c4e9;
  font-size: 12px;
  line-height: 1.8;
}

/* 游戏模式选择 */
.mode-selector {
  background: var(--panel);
  padding: 20px;
  border-radius: 12px;
  border: 2px solid #1f2937;
  margin-bottom: 25px;
  transition: all 0.3s;
}

.mode-selector:hover {
  border-color: #667eea;
}

.mode-label {
  display: block;
  margin-bottom: 12px;
  font-weight: bold;
  color: var(--text);
  font-size: 15px;
}

.mode-select {
  width: 100%;
  padding: 14px 16px;
  font-size: 16px;
  border-radius: 8px;
  background: #1f2937;
  color: var(--text);
  border: 2px solid #374151;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-select:hover {
  border-color: #667eea;
}

.mode-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.mode-description {
  margin-top: 10px;
  font-size: 13px;
  color: var(--muted);
  padding: 10px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

/* 操作区 */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 统一按钮样式 */
.action-btn {
  width: 100%;
  padding: 18px 24px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn-create {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.action-btn-create:hover {
  background: linear-gradient(135deg, #5568d3 0%, #653a8f 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.action-btn-join {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.action-btn-join:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn-icon {
  font-size: 20px;
}

.btn-text {
  font-size: 18px;
}

/* 分隔线 */
.divider {
  text-align: center;
  position: relative;
  margin: 10px 0;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: linear-gradient(to right, transparent, #374151, transparent);
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider-text {
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  padding: 0 15px;
  background: var(--bg);
  position: relative;
  z-index: 1;
}

/* 加入房间区 */
.join-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.join-label {
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
}

.room-input {
  width: 100%;
  padding: 16px;
  font-size: 24px;
  text-align: center;
  letter-spacing: 6px;
  font-family: 'Courier New', monospace;
  background: #1f2937;
  color: var(--accent);
  border: 2px solid #374151;
  border-radius: 10px;
  transition: all 0.3s;
  font-weight: bold;
}

.room-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  background: #111827;
}

.room-input::placeholder {
  color: #6b7280;
  font-size: 14px;
  letter-spacing: normal;
  font-family: system-ui;
  font-weight: normal;
}
</style>
