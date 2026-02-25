# 城市索引到名称迁移计划

**创建时间**: 2026-01-21
**状态**: 进行中

---

## 📊 当前状况分析

### ✅ 已完成的迁移（100%）

1. **gameStore.js 状态结构**
   - 所有状态对象已使用 cityName 作为键
   - 注释已更新为 `[player][cityName]`
   - 实例：`anchored[player][cityName]`, `protections[player][cityName]` 等

2. **gameStore.js 辅助函数**
   - `hasProtection(playerName, cityName)` ✓
   - `hasIronShield(playerName, cityName)` ✓
   - `consumeProtection(playerName, cityName)` ✓
   - `isCityKnown(playerName, cityName, knownBy)` ✓
   - `setCityKnown(playerName, cityName, knownBy)` ✓
   - `isInCautiousSet(playerName, cityName)` ✓

3. **先声夺人基础设施**
   - `createPendingSwap(initiatorName, targetName, initiatorCityName)` ✓
   - `updatePendingSwapStatus(swapId, status, targetCityName)` ✓

4. **步步高升系统**
   - `handleBuBuGaoShengSummon(player, cityName, city)` ✓
   - `bbgs[player.name][cityName]` ✓

5. **生于紫室/副中心系统**
   - `purpleChamber[player]` 存储 cityName ✓
   - `subCenters[player]` 存储 cityName ✓

6. **已知城市系统**
   - `knownCities[observer][owner] = Set(cityName)` ✓

---

## ⚠️ 待迁移的模块

### 1. **先声夺人交换逻辑** (高优先级)

**位置**: `src/composables/skills/nonBattleSkills.js:1100-1234`

**问题**:
```javascript
// 当前代码使用索引
swap.initiatorCityIdx
initiator.cities[swap.initiatorCityIdx]
targetPlayer.cities[targetCityIdx]
```

**需要改为**:
```javascript
// 应该使用名称
swap.initiatorCityName
initiator.cities[swap.initiatorCityName]
targetPlayer.cities[targetCityName]
```

**影响范围**:
- `executePreemp tiveStrikeSwap()` 函数
- 疲劳streak交换逻辑（第1171-1183行）
- `swapCityIndexedStates()` 函数调用（第1187行）

---

### 2. **swapCityIndexedStates 函数** (高优先级)

**位置**: `src/composables/skills/nonBattleSkills.js:18-145`

**状态**: 完全过时，应该删除或重写

**原因**:
- 设计用于索引系统
- gameStore已全部迁移到cityName
- 现在的状态对象已经用 `[player][cityName]` 作为键

**解决方案**: 删除此函数，城市交换时无需交换状态（因为状态已经按cityName追踪）

---

### 3. **疲劳系统中的残留索引**

**位置**: 多个文件

**问题**:
- 某些地方可能仍在使用 `player.streaks[cityIdx]`
- 应该使用 `fatigueStreaks[playerName][cityName]`

**需要检查**:
- battleSkills.js
- game/fatigueSystem.js
- game/preBattleChecks.js

---

### 4. **其他技能文件中的cityIdx**

**统计**:
- `battleSkills.js`: 22处
- `nonBattleSkills.js`: 193处

**大部分在**:
- 旧的 `swapCityIndexedStates` 函数内（可删除）
- 注释和参数名（需要更新）

---

## 🎯 迁移策略

### 阶段 1: 修复先声夺人系统 (当前)

1. ✅ 确认 gameStore 的先声夺人基础设施已迁移
2. 🔄 **正在进行**: 重写 `executePreemptiveStrikeSwap` 使用cityName
3. ⏳ 删除 `swapCityIndexedStates` 函数
4. ⏳ 更新所有调用先声夺人的地方

### 阶段 2: 清理技能文件

1. ⏳ 搜索并替换所有 `cityIdx` 参数为 `cityName`
2. ⏳ 更新所有 `player.cities[cityIdx]` 为 `player.cities[cityName]`
3. ⏳ 检查 battleSkills.js 中的22处使用
4. ⏳ 更新注释和文档

### 阶段 3: 更新Vue组件

1. ⏳ 搜索所有使用 cityIdx 的组件
2. ⏳ 更新为使用 cityName
3. ⏳ 测试UI交互

### 阶段 4: 测试和验证

1. ⏳ 运行所有单元测试
2. ⏳ 手动测试先声夺人技能
3. ⏳ 手动测试其他关键技能
4. ⏳ 完整游戏流程测试

---

## 📝 关键发现

### player.cities 结构已是cityName-based

```javascript
// 当前结构
player.cities = {
  '北京市': { name: '北京市', currentHp: 52073, ... },
  '上海市': { name: '上海市', currentHp: 56709, ... }
}

// 不再是数组！
```

### gameStore 状态都是cityName-based

```javascript
anchored[playerName][cityName] = rounds
ironCities[playerName][cityName] = layers
protections[playerName][cityName] = rounds
// ... 等等
```

### 疲劳系统已迁移

```javascript
// 旧的（已废弃）
player.streaks[cityIdx] = count

// 新的（正在使用）
fatigueStreaks[playerName][cityName] = count
```

---

## 🚨 风险评估

### 高风险区域

1. **先声夺人交换逻辑**
   - 复杂的状态同步
   - 多个系统交互
   - 需要仔细测试

2. **疲劳系统**
   - 已部分迁移
   - 可能存在混用

### 中风险区域

1. **战斗技能**
   - battleSkills.js 的22处使用
   - 需要逐个检查

2. **Vue组件**
   - UI层可能有索引依赖
   - 需要全面测试

---

## ✅ 成功标准

1. 所有 cityIdx 引用被移除或更新
2. 所有测试通过
3. 先声夺人技能正常工作
4. 游戏完整流程无bug
5. 代码注释和文档更新

---

## 📅 时间线

- **阶段1**: 当前会话
- **阶段2**: 当前会话
- **阶段3**: 下次会话
- **阶段4**: 下次会话

---

**下一步**: 重写 `executePreemptiveStrikeSwap` 函数使用 cityName
