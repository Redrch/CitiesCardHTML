# 非战斗城市技能修复报告

**修复时间**: 2026-01-01
**修复版本**: Vue在线版本
**相关技能**: 济宁市(孔孟故里)、舟山市(舟山海鲜)

---

## 问题总结

用户反馈了两个主要问题：

### 问题1：围观者无法看到出战城市和已知城市
**症状**: 围观者只能看到基本游戏状态，无法看到双方当前回合确认出战的城市和双方的已知城市

**根本原因**: `WaitingRoom.vue`围观者视图缺少出战城市和已知城市的显示

**修复方案**: ✅ 已修复
- 在围观者视图中添加"出战城市"板块
- 在围观者视图中添加"已知城市"板块
- 显示每个城市的当前HP
- 使用可滚动列表支持多个城市显示

**修改文件**:
- `/Users/north/CascadeProjects/2048/citycard-vue/src/components/Room/WaitingRoom.vue` (行93-142)

---

### 问题2：济宁市和舟山市技能无法选择目标城市
**症状**:
1. 济宁市和舟山市的技能只是自动选择前N个城市，玩家无法自主选择
2. 这些技能属于非战斗技能，应该可以在不出战的情况下使用
3. 济宁市技能日志显示"淄博烧烤"而非"孔孟故里"

**根本原因**:
1. 城市技能handlers直接auto-select城市，没有提供选择机制
2. 没有UI支持多城市选择
3. 济宁市skill handler错误调用了淄博市handler

**修复方案**: ✅ 已修复

#### 修复内容

**1. 修复济宁市技能日志错误**
- 将`handleJiningSkill`从调用`handleZiboSkill`改为独立实现
- 正确显示"孔孟故里"技能名称

**2. 添加多城市选择支持**
- 更新`济宁市`和`舟山市`元数据，添加`requiresMultipleSelfCities: true`和`category: 'nonBattle'`
- 修改`handleJiningSkill`和`handleZhoushanSkill`接受可选的`selectedCityIndices`参数
- 保留向后兼容：不传参数时仍使用自动选择逻辑

**3. 实现非战斗技能UI**
- 在`SkillSelector.vue`中添加多城市选择UI组件
- 玩家可通过复选框选择指定数量的城市
- 自动验证HP要求（舟山海鲜：HP≤20000）
- 实时显示选择进度（例如：2/2, 3/3）

**4. 集成到技能系统**
- 导入城市技能handlers到`SkillSelector.vue`
- 添加`executeCitySkill`包装函数
- 在`SKILL_EXECUTOR_MAP`中注册"孔孟故里"和"舟山海鲜"
- 更新`canExecuteSkill`验证逻辑

**5. 添加CSS样式**
- 城市选择列表样式
- 选中状态高亮
- 禁用状态灰显
- 响应式布局

---

## 修改文件清单

### 1. `/src/data/citySkills.js`
**修改内容**:
- 济宁市：添加`category: 'nonBattle'`和`requiresMultipleSelfCities: true`
- 舟山市：添加`category: 'nonBattle'`和`requiresMultipleSelfCities: true`

**代码示例**:
```javascript
'济宁市': {
  name: '孔孟故里',
  description: '限2次，给己方2座城市+1000HP',
  type: SKILL_TYPE.ACTIVE,
  limit: 2,
  healAmount: 1000,
  targetCount: 2,
  category: 'nonBattle',  // 非战斗技能
  requiresMultipleSelfCities: true  // 需要选择多个己方城市
}
```

### 2. `/src/composables/citySkills/shandong.js`
**修改内容**:
- `handleJiningSkill`：添加`selectedCityIndices`可选参数
- 支持玩家选择特定城市或自动选择
- 修复日志显示为"孔孟故里"而非"淄博烧烤"
- 改进日志显示城市名称列表

**代码示例**:
```javascript
export function handleJiningSkill(attacker, skillData, addPublicLog, gameStore, selectedCityIndices = null) {
  let citiesToHeal

  if (selectedCityIndices && Array.isArray(selectedCityIndices)) {
    // 使用玩家选择的城市
    citiesToHeal = selectedCityIndices.map(idx => attacker.cities[idx]).filter(Boolean)
  } else {
    // 默认行为：自动选择前2个存活城市
    const aliveCities = getAliveCities(attacker)
    citiesToHeal = aliveCities.slice(0, 2)
  }

  citiesToHeal.forEach(city => {
    healCity(city, 1000)
  })

  const cityNames = citiesToHeal.map(c => c.name).join('、')
  addPublicLog(`${attacker.name}的${skillData.cityName}激活"孔孟故里"，${cityNames}恢复1000HP！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
```

### 3. `/src/composables/citySkills/zhejiang.js`
**修改内容**:
- `handleZhoushanSkill`：添加`selectedCityIndices`可选参数
- 支持玩家选择特定城市或自动选择
- 改进日志显示城市名称列表

**代码示例**:
```javascript
export function handleZhoushanSkill(attacker, skillData, addPublicLog, gameStore, selectedCityIndices = null) {
  let citiesToBoost

  if (selectedCityIndices && Array.isArray(selectedCityIndices)) {
    // 使用玩家选择的城市
    citiesToBoost = selectedCityIndices.map(idx => attacker.cities[idx]).filter(Boolean)
  } else {
    // 默认行为：自动选择前3个符合条件的城市
    const eligibleCities = getEligibleCitiesByHp(attacker, 20000)
    citiesToBoost = eligibleCities.slice(0, 3)
  }

  citiesToBoost.forEach(city => {
    boostCityHp(city, 1.2)
  })

  const cityNames = citiesToBoost.map(c => c.name).join('、')
  addPublicLog(`${attacker.name}的${skillData.cityName}激活"舟山海鲜"，${cityNames}HP增加20%！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
```

### 4. `/src/components/Skills/SkillSelector.vue`
**修改内容**:
- **Imports**: 导入`handleJiningSkill`和`handleZhoushanSkill`
- **State**: 添加`selectedSelfCities` ref
- **Template**: 添加多城市选择UI (lines 95-124)
- **Functions**:
  - `toggleCitySelection()` - 切换城市选择状态
  - `canSelectCity()` - 验证城市是否可选（检查isAlive和HP要求）
  - `executeCitySkill()` - 包装城市技能执行
- **Validation**: 更新`canExecuteSkill()`检查`requiresMultipleSelfCities`
- **Executor Map**: 添加'孔孟故里'和'舟山海鲜'条目
- **Metadata**: 添加技能元数据
- **CSS**: 添加多城市选择样式

**UI组件代码**:
```vue
<div v-if="selectedSkill.requiresMultipleSelfCities" class="param-group">
  <label>选择己方城市（{{ selectedSelfCities.length }} / {{ selectedSkill.targetCount }}）:</label>
  <div class="city-multi-select">
    <div
      v-for="(city, idx) in props.currentPlayer.cities"
      :key="idx"
      :class="[
        'city-checkbox-item',
        {
          'selected': selectedSelfCities.includes(idx),
          'disabled': !canSelectCity(city, idx)
        }
      ]"
      @click="toggleCitySelection(idx, city)"
    >
      <input
        type="checkbox"
        :checked="selectedSelfCities.includes(idx)"
        :disabled="!canSelectCity(city, idx)"
        @click.stop="toggleCitySelection(idx, city)"
      />
      <span class="city-checkbox-label">
        {{ city.name }} (HP: {{ Math.floor(city.currentHp || city.hp) }})
      </span>
    </div>
  </div>
  <div v-if="selectedSkill.targetCount && selectedSelfCities.length < selectedSkill.targetCount" class="hint-text">
    请选择 {{ selectedSkill.targetCount }} 个城市
  </div>
</div>
```

### 5. `/src/components/Room/WaitingRoom.vue`
**修改内容**:
- 添加"出战城市"显示板块（lines 110-124）
- 添加"已知城市"显示板块（lines 127-141）
- 显示每个城市的名称和当前HP
- 使用可滚动列表（max-height: 120px）

**代码示例**:
```vue
<!-- 当前出战城市 -->
<div v-if="roomData.gameState.playerStates && roomData.gameState.playerStates[player.name]" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #374151;">
  <div style="font-size: 12px; color: #60a5fa; margin-bottom: 5px; font-weight: bold;">
    ⚔️ 出战城市
  </div>
  <div v-if="roomData.gameState.playerStates[player.name].currentBattleCities && roomData.gameState.playerStates[player.name].currentBattleCities.length > 0" style="font-size: 12px; color: #e5e7eb;">
    <div v-for="battleCity in roomData.gameState.playerStates[player.name].currentBattleCities" :key="battleCity.cityIdx" style="margin: 3px 0;">
      • {{ player.cities[battleCity.cityIdx]?.name || '未知' }}
      <span style="color: #fbbf24;">(HP: {{ Math.floor(player.cities[battleCity.cityIdx]?.currentHp || player.cities[battleCity.cityIdx]?.hp || 0) }})</span>
    </div>
  </div>
</div>

<!-- 已知城市 -->
<div v-if="player.cities" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #374151;">
  <div style="font-size: 12px; color: #60a5fa; margin-bottom: 5px; font-weight: bold;">
    🔍 已知城市
  </div>
  <div style="max-height: 120px; overflow-y: auto; font-size: 12px;">
    <div v-for="(city, idx) in player.cities.filter(c => !c.isUnknown && c.isAlive !== false)" :key="idx" style="color: #10b981; margin: 2px 0;">
      • {{ city.name }}
      <span style="color: #fbbf24;">(HP: {{ Math.floor(city.currentHp || city.hp || 0) }})</span>
    </div>
  </div>
</div>
```

### 6. `/src/stores/gameStore.js`
**修改内容**:
- `addLog`函数：修改timestamp从`new Date().toLocaleTimeString()`改为`Date.now()`
- `addPrivateLog`函数：修改timestamp从`new Date().toLocaleTimeString()`改为`Date.now()`
- 修复日志时间戳显示"NaN:NaN:NaN"问题

---

## 使用方法

### 对于玩家

**使用非战斗城市技能（济宁市/舟山市）**:

1. **打开非战斗技能选择器**
   - 在城市部署界面，点击"✨ 使用非战斗金币技能"按钮

2. **选择技能**
   - 找到并点击"孔孟故里"（济宁市）或"舟山海鲜"（舟山市）
   - 技能卡片会显示"给己方2座城市+1000HP"或"给己方3座城市HP增加20%"

3. **选择目标城市**
   - 多城市选择UI会自动显示
   - 显示进度：例如"选择己方城市（0 / 2）"
   - 点击城市复选框进行选择
   - 只能选择符合条件的城市：
     - 济宁市：所有存活城市
     - 舟山市：HP≤20000的存活城市

4. **确认使用**
   - 选够指定数量的城市后，"使用技能"按钮会启用
   - 点击"使用技能"执行

5. **查看效果**
   - 战斗日志会显示：
     - `玩家A的济宁市激活"孔孟故里"，北京市、上海市恢复1000HP！`
     - `玩家B的舟山市激活"舟山海鲜"，广州市、深圳市、成都市HP增加20%！`

### 对于围观者

**查看游戏进度**:

1. **加入围观**
   - 输入房间号，选择"加入围观"

2. **游戏进行中显示**
   - 当前回合数
   - 每个玩家的：
     - 金币数量
     - 存活城市数 / 总城市数
     - **出战城市**（本回合正在战斗的城市及其HP）
     - **已知城市**（所有已知且存活的城市及其HP）

3. **查看详细战况**
   - 点击右下角的日志按钮查看完整战斗日志

---

## 技术亮点

### 1. 向后兼容设计
```javascript
export function handleJiningSkill(attacker, skillData, addPublicLog, gameStore, selectedCityIndices = null) {
  if (selectedCityIndices && Array.isArray(selectedCityIndices)) {
    // 新逻辑：使用玩家选择
  } else {
    // 旧逻辑：自动选择（向后兼容）
  }
}
```

### 2. 灵活的城市选择验证
```javascript
function canSelectCity(city, cityIdx) {
  if (!city) return false
  if (city.isAlive === false) return false

  // 动态HP需求检查
  if (selectedSkill.value.hpRequirement) {
    const currentHp = city.currentHp || city.hp || 0
    if (selectedSkill.value.hpRequirement.max && currentHp > selectedSkill.value.hpRequirement.max) {
      return false
    }
  }

  return true
}
```

### 3. 实时选择进度显示
```vue
<label>选择己方城市（{{ selectedSelfCities.length }} / {{ selectedSkill.targetCount }}）:</label>
```

### 4. 改进的日志输出
```javascript
const cityNames = citiesToHeal.map(c => c.name).join('、')
addPublicLog(`${attacker.name}的${skillData.cityName}激活"孔孟故里"，${cityNames}恢复1000HP！`)
// 输出: 玩家A的济宁市激活"孔孟故里"，北京市、上海市恢复1000HP！
```

---

## 测试步骤

### 测试1：济宁市技能选择

1. 启动游戏并抽取包含济宁市的城市池
2. 在城市部署界面，点击"✨ 使用非战斗金币技能"
3. 选择"孔孟故里"技能
4. **验证**：
   - 出现多城市选择UI
   - 显示"选择己方城市（0 / 2）"
   - 所有存活城市可选
   - 已阵亡城市灰显禁用
5. 选择2个城市
6. 点击"使用技能"
7. **验证**：
   - 战斗日志显示"孔孟故里"（不是"淄博烧烤"）
   - 显示被治疗的城市名称
   - 选中的城市HP+1000

### 测试2：舟山市技能选择

1. 抽取包含舟山市的城市池
2. 确保至少3个城市HP≤20000
3. 打开非战斗技能选择器
4. 选择"舟山海鲜"技能
5. **验证**：
   - 出现多城市选择UI
   - 显示"选择己方城市（0 / 3）"
   - 只有HP≤20000的城市可选
   - HP>20000的城市灰显禁用
6. 选择3个符合条件的城市
7. 点击"使用技能"
8. **验证**：
   - 战斗日志显示"舟山海鲜"和城市名称列表
   - 选中的城市HP增加20%

### 测试3：围观者视图

1. 创建房间，玩家A加入战斗
2. 玩家B在另一浏览器/标签页加入围观
3. 玩家A开始游戏并部署城市
4. **验证玩家B围观视图**：
   - 显示当前回合数
   - 显示玩家A的金币
   - 显示"⚔️ 出战城市"板块
   - 显示玩家A出战的城市名称和HP
   - 显示"🔍 已知城市"板块
   - 显示所有已知城市的名称和HP
5. 玩家A使用技能攻击后
6. **验证玩家B围观视图**：
   - HP实时更新
   - 城市阵亡后从已知城市列表消失

### 测试4：时间戳修复

1. 使用任意技能
2. 打开战斗日志
3. **验证**：
   - 时间戳正确显示为"HH:MM:SS"格式
   - 不再显示"NaN:NaN:NaN"

---

## 已知限制和后续改进

### 当前限制

1. **只有济宁市和舟山市支持多城市选择**
   - 其他类似技能（如宁波港、绍兴市）仍使用自动选择

2. **城市选择UI只在非战斗技能选择器中可用**
   - 在城市部署界面激活城市技能时仍使用旧的checkbox方式

### 后续改进计划

1. ⏳ **扩展到更多城市技能**
   - 宁波市（3座城市+3000HP）
   - 绍兴市（2座城市HP+40%）
   - 其他具有"给N座城市"效果的技能

2. ⏳ **统一城市技能激活方式**
   - 在城市部署界面也支持选择目标城市
   - 统一战斗技能和非战斗技能的UI体验

3. ⏳ **增强围观者功能**
   - 实时战斗动画
   - 技能效果可视化
   - 完整的技能使用历史

4. ⏳ **性能优化**
   - 大量城市时的选择列表虚拟滚动
   - 城市状态缓存

---

## 相关文档

- **围观模式修复**: `SPECTATOR_MODE_FIX.md`
- **城市技能进度**: `src/composables/citySkills/PROGRESS.md`
- **浏览器缓存清理**: `CLEAR_CACHE.md`
- **战斗模式修复**: `BATTLE_MODE_FIX.md`

---

**修复完成时间**: 2026-01-01
**验证状态**: 待用户测试
**后续跟踪**: 需要用户反馈测试结果
