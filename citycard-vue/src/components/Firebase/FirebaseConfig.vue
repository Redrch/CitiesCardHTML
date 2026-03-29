<template>
  <div class="firebase-config-panel panel">
    <h2 style="text-align: center;">在线匹配设置</h2>

    <div :class="['firebase-status', isFirebaseReady ? 'connected' : 'disconnected']">
      {{ isFirebaseReady ? '✓ 在线模式已启用' : '⚠ 当前为本地模式' }}
    </div>

    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: var(--accent);">快速开始</h3>

      <!-- 使用公共服务器选项 -->
      <div v-if="hasDefault">
        <button class="menu-btn" @click="useDefaultConfig" style="width: 100%; margin-bottom: 10px;">
          🚀 使用公共服务器（推荐）
        </button>
        <div class="muted" style="font-size: 12px; margin-bottom: 15px;">
          点击后即可跨设备、跨浏览器匹配，无需任何配置
        </div>
      </div>

      <!-- 无公共服务器警告 -->
      <div v-else style="background: rgba(251, 191, 36, 0.1); border: 1px solid var(--warn); border-radius: 6px; padding: 15px; margin-bottom: 15px;">
        <div style="color: var(--warn); font-weight: bold; margin-bottom: 8px;">⚠️ 需要配置公共服务器</div>
        <div class="muted" style="font-size: 13px; line-height: 1.6;">
          管理员需要创建 Firebase 项目并在代码中配置 DEFAULT_FIREBASE_CONFIG。<br>
          配置后，所有玩家都可以直接使用在线匹配功能，无需单独配置。
        </div>
      </div>

      <!-- 本地模式选项 -->
      <button class="btn" @click="skipFirebaseConfig" style="width: 100%;">
        💾 使用本地模式（同浏览器多标签页）
      </button>
    </div>

    <!-- 高级选项：自定义配置 -->
    <details style="margin: 20px 0;">
      <summary style="cursor: pointer; padding: 10px; background: #f1f5f9; border-radius: 6px; margin-bottom: 10px;">
        🔧 高级选项：使用自定义 Firebase 配置
      </summary>

      <div style="padding: 15px; background: #f8fafc; border-radius: 6px; margin-top: 10px;">
        <div style="margin-bottom: 15px;">
          <h4 style="margin-top: 0;">创建自己的 Firebase 项目</h4>
          <ol style="line-height: 1.8; color: var(--muted); font-size: 13px;">
            <li>访问 <a href="https://console.firebase.google.com/" target="_blank" style="color: var(--accent);">Firebase Console</a></li>
            <li>创建项目 → 启用 Realtime Database（测试模式）</li>
            <li>获取配置（项目设置 → 网页应用）</li>
            <li>粘贴配置到下方</li>
          </ol>
        </div>

        <div style="margin: 15px 0;">
          <label>Firebase 配置 (JSON 格式)：</label>
          <textarea
            v-model="configInput"
            style="min-height: 120px;"
            placeholder='{
  "apiKey": "your-api-key",
  "databaseURL": "https://your-project.firebaseio.com",
  "projectId": "your-project-id"
}'
          ></textarea>
        </div>

        <button class="confirm-cities-btn" @click="saveAndInitFirebase" style="width: 100%;">
          保存并连接
        </button>
      </div>
    </details>

    <div class="muted" style="margin-top: 20px; font-size: 12px; line-height: 1.6; text-align: center;">
      💡 推荐使用公共服务器或本地模式，简单快捷
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  isFirebaseReady,
  hasDefaultConfig,
  initializeFirebase,
  getDefaultConfig,
  loadFirebaseConfig,
  saveFirebaseConfig as saveConfig
} from '../../composables/useFirebase'
import { useNotification } from '../../composables/useNotification'

const emit = defineEmits(['initialized', 'skip'])

const { showNotification } = useNotification()
const configInput = ref('')
const hasDefault = computed(() => hasDefaultConfig())

onMounted(() => {
  // 加载已保存的配置
  const savedConfig = loadFirebaseConfig()
  if (savedConfig) {
    configInput.value = JSON.stringify(savedConfig, null, 2)
  }
})

/**
 * 使用默认配置
 */
function useDefaultConfig() {
  console.log('[Firebase] 尝试使用默认配置连接公共服务器...')
  if (!hasDefaultConfig()) {
    console.error('[Firebase] 公共服务器未配置！')
    showNotification('公共服务器未配置！请联系管理员或使用自定义配置。', 'error')
    return
  }

  console.log('[Firebase] 使用默认配置初始化 Firebase...')
  if (initializeFirebase(getDefaultConfig())) {
    console.log('[Firebase] ✓ 在线模式已成功启用！')
    showNotification('✓ 在线模式已启用！现在可以跨设备匹配了。', 'success')
    emit('initialized')
  } else {
    showNotification('初始化失败，请检查网络连接', 'error')
  }
}

/**
 * 保存并初始化 Firebase
 */
function saveAndInitFirebase() {
  const configStr = configInput.value.trim()

  if (!configStr) {
    showNotification('请输入 Firebase 配置！', 'warning')
    return
  }

  try {
    const config = JSON.parse(configStr)

    // 验证必要字段
    if (!config.apiKey || !config.databaseURL) {
      showNotification('配置不完整！请确保包含 apiKey 和 databaseURL 字段。', 'error')
      return
    }

    saveConfig(config)

    if (initializeFirebase(config)) {
      showNotification('Firebase 配置成功！', 'success')
      emit('initialized')
    } else {
      showNotification('Firebase 初始化失败，请检查配置是否正确', 'error')
    }
  } catch (error) {
    showNotification('配置格式错误：' + error.message, 'error')
  }
}

/**
 * 跳过 Firebase 配置，使用本地模式
 */
function skipFirebaseConfig() {
  console.log('[Firebase] 选择使用本地模式')
  emit('skip')
}
</script>

<style scoped>
.firebase-config-panel {
  max-width: 700px;
  margin: 40px auto;
  padding: 30px;
  background: var(--panel);
  border: 2px solid var(--accent);
  border-radius: 12px;
}

.firebase-config-panel h3 {
  color: var(--accent);
  margin-top: 0;
}

.firebase-config-panel textarea {
  font-family: monospace;
  font-size: 12px;
  min-height: 150px;
}

.firebase-status {
  padding: 10px;
  border-radius: 6px;
  margin: 10px 0;
  text-align: center;
}

.firebase-status.connected {
  background: rgba(52, 211, 153, 0.1);
  border: 1px solid var(--good);
  color: var(--good);
}

.firebase-status.disconnected {
  background: rgba(248, 113, 113, 0.1);
  border: 1px solid var(--bad);
  color: var(--bad);
}
</style>
