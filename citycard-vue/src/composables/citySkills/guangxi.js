/**
 * 广西壮族自治区城市专属技能
 * 包括：南宁、柳州、桂林、梧州、北海、防城港、贵港、百色、贺州、河池、来宾、崇左
 * 无技能：钦州、玉林
 */

import {
  getAliveCities,
  getEligibleCitiesByHp,
  sortCitiesByHp,
  getCurrentHp,
  healCity,
  damageCity,
  findCity,
  summonCity
} from './skillHelpers'

/**
 * 南宁市 - 南宁老友粉
 * 限3次，使一个我方城市增加4000HP
 */
export function handleNanningSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length > 0) {
    const sorted = sortCitiesByHp(aliveCities)
    const targetCity = sorted[0]
    const { oldHp, newHp } = healCity(targetCity, 4000)

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"南宁老友粉"，${targetCity.name}增加4000HP（${Math.floor(oldHp)} → ${Math.floor(newHp)}）！`)
  }
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 柳州市 - 螺蛳粉
 * 限1次，使三个我方城市回满血(总和不能大于15,000)
 */
export function handleLiuzhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"螺蛳粉"，没有存活城市！`)
    return
  }

  // 选择HP最低的3座城市
  const sorted = sortCitiesByHp(aliveCities)
  const citiesToHeal = sorted.slice(0, 3)

  // 计算总恢复量
  let totalHeal = 0
  citiesToHeal.forEach(city => {
    const healAmount = city.hp - getCurrentHp(city)
    totalHeal += healAmount
  })

  // 检查是否超过15000限制
  if (totalHeal > 15000) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"螺蛳粉"，恢复总量超过15000（${Math.floor(totalHeal)}）！`)
    return
  }

  // 执行回满血
  const healedCities = []
  citiesToHeal.forEach(city => {
    city.currentHp = city.hp
    healedCities.push(city.name)
  })

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"螺蛳粉"，${healedCities.join('、')}回满血（总恢复${Math.floor(totalHeal)}HP）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 桂林市 - 桂林米粉
 * 限1次，让一个城市增加2000HP/刷新该城市技能
 */
export function handleGuilinSkill(attacker, skillData, addPublicLog, gameStore, action = 'heal') {
  const aliveCities = getAliveCities(attacker)

  if (aliveCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"桂林米粉"，没有存活城市！`)
    return
  }

  if (action === 'heal') {
    // 增加2000HP
    const sorted = sortCitiesByHp(aliveCities)
    const targetCity = sorted[0]
    const { oldHp, newHp } = healCity(targetCity, 2000)

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"桂林米粉"，${targetCity.name}增加2000HP（${Math.floor(oldHp)} → ${Math.floor(newHp)}）！`)
  } else if (action === 'refresh') {
    // 刷新城市技能（需要选择目标城市）
    const targetCity = aliveCities[0]

    // 初始化技能刷新状态
    if (!gameStore.skillRefresh) gameStore.skillRefresh = {}
    if (!gameStore.skillRefresh[attacker.name]) gameStore.skillRefresh[attacker.name] = {}

    const cityName = targetCity.name
    gameStore.skillRefresh[attacker.name][cityName] = {
      refreshed: true,
      appliedRound: gameStore.currentRound
    }

    addPublicLog(`${attacker.name}的${skillData.cityName}激活"桂林米粉"，刷新${targetCity.name}的技能！`)
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 梧州市 - 百年商埠
 * 限1次，立刻获得3金币，梧州减少100HP
 */
export function handleWuzhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const wuzhouCity = findCity(attacker, '梧州市')

  if (!wuzhouCity) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"百年商埠"，城市不存在！`)
    return
  }

  // 梧州减少100HP
  const { oldHp, newHp } = damageCity(wuzhouCity, 100)

  // 增加3金币
  attacker.gold = (attacker.gold || 0) + 3

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"百年商埠"，获得3金币，梧州市减少100HP（${Math.floor(oldHp)} → ${Math.floor(newHp)}）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 北海市 - 湾海双子
 * 限1次，将防城港市加入我方阵容，若防城港市位于敌方阵容中，则防城港市自动归顺我方
 */
export function handleBeihaiSkill(attacker, skillData, addPublicLog, gameStore) {
  // 检查是否已拥有防城港市
  const existingFangcheng = findCity(attacker, '防城港市')

  if (existingFangcheng) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"湾海双子"，已拥有防城港市！`)
    return
  }

  // 检查敌方是否拥有防城港市
  let foundInEnemy = false
  if (gameStore.players) {
    for (const player of gameStore.players) {
      if (player.name !== attacker.name) {
        const enemyFangcheng = findCity(player, '防城港市')
        if (enemyFangcheng) {
          // 从敌方移除
          const enemyName = enemyFangcheng.name || enemyFangcheng
          enemyFangcheng.isAlive = false
          enemyFangcheng.currentHp = 0

          // 加入己方
          const newCity = {
            name: '防城港市',
            hp: enemyFangcheng.hp,
            currentHp: getCurrentHp(enemyFangcheng),
            isAlive: true,
            province: '广西壮族自治区',
            red: 0,
            green: 0,
            blue: 0,
            yellow: 0
          }
          attacker.cities[newCity.name] = newCity

          addPublicLog(`${attacker.name}的${skillData.cityName}激活"湾海双子"，防城港市从${player.name}归顺己方！`)
          foundInEnemy = true
          break
        }
      }
    }
  }

  // 如果敌方没有，从城市池召唤
  if (!foundInEnemy) {
    summonCity(attacker, '防城港市', gameStore, addPublicLog)
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"湾海双子"，防城港市加入己方！`)
  }

  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 防城港市 - 山海边境
 * 限1次，本回合敌方伤害被视为被抵挡，之后下回合防城港市失去600HP
 */
export function handleFangchenggangSkill(attacker, skillData, addPublicLog, gameStore) {
  // 设置本回合伤害抵挡
  if (!gameStore.damageBlock) gameStore.damageBlock = {}
  if (!gameStore.damageBlock[attacker.name]) gameStore.damageBlock[attacker.name] = {}

  gameStore.damageBlock[attacker.name].shanhaiBorder = {
    active: true,
    roundsLeft: 1,
    appliedRound: gameStore.currentRound
  }

  // 设置下回合失去600HP
  const fangchenggangName = '防城港市'.name || '防城港市'
  if (!gameStore.delayedDamage) gameStore.delayedDamage = {}
  if (!gameStore.delayedDamage[attacker.name]) gameStore.delayedDamage[attacker.name] = {}

  gameStore.delayedDamage[attacker.name][fangchenggangName] = {
    damage: 600,
    triggerRound: gameStore.currentRound + 1,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"山海边境"，本回合敌方伤害被抵挡，下回合失去600HP！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 贵港市 - 西江明珠
 * 被动技能，我方每使用两个技能，额外获得一金币
 */
export function handleGuigangSkill(attacker, skillData, addPublicLog, gameStore) {
  // 初始化技能计数器
  if (!gameStore.skillCounter) gameStore.skillCounter = {}
  if (!gameStore.skillCounter[attacker.name]) {
    gameStore.skillCounter[attacker.name] = {
      count: 0,
      bonusGoldAwarded: 0
    }
  }

  gameStore.skillCounter[attacker.name].active = true
  gameStore.skillCounter[attacker.name].appliedRound = gameStore.currentRound

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"西江明珠"，每使用2个技能额外获得1金币！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 百色市 - 乐业天坑
 * 限1次，本回合敌方攻击转化为百色市自身HP，上限9000，该技能不可被刷新
 */
export function handleBaiseSkill(attacker, skillData, addPublicLog, gameStore) {
  const baiseCity = findCity(attacker, '百色市')

  if (!baiseCity) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"乐业天坑"，城市不存在！`)
    return
  }

  const baiseName = baiseCity.name || baiseCity

  // 设置伤害吸收转化为HP
  if (!gameStore.damageAbsorb) gameStore.damageAbsorb = {}
  if (!gameStore.damageAbsorb[attacker.name]) gameStore.damageAbsorb[attacker.name] = {}

  gameStore.damageAbsorb[attacker.name][baiseName] = {
    active: true,
    absorbCap: 9000,
    absorbedAmount: 0,
    roundsLeft: 1,
    cannotRefresh: true,  // 不可被刷新
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"乐业天坑"，本回合敌方攻击转化为自身HP（上限9000）！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 贺州市 - 三省通衢
 * 被动技能，高级/普通搬运救兵对贺州市使用时，可选择从湖南/广西/广东中选择其1搬运城市
 * 步步高升对其使用时，死亡后，我方获得的城市也是从三省中随机选择
 */
export function handleHezhouSkill(attacker, skillData, addPublicLog, gameStore) {
  const hezhouCity = findCity(attacker, '贺州市')

  if (!hezhouCity) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"三省通衢"，城市不存在！`)
    return
  }

  const hezhouName = hezhouCity.name || hezhouCity

  // 设置三省通衢标记
  if (!gameStore.threeProvincesBridge) gameStore.threeProvincesBridge = {}
  if (!gameStore.threeProvincesBridge[attacker.name]) gameStore.threeProvincesBridge[attacker.name] = {}

  gameStore.threeProvincesBridge[attacker.name][hezhouName] = {
    active: true,
    provinces: ['湖南省', '广西壮族自治区', '广东省'],
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"三省通衢"，搬运救兵和步步高升可从湖南/广西/广东三省选择！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 河池市 - 刘三姐故乡
 * 限3次，使用该技能的两个回合内我方被视为使用了草木皆兵
 */
export function handleHechiSkill(attacker, skillData, addPublicLog, gameStore) {
  // 设置草木皆兵效果
  if (!gameStore.caomujiebing) gameStore.caomujiebing = {}

  gameStore.caomujiebing[attacker.name] = {
    active: true,
    roundsLeft: 2,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"刘三姐故乡"，未来2回合被视为使用了草木皆兵！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 来宾市 - 盘古文化
 * 限1次，来宾市自毁，并消耗2金币，召唤"盘古"随机摧毁两个非中心且HP低于9000的城市
 */
export function handleLaibinSkill(attacker, defender, skillData, addPublicLog, gameStore) {
  const laibinCity = findCity(attacker, '来宾市')

  if (!laibinCity) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"盘古文化"，城市不存在！`)
    return
  }

  // 检查金币
  if (attacker.gold < 2) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"盘古文化"，金币不足（需要2金币）！`)
    return
  }

  // 来宾市自毁
  laibinCity.currentHp = 0
  laibinCity.isAlive = false

  // 消耗2金币
  attacker.gold -= 2

  // 筛选对方符合条件的城市（非中心且HP<9000）
  const eligibleCities = []
  if (defender && defender.cities) {
    Object.values(defender.cities).forEach((city, index) => {
      if (city.isAlive !== false &&
          getCurrentHp(city) > 0 &&
          index !== defender.centerCityName &&
          city.hp < 9000) {
        eligibleCities.push({ city, index })
      }
    })
  }

  if (eligibleCities.length === 0) {
    addPublicLog(`${attacker.name}的${skillData.cityName}激活"盘古文化"，来宾市自毁并消耗2金币，但没有符合条件的敌方城市！`)
    gameStore.recordSkillUsage(attacker.name, skillData.cityName)
    return
  }

  // 随机摧毁最多2座城市
  const citiesToDestroy = Math.min(2, eligibleCities.length)
  const shuffled = [...eligibleCities].sort(() => Math.random() - 0.5)
  const destroyed = []

  for (let i = 0; i < citiesToDestroy; i++) {
    const { city } = shuffled[i]
    city.currentHp = 0
    city.isAlive = false
    destroyed.push(city.name)
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"盘古文化"，来宾市自毁并消耗2金币，召唤盘古摧毁${defender.name}的${destroyed.join('、')}！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}

/**
 * 崇左市 - 友谊关
 * 被动技能，被加持护盾或增加HP时，崇左市额外获得1000HP
 */
export function handleChongzuoSkill(attacker, skillData, addPublicLog, gameStore) {
  const chongzuoCity = findCity(attacker, '崇左市')

  if (!chongzuoCity) {
    addPublicLog(`${attacker.name}的${skillData.cityName}无法激活"友谊关"，城市不存在！`)
    return
  }

  const chongzuoName = chongzuoCity.name || chongzuoCity

  // 设置友谊关被动效果标记
  if (!gameStore.friendshipGate) gameStore.friendshipGate = {}
  if (!gameStore.friendshipGate[attacker.name]) gameStore.friendshipGate[attacker.name] = {}

  gameStore.friendshipGate[attacker.name][chongzuoName] = {
    active: true,
    bonusHp: 1000,
    appliedRound: gameStore.currentRound
  }

  addPublicLog(`${attacker.name}的${skillData.cityName}激活"友谊关"，被加持护盾或增加HP时额外获得1000HP！`)
  gameStore.recordSkillUsage(attacker.name, skillData.cityName)
}
