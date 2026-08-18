import { readFileSync, writeFileSync } from 'fs';

var c = readFileSync('index.html', 'utf8');

// 1. Add conversation engine before naiChatReply
var convEngine = `
    /* ================================================================
       NITER AI — CONVERSATIONAL ENGINE v3.0
       Advanced messaging: context memory, personality, emotions,
       humor, topic management, and natural conversation flow.
       ================================================================ */

    /* ---- 1. CONVERSATION MEMORY & CONTEXT ---- */
    var NAI_CONV = {
      history: [],
      topics: [],
      userPrefs: {},
      currentTopic: null,
      turnCount: 0,
      lastQuestion: null,
      lastAnswer: null,
      mood: 'neutral',
      rapport: 0,
    };

    function naiConvTrack(role, text, topic) {
      NAI_CONV.history.push({ role: role, text: text, topic: topic || NAI_CONV.currentTopic, time: Date.now() });
      if (NAI_CONV.history.length > 20) NAI_CONV.history.shift();
      NAI_CONV.turnCount++;
      if (role === 'user') {
        NAI_CONV.lastQuestion = text;
        if (topic) {
          NAI_CONV.currentTopic = topic;
          var existing = NAI_CONV.topics.find(function(t) { return t.topic === topic; });
          if (existing) { existing.count++; existing.lastTime = Date.now(); }
          else { NAI_CONV.topics.push({ topic: topic, count: 1, lastTime: Date.now() }); }
        }
        NAI_CONV.rapport = Math.min(100, NAI_CONV.rapport + 2);
      }
      if (role === 'ai') NAI_CONV.lastAnswer = text;
    }

    function naiConvSave() {
      try { localStorage.setItem('niter-conv', JSON.stringify({ conv: NAI_CONV, ts: Date.now() })); } catch(e) {}
    }

    function naiConvLoad() {
      try {
        var d = JSON.parse(localStorage.getItem('niter-conv'));
        if (d && d.conv) {
          Object.keys(NAI_CONV).forEach(function(k) { if (d.conv[k] !== undefined) NAI_CONV[k] = d.conv[k]; });
        }
      } catch(e) {}
    }

    function naiConvTopic() {
      var recent = NAI_CONV.topics.filter(function(t) { return Date.now() - t.lastTime < 300000; }).sort(function(a,b) { return b.count - a.count; });
      return recent.length ? recent[0].topic : null;
    }

    /* ---- 2. EMOTIONAL INTELLIGENCE ---- */
    var NAI_EMOTIONS = {
      happy: { words: ['great','awesome','love','amazing','perfect','excellent','best','cool','nice','wonderful','fantastic','brilliant','thanks','thank you','helpful'], prefix: '😊 ', tone: 'warm' },
      sad: { words: ['sad','unhappy','depressed','lonely','miss','cry','tears','heartbroken','upset','down','blue','gloomy','miserable'], prefix: '💙 ', tone: 'gentle' },
      angry: { words: ['angry','furious','hate','stupid','terrible','awful','worst','horrible','annoying','frustrated','mad','rage'], prefix: '😤 ', tone: 'calm' },
      anxious: { words: ['worried','nervous','scared','afraid','panic','anxious','stressed','overwhelmed','terrified','fear'], prefix: '🤗 ', tone: 'reassuring' },
      excited: { words: ['excited','cant wait','eager','thrilled','pumped','stoked','wow','omg','yay'], prefix: '🎉 ', tone: 'enthusiastic' },
      confused: { words: ['confused','lost','unclear','dont understand','confusing','complicated'], prefix: '🤔 ', tone: 'patient' },
      bored: { words: ['bored','boring','nothing','whatever','meh','tired of'], prefix: '😊 ', tone: 'energetic' },
      urgent: { words: ['urgent','asap','emergency','immediately','right now','critical','need help'], prefix: '⚡ ', tone: 'focused' },
    };

    function naiDetectEmotion(q) {
      var nq = q.toLowerCase();
      var best = null, bestScore = 0;
      Object.keys(NAI_EMOTIONS).forEach(function(em) {
        var score = 0;
        NAI_EMOTIONS[em].words.forEach(function(w) { if (nq.indexOf(w) !== -1) score++; });
        if (score > bestScore) { bestScore = score; best = em; }
      });
      return best ? { type: best, prefix: NAI_EMOTIONS[best].prefix, tone: NAI_EMOTIONS[best].tone } : { type: 'neutral', prefix: '', tone: 'neutral' };
    }

    /* ---- 3. PERSONALITY SYSTEM ---- */
    var NAI_PERSONA = {
      name: 'NITER AI',
      traits: ['helpful', 'friendly', 'knowledgeable', 'enthusiastic', 'witty', 'supportive'],
      catchphrases: [
        "That's a great question!",
        "Good thinking!",
        "I love that you asked!",
        "Now we're getting somewhere!",
        "Happy to help with that!",
        "Interesting — let me break that down.",
      ],
    };

    function naiPersonaPhrase() {
      return NAI_PERSONA.catchphrases[Math.floor(Math.random() * NAI_PERSONA.catchphrases.length)];
    }

    /* ---- 4. HUMOR SYSTEM ---- */
    var NAI_JOKES = {
      campus: [
        "Why do NITER students never get lost? Because they always follow the thread! 🧵",
        "What's a textile engineer's favorite exercise? Spinning! 💪",
        "Why did the CSE student bring a ladder to class? To reach the cloud! ☁️",
        "How does an EEE student stay cool? They sit next to the fan — they built it! ⚡",
        "What do you call a fashion student's favorite music? Sewing and the City! 🎵",
        "Why was the math book sad? Because it had too many problems! 📚",
        "What's an IPE student's superpower? Optimizing everything — even their breakfast! 🥐",
      ],
      puns: [
        "I'm textile-y excited to help you! 🧵",
        "That's a knit-picking question — but I love it! 🧶",
        "You've got me all wound up about this topic! 🎯",
        "I'm not weaving around the answer — here it is! 🧵",
        "Let me stitch together the answer for you! 🪡",
      ],
      life: [
        "Why don't scientists trust atoms? Because they make up everything! 🔬",
        "What do you call a fake noodle? An impasta! 🍝",
        "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
        "I told my computer I needed a break — now it won't stop sending me vacation ads! 💻",
      ],
    };

    function naiGetJoke(category) {
      var pool = NAI_JOKES[category] || NAI_JOKES.campus;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    /* ---- 5. TOPIC TRANSITION SYSTEM ---- */
    var NAI_TOPIC_FLOW = {
      admission: ['fees', 'departments', 'location', 'hostels'],
      fees: ['admission', 'scholarship'],
      departments: ['admission', 'career', 'labs'],
      hostels: ['location', 'food'],
      clubs: ['events', 'join-club'],
      events: ['clubs', 'rsvp'],
      exams: ['mark-distribution', 'exam-office'],
      career: ['departments', 'clubs', 'opportunities'],
      ragging: ['security', 'proctor', 'emergency'],
      healthcare: ['emergency', 'security'],
      location: ['transport', 'hostels'],
      transport: ['location'],
      scholarship: ['fees', 'admission'],
      labs: ['departments', 'wifi'],
      wifi: ['labs', 'library'],
      library: ['wifi', 'study'],
      security: ['ragging', 'emergency'],
      emergency: ['security', 'healthcare'],
    };

    function naiTopicSuggestions(currentTopic) {
      var related = NAI_TOPIC_FLOW[currentTopic];
      if (!related || !related.length) return [];
      var recent = NAI_CONV.topics.map(function(t) { return t.topic; });
      return related.filter(function(t) { return recent.indexOf(t) === -1; }).slice(0, 3);
    }

    /* ---- 6. FOLLOW-UP DETECTION ---- */
    function naiIsFollowUp(q) {
      var followUpPatterns = /^(and|also|what about|how about|tell me more|more|continue|elaborate|detail|further|next|then|but|however|actually|really|so|ok|okay|got it|i see|right|sure|yes|no|yep|nope|yeah|nah|hmm|hm|oh|ah|wow|ugh|cool|nice|great|thanks|thank you)$/i;
      return followUpPatterns.test(q.trim()) || q.length < 5;
    }

    function naiResolveFollowUp(q) {
      if (!naiIsFollowUp(q)) return null;
      if (NAI_CONV.lastQuestion) {
        if (/^(more|continue|elaborate|detail|further|explain|tell me more)$/i.test(q.trim())) {
          return { type: 'expand', topic: NAI_CONV.currentTopic };
        }
        if (/^(and|also|what about|how about)$/i.test(q.trim())) {
          var suggestions = naiTopicSuggestions(NAI_CONV.currentTopic);
          if (suggestions.length) {
            return { type: 'related', topics: suggestions };
          }
        }
      }
      return null;
    }

    /* ---- 7. SMART RESPONSE ENHANCER ---- */
    function naiEnhanceResponse(text, context) {
      if (!text) return text;
      var prefix = '';
      if (context && context.emotion && context.emotion.type !== 'neutral') {
        prefix = context.emotion.prefix;
      }
      var personalityPhrase = '';
      if (NAI_CONV.turnCount % 5 === 0 && NAI_CONV.turnCount > 0) {
        personalityPhrase = ' ' + naiPersonaPhrase();
      }
      var suggestions = '';
      if (NAI_CONV.currentTopic) {
        var related = naiTopicSuggestions(NAI_CONV.currentTopic);
        if (related.length > 0 && Math.random() > 0.7) {
          var topicLabels = related.map(function(t) {
            var labels = {
              fees: 'fees', admission: 'admission', departments: 'departments',
              hostels: 'hostels', clubs: 'clubs', events: 'events',
              exams: 'exams', career: 'career', ragging: 'ragging',
              security: 'security', transport: 'transport', scholarship: 'scholarships',
              labs: 'labs', wifi: 'WiFi', library: 'library', food: 'food',
              healthcare: 'healthcare', emergency: 'emergency'
            };
            return labels[t] || t;
          });
          suggestions = '\\n\\n💡 You might also want to know about: ' + topicLabels.join(', ');
        }
      }
      return prefix + text + personalityPhrase + suggestions;
    }

    /* ---- 8. CONVERSATION FLOW MANAGER ---- */
    function naiConversationFlow(q) {
      var emotion = naiDetectEmotion(q);
      NAI_CONV.mood = emotion.type;
      naiConvTrack('user', q, NAI_CONV.currentTopic);
      return {
        emotion: emotion,
        followUp: naiResolveFollowUp(q),
        topic: NAI_CONV.currentTopic,
        turnCount: NAI_CONV.turnCount,
        rapport: NAI_CONV.rapport,
      };
    }

    /* ---- 9. CONVERSATION ANALYTICS ---- */
    function naiConvAnalytics() {
      return {
        turns: NAI_CONV.turnCount,
        topics: NAI_CONV.topics.length,
        topTopic: NAI_CONV.topics.sort(function(a,b) { return b.count - a.count; })[0] ? NAI_CONV.topics.sort(function(a,b) { return b.count - a.count; })[0].topic : 'none',
        rapport: NAI_CONV.rapport,
        mood: NAI_CONV.mood,
        history: NAI_CONV.history.length,
      };
    }
`;

var chatReplyMarker = '    function naiChatReply(q) {';
var idx = c.indexOf(chatReplyMarker);
if (idx === -1) { console.log('ERROR: naiChatReply not found'); process.exit(1); }
c = c.substring(0, idx) + convEngine + '\n\n' + c.substring(idx);
console.log('Added conversation engine (v3.0)');

// 2. Add conversation flow to chat reply
var chatReplyStart = 'function naiChatReply(q) {\n';
var newChatReplyStart = 'function naiChatReply(q) {\n      var _convCtx = naiConversationFlow(q);\n';
c = c.replace(chatReplyStart, newChatReplyStart);
console.log('Added conversation flow to chat reply');

// 3. Hook into naiAsk
var askHook = 'function naiAsk(q) {\n      var query = naiNorm(q);';
var newAskHook = 'function naiAsk(q) {\n      naiConvLoad();\n      var query = naiNorm(q);';
c = c.replace(askHook, newAskHook);
console.log('Hooked conversation tracking into naiAsk');

// 4. Save after KB response
var saveHook = "return { text: best.a, chips: chips.slice(0, 4), link: best.link };";
var newSaveHook = "naiConvTrack('ai', best.a, best.id); naiConvSave();\n        return { text: best.a, chips: chips.slice(0, 4), link: best.link };";
c = c.replace(saveHook, newSaveHook);
console.log('Added conversation save after KB response');

writeFileSync('index.html', c, 'utf8');
console.log('\\nDone: Conversational Engine v3.0 added to NITER AI');
