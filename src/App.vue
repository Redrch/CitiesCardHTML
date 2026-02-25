<template>
  <div id="app">
    <MainMenu
      v-if="currentView === 'menu'"
      @enter-player-mode="currentView = 'mode-selection'"
      @show-game-intro="showGameIntro = true"
      @show-skill-guide="showSkillGuide = true"
      @show-question-bank="showQuestionBank = true"
      @show-city-info="showCityInfo = true"
      @show-changelog="showChangelog = true"
    />

    <ModeSelection
      v-if="currentView === 'mode-selection'"
      @back="currentView = 'menu'"
      @select-offline="currentView = 'player-offline'"
      @select-online="currentView = 'player-online'"
    />

    <PlayerModeOffline
      v-if="currentView === 'player-offline'"
      @exit="currentView = 'menu'"
    />

    <PlayerModeOnline
      v-if="currentView === 'player-online'"
      @exit="currentView = 'menu'"
    />

    <!-- 游戏介绍模态框 -->
    <GameIntroModal v-model="showGameIntro" />

    <!-- 技能介绍模态框 -->
    <SkillGuideModal v-model="showSkillGuide" />

    <!-- 城市题库模态框 -->
    <QuestionBankModal v-model="showQuestionBank" />

    <!-- 城市介绍模态框 -->
    <CityInfoModal v-model="showCityInfo" />

    <!-- 更新日志模态框 -->
    <ChangelogModal v-model="showChangelog" />

    <!-- 通知容器 -->
    <NotificationContainer />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import MainMenu from './components/MainMenu/MainMenu.vue'
import ModeSelection from './components/MainMenu/ModeSelection.vue'
import PlayerModeOffline from './components/PlayerMode/PlayerModeNew.vue'
import PlayerModeOnline from './components/PlayerMode/PlayerModeOnline.vue'
import GameIntroModal from './components/Modals/GameIntroModal.vue'
import SkillGuideModal from './components/Modals/SkillGuideModal.vue'
import QuestionBankModal from './components/Modals/QuestionBankModal.vue'
import CityInfoModal from './components/Modals/CityInfoModal.vue'
import ChangelogModal from './components/Modals/ChangelogModal.vue'
import NotificationContainer from './components/Common/NotificationContainer.vue'

const currentView = ref('menu')
const showGameIntro = ref(false)
const showSkillGuide = ref(false)
const showQuestionBank = ref(false)
const showCityInfo = ref(false)
const showChangelog = ref(false)
</script>

<style>
/* 应用级样式已在main.js中导入 */
</style>
