import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { processActivatedCitySkills } from './useCitySkillEffects'
import { calculateBattleResult, calculateCityPower as calculateCityPowerSimulator } from './game/useBattleSimulator'
import { updateFatigueStreaks } from './game/fatigueSystem'
import { PROVINCE_MAP } from '../data/cities'

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
    gameStore.addLog(message)
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
  function getEffectiveCityName(player, cityName) {
    const city = player.cities[cityName]
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

    // 使用当前HP而不是初始HP
    // 注意：疲劳减半已经在战斗前由applyFatigueReduction处理（直接减半HP）
    // 所以这里不需要再次处理疲劳逻辑
    let attack = city.currentHp !== undefined ? city.currentHp : city.hp

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
  function hasCityProtection(player, cityName, gameState) {
    if (!gameState.protections) return false
    if (!gameState.protections[player.name]) return false
    return gameState.protections[player.name][cityName] > 0
  }

  /**
   * 检查城市是否为钢铁城市
   */
  function isIronCity(player, cityName, gameState) {
    if (!gameState.ironCities) return false
    if (!gameState.ironCities[player.name]) return false
    return gameState.ironCities[player.name][cityName] > 0
  }

  /**
   * 处理城市受伤
   * @param {Object} city - 城市对象
   * @param {number} damage - 伤害值
   * @param {Object} player - 玩家对象
   * @param {string} cityName - 城市名称
   * @param {Object} gameState - 游戏状态
   * @returns {Object} { actualDamage, blocked, reason }
   */
  function applyCityDamage(city, damage, player, cityName, gameState) {
    // 检查城市保护
    if (hasCityProtection(player, cityName, gameState)) {
      // 移除保护罩
      delete gameState.protections[player.name][cityName]
      return {
        actualDamage: 0,
        blocked: true,
        reason: 'protection'
      }
    }

    // 检查钢铁城市
    if (isIronCity(player, cityName, gameState)) {
      gameState.ironCities[player.name][cityName]--
      if (gameState.ironCities[player.name][cityName] <= 0) {
        delete gameState.ironCities[player.name][cityName]
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

    // 确保每个玩家都有centerCityName
    if (!player1.centerCityName) {
      console.warn(`[战斗] ${player1.name} 的centerCityName未设置，使用第一个城市`)
      player1.centerCityName = Object.keys(player1.cities)[0]
    }
    if (!player2.centerCityName) {
      console.warn(`[战斗] ${player2.name} 的centerCityName未设置，使用第一个城市`)
      player2.centerCityName = Object.keys(player2.cities)[0]
    }

    const state1 = gameState.playerStates[player1.name]
    const state2 = gameState.playerStates[player2.name]

    // 确保 deadCities 数组已初始化
    if (!state1.deadCities) state1.deadCities = []
    if (!state2.deadCities) state2.deadCities = []

    // 处理战斗金币技能使用（金币已在SkillSelector中扣除，此处仅记录日志）
    ;[
      { player: player1, state: state1 },
      { player: player2, state: state2 }
    ].forEach(({ player, state }) => {
      if (state.battleGoldSkill) {
        const skillName = state.battleGoldSkill
        // 金币已经在SkillSelector -> executeXxx -> checkAndDeductGold中扣除
        // 此处不再重复扣除，仅记录日志
        addPublicLog(`${player.name} 使用战斗技能【${skillName}】`)
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
    console.log('[战斗] player1:', player1.name, 'cities数量:', Object.keys(player1.cities).length)
    console.log('[战斗] player2:', player2.name, 'cities数量:', Object.keys(player2.cities).length)

    // Normalize currentBattleCities (Firebase may convert arrays to objects)
    const rawBattle1 = Array.isArray(state1.currentBattleCities) ? state1.currentBattleCities : (state1.currentBattleCities ? Object.values(state1.currentBattleCities) : [])
    const rawBattle2 = Array.isArray(state2.currentBattleCities) ? state2.currentBattleCities : (state2.currentBattleCities ? Object.values(state2.currentBattleCities) : [])

    // Helper: resolve cityName that might be a numeric index to actual city name
    function resolveCityName(cityName, playerCities) {
      if (playerCities[cityName]) return cityName
      // Numeric index fallback: try to find the city by index
      if (!isNaN(cityName) && cityName !== '') {
        const cityNames = Object.keys(playerCities)
        const idx = Number(cityName)
        if (idx >= 0 && idx < cityNames.length) {
          console.warn(`[战斗] 修正数字cityName: "${cityName}" → "${cityNames[idx]}"`)
          return cityNames[idx]
        }
      }
      return cityName
    }

    const cities1 = rawBattle1.filter(card => card && card.cityName).map((card, mapIdx) => {
      const resolvedName = resolveCityName(card.cityName, player1.cities)
      const city = player1.cities[resolvedName]
      console.log(`[战斗诊断] ${player1.name} [${mapIdx}] cityName=${card.cityName}, resolved=${resolvedName}, city.name=${city?.name}, city.currentHp=${city?.currentHp}, city.hp=${city?.hp}, city.isAlive=${city?.isAlive}`)
      if (!city) {
        console.error(`[战斗错误] ${player1.name} cityName=${card.cityName} 对应的城市不存在！`)
        return null
      }
      return {
        ...city,
        cityName: resolvedName
      }
    }).filter(c => c !== null)
    const cities2 = rawBattle2.filter(card => card && card.cityName).map((card, mapIdx) => {
      const resolvedName = resolveCityName(card.cityName, player2.cities)
      const city = player2.cities[resolvedName]
      console.log(`[战斗诊断] ${player2.name} [${mapIdx}] cityName=${card.cityName}, resolved=${resolvedName}, city.name=${city?.name}, city.currentHp=${city?.currentHp}, city.hp=${city?.hp}, city.isAlive=${city?.isAlive}`)
      if (!city) {
        console.error(`[战斗错误] ${player2.name} cityName=${card.cityName} 对应的城市不存在！`)
        return null
      }
      return {
        ...city,
        cityName: resolvedName
      }
    }).filter(c => c !== null)

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
    // 关键修复：生于紫室的城市不应被标记为已知（该技能的核心效果之一就是保持未知）
    cities1.forEach(city => {
      if (city && city.cityName !== undefined) {
        const isPurpleChamber = gameStore.purpleChamber && gameStore.purpleChamber[player1.name] === city.name
        if (!isPurpleChamber) {
          gameStore.setCityKnown(player1.name, city.name, player2.name)
        }
      }
    })
    cities2.forEach(city => {
      if (city && city.cityName !== undefined) {
        const isPurpleChamber = gameStore.purpleChamber && gameStore.purpleChamber[player2.name] === city.name
        if (!isPurpleChamber) {
          gameStore.setCityKnown(player2.name, city.name, player1.name)
        }
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
      Object.keys(state1.activatedCitySkills).forEach(cityName => {
        const skillData = state1.activatedCitySkills[cityName]
        const actualCity = player1.cities[cityName]
        if (!actualCity || actualCity.name !== skillData.cityName) {
          console.warn(`[battle2P] ⚠️ ${player1.name} 城市技能数据不匹配: cityName=${cityName}, skillData.cityName="${skillData.cityName}", actualCity="${actualCity?.name}"`)
        }
      })
    }
    if (state2.activatedCitySkills && Object.keys(state2.activatedCitySkills).length > 0) {
      Object.keys(state2.activatedCitySkills).forEach(cityName => {
        const skillData = state2.activatedCitySkills[cityName]
        const actualCity = player2.cities[cityName]
        if (!actualCity || actualCity.name !== skillData.cityName) {
          console.warn(`[battle2P] ⚠️ ${player2.name} 城市技能数据不匹配: cityName=${cityName}, skillData.cityName="${skillData.cityName}", actualCity="${actualCity?.name}"`)
        }
      })
    }

    processActivatedCitySkills(player1, state1, player2, cities2, addPublicLog)
    processActivatedCitySkills(player2, state2, player1, cities1, addPublicLog)

    // 关键修复：检查是否有同省撤退或省会归顺事件
    // 如果有，双方攻击力都为0，不造成伤害
    console.log('[battle2P] 检查specialEventThisRound:', gameState.specialEventThisRound)
    let totalAttack1 = 0
    let totalAttack2 = 0

    if (gameState.specialEventThisRound) {
      const event = gameState.specialEventThisRound
      console.log('[battle2P] 特殊事件类型:', event.type)
      if (event.type === 'retreat' || event.type === 'surrender') {
        console.log(`[battle2P] ✅ 检测到特殊事件: ${event.type}，双方攻击力设为0`)
        totalAttack1 = 0
        totalAttack2 = 0
        addPublicLog(`>>> 触发${event.type === 'retreat' ? '同省撤退' : '省会归顺'}，双方无伤撤退`)
      }
    }

    // 如果没有特殊事件，正常计算攻击力
    if (!gameState.specialEventThisRound ||
        (gameState.specialEventThisRound.type !== 'retreat' && gameState.specialEventThisRound.type !== 'surrender')) {
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
    }

    // 草木皆兵：使用Firebase同步的battleGoldSkill判断（2P模式目标为对方）
    // 效果：对手对我的伤害减半（即减半对方的攻击力）
    if (state1.battleGoldSkill === '草木皆兵') {
      const before = totalAttack2
      totalAttack2 = Math.floor(totalAttack2 * 0.5)
      addPublicLog(`${player1.name} 使用草木皆兵，${player2.name} 对 ${player1.name} 的伤害减半（${before} → ${totalAttack2}）`)
    }
    if (state2.battleGoldSkill === '草木皆兵') {
      const before = totalAttack1
      totalAttack1 = Math.floor(totalAttack1 * 0.5)
      addPublicLog(`${player2.name} 使用草木皆兵，${player1.name} 对 ${player2.name} 的伤害减半（${before} → ${totalAttack1}）`)
    }

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

    // ========== 围魏救赵处理 ==========
    // 参考 citycard_web.html lines 4951-5015
    const wwjzCapitals = [
      '哈尔滨市', '长春市', '沈阳市', '呼和浩特市', '石家庄市', '太原市', '济南市',
      '郑州市', '西安市', '兰州市', '银川市', '西宁市', '乌鲁木齐市', '拉萨市',
      '南京市', '合肥市', '杭州市', '南昌市', '福州市', '武汉市', '长沙市',
      '广州市', '南宁市', '海口市', '成都市', '贵阳市', '昆明市', '台北市'
    ]
    const isWwjzCapital = (cityName) => wwjzCapitals.includes(cityName)
    const getProvName = (cityName) => {
      const prov = PROVINCE_MAP[cityName]
      return prov ? prov.name : null
    }
    const isActingCapitalCity = (playerName, cityName) => {
      return !!(gameStore.actingCapital && gameStore.actingCapital[playerName] &&
        gameStore.actingCapital[playerName][cityName])
    }

    for (let dir = 0; dir < 2; dir++) {
      const attackerPlayer = dir === 0 ? player1 : player2
      const defenderPlayer = dir === 0 ? player2 : player1
      const attackerCities = dir === 0 ? cities1 : cities2
      const attackerState = dir === 0 ? state1 : state2

      // 检查battleGoldSkill（Firebase同步）或gameStore.wwjz（本地）
      const hasWwjz = attackerState.battleGoldSkill === '围魏救赵' ||
        (gameStore.wwjz[attackerPlayer.name] && gameStore.wwjz[attackerPlayer.name].active)
      if (!hasWwjz) continue

      const centerCityName = defenderPlayer.centerCityName
      const centerCity = defenderPlayer.cities[centerCityName]
      if (!centerCity || centerCity.isAlive === false) continue

      // 直击中心城市（上限10000）
      const totalAttack = dir === 0 ? totalAttack1 : totalAttack2
      const cappedDamage = Math.min(Math.max(0, totalAttack), 10000)
      const oldHp = centerCity.currentHp !== undefined ? centerCity.currentHp : centerCity.hp
      centerCity.currentHp = Math.max(0, oldHp - cappedDamage)
      if (centerCity.currentHp <= 0) centerCity.isAlive = false
      addPublicLog(`  (围魏救赵) 直击中心 ${centerCity.name}，造成 ${cappedDamage} 伤害（上限10000，经屏障/绿色后）`)

      // 检查出战城市与中心城市的省份关系
      const centerProv = getProvName(centerCity.name)
      let wwjzFailed = false

      for (const attackCity of attackerCities) {
        if (!attackCity || attackCity.hp <= 0) continue
        const attackProv = getProvName(attackCity.name)

        if (centerProv && attackProv && centerProv === attackProv && centerProv !== '直辖市和特区') {
          // 检查是否是省会（包括代行省权）
          let attackIsCapital = isWwjzCapital(attackCity.name)
          if (!attackIsCapital && isActingCapitalCity(attackerPlayer.name, attackCity.cityName)) {
            attackIsCapital = true
          }
          let centerIsCapital = isWwjzCapital(centerCity.name)
          if (!centerIsCapital && isActingCapitalCity(defenderPlayer.name, centerCityName)) {
            centerIsCapital = true
          }

          if (attackIsCapital && !centerIsCapital) {
            // 出战城市是省会，中心城市归顺
            addPublicLog(`  (围魏救赵+归顺) ${attackerPlayer.name}的省会${attackCity.name}使${defenderPlayer.name}的中心${centerCity.name}归顺`)
            wwjzFailed = true
            break
          } else if (centerIsCapital && !attackIsCapital) {
            // 中心城市是省会，出战城市归顺
            addPublicLog(`  (围魏救赵+归顺) ${defenderPlayer.name}的省会中心${centerCity.name}使${attackerPlayer.name}的${attackCity.name}归顺并撤退`)
            wwjzFailed = true
            break
          } else {
            // 同省但都不是省会或都是省会，围魏救赵失效
            addPublicLog(`  (围魏救赵失效) ${attackerPlayer.name}的${attackCity.name}与${defenderPlayer.name}的中心${centerCity.name}同属${centerProv}，围魏救赵失效`)
            wwjzFailed = true
            break
          }
        }
      }

      if (!wwjzFailed) {
        addPublicLog(`  (围魏救赵) 原伤害将继续攻击对方出战城市`)
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

      // 检查防守方(player2)是否使用了吸引攻击
      const attractCity2 = (state2.battleGoldSkill === '吸引攻击' && state2.battleGoldSkillData?.selfCityName) || null
      if (attractCity2) {
        addPublicLog(`${player2.name} 使用吸引攻击，${attractCity2} 吸引全部伤害`)
      }

      // 草木皆兵：如果player2使用了草木皆兵，player1对player2的伤害减半
      const cmjbMultiplier1 = state2.battleGoldSkill === '草木皆兵' ? 0.5 : 1

      const battleSkills = {
        captureKing: hasCaptureKing,
        attractCity: attractCity2,
        damageMultiplier: cmjbMultiplier1
      }

      // 获取攻击方城市的完整对象（含城市名）
      const attackerCitiesWithName = cities1.map(c => {
        const city = player1.cities[c.cityName]
        return { ...city, cityName: c.cityName }
      })

      // 获取防守方城市的完整对象（含城市名）- 深度克隆避免被修改
      const defenderCitiesWithName = cities2.map(c => {
        const city = player2.cities[c.cityName]
        return JSON.parse(JSON.stringify({ ...city, cityName: c.cityName }))
      })

      battleResult1 = calculateBattleResult(
        attackerCitiesWithName,
        defenderCitiesWithName,
        player1,
        player2,
        gameStore,
        battleSkills
      )

      // 保存修改后的防守方城市状态（calculateBattleResult会直接修改传入的数组）
      defenderCities1 = defenderCitiesWithName

      // 记录战斗日志
      addPublicLog(`${player1.name} → ${player2.name}: 总攻击力 ${battleResult1.totalAttackPower}，净伤害 ${battleResult1.netDamage}`)

      if (battleResult1.barrierAbsorbed > 0 || battleResult1.barrierReflected > 0) {
        addPublicLog(`${player2.name} 的屏障吸收 ${battleResult1.barrierAbsorbed}，反弹 ${battleResult1.barrierReflected} 伤害${gameStore.barrier?.[player2.name] ? `（剩余${gameStore.barrier[player2.name].hp}HP）` : '（屏障被摧毁）'}`)
      }

      if (battleResult1.destroyedCities.length > 0) {
        addPublicLog(`摧毁城市: ${battleResult1.destroyedCities.join('、')}`)
      }
    }

    // 第二步：计算 player2 对 player1 的攻击（不修改原始数据）
    if (totalAttack2 > 0 && cities1.length > 0) {
      // 检查是否有擒贼擒王技能
      const hasCaptureKing = gameStore.qinwang && gameStore.qinwang.caster === player2.name && gameStore.qinwang.target === player1.name

      // 检查防守方(player1)是否使用了吸引攻击
      const attractCity1 = (state1.battleGoldSkill === '吸引攻击' && state1.battleGoldSkillData?.selfCityName) || null
      if (attractCity1) {
        addPublicLog(`${player1.name} 使用吸引攻击，${attractCity1} 吸引全部伤害`)
      }

      // 草木皆兵：如果player1使用了草木皆兵，player2对player1的伤害减半
      const cmjbMultiplier2 = state1.battleGoldSkill === '草木皆兵' ? 0.5 : 1

      const battleSkills = {
        captureKing: hasCaptureKing,
        attractCity: attractCity1,
        damageMultiplier: cmjbMultiplier2
      }

      // 获取攻击方城市的完整对象（含城市名）- 使用原始HP数据
      const attackerCitiesWithName = cities2.map(c => {
        const city = player2.cities[c.cityName]
        return { ...city, cityName: c.cityName }
      })

      // 获取防守方城市的完整对象（含城市名）- 深度克隆避免被修改
      const defenderCitiesWithName = cities1.map(c => {
        const city = player1.cities[c.cityName]
        return JSON.parse(JSON.stringify({ ...city, cityName: c.cityName }))
      })

      battleResult2 = calculateBattleResult(
        attackerCitiesWithName,
        defenderCitiesWithName,
        player2,
        player1,
        gameStore,
        battleSkills
      )

      // 保存修改后的防守方城市状态（calculateBattleResult会直接修改传入的数组）
      defenderCities2 = defenderCitiesWithName

      // 记录战斗日志
      addPublicLog(`${player2.name} → ${player1.name}: 总攻击力 ${battleResult2.totalAttackPower}，净伤害 ${battleResult2.netDamage}`)

      if (battleResult2.barrierAbsorbed > 0 || battleResult2.barrierReflected > 0) {
        addPublicLog(`${player1.name} 的屏障吸收 ${battleResult2.barrierAbsorbed}，反弹 ${battleResult2.barrierReflected} 伤害${gameStore.barrier?.[player1.name] ? `（剩余${gameStore.barrier[player1.name].hp}HP）` : '（屏障被摧毁）'}`)
      }

      if (battleResult2.destroyedCities.length > 0) {
        addPublicLog(`摧毁城市: ${battleResult2.destroyedCities.join('、')}`)
      }
    }

    // 第三步：同时应用双方的战斗结果到原始数据
    if (defenderCities1) {
      // 应用 player1 对 player2 的伤害
      defenderCities1.forEach((city) => {
        const originalCity = player2.cities[city.cityName]
        if (!originalCity) { console.warn('[battle2P] 城市不存在:', city.cityName); return }
        originalCity.currentHp = city.currentHp
        originalCity.isAlive = city.isAlive
      })

      // 记录阵亡城市名称
      if (battleResult1.destroyedCities) {
        battleResult1.destroyedCities.forEach(cityName => {
          if (!state2.deadCities.includes(cityName)) {
            state2.deadCities.push(cityName)
          }
        })
      }
    }

    if (defenderCities2) {
      // 应用 player2 对 player1 的伤害
      defenderCities2.forEach((city) => {
        const originalCity = player1.cities[city.cityName]
        if (!originalCity) { console.warn('[battle2P] 城市不存在:', city.cityName); return }
        originalCity.currentHp = city.currentHp
        originalCity.isAlive = city.isAlive
      })

      // 记录阵亡城市名称
      if (battleResult2.destroyedCities) {
        battleResult2.destroyedCities.forEach(cityName => {
          if (!state1.deadCities.includes(cityName)) {
            state1.deadCities.push(cityName)
          }
        })
      }
    }

    // 应用屏障反弹伤害到攻击方城市
    if (battleResult1 && battleResult1.barrierReflectDamage) {
      // player2的屏障反弹伤害到player1的出战城市
      Object.entries(battleResult1.barrierReflectDamage).forEach(([cityName, dmg]) => {
        const originalCity = player1.cities[cityName]
        if (!originalCity || dmg <= 0) return
        originalCity.currentHp = Math.max(0, (originalCity.currentHp ?? originalCity.hp) - dmg)
        if (originalCity.currentHp <= 0) {
          originalCity.currentHp = 0
          originalCity.isAlive = false
          if (!state1.deadCities.includes(cityName)) {
            state1.deadCities.push(cityName)
          }
        }
      })
    }
    if (battleResult2 && battleResult2.barrierReflectDamage) {
      // player1的屏障反弹伤害到player2的出战城市
      Object.entries(battleResult2.barrierReflectDamage).forEach(([cityName, dmg]) => {
        const originalCity = player2.cities[cityName]
        if (!originalCity || dmg <= 0) return
        originalCity.currentHp = Math.max(0, (originalCity.currentHp ?? originalCity.hp) - dmg)
        if (originalCity.currentHp <= 0) {
          originalCity.currentHp = 0
          originalCity.isAlive = false
          if (!state2.deadCities.includes(cityName)) {
            state2.deadCities.push(cityName)
          }
        }
      })
    }

    // 输出战斗后各城市剩余HP
    addPublicLog('')
    if (cities1 && cities1.length > 0) {
      cities1.forEach(card => {
        const city = player1.cities[card.cityName]
        if (city) {
          const currentHp = city.currentHp !== undefined ? city.currentHp : city.hp
          addPublicLog(`${player1.name} 的${city.name}剩余HP：${Math.floor(currentHp)}`)
        }
      })
    }
    if (cities2 && cities2.length > 0) {
      cities2.forEach(card => {
        const city = player2.cities[card.cityName]
        if (city) {
          const currentHp = city.currentHp !== undefined ? city.currentHp : city.hp
          addPublicLog(`${player2.name} 的${city.name}剩余HP：${Math.floor(currentHp)}`)
        }
      })
    }

    // 草木皆兵：若目标本轮未出牌，抢走1金币（使用Firebase同步的battleGoldSkill）
    ;[
      { caster: player1, casterState: state1, target: player2, targetState: state2 },
      { caster: player2, casterState: state2, target: player1, targetState: state1 }
    ].forEach(({ caster, casterState, target, targetState }) => {
      if (casterState.battleGoldSkill === '草木皆兵') {
        const rawTargetOut = Array.isArray(targetState.currentBattleCities)
          ? targetState.currentBattleCities
          : (targetState.currentBattleCities ? Object.values(targetState.currentBattleCities) : [])
        const targetOut = rawTargetOut.filter(c => c && !c.isStandGroundCity)

        if (targetOut.length === 0) {
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
    })

    // 结算金币 - 每回合基础+3（已移除摧毁对手城市的奖励）
    const base = 3
    player1.gold = Math.min(24, player1.gold + base)
    player2.gold = Math.min(24, player2.gold + base)

    // ========== 更新疲劳计数器：战斗结束后累积疲劳 ==========
    // 关键：无论是否触发撤退/归顺，出战城市都累积疲劳（+1），未出战城市归零
    updateFatigueStreaks(players, gameState, '2P')

    // 清空本回合出战城市
    state1.currentBattleCities = []
    state2.currentBattleCities = []
    state1.battleGoldSkill = null
    state1.battleGoldSkillData = null
    state2.battleGoldSkill = null
    state2.battleGoldSkillData = null

    // 自动补充roster（战斗预备城市阵亡后自动填充）
    checkRosterRefillNeeded(player1, state1)
    checkRosterRefillNeeded(player2, state2)

    // 检查生于紫室继承（必须在checkWinCondition之前）
    // 当中心城市阵亡时，生于紫室城市自动成为新中心，玩家不应被判负
    players.forEach(player => {
      gameStore.checkCenterDeathAndPurpleChamberInheritance(player)
    })

    // 检查胜负
    checkWinCondition(players, gameState)
  }

  /**
   * 自动补充战斗预备城市（roster不足时从存活城市自动填充）
   */
  function checkRosterRefillNeeded(player, playerState) {
    const rosterLimit = gameStore.gameMode === '2v2' ? 4 : 5

    // 获取所有存活城市的名称
    const aliveCityNames = Object.entries(player.cities)
      .map(([cityName, c]) => {
        const currentHp = c.currentHp !== undefined ? c.currentHp : c.hp
        const alive = c.isAlive !== false && currentHp > 0
        return { cityName, alive }
      })
      .filter(x => x.alive)
      .map(x => x.cityName)

    // 如果存活城市数 <= 预备名额，全部城市自动出阵
    if (aliveCityNames.length <= rosterLimit) {
      player.roster = aliveCityNames
      return
    }

    // 保留存活的已在roster中的城市
    const currentRoster = player.roster || []
    const keepInRoster = aliveCityNames.filter(cityName => currentRoster.includes(cityName))

    // 如果roster不足，自动从剩余存活城市中补充
    if (keepInRoster.length < rosterLimit) {
      const notInRoster = aliveCityNames.filter(cityName => !keepInRoster.includes(cityName))
      const needed = rosterLimit - keepInRoster.length
      const autoFill = notInRoster.slice(0, needed)
      player.roster = [...keepInRoster, ...autoFill]
      console.log(`[checkRosterRefillNeeded] ${player.name} 自动补充roster: +${autoFill.length}个城市`)
      return
    }

    // roster充足，保持当前
    player.roster = keepInRoster
  }

  /**
   * 检查胜负条件
   */
  function checkWinCondition(players, gameState) {
    // 检查中心城市是否被摧毁
    const alivePlayers = players.filter(player => {
      let centerCityName = player.centerCityName || Object.keys(player.cities)[0]
      // Handle numeric centerCityName from Firebase
      if (typeof centerCityName === 'number' || (typeof centerCityName === 'string' && !isNaN(centerCityName) && !player.cities[centerCityName])) {
        const cityNames = Object.keys(player.cities)
        centerCityName = cityNames[Number(centerCityName)] || cityNames[0]
      }
      const centerCity = player.cities[centerCityName]
      const hp = centerCity ? (centerCity.currentHp !== undefined ? centerCity.currentHp : centerCity.hp) : 0
      return hp > 0
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

    // 处理战斗金币技能使用（金币已在SkillSelector中扣除，此处仅记录日志）
    players.forEach(player => {
      const state = gameState.playerStates[player.name]
      if (state && state.battleGoldSkill) {
        const skillName = state.battleGoldSkill
        addPublicLog(`${player.name} 使用战斗技能【${skillName}】`)
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

          // 获取攻击城市和防守城市的完整对象（含城市名）
          const attackerCitiesData = attackingCities.map(card => ({
            ...attacker.cities[card.cityName],
            cityName: card.cityName
          }))

          // 获取防守方的反击城市
          const counterCities = defenderState.currentBattleData?.[attacker.name] || []
          const defenderCitiesData = counterCities.map(card => ({
            ...defender.cities[card.cityName],
            cityName: card.cityName
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

            if (battleResult.barrierAbsorbed > 0 || battleResult.barrierReflected > 0) {
              addPublicLog(`${defender.name} 的屏障吸收 ${battleResult.barrierAbsorbed}，反弹 ${battleResult.barrierReflected} 伤害${gameStore.barrier?.[defender.name] ? `（剩余${gameStore.barrier[defender.name].hp}HP）` : '（屏障被摧毁）'}`)
            }

            if (battleResult.destroyedCities.length > 0) {
              addPublicLog(`摧毁城市: ${battleResult.destroyedCities.join('、')}`)

              // 记录阵亡城市名称
              battleResult.destroyedCities.forEach(cityName => {
                if (!defenderState.deadCities) defenderState.deadCities = []
                if (!defenderState.deadCities.includes(cityName)) {
                  defenderState.deadCities.push(cityName)
                }
              })
            }

            // 同步HP变化
            defenderCitiesData.forEach(city => {
              const originalCity = defender.cities[city.cityName]
              if (!originalCity) { console.warn('[battle3P] 城市不存在:', city.cityName); return }
              originalCity.currentHp = city.currentHp
              originalCity.isAlive = city.isAlive
            })

            // 应用屏障反弹伤害到攻击方城市
            if (battleResult.barrierReflectDamage) {
              const attackerState = gameState.playerStates[attacker.name]
              Object.entries(battleResult.barrierReflectDamage).forEach(([cityName, dmg]) => {
                const originalCity = attacker.cities[cityName]
                if (!originalCity || dmg <= 0) return
                originalCity.currentHp = Math.max(0, (originalCity.currentHp ?? originalCity.hp) - dmg)
                if (originalCity.currentHp <= 0) {
                  originalCity.currentHp = 0
                  originalCity.isAlive = false
                  if (attackerState && attackerState.deadCities && !attackerState.deadCities.includes(cityName)) {
                    attackerState.deadCities.push(cityName)
                  }
                }
              })
            }
          }
        }
      })
    })

    // ========== 更新疲劳计数器：战斗结束后累积疲劳 ==========
    updateFatigueStreaks(players, gameState, '3P')

    // 结算金币 - 每回合基础+3
    const base = 3
    players.forEach(player => {
      player.gold = Math.min(24, player.gold + base)
    })

    // 清空所有玩家的部署
    players.forEach(player => {
      const state = gameState.playerStates[player.name]
      state.currentBattleData = {}
      state.battleGoldSkill = null
    })

    // 检查生于紫室继承（必须在checkWinCondition之前）
    players.forEach(player => {
      gameStore.checkCenterDeathAndPurpleChamberInheritance(player)
    })

    // 检查胜负
    checkWinCondition(players, gameState)
  }

  /**
   * 2v2游戏战斗计算
   */
  function battle2v2(players, gameState) {
    addPublicLog('\n=== 2v2 战斗计算 ===')

    // 处理战斗金币技能使用（金币已在SkillSelector中扣除，此处仅记录日志）
    players.forEach(player => {
      const state = gameState.playerStates[player.name]
      if (state && state.battleGoldSkill) {
        const skillName = state.battleGoldSkill
        addPublicLog(`${player.name} 使用战斗技能【${skillName}】`)
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
          city: player.cities[card.cityName],
          cityName: card.cityName
        })
      })
    })

    team1.forEach(player => {
      const state = gameState.playerStates[player.name]
      ;(state.currentBattleCities || []).forEach(card => {
        team1Cities.push({
          player,
          city: player.cities[card.cityName],
          cityName: card.cityName
        })
      })
    })

    // 处理屏障（简化处理，保留现有逻辑）
    let barrier = gameState.barrier
    if (barrier && barrier.active) {
      if (barrier.team === '红队') {
        // 蓝队攻击红队屏障
        const team1AttackPower = team1Cities.reduce((sum, { city, cityName, player }) => {
          return sum + calculateCityPower(city, city.name, player, gameStore)
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
        const team0AttackPower = team0Cities.reduce((sum, { city, cityName, player }) => {
          return sum + calculateCityPower(city, city.name, player, gameStore)
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

      const attackerCitiesWithName = team1Cities.map(c => ({ ...c.city, cityName: c.cityName }))
      const defenderCitiesWithName = team0Cities.map(c => ({ ...c.city, cityName: c.cityName }))

      // 使用第一个攻击方和第一个防守方作为代表（简化）
      const attackerPlayer = team1[0]
      const defenderPlayer = team0[0]

      const battleResult = calculateBattleResult(
        attackerCitiesWithName,
        defenderCitiesWithName,
        attackerPlayer,
        defenderPlayer,
        gameStore,
        battleSkills
      )

      addPublicLog(`蓝队 → 红队: 总攻击力 ${battleResult.totalAttackPower}，净伤害 ${battleResult.netDamage}`)

      if (battleResult.destroyedCities.length > 0) {
        addPublicLog(`摧毁城市: ${battleResult.destroyedCities.join('、')}`)

        // 记录阵亡城市名称
        battleResult.destroyedCities.forEach(cityName => {
          const deadCityData = team0Cities.find(c => c.city.name === cityName)
          if (deadCityData) {
            const state = gameState.playerStates[deadCityData.player.name]
            if (!state.deadCities) state.deadCities = []
            if (!state.deadCities.includes(cityName)) {
              state.deadCities.push(cityName)
            }
          }
        })
      }

      // 同步HP变化
      defenderCitiesWithName.forEach((city, idx) => {
        const cityData = team0Cities[idx]
        const originalCity = cityData?.player?.cities?.[cityData.cityName]
        if (!originalCity) { console.warn('[battle2v2] 城市不存在:', cityData?.cityName); return }
        originalCity.currentHp = city.currentHp
        originalCity.isAlive = city.isAlive
      })

      // 应用屏障反弹伤害到蓝队攻击方城市
      if (battleResult.barrierReflectDamage) {
        Object.entries(battleResult.barrierReflectDamage).forEach(([cityName, dmg]) => {
          const cityData = team1Cities.find(c => c.cityName === cityName)
          if (!cityData || dmg <= 0) return
          const originalCity = cityData.player?.cities?.[cityName]
          if (!originalCity) return
          originalCity.currentHp = Math.max(0, (originalCity.currentHp ?? originalCity.hp) - dmg)
          if (originalCity.currentHp <= 0) {
            originalCity.currentHp = 0
            originalCity.isAlive = false
          }
        })
      }
    }

    // 红队攻击蓝队（使用calculateBattleResult）
    if (team0Cities.length > 0 && team1Cities.length > 0 && (!barrier || !barrier.active || barrier.team !== '蓝队')) {
      const battleSkills = { captureKing: false }  // 2v2模式下暂不实现擒贼擒王

      const attackerCitiesWithName = team0Cities.map(c => ({ ...c.city, cityName: c.cityName }))
      const defenderCitiesWithName = team1Cities.map(c => ({ ...c.city, cityName: c.cityName }))

      // 使用第一个攻击方和第一个防守方作为代表（简化）
      const attackerPlayer = team0[0]
      const defenderPlayer = team1[0]

      const battleResult = calculateBattleResult(
        attackerCitiesWithName,
        defenderCitiesWithName,
        attackerPlayer,
        defenderPlayer,
        gameStore,
        battleSkills
      )

      addPublicLog(`红队 → 蓝队: 总攻击力 ${battleResult.totalAttackPower}，净伤害 ${battleResult.netDamage}`)

      if (battleResult.destroyedCities.length > 0) {
        addPublicLog(`摧毁城市: ${battleResult.destroyedCities.join('、')}`)

        // 记录阵亡城市名称
        battleResult.destroyedCities.forEach(cityName => {
          const deadCityData = team1Cities.find(c => c.city.name === cityName)
          if (deadCityData) {
            const state = gameState.playerStates[deadCityData.player.name]
            if (!state.deadCities) state.deadCities = []
            if (!state.deadCities.includes(cityName)) {
              state.deadCities.push(cityName)
            }
          }
        })
      }

      // 同步HP变化
      defenderCitiesWithName.forEach((city, idx) => {
        const cityData = team1Cities[idx]
        const originalCity = cityData?.player?.cities?.[cityData.cityName]
        if (!originalCity) { console.warn('[battle2v2] 城市不存在:', cityData?.cityName); return }
        originalCity.currentHp = city.currentHp
        originalCity.isAlive = city.isAlive
      })

      // 应用屏障反弹伤害到红队攻击方城市
      if (battleResult.barrierReflectDamage) {
        Object.entries(battleResult.barrierReflectDamage).forEach(([cityName, dmg]) => {
          const cityData = team0Cities.find(c => c.cityName === cityName)
          if (!cityData || dmg <= 0) return
          const originalCity = cityData.player?.cities?.[cityName]
          if (!originalCity) return
          originalCity.currentHp = Math.max(0, (originalCity.currentHp ?? originalCity.hp) - dmg)
          if (originalCity.currentHp <= 0) {
            originalCity.currentHp = 0
            originalCity.isAlive = false
          }
        })
      }
    }

    // 结算金币 - 每回合基础+3
    const base = 3
    players.forEach(player => {
      player.gold = Math.min(24, player.gold + base)
    })

    // ========== 更新疲劳计数器：战斗结束后累积疲劳 ==========
    updateFatigueStreaks(players, gameState, '2v2')

    // 清空部署
    players.forEach(player => {
      const state = gameState.playerStates[player.name]
      state.currentBattleCities = []
      state.battleGoldSkill = null
    })

    // 检查生于紫室继承（必须在胜负判定之前）
    players.forEach(player => {
      gameStore.checkCenterDeathAndPurpleChamberInheritance(player)
    })

    // 检查胜负（2v2模式：一个队伍的两个中心城市都被摧毁才算输）
    const team0Alive = team0.some(p => {
      const centerCityName = p.centerCityName || Object.keys(p.cities)[0]
      const center = p.cities[centerCityName]
      return center && (center.currentHp > 0 || center.hp > 0)
    })
    const team1Alive = team1.some(p => {
      const centerCityName = p.centerCityName || Object.keys(p.cities)[0]
      const center = p.cities[centerCityName]
      return center && (center.currentHp > 0 || center.hp > 0)
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
