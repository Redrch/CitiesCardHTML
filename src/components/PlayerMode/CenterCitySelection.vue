<template>
  <div class="center-city-selection">
    <div class="selection-container">
      <!-- 标题 -->
      <div class="selection-title">
        <h1 class="title-text">{{ is3P ? '确认抽取到的城市' : '选择中心城市' }}</h1>
        <p class="subtitle">{{ is3P ? 'Confirm Your Cities' : 'Choose Your Capital City' }}</p>
        <div class="player-name">玩家: {{ playerName }}</div>
      </div>

      <!-- 抽取信息 -->
      <div class="draw-info-card">
        <div class="draw-count-display">
          <span class="draw-label">抽取次数</span>
          <span class="draw-value">{{ drawCount }} / 5</span>
          <span v-if="drawCount >= 5" class="draw-warning">（已达上限）</span>
        </div>
        <button
          v-if="canRedrawCities"
          class="redraw-btn"
          @click="handleRedraw"
          :disabled="isRedrawing"
        >
          <span class="redraw-icon">🔄</span>
          <span class="redraw-text">重新抽取城市 ({{ 5 - drawCount }} 次机会)</span>
        </button>
        <div v-else class="redraw-disabled">
          {{ drawCount >= 5 ? '已达最大重抽次数' : '确认后即可开始游戏' }}
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="tip-card">
        <span class="tip-icon">💡</span>
        <span class="tip-text" v-if="is3P"><strong>提示：</strong>确认你抽取到的城市后即可开始游戏！</span>
        <span class="tip-text" v-else><strong>提示：</strong>选择一座城市作为你的中心城市，中心城市被摧毁则游戏失败！</span>
      </div>

      <!-- 当前选中的中心城市（3P不需要） -->
      <div v-if="!is3P && centerIndex !== null" class="selected-center-card">
        <div class="selected-center-label">当前选中的中心城市</div>
        <div class="selected-center-info">
          <div class="selected-center-icon">🏛️</div>
          <div class="selected-center-details">
            <div class="selected-center-name">{{ cities[centerIndex]?.name }}</div>
            <div class="selected-center-hp">HP: {{ cities[centerIndex]?.hp }}</div>
          </div>
        </div>
      </div>

      <!-- 城市卡片网格 -->
      <div class="city-grid">
        <div
          v-for="(city, idx) in cities"
          :key="idx"
          :class="['city-card', { selected: !is3P && centerIndex === idx, 'city-card--no-select': is3P }]"
          @click="!is3P && selectCenter(idx)"
        >
          <div class="city-card-header">
            <div class="city-name">{{ city.name }}</div>
            <div class="city-province">{{ getProvinceName(city.name) }}</div>
          </div>
          <div class="city-stats">
            <div class="city-hp">
              <span class="stat-label">HP</span>
              <span class="stat-value">{{ city.hp }}</span>
            </div>
          </div>
          <!-- 城市专属技能显示（暂时隐藏，重做中） -->
          <!-- <div
            class="city-skill"
            :class="{ 'city-skill--clickable': getCitySkill(city.name) }"
            @click.stop="getCitySkill(city.name) && showSkillDetail(city.name)"
          >
            <template v-if="getCitySkill(city.name)">
              <span class="skill-icon">⚡</span>
              <span class="skill-name">{{ getCitySkill(city.name).name }}</span>
              <span class="skill-info-icon">ℹ️</span>
            </template>
            <template v-else>
              <span class="no-skill">暂无专属技能</span>
            </template>
          </div> -->
          <div v-if="!is3P" class="city-select-status">
            {{ centerIndex === idx ? '✓ 已选择' : '点击选择' }}
          </div>
        </div>
      </div>

      <!-- 确认按钮 -->
      <button
        class="confirm-btn"
        :disabled="!is3P && centerCityName === null"
        @click="confirmCenter"
      >
        <span class="confirm-icon">✓</span>
        <span class="confirm-text">{{ is3P ? '确认抽取到的城市' : '确认中心城市' }}</span>
      </button>
    </div>

    <!-- 技能详情模态框（暂时隐藏，重做中） -->
    <div v-if="false && selectedSkillCity" class="skill-modal-backdrop" @click="closeSkillDetail">
      <div class="skill-modal" @click.stop>
        <div class="skill-modal-header">
          <h3 class="skill-modal-title">{{ selectedSkillCity }} - 专属技能</h3>
          <button class="skill-modal-close" @click="closeSkillDetail">×</button>
        </div>
        <div class="skill-modal-body">
          <div v-if="selectedSkill" class="skill-detail">
            <div class="skill-detail-name">
              <span class="skill-detail-icon">⚡</span>
              {{ selectedSkill.name }}
            </div>
            <div class="skill-detail-badges">
              <span class="skill-badge skill-type-badge" :class="`skill-type--${selectedSkill.type}`">
                {{ getSkillTypeLabel(selectedSkill.type) }}
              </span>
              <span class="skill-badge skill-category-badge" :class="`skill-category--${selectedSkill.category}`">
                {{ getSkillCategoryLabel(selectedSkill.category) }}
              </span>
            </div>
            <div class="skill-detail-description">
              {{ selectedSkill.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useNotification } from '../../composables/useNotification'
import { getCitySkill, SKILL_TYPE } from '../../data/citySkills'
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
  },
  gameMode: {
    type: String,
    default: '2P'
  }
})

const is3P = computed(() => props.gameMode === '3P')

const emit = defineEmits(['confirm', 'redraw', 'center-selected'])

const { showNotification } = useNotification()
const centerCityName = ref(null) // 改用城市名称
const drawCount = ref(props.currentDrawCount)
const isRedrawing = ref(false)
const selectedSkillCity = ref(null)

// 根据初始索引获取城市名称
if (props.initialCenterIndex !== null && props.cities[props.initialCenterIndex]) {
  centerCityName.value = props.cities[props.initialCenterIndex].name
}

// 计算当前选中城市的索引（用于UI显示）
const centerIndex = computed(() => {
  if (!centerCityName.value) return null
  return props.cities.findIndex(c => c.name === centerCityName.value)
})

// 选中的技能详情
const selectedSkill = computed(() => {
  if (!selectedSkillCity.value) return null
  return getCitySkill(selectedSkillCity.value)
})

// 是否可以重新抽取
const canRedrawCities = computed(() => {
  return drawCount.value < 5
})

function selectCenter(idx) {
  const city = props.cities[idx]
  if (!city) return

  centerCityName.value = city.name
  console.log(`[对战模式] ${props.playerName} 选择中心城市: ${city.name}`)
  emit('center-selected', city.name) // 发送城市名称
}

function confirmCenter() {
  if (is3P.value) {
    // 3P模式不需要中心城市，直接确认
    console.log(`[CenterCitySelection] 3P模式：确认抽取到的城市`)
    emit('confirm', null)
  } else if (centerCityName.value) {
    console.log(`[CenterCitySelection] 确认中心城市: ${centerCityName.value}`)
    emit('confirm', centerCityName.value)
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
    emit('redraw')
    drawCount.value++
    centerCityName.value = null // 清空选中的城市名称
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

  if (cityName === '香港特别行政区') return '香港特别行政区'
  if (cityName === '澳门特别行政区') return '澳门特别行政区'
  if (province.name === '直辖市和特区') return '直辖市'

  return province.name
}

/**
 * 显示技能详情
 */
function showSkillDetail(cityName) {
  selectedSkillCity.value = cityName
}

/**
 * 关闭技能详情
 */
function closeSkillDetail() {
  selectedSkillCity.value = null
}

/**
 * 获取技能类型标签
 */
function getSkillTypeLabel(type) {
  const typeMap = {
    [SKILL_TYPE.PASSIVE]: '被动技能',
    [SKILL_TYPE.ACTIVE]: '主动技能',
    [SKILL_TYPE.TOGGLE]: '切换技能'
  }
  return typeMap[type] || '未知类型'
}

/**
 * 获取技能分类标签
 */
function getSkillCategoryLabel(category) {
  if (category === 'battle') {
    return '战斗技能'
  } else if (category === 'nonBattle') {
    return '非战斗技能'
  }
  return '未分类'
}
</script>

<style scoped>
.center-city-selection {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.center-city-selection::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  animation: rotate 30s linear infinite;
  pointer-events: none;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.selection-container {
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
}

/* 标题 */
.selection-title {
  text-align: center;
  margin-bottom: 32px;
  animation: fadeInDown 0.8s ease-out;
}

.title-text {
  font-size: 48px;
  font-weight: 900;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 0 40px rgba(59, 130, 246, 0.5);
  letter-spacing: 3px;
}

.subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin: 8px 0 0 0;
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.player-name {
  font-size: 16px;
  color: #cbd5e1;
  margin-top: 12px;
  font-weight: 500;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 抽取信息卡片 */
.draw-info-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  backdrop-filter: blur(10px);
  animation: fadeInUp 0.8s ease-out 0.1s both;
}

.draw-count-display {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 18px;
}

.draw-label {
  color: #cbd5e1;
  font-weight: 600;
}

.draw-value {
  color: #60a5fa;
  font-weight: 900;
  font-size: 24px;
}

.draw-warning {
  color: #f59e0b;
  font-size: 14px;
  font-weight: 600;
}

.redraw-btn {
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.redraw-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.redraw-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.redraw-icon {
  font-size: 18px;
}

.redraw-text {
  font-size: 15px;
}

.redraw-disabled {
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 提示卡片 */
.tip-card {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%);
  border: 2px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  backdrop-filter: blur(10px);
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.tip-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.tip-text {
  font-size: 14px;
  color: #cbd5e1;
  line-height: 1.6;
}

/* 选中的中心城市卡片 */
.selected-center-card {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%);
  border: 2px solid rgba(245, 158, 11, 0.4);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  animation: fadeInUp 0.8s ease-out 0.3s both;
}

.selected-center-label {
  font-size: 14px;
  color: #fbbf24;
  font-weight: 700;
  margin-bottom: 12px;
  text-align: center;
}

.selected-center-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.selected-center-icon {
  font-size: 48px;
}

.selected-center-details {
  text-align: left;
}

.selected-center-name {
  font-size: 24px;
  font-weight: 900;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.selected-center-hp {
  font-size: 16px;
  color: #fbbf24;
  font-weight: 700;
}

/* 城市卡片网格 */
.city-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.city-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.city-card:not(.city-card--no-select):hover {
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
}

.city-card--no-select {
  cursor: default;
}

.city-card.selected {
  border-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
}

.city-card-header {
  margin-bottom: 12px;
}

.city-name {
  font-size: 18px;
  font-weight: 700;
  color: #f1f5f9;
  margin-bottom: 4px;
}

.city-province {
  font-size: 12px;
  color: #94a3b8;
}

.city-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.city-hp,
.city-power {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
}

.stat-value {
  font-size: 20px;
  font-weight: 900;
  color: #60a5fa;
}

.city-skill {
  padding: 8px 12px;
  background: rgba(139, 92, 246, 0.1);
  border-radius: 8px;
  margin-bottom: 12px;
  min-height: 36px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.city-skill--clickable {
  cursor: pointer;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.city-skill--clickable:hover {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.5);
  transform: translateY(-2px);
}

.skill-info-icon {
  margin-left: auto;
  font-size: 14px;
  opacity: 0.7;
}

.skill-icon {
  font-size: 16px;
}

.skill-name {
  font-size: 13px;
  color: #c4b5fd;
  font-weight: 600;
}

.no-skill {
  font-size: 12px;
  color: #64748b;
  font-style: italic;
}

.city-select-status {
  text-align: center;
  font-size: 14px;
  font-weight: 700;
  color: #60a5fa;
}

.city-card.selected .city-select-status {
  color: #fbbf24;
}

/* 确认按钮 */
.confirm-btn {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px 32px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 700;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3);
  animation: fadeInUp 0.8s ease-out 0.5s both;
}

.confirm-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.4);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.confirm-icon {
  font-size: 24px;
}

.confirm-text {
  font-size: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .title-text {
    font-size: 36px;
  }

  .subtitle {
    font-size: 12px;
  }

  .city-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }

  .city-card {
    padding: 16px;
  }

  .city-name {
    font-size: 16px;
  }

  .stat-value {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .title-text {
    font-size: 28px;
    letter-spacing: 2px;
  }

  .subtitle {
    font-size: 11px;
  }

  .city-grid {
    grid-template-columns: 1fr;
  }

  .confirm-btn {
    padding: 18px 28px;
    font-size: 18px;
  }
}

/* 技能详情模态框 */
.skill-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.skill-modal {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border: 2px solid rgba(139, 92, 246, 0.5);
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.skill-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 2px solid rgba(139, 92, 246, 0.3);
}

.skill-modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #c4b5fd;
}

.skill-modal-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 32px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;
  line-height: 1;
}

.skill-modal-close:hover {
  background: rgba(148, 163, 184, 0.2);
  color: #f1f5f9;
}

.skill-modal-body {
  padding: 24px;
}

.skill-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skill-detail-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 700;
  color: #f1f5f9;
}

.skill-detail-icon {
  font-size: 32px;
}

.skill-detail-badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.skill-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.skill-type-badge {
  text-transform: uppercase;
}

.skill-type--passive {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
}

.skill-type--active {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
}

.skill-type--toggle {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.skill-category--battle {
  background: linear-gradient(135deg, #f5576c, #f093fb);
  color: white;
}

.skill-category--nonBattle {
  background: linear-gradient(135deg, #38a169, #48bb78);
  color: white;
}

.skill-detail-description {
  font-size: 15px;
  color: #cbd5e1;
  line-height: 1.8;
  padding: 16px;
  background: rgba(139, 92, 246, 0.1);
  border-left: 4px solid rgba(139, 92, 246, 0.5);
  border-radius: 8px;
}
</style>
