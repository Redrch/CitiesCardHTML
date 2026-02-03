<template>
  <div v-if="needsRefill" class="roster-refill-panel panel">
    <h2 style="color: var(--warn); text-align: center;">⚠️ 需要补充预备城市</h2>

    <!-- 改弦更张模式 -->
    <div v-if="isReselection" class="refill-content">
      <div class="muted warning-text">
        【改弦更张】重新选择战斗预备城市（需要选择 {{ rosterLimit }} 个，
        <span style="color: var(--error);">中心城市必须包含</span>）
      </div>

      <div class="city-list">
        <label>选择预备城市（可多选）：</label>
        <div class="city-grid">
          <div
            v-for="({ city, cityName }, i) in allAliveCities"
            :key="cityName"
            :class="['city-option', {
              selected: selectedCities.includes(cityName),
              center: cityName === centerCityName
            }]"
            @click="toggleCity(cityName)"
          >
            <div class="city-name">
              {{ city.name }}
              <span v-if="cityName === centerCityName" class="center-badge">⭐中心</span>
            </div>
            <div class="city-hp">HP: {{ Math.floor(city.currentHp || city.hp) }}</div>
          </div>
        </div>
      </div>

      <button class="confirm-btn" @click="confirmRefill">
        确认预备城市
      </button>
    </div>

    <!-- 普通补充模式 -->
    <div v-else class="refill-content">
      <div class="muted info-text">
        你的预备城市数量不足（当前 {{ currentRosterCount }} / {{ rosterLimit }}），
        请选择 {{ neededCount }} 个城市补充到预备列表
      </div>

      <div class="city-list">
        <label>选择要补充的城市（可多选）：</label>
        <div class="city-grid">
          <div
            v-for="({ city, cityName }, i) in availableCities"
            :key="cityName"
            :class="['city-option', { selected: selectedCities.includes(cityName) }]"
            @click="toggleCity(cityName)"
          >
            <div class="city-name">{{ city.name }}</div>
            <div class="city-hp">HP: {{ Math.floor(city.currentHp || city.hp) }}</div>
          </div>
        </div>
      </div>

      <button class="confirm-btn" @click="confirmRefill">
        确认补充预备城市
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useNotification } from '../../composables/useNotification'

const props = defineProps({
  player: {
    type: Object,
    required: true
  },
  playerState: {
    type: Object,
    required: true
  },
  gameMode: {
    type: String,
    default: '2P'
  }
})

const emit = defineEmits(['refill-confirmed'])

const { showNotification } = useNotification()
const selectedCities = ref([])

// 是否需要补充
const needsRefill = computed(() => {
  return props.playerState?.needsRosterRefill === true
})

// 是否为改弦更张模式
const isReselection = computed(() => {
  return props.playerState?.rosterRefillReason === '改弦更张'
})

// 预备城市数量限制
const rosterLimit = computed(() => {
  return props.gameMode === '2v2' ? 4 : 5
})

  // 当前预备城市数量（只计算存活的城市）
const currentRosterCount = computed(() => {
  if (!props.player.roster) return 0

  // 过滤掉已阵亡的城市
  const aliveRoster = props.player.roster.filter(cityName => {
    const city = props.player.cities[cityName]
    const isDead = props.playerState.deadCities?.includes(cityName)
    const currentHp = city?.currentHp !== undefined ? city.currentHp : city?.hp
    return !isDead && currentHp > 0
  })

  return aliveRoster.length
})

// 需要补充的数量
const neededCount = computed(() => {
  return rosterLimit.value - currentRosterCount.value
})

// 中心城市名称
const centerCityName = computed(() => {
  return props.player.centerCityName
})

// 所有存活城市（用于改弦更张）
const allAliveCities = computed(() => {
  if (!props.player.cities) return []

  return Object.entries(props.player.cities)
    .map(([cityName, city]) => ({ city, cityName }))
    .filter(({ city, cityName }) => {
      const isDead = props.playerState.deadCities?.includes(cityName)
      return !isDead && (city.currentHp || city.hp) > 0
    })
})

// 可补充的城市（用于普通补充）
const availableCities = computed(() => {
  if (!props.player.cities) return []

  return Object.entries(props.player.cities)
    .map(([cityName, city]) => ({ city, cityName }))
    .filter(({ city, cityName }) => {
      const isDead = props.playerState.deadCities?.includes(cityName)
      const isInRoster = props.player.roster?.includes(cityName)
      return !isDead && !isInRoster && (city.currentHp || city.hp) > 0
    })
})

// 切换城市选择
function toggleCity(cityName) {
  const index = selectedCities.value.indexOf(cityName)
  if (index > -1) {
    selectedCities.value.splice(index, 1)
  } else {
    selectedCities.value.push(cityName)
  }
}

// 确认补充
function confirmRefill() {
  if (selectedCities.value.length === 0) {
    showNotification('请选择至少一个城市！', 'warning')
    return
  }

  if (isReselection.value) {
    // 改弦更张模式：必须选择确切数量且包含中心城市
    if (selectedCities.value.length !== rosterLimit.value) {
      showNotification(
        `改弦更张需要选择确切的${rosterLimit.value}个城市！当前选择了${selectedCities.value.length}个`,
        'warning'
      )
      return
    }

    if (!selectedCities.value.includes(centerCityName.value)) {
      showNotification('中心城市必须包含在预备城市中！', 'error')
      return
    }

    // 发射事件，替换整个预备列表
    emit('refill-confirmed', {
      mode: 'reselection',
      cities: selectedCities.value
    })
  } else {
    // 普通补充模式
    const newTotal = currentRosterCount.value + selectedCities.value.length
    if (newTotal > rosterLimit.value) {
      showNotification(
        `预备城市总数不能超过${rosterLimit.value}个，你已有${currentRosterCount.value}个，最多只能再选${rosterLimit.value - currentRosterCount.value}个！`,
        'warning'
      )
      return
    }

    // 发射事件，追加到预备列表
    emit('refill-confirmed', {
      mode: 'append',
      cities: selectedCities.value
    })
  }

  // 重置选择
  selectedCities.value = []
}

// 监听needsRefill变化，重置选择
watch(needsRefill, (newVal) => {
  if (newVal) {
    selectedCities.value = []
  }
})
</script>

<style scoped>
.roster-refill-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  z-index: 1000;
  background: var(--panel);
  border: 2px solid var(--warn);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

h2 {
  margin: 0 0 20px 0;
}

.refill-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.warning-text {
  background: rgba(239, 68, 68, 0.1);
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid var(--error);
  margin-bottom: 10px;
  font-size: 14px;
}

.info-text {
  background: rgba(59, 130, 246, 0.1);
  padding: 12px;
  border-radius: 6px;
  border-left: 4px solid var(--accent);
  margin-bottom: 10px;
  font-size: 14px;
}

.city-list label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  color: var(--text);
}

.city-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-bottom: 15px;
}

.city-option {
  background: #1f2937;
  border: 2px solid #374151;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.city-option:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.city-option.selected {
  border-color: var(--good);
  background: rgba(16, 185, 129, 0.1);
}

.city-option.center {
  border-color: var(--warn);
}

.city-name {
  font-weight: bold;
  margin-bottom: 5px;
  color: var(--text);
}

.center-badge {
  display: inline-block;
  margin-left: 5px;
  font-size: 12px;
}

.city-hp {
  font-size: 13px;
  color: var(--muted);
}

.confirm-btn {
  width: 100%;
  padding: 15px;
  font-size: 16px;
  background: var(--good);
  color: #0f172a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.confirm-btn:hover {
  background: #10b981;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.confirm-btn:active {
  transform: translateY(0);
}
</style>
