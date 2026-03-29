#!/usr/bin/env python3
"""
修正 battleSkills.js 中的公开日志，添加 ${caster.name}
策略：
1. 如果公开日志以技能名开头，替换为 ${caster.name}使用XXX
2. 否则，在开头添加 ${caster.name}使用XXX，
"""

import re

filepath = 'src/composables/skills/battleSkills.js'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 备份
with open(filepath + '.before_fix_public', 'w', encoding='utf-8') as f:
    f.writelines(lines)

converted = []
i = 0
while i < len(lines):
    line = lines[i]

    # 查找 addSkillUsageLog 调用
    if 'addSkillUsageLog(' in line:
        # 读取完整的调用（可能跨多行）
        call_lines = [line]
        j = i + 1
        paren_count = line.count('(') - line.count(')')

        while paren_count > 0 and j < len(lines):
            call_lines.append(lines[j])
            paren_count += lines[j].count('(') - lines[j].count(')')
            j += 1

        # 解析技能名和公开日志
        full_call = ''.join(call_lines)

        # 提取技能名（第三个参数）
        skill_match = re.search(r"addSkillUsageLog\(\s*gameStore,\s*caster\.name,\s*'([^']+)'", full_call)

        if skill_match:
            skill_name = skill_match.group(1)

            # 提取公开日志（第四个参数）
            # 可能是字符串字面量或模板字符串
            public_msg_match = re.search(r"'([^']+)'\s*,\s*(?:`|\')([^`']+)", full_call, re.MULTILINE)

            if not public_msg_match:
                # 尝试匹配反引号格式
                public_msg_match = re.search(r"'([^']+)'\s*,\s*`([^`]+)`", full_call, re.MULTILINE)

            if not public_msg_match:
                # 尝试匹配跨行格式
                parts = full_call.split("'"+skill_name+"'")[1]
                msgs = re.findall(r"[`']([^`']+)[`']", parts)

                if len(msgs) >= 2:
                    public_msg = msgs[0]

                    # 修改公开日志
                    if public_msg.startswith(skill_name):
                        # 替换技能名为 ${caster.name}使用XXX
                        new_public_msg = f'${{caster.name}}使用{public_msg}'
                    else:
                        # 在开头添加
                        new_public_msg = f'${{caster.name}}使用了{skill_name}，{public_msg}'

                    # 替换原文本
                    old_pattern = f"'{public_msg}'"
                    new_pattern = f"`{new_public_msg}`"
                    full_call = full_call.replace(old_pattern, new_pattern, 1)

        converted.extend(full_call.splitlines(True))
        i = j
    else:
        converted.append(line)
        i += 1

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(converted)

print("✅ 已修正 battleSkills.js 中的公开日志格式")
print("   请手动检查结果")
