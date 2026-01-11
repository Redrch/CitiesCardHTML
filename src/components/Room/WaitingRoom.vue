<template>
  <div class="room-setup panel">
    <!-- 房间号显示 -->
    <div class="room-id-display">
      <h3>房间号</h3>
      <div class="room-id-number">{{ roomId }}</div>
      <button :class="['copy-btn', { copied: isCopied }]" @click="copyRoomId">
        {{ isCopied ? '✓ 已复制' : '📋 复制房间号' }}
      </button>
      <div v-if="isFirebaseReady()" style="margin-top: 10px;">
        <div style="color: var(--good); font-weight: bold;">✓ 在线模式</div>
        <div class="muted" style="margin-top: 5px;">
          分享房间号给其他玩家，他们可以在任何设备、任何浏览器中加入
        </div>
      </div>
      <div v-else class="muted" style="margin-top: 10px;">
        ⚠️ 注意：当前使用本地存储，仅支持同一浏览器的不同标签页
        <div style="margin-top: 5px;">
          要加入房间，请在同一浏览器中打开新标签页访问此页面
        </div>
      </div>
    </div>

    <!-- 昵称输入 -->
    <div v-if="!hasJoined" class="nickname-section">
      <div class="nickname-header">请输入你的昵称：</div>
      <input
        v-model="nickname"
        type="text"
        class="nickname-input"
        placeholder="输入昵称"
        maxlength="20"
        @keyup.enter="nickname.trim() && !forceSpectator && confirmNickname(false)"
      />

      <div class="join-mode-section">
        <div v-if="forceSpectator" class="room-full-notice">
          <span class="notice-icon">⚠️</span>
          <span class="notice-text">房间已满，只能加入围观</span>
        </div>
        <div v-else class="join-mode-label">选择加入方式：</div>

        <div class="join-buttons">
          <button
            v-if="!forceSpectator"
            class="join-btn join-btn-battle"
            @click="confirmNickname(false)"
            :disabled="!nickname.trim()"
          >
            <span class="btn-emoji">⚔️</span>
            <span class="btn-label">加入战斗</span>
          </button>
          <button
            class="join-btn join-btn-spectate"
            @click="confirmNickname(true)"
            :disabled="!nickname.trim()"
          >
            <span class="btn-emoji">👁️</span>
            <span class="btn-label">加入围观</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 等待区域 -->
    <div v-if="hasJoined && roomData" class="waiting-room">
      <!-- 围观者视图 -->
      <div v-if="isSpectator" class="spectator-view">
        <h3 style="text-align: center; color: #3b82f6; margin-bottom: 20px;">👁️ 围观模式</h3>

        <!-- 游戏未开始 -->
        <div v-if="!roomData.gameState || !roomData.gameState.currentRound" style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 18px; color: #9ca3af; margin-bottom: 15px;">
            等待游戏开始...
          </div>
          <div style="font-size: 14px; color: #6b7280;">
            当前房间：{{ roomData.players?.length || 0 }} / {{ roomData.playerCount }} 玩家
          </div>
          <div v-if="roomData.players?.length === roomData.playerCount" style="margin-top: 10px; color: #10b981; font-size: 14px;">
            ✓ 玩家已满，等待准备中...
          </div>
        </div>

        <!-- 游戏进行中 -->
        <div v-else style="text-align: center; padding: 20px;">
          <div style="font-size: 20px; color: #10b981; margin-bottom: 20px; font-weight: bold;">
            ⚔️ 游戏进行中
          </div>
          <div style="font-size: 16px; color: #e5e7eb; margin-bottom: 15px;">
            当前回合：第 {{ roomData.gameState.currentRound }} 回合
          </div>

          <!-- 玩家状态 -->
          <div style="margin-top: 20px;">
            <div v-for="player in roomData.players" :key="player.name" style="background: #1f2937; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="font-size: 16px; color: #60a5fa; font-weight: bold;">
                  {{ player.name }}
                </div>
                <div style="font-size: 14px; color: #fbbf24;">
                  💰 {{ player.gold || 0 }} 金币
                </div>
              </div>

              <!-- 存活城市 -->
              <div style="margin-bottom: 8px; font-size: 14px; color: #9ca3af;">
                存活城市：{{ player.cities?.filter(c => c.isAlive !== false).length || 0 }} / {{ player.cities?.length || 0 }}
              </div>

              <!-- 当前出战城市 -->
              <div v-if="roomData.gameState.playerStates && roomData.gameState.playerStates[player.name]" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #374151;">
                <div style="font-size: 12px; color: #60a5fa; margin-bottom: 5px; font-weight: bold;">
                  ⚔️ 出战城市
                </div>
                <div v-if="roomData.gameState.playerStates[player.name].currentBattleCities && roomData.gameState.playerStates[player.name].currentBattleCities.length > 0" style="font-size: 12px; color: #e5e7eb;">
                  <div v-for="battleCity in roomData.gameState.playerStates[player.name].currentBattleCities" :key="battleCity.cityIdx" style="margin: 3px 0;">
                    • {{ player.cities[battleCity.cityIdx]?.name || '未知' }}
                    <span style="color: #fbbf24;">(HP: {{ Math.floor(player.cities[battleCity.cityIdx]?.currentHp || player.cities[battleCity.cityIdx]?.hp || 0) }})</span>
                  </div>
                </div>
                <div v-else style="font-size: 12px; color: #6b7280;">
                  未出战
                </div>
              </div>

              <!-- 已知城市 -->
              <div v-if="player.cities" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #374151;">
                <div style="font-size: 12px; color: #60a5fa; margin-bottom: 5px; font-weight: bold;">
                  🔍 已知城市
                </div>
                <div style="max-height: 120px; overflow-y: auto; font-size: 12px;">
                  <div v-for="(city, idx) in player.cities.filter(c => !c.isUnknown && c.isAlive !== false)" :key="idx" style="color: #10b981; margin: 2px 0;">
                    • {{ city.name }}
                    <span style="color: #6b7280; font-size: 10px; margin-left: 4px;">({{ getProvinceName(city.name) }})</span>
                    <span style="color: #fbbf24;">(HP: {{ Math.floor(city.currentHp || city.hp || 0) }})</span>
                  </div>
                  <div v-if="player.cities.filter(c => !c.isUnknown && c.isAlive !== false).length === 0" style="color: #6b7280; font-size: 11px;">
                    暂无已知城市
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top: 20px; padding: 15px; background: #374151; border-radius: 8px;">
            <div style="font-size: 14px; color: #9ca3af;">
              💡 提示：游戏日志在右下角查看详细战况
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <div style="font-size: 12px; color: #6b7280;">
            围观者昵称：{{ currentPlayerName }}
          </div>
        </div>
      </div>

      <!-- 普通玩家视图 -->
      <div v-else>
        <h4>等待玩家加入 ({{ roomData.players?.length || 0 }} / {{ roomData.playerCount }})</h4>

        <!-- 离线玩家警告 -->
        <div v-if="offlinePlayers.length > 0" style="background: #7f1d1d; border: 1px solid #991b1b; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
          <div style="color: #fca5a5; font-weight: bold; margin-bottom: 8px;">⚠️ 检测到玩家离线</div>
          <div style="color: #fecaca; font-size: 12px; margin-bottom: 8px;">
            以下玩家已离线超过30秒：
          </div>
          <div v-for="({ name, status }) in offlinePlayers" :key="name" style="color: #fef2f2; font-size: 12px; padding: 4px 0;">
            • {{ name }} (离线 {{ status.offlineSeconds || '?' }} 秒)
          </div>
          <div style="margin-top: 8px; display: flex; gap: 8px;">
            <button class="btn" @click="kickPlayer(offlinePlayers[0].name)" style="font-size: 12px; padding: 6px 12px; background: #991b1b; border-color: #7f1d1d;">
              踢出离线玩家
            </button>
            <button class="btn" @click="refreshRoom" style="font-size: 12px; padding: 6px 12px;">
              刷新状态
            </button>
          </div>
        </div>

        <!-- 玩家列表 -->
        <div class="player-list">
          <div
            v-for="player in roomData.players"
            :key="player.name"
            :class="['player-item', { ready: player.ready }]"
          >
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span
                  :style="{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getPlayerStatus(player.name).online ? '#34d399' : '#ef4444'
                  }"
                ></span>
                <span>{{ player.name }}</span>
                <span v-if="!getPlayerStatus(player.name).online" style="color: var(--error); font-size: 11px;">(离线)</span>
              </div>
              <span :style="{ color: player.ready ? 'var(--good)' : 'var(--warn)' }">
                {{ player.ready ? '✓ 已准备' : '准备中...' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 准备按钮 -->
        <div v-if="currentPlayerName" style="margin-top: 15px;">
          <button
            class="confirm-cities-btn"
            @click="toggleReady"
            :disabled="isTogglingReady"
            style="width: 100%;"
          >
            {{ isReady ? '取消准备' : '准备' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { isFirebaseReady } from '../../composables/useFirebase'
import { useRoom } from '../../composables/useRoom'
import { useNotification } from '../../composables/useNotification'
import { useCityDraw } from '../../composables/useCityDraw'
import { PROVINCE_MAP } from '../../data/cities'

const props = defineProps({
  roomId: {
    type: String,
    required: true
  },
  forceSpectator: {
    type: Boolean,
    default: false
  },
  initialRoomData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['all-ready', 'player-joined'])

const { showNotification } = useNotification()
const { assignCitiesToPlayers } = useCityDraw()
const {
  roomData,
  isSpectator,
  getAllPlayersOnlineStatus,
  getOfflinePlayers,
  addPlayerToRoom,
  setPlayerReady,
  kickOfflinePlayer,
  getRoomData,
  saveRoomData,
  startRoomListener
} = useRoom()

const nickname = ref('')
const hasJoined = ref(false)
const currentPlayerName = ref('')
const isReady = ref(false)
const isCopied = ref(false)
const isTogglingReady = ref(false)

// 初始化房间数据
if (props.initialRoomData) {
  roomData.value = props.initialRoomData
}

// 计算在线状态
const onlineStatusMap = computed(() => {
  if (!roomData.value) return {}
  return getAllPlayersOnlineStatus(roomData.value)
})

// 离线玩家列表
const offlinePlayers = computed(() => {
  if (!roomData.value) return []
  return getOfflinePlayers(roomData.value)
})

/**
 * 获取省份名称
 */
function getProvinceName(cityName) {
  const province = PROVINCE_MAP[cityName]
  if (!province) return '未知'

  // 处理直辖市和特区
  if (province.name === '直辖市和特区') {
    if (cityName === '香港特别行政区') return '香港特别行政区'
    if (cityName === '澳门特别行政区') return '澳门特别行政区'
    if (cityName.includes('市')) return '直辖市'
    return province.name
  }

  return province.name
}

// 获取玩家状态
function getPlayerStatus(playerName) {
  return onlineStatusMap.value[playerName] || { online: false }
}

/**
 * 复制房间号
 */
function copyRoomId() {
  navigator.clipboard.writeText(props.roomId).then(() => {
    isCopied.value = true
    showNotification('房间号已复制到剪贴板', 'success')

    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  }).catch(err => {
    showNotification('复制失败：' + err.message, 'error')
  })
}

/**
 * 确认昵称并加入房间
 */
async function confirmNickname(asSpectator = false) {
  if (!nickname.value.trim()) {
    showNotification('请输入昵称！', 'warning')
    return
  }

  const result = await addPlayerToRoom(props.roomId, {
    name: nickname.value.trim()
  }, asSpectator)

  if (result.success) {
    hasJoined.value = true
    currentPlayerName.value = nickname.value.trim()
    showNotification('加入成功！', 'success')
    emit('player-joined', { name: nickname.value.trim(), asSpectator })
  } else {
    showNotification(result.error || '加入失败', 'error')
  }
}

/**
 * 切换准备状态
 */
async function toggleReady() {
  if (!currentPlayerName.value) return

  isTogglingReady.value = true
  const newReadyState = !isReady.value

  const success = await setPlayerReady(props.roomId, currentPlayerName.value, newReadyState)

  if (success) {
    isReady.value = newReadyState
    showNotification(newReadyState ? '已准备' : '已取消准备', 'success')
  } else {
    showNotification('操作失败，请重试', 'error')
  }

  isTogglingReady.value = false
}

/**
 * 踢出玩家
 */
async function kickPlayer(playerName) {
  if (!confirm(`确定要踢出玩家 ${playerName} 吗？\n\n注意：\n1. 此操作不可撤销\n2. 被踢出的玩家需要重新创建房间才能继续游戏\n3. 如果玩家只是暂时掉线，建议等待其重新连接`)) {
    return
  }

  const result = await kickOfflinePlayer(props.roomId, playerName)

  if (result.success) {
    showNotification(`已踢出玩家: ${playerName}`, 'success')
  } else {
    showNotification(result.error || '踢出失败', 'error')
  }
}

/**
 * 刷新房间状态
 */
async function refreshRoom() {
  console.log('[刷新] 手动刷新等待房间状态')
  const data = await getRoomData(props.roomId)
  if (data) {
    roomData.value = data
  }
}

// 监听房间数据变化，检查是否所有人都准备好了
watch(() => roomData.value, async (newData) => {
  if (!newData) return

  // 检查是否所有玩家都准备好了
  if (newData.players?.length === newData.playerCount &&
      newData.players.every(p => p.ready)) {

    console.log('[WaitingRoom] 所有玩家已准备，开始分配城市')

    // 自动为玩家分配城市
    const updatedPlayers = assignCitiesToPlayers(newData.players, newData.mode || '2P')
    newData.players = updatedPlayers

    // 保存更新后的房间数据
    await saveRoomData(props.roomId, newData)

    console.log('[WaitingRoom] 城市分配完成，触发all-ready事件')
    emit('all-ready', newData.players)
  }
}, { deep: true })

onMounted(() => {
  // 开始监听房间变化
  startRoomListener(props.roomId, (data) => {
    roomData.value = data
  })
})

onUnmounted(() => {
  // 组件卸载时不需要手动清理，useRoom的onUnmounted会处理
})
</script>

<style scoped>
.room-setup {
  max-width: 650px;
  margin: 40px auto;
  padding: 30px;
}

.room-id-display {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  border: 2px solid #3b82f6;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  margin: 0 0 25px 0;
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.room-id-display h3 {
  margin: 0 0 12px 0;
  color: #93c5fd;
  font-size: 16px;
  font-weight: 500;
}

.room-id-number {
  font-size: 36px;
  font-weight: bold;
  color: #60a5fa;
  letter-spacing: 6px;
  font-family: 'Courier New', monospace;
  padding: 15px 0;
}

.copy-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  margin-top: 15px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.copy-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.copy-btn.copied {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* 昵称输入区域 */
.nickname-section {
  background: var(--panel);
  border: 2px solid #1f2937;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 25px;
}

.nickname-header {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

.nickname-input {
  width: 100%;
  padding: 16px 18px;
  font-size: 18px;
  background: #1f2937;
  color: var(--text);
  border: 2px solid #374151;
  border-radius: 10px;
  transition: all 0.3s;
  font-weight: 500;
}

.nickname-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: #111827;
}

.nickname-input::placeholder {
  color: #6b7280;
  font-weight: normal;
}

/* 加入方式选择 */
.join-mode-section {
  margin-top: 20px;
}

.room-full-notice {
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #ef4444;
}

.notice-icon {
  font-size: 20px;
}

.notice-text {
  color: #fecaca;
  font-weight: 500;
  font-size: 14px;
}

.join-mode-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  margin-bottom: 12px;
}

.join-buttons {
  display: flex;
  gap: 12px;
}

.join-btn {
  flex: 1;
  padding: 16px 20px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.join-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.join-btn-battle {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.join-btn-battle:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.join-btn-spectate {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.join-btn-spectate:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.btn-emoji {
  font-size: 20px;
}

.btn-label {
  font-size: 16px;
}

/* 等待区域 */
.waiting-room {
  background: var(--panel);
  border: 2px solid #1f2937;
  border-radius: 12px;
  padding: 25px;
  margin: 0;
}

.waiting-room h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: var(--text);
}

.player-list {
  display: grid;
  gap: 10px;
  margin-bottom: 15px;
}

.player-item {
  background: #1f2937;
  padding: 14px 16px;
  border-radius: 8px;
  border: 2px solid #374151;
  transition: all 0.3s;
}

.player-item:hover {
  background: #111827;
}

.player-item.ready {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

/* 围观者视图 */
.spectator-view {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 2px solid #3b82f6;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
}

.spectator-view h3 {
  font-size: 22px;
  font-weight: bold;
  margin: 0;
}

</style>
