/**
 * 甘肃省城市专属技能
 * 包括：兰州、嘉峪关、张掖、酒泉
 */

import {
  getAliveCities,
  getCurrentHp,
  findCity,
  healCity,
  damageCity,
  getRandomElement
} from './skillHelpers'

/**
 * 兰州市 - 黄河明珠
 * 锁定技，该城市阵亡时，对该城市造成过伤害的所有城市失去所有技能，且不可被选作任何技能的目标
 */
export function handleLanzhouSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能：阵亡时触发
  const cityIndex = attacker.cities.findIndex(c => c.name === skillData.cityName)

  if (!gameStore.onDeathEffect) gameStore.onDeathEffect = {}
  if (!gameStore.onDeathEffect[attacker.name]) gameStore.onDeathEffect[attacker.name] = {}

  gameStore.onDeathEffect[attacker.name][cityIndex] = {
    type: 'yellowRiverPearl',
    disableAttackersSkills: true,
    makeAttackersUntargetable: true,
    trackDamagers: []
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}"黄河明珠"被动效果已激活！`)
}

/**
 * 嘉峪关市 - 嘉峪关
 * 冷却1回合，你可以选择己方任意多个非直辖市、特区、省会、首府城市，更改其所属省级行政区
 */
export function handleJiayuguanSkill(attacker, skillData, addPublicLog, gameStore) {
  // 此技能需要特殊UI支持，暂时记录技能激活
  if (!gameStore.provinceChange) gameStore.provinceChange = {}
  gameStore.provinceChange[attacker.name] = {
    active: true,
    cooldown: 1,
    lastUsed: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"嘉峪关"，可以更改城市所属省份！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 张掖市 - 七彩丹霞
 * 限1次，选择七大地区的城市各一个，将它们替换为各地区中心城市（若不可替换，则维持原城市）
 */
export function handleZhangyeSkill(attacker, skillData, addPublicLog, gameStore) {
  // 此技能需要特殊UI支持，暂时记录技能激活
  if (!gameStore.rainbowDanxia) gameStore.rainbowDanxia = {}
  gameStore.rainbowDanxia[attacker.name] = {
    active: true,
    canReplaceWithCapitals: true,
    sevenRegions: ['华北', '东北', '华东', '华中', '华南', '西南', '西北']
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"七彩丹霞"，可将城市替换为各地区中心城市！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 酒泉市 - 莫高窟
 * 冷却2回合，当你使用非战斗金币技能时，可以回答"博学多才"问题，根据正确率返还相同比例的金币
 */
export function handleJiuquanSkill(attacker, skillData, addPublicLog, gameStore) {
  // 被动技能：使用金币技能时触发
  if (!gameStore.mogaoGrottoes) gameStore.mogaoGrottoes = {}
  gameStore.mogaoGrottoes[attacker.name] = {
    active: true,
    cooldown: 2,
    lastUsed: gameStore.currentRound,
    refundGold: true,
    requiresQuiz: true
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"莫高窟"，使用金币技能可答题返还金币！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
