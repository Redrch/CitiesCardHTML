/**
 * 内蒙古自治区城市专属技能
 * 包括：包头市、鄂尔多斯市、呼伦贝尔市、锡林郭勒盟、阿拉善盟
 * 无技能：呼和浩特市、乌海市、赤峰市、通辽市、巴彦淖尔市、乌兰察布市、兴安盟
 */

import {
  getAliveCities,
  getCurrentHp,
  getCityIndex,
  summonCity
} from './skillHelpers'

/**
 * 包头市 - 稀土之都
 * 限2次，己方使用城市专属技能时，你可以将该技能的一个数字×2
 */
export function handleBaotouSkill(player, skillData, addPublicLog, gameStore, targetSkillName = null, numberType = null) {
  // 检查使用次数
  const usageKey = `${player.name}_${skillData.cityName}_稀土之都`
  const usageCount = gameStore.skillUsageCount[usageKey] || 0

  if (usageCount >= 2) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"稀土之都"，已达使用次数上限（2次）！`)
    return
  }

  if (!targetSkillName || !numberType) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"稀土之都"，需要指定目标技能和数字类型！`)
    return
  }

  // 初始化稀土之都增强状态
  if (!gameStore.rareEarthBoost) gameStore.rareEarthBoost = {}
  if (!gameStore.rareEarthBoost[player.name]) gameStore.rareEarthBoost[player.name] = {}

  gameStore.rareEarthBoost[player.name][targetSkillName] = {
    numberType: numberType,  // 例如: 'duration', 'amount', 'hp', 'damage'
    multiplier: 2,
    appliedRound: gameStore.currentRound,
    duration: 1  // 仅对下一次使用有效
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"稀土之都"，技能"${targetSkillName}"的${numberType}数值将×2！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)

  // 记录使用次数
  if (!gameStore.skillUsageCount[usageKey]) {
    gameStore.skillUsageCount[usageKey] = 0
  }
  gameStore.skillUsageCount[usageKey]++
}

/**
 * 鄂尔多斯市 - 中国煤都
 * 锁定技，游戏开始时，获得15个"煤"，每次金币数量变化时，失去1个"煤"，
 * 该城市HP始终为初始HP×n（n为"煤"的个数），当"煤"的数量为0时，该城市阵亡
 */
export function handleEerduosiSkill(player, skillData, addPublicLog, gameStore) {
  const eerduosiIndex = getCityIndex(player, skillData.cityName)
  const eerduosiCity = player.cities[eerduosiIndex]

  if (!eerduosiCity) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"中国煤都"，城市不存在！`)
    return
  }

  // 初始化煤炭状态
  if (!gameStore.coalReserve) gameStore.coalReserve = {}

  // 游戏开始时获得15个煤
  gameStore.coalReserve[player.name] = {
    cityIndex: eerduosiIndex,
    coalCount: 15,
    initialHp: eerduosiCity.hp,
    appliedRound: gameStore.currentRound
  }

  // 计算当前HP
  const newHp = eerduosiCity.hp * 15
  eerduosiCity.hp = newHp
  eerduosiCity.currentHp = newHp

  addPublicLog(`${player.name}的${skillData.cityName}激活"中国煤都"，获得15个"煤"，HP变为${newHp}（初始HP×15）！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 呼伦贝尔市 - 草原牧场
 * 出牌阶段限1次，获得1个HP≤1000的城市
 */
export function handleHulunbeierSkill(player, skillData, addPublicLog, gameStore) {
  // 检查本回合是否已使用
  const usageKey = `${player.name}_${skillData.cityName}_草原牧场_round${gameStore.currentRound}`
  if (gameStore.skillUsageThisRound && gameStore.skillUsageThisRound[usageKey]) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"草原牧场"，本回合已使用！`)
    return
  }

  // 获取城市数据库
  const cityDatabase = gameStore.cityDatabase || []

  // 筛选HP≤1000的城市
  const availableCities = cityDatabase.filter(cityData => {
    return cityData.hp <= 1000 && !player.cities.some(c => c.name === cityData.name)
  })

  if (availableCities.length === 0) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"草原牧场"，没有可获得的HP≤1000城市！`)
    return
  }

  // 随机选择一座城市
  const randomCity = availableCities[Math.floor(Math.random() * availableCities.length)]
  summonCity(player, randomCity.name, gameStore, addPublicLog)

  // 记录本回合使用
  if (!gameStore.skillUsageThisRound) gameStore.skillUsageThisRound = {}
  gameStore.skillUsageThisRound[usageKey] = true

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 锡林郭勒盟 - 元上都
 * 冷却4回合，花费n金币掠夺对方的一个已知非中心城市（n为该城市的[HP/3000]）
 */
export function handleXilinguoleSkill(player, skillData, addPublicLog, gameStore, targetPlayer = null, targetCityIndex = null) {
  if (!targetPlayer || targetCityIndex === null) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"元上都"，未指定目标！`)
    return
  }

  const targetCity = targetPlayer.cities[targetCityIndex]
  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"元上都"，目标城市无效或已阵亡！`)
    return
  }

  // 检查是否为中心城市
  if (targetCityIndex === (targetPlayer.centerIndex || 0)) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"元上都"，不能掠夺对方中心城市！`)
    return
  }

  // 检查是否为已知城市
  const isKnown = gameStore.knownCities && gameStore.knownCities[player.name] &&
                  gameStore.knownCities[player.name][targetPlayer.name] &&
                  gameStore.knownCities[player.name][targetPlayer.name].has(targetCityIndex)

  if (!isKnown) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"元上都"，目标城市不是已知城市！`)
    return
  }

  // 计算金币消耗：[HP/3000]
  const goldCost = Math.floor(getCurrentHp(targetCity) / 3000)

  if (player.gold < goldCost) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"元上都"，金币不足（需要${goldCost}金币）！`)
    return
  }

  // 扣除金币
  player.gold -= goldCost

  // 掠夺城市
  const capturedCity = targetPlayer.cities.splice(targetCityIndex, 1)[0]

  // 重置为初始状态
  capturedCity.currentHp = capturedCity.hp
  capturedCity.isAlive = true

  // 添加到己方
  player.cities.push(capturedCity)

  addPublicLog(`${player.name}的${skillData.cityName}激活"元上都"，花费${goldCost}金币掠夺了${targetPlayer.name}的${capturedCity.name}！`)

  // 设置冷却
  if (!gameStore.skillCooldown) gameStore.skillCooldown = {}
  if (!gameStore.skillCooldown[player.name]) gameStore.skillCooldown[player.name] = {}
  gameStore.skillCooldown[player.name][skillData.cityName] = {
    roundsLeft: 4,
    appliedRound: gameStore.currentRound
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 阿拉善盟 - 载人航天
 * 限1次，选择一个己方城市，进入空间站，10轮后返回。
 * 空间站内的城市不可被对方的技能选择，不受到伤害，返回时获得"忻州市""文昌市""凉山州"中的一个城市。
 * 阿拉善盟初始时位于空间站内，可随时返回。
 */
export function handleAlashanSkill(player, skillData, addPublicLog, gameStore, selectedCityIndex = null, action = 'send') {
  const alashanIndex = getCityIndex(player, skillData.cityName)

  // 初始化空间站状态
  if (!gameStore.spaceStation) gameStore.spaceStation = {}
  if (!gameStore.spaceStation[player.name]) gameStore.spaceStation[player.name] = {}

  // 阿拉善盟初始在空间站
  if (!gameStore.spaceStation[player.name][alashanIndex]) {
    gameStore.spaceStation[player.name][alashanIndex] = {
      inStation: true,
      enterRound: 0,
      returnRound: null,
      isInitial: true  // 标记为初始状态
    }
  }

  if (action === 'send') {
    // 送城市进入空间站
    if (selectedCityIndex === null) {
      addPublicLog(`${player.name}的${skillData.cityName}无法激活"载人航天"，需要选择一座城市！`)
      return
    }

    const targetCity = player.cities[selectedCityIndex]
    if (!targetCity || targetCity.isAlive === false) {
      addPublicLog(`${player.name}的${skillData.cityName}无法激活"载人航天"，目标城市无效或已阵亡！`)
      return
    }

    // 检查是否已在空间站
    if (gameStore.spaceStation[player.name][selectedCityIndex]) {
      addPublicLog(`${player.name}的${skillData.cityName}无法激活"载人航天"，目标城市已在空间站！`)
      return
    }

    // 送入空间站
    gameStore.spaceStation[player.name][selectedCityIndex] = {
      inStation: true,
      enterRound: gameStore.currentRound,
      returnRound: gameStore.currentRound + 10,
      isInitial: false
    }

    addPublicLog(`${player.name}的${skillData.cityName}激活"载人航天"，${targetCity.name}进入空间站，10回合后返回！`)
    gameStore.recordSkillUsage(player.name, skillData.cityName)

  } else if (action === 'return') {
    // 阿拉善盟返回（只有初始在空间站的可以随时返回）
    const alashanStation = gameStore.spaceStation[player.name][alashanIndex]

    if (!alashanStation || !alashanStation.inStation) {
      addPublicLog(`${player.name}的${skillData.cityName}无法返回，未在空间站！`)
      return
    }

    if (!alashanStation.isInitial) {
      addPublicLog(`${player.name}的${skillData.cityName}无法返回，只有初始进入空间站的阿拉善盟可以随时返回！`)
      return
    }

    // 返回并获得奖励城市
    alashanStation.inStation = false

    const rewardCities = ['忻州市', '文昌市', '凉山州']
    const availableRewards = rewardCities.filter(cityName => {
      return !player.cities.some(c => c.name === cityName)
    })

    if (availableRewards.length > 0) {
      const randomReward = availableRewards[Math.floor(Math.random() * availableRewards.length)]
      summonCity(player, randomReward, gameStore, addPublicLog)
      addPublicLog(`${player.name}的${skillData.cityName}从空间站返回，并获得了${randomReward}！`)
    } else {
      addPublicLog(`${player.name}的${skillData.cityName}从空间站返回！`)
    }
  }
}
