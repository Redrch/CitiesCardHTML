/**
 * 河北省城市专属技能
 * 包括：石家庄市、唐山市、秦皇岛市、邯郸市、张家口市、承德市、廊坊市、衡水市、雄安新区
 * 无技能：邢台市、保定市、沧州市
 */

import {
  getAliveCities,
  getCurrentHp,
} from './skillHelpers'

/**
 * 石家庄市 - 安济桥
 * 冷却1回合，出牌阶段，选择两个己方城市，交换城市专属技能
 */
export function handleShijiazhuangSkill(player, skillData, addPublicLog, gameStore, cityName1 = null, cityName2 = null) {
  if (cityName1 === null || cityName2 === null || cityName1 === cityName2) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"安济桥"，需要选择两座不同的城市！`)
    return
  }

  const city1 = player.cities[cityName1]
  const city2 = player.cities[cityName2]

  if (!city1 || !city2) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"安济桥"，城市无效！`)
    return
  }

  // 交换城市专属技能
  // 保存到gameStore的技能交换记录中
  if (!gameStore.skillSwap) gameStore.skillSwap = {}
  if (!gameStore.skillSwap[player.name]) gameStore.skillSwap[player.name] = {}

  // 记录交换（city1获得city2的技能，city2获得city1的技能）
  const temp = gameStore.skillSwap[player.name][cityName1] || city1.name
  gameStore.skillSwap[player.name][cityName1] = gameStore.skillSwap[player.name][cityName2] || city2.name
  gameStore.skillSwap[player.name][cityName2] = temp

  addPublicLog(`${player.name}的${skillData.cityName}激活"安济桥"，${city1.name}和${city2.name}交换了城市专属技能！`)

  // 设置冷却
  if (!gameStore.skillCooldown) gameStore.skillCooldown = {}
  if (!gameStore.skillCooldown[player.name]) gameStore.skillCooldown[player.name] = {}
  gameStore.skillCooldown[player.name][skillData.cityName] = {
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 唐山市 - 钢铁之城
 * 中心城市和该城市始终处于"钢铁城市"状态，己方"钢铁城市"数量上限+2
 */
export function handleTangshanSkill(player, skillData, addPublicLog, gameStore) {
  const tangshanName = skillData.cityName.name || skillData.cityName
  const centerCityName = player.centerCityName

  // 初始化钢铁城市状态
  if (!gameStore.ironCities) gameStore.ironCities = {}
  if (!gameStore.ironCities[player.name]) gameStore.ironCities[player.name] = {}

  // 唐山市和中心城市永久钢铁
  gameStore.ironCities[player.name][tangshanName] = {
    roundsLeft: -1,  // -1表示永久
    permanent: true
  }
  gameStore.ironCities[player.name][centerCityName] = {
    roundsLeft: -1,
    permanent: true
  }

  // 增加钢铁城市数量上限
  if (!gameStore.ironCityLimit) gameStore.ironCityLimit = {}
  gameStore.ironCityLimit[player.name] = (gameStore.ironCityLimit[player.name] || 0) + 2

  addPublicLog(`${player.name}的${skillData.cityName}激活"钢铁之城"，${skillData.cityName}和中心城市${player.cities[centerCityName].name}获得永久钢铁状态！钢铁城市上限+2！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 秦皇岛市 - 山海关
 * 己方辽宁省、吉林省、黑龙江省城市受到伤害-75%
 */
export function handleQinhuangdaoSkill(player, skillData, addPublicLog, gameStore) {
  // 初始化伤害减免状态
  if (!gameStore.damageReduction) gameStore.damageReduction = {}
  if (!gameStore.damageReduction[player.name]) gameStore.damageReduction[player.name] = {}

  // 获取东北三省城市
  const dongbeiProvinces = ['辽宁省', '吉林省', '黑龙江省']
  const dongbeiCities = Object.values(player.cities).filter(city => {
    // 需要根据城市数据库查询省份
    return city.province && dongbeiProvinces.includes(city.province)
  })

  dongbeiCities.forEach(city => {
    const cityName = city.name.name || city.name
    gameStore.damageReduction[player.name][cityName] = {
      percentage: 0.75,  // 减免75%
      permanent: true,
      source: '山海关'
    }
  })

  addPublicLog(`${player.name}的${skillData.cityName}激活"山海关"，己方东北三省城市受到伤害减少75%！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 邯郸市 - 邯郸学步
 * 限1次，选定一个己方城市HP变为与该城市相同
 */
export function handleHandanSkill(player, skillData, addPublicLog, gameStore, selectedCityName = null) {
  const handanName = skillData.cityName.name || skillData.cityName
  const handanCity = player.cities[handanName]

  if (!handanCity || handanCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"邯郸学步"，城市已阵亡！`)
    return
  }

  if (selectedCityName === null || selectedCityName === handanName) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"邯郸学步"，需要选择另一座城市！`)
    return
  }

  const targetCity = player.cities[selectedCityName]
  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"邯郸学步"，目标城市无效！`)
    return
  }

  // 目标城市HP变为邯郸市相同
  const oldHp = targetCity.hp
  const oldCurrentHp = targetCity.currentHp
  targetCity.hp = handanCity.hp
  targetCity.currentHp = handanCity.currentHp

  addPublicLog(`${player.name}的${skillData.cityName}激活"邯郸学步"，${targetCity.name}的HP从${oldHp}(${oldCurrentHp})变为${targetCity.hp}(${targetCity.currentHp})！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 张家口市 - 冬奥盛会
 * 限1次，出牌阶段，选定一个金币技能目标+1
 */
export function handleZhangjiakouSkill(player, skillData, addPublicLog, gameStore, targetSkillName = null) {
  if (!targetSkillName) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"冬奥盛会"，未指定目标技能！`)
    return
  }

  // 初始化技能增强状态
  if (!gameStore.skillEnhance) gameStore.skillEnhance = {}
  if (!gameStore.skillEnhance[player.name]) gameStore.skillEnhance[player.name] = {}

  gameStore.skillEnhance[player.name][targetSkillName] = {
    targetBonus: 1,  // 目标+1
    appliedRound: gameStore.currentRound,
    duration: 1  // 仅本回合
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"冬奥盛会"，技能"${targetSkillName}"的目标数量+1！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 承德市 - 避暑山庄
 * 冷却4回合，结算阶段，你可以免除一次致命伤害，将一个原阵亡城市HP变为1
 */
export function handleChengdeSkill(player, skillData, addPublicLog, gameStore) {
  // 初始化避暑山庄状态
  if (!gameStore.bishushanzhuang) gameStore.bishushanzhuang = {}

  gameStore.bishushanzhuang[player.name] = {
    active: true,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"避暑山庄"，下次致命伤害将被免除！`)

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
 * 廊坊市 - 夹缝求生
 * 觉醒技，若己方有至少两个城市的HP大于该城市的20倍，获得技能：若这些城市的HP减少n，该城市的HP增加[n/5]
 */
export function handleLangfangSkill(player, skillData, addPublicLog, gameStore) {
  const langfangName = skillData.cityName.name || skillData.cityName
  const langfangCity = player.cities[langfangName]

  if (!langfangCity || langfangCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"夹缝求生"，城市已阵亡！`)
    return
  }

  // 检查觉醒条件
  const langfangHp = getCurrentHp(langfangCity)
  const bigCities = Object.values(player.cities).filter(city => {
    return city.name !== skillData.cityName && getCurrentHp(city) > langfangHp * 20
  })

  if (bigCities.length < 2) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"夹缝求生"，需要至少2个城市HP大于该城市的20倍！`)
    return
  }

  // 激活觉醒技能
  if (!gameStore.langfangAwaken) gameStore.langfangAwaken = {}

  gameStore.langfangAwaken[player.name] = {
    active: true,
    cityName: langfangName,
    bigCityNames: bigCities.map(city => city.name),
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${player.name}的${skillData.cityName}觉醒"夹缝求生"，将从大城市的损失中获得HP！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 衡水市 - 衡水模式
 * 己方所有城市HP的增加量*2，减少量*1.5
 */
export function handleHengshuiSkill(player, skillData, addPublicLog, gameStore) {
  // 初始化衡水模式状态
  if (!gameStore.hengshuiMode) gameStore.hengshuiMode = {}

  gameStore.hengshuiMode[player.name] = {
    active: true,
    increaseMultiplier: 2,
    decreaseMultiplier: 1.5,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"衡水模式"，所有城市HP增加量×2，减少量×1.5！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 雄安新区 - 千年大计
 * 觉醒技，当17回合后该城市仍处于未知状态时，获得北京市
 */
export function handleXionganSkill(player, skillData, addPublicLog, gameStore) {
  if (gameStore.currentRound < 17) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"千年大计"，需要等到第17回合！`)
    return
  }

  // 检查是否处于未知状态
  const xionganName = skillData.cityName.name || skillData.cityName
  const isUnknown = !gameStore.knownCities || Object.values(gameStore.knownCities).every(playerKnown => {
    return !playerKnown[player.name] || !playerKnown[player.name].has(xionganName)
  })

  if (!isUnknown) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"千年大计"，城市已被对手知晓！`)
    return
  }

  // 召唤北京市
  const existingBeijing = Object.values(player.cities).find(c => c.name === '北京市')
  if (existingBeijing) {
    addPublicLog(`${player.name}的${skillData.cityName}激活"千年大计"，但己方已有北京市！`)
  } else {
    // 使用summonCity召唤北京市
    summonCity(player, '北京市', gameStore, addPublicLog)
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}
