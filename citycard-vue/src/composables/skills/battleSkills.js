/**
 * 战斗金币技能实现
 * Battle Gold Skills
 *
 * 包含所有战斗阶段使用的金币技能
 * - 这些技能主要在战斗中生效
 * - 包含战斗modifier、伤害、防御等效果
 */

import { useGameStore } from '../../stores/gameStore'
import { checkAndDeductGold } from '../../constants/skillCosts'
import { addSkillUsageLog, addSkillEffectLog } from '../game/logUtils'

/**
 * 获取城市对象的辅助函数
 * player.cities 是以城市名为键的对象
 */
function getCityByName(player, cityName) {
  return player.cities[cityName]
}

export function useBattleSkills() {
  const gameStore = useGameStore()

  /**
   * 擒贼擒王 - 优先攻击血量最高的城市
   */
  function executeQinZeiQinWang(caster, target) {
    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('擒贼擒王', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    if (!caster.battleModifiers) caster.battleModifiers = []

    caster.battleModifiers.push({
      type: 'attack_priority',
      value: 'highest_hp',
      duration: 1
    })

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '擒贼擒王',
      `${caster.name}使用了擒贼擒王，本轮将优先攻击血量最高的城市`,
      `${caster.name}使用了擒贼擒王`
    )

    return {
      success: true,
      message: '本轮战斗将优先攻击血量最高的城市'
    }
  }

  /**
   * 草木皆兵 - 对手伤害减半
   */
  function executeCaoMuJieBing(caster, target) {
    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('草木皆兵', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    if (!target.battleModifiers) target.battleModifiers = []

    target.battleModifiers.push({
      type: 'damage_reduction',
      value: 0.5,
      duration: 1,
      source: caster.name
    })

    // 记录草木皆兵状态，用于检查目标是否出牌
    if (!gameStore.cmjb) gameStore.cmjb = {}
    gameStore.cmjb[caster.name] = {
      target: target.name,
      mode: gameStore.gameMode
    }

    // 仅私密日志（公开日志在battle2P中战斗计算时输出，避免提前暴露）
    gameStore.addPrivateLog(caster.name, `${caster.name}对 ${target.name} 使用了草木皆兵`)

    return {
      success: true,
      message: `对 ${target.name} 造成的伤害本轮减半，若不出牌可抢走1金币`,
      targetName: target.name,  // 传递目标信息
      hidePublicLog: true  // 战斗技能效果在battle2P中公开，此处不公开
    }
  }

  /**
   * 越战越勇 - 疲劳城市战力不减半
   */
  function executeYueZhanYueYong(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // 获取城市名称
    const cityName = selfCity.name
    if (!caster.cities[cityName]) {
      return { success: false, message: '城市不存在' }
    }

    if (!caster.streaks) caster.streaks = {}
    const streak = caster.streaks[cityName] || 0

    if (streak === 0) {
      return {
        success: false,
        message: `${selfCity.name} 上一轮未出战，无法使用越战越勇`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('越战越勇', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    selfCity.modifiers = selfCity.modifiers || []
    selfCity.modifiers.push({
      type: 'ignore_fatigue',
      duration: 1
    })

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '越战越勇',
      `${caster.name}使用了越战越勇，${selfCity.name} 获得越战越勇效果，本轮战斗力不减半`,
      `${caster.name}对 ${selfCity.name} 使用了越战越勇`
    )

    return {
      success: true,
      message: `${selfCity.name} 本轮战斗力不受疲劳影响`
    }
  }

  /**
   * 吸引攻击 - 城市吸引所有伤害
   */
  function executeXiYinGongJi(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('吸引攻击', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    selfCity.modifiers = selfCity.modifiers || []
    selfCity.modifiers.push({
      type: 'attract_damage',
      duration: 1
    })

    // 仅私密日志（公开日志在battle2P中战斗计算时输出，避免提前暴露）
    gameStore.addPrivateLog(caster.name, `${caster.name}对 ${selfCity.name} 使用了吸引攻击`)

    return {
      success: true,
      message: `${selfCity.name} 将吸引对手本轮全部伤害`,
      hidePublicLog: true  // 战斗技能效果在battle2P中公开，此处不公开
    }
  }

  /**
   * 铜墙铁壁 - 对手伤害完全无效
   */
  function executeTongQiangTieBi(caster, target) {
    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '铜墙铁壁')) {
      // 双日志：被阻挡情况
      addSkillUsageLog(
        gameStore,
        caster.name,
        '铜墙铁壁',
        `${caster.name}使用了铜墙铁壁，铜墙铁壁被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了铜墙铁壁，但被${target.name}的坚不可摧护盾阻挡`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('铜墙铁壁', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // ✅ 修复：应该给caster免疫，而不是target
    if (!caster.battleModifiers) caster.battleModifiers = []

    caster.battleModifiers.push({
      type: 'damage_immunity',
      duration: 1,
      source: caster.name
    })

    // 双日志：成功情况
    addSkillUsageLog(
      gameStore,
      caster.name,
      '铜墙铁壁',
      `${caster.name}使用了铜墙铁壁，铜墙铁壁生效，本轮完全免疫${target.name}的伤害`,
      `${caster.name}使用了铜墙铁壁`
    )

    return {
      success: true,
      message: `本轮对 ${target.name} 的伤害完全无效`
    }
  }

  /**
   * 背水一战 - 攻击力翻倍，但会自毁
   * 若消灭对方城市，则自身也消灭；若未消灭，淘汰前减少所有对方出战城市5000HP
   */
  function executeBeiShuiYiZhan(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('背水一战', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    selfCity.modifiers = selfCity.modifiers || []
    selfCity.modifiers.push({
      type: 'power_multiplier',
      value: 2,
      duration: 1
    })
    selfCity.modifiers.push({
      type: 'suicide_attack',
      duration: 1
    })
    // 新增：若未消灭对方，淘汰前对所有对方出战城市造成5000HP伤害
    selfCity.modifiers.push({
      type: 'desperate_retaliation',  // 背水反击
      damage: 5000,
      duration: 1
    })

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '背水一战',
      `${caster.name}使用了背水一战，${selfCity.name} 获得背水一战效果，攻击力×2，结算特殊`,
      `${caster.name}对 ${selfCity.name} 使用了背水一战`
    )

    return {
      success: true,
      message: `${selfCity.name} 攻击力翻倍，若消灭对方则自毁；若未消灭则反击全体5000HP`
    }
  }

  /**
   * 料事如神 - 先手偷袭（需要战力比较）
   */
  function executeLiaoShiRuShen(caster, target, targetCity) {
    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('料事如神', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 获取双方出战城市
    const casterState = gameStore.playerStates[caster.name]
    const targetState = gameStore.playerStates[target.name]

    const myCards = (casterState.currentBattleCities || [])
    const oppCards = (targetState.currentBattleCities || [])

    if (myCards.length === 0 || oppCards.length === 0) {
      return {
        success: false,
        message: `${caster.name} 或对手本轮未出战，未触发`
      }
    }

    // 计算战斗力（有效HP + 红色加成）
    function calculatePower(player, cityName) {
      const city = player.cities[cityName]
      if (!city) return 0

      // 检查厚积薄发状态：如果城市处于厚积薄发期间，攻击力为1
      if (gameStore.hjbf && gameStore.hjbf[player.name] &&
          gameStore.hjbf[player.name][cityName] &&
          gameStore.hjbf[player.name][cityName].roundsLeft > 0) {
        return 1
      }

      const hp = city.currentHp || city.hp
      // TODO: 添加红色加成计算
      return hp
    }

    // 找出双方最低战力城市
    const myPick = myCards
      .map(card => ({ cityName: card.cityName, power: calculatePower(caster, card.cityName) }))
      .sort((a, b) => a.power - b.power)[0]

    const oppPick = oppCards
      .map(card => ({ cityName: card.cityName, power: calculatePower(target, card.cityName) }))
      .sort((a, b) => a.power - b.power)[0]

    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui && gameStore.isBlockedByJianbukecui(target.name, caster.name, '料事如神')) {
      // 双日志：被阻挡
      addSkillUsageLog(
        gameStore,
        caster.name,
        '料事如神',
        `${caster.name}使用了料事如神，料事如神被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了料事如神，但被${target.name}的坚不可摧护盾阻挡`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    // 只有我方最低战力 < 对手最低战力时才触发
    if (myPick.power >= oppPick.power) {
      return {
        success: false,
        message: `未触发（我方最低战斗力不低于对手最低）`
      }
    }

    // 执行偷袭
    const targetCityObj = target.cities[oppPick.cityName]
    const isCenter = oppPick.cityName === target.centerCityName

    // 检查屏障
    if (gameStore.barrier[target.name]) {
      const barrier = gameStore.barrier[target.name]
      // 先打屏障2500
      const barrierDamage = Math.min(2500, barrier.hp)
      barrier.hp -= barrierDamage
      const spillDamage = 2500 - barrierDamage

      if (barrier.hp <= 0) {
        delete gameStore.barrier[target.name]
        addSkillEffectLog(gameStore, `${target.name}的屏障被摧毁`)
      }

      // 溢出伤害打目标城市
      if (spillDamage > 0) {
        // 检查海市蜃楼拦截（如果目标是中心）
        if (isCenter && gameStore.checkMirageBlock && gameStore.checkMirageBlock(target.name, `${caster.name}的料事如神`)) {
          addSkillEffectLog(gameStore, `${target.name}的海市蜃楼拦截了伤害`)
        } else {
          const currentHp = targetCityObj.currentHp || targetCityObj.hp
          targetCityObj.currentHp = Math.max(0, currentHp - spillDamage)
          if (targetCityObj.currentHp <= 0) {
            targetCityObj.isAlive = false
          }
        }
      }

      // 反弹2500也先打屏障，溢出再打进攻方最低HP城市
      const reflectDamage = Math.min(2500, barrier.hp)
      barrier.hp -= reflectDamage
      const reflectSpill = 2500 - reflectDamage

      if (reflectSpill > 0 && myCards.length > 0) {
        const lowestHpCard = myCards
          .map(card => ({ cityName: card.cityName, hp: caster.cities[card.cityName].currentHp || caster.cities[card.cityName].hp }))
          .sort((a, b) => a.hp - b.hp)[0]

        const reflectCity = caster.cities[lowestHpCard.cityName]
        const currentHp = reflectCity.currentHp || reflectCity.hp
        reflectCity.currentHp = Math.max(0, currentHp - reflectSpill)
        if (reflectCity.currentHp <= 0) {
          reflectCity.isAlive = false
        }
      }

      // 双日志：记录料事如神使用（屏障情况）
      addSkillUsageLog(
        gameStore,
        caster.name,
        '料事如神',
        `${caster.name}使用了料事如神，先手偷袭生效，攻击${target.name}的${targetCityObj.name}（屏障存在，2500打屏障后反弹处理）`,
        `${caster.name}使用了料事如神进行先手偷袭`
      )
    } else {
      // 无屏障，直击5000
      // 检查海市蜃楼拦截（如果目标是中心）
      if (isCenter && gameStore.checkMirageBlock && gameStore.checkMirageBlock(target.name, `${caster.name}的料事如神`)) {
        addSkillEffectLog(gameStore, `${target.name}的海市蜃楼拦截了伤害`)
      } else {
        const currentHp = targetCityObj.currentHp || targetCityObj.hp
        targetCityObj.currentHp = Math.max(0, currentHp - 5000)
        if (targetCityObj.currentHp <= 0) {
          targetCityObj.isAlive = false
        }
      }

      // 双日志：记录料事如神使用（无屏障情况）
      addSkillUsageLog(
        gameStore,
        caster.name,
        '料事如神',
        `${caster.name}使用了料事如神，先手偷袭${target.name}的${targetCityObj.name}，造成5000伤害`,
        `${caster.name}使用了料事如神进行先手偷袭`
      )
    }

    // 进攻方城市撤退
    casterState.currentBattleCities = casterState.currentBattleCities.filter(card => card.cityName !== myPick.cityName)

    return {
      success: true,
      message: `先手偷袭成功，随后撤退`
    }
  }

  /**
   * 同归于尽 - 摧毁效果
   */
  function executeTongGuiYuJin(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('同归于尽', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    selfCity.modifiers = selfCity.modifiers || []
    selfCity.modifiers.push({
      type: 'mutual_destruction',
      duration: 5
    })

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '同归于尽',
      `${caster.name}使用了同归于尽，${selfCity.name} 获得同归于尽效果，阵亡时将摧毁对方出战城市`,
      `${caster.name}对 ${selfCity.name} 使用了同归于尽`
    )

    return {
      success: true,
      message: `${selfCity.name} 获得同归于尽效果，阵亡时摧毁对方出战城市`
    }
  }

  /**
   * 设置屏障 - 25000HP护盾（每玩家独立）
   */
  function executeSetBarrier(caster) {
    // 检查该玩家是否已有屏障存在
    if (gameStore.barrier[caster.name]) {
      return {
        success: false,
        message: `你已经有屏障存在（剩余${gameStore.barrier[caster.name].hp}HP）`
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('设置屏障', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 为该玩家创建屏障
    gameStore.barrier[caster.name] = {
      hp: 25000,
      maxHp: 25000,
      roundsLeft: 5,
      team: caster.team || 0
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '设置屏障',
      `${caster.name}使用了设置屏障，屏障生效（25000HP，持续5回合）`,
      `你设置了屏障`
    )

    return {
      success: true,
      message: '设置了25000HP的屏障，持续5回合'
    }
  }

  /**
   * 潜能激发 - 所有城市HP×2，前3回合溢出伤害的30%攻击对方中心
   */
  function executeQianNengJiFa(caster) {
    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('潜能激发', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    let count = 0
    Object.values(caster.cities).forEach(city => {
      if (city.isAlive !== false) {
        const currentHp = city.currentHp || city.hp
        city.currentHp = Math.min(currentHp * 2, 100000)
        count++
      }
    })

    // 设置溢出伤害效果：前三回合伤害溢出的30%伤害对方中心
    if (!gameStore.qiannengOverflow) {
      gameStore.qiannengOverflow = {}
    }
    gameStore.qiannengOverflow[caster.name] = {
      roundsLeft: 3,
      overflowRate: 0.3  // 30%的溢出伤害转移到对方中心
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '潜能激发',
      `${caster.name}使用了潜能激发，潜能激发生效，${count}个城市HP翻倍，前3回合溢出伤害的30%将伤害对方中心`,
      `${caster.name}使用了潜能激发`
    )

    return {
      success: true,
      message: `所有城市HP翻倍（上限100000），前3回合溢出伤害30%转移至对方中心`
    }
  }

  /**
   * 御驾亲征 - 至少出战两座城市且中心必须出战，直接摧毁对方HP最高的非中心城市
   * 若对方按兵不动则摧毁其HP最高的非中心城市
   */
  function executeYuJiaQinZheng(caster, target) {
    // 检查坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '御驾亲征')) {
      // 双日志：被阻挡
      addSkillUsageLog(
        gameStore,
        caster.name,
        '御驾亲征',
        `${caster.name}使用了御驾亲征，御驾亲征被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了御驾亲征，但被${target.name}的坚不可摧护盾阻挡`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    const centerCity = Object.values(caster.cities).find(c => c.isCenter)

    if (!centerCity) {
      return { success: false, message: '没有中心城市' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('御驾亲征', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 设置御驾亲征标记（在战斗计算中会处理实际效果）
    if (!gameStore.yujia) gameStore.yujia = {}
    gameStore.yujia[caster.name] = {
      target: target.name
    }

    // 双日志：成功
    addSkillUsageLog(
      gameStore,
      caster.name,
      '御驾亲征',
      `${caster.name}使用了御驾亲征，御驾亲征生效，本回合己方至少出战两座城市且中心${centerCity.name}必须出战，出战时直接摧毁对方HP最高的非中心城市`,
      `${caster.name}使用了御驾亲征`
    )

    return {
      success: true,
      message: `本回合己方至少出战两座城市且中心必须出战，直接摧毁对方HP最高的非中心城市，若对方按兵不动则摧毁其HP最高的非中心城市`
    }
  }

  /**
   * 狂暴模式 - 攻击力×5，回合结束血量减半且禁用5轮
   */
  function executeKuangBaoMoShi(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // 己方城市数量大于等于2时使用
    const aliveCityCount = Object.values(caster.cities).filter(c => c && (c.currentHp > 0 || c.hp > 0)).length
    if (aliveCityCount < 2) {
      return { success: false, message: '己方城市数量不足2座，无法使用狂暴模式' }
    }

    // 获取城市名称
    const cityName = selfCity.name
    if (!caster.cities[cityName]) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    // 检查是否已使用过狂暴模式
    if (gameStore.berserkFired[caster.name] && gameStore.berserkFired[caster.name][cityName]) {
      return { success: false, message: '该城市已使用过狂暴模式' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('狂暴模式', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // HP×5：直接提升城市HP，攻击力和防御均基于HP
    const origHp = selfCity.currentHp || selfCity.hp
    selfCity.currentHp = origHp * 5
    if (selfCity.hp) selfCity.hp = selfCity.hp * 5

    // 在gameStore中记录狂暴模式使用
    if (!gameStore.berserkFired[caster.name]) {
      gameStore.berserkFired[caster.name] = {}
    }
    gameStore.berserkFired[caster.name][cityName] = origHp

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '狂暴模式',
      `${caster.name}使用了狂暴模式，${selfCity.name} HP×5（${origHp} -> ${origHp * 5}），回合结束将禁用5轮且血量降为一半`,
      `${caster.name}对 ${selfCity.name} 使用了狂暴模式`
    )

    return {
      success: true,
      message: `${selfCity.name}进入狂暴模式，HP×5`
    }
  }

  /**
   * 按兵不动 - 本轮不出战
   */
  function executeAnBingBuDong(caster) {
    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('按兵不动', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    caster.battleModifiers = caster.battleModifiers || []
    caster.battleModifiers.push({
      type: 'no_deploy',
      duration: 1
    })

    // 仅私密日志（公开日志在battle2P中战斗计算时输出，避免提前暴露）
    gameStore.addPrivateLog(caster.name, `${caster.name}使用了按兵不动`)

    return {
      success: true,
      message: '本轮不出战任何城市',
      hidePublicLog: true  // 战斗技能效果在battle2P中公开，此处不公开
    }
  }

  /**
   * 既来则安 - 新城市第一次出战免疫伤害
   */
  function executeJiLaiZeAn(caster, selfCity) {
    if (!selfCity) {
      return { success: false, message: '未选择城市' }
    }

    // 获取城市名称
    const cityName = selfCity.name
    if (!caster.cities[cityName]) {
      return { success: false, message: '城市不在玩家城市列表中' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('既来则安', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 在gameStore中设置既来则安状态
    if (!gameStore.jilaizan[caster.name]) {
      gameStore.jilaizan[caster.name] = {}
    }
    gameStore.jilaizan[caster.name][cityName] = { used: false }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '既来则安',
      `${caster.name}使用了既来则安，${selfCity.name} 获得既来则安效果，第一次出战免疫伤害`,
      `${caster.name}对 ${selfCity.name} 使用了既来则安`
    )

    return {
      success: true,
      message: `${selfCity.name}第一次出战将免疫伤害`
    }
  }

  /**
   * 反戈一击 - 本轮对手对你的伤害将反弹回其本方出战城市
   */
  function executeFanGeYiJi(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查双方城市数是否≥2
    const casterAliveCities = Object.values(caster.cities).filter(c => c.isAlive !== false)
    const targetAliveCities = Object.values(target.cities).filter(c => c.isAlive !== false)

    if (casterAliveCities.length < 2 || targetAliveCities.length < 2) {
      return {
        success: false,
        message: '双方城市数都需要≥2才能使用反戈一击'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('反戈一击', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 初始化reflect结构
    if (!gameStore.reflect) {
      gameStore.reflect = {}
    }

    // 设置反击标记（本轮生效）
    gameStore.reflect[caster.name] = {
      target: target.name,
      active: true
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '反戈一击',
      `${caster.name}使用了反戈一击，反戈一击生效，${target.name}的伤害将反弹`,
      `${caster.name}对 ${target.name} 使用了反戈一击`
    )

    return {
      success: true,
      message: `本轮${target.name}对你的伤害将反弹回其出战城市（绿色护盾优先吸收）`
    }
  }

  /**
   * 暗度陈仓 - 额外派出一个未出战且存活的城市（仅限3P）
   */
  function executeAnDuChenCang(caster) {
    // 检查游戏模式（仅限3P）
    if (gameStore.gameMode !== '3P') {
      return {
        success: false,
        message: '暗度陈仓仅限3人模式使用！'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('暗度陈仓', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 获取当前roster（预备城市）
    const currentRoster = gameStore.roster[caster.name] || []

    // 获取未出战且存活的城市
    const aliveCities = []
    Object.entries(caster.cities).forEach(([cityName, city]) => {
      if (city.isAlive !== false && !currentRoster.includes(cityName)) {
        aliveCities.push({ city, cityName })
      }
    })

    if (aliveCities.length === 0) {
      return {
        success: false,
        message: '没有未出战且存活的城市！'
      }
    }

    // 随机选择一个未出战的城市（简化处理）
    const randomIdx = Math.floor(Math.random() * aliveCities.length)
    const selected = aliveCities[randomIdx]

    // 将该城市加入roster
    if (!gameStore.roster[caster.name]) {
      gameStore.roster[caster.name] = []
    }
    gameStore.roster[caster.name].push(selected.cityName)

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '暗度陈仓',
      `${caster.name}使用了暗度陈仓，暗度陈仓生效，额外派出${selected.city.name}(HP:${Math.floor(selected.city.currentHp || selected.city.hp)})`,
      '${caster.name}使用了暗度陈仓'
    )

    return {
      success: true,
      message: `额外派出${selected.city.name}(HP:${Math.floor(selected.city.currentHp || selected.city.hp)})`
    }
  }

  /**
   * 声东击西 - 3P模式，如果你对目标的战力<目标对你的战力，则转向打另一名玩家
   */
  function executeShengDongJiXi(caster, target) {
    // 检查游戏模式（仅限3P）
    if (gameStore.gameMode !== '3P') {
      return {
        success: false,
        message: '声东击西仅限3人模式使用！'
      }
    }

    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查对手数量（必须正好2个对手）
    const opponents = gameStore.players.filter(p => p.name !== caster.name)
    if (opponents.length !== 2) {
      return {
        success: false,
        message: '声东击西需要正好2个对手！'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('声东击西', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 设置声东击西标记
    gameStore.sdxj[caster.name] = {
      target: target.name,
      active: true
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '声东击西',
      `${caster.name}使用了声东击西，声东击西生效，对${target.name}战力劣势时将转向攻击另一玩家`,
      `${caster.name}对 ${target.name} 使用了声东击西`
    )

    return {
      success: true,
      message: `对${target.name}使用了声东击西，战力劣势时将转向攻击另一玩家`
    }
  }

  /**
   * 以逸待劳 - 根据对手出战城市数量造成额外伤害(每个+2000)，并抢走对手本轮获得的金币
   */
  function executeYiYiDaiLao(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('以逸待劳', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 记录目标玩家当前金币数，用于计算本轮获得
    gameStore.yiyidl[caster.name] = {
      target: target.name,
      goldMark: target.gold
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '以逸待劳',
      `${caster.name}使用了以逸待劳，以逸待劳生效，对${target.name}根据出战城市数造成额外伤害，并抢走其本轮获得的金币`,
      `${caster.name}对 ${target.name} 使用了以逸待劳`
    )

    return {
      success: true,
      message: `对${target.name}使用了以逸待劳，根据其出战城市数+2000伤害，并抢走其本轮获得的金币`
    }
  }

  /**
   * 草船借箭 - 本轮对手的攻击转为治疗，双方退兵
   */
  function executeCaoChuanJieJian(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('草船借箭', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 设置草船借箭标记
    gameStore.ccjj[caster.name] = {
      active: true
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '草船借箭',
      `${caster.name}使用了草船借箭，草船借箭生效，${target.name}的攻击将转为治疗，双方本轮退兵`,
      `${caster.name}对 ${target.name} 使用了草船借箭`
    )

    return {
      success: true,
      message: `对${target.name}使用了草船借箭，本轮对手的攻击将转为治疗，双方退兵`
    }
  }

  /**
   * 围魏救赵 - 战斗特殊处理，最多使用2次
   */
  function executeWeiWeiJiuZhao(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('围魏救赵', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 设置围魏救赵标记
    gameStore.wwjz[caster.name] = {
      active: true
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '围魏救赵',
      `${caster.name}使用了围魏救赵，围魏救赵生效`,
      `你对${target.name}使用了围魏救赵`
    )

    return {
      success: true,
      message: `对${target.name}使用了围魏救赵`
    }
  }

  /**
   * 欲擒故纵 - 选择对手出战城市，双方退兵，设置陷阱标记
   */
  function executeYuQinGuZong(caster, target, targetCity) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    if (!targetCity) {
      return { success: false, message: '未选择目标城市' }
    }

    // 检查城市是否为出战城市（roster中）
    const targetRoster = gameStore.roster[target.name] || []
    const targetCityKey = targetCity.name

    if (!targetRoster.includes(targetCityKey)) {
      return {
        success: false,
        message: '目标城市不是出战城市'
      }
    }

    // 检查是否为中心城市
    if (targetCity.isCenter) {
      return {
        success: false,
        message: '不能对中心城市使用欲擒故纵'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('欲擒故纵', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 创建陷阱标记
    gameStore.yqgzMarks.push({
      player: caster.name,
      target: target.name,
      cityName: targetCity.name,
      roundCreated: gameStore.currentRound
    })

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '欲擒故纵',
      `${caster.name}使用了欲擒故纵，欲擒故纵生效，对${target.name}的${targetCity.name}设置陷阱，双方本轮退兵`,
      `你对${target.name}的${targetCity.name}使用了欲擒故纵`
    )

    return {
      success: true,
      message: `对${target.name}的${targetCity.name}设置了陷阱，双方本轮退兵`
    }
  }

  /**
   * 晕头转向 - 交换双方出战城市
   */
  function executeYunTouZhuanXiang(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查双方是否有出战城市（roster）
    const casterRoster = gameStore.roster[caster.name] || []
    const targetRoster = gameStore.roster[target.name] || []

    if (casterRoster.length === 0 || targetRoster.length === 0) {
      return {
        success: false,
        message: '双方都需要有出战城市才能使用晕头转向'
      }
    }

    // 筛选可交换的城市（排除中心城市、钢铁城市、定海神针城市）
    function getSwappableCities(player, roster) {
      return roster.filter(cityName => {
        const city = player.cities[cityName]
        // 排除中心城市
        if (city.isCenter) return false
        // 排除钢铁城市
        if (gameStore.hasIronShield(player.name, cityName)) return false
        // 排除定海神针城市
        if (gameStore.anchored[player.name] && gameStore.anchored[player.name][cityName]) return false
        return true
      })
    }

    const casterSwappable = getSwappableCities(caster, casterRoster)
    const targetSwappable = getSwappableCities(target, targetRoster)

    if (casterSwappable.length === 0 || targetSwappable.length === 0) {
      return {
        success: false,
        message: '双方都需要有可交换的出战城市（排除中心、钢铁、定海神针城市）'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('晕头转向', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 设置晕头转向标记
    gameStore.dizzy[caster.name] = {
      mode: 'swap',
      target: target.name
    }

    // 执行交换（随机选择可交换的城市）
    const swappedCities = []
    const minLen = Math.min(casterSwappable.length, targetSwappable.length)

    for (let i = 0; i < minLen; i++) {
      const casterCityName = casterSwappable[i]
      const targetCityName = targetSwappable[i]

      // 交换城市对象
      const temp = caster.cities[casterCityName]
      caster.cities[casterCityName] = target.cities[targetCityName]
      target.cities[targetCityName] = temp

      // 注意：initialCities 现在按城市名称追踪，无需交换
      // 城市的初始HP记录会自动跟随城市名称

      // 交换疲劳计数器（fatigue streaks）
      // 注意：疲劳按城市名称追踪，交换城市时需要交换对应的疲劳值
      if (!caster.streaks) caster.streaks = {}
      if (!target.streaks) target.streaks = {}

      const tempStreak = caster.streaks[casterCityName] || 0
      caster.streaks[casterCityName] = target.streaks[targetCityName] || 0
      target.streaks[targetCityName] = tempStreak

      // 交换拔旗易帜标记（changeFlagMark）
      if (!gameStore.changeFlagMark[caster.name]) gameStore.changeFlagMark[caster.name] = {}
      if (!gameStore.changeFlagMark[target.name]) gameStore.changeFlagMark[target.name] = {}

      const casterMark = gameStore.changeFlagMark[caster.name][casterCityName]
      const targetMark = gameStore.changeFlagMark[target.name][targetCityName]

      if (casterMark || targetMark) {
        if (targetMark) {
          gameStore.changeFlagMark[caster.name][casterCityName] = { ...targetMark }
        } else {
          delete gameStore.changeFlagMark[caster.name][casterCityName]
        }

        if (casterMark) {
          gameStore.changeFlagMark[target.name][targetCityName] = { ...casterMark }
        } else {
          delete gameStore.changeFlagMark[target.name][targetCityName]
        }
      }

      // 清除狐假虎威伪装状态
      if (gameStore.disguisedCities && gameStore.disguisedCities[caster.name] && gameStore.disguisedCities[caster.name][casterCityName]) {
        delete gameStore.disguisedCities[caster.name][casterCityName]
        addSkillEffectLog(gameStore, `${caster.name}的${caster.cities[casterCityName].name}的伪装被识破！`)
      }
      if (gameStore.disguisedCities && gameStore.disguisedCities[target.name] && gameStore.disguisedCities[target.name][targetCityName]) {
        delete gameStore.disguisedCities[target.name][targetCityName]
        addSkillEffectLog(gameStore, `${target.name}的${target.cities[targetCityName].name}的伪装被识破！`)
      }

      swappedCities.push({
        casterCity: target.cities[targetCityName].name,  // 交换后的城市
        targetCity: caster.cities[casterCityName].name
      })
    }

    const swapText = swappedCities.map((pair, i) =>
      `第${i+1}对：${caster.name}的${pair.casterCity} ⇄ ${target.name}的${pair.targetCity}`
    ).join('，')

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '晕头转向',
      `${caster.name}使用了晕头转向，晕头转向生效，交换了出战城市：${swapText}`,
      `你对${target.name}使用了晕头转向`
    )

    return {
      success: true,
      message: `交换了${swappedCities.length}对出战城市`
    }
  }

  /**
   * 隔岸观火 - 3P模式，首次使用者本轮撤兵，其他两方互相攻击
   */
  function executeGeAnGuanHuo(caster, target) {
    // 检查游戏模式（仅限3P）
    if (gameStore.gameMode !== '3P') {
      return {
        success: false,
        message: '隔岸观火仅限3人模式使用！'
      }
    }

    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 检查本轮是否已有人使用隔岸观火
    if (gameStore.gawhUser.value && gameStore.gawhUser.value.round === gameStore.currentRound) {
      return {
        success: false,
        message: `本轮${gameStore.gawhUser.value.player}已使用隔岸观火，你无法再使用！`
      }
    }

    // 记录本轮首个使用者
    gameStore.gawhUser.value = {
      player: caster.name,
      round: gameStore.currentRound
    }

    // 获取所有玩家（3人）
    const allPlayers = gameStore.players
    if (allPlayers.length !== 3) {
      return {
        success: false,
        message: '隔岸观火需要正好3个玩家！'
      }
    }

    // 找到另外两个对手
    const opponents = allPlayers.filter(p => p.name !== caster.name)
    if (opponents.length !== 2) {
      return {
        success: false,
        message: '无法找到另外两个对手！'
      }
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '隔岸观火',
      `隔岸观火生效，${caster.name}本轮撤兵，${opponents[0].name}和${opponents[1].name}互相攻击`,
      `你对${target.name}使用了隔岸观火`
    )

    return {
      success: true,
      message: `你本轮撤兵，${opponents[0].name}和${opponents[1].name}将互相攻击`
    }
  }

  /**
   * 挑拨离间 - 2v2模式，使对手团队内斗
   */
  function executeTiaoBoBaoLiJian(caster, target) {
    // 检查游戏模式（仅限2v2）
    if (gameStore.gameMode !== '2v2') {
      return {
        success: false,
        message: '挑拨离间仅限2v2模式使用！'
      }
    }

    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 获取对手的队友
    const allPlayers = gameStore.players
    const targetTeammates = allPlayers.filter(p =>
      p.name !== caster.name &&
      p.name !== target.name &&
      p.team === target.team
    )

    if (targetTeammates.length === 0) {
      return {
        success: false,
        message: '无法找到对手的队友！'
      }
    }

    const teammate = targetTeammates[0]

    // 检查对手团队是否有坚不可摧护盾
    if (gameStore.isBlockedByJianbukecui(target.name, caster.name, '挑拨离间')) {
      // 双日志：被阻挡
      addSkillUsageLog(
        gameStore,
        caster.name,
        '挑拨离间',
        `${caster.name}使用了挑拨离间，挑拨离间被${target.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了挑拨离间，但被${target.name}的坚不可摧护盾阻挡`
      )
      return {
        success: false,
        message: `被${target.name}的坚不可摧护盾阻挡`
      }
    }

    if (gameStore.isBlockedByJianbukecui(teammate.name, caster.name, '挑拨离间')) {
      // 双日志：被阻挡
      addSkillUsageLog(
        gameStore,
        caster.name,
        '挑拨离间',
        `${caster.name}使用了挑拨离间，挑拨离间被${teammate.name}的坚不可摧护盾阻挡`,
        `${caster.name}使用了挑拨离间，但被${teammate.name}的坚不可摧护盾阻挡`
      )
      return {
        success: false,
        message: `被${teammate.name}的坚不可摧护盾阻挡`
      }
    }

    // 设置挑拨离间标记
    gameStore.tblj[caster.name] = {
      mode: '2v2',
      targetTeam: target.team
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '挑拨离间',
      `挑拨离间生效，${caster.name}的队伍本轮撤兵，${target.name}和${teammate.name}将互相攻击`,
      `你对${target.name}使用了挑拨离间`
    )

    return {
      success: true,
      message: `你的队伍本轮撤兵，${target.name}和${teammate.name}将互相攻击`
    }
  }

  /**
   * 趁火打劫 - 根据本轮造成的伤害抢夺金币
   * 使用后，系统会跟踪本轮对目标造成的总伤害
   * 回合结束时，每1500伤害抢1金币（最多抢10金币）
   *
   * 注意：此函数仅设置技能状态，实际的伤害跟踪和金币转移
   * 需要在战斗系统中实现
   */
  function executeChenHuoDaJie(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('趁火打劫', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 初始化chhdj结构
    if (!gameStore.chhdj) {
      gameStore.chhdj = {}
    }

    // 获取游戏模式
    const gameMode = gameStore.gameMode || '2P'

    // 设置趁火打劫标记
    gameStore.chhdj[caster.name] = {
      mode: gameMode,
      target: target.name,
      damageDealt: 0
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '趁火打劫',
      `${caster.name}使用了趁火打劫，趁火打劫生效，根据本轮造成的伤害抢夺金币（每1500伤害抢1金币，最多10金币）`,
      `你对${target.name}使用了趁火打劫`
    )

    return {
      success: true,
      message: `对${target.name}使用了趁火打劫，本轮造成的伤害将转化为金币`
    }
  }

  /**
   * 玉碎瓦全 - 目标城市攻击力翻倍，出战则消灭，不出战则HP减半
   * 限制：每局最多使用2次
   *
   * 效果：
   * 1. 清除目标城市的保护罩
   * 2. 禁止对该城市使用城市保护
   * 3. 本轮战斗中，目标城市攻击力×2
   * 4. 回合结束后：
   *    - 若该城市本轮出战，则消灭
   *    - 若未出战，则HP减半
   */
  function executeYuSuiWaQuan(caster, target, targetCityName) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    if (!targetCityName) {
      return { success: false, message: '未选择目标城市' }
    }

    const targetCity = getCityByName(target, targetCityName)
    if (!targetCity || targetCity.isAlive === false) {
      return { success: false, message: '目标城市已阵亡' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('玉碎瓦全', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 清除目标城市的保护罩（城市保护）
    if (gameStore.protections && gameStore.protections[target.name]) {
      if (gameStore.protections[target.name][targetCityName]) {
        delete gameStore.protections[target.name][targetCityName]
        addSkillEffectLog(gameStore, `(玉碎瓦全) 清除了${target.name}的${targetCity.name}的保护罩`)
      }
    }

    // 初始化玉碎瓦全状态结构
    if (!gameStore.yswq) {
      gameStore.yswq = {}
    }

    // 设置玉碎瓦全标记
    gameStore.yswq[caster.name] = {
      targetPlayer: target.name,
      targetCityName: targetCityName,
      targetCityKey: targetCityName,
      bannedProtection: true,  // 禁止对该城市使用城市保护
      round: gameStore.currentRound
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '玉碎瓦全',
      `${caster.name}使用了玉碎瓦全，玉碎瓦全生效，对${target.name}的${targetCity.name}：若本回合出战则攻击力翻倍并回合结束时消灭，若不出战则HP减半`,
      `你对${target.name}的${targetCity.name}使用了玉碎瓦全`
    )

    return {
      success: true,
      message: `对${target.name}的${targetCity.name}使用了玉碎瓦全`,
      data: {
        targetCityName: targetCity.name
      }
    }
  }

  /**
   * 合纵连横 - 3P专属，与一名玩家停战两回合，共同攻击第三方
   */
  function executeHeZongLianHeng(caster, ally) {
    // 检查游戏模式（仅限3P）
    if (gameStore.gameMode !== '3P') {
      return {
        success: false,
        message: '合纵连横仅限3人模式使用！'
      }
    }

    if (!ally) {
      return { success: false, message: '未选择盟友' }
    }

    // 检查对手数量（必须正好2个对手）
    const opponents = gameStore.players.filter(p => p.name !== caster.name)
    if (opponents.length !== 2) {
      return {
        success: false,
        message: '合纵连横需要正好2个对手！'
      }
    }

    // 检查盟友是否是对手之一
    if (!opponents.some(p => p.name === ally.name)) {
      return {
        success: false,
        message: '盟友必须是对手之一！'
      }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('合纵连横', caster, gameStore)
    if (!goldCheck.success) {
      return goldCheck
    }

    // 找到第三方
    const thirdParty = opponents.find(p => p.name !== ally.name)

    // 设置合纵连横标记
    if (!gameStore.hzlh) gameStore.hzlh = {}
    gameStore.hzlh[caster.name] = {
      ally: ally.name,
      target: thirdParty.name,
      roundsLeft: 2,
      startRound: gameStore.currentRound
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '合纵连横',
      `${caster.name}使用了合纵连横，合纵连横生效，与${ally.name}停战2回合，共同攻击${thirdParty.name}`,
      `你对${ally.name}使用了合纵连横`
    )

    return {
      success: true,
      message: `与${ally.name}停战2回合，共同攻击${thirdParty.name}`
    }
  }

  /**
   * 寸步难行 - 对方3回合内不能使用技能（除当机立断）
   */
  function executeMuBuZhuanJing(caster, target) {
    if (!target) {
      return { success: false, message: '未选择对手' }
    }

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('寸步难行', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 设置寸步难行状态（禁用对方技能3回合）
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
      `${caster.name}使用了寸步难行，寸步难行生效，${target.name}在3回合内不能使用技能（除当机立断）`,
      `你对${target.name}使用了寸步难行`
    )

    return {
      success: true,
      message: `${target.name}在3回合内不能使用技能`
    }
  }

  /**
   * 抛砖引玉 - 使己方HP最低的非中心战斗预备城市禁止出战5回合
   * 期间每回合战斗结束可额外获得2金币，5回合后该城市HP变为原来的20%
   */
  function executePaoZhuanYinYu(caster) {
    // 获取战斗预备城市
    const rosterIndices = gameStore.roster[caster.name] || []
    if (rosterIndices.length === 0) {
      return {
        success: false,
        message: '没有战斗预备城市'
      }
    }

    // 筛选非中心城市
    const nonCenterRoster = rosterIndices.filter(name => {
      const city = caster.cities[name]
      return city && !city.isCenter && city.isAlive !== false
    })

    if (nonCenterRoster.length === 0) {
      return {
        success: false,
        message: '没有非中心的战斗预备城市'
      }
    }

    // 找到HP最低的城市
    let lowestHpCityName = nonCenterRoster[0]
    let lowestHp = caster.cities[lowestHpCityName].currentHp || caster.cities[lowestHpCityName].hp

    for (let name of nonCenterRoster) {
      const city = caster.cities[name]
      const hp = city.currentHp || city.hp
      if (hp < lowestHp) {
        lowestHp = hp
        lowestHpCityName = name
      }
    }

    const targetCity = caster.cities[lowestHpCityName]

    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('抛砖引玉', caster, gameStore)
    if (!goldCheck.success) return goldCheck

    // 设置抛砖引玉状态
    if (!gameStore.paozhuanyinyu) {
      gameStore.paozhuanyinyu = {}
    }
    if (!gameStore.paozhuanyinyu[caster.name]) {
      gameStore.paozhuanyinyu[caster.name] = {}
    }

    gameStore.paozhuanyinyu[caster.name][lowestHpCityName] = {
      roundsLeft: 5,
      originalHp: lowestHp,
      cityName: targetCity.name
    }

    // 从roster中移除该城市
    const rosterIndex = gameStore.roster[caster.name].indexOf(lowestHpCityName)
    if (rosterIndex > -1) {
      gameStore.roster[caster.name].splice(rosterIndex, 1)
    }

    // 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '抛砖引玉',
      `${caster.name}使用了抛砖引玉，抛砖引玉生效，${targetCity.name}禁止出战5回合，期间每回合战斗结束可额外获得2金币，5回合后HP变为20%`,
      `${caster.name}使用了抛砖引玉`
    )

    return {
      success: true,
      message: `${targetCity.name}禁止出战5回合，每回合战斗结束+2金币，5回合后HP变为20%`
    }
  }

  // 导出所有战斗技能
  return {
    executeQinZeiQinWang,
    executeCaoMuJieBing,
    executeYueZhanYueYong,
    executeXiYinGongJi,
    executeTongQiangTieBi,
    executeBeiShuiYiZhan,
    executeLiaoShiRuShen,
    executeTongGuiYuJin,
    executeSetBarrier,
    executeQianNengJiFa,
    executeYuJiaQinZheng,
    executeKuangBaoMoShi,
    executeAnBingBuDong,
    executeJiLaiZeAn,
    executeFanGeYiJi,
    executeAnDuChenCang,
    executeShengDongJiXi,
    executeYiYiDaiLao,
    executeCaoChuanJieJian,
    executeWeiWeiJiuZhao,
    executeYuQinGuZong,
    executeYunTouZhuanXiang,
    executeGeAnGuanHuo,
    executeTiaoBoBaoLiJian,
    executeChenHuoDaJie,
    executeYuSuiWaQuan,
    executeHeZongLianHeng,
    executeMuBuZhuanJing,
    executePaoZhuanYinYu
  }
}
