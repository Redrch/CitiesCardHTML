<template>
  <div class="player-setup panel">
    <h2 style="text-align: center;">玩家: {{ playerName }}</h2>
    <h3>选择战斗预备城市 (需要选择 {{ rosterSize }} 个)</h3>
    <div class="muted" style="margin-bottom: 10px;">点击城市卡牌来选择/取消选择</div>
    <div v-if="centerIndex !== null && centerIndex !== undefined" class="muted" style="margin-bottom: 10px; color: var(--warn);">
      ⚠️ 中心城市已自动加入预备城市，不能取消
    </div>

    <div class="muted" style="margin: 10px 0; padding: 10px; background: #1f2937; border-radius: 6px; font-size: 13px;">
      💡 <strong>提示：</strong>每个城市都有独特的专属技能，合理利用可以扭转战局！
    </div>

    <div class="city-preview">
      <div
        v-for="(city, idx) in cities"
        :key="idx"
        :class="['city-card', { selected: roster.includes(idx) }]"
        @click="toggleCity(idx)"
      >
        <div>
          <strong>{{ city.name }}</strong>
          <div class="muted" style="font-size: 11px; margin-top: 2px;">
            {{ getProvinceName(city.name) }}
            {{ centerIndex === idx ? ' • 中心' : '' }}
          </div>
        </div>
        <div>
          <div>HP: {{ city.hp }}</div>
          <div class="muted" style="font-size: 10px;">
            战力: {{ calculateCityPower(city) }}
          </div>
        </div>
        <div style="color: #f093fb; font-size: 12px; margin: 6px 0;">
          <template v-if="getCitySkill(city.name)">
            ⚡ {{ getCitySkill(city.name).name }}
          </template>
          <template v-else>
            <span style="color: #999; font-style: italic;">暂无专属技能</span>
          </template>
        </div>
        <div style="margin-top: 8px; font-size: 12px; color: var(--accent);">
          {{ roster.includes(idx) ? '✓ 已加入' : '点击选择' }}
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: 10px 0;">
      <span>已选择: {{ roster.length }} / {{ rosterSize }}</span>
    </div>

    <button
      class="confirm-cities-btn"
      :disabled="roster.length !== rosterSize"
      @click="confirmRoster"
    >
      确认战斗预备城市
    </button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useNotification } from '../../composables/useNotification'
import { getCitySkill } from '../../data/citySkills'
import { PROVINCE_MAP } from '../../data/cities'

const props = defineProps({
  playerName: {
    type: String,
    required: true
  },
  cities: {
    type: Array,
    required: true
  },
  mode: {
    type: String,
    default: '2P' // '2P', '3P', '2v2'
  },
  centerIndex: {
    type: Number,
    default: null
  },
  initialRoster: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['confirm', 'roster-updated'])

const { showNotification } = useNotification()
const roster = ref([...props.initialRoster])
const rosterSize = props.mode === '2v2' ? 4 : 5

// 如果有中心城市，自动添加到roster
onMounted(() => {
  if (props.centerIndex !== null && props.centerIndex !== undefined) {
    if (!roster.value.includes(props.centerIndex)) {
      roster.value.push(props.centerIndex)
      console.log('[Roster] 自动将中心城市添加到预备城市中')
      emit('roster-updated', roster.value)
    }
  }
})

function toggleCity(idx) {
  const position = roster.value.indexOf(idx)

  if (position > -1) {
    // 如果这是中心城市，不允许取消选择
    if (props.centerIndex === idx) {
      showNotification('中心城市不能取消选择！', 'warning')
      return
    }
    // 取消选择
    roster.value.splice(position, 1)
  } else {
    // 选择
    if (roster.value.length >= rosterSize) {
      showNotification(`最多只能选择 ${rosterSize} 个城市！`, 'warning')
      return
    }
    roster.value.push(idx)
  }

  emit('roster-updated', roster.value)
}

function confirmRoster() {
  if (roster.value.length === rosterSize) {
    emit('confirm', roster.value)
  }
}

// 监听centerIndex变化
watch(() => props.centerIndex, (newVal) => {
  if (newVal !== null && newVal !== undefined && !roster.value.includes(newVal)) {
    roster.value.push(newVal)
    emit('roster-updated', roster.value)
  }
})

/**
 * 获取省份名称
 */
function getProvinceName(cityName) {
  const province = PROVINCE_MAP[cityName]
  if (!province) return '未知'

  // 处理直辖市和特区
  if (province.name === '直辖市和特区') {
    if (cityName === '香港特别行政区') return '香港特别行政区'
    if (cityName === '澳门特别行政区') return '澳门特别行政区'
    if (cityName.includes('市')) return '直辖市'
    return province.name
  }

  return province.name
}

/**
 * 计算城市战力
 */
function calculateCityPower(city) {
  return city.hp
}
</script>

<style scoped>
.player-setup {
  max-width: 900px;
  margin: 40px auto;
  padding: 20px;
}

.city-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin: 20px 0;
}

.city-card {
  background: var(--panel);
  border: 2px solid #1f2937;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.city-card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.city-card.selected {
  border-color: var(--accent);
  background: #18314f;
}

.confirm-cities-btn {
  width: 100%;
  padding: 15px;
  font-size: 18px;
  background: var(--good);
  color: #0f172a;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin: 10px 0;
}

.confirm-cities-btn:hover:not(:disabled) {
  background: #10b981;
}

.confirm-cities-btn:disabled {
  background: var(--muted);
  cursor: not-allowed;
}

.badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  margin: 0 2px;
  color: #fff;
}

.badge-red {
  background: #ef4444;
}

.badge-green {
  background: #10b981;
}

.badge-blue {
  background: #3b82f6;
}

.badge-yellow {
  background: #fbbf24;
  color: #0f172a;
}
</style>
