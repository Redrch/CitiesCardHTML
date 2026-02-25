# 游戏日志组件使用说明

## 概述

Vue版本现在提供了三种日志显示方式，参考了`citycard_web.html`玩家模式的设计，并进行了UI美化：

### 1. **GameLogFixed** - 固定面板（推荐用于玩家模式）
- **特点**: 固定在页面布局中，始终可见
- **适用场景**: 玩家模式主界面，需要实时查看战斗日志
- **路径**: `src/components/Game/GameLogFixed.vue`

### 2. **GameLogPanel** - 浮动面板
- **特点**: 浮动在屏幕右下角，可折叠
- **适用场景**: 不想占用太多屏幕空间时
- **路径**: `src/components/Game/GameLogPanel.vue`

### 3. **GameLog** - 模态弹窗
- **特点**: 全屏模态框，详细查看
- **适用场景**: 需要集中查看日志时
- **路径**: `src/components/Game/GameLog.vue`

---

## GameLogFixed 使用方法

### 基本用法

```vue
<template>
  <div class="game-layout">
    <!-- 游戏主区域 -->
    <div class="game-area">
      <!-- 你的游戏组件 -->
    </div>

    <!-- 日志面板 -->
    <div class="log-area">
      <GameLogFixed />
    </div>
  </div>
</template>

<script setup>
import GameLogFixed from '@/components/Game/GameLogFixed.vue'
</script>

<style scoped>
.game-layout {
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 20px;
  height: 100vh;
  padding: 20px;
}

.log-area {
  height: 100%;
}
</style>
```

### 完整示例

参考 `src/views/GameWithLogView.vue` 文件，这是一个完整的游戏界面+日志面板的布局示例。

---

## 功能特性

### 1. **实时日志显示**
- 自动捕获 `gameStore` 中的所有日志
- 新日志自动滚动到底部
- 支持手动滚动查看历史日志

### 2. **智能分类**
日志自动分为6个类型：
- 📝 **全部**: 显示所有日志
- ⚔️ **战斗**: 战斗相关（攻击、伤害、HP变化）
- ✨ **技能**: 技能使用相关
- ℹ️ **系统**: 系统消息（回合开始、游戏状态）
- ⚠️ **警告**: 警告信息
- ❌ **错误**: 错误信息

### 3. **过滤功能**
点击过滤器按钮即可筛选特定类型的日志，每个按钮显示该类型的日志数量。

### 4. **高亮显示**
日志中的关键信息自动高亮：
- 🔵 **玩家名**: 蓝色高亮
- 🟡 **数值**: 黄色加粗
- 🟣 **技能名**: 紫色高亮
- 🟢 **城市名**: 绿色高亮

### 5. **复制功能**
点击"📋 复制"按钮可将当前筛选的日志复制到剪贴板，格式如下：
```
[14:23:45] 第1回合开始
[14:23:50] 玩家1使用技能"快速治疗"
[14:24:01] 玩家1的北京市攻击玩家2的上海市，造成5000点伤害
```

### 6. **清空日志**
点击"🗑️ 清空"按钮可清空所有日志（需要确认）。

### 7. **自动滚动**
勾选底部的"自动滚动"选项，新日志产生时自动滚动到底部。

### 8. **新日志提示**
当有新日志产生且用户未在底部时，显示"🔔 有新日志"浮动提示，点击快速跳转到底部。

---

## 布局方案

### 方案1: 固定右侧（桌面端推荐）
```css
.game-layout {
  display: grid;
  grid-template-columns: 1fr 500px;  /* 游戏区 500px日志区 */
  gap: 20px;
  height: 100vh;
}
```

### 方案2: 固定底部（移动端推荐）
```css
.game-layout {
  display: grid;
  grid-template-rows: 1fr 300px;  /* 游戏区 300px日志区 */
  gap: 20px;
  height: 100vh;
}
```

### 方案3: 响应式布局（自适应）
```css
.game-layout {
  display: grid;
  gap: 20px;
  height: 100vh;
}

/* 桌面端: 左右布局 */
@media (min-width: 1024px) {
  .game-layout {
    grid-template-columns: 1fr 500px;
  }
}

/* 移动端: 上下布局 */
@media (max-width: 1023px) {
  .game-layout {
    grid-template-rows: 1fr 300px;
  }
}
```

---

## 样式定制

### 修改日志面板宽度
```vue
<div class="log-area" style="width: 600px;">
  <GameLogFixed />
</div>
```

### 修改日志面板高度
```vue
<div class="log-area" style="height: 80vh;">
  <GameLogFixed />
</div>
```

### 自定义主题色
修改 `GameLogFixed.vue` 中的CSS变量：

```css
.game-log-fixed {
  /* 修改背景渐变 */
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);

  /* 修改边框颜色 */
  border: 1px solid rgba(your-rgb, 0.2);
}
```

---

## 与 citycard_web.html 的对比

| 特性 | citycard_web.html | Vue版 GameLogFixed |
|------|-------------------|-------------------|
| 布局方式 | 固定面板 | 固定面板 |
| 日志显示 | 单色文本 | 彩色分类 + 图标 |
| 过滤功能 | ❌ 无 | ✅ 6种类型过滤 |
| 高亮显示 | ❌ 无 | ✅ 关键词自动高亮 |
| 自动滚动 | ✅ 有 | ✅ 可开关 |
| 复制日志 | ✅ 有 | ✅ 有（支持过滤） |
| 时间戳 | ❌ 无 | ✅ 精确到秒 |
| 回合标记 | ❌ 无 | ✅ 每条日志显示回合数 |
| 新日志提示 | ❌ 无 | ✅ 浮动提示 |
| 响应式设计 | ⚠️ 一般 | ✅ 完全响应式 |
| UI美观度 | ⚠️ 简单 | ✅ 现代渐变设计 |

---

## 在现有项目中集成

### 步骤1: 导入组件
```vue
<script setup>
import GameLogFixed from '@/components/Game/GameLogFixed.vue'
</script>
```

### 步骤2: 添加到模板
```vue
<template>
  <div class="your-game-layout">
    <!-- 你的游戏内容 -->
    <YourGameComponent />

    <!-- 添加日志面板 -->
    <GameLogFixed />
  </div>
</template>
```

### 步骤3: 调整布局
根据你的需求选择上述布局方案之一。

---

## 常见问题

### Q: 日志不显示？
A: 确保 `gameStore.logs` 中有数据，检查是否正确调用了 `gameStore.addLog(message, type)`

### Q: 如何添加自定义日志类型？
A: 修改 `detectLogType()` 函数，添加你的检测逻辑。

### Q: 如何修改日志格式？
A: 修改 `highlightMessage()` 函数中的正则表达式。

### Q: 能否同时使用多个日志组件？
A: 可以！三种组件可以同时使用，它们都读取同一个 `gameStore.logs`。

---

## 开发建议

1. **玩家模式**: 使用 `GameLogFixed`，固定在右侧
2. **管理员模式**: 使用 `GameLog` 模态框，按需查看
3. **移动端**: 使用 `GameLogPanel` 浮动面板，节省空间

---

## 更新日志

### v1.0.0 (2025-01-05)
- ✨ 新增 GameLogFixed 组件
- ✨ 实现智能日志分类
- ✨ 添加关键词高亮功能
- ✨ 支持日志过滤和复制
- ✨ 响应式布局支持
- 🎨 现代化UI设计

---

## 技术支持

如有问题或建议，请联系开发团队或提交Issue。
