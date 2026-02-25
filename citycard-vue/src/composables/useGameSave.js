/**
 * 游戏存档系统 Composable
 * 管理游戏进度的保存和加载
 */

import { ref } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { usePlayerStore } from '../stores/playerStore'

export function useGameSave() {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()

  const SAVE_KEY = 'citycard_game_save'
  const AUTO_SAVE_KEY = 'citycard_auto_save'
  const SAVE_SLOTS_KEY = 'citycard_save_slots'
  const MAX_SAVE_SLOTS = 5

  const saveSlots = ref([])
  const currentSaveSlot = ref(null)

  /**
   * 初始化存档系统
   */
  function initSaveSystem() {
    loadSaveSlots()
  }

  /**
   * 加载存档槽列表
   */
  function loadSaveSlots() {
    try {
      const data = localStorage.getItem(SAVE_SLOTS_KEY)
      if (data) {
        saveSlots.value = JSON.parse(data)
      }
    } catch (error) {
      console.error('加载存档列表失败:', error)
      saveSlots.value = []
    }
  }

  /**
   * 保存游戏到指定槽位
   * @param {number} slotIndex - 存档槽索引 (0-4)
   * @param {string} saveName - 存档名称
   * @returns {Object} 保存结果
   */
  function saveGame(slotIndex, saveName = '快速存档') {
    try {
      const saveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        saveName: saveName,
        slotIndex: slotIndex,

        // 游戏状态
        gameState: {
          currentRound: gameStore.currentRound,
          gameMode: gameStore.gameMode,
          isStarted: gameStore.isGameStarted,
          players: serializePlayers(gameStore.players)
        },

        // 玩家状态
        playerState: {
          nickname: playerStore.nickname,
          cities: playerStore.cities,
          gold: playerStore.gold,
          roomId: playerStore.roomId
        },

        // 游戏日志（最近50条）
        logs: gameStore.logs.slice(-50),

        // 元数据
        metadata: {
          playerCount: gameStore.players.length,
          totalRounds: gameStore.currentRound,
          gameStartTime: Date.now()
        }
      }

      // 保存到指定槽位
      const key = `${SAVE_KEY}_slot_${slotIndex}`
      localStorage.setItem(key, JSON.stringify(saveData))

      // 更新存档槽列表
      const slotInfo = {
        slotIndex,
        saveName,
        timestamp: saveData.timestamp,
        round: saveData.gameState.currentRound,
        playerCount: saveData.metadata.playerCount
      }

      const existingSlotIndex = saveSlots.value.findIndex(s => s.slotIndex === slotIndex)
      if (existingSlotIndex >= 0) {
        saveSlots.value[existingSlotIndex] = slotInfo
      } else {
        saveSlots.value.push(slotInfo)
      }

      // 保存存档槽列表
      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(saveSlots.value))

      currentSaveSlot.value = slotIndex

      return {
        success: true,
        message: `游戏已保存到槽位 ${slotIndex + 1}`,
        saveData: slotInfo
      }
    } catch (error) {
      console.error('保存游戏失败:', error)
      return {
        success: false,
        message: `保存失败: ${error.message}`
      }
    }
  }

  /**
   * 从指定槽位加载游戏
   * @param {number} slotIndex - 存档槽索引
   * @returns {Object} 加载结果
   */
  function loadGame(slotIndex) {
    try {
      const key = `${SAVE_KEY}_slot_${slotIndex}`
      const data = localStorage.getItem(key)

      if (!data) {
        return {
          success: false,
          message: `槽位 ${slotIndex + 1} 没有存档`
        }
      }

      const saveData = JSON.parse(data)

      // 验证存档版本
      if (!saveData.version) {
        return {
          success: false,
          message: '存档格式不兼容'
        }
      }

      // 恢复游戏状态
      gameStore.currentRound = saveData.gameState.currentRound
      gameStore.gameMode = saveData.gameState.gameMode
      gameStore.players = deserializePlayers(saveData.gameState.players)
      gameStore.logs = saveData.logs

      // 恢复玩家状态
      if (saveData.playerState.nickname) {
        playerStore.nickname = saveData.playerState.nickname
        playerStore.cities = saveData.playerState.cities
        playerStore.gold = saveData.playerState.gold
        playerStore.roomId = saveData.playerState.roomId
      }

      currentSaveSlot.value = slotIndex

      return {
        success: true,
        message: `已加载槽位 ${slotIndex + 1} 的存档`,
        saveData: saveData.metadata
      }
    } catch (error) {
      console.error('加载游戏失败:', error)
      return {
        success: false,
        message: `加载失败: ${error.message}`
      }
    }
  }

  /**
   * 自动保存
   */
  function autoSave() {
    try {
      const saveData = {
        timestamp: Date.now(),
        gameState: {
          currentRound: gameStore.currentRound,
          gameMode: gameStore.gameMode,
          players: serializePlayers(gameStore.players)
        },
        playerState: {
          nickname: playerStore.nickname,
          cities: playerStore.cities,
          gold: playerStore.gold
        }
      }

      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(saveData))

      return { success: true }
    } catch (error) {
      console.error('自动保存失败:', error)
      return { success: false, message: error.message }
    }
  }

  /**
   * 加载自动保存
   */
  function loadAutoSave() {
    try {
      const data = localStorage.getItem(AUTO_SAVE_KEY)
      if (!data) {
        return { success: false, message: '没有自动保存' }
      }

      const saveData = JSON.parse(data)

      gameStore.currentRound = saveData.gameState.currentRound
      gameStore.gameMode = saveData.gameState.gameMode
      gameStore.players = deserializePlayers(saveData.gameState.players)

      if (saveData.playerState.nickname) {
        playerStore.nickname = saveData.playerState.nickname
        playerStore.cities = saveData.playerState.cities
        playerStore.gold = saveData.playerState.gold
      }

      return {
        success: true,
        message: '已加载自动保存',
        timestamp: saveData.timestamp
      }
    } catch (error) {
      console.error('加载自动保存失败:', error)
      return { success: false, message: error.message }
    }
  }

  /**
   * 删除存档
   * @param {number} slotIndex - 存档槽索引
   */
  function deleteSave(slotIndex) {
    try {
      const key = `${SAVE_KEY}_slot_${slotIndex}`
      localStorage.removeItem(key)

      // 更新存档槽列表
      saveSlots.value = saveSlots.value.filter(s => s.slotIndex !== slotIndex)
      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(saveSlots.value))

      if (currentSaveSlot.value === slotIndex) {
        currentSaveSlot.value = null
      }

      return {
        success: true,
        message: `已删除槽位 ${slotIndex + 1} 的存档`
      }
    } catch (error) {
      console.error('删除存档失败:', error)
      return {
        success: false,
        message: error.message
      }
    }
  }

  /**
   * 导出存档到文件
   * @param {number} slotIndex - 存档槽索引
   */
  function exportSave(slotIndex) {
    try {
      const key = `${SAVE_KEY}_slot_${slotIndex}`
      const data = localStorage.getItem(key)

      if (!data) {
        return { success: false, message: '存档不存在' }
      }

      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `citycard_save_${slotIndex}_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)

      return { success: true, message: '存档已导出' }
    } catch (error) {
      console.error('导出存档失败:', error)
      return { success: false, message: error.message }
    }
  }

  /**
   * 导入存档文件
   * @param {File} file - 存档文件
   * @param {number} slotIndex - 目标槽位
   */
  async function importSave(file, slotIndex) {
    try {
      const text = await file.text()
      const saveData = JSON.parse(text)

      // 验证存档格式
      if (!saveData.version || !saveData.gameState) {
        return { success: false, message: '无效的存档文件' }
      }

      // 更新槽位索引
      saveData.slotIndex = slotIndex

      // 保存到槽位
      const key = `${SAVE_KEY}_slot_${slotIndex}`
      localStorage.setItem(key, JSON.stringify(saveData))

      // 更新存档槽列表
      const slotInfo = {
        slotIndex,
        saveName: saveData.saveName || '导入的存档',
        timestamp: saveData.timestamp,
        round: saveData.gameState.currentRound,
        playerCount: saveData.metadata.playerCount
      }

      const existingSlotIndex = saveSlots.value.findIndex(s => s.slotIndex === slotIndex)
      if (existingSlotIndex >= 0) {
        saveSlots.value[existingSlotIndex] = slotInfo
      } else {
        saveSlots.value.push(slotInfo)
      }

      localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(saveSlots.value))

      return { success: true, message: '存档已导入' }
    } catch (error) {
      console.error('导入存档失败:', error)
      return { success: false, message: error.message }
    }
  }

  /**
   * 序列化玩家数据
   */
  function serializePlayers(players) {
    return players.map(player => ({
      ...player,
      cities: Object.values(player.cities).map(city => ({
        ...city,
        // 只保留必要字段
      }))
    }))
  }

  /**
   * 反序列化玩家数据
   */
  function deserializePlayers(players) {
    return players.map(player => ({
      ...player,
      cities: Object.values(player.cities).map(city => ({
        ...city,
        isAlive: city.isAlive !== false,
        currentHp: city.currentHp || city.hp
      }))
    }))
  }

  /**
   * 获取存档信息
   * @param {number} slotIndex - 存档槽索引
   */
  function getSaveInfo(slotIndex) {
    return saveSlots.value.find(s => s.slotIndex === slotIndex)
  }

  /**
   * 清除所有存档
   */
  function clearAllSaves() {
    try {
      for (let i = 0; i < MAX_SAVE_SLOTS; i++) {
        const key = `${SAVE_KEY}_slot_${i}`
        localStorage.removeItem(key)
      }
      localStorage.removeItem(AUTO_SAVE_KEY)
      localStorage.removeItem(SAVE_SLOTS_KEY)
      saveSlots.value = []
      currentSaveSlot.value = null

      return { success: true, message: '已清除所有存档' }
    } catch (error) {
      console.error('清除存档失败:', error)
      return { success: false, message: error.message }
    }
  }

  return {
    saveSlots,
    currentSaveSlot,
    MAX_SAVE_SLOTS,

    initSaveSystem,
    saveGame,
    loadGame,
    autoSave,
    loadAutoSave,
    deleteSave,
    exportSave,
    importSave,
    getSaveInfo,
    clearAllSaves
  }
}
