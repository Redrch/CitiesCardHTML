/**
 * 海南省城市专属技能
 * 包括：海口市、三亚市、三沙市、琼海市、文昌市、万宁市、五指山市
 * 无技能：屯昌县、澄迈县、临高县、定安县、东方市、白沙县、昌江县、乐东县、陵水县、保亭县、琼中县、儋州市
 */

import {
  getAliveCities,
  getCurrentHp,
} from './skillHelpers'

/**
 * 海口市 - 秀英炮台
 * 限2次，游戏开始5回合后对对方一座未知城市造成3000点伤害（冷却3回合）
 */
export function handleHaikouSkill(player, skillData, addPublicLog, gameStore, targetPlayer = null, targetCityName = null) {
  // 检查游戏回合数
  if (gameStore.currentRound < 5) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"秀英炮台"，需要游戏开始5回合后！`)
    return
  }

  // 检查使用次数
  const usageKey = `${player.name}_${skillData.cityName}_秀英炮台`
  const usageCount = gameStore.skillUsageCount[usageKey] || 0

  if (usageCount >= 2) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"秀英炮台"，已达使用次数上限（2次）！`)
    return
  }

  if (!targetPlayer || targetCityName === null) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"秀英炮台"，未指定目标！`)
    return
  }

  const targetCity = targetPlayer.cities[targetCityName]
  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"秀英炮台"，目标城市无效或已阵亡！`)
    return
  }

  // 检查是否为未知城市（对己方来说）
  const isUnknown = !gameStore.knownCities || !gameStore.knownCities[player.name] ||
                    !gameStore.knownCities[player.name][targetPlayer.name] ||
                    !gameStore.knownCities[player.name][targetPlayer.name].has(targetCityName)

  if (!isUnknown) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"秀英炮台"，目标城市不是未知城市！`)
    return
  }

  // 造成3000点伤害
  const oldHp = targetCity.currentHp
  targetCity.currentHp -= 3000

  if (targetCity.currentHp <= 0) {
    targetCity.currentHp = 0
    targetCity.isAlive = false
    addPublicLog(`${player.name}的${skillData.cityName}激活"秀英炮台"，摧毁了${targetPlayer.name}的一座城市！`)
  } else {
    addPublicLog(`${player.name}的${skillData.cityName}激活"秀英炮台"，对${targetPlayer.name}的一座城市造成3000点伤害！`)
  }

  // 设置冷却
  if (!gameStore.skillCooldown) gameStore.skillCooldown = {}
  if (!gameStore.skillCooldown[player.name]) gameStore.skillCooldown[player.name] = {}
  gameStore.skillCooldown[player.name][skillData.cityName] = {
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)

  // 记录使用次数
  if (!gameStore.skillUsageCount[usageKey]) {
    gameStore.skillUsageCount[usageKey] = 0
  }
  gameStore.skillUsageCount[usageKey]++
}

/**
 * 三亚市 - 绚丽海滨
 * 限1次，己方3座城市HPx2（HP5000以下可使用）
 */
export function handleSanyaSkill(player, skillData, addPublicLog, gameStore, selectedCityNames = null) {
  const aliveCities = getAliveCities(player)

  // 筛选HP低于5000的城市
  const lowHpCities = aliveCities.filter(city => getCurrentHp(city) < 5000)

  if (lowHpCities.length === 0) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"绚丽海滨"，没有HP低于5000的城市！`)
    return
  }

  // 选择城市（最多3座）
  let citiesToBuff
  if (selectedCityNames && Array.isArray(selectedCityNames)) {
    citiesToBuff = selectedCityNames.map(name => player.cities[name]).filter(city => city && getCurrentHp(city) < 5000)
  } else {
    // 默认选择HP最低的3座
    citiesToBuff = lowHpCities.sort((a, b) => getCurrentHp(a) - getCurrentHp(b)).slice(0, 3)
  }

  const count = Math.min(3, citiesToBuff.length)
  for (let i = 0; i < count; i++) {
    const city = citiesToBuff[i]
    const oldMaxHp = city.hp
    city.hp = city.hp * 2
    city.currentHp = city.currentHp * 2
    addPublicLog(`${player.name}的${city.name} HP翻倍（${oldMaxHp} → ${city.hp}）！`)
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"绚丽海滨"，${count}座城市HP翻倍！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 三沙市 - 南海守望
 * 当己方中心第一次受到伤害时，所有伤害转移至该城市
 */
export function handleSanshaSkill(player, skillData, addPublicLog, gameStore) {
  const sanshaName = skillData.cityName.name || skillData.cityName
  const sanshaCity = player.cities[sanshaName]

  if (!sanshaCity || sanshaCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"南海守望"，城市已阵亡！`)
    return
  }

  // 初始化南海守望状态
  if (!gameStore.southSeaGuard) gameStore.southSeaGuard = {}

  gameStore.southSeaGuard[player.name] = {
    active: true,
    cityName: sanshaName,
    triggered: false,  // 是否已触发（只触发一次）
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"南海守望"，下次中心城市受到伤害时将转移至三沙市！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 琼海市 - 博鳌论坛
 * 限1次，选定对方一座HP低于5000的已知城市，将其HP与该城市互换
 */
export function handleQionghaiSkill(player, skillData, addPublicLog, gameStore, targetPlayer = null, targetCityName = null) {
  if (!targetPlayer || targetCityName === null) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"博鳌论坛"，未指定目标！`)
    return
  }

  const targetCity = targetPlayer.cities[targetCityName]
  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"博鳌论坛"，目标城市无效或已阵亡！`)
    return
  }

  // 检查目标城市HP是否低于5000
  if (getCurrentHp(targetCity) >= 5000) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"博鳌论坛"，目标城市HP不低于5000！`)
    return
  }

  // 检查是否为已知城市
  const isKnown = gameStore.knownCities && gameStore.knownCities[player.name] &&
                  gameStore.knownCities[player.name][targetPlayer.name] &&
                  gameStore.knownCities[player.name][targetPlayer.name].has(targetCityName)

  if (!isKnown) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"博鳌论坛"，目标城市不是已知城市！`)
    return
  }

  const qionghaiName = skillData.cityName.name || skillData.cityName
  const qionghaiCity = player.cities[qionghaiName]

  if (!qionghaiCity || qionghaiCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"博鳌论坛"，琼海市已阵亡！`)
    return
  }

  // 互换HP
  const qionghaiOldHp = qionghaiCity.currentHp
  const qionghaiOldMaxHp = qionghaiCity.hp
  const targetOldHp = targetCity.currentHp
  const targetOldMaxHp = targetCity.hp

  qionghaiCity.currentHp = targetOldHp
  qionghaiCity.hp = targetOldMaxHp
  targetCity.currentHp = qionghaiOldHp
  targetCity.hp = qionghaiOldMaxHp

  addPublicLog(`${player.name}的${skillData.cityName}激活"博鳌论坛"，与${targetPlayer.name}的${targetCity.name}互换HP（琼海市：${qionghaiOldHp}→${qionghaiCity.currentHp}，${targetCity.name}：${targetOldHp}→${targetCity.currentHp}）！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 文昌市 - 文昌卫星
 * 限1次，将对方接下来2回合的出牌告诉己方（对方不知晓）
 */
export function handleWenchangSkill(player, skillData, addPublicLog, gameStore, targetPlayer = null) {
  if (!targetPlayer) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"文昌卫星"，未指定目标玩家！`)
    return
  }

  // 初始化文昌卫星状态
  if (!gameStore.wenchangSatellite) gameStore.wenchangSatellite = {}

  gameStore.wenchangSatellite[player.name] = {
    active: true,
    targetPlayer: targetPlayer.name,
    roundsLeft: 2,
    startRound: gameStore.currentRound,
    appliedRound: gameStore.currentRound
  }

  // 只给己方发私有日志
  addPublicLog(`${player.name}的${skillData.cityName}激活"文昌卫星"，接下来2回合可以看到${targetPlayer.name}的出牌！`, true, player.name)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 万宁市 - 神州半岛
 * 限1次，己方一座城市下场2回合，2回合后恢复至满血状态（HP5000以下可使用）
 */
export function handleWanningSkill(player, skillData, addPublicLog, gameStore, selectedCityName = null) {
  if (selectedCityName === null) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"神州半岛"，需要选择一座城市！`)
    return
  }

  const targetCity = player.cities[selectedCityName]
  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"神州半岛"，目标城市无效或已阵亡！`)
    return
  }

  // 检查HP限制
  if (getCurrentHp(targetCity) > 5000) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"神州半岛"，目标城市HP超过5000！`)
    return
  }

  // 初始化神州半岛状态
  if (!gameStore.shenzhouPeninsula) gameStore.shenzhouPeninsula = {}
  if (!gameStore.shenzhouPeninsula[player.name]) gameStore.shenzhouPeninsula[player.name] = {}

  gameStore.shenzhouPeninsula[player.name][selectedCityName] = {
    offFieldRounds: 2,
    returnRound: gameStore.currentRound + 2,
    fullHealOnReturn: true,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"神州半岛"，${targetCity.name}下场2回合后满血返回！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 五指山市 - 五指山
 * 限1次，己方一座城市禁止出战3回合，3回合后HPx3（HP8000以下可使用）
 */
export function handleWuzhishanSkill(player, skillData, addPublicLog, gameStore, selectedCityName = null) {
  if (selectedCityName === null) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"五指山"，需要选择一座城市！`)
    return
  }

  const targetCity = player.cities[selectedCityName]
  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"五指山"，目标城市无效或已阵亡！`)
    return
  }

  // 检查HP限制
  if (getCurrentHp(targetCity) > 8000) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"五指山"，目标城市HP超过8000！`)
    return
  }

  // 初始化五指山状态
  if (!gameStore.wuzhiMountain) gameStore.wuzhiMountain = {}
  if (!gameStore.wuzhiMountain[player.name]) gameStore.wuzhiMountain[player.name] = {}

  gameStore.wuzhiMountain[player.name][selectedCityName] = {
    bannedRounds: 3,
    returnRound: gameStore.currentRound + 3,
    hpMultiplier: 3,  // HP×3
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"五指山"，${targetCity.name}禁止出战3回合，3回合后HP×3！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}
