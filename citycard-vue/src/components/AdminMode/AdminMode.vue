<template>
  <div id="adminMode">
    <button class="exit-btn" @click="$emit('exit')">退出到主菜单</button>

    <header>
      <h1>城市卡牌游戏 - 主持人模式</h1>
      <div class="stack">
        <span class="badge">回合 {{ currentRound }}</span>
        <span class="badge">模式: {{ gameModeText }}</span>
      </div>
    </header>

    <main>
      <!-- 左侧面板 -->
      <div>
        <!-- 游戏设置 -->
        <div class="panel">
          <h2>游戏设置</h2>
          <div class="content">
            <label>玩家数量</label>
            <select v-model="playerCount" :disabled="gameStarted">
              <option value="2">2人</option>
              <option value="3">3人</option>
              <option value="4">4人 (2v2)</option>
            </select>

            <label>每人城市数量</label>
            <input
              v-model.number="citiesPerPlayer"
              type="number"
              min="3"
              max="10"
              :disabled="gameStarted"
            />

            <button
              class="btn btn-primary"
              @click="initGame"
              :disabled="gameStarted"
              style="margin-top: 10px; width: 100%;"
            >
              {{ gameStarted ? '游戏进行中' : '初始化游戏' }}
            </button>

            <button
              v-if="gameStarted"
              class="btn"
              @click="resetGame"
              style="margin-top: 8px; width: 100%;"
            >
              重置游戏
            </button>
          </div>
        </div>

        <!-- 玩家列表 -->
        <div class="panel" style="margin-top: 12px;">
          <h2>玩家列表</h2>
          <div class="content">
            <div v-if="players.length === 0" class="muted">
              请先初始化游戏
            </div>
            <div v-else>
              <div
                v-for="player in players"
                :key="player.name"
                style="margin-bottom: 12px; padding: 10px; background: var(--bg); border-radius: 6px;"
              >
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong>{{ player.name }}</strong>
                  <span class="badge">{{ player.gold }} 金币</span>
                </div>
                <div class="muted" style="margin-top: 4px;">
                  城市: {{ getAliveCities(player).length }}/{{ Object.keys(player.cities).length }}
                  | HP总和: {{ getTotalHp(player) }}
                </div>
                <div style="margin-top: 8px; display: flex; gap: 4px;">
                  <button class="btn" @click="showPlayerCities(player)" style="font-size: 11px; padding: 4px 8px;">
                    查看城市
                  </button>
                  <button class="btn" @click="addGoldToPlayer(player)" style="font-size: 11px; padding: 4px 8px;">
                    +金币
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 回合控制 -->
        <div v-if="gameStarted" class="panel" style="margin-top: 12px;">
          <h2>回合控制</h2>
          <div class="content">
            <button
              class="btn btn-primary"
              @click="nextRound"
              style="width: 100%;"
            >
              下一回合
            </button>

            <button
              class="btn"
              @click="executeBattle"
              style="width: 100%; margin-top: 8px;"
            >
              执行战斗
            </button>

            <div v-if="gameOver" style="margin-top: 12px; padding: 10px; background: var(--good); color: #0f172a; border-radius: 6px; text-align: center;">
              <strong>游戏结束！</strong><br>
              {{ gameOver.winner }} 获胜
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div>
        <!-- 游戏日志 -->
        <div class="panel">
          <h2>游戏日志</h2>
          <div class="content">
            <div class="log scroll">
              <div v-for="(log, index) in gameLogs" :key="index">
                [{{ formatTime(log.timestamp) }}] {{ log.message }}
              </div>
              <div v-if="gameLogs.length === 0" class="muted">
                暂无日志
              </div>
            </div>
          </div>
        </div>

        <!-- 战斗历史 -->
        <div v-if="battleHistory.length > 0" class="panel" style="margin-top: 12px;">
          <h2>战斗历史</h2>
          <div class="content">
            <div class="scroll" style="max-height: 200px;">
              <div
                v-for="(battle, index) in battleHistory"
                :key="index"
                style="margin-bottom: 8px; padding: 8px; background: var(--bg); border-radius: 4px; font-size: 11px;"
              >
                <div><strong>回合{{ battle.round }}</strong></div>
                <div class="muted">
                  {{ battle.attacker }} → {{ battle.defender }}: {{ Math.floor(battle.netDamage) }} 伤害
                </div>
                <div v-if="battle.casualties.length > 0" class="bad">
                  摧毁: {{ battle.casualties.join(', ') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 玩家城市查看模态框 -->
    <div v-if="selectedPlayer" class="modal-backdrop" style="display: flex;" @click.self="selectedPlayer = null">
      <div class="modal" style="max-width: 800px;">
        <h3>{{ selectedPlayer.name }} 的城市</h3>
        <div style="margin-top: 12px;">
          <table class="table">
            <thead>
              <tr>
                <th>城市名</th>
                <th>当前HP</th>
                <th>状态</th>
                <th>技能</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(city, idx) in selectedPlayer.cities" :key="idx">
                <td>{{ city.name }}</td>
                <td>{{ city.currentHp || city.hp }}/{{ city.hp }}</td>
                <td>
                  <span :class="city.isAlive ? 'good' : 'bad'">
                    {{ city.isAlive ? '存活' : '阵亡' }}
                  </span>
                </td>
                <td>
                  <span class="badge">红{{ city.red || 0 }}</span>
                  <span class="badge">绿{{ city.green || 0 }}</span>
                  <span class="badge">蓝{{ city.blue || 0 }}</span>
                  <span class="badge">黄{{ city.yellow || 0 }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="selectedPlayer = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameState } from '../../composables/useGameState'
import { useBattle } from '../../composables/useBattle'
import { initializeCityObject } from '../../utils/cityHelpers'

defineEmits(['exit'])

const {
  isGameStarted,
  currentRound,
  players,
  logs,
  initializeGame,
  nextRound: advanceRound,
  addLog
} = useGameState()

const {
  executeBattleRound,
  battleHistory,
  getAliveCitiesCount,
  checkGameOver,
  resetBattle
} = useBattle()

const playerCount = ref(2)
const citiesPerPlayer = ref(6)
const gameStarted = ref(false)
const selectedPlayer = ref(null)
const gameOver = ref(null)

const gameModeText = computed(() => {
  if (playerCount.value == 2) return '2人对战'
  if (playerCount.value == 3) return '3人混战'
  if (playerCount.value == 4) return '2v2组队'
  return '未知'
})

const gameLogs = computed(() => logs.value)

function initGame() {
  initializeGame(playerCount.value, citiesPerPlayer.value)

  // 初始化城市对象
  players.value.forEach(player => {
    player.cities = Object.values(player.cities).map(city => initializeCityObject(city))
  })

  gameStarted.value = true
  gameOver.value = null
  addLog('游戏开始！')
}

function resetGame() {
  gameStarted.value = false
  gameOver.value = null
  resetBattle()
  addLog('游戏已重置')
}

function nextRound() {
  advanceRound()

  // 检查游戏是否结束
  const result = checkGameOver()
  if (result) {
    gameOver.value = result
    addLog(`游戏结束！${result.winner} 获胜！`)
  }
}

function executeBattle() {
  const results = executeBattleRound()

  // 检查游戏是否结束
  const gameOverResult = checkGameOver()
  if (gameOverResult) {
    gameOver.value = gameOverResult
  }
}

function getAliveCities(player) {
  return Object.values(player.cities).filter(c => c.isAlive !== false)
}

function getTotalHp(player) {
  return player.cities
    .filter(c => c.isAlive !== false)
    .reduce((sum, c) => sum + (c.currentHp || c.hp), 0)
}

function showPlayerCities(player) {
  selectedPlayer.value = player
}

function addGoldToPlayer(player) {
  player.gold += 3
  addLog(`${player.name} 获得了 3 金币`)
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}
</script>

<style scoped>
#adminMode {
  min-height: 100vh;
}
</style>
