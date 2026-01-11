/**
 * 辽宁省城市专属技能
 * 包括：沈阳、大连、鞍山、抚顺、本溪、丹东、锦州、营口、阜新、辽阳、盘锦、铁岭、葫芦岛
 */

import {
  getAliveCities,
  getCurrentHp,
  findCity,
  healCity,
  damageCity,
  addShield,
  getRandomElement
} from './skillHelpers'

/**
 * 沈阳市 - 盛京荣耀
 * 限2次，出战时己方全体城市攻击力提升15%，持续2回合，己方中心城市免疫一次致命伤害
 */
export function handleShenyangSkill(attacker, skillData, addPublicLog, gameStore) {
  // 设置攻击力加成
  if (!gameStore.powerBoost) gameStore.powerBoost = {}
  if (!gameStore.powerBoost[attacker.name]) gameStore.powerBoost[attacker.name] = {}

  gameStore.powerBoost[attacker.name].shengJingGlory = {
    active: true,
    multiplier: 1.15,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  // 给中心城市添加免死金牌
  if (!gameStore.deathImmunity) gameStore.deathImmunity = {}
  if (!gameStore.deathImmunity[attacker.name]) gameStore.deathImmunity[attacker.name] = {}

  const centerIndex = attacker.centerIndex ?? 0
  gameStore.deathImmunity[attacker.name][centerIndex] = {
    active: true,
    count: 1
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"盛京荣耀"，全体攻击力+15%（持续2回合），中心城市获得免死金牌！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 大连市 - 浪漫之都
 * 限2次，出战时选定己方一座城市，使其在接下来的3回合内，每次受到攻击时都有50%概率反弹50%的伤害给攻击者
 */
export function handleDalianSkill(attacker, skillData, addPublicLog, gameStore) {
  // 随机选择一座存活城市
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityIndex = attacker.cities.indexOf(targetCity)

  // 设置反弹效果
  if (!gameStore.reflectDamage) gameStore.reflectDamage = {}
  if (!gameStore.reflectDamage[attacker.name]) gameStore.reflectDamage[attacker.name] = {}

  gameStore.reflectDamage[attacker.name][cityIndex] = {
    active: true,
    chance: 0.5,
    multiplier: 0.5,
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"浪漫之都"，${targetCity.name}获得反弹护盾（50%概率反弹50%伤害，持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 鞍山市 - 钢都铁壁
 * 限2次，给己方中心城市附加一个持续3回合的钢铁护盾，护盾可吸收3000点伤害
 */
export function handleAnshanSkill(attacker, skillData, addPublicLog, gameStore) {
  const centerIndex = attacker.centerIndex ?? 0
  const centerCity = attacker.cities[centerIndex]

  addShield(centerCity, 3000, 3)

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"钢都铁壁"，中心城市${centerCity.name}获得3000点护盾（持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 抚顺市 - 煤都重生
 * 限1次，出战时使己方所有城市HP恢复至最大值的50%，若己方城市HP已低于此值，则恢复至该值
 */
export function handleFushunSkill(attacker, skillData, addPublicLog, gameStore) {
  let healedCount = 0

  attacker.cities.forEach(city => {
    if (city.isAlive !== false) {
      const maxHp = city.initialHp || city.hp
      const targetHp = Math.floor(maxHp * 0.5)
      const currentHp = getCurrentHp(city)

      if (currentHp < targetHp) {
        city.currentHp = targetHp
        city.hp = targetHp
        healedCount++
      }
    }
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"煤都重生"，${healedCount}座城市恢复至最大HP的50%！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 本溪市 - 本溪水洞
 * 限2次，出战时选定己方一座城市，为其提供一个持续2回合的护盾，护盾存在期间，该城市受到的伤害减少30%
 */
export function handleBenxiSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityIndex = attacker.cities.indexOf(targetCity)

  // 设置伤害减免
  if (!gameStore.damageReduction) gameStore.damageReduction = {}
  if (!gameStore.damageReduction[attacker.name]) gameStore.damageReduction[attacker.name] = {}
  if (!gameStore.damageReduction[attacker.name][cityIndex]) {
    gameStore.damageReduction[attacker.name][cityIndex] = {}
  }

  gameStore.damageReduction[attacker.name][cityIndex].benxiCave = {
    active: true,
    multiplier: 0.7,  // 减少30%伤害
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"本溪水洞"，${targetCity.name}受到伤害减少30%（持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 丹东市 - 鸭绿江
 * 限1次，出战时使对方所有出战城市在接下来的2回合内，每次攻击时都有20%概率失误，即不造成伤害
 */
export function handleDandongSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  // 设置失误状态
  if (!gameStore.attackMiss) gameStore.attackMiss = {}
  gameStore.attackMiss[defender.name] = {
    active: true,
    chance: 0.2,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"鸭绿江"，${defender.name}的城市攻击有20%概率失误（持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 锦州市 - 笔架山
 * 限2次，出战时选定己方一座城市，使其在接下来的3回合内，每次出战时都能额外获得1000点HP的恢复效果
 */
export function handleJinzhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityIndex = attacker.cities.indexOf(targetCity)

  // 设置出战回血效果
  if (!gameStore.battleHealing) gameStore.battleHealing = {}
  if (!gameStore.battleHealing[attacker.name]) gameStore.battleHealing[attacker.name] = {}

  gameStore.battleHealing[attacker.name][cityIndex] = {
    active: true,
    amount: 1000,
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"笔架山"，${targetCity.name}每次出战回复1000HP（持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 营口市 - 鲅鱼圈
 * 限1次，给对方的一座随机城市缠绕鲅鱼，若为沿海城市无效，若不是沿海城市，其出战时对己方造成伤害后自毁
 */
export function handleYingkouSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(defender)
  if (aliveCities.length === 0) return

  // 沿海城市列表（简化处理）
  const coastalCities = [
    '大连市', '营口市', '丹东市', '锦州市', '葫芦岛市', // 辽宁
    '天津市', '上海市', '广州市', '深圳市', '珠海市', '汕头市', '湛江市', '北海市', '防城港市', '钦州市',
    '海口市', '三亚市', '厦门市', '福州市', '泉州市', '宁波市', '温州市', '青岛市', '烟台市', '威海市', '日照市',
    '连云港市', '南通市', '盐城市', '香港特别行政区', '澳门特别行政区'
  ]

  // 随机选择一座城市
  const targetCity = getRandomElement(aliveCities)
  const cityIndex = defender.cities.indexOf(targetCity)

  // 检查是否为沿海城市
  if (coastalCities.includes(targetCity.name)) {
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"鲅鱼圈"，但${targetCity.name}是沿海城市，技能无效！`)
    return
  }

  // 设置鲅鱼缠绕状态
  if (!gameStore.bayuTrap) gameStore.bayuTrap = {}
  if (!gameStore.bayuTrap[defender.name]) gameStore.bayuTrap[defender.name] = {}

  gameStore.bayuTrap[defender.name][cityIndex] = {
    active: true,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"鲅鱼圈"，${defender.name}的${targetCity.name}被缠绕鲅鱼（出战后将自毁）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 阜新市 - 玛瑙之光
 * 限1次，出战时选定己方一座城市，使其在接下来的2回合内，每次受到攻击时都有40%概率使攻击者的攻击力下降20%，持续1回合
 */
export function handleFuxinSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityIndex = attacker.cities.indexOf(targetCity)

  // 设置攻击力削弱效果
  if (!gameStore.counterWeaken) gameStore.counterWeaken = {}
  if (!gameStore.counterWeaken[attacker.name]) gameStore.counterWeaken[attacker.name] = {}

  gameStore.counterWeaken[attacker.name][cityIndex] = {
    active: true,
    chance: 0.4,
    multiplier: 0.8,  // 降低20%攻击力
    duration: 1,  // 削弱持续1回合
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"玛瑙之光"，${targetCity.name}获得反击削弱（40%概率降低攻击者20%攻击力，持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 辽阳市 - 辽阳白塔
 * 限2次，出战时己方全体城市防御力提升15%，持续2回合
 */
export function handleLiaoyangSkill(attacker, skillData, addPublicLog, gameStore) {
  // 设置防御加成
  if (!gameStore.defenseBoost) gameStore.defenseBoost = {}
  if (!gameStore.defenseBoost[attacker.name]) gameStore.defenseBoost[attacker.name] = {}

  gameStore.defenseBoost[attacker.name].whiteTower = {
    active: true,
    multiplier: 1.15,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"辽阳白塔"，全体防御力+15%（持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 盘锦市 - 红海滩
 * 限2次，出战时选定己方一座城市，使其在接下来的3回合内，每次受到攻击时都有30%概率使攻击者进入中毒状态，每回合损失500点HP，持续2回合
 */
export function handlePanjinSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityIndex = attacker.cities.indexOf(targetCity)

  // 设置中毒反击效果
  if (!gameStore.poisonCounter) gameStore.poisonCounter = {}
  if (!gameStore.poisonCounter[attacker.name]) gameStore.poisonCounter[attacker.name] = {}

  gameStore.poisonCounter[attacker.name][cityIndex] = {
    active: true,
    chance: 0.3,
    damage: 500,
    duration: 2,  // 中毒持续2回合
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"红海滩"，${targetCity.name}获得中毒反击（30%概率中毒攻击者，持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 铁岭市 - 小品之乡
 * 限2次，出战时可以给己方出战城市增加50%攻击力或对手出战城市减少50%攻击力
 */
export function handleTielingSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  // 随机选择增强己方或削弱对方
  const choice = Math.random() < 0.5 ? 'buff' : 'debuff'

  if (choice === 'buff') {
    // 增强己方
    if (!gameStore.powerBoost) gameStore.powerBoost = {}
    if (!gameStore.powerBoost[attacker.name]) gameStore.powerBoost[attacker.name] = {}

    gameStore.powerBoost[attacker.name].xiaopinBoost = {
      active: true,
      multiplier: 1.5,
      roundsLeft: 1,
      appliedRound: gameStore.currentRound
    }

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"小品之乡"，本回合己方攻击力+50%！`)
  } else {
    // 削弱对方
    if (!gameStore.powerReduction) gameStore.powerReduction = {}
    if (!gameStore.powerReduction[defender.name]) gameStore.powerReduction[defender.name] = {}

    gameStore.powerReduction[defender.name].xiaopinDebuff = {
      active: true,
      multiplier: 0.5,
      roundsLeft: 1,
      appliedRound: gameStore.currentRound
    }

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"小品之乡"，本回合${defender.name}攻击力-50%！`)
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 葫芦岛市 - 兴城海滨
 * 限1次，给对方随机5座城市施加海浪，持续5回合，每回合造成500伤害，若选中沿海城市则视为无效
 */
export function handleHuludaoSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(defender)
  if (aliveCities.length === 0) return

  // 沿海城市列表
  const coastalCities = [
    '大连市', '营口市', '丹东市', '锦州市', '葫芦岛市',
    '天津市', '上海市', '广州市', '深圳市', '珠海市', '汕头市', '湛江市', '北海市', '防城港市', '钦州市',
    '海口市', '三亚市', '厦门市', '福州市', '泉州市', '宁波市', '温州市', '青岛市', '烟台市', '威海市', '日照市',
    '连云港市', '南通市', '盐城市', '香港特别行政区', '澳门特别行政区'
  ]

  // 随机选择最多5座非沿海城市
  const nonCoastalCities = aliveCities.filter(city => !coastalCities.includes(city.name))
  const targetCount = Math.min(5, nonCoastalCities.length)

  if (targetCount === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"兴城海滨"，但对方都是沿海城市，技能无效！`)
    return
  }

  // 随机选择城市
  const shuffled = [...nonCoastalCities].sort(() => Math.random() - 0.5)
  const targets = shuffled.slice(0, targetCount)

  // 设置海浪效果
  if (!gameStore.seaWaves) gameStore.seaWaves = {}
  if (!gameStore.seaWaves[defender.name]) gameStore.seaWaves[defender.name] = {}

  targets.forEach(city => {
    const cityIndex = defender.cities.indexOf(city)
    gameStore.seaWaves[defender.name][cityIndex] = {
      active: true,
      damage: 500,
      roundsLeft: 5,
      appliedRound: gameStore.currentRound
    }
  })

  const targetNames = targets.map(c => c.name).join('、')
  addPublicLog(`${attacker.name}的${skillData.cityName}激活"兴城海滨"，${defender.name}的${targetNames}被海浪侵袭（每回合500伤害，持续5回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
