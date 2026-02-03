import { ref, reactive, onUnmounted } from 'vue'
import { getDatabase, ref as dbRef, set, get, onValue, off, remove, update } from 'firebase/database'
import { isFirebaseReady } from './useFirebase'

// 房间过期时间配置（24小时内无活动则自动过期）
const ROOM_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24小时
const HEARTBEAT_INTERVAL_MS = 10 * 1000 // 10秒发送一次心跳（用于快速断线重连）
const OFFLINE_THRESHOLD_MULTIPLIER = 3 // 3个心跳周期无响应认为离线（约30秒）

export function useRoom() {
  const roomId = ref('')
  const roomData = ref(null)
  const isRoomHost = ref(false)
  const forceSpectator = ref(false)
  const isSpectator = ref(false)

  let heartbeatInterval = null
  let roomListener = null
  let connectionLostTime = null
  let wasDisconnected = false

  /**
   * 生成9位房间号
   */
  function generateRoomId() {
    return Math.floor(100000000 + Math.random() * 900000000).toString()
  }

  /**
   * 保存房间数据
   * @param {string} id - 房间ID
   * @param {Object} data - 房间数据
   */
  async function saveRoomData(id, data) {
    // 添加更新时间戳（用于过期检查和心跳）
    const updatedData = {
      ...data,
      lastActivity: Date.now(),
      lastActivityString: new Date().toLocaleString('zh-CN')
    }

    console.log('[Firebase] 准备保存到Firebase的数据:', {
      roomId: id,
      hasGameState: !!updatedData.gameState,
      gameStateKeys: updatedData.gameState ? Object.keys(updatedData.gameState) : 'undefined',
      hasPendingSwaps: !!updatedData.gameState?.pendingSwaps,
      pendingSwapsLength: updatedData.gameState?.pendingSwaps?.length || 0,
      pendingSwaps: updatedData.gameState?.pendingSwaps,
      hasKnownCities: !!updatedData.gameState?.knownCities,
      knownCitiesKeys: updatedData.gameState?.knownCities ? Object.keys(updatedData.gameState.knownCities) : 'undefined'
    })
    console.log('[Firebase] 完整gameState对象:', JSON.stringify(updatedData.gameState, null, 2))
    console.log('[Firebase] ===== knownCities 详细诊断 =====')
    console.log('[Firebase] knownCities存在:', !!updatedData.gameState?.knownCities)
    console.log('[Firebase] knownCities内容:', JSON.stringify(updatedData.gameState?.knownCities, null, 2))

    if (isFirebaseReady()) {
      // 使用 Firebase
      console.log(`[Firebase] 正在保存房间数据到 Firebase: ${id}`)
      try {
        const db = getDatabase()
        await set(dbRef(db, 'rooms/' + id), updatedData)
        console.log(`[Firebase] ✓ 房间数据保存成功: ${id}`)
        console.log('[Firebase] ✓ 保存后验证gameState:', updatedData.gameState ? '存在' : '不存在')

        // 关键诊断：立即读取验证knownCities是否真的保存到Firebase
        console.log('[Firebase] ===== 保存后立即验证 =====')
        const verifySnapshot = await get(dbRef(db, 'rooms/' + id + '/gameState/knownCities'))
        const savedKnownCities = verifySnapshot.val()
        console.log('[Firebase] 验证读取knownCities:', savedKnownCities ? JSON.stringify(savedKnownCities, null, 2) : 'null/undefined')
        console.log('[Firebase] ========================================')

        return true
      } catch (error) {
        console.error('[Firebase] ✗ Firebase save error:', error)
        return false
      }
    } else {
      // 使用 localStorage
      console.log(`[localStorage] 正在保存房间数据到本地存储: ${id}`)
      localStorage.setItem(`room_${id}`, JSON.stringify(updatedData))
      return true
    }
  }

  /**
   * 更新房间gameState的部分字段（不覆盖整个gameState）
   * @param {string} id - 房间ID
   * @param {Object} updates - 要更新的字段 {pendingSwaps: [...], ...}
   */
  async function updateRoomGameState(id, updates) {
    console.log('[Firebase] 准备部分更新gameState:', {
      roomId: id,
      updateKeys: Object.keys(updates),
      updates
    })

    if (isFirebaseReady()) {
      try {
        const db = getDatabase()

        // 关键修复：确保 gameState 节点存在
        // 现在 createRoom 会初始化 gameState，但为了兼容旧房间，仍保留此检查
        const roomRef = dbRef(db, `rooms/${id}`)
        const snapshot = await get(roomRef)
        const roomData = snapshot.val()

        if (!roomData) {
          console.error('[Firebase] 房间不存在:', id)
          return false
        }

        // 如果 gameState 不存在（旧房间），先初始化它
        if (!roomData.gameState) {
          console.log('[Firebase] gameState不存在（旧房间），先初始化')
          // 合并初始化和更新操作，减少写入次数
          await set(dbRef(db, `rooms/${id}/gameState`), {
            currentRound: 1,
            playerStates: {},
            knownCities: {},
            battleLogs: [],
            pendingSwaps: [],
            ...updates  // 同时应用传入的更新
          })
          console.log(`[Firebase] ✓ gameState初始化并更新成功: ${id}`, Object.keys(updates))
          return true
        }

        // gameState 已存在，只更新指定字段
        const updatePath = {}
        Object.keys(updates).forEach(key => {
          updatePath[`rooms/${id}/gameState/${key}`] = updates[key]
        })

        await update(dbRef(db), updatePath)
        console.log(`[Firebase] ✓ gameState部分更新成功: ${id}`, Object.keys(updates))
        return true
      } catch (error) {
        console.error('[Firebase] ✗ gameState更新失败:', error)
        return false
      }
    } else {
      // localStorage模式：需要读取完整数据再更新
      const data = await getRoomData(id)
      if (!data) return false

      if (!data.gameState) {
        data.gameState = {
          currentRound: 1,
          playerStates: {},
          knownCities: {},
          battleLogs: [],
          pendingSwaps: []
        }
      }
      Object.assign(data.gameState, updates)

      localStorage.setItem(`room_${id}`, JSON.stringify({
        ...data,
        lastActivity: Date.now()
      }))
      return true
    }
  }

  /**
   * 读取房间数据
   * @param {string} id - 房间ID
   */
  async function getRoomData(id) {
    let data = null

    if (isFirebaseReady()) {
      // 使用 Firebase
      console.log(`[Firebase] 正在从 Firebase 读取房间数据: ${id}`)
      try {
        const db = getDatabase()
        const snapshot = await get(dbRef(db, 'rooms/' + id))
        data = snapshot.val()
        if (data) {
          console.log(`[Firebase] ✓ 房间数据读取成功: ${id}`)
        } else {
          console.log(`[Firebase] ⚠ 房间不存在: ${id}`)
          return null
        }
      } catch (error) {
        console.error('[Firebase] ✗ Firebase read error:', error)
        return null
      }
    } else {
      // 使用 localStorage
      console.log(`[localStorage] 正在从本地存储读取房间数据: ${id}`)
      const dataStr = localStorage.getItem(`room_${id}`)
      data = dataStr ? JSON.parse(dataStr) : null
    }

    // 检查房间是否过期
    if (data && data.lastActivity) {
      const now = Date.now()
      const timeSinceActivity = now - data.lastActivity

      if (timeSinceActivity > ROOM_EXPIRY_MS) {
        console.log(`[房间过期] 房间 ${id} 已过期（${Math.floor(timeSinceActivity / 3600000)}小时无活动）`)

        // 删除过期房间
        if (isFirebaseReady()) {
          const db = getDatabase()
          await remove(dbRef(db, 'rooms/' + id))
        } else {
          localStorage.removeItem(`room_${id}`)
        }

        return null // 房间已过期，返回null
      } else if (timeSinceActivity > ROOM_EXPIRY_MS * 0.8) {
        // 过期预警（超过19小时无活动）
        const hoursLeft = Math.floor((ROOM_EXPIRY_MS - timeSinceActivity) / 3600000)
        console.warn(`[房间预警] 房间 ${id} 即将过期（还有${hoursLeft}小时）`)
      }
    }

    return data
  }

  /**
   * 监听房间数据变化
   * @param {string} id - 房间ID
   * @param {Function} callback - 数据更新回调
   */
  function listenToRoomData(id, callback) {
    if (isFirebaseReady()) {
      // 使用 Firebase 实时监听
      console.log(`[Firebase] 开始监听房间数据变化: ${id}`)
      const db = getDatabase()
      const roomRef = dbRef(db, 'rooms/' + id)
      onValue(roomRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          console.log(`[Firebase] 收到房间数据更新: ${id}`, {
            hasGameState: !!data.gameState,
            gameStateKeys: data.gameState ? Object.keys(data.gameState) : 'undefined',
            hasPendingSwaps: !!data.gameState?.pendingSwaps,
            pendingSwapsLength: data.gameState?.pendingSwaps?.length || 0,
            timestamp: Date.now()
          })
          callback(data)
        }
      })
      return roomRef // 返回引用以便后续取消监听
    } else {
      // localStorage 没有实时监听，返回 null
      console.log(`[localStorage] 不支持实时监听`)
      return null
    }
  }

  /**
   * 停止监听房间数据
   * @param {Object} roomRef - 房间引用
   */
  function stopListeningToRoom(roomRef) {
    if (roomRef && isFirebaseReady()) {
      off(roomRef)
    }
  }

  /**
   * 发送心跳包
   * @param {string} id - 房间ID
   * @param {string} playerName - 玩家名称
   */
  async function sendHeartbeat(id, playerName) {
    try {
      if (isFirebaseReady()) {
        // Firebase：仅更新heartbeats字段，不触发完整房间数据更新
        const heartbeatData = {
          lastSeen: Date.now(),
          lastSeenString: new Date().toLocaleString('zh-CN')
        }

        const db = getDatabase()
        await set(dbRef(db, `rooms/${id}/heartbeats/${playerName}`), heartbeatData)
        console.log(`[心跳] 已更新玩家 ${playerName} 的心跳状态（轻量级）`)
        return true
      } else {
        // localStorage：需要读取完整数据
        const data = await getRoomData(id)
        if (!data) {
          console.log(`[心跳] 房间 ${id} 不存在或已过期`)
          return false
        }

        // 更新心跳时间戳
        if (!data.heartbeats) {
          data.heartbeats = {}
        }
        data.heartbeats[playerName] = {
          lastSeen: Date.now(),
          lastSeenString: new Date().toLocaleString('zh-CN')
        }

        // 本地存储模式下保存完整数据
        localStorage.setItem(`room_${id}`, JSON.stringify({
          ...data,
          lastActivity: Date.now()
        }))
        console.log(`[心跳] 已更新玩家 ${playerName} 的心跳状态`)
        return true
      }
    } catch (error) {
      console.error(`[心跳] 发送心跳失败:`, error)
      return false
    }
  }

  /**
   * 获取玩家在线状态
   * @param {string} playerName - 玩家名称
   * @param {Object} data - 房间数据
   */
  function getPlayerOnlineStatus(playerName, data) {
    if (!data || !data.heartbeats) {
      return { online: false, reason: 'no_heartbeat_data' }
    }

    const heartbeat = data.heartbeats[playerName]
    if (!heartbeat) {
      return { online: false, reason: 'no_heartbeat' }
    }

    // 兼容两种心跳数据格式
    let lastSeenTime = null
    if (typeof heartbeat === 'object' && heartbeat.lastSeen) {
      lastSeenTime = heartbeat.lastSeen
    } else if (typeof heartbeat === 'number') {
      lastSeenTime = heartbeat
    }

    if (!lastSeenTime) {
      return { online: false, reason: 'invalid_heartbeat' }
    }

    const now = Date.now()
    const offlineThreshold = HEARTBEAT_INTERVAL_MS * OFFLINE_THRESHOLD_MULTIPLIER
    const timeSinceLastHeartbeat = now - lastSeenTime

    if (timeSinceLastHeartbeat > offlineThreshold) {
      return {
        online: false,
        reason: 'timeout',
        offlineSeconds: Math.floor(timeSinceLastHeartbeat / 1000),
        lastSeen: lastSeenTime
      }
    }

    return {
      online: true,
      lastSeen: lastSeenTime,
      secondsAgo: Math.floor(timeSinceLastHeartbeat / 1000)
    }
  }

  /**
   * 获取房间内所有玩家的在线状态
   * @param {Object} data - 房间数据
   */
  function getAllPlayersOnlineStatus(data) {
    if (!data || !data.players) {
      return {}
    }

    const statusMap = {}
    data.players.forEach(player => {
      statusMap[player.name] = getPlayerOnlineStatus(player.name, data)
    })

    return statusMap
  }

  /**
   * 检测并获取离线玩家列表
   * @param {Object} data - 房间数据
   */
  function getOfflinePlayers(data) {
    const statusMap = getAllPlayersOnlineStatus(data)
    return Object.entries(statusMap)
      .filter(([_, status]) => !status.online)
      .map(([name, status]) => ({ name, status }))
  }

  /**
   * 开始心跳检查
   * @param {string} id - 房间ID
   * @param {string} playerName - 玩家名称
   */
  function startHeartbeat(id, playerName) {
    // 先停止之前的心跳
    stopHeartbeat()

    console.log(`[心跳] 开始心跳检查 - 房间: ${id}, 玩家: ${playerName}`)

    // 立即发送一次心跳
    sendHeartbeat(id, playerName)

    // 设置定时心跳
    heartbeatInterval = setInterval(async () => {
      await sendHeartbeat(id, playerName)
    }, HEARTBEAT_INTERVAL_MS)
  }

  /**
   * 停止心跳检查
   */
  function stopHeartbeat() {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
      console.log('[心跳] 已停止心跳检查')
    }
  }

  /**
   * 创建房间
   * @param {Object} options - 房间配置
   */
  async function createRoom(options) {
    const id = generateRoomId()
    roomId.value = id
    isRoomHost.value = true

    // 将房间信息保存
    const data = {
      roomId: id,
      mode: options.mode || '2P',
      playerCount: options.playerCount || 2,
      citiesPerPlayer: options.citiesPerPlayer || 5,
      players: [],
      spectators: [], // 围观者列表
      heartbeats: {}, // 玩家心跳状态
      createdAt: Date.now(),
      roomStatus: 'waiting', // 等待玩家加入
      // 关键修复：创建房间时就初始化 gameState
      gameState: {
        currentRound: 1,
        playerStates: {},
        knownCities: {},
        battleLogs: [],
        pendingSwaps: []
      }
    }

    await saveRoomData(id, data)
    roomData.value = data

    return { success: true, roomId: id }
  }

  /**
   * 加入房间
   * @param {string} id - 房间ID
   */
  async function joinRoom(id) {
    if (id.length !== 9 || !/^\d+$/.test(id)) {
      return { success: false, error: '请输入有效的9位房间号！' }
    }

    // 读取房间信息
    const data = await getRoomData(id)
    if (!data) {
      return { success: false, error: '房间不存在或已过期！' }
    }

    roomId.value = id
    isRoomHost.value = false
    roomData.value = data

    // 确保 players 数组存在
    if (!data.players) {
      data.players = []
    }

    // 检查房间是否已满（只计算在线玩家）
    const onlineStatusMap = getAllPlayersOnlineStatus(data)
    const onlinePlayers = data.players.filter(p => onlineStatusMap[p.name]?.online)
    const isRoomFull = onlinePlayers.length >= data.playerCount
    forceSpectator.value = isRoomFull

    console.log(`[加入房间] 房间玩家: ${data.players.length}, 在线玩家: ${onlinePlayers.length}, 房间容量: ${data.playerCount}, 是否满员: ${isRoomFull}`)

    return { success: true, roomData: data, isRoomFull }
  }

  /**
   * 更新房间数据中的某个玩家
   * @param {string} id - 房间ID
   * @param {string} playerName - 玩家名称
   * @param {Object} playerData - 玩家数据
   */
  async function updateRoomPlayer(id, playerName, playerData) {
    const data = await getRoomData(id)
    if (!data) return false

    const playerIdx = data.players.findIndex(p => p.name === playerName)
    if (playerIdx !== -1) {
      data.players[playerIdx] = playerData
      return await saveRoomData(id, data)
    }
    return false
  }

  /**
   * 踢出离线玩家
   * @param {string} id - 房间ID
   * @param {string} playerName - 玩家名称
   */
  async function kickOfflinePlayer(id, playerName) {
    try {
      const data = await getRoomData(id)
      if (!data) {
        return { success: false, error: '房间数据不存在！' }
      }

      // 从玩家列表中移除
      const playerIndex = data.players.findIndex(p => p.name === playerName)
      if (playerIndex >= 0) {
        data.players.splice(playerIndex, 1)
        console.log(`[踢人] 已从玩家列表移除: ${playerName}`)
      }

      // 从围观者列表中移除（如果存在）
      if (data.spectators) {
        const spectatorIndex = data.spectators.findIndex(s => s.name === playerName)
        if (spectatorIndex >= 0) {
          data.spectators.splice(spectatorIndex, 1)
          console.log(`[踢人] 已从围观者列表移除: ${playerName}`)
        }
      }

      // 清理心跳记录
      if (data.heartbeats && data.heartbeats[playerName]) {
        delete data.heartbeats[playerName]
        console.log(`[踢人] 已清理心跳记录: ${playerName}`)
      }

      // 保存更新后的房间数据
      await saveRoomData(id, data)

      return { success: true }
    } catch (error) {
      console.error('[踢人] 操作失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 加入玩家到房间
   * @param {string} id - 房间ID
   * @param {Object} player - 玩家信息
   * @param {boolean} asSpectator - 是否作为围观者加入
   */
  async function addPlayerToRoom(id, player, asSpectator = false) {
    const data = await getRoomData(id)
    if (!data) {
      return { success: false, error: '房间已失效！' }
    }

    // 确保 players 和 spectators 数组存在
    if (!data.players) {
      data.players = []
    }
    if (!data.spectators) {
      data.spectators = []
    }

    // 检查是否存在同名玩家（用于断线重连）
    const existingPlayerIndex = data.players.findIndex(p => p.name === player.name)
    const existingSpectatorIndex = data.spectators.findIndex(s => s.name === player.name)

    if (asSpectator) {
      // 加入围观
      if (existingSpectatorIndex >= 0) {
        // 允许重新连接
        isSpectator.value = true
      } else if (existingPlayerIndex >= 0) {
        return { success: false, error: '该昵称已被玩家使用！' }
      } else {
        // 新围观者
        data.spectators.push({
          name: player.name,
          ready: true,
          joinedAt: Date.now()
        })
        isSpectator.value = true
      }
    } else {
      // 加入战斗
      if (existingPlayerIndex >= 0) {
        // 允许断线重连
        console.log('[加入房间] 检测到断线重连，允许重新加入')
      } else if (existingSpectatorIndex >= 0) {
        return { success: false, error: '该昵称已被围观者使用！' }
      } else if (data.players.length >= data.playerCount) {
        return { success: false, error: '房间已满！' }
      } else {
        // 新玩家
        data.players.push({
          name: player.name,
          cities: player.cities || [],
          gold: 0,
          ready: false,
          joinedAt: Date.now()
        })
      }
      isSpectator.value = false
    }

    // 更新心跳状态
    if (!data.heartbeats) data.heartbeats = {}
    data.heartbeats[player.name] = {
      lastSeen: Date.now(),
      lastSeenString: new Date().toLocaleString('zh-CN')
    }

    await saveRoomData(id, data)
    roomData.value = data

    // 启动心跳
    startHeartbeat(id, player.name)

    return { success: true, roomData: data }
  }

  /**
   * 设置玩家准备状态
   * @param {string} id - 房间ID
   * @param {string} playerName - 玩家名称
   * @param {boolean} ready - 准备状态
   */
  async function setPlayerReady(id, playerName, ready) {
    const data = await getRoomData(id)
    if (!data) return false

    const playerIdx = data.players.findIndex(p => p.name === playerName)
    if (playerIdx !== -1) {
      data.players[playerIdx].ready = ready
      await saveRoomData(id, data)
      roomData.value = data
      return true
    }
    return false
  }

  /**
   * 开始监听房间变化
   * @param {string} id - 房间ID
   * @param {Function} callback - 更新回调
   */
  function startRoomListener(id, callback) {
    stopRoomListener()
    roomListener = listenToRoomData(id, (data) => {
      roomData.value = data
      callback(data)
    })
  }

  /**
   * 停止监听房间变化
   */
  function stopRoomListener() {
    if (roomListener) {
      stopListeningToRoom(roomListener)
      roomListener = null
    }
  }

  /**
   * 离开房间（清理资源）
   * @param {string} id - 房间ID
   * @param {string} playerName - 玩家名称
   */
  async function leaveRoom(id, playerName) {
    // 停止心跳
    stopHeartbeat()

    // 停止监听
    stopRoomListener()

    // 标记玩家离线
    if (id && playerName) {
      try {
        const data = await getRoomData(id)
        if (data && data.heartbeats && data.heartbeats[playerName]) {
          // 将心跳时间设置为很久之前，立即标记为离线
          if (typeof data.heartbeats[playerName] === 'object') {
            data.heartbeats[playerName].lastSeen = 0
            data.heartbeats[playerName].manualExit = true // 标记为主动退出
          } else {
            data.heartbeats[playerName] = {
              lastSeen: 0,
              manualExit: true
            }
          }
          await saveRoomData(id, data)
          console.log(`[退出] 已标记玩家 ${playerName} 为离线状态`)
        }
      } catch (error) {
        console.error('[退出] 标记离线失败:', error)
      }
    }

    // 重置状态
    roomId.value = ''
    roomData.value = null
    isRoomHost.value = false
    forceSpectator.value = false
    isSpectator.value = false
  }

  // 组件卸载时清理
  onUnmounted(() => {
    stopHeartbeat()
    stopRoomListener()
  })

  return {
    // 状态
    roomId,
    roomData,
    isRoomHost,
    forceSpectator,
    isSpectator,

    // 方法
    generateRoomId,
    createRoom,
    joinRoom,
    saveRoomData,
    updateRoomGameState,
    getRoomData,
    listenToRoomData,
    stopListeningToRoom,
    sendHeartbeat,
    startHeartbeat,
    stopHeartbeat,
    getPlayerOnlineStatus,
    getAllPlayersOnlineStatus,
    getOfflinePlayers,
    updateRoomPlayer,
    kickOfflinePlayer,
    addPlayerToRoom,
    setPlayerReady,
    startRoomListener,
    stopRoomListener,
    leaveRoom
  }
}
