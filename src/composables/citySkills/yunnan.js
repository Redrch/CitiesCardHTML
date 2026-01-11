/**
 * 云南省城市专属技能
 * 包括：昆明、曲靖、玉溪、保山、昭通、丽江、普洱、临沧、楚雄州、红河州、文山州、西双版纳州、大理州、怒江州、迪庆州
 */

import {
  getAliveCities,
  getCurrentHp,
  findCity,
  healCity,
  damageCity,
  addCityShield,
  boostCityHp,
  getRandomElement
} from './skillHelpers'

/**
 * 昆明市 - 四季如春
 * 限1次，该城市出战时最多扣除自身50%HP
 */
export function handleKunmingSkill(attacker, skillData, addPublicLog, gameStore) {
  const cityIndex = attacker.cities.findIndex(c => c.name === skillData.cityName)

  if (!gameStore.hpLossLimit) gameStore.hpLossLimit = {}
  if (!gameStore.hpLossLimit[attacker.name]) gameStore.hpLossLimit[attacker.name] = {}

  gameStore.hpLossLimit[attacker.name][cityIndex] = {
    active: true,
    maxLossPercent: 0.5,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"四季如春"，出战时最多损失50%HP！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 曲靖市 - 珠江源头
 * 限2次，选定己方一座HP低于7000的城市，使其HPx2，持续2回合
 */
export function handleQujingSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getAliveCities(attacker).filter(c => getCurrentHp(c) < 7000)
  if (eligibleCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"珠江源头"，没有HP低于7000的城市！`)
    return
  }

  const targetCity = getRandomElement(eligibleCities)
  const currentHp = getCurrentHp(targetCity)
  const newHp = currentHp * 2

  targetCity.currentHp = newHp
  targetCity.hp = newHp

  const cityIndex = attacker.cities.indexOf(targetCity)
  if (!gameStore.temporaryHpBoost) gameStore.temporaryHpBoost = {}
  if (!gameStore.temporaryHpBoost[attacker.name]) gameStore.temporaryHpBoost[attacker.name] = {}

  gameStore.temporaryHpBoost[attacker.name][cityIndex] = {
    active: true,
    multiplier: 2,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"珠江源头"，${targetCity.name}HP翻倍（${currentHp} -> ${newHp}），持续2回合！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 玉溪市 - 玉溪烟草
 * 限1次，使己方一座城市获得持续3回合的5000HP护盾
 */
export function handleYuxiSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityIndex = attacker.cities.indexOf(targetCity)

  addCityShield(targetCity, 5000, 3)

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"玉溪烟草"，${targetCity.name}获得5000HP护盾（持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 保山市 - 咖啡之城
 * 限3次，解除一座己方城市的疲劳效果
 */
export function handleBaoshanSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityIndex = attacker.cities.indexOf(targetCity)

  // 解除疲劳
  if (!gameStore.fatigueRemoval) gameStore.fatigueRemoval = {}
  if (!gameStore.fatigueRemoval[attacker.name]) gameStore.fatigueRemoval[attacker.name] = {}

  gameStore.fatigueRemoval[attacker.name][cityIndex] = {
    active: true,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"咖啡之城"，${targetCity.name}的疲劳效果已解除！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 昭通市 - 昭通苹果
 * 限2次，战斗预备回合己方一座城市叠加昭通市HP/增加一个城市1500HP
 */
export function handleZhaotongSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker).filter(c => c.name !== skillData.cityName)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const zhaotongCity = attacker.cities.find(c => c.name === skillData.cityName)

  if (zhaotongCity) {
    const zhaotongHp = getCurrentHp(zhaotongCity)
    const currentHp = getCurrentHp(targetCity)
    const newHp = currentHp + zhaotongHp

    targetCity.currentHp = newHp
    targetCity.hp = newHp

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"昭通苹果"，${targetCity.name}叠加昭通HP（+${zhaotongHp}）！`)
  } else {
    healCity(targetCity, 1500)
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"昭通苹果"，${targetCity.name}恢复1500HP！`)
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 丽江市 - 丽江古城
 * 限2次，使己方中心城市获得1200HP护盾
 */
export function handleLijiangSkill(attacker, skillData, addPublicLog, gameStore) {
  const centerIndex = attacker.centerIndex ?? 0
  const centerCity = attacker.cities[centerIndex]

  if (!centerCity) return

  addCityShield(centerCity, 1200, 1)

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"丽江古城"，${centerCity.name}获得1200HP护盾！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 普洱市 - 普洱茶
 * 限2次，使己方一座城市增加1500HP
 */
export function handlePuerSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  healCity(targetCity, 1500)

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"普洱茶"，${targetCity.name}恢复1500HP！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 临沧市 - 茶马古道
 * 限2次，出战时本回合对方伤害减少20%
 */
export function handleLinchangSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.enemyDamageReduction) gameStore.enemyDamageReduction = {}
  gameStore.enemyDamageReduction[attacker.name] = {
    active: true,
    multiplier: 0.8,  // 对方伤害减少20%
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"茶马古道"，本回合对方伤害减少20%！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 楚雄州 - 人类摇篮
 * 限1次，完整复活己方一座HP低于13000的城市，城市专属技能不刷新
 */
export function handleChuxiongSkill(attacker, skillData, addPublicLog, gameStore) {
  const deadCities = attacker.cities.filter(city =>
    city.isAlive === false &&
    (city.initialHp || city.hp) < 13000
  )

  if (deadCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"人类摇篮"，没有符合条件的阵亡城市！`)
    return
  }

  const targetCity = getRandomElement(deadCities)
  const initialHp = targetCity.initialHp || targetCity.hp

  targetCity.isAlive = true
  targetCity.currentHp = initialHp
  targetCity.hp = initialHp

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"人类摇篮"，${targetCity.name}完整复活！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 红河州 - 哈尼梯田
 * 限1次，出战时己方攻击力上涨20%
 */
export function handleHongheSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.powerBoost) gameStore.powerBoost = {}
  if (!gameStore.powerBoost[attacker.name]) gameStore.powerBoost[attacker.name] = {}

  gameStore.powerBoost[attacker.name].haniTerrace = {
    active: true,
    multiplier: 1.2,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"哈尼梯田"，己方攻击力+20%！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 文山州 - 三七粉
 * 限3次，增加己方2座城市500HP
 */
export function handleWenshanSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCount = Math.min(2, aliveCities.length)
  const shuffled = [...aliveCities].sort(() => Math.random() - 0.5)
  const targets = shuffled.slice(0, targetCount)

  targets.forEach(city => {
    healCity(city, 500)
  })

  const targetNames = targets.map(c => c.name).join('、')
  addPublicLog(`${attacker.name}的${skillData.cityName}激活"三七粉"，${targetNames}各恢复500HP！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 西双版纳州 - 西双版纳
 * 限1次，随机抽取除了昆明市外的任意一个云南城市加入我方阵容
 */
export function handleXishuangbannaSkill(attacker, skillData, addPublicLog, gameStore) {
  // 此技能需要城市数据库支持，暂时记录激活
  if (!gameStore.summonYunnanCity) gameStore.summonYunnanCity = {}
  gameStore.summonYunnanCity[attacker.name] = {
    active: true,
    province: '云南省',
    excludeCities: ['昆明市'],
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"西双版纳"，将召唤一个云南城市！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 大理州 - 白族之乡
 * 限1次，使己方一座初始HP低于9000的城市恢复至初始HP且攻击力增加50%，但大理州和该城市禁止出战2回合
 */
export function handleDaliSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = attacker.cities.filter(city =>
    city.isAlive !== false &&
    city.name !== skillData.cityName &&
    (city.initialHp || city.hp) < 9000
  )

  if (eligibleCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"白族之乡"，没有符合条件的城市！`)
    return
  }

  const targetCity = getRandomElement(eligibleCities)
  const initialHp = targetCity.initialHp || targetCity.hp

  targetCity.currentHp = initialHp
  targetCity.hp = initialHp

  const targetIndex = attacker.cities.indexOf(targetCity)
  const daliIndex = attacker.cities.findIndex(c => c.name === skillData.cityName)

  // 禁止出战2回合
  if (!gameStore.battleBanned) gameStore.battleBanned = {}
  if (!gameStore.battleBanned[attacker.name]) gameStore.battleBanned[attacker.name] = {}

  gameStore.battleBanned[attacker.name][targetIndex] = {
    active: true,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  gameStore.battleBanned[attacker.name][daliIndex] = {
    active: true,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  // 攻击力加成
  if (!gameStore.powerBoost) gameStore.powerBoost = {}
  if (!gameStore.powerBoost[attacker.name]) gameStore.powerBoost[attacker.name] = {}

  gameStore.powerBoost[attacker.name][`dali_${targetIndex}`] = {
    active: true,
    multiplier: 1.5,
    permanent: true
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"白族之乡"，${targetCity.name}恢复满血且攻击力+50%，但两城市禁止出战2回合！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 怒江州 - 三江并流
 * 中心城市受到的技能伤害全部转移至该城市，并且不溢出（被动触发）
 */
export function handleNujiangSkill(attacker, skillData, addPublicLog, gameStore) {
  const cityIndex = attacker.cities.findIndex(c => c.name === skillData.cityName)

  if (!gameStore.damageTransfer) gameStore.damageTransfer = {}
  if (!gameStore.damageTransfer[attacker.name]) gameStore.damageTransfer[attacker.name] = {}

  gameStore.damageTransfer[attacker.name].nujiang = {
    active: true,
    transferTo: cityIndex,
    noOverflow: true,
    onlySkillDamage: true,
    targetCenter: true
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"三江并流"被动效果已激活，将承受中心城市的技能伤害！`)
}

/**
 * 迪庆州 - 香格里拉
 * 限1次，该城市战斗预备时随机变为一个HP10000以上20000以下的城市出战并发起攻击，之后迪庆州还原
 */
export function handleDiqingSkill(attacker, skillData, addPublicLog, gameStore) {
  const cityIndex = attacker.cities.findIndex(c => c.name === skillData.cityName)

  if (!gameStore.disguiseTransform) gameStore.disguiseTransform = {}
  gameStore.disguiseTransform[attacker.name] = {
    active: true,
    originalCityIndex: cityIndex,
    hpRange: { min: 10000, max: 20000 },
    transformAttack: true,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"香格里拉"，将变身为强力城市出战！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
