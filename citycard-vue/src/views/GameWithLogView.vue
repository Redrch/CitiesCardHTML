<template>
  <div class="game-with-log-layout">
    <!-- 左侧游戏主界面区域 -->
    <div class="game-main-area">
      <GameBoard
        :current-player="currentPlayer"
        :show-battle-area="true"
        :current-battle="currentBattle"
        @show-log="showLogModal = true"
        @show-skills="showSkillsModal = true"
        @exit="handleExit"
        @use-skill="handleUseSkill"
        @end-turn="handleEndTurn"
        @heal-city="handleHealCity"
        @city-click="handleCityClick"
      />
    </div>

    <!-- 右侧固定日志面板 -->
    <div class="game-log-area">
      <GameLogFixed />
    </div>

    <!-- 游戏日志模态框 (备用，按钮触发) -->
    <GameLog
      v-if="showLogModal"
      :show="showLogModal"
      @close="showLogModal = false"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import GameBoard from '../components/Game/GameBoard.vue'
import GameLogFixed from '../components/Game/GameLogFixed.vue'
import GameLog from '../components/Game/GameLog.vue'

const gameStore = useGameStore()

const showLogModal = ref(false)
const showSkillsModal = ref(false)
const currentBattle = ref(null)

const currentPlayer = computed(() => {
  // 获取当前玩家
  return gameStore.players[0] || null
})

function handleExit() {
  if (confirm('确定要退出游戏吗？')) {
    // 退出逻辑
    console.log('退出游戏')
  }
}

function handleUseSkill(player) {
  console.log('使用技能', player)
}

function handleEndTurn(player) {
  console.log('结束回合', player)
  gameStore.nextRound()
}

function handleHealCity(player, cityName) {
  console.log('治疗城市', player, cityName)
}

function handleCityClick(player, cityName) {
  console.log('点击城市', player, cityName)
}
</script>

<style scoped>
.game-with-log-layout {
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 20px;
  height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  overflow: hidden;
}

.game-main-area {
  overflow-y: auto;
  overflow-x: hidden;
}

.game-log-area {
  height: 100%;
  overflow: hidden;
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .game-with-log-layout {
    grid-template-columns: 1fr 400px;
  }
}

@media (max-width: 1024px) {
  .game-with-log-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }

  .game-log-area {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .game-with-log-layout {
    padding: 10px;
    gap: 10px;
  }

  .game-log-area {
    height: 250px;
  }
}

/* 自定义滚动条 */
.game-main-area::-webkit-scrollbar {
  width: 10px;
}

.game-main-area::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

.game-main-area::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
  border-radius: 5px;
}

.game-main-area::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
}
</style>
