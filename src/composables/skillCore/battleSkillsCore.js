/**
 * 战斗金币技能 - 核心逻辑层
 * Core Layer for Battle Gold Skills
 *
 * 设计原则：
 * 1. 纯函数 - 无副作用，易于测试
 * 2. 参数化 - 所有依赖通过参数传入
 * 3. 模式无关 - 不包含任何UI或模式特定逻辑
 * 4. 标准返回 - 统一返回 { success: boolean, message: string, data?: any }
 */

/**
 * 擒贼擒王 - 核心逻辑
 * 本轮优先攻击对手血量最高的城市
 *
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者玩家对象
 * @param {Object} params.target - 目标玩家对象
 * @param {Object} params.gameStore - 游戏状态存储
 * @returns {Object} { success: boolean, message: string }
 */
export function executeQinZeiQinWangCore(params) {
  const { caster, target, gameStore } = params

  // 前置检查：金币检查
  const cost = 2
  if (caster.gold < cost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${cost}，当前${caster.gold}）`
    }
  }

  // 执行技能效果
  caster.gold -= cost

  // 添加战斗modifier
  if (!caster.battleModifiers) caster.battleModifiers = []

  caster.battleModifiers.push({
    type: 'attack_priority',
    value: 'highest_hp',
    duration: 1
  })

  gameStore.addLog(`${caster.name} 使用了擒贼擒王，本轮优先攻击对手血量最高的城市`)

  return {
    success: true,
    message: '本轮战斗将优先攻击血量最高的城市',
    data: {
      modifier: 'attack_priority',
      target: 'highest_hp'
    }
  }
}

/**
 * 草木皆兵 - 核心逻辑
 * 对手本轮伤害减半
 *
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者玩家对象
 * @param {Object} params.target - 目标玩家对象
 * @param {Object} params.gameStore - 游戏状态存储
 * @returns {Object} { success: boolean, message: string }
 */
export function executeCaoMuJieBingCore(params) {
  const { caster, target, gameStore } = params

  // 前置检查：金币检查
  const cost = 2
  if (caster.gold < cost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${cost}，当前${caster.gold}）`
    }
  }

  // 执行技能效果
  caster.gold -= cost

  // 添加战斗modifier到目标玩家
  if (!target.battleModifiers) target.battleModifiers = []

  target.battleModifiers.push({
    type: 'damage_reduction',
    value: 0.5,
    duration: 1,
    source: caster.name
  })

  gameStore.addLog(`${caster.name} 对 ${target.name} 使用了草木皆兵，本轮伤害减半`)

  return {
    success: true,
    message: `对 ${target.name} 造成的伤害本轮减半`,
    data: {
      target: target.name,
      reductionRate: 0.5
    }
  }
}

/**
 * 越战越勇 - 核心逻辑
 * 指定城市本轮不受疲劳影响
 *
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者玩家对象
 * @param {string} params.cityName - 城市名称
 * @param {Object} params.gameStore - 游戏状态存储
 * @returns {Object} { success: boolean, message: string }
 */
export function executeYueZhanYueYongCore(params) {
  const { caster, cityName, gameStore } = params

  // 前置检查1：城市有效性
  const city = caster.cities[cityName]
  if (!city) {
    return { success: false, message: '城市不存在' }
  }

  // 前置检查2：金币检查
  const cost = 2
  if (caster.gold < cost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${cost}，当前${caster.gold}）`
    }
  }

  // 执行技能效果
  caster.gold -= cost

  // 添加忽略疲劳modifier到城市
  city.modifiers = city.modifiers || []
  city.modifiers.push({
    type: 'ignore_fatigue',
    duration: 1
  })

  gameStore.addLog(`${caster.name} 对 ${city.name} 使用了越战越勇，本轮不受疲劳影响`)

  return {
    success: true,
    message: `${city.name} 本轮战斗力不受疲劳影响`,
    data: {
      cityName: city.name
    }
  }
}

/**
 * 铜墙铁壁 - 核心逻辑
 * 对手本轮伤害完全无效
 *
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者玩家对象
 * @param {Object} params.target - 目标玩家对象
 * @param {Object} params.gameStore - 游戏状态存储
 * @returns {Object} { success: boolean, message: string }
 */
export function executeTongQiangTieBiCore(params) {
  const { caster, target, gameStore } = params

  // 前置检查1：坚不可摧护盾检查
  if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '铜墙铁壁')) {
    return {
      success: false,
      message: `被${target.name}的坚不可摧护盾阻挡`
    }
  }

  // 前置检查2：金币检查
  const cost = 5
  if (caster.gold < cost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${cost}，当前${caster.gold}）`
    }
  }

  // 执行技能效果
  caster.gold -= cost

  // 添加伤害免疫modifier到目标玩家
  if (!target.battleModifiers) target.battleModifiers = []

  target.battleModifiers.push({
    type: 'damage_immunity',
    duration: 1,
    source: caster.name
  })

  gameStore.addLog(`${caster.name} 对 ${target.name} 使用了铜墙铁壁，本轮完全免疫伤害`)

  return {
    success: true,
    message: `本轮对 ${target.name} 的伤害完全无效`,
    data: {
      target: target.name
    }
  }
}

/**
 * 设置屏障 - 核心逻辑
 * 创建25000HP的屏障，持续5回合
 *
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者玩家对象
 * @param {Object} params.gameStore - 游戏状态存储
 * @returns {Object} { success: boolean, message: string }
 */
export function executeSetBarrierCore(params) {
  const { caster, gameStore } = params

  // 前置检查：金币检查
  const cost = 15
  if (caster.gold < cost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${cost}，当前${caster.gold}）`
    }
  }

  // 执行技能效果
  caster.gold -= cost

  // 创建屏障
  gameStore.barrier[caster.name] = {
    hp: 25000,
    maxHp: 25000,
    roundsLeft: 5
  }

  gameStore.addLog(`${caster.name} 设置了屏障（25000HP，持续5回合）`)

  return {
    success: true,
    message: '设置了25000HP的屏障，持续5回合',
    data: {
      hp: 25000,
      maxHp: 25000,
      rounds: 5
    }
  }
}

/**
 * 潜能激发 - 核心逻辑
 * 所有城市HP翻倍（上限100000）
 *
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者玩家对象
 * @param {Object} params.gameStore - 游戏状态存储
 * @returns {Object} { success: boolean, message: string }
 */
export function executeQianNengJiFaCore(params) {
  const { caster, gameStore } = params

  // 前置检查：金币检查
  const cost = 20
  if (caster.gold < cost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${cost}，当前${caster.gold}）`
    }
  }

  // 执行技能效果
  caster.gold -= cost

  let count = 0
  const affectedCities = []

  Object.values(caster.cities).forEach(city => {
    if (city.isAlive !== false) {
      const currentHp = city.currentHp || city.hp
      const newHp = Math.min(currentHp * 2, 100000)
      city.currentHp = newHp
      count++
      affectedCities.push({
        name: city.name,
        oldHp: currentHp,
        newHp: newHp
      })
    }
  })

  gameStore.addLog(`${caster.name} 使用了潜能激发，${count}个城市HP翻倍`)

  return {
    success: true,
    message: `所有预备城市HP翻倍（上限100000）`,
    data: {
      count: count,
      cities: affectedCities
    }
  }
}

/**
 * 御驾亲征 - 核心逻辑
 * 中心城市出战，直接摧毁对方最高HP城市
 *
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者玩家对象
 * @param {Object} params.target - 目标玩家对象
 * @param {Object} params.gameStore - 游戏状态存储
 * @returns {Object} { success: boolean, message: string }
 */
export function executeYuJiaQinZhengCore(params) {
  const { caster, target, gameStore } = params

  // 前置检查1：坚不可摧护盾检查
  if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '御驾亲征')) {
    return {
      success: false,
      message: `被${target.name}的坚不可摧护盾阻挡`
    }
  }

  // 前置检查2：金币检查
  const cost = 8
  if (caster.gold < cost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${cost}，当前${caster.gold}）`
    }
  }

  // 前置检查3：中心城市检查
  const centerCityName = caster.centerCityName
  const centerCity = centerCityName ? caster.cities[centerCityName] : null
  if (!centerCity) {
    return { success: false, message: '没有中心城市' }
  }

  // 前置检查4：目标城市检查
  const targetCities = Object.values(target.cities).filter(c =>
    c.isAlive !== false && c.name !== target.centerCityName
  )
  if (targetCities.length === 0) {
    return { success: false, message: '对手没有可摧毁的城市' }
  }

  // 找到血量最高的城市
  const highestHpCity = targetCities.reduce((max, city) =>
    (city.currentHp || city.hp) > (max.currentHp || max.hp) ? city : max
  )

  // 获取城市名称
  const cityName = highestHpCity.name

  // 检查并消耗保护罩/钢铁护盾
  if (gameStore.consumeProtection(target.name, cityName)) {
    caster.gold -= cost // 即使被护盾抵消也要扣金币
    gameStore.addLog(`${caster.name}御驾亲征，击破了${target.name}的${highestHpCity.name}的护盾`)
    return {
      success: true,
      message: `击破了${highestHpCity.name}的护盾`
    }
  }

  // 执行技能效果
  caster.gold -= cost

  // 摧毁城市
  highestHpCity.isAlive = false
  highestHpCity.currentHp = 0

  // 添加到deadCities列表（使用城市名称）
  if (!gameStore.deadCities[target.name]) {
    gameStore.deadCities[target.name] = []
  }
  if (!gameStore.deadCities[target.name].includes(cityName)) {
    gameStore.deadCities[target.name].push(cityName)
  }

  gameStore.addLog(`${caster.name}御驾亲征，摧毁了${target.name}的${highestHpCity.name}`)

  return {
    success: true,
    message: `中心城市出战，摧毁了${highestHpCity.name}`,
    data: {
      destroyedCity: highestHpCity.name
    }
  }
}
