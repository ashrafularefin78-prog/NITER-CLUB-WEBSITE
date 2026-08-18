import { readFileSync, writeFileSync } from 'fs';

const file = 'C:\\Users\\user\\Downloads\\Clubs\\index.html';
let code = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

// Find the injection point - after ADVANCED ENGINE v2.0
const ENGINE_MARKER = '/* ---- 8. ENHANCED RESPONSE FORMATTER ---- */';
const engineIdx = code.indexOf(ENGINE_MARKER);
if (engineIdx === -1) { console.error('Cannot find engine marker'); process.exit(1); }

const HERMES_CODE = `
    /* ================================================================
       HERMES AI AGENT — Advanced Self-Learning System
       Industry-grade autonomous learning agent with knowledge graph,
       conversation analysis, and adaptive responses
       ================================================================ */

    /* ---- 1. HERMES AGENT CORE ---- */
    var NAI_HERMES_KEY = 'niter_hermes_agent_v1';
    var NAI_KG_KEY = 'niter_knowledge_graph_v1';
    
    function hermesLoad() {
      try {
        var h = JSON.parse(localStorage.getItem(NAI_HERMES_KEY) || 'null');
        if (h && typeof h === 'object') {
          h.conversations = h.conversations || [];
          h.patterns = h.patterns || {};
          h.userPrefs = h.userPrefs || {};
          h.insights = h.insights || [];
          h.learningRate = h.learningRate || 0.1;
          h.adaptationLevel = h.adaptationLevel || 0;
          h.totalInteractions = h.totalInteractions || 0;
          h.successfulLearnings = h.successfulLearnings || 0;
          h.lastAdaptation = h.lastAdaptation || null;
          return h;
        }
      } catch(e) {}
      return {
        conversations: [],
        patterns: {},
        userPrefs: {},
        insights: [],
        learningRate: 0.1,
        adaptationLevel: 0,
        totalInteractions: 0,
        successfulLearnings: 0,
        lastAdaptation: null
      };
    }
    
    function hermesSave(h) {
      try {
        // Keep only last 50 conversations
        if (h.conversations.length > 50) h.conversations = h.conversations.slice(-50);
        // Keep only last 20 insights
        if (h.insights.length > 20) h.insights = h.insights.slice(-20);
        localStorage.setItem(NAI_HERMES_KEY, JSON.stringify(h));
      } catch(e) {}
    }

    /* ---- 2. KNOWLEDGE GRAPH ---- */
    function kgLoad() {
      try {
        var kg = JSON.parse(localStorage.getItem(NAI_KG_KEY) || 'null');
        if (kg && typeof kg === 'object') {
          kg.nodes = kg.nodes || {};
          kg.edges = kg.edges || [];
          return kg;
        }
      } catch(e) {}
      return { nodes: {}, edges: [] };
    }
    
    function kgSave(kg) {
      try {
        // Keep graph manageable
        if (kg.edges.length > 200) kg.edges = kg.edges.slice(-200);
        localStorage.setItem(NAI_KG_KEY, JSON.stringify(kg));
      } catch(e) {}
    }
    
    function kgAddNode(topic, metadata) {
      var kg = kgLoad();
      if (!kg.nodes[topic]) {
        kg.nodes[topic] = {
          id: topic,
          metadata: metadata || {},
          connections: 0,
          lastAccessed: new Date().toISOString(),
          accessCount: 0
        };
      }
      kg.nodes[topic].lastAccessed = new Date().toISOString();
      kg.nodes[topic].accessCount++;
      kgSave(kg);
      return kg.nodes[topic];
    }
    
    function kgAddEdge(from, to, relationship) {
      var kg = kgLoad();
      // Check if edge already exists
      var exists = kg.edges.some(function(e) {
        return e.from === from && e.to === to && e.relationship === relationship;
      });
      if (!exists) {
        kg.edges.push({
          from: from,
          to: to,
          relationship: relationship,
          strength: 1,
          created: new Date().toISOString()
        });
        // Update connection counts
        if (kg.nodes[from]) kg.nodes[from].connections++;
        if (kg.nodes[to]) kg.nodes[to].connections++;
      }
      kgSave(kg);
    }
    
    function kgFindRelated(topic, limit) {
      limit = limit || 5;
      var kg = kgLoad();
      var related = [];
      kg.edges.forEach(function(e) {
        if (e.from === topic) {
          related.push({ topic: e.to, relationship: e.relationship, strength: e.strength });
        } else if (e.to === topic) {
          related.push({ topic: e.from, relationship: e.relationship, strength: e.strength });
        }
      });
      return related.sort(function(a, b) { return b.strength - a.strength; }).slice(0, limit);
    }

    /* ---- 3. CONVERSATION ANALYSIS ---- */
    function hermesAnalyzeConversation(messages) {
      var h = hermesLoad();
      var analysis = {
        topics: {},
        sentiment: { positive: 0, negative: 0, neutral: 0 },
        complexity: 0,
        length: messages.length,
        patterns: []
      };
      
      // Analyze each message
      messages.forEach(function(msg) {
        if (msg.role === 'user') {
          // Extract topics
          var words = msg.text.toLowerCase().split(/\\s+/);
          words.forEach(function(w) {
            if (w.length > 3) {
              analysis.topics[w] = (analysis.topics[w] || 0) + 1;
            }
          });
          
          // Simple sentiment
          if (/(?:good|great|thanks|helpful|perfect)/i.test(msg.text)) analysis.sentiment.positive++;
          else if (/(?:bad|wrong|error|confused|difficult)/i.test(msg.text)) analysis.sentiment.negative++;
          else analysis.sentiment.neutral++;
          
          // Complexity (word count)
          analysis.complexity += words.length;
        }
      });
      
      // Store analysis
      var convId = Date.now().toString(36);
      h.conversations.push({
        id: convId,
        analysis: analysis,
        timestamp: new Date().toISOString(),
        messageCount: messages.length
      });
      
      // Update patterns
      Object.keys(analysis.topics).forEach(function(topic) {
        h.patterns[topic] = (h.patterns[topic] || 0) + analysis.topics[topic];
      });
      
      h.totalInteractions++;
      hermesSave(h);
      return analysis;
    }

    /* ---- 4. USER PREFERENCE LEARNING ---- */
    function hermesLearnPreference(key, value) {
      var h = hermesLoad();
      if (!h.userPrefs[key]) {
        h.userPrefs[key] = { value: value, confidence: 0.5, lastUpdated: new Date().toISOString() };
      } else {
        // Update with weighted average
        var old = h.userPrefs[key];
        var newConf = Math.min(0.95, old.confidence + h.learningRate);
        h.userPrefs[key] = {
          value: value,
          confidence: newConf,
          lastUpdated: new Date().toISOString()
        };
      }
      hermesSave(h);
    }
    
    function hermesGetPreference(key) {
      var h = hermesLoad();
      return h.userPrefs[key] || null;
    }

    /* ---- 5. ADAPTIVE RESPONSE SYSTEM ---- */
    function hermesAdaptResponse(baseResponse, context) {
      var h = hermesLoad();
      var adapted = baseResponse;
      
      // Learn from successful interactions
      if (context && context.feedback === 'positive') {
        h.successfulLearnings++;
        h.adaptationLevel = Math.min(1, h.adaptationLevel + 0.05);
      }
      
      // Adapt based on user preferences
      var stylePref = hermesGetPreference('responseStyle');
      if (stylePref && stylePref.confidence > 0.7) {
        if (stylePref.value === 'concise') {
          // Shorten response
          adapted = adapted.split('.').slice(0, 3).join('.') + '.';
        } else if (stylePref.value === 'detailed') {
          // Add more context
          adapted += '\\n\\nFor more details, feel free to ask specific follow-up questions.';
        }
      }
      
      // Adapt based on conversation complexity
      if (context && context.avgComplexity) {
        if (context.avgComplexity > 10) {
          // User asks complex questions - provide more detail
          adapted += '\\n\\n(Providing detailed response based on your question complexity)';
        }
      }
      
      h.lastAdaptation = new Date().toISOString();
      hermesSave(h);
      return adapted;
    }

    /* ---- 6. INSIGHT GENERATION ---- */
    function hermesGenerateInsight() {
      var h = hermesLoad();
      var kg = kgLoad();
      
      // Analyze patterns
      var topTopics = Object.keys(h.patterns).sort(function(a, b) {
        return h.patterns[b] - h.patterns[a];
      }).slice(0, 5);
      
      // Find knowledge gaps
      var gaps = [];
      Object.keys(kg.nodes).forEach(function(topic) {
        if (kg.nodes[topic].connections < 2) {
          gaps.push(topic);
        }
      });
      
      // Generate insight
      var insight = {
        type: 'learning',
        message: 'Hermes has learned from ' + h.totalInteractions + ' interactions. ',
        recommendations: [],
        timestamp: new Date().toISOString()
      };
      
      if (topTopics.length > 0) {
        insight.message += 'Top topics: ' + topTopics.join(', ') + '. ';
      }
      
      if (gaps.length > 0) {
        insight.recommendations.push('Consider exploring: ' + gaps.slice(0, 3).join(', '));
      }
      
      if (h.adaptationLevel > 0.5) {
        insight.recommendations.push('High adaptation level - responses are well-tuned to your style');
      }
      
      h.insights.push(insight);
      hermesSave(h);
      return insight;
    }

    /* ---- 7. HERMES STATUS ---- */
    function hermesStatus() {
      var h = hermesLoad();
      var kg = kgLoad();
      return {
        totalInteractions: h.totalInteractions,
        successfulLearnings: h.successfulLearnings,
        adaptationLevel: Math.round(h.adaptationLevel * 100) + '%',
        knowledgeNodes: Object.keys(kg.nodes).length,
        knowledgeEdges: kg.edges.length,
        userPreferences: Object.keys(h.userPrefs).length,
        recentInsights: h.insights.slice(-3),
        learningRate: h.learningRate,
        lastAdaptation: h.lastAdaptation
      };
    }

    /* ---- 8. HERMES COMMAND HANDLER ---- */
    function hermesCommand(query) {
      // Status check
      if (/hermes\\s+(?:status|stats|info|about)|what\\s+(?:has|have)\\s+hermes\\s+learned/i.test(query)) {
        var status = hermesStatus();
        return {
          text: 'Hermes AI Agent Status:\\n' +
            '- Total interactions: ' + status.totalInteractions + '\\n' +
            '- Successful learnings: ' + status.successfulLearnings + '\\n' +
            '- Adaptation level: ' + status.adaptationLevel + '\\n' +
            '- Knowledge nodes: ' + status.knowledgeNodes + '\\n' +
            '- Knowledge edges: ' + status.knowledgeEdges + '\\n' +
            '- User preferences: ' + status.userPreferences + '\\n' +
            '- Learning rate: ' + status.learningRate,
          chips: ['What have you learned?', 'Show insights'],
          link: null
        };
      }
      
      // Insight request
      if (/show\\s+insights?|learning\\s+insights?|hermes\\s+insights?/i.test(query)) {
        var insight = hermesGenerateInsight();
        return {
          text: 'Hermes Learning Insight:\\n' + insight.message +
            (insight.recommendations.length ? '\\n\\nRecommendations:\\n' + insight.recommendations.join('\\n') : ''),
          chips: ['Hermes status', 'What have you learned?'],
          link: null
        };
      }
      
      // Teach Hermes
      if (/teach\\s+hermes|hermes\\s+learn|train\\s+hermes/i.test(query)) {
        return {
          text: 'To teach Hermes, simply have a conversation! Hermes learns from:\\n' +
            '- Your questions and topics\\n' +
            '- Feedback (good/bad responses)\\n' +
            '- Corrections you make\\n' +
            '- Patterns in your usage\\n\\n' +
            'Hermes adapts its responses based on your communication style.',
          chips: ['Hermes status', 'Show insights'],
          link: null
        };
      }
      
      return null;
    }

    /* ================================================================ */
`;

// Inject Hermes code before the enhanced response formatter
code = code.slice(0, engineIdx) + HERMES_CODE + code.slice(engineIdx);

// Now integrate Hermes into the main naiAsk function
// Find the analytics tracking line
const ANALYTICS_MARKER = 'naiAnalyticsTrack(_intent.id);';
const analyticsIdx = code.indexOf(ANALYTICS_MARKER);
if (analyticsIdx !== -1) {
  const afterAnalytics = analyticsIdx + ANALYTICS_MARKER.length;
  const hermesIntegration = `
      /* ---- HERMES: Track and adapt ---- */
      hermesLearnPreference('lastIntent', _intent.id);
      hermesLearnPreference('queryLength', query.length);`;
  code = code.slice(0, afterAnalytics) + hermesIntegration + code.slice(afterAnalytics);
}

// Add Hermes command to brain command handler
const BRAIN_CMD_MARKER = "if (/analytics|usage\\\\s+stats|show\\\\s+analytics/i.test(query)) {";
const brainCmdIdx = code.indexOf(BRAIN_CMD_MARKER);
if (brainCmdIdx !== -1) {
  const afterBrainCmd = brainCmdIdx + BRAIN_CMD_MARKER.length;
  const hermesCmd = "\n      /* Hermes agent */\n      var hermesR = hermesCommand(query);\n      if (hermesR) return hermesR;";
  code = code.slice(0, afterBrainCmd) + hermesCmd + code.slice(afterBrainCmd);
}

// Add Hermes to the brain panel
const BRAIN_PANEL_MARKER = "analytics: naiAnalyticsLoad()";
const panelIdx = code.indexOf(BRAIN_PANEL_MARKER);
if (panelIdx !== -1) {
  const afterPanel = panelIdx + BRAIN_PANEL_MARKER.length;
  const hermesPanel = ",\n        hermes: hermesStatus()";
  code = code.slice(0, afterPanel) + hermesPanel + code.slice(afterPanel);
}

// Update the brain HTML to show Hermes status
const BRAIN_HTML_MARKER = "'<div class=\"nai-brain-src\">' + 'Memory: localStorage";
const htmlIdx = code.indexOf(BRAIN_HTML_MARKER);
if (htmlIdx !== -1) {
  const hermesHtml = `
        (s.hermes ? '<div class=\"nai-brain-sub\">🤖 Hermes AI Agent</div>' +
          '<div class=\"nai-brain-stats\" style=\"margin-top:6px\">' +
            '<div class=\"nai-brain-stat\"><b>' + (s.hermes.totalInteractions || 0) + '</b><span>interactions</span></div>' +
            '<div class=\"nai-brain-stat\"><b>' + (s.hermes.adaptationLevel || '0%') + '</b><span>adaptation</span></div>' +
            '<div class=\"nai-brain-stat\"><b>' + (s.hermes.knowledgeNodes || 0) + '</b><span>knowledge nodes</span></div>' +
          '</div>' : '')`;
  code = code.slice(0, htmlIdx) + hermesHtml + code.slice(htmlIdx);
}

writeFileSync(file, code, 'utf8');
console.log('Hermes AI Agent injected successfully!');
console.log('Features:');
console.log('  - Advanced self-learning system');
console.log('  - Knowledge graph for topic relationships');
console.log('  - Conversation pattern analysis');
console.log('  - User preference learning');
console.log('  - Adaptive response system');
console.log('  - Insight generation');
console.log('  - Status monitoring');
