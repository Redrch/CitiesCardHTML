<template>
  <div
    v-if="modelValue"
    class="modal-backdrop"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2>技能介绍（对战模式）</h2>
        <button class="close-btn" @click="close">关闭</button>
      </div>

      <div class="modal-body">
        <!-- 战斗金币技能 -->
        <h3 class="section-title battle-title">战斗金币技能</h3>
        <div class="skills-section">
          <div
            v-for="skill in battleSkills"
            :key="skill.name"
            class="skill-card battle-skill"
          >
            <div class="skill-header">
              【{{ skill.cost }}金币】{{ skill.name }}
            </div>
            <div class="skill-description">
              {{ skill.desc }}
            </div>
          </div>
        </div>

        <!-- 非战斗金币技能 -->
        <h3 class="section-title non-battle-title">非战斗金币技能</h3>
        <div class="skills-section">
          <div
            v-for="skill in nonBattleSkills"
            :key="skill.name"
            class="skill-card non-battle-skill"
          >
            <div class="skill-header">
              【{{ skill.cost }}金币】{{ skill.name }}
            </div>
            <div class="skill-description">
              {{ skill.desc }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { sortSkillsByCost, BATTLE_SKILLS, NON_BATTLE_SKILLS } from '../../data/skillMetadata'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// 按金币消耗排序的战斗技能
const battleSkills = computed(() => {
  return sortSkillsByCost(BATTLE_SKILLS)
})

// 按金币消耗排序的非战斗技能
const nonBattleSkills = computed(() => {
  return sortSkillsByCost(NON_BATTLE_SKILLS)
})

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.modal-content {
  background: white;
  margin: 20px;
  max-width: 900px;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px 8px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: 24px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.section-title {
  border-bottom: 2px solid;
  padding-bottom: 8px;
  margin-top: 0;
  margin-bottom: 16px;
  font-size: 20px;
}

.battle-title {
  color: #d32f2f;
  border-color: #d32f2f;
}

.non-battle-title {
  color: #1976d2;
  border-color: #1976d2;
  margin-top: 30px;
}

.skills-section {
  margin-bottom: 30px;
}

.skill-card {
  margin-bottom: 12px;
  padding: 12px;
  border-left: 4px solid;
  border-radius: 4px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.skill-card:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.battle-skill {
  background: #fff3e0;
  border-color: #ff9800;
}

.non-battle-skill {
  background: #e3f2fd;
  border-color: #2196f3;
}

.skill-header {
  font-weight: bold;
  margin-bottom: 4px;
}

.battle-skill .skill-header {
  color: #e65100;
}

.non-battle-skill .skill-header {
  color: #0d47a1;
}

.skill-description {
  color: #424242;
  line-height: 1.6;
}
</style>
