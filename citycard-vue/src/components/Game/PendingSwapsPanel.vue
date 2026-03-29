<template>
  <div v-if="pendingSwaps.length > 0" class="pending-swaps-panel">
    <div class="panel-header">
      <div class="header-icon">⚡</div>
      <h3 class="header-title">先声夺人请求</h3>
      <div class="request-count">{{ pendingSwaps.length }}</div>
    </div>

    <div class="swaps-list">
      <div
        v-for="swap in pendingSwaps"
        :key="swap.id"
        class="swap-request-card"
      >
        <div class="request-info">
          <div class="initiator-section">
            <div class="section-label">发起者</div>
            <div class="player-name">{{ swap.initiatorName }}</div>
            <div class="unknown-city-hint">
              <div class="mystery-icon">❓</div>
              <div class="mystery-text">未知城市</div>
              <div class="mystery-note">接受交换前无法查看对方城市</div>
            </div>
          </div>

          <div class="swap-arrow">⇄</div>

          <div class="target-section">
            <div class="section-label">你的城市</div>
            <div class="city-selector">
              <div
                v-for="(city, cityName) in props.currentPlayer.cities"
                :key="cityName"
                :class="[
                  'city-option',
                  {
                    selected: selectedCityName === cityName,
                    disabled: !canSelectCity(city, cityName)
                  }
                ]"
                @click="handleCityClick(cityName, city)"
              >
                <div class="city-icon">🏙️</div>
                <div class="city-details">
                  <div class="city-name">{{ city.name }}</div>
                  <div class="city-hp">HP: {{ Math.floor(city.currentHp || city.hp) }}</div>

                  <!-- 禁用原因标记 -->
                  <div v-if="!canSelectCity(city, cityName)" class="disabled-reason">
                    <span v-if="cityName === props.currentPlayer.centerCityName" class="reason-badge center">中心</span>
                    <span v-else class="reason-badge cautious">谨慎交换</span>
                  </div>
                </div>
                <div v-if="selectedCityName === cityName" class="check-mark">✓</div>
              </div>
              <div v-if="getAllSelectableCities().length === 0" class="no-cities-hint">
                暂无可交换的城市
              </div>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button
            class="btn-accept"
            :disabled="selectedCityName === null || getAllSelectableCities().length === 0"
            @click="handleAccept(swap)"
          >
            ✓ 接受交换
          </button>
          <button
            class="btn-reject"
            :disabled="currentPlayer.gold < 11"
            :title="currentPlayer.gold < 11 ? `金币不足，需要11金币使用无懈可击（当前${currentPlayer.gold}金币）` : '使用无懈可击拒绝（花费11金币）'"
            @click="handleReject(swap)"
          >
            <span class="btn-icon">✗</span>
            <span class="btn-text">拒绝</span>
            <span class="btn-cost">(11💰)</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useNonBattleSkills } from '../../composables/skills/nonBattleSkills'
import { useDialog } from '../../composables/useDialog'

const props = defineProps({
  currentPlayer: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['swap-accepted', 'swap-rejected'])

const gameStore = useGameStore()
const { acceptPreemptiveStrike, rejectPreemptiveStrike } = useNonBattleSkills()
const { showAlert, showConfirm } = useDialog()
const selectedCityName = ref(null)

// 获取当前玩家的待处理交换请求
const pendingSwaps = computed(() => {
  return gameStore.getPendingSwapsForPlayer(props.currentPlayer.name)
})

/**
 * 获取发起者选择的城市名称
 */
function getInitiatorCityName(swap) {
  const initiator = gameStore.players.find(p => p.name === swap.initiatorName)
  if (!initiator || !initiator.cities[swap.initiatorCityName]) {
    return '未知城市'
  }
  return initiator.cities[swap.initiatorCityName].name
}

/**
 * 获取发起者选择的城市HP
 */
function getInitiatorCityHp(swap) {
  const initiator = gameStore.players.find(p => p.name === swap.initiatorName)
  if (!initiator || !initiator.cities[swap.initiatorCityName]) {
    return 0
  }
  const city = initiator.cities[swap.initiatorCityName]
  return Math.floor(city.currentHp || city.hp)
}

/**
 * 检查城市是否可以被选择
 */
function canSelectCity(city, cityName) {
  if (!city) return false

  // 排除已阵亡
  if (city.isAlive === false) return false

  // 排除谨慎交换集合（包括cautionSet和cautiousExchange）
  if (gameStore.isInCautiousSet(props.currentPlayer.name, cityName)) return false

  // 排除中心城市（使用centerCityName判断）
  if (cityName === props.currentPlayer.centerCityName) return false

  // 排除定海神针城市
  if (gameStore.anchored[props.currentPlayer.name] &&
      gameStore.anchored[props.currentPlayer.name][cityName]) return false

  // 排除钢铁城市
  if (gameStore.hasIronShield(props.currentPlayer.name, cityName)) return false

  // 排除城市保护罩
  if (gameStore.hasProtection(props.currentPlayer.name, cityName)) return false

  return true
}

/**
 * 获取所有可选择的城市（用于检查是否有可选城市）
 */
function getAllSelectableCities() {
  return Object.entries(props.currentPlayer.cities).filter(([cityName, city]) => canSelectCity(city, cityName))
}

/**
 * 处理城市点击
 */
function handleCityClick(cityName, city) {
  // 只有可选择的城市才能被点击
  if (!canSelectCity(city, cityName)) {
    return
  }
  selectedCityName.value = cityName
}

/**
 * 处理接受交换
 */
async function handleAccept(swap) {
  if (selectedCityName.value === null) {
    await showAlert('请先选择一个城市', { title: '提示', icon: '💡' })
    return
  }

  const targetCity = props.currentPlayer.cities[selectedCityName.value]

  if (!targetCity || !canSelectCity(targetCity, selectedCityName.value)) {
    await showAlert('选择的城市无效', { title: '提示', icon: '⚠️' })
    return
  }

  const targetCityName = targetCity.name

  console.log('[PendingSwapsPanel] 接受交换', {
    swapId: swap.id,
    targetCityName: targetCityName
  })

  // 调用acceptPreemptiveStrike
  const result = acceptPreemptiveStrike(swap.id, targetCityName)

  if (result.success) {
    emit('swap-accepted', { swap, result })
    selectedCityName.value = null
  } else {
    await showAlert(result.message || '交换失败', { title: '交换失败', icon: '❌' })
  }
}

/**
 * 处理拒绝交换
 */
async function handleReject(swap) {
  if (!await showConfirm(`确定拒绝 ${swap.initiatorName} 的先声夺人请求吗？`, { title: '拒绝交换', icon: '⚠️' })) {
    return
  }

  console.log('[PendingSwapsPanel] 拒绝交换', { swapId: swap.id })

  // 调用rejectPreemptiveStrike
  const result = rejectPreemptiveStrike(swap.id)

  if (result.success) {
    emit('swap-rejected', { swap, result })
  } else {
    await showAlert(result.message || '拒绝失败', { title: '操作失败', icon: '❌' })
  }
}
</script>

<style scoped>
.pending-swaps-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border: 3px solid #f59e0b;
  border-radius: 16px;
  padding: 24px;
  max-width: 700px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(30, 41, 59, 0.35);
  z-index: 9999;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(245, 158, 11, 0.3);
}

.header-icon {
  font-size: 32px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.header-title {
  flex: 1;
  font-size: 24px;
  font-weight: 700;
  color: #fbbf24;
  margin: 0;
}

.request-count {
  background: #f59e0b;
  color: white;
  font-size: 16px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 12px;
  min-width: 32px;
  text-align: center;
}

.swaps-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.swap-request-card {
  background: rgba(241, 245, 251, 0.7);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 20px;
}

.request-info {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
}

.initiator-section,
.target-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.player-name {
  font-size: 18px;
  font-weight: 700;
  color: #60a5fa;
}

.unknown-city-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: rgba(241, 245, 251, 0.7);
  border: 2px dashed rgba(148, 163, 184, 0.4);
  border-radius: 8px;
  margin-top: 8px;
}

.mystery-icon {
  font-size: 32px;
  opacity: 0.8;
  animation: pulse 2s infinite;
}

.mystery-text {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 1px;
}

.mystery-note {
  font-size: 11px;
  color: #64748b;
  text-align: center;
  font-style: italic;
  line-height: 1.4;
}

.city-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(96, 165, 250, 0.3);
  border-radius: 8px;
}

.city-icon {
  font-size: 24px;
}

.city-details {
  flex: 1;
}

.city-name {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 4px;
}

.city-hp {
  font-size: 12px;
  color: #f59e0b;
  font-weight: 500;
}

.swap-arrow {
  font-size: 32px;
  color: #f59e0b;
  animation: bounce 1.5s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(5px);
  }
}

.city-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.city-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(241, 245, 251, 0.7);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.city-option:hover:not(.disabled) {
  border-color: #60a5fa;
  background: rgba(96, 165, 250, 0.15);
  transform: translateX(4px);
}

.city-option.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.city-option.disabled:hover {
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(241, 245, 251, 0.7);
  transform: none;
}

.city-option.selected {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.2);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
}

.check-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #22c55e;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.5);
}

/* 禁用原因标记 */
.disabled-reason {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.reason-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
}

.reason-badge.center {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  box-shadow: 0 1px 3px rgba(251, 191, 36, 0.3);
}

.reason-badge.cautious {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 1px 3px rgba(239, 68, 68, 0.3);
}

.no-cities-hint {
  text-align: center;
  padding: 20px;
  color: #94a3b8;
  font-size: 14px;
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-accept,
.btn-reject {
  flex: 1;
  padding: 14px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-accept {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-accept:hover:not(:disabled) {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
}

.btn-accept:disabled {
  background: #e2e8f0;
  color: #6b7280;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-reject {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  flex-direction: row;
}

.btn-reject:hover:not(:disabled) {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.btn-reject:disabled {
  background: #e2e8f0;
  color: #6b7280;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-icon {
  font-size: 18px;
}

.btn-text {
  font-size: 16px;
}

.btn-cost {
  font-size: 12px;
  opacity: 0.9;
  font-weight: 600;
}

/* 自定义滚动条 */
.city-selector::-webkit-scrollbar,
.pending-swaps-panel::-webkit-scrollbar {
  width: 8px;
}

.city-selector::-webkit-scrollbar-track,
.pending-swaps-panel::-webkit-scrollbar-track {
  background: rgba(100, 116, 145, 0.08);
  border-radius: 4px;
}

.city-selector::-webkit-scrollbar-thumb,
.pending-swaps-panel::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
  border-radius: 4px;
}

.city-selector::-webkit-scrollbar-thumb:hover,
.pending-swaps-panel::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
}

/* 响应式布局 */
@media (max-width: 768px) {
  .pending-swaps-panel {
    width: 95%;
    padding: 16px;
  }

  .request-info {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }

  .swap-arrow {
    transform: rotate(90deg);
    font-size: 24px;
  }

  .header-title {
    font-size: 20px;
  }

  .btn-accept,
  .btn-reject {
    font-size: 14px;
    padding: 12px 16px;
  }
}
</style>
