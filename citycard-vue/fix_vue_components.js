#!/usr/bin/env node
/**
 * 批量修复所有Vue组件中的 cities 数组访问
 */

import fs from 'fs';
import path from 'path';

const filesToFix = [
  './src/components/Room/WaitingRoom.vue',
  './src/components/Game/BattleAnimation.vue',
  './src/components/AdminMode/BattlePanel.vue',
  './src/components/AdminMode/AdminModeEnhanced.vue',
  './src/components/AdminMode/AdminMode.vue'
];

function fixFile(filepath) {
  console.log(`\nProcessing ${path.basename(filepath)}...`);

  if (!fs.existsSync(filepath)) {
    console.log(`  ✗ File not found: ${filepath}`);
    return false;
  }

  let content = fs.readFileSync(filepath, 'utf-8');
  const originalContent = content;

  // 1. 修复 .cities.length
  content = content.replace(/(\w+)\.cities\.length/g, 'Object.keys($1.cities).length');

  // 2. 修复 .cities.forEach
  content = content.replace(/(\w+)\.cities\.forEach\(/g, 'Object.values($1.cities).forEach(');

  // 3. 修复 .cities.map
  content = content.replace(/(\w+)\.cities\.map\(/g, 'Object.values($1.cities).map(');

  // 4. 修复 .cities.filter
  content = content.replace(/(\w+)\.cities\.filter\(/g, 'Object.values($1.cities).filter(');

  // 5. 修复 .cities.find
  content = content.replace(/(\w+)\.cities\.find\(/g, 'Object.values($1.cities).find(');

  // 6. 修复 .cities.some
  content = content.replace(/(\w+)\.cities\.some\(/g, 'Object.values($1.cities).some(');

  // 7. 修复 .cities.every
  content = content.replace(/(\w+)\.cities\.every\(/g, 'Object.values($1.cities).every(');

  // 8. 修复 for 循环
  content = content.replace(
    /for\s*\(\s*let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\w+)\.cities\.length/g,
    'for (let $1 = 0; $1 < Object.keys($2.cities).length'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`  ✓ Updated ${path.basename(filepath)}`);

    // 统计修改
    const changes = [];
    const lengthMatches = originalContent.match(/\.cities\.length/g);
    if (lengthMatches) changes.push(`${lengthMatches.length} .cities.length`);

    const forEachMatches = originalContent.match(/\.cities\.forEach\(/g);
    if (forEachMatches) changes.push(`${forEachMatches.length} .cities.forEach`);

    const mapMatches = originalContent.match(/\.cities\.map\(/g);
    if (mapMatches) changes.push(`${mapMatches.length} .cities.map`);

    const filterMatches = originalContent.match(/\.cities\.filter\(/g);
    if (filterMatches) changes.push(`${filterMatches.length} .cities.filter`);

    if (changes.length > 0) {
      console.log(`    Changes: ${changes.join(', ')}`);
    }
    return true;
  } else {
    console.log(`  - No changes needed`);
    return false;
  }
}

console.log('Fixing Vue components...\n');

let updatedCount = 0;
for (const filepath of filesToFix) {
  if (fixFile(filepath)) {
    updatedCount++;
  }
}

console.log(`\n✓ Completed! Updated ${updatedCount}/${filesToFix.length} files`);
