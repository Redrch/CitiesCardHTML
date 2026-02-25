<template>
  <!-- 城市专属技能模态框（暂时隐藏，重做中） -->
  <div v-if="false && isVisible" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">
          <span class="skill-icon">⚡</span>
          {{ skill.name }}
        </h3>
        <button class="close-button" @click="closeModal">✕</button>
      </div>

      <div class="modal-body">
        <!-- 城市信息 -->
        <div class="city-info">
          <div class="city-name">{{ city.name }}</div>
          <div class="city-hp">
            HP: {{ Math.floor(city.currentHp) }} / {{ city.hp }}
          </div>
        </div>

        <!-- 技能类型标签 -->
        <div class="skill-badges">
          <div class="skill-type-badge" :class="`skill-type--${skill.type}`">
            {{ skillTypeLabel }}
          </div>
          <div class="skill-category-badge" :class="`skill-category--${skill.category}`">
            {{ skillCategoryLabel }}
          </div>
        </div>

        <!-- 技能描述 -->
        <div class="skill-description">
          {{ skill.description }}
        </div>

        <!-- 使用次数 -->
        <div v-if="skill.limit" class="skill-usage-info">
          <span class="label">使用次数：</span>
          <span class="value">
            {{ city.skillUsageCount || 0 }} / {{ skill.limit }}
          </span>
        </div>

        <!-- HP要求 -->
        <div v-if="skill.hpRequirement" class="skill-requirement">
          <span class="label">HP要求：</span>
          <span class="value">
            {{ skill.hpRequirement.max ? `低于 ${skill.hpRequirement.max}` : '' }}
            {{ skill.hpRequirement.min ? `高于 ${skill.hpRequirement.min}` : '' }}
          </span>
        </div>

        <!-- 技能效果详情 -->
        <div class="skill-effects">
          <div class="effects-title">技能效果：</div>
          <div class="effects-list">
            <div v-if="skill.healAmount" class="effect-item">
              <span class="effect-icon">❤️</span>
              治疗 {{ skill.healAmount }} HP
            </div>
            <div v-if="skill.powerBonus" class="effect-item">
              <span class="effect-icon">⚔️</span>
              攻击力 {{ typeof skill.powerBonus === 'number' && skill.powerBonus < 10 ? '+' + (skill.powerBonus * 100) + '%' : '+' + skill.powerBonus }}
            </div>
            <div v-if="skill.hpBonus" class="effect-item">
              <span class="effect-icon">💚</span>
              HP {{ '+' + (skill.hpBonus * 100) + '%' }}
            </div>
            <div v-if="skill.duration" class="effect-item">
              <span class="effect-icon">⏱️</span>
              持续 {{ skill.duration }} 回合
            </div>
            <div v-if="skill.shieldHp" class="effect-item">
              <span class="effect-icon">🛡️</span>
              护盾 {{ skill.shieldHp }} HP
            </div>
            <div v-if="skill.damageReduction" class="effect-item">
              <span class="effect-icon">🔰</span>
              伤害减少 {{ skill.damageReduction * 100 }}%
            </div>
          </div>
        </div>

        <!-- 错误信息 -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
      </div>

      <div class="modal-footer">
        <!-- 被动技能说明 -->
        <div v-if="skill.type === 'passive'" class="passive-note">
          ℹ️ 被动技能将在出战时自动触发
        </div>

        <!-- 战斗技能说明 -->
        <div v-else-if="skill.category === 'battle'" class="battle-note">
          ⚔️ 战斗技能需在城市出战时使用
        </div>

        <!-- 非战斗技能说明 -->
        <div v-else-if="skill.category === 'nonBattle'" class="nonbattle-note">
          ✨ 非战斗技能可随时使用，无需出战
        </div>

        <!-- 主动技能按钮 -->
        <div v-if="skill.type !== 'passive'" class="action-buttons">
          <button class="btn btn--secondary" @click="closeModal">
            取消
          </button>
          <button
            class="btn btn--primary"
            @click="useSkill"
            :disabled="!canUseSkill"
          >
            {{ canUseSkill ? '使用技能' : '无法使用' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { SKILL_TYPE } from '../../data/citySkills'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  city: {
    type: Object,
    required: true
  },
  skill: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'use-skill'])

const errorMessage = ref('')

const skillTypeLabel = computed(() => {
  const typeMap = {
    [SKILL_TYPE.PASSIVE]: '被动技能',
    [SKILL_TYPE.ACTIVE]: '主动技能',
    [SKILL_TYPE.TOGGLE]: '切换技能'
  }
  return typeMap[props.skill.type] || '未知类型'
})

const skillCategoryLabel = computed(() => {
  if (props.skill.category === 'battle') {
    return '战斗技能'
  } else if (props.skill.category === 'nonBattle') {
    return '非战斗技能'
  }
  return '未分类'
})

const canUseSkill = computed(() => {
  errorMessage.value = ''

  // 城市必须存活
  if (!props.city.isAlive) {
    errorMessage.value = '城市已阵亡，无法使用技能'
    return false
  }

  // 被动技能不能手动使用
  if (props.skill.type === SKILL_TYPE.PASSIVE) {
    errorMessage.value = '被动技能自动触发，无需手动使用'
    return false
  }

  // 检查使用次数限制
  if (props.skill.limit) {
    const usageCount = props.city.skillUsageCount || 0
    if (usageCount >= props.skill.limit) {
      errorMessage.value = `技能已使用 ${usageCount} 次，达到上限`
      return false
    }
  }

  // 检查HP要求
  if (props.skill.hpRequirement) {
    const currentHp = props.city.currentHp || props.city.hp
    if (props.skill.hpRequirement.max && currentHp >= props.skill.hpRequirement.max) {
      errorMessage.value = `HP需低于 ${props.skill.hpRequirement.max}，当前 ${Math.floor(currentHp)}`
      return false
    }
    if (props.skill.hpRequirement.min && currentHp <= props.skill.hpRequirement.min) {
      errorMessage.value = `HP需高于 ${props.skill.hpRequirement.min}，当前 ${Math.floor(currentHp)}`
      return false
    }
  }

  return true
})

function closeModal() {
  emit('close')
}

function useSkill() {
  if (canUseSkill.value) {
    emit('use-skill', { city: props.city, skill: props.skill })
    closeModal()
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  color: white;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  margin: 0;
  font-size: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.skill-icon {
  font-size: 28px;
}

.close-button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 24px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px;
}

.city-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 16px;
}

.city-name {
  font-size: 18px;
  font-weight: bold;
}

.city-hp {
  font-size: 14px;
  color: #a0d8ff;
}

.skill-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.skill-type-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.skill-category-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
}

.skill-type--passive {
  background: linear-gradient(135deg, #48bb78, #38a169);
}

.skill-type--active {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.skill-type--toggle {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.skill-category--battle {
  background: linear-gradient(135deg, #f5576c, #f093fb);
}

.skill-category--nonBattle {
  background: linear-gradient(135deg, #38a169, #48bb78);
}

.skill-description {
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: 8px;
  line-height: 1.6;
  margin-bottom: 16px;
  border-left: 4px solid #60a5fa;
}

.skill-usage-info,
.skill-requirement {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 12px;
}

.label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.value {
  font-weight: bold;
  font-size: 16px;
}

.skill-effects {
  margin-top: 16px;
}

.effects-title {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.effects-list {
  display: grid;
  gap: 8px;
}

.effect-item {
  background: rgba(255, 255, 255, 0.08);
  padding: 10px 14px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.effect-icon {
  font-size: 18px;
}

.error-message {
  background: rgba(239, 68, 68, 0.2);
  border: 2px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 16px;
  text-align: center;
  font-weight: 500;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}

.passive-note {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  padding: 8px;
}

.battle-note {
  text-align: center;
  color: rgba(245, 87, 108, 0.9);
  font-size: 14px;
  padding: 8px;
  background: rgba(245, 87, 108, 0.1);
  border-radius: 8px;
}

.nonbattle-note {
  text-align: center;
  color: rgba(72, 187, 120, 0.9);
  font-size: 14px;
  padding: 8px;
  background: rgba(72, 187, 120, 0.1);
  border-radius: 8px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn--secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn--secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn--primary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(245, 87, 108, 0.4);
}

.btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
