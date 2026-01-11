<template>
  <div class="player-setup panel">
    <h2 style="text-align: center;">玩家: {{ playerName }}</h2>
    <h3>选择你的中心城市</h3>
    <div class="muted" style="margin-bottom: 10px;">点击城市卡牌选择中心城市</div>

    <!-- 重抽信息显示 -->
    <div class="draw-info">
      <div class="draw-count">
        <span class="label">抽取次数:</span>
        <span class="value">{{ drawCount }} / 5</span>
        <span v-if="drawCount >= 5" class="warning">（已达上限）</span>
      </div>
      <button
        v-if="canRedrawCities"
        class="redraw-btn"
        @click="handleRedraw"
        :disabled="isRedrawing"
      >
        🔄 重新抽取城市 ({{ 5 - drawCount }} 次机会)
      </button>
      <div v-else class="muted" style="font-size: 12px;">
        {{ drawCount >= 5 ? '已达最大重抽次数' : '确认后即可开始游戏' }}
      </div>
    </div>

    <div class="muted" style="margin: 10px 0; padding: 10px; background: #1f2937; border-radius: 6px; font-size: 13px;">
      💡 <strong>提示：</strong>每个城市都有独特的专属技能，合理利用可以扭转战局！
    </div>

    <div class="city-preview">
      <div
        v-for="(city, idx) in cities"
        :key="idx"
        :class="['city-card', { selected: centerIndex === idx }]"
        @click="selectCenter(idx)"
      >
        <div>
          <strong>{{ city.name }}</strong>
          <div class="muted" style="font-size: 11px; margin-top: 2px;">
            {{ getProvinceName(city.name) }}
          </div>
        </div>
        <div>
          <div>HP: {{ city.hp }}</div>
          <div class="muted" style="font-size: 10px;">
            战力: {{ city.hp }}
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
          {{ centerIndex === idx ? '✓ 已选择' : '点击选择' }}
        </div>
      </div>
    </div>

    <button
      class="confirm-cities-btn"
      :disabled="centerIndex === null"
      @click="confirmCenter"
    >
      确认中心城市
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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
  initialCenterIndex: {
    type: Number,
    default: null
  },
  currentDrawCount: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['confirm', 'redraw'])

const { showNotification } = useNotification()
const centerIndex = ref(props.initialCenterIndex)
const drawCount = ref(props.currentDrawCount)
const isRedrawing = ref(false)

// 是否可以重新抽取
const canRedrawCities = computed(() => {
  return drawCount.value < 5
})

function selectCenter(idx) {
  centerIndex.value = idx
  const cityName = props.cities[idx]?.name || '未知'
  console.log(`[对战模式] ${props.playerName} 选择中心城市: ${cityName} (索引${idx})`)
  emit('center-selected', idx)
}

function confirmCenter() {
  if (centerIndex.value !== null) {
    emit('confirm', centerIndex.value)
  }
}

/**
 * 处理重新抽取
 */
async function handleRedraw() {
  if (!canRedrawCities.value) {
    showNotification('已达最大重抽次数！', 'warning')
    return
  }

  if (!confirm(`确定要重新抽取城市吗？\n\n剩余重抽次数: ${5 - drawCount.value}`)) {
    return
  }

  isRedrawing.value = true

  try {
    // 触发重抽事件，由父组件处理
    emit('redraw')
    drawCount.value++
    centerIndex.value = null // 清空选择
    showNotification('城市已重新抽取！', 'success')
  } catch (error) {
    showNotification('重抽失败: ' + error.message, 'error')
  } finally {
    isRedrawing.value = false
  }
}

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
  return city.hp + (city.red || 0) * 10 + (city.green || 0) * 10 + (city.blue || 0) * 10 + (city.yellow || 0) * 10
}
</script>

<style scoped>
.player-setup {
  max-width: 900px;
  margin: 40px auto;
  padding: 20px;
}

.draw-info {
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
  border-radius: 12px;
  padding: 16px;
  margin: 15px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.draw-count {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
}

.draw-count .label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.draw-count .value {
  font-size: 18px;
  font-weight: bold;
  color: #fbbf24;
}

.draw-count .warning {
  font-size: 12px;
  color: #f87171;
}

.redraw-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.redraw-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.redraw-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
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
