#!/usr/bin/env python3
"""
自动转换 nonBattleSkills.js 中的日志调用为双日志系统
"""

import re

def extract_skill_name_from_function(func_name):
    """从函数名提取技能名称"""
    # 函数名模式：execute + 技能拼音
    skill_map = {
        'TransferGold': '转账给他人',
        'WuZhiWuWei': '无知无畏',
        'KuaiSuZhiLiao': '快速治疗',
        'CityProtection': '城市保护',
        'GangTieChengShi': '钢铁城市',
        'ShiLiZengQiang': '实力增强',
        'JieShiHuanHun': '借尸还魂',
        'ShiQiDaZhen': '士气大振',
        'QingChuJiaCheng': '清除加成',
        'ShiLaiYunZhuan': '时来运转',
        'XianShengDuoRen': '先声夺人',
        'JinBiDaiKuan': '金币贷款',
        'DingHaiShenZhen': '定海神针',
        'HuanRanYiXin': '焕然一新',
        'GouYanCanChuan': '苟延残喘',
        'GaoJiZhiLiao': '高级治疗',
        'ZhongZhiChengCheng': '众志成城',
        'WuZhongShengYou': '无中生有',
        'HaoGaoWuYuan': '好高骛远',
        'HuJiaHuWei': '狐假虎威',
        'PaoZhuanYinYu': '抛砖引玉',  # 注意：这个在battleSkills中
        'JinZhiNiuQu': '进制扭曲',
        'TiDengDingSun': '提灯定损',
        'LianXuDaJi': '连续打击',
        'BoTaoXiongYong': '波涛汹涌',
        'KuangHongLanZha': '狂轰滥炸',
        'HengSaoYiKong': '横扫一空',
        'WanJianQiFa': '万箭齐发',
        'JiangWeiDaJi': '降维打击',
        'ShenCangBuLu': '深藏不露',
        'DingShiBaoPo': '定时爆破',
        'YongJiuCuiHui': '永久摧毁',
        'LianSuoFanYing': '连锁反应',
        'SiMianChuGe': '四面楚歌',
        'BanYunJiuBing': '搬运救兵',
        'DaYiMieQin': '大义灭亲',
        'QiangZhiBanYun': '强制搬运',
        'DaiXingShengQuan': '代行省权',
        'ShouWangXiangZhu': '守望相助',
        'XingZhengZhongXin': '行政中心',
        'YiLiLaiJiang': '以礼来降',
        'ChenQiBuBei': '趁其不备',
        'RenZhiJiaoHuan': '人质交换',
        'GaiXianGengZhang': '改弦更张',
        'BaQiYiZhi': '拔旗易帜',
        'BiErBuJian': '避而不见',
        'LiDaiTaoJiang': '李代桃僵',
        'ShuWeiFanZhuan': '数位反转',
        'ZhanLueZhuanYi': '战略转移',
        'DaoFanTianGang': '倒反天罡',
        'CityDetective': '城市侦探',
        'CityProphecy': '城市预言',
        'MingChaQiuHao': '明察秋毫',
        'YiJuLiangDe': '一举两得',
        'BuLuZongJi': '不露踪迹',
        'BoXueDuoCai': '博学多才',
        'JianBuKeCui': '坚不可摧',
        'BuBuGaoSheng': '步步高升',
        'HaiShiShenLou': '海市蜃楼',
        'FuZhongXinZhi': '副中心制',
        'ShengYuZiShi': '生于紫室',
        'JiNengBaoHu': '技能保护',
        'ZhengQiHuaYi': '整齐划一',
        'TianZaiRenHuo': '天灾人祸',
        'ZiXiangCanSha': '自相残杀',
        'ZhongYongZhiDao': '中庸之道',
        'YiWeiPingDi': '夷为平地',
        'ZhaoXianNaShi': '招贤纳士',
        'WuXieKeJi': '无懈可击',
        'ShiBanGongBei': '事半功倍',
        'GuoHeChaiQiao': '过河拆桥',
        'JieChuFengSuo': '解除封锁',
        'YiChuJiFa': '一触即发',
        'TuPoiPingJing': '突破瓶颈',
        'DangJiLiDuan': '当机立断',
        'QiangZhiQianDu': '强制迁都',
        'YanTingJiCong': '言听计从',
        'DianCiGanYing': '电磁感应',
        'HouJiBaoFa': '厚积薄发',
        'HpBank': '血量存储',
        'FuDiChouXin': '釜底抽薪',
        'FinancialCrisis': '金融危机',
        'JiHuaDanLie': '计划单列'
    }

    for eng, chn in skill_map.items():
        if eng in func_name:
            return chn

    return None

def is_skill_usage_log(log_content, current_function):
    """判断是否为技能使用日志（包含玩家使用技能的信息）"""
    # 如果日志以玩家名开头并且包含"使用"，很可能是技能使用日志
    if '${caster.name}' in log_content and ('使用' in log_content or '转账' in log_content or '对' in log_content):
        return True

    # 如果只是描述效果，不是技能使用日志
    if not '${caster.name}' in log_content:
        return False

    return True

def convert_log_call(log_call, skill_name, current_function):
    """转换单个日志调用"""
    # 提取日志内容
    match = re.search(r'gameStore\.addLog\(`([^`]+)`\)', log_call, re.DOTALL)
    if not match:
        return None

    message = match.group(1)

    # 检查是否包含 caster.name
    has_caster = '${caster.name}' in message

    if not has_caster:
        # 纯效果日志
        return f'addSkillEffectLog(gameStore, `{message}`)'

    # 技能使用日志 - 需要生成公开和私密消息
    # 移除 ${caster.name} 生成公开消息
    public_msg = re.sub(r'\$\{caster\.name\}\s*', '', message)
    public_msg = re.sub(r'\$\{caster\.name\}', '', public_msg)

    # 私密消息
    if not skill_name:
        private_msg = '你使用了技能'
    else:
        private_msg = f'你使用了{skill_name}'

    # 检查是否被阻挡
    if '坚不可摧护盾阻挡' in message or '护盾抵消' in message:
        # 被阻挡的情况，公开消息保持原样
        result = f'''addSkillUsageLog(
      gameStore,
      caster.name,
      '{skill_name}',
      `{message}`,
      `{private_msg}，但被阻挡`
    )'''
    else:
        result = f'''addSkillUsageLog(
      gameStore,
      caster.name,
      '{skill_name}',
      `{public_msg}`,
      `{private_msg}`
    )'''

    return result

# 读取文件
with open('src/composables/skills/nonBattleSkills.js', 'r', encoding='utf-8') as f:
    content = f.read()

print(f"文件总字符数: {len(content)}")
print(f"需要转换的日志调用数量: {content.count('gameStore.addLog')}")
print("\n由于文件太大且模式复杂，建议使用手动转换或分批处理。")
print("此脚本仅作为参考。")
