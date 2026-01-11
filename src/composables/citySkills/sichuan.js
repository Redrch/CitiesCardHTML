/**
 * 四川省城市专属技能
 * 包括：成都、绵阳、自贡、泸州、德阳、广元、内江、乐山、资阳、宜宾、南充、雅安、阿坝州、甘孜州、凉山州、眉山
 */

import {
  getAliveCities,
  getCurrentHp,
  findCity,
  healCity,
  damageCity,
  boostCityHp,
  addShield,
  getRandomElement
} from './skillHelpers'

/**
 * 成都市 - 千年水利，天府之国
 * 限1次，当自身归顺四川省城市时，可以多归顺一座对方HP低于10000的随机城市，当己方归顺的城市阵亡时，使成都市的攻击力增加10%，上限30%
 */
export function handleChengduSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  // 记录归顺加成状态
  if (!gameStore.chengduSurrenderBonus) gameStore.chengduSurrenderBonus = {}
  if (!gameStore.chengduSurrenderBonus[attacker.name]) {
    gameStore.chengduSurrenderBonus[attacker.name] = {
      active: true,
      powerBoost: 0,
      maxBoost: 0.3,
      surrenderedCities: []
    }
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"千年水利，天府之国"，归顺额外效果已激活！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 绵阳市 - 诗仙故里
 * 限1次，60秒内，说n首李白的诗文（含诗题和正文部分）使自身HPxn
 */
export function handleMianyangSkill(attacker, skillData, addPublicLog, gameStore) {
  // 此技能需要特殊UI支持，暂时给予固定加成（实际需要玩家输入诗歌）
  const cityIndex = attacker.cities.findIndex(c => c.name === skillData.cityName)
  const city = attacker.cities[cityIndex]

  if (!city) return

  // 模拟：假设玩家能背诵2-3首诗
  const poemCount = 2 + Math.floor(Math.random() * 2) // 2或3
  const currentHp = getCurrentHp(city)
  const newHp = currentHp * poemCount

  city.currentHp = newHp
  city.hp = newHp

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"诗仙故里"，背诵${poemCount}首李白诗文，HP×${poemCount}！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 自贡市 - 盐井花灯
 * 限2次，派出自贡出战时，己方召唤2个「花灯」，生命值为当前自贡的生命值，对方的伤害会优先打在花灯上，每使一个花灯阵亡，可夺走对方一座HP低于1500的城市
 */
export function handleZigongSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const cityIndex = attacker.cities.findIndex(c => c.name === skillData.cityName)
  const city = attacker.cities[cityIndex]

  if (!city) return

  const lanternHp = getCurrentHp(city)

  // 创建花灯召唤物
  if (!gameStore.lanternSummons) gameStore.lanternSummons = {}
  if (!gameStore.lanternSummons[attacker.name]) gameStore.lanternSummons[attacker.name] = []

  gameStore.lanternSummons[attacker.name].push(
    { hp: lanternHp, active: true },
    { hp: lanternHp, active: true }
  )

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"盐井花灯"，召唤2个花灯（各${lanternHp}HP）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 泸州市 - 泸州老窖
 * 限1次，选定对方一座初始HP低于10000的城市恢复至初始HP并有50%概率归顺，若该技能没有归顺城市或该城市使用定海神针等可不被归顺的技能，则使己方金币+5
 */
export function handleLuzhouSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const eligibleCities = defender.cities.filter(city =>
    city.isAlive !== false && (city.initialHp || city.hp) < 10000
  )

  if (eligibleCities.length === 0) {
    attacker.gold += 5
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"泸州老窖"，但无法找到目标城市，金币+5！`)
    gameStore.recordSkillUsage(attacker.name, skillData.cityName)
    return
  }

  const targetCity = getRandomElement(eligibleCities)
  const initialHp = targetCity.initialHp || targetCity.hp

  // 恢复至初始HP
  targetCity.currentHp = initialHp
  targetCity.hp = initialHp

  // 50%概率归顺
  if (Math.random() < 0.5) {
    // 归顺成功
    const cityIndex = defender.cities.indexOf(targetCity)
    targetCity.isAlive = false
    targetCity.currentHp = 0
    targetCity.hp = 0

    const surrenderedCity = { ...targetCity, currentHp: initialHp, hp: initialHp, isAlive: true }
    attacker.cities.push(surrenderedCity)

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"泸州老窖"，${targetCity.name}归顺成功！`)
  } else {
    // 归顺失败，金币+5
    attacker.gold += 5
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"泸州老窖"，${targetCity.name}归顺失败，金币+5！`)
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 德阳市 - 三星堆遗址
 * 限1次，隐藏己方数据1回合，主持人仅播报对方出战城市血量剩余及金币
 */
export function handleDeyangSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.dataHidden) gameStore.dataHidden = {}
  gameStore.dataHidden[attacker.name] = {
    active: true,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"三星堆遗址"，数据将隐藏1回合！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 广元市 - 剑门蜀道
 * 限1次，出战时双方撤退，当轮对方出战城市攻击己方下一轮的出战城市
 */
export function handleGuangyuanSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  if (!gameStore.delayedAttack) gameStore.delayedAttack = {}
  gameStore.delayedAttack[`${defender.name}->${attacker.name}`] = {
    active: true,
    nextRound: true,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"剑门蜀道"，双方撤退，对方攻击将延迟到下一轮！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 内江市 - 中国甜都
 * 己方中心城市每出战一次，就使内江市获得一层「甜度」，当「甜度」到达5时，使内江市强制出战，攻击力x10，并消耗所有「甜度」
 */
export function handleNeijiangSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能，记录在gameStore中
  if (!gameStore.neijiangSweetness) gameStore.neijiangSweetness = {}
  if (!gameStore.neijiangSweetness[attacker.name]) {
    gameStore.neijiangSweetness[attacker.name] = {
      stacks: 0,
      threshold: 5
    }
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"中国甜都"被动效果已激活！`)
}

/**
 * 乐山市 - 峨眉金顶，乐山大佛
 * 限1次，前3回合出战时对方对乐山市造成的伤害减少80%
 */
export function handleLeshanSkill(attacker, skillData, addPublicLog, gameStore) {
  const cityIndex = attacker.cities.findIndex(c => c.name === skillData.cityName)

  if (!gameStore.damageReduction) gameStore.damageReduction = {}
  if (!gameStore.damageReduction[attacker.name]) gameStore.damageReduction[attacker.name] = {}
  if (!gameStore.damageReduction[attacker.name][cityIndex]) {
    gameStore.damageReduction[attacker.name][cityIndex] = {}
  }

  gameStore.damageReduction[attacker.name][cityIndex].emeiDefense = {
    active: true,
    multiplier: 0.2,  // 减少80%伤害
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"峨眉金顶，乐山大佛"，受到伤害减少80%（持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 资阳市 - 安岳柠檬
 * 限3次，己方出战城市附带「柠檬酸」，「柠檬酸」固定造成对方10%HP上限的伤害
 */
export function handleZiyangSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  if (!gameStore.lemonAcid) gameStore.lemonAcid = {}
  gameStore.lemonAcid[attacker.name] = {
    active: true,
    percent: 0.1,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"安岳柠檬"，本回合出战城市附带柠檬酸（对方10%HP伤害）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 宜宾市 - 五粮液
 * 限1次，消耗自身50%血量恢复己方一座城市至50%初始HP
 */
export function handleYibinSkill(attacker, skillData, addPublicLog, gameStore) {
  const yibinCity = attacker.cities.find(c => c.name === skillData.cityName)
  if (!yibinCity) return

  const aliveCities = getAliveCities(attacker).filter(c => c.name !== skillData.cityName)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const targetInitialHp = targetCity.initialHp || targetCity.hp
  const healAmount = Math.floor(targetInitialHp * 0.5)

  // 消耗宜宾50%血量
  const yibinCurrentHp = getCurrentHp(yibinCity)
  yibinCity.currentHp = Math.floor(yibinCurrentHp * 0.5)
  yibinCity.hp = yibinCity.currentHp

  // 恢复目标城市
  targetCity.currentHp = (getCurrentHp(targetCity) + healAmount)
  targetCity.hp = targetCity.currentHp

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"五粮液"，消耗自身50%HP，${targetCity.name}恢复${healAmount}HP！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 南充市 - 阆中古城
 * 限1次，选定对方一座使用过快速医疗/高级医疗的城市，使其HP恢复到使用快速医疗/高级医疗前的状态，随后该城市仅可使用1次快速医疗/高级医疗且增加3金币花费
 */
export function handleNanchongSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  // 此功能需要记录治疗历史，暂时简化处理
  const aliveCities = getAliveCities(defender)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityIndex = defender.cities.indexOf(targetCity)

  // 限制治疗技能使用
  if (!gameStore.healingRestriction) gameStore.healingRestriction = {}
  if (!gameStore.healingRestriction[defender.name]) gameStore.healingRestriction[defender.name] = {}

  gameStore.healingRestriction[defender.name][cityIndex] = {
    active: true,
    limitCount: 1,
    additionalCost: 3
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"阆中古城"，${defender.name}的${targetCity.name}治疗技能受限！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 雅安市 - 雾雨朦胧
 * 限1次，出战时将己方出战城市换为随机一个HP前20（含香港）的城市，当对方对此城市释放技能时，将效果打在雅安市身上
 */
export function handleYaanSkill(attacker, skillData, addPublicLog, gameStore) {
  const cityIndex = attacker.cities.findIndex(c => c.name === skillData.cityName)

  if (!gameStore.disguiseCity) gameStore.disguiseCity = {}
  gameStore.disguiseCity[attacker.name] = {
    active: true,
    realCityIndex: cityIndex,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"雾雨朦胧"，将伪装成强力城市！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 阿坝州 - 天下九寨沟
 * 当自身阵亡时，为己方全体城市恢复至50%初始HP，且随机解除一个负面效果
 */
export function handleAbaSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能：阵亡时触发
  const cityIndex = attacker.cities.findIndex(c => c.name === skillData.cityName)

  if (!gameStore.onDeathEffect) gameStore.onDeathEffect = {}
  if (!gameStore.onDeathEffect[attacker.name]) gameStore.onDeathEffect[attacker.name] = {}

  gameStore.onDeathEffect[attacker.name][cityIndex] = {
    type: 'jiuzhaigou',
    healPercent: 0.5,
    removeDebuff: true
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"天下九寨沟"被动效果已激活！`)
}

/**
 * 甘孜州 - 稻城亚丁
 * 限1次，每有一个城市释放专属技能时，自身积攒一层「本色」，当积攒5层时，展开「五色海」结界，每回合增加己方所有城市1000HP，持续3回合
 */
export function handleGanziSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.ganziStacks) gameStore.ganziStacks = {}
  gameStore.ganziStacks[attacker.name] = {
    active: true,
    stacks: 0,
    threshold: 5,
    healPerRound: 1000,
    duration: 3
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"稻城亚丁"，开始积攒「本色」！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 凉山州 - 彝族火把节
 * 每5回合对对方随机两个城市造成1000HP伤害
 */
export function handleLiangshanSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  // 被动技能：每5回合触发
  if (!gameStore.torchFestival) gameStore.torchFestival = {}
  gameStore.torchFestival[attacker.name] = {
    active: true,
    interval: 5,
    damage: 1000,
    targetCount: 2,
    lastTriggered: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"彝族火把节"被动效果已激活！`)
}

/**
 * 眉山市 - 三苏祠
 * 为己方任意一城市附加一层「文豪」，该城市每造成20000伤害使眉山市触发一次追加攻击，伤害为1000倍攻击次数
 */
export function handleMeishanSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityIndex = attacker.cities.indexOf(targetCity)

  if (!gameStore.literatiMark) gameStore.literatiMark = {}
  if (!gameStore.literatiMark[attacker.name]) gameStore.literatiMark[attacker.name] = {}

  gameStore.literatiMark[attacker.name][cityIndex] = {
    active: true,
    damageThreshold: 20000,
    followUpDamage: 1000,
    attackCount: 0
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"三苏祠"，${targetCity.name}获得「文豪」标记！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
