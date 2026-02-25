/**
 * 山西省城市专属技能
 * 包括：太原市、大同市、晋中市、运城市、忻州市、临汾市
 * 无技能：阳泉市、长治市、晋城市、朔州市、吕梁市
 */

import {
  getAliveCities,
  getCurrentHp,
} from './skillHelpers'

/**
 * 太原市 - 清徐陈醋
 * 限2次，你可以花费3金币，5回合后获得一个城市专属技能
 */
export function handleTaiyuanSkill(player, skillData, addPublicLog, gameStore) {
  // 检查使用次数
  const usageKey = `${player.name}_${skillData.cityName}_清徐陈醋`
  const usageCount = gameStore.skillUsageCount[usageKey] || 0

  if (usageCount >= 2) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"清徐陈醋"，已达使用次数上限（2次）！`)
    return
  }

  // 花费3金币
  if (player.gold < 3) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"清徐陈醋"，金币不足！`)
    return
  }

  player.gold -= 3

  // 初始化延迟技能获取状态
  if (!gameStore.delayedSkillGain) gameStore.delayedSkillGain = {}
  if (!gameStore.delayedSkillGain[player.name]) gameStore.delayedSkillGain[player.name] = []

  gameStore.delayedSkillGain[player.name].push({
    triggerRound: gameStore.currentRound + 5,
    appliedRound: gameStore.currentRound,
    cityName: skillData.cityName
  })

  addPublicLog(`${player.name}的${skillData.cityName}激活"清徐陈醋"，花费3金币，5回合后将获得一个城市专属技能！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)

  // 记录使用次数
  if (!gameStore.skillUsageCount[usageKey]) {
    gameStore.skillUsageCount[usageKey] = 0
  }
  gameStore.skillUsageCount[usageKey]++
}

/**
 * 大同市 - 北岳恒山
 * 限1次，获得一个与该城市HP相同的屏障
 */
export function handleDatongSkill(player, skillData, addPublicLog, gameStore) {
  const datongName = skillData.cityName.name || skillData.cityName
  const datongCity = player.cities[datongName]

  if (!datongCity || datongCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"北岳恒山"，城市已阵亡！`)
    return
  }

  // 初始化屏障状态
  if (!gameStore.barrier) gameStore.barrier = {}

  const barrierHp = getCurrentHp(datongCity)

  gameStore.barrier[player.name] = {
    hp: barrierHp,
    maxHp: barrierHp,
    appliedRound: gameStore.currentRound,
    source: '北岳恒山'
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"北岳恒山"，获得了${barrierHp}HP的屏障！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 晋中市 - 平遥古城
 * 限1次，恢复一个初始HP≤10000的己方城市状态至5回合前
 */
export function handleJinzhongSkill(player, skillData, addPublicLog, gameStore, selectedCityName = null) {
  if (selectedCityName === null) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"平遥古城"，需要选择一座城市！`)
    return
  }

  const targetCity = player.cities[selectedCityName]
  if (!targetCity) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"平遥古城"，目标城市无效！`)
    return
  }

  // 检查初始HP
  const baseHp = targetCity.baseHp || targetCity.hp
  if (baseHp > 10000) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"平遥古城"，目标城市初始HP超过10000！`)
    return
  }

  // 检查历史记录
  if (!gameStore.cityHistory || !gameStore.cityHistory[player.name] || !gameStore.cityHistory[player.name][selectedCityName]) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"平遥古城"，没有找到目标城市5回合前的状态！`)
    return
  }

  const history = gameStore.cityHistory[player.name][selectedCityName]
  const targetRound = gameStore.currentRound - 5

  // 找到5回合前的状态
  const pastState = history.find(h => h.round === targetRound)

  if (!pastState) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"平遥古城"，没有找到目标城市5回合前的状态！`)
    return
  }

  // 恢复状态
  const oldHp = targetCity.currentHp
  targetCity.hp = pastState.hp
  targetCity.currentHp = pastState.currentHp
  targetCity.isAlive = pastState.isAlive

  addPublicLog(`${player.name}的${skillData.cityName}激活"平遥古城"，${targetCity.name}从${oldHp}HP恢复到5回合前的${pastState.currentHp}HP！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 运城市 - 鹳雀楼
 * 冷却1回合，将一个对方未知的己方城市更换为GDP排名比其高1名的城市
 */
export function handleYunchengSkill(player, skillData, addPublicLog, gameStore, selectedCityName = null) {
  if (selectedCityName === null) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"鹳雀楼"，需要选择一座城市！`)
    return
  }

  const targetCity = player.cities[selectedCityName]
  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"鹳雀楼"，目标城市无效或已阵亡！`)
    return
  }

  // 检查是否对对方未知
  const isUnknown = !gameStore.knownCities || Object.values(gameStore.knownCities).every(playerKnown => {
    return !playerKnown[player.name] || !playerKnown[player.name].has(selectedCityName)
  })

  if (!isUnknown) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"鹳雀楼"，目标城市已被对手知晓！`)
    return
  }

  // 获取城市数据库
  const cityDatabase = gameStore.cityDatabase || []

  // 找到当前城市在GDP排名中的位置
  const currentCityData = cityDatabase.find(c => c.name === targetCity.name)
  if (!currentCityData) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"鹳雀楼"，未找到目标城市数据！`)
    return
  }

  const currentRank = currentCityData.gdpRank
  if (!currentRank) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"鹳雀楼"，目标城市没有GDP排名！`)
    return
  }

  // 找到排名高1名的城市（排名数字更小）
  const higherRankCity = cityDatabase.find(c => c.gdpRank === currentRank - 1)
  if (!higherRankCity) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"鹳雀楼"，没有找到GDP排名更高的城市！`)
    return
  }

  // 检查是否已拥有这座城市
  const alreadyOwned = Object.values(player.cities).some(c => c.name === higherRankCity.name)
  if (alreadyOwned) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"鹳雀楼"，己方已拥有${higherRankCity.name}！`)
    return
  }

  // 替换城市
  const oldName = targetCity.name
  targetCity.name = higherRankCity.name
  targetCity.hp = higherRankCity.hp
  targetCity.currentHp = higherRankCity.hp
  targetCity.province = higherRankCity.province
  targetCity.isAlive = true

  addPublicLog(`${player.name}的${skillData.cityName}激活"鹳雀楼"，${oldName}更换为GDP排名更高的${higherRankCity.name}！`)

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
 * 忻州市 - 五台山
 * 己方城市受佛光普照，每回合HP增加500
 */
export function handleXinzhouSkill(player, skillData, addPublicLog, gameStore) {
  // 初始化佛光普照状态
  if (!gameStore.buddhaBless) gameStore.buddhaBless = {}

  gameStore.buddhaBless[player.name] = {
    active: true,
    hpPerRound: 500,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"五台山"，己方所有城市每回合HP增加500！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 临汾市 - 壶口瀑布
 * 限1次，出牌阶段，使己方本回合总战斗力等于己方所有城市HP的和
 */
export function handleLinfenSkill(player, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(player)

  // 计算所有存活城市的HP总和
  const totalHp = aliveCities.reduce((sum, city) => {
    return sum + getCurrentHp(city)
  }, 0)

  // 初始化壶口瀑布状态
  if (!gameStore.hukouWaterfall) gameStore.hukouWaterfall = {}

  gameStore.hukouWaterfall[player.name] = {
    totalPower: totalHp,
    appliedRound: gameStore.currentRound,
    duration: 1  // 仅本回合有效
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"壶口瀑布"，本回合总战斗力等于所有城市HP之和（${totalHp}）！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}
