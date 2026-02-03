/**
 * 新疆维吾尔自治区城市专属技能
 * 包括：乌鲁木齐、克拉玛依、吐鲁番、哈密、昌吉回族自治州、博尔塔拉蒙古自治州、巴音郭楞蒙古自治州、阿克苏地区、喀什地区、和田地区、伊犁哈萨克自治州、塔城地区、阿勒泰地区、石河子
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
 * 乌鲁木齐市 - 亚洲中心
 * 当该城市为中心时，攻击力永久为80000；当该城市不为中心时，视为副中心
 */
export function handleWulumuqiSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能：检查是否为中心
  const cityName = skillData.cityName
  const centerCityName = attacker.centerCityName ?? 0
  const isCenter = cityName === centerCityName

  if (!gameStore.asiaCenter) gameStore.asiaCenter = {}
  gameStore.asiaCenter[attacker.name] = {
    active: true,
    cityName: cityName,
    isCenter: isCenter,
    centerAttackPower: 80000,
    subCenterMultiplier: 1.5
  }

  const status = isCenter ? '中心城市（攻击力80000）' : '副中心（攻击力×1.5）'
  addPublicLog(`${attacker.name}的${skillData.cityName}"亚洲中心"被动效果已激活（${status}）！`)
}

/**
 * 克拉玛依市 - 黑油山，魔鬼城
 * 限2次，令敌方和己方各自亮出一个城市，若己方城市HP更大，获得敌方亮出的城市；若己方城市HP更小，该城市复制一个敌方已知城市的专属技能
 */
export function handleKelamayiSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const selfCities = getAliveCities(attacker)
  const enemyCities = getAliveCities(defender)

  if (selfCities.length === 0 || enemyCities.length === 0) return

  const selfCity = getRandomElement(selfCities)
  const enemyCity = getRandomElement(enemyCities)

  const selfHp = getCurrentHp(selfCity)
  const enemyHp = getCurrentHp(enemyCity)

  if (selfHp > enemyHp) {
    // 获得敌方城市
    const enemyIndex = defender.cities.indexOf(enemyCity)
    enemyCity.isAlive = false
    enemyCity.currentHp = 0
    enemyCity.hp = 0

    const capturedCity = { ...enemyCity, currentHp: enemyHp, hp: enemyHp, isAlive: true }
    attacker.cities[capturedCity.name] = capturedCity

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"黑油山，魔鬼城"，${selfCity.name}（${selfHp}HP）战胜${enemyCity.name}（${enemyHp}HP），获得该城市！`)
  } else {
    // 复制敌方技能
    if (!gameStore.copiedSkills) gameStore.copiedSkills = {}
    if (!gameStore.copiedSkills[attacker.name]) gameStore.copiedSkills[attacker.name] = {}

    const cityName = skillData.cityName
    gameStore.copiedSkills[attacker.name][cityName] = {
      active: true,
      copiedFrom: enemyCity.name,
      copiedSkill: enemyCity.citySkill
    }

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"黑油山，魔鬼城"，${selfCity.name}（${selfHp}HP）不敌${enemyCity.name}（${enemyHp}HP），复制其技能！`)
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 吐鲁番市 - 红山，洼地
 * 冷却2回合，令敌方HP最高的城市受到灼烧伤害，每回合减少20%HP，直到变为HP最低的城市，灼烧可叠加
 */
export function handleTulufanSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(defender)
  if (aliveCities.length === 0) return

  // 找到HP最高的城市
  let maxHp = 0
  let targetCity = null
  aliveCities.forEach(city => {
    const hp = getCurrentHp(city)
    if (hp > maxHp) {
      maxHp = hp
      targetCity = city
    }
  })

  if (!targetCity) return

  const cityName = defender.cities.indexOf(targetCity)

  if (!gameStore.burnEffect) gameStore.burnEffect = {}
  if (!gameStore.burnEffect[defender.name]) gameStore.burnEffect[defender.name] = {}

  // 灼烧可叠加
  if (!gameStore.burnEffect[defender.name][cityName]) {
    gameStore.burnEffect[defender.name][cityName] = {
      active: true,
      stacks: 0,
      percentPerStack: 0.2,
      stopWhenLowest: true
    }
  }
  gameStore.burnEffect[defender.name][cityName].stacks += 1

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"红山，洼地"，${defender.name}的${targetCity.name}受到灼烧（每回合-20%HP）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 哈密市 - 甜蜜之旅
 * 游戏开始时，获得3个"蜜瓜"，任意分配给己方城市；每次出战时，选择一个己方城市获得"蜜瓜"；拥有"蜜瓜"的城市，伤害*2，受到超过15000伤害时，"蜜瓜"消失；"蜜瓜"可叠加
 */
export function handleHamiSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能：记录蜜瓜系统
  if (!gameStore.melonTokens) gameStore.melonTokens = {}
  if (!gameStore.melonTokens[attacker.name]) {
    gameStore.melonTokens[attacker.name] = {
      active: true,
      initialTokens: 3,
      damageMultiplier: 2,
      lossThreshold: 15000,
      cityTokens: {}  // cityName -> token count
    }
  }

  // 分配初始蜜瓜给随机城市
  const aliveCities = getAliveCities(attacker)
  for (let i = 0; i < 3; i++) {
    const city = getRandomElement(aliveCities)
    const cityName = attacker.cities.indexOf(city)
    if (!gameStore.melonTokens[attacker.name].cityTokens[cityName]) {
      gameStore.melonTokens[attacker.name].cityTokens[cityName] = 0
    }
    gameStore.melonTokens[attacker.name].cityTokens[cityName] += 1
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"甜蜜之旅"被动效果已激活，分配了3个蜜瓜！`)
}

/**
 * 昌吉回族自治州 - 天山，天池
 * 限1次，恢复己方所有城市的专属技能至初始状态
 */
export function handleChangjiSkill(attacker, skillData, addPublicLog, gameStore) {
  // 重置所有技能使用记录
  if (!gameStore.skillReset) gameStore.skillReset = {}
  gameStore.skillReset[attacker.name] = {
    active: true,
    resetAllSkills: true,
    appliedRound: gameStore.currentRound
  }

  // 清除该玩家的所有技能使用记录
  if (gameStore.skillUsage && gameStore.skillUsage[attacker.name]) {
    gameStore.skillUsage[attacker.name] = {}
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"天山，天池"，所有城市技能已重置！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 博尔塔拉蒙古自治州 - 西洋之泪
 * 获得"溢出伤害湖"，存储己方溢出伤害的50%。出牌阶段，可选择清空该湖，对对方本回合出战城市造成等量的额外伤害
 */
export function handleBoertalaSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能：记录溢出伤害湖
  if (!gameStore.overflowLake) gameStore.overflowLake = {}
  gameStore.overflowLake[attacker.name] = {
    active: true,
    storedDamage: 0,
    storagePercent: 0.5,
    canActivate: true
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"西洋之泪"被动效果已激活，开始存储溢出伤害！`)
}

/**
 * 巴音郭楞蒙古自治州 - 罗布泊
 * 限1次，指定对方一个城市陷入失踪状态5回合，期间不可出战，不可被技能选中，每回合对双方出战城市造成等同其HP的伤害
 */
export function handleBayinguolengSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(defender)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityName = defender.cities.indexOf(targetCity)
  const targetHp = getCurrentHp(targetCity)

  if (!gameStore.missingState) gameStore.missingState = {}
  if (!gameStore.missingState[defender.name]) gameStore.missingState[defender.name] = {}

  gameStore.missingState[defender.name][cityName] = {
    active: true,
    roundsLeft: 5,
    damagePerRound: targetHp,
    appliedRound: gameStore.currentRound,
    cannotBattle: true,
    untargetable: true
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"罗布泊"，${defender.name}的${targetCity.name}失踪5回合！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 阿克苏地区 - 冰糖心
 * 锁定技，该城市不受"清除加成"和其他减益效果影响
 */
export function handleAkesuSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能：免疫减益
  const cityName = skillData.cityName

  if (!gameStore.debuffImmune) gameStore.debuffImmune = {}
  if (!gameStore.debuffImmune[attacker.name]) gameStore.debuffImmune[attacker.name] = {}

  gameStore.debuffImmune[attacker.name][cityName] = {
    active: true,
    immuneToDebuff: true,
    immuneToClearBuff: true,
    lockSkill: true
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"冰糖心"锁定技已激活，免疫所有减益！`)
}

/**
 * 喀什地区 - 喀喇昆仑
 * 每个城市限1次，你可以令己方HP唯一最高城市的HP*2
 */
export function handleKashiSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  // 找到HP最高的城市
  let maxHp = 0
  let highestCity = null
  let count = 0

  aliveCities.forEach(city => {
    const hp = getCurrentHp(city)
    if (hp > maxHp) {
      maxHp = hp
      highestCity = city
      count = 1
    } else if (hp === maxHp) {
      count += 1
    }
  })

  // 必须是唯一最高
  if (count !== 1 || !highestCity) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"喀喇昆仑"，没有唯一HP最高的城市！`)
    return
  }

  const newHp = maxHp * 2
  highestCity.currentHp = newHp
  highestCity.hp = newHp

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"喀喇昆仑"，${highestCity.name}的HP翻倍（${maxHp} -> ${newHp}）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 和田地区 - 玉石之路
 * 选择对方一个出战城市的"所属省份""HP""城市专属技能"中1项与该城市交换
 */
export function handleHetianSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const selfCities = getAliveCities(attacker)
  const enemyCities = getAliveCities(defender)

  if (selfCities.length === 0 || enemyCities.length === 0) return

  const targetCity = getRandomElement(enemyCities)
  const selfCity = Object.values(attacker.cities).find(c => c.name === skillData.cityName)

  if (!selfCity) return

  // 随机选择一个属性交换
  const attributes = ['province', 'hp', 'skill']
  const selectedAttr = getRandomElement(attributes)

  if (selectedAttr === 'province') {
    const tempProvince = selfCity.province
    selfCity.province = targetCity.province
    targetCity.province = tempProvince
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"玉石之路"，与${targetCity.name}交换了所属省份！`)
  } else if (selectedAttr === 'hp') {
    const tempHp = getCurrentHp(selfCity)
    const targetHp = getCurrentHp(targetCity)
    selfCity.currentHp = targetHp
    selfCity.hp = targetHp
    targetCity.currentHp = tempHp
    targetCity.hp = tempHp
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"玉石之路"，与${targetCity.name}交换了HP！`)
  } else {
    const tempSkill = selfCity.citySkill
    selfCity.citySkill = targetCity.citySkill
    targetCity.citySkill = tempSkill
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"玉石之路"，与${targetCity.name}交换了专属技能！`)
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 伊犁哈萨克自治州 - 丝路风情，塞外江南
 * 转换技，游戏开始时为阴，每回合切换阴阳状态。阴：己方每获得1个城市，获得3个金币；阳：你可以弃置1个城市，对对方所有城市造成[n/m]伤害（n为该城市血量，m为己方城市数量）
 */
export function handleYiliSkill(attacker, skillData, addPublicLog, gameStore) {
  // 转换技：记录阴阳状态
  if (!gameStore.yiliToggle) gameStore.yiliToggle = {}
  if (!gameStore.yiliToggle[attacker.name]) {
    gameStore.yiliToggle[attacker.name] = {
      active: true,
      isYin: true,  // 开始为阴
      yinEffect: { goldPerCity: 3 },
      yangEffect: { sacrificeDamage: true },
      lastToggled: gameStore.currentRound
    }
  }

  const currentState = gameStore.yiliToggle[attacker.name].isYin ? '阴' : '阳'
  addPublicLog(`${attacker.name}的${skillData.cityName}"丝路风情，塞外江南"转换技已激活（当前：${currentState}）！`)
}

/**
 * 塔城地区 - 沙湾大盘鸡
 * 限2次，结算阶段，取消本次对战的所有伤害（不返还金币）
 */
export function handleTachengSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.cancelBattle) gameStore.cancelBattle = {}
  gameStore.cancelBattle[attacker.name] = {
    active: true,
    currentRound: gameStore.currentRound,
    cancelAllDamage: true
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"沙湾大盘鸡"，本次对战的所有伤害将被取消！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 阿勒泰地区 - 水塔雪都，额河之源
 * 己方城市数量变化时，获得1个"雪"。出牌阶段，你可以清空所有"雪"，选择一个初始HP不大于4^n（n为"雪"的数量）的北方（华北、东北、西北）城市获得
 */
export function handleAletaiSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能：记录雪系统
  if (!gameStore.snowTokens) gameStore.snowTokens = {}
  if (!gameStore.snowTokens[attacker.name]) {
    gameStore.snowTokens[attacker.name] = {
      active: true,
      tokens: 0,
      canSummonCity: true,
      regionFilter: ['华北', '东北', '西北']
    }
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"水塔雪都，额河之源"被动效果已激活！`)
}

/**
 * 石河子市 - 军垦第一连
 * 该城市出战时，随机获得1个新疆兵团城市；每获得一个同省城市，该城市HP*n（n为己方同省城市总数）
 */
export function handleShiheziSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能：记录军垦系统
  const cityName = skillData.cityName

  if (!gameStore.militaryReclamation) gameStore.militaryReclamation = {}
  if (!gameStore.militaryReclamation[attacker.name]) {
    gameStore.militaryReclamation[attacker.name] = {}
  }

  gameStore.militaryReclamation[attacker.name][cityName] = {
    active: true,
    summonOnBattle: true,
    provinceBonus: true,
    hpMultiplierByProvince: true
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"军垦第一连"被动效果已激活！`)
}
