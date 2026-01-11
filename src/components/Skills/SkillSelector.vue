<template>
  <div class="skill-selector">
    <div class="skill-header">
      <h3>{{ title }}</h3>
      <div class="skill-filters">
        <button
          v-for="category in categories"
          :key="category.id"
          :class="['filter-btn', { active: activeCategory === category.id }]"
          @click="activeCategory = category.id"
        >
          {{ category.name }} ({{ category.count }})
        </button>
      </div>
    </div>

    <div class="skill-grid">
      <div
        v-for="skill in filteredSkills"
        :key="skill.name"
        :class="['skill-card', {
          disabled: !canUseSkill(skill),
          selected: selectedSkill?.name === skill.name
        }]"
        @click="selectSkill(skill)"
      >
        <div class="skill-icon">{{ skill.emoji }}</div>
        <div class="skill-info">
          <div class="skill-name">{{ skill.name }}</div>
          <div class="skill-cost">
            <span class="gold-icon">💰</span>
            {{ getSkillCost(skill.name) }}
          </div>
          <div class="skill-description">{{ skill.description }}</div>

          <!-- 显示使用次数限制 -->
          <div v-if="skill.limit" class="skill-usage">
            <span class="usage-label">使用次数:</span>
            <span class="usage-count">
              {{ getSkillUsageCount(skill.name) }} / {{ skill.limit }}
            </span>
          </div>

          <!-- 显示冷却回合数 -->
          <template v-if="skill.cooldown">
            <div v-if="getSkillCooldownRemaining(skill.name) > 0" class="skill-cooldown-active">
              <span class="cooldown-icon">⏰</span>
              <span class="cooldown-text">剩余{{ getSkillCooldownRemaining(skill.name) }}回合</span>
            </div>
            <div v-else class="skill-cooldown-ready">
              <span class="ready-icon">✅</span>
              <span class="ready-text">冷却完毕</span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="selectedSkill" class="skill-detail">
      <h4>{{ selectedSkill.name }}</h4>
      <p class="detail-description">{{ selectedSkill.detailedDescription }}</p>

      <div class="skill-params">
        <div v-if="selectedSkill.requiresTarget" class="param-group">
          <label>选择目标玩家:</label>
          <select v-model="targetPlayer">
            <option value="">-- 请选择 --</option>
            <option
              v-for="player in opponents"
              :key="player.name"
              :value="player.name"
            >
              {{ player.name }} (金币: {{ player.gold }})
            </option>
          </select>
        </div>

        <div v-if="selectedSkill.requiresSelfCity" class="param-group">
          <label>选择己方城市:</label>
          <select v-model="selfCity">
            <option value="">-- 请选择 --</option>
            <option
              v-for="(city, idx) in props.currentPlayer.cities"
              :key="idx"
              :value="idx"
              :disabled="city.isAlive === false"
            >
              {{ city.name }} (HP: {{ Math.floor(city.currentHp || city.hp) }})
            </option>
          </select>
        </div>

        <div v-if="selectedSkill.requiresTargetCity" class="param-group">
          <label>选择目标城市:</label>
          <select v-model="targetCity">
            <option value="">-- 请选择 --</option>
            <option
              v-for="item in getTargetCities()"
              :key="item.originalIndex"
              :value="item.originalIndex"
              :disabled="item.city.isAlive === false"
            >
              {{ item.city.name }} (HP: {{ Math.floor(item.city.currentHp || item.city.hp) }})
            </option>
          </select>
        </div>

        <div v-if="selectedSkill.requiresMultipleSelfCities" class="param-group">
          <label>选择己方城市（{{ selectedSelfCities.length }} / {{ selectedSkill.targetCount }}）:</label>
          <div class="city-multi-select">
            <div
              v-for="(city, idx) in props.currentPlayer.cities"
              :key="idx"
              :class="[
                'city-checkbox-item',
                {
                  'selected': selectedSelfCities.includes(idx),
                  'disabled': !canSelectCity(city, idx)
                }
              ]"
              @click="toggleCitySelection(idx, city)"
            >
              <input
                type="checkbox"
                :checked="selectedSelfCities.includes(idx)"
                :disabled="!canSelectCity(city, idx)"
                @click.stop="toggleCitySelection(idx, city)"
              />
              <span class="city-checkbox-label">
                {{ city.name }} (HP: {{ Math.floor(city.currentHp || city.hp) }})
              </span>
            </div>
          </div>
          <div v-if="selectedSkill.targetCount && selectedSelfCities.length < selectedSkill.targetCount" class="hint-text">
            请选择 {{ selectedSkill.targetCount }} 个城市
          </div>
        </div>

        <div v-if="selectedSkill.requiresAmount" class="param-group">
          <label>{{ selectedSkill.amountLabel }}:</label>
          <input
            type="number"
            v-model.number="amount"
            :min="selectedSkill.amountMin || 1"
            :max="selectedSkill.amountMax || 999999"
          />
        </div>

        <!-- 技能选择（突破瓶颈/一触即发） -->
        <div v-if="selectedSkill.requiresSkillSelection" class="param-group">
          <label>{{ selectedSkill.selectionType === 'cooldown' ? '选择要清除冷却的技能:' : '选择要增加次数的技能:' }}</label>
          <select v-model="selectedSkillName">
            <option value="">-- 请选择 --</option>
            <option
              v-for="skill in getAvailableSkillsForSelection()"
              :key="skill.name"
              :value="skill.name"
            >
              {{ skill.name }}
              <span v-if="selectedSkill.selectionType === 'cooldown'">
                (剩余{{ skill.remainingRounds }}回合)
              </span>
              <span v-else>
                (已使用{{ skill.usedCount }}次)
              </span>
            </option>
          </select>
        </div>
      </div>

      <div class="skill-actions">
        <button
          class="btn-primary"
          :disabled="!canExecuteSkill()"
          @click="executeSkill"
        >
          使用技能
        </button>
        <button class="btn-secondary" @click="selectedSkill = null">
          取消
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useBattleSkills } from '../../composables/skills/battleSkills'
import { useNonBattleSkills } from '../../composables/skills/nonBattleSkills'
import { SKILL_COSTS } from '../../constants/skillCosts'
import {
  BATTLE_SKILLS,
  NON_BATTLE_SKILLS,
  getSkillRestrictions
} from '../../data/skills'
import { handleJiningSkill } from '../../composables/citySkills/shandong'
import { handleZhoushanSkill } from '../../composables/citySkills/zhejiang'

const props = defineProps({
  title: {
    type: String,
    default: '技能选择'
  },
  currentPlayer: {
    type: Object,
    required: true
  },
  skillType: {
    type: String,
    default: 'all',  // 'all', 'battle', 'nonBattle'
    validator: (value) => ['all', 'battle', 'nonBattle'].includes(value)
  }
})

const emit = defineEmits(['skill-used', 'skill-failed', 'close'])

const gameStore = useGameStore()
const battleSkills = useBattleSkills()
const nonBattleSkills = useNonBattleSkills()

const activeCategory = ref('all')
const selectedSkill = ref(null)
const targetPlayer = ref('')
const targetCity = ref('')
const selfCity = ref('')
const amount = ref(0)
const selectedSelfCities = ref([])  // 多城市选择
const selectedSkillName = ref('')  // 技能选择（突破瓶颈/一触即发）

// 技能分类
const categories = computed(() => [
  { id: 'all', name: '全部', count: allSkills.value.length },
  { id: 'battle', name: '战斗', count: battleSkillsList.value.length },
  { id: 'resource', name: '资源', count: resourceSkills.value.length },
  { id: 'protection', name: '防御', count: protectionSkills.value.length },
  { id: 'damage', name: '伤害', count: damageSkills.value.length },
  { id: 'control', name: '控制', count: controlSkills.value.length }
])

// 技能元数据映射
const SKILL_METADATA = {
  // 战斗金币技能
  '擒贼擒王': { emoji: '👑', category: 'battle', description: '优先攻击最高HP城市', requiresTarget: true },
  '草木皆兵': { emoji: '🌿', category: 'battle', description: '对手伤害减半', requiresTarget: true },
  '越战越勇': { emoji: '💪', category: 'battle', description: '疲劳城市战力不减半', requiresSelfCity: true },
  '吸引攻击': { emoji: '🎯', category: 'battle', description: '城市吸引所有伤害', requiresSelfCity: true },
  '既来则安': { emoji: '🛡️', category: 'battle', description: '新城市首次免疫伤害', requiresSelfCity: true },
  '铜墙铁壁': { emoji: '🛡️', category: 'battle', description: '对手伤害完全无效', requiresTarget: true },
  '背水一战': { emoji: '⚔️', category: 'battle', description: '攻击×2但可能自毁', requiresSelfCity: true },
  '料事如神': { emoji: '🔮', category: 'battle', description: '偷袭造成5000伤害', requiresTarget: true, requiresTargetCity: true },
  '暗度陈仓': { emoji: '🌙', category: 'battle', description: '额外派出未出战城市(3P)', requiresTarget: false },
  '同归于尽': { emoji: '💥', category: 'battle', description: '同归于尽效果', requiresSelfCity: true },
  '声东击西': { emoji: '🎪', category: 'battle', description: '劣势转向攻击(3P)', requiresTarget: true },
  '连续打击': { emoji: '⚡', category: 'battle', description: '多次连续攻击', requiresTarget: true },
  '御驾亲征': { emoji: '👑', category: 'battle', description: '中心城市摧毁最高HP', requiresTarget: true },
  '狂暴模式': { emoji: '😡', category: 'battle', description: '攻击×5血量减半', requiresSelfCity: true },
  '以逸待劳': { emoji: '😌', category: 'battle', description: '额外伤害+抢金币', requiresTarget: true },
  '欲擒故纵': { emoji: '🕸️', category: 'battle', description: '设置陷阱', requiresTarget: true, requiresTargetCity: true },
  '趁火打劫': { emoji: '🔥', category: 'battle', description: '伤害转金币', requiresTarget: true },
  '晕头转向': { emoji: '🌀', category: 'battle', description: '交换出战城市', requiresTarget: true },
  '隔岸观火': { emoji: '🔥', category: 'battle', description: '撤兵观战(3P)', requiresTarget: true },
  '挑拨离间': { emoji: '🎭', category: 'battle', description: '对手内斗(2v2)', requiresTarget: true },
  '反戈一击': { emoji: '↩️', category: 'battle', description: '伤害反弹', requiresTarget: true },
  '围魏救赵': { emoji: '🛡️', category: 'battle', description: '特殊战斗处理', requiresTarget: true },
  '设置屏障': { emoji: '🔰', category: 'battle', description: '15000HP屏障', requiresTarget: false },
  '按兵不动': { emoji: '🛑', category: 'battle', description: '本轮不出战', requiresTarget: false },
  '潜能激发': { emoji: '⚡', category: 'battle', description: '所有城市HP×2', requiresTarget: false },
  '草船借箭': { emoji: '🎯', category: 'battle', description: '攻击转治疗', requiresTarget: true },
  '玉碎瓦全': { emoji: '💎', category: 'battle', description: '目标城市攻击力翻倍，出战则消灭', requiresTarget: true, requiresTargetCity: true },

  // 非战斗金币技能
  '转账给他人': { emoji: '💸', category: 'resource', description: '转账金币给其他玩家', requiresTarget: true, requiresAmount: true, amountLabel: '金额' },
  '无知无畏': { emoji: '⚔️', category: 'damage', description: '最低HP城市自毁攻击对方中心', requiresTarget: true },
  '先声夺人': { emoji: '⚡', category: 'battle', description: '先出牌，若比对方大交换城市', requiresTarget: false },
  '金币贷款': { emoji: '🏦', category: 'resource', description: '贷款5金币，5回合无自动金币', requiresTarget: false },
  '定海神针': { emoji: '⚓', category: 'protection', description: '城市锁定位置，免疫交换', requiresSelfCity: true },
  '焕然一新': { emoji: '✨', category: 'control', description: '重置城市专属技能使用次数', requiresSelfCity: true },
  '抛砖引玉': { emoji: '💎', category: 'resource', description: '禁用城市5回合，每回合+2金币', requiresTarget: false },
  '改弦更张': { emoji: '🔄', category: 'control', description: '重新选择战斗预备城市', requiresTarget: false },
  '拔旗易帜': { emoji: '🚩', category: 'control', description: '更换城市的省份归属', requiresSelfCity: true },
  '城市保护': { emoji: '🛡️', category: 'protection', description: '10回合免疫技能伤害', requiresSelfCity: true },
  '快速治疗': { emoji: '💊', category: 'protection', description: '城市恢复满血', requiresSelfCity: true },
  '一举两得': { emoji: '🎯', category: 'resource', description: '对手本轮必出2城市', requiresTarget: false },
  '明察秋毫': { emoji: '👁️', category: 'control', description: '查看对手战斗预备城市', requiresTarget: true },
  '借尸还魂': { emoji: '👻', category: 'protection', description: '复活阵亡城市满血归来', requiresSelfCity: true },
  '高级治疗': { emoji: '💊', category: 'protection', description: '2城市满血，禁用2回合', requiresSelfCity: true },
  '孔孟故里': { emoji: '🏛️', category: 'protection', description: '给己方2座城市+1000HP', requiresMultipleSelfCities: true, targetCount: 2 },
  '舟山海鲜': { emoji: '🦞', category: 'protection', description: '给己方3座城市HP增加20%', requiresMultipleSelfCities: true, targetCount: 3 },
  '进制扭曲': { emoji: '🔢', category: 'damage', description: '改变对手城市数值进制', requiresTarget: true },
  '整齐划一': { emoji: '📏', category: 'control', description: '所有城市HP统一为平均值', requiresTarget: false },
  '苟延残喘': { emoji: '💀', category: 'protection', description: '所有城市最低保留1HP', requiresTarget: false },
  '代行省权': { emoji: '🏛️', category: 'control', description: '控制对手省会城市', requiresTarget: true },
  '众志成城': { emoji: '🤝', category: 'protection', description: '合并所有城市HP到中心', requiresTarget: false },
  '清除加成': { emoji: '🧹', category: 'control', description: '清除对手所有增益状态', requiresTarget: true },
  '钢铁城市': { emoji: '🏰', category: 'protection', description: '城市免疫技能伤害', requiresSelfCity: true },
  '时来运转': { emoji: '🎲', category: 'resource', description: '交换双方一座城市', requiresTarget: true },
  '实力增强': { emoji: '💪', category: 'buff', description: '攻击力翻倍3回合', requiresTarget: false },
  '人质交换': { emoji: '🤝', category: 'control', description: '随机交换双方城市', requiresTarget: true },
  '釜底抽薪': { emoji: '🔥', category: 'control', description: '对手下个8+金币技能费用增加50%', requiresTarget: true },
  '避而不见': { emoji: '👻', category: 'protection', description: '本轮免疫所有攻击', requiresTarget: false },
  '劫富济贫': { emoji: '💰', category: 'resource', description: '抢夺最富玩家金币给最穷玩家', requiresTarget: true },
  '一触即发': { emoji: '💥', category: 'control', description: '清除指定技能的冷却时间', requiresTarget: false, requiresSkillSelection: true, selectionType: 'cooldown' },
  '技能保护': { emoji: '🛡️', category: 'protection', description: '10回合免疫事半功倍和过河拆桥', requiresTarget: false },
  '无中生有': { emoji: '✨', category: 'resource', description: '获得3金币', requiresTarget: false },
  '突破瓶颈': { emoji: '📈', category: 'buff', description: '增加指定技能使用次数上限', requiresTarget: false, requiresSkillSelection: true, selectionType: 'usage' },
  '坚不可摧': { emoji: '🛡️', category: 'protection', description: '5回合免疫大部分技能', requiresTarget: false },
  '守望相助': { emoji: '🤝', category: 'protection', description: '与对手共享防御状态', requiresTarget: true },
  '博学多才': { emoji: '📚', category: 'resource', description: '答题正确增加城市HP', requiresSelfCity: true },
  '李代桃僵': { emoji: '🌸', category: 'protection', description: '替死一次，5回合冷却', requiresTarget: false },
  '天灾人祸': { emoji: '⚡', category: 'damage', description: '对手所有城市攻击力变1', requiresTarget: true },
  '血量存储': { emoji: '💉', category: 'protection', description: '建立HP存储库，可存取', requiresSelfCity: true },
  '海市蜃楼': { emoji: '🏝️', category: 'control', description: '中心投影，75%拦截伤害', requiresTarget: false },
  '城市预言': { emoji: '🔮', category: 'control', description: '预知下回合出战城市', requiresTarget: false },
  '倒反天罡': { emoji: '🔄', category: 'control', description: '永久移除对手省会效果', requiresTarget: true },
  '解除封锁': { emoji: '🔓', category: 'control', description: '解除被事半功倍禁用的技能', requiresTarget: false },
  '提灯定损': { emoji: '🏮', category: 'damage', description: '对手所有城市-2000HP', requiresTarget: true },
  '好高骛远': { emoji: '🎯', category: 'buff', description: '城市HP上限+20000', requiresSelfCity: true },
  '目不转睛': { emoji: '👁️', category: 'control', description: '对手3回合只能用当机立断', requiresTarget: true },
  '数位反转': { emoji: '🔢', category: 'control', description: '反转对手城市数位', requiresTarget: true },
  '波涛汹涌': { emoji: '🌊', category: 'damage', description: '对手全体城市-5000HP', requiresTarget: true },
  '狂轰滥炸': { emoji: '💣', category: 'damage', description: '对手全体城市-8000HP', requiresTarget: true },
  '横扫一空': { emoji: '💨', category: 'control', description: '清空对手战斗预备城市的城市专属技能', requiresTarget: true },
  '万箭齐发': { emoji: '🏹', category: 'damage', description: '对手全体-3000，最低HP-6000', requiresTarget: true },
  '移花接木': { emoji: '🌸', category: 'control', description: '偷取对手1个技能使用', requiresTarget: true },
  '连锁反应': { emoji: '⚡', category: 'damage', description: '击杀城市，扩散伤害', requiresTarget: true },
  '招贤纳士': { emoji: '👥', category: 'resource', description: '获得1座随机城市', requiresTarget: false },
  '不露踪迹': { emoji: '👻', category: 'control', description: '3回合对手无法侦查', requiresTarget: false },
  '降维打击': { emoji: '⬇️', category: 'damage', description: '降低对手城市档次', requiresTarget: true },
  '狐假虎威': { emoji: '🦊', category: 'control', description: '伪装城市HP和名称', requiresSelfCity: true, requiresAmount: true, amountLabel: '伪装HP' },
  '过河拆桥': { emoji: '🌉', category: 'control', description: '禁用对手接下来5个不同技能', requiresTarget: true },
  '厚积薄发': { emoji: '📦', category: 'buff', description: '累积3回合，攻击力×8', requiresTarget: false },
  '深藏不露': { emoji: '🎭', category: 'control', description: '城市连续5回合未出战+10000HP', requiresTarget: false },
  '定时爆破': { emoji: '💣', category: 'damage', description: '3回合后摧毁对手城市', requiresTarget: true, requiresTargetCity: true },
  '永久摧毁': { emoji: '💥', category: 'damage', description: '永久摧毁对手城市', requiresTarget: true, requiresTargetCity: true },
  '搬运救兵·普通': { emoji: '🚚', category: 'resource', description: '获得2座随机城市', requiresTarget: false },
  '电磁感应': { emoji: '⚡', category: 'damage', description: '建立链接，受伤共享', requiresTarget: true },
  '士气大振': { emoji: '📣', category: 'buff', description: '所有城市HP+5000', requiresTarget: false },
  '战略转移': { emoji: '🚚', category: 'control', description: '己方城市转移给对手', requiresSelfCity: true, requiresTargetCity: true },
  '无懈可击': { emoji: '🛡️', category: 'protection', description: '撤销对手上一个技能', requiresTarget: false },
  '趁其不备·随机': { emoji: '🎲', category: 'damage', description: '摧毁对手随机城市', requiresTarget: true },
  '自相残杀': { emoji: '⚔️', category: 'control', description: '对手城市互相攻击', requiresTarget: true },
  '当机立断': { emoji: '⚡', category: 'control', description: '免疫目不转睛的限制', requiresTarget: false },
  '中庸之道': { emoji: '⚖️', category: 'control', description: '所有玩家城市HP均衡', requiresTarget: false },
  '步步高升': { emoji: '📈', category: 'buff', description: '城市阵亡召唤更高HP城市', requiresTarget: false },
  '大义灭亲': { emoji: '⚔️', category: 'damage', description: '摧毁己方城市', requiresSelfCity: true },
  '搬运救兵·高级': { emoji: '🚁', category: 'resource', description: '获得5座随机城市', requiresTarget: false },
  '强制迁都·普通': { emoji: '🏛️', category: 'control', description: '对手更换中心城市', requiresTarget: true },
  '强制搬运': { emoji: '🚚', category: 'control', description: '对手获得1座随机城市', requiresTarget: true },
  '言听计从': { emoji: '👂', category: 'control', description: '控制对手下回合行动', requiresTarget: true, requiresTargetCity: true },
  '趁其不备·指定': { emoji: '🎯', category: 'damage', description: '摧毁对手指定城市', requiresTarget: true, requiresTargetCity: true },
  '行政中心': { emoji: '🏛️', category: 'control', description: '将省会设为行政中心', requiresTarget: false },
  '夷为平地': { emoji: '💥', category: 'damage', description: '摧毁对手全部城市', requiresTarget: true },
  '副中心制': { emoji: '🏢', category: 'control', description: '设置副中心城市', requiresSelfCity: true },
  '以礼来降': { emoji: '🤝', category: 'resource', description: '招降对手1座城市', requiresTarget: true, requiresTargetCity: true },
  '计划单列': { emoji: '📋', category: 'control', description: '省会独立，享受特权', requiresTarget: false },
  '强制迁都·高级版': { emoji: '🏛️', category: 'control', description: '对手中心变为HP最低城市', requiresTarget: true },
  '四面楚歌': { emoji: '🎭', category: 'resource', description: '同省份城市全部归顺', requiresTarget: true },
  '生于紫室': { emoji: '👑', category: 'buff', description: '城市攻击力×2，每回合HP+10%', requiresSelfCity: true },
  '城市侦探': { emoji: '🔍', category: 'control', description: '侦查对手所有城市信息', requiresTarget: true },
  '金融危机': { emoji: '💸', category: 'control', description: '3回合金币最高者无法+3', requiresTarget: true },
  '城市试炼': { emoji: '⚔️', category: 'buff', description: '答题增强城市属性', requiresSelfCity: true },
  '事半功倍': { emoji: '✨', category: 'resource', description: '禁用对手1个技能，费用减半', requiresTarget: false }
}

// 技能列表定义(从skills.js导入完整列表)
const allSkills = computed(() => {
  const skills = []

  // 战斗技能
  if (props.skillType === 'all' || props.skillType === 'battle') {
    BATTLE_SKILLS.forEach(skillName => {
      const metadata = SKILL_METADATA[skillName] || {
        emoji: '❓',
        category: 'battle',
        description: skillName
      }
      const restrictions = getSkillRestrictions(skillName)
      skills.push({
        name: skillName,
        ...metadata,
        ...restrictions
      })
    })
  }

  // 非战斗技能
  if (props.skillType === 'all' || props.skillType === 'nonBattle') {
    NON_BATTLE_SKILLS.forEach(skillName => {
      const metadata = SKILL_METADATA[skillName] || {
        emoji: '❓',
        category: 'resource',
        description: skillName
      }
      const restrictions = getSkillRestrictions(skillName)
      skills.push({
        name: skillName,
        ...metadata,
        ...restrictions
      })
    })
  }

  return skills
})

const filteredSkills = computed(() => {
  if (activeCategory.value === 'all') {
    return allSkills.value
  }
  return allSkills.value.filter(s => s.category === activeCategory.value)
})

const battleSkillsList = computed(() => allSkills.value.filter(s => s.category === 'battle'))
const resourceSkills = computed(() => allSkills.value.filter(s => s.category === 'resource'))
const protectionSkills = computed(() => allSkills.value.filter(s => s.category === 'protection'))
const damageSkills = computed(() => allSkills.value.filter(s => s.category === 'damage'))
const controlSkills = computed(() => allSkills.value.filter(s => s.category === 'control'))

const opponents = computed(() => {
  if (!gameStore.players || !Array.isArray(gameStore.players)) {
    console.warn('[SkillSelector] gameStore.players 不是数组:', gameStore.players)
    return []
  }
  const opps = gameStore.players.filter(p => p && p.name !== props.currentPlayer?.name)
  console.log('[SkillSelector] opponents:', opps.map(p => p.name))
  console.log('[SkillSelector] currentPlayer:', props.currentPlayer?.name)
  console.log('[SkillSelector] gameStore.players:', gameStore.players.map(p => p?.name))
  return opps
})

function getSkillCost(skillName) {
  return SKILL_COSTS[skillName] || 0
}

// 获取技能使用次数
function getSkillUsageCount(skillName) {
  return gameStore.getSkillUsageCount(props.currentPlayer.name, skillName) || 0
}

// 获取技能冷却剩余回合数
function getSkillCooldownRemaining(skillName) {
  return gameStore.getSkillCooldown(props.currentPlayer.name, skillName) || 0
}

function canUseSkill(skill) {
  const cost = getSkillCost(skill.name)
  if (props.currentPlayer.gold < cost) return false

  // 检查使用次数限制
  if (skill.limit) {
    const usageCount = getSkillUsageCount(skill.name)
    if (usageCount >= skill.limit) return false
  }

  // 检查技能冷却
  if (skill.cooldown) {
    const cooldownRemaining = getSkillCooldownRemaining(skill.name)
    if (cooldownRemaining > 0) return false
  }

  return true
}

function selectSkill(skill) {
  if (!canUseSkill(skill)) {
    console.log('[SkillSelector] 无法使用技能:', skill.name, '原因: 金币不足或其他限制')
    return
  }
  console.log('[SkillSelector] 选择技能:', skill.name)
  selectedSkill.value = skill
  // 重置参数
  targetPlayer.value = ''
  targetCity.value = ''
  selfCity.value = ''
  amount.value = 0
  selectedSelfCities.value = []  // 重置多城市选择
  selectedSkillName.value = ''  // 重置技能选择
}

// 获取可选择的技能列表（突破瓶颈/一触即发）
function getAvailableSkillsForSelection() {
  if (!selectedSkill.value || !selectedSkill.value.requiresSkillSelection) {
    return []
  }

  if (selectedSkill.value.selectionType === 'cooldown') {
    // 一触即发：返回所有冷却中的技能
    const coolingSkills = []
    if (gameStore.cooldowns && gameStore.cooldowns[props.currentPlayer.name]) {
      const myCooldowns = gameStore.cooldowns[props.currentPlayer.name]
      for (const [name, rounds] of Object.entries(myCooldowns)) {
        if (rounds > 0) {
          coolingSkills.push({
            name: name,
            remainingRounds: rounds
          })
        }
      }
    }
    return coolingSkills
  } else if (selectedSkill.value.selectionType === 'usage') {
    // 突破瓶颈：返回所有已使用过的技能
    const usedSkills = []
    if (gameStore.skillUsageTracking && gameStore.skillUsageTracking[props.currentPlayer.name]) {
      const myTracking = gameStore.skillUsageTracking[props.currentPlayer.name]
      for (const [name, count] of Object.entries(myTracking)) {
        if (count > 0) {
          usedSkills.push({
            name: name,
            usedCount: count
          })
        }
      }
    }
    return usedSkills
  }

  return []
}

// 切换城市选择状态
function toggleCitySelection(cityIdx, city) {
  if (!canSelectCity(city, cityIdx)) return

  const index = selectedSelfCities.value.indexOf(cityIdx)
  if (index > -1) {
    // 取消选择
    selectedSelfCities.value.splice(index, 1)
  } else {
    // 添加选择
    if (selectedSelfCities.value.length < selectedSkill.value.targetCount) {
      selectedSelfCities.value.push(cityIdx)
    }
  }
}

// 检查城市是否可以被选择
function canSelectCity(city, cityIdx) {
  if (!city) return false
  if (city.isAlive === false) return false

  // 检查HP需求（舟山海鲜：HP20000以下可使用）
  if (selectedSkill.value.hpRequirement) {
    const currentHp = city.currentHp || city.hp || 0
    if (selectedSkill.value.hpRequirement.max && currentHp > selectedSkill.value.hpRequirement.max) {
      return false
    }
    if (selectedSkill.value.hpRequirement.min && currentHp < selectedSkill.value.hpRequirement.min) {
      return false
    }
  }

  return true
}

function getTargetCities() {
  if (!targetPlayer.value) return []
  const player = opponents.value.find(p => p.name === targetPlayer.value)
  if (!player || !player.cities) return []

  const centerIdx = player.centerIndex || 0

  // 返回已知城市，同时保留原始索引
  return player.cities
    .map((city, idx) => ({ city, originalIndex: idx }))
    .filter(item => {
      // 过滤掉已阵亡的城市
      if (!item.city || item.city.currentHp <= 0 || item.city.isAlive === false) {
        return false
      }

      // 对于言听计从和以礼来降，过滤掉中心城市
      if ((selectedSkill.value?.name === '言听计从' || selectedSkill.value?.name === '以礼来降') &&
          item.originalIndex === centerIdx) {
        return false
      }

      // 主持人模式或knownCities未初始化时，显示所有城市（除中心外）
      // 玩家模式才检查已知城市
      if (!gameStore.knownCities ||
          !gameStore.knownCities[props.currentPlayer.name] ||
          !gameStore.knownCities[props.currentPlayer.name][player.name]) {
        // 未初始化：显示所有非中心城市
        return true
      }

      // 检查城市是否为当前玩家所知
      return gameStore.isCityKnown(player.name, item.originalIndex, props.currentPlayer.name)
    })
}

function canExecuteSkill() {
  if (!selectedSkill.value) return false
  if (selectedSkill.value.requiresTarget && !targetPlayer.value) return false
  if (selectedSkill.value.requiresTargetCity && targetCity.value === '') return false
  if (selectedSkill.value.requiresSelfCity && selfCity.value === '') return false
  if (selectedSkill.value.requiresAmount && !amount.value) return false
  if (selectedSkill.value.requiresMultipleSelfCities && selectedSelfCities.value.length !== selectedSkill.value.targetCount) return false
  if (selectedSkill.value.requiresSkillSelection && !selectedSkillName.value) return false
  return true
}

// 技能执行映射表
const SKILL_EXECUTOR_MAP = {
  // 战斗技能
  '擒贼擒王': () => battleSkills.executeQinZeiQinWang(props.currentPlayer, getTargetPlayer()),
  '草木皆兵': () => battleSkills.executeCaoMuJieBing(props.currentPlayer, getTargetPlayer()),
  '越战越勇': () => battleSkills.executeYueZhanYueYong(props.currentPlayer, getSelfCityObject()),
  '吸引攻击': () => battleSkills.executeXiYinGongJi(props.currentPlayer, getSelfCityObject()),
  '铜墙铁壁': () => battleSkills.executeTongQiangTieBi(props.currentPlayer, getTargetPlayer()),
  '背水一战': () => battleSkills.executeBeiShuiYiZhan(props.currentPlayer, getSelfCityObject()),
  '料事如神': () => battleSkills.executeLiaoShiRuShen(props.currentPlayer, getTargetPlayer(), getTargetCityObject()),
  '同归于尽': () => battleSkills.executeTongGuiYuJin(props.currentPlayer, getSelfCityObject()),
  '设置屏障': () => battleSkills.executeSetBarrier(props.currentPlayer),
  '潜能激发': () => battleSkills.executeQianNengJiFa(props.currentPlayer),
  '御驾亲征': () => battleSkills.executeYuJiaQinZheng(props.currentPlayer, getTargetPlayer()),
  '狂暴模式': () => battleSkills.executeKuangBaoMoShi(props.currentPlayer, getSelfCityObject()),
  '按兵不动': () => battleSkills.executeAnBingBuDong(props.currentPlayer),
  '既来则安': () => battleSkills.executeJiLaiZeAn(props.currentPlayer, getSelfCityObject()),
  '反戈一击': () => battleSkills.executeFanGeYiJi(props.currentPlayer, getTargetPlayer()),
  '暗度陈仓': () => battleSkills.executeAnDuChenCang(props.currentPlayer),
  '声东击西': () => battleSkills.executeShengDongJiXi(props.currentPlayer, getTargetPlayer()),
  '以逸待劳': () => battleSkills.executeYiYiDaiLao(props.currentPlayer, getTargetPlayer()),
  '草船借箭': () => battleSkills.executeCaoChuanJieJian(props.currentPlayer, getTargetPlayer()),
  '围魏救赵': () => battleSkills.executeWeiWeiJiuZhao(props.currentPlayer, getTargetPlayer()),
  '欲擒故纵': () => battleSkills.executeYuQinGuZong(props.currentPlayer, getTargetPlayer(), getTargetCityObject()),
  '晕头转向': () => battleSkills.executeYunTouZhuanXiang(props.currentPlayer, getTargetPlayer()),
  '隔岸观火': () => battleSkills.executeGeAnGuanHuo(props.currentPlayer, getTargetPlayer()),
  '挑拨离间': () => battleSkills.executeTiaoBoBaoLiJian(props.currentPlayer, getTargetPlayer()),
  '趁火打劫': () => battleSkills.executeChenHuoDaJie(props.currentPlayer, getTargetPlayer()),
  '玉碎瓦全': () => battleSkills.executeYuSuiWaQuan(props.currentPlayer, getTargetPlayer(), targetCity.value),

  // 非战斗技能
  '转账给他人': () => nonBattleSkills.executeTransferGold(props.currentPlayer, getTargetPlayer(), amount.value),
  '无知无畏': () => nonBattleSkills.executeWuZhiWuWei(props.currentPlayer, getTargetPlayer()),
  '金币贷款': () => nonBattleSkills.executeJinBiDaiKuan(props.currentPlayer),
  '快速治疗': () => nonBattleSkills.executeKuaiSuZhiLiao(props.currentPlayer, getSelfCityObject()),
  '城市保护': () => nonBattleSkills.executeCityProtection(props.currentPlayer, getSelfCityObject()),
  '钢铁城市': () => nonBattleSkills.executeGangTieChengShi(props.currentPlayer, getSelfCityObject()),
  '定海神针': () => nonBattleSkills.executeDingHaiShenZhen(props.currentPlayer, getSelfCityObject()),
  '焕然一新': () => nonBattleSkills.executeHuanRanYiXin(props.currentPlayer, getSelfCityObject()),
  '抛砖引玉': () => nonBattleSkills.executePaoZhuanYinYu(props.currentPlayer),
  '改弦更张': () => nonBattleSkills.executeGaiXianGengZhang(props.currentPlayer),
  '拔旗易帜': () => nonBattleSkills.executeBaQiYiZhi(props.currentPlayer, getSelfCityObject()),
  '高级治疗': () => nonBattleSkills.executeGaoJiZhiLiao(props.currentPlayer, getSelfCityObject()),
  '借尸还魂': () => nonBattleSkills.executeJieShiHuanHun(props.currentPlayer, getSelfCityObject()),
  '实力增强': () => nonBattleSkills.executeShiLiZengQiang(props.currentPlayer),
  '士气大振': () => nonBattleSkills.executeShiQiDaZhen(props.currentPlayer),
  '清除加成': () => nonBattleSkills.executeQingChuJiaCheng(props.currentPlayer, getTargetPlayer()),
  '时来运转': () => nonBattleSkills.executeShiLaiYunZhuan(props.currentPlayer, getTargetPlayer()),
  '众志成城': () => nonBattleSkills.executeZhongZhiChengCheng(props.currentPlayer),
  '无中生有': () => nonBattleSkills.executeWuZhongShengYou(props.currentPlayer),
  '苟延残喘': () => nonBattleSkills.executeGouYanCanChuan(props.currentPlayer),
  '好高骛远': () => nonBattleSkills.executeHaoGaoWuYuan(props.currentPlayer, getSelfCityObject()),
  '狐假虎威': () => nonBattleSkills.executeHuJiaHuWei(props.currentPlayer, getSelfCityObject(), amount.value, '伪装城市'),
  '四面楚歌': () => nonBattleSkills.executeSiMianChuGe(props.currentPlayer, getTargetPlayer()),
  '博学多才': () => nonBattleSkills.executeBoXueDuoCai(props.currentPlayer, getSelfCityObject(), 3),
  '进制扭曲': () => nonBattleSkills.executeJinZhiNiuQu(props.currentPlayer, getTargetPlayer()),
  '提灯定损': () => nonBattleSkills.executeTiDengDingSun(props.currentPlayer, getTargetPlayer()),
  '连续打击': () => nonBattleSkills.executeLianXuDaJi(props.currentPlayer, getTargetPlayer()),
  '波涛汹涌': () => nonBattleSkills.executeBoTaoXiongYong(props.currentPlayer, getTargetPlayer()),
  '狂轰滥炸': () => nonBattleSkills.executeKuangHongLanZha(props.currentPlayer, getTargetPlayer()),
  '横扫一空': () => nonBattleSkills.executeHengSaoYiKong(props.currentPlayer, getTargetPlayer()),
  '万箭齐发': () => nonBattleSkills.executeWanJianQiFa(props.currentPlayer, getTargetPlayer()),
  '降维打击': () => nonBattleSkills.executeJiangWeiDaJi(props.currentPlayer, getTargetPlayer()),
  '深藏不露': () => nonBattleSkills.executeShenCangBuLu(props.currentPlayer),
  '定时爆破': () => nonBattleSkills.executeDingShiBaoPo(props.currentPlayer, getTargetPlayer(), getTargetCityObject()),
  '永久摧毁': () => nonBattleSkills.executeYongJiuCuiHui(props.currentPlayer, getTargetPlayer(), getTargetCityObject()),
  '战略转移': () => nonBattleSkills.executeZhanLueZhuanYi(props.currentPlayer, getSelfCityObject()),
  '连锁反应': () => nonBattleSkills.executeLianSuoFanYing(props.currentPlayer, getTargetPlayer()),
  '招贤纳士': () => nonBattleSkills.executeZhaoXianNaShi(props.currentPlayer),
  '无懈可击': () => nonBattleSkills.executeWuXieKeJi(props.currentPlayer),
  '坚不可摧': () => nonBattleSkills.executeJianBuKeCui(props.currentPlayer),
  '移花接木': () => nonBattleSkills.executeYiHuaJieMu(props.currentPlayer, getTargetPlayer()),
  '不露踪迹': () => nonBattleSkills.executeBuLuZongJi(props.currentPlayer),
  '整齐划一': () => nonBattleSkills.executeZhengQiHuaYi(props.currentPlayer),
  '人质交换': () => nonBattleSkills.executeRenZhiJiaoHuan(props.currentPlayer, getTargetPlayer()),
  '釜底抽薪': () => nonBattleSkills.executeFuDiChouXin(props.currentPlayer, getTargetPlayer()),
  '金融危机': () => nonBattleSkills.executeJinRongWeiJi(props.currentPlayer, getTargetPlayer()),
  '劫富济贫': () => nonBattleSkills.executeJieFuJiPin(props.currentPlayer, getTargetPlayer()),
  '城市试炼': () => nonBattleSkills.executeChengShiShiLian(props.currentPlayer, getSelfCityObject()),
  '天灾人祸': () => nonBattleSkills.executeTianZaiRenHuo(props.currentPlayer, getTargetPlayer()),
  '李代桃僵': () => nonBattleSkills.executeLiDaiTaoJiang(props.currentPlayer),
  '避而不见': () => nonBattleSkills.executeBiErBuJian(props.currentPlayer),
  '一触即发': () => nonBattleSkills.executeYiChuJiFa(props.currentPlayer, selectedSkillName.value),
  '技能保护': () => nonBattleSkills.executeJiNengBaoHu(props.currentPlayer),
  '突破瓶颈': () => nonBattleSkills.executeTuPoPingJing(props.currentPlayer, selectedSkillName.value),
  '血量存储': () => nonBattleSkills.executeXueLiangCunChu(props.currentPlayer, getSelfCityObject()),
  '海市蜃楼': () => nonBattleSkills.executeHaiShiShenLou(props.currentPlayer),
  '解除封锁': () => nonBattleSkills.executeJieChuFengSuo(props.currentPlayer),
  '数位反转': () => nonBattleSkills.executeShuWeiFanZhuan(props.currentPlayer, getTargetPlayer()),
  '目不转睛': () => nonBattleSkills.executeMuBuZhuanJing(props.currentPlayer, getTargetPlayer()),
  '过河拆桥': () => nonBattleSkills.executeGuoHeChaiQiao(props.currentPlayer, getTargetPlayer()),
  '电磁感应': () => nonBattleSkills.executeDianCiGanYing(props.currentPlayer, getTargetPlayer()),
  '厚积薄发': () => nonBattleSkills.executeHouJiBaoFa(props.currentPlayer),
  '中庸之道': () => nonBattleSkills.executeZhongYongZhiDao(props.currentPlayer),
  '当机立断': () => nonBattleSkills.executeDangJiLiDuan(props.currentPlayer),
  '自相残杀': () => nonBattleSkills.executeZiXiangCanSha(props.currentPlayer, getTargetPlayer()),
  '言听计从': () => nonBattleSkills.executeYanTingJiCong(props.currentPlayer, getTargetPlayer(), targetCity.value),
  '事半功倍': () => nonBattleSkills.executeShiBanGongBei(props.currentPlayer),
  '倒反天罡': () => nonBattleSkills.executeDaoFanTianGang(props.currentPlayer, getTargetPlayer()),
  '搬运救兵·普通': () => nonBattleSkills.executeBanyunJiubingPutong(props.currentPlayer),
  '搬运救兵·高级': () => nonBattleSkills.executeBanyunJiubingGaoji(props.currentPlayer),
  '趁其不备·随机': () => nonBattleSkills.executeChenqibubeiSuiji(props.currentPlayer, getTargetPlayer()),
  '趁其不备·指定': () => nonBattleSkills.executeChenqibubeiZhiding(props.currentPlayer, getTargetPlayer(), getTargetCityObject()),
  '守望相助': () => nonBattleSkills.executeShouWangXiangZhu(props.currentPlayer, getTargetPlayer()),
  '以礼来降': () => nonBattleSkills.executeYiLiLaiJiang(props.currentPlayer, getTargetPlayer(), getTargetCityObject()),
  '大义灭亲': () => nonBattleSkills.executeDaYiMieQin(props.currentPlayer, getSelfCityObject()),
  '强制迁都·普通': () => nonBattleSkills.executeQiangZhiQianDuPutong(props.currentPlayer, getTargetPlayer()),
  '强制迁都·高级版': () => nonBattleSkills.executeQiangZhiQianDuGaoji(props.currentPlayer, getTargetPlayer()),
  '夷为平地': () => nonBattleSkills.executeYiWeiPingDi(props.currentPlayer, getTargetPlayer()),
  '强制搬运': () => nonBattleSkills.executeQiangZhiBanYun(props.currentPlayer, getTargetPlayer()),
  '行政中心': () => nonBattleSkills.executeXingZhengZhongXin(props.currentPlayer),
  '代行省权': () => nonBattleSkills.executeDaiXingShengQuan(props.currentPlayer, getTargetPlayer()),
  '副中心制': () => nonBattleSkills.executeFuZhongXinZhi(props.currentPlayer, getSelfCityObject()),
  '计划单列': () => nonBattleSkills.executeJiHuaDanLie(props.currentPlayer),
  '步步高升': () => nonBattleSkills.executeBuBuGaoSheng(props.currentPlayer),
  '生于紫室': () => nonBattleSkills.executeShengYuZiShi(props.currentPlayer, getSelfCityObject()),
  '城市侦探': () => nonBattleSkills.executeCityDetective(props.currentPlayer, getTargetPlayer()),
  '城市预言': () => nonBattleSkills.executeChengShiYuYan(props.currentPlayer),
  '一举两得': () => nonBattleSkills.executeYiJuLiangDe(props.currentPlayer),
  '明察秋毫': () => nonBattleSkills.executeMingChaQiuHao(props.currentPlayer, getTargetPlayer()),

  // 城市专属非战斗技能
  '孔孟故里': () => executeCitySkill(handleJiningSkill, '济宁市'),
  '舟山海鲜': () => executeCitySkill(handleZhoushanSkill, '舟山市')
}

// 辅助函数
function getTargetPlayer() {
  return opponents.value.find(p => p.name === targetPlayer.value)
}

function getSelfCityObject() {
  return props.currentPlayer.cities[selfCity.value]
}

function getTargetCityObject() {
  const target = getTargetPlayer()
  return target?.cities[targetCity.value]
}

// 执行城市专属技能（作为非战斗技能使用）
function executeCitySkill(skillHandler, cityName) {
  const skillData = {
    cityName: cityName,
    skillName: selectedSkill.value.name
  }

  // 调用城市技能处理函数，传入选中的城市索引
  skillHandler(
    props.currentPlayer,
    skillData,
    gameStore.addLog,
    gameStore,
    selectedSelfCities.value
  )

  return { success: true }
}

function executeSkill() {
  if (!canExecuteSkill()) {
    console.log('[SkillSelector] 无法执行技能 - 参数不完整')
    console.log('[SkillSelector] requiresTarget:', selectedSkill.value?.requiresTarget, 'targetPlayer:', targetPlayer.value)
    console.log('[SkillSelector] requiresTargetCity:', selectedSkill.value?.requiresTargetCity, 'targetCity:', targetCity.value)
    console.log('[SkillSelector] requiresSelfCity:', selectedSkill.value?.requiresSelfCity, 'selfCity:', selfCity.value)
    return
  }

  const skill = selectedSkill.value
  let result

  try {
    console.log('[SkillSelector] 执行技能:', skill.name)
    console.log('[SkillSelector] 目标玩家:', targetPlayer.value)
    console.log('[SkillSelector] 目标城市:', targetCity.value)
    console.log('[SkillSelector] 自己城市:', selfCity.value)
    console.log('[SkillSelector] 数量:', amount.value)

    // 使用映射表执行技能
    const executor = SKILL_EXECUTOR_MAP[skill.name]
    if (executor) {
      result = executor()
      console.log('[SkillSelector] 技能执行结果:', result)
    } else {
      result = { success: false, message: `技能 "${skill.name}" 尚未实现` }
      console.warn('[SkillSelector] 技能未实现:', skill.name)
    }

    if (result.success) {
      emit('skill-used', { skill: skill.name, result })
      selectedSkill.value = null

      // 重置参数
      targetPlayer.value = ''
      targetCity.value = ''
      selfCity.value = ''
      amount.value = 0
    } else {
      emit('skill-failed', { skill: skill.name, result })
    }
  } catch (error) {
    console.error('[SkillSelector] 技能执行错误:', error)
    emit('skill-failed', { skill: skill.name, error: error.message })
  }
}
</script>

<style scoped>
.skill-selector {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 8px;
}

.skill-header {
  margin-bottom: 20px;
}

.skill-header h3 {
  margin: 0 0 15px 0;
  font-size: 24px;
  color: #333;
}

.skill-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  border-color: #4CAF50;
  background: #f0f8f0;
}

.filter-btn.active {
  background: #4CAF50;
  color: white;
  border-color: #4CAF50;
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.skill-card {
  display: flex;
  gap: 12px;
  padding: 15px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.skill-card:hover:not(.disabled) {
  border-color: #4CAF50;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.skill-card.selected {
  border-color: #4CAF50;
  background: #f0f8f0;
}

.skill-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.skill-info {
  flex: 1;
}

.skill-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
  color: #333;
}

.skill-cost {
  font-size: 14px;
  color: #f57c00;
  margin-bottom: 8px;
}

.gold-icon {
  margin-right: 4px;
}

.skill-description {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.skill-usage {
  font-size: 12px;
  color: #2196F3;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.usage-label {
  font-weight: 600;
}

.usage-count {
  background: #E3F2FD;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: bold;
}

.skill-cooldown-active {
  font-size: 12px;
  color: #f44336;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #FFEBEE;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.cooldown-icon {
  font-size: 14px;
}

.cooldown-text {
  flex: 1;
}

.skill-cooldown-ready {
  font-size: 12px;
  color: #4CAF50;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #E8F5E9;
  padding: 4px 8px;
  border-radius: 12px;
  font-weight: 600;
}

.ready-icon {
  font-size: 14px;
}

.ready-text {
  flex: 1;
}

.skill-cooldown, .skill-limit {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.skill-detail {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #4CAF50;
}

.skill-detail h4 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #4CAF50;
}

.detail-description {
  color: #666;
  margin-bottom: 20px;
}

.skill-params {
  margin-bottom: 20px;
}

.param-group {
  margin-bottom: 15px;
}

.param-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.param-group select,
.param-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.skill-actions {
  display: flex;
  gap: 10px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* 多城市选择样式 */
.city-multi-select {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  background: #f9f9f9;
  border-radius: 6px;
}

.city-checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.city-checkbox-item:hover:not(.disabled) {
  border-color: #4CAF50;
  background: #f0fdf4;
}

.city-checkbox-item.selected {
  border-color: #4CAF50;
  background: #dcfce7;
}

.city-checkbox-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.city-checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.city-checkbox-item.disabled input[type="checkbox"] {
  cursor: not-allowed;
}

.city-checkbox-label {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.hint-text {
  font-size: 12px;
  color: #666;
  font-style: italic;
  margin-top: 6px;
}
</style>
