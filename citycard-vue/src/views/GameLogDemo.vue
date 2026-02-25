<template>
  <div class="demo-container">
    <div class="demo-header">
      <h1>游戏日志组件演示</h1>
      <p class="demo-subtitle">三种日志显示方式对比</p>
    </div>

    <div class="demo-controls">
      <button class="demo-btn demo-btn--primary" @click="addRandomLog">
        ➕ 添加随机日志
      </button>
      <button class="demo-btn demo-btn--success" @click="addBatchLogs">
        📦 批量添加 (10条)
      </button>
      <button class="demo-btn demo-btn--warning" @click="nextRound">
        ⏭️ 下一回合
      </button>
      <button class="demo-btn demo-btn--danger" @click="clearAllLogs">
        🗑️ 清空所有日志
      </button>
    </div>

    <div class="demo-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="demo-tab"
        :class="{ 'demo-tab--active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </div>

    <!-- 固定面板演示 -->
    <div v-if="activeTab === 'fixed'" class="demo-content demo-content--fixed">
      <div class="demo-description">
        <h3>📋 GameLogFixed - 固定面板</h3>
        <p><strong>特点</strong>：固定在页面布局中，始终可见，适合玩家模式主界面</p>
        <p><strong>优势</strong>：</p>
        <ul>
          <li>✅ 始终可见，无需点击</li>
          <li>✅ 实时更新，自动滚动</li>
          <li>✅ 占据固定空间，不遮挡内容</li>
          <li>✅ 适合需要频繁查看日志的场景</li>
        </ul>
        <p><strong>使用场景</strong>：玩家模式、实时对战、需要持续关注战斗信息</p>
      </div>

      <div class="demo-layout demo-layout--fixed">
        <div class="demo-game-area">
          <div class="demo-game-placeholder">
            <div class="placeholder-icon">🎮</div>
            <div class="placeholder-text">游戏主界面区域</div>
            <div class="placeholder-hint">左侧显示游戏内容，右侧显示日志</div>
          </div>
        </div>
        <div class="demo-log-area">
          <GameLogFixed />
        </div>
      </div>
    </div>

    <!-- 浮动面板演示 -->
    <div v-if="activeTab === 'panel'" class="demo-content demo-content--panel">
      <div class="demo-description">
        <h3>🎈 GameLogPanel - 浮动面板</h3>
        <p><strong>特点</strong>：浮动在屏幕右下角，可折叠，不占用布局空间</p>
        <p><strong>优势</strong>：</p>
        <ul>
          <li>✅ 可折叠，节省空间</li>
          <li>✅ 浮动显示，不影响布局</li>
          <li>✅ 快速访问，随时展开</li>
          <li>✅ 适合需要偶尔查看日志的场景</li>
        </ul>
        <p><strong>使用场景</strong>：管理员模式、编辑器模式、屏幕空间有限时</p>
      </div>

      <div class="demo-layout demo-layout--panel">
        <div class="demo-game-fullarea">
          <div class="demo-game-placeholder">
            <div class="placeholder-icon">🎮</div>
            <div class="placeholder-text">游戏主界面区域（全屏）</div>
            <div class="placeholder-hint">日志面板浮动在右下角，点击可折叠</div>
          </div>
        </div>
        <GameLogPanel />
      </div>
    </div>

    <!-- 模态弹窗演示 -->
    <div v-if="activeTab === 'modal'" class="demo-content demo-content--modal">
      <div class="demo-description">
        <h3>🪟 GameLog - 模态弹窗</h3>
        <p><strong>特点</strong>：全屏模态框，需要点击按钮打开，详细查看日志</p>
        <p><strong>优势</strong>：</p>
        <ul>
          <li>✅ 全屏显示，信息完整</li>
          <li>✅ 不占用游戏界面空间</li>
          <li>✅ 集中查看，避免干扰</li>
          <li>✅ 适合需要仔细分析日志的场景</li>
        </ul>
        <p><strong>使用场景</strong>：复盘分析、调试模式、需要集中查看历史日志</p>
      </div>

      <div class="demo-layout demo-layout--modal">
        <div class="demo-game-fullarea">
          <div class="demo-game-placeholder">
            <div class="placeholder-icon">🎮</div>
            <div class="placeholder-text">游戏主界面区域（全屏）</div>
            <div class="placeholder-hint">点击下方按钮打开日志模态框</div>
            <button class="open-modal-btn" @click="showModal = true">
              📋 打开游戏日志
            </button>
          </div>
        </div>
      </div>

      <GameLog :show="showModal" @close="showModal = false" />
    </div>

    <!-- 对比表格 -->
    <div class="demo-comparison">
      <h3>📊 三种组件对比</h3>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>特性</th>
            <th>GameLogFixed<br/>固定面板</th>
            <th>GameLogPanel<br/>浮动面板</th>
            <th>GameLog<br/>模态弹窗</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>显示方式</td>
            <td>✅ 固定布局</td>
            <td>✅ 浮动定位</td>
            <td>✅ 模态遮罩</td>
          </tr>
          <tr>
            <td>占用空间</td>
            <td>⚠️ 固定占用</td>
            <td>✅ 最小化</td>
            <td>✅ 不占用</td>
          </tr>
          <tr>
            <td>实时可见</td>
            <td>✅ 始终可见</td>
            <td>✅ 可见（可折叠）</td>
            <td>❌ 需要打开</td>
          </tr>
          <tr>
            <td>信息密度</td>
            <td>✅ 高</td>
            <td>⚠️ 中</td>
            <td>✅ 最高</td>
          </tr>
          <tr>
            <td>适用场景</td>
            <td>玩家模式、实时对战</td>
            <td>管理员模式、编辑器</td>
            <td>复盘分析、调试</td>
          </tr>
          <tr>
            <td>移动端适配</td>
            <td>✅ 响应式</td>
            <td>✅ 响应式</td>
            <td>✅ 完全适配</td>
          </tr>
          <tr>
            <td>过滤功能</td>
            <td>✅ 支持</td>
            <td>✅ 支持</td>
            <td>✅ 支持</td>
          </tr>
          <tr>
            <td>复制功能</td>
            <td>✅ 支持</td>
            <td>✅ 支持</td>
            <td>✅ 支持</td>
          </tr>
          <tr>
            <td>自动滚动</td>
            <td>✅ 支持</td>
            <td>✅ 支持</td>
            <td>✅ 支持</td>
          </tr>
          <tr>
            <td>推荐指数</td>
            <td>⭐⭐⭐⭐⭐</td>
            <td>⭐⭐⭐⭐</td>
            <td>⭐⭐⭐</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 使用建议 -->
    <div class="demo-recommendations">
      <h3>💡 使用建议</h3>
      <div class="recommendations-grid">
        <div class="recommendation-card">
          <div class="card-icon">🎮</div>
          <h4>玩家模式</h4>
          <p>推荐使用 <strong>GameLogFixed</strong></p>
          <p class="card-reason">需要实时查看战斗信息，固定面板最合适</p>
        </div>
        <div class="recommendation-card">
          <div class="card-icon">⚙️</div>
          <h4>管理员模式</h4>
          <p>推荐使用 <strong>GameLogPanel</strong></p>
          <p class="card-reason">需要编辑器空间，浮动面板可折叠节省空间</p>
        </div>
        <div class="recommendation-card">
          <div class="card-icon">📱</div>
          <h4>移动端</h4>
          <p>推荐使用 <strong>GameLog</strong></p>
          <p class="card-reason">屏幕小，模态框查看更清晰</p>
        </div>
        <div class="recommendation-card">
          <div class="card-icon">🔍</div>
          <h4>调试模式</h4>
          <p>推荐使用 <strong>GameLog</strong></p>
          <p class="card-reason">需要详细分析日志，模态框显示最完整</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useGameStore } from '../stores/gameStore'
import GameLogFixed from '../components/Game/GameLogFixed.vue'
import GameLogPanel from '../components/Game/GameLogPanel.vue'
import GameLog from '../components/Game/GameLog.vue'

const gameStore = useGameStore()
const activeTab = ref('fixed')
const showModal = ref(false)

const tabs = [
  { id: 'fixed', name: '固定面板', icon: '📋' },
  { id: 'panel', name: '浮动面板', icon: '🎈' },
  { id: 'modal', name: '模态弹窗', icon: '🪟' }
]

const logTemplates = [
  { message: '第{round}回合开始', type: 'system' },
  { message: '玩家{player}使用技能"快速治疗"', type: 'skill' },
  { message: '玩家{player}的北京市攻击玩家{opponent}的上海市，造成5000点伤害', type: 'battle' },
  { message: '玩家{player}的广州市HP增加3000', type: 'battle' },
  { message: '警告：玩家{player}金币不足', type: 'warning' },
  { message: '错误：技能使用失败', type: 'error' },
  { message: '玩家{player}获得3金币', type: 'system' },
  { message: '玩家{player}使用技能"钢铁城市"', type: 'skill' },
  { message: '玩家{player}的深圳市阵亡', type: 'battle' },
  { message: '回合结束，准备下一回合', type: 'system' }
]

function addRandomLog() {
  const template = logTemplates[Math.floor(Math.random() * logTemplates.length)]
  const message = template.message
    .replace('{round}', gameStore.currentRound)
    .replace('{player}', `玩家${Math.floor(Math.random() * 3) + 1}`)
    .replace('{opponent}', `玩家${Math.floor(Math.random() * 3) + 1}`)

  gameStore.addLog(message, template.type)
}

function addBatchLogs() {
  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      addRandomLog()
    }, i * 100)
  }
}

function nextRound() {
  gameStore.nextRound()
}

function clearAllLogs() {
  if (confirm('确定要清空所有日志吗？')) {
    gameStore.clearLogs()
  }
}
</script>

<style scoped>
.demo-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.demo-header {
  text-align: center;
  color: white;
  margin-bottom: 30px;
}

.demo-header h1 {
  font-size: 36px;
  margin: 0 0 10px 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.demo-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin: 0;
}

.demo-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.demo-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.demo-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.demo-btn--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.demo-btn--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.demo-btn--warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.demo-btn--danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.demo-tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.demo-tab {
  padding: 12px 24px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.demo-tab:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

.demo-tab--active {
  background: white;
  color: #667eea;
  border-color: white;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3);
}

.demo-content {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  margin-bottom: 30px;
}

.demo-description {
  margin-bottom: 30px;
}

.demo-description h3 {
  color: #667eea;
  font-size: 24px;
  margin: 0 0 16px 0;
}

.demo-description p {
  color: #4b5563;
  line-height: 1.6;
  margin: 8px 0;
}

.demo-description ul {
  color: #4b5563;
  line-height: 1.8;
}

.demo-layout--fixed {
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 20px;
  height: 600px;
}

.demo-layout--panel,
.demo-layout--modal {
  position: relative;
  height: 600px;
}

.demo-game-area,
.demo-game-fullarea {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.demo-log-area {
  height: 100%;
}

.demo-game-placeholder {
  text-align: center;
  color: #6b7280;
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.placeholder-text {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 12px;
}

.placeholder-hint {
  font-size: 14px;
  color: #9ca3af;
}

.open-modal-btn {
  margin-top: 30px;
  padding: 16px 32px;
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.open-modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.demo-comparison {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  margin-bottom: 30px;
}

.demo-comparison h3 {
  color: #667eea;
  font-size: 24px;
  margin: 0 0 20px 0;
  text-align: center;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
}

.comparison-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  text-align: left;
  font-weight: 600;
  border: none;
}

.comparison-table th:first-child {
  border-radius: 12px 0 0 0;
}

.comparison-table th:last-child {
  border-radius: 0 12px 0 0;
}

.comparison-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
}

.comparison-table tr:last-child td {
  border-bottom: none;
}

.comparison-table tr:nth-child(even) {
  background: #f9fafb;
}

.demo-recommendations {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.demo-recommendations h3 {
  color: #667eea;
  font-size: 24px;
  margin: 0 0 24px 0;
  text-align: center;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.recommendation-card {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  transition: all 0.3s ease;
}

.recommendation-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.recommendation-card h4 {
  color: #1f2937;
  font-size: 18px;
  margin: 0 0 12px 0;
}

.recommendation-card p {
  color: #6b7280;
  line-height: 1.6;
  margin: 8px 0;
}

.recommendation-card strong {
  color: #667eea;
  font-weight: 700;
}

.card-reason {
  font-size: 13px;
  color: #9ca3af;
  margin-top: 12px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .demo-layout--fixed {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 300px;
    height: auto;
  }

  .demo-game-area,
  .demo-game-fullarea {
    min-height: 300px;
  }
}

@media (max-width: 768px) {
  .demo-container {
    padding: 10px;
  }

  .demo-header h1 {
    font-size: 24px;
  }

  .demo-subtitle {
    font-size: 14px;
  }

  .demo-content {
    padding: 20px;
  }

  .recommendations-grid {
    grid-template-columns: 1fr;
  }
}
</style>
