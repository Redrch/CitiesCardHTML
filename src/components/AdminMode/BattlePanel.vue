<template>
  <div class="battle-panel">
    <div class="panel">
      <h2>战斗部署</h2>
      <div class="content">
        <!-- 玩家选择 -->
        <label>选择玩家</label>
        <select v-model="selectedPlayer">
          <option value="">请选择...</option>
          <option v-for="player in players" :key="player.name" :value="player.name">
            {{ player.name }}
          </option>
        </select>

        <!-- 城市选择 -->
        <div v-if="selectedPlayer" style="margin-top: 12px;">
          <label>选择出战城市</label>
          <div class="city-selection">
            <div
              v-for="(city, index) in getPlayerCities(selectedPlayer)"
              :key="index"
              class="city-checkbox-item"
              :class="{ 'city-dead': !city.isAlive }"
            >
              <label style="display: flex; align-items: center; gap: 8px;">
                <input
                  type="checkbox"
                  :value="index"
                  v-model="selectedCities"
                  :disabled="!city.isAlive || city.isFatigued"
                />
                <div style="flex: 1;">
                  <div><strong>{{ city.name }}</strong></div>
                  <div class="muted" style="font-size: 10px;">
                    HP: {{ city.currentHp || city.hp }}/{{ city.hp }}
                    <span v-if="city.isFatigued" class="warn"> (疲劳)</span>
                  </div>
                </div>
                <div>
                  <span class="badge">{{ calculatePower(city) }}</span>
                </div>
              </label>
            </div>
          </div>

          <button
            class="btn btn-primary"
            :disabled="selectedCities.length === 0"
            @click="deployBattle"
            style="width: 100%; margin-top: 12px;"
          >
            确认部署 ({{ selectedCities.length }}个城市)
          </button>
        </div>

        <!-- 当前部署状态 -->
        <div v-if="Object.keys(deployments).length > 0" style="margin-top: 20px;">
          <h3 style="font-size: 13px; margin-bottom: 8px;">当前部署</h3>
          <div v-for="(deployment, playerName) in deployments" :key="playerName"
               style="margin-bottom: 8px; padding: 8px; background: var(--bg); border-radius: 4px; font-size: 11px;">
            <div><strong>{{ playerName }}</strong></div>
            <div class="muted">
              出战: {{ Object.keys(deployment.cities).length }} 个城市
            </div>
          </div>

          <button
            class="btn btn-primary"
            @click="executeBattle"
            style="width: 100%; margin-top: 12px;"
          >
            执行战斗
          </button>

          <button
            class="btn"
            @click="clearDeployments"
            style="width: 100%; margin-top: 8px;"
          >
            清空部署
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { calculateCityPower } from '../../utils/cityHelpers'

const props = defineProps({
  players: {
    type: Array,
    default: () => []
  },
  deployments: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['deploy-cities', 'execute-battle', 'clear-deployments'])

const selectedPlayer = ref('')
const selectedCities = ref([])

function getPlayerCities(playerName) {
  const player = props.players.find(p => p.name === playerName)
  return player ? player.cities : []
}

function calculatePower(city) {
  return calculateCityPower(city)
}

function deployBattle() {
  if (selectedCities.value.length === 0) return

  emit('deploy-cities', {
    playerName: selectedPlayer.value,
    cityIndices: selectedCities.value
  })

  // 重置选择
  selectedCities.value = []
  selectedPlayer.value = ''
}

function executeBattle() {
  emit('execute-battle')
}

function clearDeployments() {
  emit('clear-deployments')
  selectedCities.value = []
}
</script>

<style scoped>
.city-selection {
  max-height: 300px;
  overflow-y: auto;
}

.city-checkbox-item {
  padding: 8px;
  margin-bottom: 6px;
  background: var(--bg);
  border: 1px solid #1f2937;
  border-radius: 4px;
}

.city-checkbox-item:hover {
  background: #0e1526;
}

.city-checkbox-item.city-dead {
  opacity: 0.4;
}

.city-checkbox-item input[type="checkbox"] {
  width: auto;
  margin: 0;
}
</style>
