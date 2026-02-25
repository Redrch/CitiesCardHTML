/**
 * 浙江省城市专属技能
 * 包括：杭州、宁波、温州、绍兴、湖州、嘉兴、金华、衢州、台州、丽水、舟山
 */

import {
  getAliveCities,
  getEligibleCitiesByHp,
  sortCitiesByHp,
  getCurrentHp,
  healCity,
  damageCity,
  boostCityHp,
  addShield,
  banCity,
  addDelayedEffect,
} from './skillHelpers'

/**
 * 宁波市 - 宁波港
 * 限2次，给己方3座城市+3000HP
 */
export function handleNingboSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  const citiesToHeal = aliveCities.slice(0, 3)

  citiesToHeal.forEach(city => {
    healCity(city, 3000)
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"宁波港"，${citiesToHeal.length}座城市恢复3000HP！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 绍兴市 - 鲁迅文学
 * 限1次，给己方2座城市HP增加40%（HP20000以下可使用）
 */
export function handleShaoxingSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getEligibleCitiesByHp(attacker, 20000)
  const citiesToBoost = eligibleCities.slice(0, 2)

  citiesToBoost.forEach(city => {
    boostCityHp(city, 1.4)
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"鲁迅文学"，${citiesToBoost.length}座城市HP增加40%！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 丽水市 - 景宁畲乡
 * 限1次，给己方一座城市2000HP的护盾
 */
export function handleLishuiSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    const sorted = sortCitiesByHp(aliveCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    addShield(gameStore, attacker.name, cityName, {
      hp: 2000,
      roundsLeft: 2
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"景宁畲乡"，${targetCity.name}获得2000HP护盾（持续2回合）`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 舟山市 - 舟山海鲜
 * 限1次，给己方3座城市HP增加20%（HP20000以下可使用）
 * @param {Object} attacker - 攻击方玩家
 * @param {Object} skillData - 技能数据
 * @param {Function} addPublicLog - 添加日志函数
 * @param {Object} gameStore - 游戏store
 * @param {Array} selectedCityNames - 可选，玩家选择的城市名称数组
 */
export function handleZhoushanSkill(attacker, skillData, addPublicLog, gameStore, selectedCityNames = null) {
  let citiesToBoost

  if (selectedCityNames && Array.isArray(selectedCityNames)) {
    // 使用玩家选择的城市
    citiesToBoost = selectedCityNames.map(name => attacker.cities[name]).filter(Boolean)
  } else {
    // 默认行为：自动选择前3个符合条件的城市（HP≤20000）
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

/**
 * 杭州市 - 西湖秘境
 * 限1次，己方一个城市进入西湖秘境3回合，3回合后战力×3且随后出战的两回合受到伤害减半（HP12000以下可使用）
 */
export function handleHangzhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getEligibleCitiesByHp(attacker, 12000)

  if (eligibleCities.length > 0) {
    const sorted = sortCitiesByHp(eligibleCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    // 使用延迟效果系统
    addDelayedEffect(gameStore, attacker.name, cityName, {
      type: 'xihu',
      roundsLeft: 3,
      data: {
        attackMultiplier: 3,
        damageReduction: 0.5,
        reductionRounds: 2,
        appliedRound: gameStore.currentRound
      }
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"西湖秘境"，${targetCity.name}进入西湖秘境3回合！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 温州市 - 方言谜语
 * 限1次，己方接下来两个非战斗金币技能使用自动隐藏，无人知晓
 */
export function handleWenzhouSkill(attacker, skillData, addPublicLog, gameStore) {
  // 设置隐藏技能使用状态
  if (!gameStore.skillHidden) gameStore.skillHidden = {}
  if (!gameStore.skillHidden[attacker.name]) gameStore.skillHidden[attacker.name] = {}

  gameStore.skillHidden[attacker.name] = {
    active: true,
    skillsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"方言谜语"，接下来2个技能使用将自动隐藏！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 湖州市 - 笔走龙蛇
 * 己方城市发动攻击时，有20%概率使本次攻击力提升50%（被动触发）
 */
export function handleHuzhouSkill(attacker, skillData, addPublicLog, gameStore) {
  // 设置攻击力增强状态
  if (!gameStore.attackModifiers) gameStore.attackModifiers = {}
  if (!gameStore.attackModifiers[attacker.name]) gameStore.attackModifiers[attacker.name] = {}

  gameStore.attackModifiers[attacker.name].calligraphy = {
    active: true,
    probability: 0.2,
    multiplier: 1.5,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"笔走龙蛇"，攻击时20%概率提升50%攻击力！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 嘉兴市 - 南湖印记
 * 限1次，己方一座城市HP增加20%且攻击力永久为HP的2倍（HP10000以下可使用）
 */
export function handleJiaxingSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getEligibleCitiesByHp(attacker, 10000)

  if (eligibleCities.length > 0) {
    const sorted = sortCitiesByHp(eligibleCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    // HP增加20%
    boostCityHp(targetCity, 1.2)

    // 设置永久攻击力为HP的2倍
    if (!gameStore.permanentModifiers) gameStore.permanentModifiers = {}
    if (!gameStore.permanentModifiers[attacker.name]) gameStore.permanentModifiers[attacker.name] = {}

    gameStore.permanentModifiers[attacker.name][cityName] = {
      attackMultiplier: 2,
      type: 'nanhu',
      appliedRound: gameStore.currentRound
    }

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"南湖印记"，${targetCity.name}HP增加20%且攻击力永久为HP的2倍！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 金华市 - 世界义乌
 * 获得分身义乌市，加入己方阵营并一起出战
 */
export function handleJinhuaSkill(attacker, skillData, addPublicLog, gameStore) {
  // 创建义乌市分身
  if (!gameStore.clones) gameStore.clones = {}
  if (!gameStore.clones[attacker.name]) gameStore.clones[attacker.name] = []

  const yiwuClone = {
    name: '义乌市',
    hp: 5000,
    currentHp: 5000,
    isClone: true,
    originalCity: '金华市',
    createdRound: gameStore.currentRound
  }

  gameStore.clones[attacker.name].push(yiwuClone)

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"世界义乌"，获得分身义乌市并一起出战！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 衢州市 - 三头一掌
 * 限2次，出战时随机辣到对方一座城市并减少20%HP，且接下来2回合该城市禁止出战（被动触发）
 */
export function handleQuzhouSkill(attacker, defender, defenderCities, skillData, addPublicLog, gameStore) {
  if (defenderCities.length > 0) {
    // 随机选择对方一座出战城市
    const randomIndex = Math.floor(Math.random() * defenderCities.length)
    const targetCity = defenderCities[randomIndex]

    if (targetCity && targetCity.hp > 0) {
      const oldHp = getCurrentHp(targetCity)
      const damage = Math.floor(oldHp * 0.2)
      const { newHp } = damageCity(targetCity, damage)

      if (targetCity.hp !== undefined) targetCity.hp = newHp

      // 获取城市名称并禁止出战2回合
      const cityName = targetCity.name
      if (cityName) {
        if (!gameStore.bannedCities) gameStore.bannedCities = {}
        if (!gameStore.bannedCities[defender.name]) gameStore.bannedCities[defender.name] = {}

        gameStore.bannedCities[defender.name][cityName] = {
          roundsLeft: 2,
          halfHpIfForced: true,  // 强制出战则HP减半
          appliedRound: gameStore.currentRound
        }
      }

      addPublicLog(`${attacker.name}的${skillData.cityName}激活"三头一掌"，${defender.name}的${targetCity.name}减少20%HP并2回合禁止出战！`)
    }
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 台州市 - 天台山
 * 限1次，己方一个城市下场2回合，2回合后恢复至满血状态（HP8000以下可使用）
 * 
 */
export function handleTaizhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getEligibleCitiesByHp(attacker, 8000)

  if (eligibleCities.length > 0) {
    const sorted = sortCitiesByHp(eligibleCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    // 使用禁止出战系统，2回合后满血复活
    banCity(gameStore, attacker.name, cityName, 2, {
      fullHealOnReturn: true,
      originalHp: getCurrentHp(targetCity)
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"天台山"，${targetCity.name}下场2回合后恢复满血！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
