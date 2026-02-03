#!/usr/bin/env python3
"""
批量重构城市技能文件：从数组索引改为城市名称
"""

import os
import re
from pathlib import Path

def refactor_city_skills_file(filepath):
    """重构单个城市技能文件"""
    print(f"Processing {filepath.name}...")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. 替换 centerIndex -> centerCityName
    content = re.sub(r'defender\.centerIndex !== undefined', 'defender.centerCityName', content)
    content = re.sub(r'attacker\.centerIndex !== undefined', 'attacker.centerCityName', content)
    content = re.sub(r'defender\.cities\[defender\.centerIndex\]', 'defender.cities[defender.centerCityName]', content)
    content = re.sub(r'attacker\.cities\[attacker\.centerIndex\]', 'attacker.cities[attacker.centerCityName]', content)

    # 2. 替换 getCityIndex 为 getCityName 或直接使用 city.name
    # 模式: const cityIndex = getCityIndex(player, city)
    content = re.sub(
        r'const cityIndex = getCityIndex\((\w+), (\w+)\)',
        r'const cityName = \2.name',
        content
    )

    # 处理各种变量名的 Index = getCityIndex 模式
    content = re.sub(
        r'const (\w+Index) = getCityIndex\((\w+), (\w+)\)',
        r'const \1 = \3.name if isinstance(\3, dict) else \3',
        content
    )
    # 更通用的模式：variableIndex = getCityIndex(...) -> variableName = ...
    content = re.sub(
        r'(\w+)Index = getCityIndex\((\w+), ([^)]+)\)',
        lambda m: f"{m.group(1)}Name = {m.group(3)}.name" if not m.group(3).startswith("'") else f"{m.group(1)}Name = {m.group(3)}",
        content
    )

    # 替换使用这些Index变量的地方
    # 需要在后续统一处理

    # 3. 替换 gameStore状态对象中使用索引的地方为使用cityName
    # 例如: gameStore.shields[playerName][cityIndex] -> gameStore.shields[playerName][cityName]
    content = re.sub(r'\[cityIndex\]', '[cityName]', content)

    # 4. 替换 cities.push -> cities[cityName] =
    # 模式: attacker.cities.push(newCity) -> attacker.cities[newCity.name] = newCity
    def replace_push(match):
        indent = match.group(1)
        player = match.group(2)
        city_var = match.group(3)
        return f'{indent}{player}.cities[{city_var}.name] = {city_var}'

    content = re.sub(
        r'^(\s+)(\w+)\.cities\.push\((\w+)\)',
        replace_push,
        content,
        flags=re.MULTILINE
    )

    # 5. 替换 cities.forEach -> Object.values(cities).forEach
    content = re.sub(
        r'(\w+)\.cities\.forEach\(',
        r'Object.values(\1.cities).forEach(',
        content
    )

    # 6. 更新 addShield, addDelayedEffect, banCity 调用
    # 这些已经通过 cityIndex -> cityName 替换处理了

    # 只有内容改变时才写入
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ Updated {filepath.name}")
        return True
    else:
        print(f"  - No changes needed for {filepath.name}")
        return False

def main():
    script_dir = Path(__file__).parent

    # 获取所有需要处理的文件（排除已处理的和特殊文件）
    exclude_files = {'guangdong.js', 'skillHelpers.js', 'index.js', 'README.md', 'batch_refactor.py'}

    files_to_process = []
    for file in script_dir.glob('*.js'):
        if file.name not in exclude_files:
            files_to_process.append(file)

    print(f"Found {len(files_to_process)} files to process\n")

    updated_count = 0
    for filepath in sorted(files_to_process):
        if refactor_city_skills_file(filepath):
            updated_count += 1

    print(f"\n✓ Completed! Updated {updated_count}/{len(files_to_process)} files")

if __name__ == '__main__':
    main()
