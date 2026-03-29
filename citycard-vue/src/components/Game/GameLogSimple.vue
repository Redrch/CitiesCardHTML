<template>
  <div class="game-log-simple" :class="{ collapsed: isCollapsed }">
    <div class="log-header">
      <h3>战斗日志</h3>
      <div class="log-actions">
        <button class="log-btn toggle-btn" @click="toggleCollapse" :title="isCollapsed ? '展开日志' : '收起日志'">
          {{ isCollapsed ? '◀' : '▶' }}
        </button>
        <button v-if="!isCollapsed" class="log-btn" @click="togglePrivateLogs" :title="showPrivateLogs ? '隐藏私密日志' : '显示私密日志'">
          {{ showPrivateLogs ? '👁️' : '🔒' }}
        </button>
        <button v-if="!isCollapsed" class="log-btn" @click="copyLogs" title="复制日志">📋</button>
        <button v-if="!isCollapsed" class="log-btn" @click="clearLogs" title="清空日志">🗑️</button>
        <button v-if="!isCollapsed" class="log-btn" @click="scrollToBottom" title="滚动到底部">⬇️</button>
      </div>
    </div>
    <div v-show="!isCollapsed" class="log-content" ref="logContainer">
      <pre v-if="combinedLogs.length === 0" class="empty-log">暂无日志</pre>
      <pre v-else>{{ formattedLogs }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useDialog } from '../../composables/useDialog'

const { showAlert, showConfirm } = useDialog()

const props = defineProps({
  currentPlayerName: {
    type: String,
    default: null
  }
})

const gameStore = useGameStore()
const logContainer = ref(null)
const isCollapsed = ref(false)
const showPrivateLogs = ref(true)

/**
 * 合并公共日志和私密日志
 */
const combinedLogs = computed(() => {
  const allLogs = []
  const clearedAt = gameStore.logsClearedAt

  // 添加所有公共日志 (filter out logs before clear time)
  if (gameStore.logs && Array.isArray(gameStore.logs)) {
    gameStore.logs.forEach(log => {
      if (clearedAt && log.timestamp && log.timestamp <= clearedAt) return
      // 过滤掉带visibleTo的私密日志（仅对指定玩家可见）
      if (log.isPrivate && log.visibleTo) {
        if (!props.currentPlayerName || !log.visibleTo.includes(props.currentPlayerName)) return
      }
      allLogs.push({ ...log, isPrivate: log.isPrivate || false })
    })
  }

  // 如果显示私密日志且有当前玩家名称，添加当前玩家的私密日志
  if (showPrivateLogs.value && props.currentPlayerName) {
    const privateLogs = gameStore.playerPrivateLogs[props.currentPlayerName]
    if (privateLogs && Array.isArray(privateLogs)) {
      privateLogs.forEach(log => {
        if (clearedAt && log.timestamp && log.timestamp <= clearedAt) return
        allLogs.push({ ...log, isPrivate: true })
      })
    }
  }

  // 按时间戳排序
  return allLogs.sort((a, b) => a.timestamp - b.timestamp)
})

/**
 * 格式化日志为文本
 */
const formattedLogs = computed(() => {
  if (combinedLogs.value.length === 0) {
    return '暂无日志'
  }

  return combinedLogs.value
    .map(log => {
      // 检查消息是否已经包含[回合]前缀，如果包含就不要再添加
      const hasRoundPrefix = log.message && log.message.includes('[回合')
      const round = (!hasRoundPrefix && log.round) ? `[回合${log.round}]` : ''
      const prefix = log.isPrivate ? '🔒 ' : ''
      return `${prefix}${round} ${log.message}`
    })
    .join('\n')
})

/**
 * 切换展开/收起
 */
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

/**
 * 切换私密日志显示
 */
function togglePrivateLogs() {
  showPrivateLogs.value = !showPrivateLogs.value
}

/**
 * 复制日志
 */
async function copyLogs() {
  try {
    await navigator.clipboard.writeText(formattedLogs.value)
    await showAlert('日志已复制到剪贴板', { title: '复制成功', icon: '📋' })
  } catch (err) {
    console.error('复制失败:', err)
    // 备用方案：使用textarea
    const textarea = document.createElement('textarea')
    textarea.value = formattedLogs.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    await showAlert('日志已复制到剪贴板', { title: '复制成功', icon: '📋' })
  }
}

/**
 * 清空日志（仅隐藏当前已有日志，新日志仍会显示）
 */
async function clearLogs() {
  if (combinedLogs.value.length === 0) return
  if (await showConfirm('确定要清空所有日志吗？', { title: '清空日志', icon: '🗑️' })) {
    gameStore.logsClearedAt = Date.now()
  }
}

/**
 * 滚动到底部
 */
function scrollToBottom() {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

/**
 * 监听日志变化，自动滚动到底部
 */
watch(() => combinedLogs.value.length, () => {
  scrollToBottom()
})
</script>

<style scoped>
.game-log-simple {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, rgba(42, 35, 64, 0.95) 0%, rgba(30, 42, 74, 0.95) 100%);
  border-radius: 12px;
  overflow: visible;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-top: 3px solid rgba(212, 160, 23, 0.5);
  transition: all 0.3s ease;
  position: relative;
  z-index: 100;
}

.game-log-simple.collapsed {
  width: 60px;
}

.game-log-simple.collapsed .log-header h3 {
  display: none;
}

.game-log-simple.collapsed .log-btn:not(.toggle-btn) {
  display: none;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(212, 160, 23, 0.12) 0%, rgba(30, 42, 74, 0.8) 100%);
  border-bottom: 2px solid rgba(212, 160, 23, 0.3);
  position: relative;
  z-index: 10;
  min-height: 50px;
}

.log-header h3 {
  margin: 0;
  font-size: 16px;
  color: #f0c850;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.log-actions {
  display: flex;
  gap: 6px;
  position: relative;
  z-index: 20;
  flex-wrap: nowrap;
  flex-shrink: 0;
}

.log-btn {
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  position: relative;
  z-index: 30;
  white-space: nowrap;
  flex-shrink: 0;
}

.log-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.log-btn:active {
  transform: translateY(0);
}

.toggle-btn {
  background: rgba(139, 92, 246, 0.15);
  border-color: rgba(139, 92, 246, 0.35);
  color: #a78bfa;
  font-weight: bold;
  font-size: 16px;
  padding: 6px 12px;
  min-width: 40px;
  flex-shrink: 0;
  order: -1;
  z-index: 100;
}

.toggle-btn:hover {
  background: rgba(139, 92, 246, 0.25);
  border-color: rgba(139, 92, 246, 0.6);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: rgba(0, 0, 0, 0.15);
  position: relative;
}

.log-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.15), transparent);
  pointer-events: none;
}

.log-content pre {
  margin: 0;
  font-family: 'SF Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);
  white-space: pre-wrap;
  word-wrap: break-word;
  user-select: text;
  cursor: text;
}

.empty-log {
  color: rgba(255, 255, 255, 0.35) !important;
  font-style: italic;
  text-align: center;
  padding: 40px 20px;
}

/* 自定义滚动条 - gold themed */
.log-content::-webkit-scrollbar {
  width: 10px;
}

.log-content::-webkit-scrollbar-track {
  background: rgba(212, 160, 23, 0.06);
  border-radius: 5px;
}

.log-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #d4a017 0%, #b8860b 100%);
  border-radius: 5px;
  border: 2px solid rgba(212, 160, 23, 0.06);
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #e6b422 0%, #d4a017 100%);
}

/* 响应式 */
@media (max-width: 768px) {
  .log-header {
    padding: 12px 16px;
  }

  .log-header h3 {
    font-size: 16px;
  }

  .log-btn {
    padding: 6px 10px;
    font-size: 12px;
  }

  .log-content {
    padding: 16px;
  }

  .log-content pre {
    font-size: 12px;
    line-height: 1.6;
  }
}
</style>
