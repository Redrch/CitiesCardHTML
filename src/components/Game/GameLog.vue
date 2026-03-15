<template>
  <div class="game-log-modal" :class="{ 'game-log-modal--show': show }" @click.self="$emit('close')">
    <div class="game-log">
      <!-- 标题栏 -->
      <div class="game-log__header">
        <h3 class="game-log__title">📋 游戏日志</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- 过滤器 -->
      <div class="game-log__filters">
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
      <div class="game-log__content" ref="logContainer">
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

      <!-- 操作栏 -->
      <div class="game-log__footer">
        <button class="btn btn--secondary" @click="clearLogs">
          🗑️ 清空日志
        </button>
        <button class="btn btn--primary" @click="scrollToBottom">
          ⬇️ 滚动到底部
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useDialog } from '../../composables/useDialog'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const gameStore = useGameStore()
const { showConfirm } = useDialog()
const logContainer = ref(null)
const filter = ref('all')

const filteredLogs = computed(() => {
  if (!gameStore.logs) return []

  const logs = gameStore.logs.map((log, index) => {
    // 自动检测日志类型
    const type = detectLogType(log.message)
    return {
      ...log,
      type,
      id: log.id || index
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

async function clearLogs() {
  if (await showConfirm('确定要清空所有日志吗？', { title: '清空日志', icon: '🗑️' })) {
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
  if (props.show) {
    scrollToBottom()
  }
})

// 打开时滚动到底部
watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      scrollToBottom()
    })
  }
})
</script>

<style scoped>
.game-log-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(30, 41, 59, 0.35);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.game-log-modal--show {
  opacity: 1;
  pointer-events: all;
}

.game-log {
  background: linear-gradient(135deg, #f1f5f9 0%, #f0f3f9 100%);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(100, 116, 145, 0.18);
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.game-log__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid rgba(209, 217, 230, 0.6);
}

.game-log__title {
  margin: 0;
  color: #1e293b;
  font-size: 24px;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(59, 130, 246, 0.08);
  color: #1e293b;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(59, 130, 246, 0.15);
  transform: rotate(90deg);
}

.game-log__filters {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  border-bottom: 2px solid rgba(209, 217, 230, 0.6);
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid rgba(209, 217, 230, 0.7);
  background: rgba(59, 130, 246, 0.06);
  color: #334155;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
}

.filter-btn:hover {
  background: rgba(59, 130, 246, 0.15);
}

.filter-btn--active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: white;
}

.game-log__content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
  min-height: 300px;
  max-height: 500px;
}

.log-entry {
  display: flex;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(100, 116, 145, 0.08);
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.3s ease;
}

.log-entry:hover {
  background: rgba(100, 116, 145, 0.12);
  transform: translateX(4px);
}

.log-entry--battle {
  border-color: #f56565;
}

.log-entry--skill {
  border-color: #9f7aea;
}

.log-entry--system {
  border-color: #4299e1;
}

.log-entry__time {
  color: rgba(30, 41, 59, 0.65);
  font-size: 12px;
  font-family: monospace;
  min-width: 60px;
}

.log-entry__icon {
  font-size: 18px;
}

.log-entry__message {
  flex: 1;
  color: #1e293b;
  line-height: 1.5;
}

.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 60px 20px;
  color: rgba(30, 41, 59, 0.6);
}

.log-empty__icon {
  font-size: 48px;
}

.log-empty__text {
  font-size: 18px;
}

.game-log__footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 2px solid rgba(209, 217, 230, 0.6);
}

.btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(100, 116, 145, 0.12);
}

.btn--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn--secondary {
  background: rgba(59, 130, 246, 0.08);
  color: #1e293b;
}

/* 滚动条样式 */
.game-log__content::-webkit-scrollbar {
  width: 8px;
}

.game-log__content::-webkit-scrollbar-track {
  background: rgba(100, 116, 145, 0.08);
  border-radius: 4px;
}

.game-log__content::-webkit-scrollbar-thumb {
  background: rgba(59, 130, 246, 0.2);
  border-radius: 4px;
}

.game-log__content::-webkit-scrollbar-thumb:hover {
  background: rgba(30, 41, 59, 0.6);
}
</style>
