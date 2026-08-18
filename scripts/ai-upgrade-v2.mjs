import { readFileSync, writeFileSync } from 'fs';

const file = 'C:\\Users\\user\\Downloads\\Clubs\\index.html';
let code = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// Step 1: Insert the new engine code before function naiModActive()
const MOD_MARKER = '\n    function naiModActive() {';
const modIdx = code.indexOf(MOD_MARKER);
if (modIdx === -1) { console.error('Cannot find naiModActive'); process.exit(1); }

const ENGINE_CODE = `
    /* ================================================================
       NITER AI — ADVANCED ENGINE v2.0
       ================================================================ */

    /* ---- 1. CONVERSATION CONTEXT TRACKER ---- */
    var NAI_CTX_KEY = 'niter_ai_context_v2';
    function naiCtxLoad() {
      try {
        var c = JSON.parse(localStorage.getItem(NAI_CTX_KEY) || 'null');
        if (c && typeof c === 'object') {
          c.recent = c.recent || []; c.topics = c.topics || [];
          c.lastIntent = c.lastIntent || ''; c.turnCount = c.turnCount || 0;
          return c;
        }
      } catch(e) {}
      return { recent: [], topics: [], lastIntent: '', turnCount: 0, sessionStart: new Date().toISOString() };
    }
    function naiCtxSave(c) { try { localStorage.setItem(NAI_CTX_KEY, JSON.stringify(c)); } catch(e) {} }
    function naiCtxTrack(query, intent) {
      var c = naiCtxLoad();
      c.recent.push({ q: query, t: Date.now() });
      if (c.recent.length > 8) c.recent = c.recent.slice(-8);
      if (intent) c.lastIntent = intent;
      c.turnCount++;
      if (intent && c.topics.indexOf(intent) === -1) c.topics.push(intent);
      if (c.topics.length > 12) c.topics = c.topics.slice(-12);
      naiCtxSave(c);
      return c;
    }
    function naiCtxIsFollowUp(query) {
      return /^(?:what about|how about|and (?:that|those|this|it)|tell me more|more about|also|what else|anything else)\\b/i.test(query);
    }

    /* ---- 2. SMART INTENT CLASSIFIER ---- */
    var NAI_INTENTS = [
      { id: 'greeting', patterns: /^(?:hi|hello|hey|yo|good morning|good afternoon|good evening|as-salamu|assalamu|salaam)\\b/i, conf: 0.95 },
      { id: 'farewell', patterns: /^(?:bye|goodbye|see you|later|good night|take care)\\b/i, conf: 0.95 },
      { id: 'thanks', patterns: /^(?:thanks?|thank you|thx|ty|appreciate)\\b/i, conf: 0.93 },
      { id: 'help', patterns: /^(?:help|what can you do|capabilities|features|how do you work|what are you)\\b/i, conf: 0.90 },
      { id: 'identity', patterns: /^(?:who are you|what are you|your name|about you)\\b/i, conf: 0.92 },
      { id: 'brain', patterns: /(?:brain|growth|memory|learned|learnings|what have you learned)/i, conf: 0.88 },
      { id: 'teach', patterns: /^(?:remember|note|keep in mind|from now on)\\s+(?:that\\s+|this:?\\s*)/i, conf: 0.90 },
      { id: 'correction', patterns: /^(?:no|nope|wait|actually)[,.!?]?\\s+(?:that'?s|thats)?\\s*(?:not|wrong|incorrect)/i, conf: 0.91 },
      { id: 'feedback_pos', patterns: /^(?:good|great|nice|correct|right|perfect|awesome|excellent|helpful|thanks|got it|understood|noted|well done)\\b/i, conf: 0.88 },
      { id: 'club_query', patterns: /(?:which|what|all|list|every|tell me about|about)\\s+(?:club|clubs|society|societies)/i, conf: 0.92 },
      { id: 'club_join', patterns: /(?:how\\s+(?:do\\s+)?(?:i\\s+)?(?:join|sign\\s*up|apply|register))\\b/i, conf: 0.91 },
      { id: 'event_query', patterns: /(?:upcoming|next|current|today|this\\s+week|events?|happening)/i, conf: 0.80 },
      { id: 'admission', patterns: /(?:admission|apply|how\\s+to\\s+(?:get\\s+in|enter)|entrance|circular)/i, conf: 0.89 },
      { id: 'fee', patterns: /(?:fee|fees|tuition|cost|how\\s+much|installment)/i, conf: 0.87 },
      { id: 'scholarship', patterns: /(?:scholarship|waiver|concession|financial\\s+aid|stipend)/i, conf: 0.88 },
      { id: 'career', patterns: /(?:career|job|jobs|placement|salary|recruit|hiring|internship)/i, conf: 0.86 },
      { id: 'hostel', patterns: /(?:hostel|dormitory|accommodation|where\\s+do\\s+students\\s+live)/i, conf: 0.90 },
      { id: 'library', patterns: /(?:library|reading\\s+room|e-?library|study\\s+space)/i, conf: 0.91 },
      { id: 'faculty', patterns: /(?:faculty|teacher|professor|lecturer|head\\s+of)/i, conf: 0.88 },
      { id: 'syllabus', patterns: /(?:syllabus|curriculum|courses?|subjects?|course\\s+list)/i, conf: 0.87 },
      { id: 'department', patterns: /(?:which\\s+department|department\\s+choice|te\\s+vs|cse\\s+vs|best\\s+department)/i, conf: 0.89 },
      { id: 'rmg', patterns: /(?:rmg|garment|textile\\s+industry|ready\\s+made|bgmea|btma)/i, conf: 0.85 },
      { id: 'math', patterns: /(?:solve|calculate|\\d+\\s*[+\\-*/^]\\s*\\d+|integral|mean|average)/i, conf: 0.82 },
      { id: 'code', patterns: /(?:write\\s+(?:a\\s+)?(?:program|code|function)|fibonacci|factorial|bubble\\s+sort)/i, conf: 0.83 },
      { id: 'citation', patterns: /(?:cite|citation|reference|bibliography|apa|mla|harvard)/i, conf: 0.88 },
      { id: 'study', patterns: /(?:study\\s+tip|how\\s+to\\s+study|exam\\s+preparation|exam\\s+tip)/i, conf: 0.85 },
      { id: 'transport', patterns: /(?:bus|transport|commute|how\\s+to\\s+(?:get|reach)|route)/i, conf: 0.86 },
      { id: 'security', patterns: /(?:security|safety|emergency|ragging|harassment|safe)/i, conf: 0.84 },
      { id: 'portal_feature', patterns: /(?:passport|leaderboard|certificate|q&a|complaint|feedback)/i, conf: 0.83 },
      { id: 'joke', patterns: /(?:tell\\s+me\\s+a\\s+joke|joke|funny|make\\s+me\\s+laugh)/i, conf: 0.90 },
      { id: 'news', patterns: /(?:news|update|what.*new|happening|recent|latest)/i, conf: 0.78 },
    ];
    function naiClassifyIntent(query) {
      var best = null, bestConf = 0;
      for (var i = 0; i < NAI_INTENTS.length; i++) {
        if (NAI_INTENTS[i].patterns.test(query) && NAI_INTENTS[i].conf > bestConf) {
          bestConf = NAI_INTENTS[i].conf; best = NAI_INTENTS[i];
        }
      }
      return best ? { id: best.id, conf: bestConf } : { id: 'unknown', conf: 0 };
    }

    /* ---- 3. PROACTIVE SUGGESTIONS ---- */
    var NAI_SUGGESTIONS = {
      greeting: ['What is NITER?', 'Which clubs are there?', 'Upcoming events'],
      farewell: ['Thanks for the help!', 'What have you learned?'],
      thanks: ['What have you learned?', 'Tell me a joke'],
      help: ['Which clubs are there?', 'Upcoming events', 'How do I join a club?'],
      club_query: ['How do I join a club?', 'Take the quiz', 'Upcoming events'],
      admission: ['Fee structure', 'Which department should I choose?'],
      career: ['Which clubs help with careers?', 'Internship opportunities'],
      library: ['Library rules', 'Library hours', 'Study tips'],
      faculty: ['Which department should I choose?', 'Faculty contact'],
      rmg: ['RMG companies', 'Career in RMG', 'BTMA'],
      study: ['Exam preparation', 'Academic writing'],
    };
    function naiProactiveSuggestions(intent) {
      return (NAI_SUGGESTIONS[intent] || NAI_SUGGESTIONS.help).slice(0, 4);
    }

    /* ---- 4. QUERY REFORMULATION ---- */
    var NAI_SPELL_FIXES = {
      'syllbus': 'syllabus', 'syallbus': 'syllabus', 'libary': 'library',
      'libraray': 'library', 'hositel': 'hostel', 'admissin': 'admission',
      'scholorship': 'scholarship', 'faculity': 'faculty', 'depratment': 'department',
      'univeristy': 'university', 'enginnering': 'engineering', 'caluclate': 'calculate',
      'recomend': 'recommend', 'accomodation': 'accommodation',
    };
    var NAI_ALIASES = {
      'te': 'textile engineering', 'ipe': 'industrial and production engineering',
      'fdae': 'fashion design and apparel engineering', 'cse': 'computer science and engineering',
      'eee': 'electrical and electronic engineering', 'rmg': 'ready made garments',
      'btma': 'bangladesh textile mills association', 'du': 'university of dhaka',
    };
    function naiReformulate(query) {
      var q = query.toLowerCase().trim();
      Object.keys(NAI_SPELL_FIXES).forEach(function(miss) {
        q = q.replace(new RegExp('\\\\b' + miss + '\\\\b', 'gi'), NAI_SPELL_FIXES[miss]);
      });
      Object.keys(NAI_ALIASES).forEach(function(abbr) {
        q = q.replace(new RegExp('\\\\b' + abbr + '\\\\b', 'gi'), NAI_ALIASES[abbr]);
      });
      return q;
    }

    /* ---- 5. PROGRESSIVE FALLBACK ---- */
    function naiProgressiveFallback(query, chips) {
      var reform = naiReformulate(query);
      if (reform !== query.toLowerCase()) {
        var reBest = null, reScore = 0;
        NAI_KB.forEach(function(k) {
          var score = 0;
          k.topics.forEach(function(tp) { if (reform.indexOf(tp) !== -1) score += tp.length + 4; });
          if (score > reScore) { reScore = score; reBest = k; }
        });
        if (reBest && reScore >= 6) return { text: reBest.a, chips: chips.slice(0, 4), link: reBest.link, reformulated: true };
      }
      var brainHit = naiBrainFindFact(query);
      if (brainHit) return naiBrainLookupAnswer(query);
      return null;
    }

    /* ---- 6. SENTIMENT ANALYSIS ---- */
    var NAI_SENT_POS = /(?:good|great|nice|awesome|excellent|perfect|love|amazing|wonderful|thanks|helpful|best|cool)/i;
    var NAI_SENT_NEG = /(?:bad|terrible|horrible|awful|worst|hate|slow|broken|bug|error|wrong|confused|lost|difficult|hard)/i;
    var NAI_SENT_URGENT = /(?:urgent|emergency|asap|immediately|right now|critical|help me now|really need|quickly)/i;
    function naiSentiment(query) {
      if (NAI_SENT_URGENT.test(query)) return { type: 'urgent', prefix: '' };
      if (NAI_SENT_NEG.test(query)) return { type: 'negative', prefix: '' };
      if (NAI_SENT_POS.test(query)) return { type: 'positive', prefix: '' };
      return { type: 'neutral', prefix: '' };
    }

    /* ---- 7. CONVERSATION ANALYTICS ---- */
    var NAI_ANALYTICS_KEY = 'niter_ai_analytics_v2';
    function naiAnalyticsLoad() {
      try {
        var a = JSON.parse(localStorage.getItem(NAI_ANALYTICS_KEY) || 'null');
        if (a && typeof a === 'object') { a.topics = a.topics || {}; a.totalQueries = a.totalQueries || 0; a.totalSessions = a.totalSessions || 0; return a; }
      } catch(e) {}
      return { topics: {}, totalQueries: 0, totalSessions: 0 };
    }
    function naiAnalyticsSave(a) { try { localStorage.setItem(NAI_ANALYTICS_KEY, JSON.stringify(a)); } catch(e) {} }
    function naiAnalyticsTrack(intent) {
      var a = naiAnalyticsLoad(); a.totalQueries++;
      if (intent && intent !== 'unknown') a.topics[intent] = (a.topics[intent] || 0) + 1;
      naiAnalyticsSave(a);
    }
    function naiAnalyticsReport() {
      var a = naiAnalyticsLoad();
      var top = Object.keys(a.topics).sort(function(x,y) { return a.topics[y] - a.topics[x]; }).slice(0, 5);
      var lines = top.map(function(t) { return '  - ' + t + ': ' + a.topics[t] + ' queries'; });
      return { text: 'NITER AI Analytics: ' + a.totalQueries + ' total queries, ' + a.totalSessions + ' sessions. Top topics: ' + (lines.length ? lines.join(', ') : 'none yet'), chips: ['What have you learned?', 'Which clubs are there?'], link: null };
    }

    /* ---- 8. ENHANCED RESPONSE FORMATTER ---- */
    function naiFormatResponse(result) {
      if (!result || !result.text) return result;
      return result;
    }

    /* ================================================================ */

`;

// Insert before naiModActive
code = code.slice(0, modIdx) + ENGINE_CODE + code.slice(modIdx);

// Step 2: Add intent classification at the start of naiAsk
const NAIASK_MARKER = '    function naiAsk(q) {\n      var query = naiNorm(q);';
const naiAskIdx = code.indexOf(NAIASK_MARKER);
if (naiAskIdx === -1) { console.error('Cannot find naiAsk'); process.exit(1); }

const NAIASK_INJECTION = `    function naiAsk(q) {
      var query = naiNorm(q);
      if (!query) return null;

      /* ---- ADVANCED ENGINE: classify intent ---- */
      var _intent = naiClassifyIntent(query);
      var _sent = naiSentiment(query);
      var _ctx = naiCtxLoad();
      naiAnalyticsTrack(_intent.id);

      /* ---- query reformulation ---- */
      var _reformed = naiReformulate(query);
      if (_reformed !== query) query = _reformed;

      /* ---- follow-up detection ---- */
      if (naiCtxIsFollowUp(query) && _ctx.lastIntent) {
        var fuTopic = _ctx.lastIntent;
        var fuKB = NAI_KB.filter(function(k) { return k.id === fuTopic || k.topics.indexOf(fuTopic) !== -1; })[0];
        if (fuKB) {
          naiCtxTrack(query, fuTopic);
          return naiFormatResponse({ text: fuKB.a, chips: naiProactiveSuggestions(fuTopic), link: fuKB.link });
        }
      }`;

code = code.slice(0, naiAskIdx) + NAIASK_INJECTION + code.slice(naiAskIdx + NAIASK_MARKER.length);

// Step 3: Add analytics command to brain command handler
const BRAIN_PANEL_MARKER = "return { text: txt, brain: snap, chips: [\"remember that the library opens at 9am\", \"Which clubs are there?\"], link: null };";
const brainIdx = code.indexOf(BRAIN_PANEL_MARKER);
if (brainIdx !== -1) {
  const afterBrain = brainIdx + BRAIN_PANEL_MARKER.length;
  const analyticsCmd = "\n      /* analytics */\n      if (/analytics|usage\\s+stats|show\\s+analytics/i.test(query)) {\n        return naiAnalyticsReport();\n      }";
  code = code.slice(0, afterBrain) + analyticsCmd + code.slice(afterBrain);
}

// Step 4: Add analytics to brain snapshot
const SNAPSHOT_MARKER = "log: b.log.slice(-6).reverse(),\n        stats: b.stats\n      };";
const snapIdx = code.indexOf(SNAPSHOT_MARKER);
if (snapIdx !== -1) {
  const analyticsSnap = "\n        analytics: naiAnalyticsLoad()";
  code = code.slice(0, snapIdx + "log: b.log.slice(-6).reverse(),\n        stats: b.stats".length) + analyticsSnap + code.slice(snapIdx + "log: b.log.slice(-6).reverse(),\n        stats: b.stats".length);
}

writeFileSync(file, code, 'utf8');
console.log('AI upgrade v2 injected cleanly');
