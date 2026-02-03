# 城市索引到名称迁移 - 当前状态报告

**日期**: 2026-01-21
**会话**: 索引到名称迁移
**进度**: 60%完成

---

## 🔍 关键发现

### 数据结构不一致问题

**问题根源**: 代码中存在数据结构假设不一致

#### gameStore.js (✅ 已迁移)
```javascript
// player.cities 结构：对象（键为城市名称）
player.cities = {
  '北京市': { name: '北京市', currentHp: 52073, ... },
  '上海市': { name: '上海市', currentHp: 56709, ... }
}

// 所有状态使用 cityName 作为键
anchored[playerName][cityName] = rounds
protections[playerName][cityName] = rounds
```

#### 技能文件 (❌ 部分使用旧代码)
```javascript
// ❌ 错误：假设 cities 是数组
player.cities.forEach((city, idx) => { ... })
caster.cities[cityIdx]  // 用索引访问

// ❌ 错误：传递cityIdx
gameStore.createPendingSwap(caster.name, target.name, casterCityIdx)

// ✅ 正确：应该使用cityName
Object.values(player.cities).forEach(city => { ... })
caster.cities[cityName]  // 用名称访问
gameStore.createPendingSwap(caster.name, target.name, cityName)
```

---

## ✅ 已完成的迁移

### 1. gameStore.js - 100%完成
- [x] 所有状态对象使用 `[playerName][cityName]`
- [x] 辅助函数使用cityName参数
- [x] createPendingSwap 使用 cityName
- [x] 护盾检查函数使用cityName
- [x] 已知城市系统使用cityName
- [x] 步步高升系统使用cityName
- [x] 生于紫室/副中心使用cityName

### 2. swapCityStates 函数 - 100%完成
- [x] 删除旧的 `swapCityIndexedStates`
- [x] 创建新的 `swapCityStates(player1Name, city1Name, player2Name, city2Name)`
- [x] 简化逻辑（状态自动跟随cityName）

---

## ⚠️ 发现的问题

### 问题1: executeXianShengDuoRen 函数（先声夺人创建）

**位置**: nonBattleSkills.js:864-1013

**问题**:
1. 第865行：接收 `casterCityIdx` 参数（应该是cityName）
2. 第902行：`player.cities.forEach((city, idx)` - **假设cities是数组**
3. 第907行：`gameStore.isInCautiousSet(player.name, idx)` - 传入idx（应该是cityName）
4. 第913行：`gameStore.anchored[player.name][idx]` - 用idx访问（应该是cityName）
5. 第916行：`gameStore.hasIronShield(player.name, idx)` - 传入idx
6. 第979行：`createPendingSwap(caster.name, target.name, casterCityIdx)` - **传入idx而不是name**
7. 第999行：`caster.cities[casterCityIdx]` - 用索引访问

**影响**: 创建的swap对象可能包含错误的数据结构

### 问题2: executePreemptiveStrikeSwap 函数（交换执行）

**位置**: nonBattleSkills.js:1050-1173

**问题**:
1. 使用 `swap.initiatorCityIdx` （应该是 initiatorCityName）
2. 第1051-1053行：用idx检查状态（应该用cityName）
3. 第1068-1069行：`cities[cityIdx]` - 用索引访问对象
4. 第1090、1095行：用索引赋值
5. 第1110-1122行：疲劳系统用player.streaks[cityIdx]（应该用fatigueStreaks[playerName][cityName]）
6. 第1126行：调用旧函数（已修复）
7. 第1132、1138行：disguisedCities 用idx

**影响**: 交换逻辑完全无法工作

### 问题3: 疲劳系统混用

**多个位置使用**:
- `player.streaks[cityIdx]` - 旧方式（已废弃）
- `fatigueStreaks[playerName][cityName]` - 新方式（正确）

---

## 🎯 修复计划

### 阶段1: 修复先声夺人系统（当前）

#### 步骤1: 重写 executeXianShengDuoRen ✅ 进行中
```javascript
// 旧签名
function executeXianShengDuoRen(caster, target, params = {}) {
  const { casterCityIdx } = params

// 新签名（应该是）
function executeXianShengDuoRen(caster, target, params = {}) {
  const { casterCityName } = params  // 改为 cityName

  // 获取可交换城市（返回城市名称数组）
  function getEligibleCities(player) {
    const eligible = []
    Object.entries(player.cities).forEach(([cityName, city]) => {
      if (city.isAlive === false) return
      if (gameStore.isInCautiousSet(player.name, cityName)) return
      // ... 其他检查使用cityName
      eligible.push(cityName)
    })
    return eligible
  }
```

#### 步骤2: 重写 executePreemptiveStrikeSwap ⏳ 待处理
```javascript
// 使用 cityName 访问
const initiatorCity = initiator.cities[swap.initiatorCityName]
const targetCity = targetPlayer.cities[swap.targetCityName]

// 疲劳系统使用新方式
const tempInitiatorStreak = gameStore.fatigueStreaks[initiator.name]?.[initiatorCityName] || 0
gameStore.fatigueStreaks[initiator.name][initiatorCityName] = tempTargetStreak
```

#### 步骤3: 更新调用这些函数的地方 ⏳ 待处理

### 阶段2: 批量修复其他技能文件

#### battleSkills.js - 22处cityIdx
- 大部分可能是注释或局部变量
- 需要逐个检查

#### nonBattleSkills.js - 约170处cityIdx（除了先声夺人）
- 很多在旧的swapCityIndexedStates中（已删除）
- 需要全局搜索替换

### 阶段3: Vue组件
- 搜索组件中的cityIdx使用
- 更新为cityName

---

## 📊 统计

| 类别 | 总数 | 已完成 | 进度 |
|------|------|--------|------|
| gameStore.js 状态 | 20+ | 20+ | 100% |
| gameStore.js 函数 | 15+ | 15+ | 100% |
| swapCityStates | 1 | 1 | 100% |
| 先声夺人创建 | 1 | 0.5 | 50% |
| 先声夺人执行 | 1 | 0 | 0% |
| battleSkills.js | 22 | 0 | 0% |
| nonBattleSkills.js 其他 | ~150 | 0 | 0% |
| Vue组件 | 未知 | 0 | 0% |
| **总体进度** | - | - | **~60%** |

---

## 🚨 当前阻塞点

### 关键问题
`player.cities` 的数据结构在不同部分不一致：
- **gameStore认为**: `{ 城市名: cityObj }`
- **技能代码认为**: `[cityObj, cityObj, ...]`

这导致：
1. `.forEach()` 在对象上不工作
2. `cities[cityIdx]` 返回undefined
3. 先声夺人完全无法工作

### 解决方案
必须统一假设 `player.cities` 是对象（键为城市名称），并：
1. 使用 `Object.values(player.cities)` 遍历
2. 使用 `player.cities[cityName]` 访问
3. 使用 `Object.keys(player.cities)` 获取城市名称列表

---

## 📝 下一步

1. **立即**: 完成 executeXianShengDuoRen 重写
2. **立即**: 完成 executePreemptiveStrikeSwap 重写
3. **后续**: 批量替换其他文件中的cityIdx
4. **最后**: 测试和验证

---

## 💡 建议

由于这是一个大规模迁移：
1. 建议分多个会话完成
2. 每次完成一个模块后立即测试
3. 保留备份以便回滚
4. 更新测试用例以匹配新结构

---

**状态**: 🟡 进行中
**下一个里程碑**: 完成先声夺人系统重写
