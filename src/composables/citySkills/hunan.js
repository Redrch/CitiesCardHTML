/**
 * 湖南省城市专属技能
 * 包括：长沙市、株洲市、湘潭市、衡阳市、岳阳市、张家界市、常德市、娄底市、永州市、怀化市、湘西州
 * 无技能：邵阳市、益阳市、郴州市
 */

import {
  getAliveCities,
  getCurrentHp,
  healCity,
  increaseMaxHp,
  summonCity
} from './skillHelpers'

/**
 * 长沙市 - 橘子洲头
 * 限1次，该城市HPx2，并随机召唤两座湖南城市加入己方阵营
 */
export function handleChangshaSkill(player, skillData, addPublicLog, gameStore) {
  const cityName = skillData.cityName.name || skillData.cityName
  const city = player.cities[cityName]

  if (!city || city.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"橘子洲头"，城市已阵亡！`)
    return
  }

  // HP翻倍
  const oldMaxHp = city.hp
  city.hp = city.hp * 2
  city.currentHp = city.currentHp * 2
  addPublicLog(`${player.name}的${skillData.cityName}激活"橘子洲头"，HP翻倍（${oldMaxHp} → ${city.hp}）！`)

  // 随机召唤两座湖南城市
  const hunanCities = [
    '株洲市', '湘潭市', '衡阳市', '邵阳市', '岳阳市',
    '张家界市', '益阳市', '常德市', '娄底市', '郴州市',
    '永州市', '怀化市', '湘西州'
  ]

  const availableCities = hunanCities.filter(cityName => {
    return !Object.values(player.cities).some(c => c.name === cityName)
  })

  const summonCount = Math.min(2, availableCities.length)
  for (let i = 0; i < summonCount; i++) {
    const randomName = Math.floor(Math.random() * availableCities.length)
    const cityName = availableCities.splice(randomName, 1)[0]
    summonCity(player, cityName, gameStore, addPublicLog)
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 株洲市 - 炎帝陵
 * 限1次，选定己方2座HP低于5000的城市HPx2，并随机掠夺对方一座HP低于5000的城市加入己方阵营
 */
export function handleZhuzhouSkill(player, skillData, addPublicLog, gameStore, selectedCityNames = null, targetPlayer = null) {
  const aliveCities = getAliveCities(player)

  // 筛选HP低于5000的城市
  const lowHpCities = aliveCities.filter(city => getCurrentHp(city) < 5000)

  if (lowHpCities.length === 0) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"炎帝陵"，没有HP低于5000的城市！`)
    return
  }

  // 选择城市（最多2座）
  let citiesToBuff
  if (selectedCityNames && Array.isArray(selectedCityNames)) {
    citiesToBuff = selectedCityNames.map(name => player.cities[name]).filter(city => city && getCurrentHp(city) < 5000)
  } else {
    // 默认选择HP最低的2座
    citiesToBuff = lowHpCities.sort((a, b) => getCurrentHp(a) - getCurrentHp(b)).slice(0, 2)
  }

  // HP翻倍
  citiesToBuff.forEach(city => {
    const oldMaxHp = city.hp
    city.hp = city.hp * 2
    city.currentHp = city.currentHp * 2
    addPublicLog(`${player.name}的${city.name} HP翻倍（${oldMaxHp} → ${city.hp}）！`)
  })

  // 随机掠夺对方一座HP低于5000的城市
  if (targetPlayer) {
    const targetLowHpCities = getAliveCities(targetPlayer).filter(city => getCurrentHp(city) < 5000)
    if (targetLowHpCities.length > 0) {
      const randomCity = targetLowHpCities[Math.floor(Math.random() * targetLowHpCities.length)]
      const cityName = randomCity.name.name || randomCity.name

      // 移除城市
      const capturedCity = targetPlayer.cities.splice(cityName, 1)[0]

      // 重置为初始状态
      capturedCity.currentHp = capturedCity.hp
      capturedCity.isAlive = true

      // 添加到己方
      player.cities[capturedCity.name] = capturedCity
      addPublicLog(`${player.name}掠夺了${targetPlayer.name}的${capturedCity.name}！`)
    }
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 湘潭市 - 伟人故里
 * 限1次，该城市和己方另一座城市HPx2，并召唤赣州市和吉安市加入己方阵营，若己方阵中已拥有赣州市或吉安市，HPx2
 */
export function handleXiangtanSkill(player, skillData, addPublicLog, gameStore, selectedCityName = null) {
  const cityName = skillData.cityName.name || skillData.cityName
  const city = player.cities[cityName]

  if (!city || city.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"伟人故里"，城市已阵亡！`)
    return
  }

  // 湘潭市HP翻倍
  const oldMaxHp = city.hp
  city.hp = city.hp * 2
  city.currentHp = city.currentHp * 2
  addPublicLog(`${player.name}的${skillData.cityName} HP翻倍（${oldMaxHp} → ${city.hp}）！`)

  // 另一座城市HP翻倍
  let targetCity
  if (selectedCityName !== null && selectedCityName !== undefined && selectedCityName !== cityName) {
    targetCity = player.cities[selectedCityName]
  } else {
    // 默认选择除湘潭市外HP最低的城市
    const otherCities = getAliveCities(player).filter(c => c.name !== skillData.cityName)
    if (otherCities.length > 0) {
      targetCity = otherCities.sort((a, b) => getCurrentHp(a) - getCurrentHp(b))[0]
    }
  }

  if (targetCity) {
    const oldMaxHp2 = targetCity.hp
    targetCity.hp = targetCity.hp * 2
    targetCity.currentHp = targetCity.currentHp * 2
    addPublicLog(`${player.name}的${targetCity.name} HP翻倍（${oldMaxHp2} → ${targetCity.hp}）！`)
  }

  // 召唤或强化赣州市和吉安市
  const targetCities = ['赣州市', '吉安市']
  targetCities.forEach(cityName => {
    const existingCity = Object.values(player.cities).find(c => c.name === cityName)
    if (existingCity) {
      // 已拥有，HP翻倍
      const oldHp = existingCity.hp
      existingCity.hp = existingCity.hp * 2
      existingCity.currentHp = existingCity.currentHp * 2
      addPublicLog(`${player.name}的${cityName} HP翻倍（${oldHp} → ${existingCity.hp}）！`)
    } else {
      // 召唤
      summonCity(player, cityName, gameStore, addPublicLog)
    }
  })

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 衡阳市 - 南岳衡山
 * 限1次，选定对方一座HP低于30000的城市强制连续出战2回合，2回合后若未阵亡则HP减半
 */
export function handleHengyangSkill(player, skillData, addPublicLog, gameStore, targetPlayer = null, targetCityName = null) {
  if (!targetPlayer || targetCityName === null) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"南岳衡山"，未指定目标！`)
    return
  }

  const targetCity = targetPlayer.cities[targetCityName]
  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"南岳衡山"，目标城市无效！`)
    return
  }

  if (getCurrentHp(targetCity) >= 30000) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"南岳衡山"，目标城市HP不低于30000！`)
    return
  }

  // 初始化强制出战状态
  if (!gameStore.forceDeploy) gameStore.forceDeploy = {}
  if (!gameStore.forceDeploy[targetPlayer.name]) gameStore.forceDeploy[targetPlayer.name] = {}

  gameStore.forceDeploy[targetPlayer.name][targetCityName] = {
    roundsLeft: 2,
    appliedRound: gameStore.currentRound,
    halvePenalty: true  // 2回合后若未阵亡HP减半
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"南岳衡山"，${targetPlayer.name}的${targetCity.name}强制连续出战2回合！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 岳阳市 - 岳阳楼记
 * 限1次，该城市HPx2并随机召唤一座除长沙市之外的湖南省城市
 */
export function handleYueyangSkill(player, skillData, addPublicLog, gameStore) {
  const cityName = skillData.cityName.name || skillData.cityName
  const city = player.cities[cityName]

  if (!city || city.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"岳阳楼记"，城市已阵亡！`)
    return
  }

  // HP翻倍
  const oldMaxHp = city.hp
  city.hp = city.hp * 2
  city.currentHp = city.currentHp * 2
  addPublicLog(`${player.name}的${skillData.cityName} HP翻倍（${oldMaxHp} → ${city.hp}）！`)

  // 随机召唤一座湖南城市（除长沙市外）
  const hunanCities = [
    '株洲市', '湘潭市', '衡阳市', '邵阳市',
    '张家界市', '益阳市', '常德市', '娄底市', '郴州市',
    '永州市', '怀化市', '湘西州'
  ]

  const availableCities = hunanCities.filter(cityName => {
    return !Object.values(player.cities).some(c => c.name === cityName)
  })

  if (availableCities.length > 0) {
    const randomName = Math.floor(Math.random() * availableCities.length)
    const cityName = availableCities[randomName]
    summonCity(player, cityName, gameStore, addPublicLog)
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 张家界市 - 千山迷阵
 * 限1次，直接摧毁对方一座初始HP低于8000的已知城市，50%的概率获得该城市的初始HP并加入己方阵营
 */
export function handleZhangjiajieSkill(player, skillData, addPublicLog, gameStore, targetPlayer = null, targetCityName = null) {
  if (!targetPlayer || targetCityName === null) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"千山迷阵"，未指定目标！`)
    return
  }

  const targetCity = targetPlayer.cities[targetCityName]
  if (!targetCity || targetCity.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"千山迷阵"，目标城市无效！`)
    return
  }

  // 检查初始HP（使用baseHp或hp字段）
  const baseHp = targetCity.baseHp || targetCity.hp
  if (baseHp >= 8000) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"千山迷阵"，目标城市初始HP不低于8000！`)
    return
  }

  // 摧毁城市
  const cityName = targetCity.name
  targetCity.currentHp = 0
  targetCity.isAlive = false
  addPublicLog(`${player.name}的${skillData.cityName}激活"千山迷阵"，摧毁了${targetPlayer.name}的${cityName}！`)

  // 50%概率获得该城市的初始HP
  if (Math.random() < 0.5) {
    // 创建初始HP状态的城市
    const newCity = {
      name: cityName,
      hp: baseHp,
      currentHp: baseHp,
      isAlive: true
    }
    player.cities[newCity.name] = newCity
    addPublicLog(`${player.name}获得了${cityName}的初始HP（${baseHp}）！`)
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 常德市 - 桃花源记
 * 限1次，使用时不公开，对方2回合攻击无效
 */
export function handleChangdeSkill(player, skillData, addPublicLog, gameStore) {
  // 初始化桃花源记状态
  if (!gameStore.peachBlossom) gameStore.peachBlossom = {}

  gameStore.peachBlossom[player.name] = {
    roundsLeft: 2,
    appliedRound: gameStore.currentRound,
    secret: true  // 不公开
  }

  // 只给自己发私有日志
  addPublicLog(`${player.name}使用了一个技能（秘密）`, true, player.name)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 娄底市 - 世界锑都
 * 限1次，我方2座HP低于5000的城市HPx2
 */
export function handleLoudiSkill(player, skillData, addPublicLog, gameStore, selectedCityNames = null) {
  const aliveCities = getAliveCities(player)

  // 筛选HP低于5000的城市
  const lowHpCities = aliveCities.filter(city => getCurrentHp(city) < 5000)

  if (lowHpCities.length === 0) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"世界锑都"，没有HP低于5000的城市！`)
    return
  }

  // 选择城市（最多2座）
  let citiesToBuff
  if (selectedCityNames && Array.isArray(selectedCityNames)) {
    citiesToBuff = selectedCityNames.map(name => player.cities[name]).filter(city => city && getCurrentHp(city) < 5000)
  } else {
    // 默认选择HP最低的2座
    citiesToBuff = lowHpCities.sort((a, b) => getCurrentHp(a) - getCurrentHp(b)).slice(0, 2)
  }

  const count = Math.min(2, citiesToBuff.length)
  for (let i = 0; i < count; i++) {
    const city = citiesToBuff[i]
    const oldMaxHp = city.hp
    city.hp = city.hp * 2
    city.currentHp = city.currentHp * 2
    addPublicLog(`${player.name}的${city.name} HP翻倍（${oldMaxHp} → ${city.hp}）！`)
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 永州市 - 永州八记
 * 限1次，该城市和己方另外一座HP低于8000的城市HPx2，并选定对方一座城市禁用博学多才技能
 */
export function handleYongzhouSkill(player, skillData, addPublicLog, gameStore, selectedCityName = null, targetPlayer = null, targetCityName = null) {
  const cityName = skillData.cityName.name || skillData.cityName
  const city = player.cities[cityName]

  if (!city || city.isAlive === false) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"永州八记"，城市已阵亡！`)
    return
  }

  // 永州市HP翻倍
  const oldMaxHp = city.hp
  city.hp = city.hp * 2
  city.currentHp = city.currentHp * 2
  addPublicLog(`${player.name}的${skillData.cityName} HP翻倍（${oldMaxHp} → ${city.hp}）！`)

  // 另一座HP低于8000的城市HP翻倍
  const aliveCities = getAliveCities(player).filter(c => c.name !== skillData.cityName && getCurrentHp(c) < 8000)

  let targetCity
  if (selectedCityName !== null && selectedCityName !== undefined && selectedCityName !== cityName) {
    targetCity = player.cities[selectedCityName]
    if (getCurrentHp(targetCity) >= 8000) {
      addPublicLog(`${player.name}的${skillData.cityName}无法选择${targetCity.name}，HP不低于8000！`)
      targetCity = null
    }
  } else {
    // 默认选择HP最低的城市
    if (aliveCities.length > 0) {
      targetCity = aliveCities.sort((a, b) => getCurrentHp(a) - getCurrentHp(b))[0]
    }
  }

  if (targetCity) {
    const oldMaxHp2 = targetCity.hp
    targetCity.hp = targetCity.hp * 2
    targetCity.currentHp = targetCity.currentHp * 2
    addPublicLog(`${player.name}的${targetCity.name} HP翻倍（${oldMaxHp2} → ${targetCity.hp}）！`)
  }

  // 禁用对方城市的博学多才技能
  if (targetPlayer && targetCityName !== null) {
    const oppCity = targetPlayer.cities[targetCityName]
    if (oppCity) {
      if (!gameStore.skillBanned) gameStore.skillBanned = {}
      if (!gameStore.skillBanned[targetPlayer.name]) gameStore.skillBanned[targetPlayer.name] = {}
      if (!gameStore.skillBanned[targetPlayer.name][targetCityName]) {
        gameStore.skillBanned[targetPlayer.name][targetCityName] = []
      }

      gameStore.skillBanned[targetPlayer.name][targetCityName].push('博学多才')
      addPublicLog(`${targetPlayer.name}的${oppCity.name}被禁用"博学多才"技能！`)
    }
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 怀化市 - 华南交通中枢
 * 限1次，对方使用技能召唤得到某城市时，若HP低于5000，则加入己方阵营（被动触发）
 */
export function handleHuaihuaSkill(player, skillData, addPublicLog, gameStore) {
  // 初始化技能拦截状态
  if (!gameStore.summonIntercept) gameStore.summonIntercept = {}

  gameStore.summonIntercept[player.name] = {
    active: true,
    hpThreshold: 5000,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${player.name}的${skillData.cityName}激活"华南交通中枢"，将拦截对方召唤的低HP城市！`)
  gameStore.recordSkillUsage(player.name, skillData.cityName)
}

/**
 * 湘西州 - 凤凰古城
 * 限1次，己方2座HP低于10000的城市HPx2
 */
export function handleXiangxiSkill(player, skillData, addPublicLog, gameStore, selectedCityNames = null) {
  const aliveCities = getAliveCities(player)

  // 筛选HP低于10000的城市
  const lowHpCities = aliveCities.filter(city => getCurrentHp(city) < 10000)

  if (lowHpCities.length === 0) {
    addPublicLog(`${player.name}的${skillData.cityName}无法激活"凤凰古城"，没有HP低于10000的城市！`)
    return
  }

  // 选择城市（最多2座）
  let citiesToBuff
  if (selectedCityNames && Array.isArray(selectedCityNames)) {
    citiesToBuff = selectedCityNames.map(name => player.cities[name]).filter(city => city && getCurrentHp(city) < 10000)
  } else {
    // 默认选择HP最低的2座
    citiesToBuff = lowHpCities.sort((a, b) => getCurrentHp(a) - getCurrentHp(b)).slice(0, 2)
  }

  const count = Math.min(2, citiesToBuff.length)
  for (let i = 0; i < count; i++) {
    const city = citiesToBuff[i]
    const oldMaxHp = city.hp
    city.hp = city.hp * 2
    city.currentHp = city.currentHp * 2
    addPublicLog(`${player.name}的${city.name} HP翻倍（${oldMaxHp} → ${city.hp}）！`)
  }

  gameStore.recordSkillUsage(player.name, skillData.cityName)
}
