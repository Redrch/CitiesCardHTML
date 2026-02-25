#!/usr/bin/env node
/**
 * 修复 PlayerModeOnline.vue 中的 cities 数组访问
 */

import fs from 'fs';

const filepath = './src/components/PlayerMode/PlayerModeOnline.vue';

console.log('Reading PlayerModeOnline.vue...');
let content = fs.readFileSync(filepath, 'utf-8');
const originalContent = content;

// 1. 修复 .cities.length -> Object.keys(cities).length 或 Object.values(cities).length
content = content.replace(/(\w+)\.cities\.length/g, 'Object.keys($1.cities).length');

// 2. 修复 .cities.forEach -> Object.values(cities).forEach
content = content.replace(/(\w+)\.cities\.forEach\(/g, 'Object.values($1.cities).forEach(');

// 3. 修复 .cities.map -> Object.values(cities).map
content = content.replace(/(\w+)\.cities\.map\(/g, 'Object.values($1.cities).map(');

// 4. 修复 .cities.filter -> Object.values(cities).filter
content = content.replace(/(\w+)\.cities\.filter\(/g, 'Object.values($1.cities).filter(');

// 5. 修复 .cities.find -> Object.values(cities).find
content = content.replace(/(\w+)\.cities\.find\(/g, 'Object.values($1.cities).find(');

// 6. 修复 .cities.some -> Object.values(cities).some
content = content.replace(/(\w+)\.cities\.some\(/g, 'Object.values($1.cities).some(');

// 7. 修复 .cities.every -> Object.values(cities).every
content = content.replace(/(\w+)\.cities\.every\(/g, 'Object.values($1.cities).every(');

// 8. 修复模板中的 :cities="currentPlayer?.cities || []"
// 需要改为 :cities="currentPlayer?.cities ? Object.values(currentPlayer.cities) : []"
content = content.replace(
  /:cities="currentPlayer\?\.cities \|\| \[\]"/g,
  ':cities="currentPlayer?.cities ? Object.values(currentPlayer.cities) : []"'
);

// 9. 修复 for 循环中的 cities.length
content = content.replace(
  /for\s*\(\s*let\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\w+)\.cities\.length/g,
  'for (let $1 = 0; $1 < Object.keys($2.cities).length'
);

if (content !== originalContent) {
  fs.writeFileSync(filepath, content, 'utf-8');
  console.log('✓ PlayerModeOnline.vue has been updated!');

  // 统计修改
  const changes = [];
  if (originalContent.match(/\.cities\.length/g)) {
    changes.push(`${originalContent.match(/\.cities\.length/g).length} .cities.length`);
  }
  if (originalContent.match(/\.cities\.forEach\(/g)) {
    changes.push(`${originalContent.match(/\.cities\.forEach\(/g).length} .cities.forEach`);
  }
  if (originalContent.match(/\.cities\.map\(/g)) {
    changes.push(`${originalContent.match(/\.cities\.map\(/g).length} .cities.map`);
  }
  if (originalContent.match(/\.cities\.filter\(/g)) {
    changes.push(`${originalContent.match(/\.cities\.filter\(/g).length} .cities.filter`);
  }

  console.log('Changes made:', changes.join(', '));
} else {
  console.log('- No changes needed');
}
