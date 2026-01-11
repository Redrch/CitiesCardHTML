<template>
  <div class="game-log-simple" :class="{ collapsed: isCollapsed }">
    <div class="log-header">
      <h3>战斗日志</h3>
      <div class="log-actions">
        <button class="log-btn" @click="copyLogs" title="复制日志">📋</button>
        <button class="log-btn" @click="clearLogs" title="清空日志">🗑️</button>
        <button class="log-btn" @click="scrollToBottom" title="滚动到底部">⬇️</button>
        <button class="log-btn toggle-btn" @click="toggleCollapse" :title="isCollapsed ? '展开日志' : '收起日志'">
          {{ isCollapsed ? '◀' : '▶' }}
        </button>
      </div>
    </div>
    <div v-show="!isCollapsed" class="log-content" ref="logContainer">
      <pre>{{ logText }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useGameStore } from '../../stores/gameStore'

const gameStore = useGameStore()
const logContainer = ref(null)
const isCollapsed = ref(false)

// 生成纯文本日志（完全按照citycard_web.html格式）
const logText = computed(() => {
  if (!gameStore.logs || gameStore.logs.length === 0) {
    return '暂无日志'
  }

  return gameStore.logs
    .map(log => {
      const time = formatTime(log.timestamp)
      const round = log.round ? ` [R${log.round}]` : ''
      return `${time}${round} ${log.message}`
    })
    .join('\n')
})

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `[${h}:${m}:${s}]`
}

// 切换展开/收起
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

// 复制日志
async function copyLogs() {
  try {
    await navigator.clipboard.writeText(logText.value)
    alert('日志已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
    // 备用方案：使用textarea
    const textarea = document.createElement('textarea')
    textarea.value = logText.value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    alert('日志已复制到剪贴板')
  }
}

// 清空日志
function clearLogs() {
  if (confirm('确定要清空所有日志吗？')) {
    gameStore.clearLogs()
  }
}

// 滚动到底部
function scrollToBottom() {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

// 监听日志变化，自动滚动到底部
watch(() => gameStore.logs.length, () => {
  scrollToBottom()
})
</script>

<style scoped>
.game-log-simple {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(96, 165, 250, 0.2);
  transition: all 0.3s ease;
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
  padding: 16px 20px;
  background: linear-gradient(135deg, #0f3460 0%, #16213e 100%);
  border-bottom: 2px solid rgba(96, 165, 250, 0.3);
}

.log-header h3 {
  margin: 0;
  font-size: 18px;
  color: #60a5fa;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: 0.5px;
}

.log-actions {
  display: flex;
  gap: 8px;
}

.log-btn {
  padding: 8px 14px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 6px;
  color: #60a5fa;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.log-btn:hover {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.3) 100%);
  border-color: rgba(59, 130, 246, 0.7);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.log-btn:active {
  transform: translateY(0);
}

.toggle-btn {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%);
  border-color: rgba(139, 92, 246, 0.4);
  color: #a78bfa;
  font-weight: bold;
  font-size: 16px;
  padding: 8px 12px;
}

.toggle-btn:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(124, 58, 237, 0.3) 100%);
  border-color: rgba(139, 92, 246, 0.7);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #0a0e27;
  position: relative;
}

.log-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(to bottom, rgba(10, 14, 39, 0.9), transparent);
  pointer-events: none;
}

.log-content pre {
  margin: 0;
  font-family: 'SF Mono', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.8;
  color: #e2e8f0;
  white-space: pre-wrap;
  word-wrap: break-word;
  user-select: text;
  cursor: text;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 自定义滚动条 */
.log-content::-webkit-scrollbar {
  width: 10px;
}

.log-content::-webkit-scrollbar-track {
  background: rgba(16, 33, 62, 0.5);
  border-radius: 5px;
}

.log-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 5px;
  border: 2px solid rgba(16, 33, 62, 0.5);
}

.log-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
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
