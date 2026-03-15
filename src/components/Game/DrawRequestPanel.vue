<template>
  <div v-if="drawRequests.length > 0" class="draw-request-panel">
    <div class="panel-header">
      <div class="header-icon">🤝</div>
      <h3 class="header-title">求和请求</h3>
      <div class="request-count">{{ drawRequests.length }}</div>
    </div>

    <div class="requests-list">
      <div
        v-for="request in drawRequests"
        :key="request.id"
        class="draw-request-card"
      >
        <div class="request-info">
          <div class="request-message">
            <span class="initiator-name">{{ request.initiatorName }}</span>
            请求和棋
          </div>
          <div class="request-hint">接受后双方平局，拒绝后游戏继续</div>
        </div>

        <div class="action-buttons">
          <button class="btn-accept" @click="handleAccept(request)">
            ✓ 接受和棋
          </button>
          <button class="btn-reject" @click="handleReject(request)">
            ✗ 拒绝
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'

const props = defineProps({
  currentPlayer: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['draw-accepted', 'draw-rejected'])

const gameStore = useGameStore()

const drawRequests = computed(() => {
  return gameStore.getDrawRequestsForPlayer(props.currentPlayer.name)
})

function handleAccept(request) {
  emit('draw-accepted', { request })
}

function handleReject(request) {
  emit('draw-rejected', { request })
}
</script>

<style scoped>
.draw-request-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border: 3px solid #f59e0b;
  border-radius: 16px;
  padding: 24px;
  max-width: 480px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(30, 41, 59, 0.35);
  z-index: 9999;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(245, 158, 11, 0.3);
}

.header-icon {
  font-size: 32px;
}

.header-title {
  flex: 1;
  font-size: 22px;
  font-weight: 700;
  color: #fbbf24;
  margin: 0;
}

.request-count {
  background: #f59e0b;
  color: white;
  font-size: 16px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 12px;
  min-width: 32px;
  text-align: center;
}

.requests-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.draw-request-card {
  background: rgba(241, 245, 251, 0.7);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 20px;
}

.request-info {
  margin-bottom: 16px;
  text-align: center;
}

.request-message {
  font-size: 18px;
  color: #334155;
  font-weight: 600;
  margin-bottom: 8px;
}

.initiator-name {
  color: #60a5fa;
  font-weight: 700;
}

.request-hint {
  font-size: 13px;
  color: #94a3b8;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-accept,
.btn-reject {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-accept {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
}

.btn-accept:hover {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
}

.btn-reject {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-reject:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}
</style>
