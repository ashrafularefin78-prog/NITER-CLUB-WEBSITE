import { readFileSync, writeFileSync } from 'fs';

var c = readFileSync('index.html', 'utf8');

// Remove the general knowledge handler from chatReply (where it was incorrectly placed)
var oldHandler = `
      /* ---- GROK-STYLE GENERAL KNOWLEDGE ---- */
      var _generalResp = grokHandleGeneral(q);
      if (_generalResp) {
        grokConvTrack('ai', _generalResp, GROK_CONV.currentTopic);
        grokConvSave();
        return _generalResp;
      }

`;
c = c.replace(oldHandler, '');
console.log('Removed general handler from chatReply');

// Add it BEFORE the math engine in naiAsk instead
var mathEngineMarker = "      /* ---- 🧮 math engine: equations, derivatives, integrals, stats,";
var idx = c.indexOf(mathEngineMarker);
if (idx === -1) { console.log('ERROR: math engine marker not found'); process.exit(1); }

var generalHandler = `      /* ---- GROK-STYLE GENERAL KNOWLEDGE: meaning of life, weather, time, etc. ---- */
      var _generalResp = grokHandleGeneral(query);
      if (_generalResp) {
        grokConvTrack('ai', _generalResp, GROK_CONV.currentTopic);
        grokConvSave();
        return { text: _generalResp, chips: ["Tell me a joke", "What can you do?", "How are you?"], link: null };
      }

`;
c = c.substring(0, idx) + generalHandler + c.substring(idx);
console.log('Added general handler before math engine in naiAsk');

writeFileSync('index.html', c, 'utf8');
console.log('Done: General knowledge handler moved to naiAsk (before math engine)');
