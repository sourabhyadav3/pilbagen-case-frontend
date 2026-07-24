const fs = require('fs');
const content = fs.readFileSync('src/pages/AdminPages.jsx', 'utf8');

// Match catch blocks using a regex or simple split search
// Let's find occurrences of "activeRole" which indicates role-based mock data fallback
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('activeRole') || line.includes('vktori_role')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
