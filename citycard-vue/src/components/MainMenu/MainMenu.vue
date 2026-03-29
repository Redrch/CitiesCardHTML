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
          <p>Version 1.0.9</p>
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

/* Stars scattered across the sky */
#mainMenu::before {
  content: '';
  position: absolute;
  inset: 0;
  will-change: transform;
  transform: translateZ(0);
  background:
    /* Bright stars */
    radial-gradient(2px 2px at 5% 8%, rgba(255,255,255,0.7) 50%, transparent 50%),
    radial-gradient(2.5px 2.5px at 12% 20%, rgba(255,255,255,0.6) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 18% 5%, rgba(255,255,255,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 25% 15%, rgba(255,255,255,0.65) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 32% 3%, rgba(255,255,255,0.45) 50%, transparent 50%),
    radial-gradient(2px 2px at 38% 25%, rgba(255,255,255,0.55) 50%, transparent 50%),
    radial-gradient(3px 3px at 45% 10%, rgba(255,255,255,0.7) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 52% 18%, rgba(255,255,255,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 58% 6%, rgba(255,255,255,0.6) 50%, transparent 50%),
    radial-gradient(2.5px 2.5px at 65% 22%, rgba(255,255,255,0.65) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 72% 12%, rgba(255,255,255,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 78% 4%, rgba(255,255,255,0.55) 50%, transparent 50%),
    radial-gradient(2.5px 2.5px at 85% 16%, rgba(255,255,255,0.6) 50%, transparent 50%),
    radial-gradient(1.5px 1.5px at 92% 8%, rgba(255,255,255,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 96% 20%, rgba(255,255,255,0.55) 50%, transparent 50%),
    /* Dim stars */
    radial-gradient(1px 1px at 8% 30%, rgba(255,255,255,0.3) 50%, transparent 50%),
    radial-gradient(1px 1px at 22% 28%, rgba(255,255,255,0.25) 50%, transparent 50%),
    radial-gradient(1px 1px at 35% 35%, rgba(255,255,255,0.2) 50%, transparent 50%),
    radial-gradient(1px 1px at 48% 32%, rgba(255,255,255,0.25) 50%, transparent 50%),
    radial-gradient(1px 1px at 55% 28%, rgba(255,255,255,0.2) 50%, transparent 50%),
    radial-gradient(1px 1px at 68% 34%, rgba(255,255,255,0.25) 50%, transparent 50%),
    radial-gradient(1px 1px at 75% 30%, rgba(255,255,255,0.2) 50%, transparent 50%),
    radial-gradient(1px 1px at 88% 32%, rgba(255,255,255,0.25) 50%, transparent 50%),
    radial-gradient(1px 1px at 3% 40%, rgba(255,255,255,0.15) 50%, transparent 50%),
    radial-gradient(1px 1px at 42% 38%, rgba(255,255,255,0.2) 50%, transparent 50%),
    radial-gradient(1px 1px at 62% 40%, rgba(255,255,255,0.15) 50%, transparent 50%),
    radial-gradient(1px 1px at 82% 42%, rgba(255,255,255,0.2) 50%, transparent 50%),
    radial-gradient(1px 1px at 95% 38%, rgba(255,255,255,0.15) 50%, transparent 50%),
    /* Ambient glow */
    radial-gradient(ellipse at 20% 30%, rgba(212, 160, 23, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.06) 0%, transparent 60%);
  pointer-events: none;
  animation: starTwinkle 4s ease-in-out infinite alternate;
}

@keyframes starTwinkle {
  0% { opacity: 0.85; }
  100% { opacity: 1; }
}

/* City skyline with roads, parks, stations, and glowing windows */
#mainMenu::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 28vh;
  /* GPU layer promotion to prevent repaint stutter on zoom */
  will-change: transform;
  transform: translateZ(0);
  clip-path: polygon(
    0% 100%,
    /* Left residential block */
    0% 68%, 1% 68%, 1% 55%, 2.5% 55%, 2.5% 50%, 4% 50%, 4% 55%, 5% 55%, 5% 68%,
    /* Road gap */
    5.5% 68%, 5.5% 82%, 7% 82%, 7% 68%,
    /* Park area - low with tree silhouettes */
    7.5% 68%, 7.5% 75%, 8% 72%, 8.5% 68%, 9% 72%, 9.5% 75%, 10% 72%, 10.5% 68%, 11% 72%, 11.5% 75%, 12% 68%,
    /* Tall office tower */
    12.5% 68%, 12.5% 42%, 13% 38%, 13.5% 35%, 14% 32%, 14.5% 35%, 15% 38%, 15.5% 42%, 15.5% 68%,
    /* Mid-rise apartments */
    16% 68%, 16% 50%, 17.5% 50%, 17.5% 45%, 19% 45%, 19% 50%, 20% 50%, 20% 68%,
    /* Road gap */
    20.5% 68%, 20.5% 82%, 22% 82%, 22% 68%,
    /* Train station - wide with flat roof */
    22.5% 68%, 22.5% 58%, 23% 55%, 23.5% 52%, 27% 52%, 28% 55%, 28.5% 58%, 28.5% 68%,
    /* Commercial buildings */
    29% 68%, 29% 48%, 30% 40%, 31% 36%, 32% 40%, 33% 48%, 33% 68%,
    /* Road gap */
    33.5% 68%, 33.5% 82%, 35% 82%, 35% 68%,
    /* Low-rise shops */
    35.5% 68%, 35.5% 58%, 37% 58%, 37% 62%, 38.5% 62%, 38.5% 58%, 40% 58%, 40% 68%,
    /* Tall skyscraper with antenna */
    40.5% 68%, 40.5% 38%, 41% 32%, 41.3% 22%, 41.5% 18%, 41.7% 22%, 42% 32%, 42.5% 38%, 42.5% 68%,
    /* Mid buildings */
    43% 68%, 43% 52%, 44.5% 46%, 46% 46%, 47% 52%, 47% 68%,
    /* Park with paths */
    47.5% 68%, 47.5% 76%, 48% 73%, 48.5% 70%, 49% 73%, 49.5% 76%, 50% 73%, 50.5% 68%,
    /* Road gap */
    51% 68%, 51% 82%, 52.5% 82%, 52.5% 68%,
    /* Hotel / tall building */
    53% 68%, 53% 44%, 54% 40%, 55% 44%, 55% 68%,
    /* Residential towers */
    55.5% 68%, 55.5% 48%, 57% 42%, 58% 38%, 59% 42%, 60% 48%, 60% 68%,
    /* Road gap */
    60.5% 68%, 60.5% 82%, 62% 82%, 62% 68%,
    /* Shopping mall - wide, flat */
    62.5% 68%, 62.5% 56%, 63% 54%, 67% 54%, 67.5% 56%, 67.5% 68%,
    /* Apartments cluster */
    68% 68%, 68% 50%, 69% 44%, 70% 40%, 71% 44%, 72% 50%, 72% 68%,
    /* Road gap */
    72.5% 68%, 72.5% 82%, 74% 82%, 74% 68%,
    /* Station / bus terminal */
    74.5% 68%, 74.5% 60%, 75% 57%, 75.5% 55%, 78.5% 55%, 79% 57%, 79.5% 60%, 79.5% 68%,
    /* Tall landmark tower */
    80% 68%, 80% 36%, 80.5% 30%, 81% 26%, 81.5% 30%, 82% 36%, 82% 68%,
    /* Low-rise with park */
    82.5% 68%, 82.5% 60%, 84% 60%, 84% 68%, 84.5% 72%, 85% 68%, 85.5% 72%, 86% 68%,
    /* Road gap */
    86.5% 68%, 86.5% 82%, 88% 82%, 88% 68%,
    /* Right-side buildings */
    88.5% 68%, 88.5% 50%, 89.5% 42%, 90.5% 38%, 91.5% 42%, 92.5% 50%, 92.5% 68%,
    /* Small buildings */
    93% 68%, 93% 58%, 94.5% 62%, 96% 55%, 97.5% 55%, 97.5% 68%,
    /* Edge */
    98% 68%, 98% 60%, 99.5% 60%, 99.5% 68%,
    100% 68%, 100% 100%
  );
  background:
    /* === Warm yellow windows (1-2 per building cluster, ~28 total) === */
    radial-gradient(2px 2px at 2.5% 56%, rgba(251,191,36,0.8) 50%, transparent 50%),
    radial-gradient(2px 2px at 4% 58%, rgba(255,220,100,0.6) 50%, transparent 50%),
    radial-gradient(2px 2px at 13.5% 38%, rgba(251,191,36,0.85) 50%, transparent 50%),
    radial-gradient(2px 2px at 14% 46%, rgba(255,220,100,0.7) 50%, transparent 50%),
    radial-gradient(2px 2px at 13.3% 54%, rgba(251,191,36,0.65) 50%, transparent 50%),
    radial-gradient(2px 2px at 14.5% 62%, rgba(255,220,100,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 17.5% 48%, rgba(251,191,36,0.65) 50%, transparent 50%),
    radial-gradient(2px 2px at 19% 52%, rgba(255,220,100,0.55) 50%, transparent 50%),
    radial-gradient(3px 2px at 25.5% 56%, rgba(251,191,36,0.7) 50%, transparent 50%),
    radial-gradient(3px 2px at 27% 60%, rgba(255,220,100,0.55) 50%, transparent 50%),
    radial-gradient(2px 2px at 30.5% 40%, rgba(251,191,36,0.8) 50%, transparent 50%),
    radial-gradient(2px 2px at 31% 48%, rgba(255,220,100,0.6) 50%, transparent 50%),
    radial-gradient(2px 2px at 36.5% 60%, rgba(251,191,36,0.65) 50%, transparent 50%),
    radial-gradient(2px 2px at 39% 60%, rgba(255,220,100,0.55) 50%, transparent 50%),
    radial-gradient(2px 2px at 41.3% 26%, rgba(251,191,36,0.85) 50%, transparent 50%),
    radial-gradient(2px 2px at 41.5% 34%, rgba(255,220,100,0.75) 50%, transparent 50%),
    radial-gradient(2px 2px at 41% 42%, rgba(251,191,36,0.65) 50%, transparent 50%),
    radial-gradient(2px 2px at 42% 52%, rgba(255,220,100,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 45% 50%, rgba(251,191,36,0.6) 50%, transparent 50%),
    radial-gradient(2px 2px at 53.5% 46%, rgba(251,191,36,0.75) 50%, transparent 50%),
    radial-gradient(2px 2px at 54% 54%, rgba(255,220,100,0.55) 50%, transparent 50%),
    radial-gradient(2px 2px at 57.5% 42%, rgba(251,191,36,0.75) 50%, transparent 50%),
    radial-gradient(2px 2px at 58.5% 50%, rgba(255,220,100,0.6) 50%, transparent 50%),
    radial-gradient(3px 2px at 65% 56%, rgba(251,191,36,0.6) 50%, transparent 50%),
    radial-gradient(2px 2px at 70% 42%, rgba(251,191,36,0.7) 50%, transparent 50%),
    radial-gradient(2px 2px at 70.5% 52%, rgba(255,220,100,0.55) 50%, transparent 50%),
    radial-gradient(3px 2px at 77% 58%, rgba(251,191,36,0.65) 50%, transparent 50%),
    radial-gradient(2px 2px at 81% 30%, rgba(251,191,36,0.85) 50%, transparent 50%),
    radial-gradient(2px 2px at 81.2% 42%, rgba(255,220,100,0.65) 50%, transparent 50%),
    radial-gradient(2px 2px at 80.8% 54%, rgba(251,191,36,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 90% 42%, rgba(251,191,36,0.7) 50%, transparent 50%),
    radial-gradient(2px 2px at 91% 50%, rgba(255,220,100,0.55) 50%, transparent 50%),
    radial-gradient(2px 2px at 96% 58%, rgba(251,191,36,0.6) 50%, transparent 50%),
    /* === Cool blue windows (~8) === */
    radial-gradient(2px 2px at 14.2% 50%, rgba(147,197,253,0.55) 50%, transparent 50%),
    radial-gradient(2px 2px at 30% 44%, rgba(147,197,253,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 41.7% 38%, rgba(147,197,253,0.55) 50%, transparent 50%),
    radial-gradient(2px 2px at 54.5% 50%, rgba(147,197,253,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 64% 58%, rgba(147,197,253,0.5) 50%, transparent 50%),
    radial-gradient(2px 2px at 70% 48%, rgba(147,197,253,0.45) 50%, transparent 50%),
    radial-gradient(2px 2px at 81% 48%, rgba(147,197,253,0.55) 50%, transparent 50%),
    radial-gradient(2px 2px at 90.5% 46%, rgba(147,197,253,0.5) 50%, transparent 50%),
    /* === Street lights at roads (~7) === */
    radial-gradient(3px 3px at 6.2% 79%, rgba(255,255,220,0.85) 40%, transparent 60%),
    radial-gradient(3px 3px at 21.2% 79%, rgba(255,255,220,0.85) 40%, transparent 60%),
    radial-gradient(3px 3px at 34.2% 79%, rgba(255,255,220,0.85) 40%, transparent 60%),
    radial-gradient(3px 3px at 51.8% 79%, rgba(255,255,220,0.85) 40%, transparent 60%),
    radial-gradient(3px 3px at 61.2% 79%, rgba(255,255,220,0.85) 40%, transparent 60%),
    radial-gradient(3px 3px at 73.2% 79%, rgba(255,255,220,0.85) 40%, transparent 60%),
    radial-gradient(3px 3px at 87.2% 79%, rgba(255,255,220,0.85) 40%, transparent 60%),
    /* === Rooftop beacons (red, 3) === */
    radial-gradient(3px 3px at 41.4% 19%, rgba(255,60,60,0.85) 50%, transparent 50%),
    radial-gradient(3px 3px at 81% 27%, rgba(255,60,60,0.8) 50%, transparent 50%),
    radial-gradient(3px 3px at 14% 33%, rgba(255,60,60,0.65) 50%, transparent 50%),
    /* === Neon signs (3) === */
    radial-gradient(4px 2px at 36.5% 59%, rgba(255,80,120,0.5) 50%, transparent 50%),
    radial-gradient(4px 2px at 64.5% 55%, rgba(80,200,255,0.45) 50%, transparent 50%),
    radial-gradient(3px 2px at 93.8% 59%, rgba(120,255,120,0.4) 50%, transparent 50%),
    /* Building fill gradient */
    linear-gradient(to top, #0f0f25 0%, #151530 30%, #1a1a3e 60%, rgba(26, 26, 62, 0.7) 100%);
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0.06) 100%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  padding: 16px 22px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  backdrop-filter: blur(12px);
  min-width: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08);
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
