<template>
  <div id="modeSelection">
    <div class="mode-selection-container">
      <!-- 返回按钮 -->
      <button class="back-btn" @click="$emit('back')">
        <span class="back-icon">←</span>
        <span>返回</span>
      </button>

      <!-- 标题 -->
      <div class="selection-title">
        <h1 class="title-text">选择游戏模式</h1>
        <p class="subtitle">Choose Your Game Mode</p>
      </div>

      <!-- 模式选择卡片 -->
      <div class="mode-cards">
        <!-- 单机模式 -->
        <div class="mode-card coming-soon" @click="showComingSoon">
          <div class="mode-icon">🎮</div>
          <h3 class="mode-title">单机模式</h3>
          <p class="mode-desc">与AI对战，练习技能</p>
          <ul class="mode-features">
            <li>✓ 2P/3P/2v2 多种模式</li>
            <li>✓ 智能AI对手</li>
            <li>✓ 随时开始游戏</li>
          </ul>
          <div class="mode-badge coming-soon-badge">敬请期待</div>
        </div>

        <!-- 在线对战 -->
        <div class="mode-card" @click="$emit('select-online')">
          <div class="mode-icon">🌐</div>
          <h3 class="mode-title">在线对战</h3>
          <p class="mode-desc">与真实玩家对战</p>
          <ul class="mode-features">
            <li>✓ 实时在线对战</li>
            <li>✓ 创建/加入房间</li>
            <li>✓ 多人同步游戏</li>
          </ul>
          <div class="mode-badge hot">火热</div>
        </div>
      </div>

      <!-- 敬请期待提示 -->
      <Transition name="toast">
        <div v-if="showToast" class="toast-message">
          🚧 敬请期待，该模式正在开发中...
        </div>
      </Transition>

      <!-- 提示信息 -->
      <div class="hint-text">
        <p>💡 提示：在线对战模式现已开放，快邀请朋友一起玩吧！</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineEmits(['back', 'select-offline', 'select-online'])

const showToast = ref(false)
let toastTimer = null

function showComingSoon() {
  showToast.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, 2000)
}
</script>

<style scoped>
#modeSelection {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
#modeSelection::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
  animation: rotate 30s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.mode-selection-container {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  width: 100%;
  text-align: center;
}

/* 返回按钮 */
.back-btn {
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(30, 41, 59, 0.8);
  border: 2px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  padding: 12px 24px;
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.back-btn:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: rgba(148, 163, 184, 0.5);
  transform: translateX(-4px);
}

.back-icon {
  font-size: 20px;
}

/* 标题 */
.selection-title {
  margin-bottom: 60px;
  margin-top: 60px;
  animation: fadeInDown 0.8s ease-out;
}

.title-text {
  font-size: 56px;
  font-weight: 900;
  background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  text-shadow: 0 0 40px rgba(59, 130, 246, 0.5);
  letter-spacing: 4px;
}

.subtitle {
  font-size: 16px;
  color: #94a3b8;
  margin: 10px 0 0 0;
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* 模式卡片 */
.mode-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 40px;
  margin-bottom: 40px;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.mode-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.05) 100%);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 24px;
  padding: 40px 32px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  text-align: left;
}

.mode-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.mode-card:hover::before {
  opacity: 1;
}

.mode-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(59, 130, 246, 0.6);
  box-shadow: 0 20px 60px rgba(59, 130, 246, 0.3),
              0 0 0 1px rgba(59, 130, 246, 0.2);
}

.mode-card:active {
  transform: translateY(-4px) scale(1.01);
}

.mode-icon {
  font-size: 64px;
  margin-bottom: 20px;
  display: block;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.mode-title {
  font-size: 32px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 12px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.mode-desc {
  font-size: 16px;
  color: #cbd5e1;
  margin: 0 0 20px 0;
  font-weight: 400;
}

.mode-features {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.mode-features li {
  font-size: 14px;
  color: #94a3b8;
  margin-bottom: 8px;
  padding-left: 0;
}

.mode-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  animation: pulse 2s ease-in-out infinite;
}

.mode-badge.recommended {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.mode-badge.hot {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
}

.mode-badge.coming-soon-badge {
  background: linear-gradient(135deg, #64748b 0%, #475569 100%);
  box-shadow: 0 4px 12px rgba(100, 116, 139, 0.4);
  animation: none;
}

/* 敬请期待卡片 */
.mode-card.coming-soon {
  opacity: 0.6;
  border-color: rgba(100, 116, 139, 0.3);
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(71, 85, 105, 0.05) 100%);
}

.mode-card.coming-soon:hover {
  transform: translateY(-4px) scale(1.01);
  border-color: rgba(100, 116, 139, 0.5);
  box-shadow: 0 12px 40px rgba(100, 116, 139, 0.2);
  opacity: 0.75;
}

.mode-card.coming-soon::before {
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, transparent 100%);
}

/* Toast 提示 */
.toast-message {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
  border: 2px solid rgba(100, 116, 139, 0.5);
  border-radius: 16px;
  padding: 16px 32px;
  color: #e2e8f0;
  font-size: 16px;
  font-weight: 600;
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  white-space: nowrap;
}

.toast-enter-active {
  animation: toastIn 0.3s ease-out;
}

.toast-leave-active {
  animation: toastOut 0.3s ease-in;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@keyframes toastOut {
  from {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 提示信息 */
.hint-text {
  animation: fadeIn 0.8s ease-out 0.4s both;
}

.hint-text p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  font-weight: 400;
}

/* 动画 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mode-cards {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .title-text {
    font-size: 40px;
  }

  .subtitle {
    font-size: 14px;
  }

  .mode-card {
    padding: 32px 24px;
  }

  .mode-icon {
    font-size: 48px;
  }

  .mode-title {
    font-size: 24px;
  }

  .mode-desc {
    font-size: 14px;
  }

  .back-btn {
    padding: 10px 20px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .selection-title {
    margin-top: 40px;
    margin-bottom: 40px;
  }

  .title-text {
    font-size: 32px;
    letter-spacing: 2px;
  }

  .subtitle {
    font-size: 12px;
  }

  .mode-card {
    padding: 24px 20px;
  }

  .mode-icon {
    font-size: 40px;
  }

  .mode-title {
    font-size: 20px;
  }

  .mode-badge {
    font-size: 11px;
    padding: 4px 12px;
  }
}
</style>
