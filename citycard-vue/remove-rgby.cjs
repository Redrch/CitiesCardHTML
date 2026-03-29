#!/usr/bin/env node
/**
 * Script to remove red, green, blue, yellow properties from cities.js
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/cities.js');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Remove red, green, blue, yellow properties using regex
// Matches patterns like: red: 1, green: 0, blue: 3, yellow: 2
content = content.replace(/,?\s*(red|green|blue|yellow):\s*\d+/g, '');

// Clean up double commas and trailing commas before closing braces
content = content.replace(/,\s*,/g, ',');
content = content.replace(/,(\s*})/g, '$1');

// Write back the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Successfully removed RGBY properties from cities.js');
