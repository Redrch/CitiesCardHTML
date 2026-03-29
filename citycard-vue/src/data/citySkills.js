/**
 * 城市专属技能数据
 * City-Specific Skills Data
 *
 * 来源：城市卡牌游戏城市专属技能.txt
 */

/**
 * 城市技能类型枚举
 */
export const SKILL_TYPE = {
  PASSIVE: 'passive',      // 被动技能（出战时自动触发）
  ACTIVE: 'active',        // 主动技能（需要点击使用）
  TOGGLE: 'toggle'         // 切换技能（可开关）
}

/**
 * 城市专属技能数据
 * 格式：{ [城市名]: { name, description, type, limit, effect, ... } }
 */
export const CITY_SKILLS = {
  // === 直辖市 ===
  '北京市': {
    name: '首都权威',
    description: '出战时攻击力增加20%（限2次），且可以归顺对方出战城市（限1次，不能归顺对方中心）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    powerBoostLimit: 2,
    surrenderLimit: 1,
    powerBoostMultiplier: 1.2
  },

  '天津市': {
    name: '津门守卫',
    description: 'HP增加50%，己方中心受到攻击时50%伤害转移至天津市，若天津市为中心，HPx2，但攻击力只能在此基础上增加50%（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    hpBonus: 1.5,
    damageTransfer: 0.5,
    capitalBonus: { hp: 2, powerLimit: 1.5 }
  },

  '重庆市': {
    name: '山城迷踪',
    description: '限2次，出战时使对方出战城市HP减半，若摧毁对方某城市且己方城市存活则可获得初始状态的该城市',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    hpReduction: 0.5
  },

  '上海市': {
    name: '经济中心',
    description: '限2次，出战后三回合每回合额外增加2个金币',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    duration: 3,
    goldPerRound: 2
  },

  '香港特别行政区': {
    name: '东方之珠',
    description: '限2次，己方城市单回合攻击力增加20%且受到伤害减半',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    powerBonus: 1.2,
    damageReduction: 0.5
  },

  '澳门特别行政区': {
    name: '赌城风云',
    description: '限2次，指定对方一座已知城市无法使用城市专属技能',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    requiresTarget: true
  },

  // === 江苏省 ===
  '南京市': {
    name: '古都守护',
    description: '限2次，出战时给己方一个持续3回合的10000HP护盾，对方伤害优先打在护盾上',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    duration: 3,
    shieldHp: 10000
  },

  '无锡市': {
    name: '灵山大佛',
    description: '限2次，给己方一个城市3回合的护盾，在此期间免除任何技能的额外影响',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    duration: 3,
    requiresTarget: true,
    skillImmune: true
  },

  '徐州市': {
    name: '汉王故里',
    description: '限2次，给己方一座城市+5000HP',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    healAmount: 5000,
    requiresTarget: true
  },

  '常州市': {
    name: '恐龙震慑',
    description: '出战时减少对方所有出战城市2000HP（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    damageToAll: 2000
  },

  '苏州市': {
    name: '园林迷阵',
    description: '限1次，出战时使对方城市进入园林迷阵，并直接减少50%HP，不对己方城市造成伤害，50%概率直接摧毁一座对方出战城市',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    hpReduction: 0.5,
    destroyChance: 0.5
  },

  '南通市': {
    name: '南通小卷',
    description: '限1次，选定对方一座城市，接下来2回合必须连续出战造成疲劳',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    duration: 2,
    requiresTarget: true
  },

  '连云港市': {
    name: '花果山',
    description: '限2次，选定己方一座城市进入花果山2回合，2回合后该城市HP×2（HP15000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    duration: 2,
    hpMultiplier: 2,
    hpRequirement: { max: 15000 },
    requiresTarget: true
  },

  '淮安市': {
    name: '盱眙小龙虾',
    description: '限3次，给己方一座城市+500HP的回血',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 3,
    healAmount: 500,
    requiresTarget: true
  },

  '盐城市': {
    name: '无山阻隔',
    description: '限2次，出战时己方优先对对方城市造成伤害并直接撤退（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 2,
    strikeFirst: true
  },

  '扬州市': {
    name: '美食之都',
    description: '限1次，给己方5座城市+2000HP的回血',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    healAmount: 2000,
    targetCount: 5,
    requiresMultipleSelfCities: true
  },

  '镇江市': {
    name: '镇江香醋',
    description: '限3次，给己方一座城市+500HP的回血',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 3,
    healAmount: 500,
    requiresTarget: true
  },

  '泰州市': {
    name: '医药城',
    description: '限2次，给己方2个城市HP恢复到原始HP的80%',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    healPercent: 0.8,
    targetCount: 2,
    requiresMultipleSelfCities: true
  },

  '宿迁市': {
    name: '项王故里',
    description: '出战时增加2000攻击力（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    powerBonus: 2000
  },

  // === 浙江省 ===
  '杭州市': {
    name: '西湖秘境',
    description: '限1次，己方一座城市进入西湖秘境3回合，3回合后HPx3且随后出战的两回合受到伤害减半（HP12000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    duration: 3,
    powerMultiplier: 3,
    damageReduction: 0.5,
    afterDuration: 2,
    hpRequirement: { max: 12000 },
    requiresTarget: true
  },

  '宁波市': {
    name: '宁波港',
    description: '限2次，给己方3座城市+3000HP',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    healAmount: 3000,
    targetCount: 3,
    requiresMultipleSelfCities: true
  },

  '温州市': {
    name: '方言谜语',
    description: '限1次，己方接下来两个非战斗金币技能使用自动隐藏，无人知晓',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    hiddenSkills: 2
  },

  '绍兴市': {
    name: '鲁迅文学',
    description: '限1次，给己方2座城市HP增加40%（HP20000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    hpBonus: 0.4,
    targetCount: 2,
    hpRequirement: { max: 20000 },
    requiresMultipleSelfCities: true
  },

  '湖州市': {
    name: '笔走龙蛇',
    description: '己方城市发动攻击时，有20%概率使本次攻击力提升50%',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    chance: 0.2,
    powerBonus: 1.5
  },

  '嘉兴市': {
    name: '南湖印记',
    description: '限1次，己方一座城市HP增加20%且攻击力永久为HP的2倍（HP10000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    hpBonus: 0.2,
    powerMultiplier: 2,
    hpRequirement: { max: 10000 },
    requiresTarget: true
  },

  '金华市': {
    name: '世界义乌',
    description: '获得分身义乌市，加入己方阵营并一起出战',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    summon: '义乌市'
  },

  '衢州市': {
    name: '三头一掌',
    description: '限2次，出战时随机辣到对方一座城市并减少20%HP，且接下来2回合该城市禁止出战，若强制出战则HP减半（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 2,
    hpReduction: 0.2,
    duration: 2
  },

  '台州市': {
    name: '天台山',
    description: '限1次，己方一座城市禁止出战2回合，2回合后恢复至初始HP（HP8000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 2,
    hpRequirement: { max: 8000 },
    requiresTarget: true,
    restoreToInitialHp: true
  },

  '丽水市': {
    name: '景宁畲乡',
    description: '限1次，给己方一座城市2000HP的护盾，接下来该城市出战的两回合受到伤害优先打在护盾上',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    shieldHp: 2000,
    duration: 2,
    requiresTarget: true
  },

  '舟山市': {
    name: '舟山海鲜',
    description: '限1次，给己方3座城市HP增加20%（HP20000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',  // 非战斗技能，可以不出战使用
    limit: 1,
    hpBonus: 0.2,
    targetCount: 3,
    hpRequirement: { max: 20000 },
    requiresMultipleSelfCities: true  // 需要选择多个己方城市
  },

  // === 山东省 ===
  '济南市': {
    name: '泉城水攻',
    description: '限2次，出战时对方城市HP减少20%，溢出伤害40%打在对方首都上（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 2,
    hpReduction: 0.2,
    overflowDamage: 0.4
  },

  '青岛市': {
    name: '青岛啤酒',
    description: '限2次，对对方一座HP在5000以下的城市使用该技能，该城市对对方HP前三的另一座城市攻击并自毁，另一座城市扣除相应HP（若扣除HP大于本身HP则阵亡）（对方城市数量≥5时可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    targetHpRequirement: { max: 5000 },
    minEnemyCities: 5,
    requiresTarget: true
  },

  '淄博市': {
    name: '淄博烧烤',
    description: '限2次，给己方2座城市+1000HP',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    healAmount: 1000,
    targetCount: 2,
    requiresMultipleSelfCities: true
  },

  '枣庄市': {
    name: '台儿庄战役',
    description: '限1次，使己方一座城市攻击力永久增加50%（HP20000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    powerBonus: 1.5,
    permanent: true,
    hpRequirement: { max: 20000 },
    requiresTarget: true
  },

  '东营市': {
    name: '胜利油田',
    description: '限2次，给己方2座城市+1000HP',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    healAmount: 1000,
    targetCount: 2,
    requiresMultipleSelfCities: true
  },

  '烟台市': {
    name: '蓬莱仙境',
    description: '限1次，己方一座城市进入蓬莱仙境2回合，2回合后HP×2并获得8000HP的护盾，出战时对方伤害优先打在护盾上（HP15000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 2,
    hpMultiplier: 2,
    shieldHp: 8000,
    hpRequirement: { max: 15000 },
    requiresTarget: true
  },

  '潍坊市': {
    name: '风筝探测',
    description: '限1次，得知对方三座未知城市（未知城市＜3时无法使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    revealCount: 3,
    minUnknownCities: 3
  },

  '济宁市': {
    name: '孔孟故里',
    description: '限2次，给己方2座城市+1000HP',
    type: SKILL_TYPE.ACTIVE,
    limit: 2,
    healAmount: 1000,
    targetCount: 2,
    category: 'nonBattle',  // 非战斗技能，可以不出战使用
    requiresMultipleSelfCities: true  // 需要选择多个己方城市
  },

  '泰安市': {
    name: '泰山压顶',
    description: '限1次，选定对方一座城市，接下来3回合禁止出战，若强制出战HP减半',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 3,
    requiresTarget: true,
    forcedHpPenalty: 0.5
  },

  '威海市': {
    name: '刘公岛',
    description: '限1次，选定己方一座城市禁止出战2回合，2回合后恢复至初始HP（HP8000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 2,
    hpRequirement: { max: 8000 },
    requiresTarget: true,
    restoreToInitialHp: true
  },

  '日照市': {
    name: '城建幻觉',
    description: '限1次，假扮为HP为10000以上的某一城市并出战，当战力达到原日照市战力及以下时公布真实身份并自毁',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    disguiseHpRequirement: { min: 10000 },
    requiresTarget: true
  },

  // 滨州市暂无技能

  '德州市': {
    name: '德州扒鸡',
    description: '限3次，给己方一座城市+500HP的回血',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 3,
    healAmount: 500,
    requiresTarget: true
  },

  '聊城市': {
    name: '东阿阿胶',
    description: '限3次，给己方一座城市+500HP的回血',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 3,
    healAmount: 500,
    requiresTarget: true
  },

  '临沂市': {
    name: '物流之都',
    description: '限1次，对方接下来使用的一个城市专属技能转移到己方城市上使用',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    stealNextSkill: true
  },

  '菏泽市': {
    name: '菏泽牡丹',
    description: '限1次，选定己方一座城市禁止出战2回合，2回合后恢复至初始HP（HP8000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 2,
    hpRequirement: { max: 8000 },
    requiresTarget: true,
    restoreToInitialHp: true
  },

  // === 湖北省 ===
  '武汉市': {
    name: '九省通衢',
    description: '限2次，随机获得2座HP8000以下的城市加入己方',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    summonCount: 2,
    summonHpRequirement: { max: 8000 }
  },

  // 黄石市暂无技能

  '十堰市': {
    name: '武当山',
    description: '限1次，己方中心免除3回合的攻击（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 3,
    capitalProtection: true
  },

  '荆州市': {
    name: '三国战场',
    description: '限2次，出战时对方城市攻击力减少50%，己方城市攻击力增加50%（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 2,
    enemyPowerReduction: 0.5,
    allyPowerBonus: 1.5
  },

  '宜昌市': {
    name: '三峡大坝',
    description: '限1次，建立一座持续5回合的10000HP护盾，对方攻击优先打在护盾上',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 5,
    shieldHp: 10000
  },

  '襄阳市': {
    name: '隆中景区',
    description: '限1次，对方必须提前选好后2轮出战的城市及使用技能，并告诉己方',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    revealRounds: 2,
    requiresTarget: true
  },

  // 鄂州市暂无技能
  // 荆门市暂无技能
  // 黄冈市暂无技能
  // 孝感市暂无技能

  '咸宁市': {
    name: '火烧赤壁',
    description: '限1次，选择对方2座城市，当一座城市受到伤害时，另一座城市受到相应的50%伤害，2回合伤害后该技能效果结束',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 2,
    targetCount: 2,
    sharedDamage: 0.5,
    requiresTarget: true
  },

  // 仙桃市暂无技能

  '潜江市': {
    name: '潜江小龙虾',
    description: '限2次，给己方一座城市+500HP的回血',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    healAmount: 500,
    requiresTarget: true
  },

  '神农架林区': {
    name: '野人出没',
    description: '限1次，出战时设置一个HP为1000的野人投影，可以增加攻击力和防御力，一回合后投影自动消失（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 1,
    duration: 1,
    projectionHp: 1000,
    projectionBonus: true
  },

  // 天门市暂无技能

  '恩施州': {
    name: '土家风情',
    description: '限1次，给己方一座城市2000HP的护盾，出战时对方攻击优先打在护盾上',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    shieldHp: 2000,
    requiresTarget: true
  },

  '随州市': {
    name: '神农故里',
    description: '限1次，己方一座城市攻击力翻倍2回合',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 2,
    powerMultiplier: 2,
    requiresTarget: true
  },

  // === 广东省 ===
  '广州市': {
    name: '千年商都',
    description: '限1次，消耗一金币随机获得一个HP10000以下的对方城市(可以被定海神针抵消)',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    goldCost: 1,
    captureHpRequirement: { max: 10000 },
    canBeBlocked: true
  },

  '深圳市': {
    name: '特区领袖',
    description: '限1次，选定己方三座HP低于15000的城市HP×2',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    targetCount: 3,
    hpMultiplier: 2,
    targetHpRequirement: { max: 15000 },
    requiresMultipleSelfCities: true
  },

  '珠海市': {
    name: '浪漫海滨',
    description: '限2次，出战时对方城市对己方城市攻击减半（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 2,
    damageReduction: 0.5
  },

  '汕头市': {
    name: '侨乡潮韵',
    description: '限1次，召唤揭阳市和潮州市加入己方，若该城市在己方则HPx2',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    summonCities: ['揭阳市', '潮州市'],
    hpMultiplier: 2
  },

  '佛山市': {
    name: '房产大亨',
    description: '出战时对方所有HP低于该城市的城市对该城市的攻击减少40%（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    damageReductionFromWeaker: 0.4
  },

  '韶关市': {
    name: '丹霞古韵',
    description: '限1次，本回合敌方派出的城市中HP最高的城市攻击视为无效，若只有一个城市那么伤害减半',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    nullifyHighestHp: true,
    singleTargetReduction: 0.5
  },

  '湛江市': {
    name: '南国港湾',
    description: '限1次，让我方一个城市进入港湾三回合，3回合后该城市恢复至满血并HP×2(HP8000以下可使用)',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 3,
    hpMultiplier: 2,
    hpRequirement: { max: 8000 },
    requiresTarget: true,
    fullHeal: true
  },

  '肇庆市': {
    name: '山水砚都',
    description: '限3次，给己方一个城市持续两回合的500HP的护盾，若该护盾两个回合内没有被击破，那么变为永久HP',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 3,
    duration: 2,
    shieldHp: 500,
    permanentIfSurvives: true,
    requiresTarget: true
  },

  '江门市': {
    name: '侨风碉楼',
    description: '限1次:使一个城市获得10000HP护盾，随后江门HP减半，并对敌方中心造成50%HP的攻击',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    shieldHp: 10000,
    selfHpReduction: 0.5,
    enemyCenterDamagePercent: 0.5,
    requiresTarget: true
  },

  '茂名市': {
    name: '油城果乡',
    description: '限3次，给己方一座城市+500HP的回血',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 3,
    healAmount: 500,
    requiresTarget: true
  },

  '惠州市': {
    name: '大亚湾区',
    description: '该城市HP增加50%，受到一次攻击三回合后可回血受到攻击50%的HP（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    hpBonus: 1.5,
    healDelay: 3,
    healPercent: 0.5
  },

  '梅州市': {
    name: '客家祖地',
    description: '限1次，出战时获得己方阵容目前所有客家城市的攻击力加成，之后梅州减少500HP',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    hakkaBonus: true,
    selfHpCost: 500
  },

  '汕尾市': {
    name: '深汕合作',
    description: '若己方拥有深圳市，则汕尾市HPx2',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    hpMultiplier: 2,
    requiresAlly: '深圳市'
  },

  '河源市': {
    name: '万绿水城',
    description: '限1次，消耗自身100HP对对方中心造成1000伤害',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    selfHpCost: 100,
    enemyCenterDamage: 1000
  },

  '阳江市': {
    name: '刀剪之都',
    description: '限1次，选定己方一个城市永久不会被其省会归顺',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    surrenderImmunity: true,
    requiresTarget: true
  },

  '清远市': {
    name: '北江凤韵',
    description: '限1次，阵亡后满血复活回到己方阵营继续出战（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    limit: 1,
    revive: true,
    fullHeal: true
  },

  '东莞市': {
    name: '世界工厂',
    description: '限1次，随机召唤一个HP大于4000小于10000的城市加入己方阵营',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    summonHpRequirement: { min: 4000, max: 10000 }
  },

  '中山市': {
    name: '伟人故里',
    description: '限1次，阵亡时随机将对方一座HP低于2000的非中心城市一同摧毁',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    limit: 1,
    destroyOnDeath: true,
    targetHpRequirement: { max: 2000 }
  },

  '潮州市': {
    name: '瓷都古韵',
    description: '限3次，己方全体城市获得持续3回合的300HP护盾',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 3,
    duration: 3,
    shieldHp: 300,
    allyCities: true
  },

  '揭阳市': {
    name: '玉都商埠',
    description: '限2次，让一个己方原始HP低于5000的城市恢复至满血状态',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    targetHpRequirement: { max: 5000 },
    requiresTarget: true,
    fullHeal: true
  },

  '云浮市': {
    name: '石都禅意',
    description: '限2次，为己方一个城市提高3000攻击力(该效果持续三回合)',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    duration: 3,
    powerBonus: 3000,
    requiresTarget: true
  },

  // === 黑龙江省 ===
  '哈尔滨市': {
    name: '冰城奇观',
    description: '限1次，出战时使对方所有城市2回合内无法被使用技能，（对方城市数量≥3时可使用）',
    type: SKILL_TYPE.PASSIVE,
    limit: 1,
    category: 'nonBattle',
    minOpponentCities: 3,
    freezeDuration: 2
  },

  '齐齐哈尔市': {
    name: '鹤城守护',
    description: '限2次，出战时给己方中心城市一个持续3回合的2000HP护盾，对方伤害优先打在护盾上',
    type: SKILL_TYPE.PASSIVE,
    limit: 2,
    category: 'battle',
    shieldHp: 2000,
    shieldDuration: 3,
    targetCenter: true
  },

  '牡丹江市': {
    name: '镜泊湖光',
    description: '限1次，选定己方一座城市进入镜泊湖光状态3回合，期间受到伤害时有50%概率反弹20%伤害给攻击者',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'battle',
    duration: 3,
    reflectChance: 0.5,
    reflectPercent: 0.2,
    requiresTarget: true
  },

  '佳木斯市': {
    name: '三江平原',
    description: '限1次，给己方所有城市+1000HP',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    hpIncrease: 1000,
    targetAll: true
  },

  '大庆市': {
    name: '石油之城',
    description: '限2次，给己方2座城市+2000HP的护盾，接下来该城市出战时攻击力增加30%',
    type: SKILL_TYPE.ACTIVE,
    limit: 2,
    category: 'battle',
    targetCount: 2,
    shieldHp: 2000,
    attackBoost: 1.3,
    requiresMultipleSelfCities: true
  },

  '伊春市': {
    name: '林都迷踪',
    description: '限2次，出战时使对方随机一座城市在2回合内无法攻击己方城市',
    type: SKILL_TYPE.PASSIVE,
    limit: 2,
    category: 'battle',
    disableDuration: 2
  },

  '鸡西市': {
    name: '石墨之都',
    description: '限2次，出战时增加己方城市2000攻击力（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    limit: 2,
    category: 'battle',
    attackBonus: 2000
  },

  '双鸭山市': {
    name: '完达山',
    description: '限2次，出战时随机抵挡1-500伤害',
    type: SKILL_TYPE.PASSIVE,
    limit: 2,
    category: 'battle',
    damageBlockMin: 1,
    damageBlockMax: 500
  },

  '黑河市': {
    name: '五大连池',
    description: '限1次，出战时使己方随机一座城市恢复至满血状态',
    type: SKILL_TYPE.PASSIVE,
    limit: 1,
    category: 'battle',
    fullHealRandom: true
  },

  '七台河市': {
    name: '奥运冠军',
    description: '限2次，出战时增加己方随机一座城市2000攻击力（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    limit: 2,
    category: 'battle',
    attackBonus: 2000,
    targetRandom: true
  },

  '大兴安岭地区': {
    name: '林海雪原',
    description: '限1次，选定己方一座城市隐身2回合，期间无法被攻击但也不能攻击对方',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    duration: 2,
    requiresTarget: true,
    invisibility: true
  },

  // === 湖南省 ===
  '长沙市': {
    name: '橘子洲头',
    description: '限1次，该城市HPx2，并随机召唤两座湖南城市加入己方阵营',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    hpMultiplier: 2,
    summonCount: 2,
    summonProvince: '湖南省'
  },

  '株洲市': {
    name: '炎帝陵',
    description: '限1次，选定己方2座HP低于5000的城市HPx2，并随机掠夺对方一座HP低于5000的城市加入己方阵营',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    targetCount: 2,
    hpMultiplier: 2,
    targetHpRequirement: { max: 5000 },
    captureHpRequirement: { max: 5000 },
    requiresMultipleSelfCities: true
  },

  '湘潭市': {
    name: '伟人故里',
    description: '限1次，该城市和己方另一座城市HPx2，并召唤赣州市和吉安市加入己方阵营，若己方阵中已拥有赣州市或吉安市，HPx2',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    hpMultiplier: 2,
    summonCities: ['赣州市', '吉安市']
  },

  '衡阳市': {
    name: '南岳衡山',
    description: '限1次，选定对方一座HP低于30000的城市强制连续出战2回合，2回合后若未阵亡则HP减半',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    targetHpRequirement: { max: 30000 },
    forceBattleDuration: 2,
    hpPenalty: 0.5,
    requiresTarget: true
  },

  '岳阳市': {
    name: '岳阳楼记',
    description: '限1次，该城市HPx2并随机召唤一座除长沙市之外的湖南省城市',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    hpMultiplier: 2,
    summonProvince: '湖南省',
    excludeCities: ['长沙市']
  },

  '张家界市': {
    name: '千山迷阵',
    description: '限1次，直接摧毁对方一座初始HP低于8000的已知城市，50%的概率获得该城市的初始HP并加入己方阵营',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    targetHpRequirement: { max: 8000 },
    destroyChance: 1.0,
    captureChance: 0.5,
    requiresTarget: true
  },

  '常德市': {
    name: '桃花源记',
    description: '限1次，使用时不公开，对方2回合攻击无效',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    duration: 2,
    secretUse: true,
    nullifyAttack: true
  },

  '娄底市': {
    name: '世界锑都',
    description: '限1次，己方2座HP低于5000的城市HPx2',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    targetCount: 2,
    hpMultiplier: 2,
    targetHpRequirement: { max: 5000 },
    requiresMultipleSelfCities: true
  },

  '永州市': {
    name: '永州八记',
    description: '限1次，该城市和己方另外一座HP低于8000的城市HPx2，并选定对方一座已知城市禁用博学多才技能',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    hpMultiplier: 2,
    targetHpRequirement: { max: 8000 },
    disableEnemySkill: '博学多才',
    requiresTarget: true
  },

  '怀化市': {
    name: '华南交通中枢',
    description: '限1次，对方使用技能召唤得到某城市时，若HP低于5000，则加入己方阵营（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    limit: 1,
    category: 'nonBattle',
    interceptSummon: true,
    interceptHpRequirement: { max: 5000 }
  },

  '湘西州': {
    name: '凤凰古城',
    description: '限1次，己方2座HP低于10000的城市HPx2',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    targetCount: 2,
    hpMultiplier: 2,
    targetHpRequirement: { max: 10000 }
  },

  // === 广西壮族自治区 ===
  '南宁市': {
    name: '南宁老友粉',
    description: '技能限三次，使一个我方城市增加4000HP',
    type: SKILL_TYPE.ACTIVE,
    limit: 3,
    category: 'nonBattle',
    healAmount: 4000,
    requiresTarget: true
  },

  '柳州市': {
    name: '螺蛳粉',
    description: '限1次，使三个我方城市回满血(总和不能大于15,000)',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    targetCount: 3,
    fullHeal: true,
    totalHpLimit: 15000,
    requiresMultipleSelfCities: true
  },

  '桂林市': {
    name: '桂林米粉',
    description: '限1次，让一个城市增加2000HP/刷新该城市技能',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    healAmount: 2000,
    refreshSkill: true,
    requiresTarget: true
  },

  '梧州市': {
    name: '百年商埠',
    description: '限一次，立刻获得三金币，梧州减少100HP',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    goldGain: 3,
    selfHpCost: 100
  },

  '北海市': {
    name: '湾海双子',
    description: '限一次，将防城港市加入我方阵容，若防城港巿位于敌方阵容中，则防城港市自动归顺我方',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    summonCity: '防城港市',
    canSteal: true
  },

  '防城港市': {
    name: '山海边境',
    description: '限一次，本回合敌方伤害被视为被抵挡，之后下回合防城港市失去600HP',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'battle',
    nullifyDamage: true,
    nextRoundHpCost: 600
  },

  '贵港市': {
    name: '西江明珠',
    description: '我方每使用两个技能，额外获得一金币',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    skillCountForGold: 2,
    goldGain: 1
  },

  '百色市': {
    name: '乐业天坑',
    description: '限一次，本回合敌方攻击转化为百色市自身HP，上限9000，该技能不可被刷新',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'battle',
    absorbDamage: true,
    absorbLimit: 9000,
    cannotRefresh: true
  },

  '贺州市': {
    name: '三省通衢',
    description: '被动，高级/普通搬运救兵对贺州市使用时，可选择从湖南 广西 广东中选择其1搬运城市，步步高升对其使用时，死亡后，我方获得的城市也是从三省中随机选择',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    specialSummon: ['湖南省', '广西壮族自治区', '广东省']
  },

  '河池市': {
    name: '刘三姐故乡',
    description: '限三次，使用该技能的两个回合内我方被视为使用了草木皆兵',
    type: SKILL_TYPE.ACTIVE,
    limit: 3,
    category: 'battle',
    duration: 2,
    applyGreenSkill: true
  },

  '来宾市': {
    name: '盘古文化',
    description: '限一次，来宾市自毁，并消耗2金币，召唤"盘古"随机摧毁两个非中心且HP低于9000的城市',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    selfDestroy: true,
    goldCost: 2,
    destroyCount: 2,
    destroyHpRequirement: { max: 9000 }
  },

  '崇左市': {
    name: '友谊关',
    description: '被动，被加持护盾或增加HP时，崇左市额外获得1000HP',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    bonusHpOnHeal: 1000
  },

  // === 河北省 ===
  '石家庄市': {
    name: '安济桥',
    description: '冷却1回合，出牌阶段，选择两个己方城市，交换城市专属技能',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    cooldown: 1,
    targetCount: 2,
    swapSkills: true,
    requiresMultipleSelfCities: true
  },

  '唐山市': {
    name: '钢铁之城',
    description: '中心城市和该城市始终处于"钢铁城市"状态，己方"钢铁城市"数量上限+2',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    permanentIronCity: true,
    ironCityLimitBonus: 2
  },

  '秦皇岛市': {
    name: '山海关',
    description: '己方辽宁省、吉林省、黑龙江省城市受到伤害-75%',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    protectProvinces: ['辽宁省', '吉林省', '黑龙江省'],
    damageReduction: 0.75
  },

  '邯郸市': {
    name: '邯郸学步',
    description: '限1次，选定一座己方城市HP变为与该城市相同',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    copyHp: true,
    requiresTarget: true
  },

  '张家口市': {
    name: '冬奥盛会',
    description: '限1次，出牌阶段，选定一个金币技能目标+1',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    increaseSkillTarget: 1
  },

  '承德市': {
    name: '避暑山庄',
    description: '冷却4回合，结算阶段，你可以免除一次致命伤害，将一座原阵亡城市HP变为1',
    type: SKILL_TYPE.ACTIVE,
    cooldown: 4,
    category: 'nonBattle',
    preventDeath: true,
    reviveHp: 1
  },

  '廊坊市': {
    name: '夹缝求生',
    description: '觉醒技，若己方有至少两个城市的HP大于该城市的20倍，获得技能：若这些城市的HP减少n，该城市的HP增加[n/5]',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    awakeningCondition: { hpRatio: 20, minCities: 2 },
    hpShareRatio: 0.2
  },

  '衡水市': {
    name: '衡水模式',
    description: '己方所有城市HP的增加量*2，减少量*1.5',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    hpIncreaseMultiplier: 2,
    hpDecreaseMultiplier: 1.5
  },

  '雄安新区': {
    name: '千年大计',
    description: '觉醒技，当17回合后该城市仍处于未知状态时，获得北京市',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    awakeningRound: 17,
    summonCity: '北京市',
    requireUnknown: true
  },

  // === 山西省 ===
  '太原市': {
    name: '清徐陈醋',
    description: '限2次，你可以花费3金币，5回合后获得一座城市专属技能',
    type: SKILL_TYPE.ACTIVE,
    limit: 2,
    category: 'nonBattle',
    goldCost: 3,
    delay: 5,
    gainCitySkill: true
  },

  '大同市': {
    name: '北岳恒山',
    description: '限1次，获得一个与该城市HP相同的屏障',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    barrierHp: 'self'
  },

  '晋中市': {
    name: '平遥古城',
    description: '限1次，恢复一座初始HP≤10000的己方城市状态至5回合前',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    restoreRounds: 5,
    targetHpRequirement: { max: 10000 },
    requiresTarget: true
  },

  '运城市': {
    name: '鹳雀楼',
    description: '冷却1回合，将一座对方未知的己方城市更换为GDP排名比其高1名的城市',
    type: SKILL_TYPE.ACTIVE,
    cooldown: 1,
    category: 'nonBattle',
    upgradeCity: true,
    requireUnknown: true
  },

  '忻州市': {
    name: '五台山',
    description: '己方城市受佛光普照，每回合HP增加500',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    hpPerRound: 500,
    allyCities: true
  },

  '临汾市': {
    name: '壶口瀑布',
    description: '限1次，出牌阶段，使己方本回合总战斗力等于己方所有城市HP的和',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    powerEqualsTotalHp: true
  },

  // === 福建省 ===
  '福州市': {
    name: '闽都榕城',
    description: '己方福州市未阵亡时，每使用一个未使用过的技能，所有技能花费降低5%，每降低10%时额外获得3金币，最多降低25%（橙卡最多10%）',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    costReductionPerSkill: 0.05,
    goldBonusInterval: 0.10,
    goldBonus: 3,
    maxReduction: 0.25,
    orangeCardMaxReduction: 0.10
  },

  '莆田市': {
    name: '妈祖之乡',
    description: '锁定技，每当己方出战莆田市时，己方所有城市有20%的概率躲避所有伤害',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    dodgeChance: 0.2,
    allCities: true
  },

  '泉州市': {
    name: '海丝起点',
    description: '己方每三回合可免费使用一次城市保护/快速治疗/草木皆兵，且出战前泉州市为未知状态，己方每使用三次免费技能后使用一次城市专属技能，效果增加50%',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    freeSkillInterval: 3,
    freeSkills: ['城市保护', '快速治疗', '草木皆兵'],
    bonusAfterFreeSkills: 3,
    effectBonus: 1.5,
    unknownBeforeBattle: true
  },

  '厦门市': {
    name: '海上花园',
    description: '第一次出战时对方伤害对己方减少50%，且当对方城市在任意三个不同任意回合伤害均大于厦门初始HP，则厦门再一次获得该技能效果（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    firstBattleDamageReduction: 0.5,
    reactivateCondition: { differentRounds: 3, damageThreshold: 'initialHP' }
  },

  '漳州市': {
    name: '水仙花之乡',
    description: '当己方在至少三个不同任意回合造成的伤害达到漳州市初始战斗力的五倍且每回合造成的伤害均高于漳州市初始战斗力时，己方可以选择一次在释放金币技能时将其效果翻倍（只增强效果不增加目标数）',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    damageRequirement: { rounds: 3, totalMultiplier: 5, minPerRound: 'initialPower' },
    doubleSkillEffect: true,
    onlyEffectNotTarget: true
  },

  '龙岩市': {
    name: '古田会址',
    description: '在己方前五次使用金币技能时，若龙岩市在场，分别降低其1，2，3，4，5金币花费，第五次使用金币技能过后，随机获得一个8金币以下的金币技能，三回合内可以使用',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    costReductions: [1, 2, 3, 4, 5],
    bonusSkillAfter: 5,
    bonusSkillMaxCost: 8,
    bonusSkillDuration: 3
  },

  '三明市': {
    name: '闽人之源',
    description: '三明市作为战斗预备城市时对方对己方造成的伤害减少5%，每次己方使用任意技能之后，增加5%的伤害降幅，最多25%，每三回合可以触发一次',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    baseDamageReduction: 0.05,
    reductionPerSkill: 0.05,
    maxReduction: 0.25,
    triggerInterval: 3
  },

  '南平市': {
    name: '武夷山水',
    description: '南平市在场时，己方6金币及以下的技能花费减半（向上取整），冷却2回合',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    maxCostAffected: 6,
    costReduction: 0.5,
    roundUp: true,
    cooldown: 2
  },

  '宁德市': {
    name: '福鼎肉片',
    description: '宁德市在场时，己方使用恢复类技能的花费减半，冷却三回合（恢复类技能：城市医疗，草船借箭，士气大振）',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    affectedSkills: ['城市医疗', '草船借箭', '士气大振'],
    costReduction: 0.5,
    cooldown: 3
  },

  // === 江西省 ===
  '南昌市': {
    name: '八一记忆',
    description: '限1次，该城市出战的前三回合消灭对方n个城市，新HP为初始HPxn',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    trackRounds: 3,
    hpMultiplierByKills: true
  },

  '赣州市': {
    name: '长征伊始',
    description: '限1次，己方中心HP若不满初始HP的一半，可选择己方阵营中的另一座城市作为新中心，HPx2，原中心不淘汰且HP增加50%',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    centerHpRequirement: { max: 0.5 },
    newCenterMultiplier: 2,
    oldCenterBonus: 1.5,
    requiresTarget: true
  },

  '宜春市': {
    name: '明月山',
    description: '限1次，己方一座城市禁止出战2回合，2回合后恢复至初始HP（HP8000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 2,
    hpRequirement: { max: 8000 },
    requiresTarget: true,
    restoreToInitialHp: true
  },

  '吉安市': {
    name: '井冈山',
    description: '限1次，该城市秘密连续出战3回合（不会疲劳），并对对方城市造成自身HP50%的伤害（3回合后告知对方）但需要承受对方城市10%的溢出伤害（若对方城市已被己方的出战城市消灭则伤害为0），3回合结束后若未阵亡则HP恢复至初始HP且HPx3',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    duration: 3,
    damagePercent: 0.5,
    overflowDamagePercent: 0.1,
    secretUntilEnd: true,
    noFatigue: true,
    finalHpMultiplier: 3,
    restoreToInitialHp: true
  },

  '上饶市': {
    name: '鄱阳湖',
    description: '限1次，对对方3座城市造成3000HP的伤害，若有n座城市阵亡，则另外n座城市再受到1000点伤害',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    targetCount: 3,
    initialDamage: 3000,
    splashDamage: 1000,
    requiresTarget: true
  },

  '九江市': {
    name: '庐山胜境',
    description: '选定一座非中心城市，给它一个HP为省内最低城市HP的护盾，对方攻击优先打在护盾上（直辖市和特别行政区无法使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    shieldBasedOnProvince: true,
    requiresTarget: true,
    cannotUseInSpecialRegions: true
  },

  '景德镇市': {
    name: '中国瓷都',
    description: '限2次，出战时建立一座护盾，对方攻击无效且反弹50%伤害',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    nullifyAttack: true,
    reflectPercent: 0.5
  },

  // === 海南省 ===
  '海口市': {
    name: '秀英炮台',
    description: '限2次，游戏开始5回合后对对方一座未知城市造成3000点伤害（冷却3回合）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    minRound: 5,
    damage: 3000,
    requireUnknown: true,
    cooldown: 3,
    requiresTarget: true
  },

  '三亚市': {
    name: '绚丽海滨',
    description: '限1次，己方3座城市HPx2（HP5000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    targetCount: 3,
    hpMultiplier: 2,
    targetHpRequirement: { max: 5000 },
    requiresMultipleSelfCities: true
  },

  '三沙市': {
    name: '南海守望',
    description: '当己方中心第一次受到伤害时，所有伤害转移至该城市',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    transferFirstCenterDamage: true,
    transferAll: true
  },

  '琼海市': {
    name: '博鳌论坛',
    description: '限1次，选定对方一座HP低于5000的已知城市，将其HP与该城市互换',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    targetHpRequirement: { max: 5000 },
    swapHp: true,
    requiresTarget: true
  },

  '文昌市': {
    name: '文昌卫星',
    description: '限1次，将对方接下来2回合的出牌告诉己方（对方不知晓）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    revealRounds: 2,
    secret: true
  },

  '万宁市': {
    name: '神州半岛',
    description: '限1次，己方一座城市禁止出战2回合，2回合后恢复至初始HP（HP5000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 2,
    hpRequirement: { max: 5000 },
    requiresTarget: true,
    restoreToInitialHp: true
  },

  '五指山市': {
    name: '五指山',
    description: '限1次，己方一座城市禁止出战3回合，3回合后HPx3（HP8000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 3,
    hpMultiplier: 3,
    hpRequirement: { max: 8000 },
    requiresTarget: true
  },

  // === 内蒙古自治区 ===
  '包头市': {
    name: '稀土之都',
    description: '限2次，己方使用城市专属技能时，你可以将该技能的一个数字×2',
    type: SKILL_TYPE.ACTIVE,
    limit: 2,
    category: 'nonBattle',
    doubleSkillNumber: true
  },

  '鄂尔多斯市': {
    name: '中国煤都',
    description: '锁定技，游戏开始时，获得15个"煤"，每次金币数量变化时，失去1个"煤"，该城市HP始终为初始HP×n（n为"煤"的个数），当"煤"的数量为0时，该城市阵亡',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    coalTokens: 15,
    hpMultiplierByCoal: true
  },

  '呼伦贝尔市': {
    name: '草原牧场',
    description: '出牌阶段限1次，获得一座HP≤1000的城市',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    summonHpRequirement: { max: 1000 }
  },

  '锡林郭勒盟': {
    name: '元上都',
    description: '冷却4回合，花费n金币掠夺对方的一座已知非中心城市（n为该城市的[HP/3000]）',
    type: SKILL_TYPE.ACTIVE,
    cooldown: 4,
    category: 'nonBattle',
    goldCostFormula: 'hp/3000',
    captureCity: true,
    requiresTarget: true
  },

  '阿拉善盟': {
    name: '载人航天',
    description: '限1次，选择一座己方城市，进入空间站，10轮后返回。空间站内的城市不可被对方的技能选择，不受到伤害，返回时获得"忻州市""文昌市""凉山州"中的一座城市。阿拉善盟初始时位于空间站内，可随时返回',
    type: SKILL_TYPE.ACTIVE,
    limit: 1,
    category: 'nonBattle',
    spaceStationDuration: 10,
    protectFromAll: true,
    summonOnReturn: ['忻州市', '文昌市', '凉山州'],
    initialInSpace: true
  },

  // === 陕西省 ===
  '西安市': {
    name: '十三朝古都',
    description: '限1次，选定己方2座城市恢复至初始HP，选定对方2座HP低于10000的城市减少50%HP，并规定其中一座城市无法使用实力增强/快速医疗/高级医疗技能',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    targetCount: 2,
    restoreToInitialHp: true,
    enemyTargetCount: 2,
    targetHpRequirement: { max: 10000 },
    hpReduction: 0.5,
    disableSkills: ['实力增强', '快速医疗', '高级医疗'],
    requiresMultipleSelfCities: true
  },

  // 铜川市暂无技能

  '宝鸡市': {
    name: '暗度陈仓',
    description: '限1次，该城市HPx3，并秘密出战3回合对对方城市造成伤害（不会承受伤害和疲劳），并掠夺一座对方HP低于3000的城市',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    hpMultiplier: 3,
    secretBattleDuration: 3,
    noFatigue: true,
    noDamage: true,
    captureHpRequirement: { max: 3000 }
  },

  '咸阳市': {
    name: '大秦王朝',
    description: '限1次，该城市HPx3且攻击力增加50%，出战时可归顺对方除西安市、汉中市外的陕西城市，若为西安市则不会被归顺且西安市HP减少20%；若为汉中市，则咸阳市HP减少50%（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 1,
    hpMultiplier: 3,
    powerBonus: 1.5,
    surrenderProvince: '陕西省',
    excludeSurrender: ['西安市', '汉中市'],
    xianPenalty: 0.2,
    hanzhongPenalty: 0.5
  },

  '渭南市': {
    name: '华山论剑',
    description: '限1次，出战时随机与对方一座出战城市进行单挑决斗，若胜利则HP恢复至初始HP并x2，若失败，则阵亡时减少对方城市40%HP',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    duel: true,
    winHpMultiplier: 2,
    restoreToInitialHp: true,
    loseEnemyDamage: 0.4
  },

  '汉中市': {
    name: '汉朝之源',
    description: '限1次，该城市HPx3且攻击力增加50%，出战时可归顺对方除西安市、咸阳市外的陕西城市，若为西安市，则会被归顺；若为咸阳市，则咸阳市HP减少50%',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    hpMultiplier: 3,
    powerBonus: 1.5,
    surrenderProvince: '陕西省',
    excludeSurrender: ['西安市', '咸阳市'],
    xianSurrender: true,
    xiangyangPenalty: 0.5
  },

  // 安康市暂无技能

  '商洛市': {
    name: '秦岭天竺山',
    description: '限1次，给己方城市一座持续3回合的护盾，在此期间对方禁止按兵不动且攻击无效',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 3,
    shieldType: 'invincible',
    disableEnemySkill: '按兵不动',
    requiresTarget: true
  },

  '延安市': {
    name: '红色故都',
    description: '限1次，己方中心HPx2，并选定己方一座HP低于3000的城市建立一座5000HP的护盾，且出战的前2回合攻击力x3',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    centerHpMultiplier: 2,
    targetHpRequirement: { max: 3000 },
    shieldHp: 5000,
    powerMultiplier: 3,
    powerDuration: 2,
    requiresTarget: true
  },

  '榆林市': {
    name: '能源示范城',
    description: '己方有三次免费使用快速医疗的机会（无法被对方使用技能禁止），且对方前三次每次使用快速医疗时增加2金币的花费',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    freeSkillUses: 3,
    freeSkill: '快速医疗',
    cannotBeBlocked: true,
    enemySkillCostIncrease: 2,
    affectedEnemySkill: '快速医疗'
  },

  // === 贵州省 ===
  '贵阳市': {
    name: '大数据中心',
    description: '限1次，使用时记录己方2回合内对对方造成的伤害，记录结束后任意一回合对对方出战城市造成记录伤害的50%，上限10000',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    recordDuration: 2,
    damagePercent: 0.5,
    damageLimit: 10000
  },

  '六盘水市': {
    name: '中国凉都',
    description: '限1次，归顺对方所有市政府位于北回归线以南的城市（HP低于20000）',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    surrenderCondition: '北回归线以南',
    targetHpRequirement: { max: 20000 }
  },

  '遵义市': {
    name: '红色会址，茅台飘香',
    description: '当己方城市数量首次低于3个时，使己方中心城市攻击力提高20%，并恢复己方剩余城市的HP至初始HP并选定一座城市攻击力增加50%，保留有加成的城市，此后当己方阵亡一座城市，额外获得2金币',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    triggerCondition: { maxCities: 3 },
    centerPowerBonus: 1.2,
    restoreToInitialHp: true,
    selectedCityPowerBonus: 1.5,
    goldPerDeadCity: 2
  },

  '铜仁市': {
    name: '梵净金顶',
    description: '限1次，选定己方一座城市，为其施加保护状态，不消耗金币',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    protectionEffect: true,
    noCost: true,
    requiresTarget: true
  },

  '黔西南州': {
    name: '中国金州',
    description: '每回合为己方产出1金币，当对方使用"釜底抽薪"技能时，该技能无效，金币产生能力停止',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    goldPerRound: 1,
    blockSkill: '釜底抽薪',
    disableOnBlock: true
  },

  '毕节市': {
    name: '百里杜鹃',
    description: '限2次，选定己方一座出战城市附加一层「杜鹃花」，若该城市存活则多叠加一层，叠加至5层时，对对方所有城市造成自身HP50%的伤害，上限5000',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    stackMechanic: true,
    maxStacks: 5,
    damagePercent: 0.5,
    damageLimit: 5000,
    targetAll: true,
    requiresTarget: true
  },

  '安顺市': {
    name: '黄果树瀑布',
    description: '己方获得安顺市时获得5点「滔滔河水」，出战安顺市时可选择消耗「滔滔河水」，每消耗一层使安顺市伤害增加50%，每次最多消耗3点',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    waterTokens: 5,
    damageBoostPerToken: 1.5,
    maxTokensPerUse: 3
  },

  '黔东南州': {
    name: '歌舞之州',
    description: '限3次，使己方可以派出4个城市出战',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 3,
    extraDeploySlot: 1
  },

  '黔南州': {
    name: '中国天眼',
    description: '回合开始时随机显示对方1个未知城市，若对方所有城市都已成为已知城市，摸一张战斗力高于黔南州城市牌并弃置自己',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    revealPerRound: 1,
    drawIfAllKnown: true,
    drawCondition: 'higherPower'
  },

  // === 吉林省 ===
  '长春市': {
    name: '汽车城',
    description: '限1次，己方所有城市攻击力增加20%，持续2回合',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    powerBonus: 1.2,
    duration: 2,
    allyCities: true
  },

  '吉林市': {
    name: '雾凇奇观',
    description: '限1次，使对方所有城市2回合内无法使用技能（对方城市数量≥3时可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 2,
    freezeSkills: true,
    minOpponentCities: 3
  },

  '松原市': {
    name: '查干湖冬捕',
    description: '限1次，使对方一座城市HP减少1000，若该城市HP低于1000则直接摧毁（对方城市数量≥2时可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    damage: 1000,
    destroyIfLow: true,
    minOpponentCities: 2,
    requiresTarget: true
  },

  '通化市': {
    name: '通化葡萄酒',
    description: '限1次，选定己方一座城市下次出战攻击力增加40%，但HP减半',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    powerBonus: 1.4,
    hpPenalty: 0.5,
    requiresTarget: true
  },

  // 白山市暂无技能

  '四平市': {
    name: '英雄之城',
    description: '限2次，出战后3回合内己方所有城市技能效果提升15%（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 2,
    duration: 3,
    skillEffectBonus: 1.15,
    allyCities: true
  },

  '辽源市': {
    name: '梅花鹿之乡',
    description: '限2次，出战后三回合内己方所有城市每回合恢复4%HP（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 2,
    duration: 3,
    healPercentPerRound: 0.04,
    allyCities: true
  },

  '白城市': {
    name: '洮南古城',
    description: '限1次，选定己方一座城市进入古城3回合，3回合后获得持续3回合免受一切的护盾（HP10000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    hideDuration: 3,
    shieldDuration: 3,
    invincibleShield: true,
    hpRequirement: { max: 10000 },
    requiresTarget: true
  },

  '延边州': {
    name: '长白山',
    description: '限2次，出战后三回合内己方所有城市技能效果提升20%（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 2,
    duration: 3,
    skillEffectBonus: 1.2,
    allyCities: true
  },

  // === 云南省 ===
  '昆明市': {
    name: '四季如春',
    description: '限1次，该城市出战时最多扣除自身50%HP',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    maxHpLoss: 0.5
  },

  '曲靖市': {
    name: '宣威火腿',
    description: '限2次，使己方一座城市HPx2，持续2回合，被翻倍城市HP不能大于7000',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    hpMultiplier: 2,
    duration: 2,
    targetHpRequirement: { max: 7000 },
    requiresTarget: true
  },

  '玉溪市': {
    name: '玉溪烟草',
    description: '限1次，使己方一座城市获得持续3回合的5000HP护盾',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 3,
    shieldHp: 5000,
    requiresTarget: true
  },

  '保山市': {
    name: '咖啡之城',
    description: '限3次，解除一座己方城市的疲劳效果',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 3,
    removeFatigue: true,
    requiresTarget: true
  },

  '昭通市': {
    name: '昭通苹果',
    description: '限2次，战斗预备回合己方一座城市叠加昭通市HP/增加一个城市1500HP',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    stackOwnHp: true,
    alternativeHeal: 1500,
    requiresTarget: true
  },

  '丽江市': {
    name: '丽江古城',
    description: '限2次，使己方中心城市获得1200HP护盾',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    shieldHp: 1200,
    targetCenter: true
  },

  '普洱市': {
    name: '普洱茶',
    description: '限2次，使己方一座城市增加1500HP',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    healAmount: 1500,
    requiresTarget: true
  },

  '临沧市': {
    name: '茶马古道',
    description: '限2次，出战时本回合对方伤害减少20%',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    damageReduction: 0.2
  },

  '楚雄州': {
    name: '人类摇篮',
    description: '限1次，完整复活己方一座HP低于13000的城市，城市专属技能不刷新',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    revive: true,
    targetHpRequirement: { max: 13000 },
    fullHeal: true,
    noSkillRefresh: true,
    requiresTarget: true
  },

  '红河州': {
    name: '哈尼梯田',
    description: '限1次，出战时己方攻击力上涨20%',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    powerBonus: 1.2
  },

  '文山州': {
    name: '三七粉',
    description: '限3次，增加己方2座城市500HP',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 3,
    healAmount: 500,
    targetCount: 2,
    requiresMultipleSelfCities: true
  },

  '西双版纳州': {
    name: '西双版纳',
    description: '限1次，随机抽取除了昆明市外的任意一个云南城市加入我方阵容',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    summonProvince: '云南省',
    excludeCities: ['昆明市']
  },

  '大理州': {
    name: '白族之乡',
    description: '限1次，使己方一座初始HP低于9000的城市恢复至初始HP且攻击力增加50%，但大理州和该城市禁止出战2回合',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    targetHpRequirement: { max: 9000 },
    restoreToInitialHp: true,
    powerBonus: 1.5,
    banDuration: 2,
    requiresTarget: true
  },

  // 德宏州暂无技能

  '怒江州': {
    name: '三江并流',
    description: '中心城市受到的技能伤害全部转移至该城市，并且不溢出（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    transferCenterSkillDamage: true,
    noOverflow: true
  },

  '迪庆州': {
    name: '香格里拉',
    description: '限1次，该城市战斗预备时随机变为一个HP10000以上20000以下的城市出战并发起攻击，之后迪庆州还原',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    disguiseHpRequirement: { min: 10000, max: 20000 },
    transformAttack: true
  },

  // === 西藏自治区 ===
  '拉萨市': {
    name: '布达拉宫',
    description: '限1次，使一个己方HP小于30000的城市恢复至初始HP并获得3000HP护盾。之后下回合随机抽取一个HP低于1500的城市加入己方',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    targetHpRequirement: { max: 30000 },
    restoreToInitialHp: true,
    shieldHp: 3000,
    summonNextRound: true,
    summonHpRequirement: { max: 1500 },
    requiresTarget: true
  },

  '日喀则市': {
    name: '珠穆朗玛峰',
    description: '限2次，本回合己方攻击力增加10%（被动触发）',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 2,
    powerBonus: 1.1
  },

  // 昌都市暂无技能

  '林芝市': {
    name: '雅鲁藏布大峡谷',
    description: '限2次，使对方一个城市禁止出战2回合',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    banDuration: 2,
    requiresTarget: true
  },

  // 山南市暂无技能
  // 那曲市暂无技能

  '阿里地区': {
    name: '冈仁波齐',
    description: '限1次，战斗预备时召唤一个1300HP的信徒一同攻击，信徒本回合过后消失',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    summonMinion: true,
    minionHp: 1300,
    minionDuration: 1
  },

  // === 安徽省 ===
  '合肥市': {
    name: '科创新城',
    description: '限1次，将对方3回合的出战城市告诉己方，并在此期间的一回合可选择：摧毁对方该回合所有出战城市（中心除外）/建立一座持续3回合的护盾，在此期间对方所有攻击无效',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    revealDuration: 3,
    choiceDestroyOrShield: true,
    invincibleDuration: 3
  },

  '芜湖市': {
    name: '天门山',
    description: '限1次，选择己方一座城市禁止出战2回合，2回合后恢复至初始HP（HP8000以下可使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 2,
    hpRequirement: { max: 8000 },
    requiresTarget: true,
    restoreToInitialHp: true
  },

  // 蚌埠市暂无技能
  // 淮南市暂无技能
  // 马鞍山市暂无技能
  // 淮北市暂无技能

  '铜陵市': {
    name: '中国铜都',
    description: '限1次，己方HP第三高的城市与对方HP第三高的城市互换HP（可对中心城市使用）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    swapThirdHighestHp: true,
    canTargetCenter: true
  },

  '安庆市': {
    name: '天柱山',
    description: '限1次，使该城市HP恢复至初始HP，且可随机召唤池州市、黄山市中的一座城市加入己方阵营（若使用黄山市/池州市的技能召唤该城市则无法使用该技能）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    restoreToInitialHp: true,
    summonCities: ['池州市', '黄山市'],
    randomSummon: true,
    summonCount: 1
  },

  '黄山市': {
    name: '黄山',
    description: '限1次，使该城市HP恢复至初始HP且HPx2，并可随机召唤2座除合肥市之外的安徽省城市加入己方阵营（若使用安庆市/池州市的技能召唤黄山市，只可召唤一座城市且不可召唤安庆市和池州市）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    restoreToInitialHp: true,
    hpMultiplier: 2,
    summonProvince: '安徽省',
    excludeCities: ['合肥市'],
    summonCount: 2,
    conditionalSummon: true
  },

  // 阜阳市暂无技能
  // 宿州市暂无技能

  '滁州市': {
    name: '醉翁亭记',
    description: '限1次，选定己方一座HP低于8000的城市HPx2，并选定对方一座城市无法使用博学多才技能',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    targetHpRequirement: { max: 8000 },
    hpMultiplier: 2,
    disableEnemySkill: '博学多才',
    requiresTarget: true
  },

  '宣城市': {
    name: '宣纸',
    description: '限1次，出战时选定对方一座出战城市HP减半',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    hpReduction: 0.5,
    requiresTarget: true
  },

  '六安市': {
    name: '大别山',
    description: '限1次，选定己方一座城市禁止出战3回合，3回合后HPx3',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 3,
    hpMultiplier: 3,
    requiresTarget: true
  },

  '亳州市': {
    name: '中药集散中心',
    description: '限1次，己方可免费使用一次快速治疗技能（无法被对方技能禁止）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    freeSkill: '快速治疗',
    cannotBeBlocked: true
  },

  '池州市': {
    name: '九华山',
    description: '限1次，使该城市HP恢复至初始HP且HPx2，且随机召唤安庆市、黄山市中的一座城市加入己方阵营（若使用安庆市/黄山市技能召唤池州市，则无法使用该技能）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    restoreToInitialHp: true,
    hpMultiplier: 2,
    summonCities: ['安庆市', '黄山市'],
    randomSummon: true,
    summonCount: 1
  },

  // === 辽宁省 ===
  '沈阳市': {
    name: '盛京荣耀',
    description: '限2次，出战时己方全体城市攻击力提升15%，持续2回合，己方中心城市免疫一次致命伤害',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 2,
    powerBonus: 1.15,
    duration: 2,
    allyCities: true,
    centerImmuneOnce: true
  },

  '大连市': {
    name: '浪漫之都',
    description: '限2次，出战时选定己方一座城市，使其在接下来的3回合内，每次受到攻击时都有50%概率反弹50%的伤害给攻击者',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    duration: 3,
    reflectChance: 0.5,
    reflectPercent: 0.5,
    requiresTarget: true
  },

  '鞍山市': {
    name: '钢都铁壁',
    description: '限2次，给己方中心城市附加一个持续3回合的钢铁护盾，护盾可吸收3000点伤害',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    duration: 3,
    shieldHp: 3000,
    targetCenter: true
  },

  '抚顺市': {
    name: '煤都重生',
    description: '限1次，出战时使己方所有城市HP恢复至最大值的50%，若己方城市HP已低于此值，则恢复至该值',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    limit: 1,
    healPercent: 0.5,
    allyCities: true
  },

  '本溪市': {
    name: '本溪水洞',
    description: '限2次，出战时选定己方一座城市，为其提供一个持续2回合的护盾，护盾存在期间，该城市受到的伤害减少30%',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    duration: 2,
    damageReduction: 0.3,
    requiresTarget: true
  },

  '丹东市': {
    name: '鸭绿江',
    description: '限1次，出战时使对方所有出战城市在接下来的2回合内，每次攻击时都有20%概率失误，即不造成伤害',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 1,
    duration: 2,
    missChance: 0.2
  },

  '锦州市': {
    name: '笔架山',
    description: '限2次，出战时选定己方一座城市，使其在接下来的3回合内，每次出战时都能额外获得1000点HP的恢复效果',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    duration: 3,
    healPerBattle: 1000,
    requiresTarget: true
  },

  '营口市': {
    name: '鲅鱼圈',
    description: '限1次，给对方的一座随机城市缠绕鲅鱼，若为沿海城市无效，若不是沿海城市，其出战时对己方造成伤害后自毁（己方和对方均不知道被缠绕城市）',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    randomTarget: true,
    coastalImmune: true,
    selfDestructOnAttack: true,
    secret: true
  },

  '阜新市': {
    name: '玛瑙之光',
    description: '限1次，出战时选定己方一座城市，使其在接下来的2回合内，每次受到攻击时都有40%概率使攻击者的攻击力下降20%，持续1回合',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 2,
    debuffChance: 0.4,
    powerDebuff: 0.2,
    debuffDuration: 1,
    requiresTarget: true
  },

  '辽阳市': {
    name: '辽阳白塔',
    description: '限2次，出战时己方全体城市防御力提升15%，持续2回合',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 2,
    defenseBonus: 1.15,
    duration: 2,
    allyCities: true
  },

  '盘锦市': {
    name: '红海滩',
    description: '限2次，出战时选定己方一座城市，使其在接下来的3回合内，每次受到攻击时都有30%概率使攻击者进入中毒状态，每回合损失500点HP，持续2回合',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    duration: 3,
    poisonChance: 0.3,
    poisonDamage: 500,
    poisonDuration: 2,
    requiresTarget: true
  },

  '铁岭市': {
    name: '小品之乡',
    description: '限2次，出战时可以给己方出战城市增加50%攻击力或对手出战城市减少50%攻击力',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    choiceBuffOrDebuff: true,
    powerModifier: 0.5
  },

  // 朝阳市暂无技能

  '葫芦岛市': {
    name: '兴城海滨',
    description: '限1次，给对方随机5座城市施加海浪，持续5回合，每回合造成500伤害，若选中沿海城市则视为无效',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    targetCount: 5,
    randomTarget: true,
    duration: 5,
    damagePerRound: 500,
    coastalImmune: true
  },

  // === 新疆维吾尔自治区 ===
  '乌鲁木齐市': {
    name: '亚洲中心',
    description: '当该城市为中心时，攻击力永久为80000；当该城市不为中心时，视为副中心',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    centerAttackPower: 80000,
    subCenterMultiplier: 1.5
  },

  '克拉玛依市': {
    name: '黑油山，魔鬼城',
    description: '限2次，令敌方和己方各自亮出一个城市，若己方城市HP更大，获得敌方亮出的城市；若己方城市HP更小，该城市复制一个敌方已知城市的专属技能',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    requiresTarget: true,
    compareCities: true,
    canStealOrCopy: true
  },

  '吐鲁番市': {
    name: '红山，洼地',
    description: '冷却2回合，令敌方HP最高的城市受到灼烧伤害，每回合减少20%HP，直到变为HP最低的城市，灼烧可叠加',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    cooldown: 2,
    requiresTarget: true,
    burnDamagePercent: 0.2,
    stackable: true
  },

  '哈密市': {
    name: '甜蜜之旅',
    description: '游戏开始时，获得3个"蜜瓜"，任意分配给己方城市；每次出战时，选择一个己方城市获得"蜜瓜"；拥有"蜜瓜"的城市，伤害*2，受到超过15000伤害时，"蜜瓜"消失；"蜜瓜"可叠加',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    initialTokens: 3,
    damageMultiplier: 2,
    tokenLossThreshold: 15000,
    stackable: true
  },

  '昌吉回族自治州': {
    name: '天山，天池',
    description: '限1次，恢复己方所有城市的专属技能至初始状态',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    resetAllSkills: true
  },

  '博尔塔拉蒙古自治州': {
    name: '西洋之泪',
    description: '获得"溢出伤害湖"，存储己方溢出伤害的50%。出牌阶段，可选择清空该湖，对对方本回合出战城市造成等量的额外伤害',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    overflowStorage: 0.5,
    canActivateStorage: true
  },

  '巴音郭楞蒙古自治州': {
    name: '罗布泊',
    description: '限1次，指定对方一个城市陷入失踪状态5回合，期间不可出战，不可被技能选中，每回合对双方出战城市造成等同其HP的伤害',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 5,
    requiresTarget: true,
    missingState: true,
    damageEqualToHp: true
  },

  '阿克苏地区': {
    name: '冰糖心',
    description: '锁定技，该城市不受"清除加成"和其他减益效果影响',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    immuneToDebuff: true,
    lockSkill: true
  },

  '喀什地区': {
    name: '喀喇昆仑',
    description: '每个城市限1次，你可以令己方HP唯一最高城市的HP*2',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    perCityLimit: 1,
    requiresHighestHpCity: true,
    hpMultiplier: 2
  },

  '和田地区': {
    name: '玉石之路',
    description: '选择对方一个出战城市的"所属省份""HP""城市专属技能"中1项与该城市交换',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    requiresTarget: true,
    canSwapAttribute: true,
    swapOptions: ['province', 'hp', 'skill']
  },

  '伊犁哈萨克自治州': {
    name: '丝路风情，塞外江南',
    description: '转换技，游戏开始时为阴，每回合切换阴阳状态。阴：己方每获得1个城市，获得3个金币；阳：你可以弃置1个城市，对对方所有城市造成[n/m]伤害（n为该城市血量，m为己方城市数量）',
    type: SKILL_TYPE.TOGGLE,
    category: 'nonBattle',
    yinEffect: { goldPerCity: 3 },
    yangEffect: { sacrificeDamage: true }
  },

  '塔城地区': {
    name: '沙湾大盘鸡',
    description: '限2次，结算阶段，取消本次对战的所有伤害（不返还金币）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    cancelBattle: true
  },

  '阿勒泰地区': {
    name: '水塔雪都，额河之源',
    description: '己方城市数量变化时，获得1个"雪"。出牌阶段，你可以清空所有"雪"，选择一个初始HP不大于4^n（n为"雪"的数量）的北方（华北、东北、西北）城市获得',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    tokenPerCityChange: 1,
    canSummonCity: true,
    regionFilter: ['华北', '东北', '西北']
  },

  '石河子市': {
    name: '军垦第一连',
    description: '该城市出战时，随机获得1个新疆兵团城市；每获得一个同省城市，该城市HP*n（n为己方同省城市总数）',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    summonOnBattle: true,
    provinceBonus: true,
    hpMultiplierByProvince: true
  },

  // === 四川省 ===
  '成都市': {
    name: '千年水利，天府之国',
    description: '限1次，当自身归顺四川省城市时，可以多归顺一座对方HP低于10000的随机城市，当己方归顺的城市阵亡时，使成都市的攻击力增加10%，上限30%',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    limit: 1,
    bonusSurrender: true,
    powerBoostPerDeath: 0.1,
    maxPowerBoost: 0.3
  },

  '绵阳市': {
    name: '诗仙故里',
    description: '限1次，60秒内，说n首李白的诗文（含诗题和正文部分）使自身HPxn',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    requiresPoetryRecital: true,
    timeLimit: 60,
    hpMultiplierByCount: true
  },

  '自贡市': {
    name: '盐井花灯',
    description: '限2次，派出自贡出战时，己方召唤2个「花灯」，生命值为当前自贡的生命值，对方的伤害会优先打在花灯上，每使一个花灯阵亡，可夺走对方一座HP低于1500的城市',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    summonLanterns: 2,
    captureOnDestroy: true,
    captureHpThreshold: 1500
  },

  // 攀枝花市暂无技能

  '泸州市': {
    name: '泸州老窖',
    description: '限1次，选定对方一座初始HP低于10000的城市恢复至初始HP并有50%概率归顺，若该技能没有归顺城市或该城市使用定海神针等可不被归顺的技能，则使己方金币+5',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    requiresTarget: true,
    healAndSurrenderChance: 0.5,
    goldOnFail: 5,
    targetHpLimit: 10000
  },

  '德阳市': {
    name: '三星堆遗址',
    description: '限1次，隐藏己方数据1回合，主持人仅播报对方出战城市血量剩余及金币',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    hideData: true,
    duration: 1
  },

  '广元市': {
    name: '剑门蜀道',
    description: '限1次，出战时双方撤退，当轮对方出战城市攻击己方下一轮的出战城市',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    forceRetreat: true,
    delayedAttack: true
  },

  // 遂宁市暂无技能

  '内江市': {
    name: '中国甜都',
    description: '己方中心城市每出战一次，就使内江市获得一层「甜度」，当「甜度」到达5时，使内江市强制出战，攻击力x10，并消耗所有「甜度」',
    type: SKILL_TYPE.PASSIVE,
    category: 'battle',
    stackToken: true,
    tokenThreshold: 5,
    forceBattleOnThreshold: true,
    powerMultiplier: 10
  },

  '乐山市': {
    name: '峨眉金顶，乐山大佛',
    description: '限1次，前3回合出战时对方对乐山市造成的伤害减少80%',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    damageReduction: 0.8,
    roundLimit: 3
  },

  '资阳市': {
    name: '安岳柠檬',
    description: '限3次，己方出战城市附带「柠檬酸」，「柠檬酸」固定造成对方10%HP上限的伤害',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 3,
    percentDamage: 0.1
  },

  '宜宾市': {
    name: '五粮液',
    description: '限1次，消耗自身50%血量恢复己方一座城市至50%初始HP',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    selfSacrifice: 0.5,
    healAmount: 0.5,
    requiresTarget: true
  },

  '南充市': {
    name: '阆中古城',
    description: '限1次，选定对方一座使用过快速医疗/高级医疗的城市，使其HP恢复到使用快速医疗/高级医疗前的状态，随后该城市仅可使用1次快速医疗/高级医疗且增加3金币花费',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    requiresTarget: true,
    revertHealing: true,
    limitHealingSkills: true,
    additionalCost: 3
  },

  // 达州市暂无技能

  '雅安市': {
    name: '雾雨朦胧',
    description: '限1次，出战时将己方出战城市换为随机一个HP前20（含香港）的城市，当对方对此城市释放技能时，将效果打在雅安市身上',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    disguise: true,
    redirectSkills: true,
    topCityCount: 20
  },

  '阿坝州': {
    name: '天下九寨沟',
    description: '当自身阵亡时，为己方全体城市恢复至50%初始HP，且随机解除一个负面效果',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    onDeath: true,
    healAllPercent: 0.5,
    removeDebuff: true
  },

  '甘孜州': {
    name: '稻城亚丁',
    description: '限1次，每有一个城市释放专属技能时，自身积攒一层「本色」，当积攒5层时，展开「五色海」结界，每回合增加己方所有城市1000HP，持续3回合',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    limit: 1,
    stackOnSkillUse: true,
    stackThreshold: 5,
    barrierEffect: true,
    healAllPerRound: 1000,
    duration: 3
  },

  '凉山州': {
    name: '彝族火把节',
    description: '每5回合对对方随机两个城市造成1000HP伤害',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    roundInterval: 5,
    targetCount: 2,
    damage: 1000,
    randomTarget: true
  },

  // 广安市暂无技能
  // 巴中市暂无技能

  '眉山市': {
    name: '三苏祠',
    description: '为己方任意一城市附加一层「文豪」，该城市每造成20000伤害使眉山市触发一次追加攻击，伤害为1000倍攻击次数',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    requiresTarget: true,
    followUpAttack: true,
    damageThreshold: 20000,
    followUpDamage: 1000
  },

  // === 河南省 ===
  '郑州市': {
    name: '中原枢纽',
    description: '限2次，出战时己方全体城市防御力提升20%，持续2回合',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    defenseBonus: 1.2,
    duration: 2,
    allyCities: true
  },

  '洛阳市': {
    name: '十三朝古都',
    description: '限2次，选定己方一座城市，使其在接下来的3回合内，每次受到攻击时都反弹30%的伤害给攻击者',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    duration: 3,
    requiresTarget: true,
    reflectDamage: 0.3
  },

  '开封市': {
    name: '八朝古都',
    description: '限2次，给己方中心城市附加一个持续2回合的护盾，护盾存在期间，该城市每次受到攻击时，都会反弹20%的伤害给攻击者，若自身为中心，可以反弹50%',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    duration: 2,
    reflectDamage: 0.2,
    centerReflectDamage: 0.5
  },

  '平顶山市': {
    name: '中原大佛',
    description: '限1次，使己方一座城市HP增加50%，上限15000，同时提升己方全体城市5%的攻击力，持续1回合',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    requiresTarget: true,
    hpBonus: 0.5,
    hpBonusMax: 15000,
    powerBonus: 1.05,
    duration: 1
  },

  '安阳市': {
    name: '殷墟古韵',
    description: '限1次，出战时使对方所有出战城市在接下来的2回合内，每次攻击时都使攻击者自身受到相当于攻击伤害总和10%的反弹伤害',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    duration: 2,
    reflectDamagePercent: 0.1
  },

  '鹤壁市': {
    name: '淇河灵韵',
    description: '限2次，选定己方一座城市，使其在接下来的3回合内，每次出战时都能额外获得1200点HP的恢复效果，并且该城市在出战时获得额外的10%攻击力加成',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    duration: 3,
    requiresTarget: true,
    healPerBattle: 1200,
    powerBonus: 1.1
  },

  '新乡市': {
    name: '牧野雄风',
    description: '限2次，选定己方一座城市，为其提供一个持续2回合的护盾，护盾存在期间，该城市受到的伤害减少40%，且在护盾破碎时会对周围敌方城市造成一次范围伤害，伤害值为护盾吸收总伤害的30%',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    duration: 2,
    requiresTarget: true,
    damageReduction: 0.4,
    shieldBreakDamage: 0.3
  },

  '焦作市': {
    name: '云台奇景',
    description: '限1次，给对方的一座随机城市施加"迷雾笼罩"效果，该城市在接下来的3回合内，每次攻击时都无法打出伤害',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 3,
    randomTarget: true,
    disableAttack: true
  },

  // 濮阳市暂无技能

  '许昌市': {
    name: '魏都遗风',
    description: '限2次，选定己方一座城市，使其在接下来的3回合内，每次受到攻击时都有50%概率使攻击者进入"混乱"状态，持续1回合，混乱状态下攻击者会随机选择攻击目标，包括己方城市',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 2,
    duration: 3,
    requiresTarget: true,
    confuseChance: 0.5,
    confuseDuration: 1
  },

  // 漯河市暂无技能

  '三门峡市': {
    name: '黄河明珠',
    description: '限1次，可以给对方5随机座城市施加"黄河怒涛"，持续4回合，每回合造成750HP的伤害',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    targetCount: 5,
    randomTarget: true,
    duration: 4,
    damagePerRound: 750
  },

  '南阳市': {
    name: '卧龙圣地',
    description: '限2次，出战时己方全体城市在接下来的2回合内，每次攻击时都有30%概率触发额外的一次攻击，额外攻击的伤害为正常攻击的50%',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    duration: 2,
    extraAttackChance: 0.3,
    extraAttackDamage: 0.5
  },

  '商丘市': {
    name: '商祖故里',
    description: '限1次，3回合内己方每击败对手一座城市额外产生1金币',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 3,
    goldPerKill: 1
  },

  '信阳市': {
    name: '信阳毛尖',
    description: '限2次，出战时使对方所有出战城市在接下来的2回合内，每次攻击时都有50%攻击力下降20%，持续1回合',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 2,
    duration: 2,
    weakenChance: 0.5,
    powerReduction: 0.2,
    weakenDuration: 1
  },

  '周口市': {
    name: '伏羲故里',
    description: '限1次，2回合内对方无法使用城市专属技能',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    duration: 2,
    disableCitySkills: true
  },

  // 驻马店市暂无技能

  '济源市': {
    name: '王屋山',
    description: '限1次，出战时随机抵挡1-750HP伤害',
    type: SKILL_TYPE.ACTIVE,
    category: 'battle',
    limit: 1,
    randomShield: true,
    shieldMin: 1,
    shieldMax: 750
  },

  // === 甘肃省 ===
  '兰州市': {
    name: '黄河明珠',
    description: '锁定技，该城市阵亡时，对该城市造成过伤害的所有城市失去所有技能，且不可被选作任何技能的目标',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    onDeath: true,
    disableAllSkills: true,
    untargetable: true,
    lockSkill: true
  },

  '嘉峪关市': {
    name: '嘉峪关',
    description: '冷却1回合，你可以选择己方任意多个非直辖市、特区、省会、首府城市，更改其所属省级行政区',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    cooldown: 1,
    requiresMultipleSelfCities: true,
    changeProvince: true
  },

  // 金昌市暂无技能
  // 白银市暂无技能
  // 天水市暂无技能
  // 武威市暂无技能

  '张掖市': {
    name: '七彩丹霞',
    description: '限1次，选择七大地区的城市各一个，将它们替换为各地区中心城市（若不可替换，则维持原城市）',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    replaceWithCapital: true,
    sevenRegions: true
  },

  // 平凉市暂无技能

  '酒泉市': {
    name: '莫高窟',
    description: '冷却2回合，当你使用非战斗金币技能时，可以回答"博学多才"问题，根据正确率返还相同比例的金币',
    type: SKILL_TYPE.PASSIVE,
    category: 'nonBattle',
    cooldown: 2,
    refundGold: true,
    requiresQuiz: true
  },

  // 庆阳市暂无技能
  // 定西市暂无技能
  // 陇南市暂无技能
  // 临夏回族自治州暂无技能
  // 甘南藏族自治州暂无技能

  // === 宁夏回族自治区 ===
  // 银川市暂无技能
  // 石嘴山市暂无技能

  '吴忠市': {
    name: '青铜峡',
    description: '限1次，你可以失去己方所有城市的专属技能，并分别获得随机的等量技能',
    type: SKILL_TYPE.ACTIVE,
    category: 'nonBattle',
    limit: 1,
    shuffleAllSkills: true
  }

  // 固原市暂无技能
  // 中卫市暂无技能
}

/**
 * 根据城市名获取城市技能
 * @param {string} cityName - 城市名称
 * @returns {Object|null} 城市技能对象，不存在返回null
 */
export function getCitySkill(cityName) {
  return CITY_SKILLS[cityName] || null
}

/**
 * 检查城市是否有专属技能
 * @param {string} cityName - 城市名称
 * @returns {boolean}
 */
export function hasCitySkill(cityName) {
  return cityName in CITY_SKILLS
}

/**
 * 获取所有有技能的城市名称列表
 * @returns {Array<string>}
 */
export function getAllSkillCities() {
  return Object.keys(CITY_SKILLS)
}
