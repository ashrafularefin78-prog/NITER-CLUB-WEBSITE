import { readFileSync, writeFileSync } from 'fs';

var c = readFileSync('index.html', 'utf8');

// Find the naiChatReply function
var idx = c.indexOf('function naiChatReply(q)');
if (idx === -1) { console.log('ERROR: naiChatReply not found'); process.exit(1); }

// Find the first if statement after the function
var firstIf = c.indexOf('if (/', idx);
if (firstIf === -1) { console.log('ERROR: first if not found'); process.exit(1); }

// Insert Islamic greeting before the first if
var islamicGreeting = `      /* ---- Islamic greeting: Assalamualaikum -> Alaikumus Salam ---- */\n      if (/assalamu\\s*(ualaikum|\\s*alaikum|\\s*o\\s*alaikum|alaikum)/i.test(q) || /^salam$/i.test(q) || /^aoa$/i.test(q)) {\n        return naiPick([\n          "Wa Alaikumus Salam! \\ud83d\\ude4f \\ud83c\\udf19 May your day be blessed. How can I help you with NITER today \\u2014 clubs, admission, exams, or anything else?",\n          "Alaikumus Salam! \\ud83d\\ude4f Welcome! I'm NITER AI. Ask me anything about NITER \\u2014 the institute, clubs, events, fees, the RMG industry. What would you like to know?",\n          "Wa Alaikumus Salam! \\ud83d\\ude4f \\u2728 Peace be upon you too. I'm here to help with anything NITER-related \\u2014 clubs, admission, campus life, career paths. What's on your mind?"\n        ]);\n      }\n\n`;

c = c.substring(0, firstIf) + islamicGreeting + c.substring(firstIf);

writeFileSync('index.html', c, 'utf8');
console.log('Added Islamic greeting response');
