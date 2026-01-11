<template>
  <div class="skill-effects-display">
    <h3>技能效果</h3>

    <div class="effects-container">
      <!-- 玩家列表 -->
      <div
        v-for="player in players"
        :key="player.name"
        class="player-effects"
      >
        <h4 class="player-name">{{ player.name }}</h4>

        <!-- 屏障状态 -->
        <div v-if="getBarrier(player.name)" class="effect-item barrier">
          <div class="effect-icon">🔰</div>
          <div class="effect-content">
            <div class="effect-name">屏障</div>
            <div class="effect-value">
              HP: {{ getBarrier(player.name).hp }} / {{ getBarrier(player.name).maxHp }}
              ({{ getBarrier(player.name).roundsLeft }}回合)
            </div>
            <div class="effect-progress">
              <div
                class="progress-bar"
                :style="{ width: getBarrierPercent(player.name) + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <!-- 坚不可摧护盾 -->
        <div v-if="getJianbukecui(player.name)" class="effect-item shield">
          <div class="effect-icon">🛡️</div>
          <div class="effect-content">
            <div class="effect-name">坚不可摧</div>
            <div class="effect-value">
              剩余{{ getJianbukecui(player.name).roundsLeft }}回合
            </div>
          </div>
        </div>

        <!-- 金融危机 -->
        <div v-if="gameStore.financialCrisis" class="effect-item crisis">
          <div class="effect-icon">📉</div>
          <div class="effect-content">
            <div class="effect-name">金融危机</div>
            <div class="effect-value">
              全局效果，剩余{{ gameStore.financialCrisis.roundsLeft }}回合
            </div>
          </div>
        </div>

        <!-- 城市效果 -->
        <div class="cities-effects">
          <div
            v-for="(city, idx) in player.cities"
            :key="idx"
            class="city-effect"
            :class="{ dead: city.isAlive === false }"
          >
            <div class="city-name">
              <span v-if="city.isCenter">👑</span>
              {{ getCityDisplayName(player.name, idx, city) }}
            </div>

            <div class="city-hp">
              <span class="hp-current">{{ Math.floor(city.currentHp || city.hp) }}</span>
              <span class="hp-max">/ {{ Math.floor(city.hp) }}</span>
              <div class="hp-bar">
                <div
                  class="hp-fill"
                  :style="{ width: getHpPercent(city) + '%' }"
                  :class="getHpColorClass(city)"
                ></div>
              </div>
            </div>

            <!-- 城市保护 -->
            <div
              v-if="getCityProtection(player.name, idx)"
              class="city-buff protection"
            >
              🛡️ 保护 ({{ getCityProtection(player.name, idx) }}回合)
            </div>

            <!-- 钢铁护盾 -->
            <div
              v-if="getIronShield(player.name, idx)"
              class="city-buff iron"
            >
              🏰 钢铁城市
            </div>

            <!-- 定海神针 -->
            <div
              v-if="getAnchored(player.name, idx)"
              class="city-buff anchor"
            >
              ⚓ 定海神针 ({{ getAnchored(player.name, idx) }}回合)
            </div>

            <!-- 狐假虎威伪装 -->
            <div
              v-if="getDisguise(player.name, idx)"
              class="city-buff disguise"
            >
              🦊 伪装 ({{ getDisguise(player.name, idx).roundsLeft }}回合)
            </div>

            <!-- 生于紫室 -->
            <div
              v-if="isPurpleChamber(player.name, idx)"
              class="city-buff purple"
            >
              👑 生于紫室 (攻击×2)
            </div>

            <!-- 厚积薄发 -->
            <div
              v-if="getHouJiBaoFa(player.name, idx)"
              class="city-buff hjbf"
            >
              💪 厚积薄发 ({{ getHouJiBaoFa(player.name, idx).roundsLeft }}回合)
            </div>

            <!-- 天灾人祸 -->
            <div
              v-if="getDisaster(player.name, idx)"
              class="city-debuff disaster"
            >
              ⚠️ 天灾人祸 ({{ getDisaster(player.name, idx) }}回合)
            </div>
          </div>
        </div>

        <!-- 战斗modifiers -->
        <div v-if="player.battleModifiers && player.battleModifiers.length > 0" class="battle-modifiers">
          <div class="modifiers-title">战斗效果</div>
          <div
            v-for="(modifier, idx) in player.battleModifiers"
            :key="idx"
            class="modifier-item"
          >
            <span class="modifier-icon">{{ getModifierIcon(modifier.type) }}</span>
            <span class="modifier-text">{{ getModifierText(modifier) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 全局效果 -->
    <div v-if="hasGlobalEffects" class="global-effects">
      <h4>全局效果</h4>

      <div v-if="gameStore.financialCrisis" class="global-effect-item">
        📉 金融危机: 金币收入受限 ({{ gameStore.financialCrisis.roundsLeft }}回合)
      </div>

      <div v-if="Object.keys(gameStore.yswq || {}).length > 0" class="global-effect-item">
        💎 玉碎瓦全: {{ getYswqText() }}
      </div>

      <div v-if="Object.keys(gameStore.chhdj || {}).length > 0" class="global-effect-item">
        🔥 趁火打劫: {{ getChhdjText() }}
      </div>
    </div>

    <!-- 日志显示 -->
    <div class="skill-logs">
      <h4>技能日志</h4>
      <div class="log-container">
        <div
          v-for="(log, idx) in recentLogs"
          :key="idx"
          class="log-entry"
        >
          <span class="log-time">{{ formatTime(log.timestamp) }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'

const props = defineProps({
  players: {
    type: Array,
    required: true
  },
  maxLogs: {
    type: Number,
    default: 10
  }
})

const gameStore = useGameStore()

// 屏障相关
function getBarrier(playerName) {
  return gameStore.barrier?.[playerName]
}

function getBarrierPercent(playerName) {
  const barrier = getBarrier(playerName)
  if (!barrier) return 0
  return (barrier.hp / barrier.maxHp) * 100
}

// 坚不可摧
function getJianbukecui(playerName) {
  return gameStore.jianbukecui?.[playerName]
}

// 城市保护
function getCityProtection(playerName, cityIdx) {
  return gameStore.protections?.[playerName]?.[cityIdx]
}

// 钢铁护盾
function getIronShield(playerName, cityIdx) {
  return gameStore.ironShields?.[playerName]?.[cityIdx]
}

// 定海神针
function getAnchored(playerName, cityIdx) {
  return gameStore.anchored?.[playerName]?.[cityIdx]
}

// 狐假虎威
function getDisguise(playerName, cityIdx) {
  return gameStore.disguisedCities?.[playerName]?.[cityIdx]
}

function getCityDisplayName(playerName, cityIdx, city) {
  const disguise = getDisguise(playerName, cityIdx)
  if (disguise) {
    return `${city.name} (伪装为: ${disguise.fakeName})`
  }
  return city.name
}

// 生于紫室
function isPurpleChamber(playerName, cityIdx) {
  return gameStore.purpleChamber?.[playerName] === cityIdx
}

// 厚积薄发
function getHouJiBaoFa(playerName, cityIdx) {
  return gameStore.hjbf?.[playerName]?.[cityIdx]
}

// 天灾人祸
function getDisaster(playerName, cityIdx) {
  return gameStore.disaster?.[playerName]?.[cityIdx]
}

// HP百分比
function getHpPercent(city) {
  const current = city.currentHp || city.hp
  const max = city.hp
  return (current / max) * 100
}

function getHpColorClass(city) {
  const percent = getHpPercent(city)
  if (percent >= 75) return 'hp-high'
  if (percent >= 40) return 'hp-medium'
  return 'hp-low'
}

// Modifier相关
function getModifierIcon(type) {
  const icons = {
    'attack_priority': '🎯',
    'damage_reduction': '🛡️',
    'ignore_fatigue': '💪',
    'attract_damage': '🧲',
    'damage_immunity': '✨',
    'power_multiplier': '⚡',
    'suicide_attack': '💥',
    'mutual_destruction': '☠️',
    'no_deploy': '🚫',
    'berserk': '😡'
  }
  return icons[type] || '❓'
}

function getModifierText(modifier) {
  const texts = {
    'attack_priority': '优先攻击最高HP',
    'damage_reduction': `伤害减半×${modifier.value}`,
    'ignore_fatigue': '忽略疲劳',
    'attract_damage': '吸引所有伤害',
    'damage_immunity': '完全免疫伤害',
    'power_multiplier': `攻击力×${modifier.value}`,
    'suicide_attack': '背水一战',
    'mutual_destruction': '同归于尽',
    'no_deploy': '按兵不动',
    'berserk': '狂暴模式×5'
  }
  return texts[modifier.type] || modifier.type
}

// 全局效果
const hasGlobalEffects = computed(() => {
  return gameStore.financialCrisis ||
         Object.keys(gameStore.yswq || {}).length > 0 ||
         Object.keys(gameStore.chhdj || {}).length > 0
})

function getYswqText() {
  const entries = Object.entries(gameStore.yswq || {})
  if (entries.length === 0) return ''
  const [player, data] = entries[0]
  return `${player} 对目标使用`
}

function getChhdjText() {
  const entries = Object.entries(gameStore.chhdj || {})
  if (entries.length === 0) return ''
  const [player, data] = entries[0]
  return `${player} 对 ${data.target} 使用`
}

// 日志
const recentLogs = computed(() => {
  return (gameStore.logs || []).slice(-props.maxLogs).reverse()
})

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN')
}
</script>

<style scoped>
.skill-effects-display {
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
  max-height: 800px;
  overflow-y: auto;
}

.skill-effects-display h3 {
  margin: 0 0 20px 0;
  font-size: 24px;
  color: #333;
}

.effects-container {
  display: grid;
  gap: 20px;
  margin-bottom: 20px;
}

.player-effects {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.player-name {
  margin: 0 0 15px 0;
  font-size: 18px;
  color: #4CAF50;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 8px;
}

.effect-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 6px;
  background: #f0f8ff;
}

.effect-item.barrier {
  background: #e8f5e9;
  border-left: 4px solid #4CAF50;
}

.effect-item.shield {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
}

.effect-item.crisis {
  background: #ffebee;
  border-left: 4px solid #f44336;
}

.effect-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.effect-content {
  flex: 1;
}

.effect-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  color: #333;
}

.effect-value {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.effect-progress {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  transition: width 0.3s ease;
}

.cities-effects {
  margin-top: 15px;
}

.city-effect {
  padding: 10px;
  margin-bottom: 10px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.city-effect.dead {
  opacity: 0.5;
  background: #f5f5f5;
}

.city-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 8px;
  color: #333;
}

.city-hp {
  margin-bottom: 8px;
}

.hp-current {
  font-weight: bold;
  font-size: 15px;
  color: #4CAF50;
}

.hp-max {
  font-size: 13px;
  color: #999;
  margin-left: 4px;
}

.hp-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  margin-top: 4px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.hp-high {
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
}

.hp-medium {
  background: linear-gradient(90deg, #FFC107, #FFD54F);
}

.hp-low {
  background: linear-gradient(90deg, #F44336, #EF5350);
}

.city-buff, .city-debuff {
  display: inline-block;
  padding: 4px 8px;
  margin: 4px 4px 0 0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.city-buff {
  background: #e8f5e9;
  color: #2e7d32;
}

.city-debuff {
  background: #ffebee;
  color: #c62828;
}

.battle-modifiers {
  margin-top: 15px;
  padding: 10px;
  background: #fff8e1;
  border-radius: 6px;
}

.modifiers-title {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 8px;
  color: #f57c00;
}

.modifier-item {
  padding: 6px;
  margin-bottom: 4px;
  font-size: 13px;
}

.modifier-icon {
  margin-right: 8px;
}

.global-effects {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.global-effects h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #f57c00;
}

.global-effect-item {
  padding: 8px;
  margin-bottom: 8px;
  background: #fff3e0;
  border-left: 3px solid #ff9800;
  border-radius: 4px;
  font-size: 14px;
}

.skill-logs {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.skill-logs h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #666;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
}

.log-entry {
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}

.log-time {
  color: #999;
  margin-right: 10px;
  font-size: 12px;
}

.log-message {
  color: #555;
}
</style>
