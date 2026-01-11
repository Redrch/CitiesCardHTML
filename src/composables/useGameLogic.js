import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { processActivatedCitySkills } from './useCitySkillEffects'
import { calculateBattleResult, calculateCityPower as calculateCityPowerSimulator } from './game/useBattleSimulator'
import { updateFatigueStreaks } from './game/fatigueSystem'

/**
 * 游戏核心逻辑
 * 包含战斗计算、金币技能处理、回合管理等
 */
export function useGameLogic() {
  const gameStore = useGameStore()

  // 游戏状态
  const isGameOver = ref(false)
  const winner = ref(null)
  const currentBattle = ref(null)

  /**
   * 添加公共日志
   */
  function addPublicLog(message) {
    gameStore.addLog(message, 'battle')
    console.log(`[游戏日志] ${message}`)
  }

  /**
   * 添加私有日志
   */
  function addPrivateLog(playerName, message) {
    gameStore.addPrivateLog(playerName, message)
    console.log(`[私有日志-${playerName}] ${message}`)
  }

  /**
   * 获取有效城市名称（考虑易容术等技能）
   */
  function getEffectiveCityName(player, cityIndex) {
    const city = player.cities[cityIndex]
    if (!city) return '未知城市'

    // TODO: 处理易容术等技能
    return city.name
  }

  /**
   * 计算城市攻击力
   * @param {Object} city - 城市对象
   * @param {Object} player - 玩家对象
   * @param {Object} gameState - 游戏状态
   * @returns {number} 攻击力
   */
  function calculateCityAttack(city, player, gameState) {
    if (!city || city.hp <= 0) return 0

    let attack = city.hp

    // 实力增强效果
    if (gameState.strengthBoost && gameState.strengthBoost[player.name]) {
      const boost = gameState.strengthBoost[player.name]
      if (boost.active && boost.roundsLeft > 0) {
        attack *= 2
      }
    }

    // 士气大振效果
    if (gameState.morale && gameState.morale[player.name]) {
      const morale = gameState.morale[player.name]
      if (morale.active && morale.roundsLeft > 0) {
        attack *= 1.5
      }
    }

    return Math.floor(attack)
  }

  /**
   * 检查城市是否有保护罩
   */
  function hasCityProtection(player, cityIndex, gameState) {
    if (!gameState.protections) return false
    if (!gameState.protections[player.name]) return false
    return gameState.protections[player.name][cityIndex] > 0
  }

  /**
   * 检查城市是否为钢铁城市
   */
  function isIronCity(player, cityIndex, gameState) {
    if (!gameState.ironCities) return false
    if (!gameState.ironCities[player.name]) return false
    return gameState.ironCities[player.name][cityIndex] > 0
  }

  /**
   * 处理城市受伤
   * @param {Object} city - 城市对象
   * @param {number} damage - 伤害值
   * @param {Object} player - 玩家对象
   * @param {number} cityIndex - 城市索引
   * @param {Object} gameState - 游戏状态
   * @returns {Object} { actualDamage, blocked, reason }
   */
  function applyCityDamage(city, damage, player, cityIndex, gameState) {
    // 检查城市保护
    if (hasCityProtection(player, cityIndex, gameState)) {
      // 移除保护罩
      delete gameState.protections[player.name][cityIndex]
      return {
        actualDamage: 0,
        blocked: true,
        reason: 'protection'
      }
    }

    // 检查钢铁城市
    if (isIronCity(player, cityIndex, gameState)) {
      gameState.ironCities[player.name][cityIndex]--
      if (gameState.ironCities[player.name][cityIndex] <= 0) {
        delete gameState.ironCities[player.name][cityIndex]
      }
      return {
        actualDamage: 0,
        blocked: true,
        reason: 'iron'
      }
    }

    // 应用伤害
    const oldHp = city.currentHp !== undefined ? city.currentHp : city.hp
    const newHp = Math.max(0, oldHp - damage)
    const actualDamage = oldHp - newHp

    // 更新HP和存活状态
    city.currentHp = newHp
    if (city.hp !== undefined) city.hp = newHp  // 同步更新基础HP（为了兼容性）

    if (newHp <= 0) {
      city.isAlive = false
    }

    return {
      actualDamage,
      blocked: false,
      isDead: newHp <= 0
    }
  }

  /**
   * 2人游戏战斗计算
   */
  function battle2P(players, gameState) {
    addPublicLog('\n=== 2人游戏战斗计算 ===')

    const player1 = players[0]
    const player2 = players[1]

    // 确保每个玩家都有centerIndex
    if (player1.centerIndex === null || player1.centerIndex === undefined) {
      console.warn(`[战斗] ${player1.name} 的centerIndex未设置，使用默认值0`)
      player1.centerIndex = 0
    }
    if (player2.centerIndex === null || player2.centerIndex === undefined) {
      console.warn(`[战斗] ${player2.name} 的centerIndex未设置，使用默认值0`)
      player2.centerIndex = 0
    }

    const state1 = gameState.playerStates[player1.name]
    const state2 = gameState.playerStates[player2.name]

    // 确保 deadCities 数组已初始化
    if (!state1.deadCities) state1.deadCities = []
    if (!state2.deadCities) state2.deadCities = []

    // 处理战斗金币技能使用和金币扣除
    ;[
      { player: player1, state: state1 },
      { player: player2, state: state2 }
    ].forEach(({ player, state }) => {
      if (state.battleGoldSkill) {
        const skillName = state.battleGoldSkill
        let skillCost = 0

        // 根据技能名称确定金币消耗
        const skillCosts = {
          '按兵不动': gameStore.gameMode === '3P' ? 4 : 2,
          '擒贼擒王': 3,
          '草木皆兵': 3,
          '越战越勇': 3,
          '吸引攻击': 4,
          '既来则安': 4,
          '铜墙铁壁': 5,
          '玉碎瓦全': 5,
          '背水一战': 6,
          '料事如神': 6,
          '暗度陈仓': 6,
          '同归于尽': 7,
          '声东击西': 7,
          '欲擒故纵': 7,
          '御驾亲征': 8,
          '草船借箭': 8,
          '移花接木': 8,
          '狂暴模式': 9,
          '以逸待劳': 9,
          '晕头转向': 10,
          '隔岸观火': 10,
          '挑拨离间': 10,
          '趁火打劫': 10,
          '反戈一击': 11,
          '围魏救赵': 13,
          '设置屏障': 15,
          '潜能激发': 20
        }

        skillCost = skillCosts[skillName] || 0

        // 扣除金币
        if (skillCost > 0) {
          const beforeGold = player.gold
          player.gold = Math.max(0, player.gold - skillCost)
          addPublicLog(`${player.name} 使用战斗技能【${skillName}】，消耗${skillCost}金币（${beforeGold} → ${player.gold}）`)
          console.log(`[战斗] ${player.name} 使用技能 ${skillName}，金币 ${beforeGold} -> ${player.gold}`)
        } else {
          addPublicLog(`${player.name} 使用战斗技能【${skillName}】`)
        }
      }
    })

    // 处理"按兵不动"隐藏城市
    ;[
      { player: player1, state: state1 },
      { player: player2, state: state2 }
    ].forEach(({ player, state }) => {
      if (!state.currentBattleCities) return

      const standGroundCities = state.currentBattleCities.filter(card => card.isStandGroundCity)
      if (standGroundCities.length > 0) {
        addPublicLog(`${player.name}本轮使用按兵不动，派出"按兵不动"城市（HP=1，攻击力=1）`)
        state.currentBattleCities = state.currentBattleCities.filter(card => !card.isStandGroundCity)
      }
    })

    // 获取出战城市
    console.log('[战斗] ===== 开始战斗计算 =====')
    console.log('[战斗] player1:', player1.name, 'cities数组长度:', player1.cities.length)
    console.log('[战斗] player1所有城市:')
    player1.cities.forEach((c, i) => console.log(`  [${i}] ${c.name} HP:${c.currentHp ?? c.hp}`))
    console.log('[战斗] player2:', player2.name, 'cities数组长度:', player2.cities.length)
    console.log('[战斗] player2所有城市:')
    player2.cities.forEach((c, i) => console.log(`  [${i}] ${c.name} HP:${c.currentHp ?? c.hp}`))

    console.log('[战斗] state1.currentBattleCities:', state1.currentBattleCities)
    console.log('[战斗] state2.currentBattleCities:', state2.currentBattleCities)

    const cities1 = (state1.currentBattleCities || []).map((card, mapIdx) => {
      const city = player1.cities[card.cityIdx]
      console.log(`[战斗诊断] ${player1.name} [${mapIdx}] cityIdx=${card.cityIdx}, city.name=${city?.name}, city.currentHp=${city?.currentHp}, city.hp=${city?.hp}, city.isAlive=${city?.isAlive}`)
      if (!city) {
        console.error(`[战斗错误] ${player1.name} cityIdx=${card.cityIdx} 对应的城市不存在！`)
      }
      return {
        ...city,
        cityIdx: card.cityIdx
      }
    })
    const cities2 = (state2.currentBattleCities || []).map((card, mapIdx) => {
      const city = player2.cities[card.cityIdx]
      console.log(`[战斗诊断] ${player2.name} [${mapIdx}] cityIdx=${card.cityIdx}, city.name=${city?.name}, city.currentHp=${city?.currentHp}, city.hp=${city?.hp}, city.isAlive=${city?.isAlive}`)
      if (!city) {
        console.error(`[战斗错误] ${player2.name} cityIdx=${card.cityIdx} 对应的城市不存在！`)
      }
      return {
        ...city,
        cityIdx: card.cityIdx
      }
    })

    // 记录双方出战城市
    if (cities1 && cities1.length > 0) {
      const cityNames1 = cities1.filter(c => c && c.name).map(c => c.name).join('、')
      if (cityNames1) {
        addPublicLog(`${player1.name} 派出：${cityNames1}`)
      }
    }
    if (cities2 && cities2.length > 0) {
      const cityNames2 = cities2.filter(c => c && c.name).map(c => c.name).join('、')
      if (cityNames2) {
        addPublicLog(`${player2.name} 派出：${cityNames2}`)
      }
    }

    // 标记出战城市为已知城市（双方互相知道对方出战的城市）
    cities1.forEach(city => {
      if (city && city.cityIdx !== undefined) {
        gameStore.setCityKnown(player1.name, city.cityIdx, player2.name)
      }
    })
    cities2.forEach(city => {
      if (city && city.cityIdx !== undefined) {
        gameStore.setCityKnown(player2.name, city.cityIdx, player1.name)
      }
    })

    // 处理城市专属技能激活效果
    console.log('[battle2P] ===== 处理城市专属技能激活 =====')
    console.log('[battle2P] player1:', player1.name)
    console.log('[battle2P] state1.activatedCitySkills:', state1.activatedCitySkills)
    console.log('[battle2P] player2:', player2.name)
    console.log('[battle2P] state2.activatedCitySkills:', state2.activatedCitySkills)

    // 验证激活的城市技能是否与实际城市匹配
    if (state1.activatedCitySkills && Object.keys(state1.activatedCitySkills).length > 0) {
      Object.keys(state1.activatedCitySkills).forEach(cityIdx => {
        const skillData = state1.activatedCitySkills[cityIdx]
        const actualCity = player1.cities[cityIdx]
        if (!actualCity || actualCity.name !== skillData.cityName) {
          console.warn(`[battle2P] ⚠️ ${player1.name} 城市技能数据不匹配: cityIdx=${cityIdx}, skillData.cityName="${skillData.cityName}", actualCity="${actualCity?.name}"`)
        }
      })
    }
    if (state2.activatedCitySkills && Object.keys(state2.activatedCitySkills).length > 0) {
      Object.keys(state2.activatedCitySkills).forEach(cityIdx => {
        const skillData = state2.activatedCitySkills[cityIdx]
        const actualCity = player2.cities[cityIdx]
        if (!actualCity || actualCity.name !== skillData.cityName) {
          console.warn(`[battle2P] ⚠️ ${player2.name} 城市技能数据不匹配: cityIdx=${cityIdx}, skillData.cityName="${skillData.cityName}", actualCity="${actualCity?.name}"`)
        }
      })
    }

    processActivatedCitySkills(player1, state1, player2, cities2, addPublicLog)
    processActivatedCitySkills(player2, state2, player1, cities1, addPublicLog)

    // 计算总攻击力
    let totalAttack1 = 0
    let totalAttack2 = 0

    cities1.forEach(city => {
      if (city.hp > 0) {
        const attack = calculateCityAttack(city, player1, gameState)
        totalAttack1 += attack
      }
    })

    cities2.forEach(city => {
      if (city.hp > 0) {
        const attack = calculateCityAttack(city, player2, gameState)
        totalAttack2 += attack
      }
    })

    addPublicLog(`${player1.name} 总攻击力: ${totalAttack1}`)
    addPublicLog(`${player2.name} 总攻击力: ${totalAttack2}`)

    // 处理屏障
    let barrier = gameState.barrier
    if (barrier && barrier.active) {
      // 判断哪一方有屏障
      let barrierOwner = null
      let barrierAttacker = null
      let barrierDamage = 0

      if (barrier.owner === player1.name) {
        barrierOwner = player1
        barrierAttacker = player2
        barrierDamage = totalAttack2
      } else if (barrier.owner === player2.name) {
        barrierOwner = player2
        barrierAttacker = player1
        barrierDamage = totalAttack1
      }

      if (barrierOwner && barrierAttacker) {
        // 屏障先承受伤害
        const oldBarrierHp = barrier.hp
        barrier.hp = Math.max(0, barrier.hp - barrierDamage)
        const actualBarrierDamage = oldBarrierHp - barrier.hp

        addPublicLog(`${barrierAttacker.name}攻击${barrierOwner.name}的屏障，造成${actualBarrierDamage}点伤害，屏障剩余HP: ${barrier.hp}`)

        if (barrier.hp <= 0) {
          addPublicLog(`${barrierOwner.name}的屏障被摧毁！`)
          barrier.active = false

          // 屏障破碎后，剩余伤害继续
          const remainingDamage = barrierDamage - actualBarrierDamage
          if (remainingDamage > 0) {
            addPublicLog(`剩余${remainingDamage}点伤害继续攻击城市`)
            // TODO: 分配剩余伤害到城市
          }
        }

        // 屏障回合数减1
        barrier.roundsLeft--
        if (barrier.roundsLeft <= 0) {
          addPublicLog(`${barrierOwner.name}的屏障持续时间已到`)
          barrier.active = false
        }

        // 有屏障时，另一方的攻击被屏障吸收
        if (barrier.owner === player1.name) {
          totalAttack2 = 0
        } else {
          totalAttack1 = 0
        }
      }
    }

    // 使用战斗模拟器计算伤害分配（含擒贼擒王逻辑）
    // 参考 citycard_web.html lines 4615-5041
    // 关键修复：先计算双方战斗结果，再同时应用伤害，确保战斗同时进行

    let battleResult1 = null // player1 对 player2 的战斗结果
    let battleResult2 = null // player2 对 player1 的战斗结果
    let defenderCities1 = null // player2 被攻击后的城市状态（深度克隆）
    let defenderCities2 = null // player1 被攻击后的城市状态（深度克隆）

    // 第一步：计算 player1 对 player2 的攻击（不修改原始数据）
    if (totalAttack1 > 0 && cities2.length > 0) {
      // 检查是否有擒贼擒王技能
      const hasCaptureKing = gameStore.qinwang && gameStore.qinwang.caster === player1.name && gameStore.qinwang.target === player2.name

      const battleSkills = {
        captureKing: hasCaptureKing
      }

      // 获取攻击方城市的完整对象（含索引）
      const attackerCitiesWithIdx = cities1.map(c => {
        const city = player1.cities[c.cityIdx]
        return { ...city, cityIdx: c.cityIdx }
      })

      // 获取防守方城市的完整对象（含索引）- 深度克隆避免被修改
      const defenderCitiesWithIdx = cities2.map(c => {
        const city = player2.cities[c.cityIdx]
        return JSON.parse(JSON.stringify({ ...city, cityIdx: c.cityIdx }))
      })

      battleResult1 = calculateBattleResult(
        attackerCitiesWithIdx,
        defenderCitiesWithIdx,
        player1,
        player2,
        gameStore,
        battleSkills
      )

      // 保存修改后的防守方城市状态（calculateBattleResult会直接修改传入的数组）
      defenderCities1 = defenderCitiesWithIdx

      // 记录战斗日志
      addPublicLog(`${player1.name} → ${player2.name}: 总攻击力 ${battleResult1.totalAttackPower}，净伤害 ${battleResult1.netDamage}`)

      if (battleResult1.destroyedCities.length > 0) {
        addPublicLog(`摧毁城市: ${battleResult1.destroyedCities.join('、')}`)
      }
    }

    // 第二步：计算 player2 对 player1 的攻击（不修改原始数据）
    if (totalAttack2 > 0 && cities1.length > 0) {
      // 检查是否有擒贼擒王技能
      const hasCaptureKing = gameStore.qinwang && gameStore.qinwang.caster === player2.name && gameStore.qinwang.target === player1.name

      const battleSkills = {
        captureKing: hasCaptureKing
      }

      // 获取攻击方城市的完整对象（含索引）- 使用原始HP数据
      const attackerCitiesWithIdx = cities2.map(c => {
        const city = player2.cities[c.cityIdx]
        return { ...city, cityIdx: c.cityIdx }
      })

      // 获取防守方城市的完整对象（含索引）- 深度克隆避免被修改
      const defenderCitiesWithIdx = cities1.map(c => {
        const city = player1.cities[c.cityIdx]
        return JSON.parse(JSON.stringify({ ...city, cityIdx: c.cityIdx }))
      })

      battleResult2 = calculateBattleResult(
        attackerCitiesWithIdx,
        defenderCitiesWithIdx,
        player2,
        player1,
        gameStore,
        battleSkills
      )

      // 保存修改后的防守方城市状态（calculateBattleResult会直接修改传入的数组）
      defenderCities2 = defenderCitiesWithIdx

      // 记录战斗日志
      addPublicLog(`${player2.name} → ${player1.name}: 总攻击力 ${battleResult2.totalAttackPower}，净伤害 ${battleResult2.netDamage}`)

      if (battleResult2.destroyedCities.length > 0) {
        addPublicLog(`摧毁城市: ${battleResult2.destroyedCities.join('、')}`)
      }
    }

    // 第三步：同时应用双方的战斗结果到原始数据
    if (defenderCities1) {
      // 应用 player1 对 player2 的伤害
      defenderCities1.forEach((city) => {
        const originalCity = player2.cities[city.cityIdx]
        originalCity.currentHp = city.currentHp
        originalCity.isAlive = city.isAlive
        if (originalCity.hp !== undefined) {
          originalCity.hp = city.currentHp
        }
      })

      // 记录阵亡城市索引
      if (battleResult1.destroyedCities) {
        battleResult1.destroyedCities.forEach(cityName => {
          const cityIdx = defenderCities1.findIndex(c => c.name === cityName)
          if (cityIdx !== -1) {
            const actualIdx = defenderCities1[cityIdx].cityIdx
            if (!state2.deadCities.includes(actualIdx)) {
              state2.deadCities.push(actualIdx)
            }
          }
        })
      }
    }

    if (defenderCities2) {
      // 应用 player2 对 player1 的伤害
      defenderCities2.forEach((city) => {
        const originalCity = player1.cities[city.cityIdx]
        originalCity.currentHp = city.currentHp
        originalCity.isAlive = city.isAlive
        if (originalCity.hp !== undefined) {
          originalCity.hp = city.currentHp
        }
      })

      // 记录阵亡城市索引
      if (battleResult2.destroyedCities) {
        battleResult2.destroyedCities.forEach(cityName => {
          const cityIdx = defenderCities2.findIndex(c => c.name === cityName)
          if (cityIdx !== -1) {
            const actualIdx = defenderCities2[cityIdx].cityIdx
            if (!state1.deadCities.includes(actualIdx)) {
              state1.deadCities.push(actualIdx)
            }
          }
        })
      }
    }

    // 草木皆兵：若目标本轮未出牌，抢走1金币
    if (gameStore.cmjb) {
      Object.keys(gameStore.cmjb).forEach(casterName => {
        const cfg = gameStore.cmjb[casterName]
        if (cfg && cfg.mode === '2P') {
          const caster = players.find(p => p.name === casterName)
          const target = players.find(p => p.name === cfg.target)

          if (caster && target) {
            const targetState = gameState.playerStates[target.name]
            const targetOut = (targetState.currentBattleCities || [])

            if (targetOut.length === 0) {
              // 目标未出牌，抢走1金币
              const steal = Math.min(1, target.gold || 0)
              if (steal > 0) {
                const beforeCaster = caster.gold
                const beforeTarget = target.gold
                target.gold = Math.max(0, target.gold - steal)
                caster.gold = Math.min(24, caster.gold + steal)
                addPublicLog(`${caster.name} 对 ${target.name} 使用草木皆兵，${target.name}本轮未出牌，抢走${steal}金币（${caster.name} ${beforeCaster} -> ${caster.gold}，${target.name} ${beforeTarget} -> ${target.gold}）`)
              } else {
                addPublicLog(`${caster.name} 对 ${target.name} 使用草木皆兵，${target.name}本轮未出牌，但无金币可抢`)
              }
            }
          }
        }
      })
      // 清空草木皆兵状态
      gameStore.cmjb = {}
    }

    // 结算金币 - 每回合基础+3，加上摧毁对手城市的奖励
    const base = 3
    player1.gold = Math.min(24, player1.gold + base + state2.deadCities.filter(idx =>
      cities2.some(c => c.cityIdx === idx && player2.cities[idx].hp <= 0)
    ).length)
    player2.gold = Math.min(24, player2.gold + base + state1.deadCities.filter(idx =>
      cities1.some(c => c.cityIdx === idx && player1.cities[idx].hp <= 0)
    ).length)

    // ========== 更新疲劳计数器：战斗结束后累积疲劳 ==========
    // 关键：无论是否触发撤退/归顺，出战城市都累积疲劳（+1），未出战城市归零
    updateFatigueStreaks(players, gameState, '2P')

    // 清空本回合出战城市
    state1.currentBattleCities = []
    state2.currentBattleCities = []
    state1.battleGoldSkill = null
    state2.battleGoldSkill = null

    // 检查并标记需要补充预备城市的玩家
    checkRosterRefillNeeded(player1, state1)
    checkRosterRefillNeeded(player2, state2)

    // 检查胜负
    checkWinCondition(players, gameState)
  }

  /**
   * 自动补充预备城市（与HTML版本一致）
   */
  function checkRosterRefillNeeded(player, playerState) {
    const rosterLimit = gameStore.gameMode === '2v2' ? 4 : 5
    const mode = gameStore.gameMode || '2P'

    console.log(`[checkRosterRefillNeeded] ===== 检查 ${player.name} =====`)
    console.log(`[checkRosterRefillNeeded] rosterLimit: ${rosterLimit}, gameMode: ${mode}`)

    // 获取所有存活城市的索引（使用currentHp和isAlive标志）
    const aliveCityIndices = player.cities
      .map((c, i) => {
        const currentHp = c.currentHp !== undefined ? c.currentHp : c.hp
        const alive = c.isAlive !== false && currentHp > 0
        console.log(`  [${i}] ${c.name}: currentHp=${currentHp}, isAlive=${c.isAlive}, alive=${alive}`)
        return { i, alive }
      })
      .filter(x => x.alive)
      .map(x => x.i)

    console.log(`[checkRosterRefillNeeded] 存活城市数: ${aliveCityIndices.length}, 索引:`, aliveCityIndices)

    // 如果存活城市数 <= 预备名额，全部城市自动出阵
    if (aliveCityIndices.length <= rosterLimit) {
      player.roster = aliveCityIndices
      playerState.needsRosterRefill = false
      console.log(`[checkRosterRefillNeeded] ${player.name} 存活城市≤${rosterLimit}，全部自动出阵`)
      return
    }

    // 保留存活的已出阵城市
    const currentRoster = player.roster || []
    console.log(`[checkRosterRefillNeeded] 当前roster:`, currentRoster)
    const keepInRoster = aliveCityIndices.filter(i => currentRoster.includes(i))
    console.log(`[checkRosterRefillNeeded] 保留在roster中的存活城市:`, keepInRoster, `(${keepInRoster.length}个)`)

    // 检查是否有城市需要补充
    if (keepInRoster.length < rosterLimit) {
      // 需要补充预备城市，设置标志让玩家手动选择
      playerState.needsRosterRefill = true
      playerState.rosterRefillReason = '战斗城市阵亡'
      console.log(`[checkRosterRefillNeeded] ⚠️ ${player.name} 需要补充预备城市：当前${keepInRoster.length}个，需要${rosterLimit}个`)
      console.log(`[checkRosterRefillNeeded] 设置 playerState.needsRosterRefill = true`)
      return
    }

    // 不需要补充，保持当前roster
    player.roster = keepInRoster
    playerState.needsRosterRefill = false
    console.log(`[checkRosterRefillNeeded] ✅ ${player.name} 预备城市充足，不需要补充`)
    console.log(`[checkRosterRefillNeeded] ${player.name} roster详情:`, keepInRoster.map(i => `[${i}]${player.cities[i]?.name}`).join(', '))
  }

  /**
   * 检查胜负条件
   */
  function checkWinCondition(players, gameState) {
    // 检查中心城市是否被摧毁
    const alivePlayers = players.filter(player => {
      const centerCity = player.cities[player.centerIndex || 0]
      return centerCity && centerCity.hp > 0
    })

    if (alivePlayers.length === 1) {
      winner.value = alivePlayers[0]
      isGameOver.value = true
      addPublicLog(`\n🎉 游戏结束！${winner.value.name} 获胜！`)
      return true
    }

    if (alivePlayers.length === 0) {
      isGameOver.value = true
      addPublicLog('\n游戏结束！平局！')
      return true
    }

    return false
  }

  /**
   * 开始新回合
   */
  function startNewRound() {
    gameStore.nextRound()
    addPublicLog(`\n========== 第 ${gameStore.currentRound} 回合 ==========`)
  }

  /**
   * 结束回合
   */
  function endTurn(playerName) {
    addPublicLog(`${playerName} 结束了回合`)
    // TODO: 检查是否所有玩家都结束回合
  }

  /**
   * 初始化游戏
   */
  function initGame(players, mode) {
    gameStore.resetGame()
    gameStore.gameMode = mode
    gameStore.initPlayers(players)

    battleLogs.value = []
    isGameOver.value = false
    winner.value = null

    startNewRound()
  }

  /**
   * 3人游戏战斗计算
   */
  function battle3P(players, gameState) {
    addPublicLog('\n=== 3人游戏战斗计算 ===')

    // 处理战斗金币技能使用和金币扣除
    players.forEach(player => {
      const state = gameState.playerStates[player.name]
      if (state && state.battleGoldSkill) {
        const skillName = state.battleGoldSkill
        const skillCosts = {
          '按兵不动': 4,
          '擒贼擒王': 3,
          '草木皆兵': 3,
          '越战越勇': 3,
          '吸引攻击': 4,
          '既来则安': 4,
          '铜墙铁壁': 5,
          '玉碎瓦全': 5,
          '背水一战': 6,
          '料事如神': 6,
          '暗度陈仓': 6,
          '同归于尽': 7,
          '声东击西': 7,
          '欲擒故纵': 7,
          '御驾亲征': 8,
          '草船借箭': 8,
          '移花接木': 8,
          '狂暴模式': 9,
          '以逸待劳': 9,
          '晕头转向': 10,
          '隔岸观火': 10,
          '挑拨离间': 10,
          '趁火打劫': 10,
          '反戈一击': 11,
          '围魏救赵': 13,
          '设置屏障': 15,
          '潜能激发': 20
        }
        const skillCost = skillCosts[skillName] || 0
        if (skillCost > 0) {
          const beforeGold = player.gold
          player.gold = Math.max(0, player.gold - skillCost)
          addPublicLog(`${player.name} 使用战斗技能【${skillName}】，消耗${skillCost}金币（${beforeGold} → ${player.gold}）`)
        } else {
          addPublicLog(`${player.name} 使用战斗技能【${skillName}】`)
        }
      }
    })

    // 3P模式：每个玩家对其他两个玩家分别出战
    players.forEach((attacker, idx) => {
      const attackerState = gameState.playerStates[attacker.name]
      if (!attackerState || !attackerState.currentBattleData) return

      const otherPlayers = players.filter(p => p.name !== attacker.name)

      otherPlayers.forEach(defender => {
        const defenderState = gameState.playerStates[defender.name]
        const attackingCities = attackerState.currentBattleData[defender.name] || []

        if (attackingCities.length > 0) {
          // 检查是否有擒贼擒王技能
          const hasCaptureKing = gameStore.qinwang &&
                                 gameStore.qinwang.caster === attacker.name &&
                                 gameStore.qinwang.target === defender.name

          const battleSkills = { captureKing: hasCaptureKing }

          // 获取攻击城市和防守城市的完整对象（含索引）
          const attackerCitiesData = attackingCities.map(card => ({
            ...attacker.cities[card.cityIdx],
            cityIdx: card.cityIdx
          }))

          // 获取防守方的反击城市
          const counterCities = defenderState.currentBattleData?.[attacker.name] || []
          const defenderCitiesData = counterCities.map(card => ({
            ...defender.cities[card.cityIdx],
            cityIdx: card.cityIdx
          }))

          // 计算攻击方对防守方的伤害
          if (attackerCitiesData.length > 0) {
            const battleResult = calculateBattleResult(
              attackerCitiesData,
              defenderCitiesData,
              attacker,
              defender,
              gameStore,
              battleSkills
            )

            addPublicLog(`${attacker.name} → ${defender.name}: 总攻击力 ${battleResult.totalAttackPower}，净伤害 ${battleResult.netDamage}`)

            if (battleResult.destroyedCities.length > 0) {
              addPublicLog(`摧毁城市: ${battleResult.destroyedCities.join('、')}`)

              // 记录阵亡城市
              battleResult.destroyedCities.forEach(cityName => {
                const deadCityIdx = defenderCitiesData.findIndex(c => c.name === cityName)
                if (deadCityIdx !== -1) {
                  const cityIdx = defenderCitiesData[deadCityIdx].cityIdx
                  if (!defenderState.deadCities) defenderState.deadCities = []
                  if (!defenderState.deadCities.includes(cityIdx)) {
                    defenderState.deadCities.push(cityIdx)
                  }
                }
              })
            }

            // 同步HP变化
            defenderCitiesData.forEach(city => {
              const originalCity = defender.cities[city.cityIdx]
              originalCity.currentHp = city.currentHp
              originalCity.isAlive = city.isAlive
              if (originalCity.hp !== undefined) {
                originalCity.hp = city.currentHp
              }
            })
          }
        }
      })
    })

    // ========== 更新疲劳计数器：战斗结束后累积疲劳 ==========
    updateFatigueStreaks(players, gameState, '3P')

    // 清空所有玩家的部署
    players.forEach(player => {
      const state = gameState.playerStates[player.name]
      state.currentBattleData = {}
      state.battleGoldSkill = null
    })

    // 检查胜负
    checkWinCondition(players, gameState)
  }

  /**
   * 2v2游戏战斗计算
   */
  function battle2v2(players, gameState) {
    addPublicLog('\n=== 2v2 战斗计算 ===')

    // 处理战斗金币技能使用和金币扣除
    players.forEach(player => {
      const state = gameState.playerStates[player.name]
      if (state && state.battleGoldSkill) {
        const skillName = state.battleGoldSkill
        const skillCosts = {
          '按兵不动': 2,
          '擒贼擒王': 3,
          '草木皆兵': 3,
          '越战越勇': 3,
          '吸引攻击': 4,
          '既来则安': 4,
          '铜墙铁壁': 5,
          '玉碎瓦全': 5,
          '背水一战': 6,
          '料事如神': 6,
          '暗度陈仓': 6,
          '同归于尽': 7,
          '声东击西': 7,
          '欲擒故纵': 7,
          '御驾亲征': 8,
          '草船借箭': 8,
          '移花接木': 8,
          '狂暴模式': 9,
          '以逸待劳': 9,
          '晕头转向': 10,
          '隔岸观火': 10,
          '挑拨离间': 10,
          '趁火打劫': 10,
          '反戈一击': 11,
          '围魏救赵': 13,
          '设置屏障': 15,
          '潜能激发': 20
        }
        const skillCost = skillCosts[skillName] || 0
        if (skillCost > 0) {
          const beforeGold = player.gold
          player.gold = Math.max(0, player.gold - skillCost)
          addPublicLog(`${player.name} 使用战斗技能【${skillName}】，消耗${skillCost}金币（${beforeGold} → ${player.gold}）`)
        } else {
          addPublicLog(`${player.name} 使用战斗技能【${skillName}】`)
        }
      }
    })

    // 2v2模式：队伍0 (玩家0,1) vs 队伍1 (玩家2,3)
    const team0 = [players[0], players[1]]
    const team1 = [players[2], players[3]]

    // 收集每个队伍的出战城市
    const team0Cities = []
    const team1Cities = []

    team0.forEach(player => {
      const state = gameState.playerStates[player.name]
      ;(state.currentBattleCities || []).forEach(card => {
        team0Cities.push({
          player,
          city: player.cities[card.cityIdx],
          cityIdx: card.cityIdx
        })
      })
    })

    team1.forEach(player => {
      const state = gameState.playerStates[player.name]
      ;(state.currentBattleCities || []).forEach(card => {
        team1Cities.push({
          player,
          city: player.cities[card.cityIdx],
          cityIdx: card.cityIdx
        })
      })
    })

    // 处理屏障（简化处理，保留现有逻辑）
    let barrier = gameState.barrier
    if (barrier && barrier.active) {
      if (barrier.team === '红队') {
        // 蓝队攻击红队屏障
        const team1AttackPower = team1Cities.reduce((sum, { city, cityIdx, player }) => {
          const realIdx = player.cities.indexOf(city)
          return sum + calculateCityPower(city, realIdx, player, gameStore)
        }, 0)

        const oldHp = barrier.hp
        barrier.hp = Math.max(0, barrier.hp - team1AttackPower)
        addPublicLog(`蓝队攻击红队屏障，造成${team1AttackPower}点伤害，屏障剩余HP: ${barrier.hp}`)

        if (barrier.hp <= 0) {
          addPublicLog('红队屏障被摧毁！')
          barrier.active = false
        }
      } else if (barrier.team === '蓝队') {
        // 红队攻击蓝队屏障
        const team0AttackPower = team0Cities.reduce((sum, { city, cityIdx, player }) => {
          const realIdx = player.cities.indexOf(city)
          return sum + calculateCityPower(city, realIdx, player, gameStore)
        }, 0)

        const oldHp = barrier.hp
        barrier.hp = Math.max(0, barrier.hp - team0AttackPower)
        addPublicLog(`红队攻击蓝队屏障，造成${team0AttackPower}点伤害，屏障剩余HP: ${barrier.hp}`)

        if (barrier.hp <= 0) {
          addPublicLog('蓝队屏障被摧毁！')
          barrier.active = false
        }
      }
    }

    // 蓝队攻击红队（使用calculateBattleResult）
    if (team1Cities.length > 0 && team0Cities.length > 0 && (!barrier || !barrier.active || barrier.team !== '红队')) {
      const battleSkills = { captureKing: false }  // 2v2模式下暂不实现擒贼擒王

      const attackerCitiesWithIdx = team1Cities.map(c => ({ ...c.city, cityIdx: c.cityIdx }))
      const defenderCitiesWithIdx = team0Cities.map(c => ({ ...c.city, cityIdx: c.cityIdx }))

      // 使用第一个攻击方和第一个防守方作为代表（简化）
      const attackerPlayer = team1[0]
      const defenderPlayer = team0[0]

      const battleResult = calculateBattleResult(
        attackerCitiesWithIdx,
        defenderCitiesWithIdx,
        attackerPlayer,
        defenderPlayer,
        gameStore,
        battleSkills
      )

      addPublicLog(`蓝队 → 红队: 总攻击力 ${battleResult.totalAttackPower}，净伤害 ${battleResult.netDamage}`)

      if (battleResult.destroyedCities.length > 0) {
        addPublicLog(`摧毁城市: ${battleResult.destroyedCities.join('、')}`)

        // 记录阵亡城市
        battleResult.destroyedCities.forEach(cityName => {
          const deadCityData = team0Cities.find(c => c.city.name === cityName)
          if (deadCityData) {
            const state = gameState.playerStates[deadCityData.player.name]
            if (!state.deadCities) state.deadCities = []
            if (!state.deadCities.includes(deadCityData.cityIdx)) {
              state.deadCities.push(deadCityData.cityIdx)
            }
          }
        })
      }

      // 同步HP变化
      defenderCitiesWithIdx.forEach((city, idx) => {
        const cityData = team0Cities[idx]
        const originalCity = cityData.player.cities[cityData.cityIdx]
        originalCity.currentHp = city.currentHp
        originalCity.isAlive = city.isAlive
        if (originalCity.hp !== undefined) {
          originalCity.hp = city.currentHp
        }
      })
    }

    // 红队攻击蓝队（使用calculateBattleResult）
    if (team0Cities.length > 0 && team1Cities.length > 0 && (!barrier || !barrier.active || barrier.team !== '蓝队')) {
      const battleSkills = { captureKing: false }  // 2v2模式下暂不实现擒贼擒王

      const attackerCitiesWithIdx = team0Cities.map(c => ({ ...c.city, cityIdx: c.cityIdx }))
      const defenderCitiesWithIdx = team1Cities.map(c => ({ ...c.city, cityIdx: c.cityIdx }))

      // 使用第一个攻击方和第一个防守方作为代表（简化）
      const attackerPlayer = team0[0]
      const defenderPlayer = team1[0]

      const battleResult = calculateBattleResult(
        attackerCitiesWithIdx,
        defenderCitiesWithIdx,
        attackerPlayer,
        defenderPlayer,
        gameStore,
        battleSkills
      )

      addPublicLog(`红队 → 蓝队: 总攻击力 ${battleResult.totalAttackPower}，净伤害 ${battleResult.netDamage}`)

      if (battleResult.destroyedCities.length > 0) {
        addPublicLog(`摧毁城市: ${battleResult.destroyedCities.join('、')}`)

        // 记录阵亡城市
        battleResult.destroyedCities.forEach(cityName => {
          const deadCityData = team1Cities.find(c => c.city.name === cityName)
          if (deadCityData) {
            const state = gameState.playerStates[deadCityData.player.name]
            if (!state.deadCities) state.deadCities = []
            if (!state.deadCities.includes(deadCityData.cityIdx)) {
              state.deadCities.push(deadCityData.cityIdx)
            }
          }
        })
      }

      // 同步HP变化
      defenderCitiesWithIdx.forEach((city, idx) => {
        const cityData = team1Cities[idx]
        const originalCity = cityData.player.cities[cityData.cityIdx]
        originalCity.currentHp = city.currentHp
        originalCity.isAlive = city.isAlive
        if (originalCity.hp !== undefined) {
          originalCity.hp = city.currentHp
        }
      })
    }

    // 结算金币
    players.forEach(player => {
      player.gold += 1
    })

    // ========== 更新疲劳计数器：战斗结束后累积疲劳 ==========
    updateFatigueStreaks(players, gameState, '2v2')

    // 清空部署
    players.forEach(player => {
      const state = gameState.playerStates[player.name]
      state.currentBattleCities = []
      state.battleGoldSkill = null
    })

    // 检查胜负（2v2模式：一个队伍的两个中心城市都被摧毁才算输）
    const team0Alive = team0.some(p => {
      const center = p.cities[p.centerIndex || 0]
      return center && center.hp > 0
    })
    const team1Alive = team1.some(p => {
      const center = p.cities[p.centerIndex || 0]
      return center && center.hp > 0
    })

    if (!team0Alive && team1Alive) {
      winner.value = team1[0] // 蓝队获胜
      isGameOver.value = true
      addPublicLog(`\n🎉 游戏结束！蓝队(${team1.map(p => p.name).join('+')}) 获胜！`)
    } else if (!team1Alive && team0Alive) {
      winner.value = team0[0] // 红队获胜
      isGameOver.value = true
      addPublicLog(`\n🎉 游戏结束！红队(${team0.map(p => p.name).join('+')}) 获胜！`)
    } else if (!team0Alive && !team1Alive) {
      isGameOver.value = true
      addPublicLog('\n游戏结束！平局！')
    }
  }

  return {
    // 状态
    isGameOver,
    winner,
    currentBattle,

    // 方法
    initGame,
    startNewRound,
    endTurn,
    battle2P,
    battle3P,
    battle2v2,
    checkWinCondition,
    addPublicLog,
    addPrivateLog,
    calculateCityAttack,
    applyCityDamage,
    getEffectiveCityName
  }
}
