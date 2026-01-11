/**
 * 连续出战疲劳机制
 * 参考 citycard_web.html lines 4426-4453, 5357-5375
 *
 * 关键修改：按照用户需求，疲劳减半发生在同省规则检查之前
 * 即使发生撤退/归顺，也算一个完整回合，疲劳照常累积
 */

/**
 * 应用疲劳减半逻辑
 * 在战斗开始前调用，对连续第2次及以上出战的城市减半HP
 *
 * @param {Object} gameStore - 游戏状态store
 * @param {Object} gameState - 当前游戏状态
 * @param {Array} players - 玩家列表
 * @param {String} mode - 游戏模式
 */
export function applyFatigueReduction(gameStore, gameState, players, mode) {
  console.log('[疲劳系统] 开始检查连续出战疲劳')

  players.forEach((player, playerIdx) => {
    const playerState = gameState.playerStates[player.name]
    if (!playerState) return

    // 初始化streaks
    if (!player.streaks) player.streaks = {}

    // 获取本轮出战城市列表
    let deployedCities = []

    if (mode === '3P') {
      // 3P模式：从currentBattleData获取所有出战城市
      if (playerState.currentBattleData) {
        Object.values(playerState.currentBattleData).forEach(citiesArray => {
          if (Array.isArray(citiesArray)) {
            citiesArray.forEach(card => {
              if (card.cityIdx !== undefined && !deployedCities.includes(card.cityIdx)) {
                deployedCities.push(card.cityIdx)
              }
            })
          }
        })
      }
    } else {
      // 2P/2v2模式：从currentBattleCities获取
      deployedCities = (playerState.currentBattleCities || []).map(card => card.cityIdx)
    }

    console.log(`[疲劳系统] ${player.name} 本轮出战城市索引:`, deployedCities)

    // 遍历所有出战城市，检查疲劳
    deployedCities.forEach(cityIdx => {
      const city = player.cities[cityIdx]
      if (!city || city.currentHp <= 0) return

      const prevStreak = player.streaks[cityIdx] || 0
      console.log(`[疲劳系统] ${player.name} 的 ${city.name} (索引${cityIdx}) 上一轮streak=${prevStreak}`)

      // 跳过本轮复活的城市（借尸还魂）
      if (gameStore.revivedCities && gameStore.revivedCities[player.name] &&
          gameStore.revivedCities[player.name][cityIdx]) {
        gameStore.addLog(`(借尸还魂) ${player.name}的${city.name} 本轮复活，疲劳指数恢复如初，跳过疲劳减半`)
        player.streaks[cityIdx] = 0
        return
      }

      // 检查豁免机制
      const hasYYY = checkYueZhanYueYong(gameStore, player, cityIdx)  // 越战越勇
      const hasJLZA = checkJiLaiZeAn(gameStore, player, cityIdx)      // 既来则安
      const hasIgnoreFatigue = checkIgnoreFatigueModifier(city)       // 其他ignore_fatigue效果

      // 连续第2次及以上出战才减半（prevStreak >= 1），但豁免技能可以跳过
      if (prevStreak >= 1 && !hasYYY && !hasJLZA && !hasIgnoreFatigue) {
        const beforeHp = city.currentHp
        city.currentHp = Math.floor(city.currentHp / 2)

        // 同步更新hp字段（为了兼容性）
        if (city.hp !== undefined) {
          city.hp = city.currentHp
        }

        gameStore.addLog(
          `(疲劳) ${player.name}的${city.name} 连续第${prevStreak + 1}次出战，战斗前HP减半：${Math.floor(beforeHp)} → ${Math.floor(city.currentHp)}`
        )
        console.log(`[疲劳系统] ${player.name} 的 ${city.name} HP减半: ${beforeHp} → ${city.currentHp}`)
      } else if (prevStreak >= 1) {
        const reason = hasYYY ? '越战越勇' : hasJLZA ? '既来则安' : 'ignore_fatigue'
        console.log(`[疲劳系统] ${player.name} 的 ${city.name} 因${reason}豁免疲劳减半`)
      }
    })
  })

  console.log('[疲劳系统] 疲劳减半检查完成')
}

/**
 * 更新疲劳streak计数器
 * 在战斗结束后调用，更新每个城市的连续出战次数
 *
 * 关键：无论是否触发撤退/归顺，出战城市都累积疲劳（+1），未出战城市归零
 *
 * @param {Array} players - 玩家列表
 * @param {Object} gameState - 游戏状态
 * @param {String} mode - 游戏模式
 */
export function updateFatigueStreaks(players, gameState, mode) {
  console.log('[疲劳系统] 开始更新疲劳计数器')

  players.forEach(player => {
    const playerState = gameState.playerStates[player.name]
    if (!playerState) return

    // 初始化streaks
    if (!player.streaks) player.streaks = {}

    // 获取本轮出战城市列表
    let deployedCities = []

    if (mode === '3P') {
      // 3P模式：从currentBattleData获取所有出战城市
      if (playerState.currentBattleData) {
        Object.values(playerState.currentBattleData).forEach(citiesArray => {
          if (Array.isArray(citiesArray)) {
            citiesArray.forEach(card => {
              if (card.cityIdx !== undefined && !deployedCities.includes(card.cityIdx)) {
                deployedCities.push(card.cityIdx)
              }
            })
          }
        })
      }
    } else {
      // 2P/2v2模式：从currentBattleCities获取
      deployedCities = (playerState.currentBattleCities || []).map(card => card.cityIdx)
    }

    const deployedSet = new Set(deployedCities)
    console.log(`[疲劳系统] ${player.name} 本轮出战城市:`, deployedCities)

    // 更新所有城市的streak
    player.cities.forEach((city, cityIdx) => {
      if (!city) return

      if (deployedSet.has(cityIdx)) {
        // 出战城市：streak +1（无论是否触发撤退/归顺）
        const oldStreak = player.streaks[cityIdx] || 0
        player.streaks[cityIdx] = oldStreak + 1
        console.log(`[疲劳系统] ${player.name} 的 ${city.name} streak: ${oldStreak} → ${player.streaks[cityIdx]}`)
      } else {
        // 未出战城市：归零
        if (player.streaks[cityIdx] > 0) {
          console.log(`[疲劳系统] ${player.name} 的 ${city.name} 未出战，streak归零: ${player.streaks[cityIdx]} → 0`)
        }
        player.streaks[cityIdx] = 0
      }
    })
  })

  console.log('[疲劳系统] 疲劳计数器更新完成')
}

/**
 * 检查城市是否有越战越勇效果
 */
function checkYueZhanYueYong(gameStore, player, cityIdx) {
  if (!gameStore.yueyueyong || !gameStore.yueyueyong[player.name]) {
    return false
  }
  const yyyState = gameStore.yueyueyong[player.name][cityIdx]
  return yyyState && yyyState.active === true
}

/**
 * 检查城市是否有既来则安效果
 */
function checkJiLaiZeAn(gameStore, player, cityIdx) {
  if (!gameStore.jilaizan || !gameStore.jilaizan[player.name]) {
    return false
  }
  const jlzaState = gameStore.jilaizan[player.name][cityIdx]
  return jlzaState && jlzaState.active === true
}

/**
 * 检查城市是否有ignore_fatigue modifier
 */
function checkIgnoreFatigueModifier(city) {
  if (!city.modifiers || !Array.isArray(city.modifiers)) {
    return false
  }
  return city.modifiers.some(m => m.type === 'ignore_fatigue' && (m.duration === undefined || m.duration > 0))
}

/**
 * 重置所有玩家的疲劳状态（用于改弦更张等技能）
 */
export function resetAllFatigueStreaks(players) {
  players.forEach(player => {
    if (player.streaks) {
      Object.keys(player.streaks).forEach(cityIdx => {
        player.streaks[cityIdx] = 0
      })
    }
  })
}

/**
 * 重置特定玩家的疲劳状态
 */
export function resetPlayerFatigueStreaks(player) {
  if (player.streaks) {
    Object.keys(player.streaks).forEach(cityIdx => {
      player.streaks[cityIdx] = 0
    })
  }
}

/**
 * 重置特定城市的疲劳状态
 */
export function resetCityFatigueStreak(player, cityIdx) {
  if (player.streaks) {
    player.streaks[cityIdx] = 0
  }
}
