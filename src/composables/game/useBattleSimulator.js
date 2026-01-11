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
 * @param {number} cityIdx - 城市索引
 * @param {Object} player - 玩家对象
 * @param {Object} gameStore - 游戏状态
 * @returns {number} 战斗力
 */
export function calculateCityPower(city, cityIdx, player, gameStore) {
  console.log(`[calculateCityPower] 城市:${city?.name}, cityIdx:${cityIdx}, isAlive:${city?.isAlive}, currentHp:${city?.currentHp}, hp:${city?.hp}`)

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
  const centerIdx = player.centerIndex ?? 0
  if (cityIdx === centerIdx) {
    power *= 2
  }

  // 2. 副中心制：攻击力×1.5 (citycard_web.html lines 4641, 6994, 9179)
  if (gameStore.subCenters && gameStore.subCenters[player.name] === cityIdx) {
    power = Math.floor(power * 1.5)
  }

  // 3. 生于紫室：攻击力×2
  if (gameStore.purpleChamber && gameStore.purpleChamber[player.name] === cityIdx) {
    power *= 2
  }

  // 4. 背水一战：攻击力×2
  if (player.battleModifiers?.some(m => m.type === 'desperate_battle')) {
    power *= 2
  }

  // 5. 狂暴模式：攻击力×5
  if (player.battleModifiers?.some(m => m.type === 'berserk_mode')) {
    power *= 5
  }

  // 6. 玉碎瓦全：攻击力×2
  if (player.battleModifiers?.some(m => m.type === 'jade_shatter')) {
    power *= 2
  }

  // 7. 天灾人祸：攻击力变为1
  if (gameStore.disaster?.[player.name]?.[cityIdx]) {
    power = 1
  }

  // 8. 厚积薄发：攻击力变为1
  if (gameStore.hjbf?.[player.name]?.[cityIdx]) {
    power = 1
  }

  // === 红色技能攻击加成 ===
  const redLevel = city.red || 0
  if (redLevel >= 1) {
    const redBonus = getRedSkillBonus(redLevel)
    power += redBonus
  }

  console.log(`[calculateCityPower] ${city.name} 最终攻击力:${Math.floor(power)}`)
  return Math.floor(power)
}

/**
 * 获取红色技能攻击加成
 */
function getRedSkillBonus(level) {
  if (level >= 3) return 2000
  if (level >= 2) return 1000
  if (level >= 1) return 500
  return 0
}

/**
 * 获取绿色技能防御减伤
 */
function getGreenSkillReduction(level) {
  if (level >= 3) return 2000
  if (level >= 2) return 1000
  if (level >= 1) return 500
  return 0
}

/**
 * 模拟城市间的战斗（原版逻辑）
 * @param {Object} attackerCity - 攻击方城市
 * @param {number} attackerCityIdx - 攻击方城市索引
 * @param {Object} defenderCity - 防守方城市
 * @param {number} defenderCityIdx - 防守方城市索引
 * @param {Object} attackerPlayer - 攻击方玩家
 * @param {Object} defenderPlayer - 防守方玩家
 * @param {Object} gameStore - 游戏状态
 * @returns {Object} 战斗结果
 */
export function simulateBattle(attackerCity, attackerCityIdx, defenderCity, defenderCityIdx, attackerPlayer, defenderPlayer, gameStore) {
  if (!attackerCity.isAlive || !defenderCity.isAlive) {
    return {
      success: false,
      message: '参战城市必须存活'
    }
  }

  // 计算攻击方战斗力
  let attackPower = calculateCityPower(attackerCity, attackerCityIdx, attackerPlayer, gameStore)

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

  // === 绿色技能统一减伤（pooledGreen） ===
  const defenderCities = defenderPlayer.cities.filter(c => c.isAlive)
  const totalGreen = defenderCities.reduce((sum, c) => sum + (c.green || 0), 0)
  const greenReduction = getGreenSkillReduction(totalGreen)

  totalDamage = Math.max(0, totalDamage - greenReduction)

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
    const otherCities = defenderPlayer.cities.filter(c =>
      c.isAlive && c.name !== defenderCity.name
    )

    otherCities.forEach(city => {
      // 连锁伤害：50%-100%
      const chainRate = 0.5 + Math.random() * 0.5
      const chainAmount = Math.floor(damageToCity * chainRate)

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

  return {
    success: true,
    attackPower,
    totalDamage,
    greenReduction,
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
    opp.cities.some(c => c.isAlive)
  )

  if (aliveOpponents.length === 0) {
    return null
  }

  // 随机选择一个对手
  const target = aliveOpponents[Math.floor(Math.random() * aliveOpponents.length)]

  // 选择对手的一个存活城市
  const aliveCities = target.cities.filter(c => c.isAlive)
  const targetCity = aliveCities[Math.floor(Math.random() * aliveCities.length)]

  // 选择自己的一个存活城市
  const myAliveCities = aiPlayer.cities.filter(c => c.isAlive)
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
    player.cities.forEach(city => {
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
    console.log(`  [${i}] name=${city.name}, cityIdx=${city.cityIdx}, hp=${city.hp}, currentHp=${city.currentHp}, isAlive=${city.isAlive}`)
  })

  // 计算总攻击力
  const totalAttackPower = attackerCities.reduce((sum, city) => {
    // 使用城市对象中的 cityIdx 属性（已在调用时添加）
    const realIdx = city.cityIdx
    const power = calculateCityPower(city, realIdx, attackerPlayer, gameStore)
    console.log(`  [calculateCityPower] ${city.name} (idx=${realIdx}): power=${power}`)
    return sum + power
  }, 0)

  console.log('[calculateBattleResult] 总攻击力:', totalAttackPower)

  // 绿色技能统一减伤
  const aliveDef = defenderCities.filter(c => c.isAlive)
  const totalGreen = aliveDef.reduce((sum, c) => sum + (c.green || 0), 0)
  const greenReduction = getGreenSkillReduction(totalGreen)

  let remainingDamage = Math.max(0, totalAttackPower - greenReduction)

  // 擒贼擒王：优先打血量最高的城市
  let targetOrder = [...aliveDef]
  if (battleSkills.captureKing) {
    targetOrder.sort((a, b) => b.currentHp - a.currentHp)
  } else {
    // 正常：按血量从低到高
    targetOrder.sort((a, b) => a.currentHp - b.currentHp)
  }

  const destroyedCities = []

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

    if (city.currentHp <= 0) {
      city.currentHp = 0
      city.isAlive = false
      destroyedCities.push(city.name)
    }
  }

  return {
    totalAttackPower,
    greenReduction,
    netDamage: totalAttackPower - greenReduction,
    remainingDamage,
    destroyedCities,
    defenderRemaining: defenderCities.filter(c => c.isAlive).length
  }
}
