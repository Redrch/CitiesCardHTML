import { initializeApp, deleteApp } from 'firebase/app'
import { getDatabase, ref, set, onValue, push, remove } from 'firebase/database'

// Firebase 默认配置（管理员需要填写）
// 重要：这是一个示例配置，请替换为你自己的 Firebase 项目配置
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBpBcdlKxzT0lV7HlRUWBHSRCSF1UkEkJc",
  authDomain: "city-card-game.firebaseapp.com",
  databaseURL: "https://city-card-game-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "city-card-game",
  storageBucket: "city-card-game.firebasestorage.app",
  messagingSenderId: "932830629901",
  appId: "1:932830629901:web:783d9f30b6cd77e610c544",
  measurementId: "G-FCX0PQVF9L"
}

let firebaseApp = null
let database = null
let isInitialized = false

/**
 * 从 localStorage 读取 Firebase 配置
 */
export function loadFirebaseConfig() {
  const configStr = localStorage.getItem('firebase_config')
  if (configStr) {
    try {
      return JSON.parse(configStr)
    } catch (e) {
      console.error('Failed to parse Firebase config:', e)
    }
  }
  return null
}

/**
 * 保存 Firebase 配置到 localStorage
 */
export function saveFirebaseConfig(config) {
  localStorage.setItem('firebase_config', JSON.stringify(config))
}

/**
 * 检查是否有默认配置
 */
export function hasDefaultConfig() {
  return DEFAULT_FIREBASE_CONFIG.apiKey &&
         DEFAULT_FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY' &&
         DEFAULT_FIREBASE_CONFIG.databaseURL &&
         DEFAULT_FIREBASE_CONFIG.databaseURL !== 'YOUR_DATABASE_URL'
}

/**
 * 初始化 Firebase
 * @param {Object} config - Firebase配置对象（可选，不传则使用默认配置）
 * @returns {boolean} 是否初始化成功
 */
export function initializeFirebase(config = null) {
  try {
    console.log('[Firebase] 开始初始化 Firebase...', {
      projectId: config?.projectId,
      databaseURL: config?.databaseURL
    })

    // 如果已经初始化，先删除
    if (firebaseApp) {
      console.log('[Firebase] 删除已存在的 Firebase 实例')
      deleteApp(firebaseApp)
      firebaseApp = null
      database = null
      isInitialized = false
    }

    const finalConfig = config || DEFAULT_FIREBASE_CONFIG

    // 检查配置是否有效
    if (!finalConfig.apiKey || finalConfig.apiKey === 'YOUR_API_KEY') {
      console.warn('Firebase配置无效，在线匹配功能将不可用')
      return false
    }

    firebaseApp = initializeApp(finalConfig)
    database = getDatabase(firebaseApp)
    isInitialized = true

    console.log('[Firebase] ✓ Firebase 初始化成功！isInitialized =', isInitialized)
    return true
  } catch (error) {
    console.error('[Firebase] ✗ Firebase 初始化失败:', error)
    return false
  }
}

/**
 * 自动初始化 Firebase
 * 优先使用保存的配置，其次使用默认配置
 */
export function autoInitFirebase() {
  console.log('[Firebase] 自动初始化检查...')

  // 优先使用保存的配置
  const savedConfig = loadFirebaseConfig()
  if (savedConfig) {
    console.log('[Firebase] 检测到已保存的自定义配置，使用自定义配置初始化')
    return initializeFirebase(savedConfig)
  }

  // 如果有默认配置，自动使用
  if (hasDefaultConfig()) {
    console.log('[Firebase] 检测到默认配置，使用默认配置初始化')
    return initializeFirebase(DEFAULT_FIREBASE_CONFIG)
  }

  console.log('[Firebase] 未找到 Firebase 配置，将使用本地存储模式')
  return false
}

/**
 * 获取数据库实例
 * @returns {Database|null}
 */
export function getDB() {
  return database
}

/**
 * 检查Firebase是否已初始化
 * @returns {boolean}
 */
export function isFirebaseReady() {
  return isInitialized
}

/**
 * 获取默认配置
 */
export function getDefaultConfig() {
  return DEFAULT_FIREBASE_CONFIG
}

// 导出Firebase相关函数
export { ref as dbRef, set, onValue, push, remove }
