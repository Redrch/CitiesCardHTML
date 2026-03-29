/**
 * 城市专属技能效果实现（统一入口）
 *
 * 本文件作为城市技能系统的统一接口
 * 实际的技能实现已按省份拆分到 citySkills/ 文件夹中
 *
 * 文件结构：
 * - citySkills/municipalities.js  - 直辖市技能
 * - citySkills/jiangsu.js         - 江苏省技能
 * - citySkills/zhejiang.js        - 浙江省技能
 * - citySkills/shandong.js        - 山东省技能
 * - citySkills/hubei.js           - 湖北省技能
 * - citySkills/guangdong.js       - 广东省技能
 * - citySkills/skillHelpers.js    - 共享辅助函数
 * - citySkills/index.js           - 主入口和处理器映射
 */

import { processActivatedCitySkills as processCitySkills } from './citySkills/index'
import { useGameStore } from '../stores/gameStore'

/**
 * 处理激活的城市技能（对外接口）
 * @param {Object} attacker - 攻击方玩家
 * @param {Object} attackerState - 攻击方状态
 * @param {Object} defender - 防守方玩家
 * @param {Array} defenderCities - 防守方出战城市
 * @param {Function} addPublicLog - 添加公共日志的函数
 */
export function processActivatedCitySkills(attacker, attackerState, defender, defenderCities, addPublicLog) {
  const gameStore = useGameStore()

  // 调用模块化的技能处理器
  processCitySkills(attacker, attackerState, defender, defenderCities, addPublicLog, gameStore)
}

/**
 * 获取城市技能的详细信息
 * @param {string} skillName - 技能名称
 * @returns {Object|null} 技能信息
 */
export function getCitySkillInfo(skillName) {
  // 可以从 citySkills.js 导入技能元数据
  // 这里先返回基本信息
  return {
    name: skillName,
    description: '城市专属技能'
  }
}

/**
 * 检查技能是否可用
 * @param {Object} player - 玩家对象
 * @param {string} cityName - 城市名称
 * @param {string} skillName - 技能名称
 * @returns {boolean} 是否可用
 */
export function isCitySkillAvailable(player, cityName, skillName) {
  const gameStore = useGameStore()

  // 检查使用次数限制
  const usageKey = `${player.name}_${cityName}`
  const usageCount = gameStore.skillUsage?.[usageKey] || 0

  // 从技能元数据获取限制（这里简化处理）
  const skillLimit = getSkillLimit(skillName)

  return usageCount < skillLimit
}

/**
 * 获取技能使用次数限制
 * @param {string} skillName - 技能名称
 * @returns {number} 使用次数限制
 */
function getSkillLimit(skillName) {
  // 这里可以从 citySkills.js 导入完整的元数据
  // 暂时返回默认值
  const limitMap = {
    '山城迷踪': 2,
    '古都守护': 2,
    '灵山大佛': 2,
    '汉王故里': 2,
    '园林迷阵': 1,
    '南通小卷': 1,
    '花果山': 2,
    '无山阻隔': 2,
    '镇江香醋': 3,
    '盱眙小龙虾': 3,
    '美食之都': 1,
    '医药城': 2,
    '西湖秘境': 1,
    '宁波港': 2,
    '方言谜语': 1,
    '鲁迅文学': 1,
    '笔走龙蛇': 999,
    '南湖印记': 1,
    '世界义乌': 999,
    '三头一掌': 2,
    '天台山': 1,
    '景宁畲乡': 1,
    '舟山海鲜': 1,
    '泉城水攻': 2,
    '青岛啤酒': 2,
    '淄博烧烤': 2,
    '台儿庄战役': 1,
    '胜利油田': 2,
    '孔孟故里': 2,
    '蓬莱仙境': 1,
    '风筝探测': 1,
    '泰山压顶': 1,
    '刘公岛': 1,
    '城建幻觉': 1,
    '物流之都': 1,
    '德州扒鸡': 3,
    '东阿阿胶': 3,
    '菏泽牡丹': 1,
    '九省通衢': 2,
    '武当山': 1,
    '三国战场': 2,
    '三峡大坝': 1,
    '隆中景区': 1,
    '火烧赤壁': 1,
    '潜江小龙虾': 2,
    '野人出没': 1,
    '天门山': 1,
    '土家风情': 1,
    '神农故里': 1,
    '千年商都': 1,
    '特区领袖': 1,
    '浪漫海滨': 2,
    '侨乡潮韵': 1,
    '房产大亨': 999,
    '丹霞古韵': 1,
    '南国港湾': 1,
    '山水砚都': 3,
    '侨风碉楼': 1,
    '油城果乡': 3,
    '大亚湾区': 1,
    '客家祖地': 1,
    '深汕合作': 1,
    '万绿水城': 1,
    '刀剪之都': 1,
    '北江凤韵': 1,
    '世界工厂': 1,
    '伟人故里': 1,
    '瓷都古韵': 3,
    '玉都商埠': 2,
    '石都禅意': 2
  }

  return limitMap[skillName] || 999
}
