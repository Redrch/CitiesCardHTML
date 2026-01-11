/**
 * 黑龙江省城市专属技能
 * 包括：哈尔滨、齐齐哈尔、牡丹江、佳木斯、大庆、伊春、鸡西、双鸭山、黑河、七台河、大兴安岭地区
 * 无技能：鹤岗、绥化
 */

import {
  getAliveCities,
  getCurrentHp,
  healCity,
  increaseMaxHp,
  addShield,
  getCityIndex
} from './skillHelpers'

/**
 * 哈尔滨市 - 冰城奇观（非战斗技能）
 * 限1次，出战时使对方所有城市2回合内无法被使用技能（对方城市数量≥3时可使用）
 */
export function handleHaerbinSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const defenderAliveCities = getAliveCities(defender)

  if (defenderAliveCities.length < 3) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"冰城奇观"，对方城市数量不足3个！`)
    return
  }

  // 初始化技能禁用状态
  if (!gameStore.skillFrozen) gameStore.skillFrozen = {}
  if (!gameStore.skillFrozen[defender.name]) gameStore.skillFrozen[defender.name] = {}

  // 标记所有对方城市2回合内无法使用技能
  defender.cities.forEach((city, idx) => {
    if (city.isAlive !== false && getCurrentHp(city) > 0) {
      gameStore.skillFrozen[defender.name][idx] = {
        roundsLeft: 2,
        appliedRound: gameStore.currentRound
      }
    }
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"冰城奇观"，${defender.name}的所有城市2回合内无法使用技能！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 齐齐哈尔市 - 鹤城守护（战斗技能/被动）
 * 限2次，出战时给己方中心城市一个持续3回合的2000HP护盾，对方伤害优先打在护盾上
 */
export function handleQiqihaerSkill(attacker, skillData, addPublicLog, gameStore) {
  if (attacker.centerIndex === undefined) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"鹤城守护"，没有中心城市！`)
    return
  }

  const centerCity = attacker.cities[attacker.centerIndex]
  if (!centerCity || centerCity.isAlive === false) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"鹤城守护"，中心城市已阵亡！`)
    return
  }

  addShield(gameStore, attacker.name, attacker.centerIndex, {
    hp: 2000,
    roundsLeft: 3
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"鹤城守护"，${centerCity.name}获得2000HP护盾（持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 牡丹江市 - 镜泊湖光（战斗技能）
 * 限1次，选定己方一座城市进入镜泊湖光状态3回合，期间受到伤害时有50%概率反弹20%伤害给攻击者
 */
export function handleMudanjiangSkill(attacker, skillData, addPublicLog, gameStore, selectedCityIndex = null) {
  let targetCity, cityIndex

  if (selectedCityIndex !== null && selectedCityIndex !== undefined) {
    // 使用玩家选择的城市
    targetCity = attacker.cities[selectedCityIndex]
    cityIndex = selectedCityIndex
  } else {
    // 默认行为：选择HP最低的城市
    const aliveCities = getAliveCities(attacker)
    if (aliveCities.length === 0) {
      addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"镜泊湖光"，没有存活城市！`)
      return
    }
    const sorted = [...aliveCities].sort((a, b) => getCurrentHp(a) - getCurrentHp(b))
    targetCity = sorted[0]
    cityIndex = getCityIndex(attacker, targetCity)
  }

  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"镜泊湖光"，目标城市无效！`)
    return
  }

  // 初始化镜泊湖光状态
  if (!gameStore.mirrorLake) gameStore.mirrorLake = {}
  if (!gameStore.mirrorLake[attacker.name]) gameStore.mirrorLake[attacker.name] = {}

  gameStore.mirrorLake[attacker.name][cityIndex] = {
    roundsLeft: 3,
    reflectChance: 0.5,  // 50%概率
    reflectPercent: 0.2,  // 反弹20%伤害
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"镜泊湖光"，${targetCity.name}进入镜泊湖光状态3回合，受到伤害时有50%概率反弹20%伤害！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 佳木斯市 - 三江平原（非战斗技能/主动）
 * 限1次，给己方所有城市+1000HP
 */
export function handleJiamusSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"三江平原"，没有存活城市！`)
    return
  }

  let count = 0
  aliveCities.forEach(city => {
    increaseMaxHp(city, 1000)  // 使用增加HP（无上限）而非恢复HP
    count++
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"三江平原"，所有${count}座城市HP+1000！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 大庆市 - 石油之城（战斗技能）
 * 限2次，给己方2座城市+2000HP的护盾，接下来该城市出战时攻击力增加30%
 */
export function handleDaqingSkill(attacker, skillData, addPublicLog, gameStore, selectedCityIndices = null) {
  let citiesToBuff

  if (selectedCityIndices && Array.isArray(selectedCityIndices)) {
    // 使用玩家选择的城市
    citiesToBuff = selectedCityIndices.map(idx => ({ city: attacker.cities[idx], idx })).filter(item => item.city)
  } else {
    // 默认行为：选择HP最高的2座城市
    const aliveCities = getAliveCities(attacker)
    if (aliveCities.length === 0) {
      addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"石油之城"，没有存活城市！`)
      return
    }
    const sorted = [...aliveCities].sort((a, b) => getCurrentHp(b) - getCurrentHp(a))
    citiesToBuff = sorted.slice(0, 2).map(city => ({ city, idx: getCityIndex(attacker, city) }))
  }

  if (citiesToBuff.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"石油之城"，没有可选城市！`)
    return
  }

  const cityNames = []
  citiesToBuff.forEach(({ city, idx }) => {
    // 添加护盾
    addShield(gameStore, attacker.name, idx, {
      hp: 2000,
      roundsLeft: -1  // 永久护盾，直到被打破
    })

    // 添加攻击力增强
    if (!gameStore.attackBoost) gameStore.attackBoost = {}
    if (!gameStore.attackBoost[attacker.name]) gameStore.attackBoost[attacker.name] = {}

    gameStore.attackBoost[attacker.name][idx] = {
      multiplier: 1.3,  // 攻击力×1.3
      type: 'daqing',
      appliedRound: gameStore.currentRound
    }

    cityNames.push(city.name)
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"石油之城"，${cityNames.join('、')}获得2000HP护盾并在出战时攻击力增加30%！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 伊春市 - 林都迷踪（战斗技能/被动）
 * 限2次，出战时使对方随机一座城市在2回合内无法攻击己方城市
 */
export function handleYichunSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const defenderAliveCities = getAliveCities(defender)

  if (defenderAliveCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"林都迷踪"，对方没有存活城市！`)
    return
  }

  // 随机选择一座城市
  const randomCity = defenderAliveCities[Math.floor(Math.random() * defenderAliveCities.length)]
  const cityIndex = getCityIndex(defender, randomCity)

  // 初始化禁止攻击状态
  if (!gameStore.cannotAttack) gameStore.cannotAttack = {}
  if (!gameStore.cannotAttack[defender.name]) gameStore.cannotAttack[defender.name] = {}

  gameStore.cannotAttack[defender.name][cityIndex] = {
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"林都迷踪"，${defender.name}的${randomCity.name}在2回合内无法攻击！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 鸡西市 - 石墨之都（战斗技能/被动）
 * 限2次，出战时增加己方城市2000攻击力（被动触发）
 */
export function handleJixiSkill(attacker, skillData, addPublicLog, gameStore) {
  // 找到鸡西市在城市列表中的索引
  const jixiIndex = attacker.cities.findIndex(c => c.name === '鸡西市')

  if (jixiIndex === -1) {
    return
  }

  // 初始化临时攻击力加成
  if (!gameStore.tempAttackBoost) gameStore.tempAttackBoost = {}
  if (!gameStore.tempAttackBoost[attacker.name]) gameStore.tempAttackBoost[attacker.name] = {}

  gameStore.tempAttackBoost[attacker.name][jixiIndex] = {
    bonusAttack: 2000,
    roundsLeft: 1,  // 仅本回合有效
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"石墨之都"，鸡西市本回合攻击力+2000！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 双鸭山市 - 完达山（战斗技能/被动）
 * 限2次，出战时随机抵挡1-500伤害
 */
export function handleShuangyashanSkill(attacker, skillData, addPublicLog, gameStore) {
  // 找到双鸭山市在城市列表中的索引
  const cityIndex = attacker.cities.findIndex(c => c.name === '双鸭山市')

  if (cityIndex === -1) {
    return
  }

  // 随机抵挡1-500伤害
  const blockAmount = Math.floor(Math.random() * 500) + 1

  // 初始化伤害减免
  if (!gameStore.damageReduction) gameStore.damageReduction = {}
  if (!gameStore.damageReduction[attacker.name]) gameStore.damageReduction[attacker.name] = {}

  gameStore.damageReduction[attacker.name][cityIndex] = {
    amount: blockAmount,
    roundsLeft: 1,  // 仅本回合有效
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"完达山"，本回合抵挡${blockAmount}点伤害！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 黑河市 - 五大连池（战斗技能/被动）
 * 限1次，出战时使己方随机一座城市恢复至初始HP
 */
export function handleHeiheSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"五大连池"，没有存活城市！`)
    return
  }

  // 随机选择一座城市
  const randomCity = aliveCities[Math.floor(Math.random() * aliveCities.length)]

  // 恢复至初始HP
  const oldHp = getCurrentHp(randomCity)
  randomCity.currentHp = randomCity.hp

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"五大连池"，${randomCity.name}恢复至初始HP（${Math.floor(oldHp)} → ${randomCity.hp}）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 七台河市 - 奥运冠军（战斗技能/被动）
 * 限2次，出战时增加己方随机一座城市2000攻击力（被动触发）
 */
export function handleQitaiheSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"奥运冠军"，没有存活城市！`)
    return
  }

  // 随机选择一座城市
  const randomCity = aliveCities[Math.floor(Math.random() * aliveCities.length)]
  const cityIndex = getCityIndex(attacker, randomCity)

  // 初始化临时攻击力加成
  if (!gameStore.tempAttackBoost) gameStore.tempAttackBoost = {}
  if (!gameStore.tempAttackBoost[attacker.name]) gameStore.tempAttackBoost[attacker.name] = {}

  gameStore.tempAttackBoost[attacker.name][cityIndex] = {
    bonusAttack: 2000,
    roundsLeft: 1,  // 仅本回合有效
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"奥运冠军"，${randomCity.name}本回合攻击力+2000！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 大兴安岭地区 - 林海雪原（非战斗技能/主动）
 * 限1次，选定己方一座城市隐身2回合，期间无法被攻击但也不能攻击对方
 */
export function handleDaxinganlingSkill(attacker, skillData, addPublicLog, gameStore, selectedCityIndex = null) {
  let targetCity, cityIndex

  if (selectedCityIndex !== null && selectedCityIndex !== undefined) {
    // 使用玩家选择的城市
    targetCity = attacker.cities[selectedCityIndex]
    cityIndex = selectedCityIndex
  } else {
    // 默认行为：选择HP最高的城市
    const aliveCities = getAliveCities(attacker)
    if (aliveCities.length === 0) {
      addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"林海雪原"，没有存活城市！`)
      return
    }
    const sorted = [...aliveCities].sort((a, b) => getCurrentHp(b) - getCurrentHp(a))
    targetCity = sorted[0]
    cityIndex = getCityIndex(attacker, targetCity)
  }

  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"林海雪原"，目标城市无效！`)
    return
  }

  // 初始化林海雪原状态
  if (!gameStore.forestSnow) gameStore.forestSnow = {}
  if (!gameStore.forestSnow[attacker.name]) gameStore.forestSnow[attacker.name] = {}

  // 设置隐身状态
  gameStore.forestSnow[attacker.name][cityIndex] = {
    roundsLeft: 2,
    appliedRound: gameStore.currentRound,
    cannotDeploy: true,  // 不能派出攻击
    isHidden: true       // 变成未知城市
  }

  // 将该城市标记为所有对手的未知城市
  const players = gameStore.players || []
  players.forEach(player => {
    if (player.name !== attacker.name) {
      // 移除已知城市标记
      if (gameStore.knownCities && gameStore.knownCities[attacker.name]) {
        if (gameStore.knownCities[attacker.name][player.name]) {
          const knownSet = gameStore.knownCities[attacker.name][player.name]
          if (knownSet.has(cityIndex)) {
            knownSet.delete(cityIndex)
          }
        }
      }
    }
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"林海雪原"，${targetCity.name}隐身2回合，期间变成所有对手的未知城市且不能派出攻击！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
