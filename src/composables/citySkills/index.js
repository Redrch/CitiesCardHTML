/**
 * 城市专属技能主入口
 * 统一导出所有省份的技能处理函数
 */

// 导入直辖市技能
import * as municipalities from './municipalities'

// 导入江苏省技能
import * as jiangsu from './jiangsu'

// 导入浙江省技能
import * as zhejiang from './zhejiang'

// 导入山东省技能
import * as shandong from './shandong'

// 导入湖北省技能
import * as hubei from './hubei'

// 导入广东省技能
import * as guangdong from './guangdong'

// 导入黑龙江省技能
import * as heilongjiang from './heilongjiang'

// 导入湖南省技能
import * as hunan from './hunan'

// 导入河北省技能
import * as hebei from './hebei'

// 导入山西省技能
import * as shanxi from './shanxi'

// 导入内蒙古自治区技能
import * as neimenggu from './neimenggu'

// 导入福建省技能
import * as fujian from './fujian'

// 导入江西省技能
import * as jiangxi from './jiangxi'

// 导入海南省技能
import * as hainan from './hainan'

// 导入辽宁省技能
import * as liaoning from './liaoning'

// 导入吉林省技能
import * as jilin from './jilin'

// 导入河南省技能
import * as henan from './henan'

// 导入四川省技能
import * as sichuan from './sichuan'

// 导入贵州省技能
import * as guizhou from './guizhou'

// 导入云南省技能
import * as yunnan from './yunnan'

// 导入西藏自治区技能
import * as xizang from './xizang'

// 导入甘肃省技能
import * as gansu from './gansu'

// 导入宁夏回族自治区技能
import * as ningxia from './ningxia'

// 导入新疆维吾尔自治区技能
import * as xinjiang from './xinjiang'

/**
 * 城市技能处理器映射表
 * 将城市专属技能名称映射到对应的处理函数
 */
const SKILL_HANDLERS = {
  // 直辖市
  '首都权威': municipalities.handleBeijingSkill,
  '津门守卫': municipalities.handleTianjinSkill,
  '山城迷踪': municipalities.handleChongqingSkill,
  '经济中心': municipalities.handleShanghaiSkill,
  '东方之珠': municipalities.handleHongkongSkill,
  '赌城风云': municipalities.handleMacauSkill,

  // 江苏省
  '古都守护': jiangsu.handleNanjingSkill,
  '灵山大佛': jiangsu.handleWuxiSkill,
  '汉王故里': jiangsu.handleXuzhouSkill,
  '恐龙震慑': jiangsu.handleChangzhouSkill,
  '园林迷阵': jiangsu.handleSuzhouSkill,
  '南通小卷': jiangsu.handleNantongSkill,
  '花果山': jiangsu.handleLianyungangSkill,
  '盱眙小龙虾': jiangsu.handleHuaianSkill,
  '无山阻隔': jiangsu.handleYanchengSkill,
  '美食之都': jiangsu.handleYangzhouSkill,
  '镇江香醋': jiangsu.handleZhenjiangSkill,
  '医药城': jiangsu.handleTaizhouSkill,
  '项王故里': jiangsu.handleSuqianSkill,

  // 浙江省
  '西湖秘境': zhejiang.handleHangzhouSkill,
  '宁波港': zhejiang.handleNingboSkill,
  '方言谜语': zhejiang.handleWenzhouSkill,
  '鲁迅文学': zhejiang.handleShaoxingSkill,
  '笔走龙蛇': zhejiang.handleHuzhouSkill,
  '南湖印记': zhejiang.handleJiaxingSkill,
  '世界义乌': zhejiang.handleJinhuaSkill,
  '三头一掌': zhejiang.handleQuzhouSkill,
  '天台山': zhejiang.handleTaizhouSkill,
  '景宁畲乡': zhejiang.handleLishuiSkill,
  '舟山海鲜': zhejiang.handleZhoushanSkill,

  // 山东省
  '泉城水攻': shandong.handleJinanSkill,
  '青岛啤酒': shandong.handleQingdaoSkill,
  '淄博烧烤': shandong.handleZiboSkill,
  '台儿庄战役': shandong.handleZaozhuangSkill,
  '胜利油田': shandong.handleDongyingSkill,
  '蓬莱仙境': shandong.handleYantaiSkill,
  '风筝探测': shandong.handleWeifangSkill,
  '孔孟故里': shandong.handleJiningSkill,
  '泰山压顶': shandong.handleTaianSkill,
  '刘公岛': shandong.handleWeihaiSkill,
  '城建幻觉': shandong.handleRizhaoSkill,
  '德州扒鸡': shandong.handleDezhouSkill,
  '东阿阿胶': shandong.handleLiaochengSkill,
  '物流之都': shandong.handleLinyiSkill,
  '菏泽牡丹': shandong.handleHezeSkill,

  // 湖北省
  '九省通衢': hubei.handleWuhanSkill,
  '武当山': hubei.handleShiyanSkill,
  '三国战场': hubei.handleJingzhouSkill,
  '三峡大坝': hubei.handleYichangSkill,
  '隆中景区': hubei.handleXiangyangSkill,
  '火烧赤壁': hubei.handleXianningSkill,
  '潜江小龙虾': hubei.handleQianjiangSkill,
  '野人出没': hubei.handleShennongjiaxSkill,
  '天门山': hubei.handleTianmenSkill,
  '土家风情': hubei.handleEnshiSkill,
  '神农故里': hubei.handleSuizhouSkill,

  // 广东省
  '千年商都': guangdong.handleGuangzhouSkill,
  '特区领袖': guangdong.handleShenzhenSkill,
  '浪漫海滨': guangdong.handleZhuhaiSkill,
  '侨乡潮韵': guangdong.handleShantouSkill,
  '房产大亨': guangdong.handleFoshanSkill,
  '丹霞古韵': guangdong.handleShaoguanSkill,
  '南国港湾': guangdong.handleZhanjiangSkill,
  '山水砚都': guangdong.handleZhaoqingSkill,
  '侨风碉楼': guangdong.handleJiangmenSkill,
  '油城果乡': guangdong.handleMaomingSkill,
  '大亚湾区': guangdong.handleHuizhouSkill,
  '客家祖地': guangdong.handleMeizhouSkill,
  '深汕合作': guangdong.handleShanweiSkill,
  '万绿水城': guangdong.handleHeyuanSkill,
  '刀剪之都': guangdong.handleYangjiangSkill,
  '北江凤韵': guangdong.handleQingyuanSkill,
  '世界工厂': guangdong.handleDongguanSkill,
  '伟人故里': guangdong.handleZhongshanSkill,
  '瓷都古韵': guangdong.handleChaozhouSkill,
  '玉都商埠': guangdong.handleJieyangSkill,
  '石都禅意': guangdong.handleYunfuSkill,

  // 黑龙江省
  '冰城奇观': heilongjiang.handleHaerbinSkill,
  '鹤城守护': heilongjiang.handleQiqihaerSkill,
  '镜泊湖光': heilongjiang.handleMudanjiangSkill,
  '三江平原': heilongjiang.handleJiamusSkill,
  '石油之城': heilongjiang.handleDaqingSkill,
  '林都迷踪': heilongjiang.handleYichunSkill,
  '石墨之都': heilongjiang.handleJixiSkill,
  '完达山': heilongjiang.handleShuangyashanSkill,
  '五大连池': heilongjiang.handleHeiheSkill,
  '奥运冠军': heilongjiang.handleQitaiheSkill,

  // 湖南省
  '橘子洲头': hunan.handleChangshaSkill,
  '炎帝陵': hunan.handleZhuzhouSkill,
  '伟人故里': hunan.handleXiangtanSkill,
  '南岳衡山': hunan.handleHengyangSkill,
  '岳阳楼记': hunan.handleYueyangSkill,
  '千山迷阵': hunan.handleZhangjiajieSkill,
  '桃花源记': hunan.handleChangdeSkill,
  '世界锑都': hunan.handleLoudiSkill,
  '永州八记': hunan.handleYongzhouSkill,
  '华南交通中枢': hunan.handleHuaihuaSkill,
  '凤凰古城': hunan.handleXiangxiSkill,

  // 河北省
  '安济桥': hebei.handleShijiazhuangSkill,
  '钢铁之城': hebei.handleTangshanSkill,
  '山海关': hebei.handleQinhuangdaoSkill,
  '邯郸学步': hebei.handleHandanSkill,
  '冬奥盛会': hebei.handleZhangjiakouSkill,
  '避暑山庄': hebei.handleChengdeSkill,
  '夹缝求生': hebei.handleLangfangSkill,
  '衡水模式': hebei.handleHengshuiSkill,
  '千年大计': hebei.handleXionganSkill,

  // 山西省
  '清徐陈醋': shanxi.handleTaiyuanSkill,
  '北岳恒山': shanxi.handleDatongSkill,
  '平遥古城': shanxi.handleJinzhongSkill,
  '鹳雀楼': shanxi.handleYunchengSkill,
  '五台山': shanxi.handleXinzhouSkill,
  '壶口瀑布': shanxi.handleLinfenSkill,

  // 内蒙古自治区
  '稀土之都': neimenggu.handleBaotouSkill,
  '中国煤都': neimenggu.handleEerduosiSkill,
  '草原牧场': neimenggu.handleHulunbeierSkill,
  '元上都': neimenggu.handleXilinguoleSkill,
  '载人航天': neimenggu.handleAlashanSkill,

  // 福建省
  '闽都榕城': fujian.handleFuzhouSkill,
  '妈祖之乡': fujian.handlePutianSkill,
  '海丝起点': fujian.handleQuanzhouSkill,
  '海上花园': fujian.handleXiamenSkill,
  '水仙花之乡': fujian.handleZhangzhouSkill,
  '古田会址': fujian.handleLongyanSkill,
  '闽人之源': fujian.handleSanmingSkill,
  '武夷山水': fujian.handleNanpingSkill,
  '福鼎肉片': fujian.handleNingdeSkill,

  // 江西省
  '八一记忆': jiangxi.handleNanchangSkill,
  '长征伊始': jiangxi.handleGanzhouSkill,
  '明月山': jiangxi.handleYichunSkill,
  '井冈山': jiangxi.handleJianSkill,
  '鄱阳湖': jiangxi.handleShangraoSkill,
  '庐山胜境': jiangxi.handleJiujiangSkill,
  '中国瓷都': jiangxi.handleJingdezhenSkill,

  // 海南省
  '秀英炮台': hainan.handleHaikouSkill,
  '绚丽海滨': hainan.handleSanyaSkill,
  '南海守望': hainan.handleSanshaSkill,
  '博鳌论坛': hainan.handleQionghaiSkill,
  '文昌卫星': hainan.handleWenchangSkill,
  '神州半岛': hainan.handleWanningSkill,
  '五指山': hainan.handleWuzhishanSkill,

  // 辽宁省
  '盛京荣耀': liaoning.handleShenyangSkill,
  '浪漫之都': liaoning.handleDalianSkill,
  '钢都铁壁': liaoning.handleAnshanSkill,
  '煤都重生': liaoning.handleFushunSkill,
  '本溪水洞': liaoning.handleBenxiSkill,
  '鸭绿江': liaoning.handleDandongSkill,
  '笔架山': liaoning.handleJinzhouSkill,
  '鲅鱼圈': liaoning.handleYingkouSkill,
  '玛瑙之光': liaoning.handleFuxinSkill,
  '辽阳白塔': liaoning.handleLiaoyangSkill,
  '红海滩': liaoning.handlePanjinSkill,
  '小品之乡': liaoning.handleTielingSkill,
  '兴城海滨': liaoning.handleHuludaoSkill,

  // 吉林省
  '汽车城': jilin.handleChangchunSkill,
  '雾凇奇观': jilin.handleJilinSkill,
  '查干湖冬捕': jilin.handleSongyuanSkill,
  '通化葡萄酒': jilin.handleTonghuaSkill,
  '英雄之城': jilin.handleSipingSkill,
  '梅花鹿之乡': jilin.handleLiaoyuanSkill,
  '长白山': jilin.handleYanbianSkill,

  // 河南省
  '中原枢纽': henan.handleZhengzhouSkill,
  '十三朝古都': henan.handleLuoyangSkill,
  '八朝古都': henan.handleKaifengSkill,
  '中原大佛': henan.handlePingdingshanSkill,
  '殷墟古韵': henan.handleAnyangSkill,
  '淇河灵韵': henan.handleHebiSkill,
  '牧野雄风': henan.handleXinxiangSkill,
  '云台奇景': henan.handleJiaozuoSkill,
  '魏都遗风': henan.handleXuchangSkill,
  // '黄河明珠': henan.handleSanmenxiaSkill, // 与兰州市技能名冲突，暂时注释
  '卧龙圣地': henan.handleNanyangSkill,
  '商祖故里': henan.handleShangqiuSkill,
  '信阳毛尖': henan.handleXinyangSkill,
  '伏羲故里': henan.handleZhoukouSkill,
  '王屋山': henan.handleJiyuanSkill,

  // 四川省
  '千年水利，天府之国': sichuan.handleChengduSkill,
  '诗仙故里': sichuan.handleMianyangSkill,
  '盐井花灯': sichuan.handleZigongSkill,
  '泸州老窖': sichuan.handleLuzhouSkill,
  '三星堆遗址': sichuan.handleDeyangSkill,
  '剑门蜀道': sichuan.handleGuangyuanSkill,
  '中国甜都': sichuan.handleNeijiangSkill,
  '峨眉金顶，乐山大佛': sichuan.handleLeshanSkill,
  '安岳柠檬': sichuan.handleZiyangSkill,
  '五粮液': sichuan.handleYibinSkill,
  '阆中古城': sichuan.handleNanchongSkill,
  '雾雨朦胧': sichuan.handleYaanSkill,
  '天下九寨沟': sichuan.handleAbaSkill,
  '稻城亚丁': sichuan.handleGanziSkill,
  '彝族火把节': sichuan.handleLiangshanSkill,
  '三苏祠': sichuan.handleMeishanSkill,

  // 贵州省
  '大数据中心': guizhou.handleGuiyangSkill,
  '中国凉都': guizhou.handleLiupanshuiSkill,
  '红色会址，茅台飘香': guizhou.handleZunyiSkill,
  '梵净金顶': guizhou.handleTongrenSkill,
  '中国金州': guizhou.handleQianxinanSkill,
  '百里杜鹃': guizhou.handleBijieSkill,
  '黄果树瀑布': guizhou.handleAnshunSkill,
  '歌舞之州': guizhou.handleQiandongnanSkill,
  '中国天眼': guizhou.handleQiannanSkill,

  // 云南省
  '四季如春': yunnan.handleKunmingSkill,
  '珠江源头': yunnan.handleQujingSkill,
  '玉溪烟草': yunnan.handleYuxiSkill,
  '咖啡之城': yunnan.handleBaoshanSkill,
  '昭通苹果': yunnan.handleZhaotongSkill,
  '丽江古城': yunnan.handleLijiangSkill,
  '普洱茶': yunnan.handlePuerSkill,
  '茶马古道': yunnan.handleLinchangSkill,
  '人类摇篮': yunnan.handleChuxiongSkill,
  '哈尼梯田': yunnan.handleHongheSkill,
  '三七粉': yunnan.handleWenshanSkill,
  '西双版纳': yunnan.handleXishuangbannaSkill,
  '白族之乡': yunnan.handleDaliSkill,
  '三江并流': yunnan.handleNujiangSkill,
  '香格里拉': yunnan.handleDiqingSkill,

  // 西藏自治区
  '布达拉宫': xizang.handleLasaSkill,
  '珠穆朗玛峰': xizang.handleRikazeSkill,
  '雅鲁藏布大峡谷': xizang.handleLinzhiSkill,
  '冈仁波齐': xizang.handleAliSkill,

  // 甘肃省
  '黄河明珠': gansu.handleLanzhouSkill, // 注意：与三门峡市技能名冲突
  '嘉峪关': gansu.handleJiayuguanSkill,
  '七彩丹霞': gansu.handleZhangyeSkill,
  '莫高窟': gansu.handleJiuquanSkill,

  // 宁夏回族自治区
  '青铜峡': ningxia.handleWuzhongSkill,

  // 新疆维吾尔自治区
  '亚洲中心': xinjiang.handleWulumuqiSkill,
  '黑油山，魔鬼城': xinjiang.handleKelamayiSkill,
  '红山，洼地': xinjiang.handleTulufanSkill,
  '甜蜜之旅': xinjiang.handleHamiSkill,
  '天山，天池': xinjiang.handleChangjiSkill,
  '西洋之泪': xinjiang.handleBoertalaSkill,
  '罗布泊': xinjiang.handleBayinguolengSkill,
  '冰糖心': xinjiang.handleAkesuSkill,
  '喀喇昆仑': xinjiang.handleKashiSkill,
  '玉石之路': xinjiang.handleHetianSkill,
  '丝路风情，塞外江南': xinjiang.handleYiliSkill,
  '沙湾大盘鸡': xinjiang.handleTachengSkill,
  '水塔雪都，额河之源': xinjiang.handleAletaiSkill,
  '军垦第一连': xinjiang.handleShiheziSkill
}

/**
 * 处理激活的城市技能
 * @param {Object} attacker - 攻击方玩家
 * @param {Object} attackerState - 攻击方状态
 * @param {Object} defender - 防守方玩家
 * @param {Array} defenderCities - 防守方出战城市
 * @param {Function} addPublicLog - 添加公共日志的函数
 * @param {Object} gameStore - 游戏状态存储
 */
export function processActivatedCitySkills(attacker, attackerState, defender, defenderCities, addPublicLog, gameStore) {
  console.log('[城市技能] processActivatedCitySkills 被调用')
  console.log('[城市技能] attacker:', attacker.name)
  console.log('[城市技能] attackerState.activatedCitySkills:', attackerState.activatedCitySkills)

  if (!attackerState.activatedCitySkills) {
    console.log('[城市技能] 没有激活的城市技能，跳过处理')
    return
  }

  const skillCount = Object.keys(attackerState.activatedCitySkills).length
  console.log(`[城市技能] ${attacker.name} 共激活了 ${skillCount} 个城市技能`)

  Object.keys(attackerState.activatedCitySkills).forEach(cityName => {
    const skillData = attackerState.activatedCitySkills[cityName]
    console.log(`[城市技能] 处理技能: ${skillData.skillName} (城市名: ${cityName})`)

    const handler = SKILL_HANDLERS[skillData.skillName]

    if (handler) {
      console.log(`[城市技能] 找到处理函数，执行: ${skillData.skillName}`)
      try {
        // 根据技能类型调用不同的处理函数签名
        if (needsDefenderCities(skillData.skillName)) {
          handler(attacker, defender, defenderCities, skillData, addPublicLog, gameStore)
        } else if (needsDefender(skillData.skillName)) {
          handler(attacker, defender, skillData, addPublicLog, gameStore)
        } else {
          handler(attacker, skillData, addPublicLog, gameStore)
        }
        console.log(`[城市技能] 技能 ${skillData.skillName} 执行成功`)
      } catch (error) {
        console.error(`执行技能"${skillData.skillName}"时出错:`, error)
        addPublicLog(`技能"${skillData.skillName}"执行失败`)
      }
    } else {
      console.warn(`未找到技能"${skillData.skillName}"的处理函数`)
      addPublicLog(`${attacker.name}的${skillData.cityName}激活"${skillData.skillName}"（尚未实现）`)
    }
  })
}

/**
 * 判断技能是否需要defenderCities参数
 */
function needsDefenderCities(skillName) {
  const skillsNeedingDefenderCities = [
    '首都权威', '山城迷踪', '恐龙震慑', '园林迷阵', '泉城水攻',
    '青岛啤酒', '三国战场', '侨风碉楼', '三头一掌'
  ]
  return skillsNeedingDefenderCities.includes(skillName)
}

/**
 * 判断技能是否需要defender参数
 */
function needsDefender(skillName) {
  const skillsNeedingDefender = [
    '赌城风云', '千年商都', '丹霞古韵', '河源市', '中山市',
    '隆中景区', '火烧赤壁', '南通小卷',
    '风筝探测', '泰山压顶', '物流之都',
    '冰城奇观', '林都迷踪'
  ]
  return skillsNeedingDefender.includes(skillName)
}

// 导出所有技能处理函数供外部使用
export {
  municipalities,
  jiangsu,
  zhejiang,
  shandong,
  hubei,
  guangdong,
  heilongjiang,
  hunan,
  hebei,
  shanxi,
  neimenggu,
  fujian,
  jiangxi,
  hainan,
  liaoning,
  jilin,
  henan,
  sichuan,
  guizhou,
  yunnan,
  xizang,
  gansu,
  ningxia,
  xinjiang
}
