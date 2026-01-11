<template>
  <div id="app">
    <MainMenu
      v-if="currentView === 'menu'"
      @enter-player-mode="currentView = 'player'"
      @show-skill-guide="showSkillGuide = true"
      @show-question-bank="showQuestionBank = true"
      @show-city-info="showCityInfo = true"
    />

    <PlayerMode
      v-if="currentView === 'player'"
      @exit="currentView = 'menu'"
    />

    <!-- 技能介绍模态框 -->
    <SkillGuideModal v-model="showSkillGuide" />

    <!-- 城市题库模态框 -->
    <QuestionBankModal v-model="showQuestionBank" />

    <!-- 城市介绍模态框 -->
    <CityInfoModal v-model="showCityInfo" />

    <!-- 通知容器 -->
    <NotificationContainer />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MainMenu from './components/MainMenu/MainMenu.vue'
import PlayerMode from './components/PlayerMode/PlayerModeOnline.vue'
import SkillGuideModal from './components/Modals/SkillGuideModal.vue'
import QuestionBankModal from './components/Modals/QuestionBankModal.vue'
import CityInfoModal from './components/Modals/CityInfoModal.vue'
import NotificationContainer from './components/Common/NotificationContainer.vue'

const currentView = ref('menu')
const showSkillGuide = ref(false)
const showQuestionBank = ref(false)
const showCityInfo = ref(false)
</script>

<style>
/* 应用级样式已在main.js中导入 */
</style>
