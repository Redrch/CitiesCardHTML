# 技能简化分析和修正计划

## 🔴 最严重问题：所有技能缺少金币系统！

### ⚠️ 紧急发现 (2025-12-28更新)
**当前实现中，几乎所有技能都缺少金币检查和扣除！**

对比原版发现：
- ✅ 原版：每个技能都有 `if(gold < cost)` 检查
- ✅ 原版：每个技能都有 `player.gold -= cost` 扣除
- ❌ 当前：几乎所有技能都**完全没有**金币相关代码

**影响**: 玩家可以无限免费使用所有技能，完全破坏游戏平衡！

### 示例对比

**城市保护 (原版 vs 当前)**:
```javascript
// 原版 (citycard_web.html:11941-11948)
if((state.players[p].gold||0) < 3) {
  log(`金币不足（需要3）`);
  return false;
}
state.players[p].gold -= 3;

// 当前 (nonBattleSkills.js:148-171)
// ❌ 完全没有金币检查和扣除！
```

**受影响技能**:
- 城市保护 (3金币)
- 钢铁城市 (5金币)
- 快速治疗 (3金币)
- 实力增强 (5金币)
- 借尸还魂 (6金币)
- 士气大振 (8金币)
- 清除加成 (6金币)
- ...可能还有更多

**修复优先级**: 🔴🔴🔴 最高紧急

---

## 🚨 严重简化的技能（需要完全重写）

### 1. **时来运转** (executeShiLaiYunZhuan)
**当前实现**: 简单随机交换3个城市
**原版逻辑**:
- 检查双方城市数≥5
- 排除谨慎交换集合 (isInCautiousSet)
- 李代桃僵确认流程 (pendingFortuneSwap)
- 坚不可摧护盾检查 (isBlockedByJianbukecuiPlayerMode)
- 双方确认后才执行交换
- 记录lastSkillUsed用于无懈可击

**需要添加**:
- gameState.cautiousExchange 集合
- gameState.pendingFortuneSwap 待处理交换
- gameState.ldtj 李代桃僵状态
- gameState.jianbukecui 护盾状态
- isInCautiousSet() 辅助函数
- isBlockedByJianbukecuiPlayerMode() 辅助函数

### 2. **先声夺人** (executeXianShengDuoRen)
**当前实现**: 随机选择城市交换
**原版逻辑**:
- 使用模态框双方自选城市
- 排除中心城市(2P/2v2)、定海神针城市、钢铁城市、阵亡城市
- 李代桃僵确认流程
- 完整的双方确认机制

**需要添加**:
- gameState.anchored 定海神针城市集合
- gameState.ironCities 钢铁城市集合
- 模态框选择UI组件

### 3. **无中生有** (executeWuZhongShengYou)
**当前实现**: 创建随机假城市
**原版逻辑**:
- 从ALL_CITIES筛选未使用城市
- 维护usedCities集合
- 同步到initialCities
- 城市数≤5时自动加入roster

**需要添加**:
- gameState.usedCities 已使用城市集合
- gameState.initialCities 初始城市列表
- 从真实城市池抽取逻辑

### 4. **苟延残喘** (executeGouYanCanChuan)
**当前实现**: 创建假的小血量城市
**原版逻辑**:
- 从未使用城市池抽取HP<1000城市
- 同步到initialCities
- 自动加入roster逻辑

**需要修正**: 从真实ALL_CITIES中筛选抽取

### 5. **好高骛远** (executeHaoGaoWuYuan)
**当前实现**: 创建随机强化城市
**原版逻辑**:
- 从未使用城市池抽取血量更高的真实城市替换
- 更新initialCities
- 保持原城市的颜色技能等级

**需要修正**: 从真实城市池抽取

### 6. **狐假虎威** (executeHuJiaHuWei)
**当前实现**: 简单伪装
**原版逻辑**:
- 从原始HP≥10000且未使用城市中随机抽取完整伪装数据
- 记录m(初始伪装HP), cur(当前伪装HP), n(真实HP)
- clearCityKnownStatus() 清除已知状态
- paid:false标记(被拆穿时才扣9金币)
- 持续3回合

**需要添加**:
- gameState.disguisedCities 伪装城市数据结构
- gameState.knownCities 已知城市状态
- 完整的m/cur/n三重HP追踪

### 7. **借尸还魂** (executeJieShiHuanHun)
**当前实现**: 简单复活+恢复50%HP
**原版逻辑**:
- 检查pendingPreemptiveStrike避免冲突
- 复活到初始HP的50%(上限5000)
- 清除疲劳指数 fatigueStreaks[cityIdx]=0
- 从deadCities移除
- 总城市数≤5时自动加入roster

**需要添加**:
- gameState.fatigueStreaks 疲劳追踪
- gameState.deadCities 阵亡城市列表
- roster自动加入逻辑

### 8. **高级治疗** (executeGaoJiZhiLiao)
**当前实现**: 设置healing标记，没有真正的2回合返回机制
**原版逻辑**:
- 选择2个战斗预备非满血城市
- 立即从roster移除
- 2回合后满血返回roster
- 设置bannedCities禁用记录

**需要添加**:
- gameState.roster 战斗预备城市
- gameState.bannedCities 禁用城市追踪
- 回合结束时检查healing回合数

### 9. **众志成城** (executeZhongZhiChengCheng)
**当前实现**: 简单HP平均
**原版逻辑**:
- 要求己方城市数≥3
- 选择3-5个城市平均分配HP
- 无额外检查（原版已经比较简单）

**需要修正**: 添加城市数检查

### 10. **降维打击** (executeJiangWeiDaJi)
**当前实现**: 简单HP降为30%+改名
**原版逻辑**:
- 替换为同省份更低等级的真实城市
- 直辖市/香港11金币，其他9金币
- 不能对澳门使用
- 不能对已是省内最低的城市使用
- 从真实城市池抽取

**需要修正**: 完整的同省替换逻辑

## 🔧 缺少的核心GameState属性

根据原版HTML分析，需要在gameStore中添加以下属性：

```javascript
// 城市管理
usedCities: Set(),           // 已使用的城市名称集合
initialCities: {},           // 玩家初始城市列表 [player][idx]
roster: {},                  // 战斗预备城市 [player][idx]
deadCities: {},              // 阵亡城市列表 [player][]

// 技能状态追踪
cautiousExchange: {},        // 谨慎交换集合 [player][]
anchored: {},                // 定海神针城市 [player][idx]
ironCities: {},              // 钢铁城市 [player][idx]: layers
protections: {},             // 城市保护罩 [player][idx]: rounds
disguisedCities: {},         // 伪装城市 [player][idx]: {m, cur, n, paid}
knownCities: {},             // 已知城市 [player][knownBy][]

// 战斗技能标记
qinwang: null,               // 擒贼擒王目标
cmjb: null,                  // 草木皆兵目标
yueyueyong: {},              // 越战越勇城市 [player][idx]
attract: {},                 // 吸引攻击城市 [player]: idx
jilaizan: {},                // 既来则安城市 [player][idx]: {used}
ironwall: null,              // 铜墙铁壁目标
barrier: {},                 // 屏障 [player]: {hp, roundsLeft, team?}
yujia: {},                   // 御驾亲征 {player, target, centerIdx}
foresee: {},                 // 料事如神标记

// 非战斗技能状态
goldLoanRounds: {},          // 金币贷款禁用 [player]: rounds
bannedCities: {},            // 禁用城市 [player][idx]: rounds
fatigueStreaks: {},          // 疲劳指数 [player][idx]
brickJade: {},               // 抛砖引玉 [player][idx]: {rounds, originalHp}
hiddenGrowth: {},            // 深藏不露 [player][idx]: {idleRounds, active}
timeBombs: {},               // 定时爆破 [player][idx]: countdown
cityTrialUsed: {},           // 城市试炼使用记录 [player][idx]
berserkFired: {},            // 狂暴模式使用 [player][idx]: originalHp

// 交互流程
pendingFortuneSwap: null,    // 待处理的时来运转
pendingPreemptiveStrike: null, // 待处理的先声夺人
ldtj: {},                    // 李代桃僵状态 [player]: active

// 护盾系统
jianbukecui: {},             // 坚不可摧护盾 [player]: roundsLeft

// 无懈可击
lastSkillUsed: null,         // {userName, skillName, cost, roundNumber}
gameStateSnapshot: null      // 游戏状态快照
```

## 🔍 需要的辅助函数

### 城市池管理
```javascript
- getUnusedCities()              // 获取未使用城市列表
- markCityAsUsed(cityName)       // 标记城市为已使用
- getCitiesByProvince(province)  // 获取指定省份的所有城市
- getCityByName(cityName)        // 通过名称获取城市数据
```

### 谨慎交换集合
```javascript
- isInCautiousSet(player, cityIdx)        // 检查是否在谨慎交换集合
- addToCautiousSet(player, cityIdx)       // 添加到谨慎交换集合
- removeFromCautiousSet(player, cityIdx)  // 从谨慎交换集合移除
```

### 护盾和保护检查
```javascript
- isBlockedByJianbukecuiPlayerMode(target, attacker, skillName)
- hasProtection(player, cityIdx)
- hasIronShield(player, cityIdx)
- consumeProtection(player, cityIdx)      // 消耗一层保护
```

### 城市状态
```javascript
- isCityKnown(player, cityIdx, knownBy)
- clearCityKnownStatus(player, cityIdx)
- setCityKnown(player, cityIdx, knownBy)
```

### 快照系统
```javascript
- createGameStateSnapshot()               // 创建快照（无懈可击用）
- restoreGameStateSnapshot()              // 恢复快照
```

## 📋 修正优先级

### 第一阶段：核心状态扩展
1. 扩展gameStore添加所有缺失属性
2. 创建城市池管理系统
3. 创建基础辅助函数

### 第二阶段：重写严重简化技能（10个）
1. 时来运转 - 最复杂
2. 先声夺人 - 李代桃僵交互
3. 无中生有 - 城市池抽取
4. 苟延残喘 - 城市池抽取
5. 好高骛远 - 城市池抽取
6. 狐假虎威 - 伪装系统
7. 借尸还魂 - 疲劳+roster
8. 高级治疗 - 回合追踪
9. 降维打击 - 同省替换
10. 众志成城 - 城市数检查

### 第三阶段：完善中等简化技能
- 检查所有已实现技能的护盾/保护检查
- 添加lastSkillUsed记录
- 添加快照系统

### 第四阶段：实现剩余115+技能
- 按原版逻辑完整实现
- 不做任何简化

## 📝 时间估算

- 第一阶段：2-3小时（状态扩展+辅助函数）
- 第二阶段：4-5小时（10个技能重写）
- 第三阶段：2-3小时（完善检查）
- 第四阶段：20-30小时（115+技能）

**总计**: 约28-41小时的开发工作

## ⚠️ 注意事项

1. **不要再简化任何逻辑** - 严格按照原版实现
2. **城市池必须使用ALL_CITIES** - 不创建假城市
3. **所有交互流程必须完整** - 包括李代桃僵、护盾检查等
4. **状态追踪必须准确** - 避免状态不同步
5. **回合结束时更新所有状态** - 冷却、禁用、持续效果等

---

**文档创建时间**: 2025-12-28
**当前进度**: 已分析完成，准备开始修正
