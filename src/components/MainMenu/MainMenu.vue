<template>
  <div id="mainMenu">
    <h1>城市卡牌游戏</h1>
    <div class="menu-buttons">
      <button class="menu-btn" @click="$emit('enter-player-mode')">
        对战模式
      </button>
      <button class="menu-btn" @click="$emit('show-skill-guide')">
        技能介绍
      </button>
      <button class="menu-btn" @click="$emit('show-question-bank')">
        城市题库
      </button>
      <button class="menu-btn" @click="$emit('show-city-info')">
        城市介绍
      </button>
    </div>
  </div>
</template>

<script setup>
defineEmits(['enter-player-mode', 'show-skill-guide', 'show-question-bank', 'show-city-info'])
</script>

<style scoped>
/* 主菜单样式已在components.css中定义 */
</style>
