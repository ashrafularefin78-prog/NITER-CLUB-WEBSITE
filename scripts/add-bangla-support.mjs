import { readFileSync, writeFileSync } from 'fs';

var c = readFileSync('index.html', 'utf8');

// 1. Add Bangla translation map before naiReformulate
var banglaMapCode = `
    /* ---- Bangla (Bengali) Language Support ---- */
    var NAI_BANGLA_MAP = {
      // Common greetings
      'হ্যালো': 'hello', 'নমস্কার': 'hello', 'হাই': 'hello', 'কেমন আছেন': 'how are you',
      'ধন্যবাদ': 'thank you', 'শুভেচ্ছা': 'greetings',
      // NITER related
      'নাইটার': 'niter', 'নাইটারে': 'niter', 'নাইটারের': 'niter',
      'ভর্তি': 'admission', 'ভর্তি পরীক্ষা': 'admission test', 'ভর্তি কিভাবে': 'how to get admitted',
      'ভর্তি কারা': 'admission requirements', 'ভর্তির যোগ্যতা': 'eligibility',
      'কত খরচ': 'fees', 'কত টাকা': 'fees', 'ফি': 'fees', 'টিউশন ফি': 'tuition fees',
      'খরচ কত': 'fees cost', 'মোট খরচ': 'total cost',
      'বিভাগ': 'departments', 'কতটি বিভাগ': 'departments', 'বিভাগ সমূহ': 'departments',
      'টেক্সটাইল': 'textile engineering', 'কম্পিউটার': 'computer science',
      'ইলেকট্রিক্যাল': 'eee', 'ইন্ডাস্ট্রিয়াল': 'ipe', 'ফ্যাশন': 'fdae',
      // Campus
      'ক্যাম্পাস': 'campus', 'অবস্থান': 'location', 'কোথায়': 'where',
      'কিভাবে যাব': 'how to reach', 'বাস': 'bus', 'পরিবহন': 'transport',
      'লোকেশন': 'location', 'ঠিকানা': 'address',
      // Facilities
      'হোস্টেল': 'hostel', 'হোস্টেলের ফি': 'hostel fees', 'ছাত্রাবাস': 'hostel',
      'ক্যান্টিন': 'canteen', 'খাবার': 'food', 'কফি': 'cafe',
      'ল্যাব': 'labs', 'ল্যাবরেটরি': 'labs', 'কম্পিউটার ল্যাব': 'computer lab',
      'ওয়াইফাই': 'wifi', 'ইন্টারনেট': 'internet',
      'লাইব্রেরি': 'library', 'গ্রন্থাগার': 'library',
      // Academic
      'পরীক্ষা': 'exams', 'পরীক্ষা সিস্টেম': 'exam system', 'সেমেস্টার': 'semester',
      'গ্রেডিং': 'grading', 'সিজিপিএ': 'cgpa', 'মার্ক': 'marks',
      'ক্লাস টেস্ট': 'class test', 'অ্যাটেনডেন্স': 'attendance',
      'শিক্ষক': 'faculty', 'প্রফেসর': 'professor',
      'সিলেবাস': 'syllabus', 'কারিকুলাম': 'curriculum',
      'ভিভা': 'viva', 'প্র্যাক্টিক্যাল': 'practical',
      // Exam
      'পরীক্ষা কন্ট্রোলার': 'exam controller', 'পরীক্ষা কমিটি': 'exam committee',
      'প্রশ্ন পত্র': 'question paper', 'মার্ক বন্টন': 'mark distribution',
      'পাশের নম্বর': 'pass mark',
      // Safety
      'র‍্যাগিং': 'ragging', 'নিরাপত্তা': 'security', 'জরুরি': 'emergency',
      'প্রক্টর': 'proctor', 'শিক্ষার্থী নিরাপত্তা': 'student safety',
      // Health
      'হেলথ': 'healthcare', 'মেডিকেল': 'medical', 'ডাক্তার': 'doctor',
      'হাসপাতাল': 'hospital', 'চিকিৎসা': 'healthcare',
      // Career
      'চাকরি': 'jobs', 'ক্যারিয়ার': 'career', 'ইন্টার্নশিপ': 'internship',
      'সিভি': 'cv', 'ভিত্তি': 'foundation',
      // Clubs
      'ক্লাব': 'clubs', 'কোন ক্লাব': 'which club', 'ক্লাবে যোগ দিন': 'join club',
      'ক্লাব লিস্ট': 'clubs list', 'ইভেন্ট': 'events',
      // Leadership
      'ডাইরেক্টর': 'director', 'পরিচালক': 'director', '�েয়ারম্যান': 'chairman',
      'গভর্নিং বডি': 'governing body',
      // Scholarship
      'বৃত্তি': 'scholarship', 'স্কলারশিপ': 'scholarship', 'ওয়েভার': 'waiver',
      'ছাত্রবৃত্তি': 'scholarship',
      // Programs
      'প্রোগ্রাম': 'programs', 'কোর্স': 'courses', 'পড়ান': 'teach',
      'এমবিএ': 'mba', 'এমএসসি': 'msc',
      // Questions
      'কি': 'what', 'কে': 'who', 'কোথায়': 'where', 'কখন': 'when',
      'কিভাবে': 'how', 'কেন': 'why',
      'বলুন': 'tell me', 'জানান': 'tell me', 'দেখান': 'show me',
      // Calendar
      'অ্যাকাডেমিক': 'academic', 'ছুটি': 'holiday', 'ক্যালেন্ডার': 'calendar',
      'সূচি': 'schedule',
      // International
      'আন্তর্জাতিক': 'international', 'বিদেশ': 'abroad', 'বিদেশে': 'abroad',
      'বাংলাদেশ': 'bangladesh',
    };

    function naiBanglaDetect(q) {
      // Check if query contains Bangla Unicode characters (U+0980-U+09FF)
      return /[\\u0980-\\u09FF]/.test(q);
    }

    function naiBanglaTranslate(q) {
      if (!naiBanglaDetect(q)) return q;
      var result = q;
      // Replace Bangla words with English equivalents
      var keys = Object.keys(NAI_BANGLA_MAP);
      for (var i = 0; i < keys.length; i++) {
        var re = new RegExp(keys[i], 'gi');
        result = result.replace(re, NAI_BANGLA_MAP[keys[i]]);
      }
      return result;
    }

    function naiBanglaPrefix(text) {
      // If the user asked in Bangla, prefix response with Bangla indicator
      return text;
    }
`;

// Insert before naiReformulate
var reformulateMarker = '    /* ---- 4. QUERY REFORMULATION ---- */';
var reIdx = c.indexOf(reformulateMarker);
if (reIdx === -1) { console.log('ERROR: reformulate marker not found'); process.exit(1); }
c = c.substring(0, reIdx) + banglaMapCode + '\n' + c.substring(reIdx);
console.log('Added Bangla translation map');

// 2. Hook into naiReformulate to apply Bangla translation
var reformHook = 'function naiReformulate(query) {\n      var q = query.toLowerCase().trim();';
var banglaHook = 'function naiReformulate(query) {\n      var q = naiBanglaTranslate(query).toLowerCase().trim();';
c = c.replace(reformHook, banglaHook);
console.log('Hooked Bangla translation into reformulate');

// 3. Add Bangla topics to key KB entries
var banglaTopics = [
  { id: 'admission', add: ['ভর্তি', 'ভর্তি পরীক্ষা', 'ভর্তি কিভাবে', 'ভর্তির যোগ্যতা'] },
  { id: 'fees', add: ['খরচ', 'কত টাকা', 'ফি', 'টিউশন ফি'] },
  { id: 'overview', add: ['নাইটার কি', 'নাইটার সম্পর্কে'] },
  { id: 'ragging', add: ['র‍্যাগিং', 'র‍্যাগিং নীতি'] },
  { id: 'location', add: ['কোথায়', 'অবস্থান', 'কিভাবে যাব'] },
  { id: 'hostels', add: ['হোস্টেল', 'ছাত্রাবাস'] },
  { id: 'canteen', add: ['ক্যান্টিন', 'খাবার'] },
  { id: 'wifi', add: ['ওয়াইফাই', 'ইন্টারনেট'] },
  { id: 'labs', add: ['ল্যাব', 'ল্যাবরেটরি'] },
  { id: 'library', add: ['লাইব্রেরি', 'গ্রন্থাগার'] },
  { id: 'transport', add: ['বাস', 'পরিবহন'] },
  { id: 'clubs-list', add: ['ক্লাব', 'কোন ক্লাব'] },
  { id: 'exam-system', add: ['পরীক্ষা', 'সেমেস্টার'] },
  { id: 'mark-distribution', add: ['গ্রেডিং', 'মার্ক', 'সিজিপিএ'] },
  { id: 'exam-office', add: ['পরীক্ষা কন্ট্রোলার'] },
  { id: 'leadership', add: ['ডাইরেক্টর', 'পরিচালক'] },
  { id: 'scholarship', add: ['বৃত্তি', 'স্কলারশিপ', 'ওয়েভার'] },
  { id: 'healthcare', add: ['মেডিকেল', 'ডাক্তার', 'চিকিৎসা'] },
  { id: 'security', add: ['নিরাপত্তা'] },
  { id: 'emergency', add: ['জরুরি'] },
  { id: 'career', add: ['চাকরি', 'ক্যারিয়ার'] },
  { id: 'cse-career', add: ['কম্পিউটার চাকরি'] },
  { id: 'te-career', add: ['টেক্সটাইল চাকরি'] },
];

for (var i = 0; i < banglaTopics.length; i++) {
  var bt = banglaTopics[i];
  // Find the topics array for this entry and add Bangla topics
  var topicRe = new RegExp('(id: "' + bt.id + '", topics: \\[)([^\\]]+)\\]');
  var match = c.match(topicRe);
  if (match) {
    var existing = match[2];
    var newTopics = bt.add.map(function(t) { return '"' + t + '"'; }).join(', ');
    var replacement = match[1] + existing + ', ' + newTopics + ']';
    c = c.replace(match[0], replacement);
    console.log('Added Bangla topics to:', bt.id);
  } else {
    console.log('Entry not found:', bt.id);
  }
}

// 4. Add Bangla Greeting detection in naiChatReply
var chatGreeting = "if (/^(hi|hello|hey|yo|sup|good (?:morning|afternoon|evening)|hey there)\\b/i.test(q)) {";
var banglaGreeting = "if (/^(hi|hello|hey|yo|sup|good (?:morning|afternoon|evening)|hey there|নমস্কার|হ্যালো|হাই|আসসালামু আলাইকুম)\\b/i.test(q)) {";
c = c.replace(chatGreeting, banglaGreeting);
console.log('Added Bangla greetings');

// 5. Add Bangla fallback response
try {
  var fbIdx = c.indexOf("couldn't find a confident answer");
  if (fbIdx !== -1) {
    var before = c.substring(0, fbIdx);
    var after = c.substring(fbIdx);
    after = after.replace("couldn't find a confident answer", "couldn't find a confident answer \u2014 you can ask in Bangla (\u09AC\u09BE\u0982\u09B2\u09BE\u09AF\u09BC) or English. Try: \u201C\u09AD\u09B0\u09CD\u09A4\u09BF \u0995\u09BF\u09AD\u09BE\u09AC\u09C7\u201D, \u201C\u09AB\u09BF \u0995\u09A4\u201D, \u201C\u09B9\u09CB\u09B8\u09CD\u099F\u09C7\u09B2\u201D, \u201C\u09AA\u09B0\u09C0\u0995\u09CD\u09B7\u09BE\u201D");
    c = before + after;
    console.log('Updated fallback with Bangla hint');
  } else {
    console.log('Fallback marker not found');
  }
} catch(e) { console.log('Fallback update error:', e.message); }

writeFileSync('index.html', c, 'utf8');
console.log('Done: Bangla language support added to NITER AI');
