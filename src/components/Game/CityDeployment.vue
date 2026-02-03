<template>
  <!-- 部署界面带日志布局 -->
  <div class="deployment-with-log-layout">
    <!-- 左侧：部署主界面 -->
    <div class="deployment-main-area">
      <div class="city-deployment panel">
        <div v-if="roomId" class="room-info">房间号: {{ roomId }}</div>
        <h3>玩家{{ currentPlayer?.name }}的游戏界面 - 选择出战城市</h3>
        <div class="deployment-info">
      <div class="info-item">
        <span class="label">当前回合:</span>
        <span class="value">{{ currentRound }}</span>
      </div>
      <div class="info-item">
        <span class="label">金币:</span>
        <span class="value">{{ currentPlayer?.gold || 0 }}</span>
      </div>
      <div class="info-item">
        <span class="label">已选城市:</span>
        <span class="value">{{ selectedCities.length }} / {{ maxDeployCount }}</span>
      </div>
    </div>

    <div class="muted" style="margin: 10px 0;">
      💡 从所有城市中选择最多 {{ maxDeployCount }} 个城市出战
    </div>

    <!-- 所有城市列表 -->
    <div class="roster-cities">
      <h4>所有城市</h4>
      <div class="city-grid">
        <div
          v-for="[cityName, city] in Object.entries(currentPlayer?.cities || {})"
          :key="cityName"
          :class="[
            'city-card',
            {
              'selected': selectedCities.includes(cityName),
              'dead': (city?.currentHp !== undefined ? city?.currentHp : city?.hp || 0) <= 0 || city?.isAlive === false,
              'center': cityName === currentPlayer?.centerCityName
            }
          ]"
          @click="toggleCity(cityName)"
        >
          <div class="city-header">
            <strong>{{ city?.name || '未知' }}</strong>
            <div class="muted" style="font-size: 11px; margin-top: 2px;">
              {{ getProvinceName(city?.name) }}
            </div>
            <span v-if="cityName === currentPlayer?.centerCityName" class="center-badge">中心</span>
          </div>

          <!-- HP水柱可视化 -->
          <div class="city-hp-visual">
            <div class="hp-text">
              HP: {{ Math.floor(city?.currentHp !== undefined ? city?.currentHp : city?.hp || 0) }}
              <span v-if="(city?.currentHp !== undefined ? city?.currentHp : city?.hp || 0) <= 0 || city?.isAlive === false" class="dead-badge">💀</span>
            </div>
            <div class="hp-bar-container">
              <div
                class="hp-bar-fill"
                :style="{
                  width: getHpPercentage(city) + '%',
                  backgroundColor: getHpColor(city)
                }"
              ></div>
            </div>
          </div>
          <div
            class="city-skills"
            :class="{ 'clickable': getCitySkill(city?.name) }"
            @click.stop="showSkillInfo(city?.name)"
          >
            <template v-if="getCitySkill(city?.name)">
              ⚡ {{ getCitySkill(city?.name).name }}
              <span class="skill-hint">点击查看</span>
            </template>
            <template v-else>
              <span class="no-skill">暂无专属技能</span>
            </template>
          </div>

          <!-- 战斗主动技能激活选项 -->
          <div
            v-if="selectedCities.includes(cityName) && getCitySkill(city?.name)?.type === 'active' && getCitySkill(city?.name)?.category === 'battle'"
            class="city-skill-activation"
            @click.stop
          >
            <label class="skill-toggle">
              <input
                type="checkbox"
                v-model="activatedCitySkills[cityName]"
                :disabled="getSkillUsageCount(city?.name) >= getCitySkill(city?.name)?.limit"
              />
              <span class="skill-toggle-text">
                激活技能
                <span class="skill-usage">({{ getSkillUsageCount(city?.name) }}/{{ getCitySkill(city?.name)?.limit }}次)</span>
              </span>
            </label>
          </div>

          <div class="city-status">
            {{ selectedCities.includes(cityName) ? '✓ 已选择' : ((city?.currentHp !== undefined ? city?.currentHp : city?.hp || 0) <= 0 || city?.isAlive === false) ? '已阵亡' : '点击选择' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 非战斗城市技能区域 -->
    <div v-if="nonBattleCitySkills.length > 0" class="nonbattle-city-skills-section">
      <h4>非战斗城市专属技能</h4>
      <div class="city-skills-horizontal-scroll">
        <div
          v-for="item in nonBattleCitySkills"
          :key="item.cityName"
          class="city-skill-card"
          @click="showSkillInfo(item.cityName)"
        >
          <div class="skill-card-icon">⚡</div>
          <div class="skill-card-content">
            <div class="skill-card-city">{{ item.cityName }}</div>
            <div class="skill-card-name">{{ item.skill.name }}</div>
            <div class="skill-card-type">
              <span class="type-badge" :class="item.skill.type">
                {{ item.skill.type === 'active' ? '主动' : '被动' }}
              </span>
            </div>
            <div v-if="item.skill.limit" class="skill-card-usage">
              使用: {{ item.usageCount }}/{{ item.skill.limit }}
            </div>
            <div v-else class="skill-card-usage unlimited">
              无限制
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 金币技能和情报区域 -->
    <div class="skills-section">
      <h4>金币技能</h4>
      <div class="skills-buttons">
        <button class="skill-btn skill-btn--battle" @click="showBattleSkills = true">
          ⚔️ 使用战斗金币技能 (当前金币: {{ currentPlayer?.gold || 0 }})
        </button>
        <button class="skill-btn skill-btn--nonbattle" @click="showNonBattleSkills = true">
          ✨ 使用非战斗金币技能 (当前金币: {{ currentPlayer?.gold || 0 }})
        </button>
      </div>
    </div>

    <!-- 情报侦查区域 -->
    <div class="intelligence-section">
      <h4>情报侦查</h4>
      <button class="intelligence-btn" @click="showOpponentCities = true">
        🔍 查看对手已知城市
      </button>
    </div>

    <!-- 确认按钮 -->
    <div class="action-buttons">
      <button
        class="confirm-btn"
        :disabled="selectedCities.length === 0"
        @click="confirmDeployment"
      >
        确认出战
      </button>
      <button class="cancel-btn" @click="$emit('cancel')">
        取消
      </button>
    </div>

    <!-- 战斗金币技能选择器 -->
    <SkillSelector
      v-if="showBattleSkills"
      title="战斗金币技能"
      :current-player="currentPlayer"
      skill-type="battle"
      @skill-used="handleSkillUsed"
      @skill-failed="handleSkillFailed"
      @close="showBattleSkills = false"
    />

    <!-- 非战斗金币技能选择器 -->
    <SkillSelector
      v-if="showNonBattleSkills"
      title="非战斗金币技能"
      :current-player="currentPlayer"
      skill-type="nonBattle"
      @skill-used="handleSkillUsed"
      @skill-failed="handleSkillFailed"
      @close="showNonBattleSkills = false"
    />

    <!-- 对手已知城市查看器 -->
    <OpponentKnownCities
      v-if="showOpponentCities"
      :current-player="currentPlayer"
      :all-players="allPlayers"
      @close="showOpponentCities = false"
    />

    <!-- 城市技能详情模态框 -->
    <div
      v-if="showSkillDetail"
      class="skill-detail-modal"
      @click.self="showSkillDetail = false"
    >
      <div class="skill-detail-content">
        <div class="skill-detail-header">
          <h3>{{ selectedSkillInfo?.name }}</h3>
          <button class="close-btn" @click="showSkillDetail = false">×</button>
        </div>
        <div class="skill-detail-body">
          <div class="skill-badges">
            <div class="skill-type-badge" :class="selectedSkillInfo?.type">
              {{ selectedSkillInfo?.type === 'active' ? '主动技能' : '被动技能' }}
            </div>
            <div class="skill-category-badge" :class="selectedSkillInfo?.category">
              {{ selectedSkillInfo?.category === 'battle' ? '战斗技能' : '非战斗技能' }}
            </div>
          </div>
          <div class="skill-description">
            {{ selectedSkillInfo?.description }}
          </div>
          <div v-if="selectedSkillInfo?.limit" class="skill-meta">
            <div class="meta-item">
              <span class="meta-label">使用次数：</span>
              <span class="meta-value">{{ selectedSkillUsageCount }} / {{ selectedSkillInfo.limit }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 金币技能详情模态框 -->
    <div
      v-if="showGoldSkillDetail"
      class="skill-detail-modal"
      @click.self="showGoldSkillDetail = false"
    >
      <div class="skill-detail-content">
        <div class="skill-detail-header">
          <h3>{{ selectedGoldSkill?.name }}</h3>
          <button class="close-btn" @click="showGoldSkillDetail = false">×</button>
        </div>
        <div class="skill-detail-body">
          <div class="skill-badges">
            <div class="skill-cost-badge">
              金币消耗：{{ selectedGoldSkill?.cost }}
            </div>
          </div>
          <div class="skill-description">
            {{ selectedGoldSkill?.description }}
          </div>
        </div>
      </div>
    </div>
      </div>
    </div>

    <!-- 右侧：固定日志面板 -->
    <div class="deployment-log-area">
      <GameLogSimple :current-player-name="currentPlayer?.name" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useNotification } from '../../composables/useNotification'
import { SKILL_COSTS } from '../../constants/skillCosts'
import { getCitySkill } from '../../data/citySkills'
import { BATTLE_SKILLS, SKILL_DESCRIPTIONS } from '../../data/goldSkills'
import { PROVINCE_MAP } from '../../data/cities'
import SkillSelector from '../Skills/SkillSelector.vue'
import GameLogSimple from './GameLogSimple.vue'
import OpponentKnownCities from './OpponentKnownCities.vue'

const props = defineProps({
  currentPlayer: {
    type: Object,
    required: true
  },
  gameMode: {
    type: String,
    default: '2P'
  },
  allPlayers: {
    type: Array,
    default: () => []
  },
  roomId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['deployment-confirmed', 'cancel', 'skill-used'])

const gameStore = useGameStore()
const { showNotification } = useNotification()

const selectedCities = ref([])
const showBattleSkills = ref(false)
const showNonBattleSkills = ref(false)
const showOpponentCities = ref(false)
const activatedCitySkills = ref({}) // { cityName: true/false } - tracks which city skills are activated

// 城市技能详情显示状态
const showSkillDetail = ref(false)
const selectedSkillInfo = ref(null)
const selectedCityName = ref('')

// 金币技能详情显示状态
const showGoldSkillDetail = ref(false)
const selectedGoldSkill = ref(null)

// 诊断日志：检查组件接收到的数据
console.log('[CityDeployment] ===== 组件数据诊断 =====')
console.log('[CityDeployment] currentPlayer.name:', props.currentPlayer?.name)
console.log('[CityDeployment] currentPlayer.cities 数量:', Object.keys(props.currentPlayer?.cities || {}).length)
console.log('[CityDeployment] currentPlayer.cities 详情:')
Object.entries(props.currentPlayer?.cities || {}).forEach(([cityName, city]) => {
  console.log(`  [${cityName}] ${city.name} (HP: ${city.currentHp ?? city.hp})`)
})
console.log('[CityDeployment] ===========================')

// 计算最大出战数量
const maxDeployCount = computed(() => {
  // 根据游戏模式确定最大出战数量
  if (props.gameMode === '2P') {
    return 3  // 2P模式：最多派出3张牌
  } else if (props.gameMode === '3P') {
    return 2  // 3P模式：对每个对手最多派出2张牌
  } else if (props.gameMode === '2v2') {
    return 2  // 2v2模式：最多派出2张牌
  }
  return 3  // 默认值
})

// 当前回合
const currentRound = computed(() => gameStore.currentRound)

// 可用的战斗金币技能（来自goldSkills.js）
const availableBattleSkills = computed(() => {
  // 根据游戏模式过滤技能，并调整按兵不动的金币消耗
  return BATTLE_SKILLS.map(skill => {
    // 按兵不动在3P模式下消耗4金币，其他模式消耗2金币
    if (skill.name === '按兵不动') {
      return {
        ...skill,
        cost: props.gameMode === '3P' ? 4 : 2
      }
    }
    return skill
  }).filter(skill => {
    // 如果技能有模式限制，检查当前模式是否符合
    if (skill.modes && !skill.modes.includes(props.gameMode)) {
      return false
    }
    return true
  })
})

// 获取所有非战斗类型的城市专属技能
const nonBattleCitySkills = computed(() => {
  if (!props.currentPlayer?.cities) return []

  const skills = []
  Object.entries(props.currentPlayer.cities).forEach(([cityName, city]) => {
    const skill = getCitySkill(city?.name)
    if (skill && skill.category === 'nonBattle') {
      skills.push({
        cityName,
        cityDisplayName: city?.name,
        skill,
        usageCount: getSkillUsageCount(city?.name)
      })
    }
  })

  return skills
})

/**
 * 切换城市选择
 */
function toggleCity(cityName) {
  const city = props.currentPlayer.cities[cityName]

  // 检查城市是否已阵亡（优先检查currentHp，如果没有则使用hp）
  const currentHp = city?.currentHp !== undefined ? city.currentHp : city?.hp
  if (!city || currentHp <= 0 || city.isAlive === false) {
    showNotification('该城市已阵亡，无法出战！', 'warning')
    return
  }

  const index = selectedCities.value.indexOf(cityName)

  if (index > -1) {
    // 取消选择
    selectedCities.value.splice(index, 1)
    // 取消选择时也清除技能激活状态
    delete activatedCitySkills.value[cityName]
  } else {
    // 选择
    if (selectedCities.value.length >= maxDeployCount.value) {
      showNotification(`最多只能选择 ${maxDeployCount.value} 个城市出战！`, 'warning')
      return
    }
    selectedCities.value.push(cityName)
  }
}

/**
 * 获取城市技能使用次数
 */
function getSkillUsageCount(cityName) {
  // 使用城市名作为技能标识符
  const playerName = props.currentPlayer.name
  return gameStore.getSkillUsageCount(playerName, cityName) || 0
}

/**
 * 显示技能详情
 */
function showSkillInfo(cityName) {
  const skill = getCitySkill(cityName)
  if (skill) {
    selectedSkillInfo.value = skill
    selectedCityName.value = cityName
    showSkillDetail.value = true
  }
}

/**
 * 显示金币技能详情
 */
function showGoldSkillInfo(skillName) {
  const description = SKILL_DESCRIPTIONS[skillName]
  const skillData = availableBattleSkills.value.find(s => s.name === skillName)

  if (description && skillData) {
    selectedGoldSkill.value = {
      name: skillName,
      cost: skillData.cost,
      description: description
    }
    showGoldSkillDetail.value = true
  }
}

/**
 * 当前选中技能的使用次数
 */
const selectedSkillUsageCount = computed(() => {
  if (!selectedCityName.value) return 0
  return getSkillUsageCount(selectedCityName.value)
})

/**
 * 处理非战斗技能使用成功
 */
function handleSkillUsed(data) {
  console.log('[CityDeployment] 技能使用成功', data)
  showNotification(`成功使用技能: ${data.skillName || data.skill}`, 'success')
  showBattleSkills.value = false
  showNonBattleSkills.value = false

  // 关键修复：emit 事件给父组件 PlayerModeOnline，让它同步数据到 Firebase
  console.log('[CityDeployment] emit skill-used 事件给父组件', data)
  emit('skill-used', data)
}

/**
 * 处理非战斗技能使用失败
 */
function handleSkillFailed(data) {
  console.log('[CityDeployment] 技能使用失败', data)
  const message = data.result?.message || data.error || '未知错误'

  // 显示通知
  showNotification(`技能使用失败: ${message}`, 'error')

  // 显示弹窗提示
  alert(`❌ 技能使用失败\n\n技能名称：${data.skill}\n失败原因：${message}`)
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
 * 计算HP百分比
 */
function getHpPercentage(city) {
  if (!city) return 0
  const currentHp = city.currentHp !== undefined ? city.currentHp : city.hp || 0
  const maxHp = city.hp || 1
  return Math.max(0, Math.min(100, (currentHp / maxHp) * 100))
}

/**
 * 根据HP百分比返回颜色
 */
function getHpColor(city) {
  const percentage = getHpPercentage(city)
  if (percentage > 70) return '#3b82f6' // 蓝色 - 健康
  if (percentage > 40) return '#f59e0b' // 橙色 - 中等
  if (percentage > 0) return '#ef4444' // 红色 - 危险
  return '#6b7280' // 灰色 - 阵亡
}

/**
 * 确认部署
 */
function confirmDeployment() {
  // 检查是否至少选择了一个城市
  if (selectedCities.value.length === 0) {
    showNotification('请至少选择一个城市出战！', 'warning')
    return
  }

  // 收集被激活的城市技能信息
  const activatedSkills = {}
  Object.keys(activatedCitySkills.value).forEach(cityName => {
    if (activatedCitySkills.value[cityName] && selectedCities.value.includes(cityName)) {
      const city = props.currentPlayer.cities[cityName]
      const skill = getCitySkill(city?.name)
      if (skill) {
        activatedSkills[cityName] = {
          cityName: city.name,
          skillName: skill.name,
          skillData: skill
        }
      }
    }
  })

  // 确认部署
  emit('deployment-confirmed', {
    cities: selectedCities.value,
    activatedCitySkills: activatedSkills
  })

  // 添加诊断日志
  console.log('[CityDeployment] 确认部署')
  console.log('[CityDeployment] selectedCities:', selectedCities.value)
  selectedCities.value.forEach(cityName => {
    const city = props.currentPlayer.cities[cityName]
    console.log(`[CityDeployment] 选中城市 cityName=${cityName}, name=${city?.name}`)
  })
}
</script>

<style scoped>
.city-deployment {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
}

.room-info {
  font-size: 13px;
  color: #9ca3af;
  margin-bottom: 8px;
  padding: 6px 12px;
  background: rgba(59, 130, 246, 0.1);
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
}

.deployment-info {
  display: flex;
  gap: 20px;
  margin: 15px 0;
  padding: 15px;
  background: #1f2937;
  border-radius: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.label {
  font-size: 12px;
  color: var(--muted);
}

.value {
  font-size: 18px;
  font-weight: bold;
  color: var(--accent);
}

.roster-cities h4 {
  margin: 15px 0 10px 0;
  color: var(--text);
}

.city-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.city-card {
  background: var(--panel);
  border: 2px solid #1f2937;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.city-card:hover:not(.dead) {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.city-card.selected {
  border-color: var(--good);
  background: #18432f;
}

.city-card.dead {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #4b5563;
}

.city-card.center {
  border-color: var(--warn);
}

.city-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.center-badge {
  background: var(--warn);
  color: #0f172a;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

/* HP水柱可视化样式 */
.city-hp-visual {
  margin: 8px 0;
}

.hp-text {
  font-size: 14px;
  color: var(--text);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hp-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3);
}

.hp-bar-fill {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
  border-radius: 4px;
  box-shadow: 0 0 8px currentColor;
}

.dead-badge {
  margin-left: 5px;
}

.city-skills {
  font-size: 13px;
  color: #9ca3af;
  margin: 5px 0;
}

.city-status {
  margin-top: 8px;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}

.city-skill-activation {
  margin-top: 10px;
  padding: 8px;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 6px;
}

.skill-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.skill-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--accent);
}

.skill-toggle input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.skill-toggle-text {
  font-size: 13px;
  color: var(--text);
  font-weight: 500;
}

.skill-usage {
  font-size: 11px;
  color: var(--muted);
  margin-left: 4px;
}

.battle-skill-section {
  margin: 20px 0;
}

.battle-skill-section h4 {
  margin-bottom: 10px;
  color: var(--text);
}

.skill-select {
  width: 100%;
  padding: 12px;
  background: var(--panel);
  border: 1px solid #374151;
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
}

.skill-select option:disabled {
  color: #6b7280;
}

.skills-section {
  margin: 20px 0;
  padding: 20px;
  background: #1f2937;
  border-radius: 8px;
}

.skills-section h4 {
  margin: 0 0 15px 0;
  color: var(--text);
}

.intelligence-section {
  margin: 20px 0;
  padding: 20px;
  background: linear-gradient(135deg, #1e3a5f 0%, #0f2642 100%);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
}

.intelligence-section h4 {
  margin: 0 0 15px 0;
  color: #60a5fa;
  font-size: 16px;
  font-weight: 700;
}

.intelligence-btn {
  width: 100%;
  padding: 15px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
}

.intelligence-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(59, 130, 246, 0.4);
}

.skills-buttons {
  display: flex;
  flex-direction: row;
  gap: 15px;
}

.skill-btn {
  flex: 1;
  padding: 15px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  text-align: center;
}

.skill-btn--battle {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);
}

.skill-btn--battle:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(239, 68, 68, 0.4);
}

.skill-btn--nonbattle {
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  box-shadow: 0 4px 6px rgba(139, 92, 246, 0.3);
}

.skill-btn--nonbattle:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(139, 92, 246, 0.4);
}

.battle-skill-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.battle-skill-select label {
  font-size: 14px;
  color: var(--text);
  font-weight: 500;
}

.skill-selector-container {
  display: flex;
  gap: 10px;
  align-items: center;
}

.skill-select {
  flex: 1;
  padding: 12px;
  background: var(--panel);
  border: 1px solid #374151;
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
}

.skill-select option:disabled {
  color: #6b7280;
}

.view-skill-btn {
  padding: 12px 20px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.view-skill-btn:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(139, 92, 246, 0.4);
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.confirm-btn,
.cancel-btn {
  flex: 1;
  padding: 15px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
}

.confirm-btn {
  background: var(--good);
  color: #0f172a;
}

.confirm-btn:hover:not(:disabled) {
  background: #10b981;
}

.confirm-btn:disabled {
  background: var(--muted);
  cursor: not-allowed;
}

.cancel-btn {
  background: var(--bad);
  color: white;
}

.cancel-btn:hover {
  background: #dc2626;
}

/* 城市技能样式 */
.city-skills {
  font-size: 13px;
  color: #f093fb;
  margin: 6px 0;
  min-height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.city-skills.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.city-skills.clickable:hover {
  color: #d946ef;
  transform: scale(1.05);
}

.city-skills .skill-hint {
  font-size: 10px;
  color: #a855f7;
  opacity: 0.7;
}

.city-skills.clickable:hover .skill-hint {
  opacity: 1;
}

.no-skill {
  color: #999;
  font-style: italic;
}

/* 技能详情模态框 */
.skill-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.skill-detail-content {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 16px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s;
  border: 2px solid #8b5cf6;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.skill-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #334155;
}

.skill-detail-header h3 {
  margin: 0;
  color: #f093fb;
  font-size: 20px;
  font-weight: bold;
}

.skill-detail-header .close-btn {
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 28px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.skill-detail-header .close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.skill-detail-body {
  padding: 25px;
}

.skill-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.skill-type-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.skill-category-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.skill-type-badge.active {
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  color: white;
}

.skill-type-badge.passive {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.skill-category-badge.battle {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  color: white;
}

.skill-category-badge.nonBattle {
  background: linear-gradient(135deg, #38a169 0%, #48bb78 100%);
  color: white;
}

.skill-cost-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.skill-description {
  background: rgba(139, 92, 246, 0.1);
  border-left: 4px solid #8b5cf6;
  padding: 15px;
  border-radius: 8px;
  color: var(--text);
  line-height: 1.6;
  margin-bottom: 15px;
  font-size: 14px;
}

.skill-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meta-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(30, 41, 59, 0.5);
  border-radius: 6px;
}

.meta-label {
  font-size: 13px;
  color: var(--muted);
}

.meta-value {
  font-size: 14px;
  font-weight: bold;
  color: #fbbf24;
}

/* 非战斗城市专属技能横向滚动区域 */
.nonbattle-city-skills-section {
  margin: 20px 0;
  padding: 20px;
  background: linear-gradient(135deg, #1e3a5f 0%, #0f2642 100%);
  border: 2px solid rgba(139, 92, 246, 0.3);
  border-radius: 8px;
}

.nonbattle-city-skills-section h4 {
  margin: 0 0 15px 0;
  color: #c084fc;
  font-size: 16px;
  font-weight: 700;
}

.city-skills-horizontal-scroll {
  display: flex;
  flex-direction: row;
  gap: 15px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 15px 5px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* 自定义横向滚动条 */
.city-skills-horizontal-scroll::-webkit-scrollbar {
  height: 8px;
}

.city-skills-horizontal-scroll::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 4px;
}

.city-skills-horizontal-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%);
  border-radius: 4px;
  border: 1px solid rgba(15, 23, 42, 0.5);
}

.city-skills-horizontal-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #a78bfa 0%, #818cf8 100%);
}

.city-skill-card {
  min-width: 220px;
  max-width: 220px;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%);
  border: 2px solid rgba(139, 92, 246, 0.4);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.city-skill-card:hover {
  border-color: rgba(139, 92, 246, 0.8);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.25) 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(139, 92, 246, 0.4);
}

.skill-card-icon {
  font-size: 28px;
  text-align: center;
  filter: drop-shadow(0 2px 4px rgba(139, 92, 246, 0.5));
}

.skill-card-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.skill-card-city {
  font-size: 14px;
  font-weight: 700;
  color: #60a5fa;
  text-align: center;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(139, 92, 246, 0.3);
}

.skill-card-name {
  font-size: 15px;
  font-weight: 700;
  color: #c084fc;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.skill-card-type {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 4px;
}

.skill-card-type .type-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.skill-card-type .type-badge.active {
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.skill-card-type .type-badge.passive {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.skill-card-usage {
  font-size: 12px;
  color: #cbd5e1;
  text-align: center;
  padding: 6px;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 6px;
  font-weight: 600;
}

.skill-card-usage.unlimited {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

/* 部署界面带日志布局 */
.deployment-with-log-layout {
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 20px;
  height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  overflow: hidden;
  transition: grid-template-columns 0.3s ease;
}

.deployment-with-log-layout:has(.collapsed) {
  grid-template-columns: 1fr 60px;
}

.deployment-main-area {
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 16px;
  min-width: 0;
}

.deployment-log-area {
  height: 100%;
  overflow: hidden;
  position: relative;
  z-index: 50;
}

/* 自定义滚动条 */
.deployment-main-area::-webkit-scrollbar {
  width: 10px;
}

.deployment-main-area::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

.deployment-main-area::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
  border-radius: 5px;
}

.deployment-main-area::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .deployment-with-log-layout {
    grid-template-columns: 1fr 400px;
  }

  .deployment-with-log-layout:has(.collapsed) {
    grid-template-columns: 1fr 60px;
  }
}

@media (max-width: 1024px) {
  .deployment-with-log-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 300px;
  }

  .deployment-with-log-layout:has(.collapsed) {
    grid-template-rows: 1fr 60px;
  }
}

@media (max-width: 768px) {
  .deployment-with-log-layout {
    padding: 10px;
    gap: 10px;
    grid-template-rows: 1fr 250px;
  }

  .deployment-with-log-layout:has(.collapsed) {
    grid-template-rows: 1fr 60px;
  }
}

</style>
