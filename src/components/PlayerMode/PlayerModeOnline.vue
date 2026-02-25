<template>
  <div id="playerMode">
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
        @back="$emit('exit')"
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
        :cities="currentPlayer?.cities ? Object.values(currentPlayer.cities) : []"
        :initial-center-index="centerCityIndex"
        :current-draw-count="playerDrawCount"
        :game-mode="gameMode"
        @center-selected="handleCenterSelected"
        @confirm="handleCenterConfirmed"
        @redraw="handleRedrawCities"
      />

      <!-- 等待其他玩家确认 -->
      <div v-if="currentStep === 'waiting-for-center-confirmation'" class="game-waiting-area">
        <div class="waiting-content">
          <div class="waiting-icon">⏳</div>
          <h3>{{ gameMode === '3P' ? '等待其他玩家确认城市...' : '等待其他玩家确认中心城市...' }}</h3>
          <p class="waiting-hint">{{ gameMode === '3P' ? '你已确认城市，请耐心等待' : '你已完成中心城市选择，请耐心等待' }}</p>
        </div>
      </div>

      <!-- 城市部署步骤 -->
      <CityDeployment
        v-if="currentStep === 'city-deployment'"
        :current-player="currentPlayer"
        :game-mode="gameMode"
        :all-players="gameStore.players"
        :room-id="currentRoomId"
        @deployment-confirmed="handleDeploymentConfirmed"
        @skill-used="handleSkillSelected"
      />

      <!-- 游戏进行中 - 战斗会自动在后台进行，玩家通过日志查看 -->
      <!-- 战斗完成后会自动返回部署界面 -->
      <div v-if="currentStep === 'game'" class="game-waiting-area">
        <div class="waiting-content">
          <div class="waiting-icon">⚔️</div>
          <h3>战斗计算中...</h3>
          <p class="waiting-hint">请查看右侧战斗日志</p>
          <GameLogSimple :current-player-name="currentPlayer?.name" />
        </div>
      </div>
    </div>

    <!-- 战斗动画 -->
    <BattleAnimation
      :show="showBattleAnimation"
      :battle-data="battleAnimationData"
      @complete="handleBattleAnimationComplete"
    />

    <!-- 游戏日志模态框（仅在非game步骤显示） -->
    <GameLog v-if="currentStep !== 'game'" :show="showLog" @close="showLog = false" />

    <!-- 技能选择模态框 -->
    <SkillSelector
      v-if="showSkillSelector"
      :current-player="currentPlayer"
      @close="showSkillSelector = false"
      @skill-used="handleSkillSelected"
      @skill-failed="handleSkillFailed"
    />

    <!-- 先声夺人待处理请求面板 -->
    <PendingSwapsPanel
      v-if="currentPlayer && (currentStep === 'city-deployment' || currentStep === 'game')"
      :current-player="currentPlayer"
      @swap-accepted="handleSwapAccepted"
      @swap-rejected="handleSwapRejected"
    />

    <!-- 技能失败提示弹窗 -->
    <div v-if="showSkillFailureModal" class="skill-failure-modal" @click.self="closeSkillFailureModal">
      <div class="skill-failure-content">
        <div class="skill-failure-header">
          <span class="skill-failure-icon">❌</span>
          <h3 class="skill-failure-title">技能使用失败</h3>
        </div>
        <div class="skill-failure-body">
          <div class="skill-failure-skill">
            <span class="label">技能名称：</span>
            <span class="value">{{ skillFailureInfo?.skillName }}</span>
          </div>
          <div class="skill-failure-reason">
            <span class="label">失败原因：</span>
            <span class="value">{{ skillFailureInfo?.message }}</span>
          </div>
        </div>
        <div class="skill-failure-footer">
          <button class="skill-failure-btn" @click="closeSkillFailureModal">
            确定
          </button>
        </div>
      </div>
    </div>

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
              {{ gameLogic.winner.value?.cities ? Object.values(gameLogic.winner.value.cities).filter(c => c.isAlive).length : 0 }}
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
import { getProvinceName } from '../../utils/cityHelpers'
import FirebaseConfig from '../Firebase/FirebaseConfig.vue'
import RoomSelection from '../Room/RoomSelection.vue'
import WaitingRoom from '../Room/WaitingRoom.vue'
import CenterCitySelection from './CenterCitySelection.vue'
import CityDeployment from '../Game/CityDeployment.vue'
import GameLog from '../Game/GameLog.vue'
import GameLogSimple from '../Game/GameLogSimple.vue'
import SkillSelector from '../Skills/SkillSelector.vue'
import PendingSwapsPanel from '../Game/PendingSwapsPanel.vue'
import BattleAnimation from '../Game/BattleAnimation.vue'

const emit = defineEmits(['exit'])

const gameStore = useGameStore()
const { leaveRoom, getRoomData, saveRoomData, updateRoomGameState, startRoomListener, stopRoomListener } = useRoom()
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
const isBattleProcessing = ref(false)  // 防止战斗处理被重复调用
const showBattleAnimation = ref(false)  // 控制战斗动画显示
const battleAnimationData = ref(null)   // 战斗动画数据
const showSkillFailureModal = ref(false)  // 控制技能失败弹窗显示
const skillFailureInfo = ref(null)       // 技能失败信息
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
 * 规范化玩家cities对象的键
 * Firebase可能将城市名称键对象转为数组或数字键对象，需要统一转换为城市名称键
 */
function normalizePlayerCities(player) {
  if (!player || !player.cities) return
  if (Array.isArray(player.cities)) {
    const citiesObj = {}
    player.cities.forEach(city => {
      if (city && city.name) citiesObj[city.name] = city
    })
    player.cities = citiesObj
  } else if (typeof player.cities === 'object') {
    const keys = Object.keys(player.cities)
    const hasNumericKeys = keys.length > 0 && keys.every(k => !isNaN(k) && k !== '')
    if (hasNumericKeys) {
      const citiesObj = {}
      Object.values(player.cities).forEach(city => {
        if (city && city.name) citiesObj[city.name] = city
      })
      player.cities = citiesObj
    }
  }
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
    // 规范化所有玩家的cities键（Firebase可能返回数字键）
    roomData.players?.forEach(p => normalizePlayerCities(p))
    const playerData = roomData.players.find(p => p.name === currentPlayer.value?.name)
    if (playerData) {
      console.log('[PlayerMode] ===== BUG 6 诊断: handleAllReady =====')
      console.log('[PlayerMode] 玩家名称:', playerData.name)
      console.log('[PlayerMode] 城市数量:', Object.keys(playerData.cities).length)
      console.log('[PlayerMode] 城市列表:')
      Object.entries(playerData.cities).forEach(([cityName, city]) => {
        console.log(`  ${cityName}: ${city.name} (HP: ${city.hp})`)
      })
      console.log('[PlayerMode] centerCityName (from Firebase):', playerData.centerCityName)
      console.log('[PlayerMode] 这是用户将在选择界面看到的初始城市列表')
      console.log('[PlayerMode] ========================================')

      // 初始化currentPlayer - 关键修复：深度克隆以避免引用共享
      currentPlayer.value = JSON.parse(JSON.stringify(playerData))
      console.log('[PlayerMode] currentPlayer已深度克隆，独立于roomData')
      gameMode.value = roomData.mode || '2P'

      // 关键修复：重置所有玩家的ready标志为false，准备进入中心城市选择
      // 这样在handleCenterConfirmed中检查时，只有确认了中心城市的玩家ready才会是true
      roomData.players.forEach(player => {
        player.ready = false
      })

      // 关键修复：初始化gameState（如果不存在）
      // 必须在这里初始化，确保后续的监听器和战斗检查能正确访问
      // 注意：Firebase的set()会过滤掉空对象{}，所以需要用非空值初始化

      // 关键修复：检测空的playerStates（旧数据），强制重新初始化
      const needsInitialization = !roomData.gameState ||
                                   !roomData.gameState.playerStates ||
                                   (typeof roomData.gameState.playerStates === 'object' &&
                                    Object.keys(roomData.gameState.playerStates).length === 0)

      if (needsInitialization) {
        console.log('[PlayerMode] ===== 初始化/修复gameState =====')
        console.log('[PlayerMode] 原因:', !roomData.gameState ? '不存在' : 'playerStates为空对象')
        console.log('[PlayerMode] roomData存在:', !!roomData)
        console.log('[PlayerMode] roomData.players存在:', !!roomData.players)
        console.log('[PlayerMode] roomData.players类型:', typeof roomData.players)
        console.log('[PlayerMode] roomData.players是否为数组:', Array.isArray(roomData.players))
        console.log('[PlayerMode] roomData.players数量:', roomData.players?.length)
        console.log('[PlayerMode] roomData.players完整内容:', JSON.stringify(roomData.players, null, 2))

        // 为每个玩家初始化playerState
        const playerStates = {}

        if (!roomData.players || roomData.players.length === 0) {
          console.error('[PlayerMode] ❌ 错误：roomData.players为空，无法初始化playerStates')
          console.error('[PlayerMode] 这不应该发生！handleAllReady应该在玩家加入后才调用')
        } else {
          console.log('[PlayerMode] 开始构建playerStates，循环次数:', roomData.players.length)
          roomData.players.forEach((player, idx) => {
            console.log(`[PlayerMode] 处理玩家 #${idx}:`, player)
            if (!player || !player.name) {
              console.error(`[PlayerMode] ❌ 玩家${idx}没有name属性:`, player)
              return
            }
            console.log(`[PlayerMode] ✓ 为玩家初始化playerState: "${player.name}"`)
            playerStates[player.name] = {
              _initialized: true,  // 哨兵值：防止Firebase剥离空对象
              currentBattleCities: [],
              battleGoldSkill: null,
              deadCities: [],
              usedSkills: [],
              activatedCitySkills: null  // 关键修复：用null代替{}
            }
            console.log(`[PlayerMode] playerStates["${player.name}"]已创建:`, playerStates[player.name])
          })
          console.log('[PlayerMode] 循环结束')
        }

        console.log('[PlayerMode] playerStates构建完成，keys:', Object.keys(playerStates))
        console.log('[PlayerMode] playerStates是否为空对象:', Object.keys(playerStates).length === 0)
        console.log('[PlayerMode] playerStates内容:', JSON.stringify(playerStates, null, 2))

        // 关键修复：如果playerStates为空，使用null代替，避免被Firebase过滤
        // 后续在部署时再初始化具体的playerState
        const finalPlayerStates = Object.keys(playerStates).length > 0 ? playerStates : null
        if (finalPlayerStates === null) {
          console.warn('[PlayerMode] ⚠️ playerStates为空，使用null代替，将在部署时初始化')
        }

        // 如果roomData.gameState已存在但需要修复，保留currentRound
        const currentRound = roomData.gameState?.currentRound || 1

        roomData.gameState = {
          currentRound: currentRound,
          playerStates: finalPlayerStates,  // 使用非空对象或null
          battleProcessed: false,
          knownCities: null,  // 用null代替{}，后续需要时再初始化
          ironCities: null,
          strengthBoost: null,
          morale: null,
          yqgzMarks: [],
          battleLogs: [],
          pendingSwaps: []
        }

        console.log('[PlayerMode] gameState初始化完成')
        console.log('[PlayerMode] playerStates keys:', finalPlayerStates ? Object.keys(finalPlayerStates) : 'null')
        console.log('[PlayerMode] 完整gameState:', JSON.stringify(roomData.gameState, null, 2))
        console.log('[PlayerMode] ======================================')
      }

      await saveRoomData(currentRoomId.value, roomData)
      console.log('[PlayerMode] 已重置所有玩家的ready标志为false并初始化gameState')

      // 关键诊断：立即读取验证保存结果
      const verifyRoomData = await getRoomData(currentRoomId.value)
      if (verifyRoomData && verifyRoomData.gameState) {
        console.log('[PlayerMode] ===== 验证保存后的gameState =====')
        console.log('[PlayerMode] gameState存在:', !!verifyRoomData.gameState)
        console.log('[PlayerMode] gameState keys:', Object.keys(verifyRoomData.gameState))
        console.log('[PlayerMode] playerStates存在:', !!verifyRoomData.gameState.playerStates)
        console.log('[PlayerMode] playerStates keys:', verifyRoomData.gameState.playerStates ? Object.keys(verifyRoomData.gameState.playerStates) : 'undefined')
        console.log('[PlayerMode] playerStates内容:', JSON.stringify(verifyRoomData.gameState.playerStates, null, 2))
        console.log('[PlayerMode] 完整gameState:', JSON.stringify(verifyRoomData.gameState, null, 2))
        console.log('[PlayerMode] ======================================')
      } else {
        console.error('[PlayerMode] ❌ 验证失败：无法读取gameState')
      }

      // 进入中心城市选择界面
      currentStep.value = 'center-city-selection'
      console.log('[PlayerMode] 进入中心城市选择界面')
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
async function handleCenterSelected(cityName) {
  console.log('[PlayerMode] ===== 选择中心城市 (使用城市名称) =====')
  console.log('[PlayerMode] 选择的城市名称:', cityName)

  // 保存到房间数据
  if (currentRoomId.value && currentPlayer.value) {
    const roomData = await getRoomData(currentRoomId.value)
    if (roomData) {
      const playerIdx = roomData.players.findIndex(p => p.name === currentPlayer.value.name)
      if (playerIdx !== -1) {
        // 保存城市名称
        roomData.players[playerIdx].centerCityName = cityName
        await saveRoomData(currentRoomId.value, roomData)
        console.log('[PlayerMode] 中心城市已保存到房间数据:', cityName)
      }
    }
  }
  console.log('[PlayerMode] ==========================================')
}

/**
 * 确认中心城市（2P/2v2）或确认抽取到的城市（3P）
 */
async function handleCenterConfirmed(cityName) {
  const is3P = gameMode.value === '3P'
  console.log(`[PlayerMode] ===== 确认${is3P ? '抽取城市' : '中心城市'} =====`)
  console.log('[PlayerMode] 确认的城市名称:', cityName)

  // 同步roomData到currentPlayer
  if (currentRoomId.value && currentPlayer.value) {
    const roomData = await getRoomData(currentRoomId.value)
    if (roomData) {
      const playerIdx = roomData.players.findIndex(p => p.name === currentPlayer.value.name)
      if (playerIdx !== -1) {
        // 3P不需要设置centerCityName
        if (!is3P && cityName) {
          roomData.players[playerIdx].centerCityName = cityName
        }
        roomData.players[playerIdx].ready = true

        await saveRoomData(currentRoomId.value, roomData)
      }

      // 同步玩家数据到 gameStore
      syncRoomDataToGameStore(roomData)

      const updatedPlayerData = roomData.players.find(p => p.name === currentPlayer.value.name)
      if (updatedPlayerData) {
        currentPlayer.value = {
          ...updatedPlayerData,
          cities: currentPlayer.value.cities  // 保持原有cities数组引用
        }
      }

      // 检查是否所有玩家都准备好了
      const allPlayersReady = roomData.players.every(p => p.ready === true)
      console.log('[PlayerMode] 所有玩家是否都已准备:', allPlayersReady)

      if (allPlayersReady) {
        console.log('[PlayerMode] 所有玩家已确认，直接进入部署界面')
        currentStep.value = 'city-deployment'
        startRoomDataListener()
      } else {
        console.log('[PlayerMode] 进入等待界面，等待其他玩家确认')
        currentStep.value = 'waiting-for-center-confirmation'
        startRoomDataListener()
      }
    }
  }
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

    // 清空之前选择的中心城市和roster
    roomData.players[playerIdx].centerCityName = null
    roomData.players[playerIdx].roster = []

    // 保存到房间数据
    await saveRoomData(currentRoomId.value, roomData)

    // 关键修复：深度克隆避免引用共享，从roomData获取更新后的玩家对象
    const updatedPlayerData = JSON.parse(JSON.stringify(roomData.players[playerIdx]))
    console.log('[PlayerMode] 重新抽取后更新currentPlayer（深度克隆）')
    console.log('[PlayerMode] 新城市列表:', Object.values(updatedPlayerData.cities).map(c => c.name))
    currentPlayer.value = updatedPlayerData
    centerCityIndex.value = null
    // 注意：roster只在3P模式使用，2P模式不需要清空rosterCities

    // 增加抽取次数
    playerDrawCount.value++

    console.log('[PlayerMode] 城市已重新抽取，共', Object.keys(updatedPlayerData.cities).length, '个城市')
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
  // 金币贷款、金融危机、寸步难行、抛砖引玉、血量存储利息、海市蜃楼、厚积薄发等
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
      // 同步城市HP和存活状态 - 保持对象结构
      player.cities = {}
      Object.entries(gameStorePlayer.cities).forEach(([cityName, city]) => {
        player.cities[cityName] = {
          ...city,
          currentHp: city.currentHp,
          isAlive: city.isAlive !== false
        }
      })
      // 同步金币
      player.gold = gameStorePlayer.gold

      // 关键修复Bug1: 同步streak数据
      if (gameStorePlayer.streaks) {
        player.streaks = { ...gameStorePlayer.streaks }
        console.log(`[PlayerMode] handleEndTurn - 同步${player.name}的streaks到Firebase:`, player.streaks)
      }
    }
  })

  // 更新游戏状态
  if (!roomData.gameState) {
    roomData.gameState = {}
  }
  roomData.gameState.currentRound = gameStore.currentRound

  // 同步战斗相关状态到Firebase
  if (gameStore.purpleChamber && Object.keys(gameStore.purpleChamber).length > 0) {
    roomData.gameState.purpleChamber = JSON.parse(JSON.stringify(gameStore.purpleChamber))
  } else {
    roomData.gameState.purpleChamber = {}
  }

  // 同步日志到Firebase
  roomData.gameState.battleLogs = [...gameStore.logs]

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

  // ===== 诊断：检查 gameStore 状态 =====
  console.log('[PlayerMode] ===== gameStore 诊断 =====')
  console.log('[PlayerMode] gameStore 是否存在:', !!gameStore)
  console.log('[PlayerMode] gameStore.pendingSwaps 类型:', typeof gameStore.pendingSwaps)
  console.log('[PlayerMode] gameStore.pendingSwaps 值:', gameStore.pendingSwaps)
  console.log('[PlayerMode] gameStore.createPendingSwap 是否存在:', typeof gameStore.createPendingSwap)
  // 关键修复：Pinia自动解包ref，直接检查数组
  if (Array.isArray(gameStore.pendingSwaps)) {
    console.log('[PlayerMode] gameStore.pendingSwaps 长度:', gameStore.pendingSwaps.length)
    console.log('[PlayerMode] gameStore.pendingSwaps内容:', gameStore.pendingSwaps)
  }
  console.log('[PlayerMode] ===========================')

  if (!skillData || !skillData.skillName) {
    console.error('[PlayerMode] 技能数据无效')
    return
  }

  if (!currentRoomId.value || !currentPlayer.value) {
    console.error('[PlayerMode] 缺少房间或玩家信息')
    return
  }

  // 如果技能已在SkillSelector中执行成功，直接同步数据到Firebase
  if (skillData.result && skillData.result.success) {
    console.log('[PlayerMode] 技能已在SkillSelector中执行，直接同步数据到Firebase')

    try {
      // 关键修复：不依赖getRoomData，直接使用gameStore的最新状态
      // 构建玩家数据更新（使用gameStore.players，不需要读取Firebase）
      const { getDatabase, ref: dbRef, update } = await import('firebase/database')
      const db = getDatabase()

      const playerUpdates = {}
      gameStore.players.forEach((gameStorePlayer, idx) => {
        // 更新城市HP和存活状态
        playerUpdates[`rooms/${currentRoomId.value}/players/${idx}/cities`] = Object.values(gameStorePlayer.cities).map(city => ({
          ...city,
          currentHp: city.currentHp,
          isAlive: city.isAlive !== false
        }))
        // 更新金币
        playerUpdates[`rooms/${currentRoomId.value}/players/${idx}/gold`] = gameStorePlayer.gold
      })

      console.log('[PlayerMode] 准备更新玩家数据:', Object.keys(playerUpdates))

      // 关键修复：正确读取pendingSwaps (Pinia会自动解包ref)
      // 先检查是否已解包成数组,再检查是否是未解包的ref
      let pendingSwapsUpdate = []
      if (Array.isArray(gameStore.pendingSwaps)) {
        // Pinia自动解包,gameStore.pendingSwaps直接是数组
        pendingSwapsUpdate = gameStore.pendingSwaps
        console.log('[PlayerMode] pendingSwaps已被Pinia解包,直接使用数组')
      } else if (gameStore.pendingSwaps?.value && Array.isArray(gameStore.pendingSwaps.value)) {
        // 未解包的ref,需要访问.value
        pendingSwapsUpdate = gameStore.pendingSwaps.value
        console.log('[PlayerMode] pendingSwaps是未解包的ref,使用.value')
      } else {
        // 其他情况,使用空数组
        pendingSwapsUpdate = []
        console.warn('[PlayerMode] pendingSwaps既不是数组也不是ref,使用空数组')
      }

      console.log('[PlayerMode] 技能执行后 gameStore.pendingSwaps:', gameStore.pendingSwaps)
      console.log('[PlayerMode] 技能执行后 pendingSwaps类型:', Array.isArray(gameStore.pendingSwaps) ? 'Array' : typeof gameStore.pendingSwaps)
      console.log('[PlayerMode] 同步pendingSwaps到Firebase:', pendingSwapsUpdate.length, '条请求', pendingSwapsUpdate)

      // 关键修复：一次性更新所有数据（玩家数据 + pendingSwaps + logs），避免触发多次监听器
      // 将pendingSwaps也加入到playerUpdates中，一起更新
      playerUpdates[`rooms/${currentRoomId.value}/gameState/pendingSwaps`] = pendingSwapsUpdate

      // 关键修复：同步日志到Firebase，确保所有玩家都能看到技能使用日志
      playerUpdates[`rooms/${currentRoomId.value}/gameState/battleLogs`] = [...gameStore.logs]

      // 同步禁用技能状态到Firebase（事半功倍）
      if (gameStore.bannedSkills && Object.keys(gameStore.bannedSkills).length > 0) {
        playerUpdates[`rooms/${currentRoomId.value}/gameState/bannedSkills`] = JSON.parse(JSON.stringify(gameStore.bannedSkills))
      }

      // 同步已知城市到Firebase（劫富济贫等技能会调用setCityKnown）
      if (gameStore.knownCities && Object.keys(gameStore.knownCities).length > 0) {
        const knownCitiesForFirebase = {}
        Object.keys(gameStore.knownCities).forEach(observer => {
          knownCitiesForFirebase[observer] = {}
          Object.keys(gameStore.knownCities[observer]).forEach(owner => {
            const cities = gameStore.knownCities[observer][owner]
            knownCitiesForFirebase[observer][owner] = cities instanceof Set ? Array.from(cities) : (Array.isArray(cities) ? cities : [])
          })
        })
        playerUpdates[`rooms/${currentRoomId.value}/gameState/knownCities`] = knownCitiesForFirebase
      }

      // 同步代行省权状态到Firebase
      if (gameStore.actingCapital && Object.keys(gameStore.actingCapital).length > 0) {
        playerUpdates[`rooms/${currentRoomId.value}/gameState/actingCapital`] = JSON.parse(JSON.stringify(gameStore.actingCapital))
      }

      // 同步守望相助状态到Firebase
      if (gameStore.mutualWatch && Object.keys(gameStore.mutualWatch).length > 0) {
        playerUpdates[`rooms/${currentRoomId.value}/gameState/mutualWatch`] = JSON.parse(JSON.stringify(gameStore.mutualWatch))
      }

      // 同步生于紫室状态到Firebase
      if (gameStore.purpleChamber && Object.keys(gameStore.purpleChamber).length > 0) {
        playerUpdates[`rooms/${currentRoomId.value}/gameState/purpleChamber`] = JSON.parse(JSON.stringify(gameStore.purpleChamber))
      }

      // 同步副中心制状态到Firebase
      if (gameStore.subCenters && Object.keys(gameStore.subCenters).length > 0) {
        playerUpdates[`rooms/${currentRoomId.value}/gameState/subCenters`] = JSON.parse(JSON.stringify(gameStore.subCenters))
      }

      // 同步天灾人祸状态到Firebase
      if (gameStore.disaster && Object.keys(gameStore.disaster).length > 0) {
        playerUpdates[`rooms/${currentRoomId.value}/gameState/disaster`] = JSON.parse(JSON.stringify(gameStore.disaster))
      }

      // 同步厚积薄发状态到Firebase
      if (gameStore.hjbf && Object.keys(gameStore.hjbf).length > 0) {
        playerUpdates[`rooms/${currentRoomId.value}/gameState/hjbf`] = JSON.parse(JSON.stringify(gameStore.hjbf))
      }

      // 同步电磁感应状态到Firebase
      if (gameStore.electromagnetic && Object.keys(gameStore.electromagnetic).length > 0) {
        playerUpdates[`rooms/${currentRoomId.value}/gameState/electromagnetic`] = JSON.parse(JSON.stringify(gameStore.electromagnetic))
      }

      // 同步屏障状态到Firebase
      if (gameStore.barrier && Object.keys(gameStore.barrier).length > 0) {
        playerUpdates[`rooms/${currentRoomId.value}/gameState/barrier`] = JSON.parse(JSON.stringify(gameStore.barrier))
      }

      // 同步bannedCities状态到Firebase（高级治疗等禁用城市）
      if (gameStore.bannedCities && Object.keys(gameStore.bannedCities).length > 0) {
        playerUpdates[`rooms/${currentRoomId.value}/gameState/bannedCities`] = JSON.parse(JSON.stringify(gameStore.bannedCities))
      }

      console.log('[PlayerMode] 准备一次性更新到Firebase:', Object.keys(playerUpdates).length, '个字段')

      await update(dbRef(db), playerUpdates)
      console.log('[PlayerMode] 所有数据已一次性同步到Firebase（玩家数据 + pendingSwaps + logs）')

      // 战斗技能的公开日志在battle2P中输出，此处不公开（避免提前暴露策略）
      if (!skillData.result.hidePublicLog) {
        gameStore.addLog(skillData.result.message || `${skillData.skillName} 执行成功`)
      }
    } catch (error) {
      console.error('[PlayerMode] 同步数据到Firebase失败:', error)
      gameStore.addLog(`同步数据异常: ${error.message}`)
    }

    return
  }

  // 下面是原来的代码，用于处理SkillSelector中未执行的技能（理论上不应该走到这里）
  console.warn('[PlayerMode] 技能在SkillSelector中未执行，开始在此处执行（不推荐）')

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
  const { skillName, targetPlayerName, targetCityName, selfCityName, amount } = skillData

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
  if (target && targetCityName !== undefined && targetCityName !== null) {
    targetCity = target.cities[targetCityName]
  }

  // 找到自己的城市（如果需要）
  let selfCity = null
  if (selfCityName !== undefined && selfCityName !== null) {
    selfCity = caster.cities[selfCityName]
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
      '玉碎瓦全': () => battleSkills.useBattleSkills().executeYuSuiWaQuan(caster, target, targetCityName),
      '合纵连横': () => battleSkills.useBattleSkills().executeHeZongLianHeng(caster, target),
      '寸步难行': () => battleSkills.useBattleSkills().executeMuBuZhuanJing(caster, target),
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
      '计划单列': () => nonBattleSkills.useNonBattleSkills().executeJiHuaDanLie(caster, selfCityName),
      '无中生有': () => nonBattleSkills.useNonBattleSkills().executeWuZhongShengYou(caster),

      // ========== 2. 治疗/HP增强类 (10个) ==========
      '快速治疗': () => nonBattleSkills.useNonBattleSkills().executeQuickHeal(caster, selfCityName),
      '高级治疗': () => nonBattleSkills.useNonBattleSkills().executeAdvancedHeal(caster, [selfCityName]),
      '借尸还魂': () => nonBattleSkills.useNonBattleSkills().executeJieShiHuanHun(caster, selfCityName),
      '实力增强': () => nonBattleSkills.useNonBattleSkills().executeShiLiZengQiang(caster),
      '士气大振': () => nonBattleSkills.useNonBattleSkills().executeShiQiDaZhen(caster),
      '苟延残喘': () => nonBattleSkills.useNonBattleSkills().executeGouYanCanChuan(caster),
      '众志成城': () => nonBattleSkills.useNonBattleSkills().executeZhongZhiChengCheng(caster),
      '焕然一新': () => nonBattleSkills.useNonBattleSkills().executeHuanRanYiXin(caster, selfCityName),
      '厚积薄发': () => nonBattleSkills.useNonBattleSkills().executeHouJiBaoFa(caster, selfCityName),
      '血量存储': () => nonBattleSkills.useNonBattleSkills().executeHpBank(caster, selfCityName, amount),

      // ========== 3. 保护/防御类 (12个) ==========
      '城市保护': () => nonBattleSkills.useNonBattleSkills().executeCityProtection(caster, selfCityName),
      '钢铁城市': () => nonBattleSkills.useNonBattleSkills().executeIronCity(caster, selfCityName),
      '定海神针': () => nonBattleSkills.useNonBattleSkills().executeDingHaiShenZhen(caster, selfCityName),
      '坚不可摧': () => nonBattleSkills.useNonBattleSkills().executeJianBuKeCui(caster),
      '步步高升': () => nonBattleSkills.useNonBattleSkills().executeBuBuGaoSheng(caster, selfCityName),
      '海市蜃楼': () => nonBattleSkills.useNonBattleSkills().executeHaiShiShenLou(caster),
      '副中心制': () => nonBattleSkills.useNonBattleSkills().executeFuZhongXinZhi(caster, selfCityName),
      '生于紫室': () => nonBattleSkills.useNonBattleSkills().executeShengYuZiShi(caster, selfCityName),
      '深藏不露': () => nonBattleSkills.useNonBattleSkills().executeShenCangBuLu(caster, selfCity),
      '技能保护': () => nonBattleSkills.useNonBattleSkills().executeJiNengBaoHu(caster, skillName),

      // ========== 4. 攻击/伤害类 (18个) ==========
      '无知无畏': () => nonBattleSkills.useNonBattleSkills().executeWuZhiWuWei(caster, target, selfCityName),
      '一落千丈': () => nonBattleSkills.useNonBattleSkills().executeTiDengDingSun(caster, target, targetCityName),
      '连续打击': () => nonBattleSkills.useNonBattleSkills().executeLianXuDaJi(caster, target),
      '波涛汹涌': () => nonBattleSkills.useNonBattleSkills().executeBotaoXiongYong(caster, target),
      '狂轰滥炸': () => nonBattleSkills.useNonBattleSkills().executeKuangHongLanZha(caster, target),
      '横扫一空': () => nonBattleSkills.useNonBattleSkills().executeHengSaoYiKong(caster, target),
      '万箭齐发': () => nonBattleSkills.useNonBattleSkills().executeWanJianQiFa(caster, target),
      '降维打击': () => nonBattleSkills.useNonBattleSkills().executeJiangWeiDaJi(caster, target, targetCityName),
      '定时爆破': () => nonBattleSkills.useNonBattleSkills().executeDingShiBaoPo(caster, target, targetCityName),
      '灰飞烟灭': () => nonBattleSkills.useNonBattleSkills().executeYongJiuCuiHui(caster, target, targetCityName),
      '连锁反应': () => nonBattleSkills.useNonBattleSkills().executeLianSuoFanYing(caster, target, targetCityName),
      '进制扭曲': () => nonBattleSkills.useNonBattleSkills().executeJinZhiNiuQu(caster, target, targetCityName),
      '整齐划一': () => nonBattleSkills.useNonBattleSkills().executeZhengQiHuaYi(caster, target),
      '天灾人祸': () => nonBattleSkills.useNonBattleSkills().executeTianZaiRenHuo(caster, target),
      '自相残杀': () => nonBattleSkills.useNonBattleSkills().executeZiXiangCanSha(caster, target),
      '中庸之道': () => nonBattleSkills.useNonBattleSkills().executeZhongYongZhiDao(caster, target),
      '夷为平地': () => nonBattleSkills.useNonBattleSkills().executeYiWeiPingDi(caster, target, targetCityName),
      '招贤纳士': () => nonBattleSkills.useNonBattleSkills().executeZhaoXianNaShi(caster, target, targetCityName),

      // ========== 5. 控制/交换类 (15个) ==========
      '先声夺人': () => nonBattleSkills.useNonBattleSkills().executeXianShengDuoRen(caster, target, { casterCityName: selfCityName }),
      '时来运转': () => nonBattleSkills.useNonBattleSkills().executeShiLaiYunZhuan(caster, selfCityName),
      '人质交换': () => nonBattleSkills.useNonBattleSkills().executeRenZhiJiaoHuan(caster, target, selfCityName, targetCityName),
      '改弦更张': () => nonBattleSkills.useNonBattleSkills().executeGaiXianGengZhang(caster),
      '拔旗易帜': () => nonBattleSkills.useNonBattleSkills().executeBaQiYiZhi(caster, selfCityName),
      '避而不见': () => nonBattleSkills.useNonBattleSkills().executeBiErBuJian(caster, selfCityName),
      '狐假虎威': () => nonBattleSkills.useNonBattleSkills().executeHuJiaHuWei(caster, selfCityName),
      '李代桃僵': () => nonBattleSkills.useNonBattleSkills().executeLiDaiTaoJiang(caster, selfCityName, targetCityName),
      '点石成金': () => nonBattleSkills.useNonBattleSkills().executeHaoGaoWuYuan(caster, target, selfCityName, targetCityName),
      '数位反转': () => nonBattleSkills.useNonBattleSkills().executeShuWeiFanZhuan(caster, selfCityName),
      '战略转移': () => nonBattleSkills.useNonBattleSkills().executeZhanLueZhuanYi(caster, selfCityName, targetCityName),
      '倒反天罡': () => nonBattleSkills.useNonBattleSkills().executeDaoFanTianGang(caster, target, targetCityName),

      // ========== 6. 情报/侦查类 (6个) ==========
      '城市侦探': () => nonBattleSkills.useNonBattleSkills().executeCityDetective(caster, target, targetCityName),
      '城市预言': () => nonBattleSkills.useNonBattleSkills().executeCityProphecy(caster, target),
      '明察秋毫': () => nonBattleSkills.useNonBattleSkills().executeMingChaQiuHao(caster, target),
      '一举两得': () => nonBattleSkills.useNonBattleSkills().executeYiJuLiangDe(caster, target),
      '不露踪迹': () => nonBattleSkills.useNonBattleSkills().executeBuLuZongJi(caster, selfCityName),
      '博学多才': () => nonBattleSkills.useNonBattleSkills().executeBoXueDuoCai(caster, selfCityName),

      // ========== 7. 省份相关类 (11个) ==========
      '四面楚歌': () => nonBattleSkills.useNonBattleSkills().executeSiMianChuGe(caster, target),
      '搬运救兵·普通': () => nonBattleSkills.useNonBattleSkills().executeBanYunJiuBing(caster, selfCityName, false),
      '搬运救兵·高级': () => nonBattleSkills.useNonBattleSkills().executeBanYunJiuBing(caster, selfCityName, true),
      '大义灭亲': () => nonBattleSkills.useNonBattleSkills().executeDaYiMieQin(caster, selfCityName),
      '强制搬运': () => nonBattleSkills.useNonBattleSkills().executeQiangZhiBanYun(caster, target, targetCityName),
      '代行省权': () => nonBattleSkills.useNonBattleSkills().executeDaiXingShengQuan(caster, selfCityName),
      '守望相助': () => nonBattleSkills.useNonBattleSkills().executeShouWangXiangZhu(caster, selfCityName),
      '行政中心': () => nonBattleSkills.useNonBattleSkills().executeXingZhengZhongXin(caster, selfCityName),
      '以礼来降': () => nonBattleSkills.useNonBattleSkills().executeYiLiLaiJiang(caster, target, targetCityName),
      '趁其不备·随机': () => nonBattleSkills.useNonBattleSkills().executeChenQiBuBei(caster, target, null),
      '趁其不备·指定': () => nonBattleSkills.useNonBattleSkills().executeChenQiBuBei(caster, target, targetCityName),

      // ========== 8. 特殊机制类 (14个) ==========
      '无懈可击': () => nonBattleSkills.useNonBattleSkills().executeWuXieKeJi(caster, target),
      '事半功倍': () => nonBattleSkills.useNonBattleSkills().executeShiBanGongBei(caster, target, skillName),
      '过河拆桥': () => nonBattleSkills.useNonBattleSkills().executeGuoHeChaiQiao(caster),
      '解除封锁': () => nonBattleSkills.useNonBattleSkills().executeJieChuFengSuo(caster),
      '一触即发': () => nonBattleSkills.useNonBattleSkills().executeYiChuJiFa(caster, target, targetCityName),
      '突破瓶颈': () => nonBattleSkills.useNonBattleSkills().executeTuPoiPingJing(caster, selfCityName),
      '当机立断': () => nonBattleSkills.useNonBattleSkills().executeDangJiLiDuan(caster, target),
      '强制转移·普通': () => nonBattleSkills.useNonBattleSkills().executeQiangZhiQianDu(caster, target, false),
      '强制转移·高级': () => nonBattleSkills.useNonBattleSkills().executeQiangZhiQianDu(caster, target, true),
      '言听计从': () => nonBattleSkills.useNonBattleSkills().executeYanTingJiCong(caster, target, targetCityName),
      '电磁感应': () => nonBattleSkills.useNonBattleSkills().executeDianCiGanYing(caster, target, targetCityName)
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
      // 使用Firebase update方法，只更新变化的字段，不覆盖整个房间数据
      const playerUpdates = {}
      roomData.players.forEach((player, idx) => {
        const gameStorePlayer = gameStore.players.find(p => p.name === player.name)
        if (gameStorePlayer) {
          // 更新城市HP和存活状态
          playerUpdates[`rooms/${currentRoomId.value}/players/${idx}/cities`] = Object.values(gameStorePlayer.cities).map(city => ({
            ...city,
            currentHp: city.currentHp,
            isAlive: city.isAlive !== false
          }))
          // 更新金币
          playerUpdates[`rooms/${currentRoomId.value}/players/${idx}/gold`] = gameStorePlayer.gold
        }
      })

      console.log('[PlayerMode] 准备更新玩家数据:', Object.keys(playerUpdates))

      // 同步 pendingSwaps 到 Firebase（先声夺人技能需要）
      console.log('[PlayerMode] 技能执行前检查 roomData.gameState:', roomData.gameState)

      if (!roomData.gameState) {
        console.log('[PlayerMode] gameState不存在，创建新的gameState对象')
        roomData.gameState = {
          currentRound: 1,
          battleProcessed: false,
          playerStates: {},
          knownCities: {},
          ironCities: {},
          strengthBoost: {},
          morale: {},
          yqgzMarks: [],
          battleLogs: [],
          pendingSwaps: []
        }
      }

      if (!roomData.gameState.pendingSwaps) {
        console.log('[PlayerMode] pendingSwaps不存在，创建新数组')
        roomData.gameState.pendingSwaps = []
      }

      // 关键修复：正确读取pendingSwaps (Pinia会自动解包ref)
      let pendingSwapsUpdate = []
      if (Array.isArray(gameStore.pendingSwaps)) {
        pendingSwapsUpdate = gameStore.pendingSwaps
        console.log('[PlayerMode] pendingSwaps已被Pinia解包,直接使用数组')
      } else if (gameStore.pendingSwaps?.value && Array.isArray(gameStore.pendingSwaps.value)) {
        pendingSwapsUpdate = gameStore.pendingSwaps.value
        console.log('[PlayerMode] pendingSwaps是未解包的ref,使用.value')
      } else {
        pendingSwapsUpdate = []
        console.warn('[PlayerMode] pendingSwaps既不是数组也不是ref,使用空数组')
      }

      console.log('[PlayerMode] 技能执行前 gameStore.pendingSwaps:', gameStore.pendingSwaps)
      console.log('[PlayerMode] 技能执行前 pendingSwaps类型:', Array.isArray(gameStore.pendingSwaps) ? 'Array' : typeof gameStore.pendingSwaps)
      console.log('[PlayerMode] 同步pendingSwaps到Firebase:', pendingSwapsUpdate.length, '条请求', pendingSwapsUpdate)

      // 关键修复：一次性更新所有数据（玩家数据 + pendingSwaps），避免触发多次监听器
      // 将pendingSwaps也加入到playerUpdates中，一起更新
      playerUpdates[`rooms/${currentRoomId.value}/gameState/pendingSwaps`] = pendingSwapsUpdate

      console.log('[PlayerMode] 准备一次性更新到Firebase:', Object.keys(playerUpdates).length, '个字段')

      if (Object.keys(playerUpdates).length > 0) {
        const { getDatabase, ref: dbRef, update } = await import('firebase/database')
        const db = getDatabase()
        await update(dbRef(db), playerUpdates)
        console.log('[PlayerMode] 所有数据已一次性同步到Firebase（玩家数据 + pendingSwaps）')
      }
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
 * 处理技能执行失败
 */
function handleSkillFailed(failureData) {
  console.log('[PlayerMode] 技能执行失败', failureData)

  // 设置失败信息
  skillFailureInfo.value = {
    skillName: failureData.skill,
    message: failureData.result?.message || failureData.error || '技能执行失败',
    timestamp: Date.now()
  }

  // 显示失败弹窗
  showSkillFailureModal.value = true

  // 添加到游戏日志
  gameStore.addLog(`❌ ${failureData.skill} 执行失败: ${skillFailureInfo.value.message}`)
}

/**
 * 关闭技能失败弹窗
 */
function closeSkillFailureModal() {
  showSkillFailureModal.value = false
  skillFailureInfo.value = null
}

/**
 * 处理先声夺人交换请求被接受
 */
async function handleSwapAccepted({ swap, result }) {
  console.log('[PlayerMode] 交换请求已接受', { swap, result })

  if (!currentRoomId.value) {
    console.error('[PlayerMode] 缺少房间信息')
    return
  }

  try {
    // 获取最新房间数据
    const roomData = await getRoomData(currentRoomId.value)
    if (!roomData) {
      console.error('[PlayerMode] 无法获取房间数据')
      return
    }

    // 同步交换后的城市数据到 Firebase
    const initiator = gameStore.players.find(p => p.name === swap.initiatorName)
    const target = gameStore.players.find(p => p.name === swap.targetName)

    if (initiator && target) {
      const initiatorRoom = roomData.players.find(p => p.name === initiator.name)
      const targetRoom = roomData.players.find(p => p.name === target.name)

      if (initiatorRoom && targetRoom) {
        // 同步城市列表 - 保持对象结构
        initiatorRoom.cities = {}
        Object.entries(initiator.cities).forEach(([cityName, city]) => {
          initiatorRoom.cities[cityName] = {
            ...city,
            currentHp: city.currentHp,
            isAlive: city.isAlive !== false
          }
        })

        targetRoom.cities = {}
        Object.entries(target.cities).forEach(([cityName, city]) => {
          targetRoom.cities[cityName] = {
            ...city,
            currentHp: city.currentHp,
            isAlive: city.isAlive !== false
          }
        })

        // 添加交换日志到battleLogs
        if (!roomData.gameState.battleLogs) {
          roomData.gameState.battleLogs = []
        }
        roomData.gameState.battleLogs.push({
          message: result.message,
          timestamp: Date.now(),
          round: roomData.gameState.currentRound || 1,
          isPrivate: false
        })

        // 同步 pendingSwaps 到 Firebase
        if (!roomData.gameState.pendingSwaps) {
          roomData.gameState.pendingSwaps = []
        }
        // 关键修复：Pinia自动解包ref，直接使用gameStore.pendingSwaps
        roomData.gameState.pendingSwaps = gameStore.pendingSwaps

        // 保存到Firebase
        await saveRoomData(currentRoomId.value, roomData)
        console.log('[PlayerMode] 交换结果已同步到Firebase')

        // 注释：不在这里添加本地日志，因为acceptPreemptiveStrike已经添加过了
        // 避免重复日志：acceptPreemptiveStrike在line 1197-1200已经使用addSkillEffectLog添加了日志
        // gameStore.addLog(result.message)
      }
    }
  } catch (error) {
    console.error('[PlayerMode] 同步交换结果失败:', error)
    gameStore.addLog(`同步交换结果异常: ${error.message}`)
  }
}

/**
 * 处理先声夺人交换请求被拒绝
 */
async function handleSwapRejected({ swap, result }) {
  console.log('[PlayerMode] 交换请求已拒绝', { swap, result })

  if (!currentRoomId.value) {
    console.error('[PlayerMode] 缺少房间信息')
    return
  }

  try {
    // 获取最新房间数据
    const roomData = await getRoomData(currentRoomId.value)
    if (!roomData) {
      console.error('[PlayerMode] 无法获取房间数据')
      return
    }

    // 添加拒绝日志到battleLogs
    if (!roomData.gameState.battleLogs) {
      roomData.gameState.battleLogs = []
    }
    roomData.gameState.battleLogs.push({
      message: result.message || `${swap.targetName}拒绝了${swap.initiatorName}的先声夺人请求`,
      timestamp: Date.now(),
      round: roomData.gameState.currentRound || 1,
      isPrivate: false
    })

    // 同步 pendingSwaps 到 Firebase
    if (!roomData.gameState.pendingSwaps) {
      roomData.gameState.pendingSwaps = []
    }
    // 关键修复：Pinia自动解包ref，直接使用gameStore.pendingSwaps
    roomData.gameState.pendingSwaps = gameStore.pendingSwaps

    // 保存到Firebase
    await saveRoomData(currentRoomId.value, roomData)
    console.log('[PlayerMode] 拒绝结果已同步到Firebase')

    // 添加到本地日志
    gameStore.addLog(result.message || `${swap.targetName}拒绝了${swap.initiatorName}的先声夺人请求`)
  } catch (error) {
    console.error('[PlayerMode] 同步拒绝结果失败:', error)
    gameStore.addLog(`同步拒绝结果异常: ${error.message}`)
  }
}

/**
 * 确认城市部署
 */
async function handleDeploymentConfirmed({ cities, skill, skillData, activatedCitySkills }) {
  console.log('[PlayerMode] 确认城市部署', { cities, skill, activatedCitySkills })
  console.log('[PlayerMode] currentPlayer.name:', currentPlayer.value?.name)
  console.log('[PlayerMode] currentPlayer.cities:')
  if (currentPlayer.value?.cities) {
    Object.entries(currentPlayer.value.cities).forEach(([cityName, city]) => {
      console.log(`  ${cityName}: ${city.name} (HP: ${city.currentHp ?? city.hp})`)
    })
  }

  // 诊断日志：详细显示激活的城市技能
  console.log('[PlayerMode] 激活的城市技能详情:')
  if (activatedCitySkills && Object.keys(activatedCitySkills).length > 0) {
    Object.keys(activatedCitySkills).forEach(cityName => {
      const skillData = activatedCitySkills[cityName]
      const actualCity = currentPlayer.value?.cities[cityName]
      console.log(`  cityName=${cityName}: skillData.cityName="${skillData.cityName}", actualCity="${actualCity?.name}", 匹配=${skillData.cityName === actualCity?.name}`)
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
      console.log('[PlayerMode] handleDeploymentConfirmed - 初始化gameState')

      // 构建playerStates
      const playerStates = {}
      roomData.players.forEach(player => {
        if (player && player.name) {
          playerStates[player.name] = {
            _initialized: true,  // 哨兵值：防止Firebase剥离空对象
            currentBattleCities: [],
            battleGoldSkill: null,
            battleGoldSkillData: null,
            deadCities: [],
            usedSkills: [],
            activatedCitySkills: null
          }
        }
      })

      roomData.gameState = {
        currentRound: 1,
        battleProcessed: false,
        playerStates: Object.keys(playerStates).length > 0 ? playerStates : null,
        barrier: null,
        protections: null,
        ironCities: null,
        strengthBoost: null,
        morale: null,
        yqgzMarks: [],
        battleLogs: [],
        pendingSwaps: []  // 先声夺人待处理请求数组
      }

      console.log('[PlayerMode] handleDeploymentConfirmed - gameState初始化完成，playerStates keys:', Object.keys(playerStates))
    }

    // 确保 playerStates 存在（即使 gameState 已存在）
    if (!roomData.gameState.playerStates) {
      console.log('[PlayerMode] handleDeploymentConfirmed - playerStates不存在，重新初始化')
      const playerStates = {}
      roomData.players.forEach(player => {
        if (player && player.name) {
          playerStates[player.name] = {
            _initialized: true,  // 哨兵值
            currentBattleCities: [],
            battleGoldSkill: null,
            battleGoldSkillData: null,
            deadCities: [],
            usedSkills: [],
            activatedCitySkills: null
          }
        }
      })
      roomData.gameState.playerStates = Object.keys(playerStates).length > 0 ? playerStates : null
      console.log('[PlayerMode] handleDeploymentConfirmed - playerStates重新初始化完成，keys:', Object.keys(playerStates))
    }

    // 确保 playerStates 是对象而不是null
    if (!roomData.gameState.playerStates || typeof roomData.gameState.playerStates !== 'object') {
      console.log('[PlayerMode] handleDeploymentConfirmed - playerStates为null或不是对象，重新初始化为空对象')
      roomData.gameState.playerStates = {}
    }

    // 初始化玩家状态（如果还没有）
    if (!roomData.gameState.playerStates[currentPlayer.value.name]) {
      console.log('[PlayerMode] handleDeploymentConfirmed - 初始化当前玩家的playerState:', currentPlayer.value.name)
      roomData.gameState.playerStates[currentPlayer.value.name] = {
        _initialized: true,  // 哨兵值
        currentBattleCities: [],
        battleGoldSkill: null,
        battleGoldSkillData: null,
        deadCities: [],
        usedSkills: [],
        activatedCitySkills: null  // 用null代替{}
      }
    }

    const playerState = roomData.gameState.playerStates[currentPlayer.value.name]

    // 保存出战城市和技能
    playerState.currentBattleCities = cities.map(cityName => ({
      cityName,
      isStandGroundCity: skill === '按兵不动'
    }))
    playerState.battleGoldSkill = skill || null
    playerState.battleGoldSkillData = skillData || null  // 附加数据（目标城市等）
    playerState.activatedCitySkills = activatedCitySkills || null  // 用null代替{}

    // 关键修复：确保roomData.players中的cities对象和currentPlayer.cities一致
    const playerIdx = roomData.players.findIndex(p => p.name === currentPlayer.value.name)
    if (playerIdx !== -1) {
      console.log('[PlayerMode] ===== 同步cities对象到roomData =====')
      console.log('[PlayerMode] 同步前roomData.players[].cities:', Object.values(roomData.players[playerIdx].cities).map(c => c.name))
      console.log('[PlayerMode] currentPlayer.cities:', Object.values(currentPlayer.value.cities).map(c => c.name))

      // 深度克隆currentPlayer的cities到roomData，确保一致
      roomData.players[playerIdx].cities = JSON.parse(JSON.stringify(currentPlayer.value.cities))

      console.log('[PlayerMode] 同步后roomData.players[].cities:', Object.values(roomData.players[playerIdx].cities).map(c => c.name))
    }

    // 添加公开日志到roomData（所有玩家都能看到）
    if (!roomData.gameState.battleLogs) {
      roomData.gameState.battleLogs = []
    }
    roomData.gameState.battleLogs.push({
      message: `[回合${roomData.gameState.currentRound || 1}] ${currentPlayer.value.name} 已确认出战`,
      timestamp: Date.now(),
      round: roomData.gameState.currentRound || 1,
      isPrivate: false // 公开日志，所有人可见
    })

    // 关键修复：使用Firebase atomic multi-path update代替全量set
    // 防止两个玩家同时部署时互相覆盖对方的数据
    {
      const deployPlayerName = currentPlayer.value.name
      const deployPlayerIdx = roomData.players.findIndex(p => p.name === deployPlayerName)
      const deployRoomId = currentRoomId.value

      try {
        const { getDatabase, ref: dbRef, update } = await import('firebase/database')
        const db = getDatabase()

        // 构建multi-path update：只更新当前玩家相关的路径
        const updates = {}
        // 更新当前玩家的playerState（出战城市、技能等）
        updates[`rooms/${deployRoomId}/gameState/playerStates/${deployPlayerName}`] = roomData.gameState.playerStates[deployPlayerName]
        // 更新当前玩家的cities数据
        if (deployPlayerIdx !== -1) {
          updates[`rooms/${deployRoomId}/players/${deployPlayerIdx}/cities`] = roomData.players[deployPlayerIdx].cities
        }
        // 更新battleLogs
        updates[`rooms/${deployRoomId}/gameState/battleLogs`] = roomData.gameState.battleLogs
        // 更新lastActivity
        updates[`rooms/${deployRoomId}/lastActivity`] = Date.now()

        await update(dbRef(db), updates)
        console.log('[PlayerMode] 部署数据已通过atomic multi-path update保存，避免覆盖其他玩家')
      } catch (updateError) {
        console.error('[PlayerMode] multi-path update失败，回退到全量保存:', updateError)
        await saveRoomData(currentRoomId.value, roomData)
      }
    }
    console.log('[PlayerMode] 部署和日志已保存，等待其他玩家')

    // 关键修复：立即重新读取验证数据是否保存成功
    const verifyRoomData = await getRoomData(currentRoomId.value)
    if (verifyRoomData) {
      const verifyState = verifyRoomData.gameState.playerStates[currentPlayer.value.name]
      console.log('[PlayerMode] ===== 验证保存结果 =====')
      console.log('[PlayerMode] 验证当前玩家部署状态:', verifyState)
      console.log('[PlayerMode] currentBattleCities长度:', verifyState?.currentBattleCities?.length || 0)
      console.log('[PlayerMode] battleGoldSkill:', verifyState?.battleGoldSkill)
      console.log('[PlayerMode] ========================================')

      // 检查所有玩家的部署状态
      console.log('[PlayerMode] ===== 检查所有玩家部署状态 =====')
      verifyRoomData.players.forEach(player => {
        const state = verifyRoomData.gameState.playerStates[player.name]
        // 关键修复：确保currentBattleCities是数组（Firebase可能返回对象）
        const battleCities = Array.isArray(state?.currentBattleCities)
          ? state.currentBattleCities
          : (state?.currentBattleCities ? Object.values(state.currentBattleCities) : [])
        const deployed = state && (
          battleCities.length > 0 ||
          state.battleGoldSkill === '按兵不动'
        )
        console.log(`[PlayerMode] ${player.name}: 已部署=${deployed}, currentBattleCities=${battleCities.length}`)
      })
      console.log('[PlayerMode] ========================================')
    }

    // 注释：不在本地添加日志，统一通过Firebase监听器同步，避免重复

    // 检查是否有未确认的对手，添加私密日志
    const allPlayers = roomData.players.filter(p => p.name !== currentPlayer.value.name)
    const unconfirmedOpponents = allPlayers.filter(opponent => {
      const oppState = roomData.gameState.playerStates[opponent.name]
      // 关键修复：确保currentBattleCities是数组（Firebase可能返回对象）
      const battleCities = Array.isArray(oppState?.currentBattleCities)
        ? oppState.currentBattleCities
        : (oppState?.currentBattleCities ? Object.values(oppState.currentBattleCities) : [])
      const deployed = oppState && (
        battleCities.length > 0 ||
        oppState.battleGoldSkill === '按兵不动'
      )
      return !deployed
    })

    if (unconfirmedOpponents.length > 0) {
      const opponentNames = unconfirmedOpponents.map(p => p.name).join('、')
      gameStore.addPrivateLog(currentPlayer.value.name, `等待 ${opponentNames} 确认出战...`)
      console.log('[PlayerMode] 还有未确认的对手:', opponentNames)
    } else {
      console.log('[PlayerMode] 所有玩家都已确认出战！')
    }

    // 同步玩家数据到 gameStore
    syncRoomDataToGameStore(roomData)

    // 关键修复Bug2: 初始化initialCities（用于快速治疗等技能）
    console.log('[PlayerMode] 初始化initialCities')
    gameStore.initialCities = {}
    roomData.players.forEach(player => {
      const citiesObj = {}
      Object.values(player.cities).forEach(city => {
        citiesObj[city.name] = {
          name: city.name,
          hp: city.hp || city.currentHp || city.baseHp,
          baseHp: city.baseHp || city.hp || city.currentHp,
          maxHp: city.maxHp || city.hp || city.baseHp
        }
      })
      gameStore.initialCities[player.name] = citiesObj
      console.log(`[PlayerMode] 初始化${player.name}的initialCities:`, Object.keys(citiesObj).length, '座城市')
    })

    // 验证同步后的数据一致性
    console.log('[PlayerMode] ===== 验证数据一致性 =====')
    const gameStorePlayer = gameStore.players.find(p => p.name === currentPlayer.value.name)
    if (gameStorePlayer) {
      console.log('[PlayerMode] gameStore中的cities:', Object.values(gameStorePlayer.cities).map(c => c.name))
      console.log('[PlayerMode] currentPlayer.cities:', Object.values(currentPlayer.value.cities).map(c => c.name))

      // 检查城市名称是否一致
      const gameStoreCityNames = Object.keys(gameStorePlayer.cities).sort()
      const currentPlayerCityNames = Object.keys(currentPlayer.value.cities).sort()

      let allMatch = gameStoreCityNames.length === currentPlayerCityNames.length &&
                     gameStoreCityNames.every((name, i) => name === currentPlayerCityNames[i])

      if (!allMatch) {
        console.error(`[PlayerMode] ⚠️ 城市列表不匹配:`)
        console.error(`  gameStore: ${gameStoreCityNames.join(', ')}`)
        console.error(`  currentPlayer: ${currentPlayerCityNames.join(', ')}`)
      } else {
        console.log('[PlayerMode] ✅ 所有城市名称匹配正确')
      }
    }

    // 关键修复：选择性更新currentPlayer，不覆盖cities
    const updatedPlayerData = roomData.players.find(p => p.name === currentPlayer.value.name)
    if (updatedPlayerData && currentPlayer.value) {
      console.log('[PlayerMode] handleDeploymentConfirmed - 选择性更新currentPlayer（保留cities）')

      // 只更新必要字段，保留本地的cities
      currentPlayer.value.gold = updatedPlayerData.gold
      currentPlayer.value.roster = updatedPlayerData.roster
      currentPlayer.value.centerCityName = updatedPlayerData.centerCityName
      currentPlayer.value.ready = updatedPlayerData.ready

      console.log('[PlayerMode] handleDeploymentConfirmed - cities未被修改，仍为:', Object.values(currentPlayer.value.cities).map(c => c.name))
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
    if (!player || !player.cities) {
      console.warn('[PlayerMode] syncRoomDataToGameStore - 玩家或城市数据缺失', player)
      return
    }

    // 关键修复：支持对象结构的cities（城市名称迁移后）
    // player.cities可以是对象（新格式）或数组（旧格式）
    const citiesIsObject = typeof player.cities === 'object' && !Array.isArray(player.cities)
    if (!citiesIsObject && !Array.isArray(player.cities)) {
      console.warn('[PlayerMode] syncRoomDataToGameStore - cities既不是对象也不是数组', player)
      return
    }

    // 查找现有玩家数据（如果有）
    const existingPlayer = gameStore.players.find(p => p.name === player.name)

    // 确保每个城市都有正确的HP和存活状态
    // 关键修复Bug1: 同步streaks数据（疲劳系统）
    let streaks = {}
    if (player.streaks) {
      streaks = { ...player.streaks }
      console.log(`[PlayerMode] syncRoomDataToGameStore - 从roomData加载${player.name}的streaks:`, streaks)
    } else if (existingPlayer && existingPlayer.streaks) {
      streaks = { ...existingPlayer.streaks }
      console.log(`[PlayerMode] syncRoomDataToGameStore - 保留${player.name}的旧streaks:`, streaks)
    }

    // 关键修复：支持对象结构的cities
    // 将cities转换为对象格式（如果还不是的话）
    let citiesObj = {}
    if (citiesIsObject) {
      // 对象格式，但需要检查是否为数字键（Firebase可能将数组转为{0:..., 3:...}的稀疏对象）
      const keys = Object.keys(player.cities)
      const hasNumericKeys = keys.length > 0 && keys.every(k => !isNaN(k) && k !== '')
      if (hasNumericKeys) {
        // 数字键对象，转换为城市名称键
        Object.values(player.cities).forEach(city => {
          if (city && city.name) citiesObj[city.name] = city
        })
        console.log(`[PlayerMode] syncRoomDataToGameStore - ${player.name}的cities有数字键，已转换为城市名称键，城市数量: ${Object.keys(citiesObj).length}`)
      } else {
        citiesObj = player.cities
        console.log(`[PlayerMode] syncRoomDataToGameStore - ${player.name}的cities是对象格式，城市数量: ${Object.keys(citiesObj).length}`)
      }
    } else {
      // 数组格式，转换为对象格式（使用城市名称作为key）
      Object.values(player.cities).forEach(city => {
        if (city && city.name) citiesObj[city.name] = city
      })
      console.log(`[PlayerMode] syncRoomDataToGameStore - ${player.name}的cities从数组转换为对象，城市数量: ${Object.keys(citiesObj).length}`)
    }

    // 确保每个城市都有正确的HP和存活状态
    const cities = {}
    Object.entries(citiesObj).forEach(([cityName, city]) => {
      // 优先使用roomData中的currentHp（战斗后已更新）
      let currentHp = city.currentHp !== undefined ? city.currentHp : city.hp
      let isAlive = city.isAlive !== undefined ? city.isAlive : (currentHp > 0)

      cities[cityName] = {
        ...city,
        currentHp: currentHp,
        isAlive: isAlive
      }
    })

    // 如果玩家已存在,更新数据;否则添加新玩家
    const playerIndex = gameStore.players.findIndex(p => p.name === player.name)
    const playerData = {
      name: player.name,
      gold: player.gold || 2,
      cities: cities,
      centerCityName: (() => {
        let ccn = player.centerCityName
        if (typeof ccn === 'number' || (typeof ccn === 'string' && !isNaN(ccn) && !cities[ccn])) {
          // Numeric centerCityName from old data - convert to city name
          const cityNames = Object.keys(cities)
          const numIdx = Number(ccn)
          ccn = cityNames[numIdx] || cityNames[0]
        }
        if (!ccn || !cities[ccn]) {
          ccn = Object.keys(cities)[0] || null
        }
        return ccn
      })(),
      roster: player.roster || [],
      battleModifiers: [],
      streaks: streaks // 关键修复Bug1: 添加streaks字段
    }

    if (playerIndex >= 0) {
      // 更新现有玩家
      gameStore.players[playerIndex] = playerData
      console.log(`[PlayerMode] syncRoomDataToGameStore - 更新${player.name}的streaks:`, streaks)
    } else {
      // 添加新玩家
      gameStore.players.push(playerData)
      console.log(`[PlayerMode] syncRoomDataToGameStore - 新增${player.name}的streaks:`, streaks)
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

    // 关键修复：在syncRoomDataToGameStore中同步pendingSwaps
    // 这样可以确保在Vue响应性更新触发computed之前,pendingSwaps就已经同步了
    // 注意：Pinia自动解包ref,直接使用gameStore.pendingSwaps即可
    if (roomData.gameState.pendingSwaps && Array.isArray(roomData.gameState.pendingSwaps)) {
      gameStore.pendingSwaps = roomData.gameState.pendingSwaps
      console.log(`[PlayerMode] syncRoomDataToGameStore中同步pendingSwaps: ${gameStore.pendingSwaps.length}条`)
    }

    // 关键修复：同步knownCities到gameStore
    // Firebase存储的是数组，gameStore需要Set
    if (roomData.gameState.knownCities) {
      console.log('[PlayerMode] syncRoomDataToGameStore - 同步knownCities')
      Object.keys(roomData.gameState.knownCities).forEach(observer => {
        if (!gameStore.knownCities[observer]) {
          gameStore.knownCities[observer] = {}
        }
        Object.keys(roomData.gameState.knownCities[observer]).forEach(owner => {
          const cities = roomData.gameState.knownCities[observer][owner]
          gameStore.knownCities[observer][owner] = new Set(Array.isArray(cities) ? cities : [])
          console.log(`[PlayerMode] 同步knownCities[${observer}][${owner}] = [${Array.from(gameStore.knownCities[observer][owner]).join(', ')}]`)
        })
      })
    }

    // 同步代行省权状态
    if (roomData.gameState.actingCapital) {
      gameStore.actingCapital = JSON.parse(JSON.stringify(roomData.gameState.actingCapital))
      console.log('[PlayerMode] syncRoomDataToGameStore - 同步actingCapital:', JSON.stringify(gameStore.actingCapital))
    }

    // 同步守望相助状态
    if (roomData.gameState.mutualWatch) {
      gameStore.mutualWatch = JSON.parse(JSON.stringify(roomData.gameState.mutualWatch))
    }

    // 同步生于紫室状态
    if (roomData.gameState.purpleChamber) {
      Object.keys(roomData.gameState.purpleChamber).forEach(playerName => {
        gameStore.purpleChamber[playerName] = roomData.gameState.purpleChamber[playerName]
      })
      console.log('[PlayerMode] syncRoomDataToGameStore - 同步purpleChamber:', JSON.stringify(gameStore.purpleChamber))
    }

    // 同步副中心制状态
    if (roomData.gameState.subCenters) {
      Object.keys(roomData.gameState.subCenters).forEach(playerName => {
        gameStore.subCenters[playerName] = roomData.gameState.subCenters[playerName]
      })
    }

    // 同步天灾人祸状态
    if (roomData.gameState.disaster) {
      Object.keys(roomData.gameState.disaster).forEach(playerName => {
        if (!gameStore.disaster[playerName]) gameStore.disaster[playerName] = {}
        Object.assign(gameStore.disaster[playerName], roomData.gameState.disaster[playerName])
      })
    }

    // 同步厚积薄发状态
    if (roomData.gameState.hjbf) {
      Object.keys(roomData.gameState.hjbf).forEach(playerName => {
        if (!gameStore.hjbf[playerName]) gameStore.hjbf[playerName] = {}
        Object.assign(gameStore.hjbf[playerName], roomData.gameState.hjbf[playerName])
      })
    }

    // 同步电磁感应状态
    if (roomData.gameState.electromagnetic) {
      Object.keys(roomData.gameState.electromagnetic).forEach(targetName => {
        gameStore.electromagnetic[targetName] = roomData.gameState.electromagnetic[targetName]
      })
      console.log('[PlayerMode] syncRoomDataToGameStore - 同步electromagnetic:', JSON.stringify(gameStore.electromagnetic))
    }

    // 同步屏障状态
    if (roomData.gameState.barrier) {
      Object.keys(roomData.gameState.barrier).forEach(playerName => {
        gameStore.barrier[playerName] = roomData.gameState.barrier[playerName]
      })
      console.log('[PlayerMode] syncRoomDataToGameStore - 同步barrier:', JSON.stringify(gameStore.barrier))
    }

    // 同步bannedCities状态
    if (roomData.gameState.bannedCities) {
      Object.keys(roomData.gameState.bannedCities).forEach(playerName => {
        gameStore.bannedCities[playerName] = roomData.gameState.bannedCities[playerName]
      })
    }
  }

  console.log('[PlayerMode] gameStore已更新，玩家数量:', gameStore.players.length)
}

/**
 * 开始监听房间数据
 */
function startRoomDataListener() {
  if (!currentRoomId.value) return

  // 防止重复启动监听器
  if (roomDataListener) {
    console.log('[PlayerMode] 监听器已经在运行，跳过重复启动')
    return
  }

  console.log('[PlayerMode] 开始监听房间数据变化')

  roomDataListener = startRoomListener(currentRoomId.value, async (data) => {
    console.log('[PlayerMode] ===== 监听器被触发 =====', new Date().toLocaleTimeString())
    console.log('[PlayerMode] 触发前本地pendingSwaps:', gameStore.pendingSwaps?.length || 0, '条')
    console.log('[PlayerMode] 房间数据更新', data)
    console.log('[PlayerMode] 监听器收到的data keys:', Object.keys(data || {}))
    console.log('[PlayerMode] 监听器收到的gameState:', data.gameState)
    console.log('[PlayerMode] 监听器收到的gameState keys:', data.gameState ? Object.keys(data.gameState) : 'undefined')
    console.log('[PlayerMode] 监听器收到的pendingSwaps:', data.gameState?.pendingSwaps)
    console.log('[PlayerMode] 监听器收到的pendingSwaps长度:', data.gameState?.pendingSwaps?.length || 0)

    // 关键修复：规范化Firebase返回的players.cities数据
    // Firebase可能将城市名称键的对象转为数组或数字键对象
    if (data.players && Array.isArray(data.players)) {
      data.players.forEach(p => normalizePlayerCities(p))
    }

    // 同步数据到 gameStore
    syncRoomDataToGameStore(data)

    // 关键修复：选择性更新currentPlayer，不覆盖cities（防止数据被错误同步）
    const updatedPlayerData = data.players.find(p => p.name === currentPlayer.value?.name)
    if (updatedPlayerData && currentPlayer.value) {
      console.log('[PlayerMode] ===== BUG 6 诊断: 监听器更新 =====')
      console.log('[PlayerMode] 监听器 - 选择性更新currentPlayer（保留cities）')

      // 诊断：显示更新前的状态
      console.log('[PlayerMode] 更新前本地centerCityName:', currentPlayer.value.centerCityName)
      console.log('[PlayerMode] 更新前本地cities:')
      if (currentPlayer.value.cities) {
        Object.entries(currentPlayer.value.cities).forEach(([cityName, city]) => {
          console.log(`  ${cityName}: ${city.name}`)
        })
      }
      if (currentPlayer.value.centerCityName !== null && currentPlayer.value.centerCityName !== undefined) {
        console.log('[PlayerMode] 更新前本地centerCityName指向的城市:', currentPlayer.value.cities[currentPlayer.value.centerCityName]?.name)
      }

      // 诊断：显示Firebase传来的数据
      console.log('[PlayerMode] Firebase传来的centerCityName:', updatedPlayerData.centerCityName)
      console.log('[PlayerMode] Firebase传来的cities:')
      if (updatedPlayerData.cities) {
        Object.entries(updatedPlayerData.cities).forEach(([cityName, city]) => {
          console.log(`  ${cityName}: ${city.name}`)
        })
      }
      if (updatedPlayerData.centerCityName !== null && updatedPlayerData.centerCityName !== undefined) {
        console.log('[PlayerMode] Firebase centerCityName指向的城市:', updatedPlayerData.cities[updatedPlayerData.centerCityName]?.name)
      }

      // 只更新这些字段，保留本地的cities数组不变
      currentPlayer.value.gold = updatedPlayerData.gold
      currentPlayer.value.roster = updatedPlayerData.roster
      currentPlayer.value.centerCityName = updatedPlayerData.centerCityName
      currentPlayer.value.ready = updatedPlayerData.ready

      // 诊断：显示更新后的状态
      console.log('[PlayerMode] 更新后本地centerCityName:', currentPlayer.value.centerCityName)
      if (currentPlayer.value.centerCityName !== null && currentPlayer.value.centerCityName !== undefined) {
        console.log('[PlayerMode] 更新后本地centerCityName指向的城市:', currentPlayer.value.cities[currentPlayer.value.centerCityName]?.name)
        console.log('[PlayerMode] ⚠️ 如果这个城市名称与Firebase centerCityName指向的城市不同，说明数据不一致！')
      }
      console.log('[PlayerMode] ==========================================')

      // 只在特定情况下更新cities（如重新抽取、战斗后HP变化、城市交换）
      // 检查是否需要更新cities（通过比较城市数量判断）
      if (updatedPlayerData.cities && Object.keys(updatedPlayerData.cities).length !== Object.keys(currentPlayer.value.cities).length) {
        console.log('[PlayerMode] 监听器 - cities数量变化，更新cities')
        currentPlayer.value.cities = updatedPlayerData.cities
      } else if (updatedPlayerData.cities) {
        // 检查是否有城市名称变化（表示发生了交换）
        const updatedCityNames = Object.keys(updatedPlayerData.cities).sort()
        const currentCityNames = Object.keys(currentPlayer.value.cities).sort()

        const hasCitySwap = !updatedCityNames.every((name, i) => name === currentCityNames[i])

        if (hasCitySwap) {
          console.log(`[PlayerMode] 监听器 - 检测到城市交换`)
          console.log(`  之前: ${currentCityNames.join(', ')}`)
          console.log(`  之后: ${updatedCityNames.join(', ')}`)
        }

        if (hasCitySwap) {
          // 发生了城市交换，完全更新cities数组
          console.log('[PlayerMode] 监听器 - 检测到城市交换，完全更新cities')
          // 深拷贝整个cities对象
          currentPlayer.value.cities = JSON.parse(JSON.stringify(updatedPlayerData.cities))
        } else {
          // 没有交换，只更新HP和存活状态，不改变城市列表
          Object.entries(updatedPlayerData.cities).forEach(([cityName, updatedCity]) => {
            if (currentPlayer.value.cities[cityName]) {
              const localCity = currentPlayer.value.cities[cityName]
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
    }

    // 更新游戏状态到store
    if (data.gameState) {
      gameStore.currentRound = data.gameState.currentRound || 1

      // 同步战斗日志到本地（累积追加，不清空历史日志）
      if (data.gameState.battleLogs && Array.isArray(data.gameState.battleLogs)) {
        // 获取当前已有的日志时间戳，用于去重
        const existingTimestamps = new Set(gameStore.logs.map(log => log.timestamp))

        // 只追加新日志，避免重复
        const newLogs = data.gameState.battleLogs.filter(log => !existingTimestamps.has(log.timestamp))

        // 过滤私密日志：只显示公开日志或对当前玩家可见的私密日志
        const visibleLogs = newLogs.filter(log => {
          // 公开日志
          if (!log.isPrivate) return true
          // 私密日志且当前玩家在可见列表中
          if (log.isPrivate && log.visibleTo && log.visibleTo.includes(currentPlayer.value.name)) return true
          return false
        })

        visibleLogs.forEach(log => {
          gameStore.logs.push(log)
        })
        console.log(`[PlayerMode] 已追加${visibleLogs.length}条新日志（共${gameStore.logs.length}条）`)
      }

      // 同步已知城市到gameStore
      console.log('[PlayerMode] ===== 监听器同步knownCities =====')
      console.log('[PlayerMode] data.gameState.knownCities:', JSON.stringify(data.gameState.knownCities, null, 2))
      if (data.gameState.knownCities) {
        // 构建玩家名称→城市列表映射，用于将数字索引转回城市名称
        const playerCitiesMap = {}
        if (data.players && Array.isArray(data.players)) {
          data.players.forEach(p => {
            if (p && p.name && p.cities) {
              playerCitiesMap['p_' + p.name] = Object.keys(p.cities)
            }
          })
        }

        Object.keys(data.gameState.knownCities).forEach(observer => {
          if (!gameStore.knownCities[observer]) {
            gameStore.knownCities[observer] = {}
          }
          Object.keys(data.gameState.knownCities[observer]).forEach(owner => {
            const rawCities = data.gameState.knownCities[observer][owner]
            // 修复：将数字索引值转换为城市名称
            const ownerCityNames = playerCitiesMap[owner] || []
            const normalizedCities = (Array.isArray(rawCities) ? rawCities : []).map(val => {
              if (typeof val === 'string' && !isNaN(val) && val !== '' && ownerCityNames[Number(val)]) {
                const converted = ownerCityNames[Number(val)]
                console.log(`[PlayerMode] knownCities修复: "${val}" → "${converted}"`)
                return converted
              }
              return val
            })
            gameStore.knownCities[observer][owner] = normalizedCities
            console.log(`[PlayerMode] 监听器同步: knownCities[${observer}][${owner}] = [${normalizedCities.join(', ')}]`)
          })
        })
      }
      console.log('[PlayerMode] 监听器gameStore.knownCities同步完成:', JSON.stringify(gameStore.knownCities, null, 2))
      console.log('[PlayerMode] ==========================================')

      // 同步禁用技能状态（事半功倍）
      if (data.gameState.bannedSkills) {
        Object.keys(data.gameState.bannedSkills).forEach(playerName => {
          gameStore.bannedSkills[playerName] = data.gameState.bannedSkills[playerName]
        })
        console.log('[PlayerMode] 已同步bannedSkills:', JSON.stringify(gameStore.bannedSkills))
      }

      // 同步代行省权状态
      if (data.gameState.actingCapital) {
        gameStore.actingCapital = JSON.parse(JSON.stringify(data.gameState.actingCapital))
        console.log('[PlayerMode] 已同步actingCapital:', JSON.stringify(gameStore.actingCapital))
      }

      // 同步守望相助状态
      if (data.gameState.mutualWatch) {
        gameStore.mutualWatch = JSON.parse(JSON.stringify(data.gameState.mutualWatch))
      }

      // 验证pendingSwaps同步状态（已在syncRoomDataToGameStore中同步）
      console.log('[PlayerMode] 验证pendingSwaps同步状态:', {
        firebaseHas: !!data.gameState?.pendingSwaps,
        firebaseLength: data.gameState?.pendingSwaps?.length || 0,
        localLength: gameStore.pendingSwaps?.length || 0,
        localData: gameStore.pendingSwaps
      })

      // 最终状态验证
      console.log('[PlayerMode] 监听器处理完毕，最终本地pendingSwaps:', gameStore.pendingSwaps?.length || 0, '条')
      console.log('[PlayerMode] =================================')

      // 检查是否所有玩家都完成了中心城市选择
      if (currentStep.value === 'waiting-for-center-confirmation') {
        const allPlayersReady = data.players.every(p => p.ready === true)

        console.log('[PlayerMode] 监听器检测到等待中心城市确认状态')
        console.log('[PlayerMode] 所有玩家是否都已准备:', allPlayersReady)

        if (allPlayersReady) {
          console.log('[PlayerMode] 所有玩家已确认中心城市，自动进入部署界面')
          currentStep.value = 'city-deployment'
        }
      }

      // 关键修复：检查是否所有玩家都完成了部署
      // 关键修复：确保allDeployed始终返回布尔值，而不是undefined
      const allDeployed = data.gameState?.playerStates
        ? data.players.every(p => {
            const state = data.gameState.playerStates[p.name]
            // 关键修复：确保currentBattleCities是数组（Firebase可能返回对象）
            const battleCities = Array.isArray(state?.currentBattleCities)
              ? state.currentBattleCities
              : (state?.currentBattleCities ? Object.values(state.currentBattleCities) : [])
            const deployed = state && (
              battleCities.length > 0 ||
              state.battleGoldSkill === '按兵不动'
            )
            console.log(`[PlayerMode] 检查${p.name}部署状态: deployed=${deployed}, currentBattleCities=${battleCities.length}, battleGoldSkill=${state?.battleGoldSkill}`)
            return deployed
          })
        : false

      // 增强诊断日志：记录战斗触发条件
      const triggerTimestamp = Date.now()
      console.log(`[PlayerMode] ===== 战斗触发检查 (${triggerTimestamp}) =====`)
      console.log('[PlayerMode] allDeployed:', allDeployed)
      console.log('[PlayerMode] data.gameState.battleProcessed:', data.gameState.battleProcessed)
      console.log('[PlayerMode] isBattleProcessing.value:', isBattleProcessing.value)
      console.log('[PlayerMode] 当前玩家:', currentPlayer.value.name)
      console.log('[PlayerMode] 第一个玩家:', data.players[0]?.name)
      console.log('[PlayerMode] 是否为第一个玩家:', data.players[0]?.name === currentPlayer.value.name)

      if (allDeployed && !data.gameState.battleProcessed && !isBattleProcessing.value) {
        console.log(`[PlayerMode] 战斗触发条件满足 (${triggerTimestamp})`)

        // 只有第一个玩家负责触发战斗计算
        if (data.players[0].name === currentPlayer.value.name) {
          console.log(`[PlayerMode] 第一个玩家开始处理战斗 (${triggerTimestamp})`)

          // 设置本地标志，防止同一客户端重复调用
          isBattleProcessing.value = true
          console.log(`[PlayerMode] 已设置isBattleProcessing=true (${triggerTimestamp})`)

          try {
            // 使用Firebase事务尝试获取战斗锁
            const lockAcquired = await tryAcquireBattleLock(currentRoomId.value)

            if (lockAcquired) {
              console.log(`[PlayerMode] ✅ 成功获取战斗锁，开始处理战斗 (${triggerTimestamp})`)
              await processBattle(data)
              console.log(`[PlayerMode] ✅ 战斗处理完成 (${triggerTimestamp})`)
            } else {
              console.log(`[PlayerMode] ⚠️ 未能获取战斗锁，其他客户端已在处理 (${triggerTimestamp})`)
            }
          } catch (error) {
            console.error(`[PlayerMode] ❌ 战斗处理异常 (${triggerTimestamp}):`, error)
            // 关键修复：战斗异常时，重置battleProcessed为false，避免游戏卡死
            // 使用partial update（不覆盖其他数据）
            try {
              await updateRoomGameState(currentRoomId.value, {
                battleProcessed: false,
                battleError: error.message || '战斗处理异常'
              })
              console.log('[PlayerMode] 已重置battleProcessed为false，允许重试')
            } catch (resetError) {
              console.error('[PlayerMode] 重置battleProcessed失败:', resetError)
            }
          } finally {
            isBattleProcessing.value = false
            console.log(`[PlayerMode] 已重置isBattleProcessing=false (${triggerTimestamp})`)
          }
        } else {
          console.log(`[PlayerMode] 非第一个玩家，等待战斗结果 (${triggerTimestamp})`)
        }
      } else {
        console.log(`[PlayerMode] 战斗触发条件不满足 (${triggerTimestamp})`)
      }

      // 关键修复：检查是否需要显示战斗动画（统一处理所有玩家）
      console.log('[PlayerMode] ===== 监听器动画检查 (玩家:', currentPlayer.value.name, ') =====')
      console.log('[PlayerMode] 监听器检查动画显示条件:')
      console.log('  - battleProcessed:', data.gameState.battleProcessed)
      console.log('  - battleAnimationData存在:', !!data.gameState.battleAnimationData)
      console.log('  - showBattleAnimation.value:', showBattleAnimation.value)
      console.log('  - currentStep.value:', currentStep.value)

      // ===== 诊断：详细检查battleAnimationData =====
      if (data.gameState.battleAnimationData) {
        console.log('[PlayerMode] battleAnimationData详情:')
        console.log('  - round:', data.gameState.battleAnimationData.round)
        console.log('  - specialEvent:', data.gameState.battleAnimationData.specialEvent)
        console.log('  - player1.name:', data.gameState.battleAnimationData.player1?.name)
        console.log('  - player1.cities数量:', data.gameState.battleAnimationData.player1?.cities?.length || 0)
        console.log('  - player1.totalAttack:', data.gameState.battleAnimationData.player1?.totalAttack || 0)
        console.log('  - player2.name:', data.gameState.battleAnimationData.player2?.name)
        console.log('  - player2.cities数量:', data.gameState.battleAnimationData.player2?.cities?.length || 0)
        console.log('  - player2.totalAttack:', data.gameState.battleAnimationData.player2?.totalAttack || 0)
      } else if (data.gameState.battleProcessed) {
        // 只有当battleProcessed=true但battleAnimationData缺失时才报错
        // 这说明战斗已处理但动画数据丢失，可能是Firebase保存竞态问题
        console.error('[PlayerMode] ❌ battleProcessed=true但battleAnimationData不存在！')
        console.error('[PlayerMode] data.gameState keys:', Object.keys(data.gameState || {}))
        console.error('[PlayerMode] 可能原因：1) 数据未保存到Firebase  2) 监听器接收的数据不完整  3) 数据被其他地方清空')
      } else {
        // battleProcessed=false时，battleAnimationData不存在是正常的（战斗尚未发生）
        console.log('[PlayerMode] battleAnimationData尚未生成（battleProcessed=false，属正常状态）')
      }
      console.log('[PlayerMode] ===========================================')

      // 关键修复：如果battleProcessed=true但battleAnimationData缺失，
      // 等待并重新读取数据（处理tryAcquireBattleLock先于processBattle完成的竞态）
      let animationData = data.gameState.battleAnimationData
      if (data.gameState.battleProcessed && !animationData && !showBattleAnimation.value) {
        console.log('[PlayerMode] battleProcessed=true但battleAnimationData缺失，等待数据就绪...')
        // 轮询等待最多10秒
        for (let i = 0; i < 20; i++) {
          await new Promise(resolve => setTimeout(resolve, 500))
          const freshData = await getRoomData(currentRoomId.value)
          if (freshData?.gameState?.battleAnimationData) {
            console.log('[PlayerMode] ✅ 轮询成功，battleAnimationData已就绪（等待了', (i + 1) * 500, 'ms）')
            animationData = freshData.gameState.battleAnimationData
            // 同时更新其他可能变化的字段
            data.gameState = freshData.gameState
            break
          }
          if (!freshData?.gameState?.battleProcessed) {
            console.log('[PlayerMode] battleProcessed已被重置（可能战斗失败），停止等待')
            break
          }
        }
        if (!animationData) {
          console.error('[PlayerMode] ❌ 等待10秒后battleAnimationData仍不存在，可能战斗处理失败')
        }
      }

      if (data.gameState.battleProcessed &&
          animationData &&
          !showBattleAnimation.value) {

        console.log('[PlayerMode] 监听器检测到战斗已完成，准备显示动画')
        console.log('[PlayerMode] 当前玩家:', currentPlayer.value.name)
        console.log('[PlayerMode] 动画数据回合:', animationData.round)
        console.log('[PlayerMode] 当前回合:', data.gameState.currentRound)

        // 关键修复：验证动画数据完整性（使用轮询后的animationData）
        const animData = animationData
        if (!animData || !animData.player1 || !animData.player2) {
          console.error('[PlayerMode] 动画数据不完整，跳过显示')
          // 如果数据不完整，直接进入下一回合
          currentStep.value = 'city-deployment'
          return
        }

        // 关键修复：检查是否是当前回合的动画（防止显示旧动画）
        if (animData.round === data.gameState.currentRound) {
          battleAnimationData.value = animData
          showBattleAnimation.value = true
          console.log('[PlayerMode] 开始显示战斗动画')

          // 等待动画完成
          await new Promise(resolve => {
            const checkComplete = setInterval(() => {
              if (!showBattleAnimation.value) {
                clearInterval(checkComplete)
                resolve()
              }
            }, 500)

            // 超时保护：最多等待30秒
            setTimeout(() => {
              clearInterval(checkComplete)
              if (showBattleAnimation.value) {
                console.warn('[PlayerMode] 动画超时，强制继续')
                showBattleAnimation.value = false
                battleAnimationData.value = null
              }
              resolve()
            }, 30000)
          })

          console.log('[PlayerMode] 动画播放完成')
        } else {
          console.warn('[PlayerMode] 动画回合不匹配，跳过显示')
        }

        // 关键修复：动画完成后，检查是否需要清理battleAnimationData
        // 只有第一个玩家负责清理
        if (data.players[0].name === currentPlayer.value.name) {
          console.log('[PlayerMode] 第一个玩家负责清理动画数据')

          // 等待一段时间确保第二个玩家也看完了动画
          await new Promise(resolve => setTimeout(resolve, 2000))

          const latestRoomData = await getRoomData(currentRoomId.value)
          if (latestRoomData && latestRoomData.gameState.battleAnimationData) {
            // 关键修复：使用partial update代替全量set，避免playerStates等数据被Firebase空值剥离
            // Firebase set()会替换整个文档，空数组[]和null值会被删除，导致playerStates丢失
            const nextRound = (latestRoomData.gameState.currentRound || 1) + 1
            console.log('[PlayerMode] 使用partial update清理动画数据，回合数+1:', nextRound)

            await updateRoomGameState(currentRoomId.value, {
              battleAnimationData: null,      // 删除
              specialEventThisRound: null,     // 删除
              fatigueThisRound: null,          // 删除
              battleProcessed: false,          // 重置
              battleError: null,               // 清理错误信息
              currentRound: nextRound          // 回合+1
            })
            console.log('[PlayerMode] 数据清理完成（partial update），准备进入下一回合')
          }
        }

        // 等待一小段时间让玩家查看结果
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 检查游戏是否结束
        if (data.gameState.gameOver) {
          console.log('[PlayerMode] 游戏结束，获胜者:', data.gameState.winner)
          showVictory.value = true
          return
        }

        // 切换到部署界面
        console.log('[PlayerMode] 自动进入下一回合部署')
        currentStep.value = 'city-deployment'
      }
    }
  })
}

/**
 * 尝试获取战斗锁（使用Firebase事务）
 * @param {string} roomId - 房间ID
 * @returns {Promise<boolean>} - 是否成功获取锁
 */
async function tryAcquireBattleLock(roomId) {
  try {
    const { getDatabase, ref: dbRef, runTransaction } = await import('firebase/database')
    const db = getDatabase()
    const battleProcessedRef = dbRef(db, `rooms/${roomId}/gameState/battleProcessed`)

    const result = await runTransaction(battleProcessedRef, (currentValue) => {
      // 如果已经是true，中止事务
      if (currentValue === true) {
        return undefined  // 中止事务
      }

      // 否则设置为true
      return true
    })

    // 如果事务提交成功，说明我们获取了锁
    return result.committed
  } catch (error) {
    console.error('[PlayerMode] 获取战斗锁失败:', error)
    return false
  }
}

/**
 * 战斗动画完成处理
 */
function handleBattleAnimationComplete() {
  console.log('[PlayerMode] 战斗动画播放完成')
  showBattleAnimation.value = false
  battleAnimationData.value = null

  // 动画完成后，继续原有的逻辑（显示日志一段时间后进入下一回合）
  // 这里不需要额外处理，监听器会自动检测battleProcessed并切换界面
}

/**
 * 处理战斗
 * 参考 citycard_web.html 完整战斗流程
 */
async function processBattle(roomData) {
  // 诊断日志：记录processBattle调用
  const battleCallId = Date.now()
  console.log(`[PlayerMode] ===== processBattle 被调用 (ID: ${battleCallId}) =====`)
  console.log('[PlayerMode] 调用者:', new Error().stack.split('\n')[2])
  console.log('[PlayerMode] 当前回合:', roomData.gameState.currentRound)
  console.log('[PlayerMode] battleProcessed当前值:', roomData.gameState.battleProcessed)
  console.log('[PlayerMode] 战斗前玩家金币:', roomData.players.map(p => ({ name: p.name, gold: p.gold })))

  // 诊断：显示战斗前的streak状态
  console.log('[PlayerMode] ===== 战斗前streak状态 =====')
  roomData.players.forEach(player => {
    console.log(`[PlayerMode] ${player.name} 的streaks:`, player.streaks || '(未定义)')
    const gamePlayer = gameStore.players.find(p => p.name === player.name)
    if (gamePlayer) {
      console.log(`[PlayerMode] ${player.name} gameStore中的streaks:`, gamePlayer.streaks || '(未定义)')
    }
  })
  console.log('[PlayerMode] ======================================')

  console.log('[PlayerMode] 开始处理战斗')

  // 防止重复处理：如果战斗已经处理过，直接返回
  if (roomData.gameState.battleProcessed) {
    console.log(`[PlayerMode] 战斗已处理过 (battleCallId: ${battleCallId})，跳过重复处理`)
    return
  }

  // 关键修复：先准备动画数据，然后和battleProcessed=true一起保存
  // 这样监听器检测到battleProcessed时，battleAnimationData也已经存在
  console.log('[PlayerMode] 先准备动画数据，稍后和battleProcessed一起保存')

  // 诊断：验证早期保存后roomData.gameState.knownCities的状态
  console.log('[PlayerMode] ===== 战斗前数据验证 =====')
  console.log('[PlayerMode] roomData.gameState.knownCities存在:', !!roomData.gameState?.knownCities)
  console.log('[PlayerMode] roomData.gameState.knownCities内容:', JSON.stringify(roomData.gameState?.knownCities, null, 2))
  console.log('[PlayerMode] ========================================')

  // ===== 战斗前数据验证 =====
  console.log('[PlayerMode] ===== 战斗前数据验证 =====')
  roomData.players.forEach(player => {
    console.log(`[PlayerMode] ${player.name} cities:`, Object.values(player.cities).map(c => c.name))
    const state = roomData.gameState.playerStates[player.name]
    if (state && state.currentBattleCities) {
      state.currentBattleCities.forEach(card => {
        const city = player.cities[card.cityName]
        console.log(`[PlayerMode] ${player.name} 出战城市 cityName=${card.cityName}, actualName=${city?.name}`)
      })
    }
  })

  // 初始化战斗日志数组（如果还没有）
  if (!roomData.gameState.battleLogs) {
    roomData.gameState.battleLogs = []
  }

  // 不清空日志，保留历史记录（像HTML版本一样累积）
  // 注释掉：gameStore.clearLogs()
  console.log(`[PlayerMode] 当前已有${gameStore.logs.length}条历史日志，继续追加新日志`)

  const mode = roomData.mode || '2P'
  console.log(`[PlayerMode] 当前游戏模式: ${mode}`)

  // ========== Normalize roomData.players before any processing ==========
  // Firebase converts {cityName: obj} to arrays and centerCityName to numbers
  // Also handles objects with numeric string keys (sparse array conversion)
  for (const player of roomData.players) {
    normalizePlayerCities(player)
    let ccn = player.centerCityName
    if (typeof ccn === 'number' || (typeof ccn === 'string' && !isNaN(ccn) && !player.cities[ccn])) {
      const cityNames = Object.keys(player.cities)
      ccn = cityNames[Number(ccn)] || cityNames[0]
      player.centerCityName = ccn
    }
    if (!ccn || !player.cities[ccn]) {
      player.centerCityName = Object.keys(player.cities)[0] || null
    }
  }

  // ========== 疲劳减半：在战斗前检测之前执行 ==========
  // 关键：按照用户需求，疲劳减半必须在同省规则检查之前执行

  // 关键修复Bug1: 在调用applyFatigueReduction之前，先将gameStore中的streaks同步到roomData.players
  // 因为applyFatigueReduction读取的是传入的players参数的streaks
  console.log('[PlayerMode] ===== 战斗前同步streaks到roomData.players =====')
  roomData.players.forEach(player => {
    const gamePlayer = gameStore.players.find(p => p.name === player.name)
    if (gamePlayer && gamePlayer.streaks) {
      player.streaks = { ...gamePlayer.streaks }
      console.log(`[PlayerMode] 同步${player.name}的streaks到roomData:`, player.streaks)
    } else if (!player.streaks) {
      player.streaks = {}
      console.log(`[PlayerMode] 初始化${player.name}的streaks为空对象`)
    }
  })
  console.log('[PlayerMode] ==========================================')

  const { applyFatigueReduction } = await import('../../composables/game/fatigueSystem.js')
  applyFatigueReduction(gameStore, roomData.gameState, roomData.players, mode)

  // ========== 战斗前检测（参考 citycard_web.html lines 3946-4510） ==========
  const { executePreBattleChecks } = await import('../../composables/game/preBattleChecks.js')

  // 执行战斗前检测（会清空出战城市如果触发特殊事件，但不跳过战斗）
  executePreBattleChecks(gameStore, roomData.gameState, roomData.players, mode)

  // 关键修复：同步specialEventThisRound到gameStore，供战斗计算使用
  if (roomData.gameState.specialEventThisRound) {
    gameStore.specialEventThisRound = roomData.gameState.specialEventThisRound
    console.log('[PlayerMode] ✅ 已同步specialEventThisRound到gameStore:', gameStore.specialEventThisRound)
  } else {
    // 清除上一回合的特殊事件
    if (gameStore.specialEventThisRound) {
      delete gameStore.specialEventThisRound
      console.log('[PlayerMode] 已清除gameStore.specialEventThisRound')
    }
  }

  // 关键修复Issue #3：立即同步roomData到gameStore，确保城市转移（省会归顺）被反映
  // executePreBattleChecks可能会转移城市（从防守方到攻击方），这些修改必须同步到gameStore
  console.log('[PlayerMode] executePreBattleChecks执行完毕，立即同步roomData到gameStore')
  console.log('[PlayerMode] 同步前gameStore.players数量:', gameStore.players.map(p => ({ name: p.name, cities: Object.keys(p.cities).length })))
  syncRoomDataToGameStore(roomData)
  console.log('[PlayerMode] 同步后gameStore.players数量:', gameStore.players.map(p => ({ name: p.name, cities: Object.keys(p.cities).length })))

  // 关键修复Issue #1：立即将 gameStore.knownCities 同步回 roomData，确保归顺时标记的已知城市被保存
  // executePreBattleChecks 中调用了 setCityKnown()，这些修改需要立即同步到 roomData
  console.log('[PlayerMode] ===== executePreBattleChecks后立即同步knownCities =====')
  if (!roomData.gameState.knownCities) {
    roomData.gameState.knownCities = {}
  }
  Object.keys(gameStore.knownCities).forEach(observer => {
    if (!roomData.gameState.knownCities[observer]) {
      roomData.gameState.knownCities[observer] = {}
    }
    Object.keys(gameStore.knownCities[observer]).forEach(owner => {
      roomData.gameState.knownCities[observer][owner] = [...gameStore.knownCities[observer][owner]]
      console.log(`[PlayerMode] 预先同步knownCities: knownCities[${observer}][${owner}] = [${roomData.gameState.knownCities[observer][owner].join(', ')}]`)
    })
  })
  console.log('[PlayerMode] knownCities已预先同步到roomData:', JSON.stringify(roomData.gameState.knownCities, null, 2))

  // 关键修复Bug2（疲劳）：同步streaks到roomData
  // executePreBattleChecks中可能修改了gameStore.players[].streaks（城市转移时），需要同步到roomData
  console.log('[PlayerMode] ===== 同步streaks到roomData =====')
  roomData.players.forEach((roomPlayer, idx) => {
    const gamePlayer = gameStore.players.find(p => p.name === roomPlayer.name)
    if (gamePlayer && gamePlayer.streaks) {
      roomPlayer.streaks = { ...gamePlayer.streaks }
      console.log(`[PlayerMode] 同步${roomPlayer.name}的streaks:`, roomPlayer.streaks)
    }
  })
  console.log('[PlayerMode] ==========================================')

  // ========== 准备战斗动画数据（在战斗前检测之后） ==========
  // 关键修复：必须在executePreBattleChecks之后准备，这样才能读取到specialEventThisRound
  const { prepareBattleAnimationData, updateBattleResults } = await import('../../composables/game/battleAnimationData.js')

  console.log('[PlayerMode] 准备战斗动画数据（在战斗前检测之后）')

  // 关键修复：添加try-catch捕获可能的异常
  try {
    battleAnimationData.value = prepareBattleAnimationData(roomData, gameStore)
    console.log('[PlayerMode] 战斗动画数据已准备:', battleAnimationData.value)
    console.log('[PlayerMode] 特殊事件:', battleAnimationData.value?.specialEvent)

    // 验证动画数据的有效性
    if (!battleAnimationData.value) {
      console.error('[PlayerMode] ❌ prepareBattleAnimationData返回null！')
      console.error('[PlayerMode] roomData.mode:', roomData.mode)
      console.error('[PlayerMode] players.length:', roomData.players?.length)
      console.error('[PlayerMode] playerStates存在:', !!roomData.gameState?.playerStates)
      throw new Error('prepareBattleAnimationData返回null')
    }

    if (!battleAnimationData.value.player1 || !battleAnimationData.value.player2) {
      console.error('[PlayerMode] ❌ battleAnimationData缺少player1或player2！')
      throw new Error('battleAnimationData数据不完整')
    }
  } catch (error) {
    console.error('[PlayerMode] ❌ 准备战斗动画数据时出错:', error)
    console.error('[PlayerMode] 错误堆栈:', error.stack)
    console.error('[PlayerMode] roomData:', JSON.stringify(roomData, null, 2))

    // 关键修复：使用partial update而非全量set，避免覆盖其他数据
    // 不设置battleProcessed=true，让外层catch重置为false以允许重试
    try {
      await updateRoomGameState(currentRoomId.value, {
        battleError: error.message || '准备战斗动画数据失败'
      })
    } catch (updateErr) {
      console.error('[PlayerMode] 保存战斗错误信息失败:', updateErr)
    }

    throw error // 重新抛出异常，让外层捕获
  }

  // 关键修复：移除"跳过战斗"逻辑
  // 用户反馈：晕头转向、同省撤退和归顺并没有跳过战斗，只是双方无伤不攻击而已
  // 这些都是正常的回合，金币+3会由正常战斗流程处理（useGameLogic.js中的battle2P/3P/2v2函数）
  // executePreBattleChecks()现在永远返回false，shouldSkipBattle永远为false
  // 即使城市被清空，战斗仍会继续，只是攻击力为0，不造成伤害
  console.log('[PlayerMode] 战斗前检测完成，继续正常战斗流程（即使触发特殊事件也不跳过）')

  // ========== 标记出战城市为已知（双方互相知道对方出战的城市） ==========
  // 关键修复：必须在战斗计算之前标记，因为战斗函数会清空currentBattleCities
  // 参考 citycard_web.html lines 42982-42988
  console.log('[PlayerMode] ===== 开始标记knownCities =====')
  console.log('[PlayerMode] 标记前 roomData.gameState.knownCities:', roomData.gameState.knownCities)

  if (!roomData.gameState.knownCities) {
    roomData.gameState.knownCities = {}
    console.log('[PlayerMode] 初始化 knownCities 为空对象')
  }

  // 关键修复：使用前缀防止Firebase将纯数字玩家名转换为数组索引
  // Firebase会将 {"123": {...}, "456": {...}} 转换为稀疏数组，导致大量null
  function _prefixPlayer(name) {
    return 'p_' + name
  }

  // 2P模式
  console.log('[PlayerMode] 检查2P模式条件: mode=', mode, 'players.length=', roomData.players.length)
  if (mode === '2P' && roomData.players.length === 2) {
    const player0 = roomData.players[0]
    const player1 = roomData.players[1]
    const state0 = roomData.gameState.playerStates[player0.name]
    const state1 = roomData.gameState.playerStates[player1.name]

    console.log('[PlayerMode] ===== 标记已知城市 =====')
    console.log('[PlayerMode] player0:', player0.name, 'cities:', Object.values(player0.cities).map(c => c.name))
    console.log('[PlayerMode] player1:', player1.name, 'cities:', Object.values(player1.cities).map(c => c.name))

    if (state0 && state1) {
      // player0的出战城市被player1知道
      console.log('[PlayerMode] player0出战城市:', state0.currentBattleCities?.map(c => c.cityName))
      const observer1Key = _prefixPlayer(player1.name)
      const owner0Key = _prefixPlayer(player0.name)

      state0.currentBattleCities?.forEach(card => {
        const cityName = card.cityName
        console.log(`[PlayerMode] player1知道player0的城市: cityName=${cityName}`)

        if (!roomData.gameState.knownCities[observer1Key]) {
          roomData.gameState.knownCities[observer1Key] = {}
        }
        if (!roomData.gameState.knownCities[observer1Key][owner0Key]) {
          roomData.gameState.knownCities[observer1Key][owner0Key] = []
        }
        if (!roomData.gameState.knownCities[observer1Key][owner0Key].includes(cityName)) {
          roomData.gameState.knownCities[observer1Key][owner0Key].push(cityName)
        }
      })

      // player1的出战城市被player0知道
      console.log('[PlayerMode] player1出战城市:', state1.currentBattleCities?.map(c => c.cityName))
      const observer0Key = _prefixPlayer(player0.name)
      const owner1Key = _prefixPlayer(player1.name)

      state1.currentBattleCities?.forEach(card => {
        const cityName = card.cityName
        console.log(`[PlayerMode] player0知道player1的城市: cityName=${cityName}`)

        if (!roomData.gameState.knownCities[observer0Key]) {
          roomData.gameState.knownCities[observer0Key] = {}
        }
        if (!roomData.gameState.knownCities[observer0Key][owner1Key]) {
          roomData.gameState.knownCities[observer0Key][owner1Key] = []
        }
        if (!roomData.gameState.knownCities[observer0Key][owner1Key].includes(cityName)) {
          roomData.gameState.knownCities[observer0Key][owner1Key].push(cityName)
        }
      })

      console.log('[PlayerMode] 最终knownCities:', JSON.stringify(roomData.gameState.knownCities, null, 2))
    }
  }

  console.log('[PlayerMode] ===== knownCities标记完成 =====')
  console.log('[PlayerMode] 标记后 roomData.gameState.knownCities存在:', !!roomData.gameState.knownCities)
  console.log('[PlayerMode] 标记后 knownCities内容:', JSON.stringify(roomData.gameState.knownCities, null, 2))
  console.log('[PlayerMode] ==========================================')

  // ========== 执行战斗计算 ==========
  // 记录战斗前已阵亡的城市，用于检测本轮新阵亡的城市（触发守望相助等）
  const deadBeforeBattle = new Set()
  for (const player of roomData.players) {
    Object.entries(player.cities).forEach(([cityName, city]) => {
      if (city.isAlive === false || (city.currentHp !== undefined && city.currentHp <= 0)) {
        deadBeforeBattle.add(`${player.name}:${cityName}`)
      }
    })
  }

  // 关键修复：包裹在try-catch中，确保异常时能正确恢复battleProcessed
  try {
  if (mode === '3P' || mode === '3p') {
    gameLogic.battle3P(roomData.players, roomData.gameState)
  } else if (mode === '2v2' || mode === '2V2') {
    gameLogic.battle2v2(roomData.players, roomData.gameState)
  } else {
    gameLogic.battle2P(roomData.players, roomData.gameState)
  }

  // 同步knownCities到gameStore
  console.log('[PlayerMode] ===== 同步knownCities到gameStore =====')
  console.log('[PlayerMode] roomData.gameState.knownCities:', JSON.stringify(roomData.gameState.knownCities, null, 2))
  if (roomData.gameState.knownCities) {
    Object.keys(roomData.gameState.knownCities).forEach(observer => {
      if (!gameStore.knownCities[observer]) {
        gameStore.knownCities[observer] = {}
      }
      Object.keys(roomData.gameState.knownCities[observer]).forEach(owner => {
        // Firebase存储的是数组，gameStore需要Set
        const cities = roomData.gameState.knownCities[observer][owner]
        gameStore.knownCities[observer][owner] = new Set(Array.isArray(cities) ? cities : [])
        console.log(`[PlayerMode] 同步: knownCities[${observer}][${owner}] = [${Array.from(gameStore.knownCities[observer][owner]).join(', ')}]`)
      })
    })
  }
  console.log('[PlayerMode] gameStore.knownCities同步完成:', JSON.stringify(roomData.gameState.knownCities, null, 2))

  // 关键修复：执行战斗计算（会调用setCityKnown标记出战城市）
  // 这样gameStore.knownCities会被更新

  // 关键修复：战斗后将gameStore.knownCities同步回roomData.gameState.knownCities
  // 确保所有玩家通过Firebase看到已知城市
  if (!roomData.gameState.knownCities) {
    roomData.gameState.knownCities = {}
  }

  console.log('[PlayerMode] ===== 同步gameStore.knownCities回roomData =====')
  Object.keys(gameStore.knownCities).forEach(observer => {
    if (!roomData.gameState.knownCities[observer]) {
      roomData.gameState.knownCities[observer] = {}
    }
    Object.keys(gameStore.knownCities[observer]).forEach(owner => {
      // gameStore存储的是Set，Firebase需要数组
      const cities = gameStore.knownCities[observer][owner]
      roomData.gameState.knownCities[observer][owner] = Array.from(cities instanceof Set ? cities : [])
      console.log(`[PlayerMode] 反向同步: knownCities[${observer}][${owner}] = [${roomData.gameState.knownCities[observer][owner].join(', ')}]`)
    })
  })
  console.log('[PlayerMode] knownCities已同步回roomData:', JSON.stringify(roomData.gameState.knownCities, null, 2))
  console.log('[PlayerMode] ==========================================')

  // 同步actingCapital回roomData
  if (gameStore.actingCapital && Object.keys(gameStore.actingCapital).length > 0) {
    roomData.gameState.actingCapital = JSON.parse(JSON.stringify(gameStore.actingCapital))
  }

  // 同步mutualWatch回roomData（守望相助触发后可能已消耗效果）
  if (gameStore.mutualWatch) {
    roomData.gameState.mutualWatch = JSON.parse(JSON.stringify(gameStore.mutualWatch))
  }

  // 同步purpleChamber回roomData（生于紫室继承后可能已消耗）
  if (gameStore.purpleChamber && Object.keys(gameStore.purpleChamber).length > 0) {
    roomData.gameState.purpleChamber = JSON.parse(JSON.stringify(gameStore.purpleChamber))
  } else {
    roomData.gameState.purpleChamber = {}
  }

  // 同步electromagnetic回roomData
  if (gameStore.electromagnetic && Object.keys(gameStore.electromagnetic).length > 0) {
    roomData.gameState.electromagnetic = JSON.parse(JSON.stringify(gameStore.electromagnetic))
  } else {
    roomData.gameState.electromagnetic = {}
  }

  // 同步barrier回roomData
  if (gameStore.barrier && Object.keys(gameStore.barrier).length > 0) {
    roomData.gameState.barrier = JSON.parse(JSON.stringify(gameStore.barrier))
  } else {
    roomData.gameState.barrier = null
  }

  // 同步bannedCities回roomData
  if (gameStore.bannedCities && Object.keys(gameStore.bannedCities).length > 0) {
    roomData.gameState.bannedCities = JSON.parse(JSON.stringify(gameStore.bannedCities))
  } else {
    roomData.gameState.bannedCities = null
  }

  // ========== 更新战斗结果并保存到Firebase ==========
  if (battleAnimationData.value) {
    console.log('[PlayerMode] ===== 保存战斗动画数据到Firebase =====')
    console.log('[PlayerMode] battleAnimationData.value存在:', !!battleAnimationData.value)
    console.log('[PlayerMode] battleAnimationData.value.round:', battleAnimationData.value.round)
    console.log('[PlayerMode] battleAnimationData.value.player1:', battleAnimationData.value.player1?.name)
    console.log('[PlayerMode] battleAnimationData.value.player2:', battleAnimationData.value.player2?.name)

    // 更新战斗结果数据
    updateBattleResults(battleAnimationData.value, roomData)
    console.log('[PlayerMode] 战斗结果已更新到动画数据:', battleAnimationData.value.battleResults)

    // 关键修复：确保动画数据包含正确的回合数
    battleAnimationData.value.round = roomData.gameState.currentRound
    console.log('[PlayerMode] 动画数据回合设置为:', battleAnimationData.value.round)

    // 关键修复：将对象转换为纯JSON，避免Firebase序列化错误
    // 使用JSON.parse(JSON.stringify())移除Proxy、函数等不可序列化的内容
    try {
      const plainBattleData = JSON.parse(JSON.stringify(battleAnimationData.value))
      roomData.gameState.battleAnimationData = plainBattleData
      console.log('[PlayerMode] 战斗动画数据已转换为纯JSON并保存到roomData.gameState.battleAnimationData')
      console.log('[PlayerMode] 验证: roomData.gameState.battleAnimationData存在:', !!roomData.gameState.battleAnimationData)
      console.log('[PlayerMode] 验证: roomData.gameState.battleAnimationData.round:', roomData.gameState.battleAnimationData.round)
      console.log('[PlayerMode] 验证: 数据大小（字节）:', JSON.stringify(plainBattleData).length)
    } catch (serializeError) {
      console.error('[PlayerMode] ❌ JSON序列化失败:', serializeError)
      console.error('[PlayerMode] battleAnimationData结构:', battleAnimationData.value)
      throw new Error(`battleAnimationData序列化失败: ${serializeError.message}`)
    }
    console.log('[PlayerMode] ===========================================')
  } else {
    console.error('[PlayerMode] ❌ battleAnimationData.value为null，无法保存！')
  }

  // ========== 战斗后处理（参考 citycard_web.html lines 10036-10071） ==========
  // 检查城市阵亡和步步高升召唤（使用deadBeforeBattle检测本轮新阵亡的城市）
  for (const player of roomData.players) {
    Object.entries(player.cities).forEach(([cityName, city]) => {
      const isNewlyDead = city.currentHp <= 0 && !deadBeforeBattle.has(`${player.name}:${cityName}`)
      if (isNewlyDead) {
        // 城市阵亡
        city.isAlive = false

        // 触发步步高升召唤
        gameStore.handleBuBuGaoShengSummon(player, cityName, city)

        // 触发守望相助：阵亡城市有守望相助效果时，从未使用城市池召唤同省城市
        if (gameStore.mutualWatch && gameStore.mutualWatch[player.name] &&
            gameStore.mutualWatch[player.name][cityName]) {
          const watchData = gameStore.mutualWatch[player.name][cityName]
          const targetProv = watchData.province

          // 从未使用城市池中找同省城市（排除所有玩家已拥有的城市）
          const provinceCities = gameStore.getCitiesByProvince(targetProv)
          const allPlayerCityNames = new Set()
          for (const p of roomData.players) {
            Object.keys(p.cities).forEach(cn => allPlayerCityNames.add(cn))
          }
          const allUnused = gameStore.getUnusedCities()
          const unusedSet = new Set(allUnused.map(u => u.name))
          const unusedProvCities = provinceCities.filter(c =>
            unusedSet.has(c.name) && !allPlayerCityNames.has(c.name)
          )

          if (unusedProvCities.length > 0) {
            // 随机选一个
            const summonedCity = unusedProvCities[Math.floor(Math.random() * unusedProvCities.length)]
            const newCity = {
              ...summonedCity,
              currentHp: summonedCity.hp,
              isAlive: true,
              red: 0,
              green: 0,
              blue: 0,
              yellow: 0
            }
            player.cities[summonedCity.name] = newCity
            gameStore.markCityAsUsed(summonedCity.name)
            gameStore.addLog(`(守望相助) ${cityName}阵亡，从${targetProv}未使用城市池中召唤了${summonedCity.name}(HP:${summonedCity.hp})`)
          } else {
            gameStore.addLog(`(守望相助) ${cityName}阵亡，但${targetProv}暂无未使用城市可召唤`)
          }

          // 消耗守望相助效果
          delete gameStore.mutualWatch[player.name][cityName]
        }
      }
    })

    // 检查中心城市阵亡和生于紫室继承
    gameStore.checkCenterDeathAndPurpleChamberInheritance(player)
  }

  // 将战斗日志从gameStore复制到roomData
  roomData.gameState.battleLogs = [...gameStore.logs]

  // 关键修复：将gameStore.playerStates同步回roomData.gameState.playerStates
  // 这样游戏状态才能保存到Firebase
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

  // 同步疲劳数据（streaks）：从roomData到gameStore
  // 关键修复：battle2P中的updateFatigueStreaks已更新roomData.players的streaks
  // 这里应该从roomData同步到gameStore，而不是反过来
  roomData.players.forEach((roomPlayer, idx) => {
    if (roomPlayer.streaks) {
      if (!gameStore.players[idx]) return
      gameStore.players[idx].streaks = { ...roomPlayer.streaks }
      console.log(`[PlayerMode] 同步${roomPlayer.name}的疲劳数据(roomData→gameStore):`, roomPlayer.streaks)
    }
  })

  // 关键修复：先同步 roomData 到 gameStore，确保 gameStore 有最新的战斗后数据（包括isAlive状态）
  // 必须在检查游戏结束之前同步，否则 isPlayerDefeated 会使用旧的 isAlive 状态
  console.log('[PlayerMode] 战斗后同步 roomData 到 gameStore')
  syncRoomDataToGameStore(roomData)
  console.log('[PlayerMode] 同步完成，gameStore.players 已更新')

  // 检查游戏是否结束（必须在同步 isAlive 状态之后）
  if (gameLogic.isGameOver.value) {
    console.log('[PlayerMode] 游戏结束')
    // 保存游戏结束状态到Firebase
    roomData.gameState.gameOver = true
    roomData.gameState.winner = gameLogic.winner.value?.name || '平局'
    await saveRoomData(currentRoomId.value, roomData)
    showVictory.value = true
    return
  }

  // 关键修复：不要在这里执行currentRound++
  // 回合数应该在动画完成、清理数据后才增加
  // 否则会导致 battleAnimationData.round 和 currentRound 不匹配
  console.log('[PlayerMode] 战斗完成，当前回合:', roomData.gameState.currentRound)

  // 注意：金币增加已由 useGameLogic.js 的 processNewRound() 函数处理
  // 该函数在 battle2P/battle3P/battle2v2 中被调用
  // 不需要在此处重复增加金币，否则会导致双倍增加
  console.log(`[PlayerMode] 金币已由 battle 函数处理`)

  // 关键修复：调用 updateRoundStates() 处理金币贷款扣除等回合状态更新
  console.log('[PlayerMode] 调用 gameStore.updateRoundStates() 处理回合状态更新')
  gameStore.updateRoundStates()
  console.log('[PlayerMode] gameStore.updateRoundStates() 调用完成')

  // 关键修复：将 gameStore 中更新后的玩家数据同步回 roomData
  console.log('[PlayerMode] 同步 gameStore 玩家数据到 roomData')
  roomData.players.forEach((roomPlayer, idx) => {
    const gamePlayer = gameStore.players.find(p => p.name === roomPlayer.name)
    if (gamePlayer) {
      // 同步金币（金币贷款扣除后的值）
      roomPlayer.gold = gamePlayer.gold
      console.log(`[PlayerMode] 同步 ${roomPlayer.name} 的金币: ${roomPlayer.gold}`)

      // 同步城市HP和存活状态 - 保持对象结构
      roomPlayer.cities = {}
      Object.entries(gamePlayer.cities).forEach(([cityName, city]) => {
        roomPlayer.cities[cityName] = {
          ...city,
          currentHp: city.currentHp,
          isAlive: city.isAlive !== false
        }
      })
    }
  })

  // 清空所有玩家的部署状态
  // 关键修复：使用Firebase安全值代替空值，防止Firebase剥离导致playerStates丢失
  // Firebase会删除null、[]、{}值，如果所有属性都被删除，整个playerState也会消失
  Object.keys(roomData.gameState.playerStates).forEach(playerName => {
    const ps = roomData.gameState.playerStates[playerName]
    ps.currentBattleCities = []
    ps.battleGoldSkill = null
    ps.battleGoldSkillData = null
    ps.activatedCitySkills = {}
    // 确保至少有一个Firebase不会剥离的值，防止整个playerState被删除
    if (!ps.deadCities || ps.deadCities.length === 0) {
      ps.deadCities = null
    }
    ps._initialized = true  // 哨兵值：确保playerState永远不为空对象
  })

  // 关键诊断：保存前最后验证knownCities
  console.log('[PlayerMode] ===== 保存前最后验证 =====')
  console.log('[PlayerMode] roomData.gameState存在:', !!roomData.gameState)
  console.log('[PlayerMode] roomData.gameState.knownCities存在:', !!roomData.gameState?.knownCities)
  console.log('[PlayerMode] 保存前knownCities内容:', JSON.stringify(roomData.gameState?.knownCities, null, 2))
  console.log('[PlayerMode] roomData.gameState的所有keys:', roomData.gameState ? Object.keys(roomData.gameState) : 'undefined')
  console.log('[PlayerMode] roomData.gameState.battleAnimationData存在:', !!roomData.gameState?.battleAnimationData)
  console.log('[PlayerMode] ========================================')

  // 关键修复：在最后保存前设置battleProcessed=true
  // 确保battleAnimationData和battleProcessed同时出现在Firebase
  roomData.gameState.battleProcessed = true
  console.log('[PlayerMode] 已设置battleProcessed=true，准备保存')

  // 注意：不在这里清理fatigueThisRound，因为动画还需要这个数据
  // 清理会在动画完成后的清理阶段进行（见监听器中的清理逻辑）

  // 保存战斗结果（battleAnimationData和battleProcessed同时保存）
  console.log('[PlayerMode] ===== 准备保存到Firebase =====')
  console.log('[PlayerMode] roomData.gameState.battleProcessed:', roomData.gameState.battleProcessed)
  console.log('[PlayerMode] roomData.gameState.battleAnimationData存在:', !!roomData.gameState.battleAnimationData)
  console.log('[PlayerMode] roomData.gameState.currentRound:', roomData.gameState.currentRound)

  await saveRoomData(currentRoomId.value, roomData)

  console.log('[PlayerMode] ===== Firebase保存完成 =====')
  console.log('[PlayerMode] 战斗数据已保存到Firebase，回合数:', roomData.gameState.currentRound)

  // 关键诊断：保存后立即读取验证
  const verifyData = await getRoomData(currentRoomId.value)
  if (verifyData && verifyData.gameState) {
    console.log('[PlayerMode] ===== 验证Firebase数据 =====')
    console.log('[PlayerMode] 验证: battleProcessed=', verifyData.gameState.battleProcessed)
    console.log('[PlayerMode] 验证: battleAnimationData存在=', !!verifyData.gameState.battleAnimationData)
    if (verifyData.gameState.battleAnimationData) {
      console.log('[PlayerMode] 验证: battleAnimationData.round=', verifyData.gameState.battleAnimationData.round)
      console.log('[PlayerMode] 验证: battleAnimationData.player1=', verifyData.gameState.battleAnimationData.player1?.name)
      console.log('[PlayerMode] 验证: battleAnimationData.player2=', verifyData.gameState.battleAnimationData.player2?.name)
    } else {
      console.error('[PlayerMode] ❌ 验证失败: battleAnimationData未保存到Firebase!')
    }
    console.log('[PlayerMode] ========================================')
  }

  } catch (battleError) {
    // 关键修复：战斗计算或保存过程中出错，确保不卡死
    console.error('[PlayerMode] ❌ 战斗计算/保存过程中出错:', battleError)
    console.error('[PlayerMode] 错误堆栈:', battleError.stack)
    // 重新抛出让外层catch处理（外层会重置battleProcessed）
    throw battleError
  }
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

/* 战斗等待界面 */
.game-waiting-area {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
}

.waiting-content {
  max-width: 900px;
  width: 100%;
  text-align: center;
}

.waiting-icon {
  font-size: 80px;
  margin-bottom: 30px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

.waiting-content h3 {
  font-size: 28px;
  color: #60a5fa;
  margin-bottom: 15px;
  font-weight: 700;
}

.waiting-hint {
  font-size: 16px;
  color: #94a3b8;
  margin-bottom: 30px;
}

/* 游戏主界面布局（带固定日志面板） - 已移除 */
.game-with-log-layout {
  display: grid;
  grid-template-columns: 1fr 500px;
  gap: 20px;
  height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  overflow: hidden;
  transition: grid-template-columns 0.3s ease;
}

.game-with-log-layout:has(.collapsed) {
  grid-template-columns: 1fr 60px;
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
  position: relative;
  z-index: 50;
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

  .game-with-log-layout:has(.collapsed) {
    grid-template-columns: 1fr 60px;
  }
}

@media (max-width: 1024px) {
  .game-with-log-layout {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 300px;
  }

  .game-with-log-layout:has(.collapsed) {
    grid-template-rows: 1fr 60px;
  }
}

@media (max-width: 768px) {
  .game-with-log-layout {
    padding: 10px;
    gap: 10px;
    grid-template-rows: 1fr 250px;
  }

  .game-with-log-layout:has(.collapsed) {
    grid-template-rows: 1fr 60px;
  }
}

/* 技能失败弹窗样式 */
.skill-failure-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

.skill-failure-content {
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  border-radius: 20px;
  padding: 0;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease-out;
  border: 2px solid rgba(239, 68, 68, 0.3);
  overflow: hidden;
}

.skill-failure-header {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.2);
}

.skill-failure-icon {
  font-size: 48px;
  line-height: 1;
  animation: shake 0.5s ease-in-out;
}

.skill-failure-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.skill-failure-body {
  padding: 32px;
  background: rgba(0, 0, 0, 0.2);
}

.skill-failure-skill,
.skill-failure-reason {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-failure-skill:last-child,
.skill-failure-reason:last-child {
  margin-bottom: 0;
}

.skill-failure-skill .label,
.skill-failure-reason .label {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.skill-failure-skill .value {
  font-size: 24px;
  font-weight: 700;
  color: #fbbf24;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.skill-failure-reason .value {
  font-size: 18px;
  font-weight: 600;
  color: #fca5a5;
  line-height: 1.6;
  padding: 16px;
  background: rgba(239, 68, 68, 0.1);
  border-left: 4px solid #ef4444;
  border-radius: 8px;
}

.skill-failure-footer {
  padding: 24px 32px;
  display: flex;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
}

.skill-failure-btn {
  padding: 14px 48px;
  font-size: 18px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.skill-failure-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.skill-failure-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
