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
          <p>Version 1.0.5</p>
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
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
#mainMenu::before {
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

.menu-container {
  position: relative;
  z-index: 1;
  max-width: 600px;
  width: 100%;
  text-align: center;
}

/* 游戏标题 */
.game-title {
  margin-bottom: 48px;
  animation: fadeInDown 0.8s ease-out;
}

.title-text {
  font-size: 64px;
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
  font-size: 18px;
  color: #94a3b8;
  margin: 10px 0 0 0;
  font-weight: 300;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* 游戏模式卡片 */
.game-modes {
  margin-bottom: 24px;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.mode-card {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 20px;
  padding: 28px 32px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
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
  font-size: 48px;
  margin-bottom: 12px;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.mode-title {
  font-size: 26px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.mode-desc {
  font-size: 15px;
  color: #cbd5e1;
  margin: 0;
  font-weight: 400;
}

.mode-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 辅助功能按钮 - 2列网格，2-2-1布局，最后一个居中 */
.menu-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 30px;
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.menu-btn:last-child {
  grid-column: 1 / -1;
  max-width: calc(50% - 7px);
  justify-self: center;
}

.menu-btn {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(100, 116, 139, 0.3);
  border-radius: 14px;
  padding: 18px 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  backdrop-filter: blur(10px);
  min-width: 0;
}

.menu-btn:hover {
  background: rgba(51, 65, 85, 0.9);
  border-color: rgba(148, 163, 184, 0.4);
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.menu-btn:active {
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.btn-text {
  font-size: 16px;
  font-weight: 600;
  color: #e2e8f0;
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
  font-size: 14px;
  color: #64748b;
  margin: 0;
  font-weight: 300;
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
    font-size: 14px;
  }

  .mode-card {
    padding: 24px 20px;
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
    letter-spacing: 2px;
  }

  .subtitle {
    font-size: 12px;
  }

  .mode-card {
    padding: 20px 16px;
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
