<template>
  <div v-if="isQuizActive" class="quiz-modal">
    <div class="quiz-content">
      <!-- 题目显示 -->
      <div v-if="!isShowingResults">
        <div class="quiz-header">
          <div class="quiz-info">
            题目 {{ progress.current }} / {{ progress.total }}
            <span class="difficulty-badge" :class="`difficulty-${currentQuestion.difficulty}`">
              {{ currentQuestion.difficulty }}
            </span>
            <span class="city-badge">
              {{ currentQuestion.city }}
            </span>
          </div>
          <div class="quiz-timer" :class="{ urgent: timeLeft <= 5 }">
            {{ timeLeft }}秒
          </div>
        </div>

        <div class="question-text">
          {{ currentQuestion.question }}
        </div>

        <div class="quiz-options">
          <div
            v-for="(option, idx) in currentQuestion.options"
            :key="idx"
            :class="['quiz-option', { selected: answers[currentIndex] === optionLabels[idx] }]"
            @click="handleSelectAnswer(optionLabels[idx])"
          >
            {{ option }}
          </div>
        </div>

        <div class="quiz-actions">
          <button class="quiz-btn quiz-btn-exit" @click="handleExit">
            退出作答
          </button>
        </div>
      </div>

      <!-- 结果显示 -->
      <div v-else>
        <div class="result-header">
          <div class="result-score">{{ quizResults.score }}分</div>
          <div class="result-text">
            答对 {{ quizResults.correctCount }} / {{ quizResults.totalCount }} 题
          </div>
        </div>

        <div class="result-details">
          <div
            v-for="(detail, idx) in quizResults.details"
            :key="idx"
            :class="['result-item', { correct: detail.isCorrect, wrong: !detail.isCorrect }]"
          >
            <div class="result-item-header">
              <div class="result-item-question">
                {{ idx + 1 }}. {{ detail.question.question }}
              </div>
              <div :class="['result-badge', { correct: detail.isCorrect }]">
                {{ detail.isCorrect ? '✓ 正确' : '✗ 错误' }}
              </div>
            </div>
            <div class="result-item-tags">
              <span class="city-badge">{{ detail.question.city }}</span>
              <span class="difficulty-badge" :class="`difficulty-${detail.question.difficulty}`">
                {{ detail.question.difficulty }}
              </span>
            </div>
            <div class="result-item-options">
              {{ detail.question.options.join(' | ') }}
            </div>
            <div class="result-item-answer">
              <span class="label">你的答案：</span>
              <span :class="['answer', { correct: detail.isCorrect, wrong: !detail.isCorrect }]">
                {{ detail.userAnswer || '未作答' }}
              </span>
              <span v-if="!detail.isCorrect">
                <span class="label">正确答案：</span>
                <span class="answer correct">{{ detail.question.answer }}</span>
              </span>
            </div>
          </div>
        </div>

        <div class="quiz-actions">
          <button class="quiz-btn quiz-btn-exit" @click="handleExit">
            退出作答
          </button>
          <button class="quiz-btn quiz-btn-restart" @click="handleRestart">
            再来一次
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useQuiz } from '../../composables/useQuiz'

const {
  isQuizActive,
  isShowingResults,
  currentQuestion,
  answers,
  currentIndex,
  timeLeft,
  progress,
  quizResults,
  selectAnswer,
  exitQuiz,
  restartQuiz
} = useQuiz()

const optionLabels = ['A', 'B', 'C', 'D']

function handleSelectAnswer(answer) {
  selectAnswer(answer)
}

function handleExit() {
  if (confirm('确定要退出刷题吗？')) {
    exitQuiz()
  }
}

function handleRestart() {
  restartQuiz()
}
</script>

<style scoped>
.quiz-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10000;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quiz-content {
  background: white;
  margin: 20px auto;
  max-width: 900px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 30px;
  color: #333;
}

.quiz-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quiz-info {
  font-size: 16px;
  color: #666;
}

.difficulty-badge {
  margin-left: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.difficulty-普通 {
  background: #e3f2fd;
  color: #1976d2;
}

.difficulty-进阶 {
  background: #fff3e0;
  color: #f57c00;
}

.difficulty-挑战 {
  background: #ffebee;
  color: #d32f2f;
}

.city-badge {
  margin-left: 10px;
  padding: 4px 8px;
  background: #fff3e0;
  color: #f57c00;
  border-radius: 4px;
  font-size: 14px;
}

.quiz-timer {
  font-size: 24px;
  font-weight: bold;
  color: #666;
  min-width: 80px;
  text-align: right;
}

.quiz-timer.urgent {
  color: #d32f2f;
}

.question-text {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
  line-height: 1.6;
}

.quiz-options {
  margin-bottom: 30px;
}

.quiz-option {
  padding: 15px 20px;
  margin-bottom: 10px;
  background: #fff;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
  color: #000;
  font-weight: 500;
}

.quiz-option:hover {
  border-color: #1976d2;
}

.quiz-option.selected {
  border-color: #1976d2;
  background: #e3f2fd;
  pointer-events: none;
}

.quiz-actions {
  display: flex;
  gap: 15px;
}

.quiz-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.quiz-btn-exit {
  background: #999;
  color: white;
}

.quiz-btn-exit:hover {
  background: #777;
}

.quiz-btn-restart {
  background: #1976d2;
  color: white;
}

.quiz-btn-restart:hover {
  background: #1565c0;
}

/* 结果样式 */
.result-header {
  text-align: center;
  margin-bottom: 30px;
}

.result-score {
  font-size: 48px;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 10px;
}

.result-text {
  font-size: 18px;
  color: #666;
}

.result-details {
  margin-bottom: 30px;
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  margin-bottom: 20px;
  padding: 15px;
  border-left: 4px solid;
  border-radius: 4px;
}

.result-item.correct {
  background: #e8f5e9;
  border-color: #4CAF50;
}

.result-item.wrong {
  background: #ffebee;
  border-color: #d32f2f;
}

.result-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.result-item-question {
  font-weight: bold;
  color: #333;
}

.result-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
}

.result-badge.correct {
  background: #4CAF50;
}

.result-badge:not(.correct) {
  background: #d32f2f;
}

.result-item-tags {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.result-item-options {
  margin-top: 10px;
  font-size: 14px;
  color: #555;
}

.result-item-answer {
  margin-top: 10px;
  font-size: 14px;
}

.result-item-answer .label {
  color: #666;
}

.result-item-answer .answer {
  font-weight: bold;
  margin-left: 5px;
  margin-right: 15px;
}

.result-item-answer .answer.correct {
  color: #4CAF50;
}

.result-item-answer .answer.wrong {
  color: #d32f2f;
}
</style>
