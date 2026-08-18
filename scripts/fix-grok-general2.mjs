import { readFileSync, writeFileSync } from 'fs';

var c = readFileSync('index.html', 'utf8');

// Fix 1: Add "meaning" and other general knowledge words to NAI_DOMAIN_WORDS
// so the spell corrector doesn't rewrite them
var oldDomain = 'var NAI_DOMAIN_WORDS = ("niter textile engineering research institute nayarhat savar dhaka admission admitted admitting enrolled enrollment scholarship scholarships tuition fee fees hostel hostels campus departments department semester credit gpa cgpa library laboratory certificates certificate passport leaderboard quiz robotics career science culture language journalism photography welfare society societies opportunity opportunities internship intern job jobs deadline register registration member membership reminder remind study plan exams exam routine timetable schedule clash conflict citation reference report cover docx word document rmg btma bangladesh upcoming syllabus curriculum events event clubs club forms form notices notice apply join month year next first second third professor teacher faculty student students workshop meetup calendar every all about what when where which who why how tell know need want open closes tomorrow today activity activities proctor exams exam-office exam-committee exam-quality exam-system grading marks sessional class-test attendance labs computer-lab wifi internet canteen food transport bus scholarship director governing-body leadership").split(" ");';

var newDomain = 'var NAI_DOMAIN_WORDS = ("niter textile engineering research institute nayarhat savar dhaka admission admitted admitting enrolled enrollment scholarship scholarships tuition fee fees hostel hostels campus departments department semester credit gpa cgpa library laboratory certificates certificate passport leaderboard quiz robotics career science culture language journalism photography welfare society societies opportunity opportunities internship intern job jobs deadline register registration member membership reminder remind study plan exams exam routine timetable schedule clash conflict citation reference report cover docx word document rmg btma bangladesh upcoming syllabus curriculum events event clubs club forms form notices notice apply join month year next first second third professor teacher faculty student students workshop meetup calendar every all about what when where which who why how tell know need want open closes tomorrow today activity activities proctor exams exam-office exam-committee exam-quality exam-system grading marks sessional class-test attendance labs computer-lab wifi internet canteen food transport bus scholarship director governing-body leadership meaning philosophy weather temperature rain hot cold humid forecast climate time clock your name love hate advice success happy stressful study tips exam preparation knowledge curious witty casual fun jokes entertainment mood feeling").split(" ");';

c = c.replace(oldDomain, newDomain);
console.log('Added general knowledge words to domain vocabulary');

// Fix 2: Update the general handler to check raw query before spell correction
var oldHandler = `      /* ---- GROK-STYLE GENERAL KNOWLEDGE: meaning of life, weather, time, etc. ---- */
      var _generalResp = grokHandleGeneral(query);
      if (_generalResp) {
        grokConvTrack('ai', _generalResp, GROK_CONV.currentTopic);
        grokConvSave();
        return { text: _generalResp, chips: ["Tell me a joke", "What can you do?", "How are you?"], link: null };
      }`;

var newHandler = `      /* ---- GROK-STYLE GENERAL KNOWLEDGE: meaning of life, weather, time, etc. ---- */
      var _generalResp = grokHandleGeneral(q) || grokHandleGeneral(query);
      if (_generalResp) {
        grokConvTrack('ai', _generalResp, GROK_CONV.currentTopic);
        grokConvSave();
        return { text: _generalResp, chips: ["Tell me a joke", "What can you do?", "How are you?"], link: null };
      }`;

c = c.replace(oldHandler, newHandler);
console.log('Updated general handler to check raw query first');

writeFileSync('index.html', c, 'utf8');
console.log('Done: General knowledge handler fixed');
