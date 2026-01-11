/**
 * 城市卡牌游戏 - 城市相关工具函数
 * 包含城市类型判断、省份查询、血量限制等辅助函数
 */

import { PROVINCE_MAP } from '../data/cities'

/**
 * 深拷贝对象
 * @param {*} obj - 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 检查城市是否是省会
 * @param {string} cityName - 城市名称
 * @returns {boolean}
 */
export function isCapitalCity(cityName) {
  const province = PROVINCE_MAP[cityName]
  if (!province) return false
  if (province.name === '直辖市和特区') return false
  return province.cities[0].name === cityName
}

/**
 * 获取城市所属省份名称
 * @param {string} cityName - 城市名称
 * @returns {string|null}
 */
export function getProvinceName(cityName) {
  const province = PROVINCE_MAP[cityName]
  return province ? province.name : null
}

/**
 * 获取省会/首府的正确称呼
 * @param {string} provinceName - 省份名称
 * @returns {string}
 */
export function getCapitalTerm(provinceName) {
  if (!provinceName) return '省会'
  return provinceName.endsWith('自治区') ? '首府' : '省会'
}

/**
 * 应用血量上限
 * @param {Object} city - 城市对象
 * @returns {number} 应用上限后的血量
 */
export function applyHpCap(city) {
  const baseHp = city.baseHp || city.hp
  const cap = baseHp > 30000 ? 100000 : 80000
  if (city.hp > cap) {
    city.hp = cap
  }
  return city.hp
}

/**
 * 检查城市是否为计划单列市
 * @param {string} cityName - 城市名称
 * @returns {boolean}
 */
export function isPlanCity(cityName) {
  const planCities = ['大连市', '青岛市', '深圳市', '厦门市', '宁波市']
  return planCities.includes(cityName)
}

/**
 * 检查城市是否为直辖市
 * @param {string} cityName - 城市名称
 * @returns {boolean}
 */
export function isMunicipality(cityName) {
  const municipalities = ['北京市', '上海市', '天津市', '重庆市']
  return municipalities.includes(cityName)
}

/**
 * 检查城市是否为特别行政区
 * @param {string} cityName - 城市名称
 * @returns {boolean}
 */
export function isSpecialAdministrativeRegion(cityName) {
  const sars = ['香港特别行政区', '澳门特别行政区']
  return sars.includes(cityName)
}

/**
 * 检查城市是否为沿海城市
 * @param {string} cityName - 城市名称
 * @returns {boolean}
 */
export function isCoastalCity(cityName) {
  // 这里可以根据实际数据定义沿海城市列表
  const coastalProvinces = [
    '辽宁省', '河北省', '天津市', '山东省', '江苏省',
    '上海市', '浙江省', '福建省', '广东省', '广西壮族自治区',
    '海南省', '香港特别行政区', '澳门特别行政区'
  ]
  const province = getProvinceName(cityName)
  return province ? coastalProvinces.includes(province) : false
}

/**
 * 获取同省城市
 * @param {string} cityName - 城市名称
 * @param {Array} allCities - 所有城市列表
 * @returns {Array} 同省城市列表
 */
export function getSameProvinceCities(cityName, allCities) {
  const province = PROVINCE_MAP[cityName]
  if (!province) return []

  return allCities.filter(city => {
    const cityProvince = PROVINCE_MAP[city.name]
    return cityProvince && cityProvince.name === province.name
  })
}

/**
 * 初始化城市对象（添加必要的属性）
 * @param {Object} city - 原始城市对象
 * @returns {Object} 初始化后的城市对象
 */
export function initializeCityObject(city) {
  return {
    ...city,
    baseHp: city.hp, // 记录原始HP
    currentHp: city.hp,
    red: city.red || 0,
    green: city.green || 0,
    blue: city.blue || 0,
    yellow: city.yellow || 0,
    isAlive: true,
    isInBattle: false,
    isFatigued: false, // 疲劳状态
    protectionRounds: 0, // 保护回合数
    modifiers: [] // 各种增益/减益效果
  }
}

/**
 * 计算城市战斗力
 * @param {Object} city - 城市对象
 * @param {Object} options - 计算选项
 * @returns {number} 战斗力
 */
export function calculateCityPower(city, options = {}) {
  let power = city.currentHp || city.hp

  // 红色技能加成
  const redBonus = getRedBonus(city.red || 0)
  power += redBonus

  // 疲劳减半
  if (city.isFatigued && !options.ignoreFatigue) {
    power = Math.floor(power / 2)
  }

  // 应用其他修饰符
  if (city.modifiers) {
    city.modifiers.forEach(modifier => {
      if (modifier.type === 'power_multiplier') {
        power = Math.floor(power * modifier.value)
      } else if (modifier.type === 'power_addition') {
        power += modifier.value
      }
    })
  }

  return Math.max(0, power)
}

/**
 * 获取红色技能加成值
 * @param {number} level - 技能等级
 * @returns {number} 加成值
 */
function getRedBonus(level) {
  switch(level) {
    case 1: return 500
    case 2: return 1000
    case 3: return 2000
    default: return 0
  }
}

/**
 * 获取绿色技能防御值
 * @param {number} level - 技能等级
 * @returns {number} 防御值
 */
export function getGreenDefense(level) {
  switch(level) {
    case 1: return 500
    case 2: return 1000
    case 3: return 2000
    default: return 0
  }
}

/**
 * 获取黄色技能治疗值
 * @param {number} level - 技能等级
 * @returns {number} 治疗值
 */
export function getYellowHeal(level) {
  switch(level) {
    case 1: return 1000
    case 2: return 2000
    case 3: return 3000
    default: return 0
  }
}
