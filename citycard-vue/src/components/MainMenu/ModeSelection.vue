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
  background: linear-gradient(150deg, #2a2340 0%, #221a42 30%, #2a2a5c 60%, #3a2a4a 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Floating card outlines via SVG */
#modeSelection::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800'%3E%3C!-- Card outlines with semi-transparent fill --%3E%3Crect x='80' y='60' width='70' height='100' rx='8' fill='rgba(212,160,23,0.03)' stroke='rgba(212,160,23,0.18)' stroke-width='1.5' transform='rotate(-15 115 110)'/%3E%3Crect x='600' y='100' width='60' height='85' rx='7' fill='rgba(139,92,246,0.02)' stroke='rgba(212,160,23,0.15)' stroke-width='1.5' transform='rotate(20 630 142)'/%3E%3Crect x='200' y='500' width='75' height='105' rx='8' fill='rgba(139,92,246,0.03)' stroke='rgba(139,92,246,0.16)' stroke-width='1.5' transform='rotate(10 237 552)'/%3E%3Crect x='650' y='550' width='55' height='80' rx='6' fill='rgba(212,160,23,0.02)' stroke='rgba(212,160,23,0.13)' stroke-width='1.5' transform='rotate(-25 677 590)'/%3E%3Crect x='400' y='200' width='65' height='92' rx='7' fill='rgba(139,92,246,0.02)' stroke='rgba(139,92,246,0.14)' stroke-width='1.5' transform='rotate(30 432 246)'/%3E%3Crect x='100' y='300' width='50' height='72' rx='6' fill='rgba(212,160,23,0.02)' stroke='rgba(212,160,23,0.12)' stroke-width='1' transform='rotate(-8 125 336)'/%3E%3Crect x='500' y='400' width='80' height='112' rx='9' fill='rgba(139,92,246,0.02)' stroke='rgba(139,92,246,0.12)' stroke-width='1' transform='rotate(18 540 456)'/%3E%3Crect x='720' y='300' width='45' height='64' rx='5' fill='rgba(212,160,23,0.02)' stroke='rgba(212,160,23,0.10)' stroke-width='1' transform='rotate(-30 742 332)'/%3E%3C!-- Additional scattered cards --%3E%3Crect x='300' y='650' width='60' height='85' rx='7' fill='rgba(212,160,23,0.02)' stroke='rgba(212,160,23,0.11)' stroke-width='1' transform='rotate(15 330 692)'/%3E%3Crect x='750' y='450' width='40' height='58' rx='5' fill='rgba(139,92,246,0.02)' stroke='rgba(139,92,246,0.10)' stroke-width='1' transform='rotate(-20 770 479)'/%3E%3C!-- Compass rose center --%3E%3Ccircle cx='400' cy='400' r='60' fill='none' stroke='rgba(212,160,23,0.08)' stroke-width='1'/%3E%3Ccircle cx='400' cy='400' r='40' fill='none' stroke='rgba(139,92,246,0.06)' stroke-width='0.8'/%3E%3Cline x1='400' y1='335' x2='400' y2='465' stroke='rgba(212,160,23,0.07)' stroke-width='0.8'/%3E%3Cline x1='335' y1='400' x2='465' y2='400' stroke='rgba(212,160,23,0.07)' stroke-width='0.8'/%3E%3Cline x1='354' y1='354' x2='446' y2='446' stroke='rgba(139,92,246,0.05)' stroke-width='0.5'/%3E%3Cline x1='446' y1='354' x2='354' y2='446' stroke='rgba(139,92,246,0.05)' stroke-width='0.5'/%3E%3C/svg%3E");
  background-size: 100% 100%;
  opacity: 1;
  pointer-events: none;
  animation: floatCards 20s ease-in-out infinite;
}

@keyframes floatCards {
  0%, 100% { transform: translateY(0) translateX(0); }
  25% { transform: translateY(-8px) translateX(4px); }
  50% { transform: translateY(-4px) translateX(-6px); }
  75% { transform: translateY(-10px) translateX(2px); }
}

/* Ambient glows */
#modeSelection::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(212, 160, 23, 0.10) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.10) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.04) 0%, transparent 40%);
  pointer-events: none;
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
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  padding: 12px 24px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(12px);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.25);
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
  background: linear-gradient(135deg, #f0c850 0%, #d4a017 40%, #e8c24a 60%, #f5d76e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  filter: drop-shadow(0 0 20px rgba(212, 160, 23, 0.3));
  letter-spacing: 4px;
}

.subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.45);
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
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 40px 32px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  text-align: left;
}

.mode-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(212, 160, 23, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.mode-card:hover::before {
  opacity: 1;
}

.mode-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3),
              0 0 30px rgba(212, 160, 23, 0.1),
              0 0 0 1px rgba(255, 255, 255, 0.15);
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
  color: #ffffff;
  margin: 0 0 12px 0;
  text-shadow: none;
}

.mode-desc {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.45);
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
  color: rgba(255, 255, 255, 0.5);
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
  background: linear-gradient(135deg, #0d9668 0%, #047852 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.mode-badge.hot {
  background: linear-gradient(135deg, #e07b2a 0%, #d4910b 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.mode-badge.coming-soon-badge {
  background: linear-gradient(135deg, #4a5568 0%, #374151 100%);
  box-shadow: 0 4px 12px rgba(74, 85, 104, 0.4);
  animation: none;
}

/* 敬请期待卡片 */
.mode-card.coming-soon {
  opacity: 0.5;
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
}

.mode-card.coming-soon:hover {
  transform: translateY(-4px) scale(1.01);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  opacity: 0.65;
}

.mode-card.coming-soon::before {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%);
}

/* Toast 提示 */
.toast-message {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 16px 32px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 16px;
  font-weight: 600;
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
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
  color: rgba(255, 255, 255, 0.4);
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
