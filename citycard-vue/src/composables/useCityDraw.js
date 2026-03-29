import {
  drawRandomCities,
  getUsedCityNames,
  drawCitiesForPlayer,
  confirmDrawnCities,
  drawCitiesForRoom,
  initPlayerDrawState,
  canRedrawCities,
  resetPlayerDrawState
} from '../utils/cityDrawing'

/**
 * 城市抽取逻辑
 * 使用正确的抽取机制：10000HP保底、最多5次重抽、城市不重复
 */
export function useCityDraw() {
  /**
   * 为玩家随机抽取城市（带10000HP保底机制）
   * @param {number} count - 要抽取的城市数量
   * @param {Array} excludeCities - 已被其他玩家抽取的城市名称数组
   * @returns {Array} 抽取的城市数组
   */
  function drawCities(count, excludeCities = []) {
    // 使用工具函数，确保至少有一个HP >= 10000的城市
    return drawRandomCities(count, excludeCities)
  }

  /**
   * 为所有玩家自动分配城市
   * @param {Array} players - 玩家数组
   * @param {string} mode - 游戏模式
   */
  function assignCitiesToPlayers(players, mode) {
    const citiesPerPlayer = mode === '2v2' ? 7 : 10
    const usedCityNames = new Set()

    players.forEach(player => {
      // 如果玩家已经有城市，跳过
      if (player.cities && Object.keys(player.cities).length > 0) {
        Object.values(player.cities).forEach(city => usedCityNames.add(city.name))
        return
      }

      // 为玩家抽取城市（使用带保底机制的版本）
      const cities = drawRandomCities(citiesPerPlayer, Array.from(usedCityNames))

      // 更新已使用的城市名称
      cities.forEach(city => usedCityNames.add(city.name))

      // 转换为对象结构并分配给玩家
      const citiesObj = {}
      cities.forEach(city => {
        citiesObj[city.name] = city
      })
      player.cities = citiesObj

      // 设置中心城市为第一个城市
      player.centerCityName = cities[0].name

      player.gold = 2 // 初始金币
    })

    return players
  }

  /**
   * 为玩家抽取城市（带重抽限制，最多5次）
   * @param {Object} player - 玩家对象
   * @param {number} count - 抽取数量
   * @param {Array} allPlayers - 所有玩家列表
   * @param {number} playerIndex - 当前玩家索引
   * @returns {Object} { success, cities, message, drawCount, canRedraw }
   */
  function drawCitiesWithLimit(player, count, allPlayers, playerIndex) {
    return drawCitiesForPlayer(player, count, allPlayers, playerIndex)
  }

  /**
   * 为房间中的玩家抽取城市
   * @param {Object} player - 当前玩家对象
   * @param {number} count - 抽取数量
   * @param {Object} roomData - 房间数据
   * @returns {Object} { success, cities, message, drawCount, canRedraw }
   */
  function drawCitiesInRoom(player, count, roomData) {
    return drawCitiesForRoom(player, count, roomData)
  }

  /**
   * 确认玩家抽取的城市
   * @param {Object} player - 玩家对象
   * @returns {Object} { success, message, cities }
   */
  function confirmCities(player) {
    return confirmDrawnCities(player)
  }

  /**
   * 初始化玩家抽卡状态
   * @param {Object} player - 玩家对象
   */
  function initDrawState(player) {
    initPlayerDrawState(player)
  }

  /**
   * 检查玩家是否可以重新抽取
   * @param {Object} player - 玩家对象
   * @returns {boolean}
   */
  function canRedraw(player) {
    return canRedrawCities(player)
  }

  /**
   * 重置玩家抽卡状态
   * @param {Object} player - 玩家对象
   */
  function resetDrawState(player) {
    resetPlayerDrawState(player)
  }

  /**
   * 获取已使用的城市名称
   * @param {Array} players - 玩家列表
   * @param {number} excludePlayerIndex - 排除的玩家索引
   * @returns {string[]}
   */
  function getUsedNames(players, excludePlayerIndex = -1) {
    return getUsedCityNames(players, excludePlayerIndex)
  }

  return {
    drawCities,
    assignCitiesToPlayers,
    drawCitiesWithLimit,
    drawCitiesInRoom,
    confirmCities,
    initDrawState,
    canRedraw,
    resetDrawState,
    getUsedNames
  }
}
