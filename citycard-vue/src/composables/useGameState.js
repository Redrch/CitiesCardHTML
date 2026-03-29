import { ref, computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { ALL_CITIES } from '../data/cities'

export function useGameState() {
  const gameStore = useGameStore()

  const isGameStarted = ref(false)
  const currentPhase = ref('setup') // 'setup', 'playing', 'ended'

  /**
   * 随机抽取城市
   * @param {number} count - 抽取数量
   * @param {Array} excludeNames - 排除的城市名称列表
   * @returns {Array} 抽取的城市列表
   */
  function drawRandomCities(count, excludeNames = []) {
    const availableCities = ALL_CITIES.filter(
      city => !excludeNames.includes(city.name)
    )

    const shuffled = [...availableCities].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count).map(city => ({
      name: city.name,
      hp: city.hp,
      currentHp: city.hp,
      red: city.red || 0,
      green: city.green || 0,
      blue: city.blue || 0,
      yellow: city.yellow || 0
    }))
  }

  /**
   * 初始化游戏
   * @param {number} playerCount - 玩家数量
   * @param {number} citiesPerPlayer - 每人城市数量
   */
  function initializeGame(playerCount, citiesPerPlayer = 6) {
    gameStore.resetGame()

    const playerNames = ['玩家A', '玩家B', '玩家C', '玩家D'].slice(0, playerCount)
    const usedCities = []

    playerNames.forEach(name => {
      const cities = drawRandomCities(citiesPerPlayer, usedCities)
      cities.forEach(city => usedCities.push(city.name))

      gameStore.addPlayer({
        name,
        gold: 3,
        cities
      })
    })

    isGameStarted.value = true
    currentPhase.value = 'playing'
    gameStore.addLog(`游戏开始 - ${playerCount}人模式`)
  }

  /**
   * 结束游戏
   */
  function endGame() {
    isGameStarted.value = false
    currentPhase.value = 'ended'
    gameStore.addLog('游戏结束')
  }

  /**
   * 获取玩家信息
   * @param {string} playerName - 玩家名称
   * @returns {Object|null}
   */
  function getPlayer(playerName) {
    return gameStore.players.find(p => p.name === playerName) || null
  }

  return {
    // 状态
    isGameStarted,
    currentPhase,

    // 计算属性
    players: computed(() => gameStore.players),
    currentRound: computed(() => gameStore.currentRound),
    logs: computed(() => gameStore.logs),

    // 方法
    drawRandomCities,
    initializeGame,
    endGame,
    getPlayer,
    nextRound: gameStore.nextRound,
    addLog: gameStore.addLog
  }
}
