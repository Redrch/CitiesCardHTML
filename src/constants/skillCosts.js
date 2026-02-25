/**
 * 技能金币成本表
 * Skill Gold Costs
 *
 * 来源：citycard_web.html lines 827-850
 * 完全按照原版定义，不做任何简化
 */

export const SKILL_COSTS = {
  // === 战斗金币技能 ===
  '按兵不动': 2,      // 注意：3P模式下为4金币，需要在技能中特殊处理
  '擒贼擒王': 3,
  '草木皆兵': 3,
  '越战越勇': 3,
  '吸引攻击': 4,
  '既来则安': 4,
  '铜墙铁壁': 5,
  '背水一战': 6,      // 原版：6金币
  '料事如神': 6,
  '暗度陈仓': 6,
  '同归于尽': 7,
  '声东击西': 3,
  '连续打击': 7,
  '御驾亲征': 8,
  '草船借箭': 8,
  '狂暴模式': 7,  // 9→7
  '以逸待劳': 6,  // 9→6
  '欲擒故纵': 7,      // 原版：7金币
  '趁火打劫': 8,  // 10→8
  '晕头转向': 10,
  '隔岸观火': 10,
  '挑拨离间': 10,
  '反戈一击': 11,
  '围魏救赵': 12,  // 13→12
  '玉碎瓦全': 5,
  '设置屏障': 15,
  '潜能激发': 20,

  // === 非战斗金币技能 ===
  '转账给他人': 0,    // 特殊：转移金币，不消耗成本
  '无知无畏': 2,
  '先声夺人': 1,
  '金币贷款': 1,
  '定海神针': 1,
  '城市侦探': 1,
  '金融危机': 1,
  '焕然一新': 2,
  '抛砖引玉': 2,
  '改弦更张': 2,
  '拔旗易帜': 3,
  '城市保护': 3,
  '快速治疗': 3,
  '一举两得': 3,
  '明察秋毫': 3,
  '借尸还魂': 4,
  '高级治疗': 4,
  '进制扭曲': 4,
  '整齐划一': 4,
  '苟延残喘': 4,
  '城市试炼': 4,
  '代行省权': 5,
  '众志成城': 5,
  '清除加成': 5,
  '钢铁城市': 5,
  '时来运转': 5,
  '实力增强': 5,
  '人质交换': 4,  // 5→4
  '釜底抽薪': 5,
  '避而不见': 5,
  '劫富济贫': 5,
  '一触即发': 5,
  '技能保护': 5,
  '无中生有': 5,
  '突破瓶颈': 5,
  '坚不可摧': 5,
  '守望相助': 6,
  '博学多才': 6,
  '李代桃僵': 6,
  '天灾人祸': 6,
  '血量存储': 6,
  '海市蜃楼': 6,
  '城市预言': 6,
  '倒反天罡': 7,
  '解除封锁': 7,
  '一落千丈': 7,
  '点石成金': 7,
  '寸步难行': 7,
  '数位反转': 7,
  '波涛汹涌': 8,
  '狂轰滥炸': 8,
  '横扫一空': 7,  // 8→7
  '万箭齐发': 8,
  '移花接木': 7,  // 8→7
  '连锁反应': 7,  // 8→7
  '招贤纳士': 8,
  '不露踪迹': 7,  // 9→7
  '降维打击': 8,  // 9→8
  '狐假虎威': 7,  // 9→7
  '过河拆桥': 9,
  '厚积薄发': 9,
  '深藏不露': 8,  // 10→8
  '定时爆破': 8,  // 10→8
  '灰飞烟灭': 9,  // 11→9
  '搬运救兵·普通': 11,
  '电磁感应': 9,  // 11→9
  '士气大振': 8,  // 11→8
  '战略转移': 9,  // 11→9
  '无懈可击': 11,
  '趁其不备·随机': 10,  // 11→10
  '自相残杀': 9,  // 12→9
  '当机立断': 10,  // 12→10
  '中庸之道': 12,
  '步步高升': 12,
  '事半功倍': 1,      // 特殊：禁用技能，花费为目标技能一半向上取整（1-8金币），此处设为最低消费1
  '大义灭亲': 13,
  '搬运救兵·高级': 13,
  '强制转移·普通': 13,
  '强制搬运': 13,
  '言听计从': 13,
  '趁其不备·指定': 13,  // 14→13
  '行政中心': 15,
  '夷为平地': 12,  // 15→12
  '副中心制': 11,  // 16→11
  '以礼来降': 15,
  '生于紫室': 16,
  '计划单列': 14,  // 17→14
  '强制转移·高级': 19,
  '四面楚歌': 23
}

/**
 * 获取技能实际成本（考虑釜底抽薪效果）
 * @param {string} skillName - 技能名称
 * @param {Object} caster - 施法者
 * @param {Object} gameStore - 游戏状态
 * @returns {number} 实际金币成本
 */
export function getActualSkillCost(skillName, caster, gameStore) {
  const baseCost = SKILL_COSTS[skillName] || 0

  // 检查是否受到釜底抽薪影响（8金币及以上技能费用增加50%）
  if (baseCost >= 8 && gameStore.costIncrease && gameStore.costIncrease[caster.name]) {
    return Math.ceil(baseCost * 1.5)
  }

  return baseCost
}

/**
 * 检查并扣除技能金币
 * @param {string} skillName - 技能名称
 * @param {Object} caster - 施法者
 * @param {Object} gameStore - 游戏状态
 * @returns {Object} { success: boolean, message?: string, cost: number }
 */
export function checkAndDeductGold(skillName, caster, gameStore) {
  const baseCost = SKILL_COSTS[skillName]

  if (baseCost === undefined) {
    return {
      success: false,
      message: `未知技能：${skillName}`,
      cost: 0
    }
  }

  // 检查技能是否被禁用（事半功倍）
  if (gameStore.bannedSkills?.[caster.name]?.[skillName]) {
    return {
      success: false,
      message: `技能"${skillName}"已被事半功倍禁用`,
      cost: 0
    }
  }

  const actualCost = getActualSkillCost(skillName, caster, gameStore)

  // 金币不足检查
  if (caster.gold < actualCost) {
    return {
      success: false,
      message: `${caster.name} 金币不足（需要${actualCost}，当前${caster.gold}）`,
      cost: actualCost
    }
  }

  // 扣除金币
  caster.gold -= actualCost

  // 如果使用了8金币及以上技能且有釜底抽薪标记，消耗标记
  if (baseCost >= 8 && gameStore.costIncrease && gameStore.costIncrease[caster.name]) {
    gameStore.addLog(`(釜底抽薪生效) ${caster.name} 使用高级技能，费用从${baseCost}增加到${actualCost}`)
    delete gameStore.costIncrease[caster.name]
  }

  return {
    success: true,
    cost: actualCost
  }
}
