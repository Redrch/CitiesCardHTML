/**
 * 城市抽取工具模块
 * 实现10000HP保底机制、最多5次重抽机制、城市不重复机制
 */

import { ALL_CITIES, PROVINCE_MAP } from '../data/cities'

/**
 * 深度克隆对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) {
    const cloneA = []
    for (let i = 0; i < obj.length; i++) {
      cloneA[i] = deepClone(obj[i])
    }
    return cloneA
  }
  const cloneO = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloneO[key] = deepClone(obj[key])
    }
  }
  return cloneO
}

/**
 * 抽取随机城市（保证至少有一个HP在10000以上的城市）
 * @param {number} count - 需要抽取的城市数量
 * @param {string[]} excludeNames - 排除的城市名称列表（已被其他玩家使用）
 * @returns {Array} 抽取的城市数组（深度克隆）
 */
export function drawRandomCities(count, excludeNames = []) {
  // 检查ALL_CITIES是否存在
  if (!ALL_CITIES || ALL_CITIES.length === 0) {
    console.error('[城市抽取] ALL_CITIES未定义或为空，无法抽取城市')
    return []
  }

  const available = ALL_CITIES.filter(c => !excludeNames.includes(c.name))
  if (available.length < count) {
    console.warn(`可用城市不足：需要${count}个，剩余${available.length}个`)
    count = available.length
  }

  // 分类：HP >= 10000 和 HP < 10000
  const highHP = available.filter(c => c.hp >= 10000)
  const lowHP = available.filter(c => c.hp < 10000)

  const result = []

  // 如果有高HP城市且需要抽取至少1个城市，先随机抽取1个高HP城市（保底机制）
  if (highHP.length > 0 && count > 0) {
    const shuffledHigh = [...highHP].sort(() => Math.random() - 0.5)
    const city = deepClone(shuffledHigh[0])
    // 初始化运行时属性
    city.currentHp = city.hp
    city.isAlive = true
    result.push(city)
    count--
  }

  // 剩余的从所有可用城市中随机抽取（排除已选中的）
  if (count > 0) {
    const remaining = available.filter(c => !result.some(r => r.name === c.name))
    const shuffledRemaining = [...remaining].sort(() => Math.random() - 0.5)
    const cities = shuffledRemaining.slice(0, count).map(c => {
      const city = deepClone(c)
      // 初始化运行时属性
      city.currentHp = city.hp
      city.isAlive = true
      return city
    })
    result.push(...cities)
  }

  console.log(`[城市抽取] 成功抽取${result.length}个城市，所有城市已初始化 isAlive=true, currentHp=hp`)
  return result
}

/**
 * 获取所有玩家已使用的城市名称
 * @param {Array} players - 玩家列表
 * @param {number} excludePlayerIndex - 排除的玩家索引（可选）
 * @returns {string[]} 已使用的城市名称数组
 */
export function getUsedCityNames(players, excludePlayerIndex = -1) {
  const used = []
  players.forEach((player, idx) => {
    if (excludePlayerIndex !== -1 && idx === excludePlayerIndex) {
      return // 跳过指定玩家
    }
    if (player.cities) {
      // 处理cities可能是对象或数组的情况
      const citiesArray = Array.isArray(player.cities)
        ? player.cities
        : Object.values(player.cities)
      citiesArray.forEach(city => {
        used.push(city.name)
      })
    }
    // 也考虑已抽取但未确认的城市
    if (player.drawnCities) {
      player.drawnCities.forEach(city => {
        used.push(city.name)
      })
    }
  })
  return used
}

/**
 * 应用血量上限
 * 原始血量≤30000的城市上限80000，>30000的城市上限100000
 * @param {Object} city - 城市对象
 * @returns {number} 应用上限后的HP值
 */
export function applyHpCap(city) {
  const cap = (city.baseHp && city.baseHp > 30000) ? 100000 : 80000
  if (city.hp > cap) {
    city.hp = cap
  }
  return city.hp
}

/**
 * 检查城市是否是省会（除直辖市和特区外，每个省份数组的第一个城市）
 * @param {string} cityName - 城市名称
 * @returns {boolean}
 */
export function isCapitalCity(cityName) {
  const province = PROVINCE_MAP[cityName]
  if (!province) return false
  if (province.name === '直辖市和特区') return false
  return province.cities[0].name === cityName
}

/**
 * 获取城市所属省份名称
 * @param {string} cityName - 城市名称
 * @returns {string|null}
 */
export function getProvinceName(cityName) {
  const province = PROVINCE_MAP[cityName]
  return province ? province.name : null
}

/**
 * 获取省会/首府的正确称呼（自治区用"首府"，其他省份用"省会"）
 * @param {string} provinceName - 省份名称
 * @returns {string}
 */
export function getCapitalTerm(provinceName) {
  if (!provinceName) return '省会'
  return provinceName.endsWith('自治区') ? '首府' : '省会'
}

/**
 * 检查城市是否为计划单列市
 * @param {string} cityName - 城市名称
 * @returns {boolean}
 */
export function isPlanCity(cityName) {
  const planCities = ['大连市', '青岛市', '深圳市', '厦门市', '宁波市']
  return planCities.includes(cityName)
}

/**
 * 检查城市是否为直辖市
 * @param {string} cityName - 城市名称
 * @returns {boolean}
 */
export function isMunicipality(cityName) {
  const municipalities = ['北京市', '上海市', '天津市', '重庆市']
  return municipalities.includes(cityName)
}

/**
 * 检查城市是否为特别行政区
 * @param {string} cityName - 城市名称
 * @returns {boolean}
 */
export function isSpecialAdministrativeRegion(cityName) {
  const specialRegions = ['香港特别行政区', '澳门特别行政区']
  return specialRegions.includes(cityName)
}

/**
 * 为玩家初始化城市抽取状态
 * @param {Object} player - 玩家对象
 */
export function initPlayerDrawState(player) {
  if (!player.drawnCities) {
    player.drawnCities = []
  }
  if (player.drawCount === undefined) {
    player.drawCount = 0
  }
}

/**
 * 检查玩家是否可以重新抽取城市
 * @param {Object} player - 玩家对象
 * @returns {boolean}
 */
export function canRedrawCities(player) {
  return (player.drawCount || 0) < 5
}

/**
 * 为玩家抽取城市（带重抽限制）
 * @param {Object} player - 玩家对象
 * @param {number} count - 抽取数量
 * @param {Array} allPlayers - 所有玩家列表
 * @param {number} playerIndex - 当前玩家索引
 * @returns {Object} { success: boolean, cities: Array, message: string }
 */
export function drawCitiesForPlayer(player, count, allPlayers, playerIndex) {
  initPlayerDrawState(player)

  // 检查重抽次数限制
  if (!canRedrawCities(player)) {
    return {
      success: false,
      cities: [],
      message: '已达到最大抽卡次数（5次）！'
    }
  }

  // 获取其他玩家已使用的城市
  const excludeNames = getUsedCityNames(allPlayers, playerIndex)

  // 抽取城市
  const drawnCities = drawRandomCities(count, excludeNames)

  if (drawnCities.length < count) {
    return {
      success: false,
      cities: drawnCities,
      message: `可用城市不足，只抽取到${drawnCities.length}个城市`
    }
  }

  // 为每个城市添加必要字段
  drawnCities.forEach(city => {
    // 保存原始HP作为baseHp（如果还没有）
    if (!city.baseHp) {
      city.baseHp = city.hp
    }

    // 应用HP上限
    applyHpCap(city)

    // 初始化当前HP
    if (!city.currentHp) {
      city.currentHp = city.hp
    }

    // 初始化存活状态
    if (city.isAlive === undefined) {
      city.isAlive = true
    }
  })

  // 更新玩家状态
  player.drawnCities = drawnCities
  player.drawCount++

  return {
    success: true,
    cities: drawnCities,
    message: `成功抽取${drawnCities.length}个城市（第${player.drawCount}次抽取）`,
    drawCount: player.drawCount,
    canRedraw: player.drawCount < 5
  }
}

/**
 * 确认玩家抽取的城市
 * @param {Object} player - 玩家对象
 * @returns {Object} { success: boolean, message: string }
 */
export function confirmDrawnCities(player) {
  if (!player.drawnCities || player.drawnCities.length === 0) {
    return {
      success: false,
      message: '请先抽取城市！'
    }
  }

  // 将抽取的城市确认为正式城市
  player.cities = [...player.drawnCities]

  // 清空抽取状态（但保留drawCount以便记录）
  player.drawnCities = []

  return {
    success: true,
    message: `成功确认${Object.keys(player.cities).length}个城市`,
    cities: player.cities
  }
}

/**
 * 为多人游戏房间抽取城市（考虑其他在线玩家）
 * @param {Object} player - 当前玩家对象
 * @param {number} count - 抽取数量
 * @param {Object} roomData - 房间数据
 * @returns {Object} { success: boolean, cities: Array, message: string }
 */
export function drawCitiesForRoom(player, count, roomData) {
  initPlayerDrawState(player)

  // 检查重抽次数限制
  if (!canRedrawCities(player)) {
    return {
      success: false,
      cities: [],
      message: '已达到最大抽卡次数（5次）！'
    }
  }

  // 收集所有其他玩家已使用的城市名称
  const usedCityNames = new Set()

  roomData.players.forEach(p => {
    if (p.name !== player.name) {
      // 添加已确认的城市
      if (p.cities) {
        // 处理cities可能是对象或数组的情况
        const citiesArray = Array.isArray(p.cities)
          ? p.cities
          : Object.values(p.cities)
        if (citiesArray.length > 0) {
          citiesArray.forEach(city => {
            usedCityNames.add(city.name)
          })
        }
      }
      // 也添加已抽取但未确认的城市（防止重复）
      if (p.drawnCities && p.drawnCities.length > 0) {
        p.drawnCities.forEach(city => {
          usedCityNames.add(city.name)
        })
      }
    }
  })

  const excludeNames = Array.from(usedCityNames)

  // 使用基础抽取函数
  const drawnCities = drawRandomCities(count, excludeNames)

  if (drawnCities.length < count) {
    return {
      success: false,
      cities: drawnCities,
      message: `可用城市不足，只抽取到${drawnCities.length}个城市`
    }
  }

  // 为每个城市添加必要字段
  drawnCities.forEach(city => {
    if (!city.baseHp) {
      city.baseHp = city.hp
    }
    applyHpCap(city)
    if (!city.currentHp) {
      city.currentHp = city.hp
    }
    if (city.isAlive === undefined) {
      city.isAlive = true
    }
  })

  // 更新玩家状态
  player.drawnCities = drawnCities
  player.drawCount++

  return {
    success: true,
    cities: drawnCities,
    message: `成功抽取${drawnCities.length}个城市（第${player.drawCount}次抽取）`,
    drawCount: player.drawCount,
    canRedraw: player.drawCount < 5
  }
}

/**
 * 重置玩家的抽卡状态（用于重新开始游戏）
 * @param {Object} player - 玩家对象
 */
export function resetPlayerDrawState(player) {
  player.drawnCities = []
  player.drawCount = 0
  player.cities = []
}
