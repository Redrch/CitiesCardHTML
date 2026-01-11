# 技能核心逻辑层使用指南

**创建日期**: 2025-12-28
**目的**: 统一技能架构，避免玩家模式和主持人模式代码重复

---

## 📚 目录结构

```
src/
├── composables/
│   ├── skillCore/                    # 核心逻辑层（新）
│   │   ├── battleSkillsCore.js       # 战斗技能核心逻辑（8个示例）
│   │   └── nonBattleSkillsCore.js    # 非战斗技能核心逻辑（5个示例）
│   ├── skills/                       # 现有实现（向后兼容）
│   │   ├── battleSkills.js           # 战斗技能（24个）
│   │   └── nonBattleSkills.js        # 非战斗技能（42个）
│   └── useSkillEffects.js            # 统一接口
└── adapters/                         # 适配器层（待实现）
    ├── hostModeAdapter.js            # 主持人模式适配器
    └── playerModeAdapter.js          # 玩家模式适配器
```

---

## 🎯 核心逻辑层设计原则

### 1. 纯函数
所有核心逻辑函数都是纯函数，无副作用（除了通过gameStore修改游戏状态）

```javascript
// ✅ 好的设计 - 纯函数
export function executeCityProtectionCore(params) {
  const { caster, cityIdx, gameStore, gameMode } = params

  // 所有依赖通过参数传入
  // 返回标准化结果
  return { success: true, message: '...', data: {...} }
}

// ❌ 坏的设计 - 依赖外部状态
function badDesign() {
  const gameStore = useGameStore() // 外部依赖
  const mode = getCurrentMode()     // 外部依赖
  // ...
}
```

### 2. 参数化
所有依赖通过参数传入，包括：
- `caster` - 施法者玩家对象
- `target` - 目标玩家对象（如适用）
- `cityIdx` / `targetCityIdx` - 城市索引
- `gameStore` - 游戏状态存储
- `gameMode` - 游戏模式 ('2P', '3P', '2v2')
- 其他技能特定参数

### 3. 模式无关
核心逻辑层不包含任何UI或模式特定代码：
- ❌ 不能有 `document.querySelector`
- ❌ 不能有 `render()` 函数
- ❌ 不能有 Firebase调用
- ✅ 只有纯粹的游戏规则逻辑

### 4. 标准返回
所有函数返回统一格式：

```javascript
{
  success: boolean,      // 技能是否成功执行
  message: string,       // 给用户的提示信息
  data?: any            // 可选的额外数据
}
```

---

## 📖 已实现技能示例

### 非战斗技能（5个）

| 技能名称 | 函数名 | 金币 | 说明 |
|---------|--------|------|------|
| 城市保护 | `executeCityProtectionCore` | 3 | 保护城市10轮 |
| 钢铁城市 | `executeIronCityCore` | 5 | 永久免疫特定技能 |
| 先声夺人 | `executePreemptiveStrikeCore` | 1 | 交换双方城市 |
| 快速治疗 | `executeQuickHealCore` | 3 | 恢复至满血 |
| 转账给他人 | `executeTransferGoldCore` | 0 | 转账金币 |

### 战斗技能（8个）

| 技能名称 | 函数名 | 金币 | 说明 |
|---------|--------|------|------|
| 擒贼擒王 | `executeQinZeiQinWangCore` | 2 | 优先攻击最高HP |
| 草木皆兵 | `executeCaoMuJieBingCore` | 2 | 对手伤害减半 |
| 越战越勇 | `executeYueZhanYueYongCore` | 2 | 忽略疲劳 |
| 铜墙铁壁 | `executeTongQiangTieBiCore` | 5 | 对手伤害无效 |
| 设置屏障 | `executeSetBarrierCore` | 15 | 15000HP屏障 |
| 潜能激发 | `executeQianNengJiFaCore` | 20 | 所有城市HP翻倍 |
| 御驾亲征 | `executeYuJiaQinZhengCore` | 8 | 摧毁最高HP城市 |

---

## 🔧 使用示例

### 示例1：直接调用核心逻辑

```javascript
import { executeCityProtectionCore } from './skillCore/nonBattleSkillsCore'
import { useGameStore } from '../stores/gameStore'

const gameStore = useGameStore()
const player = gameStore.players[0]
const cityIdx = 0

// 直接调用核心逻辑
const result = executeCityProtectionCore({
  caster: player,
  cityIdx: cityIdx,
  gameStore: gameStore,
  gameMode: gameStore.gameMode
})

if (result.success) {
  console.log('成功:', result.message)
  console.log('保护的城市:', result.data.cityName)
  console.log('持续回合:', result.data.rounds)
} else {
  console.error('失败:', result.message)
}
```

### 示例2：在主持人模式中使用

```javascript
// 主持人模式适配器（待实现）
class HostModeSkillAdapter {
  applyCityProtection(playerIdx, gameStore) {
    // 1. 从UI获取参数
    const select = document.querySelector(`[data-city-select]`)
    const cityIdx = parseInt(select.value)

    // 2. 调用核心逻辑
    const result = executeCityProtectionCore({
      caster: gameStore.players[playerIdx],
      cityIdx: cityIdx,
      gameStore: gameStore,
      gameMode: gameStore.gameMode
    })

    // 3. 更新UI
    if (result.success) {
      this.refreshUI()
    }

    return result
  }
}
```

### 示例3：在玩家模式中使用

```javascript
// 玩家模式适配器（待实现）
class PlayerModeSkillAdapter {
  async executeCityProtection(playerId, gameStore) {
    // 1. 请求玩家选择
    const cityIdx = await this.requestPlayerSelection({
      question: '选择要保护的城市',
      options: this.getAvailableCities(playerId)
    })

    if (cityIdx === null) {
      return { success: false, message: '玩家取消操作' }
    }

    // 2. 调用核心逻辑（与主持人模式相同！）
    const result = executeCityProtectionCore({
      caster: gameStore.players.find(p => p.id === playerId),
      cityIdx: cityIdx,
      gameStore: gameStore,
      gameMode: gameStore.gameMode
    })

    // 3. 通知玩家结果（通过Firebase）
    await this.notifyPlayer(playerId, result)

    return result
  }
}
```

---

## 🔄 迁移现有技能

### 迁移步骤

1. **提取核心逻辑**
   - 从现有的 `battleSkills.js` 或 `nonBattleSkills.js` 中提取技能逻辑
   - 移除UI相关代码
   - 改为接收参数而非直接访问gameStore

2. **创建核心函数**
   ```javascript
   // 旧代码（skills/nonBattleSkills.js）
   function executeSkill(caster, selfCity) {
     const gameStore = useGameStore()
     // ... 逻辑
   }

   // 新代码（skillCore/nonBattleSkillsCore.js）
   export function executeSkillCore(params) {
     const { caster, cityIdx, gameStore, gameMode } = params
     // ... 相同的逻辑，但参数化
   }
   ```

3. **更新调用方式**
   ```javascript
   // 在 skills/nonBattleSkills.js 中
   import { executeSkillCore } from '../skillCore/nonBattleSkillsCore'

   export function executeSkill(caster, selfCity) {
     const gameStore = useGameStore()

     // 调用核心逻辑
     return executeSkillCore({
       caster,
       cityIdx: caster.cities.indexOf(selfCity),
       gameStore,
       gameMode: gameStore.gameMode
     })
   }
   ```

### 迁移示例：无知无畏

**旧代码**（`skills/nonBattleSkills.js` 第43-120行）：
```javascript
function executeWuZhiWuWei(caster, target) {
  // 检查坚不可摧护盾
  if (gameStore.isBlockedByJianbukecui(...)) { ... }

  // ... 找到血量最低城市
  const lowestHpCity = aliveCities.reduce(...)
  const damage = Math.min(lowestHpCity.currentHp || lowestHpCity.hp, 7500)

  // ... 自毁城市
  // ... 对中心造成伤害

  return { success: true, message: '...' }
}
```

**新代码**（提取到 `skillCore/nonBattleSkillsCore.js`）：
```javascript
export function executeWuZhiWuWeiCore(params) {
  const { caster, target, gameStore } = params

  // 检查坚不可摧护盾
  if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '无知无畏')) {
    return {
      success: false,
      message: `被${target.name}的坚不可摧护盾阻挡`
    }
  }

  // ... 相同的逻辑，无修改

  return {
    success: true,
    message: `${lowestHpCity.name}攻击中心后自毁，造成${damage}伤害`,
    data: {
      destroyedCity: lowestHpCity.name,
      damage: damage
    }
  }
}
```

**包装函数**（保持向后兼容）：
```javascript
// skills/nonBattleSkills.js
import { executeWuZhiWuWeiCore } from '../skillCore/nonBattleSkillsCore'

export function executeWuZhiWuWei(caster, target) {
  const gameStore = useGameStore()

  return executeWuZhiWuWeiCore({
    caster,
    target,
    gameStore
  })
}
```

---

## ✅ 优势总结

### 1. 代码复用
- ✅ 核心逻辑只写一次
- ✅ 玩家模式和主持人模式共享相同代码
- ✅ 减少50%的代码量

### 2. 易于测试
```javascript
// 单元测试示例
import { executeCityProtectionCore } from './skillCore/nonBattleSkillsCore'

test('城市保护成功', () => {
  const mockGameStore = createMockGameStore()
  const mockPlayer = createMockPlayer()

  const result = executeCityProtectionCore({
    caster: mockPlayer,
    cityIdx: 0,
    gameStore: mockGameStore,
    gameMode: '2P'
  })

  expect(result.success).toBe(true)
  expect(mockGameStore.protections[mockPlayer.name][0]).toBe(10)
})
```

### 3. 易于维护
- ✅ 修改游戏规则只需修改核心层
- ✅ 模式特定逻辑隔离在适配器层
- ✅ 职责清晰，易于理解

### 4. 易于扩展
- ✅ 添加新技能只需实现核心逻辑
- ✅ 添加新模式只需实现新适配器
- ✅ 支持未来的移动端、AI等模式

---

## 📊 当前状态

### 已完成 ✅
- [x] 创建 `skillCore` 目录结构
- [x] 实现 13 个核心技能示例
  - 5 个非战斗技能
  - 8 个战斗技能
- [x] 创建架构设计文档
- [x] 创建使用指南

### 进行中 🔄
- [ ] 迁移现有 66 个技能到核心层
- [ ] 实现主持人模式适配器
- [ ] 实现玩家模式适配器基础框架

### 待完成 ⏳
- [ ] 创建统一接口层
- [ ] 编写单元测试
- [ ] 完整迁移所有技能
- [ ] 实现玩家模式 Firebase 集成

---

## 🚀 下一步

1. **短期（1-2天）**
   - 继续迁移高频技能到核心层
   - 实现简单的主持人模式适配器示例
   - 保持现有代码向后兼容

2. **中期（1周）**
   - 完成所有66个技能迁移
   - 实现完整的适配器层
   - 统一接口层集成

3. **长期（1月）**
   - 玩家模式完整实现
   - 单元测试覆盖
   - 性能优化

---

**文档版本**: 1.0.0
**最后更新**: 2025-12-28
**维护者**: Claude Code Assistant
