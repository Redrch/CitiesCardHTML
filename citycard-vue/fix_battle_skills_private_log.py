#!/usr/bin/env python3
"""
修正 battleSkills.js 中的双日志格式
1. 私密日志：'你使用了' -> '${caster.name}使用了'
2. 私密日志：`你使用了` -> `${caster.name}使用了`
3. 私密日志：'你对' -> '${caster.name}对'
4. 私密日志：`你对` -> `${caster.name}对`
"""

import re

filepath = 'src/composables/skills/battleSkills.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 备份
with open(filepath + '.before_fix2', 'w', encoding='utf-8') as f:
    f.write(content)

# 替换 '你使用了' -> '${caster.name}使用了'
content = re.sub(r"'你使用了", r"'${caster.name}使用了", content)

# 替换 `你使用了` -> `${caster.name}使用了`
content = re.sub(r"`你使用了", r"`${caster.name}使用了", content)

# 替换 '你对' -> '${caster.name}对'
content = re.sub(r"'你对 ", r"'${caster.name}对 ", content)

# 替换 `你对` -> `${caster.name}对`
content = re.sub(r"`你对 ", r"`${caster.name}对 ", content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ 已修正 battleSkills.js 中的私密日志格式")
print("   - '你使用了' -> '${caster.name}使用了'")
print("   - '你对' -> '${caster.name}对'")
print("\n⚠️  注意：公开日志中缺少 ${caster.name} 仍需手动修正")
