/**
 * 河南省城市专属技能
 * 包括：郑州、洛阳、开封、平顶山、安阳、鹤壁、新乡、焦作、许昌、三门峡、南阳、商丘、信阳、周口、济源
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
 * 郑州市 - 中原枢纽
 * 限2次，出战时己方全体城市防御力提升20%，持续2回合
 */
export function handleZhengzhouSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.defenseBoost) gameStore.defenseBoost = {}
  if (!gameStore.defenseBoost[attacker.name]) gameStore.defenseBoost[attacker.name] = {}

  gameStore.defenseBoost[attacker.name].centralHub = {
    active: true,
    multiplier: 1.2,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"中原枢纽"，全体防御力+20%（持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 洛阳市 - 十三朝古都
 * 限2次，选定己方一座城市，使其在接下来的3回合内，每次受到攻击时都反弹30%的伤害给攻击者
 */
export function handleLuoyangSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityName = attacker.cities.indexOf(targetCity)

  if (!gameStore.reflectDamage) gameStore.reflectDamage = {}
  if (!gameStore.reflectDamage[attacker.name]) gameStore.reflectDamage[attacker.name] = {}

  gameStore.reflectDamage[attacker.name][cityName] = {
    active: true,
    chance: 1.0,  // 100%触发
    multiplier: 0.3,
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"十三朝古都"，${targetCity.name}反弹30%伤害（持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 开封市 - 八朝古都
 * 限2次，给己方中心城市附加一个持续2回合的护盾，护盾存在期间，该城市每次受到攻击时，都会反弹20%的伤害给攻击者，若自身为中心，可以反弹50%
 */
export function handleKaifengSkill(attacker, skillData, addPublicLog, gameStore) {
  const centerCityName = attacker.centerCityName ?? 0
  const centerCity = attacker.cities[centerCityName]

  // 判断开封是否是中心
  const cityName = skillData.cityName
  const isCenter = cityName === centerCityName
  const reflectRate = isCenter ? 0.5 : 0.2

  if (!gameStore.reflectDamage) gameStore.reflectDamage = {}
  if (!gameStore.reflectDamage[attacker.name]) gameStore.reflectDamage[attacker.name] = {}

  gameStore.reflectDamage[attacker.name][centerCityName] = {
    active: true,
    chance: 1.0,
    multiplier: reflectRate,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"八朝古都"，${centerCity.name}反弹${Math.floor(reflectRate * 100)}%伤害（持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 平顶山市 - 中原大佛
 * 限1次，使己方一座城市HP增加50%，上限15000，同时提升己方全体城市5%的攻击力，持续1回合
 */
export function handlePingdingshanSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const currentHp = getCurrentHp(targetCity)
  const hpIncrease = Math.min(Math.floor(currentHp * 0.5), 15000)

  targetCity.currentHp = currentHp + hpIncrease
  targetCity.hp = targetCity.currentHp

  // 设置全体攻击力加成
  if (!gameStore.powerBoost) gameStore.powerBoost = {}
  if (!gameStore.powerBoost[attacker.name]) gameStore.powerBoost[attacker.name] = {}

  gameStore.powerBoost[attacker.name].greatBuddha = {
    active: true,
    multiplier: 1.05,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"中原大佛"，${targetCity.name}HP+${hpIncrease}，全体攻击力+5%（持续1回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 安阳市 - 殷墟古韵
 * 限1次，出战时使对方所有出战城市在接下来的2回合内，每次攻击时都使攻击者自身受到相当于攻击伤害总和10%的反弹伤害
 */
export function handleAnyangSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  if (!gameStore.selfReflect) gameStore.selfReflect = {}
  gameStore.selfReflect[defender.name] = {
    active: true,
    percent: 0.1,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"殷墟古韵"，${defender.name}的城市攻击自伤10%（持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 鹤壁市 - 淇河灵韵
 * 限2次，选定己方一座城市，使其在接下来的3回合内，每次出战时都能额外获得1200点HP的恢复效果，并且该城市在出战时获得额外的10%攻击力加成
 */
export function handleHebiSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityName = attacker.cities.indexOf(targetCity)

  if (!gameStore.battleHealing) gameStore.battleHealing = {}
  if (!gameStore.battleHealing[attacker.name]) gameStore.battleHealing[attacker.name] = {}

  gameStore.battleHealing[attacker.name][cityName] = {
    active: true,
    amount: 1200,
    powerBoost: 1.1,
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"淇河灵韵"，${targetCity.name}出战回复1200HP且攻击力+10%（持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 新乡市 - 牧野雄风
 * 限2次，选定己方一座城市，为其提供一个持续2回合的护盾，护盾存在期间，该城市受到的伤害减少40%，且在护盾破碎时会对周围敌方城市造成一次范围伤害，伤害值为护盾吸收总伤害的30%
 */
export function handleXinxiangSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityName = attacker.cities.indexOf(targetCity)

  if (!gameStore.explosiveShield) gameStore.explosiveShield = {}
  if (!gameStore.explosiveShield[attacker.name]) gameStore.explosiveShield[attacker.name] = {}

  gameStore.explosiveShield[attacker.name][cityName] = {
    active: true,
    damageReduction: 0.6,  // 减少40%伤害
    explosionRate: 0.3,
    absorbedDamage: 0,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound,
    targetPlayer: defender.name
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"牧野雄风"，${targetCity.name}获得爆炸护盾（减伤40%，持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 焦作市 - 云台奇景
 * 限1次，给对方的一座随机城市施加"迷雾笼罩"效果，该城市在接下来的3回合内，每次攻击时都无法打出伤害
 */
export function handleJiaozuoSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(defender)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityName = defender.cities.indexOf(targetCity)

  if (!gameStore.attackDisabled) gameStore.attackDisabled = {}
  if (!gameStore.attackDisabled[defender.name]) gameStore.attackDisabled[defender.name] = {}

  gameStore.attackDisabled[defender.name][cityName] = {
    active: true,
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"云台奇景"，${defender.name}的${targetCity.name}被迷雾笼罩（无法攻击，持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 许昌市 - 魏都遗风
 * 限2次，选定己方一座城市，使其在接下来的3回合内，每次受到攻击时都有50%概率使攻击者进入"混乱"状态，持续1回合，混乱状态下攻击者会随机选择攻击目标，包括己方城市
 */
export function handleXuchangSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityName = attacker.cities.indexOf(targetCity)

  if (!gameStore.confuseCounter) gameStore.confuseCounter = {}
  if (!gameStore.confuseCounter[attacker.name]) gameStore.confuseCounter[attacker.name] = {}

  gameStore.confuseCounter[attacker.name][cityName] = {
    active: true,
    chance: 0.5,
    duration: 1,
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"魏都遗风"，${targetCity.name}获得混乱反击（50%概率，持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 三门峡市 - 黄河明珠
 * 限1次，可以给对方5随机座城市施加"黄河怒涛"，持续4回合，每回合造成750HP的伤害
 */
export function handleSanmenxiaSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(defender)
  if (aliveCities.length === 0) return

  const targetCount = Math.min(5, aliveCities.length)
  const shuffled = [...aliveCities].sort(() => Math.random() - 0.5)
  const targets = shuffled.slice(0, targetCount)

  if (!gameStore.yellowRiverRage) gameStore.yellowRiverRage = {}
  if (!gameStore.yellowRiverRage[defender.name]) gameStore.yellowRiverRage[defender.name] = {}

  targets.forEach(city => {
    const cityName = defender.cities.indexOf(city)
    gameStore.yellowRiverRage[defender.name][cityName] = {
      active: true,
      damage: 750,
      roundsLeft: 4,
      appliedRound: gameStore.currentRound
    }
  })

  const targetNames = targets.map(c => c.name).join('、')
  addPublicLog(`${attacker.name}的${skillData.cityName}激活"黄河明珠"，${defender.name}的${targetNames}被黄河怒涛侵袭（每回合750伤害，持续4回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 南阳市 - 卧龙圣地
 * 限2次，出战时己方全体城市在接下来的2回合内，每次攻击时都有30%概率触发额外的一次攻击，额外攻击的伤害为正常攻击的50%
 */
export function handleNanyangSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.extraAttack) gameStore.extraAttack = {}
  if (!gameStore.extraAttack[attacker.name]) gameStore.extraAttack[attacker.name] = {}

  gameStore.extraAttack[attacker.name].wolongSite = {
    active: true,
    chance: 0.3,
    multiplier: 0.5,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"卧龙圣地"，全体30%概率额外攻击（持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 商丘市 - 商祖故里
 * 限1次，3回合内己方每击败对手一座城市额外产生1金币
 */
export function handleShangqiuSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.goldPerKill) gameStore.goldPerKill = {}
  gameStore.goldPerKill[attacker.name] = {
    active: true,
    amount: 1,
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"商祖故里"，击杀城市额外获得1金币（持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 信阳市 - 信阳毛尖
 * 限2次，出战时使对方所有出战城市在接下来的2回合内，每次攻击时都有50%攻击力下降20%，持续1回合
 */
export function handleXinyangSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  if (!gameStore.weakenAttack) gameStore.weakenAttack = {}
  gameStore.weakenAttack[defender.name] = {
    active: true,
    chance: 0.5,
    multiplier: 0.8,
    duration: 1,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"信阳毛尖"，${defender.name}的城市50%概率攻击力-20%（持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 周口市 - 伏羲故里
 * 限1次，2回合内对方无法使用城市专属技能
 */
export function handleZhoukouSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  if (!gameStore.citySkillDisabled) gameStore.citySkillDisabled = {}
  gameStore.citySkillDisabled[defender.name] = {
    active: true,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"伏羲故里"，${defender.name}2回合内无法使用城市专属技能！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 济源市 - 王屋山
 * 限1次，出战时随机抵挡1-750HP伤害
 */
export function handleJiyuanSkill(attacker, skillData, addPublicLog, gameStore) {
  const cityName = skillData.cityName
  const shieldAmount = Math.floor(Math.random() * 750) + 1

  if (!gameStore.cityShield) gameStore.cityShield = {}
  if (!gameStore.cityShield[attacker.name]) gameStore.cityShield[attacker.name] = {}

  gameStore.cityShield[attacker.name][cityName] = {
    active: true,
    amount: shieldAmount,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"王屋山"，获得${shieldAmount}点护盾！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
