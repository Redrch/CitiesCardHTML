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
  // 护盾系统
  const barriers = ref({})

  /**
   * 部署城市参战
   * @param {string} playerName - 玩家名称
   * @param {Array} cityIndices - 参战城市索引数组
   */
  function deployCities(playerName, cityIndices) {
    battleDeployments.value[playerName] = {
      cities: cityIndices,
      skills: []
    }

    gameStore.addLog(`${playerName} 部署了 ${cityIndices.length} 个城市参战`)
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
    const attackingCities = attackerDeployment.cities.map(idx => attacker.cities[idx])

    attackingCities.forEach(city => {
      if (city && city.isAlive) {
        totalAttackPower += calculateCityPower(city)
      }
    })

    // 计算总防御力
    let totalDefensePower = 0
    const defendingCities = defenderDeployment.cities.map(idx => defender.cities[idx])

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

    // 检查护盾
    if (barriers.value[defender.name]) {
      const barrier = barriers.value[defender.name]
      const absorbed = Math.min(netDamage * 0.5, barrier.hp)
      const reflected = absorbed // 50%吸收，50%反弹

      barrier.hp -= absorbed
      netDamage -= absorbed

      // 反弹伤害
      if (reflected > 0) {
        applyDamageToPlayer(attacker, reflected)
        gameStore.addLog(`${defender.name} 的护盾反弹了 ${Math.floor(reflected)} 伤害`)
      }

      if (barrier.hp <= 0) {
        delete barriers.value[defender.name]
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
      barrierDamage: barriers.value[defender.name] ? Math.min(netDamage * 0.5, barriers.value[defender.name].hp) : 0,
      barrierReflect: barriers.value[defender.name] ? Math.min(netDamage * 0.5, barriers.value[defender.name].hp) : 0,
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
    const aliveCities = player.cities.filter(c => c.isAlive)
    if (aliveCities.length > 0) {
      distributeDamage(aliveCities, damage)
    }
  }

  /**
   * 设置护盾
   * @param {string} playerName - 玩家名称
   * @param {number} hp - 护盾血量
   * @param {number} duration - 持续回合数
   */
  function setBarrier(playerName, hp, duration = 5) {
    barriers.value[playerName] = {
      hp: hp,
      maxHp: hp,
      duration: duration,
      createdRound: gameStore.currentRound
    }

    gameStore.addLog(`${playerName} 设置了护盾（${hp}HP，持续${duration}回合）`)
  }

  /**
   * 更新护盾状态（每回合调用）
   */
  function updateBarriers() {
    for (const playerName in barriers.value) {
      const barrier = barriers.value[playerName]

      // 回血
      barrier.hp = Math.min(barrier.hp + 3000, barrier.maxHp)

      // 检查持续时间
      const roundsPassed = gameStore.currentRound - barrier.createdRound
      if (roundsPassed >= barrier.duration) {
        delete barriers.value[playerName]
        gameStore.addLog(`${playerName} 的护盾持续时间结束`)
      }
    }
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
    return player.cities.filter(c => c.isAlive).length
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
   * @param {Array} attackerCityIndices - 进攻方出战城市索引
   * @param {Array} defenderCityIndices - 防守方出战城市索引
   */
  function markBattleCitiesAsKnown(attacker, defender, attackerCityIndices, defenderCityIndices) {
    // 使用setCityKnown来标记已知城市
    // setCityKnown(owner, cityIdx, observer) - owner拥有城市，observer知道它

    // 进攻方知道防守方的出战城市
    defenderCityIndices.forEach(cityIdx => {
      gameStore.setCityKnown(defender.name, cityIdx, attacker.name)
    })

    // 防守方知道进攻方的出战城市
    attackerCityIndices.forEach(cityIdx => {
      gameStore.setCityKnown(attacker.name, cityIdx, defender.name)
    })
  }

  /**
   * 重置战斗系统
   */
  function resetBattle() {
    battleDeployments.value = {}
    battleHistory.value = []
    barriers.value = {}
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
    resetBattle
  }
}
