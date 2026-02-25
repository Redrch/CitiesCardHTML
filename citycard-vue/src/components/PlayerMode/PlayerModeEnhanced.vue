<template>
  <div id="playerMode">
    <button class="exit-btn" @click="$emit('exit')">退出到主菜单</button>

    <div class="player-container">
      <!-- 阶段1: 设置 -->
      <div v-if="stage === 'setup'" class="player-setup">
        <h2 style="text-align: center; color: var(--accent);">对战模式</h2>

        <div class="panel" style="margin-top: 20px;">
          <h2>游戏设置</h2>
          <div class="content">
            <label>输入你的昵称</label>
            <input
              v-model="nickname"
              type="text"
              class="player-nickname-input"
              placeholder="请输入昵称..."
              @keyup.enter="stage = 'draw'"
            />

            <label style="margin-top: 12px;">选择游戏模式</label>
            <select v-model="gameMode">
              <option value="offline">单机练习</option>
              <option value="online">在线匹配（开发中）</option>
            </select>

            <button
              class="btn btn-primary"
              :disabled="!nickname.trim()"
              @click="startSetup"
              style="margin-top: 16px; width: 100%;"
            >
              开始游戏
            </button>
          </div>
        </div>
      </div>

      <!-- 阶段2: 抽取城市 -->
      <div v-else-if="stage === 'draw'" class="player-setup">
        <h2 style="text-align: center; color: var(--accent);">抽取初始城市</h2>

        <div class="panel" style="margin-top: 20px;">
          <h2>玩家信息</h2>
          <div class="content">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>{{ nickname }}</strong>
                <div class="muted">准备抽取 {{ cityCount }} 个城市</div>
              </div>
              <div class="badge" style="font-size: 16px;">{{ gold }} 金币</div>
            </div>
          </div>
        </div>

        <div class="panel" style="margin-top: 12px;">
          <h2>城市数量</h2>
          <div class="content">
            <input
              v-model.number="cityCount"
              type="number"
              min="3"
              max="10"
              style="width: 100%;"
            />
          </div>
        </div>

        <button
          class="draw-cards-btn"
          @click="drawInitialCities"
        >
          开始抽卡
        </button>

        <!-- 抽到的城市 -->
        <div v-if="myCities.length > 0" class="city-preview" style="margin-top: 20px;">
          <h3>你的城市 ({{ myCities.length }}个)</h3>

          <div
            v-for="(city, index) in myCities"
            :key="index"
            class="city-card"
            :class="{ 'city-selected': selectedCenter === index }"
            @click="selectedCenter = index"
          >
            <div>
              <strong>{{ city.name }}</strong>
              <div class="muted" style="font-size: 11px;">
                {{ getProvinceName(city.name) }}
              </div>
            </div>
            <div>
              <div>HP: {{ city.hp }}</div>
              <div class="muted" style="font-size: 10px;">
                战力: {{ calculateCityPower(city) }}
              </div>
            </div>
            <div>
              <span class="badge">红{{ city.red || 0 }}</span>
              <span class="badge">绿{{ city.green || 0 }}</span>
              <span class="badge">蓝{{ city.blue || 0 }}</span>
            </div>
          </div>

          <div v-if="selectedCenter !== null" class="muted" style="text-align: center; margin: 12px 0;">
            已选择 <strong>{{ myCities[selectedCenter].name }}</strong> 作为中心城市
          </div>

          <button
            class="confirm-cities-btn"
            :disabled="selectedCenter === null"
            @click="confirmCities"
          >
            确认城市并开始游戏
          </button>
        </div>
      </div>

      <!-- 阶段3: 游戏中 -->
      <div v-else-if="stage === 'playing'" class="player-game">
        <div class="player-header">
          <div class="player-info">
            <h2>{{ nickname }}</h2>
            <div class="stack">
              <span class="badge">回合 {{ currentRound }}</span>
              <span class="badge">{{ gold }} 金币</span>
              <span class="badge">城市 {{ aliveCities.length }}/{{ myCities.length }}</span>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 12px;">
          <!-- 左侧：我的城市 -->
          <div>
            <div class="panel">
              <h2>我的城市</h2>
              <div class="content">
                <div class="scroll" style="max-height: 400px;">
                  <div
                    v-for="(city, index) in myCities"
                    :key="index"
                    class="city-card"
                    :class="{ 'city-dead': !city.isAlive }"
                    style="margin-bottom: 8px;"
                  >
                    <div>
                      <strong>{{ city.name }}</strong>
                      <div class="muted" style="font-size: 10px;">
                        {{ index === centerCityIndex ? '【中心】' : '' }}
                        {{ city.isFatigued ? '疲劳' : '' }}
                      </div>
                    </div>
                    <div>
                      <div>{{ city.currentHp || city.hp }}/{{ city.hp }}</div>
                      <div class="muted" style="font-size: 10px;">
                        战力: {{ calculateCityPower(city) }}
                      </div>
                    </div>
                    <div>
                      <span class="badge">红{{ city.red || 0 }}</span>
                      <span class="badge">绿{{ city.green || 0 }}</span>
                      <span class="badge">蓝{{ city.blue || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 技能面板 -->
            <div class="panel" style="margin-top: 12px;">
              <h2>可用技能</h2>
              <div class="content">
                <div style="margin-bottom: 8px;">
                  <button
                    class="btn"
                    :class="{ 'btn-primary': skillFilter === 'battle' }"
                    @click="skillFilter = 'battle'"
                    style="margin-right: 4px;"
                  >
                    战斗
                  </button>
                  <button
                    class="btn"
                    :class="{ 'btn-primary': skillFilter === 'nonBattle' }"
                    @click="skillFilter = 'nonBattle'"
                  >
                    非战斗
                  </button>
                </div>

                <div class="scroll" style="max-height: 200px;">
                  <div
                    v-for="skill in filteredSkillList"
                    :key="skill.name"
                    class="skill-item-mini"
                    :class="{ 'skill-disabled': !canUseSkillNow(skill) }"
                  >
                    <div style="display: flex; justify-content: space-between;">
                      <strong style="font-size: 11px;">{{ skill.name }}</strong>
                      <span class="badge">{{ skill.cost }}</span>
                    </div>
                    <div class="muted" style="font-size: 9px; margin-top: 2px;">
                      {{ getSkillStatusText(skill) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：游戏日志 -->
          <div>
            <div class="panel">
              <h2>游戏日志</h2>
              <div class="content">
                <div class="log scroll" style="max-height: 600px;">
                  <div v-for="(log, index) in gameLogs" :key="index">
                    {{ log }}
                  </div>
                  <div v-if="gameLogs.length === 0" class="muted">
                    暂无日志
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div style="padding: 12px; background: var(--panel); border-top: 1px solid #1f2937;">
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn" @click="showCityDetail = true">查看详情</button>
            <button class="btn btn-primary" @click="nextTurn">结束回合</button>
            <button class="btn" @click="showGameMenu = true">游戏菜单</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏菜单模态框 -->
    <div v-if="showGameMenu" class="modal-backdrop" style="display: flex;" @click.self="showGameMenu = false">
      <div class="modal">
        <h3>游戏菜单</h3>
        <div style="margin-top: 16px;">
          <button class="btn" @click="saveGame" style="width: 100%; margin-bottom: 8px;">
            保存游戏
          </button>
          <button class="btn" @click="showGameMenu = false" style="width: 100%; margin-bottom: 8px;">
            继续游戏
          </button>
          <button class="btn" @click="restartGame" style="width: 100%;">
            重新开始
          </button>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="showGameMenu = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { usePlayerStore } from '../../stores/playerStore'
import { useGameState } from '../../composables/useGameState'
import { useSkills } from '../../composables/useSkills'
import { calculateCityPower, initializeCityObject, getProvinceName } from '../../utils/cityHelpers'

defineEmits(['exit'])

const playerStore = usePlayerStore()
const { drawRandomCities } = useGameState()
const { getAvailableSkills, canUseSkill: checkSkillAvailable } = useSkills()

// 游戏阶段
const stage = ref('setup') // setup, draw, playing
const gameMode = ref('offline')

// 玩家信息
const nickname = ref('')
const gold = ref(3)
const cityCount = ref(6)
const myCities = ref([])
const centerCityIndex = ref(0)
const selectedCenter = ref(null)

// 游戏状态
const currentRound = ref(1)
const gameLogs = ref([])
const skillFilter = ref('battle')
const showGameMenu = ref(false)
const showCityDetail = ref(false)

const aliveCities = computed(() => {
  return myCities.value.filter(c => c.isAlive !== false)
})

const filteredSkillList = computed(() => {
  return getAvailableSkills(skillFilter.value).slice(0, 10)
})

function startSetup() {
  playerStore.setNickname(nickname.value)
  stage.value = 'draw'
  addLog(`欢迎，${nickname.value}！`)
}

function drawInitialCities() {
  const cities = drawRandomCities(cityCount.value, [])
  myCities.value = cities.map(city => initializeCityObject(city))
  addLog(`成功抽取了 ${myCities.value.length} 个城市`)
}

function confirmCities() {
  if (selectedCenter.value === null) return

  centerCityIndex.value = selectedCenter.value
  playerStore.setCities(myCities.value)
  playerStore.setGold(gold.value)

  stage.value = 'playing'
  addLog(`游戏开始！中心城市：${myCities.value[centerCityIndex.value].name}`)
  addLog(`初始金币：${gold.value}`)
}

function canUseSkillNow(skill) {
  const result = checkSkillAvailable(skill.name, nickname.value, gold.value)
  return result.canUse
}

function getSkillStatusText(skill) {
  const result = checkSkillAvailable(skill.name, nickname.value, gold.value)
  return result.canUse ? '可用' : result.reason
}

function nextTurn() {
  currentRound.value++
  gold.value += 3
  addLog(`\n===== 第 ${currentRound.value} 回合 =====`)
  addLog(`获得 3 金币，当前：${gold.value} 金币`)
}

function addLog(message) {
  gameLogs.value.push(message)
}

function saveGame() {
  const saveData = {
    nickname: nickname.value,
    gold: gold.value,
    myCities: myCities.value,
    currentRound: currentRound.value,
    gameLogs: gameLogs.value
  }
  localStorage.setItem('citycard_save', JSON.stringify(saveData))
  addLog('游戏已保存')
  showGameMenu.value = false
}

function restartGame() {
  if (confirm('确定要重新开始吗？当前进度将丢失！')) {
    stage.value = 'setup'
    nickname.value = ''
    gold.value = 3
    myCities.value = []
    currentRound.value = 1
    gameLogs.value = []
    showGameMenu.value = false
  }
}
</script>

<style scoped>
#playerMode {
  min-height: 100vh;
  background: var(--bg);
}

.player-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.player-setup {
  max-width: 600px;
  margin: 40px auto;
}

.player-game {
  padding-top: 20px;
}

.player-header {
  padding: 16px;
  background: var(--panel);
  border-radius: 8px;
  margin-bottom: 12px;
}

.player-info h2 {
  margin: 0 0 8px 0;
}

.city-card {
  padding: 12px;
  background: var(--panel);
  border: 1px solid #1f2937;
  border-radius: 8px;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
}

.city-card:hover {
  border-color: var(--accent);
  background: #0e1526;
}

.city-card.city-selected {
  border-color: var(--accent);
  background: #18314f;
}

.city-card.city-dead {
  opacity: 0.5;
  pointer-events: none;
}

.skill-item-mini {
  padding: 6px 8px;
  margin-bottom: 4px;
  background: var(--bg);
  border: 1px solid #1f2937;
  border-radius: 4px;
  cursor: pointer;
}

.skill-item-mini:hover {
  border-color: var(--accent);
}

.skill-item-mini.skill-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.draw-cards-btn,
.confirm-cities-btn {
  width: 100%;
  padding: 15px;
  font-size: 18px;
  background: var(--accent);
  color: #0f172a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.draw-cards-btn:hover,
.confirm-cities-btn:hover {
  background: #3b82f6;
}

.draw-cards-btn:disabled,
.confirm-cities-btn:disabled {
  background: var(--muted);
  cursor: not-allowed;
}

.confirm-cities-btn {
  background: var(--good);
  margin-top: 16px;
}

.confirm-cities-btn:hover {
  background: #10b981;
}
</style>
