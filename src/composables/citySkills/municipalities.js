/**
 * 直辖市城市专属技能
 * 包括：北京、天津、重庆、上海、香港、澳门
 */

import {
  getCurrentHp,
  damageCity,
  getAliveCities,
  getCityIndex,
  addShield
} from './skillHelpers'

/**
 * 北京市 - 首都权威（战斗技能/被动）
 * 出战时攻击力增加20%（限2次），且可以归顺对方出战城市（限1次，不能归顺对方首都）
 */
export function handleBeijingSkill(attacker, defender, defenderCities, skillData, addPublicLog, gameStore) {
  // 初始化北京技能状态
  if (!gameStore.beijingSkillState) gameStore.beijingSkillState = {}
  if (!gameStore.beijingSkillState[attacker.name]) {
    gameStore.beijingSkillState[attacker.name] = {
      powerBoostUsed: 0,
      surrenderUsed: 0
    }
  }

  const state = gameStore.beijingSkillState[attacker.name]

  // 攻击力加成（限2次）
  if (state.powerBoostUsed < 2) {
    const beijingIndex = attacker.cities.findIndex(c => c.name === '北京市')
    if (beijingIndex !== -1) {
      if (!gameStore.tempAttackBoost) gameStore.tempAttackBoost = {}
      if (!gameStore.tempAttackBoost[attacker.name]) gameStore.tempAttackBoost[attacker.name] = {}

      gameStore.tempAttackBoost[attacker.name][beijingIndex] = {
        multiplier: 1.2,
        roundsLeft: 1,
        appliedRound: gameStore.currentRound
      }
      state.powerBoostUsed++
      addPublicLog(`${attacker.name}的${skillData.cityName}激活"首都权威"，攻击力增加20%！（剩余${2 - state.powerBoostUsed}次）`)
    }
  }

  // 归顺对方出战城市（限1次，不能归顺对方首都）
  if (state.surrenderUsed < 1 && defenderCities && defenderCities.length > 0) {
    const surrenderableCities = defenderCities.filter(city => {
      const cityIdx = getCityIndex(defender, city)
      return cityIdx !== defender.centerIndex && city.isAlive !== false && getCurrentHp(city) > 0
    })

    if (surrenderableCities.length > 0) {
      // 随机选择一个可归顺的城市
      const targetCity = surrenderableCities[Math.floor(Math.random() * surrenderableCities.length)]
      const cityIdx = getCityIndex(defender, targetCity)

      // 从防守方移除
      defender.cities.splice(cityIdx, 1)

      // 添加到攻击方（恢复初始状态）
      const surrenderedCity = {
        ...targetCity,
        currentHp: targetCity.hp,
        isAlive: true
      }
      attacker.cities.push(surrenderedCity)

      state.surrenderUsed++
      addPublicLog(`${attacker.name}的${skillData.cityName}使用归顺能力，${targetCity.name}加入${attacker.name}阵营！`)
    }
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 天津市 - 津门守卫（战斗技能/被动）
 * HP增加50%，己方首都受到攻击时50%伤害转移至天津市
 * 若天津市为首都，HP×2，但攻击力只能在此基础上增加50%
 */
export function handleTianjinSkill(attacker, skillData, addPublicLog, gameStore) {
  const tianjinIndex = attacker.cities.findIndex(c => c.name === '天津市')
  if (tianjinIndex === -1) return

  const tianjinCity = attacker.cities[tianjinIndex]

  // 初始化天津技能状态（只执行一次）
  if (!gameStore.tianjinInitialized) gameStore.tianjinInitialized = {}
  if (!gameStore.tianjinInitialized[attacker.name]) {
    // HP增加50%
    const oldHp = tianjinCity.hp
    tianjinCity.hp = Math.floor(oldHp * 1.5)
    tianjinCity.currentHp = Math.floor(getCurrentHp(tianjinCity) * 1.5)

    // 如果天津是首都
    if (tianjinIndex === attacker.centerIndex) {
      tianjinCity.hp = Math.floor(tianjinCity.hp * 2)
      tianjinCity.currentHp = Math.floor(tianjinCity.currentHp * 2)
      addPublicLog(`${attacker.name}的${skillData.cityName}作为首都激活"津门守卫"，HP×2！`)

      // 设置攻击力限制标记
      if (!gameStore.tianjinPowerLimit) gameStore.tianjinPowerLimit = {}
      gameStore.tianjinPowerLimit[attacker.name] = {
        cityIndex: tianjinIndex,
        maxMultiplier: 1.5  // 攻击力最多增加50%
      }
    } else {
      addPublicLog(`${attacker.name}的${skillData.cityName}激活"津门守卫"，HP增加50%！`)
    }

    gameStore.tianjinInitialized[attacker.name] = true
  }

  // 设置伤害转移（每次出战都生效）
  if (tianjinIndex !== attacker.centerIndex && attacker.centerIndex !== undefined) {
    if (!gameStore.damageTransfer) gameStore.damageTransfer = {}
    if (!gameStore.damageTransfer[attacker.name]) gameStore.damageTransfer[attacker.name] = {}

    gameStore.damageTransfer[attacker.name][attacker.centerIndex] = {
      targetIndex: tianjinIndex,
      transferPercent: 0.5,
      appliedRound: gameStore.currentRound
    }
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 重庆市 - 山城迷踪（战斗技能/被动）
 * 限2次，出战时使对方出战城市HP减半
 */
export function handleChongqingSkill(attacker, defender, defenderCities, skillData, addPublicLog, gameStore) {
  defenderCities.forEach(city => {
    if (city && city.hp > 0) {
      const oldHp = getCurrentHp(city)
      const newHp = Math.floor(oldHp * 0.5)
      city.currentHp = newHp
      if (city.hp !== undefined) city.hp = newHp
    }
  })
  addPublicLog(`${attacker.name}的${skillData.cityName}激活"山城迷踪"，${defender.name}的出战城市HP减半！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 上海市 - 经济中心（战斗技能/主动）
 * 限2次，出战后三回合每回合额外增加2个金币
 */
export function handleShanghaiSkill(attacker, skillData, addPublicLog, gameStore) {
  // 初始化金币增益系统
  if (!gameStore.goldBonus) gameStore.goldBonus = {}
  if (!gameStore.goldBonus[attacker.name]) gameStore.goldBonus[attacker.name] = []

  // 添加持续3回合的金币增益
  gameStore.goldBonus[attacker.name].push({
    roundsLeft: 3,
    goldPerRound: 2,
    appliedRound: gameStore.currentRound,
    skillName: '经济中心'
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"经济中心"，接下来3回合每回合额外获得2个金币！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 香港特别行政区 - 东方之珠（非战斗技能/主动）
 * 限2次，己方城市单回合攻击力增加20%且受到伤害减半
 */
export function handleHongkongSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"东方之珠"，没有存活城市！`)
    return
  }

  // 给所有己方城市添加攻击力加成
  if (!gameStore.tempAttackBoost) gameStore.tempAttackBoost = {}
  if (!gameStore.tempAttackBoost[attacker.name]) gameStore.tempAttackBoost[attacker.name] = {}

  aliveCities.forEach(city => {
    const cityIdx = getCityIndex(attacker, city)
    gameStore.tempAttackBoost[attacker.name][cityIdx] = {
      multiplier: 1.2,
      roundsLeft: 1,  // 单回合
      appliedRound: gameStore.currentRound
    }
  })

  // 给所有己方城市添加伤害减免
  if (!gameStore.damageReduction) gameStore.damageReduction = {}
  if (!gameStore.damageReduction[attacker.name]) gameStore.damageReduction[attacker.name] = {}

  aliveCities.forEach(city => {
    const cityIdx = getCityIndex(attacker, city)
    gameStore.damageReduction[attacker.name][cityIdx] = {
      percent: 0.5,  // 伤害减半
      roundsLeft: 1,  // 单回合
      appliedRound: gameStore.currentRound
    }
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"东方之珠"，所有城市本回合攻击力+20%且受到伤害减半！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 澳门特别行政区 - 赌城风云（非战斗技能/主动）
 * 限2次，指定对方一座已知城市无法使用城市专属技能
 */
export function handleMacauSkill(attacker, defender, skillData, addPublicLog, gameStore, targetCityIndex = null) {
  // 获取对方已知城市
  const knownCities = defender.cities.filter((city, idx) => {
    return city.isAlive !== false && getCurrentHp(city) > 0 && !city.isHidden
  })

  if (knownCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"赌城风云"，对方没有已知城市！`)
    return
  }

  let targetCity, cityIdx

  if (targetCityIndex !== null && targetCityIndex !== undefined) {
    // 使用指定的目标
    targetCity = defender.cities[targetCityIndex]
    cityIdx = targetCityIndex
  } else {
    // 随机选择一个已知城市
    targetCity = knownCities[Math.floor(Math.random() * knownCities.length)]
    cityIdx = getCityIndex(defender, targetCity)
  }

  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"赌城风云"，目标城市无效！`)
    return
  }

  // 初始化技能禁用系统
  if (!gameStore.skillDisabled) gameStore.skillDisabled = {}
  if (!gameStore.skillDisabled[defender.name]) gameStore.skillDisabled[defender.name] = {}

  // 禁用该城市的专属技能
  gameStore.skillDisabled[defender.name][cityIdx] = {
    permanent: true,  // 永久禁用
    appliedRound: gameStore.currentRound,
    source: '赌城风云'
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"赌城风云"，${defender.name}的${targetCity.name}无法使用城市专属技能！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
