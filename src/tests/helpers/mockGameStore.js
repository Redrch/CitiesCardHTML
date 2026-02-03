/**
 * Mock GameStore for Testing
 * 提供一个完整的游戏状态mock对象用于测试
 */

import { reactive } from 'vue'

export function createMockGameStore() {
  return reactive({
    // 玩家数据
    players: [],
    currentPlayer: null,
    gameMode: '2P',
    currentRound: 1,

    // 技能状态
    protections: {},
    ironShields: {},
    anchored: {},
    deadCities: {},
    disguisedCities: {},
    barrier: {},
    berserkFired: {},
    jilaizan: {},
    reflect: {},
    sdxj: {},
    yiyidl: {},
    ccjj: {},
    wwjz: {},
    wwjzUsageCount: {},
    yqgzMarks: [],
    dizzy: {},
    gawhUser: { value: null },
    tblj: {},
    chhdj: {},
    yswq: {},
    yswqUsageCount: {},
    roster: {},
    skillUsageCount: {},
    skillCooldowns: {},
    knownCities: {},
    financialCrisis: null,
    costIncrease: {},
    hjbf: {},
    initialCities: {},
    purpleChamber: {},
    jianbukecui: {},  // 坚不可摧护盾
    hpStorage: {},  // 血量存储
    disaster: {},  // 天灾人祸
    ironCities: {},  // 钢铁城市（实际使用的名称）

    // 日志系统
    logs: [],
    privateLogs: {},

    // 游戏状态快照（用于无懈可击）
    gameStateSnapshots: [],

    // 辅助方法
    addLog(message) {
      this.logs.push({ message, timestamp: Date.now() })
    },

    addPrivateLog(playerName, message) {
      if (!this.privateLogs[playerName]) {
        this.privateLogs[playerName] = []
      }
      this.privateLogs[playerName].push({ message, timestamp: Date.now() })
    },

    getUnusedCities() {
      // 返回未被使用的城市列表（用于狐假虎威等技能）
      return [
        { name: '深圳', hp: 50000 },
        { name: '厦门', hp: 40000 },
        { name: '苏州', hp: 45000 }
      ]
    },

    recordSkillUsageTracking(playerName, skillName) {
      // 记录技能使用情况（用于统计和追踪）
      if (!this.skillUsageCount[playerName]) {
        this.skillUsageCount[playerName] = {}
      }
      if (!this.skillUsageCount[playerName][skillName]) {
        this.skillUsageCount[playerName][skillName] = 0
      }
      this.skillUsageCount[playerName][skillName]++
    },

    createGameStateSnapshot() {
      const snapshot = {
        round: this.currentRound,
        timestamp: Date.now(),
        players: JSON.parse(JSON.stringify(this.players))
      }
      this.gameStateSnapshots.push(snapshot)
      return snapshot
    },

    isBlockedByJianbukecui(targetName, casterName, skillName) {
      // 简化实现：检查目标是否有坚不可摧护盾
      return false
    },

    consumeProtection(playerName, cityIdx) {
      // 检查城市保护
      if (this.protections[playerName] && this.protections[playerName][cityIdx]) {
        delete this.protections[playerName][cityIdx]
        return true
      }

      // 检查钢铁护盾
      if (this.ironShields[playerName] && this.ironShields[playerName][cityIdx]) {
        delete this.ironShields[playerName][cityIdx]
        return true
      }

      return false
    },

    hasIronShield(playerName, cityIdx) {
      return this.ironShields[playerName] && this.ironShields[playerName][cityIdx]
    },

    setCityKnown(playerName, cityIdx, knownBy) {
      if (!this.knownCities[playerName]) {
        this.knownCities[playerName] = {}
      }
      if (!this.knownCities[playerName][cityIdx]) {
        this.knownCities[playerName][cityIdx] = []
      }
      if (!this.knownCities[playerName][cityIdx].includes(knownBy)) {
        this.knownCities[playerName][cityIdx].push(knownBy)
      }
    }
  })
}

export function createMockPlayer(name, config = {}) {
  // 默认城市数组
  const defaultCitiesArray = [
    {
      name: '北京',
      hp: 30000,
      currentHp: 30000,
      baseHp: 30000,
      isCenter: true,
      isAlive: true,
      red: 3,
      blue: 3,
      green: 3,
      yellow: 3
    },
    {
      name: '上海',
      hp: 25000,
      currentHp: 25000,
      baseHp: 25000,
      isCenter: false,
      isAlive: true,
      red: 2,
      blue: 2,
      green: 2,
      yellow: 2
    },
    {
      name: '广州',
      hp: 20000,
      currentHp: 20000,
      baseHp: 20000,
      isCenter: false,
      isAlive: true,
      red: 1,
      blue: 1,
      green: 1,
      yellow: 1
    }
  ]

  // 将城市数组转换为对象（以城市名称为key）
  const citiesArray = config.cities || defaultCitiesArray
  const citiesObj = {}
  citiesArray.forEach(city => {
    citiesObj[city.name] = city
  })

  return {
    name: name || 'Player1',
    gold: config.gold !== undefined ? config.gold : 10,
    cities: citiesObj,  // 使用对象而非数组
    centerCityName: citiesArray[0].name,  // 使用城市名称而非索引
    battleModifiers: [],
    streaks: {},
    team: config.team || 0
  }
}

export function createMultiplePlayers(count = 2) {
  const players = []
  const names = ['Player1', 'Player2', 'Player3', 'Player4']

  for (let i = 0; i < count; i++) {
    players.push(createMockPlayer(names[i], {
      gold: 10,
      team: i < 2 ? 0 : 1  // 前两个玩家team 0，后两个team 1
    }))
  }

  return players
}
