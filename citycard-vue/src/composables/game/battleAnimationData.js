/**
 * 准备战斗动画数据
 * 从游戏状态中提取用于动画展示的数据
 */

/**
 * 准备战斗动画数据
 * @param {Object} roomData - 房间数据
 * @param {Object} gameStore - 游戏store
 * @returns {Object} 战斗动画数据
 */
export function prepareBattleAnimationData(roomData, gameStore) {
  console.log('[BattleAnimationData] ===== 开始准备战斗动画数据 =====')
  console.log('[BattleAnimationData] roomData存在:', !!roomData)
  console.log('[BattleAnimationData] roomData.mode:', roomData?.mode)
  console.log('[BattleAnimationData] roomData.players数量:', roomData?.players?.length)
  console.log('[BattleAnimationData] roomData.gameState存在:', !!roomData?.gameState)

  const mode = roomData.mode || '2P'
  const players = roomData.players
  const gameState = roomData.gameState

  if (mode !== '2P') {
    console.warn('[BattleAnimationData] 当前仅支持2P模式动画，mode=', mode)
    return null
  }

  if (players.length !== 2) {
    console.error('[BattleAnimationData] 玩家数量不足，players.length=', players.length)
    return null
  }

  const player1 = players[0]
  const player2 = players[1]

  console.log('[BattleAnimationData] player1:', player1?.name, '城市数量:', Object.keys(player1?.cities || {}).length)
  console.log('[BattleAnimationData] player2:', player2?.name, '城市数量:', Object.keys(player2?.cities || {}).length)
  console.log('[BattleAnimationData] gameState.playerStates存在:', !!gameState?.playerStates)
  console.log('[BattleAnimationData] gameState.playerStates keys:', gameState?.playerStates ? Object.keys(gameState.playerStates) : 'undefined')

  const state1 = gameState.playerStates[player1.name]
  const state2 = gameState.playerStates[player2.name]

  console.log('[BattleAnimationData] state1存在:', !!state1)
  console.log('[BattleAnimationData] state2存在:', !!state2)

  if (!state1 || !state2) {
    console.error('[BattleAnimationData] 玩家状态不存在')
    console.error('[BattleAnimationData] state1:', state1)
    console.error('[BattleAnimationData] state2:', state2)
    return null
  }

  // 检测特殊事件（必须先检测，因为我们需要从specialEventThisRound读取城市信息）
  let specialEvent = detectSpecialEvent(roomData, gameState, player1, player2, state1, state2)

  // 关键修复：检查specialEvent的回合数是否匹配，防止使用旧数据
  if (specialEvent && specialEvent.round && specialEvent.round !== gameState.currentRound) {
    console.warn(`[BattleAnimationData] specialEvent回合不匹配：event.round=${specialEvent.round}, currentRound=${gameState.currentRound}，忽略此事件`)
    specialEvent = null
    // 清理旧的specialEventThisRound
    if (gameState.specialEventThisRound && gameState.specialEventThisRound.round !== gameState.currentRound) {
      console.warn('[BattleAnimationData] 检测到旧的specialEventThisRound，将其清理')
      delete gameState.specialEventThisRound
    }
  }

  // 关键修复：从specialEventThisRound读取出战城市名称
  // 因为executePreBattleChecks已经清空了currentBattleCities
  let battleCities1 = []
  let battleCities2 = []

  if (specialEvent && gameState.specialEventThisRound) {
    console.log('[BattleAnimationData] 从specialEventThisRound恢复出战城市信息')

    // 关键修复：优先使用完整的城市对象（如果存在），避免查找失败
    // 根据事件类型使用不同的字段名
    const hasSurrenderObjects = gameState.specialEventThisRound.attackerCityObjects && gameState.specialEventThisRound.defenderCityObjects
    const hasRetreatObjects = gameState.specialEventThisRound.player1CityObjects && gameState.specialEventThisRound.player2CityObjects

    if (hasSurrenderObjects || hasRetreatObjects) {
      console.log('[BattleAnimationData] 使用specialEventThisRound中保存的完整城市对象')

      let player1Objects, player2Objects

      if (hasSurrenderObjects) {
        // 归顺事件：使用 attackerCityObjects 和 defenderCityObjects
        const attackerCityObjects = gameState.specialEventThisRound.attackerCityObjects || []
        const defenderCityObjects = gameState.specialEventThisRound.defenderCityObjects || []

        // 判断 player1 和 player2 分别对应攻击方还是防守方
        const player1IsAttacker = (gameState.specialEventThisRound.attackerPlayer === player1.name)
        player1Objects = player1IsAttacker ? attackerCityObjects : defenderCityObjects
        player2Objects = player1IsAttacker ? defenderCityObjects : attackerCityObjects
      } else {
        // 撤退事件：使用 player1CityObjects 和 player2CityObjects
        const player1CityObjects = gameState.specialEventThisRound.player1CityObjects || []
        const player2CityObjects = gameState.specialEventThisRound.player2CityObjects || []

        // 判断 player1 和 player2 对应哪个玩家
        const player1IsFirst = (gameState.specialEventThisRound.player1 === player1.name)
        player1Objects = player1IsFirst ? player1CityObjects : player2CityObjects
        player2Objects = player1IsFirst ? player2CityObjects : player1CityObjects
      }

      battleCities1 = player1Objects.map((cityObj, idx) => {
        return {
          name: cityObj.name,
          province: cityObj.province,
          isCapital: cityObj.isCapital || false,
          isProvincialCapital: cityObj.isProvincialCapital || false,
          initialHp: cityObj.currentHp,
          currentHp: cityObj.currentHp,
          hp: cityObj.hp,
          maxHp: cityObj.hp,
          skill: getActivatedCitySkill(state1, cityObj.name),
          cityName: cityObj.name
        }
      })

      battleCities2 = player2Objects.map((cityObj, idx) => {
        return {
          name: cityObj.name,
          province: cityObj.province,
          isCapital: cityObj.isCapital || false,
          isProvincialCapital: cityObj.isProvincialCapital || false,
          initialHp: cityObj.currentHp,
          currentHp: cityObj.currentHp,
          hp: cityObj.hp,
          maxHp: cityObj.hp,
          skill: getActivatedCitySkill(state2, cityObj.name),
          cityName: cityObj.name
        }
      })

      console.log('[BattleAnimationData] 已使用保存的城市对象构建动画数据')
      console.log('[BattleAnimationData] player1出战城市:', battleCities1.map(c => c.name))
      console.log('[BattleAnimationData] player2出战城市:', battleCities2.map(c => c.name))
    } else {
      // 降级方案：使用城市名称查找（旧逻辑）
      console.log('[BattleAnimationData] specialEventThisRound中没有完整城市对象，尝试通过名称查找')

      // 从specialEventThisRound中获取城市名称列表
      const player1CityNames = gameState.specialEventThisRound.player1Cities ||
                               gameState.specialEventThisRound.attackerCities || []
      const player2CityNames = gameState.specialEventThisRound.player2Cities ||
                               gameState.specialEventThisRound.defenderCities || []

      console.log('[BattleAnimationData] player1城市名称:', player1CityNames)
      console.log('[BattleAnimationData] player2城市名称:', player2CityNames)

      // 根据城市名称在玩家的城市列表中查找城市对象
      battleCities1 = player1CityNames.map(cityName => {
        const city = player1.cities[cityName]
        if (!city) {
          console.warn(`[BattleAnimationData] 在${player1.name}的城市列表中找不到${cityName}`)
          return null
        }
        return {
          name: city.name,
          province: city.province,
          isCapital: city.isCapital,
          isProvincialCapital: city.isProvincialCapital,
          initialHp: city.currentHp,
          currentHp: city.currentHp,
          hp: city.hp,
          maxHp: city.hp,
          skill: getActivatedCitySkill(state1, cityName),
          cityName: cityName
        }
      }).filter(c => c !== null)

      battleCities2 = player2CityNames.map(cityName => {
        const city = player2.cities[cityName]
        if (!city) {
          console.warn(`[BattleAnimationData] 在${player2.name}的城市列表中找不到${cityName}`)
          return null
        }
        return {
          name: city.name,
          province: city.province,
          isCapital: city.isCapital,
          isProvincialCapital: city.isProvincialCapital,
          initialHp: city.currentHp,
          currentHp: city.currentHp,
          hp: city.hp,
          maxHp: city.hp,
          skill: getActivatedCitySkill(state2, cityName),
          cityName: cityName
        }
      }).filter(c => c !== null)
    }
  } else {
    // 正常战斗：从currentBattleCities读取
    battleCities1 = (state1.currentBattleCities || []).filter(card => card && card.cityName).map(card => {
      const city = player1.cities[card.cityName]
      if (!city) { console.warn('[BattleAnimationData] player1城市不存在:', card.cityName); return null }
      return {
        name: city.name,
        province: city.province,
        isCapital: city.isCapital,
        isProvincialCapital: city.isProvincialCapital,
        initialHp: city.currentHp,
        currentHp: city.currentHp,
        hp: city.hp,
        maxHp: city.hp,
        skill: getActivatedCitySkill(state1, card.cityName),
        cityName: card.cityName
      }
    }).filter(c => c !== null)

    battleCities2 = (state2.currentBattleCities || []).filter(card => card && card.cityName).map(card => {
      const city = player2.cities[card.cityName]
      if (!city) { console.warn('[BattleAnimationData] player2城市不存在:', card.cityName); return null }
      return {
        name: city.name,
        province: city.province,
        isCapital: city.isCapital,
        isProvincialCapital: city.isProvincialCapital,
        initialHp: city.currentHp,
        currentHp: city.currentHp,
        hp: city.hp,
        maxHp: city.hp,
        skill: getActivatedCitySkill(state2, card.cityName),
        cityName: card.cityName
      }
    }).filter(c => c !== null)
  }

  console.log('[BattleAnimationData] 特殊事件检测结果:', specialEvent)
  console.log('[BattleAnimationData] player1出战城市:', battleCities1.map(c => c.name))
  console.log('[BattleAnimationData] player2出战城市:', battleCities2.map(c => c.name))

  // 计算总攻击力（同省撤退/归顺时攻击力为0）
  const isSpecialEvent = specialEvent && (specialEvent.type === 'retreat' || specialEvent.type === 'surrender')
  const totalAttack1 = isSpecialEvent ? 0 : calculateTotalAttack(player1, battleCities1, gameStore)
  const totalAttack2 = isSpecialEvent ? 0 : calculateTotalAttack(player2, battleCities2, gameStore)

  console.log('[BattleAnimationData] player1总攻击力:', totalAttack1)
  console.log('[BattleAnimationData] player2总攻击力:', totalAttack2)

  const animData = {
    round: gameState.currentRound || 1,
    player1: {
      name: player1.name,
      cities: battleCities1,
      totalAttack: totalAttack1
    },
    player2: {
      name: player2.name,
      cities: battleCities2,
      totalAttack: totalAttack2
    },
    specialEvent,
    fatigueData: gameState.fatigueThisRound || [],  // 添加疲劳数据
    battleResults: null // 将在战斗计算后填充
  }

  console.log('[BattleAnimationData] ===== 动画数据准备完成 =====')
  console.log('[BattleAnimationData] animData.round:', animData.round)
  console.log('[BattleAnimationData] animData.player1.name:', animData.player1.name)
  console.log('[BattleAnimationData] animData.player1.cities数量:', animData.player1.cities.length)
  console.log('[BattleAnimationData] animData.player2.name:', animData.player2.name)
  console.log('[BattleAnimationData] animData.player2.cities数量:', animData.player2.cities.length)
  console.log('[BattleAnimationData] animData.specialEvent:', animData.specialEvent)
  console.log('[BattleAnimationData] animData.fatigueData数量:', animData.fatigueData.length)
  console.log('[BattleAnimationData] ========================================')

  return animData
}

/**
 * 获取激活的城市专属技能名称
 */
function getActivatedCitySkill(playerState, cityName) {
  if (!playerState.activatedCitySkills) return null

  const skillData = playerState.activatedCitySkills[cityName]
  if (!skillData) return null

  return skillData.skillName || null
}

/**
 * 检测特殊事件（同省撤退、同省归顺）
 */
function detectSpecialEvent(roomData, gameState, player1, player2, state1, state2) {
  // 这里需要检查是否触发了同省撤退或归顺
  // 由于这些逻辑在preBattleChecks中处理，我们需要从日志或特殊标记中获取

  // 检查是否有特殊事件标记
  if (gameState.specialEventThisRound) {
    return gameState.specialEventThisRound
  }

  // 检查同省撤退
  const retreat = checkSameProvinceRetreat(player1, player2, state1, state2)
  if (retreat) {
    return {
      type: 'retreat',
      message: `${retreat.province}发生同省撤退`,
      province: retreat.province
    }
  }

  // 检查同省归顺
  const surrender = checkProvinceSurrender(player1, player2, state1, state2)
  if (surrender) {
    return {
      type: 'surrender',
      message: `${surrender.cityName}归顺${surrender.toPlayer}！`,
      province: surrender.province,
      surrenderedCity: {
        fromPlayer: surrender.fromPlayerIdx,
        toPlayer: surrender.toPlayerIdx,
        cityName: surrender.cityName
      }
    }
  }

  return null
}

/**
 * 检查同省撤退
 */
function checkSameProvinceRetreat(player1, player2, state1, state2) {
  const cities1 = (state1.currentBattleCities || []).filter(card => card && card.cityName).map(card => player1.cities[card.cityName]).filter(c => c)
  const cities2 = (state2.currentBattleCities || []).filter(card => card && card.cityName).map(card => player2.cities[card.cityName]).filter(c => c)

  console.log('[BattleAnimationData] 检查同省撤退:')
  console.log('[BattleAnimationData] cities1:', cities1.map(c => ({ name: c.name, province: c.province, isCapital: c.isCapital, isProvincialCapital: c.isProvincialCapital })))
  console.log('[BattleAnimationData] cities2:', cities2.map(c => ({ name: c.name, province: c.province, isCapital: c.isCapital, isProvincialCapital: c.isProvincialCapital })))

  // 检查是否有同省城市
  for (const city1 of cities1) {
    for (const city2 of cities2) {
      if (city1.province === city2.province && city1.province) {
        console.log(`[BattleAnimationData] 发现同省城市: ${city1.name} (${city1.province}) vs ${city2.name} (${city2.province})`)

        // 检查是否都不是省会
        const isCapital1 = city1.isCapital || city1.isProvincialCapital
        const isCapital2 = city2.isCapital || city2.isProvincialCapital

        console.log(`[BattleAnimationData] ${city1.name} 是否省会: ${isCapital1}, ${city2.name} 是否省会: ${isCapital2}`)

        if (!isCapital1 && !isCapital2) {
          console.log(`[BattleAnimationData] ✓ 确认同省撤退: ${city1.province}`)
          return {
            province: city1.province
          }
        } else {
          console.log(`[BattleAnimationData] ✗ 不符合同省撤退条件（有省会）`)
        }
      }
    }
  }

  console.log('[BattleAnimationData] 未检测到同省撤退')
  return null
}

/**
 * 检查同省归顺
 */
function checkProvinceSurrender(player1, player2, state1, state2) {
  const cities1 = (state1.currentBattleCities || []).filter(card => card && card.cityName && player1.cities[card.cityName]).map(card => ({
    ...player1.cities[card.cityName],
    cityName: card.cityName,
    playerIdx: 0
  }))
  const cities2 = (state2.currentBattleCities || []).filter(card => card && card.cityName && player2.cities[card.cityName]).map(card => ({
    ...player2.cities[card.cityName],
    cityName: card.cityName,
    playerIdx: 1
  }))

  // 检查城市遇到省会的情况
  for (const city1 of cities1) {
    for (const city2 of cities2) {
      if (city1.province === city2.province && city1.province) {
        const isCapital1 = city1.isCapital || city1.isProvincialCapital
        const isCapital2 = city2.isCapital || city2.isProvincialCapital

        // city1是省会，city2不是
        if (isCapital1 && !isCapital2) {
          return {
            cityName: city2.name,
            province: city1.province,
            toPlayer: player1.name,
            fromPlayerIdx: 1,
            toPlayerIdx: 0,
            cityName: city2.cityName
          }
        }

        // city2是省会，city1不是
        if (isCapital2 && !isCapital1) {
          return {
            cityName: city1.name,
            province: city2.province,
            toPlayer: player2.name,
            fromPlayerIdx: 0,
            toPlayerIdx: 1,
            cityName: city1.cityName
          }
        }
      }
    }
  }

  return null
}

/**
 * 计算总攻击力
 */
function calculateTotalAttack(player, battleCities, gameStore) {
  let total = 0

  for (const city of battleCities) {
    let power = city.currentHp || 0
    // Center city gets 2x attack
    if (city.name && city.name === player.centerCityName) {
      power *= 2
    }
    // 副中心制：攻击力×1.5
    if (gameStore && gameStore.subCenters && gameStore.subCenters[player.name] === city.name) {
      power = Math.floor(power * 1.5)
    }
    // 生于紫室：攻击力×2
    if (gameStore && gameStore.purpleChamber && gameStore.purpleChamber[player.name] === city.name) {
      power *= 2
    }
    total += power
  }

  return total
}

/**
 * 收集战斗结果数据（战斗计算后调用）
 * @param {Object} battleAnimationData - 战斗动画数据
 * @param {Object} roomData - 战斗后的房间数据
 * @returns {Object} 更新后的战斗动画数据
 */
export function updateBattleResults(battleAnimationData, roomData) {
  console.log('[BattleAnimationData] 更新战斗结果')

  const player1 = roomData.players[0]
  const player2 = roomData.players[1]

  const battleResults = {
    fatigued: [],
    hpChanges: [],
    destroyed: []
  }

  // 收集疲劳减半数据
  collectFatigueData(battleAnimationData, roomData, battleResults)

  // 收集HP变化数据
  collectHpChanges(battleAnimationData, player1, player2, battleResults)

  // 收集阵亡数据
  collectDestroyedCities(battleAnimationData, player1, player2, battleResults)

  battleAnimationData.battleResults = battleResults
  return battleAnimationData
}

/**
 * 收集疲劳减半数据
 */
function collectFatigueData(battleAnimationData, roomData, battleResults) {
  console.log('[BattleAnimationData] 收集疲劳减半数据')

  // 关键修复：使用fatigueData数组（由fatigueSystem记录），而不是检查city.fatigued标志
  // 因为prepareBattleAnimationData时HP已经减半，无法从HP判断疲劳
  if (!battleAnimationData.fatigueData || battleAnimationData.fatigueData.length === 0) {
    console.log('[BattleAnimationData] 本回合无疲劳城市')
    return
  }

  const player1 = roomData.players[0]
  const player2 = roomData.players[1]

  // 从fatigueData构建battleResults.fatigued数组
  battleAnimationData.fatigueData.forEach(fatigue => {
    // 确定是哪个玩家的城市
    const isPlayer1 = fatigue.playerName === player1.name
    const playerNum = isPlayer1 ? 1 : 2
    const playerData = isPlayer1 ? battleAnimationData.player1 : battleAnimationData.player2

    // 在动画数据中找到对应的城市位置
    // battleAnimationData.player1.cities是出战城市列表，不是完整城市列表
    // 需要通过cityName匹配
    const animCityIdx = playerData.cities.findIndex(c => c.cityName === fatigue.cityName)

    if (animCityIdx !== -1) {
      battleResults.fatigued.push({
        player: playerNum,
        cityName: animCityIdx,  // 动画数据中的索引，不是原始cityName
        hpBefore: fatigue.hpBefore,
        hpAfter: fatigue.hpAfter,
        streak: fatigue.streak
      })
      console.log(`[BattleAnimationData] 添加疲劳: player${playerNum} ${fatigue.cityName} (animIdx=${animCityIdx}, HP: ${Math.floor(fatigue.hpBefore)}→${Math.floor(fatigue.hpAfter)})`)

      // 同时设置城市的fatigued标志，用于CSS显示
      playerData.cities[animCityIdx].fatigued = true
    } else {
      console.warn(`[BattleAnimationData] 未在动画数据中找到疲劳城市: ${fatigue.cityName}`)
    }
  })

  console.log('[BattleAnimationData] 疲劳数据收集完成，数量:', battleResults.fatigued.length)
}

/**
 * 收集HP变化数据
 */
function collectHpChanges(battleAnimationData, player1, player2, battleResults) {
  // 比较战斗前后的HP
  battleAnimationData.player1.cities.forEach((city, idx) => {
    const actualCity = player1.cities[city.cityName]
    if (!actualCity) {
      console.warn(`[BattleAnimationData] collectHpChanges: player1城市${city.cityName}不存在（可能已被归顺转移）`)
      return
    }
    const hpChange = (actualCity.currentHp || 0) - (city.initialHp || 0)

    if (hpChange !== 0) {
      battleResults.hpChanges.push({
        player: 1,
        cityName: idx,
        change: hpChange,
        finalHp: actualCity.currentHp || 0
      })
    }
  })

  battleAnimationData.player2.cities.forEach((city, idx) => {
    const actualCity = player2.cities[city.cityName]
    if (!actualCity) {
      console.warn(`[BattleAnimationData] collectHpChanges: player2城市${city.cityName}不存在（可能已被归顺转移）`)
      return
    }
    const hpChange = (actualCity.currentHp || 0) - (city.initialHp || 0)

    if (hpChange !== 0) {
      battleResults.hpChanges.push({
        player: 2,
        cityName: idx,
        change: hpChange,
        finalHp: actualCity.currentHp || 0
      })
    }
  })
}

/**
 * 收集阵亡城市数据
 */
function collectDestroyedCities(battleAnimationData, player1, player2, battleResults) {
  battleAnimationData.player1.cities.forEach((city, idx) => {
    const actualCity = player1.cities[city.cityName]
    if (!actualCity) {
      console.warn(`[BattleAnimationData] collectDestroyedCities: player1城市${city.cityName}不存在（可能已被归顺转移）`)
      return
    }
    if (actualCity.currentHp <= 0 || actualCity.isAlive === false) {
      battleResults.destroyed.push({
        player: 1,
        cityName: idx,
        cityName: city.name
      })
    }
  })

  battleAnimationData.player2.cities.forEach((city, idx) => {
    const actualCity = player2.cities[city.cityName]
    if (!actualCity) {
      console.warn(`[BattleAnimationData] collectDestroyedCities: player2城市${city.cityName}不存在（可能已被归顺转移）`)
      return
    }
    if (actualCity.currentHp <= 0 || actualCity.isAlive === false) {
      battleResults.destroyed.push({
        player: 2,
        cityName: idx,
        cityName: city.name
      })
    }
  })
}
