/**
 * 战斗日志系统 - 修正版
 *
 * 双日志系统说明：
 * 1. 私密日志（Private Log）：告诉玩家"你使用了XXX技能"，只有该玩家能看到
 * 2. 公开日志（Public Log）：告诉所有人技能效果和战斗结果，所有人都能看到
 *
 * 注意：现在没有颜色技能（红绿蓝黄），也没有"绿色减伤"等概念
 */

/**
 * 添加技能使用的双日志
 * @param {Object} gameStore - 游戏状态store
 * @param {string} playerName - 使用技能的玩家名称
 * @param {string} skillName - 技能名称
 * @param {string} publicMessage - 公开日志消息（可选，默认为"使用了技能"）
 * @param {string} privateMessage - 私密日志消息（可选，默认为"你使用了技能"）
 */
export function addSkillUsageLog(gameStore, playerName, skillName, publicMessage = null, privateMessage = null) {
  // 私密日志：告诉玩家使用了技能
  const defaultPrivateMsg = `${playerName}使用了${skillName}`
  gameStore.addPrivateLog(playerName, privateMessage || defaultPrivateMsg)

  // 公开日志：告诉所有人技能被使用了（但不一定说明是谁用的）
  if (publicMessage) {
    gameStore.addLog(publicMessage, 'battle')
  }
}

/**
 * 添加技能效果的公开日志
 * @param {Object} gameStore - 游戏状态store
 * @param {string} message - 日志消息
 */
export function addSkillEffectLog(gameStore, message) {
  gameStore.addLog(message, 'battle')
}

/**
 * 添加战斗结果日志（公开）
 * @param {Object} gameStore - 游戏状态store
 * @param {string} message - 日志消息
 */
export function addBattleLog(gameStore, message) {
  gameStore.addLog(message, 'battle')
}

/**
 * 添加城市选择的私密日志
 * @param {Object} gameStore - 游戏状态store
 * @param {string} playerName - 玩家名称
 * @param {Array<string>} cityNames - 选择的城市名称列表
 * @param {string} action - 动作描述（如"出战"、"治疗"等）
 */
export function addCitySelectionLog(gameStore, playerName, cityNames, action = '出战') {
  const message = `你选择了${cityNames.join('、')}${action}`
  gameStore.addPrivateLog(playerName, message)
}

/**
 * 添加金币变化的私密日志
 * @param {Object} gameStore - 游戏状态store
 * @param {string} playerName - 玩家名称
 * @param {number} before - 变化前金币数
 * @param {number} after - 变化后金币数
 * @param {string} reason - 变化原因
 */
export function addGoldChangeLog(gameStore, playerName, before, after, reason) {
  const change = after - before
  const sign = change > 0 ? '+' : ''
  const message = `${reason}：金币 ${before} → ${after}（${sign}${change}）`
  gameStore.addPrivateLog(playerName, message)
}

/**
 * 添加HP变化的私密日志
 * @param {Object} gameStore - 游戏状态store
 * @param {string} playerName - 玩家名称
 * @param {string} cityName - 城市名称
 * @param {number} before - 变化前HP
 * @param {number} after - 变化后HP
 * @param {string} reason - 变化原因
 */
export function addHPChangeLog(gameStore, playerName, cityName, before, after, reason) {
  const change = after - before
  const sign = change > 0 ? '+' : ''
  const message = `${reason}：${cityName} HP ${Math.floor(before)} → ${Math.floor(after)}（${sign}${Math.floor(change)}）`
  gameStore.addPrivateLog(playerName, message)
}

/**
 * 格式化技能消耗提示
 * @param {string} skillName - 技能名称
 * @param {number} cost - 金币消耗
 * @returns {string}
 */
export function formatSkillCost(skillName, cost) {
  return `${skillName}（${cost}金币）`
}

/**
 * 获取玩家的所有日志（公开+私密）
 * @param {Object} gameStore - 游戏状态store
 * @param {string} playerName - 玩家名称
 * @returns {Array} 合并后的日志数组
 */
export function getPlayerAllLogs(gameStore, playerName) {
  const publicLogs = gameStore.logs || []
  const privateLogs = gameStore.playerPrivateLogs[playerName] || []

  // 合并并按时间戳排序
  const allLogs = [...publicLogs, ...privateLogs].sort((a, b) =>
    (a.timestamp || 0) - (b.timestamp || 0)
  )

  return allLogs
}

/**
 * 清空玩家的私密日志
 * @param {Object} gameStore - 游戏状态store
 * @param {string} playerName - 玩家名称
 */
export function clearPlayerPrivateLogs(gameStore, playerName) {
  if (gameStore.playerPrivateLogs[playerName]) {
    gameStore.playerPrivateLogs[playerName] = []
  }
}
