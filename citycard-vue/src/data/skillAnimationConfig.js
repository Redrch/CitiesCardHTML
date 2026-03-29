/**
 * Skill-to-animation-type mapping for gold skill special effects.
 * Each of the 43 SHOWN_SKILLS has its own unique animation type
 * that matches the skill's game logic.
 */

const SKILL_ANIMATION_MAP = {
  // 1. 定海神针 - pin a city so it can't be swapped for 10 rounds
  '定海神针': { type: 'dinghai', icon: '🔱', duration: 2000, label: '定海神针' },
  // 2. 先声夺人 - swap a card with opponent
  '先声夺人': { type: 'xiansheng', icon: '🤝', duration: 2000, label: '先声夺人' },
  // 3. 金币贷款 - get 5 gold now, no income for 2 rounds
  '金币贷款': { type: 'daikuan', icon: '🏦', duration: 2000, label: '金币贷款' },
  // 4. 无知无畏 - suicide-attack opponent center with lowest HP city
  '无知无畏': { type: 'wuzhi', icon: '💀', duration: 2200, label: '无知无畏' },
  // 5. 按兵不动 - skip battle this round
  '按兵不动': { type: 'anbing', icon: '🛑', duration: 1800, label: '按兵不动' },
  // 6. 抛砖引玉 - sacrifice a weak city for 1-5 gold
  '抛砖引玉': { type: 'paozhuan', icon: '💎', duration: 2000, label: '抛砖引玉' },
  // 7. 草木皆兵 - opponent damage halved
  '草木皆兵': { type: 'caomu', icon: '🌿', duration: 2000, label: '草木皆兵' },
  // 8. 快速治疗 - heal one city to full HP
  '快速治疗': { type: 'kuaisuzhiliao', icon: '💚', duration: 2000, label: '快速治疗' },
  // 9. 高级治疗 - send 2 cities away, return full HP after 2 rounds
  '高级治疗': { type: 'gaojizhiliao', icon: '💖', duration: 2000, label: '高级治疗' },
  // 10. 借尸还魂 - revive a dead city at 50% HP
  '借尸还魂': { type: 'jieshi', icon: '👻', duration: 2200, label: '借尸还魂' },
  // 11. 吸引攻击 - one city absorbs all damage
  '吸引攻击': { type: 'xiyin', icon: '🎯', duration: 2000, label: '吸引攻击' },
  // 12. 众志成城 - average HP across 3-5 own cities
  '众志成城': { type: 'zhongzhi', icon: '🏰', duration: 2000, label: '众志成城' },
  // 13. 实力增强 - double a city's HP (cap 50000)
  '实力增强': { type: 'shili', icon: '💪', duration: 2000, label: '实力增强' },
  // 14. 无中生有 - randomly gain a new city
  '无中生有': { type: 'wuzhong', icon: '✨', duration: 2000, label: '无中生有' },
  // 15. 劫富济贫 - average HP between opponent's top3 and own bottom3
  '劫富济贫': { type: 'jiefu', icon: '⚖️', duration: 2200, label: '劫富济贫' },
  // 16. 城市预言 - reveal all opponent cities
  '城市预言': { type: 'yuyan', icon: '🔮', duration: 2200, label: '城市预言' },
  // 17. 博学多才 - quiz to multiply city HP
  '博学多才': { type: 'boxue', icon: '📚', duration: 2000, label: '博学多才' },
  // 18. 守望相助 - when designated city dies, revive same-province dead city
  '守望相助': { type: 'shouwang', icon: '🤝', duration: 2000, label: '守望相助' },
  // 19. 点石成金 - replace a city with a stronger one
  '点石成金': { type: 'dianshi', icon: '🪙', duration: 2200, label: '点石成金' },
  // 20. 一落千丈 - divide opponent city HP and base HP by 3
  '一落千丈': { type: 'yiluo', icon: '📉', duration: 2200, label: '一落千丈' },
  // 21. 连续打击 - divide 2 opponent cities' HP by 2
  '连续打击': { type: 'lianxu', icon: '👊', duration: 2200, label: '连续打击' },
  // 22. 横扫一空 - clear 3 opponent cities' special skills
  '横扫一空': { type: 'hengsao', icon: '🌪️', duration: 2200, label: '横扫一空' },
  // 23. 万箭齐发 - deal 50% of own total HP as damage to one city
  '万箭齐发': { type: 'wanjian', icon: '🏹', duration: 2200, label: '万箭齐发' },
  // 24. 士气大振 - heal ALL own cities to full HP
  '士气大振': { type: 'shiqi', icon: '🎉', duration: 2200, label: '士气大振' },
  // 25. 电磁感应 - link 3 opponent cities, damage shared
  '电磁感应': { type: 'dianci', icon: '⚡', duration: 2200, label: '电磁感应' },
  // 26. 战略转移 - change center city, new center +50% HP
  '战略转移': { type: 'zhanlve', icon: '🏗️', duration: 2200, label: '战略转移' },
  // 27. 自相残杀 - force 2 opponent cities to fight each other
  '自相残杀': { type: 'zixiang', icon: '⚔️', duration: 2200, label: '自相残杀' },
  // 28. 趁其不备·随机 - steal a random opponent city
  '趁其不备·随机': { type: 'chenqi_rand', icon: '🎲', duration: 2200, label: '趁其不备' },
  // 29. 搬运救兵·普通 - gain 2 same-province cities
  '搬运救兵·普通': { type: 'banyun', icon: '🚑', duration: 2200, label: '搬运救兵' },
  // 30. 中庸之道 - sqrt then x100 for low own + high opponent cities
  '中庸之道': { type: 'zhongyong', icon: '☯️', duration: 2200, label: '中庸之道' },
  // 31. 强制转移·普通 - eliminate opponent center, they pick new one
  '强制转移·普通': { type: 'qiangzhi_pu', icon: '💥', duration: 2200, label: '强制转移' },
  // 32. 趁其不备·指定 - steal a specific known opponent city
  '趁其不备·指定': { type: 'chenqi_pick', icon: '🎯', duration: 2200, label: '趁其不备' },
  // 33. 行政中心 - triple HP of all capital/special cities
  '行政中心': { type: 'xingzheng', icon: '🏛️', duration: 2200, label: '行政中心' },
  // 34. 计划单列 - raise low-HP cities to a random threshold
  '计划单列': { type: 'jihua', icon: '📋', duration: 2200, label: '计划单列' },
  // 35. 设置屏障 - create 25000HP barrier that reflects 50% damage
  '设置屏障': { type: 'pingzhang', icon: '🔰', duration: 2200, label: '设置屏障' },
  // 36. 生于紫室 - huge buff: x2 attack, hidden, auto-successor
  '生于紫室': { type: 'zishi', icon: '👑', duration: 2500, label: '生于紫室' },
  // 37. 强制转移·高级 - eliminate opponent center AND pick their new one
  '强制转移·高级': { type: 'qiangzhi_gao', icon: '🔥', duration: 2200, label: '强制转移·高级' },
  // 38. 四面楚歌 - mass annex same-province cities + halve capitals
  '四面楚歌': { type: 'simian', icon: '🎵', duration: 2500, label: '四面楚歌' },
  // 39. 事半功倍 - ban an opponent skill
  '事半功倍': { type: 'shiban', icon: '🚫', duration: 2000, label: '事半功倍' },
  // 40. 解除封锁 - unban a skill that was banned
  '解除封锁': { type: 'jiechu', icon: '🔓', duration: 2000, label: '解除封锁' },
  // 41. 技能保护 - protect against skill-banning for 10 rounds
  '技能保护': { type: 'jineng', icon: '🛡️', duration: 2000, label: '技能保护' },
  // 42. 一触即发 - clear cooldown on a skill
  '一触即发': { type: 'yichu', icon: '⚡', duration: 2000, label: '一触即发' },
  // 43. 突破瓶颈 - add +1 usage to a maxed skill
  '突破瓶颈': { type: 'tupo', icon: '🚀', duration: 2000, label: '突破瓶颈' },
}

const DEFAULT_ANIMATION = { type: 'default', icon: '✨', duration: 2000, label: '技能特效' }

/**
 * Get animation config for a skill name, with fallback to generic animation
 */
export function getSkillAnimation(skillName) {
  return SKILL_ANIMATION_MAP[skillName] || DEFAULT_ANIMATION
}

export { SKILL_ANIMATION_MAP }
