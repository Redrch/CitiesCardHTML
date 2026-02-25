/**
 * 江苏省城市专属技能
 * 包括：南京、无锡、徐州、常州、苏州、南通、连云港、淮安、盐城、扬州、镇江、泰州、宿迁
 */

import {
  getAliveCities,
  sortCitiesByHp,
  getCurrentHp,
  healCity,
  damageCity,
  addShield,
} from './skillHelpers'

/**
 * 南京市 - 古都守护
 * 限2次，出战时给己方一个持续3回合的10000HP护盾
 */
export function handleNanjingSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    const sorted = sortCitiesByHp(aliveCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    addShield(gameStore, attacker.name, cityName, {
      hp: 10000,
      roundsLeft: 3
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"古都守护"，${targetCity.name}获得10000HP护盾（持续3回合）`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 徐州市 - 汉王故里
 * 限2次，给己方一座城市+5000HP
 */
export function handleXuzhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    const sorted = sortCitiesByHp(aliveCities)
    const targetCity = sorted[0]
    const { oldHp, newHp } = healCity(targetCity, 5000)

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"汉王故里"，${targetCity.name}恢复5000HP（${oldHp} -> ${newHp}）`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 常州市 - 恐龙震慑
 * 出战时减少对方所有出战城市2000HP（被动触发）
 */
export function handleChangzhouSkill(attacker, defender, defenderCities, skillData, addPublicLog, gameStore) {
  defenderCities.forEach(city => {
    if (city && city.hp > 0) {
      const { newHp } = damageCity(city, 2000)
      if (city.hp !== undefined) city.hp = newHp
    }
  })
  addPublicLog(`${attacker.name}的${skillData.cityName}激活"恐龙震慑"，${defender.name}的所有出战城市减少2000HP！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 苏州市 - 园林迷阵
 * 限1次，出战时使对方城市进入园林迷阵，并直接减少50%HP，50%概率直接摧毁一座对方出战城市
 */
export function handleSuzhouSkill(attacker, defender, defenderCities, skillData, addPublicLog, gameStore) {
  defenderCities.forEach(city => {
    if (city && city.hp > 0) {
      const oldHp = getCurrentHp(city)
      const newHp = Math.floor(oldHp * 0.5)
      city.currentHp = newHp
      if (city.hp !== undefined) city.hp = newHp

      // 50%概率直接摧毁
      if (Math.random() < 0.5) {
        city.currentHp = 0
        city.hp = 0
        city.isAlive = false
        addPublicLog(`${attacker.name}的${skillData.cityName}激活"园林迷阵"，${defender.name}的${city.name}被摧毁！`)
      }
    }
  })
  addPublicLog(`${attacker.name}的${skillData.cityName}激活"园林迷阵"，${defender.name}的出战城市HP减半！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 淮安市 - 盱眙小龙虾
 * 限3次，给己方一座城市+500HP的回血
 */
export function handleHuaianSkill(attacker, skillData, addPublicLog, gameStore) {
  // 调用镇江技能（相同效果）
  handleZhenjiangSkill(attacker, skillData, addPublicLog, gameStore)
}

/**
 * 扬州市 - 美食之都
 * 限1次，给己方5座城市+2000HP的回血
 */
export function handleYangzhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  const citiesToHeal = aliveCities.slice(0, 5)

  citiesToHeal.forEach(city => {
    healCity(city, 2000)
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"美食之都"，${citiesToHeal.length}座城市恢复2000HP！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 镇江市 - 镇江香醋
 * 限3次，给己方一座城市+500HP的回血
 */
export function handleZhenjiangSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    const sorted = sortCitiesByHp(aliveCities)
    const targetCity = sorted[0]
    const { oldHp, newHp } = healCity(targetCity, 500)

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"镇江香醋"，${targetCity.name}恢复500HP（${oldHp} -> ${newHp}）`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 泰州市 - 医药城
 * 限2次，给己方2个城市HP恢复到原始HP的80%
 */
export function handleTaizhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)
  const sorted = sortCitiesByHp(aliveCities)
  const citiesToHeal = sorted.slice(0, 2)

  citiesToHeal.forEach(city => {
    const targetHp = Math.floor(city.hp * 0.8)
    city.currentHp = targetHp
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"医药城"，${citiesToHeal.length}座城市恢复至80%HP！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 宿迁市 - 项王故里
 * 出战时增加2000攻击力（被动触发）
 */
export function handleSuqianSkill(attacker, skillData, addPublicLog, gameStore) {
  const suqianName = skillData.cityName.name || skillData.cityName

  // 初始化临时攻击力增益系统
  if (!gameStore.tempAttackBoost) gameStore.tempAttackBoost = {}
  if (!gameStore.tempAttackBoost[attacker.name]) gameStore.tempAttackBoost[attacker.name] = {}

  // 为宿迁市添加2000攻击力
  gameStore.tempAttackBoost[attacker.name][suqianName] = {
    bonus: 2000,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"项王故里"，攻击力增加2000！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 无锡市 - 灵山大佛
 * 限2次，给己方一个城市3回合的护盾，在此期间免除任何技能的额外影响
 */
export function handleWuxiSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    const sorted = sortCitiesByHp(aliveCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    addShield(gameStore, attacker.name, cityName, {
      hp: 5000,  // 给一个基础护盾
      roundsLeft: 3,
      extra: {
        skillImmune: true  // 标记免疫技能影响
      }
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"灵山大佛"，${targetCity.name}获得护盾并3回合内免除技能影响！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 南通市 - 南通小卷
 * 限1次，选定对方一座城市，接下来2回合必须连续出战造成疲劳
 */
export function handleNantongSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(defender)

  if (aliveCities.length > 0) {
    // 选择对方HP最高的城市
    const sorted = sortCitiesByHp(aliveCities).reverse()
    const targetCity = sorted[0]
    const cityName = targetCity.name

    // 初始化强制出战系统
    if (!gameStore.forcedDeploy) gameStore.forcedDeploy = {}
    if (!gameStore.forcedDeploy[defender.name]) gameStore.forcedDeploy[defender.name] = {}

    gameStore.forcedDeploy[defender.name][cityName] = {
      roundsLeft: 2,
      appliedRound: gameStore.currentRound,
      fatigued: true  // 疲劳状态
    }

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"南通小卷"，${defender.name}的${targetCity.name}接下来2回合必须连续出战！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 连云港市 - 花果山
 * 限2次，选定己方一座城市进入花果山2回合，2回合后该城市HP×2（HP15000以下可使用）
 */
export function handleLianyungangSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getAliveCities(attacker).filter(c => {
    const hp = getCurrentHp(c)
    return c.hp <= 15000
  })

  if (eligibleCities.length > 0) {
    const sorted = sortCitiesByHp(eligibleCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    // 使用延迟效果系统
    if (!gameStore.delayedEffects) gameStore.delayedEffects = {}
    if (!gameStore.delayedEffects[attacker.name]) gameStore.delayedEffects[attacker.name] = {}

    gameStore.delayedEffects[attacker.name][cityName] = {
      type: 'huaguoshan',
      effectRoundsLeft: 2,
      effectData: {
        hpMultiplier: 2,
        appliedRound: gameStore.currentRound
      }
    }

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"花果山"，${targetCity.name}进入花果山2回合，之后HP×2！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 盐城市 - 无山阻隔
 * 限2次，出战时己方优先对对方城市造成伤害并直接撤退（被动触发）
 */
export function handleYanchengSkill(attacker, skillData, addPublicLog, gameStore) {
  // 标记优先攻击
  if (!gameStore.combatModifiers) gameStore.combatModifiers = {}
  if (!gameStore.combatModifiers[attacker.name]) gameStore.combatModifiers[attacker.name] = {}

  gameStore.combatModifiers[attacker.name].strikeFirst = {
    active: true,
    retreat: true,  // 攻击后直接撤退
    roundsLeft: 1
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"无山阻隔"，优先攻击并撤退！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
