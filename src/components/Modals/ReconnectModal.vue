<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="handleCancel">
    <div class="reconnect-modal">
      <div class="reconnect-icon">🔌</div>
      <h2 class="reconnect-title">检测到之前的会话</h2>
      <div class="reconnect-info">
        <div class="info-row">
          <span class="info-label">玩家昵称</span>
          <span class="info-value">{{ playerName }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">房间号</span>
          <span class="info-value room-id">{{ roomId }}</span>
        </div>
      </div>
      <p class="reconnect-hint">是否恢复之前的游戏进度？</p>
      <div class="reconnect-actions">
        <button class="reconnect-btn reconnect-btn--primary" @click="handleReconnect">
          🔄 断线重连
        </button>
        <button class="reconnect-btn reconnect-btn--secondary" @click="handleCancel">
          🆕 以新身份加入
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  playerName: {
    type: String,
    default: ''
  },
  roomId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'reconnect', 'cancel'])

function handleReconnect() {
  emit('reconnect')
  emit('update:modelValue', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(30, 41, 59, 0.35);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.reconnect-modal {
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fc 100%);
  border: 2px solid rgba(59, 130, 246, 0.4);
  border-radius: 24px;
  padding: 40px 32px;
  max-width: 420px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(100, 116, 145, 0.18);
  animation: modalIn 0.3s ease-out;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.reconnect-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.reconnect-title {
  font-size: 22px;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 24px 0;
}

.reconnect-info {
  background: rgba(59, 130, 246, 0.04);
  border: 1px solid rgba(209, 217, 230, 0.6);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.info-row + .info-row {
  border-top: 1px solid rgba(209, 217, 230, 0.5);
}

.info-label {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.info-value {
  font-size: 15px;
  color: #334155;
  font-weight: 700;
}

.info-value.room-id {
  font-family: 'Courier New', monospace;
  color: #60a5fa;
  letter-spacing: 3px;
}

.reconnect-hint {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px 0;
}

.reconnect-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reconnect-btn {
  width: 100%;
  padding: 16px 24px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.reconnect-btn--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
}

.reconnect-btn--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(59, 130, 246, 0.4);
}

.reconnect-btn--secondary {
  background: rgba(59, 130, 246, 0.06);
  color: #64748b;
  border: 2px solid rgba(209, 217, 230, 0.7);
}

.reconnect-btn--secondary:hover {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(209, 217, 230, 0.9);
}

@media (max-width: 480px) {
  .reconnect-modal {
    padding: 28px 20px;
  }

  .reconnect-icon {
    font-size: 44px;
  }

  .reconnect-title {
    font-size: 18px;
  }
}
</style>
