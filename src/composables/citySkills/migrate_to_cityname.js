#!/usr/bin/env node
/**
 * 批量迁移城市技能文件：从数组索引改为城市名称
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function migrateCitySkillFile(filepath) {
  console.log(`Processing ${path.basename(filepath)}...`);

  let content = fs.readFileSync(filepath, 'utf-8');
  const originalContent = content;
  let changes = [];

  // 1. 替换 findIndex 模式为直接使用 cityName
  // 模式: const cityIndex = attacker.cities.findIndex(c => c.name === skillData.cityName)
  const findIndexPattern = /const\s+(\w*Index)\s*=\s*(\w+)\.cities\.findIndex\(c\s*=>\s*c\.name\s*===\s*skillData\.cityName\)/g;
  if (findIndexPattern.test(content)) {
    content = content.replace(findIndexPattern, (match, varName, playerVar) => {
      const newVarName = varName.replace('Index', 'Name');
      changes.push(`${varName} -> ${newVarName} (removed findIndex)`);
      return `const ${newVarName} = skillData.cityName`;
    });
  }

  // 2. 替换使用 cityIndex 变量的地方为 cityName
  content = content.replace(/\bcityIndex\b/g, 'cityName');

  // 3. 替换 centerIndex 为 centerCityName
  content = content.replace(/\.centerIndex\b/g, '.centerCityName');

  // 4. 替换 getCityIndex 调用
  const getCityIndexPattern = /const\s+(\w+)\s*=\s*getCityIndex\((\w+),\s*(\w+)\)/g;
  content = content.replace(getCityIndexPattern, (match, varName, player, city) => {
    const newVarName = varName.replace('Index', 'Name');
    changes.push(`getCityIndex -> direct name access`);
    return `const ${newVarName} = ${city}.name`;
  });

  // 5. 替换 cities.forEach 为 Object.values(cities).forEach
  const forEachPattern = /(\w+)\.cities\.forEach\(/g;
  content = content.replace(forEachPattern, (match, playerVar) => {
    changes.push(`${playerVar}.cities.forEach -> Object.values`);
    return `Object.values(${playerVar}.cities).forEach(`;
  });

  // 6. 替换 cities.push 为 cities[name] =
  const pushPattern = /(\w+)\.cities\.push\((\w+)\)/g;
  content = content.replace(pushPattern, (match, playerVar, cityVar) => {
    changes.push(`${playerVar}.cities.push -> object assignment`);
    return `${playerVar}.cities[${cityVar}.name] = ${cityVar}`;
  });

  // 7. 替换 cities.filter 为 Object.values(cities).filter
  const filterPattern = /(\w+)\.cities\.filter\(/g;
  content = content.replace(filterPattern, (match, playerVar) => {
    changes.push(`${playerVar}.cities.filter -> Object.values`);
    return `Object.values(${playerVar}.cities).filter(`;
  });

  // 8. 替换 cities.find 为 Object.values(cities).find
  const findPattern = /(\w+)\.cities\.find\(/g;
  content = content.replace(findPattern, (match, playerVar) => {
    changes.push(`${playerVar}.cities.find -> Object.values`);
    return `Object.values(${playerVar}.cities).find(`;
  });

  // 9. 替换 cities.map 为 Object.values(cities).map
  const mapPattern = /(\w+)\.cities\.map\(/g;
  content = content.replace(mapPattern, (match, playerVar) => {
    changes.push(`${playerVar}.cities.map -> Object.values`);
    return `Object.values(${playerVar}.cities).map(`;
  });

  // 10. 替换 cities.some 为 Object.values(cities).some
  const somePattern = /(\w+)\.cities\.some\(/g;
  content = content.replace(somePattern, (match, playerVar) => {
    changes.push(`${playerVar}.cities.some -> Object.values`);
    return `Object.values(${playerVar}.cities).some(`;
  });

  // 11. 替换 cities.every 为 Object.values(cities).every
  const everyPattern = /(\w+)\.cities\.every\(/g;
  content = content.replace(everyPattern, (match, playerVar) => {
    changes.push(`${playerVar}.cities.every -> Object.values`);
    return `Object.values(${playerVar}.cities).every(`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`  ✓ Updated ${path.basename(filepath)}`);
    if (changes.length > 0) {
      console.log(`    Changes: ${changes.join(', ')}`);
    }
    return true;
  } else {
    console.log(`  - No changes needed for ${path.basename(filepath)}`);
    return false;
  }
}

function main() {
  const skillsDir = __dirname;

  // 排除的文件
  const excludeFiles = new Set([
    'batch_refactor.py',
    'migrate_to_cityname.js',
    'index.js',
    'README.md',
    'skillHelpers.js'  // 这个文件需要单独处理
  ]);

  // 获取所有.js文件
  const files = fs.readdirSync(skillsDir)
    .filter(f => f.endsWith('.js') && !excludeFiles.has(f))
    .map(f => path.join(skillsDir, f));

  console.log(`Found ${files.length} files to process\n`);

  let updatedCount = 0;
  for (const filepath of files.sort()) {
    if (migrateCitySkillFile(filepath)) {
      updatedCount++;
    }
  }

  console.log(`\n✓ Completed! Updated ${updatedCount}/${files.length} files`);
}

main();
