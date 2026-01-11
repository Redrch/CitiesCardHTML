/**
 * 城市卡牌游戏 - 技能元数据模块
 * 包含技能分类、战斗技能列表等配置信息
 */

import { SKILL_COSTS, SKILL_DESCRIPTIONS } from '../utils/constants'

// 战斗金币技能列表
const BATTLE_SKILLS = [
  '按兵不动',
  '擒贼擒王', '草木皆兵', '越战越勇',
  '吸引攻击', '既来则安',
  '铜墙铁壁',
  '料事如神', '暗度陈仓',
  '背水一战', '同归于尽',
  '御驾亲征',
  '欲擒故纵', '草船借箭',
  '狂暴模式', '以逸待劳',
  '趁火打劫', '晕头转向', '隔岸观火', '挑拨离间',
  '反戈一击',
  '围魏救赵',
  '设置屏障',
  '潜能激发'
];

// 非战斗金币技能列表
const NON_BATTLE_SKILLS = [
  '转账给他人', '无知无畏', '先声夺人', '金币贷款', '金融危机', '定海神针',
  '焕然一新', '抛砖引玉', '城市保护', '进制扭曲', '快速治疗', '改弦更张', '借尸还魂', '苟延残喘', '高级治疗',
  '众志成城', '整齐划一', '清除加成', '钢铁城市', '时来运转', '实力增强',
  '城市试炼', '人质交换', '釜底抽薪', '避而不见', '劫富济贫', '一触即发', '技能保护', '突破瓶颈', '坚不可摧', '李代桃僵', '天灾人祸',
  '博学多才', '血量存储', '海市蜃楼', '解除封锁', '提灯定损', '好高骛远', '数位反转', '目不转睛',
  '连续打击', '波涛汹涌', '狂轰滥炸', '横扫一空', '万箭齐发', '玉碎瓦全', '声东击西',
  '移花接木', '连锁反应', '招贤纳士', '不露踪迹', '降维打击',
  '狐假虎威', '过河拆桥', '厚积薄发', '无中生有', '深藏不露', '定时爆破', '永久摧毁',
  '搬运救兵·普通', '电磁感应', '士气大振', '战略转移', '无懈可击',
  '趁其不备·随机', '自相残杀', '当机立断', '中庸之道', '搬运救兵·高级', '强制迁都·普通', '言听计从',
  '趁其不备·指定', '行政中心', '夷为平地', '生于紫室', '副中心制', '以礼来降', '计划单列',
  '强制迁都·高级版', '四面楚歌', '事半功倍', '城市侦探', '城市预言',
  '一举两得', '明察秋毫', '拔旗易帜', '守望相助', '代行省权', '倒反天罡', '大义灭亲', '强制搬运', '步步高升'
];

/**
 * 判断技能是否为战斗技能
 * @param {string} skillName - 技能名称
 * @returns {boolean} 是否为战斗技能
 */
function isBattleSkill(skillName) {
  return BATTLE_SKILLS.includes(skillName);
}

/**
 * 判断技能是否为非战斗技能
 * @param {string} skillName - 技能名称
 * @returns {boolean} 是否为非战斗技能
 */
function isNonBattleSkill(skillName) {
  return NON_BATTLE_SKILLS.includes(skillName);
}

/**
 * 获取所有战斗技能列表
 * @returns {Array<string>} 战斗技能名称数组
 */
function getBattleSkills() {
  return [...BATTLE_SKILLS];
}

/**
 * 获取所有非战斗技能列表
 * @returns {Array<string>} 非战斗技能名称数组
 */
function getNonBattleSkills() {
  return [...NON_BATTLE_SKILLS];
}

/**
 * 获取所有技能列表（战斗+非战斗）
 * @returns {Array<string>} 全部技能名称数组
 */
function getAllSkills() {
  return [...BATTLE_SKILLS, ...NON_BATTLE_SKILLS];
}

/**
 * 按金币消耗排序技能列表
 * @param {Array<string>} skillNames - 技能名称数组
 * @returns {Array<Object>} 包含name, cost, desc的技能对象数组
 */
function sortSkillsByCost(skillNames) {
  return skillNames
    .map(name => ({
      name,
      cost: SKILL_COSTS[name] || 0,
      desc: SKILL_DESCRIPTIONS[name] || '暂无描述'
    }))
    .sort((a, b) => a.cost - b.cost);
}

/**
 * 获取技能的完整信息
 * @param {string} skillName - 技能名称
 * @returns {Object|null} 技能信息对象 {name, cost, desc, type}
 */
function getSkillInfo(skillName) {
  if (!SKILL_COSTS.hasOwnProperty(skillName)) {
    return null;
  }

  return {
    name: skillName,
    cost: SKILL_COSTS[skillName] || 0,
    desc: SKILL_DESCRIPTIONS[skillName] || '暂无描述',
    type: isBattleSkill(skillName) ? 'battle' : 'nonBattle'
  };
}

// 导出技能元数据
export {
  BATTLE_SKILLS,
  NON_BATTLE_SKILLS,
  isBattleSkill,
  isNonBattleSkill,
  getBattleSkills,
  getNonBattleSkills,
  getAllSkills,
  sortSkillsByCost,
  getSkillInfo
};
