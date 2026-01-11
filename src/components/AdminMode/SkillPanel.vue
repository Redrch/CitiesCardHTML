<template>
  <div class="skill-panel">
    <div class="panel">
      <h2>技能系统</h2>
      <div class="content">
        <!-- 技能分类选择 -->
        <div class="row" style="margin-bottom: 12px;">
          <button
            class="btn"
            :class="{ 'btn-primary': skillType === 'battle' }"
            @click="skillType = 'battle'"
          >
            战斗技能
          </button>
          <button
            class="btn"
            :class="{ 'btn-primary': skillType === 'nonBattle' }"
            @click="skillType = 'nonBattle'"
          >
            非战斗技能
          </button>
        </div>

        <!-- 玩家选择 -->
        <div v-if="showPlayerSelect">
          <label>选择玩家</label>
          <select v-model="selectedPlayer">
            <option value="">请选择...</option>
            <option v-for="player in players" :key="player.name" :value="player.name">
              {{ player.name }} ({{ player.gold }} 金币)
            </option>
          </select>
        </div>

        <!-- 技能列表 -->
        <div class="scroll" style="max-height: 400px; margin-top: 12px;">
          <div
            v-for="skill in filteredSkills"
            :key="skill.name"
            class="skill-item"
            :class="{ 'skill-disabled': !canUseSkill(skill) }"
            @click="selectSkill(skill)"
          >
            <div class="skill-header">
              <strong>{{ skill.name }}</strong>
              <span class="badge">{{ skill.cost }} 金币</span>
            </div>
            <div class="skill-desc muted">
              {{ skill.description }}
            </div>
            <div v-if="selectedPlayer && getSkillStatus(skill)" class="skill-status">
              {{ getSkillStatus(skill) }}
            </div>
          </div>
        </div>

        <!-- 使用按钮 -->
        <button
          v-if="selectedSkill"
          class="btn btn-primary"
          :disabled="!canUseSelectedSkill"
          @click="useSelectedSkill"
          style="width: 100%; margin-top: 12px;"
        >
          使用 {{ selectedSkill.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSkills } from '../../composables/useSkills'

const props = defineProps({
  players: {
    type: Array,
    default: () => []
  },
  showPlayerSelect: {
    type: Boolean,
    default: true
  },
  currentPlayer: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['skill-used'])

const { getAvailableSkills, canUseSkill: checkSkillAvailable, useSkill, getSkillInfo } = useSkills()

const skillType = ref('battle')
const selectedPlayer = ref(props.currentPlayer || '')
const selectedSkill = ref(null)

const filteredSkills = computed(() => {
  return getAvailableSkills(skillType.value)
})

const canUseSelectedSkill = computed(() => {
  if (!selectedSkill.value || !selectedPlayer.value) return false

  const player = props.players.find(p => p.name === selectedPlayer.value)
  if (!player) return false

  const result = checkSkillAvailable(
    selectedSkill.value.name,
    selectedPlayer.value,
    player.gold
  )

  return result.canUse
})

function canUseSkill(skill) {
  if (!selectedPlayer.value) return true

  const player = props.players.find(p => p.name === selectedPlayer.value)
  if (!player) return false

  const result = checkSkillAvailable(
    skill.name,
    selectedPlayer.value,
    player.gold
  )

  return result.canUse
}

function getSkillStatus(skill) {
  if (!selectedPlayer.value) return ''

  const player = props.players.find(p => p.name === selectedPlayer.value)
  if (!player) return ''

  const result = checkSkillAvailable(
    skill.name,
    selectedPlayer.value,
    player.gold
  )

  return result.canUse ? '' : result.reason
}

function selectSkill(skill) {
  if (canUseSkill(skill)) {
    selectedSkill.value = skill
  }
}

function useSelectedSkill() {
  if (!canUseSelectedSkill.value) return

  const player = props.players.find(p => p.name === selectedPlayer.value)
  if (!player) return

  // 扣除金币
  player.gold -= selectedSkill.value.cost

  // 使用技能
  const result = useSkill(selectedSkill.value.name, selectedPlayer.value)

  // 触发事件
  emit('skill-used', {
    skill: selectedSkill.value,
    player: selectedPlayer.value,
    result
  })

  // 重置选择
  selectedSkill.value = null
}
</script>

<style scoped>
.skill-item {
  padding: 10px;
  margin-bottom: 8px;
  background: var(--bg);
  border: 1px solid #1f2937;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.skill-item:hover {
  border-color: var(--accent);
  background: #0e1526;
}

.skill-item.skill-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-item.skill-disabled:hover {
  border-color: #1f2937;
  background: var(--bg);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.skill-desc {
  font-size: 11px;
  line-height: 1.4;
}

.skill-status {
  margin-top: 6px;
  font-size: 11px;
  color: var(--warn);
}
</style>
