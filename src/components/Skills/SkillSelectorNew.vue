<template>
  <div class="skill-selector-new">
    <!-- 技能列表区域 -->
    <div class="skill-section">
      <div class="skill-header">
        <h3>{{ title }}</h3>
        <div class="skill-filters">
          <button
            v-for="category in categories"
            :key="category.id"
            :class="['filter-btn', { active: activeCategory === category.id }]"
            @click="activeCategory = category.id"
          >
            {{ category.name }} ({{ category.count }})
          </button>
        </div>
      </div>

      <div class="skill-grid">
        <div
          v-for="skill in filteredSkills"
          :key="skill.name"
          :class="['skill-card', {
            disabled: !canUseSkill(skill),
            selected: selectedSkill?.name === skill.name
          }]"
          @click="selectSkill(skill)"
        >
          <div class="skill-icon">{{ skill.emoji }}</div>
          <div class="skill-info">
            <div class="skill-name">{{ skill.name }}</div>
            <div class="skill-cost">
              <span class="gold-icon">💰</span>
              {{ getSkillCost(skill.name) }}
            </div>
            <div class="skill-description">{{ skill.description }}</div>

            <!-- 显示使用次数限制 -->
            <div v-if="skill.limit" class="skill-usage">
              <span class="usage-label">使用次数:</span>
              <span class="usage-count">
                {{ getSkillUsageCount(skill.name) }} / {{ skill.limit }}
              </span>
            </div>

            <!-- 显示冷却回合数 -->
            <template v-if="skill.cooldown">
              <div v-if="getSkillCooldownRemaining(skill.name) > 0" class="skill-cooldown-active">
                <span class="cooldown-icon">⏰</span>
                <span class="cooldown-text">剩余{{ getSkillCooldownRemaining(skill.name) }}回合</span>
              </div>
              <div v-else class="skill-cooldown-ready">
                <span class="ready-icon">✅</span>
                <span class="ready-text">冷却完毕</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 目标选择区域（中间位置） -->
    <div v-if="selectedSkill" class="target-section">
      <!-- 对手玩家选择器 -->
      <div v-if="selectedSkill.requiresTarget" class="target-player-selector">
        <h4>选择目标玩家</h4>
        <div class="player-buttons">
          <button
            v-for="player in opponents"
            :key="player.name"
            :class="['player-btn', { selected: targetPlayer === player.name }]"
            @click="targetPlayer = player.name"
          >
            {{ player.name }} (💰{{ player.gold }})
          </button>
        </div>
      </div>

      <!-- 己方城市卡牌选择 -->
      <div v-if="selectedSkill.requiresSelfCity || selectedSkill.requiresMultipleSelfCities" class="city-card-selector">
        <h4>
          {{ selectedSkill.requiresMultipleSelfCities
            ? `选择己方城市（${selectedSelfCities.length} / ${selectedSkill.targetCount}）`
            : '选择己方城市'
          }}
        </h4>
        <div class="city-cards-grid">
          <div
            v-for="(city, idx) in props.currentPlayer.cities"
            :key="idx"
            :class="[
              'mini-city-card',
              {
                'selected': selectedSkill.requiresMultipleSelfCities
                  ? selectedSelfCities.includes(idx)
                  : selfCity === idx,
                'disabled': !canSelectCity(city, idx),
                'dead': city.isAlive === false
              }
            ]"
            @click="handleCityClick(idx, city, 'self')"
          >
            <div class="city-name">{{ city.name }}</div>
            <div class="city-hp">HP: {{ Math.floor(city.currentHp || city.hp) }}</div>
            <div v-if="city.isAlive === false" class="city-status dead">已阵亡</div>
            <div v-if="selectedSkill.requiresMultipleSelfCities && selectedSelfCities.includes(idx)" class="check-mark">✓</div>
            <div v-else-if="!selectedSkill.requiresMultipleSelfCities && selfCity === idx" class="check-mark">✓</div>
          </div>
        </div>
      </div>

      <!-- 对手已知城市卡牌选择 -->
      <div v-if="selectedSkill.requiresTargetCity && targetPlayer" class="city-card-selector">
        <h4>选择目标城市（{{ targetPlayer }}的已知城市）</h4>
        <div class="city-cards-grid">
          <div
            v-for="item in getTargetCities()"
            :key="item.originalIndex"
            :class="[
              'mini-city-card',
              {
                'selected': targetCity === item.originalIndex,
                'disabled': item.city.isAlive === false
              }
            ]"
            @click="handleCityClick(item.originalIndex, item.city, 'target')"
          >
            <div class="city-name">{{ item.city.name }}</div>
            <div class="city-hp">HP: {{ Math.floor(item.city.currentHp || item.city.hp) }}</div>
            <div v-if="item.city.isAlive === false" class="city-status dead">已阵亡</div>
            <div v-if="targetCity === item.originalIndex" class="check-mark">✓</div>
          </div>
        </div>
        <div v-if="getTargetCities().length === 0" class="no-cities-hint">
          暂无已知城市，请先探测对手城市
        </div>
      </div>

      <!-- 其他参数 -->
      <div v-if="selectedSkill.requiresAmount" class="param-group">
        <label>{{ selectedSkill.amountLabel }}:</label>
        <input
          type="number"
          v-model.number="amount"
          :min="selectedSkill.amountMin || 1"
          :max="selectedSkill.amountMax || 999999"
        />
      </div>

      <!-- 技能选择（突破瓶颈/一触即发） -->
      <div v-if="selectedSkill.requiresSkillSelection" class="param-group">
        <label>{{ selectedSkill.selectionType === 'cooldown' ? '选择要清除冷却的技能:' : '选择要增加次数的技能:' }}</label>
        <select v-model="selectedSkillName">
          <option value="">-- 请选择 --</option>
          <option
            v-for="skill in getAvailableSkillsForSelection()"
            :key="skill.name"
            :value="skill.name"
          >
            {{ skill.name }}
            <span v-if="selectedSkill.selectionType === 'cooldown'">
              (剩余{{ skill.remainingRounds }}回合)
            </span>
            <span v-else>
              (已使用{{ skill.usedCount }}次)
            </span>
          </option>
        </select>
      </div>
    </div>

    <!-- 技能详情和执行按钮 -->
    <div v-if="selectedSkill" class="skill-detail">
      <h4>{{ selectedSkill.name }}</h4>
      <p class="detail-description">{{ selectedSkill.detailedDescription || selectedSkill.description }}</p>

      <div class="skill-actions">
        <button
          class="btn-primary"
          :disabled="!canExecuteSkill()"
          @click="executeSkill"
        >
          使用技能
        </button>
        <button class="btn-secondary" @click="selectedSkill = null; resetParams()">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useBattleSkills } from '../../composables/skills/battleSkills'
import { useNonBattleSkills } from '../../composables/skills/nonBattleSkills'
import { SKILL_COSTS } from '../../constants/skillCosts'
import {
  BATTLE_SKILLS,
  NON_BATTLE_SKILLS,
  getSkillRestrictions
} from '../../data/skills'
import { handleJiningSkill } from '../../composables/citySkills/shandong'
import { handleZhoushanSkill } from '../../composables/citySkills/zhejiang'

const props = defineProps({
  title: {
    type: String,
    default: '技能选择'
  },
  currentPlayer: {
    type: Object,
    required: true
  },
  skillType: {
    type: String,
    default: 'all',
    validator: (value) => ['all', 'battle', 'nonBattle'].includes(value)
  }
})

const emit = defineEmits(['skill-used', 'skill-failed', 'close'])

const gameStore = useGameStore()
const battleSkills = useBattleSkills()
const nonBattleSkills = useNonBattleSkills()

const activeCategory = ref('all')
const selectedSkill = ref(null)
const targetPlayer = ref('')
const targetCity = ref('')
const selfCity = ref('')
const amount = ref(0)
const selectedSelfCities = ref([])
const selectedSkillName = ref('')

// 技能分类
const categories = computed(() => [
  { id: 'all', name: '全部', count: allSkills.value.length },
  { id: 'battle', name: '战斗', count: battleSkillsList.value.length },
  { id: 'resource', name: '资源', count: resourceSkills.value.length },
  { id: 'protection', name: '防御', count: protectionSkills.value.length },
  { id: 'damage', name: '伤害', count: damageSkills.value.length },
  { id: 'control', name: '控制', count: controlSkills.value.length }
])

// 技能元数据映射（与原版相同，此处省略完整列表）
const SKILL_METADATA = {
  // ... 复制原版的SKILL_METADATA
  '擒贼擒王': { emoji: '👑', category: 'battle', description: '优先攻击最高HP城市', requiresTarget: true },
  '草木皆兵': { emoji: '🌿', category: 'battle', description: '对手伤害减半', requiresTarget: true },
  '无知无畏': { emoji: '⚔️', category: 'damage', description: '最低HP城市自毁攻击对方中心', requiresTarget: true },
  '快速治疗': { emoji: '💊', category: 'protection', description: '城市恢复满血', requiresSelfCity: true },
  '城市保护': { emoji: '🛡️', category: 'protection', description: '10回合免疫技能伤害', requiresSelfCity: true },
  '金币贷款': { emoji: '🏦', category: 'resource', description: '贷款5金币', requiresTarget: false },
  '定海神针': { emoji: '⚓', category: 'protection', description: '城市锁定位置，免疫交换', requiresSelfCity: true },
  '转账给他人': { emoji: '💸', category: 'resource', description: '转账金币给其他玩家', requiresTarget: true, requiresAmount: true, amountLabel: '金额' },
  '料事如神': { emoji: '🔮', category: 'battle', description: '偷袭造成5000伤害', requiresTarget: true, requiresTargetCity: true },
  '孔孟故里': { emoji: '🏛️', category: 'protection', description: '给己方2座城市+1000HP', requiresMultipleSelfCities: true, targetCount: 2 },
  '舟山海鲜': { emoji: '🦞', category: 'protection', description: '给己方3座城市HP增加20%', requiresMultipleSelfCities: true, targetCount: 3 },
  '一触即发': { emoji: '💥', category: 'control', description: '清除指定技能的冷却时间', requiresTarget: false, requiresSkillSelection: true, selectionType: 'cooldown' },
  '突破瓶颈': { emoji: '📈', category: 'buff', description: '增加指定技能使用次数上限', requiresTarget: false, requiresSkillSelection: true, selectionType: 'usage' },
  // 添加所有其他技能...
}

// 技能列表
const allSkills = computed(() => {
  const skills = []

  if (props.skillType === 'all' || props.skillType === 'battle') {
    BATTLE_SKILLS.forEach(skillName => {
      const metadata = SKILL_METADATA[skillName] || {
        emoji: '❓',
        category: 'battle',
        description: skillName
      }
      const restrictions = getSkillRestrictions(skillName)
      skills.push({
        name: skillName,
        ...metadata,
        ...restrictions
      })
    })
  }

  if (props.skillType === 'all' || props.skillType === 'nonBattle') {
    NON_BATTLE_SKILLS.forEach(skillName => {
      const metadata = SKILL_METADATA[skillName] || {
        emoji: '❓',
        category: 'resource',
        description: skillName
      }
      const restrictions = getSkillRestrictions(skillName)
      skills.push({
        name: skillName,
        ...metadata,
        ...restrictions
      })
    })
  }

  return skills
})

const filteredSkills = computed(() => {
  let skills = []
  if (activeCategory.value === 'all') {
    skills = allSkills.value
  } else {
    skills = allSkills.value.filter(s => s.category === activeCategory.value)
  }

  // 按金币花费从小到大排序
  return skills.sort((a, b) => {
    const costA = getSkillCost(a.name)
    const costB = getSkillCost(b.name)
    return costA - costB
  })
})

const battleSkillsList = computed(() => {
  return allSkills.value
    .filter(s => s.category === 'battle')
    .sort((a, b) => getSkillCost(a.name) - getSkillCost(b.name))
})

const resourceSkills = computed(() => {
  return allSkills.value
    .filter(s => s.category === 'resource')
    .sort((a, b) => getSkillCost(a.name) - getSkillCost(b.name))
})

const protectionSkills = computed(() => {
  return allSkills.value
    .filter(s => s.category === 'protection')
    .sort((a, b) => getSkillCost(a.name) - getSkillCost(b.name))
})

const damageSkills = computed(() => {
  return allSkills.value
    .filter(s => s.category === 'damage')
    .sort((a, b) => getSkillCost(a.name) - getSkillCost(b.name))
})

const controlSkills = computed(() => {
  return allSkills.value
    .filter(s => s.category === 'control')
    .sort((a, b) => getSkillCost(a.name) - getSkillCost(b.name))
})

const opponents = computed(() => {
  if (!gameStore.players || !Array.isArray(gameStore.players)) {
    return []
  }
  return gameStore.players.filter(p => p && p.name !== props.currentPlayer?.name)
})

function getSkillCost(skillName) {
  return SKILL_COSTS[skillName] || 0
}

function getSkillUsageCount(skillName) {
  return gameStore.getSkillUsageCount(props.currentPlayer.name, skillName) || 0
}

function getSkillCooldownRemaining(skillName) {
  return gameStore.getSkillCooldown(props.currentPlayer.name, skillName) || 0
}

function canUseSkill(skill) {
  const cost = getSkillCost(skill.name)
  if (props.currentPlayer.gold < cost) return false

  if (skill.limit) {
    const usageCount = getSkillUsageCount(skill.name)
    if (usageCount >= skill.limit) return false
  }

  if (skill.cooldown) {
    const cooldownRemaining = getSkillCooldownRemaining(skill.name)
    if (cooldownRemaining > 0) return false
  }

  return true
}

function selectSkill(skill) {
  if (!canUseSkill(skill)) {
    return
  }
  selectedSkill.value = skill
  resetParams()
}

function resetParams() {
  targetPlayer.value = ''
  targetCity.value = ''
  selfCity.value = ''
  amount.value = 0
  selectedSelfCities.value = []
  selectedSkillName.value = ''
}

function handleCityClick(cityIdx, city, type) {
  if (city.isAlive === false) return

  if (type === 'self') {
    if (selectedSkill.value.requiresMultipleSelfCities) {
      toggleCitySelection(cityIdx, city)
    } else {
      selfCity.value = cityIdx
    }
  } else if (type === 'target') {
    targetCity.value = cityIdx
  }
}

function toggleCitySelection(cityIdx, city) {
  if (!canSelectCity(city, cityIdx)) return

  const index = selectedSelfCities.value.indexOf(cityIdx)
  if (index > -1) {
    selectedSelfCities.value.splice(index, 1)
  } else {
    if (selectedSelfCities.value.length < selectedSkill.value.targetCount) {
      selectedSelfCities.value.push(cityIdx)
    }
  }
}

function canSelectCity(city, cityIdx) {
  if (!city) return false
  if (city.isAlive === false) return false

  if (selectedSkill.value.hpRequirement) {
    const currentHp = city.currentHp || city.hp || 0
    if (selectedSkill.value.hpRequirement.max && currentHp > selectedSkill.value.hpRequirement.max) {
      return false
    }
    if (selectedSkill.value.hpRequirement.min && currentHp < selectedSkill.value.hpRequirement.min) {
      return false
    }
  }

  return true
}

function getTargetCities() {
  if (!targetPlayer.value) return []
  const player = opponents.value.find(p => p.name === targetPlayer.value)
  if (!player || !player.cities) return []

  const centerIdx = player.centerCityName || 0

  return player.cities
    .map((city, idx) => ({ city, originalIndex: idx }))
    .filter(item => {
      if (!item.city || item.city.currentHp <= 0 || item.city.isAlive === false) {
        return false
      }

      if ((selectedSkill.value?.name === '言听计从' || selectedSkill.value?.name === '以礼来降') &&
          item.originalIndex === centerCityName) {
        return false
      }

      // 关键修复：使用getKnownCitiesForPlayer来检查（内部会处理前缀）
      const knownCitiesList = gameStore.getKnownCitiesForPlayer(props.currentPlayer.name, player.name)
      if (!knownCitiesList || knownCitiesList.length === 0) {
        return true
      }

      return gameStore.isCityKnown(player.name, item.originalIndex, props.currentPlayer.name)
    })
}

function getAvailableSkillsForSelection() {
  if (!selectedSkill.value || !selectedSkill.value.requiresSkillSelection) {
    return []
  }

  if (selectedSkill.value.selectionType === 'cooldown') {
    const coolingSkills = []
    if (gameStore.cooldowns && gameStore.cooldowns[props.currentPlayer.name]) {
      const myCooldowns = gameStore.cooldowns[props.currentPlayer.name]
      for (const [name, rounds] of Object.entries(myCooldowns)) {
        if (rounds > 0) {
          coolingSkills.push({
            name: name,
            remainingRounds: rounds
          })
        }
      }
    }
    return coolingSkills
  } else if (selectedSkill.value.selectionType === 'usage') {
    const usedSkills = []
    if (gameStore.skillUsageTracking && gameStore.skillUsageTracking[props.currentPlayer.name]) {
      const myTracking = gameStore.skillUsageTracking[props.currentPlayer.name]
      for (const [name, count] of Object.entries(myTracking)) {
        if (count > 0) {
          usedSkills.push({
            name: name,
            usedCount: count
          })
        }
      }
    }
    return usedSkills
  }

  return []
}

function canExecuteSkill() {
  if (!selectedSkill.value) return false
  if (selectedSkill.value.requiresTarget && !targetPlayer.value) return false
  if (selectedSkill.value.requiresTargetCity && targetCity.value === '') return false
  if (selectedSkill.value.requiresSelfCity && selfCity.value === '') return false
  if (selectedSkill.value.requiresAmount && !amount.value) return false
  if (selectedSkill.value.requiresMultipleSelfCities && selectedSelfCities.value.length !== selectedSkill.value.targetCount) return false
  if (selectedSkill.value.requiresSkillSelection && !selectedSkillName.value) return false
  return true
}

// 技能执行映射表（简化版，只列举部分）
const SKILL_EXECUTOR_MAP = {
  '擒贼擒王': () => battleSkills.executeQinZeiQinWang(props.currentPlayer, getTargetPlayer()),
  '草木皆兵': () => battleSkills.executeCaoMuJieBing(props.currentPlayer, getTargetPlayer()),
  '无知无畏': () => nonBattleSkills.executeWuZhiWuWei(props.currentPlayer, getTargetPlayer()),
  '金币贷款': () => nonBattleSkills.executeJinBiDaiKuan(props.currentPlayer),
  '快速治疗': () => nonBattleSkills.executeKuaiSuZhiLiao(props.currentPlayer, getSelfCityObject()),
  '城市保护': () => nonBattleSkills.executeCityProtection(props.currentPlayer, getSelfCityObject()),
  '定海神针': () => nonBattleSkills.executeDingHaiShenZhen(props.currentPlayer, getSelfCityObject()),
  '转账给他人': () => nonBattleSkills.executeTransferGold(props.currentPlayer, getTargetPlayer(), amount.value),
  '料事如神': () => battleSkills.executeLiaoShiRuShen(props.currentPlayer, getTargetPlayer(), getTargetCityObject()),
  '孔孟故里': () => executeCitySkill(handleJiningSkill, '济宁市'),
  '舟山海鲜': () => executeCitySkill(handleZhoushanSkill, '舟山市'),
  '一触即发': () => nonBattleSkills.executeYiChuJiFa(props.currentPlayer, selectedSkillName.value),
  '突破瓶颈': () => nonBattleSkills.executeTuPoPingJing(props.currentPlayer, selectedSkillName.value),
  // 添加所有其他技能...
}

function getTargetPlayer() {
  return opponents.value.find(p => p.name === targetPlayer.value)
}

function getSelfCityObject() {
  return props.currentPlayer.cities[selfCity.value]
}

function getTargetCityObject() {
  const target = getTargetPlayer()
  return target?.cities[targetCity.value]
}

function executeCitySkill(skillHandler, cityName) {
  const skillData = {
    cityName: cityName,
    skillName: selectedSkill.value.name
  }

  skillHandler(
    props.currentPlayer,
    skillData,
    gameStore.addLog,
    gameStore,
    selectedSelfCities.value
  )

  return { success: true }
}

function executeSkill() {
  if (!canExecuteSkill()) {
    return
  }

  const skill = selectedSkill.value
  let result

  try {
    const executor = SKILL_EXECUTOR_MAP[skill.name]
    if (executor) {
      result = executor()
    } else {
      result = { success: false, message: `技能 "${skill.name}" 尚未实现` }
    }

    if (result.success) {
      emit('skill-used', { skill: skill.name, result })
      selectedSkill.value = null
      resetParams()
    } else {
      emit('skill-failed', { skill: skill.name, result })
    }
  } catch (error) {
    console.error('[SkillSelector] 技能执行错误:', error)
    emit('skill-failed', { skill: skill.name, error: error.message })
  }
}
</script>

<style scoped>
.skill-selector-new {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  background: #1a1a2e;
  color: #eee;
  border-radius: 12px;
  max-height: 90vh;
  overflow-y: auto;
}

/* 技能列表区域 */
.skill-section {
  background: #16213e;
  padding: 20px;
  border-radius: 8px;
}

.skill-header h3 {
  margin: 0 0 15px 0;
  font-size: 24px;
  color: #4ecca3;
}

.skill-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #3a3a5c;
  background: #0f3460;
  color: #eee;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  border-color: #4ecca3;
  background: #1a4668;
}

.filter-btn.active {
  background: #4ecca3;
  color: #16213e;
  border-color: #4ecca3;
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.skill-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #0f3460;
  border: 2px solid #3a3a5c;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.skill-card:hover:not(.disabled) {
  border-color: #4ecca3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(78, 204, 163, 0.3);
}

.skill-card.selected {
  border-color: #4ecca3;
  background: #1a4668;
}

.skill-card.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.skill-icon {
  font-size: 32px;
}

.skill-info {
  flex: 1;
}

.skill-name {
  font-weight: bold;
  font-size: 14px;
  margin-bottom: 4px;
  color: #4ecca3;
}

.skill-cost {
  font-size: 12px;
  color: #ffd93d;
  margin-bottom: 6px;
}

.skill-description {
  font-size: 11px;
  color: #aaa;
}

.skill-usage,
.skill-cooldown-active,
.skill-cooldown-ready {
  font-size: 10px;
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 8px;
}

.skill-usage {
  background: #1a4668;
  color: #4ecca3;
}

.skill-cooldown-active {
  background: #4a1a1a;
  color: #ff6b6b;
}

.skill-cooldown-ready {
  background: #1a4a1a;
  color: #51cf66;
}

/* 目标选择区域 */
.target-section {
  background: #16213e;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #4ecca3;
}

.target-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #4ecca3;
}

.target-player-selector {
  margin-bottom: 20px;
}

.player-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.player-btn {
  padding: 10px 20px;
  border: 2px solid #3a3a5c;
  background: #0f3460;
  color: #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.player-btn:hover {
  border-color: #4ecca3;
  background: #1a4668;
}

.player-btn.selected {
  border-color: #4ecca3;
  background: #4ecca3;
  color: #16213e;
  font-weight: bold;
}

/* 城市卡牌选择 */
.city-card-selector {
  margin-bottom: 20px;
}

.city-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.mini-city-card {
  position: relative;
  padding: 12px;
  background: #0f3460;
  border: 2px solid #3a3a5c;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.mini-city-card:hover:not(.disabled):not(.dead) {
  border-color: #4ecca3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(78, 204, 163, 0.3);
}

.mini-city-card.selected {
  border-color: #4ecca3;
  background: #1a4668;
}

.mini-city-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mini-city-card.dead {
  opacity: 0.3;
  cursor: not-allowed;
  background: #2a2a3a;
}

.city-name {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #4ecca3;
}

.city-hp {
  font-size: 11px;
  color: #ffd93d;
}

.city-status.dead {
  font-size: 10px;
  color: #ff6b6b;
  margin-top: 4px;
}

.check-mark {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: #4ecca3;
  color: #16213e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.no-cities-hint {
  text-align: center;
  padding: 20px;
  color: #888;
  font-size: 14px;
}

/* 参数组 */
.param-group {
  margin-bottom: 15px;
}

.param-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
  color: #4ecca3;
  font-size: 14px;
}

.param-group select,
.param-group input {
  width: 100%;
  padding: 8px;
  border: 2px solid #3a3a5c;
  background: #0f3460;
  color: #eee;
  border-radius: 4px;
  font-size: 14px;
}

/* 技能详情 */
.skill-detail {
  background: #16213e;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #4ecca3;
}

.skill-detail h4 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #4ecca3;
}

.detail-description {
  color: #aaa;
  margin-bottom: 20px;
  font-size: 14px;
}

.skill-actions {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-primary {
  background: #4ecca3;
  color: #16213e;
}

.btn-primary:hover:not(:disabled) {
  background: #3bba8f;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(78, 204, 163, 0.4);
}

.btn-primary:disabled {
  background: #3a3a5c;
  color: #666;
  cursor: not-allowed;
}

.btn-secondary {
  background: #3a3a5c;
  color: #eee;
}

.btn-secondary:hover {
  background: #4a4a6c;
}
</style>
