/**
 * 修复 battleSkills.test.js 中的城市访问方式
 * 从数组索引改为对象键访问
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const testFile = path.join(__dirname, 'src/tests/unit/battleSkills.test.js')
let content = fs.readFileSync(testFile, 'utf8')

// 修复模式：
// 1. caster.cities[0] -> caster.cities['北京'] (中心城市)
// 2. caster.cities[1] -> caster.cities['上海'] (第二个城市)
// 3. target.cities[0] -> target.cities['北京']
// 4. caster.cities.forEach -> Object.values(caster.cities).forEach
// 5. caster.streaks = { 1: 1 } -> caster.streaks = { '上海': 1 }

const replacements = [
  // 修复 forEach 调用
  [/caster\.cities\.forEach/g, "Object.values(caster.cities).forEach"],
  [/target\.cities\.forEach/g, "Object.values(target.cities).forEach"],

  // 修复数组索引访问 - caster
  [/caster\.cities\[0\]/g, "caster.cities['北京']"],
  [/caster\.cities\[1\]/g, "caster.cities['上海']"],
  [/caster\.cities\[2\]/g, "caster.cities['广州']"],

  // 修复数组索引访问 - target
  [/target\.cities\[0\]/g, "target.cities['北京']"],
  [/target\.cities\[1\]/g, "target.cities['上海']"],
  [/target\.cities\[2\]/g, "target.cities['广州']"],

  // 修复 streaks 对象的键
  [/caster\.streaks = \{ 1: 1 \}/g, "caster.streaks = { '上海': 1 }"],
  [/caster\.streaks = \{ 0: 1 \}/g, "caster.streaks = { '北京': 1 }"],

  // 修复 roster 数组（如果有的话）
  [/caster\.roster = \[0, 1\]/g, "caster.roster = ['北京', '上海']"],
  [/target\.roster = \[0, 1\]/g, "target.roster = ['北京', '上海']"],
]

replacements.forEach(([pattern, replacement]) => {
  content = content.replace(pattern, replacement)
})

fs.writeFileSync(testFile, content, 'utf8')
console.log('✅ battleSkills.test.js 已修复')
