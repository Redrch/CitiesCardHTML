/**
 * 状态变化应用器
 * State Change Applier
 *
 * 负责将技能核心函数返回的状态变化应用到gameStore
 */

/**
 * 应用状态变化到gameStore
 * @param {Object} gameStore - 游戏状态存储
 * @param {Object} stateChanges - 状态变化对象
 */
export function applyStateChanges(gameStore, stateChanges) {
  if (!stateChanges) return

  // 1. 应用玩家金币更新
  if (stateChanges.playerGoldUpdates) {
    applyPlayerGoldUpdates(gameStore, stateChanges.playerGoldUpdates)
  }

  // 2. 应用城市HP更新
  if (stateChanges.cityHpUpdates) {
    applyCityHpUpdates(gameStore, stateChanges.cityHpUpdates)
  }

  // 3. 应用城市转移
  if (stateChanges.cityTransfers) {
    applyCityTransfers(gameStore, stateChanges.cityTransfers)
  }

  // 4. 应用保护状态更新
  if (stateChanges.protectionUpdates) {
    applyProtectionUpdates(gameStore, stateChanges.protectionUpdates)
  }

  // 5. 应用全局效果
  if (stateChanges.globalEffects) {
    applyGlobalEffects(gameStore, stateChanges.globalEffects)
  }

  // 6. 应用技能状态更新
  if (stateChanges.skillStateUpdates) {
    applySkillStateUpdates(gameStore, stateChanges.skillStateUpdates)
  }

  // 7. 添加日志
  if (stateChanges.logs) {
    applyLogs(gameStore, stateChanges.logs)
  }
}

/**
 * 应用玩家金币更新
 * @param {Object} gameStore - 游戏状态存储
 * @param {Object.<string, number>} goldUpdates - 金币更新映射
 */
function applyPlayerGoldUpdates(gameStore, goldUpdates) {
  for (const [playerName, deltaGold] of Object.entries(goldUpdates)) {
    const player = gameStore.players.find(p => p.name === playerName)
    if (player) {
      player.gold += deltaGold
      // 确保金币不超过上限
      if (player.gold > 24) {
        player.gold = 24
      }
      // 确保金币不为负数
      if (player.gold < 0) {
        player.gold = 0
      }
    }
  }
}

/**
 * 应用城市HP更新
 * @param {Object} gameStore - 游戏状态存储
 * @param {Object} cityHpUpdates - 城市HP更新映射 {playerName: {cityName: update}}
 */
function applyCityHpUpdates(gameStore, cityHpUpdates) {
  for (const [playerName, cityUpdates] of Object.entries(cityHpUpdates)) {
    const player = gameStore.players.find(p => p.name === playerName)
    if (!player) continue

    for (const [cityName, update] of Object.entries(cityUpdates)) {
      const city = player.cities[cityName]
      if (!city) continue

      if (update.currentHp !== undefined) {
        city.currentHp = update.currentHp
        // 确保HP不超过最大值
        if (city.currentHp > city.hp) {
          city.currentHp = city.hp
        }
        // 确保HP不为负数
        if (city.currentHp < 0) {
          city.currentHp = 0
        }
      }

      if (update.baseHp !== undefined) {
        city.baseHp = update.baseHp
      }

      if (update.isAlive !== undefined) {
        city.isAlive = update.isAlive
      }

      // 如果HP归零，标记为阵亡
      if (city.currentHp <= 0) {
        city.isAlive = false
      }
    }
  }
}

/**
 * 应用城市转移
 * @param {Object} gameStore - 游戏状态存储
 * @param {Array} cityTransfers - 城市转移列表 [{from, fromCityName, to, toCityName}]
 */
function applyCityTransfers(gameStore, cityTransfers) {
  for (const transfer of cityTransfers) {
    const { from, fromCityName, to, toCityName } = transfer

    const fromPlayer = gameStore.players.find(p => p.name === from)
    const toPlayer = gameStore.players.find(p => p.name === to)

    if (!fromPlayer || !toPlayer) continue

    // 交换城市
    const temp = fromPlayer.cities[fromCityName]
    fromPlayer.cities[fromCityName] = toPlayer.cities[toCityName]
    toPlayer.cities[toCityName] = temp

    // 注意：initialCities 现在按城市名称追踪，无需交换

    // 标记为已知城市
    if (gameStore.setCityKnown) {
      gameStore.setCityKnown(from, fromCityName, to)
      gameStore.setCityKnown(to, toCityName, from)
    }
  }
}

/**
 * 应用保护状态更新
 * @param {Object} gameStore - 游戏状态存储
 * @param {Object} protectionUpdates - 保护状态更新映射 {playerName: {cityName: protection}}
 */
function applyProtectionUpdates(gameStore, protectionUpdates) {
  for (const [playerName, cityProtections] of Object.entries(protectionUpdates)) {
    for (const [cityName, protection] of Object.entries(cityProtections)) {
      if (protection.type === 'iron') {
        // 钢铁城市
        if (!gameStore.ironCities[playerName]) {
          gameStore.ironCities[playerName] = {}
        }
        gameStore.ironCities[playerName][cityName] = protection.layers || 2
      } else if (protection.type === 'normal') {
        // 普通保护罩
        if (!gameStore.protections[playerName]) {
          gameStore.protections[playerName] = {}
        }
        gameStore.protections[playerName][cityName] = protection.rounds || 10
      } else if (protection.type === 'remove') {
        // 移除保护
        if (gameStore.ironCities[playerName]) {
          delete gameStore.ironCities[playerName][cityName]
        }
        if (gameStore.protections[playerName]) {
          delete gameStore.protections[playerName][cityName]
        }
      }
    }
  }
}

/**
 * 应用全局效果
 * @param {Object} gameStore - 游戏状态存储
 * @param {Object} globalEffects - 全局效果对象
 */
function applyGlobalEffects(gameStore, globalEffects) {
  // 擒贼擒王
  if (globalEffects.qinwang !== undefined) {
    gameStore.qinwang = globalEffects.qinwang
  }

  // 草木皆兵
  if (globalEffects.cmjb !== undefined) {
    gameStore.cmjb = globalEffects.cmjb
  }

  // 铜墙铁壁
  if (globalEffects.ironwall !== undefined) {
    gameStore.ironwall = globalEffects.ironwall
  }

  // 料事如神
  if (globalEffects.foresee !== undefined) {
    gameStore.foresee = globalEffects.foresee
  }

  // 屏障
  if (globalEffects.barrier !== undefined) {
    if (globalEffects.barrier === null) {
      gameStore.barrier = {}
    } else {
      if (!gameStore.barrier) {
        gameStore.barrier = {}
      }
      Object.assign(gameStore.barrier, globalEffects.barrier)
    }
  }

  // 坚不可摧
  if (globalEffects.jianbukecui !== undefined) {
    if (!gameStore.jianbukecui) {
      gameStore.jianbukecui = {}
    }
    Object.assign(gameStore.jianbukecui, globalEffects.jianbukecui)
  }

  // 其他全局效果...
  const effectKeys = [
    'yueyueyong', 'attract', 'jilaizan', 'yujia', 'reflect',
    'ccjj', 'wwjz', 'yiyidl', 'timeBombs', 'disguisedCities',
    'hiddenGrowth', 'hpBank', 'centerProjection'
  ]

  for (const key of effectKeys) {
    if (globalEffects[key] !== undefined) {
      gameStore[key] = globalEffects[key]
    }
  }
}

/**
 * 应用技能状态更新
 * @param {Object} gameStore - 游戏状态存储
 * @param {Object} skillStateUpdates - 技能状态更新对象
 */
function applySkillStateUpdates(gameStore, skillStateUpdates) {
  // 禁用技能
  if (skillStateUpdates.bannedSkills) {
    if (!gameStore.bannedSkills) {
      gameStore.bannedSkills = {}
    }
    for (const [opponent, skills] of Object.entries(skillStateUpdates.bannedSkills)) {
      if (!gameStore.bannedSkills[opponent]) {
        gameStore.bannedSkills[opponent] = {}
      }
      Object.assign(gameStore.bannedSkills[opponent], skills)
    }
  }

  // 冷却时间
  if (skillStateUpdates.cooldowns) {
    if (!gameStore.cooldowns) {
      gameStore.cooldowns = {}
    }
    for (const [playerName, skills] of Object.entries(skillStateUpdates.cooldowns)) {
      if (!gameStore.cooldowns[playerName]) {
        gameStore.cooldowns[playerName] = {}
      }
      Object.assign(gameStore.cooldowns[playerName], skills)
    }
  }

  // 使用次数
  if (skillStateUpdates.usageCounts) {
    if (!gameStore.skillUsageTracking) {
      gameStore.skillUsageTracking = {}
    }
    for (const [playerName, skills] of Object.entries(skillStateUpdates.usageCounts)) {
      if (!gameStore.skillUsageTracking[playerName]) {
        gameStore.skillUsageTracking[playerName] = {}
      }
      for (const [skillName, count] of Object.entries(skills)) {
        gameStore.skillUsageTracking[playerName][skillName] = count
      }
    }
  }
}

/**
 * 应用日志
 * @param {Object} gameStore - 游戏状态存储
 * @param {Array} logs - 日志条目列表
 */
function applyLogs(gameStore, logs) {
  for (const log of logs) {
    if (log.isPrivate && log.targetPlayer) {
      // 私有日志
      if (gameStore.addPrivateLog) {
        gameStore.addPrivateLog(log.targetPlayer, log.message)
      }
    } else {
      // 公共日志
      if (gameStore.addLog) {
        gameStore.addLog(log.message)
      }
    }
  }
}

/**
 * 创建状态变化对象的辅助函数
 */
export function createStateChanges() {
  return {
    playerGoldUpdates: {},
    cityHpUpdates: {},
    cityTransfers: [],
    protectionUpdates: {},
    globalEffects: {},
    skillStateUpdates: {
      bannedSkills: {},
      cooldowns: {},
      usageCounts: {}
    },
    logs: []
  }
}

/**
 * 添加金币更新
 * @param {Object} stateChanges - 状态变化对象
 * @param {string} playerName - 玩家名称
 * @param {number} deltaGold - 金币变化量
 */
export function addGoldUpdate(stateChanges, playerName, deltaGold) {
  if (!stateChanges.playerGoldUpdates) {
    stateChanges.playerGoldUpdates = {}
  }
  stateChanges.playerGoldUpdates[playerName] =
    (stateChanges.playerGoldUpdates[playerName] || 0) + deltaGold
}

/**
 * 添加城市HP更新
 * @param {Object} stateChanges - 状态变化对象
 * @param {string} playerName - 玩家名称
 * @param {string} cityName - 城市名称
 * @param {Object} update - HP更新对象
 */
export function addCityHpUpdate(stateChanges, playerName, cityName, update) {
  if (!stateChanges.cityHpUpdates) {
    stateChanges.cityHpUpdates = {}
  }
  if (!stateChanges.cityHpUpdates[playerName]) {
    stateChanges.cityHpUpdates[playerName] = {}
  }
  stateChanges.cityHpUpdates[playerName][cityName] = update
}

/**
 * 添加日志
 * @param {Object} stateChanges - 状态变化对象
 * @param {string} message - 日志消息
 * @param {boolean} isPrivate - 是否为私有日志
 * @param {string} targetPlayer - 目标玩家（私有日志）
 */
export function addLog(stateChanges, message, isPrivate = false, targetPlayer = null) {
  if (!stateChanges.logs) {
    stateChanges.logs = []
  }
  stateChanges.logs.push({
    message,
    isPrivate,
    targetPlayer
  })
}
