/**
 * 技能效果执行器
 * 实现具体技能的游戏逻辑效果
 */

import { useGameStore } from '../stores/gameStore'
import { calculateCityPower, getProvinceName } from '../utils/cityHelpers'
import { useBattleSkills } from './skills/battleSkills'
import { useNonBattleSkills } from './skills/nonBattleSkills'

export function useSkillEffects() {
  const gameStore = useGameStore()

  // 初始化战斗技能和非战斗技能
  const battleSkills = useBattleSkills()
  const nonBattleSkills = useNonBattleSkills()

  /**
   * 执行技能效果
   * @param {string} skillName - 技能名称
   * @param {Object} params - 技能参数
   * @returns {Object} 执行结果
   */
  function executeSkillEffect(skillName, params) {
    const {
      caster,        // 施法者（玩家对象）
      target,        // 目标玩家
      targetCity,    // 目标城市
      selfCity,      // 自己的城市
      amount         // 数值参数
    } = params

    try {
      switch (skillName) {
        // === 战斗金币技能 ===

        case '擒贼擒王':
          return battleSkills.executeQinZeiQinWang(caster, target)

        case '草木皆兵':
          return battleSkills.executeCaoMuJieBing(caster, target)

        case '越战越勇':
          return battleSkills.executeYueZhanYueYong(caster, selfCity)

        case '吸引攻击':
          return battleSkills.executeXiYinGongJi(caster, selfCity)

        case '铜墙铁壁':
          return battleSkills.executeTongQiangTieBi(caster, target)

        case '背水一战':
          return battleSkills.executeBeiShuiYiZhan(caster, selfCity)

        case '料事如神':
          return battleSkills.executeLiaoShiRuShen(caster, target, targetCity)

        case '同归于尽':
          return battleSkills.executeTongGuiYuJin(caster, selfCity)

        case '设置屏障':
          return battleSkills.executeSetBarrier(caster)

        case '潜能激发':
          return battleSkills.executeQianNengJiFa(caster)

        // === 非战斗金币技能 ===

        case '转账给他人':
          return nonBattleSkills.executeTransferGold(caster, target, amount)

        case '无知无畏':
          return nonBattleSkills.executeWuZhiWuWei(caster, target)

        case '快速治疗':
          return nonBattleSkills.executeKuaiSuZhiLiao(caster, selfCity)

        case '城市保护':
          return nonBattleSkills.executeCityProtection(caster, selfCity)

        case '钢铁城市':
          return nonBattleSkills.executeGangTieChengShi(caster, selfCity)

        case '实力增强':
          return nonBattleSkills.executeShiLiZengQiang(caster, selfCity)

        case '借尸还魂':
          return nonBattleSkills.executeJieShiHuanHun(caster, selfCity)

        case '士气大振':
          return nonBattleSkills.executeShiQiDaZhen(caster)

        case '清除加成':
          return nonBattleSkills.executeQingChuJiaCheng(caster, target, targetCity)

        case '时来运转':
          return nonBattleSkills.executeShiLaiYunZhuan(caster, target)

        // === 更多非战斗技能 ===

        case '先声夺人':
          return nonBattleSkills.executeXianShengDuoRen(caster, target)

        case '金币贷款':
          return nonBattleSkills.executeJinBiDaiKuan(caster)

        case '定海神针':
          return nonBattleSkills.executeDingHaiShenZhen(caster, selfCity)

        case '焕然一新':
          return nonBattleSkills.executeHuanRanYiXin(caster, selfCity)

        case '苟延残喘':
          return nonBattleSkills.executeGouYanCanChuan(caster)

        case '高级治疗':
          return nonBattleSkills.executeGaoJiZhiLiao(caster, params.cityNames)

        case '众志成城':
          return nonBattleSkills.executeZhongZhiChengCheng(caster, params.cityNames)

        case '无中生有':
          return nonBattleSkills.executeWuZhongShengYou(caster)

        case '点石成金':
          return nonBattleSkills.executeHaoGaoWuYuan(caster, selfCity)

        case '狐假虎威':
          return nonBattleSkills.executeHuJiaHuWei(caster, selfCity)

        case '御驾亲征':
          return battleSkills.executeYuJiaQinZheng(caster, target)

        case '狂暴模式':
          return battleSkills.executeKuangBaoMoShi(caster, selfCity)

        case '按兵不动':
          return battleSkills.executeAnBingBuDong(caster)

        case '既来则安':
          return battleSkills.executeJiLaiZeAn(caster, selfCity)

        case '抛砖引玉':
          return nonBattleSkills.executePaoZhuanYinYu(caster)

        case '进制扭曲':
          return nonBattleSkills.executeJinZhiNiuQu(caster, target, targetCity)

        case '一落千丈':
          return nonBattleSkills.executeTiDengDingSun(caster, target, targetCity)

        case '连续打击':
          return nonBattleSkills.executeLianXuDaJi(caster, target, params.cityNames)

        case '波涛汹涌':
          return nonBattleSkills.executeBoTaoXiongYong(caster, target)

        case '狂轰滥炸':
          return nonBattleSkills.executeKuangHongLanZha(caster, target)

        case '横扫一空':
          return nonBattleSkills.executeHengSaoYiKong(caster, target)

        case '万箭齐发':
          return nonBattleSkills.executeWanJianQiFa(caster, target, targetCity)

        case '降维打击':
          return nonBattleSkills.executeJiangWeiDaJi(target, targetCity)

        case '深藏不露':
          return nonBattleSkills.executeShenCangBuLu(caster, selfCity)

        case '定时爆破':
          return nonBattleSkills.executeDingShiBaoPo(caster, target, targetCity)

        case '灰飞烟灭':
          return nonBattleSkills.executeYongJiuCuiHui(caster, target, targetCity)

        case '战略转移':
          return nonBattleSkills.executeZhanLueZhuanYi(caster, selfCity)

        case '连锁反应':
          return nonBattleSkills.executeLianSuoFanYing(caster, target, targetCity)

        case '招贤纳士':
          return nonBattleSkills.executeZhaoXianNaShi(caster, target)

        case '无懈可击':
          return nonBattleSkills.executeWuXieKeJi(caster, target)

        case '坚不可摧':
          return nonBattleSkills.executeJianBuKeCui(caster)

        case '移花接木':
          return nonBattleSkills.executeYiHuaJieMu(caster, target)

        case '不露踪迹':
          return nonBattleSkills.executeBuLuZongJi(caster)

        case '整齐划一':
          return nonBattleSkills.executeZhengQiHuaYi(caster, target)

        case '人质交换':
          return nonBattleSkills.executeRenZhiJiaoHuan(caster, target)

        case '釜底抽薪':
          return nonBattleSkills.executeFuDiChouXin(caster, target)

        case '反戈一击':
          return battleSkills.executeFanGeYiJi(caster, target)

        case '暗度陈仓':
          return battleSkills.executeAnDuChenCang(caster)

        case '声东击西':
          return battleSkills.executeShengDongJiXi(caster, target)

        case '以逸待劳':
          return battleSkills.executeYiYiDaiLao(caster, target)

        case '草船借箭':
          return battleSkills.executeCaoChuanJieJian(caster, target)

        case '围魏救赵':
          return battleSkills.executeWeiWeiJiuZhao(caster, target)

        case '欲擒故纵':
          return battleSkills.executeYuQinGuZong(caster, target, targetCity)

        case '晕头转向':
          return battleSkills.executeYunTouZhuanXiang(caster, target)

        case '隔岸观火':
          return battleSkills.executeGeAnGuanHuo(caster, target)

        case '挑拨离间':
          return battleSkills.executeTiaoBoBaoLiJian(caster, target)

        default:
          return {
            success: false,
            message: `技能 ${skillName} 效果尚未实现`
          }
      }
    } catch (error) {
      console.error(`技能执行错误: ${skillName}`, error)
      return {
        success: false,
        message: `技能执行失败: ${error.message}`
      }
    }
  }

  return {
    executeSkillEffect
  }
}
