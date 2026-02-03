# 技能失败提示功能 - 功能说明文档

**添加时间**: 2026-01-20
**文件**: `src/components/PlayerMode/PlayerModeOnline.vue`

---

## 📋 功能概述

在线对战模式中，当玩家使用金币技能失败时，会自动弹出一个美观的提示弹窗，清晰地显示失败原因，帮助玩家理解为什么技能无法使用。

### 核心改进
- ✅ 自动捕获技能执行失败
- ✅ 显示失败原因弹窗
- ✅ 记录到游戏日志
- ✅ 精美的UI设计和动画

---

## 🎨 功能特性

### 1. 失败弹窗显示
当技能使用失败时，会弹出一个带有以下元素的模态框：
- **技能名称**: 显示失败的技能名称（金色高亮）
- **失败原因**: 显示详细的失败原因（红色提示框）
- **确定按钮**: 点击关闭弹窗

### 2. 视觉效果
- **红色主题**: 使用红色渐变背景，醒目提醒
- **震动动画**: 错误图标(❌)带有震动效果
- **滑入动画**: 弹窗从下方滑入，平滑过渡
- **毛玻璃效果**: 背景模糊，聚焦弹窗内容

### 3. 自动日志记录
失败信息会自动添加到游戏日志：
```
❌ [技能名称] 执行失败: [失败原因]
```

---

## 🔧 技术实现

### 新增响应式变量

```javascript
const showSkillFailureModal = ref(false)  // 控制失败弹窗显示
const skillFailureInfo = ref(null)        // 失败信息对象
```

### 新增处理函数

#### 1. `handleSkillFailed(failureData)`
处理技能执行失败事件：
- 接收SkillSelector组件emit的失败信息
- 设置失败信息到`skillFailureInfo`
- 显示失败弹窗
- 添加失败日志

**参数**:
```javascript
failureData = {
  skill: '技能名称',
  result: {
    message: '失败原因'
  },
  error: '错误信息'  // 可选
}
```

#### 2. `closeSkillFailureModal()`
关闭失败弹窗：
- 隐藏弹窗
- 清空失败信息

### 事件监听

在SkillSelector组件上添加了`@skill-failed`事件监听：
```vue
<SkillSelector
  v-if="showSkillSelector"
  :current-player="currentPlayer"
  @close="showSkillSelector = false"
  @skill-used="handleSkillSelected"
  @skill-failed="handleSkillFailed"
/>
```

---

## 🎭 UI组件结构

```vue
<div class="skill-failure-modal">
  <div class="skill-failure-content">
    <!-- 头部 -->
    <div class="skill-failure-header">
      <span class="skill-failure-icon">❌</span>
      <h3 class="skill-failure-title">技能使用失败</h3>
    </div>

    <!-- 主体 -->
    <div class="skill-failure-body">
      <div class="skill-failure-skill">
        <span class="label">技能名称：</span>
        <span class="value">{{ skillFailureInfo?.skillName }}</span>
      </div>
      <div class="skill-failure-reason">
        <span class="label">失败原因：</span>
        <span class="value">{{ skillFailureInfo?.message }}</span>
      </div>
    </div>

    <!-- 底部 -->
    <div class="skill-failure-footer">
      <button class="skill-failure-btn" @click="closeSkillFailureModal">
        确定
      </button>
    </div>
  </div>
</div>
```

---

## 💅 CSS样式特点

### 布局样式
- **固定定位**: `position: fixed` 覆盖全屏
- **居中对齐**: flexbox居中
- **z-index**: 10000确保在最顶层
- **响应式**: 最大宽度500px，移动端90%宽度

### 颜色方案
- **背景**: 深色渐变 (#1e293b → #334155)
- **头部**: 红色渐变 (#ef4444 → #dc2626)
- **技能名称**: 金色 (#fbbf24)
- **失败原因**: 淡红色 (#fca5a5)
- **按钮**: 蓝色渐变 (#3b82f6 → #2563eb)

### 动画效果
1. **fadeIn**: 背景淡入 (0.2s)
2. **slideUp**: 弹窗滑入 (0.3s)
3. **shake**: 错误图标震动 (0.5s)
4. **hover**: 按钮悬停放大

---

## 🧪 测试场景

### 测试场景1: 金币不足
1. 当前玩家金币: 0
2. 尝试使用"快速治疗"(成本1金币)
3. **预期结果**: 弹出失败提示"金币不足"

### 测试场景2: 没有目标
1. 使用需要目标的技能(如"无知无畏")
2. 但没有选择目标玩家
3. **预期结果**: 弹出失败提示"缺少目标玩家"

### 测试场景3: 技能冷却中
1. 使用"定海神针"
2. 冷却期间再次使用
3. **预期结果**: 弹出失败提示"技能冷却中，剩余X回合"

### 测试场景4: 条件不满足
1. 使用"快速治疗"
2. 但所有城市都是满血状态
3. **预期结果**: 弹出失败提示"没有需要治疗的城市"

---

## 📝 常见失败原因列表

根据技能系统，以下是常见的失败原因：

### 资源类
- "金币不足，需要X金币"
- "金币贷款冷却中，剩余X回合"

### 目标类
- "缺少目标玩家"
- "缺少目标城市"
- "目标城市已阵亡"
- "没有可用的出战城市"

### 条件类
- "技能冷却中，剩余X回合"
- "已达到技能使用次数上限"
- "所有城市都是满血状态"
- "没有受伤的城市"
- "没有符合条件的城市"

### 状态类
- "当前玩家被寸步难行限制"
- "技能被事半功倍禁用"
- "目标被坚不可摧护盾保护"

---

## 🎯 用户体验改进

### 改进前
- ❌ 技能失败时没有任何提示
- ❌ 玩家不知道为什么技能无法使用
- ❌ 只能从游戏日志中查找原因

### 改进后
- ✅ 失败时立即弹出提示
- ✅ 清晰显示失败原因
- ✅ 醒目的视觉反馈
- ✅ 同时记录到游戏日志

---

## 🔄 工作流程

```
用户点击技能按钮
      ↓
SkillSelector执行技能
      ↓
技能执行失败 → emit('skill-failed', failureData)
      ↓
PlayerModeOnline接收事件 → handleSkillFailed()
      ↓
设置失败信息 → skillFailureInfo.value = {...}
      ↓
显示弹窗 → showSkillFailureModal.value = true
      ↓
添加日志 → gameStore.addLog('❌ ...')
      ↓
用户点击"确定" → closeSkillFailureModal()
      ↓
隐藏弹窗 → showSkillFailureModal.value = false
```

---

## 📊 影响范围

### 修改的文件
- `src/components/PlayerMode/PlayerModeOnline.vue`

### 修改内容
1. **新增变量** (2个):
   - `showSkillFailureModal`
   - `skillFailureInfo`

2. **新增函数** (2个):
   - `handleSkillFailed()`
   - `closeSkillFailureModal()`

3. **新增UI** (1个):
   - 技能失败弹窗模态框

4. **新增CSS** (~150行):
   - 弹窗样式
   - 动画效果

5. **事件监听** (1个):
   - `@skill-failed` on SkillSelector

### 代码行数
- 新增JavaScript: ~25行
- 新增HTML: ~25行
- 新增CSS: ~150行
- **总计**: ~200行

---

## 🐛 已知问题

目前没有已知问题。

---

## 🚀 未来改进

### 可选改进
1. **声音效果**: 添加失败音效
2. **多语言支持**: 支持英文等其他语言
3. **自动关闭**: 3秒后自动关闭弹窗（可选）
4. **失败统计**: 记录失败次数和原因分析
5. **建议提示**: 根据失败原因提供操作建议

---

## ✅ 验证清单

- [x] 新增响应式变量
- [x] 新增处理函数
- [x] 添加事件监听
- [x] 创建弹窗UI
- [x] 添加CSS样式
- [x] 添加动画效果
- [x] 添加日志记录
- [x] 创建功能文档

---

**功能完成时间**: 2026-01-20
**功能状态**: ✅ 已完成
**测试状态**: 待测试

---

## 🎉 总结

技能失败提示功能已成功添加到在线对战模式中。玩家现在可以：
1. 立即看到技能失败的提示
2. 了解失败的具体原因
3. 通过醒目的UI获得更好的游戏体验

这个功能大大提升了游戏的可用性和用户体验，让玩家能够快速理解游戏状态，做出更好的决策。
