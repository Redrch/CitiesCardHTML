/**
 * 吉林省城市专属技能
 * 包括：长春、吉林、松原、通化、四平、辽源、延边州
 */

import {
  getAliveCities,
  getCurrentHp,
  damageCity,
  getRandomElement
} from './skillHelpers'

/**
 * 长春市 - 汽车城
 * 限1次，己方所有城市攻击力增加20%，持续2回合
 */
export function handleChangchunSkill(attacker, skillData, addPublicLog, gameStore) {
  // 设置攻击力加成
  if (!gameStore.powerBoost) gameStore.powerBoost = {}
  if (!gameStore.powerBoost[attacker.name]) gameStore.powerBoost[attacker.name] = {}

  gameStore.powerBoost[attacker.name].autoCity = {
    active: true,
    multiplier: 1.2,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"汽车城"，全体攻击力+20%（持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 吉林市 - 雾凇奇观
 * 限1次，使对方所有城市2回合内无法使用技能（对方城市数量≥3时可使用）
 */
export function handleJilinSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCount = getAliveCities(defender).length

  if (aliveCount < 3) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"雾凇奇观"，对方城市数量不足3个！`)
    return
  }

  // 设置技能禁用状态
  if (!gameStore.skillDisabled) gameStore.skillDisabled = {}
  gameStore.skillDisabled[defender.name] = {
    active: true,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"雾凇奇观"，${defender.name}的所有城市2回合内无法使用技能！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 松原市 - 查干湖冬捕
 * 限1次，使对方一座城市HP减少1000，若该城市HP低于1000则直接摧毁（对方城市数量≥2时可使用）
 */
export function handleSongyuanSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(defender)

  if (aliveCities.length < 2) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"查干湖冬捕"，对方城市数量不足2个！`)
    return
  }

  // 随机选择一座城市
  const targetCity = getRandomElement(aliveCities)
  const currentHp = getCurrentHp(targetCity)

  if (currentHp <= 1000) {
    // 直接摧毁
    targetCity.currentHp = 0
    targetCity.hp = 0
    targetCity.isAlive = false
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"查干湖冬捕"，直接摧毁${defender.name}的${targetCity.name}！`)
  } else {
    // 减少1000HP
    damageCity(targetCity, 1000)
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"查干湖冬捕"，${defender.name}的${targetCity.name}损失1000HP！`)
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 通化市 - 通化葡萄酒
 * 限1次，选定己方一座城市下次出战攻击力增加40%，但HP减半
 */
export function handleTonghuaSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityIndex = attacker.cities.indexOf(targetCity)

  // 设置下次出战效果
  if (!gameStore.nextBattleEffect) gameStore.nextBattleEffect = {}
  if (!gameStore.nextBattleEffect[attacker.name]) gameStore.nextBattleEffect[attacker.name] = {}

  gameStore.nextBattleEffect[attacker.name][cityIndex] = {
    active: true,
    powerMultiplier: 1.4,
    hpMultiplier: 0.5,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"通化葡萄酒"，${targetCity.name}下次出战攻击力+40%但HP减半！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 四平市 - 英雄之城
 * 限2次，出战后3回合内己方所有城市技能效果提升15%（被动触发）
 */
export function handleSipingSkill(attacker, skillData, addPublicLog, gameStore) {
  // 设置技能效果增强
  if (!gameStore.skillBoost) gameStore.skillBoost = {}
  if (!gameStore.skillBoost[attacker.name]) gameStore.skillBoost[attacker.name] = {}

  gameStore.skillBoost[attacker.name].heroCity = {
    active: true,
    multiplier: 1.15,
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"英雄之城"，全体技能效果+15%（持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 辽源市 - 梅花鹿之乡
 * 限2次，出战后三回合内己方所有城市每回合恢复4%HP（被动触发）
 */
export function handleLiaoyuanSkill(attacker, skillData, addPublicLog, gameStore) {
  // 设置HP恢复效果
  if (!gameStore.hpRegen) gameStore.hpRegen = {}
  if (!gameStore.hpRegen[attacker.name]) gameStore.hpRegen[attacker.name] = {}

  gameStore.hpRegen[attacker.name].deerHome = {
    active: true,
    percent: 0.04,
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"梅花鹿之乡"，全体每回合恢复4%HP（持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 延边州 - 长白山
 * 限2次，出战后三回合内己方所有城市技能效果提升20%（被动触发）
 */
export function handleYanbianSkill(attacker, skillData, addPublicLog, gameStore) {
  // 设置技能效果增强
  if (!gameStore.skillBoost) gameStore.skillBoost = {}
  if (!gameStore.skillBoost[attacker.name]) gameStore.skillBoost[attacker.name] = {}

  gameStore.skillBoost[attacker.name].changbaiMountain = {
    active: true,
    multiplier: 1.2,
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"长白山"，全体技能效果+20%（持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
