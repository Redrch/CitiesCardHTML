/**
 * 非战斗金币技能 - 核心逻辑层
 * Core Layer for Non-Battle Gold Skills
 *
 * 设计原则：
 * 1. 纯函数 - 无副作用，易于测试
 * 2. 参数化 - 所有依赖通过参数传入
 * 3. 模式无关 - 不包含任何UI或模式特定逻辑
 * 4. 标准返回 - 统一返回 { success: boolean, message: string, data?: any }
 */

/**
 * 城市保护 - 核心逻辑
 *
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者玩家对象
 * @param {string} params.cityName - 要保护的城市名称
 * @param {Object} params.gameStore - 游戏状态存储
 * @param {string} params.gameMode - 游戏模式 ('2P', '3P', '2v2')
 * @returns {Object} { success: boolean, message: string }
 */
export function executeCityProtectionCore(params) {
  const { caster, cityName, gameStore, gameMode } = params

  // 前置检查1：游戏模式检查
  const is2pOr2v2 = gameMode === '2P' || gameMode === '2v2'
  const centerCityName = caster.centerCityName

  if (is2pOr2v2 && cityName === centerCityName) {
    return {
      success: false,
      message: '二人/2v2模式下不能对中心城市进行保护'
    }
  }

  // 前置检查2：城市有效性
  const city = caster.cities[cityName]
  if (!city) {
    return { success: false, message: '城市不存在' }
  }

  // 前置检查3：金币检查
  const cost = 3
  if (caster.gold < cost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${cost}，当前${caster.gold}）`
    }
  }

  // 执行技能效果
  caster.gold -= cost

  // 初始化保护状态
  if (!gameStore.protections[caster.name]) {
    gameStore.protections[caster.name] = {}
  }

  // 设置保护（重置为10轮，不叠加）
  gameStore.protections[caster.name][cityName] = 10

  gameStore.addLog(
    `(城市保护) ${caster.name} 对 ${city.name} 启用保护（10轮）`
  )

  return {
    success: true,
    message: `${city.name} 已获得保护（10轮）`,
    data: {
      cityName: city.name,
      rounds: 10
    }
  }
}

/**
 * 钢铁城市 - 核心逻辑
 *
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者玩家对象
 * @param {string} params.cityName - 要设置的城市名称
 * @param {Object} params.gameStore - 游戏状态存储
 * @returns {Object} { success: boolean, message: string }
 */
export function executeIronCityCore(params) {
  const { caster, cityName, gameStore } = params

  // 前置检查1：城市有效性
  const city = caster.cities[cityName]
  if (!city) {
    return { success: false, message: '城市不存在' }
  }

  // 前置检查2：检查是否已经是钢铁城市
  if (gameStore.ironCities[caster.name] && gameStore.ironCities[caster.name][cityName]) {
    return {
      success: false,
      message: '该城市已经是钢铁城市'
    }
  }

  // 前置检查3：金币检查
  const cost = 5
  if (caster.gold < cost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${cost}，当前${caster.gold}）`
    }
  }

  // 执行技能效果
  caster.gold -= cost

  // 初始化钢铁城市状态
  if (!gameStore.ironCities[caster.name]) {
    gameStore.ironCities[caster.name] = {}
  }

  // 设置为钢铁城市（永久有效）
  gameStore.ironCities[caster.name][cityName] = true

  gameStore.addLog(
    `(钢铁城市) ${caster.name} 将 ${city.name} 设为钢铁城市（永久免疫特定技能）`
  )

  return {
    success: true,
    message: `${city.name} 已成为钢铁城市`,
    data: {
      cityName: city.name
    }
  }
}

/**
 * 先声夺人 - 核心逻辑
 *
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者玩家对象
 * @param {string} params.casterCityName - 施法者选择的城市名称
 * @param {Object} params.target - 目标玩家对象
 * @param {string} params.targetCityName - 目标玩家选择的城市名称
 * @param {Object} params.gameStore - 游戏状态存储
 * @returns {Object} { success: boolean, message: string }
 */
export function executePreemptiveStrikeCore(params) {
  const { caster, casterCityName, target, targetCityName, gameStore } = params

  // 前置检查1：检查是否有待处理的先声夺人请求
  if (gameStore.pendingPreemptiveStrike) {
    return {
      success: false,
      message: '当前有待处理的先声夺人请求，请先完成'
    }
  }

  // 前置检查2：金币检查
  const cost = 1
  if (caster.gold < cost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${cost}，当前${caster.gold}）`
    }
  }

  // 前置检查3：构建可交换城市池（排除：谨慎交换集合、阵亡、中心城市、定海神针、钢铁城市、保护）
  function getEligibleCities(player) {
    const eligible = []
    Object.keys(player.cities).forEach(cityName => {
      const city = player.cities[cityName]

      // 已阵亡不参与
      if (city.isAlive === false) return

      // 谨慎交换集合不参与
      if (gameStore.isInCautiousSet(player.name, cityName)) return

      // 中心城市不参与
      if (cityName === player.centerCityName) return

      // 定海神针不参与
      if (gameStore.anchored[player.name] && gameStore.anchored[player.name][cityName]) return

      // 钢铁城市不参与
      if (gameStore.hasIronShield(player.name, cityName)) return

      // 被保护不参与
      if (gameStore.hasProtection(player.name, cityName)) return

      eligible.push(cityName)
    })
    return eligible
  }

  const eligibleCaster = getEligibleCities(caster)
  const eligibleTarget = getEligibleCities(target)

  // 前置检查4：可交换城市数量检查
  if (eligibleCaster.length === 0 || eligibleTarget.length === 0) {
    return {
      success: false,
      message: '双方至少有一方没有可交换的城市（排除谨慎交换集合）'
    }
  }

  // 前置检查5：验证选择的城市名称有效性
  if (!eligibleCaster.includes(casterCityName)) {
    return {
      success: false,
      message: '发起者选择的城市不可交换'
    }
  }
  if (!eligibleTarget.includes(targetCityName)) {
    return {
      success: false,
      message: '目标玩家选择的城市不可交换'
    }
  }

  // 执行技能效果
  caster.gold -= cost

  const casterCity = caster.cities[casterCityName]
  const targetCity = target.cities[targetCityName]

  // 执行城市交换（对象结构：交换键值对）
  const temp = caster.cities[casterCityName]
  caster.cities[casterCityName] = target.cities[targetCityName]
  target.cities[targetCityName] = temp

  // 交换 initialCities 记录（按城市名称）
  if (gameStore.initialCities) {
    if (!gameStore.initialCities[caster.name]) gameStore.initialCities[caster.name] = {}
    if (!gameStore.initialCities[target.name]) gameStore.initialCities[target.name] = {}

    const tempInitial = gameStore.initialCities[caster.name][casterCityName]
    gameStore.initialCities[caster.name][casterCityName] = gameStore.initialCities[target.name][targetCityName]
    gameStore.initialCities[target.name][targetCityName] = tempInitial
  }

  // 清除被交换城市的狐假虎威伪装状态
  if (gameStore.disguisedCities[caster.name]) {
    delete gameStore.disguisedCities[caster.name][casterCityName]
  }
  if (gameStore.disguisedCities[target.name]) {
    delete gameStore.disguisedCities[target.name][targetCityName]
  }

  // 标记城市为已知
  gameStore.setCityKnown(caster.name, casterCityName, target.name)
  gameStore.setCityKnown(target.name, targetCityName, caster.name)

  gameStore.addLog(
    `${caster.name}对${target.name}使用先声夺人，交换了${casterCity.name}和${targetCity.name}`
  )

  return {
    success: true,
    message: `交换了${casterCity.name}和${targetCity.name}`,
    data: {
      casterCityName: casterCity.name,
      targetCityName: targetCity.name
    }
  }
}

/**
 * 快速治疗 - 核心逻辑
 *
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者玩家对象
 * @param {string} params.cityName - 要治疗的城市名称
 * @param {Object} params.gameStore - 游戏状态存储
 * @returns {Object} { success: boolean, message: string }
 */
export function executeQuickHealCore(params) {
  const { caster, cityName, gameStore } = params

  // 前置检查1：城市有效性
  const city = caster.cities[cityName]
  if (!city) {
    return { success: false, message: '城市不存在' }
  }

  // 前置检查2：城市存活检查
  if (!city.isAlive) {
    return { success: false, message: '城市已阵亡' }
  }

  // 前置检查3：金币检查
  const cost = 3
  if (caster.gold < cost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${cost}，当前${caster.gold}）`
    }
  }

  // 计算恢复量
  const currentHp = city.currentHp || city.hp
  const maxHp = city.hp
  const healed = maxHp - currentHp

  if (healed <= 0) {
    return {
      success: false,
      message: `${city.name} 已经是满血状态`
    }
  }

  // 执行技能效果
  caster.gold -= cost
  city.currentHp = maxHp

  gameStore.addLog(`${caster.name} 对${city.name}使用快速治疗，恢复${healed}HP`)

  return {
    success: true,
    message: `${city.name}恢复至满血（+${healed} HP）`,
    data: {
      cityName: city.name,
      healed: healed
    }
  }
}

/**
 * 转账给他人 - 核心逻辑
 *
 * @param {Object} params - 技能参数
 * @param {Object} params.caster - 施法者玩家对象
 * @param {Object} params.target - 目标玩家对象
 * @param {number} params.amount - 转账金额
 * @param {Object} params.gameStore - 游戏状态存储
 * @returns {Object} { success: boolean, message: string }
 */
export function executeTransferGoldCore(params) {
  const { caster, target, amount, gameStore } = params

  // 前置检查1：金额有效性
  if (!amount || amount <= 0 || !Number.isInteger(amount)) {
    return { success: false, message: '转账金额无效' }
  }

  // 前置检查2：发起者金币检查
  if (caster.gold < amount) {
    return { success: false, message: '金币不足' }
  }

  // 前置检查3：目标方金币上限检查
  if (target.gold + amount > 24) {
    return { success: false, message: '对方金币已达上限24' }
  }

  // 执行技能效果（转账不消耗金币，只是转移）
  caster.gold -= amount
  target.gold += amount

  gameStore.addLog(`${caster.name} 转账${amount}金币给 ${target.name}`)

  return {
    success: true,
    message: `成功转账${amount}金币`,
    data: {
      amount: amount,
      fromPlayer: caster.name,
      toPlayer: target.name
    }
  }
}
