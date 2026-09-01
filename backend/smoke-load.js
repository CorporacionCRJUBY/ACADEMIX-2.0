const fs = require('fs');
const path = require('path');
let ok = 0, fail = 0;
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js') && !e.name.includes('.test.') && e.name !== 'server.js') {
      try { require(p); ok++; }
      catch (err) { fail++; console.log('LOAD FAIL:', p, '-', err.message.slice(0, 140)); }
    }
  }
}
walk(path.join(__dirname, 'src'));
console.log('loaded OK:', ok, 'failed:', fail);
process.exit(fail ? 1 : 0);
