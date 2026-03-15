<template>
  <div class="battle-result-display">
    <!-- 战斗卡片列表 -->
    <transition-group name="battle-list" tag="div" class="battle-cards">
      <div
        v-for="(result, index) in battleResults"
        :key="`battle-${index}-${result.timestamp}`"
        class="battle-card"
        :class="{ 'highlight': index === 0 }"
      >
        <!-- 战斗回合标题 -->
        <div class="battle-header">
          <span class="badge">回合 {{ result.round }}</span>
          <span class="muted">{{ formatTime(result.timestamp) }}</span>
        </div>

        <!-- 对战双方 -->
        <div class="battle-matchup">
          <div class="combatant attacker">
            <div class="combatant-name">
              <span class="icon">⚔️</span>
              {{ result.attacker }}
            </div>
            <div class="combatant-stats">
              <div class="stat">
                <span class="label">攻击力</span>
                <span class="value good">{{ formatNumber(result.attackPower) }}</span>
              </div>
              <div class="stat">
                <span class="label">出战城市</span>
                <span class="value">{{ result.attackingCities }}</span>
              </div>
            </div>
          </div>

          <div class="vs">VS</div>

          <div class="combatant defender">
            <div class="combatant-name">
              <span class="icon">🛡️</span>
              {{ result.defender }}
            </div>
            <div class="combatant-stats">
              <div class="stat">
                <span class="label">防御力</span>
                <span class="value warn">{{ formatNumber(result.defensePower) }}</span>
              </div>
              <div class="stat">
                <span class="label">出战城市</span>
                <span class="value">{{ result.defendingCities }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 战斗结果 -->
        <div class="battle-outcome">
          <!-- 护盾处理 -->
          <div v-if="result.barrierDamage > 0" class="outcome-item barrier">
            <span class="icon">🛡️</span>
            <span class="text">护盾吸收 {{ formatNumber(result.barrierDamage) }} 伤害</span>
            <span v-if="result.barrierReflect > 0" class="text">
              反弹 {{ formatNumber(result.barrierReflect) }} 伤害
            </span>
          </div>

          <!-- 净伤害 -->
          <div class="outcome-item damage">
            <span class="icon">💥</span>
            <span class="text">
              造成 <strong class="bad">{{ formatNumber(result.netDamage) }}</strong> 点伤害
            </span>
          </div>

          <!-- 摧毁的城市 -->
          <div v-if="result.casualties && result.casualties.length > 0" class="outcome-item casualties">
            <span class="icon">💀</span>
            <span class="text">摧毁城市：</span>
            <div class="casualty-list">
              <span
                v-for="(city, idx) in result.casualties"
                :key="idx"
                class="casualty-badge bad"
              >
                {{ city }}
              </span>
            </div>
          </div>

          <!-- 特殊效果 -->
          <div v-if="result.specialEffects && result.specialEffects.length > 0" class="outcome-item special">
            <span class="icon">✨</span>
            <span class="text">特殊效果：</span>
            <div class="special-list">
              <span
                v-for="(effect, idx) in result.specialEffects"
                :key="idx"
                class="special-badge"
              >
                {{ effect }}
              </span>
            </div>
          </div>
        </div>

        <!-- 展开详情按钮 -->
        <button
          v-if="result.detailedLog"
          class="detail-toggle"
          @click="toggleDetail(index)"
        >
          {{ expandedIndices.includes(index) ? '收起详情' : '查看详情' }}
        </button>

        <!-- 详细日志 -->
        <transition name="slide">
          <div v-if="expandedIndices.includes(index)" class="detailed-log">
            <div v-for="(log, logIdx) in result.detailedLog" :key="logIdx" class="log-line">
              {{ log }}
            </div>
          </div>
        </transition>
      </div>
    </transition-group>

    <!-- 空状态 -->
    <div v-if="battleResults.length === 0" class="empty-state">
      <div class="icon">⚔️</div>
      <div class="text">暂无战斗记录</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  battleResults: {
    type: Array,
    default: () => []
  }
})

const expandedIndices = ref([])

function toggleDetail(index) {
  const idx = expandedIndices.value.indexOf(index)
  if (idx > -1) {
    expandedIndices.value.splice(idx, 1)
  } else {
    expandedIndices.value.push(index)
  }
}

function formatNumber(num) {
  if (!num) return '0'
  return Math.floor(num).toLocaleString()
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<style scoped>
.battle-result-display {
  padding: 12px;
}

.battle-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.battle-card {
  background: var(--panel);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.battle-card.highlight {
  border-color: var(--accent);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
}

.battle-card:hover {
  border-color: var(--accent);
  background: rgba(59, 130, 246, 0.06);
}

.battle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.battle-matchup {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 16px;
  align-items: center;
  margin-bottom: 16px;
}

.combatant {
  padding: 12px;
  background: var(--bg);
  border-radius: 6px;
}

.combatant.attacker {
  border-left: 3px solid var(--good);
}

.combatant.defender {
  border-right: 3px solid var(--warn);
}

.combatant-name {
  font-weight: bold;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.combatant-stats {
  display: flex;
  gap: 12px;
  font-size: 11px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat .label {
  color: var(--muted);
  font-size: 10px;
}

.stat .value {
  font-weight: bold;
  font-size: 14px;
}

.vs {
  font-weight: bold;
  font-size: 18px;
  color: var(--accent);
  text-align: center;
}

.battle-outcome {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.outcome-item {
  padding: 8px 12px;
  background: var(--bg);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.outcome-item .icon {
  font-size: 16px;
}

.outcome-item.barrier {
  border-left: 3px solid #3b82f6;
}

.outcome-item.damage {
  border-left: 3px solid #ef4444;
}

.outcome-item.casualties {
  border-left: 3px solid #dc2626;
  flex-direction: column;
  align-items: flex-start;
}

.outcome-item.special {
  border-left: 3px solid #8b5cf6;
  flex-direction: column;
  align-items: flex-start;
}

.casualty-list,
.special-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.casualty-badge,
.special-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.casualty-badge {
  background: var(--bad);
  color: white;
}

.special-badge {
  background: #8b5cf6;
  color: white;
}

.detail-toggle {
  width: 100%;
  margin-top: 12px;
  padding: 8px;
  background: var(--bg);
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  color: var(--accent);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.detail-toggle:hover {
  background: var(--accent);
  color: #ffffff;
}

.detailed-log {
  margin-top: 12px;
  padding: 12px;
  background: var(--bg);
  border-radius: 6px;
  font-size: 11px;
  font-family: monospace;
  max-height: 200px;
  overflow-y: auto;
}

.log-line {
  padding: 4px 0;
  border-bottom: 1px solid #e2e8f0;
}

.log-line:last-child {
  border-bottom: none;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--muted);
}

.empty-state .icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.3;
}

.empty-state .text {
  font-size: 14px;
}

/* 动画 */
.battle-list-enter-active {
  animation: slideIn 0.4s ease;
}

.battle-list-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(20px);
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 300px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
