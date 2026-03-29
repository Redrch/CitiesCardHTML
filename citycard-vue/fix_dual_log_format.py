#!/usr/bin/env python3
"""
修正双日志格式：
1. 私密日志：${caster.name}使用了XXX（不是"你使用了"）
2. 公开日志：必须包含 ${caster.name}
"""

import re
import sys

def fix_battle_skills():
    """修正 battleSkills.js"""
    filepath = 'src/composables/skills/battleSkills.js'

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 备份
    with open(filepath + '.before_fix', 'w', encoding='utf-8') as f:
        f.write(content)

    # 模式1: 修正所有 '你使用了' -> '${caster.name}使用了'
    # 但要注意只替换私密日志中的，不要替换注释中的
    content = re.sub(
        r"'你使用了([^']+)'",
        r"'${caster.name}使用了\1'",
        content
    )

    # 模式2: 修正所有 `你使用了 -> `${caster.name}使用了
    content = re.sub(
        r"`你使用了([^`]+)`",
        r"`${caster.name}使用了\1`",
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ 修正 {filepath}")

def fix_non_battle_skills():
    """修正 nonBattleSkills.js"""
    filepath = 'src/composables/skills/nonBattleSkills.js'

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 备份
    with open(filepath + '.before_fix', 'w', encoding='utf-8') as f:
        f.write(content)

    # 模式1: 修正所有 '你使用了' -> '${caster.name}使用了'
    content = re.sub(
        r"'你使用了([^']+)'",
        r"'${caster.name}使用了\1'",
        content
    )

    # 模式2: 修正所有 `你使用了 -> `${caster.name}使用了
    content = re.sub(
        r"`你使用了([^`]+)`",
        r"`${caster.name}使用了\1`",
        content
    )

    # 模式3: 修正 '你转账 -> '${caster.name}转账
    content = re.sub(
        r"'你转账([^']+)'",
        r"'${caster.name}转账\1'",
        content
    )

    # 模式4: 修正 `你转账 -> `${caster.name}转账
    content = re.sub(
        r"`你转账([^`]+)`",
        r"`${caster.name}转账\1`",
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ 修正 {filepath}")

if __name__ == '__main__':
    print("修正双日志格式...")
    print("\n1. 修正 battleSkills.js")
    fix_battle_skills()

    print("\n2. 修正 nonBattleSkills.js")
    fix_non_battle_skills()

    print("\n✅ 完成！")
    print("\n注意：这个脚本只修正了私密日志中的'你'")
    print("公开日志中移除的 ${caster.name} 需要手动恢复")
