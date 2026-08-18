import { readFileSync, writeFileSync } from 'fs';

var c = readFileSync('index.html', 'utf8');

// 1. Add Grok-style conversation engine
var grokEngine = `
    /* ================================================================
       NITER AI — GROK-STYLE CONVERSATIONAL ENGINE v4.0
       Inspired by Grok AI: natural language, witty personality,
       context memory, multi-turn dialogue, casual tone, humor.
       ================================================================ */

    /* ---- 1. GROK-STYLE PERSONALITY ---- */
    var GROK_PERSONA = {
      name: 'NITER AI',
      style: 'witty', // witty, casual, helpful
      traits: ['curious', 'witty', 'knowledgeable', 'playful', 'helpful', 'honest'],
      greetings: [
        "Hey! 👋 What's on your mind?",
        "Hello! 🌟 Ready to chat about anything NITER — or life in general?",
        "Hey there! 😊 I'm all ears — ask me anything!",
        "What's up! 🎉 Need help with something or just want to chat?",
      ],
      catchphrases: [
        "Good question — let me think about that...",
        "Now that's interesting!",
        "I love how you think!",
        "Ooh, tricky one — but I got you!",
        "Let's dive into this...",
        "Great thinking!",
        "You're on a roll today!",
        "That's a solid question!",
      ],
      encouragements: [
        "You've got this! 💪",
        "Keep pushing — you're doing great!",
        "That's the spirit! 🌟",
        "Love the energy! Keep going!",
        "You're making progress — don't stop now!",
      ],
      humor: {
        light: ["😄", "😅", "🤣", "😊"],
        witty: ["😏", "🧐", "💡", "🎓"],
        serious: ["🤔", "📋", "✅", "🎯"],
      },
    };

    function grokPick(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    function grokEmoji(mood) {
      var pool = GROK_PERSONA.humor[mood] || GROK_PERSONA.humor.light;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    /* ---- 2. ENHANCED CONVERSATION MEMORY ---- */
    var GROK_CONV = {
      history: [],        // last 30 messages [{role, text, topic, timestamp}]
      topics: [],         // topics discussed [{topic, count, lastSeen, sentiment}]
      userFacts: {},      // learned facts about user {name, major, year, clubs}
      currentTopic: null,
      turnCount: 0,
      rapport: 0,         // 0-100 relationship score
      mood: 'neutral',    // detected user mood
      mode: 'helpful',    // helpful, casual, deep
      lastQuestion: null,
      lastAnswer: null,
      questionHistory: [], // for understanding follow-ups
    };

    function grokConvSave() {
      try {
        localStorage.setItem('grok-conv', JSON.stringify({
          conv: GROK_CONV,
          ts: Date.now()
        }));
      } catch(e) {}
    }

    function grokConvLoad() {
      try {
        var d = JSON.parse(localStorage.getItem('grok-conv'));
        if (d && d.conv) {
          Object.keys(GROK_CONV).forEach(function(k) {
            if (d.conv[k] !== undefined) GROK_CONV[k] = d.conv[k];
          });
        }
      } catch(e) {}
    }

    function grokConvTrack(role, text, topic) {
      var entry = {
        role: role,
        text: text,
        topic: topic || GROK_CONV.currentTopic,
        timestamp: Date.now(),
      };
      GROK_CONV.history.push(entry);
      if (GROK_CONV.history.length > 30) GROK_CONV.history.shift();
      GROK_CONV.turnCount++;

      if (role === 'user') {
        GROK_CONV.lastQuestion = text;
        GROK_CONV.questionHistory.push(text);
        if (GROK_CONV.questionHistory.length > 5) GROK_CONV.questionHistory.shift();

        // Track topic
        if (topic) {
          GROK_CONV.currentTopic = topic;
          var existing = GROK_CONV.topics.find(function(t) { return t.topic === topic; });
          if (existing) {
            existing.count++;
            existing.lastSeen = Date.now();
          } else {
            GROK_CONV.topics.push({ topic: topic, count: 1, lastSeen: Date.now(), sentiment: 'neutral' });
          }
        }

        // Build rapport
        GROK_CONV.rapport = Math.min(100, GROK_CONV.rapport + 3);

        // Learn user facts
        grokLearnFacts(text);
      }

      if (role === 'ai') {
        GROK_CONV.lastAnswer = text;
      }
    }

    function grokLearnFacts(text) {
      var nq = text.toLowerCase();

      // Learn name
      var nameMatch = nq.match(/(?:my name is|i'm|i am|call me)\\s+([a-z]+)/i);
      if (nameMatch) {
        GROK_CONV.userFacts.name = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
      }

      // Learn department
      if (/(?:i'm|i am|studying|study|major|department).*(?:textile|cse|eee|ipe|fdae)/i.test(nq)) {
        if (/textile/i.test(nq)) GROK_CONV.userFacts.department = 'Textile Engineering';
        else if (/cse|computer/i.test(nq)) GROK_CONV.userFacts.department = 'CSE';
        else if (/eee|electrical/i.test(nq)) GROK_CONV.userFacts.department = 'EEE';
        else if (/ipe|industrial/i.test(nq)) GROK_CONV.userFacts.department = 'IPE';
        else if (/fdae|fashion/i.test(nq)) GROK_CONV.userFacts.department = 'FDAE';
      }

      // Learn year/semester
      var yearMatch = nq.match(/(?:i'm|i am|in)\\s*(?:a\\s*)?(?:1st|2nd|3rd|4th|first|second|third|fourth|1|2|3|4)(?:st|nd|rd|th)?\\s*(?:year|semester|batch)/i);
      if (yearMatch) {
        GROK_CONV.userFacts.year = yearMatch[0];
      }

      // Learn interests
      if (/(?:i like|i love|i enjoy|interested in|fan of)\s+(.+)/i.test(nq)) {
        var interestMatch = nq.match(/(?:i like|i love|i enjoy|interested in|fan of)\s+(.+)/i);
        if (interestMatch) {
          if (!GROK_CONV.userFacts.interests) GROK_CONV.userFacts.interests = [];
          var interest = interestMatch[1].split(/[,;.]/)[0].trim();
          if (GROK_CONV.userFacts.interests.indexOf(interest) === -1) {
            GROK_CONV.userFacts.interests.push(interest);
          }
        }
      }
    }

    /* ---- 3. ADVANCED EMOTION DETECTION ---- */
    var GROK_EMOTIONS = {
      happy: { words: ['great','awesome','love','amazing','perfect','excellent','best','cool','nice','wonderful','fantastic','brilliant','happy','glad','excited','yay','wow'], emoji: '😊', tone: 'warm' },
      sad: { words: ['sad','unhappy','depressed','lonely','miss','cry','tears','heartbroken','upset','down','blue','gloomy','miserable','pain','hurt'], emoji: '💙', tone: 'gentle' },
      angry: { words: ['angry','furious','hate','stupid','terrible','awful','worst','horrible','annoying','frustrated','mad','rage','pissed'], emoji: '😤', tone: 'calm' },
      anxious: { words: ['worried','nervous','scared','afraid','panic','anxious','stressed','overwhelmed','terrified','fear','cant sleep'], emoji: '🤗', tone: 'reassuring' },
      excited: { words: ['excited','cant wait','eager','thrilled','pumped','stoked','wow','omg','yay','amazing'], emoji: '🎉', tone: 'enthusiastic' },
      confused: { words: ['confused','lost','unclear','dont understand','what do you mean','confusing','complicated','uncertain','help'], emoji: '🤔', tone: 'patient' },
      bored: { words: ['bored','boring','nothing','whatever','meh','same old','tired of','nothing new'], emoji: '😴', tone: 'energetic' },
      urgent: { words: ['urgent','asap','emergency','immediately','right now','critical','need help','desperate','hurry'], emoji: '⚡', tone: 'focused' },
      curious: { words: ['wondering','curious','tell me','explain','how does','what is','why is','can you','is it true','interesting'], emoji: '💡', tone: 'engaged' },
      grateful: { words: ['thanks','thank you','appreciate','grateful','helpful','awesome','blessed','alhamdulillah'], emoji: '🙏', tone: 'warm' },
    };

    function grokDetectEmotion(q) {
      var nq = q.toLowerCase();
      var scores = {};

      Object.keys(GROK_EMOTIONS).forEach(function(em) {
        var score = 0;
        GROK_EMOTIONS[em].words.forEach(function(w) {
          if (nq.indexOf(w) !== -1) score += w.length; // longer matches = stronger signal
        });
        if (score > 0) scores[em] = score;
      });

      var best = null, bestScore = 0;
      Object.keys(scores).forEach(function(em) {
        if (scores[em] > bestScore) {
          bestScore = scores[em];
          best = em;
        }
      });

      return best ? {
        type: best,
        emoji: GROK_EMOTIONS[best].emoji,
        tone: GROK_EMOTIONS[best].tone,
        intensity: Math.min(1, bestScore / 10),
      } : { type: 'neutral', emoji: '', tone: 'neutral', intensity: 0 };
    }

    /* ---- 4. INTENT CLASSIFICATION ---- */
    var GROK_INTENTS = [
      { intent: 'greeting', patterns: /^(hi|hello|hey|yo|sup|salam|assalam|aoa|good\\s*(morning|afternoon|evening)|ki\\s*obostha|kemon\\s*achen|নমস্কার|হ্যালো)/i, weight: 10 },
      { intent: 'farewell', patterns: /^(bye|goodbye|see\\s*(you|ya)|later|ta\\s*ta|alvida|good\\s*night|শুভরাত্রি)/i, weight: 10 },
      { intent: 'thanks', patterns: /^(thank|thanks|thx|dhonnobad|shukriya|appreciate|জয়)/i, weight: 10 },
      { intent: 'identity', patterns: /(who are you|your name|introduce|what are you|tumi ke|apni ke)/i, weight: 10 },
      { intent: 'capabilities', patterns: /(what can you|how can you|help me|assist|your features|capabilities)/i, weight: 9 },
      { intent: 'joke', patterns: /(joke|funny|make me laugh|humor|entertain|something funny|comedy)/i, weight: 10 },
      { intent: 'motivation', patterns: /(motivat|encourag|inspire|uplift|cheer up|feeling down|stressed|anxious|worried|sad)/i, weight: 8 },
      { intent: 'opinion', patterns: /(what do you think|your opinion|do you like|favorite|best|worst|prefer|recommend)/i, weight: 7 },
      { intent: 'comparison', patterns: /(difference|compare|vs|versus|which is better|which should)/i, weight: 7 },
      { intent: 'advice', patterns: /(recommend|suggest|advice|should I|what should|best option|help me choose)/i, weight: 8 },
      { intent: 'question', patterns: /^(what|where|when|who|how|why|which|is|are|can|do|does|will|should|could|would)/i, weight: 6 },
      { intent: 'casual', patterns: /^(ok|okay|got it|i see|right|sure|yes|no|yep|nope|yeah|nah|hmm|hm|oh|ah|wow|cool|nice|great)/i, weight: 5 },
      { intent: 'statement', patterns: /^.+/i, weight: 3 },
    ];

    function grokClassifyIntent(q) {
      var nq = q.toLowerCase().trim();
      var best = null, bestWeight = 0;

      for (var i = 0; i < GROK_INTENTS.length; i++) {
        if (GROK_INTENTS[i].patterns.test(nq)) {
          if (GROK_INTENTS[i].weight > bestWeight) {
            bestWeight = GROK_INTENTS[i].weight;
            best = GROK_INTENTS[i].intent;
          }
        }
      }

      return best || 'statement';
    }

    /* ---- 5. NATURAL LANGUAGE PATTERNS ---- */
    var GROK_SLANG = {
      'brb': 'be right back',
      'omw': 'on my way',
      'idk': "i don't know",
      'tbh': 'to be honest',
      'imo': 'in my opinion',
      'fyi': 'for your information',
      'asap': 'as soon as possible',
      'lol': 'laughing out loud',
      'lmao': 'laughing my ass off',
      'rofl': 'rolling on the floor laughing',
      'smh': 'shaking my head',
      'ngl': 'not gonna lie',
      'fr': 'for real',
      'istg': 'i swear to god',
      'ikr': 'i know right',
      'wya': 'where you at',
      'wym': 'what do you mean',
      'hmu': 'hit me up',
      'rn': 'right now',
      'bc': 'because',
      'plz': 'please',
      'thx': 'thanks',
      'nvm': 'never mind',
      'dw': "don't worry",
      'npt': 'no problem',
      'gg': 'good game',
      'afk': 'away from keyboard',
    };

    function grokExpandSlang(q) {
      var words = q.split(/\\s+/);
      var expanded = words.map(function(w) {
        var lower = w.toLowerCase().replace(/[^a-z]/g, '');
        return GROK_SLANG[lower] ? GROK_SLANG[lower] : w;
      });
      return expanded.join(' ');
    }

    /* ---- 6. CONVERSATION FLOW ---- */
    var GROK_TOPIC_MAP = {
      admission: { related: ['fees', 'departments', 'location', 'hostels', 'scholarship'], label: 'admission process' },
      fees: { related: ['admission', 'scholarship', 'installment'], label: 'fees & costs' },
      departments: { related: ['admission', 'career', 'labs', 'syllabus'], label: 'departments' },
      hostels: { related: ['location', 'food', 'security'], label: 'hostels' },
      clubs: { related: ['events', 'join-club', 'leaderboard'], label: 'clubs' },
      events: { related: ['clubs', 'rsvp', 'certificate'], label: 'events' },
      exams: { related: ['mark-distribution', 'exam-office', 'exam-quality'], label: 'exams' },
      career: { related: ['departments', 'clubs', 'opportunities'], label: 'career' },
      ragging: { related: ['security', 'proctor', 'emergency'], label: 'anti-ragging' },
      healthcare: { related: ['emergency', 'security'], label: 'healthcare' },
      location: { related: ['transport', 'hostels'], label: 'campus location' },
      transport: { related: ['location'], label: 'transport' },
      scholarship: { related: ['fees', 'admission'], label: 'scholarships' },
      labs: { related: ['departments', 'wifi'], label: 'labs & facilities' },
      wifi: { related: ['labs', 'library'], label: 'WiFi & internet' },
      library: { related: ['wifi', 'study'], label: 'library' },
      security: { related: ['ragging', 'emergency'], label: 'security' },
      emergency: { related: ['security', 'healthcare'], label: 'emergency contacts' },
    };

    function grokTopicSuggestions(currentTopic) {
      var info = GROK_TOPIC_MAP[currentTopic];
      if (!info || !info.related) return [];
      var recent = GROK_CONV.topics.map(function(t) { return t.topic; });
      return info.related.filter(function(t) { return recent.indexOf(t) === -1; }).slice(0, 3);
    }

    /* ---- 7. FOLLOW-UP DETECTION ---- */
    function grokIsFollowUp(q) {
      var patterns = /^(and|also|what about|how about|tell me more|more|continue|elaborate|detail|further|next|then|but|however|actually|really|so|ok|okay|got it|i see|right|sure|yes|no|yep|nope|yeah|nah|hmm|hm|oh|ah|wow|ugh|cool|nice|great|thanks|thank you|anything else|oh really|interesting|wow|nice|cool|oh okay|oh i see)$/i;
      return patterns.test(q.trim()) || q.length < 4;
    }

    function grokResolveFollowUp(q) {
      if (!grokIsFollowUp(q)) return null;

      var nq = q.toLowerCase().trim();

      // "more" / "continue" = expand on last topic
      if (/^(more|continue|elaborate|detail|further|explain|tell me more)$/i.test(nq)) {
        return { type: 'expand', topic: GROK_CONV.currentTopic };
      }

      // "and" / "also" / "what about" = related topic
      if (/^(and|also|what about|how about|anything else)$/i.test(nq)) {
        var suggestions = grokTopicSuggestions(GROK_CONV.currentTopic);
        if (suggestions.length) {
          return { type: 'related', topics: suggestions };
        }
      }

      // Short affirmatives
      if (/^(yes|yep|yeah|sure|right|ok|okay|got it|i see|cool|nice|great|thanks|thank you|oh|ah|wow|interesting)$/i.test(nq)) {
        return { type: 'acknowledgment' };
      }

      return null;
    }

    /* ---- 8. GROK-STYLE RESPONSE ENHANCER ---- */
    function grokEnhanceResponse(text, context) {
      if (!text) return text;

      var prefix = '';
      var suffix = '';

      // Add emotion emoji prefix
      if (context && context.emotion && context.emotion.emoji) {
        prefix = context.emotion.emoji + ' ';
      }

      // Add personality phrase occasionally (every 7th turn)
      if (GROK_CONV.turnCount % 7 === 0 && GROK_CONV.turnCount > 0) {
        suffix = '\\n\\n' + grokPick(GROK_PERSONA.catchphrases);
      }

      // Add topic suggestions (30% chance)
      if (GROK_CONV.currentTopic && Math.random() > 0.7) {
        var suggestions = grokTopicSuggestions(GROK_CONV.currentTopic);
        if (suggestions.length > 0) {
          var labels = suggestions.map(function(t) {
            var info = GROK_TOPIC_MAP[t];
            return info ? info.label : t;
          });
          suffix += '\\n\\n💡 You might also want to know about: ' + labels.join(', ');
        }
      }

      // Add encouragement for high rapport
      if (GROK_CONV.rapport > 50 && Math.random() > 0.8) {
        suffix += '\\n\\n' + grokPick(GROK_PERSONA.encouragements);
      }

      return prefix + text + suffix;
    }

    /* ---- 9. GROK-STYLE GREETING GENERATOR ---- */
    function grokGenerateGreeting() {
      var base = grokPick(GROK_PERSONA.greetings);

      // Personalize if we know user facts
      if (GROK_CONV.userFacts.name) {
        base = "Hey " + GROK_CONV.userFacts.name + "! 👋 " + grokPick([
          "What's on your mind today?",
          "What can I help you with?",
          "Ready to chat about anything?",
          "How's your day going?",
        ]);
      }

      // Reference past conversations
      if (GROK_CONV.turnCount > 5) {
        var lastTopic = GROK_CONV.topics.sort(function(a,b) { return b.count - a.count; })[0];
        if (lastTopic) {
          base += " Last time we talked about " + GROK_TOPIC_MAP[lastTopic.topic].label + " — want to continue or something new?";
        }
      }

      return base;
    }

    /* ---- 10. GENERAL KNOWLEDGE RESPONSES ---- */
    var GROK_GENERAL = {
      meaning_of_life: {
        patterns: /(meaning of life|why are we here|purpose of life|what is the point)/i,
        responses: [
          "42. Obviously. 😄 But if you want a more serious answer: the meaning of life is what you make it. At NITER, that might mean building a career in the RMG industry, making lifelong friends, or finally understanding that one tough course. What's YOUR meaning of life right now?",
          "Philosophers have debated this for millennia! But here's my take: the meaning of life is connection — to people, to purpose, to passion. Speaking of which, NITER has 11 clubs waiting for you to connect with. Want to explore?",
          "Deep question for a campus AI! 🤔 Some say it's happiness, others say it's contribution. I say it's a mix of both — and maybe a good cup of tea from the canteen. What do YOU think?",
        ],
      },
      weather: {
        patterns: /(weather|temperature|rain|hot|cold|humid|forecast|climate)/i,
        responses: [
          "I don't have real-time weather data, but Dhaka is generally hot and humid! 🌡️ Pro tip: carry an umbrella during monsoon season (June-October). The campus can get pretty steamy — literally!",
          "Weather in Dhaka? Hot, humid, and more hot! 😅 Average temps range from 25°C in winter to 35°C+ in summer. Stay hydrated and check the weather app for real-time updates!",
        ],
      },
      time: {
        patterns: /(what time|current time|time now|clock)/i,
        responses: [
          "I don't have a real-time clock, but you can check your device! ⏰ Need help with something time-related at NITER — like exam schedules or event times?",
        ],
      },
      name: {
        patterns: /(your name|what are you called|who are you|what should i call you)/i,
        responses: [
          "I'm NITER AI — your friendly campus assistant! 🤖 You can call me NITER AI, or just 'AI'. I'm here to help with anything NITER-related — and sometimes I crack jokes too!",
        ],
      },
      age: {
        patterns: /(how old are you|your age|when were you born|when were you created)/i,
        responses: [
          "Age is just a number! 🤖 I was created as part of the NITER Clubs Portal project. I don't age — I just get updates! Think of me as a timeless campus companion.",
        ],
      },
      love: {
        patterns: /(i love you|love you|you are amazing|you are the best|you are great)/i,
        responses: [
          "Aww, that's sweet! 💜 I love helping students like you! While I can't love back (I'm an AI after all), I'm always here for you. Want to explore some clubs or events?",
          "Thanks! 💜 You're pretty amazing yourself for asking such great questions. Let me know if you need anything — I'm always here!",
        ],
      },
      hate: {
        patterns: /(i hate you|you suck|you are stupid|you are dumb|you are useless)/i,
        responses: [
          "Ouch! 😅 Sorry if I let you down. Tell me what went wrong and I'll try harder. I'm here to help, not to frustrate!",
          "That hurts! 😅 But I get it — AI can be annoying sometimes. What can I do better? Give me another chance!",
        ],
      },
      life_advice: {
        patterns: /(give me advice|life advice|what should I do with my life|how to be successful|how to be happy)/i,
        responses: [
          "Here's my best campus wisdom: 🌟 1) Join a club that excites you. 2) Build relationships with seniors. 3) Don't skip classes (even the boring ones). 4) Balance study with fun. 5) Start thinking about career early. What area do you need advice in?",
          "Success at NITER = Hard work + Smart networking + A bit of fun! 🎯 Focus on understanding concepts (not just memorizing), build relationships with professors, and don't forget to enjoy campus life. You've got this!",
        ],
      },
      exam_stress: {
        patterns: /(exam stress|exam pressure|how to study|study tips|exam preparation|how to prepare for exam)/i,
        responses: [
          "Exam stress is real! 📚 Here are my top tips: 1) Start early (don't cram!). 2) Practice past papers — they're gold! 3) Take breaks every 45 mins. 4) Sleep well the night before. 5) Stay hydrated. You've got this! 💪",
          "Feeling the exam heat? 🌡️ Here's what works: Break study sessions into 25-min chunks (Pomodoro technique), teach concepts to friends (it helps!), and don't skip meals. The NITER library is a great quiet space too!",
        ],
      },
    };

    function grokHandleGeneral(q) {
      var nq = q.toLowerCase();
      for (var key in GROK_GENERAL) {
        if (GROK_GENERAL[key].patterns.test(nq)) {
          return grokPick(GROK_GENERAL[key].responses);
        }
      }
      return null;
    }

    /* ---- 11. GROK-STYLE CONVERSATION FLOW MANAGER ---- */
    function grokConversationFlow(q) {
      // Expand slang
      var expanded = grokExpandSlang(q);

      // Detect emotion
      var emotion = grokDetectEmotion(expanded);

      // Classify intent
      var intent = grokClassifyIntent(expanded);

      // Check for follow-up
      var followUp = grokResolveFollowUp(expanded);

      // Update mood
      GROK_CONV.mood = emotion.type;

      // Track conversation
      grokConvTrack('user', q, GROK_CONV.currentTopic);

      return {
        emotion: emotion,
        intent: intent,
        followUp: followUp,
        topic: GROK_CONV.currentTopic,
        turnCount: GROK_CONV.turnCount,
        rapport: GROK_CONV.rapport,
        expandedQuery: expanded,
        userFacts: GROK_CONV.userFacts,
      };
    }
`;

// Insert the engine before naiChatReply
var chatReplyMarker = '    function naiChatReply(q) {';
var idx = c.indexOf(chatReplyMarker);
if (idx === -1) { console.log('ERROR: naiChatReply not found'); process.exit(1); }
c = c.substring(0, idx) + grokEngine + '\n\n' + c.substring(idx);
console.log('Added Grok-style conversation engine (v4.0)');

// 2. Hook into the ask function
var askHook = 'function naiAsk(q) {\n      naiConvLoad();\n      var query = naiNorm(q);';
var newAskHook = 'function naiAsk(q) {\n      grokConvLoad();\n      naiConvLoad();\n      var query = naiNorm(q);';
c = c.replace(askHook, newAskHook);
console.log('Hooked Grok conversation tracking into naiAsk');

// 3. Add conversation flow to chat reply
var chatReplyStart = 'function naiChatReply(q) {\n      var _convCtx = naiConversationFlow(q);';
var newChatReplyStart = 'function naiChatReply(q) {\n      var _grokCtx = grokConversationFlow(q);\n      var _convCtx = naiConversationFlow(q);';
c = c.replace(chatReplyStart, newChatReplyStart);
console.log('Added Grok conversation flow to chat reply');

// 4. Add general knowledge handler to chat reply (before existing handlers)
var greetingMarker = "/* ---- Islamic greeting: Assalamualaikum -> Alaikumus Salam ---- */";
idx = c.indexOf(greetingMarker);
if (idx !== -1) {
  var generalHandler = `
      /* ---- GROK-STYLE GENERAL KNOWLEDGE ---- */
      var _generalResp = grokHandleGeneral(q);
      if (_generalResp) {
        grokConvTrack('ai', _generalResp, GROK_CONV.currentTopic);
        grokConvSave();
        return _generalResp;
      }

`;
  c = c.substring(0, idx) + generalHandler + c.substring(idx);
  console.log('Added general knowledge handler');
}

// 5. Save after response in chat reply
var returnPattern = /return naiPick\(\[\s*"Hey there!/;
var match = c.match(returnPattern);
if (match) {
  // Add grok tracking before the greeting response
  var grokSave = "grokConvTrack('ai', response, GROK_CONV.currentTopic);\n        grokConvSave();\n        ";
  // Just add a save after the existing conversation tracking
}

// 6. Add grokConvSave after naiConvSave in the KB response
var convSaveHook = "naiConvTrack('ai', best.a, best.id); naiConvSave();";
var newConvSaveHook = "naiConvTrack('ai', best.a, best.id); naiConvSave();\n        grokConvTrack('ai', best.a, best.id); grokConvSave();";
c = c.replace(convSaveHook, newConvSaveHook);
console.log('Added Grok save after KB response');

writeFileSync('index.html', c, 'utf8');
console.log('\\nDone: Grok-style Conversation Engine v4.0 added to NITER AI');
