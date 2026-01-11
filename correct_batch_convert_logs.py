#!/usr/bin/env python3
"""
正确转换日志调用为双日志系统
关键要求：
1. 公开日志：保持原样，必须包含 ${caster.name}
2. 私密日志：${caster.name}使用了XXX技能（不是"你使用了"）
"""

import re
import sys

# 技能名称映射（函数名 -> 中文名）
SKILL_MAP = {
    'TransferGold': '转账给他人', 'WuZhiWuWei': '无知无畏', 'KuaiSuZhiLiao': '快速治疗',
    'CityProtection': '城市保护', 'GangTieChengShi': '钢铁城市', 'ShiLiZengQiang': '实力增强',
    'JieShiHuanHun': '借尸还魂', 'ShiQiDaZhen': '士气大振', 'QingChuJiaCheng': '清除加成',
    'ShiLaiYunZhuan': '时来运转', 'XianShengDuoRen': '先声夺人', 'JinBiDaiKuan': '金币贷款',
    'DingHaiShenZhen': '定海神针', 'HuanRanYiXin': '焕然一新', 'GouYanCanChuan': '苟延残喘',
    'GaoJiZhiLiao': '高级治疗', 'ZhongZhiChengCheng': '众志成城', 'WuZhongShengYou': '无中生有',
    'HaoGaoWuYuan': '好高骛远', 'HuJiaHuWei': '狐假虎威', 'JinZhiNiuQu': '进制扭曲',
    'TiDengDingSun': '提灯定损', 'LianXuDaJi': '连续打击', 'BoTaoXiongYong': '波涛汹涌',
    'KuangHongLanZha': '狂轰滥炸', 'HengSaoYiKong': '横扫一空', 'WanJianQiFa': '万箭齐发',
    'JiangWeiDaJi': '降维打击', 'ShenCangBuLu': '深藏不露', 'DingShiBaoPo': '定时爆破',
    'YongJiuCuiHui': '永久摧毁', 'LianSuoFanYing': '连锁反应', 'SiMianChuGe': '四面楚歌',
    'BanYunJiuBing': '搬运救兵', 'DaYiMieQin': '大义灭亲', 'QiangZhiBanYun': '强制搬运',
    'DaiXingShengQuan': '代行省权', 'ShouWangXiangZhu': '守望相助', 'XingZhengZhongXin': '行政中心',
    'YiLiLaiJiang': '以礼来降', 'ChenQiBuBei': '趁其不备', 'RenZhiJiaoHuan': '人质交换',
    'GaiXianGengZhang': '改弦更张', 'BaQiYiZhi': '拔旗易帜', 'BiErBuJian': '避而不见',
    'LiDaiTaoJiang': '李代桃僵', 'ShuWeiFanZhuan': '数位反转', 'ZhanLueZhuanYi': '战略转移',
    'DaoFanTianGang': '倒反天罡', 'CityDetective': '城市侦探', 'CityProphecy': '城市预言',
    'MingChaQiuHao': '明察秋毫', 'YiJuLiangDe': '一举两得', 'BuLuZongJi': '不露踪迹',
    'BoXueDuoCai': '博学多才', 'JianBuKeCui': '坚不可摧', 'BuBuGaoSheng': '步步高升',
    'HaiShiShenLou': '海市蜃楼', 'FuZhongXinZhi': '副中心制', 'ShengYuZiShi': '生于紫室',
    'JiNengBaoHu': '技能保护', 'ZhengQiHuaYi': '整齐划一', 'TianZaiRenHuo': '天灾人祸',
    'ZiXiangCanSha': '自相残杀', 'ZhongYongZhiDao': '中庸之道', 'YiWeiPingDi': '夷为平地',
    'ZhaoXianNaShi': '招贤纳士', 'WuXieKeJi': '无懈可击', 'ShiBanGongBei': '事半功倍',
    'GuoHeChaiQiao': '过河拆桥', 'JieChuFengSuo': '解除封锁', 'YiChuJiFa': '一触即发',
    'TuPoiPingJing': '突破瓶颈', 'DangJiLiDuan': '当机立断', 'QiangZhiQianDu': '强制迁都',
    'YanTingJiCong': '言听计从', 'DianCiGanYing': '电磁感应', 'HouJiBaoFa': '厚积薄发',
    'HpBank': '血量存储', 'FuDiChouXin': '釜底抽薪', 'FinancialCrisis': '金融危机',
    'JiHuaDanLie': '计划单列'
}

def find_skill_name(lines, line_idx):
    """向上查找最近的函数定义，确定技能名称"""
    for i in range(line_idx, max(0, line_idx - 100), -1):
        match = re.match(r'\s*function execute(\w+)\(', lines[i])
        if match:
            func_name = match.group(1)
            return SKILL_MAP.get(func_name, None)
    return None

def is_effect_log(message):
    """判断是否为纯效果日志（不包含 ${caster.name} 使用技能的描述）"""
    # 不包含 ${caster.name} 的是效果日志
    if '${caster.name}' not in message:
        return True
    # 包含"屏障"、"被摧毁"、"受到伤害"等纯效果描述
    effect_keywords = ['屏障', '被摧毁', '受到', '吸收', '剩余', '清除了', '阵亡', '复活']
    for keyword in effect_keywords:
        if keyword in message and '使用' not in message:
            return True
    return False

def extract_skill_from_message(message):
    """从日志消息中提取技能名称"""
    # 匹配 "使用XXX" 或 "使用XXX，"
    match = re.search(r'使用([^，,。]+)', message)
    if match:
        return match.group(1).strip()
    return None

def convert_log_line(line, skill_name):
    """转换单行日志调用"""
    # 提取日志消息
    match = re.search(r'gameStore\.addLog\(`([^`]+)`\)', line)
    if not match:
        return line  # 不匹配，保持原样

    message = match.group(1)
    indent = len(line) - len(line.lstrip())
    spaces = ' ' * indent

    # 判断是否为效果日志
    if is_effect_log(message):
        return f"{spaces}addSkillEffectLog(gameStore, `{message}`)"

    # 技能使用日志 - 需要生成双日志
    # 如果没有从函数名获得技能名，尝试从消息中提取
    if not skill_name:
        skill_name = extract_skill_from_message(message)

    if not skill_name:
        # 无法确定技能名，保持原样
        return line

    # 公开日志：保持原样（已包含 ${caster.name}）
    public_msg = message

    # 私密日志：${caster.name}使用了XXX
    private_msg = f'${{caster.name}}使用了{skill_name}'

    return f"""{spaces}// 双日志
{spaces}addSkillUsageLog(
{spaces}  gameStore,
{spaces}  caster.name,
{spaces}  '{skill_name}',
{spaces}  `{public_msg}`,
{spaces}  `{private_msg}`
{spaces})"""

def main():
    filepath = 'src/composables/skills/nonBattleSkills.js'

    print(f"读取文件: {filepath}")
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    print(f"文件总行数: {len(lines)}")

    # 统计待转换的日志调用
    log_count = sum(1 for line in lines if 'gameStore.addLog' in line)
    print(f"找到 {log_count} 个待转换的日志调用")

    # 转换
    converted_lines = []
    converted_count = 0

    for i, line in enumerate(lines):
        if 'gameStore.addLog' in line:
            skill_name = find_skill_name(lines, i)
            new_line = convert_log_line(line, skill_name)
            if new_line != line.rstrip():
                converted_count += 1
                if converted_count <= 5:  # 只显示前5个示例
                    print(f"\n--- 第{converted_count}个转换示例 (line {i+1}) ---")
                    print(f"技能: {skill_name}")
                    print(f"原: {line.rstrip()}")
                    print(f"新: {new_line}")
                converted_lines.append(new_line + '\n')
            else:
                converted_lines.append(line)
        else:
            converted_lines.append(line)

    # 保存
    backup_path = filepath + '.before_correct'
    print(f"\n备份原文件到: {backup_path}")
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print(f"写入转换后的文件: {filepath}")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(converted_lines)

    print(f"\n✅ 转换完成！")
    print(f"   - 总共转换: {converted_count} 个日志调用")
    print(f"   - 请检查文件并测试功能")

if __name__ == '__main__':
    main()
