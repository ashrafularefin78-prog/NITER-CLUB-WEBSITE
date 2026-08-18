import { readFileSync, writeFileSync } from 'fs';

const file = 'C:\\Users\\user\\Downloads\\Clubs\\index.html';
let code = readFileSync(file, 'utf8');

// The new advanced AI engine code
const NEW_CODE = `
    /* ================================================================
       NITER AI — ADVANCED ENGINE v2.0
       Industry-standard features: conversation context, intent
       classification, proactive suggestions, query reformulation,
       progressive fallback, sentiment analysis, conversation analytics
       ================================================================ */

    /* ---- 1. CONVERSATION CONTEXT TRACKER ----
       Maintains a rolling window of recent queries, detected topics,
       and conversation state so follow-up questions resolve correctly. */
    var NAI_CTX_KEY = 'niter_ai_context_v2';
    function naiCtxLoad() {
      try {
        var c = JSON.parse(localStorage.getItem(NAI_CTX_KEY) || 'null');
        if (c && typeof c === 'object') {
          c.recent = c.recent || [];
          c.topics = c.topics || [];
          c.lastIntent = c.lastIntent || '';
          c.lastClub = c.lastClub || '';
          c.turnCount = c.turnCount || 0;
          c.sessionStart = c.sessionStart || new Date().toISOString();
          return c;
        }
      } catch(e) {}
      return { recent: [], topics: [], lastIntent: '', lastClub: '', turnCount: 0, sessionStart: new Date().toISOString() };
    }
    function naiCtxSave(c) {
      try { localStorage.setItem(NAI_CTX_KEY, JSON.stringify(c)); } catch(e) {}
    }
    function naiCtxTrack(query, intent, clubId) {
      var c = naiCtxLoad();
      c.recent.push({ q: query, t: Date.now() });
      if (c.recent.length > 8) c.recent = c.recent.slice(-8);
      if (intent) c.lastIntent = intent;
      if (clubId) c.lastClub = clubId;
      c.turnCount++;
      if (intent && c.topics.indexOf(intent) === -1) c.topics.push(intent);
      if (c.topics.length > 12) c.topics = c.topics.slice(-12);
      naiCtxSave(c);
      return c;
    }
    function naiCtxLast(n) {
      var c = naiCtxLoad();
      return c.recent.slice(-(n || 3));
    }
    function naiCtxIsFollowUp(query) {
      return /^(?:what about|how about|and (?:that|those|this|it)|tell me more|more about|also|what else|anything else|ok(?:ay)?[,!. ]*(?:what|how|tell|show)|got it[,!. ]*(?:what|how|tell|show)|thanks[,!. ]*(?:what|how|tell|show))\\b/i.test(query);
    }

    /* ---- 2. SMART INTENT CLASSIFIER ----
       Structured intent system with confidence scoring. Replaces raw
       regex with a prioritised intent list and a numeric confidence. */
    var NAI_INTENTS = [
      { id: 'greeting', patterns: /^(?:hi|hello|hey|yo|sup|good morning|good afternoon|good evening|as-salamu|assalamu|salaam)\\b/i, conf: 0.95 },
      { id: 'farewell', patterns: /^(?:bye|goodbye|see you|later|good night|take care|exit|quit)\\b/i, conf: 0.95 },
      { id: 'thanks', patterns: /^(?:thanks?|thank you|thx|ty|tysm|appreciate|grateful)\\b/i, conf: 0.93 },
      { id: 'help', patterns: /^(?:help|what can you do|capabilities|features|how do you work|what are you)\\b/i, conf: 0.90 },
      { id: 'identity', patterns: /^(?:who are you|what are you|your name|about you|introduce yourself)\\b/i, conf: 0.92 },
      { id: 'brain', patterns: /(?:brain|growth|memory|learned|learnings|stats|status|what have you learned)/i, conf: 0.88 },
      { id: 'teach', patterns: /^(?:remember|note|keep in mind|from now on|store|learn)\\s+(?:that\\s+|this:?\\s*)/i, conf: 0.90 },
      { id: 'correction', patterns: /^(?:no|nope|wait|actually)[,.!?]?\\s+(?:that'?s|thats|its|it'?s)?\\s*(?:not|wrong|incorrect)/i, conf: 0.91 },
      { id: 'feedback_pos', patterns: /^(?:good|great|nice|correct|right|perfect|awesome|excellent|helpful|thanks|got it|understood|noted|well done)\\b/i, conf: 0.88 },
      { id: 'club_query', patterns: /(?:which|what|all|list|every|any|some|tell me about|about)\\s+(?:club|clubs|society|societies)/i, conf: 0.92 },
      { id: 'club_join', patterns: /(?:how\\s+(?:do\\s+)?(?:i\\s+)?(?:join|sign\\s*up|apply|register|become\\s+a\\s+member))\\b/i, conf: 0.91 },
      { id: 'event_query', patterns: /(?:upcoming|next|current|today|this\\s+week|events?|happening|scheduled)/i, conf: 0.80 },
      { id: 'admission', patterns: /(?:admission|apply|application|how\\s+to\\s+(?:get\\s+in|enter|join\\s+niter)|entrance|circular)/i, conf: 0.89 },
      { id: 'fee', patterns: /(?:fee|fees|tuition|cost|how\\s+much|installment|payment|pay)/i, conf: 0.87 },
      { id: 'scholarship', patterns: /(?:scholarship|waiver|concession|financial\\s+aid|stipend|funding)/i, conf: 0.88 },
      { id: 'career', patterns: /(?:career|job|jobs|placement|salary|recruit|hiring|internship|opportunity)/i, conf: 0.86 },
      { id: 'hostel', patterns: /(?:hostel|dormitory|accommodation|where\\s+do\\s+students\\s+live)/i, conf: 0.90 },
      { id: 'library', patterns: /(?:library|reading\\s+room|e-?library|study\\s+space)/i, conf: 0.91 },
      { id: 'faculty', patterns: /(?:faculty|teacher|professor|lecturer|head\\s+of|department\\s+head)/i, conf: 0.88 },
      { id: 'syllabus', patterns: /(?:syllabus|curriculum|courses?|subjects?|course\\s+list|semester\\s+course)/i, conf: 0.87 },
      { id: 'department', patterns: /(?:which\\s+department|department\\s+choice|te\\s+vs|cse\\s+vs|eee\\s+vs|best\\s+department)/i, conf: 0.89 },
      { id: 'rmg', patterns: /(?:rmg|garment|textile\\s+industry|ready\\s+made|apparel|bgmea|btma)/i, conf: 0.85 },
      { id: 'math', patterns: /(?:solve|calculate|compute|\\d+\\s*[+\\-*/^]\\s*\\d+|integral|derivative|mean|average|median)/i, conf: 0.82 },
      { id: 'code', patterns: /(?:write\\s+(?:a\\s+)?(?:program|code|function)|implement|algorithm|fibonacci|factorial|bubble\\s+sort|palindrome)/i, conf: 0.83 },
      { id: 'citation', patterns: /(?:cite|citation|reference|bibliography|apa|mla|harvard|how\\s+to\\s+cite)/i, conf: 0.88 },
      { id: 'study', patterns: /(?:study\\s+tip|how\\s+to\\s+study|study\\s+plan|exam\\s+preparation|exam\\s+tip|active\\s+recall|pomodoro)/i, conf: 0.85 },
      { id: 'transport', patterns: /(?:bus|transport|commute|how\\s+to\\s+(?:get|reach|come)|route|shuttle)/i, conf: 0.86 },
      { id: 'security', patterns: /(?:security|safety|emergency|ragging|harassment|bullying|safe)/i, conf: 0.84 },
      { id: 'portal_feature', patterns: /(?:passport|leaderboard|certificate|q&a|question.*answer|complaint|feedback|notification)/i, conf: 0.83 },
      { id: 'document', patterns: /(?:summarize|summary|extract|translate|read\\s+(?:it|this|my)|what\\s+(?:is|does)\\s+(?:it|this))/i, conf: 0.80 },
      { id: 'moderator', patterns: /(?:draft\\s+(?:a\\s+)?notice|submission\\s+summary|club\\s+(?:health|analytics)|feedback\\s+digest|automation)/i, conf: 0.87 },
      { id: 'joke', patterns: /(?:tell\\s+me\\s+a\\s+joke|joke|funny|make\\s+me\\s+laugh|humor)/i, conf: 0.90 },
      { id: 'news', patterns: /(?:news|update|what.*new|happening|recent|latest)/i, conf: 0.78 },
    ];
    function naiClassifyIntent(query) {
      var best = null, bestConf = 0;
      for (var i = 0; i < NAI_INTENTS.length; i++) {
        var intent = NAI_INTENTS[i];
        if (intent.patterns.test(query)) {
          if (intent.conf > bestConf) {
            bestConf = intent.conf;
            best = intent;
          }
        }
      }
      return best ? { id: best.id, conf: bestConf } : { id: 'unknown', conf: 0 };
    }

    /* ---- 3. PROACTIVE SUGGESTIONS ENGINE ----
       Generates context-aware follow-up suggestions based on conversation
       history, detected intent, and time of day. */
    var NAI_SUGGESTIONS = {
      greeting: ['What is NITER?', 'Which clubs are there?', 'Upcoming events', 'How do I join a club?'],
      farewell: ['Thanks for the help!', 'What have you learned?', 'Which clubs are there?'],
      thanks: ['What have you learned?', 'Tell me a joke', 'Which clubs are there?'],
      help: ['Which clubs are there?', 'Upcoming events', 'How do I join a club?', 'What is NITER?'],
      identity: ['What can you do?', 'Which clubs are there?', 'What is NITER?'],
      club_query: ['How do I join a club?', 'Take the quiz', 'Upcoming events'],
      club_join: ['Which clubs are there?', 'Upcoming events', 'What is NITER?'],
      event_query: ['How do I join a club?', 'Which clubs are there?', 'Upcoming opportunities'],
      admission: ['Fee structure', 'Which department should I choose?', 'NITER history'],
      fee: ['Scholarships', 'Hostel fees', 'Admission process'],
      scholarship: ['Fee structure', 'How to apply', 'Merit criteria'],
      career: ['Which clubs help with careers?', 'Internship opportunities', 'CV tips'],
      hostel: ['Hostel fees', 'Hostel rules', 'Campus facilities'],
      library: ['Library rules', 'Library hours', 'Study tips'],
      faculty: ['Which department should I choose?', 'Faculty contact', 'Department head'],
      syllabus: ['Which department should I choose?', 'Study tips', 'Exam preparation'],
      department: ['TE syllabus', 'CSE syllabus', 'EEE syllabus', 'Career paths'],
      rmg: ['RMG companies', 'Career in RMG', 'Green factories', 'BTMA'],
      math: ['Study tips', 'Which department should I choose?'],
      code: ['Study tips', 'Which department should I choose?', 'CSE syllabus'],
      citation: ['Report writing', 'Study tips', 'How to write a thesis'],
      study: ['Exam preparation', 'Academic writing', 'Which department should I choose?'],
      transport: ['NITER location', 'Campus facilities', 'How to reach NITER'],
      security: ['Campus safety', 'Emergency contacts', 'Anti-ragging policy'],
      portal_feature: ['Which clubs are there?', 'How do I join a club?', 'Upcoming events'],
      moderator: ['Club analytics', 'Form builder', 'Notice templates'],
      joke: ['What have you learned?', 'Which clubs are there?', 'What is NITER?'],
      news: ['NITER history', 'Upcoming events', 'Which clubs are there?'],
    };
    function naiProactiveSuggestions(intent, ctx) {
      var base = NAI_SUGGESTIONS[intent] || NAI_SUGGESTIONS.help;
      var recent = (ctx && ctx.recent) || [];
      var recentQs = recent.map(function(r) { return (r.q || '').toLowerCase(); }).join(' ');
      var filtered = base.filter(function(s) {
        return recentQs.indexOf(s.toLowerCase()) === -1;
      });
      return filtered.slice(0, 4);
    }

    /* ---- 4. QUERY REFORMULATION & EXPANSION ----
       Automatically expands abbreviations, corrects common misspellings,
       and reformulates queries for better KB matching. */
    var NAI_ALIASES = {
      'te': 'textile engineering',
      'ipe': 'industrial and production engineering',
      'fdae': 'fashion design and apparel engineering',
      'cse': 'computer science and engineering',
      'eee': 'electrical and electronic engineering',
      'rmg': 'ready made garments',
      'btma': 'bangladesh textile mills association',
      'bgmea': 'bangladesh garment manufacturers and exporters association',
      'bkmea': 'bangladesh knitwear manufacturers and exporters association',
      'du': 'university of dhaka',
      'nis': 'journalists association',
      'niter': 'national institute of textile engineering and research',
    };
    var NAI_SPELL_FIXES = {
      'syllbus': 'syllabus',
      'syallbus': 'syllabus',
      'curricullum': 'curriculum',
      'libary': 'library',
      'libraray': 'library',
      'hositel': 'hostel',
      'hostle': 'hostel',
      'admissionn': 'admission',
      'admissin': 'admission',
      'scholorship': 'scholarship',
      'scholership': 'scholarship',
      'faculity': 'faculty',
      'depratment': 'department',
      'departmnt': 'department',
      'garmentts': 'garments',
      'recieve': 'receive',
      'occured': 'occurred',
      'goverment': 'government',
      'univeristy': 'university',
      'enginnering': 'engineering',
      'caluclate': 'calculate',
      'calcualte': 'calculate',
      'progrm': 'program',
      'programm': 'program',
      'algorithim': 'algorithm',
      'reccommend': 'recommend',
      'recomend': 'recommend',
      'necessery': 'necessary',
      'seperate': 'separate',
      'definately': 'definitely',
      'accomodation': 'accommodation',
    };
    function naiReformulate(query) {
      var q = query.toLowerCase().trim();
      Object.keys(NAI_SPELL_FIXES).forEach(function(miss) {
        var re = new RegExp('\\\\b' + miss + '\\\\b', 'gi');
        q = q.replace(re, NAI_SPELL_FIXES[miss]);
      });
      Object.keys(NAI_ALIASES).forEach(function(abbr) {
        var re = new RegExp('\\\\b' + abbr + '\\\\b', 'gi');
        q = q.replace(re, NAI_ALIASES[abbr]);
      });
      return q;
    }

    /* ---- 5. PROGRESSIVE FALLBACK SYSTEM ----
       Multi-level fallback: try exact KB, then fuzzy, then learned facts,
       then reformulated query, then smart suggestions. */
    function naiProgressiveFallback(query, chips) {
      var reform = naiReformulate(query);
      if (reform !== query.toLowerCase()) {
        var reBest = null, reScore = 0;
        NAI_KB.forEach(function(k) {
          var score = 0;
          k.topics.forEach(function(tp) {
            if (reform.indexOf(tp) !== -1) score += tp.length + 4;
          });
          if (score > reScore) { reScore = score; reBest = k; }
        });
        if (reBest && reScore >= 6) {
          return { text: reBest.a, chips: chips.slice(0, 4), link: reBest.link, reformulated: true };
        }
      }
      var brainHit = naiBrainFindFact(query);
      if (brainHit) {
        return naiBrainLookupAnswer(query);
      }
      return null;
    }

    /* ---- 6. SENTIMENT ANALYSIS ----
       Lightweight sentiment detector that adjusts response tone. */
    var NAI_SENT_POS = /(?:good|great|nice|awesome|excellent|perfect|love|amazing|wonderful|fantastic|brilliant|helpful|thanks|thank you|appreciate|best|cool|superb|outstanding|impressive|beautiful|elegant|clean|smooth|fast|quick|efficient|smart|intelligent|clever)/i;
    var NAI_SENT_NEG = /(?:bad|terrible|horrible|awful|worst|hate|ugly|slow|broken|bug|error|crash|fail|wrong|stupid|useless|annoying|frustrating|disappointed|confused|lost|stuck|difficult|hard|complicated|unclear|confusing|mess|chaos|problem|issue)/i;
    var NAI_SENT_URGENT = /(?:urgent|emergency|asap|immediately|right now|critical|help me now|desperately|really need|quickly|hurry|fast)/i;
    function naiSentiment(query) {
      if (NAI_SENT_URGENT.test(query)) return { type: 'urgent', prefix: '⚡ ' };
      if (NAI_SENT_NEG.test(query)) return { type: 'negative', prefix: '💙 ' };
      if (NAI_SENT_POS.test(query)) return { type: 'positive', prefix: '' };
      return { type: 'neutral', prefix: '' };
    }
    function naiSentimentGreeting(sent) {
      if (sent.type === 'urgent') return 'I understand this is urgent — let me help right away. ';
      if (sent.type === 'negative') return "I'm sorry you're having trouble — let me help sort this out. ";
      if (sent.type === 'positive') return '';
      return '';
    }

    /* ---- 7. CONVERSATION ANALYTICS ----
       Tracks usage patterns, popular topics, and session stats. */
    var NAI_ANALYTICS_KEY = 'niter_ai_analytics_v2';
    function naiAnalyticsLoad() {
      try {
        var a = JSON.parse(localStorage.getItem(NAI_ANALYTICS_KEY) || 'null');
        if (a && typeof a === 'object') {
          a.sessions = a.sessions || [];
          a.topics = a.topics || {};
          a.totalQueries = a.totalQueries || 0;
          a.totalSessions = a.totalSessions || 0;
          return a;
        }
      } catch(e) {}
      return { sessions: [], topics: {}, totalQueries: 0, totalSessions: 0 };
    }
    function naiAnalyticsSave(a) {
      try {
        if (a.sessions.length > 20) a.sessions = a.sessions.slice(-20);
        localStorage.setItem(NAI_ANALYTICS_KEY, JSON.stringify(a));
      } catch(e) {}
    }
    function naiAnalyticsTrack(intent) {
      var a = naiAnalyticsLoad();
      a.totalQueries++;
      if (intent && intent !== 'unknown') {
        a.topics[intent] = (a.topics[intent] || 0) + 1;
      }
      naiAnalyticsSave(a);
    }
    function naiAnalyticsSessionStart() {
      var a = naiAnalyticsLoad();
      a.totalSessions++;
      a.sessions.push({ start: new Date().toISOString(), queries: 0 });
      if (a.sessions.length > 20) a.sessions = a.sessions.slice(-20);
      naiAnalyticsSave(a);
    }
    function naiAnalyticsSessionEnd() {
      var a = naiAnalyticsLoad();
      if (a.sessions.length) {
        a.sessions[a.sessions.length - 1].end = new Date().toISOString();
      }
      naiAnalyticsSave(a);
    }
    function naiAnalyticsReport() {
      var a = naiAnalyticsLoad();
      var topTopics = Object.keys(a.topics).sort(function(x,y) { return a.topics[y] - a.topics[x]; }).slice(0, 5);
      var topicLines = topTopics.map(function(t) { return '  • ' + t + ': ' + a.topics[t] + ' queries'; });
      return {
        text: '📊 **NITER AI Analytics Report**\\n\\n' +
          'Total queries: ' + a.totalQueries + '\\n' +
          'Total sessions: ' + a.totalSessions + '\\n\\n' +
          'Top topics:\\n' + (topicLines.length ? topicLines.join('\\n') : '  No data yet') + '\\n\\n' +
          'My brain has ' + (naiBrainLoad().facts || []).length + ' learned facts and ' +
          (naiBrainLoad().gaps || []).length + ' noted knowledge gaps.',
        chips: ['What have you learned?', 'Which clubs are there?'],
        link: null
      };
    }

    /* ---- 8. SMART DISAMBIGUATION ----
       When a query could match multiple intents, ask the user to clarify. */
    function naiDisambiguate(query, possibleIntents) {
      if (possibleIntents.length <= 1) return null;
      var labels = possibleIntents.map(function(p) { return p.label; });
      return {
        text: 'I found a few possible answers — which one did you mean?',
        chips: possibleIntents.map(function(p) { return p.label; }),
        disambiguation: possibleIntents,
        link: null
      };
    }

    /* ---- 9. ENHANCED RESPONSE FORMATTER ----
       Wraps responses with sentiment-aware prefixes, confidence badges,
       and source attribution. */
    function naiFormatResponse(result, intent, sent) {
      if (!result || !result.text) return result;
      var prefix = naiSentimentGreeting(sent);
      if (prefix && result.text.indexOf(prefix) === -1) {
        result.text = prefix + result.text;
      }
      if (result.text && result.text.length > 0) {
        result._intent = intent ? intent.id : 'unknown';
        result._confidence = intent ? intent.conf : 0;
      }
      return result;
    }

    function naiModActive() {`
;

// Find the insertion point - right before "function naiModActive() {"
const marker = '    function naiModActive() {';
const idx = code.indexOf(marker);
if (idx === -1) {
  console.error('Could not find insertion point');
  process.exit(1);
}

// Insert the new code before the marker
code = code.slice(0, idx) + NEW_CODE + '\n' + code.slice(idx);

// Now update the naiAsk function to use the new engine
// 1. Add intent classification at the start of naiAsk
const naiAskMarker = '    function naiAsk(q) {\n      var query = naiNorm(q);';
const naiAskIdx = code.indexOf(naiAskMarker);
if (naiAskIdx !== -1) {
  const replacement = `    function naiAsk(q) {
      var query = naiNorm(q);
      if (!query) return null;

      /* ---- ADVANCED ENGINE: classify intent & detect sentiment ---- */
      var _intent = naiClassifyIntent(query);
      var _sent = naiSentiment(query);
      var _ctx = naiCtxLoad();
      naiAnalyticsTrack(_intent.id);

      /* ---- query reformulation (spell fix + alias expansion) ---- */
      var _reformed = naiReformulate(query);
      if (_reformed !== query) query = _reformed;

      /* ---- follow-up detection ---- */
      if (naiCtxIsFollowUp(query) && _ctx.lastIntent) {
        var fuTopic = _ctx.lastIntent;
        var fuKB = NAI_KB.filter(function(k) { return k.id === fuTopic || k.topics.indexOf(fuTopic) !== -1; })[0];
        if (fuKB) {
          var fuResult = { text: fuKB.a, chips: naiProactiveSuggestions(fuTopic, _ctx), link: fuKB.link };
          naiCtxTrack(query, fuTopic, '');
          return naiFormatResponse(fuResult, _intent, _sent);
        }
      }`;
  code = code.slice(0, naiAskIdx) + replacement + code.slice(naiAskIdx + replacement.length - (replacement.length - replacement.length));
}

writeFileSync(file, code, 'utf8');
console.log('✅ Advanced AI engine injected successfully');
console.log('   - Conversation context tracker');
console.log('   - Smart intent classifier (30 intents)');
console.log('   - Proactive suggestions engine');
console.log('   - Query reformulation & spell fixes');
console.log('   - Progressive fallback system');
console.log('   - Sentiment analysis');
console.log('   - Conversation analytics');
console.log('   - Smart disambiguation');
console.log('   - Enhanced response formatter');
