import { readFileSync } from 'fs';
import { createScript } from 'vm';

const code = readFileSync('index.html', 'utf8');

// Find script blocks using a more robust approach
const scriptStartRegex = /<script(?:\s[^>]*)?>/gi;
const scriptEndRegex = /<\/script>/gi;

let starts = [];
let m;
while ((m = scriptStartRegex.exec(code)) !== null) {
  starts.push({ pos: m.index + m[0].length, tag: m[0] });
}

let errors = 0;
for (let i = 0; i < starts.length; i++) {
  const endIdx = code.indexOf('</script>', starts[i].pos);
  if (endIdx === -1) continue;
  const content = code.substring(starts[i].pos, endIdx).trim();
  if (content.length < 100) continue;
  
  try {
    createScript(content, { filename: `script${i+1}.js` });
  } catch(e) {
    errors++;
    console.error(`Script ${i+1}: ERROR - ${e.message}`);
    if (e.stack) {
      const lineMatch = e.stack.match(/script\d+\.js:(\d+)/);
      if (lineMatch) {
        const ln = parseInt(lineMatch[1]) - 1;
        const lines = content.split('\n');
        for (let j = Math.max(0,ln-3); j < Math.min(lines.length,ln+3); j++) {
          console.log((j===ln?'>>>':'   ') + (j+1) + ': ' + lines[j].substring(0, 200));
        }
      }
    }
  }
}

if (errors === 0) console.log('All scripts pass syntax check!');
else console.log(`${errors} script(s) have errors`);
