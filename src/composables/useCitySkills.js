/**
 * 城市专属技能系统 Composable
 * 管理城市技能的执行和状态
 */

import { useGameStore } from '../stores/gameStore'
import { getCitySkill, SKILL_TYPE } from '../data/citySkills'

export function useCitySkills() {
  const gameStore = useGameStore()

  /**
   * 执行城市技能
   * @param {Object} player - 玩家对象
   * @param {Object} city - 城市对象
   * @param {Object} skill - 技能对象
   * @param {Object} params - 额外参数（如目标玩家、目标城市等）
   * @returns {Object} 执行结果
   */
  function executeCitySkill(player, city, skill, params = {}) {
    // 检查技能使用限制
    if (!canUseSkill(city, skill)) {
      return {
        success: false,
        message: '无法使用该技能'
      }
    }

    // 增加使用次数
    if (skill.limit) {
      if (!city.skillUsageCount) {
        city.skillUsageCount = 0
      }
      city.skillUsageCount++
    }

    // 根据技能效果执行
    let result = { success: true, message: '' }

    try {
      // 治疗效果
      if (skill.healAmount) {
        const targetCity = params.targetCity || city
        const healedAmount = Math.min(skill.healAmount, targetCity.hp - targetCity.currentHp)
        targetCity.currentHp = Math.min(targetCity.currentHp + skill.healAmount, targetCity.hp)
        result.message += `为 ${targetCity.name} 恢复了 ${Math.floor(healedAmount)} HP。`
      }

      // HP百分比增强
      if (skill.hpBonus) {
        const targetCity = params.targetCity || city
        const bonusHp = targetCity.hp * skill.hpBonus
        targetCity.currentHp = Math.min(targetCity.currentHp + bonusHp, targetCity.hp)
        result.message += `为 ${targetCity.name} 增加了 ${skill.hpBonus * 100}% HP。`
      }

      // HP倍数增强
      if (skill.hpMultiplier) {
        const targetCity = params.targetCity || city
        // 存储状态：进入特殊区域
        if (!targetCity.specialState) {
          targetCity.specialState = {}
        }
        targetCity.specialState.hpMultiplier = skill.hpMultiplier
        targetCity.specialState.duration = skill.duration || 1
        targetCity.specialState.startRound = gameStore.currentRound
        result.message += `${targetCity.name} 进入特殊状态，${skill.duration}回合后HP×${skill.hpMultiplier}。`
      }

      // 攻击力增强
      if (skill.powerBonus) {
        const targetCity = params.targetCity || city
        if (!targetCity.modifiers) {
          targetCity.modifiers = []
        }
        targetCity.modifiers.push({
          type: 'power_boost',
          value: skill.powerBonus,
          duration: skill.duration || 1,
          startRound: gameStore.currentRound
        })
        result.message += `${targetCity.name} 攻击力增强。`
      }

      // 护盾效果
      if (skill.shieldHp) {
        if (!gameStore.cityShields) {
          gameStore.cityShields = {}
        }
        if (!gameStore.cityShields[player.name]) {
          gameStore.cityShields[player.name] = {}
        }
        const cityIndex = player.cities.indexOf(city)
        gameStore.cityShields[player.name][cityIndex] = {
          hp: skill.shieldHp,
          maxHp: skill.shieldHp,
          duration: skill.duration || 3,
          startRound: gameStore.currentRound
        }
        result.message += `为 ${city.name} 设置了 ${skill.shieldHp}HP 的护盾。`
      }

      // 伤害减免
      if (skill.damageReduction) {
        const targetCity = params.targetCity || city
        if (!targetCity.modifiers) {
          targetCity.modifiers = []
        }
        targetCity.modifiers.push({
          type: 'damage_reduction',
          value: skill.damageReduction,
          duration: skill.duration || 1,
          startRound: gameStore.currentRound
        })
        result.message += `${targetCity.name} 获得伤害减免效果。`
      }

      // 对敌方城市造成HP减半
      if (skill.hpReduction && params.targetOpponent && params.targetOpponentCity) {
        const targetCity = params.targetOpponentCity
        const reduction = targetCity.currentHp * skill.hpReduction
        targetCity.currentHp -= reduction
        if (targetCity.currentHp <= 0) {
          targetCity.currentHp = 0
          targetCity.isAlive = false
        }
        result.message += `对 ${targetCity.name} 造成了 ${Math.floor(reduction)} HP伤害（HP减半）。`
      }

      // 金币生成
      if (skill.goldPerRound && skill.duration) {
        if (!player.skillEffects) {
          player.skillEffects = []
        }
        player.skillEffects.push({
          type: 'gold_generation',
          amount: skill.goldPerRound,
          duration: skill.duration,
          startRound: gameStore.currentRound
        })
        result.message += `接下来${skill.duration}回合，每回合额外获得${skill.goldPerRound}金币。`
      }

      // 召唤城市
      if (skill.summon) {
        // TODO: 实现召唤逻辑
        result.message += `召唤了 ${skill.summon}。`
      }

      // 技能免疫
      if (skill.skillImmune) {
        const targetCity = params.targetCity || city
        if (!targetCity.modifiers) {
          targetCity.modifiers = []
        }
        targetCity.modifiers.push({
          type: 'skill_immune',
          duration: skill.duration || 1,
          startRound: gameStore.currentRound
        })
        result.message += `${targetCity.name} 获得技能免疫效果。`
      }

      gameStore.addLog(`${player.name} 使用了 ${city.name} 的【${skill.name}】：${result.message}`)

      return {
        success: true,
        message: result.message
      }
    } catch (error) {
      console.error('执行技能时出错:', error)
      return {
        success: false,
        message: '技能执行失败：' + error.message
      }
    }
  }

  /**
   * 检查技能是否可以使用
   * @param {Object} city - 城市对象
   * @param {Object} skill - 技能对象
   * @returns {boolean}
   */
  function canUseSkill(city, skill) {
    // 城市必须存活
    if (!city.isAlive) {
      return false
    }

    // 被动技能不能手动使用
    if (skill.type === SKILL_TYPE.PASSIVE) {
      return false
    }

    // 检查使用次数限制
    if (skill.limit) {
      const usageCount = city.skillUsageCount || 0
      if (usageCount >= skill.limit) {
        return false
      }
    }

    // 检查HP要求
    if (skill.hpRequirement) {
      const currentHp = city.currentHp || city.hp
      if (skill.hpRequirement.max && currentHp >= skill.hpRequirement.max) {
        return false
      }
      if (skill.hpRequirement.min && currentHp <= skill.hpRequirement.min) {
        return false
      }
    }

    return true
  }

  /**
   * 触发被动技能（在城市出战时调用）
   * @param {Object} player - 玩家对象
   * @param {Object} city - 城市对象
   */
  function triggerPassiveSkill(player, city) {
    const skill = getCitySkill(city.name)
    if (!skill || skill.type !== SKILL_TYPE.PASSIVE) {
      return
    }

    // 检查被动技能的使用限制
    if (skill.limit) {
      const usageCount = city.skillUsageCount || 0
      if (usageCount >= skill.limit) {
        gameStore.addLog(`${city.name} 的被动技能【${skill.name}】已达到使用上限`)
        return
      }
    }

    // 执行被动技能
    gameStore.addLog(`${city.name} 触发被动技能【${skill.name}】`)

    // 根据具体技能执行效果
    executeCitySkill(player, city, skill)
  }

  /**
   * 更新技能效果（每回合结束时调用）
   */
  function updateSkillEffects() {
    const currentRound = gameStore.currentRound

    gameStore.players.forEach(player => {
      // 更新城市修饰符
      player.cities.forEach(city => {
        if (city.modifiers && city.modifiers.length > 0) {
          city.modifiers = city.modifiers.filter(modifier => {
            const elapsed = currentRound - modifier.startRound
            return elapsed < modifier.duration
          })
        }

        // 更新特殊状态
        if (city.specialState) {
          const elapsed = currentRound - city.specialState.startRound
          if (elapsed >= city.specialState.duration) {
            // 应用HP倍数效果
            if (city.specialState.hpMultiplier) {
              city.currentHp = Math.min(city.currentHp * city.specialState.hpMultiplier, 120000)
              city.hp = city.currentHp // 更新基础HP
              gameStore.addLog(`${city.name} 的HP变为 ${Math.floor(city.currentHp)}`)
            }
            delete city.specialState
          }
        }
      })

      // 更新玩家技能效果
      if (player.skillEffects && player.skillEffects.length > 0) {
        player.skillEffects = player.skillEffects.filter(effect => {
          const elapsed = currentRound - effect.startRound

          // 金币生成效果
          if (effect.type === 'gold_generation' && elapsed < effect.duration) {
            player.gold += effect.amount
            gameStore.addLog(`${player.name} 获得 ${effect.amount} 金币（技能效果）`)
            return true
          }

          return elapsed < effect.duration
        })
      }
    })

    // 更新城市护盾
    if (gameStore.cityShields) {
      Object.keys(gameStore.cityShields).forEach(playerName => {
        const playerShields = gameStore.cityShields[playerName]
        Object.keys(playerShields).forEach(cityIndex => {
          const shield = playerShields[cityIndex]
          const elapsed = currentRound - shield.startRound
          if (elapsed >= shield.duration || shield.hp <= 0) {
            delete playerShields[cityIndex]
            gameStore.addLog(`${playerName} 的城市护盾消失`)
          }
        })
      })
    }
  }

  /**
   * 初始化城市技能状态
   * @param {Object} city - 城市对象
   */
  function initializeCitySkill(city) {
    const skill = getCitySkill(city.name)
    if (skill) {
      city.skillUsageCount = 0
      city.modifiers = []
    }
  }

  return {
    executeCitySkill,
    canUseSkill,
    triggerPassiveSkill,
    updateSkillEffects,
    initializeCitySkill
  }
}
