/**
 * 游戏逻辑管理器
 * Game Logic Manager
 *
 * 处理完整的游戏流程、技能使用、战斗系统、AI逻辑等
 */

import { ref, computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useNonBattleSkills } from '../skills/nonBattleSkills'
import { useBattleSkills } from '../skills/battleSkills'
import { ALL_CITIES } from '../../data/cities'

export function useGameLogic() {
  const gameStore = useGameStore()
  const nonBattleSkills = useNonBattleSkills()
  const battleSkills = useBattleSkills()

  // 游戏状态
  const isGameOver = ref(false)
  const winner = ref(null)
  const battlePhase = ref(false)
  const currentBattles = ref([])

  // 当前玩家
  const currentPlayer = computed(() => {
    return gameStore.players?.find(p => p.name === gameStore.currentPlayer)
  })

  /**
   * 初始化游戏
   */
  function initializeGame(playerName, mode, drawnCities) {
    // 设置游戏模式
    gameStore.gameMode = mode
    gameStore.currentRound = 1
    isGameOver.value = false
    winner.value = null

    // 玩家数量
    const playerCount = mode === '2P' ? 2 : mode === '3P' ? 3 : 4

    // 创建玩家
    // 将城市数组转换为对象（以城市名称为key）
    const playerCities = {}
    drawnCities.forEach((city, index) => {
      playerCities[city.name] = {
        ...city,
        isCenter: index === 0,
        isAlive: true
      }
    })

    gameStore.players = [
      {
        name: playerName,
        gold: 2,  // 原版：初始2金币
        cities: playerCities,
        centerCityName: drawnCities[0].name,  // 使用城市名称而非索引
        battleModifiers: [],
        streaks: {},
        team: 0
      }
    ]

    // 创建AI玩家（使用排除列表避免重复城市）
    const usedCityNames = new Set()
    // 添加玩家的城市到排除列表
    drawnCities.forEach(city => usedCityNames.add(city.name))

    for (let i = 1; i < playerCount; i++) {
      const aiCities = drawRandomCities(10, Array.from(usedCityNames))  // 原版：每人10座城市，排除已使用的
      // 将AI的城市也加入排除列表
      aiCities.forEach(city => usedCityNames.add(city.name))

      // 将AI城市数组转换为对象
      const aiCitiesObj = {}
      aiCities.forEach((city, index) => {
        aiCitiesObj[city.name] = {
          ...city,
          isCenter: index === 0,
          isAlive: true
        }
      })

      gameStore.players.push({
        name: `AI玩家${i}`,
        gold: 2,  // 原版：初始2金币
        cities: aiCitiesObj,
        centerCityName: aiCities[0].name,  // 使用城市名称而非索引
        battleModifiers: [],
        streaks: {},
        team: mode === '2v2' && i > 1 ? 1 : 0,
        isAI: true
      })
    }

    // 设置当前玩家
    gameStore.currentPlayer = playerName

    // 保存初始城市状态（按城市名称追踪，而非索引）
    gameStore.initialCities = {}
    gameStore.players.forEach(player => {
      gameStore.initialCities[player.name] = {}
      Object.values(player.cities).forEach(city => {
        gameStore.initialCities[player.name][city.name] = JSON.parse(JSON.stringify(city))
      })
    })

    // 初始化状态
    initializeGameStates()

    // 添加日志
    gameStore.addLog(`游戏开始！模式：${getModeName(mode)}`)
    gameStore.addLog(`${playerName} 进入游戏！`)
    gameStore.addLog(`回合 1 - ${playerName} 的回合`)

    console.log('Game initialized:', gameStore.players)
  }

  /**
   * 初始化游戏状态
   */
  function initializeGameStates() {
    // 清空对象而不是重新赋值，以保持 reactive 和方法
    const clearObject = (obj) => {
      Object.keys(obj).forEach(key => delete obj[key])
    }

    clearObject(gameStore.protections)
    clearObject(gameStore.ironCities)
    clearObject(gameStore.anchored)
    clearObject(gameStore.disguisedCities)
    clearObject(gameStore.barrier)
    clearObject(gameStore.berserkFired)
    clearObject(gameStore.knownCities)
    gameStore.financialCrisis = null
    clearObject(gameStore.costIncrease)
    clearObject(gameStore.hjbf)
    clearObject(gameStore.purpleChamber)
    clearObject(gameStore.jianbukecui)
    clearObject(gameStore.hpBank)
    clearObject(gameStore.disaster)
    gameStore.logs.length = 0  // 清空数组而不是重新赋值
    clearObject(gameStore.privateLogs)
    clearObject(gameStore.skillUsageCount)

    // 添加辅助方法
    if (!gameStore.addLog) {
      gameStore.addLog = (message) => {
        gameStore.logs.push({
          message,
          timestamp: Date.now()
        })
      }
    }

    if (!gameStore.getProvinceName) {
      gameStore.getProvinceName = (cityName) => {
        const provinceMap = {
          '广州': '广东省',
          '深圳': '广东省',
          '石家庄': '河北省',
          '保定': '河北省',
          '唐山': '河北省',
          '厦门': '福建省',
          '苏州': '江苏省',
          '上海': '上海市',
          '北京': '北京市',
          '天津': '天津市',
          '重庆': '重庆市'
        }
        const cleanName = cityName.replace(/(市|县|区)$/g, '')
        return provinceMap[cleanName] || provinceMap[cityName] || null
      }
    }
  }

  /**
   * 抽取随机城市
   */
  function drawRandomCities(count) {
    const shuffled = [...ALL_CITIES].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count).map(city => ({
      name: city.name,
      hp: city.hp,
      currentHp: city.hp,
      baseHp: city.hp,
      red: city.red || 0,
      green: city.green || 0,
      blue: city.blue || 0,
      yellow: city.yellow || 0,
      province: city.province
    }))
  }

  /**
   * 使用技能
   */
  function useSkill(skillName, params) {
    if (!currentPlayer.value) {
      return { success: false, message: '没有当前玩家' }
    }

    console.log('Using skill:', skillName, params)

    // 检查是否为非战斗技能
    const nonBattleSkill = nonBattleSkills[`execute${skillName.replace(/\s/g, '')}`]
    if (nonBattleSkill && typeof nonBattleSkill === 'function') {
      const result = nonBattleSkill(currentPlayer.value, ...params)
      if (result.success) {
        gameStore.addLog(`${currentPlayer.value.name} 使用了技能：${skillName}`)
      }
      return result
    }

    // 检查是否为战斗技能
    const battleSkill = battleSkills[`execute${skillName.replace(/\s/g, '')}`]
    if (battleSkill && typeof battleSkill === 'function') {
      const result = battleSkill(currentPlayer.value, ...params)
      if (result.success) {
        gameStore.addLog(`${currentPlayer.value.name} 使用了战斗技能：${skillName}`)
      }
      return result
    }

    return { success: false, message: '未找到技能' }
  }

  /**
   * 结束回合
   */
  function endTurn() {
    console.log('[endTurn] 开始结束回合')
    if (!currentPlayer.value) return

    const currentIndex = gameStore.players.findIndex(p => p.name === currentPlayer.value.name)
    console.log('[endTurn] currentIndex:', currentIndex)

    // 处理回合结束效果
    processEndOfTurn(currentPlayer.value)

    // 切换到下一个玩家
    let nextIndex = (currentIndex + 1) % gameStore.players.length
    console.log('[endTurn] nextIndex:', nextIndex, 'players.length:', gameStore.players.length)

    // 跳过已经失败的玩家
    let attempts = 0
    while (isPlayerDefeated(gameStore.players[nextIndex]) && attempts < gameStore.players.length) {
      nextIndex = (nextIndex + 1) % gameStore.players.length
      attempts++
    }

    // 检查生于紫室继承（必须在checkGameOver之前）
    gameStore.players.forEach(player => {
      gameStore.checkCenterDeathAndPurpleChamberInheritance(player)
    })

    // 检查游戏是否结束
    if (checkGameOver()) {
      return
    }

    // 如果回到第一个玩家，增加回合数
    console.log('[endTurn] 检查是否回到第一个玩家: nextIndex === 0?', nextIndex === 0)
    if (nextIndex === 0) {
      console.log('[endTurn] 回到第一个玩家，调用processNewRound()')
      gameStore.currentRound++
      gameStore.addLog(`─────────────────────`)
      gameStore.addLog(`第 ${gameStore.currentRound} 回合开始`)
      processNewRound()
    }

    const nextPlayer = gameStore.players[nextIndex]
    gameStore.currentPlayer = nextPlayer.name
    gameStore.addLog(`${nextPlayer.name} 的回合`)

    // 如果是AI玩家，执行AI回合
    if (nextPlayer.isAI) {
      setTimeout(() => {
        executeAITurn(nextPlayer)
      }, 1000)
    }
  }

  /**
   * 处理回合结束效果（原版逻辑）
   * 源代码参考：citycard_web.html lines 10455-10507
   */
  function processEndOfTurn(player) {
    // 1. 减少保护回合数
    if (gameStore.protections[player.name]) {
      Object.keys(gameStore.protections[player.name]).forEach(cityName => {
        gameStore.protections[player.name][cityName]--
        if (gameStore.protections[player.name][cityName] <= 0) {
          delete gameStore.protections[player.name][cityName]
        }
      })
    }

    // 2. 减少伪装回合数
    if (gameStore.disguisedCities[player.name]) {
      Object.keys(gameStore.disguisedCities[player.name]).forEach(cityName => {
        gameStore.disguisedCities[player.name][cityName].roundsLeft--
        if (gameStore.disguisedCities[player.name][cityName].roundsLeft <= 0) {
          delete gameStore.disguisedCities[player.name][cityName]
        }
      })
    }

    // 3. 减少战斗修饰符回合数
    if (player.battleModifiers && player.battleModifiers.length > 0) {
      player.battleModifiers = player.battleModifiers.filter(mod => {
        if (mod.roundsLeft !== undefined) {
          mod.roundsLeft--
          return mod.roundsLeft > 0
        }
        return true
      })
    }

    // 4. 屏障倒计时 - 已在gameStore.advanceRound()中处理，此处不再重复

    // 4.5 高级治疗现在立即满血，仅靠 bannedCities 控制出战禁令
    // 清理旧版遗留的 healing modifiers（向后兼容）
    Object.entries(player.cities).forEach(([cityName, city]) => {
      if (!city.modifiers || !Array.isArray(city.modifiers)) return
      const healingIdx = city.modifiers.findIndex(m => m.type === 'healing')
      if (healingIdx !== -1) {
        city.modifiers.splice(healingIdx, 1)
        city.isInHealing = false
      }
    })

    // 5. 钢铁城市倒计时-1
    if (gameStore.ironCities && gameStore.ironCities[player.name]) {
      Object.keys(gameStore.ironCities[player.name]).forEach(cityName => {
        gameStore.ironCities[player.name][cityName]--
        if (gameStore.ironCities[player.name][cityName] <= 0) {
          delete gameStore.ironCities[player.name][cityName]
        }
      })
    }

    // 6. 既来则安倒计时-1
    if (gameStore.anchored && gameStore.anchored[player.name]) {
      Object.keys(gameStore.anchored[player.name]).forEach(cityName => {
        gameStore.anchored[player.name][cityName]--
        if (gameStore.anchored[player.name][cityName] <= 0) {
          delete gameStore.anchored[player.name][cityName]
        }
      })
    }

    // 7. 金币贷款倒计时-1 (已移至gameStore.updateRoundStates()统一管理)
    // 不再使用player.loanCooldown,改用gameStore.goldLoanRounds

    // 8. 生于紫室：每回合该城市HP增加（初始HP的10%）
    if (gameStore.purpleChamber && gameStore.purpleChamber[player.name]) {
      const chamberCityName = gameStore.purpleChamber[player.name]
      const chamberCity = player.cities[chamberCityName]
      if (chamberCity && chamberCity.isAlive) {
        const hpGain = Math.floor(chamberCity.baseHp * 0.1)
        chamberCity.currentHp += hpGain
        chamberCity.hp += hpGain  // 最大HP也增加
        // 使用私有日志，仅该玩家可见
        gameStore.addPrivateLog(player.name, `(生于紫室) ${chamberCity.name} HP+${hpGain}（每回合+10%）`)
      }
    }

    // 9. 深藏不露：每5回合未出战+10000HP
    if (gameStore.deepHiding && gameStore.deepHiding[player.name]) {
      Object.values(player.cities).forEach(city => {
        if (city.isAlive) {
          // 检查是否有出战记录
          const roundsSinceLastBattle = gameStore.currentRound - (city.lastBattleRound || 0)
          if (roundsSinceLastBattle > 0 && roundsSinceLastBattle % 5 === 0) {
            city.currentHp += 10000
            city.hp += 10000
            gameStore.addLog(`${city.name} 深藏不露，HP+10000`)
          }
        }
      })
    }

    // 10. 定时爆破检查
    if (gameStore.timeBomb && gameStore.timeBomb[player.name]) {
      gameStore.timeBomb[player.name].forEach(bomb => {
        bomb.roundsLeft--
        if (bomb.roundsLeft <= 0) {
          // 引爆
          const targetCity = player.cities[bomb.cityName]
          if (targetCity && targetCity.isAlive) {
            targetCity.currentHp = 0
            targetCity.isAlive = false
            gameStore.addLog(`💥 ${bomb.cityName} 定时爆破引爆！`)
          }
        }
      })
      // 清除已引爆的炸弹
      gameStore.timeBomb[player.name] = gameStore.timeBomb[player.name].filter(b => b.roundsLeft > 0)
    }

    // 11. 抛砖引玉倒计时-1，发放金币
    if (player.brickJade && player.brickJade > 0) {
      player.gold = Math.min(24, player.gold + 1)
      player.brickJade--
    }

    // 12. 血量存储利息计算
    if (gameStore.hpBank && gameStore.hpBank[player.name]) {
      const bank = gameStore.hpBank[player.name]
      const interest = Math.floor(bank.amount * 0.1)
      bank.amount += interest
      if (interest > 0) {
        gameStore.addLog(`${player.name} 的血量存储获得利息 +${interest}HP`)
      }
    }

    // 13. 海市蜃楼倒计时
    if (gameStore.mirage && gameStore.mirage[player.name]) {
      gameStore.mirage[player.name].roundsLeft--
      if (gameStore.mirage[player.name].roundsLeft <= 0) {
        delete gameStore.mirage[player.name]
      }
    }

    // 14. 厚积薄发倒计时
    if (gameStore.hjbf && gameStore.hjbf[player.name]) {
      gameStore.hjbf[player.name].roundsLeft--
      if (gameStore.hjbf[player.name].roundsLeft <= 0) {
        // 释放蓄积的能量
        const power = gameStore.hjbf[player.name].accumulatedPower || 1
        // 这里可以应用到下次战斗
        delete gameStore.hjbf[player.name]
      }
    }
  }

  /**
   * 处理新回合开始（原版逻辑）
   * 源代码参考：citycard_web.html lines 3307-3365
   */
  function processNewRound() {
    // 清除上一回合的特殊事件标记
    if (gameStore.specialEventThisRound) {
      delete gameStore.specialEventThisRound
    }

    // 调试日志：输出goldLoanRounds状态
    console.log('[processNewRound] goldLoanRounds状态:', JSON.stringify(gameStore.goldLoanRounds))

    // 1. 屏障回血 - 已在gameStore.advanceRound()中处理，此处不再重复

    // 2. 坚不可摧护盾递减轮数
    if (gameStore.jianbukecui) {
      Object.keys(gameStore.jianbukecui).forEach(playerName => {
        gameStore.jianbukecui[playerName].roundsLeft--
        if (gameStore.jianbukecui[playerName].roundsLeft <= 0) {
          delete gameStore.jianbukecui[playerName]
          gameStore.addLog(`${playerName} 的坚不可摧效果结束`)
        }
      })
    }

    // 3. 减少金融危机回合数
    if (gameStore.financialCrisis) {
      gameStore.financialCrisis.roundsLeft--
      if (gameStore.financialCrisis.roundsLeft <= 0) {
        gameStore.addLog('金融危机结束')
        gameStore.financialCrisis = null
      }
    }

    // 4. 每回合给予金币（原版：+3金币/回合）
    gameStore.players.forEach(player => {
      console.log(`[processNewRound] 处理玩家 ${player.name} 的金币，当前金币: ${player.gold}`)
      console.log(`[processNewRound] ${player.name} 的 goldLoanRounds: ${gameStore.goldLoanRounds[player.name]}`)

      if (!isPlayerDefeated(player)) {
        // 正常情况或金融危机期间都先+3金币
        if (gameStore.financialCrisis) {
          // 金融危机期间特殊处理
          const maxGoldPlayer = gameStore.players.reduce((max, p) =>
            p.gold > max.gold ? p : max
          )

          if (player.name === maxGoldPlayer.name) {
            // 金币最多的玩家无法获得金币
            gameStore.addLog(`${player.name} 金币最多，金融危机期间无法获得金币`)
          } else {
            // 其他玩家只获得+1金币
            player.gold = Math.min(24, player.gold + 1)
          }
        } else {
          // 正常情况：+3金币
          const goldGain = 3  // 原版配置
          player.gold = Math.min(24, player.gold + goldGain)
        }

        // 金币贷款：每回合扣除3金币（在自动+3之后）
        // 注意：这个逻辑已移至 gameStore.updateRoundStates() 统一处理
        // 避免重复扣除，这里不再处理
        // if (gameStore.goldLoanRounds[player.name] && gameStore.goldLoanRounds[player.name] > 0) {
        //   player.gold = Math.max(0, player.gold - 3)
        //   gameStore.addLog(`${player.name} 金币贷款冷却中(剩余${gameStore.goldLoanRounds[player.name]}回合)，扣除3金币`)
        //   gameStore.goldLoanRounds[player.name]--  // 递减冷却回合数
        // }
      }
    })
  }

  /**
   * 检查玩家是否失败
   * 规则：中心城市阵亡则玩家失败
   */
  function isPlayerDefeated(player) {
    // 获取中心城市
    const centerCity = player.cities[player.centerCityName]

    if (!centerCity) {
      console.warn(`[isPlayerDefeated] 玩家 ${player.name} 没有中心城市`)
      return true
    }

    // 检查中心城市是否阵亡
    const centerDead = centerCity.isAlive === false

    console.log(`[isPlayerDefeated] 检查玩家 ${player.name}:`, {
      centerCityName: player.centerCityName,
      centerCity: {
        name: centerCity.name,
        isAlive: centerCity.isAlive,
        currentHp: centerCity.currentHp
      },
      centerDead
    })

    return centerDead
  }

  /**
   * 检查游戏是否结束
   */
  function checkGameOver() {
    const alivePlayers = gameStore.players.filter(p => !isPlayerDefeated(p))

    if (alivePlayers.length === 1) {
      isGameOver.value = true
      winner.value = alivePlayers[0]
      gameStore.addLog(`═══════════════════════`)
      gameStore.addLog(`🏆 ${winner.value.name} 获得胜利！`)
      gameStore.addLog(`═══════════════════════`)
      return true
    }

    // 2v2模式检查团队胜利
    if (gameStore.gameMode === '2v2') {
      const team0Alive = gameStore.players.filter(p => p.team === 0 && !isPlayerDefeated(p))
      const team1Alive = gameStore.players.filter(p => p.team === 1 && !isPlayerDefeated(p))

      if (team0Alive.length === 0) {
        isGameOver.value = true
        winner.value = { name: '队伍2', isTeam: true }
        gameStore.addLog(`🏆 队伍2 获得胜利！`)
        return true
      }

      if (team1Alive.length === 0) {
        isGameOver.value = true
        winner.value = { name: '队伍1', isTeam: true }
        gameStore.addLog(`🏆 队伍1 获得胜利！`)
        return true
      }
    }

    return false
  }

  /**
   * 执行AI回合
   */
  function executeAITurn(aiPlayer) {
    console.log('AI turn:', aiPlayer.name)

    // 简单的AI逻辑
    // 1. 随机决定是否使用技能（30%概率）
    if (Math.random() < 0.3 && aiPlayer.gold >= 1) {
      // 选择一个简单的技能
      const simpleSkills = ['快速治疗', '城市保护', '金币贷款']
      const skill = simpleSkills[Math.floor(Math.random() * simpleSkills.length)]

      // 查找受伤的城市
      const injuredCity = Object.values(aiPlayer.cities).find(city => city.isAlive && city.currentHp < city.hp)

      if (skill === '快速治疗' && injuredCity && aiPlayer.gold >= 1) {
        const result = nonBattleSkills.executeKuaiSuZhiLiao(aiPlayer, injuredCity)
        if (result.success) {
          gameStore.addLog(`${aiPlayer.name} 使用了 ${skill}`)
        }
      } else if (skill === '城市保护' && aiPlayer.gold >= 1) {
        const cityToProtect = Object.values(aiPlayer.cities).find(city => city.isAlive && city.isCenter)
        if (cityToProtect) {
          const result = nonBattleSkills.executeCityProtection(aiPlayer, cityToProtect)
          if (result.success) {
            gameStore.addLog(`${aiPlayer.name} 使用了 ${skill}`)
          }
        }
      } else if (skill === '金币贷款' && aiPlayer.gold >= 1 && aiPlayer.gold < 20) {
        const result = nonBattleSkills.executeJinBiDaiKuan(aiPlayer)
        if (result.success) {
          gameStore.addLog(`${aiPlayer.name} 使用了 ${skill}`)
        }
      }
    }

    // 2. 等待一秒后自动结束回合
    setTimeout(() => {
      endTurn()
    }, 1500)
  }

  /**
   * 治疗城市（快捷功能）
   */
  function healCity(player, cityName) {
    const city = player.cities[cityName]
    if (!city || !city.isAlive) {
      return { success: false, message: '城市不存在或已阵亡' }
    }

    const result = nonBattleSkills.executeKuaiSuZhiLiao(player, city)
    if (result.success) {
      gameStore.addLog(`${player.name} 治疗了 ${city.name}`)
    }
    return result
  }

  /**
   * 获取模式名称
   */
  function getModeName(mode) {
    const names = {
      '2P': '双人对战',
      '3P': '三人混战',
      '2v2': '2v2团战'
    }
    return names[mode] || mode
  }

  /**
   * 重置游戏
   */
  function resetGame() {
    isGameOver.value = false
    winner.value = null
    battlePhase.value = false
    currentBattles.value = []
    gameStore.players = []
    gameStore.currentPlayer = null
    gameStore.currentRound = 0
    gameStore.logs = []
  }

  return {
    // 状态
    isGameOver,
    winner,
    battlePhase,
    currentBattles,
    currentPlayer,

    // 方法
    initializeGame,
    useSkill,
    endTurn,
    healCity,
    checkGameOver,
    resetGame,
    isPlayerDefeated,
    processNewRound  // 关键修复：导出processNewRound函数，用于同省撤退/归顺时的金币+3等回合状态更新
  }
}
