/**
 * 湖北省城市专属技能
 * 包括：武汉、黄石、十堰、荆州、宜昌、襄阳、鄂州、荆门、黄冈、孝感、咸宁、仙桃、潜江、神农架、天门、恩施、随州
 */

import {
  getAliveCities,
  getEligibleCitiesByHp,
  sortCitiesByHp,
  getCurrentHp,
  addShield,
  banCity,
  getCityIndex
} from './skillHelpers'
import { handleZhenjiangSkill } from './jiangsu'

/**
 * 武汉市 - 九省通衢
 * 限2次，随机获得2座HP8000以下的城市加入己方
 */
export function handleWuhanSkill(attacker, skillData, addPublicLog, gameStore) {
  // 从城市池中筛选HP≤8000的城市
  if (!gameStore.availableCities) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"九省通衢"，城市池不可用！`)
    return
  }

  const eligibleCities = gameStore.availableCities.filter(city =>
    city.hp <= 8000 && !city.isUsed
  )

  if (eligibleCities.length < 2) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"九省通衢"，可用城市不足2座！`)
    return
  }

  // 随机选择2座城市
  const shuffled = [...eligibleCities].sort(() => Math.random() - 0.5)
  const selectedCities = shuffled.slice(0, 2)

  selectedCities.forEach(cityData => {
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

    attacker.cities.push(newCity)
    cityData.isUsed = true

    // 城市数≤5时自动加入roster
    if (attacker.cities.length <= 5) {
      if (!gameStore.roster) gameStore.roster = {}
      if (!gameStore.roster[attacker.name]) gameStore.roster[attacker.name] = []
      gameStore.roster[attacker.name].push(attacker.cities.length - 1)
    }
  })

  const cityNames = selectedCities.map(c => c.name).join('、')
  addPublicLog(`${attacker.name}的${skillData.cityName}激活"九省通衢"，获得${cityNames}加入己方！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 十堰市 - 武当山
 * 限1次，己方首都免除3回合的攻击（被动触发）
 */
export function handleShiyanSkill(attacker, skillData, addPublicLog, gameStore) {
  // 设置首都保护
  if (!gameStore.centerProtection) gameStore.centerProtection = {}

  gameStore.centerProtection[attacker.name] = {
    active: true,
    roundsLeft: 3,
    appliedRound: gameStore.currentRound
  }

  const centerCity = attacker.cities[attacker.centerIndex]
  addPublicLog(`${attacker.name}的${skillData.cityName}激活"武当山"，首都${centerCity?.name || '中心城市'}免除3回合的攻击！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 荆州市 - 三国战场
 * 限2次，出战时对方城市攻击力减少50%，己方城市攻击力增加50%（被动触发）
 */
export function handleJingzhouSkill(attacker, defender, defenderCities, skillData, addPublicLog, gameStore) {
  // 设置战斗修改器
  if (!gameStore.combatModifiers) gameStore.combatModifiers = {}
  if (!gameStore.combatModifiers[attacker.name]) gameStore.combatModifiers[attacker.name] = {}
  if (!gameStore.combatModifiers[defender.name]) gameStore.combatModifiers[defender.name] = {}

  // 己方攻击力+50%
  gameStore.combatModifiers[attacker.name].attackBoost = {
    active: true,
    multiplier: 1.5,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  // 对方攻击力-50%
  gameStore.combatModifiers[defender.name].attackDebuff = {
    active: true,
    multiplier: 0.5,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"三国战场"，对方攻击力-50%，己方攻击力+50%！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 宜昌市 - 三峡大坝
 * 限1次，建立一座持续5回合的10000HP护盾
 */
export function handleYichangSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    const sorted = sortCitiesByHp(aliveCities)
    const targetCity = sorted[0]
    const cityIndex = getCityIndex(attacker, targetCity)

    addShield(gameStore, attacker.name, cityIndex, {
      hp: 10000,
      roundsLeft: 5
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"三峡大坝"，${targetCity.name}建立10000HP护盾（持续5回合）！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 襄阳市 - 隆中景区
 * 限1次，对方必须提前选好后2轮出战的城市及使用技能
 */
export function handleXiangyangSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  // 设置情报强制公开状态
  if (!gameStore.forcedReveal) gameStore.forcedReveal = {}

  gameStore.forcedReveal[defender.name] = {
    active: true,
    roundsLeft: 2,
    targetPlayer: attacker.name,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"隆中景区"，${defender.name}必须提前公布后2轮部署！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 咸宁市 - 火烧赤壁
 * 限1次，选择对方2座城市，当一座城市受到伤害时，另一座城市受到相应的50%伤害
 */
export function handleXianningSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(defender)

  if (aliveCities.length < 2) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"火烧赤壁"，对方存活城市不足2座！`)
    return
  }

  // 选择HP最高的2座城市
  const sorted = sortCitiesByHp(aliveCities).reverse()
  const city1 = sorted[0]
  const city2 = sorted[1]
  const city1Index = getCityIndex(defender, city1)
  const city2Index = getCityIndex(defender, city2)

  // 设置伤害共享状态
  if (!gameStore.damageShare) gameStore.damageShare = {}
  if (!gameStore.damageShare[defender.name]) gameStore.damageShare[defender.name] = {}

  gameStore.damageShare[defender.name][city1Index] = {
    linkedCityIndex: city2Index,
    shareRatio: 0.5,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  gameStore.damageShare[defender.name][city2Index] = {
    linkedCityIndex: city1Index,
    shareRatio: 0.5,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"火烧赤壁"，${defender.name}的${city1.name}和${city2.name}共享伤害（持续2回合）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 潜江市 - 潜江小龙虾（同镇江香醋）
 */
export function handleQianjiangSkill(attacker, skillData, addPublicLog, gameStore) {
  handleZhenjiangSkill(attacker, skillData, addPublicLog, gameStore)
}

/**
 * 神农架林区 - 野人出没
 * 限1次，出战时设置一个HP为1000的野人投影
 */
export function handleShennongjiaxSkill(attacker, skillData, addPublicLog, gameStore) {
  // 创建野人投影
  if (!gameStore.projections) gameStore.projections = {}
  if (!gameStore.projections[attacker.name]) gameStore.projections[attacker.name] = []

  const wildmanProjection = {
    name: '野人投影',
    hp: 1000,
    currentHp: 1000,
    attackBonus: 500,   // 增加攻击力
    defenseBonus: 300,  // 增加防御力
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  gameStore.projections[attacker.name].push(wildmanProjection)

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"野人出没"，设置1000HP野人投影（增加攻击力和防御力）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 天门市 - 天门山
 * 限1次，选定己方一座城市禁止出战2回合，2回合后恢复到初始HP（HP5000以下可使用）
 */
export function handleTianmenSkill(attacker, skillData, addPublicLog, gameStore) {
  const eligibleCities = getEligibleCitiesByHp(attacker, 5000)

  if (eligibleCities.length > 0) {
    const sorted = sortCitiesByHp(eligibleCities)
    const targetCity = sorted[0]
    const cityIndex = getCityIndex(attacker, targetCity)

    banCity(gameStore, attacker.name, cityIndex, 2, {
      fullHealOnReturn: true,
      originalHp: getCurrentHp(targetCity)
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"天门山"，${targetCity.name}禁止出战2回合，之后恢复至初始HP！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 恩施土家族苗族自治州 - 土家风情
 * 限1次，给己方一座城市2000HP的护盾
 */
export function handleEnshiSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    const sorted = sortCitiesByHp(aliveCities)
    const targetCity = sorted[0]
    const cityIndex = getCityIndex(attacker, targetCity)

    addShield(gameStore, attacker.name, cityIndex, {
      hp: 2000,
      roundsLeft: -1  // 永久护盾
    })

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"土家风情"，${targetCity.name}获得2000HP护盾！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 随州市 - 神农故里
 * 限1次，己方一座城市攻击力翻倍2回合
 */
export function handleSuizhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    // 选择HP最高的城市
    const sorted = sortCitiesByHp(aliveCities).reverse()
    const targetCity = sorted[0]
    const cityIndex = getCityIndex(attacker, targetCity)

    // 设置临时攻击力翻倍
    if (!gameStore.temporaryAttackBoost) gameStore.temporaryAttackBoost = {}
    if (!gameStore.temporaryAttackBoost[attacker.name]) gameStore.temporaryAttackBoost[attacker.name] = {}

    gameStore.temporaryAttackBoost[attacker.name][cityIndex] = {
      multiplier: 2,
      roundsLeft: 2,
      appliedRound: gameStore.currentRound
    }

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"神农故里"，${targetCity.name}攻击力翻倍（持续2回合）！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
