/**
 * 技能系统共享辅助函数
 * Shared Helper Functions for Skill System
 *
 * 这些函数是纯函数，用于技能系统的通用逻辑
 */

import { SKILL_COSTS } from '../../constants/skillCosts'

/**
 * 检查是否被坚不可摧护盾阻挡
 * @param {Object} gameState - 游戏状态
 * @param {string} targetPlayer - 目标玩家名称
 * @param {string} casterPlayer - 施法者名称
 * @param {string} skillName - 技能名称
 * @returns {boolean} 是否被阻挡
 */
export function isBlockedByJianbukecui(gameState, targetPlayer, casterPlayer, skillName) {
  // 检查目标是否有坚不可摧护盾
  const shield = gameState.jianbukecui?.[targetPlayer]
  if (!shield || shield.roundsLeft <= 0) {
    return false
  }

  // 坚不可摧护盾阻挡的技能列表（来自PDF）
  const blockedSkills = new Set([
    '无知无畏', '进制扭曲', '整齐划一', '人质交换', '时来运转',
    '吸引攻击', '铜墙铁壁', '料事如神', '背水一战', '同归于尽',
    '暗度陈仓', '隔岸观火', '挑拨离间', '清除加成', '釜底抽薪',
    '劫富济贫', '天灾人祸', '一落千丈', '连续打击', '倒反天罡',
    '对己方城市的数位反转', '波涛汹涌', '万箭齐发', '连锁反应',
    '御驾亲征', '欲擒故纵', '晕头转向', '草船借箭', '招贤纳士',
    '狂轰滥炸', '横扫一空', '降维打击', '定时爆破', '反戈一击',
    '围魏救赵', '灰飞烟灭', '趁其不备随机', '趁其不备指定',
    '电磁感应', '自相残杀', '中庸之道', '强制转移普通', '强制转移高级',
    '大义灭亲', '强制搬运', '夷为平地', '设置屏障', '潜能激发',
    '毫不留情', '当机立断'
  ])

  return blockedSkills.has(skillName)
}

/**
 * 检查技能前置条件
 * @param {Object} params - 参数对象
 * @param {Object} params.caster - 施法者
 * @param {Object} params.target - 目标玩家
 * @param {string} params.skillName - 技能名称
 * @param {Object} params.gameState - 游戏状态
 * @param {number} params.goldCost - 金币消耗
 * @returns {Object} { success: boolean, message: string }
 */
export function checkSkillPreconditions({ caster, target, skillName, gameState, goldCost }) {
  // 1. 检查金币
  const actualCost = calculateActualCost(skillName, caster, gameState)
  if (caster.gold < actualCost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${actualCost}，当前${caster.gold}）`
    }
  }

  // 2. 检查坚不可摧护盾（如果有目标）
  if (target && isBlockedByJianbukecui(gameState, target.name, caster.name, skillName)) {
    return {
      success: false,
      message: `技能被${target.name}的坚不可摧护盾阻挡`
    }
  }

  // 3. 检查技能禁用状态（事半功倍）
  if (gameState.bannedSkills?.[caster.name]?.[skillName]) {
    const banInfo = gameState.bannedSkills[caster.name][skillName]
    const bannedBy = banInfo?.bannedBy || '对手'
    return {
      success: false,
      message: `技能"${skillName}"已被${bannedBy}的事半功倍禁用`
    }
  }

  // 4. 检查寸步难行限制
  if (gameState.stareDown?.[caster.name]?.roundsLeft > 0) {
    if (skillName !== '当机立断') {
      return {
        success: false,
        message: `被目不转睹限制，无法使用技能`
      }
    }
  }

  return { success: true }
}

/**
 * 获取城市的有效省份（考虑拔旗易帜）
 * @param {Object} gameState - 游戏状态
 * @param {string} playerName - 玩家名称
 * @param {string} cityName - 城市名称
 * @param {Object} cityObject - 城市对象
 * @returns {string|null} 省份名称
 */
export function getEffectiveProvince(gameState, playerName, cityName, cityObject) {
  // 优先检查拔旗易帜标记
  if (gameState.changeFlagMark?.[playerName]?.[cityName]) {
    return gameState.changeFlagMark[playerName][cityName].newProvince
  }

  // 使用gameStore的getProvinceOfCity方法
  if (gameState.getProvinceOfCity && cityObject) {
    const province = gameState.getProvinceOfCity(cityObject.name)
    return province?.name || null
  }

  // 如果城市对象有province属性
  if (cityObject?.province) {
    return cityObject.province
  }

  return null
}

/**
 * 检查城市是否有保护
 * @param {Object} gameState - 游戏状态
 * @param {string} playerName - 玩家名称
 * @param {string} cityName - 城市名称
 * @returns {Object} { hasProtection: boolean, type: string, layers: number }
 */
export function hasProtection(gameState, playerName, cityName) {
  // 检查普通保护罩
  const normalProtection = gameState.protections?.[playerName]?.[cityName] || 0

  // 检查钢铁城市
  const ironLayers = gameState.ironCities?.[playerName]?.[cityName] || 0

  if (ironLayers > 0) {
    return { hasProtection: true, type: 'iron', layers: ironLayers }
  }

  if (normalProtection > 0) {
    return { hasProtection: true, type: 'normal', layers: 1 }
  }

  return { hasProtection: false, type: 'none', layers: 0 }
}

/**
 * 消耗保护层
 * @param {Object} gameState - 游戏状态
 * @param {string} playerName - 玩家名称
 * @param {string} cityName - 城市名称
 * @returns {boolean} 是否成功消耗
 */
export function consumeProtection(gameState, playerName, cityName) {
  // 先检查钢铁城市
  if (gameState.ironCities?.[playerName]?.[cityName]) {
    const currentLayers = gameState.ironCities[playerName][cityName]
    if (currentLayers > 1) {
      // 钢铁城市：2层 -> 1层
      gameState.ironCities[playerName][cityName] = 1
    } else {
      // 1层 -> 变成普通保护罩
      delete gameState.ironCities[playerName][cityName]
      if (!gameState.protections[playerName]) {
        gameState.protections[playerName] = {}
      }
      gameState.protections[playerName][cityName] = 10
    }
    return true
  }

  // 再检查普通保护罩
  if (gameState.protections?.[playerName]?.[cityName]) {
    delete gameState.protections[playerName][cityName]
    return true
  }

  return false
}

/**
 * 计算实际技能金币消耗
 * @param {string} skillName - 技能名称
 * @param {Object} caster - 施法者
 * @param {Object} gameState - 游戏状态
 * @returns {number} 实际消耗
 */
export function calculateActualCost(skillName, caster, gameState) {
  let cost = SKILL_COSTS[skillName] || 0

  // 检查釜底抽薪效果（蓝卡及以上技能花费增加50%）
  if (gameState.costIncrease?.[caster.name]) {
    const blueCost = 5 // 蓝卡起始金币
    if (cost >= blueCost) {
      cost = Math.ceil(cost * 1.5)
    }
  }

  return cost
}

/**
 * 获取玩家存活的城市列表
 * @param {Object} player - 玩家对象
 * @returns {Array} 存活城市列表
 */
export function getAliveCities(player) {
  if (!player.cities) return []
  // player.cities 现在是对象，需要转换为数组
  return Object.values(player.cities).filter(city => city && city.isAlive !== false)
}

/**
 * 获取玩家预备城市列表
 * @param {Object} player - 玩家对象
 * @param {Object} gameState - 游戏状态
 * @returns {Array} 预备城市对象列表
 */
export function getRosterCities(player, gameState) {
  const rosterNames = gameState.roster?.[player.name] || []
  return rosterNames
    .map(name => player.cities[name])
    .filter(city => city && city.isAlive !== false)
}

/**
 * 检查城市是否在谨慎交换集合中
 * @param {Object} gameState - 游戏状态
 * @param {string} playerName - 玩家名称
 * @param {string} cityName - 城市名称
 * @returns {boolean}
 */
export function isInCautiousSet(gameState, playerName, cityName) {
  const cautiousSet = gameState.cautiousExchange?.[playerName]
  if (!cautiousSet) return false
  // cautiousExchange 现在是 Set
  return cautiousSet.has ? cautiousSet.has(cityName) : cautiousSet.includes(cityName)
}

/**
 * 添加城市到谨慎交换集合
 * @param {Object} gameState - 游戏状态
 * @param {string} playerName - 玩家名称
 * @param {string} cityName - 城市名称
 */
export function addToCautiousSet(gameState, playerName, cityName) {
  if (!gameState.cautiousExchange) {
    gameState.cautiousExchange = {}
  }
  if (!gameState.cautiousExchange[playerName]) {
    gameState.cautiousExchange[playerName] = new Set()
  }
  gameState.cautiousExchange[playerName].add(cityName)
}

/**
 * 获取城市HP上限
 * @param {Object} city - 城市对象
 * @param {number} initialHp - 初始HP
 * @returns {number} HP上限
 */
export function getCityHpLimit(city, initialHp) {
  const baseHp = initialHp || city.hp || city.baseHp || 10000

  if (baseHp >= 60000) {
    return 120000
  } else if (baseHp >= 30000) {
    return 100000
  } else {
    return 80000
  }
}

/**
 * 检查游戏模式
 * @param {string} gameMode - 游戏模式
 * @returns {Object} { is2P: boolean, is3P: boolean, is2v2: boolean }
 */
export function checkGameMode(gameMode) {
  return {
    is2P: gameMode === '2P',
    is3P: gameMode === '3P',
    is2v2: gameMode === '2v2'
  }
}

/**
 * 扣除金币并记录
 * @param {Object} player - 玩家对象
 * @param {number} cost - 消耗金币数
 * @param {Object} gameState - 游戏状态
 * @param {string} skillName - 技能名称
 */
export function deductGold(player, cost, gameState, skillName) {
  player.gold -= cost

  // 记录最后使用的技能（用于无懈可击）
  if (gameState.lastSkillUsed) {
    gameState.lastSkillUsed = {
      userName: player.name,
      skillName: skillName,
      cost: cost,
      roundNumber: gameState.currentRound,
      timestamp: Date.now()
    }
  }
}
