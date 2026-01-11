# 技能系统统一架构设计

## 问题分析

原版HTML文件中，许多技能分为两个版本：
- **主持人模式版本**：同步执行，直接生效
- **玩家模式版本**：异步执行，涉及Firebase、待处理请求、双方确认等

这导致同一技能的逻辑写了两次，代码重复率高达50%。

## 解决方案：三层架构

### 1. 核心效果层（Core Effects Layer）

**职责**：纯粹的游戏逻辑效果实现
**特点**：
- 不关心调用模式
- 只处理游戏状态变更
- 返回标准化结果

**示例**：
```javascript
/**
 * 核心效果：快速治疗
 * @param {Object} player - 玩家对象
 * @param {Object} city - 城市对象
 * @returns {Object} { success, message, changes }
 */
function coreEffect_QuickHeal(player, city) {
  if (!city || city.isAlive === false) {
    return { success: false, message: '城市已阵亡' }
  }

  const healed = city.hp - (city.currentHp || city.hp)
  city.currentHp = city.hp

  return {
    success: true,
    message: `${city.name}恢复至满血`,
    changes: {
      player: player.name,
      city: city.name,
      healed: healed
    }
  }
}
```

### 2. 模式适配层（Mode Adapter Layer）

#### 2.1 主持人模式适配器（Host Mode Adapter）

**职责**：
- 参数验证和预处理
- 金币扣除
- 调用核心效果
- UI更新（可选）

**示例**：
```javascript
function hostMode_QuickHeal(params) {
  const { player, cityIdx, cost } = params

  // 1. 金币检查
  if (player.gold < cost) {
    return { success: false, message: '金币不足' }
  }

  // 2. 获取城市对象
  const city = player.cities[cityIdx]

  // 3. 扣除金币
  player.gold -= cost

  // 4. 调用核心效果
  const result = coreEffect_QuickHeal(player, city)

  // 5. 记录日志
  if (result.success) {
    gameStore.addLog(`${player.name}对${city.name}使用快速治疗`)
  }

  return result
}
```

#### 2.2 玩家模式适配器（Player Mode Adapter）

**职责**：
- 异步流程管理
- 待处理请求创建
- 双方确认处理
- Firebase数据同步
- 调用核心效果

**示例**：
```javascript
async function playerMode_QuickHeal(params) {
  const { roomId, playerName, cityIdx, cost } = params

  // 1. 获取房间数据
  const roomData = await getRoomData(roomId)
  const player = roomData.players.find(p => p.name === playerName)

  // 2. 金币检查
  if (player.gold < cost) {
    return { success: false, message: '金币不足' }
  }

  // 3. 创建快照（用于无懈可击）
  createGameStateSnapshot(roomData)

  // 4. 扣除金币
  player.gold -= cost

  // 5. 调用核心效果
  const city = player.cities[cityIdx]
  const result = coreEffect_QuickHeal(player, city)

  // 6. 保存到Firebase
  if (result.success) {
    await saveRoomData(roomId, roomData)
    addPrivateLog(roomData, playerName, `你对${city.name}使用了快速治疗`)
  }

  return result
}
```

### 3. 统一接口层（Unified Interface Layer）

**职责**：根据模式自动分发到对应适配器

```javascript
/**
 * 统一技能执行接口
 * @param {string} skillName - 技能名称
 * @param {Object} params - 参数
 * @param {string} params.mode - 'host' | 'player'
 * @returns {Object|Promise<Object>} 执行结果
 */
function executeSkill(skillName, params) {
  const { mode = 'host', ...restParams } = params

  // 根据模式选择适配器
  if (mode === 'host') {
    return hostModeExecute(skillName, restParams)
  } else if (mode === 'player') {
    return playerModeExecute(skillName, restParams)
  }

  throw new Error(`Unknown mode: ${mode}`)
}

function hostModeExecute(skillName, params) {
  switch (skillName) {
    case '快速治疗':
      return hostMode_QuickHeal(params)
    case '设置屏障':
      return hostMode_SetBarrier(params)
    // ... 其他技能
  }
}

async function playerModeExecute(skillName, params) {
  switch (skillName) {
    case '快速治疗':
      return await playerMode_QuickHeal(params)
    case '设置屏障':
      return await playerMode_SetBarrier(params)
    // ... 其他技能
  }
}
```

## 技能分类

### A类：简单技能（无需双方确认）

**特点**：单方执行，立即生效
**例子**：快速治疗、设置屏障、潜能激发、士气大振

**玩家模式特殊处理**：
- 创建快照（用于无懈可击）
- 异步保存到Firebase

### B类：交互技能（需要双方确认）

**特点**：涉及对手选择、双方确认等
**例子**：时来运转、先声夺人、人质交换

**玩家模式特殊处理**：
1. **第一阶段**：发起者选择并创建 `pendingRequest`
2. **第二阶段**：目标方确认/选择
3. **第三阶段**：调用核心效果并完成

**架构**：
```javascript
// 核心效果（模式无关）
function coreEffect_FortuneSwap(player1, player2, cities1, cities2) {
  // 交换城市逻辑
  for (let i = 0; i < 3; i++) {
    const temp = player1.cities[cities1[i]]
    player1.cities[cities1[i]] = player2.cities[cities2[i]]
    player2.cities[cities2[i]] = temp
  }
  return { success: true, message: '交换完成' }
}

// 主持人模式：一次性完成
function hostMode_FortuneSwap({ player1, player2, cost }) {
  // 李代桃僵选择（如果启用）
  const cities1 = selectCities(player1, 3, hasLdtj1)
  const cities2 = selectCities(player2, 3, hasLdtj2)

  // 扣费
  player1.gold -= cost

  // 执行
  return coreEffect_FortuneSwap(player1, player2, cities1, cities2)
}

// 玩家模式：分阶段
async function playerMode_FortuneSwap_Step1({ roomId, initiator, target }) {
  // 创建待处理请求
  roomData.gameState.pendingFortuneSwap = {
    initiator,
    target,
    step: 'initiator_select',
    timestamp: Date.now()
  }
  await saveRoomData(roomId, roomData)
}

async function playerMode_FortuneSwap_Step2({ roomId, cities1 }) {
  const pending = roomData.gameState.pendingFortuneSwap
  pending.cities1 = cities1
  pending.step = 'target_select'
  await saveRoomData(roomId, roomData)
}

async function playerMode_FortuneSwap_Step3({ roomId, cities2 }) {
  const pending = roomData.gameState.pendingFortuneSwap
  const player1 = roomData.players.find(p => p.name === pending.initiator)
  const player2 = roomData.players.find(p => p.name === pending.target)

  // 调用核心效果
  const result = coreEffect_FortuneSwap(player1, player2, pending.cities1, cities2)

  // 清理
  delete roomData.gameState.pendingFortuneSwap
  await saveRoomData(roomId, roomData)

  return result
}
```

### C类：特殊技能（需要额外系统）

**特点**：依赖特殊机制
**例子**：博学多才（题库）、血量存储（存储库）、海市蜃楼（投影）

**处理方式**：
- 核心效果层实现主要逻辑
- 依赖注入特殊系统（如题库API）

## 迁移策略

### 阶段1：提取核心效果（当前阶段）

将现有45个技能的核心逻辑提取为 `coreEffect_*` 函数

### 阶段2：实现主持人模式适配器

创建 `hostMode_*` 适配器函数

### 阶段3：实现玩家模式适配器

创建 `playerMode_*` 适配器函数（简化版先用核心效果）

### 阶段4：完善交互流程

为B类技能实现完整的多阶段确认流程

## 优势

1. **代码复用率 100%**：核心逻辑只写一次
2. **易于测试**：核心效果是纯函数，易于单元测试
3. **易于维护**：修改技能逻辑只需改一处
4. **扩展性强**：新增模式（如AI模式）只需添加新适配器
5. **清晰分层**：职责明确，降低复杂度

## 文件结构

```
src/composables/
├── skills/
│   ├── core/                    # 核心效果层
│   │   ├── battleSkills.js      # 战斗技能核心效果
│   │   ├── supportSkills.js     # 支援技能核心效果
│   │   └── specialSkills.js     # 特殊技能核心效果
│   ├── adapters/                # 适配器层
│   │   ├── hostMode.js          # 主持人模式适配器
│   │   └── playerMode.js        # 玩家模式适配器
│   └── interface.js             # 统一接口
└── useSkillEffects.js           # 当前实现（渐进迁移）
```

## 下一步

1. 先完成当前45个技能的核心逻辑检查和修正
2. 创建核心效果提取工具
3. 逐步迁移到新架构
4. 实现剩余115+技能时直接使用新架构

---

**文档版本**: v1.0
**创建时间**: 2025-12-28
**状态**: 设计阶段
