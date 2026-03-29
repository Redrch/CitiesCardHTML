<template>
  <div class="save-manager-modal" @click.self="$emit('close')">
    <div class="save-manager-content">
      <div class="save-manager-header">
        <h2>{{ mode === 'save' ? '保存游戏' : '加载游戏' }}</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="save-manager-body">
        <!-- 存档槽位列表 -->
        <div class="save-slots">
          <div
            v-for="index in MAX_SAVE_SLOTS"
            :key="index - 1"
            class="save-slot"
            :class="{
              'save-slot-empty': !getSaveInfo(index - 1),
              'save-slot-current': currentSaveSlot === (index - 1)
            }"
            @click="selectSlot(index - 1)"
          >
            <div class="save-slot-header">
              <span class="save-slot-number">槽位 {{ index }}</span>
              <span v-if="currentSaveSlot === (index - 1)" class="badge good">当前</span>
            </div>

            <div v-if="getSaveInfo(index - 1)" class="save-slot-info">
              <div class="save-name">{{ getSaveInfo(index - 1).saveName }}</div>
              <div class="save-meta">
                <span class="muted">回合 {{ getSaveInfo(index - 1).round }}</span>
                <span class="muted">{{ getSaveInfo(index - 1).playerCount }}人</span>
                <span class="muted">{{ formatDate(getSaveInfo(index - 1).timestamp) }}</span>
              </div>

              <div class="save-actions">
                <button
                  v-if="mode === 'load'"
                  class="btn btn-primary btn-sm"
                  @click.stop="loadFromSlot(index - 1)"
                >
                  加载
                </button>
                <button
                  v-if="mode === 'save'"
                  class="btn btn-primary btn-sm"
                  @click.stop="saveToSlot(index - 1)"
                >
                  覆盖
                </button>
                <button
                  class="btn btn-sm"
                  @click.stop="exportSlot(index - 1)"
                >
                  导出
                </button>
                <button
                  class="btn bad btn-sm"
                  @click.stop="deleteSlot(index - 1)"
                >
                  删除
                </button>
              </div>
            </div>

            <div v-else class="save-slot-empty-info">
              <div class="empty-icon">📁</div>
              <div class="empty-text">空槽位</div>
              <button
                v-if="mode === 'save'"
                class="btn btn-primary"
                @click.stop="saveToSlot(index - 1)"
              >
                保存到此槽位
              </button>
              <button
                v-else
                class="btn"
                @click.stop="showImportDialog(index - 1)"
              >
                导入存档
              </button>
            </div>
          </div>
        </div>

        <!-- 自动保存 -->
        <div v-if="mode === 'load'" class="auto-save-section">
          <h3>自动保存</h3>
          <button
            class="btn"
            @click="loadAutoSaved"
            style="width: 100%;"
          >
            加载自动保存
          </button>
        </div>

        <!-- 导入对话框 -->
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none;"
          @change="handleFileImport"
        />
      </div>

      <div class="save-manager-footer">
        <button class="btn bad" @click="clearAll" v-if="saveSlots.length > 0">
          清除所有存档
        </button>
        <button class="btn" @click="$emit('close')">
          关闭
        </button>
      </div>

      <!-- 保存名称输入对话框 -->
      <div v-if="showSaveNameDialog" class="save-name-dialog">
        <h3>输入存档名称</h3>
        <input
          v-model="saveName"
          type="text"
          placeholder="例如：第10回合存档"
          @keyup.enter="confirmSave"
          style="width: 100%; margin: 12px 0;"
        />
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button class="btn" @click="showSaveNameDialog = false">取消</button>
          <button class="btn btn-primary" @click="confirmSave">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameSave } from '../../composables/useGameSave'
import { useDialog } from '../../composables/useDialog'

const { showAlert, showConfirm } = useDialog()

const props = defineProps({
  mode: {
    type: String,
    default: 'save', // 'save' or 'load'
    validator: (value) => ['save', 'load'].includes(value)
  }
})

const emit = defineEmits(['close', 'saved', 'loaded'])

const {
  saveSlots,
  currentSaveSlot,
  MAX_SAVE_SLOTS,
  saveGame,
  loadGame,
  loadAutoSave,
  deleteSave,
  exportSave,
  importSave,
  getSaveInfo,
  clearAllSaves
} = useGameSave()

const selectedSlot = ref(null)
const showSaveNameDialog = ref(false)
const saveName = ref('')
const fileInput = ref(null)
const pendingImportSlot = ref(null)

function selectSlot(index) {
  selectedSlot.value = index
}

function saveToSlot(index) {
  selectedSlot.value = index
  saveName.value = `存档 ${new Date().toLocaleString('zh-CN')}`
  showSaveNameDialog.value = true
}

async function confirmSave() {
  if (!saveName.value.trim()) {
    await showAlert('请输入存档名称', { title: '提示', icon: '💡' })
    return
  }

  const result = saveGame(selectedSlot.value, saveName.value)

  if (result.success) {
    showSaveNameDialog.value = false
    emit('saved', result)
    await showAlert(result.message, { title: '保存成功', icon: '✅' })
  } else {
    await showAlert(result.message, { title: '保存失败', icon: '❌' })
  }
}

async function loadFromSlot(index) {
  if (!await showConfirm(`确定要加载槽位 ${index + 1} 的存档吗？当前进度将被覆盖！`, { title: '加载存档', icon: '📂' })) {
    return
  }

  const result = loadGame(index)

  if (result.success) {
    emit('loaded', result)
    emit('close')
    await showAlert(result.message, { title: '加载成功', icon: '✅' })
  } else {
    await showAlert(result.message, { title: '加载失败', icon: '❌' })
  }
}

async function loadAutoSaved() {
  if (!await showConfirm('确定要加载自动保存吗？当前进度将被覆盖！', { title: '加载自动保存', icon: '📂' })) {
    return
  }

  const result = loadAutoSave()

  if (result.success) {
    emit('loaded', result)
    emit('close')
    await showAlert(result.message, { title: '加载成功', icon: '✅' })
  } else {
    await showAlert(result.message, { title: '加载失败', icon: '❌' })
  }
}

async function deleteSlot(index) {
  if (!await showConfirm(`确定要删除槽位 ${index + 1} 的存档吗？此操作不可恢复！`, { title: '删除存档', icon: '🗑️' })) {
    return
  }

  const result = deleteSave(index)
  await showAlert(result.message, { title: '提示', icon: '💡' })
}

async function exportSlot(index) {
  const result = exportSave(index)
  if (!result.success) {
    await showAlert(result.message, { title: '导出失败', icon: '❌' })
  }
}

function showImportDialog(index) {
  pendingImportSlot.value = index
  fileInput.value.click()
}

async function handleFileImport(event) {
  const file = event.target.files[0]
  if (!file) return

  const result = await importSave(file, pendingImportSlot.value)
  await showAlert(result.message, { title: '导入结果', icon: '📦' })

  // 清空文件输入
  event.target.value = ''
  pendingImportSlot.value = null
}

async function clearAll() {
  if (!await showConfirm('确定要清除所有存档吗？此操作不可恢复！', { title: '清除存档', icon: '🗑️' })) {
    return
  }

  const result = clearAllSaves()
  await showAlert(result.message, { title: '提示', icon: '💡' })
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.save-manager-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(30, 41, 59, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.save-manager-content {
  background: var(--panel);
  border-radius: 12px;
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(100, 116, 145, 0.18);
}

.save-manager-header {
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.save-manager-header h2 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 32px;
  cursor: pointer;
  color: var(--muted);
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--accent);
}

.save-manager-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.save-slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.save-slot {
  padding: 16px;
  background: var(--bg);
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 150px;
  display: flex;
  flex-direction: column;
}

.save-slot:hover {
  border-color: var(--accent);
  background: rgba(59, 130, 246, 0.06);
}

.save-slot.save-slot-current {
  border-color: var(--good);
}

.save-slot.save-slot-empty {
  border-style: dashed;
}

.save-slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.save-slot-number {
  font-weight: bold;
  font-size: 14px;
}

.save-slot-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.save-name {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 14px;
}

.save-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  font-size: 11px;
}

.save-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: auto;
}

.save-slot-empty-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.3;
}

.empty-text {
  color: var(--muted);
  font-size: 12px;
}

.auto-save-section {
  padding: 16px;
  background: var(--bg);
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  margin-top: 12px;
}

.auto-save-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
}

.save-manager-footer {
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 11px;
}

.save-name-dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--panel);
  padding: 20px;
  border-radius: 8px;
  border: 2px solid var(--accent);
  min-width: 300px;
  box-shadow: 0 10px 40px rgba(100, 116, 145, 0.18);
}

.save-name-dialog h3 {
  margin: 0 0 12px 0;
}
</style>
