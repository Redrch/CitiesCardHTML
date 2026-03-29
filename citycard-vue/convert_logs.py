#!/usr/bin/env python3
"""
将battleSkills.js中的gameStore.addLog()调用转换为双日志系统
"""

import re

def extract_skill_name_from_log(log_message):
    """从日志消息中提取技能名称"""
    # 尝试匹配 "使用了XXX" 或 "使用XXX" 模式
    patterns = [
        r'使用了?([^，]+?)，',
        r'使用了?([^，]+?)$',
        r'对.*使用了?([^，]+?)，'
    ]
    for pattern in patterns:
        match = re.search(pattern, log_message)
        if match:
            return match.group(1).strip()
    return None

def convert_log_to_dual(log_call, caster_var='caster'):
    """
    将单个gameStore.addLog()调用转换为双日志调用
    """
    # 提取日志消息内容
    match = re.search(r'gameStore\.addLog\(`([^`]+)`\)', log_call)
    if not match:
        return None

    message = match.group(1)

    # 检测是否包含${caster.name}
    has_caster = '${' + caster_var + '.name}' in message

    if not has_caster:
        # 纯效果日志，使用addSkillEffectLog
        return f'addSkillEffectLog(gameStore, `{message}`)'

    # 提取技能名称
    skill_name = extract_skill_name_from_log(message)
    if not skill_name:
        # 无法提取技能名，使用通用模式
        public_msg = message.replace('${' + caster_var + '.name}', '')
        private_msg = f'你使用了技能'
    else:
        # 生成公开消息（移除玩家名）
        public_msg = re.sub(r'\$\{' + caster_var + r'\.name\}\s*', '', message)
        public_msg = re.sub(r'\$\{caster\.name\}对\s*', '', public_msg)
        public_msg = re.sub(r'\$\{caster\.name\}使用', '使用', public_msg)
        private_msg = f'你使用了{skill_name}'

    # 生成双日志调用
    result = f'''addSkillUsageLog(
      gameStore,
      {caster_var}.name,
      '{skill_name}',
      `{public_msg}`,
      `{private_msg}`
    )'''

    return result

# 测试
test_log = 'gameStore.addLog(`${caster.name}使用按兵不动，本轮不出战任何城市`)'
print(convert_log_to_dual(test_log))
