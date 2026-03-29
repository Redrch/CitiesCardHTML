import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlayerStore = defineStore('player', () => {
  // 对战模式相关状态
  const nickname = ref('')
  const myCities = ref([])
  const myGold = ref(0)
  const roomId = ref('')
  const isReady = ref(false)

  // 设置昵称
  function setNickname(name) {
    nickname.value = name
  }

  // 设置城市
  function setCities(cities) {
    myCities.value = cities
  }

  // 设置金币
  function setGold(amount) {
    myGold.value = amount
  }

  // 增加金币
  function addGold(amount) {
    myGold.value += amount
  }

  // 扣除金币
  function deductGold(amount) {
    if (myGold.value >= amount) {
      myGold.value -= amount
      return true
    }
    return false
  }

  // 加入房间
  function joinRoom(id) {
    roomId.value = id
  }

  // 离开房间
  function leaveRoom() {
    roomId.value = ''
    isReady.value = false
  }

  // 设置就绪状态
  function setReady(ready) {
    isReady.value = ready
  }

  // 重置玩家状态
  function reset() {
    nickname.value = ''
    myCities.value = []
    myGold.value = 0
    roomId.value = ''
    isReady.value = false
  }

  return {
    // 状态
    nickname,
    myCities,
    myGold,
    roomId,
    isReady,

    // 方法
    setNickname,
    setCities,
    setGold,
    addGold,
    deductGold,
    joinRoom,
    leaveRoom,
    setReady,
    reset
  }
})
