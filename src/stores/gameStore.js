import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { ALL_CITIES, PROVINCE_MAP } from '../data/cities'

export const useGameStore = defineStore('game', () => {
  // ========== 基础状态 ==========
  const players = ref([])
  const currentRound = ref(0)
  const gameMode = ref('2P') // '2P', '3P', '2v2'
  const logs = ref([])
  const playerStates = reactive({})           // 玩家状态 [player]: {currentBattleCities, battleGoldSkill, deadCities, needsRosterRefill, ...}

  // ========== 城市管理 ==========
  const usedCities = ref(new Set())           // 已使用的城市名称集合
  const initialCities = reactive({})          // 玩家初始城市列表 [player][idx]
  const deadCities = reactive({})             // 阵亡城市列表 [player][]

  // ========== 技能状态追踪 ==========
  const cautiousExchange = reactive({})       // 谨慎交换集合 [player][]
  const anchored = reactive({})               // 定海神针城市 [player][idx]
  const ironCities = reactive({})             // 钢铁城市 [player][idx]: layers
  const protections = reactive({})            // 城市保护罩 [player][idx]: rounds
  const disguisedCities = reactive({})        // 伪装城市 [player][idx]: {m, cur, n, paid, roundsLeft}
  const knownCities = reactive({})            // 已知城市 [player][knownBy][]

  // ========== 战斗技能标记 ==========
  const qinwang = ref(null)                   // 擒贼擒王目标
  const cmjb = ref(null)                      // 草木皆兵目标
  const yueyueyong = reactive({})             // 越战越勇城市 [player][idx]
  const attract = reactive({})                // 吸引攻击城市 [player]: idx
  const jilaizan = reactive({})               // 既来则安城市 [player][idx]: {used}
  const ironwall = ref(null)                  // 铜墙铁壁目标
  const barrier = reactive({})                // 屏障 [player]: {hp, maxHp, roundsLeft, team?}
  const yujia = ref(null)                     // 御驾亲征 {player, target, centerIdx}
  const foresee = ref(null)                   // 料事如神标记
  const reflect = reactive({})                // 反戈一击 [player]: {target, active}

  // ========== 非战斗技能状态 ==========
  const goldLoanRounds = reactive({})         // 金币贷款禁用 [player]: rounds
  const bannedCities = reactive({})           // 禁用城市 [player][idx]: rounds
  const fatigueStreaks = reactive({})         // 疲劳指数 [player][idx]: number
  const brickJade = reactive({})              // 抛砖引玉 [player][idx]: {rounds, originalHp}
  const hiddenGrowth = reactive({})           // 深藏不露 [player][idx]: {idleRounds, active, everDied}
  const timeBombs = reactive({})              // 定时爆破 [player][idx]: countdown
  const cityTrialUsed = reactive({})          // 城市试炼使用记录 [player][idx]
  const berserkFired = reactive({})           // 狂暴模式使用 [player][idx]: originalHp
  const buffs = reactive({})                  // 城市增益效果 [player][idx]: {multiplier, ...}
  const stolenSkills = reactive({})           // 移花接木偷取技能 [player]: [{skillName, roundsLeft, usedCount, from}]
  const stealth = reactive({})                // 不露踪迹状态 [player]: {roundsLeft}
  const costIncrease = reactive({})           // 釜底抽薪标记 [player]: count (下次8+金币技能费用增加50%)
  const disaster = reactive({})               // 天灾人祸标记 [player][idx]: roundsLeft (攻击力变为1)
  const forceDeployTwo = reactive({})         // 一举两得标记 [player]: {active, round} (强制出战2个城市)
  const cannotStandDown = reactive({})        // 一举两得标记 [player]: {active, round} (禁用按兵不动)
  const financialCrisis = ref(null)           // 金融危机状态 {roundsLeft} (持续3回合，金币最高玩家无法+3，其余+1)
  const burnBridge = reactive({})             // 过河拆桥状态 [player]: {active, bannedSkills: []} (接下来5个不同技能对其他玩家禁用)
  const skillProtection = reactive({})        // 技能保护状态 [player]: {roundsLeft} (10回合内对手无法使用事半功倍、过河拆桥)
  const yiyidl = reactive({})                 // 以逸待劳标记 [player]: {target, goldMark} (根据对手出战城市数+2000伤害，抢走金币)
  const sdxj = reactive({})                   // 声东击西标记 [player]: {target, active} (3P模式，战力劣势时转向攻击另一玩家)
  const changeFlagMark = reactive({})         // 拔旗易帜标记 [player][cityIdx]: {newProvince, originalProvince} (交换省份归属)
  const wwjz = reactive({})                   // 围魏救赵标记 [player]: {active} (本轮生效，战斗特殊处理)
  const wwjzUsageCount = reactive({})         // 围魏救赵使用次数 [player]: count (最多2次)
  const dizzy = reactive({})                  // 晕头转向标记 [player]: {mode, target} (本轮交换出战城市)
  const yqgzMarks = ref([])                   // 欲擒故纵陷阱标记数组 [{player, target, cityIdx, roundCreated}]
  const ccjj = reactive({})                   // 草船借箭标记 [player]: {active} (本轮攻击转为治疗)
  const gawhUser = ref(null)                  // 隔岸观火用户 {player, round} (每轮仅首次使用者生效，3P模式)
  const tblj = reactive({})                   // 挑拨离间标记 [player]: {mode, targetTeam} (本轮对手团队内斗，2v2模式)
  const reversedCapitals = reactive({})       // 倒反天罡标记 [player][cityIdx]: {province, cityName} (永久移除省会效果)
  const hpBank = reactive({})                 // 血量存储 [player]: {balance, depositMade, hasWithdrawnThisRound} (HP存储库)
  const centerProjection = reactive({})       // 海市蜃楼 [player]: {roundsLeft, blocked} (中心投影，75%拦截伤害)
  const bannedSkills = reactive({})           // 事半功倍 [opponent]: {skillName: rounds} (禁用对手技能)
  const stareDown = reactive({})              // 目不转睛 [player]: {caster, roundsLeft} (限制玩家只能使用当机立断和无懈可击)
  const dcgy = ref([])                        // 电磁感应 [{caster, target, cities: [], roundsLeft, damagedThisRound}] (电磁感应链接数组)
  const forcedSoldierBan = reactive({})       // 强制搬运禁用 [player]: [] (被禁用的搬运技能列表)
  const potentialOverflow = reactive({})      // 潜能激发溢出 [player]: state (潜能激发溢出效果)
  const bbgs = reactive({})                   // 步步高升 [player][cityIdx]: state (步步高升状态标记)
  const subCenters = reactive({})             // 副中心制 [player]: cityIdx (副中心城市索引)
  const purpleChamber = reactive({})          // 生于紫室 [player]: cityIdx (生于紫室城市索引)

  // ========== 交互流程 ==========
  const pendingFortuneSwap = ref(null)        // 待处理的时来运转
  const pendingPreemptiveStrike = ref(null)   // 待处理的先声夺人
  const ldtj = reactive({})                   // 李代桃僵状态 [player]: active

  // ========== 护盾系统 ==========
  const jianbukecui = reactive({})            // 坚不可摧护盾 [player]: roundsLeft

  // ========== 无懈可击相关 ==========
  const lastSkillUsed = ref(null)             // {userName, skillName, cost, roundNumber}
  const gameStateSnapshot = ref(null)         // 游戏状态快照

  // ========== 技能使用追踪 ==========
  const skillUsageTracking = reactive({})     // 技能使用追踪 [player][skillName]: count
  const cooldowns = reactive({})              // 技能冷却 [player][skillName]: remainingRounds

  // ========== 按兵不动隐藏城市系统 ==========
  const standGroundCities = reactive({})      // 按兵不动隐藏城市 [player]: [{name, hp, originalHp, used, red, green, blue, yellow}]

  // ========== 颜色技能使用追踪 ==========
  const colorSkillsUsed = reactive({})        // 颜色技能使用 [player]: {red, green, blue}

  // ========== 私有日志系统 ==========
  const playerPrivateLogs = reactive({})      // 玩家私有日志 [player]: [{timestamp, round, message}]

  // ========== 回合行动记录 ==========
  const roundActions = ref([])                // 回合行动记录 [{round, player, action, details}]

  // 玩家数据
  const playerCount = computed(() => players.value.length)

  // 添加玩家
  function addPlayer(playerData) {
    const playerName = playerData.name

    players.value.push({
      name: playerName,
      gold: 0,
      cities: playerData.cities || [],
      ...playerData
    })

    // 初始化按兵不动隐藏城市（每个玩家3个）
    if (!standGroundCities[playerName]) {
      standGroundCities[playerName] = [
        { name: '按兵不动', hp: 1, originalHp: 1, used: false, red: 0, green: 0, blue: 0, yellow: 0 },
        { name: '按兵不动', hp: 1, originalHp: 1, used: false, red: 0, green: 0, blue: 0, yellow: 0 },
        { name: '按兵不动', hp: 1, originalHp: 1, used: false, red: 0, green: 0, blue: 0, yellow: 0 }
      ]
    }

    // 初始化颜色技能使用追踪
    if (!colorSkillsUsed[playerName]) {
      colorSkillsUsed[playerName] = {
        red: false,
        green: false,
        blue: false
      }
    }

    // 初始化私有日志
    if (!playerPrivateLogs[playerName]) {
      playerPrivateLogs[playerName] = []
    }
  }

  // 移除玩家
  function removePlayer(playerName) {
    const index = players.value.findIndex(p => p.name === playerName)
    if (index !== -1) {
      players.value.splice(index, 1)
    }
  }

  // 添加日志
  function addLog(message, type = 'info') {
    const timestamp = Date.now()  // 使用时间戳数字而不是字符串
    logs.value.push({
      message,
      type,
      timestamp
    })
  }

  // 清空日志
  function clearLogs() {
    logs.value = []
  }

  // 添加私有日志
  function addPrivateLog(playerName, message) {
    const timestamp = Date.now()  // 使用时间戳数字而不是字符串
    if (!playerPrivateLogs[playerName]) {
      playerPrivateLogs[playerName] = []
    }
    playerPrivateLogs[playerName].push({
      message,
      timestamp,
      round: currentRound.value,
      isPrivate: true
    })
  }

  // 添加回合行动记录
  function addRoundAction(player, action, details = {}) {
    roundActions.value.push({
      round: currentRound.value,
      player,
      action,
      details,
      timestamp: Date.now()
    })
  }

  // 重置颜色技能使用状态（每回合调用）
  function resetColorSkillsUsed() {
    for (const playerName of Object.keys(colorSkillsUsed)) {
      colorSkillsUsed[playerName] = {
        red: false,
        green: false,
        blue: false
      }
    }
  }

  // 检查颜色技能是否已使用
  function isColorSkillUsed(playerName, color) {
    if (!colorSkillsUsed[playerName]) return false
    return colorSkillsUsed[playerName][color] === true
  }

  // 标记颜色技能为已使用
  function markColorSkillUsed(playerName, color) {
    if (!colorSkillsUsed[playerName]) {
      colorSkillsUsed[playerName] = {
        red: false,
        green: false,
        blue: false
      }
    }
    colorSkillsUsed[playerName][color] = true
  }

  // 重置游戏
  function resetGame() {
    players.value = []
    currentRound.value = 0
    logs.value = []

    // 重置所有状态
    usedCities.value = new Set()
    Object.keys(initialCities).forEach(key => delete initialCities[key])
    Object.keys(deadCities).forEach(key => delete deadCities[key])
    Object.keys(cautiousExchange).forEach(key => delete cautiousExchange[key])
    Object.keys(anchored).forEach(key => delete anchored[key])
    Object.keys(ironCities).forEach(key => delete ironCities[key])
    Object.keys(protections).forEach(key => delete protections[key])
    Object.keys(disguisedCities).forEach(key => delete disguisedCities[key])
    Object.keys(knownCities).forEach(key => delete knownCities[key])
    Object.keys(yueyueyong).forEach(key => delete yueyueyong[key])
    Object.keys(attract).forEach(key => delete attract[key])
    Object.keys(jilaizan).forEach(key => delete jilaizan[key])
    Object.keys(barrier).forEach(key => delete barrier[key])
    Object.keys(reflect).forEach(key => delete reflect[key])
    Object.keys(goldLoanRounds).forEach(key => delete goldLoanRounds[key])
    Object.keys(bannedCities).forEach(key => delete bannedCities[key])
    Object.keys(fatigueStreaks).forEach(key => delete fatigueStreaks[key])
    Object.keys(brickJade).forEach(key => delete brickJade[key])
    Object.keys(hiddenGrowth).forEach(key => delete hiddenGrowth[key])
    Object.keys(timeBombs).forEach(key => delete timeBombs[key])
    Object.keys(cityTrialUsed).forEach(key => delete cityTrialUsed[key])
    Object.keys(berserkFired).forEach(key => delete berserkFired[key])
    Object.keys(buffs).forEach(key => delete buffs[key])
    Object.keys(stolenSkills).forEach(key => delete stolenSkills[key])
    Object.keys(stealth).forEach(key => delete stealth[key])
    Object.keys(costIncrease).forEach(key => delete costIncrease[key])
    Object.keys(disaster).forEach(key => delete disaster[key])
    Object.keys(forceDeployTwo).forEach(key => delete forceDeployTwo[key])
    Object.keys(cannotStandDown).forEach(key => delete cannotStandDown[key])
    financialCrisis.value = null
    Object.keys(burnBridge).forEach(key => delete burnBridge[key])
    Object.keys(skillProtection).forEach(key => delete skillProtection[key])
    Object.keys(yiyidl).forEach(key => delete yiyidl[key])
    Object.keys(sdxj).forEach(key => delete sdxj[key])
    Object.keys(changeFlagMark).forEach(key => delete changeFlagMark[key])
    Object.keys(wwjz).forEach(key => delete wwjz[key])
    Object.keys(wwjzUsageCount).forEach(key => delete wwjzUsageCount[key])
    Object.keys(dizzy).forEach(key => delete dizzy[key])
    yqgzMarks.value = []
    Object.keys(ccjj).forEach(key => delete ccjj[key])
    gawhUser.value = null
    Object.keys(tblj).forEach(key => delete tblj[key])
    Object.keys(reversedCapitals).forEach(key => delete reversedCapitals[key])
    Object.keys(hpBank).forEach(key => delete hpBank[key])
    Object.keys(centerProjection).forEach(key => delete centerProjection[key])
    Object.keys(bannedSkills).forEach(key => delete bannedSkills[key])
    Object.keys(stareDown).forEach(key => delete stareDown[key])
    dcgy.value = []
    Object.keys(forcedSoldierBan).forEach(key => delete forcedSoldierBan[key])
    Object.keys(potentialOverflow).forEach(key => delete potentialOverflow[key])
    Object.keys(bbgs).forEach(key => delete bbgs[key])
    Object.keys(subCenters).forEach(key => delete subCenters[key])
    Object.keys(purpleChamber).forEach(key => delete purpleChamber[key])
    Object.keys(ldtj).forEach(key => delete ldtj[key])
    Object.keys(jianbukecui).forEach(key => delete jianbukecui[key])
    Object.keys(skillUsageTracking).forEach(key => delete skillUsageTracking[key])

    // 重置新增的状态
    Object.keys(standGroundCities).forEach(key => delete standGroundCities[key])
    Object.keys(colorSkillsUsed).forEach(key => delete colorSkillsUsed[key])
    Object.keys(playerPrivateLogs).forEach(key => delete playerPrivateLogs[key])
    roundActions.value = []

    qinwang.value = null
    cmjb.value = null
    ironwall.value = null
    yujia.value = null
    foresee.value = null
    pendingFortuneSwap.value = null
    pendingPreemptiveStrike.value = null
    lastSkillUsed.value = null
    gameStateSnapshot.value = null
  }

  // 下一回合
  function nextRound() {
    currentRound.value++
    addLog(`第 ${currentRound.value} 回合开始`)

    // 更新所有回合相关状态
    updateRoundStates()
  }

  // ========== 城市池管理函数 ==========

  // 获取未使用的城市列表
  function getUnusedCities() {
    return ALL_CITIES.filter(city => !usedCities.value.has(city.name))
  }

  // 标记城市为已使用
  function markCityAsUsed(cityName) {
    usedCities.value.add(cityName)
  }

  // 通过名称获取城市数据（从ALL_CITIES）
  function getCityByName(cityName) {
    return ALL_CITIES.find(city => city.name === cityName)
  }

  // 获取指定省份的所有城市
  function getCitiesByProvince(provinceName) {
    const province = PROVINCE_MAP[Object.keys(PROVINCE_MAP).find(city =>
      PROVINCE_MAP[city].name === provinceName
    )]
    return province ? province.cities : []
  }

  // 获取城市所属省份
  function getProvinceOfCity(cityName) {
    return PROVINCE_MAP[cityName]
  }

  // ========== 谨慎交换集合管理 ==========

  // 检查是否在谨慎交换集合
  function isInCautiousSet(playerName, cityIdx) {
    if (!cautiousExchange[playerName]) return false
    return cautiousExchange[playerName].includes(cityIdx)
  }

  // 添加到谨慎交换集合
  function addToCautiousSet(playerName, cityIdx) {
    if (!cautiousExchange[playerName]) {
      cautiousExchange[playerName] = []
    }
    if (!cautiousExchange[playerName].includes(cityIdx)) {
      cautiousExchange[playerName].push(cityIdx)
    }
  }

  // 从谨慎交换集合移除
  function removeFromCautiousSet(playerName, cityIdx) {
    if (!cautiousExchange[playerName]) return
    const index = cautiousExchange[playerName].indexOf(cityIdx)
    if (index > -1) {
      cautiousExchange[playerName].splice(index, 1)
    }
  }

  // ========== 护盾和保护检查 ==========

  // 检查是否被坚不可摧护盾阻挡
  function isBlockedByJianbukecui(targetPlayer, attackerPlayer, skillName) {
    if (!jianbukecui[targetPlayer]) return false
    if (jianbukecui[targetPlayer].roundsLeft <= 0) return false

    // 列出所有被坚不可摧阻挡的技能
    const blockedSkills = [
      '无知无畏', '进制扭曲', '整齐划一', '人质交换', '时来运转',
      '吸引攻击', '铜墙铁壁', '料事如神', '背水一战', '同归于尽',
      '暗度陈仓', '隔岸观火', '挑拨离间', '清除加成', '釜底抽薪',
      '劫富济贫', '天灾人祸', '提灯定损', '连续打击', '倒反天罡',
      '数位反转', '波涛汹涌', '万箭齐发', '连锁反应', '御驾亲征',
      '欲擒故纵', '晕头转向', '草船借箭', '招贤纳士', '狂轰滥炸',
      '横扫一空', '降维打击', '定时爆破', '反戈一击', '围魏救赵',
      '永久摧毁', '趁其不备·随机', '趁其不备·指定', '电磁感应',
      '自相残杀', '中庸之道', '强制迁都·普通', '强制迁都·高级版',
      '大义灭亲', '强制搬运', '夷为平地', '设置屏障', '潜能激发',
      '无懈可击', '当机立断'
    ]

    return blockedSkills.includes(skillName)
  }

  // 检查城市是否有保护罩
  function hasProtection(playerName, cityIdx) {
    return protections[playerName] && protections[playerName][cityIdx] > 0
  }

  // 检查城市是否有钢铁护盾
  function hasIronShield(playerName, cityIdx) {
    return ironCities[playerName] && ironCities[playerName][cityIdx] > 0
  }

  // 检查海市蜃楼是否拦截伤害（75%概率）
  function checkMirageBlock(playerName, attackSource) {
    // 检查玩家是否有海市蜃楼状态
    if (!mirage || !mirage[playerName]) {
      return false
    }

    const mirageState = mirage[playerName]

    // 检查是否激活且剩余回合数>0
    if (!mirageState.active || mirageState.roundsLeft <= 0) {
      return false
    }

    // 75%概率拦截
    const blocked = Math.random() < 0.75

    if (blocked) {
      mirageState.blocked = (mirageState.blocked || 0) + 1
      addLog(`${playerName}的海市蜃楼拦截了${attackSource}的伤害`)
      return true
    }

    return false
  }

  // 消耗一层保护（返回true表示被保护抵消）
  function consumeProtection(playerName, cityIdx) {
    if (hasProtection(playerName, cityIdx)) {
      delete protections[playerName][cityIdx]
      addLog(`${playerName}的城市保护罩被击破`)
      return true
    }
    if (hasIronShield(playerName, cityIdx)) {
      ironCities[playerName][cityIdx]--
      if (ironCities[playerName][cityIdx] <= 0) {
        delete ironCities[playerName][cityIdx]
      }
      addLog(`${playerName}的钢铁护盾减少一层`)
      return true
    }
    return false
  }

  // 检查城市是否是副中心
  function isSubCenter(playerName, cityIdx) {
    return subCenters[playerName] === cityIdx
  }

  // ========== 城市状态管理 ==========

  // 检查城市是否为已知城市
  function isCityKnown(playerName, cityIdx, knownBy) {
    if (!knownCities[playerName]) return false
    if (!knownCities[playerName][knownBy]) return false
    return knownCities[playerName][knownBy].includes(cityIdx)
  }

  // 设置城市为已知
  function setCityKnown(playerName, cityIdx, knownBy) {
    if (!knownCities[playerName]) {
      knownCities[playerName] = {}
    }
    if (!knownCities[playerName][knownBy]) {
      knownCities[playerName][knownBy] = []
    }
    if (!knownCities[playerName][knownBy].includes(cityIdx)) {
      knownCities[playerName][knownBy].push(cityIdx)
    }
  }

  // 清除城市已知状态
  function clearCityKnownStatus(playerName, cityIdx) {
    if (!knownCities[playerName]) return
    for (const knownBy of Object.keys(knownCities[playerName])) {
      const index = knownCities[playerName][knownBy].indexOf(cityIdx)
      if (index > -1) {
        knownCities[playerName][knownBy].splice(index, 1)
      }
    }
  }

  // ========== 步步高升处理 ==========

  /**
   * 处理城市阵亡时的步步高升召唤逻辑
   * @param {Object} player - 玩家对象
   * @param {number} cityIdx - 阵亡城市索引
   * @param {Object} city - 阵亡的城市对象
   */
  function handleBuBuGaoShengSummon(player, cityIdx, city) {
    // 检查该城市是否有步步高升状态
    if (!bbgs[player.name] || !bbgs[player.name][cityIdx]) {
      return
    }

    const bbgsState = bbgs[player.name][cityIdx]

    // 检查召唤次数是否已达上限（最多3次）
    if (bbgsState.count >= bbgsState.maxCount) {
      addLog(`${player.name}的${city.name}步步高升召唤次数已达上限（3次）`)
      delete bbgs[player.name][cityIdx]
      return
    }

    // 获取城市的有效省份（考虑拔旗易帜）
    let province = city.province
    if (changeFlagMark[player.name] && changeFlagMark[player.name][cityIdx]) {
      province = changeFlagMark[player.name][cityIdx].newProvince
    }

    if (!province) {
      addLog(`${player.name}的${city.name}无法确定所属省份，步步高升失效`)
      delete bbgs[player.name][cityIdx]
      return
    }

    // 排除直辖市和特别行政区
    const excluded = ['北京市', '天津市', '重庆市', '上海市', '香港特别行政区', '澳门特别行政区']
    if (excluded.includes(city.name)) {
      addLog(`${player.name}的${city.name}是直辖市/特区，步步高升无法召唤`)
      delete bbgs[player.name][cityIdx]
      return
    }

    // 获取同省份的所有城市
    const provinceCities = getCitiesByProvince(province)
    if (!provinceCities || provinceCities.length === 0) {
      addLog(`${player.name}的${city.name}所在省份无可召唤城市`)
      delete bbgs[player.name][cityIdx]
      return
    }

    // 筛选可召唤的城市：
    // 1. 未被使用过
    // 2. HP高于阵亡城市的原始HP
    // 3. 不是当前玩家已拥有的城市
    const originalHp = bbgsState.originalHp || city.hp
    const playerCityNames = player.cities.map(c => c.name)

    const availableCities = provinceCities.filter(c => {
      return !usedCities.includes(c.name) &&  // 未被使用
             c.hp > originalHp &&              // HP更高
             !playerCityNames.includes(c.name) // 不是已拥有的城市
    })

    if (availableCities.length === 0) {
      addLog(`${player.name}的${city.name}所在省份没有HP更高的未使用城市，步步高升失效`)
      delete bbgs[player.name][cityIdx]
      return
    }

    // 按HP从低到高排序，选择HP最接近的城市
    availableCities.sort((a, b) => a.hp - b.hp)
    const summonedCity = availableCities[0]

    // 将新城市添加到玩家城市列表（替换阵亡城市的位置）
    const newCity = {
      ...summonedCity,
      currentHp: summonedCity.hp,
      isAlive: true,
      red: 0,
      green: 0,
      blue: 0,
      yellow: 0
    }

    // 替换阵亡城市
    player.cities[cityIdx] = newCity

    // 标记为已使用
    markCityAsUsed(summonedCity.name)

    // 更新initialCities记录
    if (!initialCities[player.name]) {
      initialCities[player.name] = {}
    }
    initialCities[player.name][cityIdx] = {
      name: newCity.name,
      hp: newCity.hp,
      currentHp: newCity.hp,
      baseHp: newCity.hp,
      isAlive: true
    }

    // 更新步步高升状态
    bbgsState.count++
    bbgsState.originalHp = summonedCity.hp

    // 如果达到最大召唤次数，删除状态
    if (bbgsState.count >= bbgsState.maxCount) {
      delete bbgs[player.name][cityIdx]
    }

    addLog(
      `${player.name}的${city.name}阵亡，步步高升召唤${summonedCity.name}（HP${summonedCity.hp}）替换！` +
      `（剩余召唤次数：${bbgsState.maxCount - bbgsState.count}）`
    )
  }

  /**
   * 检查中心城市阵亡时的生于紫室继承机制
   * 参考 citycard_web.html lines 10036-10071
   * @param {Object} player - 玩家对象
   */
  function checkCenterDeathAndPurpleChamberInheritance(player) {
    const centerIdx = player.centerIndex ?? 0
    const centerCity = player.cities[centerIdx]

    // 中心城市未阵亡，无需处理
    if (!centerCity || centerCity.currentHp > 0) {
      return
    }

    // 检查是否有生于紫室城市
    const chamberIdx = purpleChamber[player.name]
    const chamberCity = chamberIdx !== undefined ? player.cities[chamberIdx] : null
    const hasPurpleChamber = chamberCity && chamberCity.currentHp > 0 && chamberCity.isAlive !== false

    if (hasPurpleChamber) {
      // 生于紫室城市自动成为新中心，玩家不淘汰
      player.centerIndex = chamberIdx

      // 更新城市的isCenter标记
      if (centerCity) centerCity.isCenter = false
      chamberCity.isCenter = true

      // 失去生于紫室加成
      delete purpleChamber[player.name]

      addLog(`>>> (生于紫室) ${player.name}的中心城市阵亡，${chamberCity.name}自动成为新中心，失去生于紫室加成`)

      // 失去加成的城市变为已知城市（对所有对手）
      const allPlayers = players.value
      allPlayers.forEach(opponent => {
        if (opponent.name === player.name) return

        if (!knownCities[opponent.name]) {
          knownCities[opponent.name] = {}
        }
        if (!knownCities[opponent.name][player.name]) {
          knownCities[opponent.name][player.name] = []
        }
        if (!knownCities[opponent.name][player.name].includes(chamberIdx)) {
          knownCities[opponent.name][player.name].push(chamberIdx)
        }
      })
    } else {
      // 没有生于紫室城市，正常淘汰
      const anyAliveOther = player.cities.some((c, idx) =>
        idx !== centerIdx && (c.currentHp || 0) > 0 && c.isAlive !== false
      )

      if (anyAliveOther) {
        // 将其余城市HP清零
        player.cities.forEach((c, idx) => {
          if (idx === centerIdx) return
          c.currentHp = 0
          c.isAlive = false
        })

        addLog(`>>> ${player.name}的中心城市阵亡，玩家淘汰，其余城市全部退出（HP清零）`)
      }
    }
  }

  // ========== 快照系统 ==========

  // 创建游戏状态快照（用于无懈可击）
  function createGameStateSnapshot() {
    gameStateSnapshot.value = {
      players: JSON.parse(JSON.stringify(players.value)),
      currentRound: currentRound.value,
      // 保存所有reactive状态的快照
      initialCities: JSON.parse(JSON.stringify(initialCities)),
      deadCities: JSON.parse(JSON.stringify(deadCities)),
      cautiousExchange: JSON.parse(JSON.stringify(cautiousExchange)),
      anchored: JSON.parse(JSON.stringify(anchored)),
      ironCities: JSON.parse(JSON.stringify(ironCities)),
      protections: JSON.parse(JSON.stringify(protections)),
      disguisedCities: JSON.parse(JSON.stringify(disguisedCities)),
      knownCities: JSON.parse(JSON.stringify(knownCities)),
      barrier: JSON.parse(JSON.stringify(barrier)),
      buffs: JSON.parse(JSON.stringify(buffs)),
      // ... 其他需要保存的状态
    }
  }

  // 恢复游戏状态快照
  function restoreGameStateSnapshot() {
    if (!gameStateSnapshot.value) return false

    const snapshot = gameStateSnapshot.value
    players.value = JSON.parse(JSON.stringify(snapshot.players))
    currentRound.value = snapshot.currentRound

    // 恢复所有reactive状态
    Object.assign(initialCities, snapshot.initialCities)
    Object.assign(deadCities, snapshot.deadCities)
    Object.assign(cautiousExchange, snapshot.cautiousExchange)
    Object.assign(anchored, snapshot.anchored)
    Object.assign(ironCities, snapshot.ironCities)
    Object.assign(protections, snapshot.protections)
    Object.assign(disguisedCities, snapshot.disguisedCities)
    Object.assign(knownCities, snapshot.knownCities)
    Object.assign(barrier, snapshot.barrier)
    Object.assign(buffs, snapshot.buffs)

    addLog('技能已被无懈可击撤回')
    return true
  }

  // ========== 回合更新函数 ==========

  // 更新所有回合相关状态
  function updateRoundStates() {
    // 更新金币贷款禁用
    for (const player of Object.keys(goldLoanRounds)) {
      if (goldLoanRounds[player] > 0) {
        goldLoanRounds[player]--
      }
    }

    // 更新禁用城市
    for (const player of Object.keys(bannedCities)) {
      for (const cityIdx of Object.keys(bannedCities[player])) {
        if (bannedCities[player][cityIdx] > 0) {
          bannedCities[player][cityIdx]--
        }
      }
    }

    // 更新保护罩回合数
    for (const player of Object.keys(protections)) {
      for (const cityIdx of Object.keys(protections[player])) {
        if (protections[player][cityIdx] > 0) {
          protections[player][cityIdx]--
          if (protections[player][cityIdx] <= 0) {
            delete protections[player][cityIdx]
          }
        }
      }
    }

    // 更新伪装回合数
    for (const player of Object.keys(disguisedCities)) {
      for (const cityIdx of Object.keys(disguisedCities[player])) {
        const disguise = disguisedCities[player][cityIdx]
        if (disguise.roundsLeft > 0) {
          disguise.roundsLeft--
          if (disguise.roundsLeft <= 0) {
            delete disguisedCities[player][cityIdx]
            addLog(`${player}的城市伪装效果消失`)
          }
        }
      }
    }

    // 更新护盾回合数
    for (const player of Object.keys(barrier)) {
      if (barrier[player].roundsLeft > 0) {
        barrier[player].roundsLeft--
        // 每回合恢复3000HP
        barrier[player].hp = Math.min(barrier[player].hp + 3000, barrier[player].maxHp)

        if (barrier[player].roundsLeft <= 0) {
          delete barrier[player]
          addLog(`${player}的屏障消失`)
        }
      }
    }

    // 更新坚不可摧护盾
    for (const player of Object.keys(jianbukecui)) {
      if (jianbukecui[player].roundsLeft > 0) {
        jianbukecui[player].roundsLeft--
        if (jianbukecui[player].roundsLeft <= 0) {
          delete jianbukecui[player]
          addLog(`${player}的坚不可摧护盾消失`)
        }
      }
    }

    // 更新定时炸弹
    for (const player of Object.keys(timeBombs)) {
      for (const cityIdx of Object.keys(timeBombs[player])) {
        if (timeBombs[player][cityIdx] > 0) {
          timeBombs[player][cityIdx]--
          if (timeBombs[player][cityIdx] === 0) {
            // 炸弹爆炸逻辑在这里处理
            addLog(`${player}的城市上的定时炸弹爆炸！`)
            // TODO: 实现爆炸效果
            delete timeBombs[player][cityIdx]
          }
        }
      }
    }

    // 更新天灾人祸
    for (const player of Object.keys(disaster)) {
      for (const cityIdx of Object.keys(disaster[player])) {
        if (disaster[player][cityIdx] > 0) {
          disaster[player][cityIdx]--
          if (disaster[player][cityIdx] <= 0) {
            delete disaster[player][cityIdx]
            addLog(`${player}的城市天灾人祸效果消失`)
          }
        }
      }
    }

    // 更新金融危机
    if (financialCrisis.value && financialCrisis.value.roundsLeft > 0) {
      financialCrisis.value.roundsLeft--
      if (financialCrisis.value.roundsLeft <= 0) {
        financialCrisis.value = null
        addLog('金融危机状态结束')
      }
    }

    // 更新技能保护
    for (const player of Object.keys(skillProtection)) {
      if (skillProtection[player].roundsLeft > 0) {
        skillProtection[player].roundsLeft--
        if (skillProtection[player].roundsLeft <= 0) {
          delete skillProtection[player]
          addLog(`${player}的技能保护状态消失`)
        }
      }
    }

    // 更新healing治疗状态
    for (const player of players.value) {
      if (!player.cities) continue

      player.cities.forEach((city, idx) => {
        if (!city.modifiers) return

        // 查找healing modifier
        const healingIdx = city.modifiers.findIndex(m => m.type === 'healing')
        if (healingIdx === -1) return

        const healing = city.modifiers[healingIdx]
        if (healing.roundsLeft > 0) {
          healing.roundsLeft--

          if (healing.roundsLeft === 0) {
            // 治疗完成，满血返回
            city.currentHp = healing.returnHp || city.hp
            city.isInHealing = false

            // 移除healing modifier
            city.modifiers.splice(healingIdx, 1)

            // 移除bannedCities记录
            if (bannedCities[player.name] && bannedCities[player.name][idx]) {
              delete bannedCities[player.name][idx]
            }

            addLog(`${player.name}的${city.name}高级治疗完成，满血返回战场`)
          }
        }
      })
    }

    // 更新移花接木偷取技能
    for (const player of Object.keys(stolenSkills)) {
      if (stolenSkills[player] && Array.isArray(stolenSkills[player])) {
        stolenSkills[player] = stolenSkills[player].filter(skill => {
          if (skill.roundsLeft > 0) {
            skill.roundsLeft--
            if (skill.roundsLeft <= 0) {
              addLog(`${player}偷取的技能"${skill.skillName}"已失效`)
              return false
            }
            return true
          }
          return false
        })
      }
    }

    // 更新不露踪迹状态
    for (const player of Object.keys(stealth)) {
      if (stealth[player].roundsLeft > 0) {
        stealth[player].roundsLeft--
        if (stealth[player].roundsLeft <= 0) {
          delete stealth[player]
          addLog(`${player}的不露踪迹状态消失`)
        }
      }
    }

    // 清除单回合效果
    qinwang.value = null
    cmjb.value = null
    ironwall.value = null
    foresee.value = null

    // 清除反戈一击（单回合效果）
    Object.keys(reflect).forEach(key => delete reflect[key])

    // 清除一举两得（单回合效果）
    Object.keys(forceDeployTwo).forEach(key => delete forceDeployTwo[key])
    Object.keys(cannotStandDown).forEach(key => delete cannotStandDown[key])

    // 清除声东击西（单回合效果）
    Object.keys(sdxj).forEach(key => delete sdxj[key])

    // 清除以逸待劳（单回合效果）
    Object.keys(yiyidl).forEach(key => delete yiyidl[key])

    // 清除围魏救赵（单回合效果）
    Object.keys(wwjz).forEach(key => delete wwjz[key])

    // 清除晕头转向（单回合效果）
    Object.keys(dizzy).forEach(key => delete dizzy[key])

    // 清除草船借箭（单回合效果）
    Object.keys(ccjj).forEach(key => delete ccjj[key])

    // 清除隔岸观火（单回合效果）
    gawhUser.value = null

    // 清除挑拨离间（单回合效果）
    Object.keys(tblj).forEach(key => delete tblj[key])

    // 更新HP存储库（利息计算和提取标记重置）
    for (const player of Object.keys(hpBank)) {
      const bankData = hpBank[player]

      // 只有已经储值的存储库才计算利息
      if (bankData.depositMade && bankData.balance > 0) {
        const oldBalance = bankData.balance
        // 分档利息计算：<10000为10%，10000-19999为8%，20000-29999为6%，30000-39999为4%，40000-49999为2%，>=50000为1%
        let interestRate, rateLabel
        if (oldBalance < 10000) {
          interestRate = 0.10
          rateLabel = '10%'
        } else if (oldBalance < 20000) {
          interestRate = 0.08
          rateLabel = '8%'
        } else if (oldBalance < 30000) {
          interestRate = 0.06
          rateLabel = '6%'
        } else if (oldBalance < 40000) {
          interestRate = 0.04
          rateLabel = '4%'
        } else if (oldBalance < 50000) {
          interestRate = 0.02
          rateLabel = '2%'
        } else {
          interestRate = 0.01
          rateLabel = '1%'
        }
        bankData.balance = bankData.balance * (1 + interestRate)

        addLog(`${player}的存储库获得${rateLabel}利息：${Math.floor(oldBalance)} → ${Math.floor(bankData.balance)}`)

        // 检查是否低于2000，如果是则自动销毁
        if (bankData.balance < 2000) {
          addLog(`${player}的存储库余额低于2000，自动销毁`)
          delete hpBank[player]
        }
      }

      // 重置本回合提取标记
      if (bankData.hasWithdrawnThisRound) {
        bankData.hasWithdrawnThisRound = false
      }
    }

    // 更新中心投影（海市蜃楼）
    for (const player of Object.keys(centerProjection)) {
      if (centerProjection[player].roundsLeft > 0) {
        centerProjection[player].roundsLeft--
        if (centerProjection[player].roundsLeft <= 0) {
          delete centerProjection[player]
          addLog(`${player}的中心投影消失`)
        }
      }
    }

    // 更新禁用技能（事半功倍）
    for (const opponent of Object.keys(bannedSkills)) {
      const skills = bannedSkills[opponent]
      for (const skillName of Object.keys(skills)) {
        if (skills[skillName] > 0) {
          skills[skillName]--
          if (skills[skillName] <= 0) {
            delete skills[skillName]
            addLog(`${opponent}的${skillName}技能禁用解除`)
          }
        }
      }
      // 如果该玩家所有技能都解禁了，删除该玩家条目
      if (Object.keys(skills).length === 0) {
        delete bannedSkills[opponent]
      }
    }

    // 更新目不转睛状态
    for (const player of Object.keys(stareDown)) {
      if (stareDown[player].roundsLeft > 0) {
        stareDown[player].roundsLeft--
        if (stareDown[player].roundsLeft <= 0) {
          delete stareDown[player]
          addLog(`${player}的目不转睛状态消失，可以正常使用技能了`)
        }
      }
    }

    // 更新电磁感应链接
    if (dcgy.value && Array.isArray(dcgy.value)) {
      dcgy.value = dcgy.value.filter(link => {
        if (link.roundsLeft > 0) {
          link.roundsLeft--
          // 清空本回合伤害记录
          link.damagedThisRound = []
          if (link.roundsLeft <= 0) {
            addLog(`${link.caster}对${link.target}的电磁感应链接消失`)
            return false
          }
          return true
        }
        return false
      })
    }

    // 更新生于紫室状态（每回合HP增加初始HP的10%）
    // 参考 citycard_web.html lines 10810-10850
    for (const player of Object.keys(purpleChamber)) {
      const chamberCityIdx = purpleChamber[player]
      if (chamberCityIdx === undefined) continue

      const playerObj = players.value.find(p => p.name === player)
      if (!playerObj) continue

      const city = playerObj.cities[chamberCityIdx]
      if (!city || city.currentHp <= 0 || city.isAlive === false) continue

      // 获取初始HP（考虑initialCities记录）
      const baseHp = initialCities[player] && initialCities[player][chamberCityIdx]
        ? initialCities[player][chamberCityIdx].hp
        : city.hp

      const increaseAmount = Math.floor(baseHp * 0.1)
      const before = city.currentHp
      city.currentHp = Math.min(city.currentHp + increaseAmount, 120000) // 应用HP上限

      addLog(`(生于紫室) ${player}的${city.name} HP增加${increaseAmount}（${Math.floor(before)} → ${Math.floor(city.currentHp)}）`)
    }

    // 更新深藏不露状态（每连续5回合未出战自动增加10000HP）
    // 参考 citycard_web.html lines 10758-10807
    for (const player of Object.keys(hiddenGrowth)) {
      if (!hiddenGrowth[player]) continue

      const playerObj = players.value.find(p => p.name === player)
      if (!playerObj) continue

      // 获取本轮出战城市列表（从roundActions或lastOut记录）
      const lastOut = []
      roundActions.value.forEach(action => {
        if (action.round === currentRound.value && action.player === player && action.action === 'deploy') {
          if (action.details && action.details.cityIdx !== undefined) {
            lastOut.push(action.details.cityIdx)
          }
        }
      })

      for (const cityIdx of Object.keys(hiddenGrowth[player])) {
        const idx = +cityIdx
        const cfg = hiddenGrowth[player][idx]
        if (!cfg || !cfg.active) continue

        const city = playerObj.cities[idx]
        if (!city) continue

        // 检查城市是否阵亡
        if (city.currentHp <= 0 || city.isAlive === false) {
          if (!cfg.everDied) {
            cfg.everDied = true
            cfg.active = false
            addLog(`(深藏不露) ${player}的${city.name} 已阵亡，深藏不露效果失效`)
          }
          continue
        }

        // 检查是否本轮出战
        const didFight = lastOut.includes(idx)

        if (didFight) {
          // 出战了，重置回合数
          if (cfg.idleRounds > 0) {
            addLog(`(深藏不露) ${player}的${city.name} 本轮出战，未出战回合数重置`)
          }
          cfg.idleRounds = 0
        } else {
          // 未出战，增加回合数
          cfg.idleRounds += 1

          // 每5回合增加10000HP
          if (cfg.idleRounds % 5 === 0) {
            const before = city.currentHp
            city.currentHp = Math.min(city.currentHp + 10000, 120000) // 应用HP上限
            addLog(`(深藏不露) ${player}的${city.name} 连续${cfg.idleRounds}回合未出战，HP +10000（${Math.floor(before)} → ${Math.floor(city.currentHp)}）`)
          }
        }
      }
    }

    // 重置颜色技能使用状态
    resetColorSkillsUsed()
  }

  // ========== 技能使用追踪 ==========

  // 记录技能使用
  function recordSkillUsage(playerName, skillName) {
    if (!skillUsageTracking[playerName]) {
      skillUsageTracking[playerName] = {}
    }
    if (!skillUsageTracking[playerName][skillName]) {
      skillUsageTracking[playerName][skillName] = 0
    }
    skillUsageTracking[playerName][skillName]++
  }

  // 获取技能使用次数
  function getSkillUsageCount(playerName, skillName) {
    if (!skillUsageTracking[playerName]) return 0
    return skillUsageTracking[playerName][skillName] || 0
  }

  // 获取技能冷却时间
  function getSkillCooldown(playerName, skillName) {
    if (!cooldowns[playerName]) return 0
    return cooldowns[playerName][skillName] || 0
  }

  // 设置技能冷却时间
  function setSkillCooldown(playerName, skillName, rounds) {
    if (!cooldowns[playerName]) {
      cooldowns[playerName] = {}
    }
    cooldowns[playerName][skillName] = rounds
  }

  // 清除技能冷却时间（"一触即发"技能使用）
  function clearSkillCooldown(playerName, skillName) {
    if (cooldowns[playerName] && cooldowns[playerName][skillName]) {
      cooldowns[playerName][skillName] = 0
    }
  }

  // 增加技能使用次数上限（"突破瓶颈"技能使用）
  // 注意：此函数用于减少已使用次数，实现上限+1的效果
  function decreaseSkillUsageCount(playerName, skillName) {
    if (skillUsageTracking[playerName] && skillUsageTracking[playerName][skillName] > 0) {
      skillUsageTracking[playerName][skillName]--
      return true
    }
    return false
  }

  return {
    // ========== 基础状态 ==========
    players,
    currentRound,
    gameMode,
    logs,
    playerStates,
    playerCount,

    // ========== 城市管理状态 ==========
    usedCities,
    initialCities,
    deadCities,

    // ========== 技能状态追踪 ==========
    cautiousExchange,
    anchored,
    ironCities,
    protections,
    disguisedCities,
    knownCities,

    // ========== 战斗技能标记 ==========
    qinwang,
    cmjb,
    yueyueyong,
    attract,
    jilaizan,
    ironwall,
    barrier,
    yujia,
    foresee,
    reflect,

    // ========== 非战斗技能状态 ==========
    goldLoanRounds,
    bannedCities,
    fatigueStreaks,
    brickJade,
    hiddenGrowth,
    timeBombs,
    cityTrialUsed,
    berserkFired,
    buffs,
    stolenSkills,
    stealth,
    costIncrease,
    disaster,
    forceDeployTwo,
    cannotStandDown,
    financialCrisis,
    burnBridge,
    skillProtection,
    yiyidl,
    sdxj,
    changeFlagMark,
    wwjz,
    wwjzUsageCount,
    dizzy,
    yqgzMarks,
    ccjj,
    gawhUser,
    tblj,
    reversedCapitals,
    hpBank,
    centerProjection,
    bannedSkills,
    stareDown,
    dcgy,
    forcedSoldierBan,
    potentialOverflow,
    bbgs,
    subCenters,
    purpleChamber,

    // ========== 交互流程 ==========
    pendingFortuneSwap,
    pendingPreemptiveStrike,
    ldtj,

    // ========== 护盾系统 ==========
    jianbukecui,

    // ========== 无懈可击相关 ==========
    lastSkillUsed,
    gameStateSnapshot,

    // ========== 技能使用追踪 ==========
    skillUsageTracking,
    cooldowns,

    // ========== 按兵不动隐藏城市系统 ==========
    standGroundCities,

    // ========== 颜色技能使用追踪 ==========
    colorSkillsUsed,

    // ========== 私有日志系统 ==========
    playerPrivateLogs,

    // ========== 回合行动记录 ==========
    roundActions,

    // ========== 基础方法 ==========
    addPlayer,
    removePlayer,
    addLog,
    addPrivateLog,
    clearLogs,
    resetGame,
    nextRound,
    addRoundAction,

    // ========== 颜色技能管理方法 ==========
    resetColorSkillsUsed,
    isColorSkillUsed,
    markColorSkillUsed,

    // ========== 城市池管理方法 ==========
    getUnusedCities,
    markCityAsUsed,
    getCityByName,
    getCitiesByProvince,
    getProvinceOfCity,

    // ========== 谨慎交换集合方法 ==========
    isInCautiousSet,
    addToCautiousSet,
    removeFromCautiousSet,

    // ========== 护盾和保护方法 ==========
    isBlockedByJianbukecui,
    hasProtection,
    hasIronShield,
    checkMirageBlock,
    consumeProtection,
    isSubCenter,

    // ========== 城市状态方法 ==========
    isCityKnown,
    setCityKnown,
    clearCityKnownStatus,
    handleBuBuGaoShengSummon,
    checkCenterDeathAndPurpleChamberInheritance,

    // ========== 快照系统方法 ==========
    createGameStateSnapshot,
    restoreGameStateSnapshot,

    // ========== 回合更新方法 ==========
    updateRoundStates,

    // ========== 技能追踪方法 ==========
    recordSkillUsage,
    getSkillUsageCount,
    getSkillCooldown,
    setSkillCooldown,
    clearSkillCooldown,
    decreaseSkillUsageCount
  }
})
