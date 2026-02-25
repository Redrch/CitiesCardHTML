/**
 * 广东省城市专属技能
 * 包括：广州、深圳、珠海、汕头、佛山、韶关、湛江、肇庆、江门、茂名、惠州、梅州、汕尾、河源、阳江、清远、东莞、中山、潮州、揭阳、云浮
 */

import {
  getAliveCities,
  getEligibleCitiesByHp,
  sortCitiesByHp,
  getCurrentHp,
  findCity,
  healCity,
  damageCity,
  boostCityHp,
  addShield,
  addDelayedEffect
} from './skillHelpers'
import { handleZhenjiangSkill } from './jiangsu'

/**
 * 广州市 - 千年商都
 * 限1次，消耗一金币随机获得一个HP10000以下的对方城市
 */
export function handleGuangzhouSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  // 检查金币
  if (attacker.gold < 1) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"千年商都"，金币不足！`)
    return
  }

  // 筛选对方HP≤10000的城市
  const eligibleCities = Object.values(defender.cities).filter(city =>
    city.isAlive !== false && city.hp <= 10000
  )

  if (eligibleCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"千年商都"，对方没有HP≤10000的城市！`)
    return
  }

  // 随机选择一座城市
  const targetCity = eligibleCities[Math.floor(Math.random() * eligibleCities.length)]
  const cityName = targetCity.name

  // 从对方移除城市
  const plunderedCity = {
    ...targetCity,
    currentHp: getCurrentHp(targetCity)
  }

  // 标记为已掠夺（对方失去该城市）
  targetCity.isAlive = false
  targetCity.currentHp = 0
  targetCity.hp = 0

  // 加入己方阵营（使用城市名称作为键）
  attacker.cities[cityName] = plunderedCity

  // 扣除金币
  attacker.gold -= 1

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"千年商都"，消耗1金币掠夺${defender.name}的${plunderedCity.name}！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 深圳市 - 特区领袖
 * 限1次，选定己方三座HP低于15000的城市HP×2
 */
export function handleShenzhenSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getEligibleCitiesByHp(attacker, 14999)
  const citiesToBoost = eligibleCities.slice(0, 3)

  citiesToBoost.forEach(city => {
    boostCityHp(city, 2)
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"特区领袖"，${citiesToBoost.length}座城市HP×2！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 珠海市 - 浪漫海滨
 * 限2次，出战时对方城市对己方城市攻击减半（被动触发）
 */
export function handleZhuhaiSkill(attacker, skillData, addPublicLog, gameStore) {
  // 设置伤害减免状态
  if (!gameStore.damageReduction) gameStore.damageReduction = {}
  if (!gameStore.damageReduction[attacker.name]) gameStore.damageReduction[attacker.name] = {}

  gameStore.damageReduction[attacker.name].romanticCoast = {
    active: true,
    multiplier: 0.5,  // 伤害减半
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"浪漫海滨"，本回合受到的攻击伤害减半！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 汕头市 - 侨乡潮韵
 * 限1次，召唤揭阳市和潮州市加入己方
 */
export function handleShantouSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.availableCities) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"侨乡潮韵"，城市池不可用！`)
    return
  }

  const targetCityNames = ['揭阳市', '潮州市']
  const summoned = []
  const doubled = []

  targetCityNames.forEach(cityName => {
    // 检查是否已拥有该城市
    const existingCity = findCity(attacker, cityName)
    if (existingCity) {
      // 已拥有，战斗力翻倍（HP翻倍）
      boostCityHp(existingCity, 2)
      doubled.push(cityName)
    } else {
      // 从城市池中寻找
      const cityData = gameStore.availableCities.find(city =>
        city.name === cityName && !city.isUsed
      )
      if (cityData) {
        const newCity = {
          name: cityData.name,
          hp: cityData.hp,
          currentHp: cityData.hp,
          isAlive: true,
          province: cityData.province,
          red: 0,
          green: 0,
          blue: 0,
          yellow: 0
        }
        attacker.cities[newCity.name] = newCity
        cityData.isUsed = true
        summoned.push(cityName)
      }
    }
  })

  let message = `${attacker.name}的${skillData.cityName}激活"侨乡潮韵"`
  if (summoned.length > 0) {
    message += `，召唤${summoned.join('、')}加入己方`
  }
  if (doubled.length > 0) {
    message += `，${doubled.join('、')}战斗力翻倍`
  }
  message += '！'

  addPublicLog(message)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 佛山市 - 房产大亨
 * 出战时对方所有HP低于该城市的城市对该城市的攻击减少40%（被动触发）
 */
export function handleFoshanSkill(attacker, skillData, addPublicLog, gameStore) {
  const foshanCity = findCity(attacker, '佛山市')
  if (!foshanCity) return

  const foshanHp = getCurrentHp(foshanCity)
  const cityName = foshanCity.name

  // 设置条件伤害减免
  if (!gameStore.conditionalReduction) gameStore.conditionalReduction = {}
  if (!gameStore.conditionalReduction[attacker.name]) gameStore.conditionalReduction[attacker.name] = {}

  gameStore.conditionalReduction[attacker.name][cityName] = {
    type: 'foshan',
    condition: 'attackerHpLower',  // 攻击者HP更低时触发
    threshold: foshanHp,
    multiplier: 0.6,  // 攻击减少40%，即保留60%
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"房产大亨"，HP低于${foshanHp}的城市对其攻击减少40%！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 韶关市 - 丹霞古韵
 * 限1次，本回合敌方派出的城市中HP最高的城市攻击视为无效
 */
export function handleShaoguanSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  // 设置攻击无效化状态
  if (!gameStore.attackNullification) gameStore.attackNullification = {}
  if (!gameStore.attackNullification[defender.name]) gameStore.attackNullification[defender.name] = {}

  gameStore.attackNullification[defender.name].danxia = {
    active: true,
    target: 'highestHp',  // 最高HP城市
    halfDamageIfSingle: true,  // 若只有1个城市则伤害减半
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"丹霞古韵"，${defender.name}本回合HP最高的出战城市攻击无效（或减半）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 湛江市 - 南国港湾
 * 限1次，让我方一个城市进入港湾三回合，3回合后该城市恢复至满血并HP×2
 */
export function handleZhanjiangSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getEligibleCitiesByHp(attacker, 8000)

  if (eligibleCities.length > 0) {
    const sorted = sortCitiesByHp(eligibleCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    addDelayedEffect(gameStore, attacker.name, cityName, {
      type: 'harbor',
      roundsLeft: 3,
      data: {
        fullHeal: true,
        hpMultiplier: 2,
        originalHp: targetCity.hp
      }
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"南国港湾"，${targetCity.name}进入港湾3回合，3回合后满血并HP×2！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 肇庆市 - 山水砚都
 * 限3次，给己方一个城市持续两回合的500HP的护盾，若该护盾两个回合内没有被击破，那么变为永久HP
 */
export function handleZhaoqingSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    const sorted = sortCitiesByHp(aliveCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    addShield(gameStore, attacker.name, cityName, {
      hp: 500,
      roundsLeft: 2,
      extra: { canConvertToPermanent: true }
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"山水砚都"，${targetCity.name}获得500HP护盾（持续2回合，若未被击破则转为永久HP）`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 江门市 - 侨风碉楼
 * 限1次:使一个城市获得10000HP护盾，随后江门HP减半，并对敌方中心造成50%HP的攻击
 */
export function handleJiangmenSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const jiangmenCity = findCity(attacker, '江门市')
  if (!jiangmenCity) return

  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    const sorted = sortCitiesByHp(aliveCities)
    const targetCity = sorted[0]
    const cityName = targetCity.name

    // 1. 为目标城市添加10000HP护盾
    addShield(gameStore, attacker.name, cityName, {
      hp: 10000,
      roundsLeft: -1  // 永久护盾
    })

    // 2. 江门市HP减半
    const jiangmenOldHp = getCurrentHp(jiangmenCity)
    const jiangmenNewHp = Math.floor(jiangmenOldHp * 0.5)
    jiangmenCity.currentHp = jiangmenNewHp

    // 3. 对敌方中心造成江门原HP的50%伤害
    const damage = Math.floor(jiangmenOldHp * 0.5)
    if (defender && defender.centerCityName) {
      const centerCity = defender.cities[defender.centerCityName]
      if (centerCity) {
        damageCity(centerCity, damage)
      }
    }

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"侨风碉楼"，${targetCity.name}获得10000HP护盾，江门市HP减半（${jiangmenOldHp} -> ${jiangmenNewHp}），对${defender.name}的中心造成${damage}伤害！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 茂名市 - 油城果乡（同镇江香醋）
 */
export function handleMaomingSkill(attacker, skillData, addPublicLog, gameStore) {
  handleZhenjiangSkill(attacker, skillData, addPublicLog, gameStore)
}

/**
 * 惠州市 - 大亚湾区
 * 该城市HP增加50%，受到一次攻击三回合后可回血受到攻击50%的HP（被动触发）
 */
export function handleHuizhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const huizhouCity = findCity(attacker, '惠州市')
  if (!huizhouCity) return

  // 1. HP增加50%
  const { oldMaxHp } = boostCityHp(huizhouCity, 1.5)

  // 2. 设置延迟回血标记
  const cityName = huizhouCity.name
  addDelayedEffect(gameStore, attacker.name, cityName, {
    type: 'daya_heal',
    roundsLeft: -1,  // 被动效果
    data: {
      healPercent: 0.5,
      healDelay: 3,
      damageTaken: 0,
      healScheduled: false,
      healTriggerRound: null
    }
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"大亚湾区"，HP增加50%（${oldMaxHp} -> ${huizhouCity.hp}），受攻击3回合后回血50%伤害！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 梅州市 - 客家祖地
 * 限一次：本次攻击回合时获得我方阵容目前所有客家城市的战斗力加成
 */
export function handleMeizhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const meizhouCity = findCity(attacker, '梅州市')
  if (!meizhouCity) return

  // 客家城市列表（广东：梅州、河源、惠州、汕尾、深圳部分、龙岩等）
  const hakkaCities = ['梅州市', '河源市', '惠州市', '汕尾市', '龙岩市', '赣州市', '三明市']

  let totalBonus = 0
  let hakkaCount = 0

  Object.values(attacker.cities).forEach(city => {
    if (city.isAlive !== false && hakkaCities.includes(city.name)) {
      totalBonus += getCurrentHp(city)
      hakkaCount++
    }
  })

  // 梅州市获得战力加成（临时增加HP）
  if (totalBonus > 0) {
    const cityName = meizhouCity.name

    // 设置临时战力加成
    if (!gameStore.temporaryHpBonus) gameStore.temporaryHpBonus = {}
    if (!gameStore.temporaryHpBonus[attacker.name]) gameStore.temporaryHpBonus[attacker.name] = {}

    gameStore.temporaryHpBonus[attacker.name][cityName] = {
      bonus: totalBonus,
      roundsLeft: 1,
      appliedRound: gameStore.currentRound
    }

    // 梅州市减少500HP
    damageCity(meizhouCity, 500)

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"客家祖地"，获得${hakkaCount}座客家城市的战斗力加成（+${totalBonus}），梅州减少500HP！`)
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 汕尾市 - 深汕合作
 * 若己方拥有深圳市，则汕尾市HP×2
 */
export function handleShanweiSkill(attacker, skillData, addPublicLog, gameStore) {
  const hasShenzhen = findCity(attacker, '深圳市')
  if (hasShenzhen) {
    const shanweiCity = findCity(attacker, '汕尾市')
    if (shanweiCity) {
      boostCityHp(shanweiCity, 2)
      addPublicLog(`${attacker.name}的${skillData.cityName}激活"深汕合作"，HP×2！`)
    }
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 河源市 - 万绿水城
 * 限1次，消耗自身100HP对对方中心造成1000伤害
 */
export function handleHeyuanSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const heyuanCity = findCity(attacker, '河源市')
  if (heyuanCity && defender.centerCityName) {
    // 扣除河源市100HP
    damageCity(heyuanCity, 100)

    // 对对方中心造成1000伤害
    const centerCity = defender.cities[defender.centerCityName]
    if (centerCity) {
      damageCity(centerCity, 1000)
      addPublicLog(`${attacker.name}的${skillData.cityName}激活"万绿水城"，消耗100HP对${defender.name}的首都造成1000伤害！`)
    }
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 阳江市 - 刀剪之都
 * 限1次，选定己方一个城市永久不会被其省会归顺
 */
export function handleYangjiangSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    // 选择HP最高的非省会城市
    const sorted = sortCitiesByHp(aliveCities).reverse()
    const targetCity = sorted.find(city => !city.name.includes('省会') && !city.name.includes('首府'))

    if (targetCity) {
      const cityName = targetCity.name

      // 设置归顺免疫标记
      if (!gameStore.allegianceImmunity) gameStore.allegianceImmunity = {}
      if (!gameStore.allegianceImmunity[attacker.name]) gameStore.allegianceImmunity[attacker.name] = {}

      gameStore.allegianceImmunity[attacker.name][cityName] = {
        permanent: true,
        appliedRound: gameStore.currentRound
      }

      addPublicLog(`${attacker.name}的${skillData.cityName}激活"刀剪之都"，${targetCity.name}永久不会被省会归顺！`)
    }
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 清远市 - 北江凤韵
 * 限1次，阵亡后满血复活回到己方阵营继续出战（被动触发）
 */
export function handleQingyuanSkill(attacker, skillData, addPublicLog, gameStore) {
  const qingyuanCity = findCity(attacker, '清远市')
  if (!qingyuanCity) return

  const cityName = qingyuanCity.name

  // 设置复活标记
  if (!gameStore.reviveOnDeath) gameStore.reviveOnDeath = {}
  if (!gameStore.reviveOnDeath[attacker.name]) gameStore.reviveOnDeath[attacker.name] = {}

  gameStore.reviveOnDeath[attacker.name][cityName] = {
    active: true,
    fullHeal: true,
    usedOnce: false,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"北江凤韵"，清远市获得复活能力（阵亡后满血复活）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 东莞市 - 世界工厂
 * 限1次，随机召唤一个HP大于4000小于10000的城市加入己方阵营
 */
export function handleDongguanSkill(attacker, skillData, addPublicLog, gameStore) {
  if (!gameStore.availableCities) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"世界工厂"，城市池不可用！`)
    return
  }

  // 筛选HP在4000-10000之间的城市
  const eligibleCities = gameStore.availableCities.filter(city =>
    city.hp > 4000 && city.hp < 10000 && !city.isUsed
  )

  if (eligibleCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"世界工厂"，没有符合条件的城市！`)
    return
  }

  // 随机选择一座城市
  const cityData = eligibleCities[Math.floor(Math.random() * eligibleCities.length)]

  const newCity = {
    name: cityData.name,
    hp: cityData.hp,
    currentHp: cityData.hp,
    isAlive: true,
    province: cityData.province,
    red: 0,
    green: 0,
    blue: 0,
    yellow: 0
  }

  attacker.cities[cityData.name] = newCity
  cityData.isUsed = true

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"世界工厂"，召唤${newCity.name}（HP${cityData.hp}）加入己方！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 中山市 - 伟人故里
 * 限1次，阵亡时随机将对方一个HP低于2000的非中心城市一同摧毁
 */
export function handleZhongshanSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const zhongshanCity = findCity(attacker, '中山市')
  if (!zhongshanCity) return

  const cityName = zhongshanCity.name

  // 设置阵亡触发效果
  if (!gameStore.onDeathEffects) gameStore.onDeathEffects = {}
  if (!gameStore.onDeathEffects[attacker.name]) gameStore.onDeathEffects[attacker.name] = {}

  gameStore.onDeathEffects[attacker.name][cityName] = {
    type: 'zhongshan',
    targetOpponent: defender.name,
    condition: 'hpBelow2000',
    excludeCenter: true,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"伟人故里"，中山市阵亡时将摧毁对方一座HP<2000的城市！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 潮州市 - 瓷都古韵
 * 限3次，己方全体城市获得持续3回合的300HP护盾
 */
export function handleChaozhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  // 为所有存活城市添加护盾
  aliveCities.forEach(city => {
    const cityName = city.name
    addShield(gameStore, attacker.name, cityName, {
      hp: 300,
      roundsLeft: 3
    })
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"瓷都古韵"，全体${aliveCities.length}座城市获得300HP护盾（持续3回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 揭阳市 - 玉都商埠
 * 限2次，让一座己方初始HP低于5000的城市恢复至初始HP
 */
export function handleJieyangSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getEligibleCitiesByHp(attacker, 4999)

  if (eligibleCities.length > 0) {
    const targetCity = eligibleCities[0]
    targetCity.currentHp = targetCity.hp
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"玉都商埠"，${targetCity.name}恢复至初始HP！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 云浮市 - 石都禅意
 * 限2次，为己方一个城市提高3000攻击力(该效果持续三回合)
 */
export function handleYunfuSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    // 选择HP最高的城市
    const sorted = sortCitiesByHp(aliveCities).reverse()
    const targetCity = sorted[0]
    const cityName = targetCity.name

    // 设置临时攻击力加成
    if (!gameStore.temporaryAttackBoost) gameStore.temporaryAttackBoost = {}
    if (!gameStore.temporaryAttackBoost[attacker.name]) gameStore.temporaryAttackBoost[attacker.name] = {}

    gameStore.temporaryAttackBoost[attacker.name][cityName] = {
      bonus: 3000,
      roundsLeft: 3,
      appliedRound: gameStore.currentRound
    }

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"石都禅意"，${targetCity.name}攻击力+3000（持续3回合）！`)
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
