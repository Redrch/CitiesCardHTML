/**
 * 西藏自治区城市专属技能
 * 包括：拉萨、日喀则、林芝、阿里地区
 */

import {
  getAliveCities,
  getCurrentHp,
  findCity,
  healCity,
  damageCity,
  addCityShield,
  getRandomElement
} from './skillHelpers'

/**
 * 拉萨市 - 布达拉宫
 * 限1次，使一个己方HP小于30000的城市恢复至初始HP并获得3000HP护盾。之后下回合随机抽取一个HP低于1500的城市加入己方
 */
export function handleLasaSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getAliveCities(attacker).filter(c => getCurrentHp(c) < 30000)
  if (eligibleCities.length === 0) return

  const targetCity = getRandomElement(eligibleCities)
  const initialHp = targetCity.initialHp || targetCity.hp

  // 恢复至初始HP
  targetCity.currentHp = initialHp
  targetCity.hp = initialHp

  // 添加护盾
  addCityShield(targetCity, 3000, 1)

  // 下回合召唤城市
  if (!gameStore.nextRoundSummon) gameStore.nextRoundSummon = {}
  if (!gameStore.nextRoundSummon[attacker.name]) gameStore.nextRoundSummon[attacker.name] = []

  gameStore.nextRoundSummon[attacker.name].push({
    maxHp: 1500,
    appliedRound: gameStore.currentRound
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"布达拉宫"，${targetCity.name}恢复满血+3000护盾，下回合将召唤小城市！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 日喀则市 - 珠穆朗玛峰
 * 限2次，本回合己方攻击力增加10%（被动触发）
 */
export function handleRikazeSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.powerBoost) gameStore.powerBoost = {}
  if (!gameStore.powerBoost[attacker.name]) gameStore.powerBoost[attacker.name] = {}

  gameStore.powerBoost[attacker.name].qomolangma = {
    active: true,
    multiplier: 1.1,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"珠穆朗玛峰"，本回合攻击力+10%！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 林芝市 - 雅鲁藏布大峡谷
 * 限2次，使对方一个城市禁止出战2回合
 */
export function handleLinzhiSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(defender)
  if (aliveCities.length === 0) return

  const targetCity = getRandomElement(aliveCities)
  const cityName = defender.cities.indexOf(targetCity)

  if (!gameStore.battleBanned) gameStore.battleBanned = {}
  if (!gameStore.battleBanned[defender.name]) gameStore.battleBanned[defender.name] = {}

  gameStore.battleBanned[defender.name][cityName] = {
    active: true,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"雅鲁藏布大峡谷"，${defender.name}的${targetCity.name}禁止出战2回合！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 阿里地区 - 冈仁波齐
 * 限1次，战斗预备时召唤一个1300HP的信徒一同攻击，信徒本回合过后消失
 */
export function handleAliSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.believerSummon) gameStore.believerSummon = {}
  gameStore.believerSummon[attacker.name] = {
    active: true,
    hp: 1300,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"冈仁波齐"，召唤1300HP信徒助战！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
