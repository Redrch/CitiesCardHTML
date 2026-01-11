<template>
  <div id="playerMode">
    <!-- 游戏未开始：设置界面 -->
    <div v-if="!gameStarted" class="player-setup">
      <button class="exit-btn" @click="$emit('exit')">← 返回主菜单</button>

      <div class="setup-container">
        <h2 class="setup-title">🎮 对战模式</h2>

        <!-- 玩家信息输入 -->
        <div class="setup-section">
          <label class="setup-label">输入你的昵称</label>
          <input
            v-model="nickname"
            type="text"
            class="nickname-input"
            placeholder="请输入昵称..."
            maxlength="10"
            @keyup.enter="nickname.trim() && !drawnCities.length && drawInitialCities()"
          />
        </div>

        <!-- 游戏模式选择 -->
        <div class="setup-section">
          <label class="setup-label">选择游戏模式</label>
          <div class="mode-select">
            <button
              class="mode-btn"
              :class="{ 'mode-btn--active': selectedMode === '2P' }"
              @click="selectedMode = '2P'"
            >
              <span class="mode-icon">👥</span>
              <span class="mode-name">双人对战</span>
            </button>
            <button
              class="mode-btn"
              :class="{ 'mode-btn--active': selectedMode === '3P' }"
              @click="selectedMode = '3P'"
            >
              <span class="mode-icon">👥👤</span>
              <span class="mode-name">三人混战</span>
            </button>
            <button
              class="mode-btn"
              :class="{ 'mode-btn--active': selectedMode === '2v2' }"
              @click="selectedMode = '2v2'"
            >
              <span class="mode-icon">👥⚔️👥</span>
              <span class="mode-name">2v2团战</span>
            </button>
          </div>
        </div>

        <!-- 抽卡按钮 -->
        <div v-if="!drawnCities.length" class="setup-section">
          <button
            class="draw-btn"
            :disabled="!nickname.trim()"
            @click="drawInitialCities"
          >
            🎲 抽取初始城市
          </button>
        </div>

        <!-- 城市预览 -->
        <div v-if="drawnCities.length > 0" class="cities-preview">
          <h3 class="preview-title">你的城市 ({{ drawnCities.length }}个)</h3>
          <div class="cities-grid">
            <CityCard
              v-for="(city, index) in drawnCities"
              :key="index"
              :city="city"
            />
          </div>

          <div class="confirm-actions">
            <button class="confirm-btn" @click="confirmCities">
              ✅ 确认并开始游戏
            </button>
            <button class="reroll-btn" @click="drawInitialCities">
              🔄 重新抽取
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏进行中：主游戏界面（带固定日志面板） -->
    <div v-else class="game-with-log-layout">
      <!-- 左侧：游戏主界面 -->
      <div class="game-main-area">
        <GameBoard
          :show-battle-area="false"
          :current-battle="null"
          @show-skills="showSkillSelector = true"
          @exit="handleExit"
          @use-skill="handleUseSkill"
          @end-turn="handleEndTurn"
          @heal-city="handleHealCity"
          @quick-skill="handleQuickSkill"
        />
      </div>

      <!-- 右侧：固定日志面板 -->
      <div class="game-log-area">
        <GameLogFixed />
      </div>
    </div>

    <!-- 技能选择模态框 -->
    <SkillSelector
      v-if="showSkillSelector"
      :current-player="currentPlayer"
      @close="showSkillSelector = false"
      @skill-selected="handleSkillSelected"
    />

    <!-- 胜利/失败模态框 -->
    <div v-if="showVictory && gameLogic.isGameOver.value" class="victory-modal" @click.self="handleExit">
      <div class="victory-content">
        <div class="victory-animation">
          <div class="trophy">🏆</div>
          <div class="fireworks">✨🎉✨</div>
        </div>
        <h2 class="victory-title">
          {{ gameLogic.winner.value?.name }} 获得胜利！
        </h2>
        <div class="victory-stats">
          <div class="stat-item">
            <span class="stat-label">总回合数</span>
            <span class="stat-value">{{ gameStore.currentRound }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">剩余金币</span>
            <span class="stat-value">{{ gameLogic.winner.value?.gold || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">存活城市</span>
            <span class="stat-value">
              {{ gameLogic.winner.value?.cities?.filter(c => c.isAlive).length || 0 }}
            </span>
          </div>
        </div>
        <div class="victory-actions">
          <button class="victory-btn victory-btn--restart" @click="restartGame">
            🔄 再来一局
          </button>
          <button class="victory-btn victory-btn--exit" @click="handleExit">
            🏠 返回主菜单
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useGameLogic } from '../../composables/game/useGameLogic'
import { ALL_CITIES } from '../../data/cities'
import GameBoard from '../Game/GameBoard.vue'
import CityCard from '../Game/CityCard.vue'
import GameLogFixed from '../Game/GameLogFixed.vue'
import SkillSelector from '../Skills/SkillSelector.vue'

const emit = defineEmits(['exit'])

const gameStore = useGameStore()
const gameLogic = useGameLogic()

const nickname = ref('')
const selectedMode = ref('2P')
const drawnCities = ref([])
const gameStarted = ref(false)
const showSkillSelector = ref(false)
const showVictory = ref(false)

const currentPlayer = computed(() => {
  return gameLogic.currentPlayer.value
})

function drawInitialCities() {
  // 随机抽取10个城市（原版配置）
  const shuffled = [...ALL_CITIES].sort(() => 0.5 - Math.random())
  drawnCities.value = shuffled.slice(0, 10).map((city, index) => ({
    name: city.name,
    hp: city.hp,
    currentHp: city.hp,
    baseHp: city.hp,
    isCenter: index === 0,
    isAlive: true,
    red: city.red || 0,
    green: city.green || 0,
    blue: city.blue || 0,
    yellow: city.yellow || 0,
    province: city.province
  }))
}

function confirmCities() {
  if (!nickname.value.trim() || drawnCities.value.length === 0) {
    return
  }

  // 使用游戏逻辑管理器初始化游戏
  gameLogic.initializeGame(nickname.value, selectedMode.value, drawnCities.value)
  gameStarted.value = true
}

function handleExit() {
  if (confirm('确定要退出游戏吗？')) {
    gameLogic.resetGame()
    gameStarted.value = false
    drawnCities.value = []
    showVictory.value = false
    emit('exit')
  }
}

function handleUseSkill(player) {
  showSkillSelector.value = true
}

function handleEndTurn(player) {
  gameLogic.endTurn()

  // 检查游戏是否结束
  if (gameLogic.isGameOver.value) {
    showVictory.value = true
  }
}

function handleHealCity(player, cityIndex) {
  const result = gameLogic.healCity(player, cityIndex)
  if (!result.success) {
    alert(result.message)
  }
}

function handleQuickSkill(skill) {
  // 根据技能名称执行相应操作
  const target = gameStore.players.find(p => p.name !== currentPlayer.value?.name)

  if (skill.name === '快速治疗') {
    const injuredCity = currentPlayer.value.cities.find(c => c.isAlive && c.currentHp < c.hp)
    if (injuredCity) {
      handleHealCity(currentPlayer.value, currentPlayer.value.cities.indexOf(injuredCity))
    } else {
      alert('没有受伤的城市需要治疗')
    }
  } else if (skill.name === '城市保护') {
    const centerCity = currentPlayer.value.cities.find(c => c.isCenter && c.isAlive)
    if (centerCity) {
      const result = gameLogic.useSkill('城市保护', [centerCity])
      if (!result.success) {
        alert(result.message)
      }
    }
  } else if (skill.name === '金币贷款') {
    const result = gameLogic.useSkill('金币贷款', [])
    if (!result.success) {
      alert(result.message)
    }
  }
}

function handleSkillSelected(skillData) {
  console.log('Skill selected:', skillData)
  showSkillSelector.value = false

  if (!skillData || !skillData.skill) return

  // TODO: 根据不同技能处理不同的参数
  // 这里需要根据技能类型显示不同的参数选择界面
  const result = gameLogic.useSkill(skillData.skill.name, skillData.params || [])

  if (!result.success) {
    alert(result.message || '技能使用失败')
  }
}

function restartGame() {
  showVictory.value = false
  gameStarted.value = false
  drawnCities.value = []
  gameLogic.resetGame()
}
</script>

<style scoped>
#playerMode {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
}

.player-setup {
  min-height: 100vh;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.exit-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.exit-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-4px);
}

.setup-container {
  max-width: 900px;
  width: 100%;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.setup-title {
  text-align: center;
  color: white;
  font-size: 36px;
  margin: 0 0 40px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.setup-section {
  margin-bottom: 32px;
}

.setup-label {
  display: block;
  color: white;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.nickname-input {
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 18px;
  transition: all 0.3s ease;
}

.nickname-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
}

.nickname-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.mode-select {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.mode-btn {
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-4px);
}

.mode-btn--active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.mode-icon {
  font-size: 32px;
}

.mode-name {
  font-size: 14px;
  font-weight: bold;
}

.draw-btn {
  width: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.draw-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(102, 126, 234, 0.4);
}

.draw-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cities-preview {
  margin-top: 32px;
}

.preview-title {
  color: white;
  font-size: 20px;
  margin-bottom: 20px;
  text-align: center;
}

.cities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.confirm-actions {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
}

.confirm-btn,
.reroll-btn {
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(72, 187, 120, 0.4);
}

.reroll-btn {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.reroll-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 胜利模态框 */
.victory-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.victory-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  text-align: center;
  max-width: 500px;
  width: 90%;
  animation: slideInScale 0.5s ease;
}

@keyframes slideInScale {
  from {
    transform: translateY(-50px) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.victory-animation {
  margin-bottom: 24px;
}

.trophy {
  font-size: 80px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.fireworks {
  font-size: 32px;
  margin-top: 16px;
  animation: sparkle 2s ease infinite;
}

@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.victory-title {
  color: white;
  font-size: 36px;
  margin: 0 0 32px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  font-weight: bold;
}

.victory-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.stat-value {
  color: #ffd700;
  font-size: 28px;
  font-weight: bold;
}

.victory-actions {
  display: flex;
  gap: 16px;
}

.victory-btn {
  flex: 1;
  padding: 16px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

.victory-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.victory-btn--restart {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
}

.victory-btn--exit {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
}

/* 游戏主界面布局（带固定日志面板） */
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
  border-radius: 16px;
}

.game-log-area {
  height: 100%;
  overflow: hidden;
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
</style>
