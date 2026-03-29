/**
 * 技能系统 Composable
 * 管理技能的使用、冷却、限制等
 */

import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { SKILL_COSTS, SKILL_DESCRIPTIONS } from '../utils/constants'
import { BATTLE_SKILLS, NON_BATTLE_SKILLS } from '../data/skillMetadata'

export function useSkills() {
  const gameStore = useGameStore()

  // 技能使用记录 { skillName: { usedCount, lastUsedRound, onCooldown } }
  const skillUsageMap = ref({})

  // 技能限制配置
  const skillRestrictions = {
    '按兵不动': { cooldown: 3, limit: 3 },
    '草木皆兵': { cooldown: 2, limit: 0 },
    '越战越勇': { cooldown: 2, limit: 0 },
    '吸引攻击': { cooldown: 3, limit: 2 },
    '既来则安': { cooldown: 0, limit: 2 },
    '铜墙铁壁': { cooldown: 5, limit: 3 },
    '背水一战': { cooldown: 0, limit: 0 },
    '料事如神': { cooldown: 0, limit: 0 },
    '暗度陈仓': { cooldown: 3, limit: 0 },
    '同归于尽': { cooldown: 0, limit: 0 },
    '声东击西': { cooldown: 0, limit: 0 },
    '御驾亲征': { cooldown: 0, limit: 0 },
    '狂暴模式': { cooldown: 0, limit: 0 }, // 每个城市限用1次
    '以逸待劳': { cooldown: 0, limit: 2 },
    '欲擒故纵': { cooldown: 0, limit: 2 },
    '趁火打劫': { cooldown: 0, limit: 0 },
    '晕头转向': { cooldown: 0, limit: 2 },
    '隔岸观火': { cooldown: 0, limit: 1 },
    '挑拨离间': { cooldown: 0, limit: 1 },
    '反戈一击': { cooldown: 0, limit: 0 },
    '围魏救赵': { cooldown: 0, limit: 2 },
    '设置屏障': { cooldown: 0, limit: 0 },
    '潜能激发': { cooldown: 0, limit: 0 },
    '草船借箭': { cooldown: 0, limit: 1 },
    '玉碎瓦全': { cooldown: 0, limit: 2 },
    // 非战斗技能
    '无知无畏': { cooldown: 3, limit: 2 },
    '先声夺人': { cooldown: 3, limit: 2 },
    '金币贷款': { cooldown: 0, limit: 1 },
    '金融危机': { cooldown: 0, limit: 1 },
    '定海神针': { cooldown: 1, limit: 3 },
    '焕然一新': { cooldown: 0, limit: 2 },
    '拔旗易帜': { cooldown: 0, limit: 1 },
    '城市保护': { cooldown: 5, limit: 2 },
    '进制扭曲': { cooldown: 3, limit: 2 },
    '快速治疗': { cooldown: 3, limit: 2 },
    '改弦更张': { cooldown: 0, limit: 2 },
    '借尸还魂': { cooldown: 5, limit: 3 },
    '苟延残喘': { cooldown: 0, limit: 1 },
    '整齐划一': { cooldown: 0, limit: 1 },
    '高级治疗': { cooldown: 3, limit: 2 },
    '众志成城': { cooldown: 0, limit: 1 },
    '代行省权': { cooldown: 0, limit: 1 },
    '清除加成': { cooldown: 3, limit: 2 },
    '钢铁城市': { cooldown: 3, limit: 0 },
    '时来运转': { cooldown: 0, limit: 0 },
    '实力增强': { cooldown: 5, limit: 0 },
    '城市试炼': { cooldown: 5, limit: 0 }
    // ... 可以继续添加更多技能
  }

  /**
   * 检查技能是否可用
   * @param {string} skillName - 技能名称
   * @param {string} playerName - 玩家名称
   * @param {number} playerGold - 玩家金币数
   * @returns {Object} { canUse: boolean, reason: string }
   */
  function canUseSkill(skillName, playerName, playerGold) {
    const cost = SKILL_COSTS[skillName]
    if (cost === undefined) {
      return { canUse: false, reason: '未知技能' }
    }

    // 检查金币
    if (playerGold < cost) {
      return { canUse: false, reason: `金币不足（需要${cost}金币）` }
    }

    const usage = skillUsageMap.value[`${playerName}_${skillName}`]
    if (!usage) {
      return { canUse: true, reason: '' }
    }

    const restriction = skillRestrictions[skillName]
    if (!restriction) {
      return { canUse: true, reason: '' }
    }

    // 检查冷却
    if (restriction.cooldown > 0 && usage.onCooldown) {
      const remainingRounds = restriction.cooldown - (gameStore.currentRound - usage.lastUsedRound)
      if (remainingRounds > 0) {
        return { canUse: false, reason: `冷却中（剩余${remainingRounds}回合）` }
      }
    }

    // 检查使用次数限制
    if (restriction.limit > 0 && usage.usedCount >= restriction.limit) {
      return { canUse: false, reason: `已达使用上限（${restriction.limit}次）` }
    }

    return { canUse: true, reason: '' }
  }

  /**
   * 使用技能
   * @param {string} skillName - 技能名称
   * @param {string} playerName - 玩家名称
   * @param {Object} params - 技能参数
   * @returns {Object} 技能使用结果
   */
  function useSkill(skillName, playerName, params = {}) {
    const key = `${playerName}_${skillName}`

    if (!skillUsageMap.value[key]) {
      skillUsageMap.value[key] = {
        usedCount: 0,
        lastUsedRound: 0,
        onCooldown: false
      }
    }

    const usage = skillUsageMap.value[key]
    usage.usedCount++
    usage.lastUsedRound = gameStore.currentRound
    usage.onCooldown = true

    // 记录日志
    gameStore.addLog(`${playerName} 使用了技能: ${skillName}`)

    // 返回技能执行结果（具体实现在各个技能处理函数中）
    return {
      success: true,
      skillName,
      playerName,
      message: `成功使用 ${skillName}`
    }
  }

  /**
   * 获取所有可用技能
   * @param {string} type - 技能类型 'battle' 或 'nonBattle'
   * @returns {Array} 技能列表
   */
  function getAvailableSkills(type = 'all') {
    let skills = []

    if (type === 'battle' || type === 'all') {
      skills.push(...BATTLE_SKILLS)
    }

    if (type === 'nonBattle' || type === 'all') {
      skills.push(...NON_BATTLE_SKILLS)
    }

    return skills.map(name => ({
      name,
      cost: SKILL_COSTS[name] || 0,
      description: SKILL_DESCRIPTIONS[name] || '',
      type: BATTLE_SKILLS.includes(name) ? 'battle' : 'nonBattle'
    }))
  }

  /**
   * 重置技能冷却（新回合时调用）
   */
  function updateCooldowns() {
    for (const key in skillUsageMap.value) {
      const usage = skillUsageMap.value[key]
      const skillName = key.split('_').slice(1).join('_')
      const restriction = skillRestrictions[skillName]

      if (restriction && restriction.cooldown > 0) {
        const roundsPassed = gameStore.currentRound - usage.lastUsedRound
        if (roundsPassed >= restriction.cooldown) {
          usage.onCooldown = false
        }
      }
    }
  }

  /**
   * 重置所有技能使用记录（新游戏时调用）
   */
  function resetAllSkills() {
    skillUsageMap.value = {}
  }

  /**
   * 获取技能详细信息
   * @param {string} skillName - 技能名称
   * @returns {Object} 技能信息
   */
  function getSkillInfo(skillName) {
    return {
      name: skillName,
      cost: SKILL_COSTS[skillName] || 0,
      description: SKILL_DESCRIPTIONS[skillName] || '',
      restriction: skillRestrictions[skillName] || null,
      type: BATTLE_SKILLS.includes(skillName) ? 'battle' : 'nonBattle'
    }
  }

  return {
    // 数据
    skillUsageMap,
    skillRestrictions,

    // 方法
    canUseSkill,
    useSkill,
    getAvailableSkills,
    updateCooldowns,
    resetAllSkills,
    getSkillInfo
  }
}
