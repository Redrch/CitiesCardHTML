import { ref } from 'vue'

export function useNotification() {
  const notifications = ref([])
  let nextId = 0

  /**
   * 显示通知
   * @param {string} message - 通知消息
   * @param {string} type - 通知类型 ('success', 'warning', 'error', 'info')
   * @param {number} duration - 显示时长（毫秒）
   */
  function showNotification(message, type = 'success', duration = null) {
    const id = nextId++

    // 根据类型设置默认时长
    const defaultDuration = type === 'error' ? 5000 : (type === 'warning' ? 4000 : 3000)
    const finalDuration = duration || defaultDuration

    const notification = {
      id,
      message,
      type,
      visible: false
    }

    notifications.value.push(notification)

    // 延迟一帧显示，触发动画
    setTimeout(() => {
      const index = notifications.value.findIndex(n => n.id === id)
      if (index !== -1) {
        notifications.value[index].visible = true
      }
    }, 100)

    // 自动隐藏
    setTimeout(() => {
      hideNotification(id)
    }, finalDuration)
  }

  /**
   * 隐藏通知
   * @param {number} id - 通知ID
   */
  function hideNotification(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value[index].visible = false

      // 动画完成后移除
      setTimeout(() => {
        const removeIndex = notifications.value.findIndex(n => n.id === id)
        if (removeIndex !== -1) {
          notifications.value.splice(removeIndex, 1)
        }
      }, 300)
    }
  }

  /**
   * 清除所有通知
   */
  function clearAllNotifications() {
    notifications.value = []
  }

  return {
    notifications,
    showNotification,
    hideNotification,
    clearAllNotifications
  }
}
