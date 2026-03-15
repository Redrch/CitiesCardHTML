<template>
  <Teleport to="body">
    <div v-if="dialogState.visible" class="dialog-overlay" @click.self="handleCancel">
      <div class="dialog-panel">
        <div class="dialog-header">
          <div class="dialog-icon">{{ dialogState.icon }}</div>
          <h3 class="dialog-title">{{ dialogState.title }}</h3>
        </div>

        <div class="dialog-body">
          <p class="dialog-message">{{ dialogState.message }}</p>
        </div>

        <div class="dialog-actions">
          <template v-if="dialogState.type === 'confirm'">
            <button class="btn-confirm" @click="handleConfirm">
              {{ dialogState.confirmText }}
            </button>
            <button class="btn-cancel" @click="handleCancel">
              {{ dialogState.cancelText }}
            </button>
          </template>
          <template v-else>
            <button class="btn-ok" @click="handleOk">
              {{ dialogState.confirmText }}
            </button>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useDialog } from '../../composables/useDialog'

const { dialogState, resolveDialog } = useDialog()

function handleConfirm() {
  resolveDialog(true)
}

function handleCancel() {
  resolveDialog(false)
}

function handleOk() {
  resolveDialog(undefined)
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dialog-panel {
  background: linear-gradient(135deg, #2a2340 0%, #1e2a4a 100%);
  border: 2px solid rgba(212, 160, 23, 0.5);
  outline: 2px solid rgba(212, 160, 23, 0.15);
  outline-offset: 3px;
  border-radius: 16px;
  padding: 28px;
  max-width: 440px;
  width: 90%;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: slideIn 0.3s ease-out;
  position: relative;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(212, 160, 23, 0.35);
  position: relative;
}

.dialog-header::before {
  content: '\2694';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  opacity: 0.35;
  color: #d4a017;
}

.dialog-icon {
  font-size: 32px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
}

.dialog-title {
  flex: 1;
  font-size: 22px;
  font-weight: 800;
  color: #f0c850;
  margin: 0;
  text-shadow: 0 1px 4px rgba(212, 160, 23, 0.3);
}

.dialog-body {
  margin-bottom: 24px;
  text-align: center;
}

.dialog-message {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.75);
  line-height: 1.6;
  margin: 0;
  white-space: pre-line;
}

.dialog-actions {
  display: flex;
  gap: 12px;
}

.btn-confirm,
.btn-cancel,
.btn-ok {
  flex: 1;
  padding: 13px 20px;
  border: 2px solid transparent;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
  color: white;
}

.btn-confirm {
  background: linear-gradient(135deg, #d4a017 0%, #b8860b 100%);
  border-color: rgba(212, 160, 23, 0.6);
  color: white;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 14px rgba(0, 0, 0, 0.4);
}

.btn-confirm:hover {
  background: linear-gradient(135deg, #e6b422 0%, #d4a017 100%);
  transform: translateY(-2px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 6px 24px rgba(212, 160, 23, 0.4);
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  color: white;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 4px 12px rgba(0, 0, 0, 0.3);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.14);
  transform: translateY(-2px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 6px 18px rgba(0, 0, 0, 0.4);
}

.btn-ok {
  background: linear-gradient(135deg, #d4a017 0%, #b8860b 100%);
  border-color: rgba(212, 160, 23, 0.6);
  color: white;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 4px 14px rgba(0, 0, 0, 0.4);
}

.btn-ok:hover {
  background: linear-gradient(135deg, #e6b422 0%, #d4a017 100%);
  transform: translateY(-2px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 6px 24px rgba(212, 160, 23, 0.4);
}
</style>
