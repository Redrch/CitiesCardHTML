/**
 * 城市卡牌游戏 - 工具函数模块
 * 包含各种辅助函数：颜色技能加成、城市追踪、保护检查等
 */

// ========== 颜色技能加成函数 ==========

/**
 * 获取红色技能加成值
 * @param {number} level - 技能等级(1-3)
 * @returns {number} 加成值
 */
function getRedBonus(level) {
  switch(level) {
    case 1: return 500;
    case 2: return 1000;
    case 3: return 2000;
    default: return 0;
  }
}

/**
 * 获取绿色技能加成值
 * @param {number} level - 技能等级(1-3)
 * @returns {number} 加成值
 */
function getGreenBonus(level) {
  switch(level) {
    case 1: return 500;
    case 2: return 1000;
    case 3: return 2000;
    default: return 0;
  }
}

/**
 * 获取黄色技能治疗值
 * @param {number} level - 技能等级(1-3)
 * @returns {number} 治疗值
 */
function getYellowHeal(level) {
  switch(level) {
    case 1: return 500;
    case 2: return 1000;
    case 3: return 2000;
    default: return 0;
  }
}

// ========== 城市追踪函数 ==========

/**
 * 标记城市为已知（在战斗、交换等情况下调用）
 * @param {object} roomData - 房间数据
 * @param {string} ownerName - 城市拥有者名称
 * @param {number} cityIdx - 城市索引
 * @param {string} observerName - 观察者名称
 */
function markCityAsKnown(roomData, ownerName, cityIdx, observerName) {
  if (!roomData.gameState.knownCities) {
    roomData.gameState.knownCities = {};
  }
  if (!roomData.gameState.knownCities[observerName]) {
    roomData.gameState.knownCities[observerName] = {};
  }
  if (!roomData.gameState.knownCities[observerName][ownerName]) {
    roomData.gameState.knownCities[observerName][ownerName] = [];
  }

  // 添加城市索引到已知列表（避免重复）
  if (!roomData.gameState.knownCities[observerName][ownerName].includes(cityIdx)) {
    roomData.gameState.knownCities[observerName][ownerName].push(cityIdx);
  }
}

/**
 * 获取未知城市列表
 * @param {object} roomData - 房间数据
 * @param {string} targetPlayerName - 目标玩家名称
 * @param {string} observerName - 观察者名称
 * @returns {Array} 未知城市列表
 */
function getUnknownCities(roomData, targetPlayerName, observerName) {
  const targetPlayer = roomData.players.find(p => p.name === targetPlayerName);
  if (!targetPlayer) return [];

  const knownIndices = (roomData.gameState.knownCities &&
                       roomData.gameState.knownCities[observerName] &&
                       roomData.gameState.knownCities[observerName][targetPlayerName]) || [];

  const unknownCities = [];
  targetPlayer.cities.forEach((city, idx) => {
    if (city && city.hp > 0 && !knownIndices.includes(idx)) {
      unknownCities.push({ city, idx });
    }
  });

  return unknownCities;
}

// ========== 谨慎交换集合检查 ==========

/**
 * 检查城市是否在谨慎交换集合中
 * 谨慎交换集合 = {钢铁城市、中心城市(2P/2v2)、定海神针城市、城市保护城市、已阵亡城市}
 * @param {object} roomData - 房间数据
 * @param {string} playerName - 玩家名称
 * @param {number} cityIdx - 城市索引
 * @returns {boolean} 是否在谨慎交换集合中
 */
function isInCautiousSet(roomData, playerName, cityIdx) {
  const player = roomData.players.find(p => p.name === playerName);
  if (!player) return false;

  // 检查城市是否已阵亡
  const city = player.cities[cityIdx];
  if (!city || city.hp <= 0) return true;

  const mode = roomData.gameMode || '2p';

  // 检查是否为中心城市（2P/2v2）
  if (mode === '2p' || mode === '2v2') {
    const centerIdx = player.centerCity !== undefined ? player.centerCity : 0;
    if (cityIdx === centerIdx) return true;
  }

  // 检查是否为钢铁城市
  if (roomData.gameState.ironCities &&
      roomData.gameState.ironCities[playerName] &&
      roomData.gameState.ironCities[playerName][cityIdx] > 0) {
    return true;
  }

  // 检查是否有定海神针
  if (roomData.gameState.anchored &&
      roomData.gameState.anchored[playerName] &&
      roomData.gameState.anchored[playerName][cityIdx] > 0) {
    return true;
  }

  // 检查是否有城市保护
  if (roomData.gameState.protections &&
      roomData.gameState.protections[playerName] &&
      roomData.gameState.protections[playerName][cityIdx] > 0) {
    return true;
  }

  return false;
}

// ========== 日志函数 ==========

/**
 * 添加公共日志
 * @param {object} roomData - 房间数据
 * @param {string} message - 日志消息
 */
function addPublicLog(roomData, message) {
  if (!roomData.gameState.battleLogs) roomData.gameState.battleLogs = [];
  roomData.gameState.battleLogs.push({
    round: roomData.gameState.currentRound,
    message: message,
    timestamp: Date.now(),
    isPrivate: false
  });
}

/**
 * 添加私有日志
 * @param {object} roomData - 房间数据
 * @param {string} playerName - 玩家名称
 * @param {string} message - 日志消息
 */
function addPrivateLog(roomData, playerName, message) {
  if (!roomData.gameState.playerPrivateLogs[playerName]) {
    roomData.gameState.playerPrivateLogs[playerName] = [];
  }
  roomData.gameState.playerPrivateLogs[playerName].push({
    round: roomData.gameState.currentRound,
    message: message,
    timestamp: Date.now(),
    isPrivate: true
  });
}

// ========== 城市保护检查 ==========

/**
 * 清除城市的已知状态（当城市被替换或伪装时调用）
 * @param {object} roomData - 房间数据
 * @param {string} ownerName - 城市拥有者名称
 * @param {number} cityIdx - 城市索引
 */
function clearCityKnownStatus(roomData, ownerName, cityIdx) {
  if (!roomData.gameState.knownCities) return;

  // 遍历所有观察者，从他们的已知列表中移除这个城市
  for (const observerName in roomData.gameState.knownCities) {
    if (roomData.gameState.knownCities[observerName][ownerName]) {
      const knownList = roomData.gameState.knownCities[observerName][ownerName];
      const index = knownList.indexOf(cityIdx);
      if (index > -1) {
        knownList.splice(index, 1);
      }
    }
  }
}

// ========== 狐假虎威（伪装）辅助函数 ==========

/**
 * 获取伪装配置
 * @param {object} roomData - 房间数据
 * @param {string} playerName - 玩家名称
 * @param {number} cityIdx - 城市索引
 * @returns {object|null} 伪装配置或null
 */
function getDisguiseCfg(roomData, playerName, cityIdx) {
  if (!roomData.gameState.disguisedCities) return null;
  if (!roomData.gameState.disguisedCities[playerName]) return null;
  return roomData.gameState.disguisedCities[playerName][cityIdx] || null;
}

/**
 * 检查城市是否处于伪装状态
 * @param {object} roomData - 房间数据
 * @param {string} playerName - 玩家名称
 * @param {number} cityIdx - 城市索引
 * @returns {boolean} 是否伪装
 */
function isDisguised(roomData, playerName, cityIdx) {
  const cfg = getDisguiseCfg(roomData, playerName, cityIdx);
  return !!(cfg && cfg.roundsLeft > 0);
}

/**
 * 获取有效城市名称（伪装时返回伪装名，否则返回真实名）
 * @param {object} roomData - 房间数据
 * @param {string} playerName - 玩家名称
 * @param {number} cityIdx - 城市索引
 * @param {object} player - 玩家对象
 * @returns {string} 城市名称
 */
function getEffectiveCityName(roomData, playerName, cityIdx, player) {
  const cfg = getDisguiseCfg(roomData, playerName, cityIdx);
  if (cfg && cfg.roundsLeft > 0 && cfg.disguiseAsName) {
    return cfg.disguiseAsName;
  }
  return player.cities[cityIdx].name || `#${cityIdx}`;
}

/**
 * 获取有效HP（伪装时返回伪装HP，否则返回真实HP）
 * @param {object} roomData - 房间数据
 * @param {string} playerName - 玩家名称
 * @param {number} cityIdx - 城市索引
 * @param {object} player - 玩家对象
 * @returns {number} HP值
 */
function getEffectiveCityHP(roomData, playerName, cityIdx, player) {
  const cfg = getDisguiseCfg(roomData, playerName, cityIdx);
  if (cfg && cfg.roundsLeft > 0 && cfg.currentDisguiseHp !== undefined) {
    return cfg.currentDisguiseHp;
  }
  return player.cities[cityIdx].hp || 0;
}

/**
 * 获取有效红色技能等级（伪装时返回伪装等级，否则返回真实等级）
 * @param {object} roomData - 房间数据
 * @param {string} playerName - 玩家名称
 * @param {number} cityIdx - 城市索引
 * @param {object} player - 玩家对象
 * @returns {number} 红色技能等级
 */
function getEffectiveCityRed(roomData, playerName, cityIdx, player) {
  const cfg = getDisguiseCfg(roomData, playerName, cityIdx);
  if (cfg && cfg.roundsLeft > 0 && cfg.red !== undefined) {
    return cfg.red;
  }
  return player.cities[cityIdx].red || 0;
}

/**
 * 获取有效绿色技能等级（伪装时返回伪装等级，否则返回真实等级）
 * @param {object} roomData - 房间数据
 * @param {string} playerName - 玩家名称
 * @param {number} cityIdx - 城市索引
 * @param {object} player - 玩家对象
 * @returns {number} 绿色技能等级
 */
function getEffectiveCityGreen(roomData, playerName, cityIdx, player) {
  const cfg = getDisguiseCfg(roomData, playerName, cityIdx);
  if (cfg && cfg.roundsLeft > 0 && cfg.green !== undefined) {
    return cfg.green;
  }
  return player.cities[cityIdx].green || 0;
}

/**
 * 获取有效蓝色技能等级（伪装时返回伪装等级，否则返回真实等级）
 * @param {object} roomData - 房间数据
 * @param {string} playerName - 玩家名称
 * @param {number} cityIdx - 城市索引
 * @param {object} player - 玩家对象
 * @returns {number} 蓝色技能等级
 */
function getEffectiveCityBlue(roomData, playerName, cityIdx, player) {
  const cfg = getDisguiseCfg(roomData, playerName, cityIdx);
  if (cfg && cfg.roundsLeft > 0 && cfg.blue !== undefined) {
    return cfg.blue;
  }
  return player.cities[cityIdx].blue || 0;
}

// ========== 城市保护检查 ==========

/**
 * 检查并消耗城市保护（针对对手城市的金币技能）
 * @param {object} roomData - 房间数据
 * @param {string} targetPlayerName - 目标玩家名称
 * @param {number} targetCityIdx - 目标城市索引
 * @param {string} attackerName - 攻击者名称
 * @param {string} skillName - 技能名称
 * @returns {boolean} true表示城市受保护（技能被阻挡），false表示无保护（技能可执行）
 */
function checkAndConsumeProtection(roomData, targetPlayerName, targetCityIdx, attackerName, skillName) {
  if (!roomData.gameState.protections) return false;
  if (!roomData.gameState.protections[targetPlayerName]) return false;
  if (!roomData.gameState.protections[targetPlayerName][targetCityIdx]) return false;
  if (roomData.gameState.protections[targetPlayerName][targetCityIdx] <= 0) return false;

  // 城市有保护，消耗保护
  delete roomData.gameState.protections[targetPlayerName][targetCityIdx];

  // 记录日志
  const targetPlayer = roomData.players.find(p => p.name === targetPlayerName);
  const targetCity = targetPlayer ? targetPlayer.cities[targetCityIdx] : null;
  const cityName = getEffectiveCityName(roomData, targetPlayerName, targetCityIdx, targetPlayer) || `#${targetCityIdx}`;

  addPrivateLog(roomData, attackerName, `你对${targetPlayerName}的${cityName}使用了${skillName}，但该城市有保护罩，技能无效，保护罩破裂`);
  addPrivateLog(roomData, targetPlayerName, `${attackerName}对你的${cityName}使用了${skillName}，但你的城市保护罩阻挡了技能，保护罩破裂`);
  addPublicLog(roomData, `${attackerName}对${targetPlayerName}使用了${skillName}，但目标城市有保护`);

  return true;
}

// 导出所有函数
export {
  getRedBonus,
  getGreenBonus,
  getYellowHeal,
  markCityAsKnown,
  getUnknownCities,
  isInCautiousSet,
  addPublicLog,
  addPrivateLog,
  clearCityKnownStatus,
  getDisguiseCfg,
  isDisguised,
  getEffectiveCityName,
  getEffectiveCityHP,
  getEffectiveCityRed,
  getEffectiveCityGreen,
  getEffectiveCityBlue,
  checkAndConsumeProtection
};
