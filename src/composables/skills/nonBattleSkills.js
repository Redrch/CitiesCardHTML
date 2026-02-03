/**
 * 非战斗金币技能实现
 * Non-Battle Gold Skills
 *
 * 包含所有非战斗阶段使用的金币技能
 * - 这些技能主要在非战斗阶段使用
 * - 包含城市管理、资源操作、状态控制等效果
 */

import { useGameStore } from '../../stores/gameStore'
import { checkAndDeductGold } from '../../constants/skillCosts'
import { addSkillUsageLog, addSkillEffectLog } from '../game/logUtils'

/**
 * 交换两个城市的状态（基于cityName）
 * 注意：由于gameStore所有状态都使用cityName作为键，
 * 城市交换时，状态会自动跟随城市名称，无需手动交换状态
 *
 * 只需要处理特殊情况：
 * - attract, subCenters, purpleChamber 存储的是单个cityName值，需要更新
 * - cautiousExchange, cautionSet 是Set集合，需要更新城市名称
 */
function swapCityStates(gameStore, player1Name, city1Name, player2Name, city2Name) {
  console.log('[先声夺人] 交换城市状态（基于cityName）')
  console.log(`[先声夺人] ${player1Name}:${city1Name} ⇄ ${player2Name}:${city2Name}`)

  // 特殊处理：吸引攻击（attract）- 存储单个cityName
  if (gameStore.attract[player1Name] === city1Name) {
    gameStore.attract[player1Name] = city2Name
    console.log(`[先声夺人] 更新吸引攻击: ${player1Name} ${city1Name} -> ${city2Name}`)
  }
  if (gameStore.attract[player2Name] === city2Name) {
    gameStore.attract[player2Name] = city1Name
    console.log(`[先声夺人] 更新吸引攻击: ${player2Name} ${city2Name} -> ${city1Name}`)
  }

  // 特殊处理：副中心制（subCenters）- 存储单个cityName
  if (gameStore.subCenters[player1Name] === city1Name) {
    gameStore.subCenters[player1Name] = city2Name
    console.log(`[先声夺人] 更新副中心: ${player1Name} ${city1Name} -> ${city2Name}`)
  }
  if (gameStore.subCenters[player2Name] === city2Name) {
    gameStore.subCenters[player2Name] = city1Name
    console.log(`[先声夺人] 更新副中心: ${player2Name} ${city2Name} -> ${city1Name}`)
  }

  // 特殊处理：生于紫室（purpleChamber）- 存储单个cityName
  if (gameStore.purpleChamber[player1Name] === city1Name) {
    gameStore.purpleChamber[player1Name] = city2Name
    console.log(`[先声夺人] 更新生于紫室: ${player1Name} ${city1Name} -> ${city2Name}`)
  }
  if (gameStore.purpleChamber[player2Name] === city2Name) {
    gameStore.purpleChamber[player2Name] = city1Name
    console.log(`[先声夺人] 更新生于紫室: ${player2Name} ${city2Name} -> ${city1Name}`)
  }

  // 特殊处理：谨慎交换集合（cautiousExchange）- Set形式
  if (gameStore.cautiousExchange[player1Name]?.has(city1Name)) {
    gameStore.cautiousExchange[player1Name].delete(city1Name)
    gameStore.cautiousExchange[player1Name].add(city2Name)
    console.log(`[先声夺人] 更新cautiousExchange: ${player1Name} ${city1Name} -> ${city2Name}`)
  }
  if (gameStore.cautiousExchange[player2Name]?.has(city2Name)) {
    gameStore.cautiousExchange[player2Name].delete(city2Name)
    gameStore.cautiousExchange[player2Name].add(city1Name)
    console.log(`[先声夺人] 更新cautiousExchange: ${player2Name} ${city2Name} -> ${city1Name}`)
  }

  // 特殊处理：cautionSet - Set形式
  if (gameStore.cautionSet[player1Name]?.has(city1Name)) {
    gameStore.cautionSet[player1Name].delete(city1Name)
    gameStore.cautionSet[player1Name].add(city2Name)
    console.log(`[先声夺人] 更新cautionSet: ${player1Name} ${city1Name} -> ${city2Name}`)
  }
  if (gameStore.cautionSet[player2Name]?.has(city2Name)) {
    gameStore.cautionSet[player2Name].delete(city2Name)
    gameStore.cautionSet[player2Name].add(city1Name)
    console.log(`[先声夺人] 更新cautionSet: ${player2Name} ${city2Name} -> ${city1Name}`)
  }

  // 注意：其他所有状态（anchored, ironCities, protections等）都使用
  // [playerName][cityName] 作为键，城市交换时会自动跟随城市名称，无需手动交换
  console.log('[先声夺人] 城市状态交换完成（其他状态自动跟随cityName）')
}

export function useNonBattleSkills() {
  const gameStore = useGameStore()

  /**
   * 转账给他人
   */
  function executeTransferGold(caster, target, amount) {
    if (!amount || amount <= 0) {
      return { success: false, message: '转账金额无效' }
    }

    if (caster.gold < amount) {
      return { success: false, message: '金币不足' }
    }

    if (target.gold + amount > 24) {
      return { success: false, message: '对方金币已达上限24' }
    }

    caster.gold -= amount
    target.gold += amount

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '转账给他人',
      `${caster.name}转账${amount}金币给${target.name}`,
      `${caster.name}转账了${amount}金币给${target.name}`
    )

    return {
      success: true,
      message: `成功转账${amount}金币`
    }
  }

  /**
   * 无知无畏 - 血量最低城市攻击中心
   */
  function executeWuZhiWuWei(caster, target) {
    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('无知无畏', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '无知无畏')) {
      // 双日志：被阻挡
      addSkillUsageLog(
        gameStore,
        caster.name,
        '无知无畏',
        `无知无畏被${target.name}的坚不可摧护盾阻挡`,
        `你使用了无知无畏，但被${target.name}的坚不可摧护盾阻挡`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    const aliveCities = caster.cities.filter(c => c.isAlive !== false && (c.currentHp || c.hp) > 0)
    if (aliveCities.length === 0) {
      return { success: false, message: '没有可用城市' }
    }

    // 找到血量最低的城市
    const lowestHpCity = aliveCities.reduce((min, city) =>
      (city.currentHp || city.hp) < (min.currentHp || min.hp) ? city : min
    )

    const cityIdx = caster.cities.indexOf(lowestHpCity)
    const attackerHp = lowestHpCity.currentHp || lowestHpCity.hp

    // 判断攻击者是否为中心城市
    const isCenterAttack = (cityIdx === (caster.centerIndex || 0))

    // 计算伤害：如果是中心城市攻击，伤害×2
    let damage = attackerHp
    if (isCenterAttack) {
      damage *= 2
    }

    // 伤害上限：非中心攻击者7500，中心攻击者15000
    const dmgCap = isCenterAttack ? 15000 : 7500
    damage = Math.min(damage, dmgCap)

    // 自毁城市
    lowestHpCity.isAlive = false
    lowestHpCity.currentHp = 0

    // 添加到deadCities列表
    if (!gameStore.deadCities[caster.name]) {
      gameStore.deadCities[caster.name] = []
    }
    if (cityIdx !== -1 && !gameStore.deadCities[caster.name].includes(cityIdx)) {
      gameStore.deadCities[caster.name].push(cityIdx)
    }

    // 对目标中心造成伤害（需要处理屏障）
    let actualDamage = damage

    // 检查目标是否有屏障
    if (gameStore.barrier[target.name] && gameStore.barrier[target.name].hp > 0) {
      const barrier = gameStore.barrier[target.name]
      const barrierDamage = Math.min(actualDamage, barrier.hp)
      barrier.hp -= barrierDamage
      actualDamage -= barrierDamage

      addSkillEffectLog(gameStore, `${target.name}的屏障吸收了${barrierDamage}点伤害，剩余${barrier.hp}HP`)

      if (barrier.hp <= 0) {
        delete gameStore.barrier[target.name]
        addSkillEffectLog(gameStore, `${target.name}的屏障被摧毁`)
      }
    }

    // 如果还有剩余伤害，对中心城市造成伤害
    if (actualDamage > 0) {
      // 找到中心城市（使用centerIndex）
      const centerCity = target.cities[target.centerIndex || 0]
      if (centerCity) {
        const currentHp = centerCity.currentHp || centerCity.hp
        centerCity.currentHp = Math.max(0, currentHp - actualDamage)

        if (centerCity.currentHp <= 0) {
          centerCity.isAlive = false
        }
      }
    }

    // 获取目标中心城市剩余血量（用于日志）
    const targetCenterCity = target.cities[target.centerIndex || 0]
    const centerRemainingHp = targetCenterCity ? Math.floor(targetCenterCity.currentHp || 0) : 0

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '无知无畏',
      `用${lowestHpCity.name}${isCenterAttack ? '（中心城市，伤害×2）' : ''}使用无知无畏，对${target.name}造成${damage}伤害后自毁，其中心剩余血量 ${centerRemainingHp}`,
      `你用${lowestHpCity.name}使用了无知无畏`
    )

    return {
      success: true,
      message: `${lowestHpCity.name}攻击中心后自毁，造成${damage}伤害${isCenterAttack ? '（中心×2）' : ''}`
    }
  }

  /**
   * 快速治疗 - 恢复至满血
   */
  function executeKuaiSuZhiLiao(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    if (!selfCity.isAlive) {
      return { success: false, message: '城市已阵亡' }
    }

    // 获取城市在caster.cities中的索引
    const cityIdx = caster.cities.findIndex(c => c.name === selfCity.name)
    if (cityIdx === -1) {
      return { success: false, message: '未找到该城市' }
    }

    // 从initialCities获取真实的初始最大HP
    // 修复Bug: 如果initialCities未初始化,使用城市的baseHp或hp作为备用
    let maxHp = selfCity.hp
    if (gameStore.initialCities[caster.name] && gameStore.initialCities[caster.name][cityIdx]) {
      maxHp = gameStore.initialCities[caster.name][cityIdx].hp || gameStore.initialCities[caster.name][cityIdx].baseHp
    } else if (selfCity.baseHp !== undefined) {
      // 备用方案1: 使用baseHp
      maxHp = selfCity.baseHp
    } else if (selfCity.maxHp !== undefined) {
      // 备用方案2: 使用maxHp字段
      maxHp = selfCity.maxHp
    }
    // 如果以上都没有,使用selfCity.hp作为最后的备用

    // 检查是否已满血
    const currentHp = selfCity.currentHp !== undefined ? selfCity.currentHp : selfCity.hp

    console.log('[快速治疗] 城市:', selfCity.name)
    console.log('[快速治疗] cityIdx:', cityIdx)
    console.log('[快速治疗] currentHp:', currentHp, 'maxHp:', maxHp)
    console.log('[快速治疗] selfCity.hp:', selfCity.hp)
    console.log('[快速治疗] initialCities maxHp:', gameStore.initialCities[caster.name]?.[cityIdx]?.hp)

    if (currentHp >= maxHp) {
      return { success: false, message: '城市已满血' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('快速治疗', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    const healed = maxHp - currentHp
    selfCity.currentHp = maxHp

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '快速治疗',
      `${caster.name}使用了快速治疗`,
      `${caster.name}使用了快速治疗`
    )

    return {
      success: true,
      message: `${selfCity.name}恢复至满血`
    }
  }

  /**
   * 城市保护 - 添加保护罩
   */
  function executeCityProtection(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // 获取城市索引
    const cityIdx = caster.cities.indexOf(selfCity)
    if (cityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    // 检查是否已有保护
    if (gameStore.protections[caster.name]?.[cityIdx]) {
      return { success: false, message: '该城市已有保护' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('城市保护', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 在gameStore中设置保护罩
    if (!gameStore.protections[caster.name]) {
      gameStore.protections[caster.name] = {}
    }
    gameStore.protections[caster.name][cityIdx] = 10

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '城市保护',
      `${caster.name} 对${selfCity.name}使用城市保护，10回合内免疫1次技能`,
      `${caster.name}使用了城市保护`
    )

    return {
      success: true,
      message: `${selfCity.name}获得保护罩，10回合内免疫1次技能`
    }
  }

  /**
   * 钢铁城市 - 添加钢铁护盾
   */
  function executeGangTieChengShi(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // 获取城市索引
    const cityIdx = caster.cities.indexOf(selfCity)
    if (cityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    // 检查是否已经是钢铁城市
    if (gameStore.ironCities[caster.name] && gameStore.ironCities[caster.name][cityIdx]) {
      return {
        success: false,
        message: '该城市已经是钢铁城市'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('钢铁城市', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 在gameStore中设置钢铁护盾（2层免疫）
    if (!gameStore.ironCities[caster.name]) {
      gameStore.ironCities[caster.name] = {}
    }
    gameStore.ironCities[caster.name][cityIdx] = 2  // ✅ 修复：设置为2层，而非true

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '钢铁城市',
      `${caster.name} 对${selfCity.name}使用钢铁城市，免疫2次技能侵害`,
      `${caster.name}使用了钢铁城市`
    )

    return {
      success: true,
      message: `${selfCity.name}成为钢铁城市，免疫2次技能侵害（第一次后变普通护盾）`
    }
  }

  /**
   * 实力增强 - HP翻倍
   */
  function executeShiLiZengQiang(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // ✅ PDF明确说明："对中心无效"
    const cityIdx = caster.cities.indexOf(selfCity)
    const mode = gameStore.gameMode || '2P'

    if ((mode === '2P' || mode === '2v2') && cityIdx === caster.centerIndex) {
      return {
        success: false,
        message: '实力增强对中心城市无效'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('实力增强', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    const currentHp = selfCity.currentHp || selfCity.hp
    selfCity.currentHp = Math.min(currentHp * 2, 50000)

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '实力增强',
      `${caster.name} 对${selfCity.name}使用实力增强，HP翻倍`,
      `${caster.name}使用了实力增强`
    )

    return {
      success: true,
      message: `${selfCity.name}HP翻倍（上限50000）`
    }
  }

  /**
   * 借尸还魂 - 复活城市
   */
  function executeJieShiHuanHun(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    if (selfCity.isAlive !== false) {
      return { success: false, message: '城市未阵亡，无需复活' }
    }

    // 检查是否有待处理的先声夺人请求（避免冲突）
    if (gameStore.pendingPreemptiveStrike) {
      return {
        success: false,
        message: '当前有待处理的先声夺人请求，请先完成'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('借尸还魂', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 从ALL_CITIES或baseHp获取原始HP
    const originalCity = gameStore.getCityByName(selfCity.name)
    const baseHp = selfCity.baseHp || originalCity?.hp || selfCity.hp

    // 复活到50%HP，上限5000
    const reviveHp = Math.min(Math.floor(baseHp * 0.5), 5000)

    // 复活城市
    selfCity.isAlive = true
    selfCity.currentHp = reviveHp

    // 清除疲劳指数
    const cityIdx = caster.cities.indexOf(selfCity)
    if (cityIdx !== -1) {
      if (!gameStore.fatigueStreaks[caster.name]) {
        gameStore.fatigueStreaks[caster.name] = {}
      }
      gameStore.fatigueStreaks[caster.name][cityIdx] = 0
    }

    // 从deadCities列表移除
    if (gameStore.deadCities[caster.name]) {
      const deadIdx = gameStore.deadCities[caster.name].indexOf(cityIdx)
      if (deadIdx > -1) {
        gameStore.deadCities[caster.name].splice(deadIdx, 1)
      }
    }

    // 如果总城市数≤5，自动加入roster
    if (caster.cities.length <= 5 && cityIdx !== -1) {
      if (!gameStore.roster[caster.name]) {
        gameStore.roster[caster.name] = []
      }
      if (!gameStore.roster[caster.name].includes(cityIdx)) {
        gameStore.roster[caster.name].push(cityIdx)
      }
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '借尸还魂',
      `${caster.name} 对${selfCity.name}使用借尸还魂，复活并恢复${reviveHp}HP（疲劳已清除）`,
      `${caster.name}使用了借尸还魂`
    )

    return {
      success: true,
      message: `${selfCity.name}复活，恢复${reviveHp}HP`
    }
  }

  /**
   * 士气大振 - 所有城市满血
   */
  function executeShiQiDaZhen(caster) {
    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('士气大振', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 恢复所有存活城市至满血
    let count = 0
    caster.cities.forEach(city => {
      if (city && city.isAlive !== false) {
        city.currentHp = city.hp
        count++
      }
    })

    if (count === 0) {
      return {
        success: false,
        message: '没有存活城市可恢复'
      }
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '士气大振',
      `${caster.name} 使用士气大振，${count}个城市恢复至满血`,
      `${caster.name}使用了士气大振`
    )

    return {
      success: true,
      message: `所有城市恢复至满血`
    }
  }

  /**
   * 清除加成 - 移除所有增益
   */
  function executeQingChuJiaCheng(caster, target, targetCity) {
    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '清除加成')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '清除加成',
        `${caster.name}使用清除加成，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了清除加成`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('清除加成', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取城市索引
    const cityIdx = target.cities.indexOf(targetCity)

    // 消耗一层保护罩/钢铁护盾（如果有）
    const consumed = gameStore.consumeProtection(target.name, cityIdx)

    if (consumed) {
      addSkillEffectLog(gameStore, `清除加成效果被${target.name}的${targetCity.name}护盾抵消`)
      return {
        success: true,
        message: `效果被护盾抵消`
      }
    }

    // 清除所有modifier
    targetCity.modifiers = []

    // 清除HP超过上限的部分
    const currentHp = targetCity.currentHp || targetCity.hp
    if (currentHp > targetCity.hp) {
      targetCity.currentHp = targetCity.hp
    }

    addSkillEffectLog(gameStore, `清除了${target.name}的${targetCity.name}的所有加成`)

    return {
      success: true,
      message: `清除了${targetCity.name}的所有加成效果`
    }
  }

  /**
   * 时来运转 - 随机交换3张卡牌
   */
  function executeShiLaiYunZhuan(caster, target) {
    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('时来运转', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 前置检查1：检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '时来运转')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '时来运转',
        `${caster.name}使用时来运转，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了时来运转`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 前置检查2：构建可交换城市池（排除：谨慎交换集合、保护、定海神针、阵亡、中心城市、钢铁城市）
    function getEligibleCities(player) {
      const eligible = []
      player.cities.forEach((city, idx) => {
        // 已阵亡不参与
        if (city.isAlive === false) return

        // 谨慎交换集合不参与
        if (gameStore.isInCautiousSet(player.name, idx)) return

        // 被保护不参与
        if (gameStore.hasProtection(player.name, idx)) return

        // 定海神针不参与
        if (gameStore.anchored[player.name] && gameStore.anchored[player.name][idx]) return

        // 中心城市不参与
        if (city.isCenter) return

        // 钢铁城市不参与
        if (gameStore.hasIronShield(player.name, idx)) return

        eligible.push(idx)
      })
      return eligible
    }

    const eligibleCaster = getEligibleCities(caster)
    const eligibleTarget = getEligibleCities(target)

    // 前置检查3：可交换城市数量检查
    if (eligibleCaster.length < 3 || eligibleTarget.length < 3) {
      return {
        success: false,
        message: `可交换城市不足：${caster.name}可选${eligibleCaster.length}张、${target.name}可选${eligibleTarget.length}张（需各≥3）`
      }
    }

    // 随机选择3个城市（简化版不实现李代桃僵手动选择）
    function pick3Random(arr) {
      const shuffled = [...arr]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled.slice(0, 3)
    }

    const casterPicks = pick3Random(eligibleCaster)
    const targetPicks = pick3Random(eligibleTarget)

    // 处理狐假虎威伪装城市（被交换时自毁并识破）
    const exposedCaster = []
    const exposedTarget = []
    const normalCaster = []
    const normalTarget = []

    casterPicks.forEach(idx => {
      const disguise = gameStore.disguisedCities[caster.name]?.[idx]
      if (disguise && disguise.roundsLeft > 0) {
        // 伪装城市被识破，自毁
        const city = caster.cities[idx]
        city.isAlive = false
        city.currentHp = 0

        // 如果未付费，扣7金币（狐假虎威成本9→7）
        if (!disguise.paid) {
          caster.gold = Math.max(0, caster.gold - 7)
          disguise.paid = true
        }

        // 清除伪装
        disguise.roundsLeft = 0
        exposedCaster.push({ fake: disguise.fakeName, real: city.name })
      } else {
        normalCaster.push({ idx, name: caster.cities[idx].name })
      }
    })

    targetPicks.forEach(idx => {
      const disguise = gameStore.disguisedCities[target.name]?.[idx]
      if (disguise && disguise.roundsLeft > 0) {
        // 伪装城市被识破，自毁
        const city = target.cities[idx]
        city.isAlive = false
        city.currentHp = 0

        // 如果未付费，扣7金币（狐假虎威成本9→7）
        if (!disguise.paid) {
          target.gold = Math.max(0, target.gold - 7)
          disguise.paid = true
        }

        // 清除伪装
        disguise.roundsLeft = 0
        exposedTarget.push({ fake: disguise.fakeName, real: city.name })
      } else {
        normalTarget.push({ idx, name: target.cities[idx].name })
      }
    })

    // 实际交换普通城市（伪装城市已自毁，不参与交换）
    const minLen = Math.min(normalCaster.length, normalTarget.length)
    const swappedPairs = []

    for (let k = 0; k < minLen; k++) {
      const casterIdx = normalCaster[k].idx
      const targetIdx = normalTarget[k].idx

      // 交换城市对象
      const temp = caster.cities[casterIdx]
      caster.cities[casterIdx] = target.cities[targetIdx]
      target.cities[targetIdx] = temp

      // 同步交换initialCities
      if (gameStore.initialCities[caster.name] && gameStore.initialCities[target.name]) {
        const tempInitial = gameStore.initialCities[caster.name][casterIdx]
        gameStore.initialCities[caster.name][casterIdx] = gameStore.initialCities[target.name][targetIdx]
        gameStore.initialCities[target.name][targetIdx] = tempInitial
      }

      // 标记城市为已知
      gameStore.setCityKnown(caster.name, casterIdx, target.name)
      gameStore.setCityKnown(target.name, targetIdx, caster.name)

      swappedPairs.push({
        casterCity: target.cities[targetIdx].name,  // 交换后的城市
        targetCity: caster.cities[casterIdx].name
      })
    }

    // 交换疲劳计数器（fatigue streaks）- 跟随城市交换
    for (let k = 0; k < minLen; k++) {
      const casterIdx = normalCaster[k].idx
      const targetIdx = normalTarget[k].idx

      // 初始化streaks对象
      if (!caster.streaks) caster.streaks = {}
      if (!target.streaks) target.streaks = {}

      // 交换fatigue streak值
      const tempStreak = caster.streaks[casterIdx] || 0
      caster.streaks[casterIdx] = target.streaks[targetIdx] || 0
      target.streaks[targetIdx] = tempStreak
    }

    // 交换拔旗易帜标记（changeFlagMark）- 跟随城市交换
    for (let k = 0; k < minLen; k++) {
      const casterIdx = normalCaster[k].idx
      const targetIdx = normalTarget[k].idx

      // 初始化changeFlagMark对象
      if (!gameStore.changeFlagMark[caster.name]) gameStore.changeFlagMark[caster.name] = {}
      if (!gameStore.changeFlagMark[target.name]) gameStore.changeFlagMark[target.name] = {}

      // 交换changeFlagMark
      const casterMark = gameStore.changeFlagMark[caster.name][casterIdx]
      const targetMark = gameStore.changeFlagMark[target.name][targetIdx]

      if (casterMark || targetMark) {
        if (targetMark) {
          gameStore.changeFlagMark[caster.name][casterIdx] = { ...targetMark }
        } else {
          delete gameStore.changeFlagMark[caster.name][casterIdx]
        }

        if (casterMark) {
          gameStore.changeFlagMark[target.name][targetIdx] = { ...casterMark }
        } else {
          delete gameStore.changeFlagMark[target.name][targetIdx]
        }
      }
    }

    // 日志记录
    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '时来运转',
      `>>> ${caster.name}对${target.name}使用时来运转`,
      `${caster.name}使用了时来运转`
    )

    if (swappedPairs.length > 0) {
      const swapText = swappedPairs.map((pair, i) =>
        `第${i+1}对：${caster.name}的${pair.casterCity} ⇄ ${target.name}的${pair.targetCity}`
      ).join('，')
      addSkillEffectLog(gameStore, swapText)

    }

    if (exposedCaster.length > 0) {
      const details = exposedCaster.map(x => `${x.fake}（实为${x.real}，狐假虎威被识破并自毁）`).join('、')
      addSkillEffectLog(gameStore, `${caster.name}的${details}`)

    }

    if (exposedTarget.length > 0) {
      const details = exposedTarget.map(x => `${x.fake}（实为${x.real}，狐假虎威被识破并自毁）`).join('、')
      addSkillEffectLog(gameStore, `${target.name}的${details}`)
    }

    return {
      success: true,
      message: `交换了${swappedPairs.length}对城市${exposedCaster.length + exposedTarget.length > 0 ? '，部分伪装城市被识破' : ''}`
    }
  }

  /**
   * 先声夺人 - 交换1张卡牌（冷却3回合，每局限2次）
   */
  function executeXianShengDuoRen(caster, target, params = {}) {
    const { casterCityName } = params

    // 前置检查0：检查使用次数（每局限2次）
    if (!gameStore.xianshengduorenUsageCount) {
      gameStore.xianshengduorenUsageCount = {}
    }
    if (!gameStore.xianshengduorenUsageCount[caster.name]) {
      gameStore.xianshengduorenUsageCount[caster.name] = 0
    }
    if (gameStore.xianshengduorenUsageCount[caster.name] >= 2) {
      return {
        success: false,
        message: '先声夺人每局最多使用2次'
      }
    }

    // 前置检查0.5：检查冷却时间（3回合）
    if (gameStore.cooldowns && gameStore.cooldowns[caster.name] &&
        gameStore.cooldowns[caster.name]['先声夺人'] > 0) {
      const remainingCooldown = gameStore.cooldowns[caster.name]['先声夺人']
      return {
        success: false,
        message: `先声夺人冷却中，剩余${remainingCooldown}回合`
      }
    }

    // 前置检查1：必须提供casterCityName
    if (!casterCityName) {
      return {
        success: false,
        message: '未选择己方城市'
      }
    }

    // 前置检查2：构建可交换城市池（排除：谨慎交换集合、阵亡、中心城市、定海神针、钢铁城市、保护）
    function getEligibleCities(player) {
      const eligible = []
      // 关键修复：player.cities 是对象，使用 Object.entries 遍历
      Object.entries(player.cities).forEach(([cityName, city]) => {
        // 已阵亡不参与
        if (city.isAlive === false) return

        // 谨慎交换集合不参与（包括cautionSet和cautiousExchange）
        if (gameStore.isInCautiousSet(player.name, cityName)) return

        // 中心城市不参与
        if (city.isCenter) return

        // 定海神针不参与
        if (gameStore.anchored[player.name] && gameStore.anchored[player.name][cityName]) return

        // 钢铁城市不参与
        if (gameStore.hasIronShield(player.name, cityName)) return

        // 被保护不参与
        if (gameStore.hasProtection(player.name, cityName)) return

        eligible.push(cityName)
      })
      return eligible
    }

    const eligibleCaster = getEligibleCities(caster)
    const eligibleTarget = getEligibleCities(target)

    // 前置检查3：可交换城市数量检查
    if (eligibleCaster.length === 0 || eligibleTarget.length === 0) {
      return {
        success: false,
        message: '双方至少有一方没有可交换的城市（排除谨慎交换集合）'
      }
    }

    // 前置检查4：验证casterCityName在可选范围内
    if (!eligibleCaster.includes(casterCityName)) {
      return {
        success: false,
        message: '选择的城市不可交换（可能在谨慎交换集合或其他限制）'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('先声夺人', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 增加使用次数
    gameStore.xianshengduorenUsageCount[caster.name]++

    // 记录使用次数（用于UI显示）
    gameStore.recordSkillUsage(caster.name, '先声夺人')

    // 设置冷却时间（3回合）
    if (!gameStore.cooldowns) {
      gameStore.cooldowns = {}
    }
    if (!gameStore.cooldowns[caster.name]) {
      gameStore.cooldowns[caster.name] = {}
    }
    gameStore.cooldowns[caster.name]['先声夺人'] = 3

    // 创建待处理交换请求（使用cityName）
    const swap = gameStore.createPendingSwap(caster.name, target.name, casterCityName)

    console.log('[先声夺人] ===== 创建交换请求 =====')
    console.log('[先声夺人] 返回的 swap:', swap)
    console.log('[先声夺人] swap.initiatorCityName:', swap?.initiatorCityName)
    console.log('[先声夺人] 可交换城市列表:')
    console.log(`[先声夺人]   ${caster.name}: [${eligibleCaster.join(', ')}]`)
    console.log(`[先声夺人]   ${target.name}: [${eligibleTarget.join(', ')}]`)
    console.log('[先声夺人] ===============================')

    // 双日志：记录技能使用和待处理状态
    addSkillUsageLog(
      gameStore,
      caster.name,
      '先声夺人',
      `${caster.name}使用了先声夺人，等待${target.name}选择交换城市`,
      `${caster.name}使用了先声夺人`
    )

    console.log(`[先声夺人] ${caster.name} 发起请求 (剩余${2 - gameStore.xianshengduorenUsageCount[caster.name]}次)`)
    console.log(`[先声夺人] 待处理请求ID: ${swap.id}`)
    console.log(`[先声夺人] ${caster.name}选择: ${casterCityName}`)
    console.log(`[先声夺人] 等待${target.name}响应...`)

    return {
      success: true,
      message: `等待${target.name}选择交换城市（剩余${2 - gameStore.xianshengduorenUsageCount[caster.name]}次）`,
      pendingSwapId: swap.id,
      isPending: true // 标记为待处理状态
    }
  }

  /**
   * 接受先声夺人交换（目标玩家响应）
   */
  function acceptPreemptiveStrike(swapId, targetCityIdx) {
    // 关键修复：Pinia会自动解包ref，直接使用gameStore.pendingSwaps（不需要.value）
    const swap = gameStore.pendingSwaps.find(s => s.id === swapId)
    if (!swap || swap.status !== 'pending') {
      return {
        success: false,
        message: '未找到待处理的交换请求或请求已失效'
      }
    }

    const initiator = gameStore.players.find(p => p.name === swap.initiatorName)
    const targetPlayer = gameStore.players.find(p => p.name === swap.targetName)

    if (!initiator || !targetPlayer) {
      return {
        success: false,
        message: '玩家数据异常'
      }
    }

    // 验证targetCityIdx在可选范围内
    function getEligibleCities(player) {
      const eligible = []
      player.cities.forEach((city, idx) => {
        if (city.isAlive === false) return
        if (gameStore.isInCautiousSet(player.name, idx)) return
        if (city.isCenter) return
        if (gameStore.anchored[player.name] && gameStore.anchored[player.name][idx]) return
        if (gameStore.hasIronShield(player.name, idx)) return
        if (gameStore.hasProtection(player.name, idx)) return
        eligible.push(idx)
      })
      return eligible
    }

    const eligibleTarget = getEligibleCities(targetPlayer)
    if (!eligibleTarget.includes(targetCityIdx)) {
      return {
        success: false,
        message: '选择的城市不可交换'
      }
    }

    // 执行交换
    const initiatorCity = initiator.cities[swap.initiatorCityIdx]
    const targetCity = targetPlayer.cities[targetCityIdx]

    if (!initiatorCity || !targetCity) {
      return {
        success: false,
        message: '城市数据异常'
      }
    }

    // 执行交换（深拷贝交换，确保Vue响应式系统能检测到变化）
    // 保存交换前的城市信息（用于日志）
    const initiatorCityBeforeSwap = { ...initiatorCity }
    const targetCityBeforeSwap = { ...targetCity }

    // 方法1：深拷贝方式交换（推荐，确保Vue响应式）
    // 先深拷贝两个城市对象
    const tempInitiatorCity = JSON.parse(JSON.stringify(initiatorCity))
    const tempTargetCity = JSON.parse(JSON.stringify(targetCity))

    // 将目标城市的所有属性赋值给发起者城市的位置
    Object.keys(tempTargetCity).forEach(key => {
      initiator.cities[swap.initiatorCityIdx][key] = tempTargetCity[key]
    })

    // 将发起者城市的所有属性赋值给目标城市的位置
    Object.keys(tempInitiatorCity).forEach(key => {
      targetPlayer.cities[targetCityIdx][key] = tempInitiatorCity[key]
    })

    console.log('[先声夺人] 交换完成（深拷贝方式）')
    console.log(`[先声夺人] 发起者 ${initiator.name}[${swap.initiatorCityIdx}]:`,
      `${initiatorCityBeforeSwap.name} -> ${initiator.cities[swap.initiatorCityIdx].name}`)
    console.log(`[先声夺人] 目标 ${targetPlayer.name}[${targetCityIdx}]:`,
      `${targetCityBeforeSwap.name} -> ${targetPlayer.cities[targetCityIdx].name}`)

    // 注意：initialCities 现在按城市名称追踪（[playerName][cityName]），无需交换
    // 城市交换后，城市的初始HP记录会自动跟随城市名称
    // 例如：东营市的初始HP存储在 initialCities[playerName]['东营市']
    // 当东营市从玩家A移动到玩家B时，initialCities['玩家B']['东营市'] 会自动记录正确的初始HP
    console.log('[先声夺人] initialCities 按城市名称追踪，无需交换')

    // 交换疲劳streak值（存储在player.streaks[cityIdx]中）
    if (!initiator.streaks) initiator.streaks = {}
    if (!targetPlayer.streaks) targetPlayer.streaks = {}

    const tempInitiatorStreak = initiator.streaks[swap.initiatorCityIdx] || 0
    const tempTargetStreak = targetPlayer.streaks[targetCityIdx] || 0

    initiator.streaks[swap.initiatorCityIdx] = tempTargetStreak
    targetPlayer.streaks[targetCityIdx] = tempInitiatorStreak

    console.log('[先声夺人] 疲劳streak交换:',
      `${initiator.name}[${swap.initiatorCityIdx}]: ${tempInitiatorStreak} -> ${tempTargetStreak}`,
      `${targetPlayer.name}[${targetCityIdx}]: ${tempTargetStreak} -> ${tempInitiatorStreak}`)

    // 交换所有基于cityIdx的状态
    // 这些状态应该跟随城市一起交换，而不是清除
    swapCityIndexedStates(gameStore, initiator.name, swap.initiatorCityIdx, targetPlayer.name, targetCityIdx)

    // 清除特殊状态（这些状态不应该跟随交换）
    // 1. 伪装城市（狐假虎威）- 伪装是基于位置的，交换后应清除
    let disguiseCleared = false
    if (gameStore.disguisedCities[initiator.name] &&
        gameStore.disguisedCities[initiator.name][swap.initiatorCityIdx]) {
      delete gameStore.disguisedCities[initiator.name][swap.initiatorCityIdx]
      disguiseCleared = true
      console.log(`[先声夺人] 清除${initiator.name}的伪装状态`)
    }
    if (gameStore.disguisedCities[targetPlayer.name] &&
        gameStore.disguisedCities[targetPlayer.name][targetCityIdx]) {
      delete gameStore.disguisedCities[targetPlayer.name][targetCityIdx]
      disguiseCleared = true
      console.log(`[先声夺人] 清除${targetPlayer.name}的伪装状态`)
    }

    // 更新请求状态
    gameStore.updatePendingSwapStatus(swapId, 'accepted', targetCityIdx)

    // 双日志：记录交换完成（使用交换前的城市名称）
    const initiatorCityName = initiatorCityBeforeSwap.name || `城市${swap.initiatorCityIdx + 1}`
    const targetCityName = targetCityBeforeSwap.name || `城市${targetCityIdx + 1}`

    // 构建详细的交换信息
    const swapDetails = []
    swapDetails.push(`城市: ${initiatorCityName}(HP${Math.floor(initiatorCityBeforeSwap.currentHp || initiatorCityBeforeSwap.hp)}) ⇄ ${targetCityName}(HP${Math.floor(targetCityBeforeSwap.currentHp || targetCityBeforeSwap.hp)})`)
    swapDetails.push(`疲劳: streak ${tempInitiatorStreak} ⇄ ${tempTargetStreak}`)
    if (disguiseCleared) {
      swapDetails.push(`伪装状态已清除`)
    }

    addSkillEffectLog(
      gameStore,
      `(先声夺人) ${initiator.name}的${initiatorCityName} ⇄ ${targetPlayer.name}的${targetCityName}`
    )

    console.log(`[先声夺人] ===== 交换完成总结 =====`)
    console.log(`[先声夺人] ${initiator.name}[${swap.initiatorCityIdx}] ⇄ ${targetPlayer.name}[${targetCityIdx}]`)
    swapDetails.forEach(detail => console.log(`[先声夺人] - ${detail}`))
    console.log(`[先声夺人] ============================`)

    return {
      success: true,
      message: `交换成功：${initiatorCityName} ⇄ ${targetCityName}`
    }
  }

  /**
   * 拒绝先声夺人交换（目标玩家响应）- 需要花费11金币使用无懈可击技能
   */
  function rejectPreemptiveStrike(swapId) {
    // 关键修复：Pinia会自动解包ref，直接使用gameStore.pendingSwaps（不需要.value）
    const swap = gameStore.pendingSwaps.find(s => s.id === swapId)
    if (!swap || swap.status !== 'pending') {
      return {
        success: false,
        message: '未找到待处理的交换请求或请求已失效'
      }
    }

    // 找到目标玩家（拒绝者）
    const targetPlayer = gameStore.players.find(p => p.name === swap.targetName)
    if (!targetPlayer) {
      return {
        success: false,
        message: '玩家数据异常'
      }
    }

    // 检查金币是否足够（需要11金币使用无懈可击）
    if (targetPlayer.gold < 11) {
      return {
        success: false,
        message: `拒绝交换需要使用无懈可击技能（花费11金币），当前金币不足（${targetPlayer.gold}/11）`
      }
    }

    // 扣除金币
    targetPlayer.gold -= 11
    console.log(`[先声夺人] ${swap.targetName}使用无懈可击拒绝交换，花费11金币，剩余${targetPlayer.gold}金币`)

    // 更新请求状态
    gameStore.updatePendingSwapStatus(swapId, 'rejected')

    // 关键修复：退还发起者的使用次数和清除冷却（因为交换被拒绝了）
    if (gameStore.xianshengduorenUsageCount && gameStore.xianshengduorenUsageCount[swap.initiatorName]) {
      gameStore.xianshengduorenUsageCount[swap.initiatorName]--
      console.log(`[先声夺人] 退还${swap.initiatorName}的使用次数，剩余${2 - gameStore.xianshengduorenUsageCount[swap.initiatorName]}次`)
    }

    // 清除冷却时间
    if (gameStore.cooldowns && gameStore.cooldowns[swap.initiatorName] &&
        gameStore.cooldowns[swap.initiatorName]['先声夺人']) {
      gameStore.cooldowns[swap.initiatorName]['先声夺人'] = 0
      console.log(`[先声夺人] 清除${swap.initiatorName}的冷却时间`)
    }

    // 双日志：记录拒绝（使用无懈可击）
    addSkillEffectLog(
      gameStore,
      `(先声夺人) ${swap.targetName}使用无懈可击拒绝了${swap.initiatorName}的交换请求（花费11金币）`
    )

    console.log(`[先声夺人] ${swap.targetName}拒绝了交换请求`)

    return {
      success: true,
      message: `已使用无懈可击拒绝交换请求（花费11金币，剩余${targetPlayer.gold}金币）`
    }
  }

  /**
   * 金币贷款 - 获得5金币，但2回合无法获得金币（每局限1次）
   */
  function executeJinBiDaiKuan(caster) {
    // 检查使用次数（每局限1次）
    if (!gameStore.jinbidaikuanUsageCount) {
      gameStore.jinbidaikuanUsageCount = {}
    }
    if (gameStore.jinbidaikuanUsageCount[caster.name] >= 1) {
      return {
        success: false,
        message: '金币贷款每局只能使用1次'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('金币贷款', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 增加使用次数
    if (!gameStore.jinbidaikuanUsageCount[caster.name]) {
      gameStore.jinbidaikuanUsageCount[caster.name] = 0
    }
    gameStore.jinbidaikuanUsageCount[caster.name]++

    // 记录使用次数（用于UI显示）
    gameStore.recordSkillUsage(caster.name, '金币贷款')

    // 立即获得5金币（原版逻辑）
    caster.gold = Math.min(caster.gold + 5, 24)

    // 设置2回合冷却期（接下来2回合无法获得自动金币）
    // 使用gameStore.goldLoanRounds统一管理状态
    gameStore.goldLoanRounds[caster.name] = 2

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '金币贷款',
      `${caster.name}使用金币贷款，获得5金币但接下来2回合无法获得自动金币（每局限1次）`,
      `${caster.name}使用了金币贷款`
    )

    return {
      success: true,
      message: '获得5金币，但接下来2回合无法获得自动金币'
    }
  }

  /**
   * 定海神针 - 城市10回合不会被交换（冷却1回合）
   */
  function executeDingHaiShenZhen(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // 检查冷却时间（1回合）
    if (gameStore.cooldowns && gameStore.cooldowns[caster.name] &&
        gameStore.cooldowns[caster.name]['定海神针'] > 0) {
      const remainingCooldown = gameStore.cooldowns[caster.name]['定海神针']
      return {
        success: false,
        message: `定海神针冷却中，剩余${remainingCooldown}回合`
      }
    }

    // 获取城市索引
    const cityIdx = caster.cities.indexOf(selfCity)
    if (cityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('定海神针', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 设置冷却时间（1回合）
    if (!gameStore.cooldowns) {
      gameStore.cooldowns = {}
    }
    if (!gameStore.cooldowns[caster.name]) {
      gameStore.cooldowns[caster.name] = {}
    }
    gameStore.cooldowns[caster.name]['定海神针'] = 1

    // 在gameStore中设置定海神针
    if (!gameStore.anchored[caster.name]) {
      gameStore.anchored[caster.name] = {}
    }
    gameStore.anchored[caster.name][cityIdx] = 10

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '定海神针',
      `${caster.name}对${selfCity.name}使用定海神针，10回合内不会被交换`,
      `${caster.name}使用了定海神针`
    )

    return {
      success: true,
      message: `${selfCity.name}已固定位置，10回合内不会被交换`
    }
  }

  /**
   * 焕然一新 - 重置城市专属技能到初始状态（已使用次数恢复到0）
   */
  function executeHuanRanYiXin(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('焕然一新', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 重置城市专属技能的使用次数
    if (selfCity.skillUsageCount) {
      selfCity.skillUsageCount = 0
    }

    // 如果城市有特殊状态，也可以清除（可选）
    if (selfCity.specialState) {
      delete selfCity.specialState
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '焕然一新',
      `${caster.name}对${selfCity.name}使用焕然一新，城市专属技能使用次数已重置`,
      `${caster.name}使用了焕然一新`
    )

    return {
      success: true,
      message: `${selfCity.name}的城市专属技能使用次数已重置到0`
    }
  }

  /**
   * 苟延残喘 - 获得2个HP<1000的城市
   */
  function executeGouYanCanChuan(caster) {
    // 从未使用城市池中筛选HP<1000的城市
    const unusedCities = gameStore.getUnusedCities()
    const lowHpCities = unusedCities.filter(city => city.hp < 1000)

    if (lowHpCities.length < 2) {
      return {
        success: false,
        message: `城市池中HP<1000的城市不足（仅剩${lowHpCities.length}个）`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('苟延残喘', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 随机抽取2个
    const shuffled = lowHpCities.sort(() => Math.random() - 0.5)
    const selectedCities = shuffled.slice(0, 2)

    const addedCities = []

    for (const cityData of selectedCities) {
      // 创建城市副本
      const newCity = {
        name: cityData.name,
        hp: cityData.hp,
        currentHp: cityData.hp,
        baseHp: cityData.hp,
        isAlive: true,
        red: cityData.red || 0,
        green: cityData.green || 0,
        blue: cityData.blue || 0,
        yellow: cityData.yellow || 0,
        modifiers: []
      }

      // 添加到玩家城市列表
      caster.cities.push(newCity)
      addedCities.push(newCity)

      // 标记为已使用
      gameStore.markCityAsUsed(cityData.name)

      // 记录到initialCities
      if (!gameStore.initialCities[caster.name]) {
        gameStore.initialCities[caster.name] = []
      }
      gameStore.initialCities[caster.name].push(newCity)
    }

    // 如果总城市数≤5，自动加入roster
    if (caster.cities.length <= 5) {
      if (!gameStore.roster[caster.name]) {
        gameStore.roster[caster.name] = []
      }
      // 加入最后两个城市的索引
      const idx1 = caster.cities.length - 2
      const idx2 = caster.cities.length - 1
      if (!gameStore.roster[caster.name].includes(idx1)) {
        gameStore.roster[caster.name].push(idx1)
      }
      if (!gameStore.roster[caster.name].includes(idx2)) {
        gameStore.roster[caster.name].push(idx2)
      }
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '苟延残喘',
      `${caster.name}使用苟延残喘，获得了${addedCities.map(c => `${c.name}(${c.hp})`).join('、')}`,
      `${caster.name}使用了苟延残喘`
    )

    return {
      success: true,
      message: `获得了2个小血量城市：${addedCities.map(c => c.name).join('、')}`
    }
  }

  /**
   * 高级治疗 - 2个城市撤下，2回合后满血返回
   * 注意：战斗预备城市（roster）概念已删除，现在只检查城市是否存活和受伤
   */
  function executeGaoJiZhiLiao(caster, cityIndices) {
    if (!cityIndices || cityIndices.length !== 2) {
      return { success: false, message: '需要选择2个城市' }
    }

    // 筛选存活且非满血的城市
    const cities = cityIndices.map(idx => {
      const city = caster.cities[idx]
      if (!city) {
        console.log(`[高级治疗] 城市索引 ${idx} 不存在`)
        return null
      }

      // 检查城市是否存活
      if (city.isAlive === false) {
        console.log(`[高级治疗] ${city.name} 已死亡`)
        return null
      }

      // 检查是否非满血
      const currentHp = city.currentHp || city.hp

      // 获取城市的初始HP（最大HP）
      // 注意：initialCities 可能是数组结构或对象结构
      let initialCity = null
      let maxHp = city.hp

      if (gameStore.initialCities[caster.name]) {
        const initialData = gameStore.initialCities[caster.name]

        // 检查是数组还是对象
        if (Array.isArray(initialData)) {
          // 数组结构：按索引查找
          initialCity = initialData[idx]
          console.log(`[高级治疗] 从数组结构获取 initialCity[${idx}]:`, initialCity)
        } else {
          // 对象结构：按城市名称查找
          initialCity = initialData[city.name]
          console.log(`[高级治疗] 从对象结构获取 initialCity['${city.name}']:`, initialCity)
        }

        if (initialCity) {
          maxHp = initialCity.hp
        }
      }

      console.log(`[高级治疗] ${city.name}:`)
      console.log(`  - city.currentHp: ${city.currentHp}`)
      console.log(`  - city.hp: ${city.hp}`)
      console.log(`  - currentHp (computed): ${currentHp}`)
      console.log(`  - maxHp (from initialCities): ${maxHp}`)
      console.log(`  - initialCity:`, initialCity)
      console.log(`  - 受伤: ${currentHp < maxHp}`)

      if (currentHp >= maxHp) {
        console.log(`[高级治疗] ${city.name} 满血，无法治疗`)
        return null
      }

      return { city, idx, maxHp }
    }).filter(item => item !== null)

    console.log(`[高级治疗] 筛选后的城市数量: ${cities.length}`)

    if (cities.length !== 2) {
      return {
        success: false,
        message: '需要选择2个存活且受伤的城市'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('高级治疗', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 注意：roster系统已删除，城市不需要从roster中移除
    // 城市通过bannedCities机制禁用2回合，通过isInHealing标记状态

    // 设置healing状态（2回合后返回）
    cities.forEach(({ city, idx, maxHp }) => {
      city.modifiers = city.modifiers || []
      city.modifiers.push({
        type: 'healing',
        roundsLeft: 2,
        returnHp: maxHp,  // 返回时恢复到正确的满血值（从initialCities获取）
        originalIdx: idx
      })

      // 标记该城市正在治疗中（可用于UI显示）
      city.isInHealing = true
    })

    // 设置bannedCities禁用记录（2回合无法出战）
    if (!gameStore.bannedCities[caster.name]) {
      gameStore.bannedCities[caster.name] = {}
    }
    cities.forEach(({ idx }) => {
      gameStore.bannedCities[caster.name][idx] = 2
    })

    const cityNames = cities.map(({ city }) => city.name).join('、')
    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '高级治疗',
      `${caster.name}对${cityNames}使用高级治疗，2回合后满血返回`,
      `${caster.name}使用了高级治疗`
    )

    return {
      success: true,
      message: `${cityNames}撤下治疗，2回合后满血返回`
    }
  }

  /**
   * 众志成城 - 平均分配3-5个城市的HP
   */
  function executeZhongZhiChengCheng(caster, cityIndices) {
    // 检查己方存活城市数是否≥3
    const aliveCities = caster.cities.filter(c => c.isAlive !== false)
    if (aliveCities.length < 3) {
      return {
        success: false,
        message: '己方城市数需要≥3才能使用众志成城'
      }
    }

    if (!cityIndices || cityIndices.length < 3 || cityIndices.length > 5) {
      return { success: false, message: '需要选择3-5个城市' }
    }

    const cities = cityIndices.map(idx => caster.cities[idx]).filter(c => c && c.isAlive !== false)

    if (cities.length < 3) {
      return { success: false, message: '选择的存活城市数量不足3个' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('众志成城', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 计算总HP并平均分配
    const totalHp = cities.reduce((sum, c) => sum + (c.currentHp || c.hp), 0)
    const avgHp = Math.floor(totalHp / cities.length)

    cities.forEach(city => {
      city.currentHp = avgHp
    })

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '众志成城',
      `${caster.name}使用众志成城，${cities.length}个城市HP平均为${avgHp}`,
      `${caster.name}使用了众志成城`
    )

    return {
      success: true,
      message: `${cities.length}个城市HP已平均分配为${avgHp}`
    }
  }

  /**
   * 无中生有 - 从城市池随机获得1座城市
   */
  function executeWuZhongShengYou(caster) {
    // 从未使用的城市池中抽取
    const unusedCities = gameStore.getUnusedCities()

    if (unusedCities.length === 0) {
      return {
        success: false,
        message: '城市池已空，无法抽取'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('无中生有', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 随机选择一个未使用的城市
    const randomCity = unusedCities[Math.floor(Math.random() * unusedCities.length)]

    // 创建城市副本（避免引用问题）
    const newCity = {
      name: randomCity.name,
      hp: randomCity.hp,
      currentHp: randomCity.hp,
      baseHp: randomCity.hp,
      isAlive: true,
      red: randomCity.red || 0,
      green: randomCity.green || 0,
      blue: randomCity.blue || 0,
      yellow: randomCity.yellow || 0,
      modifiers: []
    }

    // 添加到玩家城市列表
    caster.cities.push(newCity)

    // 标记为已使用
    gameStore.markCityAsUsed(randomCity.name)

    // 记录到initialCities（如果有该系统）
    if (!gameStore.initialCities[caster.name]) {
      gameStore.initialCities[caster.name] = []
    }
    gameStore.initialCities[caster.name].push(newCity)

    // 如果总城市数≤5，自动加入roster
    if (caster.cities.length <= 5) {
      if (!gameStore.roster[caster.name]) {
        gameStore.roster[caster.name] = []
      }
      const newIdx = caster.cities.length - 1
      if (!gameStore.roster[caster.name].includes(newIdx)) {
        gameStore.roster[caster.name].push(newIdx)
      }
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '无中生有',
      `${caster.name}使用无中生有，获得了${newCity.name}(HP: ${newCity.hp})`,
      `${caster.name}使用了无中生有`
    )

    return {
      success: true,
      message: `获得了${newCity.name}(HP: ${newCity.hp})`
    }
  }

  /**
   * 好高骛远 - 用血量更高的城市替换
   */
  function executeHaoGaoWuYuan(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    const currentHp = selfCity.currentHp || selfCity.hp

    // 从未使用城市池中筛选HP更高的城市
    const unusedCities = gameStore.getUnusedCities()
    const higherHpCities = unusedCities.filter(city => city.hp > currentHp)

    if (higherHpCities.length === 0) {
      return {
        success: false,
        message: '城市池中没有HP更高的城市'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('好高骛远', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 随机选择一个HP更高的城市
    const randomCity = higherHpCities[Math.floor(Math.random() * higherHpCities.length)]

    // 创建新城市（保留原城市的技能等级）
    const newCity = {
      name: randomCity.name,
      hp: randomCity.hp,
      currentHp: randomCity.hp,
      baseHp: randomCity.hp,
      isAlive: true,
      red: selfCity.red || 0,     // 保留原技能等级
      green: selfCity.green || 0,
      blue: selfCity.blue || 0,
      yellow: selfCity.yellow || 0,
      modifiers: selfCity.modifiers || []
    }

    // 找到原城市在数组中的索引
    const idx = caster.cities.indexOf(selfCity)
    if (idx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    // 替换城市
    caster.cities[idx] = newCity

    // 标记新城市为已使用
    gameStore.markCityAsUsed(randomCity.name)

    // 更新initialCities（为新城市创建正确的初始记录）
    if (gameStore.initialCities[caster.name]) {
      gameStore.initialCities[caster.name][idx] = {
        name: newCity.name,
        hp: newCity.hp,
        currentHp: newCity.hp,
        baseHp: newCity.hp,
        isAlive: true,
        red: newCity.red,
        green: newCity.green,
        blue: newCity.blue,
        yellow: newCity.yellow
      }
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '好高骛远',
      `${caster.name}使用好高骛远，${selfCity.name}(${currentHp})被替换为${newCity.name}(${newCity.hp})`,
      `${caster.name}使用了好高骛远`
    )

    return {
      success: true,
      message: `城市已强化，${selfCity.name} → ${newCity.name}(HP: ${newCity.hp})`
    }
  }

  /**
   * 狐假虎威 - 伪装城市信息
   */
  function executeHuJiaHuWei(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // 从未使用城市池中筛选HP≥10000的城市作为伪装数据源
    const unusedCities = gameStore.getUnusedCities()
    const highHpCities = unusedCities.filter(city => city.hp >= 10000)

    if (highHpCities.length === 0) {
      return {
        success: false,
        message: '城市池中没有HP≥10000的城市可用于伪装'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('狐假虎威', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 随机选择一个高HP城市作为伪装模板
    const disguiseTemplate = highHpCities[Math.floor(Math.random() * highHpCities.length)]

    // 获取城市索引
    const cityIdx = caster.cities.indexOf(selfCity)
    if (cityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    // 初始化disguisedCities
    if (!gameStore.disguisedCities[caster.name]) {
      gameStore.disguisedCities[caster.name] = {}
    }

    // 设置伪装数据（m/cur/n三重HP追踪）
    gameStore.disguisedCities[caster.name][cityIdx] = {
      m: disguiseTemplate.hp,              // 初始伪装HP
      cur: disguiseTemplate.hp,            // 当前伪装HP（会随伤害变化）
      n: selfCity.currentHp || selfCity.hp, // 真实HP（隐藏）
      fakeName: disguiseTemplate.name,     // 伪装名称
      paid: false,                         // 被拆穿时扣9金币标记
      roundsLeft: 3                        // 持续3回合
    }

    // 清除该城市的已知状态（对手不知道这是什么城市）
    gameStore.clearCityKnownStatus(caster.name, cityIdx)

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '狐假虎威',
      `${caster.name}对${selfCity.name}使用狐假虎威，伪装成${disguiseTemplate.name}(${disguiseTemplate.hp}HP)，持续3回合`,
      `${caster.name}使用了狐假虎威`
    )

    return {
      success: true,
      message: `${selfCity.name}伪装成${disguiseTemplate.name}，持续3回合`
    }
  }

  /**
   * 抛砖引玉 - 花费2金币，随机自毁己方一座2000以下HP城市，随机获得1-5金币，每局限1次
   */
  function executePaoZhuanYinYu(caster) {
    // 检查每局限1次
    if (!gameStore.paoZhuanYinYuUsed) {
      gameStore.paoZhuanYinYuUsed = {}
    }

    if (gameStore.paoZhuanYinYuUsed[caster.name]) {
      return {
        success: false,
        message: '抛砖引玉每局只能使用1次，您已经使用过了'
      }
    }

    // 找到所有HP<2000的存活非中心城市
    const eligibleCities = caster.cities
      .map((city, idx) => ({ city, idx }))
      .filter(({ city, idx }) => {
        const currentHp = city.currentHp !== undefined ? city.currentHp : city.hp
        const isCenter = idx === caster.centerIndex
        return city.isAlive !== false && currentHp < 2000 && !isCenter
      })

    if (eligibleCities.length === 0) {
      return {
        success: false,
        message: '没有可自毁的城市（需要HP<2000的非中心城市）'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('抛砖引玉', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 随机选择一座城市
    const randomIndex = Math.floor(Math.random() * eligibleCities.length)
    const { city: targetCity, idx: cityIdx } = eligibleCities[randomIndex]

    // 记录HP用于日志
    const oldHp = targetCity.currentHp !== undefined ? targetCity.currentHp : targetCity.hp

    // 自毁城市
    targetCity.currentHp = 0
    if (targetCity.hp !== undefined) {
      targetCity.hp = 0
    }
    targetCity.isAlive = false

    // 随机获得1-5金币
    const goldGain = Math.floor(Math.random() * 5) + 1  // 1-5
    const beforeGold = caster.gold
    caster.gold = Math.min(24, caster.gold + goldGain)

    // 标记已使用
    gameStore.paoZhuanYinYuUsed[caster.name] = true

    // 记录使用次数（用于UI显示）
    gameStore.recordSkillUsage(caster.name, '抛砖引玉')

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '抛砖引玉',
      `${caster.name}使用抛砖引玉，自毁${targetCity.name}(HP:${Math.floor(oldHp)})，获得${goldGain}金币(${beforeGold}→${caster.gold})`,
      `${caster.name}使用了抛砖引玉，自毁${targetCity.name}，获得${goldGain}金币`
    )

    return {
      success: true,
      message: `自毁${targetCity.name}，获得${goldGain}金币`
    }
  }

  /**
   * 进制扭曲 - 将HP从八进制转为十进制
   */
  function executeJinZhiNiuQu(caster, target, targetCity) {
    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '进制扭曲')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '进制扭曲',
        `${caster.name}使用进制扭曲，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了进制扭曲`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('进制扭曲', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取城市索引
    const cityIdx = target.cities.indexOf(targetCity)

    // 检查并消耗保护罩/钢铁护盾
    if (gameStore.consumeProtection(target.name, cityIdx)) {
      addSkillEffectLog(gameStore, `进制扭曲被${target.name}的${targetCity.name}护盾抵消`)
      return {
        success: true,
        message: `效果被护盾抵消`
      }
    }

    const currentHp = targetCity.currentHp || targetCity.hp
    const hpStr = currentHp.toString()

    // 检查是否包含8或9
    if (hpStr.includes('8') || hpStr.includes('9')) {
      return { success: false, message: 'HP中包含8或9，无法使用' }
    }

    // 八进制转十进制
    const newHp = parseInt(hpStr, 8)
    targetCity.currentHp = newHp

    // 检查是否阵亡
    if (newHp <= 0) {
      targetCity.isAlive = false

      // 添加到deadCities列表
      if (!gameStore.deadCities[target.name]) {
        gameStore.deadCities[target.name] = []
      }
      if (cityIdx !== -1 && !gameStore.deadCities[target.name].includes(cityIdx)) {
        gameStore.deadCities[target.name].push(cityIdx)
      }

      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '进制扭曲',
        `${caster.name}对${target.name}的${targetCity.name}使用进制扭曲，HP从${currentHp}变为${newHp}，城市阵亡`,
        `${caster.name}使用了进制扭曲`
      )
    } else {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '进制扭曲',
        `${caster.name}对${target.name}的${targetCity.name}使用进制扭曲，HP从${currentHp}变为${newHp}`,
        `${caster.name}使用了进制扭曲`
      )
    }

    return {
      success: true,
      message: `HP从${currentHp}(八进制)变为${newHp}(十进制)`
    }
  }

  /**
   * 一落千丈 - 当前HP和初始HP都除以3
   */
  function executeYiLuoQianZhang(caster, target, targetCity) {
    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    // 不能对中心城市使用
    if (targetCity.isCenter) {
      return { success: false, message: '无法对中心城市使用' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '一落千丈')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '一落千丈',
        `${caster.name}使用一落千丈，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了一落千丈`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('一落千丈', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取城市索引
    const cityIdx = target.cities.indexOf(targetCity)

    // 检查并消耗保护罩/钢铁护盾
    if (gameStore.consumeProtection(target.name, cityIdx)) {
      addSkillEffectLog(gameStore, `一落千丈被${target.name}的${targetCity.name}护盾抵消`)
      return {
        success: true,
        message: `效果被护盾抵消`
      }
    }

    const currentHp = targetCity.currentHp || targetCity.hp
    const newCurrentHp = Math.floor(currentHp / 3)
    const newBaseHp = Math.floor(targetCity.hp / 3)

    targetCity.currentHp = newCurrentHp
    targetCity.hp = newBaseHp  // 同时修改初始HP

    // 检查是否阵亡
    if (newCurrentHp <= 0) {
      targetCity.isAlive = false

      // 添加到deadCities列表
      if (!gameStore.deadCities[target.name]) {
        gameStore.deadCities[target.name] = []
      }
      if (cityIdx !== -1 && !gameStore.deadCities[target.name].includes(cityIdx)) {
        gameStore.deadCities[target.name].push(cityIdx)
      }

      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '一落千丈',
        `${caster.name}对${target.name}的${targetCity.name}使用一落千丈，当前HP从${currentHp}降至${newCurrentHp}，初始HP降至${newBaseHp}，城市阵亡`,
        `${caster.name}使用了一落千丈`
      )
    } else {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '一落千丈',
        `${caster.name}对${target.name}的${targetCity.name}使用一落千丈，当前HP从${currentHp}降至${newCurrentHp}，初始HP降至${newBaseHp}`,
        `${caster.name}使用了一落千丈`
      )
    }

    return {
      success: true,
      message: `${targetCity.name}的HP降至${newCurrentHp}`
    }
  }

  /**
   * 连续打击 - 2个城市当前HP和初始HP都除以2
   */
  function executeLianXuDaJi(caster, target, cityIndices) {
    if (!cityIndices || cityIndices.length !== 2) {
      return { success: false, message: '需要选择2个城市' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '连续打击')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '连续打击',
        `${caster.name}使用连续打击，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了连续打击`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('连续打击', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 筛选有效城市（存活、非中心）
    const validCities = []
    for (const idx of cityIndices) {
      const city = target.cities[idx]
      if (!city || city.isAlive === false || city.isCenter) {
        continue
      }
      validCities.push({ city, idx })
    }

    if (validCities.length !== 2) {
      return { success: false, message: '需要选择2个有效的非中心存活城市' }
    }

    // 对每个城市检查护盾并造成伤害
    const affectedCities = []
    const blockedCities = []

    for (const { city, idx } of validCities) {
      // 检查并消耗保护罩/钢铁护盾
      if (gameStore.consumeProtection(target.name, idx)) {
        blockedCities.push(city.name)
        continue
      }

      // 造成伤害：当前HP和初始HP都除以2
      const currentHp = city.currentHp || city.hp
      const newCurrentHp = Math.floor(currentHp / 2)
      const newBaseHp = Math.floor(city.hp / 2)

      city.currentHp = newCurrentHp
      city.hp = newBaseHp  // 同时修改初始HP

      // 检查是否阵亡
      if (newCurrentHp <= 0) {
        city.isAlive = false

        // 添加到deadCities列表
        if (!gameStore.deadCities[target.name]) {
          gameStore.deadCities[target.name] = []
        }
        if (!gameStore.deadCities[target.name].includes(idx)) {
          gameStore.deadCities[target.name].push(idx)
        }
      }

      affectedCities.push(city.name)
    }

    // 记录日志
    if (blockedCities.length > 0) {
      addSkillEffectLog(gameStore, `连续打击被${target.name}的${blockedCities.join('、')}护盾抵消`)
    }
    if (affectedCities.length > 0) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '连续打击',
        `${caster.name}对${target.name}的${affectedCities.join('、')}使用连续打击，当前HP和初始HP都除以2`,
        `${caster.name}使用了连续打击`
      )
    }

    if (affectedCities.length === 0 && blockedCities.length > 0) {
      return {
        success: true,
        message: '所有伤害被护盾抵消'
      }
    }

    return {
      success: true,
      message: `${affectedCities.join('、')}的HP已减半${blockedCities.length > 0 ? `，${blockedCities.join('、')}被护盾保护` : ''}`
    }
  }

  /**
   * 波涛汹涌 - 所有沿海城市HP减半，本回合出战沿海城市战斗前再次减半
   * 新版本：所有沿海城市HP减半 + 本回合出战沿海城市战斗前再减半（仅本回合）
   */
  function executeBoTaoXiongYong(caster, target) {
    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '波涛汹涌')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '波涛汹涌',
        `${caster.name}使用波涛汹涌，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了波涛汹涌`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('波涛汹涌', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 第一部分：获取对手所有沿海城市
    const coastalCities = []

    target.cities.forEach((city, idx) => {
      if (city && city.isAlive !== false && city.isCoastal) {
        coastalCities.push({ city, idx })
      }
    })

    // 对所有沿海城市HP减半
    const affectedCities = []
    const blockedCities = []

    for (const { city, idx } of coastalCities) {
      // 检查并消耗保护罩/钢铁护盾
      if (gameStore.consumeProtection(target.name, idx)) {
        blockedCities.push(city.name)
        continue
      }

      // 沿海城市HP减半
      const currentHp = city.currentHp || city.hp
      const newHp = Math.floor(currentHp / 2)
      city.currentHp = newHp

      // 检查是否阵亡
      if (newHp <= 0) {
        city.isAlive = false

        // 添加到deadCities列表
        if (!gameStore.deadCities[target.name]) {
          gameStore.deadCities[target.name] = []
        }
        if (!gameStore.deadCities[target.name].includes(idx)) {
          gameStore.deadCities[target.name].push(idx)
        }
      }

      affectedCities.push(city.name)
    }

    // 第二部分：设置本回合出战沿海城市战斗前再次减半的标记
    if (!gameStore.botaoxiongyong) {
      gameStore.botaoxiongyong = {}
    }
    gameStore.botaoxiongyong[target.name] = {
      active: true,
      roundsLeft: 1  // 仅本回合有效
    }

    // 记录日志
    if (blockedCities.length > 0) {
      addSkillEffectLog(gameStore, `波涛汹涌被${target.name}的${blockedCities.join('、')}护盾抵消`)
    }

    const logMessage = affectedCities.length > 0
      ? `${caster.name}对${target.name}使用波涛汹涌，${affectedCities.length}个沿海城市HP减半，本回合出战沿海城市战斗前将再次减半`
      : `${caster.name}对${target.name}使用波涛汹涌，本回合出战沿海城市战斗前HP将减半`

    addSkillEffectLog(gameStore, logMessage)


    if (affectedCities.length === 0 && blockedCities.length === 0) {
      return {
        success: true,
        message: '本回合出战沿海城市战斗前HP将减半'
      }
    }

    if (affectedCities.length === 0 && blockedCities.length > 0) {
      return {
        success: true,
        message: '所有沿海城市被护盾保护，但本回合出战沿海城市战斗前HP仍将减半'
      }
    }

    return {
      success: true,
      message: `${affectedCities.length}个沿海城市HP减半${blockedCities.length > 0 ? `（${blockedCities.length}个被护盾保护）` : ''}，本回合出战沿海城市战斗前将再次减半`
    }
  }

  /**
   * 狂轰滥炸 - 所有城市各受1500伤害
   */
  function executeKuangHongLanZha(caster, target) {
    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '狂轰滥炸')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '狂轰滥炸',
        `${caster.name}使用狂轰滥炸，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了狂轰滥炸`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('狂轰滥炸', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取所有存活城市（带索引）
    const aliveCities = []
    target.cities.forEach((city, idx) => {
      if (city.isAlive !== false) {
        aliveCities.push({ city, idx })
      }
    })

    if (aliveCities.length === 0) {
      return { success: false, message: '没有存活城市' }
    }

    // 对每个城市检查护盾并造成伤害
    let affectedCount = 0
    let blockedCount = 0
    let casualties = 0

    for (const { city, idx } of aliveCities) {
      // 检查并消耗保护罩/钢铁护盾
      if (gameStore.consumeProtection(target.name, idx)) {
        blockedCount++
        continue
      }

      // 造成伤害
      const currentHp = city.currentHp || city.hp
      const newHp = Math.max(0, currentHp - 1500)
      city.currentHp = newHp

      // 检查是否阵亡
      if (newHp <= 0) {
        city.isAlive = false
        casualties++

        // 添加到deadCities列表
        if (!gameStore.deadCities[target.name]) {
          gameStore.deadCities[target.name] = []
        }
        if (!gameStore.deadCities[target.name].includes(idx)) {
          gameStore.deadCities[target.name].push(idx)
        }
      }

      affectedCount++
    }

    // 记录日志
    if (blockedCount > 0) {
      addSkillEffectLog(gameStore, `狂轰滥炸被${target.name}的${blockedCount}个城市护盾抵消`)
    }
    if (affectedCount > 0) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '狂轰滥炸',
        `${caster.name}对${target.name}的${affectedCount}个城市使用狂轰滥炸，摧毁${casualties}个`,
        `${caster.name}使用了狂轰滥炸`
      )
    }

    if (affectedCount === 0 && blockedCount > 0) {
      return {
        success: true,
        message: '所有伤害被护盾抵消'
      }
    }

    return {
      success: true,
      message: `造成${affectedCount}×1500伤害，摧毁${casualties}个城市${blockedCount > 0 ? `，${blockedCount}个被护盾保护` : ''}`
    }
  }

  /**
   * 横扫一空 - 随机清空对手3座城市的城市专属技能
   */
  function executeHengSaoYiKong(caster, target) {
    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '横扫一空')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '横扫一空',
        `${caster.name}使用横扫一空，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了横扫一空`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('横扫一空', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 筛选出有专属技能的城市（存活且有skillUsageCount定义的城市）
    const citiesWithSkills = []
    target.cities.forEach((city, idx) => {
      if (city && city.isAlive !== false && city.currentHp > 0 && city.skillUsageCount !== undefined) {
        citiesWithSkills.push({ city, idx })
      }
    })

    if (citiesWithSkills.length === 0) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '横扫一空',
        `${caster.name}对${target.name}使用横扫一空，但对手没有拥有专属技能的城市`,
        `${caster.name}使用了横扫一空`
      )
      return {
        success: false,
        message: `对手没有拥有专属技能的城市`
      }
    }

    // 随机选择最多3座城市
    const numToSelect = Math.min(3, citiesWithSkills.length)
    const selectedCities = []

    // Fisher-Yates洗牌算法随机选择
    const shuffled = [...citiesWithSkills]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    for (let i = 0; i < numToSelect; i++) {
      selectedCities.push(shuffled[i])
    }

    // 清空选中城市的技能使用次数
    const clearedCityNames = []
    selectedCities.forEach(({ city, idx }) => {
      city.skillUsageCount = 0
      clearedCityNames.push(city.name)
    })

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '横扫一空',
      `${caster.name}对${target.name}使用横扫一空，清空了${clearedCityNames.length}座城市的专属技能：${clearedCityNames.join('、')}`,
      `${caster.name}使用了横扫一空`
    )

    return {
      success: true,
      message: `清空了${clearedCityNames.length}座城市的专属技能：${clearedCityNames.join('、')}`
    }
  }

  /**
   * 万箭齐发 - 造成己方总HP的50%伤害
   */
  function executeWanJianQiFa(caster, target, targetCity) {
    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '万箭齐发')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '万箭齐发',
        `${caster.name}使用万箭齐发，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了万箭齐发`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('万箭齐发', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // ✅ 修复：计算每个城市HP×50%之和，而非总HP×50%
    // PDF规则："己方所有城市同时攻击，造成各自HP一半伤害"
    // 每个城市先计算floor(HP×0.5)，然后求和
    const totalDamage = caster.cities
      .filter(c => c.isAlive !== false)
      .reduce((sum, c) => sum + Math.floor((c.currentHp || c.hp) * 0.5), 0)

    // 获取城市索引
    const cityIdx = target.cities.indexOf(targetCity)

    // 检查并消耗保护罩/钢铁护盾
    if (gameStore.consumeProtection(target.name, cityIdx)) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '万箭齐发',
        `${caster.name}的万箭齐发击破了${target.name}的${targetCity.name}护盾`,
        `${caster.name}使用了万箭齐发`
      )
      return {
        success: true,
        message: `击破了${targetCity.name}的护盾`
      }
    }

    // 造成伤害
    const currentHp = targetCity.currentHp || targetCity.hp
    targetCity.currentHp = Math.max(0, currentHp - totalDamage)

    // 检查是否阵亡
    if (targetCity.currentHp <= 0) {
      targetCity.isAlive = false

      // 添加到deadCities列表
      if (!gameStore.deadCities[target.name]) {
        gameStore.deadCities[target.name] = []
      }
      if (cityIdx !== -1 && !gameStore.deadCities[target.name].includes(cityIdx)) {
        gameStore.deadCities[target.name].push(cityIdx)
      }

      // ✅ 检查是否触发以礼来降奖励
      if (gameStore.yillailiang && gameStore.yillailiang[target.name]) {
        const mark = gameStore.yillailiang[target.name]
        if (mark.cityIndex === cityIdx && mark.markedBy === caster.name) {
          // 触发以礼来降奖励：获得城市初始状态 + 随机抢夺一座城市
          // 注意：Vue版本中城市阵亡不会从列表删除，只是设置isAlive=false
          // 所以这里只需要添加奖励，不需要删除城市

          // 随机抢夺一座非谨慎交换集合的城市
          const cautiousSet = gameStore.cautiousSet && gameStore.cautiousSet[target.name] ? gameStore.cautiousSet[target.name] : []
          const availableCities = target.cities
            .map((c, i) => ({ city: c, index: i }))
            .filter(item => {
              if (item.city.isAlive === false || item.city.currentHp <= 0) return false
              if (cautiousSet.includes(item.index)) return false
              return true
            })

          if (availableCities.length > 0) {
            const randomIdx = Math.floor(Math.random() * availableCities.length)
            const stolenCity = JSON.parse(JSON.stringify(availableCities[randomIdx].city))

            // 将被抢夺的城市从对手城市列表移除并设置为阵亡
            availableCities[randomIdx].city.isAlive = false
            availableCities[randomIdx].city.currentHp = 0

            // 添加到施放者城市列表
            caster.cities.push(stolenCity)

            addSkillEffectLog(gameStore, `(以礼来降) ${caster.name}额外抢夺了${target.name}的${stolenCity.name}`)
          }

          // 清除以礼来降标记
          delete gameStore.yillailiang[target.name]
        }
      }

      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '万箭齐发',
        `${caster.name}对${target.name}的${targetCity.name}使用万箭齐发，造成${totalDamage}伤害并摧毁`,
        `${caster.name}使用了万箭齐发`
      )
    } else {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '万箭齐发',
        `${caster.name}对${target.name}的${targetCity.name}使用万箭齐发，造成${totalDamage}伤害`,
        `${caster.name}使用了万箭齐发`
      )
    }

    return {
      success: true,
      message: `造成${totalDamage}点伤害`
    }
  }

  /**
   * 降维打击 - 替换为同省更低等级城市
   * 特殊版本：直辖市/香港→澳门（10金币）
   */
  function executeJiangWeiDaJi(caster, target, targetCity) {
    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    // 不能对澳门使用
    if (targetCity.name === '澳门特别行政区') {
      return { success: false, message: '不能对澳门使用降维打击' }
    }

    // 检查是否为直辖市或香港（特殊版本：10金币→澳门）
    const municipalities = ['北京市', '上海市', '天津市', '重庆市', '香港特别行政区']
    const isMunicipality = municipalities.includes(targetCity.name)

    // 特殊版本：直辖市/香港→澳门（10金币）
    if (isMunicipality) {
      // 检查是否为中心城市
      const cityIdx = target.cities.indexOf(targetCity)
      if (targetCity.isCenter || cityIdx === target.centerIndex) {
        return { success: false, message: '不能对中心城市使用降维打击' }
      }

      // 手动扣除10金币（因为skillCosts中是8金币）
      if (caster.gold < 10) {
        return {
          success: false,
          message: `金币不足（需要10，当前${caster.gold}）`
        }
      }
      caster.gold -= 10

      // 获取澳门城市数据
      const macau = gameStore.getCityByName('澳门特别行政区')
      if (!macau) {
        return { success: false, message: '找不到澳门城市数据' }
      }

      // 创建澳门城市
      const replacementCity = {
        name: '澳门特别行政区',
        hp: macau.hp,
        currentHp: macau.hp,
        baseHp: macau.hp,
        isAlive: true,
        red: macau.red || 0,
        green: macau.green || 0,
        blue: macau.blue || 0,
        yellow: macau.yellow || 0,
        modifiers: []
      }

      // 替换城市
      target.cities[cityIdx] = replacementCity

      // 标记澳门为已使用
      gameStore.markCityAsUsed('澳门特别行政区')

      // 更新initialCities
      if (gameStore.initialCities[target.name] && gameStore.initialCities[target.name][cityIdx]) {
        gameStore.initialCities[target.name][cityIdx] = replacementCity
      }

      addSkillEffectLog(gameStore, `对${target.name}使用降维打击（直辖市/香港版，花费10金币），${targetCity.name}被替换为澳门特别行政区(${macau.hp})`)

      return {
        success: true,
        message: `${targetCity.name} → 澳门特别行政区(HP: ${macau.hp})`
      }
    }

    // 普通版本：同省更低等级城市（8金币）
    const goldCheck = checkAndDeductGold('降维打击', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取该城市所属省份
    const province = gameStore.getProvinceOfCity(targetCity.name)
    if (!province) {
      return { success: false, message: '无法确定城市所属省份' }
    }

    // 获取同省所有城市
    const provinceCities = province.cities

    // 筛选HP更低且未使用的城市
    const targetHp = targetCity.hp
    const unusedCities = gameStore.getUnusedCities()

    const lowerCities = provinceCities.filter(city => {
      // 必须HP更低
      if (city.hp >= targetHp) return false

      // 必须未被使用
      const isUnused = unusedCities.some(uc => uc.name === city.name)
      return isUnused
    })

    // 如果没有更低等级的城市
    if (lowerCities.length === 0) {
      return {
        success: false,
        message: `${province.name}中没有HP更低的未使用城市`
      }
    }

    // 随机选择一个更低等级的城市
    const newCity = lowerCities[Math.floor(Math.random() * lowerCities.length)]

    // 创建新城市（继承部分属性）
    const replacementCity = {
      name: newCity.name,
      hp: newCity.hp,
      currentHp: newCity.hp,
      baseHp: newCity.hp,
      isAlive: true,
      red: newCity.red || 0,
      green: newCity.green || 0,
      blue: newCity.blue || 0,
      yellow: newCity.yellow || 0,
      modifiers: []
    }

    // 找到原城市在数组中的索引
    const idx = target.cities.indexOf(targetCity)
    if (idx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    // 替换城市
    target.cities[idx] = replacementCity

    // 标记新城市为已使用
    gameStore.markCityAsUsed(newCity.name)

    // 更新initialCities
    if (gameStore.initialCities[target.name] && gameStore.initialCities[target.name][idx]) {
      gameStore.initialCities[target.name][idx] = replacementCity
    }

    addSkillEffectLog(gameStore, `对${target.name}使用降维打击，${targetCity.name}(${targetHp})被替换为${replacementCity.name}(${replacementCity.hp})`)

    return {
      success: true,
      message: `${targetCity.name} → ${replacementCity.name}(HP: ${replacementCity.hp})`
    }
  }

  /**
   * 深藏不露 - 每连续5回合未出战自动增加10000HP
   * 参考 citycard_web.html lines 16572-16631
   */
  function executeShenCangBuLu(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // 获取城市索引
    const cityIdx = caster.cities.indexOf(selfCity)
    if (cityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    // 检查城市是否存活
    if (selfCity.currentHp <= 0 || selfCity.isAlive === false) {
      return { success: false, message: '城市已阵亡，无法使用深藏不露' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('深藏不露', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化深藏不露结构
    if (!gameStore.hiddenGrowth[caster.name]) {
      gameStore.hiddenGrowth[caster.name] = {}
    }

    // 设置深藏不露状态
    gameStore.hiddenGrowth[caster.name][cityIdx] = {
      idleRounds: 0,
      active: true,
      everDied: false
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '深藏不露',
      `>>> ${caster.name}对${selfCity.name}使用深藏不露，每连续5回合未出战将自动增加10000HP`,
      `${caster.name}使用了深藏不露`
    )

    return {
      success: true,
      message: `${selfCity.name}每连续5回合未出战将获得10000HP`
    }
  }

  /**
   * 定时爆破 - 3回合后爆炸
   */
  function executeDingShiBaoPo(caster, target, targetCity) {
    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    if (targetCity.isCenter) {
      return { success: false, message: '无法对中心城市使用' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '定时爆破')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '定时爆破',
        `${caster.name}使用定时爆破，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了定时爆破`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('定时爆破', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取城市索引
    const cityIdx = target.cities.indexOf(targetCity)

    // 检查并消耗保护罩/钢铁护盾
    if (gameStore.consumeProtection(target.name, cityIdx)) {
      addSkillEffectLog(gameStore, `定时爆破被${target.name}的${targetCity.name}护盾抵消`)
      return {
        success: true,
        message: `效果被护盾抵消`
      }
    }

    // 在gameStore中设置定时炸弹
    if (!gameStore.timeBombs[target.name]) {
      gameStore.timeBombs[target.name] = {}
    }
    gameStore.timeBombs[target.name][cityIdx] = {
      countdown: 3,
      damage: 500,
      centerDamage: 1000
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '定时爆破',
      `${caster.name}对${target.name}的${targetCity.name}放置了定时炸弹`,
      `${caster.name}使用了定时爆破`
    )

    return {
      success: true,
      message: `${targetCity.name}上的炸弹将在3回合后爆炸`
    }
  }

  /**
   * 永久摧毁 - 从城市列表删除（直辖市/特区14金币，其他11金币）
   */
  function executeYongJiuCuiHui(caster, target, targetCity) {
    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    if (targetCity.isCenter) {
      return { success: false, message: '无法对中心城市使用' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '永久摧毁')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '永久摧毁',
        `${caster.name}使用永久摧毁，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了永久摧毁`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 检查冷却时间（5回合）
    if (gameStore.cooldowns && gameStore.cooldowns[caster.name] &&
        gameStore.cooldowns[caster.name]['永久摧毁'] > 0) {
      const remainingCooldown = gameStore.cooldowns[caster.name]['永久摧毁']
      return {
        success: false,
        message: `永久摧毁冷却中，剩余${remainingCooldown}回合`
      }
    }

    // 检查是否为直辖市或特别行政区（12金币）
    const municipalities = ['北京市', '上海市', '天津市', '重庆市', '香港特别行政区', '澳门特别行政区']
    const isMunicipality = municipalities.includes(targetCity.name)
    const requiredGold = isMunicipality ? 12 : 9

    // 手动金币检查和扣除（因为skillCosts中是9金币）
    if (caster.gold < requiredGold) {
      return {
        success: false,
        message: `金币不足（需要${requiredGold}，当前${caster.gold}）`
      }
    }
    caster.gold -= requiredGold

    // 设置冷却时间（5回合）
    if (!gameStore.cooldowns) {
      gameStore.cooldowns = {}
    }
    if (!gameStore.cooldowns[caster.name]) {
      gameStore.cooldowns[caster.name] = {}
    }
    gameStore.cooldowns[caster.name]['永久摧毁'] = 5

    // 获取城市索引
    const idx = target.cities.indexOf(targetCity)

    // 检查并消耗保护罩/钢铁护盾
    if (gameStore.consumeProtection(target.name, idx)) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '永久摧毁',
        `${caster.name}的永久摧毁击破了${target.name}的${targetCity.name}护盾${isMunicipality ? '（直辖市/特区，花费12金币）' : ''}`,
        `${caster.name}使用了永久摧毁`
      )
      return {
        success: true,
        message: `击破了${targetCity.name}的护盾`
      }
    }

    // ✅ 检查是否触发以礼来降奖励（在删除城市之前检查）
    if (gameStore.yillailiang && gameStore.yillailiang[target.name]) {
      const mark = gameStore.yillailiang[target.name]
      if (mark.cityIndex === idx && mark.markedBy === caster.name) {
        // 随机抢夺一座非谨慎交换集合的城市
        const cautiousSet = gameStore.cautiousSet && gameStore.cautiousSet[target.name] ? gameStore.cautiousSet[target.name] : []
        const availableCities = target.cities
          .map((c, i) => ({ city: c, index: i }))
          .filter(item => {
            if (item.index === idx) return false // 排除被摧毁的城市本身
            if (item.city.isAlive === false || item.city.currentHp <= 0) return false
            if (cautiousSet.includes(item.index)) return false
            return true
          })

        if (availableCities.length > 0) {
          const randomIdx = Math.floor(Math.random() * availableCities.length)
          const stolenCity = JSON.parse(JSON.stringify(availableCities[randomIdx].city))

          // 将被抢夺的城市从对手城市列表移除并设置为阵亡
          availableCities[randomIdx].city.isAlive = false
          availableCities[randomIdx].city.currentHp = 0

          // 添加到施放者城市列表
          caster.cities.push(stolenCity)

          addSkillEffectLog(gameStore, `(以礼来降) ${caster.name}额外抢夺了${target.name}的${stolenCity.name}`)
        }

        // 清除以礼来降标记
        delete gameStore.yillailiang[target.name]
      }
    }

    // 从列表中删除
    target.cities.splice(idx, 1)

    // 从deadCities中移除（如果存在）
    if (gameStore.deadCities[target.name]) {
      const deadIdx = gameStore.deadCities[target.name].indexOf(idx)
      if (deadIdx > -1) {
        gameStore.deadCities[target.name].splice(deadIdx, 1)
      }
      // 更新后续城市的索引（所有大于idx的索引都要减1）
      gameStore.deadCities[target.name] = gameStore.deadCities[target.name]
        .map(i => i > idx ? i - 1 : i)
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '永久摧毁',
      `${caster.name}永久摧毁了${target.name}的${targetCity.name}${isMunicipality ? '（直辖市/特区，花费12金币）' : ''}，冷却5回合`,
      `${caster.name}使用了永久摧毁`
    )

    return {
      success: true,
      message: `${targetCity.name}已被永久摧毁`
    }
  }

  /**
   * 战略转移 - 更换中心城市
   */
  function executeZhanLueZhuanYi(caster, newCenter) {
    if (!newCenter) {
      return { success: false, message: '未选择新中心城市' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('战略转移', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    const oldCenter = caster.cities.find(c => c.isCenter)

    if (oldCenter) {
      oldCenter.isCenter = false
    }

    newCenter.isCenter = true
    const currentHp = newCenter.currentHp || newCenter.hp
    newCenter.currentHp = Math.floor(currentHp * 1.5)

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '战略转移',
      `${caster.name}使用战略转移，${newCenter.name}成为新中心(HP+50%)`,
      `${caster.name}使用了战略转移`
    )

    return {
      success: true,
      message: `${newCenter.name}成为新中心，HP+50%`
    }
  }

  /**
   * 改弦更张 - 撤回本回合出战部署
   * 花费2金币
   * 在己方确认出战后，对手确认出战前使用
   * 撤回本回合出战城市和技能使用，允许重新部署
   * 每局限2次
   */
  function executeGaiXianGengZhang(caster) {
    // 检查每局限2次
    if (!gameStore.gaixiangengzhangUsed) {
      gameStore.gaixiangengzhangUsed = {}
    }

    const usedCount = gameStore.gaixiangengzhangUsed[caster.name] || 0
    if (usedCount >= 2) {
      return {
        success: false,
        message: '改弦更张每局只能使用2次，您已达到使用上限'
      }
    }

    // 检查玩家状态：是否已经确认部署
    const playerState = gameStore.playerStates[caster.name]
    if (!playerState || !playerState.deploymentConfirmed) {
      return {
        success: false,
        message: '只能在确认出战后使用改弦更张'
      }
    }

    // 检查其他玩家是否还未确认（确保自己确认了但对手还没确认）
    const otherPlayers = gameStore.players.filter(p => p.name !== caster.name)
    const allOthersNotConfirmed = otherPlayers.every(p => {
      const state = gameStore.playerStates[p.name]
      return !state || !state.deploymentConfirmed
    })

    if (!allOthersNotConfirmed) {
      return {
        success: false,
        message: '只能在对手确认出战前使用改弦更张'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('改弦更张', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 撤回部署：清除玩家状态
    if (playerState) {
      playerState.deploymentConfirmed = false
      playerState.currentBattleCities = null
      playerState.battleGoldSkill = null
      playerState.activatedCitySkills = null
    }

    // 增加使用次数
    gameStore.gaixiangengzhangUsed[caster.name] = usedCount + 1

    // 记录使用次数（用于UI显示）
    gameStore.recordSkillUsage(caster.name, '改弦更张')

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '改弦更张',
      `${caster.name}使用改弦更张，撤回本回合出战部署，可以重新选择出战城市和技能`,
      `${caster.name}使用了改弦更张`
    )

    return {
      success: true,
      message: '已撤回本回合部署，请重新选择出战城市和技能',
      needsRedeployment: true  // 标记需要重新部署
    }
  }

  /**
   * 连锁反应 - 造成2000伤害，若消灭则溅射1000→500
   */
  function executeLianSuoFanYing(caster, target, targetCity) {
    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '连锁反应')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '连锁反应',
        `${caster.name}使用连锁反应，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了连锁反应`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('连锁反应', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取城市索引
    const cityIdx = target.cities.indexOf(targetCity)
    if (cityIdx === -1) {
      return { success: false, message: '目标城市不在玩家城市列表中' }
    }

    // 检查并消耗保护罩/钢铁护盾
    if (gameStore.consumeProtection(target.name, cityIdx)) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '连锁反应',
        `${caster.name}的连锁反应击破了${target.name}的${targetCity.name}护盾`,
        `${caster.name}使用了连锁反应`
      )
      return {
        success: true,
        message: `击破了${targetCity.name}的护盾`
      }
    }

    // 阶段1：对目标城市造成2000伤害
    const targetName = targetCity.name
    const currentHp = targetCity.currentHp || targetCity.hp
    const newHp = Math.max(0, currentHp - 2000)
    targetCity.currentHp = newHp

    const targetDied = newHp <= 0
    if (targetDied) {
      targetCity.isAlive = false
      if (!gameStore.deadCities[target.name]) {
        gameStore.deadCities[target.name] = []
      }
      if (!gameStore.deadCities[target.name].includes(cityIdx)) {
        gameStore.deadCities[target.name].push(cityIdx)
      }
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '连锁反应',
      `${caster.name}对${target.name}的${targetName}使用连锁反应，造成2000伤害${targetDied ? '并阵亡' : `（剩余${Math.floor(newHp)}）`}`,
      `${caster.name}使用了连锁反应`
    )


    // 如果目标未死，直接结束
    if (!targetDied) {
      return {
        success: true,
        message: `${targetName}受到2000伤害`
      }
    }

    // 阶段2：目标已死，对其余出阵城市（roster）造成1000溅射伤害
    const rosterIndices = gameStore.roster[target.name] || []
    const otherRosterCities = rosterIndices
      .filter(idx => idx !== cityIdx && target.cities[idx] && target.cities[idx].isAlive !== false)

    if (otherRosterCities.length === 0) {
      addSkillEffectLog(gameStore, `连锁反应：${targetName}阵亡，但对手无其他出阵城市`)
      return {
        success: true,
        message: `${targetName}阵亡，但对手无其他出阵城市`
      }
    }

    const deadFrom1000 = []
    otherRosterCities.forEach(idx => {
      const city = target.cities[idx]
      const cityName = city.name

      // 检查并消耗保护罩/钢铁护盾
      if (gameStore.consumeProtection(target.name, idx)) {
        addSkillEffectLog(gameStore, `${cityName}的护盾抵消了1000伤害`)
        return
      }

      const cityCurrentHp = city.currentHp || city.hp
      const cityNewHp = Math.max(0, cityCurrentHp - 1000)
      city.currentHp = cityNewHp

      if (cityNewHp <= 0) {
        city.isAlive = false
        if (!gameStore.deadCities[target.name].includes(idx)) {
          gameStore.deadCities[target.name].push(idx)
        }
        deadFrom1000.push(cityName)
      }
    })

    // 如果没有城市因1000伤害阵亡，结束
    if (deadFrom1000.length === 0) {
      const affectedNames = otherRosterCities.map(idx => target.cities[idx].name).join('、')
      addSkillEffectLog(gameStore, `连锁反应：${targetName}阵亡，其余出阵城市（${affectedNames}）各受1000伤害`)
      return {
        success: true,
        message: `${targetName}阵亡，其余出阵城市各受1000伤害`
      }
    }

    // 阶段3：有城市因1000伤害阵亡，对仍存活的出阵城市额外造成500伤害
    const stillAlive = otherRosterCities.filter(idx => target.cities[idx].isAlive !== false)
    const deadFrom500 = []

    stillAlive.forEach(idx => {
      const city = target.cities[idx]
      const cityName = city.name

      // 检查并消耗保护罩/钢铁护盾
      if (gameStore.consumeProtection(target.name, idx)) {
        addSkillEffectLog(gameStore, `${cityName}的护盾抵消了500伤害`)
        return
      }

      const cityCurrentHp = city.currentHp || city.hp
      const cityNewHp = Math.max(0, cityCurrentHp - 500)
      city.currentHp = cityNewHp

      if (cityNewHp <= 0) {
        city.isAlive = false
        if (!gameStore.deadCities[target.name].includes(idx)) {
          gameStore.deadCities[target.name].push(idx)
        }
        deadFrom500.push(cityName)
      }
    })

    addSkillEffectLog(gameStore, `连锁反应：${targetName}阵亡，${deadFrom1000.join('、')}因1000伤害阵亡，剩余城市再受500伤害${deadFrom500.length > 0 ? `，${deadFrom500.join('、')}因此阵亡` : ''}`)

    return {
      success: true,
      message: `连锁反应完成！${targetName}阵亡，触发两次溅射，共消灭${deadFrom1000.length + deadFrom500.length}个城市`
    }
  }

  /**
   * 招贤纳士 - 抢夺对手HP小于阈值的城市
   */
  function executeZhaoXianNaShi(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '招贤纳士')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '招贤纳士',
        `${caster.name}使用招贤纳士，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了招贤纳士`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('招贤纳士', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 找到己方当前HP≤2000的城市
    const myCitiesBelow2000 = caster.cities
      .filter(c => c && c.isAlive !== false && c.hp > 0 && c.hp <= 2000)

    if (myCitiesBelow2000.length === 0) {
      return {
        success: false,
        message: '你没有HP小于等于2000的城市'
      }
    }

    // 随机抽取一座己方城市作为阈值
    const randomIdx = Math.floor(Math.random() * myCitiesBelow2000.length)
    const cityA = myCitiesBelow2000[randomIdx]
    const thresholdHp = cityA.hp

    // 找到对手所有HP低于阈值的城市（排除中心、钢铁、定海神针）
    const targetCities = []
    target.cities.forEach((city, idx) => {
      if (!city || city.isAlive === false) return
      if (city.isCenter) return // 排除中心城市

      // 排除谨慎交换集合中的城市
      if (gameStore.isInCautiousSet(target.name, idx)) return

      // 排除钢铁城市
      if (gameStore.hasIronShield(target.name, idx)) return

      // 排除定海神针城市
      if (gameStore.anchored[target.name] && gameStore.anchored[target.name][idx] > 0) return

      // 检查HP是否小于阈值
      if (city.hp < thresholdHp) {
        targetCities.push({ city, index: idx })
      }
    })

    if (targetCities.length === 0) {
      return {
        success: false,
        message: `${target.name}没有符合条件的城市（HP<${Math.floor(thresholdHp)}且非中心/钢铁/定海神针城市）`
      }
    }

    // 抢夺这些城市
    const capturedNames = []
    const capturedIndices = targetCities.map(item => item.index).sort((a, b) => b - a) // 从大到小排序，方便从后往前删除

    // 第一步：保存所有被抢夺城市的streak和changeFlagMark数据
    const savedData = []
    for (const item of targetCities) {
      const savedStreak = (target.streaks && target.streaks[item.index]) || 0
      const savedChangeFlagMark = (gameStore.changeFlagMark[target.name] && gameStore.changeFlagMark[target.name][item.index]) || null
      savedData.push({
        index: item.index,
        city: { ...item.city },
        streak: savedStreak,
        changeFlagMark: savedChangeFlagMark
      })
    }

    // 第二步：从target移除这些城市（从后往前删除，避免索引混乱）
    for (const idx of capturedIndices) {
      target.cities.splice(idx, 1)
      if (gameStore.initialCities[target.name]) {
        gameStore.initialCities[target.name].splice(idx, 1)
      }
    }

    // 第三步：更新target的roster、streaks、changeFlagMark，修正所有索引
    if (gameStore.roster[target.name]) {
      gameStore.roster[target.name] = gameStore.roster[target.name]
        .filter(idx => !capturedIndices.includes(idx))
        .map(idx => {
          let newIdx = idx
          for (const capturedIdx of capturedIndices) {
            if (idx > capturedIdx) newIdx--
          }
          return newIdx
        })
    }

    if (target.streaks) {
      const newStreaks = {}
      Object.keys(target.streaks).forEach(idx => {
        const numIdx = parseInt(idx)
        if (!capturedIndices.includes(numIdx)) {
          let newIdx = numIdx
          for (const capturedIdx of capturedIndices) {
            if (numIdx > capturedIdx) newIdx--
          }
          newStreaks[newIdx] = target.streaks[numIdx]
        }
      })
      target.streaks = newStreaks
    }

    if (gameStore.changeFlagMark[target.name]) {
      const newMarks = {}
      Object.keys(gameStore.changeFlagMark[target.name]).forEach(idx => {
        const numIdx = parseInt(idx)
        if (!capturedIndices.includes(numIdx)) {
          let newIdx = numIdx
          for (const capturedIdx of capturedIndices) {
            if (numIdx > capturedIdx) newIdx--
          }
          newMarks[newIdx] = gameStore.changeFlagMark[target.name][numIdx]
        }
      })
      gameStore.changeFlagMark[target.name] = newMarks
    }

    // 第四步：将抢夺的城市添加到caster，并转移属性
    for (const data of savedData) {
      const city = data.city
      const newIdx = caster.cities.length
      caster.cities.push(city)
      capturedNames.push(city.name)

      // 同步转移initialCities数据
      if (!gameStore.initialCities[caster.name]) {
        gameStore.initialCities[caster.name] = []
      }
      gameStore.initialCities[caster.name].push({ name: city.name, hp: city.hp })

      // 转移疲劳streak
      if (!caster.streaks) caster.streaks = {}
      caster.streaks[newIdx] = data.streak

      // 转移changeFlagMark
      if (data.changeFlagMark) {
        if (!gameStore.changeFlagMark[caster.name]) gameStore.changeFlagMark[caster.name] = {}
        gameStore.changeFlagMark[caster.name][newIdx] = { ...data.changeFlagMark }
      }

      // 标记城市为已知
      gameStore.setCityKnown(caster.name, newIdx, target.name)

      // 注意：不再将对手的城市标记为阵亡，因为我们已经用splice删除了它们
    }

    // 如果caster城市数≤5，自动加入roster
    if (caster.cities.length <= 5) {
      if (!gameStore.roster[caster.name]) {
        gameStore.roster[caster.name] = []
      }
      const startIdx = caster.cities.length - capturedNames.length
      for (let i = startIdx; i < caster.cities.length; i++) {
        if (!gameStore.roster[caster.name].includes(i)) {
          gameStore.roster[caster.name].push(i)
        }
      }
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '招贤纳士（阈值${Math.floor(thresholdHp)}）',
      `${caster.name}使用招贤纳士（阈值${Math.floor(thresholdHp)}），抢夺了${target.name}的${capturedNames.length}座城市：${capturedNames.join('、')}`,
      `${caster.name}使用了招贤纳士（阈值${Math.floor(thresholdHp)}）`
    )

    return {
      success: true,
      message: `成功抢夺${capturedNames.length}座城市：${capturedNames.join('、')}`
    }
  }

  /**
   * 无懈可击 - 撤回对手最新使用的技能
   */
  function executeWuXieKeJi(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查是否有可以撤回的技能
    const lastSkillUsed = gameStore.lastSkillUsed
    if (!lastSkillUsed) {
      return {
        success: false,
        message: '没有可以撤回的技能'
      }
    }

    // 检查技能是否来自对手且在本回合使用
    if (lastSkillUsed.userName !== target.name || lastSkillUsed.roundNumber !== gameStore.currentRound) {
      return {
        success: false,
        message: '对手本回合没有使用技能'
      }
    }

    // 检查技能是否已被撤回
    if (lastSkillUsed.revoked) {
      return {
        success: false,
        message: '该技能已被撤回'
      }
    }

    // 确定所需金币（1-15金币技能需11金币，16+金币技能需19金币）
    const skillCost = lastSkillUsed.cost || 0
    const requiredCost = skillCost <= 15 ? 11 : 19

    // 金币检查和扣除（使用动态计算的金币数）
    if (caster.gold < requiredCost) {
      return {
        success: false,
        message: `金币不足！撤销此技能需要${requiredCost}金币`
      }
    }

    // 检查对手是否有坚不可摧护盾保护（防止技能被撤回）
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '无懈可击')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '无懈可击',
        `${caster.name}尝试撤回${target.name}的技能"${lastSkillUsed.skillName}"，但被对方的坚不可摧护盾阻挡`,
        `${caster.name}使用了无懈可击`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 检查是否有游戏状态快照
    if (!gameStore.gameStateSnapshot) {
      return {
        success: false,
        message: '无法撤回技能，没有可恢复的游戏状态'
      }
    }

    // 扣除金币
    caster.gold -= requiredCost

    // 恢复游戏状态快照
    const restored = gameStore.restoreGameStateSnapshot()
    if (!restored) {
      return {
        success: false,
        message: '状态恢复失败'
      }
    }

    // 标记技能为已撤回
    gameStore.lastSkillUsed.revoked = true

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '无懈可击（花费${requiredCost}金币）',
      `${caster.name}使用无懈可击（花费${requiredCost}金币），成功撤回了${target.name}刚使用的技能"${lastSkillUsed.skillName}"`,
      `${caster.name}使用了无懈可击（花费${requiredCost}金币）`
    )

    return {
      success: true,
      message: `成功撤回了${target.name}的技能"${lastSkillUsed.skillName}"`
    }
  }

  /**
   * 坚不可摧 - 3回合内阻挡40+技能
   */
  function executeJianBuKeCui(caster) {
    // 检查使用次数（每局限2次）
    if (!gameStore.jianbukecuiUsageCount) {
      gameStore.jianbukecuiUsageCount = {}
    }
    if (!gameStore.jianbukecuiUsageCount[caster.name]) {
      gameStore.jianbukecuiUsageCount[caster.name] = 0
    }
    if (gameStore.jianbukecuiUsageCount[caster.name] >= 2) {
      return {
        success: false,
        message: '坚不可摧每局最多使用2次'
      }
    }

    // 检查冷却时间（5回合）
    if (gameStore.cooldowns && gameStore.cooldowns[caster.name] &&
        gameStore.cooldowns[caster.name]['坚不可摧'] > 0) {
      const remainingCooldown = gameStore.cooldowns[caster.name]['坚不可摧']
      return {
        success: false,
        message: `坚不可摧冷却中，剩余${remainingCooldown}回合`
      }
    }

    // 检查是否已有坚不可摧护盾
    if (gameStore.jianbukecui[caster.name] && gameStore.jianbukecui[caster.name].roundsLeft > 0) {
      return {
        success: false,
        message: '已有坚不可摧护盾，无需重复使用'
      }
    }

    // 检查"相同轮次只能有一个玩家拥有护盾"
    const hasActiveShield = Object.keys(gameStore.jianbukecui).some(playerName => {
      return playerName !== caster.name &&
             gameStore.jianbukecui[playerName] &&
             gameStore.jianbukecui[playerName].roundsLeft > 0
    })
    if (hasActiveShield) {
      return {
        success: false,
        message: '相同轮次只能有一个玩家拥有坚不可摧护盾'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('坚不可摧', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 增加使用次数
    gameStore.jianbukecuiUsageCount[caster.name]++

    // 记录使用次数（用于UI显示）
    gameStore.recordSkillUsage(caster.name, '坚不可摧')

    // 设置冷却时间（5回合）
    if (!gameStore.cooldowns) {
      gameStore.cooldowns = {}
    }
    if (!gameStore.cooldowns[caster.name]) {
      gameStore.cooldowns[caster.name] = {}
    }
    gameStore.cooldowns[caster.name]['坚不可摧'] = 5

    // 设置坚不可摧护盾（持续3回合）
    gameStore.jianbukecui[caster.name] = {
      roundsLeft: 3
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '坚不可摧',
      `${caster.name}使用坚不可摧，获得护盾保护，持续3回合（冷却5回合，剩余${2 - gameStore.jianbukecuiUsageCount[caster.name]}次）`,
      `${caster.name}使用了坚不可摧`
    )

    return {
      success: true,
      message: `获得坚不可摧护盾，持续3回合，可阻挡40+种攻击技能（剩余${2 - gameStore.jianbukecuiUsageCount[caster.name]}次）`
    }
  }

  /**
   * 移花接木 - 偷取对手使用过的技能（持续3回合）
   */
  function executeYiHuaJieMu(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查使用次数（每局限2次）
    if (!gameStore.yihuajiemuUsageCount) {
      gameStore.yihuajiemuUsageCount = {}
    }
    if (!gameStore.yihuajiemuUsageCount[caster.name]) {
      gameStore.yihuajiemuUsageCount[caster.name] = 0
    }
    if (gameStore.yihuajiemuUsageCount[caster.name] >= 2) {
      return {
        success: false,
        message: '移花接木每局最多使用2次'
      }
    }

    // 检查skillUsageTracking记录
    const targetUsage = gameStore.skillUsageTracking[target.name]
    if (!targetUsage || Object.keys(targetUsage).length < 2) {
      return {
        success: false,
        message: `${target.name}尚未使用足够的技能（需要至少2个不同的非橙卡技能）`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('移花接木', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 筛选非橙卡技能（1-15金币）
    const eligibleSkills = Object.keys(targetUsage).filter(skillName => {
      if (targetUsage[skillName] <= 0) return false

      // 获取技能金币消耗
      const skillCost = SKILL_COSTS[skillName] || 0

      // 只能偷取非橙卡技能（1-15金币）
      return skillCost >= 1 && skillCost <= 15
    })

    if (eligibleSkills.length < 2) {
      return {
        success: false,
        message: `${target.name}尚未使用足够的可偷取技能（需要至少2个非橙卡技能）`
      }
    }

    // 随机抽取一个技能
    const stolenSkill = eligibleSkills[Math.floor(Math.random() * eligibleSkills.length)]

    // 增加使用次数
    gameStore.yihuajiemuUsageCount[caster.name]++

    // 记录使用次数（用于UI显示）
    gameStore.recordSkillUsage(caster.name, '移花接木')

    // 初始化stolenSkills结构（添加到gameStore状态中）
    if (!gameStore.stolenSkills) {
      gameStore.stolenSkills = {}
    }
    if (!gameStore.stolenSkills[caster.name]) {
      gameStore.stolenSkills[caster.name] = []
    }

    gameStore.stolenSkills[caster.name].push({
      skillName: stolenSkill,
      roundsLeft: 3,
      usedCount: 0,
      from: target.name
    })

    const remainingUses = 2 - gameStore.yihuajiemuUsageCount[caster.name]
    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了移花接木',
      `${caster.name}对${target.name}使用了移花接木，偷取了技能"${stolenSkill}"（可在接下来3回合内使用，剩余${remainingUses}次）`,
      `${caster.name}使用了了移花接木`
    )

    return {
      success: true,
      message: `成功偷取了${target.name}的"${stolenSkill}"技能，可在接下来3回合使用（剩余${remainingUses}次）`
    }
  }

  /**
   * 不露踪迹 - 隐藏技能使用情况（持续3回合）
   */
  function executeBuLuZongJi(caster) {
    // 检查是否已处于不露踪迹状态
    if (gameStore.stealth && gameStore.stealth[caster.name] && gameStore.stealth[caster.name].roundsLeft > 0) {
      return {
        success: false,
        message: '已处于不露踪迹状态'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('不露踪迹', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化stealth结构
    if (!gameStore.stealth) {
      gameStore.stealth = {}
    }

    gameStore.stealth[caster.name] = {
      roundsLeft: 3
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '不露踪迹',
      `${caster.name}使用了不露踪迹，接下来3回合技能使用情况将对其他玩家隐藏`,
      `${caster.name}使用了不露踪迹`
    )

    return {
      success: true,
      message: '进入不露踪迹状态，持续3回合'
    }
  }

  /**
   * 整齐划一 - 将对手战斗预备城市HP向下取整到万位数
   */
  function executeZhengQiHuaYi(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '整齐划一')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '整齐划一',
        `${caster.name}使用整齐划一，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了整齐划一`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('整齐划一', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取对手的战斗预备城市（roster）
    const rosterIndices = gameStore.roster[target.name] || []
    if (rosterIndices.length === 0) {
      return {
        success: false,
        message: '对手没有战斗预备城市'
      }
    }

    const affectedCities = []

    for (const cityIdx of rosterIndices) {
      const city = target.cities[cityIdx]
      if (!city || city.isAlive === false) continue

      const originalHp = city.currentHp || city.hp
      let newHp

      if (originalHp < 10000) {
        // 低于10000的一律取到3000
        newHp = 3000
      } else {
        // 向下取整到最近的万位数
        newHp = Math.floor(originalHp / 10000) * 10000
      }

      city.currentHp = newHp
      affectedCities.push(`${city.name}(${Math.floor(originalHp)}→${Math.floor(newHp)})`)
    }

    if (affectedCities.length > 0) {
      // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了整齐划一',
      `${caster.name}对${target.name}使用了整齐划一，受影响城市：${affectedCities.join('、')}`,
      `${caster.name}使用了了整齐划一`
    )
    } else {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '整齐划一',
        `${caster.name}对${target.name}使用了整齐划一，但没有城市受影响`,
        `${caster.name}使用了整齐划一`
      )
    }

    return {
      success: true,
      message: `${affectedCities.length}个战斗预备城市受到影响`
    }
  }

  /**
   * 人质交换 - 交换双方特定位置的战斗预备城市
   */
  function executeRenZhiJiaoHuan(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查双方城市数
    if (caster.cities.length < 4 || target.cities.length < 4) {
      return {
        success: false,
        message: '双方城市数都需要≥4才能使用人质交换'
      }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '人质交换')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '人质交换',
        `${caster.name}使用人质交换，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了人质交换`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('人质交换', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取战斗预备城市（roster）
    const myRoster = gameStore.roster[caster.name] || []
    const oppRoster = gameStore.roster[target.name] || []

    if (myRoster.length < 4) {
      return {
        success: false,
        message: `你的战斗预备城市不足4个（当前${myRoster.length}个）`
      }
    }

    if (oppRoster.length < 3) {
      return {
        success: false,
        message: `对方的战斗预备城市不足3个（当前${oppRoster.length}个）`
      }
    }

    // 按HP排序战斗预备城市（降序）
    const myRosterSorted = myRoster
      .map(idx => ({
        idx,
        hp: (caster.cities[idx].currentHp || caster.cities[idx].hp)
      }))
      .sort((a, b) => b.hp - a.hp)

    const oppRosterSorted = oppRoster
      .map(idx => ({
        idx,
        hp: (target.cities[idx].currentHp || target.cities[idx].hp)
      }))
      .sort((a, b) => b.hp - a.hp)

    // 我方选择HP第4的城市
    const myCityIdx = myRosterSorted[3].idx
    const myCity = caster.cities[myCityIdx]

    // 对方选择HP第3的城市（排除谨慎交换集合）
    let oppCityIdx = -1
    for (let i = 0; i < oppRosterSorted.length; i++) {
      const idx = oppRosterSorted[i].idx
      if (!gameStore.isInCautiousSet(target.name, idx)) {
        // 找到第3个不在谨慎交换集合中的城市
        if (i >= 2) {
          oppCityIdx = idx
          break
        }
      }
    }

    // 如果没找到，使用默认第3个
    if (oppCityIdx === -1) {
      if (oppRosterSorted.length < 3) {
        return {
          success: false,
          message: '对方没有足够的可交换战斗预备城市'
        }
      }
      oppCityIdx = oppRosterSorted[2].idx
    }

    const oppCity = target.cities[oppCityIdx]

    // 执行城市交换
    const temp = caster.cities[myCityIdx]
    caster.cities[myCityIdx] = target.cities[oppCityIdx]
    target.cities[oppCityIdx] = temp

    // 同步交换initialCities
    if (gameStore.initialCities[caster.name] && gameStore.initialCities[target.name]) {
      const tempInitial = gameStore.initialCities[caster.name][myCityIdx]
      gameStore.initialCities[caster.name][myCityIdx] = gameStore.initialCities[target.name][oppCityIdx]
      gameStore.initialCities[target.name][oppCityIdx] = tempInitial
    }

    // 交换疲劳计数器（fatigue streaks）
    if (!caster.streaks) caster.streaks = {}
    if (!target.streaks) target.streaks = {}

    const tempStreak = caster.streaks[myCityIdx] || 0
    caster.streaks[myCityIdx] = target.streaks[oppCityIdx] || 0
    target.streaks[oppCityIdx] = tempStreak

    // 交换拔旗易帜标记（changeFlagMark）
    if (!gameStore.changeFlagMark[caster.name]) gameStore.changeFlagMark[caster.name] = {}
    if (!gameStore.changeFlagMark[target.name]) gameStore.changeFlagMark[target.name] = {}

    const casterMark = gameStore.changeFlagMark[caster.name][myCityIdx]
    const targetMark = gameStore.changeFlagMark[target.name][oppCityIdx]

    if (casterMark || targetMark) {
      if (targetMark) {
        gameStore.changeFlagMark[caster.name][myCityIdx] = { ...targetMark }
      } else {
        delete gameStore.changeFlagMark[caster.name][myCityIdx]
      }

      if (casterMark) {
        gameStore.changeFlagMark[target.name][oppCityIdx] = { ...casterMark }
      } else {
        delete gameStore.changeFlagMark[target.name][oppCityIdx]
      }
    }

    // 标记城市为已知
    gameStore.setCityKnown(caster.name, myCityIdx, target.name)
    gameStore.setCityKnown(target.name, oppCityIdx, caster.name)

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了人质交换',
      `${caster.name}对${target.name}使用了人质交换，交换了${myCity.name}和${oppCity.name}`,
      `${caster.name}使用了了人质交换`
    )

    return {
      success: true,
      message: `成功交换了${myCity.name}和${oppCity.name}`
    }
  }

  /**
   * 釜底抽薪 - 使对手下次8+金币技能费用增加50%
   */
  function executeFuDiChouXin(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '釜底抽薪')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '釜底抽薪',
        `${caster.name}使用釜底抽薪，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了釜底抽薪`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('釜底抽薪', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化costIncrease结构
    if (!gameStore.costIncrease) {
      gameStore.costIncrease = {}
    }

    // 设置目标玩家的费用增加标记
    gameStore.costIncrease[target.name] = 1

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了釜底抽薪',
      `${caster.name}对${target.name}使用了釜底抽薪，${target.name}下一次使用8金币及以上技能时费用增加50%`,
      `${caster.name}使用了了釜底抽薪`
    )

    return {
      success: true,
      message: `${target.name}下次使用高级技能（8+金币）时费用将增加50%`
    }
  }

  /**
   * 金融危机 - 全部玩家获得2金币，接下来3回合金币最高的玩家无法获得自动+3金币，其余玩家只能+1金币
   */
  function executeJinRongWeiJi(caster) {
    // 检查是否已在金融危机期间
    if (gameStore.financialCrisis && gameStore.financialCrisis.roundsLeft > 0) {
      return {
        success: false,
        message: `当前还有${gameStore.financialCrisis.roundsLeft}回合处于金融危机状态，不能再次使用！`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('金融危机', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 全部玩家立即获得2金币
    gameStore.players.forEach(player => {
      player.gold = Math.min(24, player.gold + 2)
    })

    // 设置金融危机状态（持续3回合）
    gameStore.financialCrisis = { roundsLeft: 3 }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了金融危机',
      `${caster.name}使用了金融危机，全部玩家获得2金币，接下来3回合金币最高的玩家无法获得自动+3金币，其余玩家只能+1金币`,
      `${caster.name}使用了了金融危机`
    )

    return {
      success: true,
      message: '金融危机生效！全部玩家获得2金币，接下来3回合金币收入受限'
    }
  }

  /**
   * 劫富济贫 - 找出对手血量最高的3座城市和自己血量最低的3座城市，各随机选1座，将两座城市的血量平均化
   */
  function executeJieFuJiPin(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查双方城市数量是否>=5
    const myCities = caster.cities.filter(c => c && (c.currentHp || c.hp) > 0)
    const targetCities = target.cities.filter(c => c && (c.currentHp || c.hp) > 0)

    if (myCities.length < 5) {
      return { success: false, message: `${caster.name}的城市数量不足5座（当前${myCities.length}座）` }
    }
    if (targetCities.length < 5) {
      return { success: false, message: `${target.name}的城市数量不足5座（当前${targetCities.length}座）` }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('劫富济贫', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 找出对方HP前三的城市
    const targetTop3 = target.cities
      .map((c, i) => ({ city: c, index: i, hp: c.currentHp || c.hp || 0 }))
      .filter(item => item.hp > 0)
      .sort((a, b) => b.hp - a.hp)
      .slice(0, 3)

    // 找出己方HP后三的城市
    const myBottom3 = caster.cities
      .map((c, i) => ({ city: c, index: i, hp: c.currentHp || c.hp || 0 }))
      .filter(item => item.hp > 0)
      .sort((a, b) => a.hp - b.hp)
      .slice(0, 3)

    if (targetTop3.length === 0 || myBottom3.length === 0) {
      return { success: false, message: '没有足够的城市可供选择' }
    }

    // 随机选择一座对方城市和一座己方城市
    const targetCity = targetTop3[Math.floor(Math.random() * targetTop3.length)]
    const myCity = myBottom3[Math.floor(Math.random() * myBottom3.length)]

    // 计算平均HP
    const avgHp = Math.round((targetCity.hp + myCity.hp) / 2)

    // 设置HP
    targetCity.city.currentHp = avgHp
    targetCity.city.hp = avgHp
    myCity.city.currentHp = avgHp
    myCity.city.hp = avgHp

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '劫富济贫',
      `${caster.name}使用劫富济贫，${target.name}的${targetCity.city.name}（原HP:${Math.round(targetCity.hp)}）与${caster.name}的${myCity.city.name}（原HP:${Math.round(myCity.hp)}）HP取平均，均变为${avgHp}`,
      `${caster.name}使用了劫富济贫`
    )

    return {
      success: true,
      message: `${targetCity.city.name}和${myCity.city.name}的HP均变为${avgHp}`
    }
  }

  /**
   * 城市试炼 (4金币) - HP≤15000的非中心城市试炼3回合，若强制出战则自毁
   */
  function executeChengShiShiLian(caster, selfCity) {
    const targetCityIdx = caster.cities.indexOf(selfCity)
    if (targetCityIdx === -1) {
      return { success: false, message: '城市不存在' }
    }

    if (selfCity.currentHp <= 0 || selfCity.isAlive === false) {
      return { success: false, message: '该城市已阵亡，无法使用城市试炼！' }
    }

    // 检查不能对中心城市使用
    const centerIdx = caster.centerIndex ?? 0
    if (targetCityIdx === centerIdx) {
      return { success: false, message: '无法对中心城市使用城市试炼！' }
    }

    // 检查HP是否≤15000
    const currentHp = selfCity.currentHp || selfCity.hp
    if (currentHp > 15000) {
      return {
        success: false,
        message: `城市试炼仅限当前血量≤15000的城市使用。${selfCity.name}当前为${Math.floor(currentHp)}`
      }
    }

    // 检查冷却时间
    if (!gameStore.cooldowns) {
      gameStore.cooldowns = {}
    }
    if (!gameStore.cooldowns[caster.name]) {
      gameStore.cooldowns[caster.name] = {}
    }
    if (gameStore.cooldowns[caster.name]['城市试炼'] > 0) {
      const remainingCooldown = gameStore.cooldowns[caster.name]['城市试炼']
      return {
        success: false,
        message: `城市试炼冷却中，剩余${remainingCooldown}回合`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('城市试炼', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 设置冷却时间（5回合）
    gameStore.cooldowns[caster.name]['城市试炼'] = 5

    // 初始化试炼场结构
    if (!gameStore.cityTrialField) {
      gameStore.cityTrialField = {}
    }
    if (!gameStore.cityTrialField[caster.name]) {
      gameStore.cityTrialField[caster.name] = {}
    }

    // 记录试炼信息
    gameStore.cityTrialField[caster.name][targetCityIdx] = {
      originalHp: currentHp,
      roundsLeft: 3,
      startRound: gameStore.currentRound,
      selfDestructOnDeploy: true  // 若强制出战则自毁
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了城市试炼',
      `${caster.name}对${selfCity.name}使用了城市试炼，该城市进入试炼3回合，出来后HP×3（若强制出战则自毁）`,
      `${caster.name}使用了了城市试炼`
    )

    return {
      success: true,
      message: `${selfCity.name}进入试炼，3回合后HP×3（若强制出战则自毁）`
    }
  }

  /**
   * 天灾人祸 - 选择对手已知城市，使其攻击力变为1，持续2回合
   */
  function executeTianZaiRenHuo(caster, target, targetCity) {
    if (!target || !targetCity) {
      return { success: false, message: '未选择目标' }
    }

    const targetCityIdx = target.cities.indexOf(targetCity)
    if (targetCityIdx === -1) {
      return { success: false, message: '城市不存在' }
    }

    // 检查城市是否已知
    if (!gameStore.knownCities) {
      gameStore.knownCities = {}
    }
    if (!gameStore.knownCities[caster.name]) {
      gameStore.knownCities[caster.name] = {}
    }
    if (!gameStore.knownCities[caster.name][target.name]) {
      gameStore.knownCities[caster.name][target.name] = []
    }
    if (!gameStore.knownCities[caster.name][target.name].includes(targetCityIdx)) {
      return { success: false, message: '该城市尚未已知，无法使用天灾人祸' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '天灾人祸')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '天灾人祸',
        `${caster.name}使用天灾人祸，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了天灾人祸`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('天灾人祸', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化结构
    if (!gameStore.disasterDebuff) {
      gameStore.disasterDebuff = {}
    }
    if (!gameStore.disasterDebuff[target.name]) {
      gameStore.disasterDebuff[target.name] = {}
    }

    // 设置天灾人祸效果：攻击力变为1，持续2回合
    gameStore.disasterDebuff[target.name][targetCityIdx] = 2

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '天灾人祸',
      `${caster.name}对${target.name}的${targetCity.name}使用了天灾人祸，该城市攻击力变为1，持续2回合`,
      `${caster.name}使用了天灾人祸`
    )

    return {
      success: true,
      message: `${targetCity.name}的攻击力变为1，持续2回合`
    }
  }

  /**
   * 李代桃僵 - 本轮被时来运转或人质交换时可自选交换城市
   */
  function executeLiDaiTaoJiang(caster) {
    // 检查本轮是否已使用
    if (!gameStore.ldtj) {
      gameStore.ldtj = {}
    }
    if (gameStore.ldtj[caster.name]) {
      return { success: false, message: '本轮已经使用过李代桃僵！' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('李代桃僵', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 设置李代桃僵标记（本回合有效）
    gameStore.ldtj[caster.name] = true

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '李代桃僵',
      `${caster.name}使用了李代桃僵，本轮被时来运转或人质交换时可以自己选择交换的城市`,
      `${caster.name}使用了李代桃僵`
    )

    return {
      success: true,
      message: '李代桃僵生效！本轮被动交换时可自己选择城市'
    }
  }

  /**
   * 避而不见 - 选择对手的一座已知战斗预备城市下场3回合无法出战
   */
  function executeBiErBuJian(caster, target, targetCity) {
    if (!target || !targetCity) {
      return { success: false, message: '未选择目标' }
    }

    // 检查对方存活城市数
    const oppAliveCities = target.cities.filter(c => c && (c.currentHp || c.hp) > 0)
    if (oppAliveCities.length < 2) {
      return {
        success: false,
        message: `对方存活城市数不足2个（当前${oppAliveCities.length}个），无法使用避而不见！`
      }
    }

    const targetCityIdx = target.cities.indexOf(targetCity)
    if (targetCityIdx === -1) {
      return { success: false, message: '城市不存在' }
    }

    // 检查城市是否已知
    if (!gameStore.knownCities || !gameStore.knownCities[caster.name] ||
        !gameStore.knownCities[caster.name][target.name] ||
        !gameStore.knownCities[caster.name][target.name].includes(targetCityIdx)) {
      return { success: false, message: '该城市尚未已知，无法使用避而不见' }
    }

    // 检查是否在对方战斗预备中
    const oppRoster = gameStore.roster[target.name] || []
    if (!oppRoster.includes(targetCityIdx)) {
      return { success: false, message: '该城市不在对方战斗预备中，无法使用避而不见' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '避而不见')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '避而不见',
        `${caster.name}使用避而不见，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了避而不见`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('避而不见', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 根据对方城市数决定持续回合数
    const duration = oppAliveCities.length === 2 ? 2 : 3

    // 初始化结构
    if (!gameStore.forcedBench) {
      gameStore.forcedBench = {}
    }
    if (!gameStore.forcedBench[target.name]) {
      gameStore.forcedBench[target.name] = {}
    }

    // 设置避而不见效果
    gameStore.forcedBench[target.name][targetCityIdx] = duration

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '避而不见',
      `${caster.name}对${target.name}的${targetCity.name}使用了避而不见，该城市${duration}回合无法出战`,
      `${caster.name}使用了避而不见`
    )

    return {
      success: true,
      message: `${targetCity.name}将${duration}回合无法出战`
    }
  }

  /**
   * 一触即发 - 选择一个冷却中的技能，将其冷却剩余回合清零
   * 用户需要选择一个正在冷却的技能
   * 效果：将该技能的冷却时间清零
   */
  function executeYiChuJiFa(caster, skillName) {
    // 如果没有提供技能名称，返回需要选择
    if (!skillName) {
      // 获取所有冷却中的技能
      const coolingSkills = []

      if (gameStore.cooldowns && gameStore.cooldowns[caster.name]) {
        const myCooldowns = gameStore.cooldowns[caster.name]
        for (const [name, rounds] of Object.entries(myCooldowns)) {
          if (rounds > 0) {
            coolingSkills.push({
              name: name,
              remainingRounds: rounds
            })
          }
        }
      }

      if (coolingSkills.length === 0) {
        return {
          success: false,
          message: '当前没有冷却中的技能！'
        }
      }

      return {
        success: false,
        message: '请选择要清除冷却的技能',
        needSelection: true,
        data: {
          coolingSkills: coolingSkills
        }
      }
    }

    // 检查技能是否在冷却中
    const cooldownRemaining = gameStore.getSkillCooldown(caster.name, skillName)
    if (cooldownRemaining <= 0) {
      return {
        success: false,
        message: `${skillName}没有在冷却中`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('一触即发', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 清零冷却
    gameStore.clearSkillCooldown(caster.name, skillName)

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '一触即发',
      `${caster.name}使用了一触即发，${skillName}的冷却已清零（原剩余${cooldownRemaining}回合）`,
      `${caster.name}使用了一触即发`
    )

    return {
      success: true,
      message: `${skillName}的冷却已清零，可以立即使用`
    }
  }

  /**
   * 技能保护 - 接下来10回合对手无法使用事半功倍、过河拆桥技能
   */
  function executeJiNengBaoHu(caster) {
    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('技能保护', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化结构
    if (!gameStore.skillProtection) {
      gameStore.skillProtection = {}
    }

    // 设置技能保护
    gameStore.skillProtection[caster.name] = { roundsLeft: 10 }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '技能保护',
      `${caster.name}使用了技能保护，接下来10回合对手无法使用事半功倍、过河拆桥技能`,
      `${caster.name}使用了技能保护`
    )

    return {
      success: true,
      message: '技能保护生效！对手10回合内无法使用特定技能'
    }
  }

  /**
   * 突破瓶颈 - 选定一个已达到使用上限的技能，增加一次使用次数上限
   * 用户需要选择一个已经有使用记录的技能
   * 效果：该技能的已使用次数-1（等同于上限+1）
   */
  function executeTuPoPingJing(caster, skillName) {
    // 如果没有提供技能名称，返回需要选择
    if (!skillName) {
      // 获取所有已使用过的技能
      const usedSkills = []

      if (gameStore.skillUsageTracking && gameStore.skillUsageTracking[caster.name]) {
        const myTracking = gameStore.skillUsageTracking[caster.name]
        for (const [name, count] of Object.entries(myTracking)) {
          if (count > 0) {
            usedSkills.push({
              name: name,
              usedCount: count
            })
          }
        }
      }

      if (usedSkills.length === 0) {
        return {
          success: false,
          message: '你还没有使用过任何有次数限制的技能！'
        }
      }

      return {
        success: false,
        message: '请选择要突破瓶颈的技能',
        needSelection: true,
        data: {
          usedSkills: usedSkills
        }
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('突破瓶颈', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 减少使用次数计数（相当于增加可用次数）
    const success = gameStore.decreaseSkillUsageCount(caster.name, skillName)

    if (!success) {
      // 退还金币
      caster.gold += goldCheck.cost
      return {
        success: false,
        message: `${skillName}没有使用记录，无法突破瓶颈`
      }
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了突破瓶颈',
      `${caster.name}使用了突破瓶颈，${skillName}的使用次数上限+1`,
      `${caster.name}使用了了突破瓶颈`
    )

    return {
      success: true,
      message: `${skillName}使用次数上限已增加1次`
    }
  }

  /**
   * 血量存储 - 创建HP存储库，充值和提取HP
   */
  function executeXueLiangCunChu(caster, selfCity, operation, amount) {
    // 初始化存储库
    if (!gameStore.hpBank) {
      gameStore.hpBank = {}
    }
    if (!gameStore.hpBank[caster.name]) {
      gameStore.hpBank[caster.name] = {
        balance: 0,
        depositMade: false,
        hasWithdrawnThisRound: false
      }
    }

    const bankData = gameStore.hpBank[caster.name]

    // 操作类型：deposit（存款）或 withdraw（取款）
    if (operation === 'deposit') {
      if (bankData.depositMade) {
        return { success: false, message: '已经完成过储值，无法重复储值！（每局限1次）' }
      }

      if (!selfCity) {
        return { success: false, message: '未选择城市' }
      }

      const currentHp = selfCity.currentHp || selfCity.hp
      if (currentHp <= 10000) {
        return { success: false, message: 'HP必须大于10000才能储值！' }
      }

      // 检查存款金额（至少10000）
      if (!amount || amount < 10000) {
        return { success: false, message: '存款金额至少10000HP！' }
      }

      if (amount > currentHp) {
        return { success: false, message: `城市HP不足（当前${Math.floor(currentHp)}，需要${amount}）` }
      }

      // 金币检查和扣除
      const goldCheck = checkAndDeductGold('血量存储', caster, gameStore)
      if (!goldCheck.success) {
        return goldCheck
      }

      // 扣除指定HP并储值
      selfCity.currentHp = (selfCity.currentHp || selfCity.hp) - amount
      bankData.balance = amount
      bankData.depositMade = true

      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '血量存储',
        `${caster.name}使用血量存储，${selfCity.name}扣除${amount}HP并储值到存储库（每局限1次）`,
        `${caster.name}使用了血量存储`
      )

      return {
        success: true,
        message: `成功储值${amount}HP到存储库，${selfCity.name}当前HP：${Math.floor(selfCity.currentHp)}`
      }
    } else if (operation === 'withdraw') {
      if (!bankData.depositMade) {
        return { success: false, message: '尚未完成储值，无法提取！' }
      }

      if (bankData.hasWithdrawnThisRound) {
        return { success: false, message: '本回合已经提取过，每回合只能提取一次！' }
      }

      // 检查余额是否低于2000（自动销毁）
      if (bankData.balance < 2000) {
        delete gameStore.hpBank[caster.name]
        return { success: false, message: '存储库余额低于2000，已自动销毁！' }
      }

      if (!selfCity) {
        return { success: false, message: '未选择城市' }
      }

      if (selfCity.currentHp <= 0 || selfCity.isAlive === false) {
        return { success: false, message: '该城市已阵亡，无法提取HP！' }
      }

      // 检查提取金额（不少于2000）
      if (!amount || amount < 2000) {
        return { success: false, message: '提取金额不少于2000HP！' }
      }

      if (amount > bankData.balance) {
        return { success: false, message: `存储库余额不足（当前${Math.floor(bankData.balance)}，需要${amount}）` }
      }

      // 提取需要1金币
      if (caster.gold < 1) {
        return { success: false, message: '金币不足，提取需要1金币！' }
      }
      caster.gold -= 1

      // 提取指定HP
      selfCity.currentHp = (selfCity.currentHp || selfCity.hp) + amount
      bankData.balance -= amount
      bankData.hasWithdrawnThisRound = true

      addSkillEffectLog(gameStore, `${caster.name}花费1金币从存储库提取${amount}HP到${selfCity.name}，剩余余额：${Math.floor(bankData.balance)}`)

      // 检查提取后余额是否低于2000（自动销毁）
      if (bankData.balance < 2000) {
        delete gameStore.hpBank[caster.name]
        addSkillEffectLog(gameStore, `${caster.name}的存储库余额低于2000，已自动销毁`)

      }

      return {
        success: true,
        message: `成功提取${amount}HP（花费1金币），存储库剩余：${Math.floor(bankData.balance)}`,
        data: {
          withdrawn: amount,
          remaining: bankData.balance
        }
      }
    } else if (operation === 'applyInterest') {
      // 利息计算（每回合自动调用）
      if (!bankData.depositMade || bankData.balance <= 0) {
        return { success: true, message: '无活跃存储库' }
      }

      let interestRate = 0
      if (bankData.balance < 50000) {
        interestRate = 0.10  // 10%
      } else if (bankData.balance < 100000) {
        interestRate = 0.05  // 5%
      } else {
        interestRate = 0.01  // 1%
      }

      const interest = Math.floor(bankData.balance * interestRate)
      bankData.balance += interest

      addSkillEffectLog(gameStore, `${caster.name}的存储库获得${interest}HP利息（利率${(interestRate * 100).toFixed(0)}%），当前余额：${Math.floor(bankData.balance)}`)


      return {
        success: true,
        message: `获得${interest}HP利息`,
        data: {
          interest: interest,
          balance: bankData.balance
        }
      }
    }

    return { success: false, message: '未知操作类型' }
  }

  /**
   * 海市蜃楼 - 创造中心投影，拦截对中心的伤害（仅2P/2v2）
   */
  function executeHaiShiShenLou(caster) {
    const gameMode = gameStore.gameMode || '2P'
    const is2p = (gameMode === '2P' || gameMode === '2v2')

    if (!is2p) {
      return { success: false, message: '此技能仅限2人/2v2模式使用！' }
    }

    // 检查使用次数（每局限1次）
    if (!gameStore.mirageUsageCount) {
      gameStore.mirageUsageCount = {}
    }
    if (gameStore.mirageUsageCount[caster.name]) {
      return {
        success: false,
        message: '海市蜃楼每局只能使用1次'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('海市蜃楼', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 标记已使用
    gameStore.mirageUsageCount[caster.name] = true

    // 记录使用次数（用于UI显示）
    gameStore.recordSkillUsage(caster.name, '海市蜃楼')

    // 创建中心投影
    if (!gameStore.mirage) {
      gameStore.mirage = {}
    }

    gameStore.mirage[caster.name] = {
      roundsLeft: 5,
      blocked: 0,  // 拦截计数
      active: true
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了海市蜃楼',
      `${caster.name}使用了海市蜃楼，创建中心投影，持续5回合（75%概率拦截对中心的伤害）`,
      `${caster.name}使用了了海市蜃楼`
    )

    return {
      success: true,
      message: '海市蜃楼使用成功！中心投影已创建，持续5回合'
    }
  }

  /**
   * 解除封锁 - 解除被禁用的技能
   */
  function executeJieChuFengSuo(caster, skillName) {
    // 收集所有被禁用的技能
    const bannedSkillsSet = new Set()

    // 事半功倍禁用的技能
    if (gameStore.bannedSkills && gameStore.bannedSkills[caster.name]) {
      Object.keys(gameStore.bannedSkills[caster.name]).forEach(skill => bannedSkillsSet.add(skill))
    }

    // 过河拆桥禁用的技能
    if (gameStore.burnBridge) {
      for (const otherPlayerName in gameStore.burnBridge) {
        if (otherPlayerName === caster.name) continue

        const burnBridgeState = gameStore.burnBridge[otherPlayerName]
        if (burnBridgeState && burnBridgeState.bannedSkills) {
          // 检查2v2队友
          let isTeammate = false
          if (gameStore.gameMode === '2v2') {
            const otherPlayer = gameStore.players.find(p => p.name === otherPlayerName)
            if (otherPlayer && caster.team !== undefined && otherPlayer.team !== undefined) {
              isTeammate = caster.team === otherPlayer.team
            }
          }

          if (!isTeammate) {
            burnBridgeState.bannedSkills.forEach(skill => bannedSkillsSet.add(skill))
          }
        }
      }
    }

    // 强制搬运禁用的技能
    if (gameStore.forcedSoldierBan) {
      for (const otherPlayerName in gameStore.forcedSoldierBan) {
        if (otherPlayerName === caster.name) continue

        const banData = gameStore.forcedSoldierBan[otherPlayerName]
        if (banData && banData.bannedSkills) {
          // 检查2v2队友
          let isTeammate = false
          if (gameStore.gameMode === '2v2') {
            const otherPlayer = gameStore.players.find(p => p.name === otherPlayerName)
            if (otherPlayer && caster.team !== undefined && otherPlayer.team !== undefined) {
              isTeammate = caster.team === otherPlayer.team
            }
          }

          if (!isTeammate) {
            banData.bannedSkills.forEach(skill => bannedSkillsSet.add(skill))
          }
        }
      }
    }

    const bannedSkills = Array.from(bannedSkillsSet)

    if (bannedSkills.length === 0) {
      return { success: false, message: '当前没有被禁用的技能！' }
    }

    // 如果没有指定技能，返回列表让前端选择
    if (!skillName) {
      return {
        success: true,
        message: '请选择要解除禁用的技能',
        data: {
          bannedSkills: bannedSkills,
          needSelection: true
        }
      }
    }

    // 检查技能是否在禁用列表中
    if (!bannedSkills.includes(skillName)) {
      return { success: false, message: '该技能未被禁用！' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('解除封锁', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 从各个禁用源中移除该技能
    if (gameStore.bannedSkills && gameStore.bannedSkills[caster.name]) {
      delete gameStore.bannedSkills[caster.name][skillName]
    }

    if (gameStore.burnBridge) {
      for (const otherPlayerName in gameStore.burnBridge) {
        const burnBridgeState = gameStore.burnBridge[otherPlayerName]
        if (burnBridgeState && burnBridgeState.bannedSkills) {
          const index = burnBridgeState.bannedSkills.indexOf(skillName)
          if (index !== -1) {
            burnBridgeState.bannedSkills.splice(index, 1)
          }
        }
      }
    }

    if (gameStore.forcedSoldierBan) {
      for (const otherPlayerName in gameStore.forcedSoldierBan) {
        const banData = gameStore.forcedSoldierBan[otherPlayerName]
        if (banData && banData.bannedSkills) {
          const index = banData.bannedSkills.indexOf(skillName)
          if (index !== -1) {
            banData.bannedSkills.splice(index, 1)
          }
        }
      }
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了解除封锁',
      `${caster.name}使用了解除封锁，${skillName}的禁用状态已解除`,
      `${caster.name}使用了了解除封锁`
    )

    return {
      success: true,
      message: `${skillName}的禁用状态已解除`
    }
  }

  /**
   * 数位反转 - 将城市当前HP数字顺序反转（如果末位是0，反转后舍去）
   */
  function executeShuWeiFanZhuan(caster, targetPlayer, targetCity) {
    if (!targetPlayer || !targetCity) {
      return { success: false, message: '未选择目标' }
    }

    const targetCityIdx = targetPlayer.cities.indexOf(targetCity)
    if (targetCityIdx === -1) {
      return { success: false, message: '城市不存在' }
    }

    const currentHp = targetCity.currentHp || targetCity.hp

    // 检查HP是否为80000或100000
    if (currentHp === 80000 || currentHp === 100000) {
      return { success: false, message: '无法对HP为80000或100000的城市使用数位反转' }
    }

    // 确定金币花费：对对手7金币，对己方10金币
    const isOpponent = targetPlayer.name !== caster.name
    const skillCost = isOpponent ? 7 : 10

    // 如果目标是对手城市
    if (isOpponent) {
      // 检查是否为中心城市
      if (targetCity.isCenter) {
        return { success: false, message: '无法对对手中心城市使用数位反转' }
      }

      // 检查是否已知
      if (!gameStore.knownCities || !gameStore.knownCities[caster.name] ||
          !gameStore.knownCities[caster.name][targetPlayer.name] ||
          !gameStore.knownCities[caster.name][targetPlayer.name].includes(targetCityIdx)) {
        return { success: false, message: '该城市尚未已知，无法使用数位反转' }
      }

      // 检查坚不可摧护盾
      if (gameStore.isBlockedByJianbukecui(targetPlayer.name, caster.name, '数位反转')) {
        // 双日志
        addSkillUsageLog(
          gameStore,
          caster.name,
          '数位反转',
          `${caster.name}使用数位反转，但被${targetPlayer.name}的坚不可摧护盾阻挡`,
          `${caster.name}使用了数位反转`
        )
        return {
          success: false,
          message: `被${targetPlayer.name}的坚不可摧护盾阻挡`
        }
      }
    }

    // 检查使用次数（每局限1次）
    if (!gameStore.shuweifanzhuanUsageCount) {
      gameStore.shuweifanzhuanUsageCount = {}
    }
    if (gameStore.shuweifanzhuanUsageCount[caster.name] >= 1) {
      return {
        success: false,
        message: '数位反转每局限1次'
      }
    }

    // 金币检查和扣除（动态费用：对对手7金币，对己方10金币）
    if (caster.gold < skillCost) {
      return {
        success: false,
        message: `${caster.name} 金币不足（需要${skillCost}，当前${caster.gold}）`
      }
    }
    caster.gold -= skillCost

    // 增加使用次数
    if (!gameStore.shuweifanzhuanUsageCount[caster.name]) {
      gameStore.shuweifanzhuanUsageCount[caster.name] = 0
    }
    gameStore.shuweifanzhuanUsageCount[caster.name]++

    // 记录使用次数（用于UI显示）
    gameStore.recordSkillUsage(caster.name, '数位反转')

    // 反转HP数字（如果末位是0，反转后舍去 - parseInt自动处理前导0）
    const hpString = Math.floor(currentHp).toString()
    const reversedString = hpString.split('').reverse().join('')
    // parseInt会自动去掉前导0，例如：12340 → "04321" → 4321
    let newHp = parseInt(reversedString, 10)

    // 上限80000
    if (newHp > 80000) {
      newHp = 80000
    }

    targetCity.currentHp = newHp

    // 双日志
    const costMsg = isOpponent ? '花费7金币' : '花费10金币'
    addSkillUsageLog(
      gameStore,
      caster.name,
      '数位反转',
      `${caster.name}对${targetPlayer.name}的${targetCity.name}使用了数位反转（${costMsg}），HP从${Math.floor(currentHp)}变为${newHp}（每局限1次）`,
      `${caster.name}使用了数位反转`
    )

    return {
      success: true,
      message: `${targetCity.name}的HP已从${Math.floor(currentHp)}变为${newHp}（花费${skillCost}金币）`,
      data: {
        oldHp: currentHp,
        newHp: newHp
      }
    }
  }

  /**
   * 寸步难行 - 限制对手3回合内只能使用当机立断和无懈可击
   */
  function executeChunBuNanXing(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '寸步难行')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '寸步难行',
        `${caster.name}使用寸步难行，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了寸步难行`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('寸步难行', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化寸步难行状态
    if (!gameStore.stareDown) {
      gameStore.stareDown = {}
    }

    gameStore.stareDown[target.name] = {
      roundsLeft: 3,
      source: caster.name
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '寸步难行',
      `${caster.name}对${target.name}使用了寸步难行，${target.name}在接下来3回合内只能使用当机立断和无懈可击`,
      `${caster.name}使用了寸步难行`
    )

    return {
      success: true,
      message: `${target.name}在接下来3回合内只能使用当机立断和无懈可击`
    }
  }

  /**
   * 过河拆桥 - 接下来使用的5个不同技能，其他玩家全部禁用
   */
  function executeGuoHeChaiQiao(caster) {
    // 检查是否已处于过河拆桥状态
    if (gameStore.burnBridge && gameStore.burnBridge[caster.name] && gameStore.burnBridge[caster.name].active) {
      return { success: false, message: '你已经处于过河拆桥状态！' }
    }

    // 检查对手是否有技能保护
    const mode = gameStore.gameMode || '2P'
    let opponents

    if (mode === '2v2') {
      const myTeam = caster.team
      opponents = gameStore.players.filter(p => p.team !== myTeam)
    } else {
      opponents = gameStore.players.filter(p => p.name !== caster.name)
    }

    for (const opp of opponents) {
      if (gameStore.skillProtection &&
          gameStore.skillProtection[opp.name] &&
          gameStore.skillProtection[opp.name].roundsLeft > 0) {
        return { success: false, message: `${opp.name}拥有技能保护，无法使用过河拆桥！` }
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('过河拆桥', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化过河拆桥状态
    if (!gameStore.burnBridge) {
      gameStore.burnBridge = {}
    }

    gameStore.burnBridge[caster.name] = {
      active: true,
      bannedSkills: []  // 记录已禁用的技能列表
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '过河拆桥',
      `${caster.name}使用了过河拆桥，接下来使用的5个不同技能将对其他玩家禁用`,
      `${caster.name}使用了过河拆桥`
    )

    return {
      success: true,
      message: '过河拆桥生效！接下来使用的5个不同技能将对其他玩家禁用'
    }
  }

  /**
   * 电磁感应 - 随机连接对手三座城市，3回合内连锁受伤
   */
  function executeDianCiGanYing(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '电磁感应')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '电磁感应',
        `${caster.name}使用电磁感应，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了电磁感应`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('电磁感应', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取对手可连接的城市（排除钢铁城市和被保护城市）
    const eligibleCities = []
    target.cities.forEach((city, idx) => {
      if (!city || (city.currentHp || city.hp) <= 0 || city.isAlive === false) return

      // 检查是否为钢铁城市
      if (gameStore.ironCities && gameStore.ironCities[target.name] &&
          gameStore.ironCities[target.name].includes(idx)) {
        return
      }

      // 检查是否被保护
      if (gameStore.protections && gameStore.protections[target.name] &&
          gameStore.protections[target.name][idx] > 0) {
        return
      }

      eligibleCities.push(idx)
    })

    if (eligibleCities.length < 3) {
      return { success: false, message: `对手可连接的城市不足3个（当前${eligibleCities.length}个）` }
    }

    // 随机选择3个城市
    const shuffled = eligibleCities.sort(() => Math.random() - 0.5)
    const selectedCities = shuffled.slice(0, 3)

    // 初始化电磁感应状态
    if (!gameStore.electromagnetic) {
      gameStore.electromagnetic = {}
    }

    gameStore.electromagnetic[target.name] = {
      cities: selectedCities,
      roundsLeft: 3,
      source: caster.name
    }

    const cityNames = selectedCities.map(idx => target.cities[idx].name).join('、')
    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '电磁感应',
      `${caster.name}对${target.name}使用了电磁感应，连接了${cityNames}，3回合内连锁受伤50%`,
      `${caster.name}使用了电磁感应`
    )

    return {
      success: true,
      message: `成功连接${cityNames}，3回合内连锁受伤50%`,
      data: {
        connectedCities: selectedCities
      }
    }
  }

  /**
   * 厚积薄发 - 选定满血非中心城市，攻击力降为1，5回合后HP永久×5
   */
  function executeHouJiBaoFa(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    const targetCityIdx = caster.cities.indexOf(selfCity)
    if (targetCityIdx === -1) {
      return { success: false, message: '城市不存在' }
    }

    const mode = gameStore.gameMode || '2P'
    const is2p = (mode === '2P')
    const is2v2 = (mode === '2v2')
    const centerIdx = (is2p || is2v2) ? (caster.centerIndex ?? 0) : -1

    // 检查是否为中心城市
    if ((is2p || is2v2) && targetCityIdx === centerIdx) {
      return { success: false, message: '不能对中心城市使用厚积薄发！' }
    }

    // 检查城市是否满血
    const currentHp = selfCity.currentHp || selfCity.hp
    const initialHp = gameStore.initialCities &&
                      gameStore.initialCities[caster.name] &&
                      gameStore.initialCities[caster.name][targetCityIdx] ?
                      gameStore.initialCities[caster.name][targetCityIdx].hp :
                      selfCity.hp

    if (Math.abs(currentHp - initialHp) > 0.1) {
      return { success: false, message: '该城市当前HP不等于初始HP，无法使用厚积薄发！' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('厚积薄发', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化厚积薄发状态
    if (!gameStore.hjbf) {
      gameStore.hjbf = {}
    }
    if (!gameStore.hjbf[caster.name]) {
      gameStore.hjbf[caster.name] = {}
    }

    // 设置厚积薄发效果
    gameStore.hjbf[caster.name][targetCityIdx] = {
      roundsLeft: 5,
      originalHp: currentHp,
      active: true
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '厚积薄发',
      `${caster.name}对${selfCity.name}使用了厚积薄发，攻击力降为1，5回合后HP永久×5`,
      `${caster.name}使用了厚积薄发`
    )

    return {
      success: true,
      message: `${selfCity.name}进入厚积薄发状态，攻击力降为1，5回合后HP将永久×5`
    }
  }

  /**
   * 中庸之道 - 己方HP<10000的城市和对手HP>10000的城市，HP先开平方再×100
   */
  function executeZhongYongZhiDao(caster) {
    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('中庸之道', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    const mode = gameStore.gameMode || '2P'
    const affectedCities = []

    // 处理己方所有HP<10000的城市
    caster.cities.forEach((city, idx) => {
      if (city && (city.currentHp || city.hp) > 0 && (city.currentHp || city.hp) < 10000) {
        const oldHp = city.currentHp || city.hp
        const newHp = Math.floor(Math.sqrt(oldHp) * 100)
        city.currentHp = newHp

        affectedCities.push({
          player: caster.name,
          cityName: city.name,
          oldHp: Math.round(oldHp),
          newHp: newHp,
          type: '己方低HP'
        })
      }
    })

    // 处理全部对手所有HP>10000的城市
    gameStore.players.forEach(player => {
      if (player.name === caster.name) return

      // 在2v2模式下，跳过队友
      if (mode === '2v2' && player.team === caster.team) return

      // 检查坚不可摧护盾
      if (gameStore.isBlockedByJianbukecui(player.name, caster.name, '中庸之道')) {
        // 双日志
        addSkillUsageLog(
          gameStore,
          caster.name,
          '中庸之道',
          `${caster.name}对${player.name}使用了中庸之道，但被坚不可摧护盾阻挡`,
          `${caster.name}使用了中庸之道`
        )
        return
      }

      player.cities.forEach((city, idx) => {
        if (city && (city.currentHp || city.hp) > 0 && (city.currentHp || city.hp) > 10000) {
          // 检查海市蜃楼拦截（如果目标是中心城市）
          const is2pOr2v2 = (mode === '2P' || mode === '2v2')
          const centerIdx = is2pOr2v2 ? (player.centerIndex ?? 0) : -1
          const isCenter = is2pOr2v2 && idx === centerIdx

          if (isCenter && gameStore.mirage && gameStore.mirage[player.name] &&
              gameStore.mirage[player.name].roundsLeft > 0) {
            // 检查75%概率拦截
            if (Math.random() < 0.75) {
              gameStore.mirage[player.name].blocked++
              affectedCities.push({
                player: player.name,
                cityName: city.name,
                oldHp: Math.round(city.currentHp || city.hp),
                newHp: Math.round(city.currentHp || city.hp),
                type: '被海市蜃楼拦截'
              })
              return
            }
          }

          const oldHp = city.currentHp || city.hp
          const newHp = Math.floor(Math.sqrt(oldHp) * 100)
          city.currentHp = newHp

          affectedCities.push({
            player: player.name,
            cityName: city.name,
            oldHp: Math.round(oldHp),
            newHp: newHp,
            type: '对手高HP'
          })
        }
      })
    })

    const summary = affectedCities.map(c =>
      `${c.player}的${c.cityName}: ${c.oldHp}→${c.newHp}`
    ).join('；')

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '中庸之道',
      `${caster.name}使用了中庸之道，影响${affectedCities.length}座城市。${summary}`,
      `${caster.name}使用了中庸之道`
    )

    return {
      success: true,
      message: `中庸之道生效！影响了${affectedCities.length}座城市`,
      data: {
        affectedCities: affectedCities
      }
    }
  }

  /**
   * 当机立断 - 立即停止对方所有持续技能效果
   */
  function executeDangJiLiDuan(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('当机立断', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    const clearedEffects = []

    // 1. 清除对方对我方使用的天灾人祸
    if (gameStore.disasterDebuff && gameStore.disasterDebuff[caster.name]) {
      const disasterCount = Object.keys(gameStore.disasterDebuff[caster.name]).length
      if (disasterCount > 0) {
        delete gameStore.disasterDebuff[caster.name]
        clearedEffects.push(`天灾人祸×${disasterCount}`)
      }
    }

    // 2. 清除对方对我方使用的电磁感应
    if (gameStore.electromagnetic && gameStore.electromagnetic[caster.name] &&
        gameStore.electromagnetic[caster.name].source === target.name) {
      delete gameStore.electromagnetic[caster.name]
      clearedEffects.push('电磁感应')
    }

    // 3. 清除对方对我方使用的寸步难行
    if (gameStore.stareDown && gameStore.stareDown[caster.name] &&
        gameStore.stareDown[caster.name].source === target.name) {
      delete gameStore.stareDown[caster.name]
      clearedEffects.push('寸步难行')
    }

    // 4. 清除对方的定时爆破
    if (gameStore.timeBombs && gameStore.timeBombs[target.name]) {
      const bombCount = Object.keys(gameStore.timeBombs[target.name]).length
      if (bombCount > 0) {
        delete gameStore.timeBombs[target.name]
        clearedEffects.push(`定时爆破×${bombCount}`)
      }
    }

    // 5. 清除对方的不露踪迹
    if (gameStore.stealthMode && gameStore.stealthMode[target.name]) {
      delete gameStore.stealthMode[target.name]
      clearedEffects.push('不露踪迹')
    }

    // 6. 清除对方的屏障
    if (gameStore.barrier && gameStore.barrier[target.name]) {
      delete gameStore.barrier[target.name]
      clearedEffects.push('设置屏障')
    }

    // 7. 清除对方的潜能激发溢出
    if (gameStore.potentialOverflow && gameStore.potentialOverflow[target.name]) {
      delete gameStore.potentialOverflow[target.name]
      clearedEffects.push('潜能激发溢出')
    }

    if (clearedEffects.length === 0) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '当机立断',
        `${caster.name}对${target.name}使用了当机立断，但没有可清除的效果`,
        `${caster.name}使用了当机立断`
      )
      return {
        success: true,
        message: '当机立断使用成功，但没有可清除的效果'
      }
    }

    const effectsStr = clearedEffects.join('、')
    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '当机立断',
      `${caster.name}对${target.name}使用了当机立断，清除了${effectsStr}`,
      `${caster.name}使用了当机立断`
    )

    return {
      success: true,
      message: `成功清除了${effectsStr}`,
      data: {
        clearedEffects: clearedEffects
      }
    }
  }

  /**
   * 言听计从 - 选定对手一座已知非中心城市，本回合该玩家必须向己方出战该城市
   */
  function executeYanTingJiCong(caster, target, targetCityIdx) {
    if (!target || targetCityIdx === undefined) {
      return { success: false, message: '未选择目标城市' }
    }

    const targetCity = target.cities[targetCityIdx]
    if (!targetCity || targetCity.currentHp <= 0 || targetCity.isAlive === false) {
      return { success: false, message: '目标城市已阵亡' }
    }

    // 检查是否是中心城市
    const mode = gameStore.gameMode || '2P'
    if ((mode === '2P' || mode === '2v2') && target.centerIndex === targetCityIdx) {
      return { success: false, message: '无法指定对手中心城市' }
    }

    // 检查是否是以礼来降标记的城市
    if (gameStore.yillailiang &&
        gameStore.yillailiang[target.name] &&
        gameStore.yillailiang[target.name].cityIndex === targetCityIdx) {
      return { success: false, message: '无法选择以礼来降标记的城市' }
    }

    // 检查对手是否已经确认本回合的出战部署
    if (gameStore.deploymentConfirmed &&
        gameStore.deploymentConfirmed[target.name]) {
      return { success: false, message: '对手已经确认本回合出战，无法使用言听计从' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('言听计从', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 标记城市
    if (!gameStore.yantingjicong) {
      gameStore.yantingjicong = {}
    }
    gameStore.yantingjicong[target.name] = {
      cityIndex: targetCityIdx,
      demandBy: caster.name,
      enforced: false
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '言听计从',
      `${caster.name}对${target.name}使用了言听计从，要求本回合出战${targetCity.name}，否则将被抢夺`,
      `${caster.name}使用了言听计从`
    )

    return {
      success: true,
      message: `${target.name}必须本回合出战${targetCity.name}，否则将被抢夺`
    }
  }

  /**
   * 事半功倍 - 禁止所有对手使用选定技能（本局游戏），花费为目标技能一半向上取整
   */
  function executeShiBanGongBei(caster, skillName) {
    if (!skillName) {
      return { success: false, message: '未选择要禁用的技能' }
    }

    // 技能金币映射表（1-15金币技能）
    const SKILL_COST_MAP = {
      // 战斗金币技能
      '先声夺人': 1, '按兵不动': 2, '无知无畏': 2,
      '擒贼擒王': 3, '草木皆兵': 3, '越战越勇': 3,
      '吸引攻击': 4, '既来则安': 4,
      '铜墙铁壁': 5,
      '背水一战': 6, '料事如神': 6, '暗度陈仓': 6,
      '同归于尽': 7, '声东击西': 7, '欲擒故纵': 7,
      '御驾亲征': 8, '草船借箭': 8,
      '狂暴模式': 9, '以逸待劳': 9,
      '趁火打劫': 10, '晕头转向': 10, '隔岸观火': 10, '挑拨离间': 10,
      '反戈一击': 11,
      '围魏救赵': 13,
      '设置屏障': 15,
      // 非战斗金币技能
      '金币贷款': 1, '定海神针': 1, '城市侦探': 1,
      '焕然一新': 2, '抛砖引玉': 2,
      '城市保护': 3, '快速治疗': 3, '一举两得': 3, '明察秋毫': 3, '拔旗易帜': 3,
      '借尸还魂': 4, '高级治疗': 4, '进制扭曲': 4, '整齐划一': 4, '苟延残喘': 4,
      '众志成城': 5, '清除加成': 5, '钢铁城市': 5, '时来运转': 5, '实力增强': 5, '城市试炼': 5, '人质交换': 5, '釜底抽薪': 5, '避而不见': 5, '劫富济贫': 5, '一触即发': 5, '技能保护': 5, '无中生有': 5, '代行省权': 5,
      '李代桃僵': 6, '天灾人祸': 6, '博学多才': 6, '城市预言': 6, '守望相助': 6, '血量存储': 6, '海市蜃楼': 6,
      '一落千丈': 7, '好高骛远': 7, '寸步难行': 7, '连续打击': 7, '数位反转': 7, '倒反天罡': 7, '解除封锁': 7,
      '波涛汹涌': 8, '狂轰滥炸': 8, '横扫一空': 8, '万箭齐发': 8, '移花接木': 8, '连锁反应': 8, '招贤纳士': 8,
      '不露踪迹': 9, '降维打击': 9, '狐假虎威': 9, '过河拆桥': 9, '厚积薄发': 9,
      '深藏不露': 10, '定时爆破': 10,
      '永久摧毁': 11, '搬运救兵·普通': 11, '电磁感应': 11, '士气大振': 11, '战略转移': 11, '无懈可击': 11, '趁其不备·随机': 11,
      '自相残杀': 12, '当机立断': 12, '中庸之道': 12, '步步高升': 12,
      '搬运救兵·高级': 13, '强制迁都·普通': 13, '强制搬运': 13, '大义灭亲': 13,
      '趁其不备·指定': 14,
      '行政中心': 15
    }

    const originalCost = SKILL_COST_MAP[skillName]
    if (!originalCost || originalCost < 1 || originalCost > 15) {
      return { success: false, message: '该技能无法被禁用（不在1-15金币范围内）' }
    }

    const banCost = Math.ceil(originalCost / 2)

    // 金币检查
    if (caster.gold < banCost) {
      return { success: false, message: `金币不足！需要${banCost}金币，当前只有${caster.gold}金币` }
    }

    // 确定对手列表（2v2模式只禁用对方队伍，2P/3P禁用所有对手）
    const mode = gameStore.gameMode || '2P'
    let opponents
    if (mode === '2v2') {
      const myTeam = caster.team
      opponents = gameStore.players.filter(p => p.team !== myTeam)
    } else {
      opponents = gameStore.players.filter(p => p.name !== caster.name)
    }

    // 初始化 bannedSkills 结构
    if (!gameStore.bannedSkills) {
      gameStore.bannedSkills = {}
    }

    // 检查是否已被禁用
    let alreadyBanned = false
    for (const opp of opponents) {
      if (!gameStore.bannedSkills[opp.name]) {
        gameStore.bannedSkills[opp.name] = {}
      }
      if (gameStore.bannedSkills[opp.name][skillName]) {
        alreadyBanned = true
        break
      }
    }

    if (alreadyBanned) {
      return { success: false, message: `技能"${skillName}"已被禁用` }
    }

    // 检查对手是否有技能保护
    for (const opp of opponents) {
      if (gameStore.skillProtection &&
          gameStore.skillProtection[opp.name] &&
          gameStore.skillProtection[opp.name].roundsLeft > 0) {
        return { success: false, message: `${opp.name}拥有技能保护，无法对其使用事半功倍` }
      }
    }

    // 扣除金币
    caster.gold -= banCost

    // 禁用所有对手的该技能
    for (const opp of opponents) {
      if (!gameStore.bannedSkills[opp.name]) {
        gameStore.bannedSkills[opp.name] = {}
      }
      gameStore.bannedSkills[opp.name][skillName] = {
        bannedBy: caster.name,
        cost: banCost
      }
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了事半功倍（花费${banCost}金币）',
      `${caster.name}使用了事半功倍（花费${banCost}金币），禁用所有对手的"${skillName}"技能`,
      `${caster.name}使用了了事半功倍（花费${banCost}金币）`
    )

    return {
      success: true,
      message: `成功禁用所有对手的"${skillName}"技能（花费${banCost}金币）`,
      data: {
        bannedSkill: skillName,
        cost: banCost,
        affectedPlayers: opponents.map(opp => opp.name)
      }
    }
  }

  /**
   * 倒反天罡 - 移除对手省会的归顺效果
   */
  function executeDaoFanTianGang(caster, target, capitalCityIdx) {
    if (!target || capitalCityIdx === undefined) {
      return { success: false, message: '未选择目标省会城市' }
    }

    const capital = target.cities[capitalCityIdx]
    if (!capital || capital.currentHp <= 0 || capital.isAlive === false) {
      return { success: false, message: '目标城市已阵亡' }
    }

    // 检查是否是中心城市
    const mode = gameStore.gameMode || '2P'
    if ((mode === '2P' || mode === '2v2') && target.centerIndex === capitalCityIdx) {
      return { success: false, message: '无法对中心城市使用倒反天罡' }
    }

    // 检查是否是省会（需要省会判断逻辑）
    // 简化：假设城市有isCapitalCity属性或根据名称判断
    const isCapital = capital.isCapitalCity || gameStore.isCapitalCity(capital.name)
    if (!isCapital) {
      return { success: false, message: '目标城市不是省会城市' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '倒反天罡')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '倒反天罡',
        `${caster.name}使用倒反天罡，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了倒反天罡`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('倒反天罡', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取省份名称
    const province = gameStore.getProvinceOfCity(capital.name)?.name || '未知省份'

    // 设置倒反天罡状态
    if (!gameStore.reversedCapitals) {
      gameStore.reversedCapitals = {}
    }
    if (!gameStore.reversedCapitals[target.name]) {
      gameStore.reversedCapitals[target.name] = {}
    }

    gameStore.reversedCapitals[target.name][capitalCityIdx] = {
      province: province,
      cityName: capital.name
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '倒反天罡',
      `${caster.name}对${target.name}的省会${capital.name}（${province}）使用了倒反天罡，该省会失去归顺效果`,
      `${caster.name}使用了倒反天罡`
    )

    return {
      success: true,
      message: `${capital.name}（${province}）失去归顺效果，该省不再触发省会归顺`,
      data: {
        capitalCity: capital.name,
        province: province
      }
    }
  }

  /**
   * 搬运救兵·普通 - 随机获得2个同省城市，强制3城出战
   */
  function executeBanyunJiubingPutong(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    const myCityIdx = caster.cities.indexOf(selfCity)
    if (myCityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    // 获取有效省份（考虑拔旗易帜changeFlagMark）
    let provinceName
    if (gameStore.changeFlagMark &&
        gameStore.changeFlagMark[caster.name] &&
        gameStore.changeFlagMark[caster.name][myCityIdx]) {
      provinceName = gameStore.changeFlagMark[caster.name][myCityIdx].newProvince
    } else {
      const province = gameStore.getProvinceOfCity(selfCity.name)
      provinceName = province ? province.name : null
    }

    if (!provinceName || provinceName === '直辖市和特区') {
      return {
        success: false,
        message: '无法对直辖市和特别行政区的城市使用此技能！'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('搬运救兵·普通', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取所有已使用的城市名
    const usedNames = new Set()
    gameStore.players.forEach(player => {
      player.cities.forEach(city => {
        if (city && city.name) {
          usedNames.add(city.name)
        }
      })
    })

    // 从未使用城市池中筛选同省且可用的城市
    const unusedCities = gameStore.getUnusedCities()
    const availableCities = unusedCities.filter(c => {
      const cityProvince = gameStore.getProvinceOfCity(c.name)
      return cityProvince && cityProvince.name === provinceName && !usedNames.has(c.name)
    })

    if (availableCities.length < 2) {
      return {
        success: false,
        message: `${provinceName}中可用的未使用城市不足2个（当前${availableCities.length}个）`
      }
    }

    // 随机抽取2个
    const shuffled = [...availableCities].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, 2)

    const newCityIndices = []
    const addedCities = []

    for (const cityData of picked) {
      // 创建城市副本
      const newCity = {
        name: cityData.name,
        hp: cityData.hp,
        currentHp: cityData.hp,
        baseHp: cityData.hp,
        isAlive: true,
        red: cityData.red || 0,
        green: cityData.green || 0,
        blue: cityData.blue || 0,
        yellow: cityData.yellow || 0,
        modifiers: []
      }

      // 添加到玩家城市列表
      caster.cities.push(newCity)
      const newIdx = caster.cities.length - 1
      newCityIndices.push(newIdx)
      addedCities.push(newCity)

      // 标记为已使用
      gameStore.markCityAsUsed(cityData.name)

      // 记录到initialCities
      if (!gameStore.initialCities[caster.name]) {
        gameStore.initialCities[caster.name] = []
      }
      gameStore.initialCities[caster.name].push({ name: newCity.name, hp: newCity.hp })
    }

    // 强制这些城市本回合出战（原城市+2个新城市）
    if (!gameStore.playerStates[caster.name]) {
      gameStore.playerStates[caster.name] = {}
    }
    gameStore.playerStates[caster.name].forcedDeployment = {
      cities: [myCityIdx, ...newCityIndices],
      reason: '搬运救兵·普通'
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '搬运救兵·普通',
      `${caster.name}使用搬运救兵·普通，从${provinceName}招募了${addedCities.map(c => `${c.name}(${c.hp})`).join('、')}，强制3城出战`,
      `${caster.name}使用了搬运救兵·普通`
    )

    return {
      success: true,
      message: `招募了2个${provinceName}城市：${addedCities.map(c => c.name).join('、')}，强制3城出战`,
      data: {
        province: provinceName,
        addedCities: addedCities.map(c => ({ name: c.name, hp: c.hp }))
      }
    }
  }

  /**
   * 搬运救兵·高级 - 随机获得3个同省城市，含1个高HP城市
   */
  function executeBanyunJiubingGaoji(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    const myCityIdx = caster.cities.indexOf(selfCity)
    if (myCityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    // 获取有效省份（考虑拔旗易帜）
    let provinceName
    if (gameStore.changeFlagMark &&
        gameStore.changeFlagMark[caster.name] &&
        gameStore.changeFlagMark[caster.name][myCityIdx]) {
      provinceName = gameStore.changeFlagMark[caster.name][myCityIdx].newProvince
    } else {
      const province = gameStore.getProvinceOfCity(selfCity.name)
      provinceName = province ? province.name : null
    }

    if (!provinceName || provinceName === '直辖市和特区') {
      return {
        success: false,
        message: '无法对直辖市和特别行政区的城市使用此技能！'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('搬运救兵·高级', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取所有已使用的城市名
    const usedNames = new Set()
    gameStore.players.forEach(player => {
      player.cities.forEach(city => {
        if (city && city.name) {
          usedNames.add(city.name)
        }
      })
    })

    // 从未使用城市池中筛选同省且可用的城市
    const unusedCities = gameStore.getUnusedCities()
    const availableCities = unusedCities.filter(c => {
      const cityProvince = gameStore.getProvinceOfCity(c.name)
      return cityProvince && cityProvince.name === provinceName && !usedNames.has(c.name)
    })

    if (availableCities.length < 3) {
      return {
        success: false,
        message: `${provinceName}中可用的未使用城市不足3个（当前${availableCities.length}个）`
      }
    }

    // 按HP排序（降序）
    const sorted = [...availableCities].sort((a, b) => b.hp - a.hp)

    // 选择高HP城市：如果目标城市是省内最高HP，则取第二高；否则取最高
    let highHpCity
    if (sorted.length === 1) {
      highHpCity = sorted[0]
    } else {
      const maxHp = sorted[0].hp
      if (selfCity.name === sorted[0].name) {
        highHpCity = sorted[1]
      } else {
        highHpCity = sorted[0]
      }
    }

    // 从可用城市中排除已选择的高HP城市，随机选择2个
    const remaining = availableCities.filter(c => c.name !== highHpCity.name)
    const shuffled = [...remaining].sort(() => Math.random() - 0.5)
    const randomTwo = shuffled.slice(0, 2)

    const picked = [highHpCity, ...randomTwo]
    const addedCities = []

    for (const cityData of picked) {
      // 创建城市副本
      const newCity = {
        name: cityData.name,
        hp: cityData.hp,
        currentHp: cityData.hp,
        baseHp: cityData.hp,
        isAlive: true,
        red: cityData.red || 0,
        green: cityData.green || 0,
        blue: cityData.blue || 0,
        yellow: cityData.yellow || 0,
        modifiers: []
      }

      // 添加到玩家城市列表
      caster.cities.push(newCity)
      addedCities.push(newCity)

      // 标记为已使用
      gameStore.markCityAsUsed(cityData.name)

      // 记录到initialCities
      if (!gameStore.initialCities[caster.name]) {
        gameStore.initialCities[caster.name] = []
      }
      gameStore.initialCities[caster.name].push({ name: newCity.name, hp: newCity.hp })
    }

    // 如果总城市数量 <= 5，自动加入预备
    const totalAliveCities = caster.cities.filter(c => c.isAlive !== false).length
    if (totalAliveCities <= 5) {
      if (!gameStore.roster[caster.name]) {
        gameStore.roster[caster.name] = []
      }
      const startIdx = caster.cities.length - 3
      for (let i = startIdx; i < caster.cities.length; i++) {
        if (!gameStore.roster[caster.name].includes(i)) {
          gameStore.roster[caster.name].push(i)
        }
      }
    }

    // 检查战斗预备城市数量是否不足
    const mode = gameStore.gameMode || '2P'
    const requiredRosterSize = (mode === '2v2') ? 4 : 5
    const aliveRosterCities = (gameStore.roster[caster.name] || []).filter(idx => {
      const city = caster.cities[idx]
      return city && (city.currentHp || city.hp) > 0
    })

    if (aliveRosterCities.length < requiredRosterSize) {
      addSkillEffectLog(gameStore, `${caster.name}的战斗预备城市不足，请补充至${requiredRosterSize}个`)

    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '搬运救兵·高级',
      `${caster.name}使用搬运救兵·高级，从${provinceName}招募了${addedCities.map(c => `${c.name}(${c.hp})`).join('、')}`,
      `${caster.name}使用了搬运救兵·高级`
    )

    return {
      success: true,
      message: `招募了3个${provinceName}城市：${addedCities.map(c => c.name).join('、')}`,
      data: {
        province: provinceName,
        addedCities: addedCities.map(c => ({ name: c.name, hp: c.hp })),
        highHpCity: highHpCity.name
      }
    }
  }

  /**
   * 趁其不备·随机 - 随机抢夺对手一座城市
   */
  function executeChenqibubeiSuiji(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '趁其不备·随机')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '趁其不备·随机',
        `${caster.name}使用趁其不备·随机，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了趁其不备·随机`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('趁其不备·随机', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    const mode = gameStore.gameMode || '2P'
    const centerIndex = (mode === '2P' || mode === '2v2') ? (target.centerIndex ?? 0) : -1
    const protections = (gameStore.protections && gameStore.protections[target.name]) || {}
    const ironCities = (gameStore.ironCities && gameStore.ironCities[target.name]) || {}
    const anchored = (gameStore.anchored && gameStore.anchored[target.name]) || {}
    const bbgs = (gameStore.bbgs && gameStore.bbgs[target.name]) || {}

    // 筛选可偷城市（排除中心城市、保护城市、钢铁城市、定海神针城市、步步高升城市）
    const eligible = target.cities
      .map((c, i) => ({ city: c, idx: i }))
      .filter(item => {
        if ((item.city.currentHp || item.city.hp) <= 0) return false
        if (item.city.isAlive === false) return false
        if (item.idx === centerIndex) return false // 排除中心城市
        if (protections[item.idx] && protections[item.idx] > 0) return false
        if (ironCities[item.idx]) return false
        if (anchored[item.idx] && anchored[item.idx] > 0) return false
        if (bbgs[item.idx]) return false
        return true
      })

    if (eligible.length === 0) {
      return {
        success: false,
        message: '对手没有可偷取的城市（排除中心、保护、钢铁、定海神针、步步高升城市）'
      }
    }

    // 随机选择一个
    const selected = eligible[Math.floor(Math.random() * eligible.length)]
    const stolenCity = { ...selected.city }
    const stolenCityName = stolenCity.name
    const stolenCityHp = stolenCity.currentHp || stolenCity.hp
    const stolenCityIdx = selected.idx

    // 保存原始疲劳streak和changeFlagMark数据（在移除之前）
    const savedStreak = (target.streaks && target.streaks[stolenCityIdx]) || 0
    const savedChangeFlagMark = (gameStore.changeFlagMark[target.name] && gameStore.changeFlagMark[target.name][stolenCityIdx]) || null

    // 从对手移除城市
    target.cities.splice(stolenCityIdx, 1)

    // 同步移除initialCities
    if (gameStore.initialCities[target.name]) {
      gameStore.initialCities[target.name].splice(stolenCityIdx, 1)
    }

    // 更新对手的roster，修正索引
    if (gameStore.roster[target.name]) {
      gameStore.roster[target.name] = gameStore.roster[target.name]
        .filter(idx => idx !== stolenCityIdx)
        .map(idx => idx > stolenCityIdx ? idx - 1 : idx)
    }

    // 更新对手的streaks，修正索引
    if (target.streaks) {
      const newStreaks = {}
      Object.keys(target.streaks).forEach(idx => {
        const numIdx = parseInt(idx)
        if (numIdx < stolenCityIdx) {
          newStreaks[numIdx] = target.streaks[numIdx]
        } else if (numIdx > stolenCityIdx) {
          newStreaks[numIdx - 1] = target.streaks[numIdx]
        }
        // numIdx === stolenCityIdx的情况被跳过（已被抢夺）
      })
      target.streaks = newStreaks
    }

    // 更新对手的changeFlagMark，修正索引
    if (gameStore.changeFlagMark[target.name]) {
      const newMarks = {}
      Object.keys(gameStore.changeFlagMark[target.name]).forEach(idx => {
        const numIdx = parseInt(idx)
        if (numIdx < stolenCityIdx) {
          newMarks[numIdx] = gameStore.changeFlagMark[target.name][numIdx]
        } else if (numIdx > stolenCityIdx) {
          newMarks[numIdx - 1] = gameStore.changeFlagMark[target.name][numIdx]
        }
        // numIdx === stolenCityIdx的情况被跳过（已被抢夺）
      })
      gameStore.changeFlagMark[target.name] = newMarks
    }

    // 更新centerIndex
    if (target.centerIndex !== undefined && target.centerIndex > stolenCityIdx) {
      target.centerIndex--
    }

    // 添加到己方
    caster.cities.push(stolenCity)
    const newIdx = caster.cities.length - 1

    // 记录到initialCities
    if (!gameStore.initialCities[caster.name]) {
      gameStore.initialCities[caster.name] = []
    }
    gameStore.initialCities[caster.name].push({ name: stolenCity.name, hp: stolenCity.baseHp || stolenCity.hp })

    // 转移疲劳streak到新索引
    if (!caster.streaks) caster.streaks = {}
    caster.streaks[newIdx] = savedStreak

    // 转移changeFlagMark到新索引
    if (savedChangeFlagMark) {
      if (!gameStore.changeFlagMark[caster.name]) gameStore.changeFlagMark[caster.name] = {}
      gameStore.changeFlagMark[caster.name][newIdx] = { ...savedChangeFlagMark }
    }

    // 如果总城市数量 <= 5，自动加入预备
    if (caster.cities.length <= 5) {
      if (!gameStore.roster[caster.name]) {
        gameStore.roster[caster.name] = []
      }
      if (!gameStore.roster[caster.name].includes(newIdx)) {
        gameStore.roster[caster.name].push(newIdx)
      }
    }

    // 标记被偷走的城市为已知
    gameStore.setCityKnown(caster.name, newIdx, target.name)

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '趁其不备·随机',
      `${caster.name}对${target.name}使用趁其不备·随机，抢夺了${stolenCityName}(HP:${Math.floor(stolenCityHp)})`,
      `${caster.name}使用了趁其不备·随机`
    )

    return {
      success: true,
      message: `成功抢夺了${stolenCityName}(HP:${Math.floor(stolenCityHp)})`,
      data: {
        stolenCity: stolenCityName,
        stolenHp: stolenCityHp
      }
    }
  }

  /**
   * 趁其不备·指定 - 指定抢夺对手一座已知城市
   */
  function executeChenqibubeiZhiding(caster, target, targetCity) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    const cityIdx = target.cities.indexOf(targetCity)
    if (cityIdx === -1) {
      return { success: false, message: '目标城市不存在' }
    }

    if ((targetCity.currentHp || targetCity.hp) <= 0 || targetCity.isAlive === false) {
      return { success: false, message: '目标城市已阵亡' }
    }

    // 检查城市是否已知
    if (!gameStore.knownCities || !gameStore.knownCities[caster.name] ||
        !gameStore.knownCities[caster.name][target.name] ||
        !gameStore.knownCities[caster.name][target.name].includes(cityIdx)) {
      return { success: false, message: '该城市尚未已知，无法指定抢夺' }
    }

    // 检查是否是中心城市
    const mode = gameStore.gameMode || '2P'
    if ((mode === '2P' || mode === '2v2') && target.centerIndex === cityIdx) {
      return { success: false, message: '无法抢夺中心城市' }
    }

    // 检查城市保护
    if (gameStore.protections && gameStore.protections[target.name] &&
        gameStore.protections[target.name][cityIdx] &&
        gameStore.protections[target.name][cityIdx] > 0) {
      return { success: false, message: '该城市受保护，无法抢夺' }
    }

    // 检查钢铁城市
    if (gameStore.ironCities && gameStore.ironCities[target.name] &&
        gameStore.ironCities[target.name][cityIdx]) {
      return { success: false, message: '该城市是钢铁城市，无法抢夺' }
    }

    // 检查步步高升状态
    if (gameStore.bbgs &&
        gameStore.bbgs[target.name] &&
        gameStore.bbgs[target.name][cityIdx]) {
      return { success: false, message: '该城市有步步高升状态，无法抢夺' }
    }

    // 检查定海神针状态
    const anchored = (gameStore.anchored && gameStore.anchored[target.name]) || {}
    if (anchored[cityIdx] && anchored[cityIdx] > 0) {
      return { success: false, message: '该城市受定海神针保护，无法抢夺' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '趁其不备·指定')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '趁其不备·指定',
        `${caster.name}使用趁其不备·指定，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了趁其不备·指定`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('趁其不备·指定', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    const stolenCity = { ...targetCity }
    const stolenCityName = stolenCity.name
    const stolenCityHp = stolenCity.currentHp || stolenCity.hp

    // 保存原始疲劳streak和changeFlagMark数据（在移除之前）
    const savedStreak = (target.streaks && target.streaks[cityIdx]) || 0
    const savedChangeFlagMark = (gameStore.changeFlagMark[target.name] && gameStore.changeFlagMark[target.name][cityIdx]) || null

    // 从对手移除城市
    target.cities.splice(cityIdx, 1)

    // 同步移除initialCities
    if (gameStore.initialCities[target.name]) {
      gameStore.initialCities[target.name].splice(cityIdx, 1)
    }

    // 更新对手的roster，修正索引
    if (gameStore.roster[target.name]) {
      gameStore.roster[target.name] = gameStore.roster[target.name]
        .filter(idx => idx !== cityIdx)
        .map(idx => idx > cityIdx ? idx - 1 : idx)
    }

    // 更新对手的streaks，修正索引
    if (target.streaks) {
      const newStreaks = {}
      Object.keys(target.streaks).forEach(idx => {
        const numIdx = parseInt(idx)
        if (numIdx < cityIdx) {
          newStreaks[numIdx] = target.streaks[numIdx]
        } else if (numIdx > cityIdx) {
          newStreaks[numIdx - 1] = target.streaks[numIdx]
        }
        // numIdx === cityIdx的情况被跳过（已被抢夺）
      })
      target.streaks = newStreaks
    }

    // 更新对手的changeFlagMark，修正索引
    if (gameStore.changeFlagMark[target.name]) {
      const newMarks = {}
      Object.keys(gameStore.changeFlagMark[target.name]).forEach(idx => {
        const numIdx = parseInt(idx)
        if (numIdx < cityIdx) {
          newMarks[numIdx] = gameStore.changeFlagMark[target.name][numIdx]
        } else if (numIdx > cityIdx) {
          newMarks[numIdx - 1] = gameStore.changeFlagMark[target.name][numIdx]
        }
        // numIdx === cityIdx的情况被跳过（已被抢夺）
      })
      gameStore.changeFlagMark[target.name] = newMarks
    }

    // 更新centerIndex
    if (target.centerIndex !== undefined && target.centerIndex > cityIdx) {
      target.centerIndex--
    }

    // 添加到己方
    caster.cities.push(stolenCity)
    const newIdx = caster.cities.length - 1

    // 记录到initialCities
    if (!gameStore.initialCities[caster.name]) {
      gameStore.initialCities[caster.name] = []
    }
    gameStore.initialCities[caster.name].push({ name: stolenCity.name, hp: stolenCity.baseHp || stolenCity.hp })

    // 转移疲劳streak到新索引
    if (!caster.streaks) caster.streaks = {}
    caster.streaks[newIdx] = savedStreak

    // 转移changeFlagMark到新索引
    if (savedChangeFlagMark) {
      if (!gameStore.changeFlagMark[caster.name]) gameStore.changeFlagMark[caster.name] = {}
      gameStore.changeFlagMark[caster.name][newIdx] = { ...savedChangeFlagMark }
    }

    // 如果总城市数量 <= 5，自动加入预备
    if (caster.cities.length <= 5) {
      if (!gameStore.roster[caster.name]) {
        gameStore.roster[caster.name] = []
      }
      if (!gameStore.roster[caster.name].includes(newIdx)) {
        gameStore.roster[caster.name].push(newIdx)
      }
    }

    // 标记被偷走的城市为已知
    gameStore.setCityKnown(caster.name, newIdx, target.name)

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '趁其不备·指定',
      `${caster.name}对${target.name}使用趁其不备·指定，抢夺了${stolenCityName}(HP:${Math.floor(stolenCityHp)})`,
      `${caster.name}使用了趁其不备·指定`
    )

    return {
      success: true,
      message: `成功抢夺了${stolenCityName}(HP:${Math.floor(stolenCityHp)})`,
      data: {
        stolenCity: stolenCityName,
        stolenHp: stolenCityHp
      }
    }
  }

  /**
   * 拔旗易帜 - 交换己方和对手各一个非省会城市的省份归属
   */
  function executeBaQiYiZhi(caster, target, params) {
    const { myCityIdx, oppCityIdx } = params

    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    if (myCityIdx === undefined || oppCityIdx === undefined) {
      return { success: false, message: '未选择城市' }
    }

    // 辅助函数：获取城市的有效省份（考虑拔旗易帜）
    const getEffectiveProvince = (player, cityIdx) => {
      if (gameStore.changeFlagMark &&
          gameStore.changeFlagMark[player.name] &&
          gameStore.changeFlagMark[player.name][cityIdx]) {
        return gameStore.changeFlagMark[player.name][cityIdx].newProvince
      }
      const city = player.cities[cityIdx]
      return city ? (city.province || gameStore.getProvinceName(city.name)) : null
    }

    const myCity = caster.cities[myCityIdx]
    const oppCity = target.cities[oppCityIdx]

    if (!myCity || !oppCity) {
      return { success: false, message: '城市不存在' }
    }

    if (myCity.currentHp <= 0 || myCity.isAlive === false) {
      return { success: false, message: '己方城市已阵亡' }
    }

    if (oppCity.currentHp <= 0 || oppCity.isAlive === false) {
      return { success: false, message: '对方城市已阵亡' }
    }

    const myProv = getEffectiveProvince(caster, myCityIdx)
    const oppProv = getEffectiveProvince(target, oppCityIdx)

    if (!myProv || !oppProv) {
      return { success: false, message: '无法获取城市省份信息' }
    }

    // 检查是否是省会
    if (gameStore.isCapitalCity(myCity.name, myProv)) {
      return { success: false, message: '己方城市是省会，无法使用拔旗易帜' }
    }

    if (gameStore.isCapitalCity(oppCity.name, oppProv)) {
      return { success: false, message: '对方城市是省会，无法使用拔旗易帜' }
    }

    // 检查是否是直辖市和特区
    if (myProv === '直辖市和特区') {
      return { success: false, message: '己方城市属于直辖市和特区，无法使用拔旗易帜' }
    }

    if (oppProv === '直辖市和特区') {
      return { success: false, message: '对方城市属于直辖市和特区，无法使用拔旗易帜' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('拔旗易帜', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化changeFlagMark结构
    if (!gameStore.changeFlagMark) {
      gameStore.changeFlagMark = {}
    }
    if (!gameStore.changeFlagMark[caster.name]) {
      gameStore.changeFlagMark[caster.name] = {}
    }
    if (!gameStore.changeFlagMark[target.name]) {
      gameStore.changeFlagMark[target.name] = {}
    }

    // 交换省份归属
    gameStore.changeFlagMark[caster.name][myCityIdx] = {
      newProvince: oppProv,
      originalProvince: myProv
    }

    gameStore.changeFlagMark[target.name][oppCityIdx] = {
      newProvince: myProv,
      originalProvince: oppProv
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了拔旗易帜',
      `${caster.name}对${target.name}使用了拔旗易帜，交换了${myCity.name}（${myProv}→${oppProv}）和${oppCity.name}（${oppProv}→${myProv}）的省份归属`,
      `${caster.name}使用了了拔旗易帜`
    )

    return {
      success: true,
      message: `成功交换省份归属：${myCity.name}（${myProv}→${oppProv}）和${oppCity.name}（${oppProv}→${myProv}）`,
      data: {
        myCityName: myCity.name,
        oppCityName: oppCity.name,
        myProvChange: { from: myProv, to: oppProv },
        oppProvChange: { from: oppProv, to: myProv }
      }
    }
  }

  /**
   * 守望相助 - 指定己方一个非直辖市城市，当该城市死亡时自动复活同省一个已死城市
   */
  function executeShouWangXiangZhu(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    const cityIdx = caster.cities.indexOf(selfCity)
    if (cityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    if (selfCity.currentHp <= 0 || selfCity.isAlive === false) {
      return { success: false, message: '该城市已阵亡' }
    }

    const prov = selfCity.province || gameStore.getProvinceName(selfCity.name)

    // 检查是否是直辖市/特别行政区
    if (prov === '北京市' || prov === '上海市' || prov === '天津市' || prov === '重庆市' ||
        prov === '香港特别行政区' || prov === '澳门特别行政区' || prov === '直辖市和特区') {
      return {
        success: false,
        message: '无法对直辖市和特别行政区的城市使用守望相助'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('守望相助', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化mutualWatch结构
    if (!gameStore.mutualWatch) {
      gameStore.mutualWatch = {}
    }
    if (!gameStore.mutualWatch[caster.name]) {
      gameStore.mutualWatch[caster.name] = {}
    }

    // 设置守望相助状态
    gameStore.mutualWatch[caster.name][cityIdx] = {
      province: prov,
      cityName: selfCity.name
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了守望相助',
      `${caster.name}对${selfCity.name}（${prov}）使用了守望相助，当该城市阵亡时将自动复活同省一个已死城市`,
      `${caster.name}使用了了守望相助`
    )

    return {
      success: true,
      message: `${selfCity.name}获得守望相助效果，阵亡时将自动复活同省一个已死城市`,
      data: {
        cityName: selfCity.name,
        province: prov
      }
    }
  }

  /**
   * 以礼来降 - 标记对手一座已知非中心城市
   */
  function executeYiLiLaiJiang(caster, target, targetCity) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    const targetCityIdx = target.cities.indexOf(targetCity)
    if (targetCityIdx === -1) {
      return { success: false, message: '目标城市不存在' }
    }

    if (targetCity.currentHp <= 0 || targetCity.isAlive === false) {
      return { success: false, message: '目标城市已阵亡' }
    }

    // 检查是否是中心城市
    const mode = gameStore.gameMode || '2P'
    if ((mode === '2P' || mode === '2v2') && target.centerIndex === targetCityIdx) {
      return { success: false, message: '无法对中心城市使用以礼来降' }
    }

    // 检查城市是否已知
    if (!gameStore.knownCities || !gameStore.knownCities[caster.name] ||
        !gameStore.knownCities[caster.name][target.name] ||
        !gameStore.knownCities[caster.name][target.name].includes(targetCityIdx)) {
      return { success: false, message: '该城市尚未已知，无法使用以礼来降' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('以礼来降', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化yillailiang结构
    if (!gameStore.yillailiang) {
      gameStore.yillailiang = {}
    }

    // 设置以礼来降标记
    gameStore.yillailiang[target.name] = {
      cityIndex: targetCityIdx,
      markedBy: caster.name,
      cityName: targetCity.name
    }

    // 撤除钢铁城市状态
    if (gameStore.ironCities && gameStore.ironCities[target.name] &&
        gameStore.ironCities[target.name][targetCityIdx]) {
      delete gameStore.ironCities[target.name][targetCityIdx]
      addSkillEffectLog(gameStore, `${targetCity.name}的钢铁城市状态被撤除`)
    }

    // 撤除保护罩
    if (gameStore.protections && gameStore.protections[target.name] &&
        gameStore.protections[target.name][targetCityIdx]) {
      delete gameStore.protections[target.name][targetCityIdx]
      addSkillEffectLog(gameStore, `${targetCity.name}的保护罩被撤除`)
    }

    // 加入谨慎交换集合
    if (!gameStore.cautiousSet) {
      gameStore.cautiousSet = {}
    }
    if (!gameStore.cautiousSet[target.name]) {
      gameStore.cautiousSet[target.name] = []
    }
    if (!gameStore.cautiousSet[target.name].includes(targetCityIdx)) {
      gameStore.cautiousSet[target.name].push(targetCityIdx)
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了以礼来降',
      `${caster.name}对${target.name}的${targetCity.name}使用了以礼来降，该城市被标记并加入谨慎交换集合`,
      `${caster.name}使用了了以礼来降`
    )

    return {
      success: true,
      message: `成功标记${targetCity.name}，当该城市被消灭后将获得该城市并随机抢夺对方一座城市`,
      data: {
        targetCity: targetCity.name,
        targetPlayer: target.name
      }
    }
  }

  /**
   * 大义灭亲 - 选择己方一个非直辖市城市，摧毁同省所有对手城市（非省会）
   */
  function executeDaYiMieQin(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    const myCityIdx = caster.cities.indexOf(selfCity)
    if (myCityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    if (selfCity.currentHp <= 0 || selfCity.isAlive === false) {
      return { success: false, message: '己方城市已阵亡' }
    }

    // 获取有效省份（考虑拔旗易帜）
    let myProv
    if (gameStore.changeFlagMark &&
        gameStore.changeFlagMark[caster.name] &&
        gameStore.changeFlagMark[caster.name][myCityIdx]) {
      myProv = gameStore.changeFlagMark[caster.name][myCityIdx].newProvince
    } else {
      myProv = selfCity.province || gameStore.getProvinceName(selfCity.name)
    }

    // 检查是否是直辖市/特别行政区
    if (myProv === '北京市' || myProv === '上海市' || myProv === '天津市' || myProv === '重庆市' ||
        myProv === '香港特别行政区' || myProv === '澳门特别行政区' || myProv === '直辖市和特区') {
      return {
        success: false,
        message: '无法对直辖市和特别行政区的城市使用大义灭亲'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('大义灭亲', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    const mode = gameStore.gameMode || '2P'
    let destroyLog = []
    let protectLog = []
    let totalDestroyed = 0

    // 遍历所有对手玩家
    gameStore.players.forEach(opp => {
      if (opp.name === caster.name) return

      // 在2v2模式下，跳过队友
      if (mode === '2v2' && opp.team === caster.team) return

      // 检查坚不可摧护盾
      if (gameStore.isBlockedByJianbukecui(opp.name, caster.name, '大义灭亲')) {
        // 双日志
        addSkillUsageLog(
          gameStore,
          caster.name,
          '大义灭亲',
          `${caster.name}对${opp.name}使用了大义灭亲，但被坚不可摧护盾阻挡`,
          `${caster.name}使用了大义灭亲`
        )
        return // 跳过该对手
      }

      const citiesToRemove = []

      opp.cities.forEach((oppCity, idx) => {
        if (!oppCity || oppCity.currentHp <= 0 || oppCity.isAlive === false) return

        // 获取有效省份（考虑拔旗易帜）
        let oppProv
        if (gameStore.changeFlagMark &&
            gameStore.changeFlagMark[opp.name] &&
            gameStore.changeFlagMark[opp.name][idx]) {
          oppProv = gameStore.changeFlagMark[opp.name][idx].newProvince
        } else {
          oppProv = oppCity.province || gameStore.getProvinceName(oppCity.name)
        }

        // 同省且非直辖市/特区
        if (oppProv === myProv) {
          // 检查是否是直辖市或特区城市
          const province = gameStore.getProvinceOfCity(oppCity.name)
          const provinceName = province ? province.name : null
          if (provinceName === '直辖市和特区') {
            return // 跳过直辖市和特区城市
          }

          // 检查是否是中心城市（2P/2v2模式）
          if ((mode === '2P' || mode === '2v2') && idx === (opp.centerIndex ?? 0)) {
            return // 跳过中心城市
          }

          // 检查保护和铁城
          let hasProtection = false

          // 检查保护罩
          if (gameStore.protections && gameStore.protections[opp.name] &&
              gameStore.protections[opp.name][idx] && gameStore.protections[opp.name][idx] > 0) {
            gameStore.protections[opp.name][idx] -= 1
            protectLog.push(`${opp.name}的${oppCity.name}保护层数-1（剩余${gameStore.protections[opp.name][idx]}）`)
            hasProtection = true
          }
          // 检查铁城
          else if (gameStore.ironCities && gameStore.ironCities[opp.name] &&
                   gameStore.ironCities[opp.name][idx]) {
            delete gameStore.ironCities[opp.name][idx]
            protectLog.push(`${opp.name}的${oppCity.name}铁城状态被移除`)
            hasProtection = true
          }

          // 如果没有保护，则摧毁
          if (!hasProtection) {
            citiesToRemove.push({ idx, name: oppCity.name })
          }
        }
      })

      // 从后往前删除城市
      for (let i = citiesToRemove.length - 1; i >= 0; i--) {
        const { idx, name } = citiesToRemove[i]
        opp.cities.splice(idx, 1)
        destroyLog.push(`${opp.name}的${name}`)
        totalDestroyed++

        // 清理相关状态
        if (gameStore.mutualWatch && gameStore.mutualWatch[opp.name]) {
          delete gameStore.mutualWatch[opp.name][idx]
        }
        if (gameStore.changeFlagMark && gameStore.changeFlagMark[opp.name]) {
          delete gameStore.changeFlagMark[opp.name][idx]
        }

        // 调整 centerIndex
        if (opp.centerIndex !== undefined && idx < opp.centerIndex) {
          opp.centerIndex--
        }

        // 调整 roster
        if (gameStore.roster && gameStore.roster[opp.name]) {
          gameStore.roster[opp.name] = gameStore.roster[opp.name]
            .filter(rIdx => rIdx !== idx)
            .map(rIdx => rIdx > idx ? rIdx - 1 : rIdx)
        }
      }
    })

    // 日志记录
    if (protectLog.length > 0) {
      protectLog.forEach(log => addSkillEffectLog(gameStore, log))

    }

    if (destroyLog.length > 0) {
      // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了大义灭亲（${myProv}）',
      `${caster.name}使用了大义灭亲（${myProv}），摧毁了：${destroyLog.join('、')}`,
      `${caster.name}使用了了大义灭亲（${myProv}）`
    )
    } else {
      // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了大义灭亲（${myProv}）',
      `${caster.name}使用了大义灭亲（${myProv}），但没有摧毁任何城市`,
      `${caster.name}使用了了大义灭亲（${myProv}）`
    )
    }

    return {
      success: true,
      message: `摧毁了${totalDestroyed}个同省对手城市`,
      data: {
        province: myProv,
        destroyed: destroyLog,
        protected: protectLog
      }
    }
  }

  /**
   * 强制迁都·普通 - 选定一个对手，直接淘汰对方中心城市，对方自己选定新的中心城市
   */
  function executeQiangZhiQianDuPutong(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    const mode = gameStore.gameMode || '2P'
    if (mode !== '2P' && mode !== '2v2') {
      return {
        success: false,
        message: '该技能仅限2P/2v2模式使用！'
      }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '强制迁都·普通')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '强制迁都·普通',
        `${caster.name}使用强制迁都·普通，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了强制迁都·普通`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('强制迁都·普通', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    const centerIdx = target.centerIndex ?? 0
    const centerCity = target.cities[centerIdx]

    if (!centerCity) {
      return { success: false, message: '对方没有中心城市' }
    }

    // 淘汰中心城市
    centerCity.isAlive = false
    centerCity.currentHp = 0

    // 添加到deadCities列表
    if (!gameStore.deadCities[target.name]) {
      gameStore.deadCities[target.name] = []
    }
    if (!gameStore.deadCities[target.name].includes(centerIdx)) {
      gameStore.deadCities[target.name].push(centerIdx)
    }

    // 设置需要选择新中心的标记
    if (!gameStore.playerStates[target.name]) {
      gameStore.playerStates[target.name] = {}
    }
    gameStore.playerStates[target.name].needsNewCenter = true
    gameStore.playerStates[target.name].newCenterReason = '强制迁都·普通'

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了强制迁都·普通',
      `${caster.name}对${target.name}使用了强制迁都·普通，${centerCity.name}被淘汰，${target.name}需要选择新的中心城市`,
      `${caster.name}使用了了强制迁都·普通`
    )

    return {
      success: true,
      message: `成功淘汰${target.name}的中心城市${centerCity.name}，对方需要选择新的中心城市`,
      data: {
        destroyedCenter: centerCity.name,
        targetPlayer: target.name
      }
    }
  }

  /**
   * 强制迁都·高级版 - 选择对手的一个已知城市作为新中心，旧中心直接阵亡
   */
  function executeQiangZhiQianDuGaoji(caster, target, newCenterCity) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    if (!newCenterCity) {
      return { success: false, message: '未选择新中心城市' }
    }

    const mode = gameStore.gameMode || '2P'
    if (mode !== '2P' && mode !== '2v2') {
      return {
        success: false,
        message: '该技能仅限2P/2v2模式使用！'
      }
    }

    const newCenterIdx = target.cities.indexOf(newCenterCity)
    if (newCenterIdx === -1) {
      return { success: false, message: '目标城市不存在' }
    }

    if (newCenterCity.currentHp <= 0 || newCenterCity.isAlive === false) {
      return { success: false, message: '目标城市已阵亡' }
    }

    // 检查城市是否已知
    if (!gameStore.knownCities || !gameStore.knownCities[caster.name] ||
        !gameStore.knownCities[caster.name][target.name] ||
        !gameStore.knownCities[caster.name][target.name].includes(newCenterIdx)) {
      return { success: false, message: '该城市尚未已知，无法指定为新中心' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '强制迁都·高级版')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '强制迁都·高级版',
        `${caster.name}使用强制迁都·高级版，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了强制迁都·高级版`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('强制迁都·高级版', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    const oldCenterIdx = target.centerIndex ?? 0
    const oldCenterCity = target.cities[oldCenterIdx]

    // 淘汰旧中心城市
    if (oldCenterCity) {
      oldCenterCity.isAlive = false
      oldCenterCity.currentHp = 0
      oldCenterCity.isCenter = false

      // 添加到deadCities列表
      if (!gameStore.deadCities[target.name]) {
        gameStore.deadCities[target.name] = []
      }
      if (!gameStore.deadCities[target.name].includes(oldCenterIdx)) {
        gameStore.deadCities[target.name].push(oldCenterIdx)
      }
    }

    // 设置新中心城市
    newCenterCity.isCenter = true
    target.centerIndex = newCenterIdx

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了强制迁都·高级',
      `${caster.name}对${target.name}使用了强制迁都·高级，${oldCenterCity?.name}被淘汰，${newCenterCity.name}成为新的中心城市`,
      `${caster.name}使用了了强制迁都·高级`
    )

    return {
      success: true,
      message: `成功将${newCenterCity.name}设为${target.name}的新中心城市，旧中心${oldCenterCity?.name}已阵亡`,
      data: {
        oldCenter: oldCenterCity?.name,
        newCenter: newCenterCity.name,
        targetPlayer: target.name
      }
    }
  }

  /**
   * 夷为平地 - 直接摧毁对方钢铁城市；若为中心城市则强制迁都；若为副中心则撤销并HP变20%
   */
  function executeYiWeiPingDi(caster, target, targetCity) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    const targetCityIdx = target.cities.indexOf(targetCity)
    if (targetCityIdx === -1) {
      return { success: false, message: '目标城市不存在' }
    }

    if (targetCity.currentHp <= 0 || targetCity.isAlive === false) {
      return { success: false, message: '目标城市已阵亡' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '夷为平地')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '夷为平地',
        `${caster.name}使用夷为平地，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了夷为平地`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('夷为平地', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    const mode = gameStore.gameMode || '2P'
    const isCenterCity = (mode === '2P' || mode === '2v2') && targetCityIdx === (target.centerIndex ?? 0)

    // 检查是否为钢铁城市
    const isIronCity = gameStore.ironCities &&
                       gameStore.ironCities[target.name] &&
                       gameStore.ironCities[target.name][targetCityIdx]

    if (isIronCity) {
      // 摧毁钢铁城市
      delete gameStore.ironCities[target.name][targetCityIdx]

      if (isCenterCity) {
        // 中心城市：强制迁都
        targetCity.isAlive = false
        targetCity.currentHp = 0
        targetCity.isCenter = false

        // 添加到deadCities列表
        if (!gameStore.deadCities[target.name]) {
          gameStore.deadCities[target.name] = []
        }
        if (!gameStore.deadCities[target.name].includes(targetCityIdx)) {
          gameStore.deadCities[target.name].push(targetCityIdx)
        }

        // 设置需要选择新中心的标记
        if (!gameStore.playerStates[target.name]) {
          gameStore.playerStates[target.name] = {}
        }
        gameStore.playerStates[target.name].needsNewCenter = true
        gameStore.playerStates[target.name].newCenterReason = '夷为平地'

        // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了夷为平地',
      `${caster.name}对${target.name}使用了夷为平地，摧毁了钢铁中心城市${targetCity.name}，${target.name}需要选择新的中心城市`,
      `${caster.name}使用了了夷为平地`
    )

        return {
          success: true,
          message: `成功摧毁钢铁中心城市${targetCity.name}，对方需要选择新的中心城市`,
          data: {
            destroyedCity: targetCity.name,
            wasCenter: true
          }
        }
      } else {
        // 检查是否为副中心
        const isViceCenter = gameStore.viceCenters &&
                            gameStore.viceCenters[target.name] &&
                            gameStore.viceCenters[target.name].includes(targetCityIdx)

        if (isViceCenter) {
          // 副中心：撤销副中心资格并HP变20%
          gameStore.viceCenters[target.name] = gameStore.viceCenters[target.name]
            .filter(idx => idx !== targetCityIdx)

          const currentHp = targetCity.currentHp || targetCity.hp
          targetCity.currentHp = Math.floor(currentHp * 0.2)

          // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了夷为平地',
      `${caster.name}对${target.name}使用了夷为平地，摧毁了钢铁副中心${targetCity.name}，HP降至${Math.floor(targetCity.currentHp)}`,
      `${caster.name}使用了了夷为平地`
    )

          return {
            success: true,
            message: `成功撤销${targetCity.name}的副中心资格并将其HP降至20%`,
            data: {
              cityName: targetCity.name,
              wasViceCenter: true,
              newHp: targetCity.currentHp
            }
          }
        } else {
          // 普通钢铁城市：直接摧毁
          targetCity.isAlive = false
          targetCity.currentHp = 0

          // 添加到deadCities列表
          if (!gameStore.deadCities[target.name]) {
            gameStore.deadCities[target.name] = []
          }
          if (!gameStore.deadCities[target.name].includes(targetCityIdx)) {
            gameStore.deadCities[target.name].push(targetCityIdx)
          }

          // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了夷为平地',
      `${caster.name}对${target.name}使用了夷为平地，摧毁了钢铁城市${targetCity.name}`,
      `${caster.name}使用了了夷为平地`
    )

          return {
            success: true,
            message: `成功摧毁钢铁城市${targetCity.name}`,
            data: {
              destroyedCity: targetCity.name,
              wasIronCity: true
            }
          }
        }
      }
    } else {
      return {
        success: false,
        message: `${targetCity.name}不是钢铁城市，无法使用夷为平地`
      }
    }
  }

  /**
   * 行政中心 - 将己方所有直辖市、特别行政区、省会、首府、计划单列市HP×3
   */
  function executeXingZhengZhongXin(caster) {
    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('行政中心', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    const adminCitiesToBoost = []

    caster.cities.forEach((city, idx) => {
      if (!city || city.currentHp <= 0 || city.isAlive === false) return

      // 检查是否为直辖市、特别行政区、省会、首府、计划单列市
      const isSpecialCity = gameStore.isCapitalCity(city.name) ||
                           gameStore.isPlanCity(city.name) ||
                           gameStore.isMunicipality(city.name) ||
                           gameStore.isSpecialAdministrativeRegion(city.name)

      if (isSpecialCity) {
        const beforeHp = city.hp
        city.hp = city.hp * 3

        // 应用HP上限
        const currentHp = city.currentHp || city.hp
        if (currentHp > city.hp) {
          city.currentHp = city.hp
        }

        // 同步更新initialCities中的HP
        if (gameStore.initialCities[caster.name] &&
            gameStore.initialCities[caster.name][idx]) {
          gameStore.initialCities[caster.name][idx].hp = city.hp
        }

        adminCitiesToBoost.push({
          name: city.name,
          before: Math.floor(beforeHp),
          after: Math.floor(city.hp)
        })
      }
    })

    if (adminCitiesToBoost.length === 0) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '行政中心',
        `${caster.name}使用了行政中心，但没有符合条件的城市`,
        `${caster.name}使用了行政中心`
      )
      return {
        success: true,
        message: '没有符合条件的城市（需要直辖市、特别行政区、省会、首府或计划单列市）'
      }
    }

    const summary = adminCitiesToBoost.map(c =>
      `${c.name}(${c.before}→${c.after})`
    ).join('、')

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '行政中心',
      `${caster.name}使用了行政中心，提升了${adminCitiesToBoost.length}座城市：${summary}`,
      `${caster.name}使用了行政中心`
    )

    return {
      success: true,
      message: `成功提升${adminCitiesToBoost.length}座特殊城市的HP（×3）`,
      data: {
        boosted: adminCitiesToBoost
      }
    }
  }

  /**
   * 代行省权 - 临时指定己方一个非省会城市为省会
   */
  function executeDaiXingShengQuan(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    const cityIdx = caster.cities.indexOf(selfCity)
    if (cityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    if (selfCity.currentHp <= 0 || selfCity.isAlive === false) {
      return { success: false, message: '该城市已阵亡' }
    }

    // 获取城市省份
    const prov = selfCity.province || gameStore.getProvinceName(selfCity.name)

    if (!prov) {
      return { success: false, message: '无法确定城市所属省份' }
    }

    // 检查是否已经是省会
    const isCapital = selfCity.isCapitalCity || gameStore.isCapitalCity(selfCity.name, prov)

    if (isCapital) {
      return { success: false, message: '该城市已经是省会城市，无需代行省权' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('代行省权', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化actingCapital结构
    if (!gameStore.actingCapital) {
      gameStore.actingCapital = {}
    }
    if (!gameStore.actingCapital[caster.name]) {
      gameStore.actingCapital[caster.name] = {}
    }

    // 设置临时省会状态
    gameStore.actingCapital[caster.name][cityIdx] = {
      province: prov,
      cityName: selfCity.name
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '代行省权',
      `${caster.name}对${selfCity.name}使用了代行省权，该城市临时成为${prov}的省会`,
      `${caster.name}使用了代行省权`
    )

    return {
      success: true,
      message: `${selfCity.name}临时成为${prov}的省会`,
      data: {
        cityName: selfCity.name,
        province: prov
      }
    }
  }

  /**
   * 副中心制 - 设置一座城市为副中心，攻击力×1.5，自动成为永久钢铁城市
   */
  function executeFuZhongXinZhi(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    const cityIdx = caster.cities.indexOf(selfCity)
    if (cityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    if (selfCity.currentHp <= 0 || selfCity.isAlive === false) {
      return { success: false, message: '该城市已阵亡' }
    }

    // 检查是否已经是副中心
    if (gameStore.subCenters &&
        gameStore.subCenters[caster.name] === cityIdx) {
      return {
        success: false,
        message: '该城市已经是副中心城市'
      }
    }

    // 检查是否已有其他副中心
    if (gameStore.subCenters &&
        gameStore.subCenters[caster.name] !== undefined) {
      const oldIdx = gameStore.subCenters[caster.name]
      const oldCity = caster.cities[oldIdx]
      return {
        success: false,
        message: `${oldCity?.name}已经是副中心，一个玩家只能有一个副中心城市`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('副中心制', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 初始化subCenters结构
    if (!gameStore.subCenters) {
      gameStore.subCenters = {}
    }

    // 设置副中心
    gameStore.subCenters[caster.name] = cityIdx

    // 自动设为永久钢铁城市（2层）
    if (!gameStore.ironCities) {
      gameStore.ironCities = {}
    }
    if (!gameStore.ironCities[caster.name]) {
      gameStore.ironCities[caster.name] = {}
    }
    gameStore.ironCities[caster.name][cityIdx] = 2  // ✅ 修复：设置为2层，而非true

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '副中心制',
      `${caster.name}对${selfCity.name}使用了副中心制，该城市成为副中心并获得钢铁城市状态（2层），攻击力×1.5`,
      `${caster.name}使用了副中心制`
    )

    return {
      success: true,
      message: `${selfCity.name}成为副中心，攻击力×1.5，并自动成为钢铁城市（2层免疫）`,
      data: {
        cityName: selfCity.name,
        cityIdx: cityIdx
      }
    }
  }

  /**
   * 计划单列 - 随机从厦门、大连、青岛、宁波、深圳的HP中抽取，提升所有城市HP
   * 将己方所有城市中HP小于等于X的提升至X
   */
  function executeJiHuaDanLie(caster) {
    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('计划单列', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 定义计划单列市池（按原版权重）
    const pool = [
      { name: '厦门', hp: 8589, weight: 33 },
      { name: '大连', hp: 9517, weight: 30 },
      { name: '青岛', hp: 16719, weight: 20 },
      { name: '宁波', hp: 18148, weight: 15 },
      { name: '深圳', hp: 36802, weight: 2 }
    ]

    // 加权随机选择
    const sumWeight = pool.reduce((s, x) => s + x.weight, 0)
    let r = Math.random() * sumWeight
    let pick = pool[0]

    for (const item of pool) {
      if (r < item.weight) {
        pick = item
        break
      }
      r -= item.weight
    }

    let hpChanged = 0
    const affectedCities = []

    // 对所有城市进行处理
    caster.cities.forEach((city, ci) => {
      if (!city || city.currentHp <= 0 || city.isAlive === false) return

      const beforeHp = city.hp

      // 提升HP到抽到城市的HP（小于等于X的提升至X）
      if (city.hp <= pick.hp) {
        city.hp = pick.hp

        // 应用HP上限
        const currentHp = city.currentHp || city.hp
        if (currentHp > city.hp) {
          city.currentHp = city.hp
        }

        // 同步更新initialCities
        if (gameStore.initialCities[caster.name] &&
            gameStore.initialCities[caster.name][ci]) {
          gameStore.initialCities[caster.name][ci].hp = city.hp
        }

        hpChanged++
        affectedCities.push({
          name: city.name,
          beforeHp: Math.floor(beforeHp),
          afterHp: Math.floor(city.hp)
        })
      }
    })

    const summary = affectedCities.map(c =>
      `${c.name}(${c.beforeHp}→${c.afterHp})`
    ).join('、')

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '计划单列',
      `${caster.name}使用了计划单列，抽到${pick.name}(${pick.hp})，提升了${hpChanged}个城市HP。${summary}`,
      `${caster.name}使用了计划单列`
    )

    return {
      success: true,
      message: `抽到${pick.name}(${pick.hp})，提升${hpChanged}个城市HP`,
      data: {
        selectedCity: pick.name,
        selectedHp: pick.hp,
        hpChanged: hpChanged,
        affected: affectedCities
      }
    }
  }

  /**
   * 步步高升 - 给予城市特殊状态，免疫特定技能，阵亡后可召唤同省更高HP城市（最多3次）
   */
  function executeBuBuGaoSheng(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    const cityIdx = caster.cities.indexOf(selfCity)
    if (cityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    if (selfCity.currentHp <= 0 || selfCity.isAlive === false) {
      return { success: false, message: '该城市已阵亡' }
    }

    const mode = gameStore.gameMode || '2P'
    const is2pOr2v2 = (mode === '2P' || mode === '2v2')

    // 检查是否为中心城市
    if (is2pOr2v2 && cityIdx === (caster.centerIndex ?? 0)) {
      return { success: false, message: '不能对中心城市使用步步高升' }
    }

    // 获取城市省份（考虑拔旗易帜）
    let prov
    if (gameStore.changeFlagMark &&
        gameStore.changeFlagMark[caster.name] &&
        gameStore.changeFlagMark[caster.name][cityIdx]) {
      prov = gameStore.changeFlagMark[caster.name][cityIdx].newProvince
    } else {
      prov = selfCity.province || gameStore.getProvinceName(selfCity.name)
    }

    // 检查是否为直辖市/特别行政区
    if (prov === '直辖市和特区' ||
        prov === '北京市' || prov === '上海市' || prov === '天津市' || prov === '重庆市' ||
        prov === '香港特别行政区' || prov === '澳门特别行政区') {
      return {
        success: false,
        message: '不能对直辖市和特别行政区的城市使用步步高升'
      }
    }

    // 检查是否已有步步高升状态
    if (gameStore.bbgs &&
        gameStore.bbgs[caster.name] &&
        gameStore.bbgs[caster.name][cityIdx]) {
      return {
        success: false,
        message: '该城市已有步步高升状态'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('步步高升', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取城市的原始HP（从城市池中查找）
    const originalCityData = gameStore.getCityByName(selfCity.name)
    const originalHp = originalCityData ? originalCityData.hp : (selfCity.baseHp || selfCity.hp)

    // 初始化bbgs结构
    if (!gameStore.bbgs) {
      gameStore.bbgs = {}
    }
    if (!gameStore.bbgs[caster.name]) {
      gameStore.bbgs[caster.name] = {}
    }

    // 设置步步高升状态
    gameStore.bbgs[caster.name][cityIdx] = {
      count: 0,
      maxCount: 3,
      originalHp: originalHp
    }

    // 加入谨慎交换集合
    if (!gameStore.cautiousSet) {
      gameStore.cautiousSet = {}
    }
    if (!gameStore.cautiousSet[caster.name]) {
      gameStore.cautiousSet[caster.name] = []
    }
    if (!gameStore.cautiousSet[caster.name].includes(cityIdx)) {
      gameStore.cautiousSet[caster.name].push(cityIdx)
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了步步高升',
      `${caster.name}对${selfCity.name}使用了步步高升，该城市免疫特定技能，阵亡后可召唤同省更高HP城市（最多3次）`,
      `${caster.name}使用了了步步高升`
    )

    return {
      success: true,
      message: `${selfCity.name}获得步步高升状态，免疫四面楚歌、趁其不备等技能，阵亡后可复活3次`,
      data: {
        cityName: selfCity.name,
        province: prov,
        originalHp: originalHp
      }
    }
  }

  /**
   * 生于紫室 - 给予城市2倍攻击力，成为未知城市，中心阵亡时自动继任，每回合+10%HP
   */
  function executeShengYuZiShi(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    const cityIdx = caster.cities.indexOf(selfCity)
    if (cityIdx === -1) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    if (selfCity.currentHp <= 0 || selfCity.isAlive === false) {
      return { success: false, message: '该城市已阵亡' }
    }

    const mode = gameStore.gameMode || '2P'
    const is2pOr2v2 = (mode === '2P' || mode === '2v2')
    const centerIndex = is2pOr2v2 ? (caster.centerIndex ?? 0) : -1

    // 不能对中心城市使用
    if (is2pOr2v2 && cityIdx === centerIndex) {
      return { success: false, message: '不能对中心城市使用生于紫室' }
    }

    // 初始化purpleChamber结构
    if (!gameStore.purpleChamber) {
      gameStore.purpleChamber = {}
    }

    const oldChamberIdx = gameStore.purpleChamber[caster.name]
    const hasOldChamber = oldChamberIdx !== undefined

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('生于紫室', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    if (hasOldChamber) {
      // 已有加成城市，执行转移逻辑
      const oldCity = caster.cities[oldChamberIdx]
      const newCity = selfCity
      const centerCity = caster.cities[centerIndex]

      const oldCityHp = oldCity ? (oldCity.currentHp || oldCity.hp) : 0
      const newCityHp = newCity.currentHp || newCity.hp
      const centerHp = centerCity ? (centerCity.currentHp || centerCity.hp) : 0

      // 转移判定：中心>旧城市>新城市
      if (centerHp > oldCityHp && oldCityHp > newCityHp) {
        // 条件满足，执行转移
        gameStore.purpleChamber[caster.name] = cityIdx

        // 清除旧城市的未知状态
        if (gameStore.knownCities) {
          for (const oppName in gameStore.knownCities) {
            if (gameStore.knownCities[oppName][caster.name]) {
              if (!gameStore.knownCities[oppName][caster.name].includes(oldChamberIdx)) {
                gameStore.knownCities[oppName][caster.name].push(oldChamberIdx)
              }
            }
          }
        }

        // 设置新城市为未知
        gameStore.clearCityKnownStatus(caster.name, cityIdx)

        addSkillEffectLog(gameStore, `${caster.name}将生于紫室加成从${oldCity?.name}转移到${newCity.name}（转移条件：中心${Math.floor(centerHp)}>旧${Math.floor(oldCityHp)}>新${Math.floor(newCityHp)}）`)

        return {
          success: true,
          message: `成功将生于紫室加成从${oldCity?.name}转移到${newCity.name}`,
          data: {
            transferred: true,
            oldCity: oldCity?.name,
            newCity: newCity.name
          }
        }
      } else {
        // 条件不满足
        return {
          success: false,
          message: `转移条件不满足：需要中心HP(${Math.floor(centerHp)})>旧城市HP(${Math.floor(oldCityHp)})>新城市HP(${Math.floor(newCityHp)})`
        }
      }
    } else {
      // 首次使用，直接赋予加成
      gameStore.purpleChamber[caster.name] = cityIdx

      // 设置为未知城市
      gameStore.clearCityKnownStatus(caster.name, cityIdx)

      // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了生于紫室',
      `${caster.name}对${selfCity.name}使用了生于紫室，该城市获得2倍攻击力，成为未知城市，每回合HP+10%，中心阵亡时自动继任`,
      `${caster.name}使用了了生于紫室`
    )

      return {
        success: true,
        message: `${selfCity.name}获得生于紫室加成：2倍攻击力，成为未知城市，每回合HP+10%，中心阵亡时自动继任`,
        data: {
          transferred: false,
          cityName: selfCity.name,
          cityIdx: cityIdx
        }
      }
    }
  }

  /**
   * 强制搬运 - 对手已知城市使用搬运救兵·普通，并强制下回合出战这三座城市
   */
  function executeQiangZhiBanYun(caster, target, targetCity) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    const targetCityIdx = target.cities.indexOf(targetCity)
    if (targetCityIdx === -1) {
      return { success: false, message: '目标城市不存在' }
    }

    if (targetCity.currentHp <= 0 || targetCity.isAlive === false) {
      return { success: false, message: '目标城市已阵亡' }
    }

    // 检查城市是否已知
    if (!gameStore.knownCities || !gameStore.knownCities[caster.name] ||
        !gameStore.knownCities[caster.name][target.name] ||
        !gameStore.knownCities[caster.name][target.name].includes(targetCityIdx)) {
      return { success: false, message: '该城市尚未已知，无法使用强制搬运' }
    }

    // 获取有效省份（考虑拔旗易帜）
    let provinceName
    if (gameStore.changeFlagMark &&
        gameStore.changeFlagMark[target.name] &&
        gameStore.changeFlagMark[target.name][targetCityIdx]) {
      provinceName = gameStore.changeFlagMark[target.name][targetCityIdx].newProvince
    } else {
      provinceName = targetCity.province || gameStore.getProvinceName(targetCity.name)
    }

    if (!provinceName) {
      return { success: false, message: `未找到${targetCity.name}所属省份` }
    }

    if (provinceName === '直辖市和特区' || provinceName === '北京市' || provinceName === '上海市' ||
        provinceName === '天津市' || provinceName === '重庆市' || provinceName === '香港特别行政区' ||
        provinceName === '澳门特别行政区') {
      return {
        success: false,
        message: '不能对直辖市和特区的城市使用强制搬运'
      }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '强制搬运')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '强制搬运',
        `${caster.name}使用强制搬运，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了强制搬运`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('强制搬运', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取所有已使用的城市名
    const usedNames = new Set()
    gameStore.players.forEach(player => {
      player.cities.forEach(city => {
        if (city && city.name) {
          usedNames.add(city.name)
        }
      })
    })

    // 从未使用城市池中筛选同省且可用的城市
    const unusedCities = gameStore.getUnusedCities()
    const availableCities = unusedCities.filter(c => {
      const cityProvince = gameStore.getProvinceOfCity(c.name)
      return cityProvince && cityProvince.name === provinceName && !usedNames.has(c.name)
    })

    if (availableCities.length < 2) {
      return {
        success: false,
        message: `${provinceName}可用城市不足（需要2个，剩余${availableCities.length}个）`
      }
    }

    // 随机抽取2个城市
    const shuffled = [...availableCities].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, 2)

    // 添加城市到对手
    const newCityIndices = []
    const pickedNames = []

    picked.forEach(cityData => {
      const newCity = {
        name: cityData.name,
        hp: cityData.hp,
        currentHp: cityData.hp,
        baseHp: cityData.hp,
        isAlive: true,
        red: cityData.red || 0,
        green: cityData.green || 0,
        blue: cityData.blue || 0,
        yellow: cityData.yellow || 0,
        modifiers: []
      }

      target.cities.push(newCity)
      newCityIndices.push(target.cities.length - 1)
      pickedNames.push(newCity.name)

      // 标记为已使用
      gameStore.markCityAsUsed(cityData.name)
    })

    // 记录到initialCities
    if (!gameStore.initialCities[target.name]) {
      gameStore.initialCities[target.name] = []
    }
    picked.forEach(cityData => {
      gameStore.initialCities[target.name].push({ name: cityData.name, hp: cityData.hp })
    })

    // 设置强制出战标记
    if (!gameStore.playerStates[target.name]) {
      gameStore.playerStates[target.name] = {}
    }
    gameStore.playerStates[target.name].forcedDeployment = {
      cities: [targetCityIdx, ...newCityIndices], // 原城市 + 2个新城市
      reason: '强制搬运'
    }

    // 禁用对方部分技能3回合
    if (!gameStore.forcedSoldierBan) {
      gameStore.forcedSoldierBan = {}
    }
    gameStore.forcedSoldierBan[target.name] = {
      roundsLeft: 3,
      bannedSkills: ['搬运救兵·普通', '搬运救兵·高级']
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了强制搬运',
      `${caster.name}对${target.name}使用了强制搬运，为其招募了${pickedNames.join('、')}，强制下回合出战${targetCity.name}和新城市`,
      `${caster.name}使用了了强制搬运`
    )

    return {
      success: true,
      message: `成功为${target.name}招募2个${provinceName}城市：${pickedNames.join('、')}，并强制下回合出战`,
      data: {
        province: provinceName,
        originalCity: targetCity.name,
        newCities: pickedNames
      }
    }
  }

  /**
   * 自相残杀 - 对手两座城市互相攻击
   * 随机抽取对手两个非中心城市相互攻击
   */
  function executeZiXiangCanSha(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查对手城市数量（至少需要3个城市才能选出2个非中心城市）
    const aliveCitiesCount = target.cities.filter(c => c && c.isAlive !== false).length
    if (aliveCitiesCount < 3) {
      return {
        success: false,
        message: `对手城市数量不足（需要至少3个存活城市）`
      }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '自相残杀')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '自相残杀',
        `${caster.name}使用自相残杀，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了自相残杀`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('自相残杀', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 获取所有非中心城市（排除钢铁城市和被保护城市）
    const eligibleCities = []
    target.cities.forEach((city, idx) => {
      // 排除不存在、已阵亡、中心城市
      if (!city || (city.currentHp || city.hp) <= 0 || city.isAlive === false) return
      if (city.isCenter) return

      // 检查钢铁城市
      if (gameStore.ironCities && gameStore.ironCities[target.name] &&
          gameStore.ironCities[target.name].includes(idx)) {
        return
      }

      // 检查保护
      if (gameStore.protections && gameStore.protections[target.name] &&
          gameStore.protections[target.name][idx] > 0) {
        return
      }

      eligibleCities.push(idx)
    })

    // 检查是否有至少2个可用城市
    if (eligibleCities.length < 2) {
      return {
        success: false,
        message: `可用的非中心城市不足（需要至少2个）`
      }
    }

    // 随机选择两个不同的城市
    const firstIdx = eligibleCities[Math.floor(Math.random() * eligibleCities.length)]
    const remainingCities = eligibleCities.filter(idx => idx !== firstIdx)
    const secondIdx = remainingCities[Math.floor(Math.random() * remainingCities.length)]

    const firstCity = target.cities[firstIdx]
    const secondCity = target.cities[secondIdx]

    const firstHp = firstCity.currentHp || firstCity.hp
    const secondHp = secondCity.currentHp || secondCity.hp

    // 互相攻击：HP低的阵亡，HP高的扣除阵亡城市的HP
    if (firstHp < secondHp) {
      // 第一个城市阵亡
      firstCity.isAlive = false
      firstCity.currentHp = 0

      // 第二个城市扣除HP
      secondCity.currentHp = secondHp - firstHp

      // 添加到阵亡列表
      if (!gameStore.deadCities[target.name]) {
        gameStore.deadCities[target.name] = []
      }
      if (!gameStore.deadCities[target.name].includes(firstIdx)) {
        gameStore.deadCities[target.name].push(firstIdx)
      }

      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '自相残杀',
        `${caster.name}对${target.name}使用了自相残杀，${firstCity.name}（${Math.floor(firstHp)}）与${secondCity.name}（${Math.floor(secondHp)}）互相攻击，${firstCity.name}阵亡，${secondCity.name}剩余${Math.floor(secondCity.currentHp)}HP`,
        `${caster.name}使用了自相残杀`
      )
    } else if (firstHp > secondHp) {
      // 第二个城市阵亡
      secondCity.isAlive = false
      secondCity.currentHp = 0

      // 第一个城市扣除HP
      firstCity.currentHp = firstHp - secondHp

      // 添加到阵亡列表
      if (!gameStore.deadCities[target.name]) {
        gameStore.deadCities[target.name] = []
      }
      if (!gameStore.deadCities[target.name].includes(secondIdx)) {
        gameStore.deadCities[target.name].push(secondIdx)
      }

      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '自相残杀',
        `${caster.name}对${target.name}使用了自相残杀，${firstCity.name}（${Math.floor(firstHp)}）与${secondCity.name}（${Math.floor(secondHp)}）互相攻击，${secondCity.name}阵亡，${firstCity.name}剩余${Math.floor(firstCity.currentHp)}HP`,
        `${caster.name}使用了自相残杀`
      )
    } else {
      // HP相等，同归于尽
      firstCity.isAlive = false
      firstCity.currentHp = 0
      secondCity.isAlive = false
      secondCity.currentHp = 0

      // 添加到阵亡列表
      if (!gameStore.deadCities[target.name]) {
        gameStore.deadCities[target.name] = []
      }
      if (!gameStore.deadCities[target.name].includes(firstIdx)) {
        gameStore.deadCities[target.name].push(firstIdx)
      }
      if (!gameStore.deadCities[target.name].includes(secondIdx)) {
        gameStore.deadCities[target.name].push(secondIdx)
      }

      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '自相残杀',
        `${caster.name}对${target.name}使用了自相残杀，${firstCity.name}与${secondCity.name}HP相等（${Math.floor(firstHp)}），同归于尽`,
        `${caster.name}使用了自相残杀`
      )
    }

    return {
      success: true,
      message: `自相残杀生效！${firstCity.name}与${secondCity.name}互相攻击`
    }
  }

  /**
   * 城市侦探 - 查看对手一座已知城市的详细信息
   */
  function executeCityDetective(caster, target, targetCityIdx) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    if (targetCityIdx === undefined) {
      return { success: false, message: '未选择目标城市' }
    }

    const targetCity = target.cities[targetCityIdx]
    if (!targetCity) {
      return { success: false, message: '目标城市不存在' }
    }

    // 检查城市是否已知
    if (!gameStore.knownCities || !gameStore.knownCities[caster.name] ||
        !gameStore.knownCities[caster.name][target.name] ||
        !gameStore.knownCities[caster.name][target.name].includes(targetCityIdx)) {
      return { success: false, message: '该城市尚未已知，无法使用城市侦探' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('城市侦探', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '城市侦探')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '城市侦探',
        `${caster.name}使用城市侦探，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了城市侦探`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 创建快照（用于无懈可击拦截）
    gameStore.createGameStateSnapshot()

    // 获取初始HP
    const initialCityData = gameStore.initialCities &&
                            gameStore.initialCities[target.name] &&
                            gameStore.initialCities[target.name][targetCityIdx]
    const originalHp = initialCityData ? initialCityData.hp : (targetCity.baseHp || targetCity.hp)

    const currentHp = targetCity.currentHp || targetCity.hp

    // 构建城市信息
    const cityInfo = {
      name: targetCity.name,
      originalHp: Math.floor(originalHp),
      currentHp: Math.floor(currentHp),
      red: targetCity.red || 0,
      green: targetCity.green || 0,
      blue: targetCity.blue || 0,
      yellow: targetCity.yellow || 0
    }

    const infoText = `城市名：${cityInfo.name}\nHP原始值：${cityInfo.originalHp}\n当前HP：${cityInfo.currentHp}\n红色技能：Lv${cityInfo.red}\n绿色技能：Lv${cityInfo.green}\n蓝色技能：Lv${cityInfo.blue}\n黄色技能：Lv${cityInfo.yellow}`

    // 记录私有日志（只有施法者能看到）
    if (gameStore.addPrivateLog) {
      gameStore.addPrivateLog(caster.name, `你对${target.name}使用了城市侦探，查看了${cityInfo.name}的信息：\n${infoText}`)
    }

    // 记录公开日志
    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '城市侦探',
      `${caster.name}对${target.name}使用了城市侦探`,
      `${caster.name}使用了城市侦探`
    )

    // 记录技能使用追踪（用于冷却和次数限制）
    gameStore.recordSkillUsage(caster.name, '城市侦探')

    // 记录技能使用（用于无懈可击拦截）
    gameStore.lastSkillUsed = {
      userName: caster.name,
      skillName: '城市侦探',
      cost: 1,
      roundNumber: gameStore.currentRound,
      timestamp: Date.now()
    }

    return {
      success: true,
      message: `城市侦探：\n\n${infoText}`,
      data: {
        cityInfo: cityInfo
      }
    }
  }

  /**
   * 城市预言 - 探测对方所有城市，将所有城市变成己方的已知城市（生于紫室城市除外）
   */
  function executeCityProphecy(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('城市预言', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '城市预言')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '城市预言',
        `${caster.name}使用城市预言，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了城市预言`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 创建快照（用于无懈可击拦截）
    gameStore.createGameStateSnapshot()

    // 统计探测到的城市
    let detectedCount = 0
    let purpleChamberSkipped = 0
    const detectedCityNames = []

    // 遍历对手所有城市
    target.cities.forEach((city, cityIdx) => {
      if (!city || city.isAlive === false || city.currentHp <= 0) {
        // 跳过已阵亡的城市
        return
      }

      // 检查是否是生于紫室城市
      if (gameStore.purpleChamber && gameStore.purpleChamber[target.name] === cityIdx) {
        purpleChamberSkipped++
        return
      }

      // 标记为已知城市
      gameStore.setCityKnown(target.name, cityIdx, caster.name)
      detectedCount++
      detectedCityNames.push(city.name)
    })

    // 记录私有日志（仅施放者可见）
    if (gameStore.addPrivateLog && detectedCount > 0) {
      let privateMsg = `你对${target.name}使用了城市预言，探测到${detectedCount}座城市：${detectedCityNames.join('、')}`
      if (purpleChamberSkipped > 0) {
        privateMsg += `（有${purpleChamberSkipped}座生于紫室城市未被探测）`
      }
      gameStore.addPrivateLog(caster.name, privateMsg)
    }

    // 记录公开日志
    let publicMessage = `${caster.name}对${target.name}使用了城市预言`
    if (purpleChamberSkipped > 0) {
      publicMessage += `，使${detectedCount}座城市成为己方已知城市（${purpleChamberSkipped}座生于紫室城市未被探测）`
    } else {
      publicMessage += `，使${detectedCount}座城市成为己方已知城市`
    }

    addSkillUsageLog(
      gameStore,
      caster.name,
      '城市预言',
      publicMessage,
      `${caster.name}使用了城市预言`
    )

    // 记录技能使用追踪（用于次数限制）
    gameStore.recordSkillUsage(caster.name, '城市预言')

    return {
      success: true,
      message: `成功探测${target.name}的${detectedCount}座城市${purpleChamberSkipped > 0 ? `（${purpleChamberSkipped}座生于紫室城市未被探测）` : ''}`,
      data: {
        detectedCount: detectedCount,
        purpleChamberSkipped: purpleChamberSkipped
      }
    }
  }

  /**
   * 一举两得 - 强制对手本回合必须派出2个城市，无法使用按兵不动
   */
  function executeYiJuLiangDe(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查对手存活城市数
    const oppAliveCities = target.cities.filter(c => c && (c.currentHp || c.hp) > 0)
    if (oppAliveCities.length < 2) {
      return {
        success: false,
        message: `${target.name}存活城市不足2个，无法使用一举两得`
      }
    }

    // 检查双方卡牌数量都≥3
    const myAliveCities = caster.cities.filter(c => c && (c.currentHp || c.hp) > 0)
    if (myAliveCities.length < 3 || oppAliveCities.length < 3) {
      return {
        success: false,
        message: `一举两得需要双方卡牌数量都≥3！当前你有${myAliveCities.length}个，对方有${oppAliveCities.length}个`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('一举两得', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '一举两得')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '一举两得',
        `${caster.name}使用一举两得，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了一举两得`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 创建快照（用于无懈可击拦截）
    gameStore.createGameStateSnapshot()

    // 设置强制出战2个城市的标记（仅本回合有效）
    if (!gameStore.forceDeployTwo) {
      gameStore.forceDeployTwo = {}
    }
    gameStore.forceDeployTwo[target.name] = {
      active: true,
      round: gameStore.currentRound
    }

    // 一举两得禁用按兵不动（仅本回合有效）
    if (!gameStore.cannotStandDown) {
      gameStore.cannotStandDown = {}
    }
    gameStore.cannotStandDown[target.name] = {
      active: true,
      round: gameStore.currentRound
    }

    // 记录私有日志
    if (gameStore.addPrivateLog) {
      gameStore.addPrivateLog(caster.name, `你对${target.name}使用了一举两得，对方本回合必须派出2个城市，无法使用按兵不动`)
    }

    // 记录公开日志
    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '一举两得',
      `${caster.name}对${target.name}使用了一举两得`,
      `${caster.name}使用了一举两得`
    )

    // 记录技能使用（用于无懈可击拦截）
    gameStore.lastSkillUsed = {
      userName: caster.name,
      skillName: '一举两得',
      cost: 3,
      roundNumber: gameStore.currentRound,
      timestamp: Date.now()
    }

    return {
      success: true,
      message: `成功使用一举两得！${target.name}本回合必须派出2个城市`
    }
  }

  /**
   * 明察秋毫 - 查看对手本回合的出战部署
   */
  function executeMingChaQiuHao(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('明察秋毫', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '明察秋毫')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '明察秋毫',
        `${caster.name}使用明察秋毫，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了明察秋毫`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 创建快照（用于无懈可击拦截）
    gameStore.createGameStateSnapshot()

    // 获取对手的当前部署
    const oppState = gameStore.playerStates[target.name]
    if (!oppState || !oppState.currentBattleCities || oppState.currentBattleCities.length === 0) {
      // 对方未部署，返还金币
      caster.gold += 3
      return {
        success: false,
        message: `${target.name}还未部署城市！金币已返还`
      }
    }

    // 构建部署信息
    const deploymentInfo = []
    oppState.currentBattleCities.forEach(card => {
      const city = target.cities[card.cityIdx]
      if (!city) return

      const colors = []
      if (card.red > 0) colors.push(`红${card.red}`)
      if (card.green > 0) colors.push(`绿${card.green}`)
      if (card.blue > 0) colors.push(`蓝${card.blue}`)
      if (card.yellow > 0) colors.push(`黄${card.yellow}`)
      const colorStr = colors.length > 0 ? `（${colors.join('、')}）` : ''

      deploymentInfo.push({
        name: city.name,
        hp: Math.floor(city.currentHp || city.hp),
        colors: colorStr
      })

      // 标记为已知城市
      gameStore.setCityKnown(target.name, card.cityIdx, caster.name)
    })

    const infoText = deploymentInfo.map(info =>
      `${info.name}（HP:${info.hp}）${info.colors}`
    ).join('\n')

    // 记录私有日志
    if (gameStore.addPrivateLog) {
      gameStore.addPrivateLog(caster.name, `你对${target.name}使用了明察秋毫，查看到对方部署：\n${infoText}`)
    }

    // 记录公开日志
    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '明察秋毫',
      `${caster.name}对${target.name}使用了明察秋毫`,
      `${caster.name}使用了明察秋毫`
    )

    // 记录技能使用追踪（用于冷却和次数限制）
    gameStore.recordSkillUsage(caster.name, '明察秋毫')

    return {
      success: true,
      message: `明察秋毫：\n\n${target.name}的部署：\n${infoText}`,
      data: {
        deploymentInfo: deploymentInfo
      }
    }
  }

  /**
   * 四面楚歌 - 归顺同省非特殊城市，特殊城市HP减半
   * 对手所有与己方存活城市同省的非中心城市归顺
   * 省会/首府/计划单列市/直辖市/特区HP减半
   *
   * @param {Object} caster - 施法者
   * @param {Object} target - 目标对手
   * @returns {Object} { success, message, data }
   */
  function executeSiMianChuGe(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '四面楚歌')) {
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '四面楚歌',
        `${caster.name}使用四面楚歌，但被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了四面楚歌`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('四面楚歌', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 创建快照
    gameStore.createGameStateSnapshot()

    // 省会城市列表
    const CAPITAL_CITIES = [
      '石家庄', '太原', '呼和浩特', '沈阳', '长春', '哈尔滨',
      '南京', '杭州', '合肥', '福州', '南昌', '济南', '郑州',
      '武汉', '长沙', '广州', '南宁', '海口', '成都', '贵阳',
      '昆明', '拉萨', '西安', '兰州', '西宁', '银川', '乌鲁木齐'
    ]

    // 计划单列市
    const PLAN_CITIES = ['大连', '青岛', '深圳', '厦门', '宁波']

    // 直辖市
    const MUNICIPALITIES = ['北京', '上海', '天津', '重庆']

    // 获取有效城市名称（考虑狐假虎威伪装）
    const getEffectiveName = (playerName, cityIdx) => {
      const disguise = gameStore.disguisedCities &&
                      gameStore.disguisedCities[playerName] &&
                      gameStore.disguisedCities[playerName][cityIdx]
      if (disguise && disguise.roundsLeft > 0) {
        return disguise.disguiseAsName || gameStore.players.find(p => p.name === playerName).cities[cityIdx].name
      }
      const player = gameStore.players.find(p => p.name === playerName)
      return player.cities[cityIdx].name
    }

    // 判断是否为特殊城市
    const isCapitalCity = (cityName) => {
      const cleanName = cityName.replace(/(市|县|区)$/g, '')
      return CAPITAL_CITIES.some(cap => cleanName.includes(cap) || cap.includes(cleanName))
    }

    const isPlanCity = (cityName) => {
      const cleanName = cityName.replace(/(市|县|区)$/g, '')
      return PLAN_CITIES.some(plan => cleanName.includes(plan) || plan.includes(cleanName))
    }

    const isMunicipality = (cityName) => {
      const cleanName = cityName.replace(/(市|县|区)$/g, '')
      return MUNICIPALITIES.some(mun => cleanName.includes(mun) || mun.includes(cleanName))
    }

    const isSpecialAdministrativeRegion = (cityName) => {
      return cityName.includes('香港') || cityName.includes('澳门')
    }

    // 获取城市所属省份（考虑拔旗易帜）
    const getCityProvince = (playerName, cityIdx, cityName) => {
      // 检查拔旗易帜标记
      if (gameStore.changeFlagMark &&
          gameStore.changeFlagMark[playerName] &&
          gameStore.changeFlagMark[playerName][cityIdx]) {
        return gameStore.changeFlagMark[playerName][cityIdx].newProvince
      }

      // 直辖市和特区使用城市名本身作为省份
      if (isMunicipality(cityName) || isSpecialAdministrativeRegion(cityName)) {
        const cleanName = cityName.replace(/(市|县|区)$/g, '')
        if (MUNICIPALITIES.includes(cleanName)) {
          return cleanName + '市'
        }
        if (cityName.includes('香港')) return '香港特别行政区'
        if (cityName.includes('澳门')) return '澳门特别行政区'
      }

      // 使用gameStore的省份映射（假设已存在）
      if (gameStore.getProvinceName) {
        return gameStore.getProvinceName(cityName)
      }

      // 简化处理：返回null表示无法确定省份
      return null
    }

    // 获取己方所有存活城市的省份集合
    const myProvinces = new Set()
    caster.cities.forEach((city, ci) => {
      if (city && (city.currentHp || city.hp) > 0) {
        const effectiveName = getEffectiveName(caster.name, ci)
        const prov = getCityProvince(caster.name, ci, effectiveName)
        if (prov) {
          myProvinces.add(prov)
        }
      }
    })

    if (myProvinces.size === 0) {
      // 返还金币
      caster.gold += 23
      // 双日志
      addSkillUsageLog(
        gameStore,
        caster.name,
        '四面楚歌',
        `${caster.name}使用四面楚歌，但没有可用的省份！金币已返还`,
        `${caster.name}使用了四面楚歌`
      )
      return {
        success: false,
        message: '你没有可用的城市！金币已返还'
      }
    }

    // 确定是否有中心城市概念（仅2P和2v2）
    const gameMode = gameStore.gameMode || '2P'
    const hasCenterCity = (gameMode === '2P' || gameMode === '2v2')
    const oppCenterIndex = hasCenterCity ? (target.centerIndex ?? 0) : -1

    const transferredCities = []
    const halvedCities = []
    const exposedFoxCities = []

    // 第一阶段：对手所有非中心的特殊城市HP全部减半
    for (let ci = 0; ci < target.cities.length; ci++) {
      const city = target.cities[ci]
      if (!city || (city.currentHp || city.hp) <= 0) continue
      if (hasCenterCity && ci === oppCenterIndex) continue

      const effectiveName = getEffectiveName(target.name, ci)
      const isSpecial = isCapitalCity(effectiveName) ||
                       isPlanCity(effectiveName) ||
                       isMunicipality(effectiveName) ||
                       isSpecialAdministrativeRegion(effectiveName)

      if (isSpecial) {
        // 检查保护罩
        if (gameStore.consumeProtection(target.name, ci)) {
          continue // 保护罩破裂，跳过该城市
        }

        const disguise = gameStore.disguisedCities &&
                        gameStore.disguisedCities[target.name] &&
                        gameStore.disguisedCities[target.name][ci]

        const currentHp = city.currentHp || city.hp
        if (disguise && disguise.roundsLeft > 0) {
          // 伪装城市：真实HP和伪装HP都减半
          const beforeReal = currentHp
          const beforeFox = disguise.disguiseAsHp || currentHp
          city.currentHp = Math.floor(currentHp / 2)
          if (disguise.disguiseAsHp !== undefined) {
            disguise.disguiseAsHp = Math.floor(disguise.disguiseAsHp / 2)
          }
          halvedCities.push({
            name: effectiveName,
            before: Math.floor(beforeFox),
            after: Math.floor(disguise.disguiseAsHp || city.currentHp)
          })
        } else {
          // 普通城市：只有真实HP
          const before = currentHp
          city.currentHp = Math.floor(currentHp / 2)
          halvedCities.push({
            name: effectiveName,
            before: Math.floor(before),
            after: Math.floor(city.currentHp)
          })
        }
      }
    }

    // 第二阶段：检查与己方同省的城市，非特殊城市归顺
    const citiesToRemove = []
    for (let ci = 0; ci < target.cities.length; ci++) {
      const city = target.cities[ci]
      if (!city || (city.currentHp || city.hp) <= 0) continue
      if (hasCenterCity && ci === oppCenterIndex) continue

      const effectiveName = getEffectiveName(target.name, ci)
      const isSpecial = isCapitalCity(effectiveName) ||
                       isPlanCity(effectiveName) ||
                       isMunicipality(effectiveName) ||
                       isSpecialAdministrativeRegion(effectiveName)

      // 特殊城市已经在第一阶段处理过了，跳过
      if (isSpecial) continue

      // 获取省份（考虑拔旗易帜）
      const prov = getCityProvince(target.name, ci, effectiveName)

      // 只有与己方同省的城市才归顺
      if (!prov || !myProvinces.has(prov)) continue

      // 检查是否有步步高升状态（免疫四面楚歌）
      if (gameStore.bbgs &&
          gameStore.bbgs[target.name] &&
          gameStore.bbgs[target.name][ci]) {
        addSkillEffectLog(gameStore, `${target.name}的${effectiveName}有步步高升状态，免疫四面楚歌`)
        continue
      }

      // 检查是否是伪装城市
      const disguise = gameStore.disguisedCities &&
                      gameStore.disguisedCities[target.name] &&
                      gameStore.disguisedCities[target.name][ci]

      if (disguise && disguise.roundsLeft > 0) {
        // 伪装城市：自毁并识破
        const currentHp = city.currentHp || city.hp
        city.currentHp = 0
        city.isAlive = false
        disguise.roundsLeft = 0
        exposedFoxCities.push({
          name: `${disguise.disguiseAsName}（实为${city.name}，狐假虎威被识破并自毁）`
        })
      } else {
        // 普通城市：正常归顺
        transferredCities.push({
          cityObj: JSON.parse(JSON.stringify(city)),
          originalIndex: ci
        })
        citiesToRemove.push(ci)
      }
    }

    // 保存被转移城市的initialCities数据（在删除之前）
    const transferredInitialCities = []
    for (const item of transferredCities) {
      let initialCity = null
      if (gameStore.initialCities && gameStore.initialCities[target.name]) {
        initialCity = gameStore.initialCities[target.name][item.originalIndex]
      }
      transferredInitialCities.push(initialCity || { name: item.cityObj.name, hp: item.cityObj.hp })
    }

    // 从对手那里移除归顺的城市（从后往前删除避免索引问题）
    let removedBeforeCenter = 0
    for (let i = citiesToRemove.length - 1; i >= 0; i--) {
      const ci = citiesToRemove[i]

      // 检查是否影响中心城市索引
      if (hasCenterCity && ci < oppCenterIndex) {
        removedBeforeCenter++
      }

      target.cities.splice(ci, 1)

      // 同步移除对手的initialCities数据
      if (gameStore.initialCities && gameStore.initialCities[target.name]) {
        gameStore.initialCities[target.name].splice(ci, 1)
      }

      // 移除相关状态
      if (gameStore.disguisedCities && gameStore.disguisedCities[target.name]) {
        delete gameStore.disguisedCities[target.name][ci]
      }
      if (gameStore.protectedCities && gameStore.protectedCities[target.name]) {
        delete gameStore.protectedCities[target.name][ci]
      }
      if (gameStore.ironCities && gameStore.ironCities[target.name]) {
        delete gameStore.ironCities[target.name][ci]
      }
    }

    // 调整中心城市索引
    if (hasCenterCity && removedBeforeCenter > 0) {
      target.centerIndex = Math.max(0, oppCenterIndex - removedBeforeCenter)
    }

    // 添加到己方
    for (let idx = 0; idx < transferredCities.length; idx++) {
      const item = transferredCities[idx]
      const city = item.cityObj
      const newIdx = caster.cities.length
      caster.cities.push(city)

      // 同步添加到己方的initialCities
      if (gameStore.initialCities) {
        if (!gameStore.initialCities[caster.name]) {
          gameStore.initialCities[caster.name] = []
        }
        gameStore.initialCities[caster.name].push(transferredInitialCities[idx])
      }

      // 标记归顺的城市为已知
      gameStore.setCityKnown(caster.name, newIdx, target.name)
    }

    // 构建日志消息
    let logMsg = `你对${target.name}使用了四面楚歌`
    if (transferredCities.length > 0) {
      const names = transferredCities.map(x => x.cityObj.name).join('、')
      logMsg += `，归顺城市：${names}`
    }

    if (halvedCities.length > 0) {
      const details = halvedCities.map(x => `${x.name}(${x.before}->${x.after})`).join('、')
      logMsg += `${transferredCities.length > 0 ? '；' : '，'}HP减半：${details}`
    }

    if (exposedFoxCities.length > 0) {
      const details = exposedFoxCities.map(x => x.name).join('、')
      logMsg += `${transferredCities.length > 0 || halvedCities.length > 0 ? '；' : '，'}${details}`
    }

    if (transferredCities.length === 0 && halvedCities.length === 0 && exposedFoxCities.length === 0) {
      logMsg += `，但没有符合条件的城市`
    }

    gameStore.addPrivateLog(caster.name, logMsg)
    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '了四面楚歌',
      `${caster.name}对${target.name}使用了四面楚歌`,
      `${caster.name}使用了了四面楚歌`
    )

    // 记录技能使用
    gameStore.lastSkillUsed = {
      userName: caster.name,
      skillName: '四面楚歌',
      cost: 23,
      roundNumber: gameStore.currentRound,
      timestamp: Date.now()
    }

    gameStore.recordSkillUsage(caster.name, '四面楚歌')

    return {
      success: true,
      message: `四面楚歌！${transferredCities.length > 0 ? `归顺${transferredCities.length}座城市` : ''}${halvedCities.length > 0 ? ` 减半${halvedCities.length}座特殊城市` : ''}`,
      data: {
        transferredCities: transferredCities.map(x => x.cityObj.name),
        halvedCities: halvedCities,
        exposedFoxCities: exposedFoxCities
      }
    }
  }

  /**
   * 博学多才 - 答题增加HP
   * 选择己方1座原始HP≥25000的城市，回答3道该城市相关知识的单选题
   * 根据答对数量增加HP：0题x1, 1题x1.25, 2题x1.5, 3题x2
   *
   * @param {Object} caster - 施法者
   * @param {Number} cityIdx - 城市索引
   * @param {Number} correctCount - 答对题目数量 (0-3)
   * @returns {Object} { success, message, data }
   */
  function executeBoXueDuoCai(caster, cityIdx, correctCount = 0) {
    if (cityIdx === undefined) {
      return { success: false, message: '未选择城市' }
    }

    const selfCity = caster.cities[cityIdx]
    if (!selfCity) {
      return { success: false, message: '目标城市不存在' }
    }

    // 获取原始HP
    const initialCityData = gameStore.initialCities &&
                            gameStore.initialCities[caster.name] &&
                            gameStore.initialCities[caster.name][cityIdx]
    const originalHp = initialCityData ? initialCityData.hp : (selfCity.baseHp || selfCity.hp)

    // 检查原始HP是否≥25000
    if (originalHp < 25000) {
      return {
        success: false,
        message: `博学多才仅限原始HP≥25000的城市使用。${selfCity.name}原始HP为${Math.floor(originalHp)}`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('博学多才', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 创建快照
    gameStore.createGameStateSnapshot()

    // 验证答对数量
    if (typeof correctCount !== 'number' || correctCount < 0 || correctCount > 3) {
      correctCount = 0
    }

    // 计算HP倍数：0题x1, 1题x1.25, 2题x1.5, 3题x2
    const hpMultipliers = [1, 1.25, 1.5, 2]
    const multiplier = hpMultipliers[correctCount]

    // 应用HP倍数
    const currentHp = selfCity.currentHp || selfCity.hp
    const oldHp = currentHp
    selfCity.currentHp = Math.floor(currentHp * multiplier)

    // 应用HP上限（如果gameStore有上限功能）
    if (gameStore.applyPlayerHpCap) {
      gameStore.applyPlayerHpCap(caster.name, cityIdx, selfCity)
    }

    const hpGain = selfCity.currentHp - oldHp

    // 获取显示名称（处理狐假虎威伪装）
    let displayCityName = selfCity.name
    if (gameStore.disguisedCities &&
        gameStore.disguisedCities[caster.name] &&
        gameStore.disguisedCities[caster.name][cityIdx]) {
      const disguise = gameStore.disguisedCities[caster.name][cityIdx]
      if (disguise.roundsLeft > 0) {
        displayCityName = disguise.disguiseAsName || selfCity.name
      }
    }

    // 添加日志
    const resultSummary = `答对${correctCount}题，HP×${multiplier}（${Math.floor(oldHp)} → ${selfCity.currentHp}，+${hpGain}）`

    if (gameStore.addPrivateLog) {
      gameStore.addPrivateLog(caster.name, `你对${displayCityName}使用了博学多才：${resultSummary}`)
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '博学多才',
      `${caster.name}使用了博学多才`,
      `${caster.name}使用了博学多才`
    )

    // 记录技能使用
    gameStore.lastSkillUsed = {
      userName: caster.name,
      skillName: '博学多才',
      cost: 6,
      roundNumber: gameStore.currentRound,
      timestamp: Date.now()
    }

    gameStore.recordSkillUsage(caster.name, '博学多才')

    return {
      success: true,
      message: `博学多才：${resultSummary}`,
      data: {
        cityName: displayCityName,
        correctCount: correctCount,
        multiplier: multiplier,
        oldHp: oldHp,
        newHp: selfCity.currentHp,
        hpGain: hpGain
      }
    }
  }

  // 导出所有非战斗技能（完整版）
  return {
    executeTransferGold,
    executeWuZhiWuWei,
    executeKuaiSuZhiLiao,
    executeCityProtection,
    executeGangTieChengShi,
    executeShiLiZengQiang,
    executeJieShiHuanHun,
    executeShiQiDaZhen,
    executeQingChuJiaCheng,
    executeShiLaiYunZhuan,
    executeXianShengDuoRen,
    acceptPreemptiveStrike,      // 先声夺人：接受交换请求
    rejectPreemptiveStrike,      // 先声夺人：拒绝交换请求
    executeJinBiDaiKuan,
    executeDingHaiShenZhen,
    executeHuanRanYiXin,
    executeGouYanCanChuan,
    executeGaoJiZhiLiao,
    executeZhongZhiChengCheng,
    executeWuZhongShengYou,
    executeHaoGaoWuYuan,
    executeHuJiaHuWei,
    executePaoZhuanYinYu,
    executeJinZhiNiuQu,
    executeYiLuoQianZhang,
    executeLianXuDaJi,
    executeBoTaoXiongYong,
    executeKuangHongLanZha,
    executeHengSaoYiKong,
    executeWanJianQiFa,
    executeJiangWeiDaJi,
    executeShenCangBuLu,
    executeDingShiBaoPo,
    executeYongJiuCuiHui,
    executeZhanLueZhuanYi,
    executeGaiXianGengZhang,
    executeLianSuoFanYing,
    executeZhaoXianNaShi,
    executeWuXieKeJi,
    executeJianBuKeCui,
    executeYiHuaJieMu,
    executeBuLuZongJi,
    executeZhengQiHuaYi,
    executeRenZhiJiaoHuan,
    executeFuDiChouXin,
    // 新增技能 (2024-12-28)
    executeJinRongWeiJi,
    executeJieFuJiPin,
    executeChengShiShiLian,      // 城市试炼 (4金币)
    executeTianZaiRenHuo,
    executeLiDaiTaoJiang,
    executeBiErBuJian,
    executeYiChuJiFa,
    executeJiNengBaoHu,
    executeTuPoPingJing,
    // 第三批新增 (2024-12-28)
    executeXueLiangCunChu,
    executeHaiShiShenLou,
    executeJieChuFengSuo,
    executeShuWeiFanZhuan,
    executeChunBuNanXing,
    executeGuoHeChaiQiao,
    executeDianCiGanYing,
    // 第四批新增 - 状态控制类 (2024-12-28)
    executeHouJiBaoFa,
    executeZhongYongZhiDao,
    executeDangJiLiDuan,
    executeZiXiangCanSha,
    executeYanTingJiCong,
    executeShiBanGongBei,
    executeDaoFanTianGang,
    // 第五批新增 - 城市操作类 (2024-12-28)
    executeBanyunJiubingPutong,
    executeBanyunJiubingGaoji,
    executeChenqibubeiSuiji,
    executeChenqibubeiZhiding,
    // 第六批新增 - 城市操作类（续） (2024-12-28)
    executeBaQiYiZhi,
    executeShouWangXiangZhu,
    executeYiLiLaiJiang,
    executeDaYiMieQin,
    executeQiangZhiQianDuPutong,
    executeQiangZhiQianDuGaoji,
    executeYiWeiPingDi,
    executeQiangZhiBanYun,
    // 第七批新增 - 省会相关技能 (2024-12-28)
    executeXingZhengZhongXin,
    executeDaiXingShengQuan,
    executeFuZhongXinZhi,
    executeJiHuaDanLie,
    executeBuBuGaoSheng,
    executeShengYuZiShi,
    // 第八批新增 - 侦查类技能 (2024-12-28)
    executeCityDetective,
    executeCityProphecy,
    executeYiJuLiangDe,
    executeMingChaQiuHao,
    // 第九批新增 - 最高级技能 (2024-12-28)
    executeSiMianChuGe,
    executeBoXueDuoCai
  }
}

