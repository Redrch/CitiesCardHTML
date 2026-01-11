<template>
  <teleport to="body">
    <div class="notification-container">
      <transition-group name="notification">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="['notification', `notification--${notification.type}`, { 'notification--visible': notification.visible }]"
          @click="$emit('close', notification.id)"
        >
          {{ notification.message }}
        </div>
      </transition-group>
    </div>
  </teleport>
</template>

<script setup>
import { useNotification } from '../../composables/useNotification'

const { notifications } = useNotification()
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification {
  background: var(--good);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  font-size: 14px;
  max-width: 300px;
  text-align: center;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  pointer-events: auto;
  cursor: pointer;
}

.notification--visible {
  transform: translateX(0);
}

.notification--success {
  background: #4CAF50;
}

.notification--warning {
  background: #FF9800;
}

.notification--error {
  background: #F44336;
}

.notification--info {
  background: #2196F3;
}

/* Vue transition classes */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
