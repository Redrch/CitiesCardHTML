/**
 * 战斗前检测系统
 * Pre-Battle Checks
 *
 * 参考 citycard_web.html:
 * - 晕头转向: lines 3946-4060
 * - 同省撤退/省会归顺: lines 4106-4300
 * - 波涛汹涌: lines 4455-4510, 6901-6954, 8978-9031
 */

import { useGameStore } from '../../stores/gameStore'
import { PROVINCE_MAP } from '../../data/cities'

/**
 * 获取城市的有效省份（考虑拔旗易帜）
 */
function getEffectiveProvince(gameStore, playerName, cityName) {
  const player = gameStore.players.find(p => p.name === playerName)
  if (!player || !player.cities[cityName]) return null

  const city = player.cities[cityName]

  // 检查拔旗易帜标记
  if (gameStore.changeFlagMark &&
      gameStore.changeFlagMark[playerName] &&
      gameStore.changeFlagMark[playerName][cityName]) {
    return gameStore.changeFlagMark[playerName][cityName].newProvince
  }

  // 使用PROVINCE_MAP查找城市所属省份
  const province = PROVINCE_MAP[city.name]
  return province ? province.name : null
}

/**
 * 获取城市的有效名称（考虑狐假虎威伪装）
 */
function getEffectiveName(gameStore, playerName, cityName) {
  const player = gameStore.players.find(p => p.name === playerName)
  if (!player || !player.cities[cityName]) return null

  const city = player.cities[cityName]

  // 检查狐假虎威伪装
  if (gameStore.disguisedCities &&
      gameStore.disguisedCities[playerName] &&
      gameStore.disguisedCities[playerName][cityName]) {
    const disguise = gameStore.disguisedCities[playerName][cityName]
    if (disguise.active && disguise.fakeHp > 0) {
      return disguise.fakeName
    }
  }

  return city.name
}

/**
 * 检查是否是省会城市
 */
function isCapitalCity(cityName) {
  // 省会列表（参考 citycard_web.html）
  const capitals = [
    '哈尔滨市', '长春市', '沈阳市', '呼和浩特市', '石家庄市', '太原市', '济南市',
    '郑州市', '西安市', '兰州市', '银川市', '西宁市', '乌鲁木齐市', '拉萨市',
    '南京市', '合肥市', '杭州市', '南昌市', '福州市', '武汉市', '长沙市',
    '广州市', '南宁市', '海口市', '成都市', '贵阳市', '昆明市', '台北市'
  ]
  return capitals.includes(cityName)
}

/**
 * 获取省会/首府名称
 */
function getCapitalTerm(provinceName) {
  const autonomousRegions = ['内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区']
  return autonomousRegions.includes(provinceName) ? '首府' : '省会'
}

/**
 * 检查晕头转向效果
 * 参考 citycard_web.html lines 3946-4060
 *
 * @param {Object} gameStore - 游戏状态
 * @param {Object} gameState - Firebase游戏状态
 * @param {string} mode - 游戏模式
 * @returns {boolean} 是否触发了撤退
 */
export function checkDizzyEffect(gameStore, gameState, mode) {
  if (!gameStore.dizzy || Object.keys(gameStore.dizzy).length === 0) {
    return false
  }

  let retreatTriggered = false

  for (const playerName of Object.keys(gameStore.dizzy)) {
    const cfg = gameStore.dizzy[playerName]
    if (!cfg || !cfg.target) continue

    const caster = gameStore.players.find(p => p.name === playerName)
    const target = gameStore.players.find(p => p.name === cfg.target)
    if (!caster || !target) continue

    // 获取出战城市
    const casterState = gameState.playerStates[playerName]
    const targetState = gameState.playerStates[cfg.target]
    if (!casterState || !targetState) continue

    // 关键修复：确保currentBattleCities是数组（Firebase可能返回对象）
    const casterBattleCities = Array.isArray(casterState.currentBattleCities)
      ? casterState.currentBattleCities
      : (casterState.currentBattleCities ? Object.values(casterState.currentBattleCities) : [])

    const targetBattleCities = Array.isArray(targetState.currentBattleCities)
      ? targetState.currentBattleCities
      : (targetState.currentBattleCities ? Object.values(targetState.currentBattleCities) : [])

    const casterCards = casterBattleCities.map(c => c.cityName)
    const targetCards = targetBattleCities.map(c => c.cityName)

    // 过滤掉不能被晕头转向影响的城市
    const centerCaster = caster.centerCityName
    const centerTarget = target.centerCityName

    const casterValidCards = casterCards.filter(cityName => {
      if (cityName === centerCaster) return false  // 中心城市
      if (gameStore.hasIronShield(playerName, cityName)) return false  // 钢铁城市
      if (gameStore.anchored[playerName] && gameStore.anchored[playerName][cityName]) return false  // 定海神针
      if (gameStore.isInCautiousSet(playerName, cityName)) return false  // 谨慎交换集合
      return true
    })

    const targetValidCards = targetCards.filter(cityName => {
      if (cityName === centerTarget) return false
      if (gameStore.hasIronShield(cfg.target, cityName)) return false
      if (gameStore.anchored[cfg.target] && gameStore.anchored[cfg.target][cityName]) return false
      if (gameStore.isInCautiousSet(cfg.target, cityName)) return false
      return true
    })

    // 没有可交换的城市
    if (casterValidCards.length === 0 && targetValidCards.length === 0) {
      if (casterCards.length > 0 || targetCards.length > 0) {
        gameStore.addLog(`>>> (晕头转向) 技能使用失败：所有出战城市都是中心城市、钢铁城市或被定海神针保护，返还10金币`)
        caster.gold = (caster.gold || 0) + 10
      } else {
        gameStore.addLog(`>>> (晕头转向) 技能使用失败：双方都未出战，金币不返还`)
      }
      continue
    }

    // 有可交换的城市 -> 互换后撤回
    if (casterValidCards.length > 0 && targetValidCards.length > 0) {
      const minLen = Math.min(casterValidCards.length, targetValidCards.length)

      // 交换城市
      for (let i = 0; i < minLen; i++) {
        const temp = caster.cities[casterValidCards[i]]
        caster.cities[casterValidCards[i]] = target.cities[targetValidCards[i]]
        target.cities[targetValidCards[i]] = temp

        // 注意：initialCities 现在按城市名称追踪，需要交换
        if (gameStore.initialCities) {
          if (!gameStore.initialCities[playerName]) gameStore.initialCities[playerName] = {}
          if (!gameStore.initialCities[cfg.target]) gameStore.initialCities[cfg.target] = {}

          const tempInitial = gameStore.initialCities[playerName][casterValidCards[i]]
          gameStore.initialCities[playerName][casterValidCards[i]] = gameStore.initialCities[cfg.target][targetValidCards[i]]
          gameStore.initialCities[cfg.target][targetValidCards[i]] = tempInitial
        }
      }

      // 清空出战城市（撤回）
      casterState.currentBattleCities = []
      targetState.currentBattleCities = []

      gameStore.addLog(`>>> (晕头转向) ${playerName}和${cfg.target}的出战城市互换后撤回`)
      retreatTriggered = true
    }
  }

  return retreatTriggered
}

/**
 * 检查同省撤退和省会归顺
 * 参考 citycard_web.html lines 4106-4300
 *
 * @param {Object} gameStore - 游戏状态
 * @param {Object} gameState - Firebase游戏状态
 * @param {Array} players - 玩家列表
 * @returns {boolean} 是否触发了撤退
 */
export function checkProvinceRules(gameStore, gameState, players) {
  if (players.length !== 2) {
    return false  // 仅2P模式
  }

  // 关键修复：确保gameState和playerStates存在
  if (!gameState || !gameState.playerStates) {
    console.warn('[PreBattleChecks] gameState或playerStates不存在，跳过省份规则检查')
    return false
  }

  const player0 = players[0]
  const player1 = players[1]

  const state0 = gameState.playerStates[player0.name]
  const state1 = gameState.playerStates[player1.name]

  if (!state0 || !state1) return false

  // 关键修复：确保currentBattleCities是数组（Firebase可能返回对象）
  const battleCities0 = Array.isArray(state0.currentBattleCities)
    ? state0.currentBattleCities
    : (state0.currentBattleCities ? Object.values(state0.currentBattleCities) : [])

  const battleCities1 = Array.isArray(state1.currentBattleCities)
    ? state1.currentBattleCities
    : (state1.currentBattleCities ? Object.values(state1.currentBattleCities) : [])

  const sel0 = battleCities0.map(c => c.cityName)
  const sel1 = battleCities1.map(c => c.cityName)

  // 关键修复：在函数开头就保存完整的城市对象信息，避免后续转移时数据丢失
  const player0CityObjects = sel0.map(cityName => {
    const city = player0.cities[cityName]
    return {
      name: city.name,
      province: city.province,
      isCapital: city.isCapital || false,
      isProvincialCapital: city.isProvincialCapital || false,
      currentHp: city.currentHp,
      hp: city.hp,
      cityName: cityName
    }
  })

  const player1CityObjects = sel1.map(cityName => {
    const city = player1.cities[cityName]
    return {
      name: city.name,
      province: city.province,
      isCapital: city.isCapital || false,
      isProvincialCapital: city.isProvincialCapital || false,
      currentHp: city.currentHp,
      hp: city.hp,
      cityName: cityName
    }
  })

  // 统计各省份的城市名称
  const provinceMap = [{}, {}]

  for (let p = 0; p < 2; p++) {
    const player = players[p]
    const sel = p === 0 ? sel0 : sel1

    for (const cityName of sel) {
      const prov = getEffectiveProvince(gameStore, player.name, cityName)
      if (prov && prov !== '直辖市和特区') {
        if (!provinceMap[p][prov]) provinceMap[p][prov] = []
        provinceMap[p][prov].push(cityName)
      }
    }
  }

  // 检查省会归顺
  for (let attacker = 0; attacker < 2; attacker++) {
    const defender = 1 - attacker
    const attackerPlayer = players[attacker]
    const defenderPlayer = players[defender]

    for (const prov in provinceMap[attacker]) {
      const attackerCities = provinceMap[attacker][prov]
      const defenderCities = provinceMap[defender][prov] || []

      if (defenderCities.length === 0) continue

      // 检查攻击方是否有省会
      const hasCapital = attackerCities.some(cityName => {
        // 检查是否被倒反天罡影响
        if (gameStore.reversedCapitals &&
            gameStore.reversedCapitals[attackerPlayer.name] &&
            gameStore.reversedCapitals[attackerPlayer.name][cityName]) {
          return false
        }

        const effectiveName = getEffectiveName(gameStore, attackerPlayer.name, cityName)
        if (isCapitalCity(effectiveName)) return true

        // 检查代行省权（暂时跳过，较复杂）
        return false
      })

      if (!hasCapital) continue

      // 检查双方是否都有真省会
      const attackerHasRealCapital = attackerCities.some(cityName => {
        if (gameStore.reversedCapitals &&
            gameStore.reversedCapitals[attackerPlayer.name] &&
            gameStore.reversedCapitals[attackerPlayer.name][cityName]) {
          return false
        }
        const effectiveName = getEffectiveName(gameStore, attackerPlayer.name, cityName)
        return isCapitalCity(effectiveName)
      })

      const defenderHasRealCapital = defenderCities.some(cityName => {
        if (gameStore.reversedCapitals &&
            gameStore.reversedCapitals[defenderPlayer.name] &&
            gameStore.reversedCapitals[defenderPlayer.name][cityName]) {
          return false
        }
        const effectiveName = getEffectiveName(gameStore, defenderPlayer.name, cityName)
        return isCapitalCity(effectiveName)
      })

      // 如果双方都有真省会，跳过归顺（留给同省撤退处理）
      if (attackerHasRealCapital && defenderHasRealCapital) {
        continue  // 不在这里处理，等待后面的同省撤退检查
      }

      // 省会归顺：防守方的该省城市归顺
      if (attackerHasRealCapital && !defenderHasRealCapital) {
        const transferredCities = []

        // 关键修复Bug1: 收集双方所有出战城市名称
        const allAttackerCityNames = []
        const allDefenderCityNames = []

        // 关键修复：真正实现城市转移
        const citiesToTransfer = []  // 记录需要转移的城市名称和对象

        for (const cityName of defenderCities) {
          const city = defenderPlayer.cities[cityName]
          const effectiveName = getEffectiveName(gameStore, defenderPlayer.name, cityName)

          // 检查狐假虎威伪装
          if (gameStore.disguisedCities &&
              gameStore.disguisedCities[defenderPlayer.name] &&
              gameStore.disguisedCities[defenderPlayer.name][cityName]) {
            const disguise = gameStore.disguisedCities[defenderPlayer.name][cityName]
            if (disguise.active) {
              // 狐假虎威被识破，自毁
              city.currentHp = 0
              city.isAlive = false
              if (!disguise.paid) {
                defenderPlayer.gold = Math.max(0, (defenderPlayer.gold || 0) - 9)
                disguise.paid = true
              }
              disguise.active = false
              gameStore.addLog(`  (省会归顺) ${defenderPlayer.name}的狐假虎威伪装${disguise.fakeName}被识破，实为${city.name}，自毁并扣9金币`)
              continue
            }
          }

          // 归顺到攻击方 - 记录需要转移的城市
          transferredCities.push(effectiveName)
          citiesToTransfer.push({ cityName: cityName, city: { ...city } })
        }

        // 执行真正的城市转移（对象结构：直接删除和添加键值对）
        if (citiesToTransfer.length > 0) {
          console.log(`[PreBattleChecks] 开始转移${citiesToTransfer.length}个城市从${defenderPlayer.name}到${attackerPlayer.name}`)

          // 1. 将城市添加到攻击方
          citiesToTransfer.forEach(({ cityName, city }) => {
            attackerPlayer.cities[cityName] = city
            console.log(`[PreBattleChecks] 已将${city.name}添加到${attackerPlayer.name}的城市列表`)
          })

          // 2. 从防守方移除城市
          citiesToTransfer.forEach(({ cityName }) => {
            delete defenderPlayer.cities[cityName]
            console.log(`[PreBattleChecks] 已从${defenderPlayer.name}移除城市${cityName}`)
          })

          // 3. 更新防守方的centerCityName（如果被转移的城市中包含中心城市）
          const transferredNames = citiesToTransfer.map(c => c.cityName)
          if (transferredNames.includes(defenderPlayer.centerCityName)) {
            console.warn(`[PreBattleChecks] ${defenderPlayer.name}的中心城市被转移，重置为第一个存活城市`)
            const aliveCities = Object.keys(defenderPlayer.cities).filter(name => {
              const c = defenderPlayer.cities[name]
              return c && c.isAlive !== false
            })
            defenderPlayer.centerCityName = aliveCities.length > 0 ? aliveCities[0] : null
          }

          // 4. 同步initialCities（按城市名称转移）
          if (gameStore.initialCities) {
            if (!gameStore.initialCities[attackerPlayer.name]) {
              gameStore.initialCities[attackerPlayer.name] = {}
            }
            if (!gameStore.initialCities[defenderPlayer.name]) {
              gameStore.initialCities[defenderPlayer.name] = {}
            }

            // 从防守方转移到攻击方（按城市名称）
            citiesToTransfer.forEach(({ cityName }) => {
              if (gameStore.initialCities[defenderPlayer.name][cityName]) {
                // 转移初始城市数据
                gameStore.initialCities[attackerPlayer.name][cityName] =
                  gameStore.initialCities[defenderPlayer.name][cityName]
                delete gameStore.initialCities[defenderPlayer.name][cityName]
              }
            })
          }

          // 5. 关键修复Bug2（疲劳）：同步streaks（疲劳记录）- 使用城市名称
          const attackerGameStorePlayer = gameStore.players.find(p => p.name === attackerPlayer.name)
          const defenderGameStorePlayer = gameStore.players.find(p => p.name === defenderPlayer.name)

          if (attackerGameStorePlayer && defenderGameStorePlayer) {
            // 确保streaks对象存在
            if (!attackerGameStorePlayer.streaks) attackerGameStorePlayer.streaks = {}
            if (!defenderGameStorePlayer.streaks) defenderGameStorePlayer.streaks = {}

            citiesToTransfer.forEach(({ cityName }) => {
              if (defenderGameStorePlayer.streaks[cityName]) {
                // 转移streak记录
                attackerGameStorePlayer.streaks[cityName] = defenderGameStorePlayer.streaks[cityName]
                console.log(`[PreBattleChecks] 转移疲劳记录: ${defenderPlayer.name}[${cityName}] -> ${attackerPlayer.name}[${cityName}], streak=${attackerGameStorePlayer.streaks[cityName]}`)

                // 从防守方删除这个streak记录
                delete defenderGameStorePlayer.streaks[cityName]
              }
            })
          }

          console.log(`[PreBattleChecks] 城市转移完成：${attackerPlayer.name}现有${Object.keys(attackerPlayer.cities).length}个城市，${defenderPlayer.name}现有${Object.keys(defenderPlayer.cities).length}个城市`)
        }

        // 关键修复Bug1: 标记所有出战城市为已知（双向）
        // 攻击方的所有出战城市被防守方知道
        sel0.forEach(cityName => {
          const effectiveName = getEffectiveName(gameStore, player0.name, cityName)
          allAttackerCityNames.push(effectiveName)
          // 参数顺序：setCityKnown(拥有者, 城市名称, 观察者)
          if (attacker === 0) {
            // player0的城市被player1知道
            gameStore.setCityKnown(player0.name, cityName, player1.name)
          } else {
            // player1的城市被player0知道
            gameStore.setCityKnown(player1.name, cityName, player0.name)
          }
        })

        sel1.forEach(cityName => {
          const effectiveName = getEffectiveName(gameStore, player1.name, cityName)
          allDefenderCityNames.push(effectiveName)
          // 参数顺序：setCityKnown(拥有者, 城市名称, 观察者)
          if (attacker === 1) {
            // player1的城市被player0知道
            gameStore.setCityKnown(player1.name, cityName, player0.name)
          } else {
            // player0的城市被player1知道
            gameStore.setCityKnown(player0.name, cityName, player1.name)
          }
        })

        if (transferredCities.length > 0) {
          const capitalTerm = getCapitalTerm(prov)

          // 修复Bug1: 日志中显示双方所有出战城市名称
          const attackerCities = attacker === 0 ? allAttackerCityNames : allDefenderCityNames
          const defenderCities = attacker === 0 ? allDefenderCityNames : allAttackerCityNames

          gameStore.addLog(`>>> (${capitalTerm}归顺) ${attackerPlayer.name}出战了${prov}${capitalTerm}（出战城市：${attackerCities.join('、')}），${defenderPlayer.name}的${prov}城市${transferredCities.join('、')}归顺（${defenderPlayer.name}所有出战城市：${defenderCities.join('、')}）`)

          // 关键修复Bug2+Bug5: 使用预先保存的完整城市对象数据
          const attackerCityObjects = attacker === 0 ? player0CityObjects : player1CityObjects
          const defenderCityObjects = attacker === 0 ? player1CityObjects : player0CityObjects

          const specialEvent = {
            type: 'surrender',
            round: gameState.currentRound,
            message: `${attackerPlayer.name}的${prov}${capitalTerm}出战，${defenderPlayer.name}的${transferredCities.join('、')}归顺`,
            province: prov,
            attackerPlayer: attackerPlayer.name,
            defenderPlayer: defenderPlayer.name,
            attackerCities: attackerCities,
            defenderCities: defenderCities,
            surrenderedCities: transferredCities,
            attackerCityObjects: attackerCityObjects,
            defenderCityObjects: defenderCityObjects
          }

          gameState.specialEventThisRound = specialEvent
          gameStore.specialEventThisRound = specialEvent  // 同时保存到gameStore供战斗计算使用
        }

        // 关键修复：在清空currentBattleCities之前手动更新streak（使用城市名称）
        const attackerGameStorePlayer = gameStore.players.find(p => p.name === attackerPlayer.name)
        const defenderGameStorePlayer = gameStore.players.find(p => p.name === defenderPlayer.name)

        if (attackerGameStorePlayer && defenderGameStorePlayer) {
          // 确保streaks对象存在
          if (!attackerGameStorePlayer.streaks) attackerGameStorePlayer.streaks = {}
          if (!defenderGameStorePlayer.streaks) defenderGameStorePlayer.streaks = {}

          const attackerState = gameState.playerStates[attackerPlayer.name]
          const defenderState = gameState.playerStates[defenderPlayer.name]

          // 关键修复：检查playerState是否存在
          if (!attackerState || !defenderState) {
            console.error('[PreBattleChecks] playerState不存在，跳过streak累积')
            console.error('[PreBattleChecks] attackerState:', attackerState)
            console.error('[PreBattleChecks] defenderState:', defenderState)
            return true
          }

          // 关键修复：确保currentBattleCities是数组
          const attackerBattleCities = Array.isArray(attackerState.currentBattleCities)
            ? attackerState.currentBattleCities
            : (attackerState.currentBattleCities ? Object.values(attackerState.currentBattleCities) : [])

          const defenderBattleCities = Array.isArray(defenderState.currentBattleCities)
            ? defenderState.currentBattleCities
            : (defenderState.currentBattleCities ? Object.values(defenderState.currentBattleCities) : [])

          console.log(`[PreBattleChecks] 归顺streak累积 - 攻击方出战城市数:`, attackerBattleCities.length)
          console.log(`[PreBattleChecks] 归顺streak累积 - 防守方出战城市数:`, defenderBattleCities.length)

          // 攻击方出战城市streak +1（使用城市名称）
          attackerBattleCities.forEach(card => {
            const cityName = card.cityName
            const oldStreak = attackerGameStorePlayer.streaks[cityName] || 0
            attackerGameStorePlayer.streaks[cityName] = oldStreak + 1
            console.log(`[PreBattleChecks] 归顺：${attackerPlayer.name}的城市${cityName} streak: ${oldStreak} → ${attackerGameStorePlayer.streaks[cityName]}`)
          })

          // 防守方出战城市streak +1
          defenderBattleCities.forEach(card => {
            const cityName = card.cityName
            const oldStreak = defenderGameStorePlayer.streaks[cityName] || 0
            defenderGameStorePlayer.streaks[cityName] = oldStreak + 1
            console.log(`[PreBattleChecks] 归顺：${defenderPlayer.name}的城市${cityName} streak: ${oldStreak} → ${defenderGameStorePlayer.streaks[cityName]}`)
          })

          // 关键修复Bug1: 同时更新players数组中的streak
          attackerPlayer.streaks = { ...attackerGameStorePlayer.streaks }
          defenderPlayer.streaks = { ...defenderGameStorePlayer.streaks }
          console.log(`[PreBattleChecks] 归顺：同步streak到players数组`)
          console.log(`[PreBattleChecks] ${attackerPlayer.name} streaks:`, attackerPlayer.streaks)
          console.log(`[PreBattleChecks] ${defenderPlayer.name} streaks:`, defenderPlayer.streaks)

          // 清空双方出战城市
          attackerState.currentBattleCities = []
          defenderState.currentBattleCities = []
        }

        return true
      }
    }
  }

  // 检查同省撤退：双方都有同一个省的城市（不管有无省会）
  for (const prov in provinceMap[0]) {
    if (provinceMap[1][prov] && provinceMap[1][prov].length > 0) {
      const p0ProvCities = provinceMap[0][prov]
      const p1ProvCities = provinceMap[1][prov]

      const p0ProvNames = p0ProvCities.map(cityName => getEffectiveName(gameStore, player0.name, cityName))
      const p1ProvNames = p1ProvCities.map(cityName => getEffectiveName(gameStore, player1.name, cityName))

      const allP0Names = sel0.map(cityName => getEffectiveName(gameStore, player0.name, cityName))
      const allP1Names = sel1.map(cityName => getEffectiveName(gameStore, player1.name, cityName))

      // 关键修复Bug1: 标记所有出战城市为已知（双向）
      // 参数顺序：setCityKnown(拥有者, 城市名称, 观察者)
      sel0.forEach(cityName => {
        // player0的城市被player1知道
        gameStore.setCityKnown(player0.name, cityName, player1.name)
      })

      sel1.forEach(cityName => {
        // player1的城市被player0知道
        gameStore.setCityKnown(player1.name, cityName, player0.name)
      })

      // 关键修复：在清空currentBattleCities之前手动更新streak（使用城市名称）
      const player0GameStore = gameStore.players.find(p => p.name === player0.name)
      const player1GameStore = gameStore.players.find(p => p.name === player1.name)

      if (player0GameStore && player1GameStore) {
        // 确保streaks对象存在
        if (!player0GameStore.streaks) player0GameStore.streaks = {}
        if (!player1GameStore.streaks) player1GameStore.streaks = {}

        // player0出战城市streak +1（使用城市名称）
        sel0.forEach(cityName => {
          const city = player0.cities[cityName]
          const oldStreak = player0GameStore.streaks[cityName] || 0
          player0GameStore.streaks[cityName] = oldStreak + 1
          console.log(`[PreBattleChecks] 同省撤退：${player0.name}的城市[${cityName}] ${city?.name} streak: ${oldStreak} → ${player0GameStore.streaks[cityName]}`)
        })

        // player1出战城市streak +1
        sel1.forEach(cityName => {
          const city = player1.cities[cityName]
          const oldStreak = player1GameStore.streaks[cityName] || 0
          player1GameStore.streaks[cityName] = oldStreak + 1
          console.log(`[PreBattleChecks] 同省撤退：${player1.name}的城市[${cityName}] ${city?.name} streak: ${oldStreak} → ${player1GameStore.streaks[cityName]}`)
        })

        // 清空未出战城市的streak
        Object.keys(player0.cities).forEach(cityName => {
          if (!sel0.includes(cityName)) {
            player0GameStore.streaks[cityName] = 0
          }
        })

        Object.keys(player1.cities).forEach(cityName => {
          if (!sel1.includes(cityName)) {
            player1GameStore.streaks[cityName] = 0
          }
        })

        // 关键修复Bug1: 同时更新players数组中的streak
        player0.streaks = { ...player0GameStore.streaks }
        player1.streaks = { ...player1GameStore.streaks }
        console.log(`[PreBattleChecks] 同省撤退：同步streak到players数组`)
        console.log(`[PreBattleChecks] ${player0.name} streaks:`, player0.streaks)
        console.log(`[PreBattleChecks] ${player1.name} streaks:`, player1.streaks)
      }

      // 双方所有出战城市都撤退
      state0.currentBattleCities = []
      state1.currentBattleCities = []

      gameStore.addLog(`>>> (同省撤退) ${prov}出现在双方阵营，${player0.name}的${p0ProvNames.join('、')}和${player1.name}的${p1ProvNames.join('、')}触发同省撤退，双方所有出战城市撤退（${player0.name}：${allP0Names.join('、')}；${player1.name}：${allP1Names.join('、')}）`)

      // 关键修复Bug2+Bug5: 保存特殊事件到gameState和gameStore
      const specialEvent = {
        type: 'retreat',
        round: gameState.currentRound,
        message: `${prov}发生同省撤退`,
        province: prov,
        player1: player0.name,
        player2: player1.name,
        player1Cities: allP0Names,
        player2Cities: allP1Names,
        player1ProvinceCities: p0ProvNames,
        player2ProvinceCities: p1ProvNames,
        player1CityObjects: player0CityObjects,
        player2CityObjects: player1CityObjects
      }

      gameState.specialEventThisRound = specialEvent
      gameStore.specialEventThisRound = specialEvent  // 同时保存到gameStore供战斗计算使用

      return true
    }
  }

  return false
}

/**
 * 检查波涛汹涌效果
 * 参考 citycard_web.html lines 4455-4510
 *
 * @param {Object} gameStore - 游戏状态
 * @param {Object} gameState - Firebase游戏状态
 */
export function checkBtxxEffect(gameStore, gameState) {
  if (!gameStore.btxx || Object.keys(gameStore.btxx).length === 0) {
    return
  }

  // 沿海城市列表（参考 citycard_web.html）
  const coastalCities = [
    '大连市', '秦皇岛市', '唐山市', '天津市', '东营市', '烟台市', '威海市',
    '青岛市', '日照市', '连云港市', '盐城市', '南通市', '上海市', '宁波市',
    '温州市', '福州市', '厦门市', '泉州市', '汕头市', '深圳市', '珠海市',
    '广州市', '湛江市', '北海市', '海口市', '三亚市', '台北市', '高雄市',
    '香港', '澳门'
  ]

  for (const casterName of Object.keys(gameStore.btxx)) {
    const cfg = gameStore.btxx[casterName]
    if (!cfg || !cfg.target || cfg.appliedThisRound) continue

    const targetPlayer = gameStore.players.find(p => p.name === cfg.target)
    if (!targetPlayer) continue

    const targetState = gameState.playerStates[cfg.target]
    if (!targetState || !targetState.currentBattleCities) continue

    // 关键修复：确保currentBattleCities是数组（Firebase可能返回对象）
    const battleCities = Array.isArray(targetState.currentBattleCities)
      ? targetState.currentBattleCities
      : Object.values(targetState.currentBattleCities)

    // 检查出战城市是否包含沿海城市
    for (const battleCity of battleCities) {
      const cityName = battleCity.cityName
      const city = targetPlayer.cities[cityName]
      if (!city || !city.isAlive) continue

      if (!coastalCities.includes(city.name)) continue

      // 检查中心城市的海市蜃楼拦截（75%概率）
      const isCenter = cityName === targetPlayer.centerCityName
      if (isCenter && gameStore.checkMirageBlock &&
          gameStore.checkMirageBlock(cfg.target, `${casterName}的波涛汹涌`)) {
        gameStore.addLog(`  (波涛汹涌) ${cfg.target}的海市蜃楼拦截了伤害`)
        continue
      }

      // 检查钢铁城市
      if (gameStore.hasIronShield(cfg.target, cityName)) {
        gameStore.addLog(`  (波涛汹涌) ${cfg.target}的${city.name}为钢铁城市，免疫波涛汹涌`)
        continue
      }

      // 检查保护罩
      if (gameStore.hasProtection(cfg.target, cityName)) {
        gameStore.consumeProtection(cfg.target, cityName)
        gameStore.addLog(`  (波涛汹涌) ${cfg.target}的${city.name}有保护罩，保护罩破裂，未减半`)
        continue
      }

      // HP减半
      const before = city.currentHp
      city.currentHp = Math.floor(city.currentHp / 2)
      gameStore.addLog(`  (波涛汹涌) ${cfg.target}的${city.name}本回合出战且为沿海城市，战斗前HP减半：${Math.floor(before)} -> ${Math.floor(city.currentHp)}`)
    }

    cfg.appliedThisRound = true
  }
}

/**
 * 执行所有战斗前检测
 *
 * @param {Object} gameStore - 游戏状态
 * @param {Object} gameState - Firebase游戏状态
 * @param {Array} players - 玩家列表
 * @param {string} mode - 游戏模式
 * @returns {boolean} 是否应该跳过战斗（永远返回false，因为这些都是正常回合）
 */
export function executePreBattleChecks(gameStore, gameState, players, mode) {
  console.log('[PreBattleChecks] 开始执行战斗前检测')

  // 1. 晕头转向检测
  // 关键修复：晕头转向只是清空出战城市，不跳过战斗，金币照常+3
  checkDizzyEffect(gameStore, gameState, mode)

  // 2. 同省撤退/省会归顺检测（所有模式都需要检查）
  // 关键修复：同省撤退/归顺只是清空出战城市，不跳过战斗，金币照常+3
  checkProvinceRules(gameStore, gameState, players)

  // 3. 波涛汹涌HP减半
  checkBtxxEffect(gameStore, gameState)

  console.log('[PreBattleChecks] 战斗前检测完成，继续正常战斗流程')
  return false  // 永远不跳过战斗，这些都是正常回合
}
