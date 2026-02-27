<template>
  <div
    v-if="modelValue"
    class="modal-backdrop"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2>更新日志</h2>
        <button class="close-btn" @click="close">关闭</button>
      </div>

      <div class="modal-body">
        <div
          v-for="entry in changelog"
          :key="entry.version"
          class="changelog-entry"
        >
          <div class="entry-header">
            <span class="version-badge">{{ entry.version }}</span>
            <span class="entry-date">{{ entry.date }}</span>
          </div>
          <div class="entry-desc">{{ entry.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const changelog = [
  { date: '2026.2.26', version: 'V1.0.6', desc: '修复了战斗动画无法显示的问题' },
  { date: '2026.2.22', version: 'V1.0.5', desc: '重构了游戏界面UI，为金币技能添加动画展示' },
  { date: '2026.2.19', version: 'V1.0.4', desc: '修复部分技能逻辑出错问题' },
  { date: '2026.2.12', version: 'V1.0.3', desc: '更新城市题库功能模拟演练' },
  { date: '2026.2.9', version: 'V1.0.2', desc: '修复了回合结算问题，更新了部分城市数据' },
  { date: '2026.1.22', version: 'V1.0.1', desc: '优化了基本战斗逻辑和网页UI' },
  { date: '2025.12.29', version: 'V1.0.0', desc: '新版正式上线' }
]

function close() {
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
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.modal-content {
  background: white;
  margin: 20px;
  max-width: 600px;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px 8px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: 24px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.changelog-entry {
  margin-bottom: 16px;
  padding: 16px;
  border-left: 4px solid #667eea;
  background: #f8f9ff;
  border-radius: 4px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.changelog-entry:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.entry-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.version-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
}

.entry-date {
  color: #888;
  font-size: 14px;
}

.entry-desc {
  color: #424242;
  line-height: 1.6;
  font-size: 15px;
}
</style>
