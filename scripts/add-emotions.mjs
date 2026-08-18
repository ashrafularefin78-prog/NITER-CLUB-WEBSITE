import { readFileSync, writeFileSync } from 'fs';

var c = readFileSync('index.html', 'utf8');

// Add emotional support responses before the identity question
var emotionReplies = `
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

      if (/excited|cant wait|eager|thrilled|pumped|stoked|wow|omg|yay/i.test(q)) {
        return naiPick([
          "Love the energy! 🎉 What's got you so excited? Is it an upcoming event, a club activity, or something about NITER? Share the enthusiasm — I'm pumped too!",
          "That's the spirit! 🎉 Excitement is contagious — tell me more! What's happening? I want to celebrate with you!",
          "Woohoo! 🎉 Your excitement is awesome! What's making your day? An event? Good news? Let's keep the positive vibes going!",
        ]);
      }

      if (/confused|lost|unclear|dont understand|confusing|complicated|uncertain/i.test(q)) {
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

      if (/urgent|asap|emergency|immediately|right now|critical|need help|desperate/i.test(q)) {
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

      // Recommendation requests
      if (/recommend|suggest|advice|should I|what should|best option|best choice/i.test(q)) {
        return naiPick([
          "I'd love to help you decide! Could you tell me more about what you're looking for? Are you choosing between clubs, departments, courses, or something else? The more details, the better my recommendation!",
          "Great question! To give you the best advice, I need a bit more context. What area are you looking for recommendations in? Campus life, academics, career, or something specific?",
        ]);
      }

      // Joke handler with multiple categories
      if (/joke|funny|make\\s+me\\s+laugh|something\\s+funny|humor|humour|entertain/i.test(q)) {
        if (/campus|niter|textile|college|university/i.test(q)) {
          return naiGetJoke('campus');
        }
        if (/pun|word|witty|clever/i.test(q)) {
          return naiGetJoke('puns');
        }
        return naiGetJoke('life');
      }

`;

var identityMarker = "if (/who\\s+are\\s+you|what\\s+(are|r)\\s+you\\b|your\\s+name|whats\\s*your\\s*name|tumi\\s*ke|apni\\s*ke|introduce\\s*yourself/.test(q)) {";
var idx = c.indexOf(identityMarker);
if (idx === -1) { console.log('ERROR: identity question not found'); process.exit(1); }
c = c.substring(0, idx) + emotionReplies + '\n' + c.substring(idx);
console.log('Added emotional support and conversation replies');

writeFileSync('index.html', c, 'utf8');
console.log('Done: Advanced conversation replies added');
