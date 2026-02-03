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
            <div class="opponent-avatar">{{ opponent.name.charAt(0) }}</div>
            <div class="opponent-info">
              <div class="opponent-name">{{ opponent.name }}</div>
              <div class="opponent-stats">
                金币: {{ opponent.gold || 0 }} | 存活城市: {{ getAliveCitiesCount(opponent) }}
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- 显示已知城市 -->
      <div v-else class="known-cities-view">
        <div class="view-header">
          <button class="back-btn" @click="selectedOpponent = null">← 返回</button>
          <h4>{{ selectedOpponent.name }} 的已知城市</h4>
        </div>

        <div v-if="knownCitiesData.length === 0" class="no-cities">
          <div class="empty-icon">🔒</div>
          <p>暂无已知城市</p>
          <p class="hint">使用侦查类技能可以获取对手城市信息</p>
        </div>

        <div v-else class="cities-grid">
          <div
            v-for="cityData in knownCitiesData"
            :key="cityData.cityIdx"
            class="city-card"
          >
            <div class="city-card-header">
              <div class="city-name">{{ cityData.city.name }}</div>
              <div v-if="cityData.cityIdx === selectedOpponent.centerCityName" class="center-badge">中心</div>
            </div>

            <!-- HP信息已隐藏，只显示省份和技能 -->

            <div class="city-province">
              <span class="province-icon">📍</span>
              {{ getProvinceName(cityData.city.name) }}
            </div>

            <div class="city-skill">
              <template v-if="cityData.skill">
                <div class="skill-header">
                  <span class="skill-icon">⚡</span>
                  <span class="skill-name">{{ cityData.skill.name }}</span>
                </div>
                <div class="skill-usage">
                  使用次数：
                  <span class="usage-count">{{ cityData.usageCount }}/{{ cityData.skill.limit || '∞' }}</span>
                </div>
                <div class="skill-type">
                  <span class="type-badge" :class="cityData.skill.type">
                    {{ cityData.skill.type === 'active' ? '主动' : '被动' }}
                  </span>
                  <span class="category-badge" :class="cityData.skill.category">
                    {{ cityData.skill.category === 'battle' ? '战斗' : '非战斗' }}
                  </span>
                </div>
                <button class="view-skill-btn" @click="showSkillDescription(cityData.skill)">
                  点击查看
                </button>
              </template>
              <template v-else>
                <span class="no-skill">暂无专属技能</span>
              </template>
            </div>

            <!-- 阵亡状态已隐藏 -->
          </div>
        </div>
      </div>

      <!-- 技能描述模态框 -->
      <div v-if="selectedSkill" class="skill-description-modal" @click.self="selectedSkill = null">
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
  if (props.allPlayers && props.allPlayers.length > 0) {
    return props.allPlayers.filter(p => p.name !== props.currentPlayer?.name)
  }
  return gameStore.players.filter(p => p.name !== props.currentPlayer?.name)
})

// 获取存活城市数量
function getAliveCitiesCount(player) {
  if (!player.cities) return 0
  return player.cities.filter(c => (c.currentHp || c.hp || 0) > 0 && c.isAlive !== false).length
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

  // 使用 gameStore.getKnownCitiesForPlayer 获取已知城市索引
  // 这个方法内部会处理前缀，防止Firebase将纯数字玩家名转换为数组索引
  const knownIndices = gameStore.getKnownCitiesForPlayer(currentPlayerName, opponentName)

  return knownIndices.map(cityIdx => {
    const city = selectedOpponent.value.cities[cityIdx]
    const skill = getCitySkill(city?.name)
    const usageCount = gameStore.getSkillUsageCount(opponentName, city?.name) || 0

    return {
      cityIdx,
      city,
      skill,
      usageCount
    }
  }).filter(data => data.city) // 过滤掉无效城市
})

// 获取HP百分比
function getHpPercentage(city) {
  const current = city.currentHp !== undefined ? city.currentHp : city.hp
  const max = city.hp || 1
  return Math.max(0, Math.min(100, (current / max) * 100))
}

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
  background: rgba(0, 0, 0, 0.85);
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
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-radius: 20px;
  max-width: 1000px;
  width: 95%;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
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
  padding: 25px 30px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.3);
  background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
}

.modal-header h3 {
  margin: 0;
  color: #60a5fa;
  font-size: 22px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 32px;
  cursor: pointer;
  width: 40px;
  height: 40px;
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
  padding: 30px;
  overflow-y: auto;
  flex: 1;
}

.instruction {
  font-size: 16px;
  color: #cbd5e1;
  margin-bottom: 20px;
  text-align: center;
}

.opponent-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-width: 600px;
  margin: 0 auto;
}

.opponent-btn {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
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
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.opponent-info {
  flex: 1;
  text-align: left;
}

.opponent-name {
  font-size: 20px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 8px;
}

.opponent-stats {
  font-size: 14px;
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
  gap: 15px;
  padding: 20px 30px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
}

.back-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 8px;
  color: #a78bfa;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 600;
}

.back-btn:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(124, 58, 237, 0.3) 100%);
  border-color: rgba(139, 92, 246, 0.6);
  transform: translateX(-2px);
}

.view-header h4 {
  margin: 0;
  font-size: 18px;
  color: #e2e8f0;
  flex: 1;
}

.no-cities {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
  flex: 1;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.no-cities p {
  margin: 8px 0;
  font-size: 16px;
}

.hint {
  font-size: 14px;
  color: #475569;
}

.cities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 30px;
  overflow-y: auto;
  flex: 1;
}

/* 城市卡牌 */
.city-card {
  background: linear-gradient(135deg, #1e3a5f 0%, #0f2642 100%);
  border: 2px solid rgba(96, 165, 250, 0.3);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.city-card:hover {
  border-color: rgba(96, 165, 250, 0.6);
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(96, 165, 250, 0.2);
}

.city-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.city-name {
  font-size: 20px;
  font-weight: 700;
  color: #60a5fa;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.center-badge {
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.city-hp {
  margin-bottom: 15px;
}

.hp-label {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 5px;
}

.hp-value {
  font-size: 24px;
  font-weight: 700;
  color: #10b981;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
}

.hp-bar {
  height: 8px;
  background: rgba(15, 23, 42, 0.6);
  border-radius: 4px;
  overflow: hidden;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  border-radius: 4px;
  transition: width 0.3s;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.city-province {
  font-size: 14px;
  color: #cbd5e1;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.province-icon {
  font-size: 16px;
}

.city-skill {
  padding: 15px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 12px;
  min-height: 100px;
}

.skill-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.skill-icon {
  font-size: 18px;
}

.skill-name {
  font-size: 16px;
  font-weight: 700;
  color: #c084fc;
}

.skill-usage {
  font-size: 14px;
  color: #cbd5e1;
  margin-bottom: 10px;
}

.usage-count {
  font-weight: 700;
  color: #fbbf24;
}

.skill-type {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-badge,
.category-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-badge.active {
  background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
  color: white;
}

.type-badge.passive {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.category-badge.battle {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.category-badge.nonBattle {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.no-skill {
  font-size: 14px;
  color: #64748b;
  font-style: italic;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 70px;
}

.view-skill-btn {
  width: 100%;
  margin-top: 10px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.view-skill-btn:hover {
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* 技能描述模态框 */
.skill-description-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5000;
  animation: fadeIn 0.2s;
}

.skill-description-content {
  background: linear-gradient(135deg, #1e3a5f 0%, #0f2642 100%);
  border: 2px solid #60a5fa;
  border-radius: 16px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  animation: slideUp 0.3s;
}

.skill-description-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
  border-bottom: 2px solid rgba(96, 165, 250, 0.3);
}

.skill-description-header h4 {
  margin: 0;
  font-size: 20px;
  color: #60a5fa;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.close-skill-btn {
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

.close-skill-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  transform: rotate(90deg);
}

.skill-description-body {
  padding: 25px;
  max-height: calc(80vh - 80px);
  overflow-y: auto;
}

.skill-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(96, 165, 250, 0.2);
}

.skill-meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
}

.meta-label {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 600;
}

.meta-value {
  font-size: 14px;
  color: #e2e8f0;
  font-weight: 700;
}

.skill-description-text {
  font-size: 15px;
  line-height: 1.8;
  color: #cbd5e1;
  background: rgba(15, 23, 42, 0.4);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(96, 165, 250, 0.2);
}

/* 滚动条 */
.opponent-selection::-webkit-scrollbar,
.cities-grid::-webkit-scrollbar,
.skill-description-body::-webkit-scrollbar {
  width: 10px;
}

.opponent-selection::-webkit-scrollbar-track,
.cities-grid::-webkit-scrollbar-track,
.skill-description-body::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
  border-radius: 5px;
}

.opponent-selection::-webkit-scrollbar-thumb,
.cities-grid::-webkit-scrollbar-thumb,
.skill-description-body::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 5px;
  border: 2px solid rgba(15, 23, 42, 0.5);
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
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .opponent-btn {
    padding: 15px;
  }

  .opponent-avatar {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
}
</style>
