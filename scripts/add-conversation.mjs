import { readFileSync, writeFileSync } from 'fs';

var c = readFileSync('index.html', 'utf8');

// 1. Add conversation context system
var contextCode = `
    /* ================================================================
       NITER AI — CONVERSATIONAL ENGINE v3.0
       Advanced messaging: context memory, personality, emotions,
       humor, topic management, and natural conversation flow.
       ================================================================ */

    /* ---- 1. CONVERSATION MEMORY & CONTEXT ---- */
    var NAI_CONV = {
      history: [],           // last 20 messages [{role, text, topic, time}]
      topics: [],            // topics discussed [{topic, count, lastTime}]
      userPrefs: {},         // learned preferences {detailLevel, favTopics, etc}
      currentTopic: null,    // what we're talking about now
      turnCount: 0,          // conversation turns
      lastQuestion: null,    // user's last question
      lastAnswer: null,      // AI's last answer
      mood: 'neutral',       // detected user mood
      rapport: 0,            // rapport score 0-100
    };

    function naiConvTrack(role, text, topic) {
      NAI_CONV.history.push({ role: role, text: text, topic: topic || NAI_CONV.currentTopic, time: Date.now() });
      if (NAI_CONV.history.length > 20) NAI_CONV.history.shift();
      NAI_CONV.turnCount++;
      if (role === 'user') {
        NAI_CONV.lastQuestion = text;
        // Track topic
        if (topic) {
          NAI_CONV.currentTopic = topic;
          var existing = NAI_CONV.topics.find(function(t) { return t.topic === topic; });
          if (existing) { existing.count++; existing.lastTime = Date.now(); }
          else { NAI_CONV.topics.push({ topic: topic, count: 1, lastTime: Date.now() }); }
        }
        // Build rapport
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
      // Get the most discussed recent topic
      var recent = NAI_CONV.topics.filter(function(t) { return Date.now() - t.lastTime < 300000; }).sort(function(a,b) { return b.count - a.count; });
      return recent.length ? recent[0].topic : null;
    }

    /* ---- 2. EMOTIONAL INTELLIGENCE ---- */
    var NAI_EMOTIONS = {
      happy: { words: ['great','awesome','love','amazing','perfect','excellent','best','cool','nice','wonderful','fantastic','brilliant','thanks','thank you','helpful'], prefix: '😊 ', tone: 'warm' },
      sad: { words: ['sad','unhappy','depressed','lonely','miss','cry','tears','heartbroken','upset','down','blue','gloomy','miserable'], prefix: '💙 ', tone: 'gentle' },
      angry: { words: ['angry','furious','hate','stupid','terrible','awful','worst','horrible','annoying','frustrated','mad','rage','bullshit'], prefix: '😤 ', tone: 'calm' },
      anxious: { words: ['worried','nervous','scared','afraid','panic','anxious','stressed','overwhelmed','terrified','fear'], prefix: '🤗 ', tone: 'reassuring' },
      excited: { words: ['excited','cant wait','eager','thrilled','pumped','stoked','cant believe','wow','omg','yay'], prefix: '🎉 ', tone: 'enthusiastic' },
      confused: { words: ['confused','lost','unclear','dont understand','what do you mean','confusing','complicated','uncertain'], prefix: '🤔 ', tone: 'patient' },
      grateful: { words: ['thanks','thank you','appreciate','grateful','helpful','awesome','blessed','alhamdulillah'], prefix: '🙏 ', tone: 'warm' },
      curious: { words: ['wondering','curious','tell me','explain','how does','what is','why is','can you','is it true'], prefix: '💡 ', tone: 'engaged' },
      bored: { words: ['bored','boring','nothing','whatever','meh','same old','tired of'], prefix: '😊 ', tone: 'energetic' },
      urgent: { words: ['urgent','asap','emergency','immediately','right now','critical','help me','need help','desperate'], prefix: '⚡ ', tone: 'focused' },
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
      humorStyle: 'light', // light, punny, campus-themed
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
      admission: ['fees', 'departments', 'location', 'hostels', 'scholarship'],
      fees: ['admission', 'scholarship', 'installment'],
      departments: ['admission', 'career', 'labs', 'syllabus'],
      hostels: ['location', 'food', 'security'],
      clubs: ['events', 'join-club', 'leaderboard'],
      events: ['clubs', 'rsvp', 'certificate'],
      exams: ['mark-distribution', 'exam-office', 'exam-quality'],
      career: ['departments', 'clubs', 'opportunities'],
      ragging: ['security', 'proctor', 'emergency'],
      healthcare: ['emergency', 'security'],
      location: ['transport', 'hostels'],
      transport: ['location', 'bus'],
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
      // Filter out recently discussed topics
      var recent = NAI_CONV.topics.map(function(t) { return t.topic; });
      return related.filter(function(t) { return recent.indexOf(t) === -1; }).slice(0, 3);
    }

    /* ---- 6. FOLLOW-UP DETECTION ---- */
    function naiIsFollowUp(q) {
      var followUpPatterns = /^(and|also|what about|how about|tell me more|more|continue|elaborate|explain|detail|further|next|then|but|however|actually|really|so|ok|okay|got it|i see|right|sure|yes|no|yep|nope|yeah|nah|hmm|hm|oh|ah|wow|ugh|cool|nice|great|thanks|thank you)$/i;
      return followUpPatterns.test(q.trim()) || q.length < 5;
    }

    function naiResolveFollowUp(q) {
      if (!naiIsFollowUp(q)) return null;
      // Try to find context from recent conversation
      if (NAI_CONV.lastQuestion) {
        // If user says "more" or "continue", expand on last answer
        if (/^(more|continue|elaborate|detail|further|explain|tell me more)$/i.test(q.trim())) {
          return { type: 'expand', topic: NAI_CONV.currentTopic };
        }
        // If user says "and" or "also", they want related info
        if (/^(and|also|what about|how about)$/i.test(q.trim())) {
          var suggestions = naiTopicSuggestions(NAI_CONV.currentTopic);
          if (suggestions.length) {
            return { type: 'related', topics: suggestions };
          }
        }
      }
      return null;
    }

    /* ---- 7. NATURAL LANGUAGE UNDERSTANDING ---- */
    var NAI_INTENT_PATTERNS = [
      { intent: 'greeting', patterns: /^(hi|hello|hey|yo|sup|salam|assalam|aoa|good\s*(morning|afternoon|evening)|ki\s*obostha|kemon\s*achen|নমস্কার|হ্যালো)/i, confidence: 0.95 },
      { intent: 'farewell', patterns: /^(bye|goodbye|see\s*(you|ya)|later|ta\s*ta|alvida|good\s*night|শুভরাত্রি)/i, confidence: 0.95 },
      { intent: 'thanks', patterns: /^(thank|thanks|thx|dhonnobad|shukriya|appreciate|জয়)/i, confidence: 0.95 },
      { intent: 'help', patterns: /(what can you|how can you|help me|assist|support|guide)/i, confidence: 0.9 },
      { intent: 'identity', patterns: /(who are you|your name|introduce|what are you|tumi ke|apni ke)/i, confidence: 0.95 },
      { intent: 'joke', patterns: /(joke|funny|make me laugh|humor|entertain|something funny)/i, confidence: 0.95 },
      { intent: 'motivation', patterns: /(motivat|encourag|inspire|uplift|cheer up|feeling down|stressed|anxious|worried|sad|depressed)/i, confidence: 0.9 },
      { intent: 'curiosity', patterns: /(wondering|curious|tell me about|explain|what is|how does|why is|can you tell)/i, confidence: 0.85 },
      { intent: 'opinion', patterns: /(what do you think|your opinion|do you like|favorite|best|worst|prefer)/i, confidence: 0.85 },
      { intent: 'comparison', patterns: /(difference|compare|vs|versus|which is better|which should)/i, confidence: 0.85 },
      { intent: 'recommendation', patterns: /(recommend|suggest|advice|should I|what should|best option)/i, confidence: 0.85 },
      { intent: 'complaint', patterns: /(problem|issue|bug|error|not working|broken|wrong|terrible|awful|hate)/i, confidence: 0.9 },
      { intent: 'compliment', patterns: /(great|awesome|amazing|perfect|excellent|best|love|wonderful|fantastic|brilliant)/i, confidence: 0.9 },
      { intent: 'question', patterns: /^(what|where|when|who|how|why|which|is|are|can|do|does|will|should|could|would)/i, confidence: 0.8 },
      { intent: 'statement', patterns: /^.+/i, confidence: 0.5 },
    ];

    function naiClassifyIntentAdvanced(q) {
      for (var i = 0; i < NAI_INTENT_PATTERNS.length; i++) {
        if (NAI_INTENT_PATTERNS[i].patterns.test(q)) {
          return { intent: NAI_INTENT_PATTERNS[i].intent, confidence: NAI_INTENT_PATTERNS[i].confidence };
        }
      }
      return { intent: 'statement', confidence: 0.5 };
    }

    /* ---- 8. CONVERSATION FLOW MANAGER ---- */
    function naiConversationFlow(q) {
      var emotion = naiDetectEmotion(q);
      var intent = naiClassifyIntentAdvanced(q);
      var followUp = naiResolveFollowUp(q);

      // Update mood
      NAI_CONV.mood = emotion.type;

      // Track the conversation
      naiConvTrack('user', q, NAI_CONV.currentTopic);

      return {
        emotion: emotion,
        intent: intent,
        followUp: followUp,
        topic: NAI_CONV.currentTopic,
        turnCount: NAI_CONV.turnCount,
        rapport: NAI_CONV.rapport,
      };
    }

    /* ---- 9. SMART RESPONSE ENHANCER ---- */
    function naiEnhanceResponse(text, context) {
      if (!text) return text;

      // Add emotion-appropriate prefix
      var prefix = '';
      if (context && context.emotion && context.emotion.type !== 'neutral') {
        prefix = context.emotion.prefix;
      }

      // Add personality phrase occasionally (every 5th turn)
      var personalityPhrase = '';
      if (NAI_CONV.turnCount % 5 === 0 && NAI_CONV.turnCount > 0) {
        personalityPhrase = ' ' + naiPersonaPhrase();
      }

      // Add topic transition suggestions
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

    /* ---- 10. CONVERSATION ANALYTICS ---- */
    function naiConvAnalytics() {
      var totalTurns = NAI_CONV.turnCount;
      var totalTopics = NAI_CONV.topics.length;
      var topTopic = NAI_CONV.topics.sort(function(a,b) { return b.count - a.count; })[0];
      var avgRapport = NAI_CONV.rapport;
      var mood = NAI_CONV.mood;

      return {
        turns: totalTurns,
        topics: totalTopics,
        topTopic: topTopic ? topTopic.topic : 'none',
        rapport: avgRapport,
        mood: mood,
        history: NAI_CONV.history.length,
      };
    }
`;

// Insert the conversation engine before the naiChatReply function
var chatReplyMarker = '    function naiChatReply(q) {';
var idx = c.indexOf(chatReplyMarker);
if (idx === -1) { console.log('ERROR: naiChatReply not found'); process.exit(1); }
c = c.substring(0, idx) + contextCode + '\n\n' + c.substring(idx);
console.log('Added conversation engine (v3.0)');

// 2. Add new chat reply handlers for conversation features
var newChatReplies = `
      /* ---- ADVANCED CONVERSATION REPLIES ---- */

      // Emotional support responses
      if (/sad|unhappy|depressed|lonely|miss|cry|heartbroken|upset|down|blue|gloomy|miserable/i.test(q)) {
        return naiPick([
          "I'm sorry you're feeling down. 💙 Remember, every tough day at NITER is temporary — the friendships, the growth, and the achievements ahead are worth it. Want to talk about it, or shall I distract you with something fun?",
          "Hey, it's okay to feel this way. 💙 Campus life can be overwhelming sometimes. Take a deep breath — maybe a walk around the campus green or a cup of tea from the canteen? I'm here if you need anything.",
          "I hear you. 💙 Feeling down is part of being human. Here's something: every NITER graduate went through tough times too, and they made it through. You will too. Want me to tell you a fun fact or help with something specific?",
        ]);
      }

      if (/angry|furious|hate|stupid|terrible|awful|worst|horrible|annoying|frustrated|mad|rage/i.test(q)) {
        return naiPick([
          "I can sense you're frustrated. 😤 Let's take a step back — tell me what happened and I'll try to help sort it out. Whether it's about NITER, a club, exams, or anything else, I'm here to listen.",
          "Take a deep breath. 😤 I'm sorry something's gotten to you. Sometimes just talking about it helps. What's going on? I'm all ears — no judgment, just help.",
          "I get it — frustration is real. 😤 But remember, you're at NITER for a reason: you're smart, capable, and resilient. Let's figure this out together. What's the issue?",
        ]);
      }

      if (/worried|nervous|scared|afraid|panic|anxious|stressed|overwhelmed|terrified|fear/i.test(q)) {
        return naiPick([
          "It's completely normal to feel anxious — exams, deadlines, the future... it's a lot. 🤗 But here's the truth: you've handled hard things before, and you'll handle this too. What's worrying you? Let's break it down together.",
          "Take a deep breath. 🤗 Anxiety usually means you care — and that's a good thing. Let's tackle whatever's stressing you out, one step at a time. What's the main concern?",
          "I understand that feeling. 🤗 NITER can be intense, but remember: every student here faces the same challenges. You're not alone. Let's find a solution — what specifically is causing the stress?",
        ]);
      }

      if (/excited|cant wait|eager|thrilled|pumped|stoked|cant believe|wow|omg|yay/i.test(q)) {
        return naiPick([
          "Love the energy! 🎉 What's got you so excited? Is it an upcoming event, a club activity, or something about NITER? Share the enthusiasm — I'm pumped too!",
          "That's the spirit! 🎉 Excitement is contagious — tell me more! What's happening? I want to celebrate with you!",
          "Woohoo! 🎉 Your excitement is awesome! What's making your day? An event? Good news? Let's keep the positive vibes going!",
        ]);
      }

      if (/confused|lost|unclear|dont understand|what do you mean|confusing|complicated|uncertain/i.test(q)) {
        return naiPick([
          "No worries — let me clarify! 🤔 Can you tell me specifically what's confusing? I'll break it down into simpler parts. Everyone learns at their own pace, and there's no rush.",
          "I get it — some things can be overwhelming at first. 🤔 Let me explain it differently. What part is unclear? I'll go step by step.",
          "Confusion is just learning in progress! 🤔 Tell me what's not clicking, and I'll explain it in a way that makes sense. We'll get there together.",
        ]);
      }

      if (/bored|boring|nothing|whatever|meh|same old|tired of/i.test(q)) {
        return naiPick([
          "Boredom is a sign you need a new challenge! 🎉 Try the 'Which club fits me?' quiz, check the Code Vault for a new language, or browse open opportunities. There's a whole portal of stuff — what sounds fun?",
          "Let's fix that! 😊 How about I tell you a fun fact about NITER, or we play a quick game? Or you could check out the upcoming events — there's always something happening!",
          "Never bored at NITER! 🎉 Try asking me for a joke, a fun fact, or browse the clubs. There's always something new to discover!",
        ]);
      }

      if (/urgent|asap|emergency|immediately|right now|critical|help me|need help|desperate/i.test(q)) {
        return "⚡ I understand this is urgent. Let me help right away. For immediate campus emergencies, call 999 (national emergency) or contact NITER security. For academic emergencies, reach the registrar office at +880 1755 060 275. Tell me what you need — I'll prioritize this!";
      }

      // Conversation memory responses
      if (/what (?:did|were|was) we (?:talking|discussing) about|what was the (?:last|previous) topic|remind me|context/i.test(q)) {
        var topic = naiConvTopic();
        if (topic) {
          return "We were talking about " + topic + ". Would you like to continue that discussion, or switch to something new?";
        }
        return "This is our first topic! We haven't discussed anything yet. What would you like to know about?";
      }

      // Personality questions
      if (/are you (?:a )?(?:real|human|bot|robot|ai)|do you have (?:feelings|emotions|a soul|a life)/i.test(q)) {
        return "I'm an AI — a clever pattern-matcher running right in your browser, fully offline. I don't have feelings (sorry!), but I do my best to be helpful. And I never get tired of the same question twice. 😄";
      }

      // What can you do
      if (/what can you (?:do|help with)|how can you (?:help|assist)|your (?:features|capabilities|abilities)/i.test(q)) {
        return "Here's what I can do: 📚 answer questions about NITER (history, departments, syllabus, fees, clubs, the RMG industry) · 📅 live updates on events, forms and opportunities · ⚙️ take actions — RSVP to events, follow clubs, set reminders · 💬 have conversations about anything campus-related · 🎓 academic help — study tips, exam strategy, citations · 😄 tell jokes and fun facts when you need a break! Plus I speak Bangla! Try saying 'Assalamualaikum' — I'll reply with 'Wa Alaikumus Salam'! 🙏";
      }

      // Favorite/best/worst
      if (/what (?:is|are) your (?:favorite|favourite|best|worst)|do you like/i.test(q)) {
        return naiPick([
          "I love helping students discover their perfect club — it's like matchmaking but for campus life! 🎯 I'm also a big fan of the CodeStorm contest and the Cultural Club performances.",
          "My favorite thing is when a student asks a question I can actually help with — it makes my circuits happy! ⚡ I'm also fond of the Robotics Club's line-follower competitions.",
          "I'm partial to the Career Club's CV clinics — helping students land their dream jobs is pretty rewarding for an AI! 📄 But honestly, I love all 11 clubs equally.",
        ]);
      }

      // Comparison questions
      if (/difference between|compare|versus|vs|which is (?:better|best|worse)/i.test(q)) {
        return "That's a great comparison question! To give you the best answer, could you be more specific about what you'd like to compare? For example: departments, clubs, study approaches, career paths, or something else?";
      }

      // Recommendation requests
      if (/recommend|suggest|advice|should I|what should|best option|best choice/i.test(q)) {
        return naiPick([
          "I'd love to help you decide! Could you tell me more about what you're looking for? Are you choosing between clubs, departments, courses, or something else? The more details, the better my recommendation!",
          "Great question! To give you the best advice, I need a bit more context. What area are you looking for recommendations in? Campus life, academics, career, or something specific?",
        ]);
      }
`;

// Insert the new chat replies before the existing general chat replies
var generalChatMarker = "      if (/who\\s+are\\s+you|what\\s+(are|r)\\s+you\\b|your\\s+name|whats\\s*your\\s*name|tumi\\s*ke|apni\\s*ke|introduce\\s+yourself/.test(q)) {";
idx = c.indexOf(generalChatMarker);
if (idx === -1) { console.log('ERROR: identity question not found'); process.exit(1); }
c = c.substring(0, idx) + newChatReplies + '\n\n' + c.substring(idx);
console.log('Added advanced conversation replies');

// 3. Hook into the main ask function to use conversation tracking
var askHook = 'function naiAsk(q) {\n      var query = naiNorm(q);';
var newAskHook = 'function naiAsk(q) {\n      naiConvLoad();\n      var query = naiNorm(q);';
c = c.replace(askHook, newAskHook);
console.log('Hooked conversation tracking into naiAsk');

// 4. Add conversation save after response
var saveHook = "return { text: best.a, chips: chips.slice(0, 4), link: best.link };";
var newSaveHook = "naiConvTrack('ai', best.a, best.id); naiConvSave();\n        return { text: best.a, chips: chips.slice(0, 4), link: best.link };";
c = c.replace(saveHook, newSaveHook);
console.log('Added conversation save after KB response');

// 5. Update the chat reply function to use conversation flow
var chatReplyStart = 'function naiChatReply(q) {\n      /* ---- Islamic greeting';
var newChatReplyStart = 'function naiChatReply(q) {\n      var _convCtx = naiConversationFlow(q);\n      /* ---- Islamic greeting';
c = c.replace(chatReplyStart, newChatReplyStart);
console.log('Added conversation flow to chat reply');

// 6. Add conversation analytics to the brain panel
var brainAnalyticsMarker = "analytics: naiAnalyticsLoad()";
var newBrainAnalytics = "analytics: naiAnalyticsLoad(),\n        conv: naiConvAnalytics()";
c = c.replace(brainAnalyticsMarker, newBrainAnalytics);
console.log('Added conversation analytics to brain panel');

// 7. Add a "conversation" command
var existingCommand = "if (/^(?:status|stats|brain|panel|status report)$/i.test(query)) {";
var newCommand = "if (/^(?:conversation|chat stats|conv stats|how many (?:messages|turns))$/i.test(q.trim())) {\n        var ca = naiConvAnalytics();\n        return { text: 'Conversation Stats:\\n- Turns: ' + ca.turns + '\\n- Topics discussed: ' + ca.topics + '\\n- Most discussed: ' + ca.topTopic + '\\n- Rapport level: ' + ca.rapport + '/100\\n- Current mood: ' + ca.mood + '\\n\\nI remember our last ' + ca.history + ' messages and track ' + ca.topics + ' topics we\\'ve covered.', chips: ['Show analytics', 'What have you learned?'], link: null };\n      }\n      if (/^(?:status|stats|brain|panel|status report)$/i.test(query)) {";
c = c.replace(existingCommand, newCommand);
console.log('Added conversation stats command');

writeFileSync('index.html', c, 'utf8');
console.log('\\nDone: Conversational Engine v3.0 added to NITER AI');
