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

/**
 * 获取城市的有效省份（考虑拔旗易帜）
 */
function getEffectiveProvince(gameStore, playerName, cityIdx) {
  const player = gameStore.players.find(p => p.name === playerName)
  if (!player || !player.cities[cityIdx]) return null

  const city = player.cities[cityIdx]

  // 检查拔旗易帜标记
  if (gameStore.changeFlagMark &&
      gameStore.changeFlagMark[playerName] &&
      gameStore.changeFlagMark[playerName][cityIdx]) {
    return gameStore.changeFlagMark[playerName][cityIdx].newProvince
  }

  return city.province
}

/**
 * 获取城市的有效名称（考虑狐假虎威伪装）
 */
function getEffectiveName(gameStore, playerName, cityIdx) {
  const player = gameStore.players.find(p => p.name === playerName)
  if (!player || !player.cities[cityIdx]) return null

  const city = player.cities[cityIdx]

  // 检查狐假虎威伪装
  if (gameStore.disguisedCities &&
      gameStore.disguisedCities[playerName] &&
      gameStore.disguisedCities[playerName][cityIdx]) {
    const disguise = gameStore.disguisedCities[playerName][cityIdx]
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

    const casterCards = (casterState.currentBattleCities || []).map(c => c.cityIdx)
    const targetCards = (targetState.currentBattleCities || []).map(c => c.cityIdx)

    // 过滤掉不能被晕头转向影响的城市
    const centerCaster = caster.centerIndex ?? 0
    const centerTarget = target.centerIndex ?? 0

    const casterValidCards = casterCards.filter(ci => {
      if (ci === centerCaster) return false  // 中心城市
      if (gameStore.hasIronShield(playerName, ci)) return false  // 钢铁城市
      if (gameStore.anchored[playerName] && gameStore.anchored[playerName][ci]) return false  // 定海神针
      if (gameStore.isInCautiousSet(playerName, ci)) return false  // 谨慎交换集合
      return true
    })

    const targetValidCards = targetCards.filter(ci => {
      if (ci === centerTarget) return false
      if (gameStore.hasIronShield(cfg.target, ci)) return false
      if (gameStore.anchored[cfg.target] && gameStore.anchored[cfg.target][ci]) return false
      if (gameStore.isInCautiousSet(cfg.target, ci)) return false
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

        // 同步initialCities
        if (gameStore.initialCities[playerName] && gameStore.initialCities[cfg.target]) {
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

  const player0 = players[0]
  const player1 = players[1]

  const state0 = gameState.playerStates[player0.name]
  const state1 = gameState.playerStates[player1.name]

  if (!state0 || !state1) return false

  const sel0 = (state0.currentBattleCities || []).map(c => c.cityIdx)
  const sel1 = (state1.currentBattleCities || []).map(c => c.cityIdx)

  // 统计各省份的城市索引
  const provinceMap = [{}, {}]

  for (let p = 0; p < 2; p++) {
    const player = players[p]
    const sel = p === 0 ? sel0 : sel1

    for (const ci of sel) {
      const prov = getEffectiveProvince(gameStore, player.name, ci)
      if (prov && prov !== '直辖市和特区') {
        if (!provinceMap[p][prov]) provinceMap[p][prov] = []
        provinceMap[p][prov].push(ci)
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
      const hasCapital = attackerCities.some(ci => {
        // 检查是否被倒反天罡影响
        if (gameStore.reversedCapitals &&
            gameStore.reversedCapitals[attackerPlayer.name] &&
            gameStore.reversedCapitals[attackerPlayer.name][ci]) {
          return false
        }

        const cityName = getEffectiveName(gameStore, attackerPlayer.name, ci)
        if (isCapitalCity(cityName)) return true

        // 检查代行省权（暂时跳过，较复杂）
        return false
      })

      if (!hasCapital) continue

      // 检查双方是否都有真省会
      const attackerHasRealCapital = attackerCities.some(ci => {
        if (gameStore.reversedCapitals &&
            gameStore.reversedCapitals[attackerPlayer.name] &&
            gameStore.reversedCapitals[attackerPlayer.name][ci]) {
          return false
        }
        const cityName = getEffectiveName(gameStore, attackerPlayer.name, ci)
        return isCapitalCity(cityName)
      })

      const defenderHasRealCapital = defenderCities.some(ci => {
        if (gameStore.reversedCapitals &&
            gameStore.reversedCapitals[defenderPlayer.name] &&
            gameStore.reversedCapitals[defenderPlayer.name][ci]) {
          return false
        }
        const cityName = getEffectiveName(gameStore, defenderPlayer.name, ci)
        return isCapitalCity(cityName)
      })

      // 如果双方都有真省会，跳过归顺（留给同省撤退处理）
      if (attackerHasRealCapital && defenderHasRealCapital) {
        // 同省撤退：双方撤回
        const attackerState = gameState.playerStates[attackerPlayer.name]
        const defenderState = gameState.playerStates[defenderPlayer.name]

        const allAttackerNames = attackerCities.map(ci => getEffectiveName(gameStore, attackerPlayer.name, ci))
        const allDefenderNames = defenderCities.map(ci => getEffectiveName(gameStore, defenderPlayer.name, ci))

        attackerState.currentBattleCities = attackerState.currentBattleCities.filter(c =>
          !attackerCities.includes(c.cityIdx)
        )
        defenderState.currentBattleCities = defenderState.currentBattleCities.filter(c =>
          !defenderCities.includes(c.cityIdx)
        )

        const capitalTerm = getCapitalTerm(prov)
        gameStore.addLog(`>>> (同省撤退) ${attackerPlayer.name}和${defenderPlayer.name}同时出战了${prov}${capitalTerm}，双方所有${prov}城市撤退（${attackerPlayer.name}：${allAttackerNames.join('、')}；${defenderPlayer.name}：${allDefenderNames.join('、')}）`)

        return true
      }

      // 省会归顺：防守方的该省城市归顺
      if (attackerHasRealCapital && !defenderHasRealCapital) {
        const transferredCities = []

        for (const ci of defenderCities) {
          const city = defenderPlayer.cities[ci]
          const effectiveName = getEffectiveName(gameStore, defenderPlayer.name, ci)

          // 检查狐假虎威伪装
          if (gameStore.disguisedCities &&
              gameStore.disguisedCities[defenderPlayer.name] &&
              gameStore.disguisedCities[defenderPlayer.name][ci]) {
            const disguise = gameStore.disguisedCities[defenderPlayer.name][ci]
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

          // 归顺到攻击方
          transferredCities.push(effectiveName)
          // 暂时标记HP为0（简化处理，完整实现需要转移城市）
          city.currentHp = 0
          city.isAlive = false
        }

        if (transferredCities.length > 0) {
          const capitalTerm = getCapitalTerm(prov)
          gameStore.addLog(`>>> (${capitalTerm}归顺) ${attackerPlayer.name}出战了${prov}${capitalTerm}，${defenderPlayer.name}的${prov}城市${transferredCities.join('、')}归顺`)
        }

        // 清空双方出战城市
        const attackerState = gameState.playerStates[attackerPlayer.name]
        const defenderState = gameState.playerStates[defenderPlayer.name]
        attackerState.currentBattleCities = []
        defenderState.currentBattleCities = []

        return true
      }
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

    // 检查出战城市是否包含沿海城市
    for (const battleCity of targetState.currentBattleCities) {
      const cityIdx = battleCity.cityIdx
      const city = targetPlayer.cities[cityIdx]
      if (!city || !city.isAlive) continue

      const cityName = city.name
      if (!coastalCities.includes(cityName)) continue

      // 检查中心城市的海市蜃楼拦截（75%概率）
      const isCenter = cityIdx === (targetPlayer.centerIndex ?? 0)
      if (isCenter && gameStore.checkMirageBlock &&
          gameStore.checkMirageBlock(cfg.target, `${casterName}的波涛汹涌`)) {
        gameStore.addLog(`  (波涛汹涌) ${cfg.target}的海市蜃楼拦截了伤害`)
        continue
      }

      // 检查钢铁城市
      if (gameStore.hasIronShield(cfg.target, cityIdx)) {
        gameStore.addLog(`  (波涛汹涌) ${cfg.target}的${cityName}为钢铁城市，免疫波涛汹涌`)
        continue
      }

      // 检查保护罩
      if (gameStore.hasProtection(cfg.target, cityIdx)) {
        gameStore.consumeProtection(cfg.target, cityIdx)
        gameStore.addLog(`  (波涛汹涌) ${cfg.target}的${cityName}有保护罩，保护罩破裂，未减半`)
        continue
      }

      // HP减半
      const before = city.currentHp
      city.currentHp = Math.floor(city.currentHp / 2)
      gameStore.addLog(`  (波涛汹涌) ${cfg.target}的${cityName}本回合出战且为沿海城市，战斗前HP减半：${Math.floor(before)} -> ${Math.floor(city.currentHp)}`)
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
 * @returns {boolean} 是否应该跳过战斗（触发了撤退）
 */
export function executePreBattleChecks(gameStore, gameState, players, mode) {
  console.log('[PreBattleChecks] 开始执行战斗前检测')

  // 1. 晕头转向检测
  const dizzyRetreat = checkDizzyEffect(gameStore, gameState, mode)
  if (dizzyRetreat) {
    console.log('[PreBattleChecks] 晕头转向触发撤退')
    return true  // 跳过战斗
  }

  // 2. 同省撤退/省会归顺检测（仅2P）
  if (mode === '2P' || mode === '2p') {
    const provinceRetreat = checkProvinceRules(gameStore, gameState, players)
    if (provinceRetreat) {
      console.log('[PreBattleChecks] 同省撤退/省会归顺触发')
      return true  // 跳过战斗
    }
  }

  // 3. 波涛汹涌HP减半
  checkBtxxEffect(gameStore, gameState)

  console.log('[PreBattleChecks] 战斗前检测完成')
  return false  // 继续战斗
}
