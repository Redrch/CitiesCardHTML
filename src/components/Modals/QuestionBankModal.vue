<template>
  <div
    v-if="modelValue"
    class="modal-backdrop"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2>城市题库</h2>
        <button class="close-btn" @click="close">关闭</button>
      </div>

      <div class="modal-body">
        <!-- 开始刷题按钮 -->
        <div class="quiz-start-section">
          <button class="quiz-start-btn" @click="startQuiz">
            🎯 开始刷题
          </button>
          <div class="quiz-hint">
            随机抽取10道题（普通+进阶8道，挑战2道），每题15秒，满分100分
          </div>
        </div>

        <!-- 题库列表 -->
        <div v-for="cityName in cityNames" :key="cityName">
          <h3 class="city-title">{{ cityName }}题目</h3>
          <div class="questions-section">
            <div
              v-for="(question, index) in getCityAllQuestions(cityName)"
              :key="`${cityName}-${index}`"
              class="question-card"
            >
              <div class="question-header">
                {{ index + 1 }}. {{ question.question }}
              </div>
              <div class="question-options">
                <div v-for="option in question.options" :key="option">
                  {{ option }}
                </div>
              </div>
              <div class="question-answer">
                答案：{{ question.answer }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 刷题模态框 -->
    <div
      v-if="quizActive"
      class="quiz-modal"
    >
      <div class="quiz-content">
        <div v-if="!quizFinished">
          <div class="quiz-header">
            <div class="quiz-progress">
              题目 {{ quizState.currentIndex + 1 }} / {{ quizState.questions.length }}
            </div>
            <div class="quiz-timer" :class="{ 'timer-warning': quizState.timeLeft <= 5 }">
              ⏱️ {{ quizState.timeLeft }}秒
            </div>
          </div>

          <div class="quiz-question">
            <div class="question-text">
              {{ currentQuestion.question }}
            </div>
            <div class="quiz-options">
              <button
                v-for="(option, idx) in currentQuestion.options"
                :key="idx"
                class="quiz-option-btn"
                @click="selectAnswer(option[0])"
              >
                {{ option }}
              </button>
            </div>
          </div>
        </div>

        <div v-else class="quiz-result">
          <h2 class="result-title">刷题完成！</h2>
          <div class="result-score">
            得分：{{ quizState.score }}/100
          </div>
          <div class="result-details">
            <div>正确：{{ quizState.correctCount }}</div>
            <div>错误：{{ quizState.wrongCount }}</div>
            <div>超时：{{ quizState.timeoutCount }}</div>
          </div>
          <div class="result-review">
            <h3>答题回顾</h3>
            <div
              v-for="(item, index) in quizState.reviewData"
              :key="index"
              class="review-item"
              :class="{
                'review-correct': item.isCorrect,
                'review-wrong': !item.isCorrect && item.userAnswer,
                'review-timeout': !item.userAnswer
              }"
            >
              <div class="review-question">
                {{ index + 1 }}. {{ item.question }}
              </div>
              <div class="review-options">
                <div
                  v-for="(option, optIdx) in item.options"
                  :key="optIdx"
                  class="review-option"
                  :class="{
                    'correct-option': option.startsWith(item.correctAnswer + '.'),
                    'user-option': item.userAnswer && option.startsWith(item.userAnswer + '.') && !item.isCorrect
                  }"
                >
                  {{ option }}
                </div>
              </div>
              <div class="review-info">
                <span class="correct-answer-label">
                  正确答案：{{ item.options.find(opt => opt.startsWith(item.correctAnswer + '.')) }}
                </span>
                <span v-if="item.userAnswer" class="user-answer-label">
                  你的答案：{{ item.options.find(opt => opt.startsWith(item.userAnswer + '.')) }}
                </span>
                <span v-else class="timeout-text">
                  超时未答
                </span>
              </div>
            </div>
          </div>
          <button class="quiz-close-btn" @click="closeQuiz">
            关闭
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { CITY_QUESTIONS } from '../../data/cityQuestions'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// 获取所有城市名（排除DEFAULT）
const cityNames = computed(() => {
  return Object.keys(CITY_QUESTIONS).filter(city => city !== 'DEFAULT')
})

// 刷题状态
const quizActive = ref(false)
const quizFinished = ref(false)
const quizState = ref({
  questions: [],
  currentIndex: 0,
  answers: [],
  timer: null,
  timeLeft: 15,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  timeoutCount: 0,
  reviewData: []
})

const currentQuestion = computed(() => {
  if (quizState.value.currentIndex < quizState.value.questions.length) {
    return quizState.value.questions[quizState.value.currentIndex]
  }
  return null
})

/**
 * 获取城市所有题目
 */
function getCityAllQuestions(cityName) {
  const cityQuestions = CITY_QUESTIONS[cityName]
  const allQuestions = []

  if (cityQuestions['普通']) {
    allQuestions.push(...cityQuestions['普通'])
  }
  if (cityQuestions['进阶']) {
    allQuestions.push(...cityQuestions['进阶'])
  }

  return allQuestions
}

/**
 * 打乱选项顺序（保持ABCD位置不变，只打乱选项内容）
 */
function shuffleQuestionOptions(q) {
  const originalOptions = [...q.options]
  const originalAnswer = q.answer

  // 去掉选项中的 "A. " "B. " "C. " "D. " 前缀
  const optionContents = originalOptions.map(opt => {
    // 匹配 "A. " 或 "B. " 等前缀并去除
    return opt.replace(/^[A-D]\.\s*/, '')
  })

  // 创建索引数组 [0, 1, 2, 3] 代表原始位置
  const indices = [0, 1, 2, 3]

  // 使用 Fisher-Yates 算法随机打乱索引
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }

  // 根据打乱后的索引重新排列选项内容，并添加新的 A B C D 前缀
  const answerLetters = ['A', 'B', 'C', 'D']
  const shuffledOptions = indices.map((originalIdx, newIdx) => {
    return `${answerLetters[newIdx]}. ${optionContents[originalIdx]}`
  })

  // 找到原答案在打乱后的新位置
  const originalAnswerIndex = answerLetters.indexOf(originalAnswer)
  const newAnswerIndex = indices.indexOf(originalAnswerIndex)
  const newAnswer = answerLetters[newAnswerIndex]

  return {
    question: q.question,
    options: shuffledOptions,
    answer: newAnswer
  }
}

/**
 * 开始刷题
 */
function startQuiz() {
  const allQuestions = []
  const cities = Object.keys(CITY_QUESTIONS).filter(city => city !== 'DEFAULT')

  cities.forEach(cityName => {
    const cityQuestions = CITY_QUESTIONS[cityName]

    // 普通难度
    if (cityQuestions['普通']) {
      cityQuestions['普通'].forEach(q => {
        const shuffled = shuffleQuestionOptions(q)
        allQuestions.push({
          ...shuffled,
          difficulty: '普通',
          city: cityName
        })
      })
    }

    // 进阶难度
    if (cityQuestions['进阶']) {
      cityQuestions['进阶'].forEach(q => {
        const shuffled = shuffleQuestionOptions(q)
        allQuestions.push({
          ...shuffled,
          difficulty: '进阶',
          city: cityName
        })
      })
    }

    // 挑战难度
    if (cityQuestions['挑战']) {
      cityQuestions['挑战'].forEach(q => {
        const shuffled = shuffleQuestionOptions(q)
        allQuestions.push({
          ...shuffled,
          difficulty: '挑战',
          city: cityName
        })
      })
    }
  })

  // 打乱题目
  const shuffled = allQuestions.sort(() => Math.random() - 0.5)

  // 选择8道普通+进阶，2道挑战
  const easyAndMedium = shuffled.filter(q => q.difficulty !== '挑战').slice(0, 8)
  const hard = shuffled.filter(q => q.difficulty === '挑战').slice(0, 2)

  quizState.value = {
    questions: [...easyAndMedium, ...hard].sort(() => Math.random() - 0.5),
    currentIndex: 0,
    answers: [],
    timer: null,
    timeLeft: 15,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    timeoutCount: 0,
    reviewData: []
  }

  quizActive.value = true
  quizFinished.value = false
  startTimer()
}

/**
 * 开始计时
 */
function startTimer() {
  clearInterval(quizState.value.timer)
  quizState.value.timeLeft = 15

  quizState.value.timer = setInterval(() => {
    quizState.value.timeLeft--

    if (quizState.value.timeLeft <= 0) {
      handleTimeout()
    }
  }, 1000)
}

/**
 * 选择答案
 */
function selectAnswer(answer) {
  clearInterval(quizState.value.timer)

  const question = quizState.value.questions[quizState.value.currentIndex]
  const isCorrect = answer === question.answer

  quizState.value.answers.push({
    question: question.question,
    options: question.options,
    userAnswer: answer,
    correctAnswer: question.answer,
    isCorrect
  })

  if (isCorrect) {
    quizState.value.correctCount++
  } else {
    quizState.value.wrongCount++
  }

  nextQuestion()
}

/**
 * 超时处理
 */
function handleTimeout() {
  clearInterval(quizState.value.timer)

  const question = quizState.value.questions[quizState.value.currentIndex]
  quizState.value.answers.push({
    question: question.question,
    options: question.options,
    userAnswer: null,
    correctAnswer: question.answer,
    isCorrect: false
  })

  quizState.value.timeoutCount++
  nextQuestion()
}

/**
 * 下一题
 */
function nextQuestion() {
  quizState.value.currentIndex++

  if (quizState.value.currentIndex >= quizState.value.questions.length) {
    finishQuiz()
  } else {
    startTimer()
  }
}

/**
 * 完成刷题
 */
function finishQuiz() {
  clearInterval(quizState.value.timer)

  // 计算得分
  quizState.value.score = quizState.value.correctCount * 10
  quizState.value.reviewData = quizState.value.answers

  quizFinished.value = true
}

/**
 * 关闭刷题
 */
function closeQuiz() {
  clearInterval(quizState.value.timer)
  quizActive.value = false
  quizFinished.value = false
}

/**
 * 关闭题库
 */
function close() {
  closeQuiz()
  emit('update:modelValue', false)
}

// 组件销毁时清除计时器
onBeforeUnmount(() => {
  clearInterval(quizState.value.timer)
})
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
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
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

.quiz-start-section {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.quiz-start-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 15px 40px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
}

.quiz-start-btn:hover {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.quiz-hint {
  margin-top: 10px;
  color: #666;
  font-size: 14px;
}

.city-title {
  color: #1976d2;
  border-bottom: 2px solid #1976d2;
  padding-bottom: 8px;
  margin-top: 30px;
  margin-bottom: 16px;
}

.questions-section {
  margin-bottom: 20px;
}

.question-card {
  margin-bottom: 16px;
  padding: 12px;
  background: #e3f2fd;
  border-left: 4px solid #2196f3;
  border-radius: 4px;
}

.question-header {
  font-weight: bold;
  color: #0d47a1;
  margin-bottom: 8px;
}

.question-options {
  color: #424242;
  line-height: 1.8;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 16px;
}

.question-answer {
  color: #d32f2f;
  font-weight: bold;
  margin-top: 8px;
}

/* 刷题模态框 */
.quiz-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quiz-content {
  background: white;
  margin: 20px;
  max-width: 800px;
  width: 100%;
  border-radius: 8px;
  padding: 30px;
  max-height: 90vh;
  overflow-y: auto;
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e0e0e0;
}

.quiz-progress {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.quiz-timer {
  font-size: 20px;
  font-weight: bold;
  color: #4caf50;
}

.timer-warning {
  color: #f44336;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.quiz-question {
  margin-bottom: 20px;
}

.question-text {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.6;
}

.quiz-options {
  display: grid;
  gap: 12px;
}

.quiz-option-btn {
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
  padding: 15px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  text-align: left;
  transition: all 0.3s;
}

.quiz-option-btn:hover {
  background: #e3f2fd;
  border-color: #2196f3;
  transform: translateX(4px);
}

/* 结果页面 */
.quiz-result {
  text-align: center;
}

.result-title {
  color: #4caf50;
  font-size: 32px;
  margin-bottom: 20px;
}

.result-score {
  font-size: 48px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
}

.result-details {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
  font-size: 18px;
}

.result-review {
  text-align: left;
  margin-top: 30px;
}

.result-review h3 {
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.review-item {
  padding: 12px;
  margin-bottom: 10px;
  border-radius: 6px;
  border-left: 4px solid;
}

.review-correct {
  background: #e8f5e9;
  border-color: #4caf50;
}

.review-wrong {
  background: #ffebee;
  border-color: #f44336;
}

.review-timeout {
  background: #fff3e0;
  border-color: #ff9800;
}

.review-question {
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
}

.review-options {
  margin: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.review-option {
  padding: 10px 14px;
  border-radius: 6px;
  background: #f5f5f5;
  border: 2px solid #e0e0e0;
  color: #333;
  font-size: 15px;
}

.review-option.correct-option {
  background: #4caf50;
  border-color: #2e7d32;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
}

.review-option.user-option {
  background: #f44336;
  border-color: #c62828;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);
}

.review-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  margin-top: 12px;
}

.correct-answer-label {
  color: #1b5e20;
  font-weight: 600;
  font-size: 15px;
}

.user-answer-label {
  color: #c62828;
  font-weight: 600;
  font-size: 15px;
}

.timeout-text {
  color: #e65100;
  font-style: italic;
  font-weight: 600;
  font-size: 15px;
}

.quiz-close-btn {
  margin-top: 20px;
  background: #2196f3;
  color: white;
  border: none;
  padding: 12px 40px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.quiz-close-btn:hover {
  background: #1976d2;
}
</style>
