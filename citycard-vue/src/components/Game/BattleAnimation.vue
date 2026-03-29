<template>
  <div v-if="show" class="battle-animation-overlay">
    <div class="battle-animation-container">
      <!-- 标题 -->
      <div class="battle-title">
        <div class="swords-icon">⚔️</div>
        <h2>战斗回合 {{ round }}</h2>
      </div>

      <!-- 特殊事件显示（同省撤退、同省归顺） -->
      <div v-if="specialEvent" class="special-event-banner" :class="specialEvent.type">
        <div class="special-event-text">
          {{ specialEvent.message }}
        </div>
      </div>

      <!-- 双方对战区域 - 关键修复：特殊事件（撤退/归顺）时也要显示出战城市列表 -->
      <div v-if="!specialEvent || (Object.keys(player1.cities).length > 0 || Object.keys(player2.cities).length > 0)" class="battle-area">
        <!-- 玩家1区域 -->
        <div class="player-area player-left">
          <div class="player-name">{{ player1.name }}</div>
          <div class="city-cards">
            <div
              v-for="(city, idx) in player1.cities"
              :key="idx"
              class="city-card"
              :class="{
                'city-destroyed': city.isDestroyed,
                'hp-decreasing': city.hpDecreasing,
                'hp-fatigued': city.fatigued
              }"
            >
              <div class="city-card-header">
                <span class="city-name">{{ city.name }}</span>
                <!-- <span v-if="city.skill" class="city-skill">🎯 {{ city.skill }}</span> -->
              </div>
              <div class="city-hp-bar">
                <div class="hp-label">HP</div>
                <div class="hp-progress-container">
                  <div
                    class="hp-progress"
                    :style="{ width: getHpPercentage(city) + '%' }"
                  ></div>
                  <div class="hp-text">
                    <span class="hp-current" :class="{ 'hp-changing': city.hpChanging }">
                      {{ city.currentHp }}
                    </span>
                    <span class="hp-max">/ {{ city.maxHp }}</span>
                  </div>
                </div>
              </div>

              <!-- HP变化动画 -->
              <div v-if="city.hpChange" class="hp-change-label" :class="city.hpChange > 0 ? 'hp-heal' : 'hp-damage'">
                {{ city.hpChange > 0 ? '+' : '' }}{{ city.hpChange }}
              </div>

              <!-- 疲劳标记 -->
              <div v-if="city.fatigued" class="fatigue-label">😓 疲劳减半</div>

              <!-- 破碎效果 -->
              <div v-if="city.isDestroyed" class="destroyed-overlay">
                <div class="destroyed-text">💥 已阵亡</div>
              </div>
            </div>
          </div>
          <div class="total-attack">
            <span>总攻击力:</span>
            <span class="attack-value">{{ player1.totalAttack }}</span>
          </div>
        </div>

        <!-- VS 分隔符 -->
        <div class="vs-divider">
          <div class="vs-icon">⚡VS⚡</div>
        </div>

        <!-- 玩家2区域 -->
        <div class="player-area player-right">
          <div class="player-name">{{ player2.name }}</div>
          <div class="city-cards">
            <div
              v-for="(city, idx) in player2.cities"
              :key="idx"
              class="city-card"
              :class="{
                'city-destroyed': city.isDestroyed,
                'hp-decreasing': city.hpDecreasing,
                'hp-fatigued': city.fatigued
              }"
            >
              <div class="city-card-header">
                <span class="city-name">{{ city.name }}</span>
                <!-- <span v-if="city.skill" class="city-skill">🎯 {{ city.skill }}</span> -->
              </div>
              <div class="city-hp-bar">
                <div class="hp-label">HP</div>
                <div class="hp-progress-container">
                  <div
                    class="hp-progress"
                    :style="{ width: getHpPercentage(city) + '%' }"
                  ></div>
                  <div class="hp-text">
                    <span class="hp-current" :class="{ 'hp-changing': city.hpChanging }">
                      {{ city.currentHp }}
                    </span>
                    <span class="hp-max">/ {{ city.maxHp }}</span>
                  </div>
                </div>
              </div>

              <!-- HP变化动画 -->
              <div v-if="city.hpChange" class="hp-change-label" :class="city.hpChange > 0 ? 'hp-heal' : 'hp-damage'">
                {{ city.hpChange > 0 ? '+' : '' }}{{ city.hpChange }}
              </div>

              <!-- 疲劳标记 -->
              <div v-if="city.fatigued" class="fatigue-label">😓 疲劳减半</div>

              <!-- 破碎效果 -->
              <div v-if="city.isDestroyed" class="destroyed-overlay">
                <div class="destroyed-text">💥 已阵亡</div>
              </div>

              <!-- 归顺移动动画 -->
              <div v-if="city.surrendering" class="surrender-arrow">
                ➡️
              </div>
            </div>
          </div>
          <div class="total-attack">
            <span>总攻击力:</span>
            <span class="attack-value">{{ player2.totalAttack }}</span>
          </div>
        </div>
      </div>

      <!-- 继续按钮 -->
      <button
        v-if="animationComplete"
        class="continue-button"
        @click="$emit('complete')"
      >
        继续 ▶
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  battleData: {
    type: Object,
    required: true,
    // battleData 结构:
    // {
    //   round: 1,
    //   player1: { name, cities: [{name, hp, maxHp, skill}], totalAttack },
    //   player2: { name, cities: [{name, hp, maxHp, skill}], totalAttack },
    //   specialEvent: { type: 'retreat' | 'surrender', message, province },
    //   battleResults: { hpChanges, destroyed, fatigued }
    // }
  }
})

const emit = defineEmits(['complete'])

// 动画锁：防止多个watcher同时触发导致动画重复播放
const isAnimationPlaying = ref(false)
// 记录已完成动画的回合号，防止Firebase重复触发同一回合动画
const lastCompletedRound = ref(-1)

// 动画状态
const round = ref(props.battleData?.round || 1)
const player1 = ref({ name: '', cities: [], totalAttack: 0 })
const player2 = ref({ name: '', cities: [], totalAttack: 0 })
const specialEvent = ref(null)
const animationComplete = ref(false)

// 计算HP百分比
function getHpPercentage(city) {
  if (!city.maxHp) return 0
  return Math.max(0, Math.min(100, (city.currentHp / city.maxHp) * 100))
}

// 初始化战斗数据
function initBattleData() {
  if (!props.battleData) return

  console.log('[BattleAnimation] 初始化战斗数据', props.battleData)
  console.log('[BattleAnimation] props.battleData.specialEvent:', props.battleData.specialEvent)

  round.value = props.battleData.round || 1

  // 初始化玩家数据
  player1.value = {
    name: props.battleData.player1?.name || '玩家1',
    cities: (props.battleData.player1?.cities || []).map(city => ({
      ...city,
      currentHp: city.initialHp || city.currentHp || city.hp,
      maxHp: city.maxHp || city.hp,
      hpChange: 0,
      hpChanging: false,
      hpDecreasing: false,
      fatigued: false,
      isDestroyed: false
    })),
    totalAttack: props.battleData.player1?.totalAttack || 0
  }

  player2.value = {
    name: props.battleData.player2?.name || '玩家2',
    cities: (props.battleData.player2?.cities || []).map(city => ({
      ...city,
      currentHp: city.initialHp || city.currentHp || city.hp,
      maxHp: city.maxHp || city.hp,
      hpChange: 0,
      hpChanging: false,
      hpDecreasing: false,
      fatigued: false,
      isDestroyed: false,
      surrendering: false
    })),
    totalAttack: props.battleData.player2?.totalAttack || 0
  }

  specialEvent.value = props.battleData.specialEvent || null
  console.log('[BattleAnimation] specialEvent设置为:', specialEvent.value)
  console.log('[BattleAnimation] player1城市数量:', Object.keys(player1.value.cities).length)
  console.log('[BattleAnimation] player2城市数量:', Object.keys(player2.value.cities).length)
  console.log('[BattleAnimation] player1总攻击力:', player1.value.totalAttack)
  console.log('[BattleAnimation] player2总攻击力:', player2.value.totalAttack)
}

// 播放动画序列
async function playAnimationSequence() {
  if (!props.show) return

  // 关键修复：检查battleData是否存在，并缓存到本地变量
  // 防止在async执行过程中props.battleData被响应式更新为null
  const battleData = props.battleData
  if (!battleData) {
    console.error('[BattleAnimation] battleData为空，无法播放动画')
    animationComplete.value = true
    isAnimationPlaying.value = false
    return
  }

  // 防止同一回合动画被Firebase重复触发
  const currentRound = battleData.round
  if (currentRound != null && currentRound === lastCompletedRound.value) {
    console.log('[BattleAnimation] 回合', currentRound, '动画已播放过，跳过')
    emit('complete')
    return
  }

  if (isAnimationPlaying.value) return  // 防止重复触发
  isAnimationPlaying.value = true        // 获取动画锁

  console.log('[BattleAnimation] 开始播放动画序列')
  animationComplete.value = false

  // 等待入场动画
  await delay(800)

  // 如果有特殊事件
  if (specialEvent.value) {
    if (specialEvent.value.type === 'retreat') {
      // 同省撤退：显示横幅后直接结束
      await delay(3000)
      animationComplete.value = true
      isAnimationPlaying.value = false
      lastCompletedRound.value = currentRound ?? -1
      return
    } else if (specialEvent.value.type === 'surrender') {
      // 同省归顺：播放卡牌移动动画
      await playSurrenderAnimation()
      await delay(2000)
      animationComplete.value = true
      isAnimationPlaying.value = false
      lastCompletedRound.value = currentRound ?? -1
      return
    }
  }

  // 正常战斗流程
  // 1. 显示疲劳减半
  if (battleData.battleResults?.fatigued) {
    await playFatigueAnimation(battleData.battleResults.fatigued)
  }

  // 2. 显示HP变化
  if (battleData.battleResults?.hpChanges) {
    await playHpChangeAnimation(battleData.battleResults.hpChanges)
  }

  // 3. 显示城市阵亡
  if (battleData.battleResults?.destroyed) {
    await playDestroyAnimation(battleData.battleResults.destroyed)
  }

  // 等待一段时间让玩家查看结果
  await delay(2000)

  animationComplete.value = true
  isAnimationPlaying.value = false
  lastCompletedRound.value = currentRound ?? -1
}

// 疲劳减半动画
async function playFatigueAnimation(fatiguedCities) {
  console.log('[BattleAnimation] 播放疲劳减半动画', fatiguedCities)

  for (const { player, animIndex, hpBefore, hpAfter } of fatiguedCities) {
    const playerData = player === 1 ? player1.value : player2.value
    const city = playerData.cities[animIndex]

    if (city) {
      city.fatigued = true
      await delay(500)

      // HP减少动画
      city.hpDecreasing = true
      city.hpChanging = true

      // 逐步减少HP
      await animateHpChange(city, hpBefore, hpAfter)

      city.hpChanging = false
      city.hpDecreasing = false
    }
  }

  await delay(800)
}

// HP变化动画
async function playHpChangeAnimation(hpChanges) {
  console.log('[BattleAnimation] 播放HP变化动画', hpChanges)

  for (const { player, cityName, change, finalHp } of hpChanges) {
    const playerData = player === 1 ? player1.value : player2.value
    const city = playerData.cities[cityName]

    if (city) {
      const initialHp = city.currentHp
      city.hpChange = change
      city.hpChanging = true

      // 逐步改变HP
      await animateHpChange(city, initialHp, finalHp)

      city.hpChanging = false

      // 保持变化标签显示一段时间
      await delay(1000)
      city.hpChange = 0
    }
  }

  await delay(500)
}

// 城市阵亡动画
async function playDestroyAnimation(destroyedCities) {
  console.log('[BattleAnimation] 播放城市阵亡动画', destroyedCities)

  for (const { player, cityName } of destroyedCities) {
    const playerData = player === 1 ? player1.value : player2.value
    const city = playerData.cities[cityName]

    if (city) {
      city.isDestroyed = true
      await delay(800)
    }
  }

  await delay(1000)
}

// 归顺移动动画
async function playSurrenderAnimation() {
  console.log('[BattleAnimation] 播放归顺动画')

  // 这里需要根据 specialEvent 中的信息找到归顺的城市
  if (specialEvent.value.surrenderedCity) {
    const { fromPlayer, cityName } = specialEvent.value.surrenderedCity
    const fromData = fromPlayer === 1 ? player2.value : player1.value
    const city = fromData.cities[cityName]

    if (city) {
      city.surrendering = true
      await delay(2000)
      // 这里可以添加更复杂的移动动画
    }
  }
}

// HP渐变动画
async function animateHpChange(city, from, to) {
  const duration = 800 // 动画持续时间（毫秒）
  const frames = 30 // 动画帧数
  const step = (to - from) / frames
  const frameDelay = duration / frames

  for (let i = 0; i < frames; i++) {
    city.currentHp = Math.round(from + step * (i + 1))
    await delay(frameDelay)
  }

  city.currentHp = to // 确保最终值准确
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 监听 show 属性变化，自动播放动画
watch(() => props.show, (newVal) => {
  if (newVal) {
    initBattleData()
    playAnimationSequence()
  }
})

// 组件挂载时如果已经显示，立即初始化
onMounted(() => {
  if (props.show) {
    initBattleData()
    playAnimationSequence()
  }
})
</script>

<style scoped>
.battle-animation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(30, 41, 59, 0.7);
  backdrop-filter: blur(6px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.battle-animation-container {
  width: 95%;
  max-width: 1400px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
  animation: slideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideIn {
  from {
    transform: translateY(-50px) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* 标题 */
.battle-title {
  text-align: center;
  margin-bottom: 40px;
}

.swords-icon {
  font-size: 64px;
  animation: swing 1s ease-in-out infinite;
}

@keyframes swing {
  0%, 100% { transform: rotate(-10deg); }
  50% { transform: rotate(10deg); }
}

.battle-title h2 {
  font-size: 36px;
  color: #ffffff;
  margin: 10px 0 0 0;
  text-shadow: 0 2px 10px rgba(30, 41, 59, 0.4);
}

/* 特殊事件横幅 */
.special-event-banner {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border: 3px solid #d97706;
  border-radius: 16px;
  padding: 40px;
  margin: 30px 0;
  text-align: center;
  box-shadow: 0 10px 40px rgba(251, 191, 36, 0.3);
  animation: bannerPulse 2s ease-in-out infinite;
}

.special-event-banner.retreat {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #1d4ed8;
}

.special-event-banner.surrender {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #047857;
}

@keyframes bannerPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 10px 40px rgba(251, 191, 36, 0.3);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 15px 60px rgba(251, 191, 36, 0.5);
  }
}

.special-event-text {
  font-size: 32px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 10px rgba(100, 116, 145, 0.12);
}

/* 战斗区域 */
.battle-area {
  display: grid;
  grid-template-columns: 1fr 120px 1fr;
  gap: 30px;
  align-items: start;
}

/* 玩家区域 */
.player-area {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
}

.player-name {
  font-size: 24px;
  font-weight: bold;
  color: #f0c850;
  text-align: center;
  margin-bottom: 20px;
}

.city-cards {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

/* 城市卡片 */
.city-card {
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 15px;
  position: relative;
  transition: all 0.3s ease;
  animation: cardEnter 0.5s ease;
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.player-right .city-card {
  animation: cardEnterRight 0.5s ease;
}

@keyframes cardEnterRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.city-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.city-name {
  font-size: 18px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.85);
}

.city-skill {
  font-size: 14px;
  color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #fbbf24;
}

/* HP条 */
.city-hp-bar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hp-label {
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.45);
  min-width: 30px;
}

.hp-progress-container {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  height: 32px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.hp-progress {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 6px;
}

.hp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.6);
  z-index: 1;
}

.hp-current {
  font-size: 16px;
  transition: color 0.3s ease;
}

.hp-current.hp-changing {
  color: #fbbf24;
  animation: hpBlink 0.5s ease infinite;
}

@keyframes hpBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.hp-max {
  color: rgba(255, 255, 255, 0.45);
}

/* HP变化标签 */
.hp-change-label {
  position: absolute;
  top: -10px;
  right: 10px;
  font-size: 20px;
  font-weight: bold;
  animation: hpChangeFloat 2s ease-out forwards;
  z-index: 10;
}

.hp-change-label.hp-damage {
  color: #ef4444;
  text-shadow: 0 0 10px rgba(239, 68, 68, 0.8);
}

.hp-change-label.hp-heal {
  color: #10b981;
  text-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
}

@keyframes hpChangeFloat {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-40px);
    opacity: 0;
  }
}

/* 疲劳标签 */
.fatigue-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  font-weight: bold;
  color: #fbbf24;
  background: rgba(30, 41, 59, 0.75);
  padding: 8px 16px;
  border-radius: 8px;
  border: 2px solid #fbbf24;
  z-index: 5;
  animation: fatigueAppear 0.5s ease;
}

@keyframes fatigueAppear {
  from {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

/* 疲劳状态的卡片 */
.city-card.hp-fatigued {
  border-color: #fbbf24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
}

/* HP减少状态 */
.city-card.hp-decreasing .hp-progress {
  background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
}

/* 阵亡覆盖层 */
.destroyed-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: shatter 0.8s ease;
  z-index: 10;
}

@keyframes shatter {
  0% {
    opacity: 0;
    transform: scale(1);
  }
  20% {
    transform: scale(1.1);
  }
  40% {
    transform: scale(0.95) rotate(-2deg);
  }
  60% {
    transform: scale(1.05) rotate(2deg);
  }
  80% {
    transform: scale(0.98);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.destroyed-text {
  font-size: 24px;
  font-weight: bold;
  color: #ef4444;
  text-shadow: 0 0 20px rgba(239, 68, 68, 0.8);
  animation: destroyedPulse 1.5s ease infinite;
}

@keyframes destroyedPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.city-card.city-destroyed {
  opacity: 0.6;
  border-color: #ef4444;
  box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
}

/* 归顺箭头 */
.surrender-arrow {
  position: absolute;
  top: 50%;
  right: -60px;
  font-size: 48px;
  transform: translateY(-50%);
  animation: arrowMove 1.5s ease-in-out infinite;
  z-index: 15;
}

@keyframes arrowMove {
  0%, 100% {
    transform: translateY(-50%) translateX(0);
    opacity: 1;
  }
  50% {
    transform: translateY(-50%) translateX(20px);
    opacity: 0.5;
  }
}

/* 总攻击力 */
.total-attack {
  text-align: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.06);
  border: 2px solid rgba(212, 160, 23, 0.3);
  border-radius: 10px;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 15px;
}

.attack-value {
  font-size: 28px;
  font-weight: bold;
  color: #f0c850;
  margin-left: 10px;
}

/* VS分隔符 */
.vs-divider {
  display: flex;
  align-items: center;
  justify-content: center;
}

.vs-icon {
  font-size: 48px;
  font-weight: bold;
  color: #fbbf24;
  text-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
  animation: vsRotate 3s ease-in-out infinite;
}

@keyframes vsRotate {
  0%, 100% {
    transform: rotate(0deg) scale(1);
  }
  25% {
    transform: rotate(-5deg) scale(1.1);
  }
  75% {
    transform: rotate(5deg) scale(1.1);
  }
}

/* 继续按钮 */
.continue-button {
  display: block;
  margin: 40px auto 0;
  padding: 16px 48px;
  font-size: 20px;
  font-weight: bold;
  color: white;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 2px solid #047857;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: buttonPulse 2s ease infinite;
}

.continue-button:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
}

@keyframes buttonPulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(16, 185, 129, 0.6);
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .battle-area {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .vs-divider {
    transform: rotate(90deg);
    margin: 20px 0;
  }

  .player-right .city-card {
    animation: cardEnter 0.5s ease;
  }
}

/* 自定义滚动条 */
.battle-animation-container::-webkit-scrollbar {
  width: 10px;
}

.battle-animation-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
}

.battle-animation-container::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
  border-radius: 5px;
}

.battle-animation-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
}
</style>
