<template>
  <div class="game-board">
    <!-- 顶部信息栏 -->
    <div class="game-board__header">
      <div class="game-info">
        <div class="game-info__item">
          <span class="label">回合</span>
          <span class="value">{{ gameStore.currentRound }}</span>
        </div>
        <div class="game-info__item">
          <span class="label">模式</span>
          <span class="value">{{ gameModeText }}</span>
        </div>
      </div>

      <div class="game-actions">
        <button class="btn btn--secondary" @click="$emit('show-log')">
          📋 游戏日志
        </button>
        <button class="btn btn--secondary" @click="$emit('show-skills')">
          ✨ 技能列表
        </button>
        <button class="btn btn--danger" @click="$emit('exit')">
          🚪 退出游戏
        </button>
      </div>
    </div>

    <!-- 玩家面板区域 -->
    <div class="game-board__players" :class="`players--${gameStore.gameMode}`">
      <PlayerPanel
        v-for="(player, index) in gameStore.players"
        :key="index"
        :player="player"
        :is-current-player="isCurrentPlayer(player)"
        :show-actions="isCurrentPlayer(player)"
        :show-city-actions="isCurrentPlayer(player)"
        :hide-opponent-cities="!isCurrentPlayer(player)"
        @city-click="handleCityClick(player, $event)"
      >
        <template #actions>
          <button
            v-if="isCurrentPlayer(player)"
            class="btn btn--primary"
            @click="$emit('use-skill', player)"
          >
            使用技能
          </button>
          <button
            v-if="isCurrentPlayer(player)"
            class="btn btn--success"
            @click="$emit('end-turn', player)"
          >
            结束回合
          </button>
        </template>

        <template #city-actions="{ city, index: cityIndex }">
          <button
            v-if="city.currentHp < city.hp"
            class="btn-small btn-small--heal"
            @click="$emit('heal-city', player, cityIndex)"
          >
            治疗
          </button>
        </template>
      </PlayerPanel>
    </div>

    <!-- 中央战斗区域 (2P模式) -->
    <div v-if="gameStore.gameMode === '2P' && showBattleArea" class="game-board__battle-area">
      <div class="battle-area">
        <div class="battle-area__title">⚔️ 战斗区域 ⚔️</div>
        <div class="battle-area__content">
          <div v-if="currentBattle" class="battle-display">
            <div class="battle-side">
              <span class="battle-player">{{ currentBattle.attacker }}</span>
              <span class="battle-city">{{ currentBattle.attackerCity }}</span>
            </div>
            <div class="battle-vs">VS</div>
            <div class="battle-side">
              <span class="battle-player">{{ currentBattle.defender }}</span>
              <span class="battle-city">{{ currentBattle.defenderCity }}</span>
            </div>
          </div>
          <div v-else class="battle-waiting">
            等待战斗...
          </div>
        </div>
      </div>
    </div>

    <!-- 底部技能快捷栏 (当前玩家) -->
    <div v-if="currentPlayer" class="game-board__quick-skills">
      <div class="quick-skills">
        <div class="quick-skills__title">快捷技能</div>
        <div class="quick-skills__list">
          <button
            v-for="skill in quickSkills"
            :key="skill.name"
            class="quick-skill-btn"
            :disabled="!canUseSkill(skill)"
            @click="$emit('quick-skill', skill)"
          >
            <span class="skill-icon">{{ skill.icon }}</span>
            <span class="skill-name">{{ skill.name }}</span>
            <span class="skill-cost">💰{{ skill.cost }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import PlayerPanel from './PlayerPanel.vue'

const props = defineProps({
  showBattleArea: {
    type: Boolean,
    default: false
  },
  currentBattle: {
    type: Object,
    default: null
  },
  quickSkills: {
    type: Array,
    default: () => [
      { name: '快速治疗', cost: 1, icon: '❤️' },
      { name: '城市保护', cost: 1, icon: '🛡️' },
      { name: '金币贷款', cost: 1, icon: '💰' }
    ]
  }
})

defineEmits(['show-log', 'show-skills', 'exit', 'use-skill', 'end-turn', 'heal-city', 'quick-skill'])

const gameStore = useGameStore()

const gameModeText = computed(() => {
  const modeMap = {
    '2P': '双人对战',
    '3P': '三人混战',
    '2v2': '2v2团战'
  }
  return modeMap[gameStore.gameMode] || gameStore.gameMode
})

const currentPlayer = computed(() => {
  return gameStore.players.find(p => p.name === gameStore.currentPlayer)
})

function isCurrentPlayer(player) {
  return player.name === gameStore.currentPlayer
}

function handleCityClick(player, cityIndex) {
  console.log('City clicked:', player.name, cityIndex)
}

function canUseSkill(skill) {
  if (!currentPlayer.value) return false
  return currentPlayer.value.gold >= skill.cost
}
</script>

<style scoped>
.game-board {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 顶部信息栏 */
.game-board__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.game-info {
  display: flex;
  gap: 32px;
}

.game-info__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.game-info__item .label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.game-info__item .value {
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.game-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.btn--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn--secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
}

.btn--success {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.btn--danger {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
}

/* 玩家面板区域 */
.game-board__players {
  display: grid;
  gap: 20px;
  flex: 1;
}

.players--2P {
  grid-template-columns: repeat(2, 1fr);
}

.players--3P {
  grid-template-columns: repeat(3, 1fr);
}

.players--2v2 {
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
}

/* 战斗区域 */
.game-board__battle-area {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
}

.battle-area {
  background: rgba(0, 0, 0, 0.9);
  border: 3px solid #ffd700;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 0 40px rgba(255, 215, 0, 0.5);
  min-width: 400px;
}

.battle-area__title {
  text-align: center;
  color: #ffd700;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.battle-display {
  display: flex;
  align-items: center;
  gap: 20px;
  color: white;
}

.battle-side {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.battle-player {
  font-size: 18px;
  font-weight: bold;
  color: #ffd700;
}

.battle-city {
  font-size: 16px;
  color: white;
}

.battle-vs {
  font-size: 32px;
  font-weight: bold;
  color: #ff6b6b;
  text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

.battle-waiting {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  padding: 20px;
  font-style: italic;
}

/* 快捷技能栏 */
.game-board__quick-skills {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
}

.quick-skills__title {
  color: white;
  font-size: 14px;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.quick-skills__list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-skill-btn {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.8), rgba(118, 75, 162, 0.8));
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 100px;
}

.quick-skill-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: #ffd700;
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.3);
}

.quick-skill-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-icon {
  font-size: 24px;
}

.skill-name {
  font-size: 12px;
  font-weight: bold;
}

.skill-cost {
  font-size: 11px;
  color: #ffd700;
}

.btn-small {
  padding: 4px 8px;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  font-weight: bold;
}

.btn-small--heal {
  background: #48bb78;
  color: white;
}
</style>
