// Test the NITER AI knowledge base matching
import { readFileSync } from 'fs';

var c = readFileSync('index.html', 'utf8');

// Extract NAI_KB entries
var kbMatch = c.match(/var NAI_KB = \[([\s\S]*?)\];/);
if (!kbMatch) { console.log('ERROR: NAI_KB not found'); process.exit(1); }

// Count entries
var entries = [];
var re = /\{\s*id:\s*"([^"]+)"/g;
var m;
while ((m = re.exec(kbMatch[1])) !== null) {
  entries.push(m[1]);
}
console.log('Total KB entries:', entries.length);

// Test queries against topic matching
var testQueries = [
  { q: "How to get admitted to NITER?", expected: "niter-admission" },
  { q: "What are the tuition fees?", expected: "niter-fees" },
  { q: "How many departments does NITER have?", expected: "niter-departments" },
  { q: "Where is NITER located?", expected: "niter-location" },
  { q: "Who is the director of NITER?", expected: "niter-leadership" },
  { q: "What is the grading system?", expected: "mark-distribution" },
  { q: "Tell me about CSE department", expected: "niter-departments" },
  { q: "How to reach NITER campus?", expected: "niter-location" },
  { q: "What labs are available?", expected: "niter-labs" },
  { q: "Is there WiFi on campus?", expected: "niter-wifi" },
  { q: "Where can I eat on campus?", expected: "niter-canteen" },
  { q: "What international partnerships does NITER have?", expected: "niter-international" },
  { q: "When does the semester start?", expected: "niter-academic-year" },
  { q: "Are there scholarships?", expected: "niter-scholarship" },
  { q: "Does NITER have MBA?", expected: "niter-mba" },
  { q: "How to reach campus by bus?", expected: "niter-transport" },
  { q: "What is the admission test format?", expected: "niter-admission" },
  { q: "Who is the exam controller?", expected: "exam-office" },
  { q: "What is the pass mark?", expected: "mark-distribution" },
  { q: "Tell me about ragging", expected: "ragging" },
  { q: "What are the hostel fees?", expected: "hostels" },
  { q: "How many clubs are there?", expected: "clubs-list" },
  { q: "What events are coming up?", expected: "events-page" },
  { q: "CSE career prospects", expected: "cse-career" },
  { q: "Medical center location", expected: "healthcare" },
  { q: "Exam committee structure", expected: "exam-committee" },
  { q: "Exam question pattern", expected: "exam-quality" },
];

// Simple topic matching (simulates naiAsk)
function normalize(q) { return String(q || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }

function findBestMatch(query, kb) {
  var nq = normalize(query);
  var words = nq.split(" ").filter(function(w) { return w.length > 2; });
  
  var bestEntry = null;
  var bestScore = 0;
  
  for (var i = 0; i < kb.length; i++) {
    var entry = kb[i];
    var topics = entry.topics || [];
    var score = 0;
    
    for (var t = 0; t < topics.length; t++) {
      var topic = normalize(topics[t]);
      // Exact match
      if (nq.indexOf(topic) !== -1 || topic.indexOf(nq) !== -1) {
        score += 10;
      }
      // Word overlap
      for (var w = 0; w < words.length; w++) {
        if (topic.indexOf(words[w]) !== -1) {
          score += 2;
        }
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }
  
  return { entry: bestEntry, score: bestScore };
}

// Extract topics from entries
var entryData = [];
var topicRe = /\{\s*id:\s*"([^"]+)",\s*topics:\s*\[([^\]]+)\]/g;
var tm;
while ((tm = topicRe.exec(kbMatch[1])) !== null) {
  var topics = tm[2].replace(/"/g, "").split(",").map(function(t) { return t.trim(); });
  entryData.push({ id: tm[1], topics: topics });
}

// Run tests
var passed = 0;
var failed = 0;
var results = [];

for (var i = 0; i < testQueries.length; i++) {
  var test = testQueries[i];
  var match = findBestMatch(test.q, entryData);
  var ok = match.entry && match.entry.id === test.expected;
  if (!ok && match.entry) {
    // Check if expected entry has a close topic match
    var expectedEntry = entryData.find(function(e) { return e.id === test.expected; });
    if (expectedEntry) {
      var expMatch = findBestMatch(test.q, [expectedEntry]);
      if (expMatch.score > 0) {
        ok = false; // expected entry could match but didn't win
      }
    }
  }
  
  if (ok) {
    passed++;
    results.push("PASS: '" + test.q + "' -> " + (match.entry ? match.entry.id : "none") + " (score: " + match.score + ")");
  } else {
    failed++;
    results.push("FAIL: '" + test.q + "' expected=" + test.expected + " got=" + (match.entry ? match.entry.id : "none") + " (score: " + match.score + ")");
  }
}

console.log("\n=== TEST RESULTS ===");
console.log("Passed:", passed + "/" + testQueries.length);
console.log("Failed:", failed + "/" + testQueries.length);
console.log("\nFailed tests:");
results.filter(function(r) { return r.startsWith("FAIL"); }).forEach(function(r) { console.log("  " + r); });
