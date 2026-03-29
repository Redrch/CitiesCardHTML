<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h2>游戏介绍</h2>
        <button class="close-btn" @click="close">关闭</button>
      </div>

      <div class="modal-body">
        <!-- 导航标签 -->
        <div class="tab-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            <span>{{ tab.name }}</span>
          </button>
        </div>

        <!-- 二人局规则 -->
        <div v-if="activeTab === '2p'" class="section">
          <h3 class="section-title">二人局游戏规则</h3>
          <div class="rule-list">
            <div class="rule-item" v-for="(rule, i) in rules2p" :key="i">
              <span class="rule-num">{{ i + 1 }}</span>
              <span class="rule-text" v-html="rule"></span>
            </div>
          </div>

          <h3 class="section-title" style="margin-top: 24px;">特殊规则</h3>
          <div class="rule-list">
            <div class="rule-item special" v-for="(rule, i) in specialRules" :key="'s'+i">
              <span class="rule-num special-num">{{ ['①','②','③','④','⑤','⑥'][i] }}</span>
              <span class="rule-text">{{ rule }}</span>
            </div>
          </div>

          <h3 class="section-title" style="margin-top: 24px;">技能花费与使用说明</h3>
          <div class="rule-list">
            <div class="rule-item" v-for="(rule, i) in skillUsageRules" :key="'u'+i">
              <span class="rule-num">{{ i + 1 }}</span>
              <span class="rule-text" v-html="rule"></span>
            </div>
          </div>

          <h3 class="section-title" style="margin-top: 24px;">谨慎交换集合</h3>
          <div class="info-box">
            中心城市（2P/2V2）和已阵亡的城市默认加入谨慎交换集合，部分技能可以使城市加入谨慎交换集合，除归顺外，谨慎交换集合中的城市无法被任何交换城市技能选中。
          </div>

        </div>

        <!-- 三人局规则 -->
        <div v-if="activeTab === '3p'" class="section">
          <h3 class="section-title">三人局游戏规则</h3>
          <div class="info-box" style="margin-bottom: 16px;">其他规则同二人局</div>
          <div class="rule-list">
            <div class="rule-item" v-for="(rule, i) in rules3p" :key="i">
              <span class="rule-num">{{ i + 1 }}</span>
              <span class="rule-text">{{ rule }}</span>
            </div>
          </div>

          <h3 class="section-title" style="margin-top: 24px;">三人局专属技能</h3>
          <div class="rule-list">
            <div class="skill-item" v-for="skill in skills3p" :key="skill.name">
              <div class="skill-header-row">
                <span class="skill-name-tag">{{ skill.name }}</span>
                <span class="skill-cost-tag">{{ skill.cost }}金币</span>
              </div>
              <div class="skill-desc">{{ skill.desc }}</div>
            </div>
          </div>
        </div>

        <!-- 2v2规则 -->
        <div v-if="activeTab === '2v2'" class="section">
          <h3 class="section-title">2v2局游戏规则</h3>
          <div class="info-box" style="margin-bottom: 16px;">其他规则同二人局</div>
          <div class="rule-list">
            <div class="rule-item" v-for="(rule, i) in rules2v2" :key="i">
              <span class="rule-num">{{ i + 1 }}</span>
              <span class="rule-text">{{ rule }}</span>
            </div>
          </div>

          <h3 class="section-title" style="margin-top: 24px;">2v2特殊规则</h3>
          <div class="rule-list">
            <div class="rule-item special" v-for="(rule, i) in special2v2" :key="'s'+i">
              <span class="rule-num special-num">{{ ['①','②','③','④'][i] }}</span>
              <span class="rule-text">{{ rule }}</span>
            </div>
          </div>

          <h3 class="section-title" style="margin-top: 24px;">2v2专属技能</h3>
          <div class="rule-list">
            <div class="skill-item" v-for="skill in skills2v2" :key="skill.name">
              <div class="skill-header-row">
                <span class="skill-name-tag">{{ skill.name }}</span>
                <span class="skill-cost-tag">{{ skill.cost }}金币</span>
              </div>
              <div class="skill-desc">{{ skill.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
const activeTab = ref('2p')

const tabs = [
  { id: '2p', name: '二人局', icon: '👥' },
  { id: '3p', name: '三人局（待上线）', icon: '👥👤' },
  { id: '2v2', name: '2v2局（待上线）', icon: '⚔️' }
]

const rules2p = [
  '每人初始获得10座城市（10张牌），选定一座中心城市，选定中心城市后不可更换（除非使用相关技能）',
  '每人每回合可以派出1-3座城市出战',
  '出战时伤害优先叠加到HP最低的城市，扣除对应HP',
  '当一方中心城市HP归零则淘汰，另一方获胜'
]

const specialRules = [
  '中心出战攻击力翻倍（HP不变）',
  '连续两回合出战相同城市，该城市进入疲劳状态，HP减半',
  '同省（自治区）城市相遇，双方所有出战城市撤回',
  '城市遇到本省（自治区）省会（首府）直接归顺，双方所有出战城市撤回',
  '对牌不满意可重新抽牌（最多5次），抽新牌后旧牌作废',
]

const skillUsageRules = [
  '每人初始2金币，每回合自动获得3金币，上限24金币；使用技能花费金币',
  '相同轮次技能总花费需小于20金币（单用20金币及以上技能除外）',
  '一般城市HP，上限80000；初始HP30000以上，上限100000，部分神秘技能可突破上限',
  '所有技能原则上按使用金币数量从高到低顺序生效，但部分技能有例外',
  '单回合禁止使用超过一个战斗金币技能。<br><span style="color:#94a3b8;font-size:12px;">战斗金币技能包括：按兵不动、擒贼擒王、声东击西、草木皆兵、吸引攻击、越战越勇、既来则安、铜墙铁壁、玉碎瓦全、料事如神、暗度陈仓、背水一战、同归于尽、御驾亲征、欲擒故纵、草船借箭、狂暴模式、以逸待劳、趁火打劫、晕头转向、隔岸观火、挑拨离间、围魏救赵、设置屏障、潜能激发</span>',
  '为维护良好的游戏氛围，禁止玩家之间私信交流'
]

const rules3p = [
  '三人围三角形，每人有2条线路',
  '每局最多在2个方向各出战2座城市，最少各出战1座城市',
  '若只剩一座城市，可选定一个方向不出战',
  '一方所有城市被淘汰后，该玩家淘汰，剩余两人继续二人局（二人局最多出战2座城市）',
  '为维护良好的游戏氛围，禁止玩家之间私信交流'
]

const skills3p = [
  { name: '声东击西', cost: 3, desc: '三人局中，若一个方向打不过，则转向攻击另一个方向。无使用限制' },
  { name: '按兵不动（3P专属）', cost: 4, desc: '本回合己方在一个方向不出战。冷却3回合' },
  { name: '暗度陈仓', cost: 6, desc: '三人局中，本回合多出战一座城市攻击另外两方，伤害平分并无伤返回。要求己方城市数大于等于3，冷却3回合' },
  { name: '合纵连横', cost: 7, desc: '三人局中，与一名玩家停战两回合，共同攻击第三方。每局限1次' },
  { name: '隔岸观火', cost: 10, desc: '三人局中，本回合己方不出战，其他玩家相互开战，向己方出战的城市加入战斗。每回合先使用者生效，每局限1次' }
]

const rules2v2 = [
  '四人随机分两队，每队2人。',
  '出战规则同二人局，每回合同队出战叠加与对手战斗',
  '一方中心阵亡后，剩余金币可赠队友（城市不可赠）'
]

const special2v2 = [
  '技能共享：队友使用城市预言技能时，队伍内共享信息',
  '金币赠送：每次至少赠8金币',
  '城市赠送：队友可互赠城市，每局不超过2个',
  '商讨战术：队友之间可私信交流'
]

const skills2v2 = [
  { name: '挑拨离间', cost: 10, desc: '2v2局中，本回合己方不出战，使对方队友相互开战。每局限1次' }
]

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
  background: rgba(30, 41, 59, 0.35);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: linear-gradient(135deg, #ffffff 0%, #f5f7fc 100%);
  margin: 20px;
  max-width: 800px;
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(100, 116, 145, 0.18);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border: 2px solid rgba(59, 130, 246, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 2px solid rgba(209, 217, 230, 0.7);
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  color: #1e293b;
}

.close-btn {
  background: rgba(59, 130, 246, 0.08);
  border: 1px solid rgba(209, 217, 230, 0.7);
  color: #334155;
  padding: 8px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.close-btn:hover {
  background: rgba(59, 130, 246, 0.12);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

/* 标签导航 */
.tab-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: rgba(59, 130, 246, 0.06);
  border-radius: 12px;
  padding: 6px;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  background: transparent;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-btn:hover {
  color: #334155;
  background: rgba(59, 130, 246, 0.08);
}

.tab-btn.active {
  color: white;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.tab-icon {
  font-size: 16px;
}

/* 章节标题 */
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #60a5fa;
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(59, 130, 246, 0.2);
}

/* 规则列表 */
.rule-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 10px 14px;
  background: rgba(59, 130, 246, 0.04);
  border-radius: 10px;
  border: 1px solid rgba(209, 217, 230, 0.5);
}

.rule-num {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
}

.special-num {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  width: auto;
  padding: 0 6px;
  font-size: 14px;
}

.rule-text {
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

/* 信息框 */
.info-box {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 10px;
  padding: 14px 18px;
  color: #3b82f6;
  font-size: 14px;
  line-height: 1.6;
}

/* 技能卡片 */
.skill-item {
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.04);
  border-radius: 10px;
  border: 1px solid rgba(209, 217, 230, 0.5);
}

.skill-header-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.skill-name-tag {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
}

.skill-cost-tag {
  background: rgba(245, 158, 11, 0.2);
  color: #d97706;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.skill-desc {
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

/* 响应式 */
@media (max-width: 640px) {
  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-body {
    padding: 16px;
  }

  .tab-btn {
    padding: 8px 10px;
    font-size: 12px;
  }

  .tab-icon {
    display: none;
  }
}
</style>
