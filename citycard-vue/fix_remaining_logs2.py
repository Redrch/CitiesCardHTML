#!/usr/bin/env python3
"""
处理剩余的复杂格式 gameStore.addLog 调用
"""

import re

def process_remaining_logs(filepath):
    """处理剩余的复杂日志调用"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 模式1: gameStore.addLog(variable) - 使用变量的日志
    # 这些假设为效果日志（因为无法判断内容）
    content = re.sub(
        r'gameStore\.addLog\((\w+)\)',
        r'addSkillEffectLog(gameStore, \1)',
        content
    )

    # 模式2: 多行 gameStore.addLog(\n      `...`\n    )
    def replace_multiline(match):
        full_match = match.group(0)
        message = match.group(1)

        # 判断是否包含 ${caster.name}
        if '${caster.name}' not in message:
            return f'addSkillEffectLog(gameStore, `{message}`)'

        # 判断是否为技能使用日志（包含"使用"）
        if '使用' in message:
            # 提取技能名
            skill_match = re.search(r'使用([^，,。]+)', message)
            skill_name = skill_match.group(1).strip() if skill_match else '技能'

            # 公开日志：保持原样（包含 ${caster.name}）
            public_msg = message

            # 私密日志：${caster.name}使用了XXX
            private_msg = f'${{caster.name}}使用了{skill_name}'

            result = f'''// 双日志
    addSkillUsageLog(
      gameStore,
      caster.name,
      '{skill_name}',
      `{public_msg}`,
      `{private_msg}`
    )'''
            return result
        else:
            # 效果日志
            return f'addSkillEffectLog(gameStore, `{message}`)'

    # 匹配多行模板字符串
    content = re.sub(
        r'gameStore\.addLog\(\s*\n\s*`([^`]+)`\s*\n\s*\)',
        replace_multiline,
        content,
        flags=re.MULTILINE
    )

    return content

def main():
    filepath = 'src/composables/skills/nonBattleSkills.js'

    print(f"处理文件: {filepath}")

    # 备份
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    log_count_before = original.count('gameStore.addLog')
    print(f"处理前: {log_count_before} 个 gameStore.addLog 调用")

    # 处理
    new_content = process_remaining_logs(filepath)

    log_count_after = new_content.count('gameStore.addLog')
    print(f"处理后: {log_count_after} 个 gameStore.addLog 调用")
    print(f"转换了: {log_count_before - log_count_after} 个调用")

    # 保存
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"\n✅ 完成！剩余 {log_count_after} 个需要手动处理")

if __name__ == '__main__':
    main()
