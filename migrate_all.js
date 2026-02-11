#!/usr/bin/env node
/**
 * 完整的城市索引到城市名称迁移脚本
 * 处理所有需要从数组索引迁移到城市名称的代码
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let totalChanges = 0;
let filesModified = 0;

/**
 * 迁移单个文件
 */
function migrateFile(filepath) {
  const filename = path.basename(filepath);
  console.log(`\n处理: ${filepath}`);

  let content = fs.readFileSync(filepath, 'utf-8');
  const originalContent = content;
  let changes = [];

  // 1. 替换 .centerIndex 为 .centerCityName
  const centerIndexCount = (content.match(/\.centerIndex\b/g) || []).length;
  if (centerIndexCount > 0) {
    content = content.replace(/\.centerIndex\b/g, '.centerCityName');
    changes.push(`centerIndex -> centerCityName (${centerIndexCount}处)`);
  }

  // 2. 替换 centerIdx 变量声明和使用
  // 模式: const centerIdx = target.centerIndex ?? 0
  content = content.replace(
    /const\s+centerIdx\s*=\s*(\w+)\.centerIndex\s*\?\?\s*0/g,
    'const centerCityName = $1.centerCityName'
  );

  // 模式: const centerIdx = (mode === '2P' || mode === '2v2') ? (target.centerIndex ?? 0) : -1
  content = content.replace(
    /const\s+centerIdx\s*=\s*\(.*?\)\s*\?\s*\((\w+)\.centerIndex\s*\?\?\s*0\)\s*:\s*-1/g,
    'const centerCityName = $1.centerCityName'
  );

  // 3. 替换 centerIndex 变量声明
  content = content.replace(
    /const\s+centerIndex\s*=\s*.*?\?\s*\((\w+)\.centerIndex\s*\?\?\s*0\)\s*:\s*-1/g,
    'const centerCityName = $1.centerCityName'
  );

  // 4. 替换 cities[centerIdx] 为 cities[centerCityName]
  content = content.replace(/(\w+)\.cities\[centerIdx\]/g, '$1.cities[centerCityName]');
  content = content.replace(/(\w+)\.cities\[centerIndex\]/g, '$1.cities[centerCityName]');

  // 5. 替换 cityIdx === centerIdx 比较
  content = content.replace(/(\w+)\s*===\s*centerIdx/g, '$1 === centerCityName');
  content = content.replace(/centerIdx\s*===\s*(\w+)/g, 'centerCityName === $1');
  content = content.replace(/(\w+)\s*===\s*centerIndex/g, '$1 === centerCityName');
  content = content.replace(/centerIndex\s*===\s*(\w+)/g, 'centerCityName === $1');

  // 6. 替换 idx === (player.centerIndex ?? 0) 模式
  content = content.replace(
    /(\w+)\s*===\s*\((\w+)\.centerIndex\s*\?\?\s*0\)/g,
    '$1 === $2.centerCityName'
  );

  // 7. 替换 cityIndex 变量声明 - player.cities.indexOf(city)
  content = content.replace(
    /const\s+cityIndex\s*=\s*(\w+)\.cities\.indexOf\((\w+)\)/g,
    'const cityName = $2.name'
  );

  // 8. 替换 cityIdx 变量声明 - cities.indexOf(city)
  content = content.replace(
    /const\s+cityIdx\s*=\s*(\w+)\.cities\.indexOf\((\w+)\)/g,
    'const cityName = $2.name'
  );

  // 9. 替换 gameStore.xxx[player.name][cityIndex] 模式
  // 先处理声明
  content = content.replace(
    /gameStore\.(\w+)\[(\w+)\.name\]\[cityIndex\]/g,
    'gameStore.$1[$2.name][cityName]'
  );

  // 10. 替换 cityIndex 作为对象键的使用
  content = content.replace(
    /\[cityIndex\]:/g,
    '[cityName]:'
  );

  // 11. 替换 mark.cityIndex 为 mark.cityName
  content = content.replace(/(\w+)\.cityIndex\b/g, '$1.cityName');

  // 12. 替换 cityIndex: 赋值
  content = content.replace(/cityIndex:\s*(\w+)/g, 'cityName: $1');

  // 13. 替换函数参数中的 cityIndex
  content = content.replace(
    /function\s+(\w+)\s*\([^)]*\bcityIndex\b[^)]*\)/g,
    (match) => match.replace(/\bcityIndex\b/g, 'cityName')
  );

  // 14. 替换箭头函数参数中的 cityIndex
  content = content.replace(
    /\([^)]*\bcityIndex\b[^)]*\)\s*=>/g,
    (match) => match.replace(/\bcityIndex\b/g, 'cityName')
  );

  // 15. 处理 hasCityProtection, isIronCity 等函数调用
  content = content.replace(
    /hasCityProtection\((\w+),\s*cityIndex,/g,
    'hasCityProtection($1, cityName,'
  );
  content = content.replace(
    /isIronCity\((\w+),\s*cityIndex,/g,
    'isIronCity($1, cityName,'
  );
  content = content.replace(
    /applyCityDamage\((\w+),\s*(\w+),\s*(\w+),\s*cityIndex,/g,
    'applyCityDamage($1, $2, $3, cityName,'
  );

  // 16. 替换 Object.keys(xxx).forEach(cityIndex =>
  content = content.replace(
    /Object\.keys\(([^)]+)\)\.forEach\(cityIndex\s*=>/g,
    'Object.keys($1).forEach(cityName =>'
  );

  // 17. 替换剩余的独立 cityIndex 变量使用（在非声明位置）
  // 注意：这个要小心，只替换明确是城市索引的情况
  content = content.replace(
    /\bcityIndex\b(?!\s*[=:])/g,
    'cityName'
  );

  // 18. 修复可能的重复替换问题
  content = content.replace(/cityNameName/g, 'cityName');
  content = content.replace(/centerCityNameName/g, 'centerCityName');

  // 19. 处理 centerIndex 的增减操作（这些需要删除，因为对象不需要索引调整）
  // 注释掉这些行而不是删除，以便审查
  content = content.replace(
    /(\s+)if\s*\((\w+)\.centerIndex.*?centerIndex--\s*\}/g,
    '$1// MIGRATED: centerIndex adjustment removed (using cityName now)'
  );
  content = content.replace(
    /(\s+)(\w+)\.centerIndex--/g,
    '$1// MIGRATED: $2.centerIndex-- removed'
  );
  content = content.replace(
    /(\s+)(\w+)\.centerIndex\+\+/g,
    '$1// MIGRATED: $2.centerIndex++ removed'
  );

  // 20. 处理 target.centerIndex = newCenterIdx 赋值
  content = content.replace(
    /(\w+)\.centerIndex\s*=\s*(\w+)/g,
    '$1.centerCityName = $2.name'
  );

  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf-8');
    filesModified++;
    console.log(`  ✓ 已修改`);
    return true;
  } else {
    console.log(`  - 无需修改`);
    return false;
  }
}

/**
 * 递归处理目录
 */
function processDirectory(dir, extensions = ['.js', '.vue']) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);

    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .git
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        processDirectory(filepath, extensions);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        // 跳过迁移脚本本身
        if (file !== 'migrate_all.js' && file !== 'migrate_to_cityname.js') {
          migrateFile(filepath);
        }
      }
    }
  }
}

function main() {
  console.log('='.repeat(60));
  console.log('开始城市索引到城市名称的完整迁移');
  console.log('='.repeat(60));

  const srcDir = path.join(__dirname, 'src');

  console.log(`\n处理目录: ${srcDir}`);
  processDirectory(srcDir, ['.js', '.vue']);

  console.log('\n' + '='.repeat(60));
  console.log(`迁移完成！共修改 ${filesModified} 个文件`);
  console.log('='.repeat(60));
  console.log('\n请执行以下步骤：');
  console.log('1. 检查修改的文件，确认迁移正确');
  console.log('2. 运行 npm run test 测试');
  console.log('3. 手动检查被注释的 centerIndex 调整代码');
  console.log('4. 提交更改');
}

main();
