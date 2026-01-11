<template>
  <div v-if="isVisible" class="selector-overlay" @click.self="closeSelector">
    <div class="selector-content">
      <div class="selector-header">
        <h3 class="selector-title">
          {{ title }}
        </h3>
        <button class="close-button" @click="closeSelector">✕</button>
      </div>

      <div class="selector-body">
        <!-- 说明文字 -->
        <div class="selector-description">
          {{ description }}
        </div>

        <!-- 城市列表 -->
        <div class="city-list">
          <div
            v-for="(city, index) in availableCities"
            :key="index"
            class="city-option"
            :class="{
              'city-option--selected': isSelected(city, index),
              'city-option--disabled': !canSelectCity(city)
            }"
            @click="toggleSelectCity(city, index)"
          >
            <div class="city-option__info">
              <div class="city-option__name">
                {{ city.name }}
                <span v-if="city.isCenter" class="city-center-badge">中心</span>
              </div>
              <div class="city-option__hp">
                HP: {{ Math.floor(city.currentHp || city.hp) }} / {{ city.hp }}
              </div>
            </div>
            <div v-if="isSelected(city, index)" class="city-option__check">
              ✓
            </div>
          </div>
        </div>

        <!-- 已选择数量提示 -->
        <div v-if="maxSelections > 1" class="selection-info">
          已选择: {{ selectedCities.length }} / {{ maxSelections }}
        </div>
      </div>

      <div class="selector-footer">
        <button class="btn btn--secondary" @click="closeSelector">
          取消
        </button>
        <button
          class="btn btn--primary"
          @click="confirmSelection"
          :disabled="!canConfirm"
        >
          确认选择
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  cities: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: '选择城市'
  },
  description: {
    type: String,
    default: '请选择一个城市'
  },
  maxSelections: {
    type: Number,
    default: 1
  },
  filter: {
    type: Function,
    default: () => true
  }
})

const emit = defineEmits(['close', 'confirm'])

const selectedCities = ref([])

const availableCities = computed(() => {
  return props.cities
    .map((city, index) => ({ ...city, originalIndex: index }))
    .filter(city => props.filter(city))
})

const canConfirm = computed(() => {
  if (props.maxSelections === 1) {
    return selectedCities.value.length === 1
  }
  return selectedCities.value.length > 0 && selectedCities.value.length <= props.maxSelections
})

function isSelected(city, index) {
  return selectedCities.value.some(selected =>
    selected.name === city.name && selected.originalIndex === city.originalIndex
  )
}

function canSelectCity(city) {
  // 城市必须存活
  if (city.isAlive === false) return false
  if ((city.currentHp || city.hp) <= 0) return false
  return true
}

function toggleSelectCity(city, index) {
  if (!canSelectCity(city)) return

  const selectedIndex = selectedCities.value.findIndex(selected =>
    selected.name === city.name && selected.originalIndex === city.originalIndex
  )

  if (selectedIndex >= 0) {
    // 取消选择
    selectedCities.value.splice(selectedIndex, 1)
  } else {
    // 添加选择
    if (props.maxSelections === 1) {
      // 单选：替换现有选择
      selectedCities.value = [city]
    } else if (selectedCities.value.length < props.maxSelections) {
      // 多选：添加到列表
      selectedCities.value.push(city)
    }
  }
}

function closeSelector() {
  selectedCities.value = []
  emit('close')
}

function confirmSelection() {
  if (canConfirm.value) {
    emit('confirm', {
      cities: [...selectedCities.value],
      indices: selectedCities.value.map(c => c.originalIndex)
    })
    selectedCities.value = []
  }
}
</script>

<style scoped>
.selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.selector-content {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  color: white;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.selector-title {
  margin: 0;
  font-size: 24px;
}

.close-button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  font-size: 24px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.selector-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.selector-description {
  background: rgba(96, 165, 250, 0.2);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #60a5fa;
  line-height: 1.6;
}

.city-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.city-option {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.city-option:hover:not(.city-option--disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateX(4px);
}

.city-option--selected {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-color: rgba(255, 255, 255, 0.5);
}

.city-option--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(0.5);
}

.city-option__info {
  flex: 1;
}

.city-option__name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.city-center-badge {
  background: gold;
  color: #333;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: bold;
}

.city-option__hp {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.city-option__check {
  font-size: 24px;
  color: white;
  font-weight: bold;
}

.selection-info {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(72, 187, 120, 0.2);
  border-radius: 8px;
  text-align: center;
  border: 2px solid rgba(72, 187, 120, 0.4);
  font-weight: bold;
}

.selector-footer {
  padding: 16px 24px;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.btn--secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn--secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn--primary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(245, 87, 108, 0.4);
}

.btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
