import { readFileSync, writeFileSync } from 'fs';

var c = readFileSync('index.html', 'utf8');

// Fix the math intent pattern to exclude "meaning" (negative lookahead)
// The current pattern matches "mean" from "meaning of life"
// We need to ensure "mean" is not followed by "ing" (i.e., it's not "meaning")
var oldPattern = "{ id: 'math', patterns: /(?:solve|calculate|\\d+\\s*[+\\-*/^]\\s*\\d+|integral|mean|average)/i, conf: 0.82 }";
var newPattern = "{ id: 'math', patterns: /(?:solve|calculate|\\d+\\s*[+\\-*/^]\\s*\\d+|integral|mean(?!ing)|average)/i, conf: 0.82 }";

c = c.replace(oldPattern, newPattern);
console.log('Fixed math intent: mean(?!ing) to exclude "meaning"');

// Also fix the math intent check function that uses "mean|average"
var oldMathCheck = "/(?:solve|calculate|\\d+\\s*[+\\-*/^]\\s*\\d+|integral|mean|average)/i";
var newMathCheck = "/(?:solve|calculate|\\d+\\s*[+\\-*/^]\\s*\\d+|integral|mean(?!ing)|average)/i";
c = c.replace(new RegExp(oldMathCheck.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newMathCheck);
console.log('Fixed math check pattern');

writeFileSync('index.html', c, 'utf8');
console.log('Done: Math intent fixed to exclude "meaning"');
