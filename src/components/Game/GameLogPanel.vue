<template>
  <div class="game-log-panel" :class="{ collapsed: isCollapsed }">
    <!-- 标题栏 -->
    <div class="game-log__header">
      <div class="title-section">
        <h3 class="game-log__title">📋 战斗日志</h3>
        <span class="log-count">({{ filteredLogs.length }})</span>
      </div>
      <div class="header-actions">
        <button class="icon-btn" @click="scrollToBottom" title="滚动到底部">
          ⬇️
        </button>
        <button class="icon-btn" @click="clearLogs" title="清空日志">
          🗑️
        </button>
        <button class="icon-btn" @click="isCollapsed = !isCollapsed" :title="isCollapsed ? '展开' : '折叠'">
          {{ isCollapsed ? '◀' : '▶' }}
        </button>
      </div>
    </div>

    <!-- 过滤器 -->
    <div v-if="!isCollapsed" class="game-log__filters">
      <button
        class="filter-btn"
        :class="{ 'filter-btn--active': filter === 'all' }"
        @click="filter = 'all'"
      >
        全部
      </button>
      <button
        class="filter-btn"
        :class="{ 'filter-btn--active': filter === 'battle' }"
        @click="filter = 'battle'"
      >
        战斗
      </button>
      <button
        class="filter-btn"
        :class="{ 'filter-btn--active': filter === 'skill' }"
        @click="filter = 'skill'"
      >
        技能
      </button>
      <button
        class="filter-btn"
        :class="{ 'filter-btn--active': filter === 'system' }"
        @click="filter = 'system'"
      >
        系统
      </button>
    </div>

    <!-- 日志内容 -->
    <div v-if="!isCollapsed" class="game-log__content" ref="logContainer">
      <div
        v-for="(log, index) in filteredLogs"
        :key="index"
        class="log-entry"
        :class="`log-entry--${log.type}`"
      >
        <div class="log-entry__time">
          {{ formatTime(log.timestamp) }}
        </div>
        <div class="log-entry__icon">
          {{ getLogIcon(log.type) }}
        </div>
        <div class="log-entry__message">
          {{ log.message }}
        </div>
      </div>

      <div v-if="filteredLogs.length === 0" class="log-empty">
        <span class="log-empty__icon">📭</span>
        <span class="log-empty__text">暂无日志</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useGameStore } from '../../stores/gameStore'

const gameStore = useGameStore()
const logContainer = ref(null)
const filter = ref('all')
const isCollapsed = ref(false)

const filteredLogs = computed(() => {
  if (!gameStore.logs) return []

  const logs = gameStore.logs.map((log, index) => {
    // 自动检测日志类型
    const type = detectLogType(log.message)
    return {
      ...log,
      type,
      id: log.id || index,
      timestamp: log.timestamp || Date.now()
    }
  })

  if (filter.value === 'all') {
    return logs
  }

  return logs.filter(log => log.type === filter.value)
})

function detectLogType(message) {
  if (message.includes('使用') && message.includes('技能')) return 'skill'
  if (message.includes('战斗') || message.includes('攻击') || message.includes('伤害')) return 'battle'
  if (message.includes('回合') || message.includes('开始')) return 'system'
  return 'system'
}

function getLogIcon(type) {
  const iconMap = {
    battle: '⚔️',
    skill: '✨',
    system: 'ℹ️',
    info: '💡',
    warning: '⚠️',
    error: '❌'
  }
  return iconMap[type] || '📝'
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

function clearLogs() {
  if (confirm('确定要清空所有日志吗？')) {
    gameStore.logs = []
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

// 当日志更新时自动滚动到底部
watch(() => gameStore.logs?.length, () => {
  if (!isCollapsed.value) {
    scrollToBottom()
  }
}, { flush: 'post' })
</script>

<style scoped>
.game-log-panel {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 450px;
  max-height: 600px;
  background: linear-gradient(135deg, #1a1f36 0%, #1e2a47 100%);
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  z-index: 900;
  border: 2px solid rgba(96, 165, 250, 0.3);
  transition: all 0.3s ease;
}

.game-log-panel.collapsed {
  width: 200px;
  max-height: 60px;
}

.game-log__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 14px 14px 0 0;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.game-log__title {
  margin: 0;
  color: white;
  font-size: 16px;
  font-weight: bold;
}

.log-count {
  color: #60a5fa;
  font-size: 13px;
  font-weight: normal;
}

.header-actions {
  display: flex;
  gap: 6px;
}

.icon-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.game-log__filters {
  display: flex;
  gap: 6px;
  padding: 12px 18px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
}

.filter-btn {
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 500;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.filter-btn--active {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  border-color: #3b82f6;
  color: white;
}

.game-log__content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 18px;
  min-height: 200px;
  max-height: 450px;
}

.log-entry {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 6px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border-left: 3px solid;
  transition: all 0.2s ease;
  font-size: 13px;
}

.log-entry:hover {
  background: rgba(0, 0, 0, 0.3);
  transform: translateX(3px);
}

.log-entry--battle {
  border-color: #f87171;
}

.log-entry--skill {
  border-color: #a78bfa;
}

.log-entry--system {
  border-color: #60a5fa;
}

.log-entry__time {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  font-family: 'Courier New', monospace;
  min-width: 55px;
  flex-shrink: 0;
}

.log-entry__icon {
  font-size: 16px;
  flex-shrink: 0;
}

.log-entry__message {
  flex: 1;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.4;
  word-break: break-word;
}

.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.4);
}

.log-empty__icon {
  font-size: 36px;
}

.log-empty__text {
  font-size: 14px;
}

/* 滚动条样式 */
.game-log__content::-webkit-scrollbar {
  width: 6px;
}

.game-log__content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.game-log__content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.game-log__content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .game-log-panel {
    width: calc(100vw - 40px);
    max-width: 400px;
    bottom: 10px;
    right: 10px;
  }
}
</style>
