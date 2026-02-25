<template>
  <Teleport to="body">
    <div v-if="show" class="skill-effect-overlay" :class="animationType">
      <div class="effect-container">
        <div class="effect-icon" :class="animationType + '-icon'">{{ icon }}</div>
        <div class="skill-label">{{ skillName }}</div>

        <!-- 1. 定海神针 dinghai: golden needle drops from top, ripple lock rings -->
        <template v-if="animationType === 'dinghai'">
          <div class="dinghai-needle"></div>
          <div v-for="n in 3" :key="'dr-'+n" class="dinghai-ring" :class="'dr-'+n"></div>
          <div class="dinghai-lock">🔒</div>
        </template>

        <!-- 2. 先声夺人 xiansheng: two cards swap sides -->
        <template v-if="animationType === 'xiansheng'">
          <div class="xiansheng-card xiansheng-left">🃏</div>
          <div class="xiansheng-card xiansheng-right">🃏</div>
          <div class="xiansheng-arrows">⇄</div>
        </template>

        <!-- 3. 金币贷款 daikuan: vault opens, coins fly out, then a lock timer -->
        <template v-if="animationType === 'daikuan'">
          <div v-for="n in 5" :key="'dk-'+n" class="daikuan-coin" :style="daikuanStyle(n)">🪙</div>
          <div class="daikuan-vault">🏦</div>
          <div class="daikuan-timer">⏳</div>
        </template>

        <!-- 4. 无知无畏 wuzhi: small city rushes toward center & explodes -->
        <template v-if="animationType === 'wuzhi'">
          <div class="wuzhi-city">🏙️</div>
          <div class="wuzhi-target">🎯</div>
          <div class="wuzhi-explosion">💥</div>
          <div v-for="n in 6" :key="'wz-'+n" class="wuzhi-debris" :class="'wd-'+n"></div>
        </template>

        <!-- 5. 按兵不动 anbing: shield dome + sleeping zz -->
        <template v-if="animationType === 'anbing'">
          <div class="anbing-dome"></div>
          <div class="anbing-zz anbing-z1">Z</div>
          <div class="anbing-zz anbing-z2">Z</div>
          <div class="anbing-zz anbing-z3">Z</div>
        </template>

        <!-- 6. 抛砖引玉 paozhuan: brick flies, shatters into diamonds -->
        <template v-if="animationType === 'paozhuan'">
          <div class="paozhuan-brick">🧱</div>
          <div v-for="n in 5" :key="'pz-'+n" class="paozhuan-gem" :class="'pg-'+n">💎</div>
          <div v-for="n in 3" :key="'pc-'+n" class="paozhuan-coin" :class="'pzc-'+n">🪙</div>
        </template>

        <!-- 7. 草木皆兵 caomu: vines/leaves grow and entangle -->
        <template v-if="animationType === 'caomu'">
          <div v-for="n in 8" :key="'cm-'+n" class="caomu-leaf" :class="'cl-'+n">🍃</div>
          <div class="caomu-web"></div>
        </template>

        <!-- 8. 快速治疗 kuaisuzhiliao: green cross pulse + healing sparkles -->
        <template v-if="animationType === 'kuaisuzhiliao'">
          <div class="kuaisu-cross">✚</div>
          <div v-for="n in 8" :key="'ks-'+n" class="kuaisu-sparkle" :style="healSparkleStyle(n)">✦</div>
        </template>

        <!-- 9. 高级治疗 gaojizhiliao: two cities float up into healing cocoon -->
        <template v-if="animationType === 'gaojizhiliao'">
          <div class="gaoji-city gaoji-c1">🏙️</div>
          <div class="gaoji-city gaoji-c2">🏙️</div>
          <div class="gaoji-cocoon"></div>
          <div class="gaoji-timer">2⏳</div>
        </template>

        <!-- 10. 借尸还魂 jieshi: tombstone cracks, ghost rises -->
        <template v-if="animationType === 'jieshi'">
          <div class="jieshi-tomb">🪦</div>
          <div class="jieshi-crack"></div>
          <div class="jieshi-ghost">👻</div>
          <div v-for="n in 6" :key="'js-'+n" class="jieshi-soul" :style="soulStyle(n)"></div>
        </template>

        <!-- 11. 吸引攻击 xiyin: magnet pulls arrows inward -->
        <template v-if="animationType === 'xiyin'">
          <div class="xiyin-magnet">🧲</div>
          <div v-for="n in 6" :key="'xy-'+n" class="xiyin-arrow" :class="'xa-'+n">→</div>
        </template>

        <!-- 12. 众志成城 zhongzhi: multiple HP bars merge into one -->
        <template v-if="animationType === 'zhongzhi'">
          <div v-for="n in 4" :key="'zz-'+n" class="zhongzhi-bar" :class="'zb-'+n"></div>
          <div class="zhongzhi-merge">⚖️</div>
        </template>

        <!-- 13. 实力增强 shili: flexing arm, HP bar doubles with glow -->
        <template v-if="animationType === 'shili'">
          <div class="shili-bar">
            <div class="shili-fill"></div>
          </div>
          <div class="shili-x2">×2</div>
          <div v-for="n in 6" :key="'sl-'+n" class="shili-spark" :style="sparkStyle(n)"></div>
        </template>

        <!-- 14. 无中生有 wuzhong: empty space, then a city materializes -->
        <template v-if="animationType === 'wuzhong'">
          <div class="wuzhong-void">？</div>
          <div class="wuzhong-city">🏙️</div>
          <div v-for="n in 8" :key="'wz-'+n" class="wuzhong-star" :style="matStyle(n)">✦</div>
        </template>

        <!-- 15. 劫富济贫 jiefu: balance scale tilting, HP flows -->
        <template v-if="animationType === 'jiefu'">
          <div class="jiefu-scale">⚖️</div>
          <div class="jiefu-rich">👑</div>
          <div class="jiefu-poor">🏚️</div>
          <div v-for="n in 4" :key="'jf-'+n" class="jiefu-flow" :class="'jff-'+n"></div>
        </template>

        <!-- 16. 城市预言 yuyan: crystal ball with eye scan -->
        <template v-if="animationType === 'yuyan'">
          <div class="yuyan-ball">🔮</div>
          <div class="yuyan-scan"></div>
          <div v-for="n in 4" :key="'yy-'+n" class="yuyan-city" :class="'yc-'+n">🏙️</div>
          <div class="yuyan-eye">👁️</div>
        </template>

        <!-- 17. 博学多才 boxue: book opens, question marks fly -->
        <template v-if="animationType === 'boxue'">
          <div class="boxue-book">📖</div>
          <div v-for="n in 4" :key="'bx-'+n" class="boxue-q" :class="'bq-'+n">❓</div>
          <div class="boxue-star">⭐</div>
        </template>

        <!-- 18. 守望相助 shouwang: shield link between two cities -->
        <template v-if="animationType === 'shouwang'">
          <div class="shouwang-city1">🏙️</div>
          <div class="shouwang-city2">🪦</div>
          <div class="shouwang-link"></div>
          <div class="shouwang-heart">💗</div>
        </template>

        <!-- 19. 点石成金 dianshi: stone transforms into gold city -->
        <template v-if="animationType === 'dianshi'">
          <div class="dianshi-stone">🪨</div>
          <div class="dianshi-gold">🏙️</div>
          <div class="dianshi-sparkle">✨</div>
          <div v-for="n in 6" :key="'ds-'+n" class="dianshi-particle" :style="goldParticleStyle(n)"></div>
        </template>

        <!-- 20. 一落千丈 yiluo: city plummets downward, HP number shrinks -->
        <template v-if="animationType === 'yiluo'">
          <div class="yiluo-city">🏙️</div>
          <div class="yiluo-arrow">⬇️</div>
          <div class="yiluo-divide">÷3</div>
          <div v-for="n in 4" :key="'yl-'+n" class="yiluo-crack" :class="'yc-'+n"></div>
        </template>

        <!-- 21. 连续打击 lianxu: double fist punch -->
        <template v-if="animationType === 'lianxu'">
          <div class="lianxu-fist lianxu-f1">👊</div>
          <div class="lianxu-fist lianxu-f2">👊</div>
          <div class="lianxu-impact lianxu-i1">💥</div>
          <div class="lianxu-impact lianxu-i2">💥</div>
          <div class="lianxu-divide">÷2</div>
        </template>

        <!-- 22. 横扫一空 hengsao: tornado sweeps across, skills scatter -->
        <template v-if="animationType === 'hengsao'">
          <div class="hengsao-tornado">🌪️</div>
          <div v-for="n in 5" :key="'hs-'+n" class="hengsao-skill" :class="'hss-'+n">⭐</div>
        </template>

        <!-- 23. 万箭齐发 wanjian: rain of arrows from top -->
        <template v-if="animationType === 'wanjian'">
          <div v-for="n in 12" :key="'wj-'+n" class="wanjian-arrow" :style="arrowStyle(n)">🏹</div>
          <div class="wanjian-target">🎯</div>
        </template>

        <!-- 24. 士气大振 shiqi: rally flag + all HP bars fill -->
        <template v-if="animationType === 'shiqi'">
          <div class="shiqi-flag">🚩</div>
          <div v-for="n in 5" :key="'sq-'+n" class="shiqi-bar" :class="'sqb-'+n">
            <div class="shiqi-fill"></div>
          </div>
          <div v-for="n in 6" :key="'sqp-'+n" class="shiqi-cheer" :style="cheerStyle(n)">🎉</div>
        </template>

        <!-- 25. 电磁感应 dianci: lightning chains between 3 cities -->
        <template v-if="animationType === 'dianci'">
          <div class="dianci-city dianci-c1">🏙️</div>
          <div class="dianci-city dianci-c2">🏙️</div>
          <div class="dianci-city dianci-c3">🏙️</div>
          <div class="dianci-bolt dianci-b1">⚡</div>
          <div class="dianci-bolt dianci-b2">⚡</div>
          <div class="dianci-bolt dianci-b3">⚡</div>
        </template>

        <!-- 26. 战略转移 zhanlve: crown moves from one city to another -->
        <template v-if="animationType === 'zhanlve'">
          <div class="zhanlve-old">🏙️</div>
          <div class="zhanlve-new">🏙️</div>
          <div class="zhanlve-crown">👑</div>
          <div class="zhanlve-plus">+50%</div>
        </template>

        <!-- 27. 自相残杀 zixiang: two swords clash -->
        <template v-if="animationType === 'zixiang'">
          <div class="zixiang-sword zixiang-s1">⚔️</div>
          <div class="zixiang-sword zixiang-s2">⚔️</div>
          <div class="zixiang-clash">💥</div>
          <div class="zixiang-skull">💀</div>
        </template>

        <!-- 28. 趁其不备·随机 chenqi_rand: hand grabs random city -->
        <template v-if="animationType === 'chenqi_rand'">
          <div class="chenqi-hand">🤚</div>
          <div class="chenqi-city">🏙️</div>
          <div class="chenqi-dice">🎲</div>
          <div class="chenqi-grab">✊</div>
        </template>

        <!-- 29. 搬运救兵 banyun: truck brings 2 cities -->
        <template v-if="animationType === 'banyun'">
          <div class="banyun-truck">🚛</div>
          <div class="banyun-city banyun-bc1">🏙️</div>
          <div class="banyun-city banyun-bc2">🏙️</div>
          <div class="banyun-flag">🏳️</div>
        </template>

        <!-- 30. 中庸之道 zhongyong: yin-yang spinning, numbers transform -->
        <template v-if="animationType === 'zhongyong'">
          <div class="zhongyong-yinyang">☯️</div>
          <div class="zhongyong-sqrt">√×100</div>
          <div class="zhongyong-up">📈</div>
          <div class="zhongyong-down">📉</div>
        </template>

        <!-- 31. 强制转移·普通 qiangzhi_pu: crown shattered -->
        <template v-if="animationType === 'qiangzhi_pu'">
          <div class="qiangzhi-crown">👑</div>
          <div class="qiangzhi-smash">💥</div>
          <div v-for="n in 5" :key="'qz-'+n" class="qiangzhi-shard" :class="'qs-'+n">✦</div>
        </template>

        <!-- 32. 趁其不备·指定 chenqi_pick: crosshair locks onto city -->
        <template v-if="animationType === 'chenqi_pick'">
          <div class="chenqi-scope">⊕</div>
          <div class="chenqi-p-city">🏙️</div>
          <div class="chenqi-p-hand">✊</div>
          <div class="chenqi-p-lock">🔒</div>
        </template>

        <!-- 33. 行政中心 xingzheng: government building radiates, cities glow ×3 -->
        <template v-if="animationType === 'xingzheng'">
          <div class="xingzheng-building">🏛️</div>
          <div v-for="n in 4" :key="'xz-'+n" class="xingzheng-beam" :class="'xzb-'+n"></div>
          <div class="xingzheng-x3">×3</div>
        </template>

        <!-- 34. 计划单列 jihua: clipboard spawns HP bars rising -->
        <template v-if="animationType === 'jihua'">
          <div class="jihua-clip">📋</div>
          <div v-for="n in 5" :key="'jh-'+n" class="jihua-bar" :class="'jhb-'+n">
            <div class="jihua-fill"></div>
          </div>
          <div class="jihua-check">✅</div>
        </template>

        <!-- 35. 设置屏障 pingzhang: hexagonal shield assembles -->
        <template v-if="animationType === 'pingzhang'">
          <div v-for="n in 6" :key="'pz-'+n" class="pingzhang-hex" :class="'ph-'+n"></div>
          <div class="pingzhang-hp">25000</div>
          <div class="pingzhang-reflect">↩️</div>
        </template>

        <!-- 36. 生于紫室 zishi: purple aura crowning, stealth effect -->
        <template v-if="animationType === 'zishi'">
          <div class="zishi-aura"></div>
          <div class="zishi-crown">👑</div>
          <div class="zishi-x2">×2</div>
          <div v-for="n in 8" :key="'zs-'+n" class="zishi-star" :style="purpleStarStyle(n)">✦</div>
          <div class="zishi-stealth">🫥</div>
        </template>

        <!-- 37. 强制转移·高级 qiangzhi_gao: crown shattered + finger picks new -->
        <template v-if="animationType === 'qiangzhi_gao'">
          <div class="qgao-crown">👑</div>
          <div class="qgao-fire">🔥</div>
          <div class="qgao-finger">👆</div>
          <div v-for="n in 4" :key="'qg-'+n" class="qgao-ember" :class="'qge-'+n"></div>
        </template>

        <!-- 38. 四面楚歌 simian: musical notes surround, cities absorbed -->
        <template v-if="animationType === 'simian'">
          <div v-for="n in 8" :key="'sm-'+n" class="simian-note" :class="'sn-'+n">🎵</div>
          <div class="simian-vortex"></div>
          <div v-for="n in 3" :key="'sc-'+n" class="simian-city" :class="'smc-'+n">🏙️</div>
        </template>

        <!-- 39. 事半功倍 shiban: red X stamp on a skill -->
        <template v-if="animationType === 'shiban'">
          <div class="shiban-skill">⭐</div>
          <div class="shiban-stamp">🚫</div>
          <div class="shiban-chain">⛓️</div>
        </template>

        <!-- 40. 解除封锁 jiechu: chains break apart -->
        <template v-if="animationType === 'jiechu'">
          <div class="jiechu-chain jiechu-l">⛓️</div>
          <div class="jiechu-chain jiechu-r">⛓️</div>
          <div class="jiechu-burst">💥</div>
          <div class="jiechu-free">🕊️</div>
        </template>

        <!-- 41. 技能保护 jineng: shield dome over skill icons -->
        <template v-if="animationType === 'jineng'">
          <div class="jineng-dome"></div>
          <div class="jineng-inner">🛡️</div>
          <div v-for="n in 3" :key="'jn-'+n" class="jineng-wave" :class="'jnw-'+n"></div>
          <div class="jineng-10">10回合</div>
        </template>

        <!-- 42. 一触即发 yichu: frozen clock shatters -->
        <template v-if="animationType === 'yichu'">
          <div class="yichu-clock">⏰</div>
          <div class="yichu-bolt">⚡</div>
          <div class="yichu-shatter">💥</div>
          <div class="yichu-zero">0</div>
        </template>

        <!-- 43. 突破瓶颈 tupo: bottle neck cracks, rocket flies -->
        <template v-if="animationType === 'tupo'">
          <div class="tupo-bottle">🍾</div>
          <div class="tupo-crack">💥</div>
          <div class="tupo-rocket">🚀</div>
          <div class="tupo-plus">+1</div>
        </template>

        <!-- Default fallback -->
        <template v-if="animationType === 'default'">
          <div v-for="n in 6" :key="'df-'+n" class="default-sparkle" :style="defaultSparkleStyle(n)">✦</div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { watch, onUnmounted } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  skillName: { type: String, default: '' },
  animationType: { type: String, default: 'default' },
  icon: { type: String, default: '✨' },
  duration: { type: Number, default: 2000 }
})

const emit = defineEmits(['complete'])

let timer = null

watch(() => props.show, (val) => {
  if (val) {
    clearTimeout(timer)
    timer = setTimeout(() => emit('complete'), props.duration)
  }
})

onUnmounted(() => clearTimeout(timer))

function daikuanStyle(n) {
  return { left: (20 + n * 12) + '%', animationDelay: (n * 0.15) + 's' }
}
function healSparkleStyle(n) {
  const x = 15 + (n * 10)
  return { left: x + '%', animationDelay: (n * 0.12) + 's' }
}
function soulStyle(n) {
  const x = 20 + (n * 10)
  return { left: x + '%', animationDelay: (n * 0.2) + 's' }
}
function goldParticleStyle(n) {
  const x = 25 + (n * 9)
  return { left: x + '%', animationDelay: (n * 0.13) + 's' }
}
function sparkStyle(n) {
  const x = 15 + (n * 12)
  return { left: x + '%', animationDelay: (n * 0.1) + 's' }
}
function matStyle(n) {
  const x = 15 + (n * 9)
  return { left: x + '%', animationDelay: (n * 0.1) + 's' }
}
function arrowStyle(n) {
  const x = 5 + (n * 7.5)
  return { left: x + '%', animationDelay: (n * 0.08) + 's' }
}
function cheerStyle(n) {
  const x = 10 + (n * 14)
  return { left: x + '%', animationDelay: (n * 0.15) + 's' }
}
function purpleStarStyle(n) {
  const x = 10 + (n * 10)
  return { left: x + '%', animationDelay: (n * 0.12) + 's' }
}
function defaultSparkleStyle(n) {
  const x = 15 + (n * 12)
  return { left: x + '%', animationDelay: (n * 0.15) + 's' }
}
</script>

<style scoped>
/* ===== Base overlay ===== */
.skill-effect-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  z-index: 10000; display: flex; align-items: center; justify-content: center;
  animation: overlayIn 0.3s ease; pointer-events: none;
}
@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

.effect-container {
  position: relative; width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  overflow: hidden;
}

.effect-icon { font-size: 72px; z-index: 10; animation: iconPop 0.5s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes iconPop { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.3)} 100%{transform:scale(1);opacity:1} }

.skill-label {
  font-size: 26px; font-weight: bold; color: #fff; margin-top: 10px; z-index: 10;
  text-shadow: 0 2px 10px rgba(0,0,0,0.6); animation: labelUp 0.5s ease 0.2s both;
}
@keyframes labelUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

/* ===== 1. 定海神针 dinghai ===== */
.dinghai { background: radial-gradient(circle, rgba(234,179,8,0.85) 0%, rgba(0,0,0,0.92) 70%); }
.dinghai-needle {
  position: absolute; top: -80px; left: 50%; width: 6px; height: 200px; transform: translateX(-50%);
  background: linear-gradient(180deg, #fbbf24, #b45309); border-radius: 3px;
  animation: needleDrop 0.6s ease 0.3s both; z-index: 5;
}
@keyframes needleDrop { from{top:-200px;opacity:0} to{top:calc(50% - 100px);opacity:1} }
.dinghai-ring {
  position: absolute; top: 50%; left: 50%; width: 80px; height: 80px;
  border: 3px solid rgba(251,191,36,0.7); border-radius: 50%;
  transform: translate(-50%,-50%) scale(0); opacity: 0;
}
.dr-1 { animation: ringExpand 1s ease 0.8s forwards; }
.dr-2 { animation: ringExpand 1s ease 1s forwards; }
.dr-3 { animation: ringExpand 1s ease 1.2s forwards; }
@keyframes ringExpand { 0%{transform:translate(-50%,-50%) scale(0);opacity:1} 100%{transform:translate(-50%,-50%) scale(4);opacity:0} }
.dinghai-lock {
  position: absolute; bottom: 25%; font-size: 40px; opacity: 0;
  animation: lockAppear 0.5s ease 1.2s both;
}
@keyframes lockAppear { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }

/* ===== 2. 先声夺人 xiansheng ===== */
.xiansheng { background: radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.xiansheng-card {
  position: absolute; top: 50%; font-size: 56px; transform: translateY(-50%);
}
.xiansheng-left { left: 15%; animation: swapL 1.2s ease 0.4s both; }
.xiansheng-right { right: 15%; animation: swapR 1.2s ease 0.4s both; }
@keyframes swapL { 0%{left:15%} 50%{left:50%;transform:translateY(-50%) scale(0.8)} 100%{left:75%} }
@keyframes swapR { 0%{right:15%} 50%{right:50%;transform:translateY(-50%) scale(0.8)} 100%{right:75%} }
.xiansheng-arrows {
  position: absolute; top: 38%; font-size: 48px; color: #c4b5fd;
  animation: arrowPulse 1s ease infinite; z-index: 5;
}
@keyframes arrowPulse { 0%,100%{opacity:0.5;transform:scaleX(1)} 50%{opacity:1;transform:scaleX(1.3)} }

/* ===== 3. 金币贷款 daikuan ===== */
.daikuan { background: radial-gradient(circle, rgba(217,119,6,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.daikuan-coin {
  position: absolute; top: 30%; font-size: 32px; opacity: 0;
  animation: coinBurst 1s ease forwards;
}
@keyframes coinBurst { 0%{opacity:0;transform:scale(0)} 40%{opacity:1;transform:scale(1.2)} 100%{opacity:0;transform:translateY(40vh) rotate(360deg)} }
.daikuan-vault {
  position: absolute; top: 20%; font-size: 56px; animation: vaultOpen 0.8s ease 0.2s both;
}
@keyframes vaultOpen { 0%{transform:scale(0) rotate(-20deg);opacity:0} 100%{transform:scale(1) rotate(0);opacity:1} }
.daikuan-timer {
  position: absolute; bottom: 20%; font-size: 48px; opacity: 0;
  animation: timerAppear 0.5s ease 1.2s both;
}
@keyframes timerAppear { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }

/* ===== 4. 无知无畏 wuzhi ===== */
.wuzhi { background: radial-gradient(circle, rgba(220,38,38,0.85) 0%, rgba(0,0,0,0.92) 70%); }
.wuzhi-city {
  position: absolute; left: 10%; top: 50%; font-size: 48px; transform: translateY(-50%);
  animation: cityRush 0.8s ease 0.3s both;
}
@keyframes cityRush { 0%{left:10%;opacity:1} 100%{left:50%;opacity:0;transform:translateY(-50%) scale(0.3)} }
.wuzhi-target {
  position: absolute; right: 20%; top: 40%; font-size: 56px; opacity: 0;
  animation: targetShow 0.5s ease 0.2s both;
}
@keyframes targetShow { from{opacity:0;transform:scale(2)} to{opacity:1;transform:scale(1)} }
.wuzhi-explosion {
  position: absolute; top: 50%; left: 50%; font-size: 72px; transform: translate(-50%,-50%);
  opacity: 0; animation: wuzhiBoom 0.5s ease 1s both;
}
@keyframes wuzhiBoom { 0%{opacity:0;transform:translate(-50%,-50%) scale(0)} 50%{opacity:1;transform:translate(-50%,-50%) scale(2)} 100%{opacity:0;transform:translate(-50%,-50%) scale(3)} }
.wuzhi-debris {
  position: absolute; top: 50%; left: 50%; width: 8px; height: 8px;
  background: #ef4444; border-radius: 50%; opacity: 0;
}
.wd-1{animation:debrisFly .8s ease 1.1s both;--dx:-60px;--dy:-80px}
.wd-2{animation:debrisFly .8s ease 1.15s both;--dx:70px;--dy:-50px}
.wd-3{animation:debrisFly .8s ease 1.2s both;--dx:-80px;--dy:40px}
.wd-4{animation:debrisFly .8s ease 1.25s both;--dx:60px;--dy:70px}
.wd-5{animation:debrisFly .8s ease 1.1s both;--dx:-30px;--dy:-90px}
.wd-6{animation:debrisFly .8s ease 1.15s both;--dx:90px;--dy:-20px}
@keyframes debrisFly { 0%{opacity:1;transform:translate(0,0)} 100%{opacity:0;transform:translate(var(--dx),var(--dy))} }

/* ===== 5. 按兵不动 anbing ===== */
.anbing { background: radial-gradient(circle, rgba(100,116,139,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.anbing-dome {
  position: absolute; top: 50%; left: 50%; width: 200px; height: 200px;
  transform: translate(-50%,-50%); border: 3px solid rgba(148,163,184,0.6);
  border-radius: 50%; animation: domeGrow 0.8s ease 0.3s both;
  background: radial-gradient(circle, rgba(148,163,184,0.1) 0%, transparent 70%);
}
@keyframes domeGrow { from{transform:translate(-50%,-50%) scale(0);opacity:0} to{transform:translate(-50%,-50%) scale(1);opacity:1} }
.anbing-zz {
  position: absolute; font-size: 32px; color: #94a3b8; font-weight: bold; opacity: 0;
}
.anbing-z1{top:30%;right:30%;animation:zzFloat 1.5s ease .8s infinite;font-size:24px}
.anbing-z2{top:22%;right:25%;animation:zzFloat 1.5s ease 1.1s infinite;font-size:32px}
.anbing-z3{top:14%;right:20%;animation:zzFloat 1.5s ease 1.4s infinite;font-size:40px}
@keyframes zzFloat { 0%{opacity:0;transform:translateY(0)} 50%{opacity:1} 100%{opacity:0;transform:translateY(-30px)} }

/* ===== 6. 抛砖引玉 paozhuan ===== */
.paozhuan { background: radial-gradient(circle, rgba(180,83,9,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.paozhuan-brick {
  position: absolute; left: 20%; top: 50%; font-size: 56px;
  animation: brickFly 0.8s ease 0.3s both;
}
@keyframes brickFly { 0%{left:20%;opacity:1;transform:rotate(0)} 100%{left:50%;opacity:0;transform:rotate(180deg) scale(0)} }
.paozhuan-gem {
  position: absolute; top: 50%; font-size: 28px; opacity: 0;
}
.pg-1{animation:gemBurst .8s ease .9s both;--gx:-50px;--gy:-60px}
.pg-2{animation:gemBurst .8s ease 1s both;--gx:40px;--gy:-40px}
.pg-3{animation:gemBurst .8s ease 1.1s both;--gx:-30px;--gy:50px}
.pg-4{animation:gemBurst .8s ease 1.2s both;--gx:60px;--gy:30px}
.pg-5{animation:gemBurst .8s ease 1s both;--gx:0;--gy:-70px}
@keyframes gemBurst { 0%{opacity:0;left:50%;transform:translate(0,0) scale(0)} 40%{opacity:1;transform:translate(0,0) scale(1.3)} 100%{opacity:0;transform:translate(var(--gx),var(--gy)) scale(0.5)} }
.paozhuan-coin {
  position: absolute; bottom: 25%; font-size: 32px; opacity: 0;
}
.pzc-1{left:40%;animation:pzCoinPop .6s ease 1.2s both}
.pzc-2{left:48%;animation:pzCoinPop .6s ease 1.35s both}
.pzc-3{left:56%;animation:pzCoinPop .6s ease 1.5s both}
@keyframes pzCoinPop { 0%{opacity:0;transform:scale(0)} 60%{opacity:1;transform:scale(1.3)} 100%{opacity:1;transform:scale(1)} }

/* ===== 7. 草木皆兵 caomu ===== */
.caomu { background: radial-gradient(circle, rgba(22,163,74,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.caomu-leaf {
  position: absolute; font-size: 28px; opacity: 0;
}
.cl-1{top:20%;left:10%;animation:leafGrow 1s ease .3s both;transform:rotate(30deg)}
.cl-2{top:30%;right:15%;animation:leafGrow 1s ease .45s both;transform:rotate(-20deg)}
.cl-3{top:60%;left:20%;animation:leafGrow 1s ease .6s both;transform:rotate(45deg)}
.cl-4{top:70%;right:10%;animation:leafGrow 1s ease .75s both;transform:rotate(-40deg)}
.cl-5{top:40%;left:5%;animation:leafGrow 1s ease .5s both;transform:rotate(15deg)}
.cl-6{bottom:20%;right:25%;animation:leafGrow 1s ease .65s both;transform:rotate(-30deg)}
.cl-7{top:15%;left:40%;animation:leafGrow 1s ease .4s both;transform:rotate(60deg)}
.cl-8{bottom:30%;left:35%;animation:leafGrow 1s ease .8s both;transform:rotate(-55deg)}
@keyframes leafGrow { 0%{opacity:0;transform:scale(0) rotate(0)} 50%{opacity:1} 100%{opacity:0.8;transform:scale(1.2) rotate(var(--r,30deg))} }
.caomu-web {
  position: absolute; top: 50%; left: 50%; width: 250px; height: 250px;
  transform: translate(-50%,-50%); border: 2px solid rgba(74,222,128,0.4);
  border-radius: 50%; animation: webExpand 1.5s ease .3s both;
  background: radial-gradient(circle, rgba(74,222,128,0.1), transparent);
}
@keyframes webExpand { 0%{transform:translate(-50%,-50%) scale(0);opacity:0} 100%{transform:translate(-50%,-50%) scale(1);opacity:0.6} }

/* ===== 8. 快速治疗 kuaisuzhiliao ===== */
.kuaisuzhiliao { background: radial-gradient(circle, rgba(16,185,129,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.kuaisu-cross {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  font-size: 100px; color: #34d399; z-index: 5;
  animation: crossPulse 1.2s ease infinite; text-shadow: 0 0 30px #34d399;
}
@keyframes crossPulse { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.8} 50%{transform:translate(-50%,-50%) scale(1.3);opacity:1} }
.kuaisu-sparkle {
  position: absolute; bottom: 0; font-size: 18px; color: #6ee7b7; opacity: 0;
  animation: healRise 1.8s ease infinite;
}
@keyframes healRise { 0%{opacity:0;transform:translateY(0)} 20%{opacity:1} 100%{opacity:0;transform:translateY(-100vh)} }

/* ===== 9. 高级治疗 gaojizhiliao ===== */
.gaojizhiliao { background: radial-gradient(circle, rgba(236,72,153,0.75) 0%, rgba(0,0,0,0.9) 70%); }
.gaoji-city { position: absolute; font-size: 40px; bottom: 30%; opacity: 0; }
.gaoji-c1 { left: 30%; animation: gaojiRise 1s ease .3s both; }
.gaoji-c2 { left: 58%; animation: gaojiRise 1s ease .5s both; }
@keyframes gaojiRise { 0%{opacity:0;bottom:30%} 100%{opacity:1;bottom:55%} }
.gaoji-cocoon {
  position: absolute; top: 25%; left: 50%; width: 180px; height: 120px;
  transform: translateX(-50%); border: 3px solid rgba(244,114,182,0.6);
  border-radius: 50%; opacity: 0; animation: cocoonForm 1s ease .8s both;
  background: radial-gradient(ellipse, rgba(244,114,182,0.2), transparent);
}
@keyframes cocoonForm { from{opacity:0;transform:translateX(-50%) scale(0)} to{opacity:1;transform:translateX(-50%) scale(1)} }
.gaoji-timer {
  position: absolute; bottom: 15%; font-size: 36px; color: #f9a8d4; opacity: 0;
  animation: timerAppear .5s ease 1.3s both;
}

/* ===== 10. 借尸还魂 jieshi ===== */
.jieshi { background: radial-gradient(circle, rgba(88,28,135,0.85) 0%, rgba(0,0,0,0.92) 70%); }
.jieshi-tomb {
  position: absolute; bottom: 30%; font-size: 64px;
  animation: tombShake .6s ease .3s both;
}
@keyframes tombShake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-5deg)} 75%{transform:rotate(5deg)} }
.jieshi-crack {
  position: absolute; bottom: 35%; left: 50%; width: 60px; height: 3px;
  background: #a855f7; transform: translateX(-50%); opacity: 0;
  animation: crackAppear .3s ease .8s both;
}
@keyframes crackAppear { from{opacity:0;width:0} to{opacity:1;width:60px} }
.jieshi-ghost {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  font-size: 64px; opacity: 0; animation: ghostRise 1s ease 1s both; z-index: 5;
}
@keyframes ghostRise { 0%{opacity:0;top:70%} 50%{opacity:1} 100%{opacity:1;top:35%} }
.jieshi-soul {
  position: absolute; bottom: 0; width: 8px; height: 8px;
  background: #c084fc; border-radius: 50%; opacity: 0;
  animation: soulFloat 2s ease infinite;
}
@keyframes soulFloat { 0%{opacity:0;transform:translateY(0)} 30%{opacity:0.8} 100%{opacity:0;transform:translateY(-80vh)} }

/* ===== 11. 吸引攻击 xiyin ===== */
.xiyin { background: radial-gradient(circle, rgba(220,38,38,0.75) 0%, rgba(0,0,0,0.9) 70%); }
.xiyin-magnet {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  font-size: 64px; z-index: 5; animation: magnetPulse 1s ease infinite;
}
@keyframes magnetPulse { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.2)} }
.xiyin-arrow {
  position: absolute; font-size: 28px; color: #fca5a5; opacity: 0;
}
.xa-1{top:20%;left:10%;animation:arrowPull 1.2s ease .3s infinite}
.xa-2{top:20%;right:10%;animation:arrowPull 1.2s ease .5s infinite;transform:scaleX(-1)}
.xa-3{top:50%;left:5%;animation:arrowPull 1.2s ease .4s infinite}
.xa-4{top:50%;right:5%;animation:arrowPull 1.2s ease .6s infinite;transform:scaleX(-1)}
.xa-5{top:75%;left:10%;animation:arrowPull 1.2s ease .35s infinite}
.xa-6{top:75%;right:10%;animation:arrowPull 1.2s ease .55s infinite;transform:scaleX(-1)}
@keyframes arrowPull { 0%{opacity:1} 100%{opacity:0;transform:translateX(40vw) scaleX(var(--sx,1))} }
.xa-2,.xa-4,.xa-6 { --sx: -1; }
@keyframes arrowPull { 0%{opacity:1;transform:scaleX(var(--sx,1))} 100%{opacity:0;left:45%;right:auto;transform:scaleX(var(--sx,1))} }

/* ===== 12. 众志成城 zhongzhi ===== */
.zhongzhi { background: radial-gradient(circle, rgba(234,179,8,0.75) 0%, rgba(0,0,0,0.9) 70%); }
.zhongzhi-bar {
  position: absolute; width: 120px; height: 16px; border-radius: 8px;
  background: linear-gradient(90deg, #22c55e, #16a34a); opacity: 0;
}
.zb-1{top:35%;left:20%;animation:barMerge 1s ease .3s both}
.zb-2{top:42%;left:25%;animation:barMerge 1s ease .5s both;width:80px}
.zb-3{top:49%;left:18%;animation:barMerge 1s ease .7s both;width:150px}
.zb-4{top:56%;left:22%;animation:barMerge 1s ease .9s both;width:100px}
@keyframes barMerge { 0%{opacity:0;transform:translateX(-30px)} 50%{opacity:1} 100%{opacity:0;left:50%;transform:translateX(-50%) scaleX(0.5)} }
.zhongzhi-merge {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  font-size: 56px; z-index: 5; opacity: 0; animation: mergeAppear .6s ease 1.2s both;
}
@keyframes mergeAppear { from{opacity:0;transform:translate(-50%,-50%) scale(0)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }

/* ===== 13. 实力增强 shili ===== */
.shili { background: radial-gradient(circle, rgba(234,179,8,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.shili-bar {
  position: absolute; top: 55%; left: 50%; transform: translateX(-50%);
  width: 200px; height: 20px; background: rgba(0,0,0,0.4);
  border-radius: 10px; border: 2px solid #fbbf24; overflow: hidden;
}
.shili-fill {
  width: 50%; height: 100%; background: linear-gradient(90deg, #22c55e, #4ade80);
  border-radius: 8px; animation: barDouble 1.2s ease .5s both;
}
@keyframes barDouble { from{width:50%} to{width:100%} }
.shili-x2 {
  position: absolute; top: 40%; right: 25%; font-size: 48px; font-weight: bold;
  color: #fbbf24; opacity: 0; animation: x2Pop .6s ease 1s both;
  text-shadow: 0 0 20px #fbbf24;
}
@keyframes x2Pop { 0%{opacity:0;transform:scale(0) rotate(-20deg)} 100%{opacity:1;transform:scale(1) rotate(0)} }
.shili-spark {
  position: absolute; bottom: 0; width: 6px; height: 6px;
  background: #fbbf24; border-radius: 50%; opacity: 0;
  animation: sparkRise 1.5s ease infinite;
}
@keyframes sparkRise { 0%{opacity:0;transform:translateY(0)} 20%{opacity:1} 100%{opacity:0;transform:translateY(-60vh)} }

/* ===== 14. 无中生有 wuzhong ===== */
.wuzhong { background: radial-gradient(circle, rgba(139,92,246,0.75) 0%, rgba(0,0,0,0.9) 70%); }
.wuzhong-void {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  font-size: 80px; color: rgba(255,255,255,0.3);
  animation: voidPulse 1s ease 0.2s both;
}
@keyframes voidPulse { 0%{opacity:1} 50%{opacity:0.2} 100%{opacity:0} }
.wuzhong-city {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  font-size: 64px; opacity: 0; animation: cityMaterialize 0.8s ease 0.8s both; z-index: 5;
}
@keyframes cityMaterialize { 0%{opacity:0;transform:translate(-50%,-50%) scale(0);filter:blur(10px)} 100%{opacity:1;transform:translate(-50%,-50%) scale(1);filter:blur(0)} }
.wuzhong-star {
  position: absolute; bottom: 0; font-size: 16px; color: #a78bfa; opacity: 0;
  animation: matSparkle 1.5s ease infinite;
}
@keyframes matSparkle { 0%{opacity:0;transform:translateY(0)} 30%{opacity:1} 100%{opacity:0;transform:translateY(-80vh)} }

/* ===== 15. 劫富济贫 jiefu ===== */
.jiefu { background: radial-gradient(circle, rgba(234,179,8,0.75) 0%, rgba(0,0,0,0.9) 70%); }
.jiefu-scale {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  font-size: 72px; z-index: 5; animation: scaleTilt 1.5s ease .3s both;
}
@keyframes scaleTilt { 0%{transform:translate(-50%,-50%) rotate(0)} 50%{transform:translate(-50%,-50%) rotate(15deg)} 100%{transform:translate(-50%,-50%) rotate(0)} }
.jiefu-rich { position: absolute; top: 30%; left: 20%; font-size: 48px; animation: richShrink 1.2s ease .5s both; }
.jiefu-poor { position: absolute; top: 30%; right: 20%; font-size: 48px; animation: poorGrow 1.2s ease .5s both; }
@keyframes richShrink { 0%{transform:scale(1.3)} 100%{transform:scale(0.7)} }
@keyframes poorGrow { 0%{transform:scale(0.7)} 100%{transform:scale(1.3)} }
.jiefu-flow {
  position: absolute; top: 50%; width: 10px; height: 10px;
  background: #22c55e; border-radius: 50%; opacity: 0;
}
.jff-1{left:25%;animation:flowRight 1s ease .6s infinite}
.jff-2{left:30%;animation:flowRight 1s ease .8s infinite}
.jff-3{left:28%;animation:flowRight 1s ease 1s infinite}
.jff-4{left:32%;animation:flowRight 1s ease 1.2s infinite}
@keyframes flowRight { 0%{opacity:1;transform:translateX(0)} 100%{opacity:0;transform:translateX(40vw)} }

/* ===== 16. 城市预言 yuyan ===== */
.yuyan { background: radial-gradient(circle, rgba(6,182,212,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.yuyan-ball {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
  font-size: 80px; z-index: 5; animation: ballGlow 1.5s ease infinite;
}
@keyframes ballGlow { 0%,100%{filter:brightness(1) drop-shadow(0 0 10px #22d3ee)} 50%{filter:brightness(1.5) drop-shadow(0 0 30px #22d3ee)} }
.yuyan-scan {
  position: absolute; top: 0; left: 15%; width: 70%; height: 3px;
  background: linear-gradient(90deg, transparent, #22d3ee, transparent);
  box-shadow: 0 0 15px #22d3ee; animation: scanDown 1.5s ease .3s infinite;
}
@keyframes scanDown { 0%{top:0;opacity:1} 100%{top:100%;opacity:0.3} }
.yuyan-city { position: absolute; font-size: 32px; opacity: 0; }
.yc-1{top:25%;left:15%;animation:cityReveal .5s ease .8s both}
.yc-2{top:25%;right:15%;animation:cityReveal .5s ease 1s both}
.yc-3{bottom:25%;left:15%;animation:cityReveal .5s ease 1.2s both}
.yc-4{bottom:25%;right:15%;animation:cityReveal .5s ease 1.4s both}
@keyframes cityReveal { from{opacity:0;transform:scale(0)} to{opacity:1;transform:scale(1)} }
.yuyan-eye {
  position: absolute; bottom: 15%; font-size: 40px; opacity: 0;
  animation: eyeAppear .5s ease 1.5s both;
}
@keyframes eyeAppear { from{opacity:0;transform:scaleY(0)} to{opacity:1;transform:scaleY(1)} }

/* ===== 17. 博学多才 boxue ===== */
.boxue { background: radial-gradient(circle, rgba(6,182,212,0.75) 0%, rgba(0,0,0,0.9) 70%); }
.boxue-book { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: 80px; z-index: 5; animation: bookOpen 1s ease .3s both; }
@keyframes bookOpen { 0%{transform:translate(-50%,-50%) rotateY(90deg)} 100%{transform:translate(-50%,-50%) rotateY(0)} }
.boxue-q { position: absolute; font-size: 32px; opacity: 0; }
.bq-1{top:25%;left:25%;animation:qFloat 1.2s ease .6s both}
.bq-2{top:20%;right:25%;animation:qFloat 1.2s ease .8s both}
.bq-3{bottom:30%;left:30%;animation:qFloat 1.2s ease 1s both}
.bq-4{bottom:25%;right:30%;animation:qFloat 1.2s ease 1.2s both}
@keyframes qFloat { 0%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1.2)} 100%{opacity:0;transform:translateY(-30px) scale(0.8)} }
.boxue-star { position: absolute; bottom: 15%; font-size: 48px; opacity: 0; animation: starPop .6s ease 1.4s both; }
@keyframes starPop { from{opacity:0;transform:scale(0) rotate(-180deg)} to{opacity:1;transform:scale(1) rotate(0)} }

/* ===== 18. 守望相助 shouwang ===== */
.shouwang { background: radial-gradient(circle, rgba(59,130,246,0.75) 0%, rgba(0,0,0,0.9) 70%); }
.shouwang-city1 { position: absolute; left: 25%; top: 45%; font-size: 48px; }
.shouwang-city2 { position: absolute; right: 25%; top: 45%; font-size: 48px; opacity: 0; animation: city2Revive 1s ease 1s both; }
@keyframes city2Revive { 0%{opacity:0;transform:scale(0)} 100%{opacity:1;transform:scale(1)} }
.shouwang-link {
  position: absolute; top: 52%; left: 35%; width: 30%; height: 3px;
  background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6);
  animation: linkPulse 1s ease infinite; opacity: 0; animation: linkShow .5s ease .5s both;
}
@keyframes linkShow { from{opacity:0;width:0} to{opacity:1;width:30%} }
.shouwang-heart { position: absolute; top: 35%; font-size: 40px; opacity: 0; animation: heartBeat .6s ease 1.3s both; }
@keyframes heartBeat { 0%{opacity:0;transform:scale(0)} 50%{transform:scale(1.3)} 100%{opacity:1;transform:scale(1)} }

/* ===== 19. 点石成金 dianshi ===== */
.dianshi { background: radial-gradient(circle, rgba(217,119,6,0.85) 0%, rgba(0,0,0,0.9) 70%); }
.dianshi-stone { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: 64px; animation: stoneToGold 1s ease .3s both; }
@keyframes stoneToGold { 0%{opacity:1;transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.2) rotate(20deg)} 100%{opacity:0;transform:translate(-50%,-50%) scale(0)} }
.dianshi-gold { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); font-size: 64px; opacity: 0; animation: goldAppear .8s ease 1s both; z-index: 5; }
@keyframes goldAppear { 0%{opacity:0;transform:translate(-50%,-50%) scale(0);filter:brightness(3)} 100%{opacity:1;transform:translate(-50%,-50%) scale(1);filter:brightness(1)} }
.dianshi-sparkle { position: absolute; top: 35%; font-size: 48px; opacity: 0; animation: dianshiSparkle .6s ease 1.2s both; }
@keyframes dianshiSparkle { 0%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1.5)} 100%{opacity:1;transform:scale(1)} }
.dianshi-particle {
  position: absolute; bottom: 0; width: 8px; height: 8px;
  background: #fbbf24; border-radius: 50%; opacity: 0;
  animation: goldRise 1.5s ease infinite; box-shadow: 0 0 6px #fbbf24;
}
@keyframes goldRise { 0%{opacity:0;transform:translateY(0)} 20%{opacity:1} 100%{opacity:0;transform:translateY(-70vh)} }

/* ===== 20. 一落千丈 yiluo ===== */
.yiluo { background: radial-gradient(circle, rgba(220,38,38,0.8) 0%, rgba(0,0,0,0.92) 70%); }
.yiluo-city { position: absolute; top: 20%; left: 50%; transform: translateX(-50%); font-size: 56px; animation: cityFall 1s ease .3s both; }
@keyframes cityFall { 0%{top:20%} 100%{top:70%;transform:translateX(-50%) scale(0.6)} }
.yiluo-arrow { position: absolute; top: 40%; left: 50%; transform: translateX(-50%); font-size: 48px; animation: arrowDrop 1s ease .3s both; }
@keyframes arrowDrop { 0%{top:25%;opacity:0} 100%{top:60%;opacity:1} }
.yiluo-divide { position: absolute; top: 35%; right: 25%; font-size: 48px; font-weight: bold; color: #ef4444; opacity: 0; animation: divideShow .5s ease 1s both; text-shadow: 0 0 15px #ef4444; }
@keyframes divideShow { from{opacity:0;transform:scale(2)} to{opacity:1;transform:scale(1)} }
.yiluo-crack { position: absolute; top: 70%; left: 50%; width: 0; height: 3px; background: #ef4444; opacity: 0; }
.yc-1{animation:crackSpread .5s ease 1.1s both;transform:translateX(-50%) rotate(30deg)}
.yc-2{animation:crackSpread .5s ease 1.2s both;transform:translateX(-50%) rotate(-20deg)}
.yc-3{animation:crackSpread .5s ease 1.3s both;transform:translateX(-50%) rotate(50deg)}
.yc-4{animation:crackSpread .5s ease 1.4s both;transform:translateX(-50%) rotate(-40deg)}
@keyframes crackSpread { from{width:0;opacity:0} to{width:80px;opacity:1} }

/* ===== 21. 连续打击 lianxu ===== */
.lianxu { background: radial-gradient(circle, rgba(249,115,22,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.lianxu-fist { position: absolute; font-size: 56px; }
.lianxu-f1 { left: -10%; top: 40%; animation: punchRight .6s ease .3s both; }
.lianxu-f2 { right: -10%; top: 50%; animation: punchLeft .6s ease .8s both; transform: scaleX(-1); }
@keyframes punchRight { 0%{left:-10%;opacity:1} 100%{left:45%;opacity:0} }
@keyframes punchLeft { 0%{right:-10%;opacity:1} 100%{right:45%;opacity:0} }
.lianxu-impact { position: absolute; font-size: 48px; opacity: 0; }
.lianxu-i1 { left: 45%; top: 40%; animation: impactFlash .4s ease .85s both; }
.lianxu-i2 { right: 42%; top: 50%; animation: impactFlash .4s ease 1.35s both; }
@keyframes impactFlash { 0%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1.5)} 100%{opacity:0;transform:scale(2)} }
.lianxu-divide { position: absolute; bottom: 25%; font-size: 48px; font-weight: bold; color: #f97316; opacity: 0; animation: divideShow .5s ease 1.3s both; text-shadow: 0 0 15px #f97316; }

/* ===== 22. 横扫一空 hengsao ===== */
.hengsao { background: radial-gradient(circle, rgba(126,34,206,0.8) 0%, rgba(0,0,0,0.92) 70%); }
.hengsao-tornado { position: absolute; left: -10%; top: 50%; transform: translateY(-50%); font-size: 72px; animation: tornadoSweep 1.5s ease .3s both; }
@keyframes tornadoSweep { 0%{left:-10%;transform:translateY(-50%) rotate(0)} 100%{left:110%;transform:translateY(-50%) rotate(720deg)} }
.hengsao-skill { position: absolute; font-size: 28px; opacity: 0; }
.hss-1{top:30%;left:30%;animation:skillScatter 1s ease .8s both;--sx:80px;--sy:-60px}
.hss-2{top:40%;left:45%;animation:skillScatter 1s ease .9s both;--sx:-50px;--sy:70px}
.hss-3{top:50%;left:55%;animation:skillScatter 1s ease 1s both;--sx:60px;--sy:50px}
.hss-4{top:35%;left:60%;animation:skillScatter 1s ease 1.1s both;--sx:-70px;--sy:-40px}
.hss-5{top:55%;left:40%;animation:skillScatter 1s ease 1.2s both;--sx:40px;--sy:-80px}
@keyframes skillScatter { 0%{opacity:1;transform:translate(0,0)} 100%{opacity:0;transform:translate(var(--sx),var(--sy))} }

/* ===== 23. 万箭齐发 wanjian ===== */
.wanjian { background: radial-gradient(circle, rgba(220,38,38,0.8) 0%, rgba(0,0,0,0.92) 70%); }
.wanjian-arrow { position: absolute; top: -20px; font-size: 24px; opacity: 0; animation: arrowRain 1s ease forwards; transform: rotate(135deg); }
@keyframes arrowRain { 0%{opacity:0;top:-20px} 30%{opacity:1} 100%{opacity:0;top:100vh} }
.wanjian-target { position: absolute; bottom: 20%; left: 50%; transform: translateX(-50%); font-size: 56px; animation: targetPulse 1s ease infinite; }
@keyframes targetPulse { 0%,100%{transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.2)} }

/* ===== 24. 士气大振 shiqi ===== */
.shiqi { background: radial-gradient(circle, rgba(16,185,129,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.shiqi-flag { position: absolute; top: 20%; font-size: 56px; animation: flagWave 1s ease infinite; }
@keyframes flagWave { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
.shiqi-bar {
  position: absolute; left: 50%; transform: translateX(-50%);
  width: 150px; height: 14px; background: rgba(0,0,0,0.3);
  border-radius: 7px; overflow: hidden; border: 1px solid #34d399;
}
.sqb-1{top:40%} .sqb-2{top:46%} .sqb-3{top:52%} .sqb-4{top:58%} .sqb-5{top:64%}
.shiqi-fill { width: 0; height: 100%; background: linear-gradient(90deg,#22c55e,#4ade80); border-radius: 7px; animation: fillBar 1s ease .5s both; }
.sqb-1 .shiqi-fill{animation-delay:.5s} .sqb-2 .shiqi-fill{animation-delay:.65s} .sqb-3 .shiqi-fill{animation-delay:.8s} .sqb-4 .shiqi-fill{animation-delay:.95s} .sqb-5 .shiqi-fill{animation-delay:1.1s}
@keyframes fillBar { from{width:30%} to{width:100%} }
.shiqi-cheer { position: absolute; bottom: 0; font-size: 28px; opacity: 0; animation: cheerPop 1.5s ease infinite; }
@keyframes cheerPop { 0%{opacity:0;transform:translateY(0) scale(0)} 30%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:translateY(-50vh)} }

/* ===== 25. 电磁感应 dianci ===== */
.dianci { background: radial-gradient(circle, rgba(234,179,8,0.7) 0%, rgba(0,0,0,0.92) 70%); }
.dianci-city { position: absolute; font-size: 40px; }
.dianci-c1{top:30%;left:20%} .dianci-c2{top:30%;right:20%} .dianci-c3{bottom:25%;left:50%;transform:translateX(-50%)}
.dianci-bolt { position: absolute; font-size: 36px; opacity: 0; animation: boltFlash .8s ease infinite; }
.dianci-b1{top:32%;left:40%;animation-delay:.3s} .dianci-b2{top:32%;right:38%;animation-delay:.6s} .dianci-b3{top:55%;left:43%;animation-delay:.9s}
@keyframes boltFlash { 0%{opacity:0} 30%{opacity:1} 60%{opacity:0} 100%{opacity:0} }

/* ===== 26. 战略转移 zhanlve ===== */
.zhanlve { background: radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.zhanlve-old{position:absolute;left:25%;top:45%;font-size:48px;animation:oldFade 1s ease .5s both}
.zhanlve-new{position:absolute;right:25%;top:45%;font-size:48px;animation:newGlow 1s ease .8s both}
@keyframes oldFade{0%{opacity:1}100%{opacity:0.4}}
@keyframes newGlow{0%{filter:brightness(1)}100%{filter:brightness(1.5) drop-shadow(0 0 15px #60a5fa)}}
.zhanlve-crown{position:absolute;top:30%;left:30%;font-size:48px;animation:crownMove 1.2s ease .5s both}
@keyframes crownMove{0%{left:30%}100%{left:65%}}
.zhanlve-plus{position:absolute;bottom:25%;right:20%;font-size:36px;font-weight:bold;color:#60a5fa;opacity:0;animation:plusPop .5s ease 1.4s both;text-shadow:0 0 15px #60a5fa}
@keyframes plusPop{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}

/* ===== 27. 自相残杀 zixiang ===== */
.zixiang { background: radial-gradient(circle, rgba(220,38,38,0.85) 0%, rgba(0,0,0,0.92) 70%); }
.zixiang-sword{position:absolute;top:45%;font-size:56px}
.zixiang-s1{left:15%;animation:swordClashL .8s ease .3s both}
.zixiang-s2{right:15%;animation:swordClashR .8s ease .3s both;transform:scaleX(-1)}
@keyframes swordClashL{0%{left:15%}100%{left:42%}}
@keyframes swordClashR{0%{right:15%}100%{right:42%}}
.zixiang-clash{position:absolute;top:45%;left:50%;transform:translate(-50%,-50%);font-size:56px;opacity:0;animation:clashBoom .5s ease 1s both}
@keyframes clashBoom{0%{opacity:0;transform:translate(-50%,-50%) scale(0)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.5)}100%{opacity:0;transform:translate(-50%,-50%) scale(2)}}
.zixiang-skull{position:absolute;bottom:20%;font-size:48px;opacity:0;animation:skullAppear .5s ease 1.3s both}
@keyframes skullAppear{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}

/* ===== 28. 趁其不备·随机 chenqi_rand ===== */
.chenqi_rand { background: radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.chenqi-hand{position:absolute;left:15%;top:45%;font-size:56px;animation:handReach .8s ease .3s both}
@keyframes handReach{0%{left:15%}100%{left:45%}}
.chenqi-city{position:absolute;right:25%;top:40%;font-size:48px;animation:cityShake .5s ease .8s both}
@keyframes cityShake{0%,100%{transform:rotate(0)}25%{transform:rotate(-5deg)}75%{transform:rotate(5deg)}}
.chenqi-dice{position:absolute;top:25%;font-size:48px;animation:diceRoll 1s ease .3s both}
@keyframes diceRoll{0%{transform:rotate(0)}100%{transform:rotate(720deg)}}
.chenqi-grab{position:absolute;left:45%;top:45%;font-size:56px;opacity:0;animation:grabShow .5s ease 1s both}
@keyframes grabShow{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}

/* ===== 29. 搬运救兵 banyun ===== */
.banyun { background: radial-gradient(circle, rgba(59,130,246,0.75) 0%, rgba(0,0,0,0.9) 70%); }
.banyun-truck{position:absolute;left:-15%;top:50%;transform:translateY(-50%);font-size:56px;animation:truckDrive 1.5s ease .2s both}
@keyframes truckDrive{0%{left:-15%}60%{left:30%}100%{left:30%}}
.banyun-city{position:absolute;font-size:40px;opacity:0}
.banyun-bc1{top:40%;right:20%;animation:cityDrop .6s ease 1s both}
.banyun-bc2{top:55%;right:25%;animation:cityDrop .6s ease 1.3s both}
@keyframes cityDrop{0%{opacity:0;transform:translateY(-30px)}100%{opacity:1;transform:translateY(0)}}
.banyun-flag{position:absolute;bottom:20%;font-size:40px;opacity:0;animation:flagAppear .5s ease 1.5s both}
@keyframes flagAppear{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}

/* ===== 30. 中庸之道 zhongyong ===== */
.zhongyong { background: radial-gradient(circle, rgba(100,116,139,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.zhongyong-yinyang{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:80px;animation:yinSpin 2s linear infinite;z-index:5}
@keyframes yinSpin{0%{transform:translate(-50%,-50%) rotate(0)}100%{transform:translate(-50%,-50%) rotate(360deg)}}
.zhongyong-sqrt{position:absolute;bottom:20%;font-size:32px;font-weight:bold;color:#94a3b8;opacity:0;animation:sqrtShow .6s ease 1s both;text-shadow:0 0 10px #94a3b8}
@keyframes sqrtShow{from{opacity:0;transform:scale(0)}to{opacity:1;transform:scale(1)}}
.zhongyong-up{position:absolute;top:25%;right:20%;font-size:48px;animation:upBounce 1s ease .5s both}
.zhongyong-down{position:absolute;top:25%;left:20%;font-size:48px;animation:downBounce 1s ease .5s both}
@keyframes upBounce{0%{transform:translateY(0)}50%{transform:translateY(-15px)}100%{transform:translateY(0)}}
@keyframes downBounce{0%{transform:translateY(0)}50%{transform:translateY(15px)}100%{transform:translateY(0)}}

/* ===== 31. 强制转移·普通 qiangzhi_pu ===== */
.qiangzhi_pu { background: radial-gradient(circle, rgba(220,38,38,0.85) 0%, rgba(0,0,0,0.92) 70%); }
.qiangzhi-crown{position:absolute;top:35%;font-size:64px;animation:crownShatter 1s ease .3s both}
@keyframes crownShatter{0%{transform:scale(1);opacity:1}50%{transform:scale(1.3) rotate(10deg)}100%{transform:scale(0);opacity:0}}
.qiangzhi-smash{position:absolute;top:40%;font-size:64px;opacity:0;animation:smashPop .5s ease 1s both}
@keyframes smashPop{0%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1.5)}100%{opacity:0;transform:scale(2)}}
.qiangzhi-shard{position:absolute;top:40%;left:50%;font-size:20px;color:#fbbf24;opacity:0}
.qs-1{animation:shardFly .8s ease 1s both;--sx:-60px;--sy:-50px}
.qs-2{animation:shardFly .8s ease 1.05s both;--sx:50px;--sy:-60px}
.qs-3{animation:shardFly .8s ease 1.1s both;--sx:-40px;--sy:50px}
.qs-4{animation:shardFly .8s ease 1.15s both;--sx:60px;--sy:40px}
.qs-5{animation:shardFly .8s ease 1.2s both;--sx:0;--sy:-70px}
@keyframes shardFly{0%{opacity:1;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--sx),var(--sy))}}

/* ===== 32. 趁其不备·指定 chenqi_pick ===== */
.chenqi_pick { background: radial-gradient(circle, rgba(139,92,246,0.85) 0%, rgba(0,0,0,0.92) 70%); }
.chenqi-scope{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:80px;color:#a855f7;animation:scopeZoom 1s ease .3s both;z-index:5}
@keyframes scopeZoom{0%{transform:translate(-50%,-50%) scale(3);opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
.chenqi-p-city{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px}
.chenqi-p-hand{position:absolute;bottom:20%;font-size:48px;opacity:0;animation:grabShow .5s ease 1.2s both}
.chenqi-p-lock{position:absolute;top:25%;font-size:36px;opacity:0;animation:lockAppear .5s ease 1.4s both}

/* ===== 33. 行政中心 xingzheng ===== */
.xingzheng { background: radial-gradient(circle, rgba(234,179,8,0.85) 0%, rgba(0,0,0,0.9) 70%); }
.xingzheng-building{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:72px;z-index:5}
.xingzheng-beam{position:absolute;top:50%;left:50%;width:3px;height:120px;background:linear-gradient(180deg,#fbbf24,transparent);transform-origin:bottom center;opacity:0}
.xzb-1{animation:beamShoot .8s ease .5s both;transform:translateX(-50%) rotate(-40deg)}
.xzb-2{animation:beamShoot .8s ease .7s both;transform:translateX(-50%) rotate(-15deg)}
.xzb-3{animation:beamShoot .8s ease .9s both;transform:translateX(-50%) rotate(15deg)}
.xzb-4{animation:beamShoot .8s ease 1.1s both;transform:translateX(-50%) rotate(40deg)}
@keyframes beamShoot{0%{opacity:0;height:0}50%{opacity:1}100%{opacity:0;height:120px}}
.xingzheng-x3{position:absolute;bottom:20%;font-size:56px;font-weight:bold;color:#fbbf24;opacity:0;animation:x2Pop .6s ease 1.3s both;text-shadow:0 0 20px #fbbf24}

/* ===== 34. 计划单列 jihua ===== */
.jihua { background: radial-gradient(circle, rgba(16,185,129,0.75) 0%, rgba(0,0,0,0.9) 70%); }
.jihua-clip{position:absolute;top:20%;font-size:56px;animation:clipBounce .6s ease .2s both}
@keyframes clipBounce{0%{transform:scale(0)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
.jihua-bar{position:absolute;left:50%;transform:translateX(-50%);width:130px;height:12px;background:rgba(0,0,0,0.3);border-radius:6px;overflow:hidden;border:1px solid #34d399}
.jhb-1{top:42%}.jhb-2{top:48%}.jhb-3{top:54%}.jhb-4{top:60%}.jhb-5{top:66%}
.jihua-fill{width:0;height:100%;background:linear-gradient(90deg,#22c55e,#4ade80);border-radius:6px;animation:jihuaFill 1s ease both}
.jhb-1 .jihua-fill{animation-delay:.5s;width:0}.jhb-2 .jihua-fill{animation-delay:.65s}.jhb-3 .jihua-fill{animation-delay:.8s}.jhb-4 .jihua-fill{animation-delay:.95s}.jhb-5 .jihua-fill{animation-delay:1.1s}
@keyframes jihuaFill{from{width:20%}to{width:100%}}
.jihua-check{position:absolute;bottom:15%;font-size:48px;opacity:0;animation:lockAppear .5s ease 1.4s both}

/* ===== 35. 设置屏障 pingzhang ===== */
.pingzhang { background: radial-gradient(circle, rgba(59,130,246,0.85) 0%, rgba(0,0,0,0.9) 70%); }
.pingzhang-hex{position:absolute;top:50%;left:50%;width:60px;height:60px;border:2px solid rgba(96,165,250,0.7);opacity:0;transform:translate(-50%,-50%)}
.ph-1{animation:hexAssemble .6s ease .3s both;margin-left:-35px;margin-top:-30px}
.ph-2{animation:hexAssemble .6s ease .4s both;margin-left:35px;margin-top:-30px}
.ph-3{animation:hexAssemble .6s ease .5s both;margin-left:-70px}
.ph-4{animation:hexAssemble .6s ease .6s both;margin-left:70px}
.ph-5{animation:hexAssemble .6s ease .7s both;margin-left:-35px;margin-top:30px}
.ph-6{animation:hexAssemble .6s ease .8s both;margin-left:35px;margin-top:30px}
@keyframes hexAssemble{0%{opacity:0;transform:translate(-50%,-50%) scale(0)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
.pingzhang-hp{position:absolute;bottom:20%;font-size:36px;font-weight:bold;color:#60a5fa;opacity:0;animation:sqrtShow .5s ease 1.2s both;text-shadow:0 0 15px #60a5fa}
.pingzhang-reflect{position:absolute;top:25%;font-size:36px;opacity:0;animation:lockAppear .5s ease 1.4s both}

/* ===== 36. 生于紫室 zishi ===== */
.zishi { background: radial-gradient(circle, rgba(126,34,206,0.85) 0%, rgba(0,0,0,0.92) 70%); }
.zishi-aura{position:absolute;top:50%;left:50%;width:200px;height:200px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(168,85,247,0.4),transparent);animation:auraPulse 1.5s ease infinite}
@keyframes auraPulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:.5}50%{transform:translate(-50%,-50%) scale(1.4);opacity:1}}
.zishi-crown{position:absolute;top:25%;font-size:56px;animation:crownDescend .8s ease .3s both}
@keyframes crownDescend{0%{top:0;opacity:0}100%{top:25%;opacity:1}}
.zishi-x2{position:absolute;bottom:22%;left:35%;font-size:36px;font-weight:bold;color:#c084fc;opacity:0;animation:x2Pop .5s ease 1s both;text-shadow:0 0 15px #c084fc}
.zishi-star{position:absolute;bottom:0;font-size:16px;color:#c084fc;opacity:0;animation:matSparkle 2s ease infinite}
.zishi-stealth{position:absolute;bottom:22%;right:30%;font-size:36px;opacity:0;animation:lockAppear .5s ease 1.3s both}

/* ===== 37. 强制转移·高级 qiangzhi_gao ===== */
.qiangzhi_gao { background: radial-gradient(circle, rgba(220,38,38,0.9) 0%, rgba(0,0,0,0.92) 70%); }
.qgao-crown{position:absolute;top:30%;font-size:56px;animation:crownShatter .8s ease .3s both}
.qgao-fire{position:absolute;top:35%;font-size:56px;opacity:0;animation:fireBurst .6s ease .9s both}
@keyframes fireBurst{0%{opacity:0;transform:scale(0)}50%{opacity:1;transform:scale(1.5)}100%{opacity:1;transform:scale(1)}}
.qgao-finger{position:absolute;bottom:25%;font-size:56px;opacity:0;animation:fingerPoint .6s ease 1.3s both}
@keyframes fingerPoint{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}
.qgao-ember{position:absolute;top:35%;left:50%;width:6px;height:6px;background:#ef4444;border-radius:50%;opacity:0}
.qge-1{animation:debrisFly .8s ease 1s both;--dx:-50px;--dy:-40px}
.qge-2{animation:debrisFly .8s ease 1.1s both;--dx:40px;--dy:-50px}
.qge-3{animation:debrisFly .8s ease 1.05s both;--dx:-30px;--dy:40px}
.qge-4{animation:debrisFly .8s ease 1.15s both;--dx:50px;--dy:30px}

/* ===== 38. 四面楚歌 simian ===== */
.simian { background: radial-gradient(circle, rgba(234,179,8,0.8) 0%, rgba(0,0,0,0.92) 70%); }
.simian-note{position:absolute;font-size:32px;opacity:0}
.sn-1{top:15%;left:15%;animation:noteFloat 2s ease .2s infinite}
.sn-2{top:15%;right:15%;animation:noteFloat 2s ease .4s infinite}
.sn-3{top:50%;left:5%;animation:noteFloat 2s ease .6s infinite}
.sn-4{top:50%;right:5%;animation:noteFloat 2s ease .8s infinite}
.sn-5{bottom:20%;left:15%;animation:noteFloat 2s ease .3s infinite}
.sn-6{bottom:20%;right:15%;animation:noteFloat 2s ease .5s infinite}
.sn-7{top:35%;left:10%;animation:noteFloat 2s ease .7s infinite}
.sn-8{top:35%;right:10%;animation:noteFloat 2s ease .9s infinite}
@keyframes noteFloat{0%{opacity:0;transform:scale(0)}30%{opacity:1;transform:scale(1.2)}70%{opacity:0.8}100%{opacity:0;transform:translateY(-20px) rotate(20deg)}}
.simian-vortex{position:absolute;top:50%;left:50%;width:150px;height:150px;transform:translate(-50%,-50%);border:3px solid rgba(251,191,36,0.5);border-radius:50%;animation:vortexPull 2s linear infinite}
@keyframes vortexPull{0%{transform:translate(-50%,-50%) rotate(0) scale(1.3);opacity:.3}100%{transform:translate(-50%,-50%) rotate(360deg) scale(0.5);opacity:.8}}
.simian-city{position:absolute;font-size:32px;opacity:0}
.smc-1{top:30%;left:25%;animation:cityAbsorb 1.5s ease .5s both}
.smc-2{top:60%;right:20%;animation:cityAbsorb 1.5s ease .8s both}
.smc-3{bottom:25%;left:35%;animation:cityAbsorb 1.5s ease 1.1s both}
@keyframes cityAbsorb{0%{opacity:1;transform:scale(1)}100%{opacity:0;left:50%;top:50%;transform:translate(-50%,-50%) scale(0)}}

/* ===== 39. 事半功倍 shiban ===== */
.shiban { background: radial-gradient(circle, rgba(220,38,38,0.75) 0%, rgba(0,0,0,0.9) 70%); }
.shiban-skill{position:absolute;top:45%;font-size:64px;animation:skillTarget .8s ease .3s both}
@keyframes skillTarget{0%{transform:scale(0)}100%{transform:scale(1)}}
.shiban-stamp{position:absolute;top:40%;font-size:80px;opacity:0;animation:stampDown .4s ease .9s both;z-index:5}
@keyframes stampDown{0%{opacity:0;transform:scale(3) rotate(-30deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
.shiban-chain{position:absolute;bottom:25%;font-size:48px;opacity:0;animation:lockAppear .5s ease 1.3s both}

/* ===== 40. 解除封锁 jiechu ===== */
.jiechu { background: radial-gradient(circle, rgba(16,185,129,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.jiechu-chain{position:absolute;top:50%;font-size:48px}
.jiechu-l{left:25%;animation:chainBreakL .8s ease .5s both}
.jiechu-r{right:25%;animation:chainBreakR .8s ease .5s both}
@keyframes chainBreakL{0%{left:40%}100%{left:15%;opacity:0;transform:rotate(-30deg)}}
@keyframes chainBreakR{0%{right:40%}100%{right:15%;opacity:0;transform:rotate(30deg)}}
.jiechu-burst{position:absolute;top:48%;left:50%;transform:translateX(-50%);font-size:56px;opacity:0;animation:impactFlash .5s ease .8s both}
.jiechu-free{position:absolute;top:30%;font-size:48px;opacity:0;animation:freeRise .8s ease 1.2s both}
@keyframes freeRise{0%{opacity:0;top:50%}100%{opacity:1;top:25%}}

/* ===== 41. 技能保护 jineng ===== */
.jineng { background: radial-gradient(circle, rgba(59,130,246,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.jineng-dome{position:absolute;top:50%;left:50%;width:180px;height:180px;transform:translate(-50%,-50%);border:3px solid rgba(96,165,250,0.6);border-radius:50%;animation:domeGrow .8s ease .3s both;background:radial-gradient(circle,rgba(96,165,250,0.1),transparent)}
.jineng-inner{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:48px;z-index:5}
.jineng-wave{position:absolute;top:50%;left:50%;width:100px;height:100px;border:2px solid rgba(96,165,250,0.5);border-radius:50%;transform:translate(-50%,-50%) scale(0);opacity:0}
.jnw-1{animation:ringExpand 1.5s ease .8s infinite}
.jnw-2{animation:ringExpand 1.5s ease 1.1s infinite}
.jnw-3{animation:ringExpand 1.5s ease 1.4s infinite}
.jineng-10{position:absolute;bottom:18%;font-size:24px;font-weight:bold;color:#60a5fa;opacity:0;animation:lockAppear .5s ease 1.2s both}

/* ===== 42. 一触即发 yichu ===== */
.yichu { background: radial-gradient(circle, rgba(234,179,8,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.yichu-clock{position:absolute;top:40%;font-size:64px;animation:clockShake .5s ease .3s both}
@keyframes clockShake{0%,100%{transform:rotate(0)}25%{transform:rotate(-10deg)}75%{transform:rotate(10deg)}}
.yichu-bolt{position:absolute;top:35%;left:55%;font-size:48px;opacity:0;animation:boltStrike .4s ease .7s both;z-index:5}
@keyframes boltStrike{0%{opacity:0;transform:translateY(-30px)}100%{opacity:1;transform:translateY(0)}}
.yichu-shatter{position:absolute;top:40%;font-size:48px;opacity:0;animation:impactFlash .5s ease 1s both}
.yichu-zero{position:absolute;bottom:22%;font-size:64px;font-weight:bold;color:#fbbf24;opacity:0;animation:x2Pop .6s ease 1.3s both;text-shadow:0 0 20px #fbbf24}

/* ===== 43. 突破瓶颈 tupo ===== */
.tupo { background: radial-gradient(circle, rgba(249,115,22,0.8) 0%, rgba(0,0,0,0.9) 70%); }
.tupo-bottle{position:absolute;top:40%;font-size:64px;animation:bottleCrack .8s ease .3s both}
@keyframes bottleCrack{0%{transform:scale(1)}50%{transform:scale(1.2) rotate(10deg)}100%{transform:scale(0.8);opacity:0.5}}
.tupo-crack{position:absolute;top:38%;left:55%;font-size:48px;opacity:0;animation:impactFlash .5s ease .9s both}
.tupo-rocket{position:absolute;bottom:50%;font-size:56px;opacity:0;animation:rocketLaunch 1s ease 1s both}
@keyframes rocketLaunch{0%{opacity:0;bottom:30%}50%{opacity:1}100%{opacity:0;bottom:90%}}
.tupo-plus{position:absolute;bottom:20%;font-size:48px;font-weight:bold;color:#f97316;opacity:0;animation:x2Pop .6s ease 1.3s both;text-shadow:0 0 15px #f97316}

/* ===== Default fallback ===== */
.default { background: radial-gradient(circle, rgba(139,92,246,0.7) 0%, rgba(0,0,0,0.9) 70%); }
.default-sparkle {
  position: absolute; bottom: 0; font-size: 20px; color: #a78bfa; opacity: 0;
  animation: matSparkle 1.8s ease infinite;
}
</style>
