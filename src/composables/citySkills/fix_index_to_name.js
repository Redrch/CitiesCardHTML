#!/usr/bin/env node
/**
 * 修复城市技能文件中的索引访问问题
 * 将 selectedCityIndices.map(idx => player.cities[idx]) 改为使用城市名称
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixFile(filepath) {
  console.log(`\n处理文件: ${path.basename(filepath)}`);

  let content = fs.readFileSync(filepath, 'utf-8');
  const originalContent = content;
  let changes = [];

  // 1. 修复 selectedCityIndices.map(idx => player.cities[idx])
  // 改为 selectedCityNames.map(name => player.cities[name])
  const pattern1 = /selectedCityIndices\.map\(idx => (\w+)\.cities\[idx\]\)/g;
  if (pattern1.test(content)) {
    content = content.replace(
      /selectedCityIndices\.map\(idx => (\w+)\.cities\[idx\]\)/g,
      'selectedCityNames.map(name => $1.cities[name])'
    );
    changes.push('selectedCityIndices.map -> selectedCityNames.map');
  }

  // 2. 修复参数名 selectedCityIndices = null 改为 selectedCityNames = null
  const pattern2 = /selectedCityIndices\s*=\s*null/g;
  if (pattern2.test(content)) {
    content = content.replace(
      /selectedCityIndices\s*=\s*null/g,
      'selectedCityNames = null'
    );
    changes.push('selectedCityIndices param -> selectedCityNames');
  }

  // 3. 修复 selectedCityIndices && Array.isArray(selectedCityIndices)
  const pattern3 = /selectedCityIndices\s*&&\s*Array\.isArray\(selectedCityIndices\)/g;
  if (pattern3.test(content)) {
    content = content.replace(
      /selectedCityIndices\s*&&\s*Array\.isArray\(selectedCityIndices\)/g,
      'selectedCityNames && Array.isArray(selectedCityNames)'
    );
    changes.push('selectedCityIndices check -> selectedCityNames');
  }

  // 4. 修复 selectedCityIndices.map(idx => ({ city: attacker.cities[idx], idx }))
  const pattern4 = /selectedCityIndices\.map\(idx => \(\{ city: (\w+)\.cities\[idx\], idx \}\)\)/g;
  if (pattern4.test(content)) {
    content = content.replace(
      /selectedCityIndices\.map\(idx => \(\{ city: (\w+)\.cities\[idx\], idx \}\)\)/g,
      'selectedCityNames.map(name => ({ city: $1.cities[name], name }))'
    );
    changes.push('selectedCityIndices.map with object -> selectedCityNames.map');
  }

  // 5. 修复 targetPlayer.cities[idx] 模式
  const pattern5 = /(\w+)\.cities\[idx\]/g;
  if (pattern5.test(content)) {
    content = content.replace(
      /(\w+)\.cities\[idx\]/g,
      '$1.cities[cityName]'
    );
    changes.push('cities[idx] -> cities[cityName]');
  }

  // 6. 修复注释中的 selectedCityIndices
  content = content.replace(
    /selectedCityIndices/g,
    'selectedCityNames'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`  ✓ 已更新 ${path.basename(filepath)}`);
    if (changes.length > 0) {
      console.log(`    修改: ${changes.join(', ')}`);
    }
    return true;
  } else {
    console.log(`  - 无需修改 ${path.basename(filepath)}`);
    return false;
  }
}

function main() {
  const skillsDir = __dirname;

  // 需要处理的文件
  const filesToFix = [
    'shandong.js',
    'heilongjiang.js',
    'jiangxi.js',
    'hainan.js',
    'hunan.js',
    'zhejiang.js'
  ];

  console.log(`找到 ${filesToFix.length} 个需要修复的文件\n`);

  let updatedCount = 0;
  for (const filename of filesToFix) {
    const filepath = path.join(skillsDir, filename);
    if (fs.existsSync(filepath)) {
      if (fixFile(filepath)) {
        updatedCount++;
      }
    } else {
      console.log(`  ⚠️  文件不存在: ${filename}`);
    }
  }

  console.log(`\n✓ 完成！已更新 ${updatedCount}/${filesToFix.length} 个文件`);
}

main();
