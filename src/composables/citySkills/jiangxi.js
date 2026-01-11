/**
 * 江西省城市专属技能
 * 包括：南昌市、赣州市、宜春市、吉安市、上饶市、九江市、景德镇市
 * 无技能：抚州市、萍乡市、新余市、鹰潭市
 */

import {
  getAliveCities,
  getCurrentHp,
  getCityIndex
} from './skillHelpers'

/**
 * 南昌市 - 八一记忆
 * 限1次，该城市出战的前三回合消灭对方n个城市，新HP为原始HPxn
 */
export function handleNanchangSkill(player, skillData, addPublicLog, gameStore) {
  const nanchangIndex = getCityIndex(player, skillData.cityName)
  const nanchangCity = player.cities[nanchangIndex]

  if (!nanchangCity || nanchangCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"八一记忆"，城市已阵亡！`)
    return
  }

  // 初始化八一记忆状态
  if (!gameStore.bayiMemory) gameStore.bayiMemory = {}

  gameStore.bayiMemory[player.name] = {
    active: true,
    cityIndex: nanchangIndex,
    initialHp: nanchangCity.hp,
    roundsTracked: 3,  // 跟踪前3回合
    startRound: gameStore.currentRound,
    killCount: 0,  // 消灭城市数量
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"八一记忆"，前3回合消灭n座城市后HP变为原始HP×n！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 赣州市 - 长征伊始
 * 限1次，己方中心HP若不满初始HP的一半，可选择己方阵营中的另一座城市作为新中心，
 * HPx2，原中心不淘汰且HP增加50%
 */
export function handleGanzhouSkill(player, skillData, addPublicLog, gameStore, newCenterIndex = null) {
  const centerIndex = player.centerIndex || 0
  const centerCity = player.cities[centerIndex]

  if (!centerCity) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"长征伊始"，中心城市不存在！`)
    return
  }

  // 检查中心城市HP是否低于初始HP的一半
  const centerInitialHp = centerCity.hp
  if (getCurrentHp(centerCity) >= centerInitialHp / 2) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"长征伊始"，中心城市HP不低于初始HP的一半！`)
    return
  }

  if (newCenterIndex === null || newCenterIndex === centerIndex) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"长征伊始"，需要选择另一座城市作为新中心！`)
    return
  }

  const newCenterCity = player.cities[newCenterIndex]
  if (!newCenterCity || newCenterCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"长征伊始"，目标城市无效或已阵亡！`)
    return
  }

  // 原中心当前HP增加50%
  const oldCenterHp = centerCity.currentHp
  centerCity.currentHp = centerCity.currentHp * 1.5

  // 新中心HP×2（包括HP上限和当前HP）
  const oldNewCenterHp = newCenterCity.currentHp
  newCenterCity.currentHp = newCenterCity.currentHp * 2
  newCenterCity.hp = newCenterCity.hp * 2

  // 更新中心索引
  player.centerIndex = newCenterIndex

  addPublicLog(`${player.name}的${skillData.cityName}激活"长征伊始"，${centerCity.name}（原中心）HP增加50%（${Math.floor(oldCenterHp)} → ${Math.floor(centerCity.currentHp)}），${newCenterCity.name}成为新中心且HP×2（${Math.floor(oldNewCenterHp)} → ${Math.floor(newCenterCity.currentHp)}）！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 宜春市 - 明月山
 * 限1次，己方一座城市禁止出战2回合，2回合后恢复至初始HP（HP8000以下可使用）
 */
export function handleYichunSkill(player, skillData, addPublicLog, gameStore, selectedCityIndex = null) {
  if (selectedCityIndex === null) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"明月山"，需要选择一座城市！`)
    return
  }

  const targetCity = player.cities[selectedCityIndex]
  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"明月山"，目标城市无效或已阵亡！`)
    return
  }

  // 检查HP限制
  if (getCurrentHp(targetCity) > 8000) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"明月山"，目标城市HP超过8000！`)
    return
  }

  // 初始化明月山状态
  if (!gameStore.mingyueMountain) gameStore.mingyueMountain = {}
  if (!gameStore.mingyueMountain[player.name]) gameStore.mingyueMountain[player.name] = {}

  gameStore.mingyueMountain[player.name][selectedCityIndex] = {
    offFieldRounds: 2,
    returnRound: gameStore.currentRound + 2,
    restoreToInitialHp: true,
    initialHp: targetCity.hp,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"明月山"，${targetCity.name}禁止出战2回合，之后恢复至初始HP（${targetCity.hp}）！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 吉安市 - 井冈山
 * 限1次，该城市秘密连续出战3回合（不会疲劳），并对对方城市造成自身HP50%的伤害
 * （3回合后告知对方）但需要承受对方城市10%的溢出伤害（若对方城市已被我方的出战城市消灭则伤害为0），
 * 3回合结束后若未阵亡则HP恢复至初始HP且HPx3
 */
export function handleJianSkill(player, skillData, addPublicLog, gameStore) {
  const jianIndex = getCityIndex(player, skillData.cityName)
  const jianCity = player.cities[jianIndex]

  if (!jianCity || jianCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"井冈山"，城市已阵亡！`)
    return
  }

  // 初始化井冈山状态
  if (!gameStore.jinggangMountain) gameStore.jinggangMountain = {}

  const jianHp = getCurrentHp(jianCity)
  const initialHp = jianCity.hp

  gameStore.jinggangMountain[player.name] = {
    active: true,
    cityIndex: jianIndex,
    roundsLeft: 3,
    damagePerRound: Math.floor(jianHp * 0.5),  // 50% HP伤害
    overflowDamagePercent: 0.1,  // 承受10%溢出伤害
    startRound: gameStore.currentRound,
    endRound: gameStore.currentRound + 3,
    initialHp: initialHp,  // 记录初始HP
    restoreAndMultiply: true,  // 3回合后恢复至初始HP且×3
    secret: true,  // 秘密进行
    appliedRound: gameStore.currentRound
  }

  // 只给己方发私有日志
  addPublicLog(`${player.name}使用了一个秘密技能`, true, player.name)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 上饶市 - 鄱阳湖
 * 限1次，对对方3座城市造成3000HP的伤害，若有n座城市阵亡，则另外n座城市再受到1000点伤害
 */
export function handleShangraoSkill(player, skillData, addPublicLog, gameStore, targetPlayer = null, targetCityIndices = null) {
  if (!targetPlayer || !targetCityIndices || targetCityIndices.length !== 3) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"鄱阳湖"，需要选择对方3座城市！`)
    return
  }

  const validTargets = targetCityIndices.filter(idx => {
    const city = targetPlayer.cities[idx]
    return city && city.isAlive !== false
  })

  if (validTargets.length === 0) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"鄱阳湖"，没有有效的目标城市！`)
    return
  }

  // 第一轮：造成3000伤害
  let killCount = 0
  const damagedCities = []

  validTargets.forEach(idx => {
    const city = targetPlayer.cities[idx]
    const oldHp = city.currentHp
    city.currentHp -= 3000

    if (city.currentHp <= 0) {
      city.currentHp = 0
      city.isAlive = false
      killCount++
      addPublicLog(`${targetPlayer.name}的${city.name}被${skillData.cityName}的鄱阳湖摧毁！`)
    } else {
      damagedCities.push(idx)
      addPublicLog(`${targetPlayer.name}的${city.name}受到3000点伤害（${oldHp} → ${city.currentHp}）`)
    }
  })

  // 第二轮：如果有城市阵亡，对剩余城市造成额外伤害
  if (killCount > 0 && damagedCities.length > 0) {
    const extraDamage = 1000 * killCount

    damagedCities.forEach(idx => {
      const city = targetPlayer.cities[idx]
      const oldHp = city.currentHp
      city.currentHp -= extraDamage

      if (city.currentHp <= 0) {
        city.currentHp = 0
        city.isAlive = false
        addPublicLog(`${targetPlayer.name}的${city.name}被溅射伤害摧毁！`)
      } else {
        addPublicLog(`${targetPlayer.name}的${city.name}受到溅射伤害${extraDamage}（${oldHp} → ${city.currentHp}）`)
      }
    })
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"鄱阳湖"，消灭了${killCount}座城市！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 九江市 - 庐山胜境
 * 选定一座非中心城市，给它一个HP为省内最低城市HP的护盾，对方攻击优先打在护盾上
 * （直辖市和特别行政区无法使用）
 */
export function handleJiujiangSkill(player, skillData, addPublicLog, gameStore, selectedCityIndex = null) {
  // 检查是否为直辖市或特别行政区
  const jiujiangIndex = getCityIndex(player, skillData.cityName)
  const jiujiangCity = player.cities[jiujiangIndex]

  if (!jiujiangCity) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"庐山胜境"，城市不存在！`)
    return
  }

  const province = jiujiangCity.province
  const specialRegions = ['北京市', '天津市', '上海市', '重庆市', '香港特别行政区', '澳门特别行政区']

  if (specialRegions.includes(province)) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"庐山胜境"，直辖市和特别行政区无法使用！`)
    return
  }

  if (selectedCityIndex === null) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"庐山胜境"，需要选择一座城市！`)
    return
  }

  // 检查目标城市是否为中心城市
  const centerIndex = player.centerIndex || 0
  if (selectedCityIndex === centerIndex) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"庐山胜境"，不能选择中心城市！`)
    return
  }

  const targetCity = player.cities[selectedCityIndex]
  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"庐山胜境"，目标城市无效或已阵亡！`)
    return
  }

  // 获取省内所有城市
  const provinceCities = player.cities.filter(city => {
    return city.province === province && city.isAlive !== false
  })

  if (provinceCities.length === 0) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"庐山胜境"，省内没有存活城市！`)
    return
  }

  // 找到省内最低HP
  const lowestHp = Math.min(...provinceCities.map(city => getCurrentHp(city)))

  // 初始化庐山胜境护盾
  if (!gameStore.lushanShield) gameStore.lushanShield = {}
  if (!gameStore.lushanShield[player.name]) gameStore.lushanShield[player.name] = {}

  gameStore.lushanShield[player.name][selectedCityIndex] = {
    shieldHp: lowestHp,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"庐山胜境"，${targetCity.name}获得${lowestHp}HP的护盾！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 景德镇市 - 中国瓷都
 * 限2次，出战时建立一座护盾，对方攻击无效且反弹50%伤害
 */
export function handleJingdezhenSkill(player, skillData, addPublicLog, gameStore) {
  // 检查使用次数
  const usageKey = `${player.name}_${skillData.cityName}_中国瓷都`
  const usageCount = gameStore.skillUsageCount[usageKey] || 0

  if (usageCount >= 2) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"中国瓷都"，已达使用次数上限（2次）！`)
    return
  }

  // 初始化中国瓷都护盾
  if (!gameStore.porcelainShield) gameStore.porcelainShield = {}

  gameStore.porcelainShield[player.name] = {
    active: true,
    reflectPercent: 0.5,  // 反弹50%伤害
    appliedRound: gameStore.currentRound,
    duration: 1  // 本回合有效
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"中国瓷都"，本回合攻击无效且反弹50%伤害！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)

  // 记录使用次数
  if (!gameStore.skillUsageCount[usageKey]) {
    gameStore.skillUsageCount[usageKey] = 0
  }
  gameStore.skillUsageCount[usageKey]++
}
