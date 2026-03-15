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

        <template #city-actions="{ city, index: cityName }">
          <button
            v-if="city.currentHp < city.hp"
            class="btn-small btn-small--heal"
            @click="$emit('heal-city', player, cityName)"
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

function handleCityClick(player, cityName) {
  console.log('City clicked:', player.name, cityName)
}

function canUseSkill(skill) {
  if (!currentPlayer.value) return false
  return currentPlayer.value.gold >= skill.cost
}
</script>

<style scoped>
.game-board {
  min-height: 100vh;
  background: linear-gradient(150deg, #2a2340 0%, #1e2a4a 30%, #2a3a5c 60%, #3a2a4a 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}

/* Subtle battlefield texture overlay */
.game-board::before {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 40px,
    rgba(255, 255, 255, 0.02) 40px,
    rgba(255, 255, 255, 0.02) 41px
  ),
  repeating-linear-gradient(
    90deg,
    transparent,
    transparent 40px,
    rgba(255, 255, 255, 0.02) 40px,
    rgba(255, 255, 255, 0.02) 41px
  );
  pointer-events: none;
  z-index: 0;
}

.game-board > * {
  position: relative;
  z-index: 1;
}

/* 顶部信息栏 */
.game-board__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-top: 3px solid #d4a017;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
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
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.game-info__item .value {
  color: rgba(255, 255, 255, 0.95);
  font-size: 24px;
  font-weight: bold;
}

.game-actions {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border: 2px solid transparent;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.95);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.3);
}

.btn--primary {
  background: linear-gradient(135deg, #d4a017 0%, #b8860b 100%);
  border-color: #a67c00;
  color: white;
}

.btn--secondary {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.btn--success {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  border-color: #2f855a;
  color: white;
}

.btn--danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-color: #b91c1c;
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
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border: 3px solid #d4a017;
  outline: 2px solid rgba(212, 160, 23, 0.2);
  outline-offset: 3px;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 0 50px rgba(212, 160, 23, 0.3), 0 20px 60px rgba(0, 0, 0, 0.4);
  min-width: 400px;
  animation: battleGlow 2s ease-in-out infinite alternate;
}

@keyframes battleGlow {
  from { box-shadow: 0 0 40px rgba(212, 160, 23, 0.25), 0 20px 60px rgba(0, 0, 0, 0.4); }
  to { box-shadow: 0 0 60px rgba(212, 160, 23, 0.4), 0 20px 60px rgba(0, 0, 0, 0.4); }
}

.battle-area__title {
  text-align: center;
  color: #d4a017;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(212, 160, 23, 0.3);
}

.battle-display {
  display: flex;
  align-items: center;
  gap: 20px;
  color: rgba(255, 255, 255, 0.95);
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
  color: #d4a017;
}

.battle-city {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.85);
}

.battle-vs {
  font-size: 32px;
  font-weight: bold;
  color: #c0392b;
  text-shadow: 0 2px 8px rgba(192, 57, 43, 0.3);
}

.battle-waiting {
  text-align: center;
  color: rgba(255, 255, 255, 0.45);
  padding: 20px;
  font-style: italic;
}

/* 快捷技能栏 */
.game-board__quick-skills {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-top: 3px solid rgba(212, 160, 23, 0.4);
}

.quick-skills__title {
  color: rgba(255, 255, 255, 0.45);
  font-size: 14px;
  font-weight: 700;
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
  background: linear-gradient(135deg, rgba(74, 90, 138, 0.85), rgba(107, 91, 138, 0.85));
  border: 2px solid rgba(212, 160, 23, 0.3);
  border-radius: 10px;
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
  transform: translateY(-3px);
  border-color: #d4a017;
  box-shadow: 0 4px 16px rgba(212, 160, 23, 0.3);
  background: linear-gradient(135deg, rgba(74, 90, 138, 0.95), rgba(107, 91, 138, 0.95));
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
  color: #f0c850;
}

.btn-small {
  padding: 4px 8px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  font-weight: bold;
}

.btn-small--heal {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  border-color: #2f855a;
  color: white;
}
</style>
