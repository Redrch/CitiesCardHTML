/**
 * 战斗伤害模拟器
 * Battle Damage Simulator
 *
 * 完整实现原版citycard_web.html的战斗逻辑
 * 源代码参考：citycard_web.html lines 4615-5041
 */

import { useGameStore } from '../../stores/gameStore'

/**
 * 计算城市战斗力（原版逻辑）
 * @param {Object} city - 城市对象
 * @param {string} cityName - 城市名称
 * @param {Object} player - 玩家对象
 * @param {Object} gameStore - 游戏状态
 * @returns {number} 战斗力
 */
export function calculateCityPower(city, cityName, player, gameStore) {
  console.log(`[calculateCityPower] 城市:${city?.name}, cityName:${cityName}, isAlive:${city?.isAlive}, currentHp:${city?.currentHp}, hp:${city?.hp}`)

  // 修复：显式检查 isAlive === false，而不是 !isAlive（避免undefined被当作false）
  if (city.isAlive === false) {
    console.log(`[calculateCityPower] ${city.name} 已阵亡（isAlive=false），返回攻击力0`)
    return 0
  }

  // 基础战斗力 = 当前HP（如果currentHp未定义，使用hp）
  let power = city.currentHp !== undefined ? city.currentHp : city.hp

  if (!power || power <= 0) {
    console.log(`[calculateCityPower] ${city.name} HP为0或undefined，返回攻击力0`)
    return 0
  }

  // === 战斗修饰符（按HTML版本citycard_web.html顺序） ===

  // 1. 中心城市：攻击力×2
  if (cityName === player.centerCityName) {
    power *= 2
  }

  // 2. 副中心制：攻击力×1.5 (citycard_web.html lines 4641, 6994, 9179)
  if (gameStore.subCenters && gameStore.subCenters[player.name] === cityName) {
    power = Math.floor(power * 1.5)
  }

  // 3. 生于紫室：攻击力×2
  if (gameStore.purpleChamber && gameStore.purpleChamber[player.name] === cityName) {
    power *= 2
  }

  // 4. 背水一战：攻击力×2
  if (player.battleModifiers?.some(m => m.type === 'desperate_battle')) {
    power *= 2
  }

  // 5. 狂暴模式：HP已在使用技能时直接×5，无需额外乘算

  // 6. 玉碎瓦全：攻击力×2
  if (player.battleModifiers?.some(m => m.type === 'jade_shatter')) {
    power *= 2
  }

  // 7. 天灾人祸：攻击力变为1
  if (gameStore.disaster?.[player.name]?.[cityName]) {
    power = 1
  }

  // 8. 厚积薄发：攻击力变为1
  if (gameStore.hjbf?.[player.name]?.[cityName]) {
    power = 1
  }

  console.log(`[calculateCityPower] ${city.name} 最终攻击力:${Math.floor(power)}`)
  return Math.floor(power)
}

/**
 * 模拟城市间的战斗（原版逻辑）
 * @param {Object} attackerCity - 攻击方城市
 * @param {string} attackerCityName - 攻击方城市名称
 * @param {Object} defenderCity - 防守方城市
 * @param {string} defenderCityName - 防守方城市名称
 * @param {Object} attackerPlayer - 攻击方玩家
 * @param {Object} defenderPlayer - 防守方玩家
 * @param {Object} gameStore - 游戏状态
 * @returns {Object} 战斗结果
 */
export function simulateBattle(attackerCity, attackerCityName, defenderCity, defenderCityName, attackerPlayer, defenderPlayer, gameStore) {
  if (!attackerCity.isAlive || !defenderCity.isAlive) {
    return {
      success: false,
      message: '参战城市必须存活'
    }
  }

  // 计算攻击方战斗力
  let attackPower = calculateCityPower(attackerCity, attackerCityName, attackerPlayer, gameStore)

  // 计算总伤害
  let totalDamage = attackPower

  // === 检查防守方的屏障 ===
  const barrierKey = `${defenderPlayer.name}`
  if (gameStore.barrier?.[barrierKey]) {
    const barrier = gameStore.barrier[barrierKey]

    if (barrier.hp > 0) {
      // 屏障受伤：50%反弹，50%吸收
      const absorbedDamage = Math.floor(totalDamage * 0.5)
      const reflectedDamage = totalDamage - absorbedDamage

      // 屏障承受伤害
      barrier.hp -= absorbedDamage
      if (barrier.hp < 0) {
        barrier.hp = 0
      }

      // 反弹伤害给攻击方
      if (reflectedDamage > 0) {
        attackerCity.currentHp -= reflectedDamage
        if (attackerCity.currentHp <= 0) {
          attackerCity.currentHp = 0
          attackerCity.isAlive = false
        }
      }

      return {
        success: true,
        attackPower,
        totalDamage,
        barrierAbsorbed: absorbedDamage,
        reflected: reflectedDamage,
        barrierRemaining: barrier.hp,
        attackerHp: attackerCity.currentHp,
        attacker: attackerCity.name,
        defender: '屏障',
        message: `屏障吸收${absorbedDamage}伤害，反弹${reflectedDamage}伤害`
      }
    }
  }

  // === 既来则安保护 ===
  if (gameStore.anchored?.[defenderPlayer.name]?.[defenderCity.name]) {
    return {
      success: true,
      attackPower,
      totalDamage: 0,
      blocked: true,
      attacker: attackerCity.name,
      defender: defenderCity.name,
      message: `${defenderCity.name} 受到既来则安保护，免疫伤害`
    }
  }

  // === 狐假虎威伪装HP ===
  let damageToCity = totalDamage
  let disguiseDamage = 0

  const disguiseKey = `${defenderPlayer.name}_${defenderCity.name}`
  if (gameStore.disguisedCities?.[disguiseKey]) {
    const disguise = gameStore.disguisedCities[disguiseKey]

    if (disguise.fakeHp > 0) {
      disguiseDamage = Math.min(disguise.fakeHp, damageToCity)
      disguise.fakeHp -= disguiseDamage
      damageToCity -= disguiseDamage

      if (disguise.fakeHp <= 0) {
        delete gameStore.disguisedCities[disguiseKey]
      }
    }
  }

  // === 应用伤害到城市 ===
  defenderCity.currentHp = Math.max(0, defenderCity.currentHp - damageToCity)

  // 检查城市是否阵亡
  if (defenderCity.currentHp <= 0) {
    defenderCity.isAlive = false
    defenderCity.currentHp = 0
  }

  // === 电磁感应连锁反应 ===
  const chainDamage = []
  if (gameStore.electromagnetic?.[defenderPlayer.name] && damageToCity > 0) {
    const emData = gameStore.electromagnetic[defenderPlayer.name]
    const connectedCityNames = emData.cities || []

    // 检查被攻击的城市是否在连接列表中
    const defenderCityName = defenderCity.name || defenderCity.cityName
    if (connectedCityNames.includes(defenderCityName)) {
      // 只对其他连接的城市造成连锁伤害
      connectedCityNames.forEach(cityName => {
        if (cityName === defenderCityName) return
        const city = Object.values(defenderPlayer.cities).find(c => (c.name || c.cityName) === cityName)
        if (!city || !city.isAlive || city.currentHp <= 0) return

        // 连锁伤害：50%
        const chainAmount = Math.floor(damageToCity * 0.5)

        city.currentHp -= chainAmount
        if (city.currentHp <= 0) {
          city.currentHp = 0
          city.isAlive = false
        }

        chainDamage.push({
          city: city.name,
          damage: chainAmount,
          alive: city.isAlive
        })
      })
    }
  }

  return {
    success: true,
    attackPower,
    totalDamage,
    disguiseDamage,
    actualDamage: damageToCity,
    attacker: attackerCity.name,
    defender: defenderCity.name,
    defenderAlive: defenderCity.isAlive,
    defenderHp: defenderCity.currentHp,
    chainDamage
  }
}

/**
 * 模拟AI的简单战斗选择
 * @param {Object} aiPlayer - AI玩家
 * @param {Array} opponents - 对手列表
 * @returns {Object|null} 战斗目标
 */
export function selectAIBattleTarget(aiPlayer, opponents) {
  const aliveOpponents = opponents.filter(opp =>
    Object.values(opp.cities).some(c => c.isAlive)
  )

  if (aliveOpponents.length === 0) {
    return null
  }

  // 随机选择一个对手
  const target = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)]

  // 选择对手的一个存活城市
  const aliveCities = Object.values(target.cities).filter(c => c.isAlive)
  const targetCity = aliveCities[Math.floor(Math.random() * aliveCities.length)]

  // 选择自己的一个存活城市
  const myAliveCities = Object.values(aiPlayer.cities).filter(c => c.isAlive)
  const attackerCity = myAliveCities[Math.floor(Math.random() * myAliveCities.length)]

  return {
    attackerCity,
    targetPlayer: target,
    targetCity
  }
}

/**
 * 应用回合结束的自动伤害（例如毒效果）
 * @param {Object} player - 玩家对象
 */
export function applyEndOfTurnDamage(player) {
  const poisonModifier = player.battleModifiers?.find(m => m.type === 'poison')
  if (poisonModifier) {
    const damage = poisonModifier.value || 1000
    Object.values(player.cities).forEach(city => {
      if (city.isAlive) {
        city.currentHp = Math.max(0, city.currentHp - damage)
        if (city.currentHp <= 0) {
          city.isAlive = false
        }
      }
    })
  }
}

/**
 * 计算战斗结果（含擒贼擒王逻辑）
 * @param {Array} attackerCities - 攻击方城市列表
 * @param {Array} defenderCities - 防守方城市列表
 * @param {Object} attackerPlayer - 攻击方玩家
 * @param {Object} defenderPlayer - 防守方玩家
 * @param {Object} gameStore - 游戏状态
 * @param {Object} battleSkills - 战斗技能配置
 * @returns {Object} 战斗结果详情
 */
export function calculateBattleResult(
  attackerCities,
  defenderCities,
  attackerPlayer,
  defenderPlayer,
  gameStore,
  battleSkills = {}
) {
  console.log('[calculateBattleResult] ===== 战斗结果计算 =====')
  console.log('[calculateBattleResult] 攻击方:', attackerPlayer.name)
  console.log('[calculateBattleResult] attackerCities 长度:', attackerCities.length)
  attackerCities.forEach((city, i) => {
    console.log(`  [${i}] name=${city.name}, cityName=${city.cityName}, hp=${city.hp}, currentHp=${city.currentHp}, isAlive=${city.isAlive}`)
  })

  // 检查是否有同省撤退或省会归顺事件
  // 如果有，攻击力为0，不造成伤害
  console.log('[calculateBattleResult] 检查specialEventThisRound:', gameStore.specialEventThisRound)
  if (gameStore.specialEventThisRound) {
    const event = gameStore.specialEventThisRound
    console.log('[calculateBattleResult] 特殊事件类型:', event.type)
    if (event.type === 'retreat' || event.type === 'surrender') {
      console.log(`[calculateBattleResult] ✅ 检测到特殊事件: ${event.type}，攻击力设为0`)
      return {
        totalAttackPower: 0,
        netDamage: 0,
        destroyedCities: [],
        damageDistribution: []
      }
    }
  }

  // 计算总攻击力
  let totalAttackPower = attackerCities.reduce((sum, city) => {
    // 使用城市对象中的 cityName 属性
    const cityName = city.cityName || city.name
    const power = calculateCityPower(city, cityName, attackerPlayer, gameStore)
    console.log(`  [calculateCityPower] ${city.name} (name=${cityName}): power=${power}`)
    return sum + power
  }, 0)

  // 草木皆兵等技能的伤害倍率
  if (battleSkills.damageMultiplier && battleSkills.damageMultiplier !== 1) {
    console.log(`[calculateBattleResult] 应用伤害倍率: ${battleSkills.damageMultiplier}`)
    totalAttackPower = Math.floor(totalAttackPower * battleSkills.damageMultiplier)
  }

  console.log('[calculateBattleResult] 总攻击力:', totalAttackPower)

  let remainingDamage = totalAttackPower

  // === 检查防守方屏障（50%吸收，50%反弹，均以屏障HP为上限） ===
  let barrierAbsorbed = 0
  let barrierReflected = 0
  const barrierReflectDamage = {} // 记录反弹给攻击方每个城市的伤害
  if (gameStore.barrier?.[defenderPlayer.name] && gameStore.barrier[defenderPlayer.name].hp > 0) {
    const barrier = gameStore.barrier[defenderPlayer.name]
    const barrierHpBefore = barrier.hp

    // 吸收和反弹各50%，但均以屏障当前HP为上限
    barrierAbsorbed = Math.min(Math.floor(remainingDamage * 0.5), barrierHpBefore)
    barrierReflected = Math.min(remainingDamage - Math.floor(remainingDamage * 0.5), barrierHpBefore)

    // 屏障承受吸收部分的伤害
    barrier.hp -= barrierAbsorbed
    // 剩余伤害 = 总伤害 - 吸收 - 反弹
    remainingDamage = remainingDamage - barrierAbsorbed - barrierReflected

    // 反弹伤害到攻击方城市（按HP从低到高分配）
    let reflectRemaining = barrierReflected
    const aliveAttackers = attackerCities.filter(c => c.isAlive)
    aliveAttackers.sort((a, b) => a.currentHp - b.currentHp)
    for (const city of aliveAttackers) {
      if (reflectRemaining <= 0) break
      const dmg = Math.min(city.currentHp, reflectRemaining)
      city.currentHp -= dmg
      reflectRemaining -= dmg
      barrierReflectDamage[city.cityName || city.name] = dmg
      if (city.currentHp <= 0) {
        city.currentHp = 0
        city.isAlive = false
      }
    }

    console.log(`[calculateBattleResult] 屏障吸收: ${barrierAbsorbed}, 反弹: ${barrierReflected}, 剩余屏障HP: ${barrier.hp}`)
    if (barrier.hp <= 0) {
      delete gameStore.barrier[defenderPlayer.name]
      console.log(`[calculateBattleResult] 屏障被摧毁`)
    }
  }

  // 存活的防守方城市
  const aliveDef = defenderCities.filter(c => c.isAlive !== false)

  // 吸引攻击：所有伤害集中到一个城市
  let targetOrder = [...aliveDef]
  if (battleSkills.attractCity) {
    const attractTarget = targetOrder.find(c => c.cityName === battleSkills.attractCity || c.name === battleSkills.attractCity)
    if (attractTarget) {
      targetOrder = [attractTarget]
    }
  } else if (battleSkills.captureKing) {
    // 擒贼擒王：优先打血量最高的城市
    targetOrder.sort((a, b) => b.currentHp - a.currentHp)
  } else {
    // 正常：按血量从低到高
    targetOrder.sort((a, b) => a.currentHp - b.currentHp)
  }

  const destroyedCities = []
  const damageMap = {} // 记录每个城市受到的伤害，用于电磁感应连锁

  // 依次分配伤害
  for (const city of targetOrder) {
    if (remainingDamage <= 0) break
    if (!city.isAlive) continue

    // 检查既来则安保护
    if (gameStore.anchored?.[defenderPlayer.name]?.[city.name]) {
      continue
    }

    // 应用伤害
    const damageToCity = Math.min(city.currentHp, remainingDamage)
    city.currentHp -= damageToCity
    remainingDamage -= damageToCity
    damageMap[city.name] = (damageMap[city.name] || 0) + damageToCity

    if (city.currentHp <= 0) {
      city.currentHp = 0
      city.isAlive = false
      destroyedCities.push(city.name)
    }
  }

  // === 电磁感应连锁反应 ===
  if (gameStore.electromagnetic?.[defenderPlayer.name]) {
    const emData = gameStore.electromagnetic[defenderPlayer.name]
    const connectedCityNames = emData.cities || []

    // 对每个受伤且在连接列表中的城市，将50%伤害传导给其他连接城市
    const chainDamageMap = {}
    for (const [cityName, damage] of Object.entries(damageMap)) {
      if (damage <= 0) continue
      if (!connectedCityNames.includes(cityName)) continue

      const chainAmount = Math.floor(damage * 0.5)
      if (chainAmount <= 0) continue

      for (const linkedName of connectedCityNames) {
        if (linkedName === cityName) continue
        chainDamageMap[linkedName] = (chainDamageMap[linkedName] || 0) + chainAmount
      }
    }

    // 应用连锁伤害
    for (const [cityName, chainDmg] of Object.entries(chainDamageMap)) {
      const city = defenderCities.find(c => (c.name || c.cityName) === cityName)
      if (!city || !city.isAlive || city.currentHp <= 0) continue

      // 检查既来则安保护
      if (gameStore.anchored?.[defenderPlayer.name]?.[cityName]) continue

      const actualChainDmg = Math.min(city.currentHp, chainDmg)
      city.currentHp -= actualChainDmg

      console.log(`[calculateBattleResult] 电磁感应连锁: ${cityName} 受到 ${actualChainDmg} 连锁伤害`)

      if (city.currentHp <= 0) {
        city.currentHp = 0
        city.isAlive = false
        if (!destroyedCities.includes(cityName)) {
          destroyedCities.push(cityName)
        }
      }
    }
  }

  return {
    totalAttackPower,
    netDamage: totalAttackPower,
    barrierAbsorbed,
    barrierReflected,
    barrierReflectDamage,
    remainingDamage,
    destroyedCities,
    defenderRemaining: defenderCities.filter(c => c.isAlive).length
  }
}
