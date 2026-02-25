#!/usr/bin/env python3
"""
批量为技能添加金币检查的脚本
"""

import re

# 需要添加金币检查的技能及其成本（已经处理过的除外）
skills_to_fix = {
    'executeShiLaiYunZhuan': '时来运转',
    'executeXianShengDuoRen': '先声夺人',
    'executeJinBiDaiKuan': '金币贷款',
    'executeDingHaiShenZhen': '定海神针',
    'executeHuanRanYiXin': '焕然一新',
    'executeGouYanCanChuan': '苟延残喘',
    'executeGaoJiZhiLiao': '高级治疗',
    'executeZhongZhiChengCheng': '众志成城',
    'executeWuZhongShengYou': '无中生有',
    'executeHaoGaoWuYuan': '好高骛远',
    'executeHuJiaHuWei': '狐假虎威',
    'executePaoZhuanYinYu': '抛砖引玉',
    'executeJinZhiNiuQu': '进制扭曲',
    'executeTiDengDingSun': '提灯定损',
    'executeLianXuDaJi': '连续打击',
    'executeBoTaoXiongYong': '波涛汹涌',
    'executeKuangHongLanZha': '狂轰滥炸',
    'executeHengSaoYiKong': '横扫一空',
    'executeWanJianQiFa': '万箭齐发',
    'executeJiangWeiDaJi': '降维打击',
    'executeShenCangBuLu': '深藏不露',
    'executeDingShiBaoPo': '定时爆破',
    'executeYongJiuCuiHui': '永久摧毁',
    'executeZhanLueZhuanYi': '战略转移',
    'executeLianSuoFanYing': '连锁反应',
    'executeZhaoXianNaShi': '招贤纳士',
    'executeWuXieKeJi': '无懈可击',
    'executeJianBuKeCui': '坚不可摧',
    'executeYiHuaJieMu': '移花接木',
    'executeBuLuZongJi': '不露踪迹',
    'executeZhengQiHuaYi': '整齐划一',
    'executeRenZhiJiaoHuan': '人质交换',
    'executeFuDiChouXin': '釜底抽薪',
}

# 生成插入代码
gold_check_template = """    // 金币检查和扣除
    const goldCheck = checkAndDeductGold('{skill_name}', caster, gameStore)
    if (!goldCheck.success) {{
      return goldCheck
    }}
"""

print("需要为以下技能添加金币检查：")
for func_name, skill_name in skills_to_fix.items():
    print(f"- {func_name} ({skill_name})")

print(f"\n总计：{len(skills_to_fix)}个技能")
