<template>
  <div
    class="city-card"
    :class="{
      'city-card--dead': !city.isAlive,
      'city-card--center': city.isCenter,
      'city-card--protected': hasProtection,
      'city-card--unknown': city.isUnknown
    }"
  >
    <!-- 城市名称 -->
    <div class="city-card__header">
      <h4 class="city-card__name">
        {{ city.name }}
        <div v-if="!city.isUnknown" class="city-card__province">
          {{ getProvinceName(city.name) }}
        </div>
        <span v-if="city.isCenter && !city.isUnknown" class="city-card__center-badge">中心</span>
      </h4>
      <div v-if="hasProtection && !city.isUnknown" class="city-card__protection">
        🛡️ {{ protectionRounds }}回合
      </div>
    </div>

    <!-- 未知城市提示 -->
    <div v-if="city.isUnknown" class="city-card__unknown-hint">
      <span class="unknown-icon">❓</span>
      <span class="unknown-text">未知城市</span>
    </div>

    <!-- HP条（已知城市） -->
    <div v-else class="city-card__hp">
      <div class="city-card__hp-bar">
        <div
          class="city-card__hp-fill"
          :style="{ width: hpPercentage + '%' }"
          :class="hpColorClass"
        ></div>
      </div>
      <div class="city-card__hp-text">
        {{ Math.floor(city.currentHp) }} / {{ city.hp }}
      </div>
    </div>

    <!-- 城市技能按钮（暂时隐藏，重做中） -->
    <div v-if="false && !city.isUnknown && citySkill" class="city-card__skill-section">
      <button
        class="skill-button"
        @click.stop="handleSkillClick"
        :disabled="!city.isAlive"
      >
        <span class="skill-icon">⚡</span>
        <span class="skill-name">{{ citySkill.name }}</span>
        <span v-if="citySkill.limit" class="skill-usage">
          {{ city.skillUsageCount || 0 }}/{{ citySkill.limit }}
        </span>
      </button>
    </div>

    <!-- 状态标记 -->
    <div v-if="modifiers.length > 0" class="city-card__modifiers">
      <span
        v-for="(modifier, index) in modifiers"
        :key="index"
        class="modifier-badge"
        :title="modifier.description"
      >
        {{ modifier.icon }}
      </span>
    </div>

    <!-- 操作按钮 -->
    <div v-if="showActions" class="city-card__actions">
      <slot name="actions"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getCitySkill } from '../../data/citySkills'
import { PROVINCE_MAP } from '../../data/cities'

const props = defineProps({
  city: {
    type: Object,
    required: true
  },
  hasProtection: {
    type: Boolean,
    default: false
  },
  protectionRounds: {
    type: Number,
    default: 0
  },
  modifiers: {
    type: Array,
    default: () => []
  },
  showActions: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['skill-click'])

const hpPercentage = computed(() => {
  if (!props.city.hp) return 0
  return Math.max(0, Math.min(100, (props.city.currentHp / props.city.hp) * 100))
})

const hpColorClass = computed(() => {
  const percentage = hpPercentage.value
  if (percentage > 70) return 'hp-fill--high'
  if (percentage > 30) return 'hp-fill--medium'
  return 'hp-fill--low'
})

const citySkill = computed(() => {
  return getCitySkill(props.city.name)
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

function handleSkillClick() {
  if (citySkill.value && !props.city.isUnknown) {
    emit('skill-click', { city: props.city, skill: citySkill.value })
  }
}
</script>

<style scoped>
.city-card {
  background: linear-gradient(135deg, #4a5a8a 0%, #6b5b8a 100%);
  border-radius: 12px;
  border: 2px solid rgba(212, 160, 23, 0.3);
  padding: 16px;
  box-shadow: 0 4px 12px rgba(60, 75, 100, 0.2);
  transition: all 0.3s ease;
  min-width: 200px;
  position: relative;
}

/* Fortification gradient at top */
.city-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, transparent, #d4a017, transparent);
  border-radius: 10px 10px 0 0;
}

.city-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(60, 75, 100, 0.25);
  border-color: rgba(212, 160, 23, 0.5);
}

.city-card--dead {
  opacity: 0.5;
  filter: grayscale(0.8);
  border-style: dashed;
  border-color: rgba(168, 180, 200, 0.5);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.15);
}

.city-card--dead::before {
  display: none;
}

.city-card--center {
  border: 3px solid #d4a017;
  background: linear-gradient(135deg, #8a4a6b 0%, #a85070 100%);
  box-shadow: 0 0 0 2px rgba(212, 160, 23, 0.2), 0 4px 12px rgba(60, 75, 100, 0.2);
}

/* Crown decoration for center city */
.city-card--center::after {
  content: '\265B';
  position: absolute;
  top: -12px;
  right: 12px;
  font-size: 22px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.city-card--protected {
  box-shadow: 0 0 0 3px rgba(58, 123, 213, 0.5),
              0 0 16px rgba(58, 123, 213, 0.2),
              0 4px 12px rgba(60, 75, 100, 0.2);
}

.city-card--unknown {
  background: linear-gradient(135deg, #c5cdd8 0%, #b0b8c5 100%);
  opacity: 0.8;
  cursor: not-allowed;
  border-color: rgba(168, 180, 200, 0.4);
}

.city-card--unknown::before {
  display: none;
}

.city-card--unknown:hover {
  transform: none;
  box-shadow: 0 4px 12px rgba(60, 75, 100, 0.15);
}

.city-card__unknown-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.unknown-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.6;
}

.unknown-text {
  color: rgba(30, 41, 59, 0.65);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 1px;
}

.city-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.city-card__name {
  margin: 0;
  color: white;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.city-card__province {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: normal;
  margin-top: 2px;
}

.city-card__center-badge {
  background: linear-gradient(135deg, #f0c850, #d4a017);
  color: #2d2000;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
  box-shadow: 0 1px 3px rgba(212, 160, 23, 0.4);
}

.city-card__protection {
  background: rgba(58, 123, 213, 0.9);
  color: white;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(58, 123, 213, 0.3);
}

.city-card__hp {
  margin-bottom: 12px;
}

.city-card__hp-bar {
  width: 100%;
  height: 22px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 11px;
  overflow: hidden;
  margin-bottom: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.city-card__hp-fill {
  height: 100%;
  transition: width 0.5s ease, background-color 0.3s ease;
  border-radius: 11px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.hp-fill--high {
  background: linear-gradient(90deg, #48bb78, #38a169);
}

.hp-fill--medium {
  background: linear-gradient(90deg, #ed8936, #dd6b20);
}

.hp-fill--low {
  background: linear-gradient(90deg, #f56565, #e53e3e);
  animation: hpPulse 1.5s ease-in-out infinite;
}

@keyframes hpPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.city-card__hp-text {
  color: white;
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.city-card__skill-section {
  margin-bottom: 8px;
}

.skill-button {
  width: 100%;
  background: linear-gradient(135deg, #d4a017 0%, #b8860b 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.skill-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 160, 23, 0.4);
  border-color: rgba(255, 255, 255, 0.4);
}

.skill-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.skill-icon {
  font-size: 16px;
}

.skill-name {
  flex: 1;
  text-align: left;
  font-size: 13px;
}

.skill-usage {
  background: rgba(0, 0, 0, 0.15);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.city-card__modifiers {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.modifier-badge {
  font-size: 16px;
  cursor: help;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.city-card__actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}
</style>
