<template>
  <div class="game-log-fixed">
    <!-- 标题栏 -->
    <div class="log-header">
      <div class="header-left">
        <h3 class="log-title">
          <span class="title-icon">📋</span>
          <span class="title-text">战斗日志</span>
          <span class="log-badge">{{ filteredLogs.length }}</span>
        </h3>
        <div class="round-indicator">
          <span class="round-label">回合</span>
          <span class="round-number">{{ currentRound }}</span>
        </div>
      </div>

      <div class="header-actions">
        <button
          class="action-btn action-btn--copy"
          @click="copyLogs"
          title="复制日志"
        >
          📋 复制
        </button>
        <button
          class="action-btn action-btn--clear"
          @click="clearLogs"
          title="清空日志"
        >
          🗑️ 清空
        </button>
        <button
          class="action-btn action-btn--scroll"
          @click="scrollToBottom"
          title="滚动到底部"
        >
          ⬇️ 底部
        </button>
      </div>
    </div>

    <!-- 过滤器 -->
    <div class="log-filters">
      <button
        v-for="filterOption in filterOptions"
        :key="filterOption.id"
        class="filter-chip"
        :class="{ 'filter-chip--active': filter === filterOption.id }"
        @click="filter = filterOption.id"
      >
        <span class="filter-icon">{{ filterOption.icon }}</span>
        <span class="filter-text">{{ filterOption.label }}</span>
        <span class="filter-count">{{ getFilterCount(filterOption.id) }}</span>
      </button>
    </div>

    <!-- 日志内容区域 -->
    <div class="log-content" ref="logContainer">
      <!-- 日志列表 -->
      <div
        v-for="(log, index) in filteredLogs"
        :key="log.id || index"
        class="log-item"
        :class="[
          `log-item--${log.type}`,
          { 'log-item--new': isNewLog(log) }
        ]"
      >
        <!-- 时间戳 -->
        <div class="log-time">
          {{ formatTime(log.timestamp) }}
        </div>

        <!-- 类型图标 -->
        <div class="log-icon" :class="`log-icon--${log.type}`">
          {{ getLogIcon(log.type) }}
        </div>

        <!-- 日志内容 -->
        <div class="log-message">
          <span v-html="highlightMessage(log.message)"></span>
        </div>

        <!-- 回合标记 -->
        <div v-if="log.round" class="log-round-badge">
          R{{ log.round }}
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredLogs.length === 0" class="log-empty">
        <div class="empty-icon">📭</div>
        <div class="empty-text">暂无日志记录</div>
        <div class="empty-hint">游戏进行时将在此显示战斗日志</div>
      </div>

      <!-- 新日志提示 -->
      <div
        v-if="hasNewLogs && !isAtBottom"
        class="new-logs-indicator"
        @click="scrollToBottom"
      >
        <span class="indicator-icon">🔔</span>
        <span class="indicator-text">有新日志</span>
        <span class="indicator-arrow">⬇️</span>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="log-footer">
      <div class="footer-info">
        <span class="info-item">
          <span class="info-icon">📊</span>
          总计 {{ allLogs.length }} 条
        </span>
        <span class="info-item">
          <span class="info-icon">👁️</span>
          显示 {{ filteredLogs.length }} 条
        </span>
      </div>
      <div class="footer-status">
        <span
          class="status-indicator"
          :class="{ 'status-indicator--active': autoScroll }"
        >
          <input
            type="checkbox"
            id="autoScrollCheck"
            v-model="autoScroll"
            class="status-checkbox"
          />
          <label for="autoScrollCheck" class="status-label">
            自动滚动
          </label>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useNotification } from '../../composables/useNotification'
import { useDialog } from '../../composables/useDialog'

const gameStore = useGameStore()
const { showNotification } = useNotification()
const { showConfirm } = useDialog()

const logContainer = ref(null)
const filter = ref('all')
const autoScroll = ref(true)
const isAtBottom = ref(true)
const lastLogCount = ref(0)
const newLogTimestamp = ref(0)

// 过滤选项
const filterOptions = [
  { id: 'all', label: '全部', icon: '📝' },
  { id: 'battle', label: '战斗', icon: '⚔️' },
  { id: 'skill', label: '技能', icon: '✨' },
  { id: 'system', label: '系统', icon: 'ℹ️' },
  { id: 'warning', label: '警告', icon: '⚠️' },
  { id: 'error', label: '错误', icon: '❌' }
]

// 当前回合
const currentRound = computed(() => gameStore.currentRound || 1)

// 所有日志 (filtered by clear timestamp)
const allLogs = computed(() => {
  if (!gameStore.logs || !Array.isArray(gameStore.logs)) return []

  const clearedAt = gameStore.logsClearedAt
  return gameStore.logs
    .filter(log => {
      if (clearedAt && log.timestamp && log.timestamp <= clearedAt) return false
      return true
    })
    .map((log, index) => {
      const type = log.type || detectLogType(log.message)
      return {
        ...log,
        type,
        id: log.id || `log-${index}-${log.timestamp}`,
        timestamp: log.timestamp || Date.now(),
        round: log.round || currentRound.value
      }
    })
})

// 过滤后的日志
const filteredLogs = computed(() => {
  if (filter.value === 'all') {
    return allLogs.value
  }
  return allLogs.value.filter(log => log.type === filter.value)
})

// 是否有新日志
const hasNewLogs = computed(() => {
  return allLogs.value.length > lastLogCount.value
})

/**
 * 检测日志类型
 */
function detectLogType(message) {
  if (!message) return 'system'

  const msg = message.toLowerCase()

  // 错误类型
  if (msg.includes('错误') || msg.includes('失败') || msg.includes('error')) {
    return 'error'
  }

  // 警告类型
  if (msg.includes('警告') || msg.includes('注意') || msg.includes('warning')) {
    return 'warning'
  }

  // 技能类型
  if (msg.includes('使用') && (msg.includes('技能') || msg.includes('金币'))) {
    return 'skill'
  }

  // 战斗类型
  if (msg.includes('战斗') || msg.includes('攻击') || msg.includes('伤害') ||
      msg.includes('HP') || msg.includes('hp') || msg.includes('阵亡') ||
      msg.includes('摧毁') || msg.includes('治疗')) {
    return 'battle'
  }

  // 系统类型
  if (msg.includes('回合') || msg.includes('开始') || msg.includes('结束')) {
    return 'system'
  }

  return 'system'
}

/**
 * 获取日志图标
 */
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

/**
 * 格式化时间
 */
function formatTime(timestamp) {
  if (!timestamp) return '--:--:--'
  const date = new Date(timestamp)
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  const s = date.getSeconds().toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

/**
 * 高亮消息中的关键词
 */
function highlightMessage(message) {
  if (!message) return ''

  let result = message

  // 高亮玩家名
  result = result.replace(/([【《].*?[】》]|玩家\d+)/g, '<span class="highlight-player">$1</span>')

  // 高亮数值
  result = result.replace(/(\d+)/g, '<span class="highlight-number">$1</span>')

  // 高亮技能名
  result = result.replace(/([「『].*?[」』])/g, '<span class="highlight-skill">$1</span>')

  // 高亮城市名（包含"市"、"县"、"区"等）
  result = result.replace(/([\u4e00-\u9fa5]{2,}[市县区])/g, '<span class="highlight-city">$1</span>')

  return result
}

/**
 * 判断是否为新日志
 */
function isNewLog(log) {
  return log.timestamp > newLogTimestamp.value
}

/**
 * 获取过滤器计数
 */
function getFilterCount(filterId) {
  if (filterId === 'all') {
    return allLogs.value.length
  }
  return allLogs.value.filter(log => log.type === filterId).length
}

/**
 * 滚动到底部
 */
function scrollToBottom() {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
      isAtBottom.value = true
    }
  })
}

/**
 * 检查是否在底部
 */
function checkIfAtBottom() {
  if (!logContainer.value) return

  const { scrollTop, scrollHeight, clientHeight } = logContainer.value
  isAtBottom.value = Math.abs(scrollHeight - scrollTop - clientHeight) < 50
}

/**
 * 复制日志
 */
function copyLogs() {
  const logsText = filteredLogs.value
    .map(log => `[${formatTime(log.timestamp)}] ${log.message}`)
    .join('\n')

  if (!logsText) {
    showNotification('没有可复制的日志', 'warning')
    return
  }

  navigator.clipboard.writeText(logsText).then(() => {
    showNotification('日志已复制到剪贴板', 'success')
  }).catch(() => {
    showNotification('复制失败', 'error')
  })
}

/**
 * 清空日志（仅隐藏当前已有日志，新日志仍会显示）
 */
async function clearLogs() {
  if (allLogs.value.length === 0) {
    showNotification('日志已为空', 'info')
    return
  }

  if (await showConfirm('确定要清空所有日志吗？', { title: '清空日志', icon: '🗑️' })) {
    gameStore.logsClearedAt = Date.now()
    showNotification('日志已清空', 'success')
  }
}

// 监听日志更新，自动滚动
watch(() => allLogs.value.length, (newCount, oldCount) => {
  if (newCount > oldCount) {
    newLogTimestamp.value = Date.now()
    lastLogCount.value = newCount

    if (autoScroll.value) {
      scrollToBottom()
    }
  }
}, { flush: 'post' })

// 监听滚动事件
onMounted(() => {
  if (logContainer.value) {
    logContainer.value.addEventListener('scroll', checkIfAtBottom)
  }

  // 初始滚动到底部
  scrollToBottom()
})

onUnmounted(() => {
  if (logContainer.value) {
    logContainer.value.removeEventListener('scroll', checkIfAtBottom)
  }
})
</script>

<style scoped>
.game-log-fixed {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, rgba(42, 35, 64, 0.95) 0%, rgba(30, 42, 74, 0.95) 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-top: 3px solid rgba(212, 160, 23, 0.5);
}

/* ==================== 标题栏 ==================== */
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(212, 160, 23, 0.12) 0%, rgba(30, 42, 74, 0.8) 100%);
  border-bottom: 2px solid rgba(212, 160, 23, 0.3);
  backdrop-filter: blur(10px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.log-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #f0c850;
}

.title-icon {
  font-size: 24px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.title-text {
  background: linear-gradient(135deg, #f0c850 0%, #d4a017 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.log-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 24px;
  padding: 0 8px;
  background: linear-gradient(135deg, #d4a017 0%, #b8860b 100%);
  color: white;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(212, 160, 23, 0.4);
}

.round-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(251, 191, 36, 0.15);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 20px;
}

.round-label {
  font-size: 12px;
  color: #fbbf24;
  font-weight: 500;
}

.round-number {
  font-size: 16px;
  font-weight: 700;
  color: #fbbf24;
  min-width: 24px;
  text-align: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.action-btn--copy:hover {
  background: linear-gradient(135deg, #d4a017 0%, #e6b422 100%);
  border-color: #b8860b;
  color: white;
}

.action-btn--clear:hover {
  background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
  border-color: #a93226;
  color: white;
}

.action-btn--scroll:hover {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border-color: #059669;
  color: white;
}

/* ==================== 过滤器 ==================== */
.log-filters {
  display: flex;
  gap: 8px;
  padding: 14px 20px;
  background: rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow-x: auto;
  scrollbar-width: thin;
}

.log-filters::-webkit-scrollbar {
  height: 4px;
}

.log-filters::-webkit-scrollbar-track {
  background: rgba(212, 160, 23, 0.06);
}

.log-filters::-webkit-scrollbar-thumb {
  background: rgba(212, 160, 23, 0.2);
  border-radius: 2px;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.filter-chip:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(212, 160, 23, 0.4);
  color: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
}

.filter-chip--active {
  background: linear-gradient(135deg, #d4a017 0%, #b8860b 100%);
  border-color: #b8860b;
  color: white;
  box-shadow: 0 4px 12px rgba(212, 160, 23, 0.35);
}

.filter-icon {
  font-size: 14px;
}

.filter-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
}

.filter-chip--active .filter-count {
  background: rgba(255, 255, 255, 0.2);
}

/* ==================== 日志内容 ==================== */
.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  background: rgba(0, 0, 0, 0.15);
  position: relative;
  scroll-behavior: smooth;
}

/* 自定义滚动条 - gold themed */
.log-content::-webkit-scrollbar {
  width: 10px;
}

.log-content::-webkit-scrollbar-track {
  background: rgba(212, 160, 23, 0.06);
  border-radius: 5px;
  margin: 8px 0;
}

.log-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #d4a017 0%, #b8860b 100%);
  border-radius: 5px;
  border: 2px solid rgba(212, 160, 23, 0.06);
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #e6b422 0%, #d4a017 100%);
}

/* 日志项 */
.log-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border-left: 4px solid;
  transition: all 0.3s ease;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.log-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.log-item--new {
  animation: slideIn 0.3s ease, pulse 2s ease;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(96, 165, 250, 0); }
  50% { box-shadow: 0 0 20px rgba(96, 165, 250, 0.5); }
}

.log-item--battle {
  border-color: #d4a017;
}

.log-item--skill {
  border-color: #8b5cf6;
}

.log-item--system {
  border-color: #3b82f6;
}

.log-item--warning {
  border-color: #d4a017;
  background: rgba(212, 160, 23, 0.08);
}

.log-item--error {
  border-color: #c0392b;
  background: rgba(192, 57, 43, 0.1);
}

.log-time {
  flex-shrink: 0;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  min-width: 65px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
}

.log-icon {
  flex-shrink: 0;
  font-size: 18px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.06);
}

.log-icon--battle {
  background: rgba(212, 160, 23, 0.15);
}

.log-icon--skill {
  background: rgba(139, 92, 246, 0.15);
}

.log-icon--system {
  background: rgba(59, 130, 246, 0.15);
}

.log-icon--warning {
  background: rgba(212, 160, 23, 0.2);
}

.log-icon--error {
  background: rgba(192, 57, 43, 0.2);
}

.log-message {
  flex: 1;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

/* 高亮样式 */
.log-message :deep(.highlight-player) {
  color: #60a5fa;
  font-weight: 600;
}

.log-message :deep(.highlight-number) {
  color: #fbbf24;
  font-weight: 700;
}

.log-message :deep(.highlight-skill) {
  color: #a78bfa;
  font-weight: 600;
}

.log-message :deep(.highlight-city) {
  color: #34d399;
  font-weight: 600;
}

.log-round-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  background: rgba(212, 160, 23, 0.15);
  border: 1px solid rgba(212, 160, 23, 0.3);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: #f0c850;
}

/* 空状态 */
.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.35);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.35);
}

/* 新日志指示器 */
.new-logs-indicator {
  position: sticky;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
  color: white;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow:
    0 4px 16px rgba(239, 68, 68, 0.5),
    0 0 0 4px rgba(239, 68, 68, 0.1);
  animation: bounce 2s ease-in-out infinite;
  z-index: 10;
  transition: all 0.3s ease;
}

.new-logs-indicator:hover {
  transform: translateX(-50%) scale(1.05);
  box-shadow:
    0 6px 20px rgba(239, 68, 68, 0.6),
    0 0 0 6px rgba(239, 68, 68, 0.15);
}

/* ==================== 状态栏 ==================== */
.log-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-info {
  display: flex;
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.info-icon {
  font-size: 14px;
}

.footer-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.status-indicator:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.status-indicator--active {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  border-color: #10b981;
}

.status-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #10b981;
}

.status-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  cursor: pointer;
  user-select: none;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .log-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-left {
    justify-content: space-between;
  }

  .header-actions {
    justify-content: center;
  }

  .log-filters {
    flex-wrap: nowrap;
    overflow-x: auto;
  }

  .log-item {
    flex-wrap: wrap;
  }

  .log-time {
    order: -1;
  }

  .log-round-badge {
    order: -1;
  }
}
</style>
