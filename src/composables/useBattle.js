/**
 * 战斗系统 Composable
 * 管理战斗计算、伤害分配、战斗结果等
 */

import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { calculateCityPower, getGreenDefense } from '../utils/cityHelpers'

export function useBattle() {
  const gameStore = useGameStore()

  // 当前回合战斗部署
  const battleDeployments = ref({})
  // 战斗结果历史
  const battleHistory = ref([])
  // 关键修复：不再使用本地 barriers ref，直接使用 gameStore.barrier
  // 这里创建一个 computed 引用以保持向后兼容
  const barriers = computed(() => gameStore.barrier)

  /**
   * 部署城市参战
   * @param {string} playerName - 玩家名称
   * @param {Array} cityNames - 参战城市名称数组
   */
  function deployCities(playerName, cityNames) {
    battleDeployments.value[playerName] = {
      cities: cityNames,
      skills: []
    }

    gameStore.addLog(`${playerName} 部署了 ${cityNames.length} 个城市参战`)
  }

  /**
   * 计算两个玩家之间的战斗
   * @param {Object} attacker - 攻击方玩家对象
   * @param {Object} defender - 防守方玩家对象
   * @returns {Object} 战斗结果
   */
  function calculateBattle(attacker, defender) {
    const attackerDeployment = battleDeployments.value[attacker.name] || { cities: [] }
    const defenderDeployment = battleDeployments.value[defender.name] || { cities: [] }

    // 计算总攻击力
    let totalAttackPower = 0
    const attackingCities = attackerDeployment.cities.map(name => attacker.cities[name])

    attackingCities.forEach(city => {
      if (city && city.isAlive) {
        totalAttackPower += calculateCityPower(city)
      }
    })

    // 计算总防御力
    let totalDefensePower = 0
    const defendingCities = defenderDeployment.cities.map(name => defender.cities[name])

    defendingCities.forEach(city => {
      if (city && city.isAlive) {
        totalDefensePower += calculateCityPower(city)
      }
    })

    // 计算绿色技能防御加成
    let greenDefenseBonus = 0
    defendingCities.forEach(city => {
      if (city && city.isAlive) {
        greenDefenseBonus += getGreenDefense(city.green || 0)
      }
    })

    // 计算净伤害
    let netDamage = Math.max(0, totalAttackPower - greenDefenseBonus)

    // 检查护盾 - 关键修复：同步使用 gameStore.barrier
    if (gameStore.barrier[defender.name]) {
      const barrier = gameStore.barrier[defender.name]
      const absorbed = Math.min(netDamage * 0.5, barrier.hp)
      const reflected = absorbed // 50%吸收，50%反弹

      // 关键修复：减少屏障HP（直接修改gameStore.barrier）
      barrier.hp -= absorbed
      netDamage -= absorbed

      console.log(`[useBattle] 屏障吸收伤害: ${Math.floor(absorbed)}, 剩余HP: ${Math.floor(barrier.hp)}`)

      // 反弹伤害
      if (reflected > 0) {
        applyDamageToPlayer(attacker, reflected)
        gameStore.addLog(`${defender.name} 的护盾反弹了 ${Math.floor(reflected)} 伤害`)
      }

      if (barrier.hp <= 0) {
        delete gameStore.barrier[defender.name]
        gameStore.addLog(`${defender.name} 的护盾被摧毁`)
      }
    }

    // 分配伤害到防守方城市
    const damageResult = distributeDamage(defendingCities, netDamage)

    // 记录战斗结果
    const battleResult = {
      round: gameStore.currentRound,
      attacker: attacker.name,
      defender: defender.name,
      attackPower: totalAttackPower,
      defensePower: greenDefenseBonus,
      netDamage: netDamage,
      casualties: damageResult.casualties,
      attackingCities: attackingCities.filter(c => c && c.isAlive).length,
      defendingCities: defendingCities.filter(c => c && c.isAlive).length,
      barrierDamage: gameStore.barrier[defender.name] ? Math.min(netDamage * 0.5, gameStore.barrier[defender.name].hp) : 0,
      barrierReflect: gameStore.barrier[defender.name] ? Math.min(netDamage * 0.5, gameStore.barrier[defender.name].hp) : 0,
      specialEffects: [],
      timestamp: Date.now()
    }

    battleHistory.value.push(battleResult)

    // 更新游戏日志
    gameStore.addLog(
      `${attacker.name} 对 ${defender.name} 造成 ${Math.floor(netDamage)} 伤害` +
      (damageResult.casualties.length > 0 ? `，摧毁了 ${damageResult.casualties.length} 个城市` : '')
    )

    // 标记出战城市为已知城市（双方互相知道对方出战的城市）
    markBattleCitiesAsKnown(attacker, defender, attackerDeployment.cities, defenderDeployment.cities)

    return battleResult
  }

  /**
   * 分配伤害到城市（优先攻击血量最低的）
   * @param {Array} cities - 城市列表
   * @param {number} totalDamage - 总伤害
   * @returns {Object} 伤害分配结果
   */
  function distributeDamage(cities, totalDamage) {
    const casualties = []
    let remainingDamage = totalDamage

    // 按当前HP从低到高排序
    const sortedCities = [...cities]
      .filter(c => c && c.isAlive)
      .sort((a, b) => (a.currentHp || a.hp) - (b.currentHp || b.hp))

    for (const city of sortedCities) {
      if (remainingDamage <= 0) break

      const currentHp = city.currentHp || city.hp
      const damageToCity = Math.min(currentHp, remainingDamage)

      city.currentHp = currentHp - damageToCity
      remainingDamage -= damageToCity

      if (city.currentHp <= 0) {
        city.isAlive = false
        casualties.push(city.name)
      }
    }

    return {
      casualties,
      damageDealt: totalDamage - remainingDamage
    }
  }

  /**
   * 对玩家造成直接伤害
   * @param {Object} player - 玩家对象
   * @param {number} damage - 伤害值
   */
  function applyDamageToPlayer(player, damage) {
    const aliveCities = Object.values(player.cities).filter(c => c.isAlive)
    if (aliveCities.length > 0) {
      distributeDamage(aliveCities, damage)
    }
  }

  /**
   * 设置护盾 - 关键修复：使用 gameStore.barrier
   * @param {string} playerName - 玩家名称
   * @param {number} hp - 护盾血量
   * @param {number} duration - 持续回合数
   */
  function setBarrier(playerName, hp, duration = 5) {
    gameStore.barrier[playerName] = {
      hp: hp,
      maxHp: hp,
      roundsLeft: duration,
      team: 0
    }

    gameStore.addLog(`${playerName} 设置了护盾（${hp}HP，持续${duration}回合）`)
  }

  /**
   * 更新护盾状态（每回合调用） - 关键修复：使用 gameStore.barrier
   * 注意：这个函数已不再使用，屏障更新由 gameStore.updateRoundStates() 处理
   */
  function updateBarriers() {
    // 屏障的回血和持续时间已由 gameStore.updateRoundStates() 统一处理
    // 这里保留空函数以保持向后兼容
    console.log('[useBattle] updateBarriers 已废弃，屏障更新由 gameStore.updateRoundStates() 处理')
  }

  /**
   * 执行战斗回合
   * @returns {Array} 所有战斗结果
   */
  function executeBattleRound() {
    const results = []
    const players = gameStore.players

    // 2人模式
    if (players.length === 2) {
      const result = calculateBattle(players[0], players[1])
      results.push(result)

      const reverseResult = calculateBattle(players[1], players[0])
      results.push(reverseResult)
    }

    // 3人模式 - 每个玩家攻击相邻玩家
    else if (players.length === 3) {
      for (let i = 0; i < 3; i++) {
        const attacker = players[i]
        const defender = players[(i + 1) % 3]
        const result = calculateBattle(attacker, defender)
        results.push(result)
      }
    }

    // 2v2模式
    else if (players.length === 4) {
      // 队伍1 vs 队伍2
      const team1Result = calculateBattle(players[0], players[2])
      const team2Result = calculateBattle(players[2], players[0])
      results.push(team1Result, team2Result)

      // 队友之间可能的互动
      const team1InternalResult = calculateBattle(players[0], players[1])
      const team2InternalResult = calculateBattle(players[2], players[3])
      results.push(team1InternalResult, team2InternalResult)
    }

    // 清空本回合部署
    battleDeployments.value = {}

    // 更新护盾
    updateBarriers()

    return results
  }

  /**
   * 获取玩家存活城市数
   * @param {Object} player - 玩家对象
   * @returns {number}
   */
  function getAliveCitiesCount(player) {
    return Object.values(player.cities).filter(c => c.isAlive).length
  }

  /**
   * 检查游戏是否结束
   * @returns {Object|null} 获胜者信息或null
   */
  function checkGameOver() {
    const players = gameStore.players
    const alivePlayers = players.filter(p => getAliveCitiesCount(p) > 0)

    if (alivePlayers.length === 1) {
      return {
        winner: alivePlayers[0].name,
        reason: '其他玩家全部淘汰'
      }
    }

    return null
  }

  /**
   * 标记出战城市为已知城市
   * @param {Object} attacker - 进攻方
   * @param {Object} defender - 防守方
   * @param {Array} attackerCityNames - 进攻方出战城市名称
   * @param {Array} defenderCityNames - 防守方出战城市名称
   */
  function markBattleCitiesAsKnown(attacker, defender, attackerCityNames, defenderCityNames) {
    // 使用setCityKnown来标记已知城市
    // setCityKnown(owner, cityName, observer) - owner拥有城市，observer知道它

    // 进攻方知道防守方的出战城市
    defenderCityNames.forEach(cityName => {
      gameStore.setCityKnown(defender.name, cityName, attacker.name)
    })

    // 防守方知道进攻方的出战城市
    attackerCityNames.forEach(cityName => {
      gameStore.setCityKnown(attacker.name, cityName, defender.name)
    })
  }

  /**
   * 重置战斗系统
   */
  function resetBattle() {
    battleDeployments.value = {}
    battleHistory.value = []
    // 关键修复：barriers 现在是 computed，不需要重置
    // 屏障由 gameStore.barrier 管理，需要时在 gameStore 中重置
  }

  /**
   * 两个特定城市之间的战斗（用于先声夺人技能）
   * @param {Object} player1 - 玩家1对象
   * @param {string} city1Name - 玩家1的城市名称
   * @param {Object} player2 - 玩家2对象
   * @param {string} city2Name - 玩家2的城市名称
   * @returns {Object} 战斗结果
   */
  function battleBetweenCities(player1, city1Name, player2, city2Name) {
    const city1 = player1.cities[city1Name]
    const city2 = player2.cities[city2Name]

    if (!city1 || !city2) {
      console.error('[useBattle] 城市不存在', { city1Name, city2Name })
      return null
    }

    if (!city1.isAlive || !city2.isAlive) {
      console.log('[useBattle] 城市已阵亡，无法战斗', { city1Name, city2Name })
      return null
    }

    // 计算城市1的攻击力
    const city1Power = calculateCityPower(city1)
    const city1Defense = getGreenDefense(city1.green || 0)

    // 计算城市2的攻击力
    const city2Power = calculateCityPower(city2)
    const city2Defense = getGreenDefense(city2.green || 0)

    // 城市1攻击城市2
    const damage1to2 = Math.max(0, city1Power - city2Defense)
    const city2CurrentHp = city2.currentHp || city2.hp
    const actualDamage1to2 = Math.min(damage1to2, city2CurrentHp)
    city2.currentHp = city2CurrentHp - actualDamage1to2

    // 城市2攻击城市1
    const damage2to1 = Math.max(0, city2Power - city1Defense)
    const city1CurrentHp = city1.currentHp || city1.hp
    const actualDamage2to1 = Math.min(damage2to1, city1CurrentHp)
    city1.currentHp = city1CurrentHp - actualDamage2to1

    // 检查城市是否阵亡
    const casualties = []
    if (city1.currentHp <= 0) {
      city1.isAlive = false
      casualties.push({ player: player1.name, city: city1Name })
    }
    if (city2.currentHp <= 0) {
      city2.isAlive = false
      casualties.push({ player: player2.name, city: city2Name })
    }

    // 记录战斗结果
    const battleResult = {
      round: gameStore.currentRound,
      type: 'city-vs-city',
      player1: player1.name,
      city1: city1Name,
      city1Power: city1Power,
      city1Defense: city1Defense,
      damage1to2: actualDamage1to2,
      player2: player2.name,
      city2: city2Name,
      city2Power: city2Power,
      city2Defense: city2Defense,
      damage2to1: actualDamage2to1,
      casualties: casualties,
      timestamp: Date.now()
    }

    battleHistory.value.push(battleResult)

    // 更新游戏日志
    let logMessage = `⚔️ 先声夺人战斗：${player1.name}的${city1Name}（攻击力${Math.floor(city1Power)}）vs ${player2.name}的${city2Name}（攻击力${Math.floor(city2Power)}）`

    if (actualDamage1to2 > 0 || actualDamage2to1 > 0) {
      logMessage += `\n  ${city1Name}对${city2Name}造成${Math.floor(actualDamage1to2)}伤害，${city2Name}对${city1Name}造成${Math.floor(actualDamage2to1)}伤害`
    }

    if (casualties.length > 0) {
      const deadCities = casualties.map(c => `${c.player}的${c.city}`).join('、')
      logMessage += `\n  ${deadCities}已阵亡`
    }

    gameStore.addLog(logMessage)

    // 标记城市为已知
    gameStore.setCityKnown(player1.name, city1Name, player2.name)
    gameStore.setCityKnown(player2.name, city2Name, player1.name)

    return battleResult
  }

  return {
    // 状态
    battleDeployments,
    battleHistory,
    barriers,

    // 方法
    deployCities,
    calculateBattle,
    distributeDamage,
    applyDamageToPlayer,
    setBarrier,
    updateBarriers,
    executeBattleRound,
    getAliveCitiesCount,
    checkGameOver,
    resetBattle,
    battleBetweenCities
  }
}
