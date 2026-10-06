const fs = require('fs');
const path = require('path');

const dirs = ['actions', 'app', 'lib'];
for (const dir of dirs) {
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const f of fs.readdirSync(d)) {
      const p = path.join(d, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
        let c = fs.readFileSync(p, 'utf8');
        if (c.includes('mode: "insensitive"') || c.includes("mode: 'insensitive'")) {
          c = c.replace(/,\s*mode:\s*["']insensitive["']/g, '');
          c = c.replace(/mode:\s*["']insensitive["'],?\s*/g, '');
          fs.writeFileSync(p, c, 'utf8');
          console.log('Cleaned mode:insensitive in', p);
        }
      }
    }
  }
  walk(dir);
}
