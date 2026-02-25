# 城市专属技能系统架构文档

## 📁 文件结构

```
src/composables/
├── citySkills/
│   ├── index.js              # 主入口，技能处理器映射
│   ├── skillHelpers.js       # 共享辅助函数
│   ├── municipalities.js     # 直辖市技能（北京、天津、重庆、上海、香港、澳门）
│   ├── jiangsu.js           # 江苏省技能（13个城市）
│   ├── zhejiang.js          # 浙江省技能（11个城市）
│   ├── shandong.js          # 山东省技能（16个城市）
│   ├── hubei.js             # 湖北省技能（17个城市）
│   └── guangdong.js         # 广东省技能（21个城市）
└── useCitySkillEffects.js   # 统一对外接口

待添加省份：
├── hebei.js                  # 河北省
├── shanxi.js                 # 山西省
├── neimenggu.js             # 内蒙古
├── liaoning.js              # 辽宁省
├── jilin.js                 # 吉林省
├── heilongjiang.js          # 黑龙江省
├── anhui.js                 # 安徽省
├── fujian.js                # 福建省
├── jiangxi.js               # 江西省
├── henan.js                 # 河南省
├── hunan.js                 # 湖南省
├── guangxi.js               # 广西壮族自治区
├── hainan.js                # 海南省
├── sichuan.js               # 四川省
├── guizhou.js               # 贵州省
├── yunnan.js                # 云南省
├── xizang.js                # 西藏自治区
├── shaanxi.js               # 陕西省
├── gansu.js                 # 甘肃省
├── qinghai.js               # 青海省
├── ningxia.js               # 宁夏回族自治区
└── xinjiang.js              # 新疆维吾尔自治区
```

## 🎯 设计原则

### 1. 模块化
- 每个省份的技能独立在一个文件中
- 便于维护和扩展
- 避免单个文件过长（原文件已超过1400行）

### 2. 可复用性
- 所有通用函数提取到 `skillHelpers.js`
- 避免重复代码
- 提高代码质量

### 3. 清晰的接口
- `useCitySkillEffects.js` 作为统一对外接口
- 其他模块不需要了解内部实现细节
- 便于测试和调试

## 📝 技能实现指南

### 添加新技能的步骤

1. **确定技能所属省份**
   - 直辖市 → `municipalities.js`
   - 江苏省 → `jiangsu.js`
   - 其他省份 → 创建对应文件

2. **在省份文件中实现技能函数**

```javascript
/**
 * 城市名 - 技能名
 * 技能描述
 */
export function handle城市Skill(attacker, skillData, addPublicLog, gameStore) {
  // 使用辅助函数
  const aliveCities = getAliveCities(attacker)

  // 实现技能逻辑
  // ...

  // 记录日志
  addPublicLog(`${attacker.name}的${skillData.cityName}激活"技能名"...`)

  // 记录使用次数
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
```

3. **在 `index.js` 中注册技能**

```javascript
const SKILL_HANDLERS = {
  // ...
  '技能名': provinceName.handle城市Skill,
  // ...
}
```

4. **更新 `useCitySkillEffects.js` 的限制映射**

```javascript
const limitMap = {
  // ...
  '技能名': 1,  // 使用次数限制
  // ...
}
```

### 技能函数签名

根据技能类型，函数签名有所不同：

**基础签名**（大部分技能）：
```javascript
function handleSkill(attacker, skillData, addPublicLog, gameStore)
```

**需要防守方信息**（攻击类技能）：
```javascript
function handleSkill(attacker, defender, skillData, addPublicLog, gameStore)
```

**需要防守方出战城市**（群体攻击技能）：
```javascript
function handleSkill(attacker, defender, defenderCities, skillData, addPublicLog, gameStore)
```

## 🛠️ 共享辅助函数

`skillHelpers.js` 提供了以下常用函数：

### 城市查询
- `getAliveCities(player)` - 获取存活城市
- `getEligibleCitiesByHp(player, maxHp, minHp)` - 获取符合HP条件的城市
- `sortCitiesByHp(cities)` - 按HP排序
- `findCity(player, cityName)` - 查找特定城市
- `getCityName(player, cityOrName)` - 获取城市名称

### HP操作
- `getCurrentHp(city)` - 获取当前HP
- `healCity(city, amount)` - 治疗城市
- `damageCity(city, amount)` - 伤害城市
- `boostCityHp(city, multiplier)` - 增加HP倍数

### 复杂系统
- `addShield(gameStore, playerName, cityName, config)` - 添加护盾
- `banCity(gameStore, playerName, cityName, rounds, options)` - 禁止出战
- `addDelayedEffect(gameStore, playerName, cityName, config)` - 添加延迟效果

## 🔄 已实现的复杂系统

### 1. 护盾系统
**数据结构**：
```javascript
gameStore.shields[playerName][cityName] = {
  hp: 10000,              // 护盾HP
  maxHp: 10000,           // 最大护盾HP
  roundsLeft: 3,          // 剩余回合（-1=永久）
  appliedRound: 5,        // 应用回合
  canConvertToPermanent: false  // 可转永久
}
```

**使用示例**：
```javascript
addShield(gameStore, attacker.name, cityName, {
  hp: 10000,
  roundsLeft: 3
})
```

### 2. 禁止出战系统
**数据结构**：
```javascript
gameStore.bannedCities[playerName][cityName] = {
  roundsLeft: 2,          // 剩余回合
  fullHealOnReturn: true, // 返回时满血
  originalHp: 5000        // 原始HP
}
```

**使用示例**：
```javascript
banCity(gameStore, attacker.name, cityName, 2, {
  fullHealOnReturn: true,
  originalHp: getCurrentHp(city)
})
```

### 3. 延迟效果系统
**数据结构**：
```javascript
gameStore.delayedEffects[playerName][cityName] = {
  type: 'penglai',        // 效果类型
  effectRoundsLeft: 2,    // 剩余回合
  effectData: {
    hpMultiplier: 2,      // HP倍数
    shieldHp: 8000,       // 护盾HP
    appliedRound: 5       // 应用回合
  }
}
```

**使用示例**：
```javascript
addDelayedEffect(gameStore, attacker.name, cityName, {
  type: 'penglai',
  roundsLeft: 2,
  data: {
    hpMultiplier: 2,
    shieldHp: 8000
  }
})
```

## 📊 已实现技能统计

| 省份/地区 | 已实现 | 待实现 | 总计 |
|----------|--------|--------|------|
| 直辖市   | 1      | 5      | 6    |
| 江苏省   | 9      | 4      | 13   |
| 浙江省   | 4      | 7      | 11   |
| 山东省   | 10     | 6      | 16   |
| 湖北省   | 11     | 6      | 17   |
| 广东省   | 21     | 0      | 21   |
| **总计** | **56** | **28** | **84** |

## 🚀 下一步计划

1. **完善已实现省份的TODO项**
   - 实现复杂技能逻辑
   - 添加技能组合效果

2. **添加新省份**
   - 创建对应省份文件
   - 实现该省份所有城市技能

3. **优化系统**
   - 完善护盾系统的优先级处理
   - 实现技能连锁反应
   - 添加技能动画效果

4. **测试与调优**
   - 单元测试
   - 集成测试
   - 性能优化

## 💡 开发建议

1. **命名规范**
   - 函数名：`handle[城市名]Skill`
   - 常量名：大写下划线分隔
   - 变量名：小驼峰命名

2. **注释要求**
   - 每个技能函数必须有JSDoc注释
   - 复杂逻辑添加行内注释
   - 使用次数限制在注释中说明

3. **错误处理**
   - 检查城市是否存在
   - 验证HP条件
   - 捕获异常并记录日志

4. **日志规范**
   - 使用统一的日志格式
   - 包含玩家名、城市名、技能名
   - 显示关键数值变化

## 📞 联系方式

如有问题或建议，请查看项目文档或联系开发团队。
