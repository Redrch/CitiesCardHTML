<template>
  <div id="playerMode">
    <button v-if="currentStep !== 'menu'" class="exit-btn" @click="handleExit">← 返回主菜单</button>

    <div class="player-container">
      <!-- Firebase配置步骤 -->
      <FirebaseConfig
        v-if="currentStep === 'firebase-config'"
        @initialized="handleFirebaseInitialized"
        @skip="handleFirebaseSkip"
      />

      <!-- 房间选择步骤 -->
      <RoomSelection
        v-if="currentStep === 'room-selection'"
        @room-created="handleRoomCreated"
        @room-joined="handleRoomJoined"
      />

      <!-- 等待房间步骤 -->
      <WaitingRoom
        v-if="currentStep === 'waiting-room'"
        :room-id="currentRoomId"
        :force-spectator="forceSpectator"
        :initial-room-data="initialRoomData"
        @all-ready="handleAllReady"
        @player-joined="handlePlayerJoined"
      />

      <!-- 选择中心城市步骤 -->
      <CenterCitySelection
        v-if="currentStep === 'center-city-selection'"
        :player-name="currentPlayer?.name || ''"
        :cities="currentPlayer?.cities || []"
        :initial-center-index="centerCityIndex"
        :current-draw-count="playerDrawCount"
        @center-selected="handleCenterSelected"
        @confirm="handleCenterConfirmed"
        @redraw="handleRedrawCities"
      />

      <!-- 游戏进行中（带固定日志面板的布局） -->
      <div v-if="currentStep === 'game'" class="game-with-log-layout">
        <!-- 左侧：游戏主界面 -->
        <div class="game-main-area">
          <GameBoard
            :show-battle-area="false"
            :current-battle="null"
            @show-skills="showSkillSelector = true"
            @exit="handleExit"
            @use-skill="handleUseSkill"
            @end-turn="handleEndTurn"
            @heal-city="handleHealCity"
            @quick-skill="handleQuickSkill"
          />
        </div>

        <!-- 右侧：固定日志面板 -->
        <div class="game-log-area">
          <GameLogSimple />
        </div>
      </div>
    </div>

    <!-- 游戏日志模态框（仅在非game步骤显示） -->
    <GameLog v-if="currentStep !== 'game'" :show="showLog" @close="showLog = false" />

    <!-- 技能选择模态框 -->
    <SkillSelector
      v-if="showSkillSelector"
      :current-player="currentPlayer"
      @close="showSkillSelector = false"
      @skill-selected="handleSkillSelected"
    />

    <!-- 胜利/失败模态框 -->
    <div v-if="showVictory && gameLogic?.isGameOver?.value" class="victory-modal" @click.self="handleExit">
      <div class="victory-content">
        <div class="victory-animation">
          <div class="trophy">🏆</div>
          <div class="fireworks">✨🎉✨</div>
        </div>
        <h2 class="victory-title">
          {{ gameLogic.winner.value?.name }} 获得胜利！
        </h2>
        <div class="victory-stats">
          <div class="stat-item">
            <span class="stat-label">总回合数</span>
            <span class="stat-value">{{ gameStore.currentRound }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">剩余金币</span>
            <span class="stat-value">{{ gameLogic.winner.value?.gold || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">存活城市</span>
            <span class="stat-value">
              {{ gameLogic.winner.value?.cities?.filter(c => c.isAlive).length || 0 }}
            </span>
          </div>
        </div>
        <div class="victory-actions">
          <button class="victory-btn victory-btn--restart" @click="restartGame">
            🔄 再来一局
          </button>
          <button class="victory-btn victory-btn--exit" @click="handleExit">
            🏠 返回主菜单
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { autoInitFirebase } from '../../composables/useFirebase'
import { useRoom } from '../../composables/useRoom'
import { useGameLogic } from '../../composables/useGameLogic'
import { useCityDraw } from '../../composables/useCityDraw'
import { addSkillUsageLog, addSkillEffectLog } from '../../composables/game/logUtils'
import FirebaseConfig from '../Firebase/FirebaseConfig.vue'
import RoomSelection from '../Room/RoomSelection.vue'
import WaitingRoom from '../Room/WaitingRoom.vue'
import CenterCitySelection from './CenterCitySelection.vue'
import GameBoard from '../Game/GameBoard.vue'
import GameLog from '../Game/GameLog.vue'
import GameLogSimple from '../Game/GameLogSimple.vue'
import SkillSelector from '../Skills/SkillSelector.vue'

const emit = defineEmits(['exit'])

const gameStore = useGameStore()
const { leaveRoom, getRoomData, saveRoomData, startRoomListener, stopRoomListener } = useRoom()
const gameLogic = useGameLogic()
const { drawCities, getUsedNames } = useCityDraw()

// 步骤: firebase-config, room-selection, waiting-room, center-city-selection, game
const currentStep = ref('firebase-config')
const currentRoomId = ref('')
const forceSpectator = ref(false)
const initialRoomData = ref(null)
const showLog = ref(false)
const showSkillSelector = ref(false)
const showVictory = ref(false)
const currentPlayer = ref(null)
const gameMode = ref('2P')
const centerCityIndex = ref(null)
const playerDrawCount = ref(1)
let roomDataListener = null

onMounted(() => {
  // 尝试自动初始化Firebase
  const initialized = autoInitFirebase()
  if (initialized) {
    // 如果自动初始化成功，跳过配置步骤
    currentStep.value = 'room-selection'
  }
})

/**
 * Firebase初始化完成
 */
function handleFirebaseInitialized() {
  currentStep.value = 'room-selection'
}

/**
 * 跳过Firebase配置（使用本地模式）
 */
function handleFirebaseSkip() {
  currentStep.value = 'room-selection'
}

/**
 * 房间创建完成
 */
function handleRoomCreated(roomId) {
  currentRoomId.value = roomId
  currentStep.value = 'waiting-room'
}

/**
 * 加入房间完成
 */
function handleRoomJoined({ roomId, roomData, isRoomFull }) {
  currentRoomId.value = roomId
  forceSpectator.value = isRoomFull
  initialRoomData.value = roomData
  gameMode.value = roomData.mode || '2P'
  currentStep.value = 'waiting-room'
}

/**
 * 所有玩家准备完毕
 */
async function handleAllReady(players) {
  console.log('[PlayerMode] 所有玩家已准备，开始游戏流程', players)

  // 从房间数据中获取当前玩家的完整信息
  const roomData = await getRoomData(currentRoomId.value)
  if (roomData) {
    const playerData = roomData.players.find(p => p.name === currentPlayer.value?.name)
    if (playerData) {
      console.log('[PlayerMode] handleAllReady - 初始化currentPlayer')
      console.log('[PlayerMode] 玩家名称:', playerData.name)
      console.log('[PlayerMode] 城市数量:', playerData.cities.length)
      console.log('[PlayerMode] 城市列表:', playerData.cities.map(c => c.name))
      console.log('[PlayerMode] 这是用户将在选择界面看到的初始城市列表')

      // 初始化currentPlayer - 关键修复：深度克隆以避免引用共享
      currentPlayer.value = JSON.parse(JSON.stringify(playerData))
      console.log('[PlayerMode] currentPlayer已深度克隆，独立于roomData')
      gameMode.value = roomData.mode || '2P'

      // 根据游戏模式决定下一步
      if (gameMode.value === '2P' || gameMode.value === '2v2') {
        // 2P和2v2需要选择中心城市
        currentStep.value = 'center-city-selection'
        console.log('[PlayerMode] 进入中心城市选择界面')
      } else {
        // 3P直接选择预备城市
        currentStep.value = 'roster-selection'
        console.log('[PlayerMode] 进入预备城市选择界面')
      }
    }
  }
}

/**
 * 玩家加入房间
 */
function handlePlayerJoined({ name, asSpectator }) {
  console.log('[PlayerMode] 玩家加入房间', { name, asSpectator })
  if (!currentPlayer.value) {
    currentPlayer.value = { name }
  }
}

/**
 * 选择中心城市
 */
async function handleCenterSelected(idx) {
  centerCityIndex.value = idx

  // 保存到房间数据（只更新centerIndex，不修改cities）
  if (currentRoomId.value && currentPlayer.value) {
    const roomData = await getRoomData(currentRoomId.value)
    if (roomData) {
      const playerIdx = roomData.players.findIndex(p => p.name === currentPlayer.value.name)
      if (playerIdx !== -1) {
        // 只更新centerIndex，保持其他字段不变
        roomData.players[playerIdx].centerIndex = idx
        await saveRoomData(currentRoomId.value, roomData)
        console.log('[PlayerMode] 中心城市已保存到房间数据，cities未被修改')
      }
    }
  }
}

/**
 * 确认中心城市
 */
async function handleCenterConfirmed(idx) {
  centerCityIndex.value = idx
  console.log('[PlayerMode] 确认中心城市，开始游戏')
  console.log('[PlayerMode] handleCenterConfirmed - 确认前currentPlayer:', currentPlayer.value?.name)
  console.log('[PlayerMode] handleCenterConfirmed - 确认前cities:', currentPlayer.value?.cities?.map(c => c.name))

  // 同步roomData到currentPlayer，但保持cities数组引用一致
  if (currentRoomId.value && currentPlayer.value) {
    const roomData = await getRoomData(currentRoomId.value)
    if (roomData) {
      const playerIdx = roomData.players.findIndex(p => p.name === currentPlayer.value.name)
      if (playerIdx !== -1) {
        roomData.players[playerIdx].ready = true // 标记为准备完成
        await saveRoomData(currentRoomId.value, roomData)
      }

      // 同步玩家数据到 gameStore
      syncRoomDataToGameStore(roomData)

      const updatedPlayerData = roomData.players.find(p => p.name === currentPlayer.value.name)
      if (updatedPlayerData) {
        // 只更新其他字段（centerIndex等），保持cities引用不变
        currentPlayer.value = {
          ...updatedPlayerData,
          cities: currentPlayer.value.cities  // 明确保持原有cities数组引用
        }
        console.log('[PlayerMode] 已同步centerIndex等字段，cities引用保持不变')
      }
    }
  }

  // 直接进入游戏
  currentStep.value = 'game'
}

/**
 * 处理重新抽取城市
 */
async function handleRedrawCities() {
  console.log('[PlayerMode] 重新抽取城市')

  if (playerDrawCount.value >= 5) {
    console.warn('[PlayerMode] 已达最大重抽次数')
    return
  }

  if (!currentRoomId.value || !currentPlayer.value) {
    console.error('[PlayerMode] 缺少房间或玩家信息')
    return
  }

  try {
    const roomData = await getRoomData(currentRoomId.value)
    if (!roomData) {
      console.error('[PlayerMode] 无法获取房间数据')
      return
    }

    const playerIdx = roomData.players.findIndex(p => p.name === currentPlayer.value.name)
    if (playerIdx === -1) {
      console.error('[PlayerMode] 未找到当前玩家')
      return
    }

    // 获取已被其他玩家使用的城市名称
    const excludeCities = getUsedNames(roomData.players, playerIdx)

    // 确定抽取数量
    const citiesPerPlayer = gameMode.value === '2v2' ? 7 : 10

    // 重新抽取城市
    const newCities = drawCities(citiesPerPlayer, excludeCities)

    // 更新玩家城市
    roomData.players[playerIdx].cities = newCities

    // 清空之前选择的中心城市和预备城市
    roomData.players[playerIdx].centerIndex = null
    roomData.players[playerIdx].roster = []

    // 保存到房间数据
    await saveRoomData(currentRoomId.value, roomData)

    // 关键修复：深度克隆避免引用共享，从roomData获取更新后的玩家对象
    const updatedPlayerData = JSON.parse(JSON.stringify(roomData.players[playerIdx]))
    console.log('[PlayerMode] 重新抽取后更新currentPlayer（深度克隆）')
    console.log('[PlayerMode] 新城市列表:', updatedPlayerData.cities.map(c => c.name))
    currentPlayer.value = updatedPlayerData
    centerCityIndex.value = null
    rosterCities.value = []

    // 增加抽取次数
    playerDrawCount.value++

    console.log('[PlayerMode] 城市已重新抽取，共', updatedPlayerData.cities.length, '个城市')
  } catch (error) {
    console.error('[PlayerMode] 重新抽取城市失败:', error)
  }
}

/**
 * 处理退出
 */
async function handleExit() {
  if (confirm('确定要退出到主菜单吗？当前数据可能会丢失。')) {
    // 停止监听
    if (roomDataListener) {
      stopRoomListener()
      roomDataListener = null
    }

    // 离开房间（清理资源）
    if (currentRoomId.value && currentPlayer.value) {
      await leaveRoom(currentRoomId.value, currentPlayer.value.name)
    }

    emit('exit')
  }
}

// 组件卸载时清理
onUnmounted(() => {
  if (roomDataListener) {
    stopRoomListener()
    roomDataListener = null
  }
})

/**
 * 处理技能使用
 */
function handleUseSkill(skill) {
  console.log('[PlayerMode] 使用技能', skill)
  // TODO: 实现技能使用逻辑
}

/**
 * 处理回合结束
 * 参考 citycard_web.html lines 10455-10510
 */
async function handleEndTurn() {
  console.log('[PlayerMode] 结束回合')

  if (!currentRoomId.value || !currentPlayer.value) {
    console.error('[PlayerMode] 缺少房间或玩家信息')
    return
  }

  // 获取最新房间数据
  const roomData = await getRoomData(currentRoomId.value)
  if (!roomData) {
    console.error('[PlayerMode] 无法获取房间数据')
    return
  }

  // 1. 执行所有回合结束状态更新
  // 这包括：屏障倒计时、保护罩倒计时、禁用倒计时、越战越勇、战力加成、
  // 移花接木、不露踪迹、定海神针、定时爆破、深藏不露、生于紫室、
  // 金币贷款、金融危机、目不转睛、抛砖引玉、血量存储利息、海市蜃楼、厚积薄发等
  gameStore.updateRoundStates()
  console.log('[PlayerMode] 回合结束状态更新完成')

  // 2. 清空单回合效果（参考HTML lines 10493-10501）
  gameStore.qinwang = null
  gameStore.cmjb = null
  gameStore.ironwall = null
  gameStore.foresee = null
  gameStore.yujia = null

  // 清空反戈一击
  Object.keys(gameStore.reflect).forEach(key => delete gameStore.reflect[key])

  // 清空一举两得
  Object.keys(gameStore.forceDeployTwo).forEach(key => delete gameStore.forceDeployTwo[key])
  Object.keys(gameStore.cannotStandDown).forEach(key => delete gameStore.cannotStandDown[key])

  // 清空声东击西
  Object.keys(gameStore.sdxj).forEach(key => delete gameStore.sdxj[key])

  // 清空以逸待劳
  Object.keys(gameStore.yiyidl).forEach(key => delete gameStore.yiyidl[key])

  // 清空围魏救赵
  Object.keys(gameStore.wwjz).forEach(key => delete gameStore.wwjz[key])

  // 清空晕头转向
  Object.keys(gameStore.dizzy).forEach(key => delete gameStore.dizzy[key])

  // 清空草船借箭
  Object.keys(gameStore.ccjj).forEach(key => delete gameStore.ccjj[key])

  // 清空隔岸观火
  gameStore.gawhUser = null

  // 清空挑拨离间
  Object.keys(gameStore.tblj).forEach(key => delete gameStore.tblj[key])

  console.log('[PlayerMode] 单回合效果已清空')

  // 3. 回合数+1（参考HTML line 10504）
  gameStore.currentRound++
  console.log(`[PlayerMode] 进入第 ${gameStore.currentRound} 回合`)

  // 4. 同步更新后的状态到Firebase
  // 更新玩家数据
  roomData.players.forEach((player, idx) => {
    const gameStorePlayer = gameStore.players.find(p => p.name === player.name)
    if (gameStorePlayer) {
      // 同步城市HP和存活状态
      player.cities = gameStorePlayer.cities.map(city => ({
        ...city,
        currentHp: city.currentHp,
        isAlive: city.isAlive !== false
      }))
      // 同步金币
      player.gold = gameStorePlayer.gold
    }
  })

  // 更新游戏状态
  if (!roomData.gameState) {
    roomData.gameState = {}
  }
  roomData.gameState.currentRound = gameStore.currentRound

  // 保存到Firebase
  await saveRoomData(currentRoomId.value, roomData)
  console.log('[PlayerMode] 回合结束状态已同步到Firebase')

  // 5. 添加日志
  gameStore.addLog(`第 ${gameStore.currentRound} 回合开始`)
}

/**
 * 处理治疗城市
 */
function handleHealCity(city) {
  console.log('[PlayerMode] 治疗城市', city)
  // TODO: 实现治疗逻辑
}

/**
 * 处理快速技能
 */
function handleQuickSkill(skill) {
  console.log('[PlayerMode] 快速技能', skill)
  // TODO: 实现快速技能逻辑
}

/**
 * 处理技能选择
 * 参考 citycard_web.html 技能执行逻辑
 */
async function handleSkillSelected(skillData) {
  console.log('[PlayerMode] 技能已选择', skillData)
  showSkillSelector.value = false

  if (!skillData || !skillData.skillName) {
    console.error('[PlayerMode] 技能数据无效')
    return
  }

  if (!currentRoomId.value || !currentPlayer.value) {
    console.error('[PlayerMode] 缺少房间或玩家信息')
    return
  }

  // 获取最新房间数据
  const roomData = await getRoomData(currentRoomId.value)
  if (!roomData) {
    console.error('[PlayerMode] 无法获取房间数据')
    return
  }

  // 找到当前玩家在gameStore中的对象
  const caster = gameStore.players.find(p => p.name === currentPlayer.value.name)
  if (!caster) {
    console.error('[PlayerMode] 未找到当前玩家')
    return
  }

  // 准备技能参数
  const { skillName, targetPlayerName, targetCityIdx, selfCityIdx, amount } = skillData

  // 找到目标玩家（如果需要）
  let target = null
  if (targetPlayerName) {
    target = gameStore.players.find(p => p.name === targetPlayerName)
    if (!target) {
      console.error('[PlayerMode] 未找到目标玩家')
      return
    }
  }

  // 找到目标城市（如果需要）
  let targetCity = null
  if (target && targetCityIdx !== undefined && targetCityIdx !== null) {
    targetCity = target.cities[targetCityIdx]
  }

  // 找到自己的城市（如果需要）
  let selfCity = null
  if (selfCityIdx !== undefined && selfCityIdx !== null) {
    selfCity = caster.cities[selfCityIdx]
  }

  // 动态导入技能模块
  const battleSkills = await import('../../composables/skills/battleSkills.js')
  const nonBattleSkills = await import('../../composables/skills/nonBattleSkills.js')

  // 根据技能名称调用对应的执行函数
  let result = null
  try {
    // 战斗金币技能映射
    const battleSkillMap = {
      '擒贼擒王': () => battleSkills.useBattleSkills().executeQinZeiQinWang(caster, target),
      '草木皆兵': () => battleSkills.useBattleSkills().executeCaoMuJieBing(caster, target),
      '越战越勇': () => battleSkills.useBattleSkills().executeYueZhanYueYong(caster, selfCity),
      '吸引攻击': () => battleSkills.useBattleSkills().executeXiYinGongJi(caster, selfCity),
      '铜墙铁壁': () => battleSkills.useBattleSkills().executeTongQiangTieBi(caster, target),
      '背水一战': () => battleSkills.useBattleSkills().executeBeiShuiYiZhan(caster, selfCity),
      '料事如神': () => battleSkills.useBattleSkills().executeLiaoShiRuShen(caster, target, targetCity),
      '同归于尽': () => battleSkills.useBattleSkills().executeTongGuiYuJin(caster, selfCity),
      '设置屏障': () => battleSkills.useBattleSkills().executeSetBarrier(caster),
      '潜能激发': () => battleSkills.useBattleSkills().executeQianNengJiFa(caster),
      '御驾亲征': () => battleSkills.useBattleSkills().executeYuJiaQinZheng(caster, target),
      '狂暴模式': () => battleSkills.useBattleSkills().executeKuangBaoMoShi(caster, selfCity),
      '按兵不动': () => battleSkills.useBattleSkills().executeAnBingBuDong(caster),
      '既来则安': () => battleSkills.useBattleSkills().executeJiLaiZeAn(caster, selfCity),
      '反戈一击': () => battleSkills.useBattleSkills().executeFanGeYiJi(caster, target),
      '暗度陈仓': () => battleSkills.useBattleSkills().executeAnDuChenCang(caster),
      '声东击西': () => battleSkills.useBattleSkills().executeShengDongJiXi(caster, target),
      '以逸待劳': () => battleSkills.useBattleSkills().executeYiYiDaiLao(caster, target),
      '草船借箭': () => battleSkills.useBattleSkills().executeCaoChuanJieJian(caster, target),
      '围魏救赵': () => battleSkills.useBattleSkills().executeWeiWeiJiuZhao(caster, target),
      '欲擒故纵': () => battleSkills.useBattleSkills().executeYuQinGuZong(caster, target, targetCity),
      '晕头转向': () => battleSkills.useBattleSkills().executeYunTouZhuanXiang(caster, target),
      '隔岸观火': () => battleSkills.useBattleSkills().executeGeAnGuanHuo(caster, target),
      '挑拨离间': () => battleSkills.useBattleSkills().executeTiaoBoBaoLiJian(caster, target),
      '趁火打劫': () => battleSkills.useBattleSkills().executeChenHuoDaJie(caster, target),
      '玉碎瓦全': () => battleSkills.useBattleSkills().executeYuSuiWaQuan(caster, target, targetCityIdx),
      '合纵连横': () => battleSkills.useBattleSkills().executeHeZongLianHeng(caster, target),
      '目不转睛': () => battleSkills.useBattleSkills().executeMuBuZhuanJing(caster, target),
      '抛砖引玉': () => battleSkills.useBattleSkills().executePaoZhuanYinYu(caster)
    }

    // 非战斗金币技能映射（完整版 - 按功能分类）
    const nonBattleSkillMap = {
      // ========== 1. 资源管理类 (7个) ==========
      '转账给他人': () => nonBattleSkills.useNonBattleSkills().executeTransferGold(caster, target, amount),
      '金币贷款': () => nonBattleSkills.useNonBattleSkills().executeGoldLoan(caster),
      '金融危机': () => nonBattleSkills.useNonBattleSkills().executeFinancialCrisis(caster),
      '釜底抽薪': () => nonBattleSkills.useNonBattleSkills().executeFuDiChouXin(caster, target),
      '趁火打劫': () => nonBattleSkills.useNonBattleSkills().executeChenHuoDaJie(caster, target),
      '计划单列': () => nonBattleSkills.useNonBattleSkills().executeJiHuaDanLie(caster, selfCityIdx),
      '无中生有': () => nonBattleSkills.useNonBattleSkills().executeWuZhongShengYou(caster),

      // ========== 2. 治疗/HP增强类 (10个) ==========
      '快速治疗': () => nonBattleSkills.useNonBattleSkills().executeQuickHeal(caster, selfCityIdx),
      '高级治疗': () => nonBattleSkills.useNonBattleSkills().executeAdvancedHeal(caster, [selfCityIdx]),
      '借尸还魂': () => nonBattleSkills.useNonBattleSkills().executeJieShiHuanHun(caster, selfCityIdx),
      '实力增强': () => nonBattleSkills.useNonBattleSkills().executeShiLiZengQiang(caster),
      '士气大振': () => nonBattleSkills.useNonBattleSkills().executeShiQiDaZhen(caster),
      '苟延残喘': () => nonBattleSkills.useNonBattleSkills().executeGouYanCanChuan(caster),
      '众志成城': () => nonBattleSkills.useNonBattleSkills().executeZhongZhiChengCheng(caster),
      '焕然一新': () => nonBattleSkills.useNonBattleSkills().executeHuanRanYiXin(caster, selfCityIdx),
      '厚积薄发': () => nonBattleSkills.useNonBattleSkills().executeHouJiBaoFa(caster, selfCityIdx),
      '血量存储': () => nonBattleSkills.useNonBattleSkills().executeHpBank(caster, selfCityIdx, amount),

      // ========== 3. 保护/防御类 (12个) ==========
      '城市保护': () => nonBattleSkills.useNonBattleSkills().executeCityProtection(caster, selfCityIdx),
      '钢铁城市': () => nonBattleSkills.useNonBattleSkills().executeIronCity(caster, selfCityIdx),
      '定海神针': () => nonBattleSkills.useNonBattleSkills().executeDingHaiShenZhen(caster, selfCityIdx),
      '坚不可摧': () => nonBattleSkills.useNonBattleSkills().executeJianBuKeCui(caster),
      '步步高升': () => nonBattleSkills.useNonBattleSkills().executeBuBuGaoSheng(caster, selfCityIdx),
      '海市蜃楼': () => nonBattleSkills.useNonBattleSkills().executeHaiShiShenLou(caster),
      '副中心制': () => nonBattleSkills.useNonBattleSkills().executeFuZhongXinZhi(caster, selfCityIdx),
      '生于紫室': () => nonBattleSkills.useNonBattleSkills().executeShengYuZiShi(caster, selfCityIdx),
      '深藏不露': () => nonBattleSkills.useNonBattleSkills().executeShenCangBuLu(caster, selfCity),
      '技能保护': () => nonBattleSkills.useNonBattleSkills().executeJiNengBaoHu(caster, skillName),

      // ========== 4. 攻击/伤害类 (18个) ==========
      '无知无畏': () => nonBattleSkills.useNonBattleSkills().executeWuZhiWuWei(caster, target, selfCityIdx),
      '提灯定损': () => nonBattleSkills.useNonBattleSkills().executeTiDengDingSun(caster, target, targetCityIdx),
      '连续打击': () => nonBattleSkills.useNonBattleSkills().executeLianXuDaJi(caster, target),
      '波涛汹涌': () => nonBattleSkills.useNonBattleSkills().executeBotaoXiongYong(caster, target),
      '狂轰滥炸': () => nonBattleSkills.useNonBattleSkills().executeKuangHongLanZha(caster, target),
      '横扫一空': () => nonBattleSkills.useNonBattleSkills().executeHengSaoYiKong(caster, target),
      '万箭齐发': () => nonBattleSkills.useNonBattleSkills().executeWanJianQiFa(caster, target),
      '降维打击': () => nonBattleSkills.useNonBattleSkills().executeJiangWeiDaJi(caster, target, targetCityIdx),
      '定时爆破': () => nonBattleSkills.useNonBattleSkills().executeDingShiBaoPo(caster, target, targetCityIdx),
      '永久摧毁': () => nonBattleSkills.useNonBattleSkills().executeYongJiuCuiHui(caster, target, targetCityIdx),
      '连锁反应': () => nonBattleSkills.useNonBattleSkills().executeLianSuoFanYing(caster, target, targetCityIdx),
      '进制扭曲': () => nonBattleSkills.useNonBattleSkills().executeJinZhiNiuQu(caster, target, targetCityIdx),
      '整齐划一': () => nonBattleSkills.useNonBattleSkills().executeZhengQiHuaYi(caster, target),
      '天灾人祸': () => nonBattleSkills.useNonBattleSkills().executeTianZaiRenHuo(caster, target),
      '自相残杀': () => nonBattleSkills.useNonBattleSkills().executeZiXiangCanSha(caster, target),
      '中庸之道': () => nonBattleSkills.useNonBattleSkills().executeZhongYongZhiDao(caster, target),
      '夷为平地': () => nonBattleSkills.useNonBattleSkills().executeYiWeiPingDi(caster, target, targetCityIdx),
      '招贤纳士': () => nonBattleSkills.useNonBattleSkills().executeZhaoXianNaShi(caster, target, targetCityIdx),

      // ========== 5. 控制/交换类 (15个) ==========
      '先声夺人': () => nonBattleSkills.useNonBattleSkills().executeXianShengDuoRen(caster),
      '时来运转': () => nonBattleSkills.useNonBattleSkills().executeShiLaiYunZhuan(caster, selfCityIdx),
      '人质交换': () => nonBattleSkills.useNonBattleSkills().executeRenZhiJiaoHuan(caster, target, selfCityIdx, targetCityIdx),
      '改弦更张': () => nonBattleSkills.useNonBattleSkills().executeGaiXianGengZhang(caster),
      '拔旗易帜': () => nonBattleSkills.useNonBattleSkills().executeBaQiYiZhi(caster, selfCityIdx),
      '避而不见': () => nonBattleSkills.useNonBattleSkills().executeBiErBuJian(caster, selfCityIdx),
      '狐假虎威': () => nonBattleSkills.useNonBattleSkills().executeHuJiaHuWei(caster, selfCityIdx),
      '李代桃僵': () => nonBattleSkills.useNonBattleSkills().executeLiDaiTaoJiang(caster, selfCityIdx, targetCityIdx),
      '好高骛远': () => nonBattleSkills.useNonBattleSkills().executeHaoGaoWuYuan(caster, target, selfCityIdx, targetCityIdx),
      '数位反转': () => nonBattleSkills.useNonBattleSkills().executeShuWeiFanZhuan(caster, selfCityIdx),
      '战略转移': () => nonBattleSkills.useNonBattleSkills().executeZhanLueZhuanYi(caster, selfCityIdx, targetCityIdx),
      '倒反天罡': () => nonBattleSkills.useNonBattleSkills().executeDaoFanTianGang(caster, target, targetCityIdx),

      // ========== 6. 情报/侦查类 (6个) ==========
      '城市侦探': () => nonBattleSkills.useNonBattleSkills().executeCityDetective(caster, target, targetCityIdx),
      '城市预言': () => nonBattleSkills.useNonBattleSkills().executeCityProphecy(caster, target),
      '明察秋毫': () => nonBattleSkills.useNonBattleSkills().executeMingChaQiuHao(caster, target),
      '一举两得': () => nonBattleSkills.useNonBattleSkills().executeYiJuLiangDe(caster, target),
      '不露踪迹': () => nonBattleSkills.useNonBattleSkills().executeBuLuZongJi(caster, selfCityIdx),
      '博学多才': () => nonBattleSkills.useNonBattleSkills().executeBoXueDuoCai(caster, selfCityIdx),

      // ========== 7. 省份相关类 (11个) ==========
      '四面楚歌': () => nonBattleSkills.useNonBattleSkills().executeSiMianChuGe(caster, target),
      '搬运救兵·普通': () => nonBattleSkills.useNonBattleSkills().executeBanYunJiuBing(caster, selfCityIdx, false),
      '搬运救兵·高级': () => nonBattleSkills.useNonBattleSkills().executeBanYunJiuBing(caster, selfCityIdx, true),
      '大义灭亲': () => nonBattleSkills.useNonBattleSkills().executeDaYiMieQin(caster, selfCityIdx),
      '强制搬运': () => nonBattleSkills.useNonBattleSkills().executeQiangZhiBanYun(caster, target, targetCityIdx),
      '代行省权': () => nonBattleSkills.useNonBattleSkills().executeDaiXingShengQuan(caster, selfCityIdx),
      '守望相助': () => nonBattleSkills.useNonBattleSkills().executeShouWangXiangZhu(caster, selfCityIdx),
      '行政中心': () => nonBattleSkills.useNonBattleSkills().executeXingZhengZhongXin(caster, selfCityIdx),
      '以礼来降': () => nonBattleSkills.useNonBattleSkills().executeYiLiLaiJiang(caster, target, targetCityIdx),
      '趁其不备·随机': () => nonBattleSkills.useNonBattleSkills().executeChenQiBuBei(caster, target, null),
      '趁其不备·指定': () => nonBattleSkills.useNonBattleSkills().executeChenQiBuBei(caster, target, targetCityIdx),

      // ========== 8. 特殊机制类 (14个) ==========
      '无懈可击': () => nonBattleSkills.useNonBattleSkills().executeWuXieKeJi(caster, target),
      '事半功倍': () => nonBattleSkills.useNonBattleSkills().executeShiBanGongBei(caster, target, skillName),
      '过河拆桥': () => nonBattleSkills.useNonBattleSkills().executeGuoHeChaiQiao(caster),
      '解除封锁': () => nonBattleSkills.useNonBattleSkills().executeJieChuFengSuo(caster),
      '一触即发': () => nonBattleSkills.useNonBattleSkills().executeYiChuJiFa(caster, target, targetCityIdx),
      '突破瓶颈': () => nonBattleSkills.useNonBattleSkills().executeTuPoiPingJing(caster, selfCityIdx),
      '当机立断': () => nonBattleSkills.useNonBattleSkills().executeDangJiLiDuan(caster, target),
      '强制迁都·普通': () => nonBattleSkills.useNonBattleSkills().executeQiangZhiQianDu(caster, target, false),
      '强制迁都·高级版': () => nonBattleSkills.useNonBattleSkills().executeQiangZhiQianDu(caster, target, true),
      '言听计从': () => nonBattleSkills.useNonBattleSkills().executeYanTingJiCong(caster, target, targetCityIdx),
      '电磁感应': () => nonBattleSkills.useNonBattleSkills().executeDianCiGanYing(caster, target, targetCityIdx)
    }

    // 查找并执行技能
    if (battleSkillMap[skillName]) {
      result = battleSkillMap[skillName]()
    } else if (nonBattleSkillMap[skillName]) {
      result = nonBattleSkillMap[skillName]()
    } else {
      console.warn('[PlayerMode] 未找到技能实现:', skillName)
      gameStore.addLog(`技能 ${skillName} 尚未实现`)
      return
    }

    // 检查技能执行结果
    if (result && result.success) {
      gameStore.addLog(result.message || `${skillName} 执行成功`)
      console.log('[PlayerMode] 技能执行成功:', result)

      // 同步更新后的状态到Firebase
      // 更新玩家数据
      roomData.players.forEach((player) => {
        const gameStorePlayer = gameStore.players.find(p => p.name === player.name)
        if (gameStorePlayer) {
          // 同步城市HP和存活状态
          player.cities = gameStorePlayer.cities.map(city => ({
            ...city,
            currentHp: city.currentHp,
            isAlive: city.isAlive !== false
          }))
          // 同步金币
          player.gold = gameStorePlayer.gold
        }
      })

      // 保存到Firebase
      await saveRoomData(currentRoomId.value, roomData)
      console.log('[PlayerMode] 技能执行结果已同步到Firebase')
    } else {
      gameStore.addLog(result?.message || `${skillName} 执行失败`)
      console.error('[PlayerMode] 技能执行失败:', result)
    }
  } catch (error) {
    console.error('[PlayerMode] 技能执行异常:', error)
    gameStore.addLog(`技能执行异常: ${error.message}`)
  }
}

/**
 * 确认城市部署
 */
async function handleDeploymentConfirmed({ cities, skill, activatedCitySkills }) {
  console.log('[PlayerMode] 确认城市部署', { cities, skill, activatedCitySkills })
  console.log('[PlayerMode] currentPlayer.name:', currentPlayer.value?.name)
  console.log('[PlayerMode] currentPlayer.cities:')
  currentPlayer.value?.cities.forEach((city, idx) => {
    console.log(`  [${idx}] ${city.name} (HP: ${city.currentHp ?? city.hp})`)
  })

  // 诊断日志：详细显示激活的城市技能
  console.log('[PlayerMode] 激活的城市技能详情:')
  if (activatedCitySkills && Object.keys(activatedCitySkills).length > 0) {
    Object.keys(activatedCitySkills).forEach(cityIdx => {
      const skillData = activatedCitySkills[cityIdx]
      const actualCity = currentPlayer.value?.cities[cityIdx]
      console.log(`  cityIdx=${cityIdx}: skillData.cityName="${skillData.cityName}", actualCity="${actualCity?.name}", 匹配=${skillData.cityName === actualCity?.name}`)
    })
  } else {
    console.log('  (无激活的城市技能)')
  }

  // 保存到房间数据
  if (currentRoomId.value && currentPlayer.value) {
    const roomData = await getRoomData(currentRoomId.value)
    if (!roomData) {
      console.error('[PlayerMode] 无法获取房间数据')
      return
    }

    // 初始化游戏状态（如果还没有）
    if (!roomData.gameState) {
      roomData.gameState = {
        currentRound: 1,
        playerStates: {},
        barrier: null,
        protections: {},
        ironCities: {},
        strengthBoost: {},
        morale: {},
        yqgzMarks: [],
        battleLogs: []
      }
    }

    // 初始化玩家状态（如果还没有）
    if (!roomData.gameState.playerStates[currentPlayer.value.name]) {
      roomData.gameState.playerStates[currentPlayer.value.name] = {
        currentBattleCities: [],
        battleGoldSkill: null,
        deadCities: [],
        usedSkills: [],
        activatedCitySkills: {}
      }
    }

    const playerState = roomData.gameState.playerStates[currentPlayer.value.name]

    // 保存出战城市和技能
    playerState.currentBattleCities = cities.map(cityIdx => ({
      cityIdx,
      isStandGroundCity: skill === '按兵不动'
    }))
    playerState.battleGoldSkill = skill || null
    playerState.activatedCitySkills = activatedCitySkills || {}

    await saveRoomData(currentRoomId.value, roomData)
    console.log('[PlayerMode] 部署已保存，等待其他玩家')

    // 添加公开日志：玩家已确认出战
    gameStore.addLog(`${currentPlayer.value.name} 已确认出战`)

    // 检查是否有未确认的对手，添加私密日志
    const allPlayers = roomData.players.filter(p => p.name !== currentPlayer.value.name)
    const unconfirmedOpponents = allPlayers.filter(opponent => {
      const oppState = roomData.gameState.playerStates[opponent.name]
      return !oppState || !oppState.currentBattleCities || oppState.currentBattleCities.length === 0
    })

    if (unconfirmedOpponents.length > 0) {
      const opponentNames = unconfirmedOpponents.map(p => p.name).join('、')
      gameStore.addPrivateLog(currentPlayer.value.name, `等待 ${opponentNames} 确认出战...`)
    }

    // 同步玩家数据到 gameStore
    syncRoomDataToGameStore(roomData)

    // 关键修复：选择性更新currentPlayer，不覆盖cities
    const updatedPlayerData = roomData.players.find(p => p.name === currentPlayer.value.name)
    if (updatedPlayerData && currentPlayer.value) {
      console.log('[PlayerMode] handleDeploymentConfirmed - 选择性更新currentPlayer（保留cities）')

      // 只更新必要字段，保留本地的cities
      currentPlayer.value.gold = updatedPlayerData.gold
      currentPlayer.value.roster = updatedPlayerData.roster
      currentPlayer.value.centerIndex = updatedPlayerData.centerIndex
      currentPlayer.value.ready = updatedPlayerData.ready

      console.log('[PlayerMode] handleDeploymentConfirmed - cities未被修改，仍为:', currentPlayer.value.cities.map(c => c.name))
    }

    // 启动游戏
    currentStep.value = 'game'

    // 开始监听房间数据变化
    startRoomDataListener()
  }
}

/**
 * 同步房间数据到游戏 Store
 */
function syncRoomDataToGameStore(roomData) {
  if (!roomData) {
    console.warn('[PlayerMode] syncRoomDataToGameStore - roomData 为空')
    return
  }

  console.log('[PlayerMode] 同步房间数据到 gameStore')

  // 设置游戏模式
  gameStore.gameMode = roomData.mode || '2P'

  // 不要清空 players，保留现有数据以保持 currentHp
  // gameStore.players.length = 0  <-- 移除此行

  if (!roomData.players || !Array.isArray(roomData.players)) {
    console.warn('[PlayerMode] syncRoomDataToGameStore - roomData.players 不是数组')
    return
  }

  roomData.players.forEach(player => {
    if (!player || !player.cities || !Array.isArray(player.cities)) {
      console.warn('[PlayerMode] syncRoomDataToGameStore - 玩家或城市数据缺失', player)
      return
    }

    // 查找现有玩家数据（如果有）
    const existingPlayer = gameStore.players.find(p => p.name === player.name)

    // 确保每个城市都有正确的HP和存活状态
    const cities = player.cities.map((city, idx) => {
      // 如果现有玩家存在且有这个城市，保留其currentHp和isAlive
      const existingCity = existingPlayer?.cities[idx]

      let currentHp, isAlive
      if (existingCity) {
        // 优先使用现有城市的数据
        currentHp = existingCity.currentHp !== undefined ? existingCity.currentHp : existingCity.hp
        isAlive = existingCity.isAlive !== undefined ? existingCity.isAlive : (currentHp > 0)
      } else {
        // 新城市，从city.hp初始化
        currentHp = city.currentHp !== undefined ? city.currentHp : city.hp
        isAlive = city.isAlive !== undefined ? city.isAlive : (currentHp > 0)
      }

      return {
        ...city,
        currentHp: currentHp,
        isAlive: isAlive
      }
    })

    // 如果玩家已存在，更新数据；否则添加新玩家
    const playerIndex = gameStore.players.findIndex(p => p.name === player.name)
    const playerData = {
      name: player.name,
      gold: player.gold || 2,
      cities: cities,
      centerIndex: player.centerIndex,
      roster: player.roster || [],
      battleModifiers: []
    }

    if (playerIndex >= 0) {
      // 更新现有玩家
      gameStore.players[playerIndex] = playerData
    } else {
      // 添加新玩家
      gameStore.players.push(playerData)
    }
  })

  // 设置回合数和游戏状态
  if (roomData.gameState) {
    gameStore.currentRound = roomData.gameState.currentRound || 1

    // 关键修复：同步playerStates到gameStore，用于roster refill等状态检查
    if (roomData.gameState.playerStates) {
      gameStore.playerStates = roomData.gameState.playerStates
      console.log('[PlayerMode] 已同步playerStates到gameStore')
    }
  }

  console.log('[PlayerMode] gameStore已更新，玩家数量:', gameStore.players.length)
}

/**
 * 开始监听房间数据
 */
function startRoomDataListener() {
  if (!currentRoomId.value) return

  console.log('[PlayerMode] 开始监听房间数据变化')

  roomDataListener = startRoomListener(currentRoomId.value, async (data) => {
    console.log('[PlayerMode] 房间数据更新', data)

    // 同步数据到 gameStore
    syncRoomDataToGameStore(data)

    // 关键修复：选择性更新currentPlayer，不覆盖cities（防止数据被错误同步）
    const updatedPlayerData = data.players.find(p => p.name === currentPlayer.value?.name)
    if (updatedPlayerData && currentPlayer.value) {
      console.log('[PlayerMode] 监听器 - 选择性更新currentPlayer（保留cities）')

      // 只更新这些字段，保留本地的cities数组不变
      currentPlayer.value.gold = updatedPlayerData.gold
      currentPlayer.value.roster = updatedPlayerData.roster
      currentPlayer.value.centerIndex = updatedPlayerData.centerIndex
      currentPlayer.value.ready = updatedPlayerData.ready

      // 只在特定情况下更新cities（如重新抽取、战斗后HP变化）
      // 检查是否需要更新cities（通过比较城市数量判断）
      if (updatedPlayerData.cities && updatedPlayerData.cities.length !== currentPlayer.value.cities.length) {
        console.log('[PlayerMode] 监听器 - cities数量变化，更新cities')
        currentPlayer.value.cities = updatedPlayerData.cities
      } else if (updatedPlayerData.cities) {
        // 只更新HP和存活状态，不改变城市列表
        updatedPlayerData.cities.forEach((updatedCity, idx) => {
          if (currentPlayer.value.cities[idx]) {
            const localCity = currentPlayer.value.cities[idx]
            // 只更新HP相关字段
            if (updatedCity.currentHp !== undefined) {
              localCity.currentHp = updatedCity.currentHp
            }
            if (updatedCity.isAlive !== undefined) {
              localCity.isAlive = updatedCity.isAlive
            }
          }
        })
      }
    }

    // 更新游戏状态到store
    if (data.gameState) {
      gameStore.currentRound = data.gameState.currentRound || 1

      // 同步战斗日志到本地
      if (data.gameState.battleLogs && Array.isArray(data.gameState.battleLogs)) {
        gameStore.clearLogs()
        data.gameState.battleLogs.forEach(log => {
          gameStore.logs.push(log)
        })
        console.log(`[PlayerMode] 已同步${data.gameState.battleLogs.length}条战斗日志`)
      }

      // 检查是否所有玩家都完成了部署
      const allDeployed = data.players.every(p => {
        const state = data.gameState.playerStates[p.name]
        return state && (
          (state.currentBattleCities && state.currentBattleCities.length > 0) ||
          state.battleGoldSkill === '按兵不动'
        )
      })

      if (allDeployed && !data.gameState.battleProcessed) {
        // 所有玩家已部署，触发战斗
        console.log('[PlayerMode] 所有玩家已部署，准备战斗')

        // 只有第一个玩家负责触发战斗计算
        if (data.players[0].name === currentPlayer.value.name) {
          await processBattle(data)
        }
      }

      // 检查战斗是否完成，其他玩家需要更新UI
      if (data.gameState.battleProcessed && currentStep.value === 'game') {
        // 战斗已完成，显示日志并准备下一回合
        console.log('[PlayerMode] 战斗已完成，检查是否进入下一回合')
        console.log('[PlayerMode] 当前currentStep:', currentStep.value)

        // 等待一段时间让玩家查看日志
        setTimeout(async () => {
          console.log('[PlayerMode] 3秒延迟后，开始检查下一步')

          // 检查游戏是否结束（通过Firebase同步的权威状态）
          if (data.gameState.gameOver) {
            console.log('[PlayerMode] 游戏结束，获胜者:', data.gameState.winner)
            showVictory.value = true
            return
          }

          // 检查是否需要补充预备城市
          const myState = data.gameState.playerStates[currentPlayer.value.name]
          console.log('[PlayerMode] 玩家状态:', myState)
          console.log('[PlayerMode] needsRosterRefill:', myState?.needsRosterRefill)
          console.log('[PlayerMode] rosterRefillReason:', myState?.rosterRefillReason)

          if (myState && myState.needsRosterRefill) {
            console.log('[PlayerMode] 需要补充预备城市，保持在game界面显示RosterRefill')
            // RosterRefill组件会自动显示（currentStep保持为'game'）
          } else {
            // 不需要补充，准备下一回合并返回部署页面
            console.log('[PlayerMode] 不需要补充预备城市，准备下一回合')

            // 只有第一个玩家负责准备下一回合
            if (data.players[0].name === currentPlayer.value.name) {
              console.log('[PlayerMode] 作为第一个玩家，准备下一回合数据')

              // 准备下一回合
              data.gameState.currentRound++
              data.gameState.battleProcessed = false

              // 清空所有玩家的部署
              Object.keys(data.gameState.playerStates).forEach(playerName => {
                data.gameState.playerStates[playerName].currentBattleCities = []
                data.gameState.playerStates[playerName].battleGoldSkill = null
                data.gameState.playerStates[playerName].activatedCitySkills = {}  // 清空城市技能激活状态
              })

              await saveRoomData(currentRoomId.value, data)
              console.log('[PlayerMode] 下一回合数据已准备完成')
            }

            // 返回部署页面
            console.log('[PlayerMode] 返回city-deployment')
            currentStep.value = 'city-deployment'
          }
        }, 3000)  // 3秒延迟，让玩家查看日志
      }
    }
  })
}

/**
 * 处理战斗
 * 参考 citycard_web.html 完整战斗流程
 */
async function processBattle(roomData) {
  console.log('[PlayerMode] 开始处理战斗')

  // 初始化战斗日志数组（如果还没有）
  if (!roomData.gameState.battleLogs) {
    roomData.gameState.battleLogs = []
  }

  // 清空gameStore的日志，准备接收新的战斗日志
  gameStore.clearLogs()

  const mode = roomData.mode || '2P'
  console.log(`[PlayerMode] 当前游戏模式: ${mode}`)

  // ========== 疲劳减半：在战斗前检测之前执行 ==========
  // 关键：按照用户需求，疲劳减半必须在同省规则检查之前执行
  const { applyFatigueReduction } = await import('../../composables/game/fatigueSystem.js')
  applyFatigueReduction(gameStore, roomData.gameState, roomData.players, mode)

  // ========== 战斗前检测（参考 citycard_web.html lines 3946-4510） ==========
  const { executePreBattleChecks } = await import('../../composables/game/preBattleChecks.js')

  const shouldSkipBattle = executePreBattleChecks(
    gameStore,
    roomData.gameState,
    roomData.players,
    mode
  )

  if (shouldSkipBattle) {
    console.log('[PlayerMode] 战斗前检测触发撤退，跳过战斗')
    // 将日志复制到roomData
    roomData.gameState.battleLogs = [...gameStore.logs]
    roomData.gameState.battleProcessed = true
    await saveRoomData(currentRoomId.value, roomData)
    return
  }

  // ========== 执行战斗计算 ==========
  if (mode === '3P' || mode === '3p') {
    gameLogic.battle3P(roomData.players, roomData.gameState)
  } else if (mode === '2v2' || mode === '2V2') {
    gameLogic.battle2v2(roomData.players, roomData.gameState)
  } else {
    gameLogic.battle2P(roomData.players, roomData.gameState)
  }

  // ========== 战斗后处理（参考 citycard_web.html lines 10036-10071） ==========
  // 检查城市阵亡和步步高升召唤
  for (const player of roomData.players) {
    for (let cityIdx = 0; cityIdx < player.cities.length; cityIdx++) {
      const city = player.cities[cityIdx]
      if (city.currentHp <= 0 && city.isAlive !== false) {
        // 城市阵亡
        city.isAlive = false

        // 触发步步高升召唤
        gameStore.handleBuBuGaoShengSummon(player, cityIdx, city)
      }
    }

    // 检查中心城市阵亡和生于紫室继承
    gameStore.checkCenterDeathAndPurpleChamberInheritance(player)
  }

  // 将战斗日志从gameStore复制到roomData
  roomData.gameState.battleLogs = [...gameStore.logs]

  // 关键修复：将gameStore.playerStates同步回roomData.gameState.playerStates
  // 这样needsRosterRefill等状态才能保存到Firebase
  if (gameStore.playerStates) {
    if (!roomData.gameState.playerStates) {
      roomData.gameState.playerStates = {}
    }
    roomData.gameState.playerStates = { ...gameStore.playerStates }
    console.log('[PlayerMode] 同步playerStates到roomData:', roomData.gameState.playerStates)
  }

  // 标记战斗已处理
  roomData.gameState.battleProcessed = true
  console.log('[PlayerMode] 战斗计算完成，标记battleProcessed=true')

  // 检查游戏是否结束
  if (gameLogic.isGameOver.value) {
    console.log('[PlayerMode] 游戏结束')
    // 保存游戏结束状态到Firebase
    roomData.gameState.gameOver = true
    roomData.gameState.winner = gameLogic.winner.value?.name || '平局'
    await saveRoomData(currentRoomId.value, roomData)
    showVictory.value = true
    return
  }

  // 保存战斗结果（不立即准备下一回合，让玩家查看日志）
  await saveRoomData(currentRoomId.value, roomData)
  console.log('[PlayerMode] 战斗数据已保存到房间，包含日志和needsRosterRefill标志')
}

/**
 * 重新开始游戏
 */
function restartGame() {
  console.log('[PlayerMode] 重新开始游戏')
  // 重置到房间选择步骤
  currentStep.value = 'room-selection'
  currentRoomId.value = ''
  currentPlayer.value = null
  centerCityIndex.value = null
  rosterCities.value = []
}

/**
 * 计算属性：是否需要补充预备城市
 */
const needsRosterRefill = computed(() => {
  if (!currentRoomId.value || !currentPlayer.value) {
    console.log('[needsRosterRefill] 返回false - 缺少房间或玩家')
    return false
  }

  // 从最新的房间数据中获取
  const playerState = getPlayerState()
  const needsRefill = playerState?.needsRosterRefill === true
  console.log('[needsRosterRefill] 计算结果:', {
    playerName: currentPlayer.value.name,
    playerState: playerState,
    needsRefill: needsRefill
  })
  return needsRefill
})

/**
 * 获取当前玩家状态
 */
function getPlayerState() {
  // 需要从最新的房间数据中获取，这里简化处理
  // 实际应该从实时监听的roomData中获取
  return gameStore.playerStates?.[currentPlayer.value?.name] || {}
}

/**
 * 处理补充预备城市确认
 */
async function handleRosterRefill({ mode, cities }) {
  console.log('[PlayerMode] 补充预备城市', { mode, cities })

  if (!currentRoomId.value || !currentPlayer.value) {
    console.error('[PlayerMode] 缺少房间或玩家信息')
    return
  }

  const roomData = await getRoomData(currentRoomId.value)
  if (!roomData) {
    console.error('[PlayerMode] 无法获取房间数据')
    return
  }

  const myPlayer = roomData.players.find(p => p.name === currentPlayer.value.name)
  if (!myPlayer) {
    console.error('[PlayerMode] 未找到当前玩家')
    return
  }

  const myState = roomData.gameState.playerStates[myPlayer.name]
  if (!myState) {
    console.error('[PlayerMode] 未找到玩家状态')
    return
  }

  if (mode === 'reselection') {
    // 改弦更张：替换整个预备列表
    myPlayer.roster = cities
    myState.needsRosterRefill = false
    myState.rosterRefillReason = null

    await saveRoomData(currentRoomId.value, roomData)
    console.log('[PlayerMode] 改弦更张成功，预备城市已更新')
  } else {
    // 普通补充：追加城市到预备列表
    cities.forEach(idx => {
      if (!myPlayer.roster.includes(idx)) {
        myPlayer.roster.push(idx)
      }
    })

    // 检查是否已补充满
    const rosterLimit = (roomData.mode === '2v2') ? 4 : 5
    if (myPlayer.roster.length >= rosterLimit) {
      myState.needsRosterRefill = false
      myState.rosterRefillReason = null
    }

    await saveRoomData(currentRoomId.value, roomData)
    console.log('[PlayerMode] 预备城市补充成功')
  }

  // 同步到gameStore，确保needsRosterRefill计算属性更新
  syncRoomDataToGameStore(roomData)

  // 更新本地玩家数据（选择性更新，保留cities）
  if (currentPlayer.value) {
    console.log('[PlayerMode] handleRosterRefill - 选择性更新currentPlayer（保留cities）')
    currentPlayer.value.roster = myPlayer.roster
    currentPlayer.value.gold = myPlayer.gold
    currentPlayer.value.ready = myPlayer.ready
  } else {
    // 如果currentPlayer不存在，则完全初始化
    currentPlayer.value = myPlayer
  }
  rosterCities.value = myPlayer.roster  // 关键修复：同步更新本地rosterCities

  console.log('[PlayerMode] 补充完成后的roster:', myPlayer.roster)
  console.log('[PlayerMode] roster对应的城市:', myPlayer.roster.map(idx => myPlayer.cities[idx]?.name))

  // 补充完成后，返回部署界面
  console.log('[PlayerMode] 预备城市补充完成，返回部署界面')
  currentStep.value = 'city-deployment'
}
</script>

<style scoped>
#playerMode {
  position: relative;
  min-height: 100vh;
}

.exit-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 10px 20px;
  background: var(--bad);
  border: 1px solid #dc2626;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  z-index: 100;
}

.exit-btn:hover {
  background: #dc2626;
}

.player-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.victory-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.victory-content {
  background: var(--panel);
  border-radius: 16px;
  padding: 40px;
  max-width: 500px;
  text-align: center;
}

.victory-animation {
  margin-bottom: 20px;
}

.trophy {
  font-size: 64px;
  animation: bounce 1s infinite;
}

.fireworks {
  font-size: 32px;
  margin-top: 10px;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.victory-title {
  font-size: 24px;
  color: var(--accent);
  margin-bottom: 30px;
}

.victory-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  font-size: 12px;
  color: var(--muted);
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--text);
}

.victory-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.victory-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
}

.victory-btn--restart {
  background: var(--accent);
  color: white;
}

.victory-btn--restart:hover {
  background: #3b82f6;
}

.victory-btn--exit {
  background: var(--muted);
  color: white;
}

.victory-btn--exit:hover {
  background: #6b7280;
}

/* 游戏主界面布局（带固定日志面板） */
.game-with-log-layout {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px;
  height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  overflow: hidden;
  transition: grid-template-columns 0.3s ease;
}

.game-main-area {
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: 16px;
  min-width: 0;
}

.game-log-area {
  height: 100%;
  overflow: hidden;
  width: 500px;
  transition: width 0.3s ease;
}

.game-log-area:has(.collapsed) {
  width: 60px;
}

/* 自定义滚动条 */
.game-main-area::-webkit-scrollbar {
  width: 10px;
}

.game-main-area::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

.game-main-area::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
  border-radius: 5px;
}

.game-main-area::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .game-with-log-layout {
    grid-template-columns: 1fr 400px;
  }
}

@media (max-width: 1024px) {
  .game-with-log-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }

  .game-log-area {
    height: 300px;
  }
}

@media (max-width: 768px) {
  .game-with-log-layout {
    padding: 10px;
    gap: 10px;
  }

  .game-log-area {
    height: 250px;
  }
}
</style>
