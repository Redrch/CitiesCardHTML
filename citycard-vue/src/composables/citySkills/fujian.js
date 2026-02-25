/**
 * 福建省城市专属技能
 * 包括：福州市、莆田市、泉州市、厦门市、漳州市、龙岩市、三明市、南平市、宁德市
 */

import {
  getAliveCities,
  getCurrentHp,
} from './skillHelpers'

/**
 * 福州市 - 闽都榕城
 * 己方福州市未阵亡时，每使用一个未使用过的技能，所有技能花费降低5%，
 * 每降低10%时额外获得3金币，最多降低25%（橙卡最多10%）
 */
export function handleFuzhouSkill(player, skillData, addPublicLog, gameStore) {
  const fuzhouName = skillData.cityName.name || skillData.cityName
  const fuzhouCity = player.cities[fuzhouName]

  if (!fuzhouCity || fuzhouCity.isAlive === false) {
    return  // 技能效果在福州市阵亡后失效
  }

  // 初始化闽都榕城状态
  if (!gameStore.mindurong) gameStore.mindurong = {}

  if (!gameStore.mindurong[player.name]) {
    gameStore.mindurong[player.name] = {
      active: true,
      discountPercent: 0,  // 当前折扣百分比
      usedSkills: new Set(),  // 已使用过的技能集合
      appliedRound: gameStore.currentRound
    }
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"闽都榕城"，每使用新技能技能花费降低5%！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 莆田市 - 妈祖之乡
 * 锁定技，每当己方出战莆田市时，己方所有城市有20%的概率躲避所有伤害
 */
export function handlePutianSkill(player, skillData, addPublicLog, gameStore) {
  // 初始化妈祖之乡状态
  if (!gameStore.mazuBlessing) gameStore.mazuBlessing = {}

  gameStore.mazuBlessing[player.name] = {
    active: true,
    dodgeChance: 0.2,  // 20%概率
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"妈祖之乡"，本回合己方所有城市有20%概率躲避伤害！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 泉州市 - 海丝起点
 * 己方每三回合可免费使用一次城市保护/快速治疗/草木皆兵，
 * 且出战前泉州市为未知状态，己方每使用三次免费技能后使用一次城市专属技能，效果增加50%
 */
export function handleQuanzhouSkill(player, skillData, addPublicLog, gameStore) {
  const quanzhouName = skillData.cityName.name || skillData.cityName

  // 检查泉州市是否为未知状态
  const isUnknown = !gameStore.knownCities || Object.values(gameStore.knownCities).every(playerKnown => {
    return !playerKnown[player.name] || !playerKnown[player.name].has(quanzhouName)
  })

  if (!isUnknown) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"海丝起点"，泉州市已被对手知晓！`)
    return
  }

  // 初始化海丝起点状态
  if (!gameStore.haiSiOrigin) gameStore.haiSiOrigin = {}

  if (!gameStore.haiSiOrigin[player.name]) {
    gameStore.haiSiOrigin[player.name] = {
      active: true,
      freeSkillsAvailable: ['城市保护', '快速治疗', '草木皆兵'],
      freeSkillCount: 0,  // 已使用的免费技能次数
      canUseFreeSkill: true,  // 当前是否可以使用免费技能
      nextFreeRound: gameStore.currentRound + 3,  // 下次可以使用免费技能的回合
      appliedRound: gameStore.currentRound
    }
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"海丝起点"，每3回合可免费使用指定技能！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 厦门市 - 海上花园
 * 第一次出战时对方伤害对己方减少50%，
 * 且当对方城市在任意三个不同任意回合伤害均大于厦门初始HP，则厦门再一次获得该技能效果（被动触发）
 */
export function handleXiamenSkill(player, skillData, addPublicLog, gameStore) {
  const xiamenName = skillData.cityName.name || skillData.cityName
  const xiamenCity = player.cities[xiamenName]

  if (!xiamenCity || xiamenCity.isAlive === false) {
    return
  }

  // 初始化海上花园状态
  if (!gameStore.seaGarden) gameStore.seaGarden = {}

  if (!gameStore.seaGarden[player.name]) {
    gameStore.seaGarden[player.name] = {
      active: true,
      damageReduction: 0.5,  // 50%伤害减免
      firstDeploy: true,  // 是否为首次出战
      xiamenInitialHp: xiamenCity.hp,  // 厦门初始HP
      opponentHighDamageRounds: [],  // 对方造成高伤害的回合记录
      canReactivate: false,  // 是否可以再次激活
      appliedRound: gameStore.currentRound
    }
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"海上花园"，首次出战时对方伤害减少50%！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 漳州市 - 水仙花之乡
 * 当己方在至少三个不同任意回合造成的伤害达到漳州市初始战斗力的五倍且每回合造成的伤害均高于漳州市初始战斗力时，
 * 己方可以选择一次在释放金币技能时将其效果翻倍（只增强效果不增加目标数）
 */
export function handleZhangzhouSkill(player, skillData, addPublicLog, gameStore) {
  const zhangzhouName = skillData.cityName.name || skillData.cityName
  const zhangzhouCity = player.cities[zhangzhouName]

  if (!zhangzhouCity || zhangzhouCity.isAlive === false) {
    return
  }

  // 初始化水仙花之乡状态
  if (!gameStore.narcissus) gameStore.narcissus = {}

  if (!gameStore.narcissus[player.name]) {
    const zhangzhouPower = getCurrentHp(zhangzhouCity)

    gameStore.narcissus[player.name] = {
      active: true,
      zhangzhouPower: zhangzhouPower,
      targetTotalDamage: zhangzhouPower * 5,  // 目标总伤害（5倍战斗力）
      minDamagePerRound: zhangzhouPower,  // 每回合最低伤害
      damageRounds: [],  // 记录造成伤害的回合
      canDoubleEffect: false,  // 是否可以使用翻倍效果
      appliedRound: gameStore.currentRound
    }
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"水仙花之乡"，达成条件后可翻倍金币技能效果！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 龙岩市 - 古田会址
 * 在己方前五次使用金币技能时，若龙岩市在场，分别降低其1，2，3，4，5金币花费，
 * 第五次使用金币技能过后，随机获得一个8金币以下的金币技能，三回合内可以使用
 */
export function handleLongyanSkill(player, skillData, addPublicLog, gameStore) {
  const longyanName = skillData.cityName.name || skillData.cityName
  const longyanCity = player.cities[longyanName]

  if (!longyanCity || longyanCity.isAlive === false) {
    return
  }

  // 初始化古田会址状态
  if (!gameStore.gutianConference) gameStore.gutianConference = {}

  if (!gameStore.gutianConference[player.name]) {
    gameStore.gutianConference[player.name] = {
      active: true,
      skillCount: 0,  // 已使用的金币技能次数
      discounts: [1, 2, 3, 4, 5],  // 前5次的折扣
      bonusSkill: null,  // 第5次后获得的奖励技能
      bonusSkillAvailableUntil: null,  // 奖励技能可用截止回合
      appliedRound: gameStore.currentRound
    }
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"古田会址"，前5次金币技能分别降低1-5金币！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 三明市 - 闽人之源
 * 三明市作为战斗预备城市时对方对己方造成的伤害减少5%，
 * 每次己方使用任意技能之后，增加5%的伤害降幅，最多25%，每三回合可以触发一次
 */
export function handleSanmingSkill(player, skillData, addPublicLog, gameStore) {
  const sanmingName = skillData.cityName.name || skillData.cityName

  // 检查三明市是否在战斗预备城市中
  const isInRoster = player.roster && player.roster.includes(sanmingName)

  if (!isInRoster) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"闽人之源"，三明市不在战斗预备城市中！`)
    return
  }

  // 初始化闽人之源状态
  if (!gameStore.minrenOrigin) gameStore.minrenOrigin = {}

  if (!gameStore.minrenOrigin[player.name]) {
    gameStore.minrenOrigin[player.name] = {
      active: true,
      baseDamageReduction: 0.05,  // 基础5%伤害减免
      currentDamageReduction: 0.05,  // 当前伤害减免
      maxDamageReduction: 0.25,  // 最大25%
      incrementPerSkill: 0.05,  // 每次技能增加5%
      nextTriggerRound: gameStore.currentRound + 3,  // 下次可触发的回合
      appliedRound: gameStore.currentRound
    }
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"闽人之源"，对方伤害减少5%，每次使用技能增加5%！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 南平市 - 武夷山水
 * 南平市在场时，己方6金币及以下的技能花费减半（向上取整），冷却2回合
 */
export function handleNanpingSkill(player, skillData, addPublicLog, gameStore) {
  const nanpingName = skillData.cityName.name || skillData.cityName
  const nanpingCity = player.cities[nanpingName]

  if (!nanpingCity || nanpingCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"武夷山水"，南平市已阵亡！`)
    return
  }

  // 初始化武夷山水状态
  if (!gameStore.wuyiMountain) gameStore.wuyiMountain = {}

  gameStore.wuyiMountain[player.name] = {
    active: true,
    maxCostForDiscount: 6,  // 6金币及以下
    discountRate: 0.5,  // 减半
    roundUp: true,  // 向上取整
    appliedRound: gameStore.currentRound,
    duration: 1  // 持续1回合
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"武夷山水"，本回合6金币及以下技能花费减半！`)

  // 设置冷却
  if (!gameStore.skillCooldown) gameStore.skillCooldown = {}
  if (!gameStore.skillCooldown[player.name]) gameStore.skillCooldown[player.name] = {}
  gameStore.skillCooldown[player.name][skillData.cityName] = {
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 宁德市 - 福鼎肉片
 * 宁德市在场时，己方使用恢复类技能的花费减半，冷却三回合
 * 恢复类技能：城市医疗，草船借箭，士气大振
 */
export function handleNingdeSkill(player, skillData, addPublicLog, gameStore) {
  const ningdeName = skillData.cityName.name || skillData.cityName
  const ningdeCity = player.cities[ningdeName]

  if (!ningdeCity || ningdeCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"福鼎肉片"，宁德市已阵亡！`)
    return
  }

  // 初始化福鼎肉片状态
  if (!gameStore.fudingMeat) gameStore.fudingMeat = {}

  gameStore.fudingMeat[player.name] = {
    active: true,
    healingSkills: ['城市医疗', '草船借箭', '士气大振'],
    discountRate: 0.5,  // 减半
    appliedRound: gameStore.currentRound,
    duration: 1  // 持续1回合
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"福鼎肉片"，本回合恢复类技能花费减半！`)

  // 设置冷却
  if (!gameStore.skillCooldown) gameStore.skillCooldown = {}
  if (!gameStore.skillCooldown[player.name]) gameStore.skillCooldown[player.name] = {}
  gameStore.skillCooldown[player.name][skillData.cityName] = {
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}
