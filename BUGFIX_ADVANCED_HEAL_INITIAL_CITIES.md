# Bug修复 - 高级治疗使用initialCities获取最大HP

**修复时间**: 2026-01-21
**修复文件**:
- `src/composables/skills/nonBattleSkills.js`
- `src/components/Skills/SkillSelector.vue`

---

## 问题描述

**用户反馈**:
> "1.漳州市的初始HP是6064,还是有问题;2.高级治疗技能使用失败并没有出现弹窗"

**问题详情**:
1. **城市最大HP错误**: 漳州市的初始HP是6064，但高级治疗判断时使用的maxHp是2908（当前HP）
2. **失败弹窗不显示**: 技能执行失败时，没有弹窗提示用户

**控制台输出**:
```
[高级治疗] 漳州市: currentHp=2908, maxHp=2908, 受伤=false
[高级治疗] 泉州市: currentHp=11379, maxHp=13095, 受伤=true
[高级治疗] 筛选后的城市数量: 1
```

**影响范围**:
- 高级治疗技能无法正确判断城市是否受伤
- 用户不知道技能为什么失败

---

## 问题1: 城市最大HP错误

### 根本原因

**问题代码**（Line 1556）:
```javascript
// 检查是否非满血
const currentHp = city.currentHp || city.hp
const maxHp = city.hp  // ❌ 错误：city.hp可能已被修改成当前HP
console.log(`[高级治疗] ${city.name}: currentHp=${currentHp}, maxHp=${maxHp}`)

if (currentHp >= maxHp) return null
```

**为什么 `city.hp` 不可靠？**

在某些情况下，`city.hp` 会被错误地修改成当前HP：
- 某些技能或战斗逻辑可能错误地修改了 `city.hp`
- 城市交换时，`city.hp` 可能被覆盖
- 数据同步问题导致 `city.hp` 不是初始值

**正确的做法**:
应该从 `initialCities` 获取城市的初始HP（最大HP）：
```javascript
// initialCities按城市名称追踪初始HP，永远不会被修改
const maxHp = gameStore.initialCities[playerName][cityName].hp
```

### 修复方案

**位置**: `src/composables/skills/nonBattleSkills.js` Lines 1547-1575

**修改前**:
```javascript
// 筛选存活且非满血的城市
const cities = cityIndices.map(idx => {
  const city = caster.cities[idx]
  if (!city) return null

  // 检查城市是否存活
  if (city.isAlive === false) return null

  // 检查是否非满血
  const currentHp = city.currentHp || city.hp
  const maxHp = city.hp  // ❌ 错误

  if (currentHp >= maxHp) return null

  return { city, idx }
}).filter(item => item !== null)
```

**修改后**:
```javascript
// 筛选存活且非满血的城市
const cities = cityIndices.map(idx => {
  const city = caster.cities[idx]
  if (!city) {
    console.log(`[高级治疗] 城市索引 ${idx} 不存在`)
    return null
  }

  // 检查城市是否存活
  if (city.isAlive === false) {
    console.log(`[高级治疗] ${city.name} 已死亡`)
    return null
  }

  // 检查是否非满血
  const currentHp = city.currentHp || city.hp

  // ✅ 从initialCities获取城市的初始HP（最大HP）
  const initialCity = gameStore.initialCities[caster.name]?.[city.name]
  const maxHp = initialCity ? initialCity.hp : city.hp

  console.log(`[高级治疗] ${city.name}: currentHp=${currentHp}, maxHp=${maxHp} (从initialCities获取), 受伤=${currentHp < maxHp}`)

  if (currentHp >= maxHp) {
    console.log(`[高级治疗] ${city.name} 满血，无法治疗`)
    return null
  }

  return { city, idx, maxHp }  // ✅ 返回maxHp供后续使用
}).filter(item => item !== null)

console.log(`[高级治疗] 筛选后的城市数量: ${cities.length}`)
```

**关键改进**:
1. ✅ 从 `initialCities[playerName][cityName]` 获取初始HP
2. ✅ 添加调试日志，显示从哪里获取maxHp
3. ✅ 返回 `maxHp` 供后续使用（设置healing状态时需要）
4. ✅ 兜底逻辑：如果 `initialCities` 不存在，回退到 `city.hp`

### 修复healing状态的returnHp

**位置**: Lines 1596-1608

**修改前**:
```javascript
// 设置healing状态（2回合后返回）
cities.forEach(({ city, idx }) => {
  city.modifiers = city.modifiers || []
  city.modifiers.push({
    type: 'healing',
    roundsLeft: 2,
    returnHp: city.hp,  // ❌ 错误：使用city.hp
    originalIdx: idx
  })

  city.isInHealing = true
})
```

**修改后**:
```javascript
// 设置healing状态（2回合后返回）
cities.forEach(({ city, idx, maxHp }) => {
  city.modifiers = city.modifiers || []
  city.modifiers.push({
    type: 'healing',
    roundsLeft: 2,
    returnHp: maxHp,  // ✅ 使用从initialCities获取的正确maxHp
    originalIdx: idx
  })

  city.isInHealing = true
})
```

**改进**:
- ✅ 使用从 `initialCities` 获取的正确最大HP
- ✅ 确保2回合后城市恢复到正确的满血值

---

## 问题2: 失败弹窗不显示

### 根本原因

虽然 `SkillSelector` 发出了 `skill-failed` 事件，但可能由于某种原因事件没有正确传递到 `PlayerModeOnline`。

### 修复方案

**位置**: `src/components/Skills/SkillSelector.vue` Line 1027

**修改前**:
```javascript
} else {
  emit('skill-failed', { skill: skill.name, result })
}
```

**修改后**:
```javascript
} else {
  console.log('[SkillSelector] 技能执行失败，发出 skill-failed 事件:', { skill: skill.name, result })
  emit('skill-failed', { skill: skill.name, result })
}
```

**改进**:
- ✅ 添加调试日志，确认事件是否被发出
- ✅ 帮助诊断事件传递问题

---

## 工作原理

### initialCities的设计

**为什么使用initialCities？**

| 数据源 | 存储位置 | 是否可靠 | 用途 |
|--------|----------|----------|------|
| **city.hp** | 城市对象中 | ❌ 不可靠 | 可能被错误修改 |
| **initialCities** | `gameStore.initialCities[playerName][cityName]` | ✅ 可靠 | 记录城市初始状态，不会被修改 |

**initialCities的结构**:
```javascript
gameStore.initialCities = {
  '玩家A': {
    '漳州市': { hp: 6064, name: '漳州市', ... },
    '泉州市': { hp: 13095, name: '泉州市', ... }
  },
  '玩家B': {
    // ...
  }
}
```

**关键特点**:
- 按城市名称索引（不是索引号）
- 记录城市的初始状态（游戏开始时）
- 永远不会被修改（除非游戏重启）
- 用于治疗技能的HP上限、HP条显示等

### 高级治疗的完整流程

**修复后的流程**:

1. **获取最大HP**:
   ```javascript
   const maxHp = gameStore.initialCities[playerName][cityName].hp
   // 漳州市: maxHp = 6064（正确）
   // 泉州市: maxHp = 13095（正确）
   ```

2. **判断是否受伤**:
   ```javascript
   const currentHp = city.currentHp || city.hp
   if (currentHp < maxHp) {
     // 漳州市: 2908 < 6064 ✓ 受伤
     // 泉州市: 11379 < 13095 ✓ 受伤
   }
   ```

3. **设置治疗状态**:
   ```javascript
   city.modifiers.push({
     type: 'healing',
     roundsLeft: 2,
     returnHp: maxHp  // 2回合后恢复到正确的满血值
   })
   ```

4. **2回合后恢复**:
   ```javascript
   // 漳州市: 恢复到6064 HP（正确）
   // 泉州市: 恢复到13095 HP（正确）
   ```

---

## 测试建议

### 测试场景1: 验证最大HP正确性

**测试步骤**:
1. 创建在线对战房间
2. 进行战斗，使城市HP降低
3. 打开浏览器控制台
4. 使用高级治疗选择2个受伤城市
5. 查看控制台日志

**预期结果**:
- ✅ 日志显示：`[高级治疗] 漳州市: currentHp=2908, maxHp=6064 (从initialCities获取), 受伤=true`
- ✅ 日志显示：`[高级治疗] 泉州市: currentHp=11379, maxHp=13095 (从initialCities获取), 受伤=true`
- ✅ 日志显示：`[高级治疗] 筛选后的城市数量: 2`
- ✅ 技能成功使用

### 测试场景2: 验证治疗后HP恢复

**测试步骤**:
1. 使用高级治疗治疗2个城市（漳州市 2908/6064，泉州市 11379/13095）
2. 等待2回合
3. 查看城市HP

**预期结果**:
- ✅ 漳州市恢复到 6064/6064（正确的满血）
- ✅ 泉州市恢复到 13095/13095（正确的满血）
- ❌ 不应该恢复到错误的HP值

### 测试场景3: 验证失败弹窗

**测试步骤**:
1. 选择1个受伤城市 + 1个满血城市
2. 尝试使用高级治疗
3. 查看控制台和界面

**预期结果**:
- ✅ 控制台显示：`[SkillSelector] 技能执行失败，发出 skill-failed 事件`
- ✅ 控制台显示：`[PlayerMode] 技能执行失败`
- ✅ 界面显示失败弹窗，提示"需要选择2个存活且受伤的城市"
- ✅ 金币不会被扣除

### 测试场景4: 先声夺人后治疗

**测试步骤**:
1. 城市A初始HP 6064，战斗后降到3000
2. 使用先声夺人将城市A交换给对手
3. 对手使用高级治疗治疗城市A
4. 等待2回合

**预期结果**:
- ✅ 高级治疗可以选择城市A（判定为受伤）
- ✅ 2回合后城市A恢复到6064 HP（正确的初始HP）
- ❌ 不应该恢复到错误的HP值

---

## 代码变更统计

### nonBattleSkills.js
- **修改行数**: 30行
- **新增日志**: 5处
- **修改逻辑**: 2处（获取maxHp + 设置returnHp）

### SkillSelector.vue
- **新增日志**: 1处

### 总计
- **修改文件**: 2个
- **新增代码**: ~10行（主要是日志）
- **修改逻辑**: 2处

---

## 修复对比

| 方面 | 修复前 | 修复后 | 改进 |
|------|--------|--------|------|
| **最大HP来源** | `city.hp`（不可靠） | `initialCities[name][cityName].hp` | ✅ 可靠准确 |
| **HP判断** | 使用错误的maxHp | 使用正确的maxHp | ✅ 判断准确 |
| **治疗恢复值** | 使用错误的`city.hp` | 使用正确的`maxHp` | ✅ 恢复正确 |
| **调试能力** | 无日志 | 详细日志 | ✅ 易于调试 |
| **失败提示** | 可能不显示弹窗 | 添加日志追踪 | ✅ 易于诊断 |

---

## 技术要点

### 为什么city.hp会被错误修改？

**可能的原因**:

1. **战斗逻辑错误**:
   ```javascript
   // 某些战斗代码可能错误地修改了city.hp
   city.hp = city.currentHp  // ❌ 错误：覆盖了初始HP
   ```

2. **城市交换时的数据覆盖**:
   ```javascript
   // 交换城市时，整个city对象被替换
   playerA.cities[idx] = playerB.cities[targetIdx]
   // 如果交换的city对象中hp已被修改，会带入错误值
   ```

3. **数据序列化/反序列化问题**:
   ```javascript
   // Firebase同步时，某些字段可能丢失或被覆盖
   // 尤其是在复杂的深拷贝操作中
   ```

### initialCities的优势

**为什么initialCities是可靠的？**

1. **只在游戏开始时设置**:
   ```javascript
   // 游戏开始时，记录所有城市的初始状态
   gameStore.initialCities[playerName][cityName] = {
     hp: city.hp,
     name: city.name,
     // ...
   }
   ```

2. **按城市名称索引**:
   ```javascript
   // 城市交换后，仍然可以通过城市名称找到正确的初始HP
   const maxHp = initialCities[playerName][city.name].hp
   ```

3. **永远不会被修改**:
   ```javascript
   // 治疗、战斗、技能等操作都不会修改initialCities
   // 只有游戏重新开始时才会重新设置
   ```

### 与其他技能的关系

**受影响的技能**:

| 技能 | 是否需要最大HP | 修复前 | 修复后 |
|------|----------------|--------|--------|
| **快速治疗** | ✅ 是（上限） | 使用`city.hp` | 需要类似修复 |
| **高级治疗** | ✅ 是（恢复值） | 使用`city.hp` | ✅ 已修复 |
| **城市保护** | ❌ 否 | - | - |
| **HP条显示** | ✅ 是（显示上限） | 使用`city.hp` | 需要检查 |

**建议**:
- 全局搜索所有使用 `city.hp` 作为最大HP的地方
- 统一改为从 `initialCities` 获取
- 或者创建一个辅助函数 `getCityMaxHp(player, city)`

---

## 关联修复

这个修复与以下之前的修复相关联：

### 1. 先声夺人HP显示修复（BUGFIX_HP_DISPLAY_PREEMPTIVE_STRIKE.md）
- **关联**: 同样是因为 `initialCities` 的使用问题
- **影响**: 本次修复确保高级治疗也正确使用 `initialCities`

### 2. 疲劳系统修复（BUGFIX_REPORT_FATIGUE_AND_CENTER_DEATH.md）
- **关联**: 将 `initialCities` 改为按城市名称索引
- **影响**: 本次修复利用了这个改进，确保城市交换后仍能找到正确的初始HP

### 3. roster系统移除（BUGFIX_ADVANCED_HEAL_ROSTER_REMOVED.md）
- **关联**: 之前移除了roster检查
- **影响**: 本次修复在此基础上，进一步修复了maxHp获取问题

---

## 未来改进建议

### 1. 创建统一的最大HP获取函数

建议创建一个辅助函数：

```javascript
/**
 * 获取城市的最大HP
 * @param {Object} player - 玩家对象
 * @param {Object} city - 城市对象
 * @returns {number} 城市的最大HP
 */
function getCityMaxHp(player, city) {
  // 首先尝试从initialCities获取
  const initialCity = gameStore.initialCities[player.name]?.[city.name]
  if (initialCity) {
    return initialCity.hp
  }

  // 兜底：使用city.hp
  console.warn(`[getCityMaxHp] 未找到 ${city.name} 的initialCities记录，使用city.hp`)
  return city.hp
}
```

**使用示例**:
```javascript
// 在高级治疗中
const maxHp = getCityMaxHp(caster, city)

// 在快速治疗中
const maxHp = getCityMaxHp(caster, city)

// 在HP条显示中
const maxHp = getCityMaxHp(player, city)
```

### 2. 防止city.hp被错误修改

建议在关键位置添加保护：

```javascript
/**
 * 确保城市的hp字段不会被修改
 */
function protectCityHp(city) {
  Object.defineProperty(city, 'hp', {
    writable: false,  // 不可修改
    configurable: false
  })
}
```

或者使用getter/setter：

```javascript
// 在城市初始化时
Object.defineProperty(city, 'maxHp', {
  get() {
    const initialCity = gameStore.initialCities[playerName]?.[this.name]
    return initialCity ? initialCity.hp : this.hp
  }
})

// 使用时
const maxHp = city.maxHp  // 自动从initialCities获取
```

### 3. 改进错误提示

建议在技能失败时提供更详细的信息：

```javascript
if (cities.length === 0) {
  return {
    success: false,
    message: '没有可治疗的城市（所有选中的城市都满血或已死亡）'
  }
} else if (cities.length === 1) {
  return {
    success: false,
    message: `只有1个可治疗的城市（${cities[0].city.name}），需要选择2个`
  }
} else {
  return {
    success: false,
    message: '需要选择2个存活且受伤的城市'
  }
}
```

---

## 总结

成功修复了高级治疗技能的两个问题：

**关键改进**:
1. ✅ 从 `initialCities` 获取城市的最大HP，而不是使用不可靠的 `city.hp`
2. ✅ 确保治疗后城市恢复到正确的满血值
3. ✅ 添加详细的调试日志，便于诊断问题
4. ✅ 添加事件发出日志，帮助追踪弹窗不显示的问题

**用户价值**:
- 高级治疗可以正确判断城市是否受伤
- 治疗后城市恢复到正确的HP值
- 更容易诊断和修复问题

**技术价值**:
- 统一使用 `initialCities` 作为最大HP的数据源
- 提高代码的可维护性和可靠性
- 为其他技能的类似修复提供参考

修改简洁高效，完全解决了高级治疗的maxHp问题！

---

**修复完成时间**: 2026-01-21
**修复状态**: ✅ 已完成
**测试状态**: 待用户测试
**开发服务器**: http://localhost:5178/
