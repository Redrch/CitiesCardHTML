import { reactive } from 'vue'

const dialogState = reactive({
  visible: false,
  type: 'alert', // 'alert' | 'confirm'
  title: '提示',
  icon: '💡',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  resolve: null
})

function showAlert(message, options = {}) {
  return new Promise((resolve) => {
    dialogState.type = 'alert'
    dialogState.message = message
    dialogState.title = options.title || '提示'
    dialogState.icon = options.icon || '💡'
    dialogState.confirmText = options.confirmText || '确定'
    dialogState.cancelText = '取消'
    dialogState.resolve = resolve
    dialogState.visible = true
  })
}

function showConfirm(message, options = {}) {
  return new Promise((resolve) => {
    dialogState.type = 'confirm'
    dialogState.message = message
    dialogState.title = options.title || '确认'
    dialogState.icon = options.icon || '⚠️'
    dialogState.confirmText = options.confirmText || '确定'
    dialogState.cancelText = options.cancelText || '取消'
    dialogState.resolve = resolve
    dialogState.visible = true
  })
}

function resolveDialog(value) {
  if (dialogState.resolve) {
    dialogState.resolve(value)
    dialogState.resolve = null
  }
  dialogState.visible = false
}

export function useDialog() {
  return {
    dialogState,
    showAlert,
    showConfirm,
    resolveDialog
  }
}
