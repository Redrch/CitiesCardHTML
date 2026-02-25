/**
 * 贵州省城市专属技能
 * 包括：贵阳、六盘水、遵义、铜仁、黔西南州、毕节、安顺、黔东南州、黔南州
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
 * 贵阳市 - 大数据中心
 * 限1次，使用时记录己方2回合内对对方造成的伤害，记录结束后任意一回合对对方出战城市造成记录伤害的50%，上限10000
 */
export function handleGuiyangSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.bigDataCenter) gameStore.bigDataCenter = {}
  gameStore.bigDataCenter[attacker.name] = {
    active: true,
    recording: true,
    recordedDamage: 0,
    recordDuration: 2,
    damagePercent: 0.5,
    damageLimit: 10000,
    startRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"大数据中心"，开始记录伤害（持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 六盘水市 - 中国凉都
 * 限1次，归顺对方所有市政府位于北回归线以南的城市（HP低于20000）
 */
export function handleLiupanshuiSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  // 北回归线以南的城市列表（简化处理）
  const southernCities = [
    '广州市', '深圳市', '珠海市', '汕头市', '湛江市', '茂名市', '海口市', '三亚市',
    '南宁市', '桂林市', '北海市', '昆明市', '西双版纳州', '三亚市'
  ]

  const eligibleCities = Object.values(defender.cities).filter(city =>
    city.isAlive !== false &&
    getCurrentHp(city) < 20000 &&
    southernCities.includes(city.name)
  )

  if (eligibleCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"中国凉都"，但没有符合条件的城市！`)
    gameStore.recordSkillUsage(attacker.name, skillData.cityName)
    return
  }

  let surrenderedCount = 0
  eligibleCities.forEach(city => {
    const cityHp = getCurrentHp(city)
    city.isAlive = false
    city.currentHp = 0
    city.hp = 0

    const surrenderedCity = { ...city, currentHp: cityHp, hp: cityHp, isAlive: true }
    attacker.cities[surrenderedCity.name] = surrenderedCity
    surrenderedCount++
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"中国凉都"，归顺了${surrenderedCount}个北回归线以南的城市！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 遵义市 - 红色会址，茅台飘香
 * 当己方城市数量首次低于3个时，使己方中心城市攻击力提高20%，并恢复己方剩余城市的HP至初始HP并选定一座城市攻击力增加50%，保留有加成的城市，此后当己方阵亡一座城市，额外获得2金币
 */
export function handleZunyiSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能：当城市数量低于3时触发
  if (!gameStore.zunyiAwakening) gameStore.zunyiAwakening = {}
  gameStore.zunyiAwakening[attacker.name] = {
    active: true,
    triggered: false,
    threshold: 3,
    centerPowerBonus: 1.2,
    selectedCityPowerBonus: 1.5,
    goldPerDeadCity: 2
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"红色会址，茅台飘香"被动效果已激活！`)
}

/**
 * 铜仁市 - 梵净金顶
 * 限1次，选定己方一座城市，为其施加保护状态，不消耗金币
 */
export function handleTongrenSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityName = targetCity.name

  if (!gameStore.cityProtection) gameStore.cityProtection = {}
  if (!gameStore.cityProtection[attacker.name]) gameStore.cityProtection[attacker.name] = {}

  gameStore.cityProtection[attacker.name][cityName] = {
    active: true,
    noCost: true,
    protected: true
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"梵净金顶"，${targetCity.name}获得免费保护！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 黔西南州 - 中国金州
 * 每回合为己方产出1金币，当对方使用"釜底抽薪"技能时，该技能无效，金币产生能力停止
 */
export function handleQianxinanSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能：每回合产金币
  if (!gameStore.goldProduction) gameStore.goldProduction = {}
  gameStore.goldProduction[attacker.name] = {
    active: true,
    goldPerRound: 1,
    blockSkill: '釜底抽薪',
    canBeDisabled: true
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"中国金州"被动效果已激活，每回合产出1金币！`)
}

/**
 * 毕节市 - 百里杜鹃
 * 限2次，选定己方一座出战城市附加一层「杜鹃花」，若该城市存活则多叠加一层，叠加至5层时，对对方所有城市造成自身HP50%的伤害，上限5000
 */
export function handleBijieSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityName = targetCity.name

  if (!gameStore.azaleaStacks) gameStore.azaleaStacks = {}
  if (!gameStore.azaleaStacks[attacker.name]) gameStore.azaleaStacks[attacker.name] = {}

  if (!gameStore.azaleaStacks[attacker.name][cityName]) {
    gameStore.azaleaStacks[attacker.name][cityName] = {
      active: true,
      stacks: 0,
      maxStacks: 5,
      damagePercent: 0.5,
      damageLimit: 5000
    }
  }

  gameStore.azaleaStacks[attacker.name][cityName].stacks += 1
  const currentStacks = gameStore.azaleaStacks[attacker.name][cityName].stacks

  if (currentStacks >= 5) {
    // 触发伤害
    const cityHp = getCurrentHp(targetCity)
    const damage = Math.min(Math.floor(cityHp * 0.5), 5000)

    getAliveCities(defender).forEach(city => {
      damageCity(city, damage)
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"百里杜鹃"，${targetCity.name}的杜鹃花叠满5层，对${defender.name}所有城市造成${damage}伤害！`)
    gameStore.azaleaStacks[attacker.name][cityName].stacks = 0
  } else {
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"百里杜鹃"，${targetCity.name}获得杜鹃花（${currentStacks}/5层）！`)
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 安顺市 - 黄果树瀑布
 * 己方获得安顺市时获得5点「滔滔河水」，出战安顺市时可选择消耗「滔滔河水」，每消耗一层使安顺市伤害增加50%，每次最多消耗3点
 */
export function handleAnshunSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能：记录河水token
  const cityName = skillData.cityName

  if (!gameStore.waterfallTokens) gameStore.waterfallTokens = {}
  if (!gameStore.waterfallTokens[attacker.name]) {
    gameStore.waterfallTokens[attacker.name] = {}
  }

  if (!gameStore.waterfallTokens[attacker.name][cityName]) {
    gameStore.waterfallTokens[attacker.name][cityName] = {
      active: true,
      tokens: 5,
      damageBoostPerToken: 0.5,
      maxTokensPerUse: 3
    }
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"黄果树瀑布"被动效果已激活，获得5点「滔滔河水」！`)
}

/**
 * 黔东南州 - 歌舞之州
 * 限3次，使己方可以派出4个城市出战
 */
export function handleQiandongnanSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.extraDeploySlot) gameStore.extraDeploySlot = {}
  gameStore.extraDeploySlot[attacker.name] = {
    active: true,
    extraSlots: 1,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"歌舞之州"，本回合可派出4个城市出战！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 黔南州 - 中国天眼
 * 回合开始时随机显示对方1个未知城市，若对方所有城市都已成为已知城市，摸一张战斗力高于黔南州城市牌并弃置自己
 */
export function handleQiannanSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  // 被动技能：每回合揭示城市
  if (!gameStore.chinaEye) gameStore.chinaEye = {}
  gameStore.chinaEye[attacker.name] = {
    active: true,
    revealPerRound: 1,
    drawIfAllKnown: true,
    drawCondition: 'higherPower'
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"中国天眼"被动效果已激活！`)
}
