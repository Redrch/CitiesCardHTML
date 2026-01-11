#!/usr/bin/env python3
"""
处理多行和复杂格式的 gameStore.addLog 调用
"""

import re

def process_multiline_logs(filepath):
    """处理多行的 gameStore.addLog 调用"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 模式1: gameStore.addLog(variable) - 使用变量的日志
    # 这些需要保持为效果日志，因为无法判断内容
    content = re.sub(
        r'gameStore\.addLog\((\w+)\)',
        r'addSkillEffectLog(gameStore, \1)',
        content
    )

    # 模式2: 多行 gameStore.addLog(`...\n...`)
    # 匹配跨行的模板字符串
    def replace_multiline(match):
        full_match = match.group(0)
        message = match.group(1)

        # 判断是否为效果日志
        if '${caster.name}' not in message:
            return f'addSkillEffectLog(gameStore, `{message}`)'

        # 技能使用日志 - 移除玩家名
        public_msg = re.sub(r'\$\{caster\.name\}\s*', '', message)
        public_msg = re.sub(r'\$\{caster\.name\}', '', public_msg)

        # 由于多行且复杂，使用通用私密消息
        result = f'''addSkillUsageLog(
      gameStore,
      caster.name,
      '技能',  // TODO: 手动填写技能名
      `{public_msg}`,
      `你使用了技能`  // TODO: 手动完善消息
    )'''
        return result

    content = re.sub(
        r'gameStore\.addLog\(`([^`]*\n[^`]*)`\)',
        replace_multiline,
        content,
        flags=re.MULTILINE
    )

    # 模式3: gameStore.addLog(\n      `...`\n    )
    content = re.sub(
        r'gameStore\.addLog\(\s*\n\s*`([^`]+)`\s*\n\s*\)',
        lambda m: f'addSkillEffectLog(gameStore, `{m.group(1)}`)',
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
    new_content = process_multiline_logs(filepath)

    log_count_after = new_content.count('gameStore.addLog')
    print(f"处理后: {log_count_after} 个 gameStore.addLog 调用")
    print(f"转换了: {log_count_before - log_count_after} 个调用")

    # 保存
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"\n✅ 完成！剩余 {log_count_after} 个需要手动处理")

if __name__ == '__main__':
    main()
