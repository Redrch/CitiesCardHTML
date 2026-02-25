/**
 * 城市技能通用辅助函数
 */

import { ALL_CITIES, PROVINCE_MAP } from '../../data/cities'

/**
 * 召唤城市（添加新城市到玩家阵营）
 * @param {Object} player - 玩家对象
 * @param {string} cityName - 城市名称
 * @param {Object} gameStore - 游戏状态
 * @param {Function} addPublicLog - 日志函数
 */
export function summonCity(player, cityName, gameStore, addPublicLog) {
  // 从城市数据库中查找城市
  const cityData = ALL_CITIES.find(c => c.name === cityName)

  if (!cityData) {
    addPublicLog(`无法召唤${cityName}：城市数据不存在！`)
    return false
  }

  // 检查是否已经拥有该城市
  if (player.cities[cityName]) {
    addPublicLog(`召唤失败：${player.name}已经拥有${cityName}！`)
    return false
  }

  // 获取城市所属省份
  const province = PROVINCE_MAP[cityName]

  // 创建新城市对象
  const newCity = {
    name: cityName,
    hp: cityData.hp,
    currentHp: cityData.hp,
    isAlive: true,
    province: province ? province.name : '未知省份'
  }

  // 添加到玩家城市对象（使用城市名称作为键）
  player.cities[cityName] = newCity

  addPublicLog(`${player.name}召唤了${cityName}！`)
  return true
}

/**
 * 获取存活的城市列表
 */
export function getAliveCities(player) {
  return Object.values(player.cities).filter(c => {
    const hp = c.currentHp !== undefined ? c.currentHp : c.hp
    return c.isAlive !== false && hp > 0
  })
}

/**
 * 获取符合HP条件的城市列表
 */
export function getEligibleCitiesByHp(player, maxHp = Infinity, minHp = 0) {
  return Object.values(player.cities).filter(c => {
    const hp = c.currentHp !== undefined ? c.currentHp : c.hp
    return c.isAlive !== false && hp > 0 && c.hp >= minHp && c.hp <= maxHp
  })
}

/**
 * 按当前HP排序城市（从低到高）
 */
export function sortCitiesByHp(cities) {
  return [...cities].sort((a, b) => {
    const hpA = a.currentHp !== undefined ? a.currentHp : a.hp
    const hpB = b.currentHp !== undefined ? b.currentHp : b.hp
    return hpA - hpB
  })
}

/**
 * 获取城市当前HP
 */
export function getCurrentHp(city) {
  return city.currentHp !== undefined ? city.currentHp : city.hp
}

/**
 * 初始化护盾系统
 */
export function initShieldSystem(gameStore) {
  if (!gameStore.shields) gameStore.shields = {}
  return gameStore.shields
}

/**
 * 为城市添加护盾
 */
export function addShield(gameStore, playerName, cityName, shieldConfig) {
  const shields = initShieldSystem(gameStore)
  if (!shields[playerName]) shields[playerName] = {}

  shields[playerName][cityName] = {
    hp: shieldConfig.hp,
    maxHp: shieldConfig.hp,
    roundsLeft: shieldConfig.roundsLeft || -1,
    appliedRound: gameStore.currentRound,
    ...shieldConfig.extra
  }
}

/**
 * 为城市添加护盾（简化版本，用于城市专属技能）
 * @param {Object} city - 城市对象
 * @param {number} shieldHp - 护盾HP
 * @param {number} rounds - 持续回合数
 */
export function addCityShield(city, shieldHp, rounds = 1) {
  if (!city.shield) {
    city.shield = {
      hp: shieldHp,
      maxHp: shieldHp,
      roundsLeft: rounds
    }
  } else {
    // 如果已有护盾，叠加HP
    city.shield.hp += shieldHp
    city.shield.maxHp += shieldHp
    city.shield.roundsLeft = Math.max(city.shield.roundsLeft, rounds)
  }
}

/**
 * 初始化禁止出战系统
 */
export function initBannedCitiesSystem(gameStore) {
  if (!gameStore.bannedCities) gameStore.bannedCities = {}
  return gameStore.bannedCities
}

/**
 * 禁止城市出战
 */
export function banCity(gameStore, playerName, cityName, rounds, options = {}) {
  const bannedCities = initBannedCitiesSystem(gameStore)
  if (!bannedCities[playerName]) bannedCities[playerName] = {}

  bannedCities[playerName][cityName] = {
    roundsLeft: rounds,
    fullHealOnReturn: options.fullHealOnReturn || false,
    originalHp: options.originalHp || 0
  }
}

/**
 * 初始化延迟效果系统
 */
export function initDelayedEffectsSystem(gameStore) {
  if (!gameStore.delayedEffects) gameStore.delayedEffects = {}
  return gameStore.delayedEffects
}

/**
 * 添加延迟效果
 */
export function addDelayedEffect(gameStore, playerName, cityName, effectConfig) {
  const effects = initDelayedEffectsSystem(gameStore)
  if (!effects[playerName]) effects[playerName] = {}

  effects[playerName][cityName] = {
    type: effectConfig.type,
    effectRoundsLeft: effectConfig.roundsLeft,
    effectData: {
      appliedRound: gameStore.currentRound,
      ...effectConfig.data
    }
  }
}

/**
 * 治疗城市（不超过最大HP）
 */
export function healCity(city, healAmount) {
  const oldHp = getCurrentHp(city)
  const newHp = Math.min(city.hp, oldHp + healAmount)
  city.currentHp = newHp
  return { oldHp, newHp, actualHeal: newHp - oldHp }
}

/**
 * 对城市造成伤害
 */
export function damageCity(city, damage) {
  const oldHp = getCurrentHp(city)
  const newHp = Math.max(0, oldHp - damage)
  city.currentHp = newHp

  if (newHp <= 0) {
    city.isAlive = false
  }

  return { oldHp, newHp, actualDamage: oldHp - newHp }
}

/**
 * 增加城市最大HP和当前HP（按倍数）
 */
export function boostCityHp(city, multiplier) {
  const oldMaxHp = city.hp
  const oldCurrentHp = getCurrentHp(city)

  city.hp = Math.floor(oldMaxHp * multiplier)
  city.currentHp = Math.floor(oldCurrentHp * multiplier)

  return { oldMaxHp, newMaxHp: city.hp, oldCurrentHp, newCurrentHp: city.currentHp }
}

/**
 * 增加城市HP（包括最大HP和当前HP，按固定值增加，无上限限制）
 * 与healCity的区别：
 * - healCity: 只恢复当前HP，不超过初始最大HP (city.hp)
 * - increaseMaxHp: 同时增加最大HP和当前HP，无上限限制
 * @param {Object} city - 城市对象
 * @param {number} increaseAmount - 增加量
 * @returns {Object} { oldMaxHp, newMaxHp, oldCurrentHp, newCurrentHp }
 */
export function increaseMaxHp(city, increaseAmount) {
  const oldMaxHp = city.hp
  const oldCurrentHp = getCurrentHp(city)

  // 增加最大HP和当前HP，无上限限制
  city.hp = oldMaxHp + increaseAmount
  city.currentHp = oldCurrentHp + increaseAmount

  return { oldMaxHp, newMaxHp: city.hp, oldCurrentHp, newCurrentHp: city.currentHp }
}

/**
 * 查找特定城市
 * @param {Object} player - 玩家对象
 * @param {string} cityName - 城市名称
 * @returns {Object|null} 城市对象或null
 */
export function findCity(player, cityName) {
  return player.cities[cityName] || null
}

/**
 * 获取城市名称
 * @param {Object} player - 玩家对象
 * @param {Object|string} cityOrName - 城市对象或城市名称
 * @returns {string|null} 城市名称，如果未找到则返回null
 */
export function getCityName(player, cityOrName) {
  if (typeof cityOrName === 'string') {
    // 如果传入的是城市名称字符串，直接返回
    return player.cities[cityOrName] ? cityOrName : null
  } else if (cityOrName && cityOrName.name) {
    // 如果传入的是城市对象，返回其名称
    return cityOrName.name
  }
  return null
}


/**
 * 从数组中随机获取一个元素
 * @param {Array} array - 数组
 * @returns {*} 随机元素
 */
export function getRandomElement(array) {
  if (!array || array.length === 0) return null
  return array[Math.floor(Math.random() * array.length)]
}
