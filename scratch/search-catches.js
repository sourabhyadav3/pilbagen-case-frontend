const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminPages.jsx', 'utf8');

// Match catch blocks
const regex = /catch\s*\(([^)]+)\)\s*\{([^}]+)\}/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const code = match[0];
  if (code.includes('set') || code.includes('mock') || code.includes('counts') || code.includes('vktori_role')) {
    console.log(`Matched Catch Block:\n${code}\n-----------------------------------\n`);
  }
}
