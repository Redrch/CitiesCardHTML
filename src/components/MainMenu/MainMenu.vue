<template>
  <div id="mainMenu">
    <div class="menu-container">
      <!-- 游戏标题 -->
      <div class="game-title">
        <h1 class="title-text">城市卡牌游戏</h1>
        <p class="subtitle">City Card Battle</p>
      </div>

      <!-- 主要游戏模式 -->
      <div class="game-modes">
        <div class="mode-card primary" @click="$emit('enter-player-mode')">
          <div class="mode-icon">🎮</div>
          <h3 class="mode-title">开始游戏</h3>
          <p class="mode-desc">单机模式 / 在线对战</p>
          <div class="mode-badge">推荐</div>
        </div>
      </div>

      <!-- 辅助功能按钮 -->
      <div class="menu-buttons">
        <button class="menu-btn" @click="$emit('show-game-intro')">
          <span class="btn-icon">📜</span>
          <span class="btn-text">游戏介绍</span>
        </button>
        <button class="menu-btn" @click="$emit('show-skill-guide')">
          <span class="btn-icon">📖</span>
          <span class="btn-text">技能介绍</span>
        </button>
        <button class="menu-btn" @click="$emit('show-question-bank')">
          <span class="btn-icon">🏙️</span>
          <span class="btn-text">城市题库</span>
        </button>
        <button class="menu-btn" @click="$emit('show-city-info')">
          <span class="btn-icon">ℹ️</span>
          <span class="btn-text">城市介绍</span>
        </button>
        <button class="menu-btn" @click="$emit('show-changelog')">
          <span class="btn-icon">📋</span>
          <span class="btn-text">更新日志</span>
        </button>
      </div>

      <!-- 底部信息栏 -->
      <div class="footer-info">
        <div class="footer-left">
          <p>QQ交流群：1073827457</p>
        </div>
        <div class="footer-right">
          <p>Version 1.0.8</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
defineEmits(['enter-player-mode', 'show-game-intro', 'show-skill-guide', 'show-question-bank', 'show-city-info', 'show-changelog'])
</script>

<style scoped>
#mainMenu {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(150deg, #2a2340 0%, #1e2a4a 30%, #2a3a5c 60%, #3a2a4a 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* Ambient glow spots */
#mainMenu::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 30%, rgba(212, 160, 23, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.06) 0%, transparent 60%);
  pointer-events: none;
}

/* Grid pattern */
#mainMenu::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 50px,
      rgba(255, 255, 255, 0.02) 50px,
      rgba(255, 255, 255, 0.02) 51px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 50px,
      rgba(255, 255, 255, 0.02) 50px,
      rgba(255, 255, 255, 0.02) 51px
    );
  pointer-events: none;
}

.menu-container {
  position: relative;
  z-index: 1;
  max-width: 620px;
  width: 100%;
  text-align: center;
}

/* 游戏标题 */
.game-title {
  margin-bottom: 44px;
  animation: fadeInDown 0.8s ease-out;
}

.title-text {
  font-size: 64px;
  font-weight: 900;
  background: linear-gradient(135deg, #f0c850 0%, #d4a017 40%, #e8c24a 60%, #f5d76e 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  filter: drop-shadow(0 0 30px rgba(212, 160, 23, 0.4));
  letter-spacing: 6px;
}

.subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.45);
  margin: 12px 0 0 0;
  font-weight: 500;
  letter-spacing: 6px;
  text-transform: uppercase;
}

/* 游戏模式卡片 */
.game-modes {
  margin-bottom: 28px;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.mode-card {
  background: linear-gradient(135deg, rgba(212, 160, 23, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%);
  border: 2px solid rgba(212, 160, 23, 0.35);
  border-radius: 20px;
  padding: 32px 32px 28px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.mode-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #d4a017, #f0c850, #d4a017, transparent);
}

.mode-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(212, 160, 23, 0.08) 0%, transparent 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.mode-card:hover::after {
  opacity: 1;
}

.mode-card:hover {
  transform: translateY(-6px) scale(1.01);
  border-color: rgba(212, 160, 23, 0.6);
  box-shadow: 0 16px 48px rgba(212, 160, 23, 0.2), 0 0 30px rgba(212, 160, 23, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.mode-card:active {
  transform: translateY(-2px) scale(1.005);
}

.mode-icon {
  font-size: 48px;
  margin-bottom: 12px;
  animation: bounce 2.5s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.mode-title {
  font-size: 28px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 8px 0;
  letter-spacing: 2px;
}

.mode-desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.45);
  margin: 0;
  font-weight: 400;
  letter-spacing: 1px;
}

.mode-badge {
  position: absolute;
  top: 18px;
  right: 18px;
  background: linear-gradient(135deg, #d4a017 0%, #b8860b 100%);
  color: white;
  padding: 5px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(212, 160, 23, 0.5);
  animation: pulse 2s ease-in-out infinite;
  z-index: 2;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 4px 14px rgba(212, 160, 23, 0.5); }
  50% { transform: scale(1.05); box-shadow: 0 4px 20px rgba(212, 160, 23, 0.65); }
}

/* 辅助功能按钮 */
.menu-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 32px;
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.menu-btn:last-child {
  grid-column: 1 / -1;
  max-width: calc(50% - 7px);
  justify-self: center;
}

.menu-btn {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 16px 22px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  backdrop-filter: blur(8px);
  min-width: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.menu-btn:hover {
  transform: translateY(-3px);
}

.menu-btn:active {
  transform: translateY(-1px);
}

/* Per-button color tints */
.menu-btn:nth-child(1) {
  border-color: rgba(59, 130, 246, 0.25);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%);
}
.menu-btn:nth-child(1):hover {
  border-color: rgba(59, 130, 246, 0.5);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.08) 100%);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(59, 130, 246, 0.15);
}

.menu-btn:nth-child(2) {
  border-color: rgba(139, 92, 246, 0.25);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%);
}
.menu-btn:nth-child(2):hover {
  border-color: rgba(139, 92, 246, 0.5);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.08) 100%);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.2), inset 0 1px 0 rgba(139, 92, 246, 0.15);
}

.menu-btn:nth-child(3) {
  border-color: rgba(20, 184, 166, 0.25);
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.12) 0%, rgba(20, 184, 166, 0.04) 100%);
}
.menu-btn:nth-child(3):hover {
  border-color: rgba(20, 184, 166, 0.5);
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(20, 184, 166, 0.08) 100%);
  box-shadow: 0 8px 24px rgba(20, 184, 166, 0.2), inset 0 1px 0 rgba(20, 184, 166, 0.15);
}

.menu-btn:nth-child(4) {
  border-color: rgba(212, 160, 23, 0.25);
  background: linear-gradient(135deg, rgba(212, 160, 23, 0.12) 0%, rgba(212, 160, 23, 0.04) 100%);
}
.menu-btn:nth-child(4):hover {
  border-color: rgba(212, 160, 23, 0.5);
  background: linear-gradient(135deg, rgba(212, 160, 23, 0.2) 0%, rgba(212, 160, 23, 0.08) 100%);
  box-shadow: 0 8px 24px rgba(212, 160, 23, 0.2), inset 0 1px 0 rgba(212, 160, 23, 0.15);
}

.menu-btn:nth-child(5) {
  border-color: rgba(239, 68, 68, 0.2);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.03) 100%);
}
.menu-btn:nth-child(5):hover {
  border-color: rgba(239, 68, 68, 0.45);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(239, 68, 68, 0.06) 100%);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.18), inset 0 1px 0 rgba(239, 68, 68, 0.12);
}

.btn-icon {
  font-size: 24px;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.btn-text {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  white-space: nowrap;
}

/* 底部信息栏 */
.footer-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: fadeIn 0.8s ease-out 0.6s both;
}

.footer-left p,
.footer-right p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
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
  .game-title {
    margin-bottom: 36px;
  }

  .title-text {
    font-size: 48px;
  }

  .subtitle {
    font-size: 13px;
  }

  .mode-card {
    padding: 24px 20px 20px;
  }

  .mode-icon {
    font-size: 40px;
    margin-bottom: 8px;
  }

  .mode-title {
    font-size: 22px;
  }

  .mode-desc {
    font-size: 14px;
  }

  .menu-buttons {
    gap: 10px;
  }

  .menu-btn {
    padding: 14px 18px;
  }

  .menu-btn:last-child {
    max-width: calc(50% - 5px);
  }

  .btn-icon {
    font-size: 22px;
  }

  .btn-text {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .game-title {
    margin-bottom: 28px;
  }

  .title-text {
    font-size: 36px;
    letter-spacing: 3px;
  }

  .subtitle {
    font-size: 11px;
    letter-spacing: 4px;
  }

  .mode-card {
    padding: 20px 16px 18px;
  }

  .mode-icon {
    font-size: 36px;
    margin-bottom: 6px;
  }

  .mode-title {
    font-size: 20px;
  }

  .mode-desc {
    font-size: 13px;
  }

  .mode-badge {
    font-size: 11px;
    padding: 3px 10px;
    top: 12px;
    right: 12px;
  }

  .menu-buttons {
    gap: 8px;
  }

  .menu-btn {
    padding: 12px 14px;
    gap: 8px;
    border-radius: 12px;
  }

  .menu-btn:last-child {
    max-width: calc(50% - 4px);
  }

  .btn-icon {
    font-size: 20px;
  }

  .btn-text {
    font-size: 13px;
  }
}
</style>
