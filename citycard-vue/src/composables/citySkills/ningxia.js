/**
 * 宁夏回族自治区城市专属技能
 * 包括：吴忠
 */

import {
  getAliveCities,
  getCurrentHp,
  findCity,
  healCity,
  damageCity,
  getRandomElement
} from './skillHelpers'

/**
 * 吴忠市 - 青铜峡
 * 限1次，你可以失去己方所有城市的专属技能，并分别获得随机的等量技能
 */
export function handleWuzhongSkill(attacker, skillData, addPublicLog, gameStore) {
  // 此技能需要特殊UI支持和技能池管理，暂时记录技能激活
  if (!gameStore.bronzeGorge) gameStore.bronzeGorge = {}
  gameStore.bronzeGorge[attacker.name] = {
    active: true,
    shuffleAllSkills: true,
    originalSkills: [],
    newSkills: []
  }

  // 记录当前所有城市的技能
  Object.values(attacker.cities).forEach(city => {
    if (city.citySkill) {
      gameStore.bronzeGorge[attacker.name].originalSkills.push({
        cityName: city.name,
        skill: city.citySkill
      })
    }
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"青铜峡"，所有城市技能将被随机替换！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
