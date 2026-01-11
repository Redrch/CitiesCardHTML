/**
 * 战斗技能单元测试
 * Battle Skills Unit Tests
 *
 * 测试覆盖：10个代表性战斗技能
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBattleSkills } from '../../composables/skills/battleSkills'
import { createMockGameStore, createMockPlayer } from '../helpers/mockGameStore'
import { useGameStore } from '../../stores/gameStore'

describe('战斗技能单元测试', () => {
  let battleSkills
  let gameStore
  let caster
  let target

  beforeEach(() => {
    // 设置Pinia实例
    setActivePinia(createPinia())

    // 获取battle skills composable
    battleSkills = useBattleSkills()

    // 创建mock数据
    gameStore = useGameStore()
    caster = createMockPlayer('玩家1', { gold: 50 })
    target = createMockPlayer('玩家2', { gold: 50 })

    // 初始化gameStore
    gameStore.players = [caster, target]
    gameStore.gameMode = '2P'
    gameStore.currentRound = 1
  })

  describe('擒贼擒王 - executeQinZeiQinWang', () => {
    it('应该成功设置优先攻击血量最高城市的modifier', () => {
      const result = battleSkills.executeQinZeiQinWang(caster, target)

      expect(result.success).toBe(true)
      expect(result.message).toContain('优先攻击血量最高的城市')
      expect(caster.battleModifiers).toHaveLength(1)
      expect(caster.battleModifiers[0].type).toBe('attack_priority')
      expect(caster.battleModifiers[0].value).toBe('highest_hp')
      expect(caster.battleModifiers[0].duration).toBe(1)
    })
  })

  describe('草木皆兵 - executeCaoMuJieBing', () => {
    it('应该成功对对手设置伤害减半modifier', () => {
      const result = battleSkills.executeCaoMuJieBing(caster, target)

      expect(result.success).toBe(true)
      expect(result.message).toContain('减半')
      expect(target.battleModifiers).toHaveLength(1)
      expect(target.battleModifiers[0].type).toBe('damage_reduction')
      expect(target.battleModifiers[0].value).toBe(0.5)
      expect(target.battleModifiers[0].duration).toBe(1)
      expect(target.battleModifiers[0].source).toBe(caster.name)
    })
  })

  describe('越战越勇 - executeYueZhanYueYong', () => {
    it('应该成功给疲劳城市添加忽略疲劳modifier', () => {
      const selfCity = caster.cities[1]  // 选择非中心城市

      // 设置上轮出战记录
      caster.streaks = { 1: 1 }  // 城市索引1上轮出战过

      const result = battleSkills.executeYueZhanYueYong(caster, selfCity)

      expect(result.success).toBe(true)
      expect(result.message).toContain('不受疲劳影响')
      expect(selfCity.modifiers).toBeDefined()
      expect(selfCity.modifiers).toHaveLength(1)
      expect(selfCity.modifiers[0].type).toBe('ignore_fatigue')
    })

    it('应该在未选择城市时返回失败', () => {
      const result = battleSkills.executeYueZhanYueYong(caster, null)

      expect(result.success).toBe(false)
      expect(result.message).toContain('未选择城市')
    })
  })

  describe('铜墙铁壁 - executeTongQiangTieBi', () => {
    it('应该成功对对手设置伤害免疫modifier', () => {
      const result = battleSkills.executeTongQiangTieBi(caster, target)

      expect(result.success).toBe(true)
      expect(result.message).toContain('完全无效')
      // 铜墙铁壁是给caster添加免疫，不是给target
      expect(caster.battleModifiers).toHaveLength(1)
      expect(caster.battleModifiers[0].type).toBe('damage_immunity')
      expect(caster.battleModifiers[0].duration).toBe(1)
    })
  })

  describe('设置屏障 - executeSetBarrier', () => {
    it('应该成功创建15000HP的屏障', () => {
      const result = battleSkills.executeSetBarrier(caster)

      expect(result.success).toBe(true)
      expect(result.message).toContain('15000')
      expect(gameStore.barrier[caster.name]).toBeDefined()
      expect(gameStore.barrier[caster.name].hp).toBe(15000)
      expect(gameStore.barrier[caster.name].maxHp).toBe(15000)
      expect(gameStore.barrier[caster.name].roundsLeft).toBe(5)
    })
  })

  describe('潜能激发 - executeQianNengJiFa', () => {
    it('应该将所有存活城市HP翻倍（上限100000）', () => {
      // 设置初始HP
      caster.cities.forEach(city => {
        city.currentHp = 10000
      })

      const result = battleSkills.executeQianNengJiFa(caster)

      expect(result.success).toBe(true)
      expect(result.message).toContain('翻倍')
      caster.cities.forEach(city => {
        expect(city.currentHp).toBe(20000)
      })
    })

    it('应该限制HP上限为100000', () => {
      caster.cities[0].currentHp = 60000

      const result = battleSkills.executeQianNengJiFa(caster)

      expect(result.success).toBe(true)
      expect(caster.cities[0].currentHp).toBe(100000)  // 限制上限
    })
  })

  describe('御驾亲征 - executeYuJiaQinZheng', () => {
    it('应该设置御驾亲征标记', () => {
      // 设置不同血量
      target.cities[0].currentHp = 10000
      target.cities[1].currentHp = 25000  // 最高
      target.cities[2].currentHp = 15000

      const result = battleSkills.executeYuJiaQinZheng(caster, target)

      expect(result.success).toBe(true)
      expect(result.message).toContain('摧毁')
      // 御驾亲征只是设置标记，实际摧毁在战斗时处理
      expect(gameStore.yujia).toBeDefined()
      expect(gameStore.yujia[caster.name]).toBeDefined()
      expect(gameStore.yujia[caster.name].target).toBe(target.name)
    })

    it('应该在没有中心城市时返回失败', () => {
      caster.cities[0].isCenter = false

      const result = battleSkills.executeYuJiaQinZheng(caster, target)

      expect(result.success).toBe(false)
      expect(result.message).toContain('没有中心城市')
    })
  })

  describe('狂暴模式 - executeKuangBaoMoShi', () => {
    it('应该成功设置攻击力×5的狂暴modifier', () => {
      const selfCity = caster.cities[1]

      const result = battleSkills.executeKuangBaoMoShi(caster, selfCity)

      expect(result.success).toBe(true)
      expect(result.message).toContain('狂暴模式')
      expect(selfCity.modifiers).toBeDefined()
      expect(selfCity.modifiers[0].type).toBe('berserk')
      expect(selfCity.modifiers[0].powerMultiplier).toBe(5)
    })

    it('应该记录狂暴模式使用状态', () => {
      const selfCity = caster.cities[1]

      battleSkills.executeKuangBaoMoShi(caster, selfCity)

      expect(gameStore.berserkFired[caster.name]).toBeDefined()
      expect(gameStore.berserkFired[caster.name][1]).toBeDefined()
    })

    it('应该禁止同一城市再次使用狂暴模式', () => {
      const selfCity = caster.cities[1]

      // 第一次使用
      battleSkills.executeKuangBaoMoShi(caster, selfCity)

      // 第二次使用应该失败
      const result2 = battleSkills.executeKuangBaoMoShi(caster, selfCity)

      expect(result2.success).toBe(false)
      expect(result2.message).toContain('已使用过')
    })
  })

  describe('趁火打劫 - executeChenHuoDaJie', () => {
    it('应该成功设置伤害跟踪标记', () => {
      const result = battleSkills.executeChenHuoDaJie(caster, target)

      expect(result.success).toBe(true)
      expect(result.message).toContain('金币')
      expect(gameStore.chhdj[caster.name]).toBeDefined()
      expect(gameStore.chhdj[caster.name].target).toBe(target.name)
      expect(gameStore.chhdj[caster.name].damageDealt).toBe(0)
    })

    it('应该在未选择对手时返回失败', () => {
      const result = battleSkills.executeChenHuoDaJie(caster, null)

      expect(result.success).toBe(false)
      expect(result.message).toContain('未选择对手')
    })
  })

  describe('玉碎瓦全 - executeYuSuiWaQuan', () => {
    it('应该成功设置玉碎瓦全标记', () => {
      const targetCityIdx = 1

      const result = battleSkills.executeYuSuiWaQuan(caster, target, targetCityIdx)

      expect(result.success).toBe(true)
      expect(result.message).toContain('玉碎瓦全')
      expect(gameStore.yswq[caster.name]).toBeDefined()
      expect(gameStore.yswq[caster.name].targetPlayer).toBe(target.name)
      expect(gameStore.yswq[caster.name].targetCityIdx).toBe(targetCityIdx)
      expect(gameStore.yswq[caster.name].bannedProtection).toBe(true)
    })

    it('应该清除目标城市的保护罩', () => {
      const targetCityIdx = 1

      // 设置保护罩
      gameStore.protections[target.name] = { 1: 5 }

      const result = battleSkills.executeYuSuiWaQuan(caster, target, targetCityIdx)

      expect(result.success).toBe(true)
      expect(gameStore.protections[target.name][1]).toBeUndefined()
    })

    it('应该限制每局最多使用2次', () => {
      // 第一次
      battleSkills.executeYuSuiWaQuan(caster, target, 1)
      // 第二次
      battleSkills.executeYuSuiWaQuan(caster, target, 2)
      // 第三次应该失败
      const result3 = battleSkills.executeYuSuiWaQuan(caster, target, 0)

      expect(result3.success).toBe(false)
      expect(result3.message).toContain('最多使用2次')
    })

    it('应该在未选择目标城市时返回失败', () => {
      const result = battleSkills.executeYuSuiWaQuan(caster, target, null)

      expect(result.success).toBe(false)
      expect(result.message).toContain('未选择目标城市')
    })
  })
})
