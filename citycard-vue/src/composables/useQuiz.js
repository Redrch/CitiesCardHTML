import { ref, computed } from 'vue'
import { CITY_QUESTIONS } from '../data/cityQuestions'

export function useQuiz() {
  const questions = ref([])
  const currentIndex = ref(0)
  const answers = ref([])
  const timeLeft = ref(15)
  const timer = ref(null)
  const isQuizActive = ref(false)
  const isShowingResults = ref(false)

  /**
   * 随机打乱题目选项
   */
  function shuffleQuestionOptions(question) {
    const { question: q, options, answer } = question
    const optionLabels = ['A', 'B', 'C', 'D']
    const originalIndex = optionLabels.indexOf(answer)

    // 创建选项数组
    const optionsWithLabels = options.map((opt, idx) => ({
      label: optionLabels[idx],
      text: opt,
      isCorrect: idx === originalIndex
    }))

    // 打乱选项
    const shuffled = [...optionsWithLabels].sort(() => Math.random() - 0.5)

    // 找到正确答案的新位置
    const newCorrectIndex = shuffled.findIndex(opt => opt.isCorrect)
    const newAnswer = optionLabels[newCorrectIndex]

    return {
      question: q,
      options: shuffled.map(opt => opt.text),
      answer: newAnswer
    }
  }

  /**
   * 开始刷题模式
   */
  function startQuizMode() {
    // 收集所有题目
    const allQuestions = []
    const cities = Object.keys(CITY_QUESTIONS).filter(city => city !== 'DEFAULT')

    cities.forEach(cityName => {
      const cityQuestions = CITY_QUESTIONS[cityName]

      // 普通难度
      if (cityQuestions['普通']) {
        cityQuestions['普通'].forEach(q => {
          const shuffled = shuffleQuestionOptions(q)
          allQuestions.push({
            question: shuffled.question,
            options: shuffled.options,
            answer: shuffled.answer,
            city: cityName,
            difficulty: '普通'
          })
        })
      }

      // 进阶难度
      if (cityQuestions['进阶']) {
        cityQuestions['进阶'].forEach(q => {
          const shuffled = shuffleQuestionOptions(q)
          allQuestions.push({
            question: shuffled.question,
            options: shuffled.options,
            answer: shuffled.answer,
            city: cityName,
            difficulty: '进阶'
          })
        })
      }

      // 挑战难度
      if (cityQuestions['挑战']) {
        cityQuestions['挑战'].forEach(q => {
          const shuffled = shuffleQuestionOptions(q)
          allQuestions.push({
            question: shuffled.question,
            options: shuffled.options,
            answer: shuffled.answer,
            city: cityName,
            difficulty: '挑战'
          })
        })
      }
    })

    // 分离普通+进阶 和 挑战题目
    const normalAndAdvanced = allQuestions.filter(q => q.difficulty !== '挑战')
    const challenge = allQuestions.filter(q => q.difficulty === '挑战')

    // 随机抽取8道普通+进阶
    const selectedNormalAndAdvanced = []
    const shuffledNormal = [...normalAndAdvanced].sort(() => Math.random() - 0.5)
    for (let i = 0; i < Math.min(8, shuffledNormal.length); i++) {
      selectedNormalAndAdvanced.push(shuffledNormal[i])
    }

    // 随机抽取2道挑战
    const selectedChallenge = []
    const shuffledChallenge = [...challenge].sort(() => Math.random() - 0.5)
    for (let i = 0; i < Math.min(2, shuffledChallenge.length); i++) {
      selectedChallenge.push(shuffledChallenge[i])
    }

    // 合并并打乱顺序
    questions.value = [...selectedNormalAndAdvanced, ...selectedChallenge].sort(() => Math.random() - 0.5)
    currentIndex.value = 0
    answers.value = new Array(questions.value.length).fill(null)
    timeLeft.value = 15
    isQuizActive.value = true
    isShowingResults.value = false

    // 开始第一题的计时
    startTimer()
  }

  /**
   * 开始计时
   */
  function startTimer() {
    // 清除之前的计时器
    if (timer.value) {
      clearInterval(timer.value)
    }

    timeLeft.value = 15

    timer.value = setInterval(() => {
      timeLeft.value--

      if (timeLeft.value <= 0) {
        clearInterval(timer.value)
        // 时间到，自动跳到下一题
        nextQuestion()
      }
    }, 1000)
  }

  /**
   * 停止计时
   */
  function stopTimer() {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
  }

  /**
   * 选择答案
   */
  function selectAnswer(answer) {
    // 如果已经选择过答案，不允许重复选择
    if (answers.value[currentIndex.value] !== null) {
      return
    }

    // 记录答案
    answers.value[currentIndex.value] = answer

    // 停止当前题目的计时器
    stopTimer()

    // 延迟300ms后自动进入下一题
    setTimeout(() => {
      nextQuestion()
    }, 300)
  }

  /**
   * 下一题
   */
  function nextQuestion() {
    // 停止计时器
    stopTimer()

    // 检查是否是最后一题
    if (currentIndex.value >= questions.value.length - 1) {
      showResults()
    } else {
      currentIndex.value++
      timeLeft.value = 15
      startTimer()
    }
  }

  /**
   * 显示结果
   */
  function showResults() {
    stopTimer()
    isShowingResults.value = true
  }

  /**
   * 退出刷题
   */
  function exitQuiz() {
    stopTimer()
    isQuizActive.value = false
    isShowingResults.value = false
    questions.value = []
    currentIndex.value = 0
    answers.value = []
  }

  /**
   * 重新开始
   */
  function restartQuiz() {
    startQuizMode()
  }

  // 计算属性
  const currentQuestion = computed(() => questions.value[currentIndex.value])

  const quizResults = computed(() => {
    let correctCount = 0
    questions.value.forEach((q, idx) => {
      if (answers.value[idx] === q.answer) {
        correctCount++
      }
    })

    const score = Math.round((correctCount / questions.value.length) * 100)

    return {
      correctCount,
      totalCount: questions.value.length,
      score,
      details: questions.value.map((q, idx) => ({
        question: q,
        userAnswer: answers.value[idx],
        isCorrect: answers.value[idx] === q.answer
      }))
    }
  })

  const progress = computed(() => {
    return {
      current: currentIndex.value + 1,
      total: questions.value.length
    }
  })

  return {
    // 状态
    questions,
    currentIndex,
    answers,
    timeLeft,
    isQuizActive,
    isShowingResults,

    // 计算属性
    currentQuestion,
    quizResults,
    progress,

    // 方法
    startQuizMode,
    selectAnswer,
    nextQuestion,
    exitQuiz,
    restartQuiz
  }
}
