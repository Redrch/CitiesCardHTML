# 统一技能架构设计

**目标**: 技能逻辑只写一次，同时支持玩家模式和主持人模式

---

## 📐 架构设计

### 三层架构

```
┌─────────────────────────────────────────────────────────────┐
│                    统一接口层 (Interface Layer)                 │
│                     useSkillEffects.js                          │
│                  ┌──────────────┐                              │
│                  │ executeSkill │                              │
│                  └──────┬───────┘                              │
└─────────────────────────┼─────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
┌─────────▼──────────┐          ┌────────▼─────────┐
│  主持人模式适配器    │          │   玩家模式适配器   │
│  (Host Adapter)    │          │ (Player Adapter) │
│                    │          │                  │
│ • render(UI控件)   │          │ • confirm(确认)  │
│ • apply(获取参数)  │          │ • execute(执行)  │
└─────────┬──────────┘          └────────┬─────────┘
          │                               │
          └───────────────┬───────────────┘
                          │
┌─────────────────────────▼─────────────────────────────────────┐
│                    核心逻辑层 (Core Layer)                      │
│              skillCore/battleSkills.js                         │
│              skillCore/nonBattleSkills.js                      │
│                                                                │
│  • 纯函数，无UI依赖                                            │
│  • 接收参数，返回结果                                          │
│  • 模式无关的游戏逻辑                                          │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔧 核心逻辑层 (Core Layer)

### 设计原则
1. **纯函数** - 无副作用，易于测试
2. **参数化** - 所有依赖通过参数传入
3. **模式无关** - 不包含任何UI或模式特定逻辑

### 示例：城市保护技能

```javascript
// src/composables/skillCore/nonBattleSkills.js

/**
 * 城市保护 - 核心逻辑
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者
 * @param {number} params.cityIdx - 城市索引
 * @param {Object} params.gameStore - 游戏状态存储
 * @param {string} params.gameMode - 游戏模式 ('2P', '3P', '2v2')
 * @returns {Object} { success: boolean, message: string }
 */
export function executeCityProtectionCore(params) {
  const { caster, cityIdx, gameStore, gameMode } = params

  // 前置检查
  const is2pOr2v2 = gameMode === '2P' || gameMode === '2v2'
  const centerIdx = is2pOr2v2 ? caster.centerIndex : -1

  if (is2pOr2v2 && cityIdx === centerIdx) {
    return {
      success: false,
      message: '二人/2v2模式下不能对中心城市进行保护'
    }
  }

  const city = caster.cities[cityIdx]
  if (!city) {
    return { success: false, message: '城市不存在' }
  }

  if (caster.gold < 3) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要3）`
    }
  }

  // 执行技能效果
  caster.gold -= 3

  if (!gameStore.protections[caster.name]) {
    gameStore.protections[caster.name] = {}
  }
  gameStore.protections[caster.name][cityIdx] = 10

  gameStore.addLog(
    `(城市保护) ${caster.name} 对 ${city.name} 启用保护（10轮）`
  )

  return {
    success: true,
    message: `${city.name} 已获得保护（10轮）`
  }
}
```

---

## 🎭 适配器层 (Adapter Layer)

### 1. 主持人模式适配器

```javascript
// src/adapters/hostModeAdapter.js

export class HostModeSkillAdapter {
  /**
   * 渲染技能UI控件
   */
  renderCityProtection(playerIdx, holderElement, gameStore) {
    const player = gameStore.players[playerIdx]
    const mode = gameStore.gameMode
    const is2pOr2v2 = mode === '2P' || mode === '2v2'
    const centerIdx = is2pOr2v2 ? player.centerIndex : -1

    // 生成城市选项
    const opts = player.cities.map((c, i) => {
      const disabled = (is2pOr2v2 && i === centerIdx) ? 'disabled' : ''
      const note = (is2pOr2v2 && i === centerIdx) ? '（中心，不能保护）' : ''
      return `<option value="${i}" ${disabled}>${i+1}. ${c.name}${note}</option>`
    }).join('')

    // 渲染HTML
    holderElement.innerHTML = `
      <div class="row" style="gap:6px;">
        <div>
          <label>选择城市</label>
          <select data-bind="city-select" data-player="${playerIdx}">
            ${opts}
          </select>
        </div>
        <div style="align-self:end;">
          <button class="btn" data-bind="apply-skill" data-player="${playerIdx}">
            施放
          </button>
        </div>
      </div>
    `
  }

  /**
   * 从UI获取参数并执行技能
   */
  applyCityProtection(playerIdx, gameStore) {
    const select = document.querySelector(
      `[data-bind="city-select"][data-player="${playerIdx}"]`
    )

    if (!select) {
      return { success: false, message: '未找到UI控件' }
    }

    const cityIdx = parseInt(select.value)
    if (isNaN(cityIdx)) {
      return { success: false, message: '无效的城市索引' }
    }

    // 调用核心逻辑
    return executeCityProtectionCore({
      caster: gameStore.players[playerIdx],
      cityIdx,
      gameStore,
      gameMode: gameStore.gameMode
    })
  }
}
```

### 2. 玩家模式适配器

```javascript
// src/adapters/playerModeAdapter.js

export class PlayerModeSkillAdapter {
  /**
   * 玩家模式下的城市保护
   * 需要玩家确认选择
   */
  async executeCityProtection(params) {
    const { caster, gameStore } = params

    // 1. 获取可选城市列表
    const availableCities = this.getAvailableCitiesForProtection(
      caster,
      gameStore
    )

    if (availableCities.length === 0) {
      return {
        success: false,
        message: '没有可保护的城市'
      }
    }

    // 2. 请求玩家选择（通过Firebase或本地UI）
    const selectedCityIdx = await this.requestPlayerSelection({
      playerId: caster.id,
      question: '选择要保护的城市',
      options: availableCities.map((city, idx) => ({
        value: idx,
        label: `${idx + 1}. ${city.name}`
      }))
    })

    if (selectedCityIdx === null) {
      return {
        success: false,
        message: '玩家取消操作'
      }
    }

    // 3. 调用核心逻辑
    return executeCityProtectionCore({
      caster,
      cityIdx: selectedCityIdx,
      gameStore,
      gameMode: gameStore.gameMode
    })
  }

  /**
   * 获取可保护的城市列表
   */
  getAvailableCitiesForProtection(caster, gameStore) {
    const mode = gameStore.gameMode
    const is2pOr2v2 = mode === '2P' || mode === '2v2'
    const centerIdx = is2pOr2v2 ? caster.centerIndex : -1

    return caster.cities.filter((city, idx) => {
      // 排除中心城市（2P/2v2模式）
      if (is2pOr2v2 && idx === centerIdx) return false
      return true
    })
  }

  /**
   * 请求玩家选择（抽象方法，可通过Firebase或本地实现）
   */
  async requestPlayerSelection({ playerId, question, options }) {
    // Firebase实现：发送选择请求到玩家端
    // 本地实现：显示选择对话框
    // 返回: Promise<number|null>
    throw new Error('requestPlayerSelection must be implemented')
  }
}
```

---

## 🌐 统一接口层 (Interface Layer)

```javascript
// src/composables/useSkillEffects.js

import { executeCityProtectionCore } from './skillCore/nonBattleSkills'
import { HostModeSkillAdapter } from '../adapters/hostModeAdapter'
import { PlayerModeSkillAdapter } from '../adapters/playerModeAdapter'

export function useSkillEffects() {
  const gameStore = useGameStore()
  const hostAdapter = new HostModeSkillAdapter()
  const playerAdapter = new PlayerModeSkillAdapter()

  /**
   * 执行技能（自动根据模式选择适配器）
   */
  function executeSkill(skillName, params) {
    const mode = gameStore.currentMode // 'host' or 'player'

    switch (skillName) {
      case '城市保护':
        if (mode === 'host') {
          // 主持人模式：需要先render，然后apply
          return hostAdapter.applyCityProtection(
            params.playerIdx,
            gameStore
          )
        } else {
          // 玩家模式：异步执行（等待玩家确认）
          return playerAdapter.executeCityProtection({
            caster: params.caster,
            gameStore
          })
        }

      // ... 其他技能
    }
  }

  /**
   * 渲染技能UI（仅主持人模式）
   */
  function renderSkillUI(skillName, playerIdx, holderElement) {
    switch (skillName) {
      case '城市保护':
        return hostAdapter.renderCityProtection(
          playerIdx,
          holderElement,
          gameStore
        )

      // ... 其他技能
    }
  }

  return {
    executeSkill,
    renderSkillUI,
    // 直接暴露核心逻辑（用于测试）
    core: {
      executeCityProtectionCore
    }
  }
}
```

---

## 📊 优势

### 1. 代码复用
- ✅ 核心逻辑只写一次
- ✅ 两种模式共享相同的游戏规则
- ✅ 减少50%的代码量

### 2. 易于测试
- ✅ 核心逻辑是纯函数，易于单元测试
- ✅ 适配器层可以mock
- ✅ 无UI依赖，测试简单

### 3. 易于维护
- ✅ 修改游戏规则只需修改核心层
- ✅ 模式特定逻辑隔离在适配器层
- ✅ 职责清晰，易于理解

### 4. 易于扩展
- ✅ 添加新技能只需实现核心逻辑
- ✅ 添加新模式只需实现新适配器
- ✅ 支持未来的移动端、AI等模式

---

## 🔄 迁移策略

### 阶段1：创建核心层（当前）
1. 为每个技能创建核心逻辑函数
2. 确保所有参数通过参数传入
3. 返回标准化结果

### 阶段2：创建适配器层
1. 实现主持人模式适配器
2. 实现玩家模式适配器基础框架
3. 连接核心层和适配器层

### 阶段3：统一接口层
1. 创建统一的executeSkill函数
2. 根据模式自动选择适配器
3. 保持向后兼容

### 阶段4：渐进迁移
1. 优先迁移高频技能
2. 逐步替换旧实现
3. 保持两套系统并行运行

---

## 📝 示例：完整技能实现

### 核心层
```javascript
// skillCore/nonBattleSkills.js
export function executeCityProtectionCore(params) { ... }
```

### 主持人模式
```javascript
// adapters/hostModeAdapter.js
class HostModeSkillAdapter {
  renderCityProtection() { ... }
  applyCityProtection() { ... }
}
```

### 玩家模式
```javascript
// adapters/playerModeAdapter.js
class PlayerModeSkillAdapter {
  async executeCityProtection() { ... }
}
```

### 统一接口
```javascript
// useSkillEffects.js
function executeSkill('城市保护', params) {
  if (mode === 'host') return hostAdapter.apply(...)
  else return playerAdapter.execute(...)
}
```

---

**版本**: 1.0.0
**日期**: 2025-12-28
**状态**: 设计完成，等待实现
