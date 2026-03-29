<template>
  <div class="player-panel" :class="{ 'player-panel--active': isCurrentPlayer }">
    <!-- 玩家头部信息 -->
    <div class="player-panel__header">
      <div class="player-panel__avatar">
        {{ player.name.charAt(0) }}
      </div>
      <div class="player-panel__info">
        <h3 class="player-panel__name">
          {{ player.name }}
          <span v-if="isCurrentPlayer" class="player-panel__current-badge">
            当前回合
          </span>
        </h3>
        <div class="player-panel__stats">
          <span class="stat stat--gold">💰 {{ player.gold }}</span>
          <span class="stat stat--cities">
            🏙️ {{ aliveCitiesCount }}/{{ Object.keys(player.cities).length }}
          </span>
        </div>
      </div>
    </div>

    <!-- 城市展示区 -->
    <div v-if="!hideOpponentCities || isCurrentPlayer" class="player-panel__cities">
      <CityCard
        v-for="(city, cityName) in player.cities"
        :key="cityName"
        :city="city"
        :has-protection="hasProtection(cityName)"
        :protection-rounds="getProtectionRounds(cityName)"
        :modifiers="getCityModifiers(city)"
        :show-actions="isCurrentPlayer && showCityActions"
        @click="$emit('city-click', cityName)"
        @skill-click="handleSkillClick"
      >
        <template #actions>
          <slot name="city-actions" :city="city" :cityName="cityName"></slot>
        </template>
      </CityCard>
    </div>

    <!-- 对手城市展示区（仅显示已知城市） -->
    <div v-else-if="hideOpponentCities && !isCurrentPlayer" class="player-panel__cities">
      <CityCard
        v-for="(city, cityName) in player.cities"
        :key="cityName"
        :city="isKnownCity(cityName) ? city : { name: '未知城市', hp: 0, currentHp: 0, isUnknown: true }"
        :has-protection="isKnownCity(cityName) && hasProtection(cityName)"
        :protection-rounds="isKnownCity(cityName) ? getProtectionRounds(cityName) : 0"
        :modifiers="isKnownCity(cityName) ? getCityModifiers(city) : []"
        :show-actions="false"
        :class="{ 'city-unknown': !isKnownCity(cityName) }"
        @skill-click="handleSkillClick"
      />
    </div>

    <!-- 战斗修饰符 -->
    <div v-if="player.battleModifiers && player.battleModifiers.length > 0" class="player-panel__battle-modifiers">
      <h4 class="section-title">战斗状态</h4>
      <div class="modifier-list">
        <div
          v-for="(modifier, index) in player.battleModifiers"
          :key="index"
          class="modifier-item"
        >
          <span class="modifier-icon">{{ getModifierIcon(modifier.type) }}</span>
          <span class="modifier-name">{{ getModifierName(modifier.type) }}</span>
          <span v-if="modifier.roundsLeft" class="modifier-rounds">
            ({{ modifier.roundsLeft }}回合)
          </span>
        </div>
      </div>
    </div>

    <!-- 操作按钮区 -->
    <div v-if="isCurrentPlayer && showActions" class="player-panel__actions">
      <slot name="actions"></slot>
    </div>

    <!-- 城市技能模态框 -->
    <CitySkillModal
      v-if="selectedCity && selectedSkill"
      :is-visible="showSkillModal"
      :city="selectedCity"
      :skill="selectedSkill"
      @close="closeSkillModal"
      @use-skill="handleUseSkillClick"
    />

    <!-- 己方城市选择器 -->
    <CityTargetSelector
      :is-visible="showSelfCitySelector"
      :cities="player.cities"
      :title="selfSelectorTitle"
      :description="selfSelectorDescription"
      :maxSelections="targetSelectionCount"
      :filter="selfCityFilter"
      @close="closeSelfCitySelector"
      @confirm="handleSelfCitySelection"
    />

    <!-- 对手已知城市选择器 -->
    <CityTargetSelector
      v-if="opponentKnownCities.length > 0"
      :is-visible="showOpponentCitySelector"
      :cities="opponentKnownCities"
      :title="opponentSelectorTitle"
      :description="opponentSelectorDescription"
      :maxSelections="targetSelectionCount"
      :filter="opponentCityFilter"
      @close="closeOpponentCitySelector"
      @confirm="handleOpponentCitySelection"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import CityCard from './CityCard.vue'
import CitySkillModal from './CitySkillModal.vue'
import CityTargetSelector from './CityTargetSelector.vue'
import { useGameStore } from '../../stores/gameStore'
import { useCitySkills } from '../../composables/useCitySkills'

const props = defineProps({
  player: {
    type: Object,
    required: true
  },
  isCurrentPlayer: {
    type: Boolean,
    default: false
  },
  showActions: {
    type: Boolean,
    default: true
  },
  showCityActions: {
    type: Boolean,
    default: false
  },
  hideOpponentCities: {
    type: Boolean,
    default: false
  }
})

defineEmits(['city-click'])

const gameStore = useGameStore()
const citySkills = useCitySkills()

// 城市技能模态框状态
const showSkillModal = ref(false)
const selectedCity = ref(null)
const selectedSkill = ref(null)

// 目标选择器状态
const showSelfCitySelector = ref(false)
const showOpponentCitySelector = ref(false)
const pendingSkillData = ref(null)

const selfSelectorTitle = ref('选择己方城市')
const selfSelectorDescription = ref('请选择一个己方城市作为目标')
const opponentSelectorTitle = ref('选择对手城市')
const opponentSelectorDescription = ref('请选择一个对手已知城市作为目标')
const targetSelectionCount = ref(1)

const aliveCitiesCount = computed(() => {
  return Object.values(props.player.cities).filter(city => {
    // 检查isAlive标志和当前HP
    if (city.isAlive === false) return false
    const currentHp = city.currentHp !== undefined ? city.currentHp : city.hp
    return currentHp > 0
  }).length
})

const centerCityInfo = computed(() => {
  // 如果是对手，不显示中心城市的具体信息
  if (props.hideOpponentCities) {
    return '隐藏'
  }

  const centerCity = props.player.cities[props.player.centerCityName]
  if (!centerCity) return '未知'

  const currentHp = centerCity.currentHp !== undefined ? centerCity.currentHp : centerCity.hp
  return centerCity.isAlive !== false && currentHp > 0
    ? `${centerCity.name} (HP: ${Math.floor(currentHp)})`
    : `${centerCity.name} (已摧毁)`
})

/**
 * 获取所有对手的已知城市
 */
const opponentKnownCities = computed(() => {
  const opponents = gameStore.players.filter(p => p.name !== props.player.name)
  const knownCities = []

  opponents.forEach(opponent => {
    Object.entries(opponent.cities).forEach(([cityName, city]) => {
      // 检查该城市对当前玩家是否已知
      const isKnown = gameStore.knownCities?.[opponent.name]?.[props.player.name]?.includes(cityName)
      if (isKnown) {
        knownCities.push({
          ...city,
          ownerName: opponent.name,
          cityName: cityName
        })
      }
    })
  })

  return knownCities
})

// 城市过滤函数
const selfCityFilter = computed(() => {
  return (city) => {
    if (!city.isAlive || (city.currentHp || city.hp) <= 0) return false

    // 根据技能的具体要求进行过滤
    if (pendingSkillData.value && pendingSkillData.value.skill) {
      const skill = pendingSkillData.value.skill

      // HP要求过滤
      if (skill.targetHpRequirement) {
        const currentHp = city.currentHp || city.hp
        if (skill.targetHpRequirement.max && currentHp >= skill.targetHpRequirement.max) {
          return false
        }
        if (skill.targetHpRequirement.min && currentHp <= skill.targetHpRequirement.min) {
          return false
        }
      }
    }

    return true
  }
})

const opponentCityFilter = computed(() => {
  return (city) => {
    if (!city.isAlive || (city.currentHp || city.hp) <= 0) return false

    // 根据技能的具体要求进行过滤
    if (pendingSkillData.value && pendingSkillData.value.skill) {
      const skill = pendingSkillData.value.skill

      // HP要求过滤
      if (skill.targetHpRequirement) {
        const currentHp = city.currentHp || city.hp
        if (skill.targetHpRequirement.max && currentHp >= skill.targetHpRequirement.max) {
          return false
        }
        if (skill.targetHpRequirement.min && currentHp <= skill.targetHpRequirement.min) {
          return false
        }
      }
    }

    return true
  }
})

/**
 * 检查城市是否为已知城市
 * @param {string} cityName - 城市名称
 * @returns {boolean} 是否已知
 */
function isKnownCity(cityName) {
  // 如果是当前玩家，所有城市都已知
  if (props.isCurrentPlayer) return true

  // 如果不隐藏对手城市，所有城市都已知
  if (!props.hideOpponentCities) return true

  // 获取当前观察者（当前回合玩家）
  const currentPlayerName = gameStore.currentPlayer
  if (!currentPlayerName) return false

  // 检查城市是否为已知城市
  // knownCities结构: knownCities[拥有者][观察者] = Set(城市名称)
  const knownSet = gameStore.knownCities?.[props.player.name]?.[currentPlayerName]
  return knownSet && knownSet.has(cityName)
}

function hasProtection(cityName) {
  return gameStore.protections?.[props.player.name]?.[cityName] > 0 ||
         gameStore.ironCities?.[props.player.name]?.[cityName]
}

function getProtectionRounds(cityName) {
  return gameStore.protections?.[props.player.name]?.[cityName] || 0
}

function getCityModifiers(city) {
  const modifiers = []

  if (city.modifiers) {
    city.modifiers.forEach(mod => {
      modifiers.push({
        icon: getModifierIcon(mod.type),
        description: getModifierName(mod.type)
      })
    })
  }

  return modifiers
}

function getModifierIcon(type) {
  const iconMap = {
    damage_immunity: '🛡️',
    power_boost: '⚔️',
    reflect: '🔄',
    berserk: '😡',
    defense: '🧱',
    heal: '❤️',
    poison: '☠️'
  }
  return iconMap[type] || '✨'
}

function getModifierName(type) {
  const nameMap = {
    damage_immunity: '伤害免疫',
    power_boost: '攻击增强',
    reflect: '反射伤害',
    berserk: '狂暴模式',
    defense: '防御加成',
    heal: '治疗效果',
    poison: '持续伤害'
  }
  return nameMap[type] || type
}

/**
 * 处理城市技能点击事件
 */
function handleSkillClick(data) {
  selectedCity.value = data.city
  selectedSkill.value = data.skill
  showSkillModal.value = true
}

/**
 * 关闭技能模态框
 */
function closeSkillModal() {
  showSkillModal.value = false
  selectedCity.value = null
  selectedSkill.value = null
}

/**
 * 使用城市技能
 */
function handleUseSkillClick(data) {
  const skill = data.skill

  // 保存待处理的技能数据
  pendingSkillData.value = data

  // 检查技能是否需要选择目标
  if (skill.requiresTarget || skill.requiresMultipleSelfCities) {
    // 确定需要选择的目标数量
    targetSelectionCount.value = skill.targetCount || 1

    // 更新选择器标题和描述
    if (skill.requiresTarget) {
      // 判断是选择己方还是对手城市
      // 如果技能描述包含"对方"、"敌方"等关键词，则选择对手城市
      const needsOpponentTarget =
        skill.description.includes('对方') ||
        skill.description.includes('敌方') ||
        skill.description.includes('对手') ||
        skill.captureHpRequirement || // 掠夺技能
        skill.targetOpponent

      if (needsOpponentTarget) {
        opponentSelectorTitle.value = `选择对手城市 - ${skill.name}`
        opponentSelectorDescription.value = skill.description
        showOpponentCitySelector.value = true
      } else {
        selfSelectorTitle.value = `选择己方城市 - ${skill.name}`
        selfSelectorDescription.value = skill.description
        showSelfCitySelector.value = true
      }
    } else if (skill.requiresMultipleSelfCities) {
      selfSelectorTitle.value = `选择${targetSelectionCount.value}个己方城市 - ${skill.name}`
      selfSelectorDescription.value = skill.description
      showSelfCitySelector.value = true
    }

    // 关闭技能模态框
    closeSkillModal()
  } else {
    // 直接执行技能
    executeSkill(data)
  }
}

/**
 * 执行技能
 */
function executeSkill(data, targetCities = null) {
  const params = {
    ...data
  }

  // 如果有选择的目标城市，添加到参数中
  if (targetCities && targetCities.length > 0) {
    if (targetCities[0].ownerName) {
      // 对手城市
      params.targetOpponent = gameStore.players.find(p => p.name === targetCities[0].ownerName)
      params.targetOpponentCity = targetCities[0]
      params.targetOpponentCities = targetCities
    } else {
      // 己方城市
      params.targetCity = targetCities[0]
      params.targetCities = targetCities
    }
  }

  const result = citySkills.executeCitySkill(props.player, data.city, data.skill, params)

  if (result.success) {
    gameStore.addLog(`${props.player.name} 成功使用了 ${data.city.name} 的【${data.skill.name}】`)
    if (result.message) {
      gameStore.addLog(result.message)
    }
  } else {
    gameStore.addLog(`${props.player.name} 使用技能失败：${result.message}`)
  }

  // 清空待处理数据
  pendingSkillData.value = null
}

/**
 * 处理己方城市选择
 */
function handleSelfCitySelection(selection) {
  if (pendingSkillData.value) {
    executeSkill(pendingSkillData.value, selection.cities)
  }
  closeSelfCitySelector()
}

/**
 * 处理对手城市选择
 */
function handleOpponentCitySelection(selection) {
  if (pendingSkillData.value) {
    executeSkill(pendingSkillData.value, selection.cities)
  }
  closeOpponentCitySelector()
}

/**
 * 关闭己方城市选择器
 */
function closeSelfCitySelector() {
  showSelfCitySelector.value = false
  pendingSkillData.value = null
}

/**
 * 关闭对手城市选择器
 */
function closeOpponentCitySelector() {
  showOpponentCitySelector.value = false
  pendingSkillData.value = null
}

</script>

<style scoped>
.player-panel {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 16px rgba(100, 116, 145, 0.08);
  transition: all 0.3s ease;
}

.player-panel--active {
  border: 3px solid #ffd700;
  box-shadow: 0 0 0 4px rgba(255, 215, 0, 0.3),
              0 8px 16px rgba(100, 116, 145, 0.08);
  transform: scale(1.02);
}

.player-panel__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.player-panel__avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: white;
  text-transform: uppercase;
  box-shadow: 0 4px 8px rgba(100, 116, 145, 0.08);
}

.player-panel__info {
  flex: 1;
}

.player-panel__name {
  margin: 0 0 8px 0;
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-panel__current-badge {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: bold;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
}

.player-panel__stats {
  display: flex;
  gap: 16px;
}

.stat {
  background: rgba(59, 130, 246, 0.12);
  padding: 6px 12px;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 14px;
  backdrop-filter: blur(10px);
}

.stat--gold {
  background: rgba(255, 215, 0, 0.2);
}

.stat--cities {
  background: rgba(102, 126, 234, 0.2);
}

.player-panel__cities {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.player-panel__opponent-info {
  padding: 20px;
  background: rgba(100, 116, 145, 0.12);
  border-radius: 12px;
  margin-bottom: 16px;
}

.opponent-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 8px;
  border-left: 4px solid #60a5fa;
}

.summary-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  font-weight: 500;
}

.summary-value {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.player-panel__battle-modifiers {
  background: rgba(100, 116, 145, 0.08);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.section-title {
  color: white;
  font-size: 14px;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.modifier-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.modifier-item {
  background: rgba(59, 130, 246, 0.08);
  padding: 6px 12px;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.modifier-icon {
  font-size: 16px;
}

.modifier-rounds {
  color: #ffd700;
  font-weight: bold;
}

.player-panel__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 16px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
}
</style>
