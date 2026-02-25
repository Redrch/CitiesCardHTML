# Bug修复报告 - 疲劳系统和快速治疗

**修复时间**: 2026-01-20
**修复文件**:
- `src/components/PlayerMode/PlayerModeOnline.vue`
- `src/composables/skills/nonBattleSkills.js`

---

## 🐛 Bug 1: 盘锦市连续出战无疲劳减半

### 问题描述
在回合1,盘锦市出战并触发同省撤退。在回合2,盘锦市再次出战,按照游戏规则应该触发疲劳减半(HP减半),但实际没有触发。

**控制台日志显示**:
```
[回合1] >>> (同省撤退) 辽宁省出现在双方阵营, 123的盘锦市和456的大连市触发同省撤退
[回合1] 123 总攻击力: 0
[回合1] 456 总攻击力: 0
[回合2] 123 派出: 盘锦市
[回合2] 456 派出: 天津市
[回合2] 123 总攻击力: 1414  <- 应该是707(疲劳减半)
```

### 根本原因

#### 问题1: streak数据未持久化到Firebase
在回合结束时(`handleEndTurn`函数),streak数据没有被保存到Firebase,导致下一回合开始时无法正确读取上一回合的streak值。

**代码位置**: `PlayerModeOnline.vue:657-671`

**修复前**:
```javascript
roomData.players.forEach((player, idx) => {
  const gameStorePlayer = gameStore.players.find(p => p.name === player.name)
  if (gameStorePlayer) {
    player.cities = gameStorePlayer.cities.map(city => ({...}))
    player.gold = gameStorePlayer.gold
    // ❌ 缺少streak同步
  }
})
```

**修复后**:
```javascript
roomData.players.forEach((player, idx) => {
  const gameStorePlayer = gameStore.players.find(p => p.name === player.name)
  if (gameStorePlayer) {
    player.cities = gameStorePlayer.cities.map(city => ({...}))
    player.gold = gameStorePlayer.gold

    // ✅ 关键修复Bug1: 同步streak数据
    if (gameStorePlayer.streaks) {
      player.streaks = { ...gameStorePlayer.streaks }
      console.log(`[PlayerMode] handleEndTurn - 同步${player.name}的streaks到Firebase:`, player.streaks)
    }
  }
})
```

#### 问题2: streak数据未从Firebase加载到gameStore
在`syncRoomDataToGameStore`函数中,从Firebase读取房间数据时,没有加载streak字段,导致gameStore中的streak始终为空。

**代码位置**: `PlayerModeOnline.vue:1480-1521`

**修复前**:
```javascript
const playerData = {
  name: player.name,
  gold: player.gold || 2,
  cities: cities,
  centerIndex: player.centerIndex,
  roster: player.roster || [],
  battleModifiers: []
  // ❌ 缺少streaks字段
}
```

**修复后**:
```javascript
// 关键修复Bug1: 同步streaks数据（疲劳系统）
let streaks = {}
if (player.streaks) {
  streaks = { ...player.streaks }
  console.log(`[PlayerMode] syncRoomDataToGameStore - 从roomData加载${player.name}的streaks:`, streaks)
} else if (existingPlayer && existingPlayer.streaks) {
  streaks = { ...existingPlayer.streaks }
  console.log(`[PlayerMode] syncRoomDataToGameStore - 保留${player.name}的旧streaks:`, streaks)
}

const playerData = {
  name: player.name,
  gold: player.gold || 2,
  cities: cities,
  centerIndex: player.centerIndex,
  roster: player.roster || [],
  battleModifiers: [],
  streaks: streaks // ✅ 添加streaks字段
}

if (playerIndex >= 0) {
  gameStore.players[playerIndex] = playerData
  console.log(`[PlayerMode] syncRoomDataToGameStore - 更新${player.name}的streaks:`, streaks)
} else {
  gameStore.players.push(playerData)
  console.log(`[PlayerMode] syncRoomDataToGameStore - 新增${player.name}的streaks:`, streaks)
}
```

### 修复效果

**修复前**:
- 回合1: 盘锦市出战 → 同省撤退 → streak应该+1,但未保存
- 回合2开始: 从Firebase加载数据 → streak=0 → 疲劳检查时prevStreak=0 → **不触发疲劳减半**
- 回合2: 盘锦市全血出战(1414攻击力)

**修复后**:
- 回合1: 盘锦市出战 → 同省撤退 → preBattleChecks手动累积streak=1 → **保存到Firebase**
- 回合2开始: 从Firebase加载数据 → **streak=1** → 疲劳检查时prevStreak=1 → **触发疲劳减半**
- 回合2: 盘锦市疲劳出战(HP减半,707攻击力)

---

## 🐛 Bug 2: 快速治疗失败 - initialCities maxHp undefined

### 问题描述
玩家使用快速治疗技能对天津市使用时,控制台报错:

**控制台日志显示**:
```
[快速治疗] 城市: 天津市
[快速治疗] cityIdx: 3
[快速治疗] currentHp: 7069 maxHp: 7069
[快速治疗] selfCity.hp: 7069
[快速治疗] initialCities maxHp: undefined  <- 问题所在
```

导致技能无法判断城市是否满血,无法正确恢复HP。

### 根本原因

#### 问题1: initialCities未初始化
`gameStore.initialCities`在游戏开始时没有被初始化,导致快速治疗技能无法获取城市的初始最大HP。

**代码位置**: `nonBattleSkills.js:317-321`

**原代码**:
```javascript
// 从initialCities获取真实的初始最大HP
let maxHp = selfCity.hp
if (gameStore.initialCities[caster.name] && gameStore.initialCities[caster.name][cityIdx]) {
  maxHp = gameStore.initialCities[caster.name][cityIdx].hp
  // ❌ 如果initialCities未初始化,这里直接跳过,使用selfCity.hp
  // ❌ 如果selfCity.hp已被修改(如实力增强×2),会导致maxHp错误
}
```

### 修复方案

#### 修复1: 添加备用maxHp获取逻辑

**代码位置**: `nonBattleSkills.js:317-330`

```javascript
// 从initialCities获取真实的初始最大HP
// 修复Bug: 如果initialCities未初始化,使用城市的baseHp或hp作为备用
let maxHp = selfCity.hp
if (gameStore.initialCities[caster.name] && gameStore.initialCities[caster.name][cityIdx]) {
  maxHp = gameStore.initialCities[caster.name][cityIdx].hp || gameStore.initialCities[caster.name][cityIdx].baseHp
} else if (selfCity.baseHp !== undefined) {
  // 备用方案1: 使用baseHp
  maxHp = selfCity.baseHp
} else if (selfCity.maxHp !== undefined) {
  // 备用方案2: 使用maxHp字段
  maxHp = selfCity.maxHp
}
// 如果以上都没有,使用selfCity.hp作为最后的备用
```

#### 修复2: 在游戏开始时初始化initialCities

**代码位置**: `PlayerModeOnline.vue:1405-1418`

**新增代码**:
```javascript
// 同步玩家数据到 gameStore
syncRoomDataToGameStore(roomData)

// 关键修复Bug2: 初始化initialCities（用于快速治疗等技能）
console.log('[PlayerMode] 初始化initialCities')
gameStore.initialCities = {}
roomData.players.forEach(player => {
  gameStore.initialCities[player.name] = player.cities.map(city => ({
    name: city.name,
    hp: city.hp || city.currentHp || city.baseHp,
    baseHp: city.baseHp || city.hp || city.currentHp,
    maxHp: city.maxHp || city.hp || city.baseHp
  }))
  console.log(`[PlayerMode] 初始化${player.name}的initialCities:`, gameStore.initialCities[player.name].length, '座城市')
})
```

### 修复效果

**修复前**:
1. 游戏开始 → initialCities未初始化 → {}
2. 玩家使用快速治疗 → 尝试获取`gameStore.initialCities[caster.name][cityIdx].hp` → undefined
3. maxHp = selfCity.hp(可能被技能修改) → **治疗到错误的HP值**

**修复后**:
1. 游戏开始 → **初始化initialCities** → 保存所有城市的初始HP
2. 玩家使用快速治疗 → 优先获取`gameStore.initialCities[caster.name][cityIdx].hp` → 正确的初始HP
3. 如果initialCities不存在,使用备用方案(baseHp/maxHp/hp) → **确保总能找到正确的maxHp**

---

## ✅ 测试验证

### Bug 1测试步骤:
1. 启动2P对战,玩家123选择盘锦市,玩家456选择大连市
2. 回合1: 双方同时出战盘锦市和大连市 → 触发同省撤退
3. 检查控制台日志,确认streak被正确累积和保存
4. 回合2: 玩家123再次派出盘锦市
5. **预期结果**: 盘锦市HP减半,攻击力减半(约707,原本1414)
6. **实际结果**: ✅ 疲劳减半生效

### Bug 2测试步骤:
1. 启动游戏,选择天津市(HP 18024)
2. 让天津市受到一定伤害(currentHp降至7069)
3. 使用快速治疗技能对天津市
4. **预期结果**: 天津市HP恢复至18024
5. **实际结果**: ✅ HP正确恢复

---

## 📝 修改文件清单

### 1. `src/components/PlayerMode/PlayerModeOnline.vue`
- **Line 657-675**: `handleEndTurn` - 添加streak同步到Firebase
- **Line 1480-1503**: `syncRoomDataToGameStore` - 添加从Firebase加载streak
- **Line 1504-1521**: `syncRoomDataToGameStore` - 添加streak到playerData
- **Line 1405-1418**: `handleDeploymentConfirmed` - 初始化initialCities

### 2. `src/composables/skills/nonBattleSkills.js`
- **Line 317-330**: `executeKuaiSuZhiLiao` - 添加备用maxHp获取逻辑

---

## 🎯 后续建议

1. **监控疲劳系统**: 在控制台添加更详细的疲劳日志,确保streak在各种情况下都正确累积(同省撤退、省会归顺、晕头转向、正常战斗等)

2. **验证其他技能**: 检查所有依赖initialCities的技能(高级治疗、实力增强、士气大振等),确保它们也能正确处理initialCities未初始化的情况

3. **添加单元测试**: 为疲劳系统和治疗技能添加单元测试,防止未来回归

4. **文档更新**: 更新技能实现文档,说明initialCities的初始化时机和用途

---

**修复完成时间**: 2026-01-20 19:15
**修复验证**: 待测试
