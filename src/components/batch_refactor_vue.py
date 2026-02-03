#!/usr/bin/env python3
"""
批量重构Vue组件：从数组索引改为城市名称
"""

import os
import re
from pathlib import Path

def refactor_vue_file(filepath):
    """重构单个Vue文件"""
    print(f"Processing {filepath.name}...")

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # 1. 替换 centerIndex -> centerCityName
    content = re.sub(r'\.centerIndex', '.centerCityName', content)
    content = re.sub(r'centerIndex\s*:', 'centerCityName:', content)

    # 2. 替换 cities[centerIndex] -> cities[centerCityName]
    content = re.sub(
        r'cities\[(\w+)\.centerIndex\]',
        r'cities[\1.centerCityName]',
        content
    )

    # 3. 替换 cities.forEach((city, idx) -> Object.values(cities).forEach((city)
    # 但保留需要索引的情况
    content = re.sub(
        r'\.cities\.forEach\(\(city, (idx|index|cityIdx)\)',
        r'.cities.forEach((city)',
        content
    )

    # 4. 替换 Object.entries 模式用于需要键名的情况
    # cities.forEach((city, idx) => { ... cityIdx ... })
    # -> Object.entries(cities).forEach(([cityName, city]) => { ... cityName ... })

    # 这个需要更复杂的处理，暂时跳过

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
    # 需要处理的文件列表
    files_to_process = [
        'Game/CityDeployment.vue',
        'Game/OpponentKnownCities.vue',
        'Game/PendingSwapsPanel.vue',
        'PlayerMode/CenterCitySelection.vue',
        'PlayerMode/PlayerModeOnline.vue',
        'PlayerMode/RosterRefill.vue',
        'PlayerMode/RosterSelection.vue',
        'AdminMode/CityEditor.vue',
        'Game/BattleAnimation.vue'
    ]

    base_dir = Path(__file__).parent
    updated_count = 0

    for file_path in files_to_process:
        full_path = base_dir / file_path
        if full_path.exists():
            if refactor_vue_file(full_path):
                updated_count += 1
        else:
            print(f"  ✗ File not found: {file_path}")

    print(f"\n✓ Completed! Updated {updated_count}/{len(files_to_process)} files")

if __name__ == '__main__':
    main()
