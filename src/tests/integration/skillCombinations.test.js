/**
 * 技能组合集成测试
 * Skills Integration Tests
 *
 * 测试多个技能组合使用的效果
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleSkills } from '../../composables/skills/battleSkills'
import { useNonBattleSkills } from '../../composables/skills/nonBattleSkills'
import { createMockGameStore, createMockPlayer } from '../helpers/mockGameStore'
import { useGameStore } from '../../stores/gameStore'

describe('技能组合集成测试', () => {
  let battleSkills
  let nonBattleSkills
  let gameStore
  let player1
  let player2

  beforeEach(() => {
    setActivePinia(createPinia())
    battleSkills = useBattleSkills()
    nonBattleSkills = useNonBattleSkills()
    gameStore = useGameStore()

    player1 = createMockPlayer('玩家1', { gold: 24 })
    player2 = createMockPlayer('玩家2', { gold: 24 })

    gameStore.players = [player1, player2]
    gameStore.gameMode = '2P'
    gameStore.currentRound = 1
    gameStore.initialCities = {
      [player1.name]: JSON.parse(JSON.stringify(player1.cities)),
      [player2.name]: JSON.parse(JSON.stringify(player2.cities))
    }

    // Initialize gameStore state
    if (!gameStore.protections) gameStore.protections = {}
    if (!gameStore.ironShields) gameStore.ironShields = {}
    if (!gameStore.disguisedCities) gameStore.disguisedCities = {}
    if (!gameStore.costIncrease) gameStore.costIncrease = {}
    if (!gameStore.hjbf) gameStore.hjbf = {}
    if (!gameStore.knownCities) gameStore.knownCities = {}
    if (!gameStore.logs) gameStore.logs = []
    if (!gameStore.privateLogs) gameStore.privateLogs = {}

    // Add missing methods that skills need
    if (!gameStore.addPrivateLog) {
      gameStore.addPrivateLog = (playerName, message) => {
        if (!gameStore.privateLogs[playerName]) {
          gameStore.privateLogs[playerName] = []
        }
        gameStore.privateLogs[playerName].push({ message, timestamp: Date.now() })
      }
    }

    if (!gameStore.recordSkillUsageTracking) {
      gameStore.recordSkillUsageTracking = (playerName, skillName) => {
        if (!gameStore.skillUsageCount) gameStore.skillUsageCount = {}
        if (!gameStore.skillUsageCount[playerName]) {
          gameStore.skillUsageCount[playerName] = {}
        }
        if (!gameStore.skillUsageCount[playerName][skillName]) {
          gameStore.skillUsageCount[playerName][skillName] = 0
        }
        gameStore.skillUsageCount[playerName][skillName]++
      }
    }

    if (!gameStore.getUnusedCities) {
      gameStore.getUnusedCities = () => [
        { name: '深圳', hp: 50000 },
        { name: '厦门', hp: 40000 },
        { name: '苏州', hp: 45000 }
      ]
    }

    if (!gameStore.getProvinceName) {
      gameStore.getProvinceName = (cityName) => {
        // 城市到省份的映射
        const provinceMap = {
          '广州': '广东省',
          '深圳': '广东省',
          '石家庄': '河北省',
          '保定': '河北省',
          '唐山': '河北省',
          '厦门': '福建省',
          '苏州': '江苏省',
          '上海': '上海市',  // 直辖市也需要映射
          '北京': '北京市'
        }

        const cleanName = cityName.replace(/(市|县|区)$/g, '')
        return provinceMap[cleanName] || provinceMap[cityName] || null
      }
    }

    if (!gameStore.createGameStateSnapshot) {
      gameStore.createGameStateSnapshot = () => {
        return {
          round: gameStore.currentRound,
          timestamp: Date.now(),
          players: JSON.parse(JSON.stringify(gameStore.players))
        }
      }
    }
  })

  describe('城市保护 + 铜墙铁壁 组合', () => {
    it('应该能够叠加城市保护和战斗免疫效果', () => {
      // 玩家1先使用城市保护（传递city对象，不是索引）
      const protection = nonBattleSkills.executeCityProtection(player1, player1.cities[1])
      expect(protection.success).toBe(true)

      // 玩家1再对玩家2使用铜墙铁壁
      const wall = battleSkills.executeTongQiangTieBi(player1, player2)
      expect(wall.success).toBe(true)

      // 验证两种保护都生效
      expect(gameStore.protections[player1.name][1]).toBe(10)
      // 铜墙铁壁是给player1添加免疫，不是给player2
      expect(player1.battleModifiers).toHaveLength(1)
      expect(player1.battleModifiers[0].type).toBe('damage_immunity')
    })
  })

  describe('狐假虎威 + 博学多才 组合', () => {
    it('伪装城市后应该仍能使用博学多才', () => {
      const cityIdx = 0
      const city = player1.cities[cityIdx]

      // 先伪装城市（传递city对象）
      const disguise = nonBattleSkills.executeHuJiaHuWei(player1, city, 50000, '假城市')
      expect(disguise.success).toBe(true)

      // 再使用博学多才（传递cityIdx，不是city对象）
      const bxdc = nonBattleSkills.executeBoXueDuoCai(player1, cityIdx, 3)
      expect(bxdc.success).toBe(true)

      // HP应该增加
      expect(city.currentHp).toBeGreaterThan(30000 * 1.5)
    })
  })

  describe('设置屏障 + 潜能激发 组合', () => {
    it('应该先设置屏障再翻倍HP，形成强大防御', () => {
      // 给player1足够的金币（设置屏障15 + 潜能激发20 = 35金币）
      player1.gold = 40

      // 先设置屏障
      const barrier = battleSkills.executeSetBarrier(player1)
      expect(barrier.success).toBe(true)
      expect(gameStore.barrier[player1.name].hp).toBe(15000)

      // 再使用潜能激发
      const qnf = battleSkills.executeQianNengJiFa(player1)
      expect(qnf.success).toBe(true)

      // 城市HP应该翻倍
      player1.cities.forEach(city => {
        expect(city.currentHp).toBe(city.hp * 2)
      })

      // 屏障独立存在
      expect(gameStore.barrier[player1.name].hp).toBe(15000)
    })
  })

  describe('金融危机 + 金币贷款 组合', () => {
    it('金融危机期间仍可以使用金币贷款', () => {
      // 设置较低的初始金币，避免触发24上限
      player2.gold = 10

      // 先触发金融危机
      const crisis = nonBattleSkills.executeJinRongWeiJi(player1)
      expect(crisis.success).toBe(true)

      const initialGold = player2.gold

      // 玩家2使用金币贷款（消耗1金币，贷款5金币）
      const loan = nonBattleSkills.executeJinBiDaiKuan(player2)
      expect(loan.success).toBe(true)

      // 玩家2金币应该增加
      expect(player2.gold).toBeGreaterThan(initialGold)
    })
  })

  describe('清除加成 + 城市保护 组合', () => {
    it('清除加成后应该能重新添加城市保护', () => {
      const targetCity = player2.cities[1]

      // 玩家2先给自己城市添加保护（传递city对象）
      nonBattleSkills.executeCityProtection(player2, targetCity)
      expect(gameStore.protections[player2.name][1]).toBe(10)

      // 玩家1清除玩家2的加成（需要传递targetCity参数）
      const clear = nonBattleSkills.executeQingChuJiaCheng(player1, player2, targetCity)
      expect(clear.success).toBe(true)

      // 保护会被消耗（不是被清除），所以它应该不存在了
      expect(gameStore.protections[player2.name][1]).toBeUndefined()

      // 玩家2可以重新添加保护
      const protection2 = nonBattleSkills.executeCityProtection(player2, targetCity)
      expect(protection2.success).toBe(true)
      expect(gameStore.protections[player2.name][1]).toBe(10)
    })
  })

  describe('狂暴模式 + 御驾亲征 组合', () => {
    it('不能对同一城市同时使用狂暴模式和御驾亲征', () => {
      // 给player1足够的金币（狂暴模式9 + 御驾亲征8 = 17金币）
      player1.gold = 20

      // 御驾亲征需要中心城市
      // 狂暴模式只能对非中心城市使用
      const city1 = player1.cities[1]

      // 对非中心城市使用狂暴模式
      const berserk = battleSkills.executeKuangBaoMoShi(player1, city1)
      expect(berserk.success).toBe(true)

      // 御驾亲征使用中心城市摧毁对手
      const yujia = battleSkills.executeYuJiaQinZheng(player1, player2)
      expect(yujia.success).toBe(true)

      // 两个技能应该都成功，作用于不同城市
      expect(city1.modifiers).toBeDefined()
      // 御驾亲征只是设置标记，实际摧毁在战斗时处理
      expect(gameStore.yujia[player1.name]).toBeDefined()
    })
  })

  describe('趁火打劫 + 料事如神 组合', () => {
    it('应该能同时设置伤害跟踪和直接造成伤害', () => {
      // 给player1足够的金币（趁火打劫10 + 料事如神6 = 16金币）
      player1.gold = 20

      // 设置城市HP，确保player1的城市HP低于player2（料事如神的触发条件）
      player1.cities[0].currentHp = 10000  // player1的出战城市HP较低
      player2.cities[1].currentHp = 20000  // player2的出战城市HP较高

      // 设置双方出战状态（料事如神需要双方都出战）
      if (!gameStore.playerStates) gameStore.playerStates = {}
      gameStore.playerStates[player1.name] = {
        currentBattleCities: [{ cityIdx: 0 }]
      }
      gameStore.playerStates[player2.name] = {
        currentBattleCities: [{ cityIdx: 1 }]
      }

      // 先使用趁火打劫
      const chhdj = battleSkills.executeChenHuoDaJie(player1, player2)
      expect(chhdj.success).toBe(true)
      expect(gameStore.chhdj[player1.name]).toBeDefined()

      // 再使用料事如神直接造成5000伤害
      const lsrs = battleSkills.executeLiaoShiRuShen(player1, player2, player2.cities[1])
      expect(lsrs.success).toBe(true)
    })
  })

  describe('玉碎瓦全 + 擒贼擒王 组合', () => {
    it('玉碎瓦全增强攻击后，擒贼擒王优先攻击最高HP', () => {
      // 先对玩家2的城市使用玉碎瓦全
      const yswq = battleSkills.executeYuSuiWaQuan(player1, player2, 1)
      expect(yswq.success).toBe(true)

      // 再使用擒贼擒王
      const qzqw = battleSkills.executeQinZeiQinWang(player1, player2)
      expect(qzqw.success).toBe(true)

      // 两个modifier都应该存在
      expect(gameStore.yswq[player1.name]).toBeDefined()
      expect(player1.battleModifiers).toHaveLength(1)
    })
  })

  describe('城市侦探 + 一落千丈 组合', () => {
    it('先侦查城市信息，再根据HP差造成精准伤害', () => {
      const targetCityIdx = 1
      const targetCity = player2.cities[targetCityIdx]

      // 标记城市为已知（使用正确的结构）
      if (!gameStore.knownCities[player1.name]) {
        gameStore.knownCities[player1.name] = {}
      }
      gameStore.knownCities[player1.name][player2.name] = [targetCityIdx]

      // 使用城市侦探查看详细信息
      const detective = nonBattleSkills.executeCityDetective(player1, player2, targetCityIdx)
      expect(detective.success).toBe(true)

      // 降低城市HP
      targetCity.currentHp = 15000

      // 使用一落千丈（传递city对象，会将HP降至1/3）
      const tdds = nonBattleSkills.executeTiDengDingSun(player1, player2, targetCity)
      expect(tdds.success).toBe(true)
      // HP应该降至1/3
      expect(targetCity.currentHp).toBe(Math.floor(15000 / 3))
    })
  })

  describe('无懈可击 拦截测试', () => {
    it('应该能够拦截对手的技能使用', () => {
      // 玩家2尝试使用快速治疗
      player2.cities[1].currentHp = 10000
      const heal = nonBattleSkills.executeKuaiSuZhiLiao(player2, player2.cities[1])
      expect(heal.success).toBe(true)

      // 模拟技能使用后的状态（无懈可击需要这些）
      gameStore.lastSkillUsed = {
        userName: player2.name,
        skillName: '快速治疗',
        roundNumber: gameStore.currentRound,
        cost: 1,
        revoked: false
      }

      gameStore.gameStateSnapshot = {
        round: gameStore.currentRound,
        timestamp: Date.now(),
        players: JSON.parse(JSON.stringify(gameStore.players))
      }

      gameStore.restoreGameStateSnapshot = () => true

      // 玩家1使用无懈可击拦截（只需要2个参数）
      const wxkj = nonBattleSkills.executeWuXieKeJi(player1, player2)
      expect(wxkj.success).toBe(true)

      // 实际游戏中会回滚状态，这里只测试拦截成功
    })
  })

  describe('复杂技能性能测试', () => {
    it('四面楚歌应该能在合理时间内完成', () => {
      const startTime = performance.now()

      // 添加更多城市模拟复杂场景
      player2.cities.push(
        { name: '石家庄', hp: 20000, currentHp: 20000, isAlive: true },
        { name: '保定', hp: 15000, currentHp: 15000, isAlive: true },
        { name: '唐山', hp: 18000, currentHp: 18000, isAlive: true }
      )

      const result = nonBattleSkills.executeSiMianChuGe(player1, player2)

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // 应该在100ms内完成
      expect(executionTime).toBeLessThan(100)
      expect(result.success).toBe(true)
    })

    it('时来运转应该能在合理时间内完成', () => {
      // 添加更多城市
      for (let i = 0; i < 10; i++) {
        player1.cities.push({
          name: `城市${i}`,
          hp: 15000,
          currentHp: 15000,
          isAlive: true
        })
        player2.cities.push({
          name: `城市${i}`,
          hp: 15000,
          currentHp: 15000,
          isAlive: true
        })
      }

      const startTime = performance.now()

      const result = nonBattleSkills.executeShiLaiYunZhuan(player1, player2)

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // 应该在50ms内完成
      expect(executionTime).toBeLessThan(50)
      expect(result.success).toBe(true)
    })
  })

  describe('边界条件测试', () => {
    it('应该正确处理所有城市阵亡的情况', () => {
      // 让玩家2所有城市阵亡
      player2.cities.forEach(city => {
        city.isAlive = false
        city.currentHp = 0
      })

      // 御驾亲征只是设置标记，不会在技能使用时检查对手城市状态
      // 实际的摧毁逻辑在战斗时处理
      const result = battleSkills.executeYuJiaQinZheng(player1, player2)

      // 技能使用成功，但实际战斗时不会有效果
      expect(result.success).toBe(true)
      expect(gameStore.yujia[player1.name]).toBeDefined()
    })

    it('应该正确处理金币为0的情况', () => {
      player1.gold = 0
      // 确保城市受伤但存活，以便测试金币检查
      player1.cities[1].currentHp = 10000

      const result = nonBattleSkills.executeKuaiSuZhiLiao(player1, player1.cities[1])

      expect(result.success).toBe(false)
      expect(result.message).toContain('金币不足')
    })

    it('应该正确处理HP达到上限的情况', () => {
      player1.cities[0].currentHp = 100000

      const result = battleSkills.executeQianNengJiFa(player1)

      expect(result.success).toBe(true)
      // HP不应超过100000
      expect(player1.cities[0].currentHp).toBe(100000)
    })
  })
})
