<template>
  <div class="city-editor panel">
    <h2>城市编辑器</h2>
    <div class="content">
      <!-- 玩家选择 -->
      <div style="margin-bottom: 12px;">
        <label>选择玩家</label>
        <select v-model="selectedPlayerName" @change="onPlayerChange">
          <option value="">请选择玩家</option>
          <option v-for="player in players" :key="player.name" :value="player.name">
            {{ player.name }}
          </option>
        </select>
      </div>

      <!-- 城市列表 -->
      <div v-if="selectedPlayer" class="scroll" style="max-height: 500px;">
        <div
          v-for="(city, index) in selectedPlayer.cities"
          :key="index"
          class="city-edit-card"
          :class="{ 'city-dead': !city.isAlive, 'city-selected': selectedCityIndex === index }"
          @click="selectCity(index)"
        >
          <div class="city-header">
            <strong>{{ city.name }}</strong>
            <span :class="city.isAlive ? 'badge good' : 'badge bad'">
              {{ city.isAlive ? '存活' : '阵亡' }}
            </span>
          </div>

          <div v-if="selectedCityIndex === index" class="city-edit-form">
            <!-- HP编辑 -->
            <div class="edit-section">
              <label>当前HP</label>
              <div style="display: flex; gap: 4px; align-items: center;">
                <input
                  v-model.number="city.currentHp"
                  type="number"
                  min="0"
                  :max="city.hp"
                  style="flex: 1;"
                />
                <span class="muted">/ {{ city.hp }}</span>
                <button class="btn-mini" @click="setHpToMax(city)">满血</button>
              </div>
              <div style="margin-top: 4px;">
                <input
                  type="range"
                  :min="0"
                  :max="city.hp"
                  v-model.number="city.currentHp"
                  style="width: 100%;"
                />
              </div>
            </div>

            <!-- 状态编辑 -->
            <div class="edit-section">
              <label>城市状态</label>
              <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                <label class="checkbox-label">
                  <input type="checkbox" v-model="city.isAlive" />
                  存活
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="city.isFatigued" />
                  疲劳
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="city.isInBattle" />
                  在战
                </label>
              </div>
            </div>

            <!-- 技能等级编辑 -->
            <div class="edit-section">
              <label>技能等级</label>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px;">
                <div>
                  <label class="skill-label">红色</label>
                  <input
                    v-model.number="city.red"
                    type="number"
                    min="0"
                    max="10"
                  />
                </div>
                <div>
                  <label class="skill-label">绿色</label>
                  <input
                    v-model.number="city.green"
                    type="number"
                    min="0"
                    max="10"
                  />
                </div>
                <div>
                  <label class="skill-label">蓝色</label>
                  <input
                    v-model.number="city.blue"
                    type="number"
                    min="0"
                    max="10"
                  />
                </div>
                <div>
                  <label class="skill-label">黄色</label>
                  <input
                    v-model.number="city.yellow"
                    type="number"
                    min="0"
                    max="10"
                  />
                </div>
              </div>
            </div>

            <!-- 特殊护盾 -->
            <div class="edit-section">
              <label>特殊效果</label>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <div>
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="!!city.protection"
                      @change="toggleProtection(city, $event.target.checked)"
                    />
                    城市保护罩
                  </label>
                  <input
                    v-if="city.protection"
                    v-model.number="city.protection.rounds"
                    type="number"
                    min="1"
                    max="20"
                    placeholder="剩余回合数"
                    style="width: 100%; margin-top: 4px;"
                  />
                </div>

                <div>
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      :checked="!!city.ironShield"
                      @change="toggleIronShield(city, $event.target.checked)"
                    />
                    钢铁护盾
                  </label>
                  <input
                    v-if="city.ironShield"
                    v-model.number="city.ironShield.layers"
                    type="number"
                    min="1"
                    max="5"
                    placeholder="剩余层数"
                    style="width: 100%; margin-top: 4px;"
                  />
                </div>
              </div>
            </div>

            <!-- 快捷操作 -->
            <div class="edit-section">
              <label>快捷操作</label>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px;">
                <button class="btn" @click="reviveCity(city)">复活城市</button>
                <button class="btn" @click="killCity(city)">击杀城市</button>
                <button class="btn" @click="clearModifiers(city)">清除加成</button>
                <button class="btn" @click="resetCity(city, index)">重置城市</button>
              </div>
            </div>

            <!-- 修改器列表 -->
            <div v-if="city.modifiers && city.modifiers.length > 0" class="edit-section">
              <label>当前修改器 ({{ city.modifiers.length }})</label>
              <div class="modifiers-list">
                <div
                  v-for="(modifier, mIdx) in city.modifiers"
                  :key="mIdx"
                  class="modifier-item"
                >
                  <span class="badge">{{ modifier.type }}</span>
                  <span v-if="modifier.value" class="muted">{{ modifier.value }}</span>
                  <span v-if="modifier.duration" class="muted">{{ modifier.duration }}回合</span>
                  <button class="btn-mini bad" @click="removeModifier(city, mIdx)">×</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 简略信息 -->
          <div v-else class="city-summary">
            <div class="muted" style="font-size: 11px;">
              HP: {{ city.currentHp || city.hp }}/{{ city.hp }}
            </div>
            <div style="margin-top: 4px;">
              <span class="badge">红{{ city.red || 0 }}</span>
              <span class="badge">绿{{ city.green || 0 }}</span>
              <span class="badge">蓝{{ city.blue || 0 }}</span>
              <span class="badge">黄{{ city.yellow || 0 }}</span>
            </div>
            <div v-if="city.isFatigued || city.protection || city.ironShield" class="muted" style="font-size: 10px; margin-top: 4px;">
              <span v-if="city.isFatigued" class="warn">疲劳</span>
              <span v-if="city.protection" class="good">保护</span>
              <span v-if="city.ironShield" class="good">护盾×{{ city.ironShield.layers }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="muted" style="text-align: center; padding: 20px;">
        请先选择一个玩家
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  players: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['city-modified'])

const selectedPlayerName = ref('')
const selectedCityIndex = ref(null)

const selectedPlayer = computed(() => {
  return props.players.find(p => p.name === selectedPlayerName.value)
})

function onPlayerChange() {
  selectedCityIndex.value = null
}

function selectCity(index) {
  selectedCityIndex.value = selectedCityIndex.value === index ? null : index
}

function setHpToMax(city) {
  city.currentHp = city.hp
  emitChange('HP已恢复至满血')
}

function toggleProtection(city, enabled) {
  if (enabled) {
    city.protection = {
      rounds: 10,
      createdRound: 0
    }
  } else {
    city.protection = null
  }
  emitChange(enabled ? '添加了城市保护罩' : '移除了城市保护罩')
}

function toggleIronShield(city, enabled) {
  if (enabled) {
    city.ironShield = {
      layers: 2
    }
  } else {
    city.ironShield = null
  }
  emitChange(enabled ? '添加了钢铁护盾' : '移除了钢铁护盾')
}

function reviveCity(city) {
  city.isAlive = true
  if (!city.currentHp || city.currentHp <= 0) {
    city.currentHp = Math.floor(city.hp * 0.5)
  }
  emitChange(`${city.name} 已复活`)
}

function killCity(city) {
  city.isAlive = false
  city.currentHp = 0
  emitChange(`${city.name} 已阵亡`)
}

function clearModifiers(city) {
  city.modifiers = []
  city.protection = null
  city.isFatigued = false
  emitChange(`${city.name} 的所有加成已清除`)
}

function resetCity(city, index) {
  const originalCity = selectedPlayer.value.cities[index]
  city.currentHp = city.hp
  city.isAlive = true
  city.isFatigued = false
  city.isInBattle = false
  city.protection = null
  city.ironShield = null
  city.modifiers = []
  emitChange(`${city.name} 已重置为初始状态`)
}

function removeModifier(city, modifierIndex) {
  city.modifiers.splice(modifierIndex, 1)
  emitChange('已移除修改器')
}

function emitChange(message) {
  emit('city-modified', {
    player: selectedPlayerName.value,
    city: selectedPlayer.value?.cities[selectedCityIndex.value],
    message
  })
}
</script>

<style scoped>
.city-editor {
  height: 100%;
}

.city-edit-card {
  padding: 10px;
  margin-bottom: 8px;
  background: var(--bg);
  border: 1px solid #1f2937;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.city-edit-card:hover {
  border-color: var(--accent);
  background: #0e1526;
}

.city-edit-card.city-selected {
  border-color: var(--accent);
  background: #18314f;
  cursor: default;
}

.city-edit-card.city-dead {
  opacity: 0.6;
}

.city-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.city-edit-form {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #1f2937;
}

.city-summary {
  margin-top: 6px;
}

.edit-section {
  margin-bottom: 12px;
}

.edit-section label {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--muted);
  font-weight: bold;
}

.skill-label {
  font-size: 10px;
  margin-bottom: 2px;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--panel);
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  user-select: none;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin: 0;
}

.btn-mini {
  padding: 2px 6px;
  font-size: 10px;
  background: var(--accent);
  color: #0f172a;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

.btn-mini:hover {
  background: #3b82f6;
}

.btn-mini.bad {
  background: var(--bad);
  color: white;
}

.modifiers-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.modifier-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  background: var(--panel);
  border-radius: 4px;
  font-size: 10px;
}

.modifier-item .badge {
  font-size: 9px;
}
</style>
