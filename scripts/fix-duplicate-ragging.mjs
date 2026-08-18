import { readFileSync, writeFileSync } from 'fs';

const c = readFileSync('index.html', 'utf8');

// Find the first ragging entry (brief one) and remove it
// It starts with { id: "ragging", topics: ["ragging", "bullying" and ends before { id: "sports"
const firstRaggingStart = c.indexOf('{ id: "ragging", topics: ["ragging", "bullying"');
const firstRaggingEnd = c.indexOf('{ id: "sports"', firstRaggingStart);

if (firstRaggingStart === -1 || firstRaggingEnd === -1) {
  console.log('Could not find the first ragging entry');
  process.exit(1);
}

// Find the line start (go back to the beginning of the line)
let lineStart = firstRaggingStart;
while (lineStart > 0 && c[lineStart - 1] !== '\n') lineStart--;

// Remove from lineStart to firstRaggingEnd (keeping the newline before sports)
const updated = c.substring(0, lineStart) + c.substring(firstRaggingEnd);

writeFileSync('index.html', updated);
console.log('Removed first duplicate ragging entry');
console.log('File size:', c.length, '->', updated.length);
