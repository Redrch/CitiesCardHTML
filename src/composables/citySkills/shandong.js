/**
 * 山东省城市专属技能
 * 包括：济南、青岛、淄博、枣庄、东营、烟台、潍坊、济宁、泰安、威海、日照、滨州、德州、聊城、临沂、菏泽
 */

import {
  getAliveCities,
  getEligibleCitiesByHp,
  sortCitiesByHp,
  getCurrentHp,
  healCity,
  damageCity,
  addDelayedEffect,
  banCity,
} from './skillHelpers'
import { handleZhenjiangSkill } from './jiangsu'

/**
 * 济南市 - 泉城水攻
 * 限2次，出战时对方城市HP减少20%，溢出伤害40%打在对方首都上
 */
export function handleJinanSkill(attacker, defender, defenderCities, skillData, addPublicLog, gameStore) {
  let totalOverflow = 0

  defenderCities.forEach(city => {
    if (city && city.hp > 0) {
      const oldHp = getCurrentHp(city)
      const reduction = Math.floor(oldHp * 0.2)
      const { newHp } = damageCity(city, reduction)
      if (city.hp !== undefined) city.hp = newHp

      // 计算溢出伤害
      if (newHp === 0 && oldHp - reduction < 0) {
        totalOverflow += Math.abs(oldHp - reduction)
      }
    }
  })

  // 溢出伤害的40%打在对方首都上
  if (totalOverflow > 0 && defender.centerCityName) {
    const centerCity = defender.cities[defender.centerCityName]
    if (centerCity) {
      const overflowDamage = Math.floor(totalOverflow * 0.4)
      damageCity(centerCity, overflowDamage)

      addPublicLog(`${attacker.name}的${skillData.cityName}激活"泉城水攻"，${defender.name}的出战城市HP减少20%，${overflowDamage}溢出伤害打在首都${centerCity.name}上！`)
    }
  } else {
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"泉城水攻"，${defender.name}的出战城市HP减少20%！`)
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 青岛市 - 青岛啤酒
 * 限2次，对对方一座HP在5000以下的城市使用该技能，该城市对对方HP前三的另一座城市攻击并自毁
 */
export function handleQingdaoSkill(attacker, defender, defenderCities, skillData, addPublicLog, gameStore) {
  // 检查对方城市数量≥5
  const aliveCities = getAliveCities(defender)
  if (aliveCities.length < 5) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"青岛啤酒"，对方城市数量不足5个！`)
    return
  }

  // 找到HP在5000以下的城市
  const lowHpCities = aliveCities.filter(city => getCurrentHp(city) <= 5000)
  if (lowHpCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"青岛啤酒"，对方没有HP≤5000的城市！`)
    return
  }

  // 选择HP最低的城市
  const sorted = sortCitiesByHp(lowHpCities)
  const attackerCity = sorted[0]
  const attackerHp = getCurrentHp(attackerCity)

  // 找到对方HP前三的城市（排除攻击者自己）
  const topCities = sortCitiesByHp(aliveCities)
    .reverse()
    .filter(city => city !== attackerCity)
    .slice(0, 3)

  if (topCities.length > 0) {
    // 随机选择一个高HP城市作为目标
    const targetCity = topCities[Math.floor(Math.random() * topCities.length)]
    const targetHp = getCurrentHp(targetCity)

    // 攻击者城市自毁，目标城市扣除相应HP
    attackerCity.currentHp = 0
    attackerCity.hp = 0
    attackerCity.isAlive = false

    const { newHp } = damageCity(targetCity, attackerHp)
    if (targetCity.hp !== undefined) targetCity.hp = newHp

    if (newHp === 0) {
      targetCity.isAlive = false
      addPublicLog(`${attacker.name}的${skillData.cityName}激活"青岛啤酒"，${defender.name}的${attackerCity.name}对${targetCity.name}攻击并自毁，${targetCity.name}阵亡！`)
    } else {
      addPublicLog(`${attacker.name}的${skillData.cityName}激活"青岛啤酒"，${defender.name}的${attackerCity.name}对${targetCity.name}造成${attackerHp}伤害并自毁！`)
    }
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 淄博市 - 淄博烧烤
 * 限2次，给己方2座城市+1000HP
 */
export function handleZiboSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  const citiesToHeal = aliveCities.slice(0, 2)

  citiesToHeal.forEach(city => {
    healCity(city, 1000)
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"淄博烧烤"，${citiesToHeal.length}座城市恢复1000HP！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 东营市 - 胜利油田（同淄博烧烤）
 */
export function handleDongyingSkill(attacker, skillData, addPublicLog, gameStore) {
  handleZiboSkill(attacker, skillData, addPublicLog, gameStore)
}

/**
 * 济宁市 - 孔孟故里
 * 限2次，给己方2座城市+1000HP
 * @param {Object} attacker - 攻击方玩家
 * @param {Object} skillData - 技能数据
 * @param {Function} addPublicLog - 添加日志函数
 * @param {Object} gameStore - 游戏store
 * @param {Array} selectedCityNames - 可选，玩家选择的城市索引数组
 */
export function handleJiningSkill(attacker, skillData, addPublicLog, gameStore, selectedCityNames = null) {
  let citiesToHeal

  if (selectedCityNames && Array.isArray(selectedCityNames)) {
    // 使用玩家选择的城市
    citiesToHeal = selectedCityNames.map(name => attacker.cities[name]).filter(Boolean)
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

/**
 * 烟台市 - 蓬莱仙境
 * 限1次，己方一座城市进入蓬莱仙境2回合，2回合后HP×2并获得8000HP的护盾
 */
export function handleYantaiSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getEligibleCitiesByHp(attacker, 15000)

  if (eligibleCities.length > 0) {
    const sorted = sortCitiesByHp(eligibleCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    addDelayedEffect(gameStore, attacker.name, cityName, {
      type: 'penglai',
      roundsLeft: 2,
      data: {
        hpMultiplier: 2,
        shieldHp: 8000
      }
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"蓬莱仙境"，${targetCity.name}进入仙境2回合，2回合后HP×2并获得8000HP护盾！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 威海市 - 刘公岛
 * 限1次，选定己方1个城市禁止出战2回合，2回合后恢复至满血状态
 */
export function handleWeihaiSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getEligibleCitiesByHp(attacker, 8000)

  if (eligibleCities.length > 0) {
    const sorted = sortCitiesByHp(eligibleCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    banCity(gameStore, attacker.name, cityName, 2, {
      fullHealOnReturn: true,
      originalHp: getCurrentHp(targetCity)
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"刘公岛"，${targetCity.name}禁止出战2回合，之后满血复活！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 德州市 - 德州扒鸡（同镇江香醋）
 */
export function handleDezhouSkill(attacker, skillData, addPublicLog, gameStore) {
  handleZhenjiangSkill(attacker, skillData, addPublicLog, gameStore)
}

/**
 * 聊城市 - 东阿阿胶（同镇江香醋）
 */
export function handleLiaochengSkill(attacker, skillData, addPublicLog, gameStore) {
  handleZhenjiangSkill(attacker, skillData, addPublicLog, gameStore)
}

/**
 * 菏泽市 - 菏泽牡丹
 * 限1次，选定己方1个城市禁止出战2回合，2回合后恢复至满血状态
 */
export function handleHezeSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getEligibleCitiesByHp(attacker, 8000)

  if (eligibleCities.length > 0) {
    const sorted = sortCitiesByHp(eligibleCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    banCity(gameStore, attacker.name, cityName, 2, {
      fullHealOnReturn: true,
      originalHp: getCurrentHp(targetCity)
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"菏泽牡丹"，${targetCity.name}禁止出战2回合，之后满血复活！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 枣庄市 - 台儿庄战役
 * 限1次，使己方一座城市攻击力永久增加50%（HP20000以下可使用）
 */
export function handleZaozhuangSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getEligibleCitiesByHp(attacker, 20000)

  if (eligibleCities.length > 0) {
    const sorted = sortCitiesByHp(eligibleCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    // 设置永久攻击力增加50%
    if (!gameStore.permanentModifiers) gameStore.permanentModifiers = {}
    if (!gameStore.permanentModifiers[attacker.name]) gameStore.permanentModifiers[attacker.name] = {}

    gameStore.permanentModifiers[attacker.name][cityName] = {
      attackMultiplier: 1.5,
      type: 'taierzhuang',
      appliedRound: gameStore.currentRound
    }

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"台儿庄战役"，${targetCity.name}攻击力永久增加50%！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 潍坊市 - 风筝探测
 * 限1次，得知对方三座未知城市（未知城市＜3时无法使用）
 */
export function handleWeifangSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  // 获取对方未知城市
  const unknownCities = []
  Object.values(defender.cities).forEach((city, index) => {
    if (city.isAlive !== false) {
      const isKnown = gameStore.knownCities?.[attacker.name]?.[defender.name]?.[index]
      if (!isKnown) {
        unknownCities.push({ city, index })
      }
    }
  })

  if (unknownCities.length < 3) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"风筝探测"，对方未知城市少于3座！`)
    return
  }

  // 随机选择3座未知城市
  const selectedCities = []
  const shuffled = [...unknownCities].sort(() => Math.random() - 0.5)
  for (let i = 0; i < 3 && i < shuffled.length; i++) {
    selectedCities.push(shuffled[i])
  }

  // 标记为已知城市
  if (!gameStore.knownCities) gameStore.knownCities = {}
  if (!gameStore.knownCities[attacker.name]) gameStore.knownCities[attacker.name] = {}
  if (!gameStore.knownCities[attacker.name][defender.name]) {
    gameStore.knownCities[attacker.name][defender.name] = {}
  }

  const cityNames = []
  selectedCities.forEach(({ city, index }) => {
    gameStore.knownCities[attacker.name][defender.name][index] = true
    cityNames.push(city.name)
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"风筝探测"，得知${defender.name}的${cityNames.join('、')}！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 泰安市 - 泰山压顶
 * 限1次，选定对方一座城市，接下来3回合禁止出战，若强制出战HP减半
 */
export function handleTaianSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(defender)

  if (aliveCities.length > 0) {
    // 选择对方HP最高的城市
    const sorted = sortCitiesByHp(aliveCities).reverse()
    const targetCity = sorted[0]
    const cityName = targetCity.name

    // 禁止出战3回合，强制出战HP减半
    if (!gameStore.bannedCities) gameStore.bannedCities = {}
    if (!gameStore.bannedCities[defender.name]) gameStore.bannedCities[defender.name] = {}

    gameStore.bannedCities[defender.name][cityName] = {
      roundsLeft: 3,
      halfHpIfForced: true,
      appliedRound: gameStore.currentRound
    }

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"泰山压顶"，${defender.name}的${targetCity.name}3回合禁止出战！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 日照市 - 城建幻觉
 * 限1次，假扮为HP为10000以上的某一城市并出战，当战力达到原日照市战力及以下时公布真实身份并自毁
 */
export function handleRizhaoSkill(attacker, skillData, addPublicLog, gameStore) {
  const rizhaoCity = Object.values(attacker.cities).find(city => city.name === '日照市')
  if (!rizhaoCity) return

  const originalHp = getCurrentHp(rizhaoCity)

  // 从所有城市数据中选择HP≥10000的城市作为伪装
  if (!gameStore.cityDatabase) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"城建幻觉"，城市数据库不可用！`)
    return
  }

  const highHpCities = Object.values(gameStore.cityDatabase).filter(city => city.hp >= 10000)
  if (highHpCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"城建幻觉"，没有HP≥10000的城市可伪装！`)
    return
  }

  // 随机选择一个高HP城市作为伪装
  const disguiseCity = highHpCities[Math.floor(Math.random() * highHpCities.length)]

  // 设置伪装状态
  if (!gameStore.disguisedCities) gameStore.disguisedCities = {}
  if (!gameStore.disguisedCities[attacker.name]) gameStore.disguisedCities[attacker.name] = {}

  const cityName = rizhaoCity.name
  gameStore.disguisedCities[attacker.name][cityName] = {
    originalCity: '日照市',
    disguisedAs: disguiseCity.name,
    disguisedHp: disguiseCity.hp,
    originalHp: originalHp,
    revealThreshold: originalHp,  // 当HP降到原始HP时揭露
    roundsLeft: 999,
    appliedRound: gameStore.currentRound
  }

  // 清除日照市的已知状态
  if (gameStore.knownCities) {
    Object.keys(gameStore.knownCities).forEach(playerName => {
      if (gameStore.knownCities[playerName]?.[attacker.name]?.[cityName]) {
        delete gameStore.knownCities[playerName][attacker.name][cityName]
      }
    })
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"城建幻觉"，日照市伪装成${disguiseCity.name}！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 临沂市 - 物流之都
 * 限1次，对方接下来使用的一个城市专属技能转移到己方城市上使用
 */
export function handleLinyiSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  // 设置技能转移状态
  if (!gameStore.skillRedirect) gameStore.skillRedirect = {}

  gameStore.skillRedirect[defender.name] = {
    active: true,
    targetPlayer: attacker.name,
    skillsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"物流之都"，${defender.name}接下来使用的一个城市专属技能将转移到己方！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
