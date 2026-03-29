<template>
  <div id="playerMode">
    <button class="exit-btn" @click="$emit('exit')">退出到主菜单</button>
    <div id="playerModeContent">
      <div class="player-setup">
        <h2 style="text-align: center; color: var(--accent);">对战模式</h2>

        <!-- 玩家设置 -->
        <div>
          <label>输入你的昵称</label>
          <input
            v-model="nickname"
            type="text"
            class="player-nickname-input"
            placeholder="请输入昵称..."
            @keyup.enter="startGame"
          />
        </div>

        <!-- 抽卡区域 -->
        <div v-if="!gameStarted">
          <button
            class="draw-cards-btn"
            :disabled="!nickname.trim()"
            @click="drawInitialCities"
          >
            抽取初始城市
          </button>

          <div v-if="drawnCities.length > 0" class="city-preview">
            <h3>你的城市 ({{ drawnCities.length }}个)</h3>
            <div
              v-for="(city, index) in drawnCities"
              :key="index"
              class="city-card"
            >
              <div>
                <strong>{{ city.name }}</strong>
              </div>
              <div>HP: {{ city.hp }}</div>
              <div>
                <span class="badge">红{{ city.red }}</span>
                <span class="badge">绿{{ city.green }}</span>
                <span class="badge">蓝{{ city.blue }}</span>
              </div>
            </div>

            <button
              class="confirm-cities-btn"
              @click="confirmCities"
            >
              确认城市
            </button>
          </div>
        </div>

        <!-- 游戏中界面 -->
        <div v-else>
          <h3>游戏进行中...</h3>
          <p class="muted">对战模式的完整功能正在开发中</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ALL_CITIES } from '../../data/cities'

defineEmits(['exit'])

const nickname = ref('')
const drawnCities = ref([])
const gameStarted = ref(false)

function drawInitialCities() {
  // 随机抽取6个城市
  const shuffled = [...ALL_CITIES].sort(() => 0.5 - Math.random())
  drawnCities.value = shuffled.slice(0, 6).map(city => ({
    name: city.name,
    hp: city.hp,
    red: city.red || 0,
    green: city.green || 0,
    blue: city.blue || 0,
    yellow: city.yellow || 0
  }))
}

function confirmCities() {
  gameStarted.value = true
  // TODO: 实现完整的游戏逻辑
}

function startGame() {
  if (nickname.value.trim()) {
    drawInitialCities()
  }
}
</script>

<style scoped>
#playerMode {
  min-height: 100vh;
  padding: 20px;
}
</style>
