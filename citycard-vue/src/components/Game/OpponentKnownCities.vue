<template>
  <div class="opponent-known-cities-modal" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>🔍 查看对手已知城市</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <!-- 选择对手 -->
      <div v-if="!selectedOpponent" class="opponent-selection">
        <p class="instruction">请选择要查看的对手：</p>
        <div class="opponent-list">
          <button
            v-for="opponent in opponents"
            :key="opponent.name"
            class="opponent-btn"
            @click="selectOpponent(opponent)"
          >
            <div class="opponent-avatar">{{ opponent.name?.charAt(0) || '?' }}</div>
            <div class="opponent-info">
              <div class="opponent-name">{{ opponent.name }}</div>
              <div class="opponent-stats">
                存活城市: {{ getAliveCitiesCount(opponent) }}
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- 显示已知城市 -->
      <div v-else class="known-cities-view">
        <div class="view-header">
          <button class="back-btn" @click="selectedOpponent = null">← 返回</button>
          <h4>{{ selectedOpponent.name }} 的已知城市（{{ knownCitiesData.length }}座）</h4>
        </div>

        <div v-if="knownCitiesData.length === 0" class="no-cities">
          <div class="empty-icon">🔒</div>
          <p>暂无已知城市</p>
          <p class="hint">使用侦查类技能可以获取对手城市信息</p>
        </div>

        <div v-else class="cities-grid">
          <div
            v-for="cityData in knownCitiesData"
            :key="cityData.cityName"
            class="city-card"
            @click="cityData.skill ? showSkillDescription(cityData.skill) : null"
          >
            <div class="city-card-top">
              <div class="city-name">
                {{ cityData.city.name }}
              </div>
              <div class="city-province">📍{{ getProvinceName(cityData.city.name) }}</div>
            </div>

            <!-- 城市专属技能（暂时隐藏，重做中） -->
            <!-- <div class="city-skill-row" v-if="cityData.skill">
              <span class="skill-name-text">{{ cityData.skill.name }}</span>
              <span class="skill-usage-text">{{ cityData.usageCount }}/{{ cityData.skill.limit || '∞' }}</span>
              <span class="type-badge" :class="cityData.skill.type">
                {{ cityData.skill.type === 'active' ? '主动' : '被动' }}
              </span>
            </div>
            <div class="city-skill-row no-skill-row" v-else>
              <span class="no-skill-text">暂无专属技能</span>
            </div> -->
          </div>
        </div>
      </div>

      <!-- 技能描述模态框（暂时隐藏，重做中） -->
      <div v-if="false && selectedSkill" class="skill-description-modal" @click.self="selectedSkill = null">
        <div class="skill-description-content">
          <div class="skill-description-header">
            <h4>{{ selectedSkill.name }}</h4>
            <button class="close-skill-btn" @click="selectedSkill = null">×</button>
          </div>
          <div class="skill-description-body">
            <div class="skill-meta">
              <span class="skill-meta-item">
                <span class="meta-label">类型:</span>
                <span class="meta-value">{{ selectedSkill.type === 'active' ? '主动技能' : '被动技能' }}</span>
              </span>
              <span class="skill-meta-item">
                <span class="meta-label">分类:</span>
                <span class="meta-value">{{ selectedSkill.category === 'battle' ? '战斗技能' : '非战斗技能' }}</span>
              </span>
              <span v-if="selectedSkill.limit" class="skill-meta-item">
                <span class="meta-label">使用限制:</span>
                <span class="meta-value">{{ selectedSkill.limit }}次/局</span>
              </span>
            </div>
            <div class="skill-description-text">
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
import { useGameStore } from '../../stores/gameStore'
import { getCitySkill } from '../../data/citySkills'
import { PROVINCE_MAP } from '../../data/cities'

const props = defineProps({
  currentPlayer: {
    type: Object,
    required: true
  },
  allPlayers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const gameStore = useGameStore()
const selectedOpponent = ref(null)
const selectedSkill = ref(null)

// 获取所有对手
const opponents = computed(() => {
  const source = (props.allPlayers && props.allPlayers.length > 0) ? props.allPlayers : gameStore.players
  return source.filter(p => p && p.name && p.name !== props.currentPlayer?.name)
})

// 获取存活城市数量
function getAliveCitiesCount(player) {
  if (!player.cities) return 0
  return Object.values(player.cities).filter(c => (c.currentHp || c.hp || 0) > 0 && c.isAlive !== false).length
}

// 选择对手
function selectOpponent(opponent) {
  selectedOpponent.value = opponent
}

// 获取已知城市数据
const knownCitiesData = computed(() => {
  if (!selectedOpponent.value) return []

  const opponentName = selectedOpponent.value.name
  const currentPlayerName = props.currentPlayer.name

  const knownIndices = gameStore.getKnownCitiesForPlayer(currentPlayerName, opponentName)

  return knownIndices.map(cityName => {
    const city = selectedOpponent.value.cities[cityName]
    const skill = getCitySkill(city?.name)
    const usageCount = gameStore.getSkillUsageCount(opponentName, city?.name) || 0

    return {
      cityName,
      city,
      skill,
      usageCount
    }
  }).filter(data => data.city)
})

// 获取省份名称
function getProvinceName(cityName) {
  const province = PROVINCE_MAP[cityName]
  if (!province) return '未知'

  if (province.name === '直辖市和特区') {
    if (cityName === '香港特别行政区') return '香港特别行政区'
    if (cityName === '澳门特别行政区') return '澳门特别行政区'
    if (cityName.includes('市')) return '直辖市'
    return province.name
  }

  return province.name
}

// 显示技能描述
function showSkillDescription(skill) {
  selectedSkill.value = skill
}
</script>

<style scoped>
.opponent-known-cities-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(30, 41, 59, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: linear-gradient(135deg, #f1f5f9 0%, #f0f3f9 100%);
  border-radius: 16px;
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(30, 41, 59, 0.35);
  border: 2px solid #3b82f6;
  animation: slideUp 0.3s;
  display: flex;
  flex-direction: column;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, #c7d2fe 0%, #ddd6fe 100%);
  flex-shrink: 0;
}

.modal-header h3 {
  margin: 0;
  color: #60a5fa;
  font-size: 18px;
  font-weight: 700;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 28px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  transform: rotate(90deg);
}

/* 选择对手 */
.opponent-selection {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.instruction {
  font-size: 15px;
  color: #64748b;
  margin-bottom: 16px;
  text-align: center;
}

.opponent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 500px;
  margin: 0 auto;
}

.opponent-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.opponent-btn:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%);
  border-color: rgba(59, 130, 246, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
}

.opponent-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
  color: white;
  flex-shrink: 0;
}

.opponent-info {
  flex: 1;
  text-align: left;
}

.opponent-name {
  font-size: 17px;
  font-weight: 700;
  color: #334155;
  margin-bottom: 4px;
}

.opponent-stats {
  font-size: 13px;
  color: #94a3b8;
}

/* 已知城市视图 */
.known-cities-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.view-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  flex-shrink: 0;
}

.back-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 6px;
  color: #a78bfa;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  font-weight: 600;
}

.back-btn:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(124, 58, 237, 0.3) 100%);
  border-color: rgba(139, 92, 246, 0.6);
}

.view-header h4 {
  margin: 0;
  font-size: 15px;
  color: #334155;
  flex: 1;
}

.no-cities {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  color: #64748b;
  flex: 1;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-cities p {
  margin: 4px 0;
  font-size: 14px;
}

.hint {
  font-size: 13px;
  color: #475569;
}

/* 紧凑城市列表 */
.cities-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 16px;
  overflow-y: auto;
  flex: 1;
}

/* 城市卡牌 - 紧凑行式布局 */
.city-card {
  background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%);
  border: 1.5px solid rgba(96, 165, 250, 0.25);
  border-radius: 10px;
  padding: 10px 14px;
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.city-card:hover {
  border-color: rgba(96, 165, 250, 0.6);
  background: linear-gradient(135deg, #c7d2fe 0%, #bfdbfe 100%);
}

.city-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.city-name {
  font-size: 16px;
  font-weight: 700;
  color: #60a5fa;
  display: flex;
  align-items: center;
  gap: 8px;
}

.center-badge {
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.city-province {
  font-size: 13px;
  color: #94a3b8;
  white-space: nowrap;
  flex-shrink: 0;
}

/* 技能行 */
.city-skill-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: rgba(139, 92, 246, 0.08);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 6px;
  flex-wrap: wrap;
}

.skill-name-text {
  font-size: 14px;
  font-weight: 700;
  color: #c084fc;
}

.skill-usage-text {
  font-size: 13px;
  font-weight: 700;
  color: #fbbf24;
}

.type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
}

.type-badge.active {
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  color: white;
}

.type-badge.passive {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.no-skill-row {
  background: rgba(100, 116, 139, 0.08);
  border-color: rgba(100, 116, 139, 0.15);
}

.no-skill-text {
  font-size: 13px;
  color: #64748b;
  font-style: italic;
}

/* 技能描述模态框 */
.skill-description-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(30, 41, 59, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5000;
  animation: fadeIn 0.2s;
}

.skill-description-content {
  background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%);
  border: 2px solid #60a5fa;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(30, 41, 59, 0.35);
  animation: slideUp 0.3s;
}

.skill-description-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #c7d2fe 0%, #ddd6fe 100%);
  border-bottom: 2px solid rgba(96, 165, 250, 0.3);
}

.skill-description-header h4 {
  margin: 0;
  font-size: 18px;
  color: #60a5fa;
  font-weight: 700;
}

.close-skill-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 24px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-skill-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  transform: rotate(90deg);
}

.skill-description-body {
  padding: 20px;
  max-height: calc(80vh - 70px);
  overflow-y: auto;
}

.skill-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(96, 165, 250, 0.2);
}

.skill-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
}

.meta-label {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}

.meta-value {
  font-size: 13px;
  color: #334155;
  font-weight: 700;
}

.skill-description-text {
  font-size: 14px;
  line-height: 1.7;
  color: #64748b;
  background: rgba(241, 245, 251, 0.5);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(96, 165, 250, 0.2);
}

/* 滚动条 */
.opponent-selection::-webkit-scrollbar,
.cities-grid::-webkit-scrollbar,
.skill-description-body::-webkit-scrollbar {
  width: 8px;
}

.opponent-selection::-webkit-scrollbar-track,
.cities-grid::-webkit-scrollbar-track,
.skill-description-body::-webkit-scrollbar-track {
  background: rgba(241, 245, 251, 0.6);
  border-radius: 4px;
}

.opponent-selection::-webkit-scrollbar-thumb,
.cities-grid::-webkit-scrollbar-thumb,
.skill-description-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 4px;
  border: 2px solid rgba(241, 245, 251, 0.6);
}

.opponent-selection::-webkit-scrollbar-thumb:hover,
.cities-grid::-webkit-scrollbar-thumb:hover,
.skill-description-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
}

/* 响应式 */
@media (max-width: 768px) {
  .modal-content {
    width: 98%;
    max-height: 95vh;
  }

  .cities-grid {
    padding: 8px 10px;
  }

  .city-card {
    padding: 8px 12px;
  }

  .city-name {
    font-size: 14px;
  }
}
</style>
